import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  ACROBAT_ZOOM_PRESETS,
  getNextAcrobatZoomIn,
  getNextAcrobatZoomOut,
} from "../../src/lib/dokumantasyon/studio/pdf/pdf-gesture-engine";

test.describe("Ketoral Link Alignment, Windowing Re-render & Acrobat Zoom", () => {
  test("Acrobat zoom helper functions calculate correct ladder steps", async () => {
    // 1. Zoom Out from fit-page (~70%): should be 66.7%, then 50%, then 33.3%, then 25%
    expect(getNextAcrobatZoomOut(0.70)).toBe(0.667);
    expect(getNextAcrobatZoomOut(0.667)).toBe(0.50);
    expect(getNextAcrobatZoomOut(0.50)).toBe(0.333);
    expect(getNextAcrobatZoomOut(0.333)).toBe(0.25);
    expect(getNextAcrobatZoomOut(0.25)).toBe(0.25); // Clamped at min

    // 2. Zoom In from fit-page (~70%): should be 75%, then 100%, then 125%, then 150%
    expect(getNextAcrobatZoomIn(0.70)).toBe(0.75);
    expect(getNextAcrobatZoomIn(0.75)).toBe(1.00);
    expect(getNextAcrobatZoomIn(1.00)).toBe(1.25);
    expect(getNextAcrobatZoomIn(1.25)).toBe(1.50);
    expect(getNextAcrobatZoomIn(1.50)).toBe(2.00);
    expect(getNextAcrobatZoomIn(4.00)).toBe(5.00);
    expect(getNextAcrobatZoomIn(5.00)).toBe(5.00); // Clamped at max
  });

  test("Ketoral PDF link alignment and re-render on scroll return", async ({ page }) => {
    test.setTimeout(90000);

    // Giriş yap
    await page.goto("/dokumantasyon");
    const username = page.locator("input#username").first();
    if (await username.isVisible({ timeout: 4000 }).catch(() => false)) {
      await username.fill("admin");
      await page.locator("input#password").first().fill("admin");
      await page.getByRole("button", { name: "Giriş Yap" }).first().click();
      await page.waitForTimeout(1000);
    }

    const filePath = "C:/Users/hsyn/Downloads/Erkek Tipi Saç Dökülmesinde Ketoral.pdf";
    expect(fs.existsSync(filePath)).toBe(true);

    const fileBytes = fs.readFileSync(filePath);
    const base64 = fileBytes.toString("base64");

    const fileId = await page.evaluate(
      async ({ name, content }) => {
        const bytes = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
        const formData = new FormData();
        formData.append("file", new File([bytes], name, { type: "application/pdf" }));
        formData.append("pathname", `dok_storage/ketoral-verify-${Date.now()}.pdf`);
        const response = await fetch("/api/dokumantasyon/upload/local", {
          method: "POST",
          body: formData,
        });
        const payload = await response.json();
        return payload.file.id;
      },
      { name: "ketoral-verify.pdf", content: base64 }
    );

    expect(fileId).toBeTruthy();

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    await page.waitForSelector("canvas[data-testid='pdf-page-canvas-1']", { timeout: 30000 });

    // 1. Sayfa 9'a git ve Sayfa 9'daki FDA link konumunu doğrula
    const pageInput = page.getByRole("textbox", { name: "Geçerli Sayfa" });
    await pageInput.fill("9");
    await pageInput.press("Enter");
    await page.waitForTimeout(2000);

    // Sayfa 9 içindeki FDA linkini bul (accessdata.fda.gov)
    const fdaLinkP9 = page.locator("[data-testid='pdf-page-9'] a[title*='accessdata.fda.gov']").first();
    await expect(fdaLinkP9).toBeAttached({ timeout: 15000 });
    await fdaLinkP9.scrollIntoViewIfNeeded();
    await expect(fdaLinkP9).toBeVisible({ timeout: 5000 });

    const fdaStyle = await fdaLinkP9.evaluate((el) => {
      return {
        topStyle: parseFloat(el.style.top),
        leftStyle: parseFloat(el.style.left),
        widthStyle: parseFloat(el.style.width),
        heightStyle: parseFloat(el.style.height),
      };
    });

    // Sayfa 9'un CSS genişliğinden geçerli ölçeği türet
    const page9Width = await page.locator("[data-testid='pdf-page-9']").evaluate((el) => {
      return el.clientWidth;
    });
    const page9Scale = page9Width / 595.275591;

    console.log("Page 9 Scale:", page9Scale, "FDA link layout info:", fdaStyle);

    // Kök neden analizi kanıtı:
    // Doğru viewport koordinatında FDA linki Y = 338.2pt * scale olmalıdır.
    // Hatalı eski kodda Y = 492.43pt * scale oluyordu (154pt başlık üzerine kayıyordu).
    const expectedTop = 338.205 * page9Scale;
    const oldFlawedTop = 492.434 * page9Scale;

    console.log("Expected Top:", expectedTop, "Old Flawed Top:", oldFlawedTop, "Actual Top:", fdaStyle.topStyle);

    // Gerçek değer beklenen 338.2*scale değerine 5px'ten yakın olmalıdır
    expect(Math.abs(fdaStyle.topStyle - expectedTop)).toBeLessThan(5);
    // Eski hatalı konumdan en az 100px uzakta olmalıdır
    expect(Math.abs(fdaStyle.topStyle - oldFlawedTop)).toBeGreaterThan(100);

    // Ekran görüntüsü al: Linkin referans [40] rozeti üzerine tam oturduğunun görsel kanıtı
    await page.screenshot({ path: "docs/pdf-viewer-v3/kanit/ketoral-page9-fixed-link.png" });

    // 2. Sayfa 10'a git ve canvas boyutunu doğrula (1x1 boş sayfa olmamalı)
    await pageInput.fill("10");
    await pageInput.press("Enter");
    await page.waitForTimeout(2000);

    const page10Canvas = page.locator("canvas[data-testid='pdf-page-canvas-10']");
    await expect(page10Canvas).toBeVisible();

    const canvasInfoP10 = await page10Canvas.evaluate((c: HTMLCanvasElement) => ({
      width: c.width,
      height: c.height,
    }));

    console.log("Page 10 canvas dimensions:", canvasInfoP10);
    expect(canvasInfoP10.width).toBeGreaterThan(500);
    expect(canvasInfoP10.height).toBeGreaterThan(500);

    // 3. Pencereleme dışına çık (Sayfa 1'e git) ve geri dön (Sayfa 10'a geri dön)
    await pageInput.fill("1");
    await pageInput.press("Enter");
    await page.waitForTimeout(2000);

    // Sayfa 10'a geri dön
    await pageInput.fill("10");
    await pageInput.press("Enter");
    await page.waitForTimeout(2500);

    const reRenderedCanvasP10 = await page10Canvas.evaluate((c: HTMLCanvasElement) => ({
      width: c.width,
      height: c.height,
    }));

    console.log("Page 10 re-rendered canvas dimensions:", reRenderedCanvasP10);
    // Pencereleme geri dönüşünde canvas 1x1 kalmamalı, tam boyutlu re-render olmalı!
    expect(reRenderedCanvasP10.width).toBeGreaterThan(500);
    expect(reRenderedCanvasP10.height).toBeGreaterThan(500);

    // Ekran görüntüsü al: Sayfa 10'un boş kalmadığının, dolu ve eksiksiz render edildiğinin görsel kanıtı
    await page.screenshot({ path: "docs/pdf-viewer-v3/kanit/ketoral-page10-fixed.png" });

    // 4. Adobe Acrobat Kademeli Zoom Butonlarını Test Et
    const zoomInBtn = page.getByRole("button", { name: "Büyüt", exact: false }).first();
    const zoomOutBtn = page.getByRole("button", { name: "Küçült", exact: false }).first();

    if (await zoomInBtn.isVisible()) {
      // Zoom In tıkla
      await zoomInBtn.click();
      await page.waitForTimeout(600);

      // Zoom Out tıkla
      await zoomOutBtn.click();
      await page.waitForTimeout(600);
    }
  });
});
