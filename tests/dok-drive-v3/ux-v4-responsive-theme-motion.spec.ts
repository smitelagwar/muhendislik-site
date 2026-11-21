import { test, expect, type Page } from "@playwright/test";
import { mockMixedExplorerData } from "./explorer-fixture";

function attachErrorTracker(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

const VIEWPORTS = [
  { name: "320x568", width: 320, height: 568, isMobile: true },
  { name: "390x844", width: 390, height: 844, isMobile: true },
  { name: "768x1024", width: 768, height: 1024, isMobile: false },
  { name: "1024x768", width: 1024, height: 768, isMobile: false },
  { name: "1366x768", width: 1366, height: 768, isMobile: false },
  { name: "1920x1080", width: 1920, height: 1080, isMobile: false },
] as const;

test.describe("Senaryo S6 — Responsive Matris, Tema Eşliği (Light + Dark) & Hareket Azaltma", () => {
  test("S6.1: Tüm responsive viewport boyutlarında yatay taşma yok ve gezgin görünür", async ({ page }) => {
    const errors = attachErrorTracker(page);
    await mockMixedExplorerData(page);

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });

      await expect(page.getByTestId("dok-explorer-viewport")).toBeVisible();
      await expect(page.getByTestId("dok-file-name").first()).toBeVisible();

      const overflowCheck = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(
        overflowCheck.scrollWidth,
        `${vp.name} viewport'unda yatay taşma olmamalı`
      ).toBeLessThanOrEqual(overflowCheck.clientWidth + 1);
    }

    expect(errors).toEqual([]);
  });

  for (const theme of ["dark", "light"] as const) {
    test(`S6.2: ${theme.toUpperCase()} temada liste, grid, sağ tık menüsü ve detay çekmecesi okunaklı`, async ({ page }) => {
      const errors = attachErrorTracker(page);
      await page.addInitScript((selectedTheme) => {
        window.localStorage.setItem("theme", selectedTheme);
      }, theme);

      await mockMixedExplorerData(page);
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });

      await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

      // Tema sınıfı doğrulama
      await expect
        .poll(async () => {
          return page.evaluate(() => document.documentElement.classList.contains("dark"));
        })
        .toBe(theme === "dark");

      // Arka plan ve metin rengi kontrastlı ve birbirinden farklı olmalı
      const contrastCheck = await page.evaluate(() => {
        const bodyStyle = getComputedStyle(document.body);
        const fileName = document.querySelector('[data-testid="dok-file-name"]');
        const nameStyle = fileName ? getComputedStyle(fileName) : null;
        return {
          bodyBg: bodyStyle.backgroundColor,
          bodyColor: bodyStyle.color,
          nameColor: nameStyle?.color ?? "",
          nameOpacity: nameStyle ? Number(nameStyle.opacity) : 0,
        };
      });
      expect(contrastCheck.bodyBg).not.toBe(contrastCheck.bodyColor);
      expect(contrastCheck.nameColor).not.toBe(contrastCheck.bodyBg);
      expect(contrastCheck.nameOpacity).toBeGreaterThan(0.5);

      // Grid görünümüne geç ve kartı doğrula
      await page.getByRole("button", { name: "Kart (Grid) Görünümü", exact: true }).click();
      await expect(page.getByTestId("dok-file-card").first()).toBeVisible();

      // Sağ tık menüsü aç ve okunabilir olduğunu doğrula
      await page.getByTestId("dok-file-card").first().click({ button: "right", position: { x: 12, y: 12 } });
      await expect(page.getByRole("menu")).toBeVisible();
      await page.keyboard.press("Escape");

      // Detay çekmecesini aç
      await page.getByRole("button", { name: /Detay|Bilgi/i }).first().click();
      await expect(page.getByTestId("dok-drawer-tab-info")).toBeVisible();

      expect(errors).toEqual([]);
    });
  }

  test("S6.3: prefers-reduced-motion: reduce altında hareket azaltma aktif", async ({ page }) => {
    const errors = attachErrorTracker(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockMixedExplorerData(page);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });

    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    const reducedMotionResult = await page.evaluate(() => {
      const matches = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const row = document.querySelector('[data-testid="dok-file-row"]');
      const rowStyle = row ? getComputedStyle(row) : null;
      return {
        matches,
        animationDuration: rowStyle?.animationDuration ?? "0s",
        transitionDuration: rowStyle?.transitionDuration ?? "0s",
      };
    });

    expect(reducedMotionResult.matches).toBe(true);
    expect(["0s", "0ms", "0.001ms"]).toContain(reducedMotionResult.animationDuration);
    expect(errors).toEqual([]);
  });

  for (const phoneSize of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ]) {
    test(`S6.4: Telefon (${phoneSize.width}x${phoneSize.height}) strict Seç modu ve Görünüm/Düzen paneli`, async ({ page }) => {
      const errors = attachErrorTracker(page);
      await mockMixedExplorerData(page);
      await page.setViewportSize(phoneSize);
      await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });

      await expect(page.getByTestId("dok-phone-appbar")).toBeVisible();
      await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

      // Normal modda checkbox görünmez
      await expect(page.locator("[data-selection-control]:visible")).toHaveCount(0);

      // Seç moduna gir
      if (await page.getByTestId("dok-phone-more").isVisible()) {
        await page.getByTestId("dok-phone-more").click();
      }
      await page.getByTestId("dok-selection-mode").click();
      await expect(page.locator("[data-selection-control]:visible").first()).toBeVisible();

      // Seç modundan çık
      await page.getByTestId("dok-selection-mode").click();
      await expect(page.locator("[data-selection-control]:visible")).toHaveCount(0);

      // Görünüm ve düzen panelinden sıralama / görünüm değiştir
      await page.getByTestId("dok-phone-more").click();
      await page.getByRole("button", { name: "Görünüm ve düzen", exact: true }).click();
      await page.getByLabel("Görünüm", { exact: true }).selectOption("grid");
      await page.getByRole("button", { name: "Uygula", exact: true }).click();

      await expect(page.getByTestId("dok-file-card").first()).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});
