import { expect, test } from "@playwright/test";
import {
  cleanupUploadedCadFixtures,
  signInAdmin,
  uploadCadPreviewV2Fixture,
} from "./cad-test-helpers";

test.describe("CAD Preview V2 — Arka Plan Rengi Popover ve Görünüm Sözleşmesi", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("Arka Plan Rengi popover'ı açılır, AutoCAD/Siyah/Beyaz seçenekleri arka plan attribute'unu günceller, Escape ile kapanır", async ({
    page,
    isMobile,
  }) => {
    test.setTimeout(90_000);
    test.skip(Boolean(isMobile), "Desktop ribbon testi yalnızca desktop ortamında çalışır");

    await page.setViewportSize({ width: 1280, height: 720 });
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    // Viewer host'u DOM'a çıktığında (loading state dahil) hazır
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toBeVisible({ timeout: 30_000 });

    // Ribbon'ın yüklendiğini bekle (viewer ready olmasa bile ribbon DOM'da olmalı)
    const ribbon = page.locator('[data-testid="cad-studio-ribbon"]').first();
    await expect(ribbon).toBeVisible({ timeout: 30_000 });

    // 1. Initial background attribute is autocad
    await expect(host).toHaveAttribute("data-cad-background-color", "autocad");

    // 2. Click background button in ribbon -> popover opens
    const bgTrigger = page.locator('[data-testid="cad-tool-view-settings"]').first();
    await expect(bgTrigger).toBeVisible();
    await bgTrigger.click();

    const popoverContent = page.locator('[data-cad-tool-popover="true"]').first();
    await expect(popoverContent).toBeVisible();

    // 3. Select Black
    const bgBlackOption = page.locator('[data-testid="cad-bg-black"]').first();
    await expect(bgBlackOption).toBeVisible();
    await bgBlackOption.click();

    await expect(popoverContent).toBeHidden();
    await expect(host).toHaveAttribute("data-cad-background-color", "black");

    // 4. Open popover again and select White
    await bgTrigger.click();
    await expect(popoverContent).toBeVisible();

    const bgWhiteOption = page.locator('[data-testid="cad-bg-white"]').first();
    await expect(bgWhiteOption).toBeVisible();
    await bgWhiteOption.click();

    await expect(popoverContent).toBeHidden();
    await expect(host).toHaveAttribute("data-cad-background-color", "white");

    // 5. Open popover again and select AutoCAD
    await bgTrigger.click();
    await expect(popoverContent).toBeVisible();

    const bgAutoCadOption = page.locator('[data-testid="cad-bg-autocad"]').first();
    await expect(bgAutoCadOption).toBeVisible();
    await bgAutoCadOption.click();

    await expect(popoverContent).toBeHidden();
    await expect(host).toHaveAttribute("data-cad-background-color", "autocad");

    // 6. Escape closes the opened popover without altering background
    await bgTrigger.click();
    await expect(popoverContent).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popoverContent).toBeHidden();
    await expect(host).toHaveAttribute("data-cad-background-color", "autocad");

    // 7. Dış tıklama (ribbon dışına) popovert kapatır
    await bgTrigger.click();
    await expect(popoverContent).toBeVisible();
    // Ribbon dışı bir alana tıkla
    await page.mouse.click(640, 650);
    await expect(popoverContent).toBeHidden();
  });
});
