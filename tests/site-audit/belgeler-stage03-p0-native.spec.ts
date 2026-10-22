import {test, expect} from "@playwright/test";
import {execFileSync} from "node:child_process";
import {mkdirSync,writeFileSync} from "node:fs";
mkdirSync("audit-artifacts-stage03-p0",{recursive:true});
const scenarios=[
{code:"Z01",w:1920,h:1080,zoom:1},
{code:"Z02",w:1920,h:1080,zoom:1.5},
{code:"Z03",w:1920,h:1080,zoom:1.25},
{code:"Z04",w:1366,h:768,zoom:1.25},
{code:"Z05",w:1366,h:768,zoom:1.5},
{code:"Z06",w:1536,h:864,zoom:1.5},
{code:"Z07a",w:1280,h:720,zoom:1},
{code:"Z07b",w:1280,h:720,zoom:1.5},
{code:"Z08",w:1920,h:1080,zoom:2}
] as const;
async function measure(page:import("@playwright/test").Page){
 return page.evaluate(()=>{
    const root=document.querySelector('[data-studio-locked="true"]') as HTMLElement;
    const tb=root?.querySelector('[data-testid="belge-studio-preview-toolbar"]') as HTMLElement;
    const form=root?.querySelector('[data-belge-form-content="true"]') as HTMLElement;
    const formScroll=root?.querySelector('[data-testid="belge-studio-form-scroll"]') as HTMLElement;
    const footer=root?.querySelector('[data-testid="belge-studio-mobile-actions"]') as HTMLElement;
    const bounds=(x:HTMLElement|null)=>{const r=x?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null;};
    const visible=(x:HTMLElement|null)=>!!x&&x.getBoundingClientRect().width>0&&x.getBoundingClientRect().height>0 && getComputedStyle(x).visibility!=="hidden" && getComputedStyle(x).display!=="none";
    const ctrls=Array.from(tb?.querySelectorAll("button,a")??[]).filter(x=>visible(x as HTMLElement)).map(x=>({name:x.getAttribute("aria-label")||x.textContent?.trim().slice(0,40)||"",rect:bounds(x as HTMLElement)}));
    const overlaps:string[]=[];
    for(let i=0;i<ctrls.length;i++)for(let j=i+1;j<ctrls.length;j++){
      const a=ctrls[i].rect!,b=ctrls[j].rect!;
      if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1)
        overlaps.push(ctrls[i].name+" / "+ctrls[j].name);
    }
    return {dpr:devicePixelRatio,innerWidth,innerHeight,visualScale:visualViewport?.scale,
      rootScrollOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      toolbarVisible:visible(tb),toolbarRect:bounds(tb),overlaps,controls:ctrls,
      formVisible:visible(formScroll),formScrollRect:bounds(formScroll),mobileActionsVisible:visible(footer),
      status:form?.getAttribute("data-fit-status"),mode:form?.getAttribute("data-mode"),
      appliedScale:form?.getAttribute("data-scale"),computedZoom:form?getComputedStyle(form).zoom:null};
 });
}
async function zoom(page:import("@playwright/test").Page,target:number){
  await page.bringToFront();
  execFileSync("xdotool",["key","--clearmodifiers","ctrl+0"],{timeout:4000});
  await expect.poll(()=>page.evaluate(()=>devicePixelRatio),{timeout:4000}).toBeCloseTo(1,1);
  for(let i=0;i<9;i++){
    const now=await page.evaluate(()=>devicePixelRatio);
    if(Math.abs(now-target)<.025)return;
    if(now>target+.025)throw Error("zoom overshot target="+target+" now="+now);
    execFileSync("xdotool",["key","--clearmodifiers","ctrl+plus"],{timeout:4000});
    await expect.poll(()=>page.evaluate(()=>devicePixelRatio),{timeout:3000}).toBeGreaterThan(now+.02);
  }
  throw Error("could not reach zoom "+target);
}
for(const doc of ["santiye-sefi-sozlesmesi","beton-dokum-tutanagi"]){
test("DENETIM03 Z01-Z08 true Chrome window+zoom "+doc,async({page},info)=>{
  test.setTimeout(240000);
  const results:unknown[]=[]; const findings:string[]=[]; const errors:string[]=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/belgeler/"+doc,{waitUntil:"domcontentloaded",timeout:30000});
  const root=page.locator('[data-studio-locked="true"]:visible');
  await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
  try{
    for(const s of scenarios){
      await page.setViewportSize({width:s.w,height:s.h});
      await zoom(page,s.zoom);
      await page.evaluate(()=>new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r()))));
      const m=await measure(page);
      results.push({scenario:s,measurement:m});
      if(Math.abs(m.dpr-s.zoom)>.025)findings.push(s.code+": invalid browser zoom "+m.dpr);
      if(Math.abs(m.innerWidth-s.w/s.zoom)>5)findings.push(s.code+": css width did not reflow "+m.innerWidth);
      if(m.rootScrollOverflow>2)findings.push(s.code+": horizontal page overflow "+m.rootScrollOverflow);
      if(m.toolbarVisible && m.overlaps.length)findings.push(s.code+": toolbar collision "+m.overlaps.join(", "));
      if(m.innerWidth<1024 && !m.mobileActionsVisible)findings.push(s.code+": mobile actions inaccessible");
      if(m.innerWidth>=1024 && !m.toolbarVisible)findings.push(s.code+": desktop toolbar not visible");
      if(s.code==="Z02"||s.code==="Z05"||s.code==="Z06"||s.code==="Z08")
        await page.screenshot({path:"audit-artifacts-stage03-p0/"+doc+"-"+s.code+".png",animations:"disabled"});
    }
  }finally{
    execFileSync("xdotool",["key","--clearmodifiers","ctrl+0"],{timeout:4000});
    const data={doc,results,findings,errors};
    writeFileSync("audit-artifacts-stage03-p0/"+doc+".json",JSON.stringify(data,null,2));
    await info.attach(doc+"-p0.json",{body:Buffer.from(JSON.stringify(data,null,2)),contentType:"application/json"});
  }
  console.log("STAGE03_P0",JSON.stringify({doc,scenarios:results.length,findings,errors}));
  expect(errors).toEqual([]);
  expect(findings,JSON.stringify(findings)).toEqual([]);
});
}
