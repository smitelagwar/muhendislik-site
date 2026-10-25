import { test, expect } from "@playwright/test";

test.describe("Aşama 10 — Sınırlı Kolon Parametre Denemesi ve Bağlantı Paylaşımı", () => {
  test("Kolon parametreleri taslakta bekler, Uygula ile 3B+2B güncellenir, geçersiz girişte son sahne korunur; bağlantı paylaşımı, Reset ve bozuk URL geri dönüşü çalışır", async ({
    page,
  }) => {
    await page.goto("/kategori/araclar/simulasyonlar/kolon-detayi", {
      waitUntil: "domcontentloaded",
    });

    const canvasHost = page.getByTestId("simulation-canvas-host");
    await expect(canvasHost).toBeVisible({ timeout: 25_000 });

    // 1. Ürün/geometri limiti açıklaması ve serbest orbit paylaşım notu görünür olmalı
    await expect(page.getByTestId("column-params-product-limit-note")).toContainText(
      "UI aralıkları ürün/geometri limitidir, yönetmelik limiti değildir.",
    );
    await expect(page.getByTestId("share-camera-note")).toContainText(
      "Serbest orbit açısı paylaşılmaz; seçili hazır kamera yönü taşınır.",
    );

    const dimSummary = page.getByTestId("drawing-2d-dimensions-summary");
    await expect(dimSummary).toHaveAttribute("data-section-width-mm", "300");
    await expect(dimSummary).toHaveAttribute("data-section-depth-mm", "300");

    // 2. Taslak giriş değişirken Uygula'ya basılana kadar sahne yeniden üretilmemeli
    const widthInput = page.getByTestId("param-input-width");
    const depthInput = page.getByTestId("param-input-depth");
    const barDiaInput = page.getByTestId("param-input-bar-dia");
    const confSpacingInput = page.getByTestId("param-input-confinement-spacing");
    const midSpacingInput = page.getByTestId("param-input-middle-spacing");

    await widthInput.fill("450");
    await depthInput.fill("400");
    await barDiaInput.fill("24");
    await confSpacingInput.fill("100");
    await midSpacingInput.fill("125");

    // Henüz Uygula'ya basılmadı -> 2B ve başlık hâlâ 300×300 mm olmalı
    await expect(dimSummary).toHaveAttribute("data-section-width-mm", "300");
    await expect(page.getByTestId("simulation-scene-title")).toContainText("300×300 mm");

    // 3. Uygula'ya basınca 3B ve 2B birlikte güncellenmeli
    await page.getByTestId("apply-column-params-btn").click();
    await expect(dimSummary).toHaveAttribute("data-section-width-mm", "450");
    await expect(dimSummary).toHaveAttribute("data-section-depth-mm", "400");
    await expect(page.getByTestId("simulation-scene-title")).toContainText("450×400 mm");
    await expect(page.getByTestId("simulation-scene-title")).toContainText("4Ø24");

    // 4. Geçersiz girişte (örn. genişlik = 150 mm < 250 mm) son geçerli sahne (450×400) korunmalı ve neden gösterilmeli
    await widthInput.fill("150");
    await page.getByTestId("apply-column-params-btn").click();

    const errorBanner = page.getByTestId("column-params-error-banner");
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText("250–600 mm");
    await expect(dimSummary).toHaveAttribute("data-section-width-mm", "450");
    await expect(page.getByTestId("simulation-scene-title")).toContainText("450×400 mm");

    // 5. Görünüm durumunu özelleştir (Üst kamera, betonu gizle, boyuna donatıyı seç) ve bağlantıyı kopyala
    await page.getByTestId("camera-preset-top").click();
    await page.getByTestId("toggle-concrete-btn").click();
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "false");
    await page.getByTestId("svg-part-longitudinal-bar-1-sw").click();
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "longitudinal-bar-1-sw",
    );

    const copyBtn = page.getByTestId("copy-share-link-btn");
    const shareUrl = await copyBtn.getAttribute("data-share-url");
    expect(shareUrl).toBeTruthy();
    expect(shareUrl).toContain("v=1");
    expect(shareUrl).toContain("cw=450");
    expect(shareUrl).toContain("cd=400");
    expect(shareUrl).toContain("cb=24");
    expect(shareUrl).toContain("cam=top");
    expect(shareUrl).toContain("part=longitudinal-bar-1-sw");

    await copyBtn.click();

    // 6. Kopyalanan bağlantıyı doğrudan aç ve aynı durumun (parse -> validate -> model -> view) yüklendiğini doğrula
    await page.goto(shareUrl!, { waitUntil: "domcontentloaded" });
    await expect(canvasHost).toBeVisible({ timeout: 25_000 });
    await expect(dimSummary).toHaveAttribute("data-section-width-mm", "450");
    await expect(dimSummary).toHaveAttribute("data-section-depth-mm", "400");
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "false");
    await expect(canvasHost).toHaveAttribute(
      "data-selected-part-id",
      "longitudinal-bar-1-sw",
    );

    // 7. Reset'e basıldığında varsayılan C1 (300×300) durumuna dönmeli ve URL parametreleri gizlice tekrar uygulanmamalı
    const resetBtn = page.getByTestId("learning-reset-btn");
    await resetBtn.scrollIntoViewIfNeeded();
    await resetBtn.click();

    await expect(dimSummary).toHaveAttribute("data-section-width-mm", "300");
    await expect(dimSummary).toHaveAttribute("data-section-depth-mm", "300");
    await expect(canvasHost).toHaveAttribute("data-concrete-visible", "true");
    await expect(canvasHost).toHaveAttribute("data-selected-part-id", "");
    await expect(page).toHaveURL(/\/kategori\/araclar\/simulasyonlar\/kolon-detayi$/);

    // 8. Bozuk / negatif / NaN / bilinmeyen sürümlü URL ile açılışta kilitlenmeden güvenli varsayılana dönmeli
    await page.goto(
      "/kategori/araclar/simulasyonlar/kolon-detayi?v=99&cw=-500&spos=NaN&part=olmayan",
      { waitUntil: "domcontentloaded" },
    );
    await expect(canvasHost).toBeVisible({ timeout: 25_000 });
    await expect(page.getByTestId("url-fallback-notice")).toBeVisible();
    await expect(dimSummary).toHaveAttribute("data-section-width-mm", "300");
  });
});
