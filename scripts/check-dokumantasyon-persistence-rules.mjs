// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 2/6: KALICILIK VE FAIL-CLOSED ENTEGRASYON TESTİ
// ============================================================================

import assert from "assert";

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 2/6 KALICILIK VE FAIL-CLOSED TESTİ");
console.log("======================================================================\n");

function resetEnv() {
  delete process.env.VERCEL;
  delete process.env.DOK_ALLOW_LOCAL_STORAGE;
  delete process.env.DATABASE_URL;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  process.env.NODE_ENV = "development";
}

async function runTests() {
  const {
    isVercelDeployment,
    isExplicitLocalDokMode,
    assertDurableDokumantasyonRuntime,
    DokRuntimeConfigError,
  } = await import("../src/lib/dokumantasyon/runtime-mode.ts");
  const { readLocalDb } = await import("../src/lib/dokumantasyon/local-store.ts");

  // -------------------------------------------------------------------
  // TEST 1: VERCEL=1 iken DATABASE_URL yok -> FAIL-CLOSED (503 / FORBIDDEN)
  // -------------------------------------------------------------------
  console.log("▶ TEST 1: VERCEL=1 Ortamında Local Storage & /tmp Kesinlikle Yasaklanmalıdır");
  resetEnv();
  process.env.VERCEL = "1";
  process.env.DOK_ALLOW_LOCAL_STORAGE = "true"; // Vercel'de bu flag bile geçersiz olmalı!

  assert.strictEqual(isVercelDeployment(), true, "VERCEL ortamı true olmalıdır.");
  assert.strictEqual(isExplicitLocalDokMode(), false, "Vercel üzerinde local mode her zaman false olmalıdır.");

  let test1Threw = false;
  try {
    readLocalDb();
  } catch (err) {
    test1Threw = true;
    assert(err instanceof DokRuntimeConfigError, "Hata DokRuntimeConfigError olmalıdır.");
    assert.strictEqual(err.code, "LOCAL_STORAGE_FORBIDDEN", "Hata kodu LOCAL_STORAGE_FORBIDDEN olmalıdır.");
  }
  assert.strictEqual(test1Threw, true, "Vercel üzerinde readLocalDb çağrısı hata fırlatmalıdır.");
  console.log("  ✓ [BAŞARILI] Vercel ortamında local storage ve /tmp çağrısı güvenle engellendi (LOCAL_STORAGE_FORBIDDEN).");

  // -------------------------------------------------------------------
  // TEST 2: VERCEL=1 iken DATABASE_URL var ama BLOB_TOKEN yok -> UPLOAD FAIL-CLOSED
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 2: VERCEL=1 Ortamında Blob Token Eksikse Upload Fail-Closed Olmalıdır");
  resetEnv();
  process.env.VERCEL = "1";
  process.env.DATABASE_URL = "postgresql://mock:mock@ep-mock.neon.tech/neondb";

  let test2Threw = false;
  try {
    assertDurableDokumantasyonRuntime(true); // requireBlob = true
  } catch (err) {
    test2Threw = true;
    assert(err instanceof DokRuntimeConfigError, "Hata DokRuntimeConfigError olmalıdır.");
    assert.strictEqual(err.code, "BLOB_NOT_CONFIGURED", "Hata kodu BLOB_NOT_CONFIGURED olmalıdır.");
  }
  assert.strictEqual(test2Threw, true, "Blob token eksikse assertDurableDokumantasyonRuntime(true) hata fırlatmalıdır.");
  console.log("  ✓ [BAŞARILI] Blob token eksikliği sessiz local fallback yerine 503 BLOB_NOT_CONFIGURED üretti.");

  // -------------------------------------------------------------------
  // TEST 3: VERCEL=1 iken Her İkisi de Eksikse -> FAIL-CLOSED
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 3: VERCEL=1 Ortamında Hem DB Hem Blob Eksikse Fail-Closed");
  resetEnv();
  process.env.VERCEL = "1";

  let test3Threw = false;
  try {
    assertDurableDokumantasyonRuntime(false);
  } catch (err) {
    test3Threw = true;
    assert(err instanceof DokRuntimeConfigError, "Hata DokRuntimeConfigError olmalıdır.");
    assert.strictEqual(err.code, "DATABASE_NOT_CONFIGURED", "Hata kodu DATABASE_NOT_CONFIGURED olmalıdır.");
  }
  assert.strictEqual(test3Threw, true, "Her ikisi de eksikse DATABASE_NOT_CONFIGURED fırlatılmalıdır.");
  console.log("  ✓ [BAŞARILI] DB ve Blob eksikliği sessiz /tmp fallback yerine 503 DATABASE_NOT_CONFIGURED üretti.");

  // -------------------------------------------------------------------
  // TEST 4: Localhost + DOK_ALLOW_LOCAL_STORAGE=true -> Yerel Geliştirmeye İzin Ver
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 4: Localhost Ortamında DOK_ALLOW_LOCAL_STORAGE=true İken Yerel Geliştirme Çalışmalıdır");
  resetEnv();
  process.env.DOK_ALLOW_LOCAL_STORAGE = "true";

  assert.strictEqual(isExplicitLocalDokMode(), true, "Explicit local mode true olmalıdır.");
  let test4Success = false;
  try {
    assertDurableDokumantasyonRuntime(true);
    const db = readLocalDb();
    assert(Array.isArray(db.files), "db.files dizi olmalıdır.");
    test4Success = true;
  } catch (err) {
    test4Success = false;
  }
  assert.strictEqual(test4Success, true, "Localhost üzerinde açıkça izin verildiğinde yerel DB çalışmalıdır.");
  console.log("  ✓ [BAŞARILI] Localhost ortamında DOK_ALLOW_LOCAL_STORAGE=true ile yerel geliştirme güvenle çalıştı.");

  // -------------------------------------------------------------------
  // TEST 5: Localhost + DOK_ALLOW_LOCAL_STORAGE=false (veya tanımsız) -> FAIL-CLOSED
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 5: Localhost Ortamında DOK_ALLOW_LOCAL_STORAGE=false İken Sessiz Fallback Engellenmelidir");
  resetEnv();
  process.env.DOK_ALLOW_LOCAL_STORAGE = "false";

  assert.strictEqual(isExplicitLocalDokMode(), false, "Explicit local mode false olmalıdır.");
  let test5Threw = false;
  try {
    readLocalDb();
  } catch (err) {
    test5Threw = true;
    assert(err instanceof DokRuntimeConfigError, "Hata DokRuntimeConfigError olmalıdır.");
  }
  assert.strictEqual(test5Threw, true, "DOK_ALLOW_LOCAL_STORAGE=false iken yerel DB engellenmelidir.");
  console.log("  ✓ [BAŞARILI] DOK_ALLOW_LOCAL_STORAGE=false iken sessiz fallback engellendi (FAIL-CLOSED).");

  console.log("\n======================================================================");
  console.log("AŞAMA 2/6 TEST SONUCU: TÜM FAIL-CLOSED VE KALICILIK KURALLARI %100 BAŞARILI!");
  console.log("======================================================================\n");
}

runTests().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
