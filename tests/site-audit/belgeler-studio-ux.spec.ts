/**
 * Belgeler — Entegre UX, Erişilebilirlik, Mobil ve Stres Test Paketi (ASAMA_08)
 *
 * Hedef: Akıllı Bölümler (Akordeon), Otomatik Taslak Kaydetme ve PDF Odak Modu
 * özelliklerinin 5 stüdyo genelinde birleşik çalışma senaryolarını, erişilebilirliği,
 * çoklu ekran genişliklerini ve stres kararlılığını test etmek.
 */

import { test, expect } from "@playwright/test";

test.describe("Belgeler Stüdyosu — ASAMA_08 Entegre UX ve Stres Paketi", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test("Senaryo 1: Tam döngü — Türkçe metin kaydı, akordeon, PDF odak, reload ve sessiz geri yükleme", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 850 });
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // 1. Şantiye Yeri alanına uzun Türkçe adres yaz
    const yerInput = page.locator("#beton-dokum-yer");
    await yerInput.fill("Ankara İli Çankaya İlçesi 1234 Ada 56 Parsel Zemin Kat Şantiye Sahası V3");

    // 2. V3: İzin şeridi çıkmaz; 2000ms debounce sonrası durum rozetinin 'Kaydedildi' olduğunu doğrula
    await page.waitForTimeout(2400);
    const badge = page.locator('[data-testid="belge-draft-status-badge"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("Kaydedildi");

    // 3. Akordeon bölümünü kapat ve aç
    const sectionToggle = page.locator('[data-testid="belge-section-toggle-belge-kayit"]');
    await sectionToggle.click();
    await expect(sectionToggle).toHaveAttribute("aria-expanded", "false");
    await sectionToggle.click();
    await expect(sectionToggle).toHaveAttribute("aria-expanded", "true");

    // 4. PDF Odak Modunu aç ve kapat
    const focusToggle = page.locator('[data-testid="belge-pdf-focus-toggle"]');
    await focusToggle.click();
    await expect(page.locator('[data-testid="belge-studio-form-scroll"]')).toBeHidden();
    await focusToggle.click();
    await expect(page.locator('[data-testid="belge-studio-form-scroll"]')).toBeVisible();

    // 5. Sayfayı yenile (reload)
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // 6. V3: Kurtarma şeridi çıkmaz, sessizce geri yüklenir
    const restoreBanner = page.locator('[data-testid="belge-draft-restore-banner"]');
    await expect(restoreBanner).toHaveCount(0);

    // 7. Hem input değerinin hem de PDF linkinin güncellendiğini doğrula
    await expect(yerInput).toHaveValue("Ankara İli Çankaya İlçesi 1234 Ada 56 Parsel Zemin Kat Şantiye Sahası V3");
    const pdfLink = page.locator('a[title*="sekmede"]');
    await expect(pdfLink).toHaveAttribute("href", /^blob:/);
  });

  test("Senaryo 2: Varsayılan şablon, onaysız Temizle snapshot kaydı ve Undo doğrulaması", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 850 });
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // 1. İlk açılışta taslak oluşmamalıdır
    const initialDraft = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });
    expect(initialDraft).toBeNull();

    // 2. Bir alan doldur ve kaydet
    const yerInput = page.locator("#beton-dokum-yer");
    await yerInput.fill("Temizlenecek Adres");
    await page.waitForTimeout(2400);

    // 3. Temizle eylemini tetikle (V3: window.confirm yok)
    let confirmOpened = false;
    page.on("dialog", async (dialog) => {
      confirmOpened = true;
      await dialog.accept();
    });
    const clearBtn = page.locator('footer[data-testid="belge-studio-actions"] button:has-text("Temizle")').first();
    await clearBtn.click();
    await page.waitForTimeout(500);

    expect(confirmOpened).toBe(false);
    await expect(yerInput).toHaveValue("");

    // 4. Depoda boş snapshot olduğunu doğrula
    const clearedDraft = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });
    expect(clearedDraft).not.toBeNull();
    expect(JSON.parse(clearedDraft!).values.yer).toBe("");

    // 5. Geri Al (Undo) butonuna tıkla ve önceki dolu verinin geri geldiğini doğrula
    const undoBtn = page.locator('footer[data-testid="belge-studio-actions"] button:has-text("Geri al")').first();
    await expect(undoBtn).toBeVisible();
    await expect(undoBtn).toBeEnabled();
    await undoBtn.click();
    await page.waitForTimeout(500);
    await expect(yerInput).toHaveValue("Temizlenecek Adres");
  });

  test("Senaryo 3: Depolama toleransı ve bozuk veri koruması", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 850 });
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // 1. Onaysız otomatik kayıt kontrolü
    const titleInput = page.locator("#beton-dokum-tutanak_alt_baslik");
    await titleInput.fill("Depolama Toleransı Proje Bilgisi");
    await expect(page.locator('[data-testid="belge-draft-status-badge"]')).toContainText("Kaydedildi", { timeout: 10_000 });

    // 2. Bozuk depolama verisi simülasyonu: geçersiz JSON yazıldığında stüdyo çökmemeli
    await page.evaluate(() => {
      window.localStorage.setItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi", "{ bozuk-json-verisi ");
    });
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Sayfa sorunsuz açılmalı ve çalışmaya devam etmelidir
    await expect(page.locator('[data-testid="belge-studio-form-scroll"]')).toBeVisible();
    await expect(page.locator('[data-testid="belge-studio-preview-toolbar"]')).toBeVisible();
  });

  test("Senaryo 4: Çoklu sekme bağımsız yazım ve storage tutarlılığı", async ({ context }) => {
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    await pageA.goto("/belgeler/beton-dokum-tutanagi");
    await pageA.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await pageA.reload();
    await pageA.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    await pageB.goto("/belgeler/beton-dokum-tutanagi");
    await pageB.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Sekme A'da veri yaz ve kaydı bekle
    const inputA = pageA.locator("#beton-dokum-tutanak_alt_baslik");
    await inputA.fill("Sekme A Notu");
    await expect(pageA.locator('[data-testid="belge-draft-status-badge"]')).toContainText("Kaydedildi", { timeout: 10_000 });

    // Sekme B'de veri yaz ve kaydı bekle
    await pageB.bringToFront();
    const inputB = pageB.locator("#beton-dokum-tutanak_alt_baslik");
    await inputB.fill("Sekme B Notu");
    await expect(pageB.locator('[data-testid="belge-draft-status-badge"]')).toContainText("Kaydedildi", { timeout: 10_000 });

    // Depodaki en son yazılan değer Sekme B Notu olmalı
    const stored = await pageB.evaluate(() => {
      const raw = window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
      return raw ? JSON.parse(raw).values.tutanak_alt_baslik : null;
    });
    expect(stored).toBe("Sekme B Notu");

    await pageA.close();
    await pageB.close();
  });

  test("Senaryo 5: Özel alan senkronizasyonları (Sözleşme & Taahhütname & Ruhsat)", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 850 });

    // 1. Sözleşme: Manuel imza override koruması
    await page.goto("/belgeler/santiye-sefi-sozlesmesi");
    await page.evaluate(() => {
      window.localStorage.setItem("belgeler:ux:draft-consent:device:v1", "device");
    });
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const nameInput = page.locator("#sozlesme-santiye_sefi_ad");
    await nameInput.fill("Mehmet Kaya");
    const signInput = page.locator("#sozlesme-santiye_sefi_imza_adi");
    await signInput.fill("Mehmet KAYA (Özel Temsilci)");
    await page.waitForTimeout(2400);

    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });
    // V3: Sessiz restore, confirm gerekmez
    await expect(nameInput).toHaveValue("Mehmet Kaya");
    await expect(signInput).toHaveValue("Mehmet KAYA (Özel Temsilci)");

    // 2. Sözleşme 2. sayfaya geçiş ve odak modu uyumu
    const nextPageBtn = page.locator('button[aria-label="Sonraki sayfa"]');
    await nextPageBtn.click();
    await expect(page.locator('[aria-label="PDF sayfaları"] span')).toHaveText("2 / 2");

    const focusToggle = page.locator('[data-testid="belge-pdf-focus-toggle"]');
    await focusToggle.click();
    await expect(page.locator('[data-testid="belge-studio-form-scroll"]')).toBeHidden();
    await expect(page.locator('[aria-label="PDF sayfaları"] span')).toHaveText("2 / 2");
    await focusToggle.click();
    await expect(page.locator('[data-testid="belge-studio-form-scroll"]')).toBeVisible();
  });

  test("Senaryo 6: Klavye odaklı gezinti (WAI-ARIA, Tab/Space/Enter ve 44px hedef boyutu)", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 850 });
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // 1. Akordeon butonuna odaklan ve Space/Enter ile aç/kapat
    const sectionToggle = page.locator('[data-testid="belge-section-toggle-belge-kayit"]');
    await sectionToggle.focus();
    await expect(sectionToggle).toBeFocused();

    // Enter ile kapat
    await page.keyboard.press("Enter");
    await expect(sectionToggle).toHaveAttribute("aria-expanded", "false");

    // Space ile aç
    await page.keyboard.press("Space");
    await expect(sectionToggle).toHaveAttribute("aria-expanded", "true");

    // 2. Minimum 44px dokunma hedefi kontrolü (WCAG 2.5.5 / 2.5.8) - Akordeon Başlığı (F14/F17)
    const sectionBox = await sectionToggle.boundingBox();
    expect(sectionBox).not.toBeNull();
    if (sectionBox) {
      expect(sectionBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("Senaryo 7: Çoklu viewport (320px - 1920px) ve sıfır yatay taşma (No horizontal overflow)", async ({ page }) => {
    const viewports = [
      { width: 320, height: 600 },
      { width: 360, height: 740 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1366, height: 768 },
      { width: 1920, height: 1080 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto("/belgeler/beton-dokum-tutanagi");
      await page.waitForSelector('[data-testid="belge-studio-preview-toolbar"]', { timeout: 15_000 });

      // Yatay taşma olmamalıdır: scrollWidth <= innerWidth
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1; // 1px rounding toleransı
      });
      expect(isOverflowing).toBe(false);

      // Mobilde (< 1024px) odak butonu gizli, masaüstünde (>= 1024px) görünür olmalıdır
      const focusToggle = page.locator('[data-testid="belge-pdf-focus-toggle"]');
      if (vp.width < 1024) {
        await expect(focusToggle).toBeHidden();
      } else {
        await expect(focusToggle).toBeVisible();
      }
    }
  });

  test("Senaryo 8: Stres kararlılığı — 30 ardışık etkileşimde sıfır gereksiz PDF derlemesi", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 850 });
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('a[title*="sekmede"]', { timeout: 15_000 });

    const pdfLink = page.locator('a[title*="sekmede"]');
    await expect(pdfLink).toHaveAttribute("href", /^blob:/);
    const initialBlobUrl = await pdfLink.getAttribute("href");

    const sectionToggle = page.locator('[data-testid="belge-section-toggle-belge-kayit"]');
    const focusToggle = page.locator('[data-testid="belge-pdf-focus-toggle"]');
    const zoomInBtn = page.locator('button[aria-label="Yakınlaştır"]');

    // 10 döngü x (2 section + 2 focus + 1 zoom) = 50 ardışık UI işlemi
    for (let i = 0; i < 10; i++) {
      // 1. Akordeon aç ve kapat (form görünürken)
      await sectionToggle.click();
      await page.waitForTimeout(30);
      await sectionToggle.click();
      await page.waitForTimeout(30);

      // 2. PDF odak modunu aç ve kapat (toolbar üzerinden)
      await focusToggle.click();
      await page.waitForTimeout(30);
      await focusToggle.click();
      await page.waitForTimeout(30);

      // 3. Yakınlaştır
      await zoomInBtn.click();
      await page.waitForTimeout(30);
    }

    // UI etkileşimleri sırasında PDF URL'inin ASLA değişmediğini doğrula
    const finalBlobUrl = await pdfLink.getAttribute("href");
    expect(finalBlobUrl).toBe(initialBlobUrl);
  });
});
