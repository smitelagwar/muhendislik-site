import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function canvasPixels(page: Page) {
  return page.getByTestId("ambient-whale").locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0, hash = 0;
    for (let i = 0; i < data.length; i += 16) {
      ink += data[i + 3];
      hash = (Math.imul(hash, 31) + data[i] + data[i + 1] * 3 + data[i + 3] * 7) | 0;
    }
    return { ink, hash };
  });
}

test.describe("Belgeler Hub — Blueprint Balina Ambiyans ve Buton Denetimi", () => {
  test("Canvas arkaplanda otonom render olmalı ve buton ile açılıp kapatılabilmelidir", async ({ page }) => {
    test.skip(!!test.info().project.use.isMobile || (page.viewportSize()?.width ?? 0) < 768, "Balina yalnız masaüstünde bulunur");
    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(500);

    // 1. Blueprint Balina Toggle Butonunu bul
    const whaleButton = page.getByRole("button", { name: /blueprint balina/i });
    await expect(whaleButton).toBeVisible();
    await expect(whaleButton).toHaveAttribute("aria-pressed", "true");
    await expect(whaleButton).toContainText("Açık");

    // 2. Özel SVG Whale Blueprint İkonunun varlığı
    const whaleIcon = whaleButton.locator("svg");
    await expect(whaleIcon).toBeVisible();
    await expect(whaleIcon).toHaveAttribute("aria-hidden", "true");

    // 3. Arkaplan Canvas Elementinin varlığı ve erişilebilirlik nitelikleri
    const canvasContainer = page.locator("div[role='presentation'][aria-hidden='true'] canvas");
    await expect(canvasContainer).toBeAttached();

    // 4. Pointer-events-none kontrolü (kartlara ve arama çubuğuna tıklanabilirliği engellememelidir)
    const pointerEvents = await page.evaluate(() => {
      const canvasEl = document.querySelector("div[role='presentation'] canvas");
      if (!canvasEl) return "";
      return window.getComputedStyle(canvasEl).pointerEvents;
    });
    expect(pointerEvents).toBe("none");

    // 5. Butona tıklayarak balina ambiyansını kapatma
    await whaleButton.click();
    await page.waitForTimeout(350);

    await expect(whaleButton).toHaveAttribute("aria-pressed", "false");
    await expect(whaleButton).toContainText("Kapalı");

    // LocalStorage persistence doğrulaması
    const savedStateDisabled = await page.evaluate(() =>
      localStorage.getItem("muhendis_whale_ambient_enabled")
    );
    expect(savedStateDisabled).toBe("false");

    // 6. Butona tekrar tıklayarak ambiyansı açma
    await whaleButton.click();
    await page.waitForTimeout(350);

    await expect(whaleButton).toHaveAttribute("aria-pressed", "true");
    await expect(whaleButton).toContainText("Açık");

    const savedStateEnabled = await page.evaluate(() =>
      localStorage.getItem("muhendis_whale_ambient_enabled")
    );
    expect(savedStateEnabled).toBe("true");

    // 7. Sayfa yenilendiğinde tercihin korunması
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

  test("Mobilde balina ve düğmesi bulunmamalı, yatay taşma olmamalıdır", async ({ page }) => {
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
    await expect(whaleButton).toBeHidden();
    await expect(page.getByTestId("ambient-whale")).toHaveCount(0);
    await page.getByRole("searchbox", { name: "Belge veya şablon ara" }).fill("Beton Döküm");
    await expect(page.getByRole("status")).toHaveText("1 belge bulundu.");
    await expect(page.getByTestId("ambient-whale")).toHaveCount(0);
    if (test.info().project.use.isMobile) {
      await page.setViewportSize({ width: 844, height: 390 });
      await expect(whaleButton).toBeHidden();
      await expect(page.getByTestId("ambient-whale")).toHaveCount(0);
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
    const first = await canvasPixels(page);
    await expect.poll(async () => (await canvasPixels(page)).hash).not.toBe(first.hash);
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
    await expect(page.getByRole("button", { name: /blueprint balina/i })).toBeHidden();
    await page.setViewportSize({ width: 1366, height: 768 });
    await expect.poll(async () => (await canvasPixels(page)).ink).toBeGreaterThan(1000);
    await expect(page.getByRole("button", { name: /blueprint balina/i })).toBeVisible();
  });
});
