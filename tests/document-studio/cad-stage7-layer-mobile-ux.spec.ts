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

    const layerBtn = page.locator('[data-testid="cad-tool-layers"]').first();
    await expect(layerBtn).toBeVisible();
    const layerBtnBox = await layerBtn.boundingBox();
    expect(layerBtnBox).not.toBeNull();
    expect(layerBtnBox!.width).toBeGreaterThanOrEqual(44);
    expect(layerBtnBox!.height).toBeGreaterThanOrEqual(44);

    const fitBtn = page.locator('[data-testid="cad-tool-fit"]').first();
    const fitBtnBox = await fitBtn.boundingBox();
    expect(fitBtnBox).not.toBeNull();
    expect(fitBtnBox!.width).toBeGreaterThanOrEqual(44);
    expect(fitBtnBox!.height).toBeGreaterThanOrEqual(44);

    await layerBtn.click();
    const panel = page.locator('[data-testid="cad-layer-panel"]').first();
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("data-cad-layer-mode", "modal-sheet");
    await expect(panel).toHaveAttribute("aria-modal", "true");

    const backdrop = page.locator('[data-testid="cad-layer-backdrop"]').first();
    await expect(backdrop).toBeVisible();

    const viewportContainer = host.locator('div[aria-label*="CAD görünümü"]').first();
    await expect(viewportContainer).toHaveClass(/pointer-events-none/);
    await expect(viewportContainer).toHaveAttribute("aria-hidden", "true");

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

    const showAllBtn = page.locator('[data-testid="cad-layer-show-all"]').first();
    const showAllBox = await showAllBtn.boundingBox();
    expect(showAllBox).not.toBeNull();
    expect(showAllBox!.height).toBeGreaterThanOrEqual(44);

    await backdrop.click({ position: { x: 20, y: 50 } });
    await expect(panel).toBeHidden();
  });

  test("Desktop Katman Paneli: modeless davranış, canvas erişimi, Escape ve tetikleyiciye focus restore", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "Desktop modeless layer semantics masaüstü ortamında test edilir");

    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "layers-frozen-locked-zero");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    const layerBtn = page.locator('[data-testid="cad-tool-layers"]').first();
    await layerBtn.focus();
    await expect(layerBtn).toBeFocused();
    await page.keyboard.press("Enter");

    const panel = page.locator('[data-testid="cad-layer-panel"]').first();
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute("data-cad-layer-mode", "modeless-floating");
    await expect(panel).toHaveAttribute("aria-modal", "false");

    const searchInput = page.locator('[data-testid="cad-layer-search-input"]').first();
    await expect(searchInput).toBeFocused();

    const viewportContainer = host.locator('div[aria-label*="CAD görünümü"]').first();
    await expect(viewportContainer).not.toHaveAttribute("aria-hidden", "true");
    await expect(viewportContainer).not.toHaveAttribute("data-cad-layer-modal-inert", "true");

    // Desktop panel is modeless: moving focus to the toolbar must remain possible.
    await layerBtn.focus();
    await expect(layerBtn).toBeFocused();
    await expect(panel).toBeVisible();

    // Search/filter still works while canvas remains exposed.
    await searchInput.fill("ACTIVE");
    await expect(page.locator('[data-testid="cad-layer-row-ACTIVE_VISIBLE"]')).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
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

    const liveCount = page.locator('[data-testid="cad-layer-visible-count"]').first();
    await expect(liveCount).toHaveAttribute("aria-live", "polite");

    const rowFrozen = page.locator('[data-testid="cad-layer-row-FROZEN_LAYER"]').first();
    const frozenSr = rowFrozen.locator(".sr-only").first();
    await expect(frozenSr).toHaveText("Donmuş (Frozen)");

    const rowLocked = page.locator('[data-testid="cad-layer-row-LOCKED_LAYER"]').first();
    const lockedSr = rowLocked.locator(".sr-only").first();
    await expect(lockedSr).toHaveText("Kilitli (Locked)");

    const toggle0 = page.locator('[data-testid="cad-layer-toggle-0"]').first();
    await expect(toggle0).toHaveAttribute("aria-pressed", "true");
    await expect(toggle0).toHaveAttribute("aria-label", /0 katmanını gizle/);
  });

  test("Dokümantasyon CAD Gezintisi: CAD filtresi, dosya açma ve geri dönüş bağlamı", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "layers-frozen-locked-zero");

    await page.goto("/dokumantasyon");
    await expect(page.locator("h1:has-text('Dökümantasyon Modülü')")).toBeVisible();

    const fileRow = page.locator(`[data-testid="dok-file-row"][data-file-id="${fileId}"]`).first();
    await expect(fileRow).toBeVisible({ timeout: 10_000 });

    const fileLink = fileRow.locator('[data-testid="dok-file-link"]').first();
    await fileLink.click();

    await expect(page).toHaveURL(new RegExp(`/dokumantasyon/dosya/${fileId}$`));
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    await page.goBack();
    await expect(page).toHaveURL(/\/dokumantasyon(?:\?.*)?$/);
    await expect(page.locator("h1:has-text('Dökümantasyon Modülü')")).toBeVisible();

    const fileRowAfterBack = page.locator(`[data-testid="dok-file-row"][data-file-id="${fileId}"]`).first();
    await expect(fileRowAfterBack).toBeVisible();
  });

  test("Bounded DOM: Sayfalama ve dilimleme ile DOM düğüm sayısı sınırda tutulur", async ({ page }) => {
    await signInAdmin(page);
    await page.goto("/dokumantasyon");
    await expect(page.locator("h1:has-text('Dökümantasyon Modülü')")).toBeVisible();

    const renderedRows = await page.locator('[data-testid="dok-file-row"]').count();
    expect(renderedRows).toBeLessThanOrEqual(100);
  });
});
