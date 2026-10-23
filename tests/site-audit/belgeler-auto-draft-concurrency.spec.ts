/**
 * Belgeler — Çoklu Sekme ve Yaşam Döngüsü Yarışları E2E Test Paketi (ASAMA_03)
 *
 * Hedef: Tab A ve Tab B arasında eşzamanlı düzenleme, çakışma tespiti (conflict),
 * takeover, silme sonrası dirilme (resurrection guard) ve session modu izolasyonunun doğrulanması.
 */

import { test, expect } from "@playwright/test";

test.describe("Belgeler Otomatik Taslak — ASAMA_03 Çoklu Sekme ve Veri Kaybı Kapısı", () => {
  test("1. İki sekmede (Tab A ve Tab B) çakışma tespiti ve 'Diğer Sekmedekini Yükle' akışı", async ({ context }) => {
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

    // Tab A izin verir ve yazar
    const inputA = pageA.locator("#beton-dokum-tutanak_alt_baslik");
    await inputA.fill("Sekme A Notu");
    const deviceBtnA = pageA.locator('[data-testid="belge-draft-consent-device"]');
    await deviceBtnA.click();
    await pageA.waitForTimeout(1200); // Debounce bekle

    // Tab B de yazar (aynı belge, farklı writerId)
    const inputB = pageB.locator("#beton-dokum-tutanak_alt_baslik");
    await inputB.fill("Sekme B Notu");
    // Tab B çakışma şeridinde 'Bu Sekmedekiyle Devam Et' (takeover) seçerek yazma sahipliğini devralır
    const takeoverBtnB = pageB.locator('[data-testid="belge-draft-conflict-takeover"]');
    await expect(takeoverBtnB).toBeVisible({ timeout: 6000 });
    await takeoverBtnB.click();
    await pageB.waitForTimeout(1200);

    // Tab A'ya geri bak: storage / broadcast event tetiklenmiş olmalı ve conflict banner görünmeli
    const conflictBannerA = pageA.locator('[data-testid="belge-draft-conflict-banner"]');
    await expect(conflictBannerA).toBeVisible({ timeout: 6000 });

    // Tab A "Diğer Sekmedekini Yükle" der
    const reloadBtnA = pageA.locator('[data-testid="belge-draft-conflict-reload"]');
    await reloadBtnA.click();
    await expect(conflictBannerA).toHaveCount(0);

    // Tab A'daki input değeri B'nin yazdığı değer olmalı
    await expect(inputA).toHaveValue("Sekme B Notu");

    await pageA.close();
    await pageB.close();
  });

  test("2. İki sekmede Tab A'nın 'Bu Sekmedekiyle Devam Et' (takeover) seçimi", async ({ context }) => {
    const pageA = await context.newPage();
    await pageA.goto("/belgeler/beton-dokum-tutanagi");
    await pageA.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await pageA.reload();
    await pageA.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const pageB = await context.newPage();
    await pageB.goto("/belgeler/beton-dokum-tutanagi");
    await pageB.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Tab A kaydeder
    const inputA = pageA.locator("#beton-dokum-tutanak_alt_baslik");
    await inputA.fill("A İlk Metin");
    await pageA.locator('[data-testid="belge-draft-consent-device"]').click();
    await pageA.waitForTimeout(1200);

    // Tab B yazar ve devralır (takeover)
    const inputB = pageB.locator("#beton-dokum-tutanak_alt_baslik");
    await inputB.fill("B İkinci Metin");
    const takeoverBtnB = pageB.locator('[data-testid="belge-draft-conflict-takeover"]');
    await expect(takeoverBtnB).toBeVisible({ timeout: 6000 });
    await takeoverBtnB.click();
    await pageB.waitForTimeout(1200);

    // Tab A conflict alır
    const conflictBannerA = pageA.locator('[data-testid="belge-draft-conflict-banner"]');
    await expect(conflictBannerA).toBeVisible({ timeout: 6000 });

    // Tab A yerel formuyla devam etmeye karar verir (takeover)
    const takeoverBtn = pageA.locator('[data-testid="belge-draft-conflict-takeover"]');
    await takeoverBtn.click();
    await expect(conflictBannerA).toHaveCount(0);

    await pageA.waitForTimeout(1200);

    // Depodaki son kaydı doğrula: A'nın metni ve artırılmış revizyon olmalı
    const finalDraft = await pageA.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });
    expect(finalDraft).not.toBeNull();
    if (finalDraft) {
      const parsed = JSON.parse(finalDraft);
      expect(parsed.values.tutanak_alt_baslik).toBe("A İlk Metin");
      expect(parsed.revision).toBeGreaterThanOrEqual(3);
    }

    await pageA.close();
    await pageB.close();
  });

  test("3. Taslak silindikten sonra pagehide / ayrılma olayında silinen taslak dirilmemelidir", async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const input = page.locator("#beton-dokum-tutanak_alt_baslik");
    await input.fill("Geçici Taslak");
    await page.locator('[data-testid="belge-draft-consent-device"]').click();
    await page.waitForTimeout(1200);

    // Taslağı sil
    const badge = page.locator('[data-testid="belge-draft-status-badge"]');
    await badge.click();

    page.on("dialog", (dialog) => dialog.accept());
    await page.locator('[data-testid="belge-draft-delete-btn"]').click();
    await page.waitForTimeout(500);

    // Simüle pagehide
    await page.evaluate(() => {
      window.dispatchEvent(new Event("pagehide"));
    });
    await page.waitForTimeout(500);

    // Depoda hala null olmalı (dirilme yok)
    const stored = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });
    expect(stored).toBeNull();
  });

  test("4. Session modunda kaydedilen taslak diğer sekmeye veya localStorage'a sızmamalıdır", async ({ context }) => {
    const pageA = await context.newPage();
    await pageA.goto("/belgeler/beton-dokum-tutanagi");
    await pageA.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
    await pageA.reload();
    await pageA.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const inputA = pageA.locator("#beton-dokum-tutanak_alt_baslik");
    await inputA.fill("Yalnızca Bu Sekmede Notu");

    // 'Yalnız bu sekmede' tıkla
    await pageA.locator('[data-testid="belge-draft-consent-session"]').click();
    await pageA.waitForTimeout(1200);

    // localStorage boş olmalı
    const localDraft = await pageA.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:draft:device:v1:beton-dokum-tutanagi");
    });
    expect(localDraft).toBeNull();

    // sessionStorage dolu olmalı
    const sessionDraft = await pageA.evaluate(() => {
      return window.sessionStorage.getItem("belgeler:ux:draft:session:v1:beton-dokum-tutanagi");
    });
    expect(sessionDraft).not.toBeNull();

    // Yeni sekme Tab B aç
    const pageB = await context.newPage();
    await pageB.goto("/belgeler/beton-dokum-tutanagi");
    await pageB.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // Tab B'de sessionStorage boş olmalı ve restore banner çıkmamalı
    const sessionDraftB = await pageB.evaluate(() => {
      return window.sessionStorage.getItem("belgeler:ux:draft:session:v1:beton-dokum-tutanagi");
    });
    expect(sessionDraftB).toBeNull();
    await expect(pageB.locator('[data-testid="belge-draft-restore-banner"]')).toHaveCount(0);

    await pageA.close();
    await pageB.close();
  });
});
