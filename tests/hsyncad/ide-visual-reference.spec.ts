import { expect, test } from "@playwright/test";

test("IDE workspace uses normal 2D/3D controls and remains usable at 390px", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Dosya işlemleri" }).click();
  await page.getByTestId("ide-sample-mustafa-selvi-2").click();
  await expect(page.getByTestId("hsyncad-ide-import-report")).toContainText("532 eleman", { timeout: 30_000 });
  await expect(page.getByTestId("hsyncad-plan")).toBeVisible();
  await expect(page.getByTestId("hsyncad-ide-references").locator("polyline").first()).toBeAttached();
  await page.getByTestId("hsyncad-view-3d").click();
  await expect(page.getByTestId("hsyncad-3d-canvas")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const bounds = (await page.getByTestId("hsyncad-workbench").boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(-1);
  expect(bounds.width).toBeCloseTo(390, 0);
  await page.screenshot({ path: testInfo.outputPath("integrated-ide-mobile.png") });
  expect(errors).toEqual([]);
});
