import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * FAZ F — PDF Görüntüleyici v2 Zoom ve Jestler E2E Kabul Test Paketi
 *
 * 1. Masaüstü Zoom ve Klavye Kısayolları (+, -, 0, 1, 2)
 * 2. Kelimeye Çift Tıklama: Metin katmanında kelime seçimi korunmalı, akıllı zoom metin seçimini bozmamalı
 * 3. El Aracı / Boşlukta Çift Tıklama: Akıllı zoom tetiklenmeli
 * 4. Mobil Dokunmatik Sözleşmesi: touch-action: pan-x pan-y ve user-scalable=no olmaması
 * 5. Ekran Yeniden Boyutlandırma / Döndürme: scrollRatio korunumu
 * 6. Kısayol Yardım Paneli: '?' tuşu ile açılma ve 'Escape' ile kapanma
 */

async function login(page: Page) {
  await page.goto("/dokumantasyon");
  const username = page.locator("input#username").first();
  const loginVisible = await username
    .waitFor({ state: "visible", timeout: 3000 })
    .then(() => true)
    .catch(() => false);

  if (loginVisible) {
    await username.fill("admin");
    await page.locator("input#password").first().fill("admin");
    await page.getByRole("button", { name: "Giriş Yap" }).first().click();
    await expect(page.locator("input#username").first()).toBeHidden();
  }
}

async function uploadFixturePdf(page: Page, fixtureFileName: string): Promise<string> {
  const filePath = path.join(process.cwd(), "tests", "fixtures", "pdf", fixtureFileName);
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
      formData.append("pathname", `dok_storage/faz-f-${Date.now()}-${name}`);
      const response = await fetch("/api/dokumantasyon/upload/local", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload.file?.id) throw new Error(payload.error || "upload failed");
      return payload.file.id as string;
    },
    { name: fixtureFileName, content: base64 }
  );
}

