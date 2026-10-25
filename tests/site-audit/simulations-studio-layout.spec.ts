import { test, expect } from "@playwright/test";

const SLUGS = [
  "kolon-detayi",
  "kiris-detayi",
  "kolon-kiris-birlesimi",
  "tekil-temel",
  "perde-detayi",
  "radye-temel",
] as const;

test.describe("Aşama 09 — Altı Sahnede 3B Stüdyo Yerleşim ve Etkileşim Kabulü", () => {
  test("Altı sahnede masaüstü stüdyo genişliği, panel aç/kapa genişleme, odak modu ve tek canvas", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1920, height: 1080 });

    for (const slug of SLUGS) {
      await page.goto(`/kategori/araclar/simulasyonlar/${slug}`, {
        waitUntil: "domcontentloaded",
      });

      const canvasHost = page.getByTestId("simulation-canvas-host");
      await expect(canvasHost).toBeVisible({ timeout: 25_000 });
      await expect(page.locator("canvas")).toHaveCount(1);

      // 1. 1920px'de sahne genişliği ve dikey konumu (Fold-1 görünürlük)
      const boxOpen = await canvasHost.boundingBox();
      expect(boxOpen).not.toBeNull();
      if (boxOpen) {
        expect(boxOpen.width).toBeGreaterThanOrEqual(1300);
        expect(boxOpen.height).toBeGreaterThanOrEqual(600);
        expect(boxOpen.y).toBeLessThanOrEqual(600); // İlk viewport içinde (1080px) görünür
      }

      // 2. Denetçi panelini kapat -> Canvas genişliği artar, canvas sayısı yine 1
      const inspectorToggle = page.getByTestId("simulation-inspector-toggle");
      await inspectorToggle.click();
      await page.waitForTimeout(200);

      const boxClosed = await canvasHost.boundingBox();
      expect(boxClosed).not.toBeNull();
      if (boxClosed && boxOpen) {
        expect(boxClosed.width).toBeGreaterThan(boxOpen.width);
      }
      await expect(page.locator("canvas")).toHaveCount(1);

      // Tekrar aç
      await inspectorToggle.click();
      await page.waitForTimeout(200);

      // 3. Odak modu (Focus Mode) geçişi
      const focusToggle = page.getByTestId("simulation-focus-mode-toggle");
      await focusToggle.click();
      await expect(page.getByTestId("simulation-workspace")).toHaveAttribute(
        "data-focus-mode",
        "true",
      );

      // ESC tuşu ile odak modundan çıkış
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("simulation-workspace")).toHaveAttribute(
        "data-focus-mode",
        "false",
      );

      // 4. Yatay taşma (horizontal overflow) olmaması
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${slug} 1920px overflow`).toBeLessThanOrEqual(1);
    }

    expect(pageErrors).toEqual([]);
  });

  test("Görünüm sekmeleri (3B / 2B+3B / 2B) geçişi ve tek canvas kararlılığı", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/kategori/araclar/simulasyonlar/kolon-detayi", {
      waitUntil: "domcontentloaded",
    });

    const canvasHost = page.getByTestId("simulation-canvas-host");
    await expect(canvasHost).toBeVisible({ timeout: 25_000 });

    // 1. 3B moduna geç
    await page.getByTestId("sim-tab-3d").click();
    await expect(canvasHost).toBeVisible();
    await expect(page.getByTestId("simulation-2d-preview")).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(1);

    // 2. 2B moduna geç
    await page.getByTestId("sim-tab-2d").click();
    await expect(page.getByTestId("simulation-2d-preview")).toBeVisible();
    // 3B motor unmount edilmez (hidden ile korunur)
    await expect(page.locator("canvas")).toHaveCount(1);

    // 3. Split (2B + 3B) moduna geri dön
    await page.getByTestId("sim-tab-split").click();
    await expect(canvasHost).toBeVisible();
    await expect(page.getByTestId("simulation-2d-preview")).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(1);

    expect(pageErrors).toEqual([]);
  });

  test("Mobil 390px parça seçimi: alt mikro çip açılır ve yatay taşma olmaz", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/kategori/araclar/simulasyonlar/kolon-detayi", {
      waitUntil: "domcontentloaded",
    });

    const canvasHost = page.getByTestId("simulation-canvas-host");
    await expect(canvasHost).toBeVisible({ timeout: 25_000 });

    // Parça seçildiğinde mobil alt çip belirir
    await page.getByTestId("part-list-item-stirrup-1-alt-sarilma-z50").click();
    const mobileChip = page.getByTestId("mobile-selected-part-chip");
    await expect(mobileChip).toBeVisible();

    // Detayı incele tıklanınca denetçi açılır
    await page.getByTestId("mobile-open-detail-btn").click();
    await expect(page.getByTestId("selected-part-card")).toBeVisible();

    // Seçimi kaldır tıklanınca çip kaybolur
    await page.getByTestId("mobile-clear-part-btn").click();
    await expect(mobileChip).toHaveCount(0);

    const overflow390 = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow390).toBeLessThanOrEqual(1);

    expect(pageErrors).toEqual([]);
  });
});
