import { getDb } from "@/lib/dokumantasyon/db";
import type { CadV2Job, CadV2JobStatus, CadV2ViewSession } from "../service/cad-v2-durable-service";

export interface CadV2SqlStatement {
  text: string;
  params?: readonly unknown[];
}

export interface CadV2SqlExecutor {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: readonly unknown[]
  ): Promise<T[]>;
  transaction(statements: readonly CadV2SqlStatement[]): Promise<unknown[][]>;
}

export interface CadV2PreparedRecordsInput {
  job: CadV2Job;
  session: CadV2ViewSession;
  artifactKey: string;
  sourceSha256: string | null;
}

export interface CadV2SceneObjectRecord {
  objectId: string;
  objectType: "chunk" | "index" | "metadata" | "manifest";
  byteLength: number;
  sha256: string;
  blobPath: string;
}

export interface CadV2PublishSceneInput {
  jobId: string;
  fence: number;
  workerOwnerId?: string | null;
  leaseOwnerId: string;
  sceneId: string;
  fileId: string;
  sourceVersionKey: string;
  sourceSha256: string;
  artifactKey: string;
  tenantScope: string;
  storageGeneration: string;
  compilerRevision: string;
  schemaVersion: number;
  renderAbi: string;
  qualityProfile: string;
  fontDigest: string;
  manifestSha256: string;
  manifestBlobPath: string;
  objects: readonly CadV2SceneObjectRecord[];
}

export interface CadV2PublishLease {
  sceneId: string;
  storageGeneration: string;
  jobId: string;
  fence: number;
  ownerId: string;
  status: "active" | "reconciling" | "reconciled";
  leaseExpiresAt: number;
}

export interface CadV2WorkerJobClaim extends CadV2Job {
  sourceSha256: string | null;
  workerOwnerId: string;
  workerLeaseExpiresAt: number;
}

