// ============================================================================
// G03 TEST: DV2SCN01 BINARY PROTOCOL ROUNDTRIP & NEGATIVE VALIDATION
// ============================================================================

import {
  buildSceneChunk,
  parseSceneChunk,
  SceneTag,
  SceneScalarType,
  DrawPrimitiveKind,
  SCENE_MAGIC,
  MAX_DECODED_ALLOCATION_BYTES,
  UINT32_MAX,
} from "../../src/lib/cad-v2/protocol/binary-protocol";

console.log("=== DV2SCN01 Binary Protocol Testi ===");

// 1. Round-trip serialization/deserialization testi
const metaJson = JSON.stringify({
  sceneId: "test-scene-001",
  layerNames: ["0", "WALL", "DOOR"],
  units: 5,
});
const metaBytes = new TextEncoder().encode(metaJson);

const originData = new Float64Array([500000.0, 4200000.0]); // UTM / State Plane Float64 origin
const xyData = new Float32Array([0.0, 0.0, 100.0, 0.0, 100.0, 50.0, 0.0, 50.0]); // 4 vertices (x, y)
const trianglesData = new Float32Array([0, 0, 100, 0, 100, 50, 0, 0, 100, 50, 0, 50]); // 6 triangle vertices

const drawRunsData = new Uint32Array([
  DrawPrimitiveKind.TRIANGLES,
  0, // firstElement
  2, // elementCount
  UINT32_MAX, // instanceIndex (none)
  1, // layerLocalId
  0, // styleLocalId
  UINT32_MAX, // clipLocalId
  1, // orderLocalId
]);

const chunkBytes = buildSceneChunk([
  {
    tag: SceneTag.META,
    scalarType: SceneScalarType.U8,
    componentCount: 1,
    elementCount: metaBytes.length,
    data: metaBytes,
  },
  {
    tag: SceneTag.ORIGIN,
    scalarType: SceneScalarType.F64,
    componentCount: 2,
    elementCount: 1,
    data: originData,
  },
  {
    tag: SceneTag.XY,
    scalarType: SceneScalarType.F32,
    componentCount: 2,
    elementCount: 4,
    data: xyData,
  },
  {
    tag: SceneTag.TRIANGLES,
    scalarType: SceneScalarType.F32,
    componentCount: 2,
    elementCount: 6,
    data: trianglesData,
  },
  {
    tag: SceneTag.DRAW_RUNS,
    scalarType: SceneScalarType.U32,
    componentCount: 8,
    elementCount: 1,
    data: drawRunsData,
  },
]);

console.log("Üretilen chunk toplam byte uzunluğu:", chunkBytes.byteLength);

// Parse et ve doğrula
const parsed = parseSceneChunk(chunkBytes);
console.log("Parsed schemaVersion:", parsed.schemaVersion);
console.log("Parsed section count:", parsed.sections.size);

// Kontroller
if (parsed.schemaVersion !== 1) throw new Error("Şema sürümü 1 olmalıdır");
if (parsed.sections.size !== 5) throw new Error("5 section bekleniyordu");

const parsedOrigin = parsed.sections.get(SceneTag.ORIGIN)?.data as Float64Array;
if (!parsedOrigin || parsedOrigin[0] !== 500000.0 || parsedOrigin[1] !== 4200000.0) {
  throw new Error("ORIGIN Float64 değerleri eşleşmedi");
}

const parsedXy = parsed.sections.get(SceneTag.XY)?.data as Float32Array;
if (!parsedXy || parsedXy.length !== 8 || parsedXy[2] !== 100.0) {
  throw new Error("XY Float32 koordinatları eşleşmedi");
}

const parsedMetaBytes = parsed.sections.get(SceneTag.META)?.data as Uint8Array;
const parsedMeta = JSON.parse(new TextDecoder().decode(parsedMetaBytes));
if (parsedMeta.sceneId !== "test-scene-001") {
  throw new Error("META JSON ayrıştırma başarısız");
}

