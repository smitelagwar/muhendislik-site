import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildCadSnapPrimitives } from "../src/lib/dokumantasyon/cad-upstream/snap-catalog";
import { CadSnapEngine, type CadSnapMode } from "../src/lib/dokumantasyon/cad-upstream/snap-engine";
import {
  CAD_SNAP_MODES,
  createDefaultCadSnapSettings,
} from "../src/lib/dokumantasyon/cad-upstream/snap-settings";
import { resolveCadSnapGlyphKind } from "../src/lib/dokumantasyon/cad-upstream/precision-ux";
import {
  calculateCalibrationFromWorldDistance,
  convertDistance,
} from "../src/lib/dokumantasyon/cad-review/units";

const allModes = new Set<CadSnapMode>([
  "endpoint",
  "midpoint",
  "intersection",
  "center",
  "perpendicular",
  "nearest",
]);
assert.deepEqual(new Set(CAD_SNAP_MODES), allModes, "settings and engine must expose the same OSnap modes");
assert.equal(createDefaultCadSnapSettings().modes.perpendicular, false, "Dik OSnap is available but opt-in by default");

const engine = new CadSnapEngine(25);
engine.rebuild([
  { kind: "line", id: "h", a: { x: 0, y: 0 }, b: { x: 100, y: 0 } },
  { kind: "line", id: "v", a: { x: 50, y: -50 }, b: { x: 50, y: 50 } },
  { kind: "circle", id: "c", center: { x: 150, y: 0 }, radius: 25 },
  { kind: "arc", id: "a", center: { x: 220, y: 0 }, radius: 20, startAngle: 0, endAngle: Math.PI },
]);
assert.equal(engine.size, 4);

let snap = engine.query({ point: { x: 1, y: 1 }, tolerancePx: 12, worldUnitsPerPixel: 1, modes: allModes });
assert.equal(snap?.mode, "endpoint");
assert.deepEqual(snap?.point, { x: 0, y: 0 });

snap = engine.query({ point: { x: 50, y: 1 }, tolerancePx: 12, worldUnitsPerPixel: 1, modes: allModes });
assert.equal(snap?.mode, "intersection", "intersection wins over lower-priority nearby candidates");
assert.deepEqual(snap?.point, { x: 50, y: 0 });

snap = engine.query({ point: { x: 150, y: 2 }, tolerancePx: 10, worldUnitsPerPixel: 1, modes: allModes });
assert.equal(snap?.mode, "center");

snap = engine.query({ point: { x: 176, y: 1 }, tolerancePx: 5, worldUnitsPerPixel: 1, modes: new Set(["nearest"]) });
assert.equal(snap?.mode, "nearest");
assert.ok(snap && Math.abs(snap.point.x - 175) < 0.1);

snap = engine.query({ point: { x: 220, y: 19 }, tolerancePx: 5, worldUnitsPerPixel: 1, modes: new Set(["midpoint"]) });
assert.equal(snap?.mode, "midpoint", "arc midpoint must be available");

snap = engine.query({
  point: { x: 80, y: 3 },
  referencePoint: { x: 80, y: 40 },
  tolerancePx: 8,
  worldUnitsPerPixel: 1,
  modes: new Set(["perpendicular"]),
});
assert.equal(snap?.mode, "perpendicular", "explicit-reference perpendicular OSnap must resolve");
assert.deepEqual(snap?.point, { x: 80, y: 0 });

snap = engine.query({
  point: { x: 70, y: 4 },
  tolerancePx: 8,
  worldUnitsPerPixel: 1,
  modes: new Set(["perpendicular"]),
});
assert.equal(snap?.mode, "perpendicular", "cursor projection keeps the Dik mode usable without an explicit reference");
assert.deepEqual(snap?.point, { x: 70, y: 0 });

const zoomedOut = engine.query({ point: { x: 0, y: 7.5 }, tolerancePx: 8, worldUnitsPerPixel: 1 });
const zoomedIn = engine.query({ point: { x: 0, y: 0.75 }, tolerancePx: 8, worldUnitsPerPixel: 0.1 });
assert.equal(zoomedOut?.mode, "endpoint");
assert.equal(zoomedIn?.mode, "endpoint");
assert.ok((zoomedOut?.distancePx ?? 99) <= 8 && (zoomedIn?.distancePx ?? 99) <= 8, "pixel tolerance must stay stable across zoom levels");

const glyphKinds = CAD_SNAP_MODES.map((mode) => resolveCadSnapGlyphKind(mode));
assert.equal(new Set(glyphKinds).size, CAD_SNAP_MODES.length, "every OSnap mode must have a distinct marker glyph");
assert.equal(resolveCadSnapGlyphKind("endpoint"), "square");
assert.equal(resolveCadSnapGlyphKind("midpoint"), "triangle");
assert.equal(resolveCadSnapGlyphKind("intersection"), "cross");
assert.equal(resolveCadSnapGlyphKind("center"), "circle-cross");
assert.equal(resolveCadSnapGlyphKind("perpendicular"), "right-angle");

