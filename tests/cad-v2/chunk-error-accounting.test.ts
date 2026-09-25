import assert from "node:assert/strict";
import type { CadBlockDefinition, CadCanonicalDocument, CadEntity, CadHatchEntity, CadInsertEntity, CadLwPolylineEntity, CadPoint2D, CadSplineEntity, CadTextEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { GeometryCompiler } from "../../src/lib/cad-v2/compile/geometry-compiler";
import { FontLayoutEngine } from "../../src/lib/cad-v2/text/font-layout-engine";
import { validateSceneManifest } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { refineCurveSourceIntervals, type CurveSourceRef } from "../../src/lib/cad-v2/worker/curve-refinement";
import { tessellateDashedArc, tessellateDashedCircle } from "../../src/lib/cad-v2/render/cad-stroke";
import { CAD_V2_COMPILER_REVISION } from "../../src/lib/cad-v2/version";

const ORIGIN = 1_000_000_000;

function makeDocument(entities: CadEntity[], sourceKey: string): CadCanonicalDocument {
  return {
    sourceVersionKey: sourceKey,
    sourceSha256: sourceKey,
    acadVersion: "AC1032",
    codepage: "UTF-8",
    units: 4,
    measurement: 1,
    layers: {
      "0": { id: "0", name: "0", visible: true, frozen: false, locked: false,
        color: { method: "aci", aci: 7 }, lineweightMm: 0, linetypeName: "CONTINUOUS" },
    },
    linetypes: {},
    textStyles: {},
    blocks: {},
    layouts: {},
    viewports: {},
    paperSpaceEntities: {},
    diagnostics: [],
    modelSpaceEntities: entities,
  };
}

function measureEncodedPointError(points: CadPoint2D[], xy: Float32Array, origin: Float64Array): number {
  assert.equal(xy.length / 2, points.length, "fixture source points map one-to-one to emitted vertices");
  let maxError = 0;
  for (let index = 0; index < points.length; index++) {
    const dx = points[index]![0] - (origin[0]! + xy[index * 2]!);
    const dy = points[index]![1] - (origin[1]! + xy[index * 2 + 1]!);
    maxError = Math.max(maxError, Math.hypot(dx, dy));
  }
  return maxError;
}

function assertCompositeCurveBudgetStatus(
  scene: ReturnType<typeof compileCanonicalToScene>,
  chunk: ReturnType<typeof compileCanonicalToScene>["manifest"]["chunks"][number],
  targetCssError: number,
  context: string,
): void {
  const exceeded = (chunk.maxCurveEncodedGeometryErrorCssPixels ?? 0) > targetCssError * (1 + 1e-12);
  const hasCompositeDiagnostic = scene.manifest.diagnosticsSummary.diagnosticCodes.includes("CURVE_ENCODED_PRECISION_LIMIT_REACHED");
  assert.equal(hasCompositeDiagnostic, exceeded, `${context}: composite precision diagnostic follows the measured sum`);
  assert.equal(scene.manifest.qualityStatus, exceeded ? "degraded" : "exact",
    `${context}: quality status follows the same-primitive composite screen budget`);
}

function measureEncodedPointSetError(points: CadPoint2D[], xy: Float32Array, origin: Float64Array): number {
  assert.equal(xy.length / 2, points.length, "fixture source points map to the emitted vertex count");
  let maxError = 0;
  for (let index = 0; index < xy.length / 2; index++) {
    const x = origin[0]! + xy[index * 2]!;
    const y = origin[1]! + xy[index * 2 + 1]!;
    const nearest = Math.min(...points.map((point) => Math.hypot(point[0] - x, point[1] - y)));
    maxError = Math.max(maxError, nearest);
  }
  return maxError;
}

function testWorldAndCssQuantizationAccounting(): void {
  const points: CadPoint2D[] = [
    [ORIGIN + 0.01, ORIGIN + 0.02],
    [ORIGIN + 100.02, ORIGIN + 0.025],
  ];
  const document = makeDocument([
    { handle: "SUBUNIT_LINE", type: "LINE", layer: "0", order: 1n, start: points[0]!, end: points[1]! },
  ], "f07-chunk-quantization-small");
  const scene = compileCanonicalToScene(document, {
    sceneId: "scene_f07_chunk_quantization_small",
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.01,
    maxTransformSingularValue: 2,
  });
  const chunkRef = scene.manifest.chunks[0]!;
  const parsed = parseSceneChunk(scene.chunks.get(chunkRef.chunkId)!);
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const measuredWorld = measureEncodedPointError(points, xy, origin);
  assert.ok(measuredWorld > 0, "local Float32 conversion exposes a finite non-zero sub-unit error at 1e9 coordinates");
  assert.ok(Math.abs(chunkRef.maxQuantizationErrorWorld - measuredWorld) <= 1e-15,
    "manifest reports the measured maximum world-space round-trip error");
  const expectedCss = measuredWorld * 2 / 0.01;
  assert.ok(Math.abs(chunkRef.maxQuantizationErrorCssPixels! - expectedCss) <= 1e-13,
    "active view transform converts the measured error into CSS pixels");
  assert.equal(scene.manifest.qualityStatus, "exact", "quantization inside the requested CSS budget remains accepted");

  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks[0].maxQuantizationErrorWorld, chunkRef.maxQuantizationErrorWorld,
    "hash-index metadata carries the same measured quantization bound");
  assert.equal(indexed.chunks[0].maxQuantizationErrorCssPixels, chunkRef.maxQuantizationErrorCssPixels,
    "hash-index metadata carries the active-view error bound");
  const validated = validateSceneManifest(scene.manifest);
  assert.equal(validated.chunks[0]?.maxQuantizationErrorWorld, measuredWorld,
    "manifest validation preserves the bounded quantization measurement");
}

function testTextGlyphEndpointsContributeToEncodedQuantizationBudget(): void {
  const text: CadTextEntity = {
    handle: "F07_GLYPH_QUANTIZATION",
    type: "TEXT",
    layer: "0",
    order: 1n,
    text: "F07 GLYPH ÇİZGİ 123",
    insertionPoint: [ORIGIN + 13.125, ORIGIN - 7.75],
    height: 80_000,
    rotationRad: 0.37,
    widthFactor: 1.15,
    obliqueRad: 0.12,
    styleName: "STANDARD",
  };
  const layoutSegments = FontLayoutEngine.layoutText(text);
  assert.ok(layoutSegments.length > 20, "font layout produces a non-trivial text glyph stroke fixture");
  const sourcePoints: CadPoint2D[] = layoutSegments.flatMap((segment) => [
    [segment.x0, segment.y0] as CadPoint2D,
    [segment.x1, segment.y1] as CadPoint2D,
  ]);
  const minX = Math.min(...sourcePoints.map((point) => point[0]));
  const minY = Math.min(...sourcePoints.map((point) => point[1]));
  const maxX = Math.max(...sourcePoints.map((point) => point[0]));
  const maxY = Math.max(...sourcePoints.map((point) => point[1]));
  const independentOrigin = new Float64Array([(minX + maxX) / 2, (minY + maxY) / 2]);
  let independentlyMeasuredWorldError = 0;
  for (const point of sourcePoints) {
    const encodedX = independentOrigin[0]! + Math.fround(point[0] - independentOrigin[0]!);
    const encodedY = independentOrigin[1]! + Math.fround(point[1] - independentOrigin[1]!);
    independentlyMeasuredWorldError = Math.max(
      independentlyMeasuredWorldError,
      Math.hypot(point[0] - encodedX, point[1] - encodedY),
    );
  }
  assert.ok(independentlyMeasuredWorldError > 0, "rotated glyph strokes expose a non-zero Float32 endpoint round-trip error");

  const unitsPerCssPixel = independentlyMeasuredWorldError / 0.5;
  const document = makeDocument([text], "f07-text-glyph-quantization");
  const scene = compileCanonicalToScene(document, {
    sceneId: "scene_f07_text_glyph_quantization",
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel,
    maxTransformSingularValue: 1,
  });
  const chunk = scene.manifest.chunks[0]!;
  const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const measuredEncodedWorldError = measureEncodedPointError(sourcePoints, xy, origin);
  assert.ok(Math.abs(origin[0]! - independentOrigin[0]!) < 1e-9 && Math.abs(origin[1]! - independentOrigin[1]!) < 1e-9,
    "compiler chunk origin matches the independent text-stroke bounds midpoint");
  assert.ok(Math.abs(measuredEncodedWorldError - independentlyMeasuredWorldError) < 1e-12,
    "decoded glyph XY endpoints match the independent Float32 round-trip oracle");
  assert.ok(Math.abs(chunk.maxQuantizationErrorWorld - independentlyMeasuredWorldError) < 1e-12,
    "generic chunk quantization metadata includes the text glyph stroke endpoints");
  const expectedCssError = independentlyMeasuredWorldError / unitsPerCssPixel;
  assert.ok(Math.abs(chunk.maxQuantizationErrorCssPixels! - expectedCssError) < 1e-10,
    "text glyph endpoint quantization is projected into the active CSS error budget");
  assert.ok(expectedCssError > 0.25, "fixture independently exceeds the requested screen-space budget");
  assert.ok(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("CHUNK_QUANTIZATION_LIMIT_REACHED"),
    "over-budget text glyph encoding emits the existing chunk precision diagnostic");
  assert.equal(scene.manifest.qualityStatus, "degraded",
    "text glyph Float32 overrun cannot leave the scene marked exact");
  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks[0].maxQuantizationErrorWorld, chunk.maxQuantizationErrorWorld,
    "hash-index metadata carries the measured glyph endpoint error");
  assert.equal(validateSceneManifest(scene.manifest).chunks[0]?.maxQuantizationErrorCssPixels,
    chunk.maxQuantizationErrorCssPixels,
    "manifest validation preserves the text glyph screen-space quantization metric");
}

function testExceededScreenBudgetDegradesScene(): void {
  const end = ORIGIN + 100_003.3;
  const document = makeDocument([
    { handle: "WIDE_LINE", type: "LINE", layer: "0", order: 1n, start: [ORIGIN, ORIGIN], end: [end, end] },
  ], "f07-chunk-quantization-budget");
  const scene = compileCanonicalToScene(document, {
    sceneId: "scene_f07_chunk_quantization_budget",
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.001,
    maxTransformSingularValue: 1,
  });
  assert.ok(scene.manifest.chunks[0]!.maxQuantizationErrorCssPixels! > 0.25,
    "wide local extent produces an independently measured screen-space quantization overrun");
  assert.equal(scene.manifest.qualityStatus, "degraded",
    "the compiler must not label a chunk exact when quantization exceeds the supplied error budget");
  assert.ok(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("CHUNK_QUANTIZATION_LIMIT_REACHED"),
    "manifest reports the specific chunk quantization budget failure");
}

function testTriangleBuffersAreAccounted(): void {
  const points: CadPoint2D[] = [
    [ORIGIN + 0.11, ORIGIN + 0.07],
    [ORIGIN + 100_003.3, ORIGIN + 0.19],
    [ORIGIN + 100_003.41, ORIGIN + 100_003.27],
  ];
  const document = makeDocument([
    { handle: "WIPE_TRIANGLE", type: "WIPEOUT", layer: "0", order: 1n, vertices: points },
  ], "f07-triangle-quantization");
  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_triangle_quantization" });
  const chunkRef = scene.manifest.chunks[0]!;
  const parsed = parseSceneChunk(scene.chunks.get(chunkRef.chunkId)!);
  const triangles = parsed.sections.get(SceneTag.TRIANGLES)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  assert.equal(triangles.length / 2, points.length, "three-face fixture emits its three source vertices");
  const measuredWorld = measureEncodedPointSetError(points, triangles, origin);
  assert.ok(Math.abs(chunkRef.maxQuantizationErrorWorld - measuredWorld) <= 1e-12,
    `triangle vertices contribute to the chunk bound (manifest=${chunkRef.maxQuantizationErrorWorld}, measured=${measuredWorld})`);
}

function testPathDistanceFloat32QuantizationIsMeasuredAndBudgeted(): void {
  const end = ORIGIN + 100_003.3;
  const sourceDistance = Math.hypot(end - ORIGIN, end - ORIGIN);
  const document = makeDocument([{
    handle: "PATH_DISTANCE_F32", type: "LINE", layer: "0", order: 1n,
    start: [ORIGIN, ORIGIN], end: [end, end],
  }], "f07-path-distance-quantization");
  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_path_distance_quantization" });
  const chunkRef = scene.manifest.chunks[0]!;
  const parsed = parseSceneChunk(scene.chunks.get(chunkRef.chunkId)!);
  const pathDistance = parsed.sections.get(SceneTag.PATH_DISTANCE)!.data as Float32Array;
  const measuredError = Math.max(
    Math.abs(pathDistance[0]! - 0),
    Math.abs(pathDistance[1]! - sourceDistance),
  );
  assert.ok(measuredError > 0, "large cumulative distance exposes Float32 scalar quantization");
  assert.equal(pathDistance[1], Math.fround(sourceDistance), "PATH_DISTANCE binary lane contains the expected Float32-rounded source value");
  assert.equal(chunkRef.maxPathDistanceQuantizationErrorWorld, measuredError,
    "flat manifest reports the measured maximum scalar round-trip error");
  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks[0].maxPathDistanceQuantizationErrorWorld, measuredError,
    "hash-index metadata carries the same path-distance error metric");
  assert.equal(validateSceneManifest(scene.manifest).chunks[0]?.maxPathDistanceQuantizationErrorWorld, measuredError,
    "manifest validation preserves the scalar precision metric");

  const budgeted = compileCanonicalToScene(document, {
    sceneId: "scene_f07_path_distance_quantization_budget",
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.001,
    maxTransformSingularValue: 1,
  });
  const budgetChunk = budgeted.manifest.chunks[0]!;
  assert.ok(budgetChunk.maxPathDistanceQuantizationErrorCssPixels! > 0.25,
    "active view converts scalar world error to CSS-pixel error");
  assert.ok(budgeted.manifest.diagnosticsSummary.diagnosticCodes.includes("PATH_DISTANCE_PRECISION_LIMIT_REACHED"),
    "screen-budget overrun is reported with a path-distance-specific diagnostic");
  assert.equal(budgeted.manifest.qualityStatus, "degraded",
    "an over-budget transported path-distance lane cannot be reported exact");
}

function makeBulgeHatch(handle: string): CadHatchEntity {
  return {
    handle, type: "HATCH", layer: "0", order: 1n,
    patternName: "SOLID", isSolid: true,
    loops: [{
      isPolyline: true,
      vertices: [[0, 0], [100, 0], [100, 50], [0, 50]],
      bulges: [0, 0, 1, 0],
    }],
  };
}

function testHatchFillBoundaryTessellationErrorIsMeasuredAndBudgeted(): void {
  const document = makeDocument([makeBulgeHatch("HATCH_BULGE_ERROR")], "f07-hatch-fill-boundary-error");
  const bounded = compileCanonicalToScene(document, {
    sceneId: "scene_f07_hatch_fill_boundary_error",
    maxCurveSegments: 2,
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 1,
    maxTransformSingularValue: 1,
  });
  const chunk = bounded.manifest.chunks[0]!;
  const sourceHatch = makeBulgeHatch("HATCH_BULGE_ERROR");
  const sourceMesh = GeometryCompiler.triangulateHatch(sourceHatch, 2, 0.25).mesh!;
  const parsed = parseSceneChunk(bounded.chunks.get(chunk.chunkId)!);
  const triangles = parsed.sections.get(SceneTag.TRIANGLES)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const sourceTrianglePoints: CadPoint2D[] = [];
  for (let index = 0; index < sourceMesh.vertices.length; index += 2) {
    sourceTrianglePoints.push([sourceMesh.vertices[index]!, sourceMesh.vertices[index + 1]!]);
  }
  const independentlyMeasuredTriangleQuantization = measureEncodedPointError(sourceTrianglePoints, triangles, origin);
  const expectedSemicircleSagitta = 50 * (1 - Math.cos(Math.PI / 4));
  assert.ok(Math.abs(chunk.maxHatchFillBoundaryTessellationErrorWorld - expectedSemicircleSagitta) < 1e-12,
    "compiled HATCH chunk records the independently calculated two-chord semicircle sagitta");
  assert.ok(Math.abs(chunk.maxHatchFillBoundaryTessellationErrorCssPixels! - expectedSemicircleSagitta) < 1e-12,
    "the active view converts world boundary deviation to CSS pixels");
  assert.ok(Math.abs(chunk.maxHatchFillTriangleQuantizationErrorWorld - independentlyMeasuredTriangleQuantization) < 1e-12,
    "HATCH fill triangle Float32 round-trip error is measured independently from boundary tessellation");
  assert.ok(Math.abs(chunk.maxHatchFillEncodedGeometryErrorWorld - (expectedSemicircleSagitta + independentlyMeasuredTriangleQuantization)) < 1e-12,
    "static fill's encoded geometry bound sums the same fill's boundary sagitta and triangle encoding error");
  assert.ok(Math.abs(chunk.maxHatchFillEncodedGeometryErrorCssPixels! - chunk.maxHatchFillEncodedGeometryErrorWorld) < 1e-12,
    "the active view converts the combined static fill error bound to CSS pixels");
  assert.equal(bounded.manifest.indexPages[0]!.chunks[0]!.maxHatchFillBoundaryTessellationErrorWorld,
    chunk.maxHatchFillBoundaryTessellationErrorWorld,
    "index metadata carries the same HATCH boundary deviation");
  assert.ok(Math.abs(validateSceneManifest(bounded.manifest).chunks[0]!.maxHatchFillBoundaryTessellationErrorCssPixels! - expectedSemicircleSagitta) < 1e-12,
    "manifest validation preserves the optional HATCH error metrics");
  assert.equal(validateSceneManifest(bounded.manifest).chunks[0]!.maxHatchFillEncodedGeometryErrorWorld,
    chunk.maxHatchFillEncodedGeometryErrorWorld,
    "manifest validation preserves the combined static fill precision bound");
  assert.ok(bounded.manifest.diagnosticsSummary.diagnosticCodes.includes("HATCH_FILL_BOUNDARY_TESSELLATION_LIMIT_REACHED"),
    "an active-view HATCH boundary overrun receives a specific diagnostic");
  assert.equal(bounded.manifest.qualityStatus, "degraded",
    "an over-budget static fill boundary cannot be reported exact");
  assert.ok(bounded.manifest.diagnosticsSummary.diagnosticCodes.includes("HATCH_FILL_ENCODED_PRECISION_LIMIT_REACHED"),
    "the combined boundary-plus-encoding overrun has its own quality diagnostic");

  const sufficientlyRefined = compileCanonicalToScene(document, {
    sceneId: "scene_f07_hatch_fill_boundary_within_budget",
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 1,
    maxTransformSingularValue: 1,
  });
  assert.ok(sufficientlyRefined.manifest.chunks[0]!.maxHatchFillEncodedGeometryErrorCssPixels! <= 0.25,
    "normal bounded tessellation plus Float32 encoding satisfies the supplied screen-space error budget");
  assert.ok(!sufficientlyRefined.manifest.diagnosticsSummary.diagnosticCodes.includes("HATCH_FILL_BOUNDARY_TESSELLATION_LIMIT_REACHED"),
    "an in-budget HATCH fill does not receive the overrun diagnostic");
  assert.ok(!sufficientlyRefined.manifest.diagnosticsSummary.diagnosticCodes.includes("HATCH_FILL_ENCODED_PRECISION_LIMIT_REACHED"),
    "an in-budget encoded HATCH fill does not receive the composite precision diagnostic");
}

