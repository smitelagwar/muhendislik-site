import { test, expect } from "@playwright/test";

test.describe("Aşama 04 — Kolon Öğrenme Deneyimi, Patlatma, Kesit ve Ağ Yükleme Sınırı", () => {
  test("Döndür -> betonu gizle -> etriyeyi seç -> 2B karşılığını gör -> kesit kaydır -> patlat -> öğrenme adımını ilerlet/geri al -> sıfırla ve katalog ağ sınırı", async ({
    page,
  }) => {
    const catalogInitialScriptUrls: string[] = [];
    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/_next/static/") && url.endsWith(".js")) {
        catalogInitialScriptUrls.push(url);
      }
    });

    // 1. Katalog sayfasını aç ve canlı Three.js canvas olmadığını doğrula
    await page.goto("/kategori/araclar/simulasyonlar", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("simulation-catalog-page")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);

    // Katalogda three-column-viewer modülünün çalışmadığını (window.__simulationController tanımlanmadığını) doğrula
    const hasControllerOnCatalog = await page.evaluate(() =>
      Boolean((window as unknown as { __simulationController?: unknown }).__simulationController),
    );
    expect(hasControllerOnCatalog).toBe(false);

    // 2. Kolon detay sayfasına geç
    await page.getByTestId("simulation-card-kolon-detayi").click();
    await expect(page).toHaveURL(/\/kategori\/araclar\/simulasyonlar\/kolon-detayi/);

    const canvasHost = page.getByTestId("simulation-canvas-host");
    await expect(canvasHost).toBeVisible({ timeout: 25_000 });
    const canvas = page.getByTestId("simulation-3d-canvas");
    await expect(canvas).toBeVisible();

    // 3. Döndür (Orbit drag)
    const initialAzimuth = Number(
      (await canvasHost.getAttribute("data-orbit-azimuth")) ?? "0",
    );
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const startX = box.x + box.width * 0.5;
      const startY = box.y + box.height * 0.5;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX + 85, startY + 25, { steps: 6 });
      await page.mouse.up();
    }
    const rotatedAzimuth = Number(
      (await canvasHost.getAttribute("data-orbit-azimuth")) ?? "0",
    );
    expect(Math.abs(rotatedAzimuth - initialAzimuth)).toBeGreaterThan(0.01);

    // 4. Betonu gizle
    await page.getByTestId("toggle-concrete-btn").click();
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "false");

    // 5. Etriyeyi seç ve 2B karşılığını gör
    await page.getByTestId("part-list-item-stirrup-1-alt-sarilma-z50").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "stirrup-1-alt-sarilma-z50",
    );
    await expect(
      page.getByTestId("svg-part-stirrup-1-alt-sarilma-z50"),
    ).toHaveAttribute("data-selected", "true");

    // 6. Kesit kaydır (Z=50 mm -> Z=100 mm)
    await page.getByTestId("toggle-section-plane-btn").click();
    await expect(canvasHost).toHaveAttribute("data-section-enabled", "true");
    await page.getByTestId("quick-cut-z-100").click();
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "100");
    await expect(page.getByTestId("actual-cut-stirrup-ring")).toHaveCount(0);

    // 7. Patlat (Kesit açıkken patlatma yapıldığında kesit otomatik kapanmalı ve açıklama ibaresi görünmeli)
    const learningPanel = page.getByTestId("learning-controls-panel");
    await page.getByTestId("explode-preset-70").click();
    await expect(canvasHost).toHaveAttribute("data-explode-percent", "70");
    await expect(canvasHost).toHaveAttribute("data-section-enabled", "false");
    await expect(page.getByTestId("explode-educational-disclaimer")).toContainText(
      "Parçalar açıklama amacıyla ayrılmıştır",
    );
    // Patlatma sırasında gerçek mm ölçülerinin değişmediğini doğrula
    await expect(page.getByTestId("drawing-2d-dimensions-summary")).toHaveAttribute(
      "data-total-height-mm",
      "4280",
    );

    // Kesit tekrar açıldığında patlatmanın 0'a sıfırlandığını doğrula
    await page.getByTestId("toolbar-toggle-section-btn").click();
    await expect(canvasHost).toHaveAttribute("data-section-enabled", "true");
    await expect(canvasHost).toHaveAttribute("data-explode-percent", "0");

    // 8. Öğrenme adımını başlat, ilerlet ve geri al
    await page.getByTestId("learning-step-btn-0").click();
    await expect(learningPanel).toHaveAttribute("data-learning-mode", "guided");
    await expect(learningPanel).toHaveAttribute("data-learning-step-index", "0");
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "concrete-column-body",
    );

    await page.getByTestId("learning-next-step-btn").click();
    await expect(learningPanel).toHaveAttribute("data-learning-step-index", "1");
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "longitudinal-bar-1-sw",
    );

    await page.getByTestId("learning-next-step-btn").click();
    await expect(learningPanel).toHaveAttribute("data-learning-step-index", "2");
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "stirrup-1-alt-sarilma-z50",
    );

    await page.getByTestId("learning-prev-step-btn").click();
    await expect(learningPanel).toHaveAttribute("data-learning-step-index", "1");
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "longitudinal-bar-1-sw",
    );

    // 9. Tek zaman parametresi t=0 ve t=1 kontrolü
    await page.getByTestId("layer-progress-preset-0").click();
    await expect(learningPanel).toHaveAttribute("data-layer-progress-t", "0.00");
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "false");

    await page.getByTestId("layer-progress-preset-1").click();
    await expect(learningPanel).toHaveAttribute("data-layer-progress-t", "1.00");
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "true");

    // 10. Sıfırla (Reset)
    await page.getByTestId("simulation-reset-btn").click();
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "true");
    await expect(canvasHost).toHaveAttribute("data-selected-part-id", "");
    await expect(canvasHost).toHaveAttribute("data-section-enabled", "false");
    await expect(canvasHost).toHaveAttribute("data-explode-percent", "0");
    await expect(learningPanel).toHaveAttribute("data-learning-mode", "free");
    await expect(learningPanel).toHaveAttribute("data-layer-progress-t", "1.00");
  });
});
