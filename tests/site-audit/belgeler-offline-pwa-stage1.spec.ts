import { expect, test } from "@playwright/test";

const routes = [
  "/belgeler/beton-dokum-tutanagi",
  "/belgeler/santiye-sefi-taahhutnamesi",
  "/belgeler/santiye-sefi-istifa-dilekcesi",
  "/belgeler/insaat-ruhsati-dilekcesi",
  "/belgeler/santiye-sefi-sozlesmesi",
];

test.use({ serviceWorkers: "allow" });
test("belge catalog and all five PDF previews survive a cold offline reload", async ({ page, context }) => {
  test.setTimeout(300_000);
  await page.goto("/belgeler", { waitUntil: "domcontentloaded" });
  const prepare = page.getByTestId("belgeler-offline-prepare").getByRole("button");
  await expect(prepare).toBeVisible();
  await prepare.click();
  await expect(prepare).toHaveText(/^Çevrimdışı hazır$/, { timeout: 250_000 });

  const scope = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration("/belgeler");
    return registration?.scope;
  });
  expect(scope).toMatch(/\/belgeler\/?$/);
  const before = await page.evaluate(async () => {
    const names = await caches.keys();
    const entries = await Promise.all(names.map(async name => ({
      name, paths: (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname)
    })));
    return { controller: navigator.serviceWorker.controller?.scriptURL, names, entries };
  });
  console.log("PRE_OFFLINE_CACHE", JSON.stringify(before));
  await context.setOffline(true);
  for (const route of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    if (!await page.locator("[data-testid='belge-studio-preview-canvas'] canvas").count()) {
      const after = await page.evaluate(async () => ({
        url: location.href, controlled: !!navigator.serviceWorker.controller,
        cacheHit: !!(await caches.match(location.pathname)),
        cacheNames: await caches.keys(),
        title: document.title
      }));
      console.log("OFFLINE_NAV_DEBUG", JSON.stringify(after));
    }
    await expect(page.locator("[data-testid='belge-studio-preview-canvas'] canvas")).toBeVisible({ timeout: 25_000 });
    // Canvas exists at its HTML default 300x150 before PDF.js paints. Wait for rasterized page.
    await expect.poll(
      async () => page.locator("[data-testid='belge-studio-preview-canvas'] canvas").evaluate(
        (canvas) => ({ width: (canvas as HTMLCanvasElement).width, height: (canvas as HTMLCanvasElement).height })
      ),
      { timeout: 30_000, message: "PDF sayfası çevrimdışı çizilmedi: " + route }
    ).toMatchObject({ width: expect.any(Number), height: expect.any(Number) });
    await expect.poll(
      async () => page.locator("[data-testid='belge-studio-preview-canvas'] canvas").evaluate(
        (canvas) => (canvas as HTMLCanvasElement).height
      ),
      { timeout: 30_000 }
    ).toBeGreaterThan(200);
  }
  await page.goto("/belgeler");
  await expect(page.getByRole("heading", { name: "Belgeler ve Şablonlar" })).toBeVisible();
  await context.setOffline(false);
});
test("other portal routes are outside the registered SW scope", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/belgeler");
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(scope).toMatch(/\/belgeler\/?$/);
  const scopes = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map((r) => r.scope));
  expect(scopes.every((s) => /\/belgeler\/?$/.test(s))).toBeTruthy();
});
