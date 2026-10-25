import { test, expect } from "@playwright/test";

test.describe("Aşama 08 — İki Yüzlü Betonarme Perde Duvar Donatı Sahnesi", () => {
  test("Perde katalogdan açılır; ön/arka yüz gövde donatısı, sol/sağ uç bölgeleri ve bağlayıcı çirozlar ayrı seçilir; kesit, patlatma ve bütçe sınırı geçer", async ({
    page,
  }) => {
    await page.goto("/kategori/araclar/simulasyonlar", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("simulation-catalog-page")).toBeVisible();
    const wallCard = page.getByTestId("simulation-card-perde-detayi");
    await expect(wallCard).toBeVisible();

    await wallCard.click();
    await expect(page).toHaveURL(
      /\/kategori\/araclar\/simulasyonlar\/perde-detayi/,
    );

    const canvasHost = page.getByTestId("simulation-canvas-host");
    await expect(canvasHost).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId("simulation-scene-title")).toContainText(
      "P1 Eğitim Örneği — 2400×300 mm İki Yüzlü Betonarme Perde Duvar",
    );

    // 1. Ön yüz (Y=-102 mm) ve Arka yüz (Y=+102 mm) çift sıra konumlarının raporlandığını ve draw-call bütçesinin <= 20 olduğunu doğrula
    const dimSummary = page.getByTestId("drawing-2d-dimensions-summary");
    await expect(dimSummary).toHaveAttribute("data-front-face-y-mm", "-102");
    await expect(dimSummary).toHaveAttribute("data-back-face-y-mm", "102");

    const drawCalls = Number(
      (await canvasHost.getAttribute("data-draw-calls")) ?? "99",
    );
    expect(drawCalls).toBeGreaterThan(0);
    expect(drawCalls).toBeLessThanOrEqual(20);

    // 2. 2B iki yüzlü yatay enkesit üzerinden Ön Yüz gövde çubuğu, Arka Yüz gövde çubuğu, Sol Uç Bölge çubuğu ve Bağlayıcı Çiroz ayrı ayrı seçilmeli
    await page.getByTestId("sec-part-wall-web-vert-1-front-x-500").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "wall-web-vert-1-front-x-500",
    );
    await expect(page.getByTestId("selected-part-title")).toContainText(
      "Ön Yüz (Y=-102 mm)",
    );

    await page.getByTestId("sec-part-wall-web-vert-6-back-x-500").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "wall-web-vert-6-back-x-500",
    );
    await expect(page.getByTestId("selected-part-title")).toContainText(
      "Arka Yüz (Y=+102 mm)",
    );

    await page
      .getByTestId("sec-part-wall-boundary-bar-1-left-front-x1145")
      .click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "wall-boundary-bar-1-left-front-x1145",
    );
    await expect(page.getByTestId("selected-part-title")).toContainText(
      "Sol Perde Uç Bölgesi Boyuna Donatısı #1",
    );

    await page.getByTestId("sec-part-wall-crosstie-10-x-250-z1500").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "wall-crosstie-10-x-250-z1500",
    );
    await expect(page.getByTestId("selected-part-title")).toContainText(
      "Perde Yüzler Arası Bağlayıcı Çiroz #10",
    );

    // 3. Kesit ve Patlatma akışı: Z=1500 mm (sol+sağ 2 uç etriye halkası) vs Z=650 mm (0 uç etriye halkası)
    await page.getByTestId("quick-cut-z-1500").click();
    await expect(canvasHost).toHaveAttribute("data-section-enabled", "true");
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "1500");
    await expect(page.getByTestId("actual-cut-stirrup-ring")).toHaveCount(2);

    await page.getByTestId("quick-cut-z-650").click();
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "650");
    await expect(page.getByTestId("actual-cut-stirrup-ring")).toHaveCount(0);

    await page.getByTestId("explode-preset-70").click();
    await expect(canvasHost).toHaveAttribute("data-explode-percent", "70");
    await expect(canvasHost).toHaveAttribute("data-section-enabled", "false");
    await expect(page.getByTestId("explode-educational-disclaimer")).toBeVisible();

    await page.getByTestId("learning-reset-btn").click();
    await expect(canvasHost).toHaveAttribute("data-explode-percent", "0");
    await expect(canvasHost).toHaveAttribute("data-selected-part-id", "");
  });
});
