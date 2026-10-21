import assert from "node:assert/strict";
import type { CadCanonicalDocument, CadLwPolylineEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { tessellateDashedArc } from "../../src/lib/cad-v2/render/cad-stroke";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

const radius = 50;
const dotArc = tessellateDashedArc([0, 0], radius, 0, Math.PI, false,
  [10, -5, 0, -5], 1);
const dots = dotArc.segments.filter((segment) => segment.isDot);
assert.ok(dots.length >= 7, "arc emits the expected dot terms");
for (const dot of dots) {
  assert.ok(Math.hypot(dot.x1 - dot.x0, dot.y1 - dot.y0) > 0,
    "every arc dot has a WebGL-rasterizable tangent extent");
  assert.ok(Math.abs(Math.hypot(dot.x0, dot.y0) - radius) < 1e-9);
}

const polyline: CadLwPolylineEntity = {
  type: "LWPOLYLINE", handle: "BULGE_CLOSED", layer: "0", order: BigInt(1),
  vertices: [{ x: 0, y: 0, bulge: 1 }, { x: 100, y: 0 }, { x: 100, y: 100 }],
  isClosed: true, plinegen: true, lineweightMm: 0, linetype: "DASH",
};
const document: CadCanonicalDocument = {
  sourceVersionKey: "analytic-bulge-dash", sourceSha256: "analytic-bulge-dash",
  acadVersion: "AC1032", codepage: "UTF-8", units: 4, measurement: 1,
  layers: { "0": { id: "0", name: "0", visible: true, frozen: false, locked: false,
    color: { method: "aci", aci: 7 }, lineweightMm: 0, linetypeName: "DASH" } },
  linetypes: { DASH: { id: "DASH", name: "DASH", pattern: [10, -10], totalLength: 20 } },
  textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {},
  diagnostics: [], modelSpaceEntities: [polyline],
};
function distances(maxPrimitivesPerChunk?: number) {
  const scene = compileCanonicalToScene(document, {
    sceneId: `analytic_bulge_${maxPrimitivesPerChunk ?? "single"}`,
    maxPrimitivesPerChunk,
    maxCurveErrorWorld: 5,
  });
  return scene.manifest.chunks.flatMap((ref) => {
    const section = parseSceneChunk(scene.chunks.get(ref.chunkId)!).sections.get(SceneTag.PATH_DISTANCE);
    return Array.from(section?.data as Float32Array ?? []);
  });
}
const single = distances();
const split = distances(1);
assert.deepEqual(split, single, "analytic bulge and closed-edge phase survives primitive chunk partitioning");
assert.ok(single.length > 20);
assert.equal(single[0], 0);
const firstDashEnd = single.find((distance) => distance > 0);
assert.ok(Math.abs(firstDashEnd! - 10) < 1e-4,
  "first bulge dash ends at ten units of analytic arc length");
const firstFollowingDash = single.find((distance) => distance >= 20 - 1e-4);
assert.ok(Math.abs(firstFollowingDash! - 20) < 1e-4,
  "second bulge dash begins at twenty units of analytic arc length");
assert.ok(single.some((distance) => distance >= Math.PI * radius && distance < Math.PI * radius + 10),
  "phase continues over the bulge-to-line corner using the true arc length");
assert.ok(single.at(-1)! > Math.PI * radius + 100,
  "closed edge participates after bulge and second edge");
console.log(`PASS: analytic bulge phase, closed edge and dot arcs; vertices=${single.length}, dots=${dots.length}`);
