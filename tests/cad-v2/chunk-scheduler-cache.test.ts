// ============================================================================
// DWG/DXF MOTOR V2 — G10 CHUNK SCHEDULER & RAM CACHE TEST SUITE
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G10)
// Gereksinimler: R17, R20, R21, R28 | Alt kabul: V15, C03, C04, C11

import {
  LruChunkCache,
  SpatialChunkScheduler,
  type ChunkMetadata,
} from "../../src/lib/cad-v2/cache/chunk-spatial-scheduler";
import type { CadCanonicalDocument, CadLineEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { validateSceneManifest } from "../../src/lib/cad-v2/protocol/binary-protocol";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

async function runChunkSchedulerCacheTests() {
  console.log("=== DWG/DXF Motor V2 - G10 Chunk, Scheduler ve RAM Cache Testi ===");

  // 1. Sınırlı RAM LRU Önbellek ve Tahliye (Eviction) Testi (R28, V15)
  console.log("\n[Test 1] 64 MiB Bütçeli LRU Önbellek ve Otomatik Tahliye:");
  const testCapacity = 3 * 1024 * 1024; // 3 MiB test kapasitesi
  const evictedIds: string[] = [];

  const cache = new LruChunkCache<Uint8Array>(testCapacity, (id) => {
    evictedIds.push(id);
  });

  const dummy1MB = new Uint8Array(1024 * 1024);
  cache.put("chunk_01", dummy1MB, 1024 * 1024, false); // görünmüyor
  cache.put("chunk_02", dummy1MB, 1024 * 1024, false); // görünmüyor
  cache.put("chunk_03", dummy1MB, 1024 * 1024, true);  // görünür

  assert(cache.getEntryCount() === 3, `3 parça başarıyla eklendi (toplam 3 MB)`);
  assert(cache.getCurrentBytes() === 3 * 1024 * 1024, "Kullanılan bellek 3 MB");

  // 4. Parça ekleniyor (1 MB). Bütçe aşılacağı için en eski görünmeyen parça (chunk_01) tahliye edilmeli!
  cache.put("chunk_04", dummy1MB, 1024 * 1024, true);

  assert(cache.getEntryCount() === 3, "Bütçe korundu, parça sayısı 3'te kaldı");
  assert(evictedIds.includes("chunk_01"), "En eski görünmeyen 'chunk_01' başarıyla tahliye edildi");
  assert(cache.has("chunk_04"), "Yeni gelen 'chunk_04' önbelleğe alındı");
  assert(cache.has("chunk_03"), "Görünür olan 'chunk_03' tahliye edilmedi");

  // 2. Kayıpsız Geri Yükleme (Lossless Eviction Recovery) (R20, V15)
  console.log("\n[Test 2] Kayıpsız Geri Yükleme (Kamera Geri Geldiğinde Tekrar Yükleme):");
  assert(cache.get("chunk_01") === null, "Tahliye edilmiş chunk_01 önbellekte yok");
  // Kamera o alana geri döndü: chunk_01 tekrar yüklenebilmeli
  cache.put("chunk_01", dummy1MB, 1024 * 1024, true);
  assert(cache.has("chunk_01"), "chunk_01 kayıpsız geri yüklendi ve önbelleğe alındı");

  // 3. Mekânsal Kesişim ve Görünürlük Önceliği (R21)
  console.log("\n[Test 3] Mekânsal Görünürlük (Spatial Viewport) Önceliklendirmesi:");
  const scheduler = new SpatialChunkScheduler(testCapacity);

  const testChunks: ChunkMetadata[] = [
    { chunkId: "c_center", layoutId: "Model", bbox: [-100, -100, 100, 100], byteLength: 500000, sha256: "hash1" },
    { chunkId: "c_north",  layoutId: "Model", bbox: [-100, 200, 100, 400],   byteLength: 500000, sha256: "hash2" },
    { chunkId: "c_far",    layoutId: "Model", bbox: [5000, 5000, 6000, 6000],byteLength: 500000, sha256: "hash3" },
  ];
  scheduler.registerChunks(testChunks);

  // Kamera [-150, -150, 150, 150] merkez alanında
  const res1 = scheduler.updateViewport([-150, -150, 150, 150]);
  assert(res1.visibleChunkIds.includes("c_center"), "Merkez parça görünür olarak tespit edildi");
  assert(!res1.visibleChunkIds.includes("c_north"), "Kuzey parça kamera dışında");
  assert(!res1.visibleChunkIds.includes("c_far"), "Uzak parça kamera dışında");
  assert(res1.enqueuedCount >= 1, "Görünür parça kuyruğa alındı");

  console.log("\n[Test 3b] Derlenmiş chunk bbox'larının manifest ve scheduler hattı:");
  const spatialDocument: CadCanonicalDocument = {
    sourceVersionKey: "spatial-chunk-bounds-v1",
    sourceSha256: "spatial-chunk-bounds-v1",
    acadVersion: "AC1032",
    codepage: "UTF-8",
    units: 4,
    measurement: 1,
    layers: {
      "0": { id: "0", name: "0", visible: true, frozen: false, locked: false,
        color: { method: "aci", aci: 7 }, lineweightMm: 0.25, linetypeName: "CONTINUOUS" },
    },
    linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {}, diagnostics: [],
    modelSpaceEntities: [
      { type: "LINE", handle: "SPATIAL_NEAR", layer: "0", order: BigInt(1), start: [0, 0], end: [10, 5] } as CadLineEntity,
      { type: "LINE", handle: "SPATIAL_FAR", layer: "0", order: BigInt(2), start: [10_000, 20_000], end: [10_030, 20_040] } as CadLineEntity,
    ],
  };
  const spatialScene = compileCanonicalToScene(spatialDocument, {
    sceneId: "scene_spatial_chunk_bounds", maxPrimitivesPerChunk: 1,
  });
  assert(spatialScene.manifest.chunks.length === 2, "İki uzaktaki çizgi ayrı spatial chunk'lara derlendi");
  assert(JSON.stringify(spatialScene.manifest.chunks[0]!.bbox) === JSON.stringify([-0.125, -0.125, 10.125, 5.125]),
    "Yakın chunk bbox'ı lineweight stroke extents dahil gerçek geometri sınırını taşıyor");
  assert(JSON.stringify(spatialScene.manifest.chunks[1]!.bbox) === JSON.stringify([9_999.875, 19_999.875, 10_030.125, 20_040.125]),
    "Uzak chunk bbox'ı lineweight stroke extents dahil gerçek geometri sınırını taşıyor");
  const indexPage = spatialScene.manifest.indexPages[0]!;
  const indexContent = JSON.parse(spatialScene.indexFiles!.get(indexPage.indexId)!);
  assert(indexContent.chunks.every((chunk: { bbox?: number[] }) => Array.isArray(chunk.bbox) && chunk.bbox.length === 4),
    "Chunk bbox'ları hash'li index sayfasına da yazılıyor");
  const validatedSpatialManifest = validateSceneManifest(spatialScene.manifest);
  const indexedChunks: ChunkMetadata[] = validatedSpatialManifest.chunks.map((chunk) => {
    assert(Array.isArray(chunk.bbox), `Validator '${chunk.chunkId}' bbox'ını koruyor`);
    return { ...chunk, bbox: chunk.bbox! };
  });
  const compiledScheduler = new SpatialChunkScheduler(testCapacity);
  compiledScheduler.registerChunks(indexedChunks);
  const compiledVisible = compiledScheduler.updateViewport([-5, -5, 15, 10]);
  assert(compiledVisible.visibleChunkIds.length === 1 && compiledVisible.visibleChunkIds[0] === spatialScene.manifest.chunks[0]!.chunkId,
    "Derlenmiş manifest bbox'ı görünür chunk'ı doğru seçiyor ve uzaktakini eliyor");

  // 4. En Fazla 4 Eşzamanlı İstek (Throttle & Queue) (R28, C03)
  console.log("\n[Test 4] Eşzamanlı İstek Limiti (En Fazla 4 Fetch):");
  const batch = scheduler.getNextFetchBatch(4);
  assert(batch.length <= 4, `Batch boyutu sınır dahilinde: ${batch.length} <= 4`);
  assert(batch.includes("c_center"), "En yüksek öncelikli görünür parça ilk çekildi");

  // 5. Nesil (Generation) Kontrolü (A -> B -> C Geç Yanıt Koruması) (R20, R24)
  console.log("\n[Test 5] Nesil (Generation) Güvenliği (Stale Request Dropping):");
  scheduler.setGeneration(1);
  const gen1Batch = scheduler.getNextFetchBatch(4);

  // Kullanıcı aniden başka bir çizime veya paftaya geçti: Nesil 2 oldu!
  scheduler.setGeneration(2);
  assert(scheduler.getGeneration() === 2, "Nesil başarıyla 2'ye ilerletildi");

  // Nesil 1'e ait geç gelen bir ağ yanıtı tamamlanmaya çalışılırsa reddedilmeli
  const accepted = scheduler.completeFetch("c_stale", dummy1MB, dummy1MB.length, 1);
  assert(!accepted, "Eski nesil (gen: 1) geç yanıtı güvenle reddedildi ve çöpe atıldı");

  const acceptedGen2 = scheduler.completeFetch("c_valid", dummy1MB, dummy1MB.length, 2);
  assert(acceptedGen2, "Güncel nesil (gen: 2) yanıtı başarıyla kabul edildi");

  console.log("\n=== G10 CHUNK, SCHEDULER VE RAM CACHE TESTLERİ BAŞARIYLA GEÇTİ (5/5 PASS) ===");
}

runChunkSchedulerCacheTests().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
