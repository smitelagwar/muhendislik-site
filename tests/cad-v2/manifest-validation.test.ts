// ============================================================================
// DWG/DXF MOTOR V2 — P02 MANIFEST VALIDATION TEST
// ============================================================================
// Doğrulanacak senaryolar:
// 1. Geçerli manifest -> başarıyla normalize edilmiş ValidatedSceneManifest
// 2. Eksik sceneId / sourceVersionKey / sourceSha256 -> throw
// 3. Şema sürümü != 1 -> throw
// 4. Finite olmayan BBox (NaN, Infinity, minX > maxX) -> throw
// 5. Yinelenen chunkId -> throw
// 6. Geçersiz SHA-256 formatı veya geçersiz byteLength -> throw
// 7. Flat chunks ile indexPages listesi çelişkisi -> throw
// 8. Çoklu indexPages sayfalarının eksiksiz taranması -> PASS
// ============================================================================

import * as assert from "node:assert/strict";
import { validateSceneManifest } from "../../src/lib/cad-v2/protocol/binary-protocol";

function createValidManifestTemplate(): any {
  return {
    schemaVersion: 1,
    sceneId: "scene_test_1234567890abcdef",
    sourceVersionKey: "v1.0.0",
    sourceSha256: "17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086",
    qualityStatus: "exact",
    diagnosticsSummary: {
      unknownEntityCount: 0,
      unknownObjectCount: 0,
      missingFontCount: 0,
      missingDependencyCount: 0,
      diagnosticCodes: [],
    },
    layouts: [
      {
        layoutId: "Model",
        sourceName: "Model",
        kind: "model",
        bbox: [-1000, -1000, 1000, 1000],
        units: 4,
      },
    ],
    chunks: [
      {
        chunkId: "chunk_001",
        byteLength: 1024,
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        layoutId: "Model",
      },
    ],
  };
}

function testValidManifestPasses() {
  const raw = createValidManifestTemplate();
  const validated = validateSceneManifest(raw);
  assert.equal(validated.sceneId, "scene_test_1234567890abcdef");
  assert.equal(validated.chunks.length, 1);
  assert.equal(validated.totalExpectedBytes, 1024);
  console.log("  ✓ Geçerli manifest başarıyla doğrulandı.");
}

function testInvalidSchemaThrows() {
  const raw = createValidManifestTemplate();
  raw.schemaVersion = 2; // Geçersiz şema
  assert.throws(
    () => validateSceneManifest(raw),
    /Desteklenmeyen şema sürümü/,
    "Desteklenmeyen şema sürümünde hata fırlatılmalıdır."
  );
  console.log("  ✓ Geçersiz şema sürümü başarıyla yakalandı.");
}

function testNonFiniteBBoxThrows() {
  const raw = createValidManifestTemplate();
  raw.layouts[0].bbox = [NaN, 0, 100, 100];
  assert.throws(
    () => validateSceneManifest(raw),
    /finite olmayan bbox/,
    "NaN BBox tespitinde hata fırlatılmalıdır."
  );

  const raw2 = createValidManifestTemplate();
  raw2.layouts[0].bbox = [100, 0, 50, 100]; // minX > maxX
  assert.throws(
    () => validateSceneManifest(raw2),
    /min > max bbox sırası geçersiz/,
    "Ters BBox sınırlarında hata fırlatılmalıdır."
  );
  console.log("  ✓ Finite olmayan veya ters BBox başarıyla yakalandı.");
}

function testOptionalChunkBboxValidationAndCompatibility() {
  const withBounds = createValidManifestTemplate();
  withBounds.chunks[0].bbox = [-20, -10, 30, 40];
  assert.deepEqual(validateSceneManifest(withBounds).chunks[0]?.bbox, [-20, -10, 30, 40],
    "Yeni compiler chunk sınırı doğrulanmış metadata'da korunmalıdır.");

  const nonFinite = createValidManifestTemplate();
  nonFinite.chunks[0].bbox = [0, 0, Infinity, 10];
  assert.throws(() => validateSceneManifest(nonFinite), /Chunk .* için finite olmayan bbox/,
    "Chunk bbox NaN/Infinity kabul etmemelidir.");

  const inverted = createValidManifestTemplate();
  inverted.chunks[0].bbox = [10, 0, 0, 10];
  assert.throws(() => validateSceneManifest(inverted), /Chunk .* için min > max bbox sırası geçersiz/,
    "Ters sıralı chunk bbox reddedilmelidir.");

  const conflicting = createValidManifestTemplate();
  conflicting.chunks[0].bbox = [0, 0, 10, 10];
  conflicting.indexPages = [{ indexId: "idx_bbox", chunks: [{
    ...conflicting.chunks[0], bbox: [0, 0, 20, 20],
  }] }];
  assert.throws(() => validateSceneManifest(conflicting), /bbox değeri indexPages ile manifest\.chunks arasında uyuşmuyor/,
    "Flat ve index bbox çelişkisi reddedilmelidir.");

  const legacy = createValidManifestTemplate();
  assert.equal(validateSceneManifest(legacy).chunks[0]?.bbox, undefined,
    "Eski manifestler bbox alanı olmadan geriye uyumlu kalmalıdır.");
  console.log("  ✓ Chunk bbox finite/order/conflict doğrulaması ve eski manifest geriye uyumluluğu PASS.");
}

