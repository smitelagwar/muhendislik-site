import assert from "node:assert/strict";
import * as THREE from "three";
import { CadV2Renderer } from "../../src/lib/cad-v2/render/cad-v2-renderer";
import { CadV2ResourceOwnershipLedger } from "../../src/lib/cad-v2/render/resource-ownership-ledger";
import { packCadV2PositionArray } from "../../src/lib/cad-v2/worker/position-compaction";
import { getCadV2PainterPageMaxStyles } from "../../src/lib/cad-v2/render/painter-page-capacity";

assert.equal(getCadV2PainterPageMaxStyles(2_048), 682,
  "a WebGL2 minimum texture height safely allows 682 line styles at three texels per style");
assert.equal(getCadV2PainterPageMaxStyles(4_096), 1_365,
  "the line-style capacity follows the actual context texture-height limit");
assert.equal(getCadV2PainterPageMaxStyles(16_384), 2_048,
  "large WebGL2 contexts use the bounded 2,048-style page ceiling");
assert.equal(getCadV2PainterPageMaxStyles(null), 512,
  "unknown context capability uses the conservative existing style capacity");

const renderer = Object.create(CadV2Renderer.prototype) as any;
renderer.scene = new THREE.Scene();
renderer.contentGroup = new THREE.Group();
renderer.cameraAdapter = { getState: () => ({ center: [0, 0], worldOrigin: [0, 0] }) };
renderer.loadedChunks = new Map();
renderer.cameraRelativeChunkIds = new Set();
renderer.nonPainterDepthChunkIds = new Set();
renderer.painterPagesGroup = new THREE.Group();
renderer.pendingPainterPageChunks = [];
renderer.painterRenderPages = new Set();
renderer.defaultWorldOrigin = [0, 0];
renderer.lastReportedSortObjects = null;
renderer.chunkBounds = new Map();
renderer.activeLayoutId = "Model";
renderer.layerVisibility = new Map();
renderer.isMonochrome = false;
renderer.isLineweight = false;
renderer.renderer = {
  sortObjects: true,
  setClearColor: (color: number, alpha: number) => { renderer.restoredClearColor = [color, alpha]; },
  getContext: () => ({
    getSupportedExtensions: () => ["WEBGL_multi_draw"],
    getExtension: (name: string) => name === "WEBGL_multi_draw" ? {} : null,
    getContextAttributes: () => ({ depth: true }),
  }),
};
renderer.isLightBackground = () => false;
renderer.invalidate = () => {};
renderer.resourceOwnershipLedger = new CadV2ResourceOwnershipLedger();
renderer.resourceOwnerScene = "scene-renderer-test";
renderer.resourceOwnerGeneration = 11;
renderer.backgroundColorHex = 0x050505;
renderer.reapplyBackgroundColorAfterContextRestore();
assert.deepEqual(renderer.restoredClearColor, [0x050505, 1],
  "WebGL restoration reapplies the currently selected CAD background instead of retaining the context default");

const promotedChunkGroup = new THREE.Group();
promotedChunkGroup.position.set(3, 4, 0);
const unpromotedChunkGroup = new THREE.Group();
unpromotedChunkGroup.position.set(3, 4, 0);
renderer.loadedChunks.set("promoted-page-chunk", {
  origin: [0, 0],
  group: promotedChunkGroup,
  painterPageChunk: { promoted: true },
});
renderer.loadedChunks.set("unpromoted-chunk", {
  origin: [0, 0],
  group: unpromotedChunkGroup,
});
const cameraRelativeChunkRecords = renderer.loadedChunks;
renderer.cameraRelativeChunkIds = new Set(["unpromoted-chunk"]);
Object.defineProperty(cameraRelativeChunkRecords, "values", {
  configurable: true,
  value: () => { throw new Error("camera offset update must not scan all loaded chunks"); },
});
renderer.updateCameraRelativeOffset([50, 25]);
assert.deepEqual(promotedChunkGroup.position.toArray(), [3, 4, 0],
  "camera motion does not rewrite a detached empty chunk group after its geometry has moved into painter pages");
assert.deepEqual(unpromotedChunkGroup.position.toArray(), [-50, -25, 0],
  "camera motion still updates chunk groups that remain in the scene");
assert.deepEqual(renderer.painterPagesGroup.position.toArray(), [-50, -25, 0],
  "the shared painter page group still follows the camera-relative offset");
renderer.loadedChunks = new Map();

function makeChunk(chunkId: string) {
  return {
    chunkId,
    origin: [0, 0],
    vertexCount: 2,
    xyArray: new Float32Array([0, 0, 1, 1]),
    drawRunsArray: null,
    trianglesArray: null,
    meta: { layoutId: "Model", layerRuns: [], drawCommands: [] },
  } as any;
}

function makeLineweightChunk(chunkId: string) {
  return {
    chunkId,
    origin: [0, 0],
    vertexCount: 2,
    xyArray: new Float32Array([0, 0, 10, 0]),
    drawRunsArray: null,
    trianglesArray: null,
    meta: {
      layoutId: "Model",
      drawCommands: [{ kind: "line", layer: "LWT", color: [1, 0, 0], firstVertex: 0, vertexCount: 2, lineweightMm: 0.5 }],
    },
  } as any;
}

function makeBatchedLineweightChunk(chunkId: string) {
  return {
    chunkId,
    origin: [0, 0],
    vertexCount: 4,
    xyArray: new Float32Array([0, 0, 10, 0, 0, 1, 10, 1]),
    drawRunsArray: null,
    trianglesArray: null,
    meta: {
      layoutId: "Model",
      drawCommands: [
        { kind: "line", layer: "LWT-A", color: [1, 0, 0], firstVertex: 0, vertexCount: 2, lineweightMm: 0.5, globalOrderIndex: 1 },
        { kind: "line", layer: "LWT-B", color: [0, 0, 1], firstVertex: 2, vertexCount: 2, lineweightMm: 0, globalOrderIndex: 2 },
      ],
    },
  } as any;
}

let geometryDisposals = 0;
let materialDisposals = 0;
renderer.addSceneChunk(makeChunk("chunk-1"));
assert.ok(renderer.cameraRelativeChunkIds.has("chunk-1"),
  "a newly loaded chunk joins the camera-relative transform set");
