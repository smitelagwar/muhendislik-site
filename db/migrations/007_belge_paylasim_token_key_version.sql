-- ==========================================================================
-- MIGRATION 007: V3 deterministic replay uses persisted token key version.
-- Additive and repeatable; no existing token hashes are rewritten.
-- ==========================================================================

ALTER TABLE belge_paylasim_links
  ADD COLUMN IF NOT EXISTS token_key_version SMALLINT
    CHECK (token_key_version IS NULL OR token_key_version > 0);

INSERT INTO belge_paylasim_schema_version (singleton, schema_version)
VALUES (TRUE, 7)
ON CONFLICT (singleton) DO UPDATE
SET schema_version = GREATEST(belge_paylasim_schema_version.schema_version, EXCLUDED.schema_version),
    updated_at = NOW();
