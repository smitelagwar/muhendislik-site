import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { signInAdmin, uploadCadPreviewV2Fixture, cleanupUploadedCadFixtures } from "./cad-test-helpers";

test.describe("CAD V1 ASAMA_08 â€” persistent review + real export bytes", () => {
  test.afterEach(async ({ page }) => cleanupUploadedCadFixtures(page));
  test("F5 local revision recovery and JSON/DXF/PDF downloads preserve source model", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30000 });
    const canvas = host.locator("canvas").first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const countBefore = await page.evaluate(() => (window as Window & { __cadAdapter?: { getRenderReadinessSnapshot(): { entityCount: number } } }).__cadAdapter?.getRenderReadinessSnapshot().entityCount ?? null);
    expect(countBefore).toBeGreaterThan(0);

    await page.getByTestId("cad-tool-pin").first().click();
    await page.mouse.click(box!.x + box!.width * .6, box!.y + box!.height * .6);
    await expect(page.getByTestId("cad-review-input-dialog")).toBeVisible();
    await page.getByTestId("cad-review-input-tex¶»§q«^