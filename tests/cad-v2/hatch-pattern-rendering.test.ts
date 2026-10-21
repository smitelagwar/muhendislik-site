import assert from "node:assert/strict";
import type { CadCanonicalDocument, CadHatchEntity } from "../../src/lib/cad-v2/canonical/types";
import { buildHatchPatternSegments } from "../../src/lib/cad-v2/compile/hatch-pattern-geometry";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import {
  getDxfRenderablePatternAngleDegrees,
  mapHatchPatternLines,
  radiansToPatternAngleDegrees,
} from "../../src/lib/cad-v2/decode/hatch-pattern-record";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

const hatch = {
  type: "HATCH",
  handle: "HATCH_PATTERN_GEOMETRY_01",
  layer: "PATTERN",
  order: 1n,
  patternName: "ANSI31",
  isSolid: false,
  solidFill: false,
  patternScale: 2,
  patternAngleDeg: 90,
  hatchStyle: 0,
  loops: [{ isPolyline: true, isClosed: true, vertices: [[0, 0], [20, 0], [20, 12], [0, 12]] }],
  patternLines: [{ angleRad: 0, base: [1, 0], offset: [0, 2], dashLengths: [] }],
} as unknown as CadHatchEntity;

const document: CadCanonicalDocument = {
  sourceVersionKey: "l08-hatch-pattern-rendering",
  sourceSha256: "l08-hatch-pattern-rendering",
  acadVersion: "AC1032",
  codepage: "UTF-8",
  measurement: 1,
  units: 4,
  layers: { PATTERN: { id: "PATTERN", name: "PATTERN", visible: true, frozen: false, locked: false,
    color: { method: "rgb", rgb: [240, 240, 240] }, lineweightMm: 0, linetypeName: "CONTINUOUS" } },
  linetypes: {},
  textStyles: {},
  blocks: {},
  layouts: { Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [0, 0, 20, 12] } },
  viewports: {},
  paperSpaceEntities: {},
  diagnostics: [],
  modelSpaceEntities: [hatch],
};

const scene = compileCanonicalToScene(document, { sceneId: "scene_l08_hatch_pattern_rendering", layoutId: "Model" });
const chunkRef = scene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
assert.ok(chunkRef);
const chunkBytes = scene.chunks.get(chunkRef.chunkId);
assert.ok(chunkBytes);
const parsed = parseSceneChunk(chunkBytes);
const metaBytes = parsed.sections.get(SceneTag.META)?.data;
const xyData = parsed.sections.get(SceneTag.XY)?.data;
const originData = parsed.sections.get(SceneTag.ORIGIN)?.data;
assert.ok(metaBytes instanceof Uint8Array);
assert.ok(xyData instanceof Float32Array);
assert.ok(originData instanceof Float64Array);
const meta = JSON.parse(new TextDecoder().decode(metaBytes)) as {
  drawCommands?: Array<{ kind: string; firstVertex: number; vertexCount: number }>;
};

const lineCommands = meta.drawCommands?.filter((command) => command.kind === "line") ?? [];
const lineVertexCount = lineCommands.reduce((sum, command) => sum + command.vertexCount, 0);
assert.ok(lineVertexCount > 8, "the supported pattern must add bounded line segments beyond the four retained boundary edges");
assert.ok(!meta.drawCommands?.some((command) => command.kind === "triangle"),
  "pattern fill must never be represented as a solid triangle mesh");
assert.equal(scene.manifest.qualityStatus, "degraded", "pattern rendering stays degraded until native parity is independently accepted");
assert.ok(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("HATCH_PATTERN_NATIVE_PARITY_UNVERIFIED"),
  "pattern rendering must expose the unverified native-parity boundary");

const patternVertices = lineCommands.flatMap((command) => {
  const start = command.firstVertex * 2;
  const end = start + command.vertexCount * 2;
  return Array.from(xyData.subarray(start, end));
});
assert.ok(patternVertices.every(Number.isFinite), "pattern and boundary vertices remain finite Float32 scene geometry");
assert.ok(patternVertices.every((coordinate, index) => index % 2 === 0
  ? coordinate + originData[0]! >= -1e-4 && coordinate + originData[0]! <= 20.0001
  : coordinate + originData[1]! >= -1e-4 && coordinate + originData[1]! <= 12.0001), "pattern segments are clipped to the HATCH boundary bounds after restoring the chunk origin");

const hatchRings = [[[0, 0], [20, 0], [20, 12], [0, 12]], [[8, 4], [12, 4], [12, 8], [8, 8]]] as const;
const holeGeometry = buildHatchPatternSegments({
  ...hatch,
  patternAngleDeg: 0,
  patternLines: [{ angleRad: 0, base: [0, 0], offset: [0, 2], dashLengths: [] }],
}, hatchRings.map((ring) => ring.map(([x, y]) => [x, y] as [number, number])));
assert.equal(holeGeometry.status, "rendered", "bounded continuous pattern lines support validated outer and inner loops");
const throughHoleLine = holeGeometry.segments.filter((segment) => Math.abs(segment.y0 - 6) < 1e-8 && Math.abs(segment.y1 - 6) < 1e-8);
assert.deepEqual(throughHoleLine.map(({ x0, x1 }) => [x0, x1]), [[0, 8], [12, 20]],
  "odd-even clipping leaves the inner HATCH hole unpainted");

