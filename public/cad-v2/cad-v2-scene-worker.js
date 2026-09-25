var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/lib/cad-v2/protocol/binary-protocol.ts
var SCENE_MAGIC = "DV2SCN01";
var SCENE_SCHEMA_VERSION = 1;
var HEADER_BYTE_LENGTH = 32;
var SECTION_ENTRY_BYTE_LENGTH = 32;
var MAX_CHUNK_BYTE_LENGTH = 2 * 1024 * 1024;
var MAX_DECODED_ALLOCATION_BYTES = 8 * 1024 * 1024;
var SCALAR_SIZE_MAP = {
  [1 /* U8 */]: 1,
  [2 /* U16 */]: 2,
  [3 /* U32 */]: 4,
  [4 /* F32 */]: 4,
  [5 /* F64 */]: 8
};
var SCENE_TAG_SPECIFICATIONS = Object.freeze({
  [1 /* META */]: { tag: 1 /* META */, name: "META", scalarType: 1 /* U8 */, componentCount: 1, isRequired: true, description: "JSON metadata (layerRuns, chunkIndex, layoutId)" },
  [2 /* ORIGIN */]: { tag: 2 /* ORIGIN */, name: "ORIGIN", scalarType: 5 /* F64 */, componentCount: 2, isRequired: true, description: "Float64 chunk world origin [Ox, Oy]" },
  [3 /* XY */]: { tag: 3 /* XY */, name: "XY", scalarType: 4 /* F32 */, componentCount: 2, isRequired: true, description: "Float32 camera-relative vertex buffer (strokes, lines)" },
  [4 /* TRIANGLES */]: { tag: 4 /* TRIANGLES */, name: "TRIANGLES", scalarType: 4 /* F32 */, componentCount: 2, isRequired: false, description: "Float32 triangle mesh vertex buffer (solid hatches, wipeouts)" },
  [5 /* INSTANCE */]: { tag: 5 /* INSTANCE */, name: "INSTANCE", scalarType: 4 /* F32 */, componentCount: 6, isRequired: false, description: "Affine transform instances" },
  [6 /* CURVE_DATA */]: { tag: 6 /* CURVE_DATA */, name: "CURVE_DATA", scalarType: 4 /* F32 */, componentCount: 8, isRequired: false, description: "Analytic curve parameters" },
  [7 /* GLYPH_DATA */]: { tag: 7 /* GLYPH_DATA */, name: "GLYPH_DATA", scalarType: 4 /* F32 */, componentCount: 4, isRequired: false, description: "Text glyph instance descriptors" },
  [8 /* SOURCE_STRINGS */]: { tag: 8 /* SOURCE_STRINGS */, name: "SOURCE_STRINGS", scalarType: 1 /* U8 */, componentCount: 1, isRequired: false, description: "UTF-8 strings payload" },
  [9 /* DRAW_RUNS */]: { tag: 9 /* DRAW_RUNS */, name: "DRAW_RUNS", scalarType: 3 /* U32 */, componentCount: 8, isRequired: false, description: "Sequential painter's draw run commands" },
  [10 /* PATH_DISTANCE */]: { tag: 10 /* PATH_DISTANCE */, name: "PATH_DISTANCE", scalarType: 4 /* F32 */, componentCount: 1, isRequired: false, description: "Cumulative stroke path distances" },
  [11 /* CLIP_DATA */]: { tag: 11 /* CLIP_DATA */, name: "CLIP_DATA", scalarType: 4 /* F32 */, componentCount: 4, isRequired: false, description: "Viewport & XCLIP boundaries" },
  [12 /* STROKE_DATA */]: { tag: 12 /* STROKE_DATA */, name: "STROKE_DATA", scalarType: 4 /* F32 */, componentCount: 2, isRequired: false, description: "Width and dash stroke data" },
  [13 /* UV */]: { tag: 13 /* UV */, name: "UV", scalarType: 4 /* F32 */, componentCount: 2, isRequired: false, description: "Texture UV coordinates" }
});
function parseSceneChunk(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength < HEADER_BYTE_LENGTH) {
    throw new Error(`[SceneProtocol] Ge\xE7ersiz chunk boyutu: ${bytes.byteLength} < ${HEADER_BYTE_LENGTH}`);
  }
  const magic = new TextDecoder().decode(bytes.subarray(0, 8));
  if (magic !== SCENE_MAGIC) {
    throw new Error(`[SceneProtocol] Ge\xE7ersiz magic: beklenen ${SCENE_MAGIC}, al\u0131nan: ${magic}`);
  }
  const schemaVersion = dataView.getUint32(8, true);
  if (schemaVersion !== SCENE_SCHEMA_VERSION) {
    throw new Error(`[SceneProtocol] Desteklenmeyen \u015Fema s\xFCr\xFCm\xFC: ${schemaVersion}`);
  }
  const totalByteLength = dataView.getUint32(12, true);
  if (totalByteLength !== bytes.byteLength) {
    throw new Error(
      `[SceneProtocol] Byte uzunlu\u011Fu uyu\u015Fmazl\u0131\u011F\u0131: header ${totalByteLength} !== buffer ${bytes.byteLength}`
    );
  }
  if (totalByteLength > MAX_DECODED_ALLOCATION_BYTES) {
    throw new Error(
      `[SceneProtocol] Chunk boyutu savunma s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor: ${totalByteLength} > ${MAX_DECODED_ALLOCATION_BYTES}`
    );
  }
  const sectionCount = dataView.getUint32(16, true);
  const sectionTableOffset = dataView.getUint32(20, true);
  const headerBytes = dataView.getUint32(24, true);
  if (sectionTableOffset !== HEADER_BYTE_LENGTH || headerBytes !== HEADER_BYTE_LENGTH) {
    throw new Error(`[SceneProtocol] Ge\xE7ersiz header ofset veya boyutu`);
  }
  const tableEnd = sectionTableOffset + sectionCount * SECTION_ENTRY_BYTE_LENGTH;
  if (tableEnd > totalByteLength) {
    throw new Error(`[SceneProtocol] Section tablosu chunk s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor: ${tableEnd} > ${totalByteLength}`);
  }
  const sections = /* @__PURE__ */ new Map();
  const seenTags = /* @__PURE__ */ new Set();
  for (let i = 0; i < sectionCount; i++) {
    const entryOffset = sectionTableOffset + i * SECTION_ENTRY_BYTE_LENGTH;
    const tag = dataView.getUint32(entryOffset, true);
    const scalarType = dataView.getUint16(entryOffset + 4, true);
    const componentCount = dataView.getUint16(entryOffset + 6, true);
    const elementCount = dataView.getUint32(entryOffset + 8, true);
    const byteOffset = dataView.getUint32(entryOffset + 12, true);
    const byteLength = dataView.getUint32(entryOffset + 16, true);
    const strideBytes = dataView.getUint32(entryOffset + 20, true);
    const flags = dataView.getUint32(entryOffset + 24, true);
    const reserved = dataView.getUint32(entryOffset + 28, true);
    if (seenTags.has(tag)) {
      throw new Error(`[SceneProtocol] Yinelenen section tag: ${tag}`);
    }
    seenTags.add(tag);
    const scalarSize = SCALAR_SIZE_MAP[scalarType];
    if (!scalarSize) {
      throw new Error(`[SceneProtocol] Bilinmeyen scalarType: ${scalarType}`);
    }
    const expectedStride = componentCount * scalarSize;
    if (strideBytes !== expectedStride) {
      throw new Error(
        `[SceneProtocol] Ge\xE7ersiz stride: tag ${tag}, beklenen ${expectedStride}, al\u0131nan ${strideBytes}`
      );
    }
    const expectedLength = elementCount * strideBytes;
    if (byteLength !== expectedLength) {
      throw new Error(
        `[SceneProtocol] Ge\xE7ersiz byteLength: tag ${tag}, beklenen ${expectedLength}, al\u0131nan ${byteLength}`
      );
    }
    if (byteOffset % 8 !== 0) {
      throw new Error(`[SceneProtocol] Section offset 8-byte hizal\u0131 de\u011Fil: tag ${tag}, offset ${byteOffset}`);
    }
    if (byteOffset < tableEnd || byteOffset + byteLength > totalByteLength) {
      throw new Error(
        `[SceneProtocol] Section aral\u0131\u011F\u0131 chunk s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor: tag ${tag}, [${byteOffset}..${byteOffset + byteLength}]`
      );
    }
    let view;
    const subOffset = bytes.byteOffset + byteOffset;
    switch (scalarType) {
      case 1 /* U8 */:
        view = new Uint8Array(bytes.buffer, subOffset, byteLength);
        break;
      case 2 /* U16 */:
        view = new Uint16Array(bytes.buffer, subOffset, byteLength / 2);
        break;
      case 3 /* U32 */:
        view = new Uint32Array(bytes.buffer, subOffset, byteLength / 4);
        break;
      case 4 /* F32 */:
        view = new Float32Array(bytes.buffer, subOffset, byteLength / 4);
        break;
      case 5 /* F64 */:
        view = new Float64Array(bytes.buffer, subOffset, byteLength / 8);
        break;
    }
    sections.set(tag, {
      header: {
        tag,
        scalarType,
        componentCount,
        elementCount,
        byteOffset,
        byteLength,
        strideBytes,
        flags,
        reserved
      },
      data: view
    });
  }
  const originSec = sections.get(2 /* ORIGIN */);
  if (originSec && originSec.data instanceof Float64Array) {
    for (let i = 0; i < originSec.data.length; i++) {
      if (!Number.isFinite(originSec.data[i])) {
        throw new Error(`[SceneProtocol] ORIGIN i\xE7inde ge\xE7ersiz non-finite koordinat: index ${i}`);
      }
    }
  }
  let totalVertices = 0;
  const xySec = sections.get(3 /* XY */);
  if (xySec && xySec.data instanceof Float32Array) {
    totalVertices = xySec.data.length / 2;
    for (let i = 0; i < xySec.data.length; i++) {
      if (!Number.isFinite(xySec.data[i])) {
        throw new Error(`[SceneProtocol] XY koordinat dizisinde non-finite (NaN/Infinity) de\u011Fer: index ${i}`);
      }
    }
  }
  let totalTriVertices = 0;
  const triSec = sections.get(4 /* TRIANGLES */);
  if (triSec && triSec.data instanceof Float32Array) {
    totalTriVertices = triSec.data.length / 2;
    for (let i = 0; i < triSec.data.length; i++) {
      if (!Number.isFinite(triSec.data[i])) {
        throw new Error(`[SceneProtocol] TRIANGLES i\xE7inde non-finite (NaN/Infinity) de\u011Fer: index ${i}`);
      }
    }
  }
  const curveSec = sections.get(6 /* CURVE_DATA */);
  if (curveSec) {
    if (curveSec.header.scalarType !== 4 /* F32 */ || curveSec.header.componentCount !== 8) {
      throw new Error("[SceneProtocol] CURVE_DATA section must contain fixed eight-component F32 records");
    }
    const curveData = curveSec.data;
    for (let i = 0; i < curveData.length; i++) {
      if (!Number.isFinite(curveData[i])) {
        throw new Error(`[SceneProtocol] CURVE_DATA i\xE7inde non-finite e\u011Fri parametresi: index ${i}`);
      }
    }
  }
  const pathDistSec = sections.get(10 /* PATH_DISTANCE */);
  if (pathDistSec && pathDistSec.data instanceof Float32Array) {
    if (totalVertices > 0 && pathDistSec.data.length !== totalVertices) {
      throw new Error(
        `[SceneProtocol] PATH_DISTANCE eleman say\u0131s\u0131 XY vertex say\u0131s\u0131 ile uyu\u015Fmuyor: ${pathDistSec.data.length} !== ${totalVertices}`
      );
    }
    for (let i = 0; i < pathDistSec.data.length; i++) {
      if (!Number.isFinite(pathDistSec.data[i])) {
        throw new Error(`[SceneProtocol] PATH_DISTANCE i\xE7inde non-finite (NaN/Infinity) de\u011Fer: index ${i}`);
      }
    }
  }
  const drawRunsSec = sections.get(9 /* DRAW_RUNS */);
  if (drawRunsSec && drawRunsSec.data instanceof Uint32Array) {
    const runsArray = drawRunsSec.data;
    const runCount = runsArray.length / 8;
    for (let r = 0; r < runCount; r++) {
      const primitiveKind = runsArray[r * 8];
      const firstEl = runsArray[r * 8 + 1];
      const elCount = runsArray[r * 8 + 2];
      const isTriKind = primitiveKind === 1 /* TRIANGLES */ || primitiveKind === 6 /* WIPEOUT */;
      const maxLimit = isTriKind ? totalTriVertices : totalVertices;
      if (maxLimit > 0 && firstEl + elCount > maxLimit) {
        throw new Error(
          `[SceneProtocol] DRAW_RUNS aral\u0131\u011F\u0131 vertex s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor: run ${r} (kind ${primitiveKind}), [${firstEl}..${firstEl + elCount}] > ${maxLimit}`
        );
      }
    }
  }
  return {
    schemaVersion,
    totalByteLength,
    sections
  };
}
__name(parseSceneChunk, "parseSceneChunk");

