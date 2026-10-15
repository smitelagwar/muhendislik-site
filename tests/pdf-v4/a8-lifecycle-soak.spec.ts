import fs from "node:fs";
import { test, expect } from "./helpers/test";
import { heapMB, openPdf, SCROLL, uploadPdf, waitSharp, type Fixture } from "./helpers/viewer";

const DOCUMENT_A: Fixture = "karisik-60";
const DOCUMENT_B: Fixture = "tr-metin";
const CYCLES = 10;

test("A8 localhost lifecycle soak — 10 document switch, interaction, hide/show and close cycles", async ({ page, cdp }, testInfo) => {
  test.setTimeout(15 * 60_000);
  expect(cdp, "heap telemetry requires Chromium CDP").not.toBeNull();

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const firstId = (await openPdf(page, DOCUMENT_A)).fileId;
  await waitSharp(page);
  const secondId = await uploadPdf(page, DOCUMENT_B);
  const metrics: Array<{ cycle: number; heapAfterCloseMB: number; canvasesAfterClose: number }> = [];
  const open = async (fileId: string) => {
    await page.goto(`/dokumantasyon/dosya/${fileId}?pdfEngine=v4`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(`${SCROLL} [data-page-state="rendered"]`).first()).toBeVisible({ timeout: 90_000 });
    await waitSharp(page);
  };

  for (let cycle = 1; cycle <= CYCLES; cycle++) {
    await open(firstId);

    await page.keyboard.press("Control+Equal");
    await page.locator('[data-command-id="pdf.zoom.fitWidth"]').first().click();
    await page.locator('[data-command-id="pdf.rotateView"]').first().click();

    await page.keyboard.press("Control+f");
    const search = page.locator('[data-testid="pdf-search-bar"] input');
    await expect(search).toBeVisible();
    await search.fill("araştırma");
    await page.keyboard.press("Control+g");
    await page.keyboard.press("Escape");

    await page.keyboard.press("F4");
    const thumbnails = page.locator('[data-testid="pdf-sidebar-tab-thumbnails"]');
    if (await thumbnails.isVisible()) {
      await thumbnails.click();
      const firstThumbnail = page.locator('[data-testid="pdf-thumbnail-1"]');
      if (await firstThumbnail.isVisible()) await firstThumbnail.click();
    }

    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await waitSharp(page);

    await open(secondId);
    await open(firstId);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.locator(SCROLL)).toHaveCount(0);

    const canvasesAfterClose = await page.locator("canvas").count();
    metrics.push({
      cycle,
      heapAfterCloseMB: await heapMB(cdp!),
      canvasesAfterClose,
    });
  }

  const evidence = { mode: "localhost-dev", cycles: CYCLES, pageErrors, metrics };
  await testInfo.attach("a8-local-lifecycle-metrics.json", {
    body: JSON.stringify(evidence, null, 2),
    contentType: "application/json",
  });
  if (process.env.A8_METRICS_PATH) {
    fs.writeFileSync(process.env.A8_METRICS_PATH, JSON.stringify(evidence, null, 2), "utf8");
  }
  expect(pageErrors, "no uncaught browser errors during lifecycle soak").toEqual([]);
  expect(metrics).toHaveLength(CYCLES);
  expect(metrics.every((metric) => metric.canvasesAfterClose === 0)).toBe(true);
});
