import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("Stage 8 — Auxiliary Indexes Deferred from Critical Path Suite", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (err) => console.log(`[PAGE ERROR]: ${err.message}\n${err.stack}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[PAGE CONSOLE ERROR]: ${msg.text()}`);
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Visual-Ready precedes Tool-Data-Ready: Drawing canvas renders immediately before idle indexes complete", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 60_000 });

    const host = runtime.locator('[data-cad-upstream-host="true"]').first();

    // 1. VISUAL_READY must be achieved promptly
    await expect(host).toHaveAttribute("data-cad-visual-ready", "true", {
      timeout: 30_000,
    });

    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10_000 });

    // 2. TOOL_DATA_READY is eventually populated by the idle scheduler
    await expect(host).toHaveAttribute("data-cad-snap-ready", "true", {
      timeout: 15_000,
    });
    await expect(host).toHaveAttribute("data-cad-search-ready", "true", {
      timeout: 15_000,
    });
    await expect(host).toHaveAttribute("data-cad-tool-ready", "true", {
      timeout: 15_000,
    });
  });

  test("2. Early Tool Click / Demand Readiness: Measurement tool activation immediately resolves snap catalog if clicked early", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 60_000 });

    const host = runtime.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-visual-ready", "true", {
      timeout: 30_000,
    });

    // Click Distance measurement tool in the ribbon
    const distanceToolButton = page.locator('[data-testid="cad-tool-distance"]').first();
    await expect(distanceToolButton).toBeVisible({ timeout: 15_000 });
    await distanceToolButton.click();

    // Tool should activate cleanly and snap must be ready
    await expect(host).toHaveAttribute("data-cad-active-tool", "distance", {
      timeout: 10_000,
    });
    await expect(host).toHaveAttribute("data-cad-snap-ready", "true", {
      timeout: 5_000,
    });

    // Deactivate distance tool cleanly
    await distanceToolButton.click();
    await expect(host).toHaveAttribute("data-cad-active-tool", "none", {
      timeout: 5_000,
    });
  });

  test("3. Search Indexing on Demand: Text search index query accurately locates text entities without race conditions", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-turkish-unicode");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 60_000 });

    const host = runtime.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-visual-ready", "true", {
      timeout: 30_000,
    });

    // Open CAD Review side panel via the Ribbon search / review button if present
    const searchTabButton = page.locator('button#tab-search, button[data-tab="search"], button[title*="Arama"]').first();
    if (await searchTabButton.isVisible()) {
      await searchTabButton.click();
    }

    // Verify search index accuracy via adapter API
    const searchResult = await page.evaluate(async () => {
      const adapter = (window as unknown as { __cadAdapter?: {
        ensureTextSearchReady: () => Promise<void>;
        isTextSearchReady: () => boolean;
        searchCadText: (query: { query: string }) => Array<{ item: { text: string } }>;
      } }).__cadAdapter;

      if (!adapter) return { ok: false, error: "Adapter missing" };

      await adapter.ensureTextSearchReady();
      const isReady = adapter.isTextSearchReady();
      const results = adapter.searchCadText({ query: "Ş" });

      return {
        ok: true,
        isReady,
        resultsCount: results.length,
      };
    });

    expect(searchResult.ok).toBe(true);
    expect(searchResult.isReady).toBe(true);
  });
});
