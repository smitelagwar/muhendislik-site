import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * FAZ E — PDF Görüntüleyici v2 Arama Motoru ve Sonuç Paneli E2E Test Paketi
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
    throw new Error(`Fixture dosyasi bulunamadi: ${filePath}. Lutfen once 'node scripts/generate-pdf-fixtures.mjs' calistirin.`);
  }

  const fileBytes = fs.readFileSync(filePath);
  const base64 = fileBytes.toString("base64");

  return page.evaluate(
    async ({ name, content }) => {
      const bytes = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
      const formData = new FormData();
      formData.append("file", new File([bytes], name, { type: "application/pdf" }));
      formData.append("pathname", `dok_storage/v2-fixture-${Date.now()}-${name}`);
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

test.describe("PDF Görüntüleyici v2 — FAZ E Arama Motoru ve Vurgulama", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // --------------------------------------------------------------------------
  // TEST 1: tr-metin.pdf Türkçe Gevşek Arama ve Sonuç Paneli
  // --------------------------------------------------------------------------
  test("1. Arama ve Vurgulama: 'arastirma' araması ile Türkçe karakterli eşleşmelerin bulunması ve aktif vurgu", async ({ page }) => {
    test.setTimeout(90_000);
    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    const firstSpan = page.locator(".pdf-text-layer span, .textLayer span").first();
    await expect(firstSpan).toBeVisible({ timeout: 25_000 });

    // Arama çubuğunu aç
    const searchToggle = page.locator('[data-command-id="pdf.search.open"]').first();
    await searchToggle.click();

    const searchInput = page.getByPlaceholder("Dokümanda ara...");
    await expect(searchInput).toBeVisible();

    // 'arastirma' ara (diakritiksiz - gevşek arama testi)
    await searchInput.fill("arastirma");
    await page.keyboard.press("Enter");

    // Eşleşme sayısını doğrula: 8 eşleşme bulunmalı (başlık dahil)
    const matchCountLocator = page.locator("text=/\\d+\\/8/").first();
    await expect(matchCountLocator).toBeVisible({ timeout: 15_000 });

    // Mark öğelerini doğrula
    const activeMark = page.locator("mark.pdf-search-mark-active").first();
    await expect(activeMark).toBeVisible({ timeout: 10_000 });

    const markStyle = await activeMark.evaluate((mark) => {
      const style = getComputedStyle(mark);
      const alpha = style.backgroundColor.match(/[\s,/]([\d.]+)\)$/);
      return { alpha: alpha ? Number(alpha[1]) : 1, animationName: style.animationName };
    });
    expect(markStyle.alpha).toBeGreaterThan(0.2);
    expect(markStyle.alpha).toBeLessThan(0.5);
    expect(markStyle.animationName).toBe("none");

    // The selected word must map back to exactly the PDF.js text Range, including
    // UTF-16 characters that changed width during Turkish normalization.
    const markGeometry = await activeMark.evaluate((mark) => {
      const pageRoot = mark.parentElement?.parentElement;
      if (!pageRoot) return null;
      const textNodes: { node: Text; start: number; end: number }[] = [];
      let fullText = "";
      const walker = document.createTreeWalker(pageRoot, NodeFilter.SHOW_TEXT);
      let current = walker.nextNode();
      while (current) {
        const node = current as Text;
        if (!node.parentElement?.classList.contains("endOfContent")) {
          const start = fullText.length;
          fullText += node.nodeValue || "";
          textNodes.push({ node, start, end: fullText.length });
        }
        current = walker.nextNode();
      }

      const matchStart = fullText.toLocaleLowerCase("tr-TR").indexOf("araştırma");
      if (matchStart < 0) return { foundText: false };
      const rects: DOMRect[] = [];
      for (const entry of textNodes) {
        const start = Math.max(matchStart, entry.start);
        const end = Math.min(matchStart + "araştırma".length, entry.end);
        if (end <= start) continue;
        const range = document.createRange();
        range.setStart(entry.node, start - entry.start);
        range.setEnd(entry.node, end - entry.start);
        rects.push(...Array.from(range.getClientRects()));
      }

      const actual = mark.getBoundingClientRect();
      const expected = rects[0];
      if (!expected) return { foundText: true, foundRange: false };
      return {
        foundText: true,
        foundRange: true,
        leftDelta: Math.abs(actual.left - expected.left),
        topDelta: Math.abs(actual.top - expected.top),
        widthDelta: Math.abs(actual.width - expected.width),
        heightDelta: Math.abs(actual.height - expected.height),
      };
    });
    expect(markGeometry?.foundText).toBe(true);
    expect(markGeometry?.foundRange).toBe(true);
    expect(markGeometry?.leftDelta).toBeLessThan(1.5);
    expect(markGeometry?.topDelta).toBeLessThan(1.5);
    expect(markGeometry?.widthDelta).toBeLessThan(1.5);
    expect(markGeometry?.heightDelta).toBeLessThan(1.5);

    // Sonraki eşleşmeye geç (Enter veya Sonraki düğmesi)
    const nextBtn = page.locator('[data-command-id="pdf.search.next"]').first();
    await nextBtn.click();
    await page.waitForTimeout(300);

    // Eşleşme göstergesi "2/8" olmalı
    await expect(page.locator("text=2/8").first()).toBeVisible();

    console.log("[FAZ E TEST 1] Gevşek 'arastirma' araması 8 eşleşmeyi buldu ve aktif eşleşme gezinmesi doğrulandı.");
  });

  // --------------------------------------------------------------------------
  // TEST 2: satir-sonu-tire.pdf Tireli Kelime Arama
  // --------------------------------------------------------------------------
  test("2. Satır Sonu Tire: 'araştırma' araması satır sonunda tire ile bölünen kelimeleri bulmalı", async ({ page }) => {
    test.setTimeout(90_000);
    const fileId = await uploadFixturePdf(page, "satir-sonu-tire.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".pdf-text-layer span, .textLayer span").first()).toBeVisible({ timeout: 25_000 });

    // Arama aç
    await page.locator('[data-command-id="pdf.search.open"]').first().click();
    const searchInput = page.getByPlaceholder("Dokümanda ara...");
    await searchInput.fill("araştırma");
    await page.keyboard.press("Enter");

    // 1 eşleşme doğrula (araştır- ma)
    const matchCounter = page.locator("text=1/1").first();
    await expect(matchCounter).toBeVisible({ timeout: 15_000 });

    // Vurguların varlığını doğrula
    const marks = page.locator("mark.pdf-search-mark");
    await expect(marks.first()).toBeVisible();

    console.log("[FAZ E TEST 2] Satır sonu tireli 'araştır-' + 'ma' kelimesi başarıyla bulundu.");
  });

  // --------------------------------------------------------------------------
  // TEST 3: taranmis.pdf Metinsiz Belge Uyarısı
  // --------------------------------------------------------------------------
  test("3. Taranmış PDF Uyarısı: Metinsiz belgede arama yapıldığında kullanıcıya net uyarı gösterilmeli", async ({ page }) => {
    test.setTimeout(90_000);
    const fileId = await uploadFixturePdf(page, "taranmis-metinsiz.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(2000);

    // Arama aç
    await page.locator('[data-command-id="pdf.search.open"]').first().click();
    const searchInput = page.getByPlaceholder("Dokümanda ara...");
    await searchInput.fill("mühendislik");
    await page.keyboard.press("Enter");

    // Taranmış PDF uyarı mesajını bekle
    const scannedWarning = page.locator("text=Bu PDF taranmış görüntü içeriyor, metin araması yapılamaz.").first();
    await expect(scannedWarning).toBeVisible({ timeout: 15_000 });

    console.log("[FAZ E TEST 3] Taranmış PDF uyarı mesajı başarıyla doğrulandı.");
  });

  // --------------------------------------------------------------------------
  // TEST 4: uzun-300.pdf Artımlı Arama ve Yanıt Verme
  // --------------------------------------------------------------------------
  test("4. 300 Sayfa Arama: Tarama tamamlanınca son sayfada da eşleşme vurgulanmalı", async ({ page }) => {
    test.setTimeout(120_000);
    const fileId = await uploadFixturePdf(page, "uzun-300.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });

    // Arama aç
    await page.locator('[data-command-id="pdf.search.open"]').first().click();
    const searchInput = page.getByPlaceholder("Dokümanda ara...");

    const startTime = Date.now();
    await searchInput.fill("sayfa");
    await page.keyboard.press("Enter");

    // 300-page fixture repeats “Sayfa” once on every page. Observe the actual
    // search spinner instead of matching the toolbar's “page / 300” label.
    const searchBar = page.getByTestId("pdf-search-bar");
    const spinner = searchBar.locator(".animate-spin");
    await expect(spinner).toBeVisible({ timeout: 15_000 });
    const initialLatency = Date.now() - startTime;
    console.log(`[FAZ E TEST 4] 300 sayfalık belgede ilk sonuç gecikmesi: ${initialLatency} ms`);

    // Arama devam ederken kullanıcı arayüzü yanıt veriyor mu (Zoom düğmesi tıklanabilir olmalı)
    const zoomInBtn = page.locator('[data-command-id="pdf.zoom.in"]').first();
    await expect(zoomInBtn).toBeEnabled();
    await zoomInBtn.click();

    // Arama sonuç sayacının artması veya tamamlanması
    await expect(spinner).toBeHidden({ timeout: 60_000 });
    const searchCounter = searchBar.locator('[aria-live="polite"] > span[aria-hidden="true"]');
    await expect(searchCounter).toBeVisible();
    const searchCountText = (await searchCounter.textContent())?.trim() ?? "";
    const totalMatches = Number(searchCountText.split("/").at(-1));
    expect(totalMatches, "300 sayfanın tamamında arama sayacı beklenenden düşük: " + searchCountText).toBeGreaterThanOrEqual(300);

    const pageInput = page.locator('input[aria-label="Geçerli Sayfa"]');
    await pageInput.fill("300");
    await pageInput.press("Enter");
    const lastPage = page.getByTestId("pdf-page-300");
    await expect(lastPage).toBeVisible({ timeout: 20_000 });
    await expect(lastPage.locator("mark.pdf-search-mark").first()).toBeVisible({ timeout: 20_000 });
    const matchText = searchCountText;
    console.log(`[FAZ E TEST 4] Arama sayacı: ${matchText}`);
  });
});