const firstGroup = renderer.loadedChunks.get("chunk-1").group;
firstGroup.children[0].geometry.addEventListener("dispose", () => geometryDisposals++);
firstGroup.children[0].material.addEventListener("dispose", () => materialDisposals++);
const firstSnapshot = renderer.getResourceOwnershipSnapshot();
assert.equal(firstSnapshot.length, 2, "renderer registers the chunk geometry and material as separately owned resources");
assert.ok(firstSnapshot.every((resource: any) => resource.owners[0].ownerScene === "scene-renderer-test" &&
  resource.owners[0].generation === 11 && resource.owners[0].chunkId === "chunk-1"),
"renderer records the host scene, generation, and chunk on each resource");
assert.deepEqual(renderer.getResourceMemoryEstimate(), {
  cpuResidentBytes: 16,
  gpuBufferBytesEstimate: 16,
  geometryCount: 1,
  loadedChunkCount: 1,
}, "2D CAD position attributes avoid a redundant zero-Z float while accounting stays tied to owned geometry bytes");
assert.equal(firstGroup.children[0].geometry.attributes.position.itemSize, 2,
  "CAD chunk line positions remain 2D attributes with implicit z=0");

renderer.removeSceneChunk("chunk-1");
assert.equal(renderer.cameraRelativeChunkIds.has("chunk-1"), false,
  "removed chunks leave the camera-relative transform set");
assert.equal(geometryDisposals, 1, "chunk removal disposes its geometry through the ownership ledger");
assert.equal(materialDisposals, 1, "chunk removal disposes its material through the ownership ledger");
assert.equal(renderer.getResourceOwnershipSnapshot().length, 0, "chunk removal drops its scene-generation ownership records");

renderer.addSceneChunk(makeChunk("chunk-old-generation"));
renderer.setResourceOwner("scene-renderer-next", 12);
assert.equal(renderer.loadedChunks.size, 0, "changing the owner generation clears old-generation renderer chunks");
assert.equal(renderer.getResourceOwnershipSnapshot().length, 0, "generation change leaves no old owner records");
renderer.addSceneChunk(makeChunk("chunk-new-generation"));
assert.ok(renderer.getResourceOwnershipSnapshot().every((resource: any) =>
  resource.owners[0].ownerScene === "scene-renderer-next" && resource.owners[0].generation === 12),
"new chunks are registered only under the new scene generation");
renderer.clearChunks();
assert.equal(renderer.getResourceOwnershipSnapshot().length, 0, "clearChunks releases every remaining ownership lease");

const pendingPageSource = new Float32Array([0, 0, 5, 0]);
const pendingPageGroup = new THREE.Group();
const pendingPageRecord = {
  lineSource: pendingPageSource,
  triangleSource: null,
  lineCommands: [],
  triangleCommands: [],
  origin: [0, 0],
  worldOrigin: [0, 0],
  globalOrderMax: 0,
};
const pendingPageMetadataBytes = JSON.stringify({
  lineCommands: pendingPageRecord.lineCommands,
  triangleCommands: pendingPageRecord.triangleCommands,
  origin: pendingPageRecord.origin,
  worldOrigin: pendingPageRecord.worldOrigin,
  positionCodec: undefined,
  globalOrderMax: pendingPageRecord.globalOrderMax,
}).length * 4 + 128;
renderer.loadedChunks.set("chunk-pending-page-source", {
  group: pendingPageGroup,
  painterPageChunk: pendingPageRecord,
});
assert.equal(renderer.getAdditionalRetainedChunkCpuBytes({ chunkId: "chunk-pending-page-source" } as any),
  pendingPageSource.byteLength + pendingPageMetadataBytes,
  "pending painter-page buffers and their metadata outside geometry ownership remain in the resident estimate");
const pendingPageGeometry = new THREE.BufferGeometry();
pendingPageGeometry.setAttribute("position", new THREE.BufferAttribute(pendingPageSource, 2));
pendingPageGroup.add(new THREE.LineSegments(pendingPageGeometry, new THREE.LineBasicMaterial()));
assert.equal(renderer.getAdditionalRetainedChunkCpuBytes({ chunkId: "chunk-pending-page-source" } as any),
  pendingPageMetadataBytes,
  "painter-page source buffers already counted by geometry are excluded while retained page metadata remains counted");
renderer.loadedChunks.delete("chunk-pending-page-source");

const compactedSourcePositions = new Float32Array([-50, 0, 50, 0]);
const compactedPositions = packCadV2PositionArray(compactedSourcePositions);
const compactPositionChunk = {
  chunkId: "chunk-compact-position-buffer",
  origin: [0, 0],
  vertexCount: 2,
  xyArray: compactedPositions.positions,
  positionCodec: compactedPositions.codec,
  drawRunsArray: null,
  trianglesArray: null,
  meta: { layoutId: "Model", layerRuns: [], drawCommands: [] },
} as any;
renderer.addSceneChunk(compactPositionChunk);
const compactPositionLine = renderer.loadedChunks.get(compactPositionChunk.chunkId).group.children[0] as any;
assert.equal(compactPositionLine.geometry.attributes.position.normalized, true,
  "Uint16 coordinates are normalized by the WebGL vertex attribute");
assert.equal(compactPositionLine.scale.x, 100,
  "chunk range transform restores the source X extent after vertex normalization");
assert.equal(renderer.getResourceMemoryEstimate().gpuBufferBytesEstimate, compactedPositions.positions.byteLength,
  "CPU/GPU resident geometry accounting uses the smaller Uint16 backing buffer");
renderer.removeSceneChunk(compactPositionChunk.chunkId);

const compactLineweightBase = makeLineweightChunk("chunk-compact-lineweight");
const compactLineweightPositions = packCadV2PositionArray(compactLineweightBase.xyArray);
const compactLineweightChunk = {
  ...compactLineweightBase,
  xyArray: compactLineweightPositions.positions,
  positionCodec: compactLineweightPositions.codec,
};
renderer.addSceneChunk(compactLineweightChunk);
assert.equal(renderer.setLineweight(true), true,
  "lineweight expansion keeps compact source endpoints and reconstructs world-local coordinates in its shader");
const compactLineweightMesh = renderer.loadedChunks.get(compactLineweightChunk.chunkId).group.children.find(
  (child: any) => child.userData?.isLineweightMesh,
) as any;
assert.deepEqual(Array.from(compactLineweightMesh.geometry.attributes.instanceStart.data.array), [0, 0, 0xffff, 0],
  "compact-source lineweight retains normalized Uint16 endpoints rather than a decoded Float32 copy");
assert.equal(compactLineweightMesh.geometry.attributes.instanceStart.normalized, true,
  "single lineweight interleaved attributes preserve normalized integer decoding");
assert.equal(compactLineweightMesh.geometry.attributes.instanceStart.data.array.buffer, compactLineweightPositions.positions.buffer,
  "single lineweight geometry shares the retained compact source backing store");
assert.equal(compactLineweightMesh.material.uniforms.uCadV2PositionOffset.value.x, 0,
  "single lineweight shader restores the encoded X origin");
assert.equal(compactLineweightMesh.material.uniforms.uCadV2PositionScale.value.x, 10,
  "single lineweight shader restores the encoded X extent before measuring stroke width");
