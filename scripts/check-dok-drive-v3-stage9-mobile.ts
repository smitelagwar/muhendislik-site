// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 9 MOBİL, GESTURE & ERİŞİLEBİLİRLİK TESTİ
// ============================================================================

import fs from "fs";
import path from "path";
import {
  createLongPressController,
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

  // 3. Long-press artık seçim keşif gesture'ı değildir.
  console.log("\n--- 3. Long-Press: Açık Seçim Sözleşmesi ---");
  let triggeredId: string | null = null;
  let tappedId: string | null = null;

  const controller1 = createLongPressController({
    id: "item-card-1",
    delayMs: 50, // Test için hızlandırılmış
    moveThresholdPx: 8,
    onLongPressTrigger: (id) => {
      triggeredId = id;
    },
    onSingleTap: (id) => {
      tappedId = id;
    },
  });

  controller1.handlePointerDown({ clientX: 100, clientY: 100, pointerType: "touch" });
  assert(controller1.getState() === "pressing", "PointerDown sonrası state 'pressing' oldu");

  await new Promise((r) => setTimeout(r, 70));
  assert(triggeredId === null, "Long-press seçim callback'ini tetiklemedi");
  assert(controller1.getState() === "cancelled", "Bekleme süresi sonunda long-press güvenli biçimde cancelled oldu");
  controller1.handlePointerUp();
  assert(tappedId === null, "Long-press bırakıldığında dosya açma/singleTap tetiklenmedi");
  assert(controller1.getState() === "idle", "Long-press release sonrası state idle'a döndü");

  // 4. 8px üzeri hareket doğal scroll olarak iptal edilir.
  console.log("\n--- 4. Touch Hareketi: 8px Üzeri Scroll İptali ---");
  let triggered2 = false;
  let tapped2 = false;
  const controller2 = createLongPressController({
    id: "item-card-2",
    delayMs: 50,
    moveThresholdPx: 8,
    onLongPressTrigger: () => {
      triggered2 = true;
    },
    onSingleTap: () => {
      tapped2 = true;
    },
  });

  controller2.handlePointerDown({ clientX: 100, clientY: 100, pointerType: "touch" });
  controller2.handlePointerMove({ clientX: 100, clientY: 112 });
  assert(controller2.getState() === "cancelled", "8px üzerinde kaydırmada gesture iptal edildi (scroll serbest)");

  await new Promise((r) => setTimeout(r, 70));
  controller2.handlePointerUp();
  assert(triggered2 === false, "Scroll sonrası long-press/seçim callback'i çalışmadı");
  assert(tapped2 === false, "Scroll sonrası singleTap/açma callback'i çalışmadı");

  // 5. Erken bırakma yalnız tek normal tap üretir.
  console.log("\n--- 5. Erken Bırakma: Tekil Tap ---");
  let tapped3 = false;
  let triggered3 = false;

  const controller3 = createLongPressController({
    id: "item-card-3",
    delayMs: 80,
    moveThresholdPx: 8,
    onLongPressTrigger: () => {
      triggered3 = true;
    },
    onSingleTap: () => {
      tapped3 = true;
    },
  });

  controller3.handlePointerDown({ clientX: 100, clientY: 100, pointerType: "touch" });
  await new Promise((r) => setTimeout(r, 20));
  controller3.handlePointerUp();

  assert(tapped3 === true, "Zaman dolmadan bırakıldığında yalnız single tap çalıştı");
  assert(triggered3 === false, "Hızlı tap seçim/long-press callback'ini tetiklemedi");

  // 6. Mobil Viewport Boyut Test Matrisi
  console.log("\n--- 6. Mobil Viewport Boyut Matrisi Kontrolü ---");
  assert(MOBILE_VIEWPORT_PRESETS.length >= 6, "En az 6 farklı mobil cihaz viewport profili tanımlı");
  for (const preset of MOBILE_VIEWPORT_PRESETS) {
    assert(preset.width > 0 && preset.height > 0, `${preset.name} (${preset.width}x${preset.height} - ${preset.orientation}) doğrulandı`);
  }

  // 7. Touch Target Alanı Kontrolü (WCAG 44x44px Kriteri)
  console.log("\n--- 7. WCAG Dokunmatik Hedef Alanı Kontrolü (44x44px) ---");
  assert(isSufficientTouchTarget(44, 44) === true, "44x44 piksel touch target yeterli kabul edildi");
  assert(isSufficientTouchTarget(48, 48) === true, "48x48 piksel touch target yeterli kabul edildi");
  assert(isSufficientTouchTarget(32, 32) === false, "32x32 piksel yetersiz touch target olarak tespit edildi");

  // 8. Virtualizer / gerçek mobil satır geometrisi aynı sözleşmede kalmalı.
  console.log("\n--- 8. Mobil Virtual Row Geometri Sözleşmesi ---");
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