function testHatchCompositeBudgetCatchesTriangleEncodingOverrun(): void {
  const hatch: CadHatchEntity = {
    ...makeBulgeHatch("HATCH_LARGE_FILL_ENCODING"),
    loops: [{
      isPolyline: true,
      vertices: [[0, 0], [1_000_000_000, 0], [1_000_000_000, 500_000_000], [0, 500_000_000]],
      bulges: [0, 0, 1, 0],
    }],
  };
  const source = GeometryCompiler.triangulateHatch(hatch, 65_536, 1_000_000);
  const targetWorldError = source.maxBoundaryTessellationErrorWorld + 0.05;
  const scene = compileCanonicalToScene(makeDocument([hatch], "f07-hatch-composite-encoding-overrun"), {
    sceneId: "scene_f07_hatch_composite_encoding_overrun",
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: targetWorldError / 0.25,
    maxTransformSingularValue: 1,
  });
  const chunk = scene.manifest.chunks[0]!;
  assert.ok(chunk.maxHatchFillBoundaryTessellationErrorCssPixels! <= 0.25,
    "large-fill boundary tessellation alone stays inside the view budget");
  assert.ok(chunk.maxHatchFillTriangleQuantizationErrorWorld > 0.05,
    "large chunk-local coordinates produce a Float32 triangle error larger than remaining budget slack");
  assert.ok(chunk.maxHatchFillEncodedGeometryErrorCssPixels! > 0.25,
    "same-fill boundary plus encoded-vertex sum crosses the screen budget");
  assert.ok(!scene.manifest.diagnosticsSummary.diagnosticCodes.includes("HATCH_FILL_BOUNDARY_TESSELLATION_LIMIT_REACHED"),
    "the boundary-only diagnostic remains absent when only encoding pushes the composite over budget");
  assert.ok(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("HATCH_FILL_ENCODED_PRECISION_LIMIT_REACHED"),
    "composite HATCH fill precision still degrades the scene when the tessellation term alone fits");
  assert.equal(scene.manifest.qualityStatus, "degraded",
    "a per-fill composite screen-budget overrun cannot be reported exact");
}

function testHatchBoundaryChordAndEndpointEncodingUseOneCompositeBudget(): void {
  const center: CadPoint2D = [ORIGIN, ORIGIN];
  const radius = 100_000_000;
  const targetCssError = 0.25;
  const unitsPerCssPixel = 100;
  const maxErrorWorld = targetCssError * unitsPerCssPixel;
  const hatch: CadHatchEntity = {
    handle: "HATCH_BOUNDARY_COMPOSITE",
    type: "HATCH",
    layer: "0",
    order: 1n,
    patternName: "SOLID",
    isSolid: true,
    loops: [{
      isPolyline: false,
      edges: [
        { type: "ARC", center, radius, startAngleRad: 0, endAngleRad: Math.PI, ccw: true },
        { type: "LINE", start: [center[0] - radius, center[1]], end: [center[0] + radius, center[1]] },
      ],
    }],
  };
  const independent = GeometryCompiler.tessellateArcWithBudget(
    center, radius, 0, Math.PI, false, maxErrorWorld,
  );
  const tessellated = GeometryCompiler.triangulateHatch(hatch, 65_536, maxErrorWorld);
  assert.equal(tessellated.boundaryLines.length, independent.segmentCount + 1,
    "HATCH arc chords and its closing line map to the independent tessellator segment count");
  for (const boundary of tessellated.boundaryLines.slice(0, independent.segmentCount)) {
    assert.equal(boundary.hatchBoundaryTessellationErrorWorld, independent.maxSagittaWorld,
      "each emitted curved HATCH boundary chord carries its local source sagitta bound");
  }
  assert.equal(tessellated.boundaryLines.at(-1)?.hatchBoundaryTessellationErrorWorld, undefined,
    "the straight closing boundary does not inherit the adjacent arc's sagitta claim");

  const scene = compileCanonicalToScene(makeDocument([hatch], "f07-hatch-boundary-composite-precision"), {
    sceneId: "scene_f07_hatch_boundary_composite_precision",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel,
    maxTransformSingularValue: 1,
  });
  const chunk = scene.manifest.chunks[0]!;
  const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  assert.equal(xy.length / 4, independent.segmentCount + 1,
    "compiled HATCH boundary line count matches the source ARC chords plus its straight closure");

  let measuredArcEndpointEncodingErrorWorld = 0;
  for (let segment = 0; segment < independent.segmentCount; segment++) {
    for (let endpoint = 0; endpoint < 2; endpoint++) {
      const source = independent.points[segment + endpoint]!;
      const vertex = segment * 2 + endpoint;
      const dx = source[0] - (origin[0]! + xy[vertex * 2]!);
      const dy = source[1] - (origin[1]! + xy[vertex * 2 + 1]!);
      measuredArcEndpointEncodingErrorWorld = Math.max(measuredArcEndpointEncodingErrorWorld, Math.hypot(dx, dy));
    }
  }
  const analyticSagittaWorld = radius * (1 - Math.cos(Math.PI / (2 * independent.segmentCount)));
  assert.ok(independent.errorBoundMet && Math.abs(independent.maxSagittaWorld - analyticSagittaWorld) < 1e-7,
    "the semicircle's independently calculated chord sagitta is within the static view budget");
  assert.ok(measuredArcEndpointEncodingErrorWorld > 0,
    "large HATCH coordinates expose non-zero Float32 endpoint round-trip error");
  assert.ok(analyticSagittaWorld / unitsPerCssPixel <= targetCssError,
    "HATCH boundary sagitta alone is within the active screen budget");
  assert.ok(measuredArcEndpointEncodingErrorWorld / unitsPerCssPixel <= targetCssError,
    "HATCH boundary endpoint encoding alone is within the active screen budget");

  const expectedCompositeWorld = analyticSagittaWorld + measuredArcEndpointEncodingErrorWorld;
  const expectedCompositeCss = expectedCompositeWorld / unitsPerCssPixel;
  assert.ok(expectedCompositeCss > targetCssError,
    "independently measured same-chord sagitta plus endpoint encoding crosses the screen budget");
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorWorld - expectedCompositeWorld) < 1e-7,
    "manifest records the per-HATCH-chord source sagitta plus that chord's encoded endpoint error");
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorCssPixels! - expectedCompositeCss) < 1e-10,
    "the active view converts HATCH boundary composite error into CSS pixels");
  assert.equal(scene.manifest.qualityStatus, "degraded",
    "over-budget static HATCH boundary chords cannot leave the scene marked exact");
  assert.ok(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("CURVE_ENCODED_PRECISION_LIMIT_REACHED"),
    "the HATCH boundary composite overrun receives the curved-line precision diagnostic");
  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks[0].maxCurveEncodedGeometryErrorWorld, chunk.maxCurveEncodedGeometryErrorWorld,
    "hash-index metadata carries the HATCH curved-boundary composite error");
  assert.equal(validateSceneManifest(scene.manifest).chunks[0]?.maxCurveEncodedGeometryErrorWorld,
    chunk.maxCurveEncodedGeometryErrorWorld,
    "manifest validation preserves the HATCH boundary composite bound");
}

function testNestedHatchBoundarySagittaUsesTheCombinedInsertScale(): void {
  const localCenter: CadPoint2D = [0, 0];
  const radius = 100_000_000;
  const targetCssError = 0.25;
  const unitsPerCssPixel = 1_000;
  const combinedInsertScale = 8;
  const localErrorBudget = targetCssError * unitsPerCssPixel / combinedInsertScale;
  const hatch: CadHatchEntity = {
    handle: "NESTED_HATCH_BOUNDARY_COMPOSITE",
    type: "HATCH",
    layer: "0",
    order: 1n,
    patternName: "SOLID",
    isSolid: true,
    loops: [{
      isPolyline: false,
      edges: [
        { type: "ARC", center: localCenter, radius, startAngleRad: 0, endAngleRad: Math.PI, ccw: true },
        { type: "LINE", start: [-radius, 0], end: [radius, 0] },
      ],
    }],
  };
  const innerInsert: CadInsertEntity = {
    handle: "NESTED_HATCH_INNER", type: "INSERT", layer: "0", order: 1n,
    blockName: "HATCH_LEAF", insertionPoint: [0, 0], scale: [2, 2, 1], rotationRad: 0,
  };
  const outerRotation = 0.35;
  const outerInsert: CadInsertEntity = {
    handle: "NESTED_HATCH_OUTER", type: "INSERT", layer: "0", order: 2n,
    blockName: "HATCH_BRANCH", insertionPoint: [ORIGIN, ORIGIN], scale: [-4, 4, 1], rotationRad: outerRotation,
  };
  const source = makeDocument([outerInsert], "f07-nested-hatch-boundary-composite");
  source.blocks = {
    HATCH_BRANCH: { name: "HATCH_BRANCH", basePoint: [0, 0], entities: [innerInsert] },
    HATCH_LEAF: { name: "HATCH_LEAF", basePoint: [0, 0], entities: [hatch] },
  };

  const independent = GeometryCompiler.tessellateArcWithBudget(
    localCenter, radius, 0, Math.PI, false, localErrorBudget,
  );
  const scene = compileCanonicalToScene(source, {
    sceneId: "scene_f07_nested_hatch_boundary_composite",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel,
    maxTransformSingularValue: 1,
  });
  const chunk = scene.manifest.chunks[0]!;
  const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  assert.equal(xy.length / 4, independent.segmentCount + 1,
    "two-level INSERT expansion preserves every curved HATCH chord and its linear closure");

  const cosine = Math.cos(outerRotation);
  const sine = Math.sin(outerRotation);
  const transformedPoint = (point: CadPoint2D): CadPoint2D => [
    ORIGIN + cosine * (-combinedInsertScale * point[0]) - sine * (combinedInsertScale * point[1]),
    ORIGIN + sine * (-combinedInsertScale * point[0]) + cosine * (combinedInsertScale * point[1]),
  ];
  let measuredArcEndpointEncodingErrorWorld = 0;
  for (let segment = 0; segment < independent.segmentCount; segment++) {
    for (let endpoint = 0; endpoint < 2; endpoint++) {
      const sourcePoint = transformedPoint(independent.points[segment + endpoint]!);
      const vertex = segment * 2 + endpoint;
      const dx = sourcePoint[0] - (origin[0]! + xy[vertex * 2]!);
      const dy = sourcePoint[1] - (origin[1]! + xy[vertex * 2 + 1]!);
      measuredArcEndpointEncodingErrorWorld = Math.max(measuredArcEndpointEncodingErrorWorld, Math.hypot(dx, dy));
    }
  }
  const analyticLocalSagitta = radius * (1 - Math.cos(Math.PI / (2 * independent.segmentCount)));
  const analyticWorldSagitta = analyticLocalSagitta * combinedInsertScale;
  assert.ok(Math.abs(independent.maxSagittaWorld - analyticLocalSagitta) < 1e-7,
    "source arc tessellation matches the independent semicircle sagitta oracle");
  assert.ok(analyticWorldSagitta / unitsPerCssPixel <= targetCssError,
    "the transformed static boundary sagitta alone stays inside the screen budget");
  assert.ok(measuredArcEndpointEncodingErrorWorld / unitsPerCssPixel <= targetCssError,
    "the transformed Float32 endpoint error alone stays inside the screen budget");
  const expectedCompositeWorld = analyticWorldSagitta + measuredArcEndpointEncodingErrorWorld;
  assert.ok(expectedCompositeWorld / unitsPerCssPixel > targetCssError,
    "the transformed same-chord sagitta and endpoint error together exceed the active budget");
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorWorld - expectedCompositeWorld) < 1e-6,
    "nested HATCH composite metadata scales source deviation through both INSERTs before adding encoded endpoint loss");
  assert.ok(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("CURVE_ENCODED_PRECISION_LIMIT_REACHED"),
    "the transformed composite overrun degrades the scene with the curve precision diagnostic");

  const clippedOuterInsert: CadInsertEntity = {
    ...outerInsert,
    handle: "NESTED_HATCH_XCLIP_OUTER",
    clipBoundary: { boundaryVertices: [[-2_000_000_000, -2_000_000_000], [3_000_000_000, -2_000_000_000], [3_000_000_000, 3_000_000_000], [-2_000_000_000, 3_000_000_000]] },
  };
  const clippedSource = makeDocument([clippedOuterInsert], "f07-nested-hatch-boundary-xclip");
  clippedSource.blocks = source.blocks;
  const clipped = compileCanonicalToScene(clippedSource, {
    sceneId: "scene_f07_nested_hatch_boundary_xclip",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel,
    maxTransformSingularValue: 1,
  });
  const clippedChunk = clipped.manifest.chunks[0]!;
  const clippedXY = parseSceneChunk(clipped.chunks.get(clippedChunk.chunkId)!).sections.get(SceneTag.XY)!.data as Float32Array;
  assert.ok(clippedXY.length > 0, "the XCLIP fixture still emits the visible HATCH boundary chord geometry");
  assert.equal(clippedChunk.maxCurveEncodedGeometryErrorWorld, 0,
    "XCLIP output does not carry the source HATCH chord sagitta claim onto clipped fragments");
}

function testPaperViewportScalesHatchBoundarySagittaOnce(): void {
  const center: CadPoint2D = [0, 0];
  const radius = 500;
  const viewportScale = 0.15;
  const targetCssError = 0.25;
  const hatch: CadHatchEntity = {
    handle: "PAPER_HATCH_BOUNDARY_SCALE",
    type: "HATCH",
    layer: "0",
    order: 1n,
    patternName: "SOLID",
    isSolid: true,
    loops: [{
      isPolyline: false,
      edges: [
        { type: "ARC", center, radius, startAngleRad: 0, endAngleRad: Math.PI, ccw: true },
        { type: "LINE", start: [-radius, 0], end: [radius, 0] },
      ],
    }],
  };
  const source = makeDocument([hatch], "f07-paper-hatch-boundary-scale");
  source.layouts = {
    Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [-radius, -radius, radius, radius] },
    Sheet: { id: "Sheet", name: "Sheet", isModelSpace: false, bbox: [0, 0, 200, 150], viewportIds: ["VP"] },
  };
  source.viewports = {
    VP: {
      id: "VP", layoutId: "Sheet", order: 2n, center: [100, 75], width: 200, height: 150,
      viewCenter: [0, 0], viewHeight: 1_000, frozenLayers: [],
    },
  };
  const independent = GeometryCompiler.tessellateArcWithBudget(
    center, radius, 0, Math.PI, false, targetCssError / viewportScale,
  );
  const scene = compileCanonicalToScene(source, {
    sceneId: "scene_f07_paper_hatch_boundary_scale",
    layoutId: "Sheet",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel: 1,
    maxTransformSingularValue: 1,
  });
  const chunk = scene.manifest.chunks[0]!;
  const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  assert.equal(xy.length / 4, independent.segmentCount + 1,
    "paper projection keeps the independent HATCH ARC chord count and straight closure");

  let endpointErrorWorld = 0;
  for (let segment = 0; segment < independent.segmentCount; segment++) {
    for (let endpoint = 0; endpoint < 2; endpoint++) {
      const sourcePoint = independent.points[segment + endpoint]!;
      const expectedPaperPoint: CadPoint2D = [100 + viewportScale * sourcePoint[0], 75 + viewportScale * sourcePoint[1]];
      const vertex = segment * 2 + endpoint;
      endpointErrorWorld = Math.max(endpointErrorWorld, Math.hypot(
        expectedPaperPoint[0] - (origin[0]! + xy[vertex * 2]!),
        expectedPaperPoint[1] - (origin[1]! + xy[vertex * 2 + 1]!),
      ));
    }
  }
  const expectedSagittaWorld = independent.maxSagittaWorld * viewportScale;
  const expectedCompositeWorld = expectedSagittaWorld + endpointErrorWorld;
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorWorld - expectedCompositeWorld) < 1e-7,
    "paper viewport singular scale is applied once to the HATCH source bound before endpoint quantization is added");
  assert.ok(chunk.maxCurveEncodedGeometryErrorCssPixels! <= targetCssError,
    "the viewport-scaled static chord plus emitted paper endpoint error stays within the active CSS budget");
}

function testCircularCurveTessellationErrorIsMeasuredAndBudgeted(): void {
  const center: CadPoint2D = [ORIGIN + 15, ORIGIN - 25];
  const radius = 10;
  const maxErrorWorld = 0.25 * 0.01 / 2;
  const circle = GeometryCompiler.tessellateArcWithBudget(center, radius, 0, Math.PI * 2, false, maxErrorWorld);
  const arc = GeometryCompiler.tessellateArcWithBudget(center, radius, 0.2, 1.7, false, maxErrorWorld);
  const dashPattern = [2, -1];
  const dashedCircle = tessellateDashedCircle(center, radius, dashPattern, 1, 0, { maxErrorWorld });
  const dashedArc = tessellateDashedArc(center, radius, 0.2, 1.7, false, dashPattern, 1, 0, { maxErrorWorld });
  const document = makeDocument([
    { handle: "MEASURED_CIRCLE", type: "CIRCLE", layer: "0", order: 1n, center, radius },
    { handle: "MEASURED_ARC", type: "ARC", layer: "0", order: 2n, center, radius,
      startAngleRad: 0.2, endAngleRad: 1.7, isClockwise: false },
    { handle: "MEASURED_DASHED_CIRCLE", type: "CIRCLE", layer: "0", order: 3n, center, radius, linetype: "F07_DASH" },
    { handle: "MEASURED_DASHED_ARC", type: "ARC", layer: "0", order: 4n, center, radius,
      startAngleRad: 0.2, endAngleRad: 1.7, isClockwise: false, linetype: "F07_DASH" },
  ], "f07-circular-curve-tessellation-error");
  document.linetypes.F07_DASH = {
    id: "F07_DASH", name: "F07_DASH", pattern: dashPattern, totalLength: 3,
  };
  const scene = compileCanonicalToScene(document, {
    sceneId: "scene_f07_circular_curve_tessellation_error",
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.01,
    maxTransformSingularValue: 2,
  });
  const expectedWorld = Math.max(
    circle.maxSagittaWorld, arc.maxSagittaWorld,
    dashedCircle.maxSagittaWorld ?? 0, dashedArc.maxSagittaWorld ?? 0,
  );
  const chunk = scene.manifest.chunks[0]!;
  assert.ok(expectedWorld > 0, "continuous and dashed circle/arc tessellators produce measurable non-zero chord sagitta");
  assert.ok(Math.abs(chunk.maxCircularCurveTessellationErrorWorld - expectedWorld) < 1e-14,
    "chunk metadata matches the independently invoked continuous and dashed circular tessellator bounds");
  assert.ok(Math.abs(chunk.maxCircularCurveTessellationErrorCssPixels! - expectedWorld * 2 / 0.01) < 1e-12,
    "active-view profile converts circular chord error to CSS pixels");
  assertCompositeCurveBudgetStatus(scene, chunk, 0.25, "circular and dashed circular strokes");
  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks[0].maxCircularCurveTessellationErrorWorld, expectedWorld,
    "hash-index metadata carries the same circular chord bound");
  assert.equal(validateSceneManifest(scene.manifest).chunks[0]?.maxCircularCurveTessellationErrorWorld, expectedWorld,
    "manifest validation preserves the circular chord bound");

  const cappedCircle = GeometryCompiler.tessellateArcWithBudget(center, radius, 0, Math.PI * 2, false, maxErrorWorld, 4);
  const capped = compileCanonicalToScene(makeDocument([
    { handle: "CAPPED_CIRCLE", type: "CIRCLE", layer: "0", order: 1n, center, radius },
  ], "f07-circular-curve-tessellation-cap"), {
    sceneId: "scene_f07_circular_curve_tessellation_cap",
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.01,
    maxTransformSingularValue: 2,
    maxCurveSegments: 4,
  });
  assert.ok(!cappedCircle.errorBoundMet && cappedCircle.maxSagittaWorld * 2 / 0.01 > 0.25,
    "independent low-cap oracle is over the requested screen budget");
  assert.equal(capped.manifest.chunks[0]!.maxCircularCurveTessellationErrorWorld, cappedCircle.maxSagittaWorld,
    "the capped circle's actual emitted sagitta is recorded per chunk");
  assert.equal(capped.manifest.qualityStatus, "degraded", "an over-budget chord approximation cannot remain exact");
  assert.ok(capped.manifest.diagnosticsSummary.diagnosticCodes.includes("CIRCULAR_CURVE_TESSELLATION_LIMIT_REACHED"),
    "manifest names the circular chord tessellation budget overrun");
}

