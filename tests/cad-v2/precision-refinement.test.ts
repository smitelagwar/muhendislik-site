// F07 acceptance: world precision survives until chunk-local Float32 conversion;
// bounded curve tessellation meets a CSS-pixel error budget across zoom/DPR profiles.
import assert from "node:assert/strict";
import type { CadBlockDefinition, CadCanonicalDocument, CadEntity, CadSplineEntity } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { GeometryCompiler, worldCurveErrorFromScreen } from "../../src/lib/cad-v2/compile/geometry-compiler";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";
import { tessellateDashedArc, tessellateDashedCircle, tessellatePolylineWithWidth } from "../../src/lib/cad-v2/render/cad-stroke";

const ORIGIN = 1_000_000_000;
const TOLERANCE = 2e-5;

function near(actual: number, expected: number, tolerance: number, message: string): void {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: got ${actual}, expected ${expected} ± ${tolerance}`);
}

function testAnalyticCurveSidecarRoundtrip(): void {
  const document: CadCanonicalDocument = {
    sourceVersionKey: "f07-curve-sidecar", sourceSha256: "f07-curve-sidecar", acadVersion: "AC1032", codepage: "UTF-8",
    units: 4, measurement: 1,
    layers: { CURVES: { id: "CURVES", name: "CURVES", visible: true, frozen: false, locked: false,
      color: { method: "rgb", rgb: [20, 80, 220] }, lineweightMm: 0.35, linetypeName: "CONTINUOUS" } },
    linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {}, diagnostics: [],
    modelSpaceEntities: [
      { handle: "C1", type: "CIRCLE", layer: "CURVES", order: BigInt(1), center: [100, -25], radius: 12 },
      { handle: "A_CW", type: "ARC", layer: "CURVES", order: BigInt(2), center: [-40, 60], radius: 8,
        startAngleRad: 5.8, endAngleRad: 0.6, isClockwise: true },
      { handle: "A_CCW", type: "ARC", layer: "CURVES", order: BigInt(3), center: [5, 8], radius: 6,
        startAngleRad: 5.8, endAngleRad: 0.6, isClockwise: false },
    ],
  };
  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_curve_sidecar", maxPrimitivesPerChunk: 1 });
  const chunks = scene.manifest.chunks.filter((entry) => entry.layoutId === "Model");
  assert.ok(chunks.length > 3, "small chunk limit splits source curves across multiple chunks");

  const observedCurveIds = new Set<string>();
  let recordCount = 0;
  let malformedCurveCheckDone = false;
  for (const chunkRef of chunks) {
    const chunkBytes = scene.chunks.get(chunkRef.chunkId)!;
    const chunk = parseSceneChunk(chunkBytes);
    const meta = JSON.parse(new TextDecoder().decode(chunk.sections.get(SceneTag.META)!.data as Uint8Array));
    const records = chunk.sections.get(SceneTag.CURVE_DATA)?.data as Float32Array | undefined;
    assert.ok(records, "analytic curve chunk has optional CURVE_DATA sidecar");
    if (!malformedCurveCheckDone) {
      const section = chunk.sections.get(SceneTag.CURVE_DATA)!;
      const corrupted = new Uint8Array(chunkBytes);
      new DataView(corrupted.buffer, corrupted.byteOffset, corrupted.byteLength).setFloat32(section.header.byteOffset, Number.NaN, true);
      assert.throws(() => parseSceneChunk(corrupted), /CURVE_DATA.*non-finite/, "malformed analytic input is rejected at the binary trust boundary");
      malformedCurveCheckDone = true;
    }
    assert.equal(records.length % 8, 0, "CURVE_DATA uses fixed eight-float records");
    assert.equal(meta.curveSourceVersion, 3, "META declares the current spline-capable sidecar error-budget interpretation version");
    assert.ok(Array.isArray(meta.curveSourceRefs) && meta.curveSourceRefs.length === records.length / 8,
      "each analytic interval is linked to its exact fallback chord");
    const xy = chunk.sections.get(SceneTag.XY)!.data as Float32Array;
    const origin = chunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
    for (const ref of meta.curveSourceRefs) {
      const base = ref.curveRecordIndex * 8;
      assert.ok(Number.isInteger(ref.firstVertex) && ref.firstVertex >= 0 && ref.firstVertex + 2 <= xy.length / 2,
        "source ref points to an in-bounds fallback chord");
      assert.ok(Number.isInteger(ref.vertexCount) && ref.vertexCount >= 2 && ref.vertexCount % 2 === 0,
        "a sidecar interval replaces one or more complete fallback chords");
      assert.equal(ref.vertexCount, ref.segmentCount * 2, "sidecar interval chord count matches its vertex range");
      const cx = records[base]! + origin[0]!;
      const cy = records[base + 1]! + origin[1]!;
      const ux = records[base + 2]!;
      const uy = records[base + 3]!;
      const vx = records[base + 4]!;
      const vy = records[base + 5]!;
      const start = records[base + 6]!;
      const end = records[base + 7]!;
      const first = ref.firstVertex * 2;
      const last = (ref.firstVertex + ref.vertexCount - 1) * 2;
      const endpoints = [start, end].map((angle) => [cx + ux * Math.cos(angle) + vx * Math.sin(angle), cy + uy * Math.cos(angle) + vy * Math.sin(angle)]);
      near(endpoints[0]![0]!, xy[first]! + origin[0]!, 2e-4, "analytic interval start matches fallback chord");
      near(endpoints[0]![1]!, xy[first + 1]! + origin[1]!, 2e-4, "analytic interval start Y matches fallback chord");
      near(endpoints[1]![0]!, xy[last]! + origin[0]!, 2e-4, "analytic interval end matches fallback chord");
      near(endpoints[1]![1]!, xy[last + 1]! + origin[1]!, 2e-4, "analytic interval end Y matches fallback chord");
      assert.ok(ref.curveId.includes(ref.sourceHandle), "stable curve identity includes the source handle");
      observedCurveIds.add(ref.curveId);
      recordCount++;
    }
  }
  assert.ok(recordCount > 10, "circle and both arc directions emit analytic intervals");
  assert.deepEqual([...observedCurveIds].sort(), ["model:A_CCW:ARC", "model:A_CW:ARC", "model:C1:CIRCLE"],
    "source identity remains stable across chunk boundaries and curve direction");
}

function distanceToPolyline(point: [number, number], points: [number, number][]): number {
  let minimum = Infinity;
  for (let index = 0; index + 1 < points.length; index++) {
    const a = points[index]!;
    const b = points[index + 1]!;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const length2 = dx * dx + dy * dy;
    const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / length2));
    minimum = Math.min(minimum, Math.hypot(point[0] - (a[0] + t * dx), point[1] - (a[1] + t * dy)));
  }
  return minimum;
}

function evaluateSplineWithIndependentDeBoor(spline: CadSplineEntity, parameter: number): [number, number] {
  const degree = spline.degree;
  const controlPoints = spline.controlPoints;
  const knots = spline.knots;
  const weights = spline.weights || new Array<number>(controlPoints.length).fill(1);
  const lastControl = controlPoints.length - 1;
  const end = knots[lastControl + 1]!;
  if (parameter >= end) return [...controlPoints[lastControl]!];

  let span = degree;
  while (span < lastControl && !(parameter >= knots[span]! && parameter < knots[span + 1]!)) span++;
  const homogeneous: Array<[number, number, number]> = [];
  for (let index = 0; index <= degree; index++) {
    const controlIndex = span - degree + index;
    const weight = weights[controlIndex]!;
    homogeneous.push([
      controlPoints[controlIndex]![0] * weight,
      controlPoints[controlIndex]![1] * weight,
      weight,
    ]);
  }
  for (let level = 1; level <= degree; level++) {
    for (let index = degree; index >= level; index--) {
      const knotIndex = span - degree + index;
      const denominator = knots[knotIndex + degree - level + 1]! - knots[knotIndex]!;
      const alpha = denominator === 0 ? 0 : (parameter - knots[knotIndex]!) / denominator;
      const left = homogeneous[index - 1]!;
      const right = homogeneous[index]!;
      homogeneous[index] = [
        (1 - alpha) * left[0] + alpha * right[0],
        (1 - alpha) * left[1] + alpha * right[1],
        (1 - alpha) * left[2] + alpha * right[2],
      ];
    }
  }
  const point = homogeneous[degree]!;
  return [point[0] / point[2], point[1] / point[2]];
}

function testSplineInternalKnotMultiplicityAgainstIndependentDeBoorOracle(): void {
  const cubicControls: [number, number][] = [[0, 0], [2, 5], [4, -1], [6, 7], [8, -4], [10, 3], [12, 0]];
  const quadraticControls: [number, number][] = [[0, 0], [2, 5], [4, -1], [6, 7], [8, 0]];
  const quarticControls: [number, number][] = [[0, 0], [1, 5], [2, -4], [3, 7], [4, -6], [5, 6], [6, -3], [7, 4], [8, 0]];
  const quinticControls: [number, number][] = [[0, 0], [1, 4], [2, -3], [3, 6], [4, -5], [5, 7], [6, -6], [7, 5], [8, -2], [9, 3], [10, 0]];
  const profileKnots: Array<{
    label: string;
    degree: number;
    controlPoints: [number, number][];
    interior: number[];
    weights: number[];
  }> = [
    { label: "quadratic simple knot", degree: 2, controlPoints: quadraticControls, interior: [0.25, 0.75], weights: [1, 0.7, 1.2, 0.8, 1] },
    { label: "quadratic degree-multiplicity knot", degree: 2, controlPoints: quadraticControls, interior: [0.6, 0.6], weights: [1, 0.7, 1.2, 0.8, 1] },
    { label: "cubic simple knot", degree: 3, controlPoints: cubicControls, interior: [0.25, 0.5, 0.75], weights: [1, 0.7, 1.2, 0.8, 1.5, 0.9, 1] },
    { label: "cubic double knot", degree: 3, controlPoints: cubicControls, interior: [0.3, 0.3, 0.8], weights: [1, 0.7, 1.2, 0.8, 1.5, 0.9, 1] },
    { label: "cubic degree-multiplicity knot", degree: 3, controlPoints: cubicControls, interior: [0.6, 0.6, 0.6], weights: [1, 0.7, 1.2, 0.8, 1.5, 0.9, 1] },
    { label: "quartic simple knots", degree: 4, controlPoints: quarticControls, interior: [0.15, 0.4, 0.7, 0.9], weights: [1, 0.75, 1.25, 0.8, 1.4, 0.9, 1.15, 0.85, 1] },
    { label: "quartic double knot", degree: 4, controlPoints: quarticControls, interior: [0.25, 0.25, 0.75, 0.9], weights: [1, 0.75, 1.25, 0.8, 1.4, 0.9, 1.15, 0.85, 1] },
    { label: "quartic triple knot", degree: 4, controlPoints: quarticControls, interior: [0.3, 0.3, 0.3, 0.8], weights: [1, 0.75, 1.25, 0.8, 1.4, 0.9, 1.15, 0.85, 1] },
    { label: "quartic degree-multiplicity knot", degree: 4, controlPoints: quarticControls, interior: [0.55, 0.55, 0.55, 0.55], weights: [1, 0.75, 1.25, 0.8, 1.4, 0.9, 1.15, 0.85, 1] },
    { label: "quintic simple knots", degree: 5, controlPoints: quinticControls, interior: [0.1, 0.25, 0.4, 0.65, 0.9], weights: [1, 0.7, 1.2, 0.8, 1.5, 0.9, 1.1, 0.75, 1.3, 0.85, 1] },
    { label: "quintic double knot", degree: 5, controlPoints: quinticControls, interior: [0.2, 0.2, 0.5, 0.75, 0.9], weights: [1, 0.7, 1.2, 0.8, 1.5, 0.9, 1.1, 0.75, 1.3, 0.85, 1] },
    { label: "quintic triple knot", degree: 5, controlPoints: quinticControls, interior: [0.25, 0.25, 0.25, 0.7, 0.9], weights: [1, 0.7, 1.2, 0.8, 1.5, 0.9, 1.1, 0.75, 1.3, 0.85, 1] },
    { label: "quintic quadruple knot", degree: 5, controlPoints: quinticControls, interior: [0.35, 0.35, 0.35, 0.35, 0.85], weights: [1, 0.7, 1.2, 0.8, 1.5, 0.9, 1.1, 0.75, 1.3, 0.85, 1] },
    { label: "quintic degree-multiplicity knot", degree: 5, controlPoints: quinticControls, interior: [0.55, 0.55, 0.55, 0.55, 0.55], weights: [1, 0.7, 1.2, 0.8, 1.5, 0.9, 1.1, 0.75, 1.3, 0.85, 1] },
  ];

  for (const profile of profileKnots) {
    const { degree, controlPoints, weights } = profile;
    const spline: CadSplineEntity = {
      handle: `KNOT_ORACLE_${profile.label.replaceAll(" ", "_").toUpperCase()}`,
      type: "SPLINE",
      layer: "CURVES",
      order: 1n,
      degree,
      controlPoints,
      knots: [...new Array(degree + 1).fill(0), ...profile.interior, ...new Array(degree + 1).fill(1)],
      weights,
      isPeriodic: false,
      isRational: true,
    };
    const targetError = 0.03;
    const tessellation = GeometryCompiler.tessellateSplineWithBudget(spline, targetError);
    assert.ok(tessellation.errorBoundMet && tessellation.splineBezierSpans,
      `${profile.label}: supported non-periodic rational profile returns complete knot-span output`);
    assert.ok(tessellation.maxSagittaWorld <= targetError,
      `${profile.label}: reported control-hull sagitta stays within the requested bound`);

    let sampledMaximumError = 0;
    const sampleCount = 20_000;
    for (let step = 0; step <= sampleCount; step++) {
      const parameter = step / sampleCount;
      const sourcePoint = evaluateSplineWithIndependentDeBoor(spline, parameter);
      sampledMaximumError = Math.max(sampledMaximumError, distanceToPolyline(sourcePoint, tessellation.points));
    }
    assert.ok(sampledMaximumError <= targetError + 1e-6,
      `${profile.label}: independent De Boor samples stay within target; got ${sampledMaximumError}`);
    assert.ok(sampledMaximumError <= tessellation.maxSagittaWorld + 1e-6,
      `${profile.label}: reported bound covers independent source samples; got ${sampledMaximumError} > ${tessellation.maxSagittaWorld}`);

    const internalKnots = [...new Set(profile.interior)];
    for (const knot of internalKnots) {
      const sourceAtKnot = evaluateSplineWithIndependentDeBoor(spline, knot);
      const nearestOutputPoint = Math.min(...tessellation.points.map((point) => Math.hypot(
        sourceAtKnot[0] - point[0], sourceAtKnot[1] - point[1],
      )));
      assert.ok(nearestOutputPoint <= 1e-9,
        `${profile.label}: tessellation retains the independent source point at internal knot ${knot}`);
    }
  }
}

function testRationalSplineAndAdversarialCurves(): void {
  const sCurve: CadSplineEntity = {
    handle: "S_CURVE", type: "SPLINE", layer: "CURVES", order: 1n, degree: 3,
    controlPoints: [[0, 0], [10, 30], [20, -30], [30, 0]],
    knots: [0, 0, 0, 0, 1, 1, 1, 1],
  };
  const sResult = GeometryCompiler.tessellateSplineWithBudget(sCurve, 0.05);
  assert.ok(sResult.errorBoundMet, "S-curve meets its world-space error budget");
  assert.ok(sResult.points.length > 2, "S-curve is not incorrectly collapsed when its midpoint lies on the chord");
  let sampledSMaxError = 0;
  for (let step = 0; step <= 2000; step++) {
    const t = step / 2000;
    const u = 1 - t;
    const point: [number, number] = [
      30 * t,
      3 * u * u * t * 30 + 3 * u * t * t * -30,
    ];
    sampledSMaxError = Math.max(sampledSMaxError, distanceToPolyline(point, sResult.points));
  }
  assert.ok(sampledSMaxError <= 0.05001, `dense S-curve oracle stays within 0.05; got ${sampledSMaxError}`);

  const quarterCircle: CadSplineEntity = {
    handle: "RATIONAL_QUARTER", type: "SPLINE", layer: "CURVES", order: 2n, degree: 2,
    controlPoints: [[1, 0], [1, 1], [0, 1]], weights: [1, Math.SQRT1_2, 1],
    knots: [0, 0, 0, 1, 1, 1],
  };
  const rationalResult = GeometryCompiler.tessellateSplineWithBudget(quarterCircle, 0.0005);
  assert.ok(rationalResult.errorBoundMet, "positive-weight rational quadratic meets a tight error budget");
  for (let step = 0; step <= 2000; step++) {
    const t = step / 2000;
    const u = 1 - t;
    const denominator = u * u + 2 * Math.SQRT1_2 * u * t + t * t;
    const point: [number, number] = [
      (u * u + 2 * Math.SQRT1_2 * u * t) / denominator,
      (2 * Math.SQRT1_2 * u * t + t * t) / denominator,
    ];
    const error = distanceToPolyline(point, rationalResult.points);
    assert.ok(error <= 0.000501, `rational quarter-circle oracle stays within 0.0005; got ${error}`);
  }

  const twoSpans: CadSplineEntity = {
    handle: "TWO_SPANS", type: "SPLINE", layer: "CURVES", order: 3n, degree: 2,
    controlPoints: [[0, 0], [1, 2], [2, 0], [3, -2], [4, 0]],
    knots: [0, 0, 0, 0.5, 0.5, 1, 1, 1],
  };
  const spanResult = GeometryCompiler.tessellateSplineWithBudget(twoSpans, 0.01);
  assert.ok(spanResult.errorBoundMet && spanResult.points.length >= 4, "repeated internal knot emits both valid spans");
  near(spanResult.points[0]![0], 0, 1e-12, "multi-span spline starts at first span start");
  near(spanResult.points.at(-1)![0], 4, 1e-12, "multi-span spline ends at last span end");

  const capped = GeometryCompiler.tessellateSplineWithBudget(sCurve, 1e-8, 2, 32);
  assert.equal(capped.segmentCount, 2, "spline work respects the segment budget");
  assert.ok(!capped.errorBoundMet, "spline explicitly reports a missed bound when capped");
  const periodic = GeometryCompiler.tessellateSplineWithBudget({ ...sCurve, isPeriodic: true }, 0.05);
  assert.ok(!periodic.errorBoundMet && periodic.points.length === 0, "unsupported periodic profile fails closed instead of drawing fabricated geometry");
  const invalidWeights = GeometryCompiler.tessellateSplineWithBudget({ ...quarterCircle, weights: [1, 0, 1] }, 0.01);
  assert.ok(!invalidWeights.errorBoundMet && invalidWeights.points.length === 0, "invalid rational weights fail closed");
  assert.equal(invalidWeights.invalidInput, true, "invalid curve input is distinguishable from a resource cap");

  const invalidScene = compileCanonicalToScene({
    sourceVersionKey: "f07-invalid-spline", sourceSha256: "f07-invalid-spline", acadVersion: "AC1032", codepage: "UTF-8",
    units: 4, measurement: 1,
    layers: { CURVES: { id: "CURVES", name: "CURVES", visible: true, frozen: false, locked: false,
      color: { method: "rgb", rgb: [255, 255, 255] }, lineweightMm: 0, linetypeName: "Continuous" } },
    linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {}, diagnostics: [],
    modelSpaceEntities: [{ ...quarterCircle, weights: [1, 0, 1] }],
  }, { sceneId: "scene_f07_invalid_spline" });
  assert.equal(invalidScene.manifest.qualityStatus, "degraded", "invalid spline must degrade scene quality");
  assert.ok(invalidScene.manifest.diagnosticsSummary.diagnosticCodes.includes("CURVE_GEOMETRY_INVALID"), "manifest states that the curve geometry is invalid rather than claiming a budget cap");

  const invalidHatch = GeometryCompiler.triangulateHatch({
    handle: "INVALID_HATCH", type: "HATCH", layer: "CURVES", order: 4n, patternName: "SOLID", isSolid: true,
    loops: [{ isPolyline: false, edges: [
      { type: "LINE", start: [0, 0], end: [2, 0] },
      { type: "SPLINE", degree: 2, controlPoints: [[2, 0], [3, 1], [4, 0]], knots: [0, 0, 0, 1, 1, 1], weights: [1, 0, 1] },
      { type: "LINE", start: [4, 0], end: [0, 0] },
    ] }],
  });
  assert.ok(invalidHatch.invalidCurveGeometry && invalidHatch.mesh === null && invalidHatch.boundaryLines.length === 0,
    "invalid spline inside HATCH suppresses the entire fabricated fill and boundary ring");
}

testAnalyticCurveSidecarRoundtrip();

function line(handle: string, layer: string, start: [number, number], end: [number, number], order: bigint): CadEntity {
  return { handle, type: "LINE", layer, start, end, order };
}

function testWorldTrianglesStayFloat64UntilOriginSubtraction(): void {
  const wideStroke = tessellatePolylineWithWidth([
    { point: [ORIGIN, ORIGIN], startWidth: 0.01, endWidth: 0.01 },
    { point: [ORIGIN + 10, ORIGIN], startWidth: 0.01, endWidth: 0.01 },
  ]);
  assert.ok(wideStroke instanceof Float64Array, "world-space polyline-width triangles stay Float64 before chunk normalization");
  const strokeXs = Array.from(wideStroke!).filter((_, index) => index % 2 === 0);
  const strokeYs = Array.from(wideStroke!).filter((_, index) => index % 2 === 1);
  near(Math.max(...strokeYs) - Math.min(...strokeYs), 0.01, 2e-7, "0.01-wide polyline does not collapse at 1e9 origin");
  assert.ok(strokeXs.every(Number.isFinite) && strokeYs.every(Number.isFinite), "width mesh remains finite");

  const hatch = GeometryCompiler.triangulateHatch({
    handle: "H1", type: "HATCH", layer: "HATCH", order: 3n, patternName: "SOLID", isSolid: true,
    loops: [{ isPolyline: true, isClosed: true, vertices: [
      [ORIGIN, ORIGIN], [ORIGIN + 0.01, ORIGIN], [ORIGIN + 0.01, ORIGIN + 0.01], [ORIGIN, ORIGIN + 0.01],
    ] }],
  } as any);
  assert.ok(hatch.mesh?.vertices instanceof Float64Array, "world-space HATCH triangles remain Float64 before chunk normalization");
  const hatchXs = Array.from(hatch.mesh!.vertices).filter((_, index) => index % 2 === 0);
  near(Math.max(...hatchXs) - Math.min(...hatchXs), 0.01, 2e-7, "HATCH detail is preserved at 1e9 origin");
}

function testChunkLocalFloat32RetainsOneHundredthDetailAtBillionOrigin(): void {
  const layers = Object.fromEntries(["DETAIL", "STROKE"].map((name) => [name, {
    id: name, name, visible: true, frozen: false, locked: false,
    color: { method: "rgb" as const, rgb: [255, 255, 255] as [number, number, number] },
    lineweightMm: 0, linetypeName: "Continuous",
  }]));
  const entities: CadEntity[] = [
    line("D1", "DETAIL", [ORIGIN, ORIGIN], [ORIGIN + 0.01, ORIGIN], 1n),
    {
      handle: "P1", type: "LWPOLYLINE", layer: "STROKE", order: 2n, isClosed: false, constantWidth: 0.01,
      vertices: [{ x: ORIGIN + 20, y: ORIGIN }, { x: ORIGIN + 30, y: ORIGIN }],
    },
  ];
  const document: CadCanonicalDocument = {
    sourceVersionKey: "f07-high-origin", sourceSha256: "f07-high-origin", acadVersion: "AC1032", codepage: "UTF-8",
    units: 4, measurement: 1, layers, linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {},
    modelSpaceEntities: entities, paperSpaceEntities: {}, diagnostics: [],
  };
  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_precision" });
  const chunkRef = scene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  assert.ok(chunkRef, "precision fixture compiles a model chunk");
  const parsed = parseSceneChunk(scene.chunks.get(chunkRef.chunkId)!);
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const meta = JSON.parse(new TextDecoder().decode(parsed.sections.get(SceneTag.META)!.data as Uint8Array));
  const detail = meta.drawCommands.find((command: any) => command.layer === "DETAIL");
  assert.ok(detail, "small LINE remains in the scene");
  const start = detail.firstVertex * 2;
  const actualLength = Math.hypot(xy[start + 2]! - xy[start]!, xy[start + 3]! - xy[start + 1]!);
  near(actualLength, 0.01, TOLERANCE, "small LINE length survives world-origin subtraction and Float32 quantization");
  near(xy[start]! + origin[0]!, ORIGIN, 2e-5, "Float64 chunk origin reconstructs exact large world anchor");

  const triangles = parsed.sections.get(SceneTag.TRIANGLES)?.data as Float32Array | undefined;
  assert.ok(triangles && triangles.length >= 12, "thick polyline mesh reaches the binary scene");
  const localYs = Array.from(triangles!).filter((_, index) => index % 2 === 1);
  near(Math.max(...localYs) - Math.min(...localYs), 0.01, 2e-5, "small stroke width survives world normalization");
}

function testIndependentChunkOriginsForDistantFineDetails(): void {
  const layers = Object.fromEntries(["A", "B"].map((name) => [name, {
    id: name, name, visible: true, frozen: false, locked: false,
    color: { method: "rgb" as const, rgb: [255, 255, 255] as [number, number, number] },
    lineweightMm: 0, linetypeName: "Continuous",
  }]));
  const document: CadCanonicalDocument = {
    sourceVersionKey: "f07-per-chunk-origin", sourceSha256: "f07-per-chunk-origin", acadVersion: "AC1032", codepage: "UTF-8",
    units: 4, measurement: 1, layers, linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {},
    modelSpaceEntities: [
      line("L1", "A", [1e9, 1e9], [1e9 + 0.01, 1e9], 1n),
      line("L2", "B", [-1e9, -1e9], [-1e9 + 0.01, -1e9], 2n),
    ],
    paperSpaceEntities: {}, diagnostics: [],
  };
  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_chunk_origins", maxPrimitivesPerChunk: 1 });
  assert.equal(scene.manifest.chunks.length, 2, "test chunk boundary separates the spatially distant primitives");
  const origins: number[] = [];
  for (const [index, ref] of scene.manifest.chunks.entries()) {
    const parsed = parseSceneChunk(scene.chunks.get(ref.chunkId)!);
    const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
    const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
    origins.push(origin[0]!);
    near(Math.hypot(xy[2]! - xy[0]!, xy[3]! - xy[1]!), 0.01, TOLERANCE, `chunk ${index} retains 0.01 detail around its local origin`);
    assert.ok(Math.abs(xy[0]!) < 0.01, `chunk ${index} stores small coordinates relative to its own origin`);
  }
  assert.ok(origins[0]! > 9e8 && origins[1]! < -9e8, "each chunk carries its own Float64 world anchor");
}

function testArcBudgetSolverAcrossZoomAndDprProfiles(): void {
  const radius = 10_000;
  const zoomLevels = [1, 8, 64, 512];
  const dprs = [1, 2, 3];
  for (const zoom of zoomLevels) {
    for (const dpr of dprs) {
      const worldTolerance = 0.25 / (zoom * dpr);
      const points = GeometryCompiler.tessellateArc([0, 0], radius, 0, Math.PI * 1.5, false, worldTolerance);
      let maxCssError = 0;
      for (let i = 0; i + 1 < points.length; i++) {
        const delta = Math.atan2(points[i + 1]![1], points[i + 1]![0]) - Math.atan2(points[i]![1], points[i]![0]);
        const absoluteDelta = Math.abs(Math.atan2(Math.sin(delta), Math.cos(delta)));
        const sagitta = radius * (1 - Math.cos(absoluteDelta / 2));
        maxCssError = Math.max(maxCssError, sagitta * zoom * dpr);
      }
      assert.ok(maxCssError <= 0.250001, `budgeted arc solver respects supplied tolerance at zoom=${zoom}, DPR=${dpr}; measured ${maxCssError} device-scaled px`);
    }
  }

  const limited = GeometryCompiler.tessellateArcWithBudget([0, 0], radius, 0, Math.PI * 1.5, false, 1e-8, 64);
  assert.equal(limited.segmentCount, 64, "resource guard caps pathological tessellation work");
  assert.ok(!limited.errorBoundMet, "a resource-capped arc explicitly reports that the requested error bound was not met");
  assert.ok(limited.maxSagittaWorld > 1e-8, "reported measured sagitta exposes the bounded approximation");

  const tiny = GeometryCompiler.tessellateArcWithBudget([0, 0], 1e-6, 0, Math.PI, false, 1e-8);
  const large = GeometryCompiler.tessellateArcWithBudget([0, 0], 1e7, 0, Math.PI, false, 0.25);
  assert.ok(tiny.errorBoundMet && tiny.maxSagittaWorld <= 1e-8, "tiny-radius arc remains stable under a fine absolute tolerance");
  assert.ok(large.errorBoundMet && large.maxSagittaWorld <= 0.25, "large-radius arc remains within an absolute model-space tolerance");
}

function testProductionSceneReportsCurveBudgetLimit(): void {
  const document: CadCanonicalDocument = {
    sourceVersionKey: "f07-curve-limit", sourceSha256: "f07-curve-limit", acadVersion: "AC1032", codepage: "UTF-8",
    units: 4, measurement: 1,
    layers: { CURVES: {
      id: "CURVES", name: "CURVES", visible: true, frozen: false, locked: false,
      color: { method: "rgb", rgb: [255, 255, 255] }, lineweightMm: 0, linetypeName: "Continuous",
    } },
    linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {}, diagnostics: [],
    modelSpaceEntities: [{ handle: "C1", type: "CIRCLE", layer: "CURVES", order: 1n, center: [0, 0], radius: 10_000 }],
  };
  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_curve_limit", maxCurveSegments: 8 });
  assert.equal(scene.manifest.qualityStatus, "degraded", "production scene must not report exact after curve cap fallback");
  assert.ok(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("CURVE_REFINEMENT_LIMIT_REACHED"), "manifest identifies the specific bounded-refinement loss");
}

function testSceneCompilerUsesSuppliedScreenErrorBudget(): void {
  const worldBudget = worldCurveErrorFromScreen(0.25, 0.01, 2);
  near(worldBudget, 0.00125, 1e-15, "CSS-pixel target converts through view scale and transform sigma max");
  assert.throws(() => worldCurveErrorFromScreen(0.25, 0.01, 0), /finite and positive/, "singular view transform cannot silently produce a curve budget");

  const document: CadCanonicalDocument = {
    sourceVersionKey: "f07-screen-budget", sourceSha256: "f07-screen-budget", acadVersion: "AC1032", codepage: "UTF-8",
    units: 4, measurement: 1,
    layers: { CURVES: { id: "CURVES", name: "CURVES", visible: true, frozen: false, locked: false,
      color: { method: "rgb", rgb: [255, 255, 255] }, lineweightMm: 0, linetypeName: "Continuous" } },
    linetypes: {}, textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {}, diagnostics: [],
    modelSpaceEntities: [{ handle: "C1", type: "CIRCLE", layer: "CURVES", order: 1n, center: [0, 0], radius: 100 }],
  };
  const scene = compileCanonicalToScene(document, {
    sceneId: "scene_f07_screen_budget",
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.01,
    maxTransformSingularValue: 2,
  });
  const chunk = scene.manifest.chunks[0]!;
  const parsed = parseSceneChunk(scene.chunks.get(chunk.chunkId)!);
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const pixelsPerWorldUnit = 2 / 0.01;
  let maxCssError = 0;
  for (let index = 0; index + 3 < xy.length; index += 4) {
    const x0 = xy[index]! + origin[0]!;
    const y0 = xy[index + 1]! + origin[1]!;
    const x1 = xy[index + 2]! + origin[0]!;
    const y1 = xy[index + 3]! + origin[1]!;
    const chord = Math.hypot(x1 - x0, y1 - y0);
    const sagitta = 100 - Math.sqrt(Math.max(0, 100 * 100 - chord * chord / 4));
    maxCssError = Math.max(maxCssError, sagitta * pixelsPerWorldUnit);
  }
  assert.ok(maxCssError <= 0.251, `compiled circle meets active-view error budget; got ${maxCssError} CSS px`);
  assert.ok(xy.length / 4 > 60, "compiler refines beyond its default fixed 0.25-world-unit tessellation for this view profile");
  assert.throws(() => compileCanonicalToScene(document, { unitsPerCssPixel: 0.01 }), /requires targetCurveErrorCssPixels/, "incomplete screen budget is rejected rather than guessed");
}

function testInsertedCurvesHonorScreenBudgetAndPropagateDegradation(): void {
  const layers = { CURVES: {
    id: "CURVES", name: "CURVES", visible: true, frozen: false, locked: false,
    color: { method: "rgb" as const, rgb: [255, 255, 255] as [number, number, number] },
    lineweightMm: 0, linetypeName: "Continuous",
  } };
  const block: CadBlockDefinition = {
    name: "ELLIPSE_BLOCK", basePoint: [0, 0],
    entities: [{ handle: "BLOCK_CIRCLE", type: "CIRCLE", layer: "CURVES", order: 1n, center: [0, 0], radius: 10 }],
  };
  const document: CadCanonicalDocument = {
    sourceVersionKey: "f07-insert-screen-budget", sourceSha256: "f07-insert-screen-budget", acadVersion: "AC1032", codepage: "UTF-8",
    units: 4, measurement: 1, layers, linetypes: {}, textStyles: {}, blocks: { ELLIPSE_BLOCK: block },
    layouts: {}, viewports: {}, paperSpaceEntities: {}, diagnostics: [],
    modelSpaceEntities: [{
      handle: "INSERT_ELLIPSE", type: "INSERT", layer: "CURVES", order: 2n, blockName: "ELLIPSE_BLOCK",
      insertionPoint: [0, 0], scale: [10, 2, 1], rotationRad: 0,
    }],
  };
  const viewBudget = {
    targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.01,
    maxTransformSingularValue: 1,
  };
  const scene = compileCanonicalToScene(document, { sceneId: "scene_f07_insert_screen_budget", ...viewBudget });
  const ref = scene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  assert.ok(ref, "insert fixture emits a model scene chunk");
  const parsed = parseSceneChunk(scene.chunks.get(ref.chunkId)!);
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  assert.ok(xy.length / 4 > 32, "anisotropically scaled block circle is refined beyond the former fixed 32 segments");
  const polyline: [number, number][] = [[xy[0]! + origin[0]!, xy[1]! + origin[1]!]];
  for (let index = 0; index + 3 < xy.length; index += 4) {
    polyline.push([xy[index + 2]! + origin[0]!, xy[index + 3]! + origin[1]!]);
  }
  let maxCssError = 0;
  for (let step = 0; step <= 20_000; step++) {
    const angle = (Math.PI * 2 * step) / 20_000;
    const point: [number, number] = [100 * Math.cos(angle), 20 * Math.sin(angle)];
    maxCssError = Math.max(maxCssError, distanceToPolyline(point, polyline) / 0.01);
  }
  assert.ok(maxCssError <= 0.251, `binary INSERT geometry stays within 0.25 CSS px; measured ${maxCssError}`);

  const capped = compileCanonicalToScene(document, {
    sceneId: "scene_f07_insert_screen_budget_capped", ...viewBudget, maxCurveSegments: 4,
  });
  assert.equal(capped.manifest.qualityStatus, "degraded", "a capped curve nested in INSERT degrades production scene quality");
  assert.ok(capped.manifest.diagnosticsSummary.diagnosticCodes.includes("CURVE_REFINEMENT_LIMIT_REACHED"),
    "scene diagnostics propagate a nested INSERT's missed curve error bound");
}

function testPaperViewportScaleIsIncludedInCurveBudget(): void {
  const layers = { CURVES: {
    id: "CURVES", name: "CURVES", visible: true, frozen: false, locked: false,
    color: { method: "rgb" as const, rgb: [255, 255, 255] as [number, number, number] },
    lineweightMm: 0, linetypeName: "Continuous",
  } };
  const document: CadCanonicalDocument = {
    sourceVersionKey: "f07-viewport-screen-budget", sourceSha256: "f07-viewport-screen-budget", acadVersion: "AC1032", codepage: "UTF-8",
    units: 4, measurement: 1, layers, linetypes: {}, textStyles: {}, blocks: {},
    layouts: { Sheet: { id: "Sheet", name: "Sheet", isModelSpace: false, bbox: [-60, -60, 60, 60] } },
    viewports: { VP1: {
      id: "VP1", layoutId: "Sheet", center: [0, 0], width: 120, height: 120,
      viewCenter: [0, 0], viewHeight: 60, frozenLayers: [],
    } },
    paperSpaceEntities: {}, diagnostics: [],
    modelSpaceEntities: [{ handle: "MODEL_CIRCLE", type: "CIRCLE", layer: "CURVES", order: 1n, center: [0, 0], radius: 10 }],
  };
  const scene = compileCanonicalToScene(document, {
    sceneId: "scene_f07_viewport_screen_budget", layoutId: "Sheet", targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  });
  const ref = scene.manifest.chunks.find((chunk) => chunk.layoutId === "Sheet");
  assert.ok(ref, "paper viewport emits its model projection");
  const parsed = parseSceneChunk(scene.chunks.get(ref.chunkId)!);
  const xy = parsed.sections.get(SceneTag.XY)!.data as Float32Array;
  const origin = parsed.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  const polyline: [number, number][] = [];
  for (let index = 0; index + 3 < xy.length; index += 4) {
    if (index === 0) polyline.push([xy[index]! + origin[0]!, xy[index + 1]! + origin[1]!]);
    polyline.push([xy[index + 2]! + origin[0]!, xy[index + 3]! + origin[1]!]);
  }
  assert.ok(polyline.length > 33, `viewport projection tessellates its circle beyond 32 segments; points=${polyline.length}, xy=${xy.length}, quality=${scene.manifest.qualityStatus}`);
  let maxCssError = 0;
  for (let step = 0; step <= 20_000; step++) {
    const angle = (Math.PI * 2 * step) / 20_000;
    maxCssError = Math.max(maxCssError, distanceToPolyline([20 * Math.cos(angle), 20 * Math.sin(angle)], polyline) / 0.01);
  }
  assert.ok(maxCssError <= 0.251, `viewport-transformed binary circle stays within 0.25 CSS px; measured ${maxCssError}`);
}

function testDashedCurvesHonorErrorAndWorkBudgets(): void {
  const bounded = tessellateDashedCircle([0, 0], 100, [20, -10], 1, 0, { maxErrorWorld: 0.01, maxSegments: 65_536 });
  assert.equal(bounded.errorBoundMet, true, "dashed circle reports when every emitted chord met its geometric error bound");
  assert.ok((bounded.maxSagittaWorld ?? Infinity) <= 0.0100000001, "dashed circle's maximum chord sagitta meets its requested world error");
  assert.ok(bounded.segments.length > 20, "dash arc-length phase remains intact while each visible dash is adaptively refined");
  near(bounded.totalDistance, 2 * Math.PI * 100, 1e-9, "dashed circle retains the analytic circumference for phase accounting");

  const capped = tessellateDashedArc([0, 0], 100, 0, Math.PI * 2, false, [20, -10], 1, 0,
    { maxErrorWorld: 1e-8, maxSegments: 4 });
  assert.ok(capped.segments.length <= 4, "dashed arc respects the entity-level chord cap");
  assert.equal(capped.refinementLimitReached, true, "dashed arc reports an unmet bound when capped");
  assert.equal(capped.errorBoundMet, false, "resource cap cannot be represented as exact curve geometry");

  const sceneDoc: CadCanonicalDocument = {
    sourceVersionKey: "f07-dashed-cap", sourceSha256: "f07-dashed-cap", acadVersion: "AC1032", codepage: "UTF-8",
    units: 4, measurement: 1,
    layers: { CURVES: { id: "CURVES", name: "CURVES", visible: true, frozen: false, locked: false,
      color: { method: "rgb", rgb: [255, 255, 255] }, lineweightMm: 0, linetypeName: "DASHED" } },
    linetypes: { DASHED: { id: "DASHED", name: "DASHED", pattern: [20, -10], totalLength: 30 } },
    textStyles: {}, blocks: {}, layouts: {}, viewports: {}, paperSpaceEntities: {}, diagnostics: [],
    modelSpaceEntities: [{ handle: "DASHED_CIRCLE", type: "CIRCLE", layer: "CURVES", order: 1n,
      center: [0, 0], radius: 100, linetype: "DASHED" }],
  };
  const screenScene = compileCanonicalToScene(sceneDoc, {
    sceneId: "scene_f07_dashed_screen_budget", targetCurveErrorCssPixels: 0.25,
    unitsPerCssPixel: 0.01, maxTransformSingularValue: 1,
  });
  const screenRef = screenScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  assert.ok(screenRef, "budgeted dashed circle emits a binary model chunk");
  const screenChunk = parseSceneChunk(screenScene.chunks.get(screenRef.chunkId)!);
  const screenXY = screenChunk.sections.get(SceneTag.XY)!.data as Float32Array;
  const screenOrigin = screenChunk.sections.get(SceneTag.ORIGIN)!.data as Float64Array;
  let maxBinaryCssError = 0;
  for (let index = 0; index + 3 < screenXY.length; index += 4) {
    const x0 = screenXY[index]! + screenOrigin[0]!;
    const y0 = screenXY[index + 1]! + screenOrigin[1]!;
    const x1 = screenXY[index + 2]! + screenOrigin[0]!;
    const y1 = screenXY[index + 3]! + screenOrigin[1]!;
    const a0 = Math.atan2(y0, x0);
    const a1 = Math.atan2(y1, x1);
    const delta = Math.abs(Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0)));
    maxBinaryCssError = Math.max(maxBinaryCssError, 100 * (1 - Math.cos(delta / 2)) / 0.01);
  }
  assert.ok(maxBinaryCssError <= 0.251, `binary dashed circle meets its screen-space error target; measured ${maxBinaryCssError} CSS px`);
  const scene = compileCanonicalToScene(sceneDoc, { sceneId: "scene_f07_dashed_cap", maxCurveSegments: 4 });
  assert.equal(scene.manifest.qualityStatus, "degraded", "dashed curve cap degrades the compiled scene");
  assert.ok(scene.manifest.diagnosticsSummary.diagnosticCodes.includes("CURVE_REFINEMENT_LIMIT_REACHED"),
    "production scene reports the dashed curve's missed refinement bound");
}

function testEllipseAndMirroredBulgeErrorBudgets(): void {
  const ellipse = GeometryCompiler.tessellateEllipseWithBudget([1e9, -1e9], [20, 0], 0.4, 0, Math.PI * 2, 0.002);
  assert.ok(ellipse.errorBoundMet, "nonuniformly scaled circle/ellipse meets conservative interpolation bound");
  assert.ok(ellipse.maxSagittaWorld <= 0.002, "ellipse's control-derivative error bound is measured within tolerance");
  near(ellipse.points[0]![0], 1e9 + 20, 1e-6, "ellipse start is correct at large coordinates");

  const positive = GeometryCompiler.tessellateBulgeSegmentWithBudget([0, 0], [10, 0], 0.5, 0.001);
  const negative = GeometryCompiler.tessellateBulgeSegmentWithBudget([0, 0], [10, 0], -0.5, 0.001);
  assert.ok(positive.errorBoundMet && negative.errorBoundMet, "both bulge orientations meet the arc sagitta budget");
  assert.ok(positive.points.some((point) => point[1] < -0.1), "positive bulge follows its signed CAD sweep");
  assert.ok(negative.points.some((point) => point[1] > 0.1), "mirrored negative bulge mirrors the same arc");
  near(positive.points[0]![0], 0, 1e-9, "positive bulge begins at its source vertex");
  near(positive.points.at(-1)![0], 10, 1e-9, "positive bulge ends at its source vertex");

  const capped = GeometryCompiler.tessellateEllipseWithBudget([0, 0], [1e6, 0], 0.1, 0, Math.PI * 2, 1e-9, 32);
  assert.ok(!capped.errorBoundMet && capped.segmentCount === 32, "ellipse resource cap reports unmet error bound");
}

console.log("=== F07 precision/refinement acceptance ===");
testWorldTrianglesStayFloat64UntilOriginSubtraction();
console.log("PASS: World-space polyline-width and HATCH triangles remain Float64 until normalization");
testChunkLocalFloat32RetainsOneHundredthDetailAtBillionOrigin();
console.log("PASS: 1e9 origin + 0.01 LINE/width detail survives binary scene conversion");
testIndependentChunkOriginsForDistantFineDetails();
console.log("PASS: Distant chunks use independent Float64 origins without losing 0.01 detail");
testArcBudgetSolverAcrossZoomAndDprProfiles();
console.log("PASS: Arc budget solver respects caller-supplied world tolerance across 4 zoom × 3 DPR profiles (production camera wiring remains open)");
testProductionSceneReportsCurveBudgetLimit();
console.log("PASS: Production scene marks capped curve tessellation degraded with a diagnostic");
testSceneCompilerUsesSuppliedScreenErrorBudget();
console.log("PASS: Scene compiler applies explicit CSS-pixel/view-transform error budget to emitted circle geometry");
testInsertedCurvesHonorScreenBudgetAndPropagateDegradation();
console.log("PASS: INSERT-transformed curve geometry honors the screen budget and reports capped quality");
testPaperViewportScaleIsIncludedInCurveBudget();
console.log("PASS: Paper viewport scale is included in the compiled curve screen-error budget");
testDashedCurvesHonorErrorAndWorkBudgets();
console.log("PASS: Dashed arc/circle tessellation honors curve error and work caps and propagates degraded quality");
testEllipseAndMirroredBulgeErrorBudgets();
console.log("PASS: Ellipse and both mirrored bulge sweeps report bounded geometric error");
testSplineInternalKnotMultiplicityAgainstIndependentDeBoorOracle();
console.log("PASS: Rational non-periodic degree-2/3/4/5 SPLINE knot multiplicities match independent De Boor samples and reported error bounds");
testRationalSplineAndAdversarialCurves();
console.log("PASS: S-curve, rational NURBS, multi-span knots and bounded/invalid spline profiles");
console.log("=== F07 precision/refinement targeted acceptance PASS ===");
