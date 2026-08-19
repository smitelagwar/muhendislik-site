// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — MASTER TÜM AŞAMALAR DOĞRULAMA PAKETİ (AŞAMA 1-8 + KALICILIK)
// ============================================================================

import { execSync } from "child_process";

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — MASTER TÜM AŞAMALAR DOĞRULAMA PAKETİ (AŞAMA 1-8)");
console.log("======================================================================\n");

const stages = [
  { name: "AŞAMA 1/8: Repo Denetimi & PDF.js Güvenlik Geçidi", cmd: "node scripts/poc-stage1-audit-and-data-plane.mjs" },
  { name: "AŞAMA 2/8: Format Capabilities, Magic-Byte & Signed Access", cmd: "npx tsx scripts/check-dokumantasyon-stage2.mjs" },
  { name: "AŞAMA 3/8: Ortak Viewer Kabuğu & File Manager Tıklama", cmd: "node scripts/check-dokumantasyon-stage3.mjs" },
  { name: "AŞAMA 4/8: Güvenli Tam PDF Viewer (PDF.js + Zoom/Fit/Search)", cmd: "node scripts/check-dokumantasyon-stage4.mjs" },
  { name: "AŞAMA 5/8: Görsel & Güvenli Metin Önizleyicileri (Image/MD/JSON/CSV)", cmd: "node scripts/check-dokumantasyon-stage5.mjs" },
  { name: "AŞAMA 6/8: Autodesk APS CAD Önizleme (DWG/DXF + SVF2)", cmd: "node scripts/check-dokumantasyon-stage6.mjs" },
  { name: "AŞAMA 7/8: Drive / Yandex / Mega Gelişmiş UX & Details Drawer", cmd: "node scripts/check-dokumantasyon-stage7.mjs" },
  { name: "AŞAMA 8/8: Güvenlik, Kripto, JSZip & Public Share Doğrulaması", cmd: "node scripts/check-dokumantasyon.mjs" },
  { name: "KALICILIK 1: Fail-Closed & /tmp Koruma Kuralları", cmd: "npx tsx scripts/check-dokumantasyon-persistence-rules.mjs" },
  { name: "KALICILIK 2: Readiness & Durability Smoke Testi", cmd: "node scripts/check-dokumantasyon-production-readiness.mjs" },
  { name: "KALICILIK 3: Transactional Upload & Idempotency", cmd: "npx tsx scripts/check-dokumantasyon-transactional-upload.mjs" },
  { name: "KALICILIK 4: Cold-Start & Kalıcılık Doğrulaması", cmd: "node scripts/check-dokumantasyon-cold-start-persistence.mjs" },
  { name: "UÇTAN UCA: 10/10 Gerçek Kullanıcı Senaryo Testleri", cmd: "node scripts/check-dokumantasyon-full-scenarios.mjs" },
];

let passedCount = 0;

for (let i = 0; i < stages.length; i++) {
  const stage = stages[i];
  console.log(`\n======================================================================`);
  console.log(`[${i + 1}/${stages.length}] ${stage.name}`);
  console.log(`Komut: ${stage.cmd}`);
  console.log(`======================================================================`);

  try {
    execSync(stage.cmd, { stdio: "inherit" });
    passedCount++;
  } catch (err) {
    console.error(`\n❌ ${stage.name} BAŞARISIZ OLDU!`);
    process.exit(1);
  }
}

console.log("\n======================================================================");
console.log(`🏆 TÜM ${passedCount}/${stages.length} AŞAMA TESTLERİ %100 BAŞARIYLA TAMAMLANDI!`);
console.log("DÖKÜMANTASYON MODÜLÜ PROD-READY, FAIL-CLOSED & KALICI DURUMDADIR.");
console.log("======================================================================\n");