assert.equal(renderer.getSharedChunkCpuBufferBytes(compactLineweightChunk), compactLineweightPositions.positions.byteLength,
  "CPU admission recognizes a compact interleaved lineweight buffer shared with its source chunk");
assert.equal(renderer.setLineweight(false), true, "compact-source lineweight can be removed without losing its encoded centerline");
renderer.removeSceneChunk(compactLineweightChunk.chunkId);

const compactBatchedLineweightBase = makeBatchedLineweightChunk("chunk-compact-batched-lineweight");
const compactBatchedLineweightPositions = packCadV2PositionArray(compactBatchedLineweightBase.xyArray);
const compactBatchedLineweightChunk = {
  ...compactBatchedLineweightBase,
  xyArray: compactBatchedLineweightPositions.positions,
  positionCodec: compactBatchedLineweightPositions.codec,
};
renderer.addSceneChunk(compactBatchedLineweightChunk);
assert.equal(renderer.setLineweight(true), true, "batched compact lineweight source expands without decoding a second CPU array");
const compactBatchedLineweightMesh = renderer.loadedChunks.get(compactBatchedLineweightChunk.chunkId).group.children.find(
  (child: any) => child.userData?.isLineweightMesh,
) as any;
assert.equal(compactBatchedLineweightMesh.geometry.attributes.instanceStart.normalized, true,
  "batched lineweight shader receives normalized Uint16 interleaved coordinates");
assert.equal(compactBatchedLineweightMesh.geometry.attributes.instanceStart.data.array.buffer,
  compactBatchedLineweightPositions.positions.buffer,
  "batched lineweight renderer shares the host-retained source positions");
assert.equal(compactBatchedLineweightMesh.material.uniforms.uCadV2PositionScale.value.x, 10,
  "batched lineweight applies the source extent in shader space while keeping lineweight width in world units");
assert.equal(renderer.getSharedChunkCpuBufferBytes(compactBatchedLineweightChunk), compactBatchedLineweightPositions.positions.byteLength,
  "CPU admission recognizes compact batched lineweight source aliases");
assert.equal(renderer.setLineweight(false), true, "batched compact lineweight resources can be released cleanly");
renderer.removeSceneChunk(compactBatchedLineweightChunk.chunkId);

const sharedPositionChunk = {
  chunkId: "chunk-shared-position-buffer",
  origin: [0, 0],
  vertexCount: 4,
  xyArray: new Float32Array([0, 0, 1, 1, 2, 2, 3, 3]),
  drawRunsArray: null,
  trianglesArray: null,
  meta: {
    layoutId: "Model",
    drawCommands: [
      { kind: "line", layer: "A", color: [1, 0, 0], firstVertex: 0, vertexCount: 2, globalOrderIndex: 1 },
      { kind: "line", layer: "A", color: [0, 0, 1], firstVertex: 2, vertexCount: 2, globalOrderIndex: 2 },
    ],
  },
} as any;
renderer.addSceneChunk(sharedPositionChunk);
const sharedPositionBatch = renderer.loadedChunks.get(sharedPositionChunk.chunkId).group.children[0] as any;
assert.equal(sharedPositionBatch.isBatchedMesh, true,
  "adjacent solid line commands with different colors use one ordered WEBGL_multi_draw batch");
assert.equal(sharedPositionBatch.isLineSegments, true,
  "the multi-draw batch keeps WebGL LINES primitive semantics");
assert.equal(sharedPositionBatch.frustumCulled, false,
  "2D BatchedMesh objects defer visibility to their chunk bounds instead of computing an invalid 3D bounding sphere");
assert.equal(sharedPositionBatch.perObjectFrustumCulled, false,
  "2D BatchedMesh source ranges do not run Three.js per-instance 3D sphere culling");
assert.equal(sharedPositionBatch._instanceInfo.length, 2,
  "the batch retains one independently styled range per source draw command");
assert.deepEqual(Array.from(sharedPositionBatch._colorsTexture.image.data.slice(0, 8)), [1, 0, 0, 1, 0, 0, 1, 1],
  "per-range batch color preserves the source painter colors");
renderer.setLayerVisibility("A", false);
assert.equal(sharedPositionBatch.getVisibleAt(0), false,
  "layer visibility hides every batched source range for the selected CAD layer");
renderer.setLayerVisibility("A", true);
assert.equal(sharedPositionBatch.getVisibleAt(1), true,
  "layer visibility restores each batched source range");
const sharedPositionGeometry = sharedPositionBatch.geometry;
assert.equal(sharedPositionGeometry.attributes.position.array.buffer, sharedPositionChunk.xyArray.buffer,
  "contiguous command ranges share the transferred chunk position buffer instead of copying vertices");
assert.deepEqual(Array.from(sharedPositionGeometry.attributes.position.array), Array.from(sharedPositionChunk.xyArray),
  "the shared 2D position view preserves every source coordinate");
renderer.removeSceneChunk(sharedPositionChunk.chunkId);

const sharedTriangleChunk = {
  chunkId: "chunk-shared-triangle-buffer",
  origin: [0, 0],
  vertexCount: 0,
  xyArray: new Float32Array(),
  drawRunsArray: null,
  trianglesArray: new Float32Array([0, 0, 2, 0, 0, 2, 2, 0, 2, 2, 0, 2]),
  meta: {
    layoutId: "Model",
    drawCommands: [
      { kind: "triangle", layer: "HATCH-A", color: [1, 0, 0], firstVertex: 0, vertexCount: 3, globalOrderIndex: 1 },
      { kind: "triangle", layer: "HATCH-B", color: [0, 0, 1], firstVertex: 3, vertexCount: 3, globalOrderIndex: 2 },
    ],
  },
} as any;
renderer.addSceneChunk(sharedTriangleChunk);
const sharedTriangleBatch = renderer.loadedChunks.get(sharedTriangleChunk.chunkId).group.children[0] as any;
assert.equal(sharedTriangleBatch.isBatchedMesh, true,
  "adjacent opaque fill commands use one painter-ordered WEBGL_multi_draw triangle batch");
assert.equal(sharedTriangleBatch.isMesh, true, "triangle batches retain WebGL TRIANGLES primitive semantics");
assert.equal(sharedTriangleBatch.isLineSegments, false, "triangle batches do not inherit the source line primitive mode");
assert.equal(sharedTriangleBatch.frustumCulled, false,
  "2D triangle BatchedMesh objects defer visibility to their chunk bounds");
assert.equal(sharedTriangleBatch._instanceInfo.length, 2,
  "triangle batching preserves independently styled and layer-owned fill ranges");
assert.equal(sharedTriangleBatch.geometry.attributes.position.array.buffer, sharedTriangleChunk.trianglesArray.buffer,
  "triangle ranges share their transferred source buffer without copying vertices");
