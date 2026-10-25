import { test, expect } from "@playwright/test";

test.describe("Aşama 07 — Tekil Temel ve Kolon Filizi Donatı Sahnesi", () => {
  test("Tekil temel katalogdan açılır; alt X/Y ızgarası, L-bükümlü filiz ve beton ayrı incelenir; plan ve kesit aynı koordinatları gösterir", async ({
    page,
  }) => {
    await page.goto("/kategori/araclar/simulasyonlar", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("simulation-catalog-page")).toBeVisible();
    const footingCard = page.getByTestId("simulation-card-tekil-temel");
    await expect(footingCard).toBeVisible();

    await footingCard.click();
    await expect(page).toHaveURL(
      /\/kategori\/araclar\/simulasyonlar\/tekil-temel/,
    );

    const canvasHost = page.getByTestId("simulation-canvas-host");
    await expect(canvasHost).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId("simulation-scene-title")).toContainText(
      "T1 Eğitim Örneği — 1800×1800×500 mm Tekil Temel ve Kolon Filizi",
    );

    // 1. Plan ve düşey kesitte X/Y kotlarının (Z=58 mm ve Z=74 mm) raporlandığını doğrula
    const dimSummary = page.getByTestId("drawing-2d-dimensions-summary");
    await expect(dimSummary).toHaveAttribute("data-mesh-x-z-mm", "58");
    await expect(dimSummary).toHaveAttribute("data-mesh-y-z-mm", "74");
    await expect(dimSummary).toHaveAttribute("data-section-width-mm", "1800");

    // 2. Katmanlar sekmesinden Alt X ızgarası, Alt Y ızgarası, Kolon Filizleri ve Betonu ayrı ayrı incele
    await page.getByTestId("inspector-tab-layers").click();
    const meshXToggle = page.getByTestId("layer-toggle-longitudinal");
    const meshYToggle = page.getByTestId("layer-toggle-crosstie");
    const dowelToggle = page.getByTestId("layer-toggle-dowel");

    await expect(meshXToggle).toContainText("Alt X Doğrultusu Izgara (Z=58 mm)");
    await expect(meshYToggle).toContainText("Alt Y Doğrultusu Izgara (Z=74 mm)");
    await expect(dowelToggle).toContainText("Kolon Filizleri & 90° Ayaklar");

    // Betonu gizle
    await page.getByTestId("toggle-concrete-btn").click();
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "false");

    // Yalnız Alt X/Y ızgarasını bırakmak için filizleri kapat, sonra tekrar aç
    await dowelToggle.click();
    await expect(dowelToggle).toHaveAttribute("aria-pressed", "false");
    await dowelToggle.click();
    await expect(dowelToggle).toHaveAttribute("aria-pressed", "true");

    // 3. Parça & Seçim sekmesine geç; düşey kesitten L-filizi ve plandan Alt Y ızgara çubuğunu seç
    await page.getByTestId("inspector-tab-parts").click();
    await page.getByTestId("svg-part-footing-dowel-bar-1-sw").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "footing-dowel-bar-1-sw",
    );
    await expect(page.getByTestId("selected-part-title")).toContainText(
      "Kolon Filizi & 90° Ayak #1",
    );

    await page.getByTestId("plan-part-footing-mesh-y-5").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "footing-mesh-y-5",
    );
    await expect(page.getByTestId("selected-part-title")).toContainText(
      "Temel Alt Y Izgara Donatısı #5",
    );

    // 4. Kesit kontrolü: Z=58 mm (Alt X ızgara kotu) vs Z=74 mm (Alt Y ızgara kotu) vs Z=310 mm (Temel içi etriye)
    await page.getByTestId("quick-cut-z-58").click();
    await expect(canvasHost).toHaveAttribute("data-section-enabled", "true");
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "58");

    await page.getByTestId("quick-cut-z-74").click();
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "74");

    await page.getByTestId("quick-cut-z-310").click();
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "310");
    await expect(page.getByTestId("actual-cut-stirrup-ring")).toHaveCount(1);

    // 5. Öğrenme adımı 4 (Kolon filizleri ve 90° yay bükümlü ayaklar) ve Sıfırla
    await page.getByTestId("learning-step-btn-3").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "footing-dowel-bar-1-sw",
    );

    await page.getByTestId("simulation-reset-btn").click();
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "true");
    await expect(canvasHost).toHaveAttribute("data-selected-part-id", "");
  });
});
