-- CAD V2 durable repository schema, PostgreSQL / Neon.
-- IDs are TEXT because the public API uses scene_*, job_* and vs_* identifiers.
-- Existing deployments should apply all numbered migrations in order.

CREATE TABLE IF NOT EXISTS cad_v2_jobs (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  share_link_id TEXT,
  source_version_key TEXT NOT NULL,
  source_sha256 TEXT,
  artifact_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  phase TEXT NOT NULL DEFAULT 'source',
  progress REAL,
  scene_id TEXT,
  fence INTEGER NOT NULL DEFAULT 1,
  attempt INTEGER NOT NULL DEFAULT 0,
  client_request_id TEXT,
  error_message TEXT,
  worker_lease_owner_id TEXT,
  worker_lease_expires_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cad_v2_job_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL REFERENCES cad_v2_jobs(id) ON DELETE CASCADE,
  attempt INTEGER NOT NULL,
  fence INTEGER NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(job_id, attempt)
);

CREATE TABLE IF NOT EXISTS cad_v2_scenes (
  id TEXT PRIMARY KEY,
  artifact_key TEXT NOT NULL,
  tenant_scope TEXT NOT NULL,
  file_id TEXT NOT NULL,
  source_version_key TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  manifest_sha256 TEXT,
  manifest_blob_path TEXT,
  storage_generation TEXT,
  compiler_revision TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  render_abi TEXT NOT NULL,
  quality_profile TEXT NOT NULL,
  font_digest TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'staging',
  publish_token TEXT,
  expected_object_count INTEGER NOT NULL DEFAULT 0,
  quality_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cad_v2_scene_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id TEXT NOT NULL REFERENCES cad_v2_scenes(id) ON DELETE CASCADE,
  object_id TEXT NOT NULL,
  object_type TEXT NOT NULL,
  byte_length BIGINT NOT NULL,
  sha256 TEXT NOT NULL,
  blob_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(scene_id, object_id)
);

CREATE TABLE IF NOT EXISTS cad_v2_publish_leases (
  scene_id TEXT NOT NULL,
  storage_generation TEXT NOT NULL,
  job_id TEXT NOT NULL REFERENCES cad_v2_jobs(id) ON DELETE CASCADE,
  fence INTEGER NOT NULL,
  owner_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','published','reconciling','reconciled')),
  lease_expires_at TIMESTAMPTZ NOT NULL,
  heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(scene_id, storage_generation)
);

CREATE TABLE IF NOT EXISTS cad_v2_view_sessions (
  id TEXT PRIMARY KEY,
  client_request_id TEXT NOT NULL UNIQUE,
  file_id TEXT NOT NULL,
  share_link_id TEXT,
  job_id TEXT REFERENCES cad_v2_jobs(id) ON DELETE SET NULL,
  scene_id TEXT REFERENCES cad_v2_scenes(id) ON DELETE SET NULL,
  lease_expires_at TIMESTAMPTZ NOT NULL,
  heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cad_v2_jobs_client_request
  ON cad_v2_jobs(client_request_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cad_v2_jobs_active_artifact_share
  ON cad_v2_jobs(artifact_key, (COALESCE(share_link_id, '')))
  WHERE status IN ('queued','running');
CREATE INDEX IF NOT EXISTS idx_cad_v2_jobs_artifact_status
  ON cad_v2_jobs(artifact_key, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cad_v2_jobs_worker_claim
  ON cad_v2_jobs(status, next_attempt_at, worker_lease_expires_at, created_at)
  WHERE status IN ('queued','running');
CREATE INDEX IF NOT EXISTS idx_cad_v2_scenes_file_revision_status
  ON cad_v2_scenes(tenant_scope, file_id, source_version_key, status);
CREATE INDEX IF NOT EXISTS idx_cad_v2_scene_objects_scene_type
  ON cad_v2_scene_objects(scene_id, object_type);
CREATE INDEX IF NOT EXISTS idx_cad_v2_publish_leases_status_expiry
  ON cad_v2_publish_leases(status, lease_expires_at);
CREATE INDEX IF NOT EXISTS idx_cad_v2_view_sessions_job_expiry
  ON cad_v2_view_sessions(job_id, lease_expires_at);
