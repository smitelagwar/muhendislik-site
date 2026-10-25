import { test, expect } from "@playwright/test";

test.describe("Aşama 12 — Ana Site Rotaları Kısa Açılış ve Geri Dönüş Smoke Testi", () => {
  test("Ana Sayfa, Araçlar, Mevzuat, Belgeler ve Dokümantasyon açılır ve hatasız döner", async ({
    page,
  }) => {
    const coreRoutes = [
      { path: "/", titleSnippet: "Mühendis" },
      { path: "/araclar", titleSnippet: "Araçlar" },
      { path: "/kategori/araclar/simulasyonlar", titleSnippet: "Simülasyon" },
      { path: "/kategori/deprem-yonetmelik", titleSnippet: "Deprem" },
      { path: "/belgeler", titleSnippet: "Belgeler" },
      { path: "/dokumantasyon", titleSnippet: "Dokümantasyon" },
    ];

    for (const route of coreRoutes) {
      const response = await page.goto(route.path, {
        waitUntil: "domcontentloaded",
      });
      expect(response?.status(), `${route.path} HTTP durumu`).toBe(200);
      await expect(page.locator("body")).toBeVisible();
      const pageTitle = await page.title();
      expect(pageTitle.length).toBeGreaterThan(0);
    }

    // Kısa geri dönüş ve simülasyona tekrar erişim turu
    await page.goto("/kategori/araclar/simulasyonlar/kolon-detayi", {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByTestId("simulation-canvas-host")).toBeVisible({ timeout: 25_000 });

    // Ana sayfaya dön
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();
  });
});
