import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("Stage 3 — Non-critical CAD UI & Export Code Splitting", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (err) => console.log(`[PAGE ERROR]: ${err.message}\n${err.stack}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[PAGE CONSOLE ERROR]: ${msg.text()}`);
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Initial CAD viewer reaches ready state with canvas rendered before secondary panel interaction", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 60_000 });

    const host = runtime.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
      timeout: 60_000,
    });

    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Ribbon toolbar controls must remain visible and accessible
    const layerBtn = page.locator('[data-testid="cad-tool-layers"]');
    const snapBtn = page.locator('[data-testid="cad-tool-snap-settings"]');
    await expect(layerBtn).toBeVisible();
    await expect(snapBtn).toBeVisible();

    // Secondary panel components should not be in DOM initially before being triggered
    await expect(page.locator('[data-testid="cad-layer-panel"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="cad-snap-settings-panel"]')).toHaveCount(0);
    await expect(page.locator('[data-cad-export-dialog="true"]')).toHaveCount(0);
  });

  test("2. Dynamically loads CadLayerPanel on interaction without state loss or canvas crash", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
      timeout: 60_000,
    });

    // Open Layer Panel
    const layerBtn = page.locator('[data-testid="cad-tool-layers"]');
    await layerBtn.click();

    // Verify layer panel loaded and rendered
    const layerPanel = page.locator('[data-testid="cad-layer-panel"]');
    await expect(layerPanel).toBeVisible({ timeout: 10_000 });

    // Layer count indicator inside panel is rendered
    const visibleCount = page.locator('[data-testid="cad-layer-visible-count"]');
    await expect(visibleCount).toBeVisible();

    // Toggle layer panel off
    await layerBtn.click();
    await expect(layerPanel).toHaveCount(0);

    // Canvas must remain alive and responsive
    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible();
  });

  test("3. Dynamically loads CadSnapSettingsPanel on interaction", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
      timeout: 60_000,
    });

    // Open Snap settings
    const snapBtn = page.locator('[data-testid="cad-tool-snap-settings"]');
    await snapBtn.click();

    const snapPanel = page.locator('[data-testid="cad-snap-settings-panel"]');
    await expect(snapPanel).toBeVisible({ timeout: 10_000 });

    // Close Snap settings
    await snapBtn.click();
    await expect(snapPanel).toHaveCount(0);
  });

  test("4. Dynamically loads CadReviewSidePanel (Search / Comments)", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
      timeout: 60_000,
    });

    // Open Search panel tab
    const searchBtn = page.locator('[data-testid="cad-tool-search-panel"]');
    await searchBtn.click();

    const reviewPanel = page.locator('[data-cad-review-panel="true"]');
    await expect(reviewPanel).toBeVisible({ timeout: 10_000 });

    // Switch to comments tab
    const commentsBtn = page.locator('[data-testid="cad-tool-comments-panel"]');
    await commentsBtn.click();
    await expect(reviewPanel).toBeVisible();

    // Close side panel
    await commentsBtn.click();
    await expect(reviewPanel).toHaveCount(0);
  });

  test("5. Dynamically loads CadExportDialog on demand", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
      timeout: 60_000,
    });

    // Open export dropdown in ribbon
    const downloadDropdown = page.locator('[data-testid="cad-tool-download-dropdown"]');
    await downloadDropdown.click();

    // Click Export Dialog option
    const openExportOption = page.locator('[data-testid="cad-open-export-dialog"]');
    await expect(openExportOption).toBeVisible({ timeout: 5_000 });
    await openExportOption.click();

    // Verify dynamic Export Dialog renders
    const exportDialog = page.locator('[data-cad-export-dialog="true"]');
    await expect(exportDialog).toBeVisible({ timeout: 10_000 });

    // Close dialog
    const closeBtn = exportDialog.locator('button[aria-label="Kapat"]');
    await closeBtn.click();
    await expect(exportDialog).toHaveCount(0);
  });
});
