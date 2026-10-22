import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const PORT = 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUTPUT_DIR = path.resolve(process.cwd(), "docs/belgeler-form-view/evidence");

const DOCUMENTS = [
  {
    slug: "santiye-sefi-sozlesmesi",
    title: "Şantiye Şefi Hizmet Sözleşmesi",
  },
  {
    slug: "santiye-sefi-istifa-dilekcesi",
    title: "Şantiye Şefi İstifa Dilekçesi",
  },
  {
    slug: "santiye-sefi-taahhutnamesi",
    title: "Şantiye Şefi Taahhütnamesi",
  },
  {
    slug: "insaat-ruhsati-dilekcesi",
    title: "İnşaat Ruhsatı Dilekçesi",
  },
  {
    slug: "beton-dokum-tutanagi",
    title: "Beton Döküm Tutanağı",
  },
];

async function main() {
  let browser = null;
  const results = {
    generatedAt: new Date().toISOString(),
    stage: "ASAMA_06",
    documents: [],
  };

  try {
    console.log("🚀 Tarayıcı başlatılıyor (ASAMA_06 — 5 Belge Stüdyosu Doğrulaması)...");
    browser = await chromium.launch({ headless: true });

    for (const doc of DOCUMENTS) {
      console.log(`\n========================================`);
      console.log(`📄 Belge Doğrulanıyor: ${doc.title} (/${doc.slug})`);
      console.log(`========================================`);

      const docResult = {
        slug: doc.slug,
        title: doc.title,
        desktop: null,
        mobile: null,
        passed: false,
      };

      // ----------------------------------------
      // 1. Masaüstü Testi (1920×1080)
      // ----------------------------------------
      {
        const context = await browser.newContext({
          viewport: { width: 1920, height: 1080 },
          deviceScaleFactor: 1,
        });
        const page = await context.newPage();

        try {
          await page.goto(`${BASE_URL}/belgeler/${doc.slug}`, {
            waitUntil: "networkidle",
            timeout: 25000,
          });

          await page.waitForSelector('[data-belge-form-content="true"]', { timeout: 10000 });
          await page.waitForSelector('[data-testid="belge-studio-form-view-trigger"]', { timeout: 5000 });
          await page.waitForSelector('[data-testid="belge-theme-toggle"]', { timeout: 5000 });
          await page.waitForTimeout(500);

          const desktopMetrics = await page.evaluate(() => {
            const formScroll = document.querySelector('[data-testid="belge-studio-form-scroll"]');
            const content = document.querySelector('[data-belge-form-content="true"]');
            const trigger = document.querySelector('[data-testid="belge-studio-form-view-trigger"]');
            const themeToggle = document.querySelector('[data-testid="belge-theme-toggle"]');
            const toolbar = document.querySelector('[data-testid="belge-studio-preview-toolbar"]');

            const trRect = trigger.getBoundingClientRect();
            const thRect = themeToggle.getBoundingClientRect();
            const tRect = toolbar.getBoundingClientRect();

            return {
              formScrollExists: Boolean(formScroll),
              contentWrapperExists: Boolean(content),
              formScrollHeight: formScroll.scrollHeight,
              formClientHeight: formScroll.clientHeight,
              dataScale: content.getAttribute("data-scale"),
              dataDensity: content.getAttribute("data-density"),
              dataMode: content.getAttribute("data-mode"),
              triggerLabel: trigger.innerText.trim(),
              toolbarHeight: tRect.height,
              isLeftOfTheme: trRect.right <= thRect.left + 8,
              isSingleRow: Math.abs(trRect.top - thRect.top) < 10,
            };
          });

          console.log(`   [Masaüstü]`);
          console.log(`   - Form scroll & content wrapper mevcut: ${desktopMetrics.formScrollExists && desktopMetrics.contentWrapperExists}`);
          console.log(`   - Gerçek form yüksekliği (scrollHeight): ${desktopMetrics.formScrollHeight}px (Görünür: ${desktopMetrics.formClientHeight}px)`);
          console.log(`   - Form tetikleyici: "${desktopMetrics.triggerLabel}" (Tema solunda: ${desktopMetrics.isLeftOfTheme}, Tek satır: ${desktopMetrics.isSingleRow})`);

          // Sığdır komutunu test et
          await page.click('[data-testid="belge-studio-form-view-trigger"]');
          await page.waitForSelector('[data-testid="form-view-fit"]', { timeout: 3000 });
          await page.click('[data-testid="form-view-fit"]');
          await page.waitForTimeout(350);

          const fitMetrics = await page.evaluate(() => {
            const content = document.querySelector('[data-belge-form-content="true"]');
            const trigger = document.querySelector('[data-testid="belge-studio-form-view-trigger"]');
            return {
              mode: content.getAttribute("data-mode"),
              fitStatus: content.getAttribute("data-fit-status"),
              scale: parseFloat(content.getAttribute("data-scale") || "1"),
              density: content.getAttribute("data-density"),
              triggerLabel: trigger.innerText.trim(),
            };
          });

          console.log(`   - Sığdır sonrası: mode=${fitMetrics.mode}, status=${fitMetrics.fitStatus}, scale=${fitMetrics.scale}, density=${fitMetrics.density}`);
          console.log(`   - Sığdır etiketi: "${fitMetrics.triggerLabel}"`);

          const desktopScreenshot = path.join(OUTPUT_DIR, `stage06-${doc.slug}-desktop.png`);
          await page.screenshot({ path: desktopScreenshot, fullPage: false });

          // Reset yap ve temizle
          await page.click('[data-testid="belge-studio-form-view-trigger"]');
          await page.waitForSelector('[data-testid="form-view-reset"]', { timeout: 3000 });
          await page.click('[data-testid="form-view-reset"]');
          await page.waitForTimeout(200);

          docResult.desktop = {
            desktopMetrics,
            fitMetrics,
            passed:
              desktopMetrics.formScrollExists &&
              desktopMetrics.contentWrapperExists &&
              desktopMetrics.isLeftOfTheme &&
              desktopMetrics.isSingleRow &&
              fitMetrics.mode === "fit" &&
              (fitMetrics.fitStatus === "fitted" || fitMetrics.fitStatus === "limited"),
          };
        } finally {
          await context.close();
        }
      }

      // ----------------------------------------
      // 2. Mobil Testi (390×844)
      // ----------------------------------------
      {
        const context = await browser.newContext({
          viewport: { width: 390, height: 844 },
          deviceScaleFactor: 2,
          isMobile: true,
          hasTouch: true,
        });
        const page = await context.newPage();

        try {
          await page.goto(`${BASE_URL}/belgeler/${doc.slug}`, {
            waitUntil: "networkidle",
            timeout: 25000,
          });

          await page.waitForSelector('[data-testid="belge-studio-actions"]', { timeout: 10000 });
          await page.waitForTimeout(500);

          // 1. Sekme geçişi: 'Formu Düzenle' / 'Canlı PDF Önizle' butonuna tıkla
          const tabToggleBtn = page.locator('[data-testid="belge-studio-mobile-actions"] button[aria-label="Formu Düzenle"], [data-testid="belge-studio-mobile-actions"] button[aria-label="Canlı PDF Önizle"]').first();
          await tabToggleBtn.waitFor({ state: "visible", timeout: 5000 });
          
          const initialLabel = await tabToggleBtn.getAttribute("aria-label");
          await tabToggleBtn.click();
          await page.waitForTimeout(400);

          const switchedLabel = await tabToggleBtn.getAttribute("aria-label");
          console.log(`   [Mobil]`);
          console.log(`   - Sekme geçişi yapıldı (Önce: "${initialLabel}" -> Sonra: "${switchedLabel}")`);

          // Eğer preview'a geçmişsek tekrar forma dönelim ki form elementlerini test edebilelim
          if (switchedLabel === "Formu Düzenle") {
            await tabToggleBtn.click();
            await page.waitForTimeout(400);
          }

          // 2. Footer'daki 'Diğer belge işlemleri' menüsünü aç
          await page.click('button[aria-label="Diğer belge işlemleri"]');
          await page.waitForSelector('[data-testid="belge-mobile-form-view-trigger"]', { timeout: 3000 });

          // 3. Form Görünümü alt menüsünü tıkla
          await page.click('[data-testid="belge-mobile-form-view-trigger"]');
          await page.waitForSelector('[data-testid="belge-mobile-form-view-fit"]', { timeout: 3000 });
          await page.waitForSelector('[data-testid="belge-mobile-form-scale-90"]', { timeout: 3000 });

          const mobileScreenshot = path.join(OUTPUT_DIR, `stage06-${doc.slug}-mobile.png`);
          await page.screenshot({ path: mobileScreenshot, fullPage: false });

          // 4. Mobilde %90 tıkla
          await page.click('[data-testid="belge-mobile-form-scale-90"]');
          await page.waitForTimeout(300);

          const mobileScale = await page.evaluate(() => {
            const content = document.querySelector('[data-belge-form-content="true"]');
            return content?.getAttribute("data-scale");
          });
          console.log(`   - Mobilde Form Görünümü menüsü çalıştı, %90 uygulandı: ${mobileScale === "0.9"}`);

          docResult.mobile = {
            initialLabel,
            switchedLabel,
            tabSwitchPassed: initialLabel !== switchedLabel,
            mobileScaleApplied: mobileScale,
            passed: Boolean(initialLabel && switchedLabel && initialLabel !== switchedLabel && mobileScale === "0.9"),
          };
        } finally {
          await context.close();
        }
      }

      docResult.passed = docResult.desktop?.passed && docResult.mobile?.passed;
      results.documents.push(docResult);
      console.log(`🏁 ${doc.title} Doğrulama: ${docResult.passed ? "✅ BAŞARILI" : "❌ BAŞARISIZ"}`);
    }

    const allPassed = results.documents.every((d) => d.passed);
    results.allPassed = allPassed;

    const jsonPath = path.join(OUTPUT_DIR, "stage06-metrics.json");
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf-8");
    console.log(`\n📊 Sonuçlar kaydedildi: ${jsonPath}`);
    console.log(`🏁 ASAMA_06 (5/5 Belge) Genel Durumu: ${allPassed ? "✅ TÜM BELGELER BAŞARILI" : "❌ BAZI BELGELER BAŞARISIZ"}`);

    if (!allPassed) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Hata oluştu:", error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();
