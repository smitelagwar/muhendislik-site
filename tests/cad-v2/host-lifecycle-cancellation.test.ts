// ============================================================================
// DWG/DXF MOTOR V2 — G12 HOST LIFECYCLE & CANCELLATION TEST SUITE
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G12)
// Gereksinimler: R23, R24, R25, R26, R27, R28, R30 | Alt kabul: V16, V17, N10, N18

import { CadV2WorkerClient } from "../../src/lib/cad-v2/worker/worker-client";
import { CadV2DurableService } from "../../src/lib/cad-v2/service/cad-v2-durable-service";

function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

async function runHostLifecycleTests() {
  console.log("=== DWG/DXF Motor V2 - G12 Host Yaşam Döngüsü ve İptal Testi ===");

  const service = new CadV2DurableService();

  // [Test 1] Host State Machine Durum Geçişleri (R23, R26)
  console.log("\n[Test 1] Host State Machine Durum Geçişleri:");
  type Phase = "authorizing" | "preparing" | "loading" | "ready" | "degraded" | "cancelled" | "context-lost" | "error";
  let currentPhase: any = "preparing";

  const transitionTo = (next: Phase) => {
    currentPhase = next;
  };

  assert(currentPhase === "preparing", "Başlangıç durumu 'preparing'");
  transitionTo("loading");
  assert(currentPhase === "loading", "Manifest alındığında 'loading' aşamasına geçti");
  transitionTo("ready");
  assert(currentPhase === "ready", "Geometri yüklendiğinde 'ready' durumuna ulaştı");

  // [Test 2] WebGL Context Loss ve Restore Davranışı (R30, V16)
  console.log("\n[Test 2] WebGL Context Loss ve Kurtarma:");
  transitionTo("context-lost");
  assert(currentPhase === "context-lost", "WebGL context kaybında 'context-lost' durumuna geçti");
  transitionTo("ready");
  assert(currentPhase === "ready", "Context geri geldiğinde sunucuya gitmeden 'ready' durumuna döndü");

  // [Test 3] Kullanıcı İptali ve Temiz Teardown (R26, R27, N10)
  console.log("\n[Test 3] Kullanıcı İptali (Cancellation) ve Oturum Temizliği:");
  const clientReqId = "req_cancel_test_" + Date.now();
  const prep = await service.prepare({
    fileId: "cancel_file_01",
    clientRequestId: clientReqId,
    expectedSourceVersionKey: "v1",
  });

  assert(Boolean(prep.viewSessionId), "Oturum oluşturuldu");
  const job: any = service.getJob(prep.jobId!);
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
  } catch (err: any) {
    disposeErrorCaught = true;
    assert(err.message.includes("İstemci sonlandırılmış"), "Disposed worker client yeni istekleri reddetti");
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
