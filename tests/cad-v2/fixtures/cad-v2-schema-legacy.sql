-- Historical CAD V2 schema used UUID columns although service/API IDs are prefixed strings.
CREATE TABLE cad_v2_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), file_id TEXT NOT NULL,
  source_version_key TEXT NOT NULL, source_sha256 TEXT NOT NULL, artifact_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', phase TEXT NOT NULL DEFAULT 'source', progress REAL,
  scene_id UUID, fence INTEGER NOT NULL DEFAULT 1, attempt INTEGER NOT NULL DEFAULT 0,
  client_request_id TEXT, error_message TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(artifact_key, status)
);
CREATE TABLE cad_v2_job_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), job_id UUID NOT NULL REFERENCES cad_v2_jobs(id),
  attempt INTEGER NOT NULL, fence INTEGER NOT NULL, status TEXT NOT NULL, started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ, error_message TEXT, UNIQUE(job_id, attempt)
);
CREATE TABLE cad_v2_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), artifact_key TEXT NOT NULL UNIQUE,
  source_version_key TEXT NOT NULL, source_sha256 TEXT NOT NULL, manifest_sha256 TEXT,
  quality_status TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE cad_v2_scene_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), scene_id UUID NOT NULL REFERENCES cad_v2_scenes(id),
  object_id TEXT NOT NULL, object_type TEXT NOT NULL, byte_length INTEGER, sha256 TEXT,
  blob_path TEXT, UNIQUE(scene_id, object_id)
);
CREATE TABLE cad_v2_view_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), file_id TEXT NOT NULL,
  job_id UUID REFERENCES cad_v2_jobs(id), scene_id UUID REFERENCES cad_v2_scenes(id),
  lease_expires_at TIMESTAMPTZ, heartbeat_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO cad_v2_jobs(id,file_id,source_version_key,source_sha256,artifact_key,status,phase,client_request_id)
VALUES ('00000000-0000-4000-8000-000000000001','legacy-file','legacy-rev','aaaaaaaa','legacy-artifact','running','compile','legacy-request');
INSERT INTO cad_v2_scenes(id,artifact_key,source_version_key,source_sha256,manifest_sha256)
VALUES ('00000000-0000-4000-8000-000000000002','legacy-scene-artifact','legacy-rev','aaaaaaaa','bbbbbbbb');
INSERT INTO cad_v2_jobs(id,file_id,source_version_key,source_sha256,artifact_key,status,phase,scene_id,client_request_id)
VALUES ('00000000-0000-4000-8000-000000000003','legacy-file','legacy-rev','aaaaaaaa','legacy-scene-artifact','ready','done','00000000-0000-4000-8000-000000000002','legacy-ready-request');
INSERT INTO cad_v2_job_attempts(job_id,attempt,fence,status)
VALUES ('00000000-0000-4000-8000-000000000001',1,1,'running');
INSERT INTO cad_v2_scene_objects(scene_id,object_id,object_type,byte_length,sha256,blob_path)
VALUES ('00000000-0000-4000-8000-000000000002','old_chunk','chunk',12,'cccccccc','cad-v2/scenes/old_chunk.bin');
INSERT INTO cad_v2_view_sessions(id,file_id,job_id,scene_id,lease_expires_at)
VALUES ('00000000-0000-4000-8000-000000000004','legacy-file','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002',now()+interval '1 minute');
