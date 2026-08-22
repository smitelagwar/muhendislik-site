/**
 * DÖKÜMANTASYON MODÜLÜ — UI-FAZ 4 DOĞRULAMA VE OTOMATİK TEST PAKETİ
 *
 * Bu test paketi UI-Faz 4 (Modal, Sheet, Upload, Share, Trash, Details ve Feedback UI)
 * kapsamındaki teknik şartname kriterlerini test eder:
 * 1. Modalların G3 Warm Glass Overlay Z-Index ve Backdrop Standardı
 * 2. Yeni Klasör, Yeniden Adlandırma, Silme ve Taşıma Modalları
 * 3. Arama ve Çöp Kutusu Modalları
 * 4. Süreli Paylaşım, Paylaşım Sonucu ve Aktif Paylaşımlar Modalları
 * 5. Yükleme Transfer Yöneticisi (Upload Progress Toast) ve İlerleme Durumları
 * 6. Detay Çekmecesi (Drawer) ve Mobil Alt Sayfa (Mobile Details Sheet)
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

const rootDir = process.cwd();

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — UI-FAZ 4 KABUL VE ENTEGRASYON TESTİ");
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

// 1. NewFolderModal & RenameModal Testi
test("1. NewFolderModal ve RenameModal G3 Cam Overlay ve Ergonomisi", () => {
  const newFolder = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/modals/new-folder-modal.tsx"), "utf-8");
  const rename = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/modals/rename-modal.tsx"), "utf-8");

  assert.ok(newFolder.includes("z-[90]"), "NewFolderModal z-[90] overlay kullanmalı.");
  assert.ok(newFolder.includes("rounded-2xl"), "NewFolderModal rounded-2xl kullanmalı.");
  assert.ok(rename.includes("z-[90]"), "RenameModal z-[90] overlay kullanmalı.");
  assert.ok(rename.includes("rounded-2xl"), "RenameModal rounded-2xl kullanmalı.");
});

// 2. DeleteConfirmModal & MoveModal Testi
test("2. DeleteConfirmModal ve MoveModal Güvenlik ve Uyarı Yapısı", () => {
  const deleteModal = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/modals/delete-confirm-modal.tsx"), "utf-8");
  const moveModal = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/modals/move-modal.tsx"), "utf-8");

  assert.ok(deleteModal.includes("bg-red-600"), "DeleteConfirmModal belirgin kırmızı CTA içermeli.");
  assert.ok(moveModal.includes("invalidTargetFolderIds"), "MoveModal dairesel taşıma filtresini korumalı.");
  assert.ok(moveModal.includes("z-[90]"), "MoveModal z-[90] overlay kullanmalı.");
});

// 3. SearchModal & TrashModal Testi
test("3. SearchModal ve TrashModal Warm Glass Sonuç Listelemesi", () => {
  const searchModal = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/modals/search-modal.tsx"), "utf-8");
  const trashModal = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/modals/trash-modal.tsx"), "utf-8");

  assert.ok(searchModal.includes("onNavigateToFolder"), "SearchModal klasöre gitme eylemi sunmalı.");
  assert.ok(trashModal.includes("handleRestore"), "TrashModal geri yükleme eylemi sunmalı.");
  assert.ok(trashModal.includes("handlePermanentDelete"), "TrashModal kalıcı silme eylemi sunmalı.");
});

// 4. Paylaşım Modalları Testi
test("4. CreateShareModal, ShareResultModal ve ActiveSharesModal Bütünlüğü", () => {
  const createShare = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/modals/create-share-modal.tsx"), "utf-8");
  const shareResult = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/modals/share-result-modal.tsx"), "utf-8");
  const activeShares = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/modals/active-shares-modal.tsx"), "utf-8");

  assert.ok(createShare.includes("duration"), "CreateShareModal süre seçeneklerini içermeli.");
  assert.ok(shareResult.includes("QRCode.toDataURL"), "ShareResultModal QR kod üretmeli.");
  assert.ok(activeShares.includes("handleRevoke"), "ActiveSharesModal iptal etme eylemi sunmalı.");
});

// 5. Yükleme Transfer Yöneticisi Testi
test("5. UploadProgressToast G3 Overlay ve İlerleme Durumları", () => {
  const uploadToast = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/upload-progress-toast.tsx"), "utf-8");

  assert.ok(uploadToast.includes("z-[100]"), "UploadProgressToast z-[100] toast katmanında olmalı.");
  assert.ok(uploadToast.includes("finalizing"), "UploadProgressToast finalizing durumunu desteklemeli.");
  assert.ok(uploadToast.includes("progressbar"), "UploadProgressToast aria progressbar içermeli.");
});

// 6. Detay Çekmeceleri Testi
test("6. DriveDetailsDrawer ve MobileDetailsSheet İndirme ve Bilgi Uyumu", () => {
  const drawer = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/drive-details-drawer.tsx"), "utf-8");
  const sheet = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/mobile-details-sheet.tsx"), "utf-8");

  assert.ok(drawer.includes("onDownload"), "DriveDetailsDrawer onDownload prop'unu desteklemeli.");
  assert.ok(sheet.includes("onDownload"), "MobileDetailsSheet onDownload prop'unu desteklemeli.");
  assert.ok(sheet.includes("styles.mobileSheetSafeArea"), "MobileDetailsSheet safe-area stilini içermeli.");
});

console.log("======================================================================");
console.log(`TEST SONUCU: ${passedCount}/${totalCount} TEST BAŞARIYLA GEÇTİ!`);
console.log("======================================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
