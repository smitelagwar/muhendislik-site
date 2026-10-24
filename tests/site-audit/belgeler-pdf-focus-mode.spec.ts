/**
 * Belgeler — PDF Odak Modu E2E Test Paketi (ASAMA_07)
 *
 * Hedef:
 * 1. Desktop (lg >= 1024px) ekranlarda PDF Odak Modu açma/kapatma (data-testid="belge-pdf-focus-toggle", aria-pressed, etiket).
 * 2. Form panelinin CSS ile gizlenmesi (unmount edilmemesi), preview panelinin tam genişlik (w-full) alması.
 * 3. Form scrollTop pozisyonunun ve aktif input odağının saklanması ve mod çıkışında güvenle geri yüklenmesi.
 * 4. Ekran boyutu < 1024px'e düştüğünde (1280 -> 900 -> 1280) odak modunun otomatik sıfırlanması ve yeniden açılmaması.
 * 5. Odak modu geçişlerinde sıfır PDF yeniden oluşturma (blobUrl değişmezliği).
 * 6. İki sayfalı Sözleşme stüdyosunda sayfa navigasyonu ve odak modu uyumu.
 * 7. Mobil ekranda (< 1024px) odak butonunun görünmemesi ve sekmeli gezintinin korunması.
 */

import { test, expect } from "@playwright/test";

