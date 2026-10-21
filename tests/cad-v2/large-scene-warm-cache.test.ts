import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { CadV2DurableService } from "../../src/lib/cad-v2/service/cad-v2-durable-service";

async function main() {
  const fixturePath = path.join(process.cwd(), "tests/cad-v2/fixtures-manifest.json");
  const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as { realCorpus: Array<{ id: string; relativePath: string; sha256: string }> };
  const fixture = fixtures.realCorpus.find((entry) => entry.id === "R003");
  assert(fixture, "R003 real DWG fixture is present");
  const sourcePath = path.join(process.cwd(), fixture.relativePath);
  const source = fs.readFileSync(sourcePath);
  assert.equal(createHash("sha256").update(source).digest("hex"), fixture.sha256, "R003 source bytes match their recorded SHA-256");

  const runId = `l11-r003-cache-${process.pid}-${Date.now()}`;
  const outputRoot = path.resolve(process.env.CAD_V2_TEST_OUTPUT_ROOT || "test-output/cad-v2-tmp");
  const runDir = path.join(outputRoot, runId);
  const storageDir = path.join(runDir, "scenes");
  process.env.CAD_V2_STORAGE_DIR = storageDir;
  const service = CadV2DurableService.getInstance();
  const fileId = `file_l11_${runId}`;
  const sourceVersionKey = `v_l11_${runId}`;
  const coldStarted = performance.now();
  const cold = await service.prepare({
    fileId,
    expectedSourceVersionKey: sourceVersionKey,
    clientRequestId: `req_l11_cold_${runId}`,
    sourceBuffer: source,
    fileName: path.basename(sourcePath),
  });
  const coldPrepareMs = performance.now() - coldStarted;
  assert.equal(cold.status, "ready", "large R003 cold prepare reaches READY only after all immutable objects pass staging integrity");
  assert(cold.sceneId, "R003 cold prepare returns a scene ID");

  const manifest = service.getManifest(cold.sceneId);
  assert(manifest, "R003 READY manifest is available");
  assert.equal(manifest.chunks.length, 0, "large scene transport manifest keeps flat chunk descriptors out of the root");
  assert(manifest.indexPages.length > 1, "large scene is split across multiple immutable index pages");
  assert(Buffer.byteLength(JSON.stringify(manifest), "utf8") <= manifest.limits.maxManifestBytes,
    "large scene root manifest remains within its declared byte limit");

  const warmDurationsMs: number[] = [];
  const sessionIds = new Set([cold.viewSessionId]);
  for (let iteration = 1; iteration <= 30; iteration++) {
    const started = performance.now();
    const warm = await service.prepare({
      fileId,
      expectedSourceVersionKey: sourceVersionKey,
      clientRequestId: `req_l11_warm_${runId}_${iteration}`,
    });
    warmDurationsMs.push(performance.now() - started);
    assert(warm.status === "ready" && warm.sceneId === cold.sceneId,
      `R003 warm prepare ${iteration}/30 returns the same READY scene`);
    sessionIds.add(warm.viewSessionId);
  }
  const sorted = [...warmDurationsMs].sort((a, b) => a - b);
  const p50Ms = sorted[Math.floor((sorted.length - 1) * 0.5)]!;
  const p95Ms = sorted[Math.ceil(sorted.length * 0.95) - 1]!;
  assert(p95Ms <= 2_000, `R003 warm p95 is <= 2s after verified in-memory object-set reuse (observed ${p95Ms.toFixed(1)} ms)`);

  const indexReference = manifest.indexPages.find((page: any) => page.chunkIds?.includes("chunk_model_004")) || manifest.indexPages[0];
  const index = await service.getSceneIndex(cold.sceneId, indexReference.indexId);
  assert(index?.chunks?.length > 0, "R003 index endpoint returns a nonempty, immutable page payload");
  const canary = index.chunks.find((chunk: any) => chunk.chunkId === "chunk_model_004") || index.chunks[0];
  const chunk = await service.getChunkAsync(cold.sceneId, canary.chunkId);
  assert(chunk && chunk.byteLength === canary.byteLength &&
    createHash("sha256").update(chunk).digest("hex") === canary.sha256,
  `R003 ${canary.chunkId} request resolves to the exact indexed bytes`);
  assert.equal(await service.getChunkAsync(cold.sceneId, "chunk_model_unauthorized_l11"), null,
    "chunk endpoint rejects IDs outside the immutable manifest allow-list");

  for (const sessionId of sessionIds) {
    if (service.getViewSession(sessionId)) service.deleteViewSession(sessionId);
  }
  fs.mkdirSync(runDir, { recursive: true });
  const reportPath = path.join(runDir, "r003-large-scene-warm-cache.json");
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    compilerVersion: manifest.compilerVersion,
    sceneId: cold.sceneId,
    sourceSha256: fixture.sha256,
    coldPrepareMs,
    warmIterations: warmDurationsMs.length,
    warmDurationsMs,
    p50Ms,
    p95Ms,
    rootManifestBytes: Buffer.byteLength(JSON.stringify(manifest), "utf8"),
    indexPageCount: manifest.indexPages.length,
    chunkCanary: canary.chunkId,
  }, null, 2), "utf8");
  console.log(`large-scene-warm-cache: PASS (R003 p50=${p50Ms.toFixed(1)} ms, p95=${p95Ms.toFixed(1)} ms, report=${reportPath})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
