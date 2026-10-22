import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const PORT = 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUTPUT_DIR = path.resolve(process.cwd(), "docs/belgeler-form-view/evidence");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Belgeler listesi
const DOCUMENTS = [
  { id: "sozlesme", name: "Şantiye Şefi Hizmet Sözleşmesi", path: "/belgeler/santiye-sefi-sozlesmesi" },
  { id: "istifa", name: "Şantiye Şefi İstifa Dilekçesi", path: "/belgeler/santiye-sefi-istifa-dilekcesi" },
  { id: "taahhutname", name: "İşe Başlama Taahhütnamesi", path: "/belgeler/santiye-sefi-taahhutnamesi" },
  { id: "ruhsat", name: "İnşaat Ruhsatı Formu", path: "/belgeler/insaat-ruhsati-dilekcesi" },
  { id: "beton", name: "Beton Döküm Tutanağı", path: "/belgeler/beton-dokum-tutanagi" },
];

// Test edilecek ekran ve zoom konfigürasyonları
const VIEWPORT_CONFIGS = [
  { name: "1920x1080_zoom100", label: "1920×1080 (%100 Zoom)", width: 1920, height: 1080, dpr: 1 },
  { name: "1920x1080_zoom125", label: "1920×1080 (%125 Zoom)", width: 1536, height: 864, dpr: 1.25 },
  { name: "1920x1080_zoom150", label: "1920×1080 (%150 Zoom)", width: 1280, height: 720, dpr: 1.5 },
  { name: "1640x922_zoom150",  label: "1640×922 (%150 Zoom - Kullanıcı Örneği)", width: 1093, height: 615, dpr: 1.5 },
  { name: "1536x864_zoom100",  label: "1536×864 (%100 Zoom)", width: 1536, height: 864, dpr: 1 },
  { name: "1536x864_zoom125",  label: "1536×864 (%125 Zoom)", width: 1229, height: 691, dpr: 1.25 },
  { name: "1536x864_zoom150",  label: "1536×864 (%150 Zoom)", width: 1024, height: 576, dpr: 1.5 },
  { name: "1366x768_zoom100",  label: "1366×768 (%100 Zoom)", width: 1366, height: 768, dpr: 1 },
  { name: "1366x768_zoom125",  label: "1366×768 (%125 Zoom)", width: 1093, height: 614, dpr: 1.25 },
  { name: "1366x768_zoom150",  label: "1366×768 (%150 Zoom - lg altına düşüş)", width: 911, height: 512, dpr: 1.5 },
  { name: "1280x720_zoom100",  label: "1280×720 (%100 Zoom)", width: 1280, height: 720, dpr: 1 },
];

