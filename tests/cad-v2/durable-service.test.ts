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
  } catch (err: any) {
    expiredErrorCaught = true;
    assert(err.message.includes("VIEW_SESSION_EXPIRED"), "Olmayan veya süresi dolan oturum VIEW_SESSION_EXPIRED hatası verdi");
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

  assert(prepReady.status === "ready", "Kaynak dosyasıyla çağırma 'ready' sahne üretti");
  assert(Boolean(prepReady.sceneId), `Sahne kimliği üretildi: ${prepReady.sceneId}`);

  // Manifest doğrulaması
  const manifest = service.getManifest(prepReady.sceneId!);
  assert(manifest !== null, "getManifest sahne manifestini döndürdü");
  assert(manifest.schemaVersion === 1, "Manifest schemaVersion === 1");
  assert(manifest.renderAbi === "three172-cad2d-v2", "Manifest renderAbi === three172-cad2d-v2");
  assert(manifest.indexPages.length > 0, "Manifest en az 1 indexPage içeriyor");

  // Chunk doğrulaması
  const firstIndex = manifest.indexPages[0];
  assert(firstIndex.chunks.length > 0, "Index en az 1 chunk içeriyor");
  const firstChunkId = firstIndex.chunks[0].chunkId;
  const chunkBytes = service.getChunk(prepReady.sceneId!, firstChunkId);
  assert(chunkBytes !== null, `getChunk(${firstChunkId}) ikili parça verisi döndürdü`);
  assert(chunkBytes!.byteLength > 32, "Chunk en az header (32 bayt) uzunluğunda");

  // Magic bytes doğrulaması (DV2SCN01)
  const magic = Buffer.from(chunkBytes!.buffer, chunkBytes!.byteOffset, 8).toString("ascii");
  assert(magic === "DV2SCN01", `Chunk ikili başlık magic 'DV2SCN01' doğrulandı: ${magic}`);

  // [Test 5] Fencing İhlali Negatif Kontrolü (C09)
  console.log("\n[Test 5] Fencing İhlali Negatif Kontrolü (C09):");
  const dummyJob: any = {
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
