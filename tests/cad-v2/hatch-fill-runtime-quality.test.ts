import assert from "node:assert/strict";
import { evaluateVisibleHatchFillQuality } from "../../src/lib/cad-v2/render/hatch-fill-runtime-quality";
import type { CadCameraState } from "../../src/lib/cad-v2/interaction/d3-camera-adapter";

const camera = (unitsPerCssPixel: number): CadCameraState => ({
  worldOrigin: [0, 0],
  center: [0, 0],
  unitsPerCssPixel,
  width: 100,
  height: 100,
});

const chunks = [
  { chunkId: "model-hatch", layoutId: "Model", bbox: [-10, -10, 10, 10] as [number, number, number, number], maxHatchFillEncodedGeometryErrorWorld: 0.125 },
  { chunkId: "model-clear", layoutId: "Model", bbox: [200, 200, 220, 220] as [number, number, number, number], maxHatchFillEncodedGeometryErrorWorld: 100 },
  { chunkId: "paper-hatch", layoutId: "Layout1", bbox: [-10, -10, 10, 10] as [number, number, number, number], maxHatchFillEncodedGeometryErrorWorld: 100 },
  { chunkId: "model-no-fill", layoutId: "Model", bbox: [-5, -5, 5, 5] as [number, number, number, number], maxHatchFillEncodedGeometryErrorWorld: 0 },
];

const zoomedIn = evaluateVisibleHatchFillQuality(chunks, camera(0.25), "Model", 0.25);
assert.equal(zoomedIn.status, "over-budget");
assert.deepEqual(zoomedIn.affectedChunkIds, ["model-hatch"]);
assert.equal(zoomedIn.maxErrorCssPixels, 0.5);

const zoomedOut = evaluateVisibleHatchFillQuality(chunks, camera(0.5), "Model", 0.25);
assert.equal(zoomedOut.status, "within-budget", "the same static mesh must recover its CSS error budget when zoomed out");
assert.equal(zoomedOut.affectedChunkIds.length, 0);

const exactBoundary = evaluateVisibleHatchFillQuality(chunks, camera(0.5), "Model", 0.25);
assert.equal(exactBoundary.status, "within-budget", "the target is inclusive within floating-point tolerance");

const oldManifest = evaluateVisibleHatchFillQuality([
  { chunkId: "legacy-visible", layoutId: "Model", bbox: [-10, -10, 10, 10] },
  { chunkId: "legacy-offscreen", layoutId: "Model", bbox: [200, 200, 220, 220] },
], camera(0.5), "Model", 0.25);
assert.equal(oldManifest.status, "unverifiable", "a visible legacy chunk without a recorded error bound cannot be treated as quality-verified");
assert.deepEqual(oldManifest.unverifiableChunkIds, ["legacy-visible"]);

console.log("✅ HATCH fill runtime screen-error budget reacts to zoom and filters layout/viewport visibility.");