async function measureDocument(page, doc, config) {
  const url = `${BASE_URL}${doc.path}`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 25000 });

  // DOM elementlerinin attached olmasını bekle
  await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { state: "attached", timeout: 10000 });
  await page.waitForSelector('[data-testid="belge-studio-preview-toolbar"]', { state: "attached", timeout: 10000 });
  await page.waitForTimeout(1000);

  const isLgUp = config.width >= 1024;

  // Eğer ekran lg altındaysa (mobil sekme modu), önce varsayılan (preview sekmesi) durumu ölçelim,
  // sonra 'form' sekmesine tıklayıp form ölçümlerini alalım.
  let mobileTabState = null;
  if (!isLgUp) {
    // Mobil sekme düğmesini bul ve tıkla
    const formTabBtn = page.locator('button:has-text("Formu Düzenle"), [role="tab"]:has-text("Form")').first();
    const hasFormTab = (await formTabBtn.count()) > 0;
    if (hasFormTab) {
      await formTabBtn.click();
      await page.waitForTimeout(300);
      mobileTabState = "switched_to_form_tab";
    }
  }

  // Sayfa ve UI geometri ölçümleri
  const metrics = await page.evaluate((isLgUpParam) => {
    const formScroll = document.querySelector('[data-testid="belge-studio-form-scroll"]');
    const toolbar = document.querySelector('[data-testid="belge-studio-preview-toolbar"]');
    const previewPanel = document.querySelector('.belge-preview-panel');
    const splitMain = formScroll?.parentElement;

    // Form görünür mü?
    const isFormVisible = formScroll ? (formScroll.offsetWidth > 0 && formScroll.offsetHeight > 0 && window.getComputedStyle(formScroll).display !== 'none') : false;

    // Form içindeki ilk ve son kart/eleman
    const formCards = formScroll ? Array.from(formScroll.children).filter(el => el.classList.contains('rounded-lg') || el.tagName === 'DIV') : [];
    const firstCard = formCards[0];
    const lastCard = formCards[formCards.length - 1];

    const formScrollRect = formScroll ? formScroll.getBoundingClientRect() : null;
    const firstCardRect = firstCard ? firstCard.getBoundingClientRect() : null;
    const lastCardRect = lastCard ? lastCard.getBoundingClientRect() : null;
    const toolbarRect = toolbar ? toolbar.getBoundingClientRect() : null;
    const previewRect = previewPanel ? previewPanel.getBoundingClientRect() : null;

    // Form içeriğinin dikey görünürlüğü
    const lastCardVisibleWithoutScroll = (formScrollRect && lastCardRect && isFormVisible)
      ? (lastCardRect.bottom <= formScrollRect.bottom)
      : false;

    const lastCardCutOff = (formScrollRect && lastCardRect && isFormVisible)
      ? Math.max(0, lastCardRect.bottom - formScrollRect.bottom)
      : 0;

    // Toolbar butonlarının sığıp sığmadığı
    const toolbarHasHorizontalOverflow = toolbar
      ? toolbar.scrollWidth > toolbar.clientWidth + 1
      : false;

    // Form yatay taşma
    const formHasHorizontalOverflow = (formScroll && isFormVisible)
      ? formScroll.scrollWidth > formScroll.clientWidth + 1
      : false;

    // Form dikey taşma (kaydırma gereksinimi)
    const formHasVerticalOverflow = (formScroll && isFormVisible)
      ? formScroll.scrollHeight > formScroll.clientHeight + 1
      : false;

    return {
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        isLgUp: window.innerWidth >= 1024,
        isXlUp: window.innerWidth >= 1280,
      },
      form: {
        isFormVisible,
        clientWidth: formScroll ? formScroll.clientWidth : 0,
        clientHeight: formScroll ? formScroll.clientHeight : 0,
        scrollWidth: formScroll ? formScroll.scrollWidth : 0,
        scrollHeight: formScroll ? formScroll.scrollHeight : 0,
        hasHorizontalOverflow: formHasHorizontalOverflow,
        hasVerticalOverflow: formHasVerticalOverflow,
        verticalOverflowPx: (formScroll && isFormVisible) ? Math.max(0, formScroll.scrollHeight - formScroll.clientHeight) : 0,
        rect: formScrollRect ? { width: formScrollRect.width, height: formScrollRect.height, top: formScrollRect.top, left: formScrollRect.left } : null,
        firstCardTopOffset: (firstCardRect && formScrollRect) ? Math.round(firstCardRect.top - formScrollRect.top) : null,
        lastCardBottomOffset: (lastCardRect && formScrollRect) ? Math.round(lastCardRect.bottom - formScrollRect.bottom) : null,
        lastCardVisibleWithoutScroll,
        lastCardCutOff,
      },
      preview: {
        clientWidth: previewPanel ? previewPanel.clientWidth : 0,
        clientHeight: previewPanel ? previewPanel.clientHeight : 0,
        rect: previewRect ? { width: previewRect.width, height: previewRect.height } : null,
      },
      toolbar: {
        clientWidth: toolbar ? toolbar.clientWidth : 0,
        scrollWidth: toolbar ? toolbar.scrollWidth : 0,
        hasHorizontalOverflow: toolbarHasHorizontalOverflow,
        rect: toolbarRect ? { width: toolbarRect.width, height: toolbarRect.height } : null,
      },
      splitMain: {
        flexDirection: splitMain ? window.getComputedStyle(splitMain).flexDirection : null,
      }
    };
  }, isLgUp);

  metrics.mobileTabState = mobileTabState;
  return metrics;
}

