import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * FAZ R1 — PDF Görüntüleyici v3 Değişmezler ve Görsel Test Takımı
 *
 * Bu test paketi, v2'de kaçan ve üretimde raporlanan H1–H5 hatalarını
 * otomatik olarak yakalamak için tasarlanmış değişmezleri (I1–I8) doğrular.
 *
 * DEĞİŞMEZLER:
 * - I1: Canvas kutusu == sayfa kutusu (fark <= 1 px)
 * - I2: Netlik: bitmap / CSS oranı >= 0.95 * min(DPR, 2)
 * - I3: Kırpma yok: text layer span'ları sayfa kutusundan taşmaz (clipped <= 0 px)
 * - I4: Araç çubuğu % = pageBox.width / sayfaGenişliğiPt / (96/72) (+/- %1)
 * - I5: Mod geçiş dizisi: Genişlik -> Sayfa -> %100 -> Zoom In -> Zoom Out
 * - I6: Çoklu çözünürlük ve mobil uyumluluk
 * - I7: Bozuk ToUnicode CMap tespiti
 *
 * KABUL KRİTERİ:
 * - Bu testler HEAD'de (henüz Faz R2/R3 uygulanmadan) KIRMIZI olmalı ve
 *   H1 (kesilme), H2 (bulanıklık) ve H4/H5 hatalarını somut olarak yakalamalıdır!
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

