import assert from "node:assert/strict";
import { refineRuntimeHatchFill, type RuntimeHatchFillSource } from "../../src/lib/cad-v2/worker/hatch-fill-refinement";

const quarterCircle: RuntimeHatchFillSource = {
  handle: "HATCH_ARC_01",
  layer: "HATCH",
  order: "17",
  isSolid: true,
  hatchStyle: 0,
  loops: [{
    isPolyline: false,
    isClosed: true,
    edges: [
      { type: "ARC", center: [0, 0], radius: 10, startAngleRad: 0, endAngleRad: Math.PI / 2, ccw: true },
      { type: "LINE", start: [0, 10], end: [10, 0] },
    ],
  }],
};

function meshArea(vertices: Float64Array): number {
  let twiceArea = 0;
  for (let offset = 0; offset < vertices.length; offset += 6) {
    const [ax, ay, bx, by, cx, cy] = vertices.subarray(offset, offset + 6);
    twiceArea += Math.abs((bx! - ax!) * (cy! - ay!) - (by! - ay!) * (cx! - ax!));
  }
  return twiceArea / 2;
}

const coarse = refineRuntimeHatchFill(quarterCircle, {
  targetErrorCssPixels: 0.25,
  unitsPerCssPixel: 8,
  maxTransformSingularValue: 1,
});
const fine = refineRuntimeHatchFill(quarterCircle, {
  targetErrorCssPixels: 0.25,
  unitsPerCssPixel: 0.5,
  maxTransformSingularValue: 1,
});
assert.equal(coarse.status, "refined");
assert.equal(fine.status, "refined");
assert.ok(coarse.verticesWorld instanceof Float64Array && fine.verticesWorld instanceof Float64Array);
assert.ok(fine.triangleCount > coarse.triangleCount, "a closer camera target must remesh the curved fill more densely");
assert.ok(coarse.measuredBoundaryErrorWorld <= coarse.requestedErrorWorld);
assert.ok(fine.measuredBoundaryErrorWorld <= fine.requestedErrorWorld);
assert.ok(fine.measuredBoundaryErrorWorld < coarse.measuredBoundaryErrorWorld);
const expectedCircularSegmentArea = Math.PI * 25 - 50;
const coarseArea = meshArea(coarse.verticesWorld!);
const fineArea = meshArea(fine.verticesWorld!);
assert.ok(Math.abs(coarseArea - expectedCircularSegmentArea) < 8, `coarse mesh area ${coarseArea} must stay within the coarse screen-bound envelope`);
assert.ok(Math.abs(fineArea - expectedCircularSegmentArea) < 1.5, `fine mesh area ${fineArea} must approach the analytic circular-segment area ${expectedCircularSegmentArea}`);

const capped = refineRuntimeHatchFill(quarterCircle, {
  targetErrorCssPixels: 0.00001,
  unitsPerCssPixel: 0.5,
  maxTransformSingularValue: 1,
  maxCurveSegments: 8,
});
assert.equal(capped.status, "degraded");
assert.equal(capped.reason, "segment-cap");
assert.equal(capped.verticesWorld, null, "an unmet error bound must not return a replaceable partial mesh");

const patterned = refineRuntimeHatchFill({ ...quarterCircle, isSolid: false }, {
  targetErrorCssPixels: 0.25,
  unitsPerCssPixel: 0.5,
  maxTransformSingularValue: 1,
});
assert.equal(patterned.status, "degraded");
assert.equal(patterned.reason, "unsupported-pattern");

const malformed = refineRuntimeHatchFill({
  ...quarterCircle,
  loops: [{ isPolyline: false, edges: [{ type: "SPLINE" } as never] }],
}, {
  targetErrorCssPixels: 0.25,
  unitsPerCssPixel: 0.5,
  maxTransformSingularValue: 1,
});
assert.equal(malformed.status, "degraded", "malformed worker-side spline metadata must fail closed instead of throwing");
assert.equal(malformed.reason, "invalid-source");

console.log("✅ Bounded HATCH source remeshing meets CSS error targets, preserves analytic area, and fails closed on caps/patterns.");
