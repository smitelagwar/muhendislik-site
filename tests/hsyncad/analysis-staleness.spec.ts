import { test, expect } from "@playwright/test";

test("analysis cannot retain results after replacing its source model", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("tool-column").click();
  await page.getByTestId("coordinate-place").click();
  await page.locator('button[data-command-id="11760"]').click();
  const dialog = page.getByTestId("hsyncad-analysis-dialog");
  await expect(dialog).toContainText("Yaklaşık ön hesap");
  await page.getByTestId("analysis-close-btn").click();
  await page.getByTestId("tool-column").click();
  await page.getByTestId("coordinate-x").fill("4");
  await page.getByTestId("coordinate-place").click();
  // Reopening settings must calculate for two columns, not reuse the first result.
  await page.locator('button[data-command-id="11710"]').click();
  await expect(dialog.locator(".hcad-stat-card").first()).toContainText("24.0 kN");
  expect(errors).toEqual([]);
});
