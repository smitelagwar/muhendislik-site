import { test, expect } from "@playwright/test";

test.describe("Aşama 06 — Kolon–Kiriş Dış Birleşimi Donatı Sahnesi", () => {
  test("Dış birleşim 3 kamera açısından incelenir, kolon etriyeleri ile kiriş ankraj donatıları izole edilir, kesit ve patlatma çalışır", async ({
    page,
  }) => {
    await page.goto("/kategori/araclar/simulasyonlar", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("simulation-catalog-page")).toBeVisible();
    const jointCard = page.getByTestId("simulation-card-kolon-kiris-birlesimi");
    await expect(jointCard).toBeVisible();

    await jointCard.click();
    await expect(page).toHaveURL(
      /\/kategori\/araclar\/simulasyonlar\/kolon-kiris-birlesimi/,
    );

    const canvasHost = page.getByTestId("simulation-canvas-host");
    await expect(canvasHost).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId("simulation-scene-title")).toContainText(
      "D1 Eğitim Örneği — Kolon–Kiriş Dış Birleşimi Donatı Detayı",
    );

    // 1. Dış birleşim en az 3 kamera açısından incelenebilmeli (İzometrik, Ön, Üst)
    await expect(canvasHost).toHaveAttribute("data-camera-preset", "isometric");

    await page.getByTestId("camera-preset-front").click();
    await expect(canvasHost).toHaveAttribute("data-camera-preset", "front");

    await page.getByTestId("camera-preset-top").click();
    await expect(canvasHost).toHaveAttribute("data-camera-preset", "top");

    await page.getByTestId("camera-preset-isometric").click();
    await expect(canvasHost).toHaveAttribute("data-camera-preset", "isometric");

    // 2. Kolon etriyeleri (stirrup) ve kiriş 90° ankrajlı donatıları (dowel) izole edilip incelenebilmeli
    await page.getByTestId("inspector-tab-layers").click();
    const stirrupToggle = page.getByTestId("layer-toggle-stirrup");
    const dowelToggle = page.getByTestId("layer-toggle-dowel");

    await expect(stirrupToggle).toContainText(
      "Kolon & Düğüm Çekirdeği Etriyeleri",
    );
    await expect(dowelToggle).toContainText(
      "Kiriş Boyuna & 90° Ankraj Kancaları",
    );

    // Betonu gizle, kiriş ankrajlarını kapat -> yalnız kolon etriyeleri ve boyuna donatı görünsün
    await page.getByTestId("toggle-concrete-btn").click();
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "false");

    await dowelToggle.click();
    await expect(dowelToggle).toHaveAttribute("aria-pressed", "false");
    await expect(stirrupToggle).toHaveAttribute("aria-pressed", "true");

    // Şimdi kiriş ankrajlarını aç ve kolon etriyelerini kapat -> yalnız kiriş 90° ankrajları odakta
    await dowelToggle.click();
    await stirrupToggle.click();
    await expect(dowelToggle).toHaveAttribute("aria-pressed", "true");
    await expect(stirrupToggle).toHaveAttribute("aria-pressed", "false");

    // Kolon etriyelerini geri aç
    await stirrupToggle.click();
    await expect(stirrupToggle).toHaveAttribute("aria-pressed", "true");

    // 3. Parça & Seçim sekmesine geç, 2B şemadan kiriş 90° üst ankraj çubuğunu ve düğüm çekirdeği etriyesini seç
    await page.getByTestId("inspector-tab-parts").click();
    await page.getByTestId("svg-part-joint-beam-top-bar-1").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "joint-beam-top-bar-1",
    );
    await expect(page.getByTestId("selected-part-title")).toContainText(
      "Kiriş Üst Donatısı & 90° Ankraj #1",
    );

    // 4. Düğüm çekirdeği yatay kesiti: Z=1500 mm (düğüm orta etriyesi + 8 kolon + 6 kiriş ankraj kolu) vs Z=1450 mm (boşluk)
    await page.getByTestId("quick-cut-z-1500").click();
    await expect(canvasHost).toHaveAttribute("data-section-enabled", "true");
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "1500");
    await expect(page.getByTestId("actual-cut-stirrup-ring")).toHaveCount(1);
    await expect(
      page.getByTestId("actual-cut-dowel-joint-beam-top-bar-1"),
    ).toBeVisible();

    await page.getByTestId("quick-cut-z-1450").click();
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "1450");
    await expect(page.getByTestId("actual-cut-stirrup-ring")).toHaveCount(0);
    await expect(
      page.getByTestId("actual-cut-dowel-joint-beam-top-bar-1"),
    ).toBeVisible();

    // 5. Öğrenme adımı 3 (90° çekirdek içi ankraj) ve Sıfırla
    await page.getByTestId("learning-step-btn-2").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "joint-beam-top-bar-1",
    );

    await page.getByTestId("simulation-reset-btn").click();
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "true");
    await expect(canvasHost).toHaveAttribute("data-selected-part-id", "");
  });
});
