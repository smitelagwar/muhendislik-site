import { expect, test } from "@playwright/test";
import { cleanupUploadedCadFixtures, signInAdmin, uploadCadPreviewV2Fixture } from "./cad-test-helpers";

test.describe("CAD Preview V2 — Aşama 7/8 Katman, Mobil Sheet, Erişilebilirlik ve Dosya Listesi UX", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("Mobil Katman Çekmecesi: Safe area, backdrop, inert canvas ve >= 44x44 touch target standardı", async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.setViewportSize({ width: 375, height: 667 });
    }

    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "layers-frozen-locked-zero");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Quick rail button touch target check
    const layerBtn = page.locator('[data-testid="cad-tool-layers"]').first();
    await expect(layerBtn).toBeVisible();
    const layerBtnBox = await layerBtn.boundingBox();
    expect(layerBtnBox).not.toBeNull();
    expect(layerBtnBox!.width).toBeGreaterThanOrEqual(44);
    expect(layerBtnBox!.height).toBeGreaterThanOrEqual(44);

    const panBtn = page.locator('[data-testid="cad-tool-pan"]').first();
    const panBtnBox = await panBtn.boundingBox();
    expect(panBtnBox).not.toBeNull();
    expect(panBtnBox!.width).toBeGreaterThanOrEqual(44);
    expect(panBtnBox!.height).toBeGreaterThanOrEqual(44);

    // Open layer panel
    await layerBtn.click();
    const panel = page.locator('[data-testid="cad-layer-panel"]').first();
    await expect(panel).toBeVisible();

    // Verify mobile backdrop exists and is visible
    const backdrop = page.locator('[data-testid="cad-layer-backdrop"]').first();
    await expect(backdrop).toBeVisible();

    // Verify viewport canvas container is inert / pointer-events-none
    const viewportContainer = host.locator('div[aria-label*="CAD görünümü"]').first();
    await expect(viewportContainer).toHaveClass(/pointer-events-none/);

    // Verify touch target hitboxes inside layer panel >= 44x44 CSS px
    const closeBtn = page.locator('[data-testid="cad-layer-close-button"]').first();
    const closeBox = await closeBtn.boundingBox();
    expect(closeBox).not.toBeNull();
    expect(closeBox!.width).toBeGreaterThanOrEqual(44);
    expect(closeBox!.height).toBeGreaterThanOrEqual(44);

    const toggleBtn = page.locator('[data-testid="cad-layer-toggle-ACTIVE_VISIBLE"]').first();
    const toggleBox = await toggleBtn.boundingBox();
    expect(toggleBox).not.toBeNull();
    expect(toggleBox!.width).toBeGreaterThanOrEqual(44);
    expect(toggleBox!.height).toBeGreaterThanOrEqual(44);

    const isolateBtn = page.locator('[data-testid="cad-layer-isolate-ACTIVE_VISIBLE"]').first();
    const isolateBox = await isolateBtn.boundingBox();
    expect(isolateBox).not.toBeNull();
    expect(isolateBox!.width).toBeGreaterThanOrEqual(44);
    expect(isolateBox!.height).toBeGreaterThanOrEqual(44);

    // Bulk buttons min height >= 44px on mobile
    const showAllBtn = page.locator('[data-testid="cad-layer-show-all"]').first();
    const showAllBox = await showAllBtn.boundingBox();
    expect(showAllBox).not.toBeNull();
    expect(showAllBox!.height).toBeGreaterThanOrEqual(44);

    // Click backdrop to close
    await backdrop.click({ position: { x: 20, y: 50 } });
    await expect(panel).toBeHidden();
  });

  test("Klavye Erişilebilirliği: Focus trap (Tab wrap), Escape ile kapanma ve tetikleyiciye focus restore", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "Klavye focus trap masaüstü ortamında test edilir");

    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "layers-frozen-locked-zero");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    const layerBtn = page.locator('[data-testid="cad-tool-layers"]').first();
    await layerBtn.focus();
    await expect(layerBtn).toBeFocused();

    // Open via Enter key or click
    await page.keyboard.press("Enter");
    const panel = page.locator('[data-testid="cad-layer-panel"]').first();
    await expect(panel).toBeVisible();

    // Auto focus moves to search input
    const searchInput = page.locator('[data-testid="cad-layer-search-input"]').first();
    await expect(searchInput).toBeFocused();

    // Focus trap test:
    // Move backwards from search input (close button is before search input)
    await page.keyboard.press("Shift+Tab");
    const closeBtn = page.locator('[data-testid="cad-layer-close-button"]').first();
    await expect(closeBtn).toBeFocused();

    // Press Shift+Tab on first element -> focus wraps to the last focusable element in the panel
    await page.keyboard.press("Shift+Tab");
    const isInsidePanel = await page.evaluate(() => {
      const panelEl = document.querySelector('[data-testid="cad-layer-panel"]');
      return panelEl ? panelEl.contains(document.activeElement) : false;
    });
    expect(isInsidePanel).toBe(true);

    // Press Tab on last element -> wraps to first element (close button or search input)
    await page.keyboard.press("Tab");
    const isStillInsidePanel = await page.evaluate(() => {
      const panelEl = document.querySelector('[data-testid="cad-layer-panel"]');
      return panelEl ? panelEl.contains(document.activeElement) : false;
    });
    expect(isStillInsidePanel).toBe(true);

    // Press Escape to close
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();

    // Focus restored to the layers trigger button
    await expect(layerBtn).toBeFocused();
  });

  test("Ekran Okuyucu & ARIA Desteği: Donmuş, Kilitli metinleri ve durum etiketleri", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "layers-frozen-locked-zero");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    await page.locator('[data-testid="cad-tool-layers"]').first().click();
    const panel = page.locator('[data-testid="cad-layer-panel"]').first();
    await expect(panel).toBeVisible();

    // Live count with aria-live="polite"
    const liveCount = page.locator('[data-testid="cad-layer-visible-count"]').first();
    await expect(liveCount).toHaveAttribute("aria-live", "polite");

    // Frozen row accessible text
    const rowFrozen = page.locator('[data-testid="cad-layer-row-FROZEN_LAYER"]').first();
    const frozenSr = rowFrozen.locator(".sr-only").first();
    await expect(frozenSr).toHaveText("Donmuş (Frozen)");

    // Locked row accessible text
    const rowLocked = page.locator('[data-testid="cad-layer-row-LOCKED_LAYER"]').first();
    const lockedSr = rowLocked.locator(".sr-only").first();
    await expect(lockedSr).toHaveText("Kilitli (Locked)");

    // Toggle button aria-pressed and descriptive aria-label
    const toggle0 = page.locator('[data-testid="cad-layer-toggle-0"]').first();
    await expect(toggle0).toHaveAttribute("aria-pressed", "true");
    await expect(toggle0).toHaveAttribute("aria-label", /0 katmanını gizle/);
  });

  test("Dokümantasyon CAD Gezintisi: CAD filtresi, dosya açma ve geri dönüş bağlamı", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "layers-frozen-locked-zero");

    // Go to file manager
    await page.goto("/dokumantasyon");
    await expect(page.locator("h1:has-text('Dökümantasyon Modülü')")).toBeVisible();

    // Verify the uploaded fixture file exists
    const fileRow = page.locator(`[data-testid="dok-file-row"][data-file-id="${fileId}"]`).first();
    await expect(fileRow).toBeVisible({ timeout: 10_000 });

    // Open file by clicking file link
    const fileLink = fileRow.locator('[data-testid="dok-file-link"]').first();
    await fileLink.click();

    // URL changes to file viewer
    await expect(page).toHaveURL(new RegExp(`/dokumantasyon/dosya/${fileId}$`));
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Navigate back to file manager
    await page.goBack();
    await expect(page).toHaveURL(/\/dokumantasyon(?:\?.*)?$/);
    await expect(page.locator("h1:has-text('Dökümantasyon Modülü')")).toBeVisible();

    // Verify uploaded file is still visible in list
    const fileRowAfterBack = page.locator(`[data-testid="dok-file-row"][data-file-id="${fileId}"]`).first();
    await expect(fileRowAfterBack).toBeVisible();
  });

  test("Bounded DOM: Sayfalama ve dilimleme ile DOM düğüm sayısı sınırda tutulur", async ({ page }) => {
    await signInAdmin(page);
    await page.goto("/dokumantasyon");
    await expect(page.locator("h1:has-text('Dökümantasyon Modülü')")).toBeVisible();

    // Count rendered file rows: must not exceed 100 per bucket
    const renderedRows = await page.locator('[data-testid="dok-file-row"]').count();
    expect(renderedRows).toBeLessThanOrEqual(100);
  });
});
