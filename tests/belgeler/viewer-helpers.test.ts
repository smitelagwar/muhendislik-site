import assert from "node:assert/strict";
import {
  BELGE_PREVIEW_MAX_RASTER_PIXELS,
  BELGE_PREVIEW_MAX_RASTER_SIDE,
  clampBelgeZoom,
  getBelgePreviewRasterScale,
  getBelgeZoomAnchorScroll,
  calculateBelgeFitWidthZoom,
} from "../../src/lib/belge-studio-zoom";
import { normalizeBelgelerSearchText } from "../../src/lib/belgeler-search";

assert.equal(clampBelgeZoom(0), 50);
assert.equal(clampBelgeZoom(125), 125);
assert.equal(clampBelgeZoom(999), 400);

// Genişliğe sığdır (Fit to Width) hesaplama testleri
{
  // Standart masaüstü geniş ekran (860x650 konteyner, A4 595.28x841.89)
  const desktopZoom = calculateBelgeFitWidthZoom({
    containerWidth: 860,
    containerHeight: 650,
    pageWidth: 595.28,
    pageHeight: 841.89,
    hasVerticalScrollbar: false,
    scrollbarWidth: 16,
    padding: 16,
    safetyMargin: 2,
  });
  // Sayfa dikeyde taştığı için dikey scrollbar hesaba katılarak ~%184 hesaplanmalı
  assert.equal(desktopZoom, 184);

  // Zaten dikey kaydırma çubuğu açıkken (hasVerticalScrollbar: true, clientWidth = 844)
  const withScrollbarZoom = calculateBelgeFitWidthZoom({
    containerWidth: 844,
    containerHeight: 650,
    pageWidth: 595.28,
    pageHeight: 841.89,
    hasVerticalScrollbar: true,
    scrollbarWidth: 16,
    padding: 16,
    safetyMargin: 2,
  });
  assert.equal(withScrollbarZoom, 184);

  // Dar mobil ekran (390x600 konteyner, A4 595.28x841.89)
  const mobileZoom = calculateBelgeFitWidthZoom({
    containerWidth: 390,
    containerHeight: 600,
    pageWidth: 595.28,
    pageHeight: 841.89,
    hasVerticalScrollbar: false,
    scrollbarWidth: 0,
    padding: 16,
    safetyMargin: 2,
  });
  // Mobilde sayfa zaten dikeyde dar olduğundan fitScale = availableWidth/pageWidth olur, zoom ~%99-%100
  assert.ok(mobileZoom >= 98 && mobileZoom <= 100);

  // Geçersiz/0 boyutlarda güvenli fallback %100 dönmeli
  assert.equal(calculateBelgeFitWidthZoom({ containerWidth: 0, containerHeight: 0, pageWidth: 595, pageHeight: 842 }), 100);
}

for (const [width, height, dpr] of [
  [900, 1200, 1],
  [2400, 3600, 3],
  [12000, 800, 2],
  [800, 12000, 2],
] as const) {
  const scale = getBelgePreviewRasterScale(width, height, dpr);
  assert.ok(scale > 0 && Number.isFinite(scale), `${width}x${height}: ölçek geçersiz`);
  assert.ok(width * scale <= BELGE_PREVIEW_MAX_RASTER_SIDE + 1);
  assert.ok(height * scale <= BELGE_PREVIEW_MAX_RASTER_SIDE + 1);
  assert.ok(width * height * scale * scale <= BELGE_PREVIEW_MAX_RASTER_PIXELS + 10_000);
}

assert.deepEqual(
  getBelgeZoomAnchorScroll({
    frameLeft: 120,
    frameTop: 80,
    nextWidth: 800,
    nextHeight: 1000,
    relativeX: 0.5,
    relativeY: 0.25,
    pointerX: 200,
    pointerY: 100,
    scrollLeft: 0,
    scrollTop: 0,
  }),
  { scrollLeft: 320, scrollTop: 230 }
);

assert.equal(normalizeBelgelerSearchText("ŞANTİYE ŞEFİ"), "santiye sefi");
assert.equal(normalizeBelgelerSearchText("İnşaat Ruhsatı"), "insaat ruhsati");
assert.equal(normalizeBelgelerSearchText("GÖZLEM — ÖRNEK"), "gozlem — ornek");

console.log("Belge zoom geometry and search normalization checks passed.");
