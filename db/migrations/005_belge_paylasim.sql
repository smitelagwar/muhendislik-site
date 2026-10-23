-- ============================================================================
-- MIGRATION 005: BELGELER GÜVENLİ SALT-OKUNUR PAYLAŞIM ALTYAPISI
-- ============================================================================

CREATE TABLE IF NOT EXISTS belge_paylasim_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id_hash CHAR(64) NOT NULL UNIQUE,
  payload_digest CHAR(64) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  manage_token_hash CHAR(64) NOT NULL UNIQUE,
  document_id TEXT NOT NULL,
  blob_pathname TEXT NOT NULL UNIQUE,
  size_bytes INTEGER NULL,
  pdf_sha256 CHAR(64) NULL,
  status TEXT NOT NULL,
  creator_ip_hash CHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  purged_at TIMESTAMPTZ NULL,
  purge_attempts INTEGER NOT NULL DEFAULT 0,
  last_purge_error_code TEXT NULL,
  lease_until TIMESTAMPTZ NULL,
  CONSTRAINT chk_belge_paylasim_document_id CHECK (document_id IN (
    'beton-dokum-tutanagi',
    'santiye-sefi-taahhutnamesi',
    'santiye-sefi-istifa-dilekcesi',
    'insaat-ruhsati-dilekcesi',
    'santiye-sefi-sozlesmesi'
  )),
  CONSTRAINT chk_belge_paylasim_status CHECK (status IN (
    'pending', 'ready', 'revoked', 'purged', 'failed'
  ))
);

-- Hızlı token erişimi (alıcı /b/[token] ve yönetim iptal uç noktaları)
CREATE INDEX IF NOT EXISTS idx_belge_paylasim_token_hash ON belge_paylasim_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_belge_paylasim_manage_token_hash ON belge_paylasim_links(manage_token_hash);

-- Idempotency ve tekrar deneme koruması
CREATE INDEX IF NOT EXISTS idx_belge_paylasim_request_id_hash ON belge_paylasim_links(request_id_hash);

-- Temizlik ve retention (cron claim/lease)
CREATE INDEX IF NOT EXISTS idx_belge_paylasim_expiry_status ON belge_paylasim_links(expires_at, status);
CREATE INDEX IF NOT EXISTS idx_belge_paylasim_lease ON belge_paylasim_links(lease_until);

-- IP bazlı kota ve aktif bağlantı sınırlaması
CREATE INDEX IF NOT EXISTS idx_belge_paylasim_creator_ip ON belge_paylasim_links(creator_ip_hash, created_at);