renderer.setLayerVisibility("HATCH-A", false);
assert.equal(sharedTriangleBatch.getVisibleAt(0), false, "fill layer visibility hides only its batched triangle range");
renderer.setLayerVisibility("HATCH-A", true);
assert.equal(sharedTriangleBatch.getVisibleAt(0), true, "fill layer visibility restores its batched triangle range");
renderer.removeSceneChunk(sharedTriangleChunk.chunkId);

const sameStylePainterOrderChunk = {
  chunkId: "chunk-same-style-painter-depth",
  origin: [0, 0],
  vertexCount: 4,
  xyArray: new Float32Array([0, 0, 4, 0, 0, 1, 4, 1]),
  drawRunsArray: null,
  trianglesArray: null,
  meta: {
    layoutId: "Model",
    globalOrderMax: 1,
    drawCommands: [
      { kind: "line", layer: "SAME", color: [1, 0, 0], firstVertex: 0, vertexCount: 2, globalOrderIndex: 0, globalOrderEndIndex: 0 },
      { kind: "line", layer: "SAME", color: [1, 0, 0], firstVertex: 2, vertexCount: 2, globalOrderIndex: 1, globalOrderEndIndex: 1 },
    ],
  },
} as any;
renderer.addSceneChunk(sameStylePainterOrderChunk);
const sameStylePainterBatch = renderer.loadedChunks.get(sameStylePainterOrderChunk.chunkId).group.children[0] as any;
assert.equal(sameStylePainterBatch._instanceInfo.length, 2,
  "same-style commands at distinct painter ranks keep separate depth instances");
const firstSameStyleOrder = new THREE.Matrix4();
const secondSameStyleOrder = new THREE.Matrix4();
sameStylePainterBatch.getMatrixAt(0, firstSameStyleOrder);
sameStylePainterBatch.getMatrixAt(1, secondSameStyleOrder);
assert.ok(secondSameStyleOrder.elements[14] > firstSameStyleOrder.elements[14],
  "same-style painter commands retain distinct increasing depth positions after batching");
renderer.removeSceneChunk(sameStylePainterOrderChunk.chunkId);

const interleavedPainterChunk = {
  chunkId: "chunk-interleaved-painter-depth",
  origin: [0, 0],
  vertexCount: 4,
  xyArray: new Float32Array([0, 0, 4, 0, 0, 1, 4, 1]),
  drawRunsArray: null,
  trianglesArray: new Float32Array([
    0, 0, 4, 0, 0, 4,
    0, 1, 4, 1, 0, 5,
  ]),
  meta: {
    layoutId: "Model",
    globalOrderMax: 4,
    drawCommands: [
      { kind: "line", layer: "ORDER-LINE-1", color: [1, 0, 0], firstVertex: 0, vertexCount: 2, lineweightMm: 0.25, globalOrderIndex: 1 },
      { kind: "triangle", layer: "ORDER-FILL-2", color: [0, 1, 0], firstVertex: 0, vertexCount: 3, globalOrderIndex: 2 },
      { kind: "line", layer: "ORDER-LINE-3", color: [0, 0, 1], firstVertex: 2, vertexCount: 2, lineweightMm: 0, globalOrderIndex: 3 },
      { kind: "triangle", layer: "ORDER-FILL-4", color: [1, 1, 0], firstVertex: 3, vertexCount: 3, globalOrderIndex: 4 },
    ],
  },
} as any;
renderer.addSceneChunk(interleavedPainterChunk);
const painterGroup = renderer.loadedChunks.get(interleavedPainterChunk.chunkId).group;
const painterLineBatch = painterGroup.children.find((child: any) => child.name === "cad-v2-multidraw-lines") as any;
const painterTriangleBatch = painterGroup.children.find((child: any) => child.name === "cad-v2-multidraw-triangles") as any;
assert.equal(painterGroup.children.length, 2,
  "interleaved opaque line/fill commands collapse to one multi-draw batch per GL primitive type");
assert.equal(painterLineBatch._instanceInfo.length, 2, "line painter-depth batch retains both source command ranges");
assert.equal(painterTriangleBatch._instanceInfo.length, 2, "triangle painter-depth batch retains both source command ranges");
assert.equal(painterLineBatch.material.depthTest, true, "line batching uses depth to preserve interleaved painter order");
assert.equal(painterTriangleBatch.material.depthWrite, true, "fill batching writes painter-order depth for later primitives");
const earlyLineOrder = new THREE.Matrix4();
const lateLineOrder = new THREE.Matrix4();
painterLineBatch.getMatrixAt(0, earlyLineOrder);
painterLineBatch.getMatrixAt(1, lateLineOrder);
assert.ok(lateLineOrder.elements[14] > earlyLineOrder.elements[14],
  "later source commands map to nearer depth independent of the GL batch call order");
renderer.setLineweight(true);
const painterLineweightMesh = painterGroup.children.find((child: any) => child.userData?.isBatchedLineweightMesh) as any;
assert.equal(painterLineweightMesh.material.depthTest, true, "expanded weighted strokes participate in painter-depth composition");
assert.equal(painterGroup.children.some((child: any) => child.name === "cad-v2-multidraw-lines"), false,
  "lineweight expansion swaps out the multi-draw position buffer instead of retaining a duplicate GPU copy");
assert.equal(painterLineweightMesh.userData.styleData[13], 0,
  "hairline entries retain zero physical width in the lineweight style table");
assert.equal(painterLineweightMesh.userData.styleData[14], 1,
  "hairline entries remain visible through the screen-space one-pixel lineweight shader path");
assert.ok(painterLineweightMesh.material.vertexShader.includes("uCadV2ViewportResolution"),
  "hairline expansion uses CSS viewport pixels, matching Three.js LineBasicMaterial across DPR levels");
assert.ok(painterLineweightMesh.userData.styleData[15] > painterLineweightMesh.userData.styleData[7],
  "instanced lineweight style table carries each command's ordered depth without extra style buffers");
renderer.setLayerVisibility("ORDER-LINE-1", false);
assert.equal(painterLineweightMesh.userData.styleData[6], 0,
  "layer visibility updates the painter-depth lineweight batch without touching order metadata");
renderer.setLineweight(false);
assert.equal(painterGroup.children.some((child: any) => child.name === "cad-v2-multidraw-lines"), true,
  "disabling lineweights reconstructs the original multi-draw batch");
renderer.removeSceneChunk(interleavedPainterChunk.chunkId);

