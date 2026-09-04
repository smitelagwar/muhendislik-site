import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";
import type { CadPerfReport } from "../../src/lib/dokumantasyon/cad-runtime/perf";

test.describe("Stage 4 — Worker Readiness & Source Fetch Overlap", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (err) => console.log(`[PAGE ERROR]: ${err.message}\n${err.stack}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[PAGE CONSOLE ERROR]: ${msg.text()}`);
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Concurrent execution: file opens cleanly, canvas renders, and source-fetch is recorded in perf report", async ({
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

    // Ensure performance phases are properly recorded
    await expect.poll(
      async () => {
        return page.evaluate(() => {
          return (window as unknown as { __cadPerfReport?: CadPerfReport }).__cadPerfReport?.phases["source-fetch"] ?? null;
        });
      },
      { timeout: 20_000, intervals: [200, 500, 1000] }
    ).not.toBeNull();

    const report = await page.evaluate(() => {
      return (window as unknown as { __cadPerfReport?: CadPerfReport }).__cadPerfReport ?? null;
    });

    expect(report?.phases["source-fetch"]).toBeDefined();
    expect(report?.phases["open-document"]).toBeDefined();
    expect(report?.totalTimeToReadyMs).toBeGreaterThan(0);
  });

  test("2. Worker failure injection: terminal failure cleanly handled without infinite spinner or black canvas", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    // Intercept MLightCAD worker file requests and fail them to simulate worker-unavailable
    await page.route("**/cad-upstream/mtext-renderer-worker.js", (route) => {
      return route.abort("failed");
    });
    await page.route("**/cad-upstream/libredwg-parser-worker.js", (route) => {
      return route.abort("failed");
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    test.setTimeout(90_000);
    await expect.poll(async () => {
      return page.evaluate(() => {
        const errorCard = Boolean(document.querySelector('[data-testid="cad-error-card"]'));
        const legacy = Boolean(document.querySelector('[data-cad-engine="legacy"]'));
        const dxfViewer = Boolean(document.querySelector('[data-testid="cad-dxf-viewer"]'));
        const hostState = document.querySelector('[data-cad-upstream-host="true"]')?.getAttribute("data-cad-upstream-state");

        return errorCard || legacy || dxfViewer || hostState === "error";
      });
    }, { timeout: 60_000, intervals: [500, 1000] }).toBe(true);

    // Verify loading overlay is NOT hanging forever and fallback viewer or error card is active
    const fallbackCanvas = page.locator('[data-testid="cad-dxf-viewer"], [data-cad-engine="legacy"]').first();
    await expect(fallbackCanvas).toBeVisible({ timeout: 15_000 });
  });

  test("3. Repeat open & state stability: closing and reopening does not produce stale worker state", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    // Open first time
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
      timeout: 60_000,
    });

    // Navigate back to file list
    await page.goto("/dokumantasyon");
    await expect(page.locator("h1:has-text('Dökümantasyon Modülü')").first()).toBeVisible();

    // Reopen same file
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host2 = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host2).toHaveAttribute("data-cad-upstream-state", "ready", {
      timeout: 60_000,
    });

    const canvas2 = host2.locator("canvas").first();
    await expect(canvas2).toBeVisible({ timeout: 15_000 });
  });
});
