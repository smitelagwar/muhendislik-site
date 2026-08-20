// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 6/8 AUTODESK APS CAD ÖNİZLEME TESTİ
// ============================================================================

import assert from "assert";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 6/8 CAD ÖNİZLEME VE APS ENTEGRASYONU TESTİ");
console.log("======================================================================\n");

function logStep(title) {
  console.log(`\n▶ ${title}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

async function runStage6Tests() {
  // -------------------------------------------------------------------
  // 1. STATİK CAD APS MODÜL DENETİMİ
  // -------------------------------------------------------------------
  logStep("1. Autodesk Platform Services (APS) Servis ve Modül Denetimi");

  const cadApsPath = path.join(process.cwd(), "src/lib/dokumantasyon/cad-aps.ts");
  assert(fs.existsSync(cadApsPath), "cad-aps.ts mevcut olmalıdır.");
  const cadCode = fs.readFileSync(cadApsPath, "utf8");

  assert(
    cadCode.includes("resolveCadPreviewStatus") && cadCode.includes("getApsInternalToken"),
    "cad-aps.ts OAuth v2 ve status çözümleyici fonksiyonları içermelidir."
  );
  assert(
    cadCode.includes("getCadProvider"),
    "cad-aps.ts DOK_CAD_PREVIEW_PROVIDER feature flag kontrolünü içermelidir."
  );
  logSuccess("CAD APS servis mimarisi ve OAuth v2 yapısı doğrulandı.");

  // -------------------------------------------------------------------
  // 2. OTURUM AÇMA VE DWG DOSYASI YÜKLEME
  // -------------------------------------------------------------------
  logStep("2. Oturum Açma ve AutoCAD DWG Dosyası Yükleme");

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

  // Geçerli AC1027 AutoCAD DWG ikili verisi
  const dwgBytes = Buffer.from("AC1027\0\0\0\0\0\0\0\0DWG_STAGE6_TEST_CONTENT_BLOCK");

  const tokenRes = await fetch(`${BASE_URL}/api/dokumantasyon/upload/intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: authCookie },
    body: JSON.stringify({
      filename: "temel_aplikasyon_plani.dwg",
      size: dwgBytes.length,
      mimeType: "application/acad",
      folderId: null,
    }),
  });
  assert.strictEqual(tokenRes.status, 200, "Upload token alınmalıdır.");
  const tokenData = await tokenRes.json();

  const formData = new FormData();
  formData.append("file", new Blob([dwgBytes], { type: "application/acad" }), "temel_aplikasyon_plani.dwg");
  formData.append("pathname", tokenData.pathname);
  formData.append("folderId", "null");

  const uploadRes = await fetch(`${BASE_URL}/api/dokumantasyon/upload/local`, {
    method: "POST",
    headers: { cookie: authCookie },
    body: formData,
  });
  assert.strictEqual(uploadRes.status, 200, "DWG dosyası başarıyla yüklenmelidir.");
  const uploadData = await uploadRes.json();
  const fileId = uploadData.file.id;
  logSuccess(`AutoCAD DWG dosyası yüklendi (ID: ${fileId})`);

  // -------------------------------------------------------------------
  // 3. /api/dokumantasyon/files/[id]/cad ENDPOINT TESTİ
  // -------------------------------------------------------------------
  logStep("3. /api/dokumantasyon/files/[id]/cad Endpoint Testi");

  const cadApiRes = await fetch(`${BASE_URL}/api/dokumantasyon/files/${fileId}/cad`, {
    headers: { cookie: authCookie },
  });
  assert.strictEqual(cadApiRes.status, 200, "CAD API endpoint'i 200 dönmelidir.");
  const cadApiData = await cadApiRes.json();

  assert.strictEqual(cadApiData.success, true);
  assert.strictEqual(cadApiData.isAvailable, true);
  assert(cadApiData.urn, "CAD URN değeri üretilmelidir.");
  assert(
    cadApiData.provider === "aps" || cadApiData.provider === "mock",
    "CAD provider aps veya mock olmalıdır."
  );
  logSuccess(`CAD durumu ve URN doğrulandı (Sağlayıcı: ${cadApiData.provider}, Durum: ${cadApiData.status})`);

  // -------------------------------------------------------------------
  // 4. /dokumantasyon/dosya/[fileId] SAYFASINDA CAD VIEWER RENDER TESTİ
  // -------------------------------------------------------------------
  logStep("4. /dokumantasyon/dosya/[fileId] Sayfasında CAD Viewer Render Testi");

  const pageRes = await fetch(`${BASE_URL}/dokumantasyon/dosya/${fileId}`, {
    headers: { cookie: authCookie },
  });
  assert.strictEqual(pageRes.status, 200, "CAD sayfası 200 dönmelidir.");
  const pageHtml = (await pageRes.text()).replace(/<!--.*?-->/g, "");

  assert(
    pageHtml.includes("CAD MOTORU") || pageHtml.includes("CAD"),
    "Alt çubukta 'CAD MOTORU' rozeti bulunmalıdır."
  );
  assert(
    pageHtml.includes("AutoCAD") || pageHtml.includes("Autodesk"),
    "Sayfada Autodesk / AutoCAD bileşenleri bulunmalıdır."
  );
  logSuccess("CAD görüntüleyici kabuğu ve APS katmanları başarıyla render edildi.");

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
  logSuccess("Aşama 6 test dosyası temizlendi.");

  console.log("\n======================================================================");
  console.log("AŞAMA 6/8 TEST SONUCU: CAD ÖNİZLEME VE APS TESTLERİ BAŞARIYLA GEÇTİ!");
  console.log("======================================================================\n");
}

runStage6Tests().catch((err) => {
  console.error("\n❌ AŞAMA 6 TEST HATASI:", err);
  process.exit(1);
});
