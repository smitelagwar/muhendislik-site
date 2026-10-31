import { expect, test, type Page } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

async function startAndWaitForPartial(page: Page) {
  await page.goto("/belgeler", { waitUntil: "domcontentloaded" });
  // Gecikme, kesintinin gerçekten indirme sırasında gerçekleşmesini sağlar.
  await page.route("**/fonts/Arial-Bold.ttf?__belgeler_prepare=1", async route => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    await route.continue().catch(() => {});
  });
  const button = page.getByTestId("belgeler-offline-desktop-primary");
  await expect(button).toBeEnabled();
  await button.click();
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem("belgeler:pwa:preparation:v4");
    return raw ? JSON.parse(raw).completed : 0;
  }), { timeout: 20_000 }).toBeGreaterThanOrEqual(3);
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("belgeler:pwa:preparation:v4") || "{}"));
  expect(journal.completed).toBeLessThan(journal.total);
  expect(journal.status).toBe("loading");
}

for (const interruption of ["reload", "close"] as const) {
  test(`indirme sırasında ${interruption === "reload" ? "F5" : "sekme kapanması"} sonrası devam`, async ({ page, context }) => {
    test.setTimeout(120_000);
    await startAndWaitForPartial(page);
    const originalPaths = await page.evaluate(async () => (await (await caches.open("belgeler-offline-v5-assets")).keys()).map(r => new URL(r.url).pathname));
    await page.unrouteAll({ behavior: "ignoreErrors" });
    if (interruption === "reload") {
      await page.reload({ waitUntil: "domcontentloaded" });
    } else {
      await page.close();
      page = await context.newPage();
      await page.goto("/belgeler", { waitUntil: "domcontentloaded" });
    }
    const button = page.getByTestId("belgeler-offline-desktop-primary");
    await expect(button).toHaveText(/^Çevrimdışı hazır$/, { timeout: 90_000 });
    const paths = await page.evaluate(async () => (await (await caches.open("belgeler-offline-v5-assets")).keys()).map(r => new URL(r.url).pathname));
    for (const path of originalPaths) expect(paths).toContain(path);
    await context.setOffline(true);
    await page.goto("/belgeler/beton-dokum-tutanagi", { waitUntil: "domcontentloaded" });
    await expect.poll(() => page.getByTestId("belge-studio-preview-canvas").locator("canvas").first()
      .evaluate(canvas => (canvas as HTMLCanvasElement).height).catch(() => 0), { timeout: 30_000 }).toBeGreaterThan(200);
  });
}
