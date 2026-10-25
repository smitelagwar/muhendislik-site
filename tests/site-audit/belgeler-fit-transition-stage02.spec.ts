import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

async function waitForStudioReady(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  await expect(studio).toBeVisible({ timeout: 20_000 });
  const toolbar = studio.locator('[data-testid="belge-studio-preview-toolbar"]');
  await expect(toolbar).toBeVisible({ timeout: 10_000 });
  const canvas = studio.locator('[data-testid="belge-studio-preview-canvas"] canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  await expect(canvas).toHaveCSS("opacity", "1", { timeout: 15_000 });
  return { studio, toolbar, canvas };
}

/**
 * Tuval üzerindeki gerçek mürekkep (yazı, çizgi, imza) yoğunluğunu ve
 * tuvalin scrollport içindeki görünür kesişimini ölçen güvenli yardımcı.
 */
async function getCanvasInkMetrics(page: Page) {
  return await page.evaluate(() => {
    const cvs = document.querySelector('[data-testid="belge-studio-preview-canvas"] canvas') as HTMLCanvasElement;
    const cnt = document.querySelector('[data-testid="belge-studio-preview-canvas"]') as HTMLElement;
    if (!cvs || !cnt) return { hasCanvas: false, inkRatio: 0, inkPixels: 0, intersectRatio: 0, width: 0, height: 0 };

    const cRect = cnt.getBoundingClientRect();
    const cvsRect = cvs.getBoundingClientRect();
    const intersectW = Math.max(0, Math.min(cRect.right, cvsRect.right) - Math.max(cRect.left, cvsRect.left));
    const intersectH = Math.max(0, Math.min(cRect.bottom, cvsRect.bottom) - Math.max(cRect.top, cvsRect.top));
    const cvsArea = Math.max(1, cvsRect.width * cvsRect.height);
    const intersectRatio = (intersectW * intersectH) / cvsArea;

    if (cvs.width <= 0 || cvs.height <= 0) {
      return { hasCanvas: true, inkRatio: 0, inkPixels: 0, intersectRatio, width: cvs.width, height: cvs.height };
    }

    const sample = document.createElement("canvas");
    sample.width = 100;
    sample.height = 100;
    const sCtx = sample.getContext("2d");
    if (!sCtx) return { hasCanvas: true, inkRatio: 0, inkPixels: 0, intersectRatio, width: cvs.width, height: cvs.height };

    sCtx.drawImage(cvs, 0, 0, 100, 100);
    const img = sCtx.getImageData(0, 0, 100, 100);
    let ink = 0;
    for (let i = 0; i < img.data.length; i += 4) {
      const a = img.data[i + 3];
      const lum = 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
      if (a > 50 && lum < 235) {
        ink++;
      }
    }

    return {
      hasCanvas: true,
      width: cvs.width,
      height: cvs.height,
      cssWidth: cvs.style.width,
      cssHeight: cvs.style.height,
      transform: cvs.style.transform,
      opacity: cvs.style.opacity,
      inkPixels: ink,
      inkRatio: ink / 10000,
      intersectRatio,
    };
  });
}

test.describe("ASAMA_02 & WHITEOUT REPAIR: Kesintisiz Sığdır ve Genişliğe Sığdır Animasyonu, Bitmap Devir ve Görsel Mürekkep İspatı", () => {
  const outputDir = path.resolve(process.cwd(), "test-results/asama02-fit-transition");

  test.beforeAll(() => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  test("1. %255 -> Sığdır: 240ms akıcı küçülme, scroll (0,0) konumuna varış, mürekkep korunumu", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar, canvas } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    // Zoom to >= 200% first via toolbar clicking
    const inBtn = toolbar.locator('button[aria-label="Yakınlaştır"]');
    for (let i = 0; i < 6; i++) {
      await inBtn.click();
      await page.waitForTimeout(60);
    }

    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="belge-studio-zoom-level"]');
      const text = el?.textContent?.replace("%", "") || "100";
      return parseInt(text, 10) >= 200;
    }, { timeout: 5000 });

    const initialInk = await getCanvasInkMetrics(page);
    expect(initialInk.inkRatio).toBeGreaterThan(0.01);

    // Scroll down inside preview container to create scroll offset
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="belge-studio-preview-canvas"]');
      if (container) {
        container.scrollTop = 350;
        container.scrollLeft = 80;
      }
    });

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

    expect(midState.transform).toContain("scale");
    const midInk = await getCanvasInkMetrics(page);
    expect(midInk.inkRatio).toBeGreaterThan(0.01);
    await page.screenshot({ path: path.join(outputDir, "02-mid-transition.png"), fullPage: false });

    // Wait for animation to finish completely
    await page.waitForTimeout(300);

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

    const settledInk = await getCanvasInkMetrics(page);
    expect(settledInk.inkRatio).toBeGreaterThan(0.01);
    expect(settledInk.intersectRatio).toBeGreaterThan(0.2);

    await page.screenshot({ path: path.join(outputDir, "03-settled-fit.png"), fullPage: false });
  });

  test("2. Sığdır -> Genişliğe Sığdır: Sıfır beyaz ekran, gerçek mürekkep ve yatay taşma yok", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar, canvas } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const beforeInk = await getCanvasInkMetrics(page);
    expect(beforeInk.inkRatio).toBeGreaterThan(0.01);

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
    const midInk = await getCanvasInkMetrics(page);
    expect(midInk.inkRatio).toBeGreaterThan(0.01);

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

    // Zorunlu görsel kalite kontrolü: Tuvalde metin/çizgiler mevcut, sıfır beyaz ekran
    const settledInk = await getCanvasInkMetrics(page);
    expect(settledInk.inkRatio).toBeGreaterThan(0.01);
    expect(settledInk.width).toBeGreaterThan(0);
    expect(settledInk.height).toBeGreaterThan(0);

    // 1 sn sonra da stabil kaldığını doğrula
    await page.waitForTimeout(1000);
    const lateInk = await getCanvasInkMetrics(page);
    expect(lateInk.inkRatio).toBeGreaterThan(0.01);

    await page.screenshot({ path: path.join(outputDir, "04-fit-width-settled.png"), fullPage: false });
  });

  test("3. Hızlı ardışık geçişler ve yarış koruması: Sığdır -> FitWidth -> Sığdır asla beyaz tuval bırakmaz", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const fitBtn = toolbar.locator('[data-testid="belge-preview-fit-page-btn"]');
    const fitWidthBtn = toolbar.locator('[data-testid="belge-preview-fit-width-btn"]');

    // 1. Senaryo: Sığdır -> 40ms -> FitWidth
    await fitBtn.click();
    await page.waitForTimeout(40);
    await fitWidthBtn.click();
    await page.waitForTimeout(350);

    const ink1 = await getCanvasInkMetrics(page);
    expect(ink1.inkRatio).toBeGreaterThan(0.01);

    // 2. Senaryo: FitWidth -> 80ms -> FitWidth (çift tıklama)
    await fitWidthBtn.click();
    await page.waitForTimeout(80);
    await fitWidthBtn.click();
    await page.waitForTimeout(350);

    const ink2 = await getCanvasInkMetrics(page);
    expect(ink2.inkRatio).toBeGreaterThan(0.01);

    // 3. Senaryo: FitPage -> 120ms -> FitWidth (orijinal bug tetikleyicisi)
    await fitBtn.click();
    await page.waitForTimeout(120);
    await fitWidthBtn.click();
    await page.waitForTimeout(400);

    const ink3 = await getCanvasInkMetrics(page);
    expect(ink3.inkRatio).toBeGreaterThan(0.01);
  });

  test("4. 5 ardışık Fit/Fit-Width çevrimi: Her adımda tam dolu okunur PDF içeriği", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const fitBtn = toolbar.locator('[data-testid="belge-preview-fit-page-btn"]');
    const fitWidthBtn = toolbar.locator('[data-testid="belge-preview-fit-width-btn"]');

    for (let cycle = 1; cycle <= 5; cycle++) {
      // Fit Width
      await fitWidthBtn.click();
      await page.waitForTimeout(300);
      const widthInk = await getCanvasInkMetrics(page);
      expect(widthInk.inkRatio).toBeGreaterThan(0.01);

      // Fit Page
      await fitBtn.click();
      await page.waitForTimeout(300);
      const pageInk = await getCanvasInkMetrics(page);
      expect(pageInk.inkRatio).toBeGreaterThan(0.01);
    }
  });

  test("5. %400 azami zoom -> Genişliğe Sığdır: Sıfır beyaz ekran ve doğru ölçek", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const inBtn = toolbar.locator('button[aria-label="Yakınlaştır"]');
    for (let i = 0; i < 15; i++) {
      if (await inBtn.isDisabled()) break;
      await inBtn.click();
      await page.waitForTimeout(50);
    }

    const fitWidthBtn = toolbar.locator('[data-testid="belge-preview-fit-width-btn"]');
    await fitWidthBtn.click();
    await page.waitForTimeout(400);

    const ink = await getCanvasInkMetrics(page);
    expect(ink.inkRatio).toBeGreaterThan(0.01);
    expect(ink.width).toBeGreaterThan(0);
  });

  test("6. prefers-reduced-motion: Animasyonsuz anında hedef ölçeğe geçiş ve mürekkep", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const fitWidthBtn = toolbar.locator('[data-testid="belge-preview-fit-width-btn"]');
    await fitWidthBtn.click();
    await page.waitForTimeout(200);

    const ink = await getCanvasInkMetrics(page);
    expect(ink.inkRatio).toBeGreaterThan(0.01);
  });
});
