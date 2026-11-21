import { test, expect } from "@playwright/test";
import { mockExplorerData } from "./explorer-fixture";

test.describe("UX V5 Paket 1 — Seçim Görselliği, 3-Durum Checkbox, Dock & Cockpit", () => {
  test("S1.1 — Seçili satırda 4 kenarlı turuncu kafes yok, sol 3px accent rayı var", async ({ page }) => {
    await mockExplorerData(page, 6);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible({ timeout: 8000 });

    await page.getByTestId("dok-select-all").click();
    const selectedRows = page.locator('[data-testid="dok-file-row"][data-selected="true"]');
    await expect(selectedRows).toHaveCount(6);

    await expect
      .poll(
        async () =>
          selectedRows.first().evaluate((el) => {
            const cs = getComputedStyle(el);
            return {
              borderTopColor: cs.borderTopColor,
              borderBottomColor: cs.borderBottomColor,
              boxShadow: cs.boxShadow,
            };
          }),
        { timeout: 3000 }
      )
      .toEqual(
        expect.objectContaining({
          boxShadow: expect.stringContaining("3px 0px"),
        })
      );

    const styles = await selectedRows.first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        borderTopColor: cs.borderTopColor,
        borderBottomColor: cs.borderBottomColor,
      };
    });

    expect(styles.borderTopColor).not.toContain("245, 158, 11");
    expect(styles.borderBottomColor).not.toContain("245, 158, 11");
  });

  test("S1.2 — 3-durumlu DriveCheckbox (false / mixed / true)", async ({ page }) => {
    await mockExplorerData(page, 5);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible({ timeout: 8000 });

    const selectAll = page.getByTestId("dok-select-all");
    await expect(selectAll).toHaveAttribute("aria-checked", "false");

    await page.locator('[data-file-id="file-000"]').click({ position: { x: 100, y: 16 } });
    await expect(selectAll).toHaveAttribute("aria-checked", "mixed");

    await selectAll.click();
    await expect(selectAll).toHaveAttribute("aria-checked", "true");
  });

  test("S1.3 — Yüzen Seçim Kapsülü, Tersine Çevir, sıfır tekrar ve Esc temizliği", async ({ page }) => {
    await mockExplorerData(page, 5);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible({ timeout: 8000 });

    await page.locator('[data-file-id="file-000"]').click({ position: { x: 100, y: 16 } });
    await page.locator('[data-file-id="file-001"]').click({ position: { x: 100, y: 16 }, modifiers: ["Control"] });

    const dock = page.getByTestId("dok-mobile-selection-dock");
    await expect(dock).toBeVisible();
    await expect(page.locator('[aria-label^="Seçilenleri Sil"]')).toHaveCount(0);
    await expect(page.getByTestId("dok-status-selection")).toHaveCount(0);

    await page.getByTestId("dok-invert-selection").click();
    // 1 klasör + 5 dosya = 6 toplam; 2 seçiliydi -> kalan 4 öğe seçili olmalı
    await expect(page.locator('[data-selected="true"]')).toHaveCount(4);
    await expect(page.locator('[data-file-id="file-000"]')).toHaveAttribute("data-selected", "false");
    await expect(page.locator('[data-file-id="file-001"]')).toHaveAttribute("data-selected", "false");

    await page.keyboard.press("Escape");
    await expect(page.locator('[data-selected="true"]')).toHaveCount(0);
    await expect(dock).toHaveCount(0);
  });

  for (const vp of [
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
  ]) {
    test(`S1.4 — Cockpit başlık kırpılmıyor ve dış scroll yok (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize(vp);
      await mockExplorerData(page, 12);
      await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
      await expect(page.getByTestId("dok-file-row").first()).toBeVisible({ timeout: 8000 });

      const header = page.getByTestId("dok-admin-header");
      await expect(header).toBeVisible();
      const headerBox = await header.boundingBox();
      expect(headerBox).not.toBeNull();
      expect(headerBox!.y).toBeGreaterThanOrEqual(0);

      const layoutMetrics = await page.evaluate(() => {
        const nav = document.querySelector("header");
        const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
        return {
          navBottom,
          scrollHeight: document.documentElement.scrollHeight,
          innerHeight: window.innerHeight,
        };
      });

      if (layoutMetrics.navBottom > 0) {
        expect(headerBox!.y).toBeGreaterThanOrEqual(layoutMetrics.navBottom - 1);
      }
      expect(layoutMetrics.scrollHeight).toBeLessThanOrEqual(layoutMetrics.innerHeight + 2);
    });
  }

  test("S1.5 — Warm Amber Marquee + canlı öğe sayacı", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await mockExplorerData(page, 3);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible({ timeout: 8000 });

    const viewport = page.getByTestId("dok-explorer-viewport");
    const vpBox = (await viewport.boundingBox())!;
    const targetRow = page.locator('[data-file-id="file-002"]');
    const rowBox = (await targetRow.boundingBox())!;

    const startX = vpBox.x + vpBox.width - 50;
    const startY = vpBox.y + vpBox.height - 40;
    const endX = rowBox.x + 160;
    const endY = rowBox.y + 12;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 8 });

    const marquee = page.getByTestId("dok-marquee-box");
    await expect(marquee).toBeVisible();
    await expect(marquee).toContainText(/\d+\s*öğe/);

    const marqueeClass = await marquee.getAttribute("class");
    expect(marqueeClass).toContain("border-amber-500");
    const borderColor = await marquee.evaluate((el) => getComputedStyle(el).borderColor);
    expect(borderColor).not.toContain("59, 130, 246");

    await page.mouse.up();
    await expect(page.locator('[data-selected="true"]').first()).toBeVisible();
  });
});
