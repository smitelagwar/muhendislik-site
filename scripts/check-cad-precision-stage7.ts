import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  CAD_PRECISION_EDGE_MARGIN_PX,
  CAD_PRECISION_MAGNIFIER_DESKTOP_DIAMETER_PX,
  CAD_PRECISION_MAGNIFIER_DIAMETER_PX,
  CAD_PRECISION_MAGNIFIER_ZOOM,
  CAD_SNAP_MODE_LABELS,
  cadPrecisionOffsetDistance,
  resolveCadMagnifierCrop,
  resolveCadMagnifierDiameter,
  resolveCadPrecisionLensPlacement,
} from "../src/lib/dokumantasyon/cad-upstream/precision-ux";

assert.equal(CAD_PRECISION_MAGNIFIER_DIAMETER_PX, 152);
assert.equal(CAD_PRECISION_MAGNIFIER_DESKTOP_DIAMETER_PX, 240);
assert.equal(CAD_PRECISION_MAGNIFIER_ZOOM, 2.75);
assert.equal(CAD_PRECISION_EDGE_MARGIN_PX, 12);

// Responsive diameter runtime assertions
const desktopViewport = { width: 1440, height: 900 };
const desktopDiameter = resolveCadMagnifierDiameter(desktopViewport);
assert.ok(desktopDiameter <= desktopViewport.width * 0.20 + 1, "Desktop lens <= %20 genişlik");
assert.ok(desktopDiameter <= desktopViewport.height * 0.35 + 1, "Desktop lens <= %35 yükseklik");
assert.ok(desktopDiameter <= 240, "Desktop lens <= 240 px");

const mobileViewport = { width: 375, height: 667 };
const mobileDiameter = resolveCadMagnifierDiameter(mobileViewport);
assert.ok(mobileDiameter <= mobileViewport.width * 0.45, "Mobil lens taşamaz");

assert.deepEqual(CAD_SNAP_MODE_LABELS, {
  endpoint: "Endpoint",
  midpoint: "Midpoint",
  intersection: "Intersection",
  center: "Center",
  nearest: "Nearest",
});

const centered = resolveCadPrecisionLensPlacement(
  { x: 200, y: 250 },
  { width: 400, height: 500 }
);
assert.equal(centered.side, "fixed-top-right");
assert.equal(centered.left, 236);
assert.equal(centered.top, 12);

const movedPointer = resolveCadPrecisionLensPlacement(
  { x: 20, y: 470 },
  { width: 400, height: 500 }
);
assert.deepEqual(
  movedPointer,
  centered,
  "Büyüteç parmakla dolaşmamalı; sağ üstte sabit kalmalı."
);

const narrowViewport = resolveCadPrecisionLensPlacement(
  { x: 10, y: 10 },
  { width: 140, height: 300 }
);
assert.equal(narrowViewport.left, 12, "Dar viewport'ta panel sol kenardan taşmamalı.");
assert.equal(narrowViewport.top, 12);

const crop = resolveCadMagnifierCrop(
  { x: 200, y: 100 },
  { width: 400, height: 200 },
  { width: 800, height: 400 }
);
assert.ok(crop, "Geçerli canvas boyutlarında crop üretilmeli.");
assert.ok(Math.abs(crop.targetX - 76) < 1e-9);
assert.ok(Math.abs(crop.targetY - 76) < 1e-9);
assert.ok(crop.sw > 110 && crop.sw < 111, "CSS/backing scale crop'a uygulanmalı.");

const edgeCrop = resolveCadMagnifierCrop(
  { x: 0, y: 0 },
  { width: 400, height: 200 },
  { width: 800, height: 400 }
);
assert.ok(edgeCrop);
assert.equal(edgeCrop.sx, 0);
assert.equal(edgeCrop.sy, 0);
assert.equal(edgeCrop.targetX, 0, "Kenar crop'unda crosshair gerçek hedefe kaymalı.");
assert.equal(edgeCrop.targetY, 0);
assert.equal(resolveCadMagnifierCrop({ x: 1, y: 1 }, { width: 0, height: 1 }, { width: 1, height: 1 }), null);
assert.equal(cadPrecisionOffsetDistance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);

const precisionSource = readFileSync(
  "src/components/dokumantasyon/preview/cad-precision-overlay.tsx",
  "utf8"
);
const distanceOverlaySource = readFileSync(
  "src/components/dokumantasyon/preview/cad-distance-overlay.tsx",
  "utf8"
);
const runtimeSource = readFileSync(
  "src/lib/dokumantasyon/cad-upstream/distance-measurement.ts",
  "utf8"
);

for (const token of [
  "tracking-first",
  "tracking-second",
  "data-cad-precision-magnifier",
  "data-cad-magnifier-fixed",
  "top-right",
  "data-cad-snap-label",
  "data-cad-offset-guide",
  "data-cad-touch-anchor",
  "data-cad-precision-lens",
  "context.drawImage",
  "Yakınlaştırma",
  "CAD_SNAP_MODE_LABELS",
  "SnapGlyph",
  "Crosshair",
]) {
  assert.ok(precisionSource.includes(token), `Precision overlay tokenı eksik: ${token}`);
}

assert.ok(!precisionSource.includes("rounded-full border-2"), "Eski gezen yuvarlak lens UI geri gelmemeli.");

for (const token of [
  "CadPrecisionOverlay",
  "data-cad-distance-overlay-anchor",
  "querySelectorAll(\"canvas\")",
  "data-cad-precision-lens",
]) {
  assert.ok(distanceOverlaySource.includes(token), `Distance overlay Stage 7 tokenı eksik: ${token}`);
}

for (const token of [
  "pointerScreenPoint",
  "pointerScreenPoint: null",
  "pointerScreenPoint: clonePoint(this.lastScreenPoint)",
]) {
  assert.ok(runtimeSource.includes(token), `Pointer precision tokenı eksik: ${token}`);
}

const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8")) as {
  git?: { deploymentEnabled?: unknown };
};
assert.equal(
  vercelConfig.git?.deploymentEnabled,
  false,
  "Stage 1 magnifier değişikliği Vercel deployment tetiklememeli."
);

console.log(
  "GATE: PASS — precision magnifier stays fixed at the viewer top-right, uses a 152 px live CAD crop and keeps snap markers/crosshair visible while tracking."
);
