import { test, expect } from "@playwright/test";
import { openPdf, SCROLL, waitSharp, waitZoomSettled, anchorAt, anchorDrift } from "./helpers/viewer";
import { v5State, collectErrors } from "./helpers/v5";

test.describe("PDF V5 A3 — Klavye, Gezinme, Konum Kaydı ve Arama (H8, H9, H10, H11, H12, H15, H16)", () => {
  test("1. Ctrl+Shift+- saat yönü tersi döndürür", async ({ page }) => {
    const errs = collectErrors(page);
    await openPdf(page, "tr-metin");
    await waitSharp(page);

    await page.keyboard.press("Control+Shift+Equal");
    await page.waitForTimeout(150);
    expect((await v5State(page)).rot).toBe(90);

    await page.keyboard.press("Control+Shift+Minus");
    await page.waitForTimeout(150);
    expect((await v5State(page)).rot).toBe(0);

    expect(errs.filter((e) => e.includes("Maximum update depth"))).toEqual([]);
  });

  test("2. PageDown/PageUp/Space/oklar kaydırır (odak body iken)", async ({ page }) => {
    const errs = collectErrors(page);
    await openPdf(page, "uzun-300");
    await waitSharp(page);

    // Odağı body'ye al (scroller dışına tıklamadan)
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    const clientHeight = await page.evaluate(
      (SEL) => (document.querySelector(SEL) as HTMLElement).clientHeight,
      SCROLL
    );
    const expectedStep = clientHeight * 0.9;

    await page.keyboard.press("PageDown");
    await page.waitForTimeout(100);
    const s1 = await v5State(page);
    expect(s1.scrollTop).toBeGreaterThanOrEqual(expectedStep * 0.95);
    expect(s1.scrollTop).toBeLessThanOrEqual(expectedStep * 1.05);

    await page.keyboard.press("PageUp");
    await page.waitForTimeout(100);
    const s2 = await v5State(page);
    expect(s2.scrollTop).toBeLessThanOrEqual(5);

    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);
    const s3 = await v5State(page);
    expect(s3.scrollTop).toBeGreaterThanOrEqual(54);
    expect(s3.scrollTop).toBeLessThanOrEqual(58);

    await page.keyboard.press("Space");
    await page.waitForTimeout(100);
    const s4 = await v5State(page);
    expect(s4.scrollTop - s3.scrollTop).toBeGreaterThanOrEqual(expectedStep * 0.95);
    expect(s4.scrollTop - s3.scrollTop).toBeLessThanOrEqual(expectedStep * 1.05);

    await page.keyboard.press("Shift+Space");
    await page.waitForTimeout(100);
    const s5 = await v5State(page);
    expect(Math.abs(s5.scrollTop - s3.scrollTop)).toBeLessThanOrEqual(5);

    expect(errs.filter((e) => e.includes("Maximum update depth"))).toEqual([]);
  });

  test("3. Space basılı tutma el aracını açar, sayfa kaydırmaz", async ({ page }) => {
    const errs = collectErrors(page);
    await openPdf(page, "uzun-300");
    await waitSharp(page);

    const before = await v5State(page);
    await page.keyboard.down("Space");
    await page.waitForTimeout(400);
    const hasGrab = await page.evaluate(
      (SEL) => (document.querySelector(SEL) as HTMLElement).className.includes("cursor-grab"),
      SCROLL
    );
    expect(hasGrab).toBe(true);
    await page.keyboard.up("Space");
    await page.waitForTimeout(100);

    const after = await v5State(page);
    expect(after.scrollTop).toBe(before.scrollTop);
    expect(errs.filter((e) => e.includes("Maximum update depth"))).toEqual([]);
  });

  test("4. klavye zoom imleç belge üzerindeyken animasyonlu ve çıpa sabit", async ({ page }) => {
    const errs = collectErrors(page);
    await openPdf(page, "karisik-60");
    await waitSharp(page);

    const p1Box = await page.locator(`${SCROLL} [data-page="1"]`).boundingBox();
    expect(p1Box).not.toBeNull();
    const x = Math.round(p1Box!.x + p1Box!.width * 0.45);
    const y = Math.round(p1Box!.y + p1Box!.height * 0.35);

    await page.mouse.move(x, y);
    const anchor = await anchorAt(page, x, y);

    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Control+Equal");
    }
    await waitZoomSettled(page);

    const drift = await anchorDrift(page, anchor, x, y);
    expect(drift).toBeLessThanOrEqual(3);
    expect(errs.filter((e) => e.includes("Maximum update depth"))).toEqual([]);
  });

  test("5. scrubber sürüklerken görünüm kayar", async ({ page }) => {
    const errs = collectErrors(page);
    await openPdf(page, "uzun-300");
    await waitSharp(page);

    const track = page.locator('[data-testid="pdf-scrubber-track"]');
    const box = await track.boundingBox();
    expect(box).not.toBeNull();

    const cx = box!.x + box!.width / 2;
    const startY = box!.y + 12;
    const midY = box!.y + box!.height * 0.5;

    await page.mouse.move(cx, startY);
    await page.mouse.down();
    await page.mouse.move(cx, midY, { steps: 8 });
    await page.waitForTimeout(100);

    const during = await v5State(page);
    await page.mouse.up();

    expect(during.cur).toBeGreaterThan(20);
    expect(errs.filter((e) => e.includes("Maximum update depth"))).toEqual([]);
  });

  test("6. okuma konumu sayfa içi oran ile kaydedilir ve yeniden açılınca geri gelir", async ({ page }) => {
    const errs = collectErrors(page);
    await openPdf(page, "uzun-300");
    await waitSharp(page);

    await page.evaluate((SEL) => {
      const eng = (window as unknown as { __pdfEngine: { scrollToPage(p: number, fy?: number, b?: ScrollBehavior): void } }).__pdfEngine;
      eng.scrollToPage(40, 0, "auto");
      const sc = document.querySelector(SEL) as HTMLElement;
      sc.scrollBy(0, 300);
    }, SCROLL);

    await page.waitForTimeout(900);

    const saved = await page.evaluate(() => {
      const eng = (window as unknown as { __pdfEngine: { getPosition(): { page: number; fy: number } } }).__pdfEngine;
      return eng.getPosition();
    });
    expect(saved.page).toBe(40);
    expect(saved.fy).toBeGreaterThan(0.05);

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(`${SCROLL} [data-page-state="rendered"]`, { timeout: 90_000 });
    await page.waitForTimeout(400);
    await waitSharp(page);

    const restored = await page.evaluate(() => {
      const eng = (window as unknown as { __pdfEngine: { getPosition(): { page: number; fy: number } } }).__pdfEngine;
      return eng.getPosition();
    });
    expect(restored.page).toBe(saved.page);
    expect(Math.abs(restored.fy - saved.fy)).toBeLessThanOrEqual(0.02);
    expect(errs.filter((e) => e.includes("Maximum update depth"))).toEqual([]);
  });

  test("7. geri geçmişi zoom sonrası doğru yere döner", async ({ page }) => {
    const errs = collectErrors(page);
    await openPdf(page, "uzun-300");
    await waitSharp(page);

    await page.evaluate(() => {
      const eng = (window as unknown as { __pdfEngine: { scrollToPage(p: number, fy?: number, b?: ScrollBehavior): void } }).__pdfEngine;
      eng.scrollToPage(8, 0.25, "auto");
    });
    await page.waitForTimeout(200);
    const startPage = (await v5State(page)).cur;
    expect(startPage).toBe(8);

    // Kenar çubuğunu aç ve sayfa 20 küçük resmine tıkla
    await page.keyboard.press("F4");
    const sidebarScroller = page.locator('[data-testid="pdf-navigation-sidebar"] .overflow-y-auto');
    await expect(sidebarScroller).toBeVisible();
    await sidebarScroller.evaluate((el) => {
      el.scrollTop = 19 * 160;
    });
    await page.waitForTimeout(150);
    await page.locator('[data-testid="pdf-thumbnail-20"]').click();
    await page.waitForTimeout(1000);
    expect((await v5State(page)).cur).toBe(20);

    // Zoom yap
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Control+Equal");
    }
    await waitZoomSettled(page);

    // Alt+ArrowLeft ile geri dön
    await page.keyboard.press("Alt+ArrowLeft");
    await page.waitForTimeout(1000);

    const after = await v5State(page);
    expect(Math.abs(after.cur - startPage)).toBeLessThanOrEqual(1);
    expect(errs.filter((e) => e.includes("Maximum update depth"))).toEqual([]);
  });

  test("8. arama: sonraki eşleşme ekranda", async ({ page }) => {
    const errs = collectErrors(page);
    await openPdf(page, "tr-metin");
    await waitSharp(page);

    await page.keyboard.press("Control+f");
    const searchInput = page.locator('[data-testid="pdf-search-bar"] input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("araştırma");
    await page.waitForTimeout(800);

    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Control+g");
      await page.waitForTimeout(800);

      const inViewport = await page.evaluate((SEL) => {
        const sc = document.querySelector(SEL) as HTMLElement | null;
        const active = sc?.querySelector<HTMLElement>('[data-active-match="true"]');
        if (!sc || !active) return false;
        const vr = sc.getBoundingClientRect();
        const r = active.getBoundingClientRect();
        return r.width > 0 && r.top >= vr.top && r.bottom <= vr.bottom && r.left >= vr.left && r.right <= vr.right;
      }, SCROLL);
      expect(inViewport).toBe(true);
    }

    expect(errs.filter((e) => e.includes("Maximum update depth"))).toEqual([]);
  });

  test("9. arama sürerken kenar çubuğu açmak konumu bozmaz", async ({ page }) => {
    const errs = collectErrors(page);
    await openPdf(page, "uzun-300");
    await waitSharp(page);

    await page.keyboard.press("Control+f");
    const searchInput = page.locator('[data-testid="pdf-search-bar"] input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Sayfa 10");
    await page.waitForTimeout(800);

    await page.evaluate(() => {
      const eng = (window as unknown as { __pdfEngine: { scrollToPage(p: number, fy?: number, b?: ScrollBehavior): void } }).__pdfEngine;
      eng.scrollToPage(5, 0, "auto");
    });
    await page.waitForTimeout(200);
    expect((await v5State(page)).cur).toBe(5);

    // Odak arama kutusundan çıkıp F4'e basılsın
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("F4");
    await page.waitForTimeout(1500);

    expect((await v5State(page)).cur).toBe(5);
    expect(errs.filter((e) => e.includes("Maximum update depth"))).toEqual([]);
  });
});
