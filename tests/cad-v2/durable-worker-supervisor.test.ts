import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { CadV2DurableRepository, type CadV2SqlExecutor, type CadV2SqlStatement } from "../../src/lib/cad-v2/db/repository";
import { applyCadV2DurableRepositoryMigration } from "../../src/lib/cad-v2/db/migrate";
import { CadV2DurableService, type CadV2BlobStorageAdapter } from "../../src/lib/cad-v2/service/cad-v2-durable-service";
import { resolveCadV2WorkerMaxAttempts, runNextDurableCadV2Job, type CadV2ResolvedWorkerSource } from "../../src/lib/cad-v2/worker/durable-worker";
import { CompilerSupervisor, type CompileJobTask } from "../../services/cad-v2-compiler/src/supervisor";

assert.equal(resolveCadV2WorkerMaxAttempts(undefined), 3);
assert.equal(resolveCadV2WorkerMaxAttempts(""), 3);
assert.equal(resolveCadV2WorkerMaxAttempts("1"), 1);
assert.equal(resolveCadV2WorkerMaxAttempts("3"), 3);
assert.equal(resolveCadV2WorkerMaxAttempts("20"), 3, "worker configuration cannot exceed two automatic retries");
assert.throws(() => resolveCadV2WorkerMaxAttempts("2.5"), /CAD_V2_WORKER_ATTEMPT_LIMIT_INVALID/);
assert.throws(() => resolveCadV2WorkerMaxAttempts("0"), /CAD_V2_WORKER_ATTEMPT_LIMIT_INVALID/);
const SAMPLE_DXF = `0
SECTION
2
ENTITIES
0
LINE
8
0
10
0
20
0
11
100
21
100
0
ENDSEC
0
EOF
`;

class FileBlobStorageAdapter implements CadV2BlobStorageAdapter {
  constructor(private readonly root: string) {}

  isConfigured(): boolean { return true; }

  async put(pathname: string, body: string | Uint8Array): Promise<void> {
    const root = path.resolve(this.root);
    const target = path.resolve(root, ...pathname.split("/"));
    if (!target.startsWith(root + path.sep)) throw new Error("TEST_BLOB_PATH_OUTSIDE_ROOT");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, typeof body === "string" ? body : Buffer.from(body));
  }

  async get(pathname: string): Promise<Uint8Array | null> {
    const target = path.resolve(this.root, ...pathname.split("/"));
    return fs.existsSync(target) ? new Uint8Array(fs.readFileSync(target)) : null;
  }
}

class TrackingCompilerSupervisor extends CompilerSupervisor {
  public readonly tasks: CompileJobTask[] = [];

  public override enqueue(task: CompileJobTask) {
    this.tasks.push(task);
    return super.enqueue(task);
  }
}

