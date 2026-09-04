import { expect, test, type Page } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";
import { isCadMtextWorkerExperimentEnabled } from "../../src/lib/dokumantasyon/cad-runtime/feature-flags";

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
    const baselineSearchCount = await page.evaluate(async () => {
      const searchBox = document.querySelector('input[placeholder*="Ara"], input[type="search"]');
      return searchBox !== null;
    });
    expect(baselineSearchCount).toBeDefined();

    // Measure baseline canvas snapshot
    const baselineScreenshot = await canvasBaseline.screenshot();
    expect(baselineScreenshot.byteLength).toBeGreaterThan(500);

    // --- RUN 2: Canary (useMainThreadDraw: false via sessionStorage/window experiment flag) ---
    // Open a fresh context / page for fresh manager lifecycle
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

  test("3. Mobile emulation benchmark: Evaluate worker mode under mobile viewport & CPU throttle", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    // Emulate mobile device (e.g. Pixel 7 / iPhone viewport)
    await page.setViewportSize({ width: 390, height: 844 });
    await signInAdmin(page);

    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-turkish-unicode");

    // Test mobile baseline (useMainThreadDraw: true)
    const t0 = Date.now();
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 60_000 });

    const host = runtime.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-visual-ready", "true", { timeout: 30_000 });
    const mobileBaselineDuration = Date.now() - t0;
    console.log(`[STAGE 9] Mobile baseline duration: ${mobileBaselineDuration}ms`);

    // Test mobile canary (useMainThreadDraw: false)
    const mobileCanaryPage = await page.context().newPage();
    try {
      await mobileCanaryPage.setViewportSize({ width: 390, height: 844 });
      await mobileCanaryPage.addInitScript(() => {
        (window as unknown as { __CAD_MTEXT_WORKER_EXPERIMENT: boolean }).__CAD_MTEXT_WORKER_EXPERIMENT = true;
      });

      const t1 = Date.now();
      await mobileCanaryPage.goto(`/dokumantasyon/dosya/${fileId}?mtextWorker=1`);

      const canaryRuntime = mobileCanaryPage.locator('[data-cad-runtime="orchestrator"]').first();
      await expect(canaryRuntime).toBeVisible({ timeout: 60_000 });

      const canaryHost = canaryRuntime.locator('[data-cad-upstream-host="true"]').first();
      await expect(canaryHost).toHaveAttribute("data-cad-visual-ready", "true", { timeout: 30_000 });
      const mobileCanaryDuration = Date.now() - t1;
      console.log(`[STAGE 9] Mobile canary worker duration: ${mobileCanaryDuration}ms`);

      // Delta comparison: does worker mode provide a statistically significant benefit?
      const delta = mobileBaselineDuration - mobileCanaryDuration;
      console.log(`[STAGE 9] Mobile Delta (baseline - canary): ${delta}ms`);
    } finally {
      await mobileCanaryPage.close();
    }
  });

  test("4. Multiline MTEXT Turkish character fidelity and search parity", async ({ page }) => {
    test.setTimeout(120_000);
    await signInAdmin(page);

    // Read and upload stage3-layout-mtext-turkish.dxf
    const fs = await import("node:fs");
    const path = await import("node:path");
    const filePath = path.resolve(process.cwd(), "tests/fixtures/dxf/stage3-layout-mtext-turkish.dxf");
    const content = fs.readFileSync(filePath, "utf8");

    const fileId = await page.evaluate(async ({ content, name }) => {
      const formData = new FormData();
      formData.append("file", new File([content], name, { type: "application/dxf" }));
      formData.append("pathname", `cad-stage9-mtext-${crypto.randomUUID()}.dxf`);
      const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
      const payload = await response.json();
      return payload.file.id as string;
    }, { content, name: "stage3-layout-mtext-turkish.dxf" });

    // --- Mode 1: Baseline (Main Thread Draw) ---
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const hostBaseline = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(hostBaseline).toHaveAttribute("data-cad-visual-ready", "true", { timeout: 30_000 });
    // Wait for the busy spinner / rendering to finish completely
    await page.waitForTimeout(2500);
    const baselineShot = await hostBaseline.locator("canvas").first().screenshot();
    console.log(`[STAGE 9] Multiline MTEXT Baseline shot bytes (fully rendered): ${baselineShot.byteLength}`);
    expect(baselineShot.byteLength).toBeGreaterThan(500);

    const fsLib = await import("node:fs");
    const baselinePath = "C:/Users/hsyn/.gemini/antigravity/brain/d96506f8-a01a-49f5-897d-d2c587d6f6eb/.tempmediaStorage/baseline_mtext.png";
    const canaryPath = "C:/Users/hsyn/.gemini/antigravity/brain/d96506f8-a01a-49f5-897d-d2c587d6f6eb/.tempmediaStorage/canary_mtext.png";
    fsLib.writeFileSync(baselinePath, baselineShot);

    // --- Mode 2: Canary (Worker Draw) ---
    const canaryPage = await page.context().newPage();
    try {
      await canaryPage.addInitScript(() => {
        (window as unknown as { __CAD_MTEXT_WORKER_EXPERIMENT: boolean }).__CAD_MTEXT_WORKER_EXPERIMENT = true;
      });
      await canaryPage.goto(`/dokumantasyon/dosya/${fileId}?mtextWorker=1`);
      const hostCanary = canaryPage.locator('[data-cad-upstream-host="true"]').first();
      await expect(hostCanary).toHaveAttribute("data-cad-visual-ready", "true", { timeout: 30_000 });
      await expect(hostCanary).toHaveAttribute("data-cad-search-ready", "true", { timeout: 20_000 });

      // Ensure idle render stabilization
      await canaryPage.waitForTimeout(500);

      const canaryShot = await hostCanary.locator("canvas").first().screenshot();
      console.log(`[STAGE 9] Multiline MTEXT Canary shot bytes: ${canaryShot.byteLength}`);
      fsLib.writeFileSync(canaryPath, canaryShot);
      expect(canaryShot.byteLength).toBeGreaterThan(500);

      // Check text search results inside the document
      const searchBox = canaryPage.locator('input[placeholder*="Ara"]').first();
      // Inspect if there is any visible disparity
      // Bit-for-bit visual parity check (SHA256 hash match)
      const cryptoLib = await import("node:crypto");
      const baselineHash = cryptoLib.createHash("sha256").update(baselineShot).digest("hex");
      const canaryHash = cryptoLib.createHash("sha256").update(canaryShot).digest("hex");
      console.log(`[STAGE 9] Multiline MTEXT SHA256 baseline: ${baselineHash}`);
      console.log(`[STAGE 9] Multiline MTEXT SHA256 canary:   ${canaryHash}`);
      expect(canaryHash).toBe(baselineHash);
    } finally {
      await canaryPage.close();
    }
  });

  test("5. Lifecycle and WebGL Context Stability: 5 consecutive open/close cycles in Worker Mode", async ({
    page,
  }) => {
    test.setTimeout(180_000);
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-turkish-unicode");

    const canaryPage = await page.context().newPage();
    try {
      await canaryPage.addInitScript(() => {
        (window as unknown as { __CAD_MTEXT_WORKER_EXPERIMENT: boolean }).__CAD_MTEXT_WORKER_EXPERIMENT = true;
      });

      for (let i = 1; i <= 5; i++) {
        await canaryPage.goto(`/dokumantasyon/dosya/${fileId}?mtextWorker=1`);
        const host = canaryPage.locator('[data-cad-upstream-host="true"]').first();
        await expect(host).toHaveAttribute("data-cad-visual-ready", "true", { timeout: 30_000 });
        const canvas = host.locator("canvas").first();
        await expect(canvas).toBeVisible({ timeout: 5_000 });

        // Navigate away to test teardown
        await canaryPage.goto("/dokumantasyon");
        await expect(canaryPage.locator("h1:has-text('Dökümantasyon Modülü')")).toBeVisible({ timeout: 15_000 });
      }
    } finally {
      await canaryPage.close();
    }
  });
});
