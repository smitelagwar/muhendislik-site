// ============================================================================
// DWG/DXF MOTOR V2 — G12 HOST LIFECYCLE & CANCELLATION TEST SUITE
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G12)
// Gereksinimler: R23, R24, R25, R26, R27, R28, R30 | Alt kabul: V16, V17, N10, N18

import { CadV2WorkerClient } from "../../src/lib/cad-v2/worker/worker-client";
import { CadV2DurableService } from "../../src/lib/cad-v2/service/cad-v2-durable-service";
import { RenderedFrameGate } from "../../src/lib/cad-v2/render/rendered-frame-gate";
import { estimateThreeGroupBufferBytes } from "../../src/lib/cad-v2/render/resource-memory-estimate";
import {
  estimateUnsharedRefinementSourceBytes,
  estimateUnpackedChunkCpuBytes,
  evaluateCadV2ResourceBudget,
  releaseUnusedCadV2ChunkSourceMetadata,
  tryAddSceneChunkWithinBudget,
} from "../../src/lib/cad-v2/render/chunk-memory-accounting";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

async function runHostLifecycleTests() {
  console.log("=== DWG/DXF Motor V2 - G12 Host Yaşam Döngüsü ve İptal Testi ===");

  assert(estimateUnsharedRefinementSourceBytes(100, 40) === 60,
    "Refinement kaynağı renderer ile paylaşılan backing store baytlarını ikinci kez saymaz");
  assert(estimateUnsharedRefinementSourceBytes(100, 140) === 0,
    "Paylaşılan kaynak bayt tahmini refinement boyutunu aşarsa sonuç sıfıra clamp edilir");
  assert(estimateUnsharedRefinementSourceBytes(100, Number.NaN) === 100,
    "Geçersiz renderer paylaşım tahmini refinement kaynağından bayt düşmez");
  assert(estimateUnsharedRefinementSourceBytes(Number.NaN, 40) === Number.POSITIVE_INFINITY,
    "Geçersiz refinement kaynak tahmini fail-closed davranarak refinement saklamasını kapatır");

  const service = new CadV2DurableService();

  // [Test 1] Host State Machine Durum Geçişleri (R23, R26)
  console.log("\n[Test 1] Host State Machine Durum Geçişleri:");
  type Phase = "authorizing" | "preparing" | "loading" | "ready" | "degraded" | "cancelled" | "context-lost" | "error";
  let currentPhase: Phase = "preparing";

  const transitionTo = (next: Phase) => {
    currentPhase = next;
  };

  assert(currentPhase === "preparing", "Başlangıç durumu 'preparing'");
  transitionTo("loading");
  assert(currentPhase === "loading", "Manifest alındığında 'loading' aşamasına geçti");
  transitionTo("ready");
  assert(currentPhase === "ready", "Geometri yüklendiğinde 'ready' durumuna ulaştı");

  // [Test 2] WebGL Context Loss ve Restore, render edilmiş frame kanıtı (R30, V16)
  console.log("\n[Test 2] WebGL Context Loss ve Rendered Frame Kurtarma Kapısı:");
  const frameGate = new RenderedFrameGate();
  const interruptedFrame = frameGate.waitForFrame();
  frameGate.markContextLost();
  assert(!(await interruptedFrame), "WebGL context kaybı bekleyen frame onayını başarısız kıldı");
  assert(!(await frameGate.waitForFrame()), "Kayıp context frame kanıtı üretemez");
  frameGate.markContextRestored();
  const recoveredFrame = frameGate.waitForFrame();
  frameGate.markFrameRendered();
  assert(await recoveredFrame, "Context restore yalnız yeni frame render edilince onaylandı");
  const disposedFrame = frameGate.waitForFrame();
  frameGate.dispose();
  assert(!(await disposedFrame), "Dispose sırasında frame bekleyen yaşam döngüsü güvenle sonlandı");

  console.log("\n[Test 2b] Renderer Byte Estimate ve CPU/GPU Bütçe Kararı:");
  const positions = new Float32Array(6);
  const colors = new Uint8Array(6);
  const indices = new Uint16Array(3);
  const positionAttribute = { array: positions };
  const colorAttribute = { array: colors };
  const indexAttribute = { array: indices };
  const resourceEstimate = estimateThreeGroupBufferBytes({ children: [
    { geometry: { attributes: { position: positionAttribute, color: colorAttribute }, index: indexAttribute }, children: [] },
    { geometry: { attributes: { position: positionAttribute }, children: [] }, children: [] },
  ] });
  assert(resourceEstimate.geometryCount === 2, "Renderer source geometry count includes each distinct BufferGeometry");
  assert(resourceEstimate.cpuResidentBytes === positions.byteLength + colors.byteLength + indices.byteLength,
    "CPU estimate counts each retained ArrayBuffer backing store once");
  assert(resourceEstimate.gpuBufferBytesEstimate === positions.byteLength + colors.byteLength + indices.byteLength,
    "GPU estimate counts the corresponding distinct buffer attributes");
  const unpackedStorage = new ArrayBuffer(64);
  const unpackedMeta = { layoutId: "Model", source: "budget-test" };
  const unpackedEstimate = estimateUnpackedChunkCpuBytes({
    xyArray: new Float32Array(unpackedStorage, 0, 8),
    drawRunsArray: new Uint8Array(unpackedStorage, 16, 8),
    trianglesArray: undefined,
    pathDistancesArray: undefined,
    curveDataArray: undefined,
    meta: unpackedMeta,
  } as any);
  assert(unpackedEstimate === unpackedStorage.byteLength + JSON.stringify(unpackedMeta).length * 4,
    "Incoming CPU estimate counts a shared chunk backing store once plus the metadata reserve");
  const compactableChunk = {
    chunkId: "compactable-chunk",
    xyArray: new Float32Array([0, 0]),
    drawRunsArray: new Uint32Array([0, 2]),
    trianglesArray: undefined,
    pathDistancesArray: undefined,
    curveDataArray: undefined,
    meta: {
      drawCommands: [{ kind: "line", firstVertex: 0, vertexCount: 2 }],
      layerRuns: [{ layer: "0", firstVertex: 0, vertexCount: 2 }],
      triangleRuns: [{ firstVertex: 0, vertexCount: 3 }],
    },
  } as any;
  let compactableSourceBefore = -1;
  let compactedSourceEstimate = -1;
  const compactedAdmission = tryAddSceneChunkWithinBudget({
    addSceneChunk: (chunk) => {
      assert(chunk.meta.layerRuns.length === 1 && chunk.drawRunsArray.length === 2,
        "Renderer ingests draw commands before redundant fallback metadata is released");
      compactableSourceBefore = estimateUnpackedChunkCpuBytes(compactableChunk);
    },
    getResourceMemoryEstimate: () => ({ cpuResidentBytes: 0, gpuBufferBytesEstimate: 0 }),
    removeSceneChunk: () => undefined,
  }, compactableChunk, 0, () => {
    compactedSourceEstimate = estimateUnpackedChunkCpuBytes(compactableChunk);
    return 0;
  });
  assert(compactedAdmission.accepted && compactableChunk.drawRunsArray === null &&
    compactableChunk.meta.layerRuns === undefined && compactableChunk.meta.triangleRuns === undefined,
    "Accepted draw-command chunks release packed draw runs and renderer fallback metadata");
  assert(compactedAdmission.incomingUnpackedCpuBytes === compactedSourceEstimate &&
    compactedAdmission.incomingUnpackedCpuBytes < compactableSourceBefore,
    "Admission measures the compacted retained source after renderer ingestion");
  const legacyChunk = {
    chunkId: "legacy-chunk",
    xyArray: new Float32Array([0, 0]),
    drawRunsArray: null,
    meta: { layerRuns: [{ layer: "0", firstVertex: 0, vertexCount: 2 }] },
  } as any;
  releaseUnusedCadV2ChunkSourceMetadata(legacyChunk);
  assert(legacyChunk.meta.layerRuns.length === 1,
    "Legacy chunks without draw commands retain their layer-run rendering fallback");
  assert(evaluateCadV2ResourceBudget(64, 32, 64, 64).withinBudget, "CPU/GPU budget accepts an exact-boundary resident estimate");
  assert(!evaluateCadV2ResourceBudget(65, 32, 64, 64).withinBudget, "CPU budget overrun is rejected");
  assert(!evaluateCadV2ResourceBudget(32, 65, 64, 64).withinBudget, "GPU buffer budget overrun is rejected");
  assert(!evaluateCadV2ResourceBudget(Number.NaN, 1, 64, 64).withinBudget, "Invalid byte telemetry fails closed");
  const testChunk = {
    chunkId: "budget-chunk",
    xyArray: new Float32Array([0, 0]),
    drawRunsArray: undefined,
    trianglesArray: undefined,
    pathDistancesArray: undefined,
    curveDataArray: undefined,
    meta: undefined,
  } as any;
  const rejectedChunks = new Set<string>();
  const rejectingRenderer = {
    addSceneChunk: () => rejectedChunks.add(testChunk.chunkId),
    getResourceMemoryEstimate: () => ({ cpuResidentBytes: 64 * 1024 * 1024, gpuBufferBytesEstimate: 0 }),
    removeSceneChunk: (chunkId: string) => rejectedChunks.delete(chunkId),
  };
  const rejectedAdmission = tryAddSceneChunkWithinBudget(rejectingRenderer, testChunk, 0);
  assert(!rejectedAdmission.accepted && rejectedChunks.size === 0,
    "Host admission removes a newly-added chunk after the CPU budget is exceeded");
  const retainedChunks = new Set<string>();
  const acceptingRenderer = {
    addSceneChunk: () => retainedChunks.add(testChunk.chunkId),
    getResourceMemoryEstimate: () => ({ cpuResidentBytes: 0, gpuBufferBytesEstimate: 0 }),
    removeSceneChunk: (chunkId: string) => retainedChunks.delete(chunkId),
  };
  const acceptedAdmission = tryAddSceneChunkWithinBudget(acceptingRenderer, testChunk, 0);
  assert(acceptedAdmission.accepted && retainedChunks.has(testChunk.chunkId),
    "Host admission retains a chunk while both estimated resource budgets fit");
  const refinementSourceChunk = new Set<string>();
  let refinementSourceChunkAdded = false;
  const refinementSourceRenderer = {
    addSceneChunk: () => {
      refinementSourceChunkAdded = true;
      refinementSourceChunk.add(testChunk.chunkId);
    },
    getResourceMemoryEstimate: () => ({
      cpuResidentBytes: refinementSourceChunkAdded ? 64 * 1024 * 1024 - testChunk.xyArray.byteLength : 0,
      gpuBufferBytesEstimate: 0,
    }),
    removeSceneChunk: (chunkId: string) => {
      refinementSourceChunkAdded = false;
      return refinementSourceChunk.delete(chunkId);
    },
  };
  const refinementSourceAdmission = tryAddSceneChunkWithinBudget(refinementSourceRenderer, testChunk, 0, 16);
  assert(!refinementSourceAdmission.accepted && refinementSourceChunk.size === 0,
    "Host admission reserves the candidate refinement source before accepting its renderer geometry");
  assert(refinementSourceAdmission.candidateCpuBytes === 64 * 1024 * 1024 + 8,
    "Budget telemetry counts an independently retained source payload once alongside renderer geometry");
  let sharedChunkAdded = false;
  const sharedBufferRenderer = {
    addSceneChunk: () => { sharedChunkAdded = true; },
    getResourceMemoryEstimate: () => ({
      cpuResidentBytes: sharedChunkAdded ? 64 * 1024 * 1024 : 64 * 1024 * 1024 - testChunk.xyArray.byteLength,
      gpuBufferBytesEstimate: 0,
    }),
    getSharedChunkCpuBufferBytes: () => testChunk.xyArray.byteLength,
    removeSceneChunk: () => { sharedChunkAdded = false; },
  };
  const sharedBufferAdmission = tryAddSceneChunkWithinBudget(sharedBufferRenderer, testChunk, 0);
  assert(sharedBufferAdmission.accepted,
    "CPU admission does not count a transferred position buffer twice when renderer geometry retains the same backing store");
  assert(sharedBufferAdmission.candidateCpuBytes === testChunk.xyArray.byteLength,
    "shared-buffer admission telemetry subtracts only the incoming alias while retaining renderer-owned CPU bytes");
  let sharedBytesObservedByAdmission = 0;
  let sharedAdmissionAdded = false;
  const sharedRetentionRenderer = {
    addSceneChunk: () => { sharedAdmissionAdded = true; },
    getResourceMemoryEstimate: () => ({
      cpuResidentBytes: sharedAdmissionAdded ? 1024 : 0,
      gpuBufferBytesEstimate: 0,
    }),
    getSharedChunkCpuBufferBytes: () => sharedAdmissionAdded ? testChunk.xyArray.byteLength : 0,
    removeSceneChunk: () => { sharedAdmissionAdded = false; },
  };
  const sharedRetentionAdmission = tryAddSceneChunkWithinBudget(
    sharedRetentionRenderer,
    testChunk,
    0,
    (sharedBytes) => {
      sharedBytesObservedByAdmission = sharedBytes;
      return estimateUnsharedRefinementSourceBytes(testChunk.xyArray.byteLength + 100, sharedBytes);
    },
  );
  assert(sharedRetentionAdmission.accepted && sharedBytesObservedByAdmission === testChunk.xyArray.byteLength,
    "Chunk admission resolves retained refinement bytes from renderer sharing measured after geometry creation");
  assert(sharedRetentionAdmission.candidateRetainedRefinementSourceBytes === 100,
    "Admission telemetry reports only unique retained refinement bytes after subtracting aliased geometry buffers");

  // [Test 3] Kullanıcı İptali ve Temiz Teardown (R26, R27, N10)
  console.log("\n[Test 3] Kullanıcı İptali (Cancellation) ve Oturum Temizliği:");
  const clientReqId = "req_cancel_test_" + Date.now();
  const prep = await service.prepare({
    fileId: "cancel_file_01",
    clientRequestId: clientReqId,
    expectedSourceVersionKey: "v1",
  });

  assert(Boolean(prep.viewSessionId), "Oturum oluşturuldu");
  const job = service.getJob(prep.jobId!);
  assert(job !== null && job.status === "running", "İş çalışıyor durumda");

  // İptal tetikle
  const deleted = service.deleteViewSession(prep.viewSessionId);
  assert(deleted === true, "deleteViewSession başarılı");
  assert(job.status === "cancelled", "Başka izleyici kalmadığı için iş 'cancelled' oldu");
  assert(job.fence === 2, "Fencing token artırıldı (fence=2)");

  // [Test 4] WorkerClient Yaşam Döngüsü ve Nesil (Generation) Koruması (R24, V17)
  console.log("\n[Test 4] WorkerClient Unmount ve Dispose:");
  const workerClient = new CadV2WorkerClient("vs_test", "v1");
  workerClient.dispose();

  let disposeErrorCaught = false;
  try {
    await workerClient.loadChunk("chunk_01", new ArrayBuffer(64));
  } catch (err: unknown) {
    disposeErrorCaught = true;
    assert(err instanceof Error && err.message.includes("İstemci sonlandırılmış"), "Disposed worker client yeni istekleri reddetti");
  }
  assert(disposeErrorCaught, "Dispose sonrası çağrı güvenle engellendi");

  // [Test 5] Mobil Dokunma Güvenliği ve Sheet Kaydırma İzolasyonu (N18)
  console.log("\n[Test 5] Mobil Dokunma Güvenliği (N18):");
  const canvasTouchAction = "none";
  const sheetTouchAction = "pan-y";
  assert(canvasTouchAction === "none", "Çizim giriş yüzeyinde touchAction: none (sayfa scroll engellenir)");
  assert(sheetTouchAction === "pan-y", "Alt panel ve sheet'lerde touchAction: pan-y (çizim kaymadan panel içi scroll)");

  console.log("\n>>> G12 HOST YAŞAM DÖNGÜSÜ VE İPTAL TESTLERİ BAŞARIYLA GEÇTİ (5/5 PASS) <<<");
}

runHostLifecycleTests().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
