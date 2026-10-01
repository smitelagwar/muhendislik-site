import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * FAZ R5 — Gerçek Belgelerle Doğrulama Test Paketi
 *
 * 5 Farklı Gerçek Belge Tipi ile:
 * 1. Copilot/Word dışa aktarımı (Copilot - korelasyon.pdf)
 * 2. Resmî Belge / Sözleşme (santiye-sefi-sozlesmesi.pdf)
 * 3. Mimari Proje Pafta / Karışık Boyut (karisik-boyut.pdf: A4 Dikey + A3 Yatay)
 * 4. Taranmış / Metinsiz Belge (taranmis-metinsiz.pdf)
 * 5. Çok Sayfalı Rapor (uzun-300.pdf)
 */

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
      formData.append("pathname", `dok_storage/r5-${Date.now()}-${name}`);
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

interface InvariantMetrics {
  found: boolean;
  pageWidth: number;
  pageHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  widthDiff: number;
  bitmapPerCss: number;
  dpr: number;
  isClipped: boolean;
  clippedAmount: number;
}

async function measurePageInvariants(page: Page, pageNum = 1): Promise<InvariantMetrics> {
  await page.waitForSelector(`[data-page-number="${pageNum}"][data-page-state="rendered"]`, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);

  return await page.evaluate((pNum) => {
    const pageEl = document.querySelector(`[data-page-number="${pNum}"]`);
    if (!pageEl) {
      return {
        found: false,
        pageWidth: 0,
        pageHeight: 0,
        canvasWidth: 0,
        canvasHeight: 0,
        widthDiff: 0,
        bitmapPerCss: 0,
        dpr: window.devicePixelRatio || 1,
        isClipped: false,
        clippedAmount: 0,
      };
    }

    const pageRect = pageEl.getBoundingClientRect();
    const canvas = pageEl.querySelector<HTMLCanvasElement>(`canvas[data-testid="pdf-page-canvas-${pNum}"]`);
    const canvasRect = canvas ? canvas.getBoundingClientRect() : pageRect;
    const widthDiff = Math.abs(pageRect.width - canvasRect.width);

    const dpr = window.devicePixelRatio || 1;
    const bitmapPerCss = canvas && canvasRect.width > 0
      ? +(canvas.width / canvasRect.width).toFixed(3)
      : 1;

    let isClipped = false;
    let clippedAmount = 0;
    const spans = pageEl.querySelectorAll<HTMLElement>(".textLayer span");
    for (let i = 0; i < spans.length; i++) {
      const s = spans[i];
      const r = s.getBoundingClientRect();
      const overflow = r.right - (pageRect.right + 2);
      if (overflow > 1.5) {
        isClipped = true;
        clippedAmount = Math.max(clippedAmount, +overflow.toFixed(1));
      }
    }

    return {
      found: true,
      pageWidth: +pageRect.width.toFixed(1),
      pageHeight: +pageRect.height.toFixed(1),
      canvasWidth: +canvasRect.width.toFixed(1),
      canvasHeight: +canvasRect.height.toFixed(1),
      widthDiff: +widthDiff.toFixed(1),
      bitmapPerCss,
      dpr,
      isClipped,
      clippedAmount,
    };
  }, pageNum);
}