function testCurveSagittaAndEndpointEncodingUseOneCompositeBudget(): void {
  const center: CadPoint2D = [ORIGIN, ORIGIN];
  const radius = 100_000_000;
  const targetCssError = 0.25;
  const unitsPerCssPixel = 100;
  const maxErrorWorld = targetCssError * unitsPerCssPixel;
  const independent = GeometryCompiler.tessellateArcWithBudget(
    center, radius, 0, Math.PI * 2, false, maxErrorWorld,
  );
  const scene = compileCanonicalToScene(makeDocument([{
    handle: "CIRCLE_COMPOSITE_PRECISION", type: "CIRCLE", layer: "0", order: 1n, center, radius,
  }], "f07-curve-composite-precision"), {
    sceneId: "scene_f07_curve_composite_precision",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel,
    maxTransformSingularValue: 1,
  });
  const chunk = scene.manifest.chunks[0]!;
  const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const chordCount = xy.length / 4;
  assert.equal(chordCount, independent.segmentCount,
    "compiled line pairs match the independently invoked circular tessellator's segment count");
  const sourceEndpoints: CadPoint2D[] = [];
  const circlePoint = (index: number): CadPoint2D => {
    const theta = Math.PI * 2 * index / chordCount;
    return [center[0] + radius * Math.cos(theta), center[1] + radius * Math.sin(theta)];
  };
  for (let segment = 0; segment < chordCount; segment++) {
    sourceEndpoints.push(circlePoint(segment), circlePoint(segment + 1));
  }
  assert.equal(xy.length / 2, sourceEndpoints.length,
    "the independent circular tessellator's adjacent point pairs map one-to-one to emitted line endpoints");
  let measuredEndpointEncodingErrorWorld = 0;
  for (let vertex = 0; vertex < sourceEndpoints.length; vertex++) {
    const source = sourceEndpoints[vertex]!;
    const dx = source[0] - (origin[0]! + xy[vertex * 2]!);
    const dy = source[1] - (origin[1]! + xy[vertex * 2 + 1]!);
    measuredEndpointEncodingErrorWorld = Math.max(measuredEndpointEncodingErrorWorld, Math.hypot(dx, dy));
  }
  const analyticSagittaWorld = radius * (1 - Math.cos(Math.PI / chordCount));
  assert.ok(independent.errorBoundMet && analyticSagittaWorld > 0,
    "the independent circle tessellator meets the static chord screen target");
  assert.ok(Math.abs(independent.maxSagittaWorld - analyticSagittaWorld) < 1e-7,
    "emitted full-circle chord sagitta matches the independent R(1-cos(delta/2)) formula");
  assert.ok(measuredEndpointEncodingErrorWorld > 0,
    "large chunk-local circle coordinates expose non-zero Float32 endpoint error");
  assert.ok(chunk.maxCircularCurveTessellationErrorCssPixels! <= targetCssError,
    "the static sagitta alone stays within the requested screen-space budget");
  assert.ok(chunk.maxQuantizationErrorCssPixels! <= targetCssError,
    "the endpoint encoding error alone stays within the requested screen-space budget");
  const expectedCompositeWorld = analyticSagittaWorld + measuredEndpointEncodingErrorWorld;
  const expectedCompositeCss = expectedCompositeWorld / unitsPerCssPixel;
  assert.ok(expectedCompositeCss > targetCssError,
    "the independently measured same-primitive terms together cross the screen-space budget");
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorWorld - expectedCompositeWorld) < 1e-7,
    "manifest reports the maximum same-circle chord sagitta plus that emitted line's measured endpoint error");
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorCssPixels! - expectedCompositeCss) < 1e-10,
    "the composite world bound is converted with the supplied active-view profile");
  assert.equal(scene.manifest.qualityStatus, "degraded",
    "a composite curved-line precision overrun cannot remain exact when each individual term fits");
  assert.ok(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("CURVE_ENCODED_PRECISION_LIMIT_REACHED"),
    "the scene records the curve-specific composite precision diagnostic");
  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks[0].maxCurveEncodedGeometryErrorWorld, chunk.maxCurveEncodedGeometryErrorWorld,
    "hash-index metadata carries the same curved-line composite error bound");
  assert.equal(validateSceneManifest(scene.manifest).chunks[0]?.maxCurveEncodedGeometryErrorWorld,
    chunk.maxCurveEncodedGeometryErrorWorld,
    "manifest validation preserves the curved-line composite metric");

  const invalidMetric = JSON.parse(JSON.stringify(scene.manifest));
  invalidMetric.chunks[0].maxCurveEncodedGeometryErrorWorld = -1;
  assert.throws(() => validateSceneManifest(invalidMetric), /geçersiz maxCurveEncodedGeometryErrorWorld/,
    "negative curved-line composite bounds are rejected");
  const conflictingMetric = JSON.parse(JSON.stringify(scene.manifest));
  conflictingMetric.indexPages[0].chunks[0].maxCurveEncodedGeometryErrorWorld += 1;
  assert.throws(() => validateSceneManifest(conflictingMetric), /maxCurveEncodedGeometryErrorWorld değeri indexPages ile manifest\.chunks arasında uyuşmuyor/,
    "flat and indexed curved-line composite bounds cannot disagree");
}

function testCurveEndpointRoundTripSeamIsBoundedAcrossChunks(): void {
  const center: CadPoint2D = [ORIGIN + 0.313, ORIGIN - 0.271];
  const radius = 100;
  const startAngle = 0.13;
  const endAngle = 1.83;
  const targetCssError = 0.25;
  const unitsPerCssPixel = 0.2;
  const requestedWorldError = targetCssError * unitsPerCssPixel;
  const independent = GeometryCompiler.tessellateArcWithBudget(
    center, radius, startAngle, endAngle, false, requestedWorldError,
  );
  const arc: CadEntity = {
    handle: "F07_CHUNKED_ARC",
    type: "ARC",
    layer: "0",
    order: 1n,
    center,
    radius,
    startAngleRad: startAngle,
    endAngleRad: endAngle,
    isClockwise: false,
  };
  const scene = compileCanonicalToScene(makeDocument([arc], "f07-curve-chunk-seam-accounting"), {
    sceneId: "scene_f07_curve_chunk_seam_accounting",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel,
    maxTransformSingularValue: 1,
    maxPrimitivesPerChunk: 1,
  });
  assert.ok(independent.segmentCount > 2, "independent arc profile creates multiple internal chunk seams");
  assert.equal(scene.manifest.chunks.length, independent.segmentCount,
    "one source arc chord is isolated into each consecutive output chunk");

  const analyticPoint = (pointIndex: number): CadPoint2D => {
    const angle = startAngle + ((endAngle - startAngle) * pointIndex) / independent.segmentCount;
    return [center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)];
  };
  const analyticSagitta = radius * (1 - Math.cos((endAngle - startAngle) / (2 * independent.segmentCount)));
  assert.ok(Math.abs(independent.maxSagittaWorld - analyticSagitta) < 1e-12,
    "reference tessellator sagitta agrees with the independent circular chord formula");

  let maximumSeamGapWorld = 0;
  let maximumSeamBoundWorld = 0;
  let previousDecodedEnd: CadPoint2D | null = null;
  let previousSourceEnd: CadPoint2D | null = null;
  let previousEndErrorWorld = 0;
  let previousChunkErrorWorld = 0;
  for (let index = 0; index < scene.manifest.chunks.length; index++) {
    const chunk = scene.manifest.chunks[index]!;
    const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
    const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
    const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
    assert.equal(xy.length, 4, `chunk ${index} contains exactly one emitted source chord`);
    const decodedStart: CadPoint2D = [origin[0]! + xy[0]!, origin[1]! + xy[1]!];
    const decodedEnd: CadPoint2D = [origin[0]! + xy[2]!, origin[1]! + xy[3]!];
    const sourceStart = analyticPoint(index);
    const sourceEnd = analyticPoint(index + 1);
    const startErrorWorld = Math.hypot(decodedStart[0] - sourceStart[0], decodedStart[1] - sourceStart[1]);
    const endErrorWorld = Math.hypot(decodedEnd[0] - sourceEnd[0], decodedEnd[1] - sourceEnd[1]);
    const endpointErrorWorld = Math.max(startErrorWorld, endErrorWorld);
    const expectedChordCompositeWorld = analyticSagitta + endpointErrorWorld;
    assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorWorld - expectedChordCompositeWorld) < 1e-10,
      `chunk ${index} records its own analytic sagitta plus the larger serialized endpoint error`);
    assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorCssPixels! - expectedChordCompositeWorld / unitsPerCssPixel) < 1e-8,
      `chunk ${index} preserves the active-view chord composite in CSS pixels`);

    if (previousDecodedEnd && previousSourceEnd) {
      assert.ok(Math.hypot(previousSourceEnd[0] - sourceStart[0], previousSourceEnd[1] - sourceStart[1]) < 1e-10,
        `source arc endpoint is shared exactly at chunk seam ${index - 1}/${index}`);
      const seamGapWorld = Math.hypot(previousDecodedEnd[0] - decodedStart[0], previousDecodedEnd[1] - decodedStart[1]);
      const seamEndpointErrorBoundWorld = previousEndErrorWorld + startErrorWorld;
      const seamCompositeBoundWorld = previousChunkErrorWorld + chunk.maxCurveEncodedGeometryErrorWorld;
      assert.ok(seamGapWorld <= seamEndpointErrorBoundWorld + 1e-12,
        `decoded seam ${index - 1}/${index} is bounded by both independently measured endpoint errors`);
      assert.ok(seamGapWorld <= seamCompositeBoundWorld + 1e-12,
        `decoded seam ${index - 1}/${index} is covered by adjacent per-chunk composite bounds`);
      maximumSeamGapWorld = Math.max(maximumSeamGapWorld, seamGapWorld);
      maximumSeamBoundWorld = Math.max(maximumSeamBoundWorld, seamEndpointErrorBoundWorld);
    }
    previousDecodedEnd = decodedEnd;
    previousSourceEnd = sourceEnd;
    previousEndErrorWorld = endErrorWorld;
    previousChunkErrorWorld = chunk.maxCurveEncodedGeometryErrorWorld;
  }
  assert.ok(maximumSeamGapWorld > 0,
    "separate chunk-local origins expose a measurable, non-zero encoded seam in this fixture");
  assert.ok(maximumSeamGapWorld <= maximumSeamBoundWorld + 1e-12,
    "maximum observed seam gap remains inside its independent endpoint-error envelope");

  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks.length, scene.manifest.chunks.length,
    "hash-index retains every chunk participating in the continuous source arc");
  for (let index = 0; index < scene.manifest.chunks.length; index++) {
    assert.equal(indexed.chunks[index].maxCurveEncodedGeometryErrorWorld,
      scene.manifest.chunks[index]!.maxCurveEncodedGeometryErrorWorld,
      `hash-index preserves the per-chunk curve bound at chunk ${index}`);
  }
  assert.equal(validateSceneManifest(scene.manifest).chunks.length, scene.manifest.chunks.length,
    "manifest validation preserves all chunk-local curve error bounds");
}

function testCrossSourceLineSeamIsBoundedAcrossChunks(): void {
  const firstStart: CadPoint2D = [ORIGIN + 0.1, ORIGIN + 0.25];
  const sharedSourceVertex: CadPoint2D = [ORIGIN + 123.4567, ORIGIN + 234.5678];
  const secondEnd: CadPoint2D = [ORIGIN + 456.7891, ORIGIN - 345.6789];
  const lines: CadEntity[] = [
    { handle: "F07_LINE_SOURCE_A", type: "LINE", layer: "0", order: 1n, start: firstStart, end: sharedSourceVertex },
    { handle: "F07_LINE_SOURCE_B", type: "LINE", layer: "0", order: 2n, start: sharedSourceVertex, end: secondEnd },
  ];
  const unitsPerCssPixel = 0.2;
  const maxTransformSingularValue = 1.5;
  const scene = compileCanonicalToScene(makeDocument(lines, "f07-cross-source-line-chunk-seam"), {
    sceneId: "scene_f07_cross_source_line_chunk_seam",
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel,
    maxTransformSingularValue,
    maxPrimitivesPerChunk: 1,
  });
  assert.equal(scene.manifest.chunks.length, 2,
    "each distinct connected LINE source is placed in its own chunk");

  const sourceLines = [[firstStart, sharedSourceVertex], [sharedSourceVertex, secondEnd]] as const;
  const decodedSegments: Array<{ start: CadPoint2D; end: CadPoint2D; startError: number; endError: number }> = [];
  for (let index = 0; index < scene.manifest.chunks.length; index++) {
    const chunk = scene.manifest.chunks[index]!;
    const points = sourceLines[index]!;
    const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
    const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
    const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
    assert.equal(xy.length, 4, `source LINE ${index} contributes exactly two encoded endpoints`);

    const expectedOrigin: CadPoint2D = [
      (Math.min(points[0][0], points[1][0]) + Math.max(points[0][0], points[1][0])) / 2,
      (Math.min(points[0][1], points[1][1]) + Math.max(points[0][1], points[1][1])) / 2,
    ];
    assert.ok(Math.abs(origin[0]! - expectedOrigin[0]) < 1e-5 && Math.abs(origin[1]! - expectedOrigin[1]) < 1e-5,
      `chunk ${index} uses its independently derived line-bounds midpoint as local origin`);
    const expectedXY = points.flatMap((point) => [
      Math.fround(point[0] - expectedOrigin[0]),
      Math.fround(point[1] - expectedOrigin[1]),
    ]);
    assert.deepEqual(Array.from(xy), expectedXY,
      `chunk ${index} stores the independently recomputed Float32 endpoint offsets`);

    const decodedStart: CadPoint2D = [origin[0]! + xy[0]!, origin[1]! + xy[1]!];
    const decodedEnd: CadPoint2D = [origin[0]! + xy[2]!, origin[1]! + xy[3]!];
    const startError = Math.hypot(decodedStart[0] - points[0][0], decodedStart[1] - points[0][1]);
    const endError = Math.hypot(decodedEnd[0] - points[1][0], decodedEnd[1] - points[1][1]);
    const measuredChunkError = Math.max(startError, endError);
    assert.ok(Math.abs(chunk.maxQuantizationErrorWorld - measuredChunkError) < 1e-12,
      `chunk ${index} generic quantization metric matches its independent endpoint oracle`);
    const expectedCssError = measuredChunkError * maxTransformSingularValue / unitsPerCssPixel;
    assert.ok(Math.abs(chunk.maxQuantizationErrorCssPixels! - expectedCssError) < 1e-10,
      `chunk ${index} applies the active affine/CSS scale to its endpoint error`);
    decodedSegments.push({ start: decodedStart, end: decodedEnd, startError, endError });
  }

  assert.deepEqual(lines[0]!.end, lines[1]!.start,
    "the two distinct source entities share one exact source vertex");
  const seamGapWorld = Math.hypot(
    decodedSegments[0]!.end[0] - decodedSegments[1]!.start[0],
    decodedSegments[0]!.end[1] - decodedSegments[1]!.start[1],
  );
  const endpointErrorEnvelopeWorld = decodedSegments[0]!.endError + decodedSegments[1]!.startError;
  const adjacentChunkEnvelopeWorld = scene.manifest.chunks[0]!.maxQuantizationErrorWorld
    + scene.manifest.chunks[1]!.maxQuantizationErrorWorld;
  assert.ok(seamGapWorld > 0,
    "different chunk origins produce a measurable decoded seam for the shared source vertex");
  assert.ok(seamGapWorld <= endpointErrorEnvelopeWorld + 1e-12,
    "cross-source seam gap fits the independently measured errors at its two encoded endpoints");
  assert.ok(seamGapWorld <= adjacentChunkEnvelopeWorld + 1e-12,
    "cross-source seam gap fits the sum of adjacent chunks' generic quantization bounds");
  assert.equal(scene.manifest.qualityStatus, "exact",
    "the measured seam remains within the selected CSS precision budget");

  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  for (let index = 0; index < scene.manifest.chunks.length; index++) {
    assert.equal(indexed.chunks[index].maxQuantizationErrorWorld,
      scene.manifest.chunks[index]!.maxQuantizationErrorWorld,
      `hash-index preserves the endpoint bound for source chunk ${index}`);
  }
  assert.equal(validateSceneManifest(scene.manifest).chunks.length, 2,
    "manifest validation preserves both independently bounded source chunks");
}

