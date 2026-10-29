import {test,expect} from "@playwright/test";
test.use({serviceWorkers:"allow"});
const DOCS=[
"/belgeler/beton-dokum-tutanagi",
"/belgeler/santiye-sefi-taahhutnamesi",
"/belgeler/santiye-sefi-istifa-dilekcesi",
"/belgeler/insaat-ruhsati-dilekcesi",
"/belgeler/santiye-sefi-sozlesmesi",
];

test("background/page restart continues cached offline preparation; offline homepage offers Belgeler",async({page,context})=>{
  test.setTimeout(300000);
  await page.goto("/belgeler",{waitUntil:"domcontentloaded"});
  const button=page.getByTestId("belgeler-offline-prepare").getByRole("button",{name:/Çevrimdışı (kullanıma hazırla|hazır|hazırlanıyor)|Eksik indirmeye devam et/}).first();
  await expect(button).toBeVisible();
  await button.click();
  // Interrupt after a few completed resources. Navigating away is more severe than switching apps.
  await expect.poll(async()=>{
    const status=await page.getByTestId("belgeler-offline-prepare").locator('[role="status"]').innerText();
    const match=status.match(/\((\d+)\/(\d+)\)/);
    return match?Number(match[1]):0;
  },{timeout:50000}).toBeGreaterThan(2);
  const count=await page.evaluate(async()=> {
    const cache=await caches.open("belgeler-offline-v4-assets");
    return (await cache.keys()).length;
  });
  expect(count).toBeGreaterThan(1);
  await page.goto("/belgeler/beton-dokum-tutanagi",{waitUntil:"domcontentloaded"});
  await page.goto("/belgeler",{waitUntil:"domcontentloaded"});
  await expect(button).toHaveText(/^Çevrimdışı hazır$/,{timeout:230000});
  expect(await page.evaluate(async()=> (await (await caches.open("belgeler-offline-v4-assets")).keys()).length)).toBeGreaterThanOrEqual(count);
  // Root worker must be registered without taking over the more specific Belgeler scope.
  await expect.poll(async()=>page.evaluate(async()=> (await navigator.serviceWorker.getRegistrations())
    .some(r=>new URL(r.scope).pathname==="/" && r.active?.scriptURL.endsWith("/belgeler-home-sw.js"))),{timeout:15000}).toBe(true);
  await context.setOffline(true);
  await page.goto("/",{waitUntil:"domcontentloaded"});
  await expect(page.getByRole("heading",{name:"İnternet bağlantısı yok"})).toBeVisible();
  await page.getByRole("link",{name:"Çevrimdışı Belgeler'e git"}).click();
  await expect(page).toHaveURL(/\/belgeler$/);
  for(const doc of DOCS){
    await page.goto(doc,{waitUntil:"domcontentloaded"});
    await expect.poll(()=>page.getByTestId("belge-studio-preview-canvas").locator("canvas").first()
      .evaluate(c=>(c as HTMLCanvasElement).height).catch(()=>0),{timeout:25000}).toBeGreaterThan(200);
  }
  await context.setOffline(false);
});
test("root offline worker does not cache online homepage or interfere with unrelated pages",async({page})=>{
  test.setTimeout(65000);
  await page.goto("/",{waitUntil:"domcontentloaded"});
  await expect.poll(async()=>page.evaluate(async()=>{
    return (await navigator.serviceWorker.getRegistrations()).some(r=>r.scope===location.origin+"/"&&
      r.active?.scriptURL.endsWith("/belgeler-home-sw.js"));
  }),{timeout:20000}).toBe(true);
  const source=await page.evaluate(async()=>{
    const cache=await caches.open("belgeler-home-offline-v1");
    return (await cache.keys()).map(r=>new URL(r.url).pathname);
  });
  expect(source).toEqual(["/belgeler-home-offline.html"]);
  await page.goto("/hesaplamalar",{waitUntil:"domcontentloaded"});
  expect(page.url()).toContain("/hesaplamalar");
});
