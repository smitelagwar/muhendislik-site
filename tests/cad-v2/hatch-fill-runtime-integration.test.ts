import assert from "node:assert/strict";
import type { CadCanonicalDocument, CadHatchEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { estimateSceneChunkGeometryBufferBytes } from "../../src/lib/cad-v2/render/curve-refinement-memory-accounting";
import {
  estimateHatchFillRefinementMinimumPeakResources,
  estimateHatchFillRefinementPeakResources,
} from "../../src/lib/cad-v2/render/hatch-fill-refinement-memory-accounting";
import {
  applyRuntimeHatchFillRefinementToChunk,
  refineRuntimeHatchFill,
  type RuntimeHatchFillSource,
} from "../../src/lib/cad-v2/worker/hatch-fill-refinement";
import { unpackSceneChunk } from "../../src/workers/cad-v2/cad-v2-scene-worker";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

const baseEntity = {
  type: "HATCH" as const,
  layer: "FILL",
  patternName: "SOLID",
  isSolid: true,
  solidFill: true,
  hatchStyle: 0,
  loops: [{
    isPolyline: false,
    isClosed: true,
    edges: [
      { type: "ARC" as const, center: [0, 0] as [number, number], radius: 10, startAngleRad: 0, endAngleRad: Math.PI / 2, ccw: true },
      { type: "LINE" as const, start: [0, 10] as [number, number], end: [10, 0] as [number, number] },
    ],
  }],
};
const doc: CadCanonicalDocument = {
  sourceVersionKey: "l08-hatch-runtime-integration",
  sourceSha256: "l08-hatch-runtime-integration",
  acadVersion: "AC1032",
  codepage: "UTF-8",
  measurement: 1,
  units: 4,
  layers: { FILL: { id: "FILL", name: "FILL", visible: true, frozen: false, locked: false,
    color: { method: "rgb", rgb: [0, 180, 210] }, lineweightMm: 0, linetypeName: "CONTINUOUS" } },
  linetypes: {}, textStyles: {}, blocks: {},
  layouts: { Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [0, 0, 20, 20] } },
  viewports: {}, paperSpaceEntities: {}, diagnostics: [],
  modelSpaceEntities: [
    { ...baseEntity, handle: "H1", order: 1n },
    { ...baseEntity, handle: "H2", order: 2n, loops: [{ ...baseEntity.loops[0]!, edges: [
      { type: "ARC" as const, center: [20, 0] as [number, number], radius: 10, startAngleRad: 0, endAngleRad: Math.PI / 2, ccw: true },
      { type: "LINE" as const, start: [20, 10] as [number, number], end: [30, 0] as [number, number] },
    ] }] },
  ] as CadHatchEntity[],
};

const compiled = compileCanonicalToScene(doc, { sceneId: "scene_l08_hatch_runtime", layoutId: "Model" });
const chunkRef = compiled.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
assert.ok(chunkRef, "compiler emitted a model chunk");
const chunkBytes = compiled.chunks.get(chunkRef.chunkId);
assert.ok(chunkBytes, "compiler emitted encoded chunk bytes");
const chunk = unpackSceneChunk(chunkRef.chunkId, chunkBytes);
const sources = chunk.meta?.hatchFillSources as Array<{ sourceId: string; source: RuntimeHatchFillSource }> | undefined;
assert.equal(sources?.length, 2, "direct solid HATCH loops are carried in bounded chunk metadata");
const hatchCommands = (chunk.meta?.drawCommands as Array<{ kind: string; hatchSourceId?: string; firstVertex: number; vertexCount: number }>).filter((command) => command.hatchSourceId);
assert.equal(hatchCommands.length, 2, "each source HATCH has one isolated triangle draw command");
assert.ok(chunk.trianglesArray && chunk.trianglesArray.length > 0);