const largeGlobalOrderLineChunk = {
  chunkId: "chunk-large-global-order-line-range",
  origin: [0, 0],
  vertexCount: 6,
  xyArray: new Float32Array([0, 0, 1, 0, 1, 0, 2, 0, 2, 0, 3, 0]),
  drawRunsArray: null,
  trianglesArray: null,
  meta: {
    layoutId: "Model",
    globalOrderMax: 4_680_333,
    drawCommands: [
      { kind: "line", layer: "LARGE-ORDER-A", color: [1, 0, 0], firstVertex: 0, vertexCount: 2, globalOrderIndex: 23, globalOrderEndIndex: 373 },
      { kind: "line", layer: "LARGE-ORDER-B", color: [0, 0, 1], firstVertex: 2, vertexCount: 2, globalOrderIndex: 374, globalOrderEndIndex: 400 },
      { kind: "line", layer: "LARGE-ORDER-C", color: [0, 1, 0], firstVertex: 4, vertexCount: 2, globalOrderIndex: 900, globalOrderEndIndex: 930 },
    ],
  },
} as any;
renderer.addSceneChunk(largeGlobalOrderLineChunk);
const largeOrderGroup = renderer.loadedChunks.get(largeGlobalOrderLineChunk.chunkId).group;
assert.equal(largeOrderGroup.children.length, 2,
  "commands with explicit inclusive spans batch only across truly adjacent global primitive ranges");
const largeOrderBatch = largeOrderGroup.children.find((child: any) => child.name === "cad-v2-multidraw-lines") as any;
assert.ok(largeOrderBatch, "over-limit global order preserves the ordinary ordered multi-draw fallback");
assert.equal(largeOrderBatch._instanceInfo.length, 2,
  "inclusive source spans let the renderer batch style changes without collapsing a painter-order gap");
assert.equal(largeOrderBatch.renderOrder, 23,
  "the ordered fallback batch enters the scene at the first source command's painter position");
assert.equal(largeOrderBatch.material.depthTest, false,
  "the no-depth fallback relies on exact sequential multi-draw order rather than unsupported depth precision");
renderer.removeSceneChunk(largeGlobalOrderLineChunk.chunkId);

const packedPositionChunk = {
  chunkId: "chunk-packed-position-runs",
  origin: [0, 0],
  vertexCount: 6,
  xyArray: new Float32Array([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]),
  drawRunsArray: null,
  trianglesArray: null,
  meta: {
    layoutId: "Model",
    drawCommands: [
      { kind: "line", layer: "A", color: [1, 0, 0], firstVertex: 0, vertexCount: 2, globalOrderIndex: 1 },
      { kind: "line", layer: "A", color: [1, 0, 0], firstVertex: 4, vertexCount: 2, globalOrderIndex: 2 },
    ],
  },
} as any;
renderer.addSceneChunk(packedPositionChunk);
const packedPositionGeometry = renderer.loadedChunks.get(packedPositionChunk.chunkId).group.children[0].geometry;
assert.notEqual(packedPositionGeometry.attributes.position.array.buffer, packedPositionChunk.xyArray.buffer,
  "non-contiguous command ranges are packed so unrelated source vertices are not drawn");
assert.deepEqual(Array.from(packedPositionGeometry.attributes.position.array), [0, 0, 1, 1, 4, 4, 5, 5],
  "packing preserves the original vertex run order");
assert.equal(renderer.getSharedChunkCpuBufferBytes(packedPositionChunk), 0,
  "budget alias accounting does not subtract a source buffer that was copied for non-contiguous ranges");
renderer.removeSceneChunk(packedPositionChunk.chunkId);

const partialDashedSourceChunk = {
  chunkId: "chunk-partial-dashed-source-buffer",
  origin: [0, 0],
  vertexCount: 4,
  xyArray: new Float32Array([0, 0, 1, 0, 2, 0, 3, 0]),
  pathDistancesArray: new Float32Array([0, 1, 2, 3]),
  drawRunsArray: null,
  trianglesArray: null,
  meta: {
    layoutId: "Model",
    drawCommands: [
      { kind: "line", layer: "DASH", color: [1, 0, 0], firstVertex: 0, vertexCount: 2, dashStyle: { dashSize: 1, gapSize: 1 } },
      { kind: "line", layer: "SOLID", color: [0, 0, 1], firstVertex: 2, vertexCount: 2 },
    ],
  },
} as any;
renderer.addSceneChunk(partialDashedSourceChunk);
const partialDashedLine = renderer.loadedChunks.get(partialDashedSourceChunk.chunkId).group.children.find(
  (child: any) => child.geometry?.attributes?.lineDistance,
) as any;
assert.equal(partialDashedLine.geometry.attributes.lineDistance.array.buffer, partialDashedSourceChunk.pathDistancesArray.buffer,
  "a contiguous dashed subrange shares the aligned PATH_DISTANCE source even when solid vertices are present");
assert.equal(renderer.getSharedChunkCpuBufferBytes(partialDashedSourceChunk),
  partialDashedSourceChunk.xyArray.byteLength + partialDashedSourceChunk.pathDistancesArray.byteLength,
  "CPU admission accounts one host/renderer copy for both positions and source path phase");
renderer.removeSceneChunk(partialDashedSourceChunk.chunkId);

const batchedLineweightChunk = makeBatchedLineweightChunk("chunk-batched-lineweight");
renderer.addSceneChunk(batchedLineweightChunk);
const batchedLineweightGroup = renderer.loadedChunks.get(batchedLineweightChunk.chunkId).group;
const lineweightBatch = batchedLineweightGroup.children[0] as any;
const normalLineBatch = batchedLineweightGroup.children[1] as any;
assert.equal(lineweightBatch.isBatchedMesh, true, "weighted source ranges use their own ordered batch for the LWT toggle");
assert.equal(normalLineBatch.isBatchedMesh, true, "unweighted source ranges stay in a separate ordered batch");
assert.equal(renderer.setLineweight(true), true, "batched lineweight ranges expand while unweighted ranges remain batched");
assert.equal(batchedLineweightGroup.children.length, 2, "one weighted range swaps its batch for one expanded mesh without merging painter-order groups");
assert.equal(batchedLineweightGroup.children.includes(lineweightBatch), false, "the weighted source batch leaves the resident scene while expanded");
assert.equal(normalLineBatch.getVisibleAt(0), true, "unweighted batch range remains visible after LWT activation");
const batchedThickMesh = batchedLineweightGroup.children.find((child: any) => child.userData?.isLineweightMesh) as any;
assert.ok(batchedThickMesh.visible, "expanded batch lineweight follows layer visibility");
assert.ok(Number.isFinite(batchedThickMesh.geometry.boundingSphere?.radius),
  "2D instanced lineweight geometry carries explicit finite local bounds and never asks Three.js to derive z from a 2D attribute");
let batchedStyleTextureDisposals = 0;
batchedThickMesh.userData.styleTexture.addEventListener("dispose", () => batchedStyleTextureDisposals++);
const batchedTextureOwner = renderer.getResourceOwnershipSnapshot().find((resource: any) => resource.kind === "texture");
assert.equal(batchedTextureOwner?.byteEstimate.gpuBufferBytesEstimate, batchedThickMesh.userData.styleData.byteLength,
  "instanced lineweight style DataTexture bytes are included in GPU resource ownership estimates");
