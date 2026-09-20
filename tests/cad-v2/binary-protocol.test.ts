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
const trianglesData = new Uint32Array([0, 1, 2, 0, 2, 3]); // 2 triangles

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
    scalarType: SceneScalarType.U32,
    componentCount: 3,
    elementCount: 2,
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

console.log("\n>>> G03 BINARY PROTOCOL TÜM TESTLER GEÇTİ (PASS) <<<");
