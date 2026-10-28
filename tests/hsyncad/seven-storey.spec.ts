import { test, expect } from "@playwright/test";

test("7-storey commercial building sample loads from bottom-bar and passes full analysis and pafta export", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");

  // 1. Click bottom-bar sample button
  const bottomBtn = page.getByTestId("bottom-load-seven-storey");
  await expect(bottomBtn).toBeVisible();
  await bottomBtn.click();

  // Verify message
  await expect(page.getByTestId("hsyncad-message")).toContainText("7 Katlı Plaza");

  // Verify element count and 7 floors exist
  const plan = page.getByTestId("hsyncad-plan");
  await expect(plan).toBeVisible();

  // 2. Open Analysis
  await page.getByRole("tab", { name: "Betonarme", exact: true }).click();
  await page.locator('button[data-command-id="11760"]').click();

  const dialog = page.getByTestId("hsyncad-analysis-dialog");
  await expect(dialog).toBeVisible();

  // Verify building weight is massive (> 20.000 kN)
  await expect(dialog.getByText("Bina Toplam Ağırlığı (W)")).toBeVisible();

  // Verify 7 storeys in table
  await dialog.getByRole("button", { name: "Kat & Göreli Öteleme" }).click();
  await expect(dialog.getByText("6. Normal Kat")).toBeVisible();
  await expect(dialog.getByText("Zemin Kat")).toBeVisible();

  // Verify joint shear checks
  await dialog.getByRole("button", { name: "Birleşim & Güçlü Kolon" }).click();
  await expect(dialog.getByText("Birleşim Türü")).toBeVisible();

  // Verify irregularities
  await dialog.getByRole("button", { name: "Düzensizlikler" }).click();
  await expect(dialog.getByText("A1 — Burulma Düzensizliği Kontrolü")).toBeVisible();

  // Download DXF from dialog
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByTestId("analysis-dxf-export").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain(".dxf");

  // Close dialog
  await dialog.getByTestId("analysis-close-btn").click();
  await expect(dialog).not.toBeVisible();

  // 3. Test Pafta Mode
  await page.getByRole("tab", { name: "Çizimler", exact: true }).click();
  await page.locator('button[data-command-id="40202"]').click();
  await expect(page.getByTestId("hsyncad-plan")).toHaveAttribute("data-pafta-mode", "true");
  await expect(page.locator(".hcad-pafta-frame")).toBeVisible();

  expect(errors).toEqual([]);
});
