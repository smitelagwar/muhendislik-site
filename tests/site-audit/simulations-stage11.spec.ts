import { test, expect } from "@playwright/test";

const SLUGS = [
  "kolon-detayi",
  "kiris-detayi",
  "kolon-kiris-birlesimi",
  "tekil-temel",
  "perde-detayi",
  "radye-temel",
];

test.describe("Aşama 11 — Bütünleştirme ve dayanıklılık", () => {
  test("Bağlam kaybı: bir kez otomatik geri yükleme, ikincisinde 2B yedek ve elle yeniden deneme; tek canvas", async ({
    page,
  }) => {
    await page.goto("/kategori/araclar/simulasyonlar/kolon-detayi", {
      waitUntil: "domcontentloaded",
    });
    const host = page.getByTestId("simulation-canvas-host");
    await expect(host).toBeVisible({ timeout: 25_000 });
    await expect(host).toHaveAttribute("data-canvas-count", "1");

    // 1. kayıp: otomatik yeniden kurulum, canvas hâlâ tek
    await page.evaluate(() => window.__simulationController?.simulateContextLossForTest());
    await expect(host).toHaveAttribute("data-canvas-count", "1", { timeout: 8000 });
    await expect(page.getByTestId("simulation-webgl-fallback")).toHaveCount(0);

    // 2. kayıp: 2B yedek
    await page.evaluate(() => window.__simulationController?.simulateContextLossForTest());
    await expect(page.getByTestId("simulation-webgl-fallback")).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId("retry-webgl-btn")).toBeVisible();

    // Elle yeniden dene
    await page.getByTestId("retry-webgl-btn").click();
    await expect(page.getByTestId("simulation-canvas-host")).toHaveAttribute(
      "data-canvas-count",
      "1",
      { timeout: 8000 },
    );
  });

  test("Durağan sahnede 3 sn boyunca yeni kare çizilmez", async ({ page }) => {
    await page.goto("/kategori/araclar/simulasyonlar/kiris-detayi", {
      waitUntil: "domcontentloaded",
    });
    const host = page.getByTestId("simulation-canvas-host");
    await expect(host).toBeVisible({ timeout: 25_000 });
    await page.waitForTimeout(1000);
    const before = Number(await host.getAttribute("data-rendered-frames"));
    await page.waitForTimeout(3000);
    const after = Number(await host.getAttribute("data-rendered-frames"));
    expect(after).toBe(before);
  });

  test("Altı sahne arasında art arda geçiş: tek canvas, hata yok", async ({ page }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    for (const slug of [...SLUGS, ...SLUGS]) {
      await page.goto(`/kategori/araclar/simulasyonlar/${slug}`, {
        waitUntil: "domcontentloaded",
      });
      const host = page.getByTestId("simulation-canvas-host");
      await expect(host).toBeVisible({ timeout: 25_000 });
      await expect(host).toHaveAttribute("data-canvas-count", "1", { timeout: 8000 });
      await page.getByTestId("toggle-concrete-btn").click();
      await page.getByTestId("simulation-reset-btn").click();
    }
    expect(errors).toEqual([]);
  });

  test("Yerleşim: altı sahnede yatay taşma yok (mevcut viewport)", async ({ page }) => {
    for (const slug of SLUGS) {
      await page.goto(`/kategori/araclar/simulasyonlar/${slug}`, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByTestId("simulation-canvas-host")).toBeVisible({ timeout: 25_000 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${slug} yatay taşma`).toBeLessThanOrEqual(1);
    }
  });

  test("Klavye ve ekran okuyucu: parça listesi klavye ile seçilir; reduced-motion oynatmayı gizler; iki tema", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const theme of ["light", "dark"]) {
      await page.addInitScript((t) => window.localStorage.setItem("theme", t), theme);
      await page.goto("/kategori/araclar/simulasyonlar/kolon-detayi", {
        waitUntil: "domcontentloaded",
      });
      const host = page.getByTestId("simulation-canvas-host");
      await expect(host).toBeVisible({ timeout: 25_000 });
      await expect(page.getByTestId("learning-play-toggle-btn")).toHaveCount(0);

      const item = page.getByTestId("part-list-item-longitudinal-bar-1-sw");
      await item.focus();
      await page.keyboard.press("Enter");
      await expect(host).toHaveAttribute("data-selected-part-id", "longitudinal-bar-1-sw");
      await expect(page.getByTestId("accessible-part-list")).toHaveAttribute("role", "listbox");
      await expect(page.getByTestId("selected-part-card")).toHaveAttribute(
        "data-selected-part-id",
        "longitudinal-bar-1-sw",
      );
    }
  });
});
