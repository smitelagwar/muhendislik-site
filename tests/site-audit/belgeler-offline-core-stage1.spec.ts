import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("stage 1: v5 publishes a verified manifest without destroying a v4 fallback", async ({ page, context }) => {
  test.setTimeout(300_000);
  await page.goto("/belgeler", { waitUntil: "domcontentloaded" });
  const button = page.getByTestId("belgeler-offline-desktop-primary");
  await expect(button).toBeVisible({ timeout: 20_000 });

  // An old generation must not be deleted while the new package is prepared.
  await page.evaluate(async () => {
    const legacy = await caches.open("belgeler-offline-v4-assets");
    await legacy.put("/belgeler/test-legacy-fallback", new Response("legacy-safe"));
  });
  if (!/Çevrimdışı hazır/.test(await button.innerText())) await button.click();
  await expect(button).toHaveText(/^Çevrimdışı hazır$/, { timeout: 250_000 });

  const prepared = await page.evaluate(async () => {
    const raw = localStorage.getItem("belgeler:pwa:ready:v2");
    const stamp = raw ? JSON.parse(raw) as {
      version: number; offlineVersion: string; manifestKey: string;
      assets: string[]; routes: number; buildAnchor: string;
    } : null;
    const marker = await (await caches.open("belgeler-offline-v5-meta"))
      .match("/belgeler-offline-v5-ready");
    const pages = await (await caches.open("belgeler-offline-v5-pages")).keys();
    const assets = await (await caches.open("belgeler-offline-v5-assets")).keys();
    const legacy = await (await caches.open("belgeler-offline-v4-assets"))
      .match("/belgeler/test-legacy-fallback");
    return {
      stamp, marker: marker ? await marker.text() : "",
      pages: pages.length, assets: assets.length, legacy: Boolean(legacy),
      preparingFrames: document.querySelectorAll('iframe[src*="__belgeler_prepare"]').length,
    };
  });
  expect(prepared.stamp?.version).toBe(2);
  expect(prepared.stamp?.offlineVersion).toBe("belgeler-offline-v5");
  expect(prepared.stamp?.assets.length).toBeGreaterThan(13);
  expect(prepared.stamp?.routes).toBe(6);
  expect(prepared.stamp?.buildAnchor).toBeTruthy();
  expect(prepared.marker).toBe(prepared.stamp?.manifestKey);
  expect(prepared.pages).toBe(6);
  expect(prepared.assets).toBeGreaterThanOrEqual(prepared.stamp?.assets.length || 0);
  expect(prepared.legacy).toBe(true);
  expect(prepared.preparingFrames).toBe(0);

  for (let i = 0; i < 15; i++) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(button).toHaveText(/^Çevrimdışı hazır$/, { timeout: 30_000 });
  }
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Belgeler ve Şablonlar" }))
    .toBeVisible({ timeout: 20_000 });
  await context.setOffline(false);
});

test("stage 1: clean installation does not report ready without the marker", async ({ page }) => {
  await page.goto("/belgeler", { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    localStorage.removeItem("belgeler:pwa:ready:v2");
    await (await caches.open("belgeler-offline-v5-meta"))
      .delete("/belgeler-offline-v5-ready");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("belgeler-offline-desktop-primary"))
    .not.toHaveText(/^Çevrimdışı hazır$/, { timeout: 30_000 });
});
