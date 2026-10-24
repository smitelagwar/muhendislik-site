/**
 * Belgeler — 5 Stüdyo Otomatik Taslak Rollout E2E Test Paketi (V3 Sözleşmesi)
 *
 * Hedef: Beton Döküm Tutanağı, İnşaat Ruhsatı Dilekçesi, Şantiye Şefi İstifa Dilekçesi,
 * Şantiye Şefi Sözleşmesi ve Şantiye Şefi Taahhütnamesi stüdyolarında onaysız otomatik taslak,
 * tek snapshot sessiz geri yükleme, imza eşitleme/override koruması ve belge izolasyonunun doğrulanması.
 */

import { test, expect } from "@playwright/test";

test.describe("Belgeler Otomatik Taslak — V3 5 Stüdyo Rollout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test("1. İnşaat Ruhsatı: Onaysız kayıt, reload sonrası sessiz restore ve korunan Randomize onayı", async ({ page }) => {
    await page.goto("/belgeler/insaat-ruhsati-dilekcesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const input = page.locator("#insaat-ruhsati-belediye_adi");
    await input.fill("KADIKÖY BELEDİYESİ V3");

    // V3: İzin şeridi OLMAMALIDIR
    const consentBanner = page.locator('[data-testid="belge-draft-consent-banner"]');
    await expect(consentBanner).toHaveCount(0);

    // 2000ms debounce beklemesi
    await page.waitForTimeout(2400);

    // Reload
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // V3: Kurtarma şeridi OLMAMALIDIR, değer doğrudan geri yüklenmiş olmalıdır
    const restoreBanner = page.locator('[data-testid="belge-draft-restore-banner"]');
    await expect(restoreBanner).toHaveCount(0);
    await expect(input).toHaveValue("KADIKÖY BELEDİYESİ V3");

    // İnşaat Ruhsatı'nda 'Örnek Doldur' (Randomize) için onay uyarısının korunduğunu doğrula
    let randomizeConfirmFired = false;
    page.once("dialog", async (dialog) => {
      randomizeConfirmFired = true;
      await dialog.dismiss();
    });

    const randomizeBtn = page.locator('button:has-text("Örnek Doldur")').first();
    if (await randomizeBtn.isVisible()) {
      await randomizeBtn.click();
      await page.waitForTimeout(300);
      expect(randomizeConfirmFired).toBe(true);
      // İptal edildiği için değer değişmemiş olmalı
      await expect(input).toHaveValue("KADIKÖY BELEDİYESİ V3");
    }
  });

  test("2. İstifa Dilekçesi: Taslak kurtarma ve PDF-only statik etiket alanlarının korunması", async ({ page }) => {
    await page.goto("/belgeler/santiye-sefi-istifa-dilekcesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const input = page.locator("#istifa-hitap_1");
    await input.fill("BEŞİKTAŞ BELEDİYE BAŞKANLIĞINA V3");
    await page.waitForTimeout(2400);

    // Reload
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Sessiz geri yükleme kontrolü
    const restoreBanner = page.locator('[data-testid="belge-draft-restore-banner"]');
    await expect(restoreBanner).toHaveCount(0);
    await expect(input).toHaveValue("BEŞİKTAŞ BELEDİYE BAŞKANLIĞINA V3");

    // Depodaki değerleri incele: PDF-only etiketlerin form taslağında yer almadığını doğrula
    const rawDraft = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:santiye-sefi-istifa-dilekcesi");
    });
    expect(rawDraft).not.toBeNull();
    if (rawDraft) {
      const parsed = JSON.parse(rawDraft);
      expect(parsed.values.hitap_1).toBe("BEŞİKTAŞ BELEDİYE BAŞKANLIĞINA V3");
      expect(parsed.values.adres_etiket).toBeUndefined();
      expect(parsed.values.tc_etiket).toBeUndefined();
      expect(parsed.values.iletisim_etiket).toBeUndefined();
    }
  });

  test("3. Sözleşme: Manuel imza override'ının restore sırasında aynen korunması", async ({ page }) => {
    await page.goto("/belgeler/santiye-sefi-sozlesmesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const nameInput = page.locator("#sozlesme-santiye_sefi_ad");
    await nameInput.fill("Ahmet Yılmaz V3");

    const signInput = page.locator("#sozlesme-santiye_sefi_imza_adi");
    await signInput.fill("Ahmet YILMAZ (Özel Vekil V3)");

    await page.waitForTimeout(2400);

    // Reload
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const restoreBanner = page.locator('[data-testid="belge-draft-restore-banner"]');
    await expect(restoreBanner).toHaveCount(0);

    // Hem asıl isim hem manuel override aynen geri gelmeli
    await expect(nameInput).toHaveValue("Ahmet Yılmaz V3");
    await expect(signInput).toHaveValue("Ahmet YILMAZ (Özel Vekil V3)");
  });

  test("4. Taahhütname: unvan ve unvan_imza manuel override koruması", async ({ page }) => {
    await page.goto("/belgeler/santiye-sefi-taahhutnamesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const unvanInput = page.locator("#taahhutname-unvan");
    await unvanInput.fill("İnşaat Mühendisi V3");

    const unvanImzaInput = page.locator("#taahhutname-unvan_imza");
    await unvanImzaInput.fill("İnşaat Yüksek Mühendisi / Proje Müdürü V3");

    await page.waitForTimeout(2400);

    // Reload
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const restoreBanner = page.locator('[data-testid="belge-draft-restore-banner"]');
    await expect(restoreBanner).toHaveCount(0);

    await expect(unvanInput).toHaveValue("İnşaat Mühendisi V3");
    await expect(unvanImzaInput).toHaveValue("İnşaat Yüksek Mühendisi / Proje Müdürü V3");
  });

  test("5. Belge İzolasyonu: Belge A taslağı Belge B'ye sızmamalıdır", async ({ page }) => {
    // 1. Beton stüdyosuna yaz
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const betonInput = page.locator("#beton-dokum-tutanak_alt_baslik");
    await betonInput.fill("Beton Özel Taslak V3");
    await page.waitForTimeout(2400);

    // 2. Sözleşme stüdyosuna git
    await page.goto("/belgeler/santiye-sefi-sozlesmesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Sözleşmede beton verisi olmamalı, form varsayılan değeriyle açılmalı
    const sozlesmeInput = page.locator("#sozlesme-santiye_sefi_ad");
    await expect(sozlesmeInput).not.toHaveValue("Beton Özel Taslak V3");
  });
});
