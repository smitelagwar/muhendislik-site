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

      // Masaüstü V3: Footer'da Form Görünümü butonu ve Boş form indir yan yana
      const trigger = page.locator('[data-testid="belge-studio-desktop-actions"] [data-testid="belge-studio-form-view-trigger"]');
      const blankFormBtn = page.locator('[data-testid="belge-studio-desktop-actions"] button:has-text("Boş form indir")');
      const themeToggle = page.locator('[data-testid="belge-studio-top-header"] [data-testid="belge-theme-toggle"]');
      const toolbar = page.locator('[data-testid="belge-studio-preview-toolbar"]');

      await expect(trigger).toBeVisible({ timeout: 5_000 });
      await expect(blankFormBtn).toBeVisible({ timeout: 5_000 });
      await expect(themeToggle).toBeVisible({ timeout: 5_000 });

      const triggerBox = await trigger.boundingBox();
      const blankFormBox = await blankFormBtn.boundingBox();
      const toolbarBox = await toolbar.boundingBox();

      expect(triggerBox).not.toBeNull();
      expect(blankFormBox).not.toBeNull();
      expect(toolbarBox).not.toBeNull();

      // Form görünümü Boş form indir ile aynı satırda ve hemen solunda olmalı
      expect(Math.abs(triggerBox!.y - blankFormBox!.y)).toBeLessThan(12);
      expect(triggerBox!.x + triggerBox!.width).toBeLessThanOrEqual(blankFormBox!.x + 12);
      expect(toolbarBox!.height).toBeLessThanOrEqual(56);

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

    // Sözleşme: Mobilde (<1024px) Form Görünümü menüsü kaldırılmıştır; çekmecede yer almaz.
    const moreBtn = page.getByTestId("belge-mobile-more-btn");
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();

    const drawer = page.getByTestId("belge-mobile-actions-drawer");
    await expect(drawer).toBeVisible({ timeout: 5_000 });

    const formTrigger = drawer.locator('[data-testid="belge-studio-form-view-trigger"]');
    await expect(formTrigger).toHaveCount(0);

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();

    const content = page.locator('[data-belge-form-content="true"]');
    await expect(content).toBeVisible();
  });

  test("Tablet görünümü (iPad / 768x1024) form görünümü ve fit doğrulaması", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/belgeler/santiye-sefi-sozlesmesi", { waitUntil: "networkidle", timeout: 30_000 });

    // Tablette (< 1024px) varsayılan sekme canlı önizlemedir; form sekmesine geç
    const editFormBtn = page.locator('button[aria-label="Formu Düzenle"]');
    await expect(editFormBtn).toBeVisible({ timeout: 10_000 });
    await editFormBtn.click();
    await page.waitForTimeout(300);

    const formScroll = page.locator('[data-testid="belge-studio-form-scroll"]');
    const content = page.locator('[data-belge-form-content="true"]');
    await expect(formScroll).toBeVisible({ timeout: 10_000 });
    await expect(content).toBeVisible({ timeout: 5_000 });

    // Sözleşme: Tablette (< 1024px) Form Görünümü menüsü kaldırılmıştır; çekmecede yer almaz.
    const moreBtn = page.getByTestId("belge-mobile-more-btn");
    await expect(moreBtn).toBeVisible({ timeout: 5_000 });
    await moreBtn.click();

    const drawer = page.getByTestId("belge-mobile-actions-drawer");
    await expect(drawer).toBeVisible({ timeout: 5_000 });

    const formTrigger = drawer.locator('[data-testid="belge-studio-form-view-trigger"]');
    await expect(formTrigger).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
  });
});
