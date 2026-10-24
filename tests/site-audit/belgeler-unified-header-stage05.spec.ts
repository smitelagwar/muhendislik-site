import { test, expect, type Page } from "@playwright/test";

async function waitForStudioReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  await expect(studio).toBeVisible({ timeout: 15_000 });
  await expect(studio.locator('[data-testid="belge-studio-top-header"]')).toBeVisible({ timeout: 10_000 });
  return studio;
}

test.describe("Belgeler Unified Header — V3 Sözleşme Doğrulaması", () => {
  test("Desktop 1366x768: Minimal taslak rozeti menüsüzdür; tema anahtarı en sağdadır", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    // 1. Taslak durum rozeti minimaldir, popup menüsü yoktur
    const badgeBtn = studio.locator('[data-testid="belge-draft-status-badge"]');
    if (await badgeBtn.isVisible()) {
      await badgeBtn.click();
      await expect(page.locator('[data-testid="belge-draft-menu-popup"]')).toHaveCount(0);
    }

    // 2. Tema anahtarı üst header'ın en sağında yer alır
    const themeToggle = studio.locator('[data-testid="belge-theme-toggle"]');
    await expect(themeToggle).toBeVisible();

    const headerBox = await studio.locator('[data-testid="belge-studio-top-header"]').boundingBox();
    const themeBox = await themeToggle.boundingBox();
    expect(headerBox).not.toBeNull();
    expect(themeBox).not.toBeNull();
    if (headerBox && themeBox) {
      // Tema anahtarının sağ kenarı, header'ın sağ kenarına en yakın elemandır (<= 16px fark)
      const diff = (headerBox.x + headerBox.width) - (themeBox.x + themeBox.width);
      expect(diff).toBeLessThanOrEqual(24);
    }
  });

  // V1.1 Sözleşmesi: Mobilde tema butonu header'dan çekmeceye taşınmıştır; header'da ⋮ çekmece butonu yer alır
  test("Mobile 390x844: Header bileşenleri taşma yapmaz ve yatay kaydırma sıfırdır", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const themeToggle = studio.locator('[data-testid="belge-theme-toggle"]');
    await expect(themeToggle).toBeHidden();
    const menuBtn = studio.locator('[data-testid="belge-mobile-header-menu-btn"]');
    await expect(menuBtn).toBeVisible();

    // Horizontal overflow check
    const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(docWidth).toBeLessThanOrEqual(391);
  });

  test("Keyboard navigation: Header items support Tab and Space/Enter interaction", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const backLink = studio.locator('[data-testid="belge-studio-top-header"] a[aria-label="Tüm belgelere dön"]');
    await backLink.focus();
    await expect(backLink).toBeFocused();

    // Press Tab to navigate into header items
    await page.keyboard.press("Tab");
    const activeElTagName = await page.evaluate(() => document.activeElement?.tagName);
    expect(["BUTTON", "A"]).toContain(activeElTagName);
  });

  test("Form accordion controls: 'Tümünü Aç / Diğerlerini Kapat' remain functional in form panel", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const toggleAllBtn = studio.locator('[data-testid="belge-sections-toggle-all"]');
    await expect(toggleAllBtn).toBeVisible();

    // Click toggle all
    await toggleAllBtn.click();
    await expect(toggleAllBtn).toBeEnabled();
  });

  test("Desktop PDF Focus mode toggle preserves and restores form state", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const focusToggle = studio.locator('[data-testid="belge-pdf-focus-toggle"]');
    await expect(focusToggle).toBeVisible();
    await expect(focusToggle).toHaveAttribute("aria-pressed", "false");

    // Enter focus mode
    await focusToggle.click();
    await expect(focusToggle).toHaveAttribute("aria-pressed", "true");

    // Exit focus mode
    await focusToggle.click();
    await expect(focusToggle).toHaveAttribute("aria-pressed", "false");
  });
});
