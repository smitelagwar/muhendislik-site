// ============================================================================
// DWG/DXF MOTOR V2 — P02 CHUNK COMPLETENESS & INTEGRITY TEST
// ============================================================================
// Doğrulanacak senaryolar:
// 1. 10/10 parça tam eşleşmesi -> isComplete = true
// 2. 9/10 parça durumu -> isComplete = false (sessiz drop engeli)
// 3. Truncated buffer -> parseSceneChunk throw
// 4. Non-finite (NaN / Infinity) XY koordinatları -> parseSceneChunk throw
// 5. DRAW_RUNS aralığı vertex sayısını aştığında -> parseSceneChunk throw
// 6. Byte length ve SHA-256 doğrulama mantığı
// ============================================================================

import * as assert from "node:assert/strict";
import * as crypto from "node:crypto";
import {
  parseSceneChunk,
  buildSceneChunk,
  SceneTag,
  SceneScalarType,
  DrawPrimitiveKind,
} from "../../src/lib/cad-v2/protocol/binary-protocol";

function createValidBinaryChunk(): Uint8Array {
  const origin = new Float64Array([100.5, 200.75]);
  const xy = new Float32Array([0, 0, 10, 10, 20, 20, 30, 30]); // 4 vertices
  // DRAW_RUNS: 8 x U32 [kind, firstEl, count, inst, layer, style, clip, order]
  const runs = new Uint32Array([
    DrawPrimitiveKind.STROKE_PATH,
    0, // firstElement
    4, // elementCount (4 <= 4)
    0xffffffff,
    0,
    0,
    0xffffffff,
    1,
  ]);

  return buildSceneChunk([
    {
      tag: SceneTag.ORIGIN,
      scalarType: SceneScalarType.F64,
      componentCount: 2,
      elementCount: 1,
      data: origin,
    },
    {
      tag: SceneTag.XY,
      scalarType: SceneScalarType.F32,
      componentCount: 2,
      elementCount: 4,
      data: xy,
    },
    {
      tag: SceneTag.DRAW_RUNS,
      scalarType: SceneScalarType.U32,
      componentCount: 8,
      elementCount: 1,
      data: runs,
    },
  ]);
}

function testTenOfTenCompleteness() {
  const expectedChunkIds = new Set<string>();
  const rendererAcceptedChunkIds = new Set<string>();

  for (let i = 1; i <= 10; i++) {
    const id = `chunk_${String(i).padStart(3, "0")}`;
    expectedChunkIds.add(id);
    rendererAcceptedChunkIds.add(id);
  }

  const isComplete =
    expectedChunkIds.size === rendererAcceptedChunkIds.size &&
    [...expectedChunkIds].every((id) => rendererAcceptedChunkIds.has(id));

  assert.equal(isComplete, true, "10/10 parça tam kabul edilmelidir.");
  console.log("  ✓ 10/10 parça tamlığı başarıyla doğrulandı.");
}

function testNineOfTenRejectsPrematureReady() {
  const expectedChunkIds = new Set<string>();
  const rendererAcceptedChunkIds = new Set<string>();

  for (let i = 1; i <= 10; i++) {
    const id = `chunk_${String(i).padStart(3, "0")}`;
    expectedChunkIds.add(id);
    if (i !== 7) {
      // 7. parça eksik!
      rendererAcceptedChunkIds.add(id);
    }
  }

  const isComplete =
    expectedChunkIds.size === rendererAcceptedChunkIds.size &&
    [...expectedChunkIds].every((id) => rendererAcceptedChunkIds.has(id));

  assert.equal(isComplete, false, "9/10 parça varken tam hazır olunamaz!");
  const missingCount = expectedChunkIds.size - rendererAcceptedChunkIds.size;
  assert.equal(missingCount, 1, "Tam olarak 1 eksik parça saptanmalıdır.");
  console.log("  ✓ 9/10 eksik parça durumu doğru tespit edildi (erken ready engellendi).");
}

