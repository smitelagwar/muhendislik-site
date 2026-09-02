import { expect, test } from "@playwright/test";
import {
  cleanupUploadedCadFixtures,
  signInAdmin,
  uploadCadPreviewV2Fixture,
} from "./cad-test-helpers";

test.describe("CAD Preview V2 — Toolbar Button Contract & Side Effects", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("Toolbar üzerindeki tüm butonlar gerçek ve kanıtlanabilir side-effect üretir (Gezinme, Görünüm, Ölçüm, İşaretleme, Paneller, Dışa Aktarma)", async ({
    page,
    isMobile,
  }) => {
    test.setTimeout(90_000);
    test.skip(Boolean(isMobile), "Desktop ribbon button contract testi yalnızca desktop ortamında çalışır");

    await page.setViewportSize({ width: 1280, height: 720 });
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    // Viewer host ve ribbon DOM'a çıktığında test başlar (viewer ready olması gerekmez)
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toBeVisible({ timeout: 30_000 });

    const ribbon = page.locator('[data-testid="cad-studio-ribbon"]').first();
    await expect(ribbon).toBeVisible({ timeout: 30_000 });

    // ── 1. GEZİNME GRUBU ───────────────────────────────────────────────────
    const selectBtn = page.locator('[data-testid="cad-tool-select"]').first();
    const panBtn = page.locator('[data-testid="cad-tool-pan"]').first();
    const fitBtn = page.locator('[data-testid="cad-tool-fit"]').first();

    // Select button activates selection mode
    await selectBtn.click();
    await expect(selectBtn).toHaveAttribute("aria-pressed", "true");
    await expect(panBtn).toHaveAttribute("aria-pressed", "false");

    // Pan button activates pan mode
    await panBtn.click();
    await expect(panBtn).toHaveAttribute("aria-pressed", "true");
    await expect(selectBtn).toHaveAttribute("aria-pressed", "false");

    // Fit view button is visible
    await expect(fitBtn).toBeVisible();
    await fitBtn.click();
    await page.waitForTimeout(300);

    // ── 2. GÖRÜNÜM GRUBU ────────────────────────────────────────────────────
    const monoBtn = page.locator('[data-testid="cad-display-monochrome"]').first();
    const sourceBtn = page.locator('[data-testid="cad-display-source"]').first();
    const lwBtn = page.locator('[data-testid="cad-display-lineweight"]').first();

    // Monochrome mode
    await monoBtn.click();
    await expect(host).toHaveAttribute("data-cad-color-mode", "monochrome");
    await expect(monoBtn).toHaveAttribute("aria-pressed", "true");

    // Real / Source colors mode
    await sourceBtn.click();
    await expect(host).toHaveAttribute("data-cad-color-mode", "source");
    await expect(sourceBtn).toHaveAttribute("aria-pressed", "true");

    // Lineweight toggle
    const initialLw = (await host.getAttribute("data-cad-lineweight")) === "on";
    await lwBtn.click();
    await expect(host).toHaveAttribute("data-cad-lineweight", initialLw ? "off" : "on");
    await lwBtn.click();
    await expect(host).toHaveAttribute("data-cad-lineweight", initialLw ? "on" : "off");

    // ── 3. ÖLÇÜM GRUBU ─────────────────────────────────────────────────────
    const distBtn = page.locator('[data-testid="cad-tool-distance"]').first();
    const chainBtn = page.locator('[data-testid="cad-tool-chain-distance"]').first();
    const areaBtn = page.locator('[data-testid="cad-tool-area"]').first();
    const measureListBtn = page.locator('[data-testid="cad-tool-measurements-panel"]').first();
    const measureSettingsBtn = page.locator('[data-testid="cad-tool-measure-settings"]').first();
    const clearMeasureBtn = page.locator('[data-testid="cad-tool-clear"]').first();

    // Distance tool: activate and toggle off
    await distBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "distance");
    await expect(distBtn).toHaveAttribute("aria-pressed", "true");
    await distBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");

    // Chain distance tool: activate and toggle off
    await chainBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "chain_distance");
    await expect(chainBtn).toHaveAttribute("aria-pressed", "true");
    await chainBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");

    // Area tool: activate and toggle off
    await areaBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "area");
    await expect(areaBtn).toHaveAttribute("aria-pressed", "true");
    await areaBtn.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "none");

    // Measurements side panel toggle
    const sidePanel = page.locator('[data-testid="cad-review-side-panel"]').first();
    await measureListBtn.click();
    await expect(sidePanel).toBeVisible();
    await expect(page.locator('[data-testid="cad-measurements-tab"]').first()).toBeVisible();
    await measureListBtn.click();
    await expect(sidePanel).toBeHidden();

    // Unit & precision settings popover
    await measureSettingsBtn.click();
    const unitPopover = page.locator('[data-cad-tool-popover="true"]').first();
    await expect(unitPopover).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(unitPopover).toBeHidden();

    // Clear measurements button visible
    await expect(clearMeasureBtn).toBeVisible();
    await clearMeasureBtn.click();

    // ── 4. İŞARETLEME (MARKUP) GRUBU ───────────────────────────────────────
    // Pin tool & style caret
    const pinMain = page.locator('[data-testid="cad-tool-pin"]').first();
    const pinCaret = page.locator('[data-testid="cad-tool-pin-style-trigger"]').first();
    await pinMain.click();
    await expect(pinMain).toHaveAttribute("aria-pressed", "true");
    await pinCaret.click();
    const pinMenu = page.locator('[data-cad-tool-popover="true"]').first();
    await expect(pinMenu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(pinMenu).toBeHidden();

    // Pencil / Stroke tool & style caret
    const strokeMain = page.locator('[data-testid="cad-tool-stroke"]').first();
    const strokeCaret = page.locator('[data-testid="cad-tool-stroke-style-trigger"]').first();
    await strokeMain.click();
    await expect(strokeMain).toHaveAttribute("aria-pressed", "true");
    await strokeCaret.click();
    const strokeMenu = page.locator('[data-cad-tool-popover="true"]').first();
    await expect(strokeMenu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(strokeMenu).toBeHidden();

    // Shapes split button: dropdown & shape selection
    const shapesCaret = page.locator('[data-testid="cad-tool-shapes-dropdown"]').first();
    await shapesCaret.click();
    const shapesMenu = page.locator('[data-cad-tool-popover="true"]').first();
    await expect(shapesMenu).toBeVisible();
    const circleBtn = page.locator('[data-testid="cad-tool-shape-circle"]').first();
    await expect(circleBtn).toBeVisible();
    await circleBtn.click();
    await expect(shapesMenu).toBeHidden();

    // Callout tool & style caret
    const calloutMain = page.locator('[data-testid="cad-tool-callout"]').first();
    const calloutCaret = page.locator('[data-testid="cad-tool-callout-style-trigger"]').first();
    await calloutMain.click();
    await expect(calloutMain).toHaveAttribute("aria-pressed", "true");
    await calloutCaret.click();
    const calloutMenu = page.locator('[data-cad-tool-popover="true"]').first();
    await expect(calloutMenu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(calloutMenu).toBeHidden();

    // Text tool & style caret
    const textMain = page.locator('[data-testid="cad-tool-text"]').first();
    const textCaret = page.locator('[data-testid="cad-tool-text-style-trigger"]').first();
    await textMain.click();
    await expect(textMain).toHaveAttribute("aria-pressed", "true");
    await textCaret.click();
    const textMenu = page.locator('[data-cad-tool-popover="true"]').first();
    await expect(textMenu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(textMenu).toBeHidden();

    // Eraser tool & menu
    const eraserMain = page.locator('[data-testid="cad-tool-eraser"]').first();
    const eraserCaret = page.locator('[data-testid="cad-tool-eraser-style-trigger"]').first();
    await eraserMain.click();
    await expect(eraserMain).toHaveAttribute("aria-pressed", "true");
    await eraserCaret.click();
    const eraserMenu = page.locator('[data-cad-tool-popover="true"]').first();
    await expect(eraserMenu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(eraserMenu).toBeHidden();

    // ── 5. ÇALIŞMA ALANI PANELLERİ ─────────────────────────────────────────
    // Layers panel
    const layersBtn = page.locator('[data-testid="cad-tool-layers"]').first();
    await layersBtn.click();
    const layerPanel = page.locator('[data-testid="cad-layer-panel"]').first();
    await expect(layerPanel).toBeVisible();
    await expect(host).toHaveAttribute("data-cad-layer-panel-open", "true");
    await layersBtn.click();
    await expect(layerPanel).toBeHidden();
    await expect(host).toHaveAttribute("data-cad-layer-panel-open", "false");

    // Snap settings panel
    const snapBtn = page.locator('[data-testid="cad-tool-snap-settings"]').first();
    await snapBtn.click();
    const snapPanel = page.locator('[data-testid="cad-snap-settings-panel"]').first();
    await expect(snapPanel).toBeVisible();
    await expect(host).toHaveAttribute("data-cad-snap-panel-open", "true");
    await snapBtn.click();
    await expect(snapPanel).toBeHidden();
    await expect(host).toHaveAttribute("data-cad-snap-panel-open", "false");

    // Search side panel
    const searchBtn = page.locator('[data-testid="cad-tool-search-panel"]').first();
    await searchBtn.click();
    await expect(sidePanel).toBeVisible();
    const searchInput = page.locator('[data-cad-search-input="true"]').first();
    await expect(searchInput).toBeVisible();
    await searchBtn.click();
    await expect(sidePanel).toBeHidden();

    // Comments side panel
    const commentsBtn = page.locator('[data-testid="cad-tool-comments-panel"]').first();
    await commentsBtn.click();
    await expect(sidePanel).toBeVisible();
    await commentsBtn.click();
    await expect(sidePanel).toBeHidden();

    // ── 6. GEÇMİŞ VE DIŞA AKTAR GRUBU ───────────────────────────────────────
    const undoBtn = page.locator('[data-testid="cad-tool-undo"]').first();
    const redoBtn = page.locator('[data-testid="cad-tool-redo"]').first();
    const saveStatus = page.locator('[data-testid="cad-save-status"]').first();

    await expect(undoBtn).toBeVisible();
    await expect(redoBtn).toBeVisible();
    await expect(saveStatus).toBeVisible();

    // Download & Export dropdown
    const downloadDropdown = page.locator('[data-testid="cad-tool-download-dropdown"]').first();
    await downloadDropdown.click();
    const downloadMenu = page.locator('[data-cad-tool-popover="true"]').first();
    await expect(downloadMenu).toBeVisible();

    // Verify menu items
    await expect(page.locator('[data-testid="cad-download-dxf-rev"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="cad-download-original"]').first()).toBeVisible();

    // Open Export Dialog
    const openExportBtn = page.locator('[data-testid="cad-open-export-dialog"]').first();
    await expect(openExportBtn).toBeVisible();
    await openExportBtn.click();

    const exportDialog = page.locator('[data-cad-export-dialog="true"]').first();
    await expect(exportDialog).toBeVisible();

    // Close Export Dialog via Escape
    await page.keyboard.press("Escape");
    await expect(exportDialog).toBeHidden();
  });
});
