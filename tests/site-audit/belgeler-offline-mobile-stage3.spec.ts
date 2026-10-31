import { expect, test } from "@playwright/test";

test.use({serviceWorkers:"allow"});
const paths=[
  "/belgeler/beton-dokum-tutanagi",
  "/belgeler/santiye-sefi-taahhutnamesi",
  "/belgeler/santiye-sefi-istifa-dilekcesi",
  "/belgeler/insaat-ruhsati-dilekcesi",
  "/belgeler/santiye-sefi-sozlesmesi"
];

test("touch viewport: offline preparation and five PDF previews still render", async({page,context,browserName})=>{
  test.setTimeout(300_000);
  await page.goto("/belgeler",{waitUntil:"domcontentloaded"});
  const offline = page.getByTestId("belgeler-offline-prepare");
  const mobileTrigger = offline.getByTestId("belgeler-offline-mobile-trigger");
  await expect(mobileTrigger).toBeVisible({timeout:20000});
  await mobileTrigger.click();
  const details = page.getByTestId("belgeler-offline-details");
  await expect(details).toBeVisible();
  await details.getByRole("button",{name:/^(Şimdi indir|Eksik indirmeye devam et|Kalanları indir)$/}).click();
  await expect(mobileTrigger).toHaveAttribute("aria-label",/^Çevrimdışı belgeler hazır\\. Ayrıntıları aç$/,{timeout:260000});
  // Linux Playwright WebKit aborts document navigations when its CDP-style
  // context.setOffline emulation is enabled, before the Service Worker can answer.
  // For WebKit, the SW's cache-only gate refuses *every* uncached network request.
  // Chromium continues to test actual context-wide offline mode.
  const webkitCacheOnly = browserName === "webkit";
  if (!webkitCacheOnly) await context.setOffline(true);
  for(const path of paths){
    if (webkitCacheOnly) {
      await page.goto(path+"?__belgeler_cache_test=1", {waitUntil:"domcontentloaded"});
    } else {
      await page.evaluate(p => window.location.assign(p), path);
      await page.waitForURL(url => url.pathname === path, {timeout:30000,waitUntil:"domcontentloaded"});
    }
    const toggle=page.getByRole("button",{name:"Canlı PDF Önizle",exact:true});
    if(await toggle.isVisible())await toggle.click();
    await expect.poll(async()=>{
      const canvas=page.getByTestId("belge-studio-preview-canvas").locator("canvas").first();
      return await canvas.evaluate(c=>(c as HTMLCanvasElement).height).catch(()=>0)
    },{timeout:30000,message:"offline mobile PDF canvas did not render: "+path}).toBeGreaterThan(200);
    await expect(page.getByRole("button",{name:"PDF İndir",exact:true}).first()).toBeVisible();
  }
  if (!webkitCacheOnly) await context.setOffline(false);
});

test("touch viewport: queued share can be explicitly cancelled without a real link",async({page,context})=>{
  test.setTimeout(70_000);
  await page.goto("/belgeler/beton-dokum-tutanagi",{waitUntil:"domcontentloaded"});
  await expect.poll(async()=>page.getByTestId("belge-studio-preview-canvas").locator("canvas").first()
    .evaluate(c=>(c as HTMLCanvasElement).height).catch(()=>0),{timeout:30000}).toBeGreaterThan(200);
  await context.setOffline(true);
  const share=page.getByTestId("belge-mobile-action-share-btn").first();
  await expect(share).toBeEnabled({timeout:20000});
  await share.click();
  await expect(page.getByTestId("belge-offline-enqueue")).toBeVisible();
  await page.getByTestId("belge-offline-enqueue").click();
  await expect(page.getByTestId("belge-offline-cancel")).toBeVisible();
  await expect(page.getByTestId("belge-share-offline-queue")).toContainText("Paylaşım isteği bu cihaza kaydedildi");
  await expect(page.getByTestId("belge-share-result")).toHaveCount(0);
  await page.getByTestId("belge-offline-cancel").click();
  await expect(page.getByTestId("belge-offline-enqueue")).toBeVisible();
  await context.setOffline(false);
});