renderer.setLayerVisibility("LWT-A", false);
assert.equal(batchedThickMesh.userData.styleData[6], 0, "layer visibility masks weighted segments in the instanced lineweight draw");
renderer.setLayerVisibility("LWT-A", true);
assert.equal(batchedThickMesh.userData.styleData[6], 1, "layer visibility restores weighted segments in the instanced lineweight draw");
renderer.setMonochrome(true);
const monochromeBatchColor = new THREE.Color().setRGB(0.95, 0.95, 0.95, THREE.SRGBColorSpace).r;
assert.ok(Math.abs(batchedThickMesh.userData.styleData[2] - monochromeBatchColor) < 1e-6,
  "monochrome mode updates an already-expanded batch lineweight style table");
renderer.setMonochrome(false);
assert.equal(batchedThickMesh.userData.styleData[2], 1,
  "restoring color mode restores the source color on an expanded batch lineweight style table");
assert.equal(renderer.setLineweight(false), true, "batch lineweight can be disabled and returned to multi-draw");
assert.equal(batchedLineweightGroup.children.length, 2, "disabling batch lineweight releases its temporary mesh");
assert.ok(batchedLineweightGroup.children.some((child: any) => child.userData?.cadV2MultiDrawLineBatch &&
  child.userData.instances.some((instance: any) => instance.lineweightMm > 1e-4)),
"disabling batch lineweight restores the weighted multi-draw source range");
assert.equal(batchedStyleTextureDisposals, 1, "disabling batched lineweight releases its owned style texture exactly once");
renderer.removeSceneChunk(batchedLineweightChunk.chunkId);

assert.equal(renderer.setLineweight(true), true, "lineweight can be enabled before the next streamed chunk arrives");
const streamedBatchChunk = makeBatchedLineweightChunk("chunk-batched-lineweight-streamed");
renderer.addSceneChunk(streamedBatchChunk);
const streamedBatchGroup = renderer.loadedChunks.get(streamedBatchChunk.chunkId).group;
const streamedBatch = streamedBatchGroup.children.find((child: any) => child.userData?.cadV2MultiDrawLineBatch &&
  child.userData.instances.some((instance: any) => instance.lineweightMm > 1e-4)) as any;
assert.equal(streamedBatchGroup.children.filter((child: any) => child.userData?.isLineweightMesh).length, 1,
  "a streamed weighted range creates one instanced lineweight mesh without a duplicate weighted batch");
assert.equal(streamedBatch, undefined,
  "a streamed weighted range does not retain its original multi-draw source buffer while lineweights are active");
assert.ok(streamedBatchGroup.children.some((child: any) => child.userData?.cadV2MultiDrawLineBatch &&
  child.userData.instances.every((instance: any) => instance.lineweightMm <= 1e-4)),
  "a streamed unweighted range remains available as a normal multi-draw batch");
assert.equal(renderer.setLineweight(false), true, "streamed batch lineweight resources release when the setting is disabled");
assert.equal(streamedBatchGroup.children.length, 2, "streamed batch returns to its weighted/unweighted batches after lineweight is disabled");
renderer.removeSceneChunk(streamedBatchChunk.chunkId);

renderer.addSceneChunk(makeLineweightChunk("chunk-lineweight"));
const lineweightGroup = renderer.loadedChunks.get("chunk-lineweight").group;
assert.equal(lineweightGroup.children.length, 1, "disabled lineweight mode retains only the source centerline");
assert.equal(renderer.getResourceMemoryEstimate().gpuBufferBytesEstimate, 16,
  "disabled lineweight mode does not allocate hidden quad GPU buffers");
assert.equal(renderer.setLineweight(true, 64 * 1024 * 1024), false,
  "lineweight expansion is rejected when its resulting resident estimate exceeds the CPU budget");
assert.equal(renderer.getLineweight(), false, "a rejected lineweight expansion leaves the setting disabled");
assert.equal(lineweightGroup.children.length, 1, "a rejected expansion removes its temporary geometry");

assert.equal(renderer.setLineweight(true), true, "lineweight expansion is enabled when its resource estimate fits");
assert.equal(renderer.getLineweight(), true, "accepted lineweight expansion updates renderer state");
assert.equal(lineweightGroup.children.length, 2, "accepted expansion adds one visible quad mesh");
const thickMesh = lineweightGroup.children.find((child: any) => child.userData?.isLineweightMesh) as any;
assert.ok(thickMesh?.visible, "accepted lineweight quad follows the enabled setting");
let thickGeometryDisposals = 0;
let thickMaterialDisposals = 0;
thickMesh.geometry.addEventListener("dispose", () => thickGeometryDisposals++);
thickMesh.material.addEventListener("dispose", () => thickMaterialDisposals++);
assert.equal(renderer.getResourceOwnershipSnapshot().length, 4,
  "the lineweight toggle refreshes chunk ownership for its geometry and material");
assert.equal(renderer.setLineweight(false), true, "lineweight mode can be disabled again");
assert.equal(lineweightGroup.children.length, 1, "disabling removes expanded quads while keeping centerline data");
assert.deepEqual(renderer.getResourceMemoryEstimate(), {
  cpuResidentBytes: 16,
  gpuBufferBytesEstimate: 16,
  geometryCount: 1,
  loadedChunkCount: 1,
}, "disabling releases the expanded quad buffers from CPU/GPU estimates");
assert.equal(thickGeometryDisposals, 1, "disabling disposes the removed lineweight geometry");
assert.equal(thickMaterialDisposals, 1, "disabling disposes the removed lineweight material");
renderer.removeSceneChunk("chunk-lineweight");
assert.equal(renderer.getResourceOwnershipSnapshot().length, 0, "lineweight owner refresh leaves no resources after chunk removal");

const pageRenderer = Object.create(CadV2Renderer.prototype) as any;
pageRenderer.scene = new THREE.Scene();
pageRenderer.contentGroup = new THREE.Group();
pageRenderer.painterPagesGroup = new THREE.Group();
pageRenderer.pendingPainterPageChunks = [];
pageRenderer.painterRenderPages = new Set();
pageRenderer.cameraAdapter = { getState: () => ({ center: [0, 0], worldOrigin: [0, 0] }) };
pageRenderer.defaultWorldOrigin = [0, 0];
pageRenderer.loadedChunks = new Map();
pageRenderer.cameraRelativeChunkIds = new Set();
pageRenderer.nonPainterDepthChunkIds = new Set();
pageRenderer.lastReportedSortObjects = null;
pageRenderer.chunkBounds = new Map();
pageRenderer.activeLayoutId = "Model";
pageRenderer.layerVisibility = new Map();
pageRenderer.isMonochrome = false;
pageRenderer.isLineweight = false;
pageRenderer.backgroundColorHex = 0x121212;
pageRenderer.renderer = renderer.renderer;
pageRenderer.painterPageMaxStyles = getCadV2PainterPageMaxStyles(16_384);
pageRenderer.isLightBackground = () => pageRenderer.backgroundColorHex > 0x888888;
pageRenderer.invalidate = () => {};
pageRenderer.requestChunkMutationRender = () => {};
pageRenderer.resourceOwnershipLedger = new CadV2ResourceOwnershipLedger();
pageRenderer.resourceOwnerScene = "scene-painter-page-test";
pageRenderer.resourceOwnerGeneration = 1;