function testLineToArcSourceSeamIsBoundedAcrossChunks(): void {
  const center: CadPoint2D = [ORIGIN + 100.3, ORIGIN - 50.7];
  const radius = 100;
  const startAngle = 0.37;
  const endAngle = 0.97;
  const targetCssError = 0.25;
  const unitsPerCssPixel = 0.2;
  const maxTransformSingularValue = 1.5;
  const requestedWorldError = targetCssError * unitsPerCssPixel / maxTransformSingularValue;
  const tessellation = GeometryCompiler.tessellateArcWithBudget(
    center, radius, startAngle, endAngle, false, requestedWorldError,
  );
  const analyticArcPoint = (pointIndex: number): CadPoint2D => {
    const angle = startAngle + ((endAngle - startAngle) * pointIndex) / tessellation.segmentCount;
    return [center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)];
  };
  const sharedSourceVertex = analyticArcPoint(0);
  const lineStart: CadPoint2D = [sharedSourceVertex[0] - 177.1234, sharedSourceVertex[1] + 61.7389];
  const arc: CadEntity = {
    handle: "F07_LINE_TO_ARC_SOURCE_B",
    type: "ARC",
    layer: "0",
    order: 2n,
    center,
    radius,
    startAngleRad: startAngle,
    endAngleRad: endAngle,
    isClockwise: false,
  };
  const line: CadEntity = {
    handle: "F07_LINE_TO_ARC_SOURCE_A",
    type: "LINE",
    layer: "0",
    order: 1n,
    start: lineStart,
    end: sharedSourceVertex,
  };
  const scene = compileCanonicalToScene(makeDocument([line, arc], "f07-line-to-arc-chunk-seam"), {
    sceneId: "scene_f07_line_to_arc_chunk_seam",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel,
    maxTransformSingularValue,
    maxPrimitivesPerChunk: 1,
  });
  assert.ok(tessellation.segmentCount > 1, "the connected ARC contributes multiple chords after the LINE");
  assert.equal(scene.manifest.chunks.length, tessellation.segmentCount + 1,
    "the source LINE and every ARC chord are isolated into consecutive chunks");

  const decodeChunk = (chunkIndex: number, sourceEndpoints: CadPoint2D[]) => {
    const chunk = scene.manifest.chunks[chunkIndex]!;
    const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
    const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
    const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
    assert.equal(xy.length, 4, `chunk ${chunkIndex} contains exactly one connected source chord`);
    const expectedOrigin: CadPoint2D = [
      (Math.min(sourceEndpoints[0]![0], sourceEndpoints[1]![0])
        + Math.max(sourceEndpoints[0]![0], sourceEndpoints[1]![0])) / 2,
      (Math.min(sourceEndpoints[0]![1], sourceEndpoints[1]![1])
        + Math.max(sourceEndpoints[0]![1], sourceEndpoints[1]![1])) / 2,
    ];
    assert.ok(Math.abs(origin[0]! - expectedOrigin[0]) < 1e-7 && Math.abs(origin[1]! - expectedOrigin[1]) < 1e-7,
      `chunk ${chunkIndex} ORIGIN matches its independently derived chord-bounds midpoint`);
    const expectedXY = sourceEndpoints.flatMap((point) => [
      Math.fround(point[0] - expectedOrigin[0]),
      Math.fround(point[1] - expectedOrigin[1]),
    ]);
    assert.deepEqual(Array.from(xy), expectedXY,
      `chunk ${chunkIndex} stores independently recomputed Float32 endpoint offsets`);
    const decoded: [CadPoint2D, CadPoint2D] = [
      [origin[0]! + xy[0]!, origin[1]! + xy[1]!],
      [origin[0]! + xy[2]!, origin[1]! + xy[3]!],
    ];
    const endpointErrors = decoded.map((point, index) => Math.hypot(
      point[0] - sourceEndpoints[index]![0],
      point[1] - sourceEndpoints[index]![1],
    )) as [number, number];
    const maximumEndpointError = Math.max(...endpointErrors);
    assert.ok(Math.abs(chunk.maxQuantizationErrorWorld - maximumEndpointError) < 1e-12,
      `chunk ${chunkIndex} generic endpoint quantization matches the independent calculation`);
    assert.ok(Math.abs(chunk.maxQuantizationErrorCssPixels!
      - maximumEndpointError * maxTransformSingularValue / unitsPerCssPixel) < 1e-10,
    `chunk ${chunkIndex} projects endpoint error into CSS pixels`);
    return { chunk, decoded, endpointErrors };
  };

  const lineChunk = decodeChunk(0, [lineStart, sharedSourceVertex]);
  const firstArcPoints = [analyticArcPoint(0), analyticArcPoint(1)];
  assert.deepEqual(firstArcPoints[0], sharedSourceVertex,
    "the first analytic ARC chord starts at the LINE's exact source endpoint");
  const firstArcChunk = decodeChunk(1, firstArcPoints);
  const seamGapWorld = Math.hypot(
    lineChunk.decoded[1][0] - firstArcChunk.decoded[0][0],
    lineChunk.decoded[1][1] - firstArcChunk.decoded[0][1],
  );
  const seamEndpointEnvelopeWorld = lineChunk.endpointErrors[1] + firstArcChunk.endpointErrors[0];
  const adjacentQuantizationEnvelopeWorld = lineChunk.chunk.maxQuantizationErrorWorld
    + firstArcChunk.chunk.maxQuantizationErrorWorld;
  const analyticSagitta = radius * (1 - Math.cos((endAngle - startAngle) / (2 * tessellation.segmentCount)));
  const expectedArcCompositeWorld = analyticSagitta + Math.max(...firstArcChunk.endpointErrors);
  assert.ok(Math.abs(tessellation.maxSagittaWorld - analyticSagitta) < 1e-12,
    "tessellator sagitta agrees with an independent circular chord formula");
  assert.ok(Math.abs(firstArcChunk.chunk.maxCurveEncodedGeometryErrorWorld - expectedArcCompositeWorld) < 1e-10,
    "the first ARC chunk retains its analytic sagitta plus endpoint-encoding composite");
  assert.ok(Math.abs(firstArcChunk.chunk.maxCurveEncodedGeometryErrorCssPixels!
    - expectedArcCompositeWorld * maxTransformSingularValue / unitsPerCssPixel) < 1e-8,
  "the first ARC chunk preserves the composite in active-view CSS pixels");
  assert.ok(seamGapWorld > 0,
    "the distinct LINE and ARC chunk origins produce a measurable seam gap");
  assert.ok(seamGapWorld <= seamEndpointEnvelopeWorld + 1e-12,
    "LINE-to-ARC seam gap fits the independently measured errors at both shared endpoints");
  assert.ok(seamGapWorld <= adjacentQuantizationEnvelopeWorld + 1e-12,
    "LINE-to-ARC seam gap fits the adjacent generic chunk quantization bounds");
  assert.ok(seamGapWorld <= lineChunk.chunk.maxQuantizationErrorWorld
    + firstArcChunk.chunk.maxCurveEncodedGeometryErrorWorld + 1e-12,
  "LINE encoding plus the first ARC geometric/encoding composite covers the join");

  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks[1].maxCurveEncodedGeometryErrorWorld,
    firstArcChunk.chunk.maxCurveEncodedGeometryErrorWorld,
    "hash-index retains the first ARC chunk's composite bound");
  assert.equal(validateSceneManifest(scene.manifest).chunks.length, tessellation.segmentCount + 1,
    "manifest validation preserves the connected LINE and ARC chunk sequence");
}

function testArcToLineSourceSeamIsBoundedAcrossChunks(): void {
  const center: CadPoint2D = [ORIGIN + 100.3, ORIGIN - 50.7];
  const radius = 100;
  const startAngle = 0.37;
  const endAngle = 0.97;
  const targetCssError = 0.25;
  const unitsPerCssPixel = 0.2;
  const maxTransformSingularValue = 1.5;
  const requestedWorldError = targetCssError * unitsPerCssPixel / maxTransformSingularValue;
  const tessellation = GeometryCompiler.tessellateArcWithBudget(
    center, radius, startAngle, endAngle, false, requestedWorldError,
  );
  const analyticArcPoint = (pointIndex: number): CadPoint2D => {
    const angle = startAngle + ((endAngle - startAngle) * pointIndex) / tessellation.segmentCount;
    return [center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)];
  };
  const sharedSourceVertex = analyticArcPoint(tessellation.segmentCount);
  const lineEnd: CadPoint2D = [sharedSourceVertex[0] + 177.1234, sharedSourceVertex[1] + 61.7389];
  const arc: CadEntity = {
    handle: "F07_ARC_TO_LINE_SOURCE_A",
    type: "ARC",
    layer: "0",
    order: 1n,
    center,
    radius,
    startAngleRad: startAngle,
    endAngleRad: endAngle,
    isClockwise: false,
  };
  const line: CadEntity = {
    handle: "F07_ARC_TO_LINE_SOURCE_B",
    type: "LINE",
    layer: "0",
    order: 2n,
    start: sharedSourceVertex,
    end: lineEnd,
  };
  const scene = compileCanonicalToScene(makeDocument([arc, line], "f07-arc-to-line-chunk-seam"), {
    sceneId: "scene_f07_arc_to_line_chunk_seam",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel,
    maxTransformSingularValue,
    maxPrimitivesPerChunk: 1,
  });
  assert.ok(tessellation.segmentCount > 1, "the ARC contributes multiple chords before the connected LINE");
  assert.equal(scene.manifest.chunks.length, tessellation.segmentCount + 1,
    "every ARC chord and the following source LINE are isolated into consecutive chunks");

  const decodeChunk = (chunkIndex: number, sourceEndpoints: [CadPoint2D, CadPoint2D]) => {
    const chunk = scene.manifest.chunks[chunkIndex]!;
    const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
    const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
    const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
    assert.equal(xy.length, 4, `chunk ${chunkIndex} contains exactly one source chord`);
    const expectedOrigin: CadPoint2D = [
      (Math.min(sourceEndpoints[0][0], sourceEndpoints[1][0])
        + Math.max(sourceEndpoints[0][0], sourceEndpoints[1][0])) / 2,
      (Math.min(sourceEndpoints[0][1], sourceEndpoints[1][1])
        + Math.max(sourceEndpoints[0][1], sourceEndpoints[1][1])) / 2,
    ];
    assert.ok(Math.abs(origin[0]! - expectedOrigin[0]) < 1e-7 && Math.abs(origin[1]! - expectedOrigin[1]) < 1e-7,
      `chunk ${chunkIndex} ORIGIN matches its independently derived endpoint-bounds midpoint`);
    const expectedXY = sourceEndpoints.flatMap((point) => [
      Math.fround(point[0] - expectedOrigin[0]),
      Math.fround(point[1] - expectedOrigin[1]),
    ]);
    assert.deepEqual(Array.from(xy), expectedXY,
      `chunk ${chunkIndex} stores independently recomputed Float32 endpoint offsets`);
    const decoded: [CadPoint2D, CadPoint2D] = [
      [origin[0]! + xy[0]!, origin[1]! + xy[1]!],
      [origin[0]! + xy[2]!, origin[1]! + xy[3]!],
    ];
    const endpointErrors = decoded.map((point, index) => Math.hypot(
      point[0] - sourceEndpoints[index]![0],
      point[1] - sourceEndpoints[index]![1],
    )) as [number, number];
    const maximumEndpointError = Math.max(...endpointErrors);
    assert.ok(Math.abs(chunk.maxQuantizationErrorWorld - maximumEndpointError) < 1e-12,
      `chunk ${chunkIndex} generic endpoint quantization matches the independent calculation`);
    assert.ok(Math.abs(chunk.maxQuantizationErrorCssPixels!
      - maximumEndpointError * maxTransformSingularValue / unitsPerCssPixel) < 1e-10,
    `chunk ${chunkIndex} projects endpoint loss into active-view CSS pixels`);
    return { chunk, decoded, endpointErrors };
  };

  const lastArcIndex = tessellation.segmentCount - 1;
  const lastArcPoints: [CadPoint2D, CadPoint2D] = [
    analyticArcPoint(lastArcIndex), analyticArcPoint(tessellation.segmentCount),
  ];
  assert.deepEqual(lastArcPoints[1], sharedSourceVertex,
    "the final analytic ARC chord ends at the LINE's exact source endpoint");
  const lastArcChunk = decodeChunk(lastArcIndex, lastArcPoints);
  const lineChunk = decodeChunk(tessellation.segmentCount, [sharedSourceVertex, lineEnd]);
  const seamGapWorld = Math.hypot(
    lastArcChunk.decoded[1][0] - lineChunk.decoded[0][0],
    lastArcChunk.decoded[1][1] - lineChunk.decoded[0][1],
  );
  const seamEndpointEnvelopeWorld = lastArcChunk.endpointErrors[1] + lineChunk.endpointErrors[0];
  const adjacentQuantizationEnvelopeWorld = lastArcChunk.chunk.maxQuantizationErrorWorld
    + lineChunk.chunk.maxQuantizationErrorWorld;
  const analyticSagitta = radius * (1 - Math.cos((endAngle - startAngle)
    / (2 * tessellation.segmentCount)));
  const expectedArcCompositeWorld = analyticSagitta + Math.max(...lastArcChunk.endpointErrors);
  assert.ok(Math.abs(tessellation.maxSagittaWorld - analyticSagitta) < 1e-12,
    "the uniform ARC chord sagitta matches the independent circular formula");
  assert.ok(Math.abs(lastArcChunk.chunk.maxCurveEncodedGeometryErrorWorld - expectedArcCompositeWorld) < 1e-10,
    "the final ARC chunk retains its analytic sagitta plus endpoint-encoding composite");
  assert.ok(Math.abs(lastArcChunk.chunk.maxCurveEncodedGeometryErrorCssPixels!
    - expectedArcCompositeWorld * maxTransformSingularValue / unitsPerCssPixel) < 1e-8,
  "the final ARC composite is projected into active-view CSS pixels");
  assert.ok(seamGapWorld > 0,
    "the final ARC and following LINE chunk origins produce a measurable decoded seam");
  assert.ok(seamGapWorld <= seamEndpointEnvelopeWorld + 1e-12,
    "ARC-to-LINE seam gap fits the independently measured errors at both shared endpoints");
  assert.ok(seamGapWorld <= adjacentQuantizationEnvelopeWorld + 1e-12,
    "ARC-to-LINE seam gap fits the adjacent generic chunk quantization bounds");
  assert.ok(seamGapWorld <= lastArcChunk.chunk.maxCurveEncodedGeometryErrorWorld
    + lineChunk.chunk.maxQuantizationErrorWorld + 1e-12,
  "the final ARC geometry/encoding composite plus LINE encoding covers the cross-source join");

  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks[lastArcIndex].maxCurveEncodedGeometryErrorWorld,
    lastArcChunk.chunk.maxCurveEncodedGeometryErrorWorld,
    "hash-index retains the final ARC chunk's same-chord composite bound");
  assert.equal(indexed.chunks[tessellation.segmentCount].maxQuantizationErrorWorld,
    lineChunk.chunk.maxQuantizationErrorWorld,
    "hash-index retains the following LINE endpoint bound");
  assert.equal(validateSceneManifest(scene.manifest).chunks.length, tessellation.segmentCount + 1,
    "manifest validation preserves the ARC-to-LINE chunk sequence");
}

