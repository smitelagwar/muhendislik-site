// ============================================================================
// DWG/DXF MOTOR V2 — GEOMETRY COMPILER (G08)
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G08), 29_RENDER_VE_YASAM_DONGUSU.md
// Gereksinimler: R07, R10, R11, R45 | Alt kabul: V05, V06, V07, V08, V10, V11, F08, F09, F12, F13, F14
//
// Yetenekler:
// 1. Arc / Circle uyarlamalı (adaptive) tessellation (hata sınırı <= 0.25 CSS px)
// 2. Ellipse tessellation (majorAxisVector, axisRatio, startParam, endParam)
// 3. LWPolyline bulge (yay segmenti) ve kalınlık (quad/triangulation)
// 4. B-Spline / NURBS De Boor algoritması ile eğri hesaplama
// 5. Hatch sınır döngüleri ve earcut 3.2.3 ile iç delik/ada triangülasyonu
// 6. Linetype (kesikli/noktalı çizgi) faz sürekliliği
// 7. Wipeout arka plan maskeleme
// 8. Painter's draw order korunumu

import earcut from "earcut";
import type {
  CadPoint2D,
  CadEntity,
  CadArcEntity,
  CadCircleEntity,
  CadEllipseEntity,
  CadLwPolylineEntity,
  CadSplineEntity,
  CadHatchEntity,
  CadWipeoutEntity,
  CadLinetype,
} from "../canonical/types";
import {
  tessellatePolylineWithWidth,
  type PolylineVertexWidth,
} from "../render/cad-stroke";

export interface CompiledLineSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  layer: string;
  order: bigint;
  color?: number;
  lineweightMm?: number;
  curveSource?: AnalyticCurveSourceSegment;
  /** Local circular chord sagitta for a LWPOLYLINE bulge segment. */
  bulgeCurveTessellationErrorWorld?: number;
  /** Conservative source chord-deviation bound for a tessellated HATCH boundary segment. */
  hatchBoundaryTessellationErrorWorld?: number;
}

export interface AnalyticCurveSourceSegment {
  curveId: string;
  sourceHandle: string;
  sourceType: "CIRCLE" | "ARC" | "ELLIPSE" | "BULGE" | "SPLINE";
  center: [number, number];
  basisU: [number, number];
  basisV: [number, number];
  startParam: number;
  endParam: number;
  segmentIndex: number;
  /** Rational Bezier control polygon for a single non-periodic spline knot span. */
  splineSource?: RationalBezierSource;
}

export interface RationalBezierSource {
  controlPoints: CadPoint2D[];
  weights: number[];
}

export interface SplineBezierSourceSpan {
  spanIndex: number;
  points: CadPoint2D[];
  /** Normalized Bezier parameters corresponding one-to-one with points. */
  parameters: number[];
  source: RationalBezierSource;
}

export interface CompiledTriangleMesh {
  // World-space geometry must remain Float64 until scene chunk origin subtraction.
  vertices: Float64Array; // [x0, y0, x1, y1, x2, y2, ...]
  layer: string;
  order: bigint;
  color?: number;
  alpha?: number;
  isWipeout?: boolean;
}

export interface ArcTessellationResult {
  points: CadPoint2D[];
  requestedSegments: number;
  segmentCount: number;
  maxSagittaWorld: number;
  errorBoundMet: boolean;
  /** True when the input curve cannot be evaluated; distinct from a resource-capped approximation. */
  invalidInput?: boolean;
  /** Exact Bezier span sources are exposed only after the complete spline tessellation succeeds. */
  splineBezierSpans?: SplineBezierSourceSpan[];
}

function ellipseSweep(startParam: number, endParam: number, ccw: boolean): number {
  let sweep = endParam - startParam;
  if (ccw) {
    if (sweep <= 0) sweep += Math.PI * 2;
  } else if (sweep >= 0) {
    sweep -= Math.PI * 2;
  }
  return sweep;
}

/** Screen-space target converted to drawing units through the active view transform. */
export function worldCurveErrorFromScreen(
  targetCssPixels: number,
  unitsPerCssPixel: number,
  maxTransformSingularValue: number
): number {
  if (
    !Number.isFinite(targetCssPixels) || targetCssPixels <= 0 ||
    !Number.isFinite(unitsPerCssPixel) || unitsPerCssPixel <= 0 ||
    !Number.isFinite(maxTransformSingularValue) || maxTransformSingularValue <= 0
  ) throw new RangeError("Curve screen-error inputs must be finite and positive");
  return targetCssPixels * unitsPerCssPixel / maxTransformSingularValue;
}

const MAX_CURVE_TESSELLATION_SEGMENTS = 1_000_000;

function boundedSegmentLimit(maxSegments: number): number {
  return Number.isFinite(maxSegments)
    ? Math.min(MAX_CURVE_TESSELLATION_SEGMENTS, Math.max(1, Math.floor(maxSegments)))
    : MAX_CURVE_TESSELLATION_SEGMENTS;
}

export class GeometryCompiler {
  /**
   * 1. Uyarlamalı (Adaptive) Yay (ARC) Tessellation
   * Hata sınırı (sagitta): s = r * (1 - cos(theta / 2)) <= maxError
   * theta <= 2 * acos(1 - maxError / r)
   */
  public static tessellateArc(
    center: CadPoint2D,
    radius: number,
    startAngleRad: number,
    endAngleRad: number,
    isClockwise = false,
    maxError = 0.25
  ): CadPoint2D[] {
    return this.tessellateArcWithBudget(center, radius, startAngleRad, endAngleRad, isClockwise, maxError).points;
  }

  /**
   * Computes an arc tessellation without silently claiming a tolerance after a
   * resource cap is hit. Callers that need proof of visual accuracy should
   * inspect `errorBoundMet`; the legacy points-only API remains compatible.
   */
  public static tessellateArcWithBudget(
    center: CadPoint2D,
    radius: number,
    startAngleRad: number,
    endAngleRad: number,
    isClockwise = false,
    maxError = 0.25,
    maxSegments = 1_000_000
  ): ArcTessellationResult {
    if (!Number.isFinite(radius) || radius <= 0) {
      return { points: [center], requestedSegments: 0, segmentCount: 0, maxSagittaWorld: 0, errorBoundMet: true };
    }

    let sweep = endAngleRad - startAngleRad;
    if (isClockwise) {
      if (sweep > 0) sweep -= Math.PI * 2;
    } else {
      if (sweep < 0) sweep += Math.PI * 2;
    }

    if (Math.abs(sweep) < 1e-9) sweep = Math.PI * 2;

    // Açı adımı hesabı
    const safeRadius = Math.abs(radius);
    const requestedError = Number.isFinite(maxError) && maxError > 0 ? maxError : 1e-5;
    const safeError = Math.min(safeRadius * 0.5, requestedError);
    // Stable form of 2*acos(1 - error/radius), including very fine tolerances.
    const maxDeltaTheta = 2 * Math.asin(Math.sqrt((safeError * (2 * safeRadius - safeError)) / (safeRadius * safeRadius)));
    const requestedSegments = Math.max(1, Math.ceil(Math.abs(sweep) / maxDeltaTheta));
    const segmentLimit = boundedSegmentLimit(maxSegments);
    const segCount = Math.min(requestedSegments, segmentLimit);

    const points: CadPoint2D[] = [];
    for (let i = 0; i <= segCount; i++) {
      const theta = startAngleRad + (sweep * i) / segCount;
      points.push([
        center[0] + radius * Math.cos(theta),
        center[1] + radius * Math.sin(theta),
      ]);
    }
    const actualDelta = Math.abs(sweep) / segCount;
    const maxSagittaWorld = 2 * safeRadius * Math.sin(actualDelta / 4) ** 2;
    return {
      points,
      requestedSegments,
      segmentCount: segCount,
      maxSagittaWorld,
      errorBoundMet: requestedSegments <= segmentLimit && maxSagittaWorld <= requestedError * (1 + 1e-12),
    };
  }

