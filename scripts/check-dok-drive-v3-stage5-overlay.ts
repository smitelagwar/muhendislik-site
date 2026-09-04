// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 5 OVERLAY & MODAL MİMARİSİ DOĞRULAMA
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

async function runStage5Tests() {
  console.log("======================================================================");
  console.log("DÖKÜMANTASYON DRIVE V3.1 — AŞAMA 5 OVERLAY & MODAL MİMARİSİ TESTİ");
  console.log("======================================================================");

  const rootDir = process.cwd();

  // 1. Global Overlays dosyasında #dok-overlay-root varlığı
  console.log("\n--- 1. Global Overlays Root Varlığı ---");
  const globalOverlaysPath = path.join(rootDir, "src/components/global-overlays.tsx");
  const globalOverlaysContent = fs.readFileSync(globalOverlaysPath, "utf-8");
  assert(
    globalOverlaysContent.includes('id="dok-overlay-root"'),
    "src/components/global-overlays.tsx içinde id=\"dok-overlay-root\" div'i tanımlı"
  );

  // 2. globals.css içinde z-index tokenleri ve transform/filter yalıtım kuralları
  console.log("\n--- 2. CSS Tokenleri ve Containing-Block Yalıtımı ---");
  const globalsCssPath = path.join(rootDir, "src/app/globals.css");
  const globalsCssContent = fs.readFileSync(globalsCssPath, "utf-8");

  const requiredZTokens = [
    "--dok-z-sticky: 100;",
    "--dok-z-menu: 300;",
    "--dok-z-context: 320;",
    "--dok-z-drag-preview: 400;",
    "--dok-z-sheet-backdrop: 500;",
    "--dok-z-sheet: 510;",
    "--dok-z-dialog-backdrop: 600;",
    "--dok-z-dialog: 610;",
    "--dok-z-dialog-floating: 620;",
    "--dok-z-toast: 700;",
  ];

  for (const token of requiredZTokens) {
    assert(globalsCssContent.includes(token), `globals.css içinde '${token}' tokeni tanımlı`);
  }

  assert(
    globalsCssContent.includes("#dok-overlay-root") &&
    globalsCssContent.includes("transform: none !important") &&
    globalsCssContent.includes("filter: none !important") &&
    globalsCssContent.includes("perspective: none !important"),
    "#dok-overlay-root transform/filter/perspective none !important ile containing block tuzağından yalıtıldı"
  );

  // 3. layout.tsx viewportFit kontrolü
  console.log("\n--- 3. layout.tsx Viewport Contract ---");
  const layoutPath = path.join(rootDir, "src/app/layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");
  assert(
    layoutContent.includes('viewportFit: "cover"'),
    "layout.tsx içinde viewportFit: 'cover' tanımlı (iOS Safari safe-area tam koruma)"
  );

  // 4. OverlayPortal bileşeni kontrolü
  console.log("\n--- 4. OverlayPortal Bileşeni Sözleşmesi ---");
  const overlayPortalPath = path.join(rootDir, "src/components/dokumantasyon/drive-v3/overlay-portal.tsx");
  assert(fs.existsSync(overlayPortalPath), "overlay-portal.tsx dosyası mevcut");
  const overlayPortalContent = fs.readFileSync(overlayPortalPath, "utf-8");
  assert(
    overlayPortalContent.includes('document.getElementById("dok-overlay-root")'),
    "overlay-portal.tsx dok-overlay-root portal hedefini sorguluyor"
  );
  assert(
    overlayPortalContent.includes('role="dialog"'),
    "overlay-portal.tsx role=\"dialog\" erişilebilirlik özniteliğine sahip"
  );
  assert(
    overlayPortalContent.includes('aria-modal="true"'),
    "overlay-portal.tsx aria-modal=\"true\" erişilebilirlik özniteliğine sahip"
  );

  // 5. Tüm 9 modal bileşeninin OverlayPortal ve data-testid="dok-dialog-content" kullanımı
  console.log("\n--- 5. Tüm 9 Modalın OverlayPortal ve Test ID Uyumu ---");
  const modalNames = [
    "active-shares-modal.tsx",
    "create-share-modal.tsx",
    "delete-confirm-modal.tsx",
    "move-modal.tsx",
    "new-folder-modal.tsx",
    "rename-modal.tsx",
    "search-modal.tsx",
    "share-result-modal.tsx",
    "trash-modal.tsx",
  ];

  for (const modalName of modalNames) {
    const modalPath = path.join(rootDir, "src/components/dokumantasyon/modals", modalName);
    assert(fs.existsSync(modalPath), `${modalName} dosyası mevcut`);
    const modalContent = fs.readFileSync(modalPath, "utf-8");

    assert(
      modalContent.includes("OverlayPortal"),
      `${modalName} OverlayPortal kullanıyor`
    );
    assert(
      modalContent.includes('data-testid="dok-dialog-content"'),
      `${modalName} data-testid="dok-dialog-content" özniteliğine sahip`
    );
  }

  console.log("\n======================================================================");
  console.log("🎉 AŞAMA 5 TESTLERİNİN HEPSİ BAŞARIYLA GEÇTİ (PASS)!");
  console.log("======================================================================");
}

runStage5Tests().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});