function testLineToNestedBulgeSourceSeamIsBoundedAcrossChunks(): void {
  const anchor: CadPoint2D = [ORIGIN + 250.123456789, ORIGIN - 87.654321987];
  const lineStart: CadPoint2D = [anchor[0] - 201.23456789, anchor[1] + 73.89123456];
  const polyline: CadLwPolylineEntity = {
    handle: "F07_LINE_TO_NESTED_BULGE_SOURCE_B",
    type: "LWPOLYLINE",
    layer: "0",
    order: 1n,
    isClosed: false,
    vertices: [{ x: 0, y: 0, bulge: 1 }, { x: 40, y: 0 }],
  };
  const innerInsert: CadInsertEntity = {
    handle: "F07_LINE_TO_NESTED_BULGE_INNER",
    type: "INSERT",
    layer: "0",
    order: 1n,
    blockName: "LINE_TO_NESTED_BULGE_LEAF",
    insertionPoint: [0, 0],
    scale: [2, 3, 1],
    rotationRad: 0,
  };
  const outerInsert: CadInsertEntity = {
    handle: "F07_LINE_TO_NESTED_BULGE_OUTER",
    type: "INSERT",
    layer: "0",
    order: 2n,
    blockName: "LINE_TO_NESTED_BULGE_BRANCH",
    insertionPoint: anchor,
    scale: [-4, 1, 1],
    rotationRad: 0.35,
  };
  const line: CadEntity = {
    handle: "F07_LINE_TO_NESTED_BULGE_SOURCE_A",
    type: "LINE",
    layer: "0",
    order: 1n,
    start: lineStart,
    end: anchor,
  };
  const document = makeDocument([line, outerInsert], "f07-line-to-nested-bulge-chunk-seam");
  document.blocks = {
    LINE_TO_NESTED_BULGE_BRANCH: { name: "LINE_TO_NESTED_BULGE_BRANCH", basePoint: [0, 0], entities: [innerInsert] },
    LINE_TO_NESTED_BULGE_LEAF: { name: "LINE_TO_NESTED_BULGE_LEAF", basePoint: [0, 0], entities: [polyline] },
  };

  const targetCssError = 0.5;
  const unitsPerCssPixel = 0.2;
  const maxTransformSingularValue = 1.5;
  const insertSingularValue = 8;
  const radius = 20;
  const sweep = Math.PI;
  const localTolerance = targetCssError * unitsPerCssPixel
    / (maxTransformSingularValue * insertSingularValue);
  const safeError = Math.min(radius * 0.5, localTolerance);
  const maxDeltaTheta = 2 * Math.asin(Math.sqrt((safeError * (2 * radius - safeError)) / (radius * radius)));
  const expectedChordCount = Math.ceil(sweep / maxDeltaTheta);
  const localSagitta = 2 * radius * Math.sin((sweep / expectedChordCount) / 4) ** 2;
  const nestedSagittaWorld = localSagitta * insertSingularValue;
  const cosine = Math.cos(0.35);
  const sine = Math.sin(0.35);
  const transformBulgePoint = (point: CadPoint2D): CadPoint2D => {
    const x = -8 * point[0];
    const y = 3 * point[1];
    return [anchor[0] + cosine * x - sine * y, anchor[1] + sine * x + cosine * y];
  };
  const bulgePoint = (fraction: number): CadPoint2D => {
    const angle = Math.PI + sweep * fraction;
    return [20 + radius * Math.cos(angle), radius * Math.sin(angle)];
  };
  const exactBulgePoint = (index: number): CadPoint2D =>
    transformBulgePoint(bulgePoint(index / expectedChordCount));

  const scene = compileCanonicalToScene(document, {
    sceneId: "scene_f07_line_to_nested_bulge_chunk_seam",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel,
    maxTransformSingularValue,
    maxPrimitivesPerChunk: 1,
  });
  assert.ok(expectedChordCount > 1, "the independent transformed BULGE profile emits multiple source chords");
  assert.equal(scene.manifest.chunks.length, expectedChordCount + 1,
    "the direct LINE and every nested BULGE chord are isolated into consecutive chunks");

  const decodeChunk = (chunkIndex: number, sourceEndpoints: [CadPoint2D, CadPoint2D]) => {
    const chunk = scene.manifest.chunks[chunkIndex]!;
    const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
    const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
    const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
    assert.equal(xy.length, 4, `chunk ${chunkIndex} contains exactly one emitted line primitive`);
    const expectedOrigin: CadPoint2D = [
      (Math.min(sourceEndpoints[0][0], sourceEndpoints[1][0])
        + Math.max(sourceEndpoints[0][0], sourceEndpoints[1][0])) / 2,
      (Math.min(sourceEndpoints[0][1], sourceEndpoints[1][1])
        + Math.max(sourceEndpoints[0][1], sourceEndpoints[1][1])) / 2,
    ];
    assert.ok(Math.abs(origin[0]! - expectedOrigin[0]) < 1e-5 && Math.abs(origin[1]! - expectedOrigin[1]) < 1e-5,
      `chunk ${chunkIndex} uses the independently derived endpoint-bounds midpoint as ORIGIN; actual=${Array.from(origin)}, expected=${expectedOrigin}`);
    const expectedXY = sourceEndpoints.flatMap((point) => [
      Math.fround(point[0] - expectedOrigin[0]), Math.fround(point[1] - expectedOrigin[1]),
    ]);
    for (let coordinate = 0; coordinate < expectedXY.length; coordinate++) {
      assert.ok(Math.abs(xy[coordinate]! - expectedXY[coordinate]!) < 2e-6,
        `chunk ${chunkIndex} Float32 endpoint ${coordinate} matches the independent affine result within transform-rounding tolerance`);
    }
    const decoded: [CadPoint2D, CadPoint2D] = [
      [origin[0]! + xy[0]!, origin[1]! + xy[1]!],
      [origin[0]! + xy[2]!, origin[1]! + xy[3]!],
    ];
    const endpointErrors = decoded.map((point, index) => Math.hypot(
      point[0] - sourceEndpoints[index]![0], point[1] - sourceEndpoints[index]![1],
    )) as [number, number];
    const maximumEndpointError = Math.max(...endpointErrors);
    assert.ok(Math.abs(chunk.maxQuantizationErrorWorld - maximumEndpointError) < 1e-6,
      `chunk ${chunkIndex} generic quantization metadata matches the independent endpoint round trip`);
    assert.ok(Math.abs(chunk.maxQuantizationErrorCssPixels!
      - maximumEndpointError * maxTransformSingularValue / unitsPerCssPixel) < 1e-5,
    `chunk ${chunkIndex} projects its endpoint loss into active-view CSS pixels`);
    return { chunk, decoded, endpointErrors };
  };

  const lineChunk = decodeChunk(0, [lineStart, anchor]);
  const firstBulgePoints: [CadPoint2D, CadPoint2D] = [exactBulgePoint(0), exactBulgePoint(1)];
  assert.deepEqual(firstBulgePoints[0], anchor,
    "the nested BULGE's analytic first endpoint is the LINE's exact source endpoint");
  const bulgeChunks = Array.from({ length: expectedChordCount }, (_, chord) => decodeChunk(
    chord + 1,
    [exactBulgePoint(chord), exactBulgePoint(chord + 1)],
  ));
  const firstBulgeChunk = bulgeChunks[0]!;
  const seamGapWorld = Math.hypot(
    lineChunk.decoded[1][0] - firstBulgeChunk.decoded[0][0],
    lineChunk.decoded[1][1] - firstBulgeChunk.decoded[0][1],
  );
  const seamEndpointErrorWorld = lineChunk.endpointErrors[1] + firstBulgeChunk.endpointErrors[0];
  const adjacentQuantizationBoundWorld = lineChunk.chunk.maxQuantizationErrorWorld
    + firstBulgeChunk.chunk.maxQuantizationErrorWorld;
  assert.ok(seamGapWorld > 0,
    "separate direct and nested-source chunk origins produce a measurable decoded seam");
  assert.ok(seamGapWorld <= seamEndpointErrorWorld + 1e-12,
    "LINE-to-nested-BULGE seam fits the two independently measured shared-endpoint errors");
  assert.ok(seamGapWorld <= adjacentQuantizationBoundWorld + 1e-12,
    "the seam also fits the adjacent generic chunk quantization bounds");
  assert.ok(Math.abs(firstBulgeChunk.chunk.maxBulgeCurveTessellationErrorWorld! - nestedSagittaWorld) < 1e-12,
    "the nested BULGE chunk stores the analytic local sagitta scaled by the combined INSERT singular value");
  assert.ok(Math.abs(firstBulgeChunk.chunk.maxBulgeCurveTessellationErrorCssPixels!
    - nestedSagittaWorld * maxTransformSingularValue / unitsPerCssPixel) < 1e-10,
  "the nested BULGE chord bound is projected into active-view CSS pixels exactly once");
  for (let chord = 0; chord < bulgeChunks.length; chord++) {
    const record = bulgeChunks[chord]!;
    const expectedCompositeWorld = nestedSagittaWorld + Math.max(...record.endpointErrors);
    const expectedCompositeCss = expectedCompositeWorld * maxTransformSingularValue / unitsPerCssPixel;
    assert.ok(Math.abs(record.chunk.maxBulgeCurveTessellationErrorWorld! - nestedSagittaWorld) < 1e-12,
      `nested BULGE chunk ${chord} preserves the same conservative affine-scaled sagitta`);
    assert.ok(Math.abs(record.chunk.maxCurveEncodedGeometryErrorWorld - expectedCompositeWorld) < 1e-6,
      `nested BULGE chunk ${chord} composite adds its same-chord endpoint loss to transformed sagitta`);
    assert.ok(Math.abs(record.chunk.maxCurveEncodedGeometryErrorCssPixels! - expectedCompositeCss) < 1e-5,
      `nested BULGE chunk ${chord} projects its composite into active-view CSS pixels once`);
  }
  const firstBulgeCompositeWorld = firstBulgeChunk.chunk.maxCurveEncodedGeometryErrorWorld;
  assert.ok(seamGapWorld <= lineChunk.chunk.maxQuantizationErrorWorld
    + firstBulgeChunk.chunk.maxCurveEncodedGeometryErrorWorld + 1e-12,
  "direct LINE encoding plus nested BULGE geometry/encoding bounds cover the cross-source join");

  const pointToSegmentDistance = (point: CadPoint2D, start: CadPoint2D, end: CadPoint2D): number => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const lengthSquared = dx * dx + dy * dy;
    const projection = Math.max(0, Math.min(1,
      ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared));
    return Math.hypot(point[0] - (start[0] + projection * dx), point[1] - (start[1] + projection * dy));
  };
  let maximumDenseErrorWorld = 0;
  let maximumDenseBoundWorld = 0;
  const denseSampleCount = 20_000;
  for (let sample = 0; sample <= denseSampleCount; sample++) {
    const fraction = sample / denseSampleCount;
    const chord = Math.min(expectedChordCount - 1, Math.floor(fraction * expectedChordCount));
    const record = bulgeChunks[chord]!;
    const decodedErrorWorld = Math.max(...record.endpointErrors);
    const sampleErrorWorld = pointToSegmentDistance(
      transformBulgePoint(bulgePoint(fraction)), record.decoded[0], record.decoded[1],
    );
    assert.ok(sampleErrorWorld <= nestedSagittaWorld + decodedErrorWorld + 1e-9,
      `analytic nested-BULGE sample ${sample} stays inside its chord's sagitta-plus-endpoint envelope`);
    maximumDenseErrorWorld = Math.max(maximumDenseErrorWorld, sampleErrorWorld);
    maximumDenseBoundWorld = Math.max(maximumDenseBoundWorld, nestedSagittaWorld + decodedErrorWorld);
  }
  assert.ok(maximumDenseErrorWorld <= maximumDenseBoundWorld + 1e-9,
    "20,001 analytic nested-BULGE samples stay within each decoded chord's transformed sagitta plus endpoint-error envelope");

  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  const validated = validateSceneManifest(scene.manifest);
  assert.equal(indexed.chunks.length, expectedChordCount + 1,
    "hash-index retains both the direct LINE and all nested BULGE chord chunks");
  for (let index = 0; index < scene.manifest.chunks.length; index++) {
    assert.equal(indexed.chunks[index].maxCurveEncodedGeometryErrorWorld,
      scene.manifest.chunks[index]!.maxCurveEncodedGeometryErrorWorld,
      `hash-index preserves the same-chord bound for chunk ${index}`);
    assert.equal(validated.chunks[index]?.maxCurveEncodedGeometryErrorWorld,
      scene.manifest.chunks[index]!.maxCurveEncodedGeometryErrorWorld,
      `manifest validation preserves the same-chord bound for chunk ${index}`);
  }
  const hasOverBudgetComposite = scene.manifest.chunks.some(
    (chunk) => (chunk.maxCurveEncodedGeometryErrorCssPixels ?? 0) > targetCssError * (1 + 1e-12),
  );
  assert.equal(scene.manifest.qualityStatus, hasOverBudgetComposite ? "degraded" : "exact",
    "scene quality status follows the maximum connected-source chunk composite budget");
  assert.equal(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("CURVE_ENCODED_PRECISION_LIMIT_REACHED"),
    hasOverBudgetComposite,
    "the scene curve precision diagnostic follows the independently checked per-chord CSS composite bounds");
  assert.equal(validated.chunks.length, expectedChordCount + 1,
    "manifest validation preserves the separate LINE and transformed BULGE chunk sequence");
}

function testNestedBulgeToLineSourceSeamIsBoundedAcrossChunks(): void {
  const anchor: CadPoint2D = [ORIGIN + 250.123456789, ORIGIN - 87.654321987];
  const targetCssError = 0.5;
  const unitsPerCssPixel = 0.2;
  const maxTransformSingularValue = 1.5;
  const insertSingularValue = 8;
  const radius = 20;
  const sweep = Math.PI;
  const localTolerance = targetCssError * unitsPerCssPixel
    / (maxTransformSingularValue * insertSingularValue);
  const safeError = Math.min(radius * 0.5, localTolerance);
  const maxDeltaTheta = 2 * Math.asin(Math.sqrt((safeError * (2 * radius - safeError)) / (radius * radius)));
  const expectedChordCount = Math.ceil(sweep / maxDeltaTheta);
  const localSagitta = 2 * radius * Math.sin((sweep / expectedChordCount) / 4) ** 2;
  const nestedSagittaWorld = localSagitta * insertSingularValue;
  const cosine = Math.cos(0.35);
  const sine = Math.sin(0.35);
  const transformBulgePoint = (point: CadPoint2D): CadPoint2D => {
    const x = -8 * point[0];
    const y = 3 * point[1];
    return [anchor[0] + cosine * x - sine * y, anchor[1] + sine * x + cosine * y];
  };
  const bulgePoint = (fraction: number): CadPoint2D => {
    const angle = Math.PI + sweep * fraction;
    return [20 + radius * Math.cos(angle), radius * Math.sin(angle)];
  };
  const exactBulgePoint = (index: number): CadPoint2D =>
    transformBulgePoint(bulgePoint(index / expectedChordCount));
  const sharedSourceVertex = exactBulgePoint(expectedChordCount);
  const lineEnd: CadPoint2D = [sharedSourceVertex[0] + 177.1234567, sharedSourceVertex[1] - 61.7389123];

  const polyline: CadLwPolylineEntity = {
    handle: "F07_NESTED_BULGE_TO_LINE_SOURCE_A",
    type: "LWPOLYLINE",
    layer: "0",
    order: 1n,
    isClosed: false,
    vertices: [{ x: 0, y: 0, bulge: 1 }, { x: 40, y: 0 }],
  };
  const innerInsert: CadInsertEntity = {
    handle: "F07_NESTED_BULGE_TO_LINE_INNER",
    type: "INSERT",
    layer: "0",
    order: 1n,
    blockName: "NESTED_BULGE_TO_LINE_LEAF",
    insertionPoint: [0, 0],
    scale: [2, 3, 1],
    rotationRad: 0,
  };
  const outerInsert: CadInsertEntity = {
    handle: "F07_NESTED_BULGE_TO_LINE_OUTER",
    type: "INSERT",
    layer: "0",
    order: 1n,
    blockName: "NESTED_BULGE_TO_LINE_BRANCH",
    insertionPoint: anchor,
    scale: [-4, 1, 1],
    rotationRad: 0.35,
  };
  const line: CadEntity = {
    handle: "F07_NESTED_BULGE_TO_LINE_SOURCE_B",
    type: "LINE",
    layer: "0",
    order: 2n,
    start: sharedSourceVertex,
    end: lineEnd,
  };
  const document = makeDocument([outerInsert, line], "f07-nested-bulge-to-line-chunk-seam");
  document.blocks = {
    NESTED_BULGE_TO_LINE_BRANCH: {
      name: "NESTED_BULGE_TO_LINE_BRANCH", basePoint: [0, 0], entities: [innerInsert],
    },
    NESTED_BULGE_TO_LINE_LEAF: {
      name: "NESTED_BULGE_TO_LINE_LEAF", basePoint: [0, 0], entities: [polyline],
    },
  };
  const scene = compileCanonicalToScene(document, {
    sceneId: "scene_f07_nested_bulge_to_line_chunk_seam",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel,
    maxTransformSingularValue,
    maxPrimitivesPerChunk: 1,
  });
  assert.ok(expectedChordCount > 1, "the independently budgeted nested BULGE has several chords");
  assert.equal(scene.manifest.chunks.length, expectedChordCount + 1,
    "every nested BULGE chord precedes a separate direct LINE chunk");

  const decodeChunk = (chunkIndex: number, sourceEndpoints: [CadPoint2D, CadPoint2D]) => {
    const chunk = scene.manifest.chunks[chunkIndex]!;
    const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
    const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
    const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
    assert.equal(xy.length, 4, `chunk ${chunkIndex} contains exactly one line primitive`);
    const expectedOrigin: CadPoint2D = [
      (Math.min(sourceEndpoints[0][0], sourceEndpoints[1][0])
        + Math.max(sourceEndpoints[0][0], sourceEndpoints[1][0])) / 2,
      (Math.min(sourceEndpoints[0][1], sourceEndpoints[1][1])
        + Math.max(sourceEndpoints[0][1], sourceEndpoints[1][1])) / 2,
    ];
    assert.ok(Math.abs(origin[0]! - expectedOrigin[0]) < 1e-5 && Math.abs(origin[1]! - expectedOrigin[1]) < 1e-5,
      `chunk ${chunkIndex} ORIGIN matches its independently derived bounds midpoint`);
    const expectedXY = sourceEndpoints.flatMap((point) => [
      Math.fround(point[0] - expectedOrigin[0]), Math.fround(point[1] - expectedOrigin[1]),
    ]);
    for (let coordinate = 0; coordinate < expectedXY.length; coordinate++) {
      assert.ok(Math.abs(xy[coordinate]! - expectedXY[coordinate]!) < 2e-6,
        `chunk ${chunkIndex} Float32 endpoint offset matches the independent affine oracle`);
    }
    const decoded: [CadPoint2D, CadPoint2D] = [
      [origin[0]! + xy[0]!, origin[1]! + xy[1]!],
      [origin[0]! + xy[2]!, origin[1]! + xy[3]!],
    ];
    const endpointErrors = decoded.map((point, index) => Math.hypot(
      point[0] - sourceEndpoints[index]![0], point[1] - sourceEndpoints[index]![1],
    )) as [number, number];
    const maximumEndpointError = Math.max(...endpointErrors);
    assert.ok(Math.abs(chunk.maxQuantizationErrorWorld - maximumEndpointError) < 1e-6,
      `chunk ${chunkIndex} generic world bound matches measured endpoint loss`);
    assert.ok(Math.abs(chunk.maxQuantizationErrorCssPixels!
      - maximumEndpointError * maxTransformSingularValue / unitsPerCssPixel) < 1e-5,
    `chunk ${chunkIndex} projects endpoint loss into active-view CSS pixels`);
    return { chunk, decoded, endpointErrors };
  };

  const lastBulgeIndex = expectedChordCount - 1;
  const lastBulgePoints: [CadPoint2D, CadPoint2D] = [
    exactBulgePoint(lastBulgeIndex), exactBulgePoint(expectedChordCount),
  ];
  assert.deepEqual(lastBulgePoints[1], sharedSourceVertex,
    "the nested BULGE's final analytic endpoint is the following LINE's exact source start");
  const lastBulgeChunk = decodeChunk(lastBulgeIndex, lastBulgePoints);
  const lineChunk = decodeChunk(expectedChordCount, [sharedSourceVertex, lineEnd]);
  const seamGapWorld = Math.hypot(
    lastBulgeChunk.decoded[1][0] - lineChunk.decoded[0][0],
    lastBulgeChunk.decoded[1][1] - lineChunk.decoded[0][1],
  );
  const endpointEnvelopeWorld = lastBulgeChunk.endpointErrors[1] + lineChunk.endpointErrors[0];
  const adjacentQuantizationWorld = lastBulgeChunk.chunk.maxQuantizationErrorWorld
    + lineChunk.chunk.maxQuantizationErrorWorld;
  const expectedCompositeWorld = nestedSagittaWorld + Math.max(...lastBulgeChunk.endpointErrors);
  const expectedCompositeCss = expectedCompositeWorld * maxTransformSingularValue / unitsPerCssPixel;
  assert.ok(Math.abs(lastBulgeChunk.chunk.maxBulgeCurveTessellationErrorWorld! - nestedSagittaWorld) < 1e-12,
    "the last BULGE chord bound includes the combined two-level INSERT singular value");
  assert.ok(Math.abs(lastBulgeChunk.chunk.maxCurveEncodedGeometryErrorWorld - expectedCompositeWorld) < 1e-6,
    "the last BULGE chord composite adds its endpoint round trip to transformed sagitta");
  assert.ok(Math.abs(lastBulgeChunk.chunk.maxCurveEncodedGeometryErrorCssPixels! - expectedCompositeCss) < 1e-5,
    "the last BULGE composite is projected to active-view CSS pixels once");
  assert.ok(seamGapWorld > 0,
    "independent nested-BULGE and direct-LINE chunk origins produce a measurable seam");
  assert.ok(seamGapWorld <= endpointEnvelopeWorld + 1e-12,
    "nested-BULGE-to-LINE seam fits the measured errors at both shared endpoints");
  assert.ok(seamGapWorld <= adjacentQuantizationWorld + 1e-12,
    "the seam fits the two chunks' generic quantization bounds");
  assert.ok(seamGapWorld <= lastBulgeChunk.chunk.maxCurveEncodedGeometryErrorWorld
    + lineChunk.chunk.maxQuantizationErrorWorld + 1e-12,
  "last nested-BULGE composite plus LINE encoding covers the reversed cross-source join");

  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks[lastBulgeIndex].maxCurveEncodedGeometryErrorWorld,
    lastBulgeChunk.chunk.maxCurveEncodedGeometryErrorWorld,
    "hash-index retains the final nested-BULGE chord composite");
  assert.equal(indexed.chunks[expectedChordCount].maxQuantizationErrorWorld,
    lineChunk.chunk.maxQuantizationErrorWorld,
    "hash-index retains the following direct-LINE endpoint bound");
  assert.equal(validateSceneManifest(scene.manifest).chunks.length, expectedChordCount + 1,
    "manifest validation preserves the nested-BULGE-to-LINE chunk sequence");
}

