/**
 * Belgeler — 5 Stüdyo Otomatik Taslak Rollout E2E Test Paketi (ASAMA_04)
 *
 * Hedef: Beton Döküm Tutanağı, İnşaat Ruhsatı Dilekçesi, Şantiye Şefi İstifa Dilekçesi,
 * Şantiye Şefi Sözleşmesi ve Şantiye Şefi Taahhütnamesi stüdyolarında otomatik taslak,
 * tek snapshot atomik geri yükleme, imza eşitleme/override koruması ve belge izolasyonunun doğrulanması.
 */

import { test, expect } from "@playwright/test";

test.describe("Belgeler Otomatik Taslak — ASAMA_04 5 Stüdyo Rollout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test("1. İnşaat Ruhsatı: İzin, 800ms debounce kayıt, reload sonrası atomik restore ve Randomize", async ({ page }) => {
    await page.goto("/belgeler/insaat-ruhsati-dilekcesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const input = page.locator("#insaat-ruhsati-belediye_adi");
    await input.fill("KADIKÖY BELEDİYESİ");

    // İzin şeridi görünmeli
    const consentBanner = page.locator('[data-testid="belge-draft-consent-banner"]');
    await expect(consentBanner).toBeVisible();

    // Cihaza izin ver
    await page.locator('[data-testid="belge-draft-consent-device"]').click();
    await expect(consentBanner).toHaveCount(0);

    // Debounce bekle
    await page.waitForTimeout(1200);

    // Reload
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Restore banner görünmeli
    const restoreBanner = page.locator('[data-testid="belge-draft-restore-banner"]');
    await expect(restoreBanner).toBeVisible();

    // Taslağı yükle
    await page.locator('[data-testid="belge-draft-restore-confirm"]').click();
    await expect(restoreBanner).toHaveCount(0);
    await expect(input).toHaveValue("KADIKÖY BELEDİYESİ");
  });

  test("2. İstifa Dilekçesi: Taslak kurtarma ve PDF-only statik etiket alanlarının korunması", async ({ page }) => {
    // Önce cihaz iznini ayarla
    await page.goto("/belgeler/santiye-sefi-istifa-dilekcesi");
    await page.evaluate(() => {
      window.localStorage.setItem("belgeler:ux:draft-consent:device:v1", "device");
    });
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const input = page.locator("#istifa-hitap_1");
    await input.fill("BEŞİKTAŞ BELEDİYE BAŞKANLIĞINA");
    await page.waitForTimeout(1200);

    // Reload
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const restoreBanner = page.locator('[data-testid="belge-draft-restore-banner"]');
    await expect(restoreBanner).toBeVisible();
    await page.locator('[data-testid="belge-draft-restore-confirm"]').click();
    await expect(input).toHaveValue("BEŞİKTAŞ BELEDİYE BAŞKANLIĞINA");

    // Depodaki değerleri incele: PDF-only etiketlerin (adres_etiket vb.) form taslağında yer almadığını doğrula
    const rawDraft = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:santiye-sefi-istifa-dilekcesi");
    });
    expect(rawDraft).not.toBeNull();
    if (rawDraft) {
      const parsed = JSON.parse(rawDraft);
      expect(parsed.values.hitap_1).toBe("BEŞİKTAŞ BELEDİYE BAŞKANLIĞINA");
      expect(parsed.values.adres_etiket).toBeUndefined();
      expect(parsed.values.tc_etiket).toBeUndefined();
      expect(parsed.values.iletisim_etiket).toBeUndefined();
    }
  });

  test("3. Sözleşme: Manuel imza override'ının restore sırasında aynen korunması", async ({ page }) => {
    await page.goto("/belgeler/santiye-sefi-sozlesmesi");
    await page.evaluate(() => {
      window.localStorage.setItem("belgeler:ux:draft-consent:device:v1", "device");
    });
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Şantiye şefi adını yaz
    const nameInput = page.locator("#sozlesme-santiye_sefi_ad");
    await nameInput.fill("Ahmet Yılmaz");

    // İmza adını farklı bir manuel override ile değiştir
    const signInput = page.locator("#sozlesme-santiye_sefi_imza_adi");
    await signInput.fill("Ahmet YILMAZ (Özel Vekil)");

    await page.waitForTimeout(1200);

    // Reload
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const restoreBanner = page.locator('[data-testid="belge-draft-restore-banner"]');
    await expect(restoreBanner).toBeVisible();
    await page.locator('[data-testid="belge-draft-restore-confirm"]').click();

    // Hem asıl isim hem manuel override aynen geri gelmeli
    await expect(nameInput).toHaveValue("Ahmet Yılmaz");
    await expect(signInput).toHaveValue("Ahmet YILMAZ (Özel Vekil)");
  });

  test("4. Taahhütname: unvan ve unvan_imza manuel override koruması", async ({ page }) => {
    await page.goto("/belgeler/santiye-sefi-taahhutnamesi");
    await page.evaluate(() => {
      window.localStorage.setItem("belgeler:ux:draft-consent:device:v1", "device");
    });
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const unvanInput = page.locator("#taahhutname-unvan");
    await unvanInput.fill("İnşaat Mühendisi");

    const unvanImzaInput = page.locator("#taahhutname-unvan_imza");
    await unvanImzaInput.fill("İnşaat Yüksek Mühendisi / Proje Müdürü");

    await page.waitForTimeout(1200);

    // Reload
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const restoreBanner = page.locator('[data-testid="belge-draft-restore-banner"]');
    await expect(restoreBanner).toBeVisible();
    await page.locator('[data-testid="belge-draft-restore-confirm"]').click();

    await expect(unvanInput).toHaveValue("İnşaat Mühendisi");
    await expect(unvanImzaInput).toHaveValue("İnşaat Yüksek Mühendisi / Proje Müdürü");
  });

  test("5. Belge İzolasyonu: Belge A taslağı Belge B'ye sızmamalıdır", async ({ page }) => {
    // 1. Beton stüdyosuna yaz
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.evaluate(() => {
      window.localStorage.setItem("belgeler:ux:draft-consent:device:v1", "device");
    });
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const betonInput = page.locator("#beton-dokum-tutanak_alt_baslik");
    await betonInput.fill("Beton Özel Taslak");
    await page.waitForTimeout(1200);

    // 2. Sözleşme stüdyosuna git
    await page.goto("/belgeler/santiye-sefi-sozlesmesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Sözleşmede restore banner GÖRÜNMEMELİDİR (çünkü sözleşme için taslak yok)
    const restoreBanner = page.locator('[data-testid="belge-draft-restore-banner"]');
    await expect(restoreBanner).toHaveCount(0);
  });
});
