// ============================================================================
// DWG/DXF MOTOR V2 — SCENE BINARY PROTOCOL V1 (DV2SCN01)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md ve 31_SOZLESME_TAMAMLAMALARI.md
// Magic: ASCII DV2SCN01 (8 bytes)
// Little-endian, 8-byte hizalı section offsetleri, katı sınır kontrolleri.

export const SCENE_MAGIC = "DV2SCN01";
export const SCENE_SCHEMA_VERSION = 1;
export const HEADER_BYTE_LENGTH = 32;
export const SECTION_ENTRY_BYTE_LENGTH = 32;
export const MAX_CHUNK_BYTE_LENGTH = 2 * 1024 * 1024; // 2 MiB HTTP tavanı
export const MAX_DECODED_ALLOCATION_BYTES = 8 * 1024 * 1024; // 8 MiB savunma sınırı

export enum SceneScalarType {
  U8 = 1,
  U16 = 2,
  U32 = 3,
  F32 = 4,
  F64 = 5,
}

export const SCALAR_SIZE_MAP: Record<SceneScalarType, number> = {
  [SceneScalarType.U8]: 1,
  [SceneScalarType.U16]: 2,
  [SceneScalarType.U32]: 4,
  [SceneScalarType.F32]: 4,
  [SceneScalarType.F64]: 8,
};

export enum SceneTag {
  META = 1,
  ORIGIN = 2,
  XY = 3,
  TRIANGLES = 4,
  INSTANCE = 5,
  CURVE_DATA = 6,
  GLYPH_DATA = 7,
  SOURCE_STRINGS = 8,
  DRAW_RUNS = 9,
  PATH_DISTANCE = 10,
  CLIP_DATA = 11,
  STROKE_DATA = 12,
  UV = 13,
}

export enum DrawPrimitiveKind {
  TRIANGLES = 1,
  STROKE_PATH = 2,
  CURVE = 3,
  GLYPH = 4,
  IMAGE_QUAD = 5,
  WIPEOUT = 6,
}

export interface SceneSectionHeader {
  tag: SceneTag;
  scalarType: SceneScalarType;
  componentCount: number;
  elementCount: number;
  byteOffset: number;
  byteLength: number;
  strideBytes: number;
  flags: number;
  reserved: number;
}

export interface RawSceneChunk {
  schemaVersion: number;
  totalByteLength: number;
  sections: Map<SceneTag, { header: SceneSectionHeader; data: ArrayBufferView }>;
}

export interface DrawRun {
  primitiveKind: DrawPrimitiveKind;
  firstElement: number;
  elementCount: number;
  instanceIndex: number; // UINT32_MAX = no instance
  layerLocalId: number;
  styleLocalId: number;
  clipLocalId: number; // UINT32_MAX = no clip
  orderLocalId: number;
}

export interface TagSpecification {
  tag: SceneTag;
  name: string;
  scalarType: SceneScalarType;
  componentCount: number;
  isRequired: boolean;
  description: string;
}

export const SCENE_TAG_SPECIFICATIONS: Readonly<Record<SceneTag, TagSpecification>> = Object.freeze({
  [SceneTag.META]: { tag: SceneTag.META, name: "META", scalarType: SceneScalarType.U8, componentCount: 1, isRequired: true, description: "JSON metadata (layerRuns, chunkIndex, layoutId)" },
  [SceneTag.ORIGIN]: { tag: SceneTag.ORIGIN, name: "ORIGIN", scalarType: SceneScalarType.F64, componentCount: 2, isRequired: true, description: "Float64 chunk world origin [Ox, Oy]" },
  [SceneTag.XY]: { tag: SceneTag.XY, name: "XY", scalarType: SceneScalarType.F32, componentCount: 2, isRequired: true, description: "Float32 camera-relative vertex buffer (strokes, lines)" },
  [SceneTag.TRIANGLES]: { tag: SceneTag.TRIANGLES, name: "TRIANGLES", scalarType: SceneScalarType.F32, componentCount: 2, isRequired: false, description: "Float32 triangle mesh vertex buffer (solid hatches, wipeouts)" },
  [SceneTag.INSTANCE]: { tag: SceneTag.INSTANCE, name: "INSTANCE", scalarType: SceneScalarType.F32, componentCount: 6, isRequired: false, description: "Affine transform instances" },
  [SceneTag.CURVE_DATA]: { tag: SceneTag.CURVE_DATA, name: "CURVE_DATA", scalarType: SceneScalarType.F32, componentCount: 8, isRequired: false, description: "Analytic curve parameters" },
  [SceneTag.GLYPH_DATA]: { tag: SceneTag.GLYPH_DATA, name: "GLYPH_DATA", scalarType: SceneScalarType.F32, componentCount: 4, isRequired: false, description: "Text glyph instance descriptors" },
  [SceneTag.SOURCE_STRINGS]: { tag: SceneTag.SOURCE_STRINGS, name: "SOURCE_STRINGS", scalarType: SceneScalarType.U8, componentCount: 1, isRequired: false, description: "UTF-8 strings payload" },
  [SceneTag.DRAW_RUNS]: { tag: SceneTag.DRAW_RUNS, name: "DRAW_RUNS", scalarType: SceneScalarType.U32, componentCount: 8, isRequired: false, description: "Sequential painter's draw run commands" },
  [SceneTag.PATH_DISTANCE]: { tag: SceneTag.PATH_DISTANCE, name: "PATH_DISTANCE", scalarType: SceneScalarType.F32, componentCount: 1, isRequired: false, description: "Cumulative stroke path distances" },
  [SceneTag.CLIP_DATA]: { tag: SceneTag.CLIP_DATA, name: "CLIP_DATA", scalarType: SceneScalarType.F32, componentCount: 4, isRequired: false, description: "Viewport & XCLIP boundaries" },
  [SceneTag.STROKE_DATA]: { tag: SceneTag.STROKE_DATA, name: "STROKE_DATA", scalarType: SceneScalarType.F32, componentCount: 2, isRequired: false, description: "Width and dash stroke data" },
  [SceneTag.UV]: { tag: SceneTag.UV, name: "UV", scalarType: SceneScalarType.F32, componentCount: 2, isRequired: false, description: "Texture UV coordinates" },
});

