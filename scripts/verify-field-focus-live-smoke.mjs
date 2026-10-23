import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const PROD_URL = "https://muhendislik-site.vercel.app";
const BASE_URL = process.env.SMOKE_URL || process.env.BASE_URL || PROD_URL;
const EVIDENCE_DIR = path.resolve(process.cwd(), process.env.SMOKE_EVIDENCE_DIR || "docs/belgeler-alan-odak/evidence");
const MAX_TEST_DURATION_MS = 60_000;

async function main() {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  let browser = null;
  let exitCode = 0;
  const runtimeErrors = [];
  const watchPage = (page) => {
    page.setDefaultTimeout(8_000);
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || /hydration|did not match/i.test(message.text())) {
        runtimeErrors.push(message.text());
      }
    });
    page.on("response", (response) => {
      if (response.status() >= 400) runtimeErrors.push(`HTTP ${response.status()}: ${response.url()}`);
    });
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText ?? "İstek başarısız";
      if (!failure.includes("ERR_ABORTED")) runtimeErrors.push(`${failure}: ${request.url()}`);
    });
  };

  // Emniyet zamanlayıcısı: Sürecin terminalde asılı kalmasını kesin olarak engeller
  const safetyTimeout = setTimeout(() => {
    console.error("⏱️ [verify-field-focus-smoke] Test zaman aşımına uğradı (60s). Süreç sonlandırılıyor.");
    setTimeout(() => process.exit(1), 2_000);
    if (browser) {
      browser.close().catch(() => {}).finally(() => process.exit(1));
    } else {
      process.exit(1);
    }
  }, MAX_TEST_DURATION_MS);

  try {
    console.log(`🚀 Belgeler Alan Odak Vurgusu Smoke Testi Başlatılıyor... (${BASE_URL})`);
    browser = await chromium.launch({ headless: true });

    // 1. Masaüstü Testi: Beton Döküm Tutanağı (Şantiye Yeri ve Tarih Odak Vurgusu)
    console.log("▶ 1. Beton Döküm Tutanağı (Şantiye Yeri -> PDF Yer Vurgusu)...");
    const desktopContext = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const desktopPage = await desktopContext.newPage();
    watchPage(desktopPage);

    const res1 = await desktopPage.goto(`${BASE_URL}/belgeler/beton-dokum-tutanagi`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const status1 = res1?.status() ?? 0;
    console.log(`   - HTTP Yanıt: ${status1}`);
    if (status1 < 200 || status1 >= 400) {
      throw new Error(`Sayfa yüklenemedi: HTTP ${status1}`);
    }

    const studio = desktopPage.locator('[data-studio-locked="true"]:visible').last();
    await desktopPage.waitForSelector("canvas", { timeout: 8000 });
    const downloadBtn = studio
      .locator('[data-testid="belge-studio-desktop-actions"]')
      .getByRole("button", { name: "PDF İndir", exact: true });
    await downloadBtn.waitFor({ state: "visible", timeout: 8000 });

    const form = studio.getByTestId("belge-studio-form-scroll");
    const yerInput = form.locator("#beton-dokum-yer");
    await yerInput.waitFor({ state: "visible" });

    // Şantiye Yeri alanına odaklan
    await yerInput.focus();
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');
    await highlight.waitFor({ state: "visible", timeout: 8000 });

    const yerFieldKey = await highlight.getAttribute("data-field-key");
    const yerPage = await highlight.getAttribute("data-page");
    if (yerFieldKey !== "yer" || yerPage !== "1") {
      throw new Error(`Şantiye Yeri odağında yanlış highlight nitelikleri: fieldKey=${yerFieldKey}, page=${yerPage}`);
    }
    console.log("   - Şantiye Yeri odağı: [data-testid=\"belge-field-focus-highlight\"] doğru alan ve sayfayla belirdi!");

    // Ekran görüntüsü al
    const ss1 = path.join(EVIDENCE_DIR, "live-beton-focus.png");
    await desktopPage.screenshot({ path: ss1 });
    console.log(`   - Ekran görüntüsü kaydedildi: ${ss1}`);

    // Tarih alanına geç
    const tarihInput = form.locator("#beton-dokum-tarih");
    await tarihInput.focus();
    await desktopPage.waitForTimeout(400);
    await highlight.waitFor({ state: "visible" });

    const tarihFieldKey = await highlight.getAttribute("data-field-key");
    if (tarihFieldKey !== "tarih") {
      throw new Error(`Tarih alanına geçişte yanlış highlight niteliği: fieldKey=${tarihFieldKey}`);
    }
    console.log("   - Tarih alanına geçişte odak vurgusu başarıyla güncellendi (data-field-key='tarih')!");

    // 2. Çok Sayfalı Sözleşme Testi (Sayfa 1 -> Sayfa 2 Otomatik Geçiş)
    console.log("▶ 2. Sözleşme Stüdyosu (Sayfa 2 Alanına Otomatik Geçiş)...");
    const res2 = await desktopPage.goto(`${BASE_URL}/belgeler/santiye-sefi-sozlesmesi`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const status2 = res2?.status() ?? 0;
    if (status2 < 200 || status2 >= 400) {
      throw new Error(`Sözleşme sayfası yüklenemedi: HTTP ${status2}`);
    }

    await desktopPage.waitForSelector("canvas", { timeout: 8000 });
    const sozlesmeStudio = desktopPage.locator('[data-studio-locked="true"]:visible').last();
    const toolbar = sozlesmeStudio.getByTestId("belge-studio-preview-toolbar");
    console.log("   - Başlangıçta toolbar Sayfa 1/2...");

    const sozlesmeForm = sozlesmeStudio.getByTestId("belge-studio-form-scroll");
    const tarih2Input = sozlesmeForm.locator("#sozlesme-sozlesme_tarihi");
    await tarih2Input.waitFor({ state: "visible" });
    await tarih2Input.focus();

    // Toolbar otomatik olarak 2 / 2 olmalı
    await toolbar.getByText("2 / 2").waitFor({ state: "visible", timeout: 8000 });
    const sozlesmeHighlight = sozlesmeStudio.locator('[data-testid="belge-field-focus-highlight"]');
    await sozlesmeHighlight.waitFor({ state: "visible", timeout: 8000 });

    const sozlesmeFieldKey = await sozlesmeHighlight.getAttribute("data-field-key");
    const sozlesmePage = await sozlesmeHighlight.getAttribute("data-page");
    if (sozlesmeFieldKey !== "sozlesme_tarihi" || sozlesmePage !== "2") {
      throw new Error(`Sözleşme Sayfa 2 alanında yanlış nitelik: fieldKey=${sozlesmeFieldKey}, page=${sozlesmePage}`);
    }
    console.log("   - Sayfa 2 alanına odaklanıldığında PDF otomatik Sayfa 2'ye geçti ve doğrulandı!");

    // 3. Mobil Testi: Form -> Canlı Önizleme 2.5s Parlama
    console.log("▶ 3. Mobil Görünüm (Form -> Önizleme 2.5s Parlama)...");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    watchPage(mobilePage);
    const res3 = await mobilePage.goto(`${BASE_URL}/belgeler/beton-dokum-tutanagi`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    const status3 = res3?.status() ?? 0;
    if (status3 < 200 || status3 >= 400) {
      throw new Error(`Mobil sayfa yüklenemedi: HTTP ${status3}`);
    }

    const mobileStudio = mobilePage.locator('[data-studio-locked="true"]:visible').last();
    const mobileActions = mobileStudio.getByTestId("belge-studio-mobile-actions");
    const formTabBtn = mobileActions.getByRole("button", { name: "Formu Düzenle", exact: true });
    const previewTabBtn = mobileActions.getByRole("button", { name: "Canlı PDF Önizle", exact: true });

    await formTabBtn.click();
    const mobileYer = mobileStudio.getByTestId("belge-studio-form-scroll").locator("#beton-dokum-yer");
    await mobileYer.waitFor({ state: "visible" });
    await mobileYer.focus();
    await mobileYer.fill("Canlı Mobil Test");

    // Önizleme sekmesine geç
    await previewTabBtn.click();
    const mobileHighlight = mobileStudio.locator('[data-testid="belge-field-focus-highlight"]');
    await mobileHighlight.waitFor({ state: "visible", timeout: 8000 });

    const mobileFieldKey = await mobileHighlight.getAttribute("data-field-key");
    if (mobileFieldKey !== "yer") {
      throw new Error(`Mobil önizlemede yanlış odak alanı: fieldKey=${mobileFieldKey}`);
    }
    console.log("   - Mobil önizlemeye geçildiğinde 2.5s vurgu doğru alanda belirdi!");

    // 3 sn sonra vurgunun kendiliğinden kaybolduğunu kesin olarak doğrula
    await mobilePage.waitForTimeout(3000);
    const isHidden = await mobileHighlight.isHidden();
    console.log(`   - 3 sn sonra vurgu kendiliğinden kapandı mı: ${isHidden ? "EVET ✅" : "HAYIR ❌"}`);
    if (!isHidden) {
      throw new Error("Mobil 2.5 saniye süresi dolduktan sonra vurgu kendiliğinden kapanmadı! (B09 ihlali)");
    }

    const ssMobile = path.join(EVIDENCE_DIR, "live-mobile-smoke.png");
    await mobilePage.screenshot({ path: ssMobile });
    console.log(`   - Mobil ekran görüntüsü kaydedildi: ${ssMobile}`);

    if (runtimeErrors.length) throw new Error(`Tarayıcı hataları:\n${runtimeErrors.join("\n")}`);
    console.log("🏁 SMOKE TESTİ: ✅ TÜM SENARYOLAR BAŞARILI");
  } catch (err) {
    exitCode = 1;
    console.error("❌ Smoke test başarısız:", err);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        exitCode = 1;
        console.warn("Tarayıcı kapatılırken hata:", closeErr);
      }
    }
    clearTimeout(safetyTimeout);
    process.exit(exitCode);
  }
}

main();
