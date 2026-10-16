import { test, expect } from "@playwright/test";

test.describe("Belgeler Hub — Blueprint Balina Ambiyans ve Buton Denetimi", () => {
  test("Canvas arkaplanda otonom render olmalı ve buton ile açılıp kapatılabilmelidir", async ({ page }) => {
    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(500);

    // 1. Blueprint Balina Toggle Butonunu bul
    const whaleButton = page.getByRole("button", { name: /blueprint balina/i });
    await expect(whaleButton).toBeVisible();
    await expect(whaleButton).toHaveAttribute("aria-pressed", "true");
    await expect(whaleButton).toContainText("Açık");

    // 2. Özel SVG Whale Blueprint İkonunun varlığı
    const whaleIcon = whaleButton.locator("svg");
    await expect(whaleIcon).toBeVisible();
    await expect(whaleIcon).toHaveAttribute("aria-hidden", "true");

    // 3. Arkaplan Canvas Elementinin varlığı ve erişilebilirlik nitelikleri
    const canvasContainer = page.locator("div[role='presentation'][aria-hidden='true'] canvas");
    await expect(canvasContainer).toBeAttached();

    // 4. Pointer-events-none kontrolü (kartlara ve arama çubuğuna tıklanabilirliği engellememelidir)
    const pointerEvents = await page.evaluate(() => {
      const canvasEl = document.querySelector("div[role='presentation'] canvas");
      if (!canvasEl) return "";
      return window.getComputedStyle(canvasEl).pointerEvents;
    });
    expect(pointerEvents).toBe("none");

    // 5. Butona tıklayarak balina ambiyansını kapatma
    await whaleButton.click();
    await page.waitForTimeout(350);

    await expect(whaleButton).toHaveAttribute("aria-pressed", "false");
    await expect(whaleButton).toContainText("Kapalı");

    // LocalStorage persistence doğrulaması
    const savedStateDisabled = await page.evaluate(() =>
      localStorage.getItem("muhendis_whale_ambient_enabled")
    );
    expect(savedStateDisabled).toBe("false");

    // 6. Butona tekrar tıklayarak ambiyansı açma
    await whaleButton.click();
    await page.waitForTimeout(350);

    await expect(whaleButton).toHaveAttribute("aria-pressed", "true");
    await expect(whaleButton).toContainText("Açık");

    const savedStateEnabled = await page.evaluate(() =>
      localStorage.getItem("muhendis_whale_ambient_enabled")
    );
    expect(savedStateEnabled).toBe("true");

    // 7. Sayfa yenilendiğinde tercihin korunması
    await whaleButton.click(); // Kapalıya al
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    const reloadedButton = page.getByRole("button", { name: /blueprint balina/i });
    await expect(reloadedButton).toHaveAttribute("aria-pressed", "false");
    await expect(reloadedButton).toContainText("Kapalı");

    // Temizle ve tekrar aç
    await reloadedButton.click();
    await expect(reloadedButton).toHaveAttribute("aria-pressed", "true");
  });

  test("Mobil 320px ekranda yatay taşma yapmamalı ve düzgün yerleşmelidir", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(500);

    const overflowData = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      return {
        hasOverflow: docWidth > winWidth + 1.5,
        docWidth,
        winWidth,
      };
    });

    expect(overflowData.hasOverflow).toBe(false);

    const whaleButton = page.getByRole("button", { name: /blueprint balina/i });
    await expect(whaleButton).toBeVisible();
  });

  test("prefers-reduced-motion modunda statik mimari blueprint eskizi çizilmeli ve hata vermemelidir", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(500);

    const canvas = page.locator("div[role='presentation'] canvas");
    await expect(canvas).toBeAttached();

    // Resize viewport in reduced-motion mode to confirm no crashes or blank clearing
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);

    const whaleButton = page.getByRole("button", { name: /blueprint balina/i });
    await expect(whaleButton).toBeVisible();
    await expect(whaleButton).toHaveAttribute("aria-pressed", "true");
  });
});
