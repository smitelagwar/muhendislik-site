import { expect, test, type Page } from "@playwright/test";

const VIEWPORTS = [
  320, 360, 390, 412, 640, 768, 911, 1024, 1093, 1280, 1366, 1440, 1536, 1920, 2560,
];

async function waitForStudioReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  const downloadBtn = studio
    .locator('[data-testid="belge-studio-desktop-actions"]:visible, [data-testid="belge-studio-mobile-actions"]:visible')
    .getByRole("button", { name: "PDF İndir", exact: true });
  await expect(downloadBtn).toBeEnabled({ timeout: 25_000 });
  return studio;
}

test.describe("Belgeler Unified Header — ASAMA_04 Responsive Priority & Overflow Menu", () => {
  test("Responsive Matrix: 15 Viewports have NO horizontal body overflow & header is single line", async ({ page }) => {
    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/belgeler/santiye-sefi-taahhutnamesi", { waitUntil: "domcontentloaded" });

      const header = page.locator('[data-testid="belge-studio-top-header"]');
      await expect(header).toBeVisible();

      const evaluation = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const headerEl = document.querySelector('[data-testid="belge-studio-top-header"]') as HTMLElement | null;
        return {
          hasHorizontalOverflow: docWidth > winWidth,
          headerHeight: headerEl ? headerEl.offsetHeight : 0,
          scrollWidth: docWidth,
          innerWidth: winWidth,
        };
      });

      expect(evaluation.hasHorizontalOverflow).toBe(false);
      // Normal text font: mobile <= 56px, desktop <= 64px
      if (width < 1024) {
        expect(evaluation.headerHeight).toBeLessThanOrEqual(56);
      } else {
        expect(evaluation.headerHeight).toBeLessThanOrEqual(64);
      }
    }
  });

  test("Mobile 320x568: Touch targets >= 44px min-height, single line, no clipping", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const header = studio.locator('[data-testid="belge-studio-top-header"]');
    await expect(header).toBeVisible();

    const evaluation = await page.evaluate(() => {
      const headerEl = document.querySelector('[data-testid="belge-studio-top-header"]') as HTMLElement;
      const backBtn = headerEl.querySelector('a[aria-label="Tüm belgelere dön"]') as HTMLElement;
      const moreBtn = headerEl.querySelector('[data-testid="belge-mobile-header-menu-btn"]') as HTMLElement;

      return {
        headerHeight: headerEl.offsetHeight,
        backBtnHeight: backBtn?.offsetHeight ?? 0,
        moreBtnHeight: moreBtn?.offsetHeight ?? 0,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });

    expect(evaluation.overflow).toBe(false);
    expect(evaluation.headerHeight).toBeLessThanOrEqual(56);
    expect(evaluation.backBtnHeight).toBeGreaterThanOrEqual(44);
    expect(evaluation.moreBtnHeight).toBeGreaterThanOrEqual(44);
  });

  // V1.1 Sözleşmesi: Mobilde toolbar menüsü yerine alt çekmece ("Belge İşlemleri") ve yüzen pill kullanılır.
  test("Mobile 390x844: Alt çekmece (⋯) açılır ve eylemler işlevseldir", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const moreBtn = studio.getByTestId("belge-studio-mobile-actions").getByTestId("belge-mobile-more-btn");
    await expect(moreBtn).toBeVisible();
    await moreBtn.click();

    const drawer = page.getByTestId("belge-mobile-actions-drawer");
    await expect(drawer).toBeVisible();

    // Verify Theme card is present in drawer
    const themeOption = drawer.getByTestId("belge-mobile-theme-card");
    await expect(themeOption).toBeVisible();

    // Verify New tab option is present under "Diğer işlemler"
    await drawer.getByRole("button", { name: "Diğer işlemler" }).click();
    const externalLink = drawer.getByRole("link", { name: /yeni sekmede aç/i });
    await expect(externalLink).toBeVisible();

    // Sığdır doğrudan yüzen pill üzerindedir
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    const pill = studio.getByTestId("belge-studio-mobile-zoom-pill");
    const fitOption = pill.getByRole("button", { name: "Sayfayı Sığdır", exact: true });
    await expect(fitOption).toBeVisible();
    await fitOption.click();
  });

  // V1.1 Sözleşmesi: Çok sayfalı belgede sayfa geçişleri doğrudan yüzen pill üzerinden yönetilir.
  test("Mobile 390x844: Çok sayfalı sözleşmede yüzen pill üzerinden sayfa navigasyonu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-sozlesmesi");

    const pill = studio.getByTestId("belge-studio-mobile-zoom-pill");
    await expect(pill).toBeVisible();

    // Verify page info "1 / 2"
    await expect(pill.getByText(/1\s*\/\s*2/)).toBeVisible();

    // Advance to page 2 via next page button in pill
    const nextBtn = pill.getByRole("button", { name: "Sonraki sayfa" });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    // Verify page updated to 2 / 2
    await expect(pill.getByText(/2\s*\/\s*2/)).toBeVisible();
    await expect(nextBtn).toBeDisabled();
  });

  test("Mobile Landscape 844x390: Header remains single line, no horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const header = studio.locator('[data-testid="belge-studio-top-header"]');
    await expect(header).toBeVisible();

    const evaluation = await page.evaluate(() => {
      const headerEl = document.querySelector('[data-testid="belge-studio-top-header"]') as HTMLElement;
      return {
        headerHeight: headerEl ? headerEl.offsetHeight : 0,
        overflow: document.documentElement.scrollWidth > window.innerWidth,
      };
    });

    expect(evaluation.overflow).toBe(false);
    expect(evaluation.headerHeight).toBeLessThanOrEqual(56);
  });
});
