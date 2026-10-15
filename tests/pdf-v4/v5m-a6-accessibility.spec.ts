import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./helpers/test";
import { openPdf, signIn, uploadPdf, waitSharp } from "./helpers/viewer";

test.describe("PDF V5 A6 — Mobil görünüm ve erişilebilirlik", () => {
  test("320px görünümde taşma yok, temel dokunma alanları 44px ve ciddi axe ihlali yok", async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 320, height: 640 });
    await openPdf(page, "tr-metin");
    await waitSharp(page);

    const layout = await page.evaluate(() => {
      const toolbar = document.querySelector('[data-testid="pdf-viewer-toolbar"]');
      const targets = [
        'button[data-command-id="pdf.page.previous"]',
        'button[data-command-id="pdf.page.next"]',
        'button[data-command-id="pdf.search.open"]',
        'button[data-command-id="pdf.zoom.in"]',
        'button[data-testid="pdf-viewer-more-menu-trigger"]',
      ];
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        toolbarCount: document.querySelectorAll('[data-testid="pdf-viewer-toolbar"]').length,
        toolbarName: toolbar?.getAttribute("aria-label")?.trim() ?? "",
        touchTargets: targets.map((selector) => {
          const rect = document.querySelector(selector)?.getBoundingClientRect();
          return rect ? { selector, width: rect.width, height: rect.height } : { selector, width: 0, height: 0 };
        }),
      };
    });

    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect(layout.toolbarCount).toBe(1);
    expect(layout.toolbarName).not.toBe("");
    for (const target of layout.touchTargets) {
      expect(target.width, `${target.selector} width`).toBeGreaterThanOrEqual(44);
      expect(target.height, `${target.selector} height`).toBeGreaterThanOrEqual(44);
    }

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const criticalOrSerious = axe.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious"
    );
    expect(
      criticalOrSerious.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        targets: violation.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  });

  test("kısayol yardımında klavye odağı modal içinde kalır ve Escape odağı geri verir", async ({ page }) => {
    test.setTimeout(60_000);
    await openPdf(page, "tr-metin");
    await waitSharp(page);

    const menuTrigger = page.getByTestId("pdf-viewer-more-menu-trigger");
    await menuTrigger.click();
    await page.getByTestId("pdf-shortcuts-btn").click();

    const dialog = page.getByTestId("pdf-shortcuts-modal");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
    const close = dialog.getByRole("button", { name: "Kapat" });
    const understood = dialog.getByRole("button", { name: "Anladım" });
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(understood).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(menuTrigger).toBeFocused();
  });

  test("system reduced-motion tercihi PDF görünümüne uygulanır", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openPdf(page, "tr-metin");
    await waitSharp(page);

    const reducedMotionState = await page.evaluate(() => ({
      mediaMatches: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      viewerClass: document.querySelector("[data-pdf-viewer-state]")?.classList.contains("reduce-motion") ?? false,
    }));
    expect(reducedMotionState.mediaMatches).toBe(true);
    expect(reducedMotionState.viewerClass).toBe(true);
  });

  test("mobil dosya yöneticisinden PDF açılır; geri dönüp yeniden açınca okuma sayfası korunur", async ({ page }) => {
    test.setTimeout(90_000);
    await signIn(page);
    const fileId = await uploadPdf(page, "uzun-300", `000-a9-mobile-${Date.now()}.pdf`);
    await page.goto("/dokumantasyon");

    const fileRow = page.locator(`[data-mobile-item][data-file-id="${fileId}"]`);
    await expect(fileRow).toBeVisible({ timeout: 20_000 });
    await fileRow.getByTestId("dok-file-name").click();
    await expect(page).toHaveURL(new RegExp(`/dokumantasyon/dosya/${fileId}`));
    await page.waitForSelector('[data-testid="pdf-scroll-viewport"] [data-page-state="rendered"]', { timeout: 90_000 });
    await waitSharp(page);

    await page.evaluate(() => {
      const engine = (window as unknown as { __pdfEngine?: { scrollToPage(page: number, fy?: number, behavior?: "auto" | "smooth"): void } }).__pdfEngine;
      engine?.scrollToPage(12, 0.2, "auto");
    });
    const viewer = page.getByTestId("pdf-scroll-viewport");
    await expect.poll(() => viewer.evaluate((element) => element.scrollTop), { timeout: 10_000 }).toBeGreaterThan(500);
    await page.waitForTimeout(900);
    const saved = await page.evaluate((id) => {
      const raw = localStorage.getItem("dok-pdf-reading-position:v2");
      const record = raw ? JSON.parse(raw)[id] : null;
      return record ? { page: record.page, offsetRatio: record.offsetRatio } : null;
    }, fileId);
    expect(saved?.page).toBeGreaterThanOrEqual(10);

    await page.goBack();
    await expect(page).toHaveURL(/\/dokumantasyon(?:\?.*)?$/);
    await expect(fileRow).toBeVisible();
    const savedAfterBack = await page.evaluate((id) => {
      const raw = localStorage.getItem("dok-pdf-reading-position:v2");
      const record = raw ? JSON.parse(raw)[id] : null;
      const sessionRaw = sessionStorage.getItem(`dok:pos:${id}`);
      const sessionRecord = sessionRaw ? JSON.parse(sessionRaw) : null;
      const preferred = sessionRecord ?? record;
      return preferred ? { page: preferred.page, offsetRatio: preferred.offsetRatio } : null;
    }, fileId);
    expect(savedAfterBack?.page).toBeGreaterThanOrEqual(10);

    await fileRow.getByTestId("dok-file-name").click();
    await expect(page).toHaveURL(new RegExp(`/dokumantasyon/dosya/${fileId}`));
    await page.waitForSelector('[data-testid="pdf-scroll-viewport"] [data-page-state="rendered"]', { timeout: 90_000 });
    await expect.poll(() => page.evaluate(() => {
      const engine = (window as unknown as { __pdfEngine?: { getPosition(): { page: number; fy: number } } }).__pdfEngine;
      return engine?.getPosition().page ?? 0;
    }), { timeout: 15_000 }).toBeGreaterThanOrEqual(savedAfterBack!.page);
    await expect.poll(() => viewer.evaluate((element) => element.scrollTop), { timeout: 5_000 }).toBeGreaterThan(500);
  });
});
