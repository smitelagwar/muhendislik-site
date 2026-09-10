// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 9 MOBİL, GESTURE & ERİŞİLEBİLİRLİK TESTİ
// ============================================================================
// A7 güncelleme: createLongPressController kaldırıldı. Mobil seçim artık
// açık Seç butonu modundan başlıyor. Bu script yeni UX sözleşmesini doğrular.

import fs from "fs";
import path from "path";
import {
  MOBILE_VIEWPORT_PRESETS,
  isSufficientTouchTarget,
} from "../src/components/dokumantasyon/drive-v3/mobile-gesture-engine";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✓ [PASS] ${message}`);
}

async function runStage9Tests() {
  console.log("======================================================================");
  console.log("DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 9 MOBİL, GESTURE & A11Y TESTİ");
  console.log("======================================================================");

  const rootDir = process.cwd();
  const cssPath = path.join(rootDir, "src/components/dokumantasyon/dok-workspace.module.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");
  const layoutPath = path.join(rootDir, "src/app/layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");
  const mobileShellPath = path.join(
    rootDir,
    "src/components/dokumantasyon/mobile-shell-layout.module.css"
  );
  const mobileShellContent = fs.readFileSync(mobileShellPath, "utf-8");

  // 1. 100dvh ve Safe-Area Sözleşmesi
  console.log("\n--- 1. 100dvh ve Safe-Area Desteği ---");
  assert(cssContent.includes("100dvh"), "CSS modülü 100dvh dynamic viewport birimini içeriyor");
  assert(layoutContent.includes('viewportFit: "cover"'), "layout.tsx viewportFit: 'cover' içeriyor (çentik/safe-area taşma koruması)");
  assert(cssContent.includes("safe-area-inset-bottom"), "Safe-area padding (env(safe-area-inset-bottom)) kuralları tanımlı");

  // 2. Callout Suppression ve touch-action: pan-y
  console.log("\n--- 2. Callout Suppression ve Touch Action ---");
  assert(
    cssContent.includes("-webkit-touch-callout: none") &&
    cssContent.includes("user-select: none"),
    "iOS safari callout ve sistem metin seçimi engellendi (-webkit-touch-callout: none; user-select: none)"
  );
  assert(
    cssContent.includes("touch-action: pan-y"),
    "Doğal dikey kaydırma korunurken yatay çakışmalar engellendi (touch-action: pan-y)"
  );

  // 3. Yeni UX: Açık Seçim Modu sözleşmesi (A3)
  console.log("\n--- 3. Açık Seçim Modu UX Sözleşmesi (A3) ---");
  const fileManagerPath = path.join(
    rootDir,
    "src/components/dokumantasyon/file-manager.tsx"
  );
  const fileManagerContent = fs.readFileSync(fileManagerPath, "utf-8");
  assert(
    fileManagerContent.includes("isMobileSelectionMode"),
    "file-manager.tsx açık mobil seçim modu state'i içeriyor (isMobileSelectionMode)"
  );
  assert(
    fileManagerContent.includes("exitMobileSelectionMode"),
    "file-manager.tsx seçim modundan çıkış fonksiyonu içeriyor"
  );
  assert(
    !fileManagerContent.includes("createLongPressController"),
    "file-manager.tsx artık createLongPressController kullanmıyor (A7)"
  );
  assert(
    !fileManagerContent.includes("longPressControllersRef"),
    "file-manager.tsx artık longPressControllersRef içermiyor (A7)"
  );
  assert(
    !fileManagerContent.includes("getItemGestureHandlers"),
    "file-manager.tsx artık getItemGestureHandlers içermiyor (A7)"
  );

  // 4. Selection dock — artık fixed overlay değil, normal layout child (A6)
  console.log("\n--- 4. Selection Dock Layout Sözleşmesi (A6) ---");
  assert(
    !fileManagerContent.includes("fixed inset-x-2 bottom-2 z-[60]"),
    "Selection dock artık fixed overlay değil (A6)"
  );
  assert(
    fileManagerContent.includes("border-t border-amber-500/30"),
    "Selection dock normal layout akışında border-t ile ayrılıyor (A6)"
  );

  // 5. Mobil Viewport Boyut Test Matrisi
  console.log("\n--- 5. Mobil Viewport Boyut Matrisi Kontrolü ---");
  assert(MOBILE_VIEWPORT_PRESETS.length >= 6, "En az 6 farklı mobil cihaz viewport profili tanımlı");
  for (const preset of MOBILE_VIEWPORT_PRESETS) {
    assert(preset.width > 0 && preset.height > 0, `${preset.name} (${preset.width}x${preset.height} - ${preset.orientation}) doğrulandı`);
  }

  // 6. Touch Target Alanı Kontrolü (WCAG 44x44px Kriteri)
  console.log("\n--- 6. WCAG Dokunmatik Hedef Alanı Kontrolü (44x44px) ---");
  assert(isSufficientTouchTarget(44, 44) === true, "44x44 piksel touch target yeterli kabul edildi");
  assert(isSufficientTouchTarget(48, 48) === true, "48x48 piksel touch target yeterli kabul edildi");
  assert(isSufficientTouchTarget(32, 32) === false, "32x32 piksel yetersiz touch target olarak tespit edildi");

  // 7. Virtualizer / gerçek mobil satır geometrisi aynı sözleşmede kalmalı.
  console.log("\n--- 7. Mobil Virtual Row Geometri Sözleşmesi ---");
  assert(
    mobileShellContent.includes('data-testid="dok-file-row"') &&
      mobileShellContent.includes('data-testid="dok-folder-row"'),
    "Mobil shell hem dosya hem klasör sanal satırlarını açıkça sınırlandırıyor"
  );
  assert(
    mobileShellContent.includes("height: 56px !important") &&
      mobileShellContent.includes("padding-top: 6px !important") &&
      mobileShellContent.includes("padding-bottom: 6px !important"),
    "Gerçek mobil satır yüksekliği 56px virtualizer metriğiyle birebir uyumlu"
  );

  console.log("\n======================================================================");
  console.log("🎉 AŞAMA 9 TESTLERİNİN HEPSİ BAŞARIYLA GEÇTİ (PASS)!");
  console.log("======================================================================");
}

runStage9Tests().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
