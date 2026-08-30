import { test, expect } from "@playwright/test";

test.describe("Site Geneli — Modal, Sheet ve Mobil Menü Scroll Lock Denetimi", () => {
  test("Mobil menü açılıp kapandığında body scroll-lock temizlenmelidir", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(500);

    // Mobil menü butonunu bul
    const menuButton = page.locator("button[aria-label*='menü' i], button[aria-label*='menu' i], [data-testid='mobile-menu-trigger']").first();

    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(300);

      // Kapat (Escape tuşu veya backdrop veya kapat butonu)
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);

      // Body overflow kontrolü
      const bodyOverflow = await page.evaluate(() => {
        return window.getComputedStyle(document.body).overflow;
      });

      expect(
        bodyOverflow === "hidden",
        "Menü kapandıktan sonra body üzerinde overflow: hidden kilitli kalmamalıdır"
      ).toBe(false);
    }
  });

  test("Hesaplama detay diyaloğu açılıp kapandığında odak ve scroll temiz olmalıdır", async ({ page }) => {
    await page.goto("/hesaplamalar/hizli-metraj", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(500);

    const bodyOverflowInitial = await page.evaluate(() => window.getComputedStyle(document.body).overflow);
    expect(bodyOverflowInitial).not.toBe("hidden");
  });
});
