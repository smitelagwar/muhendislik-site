import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("compact offline control: mobile, tablet, desktop and popover keyboard interaction", async ({ page }) => {
  await page.goto("/belgeler", { waitUntil: "domcontentloaded" });
  const control = page.getByTestId("belgeler-offline-prepare");
  await expect(control).toBeVisible({ timeout: 20_000 });
  const details = page.getByTestId("belgeler-offline-details");
  const toggle = control.getByRole("button", { name: "Çevrimdışı ayrıntılarını göster" });

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 860 });
    await expect(toggle).toBeVisible();
    await expect(details).toHaveCount(0);
    const metrics = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(metrics.scroll, "Page overflows at " + width).toBeLessThanOrEqual(metrics.viewport + 1);
    await toggle.click();
    await expect(details).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const rect = await details.boundingBox();
    expect(rect).not.toBeNull();
    expect(rect!.x).toBeGreaterThanOrEqual(-1);
    expect(rect!.x + rect!.width).toBeLessThanOrEqual(width + 1);
    await page.keyboard.press("Escape");
    await expect(details).toHaveCount(0);
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  }
  await toggle.click();
  await page.getByRole("heading", { name: "Belgeler ve Şablonlar" }).click();
  await expect(details).toHaveCount(0);
  await expect(page.getByPlaceholder(/Belge adı/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Stüdyoda doldur/ })).toHaveCount(5);
});

test("catalog offline details does not consume layout height", async ({ page }) => {
  await page.goto("/belgeler", { waitUntil: "domcontentloaded" });
  const control = page.getByTestId("belgeler-offline-prepare");
  await expect(control).toBeVisible({ timeout: 20_000 });
  const search = page.getByPlaceholder(/Belge adı/);
  await expect(search).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const before = await search.boundingBox();
  await control.getByRole("button", { name: "Çevrimdışı ayrıntılarını göster" }).click();
  await expect(page.getByTestId("belgeler-offline-details")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const after = await search.boundingBox();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(6); // Fonts/ambient animation may shift by a few device pixels
});
