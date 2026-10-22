import { expect, test } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { readFile, mkdir, writeFile } from "node:fs/promises";

const docs = [
  { slug: "santiye-sefi-sozlesmesi", field: "adres", pages: 2 },
  { slug: "santiye-sefi-istifa-dilekcesi", field: "adres_deger", pages: 1 },
  { slug: "santiye-sefi-taahhutnamesi", field: "yapi_adresi", pages: 1 },
  { slug: "insaat-ruhsati-dilekcesi", field: "adres", pages: 1 },
  { slug: "beton-dokum-tutanagi", field: "yer", pages: 1 },
];
const dir = "audit-artifacts-stage06-download";
async function save(name: string, value: unknown) {
  await mkdir(dir,{recursive:true});
  await writeFile(dir+"/"+name+".json",JSON.stringify(value,null,2));
}
for (const doc of docs) {
  test("D06 browser stays mounted after real PDF download " + doc.slug, async ({page},info) => {
    test.setTimeout(110000);
    const errors:string[]=[];
    const consoleErrors:string[]=[];
    page.on("pageerror",e=>errors.push(e.stack||e.message));
    page.on("console",m=>{if(m.type()==="error") consoleErrors.push(m.text())});
    await page.goto("/belgeler/"+doc.slug,{waitUntil:"domcontentloaded",timeout:30000});
    const root=page.locator('[data-studio-locked="true"]:visible').first();
    await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
    const originalUrl=new URL(page.url());
    const mobile=info.project.name.includes("mobile");
    const actions=root.getByTestId(mobile?"belge-studio-mobile-actions":"belge-studio-desktop-actions");
    const downloadButton=actions.getByRole("button",{name:"PDF İndir"});
    await expect(downloadButton).toBeEnabled();
    const downloadPromise=page.waitForEvent("download",{timeout:25000});
    await downloadButton.click();
    const dl=await downloadPromise;
    const bytes=await readFile((await dl.path())!);
    expect(bytes.subarray(0,5).toString()).toBe("%PDF-");
    const pdf=await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(doc.pages);
    // Rendering errors triggered by a subsequent re-render may arrive after download fires.
    await page.waitForTimeout(1800);
    const afterUrl=new URL(page.url());
    const errorVisible=await page.getByText("Sayfa işlenirken beklenmeyen bir hata oluştu").count();
    const rootVisible=await root.isVisible();
    const readyText=await root.getByRole("status").first().textContent().catch(()=>"MISSING");
    const recorded={route:doc.slug,project:info.project.name,download:dl.suggestedFilename(),
      bytes:bytes.length,pages:pdf.getPageCount(),originalUrl:originalUrl.pathname,
      afterHost:afterUrl.host,afterUrl:afterUrl.pathname,errorVisible,rootVisible,readyText,errors,consoleErrors};
    await save(info.project.name+"-"+doc.slug,recorded);
    await info.attach(doc.slug+"-postdownload.json",{body:Buffer.from(JSON.stringify(recorded,null,2)),contentType:"application/json"});
    console.log("D06_DOWNLOAD_STATE "+JSON.stringify(recorded));
    await page.screenshot({path:dir+"/"+info.project.name+"-"+doc.slug+".png",animations:"disabled"});
    expect(afterUrl.origin).toBe(originalUrl.origin);
    expect(afterUrl.pathname).toBe(originalUrl.pathname);
    expect(errorVisible,"Next.js app error screen appeared after download").toBe(0);
    expect(rootVisible,"Studio unmounted after download").toBe(true);
    expect(errors,"Unhandled React/window exception").toEqual([]);
  });
}
test("D06 Preview reproducer: form 125%, Fit, synthetic address, then download",async({page},info)=>{
  test.setTimeout(120000);
  const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.stack||e.message));
  await page.goto("/belgeler/santiye-sefi-sozlesmesi",{waitUntil:"domcontentloaded"});
  const root=page.locator('[data-studio-locked="true"]:visible').first();
  await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
  const before=new URL(page.url());
  const form=root.locator('[data-belge-form-content="true"]');
  const mobile=info.project.name.includes("mobile");
  // Mobile studio intentionally defaults to PDF preview. The form is hidden
  // until the user taps the bottom "Formu Düzenle" action.
  if(mobile) {
    await root.getByTestId("belge-studio-mobile-actions")
      .getByRole("button",{name:"Formu Düzenle"}).click();
    await expect(root.locator("#sozlesme-adres")).toBeVisible({timeout:8000});
  }
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent("belge-form-view:command",{detail:{command:"scale",scale:1.25}})));
  await expect(form).toHaveAttribute("data-scale","1.25");
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent("belge-form-view:command",{detail:{command:"fit"}})));
  await expect(form).toHaveAttribute("data-mode","fit");
  const address=root.locator("#sozlesme-adres");
  await address.fill("DENETIM 06 Ornek Mahallesi 16 Sokak No 5 Ankara");
  await address.blur();
  await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
  const btn=root.getByTestId(mobile?"belge-studio-mobile-actions":"belge-studio-desktop-actions")
    .getByRole("button",{name:"PDF İndir"});
  const task=page.waitForEvent("download",{timeout:25000});
  await btn.click();
  const dl=await task;
  const pdf=await PDFDocument.load(await readFile((await dl.path())!));
  expect(pdf.getForm().getTextField("adres").getText()).toBe("DENETIM 06 Ornek Mahallesi 16 Sokak No 5 Ankara");
  await page.waitForTimeout(2500);
  const after=new URL(page.url());
  const result={flow:"manual125-fit-edit-download",project:info.project.name,filename:dl.suggestedFilename(),
    before:before.pathname,after:after.pathname,errorVisible:await page.getByText("Sayfa işlenirken beklenmeyen bir hata oluştu").count(),
    rootVisible:await root.isVisible(),errors};
  await save(info.project.name+"-full-flow",result);
  console.log("D06_FULL_FLOW "+JSON.stringify(result));
  await page.screenshot({path:dir+"/"+info.project.name+"-full-flow.png",animations:"disabled"});
  expect(after.origin).toBe(before.origin);
  expect(after.pathname).toBe(before.pathname);
  expect(result.errorVisible).toBe(0);
  expect(result.rootVisible).toBe(true);
  expect(errors).toEqual([]);
});
