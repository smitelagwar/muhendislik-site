import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("root-worker registration, completed cache and 15 F5 reloads stay consistent", async ({ page, context }) => {
  test.setTimeout(420_000);
  await page.goto("/", {waitUntil:"domcontentloaded"});
  await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations())
    .some(r => new URL(r.scope).pathname === "/")), {timeout:20000}).toBe(true);
  await page.goto("/belgeler", {waitUntil:"domcontentloaded"});
  const holder = page.getByTestId("belgeler-offline-prepare");
  const primary = holder.getByRole("button", {name:/Çevrimdışı (kullanıma hazırla|hazır|hazırlanıyor|kontrol ediliyor)|Eksik indirmeye devam et/}).first();
  await expect(primary).toBeVisible({timeout:20000});
  await expect(primary).not.toHaveText(/0\/1/);
  await expect(primary).toHaveText(/Çevrimdışı kullanıma hazırla|Çevrimdışı hazır/, {timeout:25000});
  if (!/hazır$/.test((await primary.innerText()).trim())) await primary.click();
  await page.waitForFunction(() => {
    const label = document.querySelector("[data-testid='belgeler-offline-desktop-primary']")?.textContent || "";
    return label.trim() === "Çevrimdışı hazır" || label.includes("Eksik indirmeye devam et");
  }, null, {timeout:300000});
  if ((await primary.innerText()).includes("Eksik indirmeye")) {
    await holder.getByRole("button", {name:"Çevrimdışı ayrıntılarını göster"}).click();
    const details = await page.getByTestId("belgeler-offline-details").innerText();
    throw new Error("Offline preparation stopped: " + details);
  }
  await expect(primary).toHaveText(/^Çevrimdışı hazır$/, {timeout:20000});
  const before = await page.evaluate(async () => ({
    controller: navigator.serviceWorker.controller?.scriptURL,
    cache: (await (await caches.open("belgeler-offline-v4-assets")).keys()).length,
  }));
  expect(before.controller).toMatch(/\/belgeler-sw\.js$/);
  expect(before.cache).toBeGreaterThan(5);
  const debug = async () => page.evaluate(async () => {
    const raw = localStorage.getItem("belgeler:pwa:ready:v1");
    const stamp = raw ? JSON.parse(raw) as { scripts:string; offlineVersion:string } : null;
    const current = [...document.querySelectorAll<HTMLScriptElement>("script[src*='/_next/static/']")]
      .map(x => new URL(x.src).pathname).sort();
    const saved = stamp?.scripts?.split("|") ?? [];
    const pageCache = await caches.open("belgeler-offline-v4-pages");
    const assetCache = await caches.open("belgeler-offline-v4-assets");
    return {
      version:stamp?.offlineVersion,
      savedScripts:saved.length, actualScripts:current.length,
      unexpected:current.filter(x=>!saved.includes(x)).slice(0,8),
      missing:saved.filter(x=>!current.includes(x)).slice(0,8),
      pageCount:(await pageCache.keys()).length, assetCount:(await assetCache.keys()).length,
      controller:navigator.serviceWorker.controller?.scriptURL,
    };
  });
  console.log("BEFORE_F5",JSON.stringify(await debug()));
  for (let i=0; i<15; i++) {
    await page.reload({waitUntil:"domcontentloaded"});
    if (i === 0) console.log("AFTER_FIRST_F5",JSON.stringify(await debug()));
    await expect(primary).toHaveText(/^Çevrimdışı hazır$/, {timeout:30000});
    await expect(primary).not.toContainText("Eksik indirmeye");
  }
  await page.goto("/belgeler/beton-dokum-tutanagi", {waitUntil:"domcontentloaded"});
  await page.goto("/belgeler", {waitUntil:"domcontentloaded"});
  await expect(primary).toHaveText(/^Çevrimdışı hazır$/, {timeout:20000});
  await context.setOffline(true);
  await page.reload({waitUntil:"domcontentloaded"});
  await expect(page.getByRole("heading",{name:"Belgeler ve Şablonlar"})).toBeVisible();
  await context.setOffline(false);
});

test("details report no fake partial after a clean worker-start failure", async ({ page }) => {
  await page.goto("/belgeler", {waitUntil:"domcontentloaded"});
  const holder = page.getByTestId("belgeler-offline-prepare");
  await expect(holder).toBeVisible();
  await expect(holder.getByRole("button", {name:"Çevrimdışı ayrıntılarını göster"})).toBeEnabled();
  await holder.getByRole("button", {name:"Çevrimdışı ayrıntılarını göster"}).click();
  await expect(page.getByTestId("belgeler-offline-details")).toBeVisible();
  await expect(page.getByTestId("belgeler-offline-details")).not.toContainText("0/1");
  await holder.getByRole("button", {name:"Çevrimdışı ayrıntılarını göster"}).click();
  await expect(page.getByTestId("belgeler-offline-details")).toHaveCount(0);
});
