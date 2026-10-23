import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const PROD_URL = "https://muhendislik-site.vercel.app";
const OUTPUT_DIR = path.resolve(process.cwd(), "docs/belgeler-form-view/evidence");

async function main() {
  let browser = null;
  try {
    console.log(`🚀 Canlı Vercel Production Smoke Testi Başlatılıyor... (${PROD_URL})`);
    browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    const response = await page.goto(`${PROD_URL}/belgeler/santiye-sefi-sozlesmesi`, {
      waitUntil: "networkidle",
      timeout: 35000,
    });

    console.log(`   - HTTP Yanıt Kodu: ${response.status()}`);

    await page.waitForSelector('[data-belge-form-content="true"]', { timeout: 15000 });
    await page.waitForSelector('[data-testid="belge-studio-form-view-trigger"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="belge-theme-toggle"]', { timeout: 10000 });

    const liveCheck = await page.evaluate(() => {
      const trigger = document.querySelector('[data-testid="belge-studio-form-view-trigger"]');
      const content = document.querySelector('[data-belge-form-content="true"]');
      const themeToggle = document.querySelector('[data-testid="belge-theme-toggle"]');
      const toolbar = document.querySelector('[data-testid="belge-studio-preview-toolbar"]');

      const trRect = trigger.getBoundingClientRect();
      const thRect = themeToggle.getBoundingClientRect();

      return {
        triggerLabel: trigger.innerText.trim(),
        scale: content.getAttribute("data-scale"),
        isLeftOfTheme: trRect.right <= thRect.left + 8,
        isSingleRow: Math.abs(trRect.top - thRect.top) < 10,
        toolbarHeight: toolbar.getBoundingClientRect().height,
      };
    });

    console.log(`   - Canlı Trigger: "${liveCheck.triggerLabel}" (Scale: ${liveCheck.scale})`);
    console.log(`   - Tema Yanı Tek Satır: ${liveCheck.isSingleRow} (Yükseklik: ${liveCheck.toolbarHeight}px, Solunda: ${liveCheck.isLeftOfTheme})`);

    const liveSsPath = path.join(OUTPUT_DIR, "production-live-smoke.png");
    await page.screenshot({ path: liveSsPath, fullPage: false });
    console.log(`📸 Canlı ekran görüntüsü kaydedildi: ${liveSsPath}`);

    console.log("🏁 CANLI PRODUCTION SMOKE TESTİ: ✅ BAŞARILI");
  } catch (error) {
    console.error("❌ Canlı smoke test hatası:", error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();