function testEllipseCurveTessellationErrorIsMeasuredAndBudgeted(): void {
  const center: CadPoint2D = [ORIGIN + 35, ORIGIN + 80];
  const majorAxisVector: CadPoint2D = [20, 3];
  const axisRatio = 0.35;
  const startParam = 0.15;
  const endParam = Math.PI * 1.85;
  const unitsPerCssPixel = 0.01;
  const transformSingularValue = 2;
  const sweep = endParam - startParam;
  const majorLength = Math.hypot(...majorAxisVector);
  const baselineWorldTolerance = 0.25 * unitsPerCssPixel / transformSingularValue;
  const expectedSegmentCount = Math.ceil(Math.abs(sweep) * Math.sqrt(majorLength / (8 * baselineWorldTolerance)));
  const expectedSagittaWorld = majorLength * (sweep / expectedSegmentCount) ** 2 / 8;
  // Place the view target just above the independently derived sagitta. This makes
  // tessellation and endpoint encoding individually fit while their same-chord sum fails.
  const targetCssError = expectedSagittaWorld * transformSingularValue / unitsPerCssPixel + 1e-9;
  const maxErrorWorld = targetCssError * unitsPerCssPixel / transformSingularValue;
  const ellipse = GeometryCompiler.tessellateEllipseWithBudget(
    center, majorAxisVector, axisRatio, startParam, endParam, maxErrorWorld,
  );
  const document = makeDocument([{
    handle: "MEASURED_ELLIPSE", type: "ELLIPSE", layer: "0", order: 1n,
    center, majorAxisVector, axisRatio, startParam, endParam,
  }], "f07-ellipse-curve-tessellation-error");
  const scene = compileCanonicalToScene(document, {
    sceneId: "scene_f07_ellipse_curve_tessellation_error",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel,
    maxTransformSingularValue: transformSingularValue,
  });
  const chunk = scene.manifest.chunks[0]!;
  assert.ok(ellipse.maxSagittaWorld > 0, "ellipse tessellator produces a measurable non-zero chord bound");
  assert.equal(ellipse.segmentCount, expectedSegmentCount,
    "ellipse tessellation count follows the independently derived second-derivative bound");
  assert.ok(Math.abs(ellipse.maxSagittaWorld - expectedSagittaWorld) < 1e-15,
    "ellipse chord deviation matches the analytic major-axis acceleration bound");
  assert.equal(chunk.maxEllipseCurveTessellationErrorWorld, expectedSagittaWorld,
    "chunk metadata matches the independent analytic ellipse chord bound");
  assert.ok(Math.abs(chunk.maxEllipseCurveTessellationErrorCssPixels! - expectedSagittaWorld * transformSingularValue / unitsPerCssPixel) < 1e-12,
    "active-view profile converts ellipse chord error to CSS pixels");
  assertCompositeCurveBudgetStatus(scene, chunk, targetCssError, "ellipse stroke");

  const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  assert.equal(xy.length / 4, expectedSegmentCount,
    "serialized line pairs match the independently derived ellipse parameter intervals");
  const minorAxisVector: CadPoint2D = [-majorAxisVector[1] * axisRatio, majorAxisVector[0] * axisRatio];
  const sourcePoint = (parameter: number): CadPoint2D => [
    center[0] + Math.cos(parameter) * majorAxisVector[0] + Math.sin(parameter) * minorAxisVector[0],
    center[1] + Math.cos(parameter) * majorAxisVector[1] + Math.sin(parameter) * minorAxisVector[1],
  ];
  const sameChordEndpointErrors: number[] = [];
  for (let chord = 0; chord < expectedSegmentCount; chord++) {
    const start = sourcePoint(startParam + sweep * chord / expectedSegmentCount);
    const end = sourcePoint(startParam + sweep * (chord + 1) / expectedSegmentCount);
    const offset = chord * 4;
    sameChordEndpointErrors.push(Math.max(
      Math.hypot(start[0] - (origin[0]! + xy[offset]!), start[1] - (origin[1]! + xy[offset + 1]!)),
      Math.hypot(end[0] - (origin[0]! + xy[offset + 2]!), end[1] - (origin[1]! + xy[offset + 3]!)),
    ));
  }
  const maxEllipseEndpointErrorWorld = Math.max(...sameChordEndpointErrors);
  const expectedCompositeWorld = Math.max(...sameChordEndpointErrors.map(
    (endpointErrorWorld) => expectedSagittaWorld + endpointErrorWorld,
  ));
  const expectedCompositeCss = expectedCompositeWorld * transformSingularValue / unitsPerCssPixel;
  assert.ok(maxEllipseEndpointErrorWorld > 0,
    "large-coordinate ellipse endpoints expose a non-zero Float32 round-trip error");
  assert.ok(expectedSagittaWorld * transformSingularValue / unitsPerCssPixel <= targetCssError &&
    maxEllipseEndpointErrorWorld * transformSingularValue / unitsPerCssPixel <= targetCssError,
  "ellipse tessellation and endpoint encoding each fit the target before same-chord composition");
  assert.ok(expectedCompositeCss > targetCssError,
    "the independently measured same-chord ellipse terms exceed the target together");
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorWorld - expectedCompositeWorld) < 1e-12,
    "manifest composite equals analytic ellipse sagitta plus that chord's measured endpoint loss");
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorCssPixels! - expectedCompositeCss) < 1e-10,
    "active-view CSS conversion scales the measured ellipse composite once");
  assert.equal(scene.manifest.qualityStatus, "degraded",
    "an ellipse same-chord composite overrun degrades the scene even when each term fits separately");
  assert.ok(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("CURVE_ENCODED_PRECISION_LIMIT_REACHED"),
    "the ellipse same-chord composite overrun emits the curve precision diagnostic");
  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks[0].maxEllipseCurveTessellationErrorWorld, expectedSagittaWorld,
    "hash-index metadata carries the same ellipse chord bound");
  assert.equal(indexed.chunks[0].maxCurveEncodedGeometryErrorWorld, chunk.maxCurveEncodedGeometryErrorWorld,
    "hash-index metadata carries the same ellipse composite bound");
  assert.equal(validateSceneManifest(scene.manifest).chunks[0]?.maxEllipseCurveTessellationErrorWorld, expectedSagittaWorld,
    "manifest validation preserves the ellipse chord bound");
  assert.equal(validateSceneManifest(scene.manifest).chunks[0]?.maxCurveEncodedGeometryErrorWorld,
    chunk.maxCurveEncodedGeometryErrorWorld,
    "manifest validation preserves the ellipse composite bound");

  const cappedEllipse = GeometryCompiler.tessellateEllipseWithBudget(
    center, majorAxisVector, axisRatio, startParam, endParam, maxErrorWorld, 1,
  );
  const capped = compileCanonicalToScene(makeDocument([{
    handle: "CAPPED_ELLIPSE", type: "ELLIPSE", layer: "0", order: 1n,
    center, majorAxisVector, axisRatio, startParam, endParam,
  }], "f07-ellipse-curve-tessellation-cap"), {
    sceneId: "scene_f07_ellipse_curve_tessellation_cap",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel,
    maxTransformSingularValue: transformSingularValue,
    maxCurveSegments: 1,
  });
  assert.ok(!cappedEllipse.errorBoundMet && cappedEllipse.maxSagittaWorld * transformSingularValue / unitsPerCssPixel > targetCssError,
    "independent one-segment ellipse oracle is over the requested screen budget");
  assert.equal(capped.manifest.chunks[0]!.maxEllipseCurveTessellationErrorWorld, cappedEllipse.maxSagittaWorld,
    "the capped ellipse's emitted error bound is recorded per chunk");
  assert.equal(capped.manifest.qualityStatus, "degraded", "an over-budget ellipse approximation cannot remain exact");
  assert.ok(capped.manifest.diagnosticsSummary.diagnosticCodes.includes("ELLIPSE_CURVE_TESSELLATION_LIMIT_REACHED"),
    "manifest names the ellipse tessellation budget overrun");
}

function testNestedEllipseTessellationErrorIncludesInsertTransforms(): void {
  const ellipse = {
    handle: "NESTED_METRIC_ELLIPSE", type: "ELLIPSE" as const, layer: "0", order: 1n,
    center: [5, 10] as CadPoint2D,
    majorAxisVector: [20, 3] as CadPoint2D,
    axisRatio: 0.35,
    startParam: 0.15,
    endParam: Math.PI * 1.85,
  };
  const innerInsert: CadInsertEntity = {
    handle: "INNER_METRIC_ELLIPSE_INSERT", type: "INSERT", layer: "0", order: 1n,
    blockName: "ELLIPSE_LEAF", insertionPoint: [0, 0], scale: [2, 3, 1], rotationRad: 0,
  };
  const outerInsert: CadInsertEntity = {
    handle: "OUTER_METRIC_ELLIPSE_INSERT", type: "INSERT", layer: "0", order: 2n,
    blockName: "ELLIPSE_BRANCH", insertionPoint: [ORIGIN, ORIGIN], scale: [4, 1, 1], rotationRad: 0,
  };
  const source = makeDocument([outerInsert], "f07-nested-ellipse-tessellation-error");
  source.blocks = {
    ELLIPSE_BRANCH: { name: "ELLIPSE_BRANCH", basePoint: [0, 0], entities: [innerInsert] },
    ELLIPSE_LEAF: { name: "ELLIPSE_LEAF", basePoint: [0, 0], entities: [ellipse] },
  };
  const screenTarget = 0.25;
  const unitsPerCssPixel = 0.01;
  const viewportSingularValue = 2;
  const nestedInsertSingularValue = 8;
  const sweep = ellipse.endParam - ellipse.startParam;
  const majorLength = Math.hypot(...ellipse.majorAxisVector);
  const baselineLocalTolerance = screenTarget * unitsPerCssPixel /
    (viewportSingularValue * nestedInsertSingularValue);
  const expectedSegmentCount = Math.ceil(Math.abs(sweep) * Math.sqrt(majorLength / (8 * baselineLocalTolerance)));
  const expectedLocalSagitta = majorLength * (sweep / expectedSegmentCount) ** 2 / 8;
  const expectedWorldSagitta = expectedLocalSagitta * nestedInsertSingularValue;
  const targetCssError = expectedWorldSagitta * viewportSingularValue / unitsPerCssPixel + 1e-9;
  const localTolerance = targetCssError * unitsPerCssPixel /
    (viewportSingularValue * nestedInsertSingularValue);
  const independent = GeometryCompiler.tessellateEllipseWithBudget(
    ellipse.center, ellipse.majorAxisVector, ellipse.axisRatio, ellipse.startParam, ellipse.endParam, localTolerance,
  );
  assert.equal(independent.segmentCount, expectedSegmentCount,
    "nested ellipse segment count follows the independently derived local tolerance after both INSERT scales");
  assert.ok(Math.abs(independent.maxSagittaWorld - expectedLocalSagitta) < 1e-15,
    "independent ellipse sagitta matches the source-space major-axis acceleration bound");

  const scene = compileCanonicalToScene(source, {
    sceneId: "scene_f07_nested_ellipse_tessellation_error",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel,
    maxTransformSingularValue: viewportSingularValue,
  });
  const chunk = scene.manifest.chunks[0]!;
  const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  assert.equal(xy.length / 4, expectedSegmentCount,
    "nested emitted line pairs match independently enumerated ellipse intervals");
  assert.ok(Math.abs(chunk.maxEllipseCurveTessellationErrorWorld! - expectedWorldSagitta) < 1e-12,
    "nested ellipse static sagitta is scaled by the combined 8x INSERT singular value");
  assert.ok(Math.abs(chunk.maxEllipseCurveTessellationErrorCssPixels! -
    expectedWorldSagitta * viewportSingularValue / unitsPerCssPixel) < 1e-10,
  "active-view transform converts nested ellipse sagitta to CSS pixels once");

  const minorAxisVector: CadPoint2D = [-ellipse.majorAxisVector[1] * ellipse.axisRatio, ellipse.majorAxisVector[0] * ellipse.axisRatio];
  const sourcePoint = (parameter: number): CadPoint2D => [
    ellipse.center[0] + Math.cos(parameter) * ellipse.majorAxisVector[0] + Math.sin(parameter) * minorAxisVector[0],
    ellipse.center[1] + Math.cos(parameter) * ellipse.majorAxisVector[1] + Math.sin(parameter) * minorAxisVector[1],
  ];
  const endpointErrors: number[] = [];
  for (let chord = 0; chord < expectedSegmentCount; chord++) {
    const start = sourcePoint(ellipse.startParam + sweep * chord / expectedSegmentCount);
    const end = sourcePoint(ellipse.startParam + sweep * (chord + 1) / expectedSegmentCount);
    const offset = chord * 4;
    endpointErrors.push(Math.max(
      Math.hypot(ORIGIN + 8 * start[0] - (origin[0]! + xy[offset]!), ORIGIN + 3 * start[1] - (origin[1]! + xy[offset + 1]!)),
      Math.hypot(ORIGIN + 8 * end[0] - (origin[0]! + xy[offset + 2]!), ORIGIN + 3 * end[1] - (origin[1]! + xy[offset + 3]!)),
    ));
  }
  const maxEndpointError = Math.max(...endpointErrors);
  const expectedCompositeWorld = Math.max(...endpointErrors.map(
    (endpointError) => expectedWorldSagitta + endpointError,
  ));
  const expectedCompositeCss = expectedCompositeWorld * viewportSingularValue / unitsPerCssPixel;
  assert.ok(maxEndpointError > 0, "nested large-coordinate ellipse exposes Float32 endpoint loss");
  assert.ok(expectedWorldSagitta * viewportSingularValue / unitsPerCssPixel <= targetCssError &&
    maxEndpointError * viewportSingularValue / unitsPerCssPixel <= targetCssError,
  "nested ellipse sagitta and endpoint encoding fit the target independently");
  assert.ok(expectedCompositeCss > targetCssError,
    "nested ellipse same-chord composite crosses the screen target");
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorWorld - expectedCompositeWorld) < 1e-10,
    "manifest nested ellipse composite equals affine sagitta plus same-chord endpoint error");
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorCssPixels! - expectedCompositeCss) < 1e-8,
    "nested ellipse composite uses the active-view scale in CSS pixels");
  assertCompositeCurveBudgetStatus(scene, chunk, targetCssError, "nested affine ellipse stroke");
  assert.ok(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("CURVE_ENCODED_PRECISION_LIMIT_REACHED"),
    "nested ellipse same-chord overrun emits the curve precision diagnostic");
  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks[0].maxEllipseCurveTessellationErrorWorld, chunk.maxEllipseCurveTessellationErrorWorld,
    "hash-index metadata carries the transformed ellipse sagitta bound");
  assert.equal(indexed.chunks[0].maxCurveEncodedGeometryErrorWorld, chunk.maxCurveEncodedGeometryErrorWorld,
    "hash-index metadata carries the nested ellipse composite bound");

  const paperSource = makeDocument([{
    ...outerInsert, handle: "PAPER_OUTER_METRIC_ELLIPSE_INSERT", insertionPoint: [0, 0],
  }], "f07-paper-nested-ellipse-tessellation-error");
  paperSource.blocks = source.blocks;
  paperSource.layouts = {
    Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [-1_000, -1_000, 1_000, 1_000] },
    Sheet: { id: "Sheet", name: "Sheet", isModelSpace: false, bbox: [0, 0, 200, 150], viewportIds: ["VP"] },
  };
  paperSource.viewports = {
    VP: {
      id: "VP", layoutId: "Sheet", order: 2n, center: [100, 75], width: 200, height: 150,
      viewCenter: [0, 0], viewHeight: 1_000, frozenLayers: [],
    },
  };
  const paperViewportSingularValue = 0.15;
  const paperUnitsPerCssPixel = 1;
  const paperScreenTarget = 0.25;
  const paperLocalTolerance = paperScreenTarget * paperUnitsPerCssPixel /
    (paperViewportSingularValue * nestedInsertSingularValue);
  const paperSegmentCount = Math.ceil(Math.abs(sweep) * Math.sqrt(majorLength / (8 * paperLocalTolerance)));
  const paperLocalSagitta = majorLength * (sweep / paperSegmentCount) ** 2 / 8;
  const paperScene = compileCanonicalToScene(paperSource, {
    sceneId: "scene_f07_paper_nested_ellipse_tessellation_error",
    layoutId: "Sheet",
    targetCurveErrorCssPixels: paperScreenTarget,
    unitsPerCssPixel: paperUnitsPerCssPixel,
    maxTransformSingularValue: 1,
  });
  const expectedPaperSagitta = paperLocalSagitta * nestedInsertSingularValue * paperViewportSingularValue;
  const observedPaperSagitta = paperScene.manifest.chunks[0]!.maxEllipseCurveTessellationErrorWorld ?? 0;
  assert.ok(Math.abs(observedPaperSagitta - expectedPaperSagitta) < 1e-10,
    `paper viewport projection scales the nested ellipse bound once (observed=${observedPaperSagitta}, expected=${expectedPaperSagitta}, scale=${paperViewportSingularValue})`);

  const clippedOuterInsert: CadInsertEntity = {
    ...outerInsert,
    handle: "CLIPPED_OUTER_METRIC_ELLIPSE_INSERT",
    clipBoundary: {
      boundaryVertices: [
        [ORIGIN - 100, ORIGIN - 100], [ORIGIN + 400, ORIGIN - 100],
        [ORIGIN + 400, ORIGIN + 45], [ORIGIN - 100, ORIGIN + 45],
      ],
    },
  };
  const clippedSource = makeDocument([clippedOuterInsert], "f07-clipped-nested-ellipse-tessellation-error");
  clippedSource.blocks = source.blocks;
  const clippedScene = compileCanonicalToScene(clippedSource, {
    sceneId: "scene_f07_clipped_nested_ellipse_tessellation_error",
    targetCurveErrorCssPixels: targetCssError,
    unitsPerCssPixel,
    maxTransformSingularValue: viewportSingularValue,
  });
  const clippedChunk = clippedScene.manifest.chunks[0]!;
  const clippedXY = parseSceneChunk(clippedScene.chunks.get(clippedChunk.chunkId)!).sections.get(SceneTag.XY)!.data as Float32Array;
  assert.ok(clippedXY.length > 0 && clippedXY.length < expectedSegmentCount * 4,
    "XCLIP preserves visible nested ellipse fragments and removes out-of-bound chords");
  assert.equal(clippedChunk.maxEllipseCurveTessellationErrorWorld, 0,
    "XCLIP chord fragments do not retain a full-source nested ellipse sagitta claim");
  assert.equal(clippedChunk.maxCurveEncodedGeometryErrorWorld, 0,
    "XCLIP chord fragments do not enter the curve source-plus-endpoint composite without a source bound");
}

function testSplineCurveTessellationErrorIsMeasuredAndBudgeted(): void {
  const spline: CadSplineEntity = {
    handle: "MEASURED_SPLINE", type: "SPLINE", layer: "0", order: 1n, degree: 3,
    controlPoints: [[0, 0], [0, 30], [30, 30], [30, 0]],
    knots: [0, 0, 0, 0, 1, 1, 1, 1], isPeriodic: false,
  };
  const maxErrorWorld = 0.25 * 0.01 / 2;
  const independent = GeometryCompiler.tessellateSplineWithBudget(spline, maxErrorWorld);
  const scene = compileCanonicalToScene(makeDocument([spline], "f07-spline-curve-tessellation-error"), {
    sceneId: "scene_f07_spline_curve_tessellation_error",
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.01,
    maxTransformSingularValue: 2,
  });
  const chunk = scene.manifest.chunks[0]!;
  assert.ok(independent.errorBoundMet && independent.maxSagittaWorld > 0,
    "the independent non-periodic spline oracle meets the requested world-space tessellation tolerance");
  assert.equal(chunk.maxSplineCurveTessellationErrorWorld, independent.maxSagittaWorld,
    "chunk metadata records the independent spline tessellator's maximum chord deviation");
  assert.ok(Math.abs(chunk.maxSplineCurveTessellationErrorCssPixels! - independent.maxSagittaWorld * 2 / 0.01) < 1e-12,
    "active-view profile converts spline chord deviation to CSS pixels");
  assertCompositeCurveBudgetStatus(scene, chunk, 0.25, "standalone spline stroke");
  assert.equal(scene.manifest.schemaVersion, 1, "adding manifest error metadata does not change the binary schema");
  assert.equal(scene.manifest.compilerVersion, CAD_V2_COMPILER_REVISION, "nested ellipse composite error-accounting output uses the active compiler cache revision");
  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks[0].maxSplineCurveTessellationErrorWorld, independent.maxSagittaWorld,
    "hash-index metadata carries the same spline chord bound");
  assert.equal(validateSceneManifest(scene.manifest).chunks[0]?.maxSplineCurveTessellationErrorWorld, independent.maxSagittaWorld,
    "manifest validation preserves the spline chord bound");

  const cappedOracle = GeometryCompiler.tessellateSplineWithBudget(spline, maxErrorWorld, 2);
  const capped = compileCanonicalToScene(makeDocument([spline], "f07-spline-curve-tessellation-cap"), {
    sceneId: "scene_f07_spline_curve_tessellation_cap",
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.01,
    maxTransformSingularValue: 2,
    maxCurveSegments: 2,
  });
  assert.ok(!cappedOracle.errorBoundMet && cappedOracle.maxSagittaWorld * 2 / 0.01 > 0.25,
    "independent two-segment spline oracle exceeds the requested screen-space budget");
  assert.equal(capped.manifest.chunks[0]!.maxSplineCurveTessellationErrorWorld, cappedOracle.maxSagittaWorld,
    "the capped spline's measured maximum attempted chord error is recorded");
  assert.equal(capped.manifest.qualityStatus, "degraded", "an over-budget spline approximation cannot remain exact");
  assert.ok(capped.manifest.diagnosticsSummary.diagnosticCodes.includes("SPLINE_CURVE_TESSELLATION_LIMIT_REACHED"),
    "manifest names the spline tessellation budget overrun");
}

