var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/lib/cad-v2/version.ts
var CAD_V2_DECODER_VERSIONS = Object.freeze({
  libredwg: "0.7.10",
  dataModel: "1.14.2",
  shxParser: "1.4.5",
  mtextParser: "1.5.0",
  opentype: "1.3.4",
  three: "0.172.0"
});

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
  const headerReserved = dataView.getUint32(28, true);
  if (sectionTableOffset !== HEADER_BYTE_LENGTH || headerBytes !== HEADER_BYTE_LENGTH) {
    throw new Error(`[SceneProtocol] Ge\xE7ersiz header ofset veya boyutu`);
  }
  if (headerReserved !== 0) {
    throw new Error(`[SceneProtocol] Desteklenmeyen binary ABI/header reserved de\u011Feri: ${headerReserved}`);
  }
  const tableEnd = sectionTableOffset + sectionCount * SECTION_ENTRY_BYTE_LENGTH;
  if (tableEnd > totalByteLength) {
    throw new Error(`[SceneProtocol] Section tablosu chunk s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor: ${tableEnd} > ${totalByteLength}`);
  }
  const sections = /* @__PURE__ */ new Map();
  const seenTags = /* @__PURE__ */ new Set();
  const sectionRanges = [];
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
    const specification = SCENE_TAG_SPECIFICATIONS[tag];
    if (!specification) {
      throw new Error(`[SceneProtocol] Desteklenmeyen binary ABI section tag: ${tag}`);
    }
    if (scalarType !== specification.scalarType || componentCount !== specification.componentCount) {
      throw new Error(
        `[SceneProtocol] Binary ABI uyu\u015Fmazl\u0131\u011F\u0131 tag ${tag}: beklenen ${specification.scalarType}/${specification.componentCount}, al\u0131nan ${scalarType}/${componentCount}`
      );
    }
    if (flags !== 0 || reserved !== 0) {
      throw new Error(`[SceneProtocol] Desteklenmeyen section flag/reserved alan\u0131: tag ${tag}`);
    }
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
    sectionRanges.push({ start: byteOffset, end: byteOffset + byteLength, tag });
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
    if (view instanceof Float32Array || view instanceof Float64Array) {
      for (let valueIndex = 0; valueIndex < view.length; valueIndex++) {
        if (!Number.isFinite(view[valueIndex])) {
          throw new Error(`[SceneProtocol] Float section i\xE7inde non-finite de\u011Fer: tag ${tag}, index ${valueIndex}`);
        }
      }
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
  sectionRanges.sort((a, b) => a.start - b.start || a.end - b.end);
  for (let i = 1; i < sectionRanges.length; i++) {
    const previous = sectionRanges[i - 1];
    const current = sectionRanges[i];
    if (previous.end > current.start) {
      throw new Error(`[SceneProtocol] Overlapping section aral\u0131\u011F\u0131: tag ${previous.tag} ve ${current.tag}`);
    }
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

// node_modules/earcut/src/earcut.js
var steiners = /* @__PURE__ */ new Set();
var filteredOut = false;
function earcut(data, holeIndices, dim = 2) {
  const hasHoles = holeIndices && holeIndices.length;
  const outerLen = hasHoles ? holeIndices[0] * dim : data.length;
  if (steiners.size) steiners.clear();
  let outerNode = linkedList(data, 0, outerLen, dim, true);
  const triangles = [];
  if (!outerNode || outerNode.next === outerNode.prev) return triangles;
  let minX = 0, minY = 0, invSize = 0;
  if (hasHoles) outerNode = eliminateHoles(data, holeIndices, outerNode, dim);
  if (data.length > 80 * dim) {
    minX = data[0];
    minY = data[1];
    let maxX = minX;
    let maxY = minY;
    for (let i = dim; i < outerLen; i += dim) {
      const x = data[i];
      const y = data[i + 1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    invSize = Math.max(maxX - minX, maxY - minY);
    invSize = invSize !== 0 ? 32767 / invSize : 0;
  }
  earcutLinked(outerNode, triangles, minX, minY, invSize);
  return triangles;
}
__name(earcut, "earcut");
function linkedList(data, start, end, dim, clockwise) {
  let last = null;
  if (clockwise === signedArea(data, start, end, dim) > 0) {
    for (let i = start; i < end; i += dim) last = insertNode(i / dim | 0, data[i], data[i + 1], last);
  } else {
    for (let i = end - dim; i >= start; i -= dim) last = insertNode(i / dim | 0, data[i], data[i + 1], last);
  }
  if (last && equals(last, last.next)) {
    removeNode(last);
    last = last.next;
  }
  return last;
}
__name(linkedList, "linkedList");
function filterPoints(start, end = start) {
  const full = end === start;
  let p = start, again;
  do {
    again = false;
    if (p !== p.next && (steiners.size === 0 || !steiners.has(p)) && (equals(p, p.next) || area(p.prev, p, p.next) === 0)) {
      if (full || p === end) end = p.prev;
      filteredOut = true;
      removeNode(p);
      p = p.prev;
      again = true;
    } else if (full || p !== end) {
      p = p.next;
      again = !full;
    }
  } while (again || p !== end);
  return end;
}
__name(filterPoints, "filterPoints");
function earcutLinked(ear, triangles, minX, minY, invSize) {
  if (invSize) indexCurve(ear, minX, minY, invSize);
  let stop = ear, cured = false;
  while (ear.prev !== ear.next) {
    const prev = ear.prev;
    const next = ear.next;
    if (area(prev, ear, next) < 0 && (invSize ? isEarHashed(ear, minX, minY, invSize) : isEar(ear))) {
      triangles.push(prev.i, ear.i, next.i);
      removeNode(ear);
      ear = next;
      stop = next;
      continue;
    }
    ear = next;
    if (ear === stop) {
      filteredOut = false;
      ear = filterPoints(ear);
      if (filteredOut) {
        stop = ear;
        continue;
      }
      if (!cured) {
        ear = cureLocalIntersections(ear, triangles);
        stop = ear;
        cured = true;
        continue;
      }
      splitEarcut(ear, triangles, minX, minY, invSize);
      break;
    }
  }
}
__name(earcutLinked, "earcutLinked");
function isEar(ear) {
  const a = ear.prev, b = ear, c = ear.next, ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y, x0 = Math.min(ax, bx, cx), y0 = Math.min(ay, by, cy), x1 = Math.max(ax, bx, cx), y1 = Math.max(ay, by, cy);
  let p = c.next;
  while (p !== a) {
    if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && !(ax === p.x && ay === p.y) && pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
    p = p.next;
  }
  return true;
}
__name(isEar, "isEar");
function isEarHashed(ear, minX, minY, invSize) {
  const a = ear.prev, b = ear, c = ear.next, ax = a.x, bx = b.x, cx = c.x, ay = a.y, by = b.y, cy = c.y, x0 = Math.min(ax, bx, cx), y0 = Math.min(ay, by, cy), x1 = Math.max(ax, bx, cx), y1 = Math.max(ay, by, cy), minZ = zOrder(x0, y0, minX, minY, invSize), maxZ = zOrder(x1, y1, minX, minY, invSize);
  let p = ear.prevZ;
  while (p && p.z >= minZ) {
    if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1 && p !== c && !(ax === p.x && ay === p.y) && pointInTriangle(ax, ay, bx, by, cx, cy, p.x, p.y) && area(p.prev, p, p.next) >= 0) return false;
    p = p.prevZ;
  }
  let n = ear.nextZ;
  while (n && n.z <= maxZ) {
    if (n.x >= x0 && n.x <= x1 && n.y >= y0 && n.y <= y1 && n !== c && !(ax === n.x && ay === n.y) && pointInTriangle(ax, ay, bx, by, cx, cy, n.x, n.y) && area(n.prev, n, n.next) >= 0) return false;
    n = n.nextZ;
  }
  return true;
}
__name(isEarHashed, "isEarHashed");
function cureLocalIntersections(start, triangles) {
  let p = start;
  let cured = false;
  do {
    const a = p.prev, b = p.next.next;
    if (intersects(a, p, p.next, b, false) && locallyInside(a, b) && locallyInside(b, a)) {
      triangles.push(a.i, p.i, b.i);
      removeNode(p);
      removeNode(p.next);
      p = start = b;
      cured = true;
    }
    p = p.next;
  } while (p !== start);
  return cured ? filterPoints(p) : p;
}
__name(cureLocalIntersections, "cureLocalIntersections");
function splitEarcut(start, triangles, minX, minY, invSize) {
  let a = start;
  do {
    let b = a.next.next;
    while (b !== a.prev) {
      if (a.i !== b.i && isValidDiagonal(a, b)) {
        let c = splitPolygon(a, b);
        a = filterPoints(a, a.next);
        c = filterPoints(c, c.next);
        earcutLinked(a, triangles, minX, minY, invSize);
        earcutLinked(c, triangles, minX, minY, invSize);
        return;
      }
      b = b.next;
    }
    a = a.next;
  } while (a !== start);
}
__name(splitEarcut, "splitEarcut");
var indexActive = false;
function eliminateHoles(data, holeIndices, outerNode, dim) {
  const queue = [];
  for (let i = 0, len = holeIndices.length; i < len; i++) {
    const start = holeIndices[i] * dim;
    const end = i < len - 1 ? holeIndices[i + 1] * dim : data.length;
    const list = (
      /** @type {Node} */
      linkedList(data, start, end, dim, false)
    );
    if (list === list.next) steiners.add(list);
    queue.push(getLeftmost(list));
  }
  queue.sort(compareXYSlope);
  buildBlockIndex(data.length / dim, holeIndices.length);
  indexSegment(outerNode, outerNode);
  indexActive = true;
  for (let i = 0; i < queue.length; i++) {
    outerNode = eliminateHole(queue[i], outerNode);
  }
  indexActive = false;
  return filterPoints(outerNode);
}
__name(eliminateHoles, "eliminateHoles");
function compareXYSlope(a, b) {
  return a.x - b.x || a.y - b.y || (a.next.y - a.y) / (a.next.x - a.x) - (b.next.y - b.y) / (b.next.x - b.x);
}
__name(compareXYSlope, "compareXYSlope");
function eliminateHole(hole, outerNode) {
  const bridge = findHoleBridge(hole, outerNode);
  if (!bridge) {
    return outerNode;
  }
  const bridgeReverse = splitPolygon(bridge, hole);
  const bridge2 = bridgeReverse.next;
  indexSegment(bridge, bridge2.next);
  filterPoints(bridgeReverse, bridgeReverse.next);
  return filterPoints(bridge, bridge.next);
}
__name(eliminateHole, "eliminateHole");
var K = 16;
var blockBBox = new Float64Array(0);
var numBlocks = 0;
var blockHead = [];
var blockStop = [];
function buildBlockIndex(maxNodes, numHoles) {
  const maxBlocks = Math.ceil((maxNodes + 2 * numHoles) / K) + numHoles + 2;
  if (blockBBox.length < maxBlocks * 4) blockBBox = new Float64Array(maxBlocks * 4);
  numBlocks = 0;
}
__name(buildBlockIndex, "buildBlockIndex");
function indexSegment(head, stop) {
  let p = head;
  do {
    const b = numBlocks++;
    blockHead[b] = p;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let k = 0;
    do {
      const c = p.next;
      p.z = b;
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
      p = c;
    } while (++k < K && p !== stop);
    blockStop[b] = p;
    const g = b * 4;
    blockBBox[g] = minX;
    blockBBox[g + 1] = minY;
    blockBBox[g + 2] = maxX;
    blockBBox[g + 3] = maxY;
  } while (p !== stop);
}
__name(indexSegment, "indexSegment");
function growBlock(head, tail) {
  const g = head.z * 4;
  if (tail.x < blockBBox[g]) blockBBox[g] = tail.x;
  if (tail.y < blockBBox[g + 1]) blockBBox[g + 1] = tail.y;
  if (tail.x > blockBBox[g + 2]) blockBBox[g + 2] = tail.x;
  if (tail.y > blockBBox[g + 3]) blockBBox[g + 3] = tail.y;
}
__name(growBlock, "growBlock");
function liveBlockStop(b) {
  let stop = blockStop[b];
  while (stop.prev.next !== stop) stop = stop.next;
  blockStop[b] = stop;
  return stop;
}
__name(liveBlockStop, "liveBlockStop");
function liveBlockHead(b) {
  let head = blockHead[b];
  while (head.prev.next !== head) head = head.next;
  blockHead[b] = head;
  return head;
}
__name(liveBlockHead, "liveBlockHead");
function findHoleBridge(hole, outerNode) {
  let p = outerNode;
  const hx = hole.x;
  const hy = hole.y;
  let qx = -Infinity;
  let m;
  if (equals(hole, p)) return p;
  for (let b = 0, g = 0; b < numBlocks; b++, g += 4) {
    if (hy < blockBBox[g + 1] || hy > blockBBox[g + 3] || blockBBox[g] > hx || blockBBox[g + 2] <= qx) continue;
    const stop = liveBlockStop(b);
    p = liveBlockHead(b);
    do {
      if (p.prev.next === p) {
        if (equals(hole, p.next)) return p.next;
        else if (hy <= p.y && hy >= p.next.y && p.next.y !== p.y) {
          const x = p.x + (hy - p.y) * (p.next.x - p.x) / (p.next.y - p.y);
          if (x <= hx && x > qx) {
            qx = x;
            m = p.x < p.next.x ? p : p.next;
            if (x === hx) return m;
          }
        }
      }
      p = p.next;
    } while (p !== stop);
  }
  if (!m) return null;
  const mx = m.x;
  const my = m.y;
  const tminY = Math.min(hy, my);
  const tmaxY = Math.max(hy, my);
  let tanMin = Infinity;
  for (let b = 0, g = 0; b < numBlocks; b++, g += 4) {
    if (blockBBox[g + 2] < mx || blockBBox[g] > hx || blockBBox[g + 3] < tminY || blockBBox[g + 1] > tmaxY) continue;
    const stop = liveBlockStop(b);
    p = liveBlockHead(b);
    do {
      if (p.prev.next === p && hx >= p.x && p.x >= mx && hx !== p.x && // skip dead nodes
      pointInTriangle(hy < my ? hx : qx, hy, mx, my, hy < my ? qx : hx, hy, p.x, p.y)) {
        const tan = Math.abs(hy - p.y) / (hx - p.x);
        if ((locallyInside(p, hole) || p.y === hy && p.next.y === hy && p.next.x > hx) && (tan < tanMin || tan === tanMin && (p.x > m.x || p.x === m.x && sectorContainsSector(m, p)))) {
          m = p;
          tanMin = tan;
        }
      }
      p = p.next;
    } while (p !== stop);
  }
  return m;
}
__name(findHoleBridge, "findHoleBridge");
function sectorContainsSector(m, p) {
  return area(m.prev, m, p.prev) < 0 && area(p.next, m, m.next) < 0;
}
__name(sectorContainsSector, "sectorContainsSector");
var sortArr = [];
var sortBuf = [];
var zArr = new Uint32Array(0);
var zBuf = new Uint32Array(0);
var counts = new Uint32Array(256);
function indexCurve(start, minX, minY, invSize) {
  let p = start;
  let n = 0;
  do {
    p.z = zOrder(p.x, p.y, minX, minY, invSize);
    sortArr[n++] = p;
    p = p.next;
  } while (p !== start);
  sortNodes(n);
  let prev = null;
  for (let i = 0; i < n; i++) {
    const node = sortArr[i];
    node.prevZ = prev;
    if (prev) prev.nextZ = node;
    prev = node;
  }
  prev.nextZ = null;
}
__name(indexCurve, "indexCurve");
function sortNodes(n) {
  if (n <= 32) {
    for (let i = 1; i < n; i++) {
      const node = sortArr[i], z = node.z;
      let j = i - 1;
      while (j >= 0 && sortArr[j].z > z) {
        sortArr[j + 1] = sortArr[j];
        j--;
      }
      sortArr[j + 1] = node;
    }
    return;
  }
  if (zArr.length < n) {
    zArr = new Uint32Array(n);
    zBuf = new Uint32Array(n);
    sortBuf = new Array(n);
  }
  for (let i = 0; i < n; i++) zArr[i] = sortArr[i].z;
  radixPass(n, sortArr, zArr, sortBuf, zBuf, 0);
  radixPass(n, sortBuf, zBuf, sortArr, zArr, 8);
  radixPass(n, sortArr, zArr, sortBuf, zBuf, 16);
  radixPass(n, sortBuf, zBuf, sortArr, zArr, 24);
}
__name(sortNodes, "sortNodes");
function radixPass(n, src, srcZ, dst, dstZ, shift) {
  counts.fill(0);
  for (let i = 0; i < n; i++) counts[srcZ[i] >>> shift & 255]++;
  let sum = 0;
  for (let b = 0; b < 256; b++) {
    const c = counts[b];
    counts[b] = sum;
    sum += c;
  }
  for (let i = 0; i < n; i++) {
    const z = srcZ[i];
    const pos = counts[z >>> shift & 255]++;
    dst[pos] = src[i];
    dstZ[pos] = z;
  }
}
__name(radixPass, "radixPass");
function zOrder(x, y, minX, minY, invSize) {
  x = (x - minX) * invSize | 0;
  y = (y - minY) * invSize | 0;
  x = (x | x << 8) & 16711935;
  x = (x | x << 4) & 252645135;
  x = (x | x << 2) & 858993459;
  x = (x | x << 1) & 1431655765;
  y = (y | y << 8) & 16711935;
  y = (y | y << 4) & 252645135;
  y = (y | y << 2) & 858993459;
  y = (y | y << 1) & 1431655765;
  return x | y << 1;
}
__name(zOrder, "zOrder");
function getLeftmost(start) {
  let p = start, leftmost = start;
  do {
    if (p.x < leftmost.x || p.x === leftmost.x && p.y < leftmost.y) leftmost = p;
    p = p.next;
  } while (p !== start);
  return leftmost;
}
__name(getLeftmost, "getLeftmost");
function pointInTriangle(ax, ay, bx, by, cx, cy, px, py) {
  return (cx - px) * (ay - py) >= (ax - px) * (cy - py) && (ax - px) * (by - py) >= (bx - px) * (ay - py) && (bx - px) * (cy - py) >= (cx - px) * (by - py);
}
__name(pointInTriangle, "pointInTriangle");
function isValidDiagonal(a, b) {
  const zeroLength = equals(a, b) && area(a.prev, a, a.next) > 0 && area(b.prev, b, b.next) > 0;
  return a.next.i !== b.i && (zeroLength || locallyInside(a, b) && locallyInside(b, a) && // // locally visible
  (area(a.prev, a, b.prev) !== 0 || area(a, b.prev, b) !== 0)) && // no opposite-facing sectors
  !intersectsPolygon(a, b) && (zeroLength || middleInside(a, b));
}
__name(isValidDiagonal, "isValidDiagonal");
function area(p, q, r) {
  return (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
}
__name(area, "area");
function equals(p1, p2) {
  return p1.x === p2.x && p1.y === p2.y;
}
__name(equals, "equals");
function intersects(p1, q1, p2, q2, includeBoundary = true) {
  const o1 = area(p1, q1, p2);
  const o2 = area(p1, q1, q2);
  const o3 = area(p2, q2, p1);
  const o4 = area(p2, q2, q1);
  if ((o1 > 0 && o2 < 0 || o1 < 0 && o2 > 0) && (o3 > 0 && o4 < 0 || o3 < 0 && o4 > 0)) return true;
  if (!includeBoundary) return false;
  if (o1 === 0 && onSegment(p1, p2, q1)) return true;
  if (o2 === 0 && onSegment(p1, q2, q1)) return true;
  if (o3 === 0 && onSegment(p2, p1, q2)) return true;
  if (o4 === 0 && onSegment(p2, q1, q2)) return true;
  return false;
}
__name(intersects, "intersects");
function onSegment(p, q, r) {
  return q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) && q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y);
}
__name(onSegment, "onSegment");
function intersectsPolygon(a, b) {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  let p = a;
  do {
    const n = p.next;
    if (p.x > maxX && n.x > maxX || p.x < minX && n.x < minX || p.y > maxY && n.y > maxY || p.y < minY && n.y < minY) {
      p = n;
      continue;
    }
    if (p.i !== a.i && n.i !== a.i && p.i !== b.i && n.i !== b.i && intersects(p, n, a, b)) return true;
    p = n;
  } while (p !== a);
  return false;
}
__name(intersectsPolygon, "intersectsPolygon");
function locallyInside(a, b) {
  return area(a.prev, a, a.next) < 0 ? area(a, b, a.next) >= 0 && area(a, a.prev, b) >= 0 : area(a, b, a.prev) < 0 || area(a, a.next, b) < 0;
}
__name(locallyInside, "locallyInside");
function middleInside(a, b) {
  let p = a;
  let inside = false;
  const px = (a.x + b.x) / 2;
  const py = (a.y + b.y) / 2;
  do {
    const n = p.next;
    if (p.y > py !== n.y > py && px < (n.x - p.x) * (py - p.y) / (n.y - p.y) + p.x)
      inside = !inside;
    p = n;
  } while (p !== a);
  return inside;
}
__name(middleInside, "middleInside");
function splitPolygon(a, b) {
  const a2 = createNode(a.i, a.x, a.y), b2 = createNode(b.i, b.x, b.y), an = a.next, bp = b.prev;
  a.next = b;
  b.prev = a;
  a2.next = an;
  an.prev = a2;
  b2.next = a2;
  a2.prev = b2;
  bp.next = b2;
  b2.prev = bp;
  return b2;
}
__name(splitPolygon, "splitPolygon");
function insertNode(i, x, y, last) {
  const p = createNode(i, x, y);
  if (!last) {
    p.prev = p;
    p.next = p;
  } else {
    p.next = last.next;
    p.prev = last;
    last.next.prev = p;
    last.next = p;
  }
  return p;
}
__name(insertNode, "insertNode");
function removeNode(p) {
  p.next.prev = p.prev;
  p.prev.next = p.next;
  if (p.prevZ) p.prevZ.nextZ = p.nextZ;
  if (p.nextZ) p.nextZ.prevZ = p.prevZ;
  if (indexActive) growBlock(p.prev, p.next);
}
__name(removeNode, "removeNode");
function createNode(i, x, y) {
  return (
    /** @type {Node} */
    /** @type {unknown} */
    {
      i,
      // vertex index in coordinates array
      x,
      y,
      // vertex coordinates
      prev: null,
      // previous and next vertex nodes in a polygon ring
      next: null,
      z: 0,
      // z-order curve value; doubles as owning block in the hole-bridge index during eliminateHoles
      prevZ: null,
      // previous and next nodes in z-order
      nextZ: null
    }
  );
}
__name(createNode, "createNode");
function signedArea(data, start, end, dim) {
  let sum = 0;
  for (let i = start, j = end - dim; i < end; i += dim) {
    sum += (data[j] - data[i]) * (data[i + 1] + data[j + 1]);
    j = i;
  }
  return sum;
}
__name(signedArea, "signedArea");

// src/lib/cad-v2/render/cad-stroke.ts
function tessellatePolylineWithWidth(vertices, isClosed = false, options = {}) {
  if (!vertices || vertices.length < 2) return null;
  const miterLimit = options.miterLimit ?? 3;
  const segments = [];
  const count = isClosed ? vertices.length : vertices.length - 1;
  let hasPositiveWidth = false;
  for (let i = 0; i < count; i++) {
    const vCurr = vertices[i];
    const vNext = vertices[(i + 1) % vertices.length];
    const p0 = vCurr.point;
    const p1 = vNext.point;
    const dx = p1[0] - p0[0];
    const dy = p1[1] - p0[1];
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) continue;
    const w0 = Math.max(0, vCurr.startWidth ?? 0);
    const w1 = Math.max(0, vCurr.endWidth ?? vCurr.startWidth ?? 0);
    if (w0 > 0 || w1 > 0) hasPositiveWidth = true;
    segments.push({
      p0,
      p1,
      dx,
      dy,
      len,
      nx: -dy / len,
      ny: dx / len,
      w0,
      w1
    });
  }
  if (segments.length === 0 || !hasPositiveWidth) return null;
  const triangles = [];
  const corners = [];
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    const h0 = s.w0 / 2;
    const h1 = s.w1 / 2;
    const l0 = [s.p0[0] + s.nx * h0, s.p0[1] + s.ny * h0];
    const r0 = [s.p0[0] - s.nx * h0, s.p0[1] - s.ny * h0];
    const l1 = [s.p1[0] + s.nx * h1, s.p1[1] + s.ny * h1];
    const r1 = [s.p1[0] - s.nx * h1, s.p1[1] - s.ny * h1];
    corners.push({ l0, r0, l1, r1 });
    triangles.push(
      l0[0],
      l0[1],
      r0[0],
      r0[1],
      l1[0],
      l1[1],
      r0[0],
      r0[1],
      r1[0],
      r1[1],
      l1[0],
      l1[1]
    );
  }
  const joinCount = isClosed ? segments.length : segments.length - 1;
  for (let i = 0; i < joinCount; i++) {
    const sA = segments[i];
    const sB = segments[(i + 1) % segments.length];
    const cA = corners[i];
    const cB = corners[(i + 1) % segments.length];
    const cross = sA.dx * sB.dy - sA.dy * sB.dx;
    const dot2 = (sA.dx * sB.dx + sA.dy * sB.dy) / (sA.len * sB.len);
    const clampedDot = Math.max(-1, Math.min(1, dot2));
    const angle = Math.acos(clampedDot);
    if (Math.abs(cross) < 1e-6 || angle < 1e-4) {
      continue;
    }
    const halfAngle = angle / 2;
    const miterRatio = Math.sin(halfAngle) > 1e-6 ? 1 / Math.sin(halfAngle) : miterLimit + 1;
    const pivot = sA.p1;
    if (cross > 0) {
      if (miterRatio <= miterLimit) {
        const mx = (sA.nx + sB.nx) / 2;
        const my = (sA.ny + sB.ny) / 2;
        const mLen = Math.hypot(mx, my);
        if (mLen > 1e-6) {
          const avgW = (sA.w1 + sB.w0) / 4;
          const miterPt = [pivot[0] - mx / mLen * avgW * miterRatio, pivot[1] - my / mLen * avgW * miterRatio];
          triangles.push(
            pivot[0],
            pivot[1],
            cA.r1[0],
            cA.r1[1],
            miterPt[0],
            miterPt[1],
            pivot[0],
            pivot[1],
            miterPt[0],
            miterPt[1],
            cB.r0[0],
            cB.r0[1]
          );
        } else {
          triangles.push(
            pivot[0],
            pivot[1],
            cA.r1[0],
            cA.r1[1],
            cB.r0[0],
            cB.r0[1]
          );
        }
      } else {
        triangles.push(
          pivot[0],
          pivot[1],
          cA.r1[0],
          cA.r1[1],
          cB.r0[0],
          cB.r0[1]
        );
      }
    } else {
      if (miterRatio <= miterLimit) {
        const mx = (sA.nx + sB.nx) / 2;
        const my = (sA.ny + sB.ny) / 2;
        const mLen = Math.hypot(mx, my);
        if (mLen > 1e-6) {
          const avgW = (sA.w1 + sB.w0) / 4;
          const miterPt = [pivot[0] + mx / mLen * avgW * miterRatio, pivot[1] + my / mLen * avgW * miterRatio];
          triangles.push(
            pivot[0],
            pivot[1],
            cA.l1[0],
            cA.l1[1],
            miterPt[0],
            miterPt[1],
            pivot[0],
            pivot[1],
            miterPt[0],
            miterPt[1],
            cB.l0[0],
            cB.l0[1]
          );
        } else {
          triangles.push(
            pivot[0],
            pivot[1],
            cA.l1[0],
            cA.l1[1],
            cB.l0[0],
            cB.l0[1]
          );
        }
      } else {
        triangles.push(
          pivot[0],
          pivot[1],
          cA.l1[0],
          cA.l1[1],
          cB.l0[0],
          cB.l0[1]
        );
      }
    }
  }
  return new Float64Array(triangles);
}
__name(tessellatePolylineWithWidth, "tessellatePolylineWithWidth");

