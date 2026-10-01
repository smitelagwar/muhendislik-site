import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * FAZ G — PDF Görüntüleyici v2 Gezinme E2E Kabul Test Paketi
 *
 * 1. PDF İçi Bağlantılar (Annotation Layer): linkli.pdf iç bağlantı tıklamasıyla hedef sayfaya atlama
 * 2. Güvenli Dış Bağlantılar: target="_blank", rel="noopener noreferrer", güvenli protokol kontrolü
 * 3. İçindekiler / Yer İmleri (Outline Tree): getOutline() varsa panel açılmalı, tıklanan öğe sayfaya götürmeli
 * 4. Outline Olmayan Belgede Buton Gizliliği: getOutline() yoksa toolbar'da buton gizli olmalı
 * 5. Sayfa Scrubber (Minimap): Yalnızca >= 10 sayfada görünmeli, < 10 sayfada gizli kalmalı
 * 6. Scrubber Dokunma Alanı ve Touch-Action: Dokunma alanı >= 24px, touch-action: none olmalı
 * 7. Gezinme Geçmişi (Nav History): Bağlantı veya outline ile atlama sonrası "Önceki konuma dön" ile geri dönülebilmeli
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
      formData.append("pathname", `dok_storage/faz-g-${Date.now()}-${name}`);
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

