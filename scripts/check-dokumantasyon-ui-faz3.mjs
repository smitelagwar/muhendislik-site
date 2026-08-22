/**
 * DÖKÜMANTASYON MODÜLÜ — UI-FAZ 3 DOĞRULAMA VE OTOMATİK TEST PAKETİ
 *
 * Bu test paketi UI-Faz 3 (File Manager Ana UX: Sidebar, Command Bar,
 * List/Grid Görünümleri, Breadcrumbs ve Mobil Uyumluluk)
 * kapsamındaki teknik kriterleri test eder:
 * 1. DriveSidebar Warm Glass Gezinti Butonları ve Aktif Amber Pill
 * 2. DriveSidebar Kompakt Depolama Durumu Kartı
 * 3. FileManager Akıllı Breadcrumbs Collapse Mantığı
 * 4. FileManager Komut Çubuğu Arama Kısayolu ve Filtre Göstergesi
 * 5. FileManager Liste ve Kart Görünüm Toggle'ı
 * 6. FileManager Bağlama Duyarlı Zengin Boş Durumlar (Empty States)
 * 7. FileManager Çoklu Seçim Yüzen Aksiyon Çubuğu (Floating Bar)
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

const rootDir = process.cwd();

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — UI-FAZ 3 KABUL VE ENTEGRASYON TESTİ");
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

// 1. Sidebar Warm Glass Butonları ve Aktif Pill Testi
test("1. DriveSidebar Warm Glass Gezinti ve Aktif Amber Pill Kuralı", () => {
  const sidebarPath = path.join(rootDir, "src/components/dokumantasyon/drive-sidebar.tsx");
  assert.ok(fs.existsSync(sidebarPath), "drive-sidebar.tsx bulunamadı.");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  assert.ok(content.includes("bg-amber-500/15"), "Aktif buton amber background içermeli.");
  assert.ok(content.includes("border-amber-500/30"), "Aktif buton amber border içermeli.");
  assert.ok(content.includes("getNavButtonClass"), "getNavButtonClass fonksiyonu tanımlı olmalı.");
});

// 2. Sidebar Depolama Durumu Kartı Testi
test("2. DriveSidebar Depolama Durumu Kartı ve Sayaçları", () => {
  const sidebarPath = path.join(rootDir, "src/components/dokumantasyon/drive-sidebar.tsx");
  const content = fs.readFileSync(sidebarPath, "utf-8");

  assert.ok(content.includes("totalSizeBytes"), "Depolama boyutu prop'u kullanılmalı.");
  assert.ok(content.includes("totalFoldersCount"), "Toplam klasör sayısı gösterilmeli.");
  assert.ok(content.includes("totalFilesCount"), "Toplam dosya sayısı gösterilmeli.");
});

// 3. Akıllı Breadcrumb Collapse Testi
test("3. FileManager Akıllı Breadcrumbs ve Hiyerarşik Gezinti", () => {
  const fmPath = path.join(rootDir, "src/components/dokumantasyon/file-manager.tsx");
  assert.ok(fs.existsSync(fmPath), "file-manager.tsx bulunamadı.");
  const content = fs.readFileSync(fmPath, "utf-8");

  assert.ok(content.includes("breadcrumbs.length"), "Breadcrumbs uzunluk kontrolü bulunmalı.");
  assert.ok(content.includes("navigateToFolder"), "navigateToFolder fonksiyonu breadcrumbs ile bağlı olmalı.");
});

// 4. Komut Çubuğu Kısayol ve Filtre Göstergesi Testi
test("4. FileManager Komut Çubuğu Arama Kısayolu ve Filtre Göstergesi", () => {
  const fmPath = path.join(rootDir, "src/components/dokumantasyon/file-manager.tsx");
  const content = fs.readFileSync(fmPath, "utf-8");

  assert.ok(content.includes("setIsSearchOpen(true)"), "Arama modal tetikleyicisi mevcut olmalı.");
  assert.ok(content.includes("activeFilterLabels"), "Aktif filtre rozetleri hesaplanmalı.");
  assert.ok(content.includes("setIsFilterSheetOpen(true)"), "Filtre paneli tetikleyicisi olmalı.");
});

// 5. Görünüm Modu (List/Grid) Toggle Testi
test("5. FileManager Liste ve Kart (Grid) Görünüm Toggle'ı", () => {
  const fmPath = path.join(rootDir, "src/components/dokumantasyon/file-manager.tsx");
  const content = fs.readFileSync(fmPath, "utf-8");

  assert.ok(content.includes('setViewMode("list")'), "Liste modu seçimi bulunmalı.");
  assert.ok(content.includes('setViewMode("grid")'), "Grid modu seçimi bulunmalı.");
  assert.ok(content.includes("styles.list"), "Liste görünümü CSS sınıfı kullanılmalı.");
  assert.ok(content.includes("styles.card"), "Grid kartları CSS sınıfı kullanılmalı.");
});

// 6. Bağlama Duyarlı Zengin Boş Durumlar Testi
test("6. FileManager Bağlama Duyarlı Boş Durumlar (Empty States)", () => {
  const fmPath = path.join(rootDir, "src/components/dokumantasyon/file-manager.tsx");
  const content = fs.readFileSync(fmPath, "utf-8");

  assert.ok(content.includes("Henüz Yıldızlı Dosyanız Yok"), "Yıldızlı boş durumu tanımlı olmalı.");
  assert.ok(content.includes("Henüz Açılan Bir Dosya Yok"), "Son açılanlar boş durumu tanımlı olmalı.");
  assert.ok(content.includes("Bu Klasör Henüz Boş"), "Klasör boş durumu tanımlı olmalı.");
});

// 7. Yüzen Çoklu Seçim Çubuğu Testi
test("7. FileManager Yüzen Çoklu Seçim Aksiyon Çubuğu", () => {
  const fmPath = path.join(rootDir, "src/components/dokumantasyon/file-manager.tsx");
  const content = fs.readFileSync(fmPath, "utf-8");

  assert.ok(content.includes("selectedIds.size > 0"), "Seçim çubuğu koşulu bulunmalı.");
  assert.ok(content.includes("handleOpenMoveSelected"), "Toplu taşıma eylemi olmalı.");
  assert.ok(content.includes("handleOpenShareSelected"), "Toplu paylaşım eylemi olmalı.");
  assert.ok(content.includes("setIsMultiDeleteOpen(true)"), "Toplu silme eylemi olmalı.");
  assert.ok(content.includes("styles.mobileSelectionBar"), "Mobil seçim çubuğu sınıfı uygulanmalı.");
});

console.log("======================================================================");
console.log(`TEST SONUCU: ${passedCount}/${totalCount} TEST BAŞARIYLA GEÇTİ!`);
console.log("======================================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
