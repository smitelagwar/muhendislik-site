import { test, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { DOCUMENT_EDITABLE_FIELDS } from "../../src/lib/document-field-contracts";
const docs = [
{slug:"santiye-sefi-sozlesmesi",prefix:"sozlesme",field:"adres",value:"D04 Ankara Çankaya TEST adres 29",pages:2},
{slug:"santiye-sefi-istifa-dilekcesi",prefix:"istifa",field:"adres_deger",value:"D04 İzmir Konak TEST adres 51",pages:1},
{slug:"santiye-sefi-taahhutnamesi",prefix:"taahhutname",field:"yapi_adresi",value:"D04 Bursa Nilüfer TEST adres 48",pages:1},
{slug:"insaat-ruhsati-dilekcesi",prefix:"insaat-ruhsati",field:"adres",value:"D04 Adana Seyhan TEST adres 12",pages:1},
{slug:"beton-dokum-tutanagi",prefix:"beton-dokum",field:"yer",value:"D04 Kayseri Melikgazi TEST alan 13",pages:1}
] as const;
async function record(name:string,data:unknown){
  await mkdir("audit-artifacts-stage04-pdf",{recursive:true});
  await writeFile("audit-artifacts-stage04-pdf/"+name+".json",JSON.stringify(data,null,2));
}
async function downloaded(page:import("@playwright/test").Page,button:import("@playwright/test").Locator){
  const wait=page.waitForEvent("download",{timeout:30000});
  await button.click({timeout:12000});
  const result=await wait;
  const bytes=await readFile((await result.path())!);
  expect(bytes.subarray(0,5).toString()).toBe("%PDF-");
  return {doc:await PDFDocument.load(bytes),bytes:bytes.byteLength,filename:result.suggestedFilename()};
}
for(const c of docs){
 test("D04 real filled and blank browser PDF "+c.slug,async({page})=>{
   test.setTimeout(170000);
   await page.goto("/belgeler/"+c.slug,{waitUntil:"domcontentloaded",timeout:30000});
   const root=page.locator('[data-studio-locked="true"]:visible').first();
   await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
   const form=root.locator("#"+c.prefix+"-"+c.field);
   await form.fill(c.value);
   await form.blur();
   await page.waitForTimeout(850);
   await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
   const actions=root.getByTestId("belge-studio-desktop-actions");
   const b=actions.getByRole("button",{name:"PDF İndir"});
   await expect(b).toBeEnabled();
   const before=await downloaded(page,b);
   expect(before.doc.getPageCount()).toBe(c.pages);
   expect(before.doc.getForm().getTextField(c.field).getText()).toBe(c.value);
   await page.evaluate(()=>window.dispatchEvent(new CustomEvent("belge-form-view:command",{detail:{command:"scale",scale:1.25}})));
   await expect(root.locator('[data-belge-form-content="true"]')).toHaveAttribute("data-scale","1.25");
   const after=await downloaded(page,b);
   expect(after.doc.getForm().getTextField(c.field).getText()).toBe(c.value);
   const blank=await downloaded(page,actions.getByRole("button",{name:"Boş form indir"}));
   expect(blank.doc.getPageCount()).toBe(c.pages);
   let fields=0;
   for(const f of DOCUMENT_EDITABLE_FIELDS[c.slug]){
      expect(blank.doc.getForm().getTextField(f).getText()??"",c.slug+"/"+f).toBe("");
      fields++;
   }
   const summary={document:c.slug,matchedValue:c.value,filledBytes:before.bytes,repeatBytes:after.bytes,
      blankBytes:blank.bytes,blankFieldCount:fields,pages:c.pages};
   await record(c.slug,summary);
   console.log("D04_PDF",JSON.stringify(summary));
 });
}
test("D04 print opens PDF blob without modifying form",async({page})=>{
 test.setTimeout(80000);
 await page.goto("/belgeler/santiye-sefi-sozlesmesi",{waitUntil:"domcontentloaded"});
 const root=page.locator('[data-studio-locked="true"]:visible');
 await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
 const before=await root.locator("#sozlesme-adres").inputValue();
 const p=page.waitForEvent("popup",{timeout:20000});
 await root.getByTestId("belge-studio-desktop-actions").getByRole("button",{name:"Yazdır"}).click();
 const popup=await p;
 try{
   await expect.poll(()=>popup.url(),{timeout:15000}).toMatch(/^blob:/);
   expect(await root.locator("#sozlesme-adres").inputValue()).toBe(before);
   await record("print",{openedBlobPage:true,fieldPreserved:true,osPrintNotVerified:true});
 }finally{await popup.close().catch(()=>{});}
});
test("D04 invalid saved preference, form clear and undo, navigation",async({page})=>{
 test.setTimeout(90000);
 await page.addInitScript(()=>localStorage.setItem("belge-studio:form-view:v3","{bad"));
 await page.goto("/belgeler/beton-dokum-tutanagi",{waitUntil:"domcontentloaded"});
 const root=page.locator('[data-studio-locked="true"]:visible');
 await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
 const field=root.locator("#beton-dokum-tutanak_alt_baslik");
 const before=await field.inputValue();
 const actions=root.getByTestId("belge-studio-desktop-actions");
 await actions.getByRole("button",{name:"Temizle",exact:true}).click();
 await expect(field).toHaveValue("");
 await actions.getByRole("button",{name:"Geri al"}).click();
 await expect(field).toHaveValue(before);
 const pdfZoom=await root.getByTestId("belge-studio-zoom-level").textContent();
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent("belge-form-view:command",{detail:{command:"scale",scale:0.9}})));
 await expect(root.locator('[data-belge-form-content="true"]')).toHaveAttribute("data-scale","0.9");
 expect(await root.getByTestId("belge-studio-zoom-level").textContent()).toBe(pdfZoom);
 for(const route of ["/belgeler","/dokumantasyon","/kategori/deprem-yonetmelik"]){
   const res=await page.goto(route,{waitUntil:"domcontentloaded",timeout:30000});
   expect(res?.status(),route).toBeLessThan(400);
   await expect(page.locator("main").first()).toBeVisible({timeout:10000});
 }
 await record("storage-undo-navigation",{invalidStorageRecovered:true,undoWorks:true,documentRoutesChecked:3});
});
test("D04 repeated fit/reflow and app errors",async({page})=>{
 test.setTimeout(90000);
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("/belgeler/santiye-sefi-sozlesmesi",{waitUntil:"domcontentloaded"});
 const root=page.locator('[data-studio-locked="true"]:visible');
 await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
 for(let i=0;i<15;i++){
   await page.setViewportSize({width:i%2?1366:1920,height:i%3?700:850});
   await page.evaluate(()=>window.dispatchEvent(new CustomEvent("belge-form-view:command",{detail:{command:"fit"}})));
 }
 await page.waitForTimeout(600);
 const result=await root.locator('[data-belge-form-content="true"]').evaluate(x=>({
   mode:x.getAttribute("data-mode"),status:x.getAttribute("data-fit-status"),
   state:Number(x.getAttribute("data-scale")),actual:Number(getComputedStyle(x).zoom)
 }));
 await record("repeated-fit",{result,errors});
 expect(result.mode).toBe("fit");
 expect(result.status).toMatch(/^(limited|fitted|unavailable)$/);
 expect(Math.abs(result.state-result.actual)).toBeLessThan(0.011);
 expect(errors).toEqual([]);
});
