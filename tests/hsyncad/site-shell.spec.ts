import { expect, test } from "@playwright/test";

const cadRoute = "/kategori/araclar/hsyncad";

test("CAD viewport has its own chrome; regular tools retain normal site chrome", async ({ page }) => {
  await page.goto(cadRoute);
  const shell = page.getByTestId("hsyncad-app-shell");
  await expect(shell).toBeVisible();
  await expect(page.locator("[data-site-header]")).toHaveCount(0);
  await expect(page.getByTestId("global-bottom-nav")).toHaveCount(0);
  await expect(page.getByTestId("global-bottom-nav-spacer")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Araçlara dön" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "hsynCAD" })).toBeVisible();
  await expect(page.getByRole("button", { name: "JSON kaydet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Model aç" })).toBeVisible();
  const metrics = await shell.evaluate((node) => ({
    height: node.getBoundingClientRect().height,
    viewportHeight: window.innerHeight,
    overflowY: window.getComputedStyle(node).overflowY,
  }));
  expect(Math.abs(metrics.height - metrics.viewportHeight)).toBeLessThanOrEqual(1);
  expect(metrics.overflowY).toBe("hidden");

  await page.getByRole("link", { name: "Araçlara dön" }).click();
  await expect(page).toHaveURL(/\/kategori\/araclar\/?$/);
  await expect(page.locator("[data-site-header]")).toBeVisible();
  await expect(page.getByTestId("hsyncad-app-shell")).toHaveCount(0);
  await page.goBack();
  await expect(page.getByTestId("hsyncad-app-shell")).toBeVisible();
  await expect(page.locator("[data-site-header]")).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("hsyncad-app-shell")).toBeVisible();

  await page.goto("/kategori/araclar/donati-hesabi");
  await expect(page.locator("[data-site-header]")).toBeVisible();
  await expect(page.getByTestId("hsyncad-app-shell")).toHaveCount(0);
});

test("mobile CAD hides the global bottom bar and restores it on exit", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  try {
    const page = await context.newPage();
    await page.goto(cadRoute);
    await expect(page.getByTestId("hsyncad-app-shell")).toBeVisible();
    await expect(page.getByTestId("global-bottom-nav")).toHaveCount(0);
    await expect(page.getByTestId("global-bottom-nav-spacer")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Araçlara dön" })).toBeVisible();
    await page.getByRole("link", { name: "Araçlara dön" }).click();
    await expect(page).toHaveURL(/\/kategori\/araclar\/?$/);
    await expect(page.getByTestId("global-bottom-nav")).toBeVisible();
    await expect(page.getByTestId("global-bottom-nav-spacer")).toBeAttached();
  } finally {
    await context.close();
  }
});
