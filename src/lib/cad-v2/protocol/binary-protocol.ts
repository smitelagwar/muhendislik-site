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
