-- Upgrade the original UUID-based CAD V2 tables to the public prefixed IDs and
-- durable publish pointer contract. Run through migrate-cad-v2-schema.ts only
-- against an explicitly approved local/test PostgreSQL target.
-- @statement
CREATE TABLE IF NOT EXISTS cad_v2_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), file_id TEXT NOT NULL,
  source_version_key TEXT NOT NULL, source_sha256 TEXT NOT NULL, artifact_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', phase TEXT NOT NULL DEFAULT 'source', progress REAL,
  scene_id UUID, fence INTEGER NOT NULL DEFAULT 1, attempt INTEGER NOT NULL DEFAULT 0,
  client_request_id TEXT, error_message TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(artifact_key, status)
);
-- @statement
CREATE TABLE IF NOT EXISTS cad_v2_job_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), job_id UUID NOT NULL REFERENCES cad_v2_jobs(id),
  attempt INTEGER NOT NULL, fence INTEGER NOT NULL, status TEXT NOT NULL, started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ, error_message TEXT, UNIQUE(job_id, attempt)
);
-- @statement
CREATE TABLE IF NOT EXISTS cad_v2_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), artifact_key TEXT NOT NULL UNIQUE,
  source_version_key TEXT NOT NULL, source_sha256 TEXT NOT NULL, manifest_sha256 TEXT,
  quality_status TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- @statement
CREATE TABLE IF NOT EXISTS cad_v2_scene_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), scene_id UUID NOT NULL REFERENCES cad_v2_scenes(id),
  object_id TEXT NOT NULL, object_type TEXT NOT NULL, byte_length INTEGER, sha256 TEXT,
  blob_path TEXT, UNIQUE(scene_id, object_id)
);
-- @statement
CREATE TABLE IF NOT EXISTS cad_v2_view_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), file_id TEXT NOT NULL,
  job_id UUID REFERENCES cad_v2_jobs(id), scene_id UUID REFERENCES cad_v2_scenes(id),
  lease_expires_at TIMESTAMPTZ, heartbeat_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- @statement
DO $$
DECLARE fk RECORD;
BEGIN
  FOR fk IN
    SELECT conrelid::regclass AS table_name, conname
    FROM pg_constraint
    WHERE contype = 'f'
      AND conrelid IN (
        'cad_v2_jobs'::regclass, 'cad_v2_job_attempts'::regclass,
        'cad_v2_scenes'::regclass, 'cad_v2_scene_objects'::regclass,
        'cad_v2_view_sessions'::regclass
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.table_name, fk.conname);
  END LOOP;
END $$;
-- @statement
ALTER TABLE cad_v2_jobs ALTER COLUMN id TYPE TEXT USING id::text;
-- @statement
ALTER TABLE cad_v2_jobs ALTER COLUMN scene_id TYPE TEXT USING scene_id::text;
-- @statement
ALTER TABLE cad_v2_job_attempts ALTER COLUMN job_id TYPE TEXT USING job_id::text;
-- @statement
ALTER TABLE cad_v2_scenes ALTER COLUMN id TYPE TEXT USING id::text;
-- @statement
ALTER TABLE cad_v2_scene_objects ALTER COLUMN scene_id TYPE TEXT USING scene_id::text;
-- @statement
ALTER TABLE cad_v2_view_sessions ALTER COLUMN id TYPE TEXT USING id::text;
-- @statement
ALTER TABLE cad_v2_view_sessions ALTER COLUMN job_id TYPE TEXT USING job_id::text;
-- @statement
ALTER TABLE cad_v2_view_sessions ALTER COLUMN scene_id TYPE TEXT USING scene_id::text;
-- @statement
ALTER TABLE cad_v2_view_sessions ALTER COLUMN lease_expires_at DROP NOT NULL;
-- @statement
ALTER TABLE cad_v2_jobs ADD COLUMN IF NOT EXISTS share_link_id TEXT;
-- @statement
ALTER TABLE cad_v2_jobs ALTER COLUMN source_sha256 DROP NOT NULL;
-- @statement
ALTER TABLE cad_v2_scenes ADD COLUMN IF NOT EXISTS tenant_scope TEXT NOT NULL DEFAULT 'legacy';
-- @statement
ALTER TABLE cad_v2_scenes ADD COLUMN IF NOT EXISTS file_id TEXT;
-- @statement
ALTER TABLE cad_v2_scenes ADD COLUMN IF NOT EXISTS manifest_blob_path TEXT;
-- @statement
ALTER TABLE cad_v2_scenes ADD COLUMN IF NOT EXISTS storage_generation TEXT;
-- @statement
ALTER TABLE cad_v2_scenes ADD COLUMN IF NOT EXISTS compiler_revision TEXT NOT NULL DEFAULT 'legacy-unverified';
-- @statement
ALTER TABLE cad_v2_scenes ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 0;
-- @statement
ALTER TABLE cad_v2_scenes ADD COLUMN IF NOT EXISTS render_abi TEXT NOT NULL DEFAULT 'legacy-unverified';
-- @statement
ALTER TABLE cad_v2_scenes ADD COLUMN IF NOT EXISTS quality_profile TEXT NOT NULL DEFAULT 'legacy-unverified';
-- @statement
ALTER TABLE cad_v2_scenes ADD COLUMN IF NOT EXISTS font_digest TEXT NOT NULL DEFAULT 'legacy-unverified';
-- @statement
ALTER TABLE cad_v2_scenes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'legacy_unverified';
-- @statement
ALTER TABLE cad_v2_scenes ADD COLUMN IF NOT EXISTS publish_token TEXT;
-- @statement
ALTER TABLE cad_v2_scenes ADD COLUMN IF NOT EXISTS expected_object_count INTEGER NOT NULL DEFAULT 0;
-- @statement
ALTER TABLE cad_v2_scenes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
-- @statement
ALTER TABLE cad_v2_scene_objects ALTER COLUMN byte_length TYPE BIGINT USING byte_length::bigint;
-- @statement
ALTER TABLE cad_v2_scene_objects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
-- @statement
ALTER TABLE cad_v2_view_sessions ADD COLUMN IF NOT EXISTS client_request_id TEXT;
-- @statement
ALTER TABLE cad_v2_view_sessions ADD COLUMN IF NOT EXISTS share_link_id TEXT;
-- @statement
UPDATE cad_v2_scenes SET status = 'legacy_unverified' WHERE status = 'staging' AND storage_generation IS NULL;
-- @statement
ALTER TABLE cad_v2_jobs DROP CONSTRAINT IF EXISTS cad_v2_jobs_artifact_key_status_key;
-- @statement
DO $$
DECLARE unique_constraint RECORD;
BEGIN
  FOR unique_constraint IN
    SELECT conname FROM pg_constraint
    WHERE conrelid='cad_v2_jobs'::regclass AND contype='u'
      AND (SELECT array_agg(attribute.attname ORDER BY attribute.attname)
           FROM unnest(conkey) AS key_column(attnum)
           JOIN pg_attribute attribute ON attribute.attrelid='cad_v2_jobs'::regclass AND attribute.attnum=key_column.attnum)
          = ARRAY['artifact_key','status']::name[]
  LOOP
    EXECUTE format('ALTER TABLE cad_v2_jobs DROP CONSTRAINT %I', unique_constraint.conname);
  END LOOP;
