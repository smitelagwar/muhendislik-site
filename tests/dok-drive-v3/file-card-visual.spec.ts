import { test, expect } from "@playwright/test";
import { mockMixedExplorerData } from "./explorer-fixture";

test.describe("Dökümantasyon grid kartı görsel kabul", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await mockMixedExplorerData(page);
    await page.goto("/dokumantasyon");
    await page.getByRole("button", { name: "Kart (Grid) Görünümü", exact: true }).click();
    await expect(page.getByTestId("dok-file-card").first()).toBeVisible();
  });

  test("karma dosya türleri büyük ikon, chip ve footer ile dolu görünür", async ({ page }, info) => {
    const cards = page.getByTestId("dok-file-card");
    await expect(cards).toHaveCount(6);

    for (const kind of ["dwg", "dxf", "pdf", "markdown", "image", "spreadsheet"]) {
      await expect(page.locator(`[data-testid="dok-file-card"][data-file-kind="${kind}"]`)).toHaveCount(1);
    }

    const first = cards.first();
    const box = await first.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(200);
    expect(box!.height).toBeGreaterThanOrEqual(255);
    expect(box!.height).toBeLessThanOrEqual(265);

    const hero = first.getByTestId("dok-card-icon-stage").locator("svg");
    const heroBox = await hero.boundingBox();
    expect(heroBox).not.toBeNull();
    expect(heroBox!.width).toBeGreaterThanOrEqual(64);
    expect(heroBox!.height).toBeGreaterThanOrEqual(64);

    await expect(first.getByTestId("dok-card-meta")).toBeVisible();
    await expect(first.getByTestId("dok-card-footer")).toBeVisible();

    const footerBox = await first.getByTestId("dok-card-footer").boundingBox();
    expect(footerBox).not.toBeNull();
    expect(footerBox!.y + footerBox!.height).toBeLessThanOrEqual(box!.y + box!.height + 1);

    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.screenshot({ path: info.outputPath("grid-light-1920.png"), fullPage: true });
  });

  test("koyu temada kart hiyerarşisi ve okunabilirlik korunur", async ({ page }, info) => {
    await page.evaluate(() => document.documentElement.classList.add("dark"));

    const pdf = page.locator('[data-testid="dok-file-card"][data-file-kind="pdf"]');
    await expect(pdf).toBeVisible();
    await expect(pdf.getByText("PDF", { exact: true })).toBeVisible();

    await page.screenshot({ path: info.outputPath("grid-dark-1920.png"), fullPage: true });
  });

  test("uzun dosya adı karta taşmaz ve aksiyonlar çalışır", async ({ page }) => {
    const longNameCard = page.locator('[data-testid="dok-file-card"][data-file-kind="dxf"]');
    const name = longNameCard.getByTestId("dok-file-name");

    const cardBox = await longNameCard.boundingBox();
    const nameBox = await name.boundingBox();
    expect(cardBox).not.toBeNull();
    expect(nameBox).not.toBeNull();
    expect(nameBox!.x).toBeGreaterThanOrEqual(cardBox!.x);
    expect(nameBox!.x + nameBox!.width).toBeLessThanOrEqual(cardBox!.x + cardBox!.width + 1);
    expect(nameBox!.y + nameBox!.height).toBeLessThanOrEqual(cardBox!.y + cardBox!.height);

    const star = longNameCard.getByRole("button", { name: "Yıldızla" });
    await expect(star).toBeVisible();

    const menu = longNameCard.getByRole("button", { name: "Dosya İşlemleri" });
    await menu.click();
    await expect(page.getByText("Önizle / Studio", { exact: true })).toBeVisible();
  });
});
