import { test, expect } from "@playwright/test";
import { mockMixedExplorerData } from "./explorer-fixture";
import { DRIVE_GRID_MIN_CARD_WIDTH } from "../../src/components/dokumantasyon/drive-v3/drive-metrics";

test.describe("Dokümantasyon grid kartı görsel kabul", () => {
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

    const folder = page.getByTestId("dok-folder-card");
    await expect(folder).toHaveCount(1);
    const folderIconBox = await folder.getByTestId("dok-card-icon-stage").locator("svg").boundingBox();
    expect(folderIconBox).not.toBeNull();
    expect(folderIconBox!.width).toBeGreaterThanOrEqual(70);
    expect(folderIconBox!.height).toBeGreaterThanOrEqual(70);

    for (const kind of ["dwg", "dxf", "pdf", "markdown", "image", "spreadsheet"]) {
      await expect(page.locator(`[data-testid="dok-file-card"][data-file-kind="${kind}"]`)).toHaveCount(1);
    }

    const first = cards.first();
    const box = await first.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(DRIVE_GRID_MIN_CARD_WIDTH);
    expect(box!.height).toBeGreaterThanOrEqual(255);
    expect(box!.height).toBeLessThanOrEqual(265);

    const hero = first.getByTestId("dok-card-icon-stage").locator("svg");
    const heroBox = await hero.boundingBox();
    expect(heroBox).not.toBeNull();
    expect(heroBox!.width).toBeGreaterThanOrEqual(64);
    expect(heroBox!.height).toBeGreaterThanOrEqual(64);

    const selectionButton = first.locator("[data-selection-control]").first();
    const selectionBox = await selectionButton.boundingBox();
    const stageBox = await first.getByTestId("dok-card-icon-stage").boundingBox();
    expect(selectionBox).not.toBeNull();
    expect(stageBox).not.toBeNull();
    expect(stageBox!.y).toBeGreaterThanOrEqual(selectionBox!.y + selectionBox!.height - 2);

    await expect(first.getByTestId("dok-card-meta")).toBeVisible();
    await expect(first.getByTestId("dok-card-footer")).toBeVisible();

    const footerBox = await first.getByTestId("dok-card-footer").boundingBox();
    expect(footerBox).not.toBeNull();
    expect(footerBox!.y + footerBox!.height).toBeLessThanOrEqual(box!.y + box!.height + 1);

    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    await page.screenshot({ path: info.outputPath("grid-light-1920.png"), fullPage: true });

    await first.click({ position: { x: 8, y: 8 } });
    await expect(first).toHaveAttribute("data-selected", "true");
  });

  test("koyu temada kart hiyerarşisi ve okunabilirlik korunur", async ({ page }, info) => {
    await page.evaluate(() => document.documentElement.classList.add("dark"));

    const pdf = page.locator('[data-testid="dok-file-card"][data-file-kind="pdf"]');
    await expect(pdf).toBeVisible();
    const pdfChip = pdf.getByTestId("dok-card-meta").getByText("PDF", { exact: true });
    await expect(pdfChip).toBeVisible();

    const chipBackground = await pdfChip.evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(chipBackground).not.toBe("rgba(0, 0, 0, 0)");

    const stageBackground = await pdf.getByTestId("dok-card-icon-stage").evaluate((node) => getComputedStyle(node).backgroundImage);
    expect(stageBackground).toContain("radial-gradient");

    await page.screenshot({ path: info.outputPath("grid-dark-1920.png"), fullPage: true });
  });

  test("1366px genişlikte yatay taşma oluşturmaz", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await expect(page.getByTestId("dok-file-card").first()).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    const firstCard = page.getByTestId("dok-file-card").first();
    const firstBox = await firstCard.boundingBox();
    expect(firstBox).not.toBeNull();
    expect(firstBox!.width).toBeGreaterThan(145);

    const heroBox = await firstCard.getByTestId("dok-card-icon-stage").locator("svg").boundingBox();
    expect(heroBox).not.toBeNull();
    expect(heroBox!.width).toBeGreaterThanOrEqual(64);
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
