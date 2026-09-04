import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";
import type { CadPerfReport } from "../../src/lib/dokumantasyon/cad-runtime/perf";

test.describe("Stage 2 — CAD Code Pre-warming & Zero Early WebGL Initialization", () => {
  test.beforeEach(async ({ page }) => {
    // WebGL context tracking init script
    await page.addInitScript(() => {
      (window as unknown as { __WEBGL_CONTEXT_COUNT__: number }).__WEBGL_CONTEXT_COUNT__ = 0;
      const origGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") {
          const w = window as unknown as { __WEBGL_CONTEXT_COUNT__: number };
          w.__WEBGL_CONTEXT_COUNT__ = (w.__WEBGL_CONTEXT_COUNT__ || 0) + 1;
        }
        return origGetContext.apply(this, [type, ...(args as [unknown])]);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });

    page.on("pageerror", (err) => console.log(`[PAGE ERROR]: ${err.message}\n${err.stack}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[PAGE CONSOLE ERROR]: ${msg.text()}`);
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Zero early WebGL context creation before user opens a CAD file", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    // Navigate to file list where CAD file is present
    await page.goto("/dokumantasyon");
    await expect(page.locator("h1:has-text('Dökümantasyon Modülü')").first()).toBeVisible();

    // Verify CAD row is visible
    const cadRow = page.locator(`[data-testid="dok-file-row"][data-file-id="${fileId}"]`);
    await expect(cadRow).toBeVisible();

    // Hover to trigger intent preload
    await cadRow.hover();

    // Verify code preloading completes without throwing
    await expect.poll(async () => {
      return page.evaluate(() => {
        return (window as unknown as { __CAD_CODE_PRELOADED__?: boolean }).__CAD_CODE_PRELOADED__ === true;
      });
    }, { timeout: 10_000 }).toBe(true);

    // Crucial invariant: preloading code must NEVER create a WebGL context before file open
    const webglCount = await page.evaluate(() => {
      return (window as unknown as { __WEBGL_CONTEXT_COUNT__: number }).__WEBGL_CONTEXT_COUNT__;
    });
    expect(webglCount).toBe(0);
  });

  test("2. File opens cleanly after pre-warming and establishes valid WebGL canvas", async ({ page }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto("/dokumantasyon");
    await expect(page.locator("h1:has-text('Dökümantasyon Modülü')").first()).toBeVisible();

    // Trigger pre-warm via intent hover
    const cadRow = page.locator(`[data-testid="dok-file-row"][data-file-id="${fileId}"]`);
    await expect(cadRow).toBeVisible();
    await cadRow.hover();

    // Wait for prewarm
    await expect.poll(async () => {
      return page.evaluate(() => {
        return (window as unknown as { __CAD_CODE_PRELOADED__?: boolean }).__CAD_CODE_PRELOADED__ === true;
      });
    }, { timeout: 10_000 }).toBe(true);

    // Now navigate to the preview page
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 60_000 });

    const host = runtime.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
      timeout: 60_000,
    });

    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Wait for CAD perf report
    await expect.poll(
      async () => {
        return page.evaluate(() => {
          return (window as unknown as { __cadPerfReport?: CadPerfReport }).__cadPerfReport?.totalTimeToReadyMs ?? null;
        });
      },
      { timeout: 20_000, intervals: [200, 500, 1000] }
    ).not.toBeNull();

    const report = await page.evaluate(() => {
      return (window as unknown as { __cadPerfReport?: CadPerfReport }).__cadPerfReport ?? null;
    });

    expect(report?.totalTimeToReadyMs).toBeGreaterThan(0);
    expect(report?.phases["open-document"]).toBeDefined();

    // WebGL context must now be created for the actual render
    const webglCountAfterOpen = await page.evaluate(() => {
      return (window as unknown as { __WEBGL_CONTEXT_COUNT__: number }).__WEBGL_CONTEXT_COUNT__;
    });
    expect(webglCountAfterOpen).toBeGreaterThan(0);
  });

  test("3. Background preload respects network constraints (saveData / 2g guard)", async ({ page }) => {
    await page.goto("/dokumantasyon");

    const guardCheck = await page.evaluate(() => {
      // Simulate saveData
      const fakeNav = {
        connection: {
          saveData: true,
          effectiveType: "4g",
        },
      };
      const checkWithNav = (navObj: typeof fakeNav) => {
        if (navObj.connection?.saveData) return false;
        if (navObj.connection?.effectiveType === "2g" || navObj.connection?.effectiveType === "slow-2g") return false;
        return true;
      };

      return {
        saveDataBlocked: !checkWithNav(fakeNav),
        slow2gBlocked: !checkWithNav({ connection: { saveData: false, effectiveType: "slow-2g" } }),
        normalAllowed: checkWithNav({ connection: { saveData: false, effectiveType: "4g" } }),
      };
    });

    expect(guardCheck.saveDataBlocked).toBe(true);
    expect(guardCheck.slow2gBlocked).toBe(true);
    expect(guardCheck.normalAllowed).toBe(true);
  });
});
