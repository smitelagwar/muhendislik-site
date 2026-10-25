import { test, expect } from "@playwright/test";

const SIX_SIMULATION_ROUTES = [
  {
    slug: "kolon-detayi",
    expectedTitlePart: "C1 Eğitim Örneği",
  },
  {
    slug: "kiris-detayi",
    expectedTitlePart: "K1 Eğitim Örneği",
  },
  {
    slug: "kolon-kiris-birlesimi",
    expectedTitlePart: "D1 Eğitim Örneği",
  },
  {
    slug: "tekil-temel",
    expectedTitlePart: "T1 Eğitim Örneği",
  },
  {
    slug: "perde-detayi",
    expectedTitlePart: "P1 Eğitim Örneği",
  },
  {
    slug: "radye-temel",
    expectedTitlePart: "R1 Eğitim Örneği",
  },
] as const;

test.describe("Aşama 09 — Radye Temel Sahnesi ve 6 Sahne Katalog/Route Tamamlanması", () => {
  test("Katalogda 6 kart SVG poster ve öğrenme özetiyle görünür; Radye Temelde alt/üst ızgara, sehpa ve filiz ayrı incelenir; Hafif profil ve draw-call bütçesi geçer; 6 route doğrudan açılır", async ({
    page,
  }) => {
    await page.goto("/kategori/araclar/simulasyonlar", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.getByTestId("simulation-catalog-page")).toBeVisible();

    // 1. Katalogda 6 kartın tamamı görünür olmalı ve her birinde SVG poster bulunmalı
    for (const item of SIX_SIMULATION_ROUTES) {
      const card = page.getByTestId(`simulation-card-${item.slug}`);
      await expect(card).toBeVisible();
      await expect(card.locator('svg[role="img"]')).toBeVisible();
    }

    // 2. Katalogdan Radye Temel kartına tıkla
    await page.getByTestId("simulation-card-radye-temel").click();
    await expect(page).toHaveURL(
      /\/kategori\/araclar\/simulasyonlar\/radye-temel/,
    );

    const canvasHost = page.getByTestId("simulation-canvas-host");
    await expect(canvasHost).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId("simulation-scene-title")).toContainText(
      "R1 Eğitim Örneği — 2200×2200×600 mm Radye Temel, Sehpa ve Kolon Filizi",
    );

    // 3. Hafif profil (light) ve draw-call / üçgen bütçesi kontrolü
    await expect(canvasHost).toHaveAttribute("data-quality-profile", "light");
    const drawCalls = Number(
      (await canvasHost.getAttribute("data-draw-calls")) ?? "999",
    );
    const triangles = Number(
      (await canvasHost.getAttribute("data-triangles")) ?? "999999",
    );
    expect(drawCalls).toBeGreaterThan(0);
    expect(drawCalls).toBeLessThanOrEqual(25);
    expect(triangles).toBeGreaterThan(0);
    expect(triangles).toBeLessThanOrEqual(150_000);

    // 4. Alt (Z=58/74 mm) ve Üst (Z=526/542 mm) iki yönlü ızgara kotlarının raporlandığını doğrula
    const dimSummary = page.getByTestId("drawing-2d-dimensions-summary");
    await expect(dimSummary).toHaveAttribute("data-bottom-mesh-x-z-mm", "58");
    await expect(dimSummary).toHaveAttribute("data-bottom-mesh-y-z-mm", "74");
    await expect(dimSummary).toHaveAttribute("data-top-mesh-y-z-mm", "526");
    await expect(dimSummary).toHaveAttribute("data-top-mesh-x-z-mm", "542");

    // 5. Öğrenme adımlarından Alt Izgara (Adım 2), Üst Izgara (Adım 3) ve Sehpa (Adım 4) katmanlarının ayrı ayrı görülmesi
    await page.getByTestId("learning-step-btn-1").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "mat-bottom-x-6",
    );
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "false");

    await page.getByTestId("learning-step-btn-2").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "mat-top-x-6",
    );

    await page.getByTestId("learning-step-btn-3").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "mat-chair-5-x0-y0",
    );
    await expect(page.getByTestId("selected-part-title")).toContainText(
      "Radye Sehpa Donatısı #5",
    );

    await page.getByTestId("learning-reset-btn").click();
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "true");

    // 6. 2B Düşey Kesit ve Plan üzerinden Alt ızgara, Üst ızgara, Sehpa ve Kolon filizini seç
    await page.getByTestId("svg-part-mat-bottom-x-6").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "mat-bottom-x-6",
    );

    await page.getByTestId("svg-part-mat-top-x-6").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "mat-top-x-6",
    );

    await page.getByTestId("plan-part-mat-chair-5-x0-y0").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "mat-chair-5-x0-y0",
    );
    await expect(page.getByTestId("selected-part-title")).toContainText(
      "Radye Sehpa Donatısı #5",
    );

    await page.getByTestId("plan-part-mat-dowel-bar-1-sw").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "mat-dowel-bar-1-sw",
    );

    // 7. Kesit kontrolü: Z=58 mm (Alt X), Z=542 mm (Üst X), Z=340 mm (Filiz etriye kotu)
    await page.getByTestId("quick-cut-z-58").click();
    await expect(canvasHost).toHaveAttribute("data-section-enabled", "true");
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "58");

    await page.getByTestId("quick-cut-z-542").click();
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "542");

    await page.getByTestId("quick-cut-z-340").click();
    await expect(canvasHost).toHaveAttribute("data-section-elevation-mm", "340");
    await expect(page.getByTestId("actual-cut-stirrup-ring")).toHaveCount(1);

    // 8. Altı route'un tamamının doğrudan URL ile açıldığının duman (smoke) kontrolü
    for (const route of SIX_SIMULATION_ROUTES) {
      await page.goto(`/kategori/araclar/simulasyonlar/${route.slug}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByTestId("simulation-scene-title")).toContainText(
        route.expectedTitlePart,
      );
      await expect(page.getByTestId("simulation-canvas-host")).toBeVisible({
        timeout: 20_000,
      });
    }
  });
});
