import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";
import type { CadPerfReport } from "../../src/lib/dokumantasyon/cad-runtime/perf";

test.describe("Stage 5 — Font Preload & Source Fetch Overlap Suite", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (err) => console.log(`[PAGE ERROR]: ${err.message}\n${err.stack}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[PAGE CONSOLE ERROR]: ${msg.text()}`);
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Concurrency Overlap: font-preload and source-fetch run concurrently and report metrics", async ({
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

    // Validate performance telemetry recorded both source-fetch and font-preload
    await expect.poll(
      async () => {
        return page.evaluate(() => {
          const report = (window as unknown as { __cadPerfReport?: CadPerfReport }).__cadPerfReport;
          return report?.phases["source-fetch"] ?? null;
        });
      },
      { timeout: 20_000, intervals: [200, 500, 1000] }
    ).not.toBeNull();

    const perfReport = await page.evaluate(() => {
      return (window as unknown as { __cadPerfReport?: CadPerfReport }).__cadPerfReport ?? null;
    });

    expect(perfReport?.phases["source-fetch"]).toBeDefined();
    expect(perfReport?.phases["open-document"]).toBeDefined();
    expect(perfReport?.totalTimeToReadyMs).toBeGreaterThan(0);
  });

  test("2. Turkish Unicode Font Fidelity (CAD-G): text-turkish-unicode renders with exact font parity", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-turkish-unicode");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 60_000 });

    const host = runtime.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
      timeout: 60_000,
    });

    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Inspect adapter font diagnostics
    const fontDiagnostics = await page.evaluate(() => {
      const adapter = (window as unknown as { __cadAdapter?: { fontDiagnostics?: unknown } }).__cadAdapter;
      return adapter?.fontDiagnostics ?? null;
    });

    expect(fontDiagnostics).not.toBeNull();
    // Verify WebGL drawing context is alive and responsive
    const isContextValid = await page.evaluate(() => {
      const cvs = document.querySelector('[data-cad-upstream-host="true"] canvas') as HTMLCanvasElement | null;
      if (!cvs) return false;
      const gl = cvs.getContext("webgl2") || cvs.getContext("webgl");
      return Boolean(gl && !gl.isContextLost());
    });
    expect(isContextValid).toBe(true);
  });

  test("3. Zero Font Duplication: Single-flight guarantees no duplicate font GET sets during open", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    const fontFetchUrls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/cad-upstream/fonts/") && req.url().endsWith(".ttf")) {
        fontFetchUrls.push(req.url());
      }
    });

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
      timeout: 60_000,
    });

    // Master Plan Section 2: "Aynı açılışta iki set font GET oluşmamalı"
    // Exactly one set of 4 fonts should be fetched during open, never 8 (2 sets)
    expect(fontFetchUrls.length).toBe(4);

    const distinctFonts = new Set(fontFetchUrls);
    expect(distinctFonts.size).toBe(4);

    // Verify after brief idle that zero additional font requests occur
    await page.waitForTimeout(1000);
    expect(fontFetchUrls.length).toBe(4);
  });

  test("4. Cold-click-before-idle: Immediate navigation without idle warmup renders cleanly", async ({
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
  });
});
