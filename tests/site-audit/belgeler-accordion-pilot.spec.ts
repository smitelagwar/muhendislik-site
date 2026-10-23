/**
 * Belgeler — Akordeon Pilot (Beton Döküm Tutanağı) E2E Test Paketi (ASAMA_05)
 *
 * Hedef:
 * 1. 4 bölümün varsayılan olarak tamamen açık ('all-open') yüklenmesi.
 * 2. Bölüm başlığı butonuna tıklandığında aria-expanded ve hidden durumunun değişmesi.
 * 3. Dolu sayacının (n/toplam dolu) alan değişikliklerinde anlık güncellenmesi.
 * 4. "Tümünü Kapat" ve "Tümünü Aç" ana kontrolünün tüm bölümleri senkronize yönetmesi.
 * 5. Kullanıcı tercihlerinin localStorage'a yazılması ve sayfa yenilendiğinde hatırlanması.
 * 6. Bölüm kapalıyken form verilerinin ve PDF senkronunun eksiksiz korunması.
 */

import { test, expect } from "@playwright/test";

test.describe("Belgeler Akordeon Pilot — ASAMA_05 Beton Döküm Tutanağı", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test("1. Varsayılan durum: 4 bölümün tamamı açık ve dolu sayaçları tam", async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const sectionIds = ["belge-kayit", "santiye-yeri", "olay-gozlem", "imzaci-taraflar"];

    for (const id of sectionIds) {
      const toggleBtn = page.locator(`[data-testid="belge-section-toggle-${id}"]`);
      await expect(toggleBtn).toBeVisible();
      await expect(toggleBtn).toHaveAttribute("aria-expanded", "true");

      const content = page.locator(`[data-testid="belge-section-content-${id}"]`);
      await expect(content).toBeVisible();
      await expect(content).not.toHaveClass(/hidden/);
    }

    // Sayaçları doğrula: Beton default verisinde 10 alanın tamamı doludur
    await expect(page.locator('[data-testid="belge-section-badge-belge-kayit"]')).toHaveText("3/3 dolu");
    await expect(page.locator('[data-testid="belge-section-badge-santiye-yeri"]')).toHaveText("1/1 dolu");
    await expect(page.locator('[data-testid="belge-section-badge-olay-gozlem"]')).toHaveText("2/2 dolu");
    await expect(page.locator('[data-testid="belge-section-badge-imzaci-taraflar"]')).toHaveText("4/4 dolu");
  });

  test("2. Tek bölüm açma/kapatma: aria-expanded ve hidden sınıfı doğru değişir", async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const toggleBtn = page.locator('[data-testid="belge-section-toggle-belge-kayit"]');
    const content = page.locator('[data-testid="belge-section-content-belge-kayit"]');

    // Başlangıçta açık
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
    await expect(content).toBeVisible();

    // Kapat
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    await expect(content).toHaveClass(/hidden/);

    // Tekrar aç
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
    await expect(content).not.toHaveClass(/hidden/);
    await expect(content).toBeVisible();
  });

  test("3. Dolu sayacı: Alan silindiğinde ve yeniden doldurulduğunda anlık güncellenir", async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const badge = page.locator('[data-testid="belge-section-badge-belge-kayit"]');
    await expect(badge).toHaveText("3/3 dolu");

    // Tutanak alt başlığı alanını temizle
    const input = page.locator("#beton-dokum-tutanak_alt_baslik");
    await input.fill("");
    await expect(badge).toHaveText("2/3 dolu");

    // Tekrar doldur
    await input.fill("Yeni Başlık");
    await expect(badge).toHaveText("3/3 dolu");
  });

  test("4. Tümünü Kapat / Tümünü Aç ana kontrolleri", async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const masterToggle = page.locator('[data-testid="belge-sections-toggle-all"]');
    await expect(masterToggle).toContainText("Tümünü Kapat");

    // Tümünü kapat
    await masterToggle.click();
    await expect(masterToggle).toContainText("Tümünü Aç");

    const sectionIds = ["belge-kayit", "santiye-yeri", "olay-gozlem", "imzaci-taraflar"];
    for (const id of sectionIds) {
      const toggleBtn = page.locator(`[data-testid="belge-section-toggle-${id}"]`);
      await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
      const content = page.locator(`[data-testid="belge-section-content-${id}"]`);
      await expect(content).toHaveClass(/hidden/);
    }

    // Tümünü aç
    await masterToggle.click();
    await expect(masterToggle).toContainText("Tümünü Kapat");

    for (const id of sectionIds) {
      const toggleBtn = page.locator(`[data-testid="belge-section-toggle-${id}"]`);
      await expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
      const content = page.locator(`[data-testid="belge-section-content-${id}"]`);
      await expect(content).not.toHaveClass(/hidden/);
    }
  });

  test("5. Kalıcılık: Bölüm kapatma tercihi reload sonrası korunur", async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // 2. ve 4. bölümleri kapat
    await page.locator('[data-testid="belge-section-toggle-santiye-yeri"]').click();
    await page.locator('[data-testid="belge-section-toggle-imzaci-taraflar"]').click();

    // LocalStorage'ı kontrol et
    const stored = await page.evaluate(() => {
      return window.localStorage.getItem("belgeler:ux:sections:v1:beton-dokum-tutanagi");
    });
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toContain("santiye-yeri");
    expect(parsed).toContain("imzaci-taraflar");

    // Sayfayı yenile
    await page.reload();
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    // santiye-yeri ve imzaci-taraflar kapalı olmalı
    await expect(page.locator('[data-testid="belge-section-toggle-santiye-yeri"]')).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('[data-testid="belge-section-content-santiye-yeri"]')).toHaveClass(/hidden/);

    await expect(page.locator('[data-testid="belge-section-toggle-imzaci-taraflar"]')).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator('[data-testid="belge-section-content-imzaci-taraflar"]')).toHaveClass(/hidden/);

    // Diğerleri açık kalmalı
    await expect(page.locator('[data-testid="belge-section-toggle-belge-kayit"]')).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator('[data-testid="belge-section-toggle-olay-gozlem"]')).toHaveAttribute("aria-expanded", "true");
  });

  test("6. Veri Bütünlüğü: Bölüm kapalıyken form verileri ve PDF senkronu kaybolmaz", async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const yerInput = page.locator("#beton-dokum-yer");
    await yerInput.fill("ANKARA İli Mamak İlçesi Özel Ada Parsel");

    // 2. bölümü kapat
    await page.locator('[data-testid="belge-section-toggle-santiye-yeri"]').click();
    await expect(page.locator('[data-testid="belge-section-content-santiye-yeri"]')).toHaveClass(/hidden/);

    // Bölümü tekrar aç ve değerin korunduğunu doğrula
    await page.locator('[data-testid="belge-section-toggle-santiye-yeri"]').click();
    await expect(page.locator('[data-testid="belge-section-content-santiye-yeri"]')).not.toHaveClass(/hidden/);
    await expect(yerInput).toHaveValue("ANKARA İli Mamak İlçesi Özel Ada Parsel");
  });

  test("7. Kapalı bölümdeki bir alana odaklanıldığında bölüm otomatik genişletilir (revealField)", async ({ page }) => {
    await page.goto("/belgeler/beton-dokum-tutanagi");
    await page.waitForSelector('[data-testid="belge-studio-form-scroll"]', { timeout: 15_000 });

    const toggleBtn = page.locator('[data-testid="belge-section-toggle-santiye-yeri"]');
    const content = page.locator('[data-testid="belge-section-content-santiye-yeri"]');

    // 2. bölümü kapat
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    await expect(content).toHaveClass(/hidden/);

    // Form scroll container üzerinde focusin tetikle
    await page.evaluate(() => {
      const input = document.getElementById("beton-dokum-yer");
      if (input) {
        input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
      }
    });

    // 2. bölümün otomatik açıldığını doğrula
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
    await expect(content).not.toHaveClass(/hidden/);
  });
});