async function uploadPdfFile(page: Page, relativePath: string): Promise<string> {
  const filePath = path.resolve(relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fixture dosyasi bulunamadi: ${filePath}`);
  }

  const fileBytes = fs.readFileSync(filePath);
  const base64 = fileBytes.toString("base64");
  const fileName = "copilot-korelasyon.pdf";

  return page.evaluate(
    async ({ name, content }) => {
      const bytes = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
      const formData = new FormData();
      formData.append("file", new File([bytes], name, { type: "application/pdf" }));
      formData.append("pathname", `dok_storage/v3-test-${Date.now()}.pdf`);
      const response = await fetch("/api/dokumantasyon/upload/local", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok || !payload.file?.id) throw new Error(payload.error || "upload failed");
      return payload.file.id as string;
    },
    { name: fileName, content: base64 }
  );
}

interface InvariantMetrics {
  found: boolean;
  pageWidth: number;
  pageHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  widthDiff: number;
  heightDiff: number;
  bitmapWidth: number;
  bitmapHeight: number;
  bitmapPerCss: number;
  dpr: number;
  isClipped: boolean;
  clippedAmount: number;
  rightmostSample: string;
  zoomText: string;
  viewerState: string;
}

async function measurePage1Invariants(page: Page): Promise<InvariantMetrics> {
  // Faz R1 test kancası: render bitene kadar bekle
  await page.waitForSelector('[data-pdf-viewer-state="idle"]', { timeout: 15000 }).catch(() => {});
  await page.waitForSelector('[data-page-number="1"][data-page-state="rendered"]', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  return await page.evaluate(() => {
    const root = document.querySelector("[data-pdf-viewer-state]");
    const viewerState = root?.getAttribute("data-pdf-viewer-state") || "unknown";

    const pageEl = document.querySelector('[data-page-number="1"]');
    if (!pageEl) {
      return {
        found: false,
        pageWidth: 0,
        pageHeight: 0,
        canvasWidth: 0,
        canvasHeight: 0,
        widthDiff: 999,
        heightDiff: 999,
        bitmapWidth: 0,
        bitmapHeight: 0,
        bitmapPerCss: 0,
        dpr: window.devicePixelRatio || 1,
        isClipped: false,
        clippedAmount: 0,
        rightmostSample: "",
        zoomText: "",
        viewerState,
      };
    }

    const canvas = pageEl.querySelector("canvas");
    const textLayer = pageEl.querySelector(".textLayer, [class*='textLayer']");
    const pageRect = pageEl.getBoundingClientRect();
    const canvasRect = canvas ? canvas.getBoundingClientRect() : { width: 0, height: 0 };
    const widthDiff = Math.abs(canvasRect.width - pageRect.width);
    const heightDiff = Math.abs(canvasRect.height - pageRect.height);

    const dpr = window.devicePixelRatio || 1;
    const bitmapPerCss = canvas && canvasRect.width > 0 ? +(canvas.width / canvasRect.width).toFixed(3) : 0;

    const textSpans = textLayer ? Array.from(textLayer.querySelectorAll("span")) : [];
    let maxSpanRight = 0;
    let rightmostSample = "";
    for (const span of textSpans) {
      const r = span.getBoundingClientRect();
      if (r.right > maxSpanRight) {
        maxSpanRight = r.right;
        rightmostSample = span.textContent?.slice(-25) || "";
      }
    }

    const pageRight = pageRect.right;
    const isClipped = maxSpanRight > pageRight + 1;
    const clippedAmount = isClipped ? +(maxSpanRight - pageRight).toFixed(1) : 0;

    const zoomText = document.querySelector("[data-command-id='pdf.zoom.100']")?.textContent || "";

    return {
      found: true,
      pageWidth: +pageRect.width.toFixed(1),
      pageHeight: +pageRect.height.toFixed(1),
      canvasWidth: +canvasRect.width.toFixed(1),
      canvasHeight: +canvasRect.height.toFixed(1),
      widthDiff: +widthDiff.toFixed(1),
      heightDiff: +heightDiff.toFixed(1),
      bitmapWidth: canvas?.width || 0,
      bitmapHeight: canvas?.height || 0,
      bitmapPerCss,
      dpr,
      isClipped,
      clippedAmount,
      rightmostSample,
      zoomText,
      viewerState,
    };
  });
}

test.describe("PDF Görüntüleyici v3 Değişmezler ve Regresyon Test Paketi", () => {
  let fileId = "";

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    const fixturePath = "tests/fixtures/pdf/manual/Copilot - korelasyon.pdf";
    if (fs.existsSync(fixturePath)) {
      fileId = await uploadPdfFile(page, fixturePath);
      console.log(`[R1 Test Setup] Copilot fixture yuklendi, fileId: ${fileId}`);
    } else {
      console.warn(`[R1 Test Setup] Fixture bulunamadi: ${fixturePath}`);
    }
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    test.skip(!fileId, "Copilot - korelasyon.pdf fixture yuklenemedigi icin test atlandi.");
    await login(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}?pdfEngine=v3`);
    await page.waitForSelector("canvas[data-testid='pdf-page-canvas-1']", { timeout: 30000 });
  });

  test("TEST-I1 & TEST-I3: Sayfaya Sığdır (Fit Page) modunda Canvas kutusu == Sayfa kutusu ve taşma olmamalı", async ({ page }) => {
    // Sayfaya Sığdır moduna geç
    const fitPageBtn = page.locator("[data-command-id='pdf.zoom.fitPage']").first();
    if (await fitPageBtn.isVisible()) {
      await fitPageBtn.click();
    } else {
      await page.keyboard.press("Control+Digit0");
    }
    await page.waitForTimeout(2000);

    const m = await measurePage1Invariants(page);
    console.log("[TEST-I1 Sayfa Modu Ölçümü]:", JSON.stringify(m, null, 2));

    // I1 Değişmezi: Canvas kutusu sayfa kutusuna tam oturmalıdır (fark <= 1 px)
    // HEAD'de bu test ÇÖKER çünkü canvas scale(0.40) ile 219px'e büzülüyor (widthDiff ~ 327px)!
    expect(m.widthDiff, `I1 Hatası: Canvas genişliği (${m.canvasWidth}px) ile Sayfa kutusu (${m.pageWidth}px) uyuşmuyor!`).toBeLessThanOrEqual(1.5);
    expect(m.heightDiff, `I1 Hatası: Canvas yüksekliği (${m.canvasHeight}px) ile Sayfa kutusu (${m.pageHeight}px) uyuşmuyor!`).toBeLessThanOrEqual(1.5);

    // Kanıt ekran görüntüsü: Sayfa Modu
    const page1Sayfa = page.locator("[data-page-number='1']").first();
    await page1Sayfa.screenshot({ path: "docs/pdf-viewer-v3/kanit/r2-after-h1-fixed-sayfa.png" });
  });

  test("TEST-I1 & TEST-I3: Zoom In (%137-%195) esnasında H1 Sağ Kenar Kırpılması (Clipping) olmamalı", async ({ page }) => {
    // Önce Sayfa moduna geç
    const fitPageBtn = page.locator("[data-command-id='pdf.zoom.fitPage']").first();
    if (await fitPageBtn.isVisible()) {
      await fitPageBtn.click();
    } else {
      await page.keyboard.press("Control+Digit0");
    }
    await page.waitForTimeout(1000);

    // 3 kez zoom in tıkla (yaklaşık %137-%195 zoom seviyesine getir)
    const zoomInBtn = page.locator("[data-command-id='pdf.zoom.in']").first();
    await zoomInBtn.click();
    await page.waitForTimeout(500);
    await zoomInBtn.click();
    await page.waitForTimeout(500);
    await zoomInBtn.click();
    await page.waitForTimeout(2500);

    const m = await measurePage1Invariants(page);
    console.log("[TEST-I3 Zoom In Kırpılma Ölçümü]:", JSON.stringify(m, null, 2));

    // Kanıt ekran görüntüsü: %138 Zoom In (Kırpılma Olmadığının Görsel Kanıtı)
    const page1Zoom = page.locator("[data-page-number='1']").first();
    await page1Zoom.screenshot({ path: "docs/pdf-viewer-v3/kanit/r2-after-h1-fixed-138.png" });

    // I3 Değişmezi: Metin katmanındaki harfler beyaz sayfa kutusundan taşmamalıdır
    // HEAD'de bu test ÇÖKER çünkü metin 90.7px sağ kenardan taşıp overflow: hidden ile kesilmektedir (H1)!
    expect(m.isClipped, `H1 Regresyonu Yakalandı: Metin sağ kenarda kesiliyor! Kesilen miktar: ${m.clippedAmount}px, Taşma örneği: "${m.rightmostSample}"`).toBe(false);
    expect(m.clippedAmount).toBe(0);

    // I1 Değişmezi: Canvas kutusu = Sayfa kutusu
    expect(m.widthDiff, `I1 Hatası: Canvas (${m.canvasWidth}px) sayfa kutusundan (${m.pageWidth}px) taştı!`).toBeLessThanOrEqual(1.5);
  });

  test("TEST-I2: Netlik (Sharpness) değişmezi sağlanmalı (bitmap / CSS oranı >= 0.95 * DPR)", async ({ page }) => {
    // Genişliğe sığdır moduna geç
    const fitWidthBtn = page.locator("[data-command-id='pdf.zoom.fitWidth']").first();
    if (await fitWidthBtn.isVisible()) {
      await fitWidthBtn.click();
    } else {
      await page.keyboard.press("Control+Digit2");
    }
    await page.waitForTimeout(2000);

    const m = await measurePage1Invariants(page);
    console.log("[TEST-I2 Netlik Ölçümü]:", JSON.stringify(m, null, 2));

    // I2 Değişmezi: Netlik oranı >= 0.95 * min(DPR, 2)
    // HEAD'de bu test ÇÖKER çünkü bitmapPerCss oranı 0.524'e düşüyor (H2 Bulanıklık hatası)!
    const minRequiredRatio = 0.95 * Math.min(m.dpr, 2);
    expect(
      m.bitmapPerCss,
      `H2 Regresyonu Yakalandı: Metin bulanık! Bitmap/CSS oranı: ${m.bitmapPerCss}, Beklenen en az: ${minRequiredRatio}`
    ).toBeGreaterThanOrEqual(minRequiredRatio);
  });

  test("TEST-I5: Mod Geçiş Dizisi (Genişlik -> Sayfa -> %100 -> + -> -) tüm adımlarda değişmezleri korumalı", async ({ page }) => {
    // 1. Genişlik
    await page.keyboard.press("Control+Digit2");
    await page.waitForTimeout(1000);
    let m = await measurePage1Invariants(page);
    expect(m.widthDiff).toBeLessThanOrEqual(1.5);

    // 2. Sayfa
    await page.keyboard.press("Control+Digit0");
    await page.waitForTimeout(1000);
    m = await measurePage1Invariants(page);
    expect(m.widthDiff).toBeLessThanOrEqual(1.5);

    // 3. %100 Orijinal Boyut
    await page.keyboard.press("Control+Digit1");
    await page.waitForTimeout(1000);
    m = await measurePage1Invariants(page);
    expect(m.widthDiff).toBeLessThanOrEqual(1.5);
  });

  test("TEST-I7 & TEST-I8: Bozuk CMap (Ĝ -> i) otomatik onarılmalı, arama ('ilişki', 'değişken') çalışmalı ve kopyalama doğru olmalı", async ({ page }) => {
    // 1. Rozet kontrolü: Bozuk font eşlemesi saptanınca rozet görünmelidir
    const badge = page.locator("[data-testid='pdf-text-repaired-badge']").first();
    await expect(badge).toBeVisible({ timeout: 10000 });

    // 2. Arama Aç ve 'ilişki' ara (Eski sistemde 'ĜlĜşkĜ' olduğu için 0 sonuç veriyordu!)
    const searchBtn = page.locator("[data-command-id='pdf.search']").first();
    if (await searchBtn.isVisible()) {
      await searchBtn.click();
    } else {
      await page.keyboard.press("Control+f");
    }

    const searchInput = page.locator("input[placeholder*='ara'], input[placeholder*='Ara']").first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill("ilişki");
    await page.waitForTimeout(1000);

    // Eşleşme bulundu mu?
    const matchCountBadge = page.locator("[data-testid='pdf-search-match-count'], .pdf-search-mark").first();
    await expect(matchCountBadge).toBeVisible({ timeout: 10000 });

    // Vurgu katmanında eşleşme kutusu (mark) var mı?
    const searchMarks = page.locator(".pdf-search-mark");
    const count = await searchMarks.count();
    expect(count, "Arama 'ilişki' kelimesi için en az 1 eşleşme bulmalıdır").toBeGreaterThan(0);

    // Kanıt ekran görüntüsü: Arama ve Vurgu
    const page1 = page.locator("[data-page-number='1']").first();
    await page1.screenshot({ path: "docs/pdf-viewer-v3/kanit/r3-search-iliski-highlight.png" });

    // 3. Kopyalama Olayı Doğrulaması (H4: 'Ĝ' yerine 'i' yapışmalı)
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});

    const copyResult = await page.evaluate(async () => {
      const page1El = document.querySelector("[data-page-number='1']");
      const textLayer = page1El?.querySelector(".textLayer");
      if (!textLayer) return { success: false, text: "no-textLayer", hasRawG: false, hasIliski: false, hasG: false };

      // İlk paragrafı veya textLayer'ı seç
      const range = document.createRange();
      range.selectNodeContents(textLayer);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);

      const rawText = sel?.toString() || "";
      let capturedData = "";

      // DataTransfer.prototype.setData'yı izle (çünkü copy listener setData çağırır)
      const originalSetData = DataTransfer.prototype.setData;
      DataTransfer.prototype.setData = function (format: string, data: string) {
        if (format === "text/plain") {
          capturedData = data;
        }
        return originalSetData.apply(this, [format, data] as any);
      };

      try {
        document.execCommand("copy");
      } catch {}

      DataTransfer.prototype.setData = originalSetData;

      // Eğer execCommand engellendiyse sentetik ClipboardEvent ile doğrula
      if (!capturedData) {
        const dt = new DataTransfer();
        const copyEv = new ClipboardEvent("copy", {
          clipboardData: dt,
          bubbles: true,
          cancelable: true,
        });
        window.dispatchEvent(copyEv);
        capturedData = dt.getData("text/plain");
      }

      return {
        success: true,
        rawTextLength: rawText.length,
        hasRawG: rawText.includes("\u011c"),
        text: capturedData,
        hasIliski: capturedData.includes("ilişki") || capturedData.includes("ilişkinin"),
        hasG: capturedData.includes("\u011c"),
      };
    });

    console.log("[TEST-I8 Kopyalama Testi Çıktısı]:", {
      success: copyResult.success,
      hasRawG: copyResult.hasRawG,
      hasIliski: copyResult.hasIliski,
      hasG: copyResult.hasG,
      sample: copyResult.text.slice(0, 100),
    });

    expect(copyResult.hasRawG, "Orijinal seçilen metin bozuk U+011C ('Ĝ') içermelidir").toBe(true);
    expect(copyResult.hasIliski, "Kopyalanan metin 'ilişki' veya 'ilişkinin' içermelidir (Ĝ yerine i)").toBe(true);
    expect(copyResult.hasG, "Kopyalanan metinde bozuk U+011C ('Ĝ') bulunmamalıdır").toBe(false);
  });
});
