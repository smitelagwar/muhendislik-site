import { test, expect } from "./helpers/test";
import { openPdf, waitSharp } from "./helpers/viewer";
import type { PdfEngine } from "@/lib/dokumantasyon/studio/pdf/engine/engine";

test.describe("PDF v5 A5 — Performans, bellek ve uyumluluk (H17, H19, H20, H21, H22, H23)", () => {
  test("fit-width karışık boyutlu belgede geçerli sayfaya göre", async ({ page }) => {
    await openPdf(page, "karisik-boyut");
    await waitSharp(page);

    // manifest.json: sayfa 1 = A4 Dikey (595.28x841.89), sayfa 2 = A3 Yatay (1190.55x841.89)
    await page.evaluate(() => {
      const eng = (window as unknown as { __pdfEngine: PdfEngine }).__pdfEngine;
      eng.scrollToPage(2, 0, "auto");
    });
    await page.waitForTimeout(400);

    await page.keyboard.press("Control+2");
    await page.waitForTimeout(1500);

    const { pageW, expectedW } = await page.evaluate(() => {
      const scroller = document.querySelector<HTMLElement>('[data-testid="pdf-scroll-viewport"]');
      const p2 = scroller?.querySelector<HTMLElement>('[data-page="2"]');
      return {
        pageW: p2 ? p2.getBoundingClientRect().width : 0,
        expectedW: scroller ? scroller.clientWidth - 24 : 0,
      };
    });

    expect(expectedW).toBeGreaterThan(100);
    expect(Math.abs(pageW - expectedW)).toBeLessThanOrEqual(3);
  });

  test("DPR değişince tile çözünürlüğü güncellenir", async ({ page, cdp }) => {
    expect(cdp).not.toBeNull();
    await cdp!.send("Emulation.setDeviceMetricsOverride", {
      width: 1366,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await openPdf(page, "tr-metin");
    await waitSharp(page);
    await page.waitForSelector(
      '[data-testid="pdf-scroll-viewport"] [data-page="1"] canvas[data-layer="sharp"]',
      { timeout: 10_000 }
    );

    const readRatio = async () =>
      page.evaluate(() => {
        const scroller = document.querySelector<HTMLElement>('[data-testid="pdf-scroll-viewport"]');
        const p1 = scroller?.querySelector<HTMLElement>('[data-page="1"]');
        const canvas = p1?.querySelector<HTMLCanvasElement>('canvas[data-layer="sharp"]');
        if (!p1 || !canvas) return 0;
        const cssW = canvas.getBoundingClientRect().width || 1;
        return canvas.width / cssW;
      });

    await expect.poll(readRatio, { timeout: 5000 }).toBeGreaterThanOrEqual(0.95);
    const r1 = await readRatio();
    expect(r1).toBeGreaterThanOrEqual(0.95);
    expect(r1).toBeLessThanOrEqual(1.05);

    await cdp!.send("Emulation.setDeviceMetricsOverride", {
      width: 1366,
      height: 800,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await page.waitForTimeout(3000);

    const r2 = await readRatio();
    expect(r2).toBeGreaterThanOrEqual(1.9);
    expect(r2).toBeLessThanOrEqual(2.1);
  });

  test("düşük zoomda mount edilen sayfa sayısı sınırlı", async ({ page }) => {
    await openPdf(page, "metin-1000");
    await waitSharp(page);

    await page.evaluate(() => {
      const eng = (window as unknown as { __pdfEngine: PdfEngine }).__pdfEngine;
      eng.setViewport(1366, 2000);
      eng.scrollToPage(200, 0, "auto");
      eng.setScale(0.2);
    });
    await page.waitForTimeout(2500);

    const mountedCount = await page.evaluate(
      () =>
        document.querySelectorAll('[data-testid="pdf-scroll-viewport"] [data-page]').length
    );
    expect(mountedCount).toBeGreaterThan(0);
    expect(mountedCount).toBeLessThanOrEqual(36);
  });

  test("yazdırma iframe'i gizli değil", async ({ page }) => {
    await openPdf(page, "tr-metin");
    await waitSharp(page);

    await page.keyboard.press("Control+p");
    const iframeLoc = page.locator('[data-testid="pdf-print-iframe"]');
    await expect(iframeLoc).toBeAttached({ timeout: 5000 });

    const info = await page.evaluate(() => {
      const f = document.querySelector<HTMLElement>('[data-testid="pdf-print-iframe"]');
      if (!f) return null;
      const cs = getComputedStyle(f);
      const rect = f.getBoundingClientRect();
      return {
        visibility: cs.visibility,
        width: rect.width,
      };
    });

    expect(info).not.toBeNull();
    expect(info!.visibility).not.toBe("hidden");
    expect(info!.width).toBeGreaterThanOrEqual(100);
  });
});
