import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright";
import { PDFDocument } from "pdf-lib";
import { POST as createShare } from "../../src/app/api/belgeler/paylasim/route";
import { POST as bootstrap, GET as quota } from "../../src/app/api/belgeler/paylasim/kota/route";
import { GET as readPdf } from "../../src/app/api/belgeler/paylasim/[token]/pdf/route";
import { MemoryBelgePaylasimRepository, setBelgePaylasimRepositoryForTest } from "../../src/lib/belge-paylasim/repository";
import { MemoryBelgeBlobStore, setBelgeBlobStoreForTest } from "../../src/lib/belge-paylasim/blob-store";
import { buildBelgeFilename } from "../../src/lib/belge-filename";
import { getDocumentPdfProfiles, normalizePdfFieldValue } from "../../src/lib/belgeler-pdf-profiles";
import { stage12Documents } from "../../tests/belgeler/fixtures/stage12-cases";

const evidence=dirname(fileURLToPath(import.meta.url)),root=resolve(evidence,"../..");
for(const name of Object.keys(process.env))if(/DATABASE|POSTGRES|NEON|BLOB|VERCEL|BELGE_SHARE_SECRET|CRON_SECRET|SHARE_TOKEN|NODE_OPTIONS|NODE_PATH/i.test(name))delete process.env[name];
process.env.NODE_ENV="test";
const checks: Array<{id:string;result:"PASS"}>=[];
const sourceHashes=["src/lib/pdf-engine.ts","src/lib/belge-filename.ts","src/lib/belge-paylasim/server-pdf.ts"].map(file=>({file,sha256:createHash("sha256").update(readFileSync(resolve(root,file))).digest("hex")}));
const started=Date.now();let browser:Browser|null=null,server:ReturnType<typeof spawn>|null=null,fatal:string|null=null,serverLog="",phase="startup";
const hash=(bytes:Uint8Array)=>createHash("sha256").update(bytes).digest("hex");
const check=(id:string)=>checks.push({id,result:"PASS"});
async function port(){return new Promise<number>((done,reject)=>{const p=createServer();p.once("error",reject);p.listen(0,"127.0.0.1",()=>{const a=p.address();const n=typeof a==="object"&&a?a.port:0;p.close(()=>done(n));});});}
async function stopServer(){if(!server||server.exitCode!==null)return;await new Promise<void>(done=>{if(process.platform==="win32"){const killer=spawn("taskkill.exe",["/PID",String(server!.pid),"/T","/F"],{stdio:"ignore",windowsHide:true});killer.once("close",()=>done());killer.once("error",()=>done());}else{server!.kill("SIGKILL");server!.once("close",()=>done());}});}
async function ready(page:Page){
  await page.getByRole("button",{name:"PDF İndir",exact:true}).filter({visible:true}).waitFor();
  await page.waitForFunction(()=>{const b=[...document.querySelectorAll("button")].find(n=>n.textContent?.trim()==="PDF İndir"&&n.getBoundingClientRect().width>0);return b&&!b.disabled;});
}
async function downloaded(page:Page){
  await ready(page);const promise=page.waitForEvent("download");await page.getByRole("button",{name:"PDF İndir",exact:true}).filter({visible:true}).click();
  const item=await promise;const path=await item.path();assert.ok(path);return{bytes:readFileSync(path),filename:item.suggestedFilename()};
}
async function main(){
  const watchdog=setTimeout(async()=>{writeFileSync(resolve(evidence,"ASAMA_12_browser.json"),JSON.stringify({result:"FAIL",error:"TIMEOUT",checks}));setTimeout(()=>process.exit(124),5000);await browser?.close().catch(()=>{});await stopServer();process.exit(124);},240000);
  try{
    setBelgePaylasimRepositoryForTest(new MemoryBelgePaylasimRepository());setBelgeBlobStoreForTest(new MemoryBelgeBlobStore());
    const selected=await port(),origin=`http://127.0.0.1:${selected}`;
    server=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","--webpack","--hostname","127.0.0.1","--port",String(selected)],{cwd:root,env:{...process.env,NODE_ENV:"development",NEXT_DIST_DIR:".next-stage12",NEXT_TELEMETRY_DISABLED:"1"},stdio:["ignore","pipe","pipe"],windowsHide:true});
    server.stdout?.on("data",c=>{serverLog+=c;});server.stderr?.on("data",c=>{serverLog+=c;});
    for(let i=0;i<120;i++){try{if((await fetch(origin+"/belgeler/beton-dokum-tutanagi",{signal:AbortSignal.timeout(2000)})).ok)break;}catch{/* compiling */}assert.equal(server.exitCode,null);await new Promise(done=>setTimeout(done,250));}
    browser=await chromium.launch({headless:true});
    const fields=["yibf","santiye_sefi_ad_soyad","ad_soyad","ad_soyad","muteahhit_unvan"];
    for(const [index,doc]of stage12Documents.entries()){
      phase=`${doc.name}: open studio`;
      const context=await browser.newContext({viewport:{width:1366,height:900}});const page=await context.newPage();page.setDefaultTimeout(8000);page.setDefaultNavigationTimeout(45000);
      const errors:string[]=[];page.on("pageerror",()=>errors.push("unexpected browser error"));
      const captures:Array<{values:Record<string,string>;viewToken:string;bytes:Uint8Array}>=[];
      await page.route("**/api/belgeler/paylasim**",async route=>{
        try{
          const req=route.request(),url=new URL(req.url());const headers={...req.headers(),host:url.host,origin:url.origin};
          const request=new Request(req.url(),{method:req.method(),headers,...(req.method()==="POST"?{body:req.postData()??""}:{})});
          let response:Response;
          if(url.pathname.endsWith("/kota"))response=req.method()==="POST"?await bootstrap(request):await quota(request);
          else{
            assert.equal(req.method(),"POST");const input=req.postDataJSON();response=await createShare(request);assert.ok([200,201].includes(response.status),"isolated share creation failed");
            const result=await response.clone().json();const pdf=await readPdf(new Request(origin+"/isolated-pdf"),{params:Promise.resolve({token:result.viewToken})});
            assert.equal(pdf.status,200);captures.push({values:input.values,viewToken:result.viewToken,bytes:new Uint8Array(await pdf.arrayBuffer())});
          }
          await route.fulfill({status:response.status,headers:Object.fromEntries(response.headers.entries()),body:Buffer.from(await response.arrayBuffer())});
        }catch{errors.push("isolated API bridge failure");await route.fulfill({status:500,contentType:"application/json",body:JSON.stringify({code:"ISOLATED_BRIDGE_FAILURE",message:"İzole test hatası"})});}
      });
      await page.goto(origin+"/belgeler/"+doc.id);phase=`${doc.name}: initial PDF ready`;await ready(page);
      const field=fields[index];const input=page.locator(`[data-belge-form-content] input[id$="-${field}"], [data-belge-form-content] textarea[id$="-${field}"]`);
      const expand=page.getByTestId("belge-sections-toggle-all");if((await expand.getAttribute("title"))==="Tümünü Aç")await expand.click();
      await input.waitFor();const original=await input.inputValue();
      // Inline commit is the last edit before share; the request must wait for the current PDF revision.
      phase=`${doc.name}: inline edit`;await page.getByTestId("belge-inline-edit-toggle").click();await page.getByTestId("belge-inline-hotspot-"+field).click();
      await page.getByTestId("belge-inline-edit-input").fill(field==="yibf"?"12345678":"Çağrı Işık ŞİMŞEK");
      await page.getByTestId("belge-inline-edit-apply").click();
      const share=page.getByRole("button",{name:"Paylaş",exact:true}).filter({visible:true});phase=`${doc.name}: open share`;await share.click();
      const create=page.getByTestId("belge-share-create-btn");phase=`${doc.name}: share dialog ready`;await create.waitFor();
      await page.waitForFunction(()=>{const b=document.querySelector('[data-testid="belge-share-create-btn"]');return b instanceof HTMLButtonElement&&!b.disabled;});
      await create.click();await page.getByTestId("belge-share-result").waitFor();assert.equal(captures.length,1);const first=captures[0];const firstHash=hash(first.bytes);
      assert.equal(first.values[field],field==="yibf"?"12345678":"Çağrı Işık ŞİMŞEK");check(`${doc.name}-inline-latest-share-real-generator`);
      await page.getByTestId("belge-share-close-btn").click();assert.equal(await share.evaluate(n=>document.activeElement===n),true);
      const download=await downloaded(page);assert.equal(download.filename,buildBelgeFilename(doc.id,first.values));
      const editable=await PDFDocument.load(download.bytes);assert.equal(editable.getPageCount(),doc.pages);
      for(const [key,profile]of Object.entries(getDocumentPdfProfiles(doc.id)))assert.equal(editable.getForm().getTextField(key).getText()??"",normalizePdfFieldValue(profile.fixedValue??first.values[key],profile.multiline),`${doc.name}/${key}`);
      if(field==="yibf")assert.ok(!download.filename.includes("YIBF"));check(`${doc.name}-share-download-all-fields-filename-focus`);
      // Pending debounce cannot expose old download bytes under the new form name.
      await input.fill(field==="yibf"?"0071234":"Özgür Ünal Çığ");
      assert.equal(await page.getByRole("button",{name:"PDF İndir",exact:true}).filter({visible:true}).isEnabled(),false);
      await share.click();await page.waitForFunction(()=>{const b=document.querySelector('[data-testid="belge-share-create-btn"]');return b instanceof HTMLButtonElement&&!b.disabled;});
      await create.click();await page.getByTestId("belge-share-result").waitFor();assert.equal(captures.length,2);assert.notEqual(captures[1].values[field],first.values[field]);
      const old=await readPdf(new Request(origin+"/isolated-pdf"),{params:Promise.resolve({token:first.viewToken})});assert.equal(hash(new Uint8Array(await old.arrayBuffer())),firstHash);check(`${doc.name}-debounce-revision-old-link-immutable`);
      await page.getByTestId("belge-share-close-btn").click();
      // Existing clear -> undo path, then user-approved device draft restore.
      const prior=await input.inputValue();page.once("dialog",dialog=>dialog.accept());await page.getByRole("button",{name:"Temizle",exact:true}).filter({visible:true}).click();
      assert.equal(await input.inputValue(),"");await page.getByRole("button",{name:"Geri al",exact:true}).filter({visible:true}).click();assert.equal(await input.inputValue(),prior);check(`${doc.name}-clear-undo-form-values`);
      await page.getByTestId("belge-draft-consent-device").click();
      await page.waitForFunction(({id,key})=>{const raw=localStorage.getItem(`belgeler:ux:draft:device:v1:${id}`);return raw&&JSON.parse(raw).values[key];},{id:doc.id,key:field});
      await page.reload();await page.getByTestId("belge-draft-restore-confirm").click();
      const expandRestored=page.getByTestId("belge-sections-toggle-all");if((await expandRestored.getAttribute("title"))==="Tümünü Aç")await expandRestored.click();
      assert.equal(await input.inputValue(),prior);await ready(page);
      const restored=await downloaded(page);const restoredPdf=await PDFDocument.load(restored.bytes);assert.equal(restoredPdf.getForm().getTextField(field).getText(),prior);check(`${doc.name}-draft-restore-editable-download`);
      await input.focus();await page.getByTestId("belge-field-focus-highlight").waitFor();
      const formMenu=page.getByTestId("belge-studio-form-view-trigger");await formMenu.click();await page.getByTestId("form-view-fit").click();
      assert.equal(await page.locator("[data-belge-form-content]").getAttribute("data-mode"),"fit");check(`${doc.name}-field-focus-form-fit`);
      // Capture the print URL through a controlled window stub; no OS print dialog.
      await page.evaluate(()=>{const state={url:"",prints:0};let load:(()=>void)|null=null;Object.assign(window,{stage12Print:state});window.open=(()=>({closed:false,location:{get href(){return state.url;},set href(value:string){state.url=value;queueMicrotask(()=>load?.());}},addEventListener(_type:string,listener:()=>void){load=listener;},removeEventListener(){load=null;},focus(){},print(){state.prints++;}}))as unknown as typeof window.open;});
      await page.getByRole("button",{name:"Yazdır",exact:true}).filter({visible:true}).click();
      assert.ok(await page.evaluate(()=>{const state=(window as unknown as {stage12Print:{url:string;prints:number}}).stage12Print;return state.url.startsWith("blob:")&&state.prints===1;}));
      const printBytes=await page.evaluate(async()=>{const url=(window as unknown as {stage12Print:{url:string}}).stage12Print.url;return Array.from(new Uint8Array(await(await fetch(url)).arrayBuffer()));});
      const printed=await PDFDocument.load(new Uint8Array(printBytes));assert.equal(printed.getForm().getTextField(field).getText(),prior);check(`${doc.name}-print-current-blob-handoff`);
      assert.deepEqual(errors,[]);assert.notEqual(original,prior);check(`${doc.name}-no-browser-or-bridge-errors`);
      await context.close();console.log(`PASS: ${doc.name} current share/download, immutable old link, undo/draft/focus/form/print`);
    }
  }catch(error){fatal=`${phase}: ${error instanceof Error?(error.stack??error.message):String(error)}`;process.exitCode=1;}
  finally{
    if(browser)await browser.close().catch(()=>{});await stopServer();clearTimeout(watchdog);
    setBelgePaylasimRepositoryForTest(null);setBelgeBlobStoreForTest(null);
    writeFileSync(resolve(evidence,"ASAMA_12_dev-server.log"),serverLog.replace(/[A-Za-z0-9_-]{43}/g,"[redacted-fixture-value]"));
    for(const source of sourceHashes)if(hash(readFileSync(resolve(root,source.file)))!==source.sha256){fatal="product source changed during browser test";process.exitCode=1;}
    const report={result:fatal?"FAIL":"PASS",sourceHashes,scope:"real Next dev studios + Playwright transport bridge calling actual create/quota/PDF handlers, real server PDF generation, isolated Memory DB/Blob; not real Neon/Blob; controlled print window",checks,passed:checks.length,failed:fatal?1:0,skipped:0,durationMs:Date.now()-started,error:fatal};
    writeFileSync(resolve(evidence,"ASAMA_12_browser.json"),JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify({result:report.result,passed:report.passed,failed:report.failed,durationMs:report.durationMs,error:fatal}));process.exit(process.exitCode??0);
  }
}
void main();
