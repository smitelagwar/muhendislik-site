import assert from "node:assert/strict";
import type { CadCanonicalDocument, CadHatchEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { GeometryCompiler } from "../../src/lib/cad-v2/compile/geometry-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

const hatch: CadHatchEntity = {
  type: "HATCH",
  handle: "PATTERNED_HATCH_01",
  layer: "PATTERN",
  order: 1n,
  patternName: "ANSI31",
  isSolid: false,
  solidFill: false,
  patternScale: 2.5,
  patternAngleDeg: 37,
  hatchStyle: 0,
  loops: [{
    isPolyline: true,
    isClosed: true,
    vertices: [[0, 0], [20, 0], [20, 12], [0, 12]],
  }],
};

const document: CadCanonicalDocument = {
  sourceVersionKey: "l08-patterned-hatch-fail-closed",
  sourceSha256: "l08-patterned-hatch-fail-closed",
  acadVersion: "AC1032",
  codepage: "UTF-8",
  measurement: 1,
  units: 4,
  layers: { PATTERN: { id: "PATTERN", name: "PATTERN", visible: true, frozen: false, locked: false,
    color: { method: "rgb", rgb: [255, 255, 255] }, lineweightMm: 0, linetypeName: "CONTINUOUS" } },
  linetypes: {},
  textStyles: {},
  blocks: {},
  layouts: { Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [0, 0, 20, 12] } },
  viewports: {},
  paperSpaceEntities: {},
  diagnostics: [],
  modelSpaceEntities: [hatch],
};

const scene = compileCanonicalToScene(document, { sceneId: "scene_l08_patterned_hatch", layoutId: "Model" });
const modelChunk = scene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
assert.ok(modelChunk, "patterned HATCH fixture compiles its model chunk");
const bytes = scene.chunks.get(modelChunk.chunkId);
assert.ok(bytes, "patterned HATCH fixture has encoded scene bytes");
const metaBytes = parseSceneChunk(bytes).sections.get(SceneTag.META)?.data;
assert.ok(metaBytes instanceof Uint8Array);
const meta = JSON.parse(new TextDecoder().decode(metaBytes)) as {
  drawCommands?: Array<{ kind: string }>;
};

assert.equal(scene.manifest.qualityStatus, "degraded", "unrendered pattern semantics must not be presented as exact");
assert.ok(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("UNSUPPORTED_HATCH_PATTERN"),
  "manifest explicitly identifies unsupported patterned HATCH rendering");
assert.ok(meta.drawCommands?.some((command) => command.kind === "line"), "closed HATCH boundary remains visible");
assert.ok(!meta.drawCommands?.some((command) => command.kind === "triangle"),
  "an unsupported ANSI31 pattern must not be silently rendered as a solid triangle fill");

const nestedDocument: CadCanonicalDocument = {
  ...document,
  sourceVersionKey: "l08-nested-patterned-hatch-fail-closed",
  sourceSha256: "l08-nested-patterned-hatch-fail-closed",
  blocks: { PATTERN_BLOCK: { name: "PATTERN_BLOCK", basePoint: [0, 0], entities: [hatch] } },
  modelSpaceEntities: [{
    type: "INSERT",
    handle: "PATTERN_INSERT_01",
    layer: "PATTERN",
    order: 2n,
    blockName: "PATTERN_BLOCK",
    insertionPoint: [100, 50],
    scale: [-1, 1, 1],
    rotationRad: 0,
  }],
};
const nestedScene = compileCanonicalToScene(nestedDocument, {
  sceneId: "scene_l08_nested_patterned_hatch",
  layoutId: "Model",
});
const nestedChunkRef = nestedScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
assert.ok(nestedChunkRef, "nested patterned HATCH fixture compiles its model chunk");
const nestedBytes = nestedScene.chunks.get(nestedChunkRef.chunkId);
assert.ok(nestedBytes, "nested patterned HATCH fixture has encoded scene bytes");
const nestedMetaBytes = parseSceneChunk(nestedBytes).sections.get(SceneTag.META)?.data;
assert.ok(nestedMetaBytes instanceof Uint8Array);
const nestedMeta = JSON.parse(new TextDecoder().decode(nestedMetaBytes)) as {
  drawCommands?: Array<{ kind: string }>;
};
assert.equal(nestedScene.manifest.qualityStatus, "degraded", "nested unsupported pattern must degrade the scene");
assert.ok(nestedScene.manifest.diagnosticsSummary.diagnosticCodes.includes("UNSUPPORTED_HATCH_PATTERN"),
  "nested visitor diagnostics must reach the scene manifest");