export const UINT32_MAX = 0xffffffff;

/**
 * 8-byte hizalama yardımcısı
 */
export function align8(offset: number): number {
  return (offset + 7) & ~7;
}

/**
 * İkili sahne parçasını (DV2SCN01) doğrular ve ayrıştırır.
 */
export function parseSceneChunk(buffer: ArrayBuffer | Uint8Array): RawSceneChunk {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (bytes.byteLength < HEADER_BYTE_LENGTH) {
    throw new Error(`[SceneProtocol] Geçersiz chunk boyutu: ${bytes.byteLength} < ${HEADER_BYTE_LENGTH}`);
  }

  // 1. Magic kontrolü (DV2SCN01)
  const magic = new TextDecoder().decode(bytes.subarray(0, 8));
  if (magic !== SCENE_MAGIC) {
    throw new Error(`[SceneProtocol] Geçersiz magic: beklenen ${SCENE_MAGIC}, alınan: ${magic}`);
  }

  // 2. Header alanları
  const schemaVersion = dataView.getUint32(8, true);
  if (schemaVersion !== SCENE_SCHEMA_VERSION) {
    throw new Error(`[SceneProtocol] Desteklenmeyen şema sürümü: ${schemaVersion}`);
  }

  const totalByteLength = dataView.getUint32(12, true);
  if (totalByteLength !== bytes.byteLength) {
    throw new Error(
      `[SceneProtocol] Byte uzunluğu uyuşmazlığı: header ${totalByteLength} !== buffer ${bytes.byteLength}`
    );
  }

  if (totalByteLength > MAX_DECODED_ALLOCATION_BYTES) {
    throw new Error(
      `[SceneProtocol] Chunk boyutu savunma sınırını aşıyor: ${totalByteLength} > ${MAX_DECODED_ALLOCATION_BYTES}`
    );
  }

  const sectionCount = dataView.getUint32(16, true);
  const sectionTableOffset = dataView.getUint32(20, true);
  const headerBytes = dataView.getUint32(24, true);

  if (sectionTableOffset !== HEADER_BYTE_LENGTH || headerBytes !== HEADER_BYTE_LENGTH) {
    throw new Error(`[SceneProtocol] Geçersiz header ofset veya boyutu`);
  }

  const tableEnd = sectionTableOffset + sectionCount * SECTION_ENTRY_BYTE_LENGTH;
  if (tableEnd > totalByteLength) {
    throw new Error(`[SceneProtocol] Section tablosu chunk sınırını aşıyor: ${tableEnd} > ${totalByteLength}`);
  }

  const sections = new Map<SceneTag, { header: SceneSectionHeader; data: ArrayBufferView }>();
  const seenTags = new Set<SceneTag>();

  // 3. Section tablosu okuma ve doğrulama
  for (let i = 0; i < sectionCount; i++) {
    const entryOffset = sectionTableOffset + i * SECTION_ENTRY_BYTE_LENGTH;
    const tag = dataView.getUint32(entryOffset, true) as SceneTag;
    const scalarType = dataView.getUint16(entryOffset + 4, true) as SceneScalarType;
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
        `[SceneProtocol] Geçersiz stride: tag ${tag}, beklenen ${expectedStride}, alınan ${strideBytes}`
      );
    }

    const expectedLength = elementCount * strideBytes;
    if (byteLength !== expectedLength) {
      throw new Error(
        `[SceneProtocol] Geçersiz byteLength: tag ${tag}, beklenen ${expectedLength}, alınan ${byteLength}`
      );
    }

    if (byteOffset % 8 !== 0) {
      throw new Error(`[SceneProtocol] Section offset 8-byte hizalı değil: tag ${tag}, offset ${byteOffset}`);
    }

    if (byteOffset < tableEnd || byteOffset + byteLength > totalByteLength) {
      throw new Error(
        `[SceneProtocol] Section aralığı chunk sınırını aşıyor: tag ${tag}, [${byteOffset}..${byteOffset + byteLength}]`
      );
    }

    // Typed view oluşturma
    let view: ArrayBufferView;
    const subOffset = bytes.byteOffset + byteOffset;
    switch (scalarType) {
      case SceneScalarType.U8:
        view = new Uint8Array(bytes.buffer, subOffset, byteLength);
        break;
      case SceneScalarType.U16:
        view = new Uint16Array(bytes.buffer, subOffset, byteLength / 2);
        break;
      case SceneScalarType.U32:
        view = new Uint32Array(bytes.buffer, subOffset, byteLength / 4);
        break;
      case SceneScalarType.F32:
        view = new Float32Array(bytes.buffer, subOffset, byteLength / 4);
        break;
      case SceneScalarType.F64:
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
        reserved,
      },
      data: view,
    });
  }

  // 4. Semantik ve Finite Doğrulamaları
  // ORIGIN doğrulaması (varsa finite olmalıdır)
  const originSec = sections.get(SceneTag.ORIGIN);
  if (originSec && originSec.data instanceof Float64Array) {
    for (let i = 0; i < originSec.data.length; i++) {
      if (!Number.isFinite(originSec.data[i])) {
        throw new Error(`[SceneProtocol] ORIGIN içinde geçersiz non-finite koordinat: index ${i}`);
      }
    }
  }

  // XY koordinatları doğrulaması (varsa finite olmalıdır)
  let totalVertices = 0;
  const xySec = sections.get(SceneTag.XY);
  if (xySec && xySec.data instanceof Float32Array) {
    totalVertices = xySec.data.length / 2;
    for (let i = 0; i < xySec.data.length; i++) {
      if (!Number.isFinite(xySec.data[i])) {
        throw new Error(`[SceneProtocol] XY koordinat dizisinde non-finite (NaN/Infinity) değer: index ${i}`);
      }
    }
  }

  // TRIANGLES doğrulaması (varsa finite olmalıdır)
  let totalTriVertices = 0;
  const triSec = sections.get(SceneTag.TRIANGLES);
  if (triSec && triSec.data instanceof Float32Array) {
    totalTriVertices = triSec.data.length / 2;
    for (let i = 0; i < triSec.data.length; i++) {
      if (!Number.isFinite(triSec.data[i])) {
        throw new Error(`[SceneProtocol] TRIANGLES içinde non-finite (NaN/Infinity) değer: index ${i}`);
      }
    }
  }

  // CURVE_DATA records are [centerXY, basisUXY, basisVXY, startParam, endParam].
  // Reject non-finite analytic inputs before a worker can allocate or tessellate them.
  const curveSec = sections.get(SceneTag.CURVE_DATA);
  if (curveSec) {
    if (curveSec.header.scalarType !== SceneScalarType.F32 || curveSec.header.componentCount !== 8) {
      throw new Error("[SceneProtocol] CURVE_DATA section must contain fixed eight-component F32 records");
    }
    const curveData = curveSec.data as Float32Array;
    for (let i = 0; i < curveData.length; i++) {
      if (!Number.isFinite(curveData[i])) {
        throw new Error(`[SceneProtocol] CURVE_DATA içinde non-finite eğri parametresi: index ${i}`);
      }
    }
  }

  // PATH_DISTANCE doğrulaması (varsa finite olmalı ve line vert sayısıyla uyumlu olmalıdır)
  const pathDistSec = sections.get(SceneTag.PATH_DISTANCE);
  if (pathDistSec && pathDistSec.data instanceof Float32Array) {
    if (totalVertices > 0 && pathDistSec.data.length !== totalVertices) {
      throw new Error(
        `[SceneProtocol] PATH_DISTANCE eleman sayısı XY vertex sayısı ile uyuşmuyor: ${pathDistSec.data.length} !== ${totalVertices}`
      );
    }
    for (let i = 0; i < pathDistSec.data.length; i++) {
      if (!Number.isFinite(pathDistSec.data[i])) {
        throw new Error(`[SceneProtocol] PATH_DISTANCE içinde non-finite (NaN/Infinity) değer: index ${i}`);
      }
    }
  }

  // DRAW_RUNS aralık doğrulaması (firstElement + elementCount <= maxLimit)
  const drawRunsSec = sections.get(SceneTag.DRAW_RUNS);
  if (drawRunsSec && drawRunsSec.data instanceof Uint32Array) {
    const runsArray = drawRunsSec.data;
    const runCount = runsArray.length / 8;
    for (let r = 0; r < runCount; r++) {
      const primitiveKind = runsArray[r * 8];
      const firstEl = runsArray[r * 8 + 1];
      const elCount = runsArray[r * 8 + 2];
      const isTriKind = primitiveKind === DrawPrimitiveKind.TRIANGLES || primitiveKind === DrawPrimitiveKind.WIPEOUT;
      const maxLimit = isTriKind ? totalTriVertices : totalVertices;
      if (maxLimit > 0 && firstEl + elCount > maxLimit) {
        throw new Error(
          `[SceneProtocol] DRAW_RUNS aralığı vertex sınırını aşıyor: run ${r} (kind ${primitiveKind}), [${firstEl}..${firstEl + elCount}] > ${maxLimit}`
        );
      }
    }
  }

  return {
    schemaVersion,
    totalByteLength,
    sections,
  };
}