function testDuplicateChunkIdThrows() {
  const raw = createValidManifestTemplate();
  raw.chunks = [
    {
      chunkId: "chunk_dup",
      byteLength: 512,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      layoutId: "Model",
    },
    {
      chunkId: "chunk_dup", // Yinelenen!
      byteLength: 512,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      layoutId: "Model",
    },
  ];
  assert.throws(
    () => validateSceneManifest(raw),
    /Yinelenen chunkId/,
    "Yinelenen chunk ID'de hata fırlatılmalıdır."
  );
  console.log("  ✓ Yinelenen chunkId başarıyla yakalandı.");
}

function testInvalidShaThrows() {
  const raw = createValidManifestTemplate();
  raw.chunks[0].sha256 = "short_invalid_sha";
  assert.throws(
    () => validateSceneManifest(raw),
    /Geçersiz SHA-256 formatı/,
    "Geçersiz SHA-256 formatında hata fırlatılmalıdır."
  );
  console.log("  ✓ Geçersiz SHA-256 formatı başarıyla yakalandı.");
}

function testConflictingFlatAndIndexPagesThrows() {
  const raw = createValidManifestTemplate();
  raw.chunks = [
    {
      chunkId: "chunk_flat_A",
      byteLength: 512,
      sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      layoutId: "Model",
    },
  ];
  raw.indexPages = [
    {
      indexId: "idx_01",
      chunks: [
        {
          chunkId: "chunk_index_B", // Farklı ID!
          byteLength: 512,
          sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          layoutId: "Model",
        },
      ],
    },
  ];

  assert.throws(
    () => validateSceneManifest(raw),
    /Çelişki: manifest\.chunks .* ile indexPages .* chunk listesi uyuşmuyor/,
    "Flat chunks ile indexPages çeliştiğinde hata fırlatılmalıdır."
  );
  console.log("  ✓ Flat chunks ile indexPages çelişkisi başarıyla yakalandı.");
}

function testMultipleIndexPagesCombinedCorrectly() {
  const raw = createValidManifestTemplate();
  delete raw.chunks; // flat chunks yok, sadece indexPages var
  raw.indexPages = [
    {
      indexId: "idx_01",
      chunks: [
        {
          chunkId: "chunk_p1_01",
          byteLength: 1000,
          sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          layoutId: "Model",
        },
      ],
    },
    {
      indexId: "idx_02",
      chunks: [
        {
          chunkId: "chunk_p2_02",
          byteLength: 2000,
          sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          layoutId: "Model",
        },
      ],
    },
  ];

  const validated = validateSceneManifest(raw);
  assert.equal(validated.chunks.length, 2, "Her iki index sayfasındaki chunk'lar toplanmalıdır.");
  assert.equal(validated.totalExpectedBytes, 3000, "Toplam byte doğru hesaplanmalıdır.");
  console.log("  ✓ Çoklu indexPages başarıyla birleştirildi.");
}

function main() {
  console.log("▶ P02 Manifest Validation Testleri Başlatılıyor...");
  testValidManifestPasses();
  testInvalidSchemaThrows();
  testNonFiniteBBoxThrows();
  testOptionalChunkBboxValidationAndCompatibility();
  testDuplicateChunkIdThrows();
  testInvalidShaThrows();
  testConflictingFlatAndIndexPagesThrows();
  testMultipleIndexPagesCombinedCorrectly();
  console.log("✅ P02 Manifest Validation Testleri Başarıyla Geçti.");
}

main();
