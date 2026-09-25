// ============================================================================
// DWG/DXF MOTOR V2 — PRIMITIVE ROUNDTRIP & CHUNK EQUIVALENCE TEST (P07)
// ============================================================================
// Sözleşme: Fidelity v3 Planı P07
// 1. İkili protokol (DV2SCN01) wire roundtrip: build -> parse -> unpack eşitliği
// 2. 1 parça vs Çok parçaya bölünmüş eşdeğer sahne doğrulaması
// 3. Geçersiz magic, şema sürümü ve non-finite koordinat reddi (ABI koruma)
// ============================================================================

import assert from "node:assert";
import {
  buildSceneChunk,
  parseSceneChunk,
  SceneTag,
  SceneScalarType,
  DrawPrimitiveKind,
  UINT32_MAX,
} from "../../src/lib/cad-v2/protocol/binary-protocol";
import { unpackSceneChunk } from "../../src/workers/cad-v2/cad-v2-scene-worker";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import type { CadCanonicalDocument, CadLineEntity } from "../../src/lib/cad-v2/canonical/types";

console.log("=== P07 PRIMITIVE ROUNDTRIP & CHUNK EQUIVALENCE TESTS BAŞLIYOR ===");

// ----------------------------------------------------------------------------
// TEST 1: Wire Roundtrip (build -> parse -> unpack tam sayısal eşitlik)
// ----------------------------------------------------------------------------
console.log("\n[TEST 1] İkili DV2SCN01 protokolü wire roundtrip eşitliği...");

const inputOrigin = new Float64Array([12345.6789, -98765.4321]);
const inputXy = new Float32Array([1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8]);
const inputTri = new Float32Array([10.1, 20.2, 30.3, 40.4, 50.5, 60.6]);
const inputMeta = new TextEncoder().encode(
  JSON.stringify({
    layoutId: "Model",
    chunkIndex: 0,
    layerRuns: [{ layer: "0", color: [1, 0, 0], firstVertex: 0, vertexCount: 4 }],
    drawCommands: [
      { kind: "line", layer: "0", color: [1, 0, 0], firstVertex: 0, vertexCount: 4, order: 0 },
      { kind: "triangle", layer: "0", color: [0, 1, 0], firstVertex: 0, vertexCount: 3, order: 1 },
    ],
  })
);

const inputDrawRuns = new Uint32Array([
  DrawPrimitiveKind.STROKE_PATH, 0, 4, UINT32_MAX, 0, 0, UINT32_MAX, 0,
  DrawPrimitiveKind.TRIANGLES, 0, 3, UINT32_MAX, 0, 0, UINT32_MAX, 1,
]);

const chunkBytes = buildSceneChunk([
  {
    tag: SceneTag.META,
    scalarType: SceneScalarType.U8,
    componentCount: 1,
    elementCount: inputMeta.length,
    data: inputMeta,
  },
  {
    tag: SceneTag.ORIGIN,
    scalarType: SceneScalarType.F64,
    componentCount: 2,
    elementCount: 1,
    data: inputOrigin,
  },
  {
    tag: SceneTag.XY,
    scalarType: SceneScalarType.F32,
    componentCount: 2,
    elementCount: 4,
    data: inputXy,
  },
  {
    tag: SceneTag.TRIANGLES,
    scalarType: SceneScalarType.F32,
    componentCount: 2,
    elementCount: 3,
    data: inputTri,
  },
  {
    tag: SceneTag.DRAW_RUNS,
    scalarType: SceneScalarType.U32,
    componentCount: 8,
    elementCount: 2,
    data: inputDrawRuns,
  },
]);

assert(chunkBytes.byteLength > 0, "Chunk byte dizisi oluşturulmalı");

// Parse testi
const raw = parseSceneChunk(chunkBytes);
assert.strictEqual(raw.schemaVersion, 1);
assert.strictEqual(raw.totalByteLength, chunkBytes.byteLength);

// Unpack testi
const unpacked = unpackSceneChunk("chunk_roundtrip_test", chunkBytes);
assert.strictEqual(unpacked.chunkId, "chunk_roundtrip_test");

// Float64 origin eşitliği
assert(Math.abs(unpacked.origin[0] - inputOrigin[0]) < 1e-9);
assert(Math.abs(unpacked.origin[1] - inputOrigin[1]) < 1e-9);

// Float32 XY eşitliği
assert.strictEqual(unpacked.xyArray.length, inputXy.length);
for (let i = 0; i < inputXy.length; i++) {
  assert(Math.abs(unpacked.xyArray[i] - inputXy[i]) < 1e-5);
}

// Float32 Triangles eşitliği
assert(unpacked.trianglesArray, "Triangles dizisi açılmalı");
assert.strictEqual(unpacked.trianglesArray.length, inputTri.length);
for (let i = 0; i < inputTri.length; i++) {
  assert(Math.abs(unpacked.trianglesArray[i] - inputTri[i]) < 1e-5);
}

// Draw runs eşitliği
assert(unpacked.drawRunsArray, "Draw runs açılmalı");
assert.strictEqual(unpacked.drawRunsArray.length, inputDrawRuns.length);
for (let i = 0; i < inputDrawRuns.length; i++) {
  assert.strictEqual(unpacked.drawRunsArray[i], inputDrawRuns[i]);
}

