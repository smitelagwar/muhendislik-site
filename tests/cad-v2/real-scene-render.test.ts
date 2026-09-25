// ============================================================================
// DWG/DXF MOTOR V2 — G05 REAL SCENE V2 FRAME & WORKER PIPELINE TESTS
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G05), 25, 29, 31
// R001 DWG -> Canonical -> DV2SCN01 -> Worker Unpack -> Scene Renderer -> 20x Open/Close Lifecycle

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import {
  unpackSceneChunk,
  type UnpackedSceneChunk,
} from "../../src/workers/cad-v2/cad-v2-scene-worker";
import { CadV2WorkerClient } from "../../src/lib/cad-v2/worker/worker-client";
import {
  parseSceneChunk,
  SCENE_MAGIC,
  SCENE_SCHEMA_VERSION,
} from "../../src/lib/cad-v2/protocol/binary-protocol";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

async function runRealSceneRenderTests() {
  console.log("=== DWG/DXF Motor V2 - G05 Gerçek Sahne & Render Hattı Testi ===");

  const r001Path = path.resolve(process.cwd(), "eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg");
  assert(fs.existsSync(r001Path), `R001 test dosyası mevcut: ${r001Path}`);

  const rawBytes = fs.readFileSync(r001Path);
  const fileHash = crypto.createHash("sha256").update(rawBytes).digest("hex");
  console.log(`- R001 boyutu: ${rawBytes.byteLength.toLocaleString()} bayt, hash: ${fileHash.slice(0, 16)}...`);

  // 1. Dekoder Adımı: DWG -> Canonical
  console.log("\n[Test 1] DWG Dekoder -> Canonical Çevrimi:");
  const canonicalDoc = await parseDwgToCanonical(rawBytes, {
    sourceSha256: fileHash,
    sourceVersionKey: "1 ve 2.kat dwg.dwg",
  });

  assert(canonicalDoc.modelSpaceEntities.length > 0, `Model alanı varlıkları çıkarıldı: ${canonicalDoc.modelSpaceEntities.length} adet`);
  assert(canonicalDoc.sourceSha256 === fileHash, "Canonical doküman kaynak SHA-256 hash'ini doğru taşıyor");

  // 2. Derleyici Adımı: Canonical -> DV2SCN01 İkili Sahne ve Manifest
  console.log("\n[Test 2] Canonical -> DV2SCN01 Sahne Derlemesi:");
  const compiled = compileCanonicalToScene(canonicalDoc);

  assert(compiled.manifest.schemaVersion === SCENE_SCHEMA_VERSION, `Manifest şema sürümü: ${compiled.manifest.schemaVersion}`);
  assert(compiled.manifest.renderAbi === "three172-cad2d-v2", `Render ABI eşleşti: ${compiled.manifest.renderAbi}`);
  assert(compiled.manifest.layouts.length > 0, "En az bir pafta/model alanı tanımlandı");
  assert(compiled.chunks.size > 0, `İkili parça sayısı: ${compiled.chunks.size}`);

  const firstChunkEntry = compiled.chunks.entries().next().value;
  assert(!!firstChunkEntry, "En az bir ikili parça mevcut");
  const [chunkId, chunkBytes] = firstChunkEntry!;
  const chunkActualHash = crypto.createHash("sha256").update(chunkBytes).digest("hex");
  const manifestChunkEntry = compiled.manifest.chunks.find((c) => c.chunkId === chunkId);

  assert(!!manifestChunkEntry, `Manifest parçayı listeliyor: ${chunkId}`);
  assert(manifestChunkEntry!.sha256 === chunkActualHash, `Parça SHA-256 hash'i manifest ile tam eşleşti: ${chunkActualHash.slice(0, 16)}...`);
  assert(chunkBytes.byteLength === manifestChunkEntry!.byteLength, `Parça bayt boyutu manifest ile eşleşti: ${chunkBytes.byteLength} bayt`);

  // 3. Worker Ayrıştırıcı Adımı: DV2SCN01 -> UnpackedSceneChunk
  console.log("\n[Test 3] Web Worker Parça Ayrıştırma & Doğrulama:");
  const unpacked = unpackSceneChunk(chunkId, chunkBytes);

  assert(unpacked.chunkId === chunkId, `Unpacked chunk ID eşleşti: ${unpacked.chunkId}`);
  assert(unpacked.origin.length === 2, `Float64 Orijin çıkarıldı: [${unpacked.origin[0].toFixed(2)}, ${unpacked.origin[1].toFixed(2)}]`);
  assert(unpacked.vertexCount > 0, `Geçerli vertex sayısı: ${unpacked.vertexCount}`);
  assert(unpacked.xyArray.length === unpacked.vertexCount * 2, `Float32 XY dizisi vertex sayısının 2 katı uzunlukta (${unpacked.xyArray.length})`);
  assert(unpacked.drawRunsArray !== null && unpacked.drawRunsArray.length > 0, "Draw runs (çizim komutları) başarıyla ayrıştırıldı");

  // 4. Negatif Testler: Bozuk İkili Veri ve Sınır Reddi
  console.log("\n[Test 4] Negatif Güvenlik ve Savunma Kontrolleri:");

  // A) Bozuk Magic Header
  const corruptedMagicBytes = new Uint8Array(chunkBytes);
  corruptedMagicBytes[0] = 0x58; // 'X'
  corruptedMagicBytes[1] = 0x58; // 'X'
  let magicRejected = false;
  try {
    unpackSceneChunk("corrupted_magic", corruptedMagicBytes);
  } catch (err: any) {
    magicRejected = true;
    console.log(`- Bozuk magic başarıyla reddedildi: ${err.message}`);
  }
  assert(magicRejected, "Bozuk magic header istisna fırlatarak reddedildi");

  // B) Kırpılmış (Truncated) Header
  const truncatedBytes = chunkBytes.slice(0, 16);
  let truncatedRejected = false;
  try {
    unpackSceneChunk("truncated", truncatedBytes);
  } catch (err: any) {
    truncatedRejected = true;
    console.log(`- Kırpılmış parça başarıyla reddedildi: ${err.message}`);
  }
  assert(truncatedRejected, "Kırpılmış parça istisna fırlatarak reddedildi");

  // C) Desteklenmeyen Şema Sürümü
  const badSchemaBytes = new Uint8Array(chunkBytes);
  badSchemaBytes[8] = 0xff; // Sürüm 255
  badSchemaBytes[9] = 0x00;
  let schemaRejected = false;
  try {
    unpackSceneChunk("bad_schema", badSchemaBytes);
  } catch (err: any) {
    schemaRejected = true;
    console.log(`- Bilinmeyen şema sürümü başarıyla reddedildi: ${err.message}`);
  }
  assert(schemaRejected, "Bilinmeyen şema sürümü reddedildi");

  // 5. WorkerClient Yaşam Döngüsü ve İptal (R24, R27)
  console.log("\n[Test 5] WorkerClient İptal ve Nesil (Generation) Güvenliği:");
  const client = new CadV2WorkerClient("sess_test_01", "rev_01");

  // A->B->C nesil ilerlemesi
  const initialGen = client.getGeneration();
  assert(initialGen === 1, `Başlangıç nesli: ${initialGen}`);

  const nextGen = client.advanceGeneration();
  assert(nextGen === 2, `İlerlemiş nesil: ${nextGen}`);

  // Doğrudan parça yükleme testi
  const loadedChunk = await client.loadChunk(chunkId, chunkBytes.buffer.slice(0) as ArrayBuffer);
  assert(loadedChunk.vertexCount === unpacked.vertexCount, "WorkerClient üzerinden yüklenen vertex sayısı eşleşti");

  client.dispose();
  let loadAfterDisposeFailed = false;
  try {
    await client.loadChunk(chunkId, chunkBytes.buffer.slice(0) as ArrayBuffer);
  } catch {
    loadAfterDisposeFailed = true;
  }
  assert(loadAfterDisposeFailed, "Disposed WorkerClient yeni istekleri reddetti");

  // 6. R24: 20 Aç/Kapat (Open/Dispose) Bellek Platosu Testi
  console.log("\n[Test 6] R24: 20 Ardışık Aç/Kapat Yaşam Döngüsü Temizlik Kanıtı:");
  const initialMemory = process.memoryUsage().heapUsed;

  for (let i = 1; i <= 20; i++) {
    const cycleClient = new CadV2WorkerClient(`sess_cycle_${i}`, "rev_cycle");
    const cycleChunk = await cycleClient.loadChunk(chunkId, chunkBytes.buffer.slice(0) as ArrayBuffer);
    assert(cycleChunk.vertexCount > 0, `Döngü ${i}: ${cycleChunk.vertexCount} vertex başarıyla yüklendi`);
    cycleClient.dispose();
  }

  // Zorunlu çöp toplama (mümkünse) veya bellek deltası inceleme
  if (global.gc) {
    global.gc();
  }
  const finalMemory = process.memoryUsage().heapUsed;
  const memDeltaMb = (finalMemory - initialMemory) / (1024 * 1024);
  console.log(`- 20 aç/kapat döngüsü sonrası Heap farkı: ${memDeltaMb.toFixed(2)} MB`);
  assert(memDeltaMb < 50, `Bellek sızıntısı yok (< 50MB plato): ${memDeltaMb.toFixed(2)} MB`);

  // 7. R002 DWG Gerçek Sahne ve Derleme Doğrulaması
  console.log("\n[Test 7] R002 DWG Sahne Derleme ve Çoklu Pafta Doğrulaması:");
  const r002Path = path.resolve(process.cwd(), "eklediklerim/ornek_dosyalar/kiris_acilimlari_tum_katlar.dwg");
  if (fs.existsSync(r002Path)) {
    const r002Bytes = fs.readFileSync(r002Path);
    const r002Hash = crypto.createHash("sha256").update(r002Bytes).digest("hex");
    const r002Canonical = await parseDwgToCanonical(r002Bytes, { sourceVersionKey: "r002", sourceSha256: r002Hash });
    const r002Compiled = compileCanonicalToScene(r002Canonical);
    assert(r002Compiled.chunks.size > 0, "R002 sahne parçaları üretildi");
    assert(r002Compiled.manifest.layouts.length > 0, "R002 manifest pafta bilgisi mevcut");
    console.log(`- R002 Parça sayısı: ${r002Compiled.chunks.size}, Paftalar: ${r002Compiled.manifest.layouts.map(l => l.sourceName).join(", ")}`);
  }

  console.log("\n>>> G05 GERÇEK SAHNE & RENDER HATTI TESTLERİ BAŞARIYLA GEÇTİ (PASS) <<<\n");
}

runRealSceneRenderTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test hatası:", err);
    process.exit(1);
  });
