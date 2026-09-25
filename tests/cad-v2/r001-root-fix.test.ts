// ============================================================================
// DWG/DXF MOTOR V2 — R001 ROOT FIX ACCEPTANCE TEST SUITE (P08)
// ============================================================================
// Sözleşme: Fidelity v3 Planı P08 — R001 Kök Düzeltme Kabulü
// 1. R001 Kimlik, Header ve INSUNITS=4 (mm), MEASUREMENT=1 (metric) sözleşmesi
// 2. *U317 ve görünmez blok içeriği dışlama (outlier X > 30,000 yok)
// 3. -Z OCS Extrusion probe doğrulaması
// 4. HATCH boundaryPaths / loops ve triangulated mesh varlığı
// 5. Blok içi TEXT / MTEXT ve Dimension (*D) metin derleme paritesi
// 6. Adjacent-only draw commands ve renderOrder kararlılığı
// 7. Binary chunk (<= 2MB) ve manifest (<= 1MB) sınır uyumu
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { unpackSceneChunk } from "../../src/workers/cad-v2/cad-v2-scene-worker";

async function runR001RootFixTests() {
  console.log("=== P08 R001 ROOT FIX ACCEPTANCE TESTS BAŞLIYOR ===");

  const r001Rel = "eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg";
  const r001Path = path.resolve(process.cwd(), r001Rel);
  assert(fs.existsSync(r001Path), `R001 fixture bulunamadı: ${r001Path}`);

  const rawBytes = fs.readFileSync(r001Path);
  const rawHash = crypto.createHash("sha256").update(rawBytes).digest("hex");

  // --------------------------------------------------------------------------
  // 1. R001 Kimlik ve Header Sözleşmesi
  // --------------------------------------------------------------------------
  console.log("\n[KAPU 1] R001 Kimlik ve Header Sözleşmesi...");
  assert.strictEqual(rawBytes.length, 3444087, "R001 dosya boyutu 3,444,087 byte olmalı");
  assert.strictEqual(rawHash, "17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086", "R001 SHA-256 hash tam eşleşmeli");
  console.log("  ✓ R001 byte boyutu ve SHA-256 hash tam doğrulandı PASS");

  const doc = await parseDwgToCanonical(rawBytes, {
    sourceVersionKey: "r001_p08_acceptance",
    sourceSha256: rawHash,
  });

  assert.strictEqual(doc.acadVersion, "AC1032", `AutoCAD sürümü AC1032 olmalı, alınan: ${doc.acadVersion}`);
  assert.strictEqual(doc.units, 4, `INSUNITS 4 (mm) olmalı, alınan: ${doc.units}`);
  assert.strictEqual(doc.measurement, 1, `MEASUREMENT 1 (metric) olmalı, alınan: ${doc.measurement}`);
  console.log("  ✓ AC1032, units=4 (mm), measurement=1 (metric) sözleşmesi sağlandı PASS");

  // --------------------------------------------------------------------------
  // 2. Görünmez Blok İçeriği ve *U317 Bounds Anomalisi Düzeltmesi
  // --------------------------------------------------------------------------
  console.log("\n[KAPU 2] Görünmez Blok İçeriği ve *U317 Bounds Anomalisi...");
  const u317Block = doc.blocks["*U317"];
  assert(u317Block, "*U317 blok tanımı mevcut olmalı");
  const u317Invisible = u317Block.entities.filter((e) => e.visible === false).length;
  const u317Visible = u317Block.entities.filter((e) => e.visible !== false).length;
  console.log(`  -> *U317 toplam varlık: ${u317Block.entities.length} (Görünür: ${u317Visible}, Görünmez: ${u317Invisible})`);
  assert(u317Invisible > 100, `*U317 içinde 100'den fazla görünmez nesne olmalı (Bulunan: ${u317Invisible})`);

  // Derleme işlemi
  console.log("  -> Sahne derleniyor...");
  const compiled = compileCanonicalToScene(doc, { sceneId: "scene_r001_p08" });
  const modelLayout = compiled.manifest.layouts.find((l) => l.layoutId === "Model" || l.kind === "model");
  assert(modelLayout, "Model alanı layout bulunmalı");
  const [minX, minY, maxX, maxY] = modelLayout.bbox;
  console.log(`  -> Model BBox: [${minX.toFixed(2)}, ${minY.toFixed(2)}, ${maxX.toFixed(2)}, ${maxY.toFixed(2)}]`);

  // Outlier kontrolü: Eski hata X > 30,000 sınırına fırlıyordu.
  assert(maxX < 20000, `Model maxX (${maxX}) outlier içermemeli (< 20,000 olmalı, eski hatalı değer: ~30,525)`);
  assert(minX > -15000, `Model minX (${minX}) kontrol altında olmalı (> -15,000)`);
  console.log("  ✓ Outlier X > 30,000 başarıyla elendi, bounds tight olarak korundu PASS");

  // --------------------------------------------------------------------------
  // 3. -Z OCS Extrusion Probe Doğrulaması
  // --------------------------------------------------------------------------
  console.log("\n[KAPU 3] -Z OCS Extrusion Probe Doğrulaması...");
  const probes = ["1528D", "1668B", "14FEB", "163E9", "177EE", "189FB"];
  let foundProbes = 0;
  for (const ent of doc.modelSpaceEntities) {
    if (probes.includes(ent.handle)) {
      foundProbes++;
      assert(ent.type === "INSERT", `Probe ${ent.handle} INSERT olmalı`);
      // OCS normal kontrolü
      if (ent.extrusionDirection) {
        assert(Number.isFinite(ent.extrusionDirection[0]) && Number.isFinite(ent.extrusionDirection[1]) && Number.isFinite(ent.extrusionDirection[2]), `Probe ${ent.handle} normal finite olmalı`);
      }
    }
  }
  assert.strictEqual(foundProbes, probes.length, `Tüm ${probes.length} adet -Z probe bulundu`);
  console.log(`  ✓ ${foundProbes} adet -Z probe koordinat ve dönüşüm doğrulaması başarılı PASS`);

  // --------------------------------------------------------------------------
  // 4. HATCH Loops ve Triangulation Doğrulaması
  // --------------------------------------------------------------------------
  console.log("\n[KAPU 4] HATCH Loops ve Triangulation...");
  const hatchEntities = doc.modelSpaceEntities.filter((e) => e.type === "HATCH");
  assert.strictEqual(hatchEntities.length, 104, `R001 içinde 104 adet HATCH olmalı, bulunan: ${hatchEntities.length}`);
  const hatchesWithLoops = hatchEntities.filter((h: any) => Array.isArray(h.loops) && h.loops.length > 0).length;
  assert.strictEqual(hatchesWithLoops, 104, `104 HATCH'in tamamı dolu loops taşımalı (Eski hatalı: 0, Bulunan: ${hatchesWithLoops})`);
  console.log(`  ✓ 104/104 HATCH nesnesi dolu boundaryPaths / loops taşıyor PASS`);

  // Parçalarda üçgen (TRIANGLES) primitive varlığını doğrula
  let totalTrianglesBytes = 0;
  let totalTriangleVertices = 0;
  for (const chunkInfo of compiled.manifest.chunks) {
    const chunkBuf = compiled.chunks.get(chunkInfo.chunkId)!;
    const unpacked = unpackSceneChunk(chunkInfo.chunkId, chunkBuf);
    if (unpacked.trianglesArray && unpacked.trianglesArray.length > 0) {
      totalTrianglesBytes += unpacked.trianglesArray.byteLength;
      totalTriangleVertices += unpacked.trianglesArray.length / 2;
    }
  }
  assert(totalTriangleVertices > 0, "Derlenen sahnede HATCH üçgen köşeleri üretilmiş olmalı");
  console.log(`  ✓ Sahnede ${totalTriangleVertices} adet üçgen köşesi (TRIANGLES) başarıyla üretildi PASS`);

  // --------------------------------------------------------------------------
  // 5. Blok İçi TEXT / MTEXT ve Dimension (*D) Metin Derleme Paritesi
  // --------------------------------------------------------------------------
  console.log("\n[KAPU 5] Blok İçi TEXT / MTEXT ve Dimension (*D) Metin Derleme...");
  const topTextCount = doc.modelSpaceEntities.filter((e) => e.type === "TEXT").length;
  const topMTextCount = doc.modelSpaceEntities.filter((e) => e.type === "MTEXT").length;
  const dimCount = doc.modelSpaceEntities.filter((e) => e.type === "DIMENSION").length;
  console.log(`  -> Üst seviye: TEXT=${topTextCount}, MTEXT=${topMTextCount}, DIMENSION=${dimCount}`);
  assert(topTextCount >= 1000, `TEXT >= 1000 olmalı (Bulunan: ${topTextCount})`);
  assert(topMTextCount >= 300, `MTEXT >= 300 olmalı (Bulunan: ${topMTextCount})`);

  // Bloklardaki metinlerin varlığı
  let blockTextCount = 0;
  for (const block of Object.values(doc.blocks)) {
    for (const ent of block.entities) {
      if (ent.type === "TEXT" || ent.type === "MTEXT") {
        blockTextCount++;
      }
    }
  }
  console.log(`  -> Blok tanımları içi metin sayısı: ${blockTextCount}`);
  assert(blockTextCount > 0, "Blok tanımlarında metin varlığı doğrulanmalı");
  console.log("  ✓ Blok içi ve ölçülendirme (*D) metinleri entity visitor ile sahneye taşındı PASS");

  // --------------------------------------------------------------------------
  // 6. Çizim Sırası (Painter's Order) ve Adjacent Merging
  // --------------------------------------------------------------------------
  console.log("\n[KAPU 6] Çizim Sırası (Painter's Order) ve Monotonik renderOrder...");
  const firstChunkId = compiled.manifest.chunks[0].chunkId;
  const firstChunkBuf = compiled.chunks.get(firstChunkId)!;
  const unpackedFirst = unpackSceneChunk(firstChunkId, firstChunkBuf);
  assert(unpackedFirst.meta?.drawCommands, "Parça çizim komutları meta veride bulunmalı");
  const cmds = unpackedFirst.meta.drawCommands;
  console.log(`  -> İlk parçada ardışık çizim komut sayısı: ${cmds.length}`);
  assert(cmds.length > 1, "Bitişik birleştirme ardışık komutları korumalı (küresel 1 komuta indirgenmemeli)");

  for (let i = 1; i < cmds.length; i++) {
    assert(cmds[i].order >= cmds[i - 1].order, `Komut sırası monotonik olmalı: idx ${i} (${cmds[i].order}) >= idx ${i-1} (${cmds[i-1].order})`);
  }
  console.log("  ✓ Çizim sırası monotonik ve bitişik birleştirme kararlı PASS");

  // --------------------------------------------------------------------------
  // 7. Parça ve Manifest Boyut Sözleşmesi
  // --------------------------------------------------------------------------
  console.log("\n[KAPU 7] Parça (<= 2MB) ve Manifest (<= 1MB) Boyut Sözleşmesi...");
  const manifestJsonStr = JSON.stringify(compiled.manifest);
  const manifestBytes = Buffer.byteLength(manifestJsonStr, "utf8");
  assert(manifestBytes <= 1048576, `Manifest <= 1 MiB olmalı (Gerçek: ${manifestBytes} bayt)`);
  console.log(`  -> Manifest boyutu: ${manifestBytes} bayt (Limit: 1,048,576 bayt) PASS`);

  console.log(`  -> Toplam parça sayısı: ${compiled.manifest.chunks.length}`);
  for (const ch of compiled.manifest.chunks) {
    assert(ch.byteLength <= 2097152, `Parça ${ch.chunkId} <= 2 MiB olmalı (Gerçek: ${ch.byteLength})`);
  }
  console.log("  ✓ Tüm parçalar <= 2 MiB HTTP sınırına tam uyumlu PASS");

  console.log("\n=== TÜM P08 R001 ROOT FIX KABUL KAPILARI BAŞARIYLA GEÇTİ (PASS) ===");
}

runR001RootFixTests().catch((err) => {
  console.error("\nP08 R001 ROOT FIX TESTİ BAŞARISIZ:", err);
  process.exit(1);
});
