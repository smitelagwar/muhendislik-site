-- Durable fencing for immutable Blob generation uploads and safe stale cleanup.
-- @statement
CREATE TABLE IF NOT EXISTS cad_v2_publish_leases (
  scene_id TEXT NOT NULL,
  storage_generation TEXT NOT NULL,
  job_id TEXT NOT NULL REFERENCES cad_v2_jobs(id) ON DELETE CASCADE,
  fence INTEGER NOT NULL,
  owner_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','published','reconciling','reconciled')),
  lease_expires_at TIMESTAMPTZ NOT NULL,
  heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(scene_id, storage_generation)
);
-- @statement
CREATE INDEX IF NOT EXISTS idx_cad_v2_publish_leases_status_expiry
  ON cad_v2_publish_leases(status, lease_expires_at);
-- @statement
INSERT INTO cad_v2_schema_migrations(version)
VALUES ('002_publish_lease_reconcile')
ON CONFLICT (version) DO NOTHING;
