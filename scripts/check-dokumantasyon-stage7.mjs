// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 7/8 GELİŞMİŞ DRIVE UX TESTİ
// ============================================================================

import assert from "assert";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 7/8 DRIVE / YANDEX / MEGA UX TESTİ");
console.log("======================================================================\n");

function logStep(title) {
  console.log(`\n▶ ${title}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

async function runStage7Tests() {
  // -------------------------------------------------------------------
  // 1. STATİK BİLEŞEN VE KOD DENETİMİ
  // -------------------------------------------------------------------
  logStep("1. Drive UX Bileşenleri ve Mimari Denetimi");

  const sidebarPath = path.join(process.cwd(), "src/components/dokumantasyon/drive-sidebar.tsx");
  const drawerPath = path.join(process.cwd(), "src/components/dokumantasyon/drive-details-drawer.tsx");
  const fileManagerPath = path.join(process.cwd(), "src/components/dokumantasyon/file-manager.tsx");

  assert(fs.existsSync(sidebarPath), "drive-sidebar.tsx mevcut olmalıdır.");
  assert(fs.existsSync(drawerPath), "drive-details-drawer.tsx mevcut olmalıdır.");
  assert(fs.existsSync(fileManagerPath), "file-manager.tsx mevcut olmalıdır.");

  const sidebarCode = fs.readFileSync(sidebarPath, "utf8");
  const fileManagerCode = fs.readFileSync(fileManagerPath, "utf8");

  assert(
    sidebarCode.includes("DriveSidebar") && sidebarCode.includes("Tüm Dosyalarım"),
    "drive-sidebar.tsx Hızlı erişim ve kategori filtrelerini içermelidir."
  );
  assert(
    fileManagerCode.includes("viewMode") && fileManagerCode.includes("LayoutGrid"),
    "file-manager.tsx Liste/Kart (Grid) görünüm modlarını içermelidir."
  );
  assert(
    fileManagerCode.includes("starredIds") && fileManagerCode.includes("toggleStar"),
    "file-manager.tsx Yıldızlı (Starred) dosya desteği içermelidir."
  );
  assert(
    fileManagerCode.includes("DriveDetailsDrawer"),
    "file-manager.tsx Sağ detay ve metadata çekmecesini içermelidir."
  );
  logSuccess("Drive UX bileşenleri ve durum yönetimi başarıyla doğrulandı.");

  // -------------------------------------------------------------------
  // 2. OTURUM AÇMA VE /dokumantasyon SAYFASI DRIVE RENDER TESTİ
  // -------------------------------------------------------------------
  logStep("2. /dokumantasyon Sayfasında Drive Sidebar ve Görünüm Kontrolleri Testi");

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

  const dokRes = await fetch(`${BASE_URL}/dokumantasyon`, {
    headers: { cookie: authCookie },
  });
  assert.strictEqual(dokRes.status, 200, "/dokumantasyon sayfası 200 dönmelidir.");
  const dokHtml = (await dokRes.text()).replace(/<!--.*?-->/g, "");

  assert(
    dokHtml.includes("Tüm Dosyalarım") || dokHtml.includes("Gezinti") || dokHtml.includes("Kök Dizin"),
    "Drive sol menüsü ve navigasyon öğeleri render edilmelidir."
  );
  logSuccess("Drive arayüzü ve navigasyon çubuğu canlı sunucuda başarıyla render edildi.");

  console.log("\n======================================================================");
  console.log("AŞAMA 7/8 TEST SONUCU: DRIVE / YANDEX / MEGA UX TESTLERİ BAŞARIYLA GEÇTİ!");
  console.log("======================================================================\n");
}

runStage7Tests().catch((err) => {
  console.error("\n❌ AŞAMA 7 TEST HATASI:", err);
  process.exit(1);
});
