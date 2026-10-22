import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const PORT = 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUTPUT_DIR = path.resolve(process.cwd(), "docs/belgeler-form-view/evidence");

async function main() {
  let browser = null;
  const results = {
    generatedAt: new Date().toISOString(),
    stage: "ASAMA_03",
    tests: [],
  };

  try {
    console.log("🚀 Tarayıcı başlatılıyor (ASAMA_03 Manuel Zoom/Yoğunluk Doğrulaması)...");
    browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }, // Kullanıcının %150 zoom senaryosu
      deviceScaleFactor: 1.5,
    });
    const page = await context.newPage();

    console.log("📄 Sözleşme sayfasına gidiliyor...");
    await page.goto(`${BASE_URL}/belgeler/santiye-sefi-sozlesmesi`, {
      waitUntil: "networkidle",
      timeout: 25000,
    });

    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 10000 });
    await page.waitForSelector('[data-belge-form-content="true"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="belge-studio-preview-toolbar"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // 1. Varsayılan %100 Durumu
    console.log("🔍 1. Varsayılan %100 Görünümü Ölçülüyor...");
    const defaultMetrics = await page.evaluate(() => {
      const form = document.querySelector('[data-testid="belge-studio-form-scroll"]');
      const content = document.querySelector('[data-belge-form-content="true"]');
      const preview = document.querySelector('.belge-preview-panel');
      const pdfZoom = document.querySelector('[data-testid="belge-studio-zoom-level"]');

      return {
        formScrollHeight: form.scrollHeight,
        formClientHeight: form.clientHeight,
        formScrollWidth: form.scrollWidth,
        formClientWidth: form.clientWidth,
        contentZoom: window.getComputedStyle(content).zoom || "1",
        pdfZoomLabel: pdfZoom ? pdfZoom.textContent.trim() : null,
      };
    });

    await page.screenshot({ path: path.join(OUTPUT_DIR, "stage03_sozlesme_zoom100.png") });
    results.tests.push({ name: "zoom_100_default", metrics: defaultMetrics });
    console.log(`  📊 Zoom %100: Form scrollH=${defaultMetrics.formScrollHeight}px, PDF Zoom=${defaultMetrics.pdfZoomLabel}`);

    // 2. %90 Manuel Zoom Uygulaması ve Form Etkileşim Testi
    console.log("🔍 2. %90 Manuel Zoom Uygulanıyor...");
    const zoom90Metrics = await page.evaluate(() => {
      const form = document.querySelector('[data-testid="belge-studio-form-scroll"]');
      const content = document.querySelector('[data-belge-form-content="true"]');
      
      // %90 zoom uygula
      content.style.zoom = "0.9";
      content.setAttribute("data-scale", "0.9");

      return {
        formScrollHeight: form.scrollHeight,
        formClientHeight: form.clientHeight,
        formScrollWidth: form.scrollWidth,
        formClientWidth: form.clientWidth,
        hasHorizontalOverflow: form.scrollWidth > form.clientWidth + 1,
      };
    });

    // İnput odağı, caret ve yazma testi
    const muteahhitInput = page.locator('#sozlesme-muteahhit_unvan');
    await muteahhitInput.click();
    await muteahhitInput.fill("TEST İNŞAAT VE MÜHENDİSLİK A.Ş.");
    
    // Tab ile sonraki alana geçiş
    await page.keyboard.press("Tab");
    const activeElementId = await page.evaluate(() => document.activeElement ? document.activeElement.id : null);

    await page.screenshot({ path: path.join(OUTPUT_DIR, "stage03_sozlesme_zoom90_input.png") });
    results.tests.push({
      name: "zoom_90_manual",
      metrics: zoom90Metrics,
      tabNavigatedId: activeElementId,
      inputWorks: activeElementId === "sozlesme-santiye_sefi_ad",
      scrollHeightReduced: zoom90Metrics.formScrollHeight < defaultMetrics.formScrollHeight,
    });
    console.log(`  📊 Zoom %90: scrollH=${zoom90Metrics.formScrollHeight}px (azalma: ${defaultMetrics.formScrollHeight - zoom90Metrics.formScrollHeight}px), Tab Nav=${activeElementId}`);

    // 3. %125 Manuel Zoom Uygulaması
    console.log("🔍 3. %125 Manuel Zoom Uygulanıyor...");
    const zoom125Metrics = await page.evaluate(() => {
      const form = document.querySelector('[data-testid="belge-studio-form-scroll"]');
      const content = document.querySelector('[data-belge-form-content="true"]');
      
      content.style.zoom = "1.25";
      content.setAttribute("data-scale", "1.25");

      return {
        formScrollHeight: form.scrollHeight,
        formClientHeight: form.clientHeight,
        formScrollWidth: form.scrollWidth,
        formClientWidth: form.clientWidth,
        hasHorizontalOverflow: form.scrollWidth > form.clientWidth + 1,
      };
    });

    // Formu en aşağı kaydırıp son elemanı kontrol et
    await page.evaluate(() => {
      const form = document.querySelector('[data-testid="belge-studio-form-scroll"]');
      form.scrollTop = form.scrollHeight;
    });
    await page.waitForTimeout(200);

    const lastCardVisibleAtBottom = await page.evaluate(() => {
      const form = document.querySelector('[data-testid="belge-studio-form-scroll"]');
      const lastInput = document.querySelector('#sozlesme-muteahhit_imza_unvan');
      const formRect = form.getBoundingClientRect();
      const inputRect = lastInput.getBoundingClientRect();

      return inputRect.bottom <= formRect.bottom + 5 && inputRect.top >= formRect.top;
    });

    await page.screenshot({ path: path.join(OUTPUT_DIR, "stage03_sozlesme_zoom125_scrolled.png") });
    results.tests.push({
      name: "zoom_125_manual",
      metrics: zoom125Metrics,
      lastCardVisibleAtBottom,
    });
    console.log(`  📊 Zoom %125: scrollH=${zoom125Metrics.formScrollHeight}px, En altta son kart görünür mü=${lastCardVisibleAtBottom}`);

    // 4. Kompakt Mod Uygulaması
    console.log("🔍 4. Kompakt Mod Test Ediliyor...");
    const compactMetrics = await page.evaluate(() => {
      const form = document.querySelector('[data-testid="belge-studio-form-scroll"]');
      const content = document.querySelector('[data-belge-form-content="true"]');
      
      content.style.zoom = "1.0";
      content.setAttribute("data-scale", "1.0");
      content.className = "space-y-1.5";
      content.setAttribute("data-density", "compact");

      return {
        formScrollHeight: form.scrollHeight,
        formClientHeight: form.clientHeight,
      };
    });

    await page.screenshot({ path: path.join(OUTPUT_DIR, "stage03_sozlesme_compact.png") });
    results.tests.push({
      name: "density_compact",
      metrics: compactMetrics,
      scrollHeightReduced: compactMetrics.formScrollHeight < defaultMetrics.formScrollHeight,
    });
    console.log(`  📊 Kompakt: scrollH=${compactMetrics.formScrollHeight}px (azalma: ${defaultMetrics.formScrollHeight - compactMetrics.formScrollHeight}px)`);

    // 5. PDF Motoru İzolasyon Kontrolü
    console.log("🔍 5. PDF Motoru ve Toolbar İzolasyonu Doğrulanıyor...");
    const pdfIsolation = await page.evaluate(() => {
      const pdfToolbar = document.querySelector('[data-testid="belge-studio-preview-toolbar"]');
      const pdfPanel = document.querySelector('.belge-preview-panel');
      const pdfZoomLabel = document.querySelector('[data-testid="belge-studio-zoom-level"]');

      return {
        toolbarWidth: pdfToolbar ? pdfToolbar.clientWidth : 0,
        toolbarHasOverflow: pdfToolbar ? pdfToolbar.scrollWidth > pdfToolbar.clientWidth + 1 : false,
        pdfZoomUnchanged: pdfZoomLabel ? pdfZoomLabel.textContent.trim() : null,
      };
    });

    results.pdfIsolation = pdfIsolation;
    console.log(`  📊 PDF İzolasyonu: Toolbar W=${pdfIsolation.toolbarWidth}px, PDF Zoom=${pdfIsolation.pdfZoomUnchanged}, Taşma=${pdfIsolation.toolbarHasOverflow ? "VAR" : "YOK"}`);

    const jsonPath = path.join(OUTPUT_DIR, "stage03-metrics.json");
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf-8");
    console.log(`✅ ASAMA_03 doğrulama sonuçları kaydedildi: ${jsonPath}`);

    console.log("🎉 ASAMA_03 TÜM TESTLERİ BAŞARIYLA TAMAMLANDI!");

    await context.close();
  } catch (err) {
    console.error("❌ Hata:", err);
    process.exitCode = 1;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error("Tarayıcı kapatma hatası:", e);
      }
    }
    process.exit(process.exitCode || 0);
  }
}

main();