  /**
   * 2. Çember (CIRCLE) Tessellation
   */
  public static tessellateCircle(
    center: CadPoint2D,
    radius: number,
    maxError = 0.25
  ): CadPoint2D[] {
    return this.tessellateArc(center, radius, 0, Math.PI * 2, false, maxError);
  }

  /**
   * 3. Elips (ELLIPSE) Tessellation
   * Parametrik denklem: P(t) = Center + cos(t)*majorVector + sin(t)*minorVector
   */
  public static tessellateEllipse(
    center: CadPoint2D,
    majorVector: CadPoint2D,
    axisRatio: number,
    startParam = 0,
    endParam = Math.PI * 2,
    maxError = 0.25
  ): CadPoint2D[] {
    return this.tessellateEllipseWithBudget(center, majorVector, axisRatio, startParam, endParam, maxError).points;
  }

  /** Conservative interpolation-error bound from max |P''(t)| for an ellipse. */
  public static tessellateEllipseWithBudget(
    center: CadPoint2D,
    majorVector: CadPoint2D,
    axisRatio: number,
    startParam = 0,
    endParam = Math.PI * 2,
    maxError = 0.25,
    maxSegments = 1_000_000,
    ccw = true
  ): ArcTessellationResult {
    const ux = majorVector[0];
    const uy = majorVector[1];
    const majorLen = Math.hypot(ux, uy);
    if (majorLen <= 1e-9 || !Number.isFinite(majorLen)) {
      return { points: [center], requestedSegments: 0, segmentCount: 0, maxSagittaWorld: 0, errorBoundMet: true };
    }

    const safeRatio = Math.max(1e-6, Math.min(1, axisRatio));
    // Minör eksen vektörü: majör eksene dik ve axisRatio ile ölçekli
    const vx = -uy * safeRatio;
    const vy = ux * safeRatio;

    const sweep = ellipseSweep(startParam, endParam, ccw);

    const requestedError = Number.isFinite(maxError) && maxError > 0 ? maxError : 1e-5;
    // For an ellipse P(t), |P''(t)| <= |majorVector| when minor/major <= 1.
    // The linear-interpolation deviation is bounded by M * deltaT^2 / 8.
    const requestedSegments = Math.max(1, Math.ceil(Math.abs(sweep) * Math.sqrt(majorLen / (8 * requestedError))));
    const segmentLimit = boundedSegmentLimit(maxSegments);
    const segCount = Math.min(requestedSegments, segmentLimit);

    const points: CadPoint2D[] = [];
    for (let i = 0; i <= segCount; i++) {
      const t = startParam + (sweep * i) / segCount;
      const cosT = Math.cos(t);
      const sinT = Math.sin(t);
      points.push([
        center[0] + cosT * ux + sinT * vx,
        center[1] + cosT * uy + sinT * vy,
      ]);
    }
    const maxSagittaWorld = majorLen * (sweep / segCount) ** 2 / 8;
    return {
      points,
      requestedSegments,
      segmentCount: segCount,
      maxSagittaWorld,
      errorBoundMet: requestedSegments <= segmentLimit && maxSagittaWorld <= requestedError * (1 + 1e-12),
    };
  }

  /**
   * 4. Bulge (Yay Bombesi) Segmenti Tessellation
   * Bulge = tan(sweep / 4)
   */
  public static tessellateBulgeSegment(
    p1: CadPoint2D,
    p2: CadPoint2D,
    bulge: number,
    maxError = 0.25
  ): CadPoint2D[] {
    return this.tessellateBulgeSegmentWithBudget(p1, p2, bulge, maxError).points;
  }

  public static tessellateBulgeSegmentWithBudget(
    p1: CadPoint2D,
    p2: CadPoint2D,
    bulge: number,
    maxError = 0.25,
    maxSegments = 1_000_000
  ): ArcTessellationResult {
    if (Math.abs(bulge) < 1e-6) {
      return { points: [p1, p2], requestedSegments: 1, segmentCount: 1, maxSagittaWorld: 0, errorBoundMet: true };
    }

    const arc = this.getBulgeArcParameters(p1, p2, bulge);
    if (!arc) {
      return { points: [p1, p2], requestedSegments: 1, segmentCount: 1, maxSagittaWorld: 0, errorBoundMet: true };
    }
    return this.tessellateArcWithBudget(
      arc.center, arc.radius, arc.startAngleRad, arc.startAngleRad + arc.sweepRad,
      arc.sweepRad < 0, maxError, maxSegments
    );
  }

  private static getBulgeArcParameters(
    p1: CadPoint2D,
    p2: CadPoint2D,
    bulge: number,
  ): { center: [number, number]; radius: number; startAngleRad: number; sweepRad: number } | null {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const chordLen = Math.hypot(dx, dy);
    if (!Number.isFinite(bulge) || Math.abs(bulge) < 1e-6 || chordLen < 1e-9 || !Number.isFinite(chordLen)) return null;
    const radius = (chordLen * (1 + bulge * bulge)) / (4 * Math.abs(bulge));
    const sweepRad = 4 * Math.atan(bulge);
    const midpointX = (p1[0] + p2[0]) / 2;
    const midpointY = (p1[1] + p2[1]) / 2;
    const normalX = -dy / chordLen;
    const normalY = dx / chordLen;
    const centerOffset = (chordLen / 2) * ((1 - bulge * bulge) / (2 * bulge));
    const center: [number, number] = [midpointX + normalX * centerOffset, midpointY + normalY * centerOffset];
    if (![...center, radius, sweepRad].every(Number.isFinite) || radius <= 0 || sweepRad === 0) return null;
    return { center, radius, startAngleRad: Math.atan2(p1[1] - center[1], p1[0] - center[0]), sweepRad };
  }