console.log(">>> Round-trip serileştirme ve ayrıştırma BAŞARILI <<<");

// 2. Negatif kontroller: bozuk magic, kesilmiş buffer, taşma
try {
  const corrupted = new Uint8Array(chunkBytes);
  corrupted[0] = 0x58; // 'X' -> "XV2SCN01"
  parseSceneChunk(corrupted);
  throw new Error("Bozuk magic reddedilmedi!");
} catch (err: unknown) {
  console.log("Negatif test (bozuk magic) beklendiği gibi reddedildi:", (err as Error).message);
}

try {
  const truncated = chunkBytes.subarray(0, 24); // < 32 bytes
  parseSceneChunk(truncated);
  throw new Error("Kesilmiş buffer reddedilmedi!");
} catch (err: unknown) {
  console.log("Negatif test (kesilmiş buffer) beklendiği gibi reddedildi:", (err as Error).message);
}

function assertRejects(label: string, bytes: Uint8Array, pattern: RegExp): void {
  try {
    parseSceneChunk(bytes);
    throw new Error(`${label} reddedilmedi`);
  } catch (error) {
    if (error instanceof Error && error.message === `${label} reddedilmedi`) throw error;
    if (!pattern.test(error instanceof Error ? error.message : String(error))) {
      throw new Error(`${label} yanlış nedenle reddedildi: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

const invalidSchema = new Uint8Array(chunkBytes);
new DataView(invalidSchema.buffer).setUint32(8, 99, true);
assertRejects("Unsupported schema", invalidSchema, /Desteklenmeyen şema sürümü/);

const invalidHeaderOffset = new Uint8Array(chunkBytes);
new DataView(invalidHeaderOffset.buffer).setUint32(20, 40, true);
assertRejects("Invalid section table offset", invalidHeaderOffset, /header ofset/);

const invalidReserved = new Uint8Array(chunkBytes);
new DataView(invalidReserved.buffer).setUint32(28, 1, true);
assertRejects("Invalid binary ABI reserved field", invalidReserved, /binary ABI/);

const overflowingTable = new Uint8Array(chunkBytes);
new DataView(overflowingTable.buffer).setUint32(16, 0xffff_ffff, true);
assertRejects("Overflowing section table", overflowingTable, /Section tablosu chunk sınırını aşıyor/);

const overlappingSections = new Uint8Array(chunkBytes);
const overlapView = new DataView(overlappingSections.buffer);
const firstSectionOffset = overlapView.getUint32(32 + 12, true);
overlapView.setUint32(32 + 32 + 12, firstSectionOffset, true);
assertRejects("Overlapping section payloads", overlappingSections, /Overlapping section/);

const nonFiniteFloat = new Uint8Array(chunkBytes);
const floatView = new DataView(nonFiniteFloat.buffer);
let xyEntryOffset = 32;
while (floatView.getUint32(xyEntryOffset, true) !== SceneTag.XY) xyEntryOffset += 32;
const xyByteOffset = floatView.getUint32(xyEntryOffset + 12, true);
floatView.setFloat32(xyByteOffset, Number.POSITIVE_INFINITY, true);
assertRejects("Non-finite float payload", nonFiniteFloat, /non-finite/);

const oversized = new Uint8Array(MAX_DECODED_ALLOCATION_BYTES + 1);
oversized.set(new TextEncoder().encode(SCENE_MAGIC), 0);
const oversizedView = new DataView(oversized.buffer);
oversizedView.setUint32(8, 1, true);
oversizedView.setUint32(12, oversized.byteLength, true);
assertRejects("Oversized typed-array input", oversized, /savunma sınırını aşıyor/);
console.log("L05 binary magic/schema/ABI/table/overlap/finite/allocation sınırları PASS.");
console.log("\n>>> G03 BINARY PROTOCOL TÜM TESTLER GEÇTİ (PASS) <<<");
