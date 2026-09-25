import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import type { CadCanonicalDocument, CadSplineEntity } from "../../src/lib/cad-v2/canonical/types";
import { GeometryCompiler } from "../../src/lib/cad-v2/compile/geometry-compiler";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { parseDxfToCanonical } from "../../src/lib/cad-v2/decode/dxf-adapter";
import { parseDxfSplines } from "../../src/lib/cad-v2/decode/dxf-xclip-pairs";
import { parseSceneChunk, SceneTag } from "../../src/lib/cad-v2/protocol/binary-protocol";

function makeSplineEntity(handle: string, flags: number, points: [number, number][], knots: number[], weights?: number[], degree = 3): string {
  const pairs = [
    "0", "SPLINE", "5", handle, "100", "AcDbEntity", "8", "GEOMETRY", "100", "AcDbSpline",
    "70", String(flags), "71", String(degree), "72", String(knots.length), "73", String(points.length), "74", "0",
    ...knots.flatMap((knot) => ["40", String(knot)]),
    ...(weights || []).flatMap((weight) => ["41", String(weight)]),
    ...points.flatMap(([x, y]) => ["10", String(x), "20", String(y), "30", "0"]),
  ];
  return pairs.join("\n");
}

function byHandle(entities: CadCanonicalDocument["modelSpaceEntities"], handle: string): CadSplineEntity {
  const entity = entities.find((candidate) => candidate.handle.toUpperCase() === handle);
  assert.ok(entity?.type === "SPLINE", "DXF entity " + handle + " decodes as a SPLINE");
  return entity;
}

function makePeriodicProfile(interiorKnots: number[], uniqueWeights?: number[], degree = 3): {
  controlPoints: [number, number][];
  knots: number[];
  weights?: number[];
} {
  const start = 3;
  const period = 4;
  const domainKnots = [start, ...interiorKnots, start + period];
  const uniqueControlCount = domainKnots.length - 1;
  const uniqueControls = Array.from({ length: uniqueControlCount }, (_, index): [number, number] => {
    const angle = (index / uniqueControlCount) * Math.PI * 2;
    return [20 * Math.cos(angle), 12 * Math.sin(angle)];
  });
  const controlPoints = [...uniqueControls, ...uniqueControls.slice(0, degree)];
  const knots = [
    ...Array.from({ length: degree }, (_, index) => domainKnots[index + uniqueControlCount - degree]! - period),
    ...domainKnots,
    ...Array.from({ length: degree }, (_, index) => domainKnots[index + 1]! + period),
  ];
  assert.equal(knots.length, controlPoints.length + degree + 1, "periodic profile uses the complete DXF B-spline knot vector");
  const weights = uniqueWeights ? [...uniqueWeights, ...uniqueWeights.slice(0, degree)] : undefined;
  if (uniqueWeights) assert.equal(uniqueWeights.length, uniqueControlCount, "rational weights cover every unique periodic control point");
  return { controlPoints, knots, ...(weights ? { weights } : {}) };
}

