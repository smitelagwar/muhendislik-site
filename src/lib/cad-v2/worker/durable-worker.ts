import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { getFile } from "@/lib/dokumantasyon/files";
import { getLocalStorageDir } from "@/lib/dokumantasyon/local-store";
import { getBlobCommandOptions, getDatabaseUrl, hasBlobAccessConfiguration } from "@/lib/dokumantasyon/runtime-mode";
import { CadV2DurableRepository, type CadV2WorkerJobClaim } from "../db/repository";
import { CadV2DurableService, hasCadV2DurableBlobConfiguration } from "../service/cad-v2-durable-service";
import { CompilerSupervisor } from "../../../../services/cad-v2-compiler/src/supervisor";
import { readCompiledSceneOutput } from "../../../../services/cad-v2-compiler/src/compiler-child";

export interface CadV2ResolvedWorkerSource {
  buffer: Buffer;
  fileName: string;
  sourceVersionKey: string;
}

export type CadV2WorkerRunResult =
  | { status: "idle" }
  | { status: "ready"; jobId: string; sceneId: string }
  | { status: "queued" | "failed" | "stale"; jobId: string; error: string };

async function compileDurableSceneWithChild(input: {
  supervisor: CompilerSupervisor;
  buffer: Uint8Array;
  fileName: string;
  sourceVersionKey: string;
  fileId: string;
  sceneId: string;
  signal?: AbortSignal;
}): Promise<import("../compile/scene-compiler").CompiledSceneOutput> {
  const extension = path.extname(input.fileName).toLowerCase();
  if (extension !== ".dxf" && extension !== ".dwg") throw new Error(`CAD_V2_UNSUPPORTED_SOURCE_EXTENSION:${extension}`);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "cad-v2-compiler-attempt-"));
  const inputPath = path.join(root, `source${extension}`);
  const outputPath = path.join(root, "compiled-scene");
  try {
    await fs.writeFile(inputPath, input.buffer);
    const result = await input.supervisor.enqueue({
      id: `${input.fileId}:${input.sourceVersionKey}`,
      inputPath,
      outputPath,
      sourceVersionKey: input.sourceVersionKey,
      fileId: input.fileId,
      signal: input.signal,
      maxAttempts: 1, // Neon durable job attempts are the single retry authority.
    });
    if (!result.success) throw new Error(`CAD_V2_COMPILER_CHILD_FAILED:${result.error || "UNKNOWN"}`);
    const compiled = readCompiledSceneOutput(outputPath);
    if (compiled.manifest.sceneId !== input.sceneId) {
      throw new Error("CAD_V2_COMPILER_CHILD_IDENTITY_MISMATCH: scene ID child çıktısında farklı.");
    }
    return compiled;
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

function actualSourceVersionKey(file: NonNullable<Awaited<ReturnType<typeof getFile>>>): string {
  return `${file.id}_${file.updated_at || file.current_version_number || "1"}`;
}

async function readPrivateBlobSource(pathname: string): Promise<Buffer | null> {
  if (!hasBlobAccessConfiguration()) return null;
  const { get } = await import("@vercel/blob");
  const result = await get(pathname, { access: "private", ...getBlobCommandOptions() });
  if (result?.stream) return Buffer.from(await new Response(result.stream).arrayBuffer());
  if (typeof (result as unknown as { arrayBuffer?: unknown })?.arrayBuffer === "function") {
    return Buffer.from(await (result as unknown as { arrayBuffer(): Promise<ArrayBuffer> }).arrayBuffer());
  }
  if (typeof (result as unknown as { blob?: unknown })?.blob === "function") {
    const blob = await (result as unknown as { blob(): Promise<Blob> }).blob();
    return Buffer.from(await blob.arrayBuffer());
  }
  return null;
}

/** Resolve the current authoritative file record again after a durable queue claim. */
export async function resolveDurableCadV2Source(
  claim: CadV2WorkerJobClaim
): Promise<CadV2ResolvedWorkerSource> {
  const file = await getFile(claim.fileId);
  if (!file || file.deleted_at) throw new Error("CAD_V2_FILE_NOT_FOUND");
  const sourceVersionKey = actualSourceVersionKey(file);
  if (sourceVersionKey !== claim.sourceVersionKey) {
    throw new Error(`CAD_V2_SOURCE_REVISION_CHANGED: queued=${claim.sourceVersionKey}; current=${sourceVersionKey}`);
  }

  let buffer: Buffer | null = null;
  if (file.blob_url?.startsWith("local:")) {
    const root = path.resolve(getLocalStorageDir());
    const relative = file.blob_url.slice("local:".length);
    const diskPath = path.resolve(root, relative);
    if (!diskPath.startsWith(root + path.sep)) throw new Error("CAD_V2_SOURCE_PATH_INVALID");
    try {
      buffer = await fs.readFile(diskPath);
    } catch {
      throw new Error("CAD_V2_SOURCE_UNAVAILABLE: yerel kaynak okunamadı.");
    }
  } else if (file.blob_pathname || file.blob_url) {
    try {
      buffer = await readPrivateBlobSource(file.blob_pathname || file.blob_url);
    } catch (error) {
      throw new Error(`CAD_V2_SOURCE_UNAVAILABLE: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (!buffer?.byteLength) throw new Error("CAD_V2_SOURCE_UNAVAILABLE: kalıcı kaynak okunamadı.");
  return { buffer, fileName: file.display_name, sourceVersionKey };
}

function isPermanentWorkerError(error: string): boolean {
  return /CAD_V2_(?:FILE_NOT_FOUND|SOURCE_REVISION_CHANGED|SOURCE_SHA_MISMATCH|SOURCE_PATH_INVALID|SOURCE_IDENTITY_MISSING)/.test(error);
}

/** Claim and process at most one durable job; safe to invoke from an external worker process. */
export async function runNextDurableCadV2Job(input: {
  repository: CadV2DurableRepository;
  service: CadV2DurableService;
  ownerId: string;
  resolveSource?: (claim: CadV2WorkerJobClaim) => Promise<CadV2ResolvedWorkerSource>;
  leaseMs?: number;
  maxAttempts?: number;
  baseRetryDelayMs?: number;
  compilerSupervisor?: CompilerSupervisor;
  signal?: AbortSignal;
}): Promise<CadV2WorkerRunResult> {
  const maxAttempts = input.maxAttempts ?? 3;
  const leaseMs = input.leaseMs ?? 180_000;
  const claim = await input.repository.claimNextJob(input.ownerId, leaseMs, maxAttempts);
  if (!claim) return { status: "idle" };

  let leaseLost = false;
  let heartbeatTask: Promise<void> | null = null;
  const compilerAbort = new AbortController();
  const abortCompiler = () => compilerAbort.abort();
  input.signal?.addEventListener("abort", abortCompiler, { once: true });
  if (input.signal?.aborted) abortCompiler();
  const heartbeatTimer = setInterval(() => {
    if (heartbeatTask) return;
    heartbeatTask = (async () => {
      try {
        const renewed = await input.repository.heartbeatJobLease({
          jobId: claim.jobId,
          ownerId: claim.workerOwnerId,
          fence: claim.fence,
          ttlMs: leaseMs,
        });
        if (!renewed) {
          leaseLost = true;
          abortCompiler();
        }
      } catch {
        leaseLost = true;
        abortCompiler();
      }
    })().finally(() => { heartbeatTask = null; });
  }, Math.max(1_000, Math.floor(leaseMs / 3)));
  heartbeatTimer.unref?.();
  const verifyLease = async () => {
    if (heartbeatTask) await heartbeatTask;
    return !leaseLost;
  };

  try {
    if (!claim.sourceSha256 || !/^[a-f0-9]{64}$/i.test(claim.sourceSha256)) {
      throw new Error("CAD_V2_SOURCE_IDENTITY_MISSING");
    }
    const source = await (input.resolveSource || resolveDurableCadV2Source)(claim);
    if (source.sourceVersionKey !== claim.sourceVersionKey) {
      throw new Error(`CAD_V2_SOURCE_REVISION_CHANGED: queued=${claim.sourceVersionKey}; resolved=${source.sourceVersionKey}`);
    }
    const sourceSha256 = crypto.createHash("sha256").update(source.buffer).digest("hex");
    if (sourceSha256 !== claim.sourceSha256) throw new Error("CAD_V2_SOURCE_SHA_MISMATCH");

    await input.service.executeJobSync(claim, source.buffer, source.fileName, claim.fence, {
      persistFailure: false,
      throwOnFailure: true,
      workerOwnerId: claim.workerOwnerId,
      shouldContinue: verifyLease,
      ...(input.compilerSupervisor ? {
        compileWithChild: (compileInput) => compileDurableSceneWithChild({
          ...compileInput,
          supervisor: input.compilerSupervisor!,
          signal: compilerAbort.signal,
        }),
      } : {}),
    });
    if (!(await verifyLease())) throw new Error("CAD_V2_WORKER_LEASE_LOST: worker lease süresi doldu.");
    const completedJob = await input.repository.getJob(claim.jobId);
    if (completedJob?.status !== "ready" || completedJob.fence !== claim.fence || !completedJob.sceneId) {
      throw new Error("CAD_V2_WORKER_PUBLISH_NOT_READY");
    }
    if (!(await input.repository.completeClaimedJob({ jobId: claim.jobId, ownerId: claim.workerOwnerId, fence: claim.fence }))) {
      return { status: "stale", jobId: claim.jobId, error: "CAD_V2_WORKER_COMPLETION_FENCED" };
    }
    return { status: "ready", jobId: claim.jobId, sceneId: completedJob.sceneId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const state = await input.repository.failClaimedJob({
      jobId: claim.jobId,
      ownerId: claim.workerOwnerId,
      fence: claim.fence,
      error: message,
      retryable: !isPermanentWorkerError(message),
      maxAttempts,
      baseRetryDelayMs: input.baseRetryDelayMs ?? 1_000,
    });
    return state
      ? { status: state, jobId: claim.jobId, error: message }
      : { status: "stale", jobId: claim.jobId, error: message };
  } finally {
    clearInterval(heartbeatTimer);
    input.signal?.removeEventListener("abort", abortCompiler);
    if (heartbeatTask) await heartbeatTask;
  }
}

const delay = (milliseconds: number, signal: AbortSignal) => new Promise<void>((resolve) => {
  if (signal.aborted) return resolve();
  const timer = setTimeout(done, milliseconds);
  function done() {
    clearTimeout(timer);
    signal.removeEventListener("abort", done);
    resolve();
  }
  signal.addEventListener("abort", done, { once: true });
});

/** D09 permits at most two automatic retries: three durable claims total. */
export function resolveCadV2WorkerMaxAttempts(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return 3;
  const requested = Number(raw);
  if (!Number.isSafeInteger(requested) || requested < 1) {
    throw new Error("CAD_V2_WORKER_ATTEMPT_LIMIT_INVALID");
  }
  return Math.min(3, requested);
}
/** Long-lived entry point for the standalone compiler container; one job runs per process slot. */
export async function startDurableCadV2WorkerLoop(options: {
  signal: AbortSignal;
  pollMs?: number;
}): Promise<void> {
  const maxAttempts = resolveCadV2WorkerMaxAttempts(process.env.CAD_V2_WORKER_MAX_ATTEMPTS);
  if (!getDatabaseUrl()) throw new Error("CAD_V2_DATABASE_NOT_CONFIGURED: worker Neon bağlantısı yok.");
  if (!hasCadV2DurableBlobConfiguration()) throw new Error("CAD_V2_BLOB_NOT_CONFIGURED: worker private Blob bağlantısı yok.");

  const repository = CadV2DurableRepository.fromNeon();
  const service = new CadV2DurableService();
  const compilerTimeoutMs = Math.max(1_000, Math.min(30 * 60_000, Number(process.env.CAD_V2_COMPILER_TIMEOUT_MS) || 300_000));
  const compilerHeapMiB = Math.max(128, Math.min(8_192, Number(process.env.CAD_V2_COMPILER_MAX_OLD_SPACE_MIB) || 1_024));
  const compilerSupervisor = new CompilerSupervisor({ timeoutMs: compilerTimeoutMs, maxOldSpaceMiB: compilerHeapMiB });
  const ownerId = `cad-v2-worker:${os.hostname()}:${process.pid}:${crypto.randomUUID()}`;
  const configuredPollMs = Number(process.env.CAD_V2_WORKER_POLL_MS) || 1_000;
  const pollMs = Math.max(250, Math.min(30_000, options.pollMs ?? configuredPollMs));
  console.log(`[CAD V2 Worker] Started; owner=${ownerId}; pollMs=${pollMs}; concurrency=1; maxAttempts=${maxAttempts}; childTimeoutMs=${compilerTimeoutMs}; childMaxOldSpaceMiB=${compilerHeapMiB}`);

  while (!options.signal.aborted) {
    try {
      const result = await runNextDurableCadV2Job({
        repository,
        service,
        ownerId,
        compilerSupervisor,
        signal: options.signal,
        leaseMs: Math.max(30_000, Math.min(30 * 60_000, Number(process.env.CAD_V2_WORKER_LEASE_MS) || 180_000)),
        maxAttempts,
        baseRetryDelayMs: Math.max(1, Math.min(300_000, Number(process.env.CAD_V2_WORKER_RETRY_DELAY_MS) || 1_000)),
      });
      if (result.status === "idle") await delay(pollMs, options.signal);
      else console.log(`[CAD V2 Worker] ${JSON.stringify(result)}`);
    } catch (error) {
      console.error("[CAD V2 Worker] Queue cycle failed:", error);
      await delay(pollMs, options.signal);
    }
  }
  console.log("[CAD V2 Worker] Stopped.");
}
