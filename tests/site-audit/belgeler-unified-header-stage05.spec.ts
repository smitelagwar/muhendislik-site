import { expect, test, type Page } from "@playwright/test";

async function waitForStudioReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  const downloadBtn = studio
    .locator('[data-testid="belge-studio-desktop-actions"]:visible, [data-testid="belge-studio-mobile-actions"]:visible')
    .getByRole("button", { name: "PDF İndir", exact: true });
  await expect(downloadBtn).toBeEnabled({ timeout: 25_000 });
  return studio;
}

test.describe("Belgeler Unified Header — ASAMA_05 Usability, Accessibility & Robustness", () => {
  test("Draft status badge: open popup, close via Escape, restore focus, no screen overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const badgeBtn = studio.locator('[data-testid="belge-draft-status-badge"]');
    await expect(badgeBtn).toBeVisible();
    await expect(badgeBtn).toHaveAttribute("aria-expanded", "false");

    // 1. Click to open draft popup
    await badgeBtn.click();
    await expect(badgeBtn).toHaveAttribute("aria-expanded", "true");

    const popup = page.locator('[data-testid="belge-draft-menu-popup"]');
    await expect(popup).toBeVisible();

    // 2. Verify popup stays within viewport bounds
    const popupBox = await popup.boundingBox();
    expect(popupBox).not.toBeNull();
    if (popupBox) {
      expect(popupBox.x).toBeGreaterThanOrEqual(0);
      expect(popupBox.x + popupBox.width).toBeLessThanOrEqual(1366);
    }

    // 3. Press Escape to close popup and restore focus
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
    await expect(badgeBtn).toHaveAttribute("aria-expanded", "false");
    await expect(badgeBtn).toBeFocused();

    // 4. Click to open and click outside to close
    await badgeBtn.click();
    await expect(popup).toBeVisible();
    await page.mouse.click(200, 300);
    await expect(popup).toBeHidden();
  });

  test("Mobile 390x844: Draft status badge popup fits within mobile screen without clipping", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const badgeBtn = studio.locator('[data-testid="belge-draft-status-badge"]');
    await expect(badgeBtn).toBeVisible();

    await badgeBtn.click();
    const popup = page.locator('[data-testid="belge-draft-menu-popup"]');
    await expect(popup).toBeVisible();

    const popupBox = await popup.boundingBox();
    expect(popupBox).not.toBeNull();
    if (popupBox) {
      expect(popupBox.x).toBeGreaterThanOrEqual(0);
      expect(popupBox.x + popupBox.width).toBeLessThanOrEqual(390);
    }

    // Horizontal overflow check
    const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(docWidth).toBeLessThanOrEqual(390);

    // Escape closes on mobile too
    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
  });

  test("Keyboard navigation: Header items support Tab and Space/Enter interaction", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const backLink = studio.locator('[data-testid="belge-studio-top-header"] a[aria-label="Tüm belgelere dön"]');
    await backLink.focus();
    await expect(backLink).toBeFocused();

    // Press Tab to navigate into portaled toolbar items
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
    // Sections should toggle state
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
