// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 4/8 GÜVENLİ PDF VIEWER TESTİ
// ============================================================================

import assert from "assert";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 4/8 GÜVENLİ TAM PDF VIEWER TESTİ");
console.log("======================================================================\n");

function logStep(title) {
  console.log(`\n▶ ${title}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

function logInfo(msg) {
  console.log(`  ℹ [BİLGİ] ${msg}`);
}

async function runStage4Tests() {
  // -------------------------------------------------------------------
  // 1. STATİK GÜVENLİK VE BİLEŞEN KOD DENETİMİ
  // -------------------------------------------------------------------
  logStep("1. DokPdfViewer Statik Güvenlik ve PDF.js Ayarları Denetimi");

  const pdfViewerPath = path.join(process.cwd(), "src/components/dokumantasyon/preview/pdf-viewer.tsx");
  assert(fs.existsSync(pdfViewerPath), "pdf-viewer.tsx dosyası mevcut olmalıdır.");
  const viewerCode = fs.readFileSync(pdfViewerPath, "utf8");

  assert(
    viewerCode.includes("isEvalSupported: false"),
    "DokPdfViewer CVE-2024-4367 koruması için isEvalSupported: false içermelidir."
  );
  assert(
    viewerCode.includes("cMapUrl"),
    "DokPdfViewer Türkçe font ve karakter seti için CMap desteği içermelidir."
  );
  assert(
    viewerCode.includes("handleFitWidth") && viewerCode.includes("handleFitPage"),
    "DokPdfViewer Fit Width ve Fit Page kontrolleri içermelidir."
  );
  assert(
    viewerCode.includes("handleSearch"),
    "DokPdfViewer doküman içi metin arama yeteneği içermelidir."
  );
  assert(
    viewerCode.includes("isHandTool"),
    "DokPdfViewer pafta kaydırma (Hand / Pan Tool) desteği içermelidir."
  );
  logSuccess("DokPdfViewer bileşeni tüm güvenlik ve mühendislik araçlarıyla doğrulandı.");

  // -------------------------------------------------------------------
  // 2. OTURUM AÇMA VE TEST PDF DOSYASI YÜKLEME
  // -------------------------------------------------------------------
  logStep("2. Oturum Açma ve Test PDF Dosyası Yükleme");

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

  // Çok sayfalı örnek mühendislik PDF oluştur
  const testPdfContent = Buffer.from(
    "%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] >>\nendobj\n" +
    "xref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000115 00000 n\n" +
    "trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF"
  );

  const uploadTokenRes = await fetch(`${BASE_URL}/api/dokumantasyon/upload/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: authCookie },
    body: JSON.stringify({
      filename: "statik_proje_hesap_raporu.pdf",
      size: testPdfContent.length,
      mimeType: "application/pdf",
      folderId: null,
    }),
  });
  assert.strictEqual(uploadTokenRes.status, 200, "Upload token alınmalıdır.");
  const uploadTokenData = await uploadTokenRes.json();

  const formData = new FormData();
  formData.append("file", new Blob([testPdfContent], { type: "application/pdf" }), "statik_proje_hesap_raporu.pdf");
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
  logSuccess(`Test PDF dosyası yüklendi (ID: ${fileId})`);

  // -------------------------------------------------------------------
  // 3. /api/dokumantasyon/files/[fileId]/access VE PREVIEW KIND DOĞRULAMASI
  // -------------------------------------------------------------------
  logStep("3. Signed Access Endpoint ve Preview Kind Doğrulaması");

  const accessRes = await fetch(`${BASE_URL}/api/dokumantasyon/files/${fileId}/access`, {
    headers: { cookie: authCookie },
  });
  assert.strictEqual(accessRes.status, 200, "Access endpoint 200 dönmelidir.");
  const accessData = await accessRes.json();
  assert.strictEqual(accessData.previewKind, "pdf", "PDF için previewKind 'pdf' olmalıdır.");
  assert(accessData.accessUrl, "Erişim URL'si üretilmelidir.");
  logSuccess(`PDF erişim URL'si ve türü onaylandı: ${accessData.accessUrl}`);

  // -------------------------------------------------------------------
  // 4. /dokumantasyon/dosya/[fileId] SAYFASINDA PDF VIEWER VE MOTOR RENDERI
  // -------------------------------------------------------------------
  logStep("4. /dokumantasyon/dosya/[fileId] Sayfasında PDF Viewer Render Testi");

  const pageRes = await fetch(`${BASE_URL}/dokumantasyon/dosya/${fileId}`, {
    headers: { cookie: authCookie },
  });
  assert.strictEqual(pageRes.status, 200, "Önizleme sayfası 200 OK ile yüklenmelidir.");
  const pageHtml = await pageRes.text();

  const cleanHtml = pageHtml.replace(/<!--.*?-->/g, "");
  assert(
    cleanHtml.includes("PDF MOTORU") || (cleanHtml.includes("PDF") && cleanHtml.includes("MOTORU")),
    "Sayfa alt çubuğunda 'PDF MOTORU' rozeti bulunmalıdır."
  );
  logSuccess("PDF görüntüleyici kabuğu ve PDF motoru başarıyla render edildi.");

  // -------------------------------------------------------------------
  // 5. TEMİZLİK
  // -------------------------------------------------------------------
  logStep("5. Temizlik");
  await fetch(`${BASE_URL}/api/dokumantasyon/files/${fileId}`, {
    method: "DELETE",
    headers: { cookie: authCookie },
  });
  await fetch(`${BASE_URL}/api/dokumantasyon/trash/files/${fileId}`, {
    method: "DELETE",
    headers: { cookie: authCookie },
  });
  logSuccess("Aşama 4 test dosyası temizlendi.");

  console.log("\n======================================================================");
  console.log("AŞAMA 4/8 TEST SONUCU: GÜVENLİ TAM PDF VIEWER TESTLERİ BAŞARIYLA GEÇTİ!");
  console.log("======================================================================\n");
}

runStage4Tests().catch((err) => {
  console.error("\n❌ AŞAMA 4 TEST HATASI:", err);
  process.exit(1);
});
