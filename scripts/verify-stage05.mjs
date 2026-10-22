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
    stage: "ASAMA_05",
    scenarios: [],
  };

  try {
    console.log("🚀 Tarayıcı başlatılıyor (ASAMA_05 Görsel Menü ve UX Doğrulaması)...");
    browser = await chromium.launch({ headless: true });

    // ==========================================
    // Senaryo 1: 1920×1080 — Masaüstü Toolbar ve Form Görünüm Menüsü
    // ==========================================
    console.log("\n🔍 Senaryo 1: 1920×1080 — Toolbar Yerleşimi, Tema Yanı Menü ve Dropdown Yapısı...");
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
        await page.waitForSelector('[data-testid="belge-studio-form-view-trigger"]', { timeout: 5000 });
        await page.waitForSelector('[data-testid="belge-theme-toggle"]', { timeout: 5000 });
        await page.waitForTimeout(500);

        // 1. Toolbar yüksekliği ve öğelerin yatayda tek satırda dizilmesi kontrolü
        const toolbarMetrics = await page.evaluate(() => {
          const toolbar = document.querySelector('[data-testid="belge-studio-preview-toolbar"]');
          const trigger = document.querySelector('[data-testid="belge-studio-form-view-trigger"]');
          const themeToggle = document.querySelector('[data-testid="belge-theme-toggle"]');
          const zoomControls = document.querySelector('.belge-preview-zoom');

          const tRect = toolbar.getBoundingClientRect();
          const trRect = trigger.getBoundingClientRect();
          const thRect = themeToggle.getBoundingClientRect();
          const zRect = zoomControls.getBoundingClientRect();

          // Tema butonunun solunda mı?
          const isLeftOfTheme = trRect.right <= thRect.left + 8; // gap toleransı
          // Dikeyde aynı hizada mı (tek satır)?
          const isSingleRow = Math.abs(trRect.top - thRect.top) < 10 && Math.abs(zRect.top - trRect.top) < 15;

          return {
            toolbarHeight: tRect.height,
            triggerLabel: trigger.innerText.trim(),
            isLeftOfTheme,
            isSingleRow,
            triggerRect: { top: trRect.top, left: trRect.left, width: trRect.width, height: trRect.height },
            themeRect: { top: thRect.top, left: thRect.left, width: thRect.width, height: thRect.height },
          };
        });

        console.log(`   - Toolbar tek satır mı: ${toolbarMetrics.isSingleRow} (Yükseklik: ${toolbarMetrics.toolbarHeight}px)`);
        console.log(`   - Form trigger etiketi: "${toolbarMetrics.triggerLabel}"`);
        console.log(`   - Form butonu tema butonunun hemen solunda mı: ${toolbarMetrics.isLeftOfTheme}`);

        // 2. Menüyü tıkla ve aç
        await page.click('[data-testid="belge-studio-form-view-trigger"]');
        await page.waitForSelector('[data-testid="belge-studio-form-view-menu"]', { timeout: 3000 });
        await page.waitForTimeout(200);

        // 3. Menü içeriğini ve aria-checked durumlarını doğrula
        const menuDetails = await page.evaluate(() => {
          const menu = document.querySelector('[data-testid="belge-studio-form-view-menu"]');
          const scale90 = document.querySelector('[data-testid="form-view-scale-90"]');
          const scale100 = document.querySelector('[data-testid="form-view-scale-100"]');
          const scale110 = document.querySelector('[data-testid="form-view-scale-110"]');
          const scale125 = document.querySelector('[data-testid="form-view-scale-125"]');
          const fitItem = document.querySelector('[data-testid="form-view-fit"]');
          const compactItem = document.querySelector('[data-testid="form-view-compact"]');
          const resetItem = document.querySelector('[data-testid="form-view-reset"]');

          return {
            menuExists: Boolean(menu),
            hasAllPresets: Boolean(scale90 && scale100 && scale110 && scale125),
            scale100Checked: scale100?.getAttribute("aria-checked") === "true",
            scale110Checked: scale110?.getAttribute("aria-checked") === "true",
            fitChecked: fitItem?.getAttribute("aria-checked") === "true",
            compactChecked: compactItem?.getAttribute("aria-checked") === "true",
            resetExists: Boolean(resetItem),
          };
        });

        console.log(`   - Menü açıldı mı: ${menuDetails.menuExists}`);
        console.log(`   - 4 preset mevcut mu: ${menuDetails.hasAllPresets}`);
        console.log(`   - Varsayılan %100 seçili mi: ${menuDetails.scale100Checked}`);

        const ssPath = path.join(OUTPUT_DIR, "stage05-desktop-menu-open.png");
        await page.screenshot({ path: ssPath, fullPage: false });

        results.scenarios.push({
          scenario: "desktop_toolbar_and_menu",
          toolbarMetrics,
          menuDetails,
          passed: toolbarMetrics.isSingleRow && toolbarMetrics.isLeftOfTheme && menuDetails.hasAllPresets && menuDetails.scale100Checked,
        });
      } finally {
        await context.close();
      }
    }

    // ==========================================
    // Senaryo 2: Manuel Preset (%110) ve Kompakt Mod Geçişi + LocalStorage v3
    // ==========================================
    console.log("\n🔍 Senaryo 2: Manuel Preset (%110) Seçimi, Kompakt Mod ve LocalStorage v3 Kaydı...");
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
        await page.waitForSelector('[data-testid="belge-studio-form-view-trigger"]', { timeout: 10000 });

        // Menüyü aç ve %110 seç
        await page.click('[data-testid="belge-studio-form-view-trigger"]');
        await page.waitForSelector('[data-testid="form-view-scale-110"]', { timeout: 3000 });
        await page.click('[data-testid="form-view-scale-110"]');
        await page.waitForTimeout(300);

        // Menüyü tekrar aç ve Kompakt mod seç
        await page.click('[data-testid="belge-studio-form-view-trigger"]');
        await page.waitForSelector('[data-testid="form-view-compact"]', { timeout: 3000 });
        await page.click('[data-testid="form-view-compact"]');
        await page.waitForTimeout(300);

        // DOM ve localStorage kontrolü
        const stateCheck = await page.evaluate(() => {
          const content = document.querySelector('[data-belge-form-content="true"]');
          const trigger = document.querySelector('[data-testid="belge-studio-form-view-trigger"]');
          const rawStorage = localStorage.getItem("belge-studio:form-view:v3");
          let parsedStorage = null;
          try {
            parsedStorage = JSON.parse(rawStorage);
          } catch {}

          return {
            scale: content?.getAttribute("data-scale"),
            density: content?.getAttribute("data-density"),
            mode: content?.getAttribute("data-mode"),
            triggerText: trigger?.innerText.trim(),
            storage: parsedStorage,
          };
        });

        console.log(`   - DOM data-scale: ${stateCheck.scale}`);
        console.log(`   - DOM data-density: ${stateCheck.density}`);
        console.log(`   - Trigger metni: "${stateCheck.triggerText}"`);
        console.log(`   - LocalStorage v3 kaydı:`, JSON.stringify(stateCheck.storage));

        const passed =
          stateCheck.scale === "1.1" &&
          stateCheck.density === "compact" &&
          stateCheck.storage?.version === 3 &&
          stateCheck.storage?.manualScale === 1.1 &&
          stateCheck.storage?.manualDensity === "compact";

        results.scenarios.push({
          scenario: "manual_scale_and_compact_storage",
          stateCheck,
          passed,
        });
      } finally {
        await context.close();
      }
    }

    // ==========================================
    // Senaryo 3: "Formu Tam Sığdır" ve "Varsayılana Dön"
    // ==========================================
    console.log("\n🔍 Senaryo 3: 'Formu Tam Sığdır' ve 'Varsayılana Dön' Menü Eylemleri...");
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
        await page.waitForSelector('[data-testid="belge-studio-form-view-trigger"]', { timeout: 10000 });

        // 1. Sığdır'a tıkla
        await page.click('[data-testid="belge-studio-form-view-trigger"]');
        await page.waitForSelector('[data-testid="form-view-fit"]', { timeout: 3000 });
        await page.click('[data-testid="form-view-fit"]');
        await page.waitForTimeout(300);

        const fitState = await page.evaluate(() => {
          const content = document.querySelector('[data-belge-form-content="true"]');
          const trigger = document.querySelector('[data-testid="belge-studio-form-view-trigger"]');
          return {
            mode: content?.getAttribute("data-mode"),
            fitStatus: content?.getAttribute("data-fit-status"),
            scale: content?.getAttribute("data-scale"),
            triggerText: trigger?.innerText.trim(),
          };
        });
        console.log(`   - Sığdır sonrası mode: ${fitState.mode}, fitStatus: ${fitState.fitStatus}, scale: ${fitState.scale}`);
        console.log(`   - Sığdır sonrası trigger: "${fitState.triggerText}"`);

        // 2. Varsayılana dön'e tıkla
        await page.click('[data-testid="belge-studio-form-view-trigger"]');
        await page.waitForSelector('[data-testid="form-view-reset"]', { timeout: 3000 });
        await page.click('[data-testid="form-view-reset"]');
        await page.waitForTimeout(300);

        const resetState = await page.evaluate(() => {
          const content = document.querySelector('[data-belge-form-content="true"]');
          const trigger = document.querySelector('[data-testid="belge-studio-form-view-trigger"]');
          return {
            mode: content?.getAttribute("data-mode"),
            density: content?.getAttribute("data-density"),
            scale: content?.getAttribute("data-scale"),
            triggerText: trigger?.innerText.trim(),
          };
        });
        console.log(`   - Reset sonrası mode: ${resetState.mode}, scale: ${resetState.scale}, density: ${resetState.density}`);

        const passed =
          fitState.mode === "fit" &&
          (fitState.fitStatus === "fitted" || fitState.fitStatus === "limited") &&
          resetState.mode === "manual" &&
          resetState.scale === "1" &&
          resetState.density === "normal";

        results.scenarios.push({
          scenario: "fit_and_reset_actions",
          fitState,
          resetState,
          passed,
        });
      } finally {
        await context.close();
      }
    }

    // ==========================================
    // Senaryo 4: Klavye / a11y (Escape) ve Tema Değiştirici Bağımsızlığı
    // ==========================================
    console.log("\n🔍 Senaryo 4: Klavye Erişilebilirliği (Escape ile Menü Kapanması) ve Tema Geçişi...");
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
        await page.waitForSelector('[data-testid="belge-studio-form-view-trigger"]', { timeout: 10000 });

        // 1. Menüyü aç ve Escape bas
        await page.click('[data-testid="belge-studio-form-view-trigger"]');
        await page.waitForSelector('[data-testid="belge-studio-form-view-menu"]', { timeout: 3000 });

        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);

        const menuClosed = await page.evaluate(() => {
          return document.querySelector('[data-testid="belge-studio-form-view-menu"]') === null;
        });
        console.log(`   - Escape basılınca menü kapandı mı: ${menuClosed}`);

        // 2. Tema düğmesine tıkla ve dark moda geç
        const initialDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
        await page.click('[data-testid="belge-theme-toggle"]');
        await page.waitForTimeout(300);
        const switchedDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
        console.log(`   - Tema değişti mi (önce: ${initialDark}, sonra: ${switchedDark})`);

        // Tekrar tıkla geri dön
        await page.click('[data-testid="belge-theme-toggle"]');
        await page.waitForTimeout(300);

        const passed = menuClosed && initialDark !== switchedDark;

        results.scenarios.push({
          scenario: "keyboard_a11y_and_theme_independence",
          menuClosed,
          themeSwitched: initialDark !== switchedDark,
          passed,
        });
      } finally {
        await context.close();
      }
    }

    // ==========================================
    // Senaryo 5: 1366×768 Laptop Ekranı — Toolbar Taşmama ve Menü Görünürlüğü
    // ==========================================
    console.log("\n🔍 Senaryo 5: 1366×768 Laptop Ekranı — Toolbar Tek Satır ve Menü Sınırları...");
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
        await page.waitForSelector('[data-testid="belge-studio-form-view-trigger"]', { timeout: 10000 });
        await page.waitForTimeout(500);

        const layoutCheck = await page.evaluate(() => {
          const toolbar = document.querySelector('[data-testid="belge-studio-preview-toolbar"]');
          const trigger = document.querySelector('[data-testid="belge-studio-form-view-trigger"]');
          const themeToggle = document.querySelector('[data-testid="belge-theme-toggle"]');

          const tRect = toolbar.getBoundingClientRect();
          const trRect = trigger.getBoundingClientRect();
          const thRect = themeToggle.getBoundingClientRect();

          return {
            toolbarHeight: tRect.height,
            isSingleRow: Math.abs(trRect.top - thRect.top) < 10,
            hasHorizontalOverflow: toolbar.scrollWidth > toolbar.clientWidth,
          };
        });

        console.log(`   - 1366'da toolbar tek satır mı: ${layoutCheck.isSingleRow} (Yükseklik: ${layoutCheck.toolbarHeight}px)`);
        console.log(`   - Toolbar yatay taşma var mı: ${layoutCheck.hasHorizontalOverflow}`);

        // Menüyü aç ve ekran sınırları içinde kaldığını doğrula
        await page.click('[data-testid="belge-studio-form-view-trigger"]');
        await page.waitForSelector('[data-testid="belge-studio-form-view-menu"]', { timeout: 3000 });

        const menuBounds = await page.evaluate(() => {
          const menu = document.querySelector('[data-testid="belge-studio-form-view-menu"]');
          const rect = menu.getBoundingClientRect();
          return {
            fitsInWindow: rect.left >= 0 && rect.right <= window.innerWidth && rect.bottom <= window.innerHeight,
            rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
          };
        });

        console.log(`   - Menü pencere sınırları içinde mi: ${menuBounds.fitsInWindow}`);

        const ssPath = path.join(OUTPUT_DIR, "stage05-laptop-menu-open.png");
        await page.screenshot({ path: ssPath, fullPage: false });

        const passed = layoutCheck.isSingleRow && !layoutCheck.hasHorizontalOverflow && menuBounds.fitsInWindow;

        results.scenarios.push({
          scenario: "laptop_1366_toolbar_and_menu",
          layoutCheck,
          menuBounds,
          passed,
        });
      } finally {
        await context.close();
      }
    }

    // ==========================================
    // Senaryo 6: Mobil Mod (390×844) — Footer 'Diğer Belge İşlemleri' Menüsü
    // ==========================================
    console.log("\n🔍 Senaryo 6: Mobil Mod (390×844) — Alt Eylemler ve Form Görünüm Menüsü...");
    {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();

      try {
        await page.goto(`${BASE_URL}/belgeler/santiye-sefi-sozlesmesi`, {
          waitUntil: "networkidle",
          timeout: 25000,
        });
        await page.waitForSelector('[data-testid="belge-studio-actions"]', { timeout: 10000 });
        await page.waitForTimeout(500);

        // 1. Mobilde toolbar'daki masaüstü form view butonu görünmez olmalı (hidden)
        const desktopTriggerVisible = await page.evaluate(() => {
          const trigger = document.querySelector('[data-testid="belge-studio-form-view-trigger"]');
          if (!trigger) return false;
          const rect = trigger.getBoundingClientRect();
          const style = window.getComputedStyle(trigger.closest('.belge-preview-utilities') || trigger);
          return style.display !== 'none' && rect.width > 0 && rect.height > 0;
        });
        console.log(`   - Masaüstü toolbar menüsü mobilde gizli mi: ${!desktopTriggerVisible}`);

        // 2. Footer'daki Diğer butonuna tıkla
        await page.click('button[aria-label="Diğer belge işlemleri"]');
        await page.waitForSelector('[data-testid="belge-mobile-form-view-trigger"]', { timeout: 3000 });
        console.log("   - Mobil 'Diğer belge işlemleri' menüsü açıldı, 'Form Görünümü' tetikleyicisi mevcut.");

        // 3. Form Görünümü alt menüsünü tıkla
        await page.click('[data-testid="belge-mobile-form-view-trigger"]');
        await page.waitForSelector('[data-testid="belge-mobile-form-view-fit"]', { timeout: 3000 });
        await page.waitForSelector('[data-testid="belge-mobile-form-scale-90"]', { timeout: 3000 });
        console.log("   - Mobil alt menü açıldı (Sığdır, Kompakt, %90, %100, vb.).");

        const ssPath = path.join(OUTPUT_DIR, "stage05-mobile-submenu-open.png");
        await page.screenshot({ path: ssPath, fullPage: false });

        // 4. Mobilde %90 seçeneğine tıkla
        await page.click('[data-testid="belge-mobile-form-scale-90"]');
        await page.waitForTimeout(300);

        const mobileScaleApplied = await page.evaluate(() => {
          const content = document.querySelector('[data-belge-form-content="true"]');
          return content?.getAttribute("data-scale");
        });
        console.log(`   - Mobil menüden uygulanan data-scale: ${mobileScaleApplied}`);

        const passed = !desktopTriggerVisible && mobileScaleApplied === "0.9";

        results.scenarios.push({
          scenario: "mobile_footer_form_view_menu",
          desktopTriggerHidden: !desktopTriggerVisible,
          mobileScaleApplied,
          passed,
        });
      } finally {
        await context.close();
      }
    }

    // ==========================================
    // Senaryo 7: Kalıcılık ve Sayfa Yenileme (Reload / Hydration Uyumu)
    // ==========================================
    console.log("\n🔍 Senaryo 7: Kalıcılık ve Sayfa Yenileme (Hydration Koruması)...");
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
        await page.waitForSelector('[data-testid="belge-studio-form-view-trigger"]', { timeout: 10000 });

        // Tercihi %125 yap
        await page.click('[data-testid="belge-studio-form-view-trigger"]');
        await page.waitForSelector('[data-testid="form-view-scale-125"]', { timeout: 3000 });
        await page.click('[data-testid="form-view-scale-125"]');
        await page.waitForTimeout(300);

        // Sayfayı yeniden yükle
        console.log("   - Sayfa yeniden yükleniyor (page.reload)...");
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForSelector('[data-belge-form-content="true"]', { timeout: 10000 });
        await page.waitForTimeout(500);

        const persistedState = await page.evaluate(() => {
          const content = document.querySelector('[data-belge-form-content="true"]');
          const trigger = document.querySelector('[data-testid="belge-studio-form-view-trigger"]');
          return {
            scale: content?.getAttribute("data-scale"),
            triggerText: trigger?.innerText.trim(),
          };
        });

        console.log(`   - Reload sonrası uygulanan data-scale: ${persistedState.scale}`);
        console.log(`   - Reload sonrası trigger etiketi: "${persistedState.triggerText}"`);

        const passed = persistedState.scale === "1.25" && persistedState.triggerText.includes("125");

        results.scenarios.push({
          scenario: "persistence_and_reload",
          persistedState,
          passed,
        });
      } finally {
        await context.close();
      }
    }

    // ==========================================
    // Sonuçların Kaydedilmesi
    // ==========================================
    const allPassed = results.scenarios.every((s) => s.passed);
    results.allPassed = allPassed;

    const jsonPath = path.join(OUTPUT_DIR, "stage05-metrics.json");
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf-8");
    console.log(`\n📊 Sonuçlar kaydedildi: ${jsonPath}`);
    console.log(`🏁 ASAMA_05 Doğrulama Durumu: ${allPassed ? "✅ TÜM SENARYOLAR BAŞARILI" : "❌ BAZI SENARYOLAR BAŞARISIZ"}`);

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