test.describe("PDF Görüntüleyici v2 — FAZ F Zoom ve Jestler", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // --------------------------------------------------------------------------
  // TEST 1: Masaüstü Zoom ve Klavye Kısayolları (+, -, 0, 1, 2)
  // --------------------------------------------------------------------------
  test("1. Masaüstü Zoom ve Klavye Kısayolları (+, -, 0, 1, 2)", async ({ page }) => {
    test.setTimeout(60_000);
    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 20_000 });

    const scroller = page.getByTestId("pdf-scroll-viewport");
    await expect(scroller).toBeVisible();
    await scroller.focus();

    page.on("console", (msg) => console.log(`[TEST 1 BROWSER] ${msg.text()}`));

    const beforePress1 = await canvas.evaluate((c) => c.getBoundingClientRect().width);
    console.log(`[TEST 1] Before press("1"): width=${beforePress1}`);

    // 1. Orijinal Boyut (1 tuşu)
    await page.keyboard.press("1");
    await page.waitForTimeout(600);
    const initialWidth = await canvas.evaluate((c) => c.getBoundingClientRect().width);
    console.log(`[TEST 1] After press("1"): width=${initialWidth}`);
    expect(initialWidth).toBeGreaterThan(0);

    // 2. Yakınlaştır (+ tuşu)
    await page.keyboard.press("+");
    await page.waitForTimeout(600);
    const zoomedInWidth = await canvas.evaluate((c) => c.getBoundingClientRect().width);
    console.log(`[TEST 1] After press("+"): width=${zoomedInWidth}`);
    expect(zoomedInWidth).toBeGreaterThan(initialWidth);

    // 3. Uzaklaştır (- tuşu)
    await page.keyboard.press("-");
    await page.waitForTimeout(500);
    const zoomedOutWidth = await canvas.evaluate((c) => c.getBoundingClientRect().width);
    expect(zoomedOutWidth).toBeLessThan(zoomedInWidth);

    // 4. Genişliğe Sığdır (2 tuşu)
    await page.keyboard.press("2");
    await page.waitForTimeout(500);
    const rootContainer = page.locator("[data-zoom-mode]");
    await expect(rootContainer).toHaveAttribute("data-zoom-mode", "fit-width");

    // 5. Sayfaya Sığdır (0 tuşu)
    await page.keyboard.press("0");
    await page.waitForTimeout(500);
    await expect(rootContainer).toHaveAttribute("data-zoom-mode", "fit-page");

    console.log("[FAZ F TEST 1] Klavye zoom kısayolları (+, -, 0, 1, 2) başarıyla doğrulandı.");
  });

  // --------------------------------------------------------------------------
  // TEST 2: Kelimeye Çift Tıklama: Metin katmanında kelime seçimi korunmalı
  // --------------------------------------------------------------------------
  test("2. Kelimeye Çift Tıklama: Metin katmanında kelime seçimi korunmalı (akıllı zoom bozmaz)", async ({ page }) => {
    test.setTimeout(60_000);
    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    const firstSpan = page.locator(".pdf-text-layer span, .textLayer span").first();
    await expect(firstSpan).toBeVisible({ timeout: 25_000 });

    // Önce %100 moduna al
    await page.locator('[data-command-id="pdf.zoom.100"]').first().click();
    await page.waitForTimeout(500);

    const canvas = page.locator("canvas").first();
    const widthBefore = await canvas.evaluate((c) => c.getBoundingClientRect().width);

    // Metin katmanındaki ilk span üzerine çift tıkla
    await firstSpan.dblclick();
    await page.waitForTimeout(400);

    // Seçilen metni denetle
    const selectedText = await page.evaluate(() => window.getSelection()?.toString().trim() || "");
    expect(selectedText.length).toBeGreaterThan(0);

    // Zoom ölçeğinin değişmediğini doğrula (akıllı zoom kelime seçimini ezmemeli)
    const widthAfter = await canvas.evaluate((c) => c.getBoundingClientRect().width);
    expect(Math.abs(widthAfter - widthBefore)).toBeLessThan(1.0);

    console.log(`[FAZ F TEST 2] Kelimeye çift tıklama yerel seçimi korudu: "${selectedText}". Zoom değişmedi.`);
  });

  // --------------------------------------------------------------------------
  // TEST 3: El Aracı Açıkken Çift Tıklama: Akıllı zoom tetiklenmeli
  // --------------------------------------------------------------------------
  test("3. El Aracı / Boşlukta Çift Tıklama: Akıllı zoom tetiklenmeli", async ({ page }) => {
    test.setTimeout(60_000);
    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible({ timeout: 20_000 });

    // 100% boyutuna getir
    await page.locator('[data-command-id="pdf.zoom.100"]').first().click();
    await page.waitForTimeout(500);
    const widthBefore = await canvas.evaluate((c) => c.getBoundingClientRect().width);

    // El aracını etkinleştir (H tuşu)
    await page.keyboard.press("h");
    await page.waitForTimeout(300);

    // Sayfa kenarında çift tıkla
    const scroller = page.getByTestId("pdf-scroll-viewport");
    await scroller.dblclick({ position: { x: 30, y: 30 } });
    await page.waitForTimeout(800);

    const widthAfter = await canvas.evaluate((c) => c.getBoundingClientRect().width);
    expect(widthAfter).not.toEqual(widthBefore);

    console.log(`[FAZ F TEST 3] El aracı açıkken çift tıklama akıllı zoom tetikledi (${widthBefore}px -> ${widthAfter}px).`);
  });

  // --------------------------------------------------------------------------
  // TEST 4: Mobil Dokunmatik Sözleşmesi: touch-action ve user-scalable
  // --------------------------------------------------------------------------
  test("4. Mobil Dokunmatik Sözleşmesi: touch-action: pan-x pan-y ve user-scalable=no olmaması", async ({ page }) => {
    test.setTimeout(60_000);
    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    const scroller = page.getByTestId("pdf-scroll-viewport");
    await expect(scroller).toBeVisible();

    // 1. Scroller üzerinde touch-action denetimi
    const touchAction = await scroller.evaluate((el) => window.getComputedStyle(el).touchAction);
    expect(touchAction).toContain("pan-x");
    expect(touchAction).toContain("pan-y");

    // 2. Sayfa genelinde user-scalable=no OLMADIĞI doğrulaması (Erişilebilirlik şartı)
    const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(viewportMeta || "").not.toContain("user-scalable=no");
    expect(viewportMeta || "").not.toContain("user-scalable=0");

    console.log(`[FAZ F TEST 4] Mobil touch-action (${touchAction}) ve erişilebilirlik (user-scalable=no yok) doğrulandı.`);
  });

  // --------------------------------------------------------------------------
  // TEST 5: Ekran Yeniden Boyutlandırma / Döndürme: scrollRatio korunumu
  // --------------------------------------------------------------------------
  test("5. Ekran Yeniden Boyutlandırma / Döndürme: scrollRatio korunumu", async ({ page }) => {
    test.setTimeout(60_000);
    const fileId = await uploadFixturePdf(page, "uzun-300.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    const scroller = page.getByTestId("pdf-scroll-viewport");
    await expect(scroller).toBeVisible();

    // 100. sayfaya kadar scroll yap
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="pdf-scroll-viewport"]') as HTMLElement;
      if (el) el.scrollTop = el.scrollHeight * 0.35;
    });
    await page.waitForTimeout(600);

    const ratioBefore = await scroller.evaluate((el) => el.scrollTop / el.scrollHeight);
    expect(ratioBefore).toBeGreaterThan(0.2);

    // Viewport'u yeniden boyutlandır (ekran döndürme simülasyonu)
    await page.setViewportSize({ width: 640, height: 900 });
    await page.waitForTimeout(600);

    const ratioAfter = await scroller.evaluate((el) => el.scrollTop / el.scrollHeight);
    const deltaRatio = Math.abs(ratioAfter - ratioBefore);

    expect(deltaRatio).toBeLessThan(0.08);
    console.log(`[FAZ F TEST 5] Ekran boyutu değişiminde okuma konumu oranı korundu (Önce: ${ratioBefore.toFixed(3)}, Sonra: ${ratioAfter.toFixed(3)}).`);
  });

  // --------------------------------------------------------------------------
  // TEST 6: Kısayol Yardım Paneli: '?' tuşu ile açılma ve 'Escape' ile kapanma
  // --------------------------------------------------------------------------
  test("6. Kısayol Yardım Paneli: '?' tuşu ile açılma ve 'Escape' ile kapanma", async ({ page }) => {
    test.setTimeout(60_000);
    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    const scroller = page.getByTestId("pdf-scroll-viewport");
    await expect(scroller).toBeVisible();
    await scroller.focus();

    const shortcutsModal = page.getByTestId("pdf-shortcuts-modal");
    await expect(shortcutsModal).toBeHidden();

    // '?' tuşuna bas
    await page.keyboard.press("?");
    await expect(shortcutsModal).toBeVisible({ timeout: 5_000 });

    // 'Escape' tuşuna bas
    await page.keyboard.press("Escape");
    await expect(shortcutsModal).toBeHidden({ timeout: 5_000 });

    console.log("[FAZ F TEST 6] Kısayol modalı ('?' ile açılış, 'Escape' ile kapanış) başarıyla doğrulandı.");
  });
});
