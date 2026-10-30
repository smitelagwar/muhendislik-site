import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("compact offline control: mobile, tablet, desktop and popover keyboard interaction", async ({ page }) => {
  await page.goto("/belgeler", { waitUntil: "domcontentloaded" });
  const control = page.getByTestId("belgeler-offline-prepare");
  await expect(control).toBeVisible({ timeout: 20_000 });
  const details = page.getByTestId("belgeler-offline-details");
  const desktopToggle = control.getByRole("button", { name: "Çevrimdışı ayrıntılarını göster" });
  const mobileToggle = control.getByTestId("belgeler-offline-mobile-trigger");

  for (const width of [320, 360, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 860 });
    const toggle = width < 640 ? mobileToggle : desktopToggle;
    await expect(toggle).toBeVisible();
    if (width < 640) {
      await expect(mobileToggle).toHaveAttribute("title", "Çevrimdışı belgeler");
      await expect(desktopToggle).toBeHidden();
      const rect = await mobileToggle.boundingBox();
      const heading = await page.getByRole("heading", { name: "Belgeler ve Şablonlar" }).boundingBox();
      expect(rect).not.toBeNull();
      expect(heading).not.toBeNull();
      expect(rect!.y).toBeLessThan(heading!.y + heading!.height + 3);
    } else {
      await expect(mobileToggle).toBeHidden();
    }
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
  await desktopToggle.click();
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
  const mobileTrigger = control.getByTestId("belgeler-offline-mobile-trigger");
  if (await mobileTrigger.isVisible()) await mobileTrigger.click();
  else await control.getByRole("button", { name: "Çevrimdışı ayrıntılarını göster" }).click();
  await expect(page.getByTestId("belgeler-offline-details")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const after = await search.boundingBox();
  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(6); // Fonts/ambient animation may shift by a few device pixels
});


test("mobile offline icon explains unavailable browser instead of disappearing", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "caches", { configurable: true, value: undefined });
  });
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/belgeler", { waitUntil: "domcontentloaded" });
  const control = page.getByTestId("belgeler-offline-prepare");
  const button = control.getByTestId("belgeler-offline-mobile-trigger");
  await expect(button).toBeVisible({ timeout: 20_000 });
  await expect(button).toHaveAttribute("aria-label", /desteklenmiyor/);
  await button.click();
  const details = page.getByTestId("belgeler-offline-details");
  await expect(details).toBeVisible();
  await expect(details).toContainText("Bu tarayıcıda çevrimdışı kaydetme desteklenmiyor");
  await expect(details.getByRole("button", { name: "Şimdi indir" })).toHaveCount(0);
  const rect = await details.boundingBox();
  expect(rect).not.toBeNull();
  expect(rect!.x).toBeGreaterThanOrEqual(-1);
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(321);
  await details.getByRole("button", { name: "Ayrıntıları kapat" }).click();
  await expect(details).toHaveCount(0);
});
