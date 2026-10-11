import { test, expect } from "@playwright/test";
import type { PdfEngine } from "../../src/lib/dokumantasyon/studio/pdf/engine/engine";
import { openPdf, waitSharp, SCROLL } from "./helpers/viewer";
import { v5State } from "./helpers/v5";

interface TaggedEngine extends PdfEngine {
  __t?: number;
}

test.describe("PDF v5 A2 — Zoom yerleşimi, tile seçimi, döndürme", () => {
  test("karisik-60: tüm boyutlar yüklenince sayfa 1 yatayda görünür", async ({ page }) => {
    await openPdf(page, "karisik-60");
    await waitSharp(page);

    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const eng = (window as unknown as { __pdfEngine: PdfEngine }).__pdfEngine;
            return eng.getLayout().n;
          }),
        { timeout: 8000 }
      )
      .toBe(60);

    const s = await v5State(page);
    expect(s.viewRectP1).not.toBeNull();
    expect(s.viewRectP1!.w).toBeGreaterThanOrEqual(200);
  });

  test("karisik-60: klavye zoom ×4 boyunca geçerli sayfa ekranda ve dolu", async ({ page }) => {
    await openPdf(page, "karisik-60");
    await waitSharp(page);
    await page.mouse.move(683, 450);

    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Control+Equal");
      await page.waitForTimeout(1500);

      const vr = await page.evaluate(() => {
        const eng = (window as unknown as { __pdfEngine: PdfEngine }).__pdfEngine;
        return eng.viewRectInPage(eng.getCurrentPage());
      });
      expect(vr).not.toBeNull();
      expect(vr!.w).toBeGreaterThanOrEqual(100);
      expect(vr!.h).toBeGreaterThanOrEqual(100);
    }

    await page.waitForTimeout(2000); // son adımdan toplam 3500 ms
    const s = await v5State(page);
    expect(s.sharpInView).toBeGreaterThanOrEqual(1);
    expect(s.blankInView).toBe(0);
  });

  test("a0-vektor: yüksek zoomda sayfa içi kaydırma yeni tile çizer, tüm sayfa tile'lanmaz", async ({ page }) => {
    await openPdf(page, "a0-vektor");
    await waitSharp(page);

    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Control+Equal");
    }
    await page.waitForTimeout(4000);

    await page.evaluate((SEL) => {
      const sc = document.querySelector(SEL) as HTMLElement;
      sc.scrollBy(0, 1500);
    }, SCROLL);
    await page.waitForTimeout(4000);

    const s = await v5State(page);
    expect(s.sharpInView).toBeGreaterThanOrEqual(1);
    expect(s.blankInView).toBe(0);

    const tileCount = await page.evaluate(
      () => document.querySelectorAll('[data-page="1"] canvas[data-layer="sharp"]').length
    );
    expect(tileCount).toBeLessThanOrEqual(40);
  });

  test("döndürme konumu ve motoru korur", async ({ page }) => {
    await openPdf(page, "karisik-60");
    await waitSharp(page);

    await page.evaluate(() => {
      const eng = (window as unknown as { __pdfEngine: TaggedEngine }).__pdfEngine;
      eng.__t = 7;
      eng.scrollToPage(10);
    });
    await page.waitForTimeout(1500);

    await page.locator(SCROLL).focus();
    await page.keyboard.press("Control+Shift+Equal");
    await page.waitForTimeout(2500);

    const s = await v5State(page);
    const tag = await page.evaluate(() => {
      const eng = (window as unknown as { __pdfEngine: TaggedEngine }).__pdfEngine;
      return eng.__t;
    });

    expect(s.cur).toBe(10);
    expect(tag).toBe(7);
    expect(s.rot).toBe(90);
    expect(s.sharpInView).toBeGreaterThanOrEqual(1);
    expect(s.blankInView).toBe(0);
  });

  test("döndürme sonrası görüntü yönü doğru", async ({ page }) => {
    await openPdf(page, "tr-metin");
    await waitSharp(page);

    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Control+Shift+Equal");
      await page.waitForTimeout(2500);

      const ratios = await page.evaluate(() => {
        const box = document.querySelector('[data-testid="pdf-page-1"]') as HTMLElement | null;
        const canvas = box?.querySelector<HTMLCanvasElement>('canvas[data-layer="sharp"]') ?? null;
        if (!box || !canvas || !canvas.height) return null;
        const br = box.getBoundingClientRect();
        const boxRatio = br.width / br.height;
        const canvasRatio = canvas.width / canvas.height;
        const relDiff = Math.abs(boxRatio - canvasRatio) / boxRatio;
        return { boxRatio, canvasRatio, relDiff };
      });

      expect(ratios).not.toBeNull();
      expect(ratios!.relDiff).toBeLessThanOrEqual(0.03);
    }
  });
});
