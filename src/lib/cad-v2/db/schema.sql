-- ============================================================================
-- DWG/DXF MOTOR V2 — NEON / POSTGRES DATABASE MIGRATION (G11, D10)
-- ============================================================================
-- Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, 31_SOZLESME_TAMAMLAMALARI.md
-- Gereksinimler: R18, R19, R20, R27, R43 | Alt kabul: C07, C08, C09, C10
-- Fencing token, idempotent job queue, immutable scene ve 180s TTL oturumlar.

CREATE TABLE IF NOT EXISTS cad_v2_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL,
  source_version_key TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  artifact_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  phase TEXT NOT NULL DEFAULT 'source',
  progress REAL,
  scene_id UUID,
  fence INTEGER NOT NULL DEFAULT 1,
  attempt INTEGER NOT NULL DEFAULT 0,
  client_request_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(artifact_key, status) -- idempotence
);

CREATE TABLE IF NOT EXISTS cad_v2_job_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES cad_v2_jobs(id),
  attempt INTEGER NOT NULL,
  fence INTEGER NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  UNIQUE(job_id, attempt)
);

CREATE TABLE IF NOT EXISTS cad_v2_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_key TEXT NOT NULL UNIQUE,
  source_version_key TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  manifest_sha256 TEXT,
  quality_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cad_v2_scene_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES cad_v2_scenes(id),
  object_id TEXT NOT NULL,
  object_type TEXT NOT NULL,
  byte_length INTEGER,
  sha256 TEXT,
  blob_path TEXT,
  UNIQUE(scene_id, object_id)
);

CREATE TABLE IF NOT EXISTS cad_v2_view_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL,
  job_id UUID REFERENCES cad_v2_jobs(id),
  scene_id UUID REFERENCES cad_v2_scenes(id),
  lease_expires_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