function asMillis(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function toJob(row: Record<string, unknown>): CadV2Job {
  return {
    jobId: String(row.id),
    fileId: String(row.file_id),
    shareLinkId: (row.share_link_id as string | null) ?? null,
    sourceVersionKey: String(row.source_version_key),
    clientRequestId: String(row.client_request_id),
    status: String(row.status) as CadV2JobStatus,
    phase: String(row.phase) as CadV2Job["phase"],
    progress: row.progress == null ? null : Number(row.progress),
    sceneId: (row.scene_id as string | null) ?? null,
    fence: Number(row.fence),
    attempt: Number(row.attempt),
    createdAt: asMillis(row.created_at),
    updatedAt: asMillis(row.updated_at),
    error: (row.error_message as string | null) ?? null,
  };
}

function toWorkerClaim(row: Record<string, unknown>): CadV2WorkerJobClaim {
  return {
    ...toJob(row),
    sourceSha256: (row.source_sha256 as string | null) ?? null,
    workerOwnerId: String(row.worker_lease_owner_id),
    workerLeaseExpiresAt: asMillis(row.worker_lease_expires_at),
  };
}

function toSession(row: Record<string, unknown>): CadV2ViewSession {
  return {
    viewSessionId: String(row.id),
    fileId: String(row.file_id),
    shareLinkId: (row.share_link_id as string | null) ?? null,
    jobId: (row.job_id as string | null) ?? null,
    sceneId: (row.scene_id as string | null) ?? null,
    expiresAt: asMillis(row.lease_expires_at),
    createdAt: asMillis(row.created_at),
  };
}

export class CadV2DurableRepository {
  constructor(private readonly sql: CadV2SqlExecutor) {}

  public static fromNeon(): CadV2DurableRepository {
    const sql = getDb();
    return new CadV2DurableRepository({
      query: async <T extends Record<string, unknown>>(text: string, params: readonly unknown[] = []) =>
        await sql.query(text, [...params]) as unknown as T[],
      transaction: async (statements) =>
        await sql.transaction(statements.map(({ text, params = [] }) => sql.query(text, [...params]))) as unknown as unknown[][],
    });
  }

  public async createPreparedRecords(input: CadV2PreparedRecordsInput): Promise<{
    job: CadV2Job;
    session: CadV2ViewSession;
    created: boolean;
  }> {
    const { job, session } = input;
    const params = [
      job.jobId, job.fileId, job.shareLinkId || null, job.sourceVersionKey,
      input.sourceSha256, input.artifactKey, job.status, job.phase, job.progress ?? null,
      job.sceneId ?? null, job.fence, job.attempt, job.clientRequestId, job.error ?? null,
      job.createdAt, job.updatedAt, session.viewSessionId, session.expiresAt, session.createdAt,
    ];
    const selectedJobSql = `
      SELECT * FROM cad_v2_jobs
      WHERE client_request_id=$13 OR (
        artifact_key=$6 AND COALESCE(share_link_id,'')=COALESCE($3,'')
        AND status IN ('queued','running')
        AND NOT EXISTS (SELECT 1 FROM cad_v2_jobs request_job WHERE request_job.client_request_id=$13)
      )
      ORDER BY CASE WHEN client_request_id=$13 THEN 0 ELSE 1 END, updated_at DESC
      LIMIT 1`;
    const selectedJobLookupSql = `
      SELECT * FROM cad_v2_jobs
      WHERE client_request_id=$1 OR (
        artifact_key=$2 AND COALESCE(share_link_id,'')=COALESCE($3,'')
        AND status IN ('queued','running')
        AND NOT EXISTS (SELECT 1 FROM cad_v2_jobs request_job WHERE request_job.client_request_id=$1)
      )
      ORDER BY CASE WHEN client_request_id=$1 THEN 0 ELSE 1 END, updated_at DESC
      LIMIT 1`;
    const selectedJobForSessionSql = `
      SELECT * FROM cad_v2_jobs
      WHERE client_request_id=$1 OR (
        artifact_key=$2 AND COALESCE(share_link_id,'')=COALESCE($3,'')
        AND status IN ('queued','running')
        AND NOT EXISTS (SELECT 1 FROM cad_v2_jobs request_job WHERE request_job.client_request_id=$1)
      )
      ORDER BY CASE WHEN client_request_id=$1 THEN 0 ELSE 1 END, updated_at DESC
      LIMIT 1`;
    const transactionResults = await this.sql.transaction([
      {
        text: `INSERT INTO cad_v2_jobs (
          id, file_id, share_link_id, source_version_key, source_sha256,
          artifact_key, status, phase, progress, scene_id, fence, attempt,
          client_request_id, error_message, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,to_timestamp($15 / 1000.0),to_timestamp($16 / 1000.0))
        ON CONFLICT DO NOTHING RETURNING id`,
        params: params.slice(0, 16),
      },
      {
        text: selectedJobLookupSql,
        params: [job.clientRequestId, input.artifactKey, job.shareLinkId || null],
      },
      {
        text: `WITH selected_job AS (${selectedJobForSessionSql})
          INSERT INTO cad_v2_view_sessions (
            id, client_request_id, file_id, share_link_id, job_id, scene_id,
            lease_expires_at, heartbeat_at, created_at
          )
          SELECT $4, $1, $5, $3, selected_job.id, selected_job.scene_id,
                 to_timestamp($8 / 1000.0), now(), to_timestamp($9 / 1000.0)
          FROM selected_job
          WHERE selected_job.file_id=$5 AND selected_job.source_version_key=$6
            AND selected_job.artifact_key=$2
            AND selected_job.source_sha256 IS NOT DISTINCT FROM $7
            AND COALESCE(selected_job.share_link_id,'')=COALESCE($3,'')
          ON CONFLICT (client_request_id) DO UPDATE
            SET lease_expires_at=EXCLUDED.lease_expires_at, heartbeat_at=now()
            WHERE cad_v2_view_sessions.file_id=EXCLUDED.file_id
              AND COALESCE(cad_v2_view_sessions.share_link_id,'')=COALESCE(EXCLUDED.share_link_id,'')
              AND cad_v2_view_sessions.job_id=EXCLUDED.job_id
          RETURNING *`,
        params: [
          job.clientRequestId, input.artifactKey, job.shareLinkId || null,
          session.viewSessionId, job.fileId, job.sourceVersionKey,
          input.sourceSha256, session.expiresAt, session.createdAt,
        ],
      },
      {
        text: `SELECT
          job.id AS job_id, job.file_id, job.share_link_id, job.source_version_key,
          job.source_sha256, job.artifact_key, job.client_request_id, job.status,
          job.phase, job.progress, job.scene_id, job.fence, job.attempt,
          job.created_at, job.updated_at, job.error_message,
          session.id AS session_id, session.file_id AS session_file_id,
          session.share_link_id AS session_share_link_id, session.job_id AS session_job_id,
          session.scene_id AS session_scene_id, session.lease_expires_at,
          session.created_at AS session_created_at
        FROM cad_v2_jobs job
        JOIN cad_v2_view_sessions session ON session.job_id=job.id
        WHERE session.client_request_id=$1`,
        params: [job.clientRequestId],
      },
    ]);

    const row = (transactionResults[3] as Array<Record<string, unknown>> | undefined)?.[0];
    if (!row) throw new Error("CAD_V2_REPOSITORY_PREPARE_FAILED: job/session kaydı transaction içinde üretilemedi.");
    const persistedJob = toJob({
      id: row.job_id, file_id: row.file_id, share_link_id: row.share_link_id,
      source_version_key: row.source_version_key, client_request_id: row.client_request_id,
      status: row.status, phase: row.phase, progress: row.progress, scene_id: row.scene_id,
      fence: row.fence, attempt: row.attempt, created_at: row.created_at,
      updated_at: row.updated_at, error_message: row.error_message,
    });
    const persistedSession = toSession({
      id: row.session_id, file_id: row.session_file_id, share_link_id: row.session_share_link_id,
      job_id: row.session_job_id, scene_id: row.session_scene_id,
      lease_expires_at: row.lease_expires_at, created_at: row.session_created_at,
    });
    if (
      persistedJob.fileId !== job.fileId || persistedJob.sourceVersionKey !== job.sourceVersionKey ||
      persistedJob.shareLinkId !== (job.shareLinkId || null) || persistedSession.fileId !== session.fileId ||
      persistedSession.shareLinkId !== (session.shareLinkId || null) ||
      persistedSession.jobId !== persistedJob.jobId ||
      String(row.artifact_key) !== input.artifactKey ||
      ((row.source_sha256 as string | null) ?? null) !== input.sourceSha256
    ) {
      throw new Error("CAD_V2_IDEMPOTENCY_CONFLICT: clientRequestId başka kaynak byte'ları, artifact, job, revision, dosya veya share için kullanılmış.");
    }
    const createdRows = transactionResults[0] as Array<Record<string, unknown>> | undefined;
    return { job: persistedJob, session: persistedSession, created: (createdRows?.length || 0) > 0 };
  }

  public async beginPublishLease(input: {
    jobId: string;
    fence: number;
    sceneId: string;
    storageGeneration: string;
    ownerId: string;
    ttlMs: number;
  }): Promise<boolean> {
    if (!input.ownerId || !Number.isSafeInteger(input.ttlMs) || input.ttlMs <= 0) {
      throw new Error("CAD_V2_PUBLISH_LEASE_INPUT_INVALID");
    }
    const rows = await this.sql.query(
      `INSERT INTO cad_v2_publish_leases (
         scene_id, storage_generation, job_id, fence, owner_id, status,
         lease_expires_at, heartbeat_at, created_at, updated_at
       )
       SELECT $1,$2,job.id,$3,$4,'active',
         now() + ($5 * interval '1 millisecond'),now(),now(),now()
       FROM cad_v2_jobs job
       WHERE job.id=$6 AND job.fence=$3 AND job.status IN ('queued','running')
       ON CONFLICT (scene_id,storage_generation) DO NOTHING
       RETURNING scene_id`,
      [input.sceneId,input.storageGeneration,input.fence,input.ownerId,input.ttlMs,input.jobId]
    );
    return rows.length > 0;
  }

  public async renewPublishLease(input: {
    jobId: string;
    fence: number;
    sceneId: string;
    storageGeneration: string;
    ownerId: string;
    ttlMs: number;
  }): Promise<boolean> {
    if (!Number.isSafeInteger(input.ttlMs) || input.ttlMs <= 0) return false;
    const rows = await this.sql.query(
      `UPDATE cad_v2_publish_leases lease
       SET lease_expires_at=now() + ($6 * interval '1 millisecond'), heartbeat_at=now(), updated_at=now()
       WHERE lease.scene_id=$1 AND lease.storage_generation=$2 AND lease.job_id=$3
         AND lease.fence=$4 AND lease.owner_id=$5 AND lease.status='active'
         AND lease.lease_expires_at > now()
         AND EXISTS (
           SELECT 1 FROM cad_v2_jobs job
           WHERE job.id=lease.job_id AND job.fence=lease.fence AND job.status IN ('queued','running')
         )
       RETURNING lease.scene_id`,
      [input.sceneId,input.storageGeneration,input.jobId,input.fence,input.ownerId,input.ttlMs]
    );
    return rows.length > 0;
  }

  public async previewExpiredPublishLeases(input: {
    graceMs: number;
    limit?: number;
  }): Promise<CadV2PublishLease[]> {
    if (!Number.isSafeInteger(input.graceMs) || input.graceMs < 0) {
      throw new Error("CAD_V2_RECONCILE_GRACE_INVALID");
    }
    const rows = await this.sql.query(
      `SELECT lease.scene_id, lease.storage_generation, lease.job_id, lease.fence,
              lease.owner_id, lease.status, lease.lease_expires_at
       FROM cad_v2_publish_leases lease
       WHERE (
           (lease.status IN ('active','reconciling')
             AND lease.lease_expires_at <= now() - ($1 * interval '1 millisecond'))
           OR (lease.status='reconciled'
             AND lease.updated_at <= now() - ($1 * interval '1 millisecond'))
         )
         AND NOT EXISTS (
           SELECT 1 FROM cad_v2_view_sessions session
           WHERE session.job_id=lease.job_id AND session.lease_expires_at > now()
         )
         AND NOT EXISTS (
           SELECT 1 FROM cad_v2_scenes scene
           WHERE scene.id=lease.scene_id AND scene.storage_generation=lease.storage_generation
             AND scene.status='ready'
         )
       ORDER BY lease.lease_expires_at ASC
       LIMIT $2`,
      [input.graceMs,input.limit ?? 100]
    );
    return rows.map((row) => ({
      sceneId: String(row.scene_id),
      storageGeneration: String(row.storage_generation),
      jobId: String(row.job_id),
      fence: Number(row.fence),
      ownerId: String(row.owner_id),
      status: String(row.status) as CadV2PublishLease["status"],
      leaseExpiresAt: asMillis(row.lease_expires_at),
    }));
  }

  public async claimExpiredPublishLease(input: {
    sceneId: string;
    storageGeneration: string;
    graceMs: number;
  }): Promise<boolean> {
    if (!Number.isSafeInteger(input.graceMs) || input.graceMs < 0) return false;
    const rows = await this.sql.query(
      `WITH target AS MATERIALIZED (
         SELECT lease.scene_id, lease.storage_generation, lease.job_id, lease.fence
         FROM cad_v2_publish_leases lease
         WHERE lease.scene_id=$1 AND lease.storage_generation=$2
           AND (
             (lease.status IN ('active','reconciling')
               AND lease.lease_expires_at <= now() - ($3 * interval '1 millisecond'))
             OR (lease.status='reconciled'
               AND lease.updated_at <= now() - ($3 * interval '1 millisecond'))
           )
           AND NOT EXISTS (
             SELECT 1 FROM cad_v2_view_sessions session
             WHERE session.job_id=lease.job_id AND session.lease_expires_at > now()
           )
           AND NOT EXISTS (
             SELECT 1 FROM cad_v2_scenes scene
             WHERE scene.id=lease.scene_id AND scene.storage_generation=lease.storage_generation
               AND scene.status='ready'
           )
         FOR UPDATE OF lease
       ), fenced_job AS (
         UPDATE cad_v2_jobs job
         SET status='failed', phase='done', progress=NULL, fence=job.fence+1,
             error_message='PUBLISH_LEASE_EXPIRED_RECONCILED', updated_at=now()
         FROM target
         WHERE job.id=target.job_id AND job.fence=target.fence
           AND job.status IN ('queued','running')
         RETURNING job.id
       ), expired_attempts AS (
         UPDATE cad_v2_job_attempts attempt
         SET status='expired', completed_at=now(),
             error_message='PUBLISH_LEASE_EXPIRED_RECONCILED'
         FROM target
         WHERE attempt.job_id=target.job_id AND attempt.fence=target.fence
           AND attempt.status NOT IN ('ready','failed','cancelled','expired','completed','succeeded')
         RETURNING attempt.id
       ), claimed AS (
         UPDATE cad_v2_publish_leases lease
         SET status='reconciling', updated_at=now()
         FROM target
         WHERE lease.scene_id=target.scene_id
           AND lease.storage_generation=target.storage_generation
           AND lease.status IN ('active','reconciling','reconciled')
         RETURNING lease.scene_id, lease.storage_generation
       ), quarantined AS (
         UPDATE cad_v2_scenes scene SET status='orphaned', updated_at=now()
         FROM claimed
         WHERE scene.id=claimed.scene_id AND scene.storage_generation=claimed.storage_generation
           AND scene.status='staging'
         RETURNING scene.id
       )
       SELECT scene_id FROM claimed`,
      [input.sceneId,input.storageGeneration,input.graceMs]
    );
    return rows.length > 0;
  }

  public async getProtectedBlobPaths(
    prefix: string,
    excludeOrphanStaging?: { sceneId: string; storageGeneration: string }
  ): Promise<Set<string>> {
    if (!prefix.endsWith("/")) throw new Error("CAD_V2_RECONCILE_PREFIX_INVALID");
    const rows = await this.sql.query(
      `SELECT object.blob_path AS blob_path
       FROM cad_v2_scene_objects object
       JOIN cad_v2_scenes scene ON scene.id=object.scene_id
       WHERE object.blob_path LIKE ($1 || '%') AND scene.status <> 'orphaned'
         AND ($2::text IS NULL OR NOT (scene.id=$2 AND scene.storage_generation=$3 AND scene.status='staging'))
       UNION
       SELECT scene.manifest_blob_path AS blob_path
       FROM cad_v2_scenes scene
       WHERE scene.manifest_blob_path LIKE ($1 || '%') AND scene.status <> 'orphaned'
         AND ($2::text IS NULL OR NOT (scene.id=$2 AND scene.storage_generation=$3 AND scene.status='staging'))`,
      [prefix,excludeOrphanStaging?.sceneId ?? null,excludeOrphanStaging?.storageGeneration ?? null]
    );
    return new Set(rows.map((row) => String(row.blob_path)));
  }

  public async finishPublishLeaseReconciliation(input: {
    sceneId: string;
    storageGeneration: string;
  }): Promise<boolean> {
    const prefix = `cad-v2/scenes/${input.sceneId}/objects/${input.storageGeneration}/`;
    const rows = await this.sql.query(
      `UPDATE cad_v2_publish_leases lease
       SET status='reconciled', updated_at=now()
       WHERE lease.scene_id=$1 AND lease.storage_generation=$2 AND lease.status='reconciling'
         AND NOT EXISTS (
           SELECT 1 FROM cad_v2_scenes scene
           WHERE scene.id=lease.scene_id AND scene.storage_generation=lease.storage_generation
             AND scene.status='ready'
         )
         AND NOT EXISTS (
           SELECT 1 FROM cad_v2_scene_objects object
           JOIN cad_v2_scenes scene ON scene.id=object.scene_id
           WHERE object.blob_path LIKE ($3 || '%') AND scene.status <> 'orphaned'
         )
         AND NOT EXISTS (
           SELECT 1 FROM cad_v2_scenes scene
           WHERE scene.manifest_blob_path LIKE ($3 || '%') AND scene.status <> 'orphaned'
         )
       RETURNING lease.scene_id`,
      [input.sceneId,input.storageGeneration,prefix]
    );
    return rows.length > 0;
  }

  public async updateJob(job: CadV2Job): Promise<boolean> {
    const rows = await this.sql.query(
      `UPDATE cad_v2_jobs SET status=$3, phase=$4, progress=$5, scene_id=$6,
         fence=$7, attempt=$8, error_message=$9, updated_at=to_timestamp($10 / 1000.0)
       WHERE id=$1 AND fence=$2 RETURNING id`,
      [job.jobId, job.fence, job.status, job.phase, job.progress ?? null, job.sceneId ?? null,
        job.fence, job.attempt, job.error ?? null, job.updatedAt]
    );
    return rows.length > 0;
  }

  public async updateClaimedJob(job: CadV2Job, ownerId: string): Promise<boolean> {
    const rows = await this.sql.query(
      `UPDATE cad_v2_jobs SET status=$3, phase=$4, progress=$5, scene_id=$6,
         fence=$7, attempt=$8, error_message=$9, updated_at=to_timestamp($10 / 1000.0)
       WHERE id=$1 AND fence=$2 AND status='running' AND worker_lease_owner_id=$11
         AND worker_lease_expires_at > now() RETURNING id`,
      [job.jobId, job.fence, job.status, job.phase, job.progress ?? null, job.sceneId ?? null,
        job.fence, job.attempt, job.error ?? null, job.updatedAt, ownerId]
    );
    return rows.length > 0;
  }

  /**
   * Claims one durable queue item. The row lock serializes competing workers;
   * the incremented fence invalidates a request process or a worker whose lease expired.
   */
  public async claimNextJob(
    ownerId: string,
    leaseMs: number,
    maxAttempts: number
  ): Promise<CadV2WorkerJobClaim | null> {
    if (!ownerId || ownerId.length > 200 || !Number.isSafeInteger(leaseMs) || leaseMs < 1 || leaseMs > 30 * 60_000) {
      throw new Error("CAD_V2_WORKER_LEASE_INPUT_INVALID");
    }
    if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) {
      throw new Error("CAD_V2_WORKER_ATTEMPT_LIMIT_INVALID");
    }
    const rows = await this.sql.query(
      `WITH exhausted AS (
         UPDATE cad_v2_jobs job
         SET status='failed', fence=job.fence+1,
             worker_lease_owner_id=NULL, worker_lease_expires_at=NULL, next_attempt_at=NULL,
             error_message=COALESCE(job.error_message, 'CAD_V2_MAX_ATTEMPTS_EXCEEDED'), updated_at=now()
         WHERE job.status IN ('queued','running') AND job.attempt >= $3
           AND (job.next_attempt_at IS NULL OR job.next_attempt_at <= now())
           AND (job.status='queued' OR job.worker_lease_expires_at IS NULL OR job.worker_lease_expires_at <= now())
         RETURNING job.id, job.attempt
       ), terminal_attempts AS (
         UPDATE cad_v2_job_attempts attempt
         SET status='failed', completed_at=now(),
             error_message=COALESCE(attempt.error_message, 'CAD_V2_MAX_ATTEMPTS_EXCEEDED')
         FROM exhausted
         WHERE attempt.job_id=exhausted.id AND attempt.attempt=exhausted.attempt AND attempt.status='running'
         RETURNING attempt.id
       ), candidate AS (
         SELECT job.id
         FROM cad_v2_jobs job
         WHERE job.status IN ('queued','running') AND job.attempt < $3
           AND (job.next_attempt_at IS NULL OR job.next_attempt_at <= now())
           AND (job.status='queued' OR job.worker_lease_expires_at IS NULL OR job.worker_lease_expires_at <= now())
         ORDER BY COALESCE(job.next_attempt_at, job.created_at), job.created_at, job.id
         LIMIT 1
         FOR UPDATE OF job SKIP LOCKED
       ), claimed AS (
         UPDATE cad_v2_jobs job
         SET status='running', fence=job.fence+1, attempt=job.attempt+1,
             worker_lease_owner_id=$1,
             worker_lease_expires_at=now() + ($2 * interval '1 millisecond'),
             next_attempt_at=NULL, updated_at=now()
         FROM candidate
         WHERE job.id=candidate.id
         RETURNING job.*
       ), recovered_attempts AS (
         UPDATE cad_v2_job_attempts attempt
         SET status='lease_expired', completed_at=now(), error_message='CAD_V2_WORKER_LEASE_EXPIRED'
         FROM claimed
         WHERE attempt.job_id=claimed.id AND attempt.attempt < claimed.attempt AND attempt.status='running'
         RETURNING attempt.id
       ), new_attempt AS (
         INSERT INTO cad_v2_job_attempts(job_id, attempt, fence, status, started_at)
         SELECT claimed.id, claimed.attempt, claimed.fence, 'running', now()
         FROM claimed
         ON CONFLICT (job_id, attempt) DO UPDATE
           SET fence=EXCLUDED.fence, status='running', started_at=now(), completed_at=NULL, error_message=NULL
         RETURNING job_id
       )
       SELECT claimed.* FROM claimed
       JOIN new_attempt ON new_attempt.job_id=claimed.id
       WHERE (SELECT count(*) FROM terminal_attempts) >= 0
         AND (SELECT count(*) FROM recovered_attempts) >= 0`,
      [ownerId, leaseMs, maxAttempts]
    );
    return rows[0] ? toWorkerClaim(rows[0]) : null;
  }

  public async heartbeatJobLease(input: {
    jobId: string;
    ownerId: string;
    fence: number;
    ttlMs: number;
  }): Promise<boolean> {
    if (!input.ownerId || input.ownerId.length > 200 || !Number.isSafeInteger(input.ttlMs) || input.ttlMs < 1 || input.ttlMs > 30 * 60_000) {
      throw new Error("CAD_V2_WORKER_LEASE_INPUT_INVALID");
    }
    const rows = await this.sql.query(
      `UPDATE cad_v2_jobs
       SET worker_lease_expires_at=now() + ($4 * interval '1 millisecond'), updated_at=now()
       WHERE id=$1 AND status='running' AND worker_lease_owner_id=$2 AND fence=$3
         AND worker_lease_expires_at > now()
       RETURNING id`,
      [input.jobId, input.ownerId, input.fence, input.ttlMs]
    );
    return rows.length > 0;
  }

  /** Returns the durable state reached by this claim, or null for a stale owner/fence. */
  public async failClaimedJob(input: {
    jobId: string;
    ownerId: string;
    fence: number;
    error: string;
    retryable: boolean;
    maxAttempts: number;
    baseRetryDelayMs: number;
  }): Promise<"queued" | "failed" | null> {
    if (!input.ownerId || input.ownerId.length > 200 || !Number.isSafeInteger(input.maxAttempts) || input.maxAttempts < 1 || input.maxAttempts > 20) {
      throw new Error("CAD_V2_WORKER_ATTEMPT_LIMIT_INVALID");
    }
    if (!Number.isSafeInteger(input.baseRetryDelayMs) || input.baseRetryDelayMs < 1 || input.baseRetryDelayMs > 300_000) {
      throw new Error("CAD_V2_WORKER_RETRY_DELAY_INVALID");
    }
    const rows = await this.sql.query<{ status: "queued" | "failed" }>(
      `WITH released AS (
         UPDATE cad_v2_jobs job
         SET status=CASE WHEN NOT $5 OR job.attempt >= $6 THEN 'failed' ELSE 'queued' END,
             fence=job.fence+1, worker_lease_owner_id=NULL, worker_lease_expires_at=NULL,
             next_attempt_at=CASE WHEN $5 AND job.attempt < $6
               THEN now() + (LEAST(300000, $7 * power(2, LEAST(GREATEST(job.attempt - 1, 0), 18))) * interval '1 millisecond')
               ELSE NULL END,
             error_message=left($4, 1000), updated_at=now()
         WHERE job.id=$1 AND job.status='running' AND job.worker_lease_owner_id=$2 AND job.fence=$3
           AND job.worker_lease_expires_at > now()
         RETURNING job.id, job.attempt, job.status, job.error_message
       ), completed_attempt AS (
         UPDATE cad_v2_job_attempts attempt
         SET status=released.status, completed_at=now(), error_message=released.error_message
         FROM released
         WHERE attempt.job_id=released.id AND attempt.attempt=released.attempt AND attempt.status='running'
         RETURNING attempt.id
       )
       SELECT released.status FROM released
       WHERE (SELECT count(*) FROM completed_attempt) >= 0`,
      [
        input.jobId,
        input.ownerId,
        input.fence,
        input.error.slice(0, 1000),
        input.retryable,
        input.maxAttempts,
        input.baseRetryDelayMs,
      ]
    );
    return rows[0]?.status ?? null;
  }

  /** Completes the worker attempt and releases its lease after READY was published. */
  public async completeClaimedJob(input: {
    jobId: string;
    ownerId: string;
    fence: number;
  }): Promise<boolean> {
    const rows = await this.sql.query(
      `WITH completed_attempt AS (
         UPDATE cad_v2_job_attempts attempt
         SET status='ready', completed_at=now(), error_message=NULL
         FROM cad_v2_jobs job
         WHERE job.id=$1 AND job.status='ready' AND job.fence=$3
           AND job.worker_lease_owner_id=$2
           AND attempt.job_id=job.id AND attempt.attempt=job.attempt
           AND attempt.fence=job.fence AND attempt.status='running'
         RETURNING attempt.job_id, attempt.attempt
       ), released AS (
         UPDATE cad_v2_jobs job
         SET worker_lease_owner_id=NULL, worker_lease_expires_at=NULL,
             next_attempt_at=NULL, updated_at=now()
         FROM completed_attempt
         WHERE job.id=completed_attempt.job_id AND job.attempt=completed_attempt.attempt
           AND job.status='ready' AND job.fence=$3 AND job.worker_lease_owner_id=$2
         RETURNING job.id
       )
       SELECT EXISTS(SELECT 1 FROM released) AND EXISTS(SELECT 1 FROM completed_attempt) AS completed`,
      [input.jobId, input.ownerId, input.fence]
    );
    return rows[0]?.completed === true;
  }

  public async getJob(jobId: string): Promise<CadV2Job | null> {
    const rows = await this.sql.query(`SELECT * FROM cad_v2_jobs WHERE id=$1 LIMIT 1`, [jobId]);
    return rows[0] ? toJob(rows[0]) : null;
  }

  public async getViewSession(viewSessionId: string): Promise<CadV2ViewSession | null> {
    const rows = await this.sql.query(
      `SELECT * FROM cad_v2_view_sessions WHERE id=$1 AND lease_expires_at > now() LIMIT 1`,
      [viewSessionId]
    );
    return rows[0] ? toSession(rows[0]) : null;
  }

  public async heartbeatViewSession(viewSessionId: string, ttlMs = 180_000): Promise<CadV2ViewSession | null> {
    const rows = await this.sql.query(
      `UPDATE cad_v2_view_sessions
       SET lease_expires_at=now() + ($2 * interval '1 millisecond'), heartbeat_at=now()
       WHERE id=$1 AND lease_expires_at > now()
       RETURNING *`,
      [viewSessionId, ttlMs]
    );
    return rows[0] ? toSession(rows[0]) : null;
  }

  public async deleteViewSession(viewSessionId: string): Promise<boolean> {
    const rows = await this.sql.query(
      `WITH deleted AS (
         DELETE FROM cad_v2_view_sessions WHERE id=$1 RETURNING job_id
       ), cancelled AS (
         UPDATE cad_v2_jobs job
         SET status='cancelled', fence=job.fence+1, updated_at=now()
         WHERE job.id IN (SELECT job_id FROM deleted WHERE job_id IS NOT NULL)
           AND job.status IN ('queued','running')
           AND NOT EXISTS (
             SELECT 1 FROM cad_v2_view_sessions other
             WHERE other.job_id=job.id AND other.id <> $1 AND other.lease_expires_at > now()
           )
         RETURNING job.id
       )
       SELECT EXISTS(SELECT 1 FROM deleted) AS deleted`,
      [viewSessionId]
    );
    return rows[0]?.deleted === true;
  }

  public async getReadyScene(sceneId: string): Promise<{
    sceneId: string;
    fileId: string;
    sourceVersionKey: string;
    sourceSha256: string;
    storageGeneration: string;
    manifestBlobPath: string;
    manifestSha256: string;
    compilerRevision: string;
    schemaVersion: number;
    renderAbi: string;
    qualityProfile: string;
    fontDigest: string;
    expectedObjectCount: number;
  } | null> {
    const rows = await this.sql.query(
      `SELECT id, file_id, source_version_key, source_sha256, storage_generation,
              manifest_blob_path, manifest_sha256, compiler_revision, schema_version,
              render_abi, quality_profile, font_digest, expected_object_count
       FROM cad_v2_scenes WHERE id=$1 AND status='ready' LIMIT 1`,
      [sceneId]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      sceneId: String(row.id), fileId: String(row.file_id),
      sourceVersionKey: String(row.source_version_key), sourceSha256: String(row.source_sha256),
      storageGeneration: String(row.storage_generation), manifestBlobPath: String(row.manifest_blob_path),
      manifestSha256: String(row.manifest_sha256), compilerRevision: String(row.compiler_revision),
      schemaVersion: Number(row.schema_version), renderAbi: String(row.render_abi),
      qualityProfile: String(row.quality_profile), fontDigest: String(row.font_digest),
      expectedObjectCount: Number(row.expected_object_count),
    };
  }

  public async getFileIdForReadyScene(sceneId: string): Promise<string | null> {
    const rows = await this.sql.query(
      `SELECT file_id FROM cad_v2_scenes WHERE id=$1 AND status='ready' LIMIT 1`, [sceneId]
    );
    return rows[0] ? String(rows[0].file_id) : null;
  }

  public async completeJobFromReadyScene(input: {
    jobId: string;
    fence: number;
    sceneId: string;
    fileId: string;
    sourceVersionKey: string;
    sourceSha256: string;
    workerOwnerId?: string | null;
  }): Promise<boolean> {
    const rows = await this.sql.query(
      `WITH ready_scene AS (
         SELECT id FROM cad_v2_scenes
         WHERE id=$3 AND status='ready' AND file_id=$4
           AND source_version_key=$5 AND source_sha256=$6
       ), updated_job AS (
         UPDATE cad_v2_jobs job SET status='ready', phase='done', progress=100,
           scene_id=$3, error_message=NULL, updated_at=now()
         WHERE job.id=$1 AND job.fence=$2 AND job.status IN ('running','queued')
           AND (($7::text IS NULL AND job.worker_lease_owner_id IS NULL) OR
             (job.worker_lease_owner_id=$7 AND job.worker_lease_expires_at > now()))
           AND EXISTS (SELECT 1 FROM ready_scene)
         RETURNING job.id
       ), updated_sessions AS (
         UPDATE cad_v2_view_sessions session SET scene_id=$3
         FROM updated_job job
         WHERE session.job_id=job.id AND session.file_id=$4
         RETURNING session.id
       )
       SELECT EXISTS(SELECT 1 FROM updated_job) AS completed`,
      [input.jobId,input.fence,input.sceneId,input.fileId,input.sourceVersionKey,input.sourceSha256,input.workerOwnerId ?? null]
    );
    return rows[0]?.completed === true;
  }

  public async getReadySceneObject(sceneId: string, objectId: string): Promise<CadV2SceneObjectRecord | null> {
    const rows = await this.sql.query(
      `SELECT object.object_id, object.object_type, object.byte_length, object.sha256, object.blob_path
       FROM cad_v2_scene_objects object
       JOIN cad_v2_scenes scene ON scene.id=object.scene_id AND scene.status='ready'
       WHERE object.scene_id=$1 AND object.object_id=$2 LIMIT 1`,
      [sceneId, objectId]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      objectId: String(row.object_id), objectType: String(row.object_type) as CadV2SceneObjectRecord["objectType"],
      byteLength: Number(row.byte_length), sha256: String(row.sha256), blobPath: String(row.blob_path),
    };
  }

  public async publishSceneAndCompleteJob(input: CadV2PublishSceneInput): Promise<boolean> {
    if (input.objects.length === 0 || new Set(input.objects.map((object) => object.objectId)).size !== input.objects.length) {
      throw new Error("CAD_V2_PUBLISH_OBJECT_SET_INVALID: nesne kümesi boş veya yinelenen kimlik içeriyor.");
    }
    for (const object of input.objects) {
      if (!Number.isSafeInteger(object.byteLength) || object.byteLength < 0 || !/^[a-f0-9]{64}$/i.test(object.sha256)) {
        throw new Error(`CAD_V2_PUBLISH_OBJECT_INVALID: ${object.objectId}`);
      }
    }
    const objectJson = JSON.stringify(input.objects.map((object) => ({
      object_id: object.objectId, object_type: object.objectType,
      byte_length: object.byteLength, sha256: object.sha256, blob_path: object.blobPath,
    })));
    const statements: CadV2SqlStatement[] = [
      {
        text: `SELECT job.id FROM cad_v2_jobs job
          JOIN cad_v2_publish_leases lease ON lease.job_id=job.id
          WHERE job.id=$1 AND job.fence=$2 AND job.status IN ('running','queued')
            AND lease.fence=$2 AND lease.owner_id=$3 AND lease.scene_id=$4
            AND lease.storage_generation=$5 AND lease.status='active'
            AND lease.lease_expires_at > now()
            AND (($6::text IS NULL AND job.worker_lease_owner_id IS NULL) OR
              (job.worker_lease_owner_id=$6 AND job.worker_lease_expires_at > now()))
          FOR UPDATE OF job, lease`,
        params: [input.jobId,input.fence,input.leaseOwnerId,input.sceneId,input.storageGeneration,input.workerOwnerId ?? null],
      },
      {
        text: `INSERT INTO cad_v2_scenes (
          id, artifact_key, tenant_scope, file_id, source_version_key, source_sha256,
          manifest_sha256, manifest_blob_path, storage_generation, compiler_revision,
          schema_version, render_abi, quality_profile, font_digest, status, publish_token,
          expected_object_count, updated_at
        )
        SELECT $3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'staging',$11,$17,now()
        WHERE EXISTS (SELECT 1 FROM cad_v2_jobs job WHERE job.id=$1 AND job.fence=$2 AND job.status IN ('running','queued')
          AND (($19::text IS NULL AND job.worker_lease_owner_id IS NULL) OR
            (job.worker_lease_owner_id=$19 AND job.worker_lease_expires_at > now())))
          AND EXISTS (SELECT 1 FROM cad_v2_publish_leases lease
            WHERE lease.job_id=$1 AND lease.fence=$2 AND lease.owner_id=$18
              AND lease.scene_id=$3 AND lease.storage_generation=$11
              AND lease.status='active' AND lease.lease_expires_at > now())
        ON CONFLICT (id) DO UPDATE SET
          artifact_key=EXCLUDED.artifact_key, tenant_scope=EXCLUDED.tenant_scope,
          file_id=EXCLUDED.file_id, source_version_key=EXCLUDED.source_version_key,
          source_sha256=EXCLUDED.source_sha256, manifest_sha256=EXCLUDED.manifest_sha256,
          manifest_blob_path=EXCLUDED.manifest_blob_path, storage_generation=EXCLUDED.storage_generation,
          compiler_revision=EXCLUDED.compiler_revision, schema_version=EXCLUDED.schema_version,
          render_abi=EXCLUDED.render_abi, quality_profile=EXCLUDED.quality_profile,
          font_digest=EXCLUDED.font_digest, status='staging', publish_token=EXCLUDED.publish_token,
          expected_object_count=EXCLUDED.expected_object_count, updated_at=now()
        WHERE cad_v2_scenes.status <> 'ready'
        RETURNING id`,
        params: [input.jobId,input.fence,input.sceneId,input.artifactKey,input.tenantScope,input.fileId,
          input.sourceVersionKey,input.sourceSha256,input.manifestSha256,input.manifestBlobPath,
          input.storageGeneration,input.compilerRevision,input.schemaVersion,input.renderAbi,
          input.qualityProfile,input.fontDigest,input.objects.length,input.leaseOwnerId,input.workerOwnerId ?? null],
      },
      {
        text: `DELETE FROM cad_v2_scene_objects
          WHERE scene_id=$1 AND EXISTS (
            SELECT 1 FROM cad_v2_scenes WHERE id=$1 AND status='staging' AND publish_token=$2
          ) AND EXISTS (
            SELECT 1 FROM cad_v2_jobs job WHERE job.id=$3 AND job.fence=$4 AND job.status IN ('running','queued')
              AND (($6::text IS NULL AND job.worker_lease_owner_id IS NULL) OR
                (job.worker_lease_owner_id=$6 AND job.worker_lease_expires_at > now()))
          ) AND EXISTS (
            SELECT 1 FROM cad_v2_publish_leases lease
            WHERE lease.job_id=$3 AND lease.fence=$4 AND lease.owner_id=$5
              AND lease.scene_id=$1 AND lease.storage_generation=$2
              AND lease.status='active' AND lease.lease_expires_at > now()
          )`,
        params: [input.sceneId,input.storageGeneration,input.jobId,input.fence,input.leaseOwnerId,input.workerOwnerId ?? null],
      },
      {
        text: `INSERT INTO cad_v2_scene_objects(scene_id,object_id,object_type,byte_length,sha256,blob_path)
          SELECT $3, objects.object_id, objects.object_type, objects.byte_length, objects.sha256, objects.blob_path
          FROM jsonb_to_recordset($5::jsonb) AS objects(
            object_id TEXT, object_type TEXT, byte_length BIGINT, sha256 TEXT, blob_path TEXT
          )
          JOIN cad_v2_scenes scene ON scene.id=$3 AND scene.status='staging' AND scene.publish_token=$4
          WHERE EXISTS (SELECT 1 FROM cad_v2_jobs job WHERE job.id=$1 AND job.fence=$2 AND job.status IN ('running','queued')
            AND (($7::text IS NULL AND job.worker_lease_owner_id IS NULL) OR
              (job.worker_lease_owner_id=$7 AND job.worker_lease_expires_at > now())))
            AND EXISTS (SELECT 1 FROM cad_v2_publish_leases lease
              WHERE lease.job_id=$1 AND lease.fence=$2 AND lease.owner_id=$6
                AND lease.scene_id=$3 AND lease.storage_generation=$4
                AND lease.status='active' AND lease.lease_expires_at > now())
          ON CONFLICT(scene_id,object_id) DO UPDATE SET
            object_type=EXCLUDED.object_type, byte_length=EXCLUDED.byte_length,
            sha256=EXCLUDED.sha256, blob_path=EXCLUDED.blob_path`,
        params: [input.jobId,input.fence,input.sceneId,input.storageGeneration,objectJson,input.leaseOwnerId,input.workerOwnerId ?? null],
      },
      {
        text: `UPDATE cad_v2_scenes scene SET status='ready', updated_at=now()
          WHERE scene.id=$3 AND scene.status='staging' AND scene.publish_token=$4
            AND scene.expected_object_count=$5
            AND (SELECT count(*) FROM cad_v2_scene_objects object WHERE object.scene_id=scene.id)=$5
            AND EXISTS (SELECT 1 FROM cad_v2_jobs job WHERE job.id=$1 AND job.fence=$2 AND job.status IN ('running','queued')
              AND (($7::text IS NULL AND job.worker_lease_owner_id IS NULL) OR
                (job.worker_lease_owner_id=$7 AND job.worker_lease_expires_at > now())))
            AND EXISTS (SELECT 1 FROM cad_v2_publish_leases lease
              WHERE lease.job_id=$1 AND lease.fence=$2 AND lease.owner_id=$6
                AND lease.scene_id=$3 AND lease.storage_generation=$4
                AND lease.status='active' AND lease.lease_expires_at > now())
          RETURNING scene.id`,
        params: [input.jobId,input.fence,input.sceneId,input.storageGeneration,input.objects.length,input.leaseOwnerId,input.workerOwnerId ?? null],
      },
      {
        text: `UPDATE cad_v2_jobs job SET status='ready', phase='done', progress=100,
            scene_id=$3, error_message=NULL, updated_at=now()
          WHERE job.id=$1 AND job.fence=$2 AND job.status IN ('running','queued')
            AND (($6::text IS NULL AND job.worker_lease_owner_id IS NULL) OR
              (job.worker_lease_owner_id=$6 AND job.worker_lease_expires_at > now()))
            AND EXISTS (SELECT 1 FROM cad_v2_scenes WHERE id=$3 AND status='ready' AND publish_token=$4)
            AND EXISTS (SELECT 1 FROM cad_v2_publish_leases lease
              WHERE lease.job_id=$1 AND lease.fence=$2 AND lease.owner_id=$5
                AND lease.scene_id=$3 AND lease.storage_generation=$4
                AND lease.status='active' AND lease.lease_expires_at > now())
          RETURNING job.id`,
        params: [input.jobId,input.fence,input.sceneId,input.storageGeneration,input.leaseOwnerId,input.workerOwnerId ?? null],
      },
      {
        text: `UPDATE cad_v2_view_sessions SET scene_id=$1
          WHERE job_id=$2 AND file_id=$3 AND EXISTS (
            SELECT 1 FROM cad_v2_jobs job
            JOIN cad_v2_scenes scene ON scene.id=job.scene_id AND scene.status='ready'
            WHERE job.id=$2 AND job.status='ready' AND job.scene_id=$1
          )`,
        params: [input.sceneId,input.jobId,input.fileId],
      },
      {
        text: `UPDATE cad_v2_publish_leases lease SET status='published', updated_at=now()
          WHERE lease.scene_id=$1 AND lease.storage_generation=$2 AND lease.job_id=$3
            AND lease.fence=$4 AND lease.owner_id=$5 AND lease.status='active'
            AND lease.lease_expires_at > now()
            AND EXISTS (SELECT 1 FROM cad_v2_jobs job
              JOIN cad_v2_scenes scene ON scene.id=job.scene_id AND scene.status='ready'
              WHERE job.id=$3 AND job.fence=$4 AND job.status='ready'
                AND scene.id=$1 AND scene.storage_generation=$2
                AND (($6::text IS NULL AND job.worker_lease_owner_id IS NULL) OR
                  (job.worker_lease_owner_id=$6 AND job.worker_lease_expires_at > now())))
          RETURNING lease.scene_id`,
        params: [input.sceneId,input.storageGeneration,input.jobId,input.fence,input.leaseOwnerId,input.workerOwnerId ?? null],
      },
      {
        text: `SELECT job.status AS job_status, scene.status AS scene_status,
            scene.storage_generation, scene.expected_object_count,
            (SELECT count(*) FROM cad_v2_scene_objects object WHERE object.scene_id=scene.id) AS actual_object_count,
            lease.status AS lease_status
          FROM cad_v2_jobs job JOIN cad_v2_scenes scene ON scene.id=$1
          JOIN cad_v2_publish_leases lease ON lease.scene_id=scene.id
            AND lease.storage_generation=scene.storage_generation
          WHERE job.id=$2 AND (($3::text IS NULL AND job.worker_lease_owner_id IS NULL) OR
            (job.worker_lease_owner_id=$3 AND job.worker_lease_expires_at > now()))`,
        params: [input.sceneId,input.jobId,input.workerOwnerId ?? null],
      },
    ];
    const results = await this.sql.transaction(statements);
    const finalRows = results[results.length - 1] as Array<Record<string, unknown>> | undefined;
    const result = finalRows?.[0];
    return result?.job_status === "ready" && result?.scene_status === "ready" &&
      result?.storage_generation === input.storageGeneration &&
      Number(result?.expected_object_count) === input.objects.length &&
      Number(result?.actual_object_count) === input.objects.length &&
      result?.lease_status === "published";
  }
}
