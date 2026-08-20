// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 5/8 GÖRSEL VE METİN ÖNİZLEYİCİLERİ TESTİ
// ============================================================================

import assert from "assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 5/8 GÖRSEL VE METİN ÖNİZLEYİCİLERİ TESTİ");
console.log("======================================================================\n");

function logStep(title) {
  console.log(`\n▶ ${title}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

async function runStage5Tests() {
  // -------------------------------------------------------------------
  // 1. OTURUM AÇMA
  // -------------------------------------------------------------------
  logStep("1. Admin Oturumu Açma");

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

  const createdFileIds = [];

  async function uploadTestFile(name, content, mimeType) {
    const tokenRes = await fetch(`${BASE_URL}/api/dokumantasyon/upload/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: authCookie },
      body: JSON.stringify({
        filename: name,
        size: content.length,
        mimeType,
        folderId: null,
      }),
    });
    assert.strictEqual(tokenRes.status, 200, `Upload token alınmalıdır: ${name}`);
    const tokenData = await tokenRes.json();

    const formData = new FormData();
    formData.append("file", new Blob([content], { type: mimeType }), name);
    formData.append("pathname", tokenData.pathname);
    formData.append("folderId", "null");

    const uploadRes = await fetch(`${BASE_URL}/api/dokumantasyon/upload/local`, {
      method: "POST",
      headers: { cookie: authCookie },
      body: formData,
    });
    assert.strictEqual(uploadRes.status, 200, `Dosya yüklenmelidir: ${name}`);
    const uploadData = await uploadRes.json();
    createdFileIds.push(uploadData.file.id);
    return uploadData.file;
  }

  // -------------------------------------------------------------------
  // 2. GÖRSEL (PNG) ÖNİZLEME TESTİ
  // -------------------------------------------------------------------
  logStep("2. PNG Görseli Önizleme Testi");

  // Geçerli 1x1 PNG ikili verisi
  const pngBytes = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);

  const pngFile = await uploadTestFile("vaziyet_plani.png", pngBytes, "image/png");

  const pngAccessRes = await fetch(`${BASE_URL}/api/dokumantasyon/files/${pngFile.id}/access`, {
    headers: { cookie: authCookie },
  });
  const pngAccessData = await pngAccessRes.json();
  assert.strictEqual(pngAccessData.previewKind, "image", "PNG için previewKind 'image' olmalıdır.");

  const pngPageRes = await fetch(`${BASE_URL}/dokumantasyon/dosya/${pngFile.id}`, {
    headers: { cookie: authCookie },
  });
  assert.strictEqual(pngPageRes.status, 200, "Görsel sayfası 200 dönmelidir.");
  const pngHtml = (await pngPageRes.text()).replace(/<!--.*?-->/g, "");
  assert(pngHtml.includes("IMAGE MOTORU"), "Alt çubukta 'IMAGE MOTORU' rozeti bulunmalıdır.");
  logSuccess("Gelişmiş görsel (Image Viewer) önizleme akışı doğrulandı.");

  // -------------------------------------------------------------------
  // 3. MARKDOWN (.md) ÖNİZLEME TESTİ
  // -------------------------------------------------------------------
  logStep("3. Markdown (.md) Dokümanı Önizleme Testi");

  const mdContent = Buffer.from(
    "# Teknik Şartname v2\n\n" +
    "Bu şartname **C30/37** sınıfı hazır beton ve nervürlü donatı çeliğini kapsar.\n\n" +
    "| Malzeme | Standart | Birim |\n|---|---|---|\n| Beton C30/37 | TS EN 206 | m³ |\n| B420C Çelik | TS 708 | Ton |\n\n" +
    "```typescript\nconst fck = 30; // MPa\n```\n"
  );

  const mdFile = await uploadTestFile("teknik_sartname.md", mdContent, "text/markdown");

  const mdAccessRes = await fetch(`${BASE_URL}/api/dokumantasyon/files/${mdFile.id}/access`, {
    headers: { cookie: authCookie },
  });
  const mdAccessData = await mdAccessRes.json();
  assert.strictEqual(mdAccessData.previewKind, "markdown", "MD için previewKind 'markdown' olmalıdır.");

  const mdPageRes = await fetch(`${BASE_URL}/dokumantasyon/dosya/${mdFile.id}`, {
    headers: { cookie: authCookie },
  });
  assert.strictEqual(mdPageRes.status, 200, "Markdown sayfası 200 dönmelidir.");
  const mdHtml = (await mdPageRes.text()).replace(/<!--.*?-->/g, "");
  assert(mdHtml.includes("MARKDOWN MOTORU"), "Alt çubukta 'MARKDOWN MOTORU' rozeti bulunmalıdır.");
  logSuccess("Markdown (GFM + Typography) önizleme akışı doğrulandı.");

  // -------------------------------------------------------------------
  // 4. JSON VE CSV METİN ÖNİZLEME TESTİ
  // -------------------------------------------------------------------
  logStep("4. JSON ve CSV Tablosu Önizleme Testi");

  const jsonData = Buffer.from(JSON.stringify({ proje: "Plaza 2026", katSayisi: 18, depremBolgesi: 1 }, null, 2));
  const jsonFile = await uploadTestFile("proje_parametreleri.json", jsonData, "application/json");

  const jsonAccessRes = await fetch(`${BASE_URL}/api/dokumantasyon/files/${jsonFile.id}/access`, {
    headers: { cookie: authCookie },
  });
  const jsonAccessData = await jsonAccessRes.json();
  assert.strictEqual(jsonAccessData.previewKind, "json", "JSON için previewKind 'json' olmalıdır.");

  const csvData = Buffer.from("Poz No,İş Kalemi,Miktar,Birim\n15.100.1001,Kazı İşleri,1250,m3\n15.120.1005,Grobeton,85,m3\n");
  const csvFile = await uploadTestFile("metraj_tablosu.csv", csvData, "text/csv");

  const csvAccessRes = await fetch(`${BASE_URL}/api/dokumantasyon/files/${csvFile.id}/access`, {
    headers: { cookie: authCookie },
  });
  const csvAccessData = await csvAccessRes.json();
  assert.strictEqual(csvAccessData.previewKind, "csv", "CSV için previewKind 'csv' olmalıdır.");
  logSuccess("JSON ve CSV güvenli metin önizleme akışları doğrulandı.");

  // -------------------------------------------------------------------
  // 5. TEMİZLİK
  // -------------------------------------------------------------------
  logStep("5. Temizlik");
  for (const id of createdFileIds) {
    await fetch(`${BASE_URL}/api/dokumantasyon/files/${id}`, {
      method: "DELETE",
      headers: { cookie: authCookie },
    });
    await fetch(`${BASE_URL}/api/dokumantasyon/trash/files/${id}`, {
      method: "DELETE",
      headers: { cookie: authCookie },
    });
  }
  logSuccess("Aşama 5 tüm test dosyaları başarıyla temizlendi.");

  console.log("\n======================================================================");
  console.log("AŞAMA 5/8 TEST SONUCU: GÖRSEL VE METİN ÖNİZLEYİCİ TESTLERİ BAŞARIYLA GEÇTİ!");
  console.log("======================================================================\n");
}

runStage5Tests().catch((err) => {
  console.error("\n❌ AŞAMA 5 TEST HATASI:", err);
  process.exit(1);
});