/**
 * Belirtilen section tanımlarından ikili DV2SCN01 chunk'ı oluşturur.
 */
export function buildSceneChunk(
  sectionList: Array<{
    tag: SceneTag;
    scalarType: SceneScalarType;
    componentCount: number;
    elementCount: number;
    data: ArrayBufferView;
  }>
): Uint8Array {
  const sectionCount = sectionList.length;
  const sectionTableOffset = HEADER_BYTE_LENGTH;
  let currentOffset = align8(sectionTableOffset + sectionCount * SECTION_ENTRY_BYTE_LENGTH);

  // Offsetleri hesapla
  const headers: SceneSectionHeader[] = [];
  for (const sec of sectionList) {
    const scalarSize = SCALAR_SIZE_MAP[sec.scalarType];
    const strideBytes = sec.componentCount * scalarSize;
    const byteLength = sec.elementCount * strideBytes;
    const byteOffset = currentOffset;

    headers.push({
      tag: sec.tag,
      scalarType: sec.scalarType,
      componentCount: sec.componentCount,
      elementCount: sec.elementCount,
      byteOffset,
      byteLength,
      strideBytes,
      flags: 0,
      reserved: 0,
    });

    currentOffset = align8(currentOffset + byteLength);
  }

  const totalByteLength = currentOffset;
  if (totalByteLength > MAX_CHUNK_BYTE_LENGTH) {
    console.warn(
      `[SceneProtocol] Uyarı: Üretilen chunk boyutu HTTP tavanını aşıyor: ${totalByteLength} > ${MAX_CHUNK_BYTE_LENGTH}`
    );
  }

  const resultBytes = new Uint8Array(totalByteLength);
  const dataView = new DataView(resultBytes.buffer, resultBytes.byteOffset, resultBytes.byteLength);

  // Header yaz (32 bytes)
  for (let i = 0; i < 8; i++) {
    resultBytes[i] = SCENE_MAGIC.charCodeAt(i);
  }
  dataView.setUint32(8, SCENE_SCHEMA_VERSION, true);
  dataView.setUint32(12, totalByteLength, true);
  dataView.setUint32(16, sectionCount, true);
  dataView.setUint32(20, sectionTableOffset, true);
  dataView.setUint32(24, HEADER_BYTE_LENGTH, true);
  dataView.setUint32(28, 0, true); // reserved

  // Section Table yaz (sectionCount * 32 bytes)
  for (let i = 0; i < sectionCount; i++) {
    const h = headers[i];
    const secOffset = sectionTableOffset + i * SECTION_ENTRY_BYTE_LENGTH;
    dataView.setUint32(secOffset, h.tag, true);
    dataView.setUint16(secOffset + 4, h.scalarType, true);
    dataView.setUint16(secOffset + 6, h.componentCount, true);
    dataView.setUint32(secOffset + 8, h.elementCount, true);
    dataView.setUint32(secOffset + 12, h.byteOffset, true);
    dataView.setUint32(secOffset + 16, h.byteLength, true);
    dataView.setUint32(secOffset + 20, h.strideBytes, true);
    dataView.setUint32(secOffset + 24, h.flags, true);
    dataView.setUint32(secOffset + 28, h.reserved, true);

    // Section Data kopyala
    const sourceBytes = new Uint8Array(
      sectionList[i].data.buffer,
      sectionList[i].data.byteOffset,
      h.byteLength
    );
    resultBytes.set(sourceBytes, h.byteOffset);
  }

  return resultBytes;
}

