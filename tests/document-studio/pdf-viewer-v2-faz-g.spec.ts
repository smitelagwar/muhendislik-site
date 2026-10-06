import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";

/**
 * FAZ G — PDF Görüntüleyici v2 Gezinme E2E Kabul Test Paketi
 *
 * 1. PDF İçi Bağlantılar (Annotation Layer): linkli.pdf iç bağlantı tıklamasıyla hedef sayfaya atlama
 * 2. Güvenli Dış Bağlantılar: target="_blank", rel="noopener noreferrer", güvenli protokol kontrolü
 * 3. İçindekiler / Yer İmleri (Outline Tree): getOutline() varsa panel açılmalı, tıklanan öğe sayfaya götürmeli
 * 4. Outline Olmayan Belgede Buton Gizliliği: getOutline() yoksa toolbar'da buton gizli olmalı
 * 5. Sayfa gezgini: çok sayfalı PDF'de her sayfa için bir çizgi bulunmalı
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

  return uploadPdfBase64(page, fixtureFileName, base64);
}

async function uploadBlankPdf(page: Page, pageCount: number): Promise<string> {
  const pdf = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) pdf.addPage([612, 792]);
  const base64 = Buffer.from(await pdf.save()).toString("base64");
  return uploadPdfBase64(page, `scrubber-${pageCount}-pages.pdf`, base64);
}

async function uploadPdfBase64(page: Page, name: string, content: string): Promise<string> {
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
    { name, content }
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

  test("5. 300 sayfalı PDF'de kompakt gezgin tam sayfa aralığına eşlenmeli", async ({ page }, testInfo: TestInfo) => {
    const fileId = await uploadFixturePdf(page, "uzun-300.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-scroll-viewport")).toBeVisible({ timeout: 15000 });

    // Scrubber bileşeni bulunmalı
    const scrubber = page.getByTestId("pdf-page-scrubber");
    await expect(scrubber).toBeVisible({ timeout: 8000 });

    // Scrubber track dokunma hedefi (hit target) kontrolleri
    const track = page.getByTestId("pdf-scrubber-track");
    await expect(track).toBeVisible();
    await expect(track).toHaveAttribute("data-tick-count", "11");
    await expect(page.getByTestId("pdf-scrubber-tick")).toHaveCount(11);
    await expect(page.locator('[data-testid="pdf-scrubber-tick"][data-page="1"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="pdf-scrubber-tick"][data-page="300"]')).toHaveCount(1);
    const tickPages = await page.getByTestId("pdf-scrubber-tick").evaluateAll((ticks) =>
      ticks.map((tick) => Number(tick.getAttribute("data-page")))
    );
    expect(tickPages).toEqual([...tickPages].sort((left, right) => left - right));

    const box = await track.boundingBox();
    expect(box).not.toBeNull();
    // Dokunma alanı genişliği >= 24px olmalı (plandaki zorunlu kriter)
    expect(box!.width).toBeGreaterThanOrEqual(24);

    // Kenar jestleriyle çakışmaması için touch-action: none olmalı
    const touchAction = await track.evaluate((el) => window.getComputedStyle(el).touchAction);
    expect(touchAction).toBe("none");

    // Seyrek işaretler görsel rehberdir; ara noktalara tıklamak yine tam sayfaya gider.
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    const pageInput = page.getByRole("textbox", { name: "Geçerli Sayfa" });
    await expect(pageInput).toHaveValue("151");
    await expect(track).toHaveAttribute("aria-valuenow", "151");
    await page.screenshot({ path: testInfo.outputPath("pdf-sayfa-gezgini-masaustu.png") });

    // Dar ekranda da kısa çubuk, sayfa etiketi ve dokunma alanı korunmalı.
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileBox = await track.boundingBox();
    expect(mobileBox).not.toBeNull();
    expect(mobileBox!.width).toBeGreaterThanOrEqual(44);
    expect(mobileBox!.height).toBeGreaterThanOrEqual(192);
    expect(mobileBox!.height).toBeLessThanOrEqual(360);
    await page.mouse.move(mobileBox!.x + mobileBox!.width / 2, mobileBox!.y + mobileBox!.height / 2);
    await expect(page.getByTestId("pdf-scrubber-page-button")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("pdf-sayfa-gezgini-mobil.png") });
  });

  test("6. İki sayfalı PDF'de her iki sayfa da çizgiyle seçilebilmeli", async ({ page }) => {
    // tr-metin.pdf 2 sayfadır
    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-scroll-viewport")).toBeVisible({ timeout: 15000 });

    const track = page.getByTestId("pdf-scrubber-track");
    await expect(track).toBeVisible({ timeout: 8000 });
    await expect(track).toHaveAttribute("data-tick-count", "2");
    await expect(page.getByTestId("pdf-scrubber-tick")).toHaveCount(2);
    await expect(track).toHaveAttribute("aria-valuemin", "1");
    await expect(track).toHaveAttribute("aria-valuemax", "2");
  });

  test("7. 15 sayfada 15 çizgi olur; sürekli gezinme ve zoom modu korunur", async ({ page }) => {
    const fileId = await uploadBlankPdf(page, 15);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    await expect(page.getByTestId("pdf-scroll-viewport")).toBeVisible({ timeout: 15000 });

    const track = page.getByTestId("pdf-scrubber-track");
    await expect(track).toBeVisible({ timeout: 8000 });
    await expect(track).toHaveAttribute("data-tick-count", "15");
    await expect(track).toHaveAttribute("data-scroll-mode", "continuous");
    await expect(page.getByTestId("pdf-scrubber-tick")).toHaveCount(15);
    await expect(page.locator('[data-testid="pdf-scrubber-tick"][data-page="1"]')).toHaveAttribute("style", /top: 0%/);
    await expect(page.locator('[data-testid="pdf-scrubber-tick"][data-page="15"]')).toHaveAttribute("style", /top: 100%/);

    const box = await track.boundingBox();
    expect(box).not.toBeNull();
    const railBox = await page.getByTestId("pdf-scrubber-rail").boundingBox();
    const viewportBox = await page.getByTestId("pdf-scroll-viewport").boundingBox();
    expect(railBox).not.toBeNull();
    expect(viewportBox).not.toBeNull();
    expect(railBox!.x).toBeLessThan(viewportBox!.x + 100);
    const pageBadge = page.getByTestId("pdf-scrubber-page-button");
    await expect(pageBadge).toBeVisible();
    await expect(pageBadge).toContainText("/ 15");
    await expect(pageBadge).toHaveClass(/bg-zinc-950\/75/);

    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    const pageInput = page.getByRole("textbox", { name: "Geçerli Sayfa" });
    await expect(pageInput).toHaveValue("8");
    const middleScrollFraction = await page.getByTestId("pdf-scroll-viewport").evaluate((element) => {
      const maxScrollTop = element.scrollHeight - element.clientHeight;
      return maxScrollTop > 0 ? element.scrollTop / maxScrollTop : 0;
    });
    expect(middleScrollFraction).toBeCloseTo(0.5, 2);

    await page.locator('[data-command-id="pdf.zoom.in"]').first().click();
    const viewer = page.locator("[data-zoom-mode]").first();
    await expect(viewer).toHaveAttribute("data-zoom-mode", "custom");
    const refreshedBox = await track.boundingBox();
    expect(refreshedBox).not.toBeNull();
    await page.mouse.click(
      refreshedBox!.x + refreshedBox!.width / 2,
      refreshedBox!.y + refreshedBox!.height * (9 / 14)
    );
    await expect(pageInput).toHaveValue("10");
    await expect(viewer).toHaveAttribute("data-zoom-mode", "custom");
  });

  test("8. 99 sayfadan az PDF'de sürükleme sayfa içi konumu kaybetmeden akar", async ({ page }, testInfo: TestInfo) => {
    const fileId = await uploadBlankPdf(page, 15);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const viewport = page.getByTestId("pdf-scroll-viewport");
    await expect(viewport).toBeVisible({ timeout: 15000 });

    const track = page.getByTestId("pdf-scrubber-track");
    const rail = page.getByTestId("pdf-scrubber-rail");
    await expect(track).toHaveAttribute("data-scroll-mode", "continuous");
    const railBox = await rail.boundingBox();
    expect(railBox).not.toBeNull();

    const target = await page.evaluate(() => {
      const scrollElement = document.querySelector<HTMLElement>('[data-testid="pdf-scroll-viewport"]');
      const pageEight = document.querySelector<HTMLElement>('[data-testid="pdf-page-8"]');
      if (!scrollElement || !pageEight) throw new Error("PDF sayfa/scroll geometrisi yüklenmedi");
      const viewportRect = scrollElement.getBoundingClientRect();
      const pageRect = pageEight.getBoundingClientRect();
      const pageContentTop = pageRect.top - viewportRect.top + scrollElement.scrollTop;
      const desiredScrollTop = pageContentTop + pageRect.height * 0.68;
      const maxScrollTop = scrollElement.scrollHeight - scrollElement.clientHeight;
      return {
        pageContentTop,
        pageHeight: pageRect.height,
        desiredScrollTop,
        fraction: desiredScrollTop / maxScrollTop,
        maxScrollTop,
      };
    });
    expect(target.maxScrollTop).toBeGreaterThan(0);
    expect(target.fraction).toBeGreaterThan(0);
    expect(target.fraction).toBeLessThan(1);

    const x = railBox!.x + railBox!.width / 2;
    const startY = railBox!.y + railBox!.height * (target.fraction - 0.04);
    const targetY = railBox!.y + railBox!.height * target.fraction;
    await page.mouse.move(x, startY);
    await page.mouse.down();
    await expect(track).toHaveAttribute("data-scrubbing", "true");
    await page.mouse.move(x, targetY, { steps: 8 });
    await page.mouse.up();
    await expect(track).toHaveAttribute("data-scrubbing", "false");

    const finalPosition = await viewport.evaluate((element) => {
      const pageEight = element.querySelector<HTMLElement>('[data-testid="pdf-page-8"]');
      if (!pageEight) throw new Error("8. sayfa bulunamadı");
      const elementRect = element.getBoundingClientRect();
      const pageRect = pageEight.getBoundingClientRect();
      const pageContentTop = pageRect.top - elementRect.top + element.scrollTop;
      return {
        scrollTop: element.scrollTop,
        pageContentTop,
        pageHeight: pageRect.height,
        fraction: element.scrollTop / (element.scrollHeight - element.clientHeight),
      };
    });
    expect(finalPosition.fraction).toBeCloseTo(target.fraction, 2);
    const pageEightOffset = (finalPosition.scrollTop - finalPosition.pageContentTop) / finalPosition.pageHeight;
    expect(pageEightOffset).toBeGreaterThan(0.62);
    expect(pageEightOffset).toBeLessThan(0.74);
    await page.screenshot({ path: testInfo.outputPath("pdf-sayfa-8-surekli-kaydirma.png") });
  });

  test("9. Sürükleme pointer capture ile iki yönde çalışır; iptal scrubbing durumunu temizler", async ({ page }) => {
    const fileId = await uploadBlankPdf(page, 15);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    await expect(page.getByTestId("pdf-scroll-viewport")).toBeVisible({ timeout: 15000 });

    const track = page.getByTestId("pdf-scrubber-track");
    await expect(track).toBeVisible({ timeout: 8000 });
    const box = await track.boundingBox();
    expect(box).not.toBeNull();
    const x = box!.x + box!.width / 2;
    const yTop = box!.y + 1;
    const yBottom = box!.y + box!.height - 1;

    await page.mouse.move(x, yTop);
    await page.mouse.down();
    await expect(track).toHaveAttribute("data-scrubbing", "true");
    await page.mouse.move(x + 80, yBottom + 40, { steps: 8 });
    await page.mouse.up();
    await expect(track).toHaveAttribute("data-scrubbing", "false");
    const pageInput = page.getByRole("textbox", { name: "Geçerli Sayfa" });
    await expect(pageInput).toHaveValue("15");

    const reverseBox = await track.boundingBox();
    expect(reverseBox).not.toBeNull();
    const reverseX = reverseBox!.x + reverseBox!.width / 2;
    await page.mouse.move(reverseX, reverseBox!.y + reverseBox!.height - 1);
    await page.mouse.down();
    await page.mouse.move(reverseX - 80, reverseBox!.y - 30, { steps: 8 });
    await page.mouse.up();
    await expect(pageInput).toHaveValue("1");

    await page.mouse.move(reverseX, reverseBox!.y + reverseBox!.height * 0.4);
    await page.mouse.down();
    await page.mouse.move(reverseX, reverseBox!.y + reverseBox!.height * 0.6, { steps: 3 });
    await track.evaluate((element) => {
      element.dispatchEvent(new PointerEvent("pointercancel", {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: "mouse",
        clientY: 0,
      }));
    });
    await expect(track).toHaveAttribute("data-scrubbing", "false");
    await page.mouse.up();
  });

  test("10. Klavye ile çizgi gezgininde birer ve onar sayfa gezilebilmeli", async ({ page }) => {
    const fileId = await uploadBlankPdf(page, 15);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    await expect(page.getByTestId("pdf-scroll-viewport")).toBeVisible({ timeout: 15000 });

    const track = page.getByTestId("pdf-scrubber-track");
    await expect(track).toBeVisible({ timeout: 8000 });
    await track.focus();
    await track.press("End");
    await expect(track).toHaveAttribute("aria-valuenow", "15");
    await track.press("PageUp");
    await expect(track).toHaveAttribute("aria-valuenow", "5");
    await track.press("ArrowDown");
    await expect(track).toHaveAttribute("aria-valuenow", "6");
    await track.press("Home");
    await expect(track).toHaveAttribute("aria-valuetext", "Sayfa 1 / 15");

    await page.getByTestId("pdf-scrubber-page-button").click();
    const scrubberJump = page.getByRole("textbox", { name: "Sayfaya git" });
    await expect(scrubberJump).toBeFocused();
    await scrubberJump.press("ArrowUp");
    await expect(track).toHaveAttribute("aria-valuenow", "1");
    await scrubberJump.fill("10");
    await scrubberJump.press("Enter");
    await expect(track).toHaveAttribute("aria-valuenow", "10");
    await expect(track).toBeFocused();
  });

  test("11. Araç çubuğu sayfa girişi (Enter ile gitme)", async ({ page }) => {
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