const painterPromotionDiagnostics: Array<Record<string, unknown>> = [];
const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    __cadV2PainterPromotionDiagnostics: (event: Record<string, unknown>) => painterPromotionDiagnostics.push(event),
  },
});

for (let index = 0; index < 512; index++) {
  pageRenderer.addSceneChunk({
    chunkId: `chunk-page-${index}`,
    origin: [index * 2, 0],
    vertexCount: 8,
    xyArray: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1, 0, 2, 1, 2, 0, 3, 1, 3]),
    drawRunsArray: null,
    trianglesArray: null,
    meta: {
      layoutId: "Model",
      globalOrderMax: 3,
      drawCommands: [
        { kind: "line", layer: "PAGE-LINE", color: [1, 0, 0], firstVertex: 0, vertexCount: 2, lineweightMm: 0.5, globalOrderIndex: 0 },
        { kind: "line", layer: "PAGE-LINE", color: [0, 1, 0], firstVertex: 2, vertexCount: 2, lineweightMm: 0.5, globalOrderIndex: 1 },
        { kind: "line", layer: "PAGE-LINE", color: [0, 0, 1], firstVertex: 4, vertexCount: 2, lineweightMm: 0.5, globalOrderIndex: 2 },
        { kind: "line", layer: "PAGE-LINE", color: [1, 1, 0], firstVertex: 6, vertexCount: 2, lineweightMm: 0.5, globalOrderIndex: 3 },
      ],
    },
  } as any);
}

assert.equal(pageRenderer.painterPagesGroup.children.length, 1,
  "512 compatible painter-depth chunks are coalesced into one shared line page");
assert.equal(pageRenderer.loadedChunks.size, 512, "page promotion preserves each independently addressable chunk");
assert.equal(pageRenderer.cameraRelativeChunkIds.size, 0,
  "promoted chunks with empty detached groups leave the per-frame camera transform set");
assert.ok(pageRenderer.loadedChunks.get("chunk-page-0").group.children.length === 0,
  "promotion releases per-chunk line meshes after the shared page is installed");
assert.equal(painterPromotionDiagnostics.length, 1,
  "a completed full painter-page promotion emits one bounded resource diagnostic");
assert.equal(painterPromotionDiagnostics[0]?.outcome, "promoted",
  "the promotion diagnostic records successful page replacement");
assert.equal(painterPromotionDiagnostics[0]?.requestedChunkCount, 512,
  "the promotion diagnostic records the requested source chunk count");
assert.equal(painterPromotionDiagnostics[0]?.promotedChunkCount, 512,
  "the promotion diagnostic records every promoted chunk");
assert.equal(painterPromotionDiagnostics[0]?.remainingGroupCount, 0,
  "the promotion diagnostic proves eligible chunk groups were released");
const mutationBatchFlushes: boolean[] = [];
pageRenderer.chunkMutationRenderScheduler = {
  begin: () => (flush = true) => mutationBatchFlushes.push(flush),
};
const endPainterPageBatch = pageRenderer.beginChunkMutationBatch();
pageRenderer.addSceneChunk({
  chunkId: "chunk-page-tail",
  origin: [1_024, 0],
  vertexCount: 2,
  xyArray: new Float32Array([0, 0, 1, 0]),
  drawRunsArray: null,
  trianglesArray: null,
  meta: {
    layoutId: "Model",
    globalOrderMax: 0,
    drawCommands: [
      { kind: "line", layer: "PAGE-LINE", color: [1, 1, 1], firstVertex: 0, vertexCount: 2, lineweightMm: 0.5, globalOrderIndex: 0 },
    ],
  },
} as any);
assert.equal(pageRenderer.pendingPainterPageChunks.length, 1,
  "a partial painter page remains queued until its chunk mutation batch ends");
endPainterPageBatch(true);
assert.deepEqual(mutationBatchFlushes, [true], "the renderer forwards the batch flush decision");
assert.equal(pageRenderer.pendingPainterPageChunks.length, 0,
  "a successful chunk mutation batch promotes its final partial painter page");
assert.equal(pageRenderer.painterPagesGroup.children.length, 2,
  "the final partial page replaces its standalone chunk geometry");
assert.equal(pageRenderer.loadedChunks.get("chunk-page-tail").group.children.length, 0,
  "the final partial page releases per-chunk line meshes");
assert.equal(painterPromotionDiagnostics.length, 2,
  "the final partial painter-page flush emits a separate resource diagnostic");
assert.equal(painterPromotionDiagnostics[1]?.requestedChunkCount, 1,
  "the tail diagnostic records the exact partial chunk count");

const constantAxisChunks = [
  {
    chunkId: "chunk-page-horizontal-compact",
    source: new Float32Array([-1, 5, 1, 5]),
    expectedScale: [2, 0],
  },
  {
    chunkId: "chunk-page-vertical-compact",
    source: new Float32Array([7, -1, 7, 1]),
    expectedScale: [0, 2],
  },
];
const endConstantAxisBatch = pageRenderer.beginChunkMutationBatch();
for (const constantAxis of constantAxisChunks) {
  const packed = packCadV2PositionArray(constantAxis.source);
  assert.deepEqual([packed.codec.extentX, packed.codec.extentY], constantAxis.expectedScale,
    "position compaction preserves a zero extent on a constant source axis");
  pageRenderer.addSceneChunk({
    chunkId: constantAxis.chunkId,
    origin: [0, 0],
    vertexCount: 2,
    xyArray: packed.positions,
    positionCodec: packed.codec,
    drawRunsArray: null,
    trianglesArray: null,
    meta: {
      layoutId: "Model",
      globalOrderMax: 0,
      drawCommands: [
        { kind: "line", layer: "PAGE-LINE", color: [1, 1, 1], firstVertex: 0, vertexCount: 2, lineweightMm: 0.5, globalOrderIndex: 0 },
      ],
    },
  } as any);
}
endConstantAxisBatch(true);
assert.equal(painterPromotionDiagnostics.length, 3,
  "constant-axis compact chunks complete one painter-page promotion");