// src/lib/cad-v2/worker/curve-refinement.ts
var RECORD_STRIDE = 8;
var DEFAULT_MAX_SEGMENTS_PER_INTERVAL = 4096;
var DEFAULT_MAX_SEGMENTS_TOTAL = 65536;
var MAX_INTERVALS = 5e4;
var FLOAT32_UNIT_ROUNDOFF = 2 ** -24;
var MAX_SPLINE_BEZIER_DEGREE = 16;
function finitePositive(value) {
  return Number.isFinite(value) && value > 0;
}
__name(finitePositive, "finitePositive");
function isRationalBezierSource(value) {
  return !!value && Array.isArray(value.controlPoints) && Array.isArray(value.weights) && value.controlPoints.length >= 2 && value.controlPoints.length <= MAX_SPLINE_BEZIER_DEGREE + 1 && value.weights.length === value.controlPoints.length && value.controlPoints.every((point, index) => Array.isArray(point) && point.length === 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]) && Number.isFinite(point[0] * value.weights[index]) && Number.isFinite(point[1] * value.weights[index])) && value.weights.every((weight) => finitePositive(weight));
}
__name(isRationalBezierSource, "isRationalBezierSource");
function basisMaxScale(ux, uy, vx, vy) {
  const sumSquares = ux * ux + uy * uy + vx * vx + vy * vy;
  const determinant = ux * vy - uy * vx;
  const discriminant = Math.max(0, sumSquares * sumSquares - 4 * determinant * determinant);
  return Math.sqrt(Math.max(0, (sumSquares + Math.sqrt(discriminant)) / 2));
}
__name(basisMaxScale, "basisMaxScale");
function validateOptions(options) {
  if (!options || !(options.curveData instanceof Float32Array)) {
    throw new TypeError("Curve refinement requires Float32 CURVE_DATA");
  }
  if (options.curveData.length % RECORD_STRIDE !== 0) {
    throw new Error("CURVE_DATA length is not divisible by its eight-float record stride");
  }
  if (!Array.isArray(options.curveSourceRefs) || options.curveSourceRefs.length > MAX_INTERVALS) {
    throw new Error(`Curve source reference count exceeds limit (${MAX_INTERVALS})`);
  }
  if (!finitePositive(options.targetErrorCssPixels) || !finitePositive(options.unitsPerCssPixel) || !finitePositive(options.maxTransformSingularValue)) {
    throw new RangeError("Curve refinement screen budget fields must be finite and positive");
  }
  if (!Number.isSafeInteger(options.fallbackVertexCount) || options.fallbackVertexCount < 0) {
    throw new RangeError("Fallback vertex count must be a non-negative safe integer");
  }
  for (const [name, cap] of [
    ["maxSegmentsPerInterval", options.maxSegmentsPerInterval ?? DEFAULT_MAX_SEGMENTS_PER_INTERVAL],
    ["maxSegmentsTotal", options.maxSegmentsTotal ?? DEFAULT_MAX_SEGMENTS_TOTAL]
  ]) {
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
__name(validateOptions, "validateOptions");
function refineCurveSourceIntervals(options) {
  validateOptions(options);
  const maxSegmentsPerInterval = options.maxSegmentsPerInterval ?? DEFAULT_MAX_SEGMENTS_PER_INTERVAL;
  const maxSegmentsTotal = options.maxSegmentsTotal ?? DEFAULT_MAX_SEGMENTS_TOTAL;
  const recordCount = options.curveData.length / RECORD_STRIDE;
  const seenRecords = /* @__PURE__ */ new Set();
  const ranges = [];
  for (const ref of options.curveSourceRefs) {
    if (!ref || typeof ref.curveId !== "string" || !ref.curveId || typeof ref.sourceHandle !== "string" || !ref.sourceHandle || ref.sourceType !== "CIRCLE" && ref.sourceType !== "ARC" && ref.sourceType !== "ELLIPSE" && ref.sourceType !== "BULGE" && ref.sourceType !== "SPLINE") {
      throw new Error("CURVE_DATA reference has invalid source identity");
    }
    if (ref.sourceType === "SPLINE" ? !isRationalBezierSource(ref.splineSource) : ref.splineSource !== void 0) {
      throw new Error("CURVE_DATA reference has an invalid rational Bezier source");
    }
    if (ref.sourceQuantizationErrorWorld !== void 0 && (typeof ref.sourceQuantizationErrorWorld !== "number" || !Number.isFinite(ref.sourceQuantizationErrorWorld) || ref.sourceQuantizationErrorWorld < 0)) {
      throw new Error("CURVE_DATA reference has an invalid source quantization error");
    }
    if (!Number.isSafeInteger(ref.curveRecordIndex) || ref.curveRecordIndex < 0 || ref.curveRecordIndex >= recordCount || !Number.isSafeInteger(ref.firstVertex) || ref.firstVertex < 0 || !Number.isSafeInteger(ref.vertexCount) || ref.vertexCount < 2 || ref.vertexCount % 2 !== 0 || ref.firstVertex + ref.vertexCount > options.fallbackVertexCount || !Number.isSafeInteger(ref.firstSegmentIndex) || ref.firstSegmentIndex < 0 || !Number.isSafeInteger(ref.segmentCount) || ref.segmentCount < 1 || ref.vertexCount !== ref.segmentCount * 2) {
      throw new Error("CURVE_DATA reference has an invalid record or fallback vertex range");
    }
    if (seenRecords.has(ref.curveRecordIndex)) throw new Error("CURVE_DATA record is referenced more than once");
    seenRecords.add(ref.curveRecordIndex);
    ranges.push([ref.firstVertex, ref.firstVertex + ref.vertexCount]);
  }
  if (seenRecords.size !== recordCount) throw new Error("CURVE_DATA contains an unreferenced analytic record");
  ranges.sort((a, b) => a[0] - b[0]);
  for (let index = 1; index < ranges.length; index++) {
    if (ranges[index][0] < ranges[index - 1][1]) throw new Error("CURVE_DATA fallback vertex ranges overlap");
  }
  const intervals = [];
  let totalSegments = 0;
  for (const ref of options.curveSourceRefs) {
    const { splineSource: _splineSource, ...intervalRef } = ref;
    const base = ref.curveRecordIndex * RECORD_STRIDE;
    const cx = options.curveData[base];
    const cy = options.curveData[base + 1];
    const ux = options.curveData[base + 2];
    const uy = options.curveData[base + 3];
    const vx = options.curveData[base + 4];
    const vy = options.curveData[base + 5];
    const start = options.curveData[base + 6];
    const end = options.curveData[base + 7];
    if (!(end > start) && !(end < start)) throw new Error("CURVE_DATA parameter interval must have non-zero sweep");
    if (ref.sourceType !== "SPLINE" && ux === 0 && uy === 0 && vx === 0 && vy === 0) {
      throw new Error("CURVE_DATA basis must not be degenerate");
    }
    const downstreamScale = options.maxTransformSingularValue;
    const desiredWorldError = options.targetErrorCssPixels * options.unitsPerCssPixel / downstreamScale;
    if (ref.sourceType === "SPLINE") {
      const source = ref.splineSource;
      const homogeneous = source.controlPoints.map((point, index) => [
        point[0] * source.weights[index],
        point[1] * source.weights[index],
        source.weights[index]
      ]);
      const toEuclidean = /* @__PURE__ */ __name((point) => [point[0] / point[2], point[1] / point[2]], "toEuclidean");
      const distanceToSegment = /* @__PURE__ */ __name((point, first2, last) => {
        const dx = last[0] - first2[0];
        const dy = last[1] - first2[1];
        const lengthSquared = dx * dx + dy * dy;
        const t = lengthSquared <= Number.EPSILON ? 0 : Math.max(0, Math.min(
          1,
          ((point[0] - first2[0]) * dx + (point[1] - first2[1]) * dy) / lengthSquared
        ));
        return Math.hypot(point[0] - first2[0] - t * dx, point[1] - first2[1] - t * dy);
      }, "distanceToSegment");
      const splitBezier = /* @__PURE__ */ __name((control) => {
        const levels = [control.map((point) => [...point])];
        while (levels[levels.length - 1].length > 1) {
          const previous = levels[levels.length - 1];
          const next = [];
          for (let index = 0; index + 1 < previous.length; index++) {
            next.push([
              (previous[index][0] + previous[index + 1][0]) / 2,
              (previous[index][1] + previous[index + 1][1]) / 2,
              (previous[index][2] + previous[index + 1][2]) / 2
            ]);
          }
          levels.push(next);
        }
        return [
          levels.map((level) => level[0]),
          levels.map((level) => level[level.length - 1]).reverse()
        ];
      }, "splitBezier");
      const first = toEuclidean(homogeneous[0]);
      let coordinateMagnitude2 = 1;
      for (const point of source.controlPoints) {
        coordinateMagnitude2 = Math.max(coordinateMagnitude2, Math.abs(point[0]), Math.abs(point[1]));
      }
      const quantizationWorldError2 = Math.SQRT2 * coordinateMagnitude2 * FLOAT32_UNIT_ROUNDOFF + (ref.sourceQuantizationErrorWorld ?? 0);
      const availableWorldError2 = desiredWorldError - quantizationWorldError2;
      if (!(availableWorldError2 > 0)) {
        intervals.push({
          ...intervalRef,
          sourceSegmentCount: ref.segmentCount,
          coordinates: null,
          segmentCount: 0,
          requestedErrorCssPixels: options.targetErrorCssPixels,
          conservativeErrorCssPixels: quantizationWorldError2 * downstreamScale / options.unitsPerCssPixel,
          errorBoundMet: false,
          status: "degraded",
          reason: "float32-precision"
        });
        continue;
      }
      const remainingBudget2 = Math.max(0, maxSegmentsTotal - totalSegments);
      const segmentLimit = Math.min(maxSegmentsPerInterval, remainingBudget2);
      const coordinates2 = [first[0], first[1]];
      let segmentCount = 0;
      let maximumDeviation = 0;
      let capped = segmentLimit < 1;
      const refineBezier = /* @__PURE__ */ __name((control, depth) => {
        if (capped) return;
        const startPoint = toEuclidean(control[0]);
        const endPoint = toEuclidean(control[control.length - 1]);
        let deviation = 0;
        for (const point of control) deviation = Math.max(deviation, distanceToSegment(toEuclidean(point), startPoint, endPoint));
        if (deviation <= availableWorldError2) {
          if (segmentCount >= segmentLimit) {
            capped = true;
            return;
          }
          segmentCount++;
          maximumDeviation = Math.max(maximumDeviation, deviation);
          coordinates2.push(endPoint[0], endPoint[1]);
          return;
        }
        if (depth >= 32 || segmentCount >= segmentLimit) {
          capped = true;
          return;
        }
        const [left, right] = splitBezier(control);
        refineBezier(left, depth + 1);
        refineBezier(right, depth + 1);
      }, "refineBezier");
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
          reason: "segment-cap"
        });
        continue;
      }
      const coordinateArray = new Float32Array(coordinates2);
      let finiteCoordinates2 = true;
      for (let index = 0; index < coordinateArray.length; index++) {
        if (!Number.isFinite(coordinateArray[index])) {
          finiteCoordinates2 = false;
          break;
        }
      }
      if (!finiteCoordinates2) {
        intervals.push({
          ...intervalRef,
          sourceSegmentCount: ref.segmentCount,
          coordinates: null,
          segmentCount: 0,
          requestedErrorCssPixels: options.targetErrorCssPixels,
          conservativeErrorCssPixels: Number.POSITIVE_INFINITY,
          errorBoundMet: false,
          status: "degraded",
          reason: "float32-precision"
        });
        continue;
      }
      const conservativeErrorCssPixels2 = (maximumDeviation + quantizationWorldError2) * downstreamScale / options.unitsPerCssPixel;
      const errorBoundMet3 = conservativeErrorCssPixels2 <= options.targetErrorCssPixels * (1 + 1e-12);
      intervals.push({
        ...intervalRef,
        sourceSegmentCount: ref.segmentCount,
        coordinates: coordinateArray,
        segmentCount,
        requestedErrorCssPixels: options.targetErrorCssPixels,
        conservativeErrorCssPixels: conservativeErrorCssPixels2,
        errorBoundMet: errorBoundMet3,
        status: errorBoundMet3 ? "refined" : "degraded",
        ...!errorBoundMet3 ? { reason: "segment-cap" } : {}
      });
      totalSegments += segmentCount;
      continue;
    }
    const basisScale = basisMaxScale(ux, uy, vx, vy);
    const coordinateMagnitude = Math.max(
      Math.abs(cx) + Math.abs(ux) + Math.abs(vx),
      Math.abs(cy) + Math.abs(uy) + Math.abs(vy),
      1
    );
    if (!finitePositive(basisScale) || !finitePositive(desiredWorldError) || !Number.isFinite(coordinateMagnitude)) {
      throw new Error("CURVE_DATA produces an unbounded basis or screen-space tolerance");
    }
    const quantizationWorldError = Math.SQRT2 * coordinateMagnitude * FLOAT32_UNIT_ROUNDOFF + (ref.sourceQuantizationErrorWorld ?? 0);
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
        reason: "float32-precision"
      });
      continue;
    }
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
        reason: "segment-cap"
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
        reason: "float32-precision"
      });
      continue;
    }
    const measuredBoundWorld = basisScale * (sweep / actualSegments) ** 2 / 8 + quantizationWorldError;
    const conservativeErrorCssPixels = measuredBoundWorld * downstreamScale / options.unitsPerCssPixel;
    const errorBoundMet2 = requestedSegments <= maxSegmentsPerInterval && actualSegments >= requestedSegments && totalSegments + actualSegments <= maxSegmentsTotal && conservativeErrorCssPixels <= options.targetErrorCssPixels * (1 + 1e-12);
    intervals.push({
      ...intervalRef,
      sourceSegmentCount: ref.segmentCount,
      coordinates,
      segmentCount: actualSegments,
      requestedErrorCssPixels: options.targetErrorCssPixels,
      conservativeErrorCssPixels,
      errorBoundMet: errorBoundMet2,
      status: errorBoundMet2 ? "refined" : "degraded",
      ...!errorBoundMet2 ? { reason: "segment-cap" } : {}
    });
    totalSegments += actualSegments;
  }
  const errorBoundMet = intervals.every((interval) => interval.errorBoundMet);
  const totalOutputBytes = intervals.reduce((sum, interval) => sum + (interval.coordinates?.byteLength ?? 0), 0);
  return { intervals, totalSegments, totalOutputBytes, errorBoundMet };
}
__name(refineCurveSourceIntervals, "refineCurveSourceIntervals");