export interface ValidatedManifestChunk {
  chunkId: string;
  byteLength: number;
  sha256: string;
  layoutId: string;
  /** Older manifests may omit bounds; new compiler output includes conservative world-space bounds. */
  bbox?: [number, number, number, number];
  /** Float64 world coordinate -> chunk-local Float32 round-trip error, measured per emitted vertex. */
  maxQuantizationErrorWorld?: number;
  /** Present only when the compiler received a complete active-view error profile. */
  maxQuantizationErrorCssPixels?: number;
  /** Float32 round-trip error for cumulative PATH_DISTANCE scalar values. */
  maxPathDistanceQuantizationErrorWorld?: number;
  /** Present only when the compiler received a complete active-view error profile. */
  maxPathDistanceQuantizationErrorCssPixels?: number;
  /** Maximum source-boundary curve tessellation deviation represented by solid HATCH triangles. */
  maxHatchFillBoundaryTessellationErrorWorld?: number;
  /** Present only when the compiler received a complete active-view error profile. */
  maxHatchFillBoundaryTessellationErrorCssPixels?: number;
  /** Maximum Float32 vertex round-trip error for HATCH fill triangles. */
  maxHatchFillTriangleQuantizationErrorWorld?: number;
  /** Present only when the compiler received a complete active-view error profile. */
  maxHatchFillTriangleQuantizationErrorCssPixels?: number;
  /** Per-fill sum of source-boundary tessellation and encoded triangle vertex error. */
  maxHatchFillEncodedGeometryErrorWorld?: number;
  /** Present only when the compiler received a complete active-view error profile. */
  maxHatchFillEncodedGeometryErrorCssPixels?: number;
  /** Conservative affine CURVE_DATA center/basis/parameter encoding error per chunk. */
  maxCurveSourceQuantizationErrorWorld?: number;
  /** Present only when the compiler received a complete active-view error profile. */
  maxCurveSourceQuantizationErrorCssPixels?: number;
  /** Maximum exact circular arc/circle chord sagitta for direct CIRCLE/ARC strokes. */
  maxCircularCurveTessellationErrorWorld?: number;
  /** Present only when the compiler received a complete active-view error profile. */
  maxCircularCurveTessellationErrorCssPixels?: number;
  /** Maximum bounded tessellation error for direct top-level ELLIPSE strokes. */
  maxEllipseCurveTessellationErrorWorld?: number;
  /** Present only when the compiler received a complete active-view error profile. */
  maxEllipseCurveTessellationErrorCssPixels?: number;
  /** Maximum bounded static chord error for standalone or nested SPLINE strokes. */
  maxSplineCurveTessellationErrorWorld?: number;
  /** Present only when the compiler received a complete active-view error profile. */
  maxSplineCurveTessellationErrorCssPixels?: number;
  /** Conservative static centerline chord error for continuous, widthless LWPOLYLINE bulges. */
  maxBulgeCurveTessellationErrorWorld?: number;
  /** Present only when the compiler received a complete active-view error profile. */
  maxBulgeCurveTessellationErrorCssPixels?: number;
  /** Per-curve sum of static chord sagitta and that emitted line primitive's Float32 endpoint error. */
  maxCurveEncodedGeometryErrorWorld?: number;
  /** Present only when the compiler received a complete active-view error profile. */
  maxCurveEncodedGeometryErrorCssPixels?: number;
}

