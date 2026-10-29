import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const site="https://muhendislik-site.vercel.app/belgeler";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const context=await browser.newContext({serviceWorkers:"allow",viewport:{width:1366,height:768}});
const page=await context.newPage();
const errs=[],requests=[];
page.on("pageerror",e=>{errs.push({type:"pageerror",error:e.stack||String(e)});console.log("BROWSER_PAGEERROR",e.stack||String(e))});
page.on("console",m=>{if(m.type()==="error"){errs.push({type:"console-error",error:m.text()});console.log("BROWSER_CONSOLE",m.text())}});
page.on("requestfailed",r=>{requests.push({url:r.url(),error:r.failure()?.errorText});console.log("REQUEST_FAILED",r.url(),r.failure()?.errorText)});
page.on("response",r=>{if(r.status()>=400)console.log("HTTP_ERROR",r.status(),r.url())});
try{
  await page.goto(site,{waitUntil:"domcontentloaded",timeout:60000});
  await page.getByTestId("belgeler-offline-prepare").waitFor({timeout:45000});
  const button=page.getByTestId("belgeler-offline-prepare").locator("button").first();
  console.log("BEFORE_CLICK",await button.innerText());
  await button.click();
  console.log("AFTER_CLICK_URL",page.url());
  const deadline=Date.now()+120000;
  let state="";
  while(Date.now()<deadline){
    await page.waitForTimeout(2000);
    const text=await page.getByTestId("belgeler-offline-prepare").innerText().catch(()=>"COMPONENT_GONE");
    if(text!==state){state=text;console.log("PREP_STATUS",state.slice(0,250));}
    if(state.includes("Çevrimdışı hazır")&&!state.includes("hazırlanıyor"))break;
    if(state.includes("başarısız")||state.includes("Kaynak indirilemedi")||state.includes("Önbelleğe alınamadı")||state.includes("COMPONENT_GONE"))break;
  }
  const readyBeforeOffline=state.includes("Çevrimdışı hazır")&&!state.includes("hazırlanıyor");
  if(readyBeforeOffline){
    const paths=[
      "/belgeler/beton-dokum-tutanagi",
      "/belgeler/santiye-sefi-taahhutnamesi",
      "/belgeler/santiye-sefi-istifa-dilekcesi",
      "/belgeler/insaat-ruhsati-dilekcesi",
      "/belgeler/santiye-sefi-sozlesmesi",
    ];
    await context.setOffline(true);
    try{
      for(const path of paths){
        await page.goto("https://muhendislik-site.vercel.app"+path,{waitUntil:"domcontentloaded",timeout:30000});
        const canvas=page.getByTestId("belge-studio-preview-canvas").locator("canvas").first();
        await page.waitForFunction(() => {
          const c=document.querySelector("[data-testid='belge-studio-preview-canvas'] canvas");
          return c instanceof HTMLCanvasElement && c.height>200 && c.width>200;
        },null,{timeout:45000});
        console.log("OFFLINE_PDF_PASS",path,await canvas.evaluate(c=>({width:c.width,height:c.height})));
        if(path.includes("beton-dokum-tutanagi")){
          const button=page.getByRole("button",{name:"PDF İndir",exact:true}).first();
          await button.waitFor({timeout:20000});
          const downloadPromise=page.waitForEvent("download",{timeout:30000});
          await button.click();
          const dl=await downloadPromise;
          console.log("OFFLINE_PDF_DOWNLOAD",dl.suggestedFilename());
          if(!dl.suggestedFilename().endsWith(".pdf"))throw Error("Offline download did not produce a PDF");
        }
      }
      console.log("LIVE_OFFLINE_5_OF_5_OK");
    } finally {await context.setOffline(false);}
  }
  await fs.mkdir("test-results/live-prep",{recursive:true});
  await page.screenshot({path:"test-results/live-prep/final.png",fullPage:true}).catch(()=>{});
  const body=(await page.locator("body").innerText().catch(()=>"")).slice(0,3000);
  console.log("FINAL_URL",page.url());
  console.log("FINAL_BUTTON",state);
  console.log("FINAL_BODY",body);
  console.log("ERRORS",JSON.stringify(errs.slice(0,30)));
  console.log("REQUESTS_FAILED",JSON.stringify(requests.slice(0,30)));
  const ready=state.includes("Çevrimdışı hazır")&&!state.includes("hazırlanıyor");
  if(!ready){console.error("LIVE_PREP_NOT_READY");process.exitCode=1;}
}catch(e){console.log("CATCH",e.stack||String(e));process.exitCode=1;}
finally{await context.close();await browser.close();}