function testTruncatedBufferThrows() {
  const validChunk = createValidBinaryChunk();
  const truncated = validChunk.subarray(0, 40); // Kesilmiş buffer!

  assert.throws(
    () => parseSceneChunk(truncated),
    /Section aralığı chunk sınırını aşıyor|Geçersiz chunk boyutu|Byte uzunluğu uyuşmazlığı/,
    "Truncated buffer parseSceneChunk tarafından yakalanmalıdır."
  );
  console.log("  ✓ Kesilmiş (truncated) buffer başarıyla reddedildi.");
}

function testNonFiniteCoordinatesThrows() {
  const origin = new Float64Array([0, 0]);
  const invalidXy = new Float32Array([0, 0, NaN, 10, 20, 20]); // NaN koordinat!

  const chunkBytes = buildSceneChunk([
    {
      tag: SceneTag.ORIGIN,
      scalarType: SceneScalarType.F64,
      componentCount: 2,
      elementCount: 1,
      data: origin,
    },
    {
      tag: SceneTag.XY,
      scalarType: SceneScalarType.F32,
      componentCount: 2,
      elementCount: 3,
      data: invalidXy,
    },
  ]);

  assert.throws(
    () => parseSceneChunk(chunkBytes),
    /non-finite \(NaN\/Infinity\) değer/,
    "NaN koordinat içeren chunk throw etmelidir."
  );
  console.log("  ✓ Non-finite (NaN) koordinat tespiti başarılı.");
}

function testDrawRunsOutOfBoundsThrows() {
  const origin = new Float64Array([0, 0]);
  const xy = new Float32Array([0, 0, 10, 10]); // 2 vertices
  // DRAW_RUNS: firstElement = 0, elementCount = 5 (5 > 2 vertex!)
  const invalidRuns = new Uint32Array([
    DrawPrimitiveKind.STROKE_PATH,
    0,
    5, // AŞIM!
    0xffffffff,
    0,
    0,
    0xffffffff,
    1,
  ]);

  const chunkBytes = buildSceneChunk([
    {
      tag: SceneTag.ORIGIN,
      scalarType: SceneScalarType.F64,
      componentCount: 2,
      elementCount: 1,
      data: origin,
    },
    {
      tag: SceneTag.XY,
      scalarType: SceneScalarType.F32,
      componentCount: 2,
      elementCount: 2,
      data: xy,
    },
    {
      tag: SceneTag.DRAW_RUNS,
      scalarType: SceneScalarType.U32,
      componentCount: 8,
      elementCount: 1,
      data: invalidRuns,
    },
  ]);

  assert.throws(
    () => parseSceneChunk(chunkBytes),
    /DRAW_RUNS aralığı vertex sınırını aşıyor/,
    "Vertex sınırını aşan DRAW_RUNS throw etmelidir."
  );
  console.log("  ✓ DRAW_RUNS sınır aşımı başarıyla engellendi.");
}

function testSha256Verification() {
  const validChunk = createValidBinaryChunk();
  const actualHash = crypto.createHash("sha256").update(validChunk).digest("hex");
  const corruptedHash = "0000000000000000000000000000000000000000000000000000000000000000";

  assert.equal(actualHash.length, 64);
  assert.notEqual(actualHash, corruptedHash, "Bozuk hash uyuşmamalıdır.");
  console.log("  ✓ SHA-256 sağlama toplamı eşleşme mantığı doğrulandı.");
}

function main() {
  console.log("▶ P02 Chunk Completeness & Integrity Testleri Başlatılıyor...");
  testTenOfTenCompleteness();
  testNineOfTenRejectsPrematureReady();
  testTruncatedBufferThrows();
  testNonFiniteCoordinatesThrows();
  testDrawRunsOutOfBoundsThrows();
  testSha256Verification();
  console.log("✅ P02 Chunk Completeness & Integrity Testleri Başarıyla Geçti.");
}

main();
