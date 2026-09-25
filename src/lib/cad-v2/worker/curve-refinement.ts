/**
 * Pure, bounded analytic-curve evaluator used by the CAD V2 worker.
 * No DOM, Three.js, Node.js, or renderer state is read here.
 */

export interface CurveSourceRef {
  curveId: string;
  sourceHandle: string;
  sourceType: "CIRCLE" | "ARC" | "ELLIPSE" | "BULGE" | "SPLINE";
  firstSegmentIndex: number;
  segmentCount: number;
  curveRecordIndex: number;
  firstVertex: number;
  vertexCount: number;
  /** Conservative source-vs-F32 affine CURVE_DATA error, in world units. */
  sourceQuantizationErrorWorld?: number;
  /** One exact rational Bezier knot span, stored once in the chunk META sidecar. */
  splineSource?: { controlPoints: Array<[number, number]>; weights: number[] };
}

export interface CurveRefinementOptions {
  curveData: Float32Array;
  curveSourceRefs: readonly CurveSourceRef[];
  fallbackVertexCount: number;
  targetErrorCssPixels: number;
  unitsPerCssPixel: number;
  maxTransformSingularValue: number;
  maxSegmentsPerInterval?: number;
  maxSegmentsTotal?: number;
}

export interface RefinedCurveInterval {
  curveId: string;
  sourceHandle: string;
  sourceType: "CIRCLE" | "ARC" | "ELLIPSE" | "BULGE" | "SPLINE";
  firstVertex: number;
  vertexCount: number;
  firstSegmentIndex: number;
  sourceSegmentCount: number;
  coordinates: Float32Array | null;
  segmentCount: number;
  requestedErrorCssPixels: number;
  conservativeErrorCssPixels: number;
  errorBoundMet: boolean;
  status: "refined" | "degraded";
  reason?: "segment-cap" | "float32-precision";
}

export interface CurveRefinementResult {
  intervals: RefinedCurveInterval[];
  totalSegments: number;
  totalOutputBytes: number;
  errorBoundMet: boolean;
}

const RECORD_STRIDE = 8;
const DEFAULT_MAX_SEGMENTS_PER_INTERVAL = 4096;
const DEFAULT_MAX_SEGMENTS_TOTAL = 65_536;
const MAX_INTERVALS = 50_000;
const FLOAT32_UNIT_ROUNDOFF = 2 ** -24;
const MAX_SPLINE_BEZIER_DEGREE = 16;

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isRationalBezierSource(value: CurveSourceRef["splineSource"]): value is NonNullable<CurveSourceRef["splineSource"]> {
  return !!value && Array.isArray(value.controlPoints) && Array.isArray(value.weights) &&
    value.controlPoints.length >= 2 && value.controlPoints.length <= MAX_SPLINE_BEZIER_DEGREE + 1 &&
    value.weights.length === value.controlPoints.length &&
    value.controlPoints.every((point, index) => Array.isArray(point) && point.length === 2 &&
      Number.isFinite(point[0]) && Number.isFinite(point[1]) &&
      Number.isFinite(point[0] * value.weights[index]!) &&
      Number.isFinite(point[1] * value.weights[index]!)) &&
    value.weights.every((weight) => finitePositive(weight));
}

/** Largest singular value of the 2x2 basis matrix [[ux,vx],[uy,vy]]. */
function basisMaxScale(ux: number, uy: number, vx: number, vy: number): number {
  const sumSquares = ux * ux + uy * uy + vx * vx + vy * vy;
  const determinant = ux * vy - uy * vx;
  const discriminant = Math.max(0, sumSquares * sumSquares - 4 * determinant * determinant);
  return Math.sqrt(Math.max(0, (sumSquares + Math.sqrt(discriminant)) / 2));
}

