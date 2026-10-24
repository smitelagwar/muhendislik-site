import { expect, test, type Page } from "@playwright/test";

const ROUTES = [
  {
    path: "/belgeler/santiye-sefi-taahhutnamesi",
    expectedTitle: "Şantiye Şefi Taahhütnamesi",
    expectedSubtitle: "Görev Üstlenme & Yasal Sorumluluk Formu",
  },
  {
    path: "/belgeler/santiye-sefi-sozlesmesi",
    expectedTitle: "Şantiye Şefi Hizmet Sözleşmesi",
    expectedSubtitle: "Müteahhit ↔ Şantiye Şefi 2 Sayfalı Hizmet Akdi",
  },
  {
    path: "/belgeler/santiye-sefi-istifa-dilekcesi",
    expectedTitle: "Şantiye Şefi İstifa Dilekçesi",
    expectedSubtitle: "Resmî Görevden Ayrılma & İdareye Bildirim Dilekçesi",
  },
  {
    path: "/belgeler/insaat-ruhsati-dilekcesi",
    expectedTitle: "İnşaat Ruhsatı Dilekçesi",
    expectedSubtitle: "Yapı Ruhsatı Başvuru & İdareye Talep Dilekçesi",
    hasExtraAction: true,
  },
  {
    path: "/belgeler/beton-dokum-tutanagi",
    expectedTitle: "Beton Döküm Tutanağı",
    expectedSubtitle: "Şantiye Beton Döküm & Kalite Kontrol Formu",
  },
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

test.describe("Belgeler Unified Header — ASAMA_02 Semantics & 5 Studio Verification", () => {
  for (const route of ROUTES) {
    test(`Route ${route.path} has single semantic h1, unified header, navigation and draft badge`, async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 768 });
      const studio = await waitForStudioReady(page, route.path);

      // 1. Exactly 1 <h1> on the entire page
      const h1s = page.getByRole("heading", { level: 1 });
      await expect(h1s).toHaveCount(1);
      await expect(h1s.first()).toHaveText(route.expectedTitle);

      // 2. Unified header is present
      const topHeader = studio.locator('[data-testid="belge-studio-top-header"]');
      await expect(topHeader).toBeVisible();

      // 3. Navigation to /belgeler exists and is visible
      const backNav = topHeader.getByRole("navigation", { name: "Belge stüdyosu gezinme" });
      await expect(backNav).toBeVisible();
      const backLink = backNav.getByRole("link", { name: "Tüm belgelere dön" });
      await expect(backLink).toBeVisible();
      await expect(backLink).toHaveAttribute("href", "/belgeler");

      // 4. Portal slot is present and mounted
      const slot = topHeader.locator('[data-testid="belge-unified-toolbar-slot"]');
      await expect(slot).toBeAttached();

      // 5. Draft badge and sync status are attached (V3 minimal draft: sessiz boş başlangıç durumu)
      const draftBadge = topHeader.locator('[data-testid="belge-draft-status-badge"]');
      await expect(draftBadge).toBeAttached();

      // 6. Subtitle is present
      await expect(topHeader.getByText(route.expectedSubtitle)).toBeVisible();

      // 7. Extra action check if applicable (e.g. İnşaat Ruhsatı "Örnek Veri")
      if (route.hasExtraAction) {
        const extraBtn = topHeader.getByRole("button", { name: /örnek veri/i });
        await expect(extraBtn).toBeVisible();
      }

      // 8. Form scroll container and PDF preview are functional
      await expect(studio.locator('[data-testid="belge-studio-form-scroll"]')).toBeVisible();
      await expect(studio.locator(".belge-preview-surface")).toBeVisible();
    });
  }

  test("Mobile 390x844: Single h1, back button, no duplicate header, and clean viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const studio = await waitForStudioReady(page, "/belgeler/santiye-sefi-taahhutnamesi");

    // Exactly 1 <h1>
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    // Back link is visible and accessible on mobile
    const backLink = studio.getByRole("link", { name: "Tüm belgelere dön" });
    await expect(backLink).toBeVisible();

    // Draft badge is attached on mobile
    await expect(studio.locator('[data-testid="belge-draft-status-badge"]')).toBeAttached();

    // No horizontal scroll
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  });
});
