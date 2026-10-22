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
    stage: "ASAMA_04",
    scenarios: [],
  };

  try {
    console.log("🚀 Tarayıcı başlatılıyor (ASAMA_04 Fit ve İki Eksenli Ölçüm Doğrulaması)...");
    browser = await chromium.launch({ headless: true });

    // Senaryo 1: 1920×1080 (Büyük Ekran — Doğal Sığma ve Güvenli Büyütme)
    console.log("\n🔍 Senaryo 1: 1920×1080 Ekran — Fit ile Doğal Sığma ve Üst Sınır (%115)...");
    {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/belgeler/santiye-sefi-sozlesmesi`, {
          waitUntil: "networkidle",
          timeout: 25000,
        });

        await page.waitForSelector('[data-belge-form-content="true"]', { timeout: 10000 });
        await page.waitForTimeout(600);

        // Fit komutu gönder
        const fitResult = await page.evaluate(async () => {
          window.dispatchEvent(
            new CustomEvent("belge-form-view:command", { detail: { command: "fit" } })
          );
          // rAF ve React render'ını bekle
          await new Promise((r) => setTimeout(r, 200));

          const form = document.querySelector('[data-testid="belge-studio-form-scroll"]');
          const content = document.querySelector('[data-belge-form-content="true"]');
          const firstCard = form.querySelector('.rounded-lg');
          const lastCard = document.querySelector('#sozlesme-muteahhit_imza_unvan')?.closest('.rounded-lg');

          const formRect = form.getBoundingClientRect();
          const firstRect = firstCard.getBoundingClientRect();
          const lastRect = lastCard.getBoundingClientRect();

          const appliedScale = parseFloat(content.getAttribute("data-scale") || "1");
          const fitStatus = content.getAttribute("data-fit-status");
          const density = content.getAttribute("data-density");

          const isFittedOnBothAxes =
            form.scrollWidth <= form.clientWidth + 2 &&
            form.scrollHeight <= form.clientHeight + 2 &&
            lastRect.bottom <= formRect.bottom + 2 &&
            firstRect.top >= formRect.top - 2;

          return {
            fitStatus,
            appliedScale,
            density,
            clientWidth: form.clientWidth,
            clientHeight: form.clientHeight,
            scrollWidth: form.scrollWidth,
            scrollHeight: form.scrollHeight,
            isFittedOnBothAxes,
            notExceedingMaxScale: appliedScale <= 1.15 + 0.01,
          };
        });

        await page.screenshot({ path: path.join(OUTPUT_DIR, "stage04_sozlesme_1920_fitted.png") });

        const pass = fitResult.fitStatus === "fitted" && fitResult.isFittedOnBothAxes && fitResult.notExceedingMaxScale;
        results.scenarios.push({
          scenario: "1920x1080_fit_success",
          fitResult,
          pass,
        });

        console.log(`  📊 1920 Fit: Status=${fitResult.fitStatus}, Scale=${fitResult.appliedScale}, Sığdı mı=${fitResult.isFittedOnBothAxes ? "EVET (PASS)" : "HAYIR"}, Max %115 Korundu mu=${fitResult.notExceedingMaxScale ? "EVET (PASS)" : "HAYIR"}`);

      } finally {
        await context.close();
      }
    }

    // Senaryo 2: 1366×768 Standart Laptop — İki Eksenli Tam Sığma
    console.log("\n🔍 Senaryo 2: 1366×768 Standart Laptop — Kompakt/Fit İle Tam Sığma...");
    {
      const context = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/belgeler/santiye-sefi-sozlesmesi`, {
          waitUntil: "networkidle",
          timeout: 25000,
        });

        await page.waitForSelector('[data-belge-form-content="true"]', { timeout: 10000 });
        await page.waitForTimeout(600);

        const fitResult = await page.evaluate(async () => {
          window.dispatchEvent(
            new CustomEvent("belge-form-view:command", { detail: { command: "fit" } })
          );
          await new Promise((r) => setTimeout(r, 200));

          const form = document.querySelector('[data-testid="belge-studio-form-scroll"]');
          const content = document.querySelector('[data-belge-form-content="true"]');
          const lastCard = document.querySelector('#sozlesme-muteahhit_imza_unvan')?.closest('.rounded-lg');
          const firstCard = form.querySelector('.rounded-lg');

          const formRect = form.getBoundingClientRect();
          const firstRect = firstCard.getBoundingClientRect();
          const lastRect = lastCard.getBoundingClientRect();

          const appliedScale = parseFloat(content.getAttribute("data-scale") || "1");
          const fitStatus = content.getAttribute("data-fit-status");
          const density = content.getAttribute("data-density");

          const isFitted =
            form.scrollWidth <= form.clientWidth + 2 &&
            form.scrollHeight <= form.clientHeight + 2 &&
            lastRect.bottom <= formRect.bottom + 2 &&
            firstRect.top >= formRect.top - 2;

          return {
            fitStatus,
            appliedScale,
            density,
            scrollH: form.scrollHeight,
            clientH: form.clientHeight,
            isFitted,
            lastCardVisibleWithoutScroll: lastRect.bottom <= formRect.bottom + 2,
          };
        });

        await page.screenshot({ path: path.join(OUTPUT_DIR, "stage04_sozlesme_1366_fitted.png") });

        const pass = fitResult.fitStatus === "fitted" && fitResult.isFitted;
        results.scenarios.push({
          scenario: "1366x768_laptop_fit",
          fitResult,
          pass,
        });

        console.log(`  📊 1366 Fit: Status=${fitResult.fitStatus}, Scale=${fitResult.appliedScale}, Density=${fitResult.density}, Sığdı mı=${fitResult.isFitted ? "EVET (PASS)" : "HAYIR"}`);

      } finally {
        await context.close();
      }
    }

    // Senaryo 3: 1280×720 (Chrome %150 Zoom) — Dürüst Limited ve Erişilebilir Scroll
    console.log("\n🔍 Senaryo 3: 1280×720 (Chrome %150 Zoom) — Dürüst Limited ve Erişilebilir Kaydırma...");
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1.5,
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/belgeler/santiye-sefi-sozlesmesi`, {
          waitUntil: "networkidle",
          timeout: 25000,
        });

        await page.waitForSelector('[data-belge-form-content="true"]', { timeout: 10000 });
        await page.waitForTimeout(600);

        const limitedResult = await page.evaluate(async () => {
          window.dispatchEvent(
            new CustomEvent("belge-form-view:command", { detail: { command: "fit" } })
          );
          await new Promise((r) => setTimeout(r, 200));

          const form = document.querySelector('[data-testid="belge-studio-form-scroll"]');
          const content = document.querySelector('[data-belge-form-content="true"]');

          const fitStatus = content.getAttribute("data-fit-status");
          const appliedScale = parseFloat(content.getAttribute("data-scale") || "1");
          const density = content.getAttribute("data-density");

          // Formu en aşağı kaydır ve son alanın tam erişilebilir olduğunu doğrula
          form.scrollTop = form.scrollHeight;
          await new Promise((r) => setTimeout(r, 100));

          const lastCard = document.querySelector('#sozlesme-muteahhit_imza_unvan')?.closest('.rounded-lg');
          const formRect = form.getBoundingClientRect();
          const lastRect = lastCard ? lastCard.getBoundingClientRect() : null;

          const lastCardAccessibleWithScroll = lastRect
            ? lastRect.bottom <= formRect.bottom + 5 && lastRect.top >= formRect.top
            : false;

          return {
            fitStatus,
            appliedScale,
            density,
            isHonestLimited: fitStatus === "limited",
            safeNormalScaleKept: appliedScale === 1.0,
            compactSelected: density === "compact",
            lastCardAccessibleWithScroll,
          };
        });

        await page.screenshot({ path: path.join(OUTPUT_DIR, "stage04_sozlesme_1280_honest_limited.png") });

        const pass = limitedResult.isHonestLimited && limitedResult.safeNormalScaleKept && limitedResult.lastCardAccessibleWithScroll;
        results.scenarios.push({
          scenario: "1280x720_zoom150_honest_limited",
          limitedResult,
          pass,
        });

        console.log(`  📊 1280 %150: Dürüst Limited mi? ${limitedResult.isHonestLimited ? "EVET (PASS)" : "HAYIR"}, Güvenli %100 korundu mu? ${limitedResult.safeNormalScaleKept ? "EVET" : "HAYIR"}, Son alan scroll ile erişilebilir mi? ${limitedResult.lastCardAccessibleWithScroll ? "EVET (PASS)" : "HAYIR"}`);

      } finally {
        await context.close();
      }
    }

    // Senaryo 4: Scroll Tuzağı Koruması (scrollTop > 0 iken Fit tetikleme)
    console.log("\n🔍 Senaryo 4: Form Aşağı Kaydırılmışken Fit Tetikleme (Scroll Tuzağı Koruması)...");
    {
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/belgeler/santiye-sefi-sozlesmesi`, {
          waitUntil: "networkidle",
          timeout: 25000,
        });

        await page.waitForSelector('[data-belge-form-content="true"]', { timeout: 10000 });
        await page.waitForTimeout(600);

        const scrollTrapResult = await page.evaluate(async () => {
          const form = document.querySelector('[data-testid="belge-studio-form-scroll"]');
          const content = document.querySelector('[data-belge-form-content="true"]');

          // Formu bilerek 150px aşağı kaydır
          form.scrollTop = 150;
          await new Promise((r) => setTimeout(r, 50));

          // Fit komutu gönder
          window.dispatchEvent(
            new CustomEvent("belge-form-view:command", { detail: { command: "fit" } })
          );
          await new Promise((r) => setTimeout(r, 200));

          const fitStatus = content.getAttribute("data-fit-status");

          return {
            fitStatus,
            notFalseFailed: fitStatus === "fitted",
          };
        });

        const pass = scrollTrapResult.notFalseFailed;
        results.scenarios.push({
          scenario: "scroll_trap_resilience",
          scrollTrapResult,
          pass,
        });

        console.log(`  📊 Scroll Tuzağı: Status=${scrollTrapResult.fitStatus}, Yanlış fail engellendi mi: ${scrollTrapResult.notFalseFailed ? "EVET (PASS)" : "HAYIR"}`);

      } finally {
        await context.close();
      }
    }

    // Senaryo 5: 10 Kez Hızlı Resize / Loop Koruması
    console.log("\n🔍 Senaryo 5: 10 Kez Hızlı Resize — Observer Loop Koruması...");
    {
      const context = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/belgeler/santiye-sefi-sozlesmesi`, {
          waitUntil: "networkidle",
          timeout: 25000,
        });

        await page.waitForSelector('[data-belge-form-content="true"]', { timeout: 10000 });
        await page.waitForTimeout(600);

        // Fit modunu aç
        await page.evaluate(() => {
          window.dispatchEvent(
            new CustomEvent("belge-form-view:command", { detail: { command: "fit" } })
          );
        });
        await page.waitForTimeout(200);

        // 10 kez hızlı resize dispatch et
        const loopResult = await page.evaluate(async () => {
          let errorCount = 0;
          window.addEventListener("error", () => errorCount++);

          for (let i = 0; i < 10; i++) {
            window.dispatchEvent(new Event("resize"));
            await new Promise((r) => setTimeout(r, 15));
          }

          await new Promise((r) => setTimeout(r, 200));

          const content = document.querySelector('[data-belge-form-content="true"]');
          return {
            errorCount,
            finalStatus: content ? content.getAttribute("data-fit-status") : null,
            stable: Boolean(content && content.getAttribute("data-scale")),
          };
        });

        const pass = loopResult.errorCount === 0 && loopResult.stable;
        results.scenarios.push({
          scenario: "resize_loop_resilience",
          loopResult,
          pass,
        });

        console.log(`  📊 Loop Koruması: Hata sayısı=${loopResult.errorCount}, Kararlı mı=${loopResult.stable ? "EVET (PASS)" : "HAYIR"}`);

      } finally {
        await context.close();
      }
    }

    const jsonPath = path.join(OUTPUT_DIR, "stage04-metrics.json");
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf-8");
    console.log(`\n✅ ASAMA_04 doğrulama sonuçları kaydedildi: ${jsonPath}`);

    const allPassed = results.scenarios.every((s) => s.pass);
    if (allPassed) {
      console.log("🎉 TÜM ASAMA_04 KABUL TESTLERİ BAŞARIYLA GEÇTİ!");
    } else {
      console.error("❌ BAZI ASAMA_04 TESTLERİ BAŞARISIZ OLDU!");
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