function validateOptions(options: CurveRefinementOptions): void {
  if (!options || !(options.curveData instanceof Float32Array)) {
    throw new TypeError("Curve refinement requires Float32 CURVE_DATA");
  }
  if (options.curveData.length % RECORD_STRIDE !== 0) {
    throw new Error("CURVE_DATA length is not divisible by its eight-float record stride");
  }
  if (!Array.isArray(options.curveSourceRefs) || options.curveSourceRefs.length > MAX_INTERVALS) {
    throw new Error(`Curve source reference count exceeds limit (${MAX_INTERVALS})`);
  }
  if (!finitePositive(options.targetErrorCssPixels) ||
      !finitePositive(options.unitsPerCssPixel) ||
      !finitePositive(options.maxTransformSingularValue)) {
    throw new RangeError("Curve refinement screen budget fields must be finite and positive");
  }
  if (!Number.isSafeInteger(options.fallbackVertexCount) || options.fallbackVertexCount < 0) {
    throw new RangeError("Fallback vertex count must be a non-negative safe integer");
  }
  for (const [name, cap] of [
    ["maxSegmentsPerInterval", options.maxSegmentsPerInterval ?? DEFAULT_MAX_SEGMENTS_PER_INTERVAL],
    ["maxSegmentsTotal", options.maxSegmentsTotal ?? DEFAULT_MAX_SEGMENTS_TOTAL],
  ] as const) {
    if (!Number.isSafeInteger(cap) || cap < 1 || cap > DEFAULT_MAX_SEGMENTS_TOTAL) {
      throw new RangeError(`${name} must be an integer in [1, ${DEFAULT_MAX_SEGMENTS_TOTAL}]`);
    }
  }
  for (let index = 0; index < options.curveData.length; index++) {
    if (!Number.isFinite(options.curveData[index])) {
      throw new Error(`CURVE_DATA contains a non-finite value at index ${index}`);
    }
  }
}

/**
 * Tessellates each validated source span with a conservative affine-ellipse
 * interpolation bound. `maxTransformSingularValue` represents transforms
 * downstream of the source basis; DPR is intentionally absent because the
 * contract is in CSS pixels.
 */