// src/lib/cad-v2/compile/hatch-pattern-geometry.ts
var MAX_HATCH_PATTERN_LINES = 16;
var MAX_HATCH_PATTERN_FAMILY_LINES = 2048;
var MAX_HATCH_PATTERN_SEGMENTS = 5e4;
var MAX_HATCH_PATTERN_INTERSECTION_CHECKS = 5e5;
function buildHatchPatternSegments(hatch, rings) {
  const definitions = hatch.patternLines;
  const scale = hatch.patternScale ?? 1;
  const rotationDeg = hatch.patternAngleDeg ?? 0;
  if (!definitions?.length || definitions.length > MAX_HATCH_PATTERN_LINES || !Number.isFinite(scale) || scale <= 0 || !Number.isFinite(rotationDeg) || hatch.patternDouble === true || (hatch.hatchStyle ?? 0) !== 0 || rings.length === 0 || hatch.loops.some((loop) => loop.isClosed === false)) {
    return { status: "unsupported", segments: [] };
  }
  if (rings.some((ring) => ring.length < 3 || ring.some((point) => !Number.isFinite(point[0]) || !Number.isFinite(point[1])))) {
    return { status: "unsupported", segments: [] };
  }
  const segments = [];
  const totalBoundaryEdges = rings.reduce((sum, ring) => sum + ring.length, 0);
  let remainingIntersectionChecks = MAX_HATCH_PATTERN_INTERSECTION_CHECKS;
  const globalRotation = rotationDeg * Math.PI / 180;
  for (const definition of definitions) {
    if (!Number.isFinite(definition.angleRad) || !finitePair(definition.base) || !finitePair(definition.offset) || !Array.isArray(definition.dashLengths) || definition.dashLengths.length !== 0) {
      return { status: "unsupported", segments: [] };
    }
    const angle = definition.angleRad + globalRotation;
    const direction = [Math.cos(angle), Math.sin(angle)];
    const normal = [-direction[1], direction[0]];
    const base = rotate(definition.base, globalRotation);
    const spacing = Math.abs(definition.offset[1]);
    if (spacing <= 1e-10) return { status: "unsupported", segments: [] };
    const bounds = projectionBounds(rings, normal);
    const baseProjection = dot(base, normal);
    const firstIndex = Math.ceil((bounds.min - baseProjection) / spacing - 1e-10);
    const lastIndex = Math.floor((bounds.max - baseProjection) / spacing + 1e-10);
    const familyLineCount = Math.max(0, lastIndex - firstIndex + 1);
    if (!Number.isSafeInteger(firstIndex) || !Number.isSafeInteger(lastIndex) || familyLineCount > MAX_HATCH_PATTERN_FAMILY_LINES) {
      return { status: "limit", segments: [] };
    }
    const requestedIntersectionChecks = familyLineCount * totalBoundaryEdges;
    if (!Number.isSafeInteger(requestedIntersectionChecks) || requestedIntersectionChecks > remainingIntersectionChecks) {
      return { status: "limit", segments: [] };
    }
    remainingIntersectionChecks -= requestedIntersectionChecks;
    for (let lineIndex = firstIndex; lineIndex <= lastIndex; lineIndex++) {
      const origin = [
        base[0] + normal[0] * lineIndex * spacing,
        base[1] + normal[1] * lineIndex * spacing
      ];
      const intersections = [];
      for (const ring of rings) {
        for (let edgeIndex = 0; edgeIndex < ring.length; edgeIndex++) {
          const a = ring[edgeIndex];
          const b = ring[(edgeIndex + 1) % ring.length];
          const rawSideA = dot([a[0] - origin[0], a[1] - origin[1]], normal);
          const rawSideB = dot([b[0] - origin[0], b[1] - origin[1]], normal);
          const sideTolerance = Number.EPSILON * 32 * Math.max(
            1,
            Math.abs(a[0]),
            Math.abs(a[1]),
            Math.abs(b[0]),
            Math.abs(b[1]),
            Math.abs(origin[0]),
            Math.abs(origin[1])
          );
          const sideA = Math.abs(rawSideA) <= sideTolerance ? 0 : rawSideA;
          const sideB = Math.abs(rawSideB) <= sideTolerance ? 0 : rawSideB;
          if (!(sideA <= 0 && sideB > 0 || sideB <= 0 && sideA > 0)) continue;
          const edgeFraction = sideA / (sideA - sideB);
          const intersection = [
            a[0] + (b[0] - a[0]) * edgeFraction,
            a[1] + (b[1] - a[1]) * edgeFraction
          ];
          intersections.push(dot([intersection[0] - origin[0], intersection[1] - origin[1]], direction));
        }
      }
      intersections.sort((a, b) => a - b);
      const uniqueIntersections = intersections.filter((value, index) => index === 0 || Math.abs(value - intersections[index - 1]) > 1e-8 * Math.max(1, Math.abs(value)));
      if (uniqueIntersections.length % 2 !== 0) return { status: "unsupported", segments: [] };
      for (let index = 0; index < uniqueIntersections.length; index += 2) {
        const start = uniqueIntersections[index];
        const end = uniqueIntersections[index + 1];
        if (end - start <= 1e-9) continue;
        segments.push({
          x0: origin[0] + direction[0] * start,
          y0: origin[1] + direction[1] * start,
          x1: origin[0] + direction[0] * end,
          y1: origin[1] + direction[1] * end
        });
        if (segments.length > MAX_HATCH_PATTERN_SEGMENTS) return { status: "limit", segments: [] };
      }
    }
  }
  return { status: "rendered", segments };
}
__name(buildHatchPatternSegments, "buildHatchPatternSegments");
function projectionBounds(rings, normal) {
  let min = Infinity;
  let max = -Infinity;
  for (const ring of rings) {
    for (const point of ring) {
      const projection = dot(point, normal);
      min = Math.min(min, projection);
      max = Math.max(max, projection);
    }
  }
  return { min, max };
}
__name(projectionBounds, "projectionBounds");
function finitePair(value) {
  return Array.isArray(value) && value.length === 2 && Number.isFinite(value[0]) && Number.isFinite(value[1]);
}
__name(finitePair, "finitePair");
function rotate(point, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [point[0] * cosine - point[1] * sine, point[0] * sine + point[1] * cosine];
}
__name(rotate, "rotate");
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1];
}
__name(dot, "dot");

