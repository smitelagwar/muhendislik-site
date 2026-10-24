/**
 * Belgeler — Çoklu Sekme ve Yaşam Döngüsü Yarışları E2E Test Paketi (V3 Sözleşmesi)
 *
 * Hedef: Tab A ve Tab B arasında eşzamanlı düzenleme, çakışma tespiti (conflict),
 * temizleme sonrası dirilme (resurrection guard) ve belge izolasyonunun doğrulanması.
 */

import { test, expect } from "@playwright/test";

test.describe("Belgeler Otomatik Taslak — V3 Çoklu Sekme ve Veri Kaybı Kapısı", () => {
  test("1. İki sekmede (Tab A ve Tab B) bağımsız yazım ve storage revizyon takibi", async ({ context }) => {
    // Tab A
    const pageA = await context.newPage();
    await pageA.goto("/belgeler/beton-dokum-tutanagi");
    await pageA.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await pageA.reload();
    await pageA.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Tab B
    const pageB = await context.newPage();
    await pageB.goto("/belgeler/beton-dokum-tutanagi");
    await pageB.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Tab A yazar
    const inputA = pageA.locator("#beton-dokum-tutanak_alt_baslik");
    await inputA.fill("Sekme A Notu V3");
    await pageA.waitForTimeout(2400); // 2000ms debounce bekle

    // Tab A'nın kaydettiğini doğrula
    const draftA = await pageA.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });
    expect(draftA).not.toBeNull();
    expect(JSON.parse(draftA!).values.tutanak_alt_baslik).toBe("Sekme A Notu V3");

    // Tab B yazar
    const inputB = pageB.locator("#beton-dokum-tutanak_alt_baslik");
    await inputB.fill("Sekme B Notu V3");
    await pageB.waitForTimeout(2400);

    // Depoda Tab B'nin kaydı güncel olmalı
    const draftB = await pageB.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });
    expect(draftB).not.toBeNull();
    expect(JSON.parse(draftB!).values.tutanak_alt_baslik).toBe("Sekme B Notu V3");

    await pageA.close();
    await pageB.close();
  });

  test("2. Temizle eyleminden sonra pagehide / ayrılma olayında eski taslak dirilmemelidir", async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const input = page.locator("#beton-dokum-tutanak_alt_baslik");
    await input.fill("Geçici Taslak Metni V3");
    await page.waitForTimeout(2400);

    // Depoda taslak olduğunu doğrula
    const storedBefore = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });
    expect(storedBefore).not.toBeNull();

    // Temizle butonuna tıkla (onaysız, anında temizler)
    const clearBtn = page.locator('footer[data-testid="belge-studio-actions"] button:has-text("Temizle")').first();
    await clearBtn.click();
    await page.waitForTimeout(500);

    // Simüle pagehide
    await page.evaluate(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    await page.waitForTimeout(500);

    // Depodaki değer boşaltılmış olmalı, eski taslak asla dirilmemeli
    const storedAfter = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });
    expect(storedAfter).not.toBeNull();
    expect(JSON.parse(storedAfter!).values.tutanak_alt_baslik).toBe("");
  });

  test("3. Farklı belgelerin çoklu sekmede açılması izolasyonu bozmaz", async ({ context }) => {
    // Tab A: Beton döküm tutanağı
    const pageA = await context.newPage();
    await pageA.goto("/belgeler/beton-dokum-tutanagi");
    await pageA.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await pageA.reload();
    await pageA.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const inputA = pageA.locator("#beton-dokum-tutanak_alt_baslik");
    await inputA.click();
    await inputA.fill("Beton Sekmesi V3");
    await expect(inputA).toHaveValue("Beton Sekmesi V3");
    await pageA.waitForTimeout(2500);

    // Tab B: İnşaat ruhsatı dilekçesi
    const pageB = await context.newPage();
    await pageB.goto("/belgeler/insaat-ruhsati-dilekcesi");
    await pageB.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const inputB = pageB.locator("#insaat-ruhsati-belediye_adi");
    await inputB.click();
    await inputB.fill("Ruhsat Sekmesi V3");
    await expect(inputB).toHaveValue("Ruhsat Sekmesi V3");
    await pageB.waitForTimeout(2500);

    await expect.poll(async () => {
      return pageA.evaluate(() => {
        const raw = window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
        return raw ? JSON.parse(raw).values?.tutanak_alt_baslik : null;
      });
    }, { timeout: 10_000 }).toBe("Beton Sekmesi V3");

    await expect.poll(async () => {
      return pageB.evaluate(() => {
        const raw = window.localStorage.getItem("belgeler:ux:draft:device:v1:insaat-ruhsati-dilekcesi");
        return raw ? JSON.parse(raw).values?.belediye_adi : null;
      });
    }, { timeout: 10_000 }).toBe("Ruhsat Sekmesi V3");

    await pageA.close();
    await pageB.close();
  });
});