test.describe("PDF Görüntüleyici v2 — FAZ G Gezinme Kabul Testleri", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("1. PDF içi bağlantılar ve gezinme geçmişi (Önceki konuma dön)", async ({ page }) => {
    const fileId = await uploadFixturePdf(page, "linkli.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const viewport = page.getByTestId("pdf-scroll-viewport");
    await expect(viewport).toBeVisible({ timeout: 15000 });

    // Sayfa 1 ve iç bağlantı görünür olmalı
    const linkToPage2 = page.getByTestId("pdf-link-internal-1-0");
    await expect(linkToPage2).toBeVisible({ timeout: 8000 });

    // Henüz geçmiş yokken "Önceki konuma dön" butonu toolbar'da bulunmamalı
    const navBackBtn = page.getByTestId("pdf-nav-back-btn");
    await expect(navBackBtn).toHaveCount(0);

    // Linke tıkla -> Sayfa 2'ye gitmeli
    await linkToPage2.click();

    // Sayfa 2'deki geri dönüş bağlantısı görünür olmalı
    const linkToPage1From2 = page.getByTestId("pdf-link-internal-2-0");
    await expect(linkToPage1From2).toBeVisible({ timeout: 8000 });

    // Artık gezinme geçmişi oluştuğundan toolbar'da "Önceki konuma dön" butonu görünmeli
    await expect(navBackBtn).toBeVisible({ timeout: 4000 });

    // Geri dön butonuna tıkla -> Sayfa 1'deki ilk bağlantıya geri dönmeli
    await navBackBtn.click();
    await expect(linkToPage2).toBeVisible({ timeout: 8000 });
  });

  test("2. Dış bağlantılar güvenli açılmalı (http/https/mailto, target=_blank, rel=noopener noreferrer)", async ({ page }) => {
    const fileId = await uploadFixturePdf(page, "linkli.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-scroll-viewport")).toBeVisible({ timeout: 15000 });

    const externalLink = page.getByTestId("pdf-link-external-1-2");
    await expect(externalLink).toBeVisible({ timeout: 8000 });

    // Güvenlik özellikleri doğrulaması
    const href = await externalLink.getAttribute("href");
    const target = await externalLink.getAttribute("target");
    const rel = await externalLink.getAttribute("rel");

    expect(href).toBe("https://example.com/muhendislik");
    expect(target).toBe("_blank");
    expect(rel).toContain("noopener");
    expect(rel).toContain("noreferrer");
    expect(href).not.toMatch(/^javascript:/i);
  });

  test("3. İçindekiler / Yer imleri paneli ve outline ile sayfa atlama", async ({ page }) => {
    const fileId = await uploadFixturePdf(page, "linkli.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-scroll-viewport")).toBeVisible({ timeout: 15000 });

    // linkli.pdf'te outline bulunduğu için toolbar'da İçindekiler butonu görünmeli
    const outlineToggleBtn = page.getByTestId("pdf-outline-toggle-btn");
    await expect(outlineToggleBtn).toBeVisible({ timeout: 8000 });

    // İçindekiler butonuna tıkla -> Kenar çubuğu açılmalı ve outline ağacı listelenmeli
    await outlineToggleBtn.click();

    const outlineTree = page.getByTestId("pdf-outline-tree");
    await expect(outlineTree).toBeVisible({ timeout: 5000 });

    // "Bölüm 2 — Dinamik Simülasyonlar" öğesine tıkla -> Sayfa 3'e atlamalı
    const section2Item = page.getByTestId("pdf-outline-item").filter({ hasText: "Bölüm 2" });
    await expect(section2Item).toBeVisible();
    await section2Item.click();

    // Sayfa 3'teki geri dönüş bağlantısı görünür olmalı
    const linkFromP3 = page.getByTestId("pdf-link-internal-3-0");
    await expect(linkFromP3).toBeVisible({ timeout: 8000 });
  });

  test("4. Outline bulunmayan dokümanda İçindekiler butonu gizli olmalı", async ({ page }) => {
    // uzun-300.pdf içinde outline/bookmark yoktur
    const fileId = await uploadFixturePdf(page, "uzun-300.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-scroll-viewport")).toBeVisible({ timeout: 15000 });

    // getOutline() boş olduğundan buton gizli olmalıdır
    const outlineToggleBtn = page.getByTestId("pdf-outline-toggle-btn");
    await expect(outlineToggleBtn).toHaveCount(0);
  });

  test("5. Sayfa Scrubber >= 10 sayfada görünmeli, touch-action:none ve >= 24px dokunma alanına sahip olmalı", async ({ page }) => {
    const fileId = await uploadFixturePdf(page, "uzun-300.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-scroll-viewport")).toBeVisible({ timeout: 15000 });

    // Scrubber bileşeni bulunmalı
    const scrubber = page.getByTestId("pdf-page-scrubber");
    await expect(scrubber).toBeVisible({ timeout: 8000 });

    // Scrubber track dokunma hedefi (hit target) kontrolleri
    const track = page.getByTestId("pdf-scrubber-track");
    await expect(track).toBeVisible();

    const box = await track.boundingBox();
    expect(box).not.toBeNull();
    // Dokunma alanı genişliği >= 24px olmalı (plandaki zorunlu kriter)
    expect(box!.width).toBeGreaterThanOrEqual(24);

    // Kenar jestleriyle çakışmaması için touch-action: none olmalı
    const touchAction = await track.evaluate((el) => window.getComputedStyle(el).touchAction);
    expect(touchAction).toBe("none");
  });

  test("6. Sayfa Scrubber < 10 sayfalık dokümanlarda gizli kalmalı", async ({ page }) => {
    // tr-metin.pdf 2 sayfadır
    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-scroll-viewport")).toBeVisible({ timeout: 15000 });

    const scrubber = page.getByTestId("pdf-page-scrubber");
    await expect(scrubber).toHaveCount(0);
  });

  test("7. Araç çubuğu sayfa girişi (Enter ile gitme)", async ({ page }) => {
    const fileId = await uploadFixturePdf(page, "linkli.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-scroll-viewport")).toBeVisible({ timeout: 15000 });

    const pageInput = page.getByRole("textbox", { name: "Geçerli Sayfa" });
    await expect(pageInput).toBeVisible();

    // Sayfa 3 yazıp Enter'a bas
    await pageInput.fill("3");
    await pageInput.press("Enter");

    // Sayfa 3'e atlandığı doğrulanmalı
    const linkFromP3 = page.getByTestId("pdf-link-internal-3-0");
    await expect(linkFromP3).toBeVisible({ timeout: 8000 });
  });
});