  /**
   * 5. LWPOLYLINE Açılımı (Bulge ve Genişlik Desteği)
   */
  public static expandLwPolyline(entity: CadLwPolylineEntity, maxCurveSegments = 65_536, maxCurveErrorWorld = 0.25): {
    lineSegments: CompiledLineSegment[];
    thickTriangles: CompiledTriangleMesh | null;
    polyPoints: CadPoint2D[];
    refinementLimitReached: boolean;
  } {
    const v = entity.vertices;
    if (!v || v.length < 2) return { lineSegments: [], thickTriangles: null, polyPoints: [], refinementLimitReached: false };

    const polyPoints: CadPoint2D[] = [];
    const polyVertWidths: PolylineVertexWidth[] = [];
    const segmentCurveSources: Array<AnalyticCurveSourceSegment | undefined> = [];
    const segmentBulgeErrors: Array<number | undefined> = [];
    let refinementLimitReached = false;
    const count = entity.isClosed ? v.length : v.length - 1;

    for (let i = 0; i < count; i++) {
      const vCurr = v[i];
      const nextIdx = (i + 1) % v.length;
      const vNext = v[nextIdx];

      const pxCurr = typeof vCurr.x === "number" ? vCurr.x : (vCurr as any).point?.[0] ?? 0;
      const pyCurr = typeof vCurr.y === "number" ? vCurr.y : (vCurr as any).point?.[1] ?? 0;
      const pxNext = typeof vNext.x === "number" ? vNext.x : (vNext as any).point?.[0] ?? 0;
      const pyNext = typeof vNext.y === "number" ? vNext.y : (vNext as any).point?.[1] ?? 0;
      const pCurrent: CadPoint2D = [pxCurr, pyCurr];
      const pNext: CadPoint2D = [pxNext, pyNext];
      const bulge = vCurr.bulge || 0;

      const sw = vCurr.startWidth ?? entity.constantWidth ?? 0;
      const ew = vCurr.endWidth ?? vCurr.startWidth ?? entity.constantWidth ?? 0;

      if (Math.abs(bulge) > 1e-6) {
        const arc = this.getBulgeArcParameters(pCurrent, pNext, bulge);
          const arcResult = this.tessellateBulgeSegmentWithBudget(pCurrent, pNext, bulge, maxCurveErrorWorld, maxCurveSegments);
        if (!arcResult.errorBoundMet) refinementLimitReached = true;
        const arcPts = arcResult.points;
        const arcCount = arcPts.length;
        if (polyPoints.length === 0) {
          polyPoints.push(arcPts[0]);
          polyVertWidths.push({ point: arcPts[0], startWidth: sw, endWidth: sw });
        }
        for (let j = 1; j < arcCount; j++) {
          const t = j / (arcCount - 1);
          const interpolatedW = sw + t * (ew - sw);
          polyPoints.push(arcPts[j]);
          polyVertWidths.push({
            point: arcPts[j],
            startWidth: interpolatedW,
            endWidth: interpolatedW,
          });
          const segmentIndex = j - 1;
            segmentCurveSources.push(arc ? {
            curveId: `${entity.handle}:LWPOLYLINE_BULGE:${i}`,
            sourceHandle: entity.handle,
            sourceType: "BULGE",
            center: arc.center,
            basisU: [arc.radius, 0],
            basisV: [0, arc.radius],
            startParam: arc.startAngleRad + arc.sweepRad * segmentIndex / (arcCount - 1),
            endParam: arc.startAngleRad + arc.sweepRad * (segmentIndex + 1) / (arcCount - 1),
              segmentIndex,
            } : undefined);
            segmentBulgeErrors.push(Number.isFinite(arcResult.maxSagittaWorld) ? arcResult.maxSagittaWorld : undefined);
        }
      } else {
        if (polyPoints.length === 0) {
          polyPoints.push(pCurrent);
          polyVertWidths.push({ point: pCurrent, startWidth: sw, endWidth: ew });
        }
        polyPoints.push(pNext);
        polyVertWidths.push({ point: pNext, startWidth: sw, endWidth: ew });
        segmentCurveSources.push(undefined);
        segmentBulgeErrors.push(undefined);
      }
    }

    // Çizgi parçalarına dönüştür (Centerline değişmezliği korunur)
    const lineSegments: CompiledLineSegment[] = [];
    for (let i = 0; i < polyPoints.length - 1; i++) {
      lineSegments.push({
        x0: polyPoints[i][0],
        y0: polyPoints[i][1],
        x1: polyPoints[i + 1][0],
        y1: polyPoints[i + 1][1],
        layer: entity.layer,
        order: entity.order,
        lineweightMm: entity.lineweightMm,
        curveSource: segmentCurveSources[i],
        ...(Number.isFinite(segmentBulgeErrors[i]) ? { bulgeCurveTessellationErrorWorld: segmentBulgeErrors[i] } : {}),
      });
    }

    // Kalın polyline varsa (constantWidth > 0 veya vertex start/end width > 0)
    // segment quad + join/cap + miter limit ile üçgen dizisi üret
    let thickTriangles: CompiledTriangleMesh | null = null;
    const thickVerts = tessellatePolylineWithWidth(polyVertWidths, entity.isClosed);
    if (thickVerts && thickVerts.length > 0) {
      thickTriangles = {
        vertices: thickVerts,
        layer: entity.layer,
        order: entity.order,
        alpha: 1,
      };
    }

    return { lineSegments, thickTriangles, polyPoints, refinementLimitReached };
  }

  /**
   * 6. De Boor Algoritması ile B-Spline / NURBS Tessellation
   */
  public static tessellateSpline(
    spline: CadSplineEntity,
    maxError = 0.25
  ): CadPoint2D[] {
    return this.tessellateSplineWithBudget(spline, maxError).points;
  }

