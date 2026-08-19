// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — VERİTABANI BAĞLANTISI (NEON / VERCEL POSTGRES)
// ============================================================================

import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let cachedSql: NeonQueryFunction<false, false> | null = null;
let schemaEnsured: boolean = false;

export function getDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    process.env.STORAGE_POSTGRES_URL ||
    process.env.VERCEL_POSTGRES_URL
  );
}

export async function ensureDatabaseTables(sql: NeonQueryFunction<false, false>): Promise<void> {
  if (schemaEnsured) return;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS dok_schema_migrations (
        version VARCHAR(64) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS dok_folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        parent_id UUID NULL REFERENCES dok_folders(id) ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ NULL
      );

      CREATE INDEX IF NOT EXISTS idx_dok_folders_parent_id ON dok_folders(parent_id);
      CREATE INDEX IF NOT EXISTS idx_dok_folders_deleted_at ON dok_folders(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_dok_folders_name ON dok_folders(name);

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

      CREATE INDEX IF NOT EXISTS idx_dok_files_folder_id ON dok_files(folder_id);
      CREATE INDEX IF NOT EXISTS idx_dok_files_deleted_at ON dok_files(deleted_at);
      CREATE INDEX IF NOT EXISTS idx_dok_files_display_name ON dok_files(display_name);

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

      CREATE INDEX IF NOT EXISTS idx_dok_share_links_token_hash ON dok_share_links(token_hash);
      CREATE INDEX IF NOT EXISTS idx_dok_share_links_expires_at ON dok_share_links(expires_at);
      CREATE INDEX IF NOT EXISTS idx_dok_share_links_revoked_at ON dok_share_links(revoked_at);

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

      CREATE INDEX IF NOT EXISTS idx_dok_share_items_link_id ON dok_share_items(share_link_id);
      CREATE INDEX IF NOT EXISTS idx_dok_share_items_file_id ON dok_share_items(file_id);

      CREATE TABLE IF NOT EXISTS dok_auth_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scope VARCHAR(64) NOT NULL,
        subject_hash VARCHAR(128) NOT NULL,
        success BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_dok_auth_attempts_lookup ON dok_auth_attempts(scope, subject_hash, created_at);
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
