import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * FAZ D — Playwright Kabul Testleri (Metin Katmanı, Seçim ve Kopyalama)
 *
 * 1. Hizalama Testi: Metin katmanı glif kutuları (Range.getClientRects()) ile PDF kaynak koordinatları eşleşmesi (<= 2px tolerans)
 * 2. Kopyalama ve Türkçe Karakter: Türkçe karakterlerin panoya aktarımı ve çift satır atlama olmaması
 * 3. Boşluğa Sürükleme ve endOfContent: Seçimin sayfa sonuna sıçramasını önleyen .endOfContent ve .selecting mekanizması
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
    throw new Error(`Fixture dosyasi bulunamadi: ${fixtureFileName}`);
  }

  const fileBytes = fs.readFileSync(filePath);
  const base64 = fileBytes.toString("base64");

  return page.evaluate(
    async ({ name, content }) => {
      const bytes = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
      const formData = new FormData();
      formData.append("file", new File([bytes], name, { type: "application/pdf" }));
      formData.append("pathname", `dok_storage/faz-d-${Date.now()}-${name}`);
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

test.describe("PDF Görüntüleyici v2 — FAZ D Metin Katmanı ve Kopyalama", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // --------------------------------------------------------------------------
  // TEST 1: Hizalama Testi (Metin Katmanı Glif Sınır Kutuları <= 2px Tolerans)
  // --------------------------------------------------------------------------
  test("1. Metin Katmanı Hizalama Testi: Range.getClientRects() ile glif konumu (<= 2px tolerans)", async ({ page }) => {
    test.setTimeout(90_000);
    const manifest = getFixtureManifest();
    const groundTruthBoxes = manifest?.fixtures?.["tr-metin.pdf"]?.groundTruthBoxes?.filter(
      (b: GroundTruthBox) => b.page === 1
    ) || [];

    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    const firstCanvas = page.locator("canvas").first();
    await expect(firstCanvas).toBeVisible({ timeout: 20_000 });

    // Metin katmanının yüklenmesini bekle
    const firstSpan = page.locator(".pdf-text-layer span, .textLayer span").first();
    await expect(firstSpan).toBeVisible({ timeout: 25_000 });

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

    const alignmentReport: { zoom: string; maxDriftPx: number; sampleCount: number; pass: boolean }[] = [];

    for (const zl of zoomLevels) {
      await zl.action();
      await page.waitForTimeout(800);

      const driftResult = await page.evaluate(({ expectedBoxes }) => {
        const page1 = document.querySelector('[data-page-number="1"]');
        if (!page1) return { maxDrift: 999, sampleCount: 0, details: [] };

        const canvas = page1.querySelector("canvas");
        const textLayer = page1.querySelector(".textLayer, .pdf-text-layer");
        if (!canvas || !textLayer) return { maxDrift: 999, sampleCount: 0, details: [] };

        const canvasRect = canvas.getBoundingClientRect();
        const currentScale = canvasRect.width / 595.28;
        const pageHeightPdf = 841.89;

        const spans = Array.from(textLayer.querySelectorAll("span"));
        let maxDelta = 0;
        let matchedSamples = 0;
        const details: any[] = [];

        // Font ascent oranı: Arial/sans-serif için standart 0.905
        const FONT_ASCENT_RATIO = 0.905;

        for (const box of expectedBoxes) {
          const fontAscent = box.height * FONT_ASCENT_RATIO;
          const expTop = (pageHeightPdf - box.pdfY - fontAscent) * currentScale;
          const expLeft = box.pdfX * currentScale;

          // Bu kelimeyi içeren ve dikeyde beklenen satıra en yakın olan span'ı eşle
          let bestSpan: HTMLElement | null = null;
          let bestWordIdx = -1;
          let bestDiffY = Infinity;

          for (const span of spans) {
            const text = span.textContent || "";
            const wordIdx = text.indexOf(box.word);
            if (wordIdx !== -1 && span.firstChild) {
              const spanRect = span.getBoundingClientRect();
              const spanTop = spanRect.top - canvasRect.top;
              const diffY = Math.abs(spanTop - expTop);
              if (diffY < bestDiffY) {
                bestDiffY = diffY;
                bestSpan = span;
                bestWordIdx = wordIdx;
              }
            }
          }

          if (bestSpan && bestSpan.firstChild) {
            try {
              const range = document.createRange();
              range.setStart(bestSpan.firstChild, bestWordIdx);
              range.setEnd(bestSpan.firstChild, bestWordIdx + box.word.length);
              const rect = range.getBoundingClientRect();

              if (rect.width > 0 && rect.height > 0) {
                const actualLeft = rect.left - canvasRect.left;
                const actualTop = rect.top - canvasRect.top;

                const diffX = Math.abs(actualLeft - expLeft);
                const diffY = Math.abs(actualTop - expTop);
                const drift = Math.max(diffX, diffY);

                details.push({
                  word: box.word,
                  actualLeft: Number(actualLeft.toFixed(2)),
                  expLeft: Number(expLeft.toFixed(2)),
                  diffX: Number(diffX.toFixed(2)),
                  actualTop: Number(actualTop.toFixed(2)),
                  expTop: Number(expTop.toFixed(2)),
                  diffY: Number(diffY.toFixed(2)),
                  drift: Number(drift.toFixed(2)),
                });

                if (drift > maxDelta) maxDelta = drift;
                matchedSamples++;
              }
            } catch {}
          }
        }

        return { maxDrift: maxDelta, sampleCount: matchedSamples, details: details.slice(0, 5) };
      }, { expectedBoxes: groundTruthBoxes });

      console.log(`[FAZ D HİZALAMA] Zoom ${zl.name}: Ölçülen maksimum sapma = ${driftResult.maxDrift.toFixed(2)} css px (Eşleşen örnek: ${driftResult.sampleCount})`);
      console.log(`[FAZ D DETAYLAR ${zl.name}]:`, JSON.stringify(driftResult.details, null, 2));
      alignmentReport.push({
        zoom: zl.name,
        maxDriftPx: driftResult.maxDrift,
        sampleCount: driftResult.sampleCount,
        pass: driftResult.maxDrift <= 2.0,
      });
    }

    console.log("=== FAZ D Metin Katmanı Hizalama Raporu ===", JSON.stringify(alignmentReport, null, 2));
    expect(alignmentReport.length).toBe(3);
    expect(alignmentReport[0].sampleCount).toBeGreaterThan(0);

    const allPassed = alignmentReport.every((r) => r.pass);
    expect(allPassed).toBe(true);
  });

  // --------------------------------------------------------------------------
  // TEST 2: Kopyalama ve Türkçe Karakter / Çift Satır Atlama Olmaması
  // --------------------------------------------------------------------------
  test("2. Kopyalama: Türkçe karakterler bozulmadan panoya aktarılmalı ve çift satır atlama olmamalı", async ({ page }) => {
    test.setTimeout(60_000);
    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });

    const firstSpan = page.locator(".pdf-text-layer span, .textLayer span").first();
    await expect(firstSpan).toBeVisible({ timeout: 25_000 });

    const copyResult = await page.evaluate(() => {
      const textLayer = document.querySelector(".pdf-text-layer, .textLayer");
      if (!textLayer) return { text: "", hasDoubleNewline: false, charCount: 0 };

      const spans = Array.from(textLayer.querySelectorAll("span"));
      if (spans.length === 0) return { text: "", hasDoubleNewline: false, charCount: 0 };

      const range = document.createRange();
      range.setStartBefore(spans[0]);
      range.setEndAfter(spans[Math.min(spans.length - 1, 15)]);

      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);

      const selected = sel?.toString() || "";
      // Çift satır atlama kontrolü: "\n\s*\n\s*\n" veya peş peşe 3 boşluklu satır
      const hasDoubleNewline = /\n\s*\n\s*\n/.test(selected);

      return {
        text: selected,
        hasDoubleNewline,
        charCount: selected.length,
      };
    });

    console.log(`[FAZ D KOPYALAMA] Seçilen metin uzunluğu: ${copyResult.charCount}`);
    console.log(`[FAZ D KOPYALAMA] Çift satır atlama var mı: ${copyResult.hasDoubleNewline ? "EVET" : "HAYIR"}`);
    expect(copyResult.charCount).toBeGreaterThan(50);
    expect(copyResult.hasDoubleNewline).toBe(false);
    expect(copyResult.text).toContain("araştırma");
    expect(copyResult.text).toContain("TÜRKÇE");
  });

  // --------------------------------------------------------------------------
  // TEST 3: Seçim Boşluk Sıçramasını Önleme (.endOfContent ve .selecting)
  // --------------------------------------------------------------------------
  test("3. Seçim Davranışı: .endOfContent elemanı ve .selecting sınıfı yönetimi", async ({ page }) => {
    test.setTimeout(60_000);
    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("pdf-viewer-toolbar")).toBeVisible({ timeout: 20_000 });
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 20_000 });

    const endOfContent = page.locator(".textLayer .endOfContent, .pdf-text-layer .endOfContent").first();
    await expect(endOfContent).toBeAttached({ timeout: 20_000 });

    // PointerDown ile .selecting sınıfının eklenmesini test et
    const textLayer = page.locator(".textLayer, .pdf-text-layer").first();
    await textLayer.dispatchEvent("pointerdown");

    const hasSelectingOnDown = await textLayer.evaluate((el) => el.classList.contains("selecting"));
    console.log(`[FAZ D SEÇİM] pointerdown anında .selecting sınıfı var mı: ${hasSelectingOnDown ? "EVET" : "HAYIR"}`);
    expect(hasSelectingOnDown).toBe(true);

    // PointerUp ile .selecting sınıfının kalkmasını test et
    await page.evaluate(() => window.dispatchEvent(new Event("pointerup")));
    const hasSelectingOnUp = await textLayer.evaluate((el) => el.classList.contains("selecting"));
    console.log(`[FAZ D SEÇİM] pointerup anında .selecting sınıfı kalktı mı: ${!hasSelectingOnUp ? "EVET" : "HAYIR"}`);
    expect(hasSelectingOnUp).toBe(false);
  });
});
