import assert from "node:assert/strict";
import type { CadCanonicalDocument, CadLineEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { buildSceneChunk, parseSceneChunk, SceneScalarType, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { releaseUnusedCadV2PathDistances } from "../../src/lib/cad-v2/render/chunk-memory-accounting";
import { applyCurveRefinementsToChunk } from "../../src/lib/cad-v2/worker/apply-curve-refinements";
import { decodeCadV2PositionArray } from "../../src/lib/cad-v2/worker/position-compaction";
import { refineUnpackedChunkCurves, unpackSceneChunk } from "../../src/workers/cad-v2/cad-v2-scene-worker";

function compileLine(linetype: "CONTINUOUS" | "DASH", lineweightMm = 0) {
  const entity: CadLineEntity = {
    type: "LINE",
    handle: `BUFFER_${linetype}`,
    layer: "0",
    order: 1n,
    start: [0, 0],
    end: [100, 0],
    linetype,
    lineweightMm,
  };
  const document: CadCanonicalDocument = {
    sourceVersionKey: `worker-buffer-${linetype}`,
    sourceSha256: `worker-buffer-${linetype}`,
    acadVersion: "AC1032",
    codepage: "UTF-8",
    units: 4,
    measurement: 1,
    layers: {
      "0": {
        id: "0", name: "0", visible: true, frozen: false, locked: false,
        color: { method: "aci", aci: 7 }, lineweightMm: 0, linetypeName: linetype,
      },
    },
    linetypes: linetype === "DASH"
      ? { DASH: { id: "DASH", name: "DASH", pattern: [10, -5], totalLength: 15 } }
      : {},
    textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {},
    diagnostics: [], modelSpaceEntities: [entity],
  };
  return compileCanonicalToScene(document, { sceneId: `worker_buffer_${linetype}` });
}

function compileOverviewLines() {
  const entities: CadLineEntity[] = [
    { type: "LINE", handle: "OVERVIEW_A", layer: "0", order: 1n, start: [0, 0], end: [0.01, 0], linetype: "CONTINUOUS", lineweightMm: 0.29 },
    { type: "LINE", handle: "OVERVIEW_B", layer: "0", order: 2n, start: [0.005, 0.005], end: [0.015, 0.005], linetype: "CONTINUOUS", lineweightMm: 0.29 },
    { type: "LINE", handle: "OVERVIEW_LONG", layer: "0", order: 3n, start: [0, 0], end: [100, 0], linetype: "CONTINUOUS", lineweightMm: 0.29 },
  ];
  const document: CadCanonicalDocument = {
    sourceVersionKey: "worker-buffer-overview",
    sourceSha256: "worker-buffer-overview",
    acadVersion: "AC1032",
    codepage: "UTF-8",
    units: 4,
    measurement: 1,
    layers: {
      "0": {
        id: "0", name: "0", visible: true, frozen: false, locked: false,
        color: { method: "aci", aci: 7 }, lineweightMm: 0, linetypeName: "CONTINUOUS",
      },
    },
    linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {},
    diagnostics: [], modelSpaceEntities: entities,
  };
  return compileCanonicalToScene(document, { sceneId: "worker_buffer_overview" });
}

function compileCurveWithOverviewLines() {
  const entities: CadCanonicalDocument["modelSpaceEntities"] = Array.from({ length: 1024 }, (_, index) => ({
    type: "LINE",
    handle: `CURVE_OVERVIEW_${index}`,
    layer: "0",
    order: BigInt(index + 1),
    start: [100 + index * 0.01, 0],
    end: [100.005 + index * 0.01, 0],
    linetype: "CONTINUOUS",
    lineweightMm: 0,
  } as CadLineEntity));
  entities.push({
    type: "CIRCLE",
    handle: "CURVE_OVERVIEW_CIRCLE",
    layer: "0",
    order: BigInt(entities.length + 1),
    center: [0, 0],
    radius: 50,
    linetype: "CONTINUOUS",
    lineweightMm: 0,
  } as any);
  const document: CadCanonicalDocument = {
    sourceVersionKey: "worker-buffer-curve-overview",
    sourceSha256: "worker-buffer-curve-overview",
    acadVersion: "AC1032",
    codepage: "UTF-8",
    units: 4,
    measurement: 1,
    layers: {
      "0": {
        id: "0", name: "0", visible: true, frozen: false, locked: false,
        color: { method: "aci", aci: 7 }, lineweightMm: 0, linetypeName: "CONTINUOUS",
      },
    },
    linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {},
    diagnostics: [],
    modelSpaceEntities: entities,
  };
  return compileCanonicalToScene(document, { sceneId: "worker_buffer_curve_overview" });
}

const solidScene = compileLine("CONTINUOUS");
const solidChunkId = solidScene.manifest.chunks[0]!.chunkId;
const solidBytes = solidScene.chunks.get(solidChunkId)!;
const solidRaw = parseSceneChunk(solidBytes);
assert.ok(solidRaw.sections.has(SceneTag.PATH_DISTANCE),
  "binary fidelity record retains the complete source path-distance section");
const solidUnpacked = unpackSceneChunk(solidChunkId, solidBytes);
assert.equal(solidUnpacked.pathDistancesArray, null,
  "worker omits path-distance payload when no rendered command consumes dash phase");
assert.equal(solidUnpacked.xyArray.buffer.byteLength, solidUnpacked.xyArray.byteLength,
  "worker returns an exact-size geometry buffer instead of pinning the full binary chunk");
assert.notEqual(solidUnpacked.xyArray.buffer, solidBytes.buffer,
  "compacted geometry storage is independent from the source transport buffer");
assert.deepEqual(Array.from(solidUnpacked.xyArray), [-50, 0, 50, 0],
  "compaction preserves solid-line coordinates losslessly");
assert.deepEqual([
  solidUnpacked.origin[0] + solidUnpacked.xyArray[0]!,
  solidUnpacked.origin[0] + solidUnpacked.xyArray[2]!,
], [0, 100], "compaction preserves the reconstructed world endpoints");

const compactSolid = unpackSceneChunk(solidChunkId, solidBytes, { compactPositions: true });
assert.ok(compactSolid.xyArray instanceof Uint16Array && compactSolid.positionCodec,
  "renderer admission can use a per-chunk normalized Uint16 position payload");
assert.equal(compactSolid.xyArray.byteLength, solidUnpacked.xyArray.byteLength / 2,
  "normalized positions halve the persistent XY backing buffer");
const decodedCompactSolid = decodeCadV2PositionArray(compactSolid.xyArray, compactSolid.positionCodec);
for (let index = 0; index < decodedCompactSolid.length; index++) {
  assert.ok(Math.abs(decodedCompactSolid[index]! - solidUnpacked.xyArray[index]!) <= compactSolid.positionCodec.maxWorldError,
    "decoded position error remains inside the reported world-space bound");
}
assert.deepEqual(Array.from(decodedCompactSolid), [-50, 0, 50, 0],
  "compact encoding reconstructs simple line coordinates exactly");

const overviewScene = compileOverviewLines();
const overviewChunkId = overviewScene.manifest.chunks[0]!.chunkId;
const overviewBytes = overviewScene.chunks.get(overviewChunkId)!;
const exactOverview = unpackSceneChunk(overviewChunkId, overviewBytes, { compactPositions: true });
const compactOverview = unpackSceneChunk(overviewChunkId, overviewBytes, {
  compactPositions: true,
  overviewUnitsPerCssPixel: 1,
});
assert.equal(compactOverview.overviewLod?.collapsedSegmentCount, 2,
  "worker applies the bounded overview representation to same-cell opaque line commands");
assert.equal(compactOverview.overviewLod?.representativePointCount, 1,
  "worker coalesces contiguous same-style painter ranks while deduplicating same-cell strokes");
assert.equal(compactOverview.overviewLod?.retainedSegmentCount, 1,
  "worker preserves the long source segment");
assert.ok(compactOverview.xyArray.length < exactOverview.xyArray.length,
  "worker transfers only the reduced renderer geometry for the coarse view");
assert.ok(compactOverview.overviewLod!.maxCenterlineDeviationCssPixels * 4 < 0.25,
  "worker's source-to-overview centerline bound remains below 0.25 CSS px through 4x zoom");

const curveOverviewScene = compileCurveWithOverviewLines();
const curveOverviewChunkId = curveOverviewScene.manifest.chunks[0]!.chunkId;
const curveOverviewBytes = curveOverviewScene.chunks.get(curveOverviewChunkId)!;
const exactCurveOverview = unpackSceneChunk(curveOverviewChunkId, curveOverviewBytes);
const compactCurveOverview = unpackSceneChunk(curveOverviewChunkId, curveOverviewBytes, {
  compactPositions: true,
  overviewUnitsPerCssPixel: 64,
});
assert.ok(exactCurveOverview.curveDataArray && exactCurveOverview.meta?.curveSourceRefs?.length,
  "mixed linework fixture contains analytic curve source intervals");
assert.ok((compactCurveOverview.overviewLod?.collapsedSegmentCount ?? 0) > 0,
  "worker compacts safe short linework in a chunk that also retains analytic curve sources");
assert.ok(compactCurveOverview.xyArray.length < exactCurveOverview.xyArray.length,
  "mixed curve and short-line chunks reduce their resident geometry at overview scale");
assert.ok(((compactCurveOverview.overviewLod?.maxCenterlineDeviationCssPixels ?? 0) +
  (compactCurveOverview.positionCodec?.maxWorldError ?? 0) / 64) * 4 <= 0.25,
"curve-aware overview simplification and U16 encoding remain inside the 0.25 CSS px bound through 4x zoom");
assert.equal(compactCurveOverview.meta?.curveSourceRefs?.length, exactCurveOverview.meta?.curveSourceRefs?.length,
  "overview compaction preserves every analytic curve source interval");
const decodedCurveOverview = decodeCadV2PositionArray(compactCurveOverview.xyArray, compactCurveOverview.positionCodec);
for (let referenceIndex = 0; referenceIndex < compactCurveOverview.meta!.curveSourceRefs.length; referenceIndex++) {
  const reference = compactCurveOverview.meta!.curveSourceRefs[referenceIndex]!;
  const exactReference = exactCurveOverview.meta!.curveSourceRefs[referenceIndex]!;
  assert.equal(reference.vertexCount, exactReference.vertexCount, "curve fallback span length remains unchanged");
  for (let vertex = 0; vertex < reference.vertexCount; vertex++) {
    const exactOffset = (exactReference.firstVertex + vertex) * 2;
    const compactOffset = (reference.firstVertex + vertex) * 2;
    assert.ok(compactOffset >= 0 && compactOffset + 1 < decodedCurveOverview.length,
      "remapped curve interval stays inside the compacted geometry");
    assert.ok(Math.abs(decodedCurveOverview[compactOffset]! - exactCurveOverview.xyArray[exactOffset]!) <=
      (compactCurveOverview.positionCodec?.maxWorldError ?? 0),
    "compaction retains exact fallback coordinates for every analytic curve interval");
    assert.ok(Math.abs(decodedCurveOverview[compactOffset + 1]! - exactCurveOverview.xyArray[exactOffset + 1]!) <=
      (compactCurveOverview.positionCodec?.maxWorldError ?? 0),
    "compaction retains exact fallback coordinates for every analytic curve interval");
  }
}
const curveOverviewRefinement = refineUnpackedChunkCurves(compactCurveOverview, {
  targetErrorCssPixels: 0.25,
  unitsPerCssPixel: 0.05,
  maxTransformSingularValue: 1,
});
const refinedCurveOverview = applyCurveRefinementsToChunk(compactCurveOverview, curveOverviewRefinement);
assert.ok(refinedCurveOverview.xyArray.length > compactCurveOverview.xyArray.length,
  "compacted overview geometry still accepts high-detail analytic curve replacement");

const mixedPrecisionMeta = new TextEncoder().encode(JSON.stringify({
  drawCommands: [{ kind: "line", firstVertex: 0, vertexCount: 4, alpha: 1 }],
}));
const mixedPrecisionBytes = buildSceneChunk([
  { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: mixedPrecisionMeta.length, data: mixedPrecisionMeta },
  { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
  { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 4,
    data: new Float32Array([0, 0, 0.01, 0, 1000, 1000, 1001, 1000]) },
]);
const mixedPrecisionChunk = unpackSceneChunk("mixed-precision-overview", mixedPrecisionBytes, {
  compactPositions: true,
  overviewUnitsPerCssPixel: 1,
});
assert.ok(mixedPrecisionChunk.xyArray instanceof Uint16Array && mixedPrecisionChunk.overviewLod?.collapsedSegmentCount,
  "worker preserves both overview vertex reduction and compact coordinates when their shared error budget allows it");
const combinedMixedPrecisionErrorCssPixels = (
  (mixedPrecisionChunk.overviewLod?.maxCenterlineDeviationCssPixels ?? 0) +
  (mixedPrecisionChunk.positionCodec?.maxWorldError ?? 0)
) * 4;
assert.ok(combinedMixedPrecisionErrorCssPixels <= 0.25,
  `overview simplification and U16 coordinate encoding share the 0.25 CSS px budget through 4x zoom; received ${combinedMixedPrecisionErrorCssPixels}`);

const outOfBudgetMeta = new TextEncoder().encode(JSON.stringify({
  drawCommands: [{ kind: "line", firstVertex: 0, vertexCount: 4, alpha: 1 }],
}));
const outOfBudgetBytes = buildSceneChunk([
  { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: outOfBudgetMeta.length, data: outOfBudgetMeta },
  { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
  { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: 4,
    data: new Float32Array([0, 0, 0.01, 0, 10_000_000, 10_000_000, 10_000_001, 10_000_000]) },
]);
const outOfBudgetChunk = unpackSceneChunk("codec-over-screen-budget", outOfBudgetBytes, {
  compactPositions: true,
  overviewUnitsPerCssPixel: 1,
});
assert.ok(outOfBudgetChunk.xyArray instanceof Float32Array && outOfBudgetChunk.positionCodec === undefined,
  "worker retains Float32 positions when U16 encoding alone would exceed the supported screen-space error budget");
assert.ok((outOfBudgetChunk.overviewLod?.maxCenterlineDeviationCssPixels ?? 0) * 4 <= 0.25,
  "overview geometry remains within the supported screen-space error budget when U16 encoding is disabled");

const dashedScene = compileLine("DASH");
const dashedChunkId = dashedScene.manifest.chunks[0]!.chunkId;
const dashedBytes = dashedScene.chunks.get(dashedChunkId)!;
const dashedUnpacked = unpackSceneChunk(dashedChunkId, dashedBytes);
const dashedOverviewRequest = unpackSceneChunk(dashedChunkId, dashedBytes, {
  compactPositions: true,
  overviewUnitsPerCssPixel: 1,
});
assert.equal(dashedOverviewRequest.overviewLod?.collapsedSegmentCount, 0,
  "a fully phase-bearing chunk has no independent solid segments to compact");
const dashCommand = dashedUnpacked.meta?.drawCommands?.find((command: any) => command.kind === "line");
assert.ok(dashCommand?.dashStyle, "fixture selects the shader dash rendering path");
assert.ok(dashedUnpacked.pathDistancesArray instanceof Float32Array,
  "shader-dashed geometry retains the source phase array required by the dash shader");
assert.equal(dashedUnpacked.pathDistancesArray.buffer.byteLength, dashedUnpacked.pathDistancesArray.byteLength,
  "retained dash phases use an exact-size transferable buffer");
assert.equal(dashedUnpacked.xyArray.buffer.byteLength, dashedUnpacked.xyArray.byteLength,
  "dashed geometry also releases unused binary section bytes");
assert.ok(dashedUnpacked.pathDistancesArray.every(Number.isFinite),
  "compacted dash phase values remain finite");
assert.equal(releaseUnusedCadV2PathDistances(dashedUnpacked), 0,
  "shader-dashed paths retain their exact phase buffer for rendering");

const mixedPhaseSolidVertexCount = 2_048;
const mixedPhaseVertexCount = mixedPhaseSolidVertexCount + 4;
const mixedPhaseXY = new Float32Array(mixedPhaseVertexCount * 2);
for (let segment = 0; segment < mixedPhaseSolidVertexCount / 2; segment++) {
  const offset = segment * 4;
  mixedPhaseXY[offset] = 0;
  mixedPhaseXY[offset + 1] = 0;
  mixedPhaseXY[offset + 2] = 0.01;
  mixedPhaseXY[offset + 3] = 0;
}
mixedPhaseXY.set([1, 2, 1.1, 2, 1.2, 2, 1.3, 2], mixedPhaseSolidVertexCount * 2);
const mixedPhaseDistances = new Float32Array(mixedPhaseVertexCount);
mixedPhaseDistances.set([30, 40, 55, 65], mixedPhaseSolidVertexCount);
const mixedPhaseMeta = new TextEncoder().encode(JSON.stringify({
  drawCommands: [
    { kind: "line", firstVertex: 0, vertexCount: mixedPhaseSolidVertexCount, alpha: 1 },
    {
      kind: "line",
      firstVertex: mixedPhaseSolidVertexCount,
      vertexCount: 4,
      alpha: 1,
      dashStyle: { pattern: [10, -5] },
      pathDistanceRequired: true,
    },
  ],
}));
const mixedPhaseBytes = buildSceneChunk([
  { tag: SceneTag.META, scalarType: SceneScalarType.U8, componentCount: 1, elementCount: mixedPhaseMeta.length, data: mixedPhaseMeta },
  { tag: SceneTag.ORIGIN, scalarType: SceneScalarType.F64, componentCount: 2, elementCount: 1, data: new Float64Array([0, 0]) },
  { tag: SceneTag.XY, scalarType: SceneScalarType.F32, componentCount: 2, elementCount: mixedPhaseVertexCount, data: mixedPhaseXY },
  { tag: SceneTag.PATH_DISTANCE, scalarType: SceneScalarType.F32, componentCount: 1, elementCount: mixedPhaseVertexCount, data: mixedPhaseDistances },
]);
const exactMixedPhase = unpackSceneChunk("mixed-phase-overview", mixedPhaseBytes);
const compactMixedPhase = unpackSceneChunk("mixed-phase-overview", mixedPhaseBytes, {
  compactPositions: true,
  overviewUnitsPerCssPixel: 1,
});
assert.ok((compactMixedPhase.overviewLod?.collapsedSegmentCount ?? 0) > 0,
  "phase-bearing chunks still compact independent solid overview linework");
assert.ok(compactMixedPhase.xyArray.length < exactMixedPhase.xyArray.length,
  "phase-bearing chunks reduce the persistent position payload without dropping dashed geometry");
assert.ok(compactMixedPhase.pathDistancesArray instanceof Float32Array,
  "overview compaction returns a path-distance payload aligned to its compacted vertices");
assert.equal(compactMixedPhase.pathDistancesArray.length, compactMixedPhase.xyArray.length / 2,
  "remapped path-distance values have one value for each output vertex");
const exactMixedPhaseCommand = exactMixedPhase.meta!.drawCommands.find((command: any) => command.pathDistanceRequired)!;
const compactMixedPhaseCommand = compactMixedPhase.meta!.drawCommands.find((command: any) => command.pathDistanceRequired)!;
assert.equal(compactMixedPhaseCommand.vertexCount, exactMixedPhaseCommand.vertexCount,
  "phase-bearing source line retains its full vertex sequence");
const decodedMixedPhaseXY = decodeCadV2PositionArray(compactMixedPhase.xyArray, compactMixedPhase.positionCodec);
for (let vertex = 0; vertex < exactMixedPhaseCommand.vertexCount; vertex++) {
  const exactVertex = exactMixedPhaseCommand.firstVertex + vertex;
  const compactVertex = compactMixedPhaseCommand.firstVertex + vertex;
  assert.ok(Math.abs(decodedMixedPhaseXY[compactVertex * 2]! - exactMixedPhase.xyArray[exactVertex * 2]!) <=
    (compactMixedPhase.positionCodec?.maxWorldError ?? 0),
  "phase-bearing line coordinates survive solid-line compaction and position encoding");
  assert.ok(Math.abs(decodedMixedPhaseXY[compactVertex * 2 + 1]! - exactMixedPhase.xyArray[exactVertex * 2 + 1]!) <=
    (compactMixedPhase.positionCodec?.maxWorldError ?? 0),
  "phase-bearing line coordinates survive solid-line compaction and position encoding");
  assert.equal(compactMixedPhase.pathDistancesArray[compactVertex], exactMixedPhase.pathDistancesArray![exactVertex],
    "shader dash phase values remain exact after output-vertex remapping");
}
assert.ok(((compactMixedPhase.overviewLod?.maxCenterlineDeviationCssPixels ?? 0) +
  (compactMixedPhase.positionCodec?.maxWorldError ?? 0)) * 4 <= 0.25,
"phase-aware overview compaction stays inside the combined 0.25 CSS px error budget through 4x zoom");

const fallbackScene = compileLine("DASH", 0.5);
const fallbackChunkId = fallbackScene.manifest.chunks[0]!.chunkId;
const fallbackBytes = fallbackScene.chunks.get(fallbackChunkId)!;
const fallbackRaw = parseSceneChunk(fallbackBytes);
const fallbackPath = fallbackRaw.sections.get(SceneTag.PATH_DISTANCE)!.data as Float32Array;
const fallbackUnpacked = unpackSceneChunk(fallbackChunkId, fallbackBytes);
assert.ok(fallbackUnpacked.meta?.drawCommands?.every((command: any) => !command.dashStyle),
  "wide dashed strokes use the already-tessellated CPU geometry path");
assert.ok(fallbackUnpacked.meta?.drawCommands?.some((command: any) => command.pathDistanceRequired),
  "CPU fallback metadata records that its source dash phase is preserved in the scene payload");
assert.ok(fallbackUnpacked.vertexCount > 2,
  "CPU fallback carries separate on-stroke vertices with geometric dash gaps");
assert.ok(fallbackUnpacked.pathDistancesArray instanceof Float32Array,
  "worker exposes the source phase array before host admission");
assert.equal(releaseUnusedCadV2PathDistances(fallbackUnpacked), fallbackPath.byteLength,
  "host releases the phase buffer after confirming the CPU dash geometry is already encoded");
assert.equal(fallbackUnpacked.pathDistancesArray, null,
  "CPU-dashed fallback keeps its rendered stroke geometry without retaining an unused phase array");
assert.equal(releaseUnusedCadV2PathDistances(fallbackUnpacked), 0,
  "phase-buffer release is idempotent");

const dashedCircleDocument: CadCanonicalDocument = {
  sourceVersionKey: "worker-buffer-cpu-dash-circle",
  sourceSha256: "worker-buffer-cpu-dash-circle",
  acadVersion: "AC1032",
  codepage: "UTF-8",
  units: 4,
  measurement: 1,
  layers: {
    "0": {
      id: "0", name: "0", visible: true, frozen: false, locked: false,
      color: { method: "aci", aci: 7 }, lineweightMm: 0.5, linetypeName: "DASH",
    },
  },
  linetypes: { DASH: { id: "DASH", name: "DASH", pattern: [10, -10], totalLength: 20 } },
  textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {},
  diagnostics: [],
  modelSpaceEntities: [{
    type: "CIRCLE", handle: "CPU_DASH_CIRCLE", layer: "0", order: 1n,
    center: [0, 0], radius: 50, lineweightMm: 0.5, linetype: "DASH",
  } as any],
};
const circleScene = compileCanonicalToScene(dashedCircleDocument, { sceneId: "worker_buffer_cpu_dash_circle" });
const circleChunkId = circleScene.manifest.chunks[0]!.chunkId;
const circleUnpacked = unpackSceneChunk(circleChunkId, circleScene.chunks.get(circleChunkId)!, { compactPositions: true });
assert.ok(circleUnpacked.curveDataArray && circleUnpacked.meta?.curveSourceRefs?.length,
  "CPU-dashed analytic circle retains its source intervals for view-dependent curve refinement");
assert.ok(circleUnpacked.meta.drawCommands.every((command: any) => !command.dashStyle),
  "lineweight fallback encodes dash gaps in the geometry rather than the shader");
assert.ok(releaseUnusedCadV2PathDistances(circleUnpacked) > 0,
  "CPU-dashed analytic fallback releases phase values after preserving its tessellated source geometry");
const circleRefinement = refineUnpackedChunkCurves(circleUnpacked, {
  targetErrorCssPixels: 0.25,
  unitsPerCssPixel: 0.05,
  maxTransformSingularValue: 1,
});
assert.equal(circleRefinement.errorBoundMet, true,
  "runtime refinement accepts the compact CPU-dashed source without a phase array");
const refinedCircle = applyCurveRefinementsToChunk(circleUnpacked, circleRefinement);
assert.ok(refinedCircle.xyArray instanceof Float32Array && refinedCircle.positionCodec === undefined,
  "curve replacement decodes compact fallback positions before assembling accurate Float32 geometry");
assert.equal(refinedCircle.pathDistancesArray, null,
  "curve refinement does not recreate a path phase payload unused by the renderer");
let retainedDashGap = false;
for (let index = 0; index + 7 < refinedCircle.xyArray.length; index += 4) {
  const gap = Math.hypot(
    refinedCircle.xyArray[index + 4]! - refinedCircle.xyArray[index + 2]!,
    refinedCircle.xyArray[index + 5]! - refinedCircle.xyArray[index + 3]!,
  );
  if (gap > 1) retainedDashGap = true;
}
assert.ok(retainedDashGap,
  "CPU fallback geometry still contains real dash gaps after high-detail analytic curve refinement");

console.log("PASS: scene worker compacts lossless geometry buffers and retains required dash phase only");