function testNestedSplineTessellationErrorIncludesInsertTransforms(): void {
  const spline: CadSplineEntity = {
    handle: "NESTED_METRIC_SPLINE", type: "SPLINE", layer: "0", order: 1n, degree: 3,
    controlPoints: [[0, 0], [0, 30], [30, 30], [30, 0]],
    knots: [0, 0, 0, 0, 1, 1, 1, 1], isPeriodic: false,
  };
  const innerInsert: CadInsertEntity = {
    handle: "INNER_METRIC_INSERT", type: "INSERT", layer: "0", order: 1n,
    blockName: "SPLINE_LEAF", insertionPoint: [0, 0], scale: [2, 3, 1], rotationRad: 0,
  };
  const outerInsert: CadInsertEntity = {
    handle: "OUTER_METRIC_INSERT", type: "INSERT", layer: "0", order: 2n,
    blockName: "SPLINE_BRANCH", insertionPoint: [0, 0], scale: [4, 1, 1], rotationRad: 0,
  };
  const blocks: Record<string, CadBlockDefinition> = {
    SPLINE_BRANCH: { name: "SPLINE_BRANCH", basePoint: [0, 0], entities: [innerInsert] },
    SPLINE_LEAF: { name: "SPLINE_LEAF", basePoint: [0, 0], entities: [spline] },
  };
  const source = makeDocument([outerInsert], "f07-nested-spline-tessellation-error");
  source.blocks = blocks;
  const screenTarget = 0.25;
  const unitsPerCssPixel = 0.01;
  const transformSingularValue = 2;
  const maxErrorWorld = screenTarget * unitsPerCssPixel / transformSingularValue;
  const nestedInsertSingularValue = 8;
  const independent = GeometryCompiler.tessellateSplineWithBudget(spline, maxErrorWorld / nestedInsertSingularValue);
  const scene = compileCanonicalToScene(source, {
    sceneId: "scene_f07_nested_spline_tessellation_error",
    targetCurveErrorCssPixels: screenTarget,
    unitsPerCssPixel,
    maxTransformSingularValue: transformSingularValue,
  });
  const chunk = scene.manifest.chunks[0]!;
  const transformedErrorWorld = independent.maxSagittaWorld * nestedInsertSingularValue;
  assert.ok(independent.errorBoundMet && independent.maxSagittaWorld > 0,
    "independent spline tessellation meets the local tolerance derived from both nested INSERT scales");
  assert.ok(Math.abs(chunk.maxSplineCurveTessellationErrorWorld - transformedErrorWorld) < 1e-12,
    "nested spline chord error is scaled by the combined 8x INSERT singular value before manifesting");
  assert.ok(Math.abs(chunk.maxSplineCurveTessellationErrorCssPixels! - transformedErrorWorld * transformSingularValue / unitsPerCssPixel) < 1e-10,
    "the nested spline world bound composes with the active-view transform in CSS pixels");
  assertCompositeCurveBudgetStatus(scene, chunk, screenTarget, "nested affine spline stroke");

  // Independently measure exact cubic source endpoints against each encoded chord pair.
  // The compiler attaches the conservative maximum spline sagitta to every emitted chord;
  // verify it composes with the endpoint loss from that same primitive.
  const splineSpan = independent.splineBezierSpans?.[0];
  assert.ok(splineSpan && independent.splineBezierSpans?.length === 1,
    "the clamped cubic fixture resolves to one exposed rational-Bezier source span");
  const evaluateSource = (parameter: number): CadPoint2D => {
    const t = parameter;
    const u = 1 - t;
    const points = spline.controlPoints;
    return [
      u ** 3 * points[0]![0] + 3 * u ** 2 * t * points[1]![0] + 3 * u * t ** 2 * points[2]![0] + t ** 3 * points[3]![0],
      u ** 3 * points[0]![1] + 3 * u ** 2 * t * points[1]![1] + 3 * u * t ** 2 * points[2]![1] + t ** 3 * points[3]![1],
    ];
  };
  const evaluateDerivative = (parameter: number): CadPoint2D => {
    const t = parameter;
    const u = 1 - t;
    const points = spline.controlPoints;
    return [
      3 * u ** 2 * (points[1]![0] - points[0]![0]) + 6 * u * t * (points[2]![0] - points[1]![0]) + 3 * t ** 2 * (points[3]![0] - points[2]![0]),
      3 * u ** 2 * (points[1]![1] - points[0]![1]) + 6 * u * t * (points[2]![1] - points[1]![1]) + 3 * t ** 2 * (points[3]![1] - points[2]![1]),
    ];
  };
  const pointToSegmentDistance = (point: CadPoint2D, start: CadPoint2D, end: CadPoint2D): number => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const lengthSquared = dx * dx + dy * dy;
    const projection = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared));
    return Math.hypot(point[0] - (start[0] + projection * dx), point[1] - (start[1] + projection * dy));
  };
  const splineParsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
  const splineXY = splineParsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const splineOrigin = splineParsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const splineChordCount = splineSpan.parameters.length - 1;
  assert.equal(splineXY.length / 4, splineChordCount,
    "emitted nested spline line pairs match the independently enumerated source parameter intervals");
  let maxSplineEndpointRoundTripWorld = 0;
  let independentControlHullSagittaWorld = 0;
  const splineEndpointErrors: number[] = [];
  for (let chord = 0; chord < splineChordCount; chord++) {
    const startParameter = splineSpan.parameters[chord]!;
    const endParameter = splineSpan.parameters[chord + 1]!;
    const interval = endParameter - startParameter;
    const start = evaluateSource(startParameter);
    const end = evaluateSource(endParameter);
    const startDerivative = evaluateDerivative(startParameter);
    const endDerivative = evaluateDerivative(endParameter);
    const subcurveControl1: CadPoint2D = [
      start[0] + interval * startDerivative[0] / 3,
      start[1] + interval * startDerivative[1] / 3,
    ];
    const subcurveControl2: CadPoint2D = [
      end[0] - interval * endDerivative[0] / 3,
      end[1] - interval * endDerivative[1] / 3,
    ];
    independentControlHullSagittaWorld = Math.max(
      independentControlHullSagittaWorld,
      pointToSegmentDistance(subcurveControl1, start, end),
      pointToSegmentDistance(subcurveControl2, start, end),
    );
    const offset = chord * 4;
    const endpointErrorWorld = Math.max(
      Math.hypot(8 * start[0] - (splineOrigin[0]! + splineXY[offset]!), 3 * start[1] - (splineOrigin[1]! + splineXY[offset + 1]!)),
      Math.hypot(8 * end[0] - (splineOrigin[0]! + splineXY[offset + 2]!), 3 * end[1] - (splineOrigin[1]! + splineXY[offset + 3]!)),
    );
    maxSplineEndpointRoundTripWorld = Math.max(maxSplineEndpointRoundTripWorld, endpointErrorWorld);
    splineEndpointErrors.push(endpointErrorWorld);
  }
  assert.ok(maxSplineEndpointRoundTripWorld > 0,
    "nested spline fixture has measurable Float32 endpoint round-trip loss");
  const independentlyMeasuredSagittaWorld = independentControlHullSagittaWorld * nestedInsertSingularValue;
  assert.ok(Math.abs(independentlyMeasuredSagittaWorld - transformedErrorWorld) < 1e-10,
    "independent cubic subcurve control-hull distances match the nested sagitta bound");
  const expectedSplineCompositeWorld = Math.max(...splineEndpointErrors.map(
    (endpointErrorWorld) => independentlyMeasuredSagittaWorld + endpointErrorWorld,
  ));
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorWorld - expectedSplineCompositeWorld) < 1e-10,
    "manifest composite equals the affine spline sagitta plus that emitted chord's measured endpoint loss");
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorCssPixels! - expectedSplineCompositeWorld * transformSingularValue / unitsPerCssPixel) < 1e-9,
    "active-view CSS conversion scales the independently measured nested spline composite once");

  const cappedSegments = 2;
  const cappedOracle = GeometryCompiler.tessellateSplineWithBudget(
    spline, maxErrorWorld / nestedInsertSingularValue, cappedSegments,
  );
  const capped = compileCanonicalToScene(source, {
    sceneId: "scene_f07_nested_spline_tessellation_cap",
    targetCurveErrorCssPixels: screenTarget,
    unitsPerCssPixel,
    maxTransformSingularValue: transformSingularValue,
    maxCurveSegments: cappedSegments,
  });
  const cappedWorldBound = cappedOracle.maxSagittaWorld * nestedInsertSingularValue;
  assert.ok(!cappedOracle.errorBoundMet && cappedWorldBound * transformSingularValue / unitsPerCssPixel > screenTarget,
    "independent nested spline cap oracle exceeds the screen-space target after affine scaling");
  assert.ok(Math.abs(capped.manifest.chunks[0]!.maxSplineCurveTessellationErrorWorld - cappedWorldBound) < 1e-12,
    "the nested capped spline reports the affine-scaled tessellator bound");
  assert.ok(capped.manifest.diagnosticsSummary.diagnosticCodes.includes("SPLINE_CURVE_TESSELLATION_LIMIT_REACHED"),
    "affine-transformed spline overrun receives the spline-specific quality diagnostic");

  const clippedInsert: CadInsertEntity = {
    ...outerInsert,
    handle: "CLIPPED_OUTER_METRIC_INSERT",
    clipBoundary: { boundaryVertices: [[0, 0], [120, 0], [120, 90], [0, 90]] },
  };
  const clippedSource = makeDocument([clippedInsert], "f07-clipped-nested-spline-tessellation-error");
  clippedSource.blocks = blocks;
  const clipped = compileCanonicalToScene(clippedSource, {
    sceneId: "scene_f07_clipped_nested_spline_tessellation_error",
    targetCurveErrorCssPixels: screenTarget,
    unitsPerCssPixel,
    maxTransformSingularValue: transformSingularValue,
  });
  assert.ok(clipped.manifest.chunks[0]!.maxSplineCurveTessellationErrorWorld === 0,
    "XCLIP-created chord fragments do not claim an uncut nested spline source bound");
  const clippedChunk = parseSceneChunk(clipped.chunks.get(clipped.manifest.chunks[0]!.chunkId)!);
  assert.ok((clippedChunk.sections.get(SceneTag.XY)!.data as Float32Array).length > 0,
    "the XCLIP fixture still emits visible clipped spline chord fragments");
}

function testNestedBulgeTessellationErrorIncludesInsertTransforms(): void {
  const polyline: CadLwPolylineEntity = {
    handle: "NESTED_METRIC_BULGE",
    type: "LWPOLYLINE",
    layer: "0",
    order: 1n,
    isClosed: false,
    vertices: [{ x: 0, y: 0, bulge: 1 }, { x: 40, y: 0 }],
  };
  const innerInsert: CadInsertEntity = {
    handle: "INNER_METRIC_BULGE_INSERT", type: "INSERT", layer: "0", order: 1n,
    blockName: "BULGE_LEAF", insertionPoint: [0, 0], scale: [2, 3, 1], rotationRad: 0,
  };
  const outerInsert: CadInsertEntity = {
    handle: "OUTER_METRIC_BULGE_INSERT", type: "INSERT", layer: "0", order: 2n,
    blockName: "BULGE_BRANCH", insertionPoint: [0, 0], scale: [-4, 1, 1], rotationRad: 0.35,
  };
  const blocks: Record<string, CadBlockDefinition> = {
    BULGE_BRANCH: { name: "BULGE_BRANCH", basePoint: [0, 0], entities: [innerInsert] },
    BULGE_LEAF: { name: "BULGE_LEAF", basePoint: [0, 0], entities: [polyline] },
  };
  const source = makeDocument([outerInsert], "f07-nested-bulge-tessellation-error");
  source.blocks = blocks;

  const screenTarget = 0.25;
  const unitsPerCssPixel = 0.01;
  const transformSingularValue = 2;
  const nestedInsertSingularValue = 8;
  const maxErrorWorld = screenTarget * unitsPerCssPixel / transformSingularValue;
  const radius = 20;
  const directScene = compileCanonicalToScene(makeDocument([polyline], "f07-direct-bulge-tessellation-error"), {
    sceneId: "scene_f07_direct_bulge_tessellation_error",
    targetCurveErrorCssPixels: screenTarget,
    unitsPerCssPixel,
    maxTransformSingularValue: transformSingularValue,
  });
  const directChunk = directScene.manifest.chunks[0]!;
  const directParsed = parseSceneChunk(directScene.chunks.get(directChunk.chunkId)!);
  const directChordCount = (directParsed.sections.get(SceneTag.XY)!.data as Float32Array).length / 4;
  const directSagitta = radius * (1 - Math.cos(Math.PI / (2 * directChordCount)));
  assert.ok(directChordCount > 2 && Number.isInteger(directChordCount), "direct semicircle is emitted as a bounded set of line chords");
  assert.ok(Math.abs(directChunk.maxBulgeCurveTessellationErrorWorld - directSagitta) < 1e-12,
    "top-level LWPOLYLINE bulge sagitta reaches the manifest without INSERT scaling");
  assert.ok(Math.abs(directChunk.maxBulgeCurveTessellationErrorCssPixels! - directSagitta * transformSingularValue / unitsPerCssPixel) < 1e-10,
    "top-level active-view scale converts bulge sagitta to CSS pixels");

  const scene = compileCanonicalToScene(source, {
    sceneId: "scene_f07_nested_bulge_tessellation_error",
    targetCurveErrorCssPixels: screenTarget,
    unitsPerCssPixel,
    maxTransformSingularValue: transformSingularValue,
  });
  const chunk = scene.manifest.chunks[0]!;
  const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const chordCount = xy.length / 4;
  assert.ok(chordCount > 2 && Number.isInteger(chordCount), "nested semicircle is emitted as a bounded set of line chords");

  // Independent exact circle sagitta oracle: bulge=1 gives a 180° arc of radius 20.
  const localSagitta = radius * (1 - Math.cos(Math.PI / (2 * chordCount)));
  const expectedWorldBound = localSagitta * nestedInsertSingularValue;
  const expectedCssBound = expectedWorldBound * transformSingularValue / unitsPerCssPixel;
  assert.ok(expectedWorldBound <= maxErrorWorld * (1 + 1e-10), "the local bulge tessellation respects the screen budget after nested transforms");
  assert.ok(Math.abs(chunk.maxBulgeCurveTessellationErrorWorld - expectedWorldBound) < 1e-12,
    "chunk metadata records the independent sagitta bound multiplied by the combined 8x INSERT singular value");
  assert.ok(Math.abs(chunk.maxBulgeCurveTessellationErrorCssPixels! - expectedCssBound) < 1e-10,
    "active-view scale converts the transformed bulge chord bound to CSS pixels");
  assertCompositeCurveBudgetStatus(scene, chunk, screenTarget, "nested affine bulge stroke");
  assert.equal(scene.manifest.compilerVersion, CAD_V2_COMPILER_REVISION, "nested spline composite error metadata uses the active compiler cache revision");
  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.ok(Math.abs(indexed.chunks[0].maxBulgeCurveTessellationErrorWorld - expectedWorldBound) < 1e-12,
    "hash-index metadata carries the affine-scaled bulge chord bound");
  assert.ok(Math.abs(validateSceneManifest(scene.manifest).chunks[0]!.maxBulgeCurveTessellationErrorWorld! - expectedWorldBound) < 1e-12,
    "manifest validation preserves the bulge chord bound");

  // Dense geometry oracle independently measures the transformed source arc against emitted chords.
  const applyTransform = (point: CadPoint2D): CadPoint2D => {
    const x = -4 * point[0] * 2;
    const y = point[1] * 3;
    const cosine = Math.cos(0.35);
    const sine = Math.sin(0.35);
    return [cosine * x - sine * y, sine * x + cosine * y];
  };
  const pointToSegmentDistance = (point: CadPoint2D, start: CadPoint2D, end: CadPoint2D): number => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const lengthSquared = dx * dx + dy * dy;
    const projection = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared));
    return Math.hypot(point[0] - (start[0] + projection * dx), point[1] - (start[1] + projection * dy));
  };
  let denseMaxError = 0;
  const sampleCount = 20_000;
  for (let sample = 0; sample <= sampleCount; sample++) {
    const fraction = sample / sampleCount;
    const angle = Math.PI + Math.PI * fraction;
    const sourcePoint: CadPoint2D = [20 + radius * Math.cos(angle), radius * Math.sin(angle)];
    const chordIndex = Math.min(chordCount - 1, Math.floor(fraction * chordCount));
    const chordStartAngle = Math.PI + Math.PI * chordIndex / chordCount;
    const chordEndAngle = Math.PI + Math.PI * (chordIndex + 1) / chordCount;
    const chordStart = applyTransform([20 + radius * Math.cos(chordStartAngle), radius * Math.sin(chordStartAngle)]);
    const chordEnd = applyTransform([20 + radius * Math.cos(chordEndAngle), radius * Math.sin(chordEndAngle)]);
    denseMaxError = Math.max(denseMaxError, pointToSegmentDistance(applyTransform(sourcePoint), chordStart, chordEnd));
  }
  assert.ok(denseMaxError <= expectedWorldBound * (1 + 1e-9),
    "20,001 independently sampled transformed arc points stay inside the manifest's affine chord bound");

  // Independent same-chord composite oracle: source sagitta and serialized endpoint loss
  // must be measured for each emitted line separately before taking the chunk maximum.
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  let expectedCompositeWorld = 0;
  let maxEndpointRoundTripWorld = 0;
  for (let chord = 0; chord < chordCount; chord++) {
    const startAngle = Math.PI + Math.PI * chord / chordCount;
    const endAngle = Math.PI + Math.PI * (chord + 1) / chordCount;
    const exactStart = applyTransform([20 + radius * Math.cos(startAngle), radius * Math.sin(startAngle)]);
    const exactEnd = applyTransform([20 + radius * Math.cos(endAngle), radius * Math.sin(endAngle)]);
    const offset = chord * 4;
    const encodedStart: CadPoint2D = [origin[0]! + xy[offset]!, origin[1]! + xy[offset + 1]!];
    const encodedEnd: CadPoint2D = [origin[0]! + xy[offset + 2]!, origin[1]! + xy[offset + 3]!];
    const endpointRoundTripWorld = Math.max(
      Math.hypot(exactStart[0] - encodedStart[0], exactStart[1] - encodedStart[1]),
      Math.hypot(exactEnd[0] - encodedEnd[0], exactEnd[1] - encodedEnd[1]),
    );
    maxEndpointRoundTripWorld = Math.max(maxEndpointRoundTripWorld, endpointRoundTripWorld);
    expectedCompositeWorld = Math.max(expectedCompositeWorld, expectedWorldBound + endpointRoundTripWorld);
  }
  assert.ok(maxEndpointRoundTripWorld > 0, "nested bulge fixture has measurable Float32 endpoint round-trip loss");
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorWorld - expectedCompositeWorld) < 1e-10,
    "manifest composite equals the maximum same-chord affine sagitta plus that chord's emitted Float32 endpoint error");
  assert.ok(Math.abs(chunk.maxCurveEncodedGeometryErrorCssPixels! - expectedCompositeWorld * transformSingularValue / unitsPerCssPixel) < 1e-9,
    "active-view CSS composite scales the independently measured nested bulge chord bound exactly once");

  const capped = compileCanonicalToScene(source, {
    sceneId: "scene_f07_nested_bulge_tessellation_cap",
    targetCurveErrorCssPixels: screenTarget,
    unitsPerCssPixel,
    maxTransformSingularValue: transformSingularValue,
    maxCurveSegments: 2,
  });
  const cappedChunk = capped.manifest.chunks[0]!;
  const cappedSagittaWorld = radius * (1 - Math.cos(Math.PI / 4)) * nestedInsertSingularValue;
  assert.ok(cappedChunk.maxBulgeCurveTessellationErrorCssPixels! > screenTarget,
    "two emitted chords independently exceed the screen-space tolerance after affine scaling");
  assert.ok(Math.abs(cappedChunk.maxBulgeCurveTessellationErrorWorld - cappedSagittaWorld) < 1e-12,
    "the bounded overrun remains measurable in the chunk manifest");
  assert.equal(capped.manifest.qualityStatus, "degraded", "an over-budget nested bulge cannot remain exact");
  assert.ok(capped.manifest.diagnosticsSummary.diagnosticCodes.includes("BULGE_CURVE_TESSELLATION_LIMIT_REACHED"),
    "the over-budget nested bulge receives a bulge-specific diagnostic");

  const clippedInsert: CadInsertEntity = {
    ...outerInsert,
    handle: "CLIPPED_OUTER_METRIC_BULGE_INSERT",
    clipBoundary: { boundaryVertices: [[-200, -200], [50, -200], [50, 20], [-200, 20]] },
  };
  const clippedSource = makeDocument([clippedInsert], "f07-clipped-nested-bulge-tessellation-error");
  clippedSource.blocks = blocks;
  const clipped = compileCanonicalToScene(clippedSource, {
    sceneId: "scene_f07_clipped_nested_bulge_tessellation_error",
    targetCurveErrorCssPixels: screenTarget,
    unitsPerCssPixel,
    maxTransformSingularValue: transformSingularValue,
  });
  assert.equal(clipped.manifest.chunks[0]!.maxBulgeCurveTessellationErrorWorld, 0,
    "XCLIP-processed bulge chords do not claim an uncut source-arc bound");
  const clippedChunk = parseSceneChunk(clipped.chunks.get(clipped.manifest.chunks[0]!.chunkId)!);
  const clippedXY = clippedChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  assert.ok(clippedXY.length > 0 && clippedXY.length < xy.length,
    "the XCLIP fixture retains only the visible portion of the bulge chord geometry");
}

