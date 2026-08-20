// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — VERİTABANI BAĞLANTISI (NEON / VERCEL POSTGRES)
// ============================================================================

import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { getDatabaseUrl } from "./runtime-mode";
export { getDatabaseUrl };

let cachedSql: NeonQueryFunction<false, false> | null = null;
let schemaEnsured: boolean = false;

export const LATEST_REQUIRED_SCHEMA_VERSION = "004";

export async function getLatestSchemaVersion(sql: NeonQueryFunction<false, false>): Promise<string> {
  try {
    const rows = await sql`
      SELECT version FROM dok_schema_migrations ORDER BY version DESC LIMIT 1;
    `;
    return (rows[0]?.version as string) || "none";
  } catch {
    return "none";
  }
}

export async function ensureDatabaseTables(sql: NeonQueryFunction<false, false>): Promise<void> {
  if (schemaEnsured) return;

  try {
    // 1. Migration 001: Temel Tablolar
    await sql`
      CREATE TABLE IF NOT EXISTS dok_schema_migrations (
        version VARCHAR(64) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS dok_folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        parent_id UUID NULL REFERENCES dok_folders(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_dok_folders_parent_id ON dok_folders(parent_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dok_folders_deleted_at ON dok_folders(deleted_at);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dok_folders_name ON dok_folders(name);`;

    await sql`
      CREATE TABLE IF NOT EXISTS dok_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        folder_id UUID NULL REFERENCES dok_folders(id) ON DELETE RESTRICT,
        display_name VARCHAR(255) NOT NULL,
        blob_pathname VARCHAR(1024) NOT NULL,
        blob_url VARCHAR(2048) NOT NULL,
        size_bytes BIGINT NOT NULL,
        mime_type VARCHAR(255) NOT NULL,
        extension VARCHAR(32) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_dok_files_folder_id ON dok_files(folder_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dok_files_deleted_at ON dok_files(deleted_at);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dok_files_display_name ON dok_files(display_name);`;

    await sql`
      CREATE TABLE IF NOT EXISTS dok_share_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        title VARCHAR(255) NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        password_hash VARCHAR(255) NULL,
        max_downloads INT NULL,
        download_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMPTZ NULL,
        last_accessed_at TIMESTAMPTZ NULL,
        url_token_encrypted TEXT NULL
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_dok_share_links_token_hash ON dok_share_links(token_hash);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dok_share_links_expires_at ON dok_share_links(expires_at);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dok_share_links_revoked_at ON dok_share_links(revoked_at);`;

    await sql`
      CREATE TABLE IF NOT EXISTS dok_share_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        share_link_id UUID NOT NULL REFERENCES dok_share_links(id) ON DELETE CASCADE,
        file_id UUID NOT NULL REFERENCES dok_files(id) ON DELETE RESTRICT,
        snapshot_name VARCHAR(255) NOT NULL,
        relative_path VARCHAR(1024) NOT NULL DEFAULT '',
        snapshot_size_bytes BIGINT NOT NULL,
        snapshot_mime_type VARCHAR(255) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        CONSTRAINT uq_dok_share_items_link_file UNIQUE (share_link_id, file_id)
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_dok_share_items_link_id ON dok_share_items(share_link_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dok_share_items_file_id ON dok_share_items(file_id);`;

    await sql`
      CREATE TABLE IF NOT EXISTS dok_auth_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scope VARCHAR(64) NOT NULL,
        subject_hash VARCHAR(128) NOT NULL,
        success BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_dok_auth_attempts_lookup ON dok_auth_attempts(scope, subject_hash, created_at);`;

    // 2. Migration 002: Yükleme Bütünlüğü ve İdempotency
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_dok_files_blob_pathname ON dok_files(blob_pathname);`;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_dok_files_name_per_folder
      ON dok_files(COALESCE(folder_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(display_name))
      WHERE deleted_at IS NULL;
    `;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_dok_folders_name_per_parent
      ON dok_folders(COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name))
      WHERE deleted_at IS NULL;
    `;

    await sql`ALTER TABLE dok_files ADD COLUMN IF NOT EXISTS purge_status VARCHAR(32) DEFAULT 'none';`;
    await sql`ALTER TABLE dok_files ADD COLUMN IF NOT EXISTS purge_last_error TEXT NULL;`;

    await sql`ALTER TABLE dok_folders ADD COLUMN IF NOT EXISTS purge_status VARCHAR(32) DEFAULT 'none';`;
    await sql`ALTER TABLE dok_folders ADD COLUMN IF NOT EXISTS purge_last_error TEXT NULL;`;

    await sql`
      CREATE TABLE IF NOT EXISTS dok_upload_intents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pathname VARCHAR(1024) UNIQUE NOT NULL,
        expected_filename VARCHAR(255) NOT NULL,
        expected_size_bytes BIGINT NOT NULL,
        folder_id UUID NULL,
        username VARCHAR(128) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'issued',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        finalized_at TIMESTAMPTZ NULL,
        file_id UUID NULL,
        last_error_code VARCHAR(64) NULL
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_dok_upload_intents_status ON dok_upload_intents(status);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dok_upload_intents_expires ON dok_upload_intents(expires_at);`;

    // 3. Migration 003: Versiyonlama ve Snapshot Bütünlüğü
    await sql`
      CREATE TABLE IF NOT EXISTS dok_file_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_id UUID NOT NULL REFERENCES dok_files(id) ON DELETE CASCADE,
        version_number INT NOT NULL,
        blob_pathname VARCHAR(1024) NOT NULL,
        blob_url VARCHAR(2048) NOT NULL,
        size_bytes BIGINT NOT NULL,
        mime_type VARCHAR(255) NOT NULL,
        sha256_hash VARCHAR(64) NULL,
        comment VARCHAR(512) NULL,
        created_by VARCHAR(128) NOT NULL DEFAULT 'admin',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_dok_file_versions_number UNIQUE (file_id, version_number)
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_dok_file_versions_file_id ON dok_file_versions(file_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dok_file_versions_created_at ON dok_file_versions(created_at);`;

    await sql`ALTER TABLE dok_files ADD COLUMN IF NOT EXISTS current_version_number INT NOT NULL DEFAULT 1;`;
    await sql`ALTER TABLE dok_share_items ADD COLUMN IF NOT EXISTS file_version_id UUID NULL REFERENCES dok_file_versions(id) ON DELETE SET NULL;`;

    // 4. Migration 004: APS DWG derivative durumlari
    await sql`
      CREATE TABLE IF NOT EXISTS dok_cad_derivatives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_id UUID NOT NULL REFERENCES dok_files(id) ON DELETE CASCADE,
        source_version_key VARCHAR(1200) NOT NULL,
        source_sha256 VARCHAR(64) NULL,
        aps_urn TEXT NULL,
        aps_object_key VARCHAR(1024) NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        error_code VARCHAR(96) NULL,
        error_message TEXT NULL,
        lock_expires_at TIMESTAMPTZ NULL,
        started_at TIMESTAMPTZ NULL,
        completed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_dok_cad_derivatives_source UNIQUE (file_id, source_version_key),
        CONSTRAINT ck_dok_cad_derivatives_status CHECK (status IN ('pending', 'uploading', 'translating', 'ready', 'failed'))
      );
    `;
    await sql`ALTER TABLE dok_cad_derivatives ADD COLUMN IF NOT EXISTS lock_expires_at TIMESTAMPTZ NULL;`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dok_cad_derivatives_file_id ON dok_cad_derivatives(file_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_dok_cad_derivatives_hash_ready ON dok_cad_derivatives(source_sha256) WHERE status = 'ready';`;

    // Sürümleri kaydet
    await sql`
      INSERT INTO dok_schema_migrations (version, applied_at)
      VALUES ('001', NOW()), ('002', NOW()), ('003', NOW()), ('004', NOW())
      ON CONFLICT (version) DO NOTHING;
    `;

    schemaEnsured = true;
  } catch (err) {
    console.warn("Otomatik veritabanı şema doğrulama uyarısı:", err);
  }
}

export function getDb(): NeonQueryFunction<false, false> {
  if (cachedSql) {
    return cachedSql;
  }

  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL veya POSTGRES_URL ortam değişkeni tanımlı değil. Lütfen Postgres bağlantısını kontrol edin."
    );
  }

  cachedSql = neon(databaseUrl);
  return cachedSql;
}