END $$;
-- @statement
DO $$
DECLARE legacy_index RECORD;
BEGIN
  FOR legacy_index IN
    SELECT index_class.relname AS index_name
    FROM pg_index index_meta
    JOIN pg_class table_class ON table_class.oid=index_meta.indrelid
    JOIN pg_class index_class ON index_class.oid=index_meta.indexrelid
    WHERE table_class.relname='cad_v2_jobs' AND index_meta.indisunique AND NOT index_meta.indisprimary
      AND NOT EXISTS (SELECT 1 FROM pg_constraint constraint_row WHERE constraint_row.conindid=index_meta.indexrelid)
      AND lower(pg_get_indexdef(index_meta.indexrelid)) LIKE '%(artifact_key, status)%'
  LOOP
    EXECUTE format('DROP INDEX %I', legacy_index.index_name);
  END LOOP;
END $$;
-- @statement
CREATE UNIQUE INDEX IF NOT EXISTS uq_cad_v2_jobs_client_request
  ON cad_v2_jobs(client_request_id);
-- @statement
CREATE UNIQUE INDEX IF NOT EXISTS uq_cad_v2_jobs_active_artifact_share
  ON cad_v2_jobs(artifact_key, (COALESCE(share_link_id, '')))
  WHERE status IN ('queued','running');
-- @statement
CREATE INDEX IF NOT EXISTS idx_cad_v2_jobs_artifact_status
  ON cad_v2_jobs(artifact_key, status, updated_at DESC);
-- @statement
CREATE INDEX IF NOT EXISTS idx_cad_v2_scenes_file_revision_status
  ON cad_v2_scenes(tenant_scope, file_id, source_version_key, status);
-- @statement
CREATE INDEX IF NOT EXISTS idx_cad_v2_scene_objects_scene_type
  ON cad_v2_scene_objects(scene_id, object_type);
-- @statement
CREATE UNIQUE INDEX IF NOT EXISTS uq_cad_v2_view_sessions_client_request
  ON cad_v2_view_sessions(client_request_id);
-- @statement
CREATE INDEX IF NOT EXISTS idx_cad_v2_view_sessions_job_expiry
  ON cad_v2_view_sessions(job_id, lease_expires_at);
-- @statement
ALTER TABLE cad_v2_job_attempts
  ADD CONSTRAINT fk_cad_v2_job_attempts_job FOREIGN KEY (job_id) REFERENCES cad_v2_jobs(id) ON DELETE CASCADE;
-- @statement
ALTER TABLE cad_v2_jobs
  ADD CONSTRAINT fk_cad_v2_jobs_scene FOREIGN KEY (scene_id) REFERENCES cad_v2_scenes(id) ON DELETE SET NULL;
-- @statement
ALTER TABLE cad_v2_scene_objects
  ADD CONSTRAINT fk_cad_v2_scene_objects_scene FOREIGN KEY (scene_id) REFERENCES cad_v2_scenes(id) ON DELETE CASCADE;
-- @statement
ALTER TABLE cad_v2_view_sessions
  ADD CONSTRAINT fk_cad_v2_view_sessions_job FOREIGN KEY (job_id) REFERENCES cad_v2_jobs(id) ON DELETE SET NULL;
-- @statement
ALTER TABLE cad_v2_view_sessions
  ADD CONSTRAINT fk_cad_v2_view_sessions_scene FOREIGN KEY (scene_id) REFERENCES cad_v2_scenes(id) ON DELETE SET NULL;
-- @statement
CREATE TABLE IF NOT EXISTS cad_v2_schema_migrations (
  version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- @statement
INSERT INTO cad_v2_schema_migrations(version) VALUES ('001_durable_repository') ON CONFLICT (version) DO NOTHING;