function testCurveSourceQuantizationIsMeasuredAndBudgeted(): void {
  const center: CadPoint2D = [ORIGIN + 0.13, -ORIGIN + 0.27];
  const radius = 100_000.137;
  const start = 1.234567;
  const end = 1.235567;
  const document = makeDocument([{
    handle: "F32_ARC_SOURCE", type: "ARC", layer: "0", order: 1n,
    center, radius, startAngleRad: start, endAngleRad: end, isClockwise: false,
  }], "f07-curve-source-quantization");
  const scene = compileCanonicalToScene(document, {
    sceneId: "scene_f07_curve_source_quantization",
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.004,
    maxTransformSingularValue: 1,
  });
  const chunkRef = scene.manifest.chunks[0]!;
  const parsed = parseSceneChunk(scene.chunks.get(chunkRef.chunkId)!);
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const curveData = parsed.sections.get(SceneTag.CURVE_DATA)!.data as Float32Array;
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const meta = JSON.parse(new TextDecoder().decode(parsed.sections.get(SceneTag.META)!.data as Uint8Array));
  const refs = meta.curveSourceRefs as CurveSourceRef[];
  assert.equal(meta.curveSourceVersion, 3, "new source error-budget semantics are explicitly versioned in META");
  assert.equal(refs.length, 1, "continuous ARC sidecar stays a single source interval");

  const sourceLocalCenter: CadPoint2D = [center[0] - origin[0]!, center[1] - origin[1]!];
  const centerError = Math.hypot(curveData[0]! - sourceLocalCenter[0], curveData[1]! - sourceLocalCenter[1]);
  const basisUError = Math.hypot(curveData[2]! - radius, curveData[3]!);
  const basisVError = Math.hypot(curveData[4]!, curveData[5]! - radius);
  const parameterError = Math.max(Math.abs(curveData[6]! - start), Math.abs(curveData[7]! - end));
  const rawBound = centerError + basisUError + basisVError + 2 * radius * parameterError;
  const expectedBound = rawBound + Math.max(1, rawBound) * 32 * Number.EPSILON;
  assert.ok(expectedBound > 0.001, "fixture creates a measurable sidecar source error beyond the active world budget");
  assert.ok(Math.abs(refs[0]!.sourceQuantizationErrorWorld! - expectedBound) < 1e-12,
    "META records the independently reconstructed affine sidecar quantization bound");
  assert.ok(Math.abs(chunkRef.maxCurveSourceQuantizationErrorWorld - expectedBound) < 1e-12,
    "flat manifest reports the maximum per-reference sidecar source error");
  assert.ok(Math.abs(chunkRef.maxCurveSourceQuantizationErrorCssPixels! - expectedBound / 0.004) < 1e-9,
    "active transform converts the sidecar source bound into CSS pixels");
  const indexed = JSON.parse(scene.indexFiles!.get(scene.manifest.indexPages[0]!.indexId)!);
  assert.equal(indexed.chunks[0].maxCurveSourceQuantizationErrorWorld, chunkRef.maxCurveSourceQuantizationErrorWorld,
    "hash-index metadata carries the same sidecar error measurement");
  const validated = validateSceneManifest(scene.manifest);
  assert.equal(validated.chunks[0]?.maxCurveSourceQuantizationErrorWorld, expectedBound,
    "manifest validation retains the sidecar source error measurement");
  assert.equal(scene.manifest.qualityStatus, "degraded", "screen budget overrun cannot remain exact");
  assert.ok(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("CURVE_SIDECAR_PRECISION_LIMIT_REACHED"),
    "manifest identifies affine source sidecar precision as the degraded reason");

  let sampledMaximum = 0;
  for (let sample = 0; sample <= 1000; sample++) {
    const fraction = sample / 1000;
    const sourceParam = start + (end - start) * fraction;
    const storedParam = curveData[6]! + (curveData[7]! - curveData[6]!) * fraction;
    const expected: CadPoint2D = [
      center[0] + radius * Math.cos(sourceParam), center[1] + radius * Math.sin(sourceParam),
    ];
    const encoded: CadPoint2D = [
      origin[0]! + curveData[0]! + curveData[2]! * Math.cos(storedParam) + curveData[4]! * Math.sin(storedParam),
      origin[1]! + curveData[1]! + curveData[3]! * Math.cos(storedParam) + curveData[5]! * Math.sin(storedParam),
    ];
    sampledMaximum = Math.max(sampledMaximum, Math.hypot(expected[0] - encoded[0], expected[1] - encoded[1]));
  }
  assert.ok(sampledMaximum <= expectedBound + 1e-8,
    "dense direct ARC oracle stays inside the conservative center/basis/parameter bound");

  const workerResult = refineCurveSourceIntervals({
    curveData, curveSourceRefs: refs, fallbackVertexCount: xy.length / 2,
    targetErrorCssPixels: 0.25, unitsPerCssPixel: 0.004, maxTransformSingularValue: 1,
  });
  assert.equal(workerResult.errorBoundMet, false, "worker reserves the input sidecar error before refinement");
  assert.equal(workerResult.intervals[0]?.status, "degraded", "worker declines a source span with no remaining error budget");
  assert.equal(workerResult.intervals[0]?.coordinates, null, "worker keeps fallback geometry instead of emitting an over-budget span");
  assert.throws(() => refineCurveSourceIntervals({
    curveData, curveSourceRefs: [{ ...refs[0]!, sourceQuantizationErrorWorld: -1 }],
    fallbackVertexCount: xy.length / 2,
    targetErrorCssPixels: 0.25, unitsPerCssPixel: 0.004, maxTransformSingularValue: 1,
  }), /invalid source quantization error/, "worker rejects malformed negative source error budgets");
}

function testValidatorRejectsInvalidOrConflictingErrorMetrics(): void {
  const document = makeDocument([
    { handle: "VALID_LINE", type: "LINE", layer: "0", order: 1n, start: [0, 0], end: [10, 0] },
  ], "f07-quantization-manifest-validation");
  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_quantization_manifest_validation" });
  const invalid = structuredClone(scene.manifest);
  invalid.chunks[0]!.maxQuantizationErrorWorld = -1;
  assert.throws(() => validateSceneManifest(invalid), /geçersiz maxQuantizationErrorWorld/,
    "negative quantization error metadata is rejected");

  const conflicting = JSON.parse(JSON.stringify(scene.manifest));
  conflicting.indexPages[0].chunks[0].maxQuantizationErrorWorld += 1;
  assert.throws(() => validateSceneManifest(conflicting), /maxQuantizationErrorWorld değeri indexPages ile manifest\.chunks arasında uyuşmuyor/,
    "flat and indexed quantization bounds cannot disagree");

  const invalidCurveMetric = JSON.parse(JSON.stringify(scene.manifest));
  invalidCurveMetric.chunks[0].maxCurveSourceQuantizationErrorWorld = -1;
  assert.throws(() => validateSceneManifest(invalidCurveMetric), /geçersiz maxCurveSourceQuantizationErrorWorld/,
    "negative affine source quantization metrics are rejected");

  const invalidCircularCurveMetric = JSON.parse(JSON.stringify(scene.manifest));
  invalidCircularCurveMetric.chunks[0].maxCircularCurveTessellationErrorWorld = -1;
  assert.throws(() => validateSceneManifest(invalidCircularCurveMetric), /geçersiz maxCircularCurveTessellationErrorWorld/,
    "negative circular tessellation metrics are rejected");
  const conflictingCircularCurveMetric = JSON.parse(JSON.stringify(scene.manifest));
  conflictingCircularCurveMetric.indexPages[0].chunks[0].maxCircularCurveTessellationErrorWorld += 1;
  assert.throws(() => validateSceneManifest(conflictingCircularCurveMetric), /maxCircularCurveTessellationErrorWorld değeri indexPages ile manifest\.chunks arasında uyuşmuyor/,
    "flat and indexed circular tessellation bounds cannot disagree");
  const invalidEllipseCurveMetric = JSON.parse(JSON.stringify(scene.manifest));
  invalidEllipseCurveMetric.chunks[0].maxEllipseCurveTessellationErrorWorld = -1;
  assert.throws(() => validateSceneManifest(invalidEllipseCurveMetric), /geçersiz maxEllipseCurveTessellationErrorWorld/,
    "negative ellipse tessellation metrics are rejected");
  const conflictingEllipseCurveMetric = JSON.parse(JSON.stringify(scene.manifest));
  conflictingEllipseCurveMetric.indexPages[0].chunks[0].maxEllipseCurveTessellationErrorWorld += 1;
  assert.throws(() => validateSceneManifest(conflictingEllipseCurveMetric), /maxEllipseCurveTessellationErrorWorld değeri indexPages ile manifest\.chunks arasında uyuşmuyor/,
    "flat and indexed ellipse tessellation bounds cannot disagree");
  const invalidSplineCurveMetric = JSON.parse(JSON.stringify(scene.manifest));
  invalidSplineCurveMetric.chunks[0].maxSplineCurveTessellationErrorWorld = -1;
  assert.throws(() => validateSceneManifest(invalidSplineCurveMetric), /geçersiz maxSplineCurveTessellationErrorWorld/,
    "negative spline tessellation metrics are rejected");
  const conflictingSplineCurveMetric = JSON.parse(JSON.stringify(scene.manifest));
  conflictingSplineCurveMetric.indexPages[0].chunks[0].maxSplineCurveTessellationErrorWorld += 1;
  assert.throws(() => validateSceneManifest(conflictingSplineCurveMetric), /maxSplineCurveTessellationErrorWorld değeri indexPages ile manifest\.chunks arasında uyuşmuyor/,
    "flat and indexed spline tessellation bounds cannot disagree");
  const conflictingCurveMetric = JSON.parse(JSON.stringify(scene.manifest));
  conflictingCurveMetric.indexPages[0].chunks[0].maxCurveSourceQuantizationErrorWorld += 1;
  assert.throws(() => validateSceneManifest(conflictingCurveMetric), /maxCurveSourceQuantizationErrorWorld değeri indexPages ile manifest\.chunks arasında uyuşmuyor/,
    "flat and indexed affine source bounds cannot disagree");

  const invalidPathMetric = JSON.parse(JSON.stringify(scene.manifest));
  invalidPathMetric.chunks[0].maxPathDistanceQuantizationErrorWorld = -1;
  assert.throws(() => validateSceneManifest(invalidPathMetric), /geçersiz maxPathDistanceQuantizationErrorWorld/,
    "negative path-distance error metrics are rejected");
  const conflictingPathMetric = JSON.parse(JSON.stringify(scene.manifest));
  conflictingPathMetric.indexPages[0].chunks[0].maxPathDistanceQuantizationErrorWorld += 1;
  assert.throws(() => validateSceneManifest(conflictingPathMetric), /maxPathDistanceQuantizationErrorWorld değeri indexPages ile manifest\.chunks arasında uyuşmuyor/,
    "flat and indexed path-distance error bounds cannot disagree");

  const invalidHatchMetric = JSON.parse(JSON.stringify(scene.manifest));
  invalidHatchMetric.chunks[0].maxHatchFillBoundaryTessellationErrorWorld = -1;
  assert.throws(() => validateSceneManifest(invalidHatchMetric), /geçersiz maxHatchFillBoundaryTessellationErrorWorld/,
    "negative HATCH fill boundary metrics are rejected");
  const conflictingHatchMetric = JSON.parse(JSON.stringify(scene.manifest));
  conflictingHatchMetric.indexPages[0].chunks[0].maxHatchFillBoundaryTessellationErrorWorld += 1;
  assert.throws(() => validateSceneManifest(conflictingHatchMetric), /maxHatchFillBoundaryTessellationErrorWorld değeri indexPages ile manifest\.chunks arasında uyuşmuyor/,
    "flat and indexed HATCH fill boundary bounds cannot disagree");
  const invalidHatchFillEncoding = JSON.parse(JSON.stringify(scene.manifest));
  invalidHatchFillEncoding.chunks[0].maxHatchFillEncodedGeometryErrorWorld = -1;
  assert.throws(() => validateSceneManifest(invalidHatchFillEncoding), /geçersiz maxHatchFillEncodedGeometryErrorWorld/,
    "negative composite HATCH fill precision metrics are rejected");
  const conflictingHatchFillEncoding = JSON.parse(JSON.stringify(scene.manifest));
  conflictingHatchFillEncoding.indexPages[0].chunks[0].maxHatchFillEncodedGeometryErrorWorld += 1;
  assert.throws(() => validateSceneManifest(conflictingHatchFillEncoding), /maxHatchFillEncodedGeometryErrorWorld değeri indexPages ile manifest\.chunks arasında uyuşmuyor/,
    "flat and indexed composite HATCH fill bounds cannot disagree");
  const invalidBulgeMetric = JSON.parse(JSON.stringify(scene.manifest));
  invalidBulgeMetric.chunks[0].maxBulgeCurveTessellationErrorWorld = -1;
  assert.throws(() => validateSceneManifest(invalidBulgeMetric), /geçersiz maxBulgeCurveTessellationErrorWorld/,
    "negative bulge curve error metadata is rejected");
  const conflictingBulgeMetric = JSON.parse(JSON.stringify(scene.manifest));
  conflictingBulgeMetric.indexPages[0].chunks[0].maxBulgeCurveTessellationErrorWorld += 1;
  assert.throws(() => validateSceneManifest(conflictingBulgeMetric), /maxBulgeCurveTessellationErrorWorld değeri indexPages ile manifest\.chunks arasında uyuşmuyor/,
    "flat and indexed bulge chord bounds cannot disagree");
}

testWorldAndCssQuantizationAccounting();
testTextGlyphEndpointsContributeToEncodedQuantizationBudget();
testExceededScreenBudgetDegradesScene();
testTriangleBuffersAreAccounted();
testPathDistanceFloat32QuantizationIsMeasuredAndBudgeted();
testHatchFillBoundaryTessellationErrorIsMeasuredAndBudgeted();
testHatchCompositeBudgetCatchesTriangleEncodingOverrun();
testHatchBoundaryChordAndEndpointEncodingUseOneCompositeBudget();
testNestedHatchBoundarySagittaUsesTheCombinedInsertScale();
testPaperViewportScalesHatchBoundarySagittaOnce();
testCircularCurveTessellationErrorIsMeasuredAndBudgeted();
testCurveSagittaAndEndpointEncodingUseOneCompositeBudget();
testCurveEndpointRoundTripSeamIsBoundedAcrossChunks();
testCrossSourceLineSeamIsBoundedAcrossChunks();
testLineToArcSourceSeamIsBoundedAcrossChunks();
testArcToLineSourceSeamIsBoundedAcrossChunks();
testLineToNestedBulgeSourceSeamIsBoundedAcrossChunks();
testNestedBulgeToLineSourceSeamIsBoundedAcrossChunks();
testEllipseCurveTessellationErrorIsMeasuredAndBudgeted();
testNestedEllipseTessellationErrorIncludesInsertTransforms();
testSplineCurveTessellationErrorIsMeasuredAndBudgeted();
testNestedSplineTessellationErrorIncludesInsertTransforms();
testNestedBulgeTessellationErrorIncludesInsertTransforms();
testCurveSourceQuantizationIsMeasuredAndBudgeted();
testValidatorRejectsInvalidOrConflictingErrorMetrics();
console.log("F07 Float32 line/text-glyph/triangle, PATH_DISTANCE, HATCH fill/boundary and curved-line composite, circular/ellipse/direct+nested spline/bulge tessellation, and affine curve-source error accounting PASS");
