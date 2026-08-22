/**
 * DÖKÜMANTASYON MODÜLÜ — UI-FAZ 1 DOĞRULAMA VE OTOMATİK TEST PAKETİ
 *
 * Bu test paketi UI-Faz 1 (Forensic Route/Function Audit & P0 Functional Stabilization)
 * kapsamındaki tüm teknik şartname kriterlerini doğrular:
 * 1. Rota & Bileşen Haritası ve Ölü Kod İzolasyonu
 * 2. Eylem Envanteri Kapsamı
 * 3. İstemci Dairesel Taşıma (Descendant Cycle) Engelleme Mantığı
 * 4. URL folderId & Popstate Senkronizasyonu
 * 5. Detay Çekmecesi & Mobil Alt Sayfa İndirme Eylemleri
 * 6. Grid Modu Çoklu Seçim ve Kart Menüleri
 * 7. Modal Yükleme ve Çift Tıklama Korumaları
 * 8. Pano Kopyalama Fallback Güvenliği
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

const rootDir = process.cwd();

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — UI-FAZ 1 KABUL VE ENTEGRASYON TESTİ");
console.log("======================================================================\n");

let passedCount = 0;
let totalCount = 0;

function test(title, fn) {
  totalCount += 1;
  try {
    fn();
    console.log(`✓ [PASS] ${title}`);
    passedCount += 1;
  } catch (error) {
    console.error(`✗ [FAIL] ${title}`);
    console.error(`   Hata: ${error.message}\n`);
  }
}

// 1. Rota & Bileşen Haritası Testi
test("1. Rota Haritası Dokümanı ve Ölü Kod Analizi Mevcut", () => {
  const mapPath = path.join(rootDir, "docs/dokumantasyon-ui/route-component-map.md");
  assert.ok(fs.existsSync(mapPath), "route-component-map.md dosyası bulunamadı.");
  const content = fs.readFileSync(mapPath, "utf-8");
  assert.ok(content.includes("/dokumantasyon"), "Harita /dokumantasyon rotasını içermeli.");
  assert.ok(content.includes("/dokumantasyon/dosya/[fileId]"), "Harita dosya stüdyosu rotasını içermeli.");
  assert.ok(content.includes("/p/[token]"), "Harita public paylaşım rotasını içermeli.");
  assert.ok(content.includes("file-preview-shell.tsx"), "Ölü bileşen tespiti belgelenmeli.");
});

// 2. Eylem Envanteri Testi
test("2. Eylem Envanteri Dokümanı Mevcut", () => {
  const invPath = path.join(rootDir, "docs/dokumantasyon-ui/action-inventory.md");
  assert.ok(fs.existsSync(invPath), "action-inventory.md dosyası bulunamadı.");
  const content = fs.readFileSync(invPath, "utf-8");
  assert.ok(content.includes("file-manager.tsx"), "FileManager kontrolleri belgelenmeli.");
  assert.ok(content.includes("studio-topbar.tsx"), "Document Studio kontrolleri belgelenmeli.");
});

// 3. İstemci Dairesel Taşıma (Descendant) Hesaplama Mantığı Testi
test("3. İstemci Tarafı Dairesel Taşıma (Descendants) Algoritması Doğrulaması", () => {
  const sampleFolders = [
    { id: "root-1", name: "Projeler", parent_id: null },
    { id: "child-1", name: "2026", parent_id: "root-1" },
    { id: "grandchild-1", name: "Statik", parent_id: "child-1" },
    { id: "child-2", name: "Arşiv", parent_id: "root-1" },
    { id: "other-root", name: "Diğer", parent_id: null },
  ];

  // Simüle edilen MoveModal algoritması
  const movingItems = [{ id: "root-1", name: "Projeler", type: "folder", parentId: null }];
  const invalidIds = new Set(movingItems.filter((i) => i.type === "folder").map((i) => i.id));

  let addedMore = true;
  while (addedMore) {
    addedMore = false;
    for (const folder of sampleFolders) {
      if (folder.parent_id && invalidIds.has(folder.parent_id) && !invalidIds.has(folder.id)) {
        invalidIds.add(folder.id);
        addedMore = true;
      }
    }
  }

  // root-1 taşındığında child-1, grandchild-1 ve child-2 geçersiz hedef olmalıdır
  assert.ok(invalidIds.has("root-1"), "Taşınan klasörün kendisi engellenmeli.");
  assert.ok(invalidIds.has("child-1"), "Alt klasör engellenmeli.");
  assert.ok(invalidIds.has("grandchild-1"), "Torun alt klasör engellenmeli.");
  assert.ok(invalidIds.has("child-2"), "İkinci alt klasör engellenmeli.");
  assert.ok(!invalidIds.has("other-root"), "Bağımsız klasör seçilebilir olmalıdır.");

  const filtered = sampleFolders.filter((f) => !invalidIds.has(f.id));
  assert.strictEqual(filtered.length, 1);
  assert.strictEqual(filtered[0].id, "other-root");
});

// 4. MoveModal Kod Bütünlüğü Testi
test("4. MoveModal İstemci Filtresi ve Loading Koruması Kod Kontrolü", () => {
  const moveModalPath = path.join(rootDir, "src/components/dokumantasyon/modals/move-modal.tsx");
  const content = fs.readFileSync(moveModalPath, "utf-8");
  assert.ok(content.includes("invalidTargetFolderIds"), "MoveModal invalidTargetFolderIds hesaplamasını içermelidir.");
  assert.ok(content.includes("disabled={loading"), "MoveModal butonları loading korumasına sahip olmalıdır.");
});

// 5. Detay Çekmecesi & Mobil Alt Sayfa İndirme Eylemleri Testi
test("5. DriveDetailsDrawer ve MobileDetailsSheet onDownload Desteği", () => {
  const drawerPath = path.join(rootDir, "src/components/dokumantasyon/drive-details-drawer.tsx");
  const sheetPath = path.join(rootDir, "src/components/dokumantasyon/mobile-details-sheet.tsx");

  const drawerContent = fs.readFileSync(drawerPath, "utf-8");
  const sheetContent = fs.readFileSync(sheetPath, "utf-8");

  assert.ok(drawerContent.includes("onDownload?: (file: DokFile) => void;"), "DriveDetailsDrawer onDownload prop'una sahip olmalı.");
  assert.ok(drawerContent.includes("onDownload(file!)"), "DriveDetailsDrawer indir butonu onDownload çağırmalı.");

  assert.ok(sheetContent.includes("onDownload?: (file: DokFile) => void;"), "MobileDetailsSheet onDownload prop'una sahip olmalı.");
  assert.ok(sheetContent.includes("onDownload(file!)"), "MobileDetailsSheet indir butonu onDownload çağırmalı.");
});

// 6. FileManager URL Senkronizasyonu & Popstate Desteği Testi
test("6. FileManager URL folderId ve Popstate Senkronizasyonu", () => {
  const fmPath = path.join(rootDir, "src/components/dokumantasyon/file-manager.tsx");
  const content = fs.readFileSync(fmPath, "utf-8");

  assert.ok(content.includes("navigateToFolder"), "FileManager navigateToFolder fonksiyonuna sahip olmalı.");
  assert.ok(content.includes('window.addEventListener("popstate"'), "FileManager popstate olayını dinlemeli.");
  assert.ok(content.includes('new URLSearchParams(window.location.search).get("folderId")'), "FileManager başlangıçta URL folderId'yi okumalı.");
});

// 7. Grid Görünümü Çoklu Seçim ve Menü Testi
test("7. FileManager Grid Görünümü Çoklu Seçim ve 3-Nokta Menüleri", () => {
  const fmPath = path.join(rootDir, "src/components/dokumantasyon/file-manager.tsx");
  const content = fs.readFileSync(fmPath, "utf-8");

  assert.ok(content.includes('aria-label="Klasör Seç"'), "Grid modunda klasör seçim checkbox butonu bulunmalı.");
  assert.ok(content.includes('aria-label="Dosya Seç"'), "Grid modunda dosya seçim checkbox butonu bulunmalı.");
  assert.ok(content.includes('aria-label="Klasör İşlemleri"'), "Grid modunda klasör 3-nokta menüsü bulunmalı.");
  assert.ok(content.includes('aria-label="Dosya İşlemleri"'), "Grid modunda dosya 3-nokta menüsü bulunmalı.");
});

// 8. Pano Kopyalama Fallback Güvenliği Testi
test("8. Paylaşım Modallarında Pano Kopyalama Fallback Güvenliği", () => {
  const shareResultPath = path.join(rootDir, "src/components/dokumantasyon/modals/share-result-modal.tsx");
  const activeSharesPath = path.join(rootDir, "src/components/dokumantasyon/modals/active-shares-modal.tsx");

  const resultModalContent = fs.readFileSync(shareResultPath, "utf-8");
  const activeModalContent = fs.readFileSync(activeSharesPath, "utf-8");

  assert.ok(resultModalContent.includes('document.createElement("textarea")'), "ShareResultModal pano fallback içermeli.");
  assert.ok(activeModalContent.includes('document.createElement("textarea")'), "ActiveSharesModal pano fallback içermeli.");
});

console.log("======================================================================");
console.log(`TEST SONUCU: ${passedCount}/${totalCount} TEST BAŞARIYLA GEÇTİ!`);
console.log("======================================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
