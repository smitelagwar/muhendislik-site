// ============================================================================
// FAZ F — PDF GESTURE VE ZOOM BİRİM TESTLERİ
// ============================================================================

import assert from "node:assert/strict";
import {
  clampPdfScale,
  calculateWheelZoomFactor,
  calculateAnchorScroll,
  MIN_PDF_SCALE,
  MAX_PDF_SCALE,
} from "../../src/lib/dokumantasyon/studio/pdf/pdf-gesture-engine";

console.log("=== FAZ F: Gesture ve Zoom Birim Testleri ===");

// 1. Sınır (Clamping) Testleri (Faz F, Madde 4)
{
  assert.equal(clampPdfScale(0.1), MIN_PDF_SCALE, "Min sınır 0.25 altına inemez");
  assert.equal(clampPdfScale(5.8), MAX_PDF_SCALE, "Max sınır 5.0 üstüne çıkamaz");
  assert.equal(clampPdfScale(1.5), 1.5, "Geçerli aralıktaki ölçek korunmalı");
  console.log("[PASS 1.1] Clamping (0.25 - 5.0) sınır koruması doğrulandı.");
}

// 2. Wheel Zoom Çarpanı Testleri (Faz F, Madde 2)
{
  const zoomInFactor = calculateWheelZoomFactor(-100, 0);
  assert.ok(zoomInFactor > 1.0, "Negatif deltaY yakınlaştırma (zoom in) çarpanı üretmeli");

  const zoomOutFactor = calculateWheelZoomFactor(100, 0);
  assert.ok(zoomOutFactor < 1.0, "Pozitif deltaY uzaklaştırma (zoom out) çarpanı üretmeli");

  const lineDeltaFactor = calculateWheelZoomFactor(1, 1); // DOM_DELTA_LINE
  assert.ok(lineDeltaFactor < 1.0, "DOM_DELTA_LINE 16 çarpanıyla normalize edilmeli");

  console.log("[PASS 2.1] Wheel zoom çarpanı ve normalizasyonu doğrulandı.");
}

// 3. Odak Koruma Formülü Testleri (Faz F, Madde 2 & 3)
{
  // Senaryo: scrollLeft=100, scrollTop=200, cursor ortada (300, 300), container (0, 0)
  // Mevcut ölçek: 1.0 -> Yeni ölçek: 2.0
  // İmleç altındaki doküman noktası:
  // contentX = (100 + 300) / 1.0 = 400
  // contentY = (200 + 300) / 1.0 = 500
  // Yeni scroll konumu:
  // targetLeft = 400 * 2.0 - 300 = 800 - 300 = 500
  // targetTop  = 500 * 2.0 - 300 = 1000 - 300 = 700
  const result = calculateAnchorScroll({
    scrollLeft: 100,
    scrollTop: 200,
    anchorX: 300,
    anchorY: 300,
    containerLeft: 0,
    containerTop: 0,
    currentScale: 1.0,
    newScale: 2.0,
  });

  assert.equal(result.scrollLeft, 500, "Odak koruma scrollLeft doğru hesaplanmalı");
  assert.equal(result.scrollTop, 700, "Odak koruma scrollTop doğru hesaplanmalı");
  console.log("[PASS 3.1] Odak noktası koruma (anchor preservation) formülü doğrulandı.");
}

// 4. Sıfır / Negatif Ölçek Koruma Testi
{
  const fallback = calculateAnchorScroll({
    scrollLeft: 50,
    scrollTop: 80,
    anchorX: 100,
    anchorY: 100,
    containerLeft: 0,
    containerTop: 0,
    currentScale: 0,
    newScale: 1.5,
  });
  assert.equal(fallback.scrollLeft, 50, "Sıfır ölçekte mevcut scrollLeft korunmalı");
  assert.equal(fallback.scrollTop, 80, "Sıfır ölçekte mevcut scrollTop korunmalı");
  console.log("[PASS 4.1] Geçersiz ölçek girdisinde geri dönüş güvenliği doğrulandı.");
}

console.log("\n>>> Faz F Gesture ve Zoom Birim Testleri Başarıyla Tamamlandı.\n");
