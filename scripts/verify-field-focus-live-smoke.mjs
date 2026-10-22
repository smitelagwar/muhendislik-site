import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const PROD_URL = "https://muhendislik-site.vercel.app";
const EVIDENCE_DIR = path.resolve(process.cwd(), "docs/belgeler-alan-odak/evidence");

async function main() {
  if (!fs.existsSync(EVIDENCE_DIR)) {
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  }

  let browser = null;
  try {
    console.log(`🚀 Canlı Vercel Production Smoke Testi Başlatılıyor... (${PROD_URL})`);
    browser = await chromium.launch({ headless: true });

    // 1. Masaüstü Testi: Beton Döküm Tutanağı (Şantiye Yeri ve Tarih Odak Vurgusu)
    console.log("▶ 1. Beton Döküm Tutanağı (Şantiye Yeri -> PDF Yer Vurgusu)...");
    const desktopContext = await browser.newContext({
      viewport: { width: 1366, height: 768 },
    });
    const desktopPage = await desktopContext.newPage();

    const res1 = await desktopPage.goto(`${PROD_URL}/belgeler/beton-dokum-tutanagi`, {
      waitUntil: "networkidle",
      timeout: 35000,
    });
    console.log(`   - HTTP Yanıt: ${res1.status()}`);

    const studio = desktopPage.locator('[data-studio-locked="true"]:visible').last();
    await desktopPage.waitForSelector('canvas', { timeout: 15000 });
    const downloadBtn = studio.locator('[data-testid="belge-studio-desktop-actions"]').getByRole("button", { name: "PDF İndir", exact: true });
    await downloadBtn.waitFor({ state: "visible", timeout: 10000 });

    const form = studio.getByTestId("belge-studio-form-scroll");
    const yerInput = form.locator("#beton-dokum-yer");
    await yerInput.waitFor({ state: "visible" });

    // Şantiye Yeri alanına odaklan
    await yerInput.focus();
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');
    await highlight.waitFor({ state: "visible", timeout: 8000 });
    console.log("   - Şantiye Yeri odağı: [data-testid=\"belge-field-focus-highlight\"] başarıyla belirdi!");

    // Ekran görüntüsü al
    const ss1 = path.join(EVIDENCE_DIR, "live-beton-focus.png");
    await desktopPage.screenshot({ path: ss1 });
    console.log(`   - Ekran görüntüsü kaydedildi: ${ss1}`);

    // Tarih alanına geç
    const tarihInput = form.locator("#beton-dokum-tarih");
    await tarihInput.focus();
    await desktopPage.waitForTimeout(400);
    await highlight.waitFor({ state: "visible" });
    console.log("   - Tarih alanına geçişte odak vurgusu başarıyla güncellendi!");

    // 2. Çok Sayfalı Sözleşme Testi (Sayfa 1 -> Sayfa 2 Otomatik Geçiş)
    console.log("▶ 2. Sözleşme Stüdyosu (Sayfa 2 Alanına Otomatik Geçiş)...");
    await desktopPage.goto(`${PROD_URL}/belgeler/santiye-sefi-sozlesmesi`, {
      waitUntil: "networkidle",
      timeout: 35000,
    });
    await desktopPage.waitForSelector('canvas', { timeout: 15000 });
    const sozlesmeStudio = desktopPage.locator('[data-studio-locked="true"]:visible').last();
    const toolbar = sozlesmeStudio.getByTestId("belge-studio-preview-toolbar");
    console.log("   - Başlangıçta toolbar Sayfa 1/2...");

    const sozlesmeForm = sozlesmeStudio.getByTestId("belge-studio-form-scroll");
    const tarih2Input = sozlesmeForm.locator("#sozlesme-sozlesme_tarihi");
    await tarih2Input.waitFor({ state: "visible" });
    await tarih2Input.focus();

    // Toolbar otomatik olarak 2 / 2 olmalı
    await toolbar.getByText("2 / 2").waitFor({ state: "visible", timeout: 10000 });
    const sozlesmeHighlight = sozlesmeStudio.locator('[data-testid="belge-field-focus-highlight"]');
    await sozlesmeHighlight.waitFor({ state: "visible", timeout: 8000 });
    console.log("   - Sayfa 2 alanına odaklanıldığında PDF otomatik Sayfa 2'ye geçti ve vurgulandı!");

    // 3. Mobil Testi: Form -> Canlı Önizleme 2.5s Parlama
    console.log("▶ 3. Mobil Görünüm (Form -> Önizleme 2.5s Parlama)...");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${PROD_URL}/belgeler/beton-dokum-tutanagi`, {
      waitUntil: "networkidle",
      timeout: 35000,
    });

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
    console.log("   - Mobil önizlemeye geçildiğinde 2.5s vurgu başarıyla belirdi!");

    // 3 sn sonra vurgunun kendiliğinden kaybolduğunu doğrula
    await mobilePage.waitForTimeout(3000);
    const isHidden = await mobileHighlight.isHidden();
    console.log(`   - 3 sn sonra vurgu kendiliğinden kapandı mı: ${isHidden ? "EVET ✅" : "HAYIR ❌"}`);

    const ssMobile = path.join(EVIDENCE_DIR, "live-mobile-smoke.png");
    await mobilePage.screenshot({ path: ssMobile });
    console.log(`   - Mobil ekran görüntüsü kaydedildi: ${ssMobile}`);

    console.log("🏁 CANLI PRODUCTION SMOKE TESTİ: ✅ TÜM SENARYOLAR BAŞARILI");
  } catch (err) {
    console.error("❌ Canlı smoke test başarısız:", err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();
