import { expect, test } from "@playwright/test";
test.use({ serviceWorkers: "allow" });

const DOC="/belgeler/beton-dokum-tutanagi";
test("reconnected queued share queries existing operation first and makes exactly one POST",async({page,context})=>{
  test.setTimeout(130000);
  const quota={status:"ready",quota:{limit:50,used:0,reserved:0,remaining:50,
    quotaDay:"2026-10-29",serverNow:"2026-10-29T09:00:00Z",resetAt:"2026-10-30T00:00:00Z",timeZone:"Europe/Istanbul"}};
  let statuses=0,posts=0;
  await page.route("**/api/belgeler/paylasim/kota",route=>
    route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(quota)}));
  await page.route("**/api/belgeler/paylasim/islem/**",route=>{
    statuses++;
    return route.fulfill({status:404,contentType:"application/json",body:'{"code":"OPERATION_NOT_FOUND"}'});
  });
  await page.route("**/api/belgeler/paylasim",route=>{
    if(route.request().method()!=="POST")return route.continue();
    posts++;
    const body=route.request().postDataJSON() as {clientRequestId:string;documentId:string};
    const token="A".repeat(43);
    return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({
      status:"ready",url:"http://localhost:3005/b/"+token,viewToken:token,
      manageToken:"B".repeat(43),documentId:body.documentId,
      expiresAt:"2027-01-30T12:00:00Z"
    })});
  });
  await page.goto(DOC);
  await expect(page.getByTestId("belge-studio-preview-canvas").locator("canvas")).toBeVisible({timeout:25000});
  await context.setOffline(true);
  await page.getByTestId("belge-desktop-share-btn").click();
  await page.getByTestId("belge-offline-enqueue").click();
  await expect(page.getByTestId("belge-offline-cancel")).toBeVisible();
  expect(posts).toBe(0);
  await context.setOffline(false);
  await page.evaluate(()=>window.dispatchEvent(new Event("online")));
  await expect(page.getByTestId("belge-share-result")).toBeVisible({timeout:65000});
  expect(statuses).toBeGreaterThanOrEqual(1);
  expect(posts).toBe(1);
  await expect(page.getByTestId("belge-offline-enqueue")).toBeVisible({timeout:15000});
});

test("mutating document after queue blocks automatic posting",async({page,context})=>{
  test.setTimeout(120000);
  let posts=0;
  await page.route("**/api/belgeler/paylasim",route=>{if(route.request().method()==="POST")posts++;
    return route.fulfill({status:503,contentType:"application/json",body:'{"code":"SERVICE_UNAVAILABLE"}'});});
  await page.goto(DOC);
  await expect(page.getByTestId("belge-studio-preview-canvas").locator("canvas")).toBeVisible({timeout:25000});
  await context.setOffline(true);
  await page.getByTestId("belge-desktop-share-btn").click();
  await page.getByTestId("belge-offline-enqueue").click();
  await expect(page.getByTestId("belge-offline-cancel")).toBeVisible();
  await page.getByTestId("belge-share-close-btn").click();
  const field=page.getByTestId("belge-studio-form-scroll").locator("input").first();
  await field.fill("Degistirilmis belge 2026");
  await context.setOffline(false);
  await page.evaluate(()=>window.dispatchEvent(new Event("online")));
  await page.getByTestId("belge-desktop-share-btn").click();
  await expect(page.getByTestId("belge-share-offline-queue")).toContainText("engellendi",{timeout:30000});
  expect(posts).toBe(0);
});