// src/workers/cad-v2/cad-v2-scene-worker.ts
var MAX_DECODED_ALLOCATION_BYTES2 = 8 * 1024 * 1024;
var MAX_REFINEMENT_SOURCE_CACHE_BYTES = 8 * 1024 * 1024;
var refinementSourceCache = /* @__PURE__ */ new Map();
var activeWorkerSessions = /* @__PURE__ */ new Map();
var refinementSourceCacheBytes = 0;
function sourceCacheKey(viewSessionId, sourceVersionKey, chunkId) {
  return `${viewSessionId}\0${sourceVersionKey}\0${chunkId}`;
}
__name(sourceCacheKey, "sourceCacheKey");
function retainRefinementSources(viewSessionId, sourceVersionKey, chunk) {
  const refs = chunk.meta?.curveSourceRefs;
  if (!chunk.curveDataArray || !Array.isArray(refs) || refs.length === 0) return;
  const refsJson = JSON.stringify(refs);
  const byteLength = chunk.curveDataArray.byteLength + refsJson.length * 2;
  const key = sourceCacheKey(viewSessionId, sourceVersionKey, chunk.chunkId);
  const previous = refinementSourceCache.get(key);
  if (previous) {
    refinementSourceCacheBytes -= previous.byteLength;
    refinementSourceCache.delete(key);
  }
  if (byteLength > MAX_REFINEMENT_SOURCE_CACHE_BYTES) return;
  while (refinementSourceCacheBytes + byteLength > MAX_REFINEMENT_SOURCE_CACHE_BYTES) {
    const oldestKey = refinementSourceCache.keys().next().value;
    if (!oldestKey) break;
    const oldest = refinementSourceCache.get(oldestKey);
    refinementSourceCacheBytes -= oldest.byteLength;
    refinementSourceCache.delete(oldestKey);
  }
  refinementSourceCache.set(key, {
    curveData: new Float32Array(chunk.curveDataArray),
    curveSourceRefsJson: refsJson,
    vertexCount: chunk.vertexCount,
    byteLength
  });
  refinementSourceCacheBytes += byteLength;
}
__name(retainRefinementSources, "retainRefinementSources");
function clearSessionRefinementSources(viewSessionId) {
  for (const [key, entry] of refinementSourceCache) {
    if (key.startsWith(`${viewSessionId}\0`)) {
      refinementSourceCacheBytes -= entry.byteLength;
      refinementSourceCache.delete(key);
    }
  }
}
__name(clearSessionRefinementSources, "clearSessionRefinementSources");
function validateSceneManifest(manifest) {
  if (!manifest || typeof manifest !== "object") return false;
  if (manifest.schemaVersion !== 1) return false;
  if (!manifest.sceneId || typeof manifest.sceneId !== "string") return false;
  if (!manifest.sourceVersionKey || !manifest.sourceSha256) return false;
  if (!Array.isArray(manifest.layouts) || manifest.layouts.length === 0) return false;
  return true;
}
__name(validateSceneManifest, "validateSceneManifest");
function unpackSceneChunk(chunkId, buffer) {
  if (buffer.byteLength > MAX_DECODED_ALLOCATION_BYTES2) {
    throw new Error(`[SceneWorker] Par\xE7a boyutu izin verilen s\u0131n\u0131r\u0131 a\u015F\u0131yor: ${buffer.byteLength} > ${MAX_DECODED_ALLOCATION_BYTES2}`);
  }
  const rawChunk = parseSceneChunk(buffer);
  if (rawChunk.schemaVersion !== SCENE_SCHEMA_VERSION) {
    throw new Error(`[SceneWorker] Desteklenmeyen \u015Fema s\xFCr\xFCm\xFC: ${rawChunk.schemaVersion}`);
  }
  const originSection = rawChunk.sections.get(2 /* ORIGIN */);
  let origin = [0, 0];
  if (originSection && originSection.data instanceof Float64Array) {
    origin = [originSection.data[0], originSection.data[1]];
  }
  const xySection = rawChunk.sections.get(3 /* XY */);
  if (!xySection || !(xySection.data instanceof Float32Array)) {
    throw new Error(`[SceneWorker] Par\xE7ada ge\xE7erli XY vertex verisi bulunamad\u0131 (chunkId: ${chunkId})`);
  }
  const xyArray = xySection.data;
  const vertexCount = xyArray.length / 2;
  const runsSection = rawChunk.sections.get(9 /* DRAW_RUNS */);
  let drawRunsArray = null;
  if (runsSection && runsSection.data instanceof Uint32Array) {
    drawRunsArray = runsSection.data;
  }
  const metaSection = rawChunk.sections.get(1 /* META */);
  let meta = null;
  if (metaSection && metaSection.data instanceof Uint8Array) {
    try {
      const jsonStr = new TextDecoder().decode(metaSection.data);
      meta = JSON.parse(jsonStr);
    } catch {
      meta = null;
    }
  }
  const triSection = rawChunk.sections.get(4 /* TRIANGLES */);
  let trianglesArray = null;
  if (triSection && triSection.data instanceof Float32Array) {
    trianglesArray = triSection.data;
  }
  const pathDistSection = rawChunk.sections.get(10 /* PATH_DISTANCE */);
  let pathDistancesArray = null;
  if (pathDistSection && pathDistSection.data instanceof Float32Array) {
    pathDistancesArray = pathDistSection.data;
  }
  const curveSection = rawChunk.sections.get(6 /* CURVE_DATA */);
  let curveDataArray = null;
  if (curveSection && curveSection.data instanceof Float32Array) {
    curveDataArray = curveSection.data;
  }
  return {
    chunkId,
    origin,
    xyArray,
    drawRunsArray,
    trianglesArray,
    pathDistancesArray,
    curveDataArray,
    meta,
    vertexCount
  };
}
__name(unpackSceneChunk, "unpackSceneChunk");
function refineUnpackedChunkCurves(chunk, options) {
  const refs = chunk.meta?.curveSourceRefs;
  if (!chunk.curveDataArray || !Array.isArray(refs) || refs.length === 0) {
    return { intervals: [], totalSegments: 0, totalOutputBytes: 0, errorBoundMet: true };
  }
  return refineCurveSourceIntervals({
    ...options,
    curveData: chunk.curveDataArray,
    curveSourceRefs: refs,
    fallbackVertexCount: chunk.vertexCount
  });
}
__name(refineUnpackedChunkCurves, "refineUnpackedChunkCurves");
if (typeof self !== "undefined" && typeof self.postMessage === "function" && typeof window === "undefined") {
  self.onmessage = (event) => {
    const msg = event.data;
    if (!msg || msg.protocolVersion !== 1) {
      const errResponse = {
        protocolVersion: 1,
        viewSessionId: msg?.viewSessionId || "unknown",
        generation: msg?.generation || 0,
        sourceVersionKey: msg?.sourceVersionKey || "unknown",
        kind: "error",
        payload: { error: "Ge\xE7ersiz veya desteklenmeyen protocolVersion" }
      };
      self.postMessage(errResponse);
      return;
    }
    const activeSession = activeWorkerSessions.get(msg.viewSessionId);
    if (activeSession && activeSession.sourceVersionKey !== msg.sourceVersionKey) {
      self.postMessage({
        protocolVersion: 1,
        viewSessionId: msg.viewSessionId,
        generation: msg.generation,
        sourceVersionKey: msg.sourceVersionKey,
        kind: "error",
        payload: { error: "Worker oturumu farkl\u0131 bir sourceVersionKey ile yeniden kullan\u0131lamaz" }
      });
      return;
    }
    if (activeSession && msg.generation < activeSession.generation) return;
    activeWorkerSessions.set(msg.viewSessionId, { generation: msg.generation, sourceVersionKey: msg.sourceVersionKey });
    switch (msg.kind) {
      case "ping": {
        const readyResponse = {
          protocolVersion: 1,
          viewSessionId: msg.viewSessionId,
          generation: msg.generation,
          sourceVersionKey: msg.sourceVersionKey,
          kind: "ready",
          payload: { pong: true }
        };
        self.postMessage(readyResponse);
        break;
      }
      case "load-chunk": {
        try {
          if (!msg.payload?.chunkBuffer) {
            throw new Error("Eksik chunkBuffer y\xFCk\xFC");
          }
          const unpacked = unpackSceneChunk(msg.payload.chunkId, msg.payload.chunkBuffer);
          retainRefinementSources(msg.viewSessionId, msg.sourceVersionKey, unpacked);
          const response = {
            protocolVersion: 1,
            viewSessionId: msg.viewSessionId,
            generation: msg.generation,
            sourceVersionKey: msg.sourceVersionKey,
            kind: "chunk",
            payload: unpacked
          };
          const transferables = [unpacked.xyArray.buffer];
          if (unpacked.drawRunsArray && unpacked.drawRunsArray.buffer !== unpacked.xyArray.buffer) {
            transferables.push(unpacked.drawRunsArray.buffer);
          }
          if (unpacked.trianglesArray && unpacked.trianglesArray.buffer !== unpacked.xyArray.buffer && unpacked.trianglesArray.buffer !== unpacked.drawRunsArray?.buffer) {
            transferables.push(unpacked.trianglesArray.buffer);
          }
          if (unpacked.pathDistancesArray && unpacked.pathDistancesArray.buffer !== unpacked.xyArray.buffer && unpacked.pathDistancesArray.buffer !== unpacked.drawRunsArray?.buffer && unpacked.pathDistancesArray.buffer !== unpacked.trianglesArray?.buffer) {
            transferables.push(unpacked.pathDistancesArray.buffer);
          }
          self.postMessage(response, transferables);
        } catch (err) {
          const errResponse = {
            protocolVersion: 1,
            viewSessionId: msg.viewSessionId,
            generation: msg.generation,
            sourceVersionKey: msg.sourceVersionKey,
            kind: "error",
            payload: { error: err.message || "Bilinmeyen worker ayr\u0131\u015Ft\u0131rma hatas\u0131" }
          };
          self.postMessage(errResponse);
        }
        break;
      }
      case "refine-curves": {
        try {
          const requestId = msg.payload?.requestId;
          const chunkId = msg.payload?.chunkId;
          if (typeof requestId !== "string" || !requestId || typeof chunkId !== "string" || !chunkId) {
            throw new Error("Eksik curve refinement requestId/chunkId");
          }
          const cached = refinementSourceCache.get(sourceCacheKey(msg.viewSessionId, msg.sourceVersionKey, chunkId));
          const inlineBuffer = msg.payload?.curveDataBuffer;
          const curveData = cached?.curveData ?? (inlineBuffer && inlineBuffer.byteLength <= MAX_REFINEMENT_SOURCE_CACHE_BYTES ? new Float32Array(inlineBuffer) : null);
          const curveSourceRefs = cached ? JSON.parse(cached.curveSourceRefsJson) : msg.payload?.curveSourceRefs;
          const fallbackVertexCount = cached?.vertexCount ?? msg.payload?.fallbackVertexCount;
          if (!curveData || !curveSourceRefs || typeof fallbackVertexCount !== "number" || !Number.isSafeInteger(fallbackVertexCount)) {
            throw new Error(`Curve source unavailable or exceeds inline limit (${chunkId})`);
          }
          const key = sourceCacheKey(msg.viewSessionId, msg.sourceVersionKey, chunkId);
          if (cached) {
            refinementSourceCache.delete(key);
            refinementSourceCache.set(key, cached);
          }
          const result = refineCurveSourceIntervals({
            curveData,
            curveSourceRefs,
            fallbackVertexCount,
            targetErrorCssPixels: msg.payload.targetErrorCssPixels,
            unitsPerCssPixel: msg.payload.unitsPerCssPixel,
            maxTransformSingularValue: msg.payload.maxTransformSingularValue
          });
          const response = {
            protocolVersion: 1,
            viewSessionId: msg.viewSessionId,
            generation: msg.generation,
            sourceVersionKey: msg.sourceVersionKey,
            kind: "refined-curves",
            payload: { requestId, chunkId, result }
          };
          const transferables = result.intervals.flatMap((interval) => interval.coordinates ? [interval.coordinates.buffer] : []);
          self.postMessage(response, transferables);
        } catch (err) {
          const errResponse = {
            protocolVersion: 1,
            viewSessionId: msg.viewSessionId,
            generation: msg.generation,
            sourceVersionKey: msg.sourceVersionKey,
            kind: "error",
            payload: { requestId: msg.payload?.requestId, error: err.message || "Curve refinement ba\u015Far\u0131s\u0131z" }
          };
          self.postMessage(errResponse);
        }
        break;
      }
      case "cancel": {
        const cancelResponse = {
          protocolVersion: 1,
          viewSessionId: msg.viewSessionId,
          generation: msg.generation,
          sourceVersionKey: msg.sourceVersionKey,
          kind: "cancelled",
          payload: { chunkId: msg.payload?.chunkId }
        };
        self.postMessage(cancelResponse);
        break;
      }
      case "dispose": {
        clearSessionRefinementSources(msg.viewSessionId);
        activeWorkerSessions.delete(msg.viewSessionId);
        const disposedResponse = {
          protocolVersion: 1,
          viewSessionId: msg.viewSessionId,
          generation: msg.generation,
          sourceVersionKey: msg.sourceVersionKey,
          kind: "disposed",
          payload: {}
        };
        self.postMessage(disposedResponse);
        break;
      }
      default:
        break;
    }
  };
}
export {
  refineUnpackedChunkCurves,
  unpackSceneChunk,
  validateSceneManifest
};
