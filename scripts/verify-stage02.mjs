import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const PORT = 3005;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUTPUT_DIR = path.resolve(process.cwd(), "docs/belgeler-form-view/evidence");

const TEST_VIEWPORTS = [
  { name: "1920x1080_desktop", label: "1920×1080 Standart Masaüstü", width: 1920, height: 1080, dpr: 1 },
  { name: "1366x768_laptop",    label: "1366×768 Standart Laptop", width: 1366, height: 768, dpr: 1 },
  { name: "1280x720_zoom150",   label: "1280×720 (1920 %150 Zoom)", width: 1280, height: 720, dpr: 1.5 },
  { name: "1093x615_zoom150",   label: "1093×615 (1640 %150 Zoom - Referans)", width: 1093, height: 615, dpr: 1.5 },
  { name: "1024x768_lg_boundary", label: "1024×768 (Tam lg Eşiği)", width: 1024, height: 768, dpr: 1 },
  { name: "911x512_laptop_zoom150", label: "911×512 (1366 %150 Zoom - Mobil Tab)", width: 911, height: 512, dpr: 1.5 },
];

async function main() {
  let browser = null;
  const results = {
    generatedAt: new Date().toISOString(),
    stage: "ASAMA_02",
    viewportVerifications: [],
  };

  try {
    console.log("🚀 Tarayıcı başlatılıyor (ASAMA_02 Doğrulaması)...");
    browser = await chromium.launch({ headless: true });

    for (const vp of TEST_VIEWPORTS) {
      console.log(`🔍 Test ediliyor: ${vp.label} (${vp.width}x${vp.height})...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.dpr,
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/belgeler/santiye-sefi-sozlesmesi`, {
          waitUntil: "networkidle",
          timeout: 25000,
        });

        await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { state: "attached", timeout: 10000 });
        await page.waitForTimeout(800);

        const isLgUp = vp.width >= 1024;
        let activeTab = "preview";
        if (!isLgUp) {
          const formTabBtn = page.locator('button:has-text("Formu Düzenle"), [role="tab"]:has-text("Form")').first();
          if ((await formTabBtn.count()) > 0) {
            await formTabBtn.click();
            await page.waitForTimeout(300);
            activeTab = "form";
          }
        }

        const metrics = await page.evaluate((isLg) => {
          const form = document.querySelector('[data-testid="belge-studio-form-scroll"]');
          const preview = document.querySelector('.belge-preview-panel');
          const toolbar = document.querySelector('[data-testid="belge-studio-preview-toolbar"]');
          
          const formRect = form ? form.getBoundingClientRect() : null;
          const previewRect = preview ? preview.getBoundingClientRect() : null;
          
          // Form içindeki inputlar form dışına taşıyor mu?
          const inputs = form ? Array.from(form.querySelectorAll('input, select, textarea')) : [];
          let maxInputRight = 0;
          let anyInputOverflows = false;
          
          if (formRect) {
            for (const input of inputs) {
              const r = input.getBoundingClientRect();
              if (r.right > formRect.right + 2) {
                anyInputOverflows = true;
              }
              if (r.right > maxInputRight) maxInputRight = r.right;
            }
          }

          // Son elemanın scroll edilebilirliği
          const formCards = form ? Array.from(form.children).filter(el => el.classList.contains('rounded-lg') || el.tagName === 'DIV') : [];
          const lastCard = formCards[formCards.length - 1];
          const lastCardRect = lastCard ? lastCard.getBoundingClientRect() : null;

          return {
            isLgUp: isLg,
            form: {
              clientWidth: form ? form.clientWidth : 0,
              clientHeight: form ? form.clientHeight : 0,
              scrollWidth: form ? form.scrollWidth : 0,
              scrollHeight: form ? form.scrollHeight : 0,
              hasHorizontalOverflow: form ? form.scrollWidth > form.clientWidth + 1 : false,
              anyInputOverflows,
              maxInputRight,
              formRight: formRect ? formRect.right : 0,
            },
            preview: {
              clientWidth: preview ? preview.clientWidth : 0,
              clientHeight: preview ? preview.clientHeight : 0,
              isAvailable: preview ? preview.clientWidth >= 380 : false,
            },
            toolbar: {
              clientWidth: toolbar ? toolbar.clientWidth : 0,
              scrollWidth: toolbar ? toolbar.scrollWidth : 0,
              hasHorizontalOverflow: toolbar ? toolbar.scrollWidth > toolbar.clientWidth + 1 : false,
            },
            lastCard: {
              exists: Boolean(lastCard),
              bottomOffset: (lastCardRect && formRect) ? Math.round(lastCardRect.bottom - formRect.bottom) : null,
            }
          };
        }, isLgUp);

        // Ekran görüntüsü al
        const screenshotName = `stage02_${vp.name}.png`;
        const screenshotPath = path.join(OUTPUT_DIR, screenshotName);
        await page.screenshot({ path: screenshotPath, fullPage: false });

        results.viewportVerifications.push({
          viewport: vp,
          metrics,
          screenshot: screenshotName,
          pass: !metrics.form.hasHorizontalOverflow && !metrics.form.anyInputOverflows,
        });

        console.log(`  📊 Form W: ${metrics.form.clientWidth}px (scrollW: ${metrics.form.scrollWidth}px), Preview W: ${metrics.preview.clientWidth}px, Yatay Taşma: ${metrics.form.hasHorizontalOverflow ? "VAR (FAIL)" : "YOK (PASS)"}`);

      } finally {
        await context.close();
      }
    }

    const jsonPath = path.join(OUTPUT_DIR, "stage02-metrics.json");
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf-8");
    console.log(`✅ Doğrulama tamamlandı: ${jsonPath}`);

    const allPassed = results.viewportVerifications.every(v => v.pass);
    if (allPassed) {
      console.log("🎉 TÜM ASAMA_02 KABUL TESTLERİ BAŞARIYLA GEÇTİ!");
    } else {
      console.error("❌ BAZI EKRANLARDA YATAY TAŞMA TESPİT EDİLDİ!");
      process.exitCode = 1;
    }

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
