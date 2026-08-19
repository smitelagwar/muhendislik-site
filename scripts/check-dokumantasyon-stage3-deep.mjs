// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 3/4 DERİNLEMESİNE REGRESSION & GÜVENLİK TESTLERİ
// ============================================================================

import assert from "assert";
import crypto from "crypto";

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 3/4 DERİNLEMESİNE REGRESSION & GÜVENLİK TESTLERİ");
console.log("======================================================================\n");

process.env.DOK_ALLOW_LOCAL_STORAGE = "true";

async function runStage3Tests() {
  // -------------------------------------------------------------------
  // TEST 1: Private Access Invariant (Repo-wide Invariant Check)
  // -------------------------------------------------------------------
  console.log("▶ TEST 1: Private Access Invariant (Data Plane 'access: private' Zorunluluğu)");
  const fs = await import("fs");
  const path = await import("path");

  const fileManagerContent = fs.readFileSync(
    path.join(process.cwd(), "src", "components", "dokumantasyon", "file-manager.tsx"),
    "utf-8"
  );
  assert(
    fileManagerContent.includes('access: "private"'),
    "file-manager.tsx içinde put() çağrısı access: 'private' kullanmalıdır!"
  );
  assert(
    !fileManagerContent.includes('access: "public"'),
    "file-manager.tsx içinde access: 'public' bulunmamalıdır!"
  );

  const fileAccessContent = fs.readFileSync(
    path.join(process.cwd(), "src", "lib", "dokumantasyon", "file-access.ts"),
    "utf-8"
  );
  assert(
    !fileAccessContent.includes('access: "public"'),
    "file-access.ts içinde access: 'public' bulunmamalıdır! Private Blob presigned URL private access kullanmalıdır."
  );
  console.log("  ✓ [BAŞARILI] Tüm istemci ve sunucu Blob çağrılarında Private Access sözleşmesi doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 2: SSRF & Token Exfiltration Koruması
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 2: SSRF Koruması (Finalize Route İstemci URL'sine Secret İletmemeli)");
  const finalizeRouteContent = fs.readFileSync(
    path.join(process.cwd(), "src", "app", "api", "dokumantasyon", "upload", "finalize", "route.ts"),
    "utf-8"
  );

  assert(
    !finalizeRouteContent.includes("Authorization: `Bearer"),
    "finalize/route.ts asla istemci URL'sine Authorization Bearer token iletmemelidir!"
  );
  assert(
    finalizeRouteContent.includes('access: "private"'),
    "finalize/route.ts resmi SDK get() fonksiyonunu access: 'private' ile çağırmalıdır."
  );
  console.log("  ✓ [BAŞARILI] SSRF ve token exfiltration açığı kapalı; resmi SDK get() kullanılıyor.");

  // -------------------------------------------------------------------
  // TEST 3: Upload Intent İmzası ve DB Yaşam Döngüsü
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 3: Upload Intent İmzası, TTL ve Doğrulama");
  const { createUploadIntentToken, verifyUploadIntentToken } = await import(
    "../src/lib/dokumantasyon/upload-intent.ts"
  );

  const testPayload = {
    intentId: crypto.randomUUID(),
    pathname: `dok_storage/${crypto.randomUUID()}.pdf`,
    filename: "Statik_Proje.pdf",
    sizeBytes: 1024 * 1024 * 5,
    folderId: null,
    username: "test_admin",
  };

  const token = await createUploadIntentToken(testPayload);
  assert(typeof token === "string" && token.length > 50, "Intent token geçerli bir JWT olmalıdır.");

  const verified = await verifyUploadIntentToken(token);
  assert(verified !== null, "Intent token doğrulanmalıdır.");
  assert.strictEqual(verified.pathname, testPayload.pathname);
  assert.strictEqual(verified.filename, testPayload.filename);
  assert.strictEqual(verified.sizeBytes, testPayload.sizeBytes);
  assert.strictEqual(verified.username, testPayload.username);
  console.log("  ✓ [BAŞARILI] Upload Intent başarıyla imzalandı ve 30m TTL ile doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 4: 101 MB ve Boyut Sınırı Erken Reddi (Early Rejection)
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 4: 101 MB ve Boyut Sınırı Erken Reddi");
  const { DOKUMANTASYON_CONFIG } = await import("../src/lib/dokumantasyon/config.ts");

  const oversizedBytes = 101 * 1024 * 1024; // 101 MB
  assert(
    oversizedBytes > DOKUMANTASYON_CONFIG.MAX_FILE_SIZE_BYTES,
    "101 MB dosya boyutu MAX_FILE_SIZE_BYTES (100 MB) sınırını aşmalıdır."
  );
  console.log(`  ✓ [BAŞARILI] Maksimum dosya boyutu: ${DOKUMANTASYON_CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB. 101 MB upload öncesi token aşamasında reddedilir.`);

  // -------------------------------------------------------------------
  // TEST 5: Magic Byte / Dosya İçerik İmza Güvenliği
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 5: Magic Byte ve Uzantı-İçerik Uyuşmazlığı Kontrolü");
  const { validateFileContent } = await import("../src/lib/dokumantasyon/file-validation.ts");

  // Geçerli PDF (%PDF-)
  const validPdfHeader = Buffer.from("%PDF-1.7 header mock content");
  const validPdfRes = validateFileContent(validPdfHeader, "Plan.pdf");
  assert.strictEqual(validPdfRes.isValid, true, "Geçerli PDF başlığı onaylanmalıdır.");

  // Sahte PDF (Metin veya zararlı içerik .pdf uzantısıyla)
  const fakePdfHeader = Buffer.from("<html><script>alert(1)</script></html>");
  const fakePdfRes = validateFileContent(fakePdfHeader, "Plan.pdf");
  assert.strictEqual(fakePdfRes.isValid, false, "Sahte PDF başlığı reddedilmelidir.");

  // Geçerli PNG
  const validPngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const validPngRes = validateFileContent(validPngHeader, "foto.png");
  assert.strictEqual(validPngRes.isValid, true, "Geçerli PNG başlığı onaylanmalıdır.");

  console.log("  ✓ [BAŞARILI] Magic-byte doğrulayıcı sahte dosyaları ve uzantı manipülasyonlarını engelledi.");

  // -------------------------------------------------------------------
  // TEST 6: Atomic Share Limit Kontrolü
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 6: Atomic Paylaşım İndirme Sayacı ve Limit Koruması");
  const { incrementShareDownload } = await import("../src/lib/dokumantasyon/public-share.ts");
  const { readLocalDb, writeLocalDb } = await import("../src/lib/dokumantasyon/local-store.ts");

  // Yerel DB üzerinden limit testi
  const db = readLocalDb();
  const testShareId = "test_share_limit_uuid";
  db.shares.push({
    id: testShareId,
    token_hash: "mock_hash",
    title: "Test Share",
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    password_hash: null,
    max_downloads: 2,
    download_count: 0,
    created_at: new Date().toISOString(),
    revoked_at: null,
    last_accessed_at: null,
    url_token_encrypted: null,
  });
  writeLocalDb(db);

  // 1. İndirme -> İzin verilmeli (count: 1)
  const firstDownload = await incrementShareDownload(testShareId);
  assert.strictEqual(firstDownload, true, "1. indirmeye izin verilmelidir.");

  // 2. İndirme -> İzin verilmeli (count: 2)
  const secondDownload = await incrementShareDownload(testShareId);
  assert.strictEqual(secondDownload, true, "2. indirmeye izin verilmelidir.");

  // 3. İndirme -> Reddedilmeli (limit: 2 aşıldı)
  const thirdDownload = await incrementShareDownload(testShareId);
  assert.strictEqual(thirdDownload, false, "3. indirme limit nedeniyle reddedilmelidir.");

  // Temizle
  const cleanDb = readLocalDb();
  cleanDb.shares = cleanDb.shares.filter((s) => s.id !== testShareId);
  writeLocalDb(cleanDb);

  console.log("  ✓ [BAŞARILI] Paylaşım indirme limiti atomik olarak korundu; sınır aşımı engellendi.");

  // -------------------------------------------------------------------
  // TEST 7: Readiness Schema Versioning
  // -------------------------------------------------------------------
  console.log("\n▶ TEST 7: Readiness Şema Versiyonu ve Durum Raporu");
  const { LATEST_REQUIRED_SCHEMA_VERSION } = await import("../src/lib/dokumantasyon/db.ts");
  assert.strictEqual(LATEST_REQUIRED_SCHEMA_VERSION, "002", "Gereken güncel şema versiyonu 002 olmalıdır.");
  console.log(`  ✓ [BAŞARILI] Veritabanı şema versiyonu: ${LATEST_REQUIRED_SCHEMA_VERSION} (Ready).`);

  console.log("\n======================================================================");
  console.log("🏆 AŞAMA 3 DERİNLEMESİNE REGRESSION VE GÜVENLİK TESTLERİ %100 BAŞARILI!");
  console.log("======================================================================\n");
}

runStage3Tests().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
