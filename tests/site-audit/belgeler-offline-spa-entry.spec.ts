import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

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

test("eski worker ile ana sayfadan geçiş indirmeyi kurtarır", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const script = readFileSync("public/belgeler-sw.js", "utf8").replace(
    'if (message.type !== "GET_VERSION" && !allowedPage(pathOf(event.source.url))) return;',
    'if (!allowedPage(pathOf(event.source.url))) return;',
  );
  await page.route("**/belgeler-sw.js", route => route.fulfill({ status: 200, contentType: "text/javascript", body: script }));
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.register("/belgeler-sw.js", { scope: "/belgeler" });
    while (!registration.active) await new Promise(resolve => setTimeout(resolve, 100));
  });
  await page.unroute("**/belgeler-sw.js");
  await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration("/"))?.active)).toBe(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('a[href="/belgeler"]:visible').first().click();
  await page.getByTestId("belgeler-offline-desktop-primary").click();
  await expect(page.getByTestId("belgeler-offline-desktop-primary"))
    .toHaveText(/^Çevrimdışı hazır$/, { timeout: 60_000 });
});
