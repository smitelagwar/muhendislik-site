import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCustomDwgFixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("Stage 6 — DWG Fast-Cache Server Hint Suite", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (err) => console.log(`[PAGE ERROR]: ${err.message}\n${err.stack}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[PAGE CONSOLE ERROR]: ${msg.text()}`);
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Server Hint Cache Miss Bypass: Fresh DWG without derivative skips /dwg-dxf client probe and immediately mounts upstream", async ({
    page,
  }) => {
    await signInAdmin(page);
    const fileId = await uploadCustomDwgFixture(page, "fresh-sample.dwg");

    const probedUrls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes(`/api/dokumantasyon/files/${fileId}/dwg-dxf`)) {
        probedUrls.push(req.url());
      }
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 60_000 });

    // The orchestrator should have directly mounted original-dwg with transition reason SERVER_FAST_CACHE_MISS
    await expect(runtime).toHaveAttribute("data-cad-source", "original-dwg", {
      timeout: 15_000,
    });
    await expect(runtime).toHaveAttribute("data-transition-reason", "SERVER_FAST_CACHE_MISS", {
      timeout: 15_000,
    });

    // Verify ZERO requests were made to /dwg-dxf endpoint, proving client-side miss probe was completely eliminated
    expect(probedUrls.length).toBe(0);
  });

  test("2. Immediate Upstream Mounting: Canvas renders without being held in 'fast-resolving' loading state", async ({
    page,
  }) => {
    await signInAdmin(page);
    const fileId = await uploadCustomDwgFixture(page, "speed-check.dwg");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    // Verify that the UI does NOT hang in "Hızlı DWG cache kontrol ediliyor"
    const fastLoading = page.locator('text="Hızlı DWG cache kontrol ediliyor"');
    await expect(fastLoading).toHaveCount(0);

    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 60_000 });

    const host = runtime.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toBeVisible({ timeout: 30_000 });
  });

  test("3. Fallback & Prop Safety: Orchestrator without hint retains graceful probe and fallback behavior", async ({
    page,
  }) => {
    await signInAdmin(page);
    const fileId = await uploadCustomDwgFixture(page, "fallback-safety.dwg");

    // Intercept /dwg-dxf to return 204 MISS
    await page.route(`**/api/dokumantasyon/files/${fileId}/dwg-dxf`, (route) => {
      return route.fulfill({
        status: 204,
        headers: { "X-DWG-DXF-Cache": "MISS" },
      });
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 60_000 });

    // Should gracefully settle into original-dwg
    await expect(runtime).toHaveAttribute("data-cad-source", "original-dwg", {
      timeout: 30_000,
    });
  });
});
