import { expect, test } from "@playwright/test";
import { signInAdmin, uploadCadPreviewV2Fixture, cleanupUploadedCadFixtures } from "./cad-test-helpers";

test.describe("CAD V1 ASAMA_09 — responsive controls and source-safe CAD UX", () => {
  test.afterEach(async ({ page }) => cleanupUploadedCadFixtures(page));
  test("375px mobile: area/chain actions are >=44px, can cancel without source edit", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 780 });
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state","ready",{timeout:30000});
    const status = page.getByTestId("cad-stage09-status");
    await expect(status).toBeVisible();
    await expect(status).toContainText("OSNAP");
    const before = await page.evaluate(() => (window as Window & {__cadAdapter?:{getRenderReadinessSnapshot:()=>{entityCount:number}}}).__cadAdapter?.getRenderReadinessSnapshot().entityCount ?? null);
    await page.getByTestId("cad-tool-area").first().click();
    const area = page.getByTestId("cad-area-status");
    await expect(area).toBeVisible();
    for (const id of ["cad-area-undo-point","cad-area-finish-btn","cad-area-cancel-btn"]) {
      const btn=page.getByTestId(id); await expect(btn).toBeVisible();
      const rect=await btn.boundingBox(); expect(rect?.width).toBeGreaterThanOrEqual(44); expect(rect?.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByTestId("cad-area-cancel-btn").click();
    await expect(area).toHaveCount(0);
    await page.getByTestId("cad-tool-chain-distance").first().click();
    const chain = page.getByTestId("cad-chain-distance-overlay");
    await expect(chain).toBeVisible();
    for (const id of ["cad-chain-add-point","cad-chain-backspace","cad-chain-finish","cad-chain-cancel"]) {
      const btn=page.getByTestId(id); const rect=await btn.boundingBox();
      expect(rect?.width).toBeGreaterThanOrEqual(44); expect(rect?.height).toBeGreaterThanOrEqual(44);
    }
    await page.getByTestId("cad-chain-cancel").click();
    await expect(chain).toHaveCount(0);
    const after = await page.evaluate(() => (window as Window & {__cadAdapter?:{getRenderReadinessSnapshot:()=>{entityCount:number}}}).__cadAdapter?.getRenderReadinessSnapshot().entityCount ?? null);
    expect(after).toBe(before);
  });
  test("desktop: layer visibility metadata reflects actual CAD fixture", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page,"layers-frozen-locked-zero");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host=page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state","ready",{timeout:30000});
    await page.getByTestId("cad-tool-layers").first().click();
    const panel=page.getByTestId("cad-layer-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator('[data-layer-frozen="true"]').first()).toBeVisible();
    await expect(panel.locator('[data-layer-locked="true"]').first()).toBeVisible();
    const rows=panel.locator('[data-layer-name]');
    expect(await rows.count()).toBeGreaterThan(0);
    const firstName=await rows.first().getAttribute("data-layer-name");
    expect(firstName).toBeTruthy();
    const toggle=panel.getByTestId(`cad-layer-toggle-${firstName}`);
    const old=await rows.first().getAttribute("data-visible");
    await toggle.click();
    await expect(rows.first()).toHaveAttribute("data-visible", old === "true" ? "false":"true");
    await panel.getByTestId("cad-layer-reset-source").click();
  });
});