assert.ok(nestedMeta.drawCommands?.some((command) => command.kind === "line"),
  "nested patterned HATCH keeps its transformed boundary");
assert.ok(!nestedMeta.drawCommands?.some((command) => command.kind === "triangle"),
  "nested patterned HATCH must not become a solid fill after INSERT transform");

const bowTieHatch: CadHatchEntity = {
  ...hatch,
  handle: "SELF_INTERSECTING_HATCH_01",
  patternName: "SOLID",
  isSolid: true,
  solidFill: true,
  loops: [{
    isPolyline: true,
    isClosed: true,
    vertices: [[0, 0], [20, 12], [0, 12], [20, 0]],
  }],
};
const bowTieScene = compileCanonicalToScene({
  ...document,
  sourceVersionKey: "l08-self-intersecting-hatch-fail-closed",
  sourceSha256: "l08-self-intersecting-hatch-fail-closed",
  modelSpaceEntities: [bowTieHatch],
}, { sceneId: "scene_l08_self_intersecting_hatch", layoutId: "Model" });
const bowTieChunkRef = bowTieScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
assert.ok(bowTieChunkRef, "self-intersecting HATCH fixture compiles its model chunk");
const bowTieBytes = bowTieScene.chunks.get(bowTieChunkRef.chunkId);
assert.ok(bowTieBytes, "self-intersecting HATCH fixture has encoded scene bytes");
const bowTieMetaBytes = parseSceneChunk(bowTieBytes).sections.get(SceneTag.META)?.data;
assert.ok(bowTieMetaBytes instanceof Uint8Array);
const bowTieMeta = JSON.parse(new TextDecoder().decode(bowTieMetaBytes)) as {
  drawCommands?: Array<{ kind: string }>;
};
assert.equal(bowTieScene.manifest.qualityStatus, "degraded", "self-intersecting solid boundary must degrade scene quality");
assert.ok(bowTieScene.manifest.diagnosticsSummary.diagnosticCodes.includes("HATCH_BOUNDARY_INVALID"),
  "self-intersecting HATCH boundary must be explicit in the manifest");
assert.ok(bowTieMeta.drawCommands?.some((command) => command.kind === "line"),
  "invalid HATCH boundary remains available as an outline");
assert.ok(!bowTieMeta.drawCommands?.some((command) => command.kind === "triangle"),
  "self-intersecting HATCH must not produce a fabricated fill");

const nonFiniteBoundary = GeometryCompiler.triangulateHatch({
  ...bowTieHatch,
  handle: "NON_FINITE_HATCH_01",
  loops: [{ isPolyline: true, isClosed: true, vertices: [[0, 0], [Number.NaN, 1], [2, 0]] }],
});
assert.equal(nonFiniteBoundary.mesh, null, "non-finite HATCH boundaries must never reach triangulation output");
assert.equal(nonFiniteBoundary.boundaryLines.length, 0, "non-finite coordinates must not leak into boundary strokes");
assert.equal(nonFiniteBoundary.invalidBoundaryGeometry, true, "non-finite HATCH boundaries are classified as invalid");

const cappedBoundary = GeometryCompiler.triangulateHatch({
  ...bowTieHatch,
  handle: "CAPPED_HATCH_BOUNDARY_01",
  loops: [{ isPolyline: true, isClosed: true, vertices: Array.from({ length: 16_385 }, (_, index) => {
    const angle = index * Math.PI * 2 / 16_385;
    return [Math.cos(angle) * 10, Math.sin(angle) * 10] as [number, number];
  }) }],
});
assert.equal(cappedBoundary.mesh, null, "a boundary beyond its validation cap must not be triangulated");
assert.equal(cappedBoundary.boundaryValidationLimitReached, true, "boundary validation budget exhaustion has an explicit classification");

console.log("L08 patterned, self-intersecting, non-finite, and over-cap HATCH boundaries fail closed with explicit classification PASS");
