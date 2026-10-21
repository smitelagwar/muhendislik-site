import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import {
  CadV2DurableRepository,
  type CadV2SqlExecutor,
  type CadV2SqlStatement,
} from "../../src/lib/cad-v2/db/repository";
import { applyCadV2DurableRepositoryMigration } from "../../src/lib/cad-v2/db/migrate";
import {
  CadV2DurableService,
  type CadV2BlobStorageAdapter,
  type CadV2Job,
  type CadV2ViewSession,
} from "../../src/lib/cad-v2/service/cad-v2-durable-service";

function pgliteExecutor(database: PGlite): CadV2SqlExecutor {
  return {
    query: async <T extends Record<string, unknown>>(text: string, params: readonly unknown[] = []) => {
      const result = await database.query<T>(text, [...params]);
      return result.rows;
    },
    transaction: async (statements: readonly CadV2SqlStatement[]) => {
      await database.exec("BEGIN");
      try {
        const results: unknown[][] = [];
        for (const statement of statements) {
          const result = await database.query(statement.text, [...(statement.params || [])]);
          results.push(result.rows as unknown[]);
        }
        await database.exec("COMMIT");
        return results;
      } catch (error) {
        await database.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

function makePreparedRecords(suffix: string, overrides: Partial<CadV2Job> = {}) {
  const now = Date.now();
  const job: CadV2Job = {
    jobId: `job_repo_${suffix}`,
    fileId: `file_repo_${suffix}`,
    shareLinkId: `share_repo_${suffix}`,
    sourceVersionKey: `rev_repo_${suffix}`,
    clientRequestId: `request_repo_${suffix}`,
    status: "running",
    phase: "source",
    progress: 0,
    fence: 1,
    attempt: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
  const session: CadV2ViewSession = {
    viewSessionId: `vs_repo_${suffix}`,
    fileId: job.fileId,
    shareLinkId: job.shareLinkId,
    jobId: job.jobId,
    expiresAt: now + 180_000,
    createdAt: now,
  };
  return { job, session, artifactKey: `artifact_repo_${suffix}`, sourceSha256: "a".repeat(64) };
}

function buildPublishInput(suffix: string, jobId: string, objects: CadV2PublishObject[]) {
  return {
    jobId,
    fence: 1,
    leaseOwnerId: `lease_owner_${suffix}`,
    sceneId: `scene_repo_${suffix}`,
    fileId: `file_repo_${suffix}`,
    sourceVersionKey: `rev_repo_${suffix}`,
    sourceSha256: "a".repeat(64),
    artifactKey: `artifact_repo_${suffix}`,
    tenantScope: `tenant_repo_${suffix}`,
    storageGeneration: `g_repo_${suffix}`,
    compilerRevision: "cad-v2-compiler-2026.09-v71",
    schemaVersion: 1,
    renderAbi: "three172-cad2d-v2",
    qualityProfile: "cad-v2-2d-v1",
    fontDigest: "test-font-sha256",
    manifestSha256: "b".repeat(64),
    manifestBlobPath: `cad-v2/scenes/scene_repo_${suffix}/objects/g_repo_${suffix}/manifest.json`,
    objects,
  };
}

async function beginTestPublishLease(repository: CadV2DurableRepository, input: ReturnType<typeof buildPublishInput>) {
  assert.equal(await repository.beginPublishLease({
    jobId: input.jobId,
    fence: input.fence,
    sceneId: input.sceneId,
    storageGeneration: input.storageGeneration,
    ownerId: input.leaseOwnerId,
    ttlMs: 60_000,
  }), true, "test publisher must acquire a durable generation lease before upload/publish");
}

type CadV2PublishObject = {
  objectId: string;
  objectType: "chunk" | "index" | "metadata" | "manifest";
  byteLength: number;
  sha256: string;
  blobPath: string;
};

class IsolatedFileBlobStore implements CadV2BlobStorageAdapter {
  constructor(private readonly root: string) {}

  isConfigured() { return true; }

  async put(pathname: string, body: string | Uint8Array): Promise<void> {
    const segments = pathname.split("/");
    if (!segments.length || segments.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) {
      throw new Error("CAD_V2_TEST_BLOB_PATH_INVALID");
    }
    const target = path.resolve(this.root, ...segments);
    if (!target.startsWith(`${path.resolve(this.root)}${path.sep}`)) throw new Error("CAD_V2_TEST_BLOB_PATH_ESCAPE");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const bytes = typeof body === "string" ? Buffer.from(body, "utf8") : Buffer.from(body);
    const temporary = `${target}.${crypto.randomUUID()}.tmp`;
    fs.writeFileSync(temporary, bytes);
    fs.renameSync(temporary, target);
  }

  async get(pathname: string): Promise<Uint8Array | null> {
    const segments = pathname.split("/");
    if (!segments.length || segments.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) return null;
    const target = path.resolve(this.root, ...segments);
    if (!target.startsWith(`${path.resolve(this.root)}${path.sep}`) || !fs.existsSync(target)) return null;
    return new Uint8Array(fs.readFileSync(target));
  }
}

class FaultInjectingBlobStore implements CadV2BlobStorageAdapter {
  public failureCount = 0;

  constructor(
    private readonly backing: IsolatedFileBlobStore,
    private readonly failedObjectType: "chunk" | "index" | "metadata" | "manifest"
  ) {}

  isConfigured() { return this.backing.isConfigured(); }

  async put(pathname: string, body: string | Uint8Array, _options?: Record<string, unknown>): Promise<void> {
    const basename = path.posix.basename(pathname);
    const objectType = basename.endsWith(".bin")
      ? "chunk"
      : basename.startsWith("index_")
        ? "index"
        : basename.startsWith("meta_")
          ? "metadata"
          : basename === "manifest.json"
            ? "manifest"
            : null;
    if (objectType === this.failedObjectType && this.failureCount === 0) {
      this.failureCount++;
      throw new Error(`INJECTED_BLOB_PUT_FAILURE:${objectType}:${pathname}`);
    }
    await this.backing.put(pathname, body);
  }

  async get(pathname: string) { return this.backing.get(pathname); }
}

function makeObject(suffix: string, objectId: string, objectType: CadV2PublishObject["objectType"]): CadV2PublishObject {
  const bytes = Buffer.from(`isolated-cad-v2-test-object:${suffix}:${objectId}`, "utf8");
  return {
    objectId,
    objectType,
    byteLength: bytes.byteLength,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    blobPath: `cad-v2/scenes/scene_repo_${suffix}/objects/g_repo_${suffix}/${objectId}`,
  };
}

async function runChild(role: string, databaseDir: string) {
  const database = new PGlite(databaseDir);
  await database.waitReady;
  const executor = pgliteExecutor(database);
  const repository = new CadV2DurableRepository(executor);
  try {
    if (role === "writer") {
      const input = makePreparedRecords("cold", {
        jobId: "job_repo_cold", fileId: "file_repo_cold", shareLinkId: "share_repo_cold",
        sourceVersionKey: "rev_repo_cold", clientRequestId: "request_repo_cold",
      });
      const created = await repository.createPreparedRecords(input);
      const objects = [makeObject("cold", "chunk_model_001.bin", "chunk"), makeObject("cold", "manifest.json", "manifest")];
      const publishInput = buildPublishInput("cold", created.job.jobId, objects);
      await beginTestPublishLease(repository, publishInput);
      const published = await repository.publishSceneAndCompleteJob(publishInput);
      assert.equal(published, true, "A process must atomically commit the exact object set and READY pointer");
      console.log("CAD_V2_REPO_CHILD_OK role=writer");
      return;
    }
    if (role === "manifest-reader") {
      const scene = await repository.getReadyScene("scene_repo_cold");
      assert.ok(scene, "B process must resolve the ready manifest pointer from PostgreSQL state");
      assert.equal(scene!.storageGeneration, "g_repo_cold");
      assert.equal(scene!.manifestBlobPath, "cad-v2/scenes/scene_repo_cold/objects/g_repo_cold/manifest.json");
      assert.equal(scene!.expectedObjectCount, 2);
      console.log("CAD_V2_REPO_CHILD_OK role=manifest-reader");
      return;
    }
    if (role === "object-reader") {
      const scene = await repository.getReadyScene("scene_repo_cold");
      const objects = await executor.query(
        `SELECT object_id, object_type, byte_length, sha256, blob_path
         FROM cad_v2_scene_objects WHERE scene_id=$1 ORDER BY object_id`, ["scene_repo_cold"]
      );
      assert.ok(scene, "C process must independently observe the READY scene");
      assert.equal(objects.length, 2);
      assert.deepEqual(objects.map((object) => object.object_id), ["chunk_model_001.bin", "manifest.json"]);
      assert.ok(objects.every((object) => Number(object.byte_length) > 0 && /^[a-f0-9]{64}$/.test(String(object.sha256))));
      console.log("CAD_V2_REPO_CHILD_OK role=object-reader");
      return;
    }
    if (role === "worker-reclaim") {
      const claim = await repository.claimNextJob("compiler-worker-after-process-restart", 60_000, 3);
      assert.equal(claim?.jobId, "job_repo_process_recovery");
      assert.equal(claim?.attempt, 2, "a new OS process must resume the durable job as the next attempt");
      assert.ok(claim!.fence > 2, "restarted worker must advance the fence after the abandoned process");
      console.log("CAD_V2_REPO_CHILD_OK role=worker-reclaim");
      return;
    }
    throw new Error(`Unknown child role: ${role}`);
  } finally {
    await database.close();
  }
}

function runIsolatedChild(role: string, databaseDir: string) {
  const result = spawnSync(process.execPath, ["--import", "tsx", "tests/cad-v2/durable-repository.test.ts"], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: 60_000,
    windowsHide: true,
    env: {
      ...process.env,
      DATABASE_URL: "",
      POSTGRES_URL: "",
      BLOB_READ_WRITE_TOKEN: "",
      BLOB_STORE_ID: "",
      VERCEL: "",
      VERCEL_ENV: "",
      CAD_V2_REPOSITORY_CHILD: role,
      CAD_V2_REPOSITORY_DB_DIR: databaseDir,
    },
  });
  if (result.error || result.status !== 0 || !result.stdout.includes(`CAD_V2_REPO_CHILD_OK role=${role}`)) {
    throw new Error(
      `CAD_V2_REPOSITORY_CHILD_FAILED (${role}): ${result.error?.message || `exit=${result.status}`}\n${result.stdout}\n${result.stderr}`
    );
  }
}

async function runMigrationAndRepositoryTests() {
  const externalConfigPresent = ["DATABASE_URL", "POSTGRES_URL", "BLOB_READ_WRITE_TOKEN", "BLOB_STORE_ID", "VERCEL", "VERCEL_ENV"]
    .some((name) => Boolean(process.env[name]));
  if (externalConfigPresent) {
    throw new Error("CAD_V2_REPOSITORY_TEST_UNSAFE: dış DB/Blob/Vercel ayarı görülürse test çalışmaz.");
  }

  const migrationDb = new PGlite();
  await migrationDb.waitReady;
  try {
    await applyCadV2DurableRepositoryMigration(pgliteExecutor(migrationDb));
    const version = await migrationDb.query<{ version: string }>(
      `SELECT version FROM cad_v2_schema_migrations WHERE version='001_durable_repository'`
    );
    assert.equal(version.rows.length, 1, "migration ledger should record this schema version");
    const workerVersion = await migrationDb.query<{ version: string }>(
      `SELECT version FROM cad_v2_schema_migrations WHERE version='003_durable_worker_leases'`
    );
    assert.equal(workerVersion.rows.length, 1, "migration ledger should record durable worker lease support");
    const workerColumns = await migrationDb.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='cad_v2_jobs' AND column_name IN ('worker_lease_owner_id','worker_lease_expires_at','next_attempt_at')`
    );
    assert.deepEqual(workerColumns.rows.map((row) => row.column_name).sort(), [
      "next_attempt_at", "worker_lease_expires_at", "worker_lease_owner_id",
    ]);
    const idType = await migrationDb.query<{ data_type: string }>(
      `SELECT data_type FROM information_schema.columns WHERE table_name='cad_v2_jobs' AND column_name='id'`
    );
    assert.equal(idType.rows[0]?.data_type, "text", "fresh schema must accept prefixed public IDs");
  } finally {
    await migrationDb.close();
  }

  const upgradeDb = new PGlite();
  await upgradeDb.waitReady;
  try {
    const legacySchema = fs.readFileSync(path.resolve(process.cwd(), "tests/cad-v2/fixtures/cad-v2-schema-legacy.sql"), "utf8");
    await upgradeDb.exec(legacySchema);
    await applyCadV2DurableRepositoryMigration(pgliteExecutor(upgradeDb));
    await applyCadV2DurableRepositoryMigration(pgliteExecutor(upgradeDb));
    const preserved = await upgradeDb.query<{ id: string; status: string }>(
      `SELECT id,status FROM cad_v2_jobs WHERE client_request_id='legacy-ready-request'`
    );
    assert.equal(preserved.rows[0]?.id, "00000000-0000-4000-8000-000000000003", "UUID history must survive TEXT conversion");
    assert.equal(preserved.rows[0]?.status, "ready");
    const legacyScene = await upgradeDb.query<{ id: string; status: string; file_id: string | null }>(
      `SELECT id,status,file_id FROM cad_v2_scenes WHERE id='00000000-0000-4000-8000-000000000002'`
    );
    assert.equal(legacyScene.rows[0]?.status, "legacy_unverified", "legacy artifact must fail closed until its object set is verified");
    assert.equal(legacyScene.rows[0]?.file_id, null, "migration must not invent missing scene-to-file mapping");
    const migratedAttempt = await upgradeDb.query<{ job_id: string }>(`SELECT job_id FROM cad_v2_job_attempts LIMIT 1`);
    assert.equal(migratedAttempt.rows[0]?.job_id, "00000000-0000-4000-8000-000000000001", "foreign-key IDs must retain exact values");
    await upgradeDb.query(
      `INSERT INTO cad_v2_jobs(id,file_id,source_version_key,source_sha256,artifact_key,status,phase,client_request_id)
       VALUES ('job_active_other','legacy-file','legacy-rev','dddddddd','legacy-other-artifact','queued','source','legacy-queued-request')`
    );
    await assert.rejects(
      upgradeDb.query(
        `INSERT INTO cad_v2_jobs(id,file_id,source_version_key,source_sha256,artifact_key,status,phase,client_request_id)
         VALUES ('job_duplicate_request','legacy-file','legacy-rev','dddddddd','other-artifact','queued','source','legacy-ready-request')`
      ),
      /duplicate key|unique/i,
      "client request id must be unique after migration"
    );
    const jobIndexes = await upgradeDb.query<{ indexname: string; indexdef: string }>(
      `SELECT indexname,indexdef FROM pg_indexes WHERE tablename='cad_v2_jobs'`
    );
    assert.ok(jobIndexes.rows.some((row) => row.indexname === "uq_cad_v2_jobs_client_request"));
    assert.ok(jobIndexes.rows.some((row) => row.indexname === "uq_cad_v2_jobs_active_artifact_share"));
    assert.ok(!jobIndexes.rows.some((row) => /UNIQUE.*\(artifact_key, status\)/i.test(row.indexdef)),
      "legacy (artifact_key,status) uniqueness must be removed");
  } finally {
    await upgradeDb.close();
  }

  const workerDb = new PGlite();
  await workerDb.waitReady;
  const workerExecutor = pgliteExecutor(workerDb);
  const workerRepository = new CadV2DurableRepository(workerExecutor);
  try {
    await applyCadV2DurableRepositoryMigration(workerExecutor);
    const workerA = makePreparedRecords("worker-claim-a", { status: "queued", attempt: 0 });
    const workerB = makePreparedRecords("worker-claim-b", { status: "queued", attempt: 0 });
    await workerRepository.createPreparedRecords(workerA);
    await workerRepository.createPreparedRecords(workerB);
    const simultaneousClaims = await Promise.all([
      workerRepository.claimNextJob("compiler-worker-a", 60_000, 3),
      workerRepository.claimNextJob("compiler-worker-b", 60_000, 3),
    ]);
    assert.ok(simultaneousClaims.every(Boolean), "two compiler workers should claim two queued jobs");
    assert.equal(new Set(simultaneousClaims.map((claim) => claim?.jobId)).size, 2, "a durable job can only be claimed once per live lease");

    const recoverable = makePreparedRecords("worker-recovery", { status: "queued", attempt: 0 });
    await workerRepository.createPreparedRecords(recoverable);
    const firstClaim = await workerRepository.claimNextJob("compiler-worker-before-restart", 20, 3);
    assert.equal(firstClaim?.jobId, recoverable.job.jobId);
    assert.equal(firstClaim?.attempt, 1);
    assert.equal(firstClaim?.fence, 2, "a claim must fence out any request-process writer");
    assert.equal(firstClaim?.workerOwnerId, "compiler-worker-before-restart");
    assert.ok(firstClaim!.workerLeaseExpiresAt > Date.now());
    assert.equal(await workerRepository.heartbeatJobLease({
      jobId: firstClaim!.jobId, ownerId: "wrong-worker", fence: firstClaim!.fence, ttlMs: 60_000,
    }), false, "a different worker cannot extend the lease");
    assert.equal(await workerRepository.heartbeatJobLease({
      jobId: firstClaim!.jobId, ownerId: "compiler-worker-before-restart", fence: firstClaim!.fence, ttlMs: 20,
    }), true, "the active worker can heartbeat its exact fence");
    await new Promise((resolve) => setTimeout(resolve, 35));

    const restartedWorkerRepository = new CadV2DurableRepository(workerExecutor);
    const recoveredClaim = await restartedWorkerRepository.claimNextJob("compiler-worker-after-restart", 60_000, 3);
    assert.equal(recoveredClaim?.jobId, firstClaim?.jobId, "a new process can reclaim an expired durable job");
    assert.equal(recoveredClaim?.attempt, 2, "recovery increments the durable attempt count");
    assert.ok(recoveredClaim!.fence > firstClaim!.fence, "recovery advances the fencing token");
    const expiredAttempt = await workerExecutor.query<{ status: string; error_message: string }>(
      `SELECT status,error_message FROM cad_v2_job_attempts WHERE job_id=$1 AND attempt=1`,
      [recoverable.job.jobId]
    );
    assert.equal(expiredAttempt[0]?.status, "lease_expired");
    assert.equal(expiredAttempt[0]?.error_message, "CAD_V2_WORKER_LEASE_EXPIRED");
    assert.equal(await workerRepository.heartbeatJobLease({
      jobId: firstClaim!.jobId, ownerId: "compiler-worker-before-restart", fence: firstClaim!.fence, ttlMs: 60_000,
    }), false, "a stale process cannot heartbeat after recovery");
    assert.equal(await restartedWorkerRepository.failClaimedJob({
      jobId: recoveredClaim!.jobId,
      ownerId: "compiler-worker-after-restart",
      fence: recoveredClaim!.fence,
      error: "TEMPORARY_COMPILER_FAILURE",
      retryable: true,
      maxAttempts: 3,
      baseRetryDelayMs: 15,
    }), "queued", "a retryable failure before the attempt limit returns to the durable queue");
    assert.equal(await restartedWorkerRepository.failClaimedJob({
      jobId: firstClaim!.jobId,
      ownerId: "compiler-worker-before-restart",
      fence: firstClaim!.fence,
      error: "STALE_WORKER_FAILURE",
      retryable: true,
      maxAttempts: 3,
      baseRetryDelayMs: 15,
    }), null, "a stale process cannot change a job after the lease was reclaimed");
    assert.equal(await restartedWorkerRepository.claimNextJob("compiler-worker-too-early", 60_000, 3), null,
      "retry is not visible before its exponential backoff elapses");
    await new Promise((resolve) => setTimeout(resolve, 40));
    const finalClaim = await restartedWorkerRepository.claimNextJob("compiler-worker-final", 60_000, 3);
    assert.equal(finalClaim?.jobId, recoverable.job.jobId);
    assert.equal(finalClaim?.attempt, 3);
    assert.equal(await restartedWorkerRepository.failClaimedJob({
      jobId: finalClaim!.jobId,
      ownerId: "compiler-worker-final",
      fence: finalClaim!.fence,
      error: "REPEATED_COMPILER_FAILURE",
      retryable: true,
      maxAttempts: 3,
      baseRetryDelayMs: 15,
    }), "failed", "the maximum attempt count is terminal");
    assert.equal(await restartedWorkerRepository.failClaimedJob({
      jobId: finalClaim!.jobId,
      ownerId: "compiler-worker-final",
      fence: finalClaim!.fence,
      error: "STALE_TERMINAL_FAILURE",
      retryable: false,
      maxAttempts: 3,
      baseRetryDelayMs: 1,
    }), null, "terminal job state is immutable to an expired worker claim");

    const crashAtLimit = makePreparedRecords("worker-crash-at-limit", {
      status: "queued", attempt: 2, fence: 7,
    });
    await restartedWorkerRepository.createPreparedRecords(crashAtLimit);
    const lastAllowedClaim = await restartedWorkerRepository.claimNextJob("compiler-worker-crash-at-limit", 20, 3);
    assert.equal(lastAllowedClaim?.jobId, crashAtLimit.job.jobId);
    assert.equal(lastAllowedClaim?.attempt, 3);
    await new Promise((resolve) => setTimeout(resolve, 35));
    assert.equal(await restartedWorkerRepository.claimNextJob("compiler-worker-after-final-crash", 60_000, 3), null);
    assert.equal((await restartedWorkerRepository.getJob(crashAtLimit.job.jobId))?.status, "failed",
      "an abandoned final attempt must be terminalized after its lease expires");
    const finalAttempt = await workerExecutor.query<{ status: string; error_message: string }>(
      `SELECT status,error_message FROM cad_v2_job_attempts WHERE job_id=$1 AND attempt=3`,
      [crashAtLimit.job.jobId]
    );
    assert.equal(finalAttempt[0]?.status, "failed");
    assert.equal(finalAttempt[0]?.error_message, "CAD_V2_MAX_ATTEMPTS_EXCEEDED");
  } finally {
    await workerDb.close();
  }

  const repoDb = new PGlite();
  await repoDb.waitReady;
  const executor = pgliteExecutor(repoDb);
  const repository = new CadV2DurableRepository(executor);
  try {
    await applyCadV2DurableRepositoryMigration(executor);
    const input = makePreparedRecords("atomic");
    const first = await repository.createPreparedRecords(input);
    assert.equal(first.created, true);
    assert.equal(first.job.jobId, input.job.jobId);
    assert.equal(first.session.viewSessionId, input.session.viewSessionId);
    const concurrentRequests = await Promise.all(Array.from({ length: 9 }, (_, index) => {
      const concurrent = makePreparedRecords(`atomic-concurrent-${index + 1}`, {
        fileId: input.job.fileId,
        shareLinkId: input.job.shareLinkId,
        sourceVersionKey: input.job.sourceVersionKey,
      });
      concurrent.artifactKey = input.artifactKey;
      concurrent.sourceSha256 = input.sourceSha256;
      return repository.createPreparedRecords(concurrent);
    }));
    assert.ok(concurrentRequests.every((request) => request.job.jobId === first.job.jobId));
    assert.ok(concurrentRequests.every((request) => !request.created));
    assert.equal(new Set(concurrentRequests.map((request) => request.session.viewSessionId)).size, 9);
    const retry = await repository.createPreparedRecords({
      ...input,
      job: { ...input.job, jobId: "job_retry_must_not_replace", updatedAt: Date.now() + 1 },
      session: { ...input.session, viewSessionId: "vs_retry_must_not_replace", expiresAt: Date.now() + 240_000 },
    });
    assert.equal(retry.created, false);
    assert.equal(retry.job.jobId, first.job.jobId, "same request ID must recover the durable job");
    assert.equal(retry.session.viewSessionId, first.session.viewSessionId, "same request ID must recover the durable session");
    await assert.rejects(
      repository.createPreparedRecords({ ...input, job: { ...input.job, fileId: "different-file" } }),
      /CAD_V2_IDEMPOTENCY_CONFLICT/
    );
    await assert.rejects(
      repository.createPreparedRecords({
        ...input,
        artifactKey: "different-artifact-same-revision",
        sourceSha256: "c".repeat(64),
      }),
      /CAD_V2_IDEMPOTENCY_CONFLICT/,
      "same client request and source revision must reject changed bytes/artifact identity"
    );
    assert.equal((await repository.getJob(first.job.jobId))?.fileId, input.job.fileId);
    const heartbeat = await repository.heartbeatViewSession(first.session.viewSessionId);
    assert.ok(heartbeat && heartbeat.expiresAt > Date.now() + 170_000, "session heartbeat should extend the durable lease");

    const objects = [makeObject("atomic", "chunk_model_001.bin", "chunk"), makeObject("atomic", "manifest.json", "manifest")];
    const publishInput = buildPublishInput("atomic", first.job.jobId, objects);
    await beginTestPublishLease(repository, publishInput);
    const published = await repository.publishSceneAndCompleteJob(publishInput);
    assert.equal(published, true, "exact object set and job READY state must commit together");
    assert.equal((await repository.getJob(first.job.jobId))?.status, "ready");
    assert.equal((await repository.getReadyScene("scene_repo_atomic"))?.expectedObjectCount, 2);
    assert.equal(await repository.getFileIdForReadyScene("scene_repo_atomic"), "file_repo_atomic");
    const deleted = await repository.deleteViewSession(first.session.viewSessionId);
    assert.equal(deleted, true);
    assert.equal(await repository.getViewSession(first.session.viewSessionId), null);

    const duplicateArtifact = makePreparedRecords("second-request", {
      fileId: input.job.fileId,
      shareLinkId: input.job.shareLinkId,
      sourceVersionKey: input.job.sourceVersionKey,
    });
    duplicateArtifact.artifactKey = input.artifactKey;
    duplicateArtifact.sourceSha256 = input.sourceSha256;
    const duplicateJob = await repository.createPreparedRecords(duplicateArtifact);
    assert.equal(await repository.completeJobFromReadyScene({
      jobId: duplicateJob.job.jobId,
      fence: duplicateJob.job.fence,
      sceneId: "scene_repo_atomic",
      fileId: input.job.fileId,
      sourceVersionKey: input.job.sourceVersionKey,
      sourceSha256: input.sourceSha256,
    }), true, "a concurrent request may adopt an already verified READY scene");
    assert.equal((await repository.getJob(duplicateJob.job.jobId))?.sceneId, "scene_repo_atomic");
    assert.equal((await repository.getViewSession(duplicateJob.session.viewSessionId))?.sceneId, "scene_repo_atomic");

    const serviceRoot = path.resolve(os.tmpdir(), `cad-v2-service-db-${process.pid}-${crypto.randomUUID()}`);
    const tempPrefix = `${path.resolve(os.tmpdir())}${path.sep}`;
    if (!serviceRoot.startsWith(tempPrefix)) throw new Error("CAD_V2_TEST_CLEANUP_GUARD: service path escaped os.tmpdir().");
    try {
      const blobStore = new IsolatedFileBlobStore(path.join(serviceRoot, "blob"));
      const source = Buffer.from(`0\nSECTION\n2\nENTITIES\n0\nLINE\n8\n0\n10\n0\n20\n0\n11\n25\n21\n25\n0\nENDSEC\n0\nEOF\n`, "utf8");
      const service = new CadV2DurableService(path.join(serviceRoot, "cache-a"), blobStore, repository);
      const prepared = await service.prepare({
        fileId: "file_repo_service",
        shareLinkId: "share_repo_service",
        expectedSourceVersionKey: "rev_repo_service",
        clientRequestId: "request_repo_service",
        sourceBuffer: source,
        fileName: "service-test.dxf",
      });
      assert.equal(prepared.status, "ready", "service must only return ready after durable DB publish");
      assert.ok(prepared.sceneId);

      const coldService = new CadV2DurableService(path.join(serviceRoot, "cache-b"), blobStore, repository);
      assert.equal(await coldService.getFileIdForSceneAsync(prepared.sceneId!), "file_repo_service");
      const coldManifest = await coldService.getManifestAsync(prepared.sceneId!);
      assert.ok(coldManifest, "cold service instance must resolve the DB manifest pointer and Blob object");
      assert.equal(coldManifest.storageGeneration, (await repository.getReadyScene(prepared.sceneId!))?.storageGeneration);
      const firstChunkId = coldManifest.chunks[0]?.chunkId;
      assert.ok(firstChunkId);
      const coldChunk = await coldService.getChunkAsync(prepared.sceneId!, firstChunkId);
      assert.ok(coldChunk && coldChunk.byteLength === coldManifest.chunks[0].byteLength);
      const coldSession = await coldService.getViewSessionAsync(prepared.viewSessionId);
      assert.equal(coldSession?.shareLinkId, "share_repo_service", "share-to-session ownership must survive a new service instance");
      const extended = await coldService.heartbeatViewSessionAsync(prepared.viewSessionId);
      assert.ok(extended.expiresAt > Date.now() + 170_000);
      assert.equal(await coldService.deleteViewSessionAsync(prepared.viewSessionId), true);

      for (const objectType of ["chunk", "index", "metadata", "manifest"] as const) {
        const fileId = `file_repo_fault_${objectType}`;
        const faultStore = new FaultInjectingBlobStore(blobStore, objectType);
        const faultService = new CadV2DurableService(
          path.join(serviceRoot, `cache-fault-${objectType}`), faultStore, repository
        );
        const faultPrepare = await faultService.prepare({
          fileId,
          shareLinkId: "share_repo_fault_matrix",
          expectedSourceVersionKey: `rev_repo_fault_${objectType}`,
          clientRequestId: `request_repo_fault_${objectType}`,
          sourceBuffer: source,
          fileName: "fault-matrix.dxf",
        });
        assert.equal(faultPrepare.status, "preparing", `${objectType} upload failure must never return ready`);
        assert.ok(faultPrepare.jobId);
        assert.equal(faultStore.failureCount, 1, `${objectType} upload failure injection must be reached`);
        const faultJob = await repository.getJob(faultPrepare.jobId!);
        assert.equal(faultJob?.status, "failed", `${objectType} upload failure must persist a failed durable job`);
        const readyScenes = await executor.query(
          `SELECT id FROM cad_v2_scenes WHERE file_id=$1 AND status='ready'`, [fileId]
        );
        assert.equal(readyScenes.length, 0, `${objectType} upload failure must not publish a READY scene`);
      }
    } finally {
      if (serviceRoot.startsWith(tempPrefix)) fs.rmSync(serviceRoot, { recursive: true, force: true });
    }

    const broken = makePreparedRecords("rollback");
    const brokenRecords = await repository.createPreparedRecords(broken);
    await executor.query(`CREATE FUNCTION cad_v2_test_reject_object() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN IF NEW.object_id='forced-failure' THEN RAISE EXCEPTION 'injected object row failure'; END IF; RETURN NEW; END $$`);
    await executor.query(`CREATE TRIGGER cad_v2_test_reject_object BEFORE INSERT ON cad_v2_scene_objects
      FOR EACH ROW EXECUTE FUNCTION cad_v2_test_reject_object()`);
    const brokenObjects = [makeObject("rollback", "manifest.json", "manifest"), makeObject("rollback", "forced-failure", "chunk")];
    const rollbackPublishInput = buildPublishInput("rollback", brokenRecords.job.jobId, brokenObjects);
    await beginTestPublishLease(repository, rollbackPublishInput);
    await assert.rejects(
      repository.publishSceneAndCompleteJob(rollbackPublishInput),
      /injected object row failure/
    );
    assert.equal(await repository.getReadyScene("scene_repo_rollback"), null, "a failed object insert must not expose a ready scene");
    assert.equal((await repository.getJob(brokenRecords.job.jobId))?.status, "running", "transaction rollback must not mark the job ready");
    await executor.query(`DROP TRIGGER cad_v2_test_reject_object ON cad_v2_scene_objects`);
    await executor.query(`DROP FUNCTION cad_v2_test_reject_object()`);
  } finally {
    await repoDb.close();
  }

  const tempRoot = path.resolve(os.tmpdir(), `cad-v2-repository-${process.pid}-${crypto.randomUUID()}`);
  const allowedTempRoot = `${path.resolve(os.tmpdir())}${path.sep}`;
  if (!tempRoot.startsWith(allowedTempRoot)) throw new Error("CAD_V2_TEST_CLEANUP_GUARD: temp test path escaped os.tmpdir().");
  const databaseDir = path.join(tempRoot, "postgres-data");
  try {
    fs.mkdirSync(tempRoot, { recursive: true });
    const fileDb = new PGlite(databaseDir);
    await fileDb.waitReady;
    const fileExecutor = pgliteExecutor(fileDb);
    await applyCadV2DurableRepositoryMigration(fileExecutor);
    const recoveryRepository = new CadV2DurableRepository(fileExecutor);
    await recoveryRepository.createPreparedRecords(makePreparedRecords("process-recovery", {
      jobId: "job_repo_process_recovery", fileId: "file_repo_process_recovery",
      shareLinkId: "share_repo_process_recovery", sourceVersionKey: "rev_repo_process_recovery",
      clientRequestId: "request_repo_process_recovery", status: "queued", attempt: 0,
    }));
    const abandonedClaim = await recoveryRepository.claimNextJob("compiler-worker-before-process-exit", 20, 3);
    assert.equal(abandonedClaim?.jobId, "job_repo_process_recovery");
    assert.equal(abandonedClaim?.attempt, 1);
    await fileDb.close();
    await new Promise((resolve) => setTimeout(resolve, 35));
    for (const role of ["writer", "manifest-reader", "object-reader", "worker-reclaim"]) runIsolatedChild(role, databaseDir);
  } finally {
    if (tempRoot.startsWith(allowedTempRoot)) fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

const childRole = process.env.CAD_V2_REPOSITORY_CHILD;
if (childRole) {
  const databaseDir = process.env.CAD_V2_REPOSITORY_DB_DIR;
  if (!databaseDir) throw new Error("CAD_V2_REPOSITORY_DB_DIR required for child process");
  runChild(childRole, databaseDir).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  }).finally(() => {
    process.exit(process.exitCode || 0);
  });
} else {
  runMigrationAndRepositoryTests().then(() => {
  console.log("CAD V2 durable repository PostgreSQL migration, idempotency + 10-request active-artifact dedupe, atomic publish/rollback, chunk/index/metadata/manifest fault matrix, service cold-read and A/B/C tests passed.");
    process.exit(0);
  }).catch((error) => {
    console.error("CAD V2 durable repository tests failed:", error);
    process.exit(1);
  });
}
