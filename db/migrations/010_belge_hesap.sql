-- Belgeler hesaplari: mevcut dokumantasyon / paylasim tablolari degismez.
-- Apply only during the final, reviewed release stage.
CREATE TABLE IF NOT EXISTS belge_account_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment_key TEXT NOT NULL,
  username_ci VARCHAR(32) NOT NULL,
  username_display VARCHAR(32) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  profile_enc TEXT,
  profile_version INT NOT NULL DEFAULT 0 CHECK (profile_version >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(environment_key, username_ci)
);
CREATE TABLE IF NOT EXISTS belge_account_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment_key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES belge_account_users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_belge_account_sessions_user
  ON belge_account_sessions(environment_key, user_id);
CREATE INDEX IF NOT EXISTS idx_belge_account_sessions_expires
  ON belge_account_sessions(expires_at);
CREATE TABLE IF NOT EXISTS belge_account_rate_limits (
  environment_key TEXT NOT NULL,
  key_hash CHAR(64) NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hits INT NOT NULL DEFAULT 0,
  PRIMARY KEY(environment_key, key_hash)
);
CREATE INDEX IF NOT EXISTS idx_belge_account_rate_time
  ON belge_account_rate_limits(window_start);
