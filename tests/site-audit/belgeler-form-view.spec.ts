import { expect, test } from "@playwright/test";

const DOCUMENTS = [
  "santiye-sefi-sozlesmesi",
  "santiye-sefi-istifa-dilekcesi",
  "santiye-sefi-taahhutnamesi",
  "insaat-ruhsati-dilekcesi",
  "beton-dokum-tutanagi",
];

test.describe("Belgeler Form View & UX Regresyon Paketi", () => {
  for (const doc of DOCUMENTS) {
    test(`[${doc}] Masaüstü form görünümü, menü ve tek satır toolbar doğrulaması`, async ({ page }) => {
      await page.goto(`/belgeler/${doc}`, { waitUntil: "networkidle", timeout: 30_000 });

      // Form scroll ve içerik wrapper kontrolü
      const formScroll = page.locator('[data-testid="belge-studio-form-scroll"]');
      const content = page.locator('[data-belge-form-content="true"]');
      await expect(formScroll).toBeVisible({ timeout: 10_000 });
      await expect(content).toBeVisible({ timeout: 5_000 });

      // Başlangıç değerleri
      await expect(content).toHaveAttribute("data-scale", "1");
      await expect(content).toHaveAttribute("data-density", "normal");

      // Masaüstü toolbar: Tek satır ve tema anahtarının solunda Form düğmesi
      const trigger = page.locator('[data-testid="belge-studio-form-view-trigger"]');
      const themeToggle = page.locator('[data-testid="belge-theme-toggle"]');
      const toolbar = page.locator('[data-testid="belge-studio-preview-toolbar"]');

      await expect(trigger).toBeVisible({ timeout: 5_000 });
      await expect(themeToggle).toBeVisible({ timeout: 5_000 });

      const triggerBox = await trigger.boundingBox();
      const themeBox = await themeToggle.boundingBox();
      const toolbarBox = await toolbar.boundingBox();

      expect(triggerBox).not.toBeNull();
      expect(themeBox).not.toBeNull();
      expect(toolbarBox).not.toBeNull();

      // Tek satırda olmalı (yükseklik farkı 12px'den küçük olmalı)
      expect(Math.abs(triggerBox!.y - themeBox!.y)).toBeLessThan(12);
      expect(triggerBox!.x + triggerBox!.width).toBeLessThanOrEqual(themeBox!.x + 12);
      expect(toolbarBox!.height).toBeLessThanOrEqual(52);

      // Menü açılışı
      await trigger.click();
      const menu = page.locator('[data-testid="belge-studio-form-view-menu"]');
      await expect(menu).toBeVisible({ timeout: 5_000 });

      // Presetler
      await expect(page.locator('[data-testid="form-view-scale-100"]')).toHaveAttribute("aria-checked", "true");
      await expect(page.locator('[data-testid="form-view-fit"]')).toBeVisible();
      await expect(page.locator('[data-testid="form-view-compact"]')).toBeVisible();

      // Escape ile kapanma testi
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);

      // Fit eylemi
      await trigger.click();
      await page.locator('[data-testid="form-view-fit"]').click();
      await page.waitForTimeout(300);

      await expect(content).toHaveAttribute("data-mode", "fit");
      const fitStatus = await content.getAttribute("data-fit-status");
      expect(["fitted", "limited"]).toContain(fitStatus);

      // Reset eylemi
      await trigger.click();
      await page.locator('[data-testid="form-view-reset"]').click();
      await page.waitForTimeout(200);

      await expect(content).toHaveAttribute("data-mode", "manual");
      await expect(content).toHaveAttribute("data-scale", "1");
      await expect(content).toHaveAttribute("data-density", "normal");
    });
  }

  test("Gerçek sayfa zoom ve reflow dayanıklılığı (%150 ölçek simülasyonu)", async ({ page }) => {
    // 1366x768 ekran
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/belgeler/santiye-sefi-sozlesmesi", { waitUntil: "networkidle", timeout: 30_000 });

    const formScroll = page.locator('[data-testid="belge-studio-form-scroll"]');
    const toolbar = page.locator('[data-testid="belge-studio-preview-toolbar"]');
    await expect(formScroll).toBeVisible({ timeout: 10_000 });

    // Sayfa ölçeği / DPI simülasyonu (CDP)
    const client = await page.context().newCDPSession(page);
    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1.5 });
    await page.waitForTimeout(400);

    // Yatay taşma olmadığını doğrula
    const isOverflowing = await formScroll.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(isOverflowing).toBe(false);

    // Toolbar'ın erişilebilir olduğunu doğrula
    await expect(toolbar).toBeVisible();

    // CDP sıfırla
    await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 1.0 });
  });

  test("Mobil alt işlemler ve sekme geçişi", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/belgeler/santiye-sefi-sozlesmesi", { waitUntil: "networkidle", timeout: 30_000 });

    const toggleBtn = page.locator('[data-testid="belge-studio-mobile-actions"] button[aria-label="Formu Düzenle"], [data-testid="belge-studio-mobile-actions"] button[aria-label="Canlı PDF Önizle"]').first();
    await expect(toggleBtn).toBeVisible({ timeout: 10_000 });

    // Sekme geçişi
    const initialLabel = await toggleBtn.getAttribute("aria-label");
    await toggleBtn.click();
    await page.waitForTimeout(300);
    const switchedLabel = await toggleBtn.getAttribute("aria-label");
    expect(initialLabel).not.toEqual(switchedLabel);

    // Diğer belge işlemleri menüsü
    const moreBtn = page.locator('button[aria-label="Diğer belge işlemleri"]');
    await moreBtn.click();
    const formTrigger = page.locator('[data-testid="belge-mobile-form-view-trigger"]');
    await expect(formTrigger).toBeVisible({ timeout: 5_000 });

    // Form görünümü alt menüsü
    await formTrigger.click();
    await expect(page.locator('[data-testid="belge-mobile-form-view-fit"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-testid="belge-mobile-form-scale-90"]')).toBeVisible({ timeout: 5_000 });
  });
});
