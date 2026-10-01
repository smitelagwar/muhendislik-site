import assert from "node:assert/strict";
import { computePageGeometry } from "../../src/lib/dokumantasyon/studio/pdf/pdf-geometry";

function runGeometryUnitTests() {
  console.log("=== FAZ R2: computePageGeometry Birim Testleri ===\n");

  // TEST 1: Standart A4 @ %100, DPR 1
  {
    const geom = computePageGeometry({
      pageWidthPt: 595.275,
      pageHeightPt: 841.889,
      scale: 1.0,
      dpr: 1,
    });
    assert.equal(geom.cssWidth, 595);
    assert.equal(geom.cssHeight, 841);
    assert.equal(geom.bitmapWidth, 595);
    assert.equal(geom.bitmapHeight, 841);
    assert.equal(geom.outputScale, 1.0);
    assert.equal(geom.isQualityReduced, false);
    console.log("[PASS] Standart A4 @ %100, DPR 1 doğrulaması başarılı.");
  }

  // TEST 2: Standart A4 @ %137 (Kullanıcı Bildirimi Zoom), DPR 1
  {
    const geom = computePageGeometry({
      pageWidthPt: 595.275,
      pageHeightPt: 841.889,
      scale: 1.37,
      dpr: 1,
    });
    assert.equal(geom.cssWidth, 815);
    assert.equal(geom.cssHeight, 1153);
    assert.equal(geom.bitmapWidth, 815);
    assert.equal(geom.bitmapHeight, 1153);
    assert.equal(geom.outputScale, 1.0);
    console.log("[PASS] Standart A4 @ %137, DPR 1 doğrulaması başarılı.");
  }

  // TEST 3: Retina Ekran (DPR 2) Netlik Doğrulaması
  {
    const geom = computePageGeometry({
      pageWidthPt: 595.275,
      pageHeightPt: 841.889,
      scale: 1.37,
      dpr: 2,
    });
    assert.equal(geom.cssWidth, 815);
    assert.equal(geom.cssHeight, 1153);
    assert.equal(geom.bitmapWidth, 1630);
    assert.equal(geom.bitmapHeight, 2306);
    assert.equal(geom.outputScale, 2.0);
    assert.equal(geom.isQualityReduced, false);
    console.log("[PASS] Retina DPR 2 Netlik (2x Bitmap) doğrulaması başarılı.");
  }

  // TEST 4: Aşırı Yüksek Çözünürlük ve Piksel Bütçesi Sınırı (A3 @ %400, DPR 2)
  {
    const geom = computePageGeometry({
      pageWidthPt: 1190.55,
      pageHeightPt: 841.889,
      scale: 4.0,
      dpr: 2,
      maxPixelBudget: 16 * 1024 * 1024,
    });
    const totalPixels = geom.bitmapWidth * geom.bitmapHeight;
    console.log(`Piksel Bütçesi: Hesaplanan Piksel = ${(totalPixels / 1e6).toFixed(2)} MP, outputScale = ${geom.outputScale}`);
    assert.ok(totalPixels <= 16.5 * 1024 * 1024, "Toplam piksel 16 MP sınırını aşamaz");
    assert.ok(geom.outputScale >= 1.0, "outputScale asla 1.0 altına inemez");
    assert.equal(geom.isQualityReduced, true);
    console.log("[PASS] Piksel bütçesi koruması ve alt sınır 1.0 başarıyla doğrulandı.");
  }

  console.log("\n>>> computePageGeometry Tüm Birim Testleri Başarıyla Geçti.");
}

runGeometryUnitTests();
