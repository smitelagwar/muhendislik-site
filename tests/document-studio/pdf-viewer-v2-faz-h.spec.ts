import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * FAZ H — PDF Görüntüleyici v2 Okuma Konumu ve Ayarlar E2E Kabul Test Paketi
 *
 * 1. Okuma Konumu Kaydetme ve Geri Yükleme (Restore Position)
 * 2. "Son konumdan devam et" Ayarı Kapalıyken Sayfa 1'e Açılma
 * 3. URL Hedefi (#page=...) Kayıtlı Konumu Ezer (Priority Order)
 * 4. Gece Modu (Night Mode): invert/hue-rotate filtresi ve yenilemede kalıcılık
 * 5. Ayarlar Menüsü Elemanları ve Klavye Kısayolları Modalı
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
      formData.append("pathname", `dok_storage/faz-h-${Date.now()}-${name}`);
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

test.describe("PDF Görüntüleyici v2 — FAZ H Okuma Konumu ve Ayarlar Testleri", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("1. Okuma konumu kaydetme ve sayfayı yenileyince geri yükleme", async ({ page }) => {
    const fileId = await uploadFixturePdf(page, "linkli.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const viewport = page.getByTestId("pdf-scroll-viewport");
    await expect(viewport).toBeVisible({ timeout: 15000 });

    // Sayfa 2 öğesini bul ve oraya kaydır
    const page2 = page.locator("#pdf-page-2");
    await expect(page2).toBeAttached({ timeout: 8000 });
    await page2.scrollIntoViewIfNeeded();

    // 500ms debounce ve localStorage kaydının tamamlanmasını bekle
    await page.waitForTimeout(800);

    // Sayfayı yenile
    await page.reload();
    await expect(viewport).toBeVisible({ timeout: 15000 });

    // Geri yüklendiğinde sayfa 2'nin görünür olduğunu doğrula
    await expect(page2).toBeVisible({ timeout: 8000 });
  });

  test("2. 'Son konumdan devam et' ayarı kapalıyken ilk sayfaya açılmalı", async ({ page }) => {
    const fileId = await uploadFixturePdf(page, "linkli.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const viewport = page.getByTestId("pdf-scroll-viewport");
    await expect(viewport).toBeVisible({ timeout: 15000 });

    // More ("⋮") menüsünü aç
    const moreBtn = page.getByTestId("pdf-viewer-more-menu-trigger");
    await moreBtn.click();

    // "Son okunan konumu hatırla" ayarını kapat
    const rememberToggle = page.getByTestId("pdf-remember-position-toggle");
    await expect(rememberToggle).toBeVisible();
    await rememberToggle.click();

    // Menü dışına tıkla ve sayfa 2'ye kaydır
    await page.keyboard.press("Escape");
    const page2 = page.locator("#pdf-page-2");
    await page2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    // Sayfayı yenile -> Ayar kapalı olduğu için sayfa 1'de kalmalı
    await page.reload();
    await expect(viewport).toBeVisible({ timeout: 15000 });

    const page1 = page.locator("#pdf-page-1");
    await expect(page1).toBeInViewport({ timeout: 8000 });

    // Temizlik: Ayarı tekrar aç
    await moreBtn.click();
    await rememberToggle.click();
  });

  test("3. URL #page=... hedefi kayıtlı konumu ezmeli", async ({ page }) => {
    const fileId = await uploadFixturePdf(page, "linkli.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const viewport = page.getByTestId("pdf-scroll-viewport");
    await expect(viewport).toBeVisible({ timeout: 15000 });

    // Sayfa 2'ye git ve kaydolmasını bekle
    const page2 = page.locator("#pdf-page-2");
    await page2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    // Şimdi URL'de #page=1 ile aç -> Kayıtlı konum sayfa 2 olsa bile URL önceliği nedeniyle sayfa 1 görünmeli
    await page.goto(`/dokumantasyon/dosya/${fileId}#page=1`);
    await expect(viewport).toBeVisible({ timeout: 15000 });

    const page1 = page.locator("#pdf-page-1");
    await expect(page1).toBeInViewport({ timeout: 8000 });
  });

  test("4. Gece modu açıldığında canvas'a filtre uygulanmalı ve yenilemede korunmalı", async ({ page }) => {
    const fileId = await uploadFixturePdf(page, "linkli.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const viewport = page.getByTestId("pdf-scroll-viewport");
    await expect(viewport).toBeVisible({ timeout: 15000 });

    // More ("⋮") menüsünü aç
    const moreBtn = page.getByTestId("pdf-viewer-more-menu-trigger");
    await moreBtn.click();

    // Gece modunu aç
    const nightModeToggle = page.getByTestId("pdf-night-mode-toggle");
    await expect(nightModeToggle).toBeVisible();
    await nightModeToggle.click();

    // Menüyü kapat
    await page.keyboard.press("Escape");

    // Canvas'ın invert filtresi aldığını doğrula
    const canvas = page.getByTestId("pdf-page-canvas-1");
    await expect(canvas).toBeVisible({ timeout: 8000 });
    await expect(canvas).toHaveCSS("filter", "invert(1) hue-rotate(180deg)");

    // Sayfayı yenile -> Gece modunun localStorage'dan korunduğunu doğrula
    await page.reload();
    await expect(viewport).toBeVisible({ timeout: 15000 });

    const canvasAfterReload = page.getByTestId("pdf-page-canvas-1");
    await expect(canvasAfterReload).toBeVisible({ timeout: 8000 });
    await expect(canvasAfterReload).toHaveCSS("filter", "invert(1) hue-rotate(180deg)");

    // Temizlik: Gece modunu kapat
    await moreBtn.click();
    await nightModeToggle.click();
  });

  test("5. Ayarlar menüsü elemanları ve klavye kısayolları modalı", async ({ page }) => {
    const fileId = await uploadFixturePdf(page, "linkli.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-scroll-viewport")).toBeVisible({ timeout: 15000 });

    // More ("⋮") menüsünü aç
    const moreBtn = page.getByTestId("pdf-viewer-more-menu-trigger");
    await moreBtn.click();

    // Menüdeki Faz H elemanlarının varlığını doğrula
    await expect(page.getByTestId("pdf-remember-position-toggle")).toBeVisible();
    await expect(page.getByTestId("pdf-night-mode-toggle")).toBeVisible();
    await expect(page.getByTestId("pdf-default-view-mode-toggle")).toBeVisible();
    await expect(page.getByTestId("pdf-reduce-motion-toggle")).toBeVisible();
    await expect(page.getByTestId("pdf-shortcuts-btn")).toBeVisible();

    // Kısayollar modalını aç
    await page.getByTestId("pdf-shortcuts-btn").click();
    const shortcutsModal = page.getByTestId("pdf-shortcuts-modal");
    await expect(shortcutsModal).toBeVisible({ timeout: 4000 });

    // Escape ile kapat
    await page.keyboard.press("Escape");
    await expect(shortcutsModal).toBeHidden({ timeout: 4000 });
  });
});
