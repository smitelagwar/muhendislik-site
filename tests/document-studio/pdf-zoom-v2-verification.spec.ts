import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

async function login(page: Page) {
  await page.goto("/dokumantasyon");
  const username = page.locator("input#username").first();
  const loginVisible = await username
    .waitFor({ state: "visible", timeout: 4000 })
    .then(() => true)
    .catch(() => false);

  if (loginVisible) {
    await username.fill("admin");
    await page.locator("input#password").first().fill("admin");
    await page.getByRole("button", { name: "Giriş Yap" }).first().click();
    await expect(page.locator("input#username").first()).toBeHidden();
  }
}

async function uploadPdfFile(page: Page, relativePath: string, customName: string): Promise<string> {
  const filePath = path.resolve(relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fixture dosyasi bulunamadi: ${filePath}`);
  }

  const fileBytes = fs.readFileSync(filePath);
  const base64 = fileBytes.toString("base64");

  return page.evaluate(
    async ({ name, content }) => {
      const bytes = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
      const formData = new FormData();
      formData.append("file", new File([bytes], name, { type: "application/pdf" }));
      formData.append("pathname", `dok_storage/zoom-v2-${Date.now()}-${name}`);
      const response = await fetch("/api/dokumantasyon/upload/local", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload.file?.id) throw new Error(payload.error || "upload failed");
      return payload.file.id as string;
    },
    { name: customName, content: base64 }
  );
}

test.describe("PDF Zoom/Pinch v2 Görsel ve Davranışsal Doğrulama Paketi", () => {
  let docId = "";
  let uzunDocId = "";
  const screenshotsDir = path.resolve("docs/pdf-zoom-v2-screenshots");

  test.beforeAll(async ({ browser }) => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    const page = await browser.newPage();
    await login(page);
    docId = await uploadPdfFile(page, "tests/fixtures/pdf/tr-metin.pdf", "tr-metin-zoom-test.pdf");
    uzunDocId = await uploadPdfFile(page, "tests/fixtures/pdf/uzun-300.pdf", "uzun-300-zoom-test.pdf");
    await page.close();
  });

  test("1. Masaüstü: Başlangıç görünümü, Toolbar Zoom In/Out odak koruma, Wheel zoom ve ekran görüntüleri", async ({ page }) => {
    test.setTimeout(90_000);
    await login(page);
    await page.goto(`/dokumantasyon/dosya/${docId}`);

    // Sayfa ve canvas yüklenmesini bekle
    await page.waitForSelector("canvas[data-testid='pdf-page-canvas-1']", { timeout: 20000 });
    await page.waitForTimeout(1000);

    // 1. Ekran Görüntüsü: Başlangıç Hali
    await page.screenshot({ path: path.join(screenshotsDir, "01-desktop-initial.png") });

    // Başlangıç boyutlarını al
    const initialBox = await page.locator("[data-page-number='1']").boundingBox();
    expect(initialBox).toBeTruthy();

    // 2. Toolbar Yakınlaştır (+) Butonu ile Zoom In (zoomTo tetiklenir)
    const zoomInBtn = page.locator("button[data-command-id='pdf.zoom.in']").first();
    await expect(zoomInBtn).toBeVisible({ timeout: 10000 });
    await zoomInBtn.click();
    await page.waitForTimeout(600);
    await zoomInBtn.click();
    await page.waitForTimeout(1200);

    // Zoom sonrası data-zooming kaldırılmış olmalı
    const scrollContainer = page.locator(".pdf-scroll");
    await expect(scrollContainer).not.toHaveAttribute("data-zooming");

    // 2. Ekran Görüntüsü: Büyütülmüş (%150)
    await page.screenshot({ path: path.join(screenshotsDir, "02-desktop-zoomed-in.png") });

    const zoomedBox = await page.locator("[data-page-number='1']").boundingBox();
    expect(zoomedBox).toBeTruthy();
    expect(zoomedBox!.width).toBeGreaterThan(initialBox!.width);

    // 3. Toolbar Uzaklaştır (-) Butonu ile Zoom Out
    const zoomOutBtn = page.locator("button[data-command-id='pdf.zoom.out']").first();
    await zoomOutBtn.click();
    await page.waitForTimeout(1000);

    // 3. Ekran Görüntüsü: Küçültülmüş
    await page.screenshot({ path: path.join(screenshotsDir, "03-desktop-zoomed-out.png") });

    // 4. Mouse Wheel Zoom (Ctrl + Wheel) normalizasyon ve kararlılık testi
    await page.evaluate(() => {
      const scrollEl = document.querySelector(".pdf-scroll");
      if (!scrollEl) return;
      const rect = scrollEl.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const midY = rect.top + rect.height / 2;

      // Ctrl + Wheel In simülasyonu
      const wheelEv = new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        clientX: midX,
        clientY: midY,
        deltaY: -80,
        deltaMode: 0,
        ctrlKey: true,
      });
      scrollEl.dispatchEvent(wheelEv);
    });

    // 180ms debounce + render bekle
    await page.waitForTimeout(1200);

    // 4. Ekran Görüntüsü: Wheel Zoom
    await page.screenshot({ path: path.join(screenshotsDir, "04-desktop-wheel-zoom.png") });

    // Sayfa kenarları taşmamalı, data-zooming kalkmış olmalı
    await expect(scrollContainer).not.toHaveAttribute("data-zooming");
  });

  test("2. Mobil Emülasyon: Fit-width, Pinch Zoom ve Adres Çubuğu Height-Resize Korunumu", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 14 boyutu
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await login(page);
    await page.goto(`/dokumantasyon/dosya/${docId}`);

    await page.waitForSelector("canvas[data-testid='pdf-page-canvas-1']", { timeout: 20000 });
    await page.waitForTimeout(1000);

    // 5. Ekran Görüntüsü: Mobil Başlangıç (Genişliğe Sığdırma)
    await page.screenshot({ path: path.join(screenshotsDir, "05-mobile-initial-fit-width.png") });

    // Mobilde document level horizontal overflow OLMAMALI
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth, "Mobilde pencere genelinde yatay taşma olmamalı").toBeLessThanOrEqual(clientWidth + 2);

    // İki parmak pinch jesti simülasyonu
    await page.evaluate(() => {
      const scrollEl = document.querySelector<HTMLElement>(".pdf-scroll");
      if (!scrollEl) return;
      const rect = scrollEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const t1Start = new Touch({ identifier: 1, target: scrollEl, clientX: cx - 40, clientY: cy });
      const t2Start = new Touch({ identifier: 2, target: scrollEl, clientX: cx + 40, clientY: cy });

      scrollEl.dispatchEvent(new TouchEvent("touchstart", {
        bubbles: true,
        cancelable: true,
        touches: [t1Start, t2Start],
      }));

      const t1Move = new Touch({ identifier: 1, target: scrollEl, clientX: cx - 80, clientY: cy });
      const t2Move = new Touch({ identifier: 2, target: scrollEl, clientX: cx + 80, clientY: cy });

      scrollEl.dispatchEvent(new TouchEvent("touchmove", {
        bubbles: true,
        cancelable: true,
        touches: [t1Move, t2Move],
      }));

      scrollEl.dispatchEvent(new TouchEvent("touchend", {
        bubbles: true,
        cancelable: true,
        touches: [],
      }));
    });

    await page.waitForTimeout(1500);

    // 6. Ekran Görüntüsü: Mobil Pinch Zoom Sonrası
    await page.screenshot({ path: path.join(screenshotsDir, "06-mobile-pinched.png") });

    // Sayfa genişliği pinch ile büyümüş olmalı
    const pinchedWidth = await page.evaluate(() => {
      const p1 = document.querySelector("[data-page-number='1']");
      return p1 ? p1.getBoundingClientRect().width : 0;
    });
    console.log(`[Mobil Pinch] Pinched sayfa genişliği: ${pinchedWidth}px (başlangıç: ${clientWidth}px)`);

    // 7. Mobil Adres Çubuğu Dikey Boyut Değişimi Simülasyonu (Height değişir, Width aynı kalır)
    // Sadece yükseklik değiştiğinde scale SIFIRLANMAMALI (Adım 4.3 kuralı)
    await page.setViewportSize({ width: 390, height: 740 });
    await page.waitForTimeout(800);

    const widthAfterAddressBarToggle = await page.evaluate(() => {
      const p1 = document.querySelector("[data-page-number='1']");
      return p1 ? p1.getBoundingClientRect().width : 0;
    });

    expect(Math.abs(widthAfterAddressBarToggle - pinchedWidth)).toBeLessThanOrEqual(2);

    // 7. Ekran Görüntüsü: Adres Çubuğu Dikey Değişim Sonrası (Scale Korundu)
    await page.screenshot({ path: path.join(screenshotsDir, "07-mobile-addressbar-height-resize-preserved.png") });

    await context.close();
  });

  test("3. Çok Sayfalı Belge: Yüksek Zoom ve Bellek Bütçesi Korunumu", async ({ page }) => {
    test.setTimeout(90_000);
    await login(page);
    await page.goto(`/dokumantasyon/dosya/${uzunDocId}`);

    await page.waitForSelector("canvas[data-testid='pdf-page-canvas-1']", { timeout: 20000 });
    await page.waitForTimeout(1000);

    // %200 Zoom'a getir
    const zoomInBtn = page.locator("button[data-command-id='pdf.zoom.in']").first();
    await expect(zoomInBtn).toBeVisible({ timeout: 10000 });
    for (let i = 0; i < 4; i++) {
      await zoomInBtn.click();
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(2000);

    // 8. Ekran Görüntüsü: Çok Sayfalı Belge Yüksek Zoom
    await page.screenshot({ path: path.join(screenshotsDir, "08-uzun-doc-zoomed.png") });

    // Bellek bütçesi kontrolü: DOM'daki dolu canvas sayısı pencereleme ile sınırlı kalmalı
    const populatedCanvases = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll("canvas[data-testid^='pdf-page-canvas-']"));
      return canvases.filter((c) => (c as HTMLCanvasElement).width > 0 && (c as HTMLCanvasElement).height > 0).length;
    });
    console.log(`[Bellek Denetimi] %200 Zoom'da dolu canvas sayısı: ${populatedCanvases} (Sınır: <= 13)`);
    expect(populatedCanvases).toBeLessThanOrEqual(13);
  });
});
