import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const DIR = "audit-artifacts-stage03-stress";
mkdirSync(DIR, { recursive: true });
const docs = [
  { slug:"santiye-sefi-sozlesmesi", field:"#sozlesme-adres", invalid:"#sozlesme-yibf", invalidValue:"12" },
  { slug:"santiye-sefi-istifa-dilekcesi", field:"#istifa-adres_deger", invalid:"#istifa-tc_deger", invalidValue:"123" },
  { slug:"santiye-sefi-taahhutnamesi", field:"#taahhutname-adres", invalid:"#taahhutname-tc_kimlik_no", invalidValue:"123" },
  { slug:"insaat-ruhsati-dilekcesi", field:"#insaat-ruhsati-adres", invalid:"#insaat-ruhsati-tarih", invalidValue:"xx" },
  { slug:"beton-dokum-tutanagi", field:"#beton-dokum-yer", invalid:"#beton-dokum-yibf", invalidValue:"123456789" },
];
type Measurement = {
  mode: string|null; status:string|null; density:string|null;
  scale:number; appliedZoom:number; scrollHeight:number;clientHeight:number; scrollWidth:number;clientWidth:number;
  lastInputVisible:boolean; lastInputReachable:boolean; finalBottom:number|null; fittedWithoutScroll:boolean;
  warnings:number; focusId:string|null;
};
async function inspect(page:import("@playwright/test").Page):Promise<Measurement>{
  return page.evaluate(()=>{
    const root=document.querySelector('[data-studio-locked="true"]') as HTMLElement;
    const form=root.querySelector('[data-belge-form-content="true"]') as HTMLElement;
    const sc=root.querySelector('[data-testid="belge-studio-form-scroll"]') as HTMLElement;
    const inputs=Array.from(form.querySelectorAll("input,textarea,select")).filter(e=>{
      const r=e.getBoundingClientRect();
      return r.height>0 && r.width>0;
    });
    const last=inputs.at(-1), lastRect=last?.getBoundingClientRect(), port=sc.getBoundingClientRect();
    const visible=!!lastRect && lastRect.bottom<=port.bottom+2 && lastRect.top>=port.top-2;
    const lastMax=sc.scrollHeight-sc.clientHeight, before=sc.scrollTop;
    sc.scrollTop=lastMax;
    const atEnd=last?.getBoundingClientRect();
    const reachable=!!atEnd&&atEnd.bottom<=port.bottom+2&&atEnd.top>=port.top-2;
    sc.scrollTop=before;
    const scale=Number(form.getAttribute("data-scale"));
    const appliedZoom=Number(getComputedStyle(form).zoom);
    const warnings=Array.from(root.querySelectorAll('[data-testid="belge-field-guidance-message"]'))
      .filter(x=>x.getBoundingClientRect().height>0).length;
    return {
      mode:form.getAttribute("data-mode"),status:form.getAttribute("data-fit-status"),
      density:form.getAttribute("data-density"),scale,appliedZoom,
      scrollHeight:sc.scrollHeight,clientHeight:sc.clientHeight,
      scrollWidth:sc.scrollWidth,clientWidth:sc.clientWidth,
      lastInputVisible:visible,lastInputReachable:reachable,
      finalBottom:atEnd?atEnd.bottom-port.top:null,
      fittedWithoutScroll:sc.scrollHeight<=sc.clientHeight+2&&sc.scrollWidth<=sc.clientWidth+2,
      warnings,focusId:(document.activeElement as HTMLElement|null)?.id??null
    };
  });
}
const longTR=("Şantiye İ Ş Ğ Ü Ö Ç ı/Deneme Mahallesi Şehitler Caddesi No 123 Kat 8 Daire 56; ").repeat(4).slice(0,290);
async function openMenu(page:import("@playwright/test").Page){
  const btn=page.locator('[data-studio-locked="true"] [data-testid="belge-studio-form-view-trigger"]:visible');
  await btn.click({timeout:8000});
  await expect(page.getByTestId("belge-studio-form-view-menu")).toBeVisible({timeout:8000});
}
async function choose(page:import("@playwright/test").Page, id:string){
  await openMenu(page);
  await page.getByTestId(id).click({timeout:8000});
}
for(const doc of docs){
  test("DENETIM03 real manual/density/fit long text "+doc.slug,async({page},info)=>{
    test.setTimeout(170000);
    const findings:string[]=[];
    const events:unknown[]=[];
    const browserErrors:string[]=[];
    page.on("pageerror",e=>browserErrors.push(e.message));
    await page.setViewportSize({width:1366,height:768});
    await page.goto("/belgeler/"+doc.slug,{waitUntil:"domcontentloaded",timeout:30000});
    const root=page.locator('[data-studio-locked="true"]:visible');
    await expect(root).toBeVisible({timeout:8000});
    await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
    const pdfZoomBefore=await root.getByTestId("belge-studio-zoom-level").textContent();
    for(const percent of [90,100,110,125]){
      await choose(page,"form-view-scale-"+percent);
      await expect(root.locator('[data-belge-form-content="true"]')).toHaveAttribute("data-mode","manual");
      await expect(root.locator('[data-belge-form-content="true"]')).toHaveAttribute("data-scale",String(percent/100));
      const m=await inspect(page);events.push({task:"manual",percent,m});
      if(Math.abs(m.scale-m.appliedZoom)>0.011)findings.push("manual scale mismatch "+percent+": "+JSON.stringify(m));
    }
    await choose(page,"form-view-compact");
    let m=await inspect(page);events.push({task:"compact",m});
    if(m.density!=="compact") findings.push("compact action not applied");
    const field=page.locator(doc.field);
    await field.fill(longTR,{timeout:8000});
    await field.blur();
    await page.locator(doc.invalid).fill(doc.invalidValue,{timeout:8000});
    await page.locator(doc.invalid).blur();
    const invalid=await inspect(page);
    events.push({task:"invalid-and-long",invalid, invalidValue:doc.invalidValue, longChars:longTR.length});
    if(doc.slug==="santiye-sefi-sozlesmesi" && !await page.locator("#sozlesme-yibf-help").getByText("7 Hane olmalı").count()){
      findings.push("Known YIBF warning did not appear");
    }
    await choose(page,"form-view-fit");
    const form=root.locator('[data-belge-form-content="true"]');
    try{await expect.poll(()=>form.getAttribute("data-fit-status"),{timeout:5000}).toMatch(/^(fitted|limited|unavailable)$/);}
    catch{findings.push("Fit never settled");}
    await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
    m=await inspect(page); events.push({task:"fit-after-long",m});
    if(Math.abs(m.scale-m.appliedZoom)>0.011)findings.push("FIT SCALE MISMATCH: "+JSON.stringify({scale:m.scale,zoom:m.appliedZoom,status:m.status}));
    if(m.status==="fitted"&&!m.fittedWithoutScroll)findings.push("False FITTED with scroll "+JSON.stringify(m));
    if(m.status==="limited"&&!m.lastInputReachable)findings.push("Last field not reachable in LIMITED");
    const pdfZoomAfter=await root.getByTestId("belge-studio-zoom-level").textContent();
    if(pdfZoomBefore!==pdfZoomAfter)findings.push("PDF zoom modified by FORM zoom");
    await choose(page,"form-view-reset");
    m=await inspect(page);events.push({task:"reset",m});
    if(m.mode!=="manual"||m.density!=="normal"||Math.abs(m.scale-1)>0.01)findings.push("reset wrong");
    await info.attach(doc.slug+"-stress.json",{body:Buffer.from(JSON.stringify({doc:doc.slug,pdfZoomBefore,pdfZoomAfter,events,findings,browserErrors},null,2)),contentType:"application/json"});
    writeFileSync(DIR+"/"+doc.slug+".json",JSON.stringify({doc:doc.slug,pdfZoomBefore,pdfZoomAfter,events,findings,browserErrors},null,2));
    console.log("STAGE03_STRESS",JSON.stringify({doc:doc.slug,manual:4,events:events.length,findings}));
    expect(browserErrors,JSON.stringify(browserErrors)).toEqual([]);
    expect(findings,JSON.stringify(findings,null,2)).toEqual([]);
  });
}
for(const doc of [docs[0],docs[4]]){
 test("DENETIM03 focused fit request and resize "+doc.slug,async({page},info)=>{
    test.setTimeout(120000);
    const findings:string[]=[];
    const observations:Record<string,unknown>={};
    await page.setViewportSize({width:1920,height:1080});
    await page.goto("/belgeler/"+doc.slug,{waitUntil:"domcontentloaded",timeout:30000});
    const root=page.locator('[data-studio-locked="true"]:visible');
    await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
    const field=page.locator(doc.field);
    await field.fill(longTR,{timeout:8000});
    await field.focus();
    await page.evaluate(()=>window.dispatchEvent(new CustomEvent("belge-form-view:command",{detail:{command:"fit"}})));
    await expect(root.locator('[data-belge-form-content="true"]')).toHaveAttribute("data-mode","fit",{timeout:5000});
    await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
    observations.focused=await inspect(page);
    await field.blur();
    await page.setViewportSize({width:1280,height:720});
    await page.waitForTimeout(400);
    observations.blurredAndResized=await inspect(page);
    const m=observations.blurredAndResized as Measurement;
    if(m.status==="measuring")findings.push("Focused FIT stuck in measuring after blur and resize");
    if(m.status==="fitted"&&!m.fittedWithoutScroll)findings.push("False fitted after focus resize");
    if(Math.abs(m.scale-m.appliedZoom)>0.011)findings.push("Focused fit mismatch "+JSON.stringify(m));
    writeFileSync(DIR+"/"+doc.slug+"-focused.json",JSON.stringify({observations,findings},null,2));
    await info.attach(doc.slug+"-focused.json",{body:Buffer.from(JSON.stringify({observations,findings},null,2)),contentType:"application/json"});
    console.log("STAGE03_FOCUS",JSON.stringify({doc:doc.slug,findings,observations}));
    expect(findings,JSON.stringify(findings)).toEqual([]);
 });
}
test("DENETIM03 landscape and reduced motion",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.setViewportSize({width:844,height:390});
  await page.goto("/belgeler/santiye-sefi-sozlesmesi",{waitUntil:"domcontentloaded"});
  const root=page.locator('[data-studio-locked="true"]:visible');
  await expect(root).toBeVisible({timeout:8000});
  const actions=root.getByTestId("belge-studio-mobile-actions");
  await expect(actions).toBeVisible({timeout:8000});
  const x=await page.evaluate(()=>({w:innerWidth,rootScroll:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    reduced:matchMedia("(prefers-reduced-motion: reduce)").matches}));
  writeFileSync(DIR+"/landscape-reduced-motion.json",JSON.stringify(x,null,2));
  expect(x.reduced).toBe(true);
  expect(x.rootScroll).toBeLessThanOrEqual(2);
});
