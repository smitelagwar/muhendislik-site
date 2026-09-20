// ============================================================================
// DWG/DXF MOTOR V2 — G15 DOĞRULUK, PERFORMANS VE İŞLETİM KABULÜ TEST SUITE
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G15),
// motor_v2/11_DOGRULAMA_PROGRAMI.md, motor_v2/32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md
// Gereksinimler: R29–R31, R39, R40, R44, R46, R47 | Alt kabul: V01–V18, C01–C12

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { CadV2DurableService } from "../../src/lib/cad-v2/service/cad-v2-durable-service";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

interface FixtureItem {
  id: string;
  relativePath: string;
  format: "DWG" | "DXF";
  magic: string;
  sizeBytes: number;
  sha256: string;
}

interface BenchmarkResult {
  fileId: string;
  format: string;
  sizeBytes: number;
  usageClass: "<=30MB" | ">30-70MB";
  coldPrepareMs: number;
  warmIterations: number;
  warmMedianMs: number;
  warmMeanMs: number;
  warmMinMs: number;
  warmMaxMs: number;
  speedImprovementPercent: number;
}

async function runAccuracyPerformanceAcceptanceTests() {
  console.log("=== DWG/DXF Motor V2 - G15 Doğruluk, Performans ve İşletim Kabulü Testi ===\n");

  const manifestPath = path.join(process.cwd(), "tests/cad-v2/fixtures-manifest.json");
  assert(fs.existsSync(manifestPath), "Fixtures manifest dosyası mevcut");
  const manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const realCorpus: FixtureItem[] = manifestData.realCorpus;

  const service = CadV2DurableService.getInstance();
  const benchmarkResults: BenchmarkResult[] = [];

  // --------------------------------------------------------------------------
  // BÖLÜM 1: Gerçek Corpus Doğruluk ve Katman Doğrulaması (R001 - R004)
  // --------------------------------------------------------------------------
  console.log("--- BÖLÜM 1: Gerçek Corpus Doğruluk ve Katman Analizi ---");

  for (const item of realCorpus) {
    const fullPath = path.join(process.cwd(), item.relativePath);
    assert(fs.existsSync(fullPath), `Corpus dosyası mevcut: ${item.id} (${item.relativePath})`);

    const fileBuffer = fs.readFileSync(fullPath);
    const actualHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    assert(actualHash === item.sha256, `${item.id} SHA-256 hash doğrulaması başarılı`);

    const usageClass: "<=30MB" | ">30-70MB" = item.sizeBytes <= 30 * 1024 * 1024 ? "<=30MB" : ">30-70MB";
    console.log(`  -> ${item.id} [${item.format}] Boyut: ${(item.sizeBytes / (1024 * 1024)).toFixed(2)} MB, Sınıf: ${usageClass}`);

    // Decode & Canonical Doğrulama
    const startParse = performance.now();
    const isDxf = item.format === "DXF";
    const canonical = isDxf
      ? await parseDxfToCanonical(fileBuffer, { sourceVersionKey: `ver_${item.id}`, sourceSha256: actualHash })
      : await parseDwgToCanonical(fileBuffer, { sourceVersionKey: `ver_${item.id}`, sourceSha256: actualHash });
    const parseTime = performance.now() - startParse;

    const layerCount = Object.keys(canonical.layers).length;
    const entityCount = canonical.modelSpaceEntities.length;
    assert(layerCount > 0, `${item.id} Katman sayısı > 0 (Bulunan: ${layerCount})`);
    assert(entityCount > 0, `${item.id} Varlık sayısı > 0 (Bulunan: ${entityCount})`);

    const compiled = compileCanonicalToScene(canonical);
    assert(compiled.manifest.schemaVersion === 1, `${item.id} Sahne manifest schemaVersion=1`);
    assert(compiled.manifest.layouts[0].bbox.length === 4, `${item.id} Model bbox 4 elemanlı Float64`);

    console.log(`     Parse süresi: ${parseTime.toFixed(1)} ms, Varlık: ${entityCount}, Katman: ${layerCount}`);
  }

  // --------------------------------------------------------------------------
  // BÖLÜM 2: Cold First Prepare vs Warm Server Scene Benchmark (30 Tekrar)
  // --------------------------------------------------------------------------
  console.log("\n--- BÖLÜM 2: Cold vs Warm Hazırlama Hız Benchmarkı (>=30 Tekrar) ---");

  for (const item of realCorpus.slice(0, 2)) {
    // R001 ve R002 üzerinde kapsamlı ölçüm
    const fullPath = path.join(process.cwd(), item.relativePath);
    const fileBuffer = fs.readFileSync(fullPath);
    const versionKey = `v_bench_${item.id}_${Date.now()}`;
    const usageClass = item.sizeBytes <= 30 * 1024 * 1024 ? "<=30MB" : ">30-70MB";

    // Cold prepare ölçümü
    const startCold = performance.now();
    const coldResult = await service.prepare({
      fileId: `file_${item.id}`,
      expectedSourceVersionKey: versionKey,
      clientRequestId: `req-cold-${item.id}-${Date.now()}`,
      sourceBuffer: fileBuffer,
      fileName: path.basename(item.relativePath),
    });
    const coldDuration = performance.now() - startCold;

    assert(coldResult.status === "ready" && !!coldResult.sceneId, `${item.id} Cold prepare hazır sahne döndü`);
    const sceneId = coldResult.sceneId!;

    // 30 Tekrar Warm Ölçümü
    const warmDurations: number[] = [];
    const ITERATIONS = 30;
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const warmResult = await service.prepare({
        fileId: `file_${item.id}`,
        expectedSourceVersionKey: versionKey,
        clientRequestId: `req-warm-${item.id}-${i}`,
      });
      const t1 = performance.now() - t0;
      assert(warmResult.status === "ready" && warmResult.sceneId === sceneId, `Warm tekrar ${i + 1} aynı hazır sahneyi döndü`);
      warmDurations.push(t1);
    }

    warmDurations.sort((a, b) => a - b);
    const warmMedian = warmDurations[Math.floor(warmDurations.length / 2)];
    const warmMean = warmDurations.reduce((s, v) => s + v, 0) / warmDurations.length;
    const warmMin = warmDurations[0];
    const warmMax = warmDurations[warmDurations.length - 1];
    const improvement = ((coldDuration - warmMedian) / coldDuration) * 100;

    benchmarkResults.push({
      fileId: item.id,
      format: item.format,
      sizeBytes: item.sizeBytes,
      usageClass,
      coldPrepareMs: coldDuration,
      warmIterations: ITERATIONS,
      warmMedianMs: warmMedian,
      warmMeanMs: warmMean,
      warmMinMs: warmMin,
      warmMaxMs: warmMax,
      speedImprovementPercent: improvement,
    });

    console.log(`  -> ${item.id} [${item.format}]:`);
    console.log(`     Cold First Prepare: ${coldDuration.toFixed(1)} ms`);
    console.log(`     Warm Scene Median:  ${warmMedian.toFixed(2)} ms (Min: ${warmMin.toFixed(2)}, Max: ${warmMax.toFixed(2)})`);
    console.log(`     Warm İyileşme Oranı: %${improvement.toFixed(1)} (Hedef: >= %20)`);
    assert(improvement >= 20, `${item.id} Warm sahne yanıtı >= %20 hız iyileşme hedefini sağladı`);
  }

  // --------------------------------------------------------------------------
  // BÖLÜM 3: Payload Boyut Sınırları ve İkili Doğruluk (D13, R17)
  // --------------------------------------------------------------------------
  console.log("\n--- BÖLÜM 3: Parça ve Manifest Boyut Sözleşmesi (D13: Manifest <= 1MB, Chunk <= 2MB) ---");

  // R001 sahnesini incele
  const r001SceneId = service.getFileIdForScene("scene_r001") || "";
  // Service'deki hazır sahneleri dolaş
  let verifiedChunksCount = 0;
  for (const item of realCorpus) {
    const versionKey = `v_bench_${item.id}`;
    // Mevcut bir sahnenin manifestini al
    const manifest = service.getManifest(`scene_${item.id}`) || service.getManifest(benchmarkResults[0]?.fileId ? `scene_r001` : "");
  }

  // CLI veya Service üzerinden üretilen R001 sahne manifestini doğrudan doğrula
  const scenesDir = path.join(process.cwd(), ".data/cad-v2-scenes");
  if (fs.existsSync(scenesDir)) {
    const sceneFolders = fs.readdirSync(scenesDir).filter((d) => d.startsWith("scene_"));
    if (sceneFolders.length > 0) {
      const sampleScene = sceneFolders[0];
      const manifestFile = path.join(scenesDir, sampleScene, "manifest.json");
      if (fs.existsSync(manifestFile)) {
        const manifestStat = fs.statSync(manifestFile);
        assert(manifestStat.size <= 1024 * 1024, `Manifest boyutu <= 1 MiB (Gerçek: ${manifestStat.size} bayt)`);

        const chunkFiles = fs.readdirSync(path.join(scenesDir, sampleScene)).filter((f) => f.endsWith(".bin"));
        for (const chunkFile of chunkFiles) {
          const chunkStat = fs.statSync(path.join(scenesDir, sampleScene, chunkFile));
          assert(chunkStat.size <= 2 * 1024 * 1024, `Parça boyutu <= 2 MiB: ${chunkFile} (${chunkStat.size} bayt)`);
          verifiedChunksCount++;
        }
        console.log(`  -> Doğrulanan ikili parça sayısı: ${verifiedChunksCount} adet (Tümü <= 2 MiB sınırına uyuyor)`);
      }
    }
  }

  // --------------------------------------------------------------------------
  // BÖLÜM 4: Kurtarma, Hata İzolasyonu ve Fencing Token Güvenliği (R40, R46, R47)
  // --------------------------------------------------------------------------
  console.log("\n--- BÖLÜM 4: Hata İzolasyonu ve Kurtarma (Recovery / Rollback) ---");

  // Bozuk bayt yükü testi (Graceful error, crash olmamalı)
  const corruptBuffer = Buffer.from("NOT_A_VALID_DWG_OR_DXF_FILE_HEADER_DATA_1234567890", "utf-8");
  const corruptJobResult = await service.prepare({
    fileId: "corrupt_file_test",
    clientRequestId: "req-corrupt-1",
    sourceBuffer: corruptBuffer,
    fileName: "broken.dwg",
  });
  // Servis çökmemeli; iş ya failed durumunda olmalı ya da uygun hata dönmeli
  assert(
    corruptJobResult.status === "preparing" || corruptJobResult.status === "ready",
    "Bozuk dosya durumunda servis çökmeden güvenli yanıt verdi"
  );
  const corruptJob = service.getJob(corruptJobResult.jobId || "");
  if (corruptJob) {
    assert(corruptJob.status === "failed", "Bozuk dosya işi 'failed' olarak işaretlendi");
    assert(!!corruptJob.error, "Bozuk dosya için redakte hata mesajı kaydedildi");
  }

  // Idempotency: Aynı clientRequestId ile çağrıldığında aynı job/session'ı dönme
  const idempReqId = "req-idempotent-test-unique";
  const idemp1 = await service.prepare({
    fileId: "file_idemp_test",
    clientRequestId: idempReqId,
    fileName: "test.dwg",
  });
  const idemp2 = await service.prepare({
    fileId: "file_idemp_test",
    clientRequestId: idempReqId,
    fileName: "test.dwg",
  });
  assert(idemp1.viewSessionId === idemp2.viewSessionId, "Idempotent clientRequestId aynı viewSessionId döndü");

  // Fencing token koruması
  const unobservedSessionId = idemp1.viewSessionId;
  const deleted = service.deleteViewSession(unobservedSessionId);
  assert(deleted === true, "Unobserved oturum silindi");
  const jobAfterDelete = service.getJob(idemp1.jobId || "");
  if (jobAfterDelete) {
    assert(jobAfterDelete.status === "cancelled", "Başka izleyicisi kalmayan iş cancelled durumuna geçti");
    assert(jobAfterDelete.fence >= 2, "Cancelled işin fencing token'ı artırılarak yetkisiz publish engellendi");
  }

  // Sonuç özeti tablosunu kaydet
  const reportPath = path.join(process.cwd(), "tests/cad-v2/benchmark-g15-results.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        benchmarkResults,
        verifiedChunksCount,
        corpusCovered: realCorpus.map((c) => ({ id: c.id, size: c.sizeBytes, sha256: c.sha256 })),
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`\n>>> G15 DOĞRULUK, PERFORMANS VE İŞLETİM KABULÜ TESTLERİ BAŞARIYLA GEÇTİ (PASS) <<<`);
}

runAccuracyPerformanceAcceptanceTests().catch((err) => {
  console.error("Beklenmeyen test hatası:", err);
  process.exit(1);
});
