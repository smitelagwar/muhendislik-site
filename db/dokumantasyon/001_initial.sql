-- ============================================================================
-- DÖKÜMANTASYON MODÜLÜ — VERİTABANI ŞEMASI MİGRASYONU 001
-- Motor: PostgreSQL / Neon Postgres
-- Tarih: 19.08.2026
-- ============================================================================

-- 0. Migrasyon Takip Tablosu
CREATE TABLE IF NOT EXISTS dok_schema_migrations (
    version VARCHAR(64) PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1. Klasörler Tablosu (dok_folders)
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

-- 2. Dosyalar Tablosu (dok_files)
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

-- 3. Paylaşım Bağlantıları Tablosu (dok_share_links)
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

-- 4. Paylaşılan Öğeler Snapshot Tablosu (dok_share_items)
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

-- 5. Kimlik Doğrulama / Rate Limit Deneme Tablosu (dok_auth_attempts)
CREATE TABLE IF NOT EXISTS dok_auth_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope VARCHAR(64) NOT NULL,
    subject_hash VARCHAR(128) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dok_auth_attempts_lookup ON dok_auth_attempts(scope, subject_hash, created_at);
