import { expect, test, type Page } from "@playwright/test";

const ROUTES = [
  { path: "/belgeler/santiye-sefi-taahhutnamesi", name: "Taahhütname" },
  { path: "/belgeler/santiye-sefi-sozlesmesi", name: "Sözleşme", isMultipage: true },
  { path: "/belgeler/santiye-sefi-istifa-dilekcesi", name: "İstifa" },
  { path: "/belgeler/insaat-ruhsati-dilekcesi", name: "Ruhsat" },
  { path: "/belgeler/beton-dokum-tutanagi", name: "Beton Döküm" },
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

test.describe("Belgeler Unified Header — ASAMA_03 Portaled Toolbar & Single State Verification", () => {
  for (const route of ROUTES) {
    test(`[${route.name}] Toolbar is portaled into unified header slot: exactly 1 toolbar in DOM`, async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 });
      const studio = await waitForStudioReady(page, route.path);

      // 1. Toolbar count in DOM is EXACTLY 1
      const toolbars = page.locator('[data-testid="belge-studio-preview-toolbar"]');
      await expect(toolbars).toHaveCount(1);

      // 2. Toolbar is inside the unified header's toolbar slot
      const headerSlot = studio.locator('[data-testid="belge-unified-toolbar-slot"]');
      await expect(headerSlot).toBeVisible();
      await expect(headerSlot.locator('[data-testid="belge-studio-preview-toolbar"]')).toBeVisible();

      // 3. Inside preview panel, there is NO toolbar
      const previewPanel = studio.locator(".belge-preview-panel");
      await expect(previewPanel.locator('[data-testid="belge-studio-preview-toolbar"]')).toHaveCount(0);

      // 4. Zoom operations from the portaled toolbar work seamlessly
      const zoomLevel = studio.locator('[data-testid="belge-studio-zoom-level"]');
      const zoomInBtn = studio.locator('[data-testid="belge-studio-preview-toolbar"]').getByRole("button", { name: "Yakınlaştır" });
      const fitBtn = studio.locator('[data-testid="belge-studio-preview-toolbar"]').getByRole("button", { name: "Sığdır" });

      await expect(zoomLevel).toHaveText("%100");
      await zoomInBtn.click();
      await expect(zoomLevel).toHaveText("%125");
      await fitBtn.click();
      await expect(zoomLevel).toHaveText("%100");

      // 5. Canvas surface is intact and visible
      await expect(previewPanel.locator(".belge-preview-surface")).toBeVisible();
    });
  }

  test("Two-page contract navigation functions from portaled toolbar", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-sozlesmesi");

    const headerToolbar = studio.locator('[data-testid="belge-unified-toolbar-slot"] [data-testid="belge-studio-preview-toolbar"]');
    await expect(headerToolbar).toBeVisible();

    const pageLabel = headerToolbar.locator('[aria-label="PDF sayfaları"] span');
    const nextPageBtn = headerToolbar.getByRole("button", { name: "Sonraki sayfa" });
    const prevPageBtn = headerToolbar.getByRole("button", { name: "Önceki sayfa" });

    await expect(pageLabel).toHaveText("1 / 2");
    await expect(prevPageBtn).toBeDisabled();
    await expect(nextPageBtn).toBeEnabled();

    await nextPageBtn.click();
    await expect(pageLabel).toHaveText("2 / 2");
    await expect(nextPageBtn).toBeDisabled();
    await expect(prevPageBtn).toBeEnabled();

    await prevPageBtn.click();
    await expect(pageLabel).toHaveText("1 / 2");
    await expect(prevPageBtn).toBeDisabled();
  });

  test("Desktop PDF Focus mode toggle works from portaled toolbar", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    const focusToggle = studio.locator('[data-testid="belge-pdf-focus-toggle"]');
    await expect(focusToggle).toBeVisible();

    // Toggle focus: form becomes hidden
    await focusToggle.click();
    await expect(studio.locator('[data-testid="belge-studio-form-scroll"]')).toBeHidden();

    // Toggle back: form becomes visible again
    await focusToggle.click();
    await expect(studio.locator('[data-testid="belge-studio-form-scroll"]')).toBeVisible();
  });

  // V1.1 Sözleşmesi: Mobilde (<1024px) toolbar slotu gizlenir (hidden lg:flex),
  // kontroller yüzen pill (BelgeStudioMobileZoomPill) içindedir ve çift header/boş satır oluşmaz.
  test("Mobile 390x844: Single toolbar in slot, no double header or blank row", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    // Mobilde üst bar slotu gizlidir
    await expect(studio.locator('[data-testid="belge-unified-toolbar-slot"]')).toBeHidden();

    // Mobilde yüzen zoom pill görünürdür ve tek satırdır
    const pill = studio.locator('[data-testid="belge-studio-mobile-zoom-pill"]');
    await expect(pill).toBeVisible();

    // No desktop toolbar inside the preview panel
    await expect(studio.locator('.belge-preview-panel [data-testid="belge-studio-preview-toolbar"]')).toHaveCount(0);
  });
});
