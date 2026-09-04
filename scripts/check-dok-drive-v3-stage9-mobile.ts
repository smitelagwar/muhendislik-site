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

  // 3. 500ms Long-Press State Machine: Başarılı Tetikleme
  console.log("\n--- 3. Long-Press State Machine: 500ms Tetikleme ---");
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
  assert(triggeredId === "item-card-1", "50ms sonra long-press başarıyla tetiklendi");
  assert(controller1.getState() === "triggered", "State 'triggered' oldu");
  assert(tappedId === null, "Long-press tetiklendiğinde tekil tık (singleTap) tetiklenmedi");

  // 4. Long-Press State Machine: 8px Kayma ile İptal (Doğal Scroll)
  console.log("\n--- 4. Long-Press State Machine: 8px Kayma İptali ---");
  let triggered2 = false;
  const controller2 = createLongPressController({
    id: "item-card-2",
    delayMs: 50,
    moveThresholdPx: 8,
    onLongPressTrigger: () => {
      triggered2 = true;
    },
    onSingleTap: () => {},
  });

  controller2.handlePointerDown({ clientX: 100, clientY: 100, pointerType: "touch" });
  // 12px kaydır (hareket eşiği 8px'i aştı)
  controller2.handlePointerMove({ clientX: 100, clientY: 112 });
  assert(controller2.getState() === "cancelled", "8px üzerinde kaydırmada long-press iptal edildi (scroll serbest bırakıldı)");

  await new Promise((r) => setTimeout(r, 70));
  assert(triggered2 === false, "Kaydırma sonrası zamanlayıcı çalışmadı");

  // 5. Long-Press State Machine: Erken Bırakma (Single Tap)
  console.log("\n--- 5. Long-Press State Machine: Erken Bırakma (Single Tap) ---");
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
  // 20ms sonra bırak (80ms dolmadan)
  await new Promise((r) => setTimeout(r, 20));
  controller3.handlePointerUp();

  assert(tapped3 === true, "Zaman dolmadan bırakıldığında tekil tık (single tap) çalıştı");
  assert(triggered3 === false, "Zaman dolmadan bırakıldığında long-press tetiklenmedi");

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

  console.log("\n======================================================================");
  console.log("🎉 AŞAMA 9 TESTLERİNİN HEPSİ BAŞARIYLA GEÇTİ (PASS)!");
  console.log("======================================================================");
}

runStage9Tests().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