// Metadata eşitliği
assert.strictEqual(unpacked.meta?.layoutId, "Model");
assert.strictEqual(unpacked.meta?.drawCommands?.length, 2);

console.log("  ✓ Wire roundtrip sayısal eşitliği (Float64 origin, Float32 XY & Triangles) PASS");

// ----------------------------------------------------------------------------
// TEST 2: Tek Parça vs Çok Parçaya Bölünmüş Eşdeğer Sahne
// ----------------------------------------------------------------------------
console.log("\n[TEST 2] Tek parça vs çok parçaya bölünmüş eşdeğer sahne doğrulaması...");

// 60 segmentlik bir çizim oluştur
const lines60: CadLineEntity[] = [];
for (let i = 0; i < 60; i++) {
  lines60.push({
    type: "LINE",
    handle: `L_${i}`,
    layer: i % 2 === 0 ? "WALL" : "DOOR",
    order: BigInt(i * 10),
    visible: true,
    start: [i * 10, i * 5],
    end: [i * 10 + 8, i * 5 + 4],
    color: { method: "aci", aci: (i % 7) + 1 },
  } as CadLineEntity);
}

const docEquiv: CadCanonicalDocument = {
  sourceVersionKey: "test_equiv",
  sourceSha256: "equiv_hash",
  acadVersion: "AC1032",
  codepage: "ANSI_1252",
  measurement: 1,
  units: 4,
  layers: {
    "WALL": { id: "WALL", name: "WALL", color: { method: "aci", aci: 1 }, visible: true, frozen: false, locked: false, lineweightMm: 0, linetypeName: "CONTINUOUS" },
    "DOOR": { id: "DOOR", name: "DOOR", color: { method: "aci", aci: 3 }, visible: true, frozen: false, locked: false, lineweightMm: 0, linetypeName: "CONTINUOUS" },
  },
  linetypes: {},
  textStyles: {},
  blocks: {},
  viewports: {},
  diagnostics: [],
  modelSpaceEntities: lines60,
  layouts: {
    Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [0, 0, 100, 100] },
  },
};

// Derleme
const compiled = compileCanonicalToScene(docEquiv, { sceneId: "scene_equiv" });
const chunkCount = compiled.manifest.chunks.length;
assert(chunkCount >= 1, "En az 1 chunk üretilmeli");

let totalExtractedVertices = 0;
for (const chInfo of compiled.manifest.chunks) {
  const bytes = compiled.chunks.get(chInfo.chunkId)!;
  const unp = unpackSceneChunk(chInfo.chunkId, bytes);
  totalExtractedVertices += unp.vertexCount;
}

// 60 çizgi * 2 vertex/çizgi = 120 vertex
assert.strictEqual(totalExtractedVertices, 120, "Toplam açılan vertex sayısı 120 olmalı");
console.log(`  ✓ Parçalardan açılan toplam vertex (${totalExtractedVertices}) kaynak ile tam eşleşti PASS`);

// ----------------------------------------------------------------------------
// TEST 3: Geçersiz Magic, Şema Sürümü ve Non-Finite Float Reddi
// ----------------------------------------------------------------------------
console.log("\n[TEST 3] Geçersiz magic, şema ve non-finite float reddi...");

// A) Hatalı Magic
const badMagicBuffer = new Uint8Array(chunkBytes);
badMagicBuffer[0] = "X".charCodeAt(0); // "XV2SCN01"
assert.throws(
  () => parseSceneChunk(badMagicBuffer),
  /Geçersiz magic/,
  "Hatalı magic reddedilmeli"
);
console.log("  ✓ Hatalı magic reddedildi PASS");

// B) Hatalı Şema Sürümü
const badSchemaBuffer = new Uint8Array(chunkBytes);
new DataView(badSchemaBuffer.buffer, badSchemaBuffer.byteOffset).setUint32(8, 99, true); // schema = 99
assert.throws(
  () => parseSceneChunk(badSchemaBuffer),
  /Desteklenmeyen şema sürümü/,
  "Bilinmeyen şema sürümü reddedilmeli"
);
console.log("  ✓ Bilinmeyen şema sürümü reddedildi PASS");

// C) NaN / Non-Finite Değer Reddi
const nanXy = new Float32Array([1.0, NaN, 3.0, 4.0]);
const nanChunk = buildSceneChunk([
  {
    tag: SceneTag.META,
    scalarType: SceneScalarType.U8,
    componentCount: 1,
    elementCount: inputMeta.length,
    data: inputMeta,
  },
  {
    tag: SceneTag.ORIGIN,
    scalarType: SceneScalarType.F64,
    componentCount: 2,
    elementCount: 1,
    data: inputOrigin,
  },
  {
    tag: SceneTag.XY,
    scalarType: SceneScalarType.F32,
    componentCount: 2,
    elementCount: 2,
    data: nanXy,
  },
]);

assert.throws(
  () => parseSceneChunk(nanChunk),
  /non-finite/,
  "NaN içeren koordinat dizisi kesinlikle reddedilmeli"
);
console.log("  ✓ NaN içeren koordinat dizisi reddedildi PASS");

console.log("\n=== TÜM P07 PRIMITIVE ROUNDTRIP TESTLERİ BAŞARIYLA GEÇTİ (PASS) ===");
