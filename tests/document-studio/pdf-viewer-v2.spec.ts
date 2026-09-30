import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * FAZ A1 — PDF Görüntüleyici v2 Test Paketi
 *
 * Bu test paketi:
 * 1. tr-metin.pdf: Vurgu hizalama (Range.getClientRects() ve Canvas/TextLayer glif sınır kutusu eşleşmesi)
 * 2. uzun-300.pdf: Bellek ve pencereleme (hızlı kaydırma sonrası DOM'daki dolu canvas sayısı)
 * 3. tr-metin.pdf: Çoklu paragraf ve Türkçe karakter kopyalama seçimi
 * 4. karisik-boyut.pdf: A4 Dikey + A3 Yatay farklı sayfa oranları
 * 5. dondurulmus-90.pdf: 90 derece döndürülmüş sayfa oryantasyonu (v1 kusuru tespiti)
 * 6. satir-sonu-tire.pdf: Satır sonu tireleme arama testi (v1 hatası tespiti)
 * 7. linkli.pdf: İç bağlantı ve outline yer imleri altyapı testi (v1 eksikliği tespiti)
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

interface GroundTruthBox {
  word: string;
  page: number;
  pdfX: number;
  pdfY: number;
  width: number;
  height: number;
}

function getFixtureManifest(): { fixtures?: Record<string, { groundTruthBoxes?: GroundTruthBox[] }> } | null {
  const manifestPath = path.join(process.cwd(), "tests", "fixtures", "pdf", "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
}

test.describe("PDF Görüntüleyici v2 Test Altyapısı (Faz A1)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // --------------------------------------------------------------------------
  // TEST 1: Vurgu Hizalama Testi (Playwright) — tr-metin.pdf
  // --------------------------------------------------------------------------
  test("1. Vurgu Hizalama Testi: 'araştırma' araması ve glif-vurgu sınır kutusu eşleşmesi (≤ 2px tolerans)", async ({ page }) => {
    test.setTimeout(90_000);
    const manifest = getFixtureManifest();
    const groundTruthBoxes = manifest?.fixtures?.["tr-metin.pdf"]?.groundTruthBoxes?.filter(
      (b: GroundTruthBox) => b.word === "araştırma" && b.page === 1
    ) || [];

    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    const firstCanvas = page.locator("canvas").first();
    await expect(firstCanvas).toBeVisible({ timeout: 20_000 });

    // Metin katmanının yüklenmesini bekle
    await page.locator(".pdf-text-layer span, .textLayer span").first().waitFor({ state: "visible", timeout: 20_000 });

    // Arama çubuğunu aç ve 'araştırma' ara
    const searchToggle = page.locator('[data-command-id="pdf.search.open"]').first();
    await searchToggle.click();
    const searchInput = page.getByPlaceholder("Dokümanda ara...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("araştırma");
    await page.keyboard.press("Enter");

    // Vurgu etiketlerinin DOM'a düşmesini bekle
    const firstMark = page.locator("mark.pdf-search-mark, mark.pdf-search-mark-active").first();
    await expect(firstMark).toBeVisible({ timeout: 15_000 });

    // 3 farklı zoom seviyesinde (%100, %150, %300) ölçüm yap
    const zoomLevels = [
      { name: "%100", action: async () => page.locator('[data-command-id="pdf.zoom.100"]').first().click() },
      { name: "%150", action: async () => page.locator('[data-command-id="pdf.zoom.in"]').first().click() },
      { name: "%300", action: async () => {
        const zoomIn = page.locator('[data-command-id="pdf.zoom.in"]').first();
        await zoomIn.click();
        await zoomIn.click();
        await zoomIn.click();
      }},
    ];

    const alignmentReport: { zoom: string; maxDriftPx: number; markCount: number; pass: boolean }[] = [];

    for (const zl of zoomLevels) {
      await zl.action();
      await page.waitForTimeout(700);

      const driftResult = await page.evaluate(({ expectedBoxes }) => {
        const page1 = document.querySelector('[data-page-number="1"]') || document.querySelector('.relative.bg-white');
        if (!page1) return { maxDrift: 999, markCount: 0 };

        const canvas = page1.querySelector("canvas");
        const marks = Array.from(page1.querySelectorAll("mark"));
        if (!canvas || marks.length === 0) return { maxDrift: 999, markCount: 0 };

        const canvasRect = canvas.getBoundingClientRect();
        const currentScale = canvasRect.width / 595.28;
        const pageHeightPdf = 841.89;

        let maxDelta = 0;

        const markDetails = marks.map((mark, i) => {
          const markRect = mark.getBoundingClientRect();
          const actualLeft = markRect.left - canvasRect.left;
          const actualTop = markRect.top - canvasRect.top;

          let diffX = 999;
          let diffY = 999;
          let expLeft = -1;
          let expTop = -1;

          if (expectedBoxes && expectedBoxes[i]) {
            const exp = expectedBoxes[i];
            expLeft = exp.pdfX * currentScale;
            expTop = (pageHeightPdf - exp.pdfY) * currentScale - exp.height * currentScale;
            diffX = Math.abs(actualLeft - expLeft);
            diffY = Math.abs(actualTop - expTop);
          }
          const drift = Math.max(diffX, diffY);
          if (drift > maxDelta) maxDelta = drift;
          return { i, actualLeft, actualTop, expLeft, expTop, diffX, diffY, drift };
        });

        return { maxDrift: maxDelta, markCount: marks.length, markDetails };
      }, { expectedBoxes: groundTruthBoxes });

      console.log(`[HİZALAMA ÖLÇÜMÜ] Zoom ${zl.name}: Tespit edilen maksimum sapma = ${driftResult.maxDrift.toFixed(2)} css px (Vurgu adedi: ${driftResult.markCount})`);
      console.log(`[HİZALAMA DETAYLARI ${zl.name}]:`, JSON.stringify(driftResult.markDetails, null, 2));
      alignmentReport.push({
        zoom: zl.name,
        maxDriftPx: driftResult.maxDrift,
        markCount: driftResult.markCount,
        pass: driftResult.maxDrift <= 2.0,
      });
    }

    console.log("=== Vurgu Hizalama Testi Raporu ===", JSON.stringify(alignmentReport, null, 2));
    expect(alignmentReport.length).toBe(3);
    expect(alignmentReport[0].markCount).toBeGreaterThan(0);

    const hasDriftExceeded = alignmentReport.some((r) => !r.pass);
    if (hasDriftExceeded) {
      console.warn(">>> [V1 KUSURU DOĞRULANDI] Vurgu hizalaması 2px toleransını aştı (Faz D/E çözümü bekleniyor).");
    }

    // Hedef v2 sözleşmesi: Her 3 zoom seviyesinde de maksimum sapma ≤ 2.0 css px olmalıdır.
    // v1'de TextLayer'da --scale-factor CSS değişkenleri eksik olduğundan ve span DOM düğümleri
    // <mark> ile parçalandığından sapma 96.99 css px'e ulaşmakta ve bu test FAIL olmaktadır
    // (v1 vurgu hizalama kusurunun otomatik kanıtı — Faz D ve Faz E'de çözülecek).
    expect(hasDriftExceeded).toBe(false);
  });

  // --------------------------------------------------------------------------
  // TEST 2: Bellek ve Pencereleme Testi — uzun-300.pdf
  // --------------------------------------------------------------------------
  test("2. Bellek Testi: 300 sayfalık belgede 1→250 hızlı kaydırma sonrası dolu canvas sayısı (≤ 13 hedefi)", async ({ page }) => {
    test.setTimeout(90_000);
    const fileId = await uploadFixturePdf(page, "uzun-300.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });

    // Hızlı biçimde 250. sayfaya kadar scroll yap
    await page.evaluate(() => {
      const scroller = document.querySelector('[data-testid="pdf-scroll-viewport"]') as HTMLElement || document.querySelector('.overflow-auto') as HTMLElement;
      if (scroller) {
        scroller.scrollTop = scroller.scrollHeight * (250 / 300);
      }
    });

    // Observer ve render döngüsünün durulması için 1.5 saniye bekle
    await page.waitForTimeout(1500);

    const memoryStats = await page.evaluate(() => {
      const allCanvases = Array.from(document.querySelectorAll("canvas"));
      const populatedCanvases = allCanvases.filter((c) => c.width > 1 && c.height > 1);
      const textLayers = Array.from(document.querySelectorAll(".pdf-text-layer, .textLayer"));
      const populatedTextLayers = textLayers.filter((l) => l.childElementCount > 0);

      return {
        totalCanvasesInDom: allCanvases.length,
        populatedCanvasesCount: populatedCanvases.length,
        populatedTextLayersCount: populatedTextLayers.length,
      };
    });

    console.log(`[BELLEK ÖLÇÜMÜ] 250. sayfaya kaydırma sonrası:`);
    console.log(`  - DOM'daki toplam canvas: ${memoryStats.totalCanvasesInDom}`);
    console.log(`  - Bellekte dolu tutulan canvas: ${memoryStats.populatedCanvasesCount} (Plandaki hedef: ≤ 11 + 2 = 13)`);
    console.log(`  - Dolu text layer adedi: ${memoryStats.populatedTextLayersCount}`);

    expect(memoryStats.totalCanvasesInDom).toBeGreaterThanOrEqual(1);
    expect(memoryStats.populatedCanvasesCount).toBeLessThanOrEqual(13);
  });

  // --------------------------------------------------------------------------
  // TEST 3: Çoklu Paragraf Seçim ve Kopyalama Testi — tr-metin.pdf
  // --------------------------------------------------------------------------
  test("3. Kopyalama Testi: Türkçe karakterli paragrafların seçimi ve panoya aktarımı", async ({ page }) => {
    test.setTimeout(60_000);
    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });

    // TextLayer render olana kadar bekle
    const firstSpan = page.locator(".pdf-text-layer span, .textLayer span").first();
    await expect(firstSpan).toBeVisible({ timeout: 25_000 });

    const selectionResult = await page.evaluate(() => {
      const textLayer = document.querySelector('.pdf-text-layer, .textLayer');
      if (!textLayer) return { selectedText: "", spanCount: 0 };

      const spans = Array.from(textLayer.querySelectorAll("span"));
      if (spans.length === 0) return { selectedText: "", spanCount: 0 };

      const range = document.createRange();
      range.setStartBefore(spans[0]);
      range.setEndAfter(spans[Math.min(spans.length - 1, 10)]);

      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);

      return {
        selectedText: sel?.toString() || "",
        spanCount: spans.length,
      };
    });

    console.log(`[KOPYALAMA TESTİ] Metin katmanındaki span adedi: ${selectionResult.spanCount}`);
    console.log(`[KOPYALAMA TESTİ] Seçilen metin uzunluğu: ${selectionResult.selectedText.length} karakter`);
    console.log(`[KOPYALAMA TESTİ] Seçilen metin: "${selectionResult.selectedText.slice(0, 100)}..."`);

    expect(selectionResult.spanCount).toBeGreaterThan(0);
    expect(selectionResult.selectedText.length).toBeGreaterThan(0);
    expect(selectionResult.selectedText).toContain("araştırma");
  });

  // --------------------------------------------------------------------------
  // TEST 4: Karışık Sayfa Boyutları Testi — karisik-boyut.pdf
  // --------------------------------------------------------------------------
  test("4. Karışık Boyut: A4 Dikey + A3 Yatay pafta boyut oranlarının korunumu", async ({ page }) => {
    test.setTimeout(60_000);
    const karisikId = await uploadFixturePdf(page, "karisik-boyut.pdf");
    await page.goto(`/dokumantasyon/dosya/${karisikId}`);
    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });

    const firstCanvas = page.locator("canvas").first();
    await expect(firstCanvas).toBeVisible({ timeout: 20_000 });

    const pageDimensions = await page.evaluate(async () => {
      const pages = Array.from(document.querySelectorAll('[data-page-number]'));
      return pages.slice(0, 2).map((p) => {
        const rect = p.getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      });
    });

    console.log("[KARIŞIK BOYUT] Sayfa boyutları:", pageDimensions);
    expect(pageDimensions.length).toBeGreaterThanOrEqual(2);
    const ratio = pageDimensions[1].width / pageDimensions[0].width;
    console.log(`[KARIŞIK BOYUT] Sayfa 2 / Sayfa 1 genişlik oranı: ${ratio.toFixed(2)} (Beklenen: ~2.0)`);
    expect(ratio).toBeGreaterThan(1.3);
  });

  // --------------------------------------------------------------------------
  // TEST 5: Döndürülmüş Sayfa Oryantasyonu — dondurulmus-90.pdf (v1 Kusuru Doğrulaması)
  // --------------------------------------------------------------------------
  test("5. Döndürülmüş Sayfa: Rotate=90 olan belgenin yatay (landscape) render edilmesi", async ({ page }) => {
    test.setTimeout(60_000);
    const dondurulmusId = await uploadFixturePdf(page, "dondurulmus-90.pdf");
    await page.goto(`/dokumantasyon/dosya/${dondurulmusId}`);
    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    const rotCanvas = page.locator("canvas").first();
    await expect(rotCanvas).toBeVisible({ timeout: 20_000 });

    const canvasOrientation = await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      if (!canvas) return null;
      return { width: canvas.width, height: canvas.height, isLandscape: canvas.width > canvas.height };
    });

    console.log("[DÖNDÜRÜLMÜŞ 90] Canvas oryantasyonu:", canvasOrientation);
    expect(canvasOrientation).not.toBeNull();

    // v1'de studio rotation={0} ile sayfa intrinsik rotasyonunu (p.rotate=90) ezmektedir.
    // Bu test v2 sözleşmesi olarak isLandscape === true bekler; v1'de FAIL olması beklenen kusurdur.
    const isLandscape = canvasOrientation?.isLandscape ?? false;
    if (!isLandscape) {
      console.warn(">>> [V1 KUSURU DOĞRULANDI] v1 Rotate=90 sayfayı dikey (portrait) render etmektedir (Faz C'de çözülecek).");
    }
    expect(isLandscape).toBe(true);
  });

  // --------------------------------------------------------------------------
  // TEST 6: Satır Sonu Tire Arama Testi — satir-sonu-tire.pdf (v1 Kusuru Doğrulaması)
  // --------------------------------------------------------------------------
  test("6. Satır Sonu Tire Arama: 'araştır-' + 'ma' birleşik kelimesinin bulunabilmesi", async ({ page }) => {
    test.setTimeout(60_000);
    const fileId = await uploadFixturePdf(page, "satir-sonu-tire.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });

    // 'araştırma' ara
    const searchToggle = page.locator('[data-command-id="pdf.search.open"]').first();
    await searchToggle.click();
    const searchInput = page.getByPlaceholder("Dokümanda ara...");
    await searchInput.fill("araştırma");
    await page.keyboard.press("Enter");

    await page.waitForTimeout(1000);

    const matchStatus = await page.evaluate(() => {
      const marks = document.querySelectorAll("mark");
      return {
        marksFound: marks.length,
      };
    });

    console.log(`[SATIR SONU TİRE] 'araştırma' araması sonucu bulunan eşleşme: ${matchStatus.marksFound}`);
    if (matchStatus.marksFound === 0) {
      console.log(">>> [V1 KUSURU DOĞRULANDI] v1 satır sonunda tire ile bölünen kelimeleri ('araştır-' + 'ma') BULAMIYOR (Faz E'de çözülecek).");
    }

    // Hedef v2 davranışı: Tire ile bölünen kelime birleştirilerek en az 1 eşleşme bulunmalıdır
    expect(matchStatus.marksFound).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // TEST 7: Bağlantılı ve Outline Testi — linkli.pdf (v1 Eksikliği Tespiti)
  // --------------------------------------------------------------------------
  test("7. Bağlantılar ve Outline: İç/Dış linkler ve doküman yer imleri altyapı denetimi", async ({ page }) => {
    test.setTimeout(60_000);
    const fileId = await uploadFixturePdf(page, "linkli.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });

    const linkAndOutlineAudit = await page.evaluate(() => {
      const extLinks = Array.from(document.querySelectorAll('a[href^="http"]'));
      const intLinks = Array.from(document.querySelectorAll('a[data-dest-page], [data-internal-link]'));
      const outlineBtn = document.querySelector('[data-command-id*="outline"], [data-command-id*="toc"]');

      return {
        externalLinksInDom: extLinks.length,
        internalLinksInDom: intLinks.length,
        hasOutlineUI: !!outlineBtn,
      };
    });

    console.log("[LİNK VE OUTLINE DENETİMİ]:", linkAndOutlineAudit);
    if (!linkAndOutlineAudit.hasOutlineUI) {
      console.log(">>> [V1 EKSİKLİĞİ DOĞRULANDI] v1'de PDF outline (içindekiler) paneli YOK (Faz G'de eklenecek).");
    }
    // Faz G hedefi: Outline paneli bulunmalıdır
    expect(linkAndOutlineAudit.hasOutlineUI).toBe(true);
  });
});
