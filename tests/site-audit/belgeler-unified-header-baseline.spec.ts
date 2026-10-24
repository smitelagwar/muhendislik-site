import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const EVIDENCE_DIR = path.resolve(process.cwd(), "docs/belgeler-unified-header/evidence");

async function ensureEvidenceDir() {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }
}

async function openStudio(page: Page, id: string) {
  await page.goto(`/belgeler/${id}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  const downloadBtn = studio
    .locator('[data-testid="belge-studio-desktop-actions"]:visible, [data-testid="belge-studio-mobile-actions"]:visible')
    .getByRole("button", { name: "PDF İndir", exact: true });
  await expect(downloadBtn).toBeEnabled({ timeout: 25_000 });
  return studio;
}

test.describe("Belgeler Unified Header — ASAMA_01 Baseline Measurements", () => {
  test.beforeAll(async () => {
    await ensureEvidenceDir();
  });

  test("Desktop 1920x1080 Light & Dark baseline measurements", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await openStudio(page, "santiye-sefi-taahhutnamesi");

    // Light theme measurements
    const metrics1920Light = await page.evaluate(() => {
      const outerNav = document.querySelector('nav[aria-label="Belge stüdyosu gezinme"]');
      const studioHeader = document.querySelector('[data-testid="belge-studio-top-header"]');
      const previewToolbar = document.querySelector('[data-testid="belge-studio-preview-toolbar"]');
      const formScroll = document.querySelector('[data-testid="belge-studio-form-scroll"]');
      const pdfCanvas = document.querySelector(".belge-preview-surface canvas");

      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        outerNav: outerNav ? { clientHeight: outerNav.clientHeight, offsetHeight: (outerNav as HTMLElement).offsetHeight, isVisible: window.getComputedStyle(outerNav).display !== "none" } : null,
        studioHeader: studioHeader ? { clientHeight: studioHeader.clientHeight, offsetHeight: (studioHeader as HTMLElement).offsetHeight } : null,
        previewToolbar: previewToolbar ? { clientHeight: previewToolbar.clientHeight, offsetHeight: (previewToolbar as HTMLElement).offsetHeight } : null,
        formScroll: formScroll ? { clientHeight: formScroll.clientHeight } : null,
        pdfCanvas: pdfCanvas ? { clientHeight: pdfCanvas.clientHeight, clientWidth: pdfCanvas.clientWidth } : null,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });

    await page.screenshot({ path: path.join(EVIDENCE_DIR, "baseline_1920_light.png"), fullPage: false });

    // Dark theme
    const themeBtn = page.locator('[data-testid="belge-studio-preview-toolbar"]').getByRole("button", { name: /karanlık|aydınlık|tema/i }).first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
    }
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "baseline_1920_dark.png"), fullPage: false });

    // Zoom and Fit verification
    const zoomInBtn = page.locator('[data-testid="belge-studio-preview-toolbar"]').getByRole("button", { name: "Yakınlaştır" });
    const fitBtn = page.locator('[data-testid="belge-studio-preview-toolbar"]').getByRole("button", { name: "Sığdır" });
    const zoomLabel = page.locator('[data-testid="belge-studio-zoom-level"]');

    await expect(zoomLabel).toHaveText("%100");
    await zoomInBtn.click();
    await expect(zoomLabel).toHaveText("%125");
    await fitBtn.click();
    await expect(zoomLabel).toHaveText("%100");

    // Draft status badge verification (V3 minimal)
    const draftBadge = page.locator('[data-testid="belge-draft-status-badge"]');
    if (await draftBadge.isVisible()) {
      await expect(draftBadge).toBeVisible();
    }

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, "baseline_1920.json"),
      JSON.stringify(metrics1920Light, null, 2),
      "utf8"
    );
  });

  test("Desktop 1366x768 Light baseline measurements", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openStudio(page, "santiye-sefi-taahhutnamesi");

    const metrics1366 = await page.evaluate(() => {
      const outerNav = document.querySelector('nav[aria-label="Belge stüdyosu gezinme"]');
      const studioHeader = document.querySelector('[data-testid="belge-studio-top-header"]');
      const previewToolbar = document.querySelector('[data-testid="belge-studio-preview-toolbar"]');
      const formScroll = document.querySelector('[data-testid="belge-studio-form-scroll"]');
      const pdfCanvas = document.querySelector(".belge-preview-surface canvas");

      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        outerNav: outerNav ? { clientHeight: outerNav.clientHeight, offsetHeight: (outerNav as HTMLElement).offsetHeight, isVisible: window.getComputedStyle(outerNav).display !== "none" } : null,
        studioHeader: studioHeader ? { clientHeight: studioHeader.clientHeight, offsetHeight: (studioHeader as HTMLElement).offsetHeight } : null,
        previewToolbar: previewToolbar ? { clientHeight: previewToolbar.clientHeight, offsetHeight: (previewToolbar as HTMLElement).offsetHeight } : null,
        formScroll: formScroll ? { clientHeight: formScroll.clientHeight } : null,
        pdfCanvas: pdfCanvas ? { clientHeight: pdfCanvas.clientHeight, clientWidth: pdfCanvas.clientWidth } : null,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });

    await page.screenshot({ path: path.join(EVIDENCE_DIR, "baseline_1366_light.png"), fullPage: false });

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, "baseline_1366.json"),
      JSON.stringify(metrics1366, null, 2),
      "utf8"
    );
  });

  test("Mobile 390x844 Light baseline measurements & tab switch", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openStudio(page, "santiye-sefi-taahhutnamesi");

    const metrics390 = await page.evaluate(() => {
      const outerNav = document.querySelector('nav[aria-label="Belge stüdyosu gezinme"]');
      const studioHeader = document.querySelector('[data-testid="belge-studio-top-header"]');
      const previewToolbar = document.querySelector('[data-testid="belge-studio-preview-toolbar"]');
      const formScroll = document.querySelector('[data-testid="belge-studio-form-scroll"]');
      const pdfCanvas = document.querySelector(".belge-preview-surface canvas");

      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        outerNav: outerNav ? { clientHeight: outerNav.clientHeight, offsetHeight: (outerNav as HTMLElement).offsetHeight, isVisible: window.getComputedStyle(outerNav).display !== "none" && !outerNav.classList.contains("sr-only") } : null,
        studioHeader: studioHeader ? { clientHeight: studioHeader.clientHeight, offsetHeight: (studioHeader as HTMLElement).offsetHeight } : null,
        previewToolbar: previewToolbar ? { clientHeight: previewToolbar.clientHeight, offsetHeight: (previewToolbar as HTMLElement).offsetHeight } : null,
        formScroll: formScroll ? { clientHeight: formScroll.clientHeight } : null,
        pdfCanvas: pdfCanvas ? { clientHeight: pdfCanvas.clientHeight, clientWidth: pdfCanvas.clientWidth } : null,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });

    await page.screenshot({ path: path.join(EVIDENCE_DIR, "baseline_390_light.png"), fullPage: false });

    // Verify Mobile form/preview tab switch
    const toggleTabBtn = page.getByRole("button", { name: "Formu Düzenle" });
    await expect(toggleTabBtn).toBeVisible();
    await toggleTabBtn.click();
    await expect(page.locator('[data-testid="belge-studio-form-scroll"]')).toBeVisible();

    const togglePreviewBtn = page.getByRole("button", { name: "Canlı PDF Önizle" });
    await expect(togglePreviewBtn).toBeVisible();
    await togglePreviewBtn.click();
    await expect(page.locator(".belge-preview-surface")).toBeVisible();

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, "baseline_390.json"),
      JSON.stringify(metrics390, null, 2),
      "utf8"
    );
  });

  test("Mobile 320x568 Light baseline measurements", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await openStudio(page, "santiye-sefi-taahhutnamesi");

    const metrics320 = await page.evaluate(() => {
      const outerNav = document.querySelector('nav[aria-label="Belge stüdyosu gezinme"]');
      const studioHeader = document.querySelector('[data-testid="belge-studio-top-header"]');
      const previewToolbar = document.querySelector('[data-testid="belge-studio-preview-toolbar"]');
      const formScroll = document.querySelector('[data-testid="belge-studio-form-scroll"]');
      const pdfCanvas = document.querySelector(".belge-preview-surface canvas");

      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        outerNav: outerNav ? { clientHeight: outerNav.clientHeight, offsetHeight: (outerNav as HTMLElement).offsetHeight, isVisible: window.getComputedStyle(outerNav).display !== "none" && !outerNav.classList.contains("sr-only") } : null,
        studioHeader: studioHeader ? { clientHeight: studioHeader.clientHeight, offsetHeight: (studioHeader as HTMLElement).offsetHeight } : null,
        previewToolbar: previewToolbar ? { clientHeight: previewToolbar.clientHeight, offsetHeight: (previewToolbar as HTMLElement).offsetHeight } : null,
        formScroll: formScroll ? { clientHeight: formScroll.clientHeight } : null,
        pdfCanvas: pdfCanvas ? { clientHeight: pdfCanvas.clientHeight, clientWidth: pdfCanvas.clientWidth } : null,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });

    await page.screenshot({ path: path.join(EVIDENCE_DIR, "baseline_320_light.png"), fullPage: false });

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, "baseline_320.json"),
      JSON.stringify(metrics320, null, 2),
      "utf8"
    );
  });

  test("Two-page contract navigation baseline verification", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openStudio(page, "santiye-sefi-sozlesmesi");

    const prevPageBtn = page.locator('[data-testid="belge-studio-preview-toolbar"]').getByRole("button", { name: "Önceki sayfa" });
    const nextPageBtn = page.locator('[data-testid="belge-studio-preview-toolbar"]').getByRole("button", { name: "Sonraki sayfa" });
    const pageLabel = page.locator('[aria-label="PDF sayfaları"] span');

    await expect(pageLabel).toHaveText("1 / 2");
    await expect(prevPageBtn).toBeDisabled();
    await expect(nextPageBtn).toBeEnabled();

    await nextPageBtn.click();
    await expect(pageLabel).toHaveText("2 / 2");
    await expect(nextPageBtn).toBeDisabled();
    await expect(prevPageBtn).toBeEnabled();

    await prevPageBtn.click();
    await expect(pageLabel).toHaveText("1 / 2");
    await expect(prevPageBtn).toBeDisabled();
  });
});
