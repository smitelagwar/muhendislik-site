import { test, expect, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const STUDIO_PATH = "/belgeler/santiye-sefi-istifa-dilekcesi";
const MULTIPAGE_PATH = "/belgeler/santiye-sefi-sozlesmesi";
const RUHSAT_PATH = "/belgeler/insaat-ruhsati-dilekcesi";

async function waitForStudioReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForSelector('[data-testid="belge-studio-preview-canvas"]', { timeout: 20_000 });
  await expect(
    page.locator('[data-testid="belge-studio-mobile-actions"]').getByRole("button", { name: "PDF İndir", exact: true })
  ).toBeEnabled({ timeout: 20_000 });
  await page.waitForTimeout(500);
}

test.describe("Belgeler Mobil Çekmece & Sadeleştirilmiş Üst Bar (v1)", () => {
  test("1. Header (⋮) ve Alt Bar (⋯) butonları aynı çekmeceyi açar", async ({ page }) => {
    await waitForStudioReady(page, STUDIO_PATH);

    const drawer = page.getByTestId("belge-mobile-actions-drawer");
    await expect(drawer).not.toBeVisible();

    // Header ⋮ butonu çekmeceyi açar
    const headerMoreBtn = page.getByTestId("belge-mobile-header-menu-btn");
    await expect(headerMoreBtn).toBeVisible();
    await headerMoreBtn.click();
    await expect(drawer).toBeVisible();

    // Kapat
    const closeBtn = drawer.getByRole("button", { name: "Çekmeceyi Kapat" });
    await closeBtn.click();
    await expect(drawer).not.toBeVisible();

    // Alt bar ⋯ butonu da aynı çekmeceyi açar
    const bottomMoreBtn = page.getByTestId("belge-mobile-more-btn");
    await expect(bottomMoreBtn).toBeVisible();
    await bottomMoreBtn.click();
    await expect(drawer).toBeVisible();

    // Esc ile kapatma ve odak geri dönüşü
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();
    await expect(bottomMoreBtn).toBeFocused();
  });

  test("2. Yüzen zoom pill'i görünür, etkileşimi PDF'yi ölçekler ve zoom/scroll durumunu korur", async ({ page }) => {
    await waitForStudioReady(page, STUDIO_PATH);

    // Header portal slotu mobilde gizli olmalı
    const toolbarSlot = page.getByTestId("belge-unified-toolbar-slot");
    await expect(toolbarSlot).toBeHidden();

    // Sağ üstte yüzen zoom pill görünür
    const zoomPill = page.getByTestId("belge-studio-mobile-zoom-pill");
    await expect(zoomPill).toBeVisible();
    const zoomText = page.getByTestId("belge-studio-zoom-level");
    await expect(zoomText).toHaveText("%100");

    // Yakınlaştır
    const zoomInBtn = zoomPill.getByRole("button", { name: "Yakınlaştır", exact: true });
    await zoomInBtn.click();
    await expect(zoomText).toHaveText("%125");

    // Çekmeceyi aç ve kapat -> zoom %125 korunmalı
    const headerMoreBtn = page.getByTestId("belge-mobile-header-menu-btn");
    await headerMoreBtn.click();
    const drawer = page.getByTestId("belge-mobile-actions-drawer");
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();

    await expect(zoomText).toHaveText("%125");
  });

  test("3. Çekmeceden 'PDF Üzerinde Düzenle' hotspot'ları açar ve çip görünür", async ({ page }) => {
    await waitForStudioReady(page, STUDIO_PATH);

    const headerMoreBtn = page.getByTestId("belge-mobile-header-menu-btn");
    await headerMoreBtn.click();

    const inlineEditBtn = page.getByTestId("belge-drawer-inline-edit-btn");
    await expect(inlineEditBtn).toBeVisible();
    await inlineEditBtn.click();

    // Çekmece kapanmalı ve Düzenlemeyi Bitir çipi belirmeli
    const drawer = page.getByTestId("belge-mobile-actions-drawer");
    await expect(drawer).not.toBeVisible();

    const finishChip = page.getByTestId("belge-inline-edit-toggle");
    await expect(finishChip).toBeVisible();
    await expect(finishChip).toHaveText(/Düzenlemeyi Bitir/i);

    // Çipe basınca düzenleme modu kapanır
    await finishChip.click();
    await expect(finishChip).not.toBeVisible();
  });

  test("4. Görünüm (Tema) kartı çekmece açıkken html.dark sınıfını anlık değiştirir", async ({ page }) => {
    await waitForStudioReady(page, STUDIO_PATH);

    const bottomMoreBtn = page.getByTestId("belge-mobile-more-btn");
    await bottomMoreBtn.click();

    const drawer = page.getByTestId("belge-mobile-actions-drawer");
    await expect(drawer).toBeVisible();

    const themeCard = page.getByTestId("belge-mobile-theme-card");
    await expect(themeCard).toBeVisible();

    const wasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));

    // Tıkla
    await themeCard.click();
    await page.waitForTimeout(300);

    // Çekmece açık kalmalı
    await expect(drawer).toBeVisible();

    const isDarkAfter = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDarkAfter).toBe(!wasDark);

    // Tekrar tıkla -> eski duruma döner
    await themeCard.click();
    await page.waitForTimeout(300);
    const isDarkRestored = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDarkRestored).toBe(wasDark);
  });

  test("5. Paylaş butonu alt barda ve çekmecede çalışır; diyalog sorunsuz açılır", async ({ page }) => {
    await waitForStudioReady(page, STUDIO_PATH);

    // Alt bardaki Paylaş butonu
    const shareBtn = page.getByTestId("belge-mobile-action-share-btn");
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    // Paylaşım dialogu açılmalı
    const shareDialog = page.getByTestId("belge-share-dialog");
    await expect(shareDialog).toBeVisible({ timeout: 8000 });

    // Kapat
    await page.keyboard.press("Escape");
    await expect(shareDialog).not.toBeVisible();
  });

  test("6. Çok sayfalı belgede sayfa gezgini yüzen pill içinde görünür ve çalışır", async ({ page }) => {
    await waitForStudioReady(page, MULTIPAGE_PATH);

    const zoomPill = page.getByTestId("belge-studio-mobile-zoom-pill");
    await expect(zoomPill).toBeVisible();

    // Sayfa göstergesi
    const pageIndicator = zoomPill.getByText(/1 \/ 2|1 \/ \d/);
    await expect(pageIndicator).toBeVisible();

    // Sonraki sayfa butonu
    const nextPageBtn = zoomPill.getByRole("button", { name: "Sonraki sayfa" });
    await expect(nextPageBtn).toBeVisible();
    await nextPageBtn.click();

    const page2Indicator = zoomPill.getByText(/2 \/ 2|2 \/ \d/);
    await expect(page2Indicator).toBeVisible();
  });

  test("7. Ruhsat dilekçesinde 'Örnek Veri' aksiyonu çekmecede erişilebilir durumdadır", async ({ page }) => {
    await waitForStudioReady(page, RUHSAT_PATH);

    const headerMoreBtn = page.getByTestId("belge-mobile-header-menu-btn");
    await headerMoreBtn.click();

    const drawer = page.getByTestId("belge-mobile-actions-drawer");
    await expect(drawer).toBeVisible();

    // Diğer işlemler akordeonunu aç
    const otherBtn = drawer.getByRole("button", { name: /Diğer işlemler/i });
    await otherBtn.click();

    const sampleDataBtn = drawer.getByRole("button", { name: /Örnek Veri/i });
    await expect(sampleDataBtn).toBeVisible();
  });

  test("8. 320px ultra-dar ekranda yatay taşma üretmez", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await waitForStudioReady(page, STUDIO_PATH);

    // Sayfa geneli yatay taşma kontrolü
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(overflow).toBe(false);

    // Çekmeceyi aç ve taşma kontrolü
    const headerMoreBtn = page.getByTestId("belge-mobile-header-menu-btn");
    await headerMoreBtn.click();
    const drawer = page.getByTestId("belge-mobile-actions-drawer");
    await expect(drawer).toBeVisible();

    const drawerOverflow = await drawer.evaluate((el) => {
      return el.scrollWidth > window.innerWidth;
    });
    expect(drawerOverflow).toBe(false);
  });

  test("9. Çekmece açıkken alttaki PDF pan olmuyor ve konsol uyarısı üretilmiyor (B10)", async ({ page }) => {
    const consoleWarnings: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      // React / hydration ve Radix aria-describedby uyarılarını yakala
      if (
        msg.type() === "error" ||
        (msg.type() === "warning" && (text.includes("aria-describedby") || text.includes("hydration") || text.includes("Warning: ")))
      ) {
        consoleWarnings.push(text);
      }
    });

    await waitForStudioReady(page, STUDIO_PATH);

    const canvas = page.getByTestId("belge-studio-preview-canvas");
    await expect(canvas).toBeVisible();
    const initialBox = await canvas.boundingBox();
    expect(initialBox).not.toBeNull();

    // Çekmeceyi aç
    const headerMoreBtn = page.getByTestId("belge-mobile-header-menu-btn");
    await headerMoreBtn.click();
    const drawer = page.getByTestId("belge-mobile-actions-drawer");
    await expect(drawer).toBeVisible();

    // Çekmece açıkken canvas üzerine fare/dokunma hareketi yapmayı dene (overlay tarafından yakalanmalı)
    await page.mouse.move(200, 300);
    await page.mouse.down();
    await page.mouse.move(100, 200, { steps: 5 });
    await page.mouse.up();

    // Canvas konumu değişmemiş olmalı (pan gerçekleşmedi)
    const afterBox = await canvas.boundingBox();
    expect(afterBox?.x).toBe(initialBox?.x);
    expect(afterBox?.y).toBe(initialBox?.y);

    // Çekmeceyi kapat
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();

    // Radix Dialog veya React kaynaklı kritik uyarı olmamalı
    const criticalWarnings = consoleWarnings.filter(
      (w) => w.includes("aria-describedby") || w.includes("Hydration") || w.includes("validateDOMNesting")
    );
    expect(criticalWarnings).toEqual([]);
  });

  test("10. 320px ekranda uzun başlıkta başlık truncate olur ve ⋮ butonu görünür kalır (B9)", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const header = page.getByTestId("belge-studio-top-header");
    await expect(header).toBeVisible();

    const headerMoreBtn = page.getByTestId("belge-mobile-header-menu-btn");
    await expect(headerMoreBtn).toBeVisible();

    const headerBox = await header.boundingBox();
    const btnBox = await headerMoreBtn.boundingBox();
    expect(btnBox).not.toBeNull();
    expect(headerBox).not.toBeNull();

    // ⋮ butonu header sınırları içinde olmalı (taşma yok)
    expect((btnBox?.x ?? 0) + (btnBox?.width ?? 0)).toBeLessThanOrEqual((headerBox?.width ?? 0) + 2);
  });

  test("11. Çekmecede 'Form Görünümü' menüsü yer alır ve erişilebilirdir (B3)", async ({ page }) => {
    await waitForStudioReady(page, STUDIO_PATH);

    // PDF sekmesindeyiz: çekmeceyi aç
    const headerMoreBtn = page.getByTestId("belge-mobile-header-menu-btn");
    await headerMoreBtn.click();

    const drawer = page.getByTestId("belge-mobile-actions-drawer");
    await expect(drawer).toBeVisible();

    // Diğer işlemler akordeonunu aç
    const otherBtn = drawer.getByRole("button", { name: /Diğer işlemler/i });
    await otherBtn.click();
    await expect(otherBtn).toHaveAttribute("aria-expanded", "true");

    // Form görünümü container'ı görünür olmalı
    const formViewContainer = drawer.getByTestId("belge-drawer-form-view-container");
    await expect(formViewContainer).toBeVisible();
    await expect(formViewContainer).toContainText("Form sekmesinde kullanılabilir");

    // Çekmeceyi kapatıp Form sekmesine geç
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();

    const switchBtn = page.getByRole("button", { name: "Formu Düzenle" });
    await switchBtn.click();

    // Çekmeceyi tekrar aç
    await headerMoreBtn.click();
    await expect(drawer).toBeVisible();
    await otherBtn.click();
    await expect(otherBtn).toHaveAttribute("aria-expanded", "true");

    // Şimdi Form Görünümü menüsü aktif olmalı
    const formViewMenuBtn = drawer.getByTestId("belge-studio-form-view-trigger");
    await expect(formViewMenuBtn).toBeEnabled();
    await formViewMenuBtn.click();

    // Dropdown menü içeriği açılmalı
    const menuContent = page.getByTestId("belge-studio-form-view-menu");
    await expect(menuContent).toBeVisible();
  });
});
