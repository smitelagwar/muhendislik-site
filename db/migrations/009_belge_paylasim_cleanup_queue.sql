-- ============================================================================
-- MIGRATION 009: FENCED CLEANUP RUNS, DURABLE BLOB CURSOR AND RETRY QUEUE
-- Additive and repeatable. This migration does not delete or rewrite live links.
-- ============================================================================

ALTER TABLE belge_paylasim_blob_obligations
  ADD COLUMN IF NOT EXISTS cleanup_lease_owner UUID,
  ADD COLUMN IF NOT EXISTS cleanup_lease_version BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cleanup_lease_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cleanup_requested_at TIMESTAMPTZ;

UPDATE belge_paylasim_blob_obligations
SET next_attempt_at = CASE
  WHEN byte_state = 'unknown' THEN created_at + INTERVAL '24 hours'
  WHEN byte_state = 'deletion_pending' THEN NOW()
  ELSE next_attempt_at
END
WHERE next_attempt_at IS NULL AND byte_state IN ('unknown', 'deletion_pending');

UPDATE belge_paylasim_blob_obligations
SET cleanup_requested_at = COALESCE(cleanup_requested_at, updated_at, created_at)
WHERE cleanup_requested_at IS NULL AND byte_state IN ('unknown', 'deletion_pending');

CREATE INDEX IF NOT EXISTS idx_belge_paylasim_obligation_cleanup_lease
  ON belge_paylasim_blob_obligations(environment_key, byte_state, next_attempt_at, cleanup_lease_until)
  WHERE byte_state IN ('committed', 'deletion_pending', 'unknown');

