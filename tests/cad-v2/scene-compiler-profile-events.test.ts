import assert from "node:assert/strict";
import type { CadCanonicalDocument, CadLineEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { CAD_V2_COMPILER_REVISION } from "../../src/lib/cad-v2/version";
import { unpackSceneChunk } from "../../src/workers/cad-v2/cad-v2-scene-worker";

const document: CadCanonicalDocument = {
  sourceVersionKey: "scene-compiler-profile-parity-v1",
  sourceSha256: "profile-parity-fixture",
  acadVersion: "AC1032",
  codepage: "UTF-8",
  measurement: 1,
  units: 4,
  layers: {
    "0": {
      id: "0",
      name: "0",
      visible: true,
      frozen: false,
      locked: false,
      color: { method: "aci", aci: 7 },
      lineweightMm: 0,
      linetypeName: "CONTINUOUS",
    },
  },
  linetypes: {},
  textStyles: {},
  blocks: {},
  layouts: {
    Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [0, 0, 40, 30] },
  },
  viewports: {},
  diagnostics: [],
  modelSpaceEntities: [
    { type: "LINE", handle: "L3", layer: "0", order: 30n, start: [30, 0], end: [30, 30] },
    { type: "LINE", handle: "L1", layer: "0", order: 10n, start: [0, 0], end: [0, 30] },
    { type: "LINE", handle: "L5", layer: "0", order: 50n, start: [10, 30], end: [30, 30] },
    { type: "LINE", handle: "L2", layer: "0", order: 20n, start: [0, 0], end: [30, 0] },
    { type: "LINE", handle: "L4", layer: "0", order: 40n, start: [10, 0], end: [10, 30] },
  ] as CadLineEntity[],
};

const expectedPhases = [
  "compile-start",
  "primitive-emission-complete",
  "painter-order-complete",
  "partition-complete",
  "chunk-encoding-complete",
  "manifest-ready",
] as const;

const unobserved = compileCanonicalToScene(document, {
  sceneId: "profile-parity-scene",
  layoutId: "Model",
  maxPrimitivesPerChunk: 2,
});
const omittedOptions = compileCanonicalToScene(document);
const explicitDefaults = compileCanonicalToScene(document, { layoutId: "Model" });
const observedEvents: Array<{ phase: string; [key: string]: unknown }> = [];
const observed = compileCanonicalToScene(document, {
  sceneId: "profile-parity-scene",
  layoutId: "Model",
  maxPrimitivesPerChunk: 2,
  onProfileEvent: (event) => observedEvents.push(event),
});
const groupedCommandOutput = compileCanonicalToScene(document, {
  sceneId: "draw-command-order-span-scene",
  layoutId: "Model",
  maxPrimitivesPerChunk: 5,
});
assert.equal(groupedCommandOutput.manifest.compilerVersion, CAD_V2_COMPILER_REVISION,
  "serialized draw-command metadata changes invalidate prior durable compiler artifacts");
const groupedChunks = [...groupedCommandOutput.chunks].map(([chunkId, chunkBytes]) => unpackSceneChunk(chunkId, chunkBytes));
const groupedChunk = groupedChunks[0]!;
const groupedCommands = groupedChunks.flatMap((chunk) => chunk.meta?.drawCommands ?? []);
assert.equal(groupedCommands.length, 5,
  "same-style commands with distinct painter ranks remain separate depth instances");
assert.deepEqual(groupedCommands.map((command) => [
  command.globalOrderIndex,
  command.globalOrderEndIndex,
]).sort(([left], [right]) => Number(left) - Number(right)), [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]],
"spatial chunk order may vary, while each source entity retains its exact painter rank for depth-tested rendering");
assert.equal(groupedChunk.meta?.globalOrderMax, 4,
  "scene order metadata retains ordering between distinct source entities");
const groupedRenderableVertexCount = groupedChunk.xyArray.length / 2 + (groupedChunk.trianglesArray?.length ?? 0) / 2;
assert.equal(groupedCommandOutput.manifest.chunks[0]?.renderableVertexCount, groupedRenderableVertexCount,
  "manifest drawable vertex count equals the compiler's exact encoded line and triangle vertex count");
const groupedIndex = JSON.parse([...groupedCommandOutput.indexFiles!.values()][0]!);
assert.equal(groupedIndex.chunks[0]?.renderableVertexCount, groupedRenderableVertexCount,
  "immutable scene index carries the visual-complexity hint used before chunk fetch");

