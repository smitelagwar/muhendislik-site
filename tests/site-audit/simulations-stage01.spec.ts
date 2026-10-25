import { test, expect } from "@playwright/test";

test.describe("Aşama 01 — Simülasyon Kütüphanesi ve İlk Çalışan 3B Kolon", () => {
  test("Araçlar -> Simülasyonlar -> Kolon akışı, 3B döndürme, beton gizleme, tek canvas ve 404 kontrolü", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    // 1. Araçlar sayfasına git ve Simülasyon Kütüphanesi giriş kartını doğrula
    await page.goto("/kategori/araclar", { timeout: 45_000 });
    const simEntryCard = page.locator('[data-testid="tools-simulation-library-card"]');
    await simEntryCard.waitFor({ state: "visible", timeout: 8_000 });

    const openHubLink = page.locator('[data-testid="open-simulations-hub-link"]');
    await openHubLink.waitFor({ state: "visible", timeout: 8_000 });
    await openHubLink.click();

    // 2. Katalog sayfasında yalnız hazır kolon kartı var ve canlı WebGL canvas yok
    await expect(page).toHaveURL(/\/kategori\/araclar\/simulasyonlar$/);
    const catalogPage = page.locator('[data-testid="simulation-catalog-page"]');
    await catalogPage.waitFor({ state: "visible", timeout: 8_000 });

    const catalogCanvases = await page.locator("canvas").count();
    expect(catalogCanvases).toBe(0);

    const columnCard = page.locator('[data-testid="simulation-card-kolon-detayi"]');
    await columnCard.waitFor({ state: "visible", timeout: 8_000 });
    await columnCard.click();

    // 3. Kolon detay sayfasında 3B sahne açılır ve tek canvas oluşur
    await expect(page).toHaveURL(/\/kategori\/araclar\/simulasyonlar\/kolon-detayi$/);
    const canvasHost = page.locator('[data-testid="simulation-canvas-host"]');
    await canvasHost.waitFor({ state: "visible", timeout: 15_000 });

    const canvas = page.locator('[data-testid="simulation-3d-canvas"]');
    await canvas.waitFor({ state: "visible", timeout: 8_000 });
    expect(await page.locator('[data-testid="simulation-3d-canvas"]').count()).toBe(1);

    // Gerçek geometri çizildiğini doğrula (drawCalls > 0)
    await expect
      .poll(async () => {
        const calls = await canvasHost.getAttribute("data-draw-calls");
        return Number(calls || "0");
      })
      .toBeGreaterThan(5);

    // 4. Döndürme: canvas üzerinde sürükleme ile kamera açısı değişir
    const initialAzimuth = Number(
      (await canvasHost.getAttribute("data-orbit-azimuth")) || "0",
    );
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const startX = box.x + box.width * 0.5;
      const startY = box.y + box.height * 0.5;
      await page.mouse.move(startX, startY);
      await page.mouse.down({ button: "left" });
      await page.mouse.move(startX + 110, startY - 40, { steps: 8 });
      await page.mouse.up({ button: "left" });
    }

    await expect
      .poll(async () => {
        const nextAzimuth = Number(
          (await canvasHost.getAttribute("data-orbit-azimuth")) || "0",
        );
        return Math.abs(nextAzimuth - initialAzimuth);
      })
      .toBeGreaterThan(0.02);

    // 5. Betonu gizle ve tekrar göster
    expect(await canvasHost.getAttribute("data-concrete-visible")).toBe("true");
    const toggleConcreteBtn = page.locator('[data-testid="toggle-concrete-btn"]');
    await toggleConcreteBtn.waitFor({ state: "visible", timeout: 8_000 });
    await toggleConcreteBtn.click();

    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "false");
    await expect(page.locator('[data-testid="concrete-state-badge"]')).toContainText(
      "Beton: Gizli",
    );

    // 6. Kataloga çık ve aynı route'a yeniden gir -> iki canvas oluşmamalı
    const backLink = page.locator('[data-testid="back-to-simulations-link"]');
    await backLink.click();
    await expect(page).toHaveURL(/\/kategori\/araclar\/simulasyonlar$/);
    expect(await page.locator("canvas").count()).toBe(0);

    await page.locator('[data-testid="simulation-card-kolon-detayi"]').click();
    await expect(page).toHaveURL(/\/kategori\/araclar\/simulasyonlar\/kolon-detayi$/);
    await canvas.waitFor({ state: "visible", timeout: 10_000 });
    expect(await page.locator('[data-testid="simulation-3d-canvas"]').count()).toBe(1);

    // 7. Bilinmeyen slug 404 döndürür
    const response404 = await page.goto(
      "/kategori/araclar/simulasyonlar/olmayan-eleman-detayi",
      { timeout: 30_000 },
    );
    expect(response404?.status()).toBe(404);

    expect(pageErrors).toEqual([]);
  });
});
