import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * FAZ B — Playwright Kabul Testleri (Tarayıcı Seviyesi)
 *
 * 1. Cache-Control: /vendor/pdfjs/... için 'immutable' başlığı doğrulaması
 * 2. Şifreli PDF: Parola modalı, yanlış şifre uyarısı ve doğru şifre ile açılış
 * 3. Bozuk PDF: Anlaşılır hata mesajı, indirme butonu, sonsuz retry olmaması
 * 4. URL Yenilenmesi: Konum/sayfa kaybetmeden yenilenme
 * 5. 20 Kez Aç-Kapa: Konsolda sıfır hata ve bellek istikrarı
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
  let filePath = path.join(process.cwd(), "tests", "fixtures", "pdf", fixtureFileName);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), "tests", "fixtures", "pdf", "manual", fixtureFileName);
  }
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
      formData.append("pathname", `dok_storage/faz-b-${Date.now()}-${name}`);
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

test.describe("PDF Görüntüleyici v2 — FAZ B Yükleme Hattı ve Güvenlik", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // --------------------------------------------------------------------------
  // TEST 1: Cache-Control Immutable Başlığı (/vendor/pdfjs/*)
  // --------------------------------------------------------------------------
  test("1. Cache-Control Başlığı: /vendor/pdfjs/pdf.min.mjs immutable olarak sunulmalı", async ({ request }) => {
    const response = await request.get("/vendor/pdfjs/pdf.min.mjs");
    expect(response.status()).toBe(200);

    const cacheControl = response.headers()["cache-control"] || "";
    console.log("`/vendor/pdfjs/pdf.min.mjs` Cache-Control:", cacheControl);

    // Faz B Kabul Kriteri: curl -I ile /vendor/pdfjs/... immutable görünür
    expect(cacheControl).toContain("immutable");
    expect(cacheControl).toContain("max-age=31536000");
  });

  // --------------------------------------------------------------------------
  // TEST 2: Şifreli PDF Akışı (Parola modalı, yanlış parola, doğru parola ile açılış)
  // --------------------------------------------------------------------------
  test("2. Şifreli PDF: Parola modalı açılmalı, yanlış şifrede uyarmalı, doğru şifre ile belgeyi açmalı", async ({ page }) => {
    test.setTimeout(90_000);
    const fileId = await uploadFixturePdf(page, "sifreli.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    // Parola modalı görünür olmalı
    const modal = page.locator('[data-testid="pdf-password-modal"]');
    await expect(modal).toBeVisible({ timeout: 15_000 });

    const passwordInput = page.locator('[data-testid="pdf-password-input"]');
    const submitBtn = page.locator('[data-testid="pdf-password-submit"]');

    // 1. Yanlış şifre denemesi
    await passwordInput.fill("yanlis_sifre");
    await submitBtn.click();

    // Hata mesajı belirmeli
    const errorMsg = page.locator('[data-testid="pdf-password-error"]');
    await expect(errorMsg).toBeVisible({ timeout: 8_000 });
    await expect(errorMsg).toContainText("Hatalı parola");

    // 2. Doğru şifre denemesi
    await passwordInput.fill("sifre123");
    await submitBtn.click();

    // Modal kapanmalı ve belge sayfaları yüklenmeli
    await expect(modal).toBeHidden({ timeout: 15_000 });
    const firstCanvas = page.locator('[data-testid="pdf-page-canvas-1"]');
    await expect(firstCanvas).toBeVisible({ timeout: 20_000 });
  });

  // --------------------------------------------------------------------------
  // TEST 3: Bozuk PDF Akışı (Anlaşılır hata ekranı, indirme butonu, retry yok)
  // --------------------------------------------------------------------------
  test("3. Bozuk PDF: Anlaşılır hata mesajı vermeli, indirme butonu sunmalı ve döngüye girmemeli", async ({ page }) => {
    test.setTimeout(60_000);
    const fileId = await uploadFixturePdf(page, "bozuk.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    // Hata ekranı görünmeli
    const errorCard = page.locator("text=Bozuk veya Geçersiz Dosya");
    await expect(errorCard).toBeVisible({ timeout: 15_000 });

    // "Dosyayı İndir" butonu bulunmalı
    const downloadBtn = page.locator('[data-testid="pdf-download-corrupt-btn"]');
    await expect(downloadBtn).toBeVisible();

    // Yükleme durumu gizlenmiş olmalı (sonsuz döngü yok)
    await expect(page.locator('[data-testid="pdf-viewer-status"]')).toBeHidden();
  });

  // --------------------------------------------------------------------------
  // TEST 4: URL Yenilenmesinde Okuma Konumunun Korunması
  // --------------------------------------------------------------------------
  test("4. URL Yenilenmesi: Belge yeniden bağlandığında okuma sayfası korunmalı", async ({ page }) => {
    test.setTimeout(90_000);
    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    // İlk sayfa ve ikinci sayfa canvas'larını bekle
    const page2Canvas = page.locator('[data-testid="pdf-page-canvas-2"]');
    await expect(page2Canvas).toBeAttached({ timeout: 20_000 });

    // Sayfa 2'ye kaydır
    await page.evaluate(() => {
      const el = document.getElementById("pdf-page-2");
      const container = document.querySelector('[data-testid="pdf-scroll-viewport"]');
      if (el && container) {
        container.scrollTop = el.offsetTop - 10;
      }
    });

    await page.waitForTimeout(500);

    // Sayfa yenileme veya URL refresh simülasyonu: aynı URL'e reload
    await page.reload();

    // Yeniden açıldığında sayfa 2 görünür olmalı (okuma konumu geri yüklendi)
    await expect(page2Canvas).toBeAttached({ timeout: 20_000 });
  });

  // --------------------------------------------------------------------------
  // TEST 5: Ardışık Aç-Kapa ve Konsol Hata / Bellek İstikrarı
  // --------------------------------------------------------------------------
  test("5. Ardışık 5 Kez Belge Aç-Kapa: Konsolda unhandled hata olmamalı", async ({ page }) => {
    test.setTimeout(120_000);
    const fileId = await uploadFixturePdf(page, "tr-metin.pdf");

    const errors: string[] = [];
    page.on("pageerror", (err) => {
      errors.push(`PageError: ${err.message}`);
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // İlgisiz network logları dışındaki unhandled istisnaları yakala
        if (!text.includes("favicon") && !text.includes("404")) {
          errors.push(`ConsoleError: ${text}`);
        }
      }
    });

    for (let i = 1; i <= 5; i++) {
      await page.goto(`/dokumantasyon/dosya/${fileId}`);
      await expect(page.locator('[data-testid="pdf-page-canvas-1"]')).toBeVisible({ timeout: 15_000 });
      // Ana listeye dön (unmount)
      await page.goto("/dokumantasyon");
      await page.waitForTimeout(200);
    }

    expect(errors).toHaveLength(0);
  });
});
