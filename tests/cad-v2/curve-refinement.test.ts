import assert from "node:assert/strict";
import type { CadCanonicalDocument, CadHatchEntity, CadSplineEntity } from "../../src/lib/cad-v2/canonical/types";
import { EntityVisitor } from "../../src/lib/cad-v2/compile/entity-visitor";
import { GeometryCompiler } from "../../src/lib/cad-v2/compile/geometry-compiler";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { SceneTag, parseSceneChunk } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { refineCurveSourceIntervals, type CurveSourceRef, type RefinedCurveInterval } from "../../src/lib/cad-v2/worker/curve-refinement";
import { applyCurveRefinementsToChunk } from "../../src/lib/cad-v2/worker/apply-curve-refinements";
import { refineUnpackedChunkCurves, unpackSceneChunk } from "../../src/workers/cad-v2/cad-v2-scene-worker";

function near(actual: number, expected: number, tolerance: number, message: string): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} ≠ ${expected}`);
}

function distanceToSegment(point: readonly [number, number], a: readonly [number, number], b: readonly [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSquared));
  return Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy);
}

function maximumOracleError(
  coordinates: Float32Array,
  basis: readonly [number, number, number, number],
  start: number,
  end: number,
  center: readonly [number, number] = [0, 0],
): number {
  let maximum = 0;
  for (let sample = 0; sample <= 20_000; sample++) {
    const t = start + (end - start) * sample / 20_000;
    const point: [number, number] = [center[0] + basis[0] * Math.cos(t) + basis[2] * Math.sin(t), center[1] + basis[1] * Math.cos(t) + basis[3] * Math.sin(t)];
    let nearest = Infinity;
    for (let index = 0; index + 3 < coordinates.length; index += 2) {
      nearest = Math.min(nearest, distanceToSegment(point, [coordinates[index]!, coordinates[index + 1]!], [coordinates[index + 2]!, coordinates[index + 3]!]));
    }
    maximum = Math.max(maximum, nearest);
  }
  return maximum;
}

function maximumAppliedChunkScreenErrorCssPixels(
  xyArray: Float32Array,
  chunkOrigin: readonly [number, number],
  cameraCenter: readonly [number, number],
  exactCenterLocal: readonly [number, number],
  exactRadius: number,
  unitsPerCssPixel: number,
  maxTransformSingularValue: number,
): number {
  const cameraRelativeOffset: [number, number] = [
    Math.fround(chunkOrigin[0] - cameraCenter[0]),
    Math.fround(chunkOrigin[1] - cameraCenter[1]),
  ];
  const toCss = (x: number, y: number): [number, number] => [
    (x + cameraRelativeOffset[0]) * maxTransformSingularValue / unitsPerCssPixel,
    (y + cameraRelativeOffset[1]) * maxTransformSingularValue / unitsPerCssPixel,
  ];
  let maximum = 0;
  for (let sample = 0; sample <= 20_000; sample++) {
    const angle = Math.PI * 2 * sample / 20_000;
    const point = toCss(
      exactCenterLocal[0] + exactRadius * Math.cos(angle),
      exactCenterLocal[1] + exactRadius * Math.sin(angle),
    );
    let nearest = Infinity;
    // Renderer line buffers are endpoint pairs, with each segment occupying four XY values.
    for (let index = 0; index + 3 < xyArray.length; index += 4) {
      const a = toCss(xyArray[index]!, xyArray[index + 1]!);
      const b = toCss(xyArray[index + 2]!, xyArray[index + 3]!);
      nearest = Math.min(nearest, distanceToSegment(point, a, b));
    }
    maximum = Math.max(maximum, nearest);
  }
  return maximum;
}

function evaluateRationalBezier(
  controlPoints: readonly (readonly [number, number])[],
  weights: readonly number[],
  t: number,
): [number, number] {
  let level = controlPoints.map((point, index) => [
    point[0] * weights[index]!, point[1] * weights[index]!, weights[index]!,
  ] as [number, number, number]);
  while (level.length > 1) {
    const next: Array<[number, number, number]> = [];
    for (let index = 0; index + 1 < level.length; index++) {
      next.push([
        level[index]![0] * (1 - t) + level[index + 1]![0] * t,
        level[index]![1] * (1 - t) + level[index + 1]![1] * t,
        level[index]![2] * (1 - t) + level[index + 1]![2] * t,
      ]);
    }
    level = next;
  }
  return [level[0]![0] / level[0]![2], level[0]![1] / level[0]![2]];
}

function maximumSplineOracleError(
  coordinates: Float32Array,
  controlPoints: readonly (readonly [number, number])[],
  weights: readonly number[],
): number {
  let maximum = 0;
  for (let sample = 0; sample <= 20_000; sample++) {
    const point = evaluateRationalBezier(controlPoints, weights, sample / 20_000);
    let nearest = Infinity;
    for (let index = 0; index + 3 < coordinates.length; index += 2) {
      nearest = Math.min(nearest, distanceToSegment(point,
        [coordinates[index]!, coordinates[index + 1]!], [coordinates[index + 2]!, coordinates[index + 3]!]));
    }
    maximum = Math.max(maximum, nearest);
  }
  return maximum;
}

function appliedSpanPoints(
  xyArray: Float32Array,
  interval: RefinedCurveInterval,
  intervals: readonly RefinedCurveInterval[],
): Float32Array {
  const precedingVertexDelta = intervals
    .filter((candidate) => candidate.firstVertex < interval.firstVertex && candidate.status === "refined" &&
      candidate.errorBoundMet && candidate.coordinates instanceof Float32Array && candidate.segmentCount > 0)
    .reduce((sum, candidate) => sum + candidate.segmentCount * 2 - candidate.vertexCount, 0);
  const firstFloat = (interval.firstVertex + precedingVertexDelta) * 2;
  const pairCoordinates = xyArray.subarray(firstFloat, firstFloat + interval.segmentCount * 4);
  assert.equal(pairCoordinates.length, interval.segmentCount * 4,
    `applied interval ${interval.curveId} stays within the rewritten renderer buffer`);
  const points = new Float32Array((interval.segmentCount + 1) * 2);
  points[0] = pairCoordinates[0]!;
  points[1] = pairCoordinates[1]!;
  for (let segment = 0; segment < interval.segmentCount; segment++) {
    const pairOffset = segment * 4;
    assert.equal(pairCoordinates[pairOffset]!, points[segment * 2]!,
      `applied segment ${segment} starts at the prior endpoint for ${interval.curveId}`);
    assert.equal(pairCoordinates[pairOffset + 1]!, points[segment * 2 + 1]!,
      `applied segment ${segment} shares the prior endpoint for ${interval.curveId}`);
    points[segment * 2 + 2] = pairCoordinates[pairOffset + 2]!;
    points[segment * 2 + 3] = pairCoordinates[pairOffset + 3]!;
  }
  return points;
}

function buildDocument(): CadCanonicalDocument {
  return {
    sourceVersionKey: "f07-runtime-refinement-source",
    sourceSha256: "f07-runtime-refinement-source",
    acadVersion: "AC1032",
    codepage: "UTF-8",
    units: 4,
    measurement: 1,
    layers: {
      CURVE: {
        id: "CURVE", name: "CURVE", visible: true, frozen: false, locked: false,
        color: { method: "rgb", rgb: [28, 104, 219] }, lineweightMm: 0.35, linetypeName: "CONTINUOUS",
      },
    },
    linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {}, diagnostics: [],
    modelSpaceEntities: [{
      handle: "ARC_CW", type: "ARC", layer: "CURVE", order: BigInt(10), center: [25, -15], radius: 10,
      startAngleRad: 5.8, endAngleRad: 0.7, isClockwise: true,
    }],
  };
}

function testCompilerSidecarToRefinementOracle(): void {
  const scene = compileCanonicalToScene(buildDocument(), { sceneId: "scene_f07_runtime_refine" });
  const ref = scene.manifest.chunks.find((entry) => entry.layoutId === "Model");
  assert.ok(ref, "compiler emitted the model chunk");
  const raw = parseSceneChunk(scene.chunks.get(ref.chunkId)!);
  const curveData = raw.sections.get(SceneTag.CURVE_DATA)?.data as Float32Array | undefined;
  const xy = raw.sections.get(SceneTag.XY)?.data as Float32Array;
  const meta = JSON.parse(new TextDecoder().decode(raw.sections.get(SceneTag.META)!.data as Uint8Array));
  assert.ok(curveData && Array.isArray(meta.curveSourceRefs), "compiled ARC carries the analytic source sidecar");

  const unpacked = unpackSceneChunk(ref.chunkId, scene.chunks.get(ref.chunkId)!);
  const result = refineUnpackedChunkCurves(unpacked, {
    targetErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.01,
    maxTransformSingularValue: 1,
  });
  assert.equal(result.errorBoundMet, true, "refined arc meets CSS-pixel budget including Float32 quantization");
  assert.equal(result.intervals.length, 1, "continuous ARC compiles into one refinable source interval");
  const interval = result.intervals[0]!;
  assert.ok(interval.coordinates && interval.segmentCount >= 2, "runtime evaluator emits refined Float32 coordinates");
  assert.ok(interval.segmentCount > interval.sourceSegmentCount, "fine view produces more chords than the initial scene");
  const first = interval.firstVertex * 2;
  const last = (interval.firstVertex + interval.vertexCount - 1) * 2;
  assert.ok(Math.abs(interval.coordinates[0]! - xy[first]!) < 1e-5 && Math.abs(interval.coordinates[1]! - xy[first + 1]!) < 1e-5,
    "refined interval preserves first fallback endpoint exactly within Float32 tolerance");
  const end = interval.coordinates.length - 2;
  assert.ok(Math.abs(interval.coordinates[end]! - xy[last]!) < 1e-5 && Math.abs(interval.coordinates[end + 1]! - xy[last + 1]!) < 1e-5,
    "refined interval preserves final fallback endpoint exactly within Float32 tolerance");
  const measured = maximumOracleError(interval.coordinates, [10, 0, 0, 10], curveData[6]!, curveData[7]!, [curveData[0]!, curveData[1]!]);
  assert.ok(measured / 0.01 <= 0.2501, `dense independent arc oracle stays within 0.25 CSS px; measured ${measured / 0.01}`);
  assert.equal(result.totalOutputBytes, interval.coordinates.byteLength, "output allocation accounting is exact");
}

function testAppliedRefinementBufferMeetsProjectedScreenError(): void {
  const exactCenter: [number, number] = [1_000_000_025, -1_000_000_015];
  const exactRadius = 10;
  const document = buildDocument();
  document.modelSpaceEntities = [{
    handle: "APPLIED_CIRCLE", type: "CIRCLE", layer: "CURVE", order: BigInt(11),
    center: exactCenter, radius: exactRadius,
  }];
  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_applied_refinement" });
  const manifestChunk = scene.manifest.chunks.find((entry) => entry.layoutId === "Model");
  assert.ok(manifestChunk, "compiler emitted the circle model chunk");
  const sourceChunk = unpackSceneChunk(manifestChunk.chunkId, scene.chunks.get(manifestChunk.chunkId)!);
  const targetErrorCssPixels = 0.25;
  const unitsPerCssPixel = 0.01;
  const maxTransformSingularValue = 1;
  const result = refineUnpackedChunkCurves(sourceChunk, {
    targetErrorCssPixels, unitsPerCssPixel, maxTransformSingularValue,
  });
  assert.equal(result.errorBoundMet, true, "worker only reports success when the output profile fits its screen budget");
  assert.equal(result.intervals.length, 1, "single source circle creates one runtime refinement interval");
  const interval = result.intervals[0]!;
  assert.ok(interval.coordinates && interval.coordinates instanceof Float32Array,
    "runtime refinement emits the Float32 coordinates consumed by the renderer");

  const applied = applyCurveRefinementsToChunk(sourceChunk, result);
  assert.notEqual(applied, sourceChunk, "the accepted worker result replaces fallback geometry in a new chunk");
  assert.equal(applied.xyArray.length, interval.segmentCount * 4,
    "applied chunk contains the refined renderer endpoint-pair buffer");
  assert.equal(applied.vertexCount, interval.segmentCount * 2,
    "applied vertex count matches emitted refined chords");

  // Mirror CadV2Renderer's chunk-group camera-relative offset before CSS projection.
  // Keeping the camera near the billion-unit model origin also exercises chunk-local precision.
  const cameraCenter: [number, number] = [exactCenter[0] + 3.25, exactCenter[1] - 4.5];
  const exactCenterLocal: [number, number] = [
    exactCenter[0] - sourceChunk.origin[0],
    exactCenter[1] - sourceChunk.origin[1],
  ];
  const measuredCssError = maximumAppliedChunkScreenErrorCssPixels(
    applied.xyArray,
    sourceChunk.origin,
    cameraCenter,
    exactCenterLocal,
    exactRadius,
    unitsPerCssPixel,
    maxTransformSingularValue,
  );
  assert.ok(measuredCssError <= targetErrorCssPixels + 0.001,
    `post-apply Float32 renderer buffer stays within ${targetErrorCssPixels} CSS px; measured ${measuredCssError}`);
  assert.ok(interval.conservativeErrorCssPixels + 1e-9 >= measuredCssError,
    "worker's reported conservative error covers the independently measured applied-buffer deviation");
}

function testCompiledEllipseSidecarAndRuntimeRefinement(): void {
  const document = buildDocument();
  document.modelSpaceEntities = [{
    handle: "ELLIPSE_1", type: "ELLIPSE", layer: "CURVE", order: BigInt(20),
    center: [125, -40], majorAxisVector: [20, 5], axisRatio: 0.35,
    startParam: 5.7, endParam: 0.8,
  }];
  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_runtime_ellipse" });
  const manifestChunk = scene.manifest.chunks.find((entry) => entry.layoutId === "Model");
  assert.ok(manifestChunk, "compiler emits the ellipse model chunk");
  const bytes = scene.chunks.get(manifestChunk.chunkId)!;
  const raw = parseSceneChunk(bytes);
  const curveData = raw.sections.get(SceneTag.CURVE_DATA)?.data as Float32Array | undefined;
  const meta = JSON.parse(new TextDecoder().decode(raw.sections.get(SceneTag.META)!.data as Uint8Array));
  assert.ok(curveData && Array.isArray(meta.curveSourceRefs), "compiled ELLIPSE carries the analytic sidecar");
  assert.equal(meta.curveSourceRefs.length, 1, "ellipse chord sequence is retained as one continuous analytic interval");
  assert.equal(meta.curveSourceRefs[0].sourceType, "ELLIPSE", "source identity preserves the original CAD entity type");

  const unpacked = unpackSceneChunk(manifestChunk.chunkId, bytes);
  const result = refineUnpackedChunkCurves(unpacked, {
    targetErrorCssPixels: 0.2, unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  });
  assert.equal(result.errorBoundMet, true, "runtime ellipse refinement meets the screen-space error contract");
  assert.equal(result.intervals.length, 1);
  const interval = result.intervals[0]!;
  assert.ok(interval.coordinates && interval.segmentCount > interval.sourceSegmentCount,
    "runtime refinement increases ellipse tessellation for a close view");
  const center: [number, number] = [curveData[0]!, curveData[1]!];
  const basis: [number, number, number, number] = [curveData[2]!, curveData[3]!, curveData[4]!, curveData[5]!];
  const measured = maximumOracleError(interval.coordinates, basis, curveData[6]!, curveData[7]!, center);
  assert.ok(measured / 0.01 <= 0.2001, `independent ellipse oracle stays inside 0.2 CSS px; measured ${measured / 0.01}`);
  const xy = raw.sections.get(SceneTag.XY)!.data as Float32Array;
  const firstVertexOffset = interval.firstVertex * 2;
  const lastVertexOffset = (interval.firstVertex + interval.vertexCount - 1) * 2;
  assert.ok(Math.abs(interval.coordinates[0]! - xy[firstVertexOffset]!) < 1e-4 &&
    Math.abs(interval.coordinates[1]! - xy[firstVertexOffset + 1]!) < 1e-4,
  "ellipse refinement preserves the first fallback endpoint");
  const lastCoordinate = interval.coordinates.length - 2;
  assert.ok(Math.abs(interval.coordinates[lastCoordinate]! - xy[lastVertexOffset]!) < 1e-4 &&
    Math.abs(interval.coordinates[lastCoordinate + 1]! - xy[lastVertexOffset + 1]!) < 1e-4,
  "ellipse refinement preserves the final fallback endpoint including wrapped parameter ranges");
}

function testCompiledPolylineBulgeSidecarAndRuntimeRefinement(): void {
  const document = buildDocument();
  document.modelSpaceEntities = [{
    handle: "PLINE_BULGE", type: "LWPOLYLINE", layer: "CURVE", order: BigInt(30), isClosed: false,
    vertices: [
      { x: 0, y: 0, bulge: Math.tan(Math.PI / 8) },
      { x: 10, y: 0, bulge: -Math.tan(Math.PI / 8) },
      { x: 20, y: 0 },
    ],
  }];
  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_runtime_bulge" });
  const manifestChunk = scene.manifest.chunks.find((entry) => entry.layoutId === "Model");
  assert.ok(manifestChunk, "compiler emits the bulge polyline model chunk");
  const bytes = scene.chunks.get(manifestChunk.chunkId)!;
  const raw = parseSceneChunk(bytes);
  const curveData = raw.sections.get(SceneTag.CURVE_DATA)?.data as Float32Array | undefined;
  const meta = JSON.parse(new TextDecoder().decode(raw.sections.get(SceneTag.META)!.data as Uint8Array));
  assert.ok(curveData && Array.isArray(meta.curveSourceRefs), "bulged LWPOLYLINE carries analytic source metadata");
  assert.equal(meta.curveSourceRefs.length, 2, "each bulge segment is a separate analytic source interval");
  assert.equal(meta.curveSourceRefs[0].sourceType, "BULGE", "polyline arc provenance is explicit");
  assert.equal(meta.curveSourceRefs[0].sourceHandle, "PLINE_BULGE", "segment provenance retains parent polyline handle");
  assert.notEqual(meta.curveSourceRefs[0].curveId, meta.curveSourceRefs[1].curveId, "neighboring bulges have distinct stable identities");
  assert.ok(curveData[7]! > curveData[6]!, "positive bulge retains a positive signed sweep");
  assert.ok(curveData[15]! < curveData[14]!, "negative bulge retains a negative signed sweep");

  const unpacked = unpackSceneChunk(manifestChunk.chunkId, bytes);
  const result = refineUnpackedChunkCurves(unpacked, {
    targetErrorCssPixels: 0.2, unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  });
  assert.equal(result.errorBoundMet, true, "runtime bulge refinement meets its CSS-space error budget");
  assert.equal(result.intervals.length, 2);
  const xy = raw.sections.get(SceneTag.XY)!.data as Float32Array;
  for (const interval of result.intervals) {
    assert.ok(interval.coordinates && interval.segmentCount > interval.sourceSegmentCount,
      "close-view refinement increases tessellation of each source bulge arc");
    const record = interval.curveRecordIndex * 8;
    const center: [number, number] = [curveData[record]!, curveData[record + 1]!];
    const basis: [number, number, number, number] = [curveData[record + 2]!, curveData[record + 3]!, curveData[record + 4]!, curveData[record + 5]!];
    const measured = maximumOracleError(interval.coordinates, basis, curveData[record + 6]!, curveData[record + 7]!, center);
    assert.ok(measured / 0.01 <= 0.2001, `independent signed-bulge oracle stays inside 0.2 CSS px; measured ${measured / 0.01}`);
    const firstVertexOffset = interval.firstVertex * 2;
    const lastVertexOffset = (interval.firstVertex + interval.vertexCount - 1) * 2;
    assert.ok(Math.abs(interval.coordinates[0]! - xy[firstVertexOffset]!) < 1e-4 &&
      Math.abs(interval.coordinates[1]! - xy[firstVertexOffset + 1]!) < 1e-4,
    "bulge refinement preserves each original polyline start endpoint");
    const lastCoordinate = interval.coordinates.length - 2;
    assert.ok(Math.abs(interval.coordinates[lastCoordinate]! - xy[lastVertexOffset]!) < 1e-4 &&
      Math.abs(interval.coordinates[lastCoordinate + 1]! - xy[lastVertexOffset + 1]!) < 1e-4,
    "bulge refinement preserves each original polyline end endpoint");
  }

  const wideDocument = buildDocument();
  wideDocument.modelSpaceEntities = [{
    handle: "PLINE_WIDE", type: "LWPOLYLINE", layer: "CURVE", order: BigInt(31), isClosed: false, constantWidth: 2,
    vertices: [{ x: 0, y: 0, bulge: Math.tan(Math.PI / 8) }, { x: 10, y: 0 }],
  }];
  const wideScene = compileCanonicalToScene(wideDocument, { sceneId: "scene_f07_runtime_bulge_width" });
  const wideChunk = wideScene.manifest.chunks.find((entry) => entry.layoutId === "Model")!;
  const wideRaw = parseSceneChunk(wideScene.chunks.get(wideChunk.chunkId)!);
  assert.equal(wideRaw.sections.has(SceneTag.CURVE_DATA), false,
    "width-expanded polyline centerlines do not refine independently of their fixed-width fill mesh");
}

function testHatchArcBulgeAndEllipseSidecarsIncludingNestedInsert(): void {
  const document = buildDocument();
  const hatchBulge: CadHatchEntity = {
    handle: "HATCH_BULGE_RUNTIME", type: "HATCH", layer: "CURVE", order: BigInt(35), visible: true,
    patternName: "SOLID", isSolid: true,
    loops: [{
      isPolyline: true,
      vertices: [[0, 0], [20, 0], [20, -15]],
      bulges: [Math.tan(Math.PI / 8), 0, 0],
    }],
  };
  const hatchArc: CadHatchEntity = {
    handle: "HATCH_ARC_RUNTIME", type: "HATCH", layer: "CURVE", order: BigInt(36), visible: true,
    patternName: "SOLID", isSolid: true,
    loops: [{
      isPolyline: false,
      edges: [
        { type: "ARC", center: [50, 0], radius: 10, startAngleRad: 0, endAngleRad: Math.PI, ccw: true },
        { type: "LINE", start: [40, 0], end: [60, 0] },
      ],
    }],
  };
  const hatchEllipse: CadHatchEntity = {
    handle: "HATCH_ELLIPSE_RUNTIME", type: "HATCH", layer: "CURVE", order: BigInt(36), visible: true,
    patternName: "SOLID", isSolid: true,
    loops: [{
      isPolyline: false,
      edges: [
        { type: "ELLIPSE", center: [80, 0], majorAxisVector: [10, 0], axisRatio: 0.5,
          startParam: 0, endParam: Math.PI, ccw: true },
        { type: "LINE", start: [70, 0], end: [90, 0] },
      ],
    }],
  };
  const nestedHatch: CadHatchEntity = {
    handle: "HATCH_NESTED_ARC", type: "HATCH", layer: "0", order: BigInt(1), visible: true,
    patternName: "SOLID", isSolid: true,
    loops: [
      {
        isPolyline: false,
        edges: [
          { type: "ARC", center: [0, 0], radius: 8, startAngleRad: 0, endAngleRad: Math.PI, ccw: true },
          { type: "LINE", start: [-8, 0], end: [8, 0] },
        ],
      },
      {
        isPolyline: false,
        edges: [
          { type: "ELLIPSE", center: [30, 0], majorAxisVector: [8, 0], axisRatio: 0.5,
            startParam: 0, endParam: Math.PI, ccw: false },
          { type: "LINE", start: [22, 0], end: [38, 0] },
        ],
      },
    ],
  };
  document.blocks = {
    HATCH_BLOCK: { name: "HATCH_BLOCK", basePoint: [0, 0], entities: [nestedHatch] },
  };
  document.modelSpaceEntities = [
    hatchBulge,
    hatchArc,
    hatchEllipse,
    {
      handle: "NESTED_HATCH_INSERT", type: "INSERT", layer: "CURVE", order: BigInt(37),
      blockName: "HATCH_BLOCK", insertionPoint: [100, 40], scale: [-1.5, 0.5, 1], rotationRad: 0.3,
    },
  ];

  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_hatch_curve_runtime" });
  const manifestChunk = scene.manifest.chunks.find((entry) => entry.layoutId === "Model");
  assert.ok(manifestChunk, "compiler emits the HATCH model chunk");
  const bytes = scene.chunks.get(manifestChunk.chunkId)!;
  const raw = parseSceneChunk(bytes);
  const curveData = raw.sections.get(SceneTag.CURVE_DATA)?.data as Float32Array | undefined;
  const xy = raw.sections.get(SceneTag.XY)?.data as Float32Array;
  const origin = raw.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const meta = JSON.parse(new TextDecoder().decode(raw.sections.get(SceneTag.META)!.data as Uint8Array));
  const refs = meta.curveSourceRefs as CurveSourceRef[] | undefined;
  assert.ok(curveData && refs, "HATCH ARC/BULGE boundaries serialize analytic source metadata");
  assert.deepEqual(refs.map((ref) => ref.sourceType).sort(), ["ARC", "ARC", "BULGE", "ELLIPSE", "ELLIPSE"],
    "polyline bulge, edge ARC, and both direct/nested edge ELLIPSE sources retain explicit types");
  assert.equal(new Set(refs.map((ref) => ref.curveId)).size, 5, "loop/edge/INSERT path produces unique HATCH curve identities");
  assert.ok(refs.some((ref) => ref.sourceHandle === "HATCH_BULGE_RUNTIME"), "HATCH bulge provenance retains its source handle");
  const nestedRef = refs.find((ref) => ref.sourceHandle === "HATCH_NESTED_ARC");
  assert.ok(nestedRef?.curveId.includes("NESTED_HATCH_INSERT"), "nested HATCH curve identity includes the INSERT instance path");
  const directEllipseRef = refs.find((ref) => ref.sourceHandle === "HATCH_ELLIPSE_RUNTIME");
  const nestedEllipseRef = refs.find((ref) => ref.sourceHandle === "HATCH_NESTED_ARC" && ref.sourceType === "ELLIPSE");
  assert.ok(directEllipseRef && nestedEllipseRef?.curveId.includes("NESTED_HATCH_INSERT"),
    "top-level and nested HATCH ellipse provenance keeps its source and INSERT identity");
  assert.ok(raw.sections.has(SceneTag.TRIANGLES), "solid HATCH keeps its existing tessellated fill fallback");

  const nestedRecord = nestedRef!.curveRecordIndex * 8;
  near(curveData[nestedRecord]! + origin[0]!, 100, 1e-4, "nested HATCH arc center receives INSERT translation");
  near(curveData[nestedRecord + 1]! + origin[1]!, 40, 1e-4, "nested HATCH arc center receives INSERT translation");
  near(curveData[nestedRecord + 2]!, -12 * Math.cos(0.3), 1e-4, "nested HATCH arc major basis receives mirror/scale/rotation");
  near(curveData[nestedRecord + 3]!, -12 * Math.sin(0.3), 1e-4, "nested HATCH arc major basis receives mirror/scale/rotation");
  const nestedEllipseRecord = nestedEllipseRef!.curveRecordIndex * 8;
  near(curveData[nestedEllipseRecord + 6]!, 0, 1e-6, "clockwise nested HATCH ellipse starts at its canonical parameter");
  near(curveData[nestedEllipseRecord + 7]!, -Math.PI, 1e-5,
    "clockwise nested HATCH ellipse retains a negative signed sweep for runtime refinement");

  const unpacked = unpackSceneChunk(manifestChunk.chunkId, bytes);
  const result = refineUnpackedChunkCurves(unpacked, {
    targetErrorCssPixels: 0.2, unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  });
  assert.equal(result.errorBoundMet, true, "HATCH analytic boundaries refine within the bounded worker contract");
  assert.equal(result.intervals.length, refs.length, "worker refines each supported HATCH ARC/BULGE/ELLIPSE source interval");
  const applied = applyCurveRefinementsToChunk(unpacked, result);
  for (const interval of result.intervals) {
    assert.ok(interval.coordinates && interval.segmentCount > interval.sourceSegmentCount,
      "runtime HATCH boundary gains segments at the close-view tolerance");
    const record = interval.curveRecordIndex * 8;
    const center: [number, number] = [curveData[record]!, curveData[record + 1]!];
    const basis: [number, number, number, number] = [
      curveData[record + 2]!, curveData[record + 3]!, curveData[record + 4]!, curveData[record + 5]!,
    ];
    const measured = maximumOracleError(interval.coordinates, basis, curveData[record + 6]!, curveData[record + 7]!, center);
    assert.ok(measured / 0.01 <= 0.2001, `HATCH boundary dense oracle stays within 0.2 CSS px; measured ${measured / 0.01}`);
    const appliedPoints = appliedSpanPoints(applied.xyArray, interval, result.intervals);
    assert.deepEqual([...appliedPoints], [...interval.coordinates],
      "HATCH ARC/BULGE/ELLIPSE points survive renderer-buffer apply and vertex reindexing unchanged");
    const appliedMeasured = maximumOracleError(appliedPoints, basis,
      curveData[record + 6]!, curveData[record + 7]!, center) / 0.01;
    assert.ok(appliedMeasured <= 0.2001,
      `applied HATCH boundary buffer stays within 0.2 CSS px; measured ${appliedMeasured}`);
    assert.ok(interval.conservativeErrorCssPixels + 1e-9 >= appliedMeasured,
      "worker conservative CSS metric covers the applied HATCH boundary oracle");
    const firstFallback = interval.firstVertex * 2;
    const lastFallback = (interval.firstVertex + interval.vertexCount - 1) * 2;
    assert.ok(Math.hypot(interval.coordinates[0]! - xy[firstFallback]!, interval.coordinates[1]! - xy[firstFallback + 1]!) < 1e-4,
      "HATCH refinement preserves the first fallback endpoint");
    const final = interval.coordinates.length - 2;
    assert.ok(Math.hypot(interval.coordinates[final]! - xy[lastFallback]!, interval.coordinates[final + 1]! - xy[lastFallback + 1]!) < 1e-4,
      "HATCH refinement preserves the final fallback endpoint");
  }

  const directEllipseInterval = result.intervals.find((interval) => interval.curveId === directEllipseRef!.curveId)!;
  const directEllipseRecord = directEllipseInterval.curveRecordIndex * 8;
  const directEllipseMidParam = (curveData[directEllipseRecord + 6]! + curveData[directEllipseRecord + 7]!) / 2;
  assert.ok(Math.sin(directEllipseMidParam) > 0, "counterclockwise HATCH ellipse follows the upper half of its boundary");
  const nestedEllipseInterval = result.intervals.find((interval) => interval.curveId === nestedEllipseRef!.curveId)!;
  const nestedEllipseRecordIndex = nestedEllipseInterval.curveRecordIndex * 8;
  const nestedEllipseMidParam = (curveData[nestedEllipseRecordIndex + 6]! + curveData[nestedEllipseRecordIndex + 7]!) / 2;
  assert.ok(Math.sin(nestedEllipseMidParam) < 0, "clockwise nested HATCH ellipse follows the lower local half");

  const visitor = new EntityVisitor({ blocks: {}, layers: document.layers, linetypes: document.linetypes });
  const clipped = visitor.createEmptyResult();
  const clippedContext = visitor.createRootContext("CURVE", hatchArc.order);
  clippedContext.clipBoundary = {
    boundaryVertices: [[50, -2], [55, -2], [55, 12], [50, 12]],
    isClippingEnabled: true,
  };
  visitor.visitEntity(hatchArc, clippedContext, clipped);
  assert.ok(clipped.segments.length > 0, "XCLIP keeps visible HATCH boundary fragments");
  assert.ok(clipped.segments.every((segment) => segment.curveSource === undefined),
    "XCLIP fragments never claim the uncut HATCH ARC source interval");
}

function testHatchSplineBezierSidecarsAndBoundedWorkerRefinement(): void {
  const document = buildDocument();
  const splineEdge = {
    type: "SPLINE" as const,
    degree: 2,
    controlPoints: [[0, 0], [5, 9], [10, 0], [15, -9], [20, 0]] as [number, number][],
    knots: [0, 0, 0, 0.5, 0.5, 1, 1, 1],
    weights: [1, 0.6, 1, 1.4, 1],
    isRational: true,
  };
  const makeHatch = (handle: string): CadHatchEntity => ({
    handle, type: "HATCH", layer: "CURVE", order: BigInt(55), visible: true,
    patternName: "SOLID", isSolid: true,
    loops: [{
      isPolyline: false,
      edges: [
        splineEdge,
        { type: "LINE", start: [20, 0], end: [0, 0] },
      ],
    }],
  });
  const nestedHatch = makeHatch("HATCH_SPLINE_NESTED");
  document.blocks = {
    SPLINE_HATCH_BLOCK: { name: "SPLINE_HATCH_BLOCK", basePoint: [0, 0], entities: [nestedHatch] },
  };
  document.modelSpaceEntities = [
    makeHatch("HATCH_SPLINE_DIRECT"),
    {
      handle: "SPLINE_HATCH_INSERT", type: "INSERT", layer: "CURVE", order: BigInt(56),
      blockName: "SPLINE_HATCH_BLOCK", insertionPoint: [100, 40], scale: [-1.5, 0.5, 1], rotationRad: 0.3,
    },
  ];

  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_hatch_spline_runtime" });
  const manifestChunk = scene.manifest.chunks.find((entry) => entry.layoutId === "Model");
  assert.ok(manifestChunk, "compiler emits the HATCH SPLINE model chunk");
  const bytes = scene.chunks.get(manifestChunk.chunkId)!;
  const raw = parseSceneChunk(bytes);
  const curveData = raw.sections.get(SceneTag.CURVE_DATA)?.data as Float32Array | undefined;
  const xy = raw.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = raw.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const meta = JSON.parse(new TextDecoder().decode(raw.sections.get(SceneTag.META)!.data as Uint8Array));
  const refs = (meta.curveSourceRefs as CurveSourceRef[] | undefined)?.filter((ref) => ref.sourceType === "SPLINE");
  assert.ok(curveData && refs, "direct and nested HATCH spline knot spans serialize worker source data");
  assert.equal(refs.length, 4, "two Bezier knot spans are retained independently for both hatch instances");
  assert.equal(new Set(refs.map((ref) => ref.curveId)).size, refs.length, "HATCH loop, edge, span and INSERT path identities are unique");
  assert.equal(refs.filter((ref) => ref.sourceHandle === "HATCH_SPLINE_DIRECT").length, 2, "direct HATCH retains both spline spans");
  const nestedRef = refs.find((ref) => ref.sourceHandle === "HATCH_SPLINE_NESTED");
  assert.ok(nestedRef?.curveId.includes("SPLINE_HATCH_INSERT"), "nested spline source identity contains its INSERT path");
  for (const ref of refs) {
    assert.ok(ref.splineSource && ref.splineSource.controlPoints.length === 3,
      "each quadratic knot span carries its exact rational Bezier source once");
    const base = ref.curveRecordIndex * 8;
    near(curveData[base + 6]!, 0, 1e-6, "Bezier span source starts at normalized parameter zero");
    near(curveData[base + 7]!, 1, 1e-6, "Bezier span source ends at normalized parameter one");
  }
  const nestedControl = nestedRef!.splineSource!.controlPoints[0]!;
  near(nestedControl[0] + origin[0]!, 100, 1e-4, "nested spline source control point receives INSERT translation in X");
  near(nestedControl[1] + origin[1]!, 40, 1e-4, "nested spline source control point receives INSERT translation in Y");

  const unpacked = unpackSceneChunk(manifestChunk.chunkId, bytes);
  const result = refineUnpackedChunkCurves(unpacked, {
    targetErrorCssPixels: 0.2, unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  });
  assert.equal(result.errorBoundMet, true, "bounded worker spline refinement meets its CSS error budget");
  assert.equal(result.intervals.length, refs.length, "worker returns one refinement interval per analytic Bezier knot span");
  const applied = applyCurveRefinementsToChunk(unpacked, result);
  for (const interval of result.intervals) {
    const ref = refs.find((candidate) => candidate.curveId === interval.curveId)!;
    assert.ok(interval.coordinates && interval.segmentCount > interval.sourceSegmentCount,
      "close-view worker result refines each fallback spline span");
    const measuredWorld = maximumSplineOracleError(interval.coordinates,
      ref.splineSource!.controlPoints, ref.splineSource!.weights);
    assert.ok(measuredWorld / 0.01 <= 0.2001,
      `rational spline dense oracle stays within 0.2 CSS px; measured ${measuredWorld / 0.01}`);
    assert.ok(interval.conservativeErrorCssPixels <= 0.2, "worker reports a conservative spline hull bound");
    const appliedPoints = appliedSpanPoints(applied.xyArray, interval, result.intervals);
    assert.deepEqual([...appliedPoints], [...interval.coordinates],
      "direct and nested HATCH SPLINE Float32 points survive apply and vertex reindexing unchanged");
    const appliedMeasuredCss = maximumSplineOracleError(appliedPoints,
      ref.splineSource!.controlPoints, ref.splineSource!.weights) / 0.01;
    assert.ok(appliedMeasuredCss <= 0.2001,
      `applied HATCH SPLINE buffer stays within 0.2 CSS px; measured ${appliedMeasuredCss}`);
    assert.ok(interval.conservativeErrorCssPixels + 1e-9 >= appliedMeasuredCss,
      "worker conservative CSS metric covers the applied HATCH SPLINE oracle");
    const firstFallback = interval.firstVertex * 2;
    const lastFallback = (interval.firstVertex + interval.vertexCount - 1) * 2;
    assert.ok(Math.hypot(interval.coordinates[0]! - xy[firstFallback]!, interval.coordinates[1]! - xy[firstFallback + 1]!) < 1e-4,
      "spline runtime refinement preserves the first fallback endpoint");
    const final = interval.coordinates.length - 2;
    assert.ok(Math.hypot(interval.coordinates[final]! - xy[lastFallback]!, interval.coordinates[final + 1]! - xy[lastFallback + 1]!) < 1e-4,
      "spline runtime refinement preserves the final fallback endpoint");
  }

  const visitor = new EntityVisitor({ blocks: {}, layers: document.layers, linetypes: document.linetypes });
  const clipped = visitor.createEmptyResult();
  const clippedContext = visitor.createRootContext("CURVE", BigInt(55));
  clippedContext.clipBoundary = {
    boundaryVertices: [[0, -20], [10, -20], [10, 20], [0, 20]],
    isClippingEnabled: true,
  };
  visitor.visitEntity(makeHatch("HATCH_SPLINE_CLIPPED"), clippedContext, clipped);
  assert.ok(clipped.segments.length > 0, "XCLIP preserves visible HATCH spline fallback fragments");
  assert.ok(clipped.segments.every((segment) => segment.curveSource === undefined),
    "XCLIP spline fragments never claim a complete Bezier source interval");

  const capped = GeometryCompiler.triangulateHatch(makeHatch("HATCH_SPLINE_CAPPED"), 2, 1);
  assert.equal(capped.refinementLimitReached, true, "HATCH spline reports a tessellation work-cap miss");
  assert.ok(capped.boundaryLines.length > 0, "capped HATCH spline still retains its bounded fallback geometry");
  assert.ok(capped.boundaryLines.every((segment) => segment.curveSource === undefined),
    "partial capped spline tessellation does not produce a misleading analytic sidecar");
}

function testEntitySplineBezierSidecarsDirectNestedAndFailClosed(): void {
  const document = buildDocument();
  const makeSpline = (handle: string, order: bigint): CadSplineEntity => ({
    handle, type: "SPLINE", layer: "CURVE", order,
    degree: 2,
    controlPoints: [[0, 0], [5, 9], [10, 0], [15, -9], [20, 0]],
    knots: [0, 0, 0, 0.5, 0.5, 1, 1, 1],
    weights: [1, 0.6, 1, 1.4, 1],
    isRational: true,
    isPeriodic: false,
  });
  document.blocks = {
    ENTITY_SPLINE_BLOCK: {
      name: "ENTITY_SPLINE_BLOCK", basePoint: [0, 0],
      entities: [makeSpline("ENTITY_SPLINE_BLOCK_SOURCE", BigInt(1))],
    },
  };
  document.modelSpaceEntities = [
    makeSpline("ENTITY_SPLINE_DIRECT", BigInt(60)),
    {
      handle: "ENTITY_SPLINE_INSERT_A", type: "INSERT", layer: "CURVE", order: BigInt(61),
      blockName: "ENTITY_SPLINE_BLOCK", insertionPoint: [100, 40], scale: [-1.5, 0.5, 1], rotationRad: 0.3,
    },
    {
      handle: "ENTITY_SPLINE_INSERT_B", type: "INSERT", layer: "CURVE", order: BigInt(62),
      blockName: "ENTITY_SPLINE_BLOCK", insertionPoint: [-80, 25], scale: [0.75, 1.25, 1], rotationRad: -0.2,
    },
  ];

  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_entity_spline_runtime" });
  const manifestChunk = scene.manifest.chunks.find((entry) => entry.layoutId === "Model");
  assert.ok(manifestChunk, "compiler emits the direct and nested entity SPLINE model chunk");
  const bytes = scene.chunks.get(manifestChunk.chunkId)!;
  const raw = parseSceneChunk(bytes);
  const curveData = raw.sections.get(SceneTag.CURVE_DATA)?.data as Float32Array | undefined;
  const xy = raw.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = raw.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const meta = JSON.parse(new TextDecoder().decode(raw.sections.get(SceneTag.META)!.data as Uint8Array));
  const refs = (meta.curveSourceRefs as CurveSourceRef[] | undefined)?.filter((ref) => ref.sourceType === "SPLINE");
  assert.ok(curveData && refs, "entity SPLINE sources serialize CURVE_DATA and rational Bezier META payloads");
  assert.equal(refs.length, 6, "both knot spans survive for direct and repeated nested entity instances");
  assert.equal(new Set(refs.map((ref) => ref.curveId)).size, refs.length, "span and INSERT instance identities are unique");
  assert.equal(refs.filter((ref) => ref.sourceHandle === "ENTITY_SPLINE_DIRECT").length, 2,
    "direct entity SPLINE retains both knot-span sidecars");
  const nestedRefs = refs.filter((ref) => ref.sourceHandle === "ENTITY_SPLINE_BLOCK_SOURCE");
  assert.equal(nestedRefs.length, 4, "each nested INSERT instance retains both source knot spans");
  assert.ok(nestedRefs.some((ref) => ref.curveId.includes("ENTITY_SPLINE_INSERT_A")) &&
    nestedRefs.some((ref) => ref.curveId.includes("ENTITY_SPLINE_INSERT_B")),
  "nested spline identities include both INSERT paths");
  for (const ref of refs) {
    assert.ok(ref.splineSource && ref.splineSource.controlPoints.length === 3,
      "quadratic spline knot span carries its exact rational Bezier source");
    assert.equal(ref.splineSource.weights.length, 3, "rational weights stay aligned with Bezier controls");
    const base = ref.curveRecordIndex * 8;
    near(curveData[base + 6]!, 0, 1e-6, "Bezier knot-span sidecar starts at normalized parameter zero");
    near(curveData[base + 7]!, 1, 1e-6, "Bezier knot-span sidecar ends at normalized parameter one");
  }
  const firstNestedRef = nestedRefs.find((ref) => ref.curveId.includes("ENTITY_SPLINE_INSERT_A") && ref.curveId.endsWith("SPAN:0"));
  assert.ok(firstNestedRef, "first transformed INSERT has an identifiable first knot span");
  near(firstNestedRef.splineSource!.controlPoints[0]![0] + origin[0]!, 100, 1e-4,
    "nested Bezier control point receives the INSERT translation in X");
  near(firstNestedRef.splineSource!.controlPoints[0]![1] + origin[1]!, 40, 1e-4,
    "nested Bezier control point receives the INSERT translation in Y");

  const unpacked = unpackSceneChunk(manifestChunk.chunkId, bytes);
  const result = refineUnpackedChunkCurves(unpacked, {
    targetErrorCssPixels: 0.2, unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  });
  assert.equal(result.errorBoundMet, true, "direct and nested entity SPLINE worker refinements meet the bounded CSS error");
  assert.equal(result.intervals.length, refs.length, "worker returns a bounded interval for each entity knot span instance");
  const applied = applyCurveRefinementsToChunk(unpacked, result);
  for (const interval of result.intervals) {
    const source = refs.find((ref) => ref.curveId === interval.curveId)!.splineSource!;
    assert.ok(interval.coordinates, "worker emits refined coordinates for supported entity SPLINE spans");
    const oracleError = maximumSplineOracleError(interval.coordinates!, source.controlPoints, source.weights);
    assert.ok(oracleError / 0.01 <= 0.2001,
      `20k-sample rational Bezier oracle stays within 0.2 CSS px; measured ${oracleError / 0.01}`);
    const appliedPoints = appliedSpanPoints(applied.xyArray, interval, result.intervals);
    assert.deepEqual([...appliedPoints], [...interval.coordinates!],
      "direct and nested SPLINE Float32 points survive apply and vertex reindexing unchanged");
    const appliedOracleError = maximumSplineOracleError(appliedPoints, source.controlPoints, source.weights) / 0.01;
    assert.ok(appliedOracleError <= 0.2001,
      `applied rational SPLINE buffer stays within 0.2 CSS px; measured ${appliedOracleError}`);
    assert.ok(interval.conservativeErrorCssPixels + 1e-9 >= appliedOracleError,
      "worker conservative CSS metric covers the applied rational SPLINE oracle");
    const ref = refs.find((candidate) => candidate.curveId === interval.curveId)!;
    const first = ref.firstVertex * 2;
    const last = (ref.firstVertex + ref.vertexCount - 1) * 2;
    near(interval.coordinates![0]!, xy[first]!, 1e-4, "refined entity spline keeps the fallback start point");
    near(interval.coordinates![1]!, xy[first + 1]!, 1e-4, "refined entity spline keeps the fallback start point Y");
    const final = interval.coordinates!.length - 2;
    near(interval.coordinates![final]!, xy[last]!, 1e-4, "refined entity spline keeps the fallback end point");
    near(interval.coordinates![final + 1]!, xy[last + 1]!, 1e-4, "refined entity spline keeps the fallback end point Y");
  }

  const visitor = new EntityVisitor({ blocks: {}, layers: document.layers, linetypes: document.linetypes });
  const clipped = visitor.createEmptyResult();
  const clippedContext = visitor.createRootContext("CURVE", BigInt(60));
  clippedContext.clipBoundary = {
    boundaryVertices: [[0, -2], [10, -2], [10, 2], [0, 2]],
    isClippingEnabled: true,
  };
  visitor.visitEntity(makeSpline("ENTITY_SPLINE_CLIPPED", BigInt(63)), clippedContext, clipped);
  assert.ok(clipped.segments.length > 0, "XCLIP retains visible entity SPLINE fallback fragments");
  assert.ok(clipped.segments.every((segment) => segment.curveSource === undefined),
    "clipped entity SPLINE fragments do not claim complete source spans");

  const cappedDoc = buildDocument();
  cappedDoc.modelSpaceEntities = [makeSpline("ENTITY_SPLINE_CAPPED", BigInt(64))];
  const cappedScene = compileCanonicalToScene(cappedDoc, {
    sceneId: "scene_f07_entity_spline_capped", maxCurveSegments: 1,
  });
  const cappedManifest = cappedScene.manifest.chunks.find((entry) => entry.layoutId === "Model");
  assert.ok(cappedManifest, "segment-capped spline retains a model chunk");
  const cappedRaw = parseSceneChunk(cappedScene.chunks.get(cappedManifest.chunkId)!);
  const cappedMeta = JSON.parse(new TextDecoder().decode(cappedRaw.sections.get(SceneTag.META)!.data as Uint8Array));
  assert.equal((cappedMeta.curveSourceRefs as CurveSourceRef[] | undefined)?.filter((ref) => ref.sourceType === "SPLINE").length ?? 0, 0,
    "partial segment-capped tessellation does not publish entity SPLINE sidecars");
}

function testNestedInsertCircleAndArcCarryTransformedSidecars(): void {
  const document = buildDocument();
  document.blocks = {
    LEAF: {
      name: "LEAF", basePoint: [0, 0], entities: [
        { handle: "BLOCK_CIRCLE", type: "CIRCLE", layer: "0", order: BigInt(1), center: [2, 3], radius: 5 },
        { handle: "BLOCK_ARC", type: "ARC", layer: "0", order: BigInt(2), center: [-4, 1], radius: 7,
          startAngleRad: 5.7, endAngleRad: 0.8, isClockwise: true },
        { handle: "BLOCK_ELLIPSE", type: "ELLIPSE", layer: "0", order: BigInt(3), center: [1, -6],
          majorAxisVector: [6, 2], axisRatio: 0.25, startParam: 5.5, endParam: 0.7 },
        { handle: "BLOCK_BULGED_POLYLINE", type: "LWPOLYLINE", layer: "0", order: BigInt(4), isClosed: false,
          vertices: [
            { x: 0, y: 0, bulge: Math.tan(Math.PI / 8) },
            { x: 10, y: 0, bulge: -Math.tan(Math.PI / 8) },
            { x: 20, y: 0 },
          ] },
      ],
    },
    MID: {
      name: "MID", basePoint: [0, 0], entities: [
        { handle: "INNER_INSERT", type: "INSERT", layer: "0", order: BigInt(3), blockName: "LEAF",
          insertionPoint: [5, -2], scale: [2, 0.5, 1], rotationRad: 0.35 },
      ],
    },
  };
  document.modelSpaceEntities = [
    { handle: "OUTER_INSERT_A", type: "INSERT", layer: "CURVE", order: BigInt(40), blockName: "MID",
      insertionPoint: [100, 50], scale: [-1.5, 2, 1], rotationRad: 0.2 },
    { handle: "OUTER_INSERT_B", type: "INSERT", layer: "CURVE", order: BigInt(41), blockName: "MID",
      insertionPoint: [-20, 30], scale: [1, 0.75, 1], rotationRad: -0.45 },
  ];

  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_nested_transform" });
  const manifestChunk = scene.manifest.chunks.find((entry) => entry.layoutId === "Model");
  assert.ok(manifestChunk, "compiler emits the nested INSERT model chunk");
  const bytes = scene.chunks.get(manifestChunk.chunkId)!;
  const raw = parseSceneChunk(bytes);
  const curveData = raw.sections.get(SceneTag.CURVE_DATA)?.data as Float32Array | undefined;
  const xy = raw.sections.get(SceneTag.XY)?.data as Float32Array;
  const meta = JSON.parse(new TextDecoder().decode(raw.sections.get(SceneTag.META)!.data as Uint8Array));
  assert.ok(curveData && Array.isArray(meta.curveSourceRefs), "nested block curves retain transformed analytic sidecars");
  assert.equal(meta.curveSourceRefs.length, 10, "three analytic entities and two bulge spans are preserved for each INSERT instance");
  const refs = meta.curveSourceRefs as CurveSourceRef[];
  assert.deepEqual(refs.map((ref) => ref.sourceType).sort(), [
    "ARC", "ARC", "BULGE", "BULGE", "BULGE", "BULGE", "CIRCLE", "CIRCLE", "ELLIPSE", "ELLIPSE",
  ], "continuous ARC/CIRCLE/ELLIPSE and signed BULGE source types survive nested expansion");
  assert.equal(new Set(refs.map((ref) => ref.curveId)).size, 10,
    "curve identities include the complete INSERT instance path and cannot alias repeated block instances");
  assert.ok(refs.every((ref) => typeof ref.sourceQuantizationErrorWorld === "number" &&
    Number.isFinite(ref.sourceQuantizationErrorWorld) && ref.sourceQuantizationErrorWorld >= 0),
  "all transformed affine source intervals carry a finite conservative F32 input error");
  assert.equal(manifestChunk.maxCurveSourceQuantizationErrorWorld,
    Math.max(...refs.map((ref) => ref.sourceQuantizationErrorWorld!)),
  "chunk manifest bound equals the largest transformed source interval bound");

  const unpacked = unpackSceneChunk(manifestChunk.chunkId, bytes);
  const result = refineUnpackedChunkCurves(unpacked, {
    targetErrorCssPixels: 0.2, unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  });
  assert.equal(result.errorBoundMet, true, "transformed nested curves satisfy the bounded worker evaluator contract");
  assert.equal(result.intervals.length, refs.length, "worker refines every nested analytic entity and bulge source span");
  const applied = applyCurveRefinementsToChunk(unpacked, result);
  for (const interval of result.intervals) {
    const sourceRef = refs.find((ref) => ref.curveId === interval.curveId)!;
    assert.ok(interval.conservativeErrorCssPixels + 1e-12 >= sourceRef.sourceQuantizationErrorWorld! / 0.01,
      "runtime screen error includes the transformed source-sidecar quantization allowance");
    assert.ok(interval.coordinates && interval.segmentCount > interval.sourceSegmentCount,
      "nested source span is refined at the requested close-view tolerance");
    const record = interval.curveRecordIndex * 8;
    const center: [number, number] = [curveData[record]!, curveData[record + 1]!];
    const basis: [number, number, number, number] = [
      curveData[record + 2]!, curveData[record + 3]!, curveData[record + 4]!, curveData[record + 5]!,
    ];
    const measured = maximumOracleError(interval.coordinates, basis,
      curveData[record + 6]!, curveData[record + 7]!, center);
    assert.ok(measured / 0.01 <= 0.2001,
      `transformed nested curve meets 0.2 CSS px dense oracle; measured ${measured / 0.01}`);
    const appliedPoints = appliedSpanPoints(applied.xyArray, interval, result.intervals);
    assert.deepEqual([...appliedPoints], [...interval.coordinates],
      "the line endpoint-pair XY buffer consumed by rendering contains the worker's refined Float32 points");
    const appliedMeasured = maximumOracleError(appliedPoints, basis,
      curveData[record + 6]!, curveData[record + 7]!, center);
    assert.ok(appliedMeasured / 0.01 <= 0.2001,
      `nested/mirrored ${interval.sourceType} applied buffer stays within 0.2 CSS px; measured ${appliedMeasured / 0.01}`);
    assert.ok(interval.conservativeErrorCssPixels + 1e-9 >= appliedMeasured / 0.01,
      "worker conservative CSS metric covers the applied nested-curve oracle");
    const firstFallback = interval.firstVertex * 2;
    const lastFallback = (interval.firstVertex + interval.vertexCount - 1) * 2;
    assert.ok(Math.hypot(interval.coordinates[0]! - xy[firstFallback]!, interval.coordinates[1]! - xy[firstFallback + 1]!) < 1e-4,
      "transformed runtime span preserves its first fallback endpoint");
    const final = interval.coordinates.length - 2;
    assert.ok(Math.hypot(interval.coordinates[final]! - xy[lastFallback]!, interval.coordinates[final + 1]! - xy[lastFallback + 1]!) < 1e-4,
      "transformed runtime span preserves its final fallback endpoint");
  }
}

function testClippedPolylineBulgesDoNotCarryAnalyticSidecars(): void {
  const document = buildDocument();
  const visitor = new EntityVisitor({ blocks: document.blocks, layers: document.layers, linetypes: document.linetypes });
  const entity = {
    handle: "CLIPPED_BULGE", type: "LWPOLYLINE" as const, layer: "CURVE", order: BigInt(12), isClosed: false,
    vertices: [{ x: 0, y: 0, bulge: Math.tan(Math.PI / 8) }, { x: 10, y: 0 }],
  };
  const full = visitor.createEmptyResult();
  visitor.visitEntity(entity, visitor.createRootContext("CURVE", entity.order), full);

  const clipped = visitor.createEmptyResult();
  const clippedContext = visitor.createRootContext("CURVE", entity.order);
  clippedContext.clipBoundary = {
    boundaryVertices: [[0, -10], [5, -10], [5, 10], [0, 10]],
    isClippingEnabled: true,
  };
  visitor.visitEntity(entity, clippedContext, clipped);

  assert.ok(clipped.segments.length > 0 && clipped.segments.length < full.segments.length,
    "XCLIP removes the hidden portion while keeping visible fallback chord fragments");
  assert.ok(clipped.segments.every((segment) => segment.curveSource === undefined),
    "clipped bulge fragments never claim the complete analytic source interval");
}

function testConservativeAffineAndMirroredBounds(): void {
  const refs: CurveSourceRef[] = [
    { curveId: "ellipse", sourceHandle: "E1", sourceType: "ARC", firstSegmentIndex: 0, segmentCount: 1, curveRecordIndex: 0, firstVertex: 0, vertexCount: 2 },
    { curveId: "mirrored", sourceHandle: "E2", sourceType: "ARC", firstSegmentIndex: 0, segmentCount: 1, curveRecordIndex: 1, firstVertex: 2, vertexCount: 2 },
  ];
  const records = new Float32Array([
    0, 0, 14, 0, 0, 3, 0.2, 2.8,
    0, 0, -12, 0, 0, 2, 5.9, 0.4,
  ]);
  const refined = refineCurveSourceIntervals({
    curveData: records, curveSourceRefs: refs, fallbackVertexCount: 4,
    targetErrorCssPixels: 0.2, unitsPerCssPixel: 0.015, maxTransformSingularValue: 3,
  });
  assert.equal(refined.errorBoundMet, true, "nonuniform affine basis and mirrored sweep pass a conservative screen-space bound");
  const ellipse = refined.intervals[0]!;
  const mirror = refined.intervals[1]!;
  assert.ok(ellipse.coordinates && mirror.coordinates, "both affine and mirrored spans are evaluated");
  assert.ok(maximumOracleError(ellipse.coordinates, [14, 0, 0, 3], 0.2, 2.8) * 3 / 0.015 <= 0.2001,
    "dense affine ellipse oracle remains within CSS error budget");
  assert.ok(maximumOracleError(mirror.coordinates, [-12, 0, 0, 2], 5.9, 0.4) * 3 / 0.015 <= 0.2001,
    "dense mirrored clockwise oracle remains within CSS error budget");
}

function testCapsAndMalformedSourcesFailSafely(): void {
  const sourceRef: CurveSourceRef = {
    curveId: "cap", sourceHandle: "C1", sourceType: "CIRCLE", firstSegmentIndex: 0,
    segmentCount: 1, curveRecordIndex: 0, firstVertex: 0, vertexCount: 2,
  };
  const sourceData = new Float32Array([0, 0, 100, 0, 0, 100, 0, Math.PI * 2]);
  const capped = refineCurveSourceIntervals({
    curveData: sourceData, curveSourceRefs: [sourceRef], fallbackVertexCount: 2,
    targetErrorCssPixels: 1e-3, unitsPerCssPixel: 1, maxTransformSingularValue: 1,
    maxSegmentsPerInterval: 8, maxSegmentsTotal: 8,
  });
  assert.equal(capped.errorBoundMet, false, "segment cap cannot produce a false-exact result");
  assert.equal(capped.totalSegments, 8, "per-interval and total work cap are both honored");
  assert.equal(capped.intervals[0]!.status, "degraded", "capped output carries an explicit degraded status");
  assert.equal(capped.intervals[0]!.reason, "segment-cap");

  const lowPrecision = refineCurveSourceIntervals({
    curveData: new Float32Array([1e6, 1e6, 10, 0, 0, 10, 0, 1]),
    curveSourceRefs: [sourceRef], fallbackVertexCount: 2,
    targetErrorCssPixels: 1e-7, unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  });
  assert.equal(lowPrecision.intervals[0]!.reason, "float32-precision", "impossible output quantization budget fails closed to fallback geometry");
  assert.equal(lowPrecision.intervals[0]!.coordinates, null, "unrepresentable coordinates are never emitted");

  assert.throws(() => refineCurveSourceIntervals({
    curveData: sourceData, curveSourceRefs: [{ ...sourceRef, firstVertex: 1 }], fallbackVertexCount: 2,
    targetErrorCssPixels: 0.25, unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  }), /invalid record or fallback vertex range/, "out-of-range source references are rejected");
  assert.throws(() => refineCurveSourceIntervals({
    curveData: new Float32Array([0, 0, Number.NaN, 0, 0, 1, 0, 1]), curveSourceRefs: [sourceRef], fallbackVertexCount: 2,
    targetErrorCssPixels: 0.25, unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  }), /non-finite/, "non-finite sidecar data is rejected by the evaluator too");
  assert.throws(() => refineCurveSourceIntervals({
    curveData: sourceData, curveSourceRefs: [sourceRef], fallbackVertexCount: 2,
    targetErrorCssPixels: 0, unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  }), /finite and positive/, "zero CSS error budgets are rejected instead of becoming unbounded work");
}

function testRefinedSpansReplaceFallbackAndShiftPainterRanges(): void {
  const chunk = {
    chunkId: "chunk_0", origin: [0, 0] as [number, number],
    xyArray: new Float32Array([0, 0, 1, 0,  2, 0, 3, 0,  4, 0, 5, 0]),
    drawRunsArray: null, trianglesArray: new Float32Array(12),
    pathDistancesArray: new Float32Array([0, 1, 10, 11, 20, 21]), vertexCount: 6,
    meta: {
      drawCommands: [
        { kind: "line", layer: "A", color: [1, 0, 0], firstVertex: 0, vertexCount: 2, order: 1 },
        { kind: "line", layer: "CURVE", color: [0, 1, 0], firstVertex: 2, vertexCount: 2, order: 2, lineweightMm: 0.35 },
        { kind: "line", layer: "B", color: [0, 0, 1], firstVertex: 4, vertexCount: 2, order: 3 },
        { kind: "triangle", layer: "FILL", color: [1, 1, 0], firstVertex: 2, vertexCount: 6, order: 4 },
      ],
    },
  };
  const ref: CurveSourceRef = {
    curveId: "curve-1", sourceHandle: "C1", sourceType: "CIRCLE", firstSegmentIndex: 0,
    segmentCount: 1, curveRecordIndex: 0, firstVertex: 2, vertexCount: 2,
  };
  const result = refineCurveSourceIntervals({
    curveData: new Float32Array([0, 0, 1, 0, 0, 1, 0, Math.PI / 2]),
    curveSourceRefs: [ref], fallbackVertexCount: 6,
    targetErrorCssPixels: 0.1, unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  });
  const interval = result.intervals[0]!;
  // Force a small, deterministic 2-segment result while preserving the validated interval metadata.
  const deterministicResult = {
    ...result,
    intervals: [{ ...interval, coordinates: new Float32Array([2, 0, 2.2, 0.1, 3, 0]), segmentCount: 2, errorBoundMet: true, status: "refined" as const }],
  };
  const refined = applyCurveRefinementsToChunk(chunk, deterministicResult);
  const expectedRefinedXY = new Float32Array([0, 0, 1, 0, 2, 0, 2.2, 0.1, 2.2, 0.1, 3, 0, 4, 0, 5, 0]);
  assert.notEqual(refined, chunk, "a valid result produces a separate chunk instance");
  assert.deepEqual([...refined.xyArray], [...expectedRefinedXY],
    "the coarse chord is replaced by connected segment pairs while neighboring geometry stays intact");
  const commands = refined.meta!.drawCommands as Array<{ firstVertex: number; vertexCount: number; layer: string; order: number }>;
  assert.deepEqual(commands.map(({ firstVertex, vertexCount }) => [firstVertex, vertexCount]), [[0, 2], [2, 4], [6, 2], [2, 6]],
    "line painter ranges shift by the exact vertex delta while triangle offsets remain independent");
  assert.deepEqual(commands.map(({ layer, order }) => [layer, order]), [["A", 1], ["CURVE", 2], ["B", 3], ["FILL", 4]],
    "layer identity and painter order survive geometry replacement");
  assert.deepEqual(commands[3], { kind: "triangle", layer: "FILL", color: [1, 1, 0], firstVertex: 2, vertexCount: 6, order: 4 },
    "triangle commands keep their independent triangle-buffer offsets");
  const firstRefinedChordLength = Math.hypot(2.2 - 2, 0.1 - 0);
  const secondRefinedChordLength = Math.hypot(3 - 2.2, 0 - 0.1);
  const expectedIntermediatePhase = 10 + firstRefinedChordLength / (firstRefinedChordLength + secondRefinedChordLength);
  assert.equal(refined.pathDistancesArray![2], 10, "refined PATH_DISTANCE retains the fallback interval's starting phase");
  near(refined.pathDistancesArray![3]!, expectedIntermediatePhase, 1e-6,
    "intermediate path-distance phase is proportional to emitted Float32 chord length, not segment count");
  near(refined.pathDistancesArray![4]!, expectedIntermediatePhase, 1e-6,
    "adjacent refined segment endpoints share one continuous phase value");
  assert.equal(refined.pathDistancesArray![5], 11, "refined PATH_DISTANCE retains the fallback interval's ending phase");
  assert.deepEqual([...refined.pathDistancesArray!.slice(6)], [20, 21], "following path distances stay unchanged");
  assert.deepEqual([...chunk.xyArray], [0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0], "source fallback remains immutable for later zoom buckets");
  assert.deepEqual([...chunk.pathDistancesArray!], [0, 1, 10, 11, 20, 21], "source path-distance fallback remains immutable for later zoom buckets");

  assert.throws(() => applyCurveRefinementsToChunk(chunk, {
    ...deterministicResult,
    intervals: [{ ...deterministicResult.intervals[0]!, conservativeErrorCssPixels: Number.POSITIVE_INFINITY }],
  }), /invalid refined screen-space error result/, "an unbounded worker claim cannot reach the renderer buffer");
  assert.throws(() => applyCurveRefinementsToChunk(chunk, {
    ...deterministicResult,
    intervals: [{
      ...deterministicResult.intervals[0]!,
      coordinates: new Float32Array([2, 0, Number.NaN, 0.1, 3, 0]),
    }],
  }), /invalid refined screen-space error result/, "non-finite refined vertices cannot reach the renderer buffer");
}

testCompilerSidecarToRefinementOracle();
testAppliedRefinementBufferMeetsProjectedScreenError();
testCompiledEllipseSidecarAndRuntimeRefinement();
testCompiledPolylineBulgeSidecarAndRuntimeRefinement();
testHatchArcBulgeAndEllipseSidecarsIncludingNestedInsert();
testHatchSplineBezierSidecarsAndBoundedWorkerRefinement();
testEntitySplineBezierSidecarsDirectNestedAndFailClosed();
testNestedInsertCircleAndArcCarryTransformedSidecars();
testClippedPolylineBulgesDoNotCarryAnalyticSidecars();
testConservativeAffineAndMirroredBounds();
testCapsAndMalformedSourcesFailSafely();
testRefinedSpansReplaceFallbackAndShiftPainterRanges();
console.log("F07 bounded analytic worker curve refinement tests PASS");
