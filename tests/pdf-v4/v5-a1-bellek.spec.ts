import { test, expect } from "@playwright/test";
import type { PdfEngine } from "../../src/lib/dokumantasyon/studio/pdf/engine/engine";
import { openPdf, waitSharp } from "./helpers/viewer";
import { v5State, collectErrors } from "./helpers/v5";

test.describe("PDF v5 A1 — Bellek, sekme dönüşü ve render dayanıklılığı", () => {
  test("sekme gizle-göster sonrası bütçe geri gelir ve tuvaller dolu", async ({ page }) => {
    await openPdf(page, "karisik-60");
    await waitSharp(page);

    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(800);

    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(2500);

    const s1 = await v5State(page);
    expect(s1.sharpBudget).toBeGreaterThan(0);
    expect(s1.blankInView).toBe(0);
    expect(s1.sharpInView).toBeGreaterThanOrEqual(1);

    await page.evaluate(() => {
      const eng = (window as unknown as { __pdfEngine: PdfEngine }).__pdfEngine;
      eng.scrollToPage(20);
    });
    await page.waitForTimeout(3500);

    const s2 = await v5State(page);
    expect(s2.blankInView).toBe(0);
    expect(s2.sharpInView).toBeGreaterThanOrEqual(1);
  });

  test("ekrandaki tile'lar zorla tahliyede kurtarılır", async ({ page }) => {
    await openPdf(page, "karisik-60");
    await waitSharp(page);

    await page.evaluate(() => {
      const eng = (window as unknown as { __pdfEngine: PdfEngine }).__pdfEngine;
      eng.governor.trimTo(0);
      eng.governor.trimTo(1);
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(3000);

    const s = await v5State(page);
    expect(s.blankInView).toBe(0);
    expect(s.sharpInView).toBeGreaterThanOrEqual(1);
  });

  test("yüksek zoomda 'Maximum update depth' hatası yok", async ({ page }) => {
    const errs = collectErrors(page);
    await openPdf(page, "tr-metin");
    await waitSharp(page);

    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Control+Equal");
      await page.waitForTimeout(1500);
    }

    const depthErrs = errs.filter((e) => /Maximum update depth/.test(e));
    expect(depthErrs.length).toBe(0);
  });

  test("render hatasında 2 yeniden deneme sonrası retry düğmesi çıkar ve tıklanınca kurtarır", async ({ page }) => {
    await openPdf(page, "tr-metin");
    await waitSharp(page);

    await page.evaluate(() => {
      const w = window as unknown as { __failDraw?: boolean; __pdfEngine: PdfEngine };
      w.__failDraw = true;
      const orig = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (...args: unknown[]) {
        if (w.__failDraw) throw new Error("Sentetik render hatasi");
        return (orig as (...a: unknown[]) => unknown).apply(this, args);
      };
      w.__pdfEngine.governor.setVisible([]);
      w.__pdfEngine.governor.trimTo(0);
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    const retryBtn = page.getByTestId("pdf-page-retry-1");
    await expect(retryBtn).toBeVisible({ timeout: 6000 });
    await expect(page.getByTestId("pdf-page-1")).toHaveAttribute("data-page-state", "error");

    await page.evaluate(() => {
      (window as unknown as { __failDraw?: boolean }).__failDraw = false;
    });
    await retryBtn.click();

    await expect(page.getByTestId("pdf-page-1")).toHaveAttribute("data-page-state", "rendered", { timeout: 6000 });
    const s = await v5State(page);
    expect(s.blankInView).toBe(0);
    expect(s.sharpInView).toBeGreaterThanOrEqual(1);
  });
});