assert.equal(painterPromotionDiagnostics[2]?.outcome, "promoted",
  "a zero codec extent is a valid constant-coordinate transform for painter-page promotion");
assert.equal(painterPromotionDiagnostics[2]?.promotedChunkCount, 2,
  "both horizontal and vertical compact chunks are promoted together");
const constantAxisPage = pageRenderer.painterPagesGroup.children.find((child: any) =>
  child.userData?.isCadV2PainterLinePage &&
  constantAxisChunks.every((chunk) => child.userData.painterPage.styles.some((style: any) => style.chunk.chunkId === chunk.chunkId)),
) as THREE.Mesh | undefined;
assert.ok(constantAxisPage, "the horizontal and vertical compact sources share a painter line page");
const constantAxisStyles = (constantAxisPage!.userData.painterPage as { styles: Array<{ chunk: { chunkId: string } }> }).styles;
const constantAxisStyleData = (constantAxisPage!.userData.painterPage as { styleData: Float32Array }).styleData;
for (const constantAxis of constantAxisChunks) {
  const styleIndex = constantAxisStyles.findIndex((style) => style.chunk.chunkId === constantAxis.chunkId);
  assert.deepEqual(Array.from(constantAxisStyleData.slice(styleIndex * 12 + 10, styleIndex * 12 + 12)), constantAxis.expectedScale,
    "the shared painter page keeps each compact constant-axis transform exact");
  assert.equal(pageRenderer.loadedChunks.get(constantAxis.chunkId).group.children.length, 0,
    "successful constant-axis promotion releases the redundant per-chunk line mesh");
}
for (const constantAxis of constantAxisChunks) {
  pageRenderer.removeSceneChunk(constantAxis.chunkId);
}
assert.ok(!pageRenderer.painterPagesGroup.children.includes(constantAxisPage!),
  "retiring all constant-axis chunks detaches the constant-axis painter page");
if (originalWindowDescriptor) Object.defineProperty(globalThis, "window", originalWindowDescriptor);
else Reflect.deleteProperty(globalThis, "window");
const painterPage = pageRenderer.painterPagesGroup.children[0] as THREE.Mesh;
const pageStyleData = painterPage.userData.painterPage.styleData as Float32Array;
const painterPageVertexShader = (painterPage.material as THREE.ShaderMaterial).vertexShader;
const hiddenStyleGuardIndex = painterPageVertexShader.indexOf("if (colorWidthVisibilityDepth.z < 0.5)");
assert.ok(hiddenStyleGuardIndex >= 0, "shared line page shader guards invisible style instances");
assert.ok(
  painterPageVertexShader.indexOf("getCadV2LineStyle(styleIndex, 0)") > hiddenStyleGuardIndex,
  "invisible line instances return before color-style texture reads",
);
assert.ok(
  painterPageVertexShader.indexOf("getCadV2LineStyle(styleIndex, 2)") > hiddenStyleGuardIndex,
  "invisible line instances return before per-style position transforms",
);
assert.ok(
  painterPageVertexShader.indexOf("float segmentLength = length(delta)") > hiddenStyleGuardIndex,
  "invisible line instances return before segment-length and clip-space work",
);
assert.equal(pageStyleData[6], 1, "a promoted chunk starts visible in its own layer");
pageRenderer.setLayerVisibility("PAGE-LINE", false);
assert.equal(pageStyleData[6], 0, "layer visibility updates styles stored in a shared painter page");
pageRenderer.setLayerVisibility("PAGE-LINE", true);
pageRenderer.setMonochrome(true);
assert.equal(pageStyleData[2], pageStyleData[3], "monochrome updates the first shared-page color channel");
assert.equal(pageStyleData[3], pageStyleData[4], "monochrome updates every shared-page color channel");
pageRenderer.setMonochrome(false);

const pageResidentCpuBytes = pageRenderer.getResourceMemoryEstimate().cpuResidentBytes;
const cpuBudgetBytes = 64 * 1024 * 1024;
assert.equal(pageRenderer.setLineweight(true, cpuBudgetBytes - pageResidentCpuBytes + 1), false,
  "lineweight admission includes shared page buffers before applying reserved CPU bytes");
assert.equal(pageRenderer.getLineweight(), false, "a rejected shared-page lineweight budget keeps the setting disabled");
assert.equal(pageRenderer.setLineweight(true), true, "lineweight can be enabled when shared page buffers fit");
assert.equal(pageStyleData[5], 0.25, "lineweight updates the shared-page stroke width");
assert.equal(pageRenderer.setLineweight(false), true, "lineweight can be disabled on promoted painter pages");

let painterVisibilityRefreshes = 0;
let objectSortRefreshes = 0;
let mutationRenderRequests = 0;
const originalUpdatePainterPageChunkVisibility = pageRenderer.updatePainterPageChunkVisibility.bind(pageRenderer);
const originalUpdateObjectSortPolicy = pageRenderer.updateObjectSortPolicy.bind(pageRenderer);
const originalRequestChunkMutationRender = pageRenderer.requestChunkMutationRender.bind(pageRenderer);
pageRenderer.updatePainterPageChunkVisibility = (...args: unknown[]) => {
  painterVisibilityRefreshes++;
  return originalUpdatePainterPageChunkVisibility(...args);
};
pageRenderer.updateObjectSortPolicy = (...args: unknown[]) => {
  objectSortRefreshes++;
  return originalUpdateObjectSortPolicy(...args);
};
pageRenderer.requestChunkMutationRender = (...args: unknown[]) => {
  mutationRenderRequests++;
  return originalRequestChunkMutationRender(...args);
};
pageRenderer.removeSceneChunk("chunk-page-0");
assert.equal(pageRenderer.painterPagesGroup.children.length, 2,
  "removing one owner keeps its shared page and the separately promoted tail page alive");
assert.ok(painterVisibilityRefreshes > 0, "single-chunk removal refreshes visibility while shared page owners remain");
painterVisibilityRefreshes = 0;
objectSortRefreshes = 0;
mutationRenderRequests = 0;
pageRenderer.clearChunks();
assert.equal(painterVisibilityRefreshes, 0,
  "bulk renderer clear skips per-style visibility rewrites for pages that are all being retired");
assert.equal(objectSortRefreshes, 1, "bulk renderer clear recomputes object sorting once");
assert.equal(mutationRenderRequests, 1, "bulk renderer clear requests a single follow-up frame");
assert.equal(pageRenderer.painterPagesGroup.children.length, 0, "last-owner removal retires and detaches the shared page");
assert.equal(pageRenderer.getResourceOwnershipSnapshot().length, 0, "shared page and chunk ownership are released after clear");

console.log("PASS: renderer chunk ownership metadata, byte accounting, generation switch, and GPU resource cleanup");
