import { expect, test } from "@playwright/test";
import { signInAdmin, uploadCadPreviewV2Fixture } from "./cad-test-helpers";

test.describe("CAD Preview V2 — Public LayerStore & Unified Layer Panel Suite", () => {
  test("Katman paneli açılır; kaynak on/off/frozen/locked/current durumları doğru gösterilir", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "layers-frozen-locked-zero");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Open layer panel via left rail button
    const layerBtn = page.locator('[data-testid="cad-tool-layers"]').first();
    await expect(layerBtn).toBeEnabled();
    await layerBtn.click();

    const panel = page.locator('[data-testid="cad-layer-panel"]').first();
    await expect(panel).toBeVisible();

    // Verify 5 layers exist in DOM
    const rows = page.locator('[data-testid^="cad-layer-row-"]');
    expect(await rows.count()).toBe(5);

    // Verify Layer 0 is current and visible
    const row0 = page.locator('[data-testid="cad-layer-row-0"]').first();
    await expect(row0).toHaveAttribute("data-visible", "true");
    await expect(row0.getByText("Aktif")).toBeVisible();

    // Verify SOURCE_OFF is not visible
    const rowOff = page.locator('[data-testid="cad-layer-row-SOURCE_OFF"]').first();
    await expect(rowOff).toHaveAttribute("data-visible", "false");

    // Verify FROZEN_LAYER is frozen and not visible
    const rowFrozen = page.locator('[data-testid="cad-layer-row-FROZEN_LAYER"]').first();
    await expect(rowFrozen).toHaveAttribute("data-visible", "false");
    await expect(rowFrozen.locator('svg[title="Donmuş (Frozen) Katman"], [title*="Frozen"]')).toBeVisible();

    // Verify LOCKED_LAYER has lock icon
    const rowLocked = page.locator('[data-testid="cad-layer-row-LOCKED_LAYER"]').first();
    await expect(rowLocked.locator('svg[title="Kilitli (Locked) Katman"], [title*="Locked"]')).toBeVisible();
  });

  test("Katman etkileşimleri: Tekil aç/kapa, Tümünü aç, Tümünü kapat, İzole et ve Kaynağa Dön", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "layers-frozen-locked-zero");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    await page.locator('[data-testid="cad-tool-layers"]').first().click();
    const panel = page.locator('[data-testid="cad-layer-panel"]').first();
    await expect(panel).toBeVisible();

    // 1. Toggle single layer (ACTIVE_VISIBLE -> hide)
    const toggleActive = page.locator('[data-testid="cad-layer-toggle-ACTIVE_VISIBLE"]').first();
    await toggleActive.click();
    const rowActive = page.locator('[data-testid="cad-layer-row-ACTIVE_VISIBLE"]').first();
    await expect(rowActive).toHaveAttribute("data-visible", "false");

    // 2. Tümünü Aç (Show All)
    const showAllBtn = page.locator('[data-testid="cad-layer-show-all"]').first();
    await showAllBtn.click();
    await expect(rowActive).toHaveAttribute("data-visible", "true");
    const rowOff = page.locator('[data-testid="cad-layer-row-SOURCE_OFF"]').first();
    await expect(rowOff).toHaveAttribute("data-visible", "true");

    // 3. Tümünü Kapat (Hide all except current)
    const hideAllBtn = page.locator('[data-testid="cad-layer-hide-all"]').first();
    await hideAllBtn.click();
    await expect(page.locator('[data-testid="cad-layer-row-0"]').first()).toHaveAttribute("data-visible", "true");
    await expect(rowActive).toHaveAttribute("data-visible", "false");

    // 4. İzole et (Isolate ACTIVE_VISIBLE)
    const isolateActive = page.locator('[data-testid="cad-layer-isolate-ACTIVE_VISIBLE"]').first();
    await isolateActive.click();
    await expect(rowActive).toHaveAttribute("data-visible", "true");
    await expect(rowOff).toHaveAttribute("data-visible", "false");

    // 5. Kaynağa Dön (Reset to Source snapshot)
    const resetBtn = page.locator('[data-testid="cad-layer-reset-source"]').first();
    await resetBtn.click();
    await expect(page.locator('[data-testid="cad-layer-row-0"]').first()).toHaveAttribute("data-visible", "true");
    await expect(page.locator('[data-testid="cad-layer-row-ACTIVE_VISIBLE"]').first()).toHaveAttribute("data-visible", "true");
    await expect(page.locator('[data-testid="cad-layer-row-SOURCE_OFF"]').first()).toHaveAttribute("data-visible", "false");
    await expect(page.locator('[data-testid="cad-layer-row-FROZEN_LAYER"]').first()).toHaveAttribute("data-visible", "false");
  });

  test("Katman arama ve filtreleme çalışır (Türkçe karakter desteği)", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "layers-frozen-locked-zero");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    await page.locator('[data-testid="cad-tool-layers"]').first().click();
    const searchInput = page.locator('[data-testid="cad-layer-search-input"]').first();

    // Search "FROZEN"
    await searchInput.fill("FROZEN");
    const visibleRows = page.locator('[data-testid^="cad-layer-row-"]');
    expect(await visibleRows.count()).toBe(1);
    await expect(page.locator('[data-testid="cad-layer-row-FROZEN_LAYER"]')).toBeVisible();

    // Clear search
    await searchInput.fill("");
    expect(await visibleRows.count()).toBe(5);
  });

  test("Escape tuşu veya kapat butonu ile katman paneli temiz biçimde kapatılır", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "layers-frozen-locked-zero");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    await page.locator('[data-testid="cad-tool-layers"]').first().click();
    const panel = page.locator('[data-testid="cad-layer-panel"]').first();
    await expect(panel).toBeVisible();

    // Press Escape to close
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();

    // Reopen and close via X button
    await page.locator('[data-testid="cad-tool-layers"]').first().click();
    await expect(panel).toBeVisible();
    await page.locator('[data-testid="cad-layer-close-button"]').first().click();
    await expect(panel).toBeHidden();
  });
});