const initialTriangleArray = chunk.trianglesArray;
let replacement = chunk;
let totalResultBytes = 0;
let maxErrorWorld = 0;
for (const entry of sources!) {
  const result = refineRuntimeHatchFill(entry.source, {
    targetErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.5,
    maxTransformSingularValue: 1,
  });
  assert.equal(result.status, "refined");
  assert.ok(result.verticesWorld instanceof Float64Array);
  const applied = applyRuntimeHatchFillRefinementToChunk(replacement, entry.sourceId, result);
  replacement = applied.chunk;
  totalResultBytes += result.verticesWorld!.byteLength;
  maxErrorWorld = Math.max(maxErrorWorld, applied.encodedErrorWorld);
}
assert.notEqual(replacement, chunk, "replacement is built without mutating the accepted source chunk");
assert.notEqual(replacement.trianglesArray, initialTriangleArray, "renderer receives a fresh triangle buffer");
assert.deepEqual(chunk.trianglesArray, initialTriangleArray, "source geometry remains immutable");
assert.ok(maxErrorWorld <= 0.25 * 0.5, "boundary plus Float32 chunk-local encoding meets the requested world error");
const replacementCommands = replacement.meta?.drawCommands as Array<{ kind: string; firstVertex: number; vertexCount: number; globalOrderIndex?: number; hatchSourceId?: string }>;
assert.equal(replacementCommands.filter((command) => command.hatchSourceId).length, 2);
assert.deepEqual(replacementCommands.filter((command) => command.hatchSourceId).map((command) => command.globalOrderIndex),
  hatchCommands.map((command) => replacementCommands.find((candidate) => candidate.hatchSourceId === command.hatchSourceId)?.globalOrderIndex));
assert.deepEqual(replacement.meta?.triangleRuns?.map((run: { firstVertex: number; vertexCount: number }) => [run.firstVertex, run.vertexCount]),
  replacementCommands.filter((command) => command.kind !== "line").map((command) => [command.firstVertex, command.vertexCount]));

const replacementGeometry = estimateSceneChunkGeometryBufferBytes(replacement);
const sourceGeometry = estimateSceneChunkGeometryBufferBytes(chunk);
assert.ok(replacementGeometry && sourceGeometry);
const retainedSourceBytes = chunk.xyArray.byteLength + chunk.trianglesArray!.byteLength + JSON.stringify(chunk.meta).length * 2;
const peak = estimateHatchFillRefinementPeakResources({
  replacement,
  resultBytes: totalResultBytes,
  rendererResources: { cpuResidentBytes: sourceGeometry.cpuResidentBytes, gpuBufferBytesEstimate: sourceGeometry.gpuBufferBytesEstimate },
  replacedChunkResources: sourceGeometry,
  retainedRefinementSourceBytes: retainedSourceBytes,
  cpuBudgetBytes: 64 * 1024 * 1024,
  gpuBudgetBytes: 64 * 1024 * 1024,
});
assert.equal(peak.budget.withinBudget, true, "replacement preflight admits a bounded, sparse HATCH remesh");
const minimumPeak = estimateHatchFillRefinementMinimumPeakResources({
  rendererResources: sourceGeometry,
  replacedChunkResources: sourceGeometry,
  retainedRefinementSourceBytes: retainedSourceBytes,
  cpuBudgetBytes: peak.budget.cpuResidentBytes,
  gpuBudgetBytes: peak.budget.gpuBufferBytesEstimate,
});
assert.equal(minimumPeak.budget.withinBudget, true,
  "pre-worker HATCH lower bound admits a replacement whose measured old+new peak fits");
assert.ok(minimumPeak.budget.cpuResidentBytes <= peak.budget.cpuResidentBytes,
  "pre-worker HATCH CPU lower bound cannot exceed the measured replacement peak");
assert.ok(minimumPeak.budget.gpuBufferBytesEstimate <= peak.budget.gpuBufferBytesEstimate,
  "pre-worker HATCH GPU lower bound cannot exceed the measured replacement peak");
