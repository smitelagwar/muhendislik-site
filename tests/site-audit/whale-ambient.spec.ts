import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function oceanCanvasPixels(page: Page) {
  return page.getByTestId("ambient-ocean").locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0, hash = 0;
    for (let i = 0; i < data.length; i += 16) {
      ink += data[i + 3];
      hash = (Math.imul(hash, 31) + data[i] + data[i + 1] * 3 + data[i + 3] * 7) | 0;
    }
    return { ink, hash };
  });
}

test.describe("Belgeler Hub — Okyanus Yaşamı Ambiyans Denetimi & Balina Yokluğu", () => {
  test("Okyanus yaşamı boş yan alanlarda görünmeli, kartların içi temiz kalmalı ve balina kesinlikle bulunmamalıdır", async ({ page }) => {
    test.skip(test.info().project.name !== "chromium-desktop-1920", "Geniş ekranın iki boş koridoru sınanır");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    
    // Balina tuval ve butonu KESİNLİKLE bulunmamalıdır
    await expect(page.getByTestId("ambient-whale")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /blueprint balina/i })).toHaveCount(0);

    // Okyanus yaşamı tuvali aktif olmalıdır
    await expect.poll(async () => (await oceanCanvasPixels(page)).ink).toBeGreaterThan(1000);

    const regions = await page.evaluate(() => {
      const oceanCanvas = document.querySelector<HTMLCanvasElement>('[data-testid="ambient-ocean"] canvas')!;
      const bounds = oceanCanvas.getBoundingClientRect(), dpr = oceanCanvas.width / bounds.width;
      const oCtx = oceanCanvas.getContext("2d")!;
      const cards = [...document.querySelectorAll("[data-whale-card]")].map(el => el.getBoundingClientRect());
      const sample = (targetCtx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
        const bytes = targetCtx.getImageData(Math.round(x * dpr), Math.round(y * dpr), Math.round(w * dpr), Math.round(h * dpr)).data;
        let ink = 0, max = 0;
        for (let i = 3; i < bytes.length; i += 4) { if (bytes[i] > 25) ink++; max = Math.max(max, bytes[i]); }
        return { ink, max };
      };
      return {
        oceanProtected: sample(oCtx, cards[0].left + 30, cards[0].top + 30, cards[0].width - 60, cards[0].height - 60),
      };
    });
    expect(regions.oceanProtected.max).toBeLessThanOrEqual(12);

    await page.getByRole("searchbox", { name: "Belge veya şablon ara" }).fill("Beton Döküm");
    await expect(page.getByRole("status")).toHaveText("1 belge bulundu.");
    await expect(page.getByRole("link", { name: /stüdyoda doldur/i })).toHaveCount(1);
  });

  test("Okyanus yaşamı butonu ile bağımsız açılıp kapatılabilmeli, balina butonu olmamalıdır", async ({ page }) => {
    test.skip(!!test.info().project.use.isMobile || (page.viewportSize()?.width ?? 0) < 768, "Animasyon yalnız masaüstünde bulunur");
    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(500);

    // Balina butonu KESİNLİKLE yok
    await expect(page.getByRole("button", { name: /blueprint balina/i })).toHaveCount(0);
    await expect(page.getByTestId("ambient-whale")).toHaveCount(0);

    // Okyanus Yaşamı Toggle Butonu
    const oceanButton = page.getByTestId("ocean-ambient-toggle");
    await expect(oceanButton).toBeVisible();
    await expect(oceanButton).toHaveAttribute("aria-pressed", "true");
    await expect(oceanButton).toContainText("Açık");

    // Özel SVG İkonunun varlığı
    await expect(oceanButton.locator("svg")).toBeVisible();

    // Arkaplan Okyanus Canvas'ının varlığı
    await expect(page.getByTestId("ambient-ocean").locator("canvas")).toBeAttached();

    // Butona tıklayarak kapatma
    await oceanButton.click();
    await page.waitForTimeout(350);
    await expect(oceanButton).toHaveAttribute("aria-pressed", "false");
    await expect(oceanButton).toContainText("Kapalı");
    expect(await page.evaluate(() => localStorage.getItem("muhendis_ocean_ambient_enabled"))).toBe("false");

    // Butona tıklayarak açma
    await oceanButton.click();
    await page.waitForTimeout(350);
    await expect(oceanButton).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => localStorage.getItem("muhendis_ocean_ambient_enabled"))).toBe("true");

    // Sayfa yenilendiğinde tercihin korunması
    await oceanButton.click(); // Kapalıya al
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    const reloadedButton = page.getByTestId("ocean-ambient-toggle");
    await expect(reloadedButton).toHaveAttribute("aria-pressed", "false");
    await expect(reloadedButton).toContainText("Kapalı");

    // Temizle ve tekrar aç
    await reloadedButton.click();
    await expect(reloadedButton).toHaveAttribute("aria-pressed", "true");
  });

  test("Mobilde animasyon tuvali ve düğmeleri bulunmamalı, balina asla olmamalıdır", async ({ page }) => {
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

    await expect(page.getByRole("button", { name: /blueprint balina/i })).toHaveCount(0);
    await expect(page.getByTestId("ocean-ambient-toggle")).toBeHidden();
    await expect(page.getByTestId("ambient-whale")).toHaveCount(0);
    await expect(page.getByTestId("ambient-ocean")).toHaveCount(0);

    await page.getByRole("searchbox", { name: "Belge veya şablon ara" }).fill("Beton Döküm");
    await expect(page.getByRole("status")).toHaveText("1 belge bulundu.");
  });
});
