import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

async function waitForStudioReady(page: Page, route: string) {
  await page.goto(route, { waitUntil: "domcontentloaded", timeout: 35_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  await expect(studio).toBeVisible({ timeout: 20_000 });
  const toolbar = studio.locator('[data-testid="belge-studio-preview-toolbar"]');
  await expect(toolbar).toBeVisible({ timeout: 10_000 });
  const canvas = studio.locator('[data-testid="belge-studio-preview-canvas"] canvas').first();
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  await expect(canvas).toHaveCSS("opacity", "1", { timeout: 15_000 });
  return { studio, toolbar, canvas };
}

async function getCanvasInkMetrics(page: Page) {
  return await page.evaluate(() => {
    const cvs = document.querySelector('[data-testid="belge-studio-preview-canvas"] canvas') as HTMLCanvasElement;
    const cnt = document.querySelector('[data-testid="belge-studio-preview-canvas"]') as HTMLElement;
    if (!cvs || !cnt) return { hasCanvas: false, inkRatio: 0, inkPixels: 0, intersectRatio: 0, width: 0, height: 0 };

    const cRect = cnt.getBoundingClientRect();
    const cvsRect = cvs.getBoundingClientRect();
    const intersectW = Math.max(0, Math.min(cRect.right, cvsRect.right) - Math.max(cRect.left, cvsRect.left));
    const intersectH = Math.max(0, Math.min(cRect.bottom, cvsRect.bottom) - Math.max(cRect.top, cvsRect.top));
    const cvsArea = Math.max(1, cvsRect.width * cvsRect.height);
    const intersectRatio = (intersectW * intersectH) / cvsArea;

    if (cvs.width <= 0 || cvs.height <= 0) {
      return { hasCanvas: true, inkRatio: 0, inkPixels: 0, intersectRatio, width: cvs.width, height: cvs.height };
    }

    const sample = document.createElement("canvas");
    sample.width = 100;
    sample.height = 100;
    const sCtx = sample.getContext("2d");
    if (!sCtx) return { hasCanvas: true, inkRatio: 0, inkPixels: 0, intersectRatio, width: cvs.width, height: cvs.height };

    sCtx.drawImage(cvs, 0, 0, 100, 100);
    const img = sCtx.getImageData(0, 0, 100, 100);
    let ink = 0;
    for (let i = 0; i < img.data.length; i += 4) {
      const a = img.data[i + 3];
      const lum = 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
      if (a > 50 && lum < 235) {
        ink++;
      }
    }

    return {
      hasCanvas: true,
      width: cvs.width,
      height: cvs.height,
      cssWidth: cvs.style.width,
      cssHeight: cvs.style.height,
      transform: cvs.style.transform,
      opacity: cvs.style.opacity,
      inkPixels: ink,
      inkRatio: ink / 10000,
      intersectRatio,
    };
  });
}

test.describe("ASAMA_01: Ultra Smooth PDF Zoom, Sessiz Güncelleme ve Görsel Koruma Testleri", () => {
  const outputDir = path.resolve(process.cwd(), "test-results/asama01-smooth-zoom");

  test.beforeAll(() => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
  });

  test("1. Hassasiyet & Easing: Tek Ctrl+Wheel çentiği %100 -> ~%107-109 arası kademesiz büyütür (eski %127 sıçraması yok)", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { studio, toolbar, canvas } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    // Başlangıç %100 doğrulaması
    const zoomText = toolbar.locator('[data-testid="belge-studio-zoom-level"]');
    await expect(zoomText).toHaveText("%100", { timeout: 5000 });

    const initialInk = await getCanvasInkMetrics(page);
    expect(initialInk.inkRatio).toBeGreaterThan(0.01);

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    const centerX = canvasBox!.x + canvasBox!.width / 2;
    const centerY = canvasBox!.y + canvasBox!.height / 2;

    await page.mouse.move(centerX, centerY);

    // Ctrl tuşu basılı ve tek notch wheel (deltaY = -120)
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -120);
    await page.keyboard.up("Control");

    // Ara karede (50-100ms) transform CSS ölçekli olmalı
    await page.waitForTimeout(70);
    const midTransform = await page.evaluate(() => {
      const cvs = document.querySelector('[data-testid="belge-studio-preview-canvas"] canvas') as HTMLCanvasElement;
      return cvs?.style.transform;
    });
    expect(midTransform).toContain("scale");

    // Settle anını bekle (toplam ~300ms)
    await page.waitForTimeout(300);

    // Final zoom seviyesini oku: %107 veya %108 olmalı, %127 gibi kaba olmamalı
    const finalZoomVal = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="belge-studio-zoom-level"]');
      return parseInt(el?.textContent?.replace("%", "") || "0", 10);
    });

    expect(finalZoomVal).toBeGreaterThanOrEqual(106);
    expect(finalZoomVal).toBeLessThanOrEqual(110);
    expect(finalZoomVal).not.toBe(127); // Eski aşırı sıçrama yok!

    // Mürekkep dolu ve okunabilir
    const finalInk = await getCanvasInkMetrics(page);
    expect(finalInk.inkRatio).toBeGreaterThan(0.01);
  });

  test("2. Sürekli Wheel Birikimi & Tersine Dönüş: Çoklu wheel darbesi akıcı birleşir, yön dönüşünde atlama yapmaz", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { canvas } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const canvasBox = await canvas.boundingBox();
    const centerX = canvasBox!.x + canvasBox!.width / 2;
    const centerY = canvasBox!.y + canvasBox!.height / 2;
    await page.mouse.move(centerX, centerY);

    // Hızlı 5 darbe büyütme
    await page.keyboard.down("Control");
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(25);
    }
    await page.keyboard.up("Control");

    // Hemen 200ms bekle ve zoom oku (yaklaşık %135-155 aralığına gelmeli)
    await page.waitForTimeout(250);
    const zoomedVal = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="belge-studio-zoom-level"]');
      return parseInt(el?.textContent?.replace("%", "") || "0", 10);
    });
    expect(zoomedVal).toBeGreaterThan(130);
    expect(zoomedVal).toBeLessThanOrEqual(180);

    // Şimdi 3 darbe küçültme (ters yön)
    await page.keyboard.down("Control");
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(25);
    }
    await page.keyboard.up("Control");

    await page.waitForTimeout(350);
    const reversedVal = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="belge-studio-zoom-level"]');
      return parseInt(el?.textContent?.replace("%", "") || "0", 10);
    });
    expect(reversedVal).toBeLessThan(zoomedVal);

    // Mürekkep sağlam
    const ink = await getCanvasInkMetrics(page);
    expect(ink.inkRatio).toBeGreaterThan(0.01);
  });

  test("3. Sessiz Form Güncellemesi: Form yazılırken üst barda 'Derleniyor...' veya turuncu spinner görünmez, taslak SVG çalışır", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    // Sol formdaki ilk metin alanını bul (Şantiye Şefi Adı veya Yapı Adresi)
    const firstInput = page.locator('input[type="text"]:visible').first();
    await expect(firstInput).toBeVisible({ timeout: 5000 });

    // Hızlı yazma işlemi yap
    await firstInput.fill("Ahmet Yılmaz Test");

    // Üst barda Derleniyor... veya spinner ASLA görünmemeli
    const updatingText = page.locator('text="Derleniyor..."');
    await expect(updatingText).toHaveCount(0);

    const headerSpinner = page.locator('header [role="status"] .animate-spin');
    await expect(headerSpinner).toHaveCount(0);

    // Önizleme alanında gereksiz "Belge güncelleniyor…" bannerı görünmemeli (çünkü geçerli PDF var)
    const previewUpdatingBanner = page.locator('text="Belge güncelleniyor…"');
    await expect(previewUpdatingBanner).toHaveCount(0);

    // Otomatik taslak durum rozetinin "Kaydedildi" veya kayıt animasyonuna geçtiğini doğrula
    const draftStatus = page.locator('[data-testid="belge-draft-status-badge"]');
    await expect(draftStatus).toBeVisible({ timeout: 5000 });

    // 2.5 sn sonra taslak kaydedilmiş olmalı
    await page.waitForTimeout(2600);
    await expect(draftStatus).toContainText("Kaydedildi", { timeout: 5000 });

    // PDF çizimi bozulmamış ve mürekkep dolu olmalı
    const ink = await getCanvasInkMetrics(page);
    expect(ink.inkRatio).toBeGreaterThan(0.01);
  });

  test("4. Komut Yarışı & Devir: Smooth wheel zoom sırasında Sığdır basılınca temiz geçiş yapılır, beyaz ekran oluşmaz", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const { toolbar, canvas } = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const canvasBox = await canvas.boundingBox();
    const centerX = canvasBox!.x + canvasBox!.width / 2;
    const centerY = canvasBox!.y + canvasBox!.height / 2;
    await page.mouse.move(centerX, centerY);

    // Wheel başlat
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -250);
    await page.keyboard.up("Control");

    // Wheel sürerken hemen Sığdır'a bas
    await page.waitForTimeout(60);
    const fitBtn = toolbar.locator('[data-testid="belge-preview-fit-page-btn"]');
    await fitBtn.click();

    // Settle bekle
    await page.waitForTimeout(400);

    const finalZoom = toolbar.locator('[data-testid="belge-studio-zoom-level"]');
    await expect(finalZoom).toHaveText("%100", { timeout: 5000 });

    // Kesin mürekkep kontrolü: beyaz ekran olmamalı!
    const ink = await getCanvasInkMetrics(page);
    expect(ink.inkRatio).toBeGreaterThan(0.01);
    expect(ink.inkPixels).toBeGreaterThan(100);
  });

  test("5. Beş Belge Stüdyosu Kapsama Kontrolü: Tüm şablonlar açılır, zoom kontrolleri ve mürekkep aktiftir", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const routes = [
      "/belgeler/santiye-sefi-taahhutnamesi",
      "/belgeler/santiye-sefi-sozlesmesi",
      "/belgeler/santiye-sefi-istifa-dilekcesi",
      "/belgeler/insaat-ruhsati-dilekcesi",
      "/belgeler/beton-dokum-tutanagi",
    ];

    for (const route of routes) {
      const { toolbar } = await waitForStudioReady(page, route);
      const zoomText = toolbar.locator('[data-testid="belge-studio-zoom-level"]');
      await expect(zoomText).toBeVisible({ timeout: 5000 });

      const ink = await getCanvasInkMetrics(page);
      expect(ink.inkRatio).toBeGreaterThan(0.01);
    }
  });
});