assert.equal(estimateHatchFillRefinementMinimumPeakResources({
  rendererResources: sourceGeometry,
  replacedChunkResources: sourceGeometry,
  retainedRefinementSourceBytes: retainedSourceBytes,
  cpuBudgetBytes: minimumPeak.budget.cpuResidentBytes - 1,
  gpuBudgetBytes: minimumPeak.budget.gpuBufferBytesEstimate,
}).budget.withinBudget, false, "pre-worker HATCH lower bound rejects known resident CPU over-budget state");
assert.equal(estimateHatchFillRefinementMinimumPeakResources({
  rendererResources: sourceGeometry,
  replacedChunkResources: sourceGeometry,
  retainedRefinementSourceBytes: retainedSourceBytes,
  cpuBudgetBytes: minimumPeak.budget.cpuResidentBytes,
  gpuBudgetBytes: minimumPeak.budget.gpuBufferBytesEstimate - 1,
}).budget.withinBudget, false, "pre-worker HATCH lower bound rejects known resident GPU over-budget state");
assert.equal(estimateHatchFillRefinementMinimumPeakResources({
  rendererResources: sourceGeometry,
  replacedChunkResources: null,
  retainedRefinementSourceBytes: retainedSourceBytes,
}).budget.withinBudget, false, "pre-worker HATCH accounting fails closed without replaced chunk ownership data");
const rejectedPeak = estimateHatchFillRefinementPeakResources({
  replacement,
  resultBytes: totalResultBytes,
  rendererResources: { cpuResidentBytes: sourceGeometry.cpuResidentBytes, gpuBufferBytesEstimate: sourceGeometry.gpuBufferBytesEstimate },
  replacedChunkResources: sourceGeometry,
  retainedRefinementSourceBytes: 0,
  cpuBudgetBytes: 1,
  gpuBudgetBytes: 1,
});
assert.equal(rejectedPeak.budget.withinBudget, false, "replacement preflight fails closed at a CPU/GPU cap");

function chunkMeta(bytes: Uint8Array): Record<string, unknown> {
  const section = parseSceneChunk(bytes).sections.get(SceneTag.META);
  assert.ok(section?.data instanceof Uint8Array);
  return JSON.parse(new TextDecoder().decode(section.data));
}

const nestedDocument: CadCanonicalDocument = {
  ...doc,
  sourceVersionKey: "l08-hatch-nested-source",
  sourceSha256: "l08-hatch-nested-source",
  blocks: { FILL_BLOCK: { name: "FILL_BLOCK", basePoint: [0, 0], entities: [
    { ...baseEntity, handle: "NESTED_HATCH", order: 1n },
  ] } },
  modelSpaceEntities: [{ handle: "INSERT_HATCH", type: "INSERT", layer: "FILL", order: 2n,
    blockName: "FILL_BLOCK", insertionPoint: [5, 5], scale: [-2, 1, 1], rotationRad: 0 }],
};
const nestedScene = compileCanonicalToScene(nestedDocument, { sceneId: "scene_l08_nested_hatch", layoutId: "Model" });
const nestedChunkRef = nestedScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
assert.ok(nestedChunkRef);
const nestedMeta = chunkMeta(nestedScene.chunks.get(nestedChunkRef.chunkId)!);
assert.equal(nestedMeta.hatchFillSources, undefined, "nested mirrored INSERT is not advertised as untransformed source geometry");

const viewportDocument: CadCanonicalDocument = {
  ...doc,
  sourceVersionKey: "l08-hatch-viewport-source",
  sourceSha256: "l08-hatch-viewport-source",
  layouts: { ...doc.layouts,
    Sheet: { id: "Sheet", name: "Sheet", isModelSpace: false, bbox: [0, 0, 20, 20], viewportIds: ["VP1"] } },
  viewports: { VP1: { id: "VP1", layoutId: "Sheet", order: 1n, center: [10, 10], width: 20, height: 20,
    viewCenter: [5, 5], viewHeight: 10, frozenLayers: [] } },
};
const viewportScene = compileCanonicalToScene(viewportDocument, { sceneId: "scene_l08_viewport_hatch", layoutId: "Sheet" });
const viewportChunkRef = viewportScene.manifest.chunks.find((chunk) => chunk.layoutId === "Sheet");
assert.ok(viewportChunkRef);
const viewportMeta = chunkMeta(viewportScene.chunks.get(viewportChunkRef.chunkId)!);
assert.equal(viewportMeta.hatchFillSources, undefined, "viewport-projected geometry does not retain model WCS loops as if they were paper-space source");
assert.equal((viewportMeta.drawCommands as Array<{ hatchSourceId?: string }>).some((command) => command.hatchSourceId), false);

console.log("L08 HATCH source metadata → worker-ready remesh → Float32 error check → atomic draw-command replacement → peak budget PASS; nested/viewport sources fail closed");
