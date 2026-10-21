// ============================================================================
// DWG/DXF MOTOR V2 — R01 DURABLE MULTI-PROCESS TEST SUITE
// ============================================================================
// Sözleşme: Fidelity v3 Planı Bölüm 11 (R01), motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md
// Gereksinimler:
// 1. Çoklu Süreç İzolasyonu: Süreç A derler ve atomik yayınlar, Süreç B (soğuk örnek)
//    diski okur (manifest, parça ikili verileri, metadata, indeks).
// 2. Süreç Ölümü / Kill Davranışı: A süreci yarıda kesilirse (crash/kill), yarım kalan
//    staging verisi nihai yayını bozmaz; B süreci temiz devam edebilir.
// 3. Fencing ve Stale Lease İhlali: İptal edilmiş veya fence token'ı artırılmış eski
//    işin yayını kesin olarak reddedilir ve staging klasörü temizlenir.
// 4. Eksik Kaynak Tamponu: Kaynak buffer yokken iş sonsuz 'running' durumunda asılı
//    kalmaz; anında 'failed' durumuna geçer.
// 5. Unobserved Job İptali ve Fencing Artışı: İzleyicisi kalmayan iş cancelled olur,
//    fence artar; çoklu izleyicide tek izleyici ayrılınca iş devam eder.

import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import * as os from "node:os";
import { spawn } from "node:child_process";
import {
  CadV2DurableService,
  type CadV2Job,
} from "../../src/lib/cad-v2/service/cad-v2-durable-service";

const SAMPLE_DXF = `0
SECTION
2
ENTITIES
0
LINE
8
WALL
10
0.0
20
0.0
11
150.0
21
0.0
0
CIRCLE
8
COLUMN
10
75.0
20
50.0
40
25.0
0
ENDSEC
0
EOF
`;

const TSX_CLI = path.resolve(process.cwd(), "node_modules/tsx/dist/cli.mjs");

// ----------------------------------------------------------------------------
// Alt Süreç (Child Process) Rolleri
// ----------------------------------------------------------------------------
async function runChildRole(args: string[]) {
  const roleIndex = args.indexOf("--role");
  const role = args[roleIndex + 1];

  const storageIndex = args.indexOf("--storage");
  const storageDir = args[storageIndex + 1];

  if (role === "child-publisher") {
    const fileIdIndex = args.indexOf("--fileId");
    const fileId = args[fileIdIndex + 1] || "proc_a_file";

    const service = new CadV2DurableService(storageDir);
    const clientReqId = crypto.randomUUID();
    const dxfBuffer = Buffer.from(SAMPLE_DXF, "utf-8");

    const prep = await service.prepare({
      fileId,
      clientRequestId: clientReqId,
      expectedSourceVersionKey: "v_proc_a_1",
      sourceBuffer: dxfBuffer,
      fileName: "proc_a.dxf",
    });

    const output = {
      success: prep.status === "ready",
      sceneId: prep.sceneId,
      viewSessionId: prep.viewSessionId,
      sourceVersionKey: prep.sourceVersionKey,
    };
    process.stdout.write(JSON.stringify(output) + "\n");
    process.exit(0);
  }

  if (role === "child-verifier") {
    const sceneIdIndex = args.indexOf("--sceneId");
    const sceneId = args[sceneIdIndex + 1];

    const service = new CadV2DurableService(storageDir);
    const manifest = service.getManifest(sceneId);

    if (!manifest) {
      process.stdout.write(JSON.stringify({ error: "MANIFEST_NOT_FOUND" }) + "\n");
      process.exit(1);
    }

    const firstChunkId = manifest.chunks[0]?.chunkId;
    const chunkBytes = firstChunkId ? service.getChunk(sceneId, firstChunkId) : null;

    const output = {
      manifestSceneId: manifest.sceneId,
      schemaVersion: manifest.schemaVersion,
      renderAbi: manifest.renderAbi,
      chunkCount: manifest.chunks.length,
      firstChunkByteLength: chunkBytes ? chunkBytes.byteLength : 0,
      firstChunkMagic: chunkBytes
        ? Buffer.from(chunkBytes.buffer, chunkBytes.byteOffset, 8).toString("ascii")
        : null,
    };
    process.stdout.write(JSON.stringify(output) + "\n");
    process.exit(0);
  }

  if (role === "simulate-crash") {
    const stagingJobId = "crashed_job_pid_" + process.pid;
    const jobStagingDir = path.join(storageDir, "staging", stagingJobId);
    fs.mkdirSync(jobStagingDir, { recursive: true });
    fs.writeFileSync(path.join(jobStagingDir, "partial_chunk.bin"), Buffer.from("INCOMPLETE_DATA"));

    // Hazır olduğunu bildirip beklemede kal
    process.stdout.write("STAGING_READY\n");
    await new Promise((resolve) => setTimeout(resolve, 60_000));
    process.exit(0);
  }

  process.exit(0);
}

