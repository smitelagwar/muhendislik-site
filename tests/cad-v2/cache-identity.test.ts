// ============================================================================
// DWG/DXF MOTOR V2 — P03 CACHE IDENTITY TEST SUITE
// ============================================================================
// Sözleşme: Fidelity v3 Planı P03, motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md

import * as assert from "node:assert/strict";
import {
  computeSceneIdentity,
  validateAuthoritativeRevision,
} from "../../src/lib/cad-v2/service/scene-identity";
import {
  CAD_V2_SCHEMA_VERSION,
  CAD_V2_COMPILER_REVISION,
  CAD_V2_FONT_DIGEST,
} from "../../src/lib/cad-v2/version";

async function testDeterministicSceneIdentity() {
  console.log("▶ P03 Cache Identity Testleri Başlatılıyor...");

  const baseParams = {
    fileId: "file_arch_001",
    sourceSha256: "17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086",
    authoritativeRevision: "rev_20260920_v1",
    tenantScope: "tenant_alpha",
  };

  // Test 1: Aynı parametrelerle çağrıldığında özdeş sahne kimliği üretmeli
  const id1 = computeSceneIdentity(baseParams);
  const id2 = computeSceneIdentity(baseParams);
  assert.equal(id1.sceneId, id2.sceneId, "Aynı parametrelerle özdeş sceneId üretilmelidir.");
  assert.equal(id1.exactCacheKey, id2.exactCacheKey, "Aynı parametrelerle özdeş exactCacheKey üretilmelidir.");
  assert.equal(id1.canonicalFingerprint, id2.canonicalFingerprint);
  assert.match(id1.sceneId, /^scene_[a-f0-9]{24}$/, "sceneId formatı 'scene_' + 24 hex olmalıdır.");
  console.log("  ✓ Deterministik sahne kimliği ve parmak izi doğrulandı.");

  // Test 2: Farklı sourceSha256 farklı sceneId üretmeli
  const idDiffSha = computeSceneIdentity({
    ...baseParams,
    sourceSha256: "0000000000000000000000000000000000000000000000000000000000000000",
  });
  assert.notEqual(id1.sceneId, idDiffSha.sceneId, "Farklı hash farklı sceneId üretmelidir.");
  console.log("  ✓ Farklı kaynak hash'i için farklı sceneId üretimi doğrulandı.");

  // Test 3: Farklı authoritativeRevision farklı sceneId üretmeli
  const idDiffRev = computeSceneIdentity({
    ...baseParams,
    authoritativeRevision: "rev_20260920_v2",
  });
  assert.notEqual(id1.sceneId, idDiffRev.sceneId, "Farklı revizyon farklı sceneId üretmelidir.");
  assert.notEqual(id1.exactCacheKey, idDiffRev.exactCacheKey);
  console.log("  ✓ Farklı revizyon için farklı sceneId üretimi doğrulandı.");

  // Test 4: Farklı compilerRevision veya schemaVersion farklı sceneId üretmeli
  const idDiffCompiler = computeSceneIdentity({
    ...baseParams,
    compilerRevision: "cad-v2-compiler-2026.10-next",
  });
  assert.notEqual(id1.sceneId, idDiffCompiler.sceneId, "Farklı compiler revision farklı sceneId üretmelidir.");

  const idDiffSchema = computeSceneIdentity({
    ...baseParams,
    schemaVersion: 2,
  });
  assert.notEqual(id1.sceneId, idDiffSchema.sceneId, "Farklı schemaVersion farklı sceneId üretmelidir.");

  const idDiffFont = computeSceneIdentity({
    ...baseParams,
    fontDigest: "custom-shx-digest-v2",
  });
  assert.notEqual(id1.sceneId, idDiffFont.sceneId, "Farklı fontDigest farklı sceneId üretmelidir.");
  console.log("  ✓ Compiler/Schema/Font değişikliklerinde sahne kimliğinin yenilenmesi doğrulandı.");

  // Test 5: Farklı tenantScope izolasyonu sağlamalı
  const idDiffTenant = computeSceneIdentity({
    ...baseParams,
    tenantScope: "tenant_beta",
  });
  assert.notEqual(id1.sceneId, idDiffTenant.sceneId, "Farklı tenant farklı sceneId üretmelidir.");
  assert.ok(idDiffTenant.exactCacheKey.startsWith("tenant_beta:"), "Tenant prefix cache key'e yansımalıdır.");
  console.log("  ✓ Tenant yetki izolasyonu doğrulandı.");

  // Test 6: Gevşek revizyonlar reddedilmeli
  assert.throws(
    () => validateAuthoritativeRevision(""),
    /Authoritative revision/i,
    "Boş revizyon reddedilmelidir."
  );
  assert.throws(
    () => validateAuthoritativeRevision("   "),
    /Authoritative revision boş olamaz/i,
    "Yalnızca boşluk içeren revizyon reddedilmelidir."
  );
  assert.throws(
    () => validateAuthoritativeRevision("file_001:latest"),
    /Gevşek revision ':latest'/i,
    ":latest gevşek revizyonu reddedilmelidir."
  );
  assert.throws(
    () => validateAuthoritativeRevision("latest"),
    /Gevşek revision ':latest'/i,
    "'latest' revizyonu reddedilmelidir."
  );
  console.log("  ✓ Gevşek revizyonların reddedilmesi doğrulandı.");

  console.log("✅ P03 Cache Identity Testleri Başarıyla Geçti.\n");
}

testDeterministicSceneIdentity().catch((err) => {
  console.error("P03 Cache Identity Test Hatası:", err);
  process.exit(1);
});
