import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { signInAdmin, uploadCadPreviewV2Fixture, cleanupUploadedCadFixtures } from "./cad-test-helpers";

test.describe("CAD V1 ASAMA_08 — persistent review + real export bytes", () => {
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
    await page.getByTestId("cad-review-input-text").fill("Statik kontrol — Çiçek ve Ağaç");
    await page.getByTestId("cad-review-input-save").click();
    await expect(page.locator('[data-review-type="comment_pin"]')).toHaveCount(1);
    await page.reload();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30000 });
    await expect(page.locator('[data-review-type="comment_pin"]')).toHaveCount(1);

    async function openExport() {
      await page.getByTestId("cad-tool-download-dropdown").click();
      await page.getByTestId("cad-open-export-dialog").click();
    }
    await openExport();
    const jsonDownloadPromise = page.waitForEvent("download");
    await page.locator('[data-cad-export-confirm="true"]').click();
    const jsonDownload = await jsonDownloadPromise;
    expect(jsonDownload.suggestedFilename()).toMatch(/\.json$/);
    const jsonDoc = JSON.parse(await readFile(await jsonDownload.path(), "utf8"));
    expect(jsonDoc.items).toHaveLength(1);
    expect(jsonDoc.items[0].comment).toContain("Çiçek");

    await openExport();
    await page.getByRole("button", { name: "Review-Only DXF" }).click();
    const dxfPromise = page.waitForEvent("download");
    await page.locator('[data-cad-export-confirm="true"]').click();
    const dxf = await readFile(await (await dxfPromise).path(), "utf8");
    expect(dxf).toContain("$INSUNITS\n 70\n");
    expect(dxf).toContain("REVIEW_COMMENT");
    expect(dxf).toContain("ENDSEC\n  0\nEOF");

    await openExport();
    await page.getByRole("button", { name: "Görsel (PNG)" }).click();
    const pngPromise = page.waitForEvent("download");
    await page.locator('[data-cad-export-confirm="true"]').click();
    const pngDownload = await pngPromise;
    expect(pngDownload.suggestedFilename()).toMatch(/\.png$/);
    const pngBytes = await readFile(await pngDownload.path());
    expect(pngBytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");

    await openExport();
    await page.getByRole("button", { name: "Belge (PDF)" }).click();
    const pdfPromise = page.waitForEvent("download");
    await page.locator('[data-cad-export-confirm="true"]').click();
    const pdfDownload = await pdfPromise;
    expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/);
    const bytes = await readFile(await pdfDownload.path());
    expect(bytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
    const countAfter = await page.evaluate(() => (window as Window & { __cadAdapter?: { getRenderReadinessSnapshot(): { entityCount: number } } }).__cadAdapter?.getRenderReadinessSnapshot().entityCount ?? null);
    expect(countAfter).toBe(countBefore);
  });
});