async function main() {
  let browser = null;
  const results = {
    generatedAt: new Date().toISOString(),
    configurations: {},
    documentComparisons: {},
  };

  try {
    console.log("🚀 Tarayıcı başlatılıyor...");
    browser = await chromium.launch({ headless: true });

    // 1. Sözleşme Stüdyosu için tüm ekran/zoom kombinasyonları
    console.log("📊 Şantiye Şefi Sözleşmesi için ekran/zoom matrisi taranıyor...");
    const sozlesmeDoc = DOCUMENTS[0];
    results.configurations[sozlesmeDoc.id] = [];

    for (const config of VIEWPORT_CONFIGS) {
      console.log(`  🔍 Ölçülüyor: ${config.label} (${config.width}x${config.height})`);
      const context = await browser.newContext({
        viewport: { width: config.width, height: config.height },
        deviceScaleFactor: config.dpr,
      });
      const page = await context.newPage();

      try {
        const metrics = await measureDocument(page, sozlesmeDoc, config);
        
        // Ekran görüntüsü al
        const screenshotName = `${sozlesmeDoc.id}_${config.name}.png`;
        const screenshotPath = path.join(OUTPUT_DIR, screenshotName);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        results.configurations[sozlesmeDoc.id].push({
          config,
          metrics,
          screenshot: screenshotName,
        });
      } finally {
        await context.close();
      }
    }

    // 2. Beş Belgenin Tamamı için Karşılaştırma (Standart 1920x1080 @ 100% ve 1920x1080 @ 150% = 1280x720)
    console.log("📋 Beş stüdyo için form yüksekliği ve dikey taşma karşılaştırması alınıyor...");
    const testCases = [
      { name: "desktop_1920_zoom100", width: 1920, height: 1080, dpr: 1 },
      { name: "desktop_1920_zoom150", width: 1280, height: 720, dpr: 1.5 },
      { name: "laptop_1366_zoom100",  width: 1366, height: 768, dpr: 1 },
      { name: "laptop_1366_zoom150",  width: 911,  height: 512, dpr: 1.5 },
    ];

    for (const doc of DOCUMENTS) {
      console.log(`  📄 Belge: ${doc.name}`);
      results.documentComparisons[doc.id] = {
        name: doc.name,
        path: doc.path,
        cases: [],
      };

      for (const tc of testCases) {
        const context = await browser.newContext({
          viewport: { width: tc.width, height: tc.height },
          deviceScaleFactor: tc.dpr,
        });
        const page = await context.newPage();

        try {
          const metrics = await measureDocument(page, doc, tc);
          const screenshotName = `${doc.id}_${tc.name}.png`;
          const screenshotPath = path.join(OUTPUT_DIR, screenshotName);
          await page.screenshot({ path: screenshotPath, fullPage: false });

          results.documentComparisons[doc.id].cases.push({
            case: tc.name,
            viewport: { width: tc.width, height: tc.height },
            metrics,
            screenshot: screenshotName,
          });
        } finally {
          await context.close();
        }
      }
    }

    // Sonuçları JSON dosyasına yaz
    const jsonPath = path.join(OUTPUT_DIR, "baseline-metrics.json");
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf-8");
    console.log(`✅ Ölçümler kaydedildi: ${jsonPath}`);

  } catch (err) {
    console.error("❌ Hata oluştu:", err);
    process.exitCode = 1;
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log("🔒 Tarayıcı kapatıldı.");
      } catch (closeErr) {
        console.error("Tarayıcı kapatılırken hata:", closeErr);
      }
    }
    process.exit(process.exitCode || 0);
  }
}

main();
