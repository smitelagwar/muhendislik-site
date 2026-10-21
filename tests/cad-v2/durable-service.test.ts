// ============================================================================
// DWG/DXF MOTOR V2 — G11 DURABLE SERVICE TEST SUITE
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G11)
// Gereksinimler: R18, R19, R20, R27, R43, R47 | Alt kabul: C07, C08, C09, C10

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import {
  CadV2DurableService,
  type PrepareRequest,
} from "../../src/lib/cad-v2/service/cad-v2-durable-service";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

class SilentDropBlobStorageAdapter {
  private dropped = false;
  private readonly paths = new Set<string>();

  constructor(private readonly root: string) {}

  isConfigured() { return true; }

  async put(pathname: string, body: string | Uint8Array) {
    if (!this.dropped && pathname.endsWith(".bin")) {
      this.dropped = true;
      return;
    }
    const root = path.resolve(this.root);
    const target = path.resolve(root, ...pathname.split("/"));
    if (!target.startsWith(root + path.sep)) throw new Error("TEST_BLOB_PATH_OUTSIDE_ROOT");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, typeof body === "string" ? body : Buffer.from(body));
    this.paths.add(pathname);
  }

  async get(pathname: string): Promise<Uint8Array | null> {
    const root = path.resolve(this.root);
    const target = path.resolve(root, ...pathname.split("/"));
    return fs.existsSync(target) ? new Uint8Array(fs.readFileSync(target)) : null;
  }

  hasCompatibilityManifest() {
    return [...this.paths].some((pathname) => /^cad-v2\/scenes\/[^/]+\/manifest\.json$/.test(pathname));
  }
}

