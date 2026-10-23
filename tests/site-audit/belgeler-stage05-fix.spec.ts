import { expect, test } from "@playwright/test";

const docs = [
 "santiye-sefi-sozlesmesi","santiye-sefi-istifa-dilekcesi",
 "santiye-sefi-taahhutnamesi","insaat-ruhsati-dilekcesi","beton-dokum-tutanagi"
];

async function geometry(page: import("@playwright/test").Page) {
 return page.locator('[data-studio-locked="true"] [data-testid="belge-studio-preview-toolbar"]:visible')
 .evaluate(el => {
  const box=el.getBoundingClientRect();
  const buttons=Array.from(el.querySelectorAll("button,a")).filter(x=>{
   const r=x.getBoundingClientRect();
   return r.width>0&&r.height>0&&getComputedStyle(x).visibility!=="hidden";
  }).map(x=>{
   const r=x.getBoundingClientRect();
   return {name:x.getAttribute("aria-label")||x.textContent?.trim()||"",
    l:r.left,r:r.right,t:r.top,b:r.bottom};
  });
  const overlaps:string[]=[];
  for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){
   const a=buttons[i],b=buttons[j];
   if(Math.min(a.r,b.r)-Math.max(a.l,b.l)>1 &&
      Math.min(a.b,b.b)-Math.max(a.t,b.t)>1)overlaps.push(a.name+" / "+b.name);
  }
  return {width:box.width,height:box.height,overlaps,buttons};
 });
}
async function fit(page:import("@playwright/test").Page){
 const root=page.locator('[data-studio-locked="true"]:visible');
 const el=root.locator('[data-belge-form-content="true"]');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent("belge-form-view:command",{detail:{command:"fit"}})));
 await expect(el).toHaveAttribute("data-mode","fit",{timeout:8000});
 await expect.poll(()=>el.getAttribute("data-fit-status"),{timeout:8000}).toMatch(/^(fitted|limited|unavailable)$/);
 return el.evaluate(el=>{
  const sc=el.closest('[data-testid="belge-studio-form-scroll"]') as HTMLElement;
  return {status:el.getAttribute("data-fit-status"),dataScale:Number(el.getAttribute("data-scale")),
   realZoom:Number(getComputedStyle(el).zoom),density:el.getAttribute("data-density"),
   scrollH:sc.scrollHeight,clientH:sc.clientHeight,scrollW:sc.scrollWidth,clientW:sc.clientWidth};
 });
}
for(const doc of docs){
 test("D05 no clickable overlaps at 1023–1366: "+doc,async({page},info)=>{
  test.setTimeout(125000);
  const observations: any[] = [];
  await page.setViewportSize({width:1366,height:768});
  await page.goto("/belgeler/"+doc,{waitUntil:"domcontentloaded",timeout:30000});
  await expect(page.locator('[data-studio-locked="true"]:visible').getByRole("status").first())
    .toHaveText("PDF önizlemesi hazır.",{timeout:45000});
  for(const width of [1023,1024,1025,1093,1366,1920]){
   await page.setViewportSize({width,height:768});
   const m=await geometry(page);
   observations.push({requestedWidth:width,...m});
   expect(m.overlaps,doc+"@"+width+" "+JSON.stringify(m)).toEqual([]);
   if(width===1024)expect(m.height).toBeLessThan(99);
  }
  await info.attach(doc+"-toolbar.json",{body:Buffer.from(JSON.stringify(observations,null,2)),contentType:"application/json"});
 });
 test("D05 winning fitted scale always agrees with DOM: "+doc,async({page},info)=>{
  test.setTimeout(120000);
  await page.setViewportSize({width:1366,height:768});
  await page.goto("/belgeler/"+doc,{waitUntil:"domcontentloaded",timeout:30000});
  await expect(page.locator('[data-studio-locked="true"]:visible').getByRole("status").first())
    .toHaveText("PDF önizlemesi hazır.",{timeout:45000});
  const observations: any[] = [];
  for(const vp of [{width:1920,height:1080},{width:1024,height:768},{width:1280,height:720}]){
   await page.setViewportSize(vp);
   const result=await fit(page);
   observations.push({vp,result});
   expect(Math.abs(result.dataScale-result.realZoom),doc+" "+JSON.stringify({vp,result})).toBeLessThan(0.011);
   if(result.status==="fitted"){
    expect(result.scrollH,JSON.stringify(result)).toBeLessThanOrEqual(result.clientH+2);
    expect(result.scrollW,JSON.stringify(result)).toBeLessThanOrEqual(result.clientW+2);
   }
  }
  await info.attach(doc+"-fit.json",{body:Buffer.from(JSON.stringify(observations,null,2)),contentType:"application/json"});
 });
}
for(const doc of docs){
 test("D07 fit-label toolbar does not overlap across 700–820px container boundary: "+doc,async({page})=>{
  test.setTimeout(160000);
  await page.setViewportSize({width:1366,height:768});
  await page.goto("/belgeler/"+doc,{waitUntil:"domcontentloaded",timeout:30000});
  const root=page.locator('[data-studio-locked="true"]:visible');
  await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
  const form=root.locator('[data-belge-form-content="true"]');
  // The expanded "Form · Sığdır (%...)" / "Sınırlı" label occupies
  // more horizontal room than the default "Form %100" label.
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent("belge-form-view:command",{detail:{command:"fit"}})));
  await expect(form).toHaveAttribute("data-mode","fit",{timeout:8000});
  await expect.poll(()=>form.getAttribute("data-fit-status"),{timeout:8000})
    .toMatch(/^(fitted|limited|unavailable)$/);
  for(const width of [1024,1060,1093,1130,1170,1180,1220,1366]){
   await page.setViewportSize({width,height:768});
   await page.waitForTimeout(180);
   const m=await geometry(page);
   expect(m.overlaps,doc+" width="+width+" toolbar="+JSON.stringify(m)).toEqual([]);
  }
  for(const width of [1093,1170,1180]){
   await page.setViewportSize({width,height:600});
   await page.waitForTimeout(180);
   const m=await geometry(page);
   expect(m.overlaps,doc+" limited width="+width+" toolbar="+JSON.stringify(m)).toEqual([]);
  }
  await page.setViewportSize({width:1366,height:768});
 });
}

test("D05 focused input fit eventually settles after blur; PDF zoom isolated",async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:1366,height:768});
 await page.goto("/belgeler/santiye-sefi-sozlesmesi",{waitUntil:"domcontentloaded"});
 const root=page.locator('[data-studio-locked="true"]:visible');
 await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
 const input=root.locator("#sozlesme-adres");
 const old=await input.inputValue();
 const pdfZoomBefore=await root.getByTestId("belge-studio-zoom-level").textContent();
 await input.fill("D05 kontrollü sentetik adres testi / Ankara 2026");
 await input.focus();
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent("belge-form-view:command",{detail:{command:"fit"}})));
 await input.blur();
 const result=await fit(page);
 expect(result.status).not.toBe("measuring");
 expect(Math.abs(result.dataScale-result.realZoom)).toBeLessThan(0.011);
 expect(await input.inputValue()).not.toBe(old);
 expect(await root.getByTestId("belge-studio-zoom-level").textContent()).toBe(pdfZoomBefore);
});
