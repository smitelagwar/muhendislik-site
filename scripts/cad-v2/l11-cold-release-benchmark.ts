import { spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { performance } from "node:perf_hooks";
import { CadV2DurableService } from "../../src/lib/cad-v2/service/cad-v2-durable-service";
import { CAD_V2_COMPILER_REVISION } from "../../src/lib/cad-v2/version";

interface CorpusItem {
  id: string;
  relativePath: string;
  format: "DWG" | "DXF";
  sizeBytes: number;
  sha256: string;
}

interface SampleResult {
  sample: number;
  status: "ready";
  elapsedMs: number;
  sceneId: string;
  sourceSha256: string;
  rootManifestBytes: number;
  rootManifestMaxBytes: number;
  indexPageCount: number;
  chunkCount: number;
  firstChunkBytes: number;
  qualityStatus: string;
}

interface FileResult {
  id: string;
  format: string;
  sourceBytes: number;
  sourceSha256: string;
  samples: SampleResult[];
  medianColdPrepareMs?: number;
  p95ColdPrepareMs?: number;
}

function sha256(bytes: Uint8Array): string {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function quantile(samples: number[], q: number): number {
  if (samples.length === 0) throw new Error("Cannot calculate a quantile without samples");
  const sorted = [...samples].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower]!;
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (position - lower);
}

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function assertInside(parent: string, target: string, label: string): void {
  const relative = path.relative(path.resolve(parent), path.resolve(target));
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} escaped its run-owned parent: ${target}`);
  }
}

async function runSample(): Promise<void> {
  const root = path.resolve(process.cwd());
  const sourcePath = path.resolve(root, process.env.CAD_V2_L11_SOURCE_PATH || "");
  const storageDir = path.resolve(root, process.env.CAD_V2_L11_STORAGE_DIR || "");
  const resultPath = path.resolve(root, process.env.CAD_V2_L11_RESULT_PATH || "");
  const expectedId = process.env.CAD_V2_L11_SOURCE_ID || "";
  const expectedHash = process.env.CAD_V2_L11_SOURCE_SHA256 || "";
  const sample = Number(process.env.CAD_V2_L11_SAMPLE || "0");
  if (!sourcePath || !storageDir || !resultPath || !expectedId || !expectedHash || !Number.isInteger(sample) || sample < 1) {
    throw new Error("A cold sample requires source, storage, result, corpus identity, hash and positive sample index");
  }

  const bytes = readFileSync(sourcePath);
  const sourceSha256 = sha256(bytes);
  if (sourceSha256 !== expectedHash) throw new Error(`${expectedId} source SHA-256 differs from the checked corpus manifest`);
  const item = (JSON.parse(readFileSync(path.join(root, "tests/cad-v2/fixtures-manifest.json"), "utf8")) as { realCorpus: CorpusItem[] })
    .realCorpus.find((candidate) => candidate.id === expectedId);
  if (!item) throw new Error(`Unknown corpus item: ${expectedId}`);

  const service = new CadV2DurableService(storageDir, undefined, null);
  const startedAt = performance.now();
  const result = await service.prepare({
    fileId: `l11_cold_${expectedId}_${sample}`,
    expectedSourceVersionKey: `l11-cold-${expectedId}-${sample}-${sourceSha256}`,
    clientRequestId: `l11-cold-${expectedId}-${sample}`,
    sourceBuffer: bytes,
    fileName: path.basename(item.relativePath),
  });
  const elapsedMs = performance.now() - startedAt;
  if (result.status !== "ready" || !result.sceneId) throw new Error(`${expectedId} cold sample ${sample} did not reach READY`);

  const session = service.getViewSession(result.viewSessionId);
  const job = session?.jobId ? service.getJob(session.jobId) : null;
  if (!session || !job || job.status !== "ready" || job.sceneId !== result.sceneId) {
    throw new Error(`${expectedId} cold sample ${sample} READY response has no matching ready session/job`);
  }

  const manifestPath = path.join(storageDir, result.sceneId, "manifest.json");
  if (!existsSync(manifestPath)) throw new Error(`${expectedId} cold sample ${sample} READY scene has no persisted root manifest`);
  const rootManifestBuffer = readFileSync(manifestPath);
  const rootManifest = JSON.parse(rootManifestBuffer.toString("utf8")) as {
    storageGeneration?: string;
    limits?: { maxManifestBytes?: number };
    chunks?: Array<{ chunkId: string }>;
    indexPages?: Array<{ chunkIds?: string[]; chunks?: Array<{ chunkId: string }> }>;
    qualityStatus?: string;
  };
  const rootManifestMaxBytes = Number(rootManifest.limits?.maxManifestBytes);
  if (!Number.isFinite(rootManifestMaxBytes) || rootManifestBuffer.byteLength > rootManifestMaxBytes) {
    throw new Error(`${expectedId} cold sample ${sample} root manifest violates maxManifestBytes`);
  }
  if (!rootManifest.storageGeneration) {
    throw new Error(`${expectedId} cold sample ${sample} manifest has no immutable storage generation`);
  }
  const inlineChunkIds = rootManifest.chunks?.map((chunk) => chunk.chunkId) ?? [];
  const chunkIds = inlineChunkIds.length > 0 ? inlineChunkIds :
    rootManifest.indexPages?.flatMap((page) => page.chunkIds ?? page.chunks?.map((chunk) => chunk.chunkId) ?? []) ?? [];
  const firstChunkId = chunkIds[0];
  if (!firstChunkId) throw new Error(`${expectedId} cold sample ${sample} READY manifest contains no chunk ids`);
  const firstChunk = await service.getChunkAsync(result.sceneId, firstChunkId);
  if (!firstChunk || firstChunk.byteLength === 0) throw new Error(`${expectedId} cold sample ${sample} READY scene cannot serve its first declared chunk`);

  const output: SampleResult = {
    sample,
    status: "ready",
    elapsedMs: Number(elapsedMs.toFixed(3)),
    sceneId: result.sceneId,
    sourceSha256,
    rootManifestBytes: rootManifestBuffer.byteLength,
    rootManifestMaxBytes,
    indexPageCount: rootManifest.indexPages?.length ?? 0,
    chunkCount: chunkIds.length,
    firstChunkBytes: firstChunk.byteLength,
    qualityStatus: rootManifest.qualityStatus ?? "unknown",
  };
  writeJson(resultPath, output);
  console.log(`[L11_COLD_SAMPLE] ${JSON.stringify({ id: expectedId, ...output })}`);
}

async function runBatch(): Promise<void> {
  const root = path.resolve(process.cwd());
  const manifestPath = path.join(root, "tests/cad-v2/fixtures-manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { realCorpus: CorpusItem[] };
  const requestedIds = process.env.CAD_V2_COLD_BENCH_IDS?.split(",").map((id) => id.trim()).filter(Boolean);
  const corpus = requestedIds?.length
    ? manifest.realCorpus.filter((item) => requestedIds.includes(item.id))
    : manifest.realCorpus;
  if (corpus.length === 0 || (requestedIds && corpus.length !== requestedIds.length)) {
    throw new Error(`Requested corpus selection does not match the manifest: ${requestedIds?.join(",")}`);
  }
  const sampleCount = Number(process.env.CAD_V2_COLD_BENCH_ITERATIONS || "30");
  if (!Number.isInteger(sampleCount) || sampleCount < 1 || sampleCount > 30) {
    throw new Error("CAD_V2_COLD_BENCH_ITERATIONS must be an integer from 1 through 30");
  }

  const runId = `l11-cold-${new Date().toISOString().replace(/[:.]/g, "-")}-${process.pid}`;
  const runDir = path.join(root, "test-output/cad-v2-tmp", runId);
  const samplesDir = path.join(runDir, "samples");
  mkdirSync(runDir, { recursive: false });
  mkdirSync(samplesDir, { recursive: false });
  const evidenceDir = path.join(root, "motor_v2/evidence/fidelity-v3/L11");
  const reportPath = path.join(evidenceDir, `cold-release-${runId}.json`);
  const fileResults: FileResult[] = corpus.map((item) => ({
    id: item.id,
    format: item.format,
    sourceBytes: item.sizeBytes,
    sourceSha256: item.sha256,
    samples: [],
  }));
  const resumePath = process.env.CAD_V2_COLD_BENCH_RESUME_REPORT?.trim();
  let resumedFileIds: string[] = [];
  let priorAttemptFailures: unknown[] = [];
  if (resumePath) {
    const prior = JSON.parse(readFileSync(path.resolve(resumePath), "utf8")) as {
      compilerRevision?: string;
      sampleCountPerFile?: number;
      coldDefinition?: string;
      files?: FileResult[];
      failures?: unknown[];
    };
    if (prior.compilerRevision !== CAD_V2_COMPILER_REVISION || prior.sampleCountPerFile !== sampleCount || !Array.isArray(prior.files)) {
      throw new Error("Resume report compiler/count/corpus contract does not match this run");
    }
    const expectedColdDefinition = "Each sample starts a fresh Node process with a new service and empty isolated storage; timing covers service.prepare only and excludes child-process startup. Samples run sequentially. Successful artifact storage is removed after each sample; sample logs and this report are retained.";
    if (prior.coldDefinition !== expectedColdDefinition) throw new Error("Resume report cold-condition definition differs from this runner");
    for (const item of corpus) {
      const previous = prior.files.find((file) => file.id === item.id);
      if (!previous || previous.sourceSha256 !== item.sha256 || previous.sourceBytes !== item.sizeBytes) {
        throw new Error(`Resume report source identity does not match ${item.id}`);
      }
      if (previous.samples.length === sampleCount) {
        if (previous.samples.some((sample, index) => sample.sample !== index + 1 || sample.status !== "ready" || sample.sourceSha256 !== item.sha256)) {
          throw new Error(`Resume report has invalid completed samples for ${item.id}`);
        }
        const current = fileResults.find((file) => file.id === item.id)!;
        current.samples = previous.samples;
        current.medianColdPrepareMs = previous.medianColdPrepareMs;
        current.p95ColdPrepareMs = previous.p95ColdPrepareMs;
        resumedFileIds.push(item.id);
      }
    }
    priorAttemptFailures = prior.failures ?? [];
  }
  const report = {
    status: "RUNNING",
    runId,
    startedAt: new Date().toISOString(),
    finishedAt: null as string | null,
    compilerRevision: CAD_V2_COMPILER_REVISION,
    nodeVersion: process.version,
    platform: `${process.platform}-${process.arch}`,
    coldDefinition: "Each sample starts a fresh Node process with a new service and empty isolated storage; timing covers service.prepare only and excludes child-process startup. Samples run sequentially. Successful artifact storage is removed after each sample; sample logs and this report are retained.",
    sampleCountPerFile: sampleCount,
    percentiles: "p50 and descriptive p95 only; no p99 claim from 30 observations.",
    files: fileResults,
    resumedFileIds,
    priorEvidencePath: resumePath ?? null,
    priorAttemptFailures,
    failures: [] as Array<{ id: string; sample: number; exitCode: number | null; logPath: string }>,
    evidencePath: reportPath,
  };
  writeJson(reportPath, report);

  try {
    const total = corpus.length * sampleCount;
    let completed = fileResults.reduce((sum, file) => sum + file.samples.length, 0);
    for (const [fileIndex, item] of corpus.entries()) {
      const sourcePath = path.join(root, item.relativePath);
      const sourceBytes = readFileSync(sourcePath);
      const sourceHash = sha256(sourceBytes);
      if (sourceBytes.byteLength !== item.sizeBytes || sourceHash !== item.sha256) {
        throw new Error(`${item.id} source bytes/SHA differ from fixtures-manifest.json`);
      }

      const fileResult = fileResults[fileIndex]!;
      for (let sample = fileResult.samples.length + 1; sample <= sampleCount; sample++) {
        const sampleKey = `${item.id}-${String(sample).padStart(2, "0")}`;
        const sampleDir = path.join(samplesDir, sampleKey);
        const storageDir = path.join(sampleDir, "storage");
        const resultPath = path.join(sampleDir, "result.json");
        const logPath = path.join(sampleDir, "compiler.log");
        mkdirSync(storageDir, { recursive: true });
        const logFd = openSync(logPath, "w");

        const child = spawn(process.execPath, ["--max-old-space-size=8192", "--import", "tsx", path.join(root, "scripts/cad-v2/l11-cold-release-benchmark.ts"), "--sample"], {
          cwd: root,
          windowsHide: true,
          stdio: ["ignore", logFd, logFd],
          env: {
            ...process.env,
            CAD_V2_L11_SOURCE_ID: item.id,
            CAD_V2_L11_SOURCE_PATH: sourcePath,
            CAD_V2_L11_SOURCE_SHA256: item.sha256,
            CAD_V2_L11_SAMPLE: String(sample),
            CAD_V2_L11_STORAGE_DIR: storageDir,
            CAD_V2_L11_RESULT_PATH: resultPath,
          },
        });
        const exitCode = await new Promise<number | null>((resolve, reject) => {
          child.once("error", reject);
          child.once("close", resolve);
        }).finally(() => closeSync(logFd));
        completed++;

        if (exitCode !== 0 || !existsSync(resultPath)) {
          report.failures.push({ id: item.id, sample, exitCode, logPath });
          report.status = "FAILED";
          writeJson(reportPath, report);
          throw new Error(`${sampleKey} failed with exit ${exitCode}; isolated data preserved at ${sampleDir}`);
        }

        const sampleResult = JSON.parse(readFileSync(resultPath, "utf8")) as SampleResult;
        if (sampleResult.sample !== sample || sampleResult.status !== "ready" || sampleResult.sourceSha256 !== item.sha256) {
          report.failures.push({ id: item.id, sample, exitCode: 1, logPath });
          report.status = "FAILED";
          writeJson(reportPath, report);
          throw new Error(`${sampleKey} output did not match READY/source identity; isolated data preserved at ${sampleDir}`);
        }
        fileResult.samples.push(sampleResult);

        assertInside(runDir, storageDir, `${sampleKey} storage`);
        rmSync(storageDir, { recursive: true, force: true });
        fileResult.medianColdPrepareMs = Number(quantile(fileResult.samples.map((entry) => entry.elapsedMs), 0.5).toFixed(3));
        if (fileResult.samples.length >= 2) {
          fileResult.p95ColdPrepareMs = Number(quantile(fileResult.samples.map((entry) => entry.elapsedMs), 0.95).toFixed(3));
        }
        writeJson(reportPath, report);
        console.log(`[L11_COLD_PROGRESS] ${JSON.stringify({ id: item.id, sample, sampleCount, completed, total, elapsedMs: sampleResult.elapsedMs, fileMedianMs: fileResult.medianColdPrepareMs, remainingSourceMsEstimate: null })}`);
      }
    }

    report.status = "COMPLETE";
    report.finishedAt = new Date().toISOString();
    writeJson(reportPath, report);
    console.log(`[L11_COLD_COMPLETE] ${JSON.stringify({ reportPath, completed: fileResults.reduce((sum, file) => sum + file.samples.length, 0), files: fileResults.map(({ id, samples, medianColdPrepareMs, p95ColdPrepareMs }) => ({ id, samples: samples.length, medianColdPrepareMs, p95ColdPrepareMs })) })}`);
  } catch (error) {
    if (report.status === "RUNNING") report.status = "FAILED";
    report.finishedAt = new Date().toISOString();
    writeJson(reportPath, report);
    throw error;
  }
}

if (process.argv.includes("--sample")) {
  runSample().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  runBatch().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