async function runDurableServiceTests() {
  console.log("=== DWG/DXF Motor V2 - G11 Durable Servis ve Hazırlama Testi ===");

  // Keep integration-test writes away from the user's persistent .data store.
  const tempStorage = path.join(os.tmpdir(), `cad-v2-durable-test-${process.pid}-${crypto.randomUUID()}`);
  const service = new CadV2DurableService(tempStorage);

  // [Test 1] Idempotent Prepare & clientRequestId Retry (R18, C07)
  console.log("\n[Test 1] Idempotent Prepare & clientRequestId Tekrarı (C07):");
  const clientReqId = crypto.randomUUID();
  const fileId = "test_file_001";
  const sourceVersionKey = "rev_abc123";

  const prep1 = await service.prepare({
    fileId,
    clientRequestId: clientReqId,
    expectedSourceVersionKey: sourceVersionKey,
  });

  assert(Boolean(prep1.viewSessionId), "İlk hazırlama isteği geçerli bir viewSessionId üretti");
  assert(prep1.status === "preparing", "İlk hazırlama durumu 'preparing' olarak başladı");

  // Aynı clientRequestId ile retry
  const prepRetry = await service.prepare({
    fileId,
    clientRequestId: clientReqId,
    expectedSourceVersionKey: sourceVersionKey,
  });

  assert(
    prepRetry.viewSessionId === prep1.viewSessionId,
    "Aynı clientRequestId için aynı viewSessionId döndü (idempotence doğrulandı)"
  );
  assert(prepRetry.jobId === prep1.jobId, "Aynı jobId döndü");

  // [Test 2] View Session 180s TTL ve Heartbeat (R18, C08)
  console.log("\n[Test 2] View Session 180s TTL ve Heartbeat Sözleşmesi (C08):");
  const sessionBefore = service.heartbeatViewSession(prep1.viewSessionId);
  assert(
    sessionBefore.expiresAt > Date.now() + 170_000,
    "Heartbeat sonrası session son kullanma süresi ~180 saniye ileriye uzatıldı"
  );
  assert(
    sessionBefore.viewSessionId === prep1.viewSessionId,
    "Heartbeat doğru viewSessionId döndürdü"
  );

  let expiredErrorCaught = false;
  try {
    service.heartbeatViewSession("non_existent_session");
  } catch (err: unknown) {
    expiredErrorCaught = true;
    assert(err instanceof Error && err.message.includes("VIEW_SESSION_EXPIRED"), "Olmayan veya süresi dolan oturum VIEW_SESSION_EXPIRED hatası verdi");
  }
  assert(expiredErrorCaught, "Geçersiz oturum için heartbeat reddedildi");

  // [Test 3] DELETE unobserved job iptali ve fencing artışı (R27, C08, C09)
  console.log("\n[Test 3] DELETE İle İzleyici Ayrılması ve Unobserved İptali (C08, C09):");
  const jobId = prep1.jobId!;
  const jobBefore = service.getJob(jobId);
  assert(jobBefore !== null, "İş bulundu");
  assert(jobBefore!.fence === 1, "Başlangıç fencing token 1");

  // Oturumu sil
  const deleteResult = service.deleteViewSession(prep1.viewSessionId);
  assert(deleteResult === true, "deleteViewSession başarıyla tamamlandı (204)");

  const jobAfter = service.getJob(jobId);
  assert(jobAfter!.status === "cancelled", "Başka izleyici kalmadığı için iş 'cancelled' durumuna geçti");
  assert(jobAfter!.fence === 2, "Fencing token artırıldı (fence=2)");

  // [Test 4] Gerçek DXF İle Tam Hazırlama, Atomik Publish ve Manifest/Chunk Doğrulaması (R17, R21, C01, C03)
  console.log("\n[Test 4] Gerçek DXF İle Hazırlama ve Atomik Publish:");
  const testDxfContent = `0
SECTION
2
ENTITIES
0
LINE
8
0
10
0.0
20
0.0
11
100.0
21
100.0
0
CIRCLE
8
WALL
10
50.0
20
50.0
40
25.0
0
ENDSEC
0
EOF
`;
  const dxfBuffer = Buffer.from(testDxfContent, "utf-8");
  const clientReqId2 = crypto.randomUUID();

  const prepReady = await service.prepare({
    fileId: "syn_curves_file",
    clientRequestId: clientReqId2,
    expectedSourceVersionKey: "v_curves_1",
    sourceBuffer: dxfBuffer,
    fileName: "SYN-CURVES.dxf",
  });

  assert(prepReady.status === "ready",
    `Kaynak dosyasıyla çağırma 'ready' sahne üretti (response=${JSON.stringify(prepReady)}, job=${JSON.stringify(prepReady.jobId ? service.getJob(prepReady.jobId) : null)})`);
  assert(Boolean(prepReady.sceneId), `Sahne kimliği üretildi: ${prepReady.sceneId}`);

  // [Test 4a] A synchronous cold compile must not consume the returned view-session TTL.
  console.log("\n[Test 4a] Senkron cold prepare tamamlanınca session TTL yeniden başlatılır:");
  const longPrepareInternals = service as unknown as {
    executeJobSync: (...args: any[]) => Promise<void>;
    clientRequestMap: Map<string, { viewSessionId: string }>;
    viewSessions: Map<string, { expiresAt: number }>;
  };
  const originalExecuteJobSync = longPrepareInternals.executeJobSync;
  longPrepareInternals.executeJobSync = async (job: any, ...args: any[]) => {
    await originalExecuteJobSync.call(service, job, ...args);
    const viewSessionId = longPrepareInternals.clientRequestMap.get(job.clientRequestId)?.viewSessionId;
    const session = viewSessionId ? longPrepareInternals.viewSessions.get(viewSessionId) : undefined;
    if (!session) throw new Error("TEST_SYNC_PREPARE_SESSION_MISSING");
    session.expiresAt = Date.now() - 1;
  };
  let longPrepareResult: Awaited<ReturnType<CadV2DurableService["prepare"]>>;
  try {
    longPrepareResult = await service.prepare({
      fileId: "sync_compile_session_ttl",
      clientRequestId: crypto.randomUUID(),
      expectedSourceVersionKey: "v_sync_ttl_1",
      sourceBuffer: dxfBuffer,
      fileName: "sync-session-ttl.dxf",
    });
  } finally {
    longPrepareInternals.executeJobSync = originalExecuteJobSync;
  }
  assert(longPrepareResult.status === "ready", "Senkron compile yeni session ile ready döner");
  let syncPrepareHeartbeat: { expiresAt: number } | null = null;
  try {
    syncPrepareHeartbeat = service.heartbeatViewSession(longPrepareResult.viewSessionId);
  } catch {
    // The next assertion reports the stale-session regression with a focused message.
  }
  assert(
    syncPrepareHeartbeat !== null && syncPrepareHeartbeat.expiresAt > Date.now() + 170_000,
    "Cold sync prepare süresi session TTL'sini tüketmez; ilk heartbeat geçerlidir",
  );

  // Manifest doğrulaması
  const manifest = service.getManifest(prepReady.sceneId!);
  assert(manifest !== null, "getManifest sahne manifestini döndürdü");
  assert(manifest.schemaVersion === 1, "Manifest schemaVersion === 1");
  assert(manifest.renderAbi === "three172-cad2d-v2", "Manifest renderAbi === three172-cad2d-v2");
  assert(manifest.indexPages.length > 0, "Manifest en az 1 indexPage içeriyor");
  assert(Buffer.byteLength(JSON.stringify(manifest), "utf8") <= manifest.limits.maxManifestBytes,
    "READY manifest bildirilen byte tavanının altında kalır");

  // Chunk doğrulaması
  const firstIndex = manifest.indexPages[0];
  assert(firstIndex.chunks.length > 0, "Index en az 1 chunk içeriyor");
  const servedIndex = await service.getSceneIndex(prepReady.sceneId!, firstIndex.indexId);
  assert(servedIndex?.indexId === firstIndex.indexId && servedIndex.chunks?.length === firstIndex.chunks.length,
    "GET scene index gerçek immutable index payload'unu döndürür");
  const firstChunkId = firstIndex.chunks[0].chunkId;
  const chunkBytes = service.getChunk(prepReady.sceneId!, firstChunkId);
  assert(chunkBytes !== null, `getChunk(${firstChunkId}) ikili parça verisi döndürdü`);
  assert(chunkBytes!.byteLength > 32, "Chunk en az header (32 bayt) uzunluğunda");

  // Magic bytes doğrulaması (DV2SCN01)
  const magic = Buffer.from(chunkBytes!.buffer, chunkBytes!.byteOffset, 8).toString("ascii");
  assert(magic === "DV2SCN01", `Chunk ikili başlık magic 'DV2SCN01' doğrulandı: ${magic}`);

  // Same-process immutable memory cache must remain internally complete, while
  // a cold reader must fail closed if a persisted object is missing.
  const missingChunkPath = path.join(tempStorage, prepReady.sceneId!, "objects", manifest.storageGeneration, `${firstChunkId}.bin`);
  const savedChunkBytes = fs.readFileSync(missingChunkPath);
  fs.unlinkSync(missingChunkPath);
  try {
    const warmCachePrepare = await service.prepare({
      fileId: "syn_curves_file",
      clientRequestId: crypto.randomUUID(),
      expectedSourceVersionKey: "v_curves_1",
    });
    assert(warmCachePrepare.status === "ready" && warmCachePrepare.sceneId === prepReady.sceneId,
      "Tam bellek cache'i, diskteki eksik nesneden bağımsız aynı scene'i sunar");
    assert((await service.getChunkAsync(prepReady.sceneId!, firstChunkId))?.byteLength === savedChunkBytes.byteLength,
      "Bellek cache'i chunk isteğini 404'e düşürmeden karşılar");

    const coldReader = new CadV2DurableService(tempStorage);
    assert(await coldReader.getManifestAsync(prepReady.sceneId!) === null,
      "Eksik immutable chunk varken cold reader manifesti READY kabul etmez");
    assert(await coldReader.getChunkAsync(prepReady.sceneId!, firstChunkId) === null,
      "Eksik immutable chunk cold reader'da bulunamadı olarak kalır");
  } finally {
    fs.writeFileSync(missingChunkPath, savedChunkBytes);
  }

  const tamperedChunkBytes = Buffer.from(savedChunkBytes);
  const lastByteIndex = tamperedChunkBytes.length - 1;
  tamperedChunkBytes.writeUInt8(tamperedChunkBytes.readUInt8(lastByteIndex) ^ 1, lastByteIndex);
  fs.writeFileSync(missingChunkPath, tamperedChunkBytes);
  try {
    const tamperedReader = new CadV2DurableService(tempStorage);
    assert(await tamperedReader.getManifestAsync(prepReady.sceneId!) === null,
      "Aynı uzunluktaki SHA-256 bozuk immutable chunk cold reader'da READY kabul edilmez");
  } finally {
    fs.writeFileSync(missingChunkPath, savedChunkBytes);
  }

  const silentDropBlobDir = path.join(tempStorage, "silent-drop-blob");
  const silentDropAdapter = new SilentDropBlobStorageAdapter(silentDropBlobDir);
  const silentDropService = new CadV2DurableService(path.join(tempStorage, "silent-drop-cache"), silentDropAdapter, null);
  const silentDropResult = await silentDropService.prepare({
    fileId: "silent_drop_file",
    clientRequestId: crypto.randomUUID(),
    expectedSourceVersionKey: "silent_drop_v1",
    sourceBuffer: dxfBuffer,
    fileName: "silent-drop.dxf",
  });
  const silentDropJob = silentDropService.getJob(silentDropResult.jobId || "");
  assert(silentDropResult.status !== "ready" && silentDropJob?.status === "failed",
    "Başarılı görünen Blob PUT eksik chunk içeriyorsa job READY olmadan fail-closed olur");
  assert(silentDropJob?.error?.includes("CAD_V2_BLOB_OBJECT_SET_INCOMPLETE") === true,
    "Eksik immutable Blob nesnesi yayın öncesi integrity hatası üretir");
  assert(!silentDropAdapter.hasCompatibilityManifest(),
    "Eksik object set doğrulanmadan sabit READY manifest pointer yayımlanmaz");

  // [Test 5] Fencing İhlali Negatif Kontrolü (C09)
  console.log("\n[Test 5] Fencing İhlali Negatif Kontrolü (C09):");
  const dummyJob: import("../../src/lib/cad-v2/service/cad-v2-durable-service").CadV2Job = {
    jobId: "job_fenced",
    fileId: "file_fenced",
    sourceVersionKey: "v_fenced",
    clientRequestId: "req_fenced",
    status: "running",
    phase: "source",
    fence: 99, // Geçersiz fence
    attempt: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await service.executeJobSync(dummyJob, Buffer.from("0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nEOF\n"), "test.dxf");
  assert(dummyJob.status === "failed", "Fencing ihlalinde iş 'failed' oldu");
  assert(dummyJob.error?.includes("Fencing token ihlali"), "Hata mesajı fencing ihlalini bildirdi");

  console.log("\n>>> G11 DURABLE SERVICE TESTLERİ BAŞARIYLA GEÇTİ (5/5 PASS) <<<");
}

runDurableServiceTests().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
