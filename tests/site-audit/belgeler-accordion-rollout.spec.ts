/**
 * Belgeler — Akordeon 4 Stüdyo Rollout E2E Test Paketi (ASAMA_06)
 *
 * Hedef: İnşaat Ruhsatı Dilekçesi, Şantiye Şefi İstifa Dilekçesi, Şantiye Şefi Sözleşmesi
 * ve Şantiye Şefi Taahhütnamesi stüdyolarında:
 * 1. Tüm bölümlerin varsayılan olarak açık yüklenmesi.
 * 2. Bölüm açma/kapatma (WAI-ARIA aria-expanded, aria-controls, hidden sınıfı).
 * 3. n/toplam dolu sayaçlarının anlık hesaplanması.
 * 4. Tümünü Aç / Tümünü Kapat ana kontrolleri.
 * 5. Kullanıcı tercihinin localStorage'da bağımsız anahtarla saklanması ve reload sonrası korunması.
 * 6. PDF alan odağında kapalı bölümün otomatik açılması (revealField).
 * 7. Belgeler arası tercih izolasyonu.
 */

import { test, expect } from "@playwright/test";

test.describe("Belgeler Akordeon Rollout — ASAMA_06 Kalan 4 Stüdyo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test("1. İnşaat Ruhsatı: 4 bölüm açık başlar, sayaçlar tam, Tümünü Kapat/Aç ve reload tercihi korunur", async ({ page }) => {
    await page.goto("/belgeler/insaat-ruhsati-dilekcesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const sectionIds = ["idare-ve-tarih", "talep-metni", "dilekce-sahibi", "iletisim-adres"];

    // 1. Tüm bölümler açık
    for (const id of sectionIds) {
      const toggle = page.locator(`[data-testid="belge-section-toggle-${id}"]`);
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator(`[data-testid="belge-section-content-${id}"]`)).not.toHaveClass(/hidden/);
    }

    // Sayaçlar (varsayılan: 3/3, 1/1, 2/2, 2/2)
    await expect(page.locator('[data-testid="belge-section-badge-idare-ve-tarih"]')).toHaveText("3/3 dolu");
    await expect(page.locator('[data-testid="belge-section-badge-talep-metni"]')).toHaveText("1/1 dolu");
    await expect(page.locator('[data-testid="belge-section-badge-dilekce-sahibi"]')).toHaveText("2/2 dolu");
    await expect(page.locator('[data-testid="belge-section-badge-iletisim-adres"]')).toHaveText("2/2 dolu");

    // 2. Talep metnini kapat ve reload kontrolü yap
    await page.locator('[data-testid="belge-section-toggle-talep-metni"]').click();
    await expect(page.locator('[data-testid="belge-section-toggle-talep-metni"]')).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('[data-testid="belge-section-content-talep-metni"]')).toHaveClass(/hidden/);

    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });
    await expect(page.locator('[data-testid="belge-section-toggle-talep-metni"]')).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('[data-testid="belge-section-content-talep-metni"]')).toHaveClass(/hidden/);
    await expect(page.locator('[data-testid="belge-section-toggle-idare-ve-tarih"]')).toHaveAttribute("aria-expanded", "true");

    // 3. Tümünü Aç / Kapat
    const master = page.locator('[data-testid="belge-sections-toggle-all"]');
    // Bir bölüm kapalı olduğundan master butonu "Tümünü Aç" modundadır
    await expect(master).toContainText("Tümünü Aç");
    await master.click();
    for (const id of sectionIds) {
      await expect(page.locator(`[data-testid="belge-section-toggle-${id}"]`)).toHaveAttribute("aria-expanded", "true");
    }

    // Şimdi hepsi açıkken "Tümünü Kapat" tıkla
    await expect(master).toContainText("Tümünü Kapat");
    await master.click();
    for (const id of sectionIds) {
      await expect(page.locator(`[data-testid="belge-section-toggle-${id}"]`)).toHaveAttribute("aria-expanded", "false");
    }

    // Tekrar tümünü aç
    await expect(master).toContainText("Tümünü Aç");
    await master.click();
    for (const id of sectionIds) {
      await expect(page.locator(`[data-testid="belge-section-toggle-${id}"]`)).toHaveAttribute("aria-expanded", "true");
    }
  });

  test("2. İstifa Dilekçesi: 3 bölüm açık, sayaçlar, kapalı bölüm verisinin korunması ve revealField", async ({ page }) => {
    await page.goto("/belgeler/santiye-sefi-istifa-dilekcesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const sectionIds = ["idare-hitap", "dilekce-metni", "sefi-iletisim"];
    for (const id of sectionIds) {
      await expect(page.locator(`[data-testid="belge-section-toggle-${id}"]`)).toHaveAttribute("aria-expanded", "true");
    }

    // Sayaçlar (2/2, 2/2, 6/6)
    await expect(page.locator('[data-testid="belge-section-badge-idare-hitap"]')).toHaveText("2/2 dolu");
    await expect(page.locator('[data-testid="belge-section-badge-dilekce-metni"]')).toHaveText("2/2 dolu");
    await expect(page.locator('[data-testid="belge-section-badge-sefi-iletisim"]')).toHaveText("6/6 dolu");

    // 2. bölümü kapat
    const toggleMetin = page.locator('[data-testid="belge-section-toggle-dilekce-metni"]');
    const contentMetin = page.locator('[data-testid="belge-section-content-dilekce-metni"]');
    await toggleMetin.click();
    await expect(toggleMetin).toHaveAttribute("aria-expanded", "false");
    await expect(contentMetin).toHaveClass(/hidden/);

    // Form scroll container üzerinde focusin tetikleyerek kapalı bölümün otomatik açılmasını doğrula
    await page.evaluate(() => {
      const input = document.getElementById("istifa-ana_paragraf");
      if (input) {
        input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      }
    });

    await expect(toggleMetin).toHaveAttribute("aria-expanded", "true");
    await expect(contentMetin).not.toHaveClass(/hidden/);
  });

  test("3. Sözleşme: 4 bölüm açık, sayaçlar (2/2, 8/8, 2/2, 2/2), İşyeri Bilgileri 8 alan kapatma & reload kalıcılığı", async ({ page }) => {
    await page.goto("/belgeler/santiye-sefi-sozlesmesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const sectionIds = ["taraflar", "isyeri-bilgileri", "ucret-ve-tarih", "imza-alanlari"];
    for (const id of sectionIds) {
      await expect(page.locator(`[data-testid="belge-section-toggle-${id}"]`)).toHaveAttribute("aria-expanded", "true");
    }

    // Sayaçlar
    await expect(page.locator('[data-testid="belge-section-badge-taraflar"]')).toHaveText("2/2 dolu");
    await expect(page.locator('[data-testid="belge-section-badge-isyeri-bilgileri"]')).toHaveText("8/8 dolu");
    await expect(page.locator('[data-testid="belge-section-badge-ucret-ve-tarih"]')).toHaveText("2/2 dolu");
    await expect(page.locator('[data-testid="belge-section-badge-imza-alanlari"]')).toHaveText("2/2 dolu");

    // İşyeri Bilgileri bölümünü kapat
    const toggleIsyeri = page.locator('[data-testid="belge-section-toggle-isyeri-bilgileri"]');
    await toggleIsyeri.click();
    await expect(toggleIsyeri).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('[data-testid="belge-section-content-isyeri-bilgileri"]')).toHaveClass(/hidden/);

    // Diğerleri açık
    await expect(page.locator('[data-testid="belge-section-toggle-imza-alanlari"]')).toHaveAttribute("aria-expanded", "true");

    // Reload sonrası kalıcılık
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });
    await expect(page.locator('[data-testid="belge-section-toggle-isyeri-bilgileri"]')).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('[data-testid="belge-section-content-isyeri-bilgileri"]')).toHaveClass(/hidden/);
    await expect(page.locator('[data-testid="belge-section-toggle-imza-alanlari"]')).toHaveAttribute("aria-expanded", "true");
  });

  test("4. Taahhütname: 3 bölüm açık, sayaçlar (6/6, 6/6, 2/2), alan silme/yazmada sayaç tepkisi", async ({ page }) => {
    await page.goto("/belgeler/santiye-sefi-taahhutnamesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const sectionIds = ["sefi-bilgileri", "yapi-ve-idare", "tarih-ve-imza"];
    for (const id of sectionIds) {
      await expect(page.locator(`[data-testid="belge-section-toggle-${id}"]`)).toHaveAttribute("aria-expanded", "true");
    }

    await expect(page.locator('[data-testid="belge-section-badge-sefi-bilgileri"]')).toHaveText("6/6 dolu");
    await expect(page.locator('[data-testid="belge-section-badge-yapi-ve-idare"]')).toHaveText("6/6 dolu");
    await expect(page.locator('[data-testid="belge-section-badge-tarih-ve-imza"]')).toHaveText("2/2 dolu");

    // Oda sicil no'yu sil ve sayacın 5/6 olduğunu doğrula
    const odaInput = page.locator("#taahhutname-oda_sicil_no");
    await odaInput.fill("");
    await expect(page.locator('[data-testid="belge-section-badge-sefi-bilgileri"]')).toHaveText("5/6 dolu");

    // Geri yaz
    await odaInput.fill("98765");
    await expect(page.locator('[data-testid="belge-section-badge-sefi-bilgileri"]')).toHaveText("6/6 dolu");
  });

  test("5. Belgeler arası akordeon tercih izolasyonu", async ({ page }) => {
    // 1. Ruhsat dilekçesinde 2 bölüm kapat
    await page.goto("/belgeler/insaat-ruhsati-dilekcesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    await page.locator('[data-testid="belge-section-toggle-talep-metni"]').click();
    await page.locator('[data-testid="belge-section-toggle-iletisim-adres"]').click();

    // 2. Sözleşme stüdyosuna git: Hiçbir bölüm kapalı olmamalıdır
    await page.goto("/belgeler/santiye-sefi-sozlesmesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const sozlesmeSections = ["taraflar", "isyeri-bilgileri", "ucret-ve-tarih", "imza-alanlari"];
    for (const id of sozlesmeSections) {
      await expect(page.locator(`[data-testid="belge-section-toggle-${id}"]`)).toHaveAttribute("aria-expanded", "true");
    }

    // 3. Ruhsat stüdyosuna geri dön: Kapalı bölümler korunmuş olmalıdır
    await page.goto("/belgeler/insaat-ruhsati-dilekcesi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    await expect(page.locator('[data-testid="belge-section-toggle-talep-metni"]')).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('[data-testid="belge-section-toggle-iletisim-adres"]')).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('[data-testid="belge-section-toggle-idare-ve-tarih"]')).toHaveAttribute("aria-expanded", "true");
  });
});