const diagonalGeometry = buildHatchPatternSegments({
  ...hatch,
  patternAngleDeg: 0,
  patternLines: [{ angleRad: Math.PI / 4, base: [0, 0], offset: [0, 4], dashLengths: [] }],
}, [[[0, 0], [20, 0], [20, 20], [0, 20]]]);
assert.equal(diagonalGeometry.status, "rendered", "continuous diagonal PAT families use their perpendicular delta-y spacing");
const diagonalNormal: [number, number] = [-Math.SQRT1_2, Math.SQRT1_2];
const diagonalOffsets = diagonalGeometry.segments
  .map((segment) => ((segment.x0 + segment.x1) / 2) * diagonalNormal[0] + ((segment.y0 + segment.y1) / 2) * diagonalNormal[1])
  .sort((a, b) => a - b);
assert.ok(diagonalOffsets.length >= 5 && diagonalOffsets.every((offset, index) => index === 0 || Math.abs(offset - diagonalOffsets[index - 1]! - 4) < 1e-8),
  "rotated PAT rows retain their specified perpendicular spacing instead of projecting the delta-y twice");

const translatedGeometry = buildHatchPatternSegments({
  ...hatch,
  patternAngleDeg: 0,
  patternLines: [{ angleRad: 0, base: [1_000_000_000, 1_000_000_000], offset: [0, 2], dashLengths: [] }],
}, [[[1_000_000_000, 1_000_000_000], [1_000_000_020, 1_000_000_000],
  [1_000_000_020, 1_000_000_012], [1_000_000_000, 1_000_000_012]]]);
assert.equal(translatedGeometry.status, "rendered", "pattern clipping remains bounded for a small drawing at a large world coordinate");
assert.ok(translatedGeometry.segments.every((segment) =>
  [segment.x0, segment.y0, segment.x1, segment.y1].every(Number.isFinite) &&
  segment.x0 >= 1_000_000_000 - 1e-5 && segment.x1 <= 1_000_000_020 + 1e-5 &&
  segment.y0 >= 1_000_000_000 - 1e-5 && segment.y1 <= 1_000_000_012 + 1e-5),
"pattern clipping uses local projections instead of an origin-centered radius");

const missingDashArray = mapHatchPatternLines([{ angle: 0, base: { x: 0, y: 0 }, offset: { x: 0, y: 2 } }]);
assert.ok(missingDashArray);
assert.equal(missingDashArray[0]?.dashLengths, undefined, "a missing dash array is not silently promoted to a continuous line");
assert.equal(buildHatchPatternSegments({ ...hatch, patternLines: missingDashArray }, [[[0, 0], [20, 0], [20, 12], [0, 12]]]).status,
  "unsupported", "missing pattern fields fail closed instead of inventing geometry");
const mappedDefinition = mapHatchPatternLines([{
  angle: Math.PI / 4, base: { x: 2, y: 3 }, offset: { x: 4, y: 5 }, dashLengths: [6, -2],
}]);
assert.deepEqual(mappedDefinition, [{ angleRad: Math.PI / 4, base: [2, 3], offset: [4, 5], dashLengths: [6, -2] }],
  "decoder definition-line fields preserve source angle, base, offset, and dash data");
assert.equal(radiansToPatternAngleDegrees(Math.PI / 2), 90, "DWG's radian pattern angle normalizes to degrees");
assert.equal(getDxfRenderablePatternAngleDegrees({ patternAngle: Math.PI / 2 }, 0), 90,
  "predefined DXF rows inherit the entity pattern angle");
assert.equal(getDxfRenderablePatternAngleDegrees({ patternAngle: Math.PI / 2 }, 1), 0,
  "explicit DXF definition rows do not receive entity rotation twice");
assert.equal(buildHatchPatternSegments({
  ...hatch,
  patternLines: [{ angleRad: 0, base: [0, 0], offset: [0, 2], dashLengths: [3, -2] }],
}, [[[0, 0], [20, 0], [20, 12], [0, 12]]]).status,
"unsupported", "dashed pattern semantics remain explicitly unsupported");
assert.equal(buildHatchPatternSegments({
  ...hatch,
  patternAngleDeg: 0,
  patternLines: [{ angleRad: 0, base: [0, 0], offset: [0, 1], dashLengths: [] }],
}, [[[0, 0], [20, 0], [20, 5_000], [0, 5_000]]]).status,
"limit", "a pattern family that exceeds its bounded line budget fails closed");
const highEdgeCountRing = Array.from({ length: 16_384 }, (_, index): [number, number] => {
  const angle = index * Math.PI * 2 / 16_384;
  return [Math.cos(angle) * 10, Math.sin(angle) * 10];
});
assert.equal(buildHatchPatternSegments({
  ...hatch,
  patternAngleDeg: 0,
  patternLines: [{ angleRad: 0, base: [0, 0], offset: [0, 0.025], dashLengths: [] }],
}, [highEdgeCountRing]).status,
"limit", "line-family × boundary-edge work above the explicit intersection budget fails closed");

console.log("L08 bounded patterned HATCH geometry, decoder normalization, perpendicular PAT spacing, entity rotation, high-origin clipping, hole parity, fail-closed dash handling, and explicit degraded quality PASS");