const calibrationEngine = new CadSnapEngine(100);
calibrationEngine.rebuild([
  { kind: "line", id: "calibration-line", a: { x: 0, y: 0 }, b: { x: 1000, y: 0 } },
]);
const calibrationStart = calibrationEngine.query({
  point: { x: 2, y: 1 },
  tolerancePx: 10,
  worldUnitsPerPixel: 1,
  modes: new Set(["endpoint"]),
});
const calibrationEnd = calibrationEngine.query({
  point: { x: 998, y: -1 },
  tolerancePx: 10,
  worldUnitsPerPixel: 1,
  modes: new Set(["endpoint"]),
});
assert.deepEqual(calibrationStart?.point, { x: 0, y: 0 });
assert.deepEqual(calibrationEnd?.point, { x: 1000, y: 0 });
const snappedWorldDistance = Math.hypot(
  calibrationEnd!.point.x - calibrationStart!.point.x,
  calibrationEnd!.point.y - calibrationStart!.point.y
);
const calibration = calculateCalibrationFromWorldDistance(snappedWorldDistance, 2, "m");
assert.equal(calibration.mmPerWorldUnit, 2, "1000 snapped world units = 2 m => 2 mm/world-unit");
assert.equal(
  convertDistance(
    4000,
    { sourceUnit: "unitless", mmPerWorldUnit: calibration.mmPerWorldUnit ?? null, source: "calibration" },
    "m"
  ),
  8,
  "snap-derived calibration must drive later physical conversions"
);

const childBlock = {
  *newIterator() {
    yield { type: "LINE", objectId: "block-line", layer: "B", startPoint: { x: 0, y: 0 }, endPoint: { x: 10, y: 0 } };
  },
};
const modelSpace = {
  *newIterator() {
    yield { type: "LINE", objectId: "line-1", layer: "A", startPoint: { x: 0, y: 0 }, endPoint: { x: 20, y: 0 } };
    yield { type: "CIRCLE", objectId: "circle-1", layer: "A", center: { x: 40, y: 10 }, radius: 5 };
    yield { type: "LWPOLYLINE", objectId: "poly-1", layer: "A", closed: false, vertices: [{ x: 0, y: 20 }, { x: 10, y: 20 }, { x: 10, y: 30 }] };
    yield {
      type: "INSERT",
      objectId: "insert-1",
      layer: "A",
      blockTableRecord: childBlock,
      getFullInsertionTransform() {
        return { elements: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 100, 50, 0, 1] };
      },
    };
  },
};
const primitives = buildCadSnapPrimitives({ tables: { blockTable: { modelSpace } } });
assert.ok(primitives.some((primitive) => primitive.id === "line-1" && primitive.kind === "line"));
assert.ok(primitives.some((primitive) => primitive.id === "circle-1" && primitive.kind === "circle"));
assert.equal(primitives.filter((primitive) => primitive.id.startsWith("poly-1:seg:")).length, 2);
const transformed = primitives.find((primitive) => primitive.id === "block-line");
assert.ok(transformed && transformed.kind === "line");
if (transformed?.kind === "line") {
  assert.deepEqual(transformed.a, { x: 100, y: 50 });
  assert.deepEqual(transformed.b, { x: 110, y: 50 });
}

const source = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

const layerPanelSource = source("src/components/dokumantasyon/preview/cad-layer-panel.tsx");
assert.ok(layerPanelSource.includes('data-cad-layer-mode={isMobileSheet ? "modal-sheet" : "modeless-floating"}'));
assert.ok(layerPanelSource.includes('aria-modal={isMobileSheet ? "true" : "false"}'));
assert.ok(layerPanelSource.includes('[data-testid="cad-tool-layers"]'), "focus restore must fall back to the real Layers trigger");
assert.ok(layerPanelSource.includes('if (!isMobileSheet || event.key !== "Tab") return;'), "focus trap must be mobile-modal only");
assert.ok(layerPanelSource.includes('viewport.removeAttribute("aria-hidden")'), "desktop modeless panel must not hide the canvas");

const viewportSource = source("src/lib/dokumantasyon/cad-upstream/viewport-coordination.ts");
assert.ok(viewportSource.includes("new ResizeObserver"));
assert.ok(viewportSource.includes('root.dataset.cadViewportRoot = "true"'));

const distanceOverlaySource = source("src/components/dokumantasyon/preview/cad-distance-overlay.tsx");
const areaOverlaySource = source("src/components/dokumantasyon/preview/cad-area-overlay.tsx");
const reviewOverlaySource = source("src/components/dokumantasyon/preview/cad-review-overlay.tsx");
assert.ok(distanceOverlaySource.includes("observeCadViewportRoot"));
assert.ok(distanceOverlaySource.includes('data-cad-calibration-reference="snapped-measurement"'));
assert.ok(areaOverlaySource.includes("CAD_VIEWPORT_ROOT_RESIZED_EVENT"));
assert.ok(areaOverlaySource.includes("CadSnapGlyph"));
assert.ok(reviewOverlaySource.includes("observeCadViewportRoot"));
assert.ok(reviewOverlaySource.includes('data-cad-coordinate-root="viewport"'));

console.log(
  "GATE: PASS — Stage 4 OSnap, distinct markers, snap-based calibration, desktop/mobile layer semantics, focus restore and shared viewport-root coordinate contracts are complete."
);
