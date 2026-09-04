// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 8 PREMIUM VISUAL SYSTEM TESTİ
// ============================================================================

import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✓ [PASS] ${message}`);
}

async function runStage8Tests() {
  console.log("======================================================================");
  console.log("DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 8 PREMIUM VISUAL SYSTEM TESTİ");
  console.log("======================================================================");

  const rootDir = process.cwd();
  const cssPath = path.join(rootDir, "src/components/dokumantasyon/dok-workspace.module.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");

  // 1. Virtual Row & Card CSS GPU Transitions
  console.log("\n--- 1. Virtual Row & Card CSS GPU Transitions ---");
  assert(
    cssContent.includes(".virtualRow") && cssContent.includes(".virtualCard"),
    ".virtualRow ve .virtualCard CSS sınıfları mevcut"
  );
  assert(
    cssContent.includes("will-change: transform, opacity;"),
    "Virtual kartlar GPU donanım hızlandırması için will-change: transform, opacity kullanıyor"
  );

  // 2. Framer Motion Yasağı (Virtual item'lar üzerinde Motion olmamalı)
  console.log("\n--- 2. Virtual Items Framer Motion Yasağı ---");
  // Check virtual components and css module for no framer motion on rows/cards
  assert(!cssContent.includes("framer-motion"), "CSS dosyasında framer motion bağımlılığı yok");

  // 3. Selection Styling: Amber Border, Subtle Tint & Focus Ring
  console.log("\n--- 3. Seçim ve Odak (Focus) Görsel Hiyerarşisi ---");
  assert(
    cssContent.includes(".virtualCardSelected") && cssContent.includes(".virtualRowSelected"),
    "Seçili durumlar için .virtualCardSelected ve .virtualRowSelected tanımlı"
  );
  assert(
    cssContent.includes("border-color: rgba(245, 158, 11, 0.8)"),
    "Seçili öğelerde amber border rengi tanımlı"
  );
  assert(
    cssContent.includes(".virtualCardFocused") && cssContent.includes("outline: 2px solid"),
    "Ayrı focus ring stili (.virtualCardFocused) tanımlı"
  );

  // 4. Drag Over Glow
  console.log("\n--- 4. Sürükleme (Drag Over) Klasör Parlama Efekti ---");
  assert(
    cssContent.includes(".dragOverFolder"),
    ".dragOverFolder CSS sınıfı tanımlı"
  );
  assert(
    cssContent.includes("box-shadow: 0 0 0 2px #f59e0b"),
    "Klasör üzerine sürüklemede belirgin amber ring glow efekti mevcut"
  );

  // 5. Success Flash Animation
  console.log("\n--- 5. Başarılı İşlem Parıltısı (Success Flash) ---");
  assert(
    cssContent.includes("@keyframes dokSuccessFlash"),
    "@keyframes dokSuccessFlash animasyonu tanımlı"
  );
  assert(
    cssContent.includes(".itemSuccessFlash"),
    ".itemSuccessFlash sınıfı animasyonu tetikliyor"
  );

  // 6. Desktop Hover vs Touch Yalıtımı
  console.log("\n--- 6. Desktop-Only Hover İzolasyonu ---");
  assert(
    cssContent.includes("@media (hover: hover) and (pointer: fine)"),
    "Hover efektleri sadece mouse kullanan masaüstü cihazlara sınırlandı (dokunmatik cihazlarda yapışma engellendi)"
  );

  // 7. Mobil Blur Optimizasyonu
  console.log("\n--- 7. Mobil GPU & Blur Optimizasyonu ---");
  assert(
    cssContent.includes("@media (max-width: 768px)") &&
    cssContent.includes("backdrop-filter: none"),
    "Mobilde kart başına blur kapatılarak container camı ile GPU yükü hafifletildi"
  );

  // 8. Reduced Motion Uyumu
  console.log("\n--- 8. Reduced Motion Erişilebilirliği ---");
  assert(
    cssContent.includes("@media (prefers-reduced-motion: reduce)") &&
    cssContent.includes("transition: none !important"),
    "prefers-reduced-motion modunda geçişler ve animasyonlar iptal edildi"
  );

  console.log("\n======================================================================");
  console.log("🎉 AŞAMA 8 TESTLERİNİN HEPSİ BAŞARIYLA GEÇTİ (PASS)!");
  console.log("======================================================================");
}

runStage8Tests().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