test.describe("FAZ R5 — Gerçek Belgelerle Doğrulama Matrisi", () => {
  let doc1Id = "";
  let doc2Id = "";
  let doc3Id = "";
  let doc4Id = "";
  let doc5Id = "";

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);

    doc1Id = await uploadPdfFile(page, "tests/fixtures/pdf/manual/Copilot - korelasyon.pdf", "copilot-korelasyon.pdf");
    doc2Id = await uploadPdfFile(page, "public/belgeler/santiye-sefi-sozlesmesi.pdf", "santiye-sefi-sozlesmesi.pdf");
    doc3Id = await uploadPdfFile(page, "tests/fixtures/pdf/karisik-boyut.pdf", "karisik-boyut.pdf");
    doc4Id = await uploadPdfFile(page, "tests/fixtures/pdf/taranmis-metinsiz.pdf", "taranmis-metinsiz.pdf");
    doc5Id = await uploadPdfFile(page, "tests/fixtures/pdf/uzun-300.pdf", "uzun-300.pdf");

    console.log("[R5 Setup] Yüklenen Belge Kimlikleri:", { doc1Id, doc2Id, doc3Id, doc4Id, doc5Id });
    await page.close();
  });

  test("BELGE 1: Copilot/Word Dışa Aktarımı — Açılış, Kesilme Yok, Onarılmış Arama ve Kopyalama", async ({ page }) => {
    await login(page);
    const t0 = Date.now();
    await page.goto(`/dokumantasyon/dosya/${doc1Id}`);
    await page.waitForSelector("canvas[data-testid='pdf-page-canvas-1']", { timeout: 15000 });
    const openTimeMs = Date.now() - t0;
    console.log(`[BELGE 1] Açılış süresi: ${openTimeMs} ms`);

    // 1. Mod testleri ve kesilme olmama
    await page.keyboard.press("Control+Digit0"); // Sayfa Modu
    await page.waitForTimeout(1000);
    const mSayfa = await measurePageInvariants(page, 1);
    expect(mSayfa.isClipped).toBe(false);
    expect(mSayfa.widthDiff).toBeLessThanOrEqual(1.5);

    // Zoom In %138
    await page.keyboard.press("+");
    await page.waitForTimeout(500);
    await page.keyboard.press("+");
    await page.waitForTimeout(1500);
    const mZoom = await measurePageInvariants(page, 1);
    expect(mZoom.isClipped, `Sağ kenar kesilmemeli (kesilme: ${mZoom.clippedAmount}px)`).toBe(false);

    // Kanıt ekran görüntüsü
    await page.locator("[data-page-number='1']").first().screenshot({
      path: "docs/pdf-viewer-v3/kanit/r5-doc1-copilot-sayfa.png",
    });

    // 2. Arama ve Vurgu Hizalama
    await page.keyboard.press("Control+f");
    const searchInput = page.locator("input[placeholder*='ara'], input[placeholder*='Ara']").first();
    await searchInput.fill("ilişki");
    await page.waitForTimeout(1000);
    const marks = page.locator(".pdf-search-mark");
    expect(await marks.count()).toBeGreaterThan(0);

    // 3. Kopyalama doğrulaması
    const copied = await page.evaluate(async () => {
      const page1 = document.querySelector("[data-page-number='1'] .textLayer");
      if (!page1) return "";
      const range = document.createRange();
      range.selectNodeContents(page1);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);

      let data = "";
      const originalSetData = DataTransfer.prototype.setData;
      DataTransfer.prototype.setData = function (fmt, val) {
        if (fmt === "text/plain") data = val;
        return originalSetData.apply(this, [fmt, val] as any);
      };
      try { document.execCommand("copy"); } catch {}
      DataTransfer.prototype.setData = originalSetData;
      return data;
    });
    expect(copied.includes("ilişki") || copied.includes("ilişkinin")).toBe(true);
    expect(copied.includes("\u011c")).toBe(false);

    // 4. Yazdırma iframe mevcudiyeti (Aramayı kapatıp odaklanmayı çöz)
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await page.keyboard.press("Control+p");
    await page.waitForTimeout(500);
    const printFrame = page.locator("#pdf-print-iframe");
    expect(await printFrame.count()).toBeGreaterThanOrEqual(1);
  });

  test("BELGE 1 Mobil Emülasyon: 360px Viewport Yatay Taşma Yok", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 360, height: 640 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await login(page);
    await page.goto(`/dokumantasyon/dosya/${doc1Id}`);
    await page.waitForSelector("canvas[data-testid='pdf-page-canvas-1']", { timeout: 15000 });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth, "Mobilde yatay taşma (horizontal scroll) olmamalıdır").toBeLessThanOrEqual(clientWidth + 2);

    await page.screenshot({ path: "docs/pdf-viewer-v3/kanit/r5-doc1-mobil-360.png" });
    await context.close();
  });

  test("BELGE 2: Resmî Belge / Sözleşme — Genişlik Modu ve Türkçe Arama", async ({ page }) => {
    await login(page);
    const t0 = Date.now();
    await page.goto(`/dokumantasyon/dosya/${doc2Id}`);
    await page.waitForSelector("canvas[data-testid='pdf-page-canvas-1']", { timeout: 15000 });
    const openTimeMs = Date.now() - t0;
    console.log(`[BELGE 2] Açılış süresi: ${openTimeMs} ms`);

    // Genişliğe sığdır
    await page.keyboard.press("Control+Digit2");
    await page.waitForTimeout(1000);
    const m = await measurePageInvariants(page, 1);
    expect(m.isClipped).toBe(false);
    expect(m.widthDiff).toBeLessThanOrEqual(1.5);
    expect(m.bitmapPerCss).toBeGreaterThanOrEqual(0.95);

    // Ekran görüntüsü
    await page.locator("[data-page-number='1']").first().screenshot({
      path: "docs/pdf-viewer-v3/kanit/r5-doc2-sozlesme-genislik.png",
    });

    // Türkçe Arama: "Şantiye"
    await page.keyboard.press("Control+f");
    const searchInput = page.locator("input[placeholder*='ara'], input[placeholder*='Ara']").first();
    await searchInput.fill("şantiye");
    await page.waitForTimeout(1000);
    const marks = page.locator(".pdf-search-mark");
    expect(await marks.count()).toBeGreaterThan(0);
  });

  test("BELGE 3: Mimari Proje Pafta — A4 Dikey + A3 Yatay Karışık Boyut Korunumu", async ({ page }) => {
    await login(page);
    const t0 = Date.now();
    await page.goto(`/dokumantasyon/dosya/${doc3Id}`);
    await page.waitForSelector("canvas[data-testid='pdf-page-canvas-1']", { timeout: 15000 });
    await page.waitForSelector("canvas[data-testid='pdf-page-canvas-2']", { timeout: 15000 });
    const openTimeMs = Date.now() - t0;
    console.log(`[BELGE 3] Açılış süresi: ${openTimeMs} ms`);

    const m1 = await measurePageInvariants(page, 1);
    const m2 = await measurePageInvariants(page, 2);

    console.log("[BELGE 3 Karışık Boyut]:", { page1Width: m1.pageWidth, page2Width: m2.pageWidth });
    const ratio = m2.pageWidth / m1.pageWidth;
    expect(ratio, "A3 yatay pafta A4 dikey paftanın yaklaşık 2 katı genişliğinde olmalıdır").toBeGreaterThan(1.8);
    expect(ratio).toBeLessThan(2.2);

    expect(m1.widthDiff).toBeLessThanOrEqual(1.5);
    expect(m2.widthDiff).toBeLessThanOrEqual(1.5);

    // A3 pafta ekran görüntüsü
    await page.locator("[data-page-number='2']").first().screenshot({
      path: "docs/pdf-viewer-v3/kanit/r5-doc3-mimari-a3-yatay.png",
    });
  });

  test("BELGE 4: Taranmış / Metinsiz Belge — Hızlı Açılış ve Net Uyarı", async ({ page }) => {
    await login(page);
    const t0 = Date.now();
    await page.goto(`/dokumantasyon/dosya/${doc4Id}`);
    await page.waitForSelector("canvas[data-testid='pdf-page-canvas-1']", { timeout: 15000 });
    const openTimeMs = Date.now() - t0;
    console.log(`[BELGE 4] Açılış süresi: ${openTimeMs} ms`);

    // Arama aç ve kelime ara
    await page.keyboard.press("Control+f");
    const searchInput = page.locator("input[placeholder*='ara'], input[placeholder*='Ara']").first();
    await searchInput.fill("örnek");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);

    // Taranmış PDF uyarısı
    const scannedWarning = page.locator("text=Bu PDF taranmış görüntü içeriyor, metin araması yapılamaz.").first();
    await expect(scannedWarning).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: "docs/pdf-viewer-v3/kanit/r5-doc4-taranmis-uyari.png" });
  });

  test("BELGE 5: Çok Sayfalı Rapor (300 Sayfa) — Scrubber ile Gezinme ve Bellek Kararlılığı", async ({ page }) => {
    test.setTimeout(120_000);
    await login(page);
    const t0 = Date.now();
    await page.goto(`/dokumantasyon/dosya/${doc5Id}`);
    await page.waitForSelector("canvas[data-testid='pdf-page-canvas-1']", { timeout: 20000 });
    const openTimeMs = Date.now() - t0;
    console.log(`[BELGE 5] Açılış süresi: ${openTimeMs} ms`);

    // Scrubber görünür olmalı
    const scrubber = page.getByTestId("pdf-page-scrubber");
    await expect(scrubber).toBeVisible({ timeout: 10000 });

    // 150. sayfaya git
    const pageInput = page.getByRole("textbox", { name: "Geçerli Sayfa" });
    await expect(pageInput).toBeVisible({ timeout: 10000 });
    await pageInput.fill("150");
    await pageInput.press("Enter");
    await page.waitForTimeout(2000);

    // 150. sayfanın render edildiğini doğrula
    const page150 = page.locator("[data-page-number='150'] canvas");
    await expect(page150).toBeVisible({ timeout: 15000 });

    // Bellekte dolu tutulan canvas sayısını denetle (≤ 13 olmalı)
    const activeCanvases = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("canvas[data-testid^='pdf-page-canvas-']"));
      const populated = all.filter((c) => (c as HTMLCanvasElement).width > 1 && (c as HTMLCanvasElement).height > 1);
      return populated.length;
    });
    console.log(`[BELGE 5] Aktif render edilen canvas sayısı: ${activeCanvases}`);
    expect(activeCanvases).toBeLessThanOrEqual(13);

    await page.screenshot({ path: "docs/pdf-viewer-v3/kanit/r5-doc5-uzun-scrubber.png" });
  });
});
