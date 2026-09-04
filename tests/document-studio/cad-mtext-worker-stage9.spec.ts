import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";
import { isCadMtextWorkerExperimentEnabled } from "../../src/lib/dokumantasyon/cad-runtime/feature-flags";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

test.describe("Stage 9 — MTEXT Worker Canary Experiment & Parity Benchmark", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (err) => console.log(`[PAGE ERROR]: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[PAGE CONSOLE ERROR]: ${msg.text()}`);
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Feature flag contract: Default is false (useMainThreadDraw: true baseline protected)", () => {
    expect(isCadMtextWorkerExperimentEnabled()).toBe(false);
  });

  test("2. Baseline vs Canary comparison: Render CAD-G (Turkish Unicode text) in both modes", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await signInAdmin(page);

    // Upload CAD-G fixture with Turkish Unicode characters
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-turkish-unicode");

    // --- RUN 1: Baseline (useMainThreadDraw: true) ---
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtimeBaseline = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtimeBaseline).toBeVisible({ timeout: 60_000 });

    const hostBaseline = runtimeBaseline.locator('[data-cad-upstream-host="true"]').first();
    await expect(hostBaseline).toHaveAttribute("data-cad-visual-ready", "true", { timeout: 30_000 });
    await expect(hostBaseline).toHaveAttribute("data-cad-search-ready", "true", { timeout: 20_000 });

    const canvasBaseline = hostBaseline.locator("canvas").first();
    await expect(canvasBaseline).toBeVisible();

    // Verify search index extracted Turkish characters correctly in baseline mode
    const baselineSearchResults = await page.evaluate(() => {
      const adapter = (window as unknown as { __cadAdapter?: { searchCadText: (q: { query: string }) => Array<{ item: { text: string } }> } }).__cadAdapter;
      if (!adapter) return [];
      return adapter.searchCadText({ query: "MİMARİ" }).map((r) => r.item.text);
    });
    expect(baselineSearchResults.length).toBeGreaterThanOrEqual(1);
    expect(baselineSearchResults.some((t) => t.includes("MİMARİ VE STATİK PROJESİ"))).toBe(true);

    // Measure baseline canvas snapshot
    const baselineScreenshot = await canvasBaseline.screenshot();
    expect(baselineScreenshot.byteLength).toBeGreaterThan(500);

    // --- RUN 2: Canary (useMainThreadDraw: false via sessionStorage/window experiment flag) ---
    const canaryPage = await page.context().newPage();
    try {
      canaryPage.on("pageerror", (err) => console.log(`[CANARY PAGE ERROR]: ${err.message}`));
      canaryPage.on("console", (msg) => {
        if (msg.type() === "error") console.log(`[CANARY CONSOLE ERROR]: ${msg.text()}`);
      });

      // Enable experiment flag for canary session
      await canaryPage.addInitScript(() => {
        (window as unknown as { __CAD_MTEXT_WORKER_EXPERIMENT: boolean }).__CAD_MTEXT_WORKER_EXPERIMENT = true;
        sessionStorage.setItem("CAD_MTEXT_WORKER_EXPERIMENT", "1");
      });

      const canaryStart = Date.now();
      await canaryPage.goto(`/dokumantasyon/dosya/${fileId}?mtextWorker=1`);

      const runtimeCanary = canaryPage.locator('[data-cad-runtime="orchestrator"]').first();
      await expect(runtimeCanary).toBeVisible({ timeout: 60_000 });

      const hostCanary = runtimeCanary.locator('[data-cad-upstream-host="true"]').first();
      await expect(hostCanary).toHaveAttribute("data-cad-visual-ready", "true", { timeout: 30_000 });
      await expect(hostCanary).toHaveAttribute("data-cad-search-ready", "true", { timeout: 20_000 });

      const canaryReadyDuration = Date.now() - canaryStart;
      console.log(`[STAGE 9] Canary worker render ready duration: ${canaryReadyDuration}ms`);

      const canvasCanary = hostCanary.locator("canvas").first();
      await expect(canvasCanary).toBeVisible();

      // Verify canary search results match baseline Turkish search
      const canarySearchResults = await canaryPage.evaluate(() => {
        const adapter = (window as unknown as { __cadAdapter?: { searchCadText: (q: { query: string }) => Array<{ item: { text: string } }> } }).__cadAdapter;
        if (!adapter) return [];
        return adapter.searchCadText({ query: "MİMARİ" }).map((r) => r.item.text);
      });
      expect(canarySearchResults.length).toBeGreaterThanOrEqual(1);
      expect(canarySearchResults.some((t) => t.includes("MİMARİ VE STATİK PROJESİ"))).toBe(true);
      expect(canarySearchResults).toEqual(baselineSearchResults);

      // Verify canvas rendered non-empty geometry
      const canaryScreenshot = await canvasCanary.screenshot();
      expect(canaryScreenshot.byteLength).toBeGreaterThan(500);

      // Verify no WebGL errors or worker crashes in canary mode
      const errorHeading = canaryPage.getByRole("heading", { name: /hata|açılamadı/i });
      await expect(errorHeading).toBeHidden();
    } finally {
      await canaryPage.close();
    }
  });

  test("3. Mobile emulation benchmark: 5 alternating fresh-context A/B runs (median/p95)", async ({
    browser,
    page,
  }) => {
    test.setTimeout(360_000);
    await signInAdmin(page);

    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-turkish-unicode");

    const baselineDurations: number[] = [];
    const canaryDurations: number[] = [];
    const runs = [
      { first: "baseline", second: "canary" },
      { first: "canary", second: "baseline" },
      { first: "baseline", second: "canary" },
      { first: "canary", second: "baseline" },
      { first: "baseline", second: "canary" },
    ];

    const measureRun = async (isCanary: boolean): Promise<number> => {
      // Fresh isolated browser context ensures zero shared memory/cache bias between A and B
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
      });
      const p = await ctx.newPage();
      try {
        if (isCanary) {
          await p.addInitScript(() => {
            (window as unknown as { __CAD_MTEXT_WORKER_EXPERIMENT: boolean }).__CAD_MTEXT_WORKER_EXPERIMENT = true;
            sessionStorage.setItem("CAD_MTEXT_WORKER_EXPERIMENT", "1");
          });
        }
        const t0 = Date.now();
        const targetUrl = isCanary
          ? `/dokumantasyon/dosya/${fileId}?mtextWorker=1`
          : `/dokumantasyon/dosya/${fileId}`;
        await p.goto(targetUrl);
        const host = p.locator('[data-cad-upstream-host="true"]').first();
        await expect(host).toHaveAttribute("data-cad-visual-ready", "true", { timeout: 45_000 });
        const duration = Date.now() - t0;
        const canvas = host.locator("canvas").first();
        await expect(canvas).toBeVisible();
        return duration;
      } finally {
        await ctx.close();
      }
    };

    for (let i = 0; i < runs.length; i++) {
      const pair = runs[i];
      if (pair.first === "baseline") {
        baselineDurations.push(await measureRun(false));
        canaryDurations.push(await measureRun(true));
      } else {
        canaryDurations.push(await measureRun(true));
        baselineDurations.push(await measureRun(false));
      }
    }

    const calcStats = (vals: number[]) => {
      const sorted = [...vals].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
      return { median, p95, all: sorted };
    };

    const baseStats = calcStats(baselineDurations);
    const canaryStats = calcStats(canaryDurations);

    console.log(`[STAGE 9 BENCHMARK] Baseline (5 runs): median=${baseStats.median}ms, p95=${baseStats.p95}ms, runs=[${baseStats.all.join(", ")}]`);
    console.log(`[STAGE 9 BENCHMARK] Canary   (5 runs): median=${canaryStats.median}ms, p95=${canaryStats.p95}ms, runs=[${canaryStats.all.join(", ")}]`);

    expect(baseStats.median).toBeLessThan(45_000);
    expect(canaryStats.median).toBeLessThan(45_000);
  });

  test("4. Multiline MTEXT Turkish character fidelity, portable snapshots, and search parity", async ({
    page,
  }, testInfo) => {
    test.setTimeout(180_000);
    await signInAdmin(page);

    // Read and upload stage3-layout-mtext-turkish.dxf
    const filePath = path.resolve(process.cwd(), "tests/fixtures/dxf/stage3-layout-mtext-turkish.dxf");
    const content = fs.readFileSync(filePath, "utf8");
    const pathname = `cad-stage9-mtext-${crypto.randomUUID()}.dxf`;
    const fileId = await page.evaluate(async ({ content, name, pathname }) => {
      const formData = new FormData();
      formData.append("file", new File([content], name, { type: "application/dxf" }));
      formData.append("pathname", pathname);
      const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
      const payload = await response.json();
      return payload.file.id as string;
    }, { content, name: "stage3-layout-mtext-turkish.dxf", pathname });

    // --- Mode 1: Baseline (Main Thread Draw) ---
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const hostBaseline = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(hostBaseline).toHaveAttribute("data-cad-visual-ready", "true", { timeout: 30_000 });
    await expect(hostBaseline).toHaveAttribute("data-cad-search-ready", "true", { timeout: 20_000 });
    await page.waitForTimeout(1500);

    const canvasBaseline = hostBaseline.locator("canvas").first();
    await expect(canvasBaseline).toBeVisible();
    const baselineShot = await canvasBaseline.screenshot();
    console.log(`[STAGE 9] Multiline MTEXT Baseline shot bytes (fully rendered): ${baselineShot.byteLength}`);
    expect(baselineShot.byteLength).toBeGreaterThan(500);

    // Portable output paths (F-07 fix)
    const baselinePath = testInfo.outputPath("baseline_mtext.png");
    const canaryPath = testInfo.outputPath("canary_mtext.png");
    fs.writeFileSync(baselinePath, baselineShot);

    // Search assertion in baseline mode: assert exact match for Turkish text
    const baselineSearchResults = await page.evaluate(() => {
      const adapter = (window as unknown as { __cadAdapter?: { searchCadText: (q: { query: string }) => Array<{ item: { text: string } }> } }).__cadAdapter;
      if (!adapter) return [];
      return adapter.searchCadText({ query: "İKİNCİ" }).map((r) => r.item.text);
    });
    expect(baselineSearchResults.length).toBeGreaterThanOrEqual(1);
    expect(baselineSearchResults.some((t) => t.includes("İKİNCİ SATIR"))).toBe(true);

    // --- Mode 2: Canary (Worker Draw) in Fresh Isolated Context ---
    const canaryContext = await page.context().browser()!.newContext();
    const canaryPage = await canaryContext.newPage();
    try {
      await canaryPage.addInitScript(() => {
        (window as unknown as { __CAD_MTEXT_WORKER_EXPERIMENT: boolean }).__CAD_MTEXT_WORKER_EXPERIMENT = true;
        sessionStorage.setItem("CAD_MTEXT_WORKER_EXPERIMENT", "1");
      });
      await canaryPage.goto(`/dokumantasyon/dosya/${fileId}?mtextWorker=1`);
      const hostCanary = canaryPage.locator('[data-cad-upstream-host="true"]').first();
      await expect(hostCanary).toHaveAttribute("data-cad-visual-ready", "true", { timeout: 30_000 });
      await expect(hostCanary).toHaveAttribute("data-cad-search-ready", "true", { timeout: 20_000 });

      await canaryPage.waitForTimeout(1500);

      const canvasCanary = hostCanary.locator("canvas").first();
      await expect(canvasCanary).toBeVisible();
      const canaryShot = await canvasCanary.screenshot();
      console.log(`[STAGE 9] Multiline MTEXT Canary shot bytes: ${canaryShot.byteLength}`);
      fs.writeFileSync(canaryPath, canaryShot);
      expect(canaryShot.byteLength).toBeGreaterThan(500);

      // Search parity assertion in Canary mode: exact match parity with Baseline
      const canarySearchResults = await canaryPage.evaluate(() => {
        const adapter = (window as unknown as { __cadAdapter?: { searchCadText: (q: { query: string }) => Array<{ item: { text: string } }> } }).__cadAdapter;
        if (!adapter) return [];
        return adapter.searchCadText({ query: "İKİNCİ" }).map((r) => r.item.text);
      });
      expect(canarySearchResults.length).toBeGreaterThanOrEqual(1);
      expect(canarySearchResults.some((t) => t.includes("İKİNCİ SATIR"))).toBe(true);
      expect(canarySearchResults).toEqual(baselineSearchResults);

      // Visual non-empty rendering & search parity check
      const baselineHash = crypto.createHash("sha256").update(baselineShot).digest("hex");
      const canaryHash = crypto.createHash("sha256").update(canaryShot).digest("hex");
      console.log(`[STAGE 9] Multiline MTEXT SHA256 baseline: ${baselineHash} (${baselineShot.byteLength} bytes)`);
      console.log(`[STAGE 9] Multiline MTEXT SHA256 canary:   ${canaryHash} (${canaryShot.byteLength} bytes)`);
      // Note: Worker OffscreenCanvas vs main thread Canvas2D produce subtle sub-pixel antialiasing differences
      // so exact SHA256 equality across threads is not expected; instead assert both are non-trivial renderings (>5000 bytes)
      // and verified 100% search and Turkish text index parity.
      expect(baselineShot.byteLength).toBeGreaterThan(5000);
      expect(canaryShot.byteLength).toBeGreaterThan(5000);
      expect(Math.abs(canaryShot.byteLength - baselineShot.byteLength)).toBeLessThan(baselineShot.byteLength * 0.25);
    } finally {
      await canaryContext.close();
    }
  });

  test("5. Lifecycle and WebGL Context Stability: 20 consecutive open/close cycles", async ({
    page,
  }) => {
    test.setTimeout(360_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-turkish-unicode");

    for (let i = 1; i <= 20; i++) {
      await page.goto(`/dokumantasyon/dosya/${fileId}`);
      const host = page.locator('[data-cad-upstream-host="true"]').first();
      await expect(host).toHaveAttribute("data-cad-visual-ready", "true", { timeout: 30_000 });
      const canvas = host.locator("canvas").first();
      await expect(canvas).toBeVisible({ timeout: 5_000 });

      // Navigate away to trigger complete teardown
      await page.goto("/dokumantasyon");
      await expect(page.locator("h1:has-text('Dökümantasyon Modülü')")).toBeVisible({ timeout: 15_000 });
    }
  });
});
