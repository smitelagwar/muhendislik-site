import { expect, test } from "@playwright/test";

test("Normal site kabuğu ve eski /p bulunmayan bağlantı ekranı production build'de çalışır", async ({ page }) => {
  const documentsResponse = await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
  expect(documentsResponse?.status()).toBe(200);
  await expect(page.locator("header[data-site-header]")).toBeVisible();
  await expect(page.getByRole("navigation").first()).toBeVisible();

  const globalFooterCount = await page.locator("footer").count();
  console.log(`ASAMA_13 shell observation: global footer element count=${globalFooterCount}`);

  const legacyShareResponse = await page.goto("/p/stage13-invalid-synthetic-token", {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  expect(legacyShareResponse?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Bağlantı Bulunamadı" })).toBeVisible();
  await expect(page.locator("header[data-site-header]")).toBeVisible();
  await expect(page.getByRole("navigation").first()).toBeVisible();
});