test.describe("Belgeler PDF Odak Modu — ASAMA_07", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test("1. Masaüstü (1366px): PDF odak modu açma, kapatma, WAI-ARIA ve tam genişlik", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 850 });
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const toggle = page.locator('[data-testid="belge-pdf-focus-toggle"]');
    const formScroll = page.locator('[data-testid="belge-studio-form-scroll"]');
    const previewPanel = page.locator("#beton-dokum-mobile-panel-preview");

    // Başlangıç: buton görünür, basılı değil, form görünür
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toContainText("PDF'ye Odaklan");
    await expect(formScroll).toBeVisible();

    // Odak modunu aç
    await toggle.click();

    // Form gizlendi, buton basılı, etiket Formu Göster oldu
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toContainText("Formu Göster");
    await expect(formScroll).toBeHidden();
    await expect(previewPanel).toHaveClass(/\bw-full\b/);

    // Odak modunu kapat
    await toggle.click();

    // Form geri geldi
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toContainText("PDF'ye Odaklan");
    await expect(formScroll).toBeVisible();
  });

  test("2. State koruma: Form scrollTop ve input odak durumunun geri yüklenmesi", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 600 });
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const formScroll = page.locator('[data-testid="belge-studio-form-scroll"]');
    const toggle = page.locator('[data-testid="belge-pdf-focus-toggle"]');

    // 1. Formu aşağı kaydır
    await formScroll.evaluate((el) => {
      el.scrollTop = 150;
    });
    const scrolledTop = await formScroll.evaluate((el) => el.scrollTop);
    expect(scrolledTop).toBeGreaterThanOrEqual(50);

    // 2. Bir input'a odaklan
    const targetInput = page.locator("#beton-dokum-yer");
    await targetInput.focus();
    await expect(targetInput).toBeFocused();

    // 3. Odak moduna geç
    await toggle.click();
    await expect(formScroll).toBeHidden();

    // 4. Odak modundan çık
    await toggle.click();
    await expect(formScroll).toBeVisible();

    // 5. Scroll pozisyonu ve input odağının korunduğunu doğrula
    await page.waitForTimeout(100);
    const restoredTop = await formScroll.evaluate((el) => el.scrollTop);
    expect(Math.abs(restoredTop - scrolledTop)).toBeLessThanOrEqual(10);
    await expect(targetInput).toBeFocused();
  });

  test("3. Responsive boyut değişimi (1280 -> 900 -> 1280): Odak modu otomatik sıfırlanır ve kapalı kalır", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const toggle = page.locator('[data-testid="belge-pdf-focus-toggle"]');
    const formScroll = page.locator('[data-testid="belge-studio-form-scroll"]');

    // Masaüstünde aç
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(formScroll).toBeHidden();

    // Genişliği 900px'e düşür (< 1024px)
    await page.setViewportSize({ width: 900, height: 800 });
    await page.waitForTimeout(150);

    // 900px'de odak butonu gizlenir
    await expect(toggle).toBeHidden();

    // Tekrar masaüstüne (1280px) dön
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(150);

    // Odak butonu tekrar görünür fakat odak modu KAPALI kalmalıdır (kullanıcı onaysız gizlenmez)
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toContainText("PDF'ye Odaklan");
    await expect(formScroll).toBeVisible();
  });

  test("4. Sıfır PDF byte yeniden oluşturma: Odak modu geçişinde blobUrl değişmez", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 850 });
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('a[title*="sekmede"]', { timeout: 15_000 });

    // PDF linkinin hazır olmasını bekle
    const externalLink = page.locator('a[title*="sekmede"]');
    await expect(externalLink).toHaveAttribute("href", /^blob:/);
    const initialBlobUrl = await externalLink.getAttribute("href");

    const toggle = page.locator('[data-testid="belge-pdf-focus-toggle"]');

    // 5 kez hızlıca aç/kapat
    for (let i = 0; i < 5; i++) {
      await toggle.click();
      await page.waitForTimeout(50);
    }
    // Son olarak açık veya kapalı durumu eşitle
    const isPressed = (await toggle.getAttribute("aria-pressed")) === "true";
    if (isPressed) {
      await toggle.click();
    }

    // Blob URL'in birebir aynı kaldığını doğrula (yeni PDF derlenmedi)
    const currentBlobUrl = await externalLink.getAttribute("href");
    expect(currentBlobUrl).toBe(initialBlobUrl);
  });

  test("5. Sözleşme Stüdyosu: 2 sayfalı belgede sayfa navigasyonu ve odak modu uyumu", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 850 });
    await page.goto("/belgeler/santiye-sefi-sozlesmesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const toggle = page.locator('[data-testid="belge-pdf-focus-toggle"]');
    const formScroll = page.locator('[data-testid="belge-studio-form-scroll"]');
    const nextPageBtn = page.locator('button[aria-label="Sonraki sayfa"]');

    // Sayfa 2'ye geç
    await expect(nextPageBtn).toBeVisible();
    await nextPageBtn.click();
    await expect(page.locator('[aria-label="PDF sayfaları"] span')).toHaveText("2 / 2");

    // Odak modunu aç
    await toggle.click();
    await expect(formScroll).toBeHidden();
    await expect(page.locator('[aria-label="PDF sayfaları"] span')).toHaveText("2 / 2");

    // Odak modunu kapat
    await toggle.click();
    await expect(formScroll).toBeVisible();
    await expect(page.locator('[aria-label="PDF sayfaları"] span')).toHaveText("2 / 2");
  });

  test("6. Mobil görünüm (390px): Odak butonu görünmez, sekmeli düzen aktiftir", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-preview-toolbar"], [data-testid="belge-studio-mobile-zoom-pill"]', { timeout: 15_000 });

    // Odak butonu mobilde görünmez
    const toggle = page.locator('[data-testid="belge-pdf-focus-toggle"]');
    await expect(toggle).toBeHidden();

    // Formu Düzenle butonuna tıklayarak form paneline geç
    const showFormBtn = page.locator('[data-testid="belge-studio-mobile-actions"]').getByRole("button", { name: "Formu Düzenle" });
    if (await showFormBtn.isVisible()) {
      await showFormBtn.click();
    }

    // Form paneli artık görünür, odak butonu hâlâ gizli
    const formScroll = page.locator('[data-testid="belge-studio-form-scroll"]');
    await expect(formScroll).toBeVisible();
    await expect(toggle).toBeHidden();
  });
});
