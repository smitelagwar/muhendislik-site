import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

async function waitForStudioReady(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  await expect(studio).toBeVisible({ timeout: 20_000 });
  const toolbar = studio.locator('[data-testid="belge-studio-preview-toolbar"]');
  await expect(toolbar).toBeVisible({ timeout: 10_000 });
  // Wait for canvas to be rendered with opacity 1
  const canvas = studio.locator('[data-testid="belge-studio-preview-canvas"] canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  await expect(canvas).toHaveCSS("opacity", "1", { timeout: 15_000 });
  return { studio, toolbar, canvas };
}

test.describe("ASAMA_02: Kesintisiz Sığdır ve Genişliğe Sığdır Animasyonu, Bitmap Devir ve Koordinat Koruma", () => {
  const outputDir = path.resolve(process.cwd(), "test-results/asama02-fit-transition");

  test.beforeAll(() => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  test("1. %255 -> Sığdır: 240ms akıcı küçülme, scroll (0,0) konumuna varış, swap sıçraması < 2px", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar, canvas } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    // Zoom to ~250% first via toolbar clicking
    const inBtn = toolbar.locator('button[aria-label="Yakınlaştır"]');
    for (let i = 0; i < 6; i++) {
      await inBtn.click();
      await page.waitForTimeout(60);
    }

    // Wait for zoom to be > 200
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="belge-studio-zoom-level"]');
      const text = el?.textContent?.replace("%", "") || "100";
      return parseInt(text, 10) >= 200;
    }, { timeout: 5000 });

    const zoomBefore = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="belge-studio-zoom-level"]');
      return parseInt(el?.textContent?.replace("%", "") || "100", 10);
    });
    expect(zoomBefore).toBeGreaterThanOrEqual(200);

    // Scroll down inside preview container to create scroll offset
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="belge-studio-preview-canvas"]');
      if (container) {
        container.scrollTop = 350;
        container.scrollLeft = 80;
      }
    });

    // Capture start frame
    await page.screenshot({ path: path.join(outputDir, "01-before-fit.png"), fullPage: false });

    // Click "Sığdır"
    const fitBtn = toolbar.locator('[data-testid="belge-preview-fit-page-btn"]');
    await fitBtn.click();

    // Sample intermediate frames (within 50-150ms)
    await page.waitForTimeout(80);
    const midState = await page.evaluate(() => {
      const canvasEl = document.querySelector('[data-testid="belge-studio-preview-canvas"] canvas') as HTMLCanvasElement;
      const frameEl = document.querySelector('.belge-preview-frame') as HTMLElement;
      const container = document.querySelector('[data-testid="belge-studio-preview-canvas"]') as HTMLElement;
      return {
        transform: canvasEl?.style.transform,
        frameWidth: frameEl?.offsetWidth,
        scrollLeft: container?.scrollLeft,
        scrollTop: container?.scrollTop,
      };
    });

    // In mid animation, transform should not be "none", it should be scaling
    expect(midState.transform).toContain("scale");
    await page.screenshot({ path: path.join(outputDir, "02-mid-transition.png"), fullPage: false });

    // Wait for animation to finish completely (240ms duration + settling)
    await page.waitForTimeout(300);

    // Settle state
    const settleState = await page.evaluate(() => {
      const canvasEl = document.querySelector('[data-testid="belge-studio-preview-canvas"] canvas') as HTMLCanvasElement;
      const frameEl = document.querySelector('.belge-preview-frame') as HTMLElement;
      const container = document.querySelector('[data-testid="belge-studio-preview-canvas"]') as HTMLElement;
      const zoomText = document.querySelector('[data-testid="belge-studio-zoom-level"]')?.textContent;
      return {
        transform: canvasEl?.style.transform,
        frameWidth: frameEl?.offsetWidth,
        frameHeight: frameEl?.offsetHeight,
        scrollLeft: container?.scrollLeft,
        scrollTop: container?.scrollTop,
        zoom: zoomText,
      };
    });

    expect(settleState.zoom).toBe("%100");
    expect(settleState.scrollLeft).toBeLessThanOrEqual(2);
    expect(settleState.scrollTop).toBeLessThanOrEqual(2);

    // Final screen capture
    await page.screenshot({ path: path.join(outputDir, "03-settled-fit.png"), fullPage: false });
  });

  test("2. Sığdır -> Genişliğe Sığdır: Yatay taşma yok, akıcı genişleme", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar, canvas } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    // Click "Genişliğe Sığdır"
    const fitWidthBtn = toolbar.locator('[data-testid="belge-preview-fit-width-btn"]');
    await fitWidthBtn.click();

    // Sample mid animation
    await page.waitForTimeout(90);
    const midTransform = await page.evaluate(() => {
      const canvasEl = document.querySelector('[data-testid="belge-studio-preview-canvas"] canvas') as HTMLCanvasElement;
      return canvasEl?.style.transform;
    });
    expect(midTransform).toContain("scale");

    // Wait for transition completion
    await page.waitForTimeout(300);

    const fitWidthResult = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="belge-studio-preview-canvas"]') as HTMLElement;
      const zoomText = document.querySelector('[data-testid="belge-studio-zoom-level"]')?.textContent;
      return {
        scrollLeft: container?.scrollLeft,
        hasHorizontalOverflow: container?.scrollWidth > container?.clientWidth + 4,
        zoom: parseInt(zoomText?.replace("%", "") || "100", 10),
      };
    });

    expect(fitWidthResult.hasHorizontalOverflow).toBe(false);
    expect(fitWidthResult.scrollLeft).toBe(0);
    expect(fitWidthResult.zoom).toBeGreaterThan(100);

    await page.screenshot({ path: path.join(outputDir, "04-fit-width-settled.png"), fullPage: false });
  });

  test("3. Hızlı ardışık geçiş: Sığdır -> anında Genişliğe Sığdır yarış olmadan son hedefe oturur", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const fitBtn = toolbar.locator('[data-testid="belge-preview-fit-page-btn"]');
    const fitWidthBtn = toolbar.locator('[data-testid="belge-preview-fit-width-btn"]');

    // Click fit then immediately fit width within 40ms
    await fitBtn.click();
    await page.waitForTimeout(40);
    await fitWidthBtn.click();

    // Wait for the full transition to finish
    await page.waitForTimeout(350);

    const finalMode = await page.evaluate(() => {
      const fitWidthEl = document.querySelector('[data-testid="belge-preview-fit-width-btn"]');
      const fitEl = document.querySelector('[data-testid="belge-preview-fit-page-btn"]');
      const zoomText = document.querySelector('[data-testid="belge-studio-zoom-level"]')?.textContent;
      return {
        fitWidthActive: fitWidthEl?.getAttribute("aria-pressed"),
        fitActive: fitEl?.getAttribute("aria-pressed"),
        zoom: parseInt(zoomText?.replace("%", "") || "100", 10),
      };
    });

    expect(finalMode.fitWidthActive).toBe("true");
    expect(finalMode.fitActive).toBe("false");
    expect(finalMode.zoom).toBeGreaterThan(100);
  });

  test("4. prefers-reduced-motion: Animasyonsuz anında hedef ölçeğe geçiş", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const fitWidthBtn = toolbar.locator('[data-testid="belge-preview-fit-width-btn"]');
    await fitWidthBtn.click();

    // Instant check (no timeout needed)
    const instantState = await page.evaluate(() => {
      const zoomText = document.querySelector('[data-testid="belge-studio-zoom-level"]')?.textContent;
      return parseInt(zoomText?.replace("%", "") || "100", 10);
    });

    expect(instantState).toBeGreaterThan(100);
  });
});