export interface ValidatedSceneManifest {
  schemaVersion: number;
  sceneId: string;
  sourceVersionKey: string;
  sourceSha256: string;
  qualityStatus: "exact" | "degraded";
  diagnosticsSummary: {
    unknownEntityCount: number | null;
    unknownObjectCount: number | null;
    missingFontCount: number | null;
    missingDependencyCount: number | null;
    diagnosticCodes: string[];
  };
  layouts: Array<{
    layoutId: string;
    sourceName: string;
    kind: "model" | "paper";
    bbox: [number, number, number, number];
    units: number;
  }>;
  layers?: Record<string, any>;
  chunks: ValidatedManifestChunk[];
  totalExpectedBytes: number;
}

const SHA256_REGEX = /^[a-f0-9]{64}$/i;

/**
 * Manifest JSON verisini doğrular, şema/ABI, finite bbox ve tüm index sayfalarındaki
 * chunk listesini set tabanlı olarak normalize eder. Çelişki veya format hatalarında throw eder.
 */
export function validateSceneManifest(raw: unknown): ValidatedSceneManifest {
  if (!raw || typeof raw !== "object") {
    throw new Error("[ManifestValidation] Geçersiz manifest verisi: bir nesne bekleniyor.");
  }
  const m = raw as Record<string, any>;

  if (m.schemaVersion !== 1) {
    throw new Error(`[ManifestValidation] Desteklenmeyen şema sürümü: ${m.schemaVersion}`);
  }

  if (typeof m.sceneId !== "string" || m.sceneId.trim().length === 0) {
    throw new Error("[ManifestValidation] sceneId eksik veya geçersiz.");
  }

  if (typeof m.sourceVersionKey !== "string" || typeof m.sourceSha256 !== "string") {
    throw new Error("[ManifestValidation] Kaynak kimlik alanları (sourceVersionKey / sourceSha256) eksik.");
  }

  // Layouts ve finite BBox kontrolü
  if (!Array.isArray(m.layouts) || m.layouts.length === 0) {
    throw new Error("[ManifestValidation] Manifest içinde geçerli layout listesi bulunamadı.");
  }

  const validatedLayouts = m.layouts.map((l: any, idx: number) => {
    if (!l || typeof l !== "object") {
      throw new Error(`[ManifestValidation] Layout #${idx} geçersiz.`);
    }
    const bbox = l.bbox;
    if (
      !Array.isArray(bbox) ||
      bbox.length !== 4 ||
      !bbox.every((n: any) => typeof n === "number" && Number.isFinite(n))
    ) {
      throw new Error(`[ManifestValidation] Layout '${l.layoutId || idx}' için finite olmayan bbox tespit edildi.`);
    }
    if (bbox[0] > bbox[2] || bbox[1] > bbox[3]) {
      throw new Error(`[ManifestValidation] Layout '${l.layoutId || idx}' min > max bbox sırası geçersiz.`);
    }
    return {
      layoutId: String(l.layoutId || "Model"),
      sourceName: String(l.sourceName || l.name || "Model"),
      kind: l.kind === "paper" ? ("paper" as const) : ("model" as const),
      bbox: [bbox[0], bbox[1], bbox[2], bbox[3]] as [number, number, number, number],
      units: typeof l.units === "number" ? l.units : 5,
    };
  });

  const normalizeChunk = (rawChunk: any): ValidatedManifestChunk => {
    if (!rawChunk || typeof rawChunk !== "object") {
      throw new Error("[ManifestValidation] Chunk metadata nesnesi geçersiz.");
    }
    let bbox: [number, number, number, number] | undefined;
    if (rawChunk.bbox !== undefined) {
      const value = rawChunk.bbox;
      if (
        !Array.isArray(value) || value.length !== 4 ||
        !value.every((coordinate: unknown) => typeof coordinate === "number" && Number.isFinite(coordinate))
      ) {
        throw new Error(`[ManifestValidation] Chunk '${rawChunk.chunkId || "?"}' için finite olmayan bbox.`);
      }
      if (value[0] > value[2] || value[1] > value[3]) {
        throw new Error(`[ManifestValidation] Chunk '${rawChunk.chunkId || "?"}' için min > max bbox sırası geçersiz.`);
      }
      bbox = [value[0], value[1], value[2], value[3]];
    }
    const maxQuantizationErrorWorld = rawChunk.maxQuantizationErrorWorld;
    const maxQuantizationErrorCssPixels = rawChunk.maxQuantizationErrorCssPixels;
    const maxPathDistanceQuantizationErrorWorld = rawChunk.maxPathDistanceQuantizationErrorWorld;
    const maxPathDistanceQuantizationErrorCssPixels = rawChunk.maxPathDistanceQuantizationErrorCssPixels;
    const maxHatchFillBoundaryTessellationErrorWorld = rawChunk.maxHatchFillBoundaryTessellationErrorWorld;
    const maxHatchFillBoundaryTessellationErrorCssPixels = rawChunk.maxHatchFillBoundaryTessellationErrorCssPixels;
    const maxHatchFillTriangleQuantizationErrorWorld = rawChunk.maxHatchFillTriangleQuantizationErrorWorld;
    const maxHatchFillTriangleQuantizationErrorCssPixels = rawChunk.maxHatchFillTriangleQuantizationErrorCssPixels;
    const maxHatchFillEncodedGeometryErrorWorld = rawChunk.maxHatchFillEncodedGeometryErrorWorld;
    const maxHatchFillEncodedGeometryErrorCssPixels = rawChunk.maxHatchFillEncodedGeometryErrorCssPixels;
    const maxCurveSourceQuantizationErrorWorld = rawChunk.maxCurveSourceQuantizationErrorWorld;
    const maxCurveSourceQuantizationErrorCssPixels = rawChunk.maxCurveSourceQuantizationErrorCssPixels;
    const maxCircularCurveTessellationErrorWorld = rawChunk.maxCircularCurveTessellationErrorWorld;
    const maxCircularCurveTessellationErrorCssPixels = rawChunk.maxCircularCurveTessellationErrorCssPixels;
    const maxEllipseCurveTessellationErrorWorld = rawChunk.maxEllipseCurveTessellationErrorWorld;
    const maxEllipseCurveTessellationErrorCssPixels = rawChunk.maxEllipseCurveTessellationErrorCssPixels;
    const maxSplineCurveTessellationErrorWorld = rawChunk.maxSplineCurveTessellationErrorWorld;
    const maxSplineCurveTessellationErrorCssPixels = rawChunk.maxSplineCurveTessellationErrorCssPixels;
    const maxBulgeCurveTessellationErrorWorld = rawChunk.maxBulgeCurveTessellationErrorWorld;
    const maxBulgeCurveTessellationErrorCssPixels = rawChunk.maxBulgeCurveTessellationErrorCssPixels;
    const maxCurveEncodedGeometryErrorWorld = rawChunk.maxCurveEncodedGeometryErrorWorld;
    const maxCurveEncodedGeometryErrorCssPixels = rawChunk.maxCurveEncodedGeometryErrorCssPixels;
    for (const [field, value] of [
      ["maxQuantizationErrorWorld", maxQuantizationErrorWorld],
      ["maxQuantizationErrorCssPixels", maxQuantizationErrorCssPixels],
      ["maxPathDistanceQuantizationErrorWorld", maxPathDistanceQuantizationErrorWorld],
      ["maxPathDistanceQuantizationErrorCssPixels", maxPathDistanceQuantizationErrorCssPixels],
      ["maxHatchFillBoundaryTessellationErrorWorld", maxHatchFillBoundaryTessellationErrorWorld],
      ["maxHatchFillBoundaryTessellationErrorCssPixels", maxHatchFillBoundaryTessellationErrorCssPixels],
      ["maxHatchFillTriangleQuantizationErrorWorld", maxHatchFillTriangleQuantizationErrorWorld],
      ["maxHatchFillTriangleQuantizationErrorCssPixels", maxHatchFillTriangleQuantizationErrorCssPixels],
      ["maxHatchFillEncodedGeometryErrorWorld", maxHatchFillEncodedGeometryErrorWorld],
      ["maxHatchFillEncodedGeometryErrorCssPixels", maxHatchFillEncodedGeometryErrorCssPixels],
      ["maxCurveSourceQuantizationErrorWorld", maxCurveSourceQuantizationErrorWorld],
      ["maxCurveSourceQuantizationErrorCssPixels", maxCurveSourceQuantizationErrorCssPixels],
      ["maxCircularCurveTessellationErrorWorld", maxCircularCurveTessellationErrorWorld],
      ["maxCircularCurveTessellationErrorCssPixels", maxCircularCurveTessellationErrorCssPixels],
      ["maxEllipseCurveTessellationErrorWorld", maxEllipseCurveTessellationErrorWorld],
      ["maxEllipseCurveTessellationErrorCssPixels", maxEllipseCurveTessellationErrorCssPixels],
      ["maxSplineCurveTessellationErrorWorld", maxSplineCurveTessellationErrorWorld],
      ["maxSplineCurveTessellationErrorCssPixels", maxSplineCurveTessellationErrorCssPixels],
      ["maxBulgeCurveTessellationErrorWorld", maxBulgeCurveTessellationErrorWorld],
      ["maxBulgeCurveTessellationErrorCssPixels", maxBulgeCurveTessellationErrorCssPixels],
      ["maxCurveEncodedGeometryErrorWorld", maxCurveEncodedGeometryErrorWorld],
      ["maxCurveEncodedGeometryErrorCssPixels", maxCurveEncodedGeometryErrorCssPixels],
    ] as const) {
      if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
        throw new Error(`[ManifestValidation] Chunk '${rawChunk.chunkId || "?"}' için geçersiz ${field}.`);
      }
    }
    return {
      chunkId: String(rawChunk.chunkId),
      byteLength: Number(rawChunk.byteLength),
      sha256: String(rawChunk.sha256),
      layoutId: String(rawChunk.layoutId || "Model"),
      ...(bbox ? { bbox } : {}),
      ...(maxQuantizationErrorWorld === undefined ? {} : { maxQuantizationErrorWorld }),
      ...(maxQuantizationErrorCssPixels === undefined ? {} : { maxQuantizationErrorCssPixels }),
      ...(maxPathDistanceQuantizationErrorWorld === undefined ? {} : { maxPathDistanceQuantizationErrorWorld }),
      ...(maxPathDistanceQuantizationErrorCssPixels === undefined ? {} : { maxPathDistanceQuantizationErrorCssPixels }),
      ...(maxHatchFillBoundaryTessellationErrorWorld === undefined ? {} : { maxHatchFillBoundaryTessellationErrorWorld }),
      ...(maxHatchFillBoundaryTessellationErrorCssPixels === undefined ? {} : { maxHatchFillBoundaryTessellationErrorCssPixels }),
      ...(maxHatchFillTriangleQuantizationErrorWorld === undefined ? {} : { maxHatchFillTriangleQuantizationErrorWorld }),
      ...(maxHatchFillTriangleQuantizationErrorCssPixels === undefined ? {} : { maxHatchFillTriangleQuantizationErrorCssPixels }),
      ...(maxHatchFillEncodedGeometryErrorWorld === undefined ? {} : { maxHatchFillEncodedGeometryErrorWorld }),
      ...(maxHatchFillEncodedGeometryErrorCssPixels === undefined ? {} : { maxHatchFillEncodedGeometryErrorCssPixels }),
      ...(maxCurveSourceQuantizationErrorWorld === undefined ? {} : { maxCurveSourceQuantizationErrorWorld }),
      ...(maxCurveSourceQuantizationErrorCssPixels === undefined ? {} : { maxCurveSourceQuantizationErrorCssPixels }),
      ...(maxCircularCurveTessellationErrorWorld === undefined ? {} : { maxCircularCurveTessellationErrorWorld }),
      ...(maxCircularCurveTessellationErrorCssPixels === undefined ? {} : { maxCircularCurveTessellationErrorCssPixels }),
      ...(maxEllipseCurveTessellationErrorWorld === undefined ? {} : { maxEllipseCurveTessellationErrorWorld }),
      ...(maxEllipseCurveTessellationErrorCssPixels === undefined ? {} : { maxEllipseCurveTessellationErrorCssPixels }),
      ...(maxSplineCurveTessellationErrorWorld === undefined ? {} : { maxSplineCurveTessellationErrorWorld }),
      ...(maxSplineCurveTessellationErrorCssPixels === undefined ? {} : { maxSplineCurveTessellationErrorCssPixels }),
      ...(maxBulgeCurveTessellationErrorWorld === undefined ? {} : { maxBulgeCurveTessellationErrorWorld }),
      ...(maxBulgeCurveTessellationErrorCssPixels === undefined ? {} : { maxBulgeCurveTessellationErrorCssPixels }),
      ...(maxCurveEncodedGeometryErrorWorld === undefined ? {} : { maxCurveEncodedGeometryErrorWorld }),
      ...(maxCurveEncodedGeometryErrorCssPixels === undefined ? {} : { maxCurveEncodedGeometryErrorCssPixels }),
    };
  };

  // Chunk toplama: Tüm indexPages sayfaları taranır
  const indexChunks: ValidatedManifestChunk[] = [];
  if (Array.isArray(m.indexPages)) {
    for (let p = 0; p < m.indexPages.length; p++) {
      const page = m.indexPages[p];
      if (page && Array.isArray(page.chunks)) {
        for (const ch of page.chunks) {
          indexChunks.push(normalizeChunk(ch));
        }
      }
    }
  }

  const flatChunks: ValidatedManifestChunk[] = Array.isArray(m.chunks)
    ? m.chunks.map(normalizeChunk)
    : [];

  // Flat chunks ile index listesi çelişki kontrolü
  if (flatChunks.length > 0 && indexChunks.length > 0) {
    const flatIds = new Set(flatChunks.map((c) => c.chunkId));
    const indexIds = new Set(indexChunks.map((c) => c.chunkId));
    if (flatIds.size !== indexIds.size || [...flatIds].some((id) => !indexIds.has(id))) {
      throw new Error(
        `[ManifestValidation] Çelişki: manifest.chunks (${flatIds.size}) ile indexPages (${indexIds.size}) chunk listesi uyuşmuyor.`
      );
    }
    const flatById = new Map<string, ValidatedManifestChunk>(flatChunks.map((chunk) => [chunk.chunkId, chunk]));
    for (const indexedChunk of indexChunks) {
      const flatChunk = flatById.get(indexedChunk.chunkId)!;
      if (indexedChunk.bbox && flatChunk.bbox && indexedChunk.bbox.some((value, index) => value !== flatChunk.bbox![index])) {
        throw new Error(`[ManifestValidation] Çelişki: chunk '${indexedChunk.chunkId}' bbox değeri indexPages ile manifest.chunks arasında uyuşmuyor.`);
      }
      indexedChunk.bbox ??= flatChunk.bbox;
      for (const field of [
        "maxQuantizationErrorWorld",
        "maxQuantizationErrorCssPixels",
        "maxPathDistanceQuantizationErrorWorld",
        "maxPathDistanceQuantizationErrorCssPixels",
        "maxHatchFillBoundaryTessellationErrorWorld",
        "maxHatchFillBoundaryTessellationErrorCssPixels",
        "maxHatchFillTriangleQuantizationErrorWorld",
        "maxHatchFillTriangleQuantizationErrorCssPixels",
        "maxHatchFillEncodedGeometryErrorWorld",
        "maxHatchFillEncodedGeometryErrorCssPixels",
        "maxCurveSourceQuantizationErrorWorld",
        "maxCurveSourceQuantizationErrorCssPixels",
        "maxCircularCurveTessellationErrorWorld",
        "maxCircularCurveTessellationErrorCssPixels",
        "maxEllipseCurveTessellationErrorWorld",
        "maxEllipseCurveTessellationErrorCssPixels",
        "maxSplineCurveTessellationErrorWorld",
        "maxSplineCurveTessellationErrorCssPixels",
        "maxBulgeCurveTessellationErrorWorld",
        "maxBulgeCurveTessellationErrorCssPixels",
        "maxCurveEncodedGeometryErrorWorld",
        "maxCurveEncodedGeometryErrorCssPixels",
      ] as const) {
        const indexedError = indexedChunk[field];
        const flatError = flatChunk[field];
        if (indexedError !== undefined && flatError !== undefined && indexedError !== flatError) {
          throw new Error(`[ManifestValidation] Çelişki: chunk '${indexedChunk.chunkId}' ${field} değeri indexPages ile manifest.chunks arasında uyuşmuyor.`);
        }
        indexedChunk[field] ??= flatError;
      }
    }
  }

  const rawChunkList = indexChunks.length > 0 ? indexChunks : flatChunks;
  const chunkMap = new Map<string, ValidatedManifestChunk>();
  let totalBytes = 0;

  for (const ch of rawChunkList) {
    if (!ch.chunkId || typeof ch.chunkId !== "string") {
      throw new Error("[ManifestValidation] Geçersiz chunkId.");
    }
    if (chunkMap.has(ch.chunkId)) {
      throw new Error(`[ManifestValidation] Yinelenen chunkId tespit edildi: ${ch.chunkId}`);
    }
    if (!Number.isInteger(ch.byteLength) || ch.byteLength <= 0 || ch.byteLength > MAX_CHUNK_BYTE_LENGTH) {
      throw new Error(
        `[ManifestValidation] Geçersiz byteLength (${ch.byteLength}) for chunk: ${ch.chunkId}`
      );
    }
    if (!SHA256_REGEX.test(ch.sha256)) {
      throw new Error(
        `[ManifestValidation] Geçersiz SHA-256 formatı for chunk '${ch.chunkId}': ${ch.sha256}`
      );
    }

    chunkMap.set(ch.chunkId, ch);
    totalBytes += ch.byteLength;
  }

  return {
    schemaVersion: 1,
    sceneId: m.sceneId,
    sourceVersionKey: m.sourceVersionKey,
    sourceSha256: m.sourceSha256,
    qualityStatus: m.qualityStatus === "degraded" ? "degraded" : "exact",
    diagnosticsSummary: {
      unknownEntityCount: m.diagnosticsSummary?.unknownEntityCount ?? 0,
      unknownObjectCount: m.diagnosticsSummary?.unknownObjectCount ?? 0,
      missingFontCount: m.diagnosticsSummary?.missingFontCount ?? 0,
      missingDependencyCount: m.diagnosticsSummary?.missingDependencyCount ?? 0,
      diagnosticCodes: Array.isArray(m.diagnosticsSummary?.diagnosticCodes)
        ? m.diagnosticsSummary.diagnosticCodes
        : [],
    },
    layouts: validatedLayouts,
    layers: m.layers,
    chunks: Array.from(chunkMap.values()),
    totalExpectedBytes: totalBytes,
  };
}
