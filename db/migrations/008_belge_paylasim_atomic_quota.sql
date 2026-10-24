-- ============================================================================
-- MIGRATION 008: ATOMIC DAILY QUOTA AND PHYSICAL BLOB BYTE ACCOUNTING
-- Additive, repeatable, and safe to run before the next application version.
-- ============================================================================

-- Unknown legacy environments must continue to consume storage capacity until
-- a release operator reconciles the physical Blob store.
ALTER TABLE belge_paylasim_blob_obligations
  DROP CONSTRAINT IF EXISTS belge_paylasim_blob_obligations_environment_key_check;
ALTER TABLE belge_paylasim_blob_obligations
  ADD CONSTRAINT belge_paylasim_blob_obligations_environment_key_check
  CHECK (environment_key IN ('local', 'development', 'preview', 'production', 'legacy'));

-- Serializes short global-capacity mutations across instances. This row lock is
-- released when the SQL function returns and is never held during PDF render/PUT.
CREATE TABLE IF NOT EXISTS belge_paylasim_storage_guard (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO belge_paylasim_storage_guard (singleton) VALUES (TRUE) ON CONFLICT (singleton) DO NOTHING;

-- Carry forward successful V3 links and in-flight attempts created before the
-- atomic ledger was deployed. Failures stay released; successful history never
-- depends on the lifetime of the link row.
WITH changed AS (
  UPDATE belge_paylasim_links AS l
  SET quota_day = CASE
        WHEN l.status IN ('ready', 'revoked', 'purged') AND l.ready_at IS NOT NULL
          THEN (l.ready_at AT TIME ZONE 'Europe/Istanbul')::date
        ELSE (l.created_at AT TIME ZONE 'Europe/Istanbul')::date
      END,
      quota_accounting_status = CASE
        WHEN l.status IN ('ready', 'revoked', 'purged') AND l.ready_at IS NOT NULL THEN 'used'
        WHEN l.status = 'pending' THEN 'reserved'
        ELSE 'released'
      END
  WHERE l.owner_hash IS NOT NULL
    AND l.environment_key IN ('local', 'development', 'preview', 'production')
    AND l.quota_accounting_status IS NULL
  RETURNING environment_key, owner_hash, quota_day, quota_accounting_status
)
INSERT INTO belge_paylasim_daily_quotas (
  environment_key, owner_hash, quota_day, used_links, reserved_links
)
SELECT environment_key, owner_hash, quota_day,
       COUNT(*) FILTER (WHERE quota_accounting_status = 'used')::integer,
       COUNT(*) FILTER (WHERE quota_accounting_status = 'reserved')::integer
FROM changed
WHERE quota_accounting_status IN ('used', 'reserved')
GROUP BY environment_key, owner_hash, quota_day
ON CONFLICT ON CONSTRAINT uq_belge_paylasim_daily_quota DO UPDATE
SET used_links = belge_paylasim_daily_quotas.used_links + EXCLUDED.used_links,
    reserved_links = belge_paylasim_daily_quotas.reserved_links + EXCLUDED.reserved_links,
    updated_at = NOW();

-- Backfill a conservative physical obligation for every old path. Failed and
-- pending uploads may have reached Blob before the old writer failed, so they
-- reserve the maximum PDF size until deletion/reconciliation proves otherwise.
WITH inserted_obligations AS (
INSERT INTO belge_paylasim_blob_obligations (
  share_id, attempt_id, environment_key, owner_hash, quota_day, blob_pathname,
  byte_state, liable_bytes, actual_bytes, purge_reason, deleted_at
)
SELECT l.id, l.attempt_id, COALESCE(l.environment_key, 'legacy'), l.owner_hash,
       l.quota_day, l.blob_pathname,
       CASE
         WHEN l.status = 'purged' THEN 'deleted'
         WHEN l.status = 'ready' THEN 'committed'
         WHEN l.status = 'revoked' THEN 'deletion_pending'
         ELSE 'unknown'
       END,
       CASE
         WHEN l.status = 'purged' THEN 0
         WHEN l.status = 'ready' THEN COALESCE(l.size_bytes, 3145728)::bigint
         WHEN l.status = 'revoked' THEN COALESCE(l.size_bytes, 3145728)::bigint
         ELSE 3145728
       END,
       l.size_bytes,
       CASE WHEN l.status = 'purged' THEN 'LEGACY_ALREADY_PURGED' ELSE 'LEGACY_RECONCILIATION_REQUIRED' END,
       CASE WHEN l.status = 'purged' THEN COALESCE(l.purged_at, NOW()) ELSE NULL END
FROM belge_paylasim_links AS l
WHERE NOT EXISTS (
  SELECT 1 FROM belge_paylasim_blob_obligations AS b
  WHERE b.blob_pathname = l.blob_pathname
    AND b.environment_key = COALESCE(l.environment_key, 'legacy')
)
ON CONFLICT (environment_key, blob_pathname) DO NOTHING
RETURNING environment_key, owner_hash, quota_day, byte_state, liable_bytes
)
INSERT INTO belge_paylasim_daily_quotas (
  environment_key, owner_hash, quota_day, reserved_bytes, committed_bytes,
  deletion_pending_bytes, unknown_upload_bytes
)
SELECT environment_key, owner_hash, quota_day,
       COALESCE(SUM(liable_bytes) FILTER (WHERE byte_state = 'reserved'), 0)::bigint,
       COALESCE(SUM(liable_bytes) FILTER (WHERE byte_state = 'committed'), 0)::bigint,
       COALESCE(SUM(liable_bytes) FILTER (WHERE byte_state = 'deletion_pending'), 0)::bigint,
       COALESCE(SUM(liable_bytes) FILTER (WHERE byte_state = 'unknown'), 0)::bigint
FROM inserted_obligations
WHERE owner_hash IS NOT NULL AND quota_day IS NOT NULL
  AND environment_key IN ('local', 'development', 'preview', 'production')
GROUP BY environment_key, owner_hash, quota_day
ON CONFLICT ON CONSTRAINT uq_belge_paylasim_daily_quota DO UPDATE
SET reserved_bytes = belge_paylasim_daily_quotas.reserved_bytes + EXCLUDED.reserved_bytes,
    committed_bytes = belge_paylasim_daily_quotas.committed_bytes + EXCLUDED.committed_bytes,
    deletion_pending_bytes = belge_paylasim_daily_quotas.deletion_pending_bytes + EXCLUDED.deletion_pending_bytes,
    unknown_upload_bytes = belge_paylasim_daily_quotas.unknown_upload_bytes + EXCLUDED.unknown_upload_bytes,
    updated_at = NOW();

CREATE OR REPLACE FUNCTION belge_paylasim_adjust_daily_bytes_v3(
  p_environment_key text,
  p_owner_hash char(64),
  p_quota_day date,
  p_old_state text,
  p_old_bytes bigint,
  p_new_state text,
  p_new_bytes bigint
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_reserved_delta bigint := 0;
  v_committed_delta bigint := 0;
  v_deletion_delta bigint := 0;
  v_unknown_delta bigint := 0;
BEGIN
  IF p_owner_hash IS NULL OR p_quota_day IS NULL
     OR p_environment_key NOT IN ('local', 'development', 'preview', 'production') THEN
    RETURN;
  END IF;

  IF p_old_state = 'reserved' THEN v_reserved_delta := v_reserved_delta - COALESCE(p_old_bytes, 0); END IF;
  IF p_old_state = 'committed' THEN v_committed_delta := v_committed_delta - COALESCE(p_old_bytes, 0); END IF;
  IF p_old_state = 'deletion_pending' THEN v_deletion_delta := v_deletion_delta - COALESCE(p_old_bytes, 0); END IF;
  IF p_old_state = 'unknown' THEN v_unknown_delta := v_unknown_delta - COALESCE(p_old_bytes, 0); END IF;
  IF p_new_state = 'reserved' THEN v_reserved_delta := v_reserved_delta + COALESCE(p_new_bytes, 0); END IF;
  IF p_new_state = 'committed' THEN v_committed_delta := v_committed_delta + COALESCE(p_new_bytes, 0); END IF;
  IF p_new_state = 'deletion_pending' THEN v_deletion_delta := v_deletion_delta + COALESCE(p_new_bytes, 0); END IF;
  IF p_new_state = 'unknown' THEN v_unknown_delta := v_unknown_delta + COALESCE(p_new_bytes, 0); END IF;

  INSERT INTO belge_paylasim_daily_quotas (environment_key, owner_hash, quota_day)
  VALUES (p_environment_key, p_owner_hash, p_quota_day)
  ON CONFLICT ON CONSTRAINT uq_belge_paylasim_daily_quota DO NOTHING;

  UPDATE belge_paylasim_daily_quotas
  SET reserved_bytes = GREATEST(0, reserved_bytes + v_reserved_delta),
      committed_bytes = GREATEST(0, committed_bytes + v_committed_delta),
      deletion_pending_bytes = GREATEST(0, deletion_pending_bytes + v_deletion_delta),
      unknown_upload_bytes = GREATEST(0, unknown_upload_bytes + v_unknown_delta),
      updated_at = NOW()
  WHERE environment_key = p_environment_key AND owner_hash = p_owner_hash AND quota_day = p_quota_day;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_reserve_v3(
  p_request_id_hash char(64), p_payload_digest char(64), p_token_hash char(64),
  p_manage_token_hash char(64), p_document_id text, p_blob_pathname text,
  p_creator_ip_hash char(64), p_expires_at timestamptz, p_owner_hash char(64),
  p_owner_version smallint, p_request_version smallint, p_proof_hash char(64),
  p_proof_version smallint, p_token_version smallint, p_token_key_version smallint,
  p_reservation_nonce bytea, p_environment_key text, p_attempt_id uuid,
  p_max_pdf_bytes bigint, p_daily_limit integer, p_global_daily_limit integer,
  p_global_max_storage_bytes bigint
) RETURNS TABLE (
  outcome text, record_json jsonb, used_links integer, reserved_links integer,
  quota_day date, server_now timestamptz, reset_at timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing belge_paylasim_links%ROWTYPE;
  v_record belge_paylasim_links%ROWTYPE;
  v_day date := (NOW() AT TIME ZONE 'Europe/Istanbul')::date;
  v_reset timestamptz := (((NOW() AT TIME ZONE 'Europe/Istanbul')::date + 1)::timestamp AT TIME ZONE 'Europe/Istanbul');
  v_used integer := 0;
  v_reserved integer := 0;
  v_global_daily bigint := 0;
  v_liable_bytes bigint := 0;
BEGIN
  PERFORM singleton FROM belge_paylasim_storage_guard WHERE singleton = TRUE FOR UPDATE;
  SELECT * INTO v_existing FROM belge_paylasim_links WHERE request_id_hash = p_request_id_hash FOR UPDATE;
  IF FOUND THEN
    SELECT COALESCE(q.used_links, 0), COALESCE(q.reserved_links, 0)
      INTO v_used, v_reserved
    FROM (SELECT 1) AS seed
    LEFT JOIN belge_paylasim_daily_quotas q
      ON q.environment_key = p_environment_key AND q.owner_hash = p_owner_hash AND q.quota_day = v_day;
    RETURN QUERY SELECT 'existing'::text, to_jsonb(v_existing), v_used, v_reserved, v_day, NOW(), v_reset;
    RETURN;
  END IF;
  INSERT INTO belge_paylasim_daily_quotas (environment_key, owner_hash, quota_day)
  VALUES (p_environment_key, p_owner_hash, v_day)
  ON CONFLICT ON CONSTRAINT uq_belge_paylasim_daily_quota DO NOTHING;
  SELECT q.used_links, q.reserved_links INTO v_used, v_reserved
  FROM belge_paylasim_daily_quotas q
  WHERE q.environment_key = p_environment_key AND q.owner_hash = p_owner_hash AND q.quota_day = v_day
  FOR UPDATE;

  IF v_used >= p_daily_limit THEN
    RETURN QUERY SELECT 'DAILY_BROWSER_QUOTA_EXCEEDED'::text, NULL::jsonb, v_used, v_reserved, v_day, NOW(), v_reset;
    RETURN;
  END IF;
  IF v_used + v_reserved >= p_daily_limit THEN
    RETURN QUERY SELECT 'BROWSER_QUOTA_RESERVED'::text, NULL::jsonb, v_used, v_reserved, v_day, NOW(), v_reset;
    RETURN;
  END IF;

  SELECT COALESCE(SUM(q.used_links + q.reserved_links), 0) INTO v_global_daily
  FROM belge_paylasim_daily_quotas q
  WHERE q.environment_key = p_environment_key AND q.quota_day = v_day;
  IF v_global_daily >= p_global_daily_limit THEN
    RETURN QUERY SELECT 'GLOBAL_DAILY_CAPACITY_REACHED'::text, NULL::jsonb, v_used, v_reserved, v_day, NOW(), v_reset;
    RETURN;
  END IF;

  SELECT COALESCE(SUM(b.liable_bytes), 0) INTO v_liable_bytes
  FROM belge_paylasim_blob_obligations b
  WHERE b.byte_state <> 'deleted';
  IF v_liable_bytes + p_max_pdf_bytes > p_global_max_storage_bytes THEN
    RETURN QUERY SELECT 'STORAGE_CAPACITY_UNAVAILABLE'::text, NULL::jsonb, v_used, v_reserved, v_day, NOW(), v_reset;
    RETURN;
  END IF;

  INSERT INTO belge_paylasim_links (
    request_id_hash, payload_digest, token_hash, manage_token_hash, document_id,
    blob_pathname, status, creator_ip_hash, expires_at, owner_hash, owner_version,
    request_version, proof_hash, proof_version, token_version, token_key_version,
    reservation_nonce, environment_key, attempt_id, attempt_version, lease_until,
    quota_day, quota_accounting_status
  ) VALUES (
    p_request_id_hash, p_payload_digest, p_token_hash, p_manage_token_hash, p_document_id,
    p_blob_pathname, 'pending', p_creator_ip_hash, p_expires_at, p_owner_hash, p_owner_version,
    p_request_version, p_proof_hash, p_proof_version, p_token_version, p_token_key_version,
    p_reservation_nonce, p_environment_key, p_attempt_id, 1,
    NOW() + (120 * INTERVAL '1 second'), v_day, 'reserved'
  ) RETURNING * INTO v_record;

  INSERT INTO belge_paylasim_blob_obligations (
    share_id, attempt_id, environment_key, owner_hash, quota_day, blob_pathname,
    byte_state, liable_bytes
  ) VALUES (
    v_record.id, p_attempt_id, p_environment_key, p_owner_hash, v_day, p_blob_pathname,
    'reserved', p_max_pdf_bytes
  );
  UPDATE belge_paylasim_daily_quotas AS quota
  SET reserved_links = quota.reserved_links + 1,
      reserved_bytes = reserved_bytes + p_max_pdf_bytes,
      updated_at = NOW()
  WHERE quota.environment_key = p_environment_key AND quota.owner_hash = p_owner_hash AND quota.quota_day = v_day
  RETURNING quota.used_links, quota.reserved_links INTO v_used, v_reserved;

  RETURN QUERY SELECT 'created'::text, to_jsonb(v_record), v_used, v_reserved, v_day, NOW(), v_reset;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_retry_v3(
  p_id uuid, p_attempt_id uuid, p_blob_pathname text, p_max_pdf_bytes bigint,
  p_daily_limit integer, p_global_daily_limit integer, p_global_max_storage_bytes bigint
) RETURNS TABLE (
  outcome text, record_json jsonb, used_links integer, reserved_links integer,
  quota_day date, server_now timestamptz, reset_at timestamptz
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_record belge_paylasim_links%ROWTYPE;
  v_env text;
  v_owner char(64);
  v_day date := (NOW() AT TIME ZONE 'Europe/Istanbul')::date;
  v_reset timestamptz := (((NOW() AT TIME ZONE 'Europe/Istanbul')::date + 1)::timestamp AT TIME ZONE 'Europe/Istanbul');
  v_used integer := 0;
  v_reserved integer := 0;
  v_global_daily bigint := 0;
  v_liable_bytes bigint := 0;
  v_old belge_paylasim_blob_obligations%ROWTYPE;
BEGIN
  PERFORM singleton FROM belge_paylasim_storage_guard WHERE singleton = TRUE FOR UPDATE;
  SELECT environment_key, owner_hash INTO v_env, v_owner FROM belge_paylasim_links WHERE id = p_id;
  IF NOT FOUND OR v_env IS NULL OR v_owner IS NULL THEN
    RETURN QUERY SELECT 'not_available'::text, NULL::jsonb, 0, 0, v_day, NOW(), v_reset;
    RETURN;
  END IF;
  SELECT * INTO v_record FROM belge_paylasim_links WHERE id = p_id FOR UPDATE;
  IF v_record.revoked_at IS NOT NULL OR v_record.expires_at <= NOW()
     OR NOT (v_record.status = 'failed' OR (v_record.status = 'pending' AND v_record.lease_until <= NOW())) THEN
    RETURN QUERY SELECT 'not_available'::text, NULL::jsonb, 0, 0, v_day, NOW(), v_reset;
    RETURN;
  END IF;

  IF v_record.quota_accounting_status = 'reserved' THEN
    UPDATE belge_paylasim_daily_quotas AS quota
    SET reserved_links = GREATEST(0, quota.reserved_links - 1), updated_at = NOW()
    WHERE quota.environment_key = v_env AND quota.owner_hash = v_owner AND quota.quota_day = v_record.quota_day;
    SELECT * INTO v_old FROM belge_paylasim_blob_obligations
    WHERE environment_key = v_env AND blob_pathname = v_record.blob_pathname FOR UPDATE;
    IF FOUND AND v_old.byte_state <> 'deleted' THEN
      PERFORM belge_paylasim_adjust_daily_bytes_v3(v_old.environment_key, v_old.owner_hash, v_old.quota_day,
        v_old.byte_state, v_old.liable_bytes, 'unknown', GREATEST(v_old.liable_bytes, p_max_pdf_bytes));
      UPDATE belge_paylasim_blob_obligations
      SET byte_state = 'unknown', liable_bytes = GREATEST(liable_bytes, p_max_pdf_bytes),
          purge_reason = 'EXPIRED_ATTEMPT_RECLAIMED', updated_at = NOW()
      WHERE id = v_old.id;
    END IF;
  END IF;
  IF v_record.status = 'pending' THEN
    UPDATE belge_paylasim_links
    SET status = 'failed', quota_accounting_status = 'released', lease_until = NULL,
        last_purge_error_code = 'ATTEMPT_LEASE_EXPIRED'
    WHERE id = p_id;
  END IF;

  INSERT INTO belge_paylasim_daily_quotas (environment_key, owner_hash, quota_day)
  VALUES (v_env, v_owner, v_day)
  ON CONFLICT ON CONSTRAINT uq_belge_paylasim_daily_quota DO NOTHING;
  SELECT q.used_links, q.reserved_links INTO v_used, v_reserved
  FROM belge_paylasim_daily_quotas q
  WHERE q.environment_key = v_env AND q.owner_hash = v_owner AND q.quota_day = v_day FOR UPDATE;
  IF v_used >= p_daily_limit THEN
    RETURN QUERY SELECT 'DAILY_BROWSER_QUOTA_EXCEEDED'::text, NULL::jsonb, v_used, v_reserved, v_day, NOW(), v_reset;
    RETURN;
  END IF;
  IF v_used + v_reserved >= p_daily_limit THEN
    RETURN QUERY SELECT 'BROWSER_QUOTA_RESERVED'::text, NULL::jsonb, v_used, v_reserved, v_day, NOW(), v_reset;
    RETURN;
  END IF;
  SELECT COALESCE(SUM(q.used_links + q.reserved_links), 0) INTO v_global_daily
  FROM belge_paylasim_daily_quotas q WHERE q.environment_key = v_env AND q.quota_day = v_day;
  IF v_global_daily >= p_global_daily_limit THEN
    RETURN QUERY SELECT 'GLOBAL_DAILY_CAPACITY_REACHED'::text, NULL::jsonb, v_used, v_reserved, v_day, NOW(), v_reset;
    RETURN;
  END IF;
  SELECT COALESCE(SUM(b.liable_bytes), 0) INTO v_liable_bytes
  FROM belge_paylasim_blob_obligations b WHERE b.byte_state <> 'deleted';
  IF v_liable_bytes + p_max_pdf_bytes > p_global_max_storage_bytes THEN
    RETURN QUERY SELECT 'STORAGE_CAPACITY_UNAVAILABLE'::text, NULL::jsonb, v_used, v_reserved, v_day, NOW(), v_reset;
    RETURN;
  END IF;

  UPDATE belge_paylasim_daily_quotas AS quota
  SET reserved_links = quota.reserved_links + 1, reserved_bytes = reserved_bytes + p_max_pdf_bytes,
      updated_at = NOW()
  WHERE quota.environment_key = v_env AND quota.owner_hash = v_owner AND quota.quota_day = v_day
  RETURNING quota.used_links, quota.reserved_links INTO v_used, v_reserved;
  UPDATE belge_paylasim_links
  SET status = 'pending', attempt_id = p_attempt_id, attempt_version = attempt_version + 1,
      blob_pathname = p_blob_pathname, lease_until = NOW() + (120 * INTERVAL '1 second'),
      quota_day = v_day, quota_accounting_status = 'reserved', last_purge_error_code = NULL
  WHERE id = p_id RETURNING * INTO v_record;
  INSERT INTO belge_paylasim_blob_obligations (
    share_id, attempt_id, environment_key, owner_hash, quota_day, blob_pathname, byte_state, liable_bytes
  ) VALUES (p_id, p_attempt_id, v_env, v_owner, v_day, p_blob_pathname, 'reserved', p_max_pdf_bytes);
  RETURN QUERY SELECT 'retry'::text, to_jsonb(v_record), v_used, v_reserved, v_day, NOW(), v_reset;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_finalize_v3(
  p_id uuid, p_size_bytes bigint, p_pdf_sha256 char(64), p_attempt_id uuid,
  p_attempt_version bigint, p_max_pdf_bytes bigint, p_daily_limit integer, p_global_daily_limit integer,
  p_global_max_storage_bytes bigint, p_expiration_days integer
) RETURNS TABLE (finalized boolean, failure_code text)
LANGUAGE plpgsql
AS $$
DECLARE
  v_record belge_paylasim_links%ROWTYPE;
  v_obligation belge_paylasim_blob_obligations%ROWTYPE;
  v_current_day date := (NOW() AT TIME ZONE 'Europe/Istanbul')::date;
  v_used integer;
  v_reserved integer;
  v_global_daily bigint;
  v_liable_bytes bigint;
  v_actual bigint := GREATEST(0, COALESCE(p_size_bytes, 0));
  v_failure text := NULL;
BEGIN
  PERFORM singleton FROM belge_paylasim_storage_guard WHERE singleton = TRUE FOR UPDATE;
  SELECT * INTO v_record FROM belge_paylasim_links WHERE id = p_id;
  IF NOT FOUND THEN RETURN QUERY SELECT FALSE, 'RESERVATION_NOT_FOUND'::text; RETURN; END IF;
  SELECT * INTO v_record FROM belge_paylasim_links WHERE id = p_id FOR UPDATE;
  IF v_record.status <> 'pending' OR v_record.revoked_at IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'ATTEMPT_NOT_CURRENT'::text; RETURN;
  END IF;
  IF p_attempt_id IS NULL THEN
    IF v_record.attempt_id IS NOT NULL THEN RETURN QUERY SELECT FALSE, 'ATTEMPT_NOT_CURRENT'::text; RETURN; END IF;
  ELSIF v_record.attempt_id IS DISTINCT FROM p_attempt_id
     OR v_record.attempt_version IS DISTINCT FROM p_attempt_version
     OR v_record.lease_until IS NULL OR v_record.lease_until <= NOW() THEN
    RETURN QUERY SELECT FALSE, 'ATTEMPT_NOT_CURRENT'::text; RETURN;
  END IF;

  -- Compatibility for explicit legacy/manual adapter rows that predate quota reservation.
  IF v_record.quota_accounting_status IS NULL THEN
    UPDATE belge_paylasim_links
    SET status = 'ready', size_bytes = v_actual, pdf_sha256 = p_pdf_sha256,
        ready_at = NOW(), expires_at = NOW() + (p_expiration_days * INTERVAL '1 day'), lease_until = NULL
    WHERE id = p_id;
    RETURN QUERY SELECT TRUE, NULL::text; RETURN;
  END IF;

  SELECT * INTO v_obligation FROM belge_paylasim_blob_obligations
  WHERE environment_key = COALESCE(v_record.environment_key, 'legacy') AND blob_pathname = v_record.blob_pathname FOR UPDATE;
  IF NOT FOUND OR v_obligation.byte_state <> 'reserved' THEN
    RETURN QUERY SELECT FALSE, 'BLOB_OBLIGATION_MISSING'::text; RETURN;
  END IF;

  IF v_current_day <> v_record.quota_day THEN
    INSERT INTO belge_paylasim_daily_quotas (environment_key, owner_hash, quota_day)
    VALUES (v_record.environment_key, v_record.owner_hash, v_current_day)
    ON CONFLICT ON CONSTRAINT uq_belge_paylasim_daily_quota DO NOTHING;
    SELECT q.used_links, q.reserved_links INTO v_used, v_reserved
    FROM belge_paylasim_daily_quotas q
    WHERE q.environment_key = v_record.environment_key AND q.owner_hash = v_record.owner_hash AND q.quota_day = v_current_day
    FOR UPDATE;
    IF v_used >= p_daily_limit THEN v_failure := 'DAILY_BROWSER_QUOTA_EXCEEDED';
    ELSIF v_used + v_reserved >= p_daily_limit THEN v_failure := 'BROWSER_QUOTA_RESERVED';
    ELSE
      SELECT COALESCE(SUM(q.used_links + q.reserved_links), 0) INTO v_global_daily
      FROM belge_paylasim_daily_quotas q WHERE q.environment_key = v_record.environment_key AND q.quota_day = v_current_day;
      IF v_global_daily >= p_global_daily_limit THEN v_failure := 'GLOBAL_DAILY_CAPACITY_REACHED'; END IF;
    END IF;
  END IF;

  SELECT COALESCE(SUM(b.liable_bytes), 0) INTO v_liable_bytes
  FROM belge_paylasim_blob_obligations b WHERE b.byte_state <> 'deleted';
  IF v_failure IS NULL AND v_liable_bytes - v_obligation.liable_bytes + v_actual > p_global_max_storage_bytes THEN
    v_failure := 'STORAGE_CAPACITY_UNAVAILABLE';
  END IF;
  IF v_actual > p_max_pdf_bytes THEN v_failure := 'PDF_SIZE_EXCEEDS_RESERVED_BYTES'; END IF;

  IF v_failure IS NOT NULL THEN
    UPDATE belge_paylasim_daily_quotas
    SET reserved_links = GREATEST(0, reserved_links - 1), updated_at = NOW()
    WHERE environment_key = v_record.environment_key AND owner_hash = v_record.owner_hash AND quota_day = v_record.quota_day;
    PERFORM belge_paylasim_adjust_daily_bytes_v3(v_obligation.environment_key, v_obligation.owner_hash, v_obligation.quota_day,
      v_obligation.byte_state, v_obligation.liable_bytes, 'deletion_pending', GREATEST(v_actual, 1));
    UPDATE belge_paylasim_blob_obligations
    SET byte_state = 'deletion_pending', liable_bytes = GREATEST(v_actual, 1), actual_bytes = v_actual,
        purge_reason = v_failure, updated_at = NOW()
    WHERE id = v_obligation.id;
    UPDATE belge_paylasim_links
    SET status = 'failed', quota_accounting_status = 'released', lease_until = NULL,
        last_purge_error_code = v_failure
    WHERE id = p_id;
    RETURN QUERY SELECT FALSE, v_failure;
    RETURN;
  END IF;

  IF v_current_day <> v_record.quota_day THEN
    UPDATE belge_paylasim_daily_quotas
    SET reserved_links = GREATEST(0, reserved_links - 1),
        reserved_bytes = GREATEST(0, reserved_bytes - v_obligation.liable_bytes), updated_at = NOW()
    WHERE environment_key = v_record.environment_key AND owner_hash = v_record.owner_hash AND quota_day = v_record.quota_day;
    UPDATE belge_paylasim_daily_quotas
    SET used_links = used_links + 1, committed_bytes = committed_bytes + v_actual, updated_at = NOW()
    WHERE environment_key = v_record.environment_key AND owner_hash = v_record.owner_hash AND quota_day = v_current_day;
  ELSE
    UPDATE belge_paylasim_daily_quotas
    SET reserved_links = GREATEST(0, reserved_links - 1), used_links = used_links + 1,
        reserved_bytes = GREATEST(0, reserved_bytes - v_obligation.liable_bytes),
        committed_bytes = committed_bytes + v_actual, updated_at = NOW()
    WHERE environment_key = v_record.environment_key AND owner_hash = v_record.owner_hash AND quota_day = v_current_day;
  END IF;
  UPDATE belge_paylasim_blob_obligations
  SET byte_state = 'committed', liable_bytes = v_actual, actual_bytes = v_actual,
      quota_day = v_current_day, purge_reason = NULL, updated_at = NOW()
  WHERE id = v_obligation.id;
  UPDATE belge_paylasim_links
  SET status = 'ready', size_bytes = v_actual, pdf_sha256 = p_pdf_sha256,
      ready_at = NOW(), expires_at = NOW() + (p_expiration_days * INTERVAL '1 day'),
      lease_until = NULL, quota_day = v_current_day, quota_accounting_status = 'used'
  WHERE id = p_id;
  RETURN QUERY SELECT TRUE, NULL::text;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_fail_v3(
  p_id uuid, p_error_code text, p_attempt_id uuid, p_attempt_version bigint,
  p_upload_state text, p_actual_bytes bigint
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_record belge_paylasim_links%ROWTYPE;
  v_obligation belge_paylasim_blob_obligations%ROWTYPE;
  v_new_state text;
  v_new_bytes bigint;
BEGIN
  PERFORM singleton FROM belge_paylasim_storage_guard WHERE singleton = TRUE FOR UPDATE;
  SELECT * INTO v_record FROM belge_paylasim_links WHERE id = p_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  SELECT * INTO v_record FROM belge_paylasim_links WHERE id = p_id FOR UPDATE;
  IF v_record.status <> 'pending' OR v_record.revoked_at IS NOT NULL THEN RETURN FALSE; END IF;
  IF p_attempt_id IS NULL THEN
    IF v_record.attempt_id IS NOT NULL THEN RETURN FALSE; END IF;
  ELSIF v_record.attempt_id IS DISTINCT FROM p_attempt_id
     OR v_record.attempt_version IS DISTINCT FROM p_attempt_version
     OR v_record.lease_until IS NULL OR v_record.lease_until <= NOW() THEN RETURN FALSE;
  END IF;

  SELECT * INTO v_obligation FROM belge_paylasim_blob_obligations
  WHERE environment_key = COALESCE(v_record.environment_key, 'legacy') AND blob_pathname = v_record.blob_pathname FOR UPDATE;
  IF FOUND THEN
    IF p_upload_state = 'not_started' THEN
      v_new_state := 'deleted'; v_new_bytes := 0;
    ELSIF p_upload_state = 'present' THEN
      v_new_state := 'deletion_pending'; v_new_bytes := GREATEST(0, COALESCE(p_actual_bytes, v_obligation.liable_bytes));
    ELSE
      v_new_state := 'unknown'; v_new_bytes := GREATEST(v_obligation.liable_bytes, COALESCE(p_actual_bytes, 0));
    END IF;
    PERFORM belge_paylasim_adjust_daily_bytes_v3(v_obligation.environment_key, v_obligation.owner_hash, v_obligation.quota_day,
      v_obligation.byte_state, v_obligation.liable_bytes, v_new_state, v_new_bytes);
    UPDATE belge_paylasim_blob_obligations
    SET byte_state = v_new_state, liable_bytes = v_new_bytes,
        actual_bytes = CASE WHEN p_upload_state = 'present' THEN p_actual_bytes ELSE actual_bytes END,
        purge_reason = p_error_code, updated_at = NOW(),
        deleted_at = CASE WHEN p_upload_state = 'not_started' THEN NOW() ELSE NULL END
    WHERE id = v_obligation.id;
  END IF;
  IF v_record.quota_accounting_status = 'reserved' THEN
    UPDATE belge_paylasim_daily_quotas
    SET reserved_links = GREATEST(0, reserved_links - 1), updated_at = NOW()
    WHERE environment_key = v_record.environment_key AND owner_hash = v_record.owner_hash AND quota_day = v_record.quota_day;
  END IF;
  UPDATE belge_paylasim_links
  SET status = 'failed', quota_accounting_status = CASE WHEN quota_accounting_status = 'reserved' THEN 'released' ELSE quota_accounting_status END,
      last_purge_error_code = p_error_code, lease_until = NULL
  WHERE id = p_id;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_retry_revoke_v3(p_id uuid) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_record belge_paylasim_links%ROWTYPE;
  v_obligation belge_paylasim_blob_obligations%ROWTYPE;
  v_new_state text;
BEGIN
  PERFORM singleton FROM belge_paylasim_storage_guard WHERE singleton = TRUE FOR UPDATE;
  SELECT * INTO v_record FROM belge_paylasim_links WHERE id = p_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT * INTO v_record FROM belge_paylasim_links WHERE id = p_id FOR UPDATE;
  IF v_record.quota_accounting_status = 'reserved' THEN
    UPDATE belge_paylasim_daily_quotas
    SET reserved_links = GREATEST(0, reserved_links - 1), updated_at = NOW()
    WHERE environment_key = v_record.environment_key AND owner_hash = v_record.owner_hash AND quota_day = v_record.quota_day;
  END IF;
  SELECT * INTO v_obligation FROM belge_paylasim_blob_obligations
  WHERE environment_key = COALESCE(v_record.environment_key, 'legacy') AND blob_pathname = v_record.blob_pathname FOR UPDATE;
  IF FOUND AND v_obligation.byte_state <> 'deleted' THEN
    v_new_state := CASE WHEN v_obligation.byte_state = 'reserved' THEN 'unknown' ELSE 'deletion_pending' END;
    PERFORM belge_paylasim_adjust_daily_bytes_v3(v_obligation.environment_key, v_obligation.owner_hash, v_obligation.quota_day,
      v_obligation.byte_state, v_obligation.liable_bytes, v_new_state, v_obligation.liable_bytes);
    UPDATE belge_paylasim_blob_obligations
    SET byte_state = v_new_state, purge_reason = 'LINK_REVOKED', updated_at = NOW()
    WHERE id = v_obligation.id;
  END IF;
  UPDATE belge_paylasim_links
  SET status = 'revoked', revoked_at = COALESCE(revoked_at, NOW()),
      quota_accounting_status = CASE WHEN quota_accounting_status = 'reserved' THEN 'released' ELSE quota_accounting_status END
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_mark_blob_deleted_v3(p_environment_key text, p_blob_pathname text) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_obligation belge_paylasim_blob_obligations%ROWTYPE;
BEGIN
  PERFORM singleton FROM belge_paylasim_storage_guard WHERE singleton = TRUE FOR UPDATE;
  SELECT * INTO v_obligation FROM belge_paylasim_blob_obligations
  WHERE environment_key = p_environment_key AND blob_pathname = p_blob_pathname;
  IF NOT FOUND THEN RETURN TRUE; END IF;
  SELECT * INTO v_obligation FROM belge_paylasim_blob_obligations WHERE id = v_obligation.id FOR UPDATE;
  IF v_obligation.byte_state = 'deleted' THEN RETURN TRUE; END IF;
  PERFORM belge_paylasim_adjust_daily_bytes_v3(v_obligation.environment_key, v_obligation.owner_hash, v_obligation.quota_day,
    v_obligation.byte_state, v_obligation.liable_bytes, 'deleted', 0);
  UPDATE belge_paylasim_blob_obligations
  SET byte_state = 'deleted', liable_bytes = 0, deleted_at = NOW(), updated_at = NOW()
  WHERE id = v_obligation.id;
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_mark_purged_v3(p_id uuid) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_record belge_paylasim_links%ROWTYPE;
BEGIN
  PERFORM singleton FROM belge_paylasim_storage_guard WHERE singleton = TRUE FOR UPDATE;
  SELECT * INTO v_record FROM belge_paylasim_links WHERE id = p_id;
  IF NOT FOUND THEN RETURN; END IF;
  PERFORM belge_paylasim_mark_blob_deleted_v3(COALESCE(v_record.environment_key, 'legacy'), v_record.blob_pathname);
  IF v_record.quota_accounting_status = 'reserved' THEN
    UPDATE belge_paylasim_daily_quotas
    SET reserved_links = GREATEST(0, reserved_links - 1), updated_at = NOW()
    WHERE environment_key = v_record.environment_key AND owner_hash = v_record.owner_hash AND quota_day = v_record.quota_day;
  END IF;
  UPDATE belge_paylasim_links
  SET status = 'purged', purged_at = NOW(), lease_until = NULL,
      quota_accounting_status = CASE WHEN quota_accounting_status = 'reserved' THEN 'released' ELSE quota_accounting_status END
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION belge_paylasim_record_purge_error_v3(p_id uuid, p_error_code text) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_record belge_paylasim_links%ROWTYPE;
  v_obligation belge_paylasim_blob_obligations%ROWTYPE;
  v_new_bytes bigint;
BEGIN
  PERFORM singleton FROM belge_paylasim_storage_guard WHERE singleton = TRUE FOR UPDATE;
  SELECT * INTO v_record FROM belge_paylasim_links WHERE id = p_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT * INTO v_record FROM belge_paylasim_links WHERE id = p_id FOR UPDATE;
  IF v_record.quota_accounting_status = 'reserved' THEN
    UPDATE belge_paylasim_daily_quotas
    SET reserved_links = GREATEST(0, reserved_links - 1), updated_at = NOW()
    WHERE environment_key = v_record.environment_key AND owner_hash = v_record.owner_hash AND quota_day = v_record.quota_day;
  END IF;
  SELECT * INTO v_obligation FROM belge_paylasim_blob_obligations
  WHERE environment_key = v_record.environment_key AND blob_pathname = v_record.blob_pathname FOR UPDATE;
  IF FOUND AND v_obligation.byte_state <> 'deleted' THEN
    v_new_bytes := GREATEST(v_obligation.liable_bytes, COALESCE(v_record.size_bytes, 0));
    PERFORM belge_paylasim_adjust_daily_bytes_v3(v_obligation.environment_key, v_obligation.owner_hash, v_obligation.quota_day,
      v_obligation.byte_state, v_obligation.liable_bytes, 'deletion_pending', v_new_bytes);
    UPDATE belge_paylasim_blob_obligations
    SET byte_state = 'deletion_pending', liable_bytes = v_new_bytes,
        purge_reason = p_error_code, attempt_count = attempt_count + 1, updated_at = NOW()
    WHERE id = v_obligation.id;
  END IF;
  UPDATE belge_paylasim_links
  SET purge_attempts = purge_attempts + 1, last_purge_error_code = p_error_code,
      lease_until = NULL,
      quota_accounting_status = CASE WHEN quota_accounting_status = 'reserved' THEN 'released' ELSE quota_accounting_status END
  WHERE id = p_id;
END;
$$;

INSERT INTO belge_paylasim_schema_version (singleton, schema_version)
VALUES (TRUE, 8)
ON CONFLICT (singleton) DO UPDATE
SET schema_version = GREATEST(belge_paylasim_schema_version.schema_version, EXCLUDED.schema_version),
    updated_at = NOW();