export function refineCurveSourceIntervals(options: CurveRefinementOptions): CurveRefinementResult {
  validateOptions(options);
  const maxSegmentsPerInterval = options.maxSegmentsPerInterval ?? DEFAULT_MAX_SEGMENTS_PER_INTERVAL;
  const maxSegmentsTotal = options.maxSegmentsTotal ?? DEFAULT_MAX_SEGMENTS_TOTAL;
  const recordCount = options.curveData.length / RECORD_STRIDE;
  const seenRecords = new Set<number>();
  const ranges: Array<[number, number]> = [];

  for (const ref of options.curveSourceRefs) {
    if (!ref || typeof ref.curveId !== "string" || !ref.curveId ||
        typeof ref.sourceHandle !== "string" || !ref.sourceHandle ||
        (ref.sourceType !== "CIRCLE" && ref.sourceType !== "ARC" && ref.sourceType !== "ELLIPSE" &&
          ref.sourceType !== "BULGE" && ref.sourceType !== "SPLINE")) {
      throw new Error("CURVE_DATA reference has invalid source identity");
    }
    if (ref.sourceType === "SPLINE" ? !isRationalBezierSource(ref.splineSource) : ref.splineSource !== undefined) {
      throw new Error("CURVE_DATA reference has an invalid rational Bezier source");
    }
    if (ref.sourceQuantizationErrorWorld !== undefined &&
        (typeof ref.sourceQuantizationErrorWorld !== "number" ||
          !Number.isFinite(ref.sourceQuantizationErrorWorld) || ref.sourceQuantizationErrorWorld < 0)) {
      throw new Error("CURVE_DATA reference has an invalid source quantization error");
    }
    if (!Number.isSafeInteger(ref.curveRecordIndex) || ref.curveRecordIndex < 0 || ref.curveRecordIndex >= recordCount ||
        !Number.isSafeInteger(ref.firstVertex) || ref.firstVertex < 0 ||
        !Number.isSafeInteger(ref.vertexCount) || ref.vertexCount < 2 || ref.vertexCount % 2 !== 0 ||
        ref.firstVertex + ref.vertexCount > options.fallbackVertexCount ||
        !Number.isSafeInteger(ref.firstSegmentIndex) || ref.firstSegmentIndex < 0 ||
        !Number.isSafeInteger(ref.segmentCount) || ref.segmentCount < 1 || ref.vertexCount !== ref.segmentCount * 2) {
      throw new Error("CURVE_DATA reference has an invalid record or fallback vertex range");
    }
    if (seenRecords.has(ref.curveRecordIndex)) throw new Error("CURVE_DATA record is referenced more than once");
    seenRecords.add(ref.curveRecordIndex);
    ranges.push([ref.firstVertex, ref.firstVertex + ref.vertexCount]);
  }
  if (seenRecords.size !== recordCount) throw new Error("CURVE_DATA contains an unreferenced analytic record");
  ranges.sort((a, b) => a[0] - b[0]);
  for (let index = 1; index < ranges.length; index++) {
    if (ranges[index]![0] < ranges[index - 1]![1]) throw new Error("CURVE_DATA fallback vertex ranges overlap");
  }

  const intervals: RefinedCurveInterval[] = [];
  let totalSegments = 0;
  for (const ref of options.curveSourceRefs) {
    const { splineSource: _splineSource, ...intervalRef } = ref;
    const base = ref.curveRecordIndex * RECORD_STRIDE;
    const cx = options.curveData[base]!;
    const cy = options.curveData[base + 1]!;
    const ux = options.curveData[base + 2]!;
    const uy = options.curveData[base + 3]!;
    const vx = options.curveData[base + 4]!;
    const vy = options.curveData[base + 5]!;
    const start = options.curveData[base + 6]!;
    const end = options.curveData[base + 7]!;
    if (!(end > start) && !(end < start)) throw new Error("CURVE_DATA parameter interval must have non-zero sweep");
    if (ref.sourceType !== "SPLINE" && ux === 0 && uy === 0 && vx === 0 && vy === 0) {
      throw new Error("CURVE_DATA basis must not be degenerate");
    }

    const downstreamScale = options.maxTransformSingularValue;
    const desiredWorldError = options.targetErrorCssPixels * options.unitsPerCssPixel / downstreamScale;
    if (ref.sourceType === "SPLINE") {
      const source = ref.splineSource!;
      const homogeneous = source.controlPoints.map((point, index) => [
        point[0] * source.weights[index]!, point[1] * source.weights[index]!, source.weights[index]!,
      ] as [number, number, number]);
      const toEuclidean = (point: readonly [number, number, number]): [number, number] => [point[0] / point[2], point[1] / point[2]];
      const distanceToSegment = (point: readonly [number, number], first: readonly [number, number], last: readonly [number, number]): number => {
        const dx = last[0] - first[0];
        const dy = last[1] - first[1];
        const lengthSquared = dx * dx + dy * dy;
        const t = lengthSquared <= Number.EPSILON ? 0 : Math.max(0, Math.min(1,
          ((point[0] - first[0]) * dx + (point[1] - first[1]) * dy) / lengthSquared));
        return Math.hypot(point[0] - first[0] - t * dx, point[1] - first[1] - t * dy);
      };
      const splitBezier = (control: Array<[number, number, number]>): [Array<[number, number, number]>, Array<[number, number, number]>] => {
        const levels: Array<Array<[number, number, number]>> = [control.map((point) => [...point] as [number, number, number])];
        while (levels[levels.length - 1]!.length > 1) {
          const previous = levels[levels.length - 1]!;
          const next: Array<[number, number, number]> = [];
          for (let index = 0; index + 1 < previous.length; index++) {
            next.push([
              (previous[index]![0] + previous[index + 1]![0]) / 2,
              (previous[index]![1] + previous[index + 1]![1]) / 2,
              (previous[index]![2] + previous[index + 1]![2]) / 2,
            ]);
          }
          levels.push(next);
        }
        return [
          levels.map((level) => level[0]!),
          levels.map((level) => level[level.length - 1]!).reverse(),
        ];
      };
      const first = toEuclidean(homogeneous[0]!);
      let coordinateMagnitude = 1;
      for (const point of source.controlPoints) {
        coordinateMagnitude = Math.max(coordinateMagnitude, Math.abs(point[0]), Math.abs(point[1]));
      }
      const quantizationWorldError = Math.SQRT2 * coordinateMagnitude * FLOAT32_UNIT_ROUNDOFF +
        (ref.sourceQuantizationErrorWorld ?? 0);
      const availableWorldError = desiredWorldError - quantizationWorldError;
      if (!(availableWorldError > 0)) {
        intervals.push({
          ...intervalRef,
          sourceSegmentCount: ref.segmentCount,
          coordinates: null,
          segmentCount: 0,
          requestedErrorCssPixels: options.targetErrorCssPixels,
          conservativeErrorCssPixels: quantizationWorldError * downstreamScale / options.unitsPerCssPixel,
          errorBoundMet: false,
          status: "degraded",
          reason: "float32-precision",
        });
        continue;
      }
      const remainingBudget = Math.max(0, maxSegmentsTotal - totalSegments);
      const segmentLimit = Math.min(maxSegmentsPerInterval, remainingBudget);
      const coordinates: number[] = [first[0], first[1]];
      let segmentCount = 0;
      let maximumDeviation = 0;
      let capped = segmentLimit < 1;
      const refineBezier = (control: Array<[number, number, number]>, depth: number): void => {
        if (capped) return;
        const startPoint = toEuclidean(control[0]!);
        const endPoint = toEuclidean(control[control.length - 1]!);
        let deviation = 0;
        for (const point of control) deviation = Math.max(deviation, distanceToSegment(toEuclidean(point), startPoint, endPoint));
        if (deviation <= availableWorldError) {
          if (segmentCount >= segmentLimit) {
            capped = true;
            return;
          }
          segmentCount++;
          maximumDeviation = Math.max(maximumDeviation, deviation);
          coordinates.push(endPoint[0], endPoint[1]);
          return;
        }
        if (depth >= 32 || segmentCount >= segmentLimit) {
          capped = true;
          return;
        }
        const [left, right] = splitBezier(control);
        refineBezier(left, depth + 1);
        refineBezier(right, depth + 1);
      };
      refineBezier(homogeneous, 0);
      if (capped) {
        intervals.push({
          ...intervalRef,
          sourceSegmentCount: ref.segmentCount,
          coordinates: null,
          segmentCount: 0,
          requestedErrorCssPixels: options.targetErrorCssPixels,
          conservativeErrorCssPixels: Number.POSITIVE_INFINITY,
          errorBoundMet: false,
          status: "degraded",
          reason: "segment-cap",
        });
        continue;
      }
      const coordinateArray = new Float32Array(coordinates);
      let finiteCoordinates = true;
      for (let index = 0; index < coordinateArray.length; index++) {
        if (!Number.isFinite(coordinateArray[index])) {
          finiteCoordinates = false;
          break;
        }
      }
      if (!finiteCoordinates) {
        intervals.push({
          ...intervalRef,
          sourceSegmentCount: ref.segmentCount,
          coordinates: null,
          segmentCount: 0,
          requestedErrorCssPixels: options.targetErrorCssPixels,
          conservativeErrorCssPixels: Number.POSITIVE_INFINITY,
          errorBoundMet: false,
          status: "degraded",
          reason: "float32-precision",
        });
        continue;
      }
      const conservativeErrorCssPixels = (maximumDeviation + quantizationWorldError) * downstreamScale / options.unitsPerCssPixel;
      const errorBoundMet = conservativeErrorCssPixels <= options.targetErrorCssPixels * (1 + 1e-12);
      intervals.push({
        ...intervalRef,
        sourceSegmentCount: ref.segmentCount,
        coordinates: coordinateArray,
        segmentCount,
        requestedErrorCssPixels: options.targetErrorCssPixels,
        conservativeErrorCssPixels,
        errorBoundMet,
        status: errorBoundMet ? "refined" : "degraded",
        ...(!errorBoundMet ? { reason: "segment-cap" as const } : {}),
      });
      totalSegments += segmentCount;
      continue;
    }
    const basisScale = basisMaxScale(ux, uy, vx, vy);
    const coordinateMagnitude = Math.max(
      Math.abs(cx) + Math.abs(ux) + Math.abs(vx),
      Math.abs(cy) + Math.abs(uy) + Math.abs(vy),
      1,
    );
    if (!finitePositive(basisScale) || !finitePositive(desiredWorldError) || !Number.isFinite(coordinateMagnitude)) {
      throw new Error("CURVE_DATA produces an unbounded basis or screen-space tolerance");
    }
    // Bound output Float32 rounding in chunk-local coordinates before allocating points.
    const quantizationWorldError = Math.SQRT2 * coordinateMagnitude * FLOAT32_UNIT_ROUNDOFF +
      (ref.sourceQuantizationErrorWorld ?? 0);
    const availableWorldError = desiredWorldError - quantizationWorldError;
    const availableCssError = availableWorldError * downstreamScale / options.unitsPerCssPixel;
    if (!(availableWorldError > 0)) {
      intervals.push({
        ...intervalRef,
        sourceSegmentCount: ref.segmentCount,
        coordinates: null,
        segmentCount: 0,
        requestedErrorCssPixels: options.targetErrorCssPixels,
        conservativeErrorCssPixels: quantizationWorldError * downstreamScale / options.unitsPerCssPixel,
        errorBoundMet: false,
        status: "degraded",
        reason: "float32-precision",
      });
      continue;
    }

    // Linear interpolation error is bounded by max|P''| * Δt² / 8.
    const sweep = Math.abs(end - start);
    const requestedSegments = Math.max(1, Math.ceil(sweep * Math.sqrt(basisScale / (8 * availableWorldError))));
    const remainingBudget = Math.max(0, maxSegmentsTotal - totalSegments);
    const actualSegments = Math.min(requestedSegments, maxSegmentsPerInterval, remainingBudget);
    if (actualSegments < 1) {
      intervals.push({
        ...intervalRef,
        sourceSegmentCount: ref.segmentCount,
        coordinates: null,
        segmentCount: 0,
        requestedErrorCssPixels: options.targetErrorCssPixels,
        conservativeErrorCssPixels: Number.POSITIVE_INFINITY,
        errorBoundMet: false,
        status: "degraded",
        reason: "segment-cap",
      });
      continue;
    }

    const coordinates = new Float32Array((actualSegments + 1) * 2);
    for (let pointIndex = 0; pointIndex <= actualSegments; pointIndex++) {
      const t = start + (end - start) * pointIndex / actualSegments;
      const x = cx + ux * Math.cos(t) + vx * Math.sin(t);
      const y = cy + uy * Math.cos(t) + vy * Math.sin(t);
      coordinates[pointIndex * 2] = x;
      coordinates[pointIndex * 2 + 1] = y;
    }
    let finiteCoordinates = true;
    for (let index = 0; index < coordinates.length; index++) {
      if (!Number.isFinite(coordinates[index])) {
        finiteCoordinates = false;
        break;
      }
    }
    if (!finiteCoordinates) {
      intervals.push({
        ...intervalRef,
        sourceSegmentCount: ref.segmentCount,
        coordinates: null,
        segmentCount: 0,
        requestedErrorCssPixels: options.targetErrorCssPixels,
        conservativeErrorCssPixels: Number.POSITIVE_INFINITY,
        errorBoundMet: false,
        status: "degraded",
        reason: "float32-precision",
      });
      continue;
    }
    const measuredBoundWorld = basisScale * (sweep / actualSegments) ** 2 / 8 + quantizationWorldError;
    const conservativeErrorCssPixels = measuredBoundWorld * downstreamScale / options.unitsPerCssPixel;
    const errorBoundMet = requestedSegments <= maxSegmentsPerInterval &&
      actualSegments >= requestedSegments && totalSegments + actualSegments <= maxSegmentsTotal &&
      conservativeErrorCssPixels <= options.targetErrorCssPixels * (1 + 1e-12);
    intervals.push({
      ...intervalRef,
      sourceSegmentCount: ref.segmentCount,
      coordinates,
      segmentCount: actualSegments,
      requestedErrorCssPixels: options.targetErrorCssPixels,
      conservativeErrorCssPixels,
      errorBoundMet,
      status: errorBoundMet ? "refined" : "degraded",
      ...(!errorBoundMet ? { reason: "segment-cap" as const } : {}),
    });
    totalSegments += actualSegments;
  }

  const errorBoundMet = intervals.every((interval) => interval.errorBoundMet);
  const totalOutputBytes = intervals.reduce((sum, interval) => sum + (interval.coordinates?.byteLength ?? 0), 0);
  return { intervals, totalSegments, totalOutputBytes, errorBoundMet };
}
