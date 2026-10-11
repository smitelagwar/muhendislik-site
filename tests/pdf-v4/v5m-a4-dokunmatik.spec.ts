import { test, expect } from "./helpers/test";
import { openPdf, waitSharp, waitZoomSettled } from "./helpers/viewer";
import { doubleTap, pinchManual, swipe } from "./helpers/gestures";
import { v5State } from "./helpers/v5";

async function singleTapCdp(page: import("@playwright/test").Page, x: number, y: number): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, id: 0 }],
    });
    await page.waitForTimeout(20);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await cdp.detach().catch(() => {});
  }
}

test.describe("PDF V5 A4 — Dokunmatik ve Jest Dayanıklılığı (H13, H14, H24)", () => {
  test("1. kaydırma jesti araç çubuğunu değiştirmez", async ({ page }) => {
    await openPdf(page, "uzun-300");
    await waitSharp(page);

    const root = page.locator("[data-chrome-hidden]").first();
    await expect(root).toHaveAttribute("data-chrome-hidden", "false");

    await swipe(page, 195, 560, 260, 8);
    await page.waitForTimeout(300);
    await swipe(page, 195, 560, 260, 8);
    await page.waitForTimeout(300);
    await swipe(page, 195, 560, 260, 8);
    await page.waitForTimeout(600);

    const st = await v5State(page);
    expect(st.scrollTop).toBeGreaterThan(100);
    await expect(root).toHaveAttribute("data-chrome-hidden", "false");
  });

  test("2. gerçek tek dokunma araç çubuğunu gizler/gösterir", async ({ page }) => {
    await openPdf(page, "uzun-300");
    await waitSharp(page);

    const root = page.locator("[data-chrome-hidden]").first();
    await expect(root).toHaveAttribute("data-chrome-hidden", "false");

    await singleTapCdp(page, 195, 420);
    await page.waitForTimeout(450);
    await expect(root).toHaveAttribute("data-chrome-hidden", "true");

    await singleTapCdp(page, 195, 420);
    await page.waitForTimeout(450);
    await expect(root).toHaveAttribute("data-chrome-hidden", "false");
  });

  test("3. iki ardışık kaydırma zoom yapmaz", async ({ page }) => {
    await openPdf(page, "uzun-300");
    await waitSharp(page);

    const before = await v5State(page);

    // İki hızlı kaydırma; bitiş noktaları aynı (195, 320) ve touchend aralığı < 300ms
    await swipe(page, 195, 520, 320, 4);
    await page.waitForTimeout(80);
    await swipe(page, 195, 520, 320, 4);
    await page.waitForTimeout(350);

    const after = await v5State(page);
    expect(Math.abs(after.scale - before.scale)).toBeLessThan(1e-4);
  });

  test("4. çift dokunma hâlâ yakınlaştırır", async ({ page }) => {
    await openPdf(page, "tr-metin");
    await waitSharp(page);

    const before = await v5State(page);
    await doubleTap(page, 195, 420);
    await waitZoomSettled(page);

    const after = await v5State(page);
    expect(after.scale).toBeGreaterThan(before.scale * 1.15);
  });

  test("5. pinch lastik bant: jest ortasında aşım, bırakınca sınıra döner", async ({ page }) => {
    await openPdf(page, "karisik-60");
    await waitSharp(page);

    const maxS = await page.evaluate(() => {
      const eng = (window as unknown as {
        __pdfEngine: { maxScale(): number; setScale(s: number): void };
      }).__pdfEngine;
      const m = eng.maxScale();
      eng.setScale(m * 0.9);
      return m;
    });

    const p = await pinchManual(page, 195, 420, 40, 220, 10);
    const midScale = await page.evaluate(() => {
      const eng = (window as unknown as { __pdfEngine: { getScale(): number } }).__pdfEngine;
      return eng.getScale();
    });

    expect(midScale).toBeGreaterThan(maxS);
    expect(midScale).toBeLessThanOrEqual(maxS * 1.25 + 1e-4);

    await p.end();
    await page.waitForTimeout(900);

    const endScale = await page.evaluate(() => {
      const eng = (window as unknown as { __pdfEngine: { getScale(): number } }).__pdfEngine;
      return eng.getScale();
    });
    expect(endScale).toBeLessThanOrEqual(maxS + 1e-3);
  });
});
