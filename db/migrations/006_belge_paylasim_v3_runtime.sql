-- ============================================================================
-- MIGRATION 006: BELGE PAYLAŞIM V3 İLERİ UYUMLU KOTA VE BYTE MUHASEBESİ
-- Yalnızca eklemeli ve tekrar çalıştırılabilir. Legacy satır kimlikleri atanmaz.
-- ============================================================================

ALTER TABLE belge_paylasim_links
  ADD COLUMN IF NOT EXISTS owner_hash CHAR(64)
    CHECK (owner_hash IS NULL OR owner_hash ~ '^[0-9a-f]{64}$'),
  ADD COLUMN IF NOT EXISTS owner_version SMALLINT
    CHECK (owner_version IS NULL OR owner_version > 0),
  ADD COLUMN IF NOT EXISTS request_version SMALLINT
    CHECK (request_version IS NULL OR request_version > 0),
  ADD COLUMN IF NOT EXISTS proof_hash CHAR(64)
    CHECK (proof_hash IS NULL OR proof_hash ~ '^[0-9a-f]{64}$'),
  ADD COLUMN IF NOT EXISTS proof_version SMALLINT
    CHECK (proof_version IS NULL OR proof_version > 0),
  ADD COLUMN IF NOT EXISTS token_version SMALLINT
    CHECK (token_version IS NULL OR token_version > 0),
  ADD COLUMN IF NOT EXISTS reservation_nonce BYTEA
    CHECK (reservation_nonce IS NULL OR octet_length(reservation_nonce) = 32),
  ADD COLUMN IF NOT EXISTS environment_key TEXT
    CHECK (environment_key IS NULL OR environment_key IN ('local', 'development', 'preview', 'production')),
  ADD COLUMN IF NOT EXISTS attempt_id UUID,
  ADD COLUMN IF NOT EXISTS attempt_version BIGINT NOT NULL DEFAULT 0
    CHECK (attempt_version >= 0),
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quota_day DATE,
  ADD COLUMN IF NOT EXISTS quota_accounting_status TEXT
    CHECK (quota_accounting_status IS NULL OR quota_accounting_status IN ('reserved', 'used', 'released')),
  ADD COLUMN IF NOT EXISTS purge_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_belge_paylasim_owner_quota
  ON belge_paylasim_links(environment_key, owner_hash, quota_day);

CREATE INDEX IF NOT EXISTS idx_belge_paylasim_attempt_lease
  ON belge_paylasim_links(attempt_id, lease_until)
  WHERE attempt_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_belge_paylasim_quota_accounting
  ON belge_paylasim_links(quota_day, quota_accounting_status)
  WHERE quota_accounting_status IS NOT NULL;

CREATE TABLE IF NOT EXISTS belge_paylasim_daily_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment_key TEXT NOT NULL CHECK (environment_key IN ('local', 'development', 'preview', 'production')),
  owner_hash CHAR(64) NOT NULL CHECK (owner_hash ~ '^[0-9a-f]{64}$'),
  quota_day DATE NOT NULL,
  reserved_links INTEGER NOT NULL DEFAULT 0 CHECK (reserved_links >= 0),
  used_links INTEGER NOT NULL DEFAULT 0 CHECK (used_links >= 0),
  reserved_bytes BIGINT NOT NULL DEFAULT 0 CHECK (reserved_bytes >= 0),
  committed_bytes BIGINT NOT NULL DEFAULT 0 CHECK (committed_bytes >= 0),
  deletion_pending_bytes BIGINT NOT NULL DEFAULT 0 CHECK (deletion_pending_bytes >= 0),
  unknown_upload_bytes BIGINT NOT NULL DEFAULT 0 CHECK (unknown_upload_bytes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_belge_paylasim_daily_quota UNIQUE (environment_key, owner_hash, quota_day)
);

CREATE INDEX IF NOT EXISTS idx_belge_paylasim_daily_quota_day
  ON belge_paylasim_daily_quotas(environment_key, quota_day);

-- Her fiziksel PUT için bir yükümlülük satırı. Share tombstone'u silinse bile
-- silinmesi doğrulanmamış nesnenin byte borcu ve environment sınırı kalır.
CREATE TABLE IF NOT EXISTS belge_paylasim_blob_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NULL REFERENCES belge_paylasim_links(id) ON DELETE SET NULL,
  attempt_id UUID NULL,
  environment_key TEXT NOT NULL CHECK (environment_key IN ('local', 'development', 'preview', 'production')),
  owner_hash CHAR(64) NULL CHECK (owner_hash IS NULL OR owner_hash ~ '^[0-9a-f]{64}$'),
  quota_day DATE NULL,
  blob_pathname TEXT NOT NULL,
  byte_state TEXT NOT NULL CHECK (byte_state IN ('reserved', 'committed', 'deletion_pending', 'unknown', 'deleted')),
  liable_bytes BIGINT NOT NULL DEFAULT 0 CHECK (liable_bytes >= 0),
  actual_bytes BIGINT NULL CHECK (actual_bytes IS NULL OR actual_bytes >= 0),
  purge_reason TEXT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL,
  CONSTRAINT uq_belge_paylasim_blob_environment_path UNIQUE (environment_key, blob_pathname)
);

CREATE INDEX IF NOT EXISTS idx_belge_paylasim_blob_cleanup
  ON belge_paylasim_blob_obligations(environment_key, byte_state, next_attempt_at, created_at)
  WHERE byte_state IN ('deletion_pending', 'unknown');

CREATE INDEX IF NOT EXISTS idx_belge_paylasim_blob_share
  ON belge_paylasim_blob_obligations(share_id)
  WHERE share_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS belge_paylasim_schema_version (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  schema_version INTEGER NOT NULL CHECK (schema_version >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO belge_paylasim_schema_version (singleton, schema_version)
VALUES (TRUE, 6)
ON CONFLICT (singleton) DO UPDATE
SET schema_version = GREATEST(belge_paylasim_schema_version.schema_version, EXCLUDED.schema_version),
    updated_at = NOW();
