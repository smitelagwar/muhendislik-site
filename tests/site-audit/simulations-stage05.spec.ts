import { test, expect } from "@playwright/test";

test.describe("Aşama 05 — Kiriş Donatı Sahnesi ve Kolon Kısa Regresyonu", () => {
  test("Katalogdan Kiriş açılır, mesnet ve açıklık bölgesi seçilir; katman, 2B eşleme, kesit (X) ve patlatma çalışır; Kolon kısa aç/gizle/reset regresyonu geçer", async ({
    page,
  }) => {
    // 1. Katalog sayfasını aç ve Kiriş kartının görünür olduğunu doğrula
    await page.goto("/kategori/araclar/simulasyonlar", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("simulation-catalog-page")).toBeVisible();
    await expect(page.getByTestId("simulation-card-kolon-detayi")).toBeVisible();
    const beamCard = page.getByTestId("simulation-card-kiris-detayi");
    await expect(beamCard).toBeVisible();

    // 2. Kiriş simülasyonunu aç
    await beamCard.click();
    await expect(page).toHaveURL(/\/kategori\/araclar\/simulasyonlar\/kiris-detayi/);

    const canvasHost = page.getByTestId("simulation-canvas-host");
    await expect(canvasHost).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId("simulation-scene-title")).toContainText(
      "K1 Eğitim Örneği — 300×500 mm Çerçeve Kirişi",
    );

    // 3. Mesnet sarılma bölgesi etriyesi ve orta açıklık bölgesi etriyesi seçimi (2B <-> 3B eşleme)
    await page
      .getByTestId("svg-part-beam-stirrup-1-sol-mesnet-sarilma-x50")
      .click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "beam-stirrup-1-sol-mesnet-sarilma-x50",
    );
    await expect(page.getByTestId("selected-part-title")).toContainText(
      "Sol Mesnet Sarılma Bölgesi",
    );

    await page
      .getByTestId("svg-part-beam-stirrup-16-aciklik-bolgesi-x1850")
      .click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "beam-stirrup-16-aciklik-bolgesi-x1850",
    );
    await expect(page.getByTestId("selected-part-title")).toContainText(
      "Orta Açıklık Bölgesi",
    );

    // 4. Katman gizleme/gösterme
    await page.getByTestId("toggle-concrete-btn").click();
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "false");
    await page.getByTestId("toggle-concrete-btn").click();
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "true");

    // 5. Düşey Kesit (X) kontrolü: X=250 mm (sol mesnet etriyesi + mesnet ilavesi) vs X=1950 mm (açıklık boşluğu)
    await page.getByTestId("quick-cut-z-250").click();
    await expect(canvasHost).toHaveAttribute("data-section-enabled", "true");
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "250");
    await expect(canvasHost).toHaveAttribute("data-concrete-cap-visible", "true");
    await expect(page.getByTestId("actual-cut-stirrup-ring")).toHaveCount(1);
    await expect(
      page.getByTestId("actual-cut-dowel-beam-support-extra-left"),
    ).toBeVisible();

    await page.getByTestId("quick-cut-z-1950").click();
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "1950");
    await expect(page.getByTestId("actual-cut-stirrup-ring")).toHaveCount(0);
    await expect(
      page.getByTestId("actual-cut-dowel-beam-support-extra-left"),
    ).toHaveCount(0);

    // 6. Patlatma (kesiti sıfırlar) ve Öğrenme adımı
    await page.getByTestId("explode-preset-70").click();
    await expect(canvasHost).toHaveAttribute("data-explode-percent", "70");
    await expect(canvasHost).toHaveAttribute("data-section-enabled", "false");

    await page.getByTestId("learning-step-btn-2").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "beam-support-extra-left",
    );

    // Sıfırla
    await page.getByTestId("simulation-reset-btn").click();
    await expect(canvasHost).toHaveAttribute("data-explode-percent", "0");
    await expect(canvasHost).toHaveAttribute("data-selected-part-id", "");

    // 7. Kolon kısa aç / betonu gizle / reset regresyonu
    await page.goto("/kategori/araclar/simulasyonlar/kolon-detayi", {
      waitUntil: "domcontentloaded",
    });
    const colCanvasHost = page.getByTestId("simulation-canvas-host");
    await expect(colCanvasHost).toBeVisible({ timeout: 25_000 });
    await expect(colCanvasHost).toHaveAttribute("data-concrete-visible", "true");

    await page.getByTestId("toggle-concrete-btn").click();
    await expect(colCanvasHost).toHaveAttribute("data-concrete-visible", "false");

    await page.getByTestId("simulation-reset-btn").click();
    await expect(colCanvasHost).toHaveAttribute("data-concrete-visible", "true");
  });
});
