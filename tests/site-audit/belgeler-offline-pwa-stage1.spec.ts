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
  await expect(prepare).toHaveText(/Çevrimdışı hazır/, { timeout: 250_000 });

  const scope = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration("/belgeler");
    return registration?.scope;
  });
  expect(scope).toMatch(/\/belgeler$/);
  await context.setOffline(true);
  for (const route of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-testid='belge-studio-preview-canvas'] canvas")).toBeVisible({ timeout: 25_000 });
    const dimensions = await page.locator("[data-testid='belge-studio-preview-canvas'] canvas").evaluate(
      (canvas) => ({ width: (canvas as HTMLCanvasElement).width, height: (canvas as HTMLCanvasElement).height })
    );
    expect(dimensions.width).toBeGreaterThan(200);
    expect(dimensions.height).toBeGreaterThan(200);
  }
  await page.goto("/belgeler");
  await expect(page.getByRole("heading", { name: "Belgeler ve Şablonlar" })).toBeVisible();
  await context.setOffline(false);
});
test("other portal routes are outside the registered SW scope", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/belgeler");
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration("/belgeler")), { timeout: 20000 });
  const scopes = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map((r) => r.scope));
  expect(scopes.some((s) => s.endsWith("/belgeler"))).toBeTruthy();
  expect(scopes.some((s) => s.endsWith("/") && !s.endsWith("/belgeler"))).toBeFalsy();
});