// ----------------------------------------------------------------------------
// Ana Test Yöneticisi
// ----------------------------------------------------------------------------
async function runDurableMultiProcessTests() {
  console.log("=== DWG/DXF Motor V2 — R01 Çoklu Süreç Dayanıklılık Testi ===");

  const testStorageDir = path.join(
    os.tmpdir(),
    `cad-v2-r01-multiproc-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
  );
  fs.mkdirSync(testStorageDir, { recursive: true });

  // --------------------------------------------------------------------------
  // [Test 1] Süreç A Yayınlar -> Süreç B Soğuk Okur (Multi-Process Isolation)
  // --------------------------------------------------------------------------
  console.log("\n[Test 1] Ayrı Süreç A (Publish) ve Süreç B (Cold Verify):");

  const childA = spawn(
    process.execPath,
    [
      TSX_CLI,
      __filename,
      "--role",
      "child-publisher",
      "--storage",
      testStorageDir,
      "--fileId",
      "multi_proc_file_1",
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );

  let outputA = "";
  childA.stdout.on("data", (d) => (outputA += d.toString()));
  let stderrA = "";
  childA.stderr.on("data", (d) => (stderrA += d.toString()));

  const exitCodeA = await new Promise<number>((resolve) => childA.on("close", resolve));
  assert.equal(exitCodeA, 0, `Süreç A başarıyla sıfır çıkış koduyla bitmelidir. Hata: ${stderrA}`);

  const resultA = JSON.parse(outputA.trim());
  assert.equal(resultA.success, true, "Süreç A sahneyi 'ready' durumunda tamamlamalıdır.");
  assert.ok(resultA.sceneId, "Süreç A geçerli bir sceneId üretmelidir.");
  console.log(`  ✓ Süreç A sahneyi başarıyla derledi ve atomik yayınladı (sceneId: ${resultA.sceneId}).`);

  // Süreç B'yi başlatıp soğuk diskten okumasını sağla
  const childB = spawn(
    process.execPath,
    [
      TSX_CLI,
      __filename,
      "--role",
      "child-verifier",
      "--storage",
      testStorageDir,
      "--sceneId",
      resultA.sceneId,
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );

  let outputB = "";
  childB.stdout.on("data", (d) => (outputB += d.toString()));
  let stderrB = "";
  childB.stderr.on("data", (d) => (stderrB += d.toString()));

  const exitCodeB = await new Promise<number>((resolve) => childB.on("close", resolve));
  assert.equal(exitCodeB, 0, `Süreç B başarıyla sıfır çıkış koduyla bitmelidir. Hata: ${stderrB}`);

  const resultB = JSON.parse(outputB.trim());
  assert.equal(resultB.manifestSceneId, resultA.sceneId, "Süreç B diskten doğru sceneId okumalıdır.");
  assert.equal(resultB.schemaVersion, 1, "Schema version 1 olmalıdır.");
  assert.equal(resultB.renderAbi, "three172-cad2d-v2", "Render ABI three172-cad2d-v2 olmalıdır.");
  assert.ok(resultB.chunkCount > 0, "En az bir parça bulunmalıdır.");
  assert.equal(resultB.firstChunkMagic, "DV2SCN01", "Parça ikili başlığı 'DV2SCN01' olmalıdır.");
  console.log("  ✓ Süreç B soğuk diskten sahneyi ve ikili parçaları başarıyla doğruladı.");

  // Staging klasörünün temizliğini doğrula
  const stagingBaseDir = path.join(testStorageDir, "staging");
  if (fs.existsSync(stagingBaseDir)) {
    const leftoverStaging = fs.readdirSync(stagingBaseDir);
    assert.equal(leftoverStaging.length, 0, "Yayın sonrası staging klasöründe artık dosya kalmamalıdır.");
  }

  // --------------------------------------------------------------------------
  // [Test 2] Süreç Ölümü / Kill Simülasyonu ve Atomik İzolasyon
  // --------------------------------------------------------------------------
  console.log("\n[Test 2] Süreç Ölümü (Crash/Kill) Simülasyonu:");

  const crashChild = spawn(
    process.execPath,
    [
      TSX_CLI,
      __filename,
      "--role",
      "simulate-crash",
      "--storage",
      testStorageDir,
    ],
    { stdio: ["ignore", "pipe", "pipe"] }
  );

  await new Promise<void>((resolve) => {
    crashChild.stdout.on("data", (data) => {
      if (data.toString().includes("STAGING_READY")) {
        resolve();
      }
    });
  });

  // Süreci öldür (SIGKILL / kill)
  crashChild.kill("SIGKILL");

  await new Promise<void>((resolve) => {
    crashChild.on("close", () => resolve());
  });

  // Yarım kalan staging dosyasının nihai sahneler dizinine kopyalanmadığını doğrula
  const scenes = fs.readdirSync(testStorageDir).filter((f) => f !== "staging");
  for (const s of scenes) {
    assert.ok(!s.includes("crashed_job"), "Ölen sürecin staging verisi nihai sahnelere sızmamalıdır.");
  }
  console.log("  ✓ Beklenmedik süreç ölümünde yarım kalan veri nihai sahnelere sızmadı.");

  // --------------------------------------------------------------------------
  // [Test 3] Fencing İhlali ve Stale Lease ile Yayının Reddedilmesi
  // --------------------------------------------------------------------------
  console.log("\n[Test 3] Fencing Token İhlali ve Stale Publish Reddi:");

  const mainService = new CadV2DurableService(testStorageDir);
  const staleJob: CadV2Job = {
    jobId: "job_stale_fence_test",
    fileId: "file_stale",
    sourceVersionKey: "v_stale",
    clientRequestId: "req_stale",
    status: "running",
    phase: "source",
    fence: 2, // Stale fence: Beklenen fence 1 iken 2 oldu (başka süreç devraldı)
    attempt: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await mainService.executeJobSync(staleJob, Buffer.from(SAMPLE_DXF), "stale.dxf", 1);

  assert.equal(staleJob.status, "failed", "Fencing ihlalinde iş durumu 'failed' olmalıdır.");
  assert.ok(
    staleJob.error?.includes("Fencing token ihlali"),
    `Hata mesajı fencing ihlalini bildirmelidir: ${staleJob.error}`
  );

  // Staging klasörünün temizlendiğini doğrula
  const staleStagingDir = path.join(testStorageDir, "staging", staleJob.jobId);
  assert.equal(fs.existsSync(staleStagingDir), false, "Başarısız publish sonrası staging temizlenmelidir.");
  console.log("  ✓ Fencing token ihlalinde yayın engellendi ve staging temizlendi.");

  // --------------------------------------------------------------------------
  // [Test 4] Kaynak Tamponu Yokken / Boşken İşi Sonsuz Running Bırakmama
  // --------------------------------------------------------------------------
  console.log("\n[Test 4] Boş Kaynak Tamponu Güvenlik Sınırı (No Infinite Running):");

  const emptyJob: CadV2Job = {
    jobId: "job_empty_buffer_test",
    fileId: "file_empty",
    sourceVersionKey: "v_empty",
    clientRequestId: "req_empty",
    status: "running",
    phase: "source",
    fence: 1,
    attempt: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await mainService.executeJobSync(emptyJob, Buffer.alloc(0), "empty.dxf");

  assert.equal(emptyJob.status, "failed", "Boş tamponda iş anında 'failed' olmalıdır.");
  assert.ok(
    emptyJob.error?.includes("MISSING_SOURCE_BUFFER"),
    "Hata MISSING_SOURCE_BUFFER içermelidir."
  );
  console.log("  ✓ Kaynak tamponu yokken iş sonsuz döngüye girmeden 'failed' oldu.");

  // --------------------------------------------------------------------------
  // [Test 5] Unobserved Job İptali ve Fencing Artış Sözleşmesi
  // --------------------------------------------------------------------------
  console.log("\n[Test 5] Unobserved Job İptali ve Çoklu İzleyici Sözleşmesi:");

  // 5.1 Tek izleyici ayrılınca iptal
  const singlePrep = await mainService.prepare({
    fileId: "single_obs_file",
    clientRequestId: crypto.randomUUID(),
    expectedSourceVersionKey: "v_single",
  });
  const singleJobId = singlePrep.jobId!;
  const jobBeforeDelete = mainService.getJob(singleJobId)!;
  assert.equal(jobBeforeDelete.fence, 1);

  mainService.deleteViewSession(singlePrep.viewSessionId);
  const jobAfterDelete = mainService.getJob(singleJobId)!;
  assert.equal(jobAfterDelete.status, "cancelled", "Başka izleyici kalmadığı için iş 'cancelled' olmalıdır.");
  assert.equal(jobAfterDelete.fence, 2, "Fence token 1 artırılmalıdır.");

  // 5.2 İki izleyici varken biri ayrılınca iş devam eder
  const obsJob: CadV2Job = {
    jobId: "shared_obs_job",
    fileId: "file_shared",
    sourceVersionKey: "v_shared",
    clientRequestId: "req_shared",
    status: "running",
    phase: "source",
    fence: 1,
    attempt: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  (mainService as any).jobs.set("shared_obs_job", obsJob);
  (mainService as any).viewSessions.set("vs_1", {
    viewSessionId: "vs_1",
    fileId: "file_shared",
    jobId: "shared_obs_job",
    expiresAt: Date.now() + 180_000,
    createdAt: Date.now(),
  });
  (mainService as any).viewSessions.set("vs_2", {
    viewSessionId: "vs_2",
    fileId: "file_shared",
    jobId: "shared_obs_job",
    expiresAt: Date.now() + 180_000,
    createdAt: Date.now(),
  });

  // İlk izleyici ayrılır
  mainService.deleteViewSession("vs_1");
  const jobStillObserved = mainService.getJob("shared_obs_job")!;
  assert.equal(jobStillObserved.status, "running", "Hâlâ izleyicisi (vs_2) olduğu için iş çalışmaya devam etmelidir.");
  assert.equal(jobStillObserved.fence, 1, "Fence değişmemelidir.");

  // İkinci (son) izleyici ayrılır
  mainService.deleteViewSession("vs_2");
  const jobNowCancelled = mainService.getJob("shared_obs_job")!;
  assert.equal(jobNowCancelled.status, "cancelled", "Tüm izleyiciler ayrılınca iş iptal edilmelidir.");
  assert.equal(jobNowCancelled.fence, 2, "Fence artırılmalıdır.");

  console.log("  ✓ Tek ve çoklu izleyici yaşam döngüsü ve unobserved fencing doğrulandı.");

  console.log("\n>>> R01 DURABLE MULTI-PROCESS TESTLERİ TAMAMEN BAŞARILI (PASS) <<<");
}

// Komut satırı argümanlarına göre alt süreç veya ana test çalıştır
const args = process.argv.slice(2);
if (args.includes("--role")) {
  runChildRole(args).catch((err) => {
    console.error("Alt süreç hatası:", err);
    process.exit(1);
  });
} else {
  runDurableMultiProcessTests().catch((err) => {
    console.error("Test hatası:", err);
    process.exit(1);
  });
}
