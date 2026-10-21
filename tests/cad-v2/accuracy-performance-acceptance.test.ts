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
import { hydrateSceneManifestIndexes } from "../../src/lib/cad-v2/protocol/manifest-index-pages";

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

interface ColdWarmClassSmokeResult {
  usageClass: "<=30MB" | ">30-70MB";
  representativeFileId: string;
  coldSamplesMs: number[];
  pairedWarmSamplesMs: number[][];
}

async function runAccuracyPerformanceAcceptanceTests() {
  console.log("=== DWG/DXF Motor V2 - G15 Doğruluk, Performans ve İşletim Kabulü Testi ===\n");

  const manifestPath = path.join(process.cwd(), "tests/cad-v2/fixtures-manifest.json");
  assert(fs.existsSync(manifestPath), "Fixtures manifest dosyası mevcut");
  const manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const realCorpus: FixtureItem[] = manifestData.realCorpus;

  // Acceptance tests must never index or write the user's .data scene store.
  // Use a per-process isolated directory and inspect only artifacts from this run.
  const runId = `g15-${process.pid}-${Date.now()}`;
  const outputRoot = path.resolve(process.env.CAD_V2_TEST_OUTPUT_ROOT || "test-output/cad-v2-tmp");
  const runDir = path.join(outputRoot, runId);
  const isolatedStorageDir = path.join(runDir, "scenes");
  process.env.CAD_V2_STORAGE_DIR = isolatedStorageDir;
  const service = CadV2DurableService.getInstance();
  const benchmarkResults: BenchmarkResult[] = [];
  const coldWarmClassSmokeResults: ColdWarmClassSmokeResult[] = [];
  let verifiedChunksCount = 0;

  function verifyArtifactFile(
    sceneId: string,
    generation: string,
    fileName: string,
    byteLength: number,
    sha256: string,
    label: string,
    maximumByteLength?: number,
  ) {
    const artifactPath = path.join(isolatedStorageDir, sceneId, "objects", generation, fileName);
    assert(fs.existsSync(artifactPath), `${label} artifact dosyası mevcut`);
    const bytes = fs.readFileSync(artifactPath);
    assert(bytes.byteLength === byteLength, `${label} byteLength manifest ile eşleşti`);
    assert(crypto.createHash("sha256").update(bytes).digest("hex") === sha256, `${label} SHA-256 manifest ile eşleşti`);
    if (maximumByteLength !== undefined) {
      assert(bytes.byteLength <= maximumByteLength, `${label} byteLength <= ${maximumByteLength} sınırına uyuyor`);
    }
  }

  async function loadAndHydrateManifest(sceneId: string) {
    const rawManifest = await service.getManifestAsync(sceneId);
    assert(Boolean(rawManifest), `READY sahnenin ${sceneId} manifesti okunabildi`);
    return hydrateSceneManifestIndexes(rawManifest as Record<string, any>, async (indexId) => {
      const indexPath = path.join(isolatedStorageDir, sceneId, "objects", rawManifest!.storageGeneration, `index_${indexId}.json`);
      assert(fs.existsSync(indexPath), `Immutable index sayfası mevcut: ${indexId}`);
      const bytes = fs.readFileSync(indexPath);
      return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    });
  }

  const allManifestChunks = (manifest: { indexPages?: Array<{ chunks?: Array<{ chunkId: string; byteLength: number; sha256: string }> }> }) =>
    (manifest.indexPages || []).flatMap((page) => page.chunks || []);

  // --------------------------------------------------------------------------
  // BÖLÜM 1: Gerçek Corpus Doğruluk ve Katman Doğrulaması (R001 - R004)
  // --------------------------------------------------------------------------
  console.log("--- BÖLÜM 1: Gerçek Corpus Doğruluk ve Katman Analizi ---");

  async function verifyCorpusItem(item: FixtureItem) {
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

  for (const item of realCorpus) {
    await verifyCorpusItem(item);
  }

  // --------------------------------------------------------------------------
  // BÖLÜM 2: Cold First Prepare vs Warm Server Scene Benchmark (30 Tekrar)
  // --------------------------------------------------------------------------
  console.log("\n--- BÖLÜM 2: Cold vs Warm Hazırlama Hız Benchmarkı (>=30 Tekrar) ---");

  for (const item of realCorpus) {
    // Release warm ölçümünü manifestte kayıtlı gerçek corpus'un her dosyasında yap.
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

    const coldJob = coldResult.jobId ? service.getJob(coldResult.jobId) : null;
    assert(coldResult.status === "ready" && !!coldResult.sceneId,
      `${item.id} Cold prepare hazır sahne döndü (response=${coldResult.status}, job=${coldJob?.status || "missing"}, phase=${coldJob?.phase || "missing"}, error=${coldJob?.error || "none"})`);
    const sceneId = coldResult.sceneId!;
    const session = service.getViewSession(coldResult.viewSessionId);
    assert(!!session, `${item.id} READY yanıtının view session kaydı mevcut`);
    assert(session!.fileId === `file_${item.id}` && !!session!.jobId,
      `${item.id} session file/job bağları eksiksiz`);
    assert(!session!.sceneId || session!.sceneId === sceneId,
      `${item.id} session varsa yalnız aynı READY scene'e bağlı`);
    const readyJob = service.getJob(session!.jobId!);
    assert(!!readyJob, `${item.id} READY session job kaydı mevcut`);
    assert(readyJob!.status === "ready" && readyJob!.sceneId === sceneId && readyJob!.sourceVersionKey === versionKey,
      `${item.id} job status/scene/revision READY yanıtıyla eşleşti`);

    const manifest = await loadAndHydrateManifest(sceneId);
    assert(!!manifest && manifest.sceneId === sceneId, `${item.id} READY sahnenin manifesti okunabildi`);
    assert(typeof manifest!.storageGeneration === "string" && manifest!.storageGeneration.length > 0,
      `${item.id} manifest immutable generation içeriyor`);
    const chunks = allManifestChunks(manifest!);
    assert(chunks.length > 0, `${item.id} doğrulanmış index sayfaları en az bir çizim chunk'ı içeriyor`);
    const chunkRouteProbe = chunks.find((chunk) => chunk.chunkId === "chunk_model_004") || chunks[0]!;
    const servedChunk = await service.getChunkAsync(sceneId, chunkRouteProbe.chunkId);
    assert(Boolean(servedChunk && servedChunk.byteLength === chunkRouteProbe.byteLength &&
      crypto.createHash("sha256").update(servedChunk).digest("hex") === chunkRouteProbe.sha256),
    `${item.id} READY manifestteki ${chunkRouteProbe.chunkId} chunk endpoint'inden aynı byte/hash ile okunur`);
    assert(await service.getChunkAsync(sceneId, "chunk_model_unauthorized_l11") === null,
      `${item.id} manifest allow-list dışında kalan chunk isteği 404 olarak reddedilir`);
    const rootManifestPath = path.join(isolatedStorageDir, sceneId, "manifest.json");
    assert(fs.existsSync(rootManifestPath), `${item.id} READY scene root manifest artifact'ı mevcut`);
    assert(fs.statSync(rootManifestPath).size <= 1024 * 1024, `${item.id} manifest boyutu <= 1 MiB`);
    assert(JSON.parse(fs.readFileSync(rootManifestPath, "utf8")).storageGeneration === manifest!.storageGeneration,
      `${item.id} root manifest published generation ile eşleşti`);
    for (const chunk of chunks) {
      verifyArtifactFile(sceneId, manifest!.storageGeneration, `${chunk.chunkId}.bin`, chunk.byteLength, chunk.sha256,
        `${item.id} chunk ${chunk.chunkId}`, 2 * 1024 * 1024);
      verifiedChunksCount++;
    }
    for (const page of manifest!.indexPages || []) {
      verifyArtifactFile(sceneId, manifest!.storageGeneration, `index_${page.indexId}.json`, page.byteLength, page.sha256,
        `${item.id} index ${page.indexId}`);
    }
    for (const page of manifest!.metadataPages || []) {
      verifyArtifactFile(sceneId, manifest!.storageGeneration, `meta_${page.metadataId}.json`, page.byteLength, page.sha256,
        `${item.id} metadata ${page.metadataId}`);
    }

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
  // BÖLÜM 2B: İki kaynak boyutu sınıfında 5 cold/warm keşif çifti
  // --------------------------------------------------------------------------
  console.log("\n--- BÖLÜM 2B: Boyut sınıfı başına 5 cold/warm keşif örneği ---");
  const smokeRepresentatives = (["<=30MB", ">30-70MB"] as const).map((usageClass) => {
    const item = realCorpus.find((candidate) =>
      (candidate.sizeBytes <= 30 * 1024 * 1024 ? "<=30MB" : ">30-70MB") === usageClass);
    assert(Boolean(item), `${usageClass} sınıfında gerçek corpus temsilcisi mevcut`);
    return { usageClass, item: item! };
  });

  for (const { usageClass, item } of smokeRepresentatives) {
    const sourceBuffer = fs.readFileSync(path.join(process.cwd(), item.relativePath));
    const coldSamplesMs: number[] = [];
    const pairedWarmSamplesMs: number[][] = [];
    for (let sample = 1; sample <= 5; sample++) {
      const fileId = `file_l11_smoke_${item.id}_${sample}_${runId}`;
      const sourceVersionKey = `v_l11_smoke_${item.id}_${sample}_${runId}`;
      const clientRequestId = `req-l11-cold-${item.id}-${sample}-${runId}`;
      const coldStarted = performance.now();
      const coldResult = await service.prepare({
        fileId,
        expectedSourceVersionKey: sourceVersionKey,
        clientRequestId,
        sourceBuffer,
        fileName: path.basename(item.relativePath),
      });
      const coldDuration = performance.now() - coldStarted;
      assert(coldResult.status === "ready" && !!coldResult.sceneId,
        `${usageClass} cold örnek ${sample}/5 READY sahne üretti`);
      const sceneId = coldResult.sceneId!;
      const manifest = await loadAndHydrateManifest(sceneId);
      const chunks = allManifestChunks(manifest);
      assert(chunks.length > 0, `${usageClass} cold örnek ${sample}/5 doğrulanmış index sayfaları boş değil`);
      const transportManifest = await service.getManifestAsync(sceneId);
      assert(Buffer.byteLength(JSON.stringify(transportManifest), "utf8") <= transportManifest!.limits.maxManifestBytes,
        `${usageClass} cold örnek ${sample}/5 transport manifest boyut sınırında`);
      for (const chunk of chunks) {
        verifyArtifactFile(sceneId, manifest!.storageGeneration, `${chunk.chunkId}.bin`,
          chunk.byteLength, chunk.sha256, `L11 ${usageClass} cold ${sample}/5 ${chunk.chunkId}`, 2 * 1024 * 1024);
        verifiedChunksCount++;
      }

      const warmSamples: number[] = [];
      const sessionIds = new Set([coldResult.viewSessionId]);
      for (let warm = 1; warm <= 5; warm++) {
        const warmStarted = performance.now();
        const warmResult = await service.prepare({
          fileId,
          expectedSourceVersionKey: sourceVersionKey,
          clientRequestId: `req-l11-warm-${item.id}-${sample}-${warm}-${runId}`,
        });
        const warmDuration = performance.now() - warmStarted;
        assert(warmResult.status === "ready" && warmResult.sceneId === sceneId,
          `${usageClass} warm örnek ${sample}/5 (${warm}/5) aynı sahneyi döndürdü`);
        warmSamples.push(warmDuration);
        sessionIds.add(warmResult.viewSessionId);
      }

      coldSamplesMs.push(coldDuration);
      pairedWarmSamplesMs.push(warmSamples);
      for (const sessionId of sessionIds) {
        if (service.getViewSession(sessionId)) {
          const deleted = service.deleteViewSession(sessionId);
          assert(deleted, `${usageClass} cold örnek ${sample}/5 oturumu temizlendi`);
        }
      }
    }
    coldWarmClassSmokeResults.push({ usageClass, representativeFileId: item.id, coldSamplesMs, pairedWarmSamplesMs });
    console.log(`  -> ${usageClass} / ${item.id}: 5 cold + 25 paired warm samples`);
  }

  // --------------------------------------------------------------------------
  // BÖLÜM 3: Payload Boyut Sınırları ve İkili Doğruluk (D13, R17)
  // --------------------------------------------------------------------------
  console.log("\n--- BÖLÜM 3: Parça ve Manifest Boyut Sözleşmesi (D13: Manifest <= 1MB, Chunk <= 2MB) ---");

  assert(verifiedChunksCount > 0, `Gerçek corpus sahnelerinde ${verifiedChunksCount} chunk doğrulandı`);
  console.log(`  -> Manifest ile eşlenen immutable generation dizinlerinde doğrulanan chunk sayısı: ${verifiedChunksCount} adet`);

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
  assert(corruptJobResult.status === "preparing" && !corruptJobResult.sceneId,
    "Bozuk dosya hiçbir zaman READY/scene yanıtı üretmedi");
  assert(!!corruptJobResult.jobId, "Bozuk dosya için takip edilebilir job ID döndü");
  const corruptJob = service.getJob(corruptJobResult.jobId!);
  assert(!!corruptJob, "Bozuk dosya job kaydı zorunlu olarak mevcut");
  assert(corruptJob!.status === "failed", "Bozuk dosya işi 'failed' olarak işaretlendi");
  assert(!!corruptJob!.error, "Bozuk dosya için redakte hata mesajı kaydedildi");
  assert(!corruptJob!.sceneId && service.getManifest(corruptJob!.sceneId || "") === null,
    "Bozuk dosya job'ı READY scene/manifest referansı taşımıyor");

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
  fs.mkdirSync(runDir, { recursive: true });
  const reportPath = path.join(runDir, "benchmark-g15-results.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        benchmarkResults,
        coldWarmClassSmokeResults,
        verifiedChunksCount,
        corpusCovered: realCorpus.map((c) => ({ id: c.id, size: c.sizeBytes, sha256: c.sha256 })),
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`\n>>> G15 DOĞRULUK, PERFORMANS VE İŞLETİM KABULÜ TESTLERİ BAŞARIYLA GEÇTİ (PASS) <<<`);
  console.log(`G15 run evidence: ${reportPath}`);
}

runAccuracyPerformanceAcceptanceTests().catch((err) => {
  console.error("Beklenmeyen test hatası:", err);
  process.exit(1);
});
