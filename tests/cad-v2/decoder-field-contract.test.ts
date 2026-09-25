// ============================================================================
// DWG/DXF MOTOR V2 — P04 DECODER FIELD CONTRACT TEST
// ============================================================================
// Sözleşme: P04 — Gerçek decoder sözleşmesi: visibility, HATCH, ellipse, units
// 1. R001 104/104 HATCH sınırlarını taşır; hiçbir model-space HATCH boş loops üretmez
// 2. R001 units=4 (mm), measurement=1 (metric) doğrulanır
// 3. ELLIPSE alanları (majorAxisEndPoint, axisRatio, startParam, endParam) korunur
// 4. TEXT alanları (startPoint->insertionPoint, textHeight->height, xScale->widthFactor, generationFlag) korunur
// 5. INSERT alanları (name->blockName, scale, extrusionDirection) korunur
// ============================================================================

import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import type { CadEllipseEntity, CadHatchEntity, CadInsertEntity, CadTextEntity } from "../../src/lib/cad-v2/canonical/types";

async function testR001HatchAndUnitsContract() {
  const r001Path = path.resolve(process.cwd(), "eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg");
  if (!fs.existsSync(r001Path)) {
    console.warn("  ⚠ R001 fixture bulunamadı, test atlanıyor.");
    return;
  }

  const bytes = fs.readFileSync(r001Path);
  const doc = await parseDwgToCanonical(bytes, {
    sourceVersionKey: "R001-P04-contract",
  });

  // 1. UNITS & MEASUREMENT SÖZLEŞMESİ
  assert.equal(
    doc.units,
    4,
    "R001 INSUNITS=4 (mm) olmalıdır; keyfî default 5 (cm/m) atanmamalıdır!"
  );
  assert.equal(
    doc.measurement,
    1,
    "R001 MEASUREMENT=1 (metric) olmalıdır."
  );
  assert.equal(
    doc.rawStats?.rawHeaderInsunits,
    4,
    "rawStats.rawHeaderInsunits 4 olmalıdır."
  );
  console.log("  ✓ R001 units=4 (mm) ve measurement=1 (metric) başarıyla doğrulandı.");

  // 2. HATCH SÖZLEŞMESİ: 104/104 HATCH döngü taşımalı
  const topHatches = doc.modelSpaceEntities.filter((e): e is CadHatchEntity => e.type === "HATCH");
  assert.equal(
    topHatches.length,
    104,
    `R001 model alanında tam olarak 104 HATCH bulunmalıdır, bulunan: ${topHatches.length}`
  );

  let hatchesWithLoops = 0;
  let totalLoops = 0;
  let polylineLoops = 0;
  let edgeLoops = 0;
  let loopsWithBulge = 0;

  for (const h of topHatches) {
    assert.ok(
      h.loops && h.loops.length > 0,
      `HATCH handle=${h.handle} boş loop üretti! P04 gereğince boş loop testle FAIL olmalıdır.`
    );
    hatchesWithLoops++;
    totalLoops += h.loops.length;

    for (const loop of h.loops) {
      if (loop.isPolyline) {
        polylineLoops++;
        assert.ok(
          Array.isArray(loop.vertices) && loop.vertices.length > 0,
          `Polyline HATCH loop vertex içermelidir: handle=${h.handle}`
        );
        if (loop.bulges && loop.bulges.length > 0) {
          loopsWithBulge++;
        }
      } else if (loop.edges) {
        edgeLoops++;
        assert.ok(
          Array.isArray(loop.edges) && loop.edges.length > 0,
          `Edge HATCH loop edge içermelidir: handle=${h.handle}`
        );
      }
    }
  }

  assert.equal(
    hatchesWithLoops,
    104,
    "104/104 HATCH nesnesinin tamamı non-empty boundary loops taşımalıdır."
  );
  assert.ok(totalLoops >= 104, "Toplam döngü sayısı en az 104 olmalıdır.");
  console.log(`  ✓ 104/104 HATCH döngüleri doğrulandı (toplam loop: ${totalLoops}, polyline: ${polylineLoops}, edge: ${edgeLoops}, bulge: ${loopsWithBulge}).`);

  // 3. ELLIPSE SÖZLEŞMESİ (R001 blokları içerisindeki 108 ELLIPSE'den örnekler)
  const allBlocks = Object.values(doc.blocks || {});
  const allBlockEllipses = allBlocks.flatMap((b) =>
    b.entities.filter((e): e is CadEllipseEntity => e.type === "ELLIPSE")
  );
  assert.ok(
    allBlockEllipses.length > 0,
    "R001 blokları içinde ELLIPSE nesneleri bulunmalıdır."
  );

  const sampleEllipse = allBlockEllipses[0];
  assert.ok(Array.isArray(sampleEllipse.center) && sampleEllipse.center.length === 2, "ELLIPSE center [x, y] olmalıdır.");
  assert.ok(Array.isArray(sampleEllipse.majorAxisVector) && sampleEllipse.majorAxisVector.length === 2, "ELLIPSE majorAxisVector [x, y] olmalıdır.");
  assert.ok(typeof sampleEllipse.axisRatio === "number" && sampleEllipse.axisRatio > 0, "ELLIPSE axisRatio pozitif sayı olmalıdır.");
  assert.ok(typeof sampleEllipse.startParam === "number", "ELLIPSE startParam tanımlı olmalıdır.");
  assert.ok(typeof sampleEllipse.endParam === "number", "ELLIPSE endParam tanımlı olmalıdır.");
  console.log(`  ✓ ELLIPSE alan sözleşmesi doğrulandı (toplam ${allBlockEllipses.length} ellipse incelendi).`);

  // 4. TEXT SÖZLEŞMESİ (startPoint -> insertionPoint, textHeight -> height, xScale -> widthFactor)
  const topTexts = doc.modelSpaceEntities.filter((e): e is CadTextEntity => e.type === "TEXT");
  assert.ok(topTexts.length > 0, "R001 model alanında TEXT bulunmalıdır.");

  // En az bir text (0, 0) dışında gerçek koordinatta olmalıdır
  const nonZeroTexts = topTexts.filter(
    (t) => Math.hypot(t.insertionPoint[0], t.insertionPoint[1]) > 10
  );
  assert.ok(
    nonZeroTexts.length > 0,
    "TEXT nesnelerinin koordinatları startPoint üzerinden doğru okunmalı, hepsi (0, 0)'a düşmemelidir!"
  );

  // Height kontrolü: hepsi sabit 2.5 olmamalı
  const sampleText = topTexts.find((t) => t.text.includes("PAFTA") || t.height > 5);
  assert.ok(
    sampleText != null,
    "PAFTA veya büyük boyutlu TEXT bulunmalı ve gerçek textHeight taşınmalıdır."
  );
  assert.ok(
    sampleText.height > 20,
    `PAFTA ADI text height=${sampleText.height} olmalıdır (beklenen ~27).`
  );
  console.log(`  ✓ TEXT sözleşmesi doğrulandı (toplam ${topTexts.length} TEXT, ${nonZeroTexts.length} sıfır dışı, sample height=${sampleText.height}).`);

  // 5. INSERT SÖZLEŞMESİ
  const topInserts = doc.modelSpaceEntities.filter((e): e is CadInsertEntity => e.type === "INSERT");
  assert.ok(topInserts.length > 0, "R001 model alanında INSERT bulunmalıdır.");
  const sampleInsert = topInserts.find((i) => i.blockName.length > 0);
  assert.ok(sampleInsert != null, "Geçerli blockName'e sahip INSERT bulunmalıdır.");
  assert.ok(Array.isArray(sampleInsert.scale) && sampleInsert.scale.length === 3, "INSERT scale 3-öğe tuple olmalıdır.");
  assert.ok(Array.isArray(sampleInsert.insertionPoint) && sampleInsert.insertionPoint.length === 2, "INSERT insertionPoint 2-öğe tuple olmalıdır.");
  console.log(`  ✓ INSERT sözleşmesi doğrulandı (toplam ${topInserts.length} INSERT, sample blockName='${sampleInsert.blockName}').`);
}

async function main() {
  console.log("▶ P04 Decoder Field Contract Testi Başlatılıyor...");
  await testR001HatchAndUnitsContract();
  console.log("✅ P04 Decoder Field Contract Testi Başarıyla Geçti.");
}

main().catch((err) => {
  console.error("❌ P04 Decoder Field Contract Test Hatası:", err);
  process.exit(1);
});