// src/lib/cad-v2/compile/geometry-compiler.ts
function ellipseSweep(startParam, endParam, ccw) {
  let sweep = endParam - startParam;
  if (ccw) {
    if (sweep <= 0) sweep += Math.PI * 2;
  } else if (sweep >= 0) {
    sweep -= Math.PI * 2;
  }
  return sweep;
}
__name(ellipseSweep, "ellipseSweep");
var MAX_CURVE_TESSELLATION_SEGMENTS = 1e6;
var MAX_HATCH_BOUNDARY_VALIDATION_VERTICES = 16384;
var MAX_HATCH_BOUNDARY_VALIDATION_COMPARISONS = 5e5;
function validateSimpleHatchBoundary(ring) {
  if (ring.length < 3 || ring.length > MAX_HATCH_BOUNDARY_VALIDATION_VERTICES || ring.some((point) => !Number.isFinite(point[0]) || !Number.isFinite(point[1]))) {
    return { valid: false, reason: ring.length > MAX_HATCH_BOUNDARY_VALIDATION_VERTICES ? "limit" : "invalid" };
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const point of ring) {
    minX = Math.min(minX, point[0]);
    maxX = Math.max(maxX, point[0]);
    minY = Math.min(minY, point[1]);
    maxY = Math.max(maxY, point[1]);
  }
  const scale = Math.max(maxX - minX, maxY - minY);
  const coordinateTolerance = scale * Number.EPSILON * 64;
  const crossTolerance = scale * scale * Number.EPSILON * 64;
  if (!Number.isFinite(scale) || scale <= 0 || !Number.isFinite(coordinateTolerance) || !Number.isFinite(crossTolerance)) {
    return { valid: false, reason: "invalid" };
  }
  const anchor = ring[0];
  let twiceArea = 0;
  for (let index = 0; index < ring.length; index++) {
    const current = ring[index];
    const next = ring[(index + 1) % ring.length];
    if (Math.hypot(next[0] - current[0], next[1] - current[1]) <= coordinateTolerance) {
      return { valid: false, reason: "invalid" };
    }
    twiceArea += (current[0] - anchor[0]) * (next[1] - anchor[1]) - (next[0] - anchor[0]) * (current[1] - anchor[1]);
  }
  if (!Number.isFinite(twiceArea) || Math.abs(twiceArea) <= crossTolerance) {
    return { valid: false, reason: "invalid" };
  }
  const orientation = /* @__PURE__ */ __name((a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]), "orientation");
  const onSegment2 = /* @__PURE__ */ __name((a, b, p) => p[0] >= Math.min(a[0], b[0]) - coordinateTolerance && p[0] <= Math.max(a[0], b[0]) + coordinateTolerance && p[1] >= Math.min(a[1], b[1]) - coordinateTolerance && p[1] <= Math.max(a[1], b[1]) + coordinateTolerance, "onSegment");
  const intersects2 = /* @__PURE__ */ __name((a, b, c, d) => {
    if (Math.max(a[0], b[0]) + coordinateTolerance < Math.min(c[0], d[0]) || Math.max(c[0], d[0]) + coordinateTolerance < Math.min(a[0], b[0]) || Math.max(a[1], b[1]) + coordinateTolerance < Math.min(c[1], d[1]) || Math.max(c[1], d[1]) + coordinateTolerance < Math.min(a[1], b[1])) return false;
    const o1 = orientation(a, b, c), o2 = orientation(a, b, d);
    const o3 = orientation(c, d, a), o4 = orientation(c, d, b);
    if ((o1 > crossTolerance && o2 < -crossTolerance || o1 < -crossTolerance && o2 > crossTolerance) && (o3 > crossTolerance && o4 < -crossTolerance || o3 < -crossTolerance && o4 > crossTolerance)) return true;
    return Math.abs(o1) <= crossTolerance && onSegment2(a, b, c) || Math.abs(o2) <= crossTolerance && onSegment2(a, b, d) || Math.abs(o3) <= crossTolerance && onSegment2(c, d, a) || Math.abs(o4) <= crossTolerance && onSegment2(c, d, b);
  }, "intersects");
  const segments = ring.map((start, index) => {
    const end = ring[(index + 1) % ring.length];
    return {
      index,
      start,
      end,
      minX: Math.min(start[0], end[0]),
      maxX: Math.max(start[0], end[0]),
      minY: Math.min(start[1], end[1]),
      maxY: Math.max(start[1], end[1])
    };
  }).sort((a, b) => a.minX - b.minX);
  let active = [];
  let comparisons = 0;
  for (const segment of segments) {
    active = active.filter((candidate) => candidate.maxX + coordinateTolerance >= segment.minX);
    for (const candidate of active) {
      if (++comparisons > MAX_HATCH_BOUNDARY_VALIDATION_COMPARISONS) return { valid: false, reason: "limit" };
      if (candidate.index === segment.index || (candidate.index + 1) % ring.length === segment.index || (segment.index + 1) % ring.length === candidate.index) continue;
      if (candidate.maxY + coordinateTolerance < segment.minY || segment.maxY + coordinateTolerance < candidate.minY) continue;
      if (intersects2(candidate.start, candidate.end, segment.start, segment.end)) return { valid: false, reason: "invalid" };
    }
    active.push(segment);
  }
  return { valid: true };
}
__name(validateSimpleHatchBoundary, "validateSimpleHatchBoundary");
function boundedSegmentLimit(maxSegments) {
  return Number.isFinite(maxSegments) ? Math.min(MAX_CURVE_TESSELLATION_SEGMENTS, Math.max(1, Math.floor(maxSegments))) : MAX_CURVE_TESSELLATION_SEGMENTS;
}
__name(boundedSegmentLimit, "boundedSegmentLimit");
var GeometryCompiler = class {
  static {
    __name(this, "GeometryCompiler");
  }
  /**
   * 1. Uyarlamalı (Adaptive) Yay (ARC) Tessellation
   * Hata sınırı (sagitta): s = r * (1 - cos(theta / 2)) <= maxError
   * theta <= 2 * acos(1 - maxError / r)
   */
  static tessellateArc(center, radius, startAngleRad, endAngleRad, isClockwise = false, maxError = 0.25) {
    return this.tessellateArcWithBudget(center, radius, startAngleRad, endAngleRad, isClockwise, maxError).points;
  }
  /**
   * Computes an arc tessellation without silently claiming a tolerance after a
   * resource cap is hit. Callers that need proof of visual accuracy should
   * inspect `errorBoundMet`; the legacy points-only API remains compatible.
   */
  static tessellateArcWithBudget(center, radius, startAngleRad, endAngleRad, isClockwise = false, maxError = 0.25, maxSegments = 1e6) {
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
    const safeRadius = Math.abs(radius);
    const requestedError = Number.isFinite(maxError) && maxError > 0 ? maxError : 1e-5;
    const safeError = Math.min(safeRadius * 0.5, requestedError);
    const maxDeltaTheta = 2 * Math.asin(Math.sqrt(safeError * (2 * safeRadius - safeError) / (safeRadius * safeRadius)));
    const requestedSegments = Math.max(1, Math.ceil(Math.abs(sweep) / maxDeltaTheta));
    const segmentLimit = boundedSegmentLimit(maxSegments);
    const segCount = Math.min(requestedSegments, segmentLimit);
    const points = [];
    for (let i = 0; i <= segCount; i++) {
      const theta = startAngleRad + sweep * i / segCount;
      points.push([
        center[0] + radius * Math.cos(theta),
        center[1] + radius * Math.sin(theta)
      ]);
    }
    const actualDelta = Math.abs(sweep) / segCount;
    const maxSagittaWorld = 2 * safeRadius * Math.sin(actualDelta / 4) ** 2;
    return {
      points,
      requestedSegments,
      segmentCount: segCount,
      maxSagittaWorld,
      errorBoundMet: requestedSegments <= segmentLimit && maxSagittaWorld <= requestedError * (1 + 1e-12)
    };
  }
  /**
   * 2. Çember (CIRCLE) Tessellation
   */
  static tessellateCircle(center, radius, maxError = 0.25) {
    return this.tessellateArc(center, radius, 0, Math.PI * 2, false, maxError);
  }
  /**
   * 3. Elips (ELLIPSE) Tessellation
   * Parametrik denklem: P(t) = Center + cos(t)*majorVector + sin(t)*minorVector
   */
  static tessellateEllipse(center, majorVector, axisRatio, startParam = 0, endParam = Math.PI * 2, maxError = 0.25) {
    return this.tessellateEllipseWithBudget(center, majorVector, axisRatio, startParam, endParam, maxError).points;
  }
  /** Conservative interpolation-error bound from max |P''(t)| for an ellipse. */
  static tessellateEllipseWithBudget(center, majorVector, axisRatio, startParam = 0, endParam = Math.PI * 2, maxError = 0.25, maxSegments = 1e6, ccw = true) {
    const ux = majorVector[0];
    const uy = majorVector[1];
    const majorLen = Math.hypot(ux, uy);
    if (majorLen <= 1e-9 || !Number.isFinite(majorLen)) {
      return { points: [center], requestedSegments: 0, segmentCount: 0, maxSagittaWorld: 0, errorBoundMet: true };
    }
    const safeRatio = Math.max(1e-6, Math.min(1, axisRatio));
    const vx = -uy * safeRatio;
    const vy = ux * safeRatio;
    const sweep = ellipseSweep(startParam, endParam, ccw);
    const requestedError = Number.isFinite(maxError) && maxError > 0 ? maxError : 1e-5;
    const requestedSegments = Math.max(1, Math.ceil(Math.abs(sweep) * Math.sqrt(majorLen / (8 * requestedError))));
    const segmentLimit = boundedSegmentLimit(maxSegments);
    const segCount = Math.min(requestedSegments, segmentLimit);
    const points = [];
    for (let i = 0; i <= segCount; i++) {
      const t = startParam + sweep * i / segCount;
      const cosT = Math.cos(t);
      const sinT = Math.sin(t);
      points.push([
        center[0] + cosT * ux + sinT * vx,
        center[1] + cosT * uy + sinT * vy
      ]);
    }
    const maxSagittaWorld = majorLen * (sweep / segCount) ** 2 / 8;
    return {
      points,
      requestedSegments,
      segmentCount: segCount,
      maxSagittaWorld,
      errorBoundMet: requestedSegments <= segmentLimit && maxSagittaWorld <= requestedError * (1 + 1e-12)
    };
  }
  /**
   * 4. Bulge (Yay Bombesi) Segmenti Tessellation
   * Bulge = tan(sweep / 4)
   */
  static tessellateBulgeSegment(p1, p2, bulge, maxError = 0.25) {
    return this.tessellateBulgeSegmentWithBudget(p1, p2, bulge, maxError).points;
  }
  static tessellateBulgeSegmentWithBudget(p1, p2, bulge, maxError = 0.25, maxSegments = 1e6) {
    if (Math.abs(bulge) < 1e-6) {
      return { points: [p1, p2], requestedSegments: 1, segmentCount: 1, maxSagittaWorld: 0, errorBoundMet: true };
    }
    const arc = this.getBulgeArcParameters(p1, p2, bulge);
    if (!arc) {
      return { points: [p1, p2], requestedSegments: 1, segmentCount: 1, maxSagittaWorld: 0, errorBoundMet: true };
    }
    return this.tessellateArcWithBudget(
      arc.center,
      arc.radius,
      arc.startAngleRad,
      arc.startAngleRad + arc.sweepRad,
      arc.sweepRad < 0,
      maxError,
      maxSegments
    );
  }
  static getBulgeArcParameters(p1, p2, bulge) {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const chordLen = Math.hypot(dx, dy);
    if (!Number.isFinite(bulge) || Math.abs(bulge) < 1e-6 || chordLen < 1e-9 || !Number.isFinite(chordLen)) return null;
    const radius = chordLen * (1 + bulge * bulge) / (4 * Math.abs(bulge));
    const sweepRad = 4 * Math.atan(bulge);
    const midpointX = (p1[0] + p2[0]) / 2;
    const midpointY = (p1[1] + p2[1]) / 2;
    const normalX = -dy / chordLen;
    const normalY = dx / chordLen;
    const centerOffset = chordLen / 2 * ((1 - bulge * bulge) / (2 * bulge));
    const center = [midpointX + normalX * centerOffset, midpointY + normalY * centerOffset];
    if (![...center, radius, sweepRad].every(Number.isFinite) || radius <= 0 || sweepRad === 0) return null;
    return { center, radius, startAngleRad: Math.atan2(p1[1] - center[1], p1[0] - center[0]), sweepRad };
  }
  /**
   * 5. LWPOLYLINE Açılımı (Bulge ve Genişlik Desteği)
   */
  static expandLwPolyline(entity, maxCurveSegments = 65536, maxCurveErrorWorld = 0.25) {
    const v = entity.vertices;
    if (!v || v.length < 2) return { lineSegments: [], thickTriangles: null, polyPoints: [], refinementLimitReached: false };
    const polyPoints = [];
    const polyVertWidths = [];
    const segmentCurveSources = [];
    const segmentBulgeErrors = [];
    let refinementLimitReached = false;
    const count = entity.isClosed ? v.length : v.length - 1;
    for (let i = 0; i < count; i++) {
      const vCurr = v[i];
      const nextIdx = (i + 1) % v.length;
      const vNext = v[nextIdx];
      const pxCurr = typeof vCurr.x === "number" ? vCurr.x : vCurr.point?.[0] ?? 0;
      const pyCurr = typeof vCurr.y === "number" ? vCurr.y : vCurr.point?.[1] ?? 0;
      const pxNext = typeof vNext.x === "number" ? vNext.x : vNext.point?.[0] ?? 0;
      const pyNext = typeof vNext.y === "number" ? vNext.y : vNext.point?.[1] ?? 0;
      const pCurrent = [pxCurr, pyCurr];
      const pNext = [pxNext, pyNext];
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
            endWidth: interpolatedW
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
            segmentIndex
          } : void 0);
          segmentBulgeErrors.push(Number.isFinite(arcResult.maxSagittaWorld) ? arcResult.maxSagittaWorld : void 0);
        }
      } else {
        if (polyPoints.length === 0) {
          polyPoints.push(pCurrent);
          polyVertWidths.push({ point: pCurrent, startWidth: sw, endWidth: ew });
        }
        polyPoints.push(pNext);
        polyVertWidths.push({ point: pNext, startWidth: sw, endWidth: ew });
        segmentCurveSources.push(void 0);
        segmentBulgeErrors.push(void 0);
      }
    }
    const lineSegments = [];
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
        ...Number.isFinite(segmentBulgeErrors[i]) ? { bulgeCurveTessellationErrorWorld: segmentBulgeErrors[i] } : {}
      });
    }
    let thickTriangles = null;
    const thickVerts = tessellatePolylineWithWidth(polyVertWidths, entity.isClosed);
    if (thickVerts && thickVerts.length > 0) {
      thickTriangles = {
        vertices: thickVerts,
        layer: entity.layer,
        order: entity.order,
        alpha: 1
      };
    }
    return { lineSegments, thickTriangles, polyPoints, refinementLimitReached };
  }
  /**
   * 6. De Boor Algoritması ile B-Spline / NURBS Tessellation
   */
  static tessellateSpline(spline, maxError = 0.25) {
    return this.tessellateSplineWithBudget(spline, maxError).points;
  }
  /**
   * Convert each B-spline knot span to rational Bezier form by knot insertion,
   * then subdivide its homogeneous control polygon until the convex-hull
   * distance to the output chord is within the requested world-space budget.
   */
  static tessellateSplineWithBudget(spline, maxError = 0.25, maxSegments = 65536, maxDepth = 32) {
    const invalid = /* @__PURE__ */ __name(() => ({
      points: [],
      requestedSegments: 0,
      segmentCount: 0,
      maxSagittaWorld: Infinity,
      errorBoundMet: false,
      invalidInput: true
    }), "invalid");
    const cp = spline.controlPoints;
    const degree = spline.degree;
    const knots = spline.knots;
    const segmentLimit = boundedSegmentLimit(maxSegments);
    if (!Number.isInteger(degree) || degree < 1 || degree > 16 || !Array.isArray(cp) || cp.length < degree + 1 || !Array.isArray(knots) || knots.length !== cp.length + degree + 1 || !Number.isFinite(maxError) || maxError <= 0 || cp.some((pt) => !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) || knots.some((knot, index) => !Number.isFinite(knot) || index > 0 && knot < knots[index - 1])) return invalid();
    const weights = spline.weights || new Array(cp.length).fill(1);
    if (weights.length !== cp.length || weights.some((weight) => !Number.isFinite(weight) || weight <= 0)) return invalid();
    const domainStart = knots[degree];
    const domainEnd = knots[cp.length];
    if (!(domainEnd > domainStart)) return invalid();
    const homogeneousControls = cp.map((point, index) => [
      point[0] * weights[index],
      point[1] * weights[index],
      weights[index]
    ]);
    const spans = [];
    const euclidean = /* @__PURE__ */ __name((point) => [point[0] / point[2], point[1] / point[2]], "euclidean");
    const sourceFitErrorBySpan = [];
    if (spline.isPeriodic) {
      let evaluateHomogeneousOnSpan2 = function(spanIndex, parameter) {
        const work = homogeneousControls.slice(spanIndex - degree, spanIndex + 1).map((point) => [...point]);
        for (let level = 1; level <= degree; level++) {
          for (let index = degree; index >= level; index--) {
            const knotIndex = spanIndex - degree + index;
            const denominator = knots[knotIndex + degree - level + 1] - knots[knotIndex];
            const alpha = denominator === 0 ? 0 : (parameter - knots[knotIndex]) / denominator;
            const left = work[index - 1];
            const right = work[index];
            work[index] = [
              (1 - alpha) * left[0] + alpha * right[0],
              (1 - alpha) * left[1] + alpha * right[1],
              (1 - alpha) * left[2] + alpha * right[2]
            ];
          }
        }
        return work[degree];
      }, bernstein2 = function(index, parameter) {
        let coefficient = 1;
        for (let factor = 1; factor <= index; factor++) coefficient *= (degree - index + factor) / factor;
        if (parameter === 0) return index === 0 ? 1 : 0;
        if (parameter === 1) return index === degree ? 1 : 0;
        return coefficient * parameter ** index * (1 - parameter) ** (degree - index);
      }, solveBezierControls2 = function(samples) {
        const width = degree + 1;
        const matrix = fitParameters.map((parameter, row) => [
          ...Array.from({ length: width }, (_, column) => bernstein2(column, parameter)),
          ...samples[row]
        ]);
        for (let column = 0; column < width; column++) {
          let pivot = column;
          for (let row = column + 1; row < width; row++) {
            if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) pivot = row;
          }
          if (Math.abs(matrix[pivot][column]) <= Number.EPSILON * 16) return null;
          [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
          const pivotValue = matrix[column][column];
          for (let entry = column; entry < width + 3; entry++) matrix[column][entry] = matrix[column][entry] / pivotValue;
          for (let row = 0; row < width; row++) {
            if (row === column) continue;
            const factor = matrix[row][column];
            for (let entry = column; entry < width + 3; entry++) {
              matrix[row][entry] = matrix[row][entry] - factor * matrix[column][entry];
            }
          }
        }
        return Array.from({ length: width }, (_, index) => [
          matrix[index][width],
          matrix[index][width + 1],
          matrix[index][width + 2]
        ]);
      }, evaluateBezier2 = function(control, parameter) {
        const work = control.map((point) => [...point]);
        for (let level = 1; level < control.length; level++) {
          for (let index = 0; index < control.length - level; index++) {
            work[index] = [
              (1 - parameter) * work[index][0] + parameter * work[index + 1][0],
              (1 - parameter) * work[index][1] + parameter * work[index + 1][1],
              (1 - parameter) * work[index][2] + parameter * work[index + 1][2]
            ];
          }
        }
        return work[0];
      };
      var evaluateHomogeneousOnSpan = evaluateHomogeneousOnSpan2, bernstein = bernstein2, solveBezierControls = solveBezierControls2, evaluateBezier = evaluateBezier2;
      __name(evaluateHomogeneousOnSpan2, "evaluateHomogeneousOnSpan");
      __name(bernstein2, "bernstein");
      __name(solveBezierControls2, "solveBezierControls");
      __name(evaluateBezier2, "evaluateBezier");
      const coordinateScale = Math.max(1, ...cp.flatMap((point) => [Math.abs(point[0]), Math.abs(point[1])]));
      const positionTolerance = 512 * Number.EPSILON * coordinateScale;
      const weightScale = Math.max(1, ...weights.map(Math.abs));
      const weightTolerance = 512 * Number.EPSILON * weightScale;
      const knotScale = Math.max(1, ...knots.map(Math.abs));
      const knotTolerance = 512 * Number.EPSILON * knotScale;
      const uniqueControlCount = cp.length - degree;
      const period = domainEnd - domainStart;
      if (degree > 8 || uniqueControlCount < degree + 1 || homogeneousControls.some((point) => point.some((value) => !Number.isFinite(value)))) return invalid();
      for (let index = 0; index < degree; index++) {
        const head = cp[index];
        const tail = cp[cp.length - degree + index];
        if (Math.hypot(head[0] - tail[0], head[1] - tail[1]) > positionTolerance || Math.abs(weights[index] - weights[weights.length - degree + index]) > weightTolerance) return invalid();
      }
      for (let index = 0; index + uniqueControlCount < knots.length; index++) {
        if (Math.abs(knots[index + uniqueControlCount] - knots[index] - period) > knotTolerance) return invalid();
      }
      const sampleCount = degree + 1;
      const fitParameters = Array.from({ length: sampleCount }, (_, index) => (1 - Math.cos(Math.PI * index / degree)) / 2);
      const fitNoiseAllowance = 2048 * Number.EPSILON * coordinateScale * (degree + 1) ** 2;
      for (let spanIndex = degree; spanIndex < cp.length; spanIndex++) {
        const startParam = knots[spanIndex];
        const endParam = knots[spanIndex + 1];
        if (!(endParam > startParam) || startParam < domainStart || endParam > domainEnd) continue;
        const controlPolygon = solveBezierControls2(fitParameters.map((parameter) => evaluateHomogeneousOnSpan2(spanIndex, startParam + (endParam - startParam) * parameter)));
        if (!controlPolygon || controlPolygon.some((point) => point[2] <= 0 || point.some((value) => !Number.isFinite(value)))) return invalid();
        let fitError = 0;
        const validationCount = degree * 2 + 3;
        for (let index = 0; index < validationCount; index++) {
          const parameter = (1 - Math.cos(Math.PI * index / (validationCount - 1))) / 2;
          const sourcePoint = euclidean(evaluateHomogeneousOnSpan2(spanIndex, startParam + (endParam - startParam) * parameter));
          const bezierPoint = euclidean(evaluateBezier2(controlPolygon, parameter));
          fitError = Math.max(fitError, Math.hypot(sourcePoint[0] - bezierPoint[0], sourcePoint[1] - bezierPoint[1]));
        }
        if (!Number.isFinite(fitError) || fitError > fitNoiseAllowance) return invalid();
        spans.push({ controlPolygon, startParam, endParam });
        sourceFitErrorBySpan.push(fitError + fitNoiseAllowance);
      }
    } else {
      let multiplicity2 = function(value) {
        return refinedKnots.reduce((count, knot) => count + (knot === value ? 1 : 0), 0);
      }, insertKnot2 = function(value) {
        const n = refinedControls.length - 1;
        const s = multiplicity2(value);
        let k = degree;
        while (k < n && refinedKnots[k + 1] <= value) k++;
        if (s >= degree || k - degree < 0 || k - s < 0) return false;
        const next = new Array(refinedControls.length + 1);
        for (let i = 0; i <= k - degree; i++) next[i] = refinedControls[i];
        for (let i = k - s; i <= n; i++) next[i + 1] = refinedControls[i];
        for (let i = k - degree + 1; i <= k - s; i++) {
          const denominator = refinedKnots[i + degree] - refinedKnots[i];
          if (denominator <= 0) return false;
          const alpha = (value - refinedKnots[i]) / denominator;
          const a = refinedControls[i - 1];
          const b = refinedControls[i];
          next[i] = [
            (1 - alpha) * a[0] + alpha * b[0],
            (1 - alpha) * a[1] + alpha * b[1],
            (1 - alpha) * a[2] + alpha * b[2]
          ];
        }
        if (next.some((point) => !point)) return false;
        refinedControls = next;
        refinedKnots.splice(k + 1, 0, value);
        return true;
      };
      var multiplicity = multiplicity2, insertKnot = insertKnot2;
      __name(multiplicity2, "multiplicity");
      __name(insertKnot2, "insertKnot");
      const refinedKnots = [...knots];
      let refinedControls = homogeneousControls;
      const internalValues = [...new Set(knots.filter((knot) => knot > domainStart && knot < domainEnd))];
      for (const knot of internalValues) {
        while (multiplicity2(knot) < degree) {
          if (!insertKnot2(knot)) return invalid();
        }
      }
      for (let span = degree; span < refinedControls.length; span++) {
        if (refinedKnots[span + 1] <= refinedKnots[span]) continue;
        if (refinedKnots[span] < domainStart || refinedKnots[span + 1] > domainEnd) continue;
        const controlPolygon = refinedControls.slice(span - degree, span + 1);
        if (controlPolygon.length !== degree + 1 || controlPolygon.some((point) => point[2] <= 0)) return invalid();
        spans.push({
          controlPolygon,
          startParam: refinedKnots[span],
          endParam: refinedKnots[span + 1]
        });
        sourceFitErrorBySpan.push(0);
      }
    }
    if (spans.length === 0) return invalid();
    if (spline.isPeriodic) {
      const first = euclidean(spans[0].controlPolygon[0]);
      const last = euclidean(spans[spans.length - 1].controlPolygon.at(-1));
      const coordinateScale = Math.max(1, ...cp.flatMap((point) => [Math.abs(point[0]), Math.abs(point[1])]));
      const closureTolerance = 512 * Number.EPSILON * coordinateScale;
      if (Math.hypot(first[0] - last[0], first[1] - last[1]) > closureTolerance + sourceFitErrorBySpan[0] + sourceFitErrorBySpan.at(-1)) return invalid();
    }
    function pointSegmentDistance(point, start, end) {
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const length2 = dx * dx + dy * dy;
      if (length2 <= Number.EPSILON) return Math.hypot(point[0] - start[0], point[1] - start[1]);
      const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / length2));
      return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
    }
    __name(pointSegmentDistance, "pointSegmentDistance");
    function splitBezier(control) {
      const levels = [control.map((point) => [...point])];
      while (levels[levels.length - 1].length > 1) {
        const previous = levels[levels.length - 1];
        const next = [];
        for (let i = 0; i + 1 < previous.length; i++) {
          next.push([
            (previous[i][0] + previous[i + 1][0]) / 2,
            (previous[i][1] + previous[i + 1][1]) / 2,
            (previous[i][2] + previous[i + 1][2]) / 2
          ]);
        }
        levels.push(next);
      }
      return [levels.map((level) => level[0]), levels.map((level) => level[level.length - 1]).reverse()];
    }
    __name(splitBezier, "splitBezier");
    const resultPoints = [];
    const splineBezierSpans = [];
    let segmentCount = 0;
    let requestedSegments = 0;
    let maxDeviation = 0;
    let errorBoundMet = true;
    const refine = /* @__PURE__ */ __name((control, depth, startParam, endParam, spanPoints, spanParameters, sourceFitErrorWorld) => {
      if (!errorBoundMet) return;
      const first = euclidean(control[0]);
      const last = euclidean(control[control.length - 1]);
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
    }, "refine");
    for (let spanIndex = 0; spanIndex < spans.length; spanIndex++) {
      const span = spans[spanIndex];
      const firstPoint = euclidean(span.controlPolygon[0]);
      const spanPoints = [firstPoint];
      const spanParameters = [0];
      if (resultPoints.length === 0) resultPoints.push(firstPoint);
      refine(span.controlPolygon, 0, 0, 1, spanPoints, spanParameters, sourceFitErrorBySpan[spanIndex]);
      if (!errorBoundMet) break;
      splineBezierSpans.push({
        spanIndex,
        points: spanPoints,
        parameters: spanParameters,
        source: {
          controlPoints: span.controlPolygon.map((point) => euclidean(point)),
          weights: span.controlPolygon.map((point) => point[2])
        }
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
      ...errorBoundMet ? { splineBezierSpans } : {}
    };
  }
  /**
   * 7. HATCH Üçgenleme (earcut 3.2.3 ile delik ve iç ada desteği)
   */
  static triangulateHatch(hatch, maxCurveSegments = 65536, maxCurveErrorWorld = 0.25) {
    const boundaryLines = [];
    let refinementLimitReached = false;
    let invalidCurveGeometry = false;
    let invalidBoundaryGeometry = false;
    let boundaryValidationLimitReached = false;
    let maxBoundaryTessellationErrorWorld = 0;
    const includeBoundaryError = /* @__PURE__ */ __name((result) => {
      if (Number.isFinite(result.maxSagittaWorld)) {
        maxBoundaryTessellationErrorWorld = Math.max(maxBoundaryTessellationErrorWorld, result.maxSagittaWorld);
      }
      if (!result.errorBoundMet) refinementLimitReached = true;
    }, "includeBoundaryError");
    if (!hatch.loops || hatch.loops.length === 0) {
      return {
        mesh: null,
        boundaryLines,
        refinementLimitReached,
        invalidCurveGeometry,
        invalidBoundaryGeometry,
        boundaryValidationLimitReached,
        maxBoundaryTessellationErrorWorld
      };
    }
    const polygonRings = [];
    const polygonCurveSources = [];
    const polygonCurveErrors = [];
    const sourceHandle = hatch.handle || "hatch_spline";
    for (let loopIndex = 0; loopIndex < hatch.loops.length; loopIndex++) {
      const loop = hatch.loops[loopIndex];
      const ring = [];
      const ringCurveSources = [];
      const ringCurveErrors = [];
      const appendCurvePoints = /* @__PURE__ */ __name((points, curve, parameters, tessellationErrorWorld) => {
        const segmentCount = points.length - 1;
        for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
          ring.push(points[segmentIndex]);
          if (curve && segmentCount > 0) {
            ringCurveSources.push({
              ...curve,
              startParam: parameters?.[segmentIndex] ?? curve.startParam + (curve.endParam - curve.startParam) * segmentIndex / segmentCount,
              endParam: parameters?.[segmentIndex + 1] ?? curve.startParam + (curve.endParam - curve.startParam) * (segmentIndex + 1) / segmentCount,
              segmentIndex
            });
          } else {
            ringCurveSources.push(void 0);
          }
          ringCurveErrors.push(Number.isFinite(tessellationErrorWorld) ? tessellationErrorWorld : void 0);
        }
      }, "appendCurvePoints");
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
              endParam: arc.startAngleRad + arc.sweepRad
            } : void 0, void 0, arcResult.maxSagittaWorld);
          } else {
            ring.push(pCurrent);
            ringCurveSources.push(void 0);
            ringCurveErrors.push(void 0);
          }
        }
      } else if (loop.edges) {
        for (let edgeIndex = 0; edgeIndex < loop.edges.length; edgeIndex++) {
          const edge = loop.edges[edgeIndex];
          if (edge.type === "LINE") {
            ring.push(edge.start);
            ringCurveSources.push(void 0);
          } else if (edge.type === "ARC") {
            let sweep = edge.endAngleRad - edge.startAngleRad;
            if (edge.ccw) {
              if (sweep < 0) sweep += Math.PI * 2;
            } else if (sweep > 0) {
              sweep -= Math.PI * 2;
            }
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
              endParam: edge.startAngleRad + sweep
            }, void 0, arcResult.maxSagittaWorld);
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
            const validEllipseSource = Number.isFinite(edge.center[0]) && Number.isFinite(edge.center[1]) && Number.isFinite(edge.majorAxisVector[0]) && Number.isFinite(edge.majorAxisVector[1]) && Number.isFinite(majorLength) && majorLength > 1e-9 && Number.isFinite(edge.axisRatio) && edge.axisRatio > 0 && edge.axisRatio <= 1 && Number.isFinite(edge.startParam) && Number.isFinite(edge.endParam);
            const sweep = ellipseSweep(edge.startParam, edge.endParam, edge.ccw);
            appendCurvePoints(ellipseResult.points, validEllipseSource ? {
              curveId: `${sourceHandle}:HATCH:${loopIndex}:ELLIPSE:${edgeIndex}`,
              sourceHandle,
              sourceType: "ELLIPSE",
              center: edge.center,
              basisU: edge.majorAxisVector,
              basisV: [-edge.majorAxisVector[1] * ratio, edge.majorAxisVector[0] * ratio],
              startParam: edge.startParam,
              endParam: edge.startParam + sweep
            } : void 0, void 0, ellipseResult.maxSagittaWorld);
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
              order: hatch.order
            }, maxCurveErrorWorld, maxCurveSegments);
            includeBoundaryError(splineResult);
            if (splineResult.invalidInput) invalidCurveGeometry = true;
            if (splineResult.splineBezierSpans) {
              for (const span of splineResult.splineBezierSpans) {
                appendCurvePoints(span.points, {
                  curveId: `${sourceHandle}:HATCH:${loopIndex}:SPLINE:${edgeIndex}:SPAN:${span.spanIndex}`,
                  sourceHandle,
                  sourceType: "SPLINE",
                  center: span.source.controlPoints[0],
                  basisU: [1, 0],
                  basisV: [0, 1],
                  startParam: 0,
                  endParam: 1,
                  splineSource: span.source
                }, span.parameters, splineResult.maxSagittaWorld);
              }
            } else {
              appendCurvePoints(splineResult.points, void 0, void 0, splineResult.maxSagittaWorld);
            }
          }
        }
      }
      if (invalidCurveGeometry) return {
        mesh: null,
        boundaryLines: [],
        refinementLimitReached,
        invalidCurveGeometry,
        invalidBoundaryGeometry,
        boundaryValidationLimitReached,
        maxBoundaryTessellationErrorWorld
      };
      if (ring.length > 2) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (Math.hypot(first[0] - last[0], first[1] - last[1]) < 1e-5) {
          ring.pop();
          ringCurveSources.pop();
          ringCurveErrors.pop();
        }
      }
      if (ring.some((point) => !Number.isFinite(point[0]) || !Number.isFinite(point[1]))) {
        return {
          mesh: null,
          boundaryLines: [],
          refinementLimitReached,
          invalidCurveGeometry,
          invalidBoundaryGeometry: true,
          boundaryValidationLimitReached,
          maxBoundaryTessellationErrorWorld
        };
      }
      if (ring.length < 3) {
        invalidBoundaryGeometry = true;
        continue;
      }
      const validation = validateSimpleHatchBoundary(ring);
      if (validation.valid === false) {
        invalidBoundaryGeometry = true;
        if (validation.reason === "limit") boundaryValidationLimitReached = true;
        if (ring.length > MAX_HATCH_BOUNDARY_VALIDATION_VERTICES) {
          return {
            mesh: null,
            boundaryLines: [],
            refinementLimitReached,
            invalidCurveGeometry,
            invalidBoundaryGeometry,
            boundaryValidationLimitReached,
            maxBoundaryTessellationErrorWorld
          };
        }
      }
      polygonRings.push(ring);
      polygonCurveSources.push(ringCurveSources);
      polygonCurveErrors.push(ringCurveErrors);
    }
    if (polygonRings.length === 0) {
      return {
        mesh: null,
        boundaryLines,
        refinementLimitReached,
        invalidCurveGeometry,
        invalidBoundaryGeometry,
        boundaryValidationLimitReached,
        maxBoundaryTessellationErrorWorld
      };
    }
    function ringArea(ring) {
      let area2 = 0;
      for (let i = 0; i < ring.length; i++) {
        const p1 = ring[i];
        const p2 = ring[(i + 1) % ring.length];
        area2 += p1[0] * p2[1] - p2[0] * p1[1];
      }
      return area2 / 2;
    }
    __name(ringArea, "ringArea");
    function pointInPolygon(pt, ring) {
      let inside = false;
      const x = pt[0], y = pt[1];
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        const intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    }
    __name(pointInPolygon, "pointInPolygon");
    for (let ringIndex = 0; ringIndex < polygonRings.length; ringIndex++) {
      const ring = polygonRings[ringIndex];
      const curveSources = polygonCurveSources[ringIndex];
      const curveErrors = polygonCurveErrors[ringIndex];
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
          ...Number.isFinite(curveErrors[i]) ? { hatchBoundaryTessellationErrorWorld: curveErrors[i] } : {}
        });
      }
    }
    if (invalidBoundaryGeometry) {
      return {
        mesh: null,
        boundaryLines,
        refinementLimitReached,
        invalidCurveGeometry,
        invalidBoundaryGeometry,
        boundaryValidationLimitReached,
        maxBoundaryTessellationErrorWorld
      };
    }
    const areas = polygonRings.map((r) => ringArea(r));
    const depths = new Array(polygonRings.length).fill(0);
    const parents = new Array(polygonRings.length).fill(-1);
    for (let i = 0; i < polygonRings.length; i++) {
      const ringI = polygonRings[i];
      const testPt = [
        (ringI[0][0] + ringI[1][0]) / 2,
        (ringI[0][1] + ringI[1][1]) / 2
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
    const style = hatch.hatchStyle ?? 0;
    const outerIndices = [];
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
    const allTriangleCoords = [];
    for (const outerIdx of outerIndices) {
      const outerRing = [...polygonRings[outerIdx]];
      const holeIndicesForOuter = [];
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
      if (ringArea(outerRing) < 0) outerRing.reverse();
      const flatCoords = [];
      const holeStartIndices = [];
      for (const pt of outerRing) {
        flatCoords.push(pt[0], pt[1]);
      }
      for (const hIdx of holeIndicesForOuter) {
        const holeRing = [...polygonRings[hIdx]];
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
      return {
        mesh: null,
        boundaryLines,
        refinementLimitReached,
        invalidCurveGeometry,
        invalidBoundaryGeometry,
        boundaryValidationLimitReached,
        maxBoundaryTessellationErrorWorld
      };
    }
    const meshVerts = new Float64Array(allTriangleCoords);
    const mesh = {
      vertices: meshVerts,
      layer: hatch.layer,
      order: hatch.order,
      alpha: 1
    };
    const isPatternFill = hatch.isSolid !== true && hatch.solidFill !== true;
    const pattern = isPatternFill ? buildHatchPatternSegments(hatch, polygonRings) : void 0;
    return {
      mesh,
      boundaryLines,
      refinementLimitReached,
      invalidCurveGeometry,
      invalidBoundaryGeometry,
      boundaryValidationLimitReached,
      maxBoundaryTessellationErrorWorld,
      ...pattern ? { patternSegments: pattern.segments, patternStatus: pattern.status } : {}
    };
  }
  /**
   * 8. WIPEOUT Üçgenleme
   */
  static triangulateWipeout(wipeout) {
    const v = wipeout.vertices;
    if (!v || v.length < 3) return null;
    const flatCoords = [];
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
      alpha: 1
    };
  }
  /**
   * 9. Linetype (Çizgi Tipi) Faz Sürekliliği
   * Poligonal yol boyunca pattern adımlarını kümülatif mesafe ile böler.
   */
  static applyLinetype(points, pattern, scale = 1, initialPhase = 0) {
    if (!pattern || pattern.length === 0 || points.length < 2) {
      const segs = [];
      for (let i = 0; i < points.length - 1; i++) {
        segs.push({
          x0: points[i][0],
          y0: points[i][1],
          x1: points[i + 1][0],
          y1: points[i + 1][1]
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
    let accumulated = 0;
    for (let i = 0; i < scaledPattern.length; i++) {
      const elLen = Math.abs(scaledPattern[i]);
      if (accumulated + elLen > currentPhase) {
        patternIdx = i;
        break;
      }
      accumulated += elLen;
    }
    const segments = [];
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
};

// src/lib/cad-v2/worker/hatch-fill-refinement.ts
var DEFAULT_MAX_CURVE_SEGMENTS = 16384;
var MAX_RUNTIME_CURVE_SEGMENTS = 16384;
var MAX_RUNTIME_BOUNDARY_ELEMENTS = 16384;
var MAX_RUNTIME_OUTPUT_TRIANGLES = 32768;
function finitePositive2(value) {
  return Number.isFinite(value) && value > 0;
}
__name(finitePositive2, "finitePositive");
function countBoundaryElements(loops) {
  let total = 0;
  for (const loop of loops) {
    if (Array.isArray(loop.vertices)) total += loop.vertices.length;
    if (Array.isArray(loop.edges)) {
      total += loop.edges.length;
      for (const edge of loop.edges) {
        if (edge.type === "SPLINE") total += edge.controlPoints.length + edge.knots.length + (edge.weights?.length ?? 0);
      }
    }
  }
  return total;
}
__name(countBoundaryElements, "countBoundaryElements");
function refineRuntimeHatchFill(source, options) {
  if (!source || !options) return degraded("invalid-source", 0);
  const maxCurveSegments = options.maxCurveSegments ?? DEFAULT_MAX_CURVE_SEGMENTS;
  const maxBoundaryElements = options.maxBoundaryElements ?? MAX_RUNTIME_BOUNDARY_ELEMENTS;
  const maxOutputTriangles = options.maxOutputTriangles ?? MAX_RUNTIME_OUTPUT_TRIANGLES;
  if (!source || typeof source.handle !== "string" || !source.handle || typeof source.layer !== "string" || !source.layer || !Array.isArray(source.loops) || source.loops.length === 0 || !(typeof source.order === "bigint" || typeof source.order === "string" && /^\d+$/.test(source.order)) || source.loops.some((loop) => !loop || typeof loop.isPolyline !== "boolean")) {
    return degraded("invalid-source", 0);
  }
  if (!(source.isSolid === true || source.solidFill === true)) return degraded("unsupported-pattern", 0);
  let boundaryElementCount;
  try {
    boundaryElementCount = countBoundaryElements(source.loops);
  } catch {
    return degraded("invalid-source", 0);
  }
  if (!Number.isSafeInteger(maxCurveSegments) || maxCurveSegments < 1 || maxCurveSegments > MAX_RUNTIME_CURVE_SEGMENTS || !Number.isSafeInteger(maxBoundaryElements) || maxBoundaryElements < 1 || maxBoundaryElements > MAX_RUNTIME_BOUNDARY_ELEMENTS || !Number.isSafeInteger(maxOutputTriangles) || maxOutputTriangles < 1 || maxOutputTriangles > MAX_RUNTIME_OUTPUT_TRIANGLES || boundaryElementCount > maxBoundaryElements) {
    return degraded("source-cap", 0);
  }
  if (!finitePositive2(options.targetErrorCssPixels) || !finitePositive2(options.unitsPerCssPixel) || !finitePositive2(options.maxTransformSingularValue)) {
    return degraded("invalid-source", 0);
  }
  const requestedErrorWorld = options.targetErrorCssPixels * options.unitsPerCssPixel / options.maxTransformSingularValue;
  if (!finitePositive2(requestedErrorWorld)) return degraded("invalid-source", 0);
  const entity = {
    handle: source.handle,
    type: "HATCH",
    layer: source.layer,
    order: typeof source.order === "bigint" ? source.order : BigInt(source.order),
    patternName: "SOLID",
    isSolid: true,
    solidFill: true,
    hatchStyle: source.hatchStyle,
    loops: source.loops
  };
  let remeshed;
  try {
    remeshed = GeometryCompiler.triangulateHatch(entity, maxCurveSegments, requestedErrorWorld);
  } catch {
    return degraded("invalid-source", requestedErrorWorld);
  }
  const triangleCount = remeshed.mesh?.vertices.length ? remeshed.mesh.vertices.length / 6 : 0;
  if (remeshed.invalidCurveGeometry) return degraded("invalid-curve", requestedErrorWorld, remeshed.maxBoundaryTessellationErrorWorld);
  if (remeshed.refinementLimitReached || remeshed.maxBoundaryTessellationErrorWorld > requestedErrorWorld * (1 + 1e-12)) {
    return degraded("segment-cap", requestedErrorWorld, remeshed.maxBoundaryTessellationErrorWorld, triangleCount);
  }
  if (!remeshed.mesh?.vertices.length) return degraded("empty-fill", requestedErrorWorld, remeshed.maxBoundaryTessellationErrorWorld);
  if (triangleCount > maxOutputTriangles) {
    return degraded("source-cap", requestedErrorWorld, remeshed.maxBoundaryTessellationErrorWorld, triangleCount);
  }
  if (!remeshed.mesh.vertices.every(Number.isFinite)) return degraded("invalid-source", requestedErrorWorld);
  return {
    status: "refined",
    verticesWorld: remeshed.mesh.vertices,
    requestedErrorWorld,
    measuredBoundaryErrorWorld: remeshed.maxBoundaryTessellationErrorWorld,
    triangleCount,
    errorBoundMet: true
  };
}
__name(refineRuntimeHatchFill, "refineRuntimeHatchFill");
function degraded(reason, requestedErrorWorld, measuredBoundaryErrorWorld = 0, triangleCount = 0) {
  return {
    status: "degraded",
    reason,
    verticesWorld: null,
    requestedErrorWorld,
    measuredBoundaryErrorWorld,
    triangleCount,
    errorBoundMet: false
  };
}
__name(degraded, "degraded");

// src/lib/cad-v2/worker/resource-budgets.ts
var CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES = 8 * 1024 * 1024;
var CAD_V2_IN_FLIGHT_CHUNK_TRANSFER_BUDGET_BYTES = 16 * 1024 * 1024;
var CAD_V2_REFINEMENT_CACHE_MISS_ERROR_PREFIX = "REFINEMENT_SOURCE_CACHE_MISS:";

// src/lib/cad-v2/worker/position-compaction.ts
var UINT16_MAX = 65535;
function getPositionBounds(source) {
  if (source.length % 2 !== 0) throw new Error("CAD V2 XY positions must contain complete 2D vertices");
  if (source.length === 0) return { minX: 0, minY: 0, extentX: 0, extentY: 0 };
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < source.length; index += 2) {
    const x = source[index];
    const y = source[index + 1];
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error("CAD V2 cannot compact non-finite XY positions");
    }
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { minX, minY, extentX: maxX - minX, extentY: maxY - minY };
}
__name(getPositionBounds, "getPositionBounds");
function estimateCadV2PositionCodecMaxWorldError(source) {
  const { extentX, extentY } = getPositionBounds(source);
  return Math.hypot(extentX, extentY) / (2 * UINT16_MAX);
}
__name(estimateCadV2PositionCodecMaxWorldError, "estimateCadV2PositionCodecMaxWorldError");
function packCadV2PositionArray(source) {
  const { minX, minY, extentX, extentY } = getPositionBounds(source);
  const positions = new Uint16Array(source.length);
  for (let index = 0; index < source.length; index += 2) {
    positions[index] = extentX === 0 ? 0 : Math.round((source[index] - minX) / extentX * UINT16_MAX);
    positions[index + 1] = extentY === 0 ? 0 : Math.round((source[index + 1] - minY) / extentY * UINT16_MAX);
  }
  return {
    positions,
    codec: {
      minX,
      minY,
      extentX,
      extentY,
      maxWorldError: Math.hypot(extentX, extentY) / (2 * UINT16_MAX)
    }
  };
}
__name(packCadV2PositionArray, "packCadV2PositionArray");

// src/lib/cad-v2/worker/overview-linework-compaction.ts
var CAD_V2_OVERVIEW_MAX_SOURCE_SEGMENT_CSS_PIXELS = 0.0625;
var CAD_V2_OVERVIEW_GRID_CSS_PIXELS = CAD_V2_OVERVIEW_MAX_SOURCE_SEGMENT_CSS_PIXELS / 2;
var CAD_V2_OVERVIEW_REPRESENTATIVE_SEGMENT_CSS_PIXELS = 0.018;
var CAD_V2_OVERVIEW_MAX_ZOOM_FACTOR = 4;
var CAD_V2_OVERVIEW_MAX_COMBINED_ERROR_AT_SUPPORTED_ZOOM_CSS_PIXELS = 0.25;
var CAD_V2_OVERVIEW_MAX_COMBINED_ERROR_CSS_PIXELS = CAD_V2_OVERVIEW_MAX_COMBINED_ERROR_AT_SUPPORTED_ZOOM_CSS_PIXELS / CAD_V2_OVERVIEW_MAX_ZOOM_FACTOR;
function canCompactOverviewLineCommand(command) {
  return command.kind === "line" && (command.alpha ?? 1) === 1 && !(command.dashStyle && typeof command.dashStyle === "object") && command.pathDistanceRequired !== true;
}
__name(canCompactOverviewLineCommand, "canCompactOverviewLineCommand");
function sameOverviewLineStyle(left, right) {
  const leftColor = left.color;
  const rightColor = right.color;
  if (!Array.isArray(leftColor) || !Array.isArray(rightColor) || leftColor.length !== 3 || rightColor.length !== 3) {
    return false;
  }
  return left.layer === right.layer && left.isAci7 === true === (right.isAci7 === true) && Math.abs(Number(left.lineweightMm ?? 0) - Number(right.lineweightMm ?? 0)) < 1e-4 && leftColor[0] === rightColor[0] && leftColor[1] === rightColor[1] && leftColor[2] === rightColor[2];
}
__name(sameOverviewLineStyle, "sameOverviewLineStyle");
function canJoinOverviewPainterRanks(left, right) {
  if (!canCompactOverviewLineCommand(left) || !canCompactOverviewLineCommand(right) || !sameOverviewLineStyle(left, right)) return false;
  const leftFirst = Number.isSafeInteger(left.globalOrderIndex) ? left.globalOrderIndex : null;
  const leftLastValue = left.globalOrderEndIndex ?? left.globalOrderIndex;
  const leftLast = Number.isSafeInteger(leftLastValue) ? leftLastValue : null;
  const rightFirst = Number.isSafeInteger(right.globalOrderIndex) ? right.globalOrderIndex : null;
  const rightLastValue = right.globalOrderEndIndex ?? right.globalOrderIndex;
  const rightLast = Number.isSafeInteger(rightLastValue) ? rightLastValue : null;
  if (leftFirst === null && leftLast === null && rightFirst === null && rightLast === null) return true;
  if (leftFirst === null || leftLast === null || rightFirst === null || rightLast === null || leftLast < leftFirst || rightLast < rightFirst) return false;
  return rightFirst === leftLast || rightFirst === leftLast + 1;
}
__name(canJoinOverviewPainterRanks, "canJoinOverviewPainterRanks");
function compactCadV2OverviewLinework(source, drawCommands, unitsPerCssPixel, maxCenterlineDeviationCssPixels = CAD_V2_OVERVIEW_MAX_SOURCE_SEGMENT_CSS_PIXELS / 2 + Math.SQRT2 * CAD_V2_OVERVIEW_GRID_CSS_PIXELS / 2 + CAD_V2_OVERVIEW_REPRESENTATIVE_SEGMENT_CSS_PIXELS / 2, preservedVertexRanges = [], sourcePathDistances) {
  const unchanged = /* @__PURE__ */ __name(() => ({
    xyArray: source,
    drawCommands: drawCommands.map((command) => ({ ...command })),
    collapsedSegmentCount: 0,
    retainedSegmentCount: 0,
    representativePointCount: 0,
    maxCenterlineDeviationCssPixels: 0
  }), "unchanged");
  if (!Number.isFinite(unitsPerCssPixel) || unitsPerCssPixel <= 0 || source.length % 2 !== 0) return unchanged();
  const lineCommands = drawCommands.filter((command) => command.kind === "line");
  if (lineCommands.length === 0) return unchanged();
  const ranges = lineCommands.map((command) => ({
    start: command.firstVertex,
    end: command.firstVertex + command.vertexCount
  })).sort((a, b) => a.start - b.start);
  let expectedFirstVertex = 0;
  for (const range of ranges) {
    if (!Number.isSafeInteger(range.start) || !Number.isSafeInteger(range.end) || range.start !== expectedFirstVertex || range.end <= range.start || range.end > source.length / 2 || range.start % 2 !== 0 || (range.end - range.start) % 2 !== 0) {
      return unchanged();
    }
    expectedFirstVertex = range.end;
  }
  if (expectedFirstVertex !== source.length / 2) return unchanged();
  const preservedSegments = new Uint8Array(source.length / 4);
  for (const range of preservedVertexRanges) {
    const endVertex = range.firstVertex + range.vertexCount;
    if (!Number.isSafeInteger(range.firstVertex) || !Number.isSafeInteger(range.vertexCount) || range.firstVertex < 0 || range.vertexCount <= 0 || range.firstVertex % 2 !== 0 || range.vertexCount % 2 !== 0 || endVertex > source.length / 2) {
      return unchanged();
    }
    for (let segment = range.firstVertex / 2; segment < endVertex / 2; segment++) {
      preservedSegments[segment] = 1;
    }
  }
  const defaultDeviationCssPixels = CAD_V2_OVERVIEW_MAX_SOURCE_SEGMENT_CSS_PIXELS / 2 + Math.SQRT2 * CAD_V2_OVERVIEW_GRID_CSS_PIXELS / 2 + CAD_V2_OVERVIEW_REPRESENTATIVE_SEGMENT_CSS_PIXELS / 2;
  const targetDeviationCssPixels = Number.isFinite(maxCenterlineDeviationCssPixels) ? Math.max(0, Math.min(defaultDeviationCssPixels, maxCenterlineDeviationCssPixels)) : defaultDeviationCssPixels;
  const precisionScale = defaultDeviationCssPixels > 0 ? targetDeviationCssPixels / defaultDeviationCssPixels : 0;
  if (precisionScale <= 0) return unchanged();
  const sourceLengthCssPixels = CAD_V2_OVERVIEW_MAX_SOURCE_SEGMENT_CSS_PIXELS * precisionScale;
  const gridSizeCssPixels = CAD_V2_OVERVIEW_GRID_CSS_PIXELS * precisionScale;
  const representativeSegmentCssPixels = CAD_V2_OVERVIEW_REPRESENTATIVE_SEGMENT_CSS_PIXELS * precisionScale;
  const gridSizeWorld = gridSizeCssPixels * unitsPerCssPixel;
  const representativeHalfLengthWorld = representativeSegmentCssPixels * unitsPerCssPixel / 2;
  const output = [];
  const remappedPathDistances = sourcePathDistances ? [] : null;
  const rewritten = [];
  const sourceToOutputVertex = preservedVertexRanges.length > 0 ? /* @__PURE__ */ new Map() : null;
  let collapsedSegmentCount = 0;
  let retainedSegmentCount = 0;
  let representativePointCount = 0;
  const commandGroups = [];
  for (const command of drawCommands) {
    const previousGroup = commandGroups[commandGroups.length - 1];
    const previousCommand = previousGroup?.[previousGroup.length - 1];
    if (previousCommand && canJoinOverviewPainterRanks(previousCommand, command)) {
      previousGroup.push(command);
    } else {
      commandGroups.push([command]);
    }
  }
  for (const group of commandGroups) {
    const command = group[0];
    if (command.kind !== "line") {
      rewritten.push({ ...command });
      continue;
    }
    const mayCompact = group.every(canCompactOverviewLineCommand);
    const representatives = /* @__PURE__ */ new Map();
    const retained = [];
    for (const sourceCommand of group) {
      const first = sourceCommand.firstVertex * 2;
      const end = (sourceCommand.firstVertex + sourceCommand.vertexCount) * 2;
      for (let index = first; index < end; index += 4) {
        const x0 = source[index];
        const y0 = source[index + 1];
        const x1 = source[index + 2];
        const y1 = source[index + 3];
        const valuesAreFinite = Number.isFinite(x0) && Number.isFinite(y0) && Number.isFinite(x1) && Number.isFinite(y1);
        const mustPreserve = preservedSegments[index / 4] === 1;
        const segmentLengthCssPixels = valuesAreFinite ? Math.hypot(x1 - x0, y1 - y0) / unitsPerCssPixel : Number.POSITIVE_INFINITY;
        if (mustPreserve || !mayCompact || segmentLengthCssPixels >= sourceLengthCssPixels || !Number.isFinite(gridSizeWorld) || gridSizeWorld <= 0) {
          retained.push(index, index + 1, index + 2, index + 3);
          if (!mustPreserve && mayCompact && segmentLengthCssPixels >= sourceLengthCssPixels) retainedSegmentCount++;
          continue;
        }
        const midpointX = (x0 + x1) / 2;
        const midpointY = (y0 + y1) / 2;
        const cellX = Math.round(midpointX / gridSizeWorld);
        const cellY = Math.round(midpointY / gridSizeWorld);
        if (!Number.isSafeInteger(cellX) || !Number.isSafeInteger(cellY)) {
          retained.push(index, index + 1, index + 2, index + 3);
          continue;
        }
        const key = `${cellX}:${cellY}`;
        if (!representatives.has(key)) {
          representatives.set(key, [cellX * gridSizeWorld, cellY * gridSizeWorld]);
        }
        collapsedSegmentCount++;
      }
    }
    if (representatives.size > 0 || retained.length > 0) {
      const firstVertex = output.length / 2;
      for (const [centerX, centerY] of representatives.values()) {
        output.push(
          centerX - representativeHalfLengthWorld,
          centerY,
          centerX + representativeHalfLengthWorld,
          centerY
        );
        remappedPathDistances?.push(0, 0);
      }
      const vertexCount = representatives.size * 2 + retained.length / 2;
      for (let retainedIndex = 0; retainedIndex < retained.length; retainedIndex += 4) {
        const firstRetainedVertex = output.length / 2;
        for (let vertexOffset = 0; vertexOffset < 2; vertexOffset++) {
          const sourceOffset = retained[retainedIndex + vertexOffset * 2];
          sourceToOutputVertex?.set(sourceOffset / 2, firstRetainedVertex + vertexOffset);
          output.push(source[sourceOffset], source[sourceOffset + 1]);
          remappedPathDistances?.push(sourcePathDistances?.[sourceOffset / 2] ?? 0);
        }
      }
      const mergedCommand = { ...command, firstVertex, vertexCount };
      const firstOrder = command.globalOrderIndex;
      const lastCommand = group[group.length - 1];
      const lastOrder = lastCommand.globalOrderEndIndex ?? lastCommand.globalOrderIndex;
      if (firstOrder !== void 0 && lastOrder !== void 0) {
        mergedCommand.globalOrderIndex = firstOrder;
        mergedCommand.globalOrderEndIndex = lastOrder;
      }
      rewritten.push(mergedCommand);
      representativePointCount += representatives.size;
    }
  }
  if (collapsedSegmentCount === 0) return unchanged();
  let remappedPreservedVertexRanges;
  if (preservedVertexRanges.length > 0) {
    remappedPreservedVertexRanges = [];
    for (const range of preservedVertexRanges) {
      const firstVertex = sourceToOutputVertex?.get(range.firstVertex);
      if (firstVertex === void 0) return unchanged();
      for (let offset = 1; offset < range.vertexCount; offset++) {
        if (sourceToOutputVertex?.get(range.firstVertex + offset) !== firstVertex + offset) return unchanged();
      }
      remappedPreservedVertexRanges.push({ firstVertex, vertexCount: range.vertexCount });
    }
  }
  return {
    xyArray: new Float32Array(output),
    drawCommands: rewritten,
    collapsedSegmentCount,
    retainedSegmentCount,
    representativePointCount,
    maxCenterlineDeviationCssPixels: sourceLengthCssPixels / 2 + Math.SQRT2 * gridSizeCssPixels / 2 + representativeSegmentCssPixels / 2,
    ...remappedPathDistances ? { remappedPathDistancesArray: new Float32Array(remappedPathDistances) } : {},
    ...remappedPreservedVertexRanges ? { remappedPreservedVertexRanges } : {}
  };
}
__name(compactCadV2OverviewLinework, "compactCadV2OverviewLinework");

// src/workers/cad-v2/cad-v2-scene-worker.ts
var MAX_DECODED_ALLOCATION_BYTES2 = 8 * 1024 * 1024;
var refinementSourceCache = /* @__PURE__ */ new Map();
var activeWorkerSessions = /* @__PURE__ */ new Map();
var refinementSourceCacheBytes = 0;
function sourceCacheKey(viewSessionId, sourceVersionKey, chunkId) {
  return `${viewSessionId}\0${sourceVersionKey}\0${chunkId}`;
}
__name(sourceCacheKey, "sourceCacheKey");
function retainRefinementSources(viewSessionId, sourceVersionKey, chunk) {
  const evictedChunkIds = [];
  const refs = chunk.meta?.curveSourceRefs;
  if (!chunk.curveDataArray || !Array.isArray(refs) || refs.length === 0) {
    return { retained: false, evictedChunkIds };
  }
  const refsJson = JSON.stringify(refs);
  const byteLength = chunk.curveDataArray.byteLength + refsJson.length * 2;
  const key = sourceCacheKey(viewSessionId, sourceVersionKey, chunk.chunkId);
  const previous = refinementSourceCache.get(key);
  if (previous) {
    refinementSourceCacheBytes -= previous.byteLength;
    refinementSourceCache.delete(key);
  }
  if (byteLength > CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES) {
    return { retained: false, evictedChunkIds };
  }
  const sessionPrefix = `${viewSessionId}\0${sourceVersionKey}\0`;
  while (refinementSourceCacheBytes + byteLength > CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES) {
    const oldestKey = refinementSourceCache.keys().next().value;
    if (!oldestKey) break;
    const oldest = refinementSourceCache.get(oldestKey);
    refinementSourceCacheBytes -= oldest.byteLength;
    refinementSourceCache.delete(oldestKey);
    if (oldestKey.startsWith(sessionPrefix)) {
      evictedChunkIds.push(oldestKey.slice(sessionPrefix.length));
    }
  }
  refinementSourceCache.set(key, {
    curveData: new Float32Array(chunk.curveDataArray),
    curveSourceRefsJson: refsJson,
    vertexCount: chunk.vertexCount,
    byteLength
  });
  refinementSourceCacheBytes += byteLength;
  return { retained: true, evictedChunkIds };
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
function unpackSceneChunk(chunkId, buffer, options = {}) {
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
  const sourceXY = xySection.data;
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
  let overview = null;
  const overviewUnitsPerCssPixel = options.overviewUnitsPerCssPixel;
  const hasScreenScale = Number.isFinite(overviewUnitsPerCssPixel) && (overviewUnitsPerCssPixel ?? 0) > 0;
  const sourcePositionCodecErrorCssPixels = hasScreenScale ? estimateCadV2PositionCodecMaxWorldError(sourceXY) / overviewUnitsPerCssPixel : 0;
  const canPackPositionsWithinScreenBudget = !options.compactPositions || !hasScreenScale || sourcePositionCodecErrorCssPixels <= CAD_V2_OVERVIEW_MAX_COMBINED_ERROR_CSS_PIXELS;
  const curveSourceRefs = Array.isArray(meta?.curveSourceRefs) ? meta.curveSourceRefs : [];
  const pathDistSection = rawChunk.sections.get(10 /* PATH_DISTANCE */);
  const needsPathDistance = Array.isArray(meta?.drawCommands) && meta.drawCommands.some((command) => command?.kind === "line" && (command.pathDistanceRequired === true || command.dashStyle && typeof command.dashStyle === "object"));
  const sourcePathDistances = needsPathDistance && pathDistSection?.data instanceof Float32Array ? pathDistSection.data : null;
  const pathDistancesAreAligned = !needsPathDistance || sourcePathDistances !== null && sourcePathDistances.length >= sourceXY.length / 2;
  if (Number.isFinite(options.overviewUnitsPerCssPixel) && (options.overviewUnitsPerCssPixel ?? 0) > 0 && meta && Array.isArray(meta.drawCommands) && pathDistancesAreAligned) {
    const codecGrowthPerCssPixel = Math.SQRT2 / 65535;
    const availableOverviewErrorCssPixels = canPackPositionsWithinScreenBudget ? Math.max(0, (CAD_V2_OVERVIEW_MAX_COMBINED_ERROR_CSS_PIXELS - sourcePositionCodecErrorCssPixels) / (1 + codecGrowthPerCssPixel)) : CAD_V2_OVERVIEW_MAX_COMBINED_ERROR_CSS_PIXELS;
    overview = compactCadV2OverviewLinework(
      sourceXY,
      meta.drawCommands,
      options.overviewUnitsPerCssPixel,
      availableOverviewErrorCssPixels,
      curveSourceRefs.map((reference) => ({
        firstVertex: reference?.firstVertex,
        vertexCount: reference?.vertexCount
      })),
      sourcePathDistances
    );
  }
  if (overview && overview.collapsedSegmentCount > 0 && sourcePathDistances && (!overview.remappedPathDistancesArray || overview.remappedPathDistancesArray.length !== overview.xyArray.length / 2)) {
    overview = null;
  }
  if (overview && overview.collapsedSegmentCount > 0 && meta) {
    const remappedRanges = overview.remappedPreservedVertexRanges;
    if (curveSourceRefs.length > 0 && (!remappedRanges || remappedRanges.length !== curveSourceRefs.length)) {
      overview = null;
    } else {
      meta.drawCommands = overview.drawCommands;
      if (remappedRanges && curveSourceRefs.length > 0) {
        meta.curveSourceRefs = curveSourceRefs.map((reference, index) => ({
          ...reference,
          firstVertex: remappedRanges[index].firstVertex
        }));
      }
    }
  }
  const positionSource = overview && overview.collapsedSegmentCount > 0 ? overview.xyArray : sourceXY;
  const shouldPackPositions = options.compactPositions && canPackPositionsWithinScreenBudget;
  const packedXY = shouldPackPositions ? packCadV2PositionArray(positionSource) : null;
  const xyArray = packedXY?.positions ?? positionSource.slice();
  const vertexCount = xyArray.length / 2;
  const runsSection = rawChunk.sections.get(9 /* DRAW_RUNS */);
  let drawRunsArray = null;
  if (runsSection && runsSection.data instanceof Uint32Array) {
    drawRunsArray = runsSection.data.slice();
  }
  const triSection = rawChunk.sections.get(4 /* TRIANGLES */);
  let trianglesArray = null;
  if (triSection && triSection.data instanceof Float32Array) {
    trianglesArray = triSection.data.slice();
  }
  let pathDistancesArray = null;
  if (needsPathDistance && sourcePathDistances) {
    pathDistancesArray = overview?.collapsedSegmentCount ? overview.remappedPathDistancesArray : sourcePathDistances.slice();
  }
  const curveSection = rawChunk.sections.get(6 /* CURVE_DATA */);
  let curveDataArray = null;
  if (curveSection && curveSection.data instanceof Float32Array) {
    curveDataArray = curveSection.data.slice();
  }
  return {
    chunkId,
    origin,
    xyArray,
    ...packedXY ? { positionCodec: packedXY.codec } : {},
    drawRunsArray,
    trianglesArray,
    pathDistancesArray,
    curveDataArray,
    meta,
    vertexCount,
    ...overview ? {
      overviewLod: {
        unitsPerCssPixel: options.overviewUnitsPerCssPixel,
        collapsedSegmentCount: overview.collapsedSegmentCount,
        retainedSegmentCount: overview.retainedSegmentCount,
        representativePointCount: overview.representativePointCount,
        maxCenterlineDeviationCssPixels: overview.maxCenterlineDeviationCssPixels
      }
    } : {}
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
          const unpacked = unpackSceneChunk(msg.payload.chunkId, msg.payload.chunkBuffer, {
            compactPositions: msg.payload.compactPositions === true,
            overviewUnitsPerCssPixel: msg.payload.unitsPerCssPixel
          });
          unpacked.workerRefinementSourceCache = retainRefinementSources(
            msg.viewSessionId,
            msg.sourceVersionKey,
            unpacked
          );
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
          const inlineRefsJson = typeof msg.payload?.curveSourceRefsJson === "string" ? msg.payload.curveSourceRefsJson : Array.isArray(msg.payload?.curveSourceRefs) ? JSON.stringify(msg.payload.curveSourceRefs) : null;
          const inlineRefsBytes = inlineRefsJson === null ? Number.POSITIVE_INFINITY : inlineRefsJson.length * 2;
          const inlinePayloadFitsBudget = Boolean(inlineBuffer) && inlineBuffer.byteLength + inlineRefsBytes <= CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES;
          const curveData = cached?.curveData ?? (inlinePayloadFitsBudget ? new Float32Array(inlineBuffer) : null);
          const curveSourceRefs = cached ? JSON.parse(cached.curveSourceRefsJson) : inlineRefsJson === null ? void 0 : JSON.parse(inlineRefsJson);
          const fallbackVertexCount = cached?.vertexCount ?? msg.payload?.fallbackVertexCount;
          if (!curveData || !curveSourceRefs || typeof fallbackVertexCount !== "number" || !Number.isSafeInteger(fallbackVertexCount)) {
            throw new Error(`${CAD_V2_REFINEMENT_CACHE_MISS_ERROR_PREFIX}${chunkId}`);
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
      case "refine-hatches": {
        try {
          const requestId = msg.payload?.requestId;
          const chunkId = msg.payload?.chunkId;
          const sourceJson = msg.payload?.hatchSourceJson;
          if (typeof requestId !== "string" || !requestId || typeof chunkId !== "string" || !chunkId || typeof sourceJson !== "string" || new TextEncoder().encode(sourceJson).byteLength > 128 * 1024) {
            throw new Error("Eksik veya s\u0131n\u0131r d\u0131\u015F\u0131 runtime HATCH source request");
          }
          const source = JSON.parse(sourceJson);
          const options = {
            targetErrorCssPixels: msg.payload.targetErrorCssPixels,
            unitsPerCssPixel: msg.payload.unitsPerCssPixel,
            maxTransformSingularValue: msg.payload.maxTransformSingularValue,
            maxCurveSegments: msg.payload.maxCurveSegments,
            maxBoundaryElements: msg.payload.maxBoundaryElements,
            maxOutputTriangles: msg.payload.maxOutputTriangles
          };
          const result = refineRuntimeHatchFill(source, options);
          const response = {
            protocolVersion: 1,
            viewSessionId: msg.viewSessionId,
            generation: msg.generation,
            sourceVersionKey: msg.sourceVersionKey,
            kind: "refined-hatches",
            payload: { requestId, chunkId, result }
          };
          const transferables = result.verticesWorld ? [result.verticesWorld.buffer] : [];
          self.postMessage(response, transferables);
        } catch (err) {
          const errResponse = {
            protocolVersion: 1,
            viewSessionId: msg.viewSessionId,
            generation: msg.generation,
            sourceVersionKey: msg.sourceVersionKey,
            kind: "error",
            payload: { requestId: msg.payload?.requestId, error: err.message || "HATCH refinement ba\u015Far\u0131s\u0131z" }
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
