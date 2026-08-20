-- APS DWG kaynak/derivative iliskisi; kaynak Blob URL'si bu tabloda tutulmaz.
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

CREATE INDEX IF NOT EXISTS idx_dok_cad_derivatives_file_id ON dok_cad_derivatives(file_id);
CREATE INDEX IF NOT EXISTS idx_dok_cad_derivatives_hash_ready ON dok_cad_derivatives(source_sha256) WHERE status = 'ready';
