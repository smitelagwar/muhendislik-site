// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 3/8 ORTAK VIEWER SAYFASI VE ENTEGRASYON TESTİ
// ============================================================================

import assert from "assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 3/8 ORTAK VIEWER SAYFASI TESTİ");
console.log("======================================================================\n");

function logStep(title) {
  console.log(`\n▶ ${title}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

async function runStage3Tests() {
  // -------------------------------------------------------------------
  // 1. KİMLİK DOĞRULAMA VE TEST DOSYASI HAZIRLIĞI
  // -------------------------------------------------------------------
  logStep("1. Oturum Açma ve Test Dosyası Hazırlığı");

  const loginRes = await fetch(`${BASE_URL}/api/dokumantasyon/giris`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin" }),
  });
  assert.strictEqual(loginRes.status, 200, "Admin girişi başarılı olmalıdır.");
  const rawCookies = typeof loginRes.headers.getSetCookie === "function"
    ? loginRes.headers.getSetCookie()
    : [loginRes.headers.get("set-cookie") || ""];
  const authCookie = rawCookies.map((c) => c.split(";")[0]).join("; ");

  // Test dosyası yükle
  const pdfContent = Buffer.from("%PDF-1.7\n1 0 obj\n<< /Title (Aşama 3 Test Paftası) >>\nendobj\n%%EOF");
  const uploadTokenRes = await fetch(`${BASE_URL}/api/dokumantasyon/upload/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: authCookie },
    body: JSON.stringify({
      filename: "stage3_preview_shell_test.pdf",
      size: pdfContent.length,
      mimeType: "application/pdf",
      folderId: null,
    }),
  });
  assert.strictEqual(uploadTokenRes.status, 200, "Upload token alınmalıdır.");
  const uploadTokenData = await uploadTokenRes.json();

  const formData = new FormData();
  formData.append("file", new Blob([pdfContent], { type: "application/pdf" }), "stage3_preview_shell_test.pdf");
  formData.append("pathname", uploadTokenData.pathname);
  formData.append("folderId", "null");

  const localUploadRes = await fetch(`${BASE_URL}/api/dokumantasyon/upload/local`, {
    method: "POST",
    headers: { cookie: authCookie },
    body: formData,
  });
  assert.strictEqual(localUploadRes.status, 200, "Yerel dosya yazımı başarılı olmalıdır.");
  const localUploadData = await localUploadRes.json();
  const fileId = localUploadData.file.id;
  logSuccess(`Test dosyası oluşturuldu (ID: ${fileId})`);

  // -------------------------------------------------------------------
  // 2. /dokumantasyon/dosya/[fileId] SAYFA RENDER TESTLERİ
  // -------------------------------------------------------------------
  logStep("2. /dokumantasyon/dosya/[fileId] Sayfa ve Kabuk (Shell) Render Testleri");

  // 2.1 Yetkisiz kullanıcı istek testi (Login Formu render edilmeli)
  const unauthPageRes = await fetch(`${BASE_URL}/dokumantasyon/dosya/${fileId}`);
  assert.strictEqual(unauthPageRes.status, 200, "Yetkisiz erişimde login formu sunulmalıdır.");
  const unauthHtml = await unauthPageRes.text();
  assert(
    unauthHtml.includes("Giriş Yap") || unauthHtml.includes("Kullanıcı Adı") || unauthHtml.includes("Şifre"),
    "Yetkisiz kullanıcıya Login Formu render edilmelidir."
  );
  logSuccess("Yetkisiz erişimde güvenli LoginForm arayüzü sunumu doğrulandı.");

  // 2.2 Yetkili admin kullanıcı sayfa render'ı
  const authPageRes = await fetch(`${BASE_URL}/dokumantasyon/dosya/${fileId}`, {
    headers: { cookie: authCookie },
  });
  assert.strictEqual(authPageRes.status, 200, "Önizleme sayfası 200 OK ile yüklenmelidir.");
  const pageHtml = await authPageRes.text();
  assert(
    pageHtml.includes(localUploadData.file.display_name) || pageHtml.includes("PDF MOTORU"),
    "Sayfa HTML'i dosya adını veya motor bilgisini içermelidir."
  );
  assert(
    pageHtml.includes("Paylaş") || pageHtml.includes("İndir") || pageHtml.includes("PDF"),
    "Sayfa HTML'i Paylaş/İndir aksiyon butonlarını içermelidir."
  );
  logSuccess("Görüntüleyici kabuğu (Viewer Shell) sayfasında metadata, dosya başlığı ve aksiyon butonları başarıyla render edildi.");

  // 2.3 Geçersiz fileId için 404 testi
  const notFoundRes = await fetch(`${BASE_URL}/dokumantasyon/dosya/nonexistent-uuid-0000`, {
    headers: { cookie: authCookie },
  });
  const notFoundText = await notFoundRes.text();
  assert(
    notFoundRes.status === 404 || notFoundText.includes("404") || notFoundText.includes("bulunamadı") || notFoundText.includes("bulunamadi"),
    "Var olmayan dosya için 404 sayfası dönmelidir."
  );
  logSuccess("Bulunamayan dosya için 404 Not Found durumu doğrulandı.");

  // -------------------------------------------------------------------
  // 3. TEMİZLİK
  // -------------------------------------------------------------------
  logStep("3. Temizlik");
  await fetch(`${BASE_URL}/api/dokumantasyon/files/${fileId}`, {
    method: "DELETE",
    headers: { cookie: authCookie },
  });
  await fetch(`${BASE_URL}/api/dokumantasyon/trash/files/${fileId}`, {
    method: "DELETE",
    headers: { cookie: authCookie },
  });
  logSuccess("Aşama 3 test dosyası temizlendi.");

  console.log("\n======================================================================");
  console.log("AŞAMA 3/8 TEST SONUCU: ORTAK VIEWER VE ENTEGRASYON TESTLERİ BAŞARIYLA GEÇTİ!");
  console.log("======================================================================\n");
}

runStage3Tests().catch((err) => {
  console.error("\n❌ AŞAMA 3 TEST HATASI:", err);
  process.exit(1);
});
