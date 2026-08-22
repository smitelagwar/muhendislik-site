/**
 * DÖKÜMANTASYON MODÜLÜ — UI-FAZ 2 DOĞRULAMA VE OTOMATİK TEST PAKETİ
 *
 * Bu test paketi UI-Faz 2 (Warm Glass Tasarım Sistemi, Token Lock ve Ana Kabuk)
 * kapsamındaki tüm teknik şartname kriterlerini doğrular:
 * 1. Kilitli Tasarım Tokenları Dokümanı (design-tokens-locked.md)
 * 2. G0 - G3 Cam Katman Hiyerarşisi
 * 3. Scoped CSS Tokenları ve color-mix() Uyumu
 * 4. Standart Z-Index Skalası
 * 5. Backdrop-Filter Fallback ve Reduced Motion Güvencesi
 * 6. AdminShell ve Workspace Warm Glass Entegrasyonu
 * 7. Global Token Çakışmasızlığı
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";

const rootDir = process.cwd();

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — UI-FAZ 2 KABUL VE ENTEGRASYON TESTİ");
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

// 1. Kilitli Token Dokümanı Testi
test("1. design-tokens-locked.md Dokümanı Mevcut ve Eksiksiz", () => {
  const docPath = path.join(rootDir, "docs/dokumantasyon-ui/design-tokens-locked.md");
  assert.ok(fs.existsSync(docPath), "design-tokens-locked.md dosyası bulunamadı.");
  const content = fs.readFileSync(docPath, "utf-8");
  assert.ok(content.includes("G0"), "G0 katmanı tanımlanmalı.");
  assert.ok(content.includes("G1"), "G1 katmanı tanımlanmalı.");
  assert.ok(content.includes("G2"), "G2 katmanı tanımlanmalı.");
  assert.ok(content.includes("G3"), "G3 katmanı tanımlanmalı.");
  assert.ok(content.includes("--dok-accent-solid"), "Accent tokenları tanımlanmalı.");
  assert.ok(content.includes("--dok-z-modal"), "Z-index skalası tanımlanmalı.");
});

// 2. G0-G3 Cam Yüzey ve Blur Skalası Testi
test("2. dok-workspace.module.css G0-G3 Cam ve Blur Tokenlarını İçeriyor", () => {
  const cssPath = path.join(rootDir, "src/components/dokumantasyon/dok-workspace.module.css");
  assert.ok(fs.existsSync(cssPath), "dok-workspace.module.css bulunamadı.");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.ok(css.includes("--dok-surface-g0:"), "--dok-surface-g0 tanımlı olmalı.");
  assert.ok(css.includes("--dok-surface-g1:"), "--dok-surface-g1 tanımlı olmalı.");
  assert.ok(css.includes("--dok-surface-g2:"), "--dok-surface-g2 tanımlı olmalı.");
  assert.ok(css.includes("--dok-surface-g3:"), "--dok-surface-g3 tanımlı olmalı.");
  assert.ok(css.includes("--dok-blur-g1:"), "--dok-blur-g1 tanımlı olmalı.");
  assert.ok(css.includes("--dok-blur-g2:"), "--dok-blur-g2 tanımlı olmalı.");
  assert.ok(css.includes("--dok-blur-g3:"), "--dok-blur-g3 tanımlı olmalı.");
});

// 3. Sınır, Işık ve Gölge Tokenları Testi
test("3. dok-workspace.module.css Ambiyans Zemin, Işık ve Gölgeleri İçeriyor", () => {
  const cssPath = path.join(rootDir, "src/components/dokumantasyon/dok-workspace.module.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.ok(css.includes("--dok-border-soft:"), "--dok-border-soft tanımlı olmalı.");
  assert.ok(css.includes("--dok-border-glow:"), "--dok-border-glow tanımlı olmalı.");
  assert.ok(css.includes("--dok-inner-highlight:"), "--dok-inner-highlight tanımlı olmalı.");
  assert.ok(css.includes("--dok-shadow-ambient:"), "--dok-shadow-ambient tanımlı olmalı.");
  assert.ok(css.includes("radial-gradient"), "Ambiyans radial-gradient zemin tanımlı olmalı.");
});

// 4. Z-Index Standart Skalası Testi
test("4. dok-workspace.module.css Standart Z-Index Skalasını İçeriyor", () => {
  const cssPath = path.join(rootDir, "src/components/dokumantasyon/dok-workspace.module.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.ok(css.includes("--dok-z-base:"), "--dok-z-base tanımlı olmalı.");
  assert.ok(css.includes("--dok-z-sticky:"), "--dok-z-sticky tanımlı olmalı.");
  assert.ok(css.includes("--dok-z-dropdown:"), "--dok-z-dropdown tanımlı olmalı.");
  assert.ok(css.includes("--dok-z-floating-bar:"), "--dok-z-floating-bar tanımlı olmalı.");
  assert.ok(css.includes("--dok-z-drawer:"), "--dok-z-drawer tanımlı olmalı.");
  assert.ok(css.includes("--dok-z-mobile-sheet:"), "--dok-z-mobile-sheet tanımlı olmalı.");
  assert.ok(css.includes("--dok-z-modal:"), "--dok-z-modal tanımlı olmalı.");
  assert.ok(css.includes("--dok-z-toast:"), "--dok-z-toast tanımlı olmalı.");
});

// 5. Erişilebilirlik ve Fallback Testi
test("5. Backdrop-Filter Fallback ve Reduced Motion Kuralları Mevcut", () => {
  const cssPath = path.join(rootDir, "src/components/dokumantasyon/dok-workspace.module.css");
  const css = fs.readFileSync(cssPath, "utf-8");

  assert.ok(css.includes("@supports not"), "Backdrop-filter desteklenmediğinde fallback olmalı.");
  assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "Reduced motion kuralı bulunmalı.");
});

// 6. AdminShell ve Workspace Entegrasyonu Testi
test("6. AdminShell Header'ı Warm Glass CSS Sınıfını Kullanıyor", () => {
  const shellPath = path.join(rootDir, "src/components/dokumantasyon/admin-shell.tsx");
  const content = fs.readFileSync(shellPath, "utf-8");

  assert.ok(content.includes("styles.workspaceHeader"), "AdminShell styles.workspaceHeader kullanmalı.");
  assert.ok(content.includes("styles from"), "AdminShell dok-workspace.module.css import etmeli.");
});

// 7. Global Token Bütünlüğü Testi
test("7. Global Token Semantiği Ezilmeden Korunuyor", () => {
  const globalsPath = path.join(rootDir, "src/app/globals.css");
  const globals = fs.readFileSync(globalsPath, "utf-8");

  assert.ok(globals.includes("--primary: #f59e0b"), "Global primary amber rengi korunmalı.");
  assert.ok(globals.includes("--site-bg:"), "Site background tokenı korunmalı.");
  assert.ok(globals.includes("--site-surface:"), "Site surface tokenı korunmalı.");
});

console.log("======================================================================");
console.log(`TEST SONUCU: ${passedCount}/${totalCount} TEST BAŞARIYLA GEÇTİ!`);
console.log("======================================================================\n");

if (passedCount !== totalCount) {
  process.exit(1);
}
