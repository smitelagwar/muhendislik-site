import { test, expect } from "@playwright/test";

const PATH = "/kategori/araclar/duzensizlik-simulatoru";

test.describe("TBDY 3B düzensizlik stüdyosu regresyonları", () => {
  test("Altı bağımsız sahne, 2B yedek şemalar ve panel geçişi", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("irregularity-studio")).toBeVisible();
    await expect(page.getByTestId("irregularity-app-shell")).toBeVisible();
    await expect(page.getByRole("navigation", { name: /ana menü/i })).toHaveCount(0);
    await page.getByRole("button", { name: "2B çizime geç" }).click();
    await expect(page.getByTestId("irregularity-2d-diagram")).toBeVisible();
    for (const id of ["A1", "A2", "A3", "B1", "B2", "B3"]) {
      await page.getByRole("button", { name: new RegExp("^" + id + " ·") }).click();
      await expect(page.getByTestId("irregularity-2d-diagram")).toContainText("2B öğretici şema");
      await expect(page.getByRole("heading", { name: new RegExp("^" + id + " ·") })).toBeVisible();
    }
    await page.getByRole("button", { name: "Öğretici paneli kapat" }).first().click();
    await expect(page.getByRole("button", { name: "Öğretici paneli aç" })).toBeVisible();
    await page.getByRole("button", { name: "Öğretici paneli aç" }).click();
    await expect(page.getByRole("heading", { name: /^B3 ·/ })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("Mobil ekran sabit, panel kapatılabilir ve kontroller erişilebilir", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(PATH, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Öğretici paneli kapat" }).first().click();
    await page.getByRole("button", { name: "2B çizime geç" }).click();
    await expect(page.getByTestId("irregularity-2d-diagram")).toBeVisible();
    await page.getByRole("button", { name: "Öğretici paneli aç" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Öğretici paneli aç" })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      pageWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      pageHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    }));
    expect(dimensions.pageWidth - dimensions.viewportWidth).toBeLessThanOrEqual(2);
    expect(dimensions.pageHeight - dimensions.viewportHeight).toBeLessThanOrEqual(4);
    await expect(page.getByRole("link", { name: "Araçlara geri dön" })).toHaveAttribute("href", "/kategori/araclar");
  });
});
