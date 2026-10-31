import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("cancel persists across reload and requires explicit resume", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/belgeler", { waitUntil: "domcontentloaded" });
  const offline = page.getByTestId("belgeler-offline-prepare");
  const desktop = offline.getByTestId("belgeler-offline-desktop-primary");
  await expect(desktop).toBeVisible({ timeout: 20_000 });
  if (await desktop.innerText().then(text => /Çevrimdışı hazır/.test(text))) {
    await page.evaluate(async () => {
      localStorage.removeItem("belgeler:pwa:ready:v2");
      const names = await caches.keys();
      await Promise.all(names.filter(n => n.startsWith("belgeler-offline-v5-"))
        .map(n => caches.delete(n)));
    });
    await page.reload({ waitUntil: "domcontentloaded" });
  }
  await desktop.click();
  await offline.getByRole("button", { name: "Çevrimdışı ayrıntılarını göster" }).click();
  const panel = page.getByTestId("belgeler-offline-details");
  const cancel = panel.getByTestId("belgeler-offline-cancel-download");
  await expect(cancel).toBeVisible({ timeout: 12_000 });
  await cancel.click();
  await expect(panel).toContainText("İndirme iptal edildi");
  await expect(panel.getByRole("button", { name: "Kalanları indir" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem("belgeler:pwa:preparation:v4");
    return raw ? JSON.parse(raw).status : null;
  })).toBe("cancelled_by_user");

  await page.reload({ waitUntil: "domcontentloaded" });
  await offline.getByRole("button", { name: "Çevrimdışı ayrıntılarını göster" }).click();
  await expect(panel.getByRole("button", { name: "Kalanları indir" })).toBeVisible();
  // Focus / network / page show must never restart a user-cancelled job.
  await page.evaluate(() => {
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
    window.dispatchEvent(new Event("pageshow"));
  });
  await page.waitForTimeout(1600);
  await expect(panel.getByTestId("belgeler-offline-cancel-download")).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(
    localStorage.getItem("belgeler:pwa:preparation:v4") || "{}").status))
    .toBe("cancelled_by_user");

  await panel.getByRole("button", { name: "Kalanları indir" }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(
    localStorage.getItem("belgeler:pwa:preparation:v4") || "{}").status),
    { timeout: 15_000 }).not.toBe("cancelled_by_user");
});

test("mobile control offers a 44px cancel target without changing layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/belgeler", { waitUntil: "domcontentloaded" });
  const mobile = page.getByTestId("belgeler-offline-mobile-trigger");
  await expect(mobile).toBeVisible();
  const before = await page.getByPlaceholder(/Belge adı/).boundingBox();
  await mobile.click();
  const panel = page.getByTestId("belgeler-offline-details");
  await expect(panel).toBeVisible();
  const after = await page.getByPlaceholder(/Belge adı/).boundingBox();
  expect(Math.abs((after?.y || 0) - (before?.y || 0))).toBeLessThanOrEqual(6);
  if (await panel.getByRole("button", { name: "Şimdi indir" }).isVisible()) {
    await panel.getByRole("button", { name: "Şimdi indir" }).click();
  } else if (await panel.getByRole("button", { name: "Kalanları indir" }).isVisible()) {
    await panel.getByRole("button", { name: "Kalanları indir" }).click();
  }
  const cancel = panel.getByTestId("belgeler-offline-cancel-download");
  if (await cancel.isVisible()) {
    const rect = await cancel.boundingBox();
    expect(rect?.height).toBeGreaterThanOrEqual(44);
    await cancel.click();
    await expect(panel).toContainText("İndirme iptal edildi");
  }
});
