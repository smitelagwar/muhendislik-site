// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 5/6: TRANSACTIONAL UPLOAD & INTENT DOĞRULAMA TESTİ
// ============================================================================

import assert from "assert";
import fs from "fs";
import path from "path";

// .env.local varsa otomatik yükle
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [k, ...v] = trimmed.split("=");
      if (!process.env[k.trim()]) {
        process.env[k.trim()] = v.join("=").trim();
      }
    }
  }
}

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 5/6 TRANSACTIONAL UPLOAD & INTENT TESTİ");
console.log("======================================================================\n");

async function runStage5Tests() {
  const { createUploadIntentToken, verifyUploadIntentToken } = await import("../src/lib/dokumantasyon/upload-intent.ts");
  const { createFileRecord } = await import("../src/lib/dokumantasyon/files.ts");

  // 1. Upload Intent Token Üretimi ve Parametre Bütünlüğü
  console.log("▶ 1. Upload Intent Token ve Parametre Bütünlüğü Testi");
  const validIntent = await createUploadIntentToken({
    intentId: "intent-12345",
    pathname: "dok_storage/test_plan.pdf",
    filename: "Statik_Hesap_Raporu.pdf",
    sizeBytes: 1048576,
    folderId: null,
    username: "admin",
  });

  assert(typeof validIntent === "string", "Intent token string olmalıdır.");
  const verified = await verifyUploadIntentToken(validIntent);
  assert.strictEqual(verified?.pathname, "dok_storage/test_plan.pdf");
  assert.strictEqual(verified?.filename, "Statik_Hesap_Raporu.pdf");
  assert.strictEqual(verified?.sizeBytes, 1048576);
  console.log("  ✓ [BAŞARILI] Upload Intent HMAC token üretildi ve parametreler doğrulandı.");

  // 2. Tahrif Edilmiş Token Reddi
  console.log("\n▶ 2. Tahrif Edilmiş Token Güvenlik Testi");
  const tampered = validIntent.slice(0, -5) + "abcde";
  const tamperedResult = await verifyUploadIntentToken(tampered);
  assert.strictEqual(tamperedResult, null, "Tahrif edilmiş token reddedilmelidir.");
  console.log("  ✓ [BAŞARILI] Tahrif edilmiş token güvenle geçersiz kılındı (null).");

  // 3. Idempotent DB Kaydı Testi (Mükerrer Finalize İstekleri)
  console.log("\n▶ 3. Idempotent Dosya Kaydı Testi (Mükerrer Finalize)");
  const testPathname = `dok_storage/idempotent_test_${Date.now()}.pdf`;

  const record1 = await createFileRecord({
    folder_id: null,
    display_name: "Idempotent_Test.pdf",
    blob_pathname: testPathname,
    blob_url: `local:idempotent_test_${Date.now()}.pdf`,
    size_bytes: 512,
    mime_type: "application/pdf",
    extension: ".pdf",
  });

  assert(record1 && record1.id, "İlk kayıt başarıyla oluşturulmalıdır.");

  // Aynı blob_pathname ile ikinci finalize çağrısı
  const record2 = await createFileRecord({
    folder_id: null,
    display_name: "Idempotent_Test.pdf",
    blob_pathname: testPathname,
    blob_url: `local:idempotent_test_${Date.now()}.pdf`,
    size_bytes: 512,
    mime_type: "application/pdf",
    extension: ".pdf",
  });

  assert.strictEqual(record1.id, record2.id, "Mükerrer finalize aynı dosya kaydını döndürmelidir (Idempotency).");
  console.log("  ✓ [BAŞARILI] Aynı blob_pathname ile mükerrer finalize çağrısında mevcut kayıt güvenle korundu.");

  console.log("\n======================================================================");
  console.log("AŞAMA 5/6 TEST SONUCU: TRANSACTIONAL UPLOAD VE IDEMPOTENCY %100 BAŞARILI!");
  console.log("======================================================================\n");
}

runStage5Tests().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
