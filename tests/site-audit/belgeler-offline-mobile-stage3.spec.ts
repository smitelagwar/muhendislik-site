import { expect, test } from "@playwright/test";

test.use({serviceWorkers:"allow"});
const paths=[
  "/belgeler/beton-dokum-tutanagi",
  "/belgeler/santiye-sefi-taahhutnamesi",
  "/belgeler/santiye-sefi-istifa-dilekcesi",
  "/belgeler/insaat-ruhsati-dilekcesi",
  "/belgeler/santiye-sefi-sozlesmesi"
];

test("touch viewport: offline preparation and five PDF previews still render", async({page,context})=>{
  test.setTimeout(300_000);
  await page.goto("/belgeler",{waitUntil:"domcontentloaded"});
  const prepare=page.getByTestId("belgeler-offline-prepare").getByRole("button",{name:/Çevrimdışı (kullanıma hazırla|hazır|hazırlanıyor)/}).first();
  await expect(prepare).toBeVisible({timeout:20000});
  await prepare.click();
  await expect(prepare).toHaveText(/^Çevrimdışı hazır$/,{timeout:260000});
  await context.setOffline(true);
  for(const path of paths){
    await page.goto(path,{waitUntil:"domcontentloaded"});
    const toggle=page.getByRole("button",{name:"Canlı PDF Önizle",exact:true});
    if(await toggle.isVisible())await toggle.click();
    await expect.poll(async()=>{
      const canvas=page.getByTestId("belge-studio-preview-canvas").locator("canvas").first();
      return await canvas.evaluate(c=>(c as HTMLCanvasElement).height).catch(()=>0)
    },{timeout:30000,message:"offline mobile PDF canvas did not render: "+path}).toBeGreaterThan(200);
    await expect(page.getByRole("button",{name:"PDF İndir",exact:true}).first()).toBeVisible();
  }
  await context.setOffline(false);
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
  await expect(page.getByTestId("belge-share-offline-queue")).toContainText("henüz hazır değil");
  await page.getByTestId("belge-offline-cancel").click();
  await expect(page.getByTestId("belge-offline-enqueue")).toBeVisible();
  await context.setOffline(false);
});
