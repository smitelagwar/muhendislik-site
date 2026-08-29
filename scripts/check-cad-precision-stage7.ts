import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  CAD_PRECISION_EDGE_MARGIN_PX,
  CAD_PRECISION_MAGNIFIER_DIAMETER_PX,
  CAD_PRECISION_MAGNIFIER_ZOOM,
  CAD_SNAP_MODE_LABELS,
  cadPrecisionOffsetDistance,
  resolveCadMagnifierCrop,
  resolveCadPrecisionLensPlacement,
} from "../src/lib/dokumantasyon/cad-upstream/precision-ux";

assert.equal(CAD_PRECISION_MAGNIFIER_DIAMETER_PX, 116);
assert.equal(CAD_PRECISION_MAGNIFIER_ZOOM, 2.75);
assert.equal(CAD_PRECISION_EDGE_MARGIN_PX, 10);
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
assert.equal(centered.side, "above");
assert.equal(centered.left, 142);
assert.equal(centered.top, 106);

const nearTop = resolveCadPrecisionLensPlacement(
  { x: 200, y: 35 },
  { width: 400, height: 500 }
);
assert.equal(nearTop.side, "below", "Üst kenarda büyüteç parmağın altına geçmeli.");
assert.equal(nearTop.top, 63);

const nearLeft = resolveCadPrecisionLensPlacement(
  { x: 3, y: 250 },
  { width: 400, height: 500 }
);
assert.equal(nearLeft.left, 10, "Büyüteç sol kenardan taşmamalı.");

const nearRight = resolveCadPrecisionLensPlacement(
  { x: 398, y: 250 },
  { width: 400, height: 500 }
);
assert.equal(nearRight.left, 274, "Büyüteç sağ kenardan taşmamalı.");

const crop = resolveCadMagnifierCrop(
  { x: 200, y: 100 },
  { width: 400, height: 200 },
  { width: 800, height: 400 }
);
assert.ok(crop, "Geçerli canvas boyutlarında crop üretilmeli.");
assert.ok(Math.abs(crop.targetX - 58) < 1e-9);
assert.ok(Math.abs(crop.targetY - 58) < 1e-9);
assert.ok(crop.sw > 84 && crop.sw < 85, "CSS/backing scale crop'a uygulanmalı.");

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
  "data-cad-snap-label",
  "data-cad-offset-guide",
  "data-cad-touch-anchor",
  "data-cad-precision-lens",
  "context.drawImage",
  "CAD_SNAP_MODE_LABELS",
  "SnapGlyph",
  "Crosshair",
]) {
  assert.ok(precisionSource.includes(token), `Precision overlay tokenı eksik: ${token}`);
}

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
  "Stage 7 push/PR Vercel deployment tetiklememeli."
);

console.log(
  "GATE: PASS — Stage 7 precision UX opens an offset magnifier only while tracking, clamps it to the viewport and exposes distinct snap markers/labels for all five snap modes."
);