CREATE TABLE IF NOT EXISTS belge_paylasim_cleanup_state (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  run_owner UUID,
  lease_version BIGINT NOT NULL DEFAULT 0 CHECK (lease_version >= 0),
  lease_until TIMESTAMPTZ,
  blob_cursor TEXT,
  blob_scan_started_at TIMESTAMPTZ,
  last_successful_at TIMESTAMPTZ,
  last_outcome TEXT CHECK (last_outcome IS NULL OR last_outcome IN ('success', 'partial', 'failed')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO belge_paylasim_cleanup_state (singleton)
VALUES (TRUE)
ON CONFLICT (singleton) DO NOTHING;

-- Existing V3 failure/retry/revoke functions do not all set next_attempt_at.
-- The trigger supplies conservative defaults while explicit cleanup backoff wins.
CREATE OR REPLACE FUNCTION belge_paylasim_cleanup_retry_default_v3() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.byte_state IN ('deletion_pending', 'unknown') THEN
    IF OLD.byte_state NOT IN ('deletion_pending', 'unknown') OR NEW.cleanup_requested_at IS NULL THEN
      NEW.cleanup_requested_at := COALESCE(NEW.cleanup_requested_at, NOW());
    END IF;
  ELSIF NEW.byte_state = 'deleted' THEN
    NEW.cleanup_requested_at := NULL;
  END IF;
  IF NEW.byte_state IN ('deletion_pending', 'unknown')
     AND NEW.byte_state IS DISTINCT FROM OLD.byte_state
     AND NEW.next_attempt_at IS NULL THEN
    NEW.next_attempt_at := CASE
      WHEN NEW.byte_state = 'unknown' THEN NOW() + INTERVAL '24 hours'
      ELSE NOW()
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_belge_paylasim_cleanup_retry_default ON belge_paylasim_blob_obligations;
CREATE TRIGGER trg_belge_paylasim_cleanup_retry_default
BEFORE UPDATE OF byte_state ON belge_paylasim_blob_obligations
FOR EACH ROW EXECUTE FUNCTION belge_paylasim_cleanup_retry_default_v3();

CREATE OR REPLACE FUNCTION belge_paylasim_cleanup_acquire_v3(p_owner UUID, p_lease_seconds INTEGER)
RETURNS TABLE (
  acquired BOOLEAN, lease_version BIGINT, lease_until TIMESTAMPTZ,
  blob_cursor TEXT, blob_scan_started_at TIMESTAMPTZ,
  last_successful_at TIMESTAMPTZ, last_outcome TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_state belge_paylasim_cleanup_state%ROWTYPE;
BEGIN
  INSERT INTO belge_paylasim_cleanup_state(singleton) VALUES (TRUE) ON CONFLICT (singleton) DO NOTHING;
  SELECT * INTO v_state FROM belge_paylasim_cleanup_state WHERE singleton = TRUE FOR UPDATE;
  IF v_state.lease_until IS NOT NULL AND v_state.lease_until > NOW() AND v_state.run_owner IS DISTINCT FROM p_owner THEN
    RETURN QUERY SELECT FALSE, v_state.lease_version, v_state.lease_until, v_state.blob_cursor,
      v_state.blob_scan_started_at, v_state.last_successful_at, v_state.last_outcome;
    RETURN;
  END IF;
  IF v_state.run_owner IS DISTINCT FROM p_owner OR v_state.lease_until IS NULL OR v_state.lease_until <= NOW() THEN
    UPDATE belge_paylasim_cleanup_state AS state
    SET run_owner = p_owner, lease_version = state.lease_version + 1,
        lease_until = NOW() + (GREATEST(5, p_lease_seconds) * INTERVAL '1 second'),
        blob_scan_started_at = COALESCE(state.blob_scan_started_at, NOW()), updated_at = NOW()
    WHERE state.singleton = TRUE;
  ELSE
    UPDATE belge_paylasim_cleanup_state
    SET lease_until = NOW() + (GREATEST(5, p_lease_seconds) * INTERVAL '1 second'), updated_at = NOW()
    WHERE singleton = TRUE;
  END IF;
  SELECT * INTO v_state FROM belge_paylasim_cleanup_state WHERE singleton = TRUE;
  RETURN QUERY SELECT TRUE, v_state.lease_version, v_state.lease_until, v_state.blob_cursor,
    v_state.blob_scan_started_at, v_state.last_successful_at, v_state.last_outcome;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_cleanup_checkpoint_v3(
  p_owner UUID, p_version BIGINT, p_cursor TEXT, p_scan_started_at TIMESTAMPTZ, p_lease_seconds INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE belge_paylasim_cleanup_state
  SET blob_cursor = p_cursor, blob_scan_started_at = p_scan_started_at,
      lease_until = NOW() + (GREATEST(5, p_lease_seconds) * INTERVAL '1 second'), updated_at = NOW()
  WHERE singleton = TRUE AND run_owner = p_owner AND lease_version = p_version AND lease_until > NOW();
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_cleanup_finish_v3(p_owner UUID, p_version BIGINT, p_outcome TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_outcome NOT IN ('success', 'partial', 'failed') THEN RETURN FALSE; END IF;
  UPDATE belge_paylasim_cleanup_state
  SET last_outcome = p_outcome,
      last_successful_at = CASE WHEN p_outcome = 'success' THEN NOW() ELSE last_successful_at END,
      blob_cursor = CASE WHEN p_outcome = 'success' THEN NULL ELSE blob_cursor END,
      blob_scan_started_at = CASE WHEN p_outcome = 'success' THEN NULL ELSE blob_scan_started_at END,
      lease_until = NULL, updated_at = NOW()
  WHERE singleton = TRUE AND run_owner = p_owner AND lease_version = p_version AND lease_until > NOW();
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_cleanup_reclaim_pending_v3(
  p_owner UUID, p_version BIGINT, p_older_than TIMESTAMPTZ,
  p_limit INTEGER, p_orphan_grace_seconds INTEGER, p_max_pdf_bytes BIGINT
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_record belge_paylasim_links%ROWTYPE;
  v_obligation belge_paylasim_blob_obligations%ROWTYPE;
  v_reclaimed INTEGER := 0;
  v_bytes BIGINT;
BEGIN
  PERFORM 1 FROM belge_paylasim_cleanup_state
  WHERE singleton = TRUE AND run_owner = p_owner AND lease_version = p_version AND lease_until > NOW()
  FOR UPDATE;
  IF NOT FOUND THEN RETURN 0; END IF;
  PERFORM singleton FROM belge_paylasim_storage_guard WHERE singleton = TRUE FOR UPDATE;
  FOR v_record IN
    SELECT * FROM belge_paylasim_links
    WHERE status = 'pending'
      AND ((lease_until IS NOT NULL AND lease_until <= NOW())
        OR (lease_until IS NULL AND created_at <= p_older_than))
    ORDER BY COALESCE(lease_until, created_at), id
    LIMIT GREATEST(0, p_limit)
    FOR UPDATE SKIP LOCKED
  LOOP
    IF v_record.quota_accounting_status = 'reserved' THEN
      UPDATE belge_paylasim_daily_quotas
      SET reserved_links = GREATEST(0, reserved_links - 1), updated_at = NOW()
      WHERE environment_key = v_record.environment_key AND owner_hash = v_record.owner_hash AND quota_day = v_record.quota_day;
    END IF;
    SELECT * INTO v_obligation FROM belge_paylasim_blob_obligations
    WHERE environment_key = COALESCE(v_record.environment_key, 'legacy') AND blob_pathname = v_record.blob_pathname
    FOR UPDATE;
    IF FOUND AND v_obligation.byte_state <> 'deleted' THEN
      v_bytes := GREATEST(v_obligation.liable_bytes, p_max_pdf_bytes);
      PERFORM belge_paylasim_adjust_daily_bytes_v3(v_obligation.environment_key, v_obligation.owner_hash,
        v_obligation.quota_day, v_obligation.byte_state, v_obligation.liable_bytes, 'unknown', v_bytes);
      UPDATE belge_paylasim_blob_obligations
      SET byte_state = 'unknown', liable_bytes = v_bytes, purge_reason = 'ATTEMPT_LEASE_EXPIRED',
          next_attempt_at = NOW() + (GREATEST(0, p_orphan_grace_seconds) * INTERVAL '1 second'), updated_at = NOW()
      WHERE id = v_obligation.id;
    END IF;
    UPDATE belge_paylasim_links
    SET status = 'failed', quota_accounting_status = CASE WHEN quota_accounting_status = 'reserved' THEN 'released' ELSE quota_accounting_status END,
        last_purge_error_code = 'ATTEMPT_LEASE_EXPIRED', lease_until = NULL, purge_reason = 'ATTEMPT_LEASE_EXPIRED'
    WHERE id = v_record.id;
    v_reclaimed := v_reclaimed + 1;
  END LOOP;
  RETURN v_reclaimed;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_cleanup_register_orphan_v3(
  p_environment TEXT, p_pathname TEXT, p_prefix TEXT, p_size_bytes BIGINT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_obligation belge_paylasim_blob_obligations%ROWTYPE;
  v_path TEXT := p_pathname;
BEGIN
  IF p_environment NOT IN ('local', 'development', 'preview', 'production')
     OR p_size_bytes < 0 OR p_prefix = '' OR left(v_path, length(p_prefix)) <> p_prefix
     OR v_path LIKE '%..%' OR position(chr(92) in v_path) > 0 THEN RETURN FALSE; END IF;
  PERFORM singleton FROM belge_paylasim_storage_guard WHERE singleton = TRUE FOR UPDATE;
  IF EXISTS (
    SELECT 1 FROM belge_paylasim_links l WHERE l.blob_pathname = v_path AND l.environment_key = p_environment
      AND ((l.status = 'ready' AND l.revoked_at IS NULL AND l.expires_at > NOW())
        OR (l.status = 'pending' AND l.lease_until > NOW()))
  ) THEN RETURN FALSE; END IF;
  SELECT * INTO v_obligation FROM belge_paylasim_blob_obligations
  WHERE environment_key = p_environment AND blob_pathname = v_path FOR UPDATE;
  IF FOUND THEN
    IF v_obligation.byte_state <> 'deleted' THEN RETURN FALSE; END IF;
    PERFORM belge_paylasim_adjust_daily_bytes_v3(v_obligation.environment_key, v_obligation.owner_hash,
      v_obligation.quota_day, 'deleted', 0, 'deletion_pending', p_size_bytes);
    UPDATE belge_paylasim_blob_obligations
    SET byte_state = 'deletion_pending', liable_bytes = p_size_bytes, actual_bytes = p_size_bytes,
        purge_reason = 'ORPHAN_RECONCILIATION', next_attempt_at = NOW(), cleanup_requested_at = NOW(), deleted_at = NULL,
        cleanup_lease_owner = NULL, cleanup_lease_until = NULL, updated_at = NOW()
    WHERE id = v_obligation.id;
    RETURN TRUE;
  END IF;
  INSERT INTO belge_paylasim_blob_obligations (
    share_id, attempt_id, environment_key, owner_hash, quota_day, blob_pathname,
    byte_state, liable_bytes, actual_bytes, purge_reason, attempt_count, next_attempt_at, cleanup_requested_at
  ) VALUES (
    NULL, NULL, p_environment, NULL, NULL, v_path, 'deletion_pending', p_size_bytes, p_size_bytes,
    'ORPHAN_RECONCILIATION', 0, NOW(), NOW()
  ) ON CONFLICT (environment_key, blob_pathname) DO NOTHING;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_cleanup_register_orphans_v3(
  p_owner UUID, p_version BIGINT, p_environment TEXT, p_candidates JSONB, p_prefix TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_item RECORD;
  v_obligation belge_paylasim_blob_obligations%ROWTYPE;
  v_path TEXT;
  v_size BIGINT;
  v_registered INTEGER := 0;
BEGIN
  IF jsonb_typeof(p_candidates) <> 'array' OR p_environment NOT IN ('local', 'development', 'preview', 'production') THEN
    RETURN 0;
  END IF;
  PERFORM 1 FROM belge_paylasim_cleanup_state
  WHERE singleton = TRUE AND run_owner = p_owner AND lease_version = p_version AND lease_until > NOW()
  FOR UPDATE;
  IF NOT FOUND THEN RETURN 0; END IF;
  PERFORM singleton FROM belge_paylasim_storage_guard WHERE singleton = TRUE FOR UPDATE;
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_candidates) AS item(pathname TEXT, size_bytes BIGINT)
  LOOP
    v_path := v_item.pathname;
    v_size := v_item.size_bytes;
    IF v_path IS NULL OR v_size IS NULL OR v_size < 0 OR p_prefix = '' OR left(v_path, length(p_prefix)) <> p_prefix
       OR v_path LIKE '%..%' OR position(chr(92) in v_path) > 0 THEN CONTINUE; END IF;
    IF EXISTS (
      SELECT 1 FROM belge_paylasim_links l WHERE l.blob_pathname = v_path AND l.environment_key = p_environment
        AND ((l.status = 'ready' AND l.revoked_at IS NULL AND l.expires_at > NOW())
          OR (l.status = 'pending' AND l.lease_until > NOW()))
    ) THEN CONTINUE; END IF;
    SELECT * INTO v_obligation FROM belge_paylasim_blob_obligations
    WHERE environment_key = p_environment AND blob_pathname = v_path FOR UPDATE;
    IF FOUND THEN
      IF v_obligation.byte_state <> 'deleted' THEN CONTINUE; END IF;
      PERFORM belge_paylasim_adjust_daily_bytes_v3(v_obligation.environment_key, v_obligation.owner_hash,
        v_obligation.quota_day, 'deleted', 0, 'deletion_pending', v_size);
      UPDATE belge_paylasim_blob_obligations
      SET byte_state = 'deletion_pending', liable_bytes = v_size, actual_bytes = v_size,
          purge_reason = 'ORPHAN_RECONCILIATION', next_attempt_at = NOW(), cleanup_requested_at = NOW(), deleted_at = NULL,
          cleanup_lease_owner = NULL, cleanup_lease_until = NULL, updated_at = NOW()
      WHERE id = v_obligation.id;
      v_registered := v_registered + 1;
      CONTINUE;
    END IF;
    INSERT INTO belge_paylasim_blob_obligations (
      share_id, attempt_id, environment_key, owner_hash, quota_day, blob_pathname,
      byte_state, liable_bytes, actual_bytes, purge_reason, attempt_count, next_attempt_at, cleanup_requested_at
    ) VALUES (
      NULL, NULL, p_environment, NULL, NULL, v_path, 'deletion_pending', v_size, v_size,
      'ORPHAN_RECONCILIATION', 0, NOW(), NOW()
    ) ON CONFLICT (environment_key, blob_pathname) DO NOTHING;
    IF FOUND THEN v_registered := v_registered + 1; END IF;
  END LOOP;
  RETURN v_registered;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_cleanup_claim_blobs_v3(
  p_environment TEXT, p_owner UUID, p_run_version BIGINT, p_limit INTEGER, p_lease_seconds INTEGER
) RETURNS SETOF belge_paylasim_blob_obligations
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM 1 FROM belge_paylasim_cleanup_state
  WHERE singleton = TRUE AND run_owner = p_owner AND lease_version = p_run_version AND lease_until > NOW()
  FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;
  RETURN QUERY
  WITH candidates AS (
    SELECT b.id
    FROM belge_paylasim_blob_obligations b
    WHERE b.environment_key = p_environment
      AND b.byte_state IN ('committed', 'deletion_pending', 'unknown')
      AND (b.cleanup_lease_until IS NULL OR b.cleanup_lease_until <= NOW())
      AND COALESCE(b.next_attempt_at, CASE WHEN b.byte_state = 'unknown' THEN b.created_at + INTERVAL '24 hours' ELSE NOW() END) <= NOW()
      AND NOT EXISTS (
        SELECT 1 FROM belge_paylasim_links pending
        WHERE pending.id = b.share_id AND pending.status = 'pending'
          AND pending.blob_pathname = b.blob_pathname AND pending.lease_until > NOW()
      )
      AND (
        b.byte_state IN ('deletion_pending', 'unknown')
        OR EXISTS (
          SELECT 1 FROM belge_paylasim_links l
          WHERE l.id = b.share_id AND (l.status = 'revoked' OR l.revoked_at IS NOT NULL OR l.expires_at <= NOW())
        )
      )
    ORDER BY COALESCE(b.next_attempt_at, b.created_at), b.created_at, b.id
    LIMIT GREATEST(0, p_limit)
    FOR UPDATE OF b SKIP LOCKED
  )
  UPDATE belge_paylasim_blob_obligations b
  SET cleanup_lease_owner = p_owner, cleanup_lease_version = b.cleanup_lease_version + 1,
      cleanup_lease_until = NOW() + (GREATEST(5, p_lease_seconds) * INTERVAL '1 second'), updated_at = NOW()
  FROM candidates c WHERE b.id = c.id
  RETURNING b.*;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_cleanup_complete_blob_v3(
  p_id UUID, p_environment TEXT, p_pathname TEXT, p_owner UUID, p_version BIGINT, p_run_version BIGINT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_obligation belge_paylasim_blob_obligations%ROWTYPE;
BEGIN
  PERFORM 1 FROM belge_paylasim_cleanup_state
  WHERE singleton = TRUE AND run_owner = p_owner AND lease_version = p_run_version AND lease_until > NOW()
  FOR UPDATE;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  PERFORM singleton FROM belge_paylasim_storage_guard WHERE singleton = TRUE FOR UPDATE;
  SELECT * INTO v_obligation FROM belge_paylasim_blob_obligations
  WHERE id = p_id AND environment_key = p_environment AND blob_pathname = p_pathname FOR UPDATE;
  IF NOT FOUND OR v_obligation.cleanup_lease_owner IS DISTINCT FROM p_owner
     OR v_obligation.cleanup_lease_version <> p_version OR v_obligation.cleanup_lease_until <= NOW() THEN RETURN FALSE; END IF;
  PERFORM belge_paylasim_adjust_daily_bytes_v3(v_obligation.environment_key, v_obligation.owner_hash,
    v_obligation.quota_day, v_obligation.byte_state, v_obligation.liable_bytes, 'deleted', 0);
  UPDATE belge_paylasim_blob_obligations
  SET byte_state = 'deleted', liable_bytes = 0, deleted_at = NOW(), next_attempt_at = NULL, cleanup_requested_at = NULL,
      cleanup_lease_owner = NULL, cleanup_lease_until = NULL, updated_at = NOW()
  WHERE id = p_id;
  UPDATE belge_paylasim_links
  SET status = 'purged', purged_at = COALESCE(purged_at, NOW())
  WHERE id = v_obligation.share_id
    AND (status = 'revoked' OR revoked_at IS NOT NULL OR expires_at <= NOW());
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_cleanup_fail_blob_v3(
  p_id UUID, p_owner UUID, p_version BIGINT, p_run_version BIGINT, p_error_code TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_obligation belge_paylasim_blob_obligations%ROWTYPE;
  v_retry_seconds INTEGER;
  v_error_code TEXT := CASE WHEN p_error_code ~ '^[A-Z0-9_]{1,64}$' THEN p_error_code ELSE 'BLOB_DELETE_FAILED' END;
BEGIN
  PERFORM 1 FROM belge_paylasim_cleanup_state
  WHERE singleton = TRUE AND run_owner = p_owner AND lease_version = p_run_version AND lease_until > NOW()
  FOR UPDATE;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  PERFORM singleton FROM belge_paylasim_storage_guard WHERE singleton = TRUE FOR UPDATE;
  SELECT * INTO v_obligation FROM belge_paylasim_blob_obligations WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR v_obligation.cleanup_lease_owner IS DISTINCT FROM p_owner
     OR v_obligation.cleanup_lease_version <> p_version OR v_obligation.cleanup_lease_until <= NOW() THEN RETURN FALSE; END IF;
  v_retry_seconds := LEAST(86400, 60 * (2 ^ LEAST(v_obligation.attempt_count, 10))::INTEGER);
  PERFORM belge_paylasim_adjust_daily_bytes_v3(v_obligation.environment_key, v_obligation.owner_hash,
    v_obligation.quota_day, v_obligation.byte_state, v_obligation.liable_bytes, 'deletion_pending',
    GREATEST(v_obligation.liable_bytes, COALESCE(v_obligation.actual_bytes, 0)));
  UPDATE belge_paylasim_blob_obligations
  SET byte_state = 'deletion_pending', liable_bytes = GREATEST(liable_bytes, COALESCE(actual_bytes, 0)),
      attempt_count = attempt_count + 1, purge_reason = v_error_code,
      next_attempt_at = NOW() + (v_retry_seconds * INTERVAL '1 second'),
      cleanup_lease_owner = NULL, cleanup_lease_until = NULL, updated_at = NOW()
  WHERE id = p_id;
  UPDATE belge_paylasim_links
  SET purge_attempts = purge_attempts + 1, last_purge_error_code = v_error_code
  WHERE id = v_obligation.share_id;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_cleanup_purge_tombstones_v3(
  p_owner UUID, p_version BIGINT, p_older_than TIMESTAMPTZ, p_limit INTEGER
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  PERFORM 1 FROM belge_paylasim_cleanup_state
  WHERE singleton = TRUE AND run_owner = p_owner AND lease_version = p_version AND lease_until > NOW()
  FOR UPDATE;
  IF NOT FOUND THEN RETURN 0; END IF;
  WITH candidates AS (
    SELECT id FROM belge_paylasim_links
    WHERE status = 'purged' AND purged_at <= p_older_than
    ORDER BY purged_at, id
    LIMIT GREATEST(0, p_limit)
    FOR UPDATE SKIP LOCKED
  )
  DELETE FROM belge_paylasim_links l USING candidates c WHERE l.id = c.id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

DROP FUNCTION IF EXISTS belge_paylasim_cleanup_metrics_v3(TEXT);
CREATE FUNCTION belge_paylasim_cleanup_metrics_v3(p_environment TEXT)
RETURNS TABLE (
  pending_delete_count BIGINT, due_delete_count BIGINT, leased_delete_count BIGINT,
  failed_delete_count BIGINT, pending_delete_bytes NUMERIC,
  oldest_pending_delete_at TIMESTAMPTZ, last_successful_at TIMESTAMPTZ,
  last_outcome TEXT, liable_bytes NUMERIC
)
LANGUAGE sql
AS $$
  SELECT
    COUNT(b.id) FILTER (WHERE b.byte_state IN ('deletion_pending', 'unknown') OR
      (b.byte_state = 'committed' AND EXISTS (SELECT 1 FROM belge_paylasim_links l WHERE l.id = b.share_id
        AND (l.status = 'revoked' OR l.revoked_at IS NOT NULL OR l.expires_at <= NOW())))),
    COUNT(b.id) FILTER (WHERE
      (b.byte_state IN ('deletion_pending', 'unknown') OR
        (b.byte_state = 'committed' AND EXISTS (SELECT 1 FROM belge_paylasim_links l WHERE l.id = b.share_id
          AND (l.status = 'revoked' OR l.revoked_at IS NOT NULL OR l.expires_at <= NOW()))))
      AND COALESCE(b.next_attempt_at, CASE WHEN b.byte_state = 'unknown' THEN b.created_at + INTERVAL '24 hours' ELSE NOW() END) <= NOW()
      AND NOT EXISTS (SELECT 1 FROM belge_paylasim_links pending WHERE pending.id = b.share_id
        AND pending.status = 'pending' AND pending.blob_pathname = b.blob_pathname AND pending.lease_until > NOW())),
    COUNT(b.id) FILTER (WHERE
      (b.byte_state IN ('deletion_pending', 'unknown') OR
        (b.byte_state = 'committed' AND EXISTS (SELECT 1 FROM belge_paylasim_links l WHERE l.id = b.share_id
          AND (l.status = 'revoked' OR l.revoked_at IS NOT NULL OR l.expires_at <= NOW()))))
      AND COALESCE(b.next_attempt_at, CASE WHEN b.byte_state = 'unknown' THEN b.created_at + INTERVAL '24 hours' ELSE NOW() END) <= NOW()
      AND b.cleanup_lease_until > NOW()
      AND NOT EXISTS (SELECT 1 FROM belge_paylasim_links pending WHERE pending.id = b.share_id
        AND pending.status = 'pending' AND pending.blob_pathname = b.blob_pathname AND pending.lease_until > NOW())),
    COUNT(b.id) FILTER (WHERE b.byte_state <> 'deleted' AND b.attempt_count > 0),
    COALESCE(SUM(b.liable_bytes) FILTER (WHERE b.byte_state IN ('deletion_pending', 'unknown') OR
      (b.byte_state = 'committed' AND EXISTS (SELECT 1 FROM belge_paylasim_links l WHERE l.id = b.share_id
        AND (l.status = 'revoked' OR l.revoked_at IS NOT NULL OR l.expires_at <= NOW())))), 0),
    MIN(CASE WHEN b.byte_state = 'committed'
        THEN COALESCE(pending_link.revoked_at, pending_link.expires_at, b.created_at)
        ELSE COALESCE(b.cleanup_requested_at, b.updated_at, b.created_at) END)
      FILTER (WHERE b.byte_state IN ('deletion_pending', 'unknown') OR
      (b.byte_state = 'committed' AND EXISTS (SELECT 1 FROM belge_paylasim_links l WHERE l.id = b.share_id
        AND (l.status = 'revoked' OR l.revoked_at IS NOT NULL OR l.expires_at <= NOW())))),
    s.last_successful_at, s.last_outcome,
    COALESCE((SELECT SUM(all_bytes.liable_bytes) FROM belge_paylasim_blob_obligations all_bytes WHERE all_bytes.byte_state <> 'deleted'), 0)
  FROM belge_paylasim_cleanup_state s
  LEFT JOIN belge_paylasim_blob_obligations b ON b.environment_key = p_environment
  LEFT JOIN belge_paylasim_links pending_link ON pending_link.id = b.share_id
  WHERE s.singleton = TRUE
  GROUP BY s.last_successful_at, s.last_outcome;
$$;

INSERT INTO belge_paylasim_schema_version (singleton, schema_version)
VALUES (TRUE, 9)
ON CONFLICT (singleton) DO UPDATE
SET schema_version = GREATEST(belge_paylasim_schema_version.schema_version, EXCLUDED.schema_version),
    updated_at = NOW();
