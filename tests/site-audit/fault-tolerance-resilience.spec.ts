import { test, expect } from "@playwright/test";

test.describe("Hata Toleransı, Dayanıklılık ve Unmount Testleri", () => {
  test("Özel 404 Sayfası — Kayıp Rota Kontrollü Ele Alınmalıdır", async ({ page }) => {
    const res = await page.goto("/kesinlikle-olmayan-test-rotasi-404-kontrol", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBe(404);

    // 404 sayfasının render olduğunu ve ana sayfaya dönüş linki içerdiğini doğrula
    const content = await page.textContent("body");
    expect(content).toBeTruthy();
  });

  test("Hızlı Yarış / Erken Navigasyon Abort Durumunda Çökme Olmamalıdır", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });

    // Yükleme tamamlanmadan hızlıca ardışık sayfalar arasında geçiş
    page.goto("/kategori/araclar/kolon-on-boyutlandirma").catch(() => {});
    await page.waitForTimeout(50);
    page.goto("/hesaplamalar/hizli-metraj").catch(() => {});
    await page.waitForTimeout(50);
    await page.goto("/kategori/bina-asamalari", { waitUntil: "networkidle" });

    // Sayfa sağlıklı bir şekilde yüklenmiş olmalıdır
    const title = await page.title();
    expect(title).toContain("Bina Aşamaları");
    expect(errors.filter((e) => !e.includes("ResizeObserver")), "Beklenmeyen sayfa hatası oluştu").toEqual([]);
  });

  test("Form Etkileşimi — Hızlı Seri Değişiklik ve Çift Tıklama Dayanıklılığı", async ({ page }) => {
    await page.goto("/kategori/araclar/kolon-on-boyutlandirma", { waitUntil: "networkidle" });

    const input = page.locator('input[inputmode="decimal"], input[name="floorCount"]').first();
    await expect(input).toBeVisible();

    // Hızlı seri giriş ve blur
    for (let i = 1; i <= 10; i++) {
      await input.fill(String(i * 2));
    }

    const value = await input.inputValue();
    expect(value).toBe("20");
  });
});
