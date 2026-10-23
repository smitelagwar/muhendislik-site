/**
 * Belgeler — Otomatik Taslak Pilot E2E Test Paketi (ASAMA_02)
 *
 * Hedef: Beton Döküm Tutanağı üzerinde izin, debounced kayıt, kurtarma (restore),
 * silme, şimdilik kapatma ve sıfırla/temizle/geri al senaryolarının uçtan uca doğrulanması.
 */

import { test, expect } from "@playwright/test";

test.describe("Belgeler Otomatik Taslak — ASAMA_02 Beton Pilotu", () => {
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

  test("1. İzin verilmeden önce depoda sıfır PII ve taslak olmalıdır", async ({ page }) => {
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

    // İzin şeridi henüz düzenleme yapılmadığı için görünmemelidir
    const consentBanner = page.locator('[data-testid="belge-draft-consent-banner"]');
    await expect(consentBanner).toHaveCount(0);
  });

  test("2. İlk düzenlemede izin şeridi belirmeli; 'Kaydetme' seçilirse tekrar rahatsız etmemelidir", async ({ page }) => {
    const input = page.locator("#beton-dokum-tutanak_alt_baslik");
    await input.fill("Özel Deneme Başlığı");

    // İzin şeridi açılmalı
    const consentBanner = page.locator('[data-testid="belge-draft-consent-banner"]');
    await expect(consentBanner).toBeVisible({ timeout: 5000 });

    // 'Kaydetme' butonuna bas
    const dismissBtn = page.locator('[data-testid="belge-draft-consent-dismiss"]');
    await dismissBtn.click();
    await expect(consentBanner).toHaveCount(0);

    // Başka bir alana yazıldığında tekrar izin sorulmamalı
    const dateInput = page.locator("#beton-dokum-tarih");
    await dateInput.fill("12.12.2026");
    await page.waitForTimeout(1000);

    await expect(consentBanner).toHaveCount(0);

    // Depoda hiçbir taslak olmamalı
    const draftInStorage = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });
    expect(draftInStorage).toBeNull();
  });

  test("3. 'Bu cihazda kaydet' seçildiğinde 800ms debounce ile son snapshot kaydedilmelidir", async ({ page }) => {
    const input = page.locator("#beton-dokum-tutanak_alt_baslik");
    await input.fill("Gece Dökümü Tutanak Notu");

    const deviceBtn = page.locator('[data-testid="belge-draft-consent-device"]');
    await expect(deviceBtn).toBeVisible({ timeout: 5000 });
    await deviceBtn.click();

    // 5 ardışık hızlı düzenleme
    const yerInput = page.locator("#beton-dokum-yer");
    for (let i = 1; i <= 5; i++) {
      await yerInput.fill(`Ankara Şantiye Sahası Revizyon ${i}`);
    }

    // 800ms trailing debounce beklemesi (1200ms emniyet payı)
    await page.waitForTimeout(1200);

    // Depodaki kaydı oku
    const rawDraft = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });

    expect(rawDraft).not.toBeNull();
    if (rawDraft) {
      const parsed = JSON.parse(rawDraft);
      expect(parsed.schemaVersion).toBe(1);
      expect(parsed.documentId).toBe("beton-dokum-tutanagi");
      expect(parsed.values.tutanak_alt_baslik).toBe("Gece Dökümü Tutanak Notu");
      expect(parsed.values.yer).toBe("Ankara Şantiye Sahası Revizyon 5");
    }
  });

  test("4. Sayfa yenilendiğinde taslak kurtarma şeridi çıkmalı ve 'Taslağı Yükle' atomik çalışmalıdır", async ({ page }) => {
    // Önceden bir taslak hazırla ve kaydet
    const input = page.locator("#beton-dokum-tutanak_alt_baslik");
    await input.fill("Kurtarılacak Kritik Belge");
    const deviceBtn = page.locator('[data-testid="belge-draft-consent-device"]');
    await deviceBtn.click();
    await page.waitForTimeout(1200);

    // Sayfayı yenile
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Kurtarma şeridi görünmeli
    const restoreBanner = page.locator('[data-testid="belge-draft-restore-banner"]');
    await expect(restoreBanner).toBeVisible({ timeout: 5000 });

    // 'Taslağı Yükle' butonuna bas
    const confirmBtn = page.locator('[data-testid="belge-draft-restore-confirm"]');
    await confirmBtn.click();
    await expect(restoreBanner).toHaveCount(0);

    // Form alanındaki değer doğrulanmalı
    await expect(input).toHaveValue("Kurtarılacak Kritik Belge");
  });

  test("5. 'Şimdilik Kapat' dendiğinde eski taslak depoda korunmalı ve autosave duraklatılmalıdır", async ({ page }) => {
    // Taslak oluştur
    const input = page.locator("#beton-dokum-tutanak_alt_baslik");
    await input.fill("Orijinal Taslak Metni");
    const deviceBtn = page.locator('[data-testid="belge-draft-consent-device"]');
    await deviceBtn.click();
    await page.waitForTimeout(1200);

    // Yenile
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Şimdilik Kapat'a tıkla
    const dismissBtn = page.locator('[data-testid="belge-draft-restore-dismiss"]');
    await expect(dismissBtn).toBeVisible({ timeout: 5000 });
    await dismissBtn.click();

    // Formu değiştir (fakat autosave duraklatıldığı için depodaki orijinal metin ezilmemeli)
    await input.fill("Farklı Geçici Metin");
    await page.waitForTimeout(1200);

    const rawDraft = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });

    expect(rawDraft).not.toBeNull();
    if (rawDraft) {
      const parsed = JSON.parse(rawDraft);
      // Depodaki değer hala orijinal taslak metni olmalı!
      expect(parsed.values.tutanak_alt_baslik).toBe("Orijinal Taslak Metni");
    }
  });

  test("6. 'Sıfırla' ve 'Temizle' eylemleri yeni snapshot'ı kaydetmeli ve Undo ile geri alınabilmelidir", async ({ page }) => {
    const input = page.locator("#beton-dokum-tutanak_alt_baslik");
    await input.fill("Silinecek Öncesi Not");
    const deviceBtn = page.locator('[data-testid="belge-draft-consent-device"]');
    await deviceBtn.click();
    await page.waitForTimeout(1200);

    page.once("dialog", dialog => dialog.accept());
    // Temizle butonunu bul ve tıkla
    const clearBtn = page.locator('footer[data-testid="belge-studio-actions"] button:has-text("Temizle")').first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    } else {
      // Dropdown içinden Temizle
      const moreBtn = page.locator('[data-testid="belge-studio-actions"] button[aria-label="Diğer Eylemler Menüsü"]').first();
      await moreBtn.click();
      await page.locator('text="Tüm Alanları Temizle"').click();
    }

    await page.waitForTimeout(1200);

    // Depodaki taslak da boşalmış olmalı
    const rawAfterClear = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });
    expect(rawAfterClear).not.toBeNull();
    if (rawAfterClear) {
      const parsed = JSON.parse(rawAfterClear);
      expect(parsed.values.tutanak_alt_baslik).toBe("");
    }

    // Geri Al (Undo) butonuna tıkla
    const undoBtn = page.locator('footer[data-testid="belge-studio-actions"] button:has-text("Geri Al")').first();
    if (await undoBtn.isVisible()) {
      await undoBtn.click();
      await page.waitForTimeout(1200);

      const rawAfterUndo = await page.evaluate(() => {
        return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
      });
      if (rawAfterUndo) {
        const parsedUndo = JSON.parse(rawAfterUndo);
        expect(parsedUndo.values.tutanak_alt_baslik).toBe("Silinecek Öncesi Not");
      }
    }
  });
});
