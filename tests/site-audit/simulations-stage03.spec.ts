import { test, expect } from "@playwright/test";

test.describe("Aşama 03 — 2B Çizim, 2B↔3B Kalıcı Seçim, Kontrollü Kesit ve 320/1366 px Taşma Kontrolü", () => {
  test("2B↔3B eşlemeli seçim, etriye merkezi vs boşluk kotu ayrımı, beton kapak prizması, reset ve 320/1366 px yatay taşma kontrolü", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    await page.goto("/kategori/araclar/simulasyonlar/kolon-detayi", {
      timeout: 45_000,
    });

    const canvasHost = page.locator('[data-testid="simulation-canvas-host"]');
    await canvasHost.waitFor({ state: "visible", timeout: 15_000 });

    // 1. Ölçü–model eşleşmesi (2B çizim özeti model boyutlarıyla aynı)
    const dimSummary = page.locator('[data-testid="drawing-2d-dimensions-summary"]');
    await dimSummary.waitFor({ state: "visible", timeout: 8_000 });
    await expect(dimSummary).toHaveAttribute("data-total-height-mm", "4280");
    await expect(dimSummary).toHaveAttribute("data-concrete-height-mm", "3200");
    await expect(dimSummary).toHaveAttribute("data-dowel-length-mm", "1080");
    await expect(dimSummary).toHaveAttribute("data-section-width-mm", "300");

    // 2. 2B boykesit üzerinden bir etriyeye tıklayınca hem 2B hem 3B hem bilgi kartında seçilmesi
    const svgStirrup10 = page.locator(
      '[data-testid="svg-part-stirrup-10-orta-bolge-z1125"]',
    );
    await svgStirrup10.scrollIntoViewIfNeeded();
    await svgStirrup10.click();

    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "stirrup-10-orta-bolge-z1125",
    );
    await expect(svgStirrup10).toHaveAttribute("data-selected", "true");
    await expect(page.locator('[data-testid="selected-part-title"]')).toContainText(
      "Etriye #10",
    );

    // 3. Yatay kesit kontrolü: Z=50 mm (etriye merkezi) vs Z=100 mm (boşluk) vs Z=3500 mm (filiz)
    const cutZ50Btn = page.locator('[data-testid="quick-cut-z-50"]');
    await cutZ50Btn.scrollIntoViewIfNeeded();
    await cutZ50Btn.click();

    await expect(canvasHost).toHaveAttribute("data-section-enabled", "true");
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "50");
    await expect(canvasHost).toHaveAttribute("data-concrete-cap-visible", "true");

    const intersectBadge = page.locator('[data-testid="section-intersect-badge"]');
    await expect(intersectBadge).toHaveAttribute("data-stirrup-hit-count", "1");
    await expect(page.locator('[data-testid="actual-cut-stirrup-ring"]')).toBeVisible();

    // Z=55 mm (tam yarıçap sınırı -> hâlâ kesilir)
    await page.locator('[data-testid="quick-cut-z-55"]').click();
    await expect(intersectBadge).toHaveAttribute("data-stirrup-hit-count", "1");

    // Z=100 mm (iki etriye arası boşluk -> etriye kesilmez, yalnız boyuna donatılar ve beton kesilir)
    await page.locator('[data-testid="quick-cut-z-100"]').click();
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "100");
    await expect(intersectBadge).toHaveAttribute("data-stirrup-hit-count", "0");
    await expect(page.locator('[data-testid="actual-cut-stirrup-ring"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="actual-cut-concrete-rect"]')).toBeVisible();

    // Temsilî enkesit ise aynı anda genel yerleşimi göstermeye devam eder
    await expect(page.locator('[data-testid="representative-section-svg"]')).toBeVisible();

    // Z=3500 mm (filiz bölgesi -> beton gövde üstü, beton kapak prizması gizlenir)
    await page.locator('[data-testid="quick-cut-z-3500"]').click();
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "3500");
    await expect(canvasHost).toHaveAttribute("data-concrete-cap-visible", "false");
    await expect(page.locator('[data-testid="actual-cut-concrete-rect"]')).toHaveCount(0);

    // 4. Seçili katmanı gizleyince 2B ve 3B seçiminin birlikte temizlenmesi ve Sıfırla (Reset)
    await page.locator('[data-testid="inspector-tab-layers"]').click();
    await page.locator('[data-testid="layer-toggle-stirrup"]').click();
    await expect(canvasHost).toHaveAttribute("data-selected-part-id", "");

    const resetBtn = page.locator('[data-testid="simulation-reset-btn"]');
    await resetBtn.scrollIntoViewIfNeeded();
    await resetBtn.click();
    await expect(canvasHost).toHaveAttribute("data-section-enabled", "false");
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "true");

    // 5. 1366 px ve 320 px genişliklerde yatay taşma (horizontal overflow) olmaması
    await page.setViewportSize({ width: 1366, height: 768 });
    const overflow1366 = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflow1366).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 320, height: 720 });
    // Mobilde 2B sekmesine geçiş ve okunabilirlik
    await page.locator('[data-testid="sim-tab-2d"]').click();
    await expect(page.locator('[data-testid="simulation-2d-preview"]')).toBeVisible();
    const overflow320 = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflow320).toBeLessThanOrEqual(1);

    expect(pageErrors).toEqual([]);
  });
});
