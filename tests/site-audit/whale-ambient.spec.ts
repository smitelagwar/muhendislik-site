import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function canvasPixels(page: Page, testId = "ambient-whale") {
  return page.getByTestId(testId).locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0, hash = 0;
    for (let i = 0; i < data.length; i += 16) {
      ink += data[i + 3];
      hash = (Math.imul(hash, 31) + data[i] + data[i + 1] * 3 + data[i + 3] * 7) | 0;
    }
    return { ink, hash };
  });
}

test.describe("Belgeler Hub — Blueprint Balina ve Okyanus Yaşamı Ambiyans Denetimi", () => {
  test("İki balina ve okyanus yaşamı boş yan alanlarda görünürken kartların içi temiz kalmalıdır", async ({ page }) => {
    test.skip(test.info().project.name !== "chromium-desktop-1920", "Geniş ekranın iki boş koridoru sınanır");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await expect.poll(async () => (await canvasPixels(page, "ambient-whale")).ink).toBeGreaterThan(1000);
    await expect.poll(async () => (await canvasPixels(page, "ambient-ocean")).ink).toBeGreaterThan(1000);
    const regions = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="ambient-whale"] canvas')!;
      const oceanCanvas = document.querySelector<HTMLCanvasElement>('[data-testid="ambient-ocean"] canvas')!;
      const bounds = canvas.getBoundingClientRect(), dpr = canvas.width / bounds.width;
      const ctx = canvas.getContext("2d")!;
      const oCtx = oceanCanvas.getContext("2d")!;
      const cards = [...document.querySelectorAll("[data-whale-card]")].map(el => el.getBoundingClientRect());
      const sample = (targetCtx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
        const bytes = targetCtx.getImageData(Math.round(x * dpr), Math.round(y * dpr), Math.round(w * dpr), Math.round(h * dpr)).data;
        let ink = 0, max = 0;
        for (let i = 3; i < bytes.length; i += 4) { if (bytes[i] > 25) ink++; max = Math.max(max, bytes[i]); }
        return { ink, max };
      };
      return {
        left: sample(ctx, 0, 100, cards[0].left - 12, bounds.height - 100),
        right: sample(ctx, cards[2].right + 12, 100, bounds.width - cards[2].right - 12, bounds.height - 100),
        protected: sample(ctx, cards[0].left + 30, cards[0].top + 30, cards[0].width - 60, cards[0].height - 60),
        oceanProtected: sample(oCtx, cards[0].left + 30, cards[0].top + 30, cards[0].width - 60, cards[0].height - 60),
      };
    });
    expect(regions.left.ink).toBeGreaterThan(2000);
    expect(regions.right.ink).toBeGreaterThan(1000);
    expect(regions.protected.max).toBeLessThanOrEqual(12);
    expect(regions.oceanProtected.max).toBeLessThanOrEqual(12);
    await page.getByRole("searchbox", { name: "Belge veya şablon ara" }).fill("Beton Döküm");
    await expect(page.getByRole("status")).toHaveText("1 belge bulundu.");
    await expect(page.getByRole("link", { name: /stüdyoda doldur/i })).toHaveCount(1);
  });

  test("Canvas arkaplanda otonom render olmalı ve her iki buton ile bağımsız açılıp kapatılabilmelidir", async ({ page }) => {
    test.skip(!!test.info().project.use.isMobile || (page.viewportSize()?.width ?? 0) < 768, "Balina yalnız masaüstünde bulunur");
    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(500);

    // 1. Blueprint Balina ve Okyanus Yaşamı Toggle Butonlarını bul
    const whaleButton = page.getByRole("button", { name: /blueprint balina/i });
    const oceanButton = page.getByTestId("ocean-ambient-toggle");
    await expect(whaleButton).toBeVisible();
    await expect(whaleButton).toHaveAttribute("aria-pressed", "true");
    await expect(whaleButton).toContainText("Açık");

    await expect(oceanButton).toBeVisible();
    await expect(oceanButton).toHaveAttribute("aria-pressed", "true");
    await expect(oceanButton).toContainText("Açık");

    // 2. Özel SVG İkonlarının varlığı
    const whaleIcon = whaleButton.locator("svg");
    await expect(whaleIcon).toBeVisible();
    await expect(whaleIcon).toHaveAttribute("aria-hidden", "true");
    await expect(oceanButton.locator("svg")).toBeVisible();

    // 3. Arkaplan Canvas Elementlerinin varlığı ve erişilebilirlik nitelikleri
    const canvasContainer = page.locator("div[role='presentation'][aria-hidden='true'] canvas");
    await expect(canvasContainer).toBeAttached();
    await expect(page.getByTestId("ambient-ocean").locator("canvas")).toBeAttached();

    // 4. Pointer-events-none kontrolü (kartlara ve arama çubuğuna tıklanabilirliği engellememelidir)
    const pointerEvents = await page.evaluate(() => {
      const canvasEl = document.querySelector("div[role='presentation'] canvas");
      if (!canvasEl) return "";
      return window.getComputedStyle(canvasEl).pointerEvents;
    });
    expect(pointerEvents).toBe("none");

    // 5. Okyanus Yaşamı butonuna bağımsız tıklayarak kapatma ve açma
    await oceanButton.click();
    await page.waitForTimeout(350);
    await expect(oceanButton).toHaveAttribute("aria-pressed", "false");
    await expect(oceanButton).toContainText("Kapalı");
    expect(await page.evaluate(() => localStorage.getItem("muhendis_ocean_ambient_enabled"))).toBe("false");
    // Balina hala açık kalmalıdır
    await expect(whaleButton).toHaveAttribute("aria-pressed", "true");

    await oceanButton.click();
    await page.waitForTimeout(350);
    await expect(oceanButton).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => localStorage.getItem("muhendis_ocean_ambient_enabled"))).toBe("true");

    // 6. Butona tıklayarak balina ambiyansını kapatma
    await whaleButton.click();
    await page.waitForTimeout(350);

    await expect(whaleButton).toHaveAttribute("aria-pressed", "false");
    await expect(whaleButton).toContainText("Kapalı");

    // LocalStorage persistence doğrulaması
    const savedStateDisabled = await page.evaluate(() =>
      localStorage.getItem("muhendis_whale_ambient_enabled")
    );
    expect(savedStateDisabled).toBe("false");

    // 7. Butona tekrar tıklayarak ambiyansı açma
    await whaleButton.click();
    await page.waitForTimeout(350);

    await expect(whaleButton).toHaveAttribute("aria-pressed", "true");
    await expect(whaleButton).toContainText("Açık");

    const savedStateEnabled = await page.evaluate(() =>
      localStorage.getItem("muhendis_whale_ambient_enabled")
    );
    expect(savedStateEnabled).toBe("true");

    // 8. Sayfa yenilendiğinde tercihin korunması
    await whaleButton.click(); // Kapalıya al
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    const reloadedButton = page.getByRole("button", { name: /blueprint balina/i });
    await expect(reloadedButton).toHaveAttribute("aria-pressed", "false");
    await expect(reloadedButton).toContainText("Kapalı");

    // Temizle ve tekrar aç
    await reloadedButton.click();
    await expect(reloadedButton).toHaveAttribute("aria-pressed", "true");
  });

  test("Mobilde balina, okyanus yaşamı ve düğmeleri bulunmamalı, yatay taşma olmamalıdır", async ({ page }) => {
    const width = Math.min(page.viewportSize()?.width ?? 320, 767);
    await page.setViewportSize({ width, height: 720 });
    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(500);

    const overflowData = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      return {
        hasOverflow: docWidth > winWidth + 1.5,
        docWidth,
        winWidth,
      };
    });

    expect(overflowData.hasOverflow).toBe(false);

    const whaleButton = page.getByRole("button", { name: /blueprint balina/i });
    const oceanButton = page.getByTestId("ocean-ambient-toggle");
    await expect(whaleButton).toBeHidden();
    await expect(oceanButton).toBeHidden();
    await expect(page.getByTestId("ambient-whale")).toHaveCount(0);
    await expect(page.getByTestId("ambient-ocean")).toHaveCount(0);
    await page.getByRole("searchbox", { name: "Belge veya şablon ara" }).fill("Beton Döküm");
    await expect(page.getByRole("status")).toHaveText("1 belge bulundu.");
    await expect(page.getByTestId("ambient-whale")).toHaveCount(0);
    await expect(page.getByTestId("ambient-ocean")).toHaveCount(0);
    if (test.info().project.use.isMobile) {
      await page.setViewportSize({ width: 844, height: 390 });
      await expect(whaleButton).toBeHidden();
      await expect(oceanButton).toBeHidden();
      await expect(page.getByTestId("ambient-whale")).toHaveCount(0);
      await expect(page.getByTestId("ambient-ocean")).toHaveCount(0);
    }
  });

  test("prefers-reduced-motion modunda statik mimari blueprint eskizi çizilmeli ve hata vermemelidir", async ({ page }) => {
    test.skip(!!test.info().project.use.isMobile || (page.viewportSize()?.width ?? 0) < 768, "Balina yalnız masaüstünde bulunur");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(500);

    const canvas = page.locator("div[role='presentation'] canvas");
    await expect(canvas).toBeAttached();
    await expect.poll(async () => (await canvasPixels(page)).ink).toBeGreaterThan(1000);
    const still = await canvasPixels(page);
    expect(still.ink).toBeGreaterThan(1000);
    await page.waitForTimeout(180);
    expect(await canvasPixels(page)).toEqual(still);

    const button = page.getByRole("button", { name: /blueprint balina/i });
    await button.click();
    await expect.poll(async () => (await canvasPixels(page)).ink).toBe(0);
    await button.click();
    await expect.poll(async () => (await canvasPixels(page)).ink).toBeGreaterThan(1000);

    // Resize viewport in reduced-motion mode to confirm no crashes or blank clearing
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(300);

    const whaleButton = page.getByRole("button", { name: /blueprint balina/i });
    await expect(whaleButton).toBeVisible();
    await expect(whaleButton).toHaveAttribute("aria-pressed", "true");
  });

  test("Çizim yüzmeli, kapatılınca temizlenmeli ve iki temada da görünmelidir", async ({ page }) => {
    test.skip(!!test.info().project.use.isMobile || (page.viewportSize()?.width ?? 0) < 768, "Balina yalnız masaüstünde bulunur");
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await expect.poll(async () => (await canvasPixels(page)).ink).toBeGreaterThan(1000);
    await expect.poll(async () => (await canvasPixels(page, "ambient-ocean")).ink).toBeGreaterThan(1000);
    const first = await canvasPixels(page);
    const firstOcean = await canvasPixels(page, "ambient-ocean");
    await expect.poll(async () => (await canvasPixels(page)).hash).not.toBe(first.hash);
    await expect.poll(async () => (await canvasPixels(page, "ambient-ocean")).hash).not.toBe(firstOcean.hash);
    const button = page.getByRole("button", { name: /blueprint balina/i });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await canvasPixels(page)).ink).toBe(0);
    await page.waitForTimeout(150);
    expect((await canvasPixels(page)).ink).toBe(0);
    await page.keyboard.press("Enter");
    await expect.poll(async () => (await canvasPixels(page)).ink).toBeGreaterThan(1000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    const light = await canvasPixels(page);
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    await expect.poll(async () => (await canvasPixels(page)).hash).not.toBe(light.hash);
    expect((await canvasPixels(page)).ink).toBeGreaterThan(1000);
    expect(errors).toEqual([]);
  });

  test("Sekme görünürlüğü değişince yüzüş durmalı ve kaldığı yerden sürmelidir", async ({ page }) => {
    test.skip(!!test.info().project.use.isMobile || (page.viewportSize()?.width ?? 0) < 768, "Balina yalnız masaüstünde bulunur");
    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await expect.poll(async () => (await canvasPixels(page)).ink).toBeGreaterThan(1000);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const paused = await canvasPixels(page);
    await page.waitForTimeout(180);
    expect(await canvasPixels(page)).toEqual(paused);
    await page.evaluate(() => {
      Reflect.deleteProperty(document, "hidden");
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(async () => (await canvasPixels(page)).hash).not.toBe(paused.hash);
  });

  test("Masaüstünden dar ekrana geçiş sahneyi kaldırmalı ve tekrar yükleyebilmelidir", async ({ page }) => {
    test.skip(test.info().project.name !== "chromium-desktop-1366", "Boyut geçişi tek masaüstü projesinde sınanır");
    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await expect.poll(async () => (await canvasPixels(page)).ink).toBeGreaterThan(1000);
    await page.setViewportSize({ width: 767, height: 800 });
    await expect(page.getByTestId("ambient-whale")).toHaveCount(0);
    await expect(page.getByTestId("ambient-ocean")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /blueprint balina/i })).toBeHidden();
    await expect(page.getByTestId("ocean-ambient-toggle")).toBeHidden();
    await page.setViewportSize({ width: 1366, height: 768 });
    await expect.poll(async () => (await canvasPixels(page)).ink).toBeGreaterThan(1000);
    await expect(page.getByRole("button", { name: /blueprint balina/i })).toBeVisible();
    await expect(page.getByTestId("ocean-ambient-toggle")).toBeVisible();
  });
});

