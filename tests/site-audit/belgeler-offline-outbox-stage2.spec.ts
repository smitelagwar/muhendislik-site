import { expect, test } from "@playwright/test";
test.use({ serviceWorkers: "allow" });

test("offline intent persists, never POSTs while offline, and can be cancelled without clearing drafts", async ({ page, context }) => {
  test.setTimeout(300000);
  await page.goto("/belgeler", {waitUntil:"domcontentloaded"});
  await page.getByTestId("belgeler-offline-prepare").getByRole("button", {name:"Çevrimdışı kullanıma hazırla"}).click();
  await expect(page.getByTestId("belgeler-offline-prepare").getByRole("button", {name:"Çevrimdışı hazır",exact:true})).toBeVisible({timeout:250000});
  await page.goto("/belgeler/beton-dokum-tutanagi");
  await expect(page.getByTestId("belge-studio-preview-canvas").locator("canvas")).toBeVisible();
  let submitted=0;
  page.on("request",request=>{if(request.method()==="POST" && new URL(request.url()).pathname === "/api/belgeler/paylasim")submitted++});
  await context.setOffline(true);
  await page.getByTestId("belge-desktop-share-btn").click();
  await expect(page.getByTestId("belge-offline-enqueue")).toBeVisible();
  await page.getByTestId("belge-offline-enqueue").click();
  await expect(page.getByTestId("belge-share-offline-queue")).toContainText("Paylaşım isteği bu cihaza kaydedildi");
  expect(submitted).toBe(0);
  await page.reload({waitUntil:"domcontentloaded"});
  await page.getByTestId("belge-desktop-share-btn").click();
  await expect(page.getByTestId("belge-offline-cancel")).toBeVisible({timeout:20000});
  const count=await page.evaluate(async()=>{
    return new Promise<number>((resolve,reject)=>{
      const req=indexedDB.open("belgeler-offline-share-v1");
      req.onerror=()=>reject(new Error("IDB unavailable"));
      req.onsuccess=()=>{const db=req.result;const tx=db.transaction("intents","readonly");
        const r=tx.objectStore("intents").count();
        r.onsuccess=()=>{resolve(r.result);db.close()};r.onerror=()=>reject(new Error("count failed"));};
    });
  });
  expect(count).toBe(1);
  await page.getByTestId("belge-offline-cancel").click();
  await expect(page.getByTestId("belge-offline-enqueue")).toBeVisible();
  expect(submitted).toBe(0);
});
test("denied IndexedDB shows honest failure rather than a false saved state",async({page})=>{
  test.setTimeout(100000);
  await page.addInitScript(()=>{
    const original=indexedDB.open.bind(indexedDB);
    Object.defineProperty(indexedDB,"open",{configurable:true,value:(name:string,...args:unknown[])=>{
      if(name==="belgeler-offline-share-v1")throw new DOMException("Denied","SecurityError");
      return Reflect.apply(original,indexedDB,[name,...args]);
    }});
  });
  await page.goto("/belgeler/beton-dokum-tutanagi");
  await expect(page.getByTestId("belge-studio-preview-canvas").locator("canvas")).toBeVisible({timeout:25000});
  await page.getByTestId("belge-desktop-share-btn").click();
  await page.getByTestId("belge-offline-enqueue").click();
  await expect(page.getByTestId("belge-share-error")).toContainText(/erişilemiyor|kuyruğu açılamadı|kalıcı/i);
  await expect(page.getByTestId("belge-offline-enqueue")).toBeVisible();
});