async function waitFor(predicate: () => boolean, timeoutMs: number): Promise<void> {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) throw new Error(`condition not reached within ${timeoutMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  for (const key of Object.keys(process.env)) {
    if (/DATABASE_URL|POSTGRES|NEON|BLOB|VERCEL/i.test(key)) delete process.env[key];
  }
  process.env.DOK_ALLOW_LOCAL_STORAGE = "true";
  process.env.NODE_ENV = "development";

  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cad-v2-worker-supervisor-"));
  const source = Buffer.from(SAMPLE_DXF, "utf8");
  const fileId = `file_${crypto.randomUUID().replace(/-/g, "")}`;
  const sourceVersionKey = `rev_${crypto.randomUUID().replace(/-/g, "")}`;
  const database = new PGlite();
  await database.waitReady;
  const executor: CadV2SqlExecutor = {
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

  try {
    await applyCadV2DurableRepositoryMigration(executor);
    const repository = new CadV2DurableRepository(executor);
    let heartbeatCount = 0;
    const heartbeatJobLease = repository.heartbeatJobLease.bind(repository);
    repository.heartbeatJobLease = async (input) => {
      heartbeatCount += 1;
      return heartbeatJobLease(input);
    };
    const blobStore = new FileBlobStorageAdapter(path.join(root, "blob"));
    const service = new CadV2DurableService(path.join(root, "cache"), blobStore, repository);
    const prepared = await service.prepare({
      fileId,
      expectedSourceVersionKey: sourceVersionKey,
      clientRequestId: crypto.randomUUID(),
      sourceBuffer: source,
      fileName: "sample.dxf",
      deferCompilation: true,
    });
    assert.equal(prepared.status, "preparing");
    assert.ok(prepared.jobId);

    const childScriptPath = path.resolve("services/cad-v2-compiler/dist/compiler-child-entry.js");
    const supervisor = new TrackingCompilerSupervisor({
      childScriptPath,
      timeoutMs: 20_000,
      maxOldSpaceMiB: 256,
    });
    const result = await runNextDurableCadV2Job({
      repository,
      service,
      ownerId: "test-supervised-worker",
      leaseMs: 30_000,
      compilerSupervisor: supervisor,
      resolveSource: async (): Promise<CadV2ResolvedWorkerSource> => ({
        buffer: source,
        fileName: "sample.dxf",
        sourceVersionKey,
      }),
    });

    assert.equal(supervisor.tasks.length, 1, "durable worker must route compilation through CompilerSupervisor");
    assert.equal(supervisor.tasks[0]?.sourceVersionKey, sourceVersionKey);
    assert.equal(supervisor.tasks[0]?.fileId, fileId);
    assert.equal(result.status, "ready");
    if (result.status !== "ready") throw new Error(`expected ready result, got ${JSON.stringify(result)}`);

    const expectedSourceSha256 = crypto.createHash("sha256").update(source).digest("hex");
    const manifest = await service.getManifestAsync(result.sceneId);
    assert.ok(manifest, "cold durable manifest must be readable after child publish");
    assert.equal(manifest.sceneId, result.sceneId);
    assert.equal(manifest.sourceVersionKey, sourceVersionKey);
    assert.equal(manifest.sourceSha256, expectedSourceSha256);
    assert.ok(manifest.chunks.length > 0, "child output must contain drawable chunks");
    const job = await repository.getJob(prepared.jobId!);
    assert.equal(job?.status, "ready");
    assert.equal(job?.sceneId, result.sceneId);

    const changedBytesFileId = `file_${crypto.randomUUID().replace(/-/g, "")}`;
    const changedBytesRevision = `rev_${crypto.randomUUID().replace(/-/g, "")}`;
    const changedBytesPrepared = await service.prepare({
      fileId: changedBytesFileId,
      expectedSourceVersionKey: changedBytesRevision,
      clientRequestId: crypto.randomUUID(),
      sourceBuffer: source,
      fileName: "sample.dxf",
      deferCompilation: true,
    });
    const changedBytesResult = await runNextDurableCadV2Job({
      repository,
      service,
      ownerId: "test-source-sha-worker",
      leaseMs: 30_000,
      compilerSupervisor: supervisor,
      resolveSource: async (): Promise<CadV2ResolvedWorkerSource> => ({
        buffer: Buffer.from(SAMPLE_DXF.replace("100", "101"), "utf8"),
        fileName: "sample.dxf",
        sourceVersionKey: changedBytesRevision,
      }),
    });
    assert.equal(changedBytesResult.status, "failed");
    if (changedBytesResult.status !== "failed") throw new Error(`expected source SHA failure, got ${JSON.stringify(changedBytesResult)}`);
    assert.equal(changedBytesResult.error, "CAD_V2_SOURCE_SHA_MISMATCH");
    assert.equal(supervisor.tasks.length, 1, "source SHA must be checked before spawning the compiler child");
    const changedBytesJob = await repository.getJob(changedBytesPrepared.jobId!);
    assert.equal(changedBytesJob?.status, "failed");
    assert.equal(changedBytesJob?.sceneId, null, "changed bytes at the same revision must never publish a scene");

    const crashFileId = `file_${crypto.randomUUID().replace(/-/g, "")}`;
    const crashRevision = `rev_${crypto.randomUUID().replace(/-/g, "")}`;
    const crashPrepared = await service.prepare({
      fileId: crashFileId,
      expectedSourceVersionKey: crashRevision,
      clientRequestId: crypto.randomUUID(),
      sourceBuffer: source,
      fileName: "sample.dxf",
      deferCompilation: true,
    });
    const crashingChildPath = path.join(root, "crashing-child.cjs");
    fs.writeFileSync(crashingChildPath, "process.exit(23);\n", "utf8");
    const crashingSupervisor = new TrackingCompilerSupervisor({
      childScriptPath: crashingChildPath,
      timeoutMs: 5_000,
      maxOldSpaceMiB: 128,
    });
    const crashRun = await runNextDurableCadV2Job({
      repository,
      service,
      ownerId: "test-crashed-worker-child",
      leaseMs: 30_000,
      maxAttempts: 2,
      baseRetryDelayMs: 1,
      compilerSupervisor: crashingSupervisor,
      resolveSource: async (): Promise<CadV2ResolvedWorkerSource> => ({
        buffer: source,
        fileName: "sample.dxf",
        sourceVersionKey: crashRevision,
      }),
    });
    assert.equal(crashRun.status, "queued", "child crash is bounded and returns the durable job to retry queue");
    assert.equal(crashingSupervisor.tasks.length, 1, "durable retry policy owns the retry budget; one compiler child runs per durable claim");
    const queuedAfterCrash = await repository.getJob(crashPrepared.jobId!);
    assert.equal(queuedAfterCrash?.status, "queued");
    assert.equal(queuedAfterCrash?.sceneId, null);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const recoveredRun = await runNextDurableCadV2Job({
      repository,
      service,
      ownerId: "test-restarted-after-child-crash",
      leaseMs: 30_000,
      compilerSupervisor: supervisor,
      resolveSource: async (): Promise<CadV2ResolvedWorkerSource> => ({
        buffer: source,
        fileName: "sample.dxf",
        sourceVersionKey: crashRevision,
      }),
    });
    assert.equal(recoveredRun.status, "ready", "a later worker process can claim the retry and publish READY");
    const recoveredJob = await repository.getJob(crashPrepared.jobId!);
    assert.equal(recoveredJob?.status, "ready");
    assert.equal(recoveredJob?.attempt, 2);

    const exhaustedFileId = "file_" + crypto.randomUUID().replace(/-/g, "");
    const exhaustedRevision = "rev_" + crypto.randomUUID().replace(/-/g, "");
    await service.prepare({
      fileId: exhaustedFileId,
      expectedSourceVersionKey: exhaustedRevision,
      clientRequestId: crypto.randomUUID(),
      sourceBuffer: source,
      fileName: "sample.dxf",
      deferCompilation: true,
    });
    const exhaustingSupervisor = new TrackingCompilerSupervisor({
      childScriptPath: crashingChildPath,
      timeoutMs: 5_000,
      maxOldSpaceMiB: 128,
    });
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const exhaustedRun = await runNextDurableCadV2Job({
        repository,
        service,
        ownerId: "test-exhausted-attempt-" + attempt,
        leaseMs: 30_000,
        maxAttempts: 3,
        baseRetryDelayMs: 1,
        compilerSupervisor: exhaustingSupervisor,
        resolveSource: async (): Promise<CadV2ResolvedWorkerSource> => ({
          buffer: source,
          fileName: "sample.dxf",
          sourceVersionKey: exhaustedRevision,
        }),
      });
      assert.equal(exhaustedRun.status, attempt < 3 ? "queued" : "failed");
      const exhaustedJob = await repository.getJob(exhaustedRun.jobId);
      assert.equal(exhaustedJob?.attempt, attempt);
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal(exhaustingSupervisor.tasks.length, 3,
      "three durable attempts produce exactly three child starts, so the job gets only two automatic retries");


    const cancelFileId = `file_${crypto.randomUUID().replace(/-/g, "")}`;
    const cancelRevision = `rev_${crypto.randomUUID().replace(/-/g, "")}`;
    const cancelPrepared = await service.prepare({
      fileId: cancelFileId,
      expectedSourceVersionKey: cancelRevision,
      clientRequestId: crypto.randomUUID(),
      sourceBuffer: source,
      fileName: "sample.dxf",
      deferCompilation: true,
    });
    const markerPath = path.join(root, "child-started.marker");
    const blockingChildPath = path.join(root, "blocking-child.cjs");
    fs.writeFileSync(blockingChildPath, `
      const fs = require("node:fs");
      fs.writeFileSync(process.env.CAD_V2_TEST_CHILD_MARKER, "started", "utf8");
      setTimeout(() => {}, 60_000);
    `, "utf8");
    const previousMarker = process.env.CAD_V2_TEST_CHILD_MARKER;
    process.env.CAD_V2_TEST_CHILD_MARKER = markerPath;
    try {
      const blockingSupervisor = new TrackingCompilerSupervisor({
        childScriptPath: blockingChildPath,
        timeoutMs: 10_000,
        maxOldSpaceMiB: 128,
      });
      const shutdownController = new AbortController();
      const cancelRun = runNextDurableCadV2Job({
        repository,
        service,
        ownerId: "test-cancelled-worker",
        leaseMs: 3_000,
        maxAttempts: 3,
        compilerSupervisor: blockingSupervisor,
        signal: shutdownController.signal,
        resolveSource: async (): Promise<CadV2ResolvedWorkerSource> => ({
          buffer: source,
          fileName: "sample.dxf",
          sourceVersionKey: cancelRevision,
        }),
      });
      await waitFor(() => fs.existsSync(markerPath), 5_000);
      await new Promise((resolve) => setTimeout(resolve, 1_150));
      assert.ok(heartbeatCount >= 1, "worker lease heartbeat continues while the compiler child is active");
      assert.equal(await repository.deleteViewSession(cancelPrepared.viewSessionId), true,
        "deleting the final view session cancels the queued/running durable job");
      const jobAfterCancelRequest = await repository.getJob(cancelPrepared.jobId!);
      if (jobAfterCancelRequest?.status !== "cancelled") {
        shutdownController.abort();
        await withTimeout(cancelRun, 5_000);
      }
      assert.equal(jobAfterCancelRequest?.status, "cancelled", "final session deletion fences the active worker claim");
      let cancelledResult;
      try {
        cancelledResult = await withTimeout(cancelRun, 7_000);
      } catch (error) {
        console.error("cancellation diagnostics", {
          heartbeatCount,
          supervisorTasks: blockingSupervisor.tasks.length,
          job: await repository.getJob(cancelPrepared.jobId!),
        });
        throw error;
      }
      assert.equal(cancelledResult.status, "stale", "fenced cancellation cannot report a successful or retryable publish");
      assert.equal(blockingSupervisor.tasks.length, 1, "cancelled child is not retried");
      const cancelledJob = await repository.getJob(cancelPrepared.jobId!);
      assert.equal(cancelledJob?.status, "cancelled");
      assert.equal(cancelledJob?.sceneId, null, "cancelled child cannot publish READY scene artifacts");
    } finally {
      if (previousMarker === undefined) delete process.env.CAD_V2_TEST_CHILD_MARKER;
      else process.env.CAD_V2_TEST_CHILD_MARKER = previousMarker;
    }

    console.log("durable worker child publish, source SHA, crash recovery, live heartbeat, cancellation, and READY-set fencing PASS");
  } finally {
    await database.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
