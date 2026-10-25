import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

async function waitForStudioReady(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  await expect(studio).toBeVisible({ timeout: 20_000 });
  const header = studio.locator('[data-testid="belge-studio-top-header"]');
  await expect(header).toBeVisible({ timeout: 10_000 });
  return studio;
}

test.describe("ASAMA_01: Belge Stüdyosu — Üst Bar PDFgear Tarzı SVG Üstte Metin Altta & Zoom Merkezleme", () => {
  const outputDir = path.resolve(process.cwd(), "test-results/asama01-header-baseline");

  test.beforeAll(() => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  test("Desktop 1920x1080: SVG üstte, metin altta dikey dizilim, 22px ikon, zoom geometrik merkez", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const toolbar = studio.locator('[data-testid="belge-studio-preview-toolbar"]');
    await expect(toolbar).toBeVisible();

    const result = await page.evaluate(() => {
      const headerEl = document.querySelector('[data-testid="belge-studio-top-header"]') as HTMLElement;
      const toolbarEl = document.querySelector('[data-testid="belge-studio-preview-toolbar"]') as HTMLElement;
      const centerCol = document.querySelector('.belge-preview-center') as HTMLElement;
      const fitBtn = document.querySelector('[data-testid="belge-preview-fit-page-btn"]') as HTMLElement;
      const fitWidthBtn = document.querySelector('[data-testid="belge-preview-fit-width-btn"]') as HTMLElement;
      const extLink = document.querySelector('[data-testid="belge-preview-open-external-btn"]') as HTMLElement;
      const focusBtn = document.querySelector('[data-testid="belge-pdf-focus-toggle"]') as HTMLElement;

      const tr = toolbarEl.getBoundingClientRect();
      const cr = centerCol.getBoundingClientRect();
      const toolbarCenter = tr.left + tr.width / 2;
      const colCenter = cr.left + cr.width / 2;
      const zoomCenterDiff = Math.abs(toolbarCenter - colCenter);

      function checkStacked(el: HTMLElement | null) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const icon = el.querySelector('.preview-tool-icon') as HTMLElement | null;
        const label = el.querySelector('.preview-tool-label') as HTMLElement | null;
        const iconR = icon ? icon.getBoundingClientRect() : null;
        const labelR = label ? label.getBoundingClientRect() : null;
        return {
          width: r.width,
          height: r.height,
          iconWidth: iconR ? Math.round(iconR.width) : null,
          iconHeight: iconR ? Math.round(iconR.height) : null,
          label: label ? label.textContent?.trim() : null,
          isStacked: Boolean(iconR && labelR && labelR.top > iconR.top),
          ariaPressed: el.getAttribute('aria-pressed'),
        };
      }

      return {
        headerHeight: headerEl.offsetHeight,
        zoomCenterDiff,
        fit: checkStacked(fitBtn),
        fitWidth: checkStacked(fitWidthBtn),
        extLink: checkStacked(extLink),
        focus: checkStacked(focusBtn),
      };
    });

    expect(result.headerHeight).toBeLessThanOrEqual(64);
    expect(result.zoomCenterDiff).toBeLessThanOrEqual(2);

    expect(result.fit?.isStacked).toBe(true);
    expect(result.fit?.iconWidth).toBe(22);
    expect(result.fit?.label).toBe("Sığdır");
    expect(result.fit?.ariaPressed).toBe("true");

    expect(result.fitWidth?.isStacked).toBe(true);
    expect(result.fitWidth?.iconWidth).toBe(22);
    expect(result.fitWidth?.label).toBe("Genişliğe Sığdır");

    expect(result.extLink?.isStacked).toBe(true);
    expect(result.extLink?.iconWidth).toBe(22);
    expect(result.extLink?.label).toBe("Yeni Sekme");

    expect(result.focus?.isStacked).toBe(true);
    expect(result.focus?.iconWidth).toBe(22);
    expect(result.focus?.label).toBe("PDF'ye Odaklan");

    await page.screenshot({ path: path.join(outputDir, "header-desktop-1920.png"), fullPage: false });
  });

  test("Desktop 1366x768: Laptop ekranında taşma yok, zoom ortalı, etiketler okunabilir", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const toolbar = studio.locator('[data-testid="belge-studio-preview-toolbar"]');
    await expect(toolbar).toBeVisible();

    const evaluation = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const headerEl = document.querySelector('[data-testid="belge-studio-top-header"]') as HTMLElement;
      const toolbarEl = document.querySelector('[data-testid="belge-studio-preview-toolbar"]') as HTMLElement;
      const centerCol = document.querySelector('.belge-preview-center') as HTMLElement;

      const tr = toolbarEl.getBoundingClientRect();
      const cr = centerCol.getBoundingClientRect();
      const zoomCenterDiff = Math.abs((tr.left + tr.width / 2) - (cr.left + cr.width / 2));

      return {
        hasOverflow: docWidth > winWidth,
        headerHeight: headerEl.offsetHeight,
        zoomCenterDiff,
      };
    });

    expect(evaluation.hasOverflow).toBe(false);
    expect(evaluation.headerHeight).toBeLessThanOrEqual(64);
    expect(evaluation.zoomCenterDiff).toBeLessThanOrEqual(2);

    await page.screenshot({ path: path.join(outputDir, "header-desktop-1366.png"), fullPage: false });
  });

  test("Mobile 390x844: Mobil düzen korunur, çekmece ve pill çalışır, yatay taşma sıfır", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const header = studio.locator('[data-testid="belge-studio-top-header"]');
    await expect(header).toBeVisible();

    const evaluation = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const headerEl = document.querySelector('[data-testid="belge-studio-top-header"]') as HTMLElement;
      const desktopToolbar = document.querySelector('[data-testid="belge-studio-preview-toolbar"]');
      return {
        hasOverflow: docWidth > winWidth,
        headerHeight: headerEl.offsetHeight,
        desktopToolbarVisible: desktopToolbar ? window.getComputedStyle(desktopToolbar).display !== "none" : false,
      };
    });

    expect(evaluation.hasOverflow).toBe(false);
    expect(evaluation.headerHeight).toBeLessThanOrEqual(56);
    expect(evaluation.desktopToolbarVisible).toBe(false);

    await page.screenshot({ path: path.join(outputDir, "header-mobile-390.png"), fullPage: false });
  });

  test("5 Belge Stüdyosu Regresyonu: Santiye Sefi Sozlesmesi (2 sayfa) toolbar ve sayfa navigasyonu", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-sozlesmesi");

    const toolbar = studio.locator('[data-testid="belge-studio-preview-toolbar"]');
    await expect(toolbar).toBeVisible();

    const pageNav = toolbar.locator('.belge-preview-navigation');
    await expect(pageNav).toBeVisible();
    await expect(pageNav.getByText(/1\s*\/\s*2/)).toBeVisible();

    const nextBtn = pageNav.locator('button[aria-label="Sonraki sayfa"]');
    await expect(nextBtn).toBeEnabled();

    const fitBtn = toolbar.locator('[data-testid="belge-preview-fit-page-btn"]');
    await expect(fitBtn).toBeVisible();
    await expect(fitBtn.locator('.preview-tool-label')).toHaveText("Sığdır");
  });
});
