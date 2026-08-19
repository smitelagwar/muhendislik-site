-- ============================================================================
-- DÖKÜMANTASYON MODÜLÜ — MIGRATION 002: YÜKLEME BÜTÜNLÜĞÜ VE İDEMPOTENCY
-- ============================================================================

-- 1. Dosya Yolu Benzersizliği (Idempotent Insert Desteği)
CREATE UNIQUE INDEX IF NOT EXISTS uq_dok_files_blob_pathname ON dok_files(blob_pathname);

-- 2. Aynı Klasörde Aktif Dosya Adı Çakışma Önleme İndeksi
CREATE UNIQUE INDEX IF NOT EXISTS uq_dok_files_name_per_folder
ON dok_files(COALESCE(folder_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(display_name))
WHERE deleted_at IS NULL;

-- 3. Aynı Üst Klasörde Aktif Klasör Adı Çakışma Önleme İndeksi
CREATE UNIQUE INDEX IF NOT EXISTS uq_dok_folders_name_per_parent
ON dok_folders(COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name))
WHERE deleted_at IS NULL;

-- 4. Kalıcı Silme / Purge Durum Takibi
ALTER TABLE dok_files ADD COLUMN IF NOT EXISTS purge_status VARCHAR(32) DEFAULT 'none';
ALTER TABLE dok_files ADD COLUMN IF NOT EXISTS purge_last_error TEXT NULL;

ALTER TABLE dok_folders ADD COLUMN IF NOT EXISTS purge_status VARCHAR(32) DEFAULT 'none';
ALTER TABLE dok_folders ADD COLUMN IF NOT EXISTS purge_last_error TEXT NULL;

-- 5. Upload Intent Yaşam Döngüsü Tablosu
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

CREATE INDEX IF NOT EXISTS idx_dok_upload_intents_status ON dok_upload_intents(status);
CREATE INDEX IF NOT EXISTS idx_dok_upload_intents_expires ON dok_upload_intents(expires_at);
