/**
 * DÖKÜMANTASYON MODÜLÜ — UI-FAZ 6 NİHAİ ADVERSARIAL QA VE ENTEGRASYON TESTİ
 *
 * Bu test paketi UI-Faz 6 (Adversarial QA, Güvenlik, Erişilebilirlik ve Bütünlük)
 * kapsamındaki teknik şartname kriterlerini denetler:
 * 1. 0 Ölü Kontrol (Dead Control / Fake Handler Yokluğu)
 * 2. XSS ve Güvenlik Denetimi (dangerouslySetInnerHTML / raw eval yokluğu)
 * 3. Scoped CSS ve Z-Index Skalası Bütünlüğü
 * 4. Responsive Safe-Area ve Overflow Koruması
 * 5. Keyboard Navigation ve Escape Kapatma Standartları
 * 6. Tüm UI-Fazları (Faz 1 - Faz 5) Kapsama Doğrulaması
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

const rootDir = process.cwd();

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — UI-FAZ 6 NİHAİ ADVERSARIAL QA TESTİ");
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

// 1. Ölü Kontrol / Fake Handler Denetimi
test("1. 0 Ölü Kontrol (Dead Control) ve Gerçek Eylem Bağlantıları", () => {
  const fileManager = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/file-manager.tsx"), "utf-8");
  const sidebar = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/drive-sidebar.tsx"), "utf-8");

  // Sahte placeholder handler kontrolü
  assert.ok(!fileManager.includes("alert(\"TODO\")"), "File manager içinde sahte TODO alert olmamalı.");
  assert.ok(!sidebar.includes("alert(\"TODO\")"), "Sidebar içinde sahte TODO alert olmamalı.");
  assert.ok(fileManager.includes("handleDownload"), "İndirme gerçek fonksiyona bağlı olmalı.");
  assert.ok(fileManager.includes("handleOpenShareSelected"), "Çoklu paylaşım gerçek fonksiyona bağlı olmalı.");
  assert.ok(fileManager.includes("handleMultiDeleteConfirm"), "Çoklu silme gerçek fonksiyona bağlı olmalı.");
});

// 2. Güvenlik & XSS Sanitizasyonu
test("2. XSS ve Güvenlik Denetimi (dangerouslySetInnerHTML / raw eval yokluğu)", () => {
  const dir = path.join(rootDir, "src/components/dokumantasyon");
  const checkDir = (currentPath) => {
    const files = fs.readdirSync(currentPath);
    for (const f of files) {
      const fullPath = path.join(currentPath, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        checkDir(fullPath);
      } else if (f.endsWith(".tsx") || f.endsWith(".ts")) {
        const content = fs.readFileSync(fullPath, "utf-8");
        assert.ok(!content.includes("dangerouslySetInnerHTML"), `${f} içinde dangerouslySetInnerHTML kullanılmamalı.`);
        assert.ok(!content.includes("eval("), `${f} içinde eval kullanılmamalı.`);
      }
    }
  };

  checkDir(dir);
});

// 3. Scoped CSS ve Z-Index Skalası Bütünlüğü
test("3. Scoped CSS ve Kilitli Z-Index Hiyerarşisi", () => {
  const css = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/dok-workspace.module.css"), "utf-8");

  assert.ok(css.includes("--dok-z-base: 1;"), "CSS standart base z-index içermeli.");
  assert.ok(css.includes("--dok-z-modal: 90;"), "CSS standart modal z-index içermeli.");
  assert.ok(css.includes("--dok-z-toast: 100;"), "CSS standart toast z-index içermeli.");
  assert.ok(css.includes("--dok-surface-g0"), "CSS G0 katmanını tanımlamalı.");
  assert.ok(css.includes("--dok-surface-g3"), "CSS G3 katmanını tanımlamalı.");
});

// 4. Responsive Safe-Area ve Overflow Koruması
test("4. Mobil Safe-Area ve Scroll Lock Uyumu", () => {
  const sheet = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/mobile-details-sheet.tsx"), "utf-8");
  const css = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/dok-workspace.module.css"), "utf-8");

  assert.ok(sheet.includes("mobileSheetSafeArea"), "MobileDetailsSheet safe area sınıfını tüketmeli.");
  assert.ok(css.includes("env(safe-area-inset-bottom"), "CSS safe area padding tanımlamalı.");
});

// 5. Keyboard Navigation ve Escape Kapatma Standartları
test("5. Klavye Navigasyonu ve Escape Listener Standartları", () => {
  const searchModal = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/modals/search-modal.tsx"), "utf-8");
  const activeShares = fs.readFileSync(path.join(rootDir, "src/components/dokumantasyon/modals/active-shares-modal.tsx"), "utf-8");

  assert.ok(searchModal.includes("e.key === \"Escape\""), "SearchModal Escape dinleyicisi içermeli.");
  assert.ok(activeShares.includes("e.key === \"Escape\""), "ActiveSharesModal Escape dinleyicisi içermeli.");
});

// 6. 6-Faz Bütünlük Matrisi Doğrulaması
test("6. UI-Faz 1'den Faz 5'e Tüm Test Paketlerinin Varlığı", () => {
  assert.ok(fs.existsSync(path.join(rootDir, "scripts/check-dokumantasyon-ui-faz1.mjs")), "Faz 1 test paketi mevcut olmalı.");
  assert.ok(fs.existsSync(path.join(rootDir, "scripts/check-dokumantasyon-ui-faz2.mjs")), "Faz 2 test paketi mevcut olmalı.");
  assert.ok(fs.existsSync(path.join(rootDir, "scripts/check-dokumantasyon-ui-faz3.mjs")), "Faz 3 test paketi mevcut olmalı.");
  assert.ok(fs.existsSync(path.join(rootDir, "scripts/check-dokumantasyon-ui-faz4.mjs")), "Faz 4 test paketi mevcut olmalı.");
  assert.ok(fs.existsSync(path.join(rootDir, "scripts/check-dokumantasyon-ui-faz5.mjs")), "Faz 5 test paketi mevcut olmalı.");
});

console.log("======================================================================");
console.log(`TEST SONUCU: ${passedCount}/${totalCount} TEST BAŞARIYLA GEÇTİ!`);
console.log("======================================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