const curveDocument: CadCanonicalDocument = {
  ...document,
  sourceVersionKey: "painter-rank-single-curve-v1",
  modelSpaceEntities: [{
    type: "CIRCLE",
    handle: "CIRCLE-RANK",
    layer: "0",
    order: 10n,
    center: [0, 0],
    radius: 100,
  }] as CadCanonicalDocument["modelSpaceEntities"],
};
const curveEvents: Array<{ phase: string; primitiveCount?: number; painterOrderRunCount?: number }> = [];
const curveOutput = compileCanonicalToScene(curveDocument, {
  sceneId: "painter-rank-single-curve",
  onProfileEvent: (event) => curveEvents.push(event),
});
assert.equal(curveOutput.manifest.chunks.length, 1, "the bounded circle fixture stays in one spatial chunk");
const curveChunk = unpackSceneChunk(curveOutput.manifest.chunks[0]!.chunkId, [...curveOutput.chunks.values()][0]!);
const curveOrderEvent = curveEvents.find((event) => event.phase === "painter-order-complete");
assert.ok(curveOrderEvent!.primitiveCount! > 1,
  "the circle fixture contains multiple tessellated source primitives before painter-rank compaction");
assert.equal(curveOrderEvent!.painterOrderRunCount, 1,
  "one entity's tessellation is represented by one painter-order run");
assert.equal(curveChunk.meta?.drawCommands?.[0]?.globalOrderIndex, 0,
  "one source curve begins at painter rank zero");
assert.equal(curveChunk.meta?.drawCommands?.[0]?.globalOrderEndIndex, 0,
  "same-source curve tessellation shares one safe painter rank");
assert.equal(curveChunk.meta?.globalOrderMax, 0,
  "tessellation density does not inflate the depth range when the scene has one painter group");

assert.deepEqual(observedEvents.map((event) => event.phase), expectedPhases, "all six phase events have a stable order");
assert.ok(observedEvents.every((event) => event.layoutId === "Model" && event.modelSourceEntityCount === 5));
const primitiveEvent = observedEvents[1]!;
const partitionEvent = observedEvents[3]!;
const encodingEvent = observedEvents[4]!;
const manifestEvent = observedEvents[5]!;
assert.equal(primitiveEvent.primitiveCount, 5);
assert.deepEqual(primitiveEvent.primitiveCountByEntityType, { LINE: 5 });
assert.deepEqual(primitiveEvent.maximumPrimitiveSourceEntity, { entityType: "LINE", count: 1 });
assert.equal(observedEvents[2]!.painterSortApplied, true, "the deliberately shuffled source fixture exercises the painter sort");
assert.equal(observedEvents[2]!.sourceEntitySortApplied, true, "shuffled model entities are ordered before primitive expansion");
assert.equal(observedEvents[2]!.primitiveSortApplied, false, "ordered source entities avoid sorting the expanded primitive array");
assert.equal(partitionEvent.partitionedPrimitiveCount, primitiveEvent.primitiveCount);
assert.equal(partitionEvent.partitionRangeCount, observed.chunks.size);
const actualChunkBytes = [...observed.chunks.values()].reduce((sum, bytes) => sum + bytes.byteLength, 0);
assert.equal(encodingEvent.encodedChunkCount, observed.chunks.size);
assert.equal(encodingEvent.encodedChunkBytes, actualChunkBytes);
assert.equal(manifestEvent.encodedChunkCount, observed.manifest.chunks.length);
assert.equal(manifestEvent.encodedChunkBytes, actualChunkBytes);

function withoutCreatedAt<T extends { createdAt: string }>(manifest: T): Omit<T, "createdAt"> {
  const stable = { ...manifest };
  delete (stable as Partial<T>).createdAt;
  return stable;
}

const observedStableManifest = withoutCreatedAt(observed.manifest);
const unobservedStableManifest = withoutCreatedAt(unobserved.manifest);
assert.deepEqual(observedStableManifest, unobservedStableManifest, "observer does not change manifest output");
assert.deepEqual([...observed.chunks], [...unobserved.chunks], "observer does not change encoded chunk bytes");
assert.deepEqual([...observed.indexFiles], [...unobserved.indexFiles], "observer does not change index output");
assert.deepEqual([...observed.metadataFiles], [...unobserved.metadataFiles], "observer does not change metadata output");
assert.equal(omittedOptions.manifest.chunks.length, explicitDefaults.manifest.chunks.length,
  "omitting all compiler options preserves the default Model compile path");

console.log("scene compiler profile observer parity PASS");
