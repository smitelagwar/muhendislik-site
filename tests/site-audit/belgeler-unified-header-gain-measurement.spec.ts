import { expect, test, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const EVIDENCE_DIR = path.join(process.cwd(), "docs", "belgeler-unified-header", "evidence");

async function waitForStudioReady(page: Page, pathUrl: string) {
  await page.goto(pathUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  const downloadBtn = studio
    .locator('[data-testid="belge-studio-desktop-actions"]:visible, [data-testid="belge-studio-mobile-actions"]:visible')
    .getByRole("button", { name: "PDF İndir", exact: true });
  await expect(downloadBtn).toBeEnabled({ timeout: 25_000 });
  return studio;
}

test.describe("Belgeler Unified Header — ASAMA_06 Gain & Post-Implementation Measurement", () => {
  const VIEWPORTS = [
    { width: 1920, height: 1080, name: "1920" },
    { width: 1366, height: 768, name: "1366" },
    { width: 390, height: 844, name: "390" },
    { width: 320, height: 568, name: "320" },
  ];

  for (const vp of VIEWPORTS) {
    test(`Measure Post-Implementation metrics for ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

      // Take screenshot
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, `post_${vp.name}_light.png`),
        fullPage: false,
      });

      const metrics = await page.evaluate(() => {
        const outerNav = document.querySelector('nav[aria-label="Belgeler üst gezinme"]') as HTMLElement | null;
        const unifiedHeader = document.querySelector('[data-testid="belge-studio-top-header"]') as HTMLElement | null;
        const previewPanel = document.querySelector(".belge-preview-panel") as HTMLElement | null;
        const legacyToolbarInPreview = previewPanel?.querySelector('[data-testid="belge-studio-preview-toolbar"]') as HTMLElement | null;

        const formScroll = document.querySelector('[data-testid="belge-studio-form-scroll"]') as HTMLElement | null;
        const pdfContainer = document.querySelector(".belge-preview-panel") as HTMLElement | null;
        const pdfCanvas = document.querySelector(".belge-preview-surface canvas") as HTMLElement | null;

        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;

        return {
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          outerNav: {
            clientHeight: outerNav?.clientHeight ?? 0,
            offsetHeight: outerNav?.offsetHeight ?? 0,
            isVisible: Boolean(outerNav && window.getComputedStyle(outerNav).display !== "none"),
          },
          unifiedHeader: {
            clientHeight: unifiedHeader?.clientHeight ?? 0,
            offsetHeight: unifiedHeader?.offsetHeight ?? 0,
          },
          previewToolbarInPreview: {
            clientHeight: legacyToolbarInPreview?.clientHeight ?? 0,
            offsetHeight: legacyToolbarInPreview?.offsetHeight ?? 0,
          },
          formScroll: {
            clientHeight: formScroll?.clientHeight ?? 0,
          },
          pdfContainer: {
            clientHeight: pdfContainer?.clientHeight ?? 0,
            clientWidth: pdfContainer?.clientWidth ?? 0,
          },
          pdfCanvas: {
            clientHeight: pdfCanvas?.clientHeight ?? 0,
            clientWidth: pdfCanvas?.clientWidth ?? 0,
          },
          horizontalOverflow: docWidth > winWidth,
        };
      });

      // Save post metrics JSON
      fs.writeFileSync(
        path.join(EVIDENCE_DIR, `post_${vp.name}.json`),
        JSON.stringify(metrics, null, 2),
        "utf-8"
      );

      // Verify no horizontal overflow
      expect(metrics.horizontalOverflow).toBe(false);

      // Verify outer nav is eliminated
      expect(metrics.outerNav.isVisible).toBe(false);

      // Verify no duplicate toolbar in preview panel
      expect(metrics.previewToolbarInPreview.offsetHeight).toBe(0);

      // Verify header height
      if (vp.width < 1024) {
        expect(metrics.unifiedHeader.offsetHeight).toBeLessThanOrEqual(56);
      } else {
        expect(metrics.unifiedHeader.offsetHeight).toBeLessThanOrEqual(64);
      }
    });
  }
});
