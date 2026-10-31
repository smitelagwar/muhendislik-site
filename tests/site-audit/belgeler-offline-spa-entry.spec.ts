import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("ana sayfadan geçişte indirme tamamlanır ve belgeler çevrimdışı açılır", async ({ page, context }) => {
  test.setTimeout(300_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration("/");
    return registration?.active?.scriptURL.endsWith("/belgeler-home-sw.js") ?? false;
  }), { timeout: 20_000 }).toBe(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? ""))
    .toContain("/belgeler-home-sw.js");
  await page.locator('a[href="/belgeler"]:visible').first().click();
  await expect(page).toHaveURL(/\/belgeler$/);
  // Next.js geçişi aynı belgeyi korur; kök worker hâlâ sekmeyi kontrol eder.
  expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toContain("/belgeler-home-sw.js");
  const button = page.getByTestId("belgeler-offline-desktop-primary");
  await button.click();
  await expect(button).toHaveText(/^Çevrimdışı hazır$/, { timeout: 30_000 });
  await context.setOffline(true);
  await page.goto("/belgeler/beton-dokum-tutanagi", { waitUntil: "domcontentloaded" });
  await expect.poll(() => page.getByTestId("belge-studio-preview-canvas").locator("canvas").first()
    .evaluate(canvas => (canvas as HTMLCanvasElement).height).catch(() => 0), { timeout: 30_000 }).toBeGreaterThan(200);
});
