/**
 * Belgeler — Otomatik Taslak Pilot E2E Test Paketi (V3 Sözleşmesi)
 *
 * Hedef: Beton Döküm Tutanağı üzerinde:
 * - Onaysız, sorusuz otomatik kayıt (2000 ms debounce)
 * - Hiçbir consent/izin veya kurtarma banner'ının bulunmaması
 * - Sayfa yenilendiğinde sessiz ve kayıpsız otomatik geri yükleme
 * - Sıfırla ve Temizle eylemlerinin window.confirm'siz, anında ve Geri Al ile geri alınabilir çalışması
 */

import { test, expect } from "@playwright/test";

test.describe("Belgeler Otomatik Taslak — V3 Beton Pilotu", () => {
  test.beforeEach(async ({ page }) => {
    // Test öncesi yerel depolama alanlarını temizle
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });
  });

  test("1. Başlangıçta depoda sıfır PII ve taslak olmalı; izin şeridi ASLA gösterilmemelidir", async ({ page }) => {
    // İlk render'da depoda taslak olmamalı
    const storageKeys = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k?.startsWith("belgeler:ux:draft")) keys.push(k);
      }
      return keys;
    });

    expect(storageKeys).toHaveLength(0);

    // V3: İzin şeridi DOM'da bulunmamalıdır
    const consentBanner = page.locator('[data-testid="belge-draft-consent-banner"]');
    await expect(consentBanner).toHaveCount(0);
  });

  test("2. Düzenleme yapıldığında izin şeridi çıkmaz; 2000ms debounce ile doğrudan kaydedilir", async ({ page }) => {
    const input = page.locator("#beton-dokum-tutanak_alt_baslik");
    await input.fill("Özel Deneme Başlığı V3");

    // V3: Hiçbir izin şeridi görünmez
    const consentBanner = page.locator('[data-testid="belge-draft-consent-banner"]');
    await expect(consentBanner).toHaveCount(0);

    // 2000ms debounce beklemesi (2400ms emniyet payı)
    await page.waitForTimeout(2400);

    // Depodaki kaydı oku
    const rawDraft = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });

    expect(rawDraft).not.toBeNull();
    if (rawDraft) {
      const parsed = JSON.parse(rawDraft);
      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.documentId).toBe("beton-dokum-tutanagi");
      expect(parsed.values.tutanak_alt_baslik).toBe("Özel Deneme Başlığı V3");
    }

    // Üst barda 'Kaydedildi' durumu görünmeli
    const badge = page.locator('[data-testid="belge-draft-status-badge"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("Kaydedildi");
  });

  test("3. Kesintisiz art arda yazma: debounced kayıt son snapshot'ı kaydeder", async ({ page }) => {
    const yerInput = page.locator("#beton-dokum-yer");
    for (let i = 1; i <= 4; i++) {
      await yerInput.fill(`Ankara Şantiye Sahası Revizyon ${i}`);
      await page.waitForTimeout(200);
    }

    // 2000ms debounce beklemesi
    await page.waitForTimeout(2400);

    const rawDraft = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });

    expect(rawDraft).not.toBeNull();
    if (rawDraft) {
      const parsed = JSON.parse(rawDraft);
      expect(parsed.values.yer).toBe("Ankara Şantiye Sahası Revizyon 4");
    }
  });

  test("4. Sayfa yenilendiğinde hiçbir banner sorulmaz; taslak sessizce ve atomik yüklenir", async ({ page }) => {
    // Taslak oluştur ve kaydedilmesini bekle
    const input = page.locator("#beton-dokum-tutanak_alt_baslik");
    await input.fill("Kurtarılacak Kritik Belge V3");
    await page.waitForTimeout(2400);

    // Sayfayı yenile
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // V3: Kurtarma banner'ı ASLA görünmemeli, sessizce geri yüklenmeli
    const restoreBanner = page.locator('[data-testid="belge-draft-restore-banner"]');
    await expect(restoreBanner).toHaveCount(0);

    // Form alanındaki değer doğrudan geri gelmiş olmalı
    await expect(input).toHaveValue("Kurtarılacak Kritik Belge V3");
  });

  test("5. 'Sıfırla' ve 'Temizle' onaysız (confirm modal'sız) anında persist eder ve Undo ile geri alınır", async ({ page }) => {
    const input = page.locator("#beton-dokum-tutanak_alt_baslik");
    await input.fill("Silinecek Öncesi Not V3");
    await page.waitForTimeout(2400);

    // window.confirm çağrısı OLMAMALIDIR — spy ile denetle
    let confirmCalled = false;
    page.on("dialog", async (dialog) => {
      confirmCalled = true;
      await dialog.accept();
    });

    // Temizle butonunu bul ve tıkla
    const clearBtn = page.locator('footer[data-testid="belge-studio-actions"] button:has-text("Temizle")').first();
    await clearBtn.click();
    await page.waitForTimeout(500);

    // Dialog açılmadığını doğrula
    expect(confirmCalled).toBe(false);

    // Form alanı ve depodaki taslak anında boşalmış olmalı
    await expect(input).toHaveValue("");

    const rawAfterClear = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });
    expect(rawAfterClear).not.toBeNull();
    if (rawAfterClear) {
      const parsed = JSON.parse(rawAfterClear);
      expect(parsed.values.tutanak_alt_baslik).toBe("");
    }

    // Geri Al (Undo) butonuna tıkla
    const undoBtn = page.locator('footer[data-testid="belge-studio-actions"] button:has-text("Geri al")').first();
    await expect(undoBtn).toBeEnabled();
    await undoBtn.click();
    await page.waitForTimeout(500);

    // Geri alma sonrası eski değer forma ve depoya geri dönmüş olmalı
    await expect(input).toHaveValue("Silinecek Öncesi Not V3");

    const rawAfterUndo = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });
    if (rawAfterUndo) {
      const parsedUndo = JSON.parse(rawAfterUndo);
      expect(parsedUndo.values.tutanak_alt_baslik).toBe("Silinecek Öncesi Not V3");
    }
  });
});
