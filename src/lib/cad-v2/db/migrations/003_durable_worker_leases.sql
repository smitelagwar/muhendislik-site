-- Durable compiler-worker claims, restart recovery, and bounded retry scheduling.
-- Legacy running jobs are recoverable because their new lease columns default to NULL.
-- @statement
ALTER TABLE cad_v2_jobs ADD COLUMN IF NOT EXISTS worker_lease_owner_id TEXT;
-- @statement
ALTER TABLE cad_v2_jobs ADD COLUMN IF NOT EXISTS worker_lease_expires_at TIMESTAMPTZ;
-- @statement
ALTER TABLE cad_v2_jobs ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ;
-- @statement
CREATE INDEX IF NOT EXISTS idx_cad_v2_jobs_worker_claim
  ON cad_v2_jobs(status, next_attempt_at, worker_lease_expires_at, created_at)
  WHERE status IN ('queued','running');
-- @statement
INSERT INTO cad_v2_schema_migrations(version)
VALUES ('003_durable_worker_leases')
ON CONFLICT (version) DO NOTHING;