  /**
   * Convert each B-spline knot span to rational Bezier form by knot insertion,
   * then subdivide its homogeneous control polygon until the convex-hull
   * distance to the output chord is within the requested world-space budget.
   */
  public static tessellateSplineWithBudget(
    spline: CadSplineEntity,
    maxError = 0.25,
    maxSegments = 65_536,
    maxDepth = 32
  ): ArcTessellationResult {
    const invalid = (): ArcTessellationResult => ({
      points: [], requestedSegments: 0, segmentCount: 0, maxSagittaWorld: Infinity, errorBoundMet: false, invalidInput: true,
    });
    const cp = spline.controlPoints;
    const degree = spline.degree;
    const knots = spline.knots;
    const segmentLimit = boundedSegmentLimit(maxSegments);
    if (
      !Number.isInteger(degree) || degree < 1 || degree > 16 ||
      !Array.isArray(cp) || cp.length < degree + 1 || !Array.isArray(knots) ||
      knots.length !== cp.length + degree + 1 || !Number.isFinite(maxError) || maxError <= 0 ||
      cp.some((pt) => !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) ||
      knots.some((knot, index) => !Number.isFinite(knot) || (index > 0 && knot < knots[index - 1]!))
    ) return invalid();

    const weights = spline.weights || new Array<number>(cp.length).fill(1);
    if (weights.length !== cp.length || weights.some((weight) => !Number.isFinite(weight) || weight <= 0)) return invalid();
    const domainStart = knots[degree]!;
    const domainEnd = knots[cp.length]!;
    if (!(domainEnd > domainStart)) return invalid();

    type HPoint = [number, number, number];
    const homogeneousControls: HPoint[] = cp.map((point, index) => [
      point[0] * weights[index]!, point[1] * weights[index]!, weights[index]!,
    ]);
    const spans: Array<{ controlPolygon: HPoint[]; startParam: number; endParam: number }> = [];
    const euclidean = (point: HPoint): CadPoint2D => [point[0] / point[2], point[1] / point[2]];
    const sourceFitErrorBySpan: number[] = [];
    if (spline.isPeriodic) {
      // Fit each periodic polynomial knot span in homogeneous coordinates.
      // This avoids treating the unclamped active-interval endpoints as
      // clamped control points. Degree is bounded because equispaced Bernstein
      // collocation becomes poorly conditioned at high degrees.
      const coordinateScale = Math.max(1, ...cp.flatMap((point) => [Math.abs(point[0]), Math.abs(point[1])]));
      const positionTolerance = 512 * Number.EPSILON * coordinateScale;
      const weightScale = Math.max(1, ...weights.map(Math.abs));
      const weightTolerance = 512 * Number.EPSILON * weightScale;
      const knotScale = Math.max(1, ...knots.map(Math.abs));
      const knotTolerance = 512 * Number.EPSILON * knotScale;
      const uniqueControlCount = cp.length - degree;
      const period = domainEnd - domainStart;
      if (degree > 8 || uniqueControlCount < degree + 1 ||
          homogeneousControls.some((point) => point.some((value) => !Number.isFinite(value)))) return invalid();
      for (let index = 0; index < degree; index++) {
        const head = cp[index]!;
        const tail = cp[cp.length - degree + index]!;
        if (Math.hypot(head[0] - tail[0], head[1] - tail[1]) > positionTolerance ||
            Math.abs(weights[index]! - weights[weights.length - degree + index]!) > weightTolerance) return invalid();
      }
      for (let index = 0; index + uniqueControlCount < knots.length; index++) {
        if (Math.abs((knots[index + uniqueControlCount]! - knots[index]!) - period) > knotTolerance) return invalid();
      }
      const sampleCount = degree + 1;
      const fitParameters = Array.from({ length: sampleCount }, (_, index) =>
        (1 - Math.cos(Math.PI * index / degree)) / 2);

      function evaluateHomogeneousOnSpan(spanIndex: number, parameter: number): HPoint {
        const work = homogeneousControls.slice(spanIndex - degree, spanIndex + 1).map((point) => [...point] as HPoint);
        for (let level = 1; level <= degree; level++) {
          for (let index = degree; index >= level; index--) {
            const knotIndex = spanIndex - degree + index;
            const denominator = knots[knotIndex + degree - level + 1]! - knots[knotIndex]!;
            const alpha = denominator === 0 ? 0 : (parameter - knots[knotIndex]!) / denominator;
            const left = work[index - 1]!;
            const right = work[index]!;
            work[index] = [
              (1 - alpha) * left[0] + alpha * right[0],
              (1 - alpha) * left[1] + alpha * right[1],
              (1 - alpha) * left[2] + alpha * right[2],
            ];
          }
        }
        return work[degree]!;
      }

      function bernstein(index: number, parameter: number): number {
        let coefficient = 1;
        for (let factor = 1; factor <= index; factor++) coefficient *= (degree - index + factor) / factor;
        if (parameter === 0) return index === 0 ? 1 : 0;
        if (parameter === 1) return index === degree ? 1 : 0;
        return coefficient * parameter ** index * (1 - parameter) ** (degree - index);
      }

      function solveBezierControls(samples: HPoint[]): HPoint[] | null {
        const width = degree + 1;
        const matrix = fitParameters.map((parameter, row) => [
          ...Array.from({ length: width }, (_, column) => bernstein(column, parameter)),
          ...samples[row]!,
        ]);
        for (let column = 0; column < width; column++) {
          let pivot = column;
          for (let row = column + 1; row < width; row++) {
            if (Math.abs(matrix[row]![column]!) > Math.abs(matrix[pivot]![column]!)) pivot = row;
          }
          if (Math.abs(matrix[pivot]![column]!) <= Number.EPSILON * 16) return null;
          [matrix[column], matrix[pivot]] = [matrix[pivot]!, matrix[column]!];
          const pivotValue = matrix[column]![column]!;
          for (let entry = column; entry < width + 3; entry++) matrix[column]![entry] = matrix[column]![entry]! / pivotValue;
          for (let row = 0; row < width; row++) {
            if (row === column) continue;
            const factor = matrix[row]![column]!;
            for (let entry = column; entry < width + 3; entry++) {
              matrix[row]![entry] = matrix[row]![entry]! - factor * matrix[column]![entry]!;
            }
          }
        }
        return Array.from({ length: width }, (_, index) => [
          matrix[index]![width]!, matrix[index]![width + 1]!, matrix[index]![width + 2]!,
        ]);
      }

      function evaluateBezier(control: HPoint[], parameter: number): HPoint {
        const work = control.map((point) => [...point] as HPoint);
        for (let level = 1; level < control.length; level++) {
          for (let index = 0; index < control.length - level; index++) {
            work[index] = [
              (1 - parameter) * work[index]![0] + parameter * work[index + 1]![0],
              (1 - parameter) * work[index]![1] + parameter * work[index + 1]![1],
              (1 - parameter) * work[index]![2] + parameter * work[index + 1]![2],
            ];
          }
        }
        return work[0]!;
      }

      const fitNoiseAllowance = 2048 * Number.EPSILON * coordinateScale * (degree + 1) ** 2;
      for (let spanIndex = degree; spanIndex < cp.length; spanIndex++) {
        const startParam = knots[spanIndex]!;
        const endParam = knots[spanIndex + 1]!;
        if (!(endParam > startParam) || startParam < domainStart || endParam > domainEnd) continue;
        const controlPolygon = solveBezierControls(fitParameters.map((parameter) =>
          evaluateHomogeneousOnSpan(spanIndex, startParam + (endParam - startParam) * parameter)));
        if (!controlPolygon || controlPolygon.some((point) => point[2] <= 0 || point.some((value) => !Number.isFinite(value)))) return invalid();
        let fitError = 0;
        const validationCount = degree * 2 + 3;
        for (let index = 0; index < validationCount; index++) {
          const parameter = (1 - Math.cos(Math.PI * index / (validationCount - 1))) / 2;
          const sourcePoint = euclidean(evaluateHomogeneousOnSpan(spanIndex, startParam + (endParam - startParam) * parameter));
          const bezierPoint = euclidean(evaluateBezier(controlPolygon, parameter));
          fitError = Math.max(fitError, Math.hypot(sourcePoint[0] - bezierPoint[0], sourcePoint[1] - bezierPoint[1]));
        }
        if (!Number.isFinite(fitError) || fitError > fitNoiseAllowance) return invalid();
        spans.push({ controlPolygon, startParam, endParam });
        sourceFitErrorBySpan.push(fitError + fitNoiseAllowance);
      }
    } else {
      let refinedKnots = [...knots];
      let refinedControls = homogeneousControls;
      const internalValues = [...new Set(knots.filter((knot) => knot > domainStart && knot < domainEnd))];

      function multiplicity(value: number): number {
        return refinedKnots.reduce((count, knot) => count + (knot === value ? 1 : 0), 0);
      }
      function insertKnot(value: number): boolean {
        const n = refinedControls.length - 1;
        const s = multiplicity(value);
        let k = degree;
        while (k < n && refinedKnots[k + 1]! <= value) k++;
        if (s >= degree || k - degree < 0 || k - s < 0) return false;
        const next: Array<HPoint | undefined> = new Array(refinedControls.length + 1);
        for (let i = 0; i <= k - degree; i++) next[i] = refinedControls[i]!;
        for (let i = k - s; i <= n; i++) next[i + 1] = refinedControls[i]!;
        for (let i = k - degree + 1; i <= k - s; i++) {
          const denominator = refinedKnots[i + degree]! - refinedKnots[i]!;
          if (denominator <= 0) return false;
          const alpha = (value - refinedKnots[i]!) / denominator;
          const a = refinedControls[i - 1]!;
          const b = refinedControls[i]!;
          next[i] = [
            (1 - alpha) * a[0] + alpha * b[0],
            (1 - alpha) * a[1] + alpha * b[1],
            (1 - alpha) * a[2] + alpha * b[2],
          ];
        }
        if (next.some((point) => !point)) return false;
        refinedControls = next as HPoint[];
        refinedKnots.splice(k + 1, 0, value);
        return true;
      }

      for (const knot of internalValues) {
        while (multiplicity(knot) < degree) {
          if (!insertKnot(knot)) return invalid();
        }
      }
      for (let span = degree; span < refinedControls.length; span++) {
        if (refinedKnots[span + 1]! <= refinedKnots[span]!) continue;
        if (refinedKnots[span]! < domainStart || refinedKnots[span + 1]! > domainEnd) continue;
        const controlPolygon = refinedControls.slice(span - degree, span + 1);
        if (controlPolygon.length !== degree + 1 || controlPolygon.some((point) => point[2] <= 0)) return invalid();
        spans.push({
          controlPolygon,
          startParam: refinedKnots[span]!,
          endParam: refinedKnots[span + 1]!,
        });
        sourceFitErrorBySpan.push(0);
      }
    }
    if (spans.length === 0) return invalid();

    if (spline.isPeriodic) {
      const first = euclidean(spans[0]!.controlPolygon[0]!);
      const last = euclidean(spans[spans.length - 1]!.controlPolygon.at(-1)!);
      const coordinateScale = Math.max(1, ...cp.flatMap((point) => [Math.abs(point[0]), Math.abs(point[1])]));
      const closureTolerance = 512 * Number.EPSILON * coordinateScale;
      if (Math.hypot(first[0] - last[0], first[1] - last[1]) > closureTolerance + sourceFitErrorBySpan[0]! + sourceFitErrorBySpan.at(-1)!) return invalid();
    }
    function pointSegmentDistance(point: CadPoint2D, start: CadPoint2D, end: CadPoint2D): number {
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length2 = dx * dx + dy * dy;
      if (length2 <= Number.EPSILON) return Math.hypot(point[0] - start[0], point[1] - start[1]);
      const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / length2));
      return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
    }
    function splitBezier(control: HPoint[]): [HPoint[], HPoint[]] {
      const levels: HPoint[][] = [control.map((point) => [...point] as HPoint)];
      while (levels[levels.length - 1]!.length > 1) {
        const previous = levels[levels.length - 1]!;
        const next: HPoint[] = [];
        for (let i = 0; i + 1 < previous.length; i++) {
          next.push([
            (previous[i]![0] + previous[i + 1]![0]) / 2,
            (previous[i]![1] + previous[i + 1]![1]) / 2,
            (previous[i]![2] + previous[i + 1]![2]) / 2,
          ]);
        }
        levels.push(next);
      }
      return [levels.map((level) => level[0]!), levels.map((level) => level[level.length - 1]!).reverse()];
    }

    const resultPoints: CadPoint2D[] = [];
    const splineBezierSpans: SplineBezierSourceSpan[] = [];
    let segmentCount = 0;
    let requestedSegments = 0;
    let maxDeviation = 0;
    let errorBoundMet = true;
    const refine = (
      control: HPoint[],
      depth: number,
      startParam: number,
      endParam: number,
      spanPoints: CadPoint2D[],
      spanParameters: number[],
      sourceFitErrorWorld: number,
    ): void => {
      if (!errorBoundMet) return;
      const first = euclidean(control[0]!);
      const last = euclidean(control[control.length - 1]!);
      const deviation = Math.max(...control.map((point) => pointSegmentDistance(euclidean(point), first, last)));
      if (deviation + sourceFitErrorWorld <= maxError) {
        maxDeviation = Math.max(maxDeviation, deviation + sourceFitErrorWorld);
        requestedSegments++;
        if (segmentCount >= segmentLimit) {
          errorBoundMet = false;
          return;
        }
        segmentCount++;
        resultPoints.push(last);
        spanPoints.push(last);
        spanParameters.push(endParam);
        return;
      }
      if (depth >= maxDepth || segmentCount >= segmentLimit) {
        maxDeviation = Math.max(maxDeviation, deviation + sourceFitErrorWorld);
        requestedSegments = Math.max(requestedSegments, segmentLimit + 1);
        errorBoundMet = false;
        return;
      }
      requestedSegments++;
      const [left, right] = splitBezier(control);
      const middleParam = (startParam + endParam) / 2;
      refine(left, depth + 1, startParam, middleParam, spanPoints, spanParameters, sourceFitErrorWorld);
      refine(right, depth + 1, middleParam, endParam, spanPoints, spanParameters, sourceFitErrorWorld);
    };
    for (let spanIndex = 0; spanIndex < spans.length; spanIndex++) {
      const span = spans[spanIndex]!;
      const firstPoint = euclidean(span.controlPolygon[0]!);
      const spanPoints: CadPoint2D[] = [firstPoint];
      const spanParameters = [0];
      if (resultPoints.length === 0) resultPoints.push(firstPoint);
      refine(span.controlPolygon, 0, 0, 1, spanPoints, spanParameters, sourceFitErrorBySpan[spanIndex]!);
      if (!errorBoundMet) break;
      splineBezierSpans.push({
        spanIndex,
        points: spanPoints,
        parameters: spanParameters,
        source: {
          controlPoints: span.controlPolygon.map((point) => euclidean(point)),
          weights: span.controlPolygon.map((point) => point[2]),
        },
      });
    }
    if (errorBoundMet) requestedSegments = segmentCount;
    else requestedSegments = Math.max(requestedSegments, segmentLimit + 1);
    return {
      points: resultPoints,
      requestedSegments,
      segmentCount,
      maxSagittaWorld: maxDeviation,
      errorBoundMet,
      ...(errorBoundMet ? { splineBezierSpans } : {}),
    };
  }

  /**
   * 7. HATCH Üçgenleme (earcut 3.2.3 ile delik ve iç ada desteği)
   */
  public static triangulateHatch(hatch: CadHatchEntity, maxCurveSegments = 65_536, maxCurveErrorWorld = 0.25): {
    mesh: CompiledTriangleMesh | null;
    boundaryLines: CompiledLineSegment[];
    refinementLimitReached: boolean;
    invalidCurveGeometry: boolean;
    maxBoundaryTessellationErrorWorld: number;
  } {
    const boundaryLines: CompiledLineSegment[] = [];
    let refinementLimitReached = false;
    let invalidCurveGeometry = false;
    let maxBoundaryTessellationErrorWorld = 0;
    const includeBoundaryError = (result: ArcTessellationResult): void => {
      if (Number.isFinite(result.maxSagittaWorld)) {
        maxBoundaryTessellationErrorWorld = Math.max(maxBoundaryTessellationErrorWorld, result.maxSagittaWorld);
      }
      if (!result.errorBoundMet) refinementLimitReached = true;
    };
    if (!hatch.loops || hatch.loops.length === 0) {
      return { mesh: null, boundaryLines, refinementLimitReached, invalidCurveGeometry, maxBoundaryTessellationErrorWorld };
    }

    // 1. Her döngüyü düz 2D nokta poligonuna çevir (bulge, arc, ellipse, spline desteği)
    const polygonRings: CadPoint2D[][] = [];
    const polygonCurveSources: Array<Array<AnalyticCurveSourceSegment | undefined>> = [];
    const polygonCurveErrors: Array<Array<number | undefined>> = [];
    const sourceHandle = hatch.handle || "hatch_spline";

    for (let loopIndex = 0; loopIndex < hatch.loops.length; loopIndex++) {
      const loop = hatch.loops[loopIndex]!;
      const ring: CadPoint2D[] = [];
      const ringCurveSources: Array<AnalyticCurveSourceSegment | undefined> = [];
      const ringCurveErrors: Array<number | undefined> = [];

      const appendCurvePoints = (
        points: CadPoint2D[],
        curve?: Pick<AnalyticCurveSourceSegment,
          "curveId" | "sourceHandle" | "sourceType" | "center" | "basisU" | "basisV" | "startParam" | "endParam" | "splineSource">,
        parameters?: number[],
        tessellationErrorWorld?: number,
      ): void => {
        const segmentCount = points.length - 1;
        for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
          ring.push(points[segmentIndex]!);
          if (curve && segmentCount > 0) {
            ringCurveSources.push({
              ...curve,
              startParam: parameters?.[segmentIndex] ?? curve.startParam + (curve.endParam - curve.startParam) * segmentIndex / segmentCount,
              endParam: parameters?.[segmentIndex + 1] ?? curve.startParam + (curve.endParam - curve.startParam) * (segmentIndex + 1) / segmentCount,
              segmentIndex,
            });
          } else {
            ringCurveSources.push(undefined);
          }
          ringCurveErrors.push(Number.isFinite(tessellationErrorWorld) ? tessellationErrorWorld : undefined);
        }
      };

      if (loop.isPolyline && loop.vertices) {
        const v = loop.vertices;
        const bulges = loop.bulges || [];
        for (let i = 0; i < v.length; i++) {
          const pCurrent = v[i];
          const nextIdx = (i + 1) % v.length;
          const pNext = v[nextIdx];
          const b = bulges[i] || 0;
          if (Math.abs(b) > 1e-6) {
            const arc = this.getBulgeArcParameters(pCurrent, pNext, b);
            const arcResult = this.tessellateBulgeSegmentWithBudget(pCurrent, pNext, b, maxCurveErrorWorld, maxCurveSegments);
            includeBoundaryError(arcResult);
            appendCurvePoints(arcResult.points, arc ? {
              curveId: `${sourceHandle}:HATCH:${loopIndex}:BULGE:${i}`,
              sourceHandle,
              sourceType: "BULGE",
              center: arc.center,
              basisU: [arc.radius, 0],
              basisV: [0, arc.radius],
              startParam: arc.startAngleRad,
              endParam: arc.startAngleRad + arc.sweepRad,
            } : undefined, undefined, arcResult.maxSagittaWorld);
          } else {
            ring.push(pCurrent);
            ringCurveSources.push(undefined);
            ringCurveErrors.push(undefined);
          }
        }
      } else if (loop.edges) {
        for (let edgeIndex = 0; edgeIndex < loop.edges.length; edgeIndex++) {
          const edge = loop.edges[edgeIndex]!;
          if (edge.type === "LINE") {
            ring.push(edge.start);
            ringCurveSources.push(undefined);
          } else if (edge.type === "ARC") {
            let sweep = edge.endAngleRad - edge.startAngleRad;
            if (edge.ccw) {
              if (sweep < 0) sweep += Math.PI * 2;
            } else if (sweep > 0) {
              sweep -= Math.PI * 2;
            }
            // Match tessellateArcWithBudget's coincident-endpoint full-circle convention.
            if (Math.abs(sweep) < 1e-9) sweep = Math.PI * 2;
            const arcResult = this.tessellateArcWithBudget(
              edge.center,
              edge.radius,
              edge.startAngleRad,
              edge.endAngleRad,
              !edge.ccw,
              maxCurveErrorWorld,
              maxCurveSegments
            );
            includeBoundaryError(arcResult);
            appendCurvePoints(arcResult.points, {
              curveId: `${sourceHandle}:HATCH:${loopIndex}:ARC:${edgeIndex}`,
              sourceHandle,
              sourceType: "ARC",
              center: edge.center,
              basisU: [edge.radius, 0],
              basisV: [0, edge.radius],
              startParam: edge.startAngleRad,
              endParam: edge.startAngleRad + sweep,
            }, undefined, arcResult.maxSagittaWorld);
          } else if (edge.type === "ELLIPSE") {
            const ellipseResult = this.tessellateEllipseWithBudget(
              edge.center,
              edge.majorAxisVector,
              edge.axisRatio,
              edge.startParam,
              edge.endParam,
              maxCurveErrorWorld,
              maxCurveSegments,
              edge.ccw
            );
            includeBoundaryError(ellipseResult);
            const ratio = Math.max(1e-6, Math.min(1, edge.axisRatio));
            const majorLength = Math.hypot(edge.majorAxisVector[0], edge.majorAxisVector[1]);
            const validEllipseSource =
              Number.isFinite(edge.center[0]) && Number.isFinite(edge.center[1]) &&
              Number.isFinite(edge.majorAxisVector[0]) && Number.isFinite(edge.majorAxisVector[1]) &&
              Number.isFinite(majorLength) && majorLength > 1e-9 &&
              Number.isFinite(edge.axisRatio) && edge.axisRatio > 0 && edge.axisRatio <= 1 &&
              Number.isFinite(edge.startParam) && Number.isFinite(edge.endParam);
            const sweep = ellipseSweep(edge.startParam, edge.endParam, edge.ccw);
            appendCurvePoints(ellipseResult.points, validEllipseSource ? {
              curveId: `${sourceHandle}:HATCH:${loopIndex}:ELLIPSE:${edgeIndex}`,
              sourceHandle,
              sourceType: "ELLIPSE",
              center: edge.center,
              basisU: edge.majorAxisVector,
              basisV: [-edge.majorAxisVector[1] * ratio, edge.majorAxisVector[0] * ratio],
              startParam: edge.startParam,
              endParam: edge.startParam + sweep,
            } : undefined, undefined, ellipseResult.maxSagittaWorld);
          } else if (edge.type === "SPLINE") {
            const splineResult = this.tessellateSplineWithBudget({
              type: "SPLINE",
              handle: hatch.handle || "hatch_spline",
              degree: edge.degree,
              controlPoints: edge.controlPoints,
              knots: edge.knots,
              weights: edge.weights,
              isPeriodic: edge.isPeriodic,
              isRational: edge.isRational,
              layer: hatch.layer,
              order: hatch.order,
            }, maxCurveErrorWorld, maxCurveSegments);
            includeBoundaryError(splineResult);
            if (splineResult.invalidInput) invalidCurveGeometry = true;
            if (splineResult.splineBezierSpans) {
              for (const span of splineResult.splineBezierSpans) {
                appendCurvePoints(span.points, {
                  curveId: `${sourceHandle}:HATCH:${loopIndex}:SPLINE:${edgeIndex}:SPAN:${span.spanIndex}`,
                  sourceHandle,
                  sourceType: "SPLINE",
                  center: span.source.controlPoints[0]!,
                  basisU: [1, 0],
                  basisV: [0, 1],
                  startParam: 0,
                  endParam: 1,
                  splineSource: span.source,
                }, span.parameters, splineResult.maxSagittaWorld);
              }
            } else {
              appendCurvePoints(splineResult.points, undefined, undefined, splineResult.maxSagittaWorld);
            }
          }
        }
      }

      // Eksik/uydurulmuş bir halka üretmemek için geçersiz spline içeren HATCH'i fail-closed tut.
      if (invalidCurveGeometry) return { mesh: null, boundaryLines: [], refinementLimitReached, invalidCurveGeometry, maxBoundaryTessellationErrorWorld };

      // Halka kapalıysa son tekrarlanan noktayı çıkar
      if (ring.length > 2) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-5) {
          ring.pop();
          ringCurveSources.pop();
          ringCurveErrors.pop();
        }
      }

      if (ring.length >= 3) {
        polygonRings.push(ring);
        polygonCurveSources.push(ringCurveSources);
        polygonCurveErrors.push(ringCurveErrors);
      }
    }

    if (polygonRings.length === 0) {
      return { mesh: null, boundaryLines, refinementLimitReached, invalidCurveGeometry, maxBoundaryTessellationErrorWorld };
    }

    // Döngü alanlarını hesapla (Shoelace formülü)
    function ringArea(ring: CadPoint2D[]): number {
      let area = 0;
      for (let i = 0; i < ring.length; i++) {
        const p1 = ring[i];
        const p2 = ring[(i + 1) % ring.length];
        area += p1[0] * p2[1] - p2[0] * p1[1];
      }
      return area / 2;
    }

    function pointInPolygon(pt: CadPoint2D, ring: CadPoint2D[]): boolean {
      let inside = false;
      const x = pt[0], y = pt[1];
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        const intersect = (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    }

    // Sınır çizgilerini topla
    for (let ringIndex = 0; ringIndex < polygonRings.length; ringIndex++) {
      const ring = polygonRings[ringIndex]!;
      const curveSources = polygonCurveSources[ringIndex]!;
      const curveErrors = polygonCurveErrors[ringIndex]!;
      for (let i = 0; i < ring.length; i++) {
        const p1 = ring[i];
        const p2 = ring[(i + 1) % ring.length];
        boundaryLines.push({
          x0: p1[0],
          y0: p1[1],
          x1: p2[0],
          y1: p2[1],
          layer: hatch.layer,
          order: hatch.order,
          curveSource: curveSources[i],
          ...(Number.isFinite(curveErrors[i]) ? { hatchBoundaryTessellationErrorWorld: curveErrors[i] } : {}),
        });
      }
    }

    // 2. Yuvalanma derinliklerini (nesting depth) ve doğrudan ebeveynleri hesapla
    const areas = polygonRings.map((r) => ringArea(r));
    const depths = new Array<number>(polygonRings.length).fill(0);
    const parents = new Array<number>(polygonRings.length).fill(-1);

    for (let i = 0; i < polygonRings.length; i++) {
      const ringI = polygonRings[i];
      const testPt: CadPoint2D = [
        (ringI[0][0] + ringI[1][0]) / 2,
        (ringI[0][1] + ringI[1][1]) / 2,
      ];
      let directParent = -1;
      let minParentArea = Infinity;

      for (let j = 0; j < polygonRings.length; j++) {
        if (i === j) continue;
        const absAreaJ = Math.abs(areas[j]);
        const absAreaI = Math.abs(areas[i]);
        if (absAreaJ > absAreaI && pointInPolygon(testPt, polygonRings[j])) {
          depths[i]++;
          if (absAreaJ < minParentArea) {
            minParentArea = absAreaJ;
            directParent = j;
          }
        }
      }
      parents[i] = directParent;
    }

    // 3. hatchStyle'a göre dış sınırlar ve delikleri grupla:
    // hatchStyle 0 (Normal): Çift derinlikler (0, 2, ...) dış sınır, doğrudan tek derinlikli çocuklar delik
    // hatchStyle 1 (Outer): Yalnız derinlik 0 dış sınır, derinlik 1 delik, derinlik >= 2 yok sayılır
    // hatchStyle 2 (Ignore): Yalnız derinlik 0 dış sınır, tüm delikler yok sayılır
    const style = hatch.hatchStyle ?? 0;
    const outerIndices: number[] = [];

    for (let i = 0; i < polygonRings.length; i++) {
      const d = depths[i];
      if (style === 0) {
        if (d % 2 === 0) outerIndices.push(i);
      } else if (style === 1) {
        if (d === 0) outerIndices.push(i);
      } else if (style === 2) {
        if (d === 0) outerIndices.push(i);
      }
    }

    const allTriangleCoords: number[] = [];

    for (const outerIdx of outerIndices) {
      const outerRing = [...polygonRings[outerIdx]];
      const holeIndicesForOuter: number[] = [];

      if (style === 0) {
        for (let j = 0; j < polygonRings.length; j++) {
          if (parents[j] === outerIdx && depths[j] === depths[outerIdx] + 1) {
            holeIndicesForOuter.push(j);
          }
        }
      } else if (style === 1) {
        for (let j = 0; j < polygonRings.length; j++) {
          if (parents[j] === outerIdx && depths[j] === 1) {
            holeIndicesForOuter.push(j);
          }
        }
      }

      // Dış sınır CCW (pozitif alan) olmalıdır
      if (ringArea(outerRing) < 0) outerRing.reverse();

      const flatCoords: number[] = [];
      const holeStartIndices: number[] = [];

      for (const pt of outerRing) {
        flatCoords.push(pt[0], pt[1]);
      }

      for (const hIdx of holeIndicesForOuter) {
        const holeRing = [...polygonRings[hIdx]];
        // Delikler CW (negatif alan) olmalıdır
        if (ringArea(holeRing) > 0) holeRing.reverse();
        holeStartIndices.push(flatCoords.length / 2);
        for (const pt of holeRing) {
          flatCoords.push(pt[0], pt[1]);
        }
      }

      const triangles = earcut(flatCoords, holeStartIndices, 2);
      if (triangles && triangles.length > 0) {
        for (let t = 0; t < triangles.length; t++) {
          const vIdx = triangles[t];
          allTriangleCoords.push(flatCoords[vIdx * 2], flatCoords[vIdx * 2 + 1]);
        }
      }
    }

    if (allTriangleCoords.length === 0) {
      return { mesh: null, boundaryLines, refinementLimitReached, invalidCurveGeometry, maxBoundaryTessellationErrorWorld };
    }

    const meshVerts = new Float64Array(allTriangleCoords);
    const mesh: CompiledTriangleMesh = {
      vertices: meshVerts,
      layer: hatch.layer,
      order: hatch.order,
      alpha: 1,
    };

    return { mesh, boundaryLines, refinementLimitReached, invalidCurveGeometry, maxBoundaryTessellationErrorWorld };
  }

  /**
   * 8. WIPEOUT Üçgenleme
   */
  public static triangulateWipeout(wipeout: CadWipeoutEntity): CompiledTriangleMesh | null {
    const v = wipeout.vertices;
    if (!v || v.length < 3) return null;

    const flatCoords: number[] = [];
    for (const pt of v) {
      flatCoords.push(pt[0], pt[1]);
    }

    const triangles = earcut(flatCoords, null, 2);
    if (!triangles || triangles.length === 0) return null;

    const meshVerts = new Float64Array(triangles.length * 2);
    for (let i = 0; i < triangles.length; i++) {
      const idx = triangles[i];
      meshVerts[i * 2] = flatCoords[idx * 2];
      meshVerts[i * 2 + 1] = flatCoords[idx * 2 + 1];
    }

    return {
      vertices: meshVerts,
      layer: wipeout.layer,
      order: wipeout.order,
      isWipeout: true,
      alpha: 1,
    };
  }

  /**
   * 9. Linetype (Çizgi Tipi) Faz Sürekliliği
   * Poligonal yol boyunca pattern adımlarını kümülatif mesafe ile böler.
   */
  public static applyLinetype(
    points: CadPoint2D[],
    pattern: number[],
    scale = 1.0,
    initialPhase = 0
  ): { segments: Array<{ x0: number; y0: number; x1: number; y1: number }>; finalPhase: number } {
    if (!pattern || pattern.length === 0 || points.length < 2) {
      const segs: Array<{ x0: number; y0: number; x1: number; y1: number }> = [];
      for (let i = 0; i < points.length - 1; i++) {
        segs.push({
          x0: points[i][0],
          y0: points[i][1],
          x1: points[i + 1][0],
          y1: points[i + 1][1],
        });
      }
      return { segments: segs, finalPhase: initialPhase };
    }

    const scaledPattern = pattern.map((p) => p * Math.max(1e-4, scale));
    const totalPatternLen = scaledPattern.reduce((acc, p) => acc + Math.abs(p), 0);
    if (totalPatternLen <= 1e-6) {
      return { segments: [], finalPhase: initialPhase };
    }

    let patternIdx = 0;
    let currentPhase = initialPhase % totalPatternLen;
    if (currentPhase < 0) currentPhase += totalPatternLen;

    // Fazın denk geldiği pattern elemanını ve kalan uzunluğunu bul
    let accumulated = 0;
    for (let i = 0; i < scaledPattern.length; i++) {
      const elLen = Math.abs(scaledPattern[i]);
      if (accumulated + elLen > currentPhase) {
        patternIdx = i;
        break;
      }
      accumulated += elLen;
    }

    const segments: Array<{ x0: number; y0: number; x1: number; y1: number }> = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const segLen = Math.hypot(dx, dy);
      if (segLen <= 1e-9) continue;

      const dirX = dx / segLen;
      const dirY = dy / segLen;
      let distCovered = 0;

      while (distCovered < segLen) {
        const elValue = scaledPattern[patternIdx];
        const elLen = Math.abs(elValue);
        const elRemaining = elLen - (currentPhase - accumulated);
        const step = Math.min(segLen - distCovered, elRemaining);

        const startX = p1[0] + dirX * distCovered;
        const startY = p1[1] + dirY * distCovered;
        const endX = p1[0] + dirX * (distCovered + step);
        const endY = p1[1] + dirY * (distCovered + step);

        // Pozitif değer çizgi (dash), negatif değer boşluk (gap)
        if (elValue > 0) {
          segments.push({ x0: startX, y0: startY, x1: endX, y1: endY });
        }

        distCovered += step;
        currentPhase += step;

        if (currentPhase >= accumulated + elLen - 1e-6) {
          patternIdx = (patternIdx + 1) % scaledPattern.length;
          accumulated = (accumulated + elLen) % totalPatternLen;
          if (patternIdx === 0) {
            currentPhase = 0;
            accumulated = 0;
          }
        }
      }
    }

    return { segments, finalPhase: currentPhase };
  }
}