function evaluateDeBoor(spline: CadSplineEntity, parameter: number): [number, number] {
  const degree = spline.degree;
  const lastControl = spline.controlPoints.length - 1;
  const end = spline.knots[lastControl + 1]!;
  let span = degree;
  if (parameter >= end) {
    span = lastControl;
  } else {
    while (span < lastControl && !(parameter >= spline.knots[span]! && parameter < spline.knots[span + 1]!)) span++;
  }
  const homogeneous: Array<[number, number, number]> = [];
  for (let index = 0; index <= degree; index++) {
    const controlIndex = span - degree + index;
    const weight = spline.weights?.[controlIndex] ?? 1;
    homogeneous.push([
      spline.controlPoints[controlIndex]![0] * weight,
      spline.controlPoints[controlIndex]![1] * weight,
      weight,
    ]);
  }
  for (let level = 1; level <= degree; level++) {
    for (let index = degree; index >= level; index--) {
      const knotIndex = span - degree + index;
      const denominator = spline.knots[knotIndex + degree - level + 1]! - spline.knots[knotIndex]!;
      const alpha = denominator === 0 ? 0 : (parameter - spline.knots[knotIndex]!) / denominator;
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

function distanceToPolyline(point: [number, number], points: [number, number][]): number {
  let minimum = Infinity;
  for (let index = 0; index + 1 < points.length; index++) {
    const start = points[index]!;
    const end = points[index + 1]!;
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const lengthSquared = dx * dx + dy * dy;
    const projection = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
      ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared));
    minimum = Math.min(minimum, Math.hypot(
      point[0] - (start[0] + projection * dx),
      point[1] - (start[1] + projection * dy),
    ));
  }
  return minimum;
}

async function main(): Promise<void> {
  const fixturePath = path.resolve(process.cwd(), "tests/fixtures/cad-preview-v2/known-geometry-measurements.dxf");
  const base = fs.readFileSync(fixturePath, "utf8");
  const simpleProfile = makePeriodicProfile([4, 5, 6]);
  const rationalProfile = makePeriodicProfile([4, 5, 6], [1, 0.7, 1.2, 0.9]);
  const degreeNineProfile = makePeriodicProfile([3.4, 3.8, 4.2, 4.6, 5, 5.4, 5.8, 6.2, 6.6], undefined, 9);
  const doubleKnotProfile = makePeriodicProfile([4, 4, 5, 6]);
  const tripleKnotProfile = makePeriodicProfile([4, 4, 4, 5, 6]);
  const clampedControls: [number, number][] = [[0, 0], [2, 5], [4, -1], [6, 7]];
  const clampedKnots = [0, 0, 0, 0, 1, 1, 1, 1];
  const appendedEntities = [
    makeSplineEntity("F071", 2, simpleProfile.controlPoints, simpleProfile.knots),
    makeSplineEntity("F072", 3, simpleProfile.controlPoints, simpleProfile.knots),
    makeSplineEntity("F073", 0, clampedControls, clampedKnots),
    makeSplineEntity("F074", 2, doubleKnotProfile.controlPoints, doubleKnotProfile.knots),
    makeSplineEntity("F075", 2, tripleKnotProfile.controlPoints, tripleKnotProfile.knots),
    makeSplineEntity("F077", 6, rationalProfile.controlPoints, rationalProfile.knots, rationalProfile.weights),
    makeSplineEntity("F078", 2, degreeNineProfile.controlPoints, degreeNineProfile.knots, undefined, 9),
  ].join("\n");
  const augmented = base.replace(
    /0\r?\nENDSEC\r?\n0\r?\nEOF\s*$/,
    appendedEntities + "\n0\nENDSEC\n0\nEOF\n",
  );
  assert.notEqual(augmented, base, "periodic SPLINE entities are appended to the known valid DXF fixture");

  const { AcDbDxfFiler, acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
  const pairReader = acdbCreateDxfPairReader(new Uint8Array(Buffer.from(augmented)));
  const binaryFiler = new AcDbDxfFiler({ outputFormat: "binary" });
  for (let pair = pairReader.next(); pair; pair = pairReader.next()) binaryFiler.writeGroup(pair.code, pair.value);
  const binaryAugmented = Buffer.from(binaryFiler.toBinary());
  assert.equal(binaryAugmented.subarray(0, 22).toString("binary"), "AutoCAD Binary DXF\r\n\x1a\0",
    "binary DXF oracle uses the official AutoCAD sentinel");

  const document = await parseDxfToCanonical(Buffer.from(augmented));
  const binaryDocument = await parseDxfToCanonical(binaryAugmented);
  const asciiSource = await parseDxfSplines(Buffer.from(augmented));
  const binarySource = await parseDxfSplines(binaryAugmented);
  const periodicOnly = byHandle(document.modelSpaceEntities, "F071");
  const closedPeriodic = byHandle(document.modelSpaceEntities, "F072");
  const clamped = byHandle(document.modelSpaceEntities, "F073");
  const doubleKnot = byHandle(document.modelSpaceEntities, "F074");
  const tripleKnot = byHandle(document.modelSpaceEntities, "F075");
  const rationalPeriodic = byHandle(document.modelSpaceEntities, "F077");
  const degreeNinePeriodic = byHandle(document.modelSpaceEntities, "F078");

  assert.equal(periodicOnly.isPeriodic, true, "DXF SPLINE group 70 bit 2 survives the native DXF reader");
  assert.equal(closedPeriodic.isPeriodic, true, "closed+periodic group 70 flags retain the periodic bit independently");
  assert.equal(clamped.isPeriodic, false, "a clamped non-periodic SPLINE remains non-periodic");
  assert.equal(rationalPeriodic.isPeriodic, true, "periodic+rational flag bits remain independently represented");
  assert.equal(rationalPeriodic.isRational, true, "the rational flag survives alongside periodicity");
  assert.deepEqual(rationalPeriodic.weights, rationalProfile.weights, "periodic rational control weights remain source-aligned");
  assert.deepEqual(periodicOnly.knots, simpleProfile.knots, "periodic knot vector remains source-aligned");
  assert.deepEqual(periodicOnly.controlPoints, simpleProfile.controlPoints, "periodic cyclic control net remains source-aligned");
  assert.equal(asciiSource.get("F071")?.declaredKnotCount, simpleProfile.knots.length,
    "DXF group 72 retains the declared source knot count");
  assert.equal(asciiSource.get("F071")?.declaredControlPointCount, simpleProfile.controlPoints.length,
    "DXF group 73 retains the declared source control-point count");
  assert.deepEqual(binarySource.get("F071"), asciiSource.get("F071"),
    "binary pair reader preserves flags, counts, knots, weights, and 3D control points exactly");
  assert.deepEqual(binarySource.get("F077"), asciiSource.get("F077"),
    "ASCII and binary DXF preserve the periodic rational weight cycle");
  assert.deepEqual(byHandle(binaryDocument.modelSpaceEntities, "F071"), periodicOnly,
    "ASCII and binary DXF decode to the same periodic canonical SPLINE");
  assert.deepEqual(doubleKnot.knots, doubleKnotProfile.knots, "a repeated degree-3 internal knot is preserved without normalization");
  assert.deepEqual(tripleKnot.knots, tripleKnotProfile.knots, "a degree-multiplicity internal knot is preserved without normalization");
  assert.equal(degreeNinePeriodic.degree, 9, "higher periodic source degree is preserved for bounded-support validation");
  const unsupportedDegree = GeometryCompiler.tessellateSplineWithBudget(degreeNinePeriodic, 0.05);
  assert.equal(unsupportedDegree.invalidInput, true, "periodic Bernstein conversion above degree eight fails closed explicitly");
  assert.equal(unsupportedDegree.points.length, 0, "unsupported high-degree periodic source emits no fabricated polyline");

  const periodicMeasurements: Array<{
    handle: string;
    internalKnotMultiplicity: number[];
    segments: number;
    spanCount: number;
    reportedBoundWorld: number;
    maximumSampledErrorWorld: number;
  }> = [];
  for (const spline of [periodicOnly, doubleKnot, tripleKnot, rationalPeriodic]) {
    const degree = spline.degree;
    const start = spline.knots[degree]!;
    const end = spline.knots[spline.controlPoints.length]!;
    const startPoint = evaluateDeBoor(spline, start);
    const endPoint = evaluateDeBoor(spline, end);
    assert.ok(Math.hypot(startPoint[0] - endPoint[0], startPoint[1] - endPoint[1]) < 1e-8,
      spline.handle + ": independent De Boor oracle closes the periodic active domain");
    assert.deepEqual(spline.controlPoints.slice(-degree), spline.controlPoints.slice(0, degree),
      spline.handle + ": periodic control net repeats the degree-sized wraparound tail");
    const internalKnot = 4;
    const leftOfKnot = evaluateDeBoor(spline, internalKnot - 1e-8);
    const rightOfKnot = evaluateDeBoor(spline, internalKnot + 1e-8);
    assert.ok(Math.hypot(leftOfKnot[0] - rightOfKnot[0], leftOfKnot[1] - rightOfKnot[1]) < 1e-5,
      spline.handle + ": independent De Boor samples stay position-continuous through the repeated knot");

    const tessellation = GeometryCompiler.tessellateSplineWithBudget(spline, 0.05);
    assert.equal(tessellation.invalidInput, undefined,
      spline.handle + ": a closed periodic active interval is accepted by the bounded tessellator");
    assert.equal(tessellation.errorBoundMet, true,
      spline.handle + ": periodic Bezier spans meet the requested world-space error bound");
    assert.ok(tessellation.splineBezierSpans && tessellation.splineBezierSpans.length > 0,
      spline.handle + ": exact periodic knot spans are retained for runtime refinement");
    assert.ok(tessellation.maxSagittaWorld <= 0.05,
      spline.handle + ": convex-hull chord bound remains within 0.05 world units");
    assert.ok(Math.hypot(
      tessellation.points[0]![0] - tessellation.points.at(-1)![0],
      tessellation.points[0]![1] - tessellation.points.at(-1)![1],
    ) < 1e-9, spline.handle + ": compiled periodic polyline closes without a seam gap");

    let maximumOracleError = 0;
    const sampleCount = 12_000;
    for (let step = 0; step <= sampleCount; step++) {
      const parameter = start + (end - start) * step / sampleCount;
      maximumOracleError = Math.max(maximumOracleError,
        distanceToPolyline(evaluateDeBoor(spline, parameter), tessellation.points));
    }
    assert.ok(maximumOracleError <= 0.050001,
      spline.handle + ": 12,001 independent De Boor samples fit the requested chord bound; got " + maximumOracleError);
    assert.ok(maximumOracleError <= tessellation.maxSagittaWorld + 1e-6,
      spline.handle + ": reported control-hull bound covers independent source samples");
    periodicMeasurements.push({
      handle: spline.handle,
      internalKnotMultiplicity: [...new Set(spline.knots.filter((value) => value > start && value < end))]
        .map((knot) => spline.knots.filter((value) => value === knot).length),
      segments: tessellation.segmentCount,
      spanCount: tessellation.splineBezierSpans.length,
      reportedBoundWorld: tessellation.maxSagittaWorld,
      maximumSampledErrorWorld: maximumOracleError,
    });

    for (const knot of [...new Set(spline.knots.filter((value) => value > start && value < end))]) {
      const sourceAtKnot = evaluateDeBoor(spline, knot);
      assert.ok(distanceToPolyline(sourceAtKnot, tessellation.points) <= 1e-9,
        spline.handle + ": emitted span endpoints retain the source point at knot " + knot);
    }
  }
  assert.equal(doubleKnot.knots.filter((knot) => knot === 4).length, 2, "independent knot-count oracle sees multiplicity 2");
  assert.equal(tripleKnot.knots.filter((knot) => knot === 4).length, 3, "independent knot-count oracle sees degree multiplicity 3");

  const malformedDegreePairs = makeSplineEntity("F076", 2, simpleProfile.controlPoints, simpleProfile.knots)
    .replace("71\n3", "71\n0");
  const malformedDegreeDxf = Buffer.from(augmented.replace(appendedEntities, appendedEntities + "\n" + malformedDegreePairs));
  assert.equal((await parseDxfSplines(malformedDegreeDxf)).get("F076")?.degree, 0,
    "invalid zero degree is retained as source data instead of silently normalized to cubic");
  const malformedDegree = byHandle((await parseDxfToCanonical(malformedDegreeDxf)).modelSpaceEntities, "F076");
  assert.equal(malformedDegree.degree, 0, "canonical adapter preserves invalid source degree for explicit validation");
  assert.equal(GeometryCompiler.tessellateSplineWithBudget(malformedDegree, 0.05).invalidInput, true,
    "invalid source degree cannot enter the cubic tessellator through a default value");

  const openPeriodic: CadSplineEntity = {
    ...periodicOnly,
    controlPoints: periodicOnly.controlPoints.map((point, index) => index === periodicOnly.controlPoints.length - 1
      ? [point[0] + 1, point[1]] : [...point]),
  };
  const openPeriodicResult = GeometryCompiler.tessellateSplineWithBudget(openPeriodic, 0.05);
  assert.equal(openPeriodicResult.invalidInput, true,
    "a source flagged periodic but whose active endpoints do not close fails closed");
  assert.equal(openPeriodicResult.points.length, 0,
    "an invalid periodic seam is never rendered as fabricated geometry");

  const periodicScene = compileCanonicalToScene({
    ...document,
    modelSpaceEntities: [rationalPeriodic],
    paperSpaceEntities: {},
    blocks: {},
  }, { sceneId: "scene_f07_periodic_dxf_refined" });
  assert.notEqual(periodicScene.manifest.qualityStatus, "degraded",
    "a valid supported periodic source does not produce an invalid-geometry degradation");
  assert.ok(!periodicScene.manifest.diagnosticsSummary.diagnosticCodes.includes("CURVE_GEOMETRY_INVALID"),
    "valid periodic DXF SPLINE does not emit CURVE_GEOMETRY_INVALID");
  const periodicChunkRef = periodicScene.manifest.chunks.find((chunk) => chunk.layoutId === "Model");
  assert.ok(periodicChunkRef, "compiled periodic profile produces a model chunk");
  const periodicChunk = parseSceneChunk(periodicScene.chunks.get(periodicChunkRef.chunkId)!);
  const periodicMeta = JSON.parse(new TextDecoder().decode(periodicChunk.sections.get(SceneTag.META)!.data as Uint8Array)) as {
    curveSourceRefs?: Array<{ sourceHandle?: string; sourceType?: string; splineSource?: unknown }>;
  };
  const periodicRefs = periodicMeta.curveSourceRefs?.filter((ref) => ref.sourceHandle === rationalPeriodic.handle) || [];
  assert.ok(periodicRefs.length > 0 && periodicRefs.every((ref) => ref.sourceType === "SPLINE" && ref.splineSource),
    "rational periodic Bezier span sources are serialized for the runtime worker refinements");
  assert.ok(periodicRefs.some((ref) => Array.isArray((ref.splineSource as { weights?: unknown } | undefined)?.weights)),
    "the binary runtime sidecar retains positive rational Bezier weights");
  console.log("F07 periodic independent De Boor measurements:", JSON.stringify(periodicMeasurements));

  const clampedResult = GeometryCompiler.tessellateSplineWithBudget(clamped, 0.05);
  assert.equal(clampedResult.errorBoundMet, true, "existing non-periodic clamped SPLINE support remains intact");
  assert.ok(clampedResult.maxSagittaWorld <= 0.05, "the clamped spline retains its requested source-space bound");
  console.log("F07 DXF periodic SPLINE fields, knot multiplicities, bounded Bezier conversion, worker sidecar, and independent De Boor error oracle PASS");
}

main().catch((error: unknown) => {
  console.error("F07 DXF periodic SPLINE test failed", error);
  process.exit(1);
});
