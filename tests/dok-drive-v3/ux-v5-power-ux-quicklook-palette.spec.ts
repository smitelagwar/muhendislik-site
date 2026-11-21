import { test, expect, type Page } from "@playwright/test";
import { mockMixedExplorerData } from "./explorer-fixture";

async function setTheme(page: Page, mode: "dark" | "light") {
  await page.evaluate(async (targetMode) => {
    if (targetMode === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
  }, mode);
}

async function setupPowerUxMocks(page: Page) {
  await mockMixedExplorerData(page);

  await page.route("**/api/dokumantasyon/folders/tree", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        folders: [
          {
            id: "folder-mixed",
            name: "agss",
            parent_id: null,
            created_at: "2026-09-10T06:00:00.000Z",
            updated_at: "2026-09-10T06:00:00.000Z",
            deleted_at: null,
            starred_at: null,
          },
        ],
      }),
    });
  });

  await page.route("**/api/dokumantasyon/files/*/versions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        versions: [{ version_number: 1 }, { version_number: 2 }],
      }),
    });
  });

  await page.route("**/api/dokumantasyon/search**", async (route) => {
    const url = new URL(route.request().url());
    const q = (url.searchParams.get("q") || "").toLocaleLowerCase("tr-TR");
    const matchesPdf = q.includes("demirci");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        folders: [],
        files: matchesPdf
          ? [
              {
                id: "mixed-2",
                folder_id: null,
                display_name: "A3 KAĞIT DEMİRCİYE VERİLECEK HER KATTA-Model.pdf",
                size_bytes: 2_612_224,
                mime_type: "application/pdf",
                extension: "pdf",
                created_at: "2026-09-10T06:00:00.000Z",
                updated_at: "2026-09-10T06:00:00.000Z",
              },
            ]
          : [],
      }),
    });
  });
}

test.describe("UX V5 Paket 3 — Quick Look, Komut Paleti, Thumbnail & Detay Çekmecesi", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupPowerUxMocks(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();
    await setTheme(page, "dark");
  });

  test("S3.1 — Space Quick Look, galeri gezintisi, zoom ve CAD kartı (+ G4)", async ({ page }, info) => {
    const pngRow = page.getByTestId("dok-file-row").filter({ hasText: ".png" });
    await pngRow.locator("[data-selection-control]").click();
    await expect(pngRow).toHaveAttribute("data-selected", "true");

    await page.keyboard.press("Space");
    const modal = page.getByTestId("dok-quick-look-modal");
    await expect(modal).toBeVisible();
    expect(page.url()).toContain("/dokumantasyon");
    expect(page.url()).not.toContain("/dokumantasyon/dosya/");

    const dialog = page.getByTestId("dok-dialog-content");
    await expect(dialog.locator("img")).toBeVisible();
    await page.screenshot({
      path: info.outputPath("v5-04-dark-quick-look.png"),
      animations: "disabled",
    });

    const zoomInBtn = dialog.getByRole("button", { name: "Yakınlaştır" });
    await zoomInBtn.click();
    await expect(dialog.getByText("125%", { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "Uzaklaştır" }).click();
    await expect(dialog.getByText("100%", { exact: true })).toBeVisible();

    // İlk dosya (.dwg) için geri git
    const prevBtn = page.getByTestId("dok-quick-look-prev");
    for (let i = 0; i < 4; i++) {
      await prevBtn.click();
    }
    await expect(dialog.getByText("CAD Studio'da Aç")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
  });

  test("S3.2 — Ctrl+K Komut Paleti, arama ve Kart görünüm geçişi (+ G5)", async ({ page }, info) => {
    await page.keyboard.press("Control+k");
    const palette = page.getByTestId("dok-command-palette");
    await expect(palette).toBeVisible();

    const searchInput = palette.getByRole("textbox", { name: "Komut paleti araması" });
    await searchInput.fill("DEMİRCİ");
    await expect(palette.getByText("A3 KAĞIT DEMİRCİYE VERİLECEK HER KATTA-Model.pdf")).toBeVisible();

    await page.screenshot({
      path: info.outputPath("v5-05-dark-command-palette.png"),
      animations: "disabled",
    });

    await searchInput.fill("Kart");
    await expect(palette.getByText("A3 KAĞIT DEMİRCİYE VERİLECEK HER KATTA-Model.pdf")).toBeHidden();
    await expect(palette.getByText("Kart (Grid) Görünümü")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(palette).toBeHidden();
    await expect(page.getByTestId("dok-file-card").first()).toBeVisible();
  });

  test("S3.3 — Grid lazy image thumbnail & liste uzantı rozeti/tarih tooltip (+ G3)", async ({ page }, info) => {
    await page.getByRole("button", { name: "Kart (Grid) Görünümü", exact: true }).click();
    const imgCard = page.locator('[data-testid="dok-file-card"][data-file-kind="image"]');
    await expect(imgCard).toBeVisible();

    const thumb = imgCard.getByTestId("dok-card-icon-stage").locator("img");
    await expect(thumb).toBeVisible();
    await expect
      .poll(() =>
        thumb.evaluate((node) => {
          const el = node as HTMLImageElement;
          return el.complete && el.naturalWidth > 0;
        })
      )
      .toBe(true);

    // İki kart seçerek G3 ekran görüntüsünü yakala
    await imgCard.locator("[data-selection-control]").click();
    const pdfCard = page.locator('[data-testid="dok-file-card"][data-file-kind="pdf"]');
    await pdfCard.locator("[data-selection-control]").click();

    await page.screenshot({
      path: info.outputPath("v5-03-dark-grid-thumbs.png"),
      animations: "disabled",
    });

    // Liste görünümüne dön ve uzantı rozeti + tarih tooltip kontrolü yap
    await page.getByRole("button", { name: "Liste Görünümü", exact: true }).click();
    const dwgRow = page.getByTestId("dok-file-row").filter({ hasText: ".dwg" });
    await expect(dwgRow).toBeVisible();
    await expect(dwgRow.locator("span", { hasText: /^DWG$/ })).toBeVisible();
    const dateWithTitle = dwgRow.locator("[title]").first();
    await expect(dateWithTitle).toBeVisible();
  });

  test("S3.4 — Detay Çekmecesi tekil link kopyala ve çoklu seçim tür dağılımı (+ G7)", async ({ page }, info) => {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

    // Detay çekmecesini aç
    const toggleDetailsBtn = page.getByRole("button", { name: "Detay panelini aç/kapat" });
    await toggleDetailsBtn.click();

    // Tekil görsel seç -> Stüdyo Linkini Kopyala
    const imgRow = page.getByTestId("dok-file-row").filter({ hasText: ".png" });
    await imgRow.locator("[data-selection-control]").click();

    const copyLinkBtn = page.getByRole("button", { name: "Stüdyo Linkini Kopyala" });
    await expect(copyLinkBtn).toBeVisible();
    await copyLinkBtn.click();
    await expect(page.getByText("Link kopyalandı")).toBeVisible();

    // Çoklu seçim yap -> Seçim Tür Dağılımı
    const pdfRow = page.getByTestId("dok-file-row").filter({ hasText: ".pdf" });
    await pdfRow.locator("[data-selection-control]").click();
    const dwgRow = page.getByTestId("dok-file-row").filter({ hasText: ".dwg" });
    await dwgRow.locator("[data-selection-control]").click();

    await expect(page.getByText("Seçim Tür Dağılımı")).toBeVisible();

    await page.screenshot({
      path: info.outputPath("v5-07-dark-details-multi.png"),
      animations: "disabled",
    });
  });
});
