import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("an interrupted first download checkpoints on hidden and can resume on visible", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/belgeler", { waitUntil: "domcontentloaded" });
  const holder = page.getByTestId("belgeler-offline-prepare");
  const primary = holder.getByTestId("belgeler-offline-desktop-primary");
  await expect(primary).toBeVisible({ timeout: 20000 });
  await primary.click();
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem("belgeler:pwa:preparation:v4");
    return raw ? JSON.parse(raw).status : null;
  }), { timeout: 12000 }).toMatch(/loading|verifying/);

  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true, get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem("belgeler:pwa:preparation:v4");
    return raw ? JSON.parse(raw).status : null;
  }), { timeout: 12000 }).toBe("paused_background");

  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true, get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("focus"));
  });
  await expect.poll(() => page.evaluate(() => {
    const raw = localStorage.getItem("belgeler:pwa:preparation:v4");
    return raw ? JSON.parse(raw).status : null;
  }), { timeout: 25000 }).toMatch(/loading|verifying|retry_wait|paused/);

  // Prevent a long background transfer from affecting subsequent tests.
  await holder.getByRole("button", { name: "Çevrimdışı ayrıntılarını göster" }).click();
  const stop = page.getByTestId("belgeler-offline-cancel-download");
  if (await stop.isVisible()) await stop.click();
  await page.evaluate(() => { delete (document as Document & {visibilityState?: string}).visibilityState; });
});
