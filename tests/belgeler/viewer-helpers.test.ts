import assert from "node:assert/strict";
import {
  BELGE_PREVIEW_MAX_RASTER_PIXELS,
  BELGE_PREVIEW_MAX_RASTER_SIDE,
  clampBelgeZoom,
  getBelgePreviewRasterScale,
  getBelgeZoomAnchorScroll,
} from "../../src/lib/belge-studio-zoom";
import { normalizeBelgelerSearchText } from "../../src/lib/belgeler-search";

assert.equal(clampBelgeZoom(0), 50);
assert.equal(clampBelgeZoom(125), 125);
assert.equal(clampBelgeZoom(999), 400);

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
