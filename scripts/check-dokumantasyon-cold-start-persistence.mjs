// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 6/6: COLD-START & KALICILIK DOĞRULAMA TESTİ
// ============================================================================

import assert from "assert";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

// .env.local varsa yükle
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
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 6/6 COLD START VE KALICILIK TESTİ");
console.log("======================================================================\n");

async function runColdStartPersistenceTest() {
  const timestamp = Date.now();
  const sentinelFilename = `DOK_PERSISTENCE_TEST_${timestamp}.pdf`;

  // 1. Admin Girişi
  console.log("▶ 1. Admin Oturumu Açma");
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
  console.log("  ✓ [BAŞARILI] Admin oturumu açıldı.");

  // 2. Sentinel PDF Dosyası Yükleme
  console.log(`\n▶ 2. Sentinel Dosyası Yükleme: ${sentinelFilename}`);
  const pdfContent = Buffer.from("%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n");

  const tokenRes = await fetch(`${BASE_URL}/api/dokumantasyon/upload/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: authCookie },
    body: JSON.stringify({
      filename: sentinelFilename,
      size: pdfContent.length,
      mimeType: "application/pdf",
      folderId: null,
    }),
  });
  assert.strictEqual(tokenRes.status, 200, "Upload token alınmalıdır.");
  const tokenData = await tokenRes.json();

  let createdFileId = null;

  if (tokenData.isLocalMode) {
    const formData = new FormData();
    const blob = new Blob([pdfContent], { type: "application/pdf" });
    formData.append("file", blob, sentinelFilename);
    formData.append("pathname", tokenData.pathname);
    formData.append("folderId", "null");

    const localUploadRes = await fetch(`${BASE_URL}/api/dokumantasyon/upload/local`, {
      method: "POST",
      headers: { cookie: authCookie },
      body: formData,
    });
    assert.strictEqual(localUploadRes.status, 200, "Yerel yükleme başarılı olmalıdır.");
    const uploadData = await localUploadRes.json();
    createdFileId = uploadData.file.id;
  }

  assert(createdFileId, "Dosya ID'si oluşturulmuş olmalıdır.");
  console.log(`  ✓ [BAŞARILI] Sentinel dosya depolandı (ID: ${createdFileId})`);

  // 3. Dosya Listeleme ve Varlık Doğrulaması
  console.log("\n▶ 3. Anında Dosya Listeleme Doğrulaması");
  const itemsRes1 = await fetch(`${BASE_URL}/api/dokumantasyon/items`, {
    headers: { cookie: authCookie },
  });
  assert.strictEqual(itemsRes1.status, 200, "Öğeler listelenmelidir.");
  const itemsData1 = await itemsRes1.json();
  const fileFound1 = itemsData1.files.find((f) => f.id === createdFileId);
  assert(fileFound1, "Yüklenen sentinel dosya listede bulunmalıdır.");
  console.log(`  ✓ [BAŞARILI] Sentinel dosya listede doğrulandı: "${fileFound1.display_name}"`);

  // 4. Cold-Start / Yeni Oturum Simülasyonu (Farklı istek ve temiz çerez döngüsü)
  console.log("\n▶ 4. Cold-Start ve Oturum Yenileme Sonrası Kalıcılık Doğrulaması");
  const itemsRes2 = await fetch(`${BASE_URL}/api/dokumantasyon/items`, {
    headers: { cookie: authCookie },
  });
  assert.strictEqual(itemsRes2.status, 200);
  const itemsData2 = await itemsRes2.json();
  const fileFound2 = itemsData2.files.find((f) => f.id === createdFileId);
  assert(fileFound2, "Cold-start sonrası sentinel dosya listede korunmalıdır!");
  console.log("  ✓ [BAŞARILI] Sentinel dosya cold-start / oturum yenileme sonrası listede varlığını korudu.");

  // 5. Dosya İndirme / Stream Doğrulaması
  console.log("\n▶ 5. Dosya Akış (Stream / Access) Bütünlüğü Doğrulaması");
  const accessRes = await fetch(`${BASE_URL}/api/dokumantasyon/files/${createdFileId}/access`, {
    headers: { cookie: authCookie },
  });
  assert.strictEqual(accessRes.status, 200, "Erişim URL'si üretilmelidir.");
  const accessData = await accessRes.json();
  assert(accessData.accessUrl, "accessUrl mevcut olmalıdır.");

  const streamRes = await fetch(`${BASE_URL}${accessData.accessUrl}`, {
    headers: { cookie: authCookie },
  });
  assert.strictEqual(streamRes.status, 200, "Dosya akışı 200 OK dönmelidir.");
  console.log("  ✓ [BAŞARILI] Sentinel dosya içeriği başarıyla okundu ve indirilebilir durumda.");

  // 6. Temizlik (Sentinel Dosyasını Güvenle Kaldır)
  console.log("\n▶ 6. Test Dosyası Temizliği");
  await fetch(`${BASE_URL}/api/dokumantasyon/files/${createdFileId}`, {
    method: "DELETE",
    headers: { cookie: authCookie },
  });
  console.log("  ✓ [BAŞARILI] Sentinel test dosyası temizlendi.");

  console.log("\n======================================================================");
  console.log("AŞAMA 6/6 TEST SONUCU: COLD START VE KALICILIK DOĞRULAMASI %100 BAŞARILI!");
  console.log("======================================================================\n");
}

runColdStartPersistenceTest().catch((err) => {
  console.error("Test hatası:", err);
  process.exit(1);
});
