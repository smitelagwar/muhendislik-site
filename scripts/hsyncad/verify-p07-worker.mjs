import {build} from "esbuild";
import {chromium} from "@playwright/test";
import {readFileSync,writeFileSync} from "node:fs";
import assert from "node:assert/strict";
import {dynamicBuilding} from "./p07-fixtures";
import {cantileverModal} from "../../tests/hsyncad-structural/modal-fixtures";
async function main(){
 let browser=null;
 try{
  const bundle=await build({entryPoints:["src/lib/hsyncad/structural/dynamic-worker.ts"],bundle:true,platform:"browser",format:"iife",write:false,target:"es2022"});
  browser=await chromium.launch({headless:true});const page=await browser.newPage();
  const result=await page.evaluate(async({code,input,small})=>{
   const url=URL.createObjectURL(new Blob([code],{type:"text/javascript"}));
   const run=request=>new Promise((resolve,reject)=>{const w=new Worker(url),timer=setTimeout(()=>{w.terminate();reject(Error("Dynamic Worker timeout"));},195000);w.onmessage=e=>{clearTimeout(timer);w.terminate();resolve(e.data);};w.onerror=e=>{clearTimeout(timer);w.terminate();reject(Error(e.message));};w.postMessage(request);});
   try{
    let ticks=0;const timer=setInterval(()=>ticks++,10),large=await run({id:"large",operation:"modal",input,maxModes:64});clearInterval(timer);
    const spectrum={hazard:"DD-2",ss:1,s1:.3,soil:"ZC",dataSource:"synthetic Worker fixture"},direction={id:"X",reduction:{R:4,D:2,I:1},orientation:"horizontal",equivalentCheck:{shearKn:1,irregularity:{A1:false,B2:false,B3:false,decisionSource:"synthetic decision"}}};
    const response=await run({id:"spectrum",operation:"spectrum",input:small,maxModes:4,spectrum,direction}),bad=await run({id:"bad",operation:"modal",input:{},maxModes:4});
    const w=new Worker(url);let cancelledResult=false;w.onmessage=()=>{cancelledResult=true;};w.postMessage({id:"cancel",operation:"modal",input,maxModes:64});await new Promise(r=>setTimeout(r,25));w.terminate();await new Promise(r=>setTimeout(r,100));
    return {large:{status:large.result.status,elapsedMs:large.elapsedMs,metadata:large.result.metadata,coverage:large.result.coverage,orthogonalityError:large.result.orthogonalityError,modes:large.result.modes?.map(m=>({periodSeconds:m.periodSeconds,relativeResidual:m.relativeResidual,participation:m.participation}))},ticks,response:{status:response.result.status,baseShearKn:response.result.baseShearKn,displacement:response.result.nodes?.[1].displacement.maxima[0],metadata:response.result.metadata},invalidStatus:bad.result.status,cancelledWithoutResult:!cancelledResult};
   }finally{URL.revokeObjectURL(url);}
  },{code:bundle.outputFiles[0].text,input:dynamicBuilding(),small:cantileverModal()});
  writeFileSync(process.argv[2],JSON.stringify(result,null,2)+"\n",{flag:"wx"});
  assert.equal(result.large.status,"solved");assert.ok(result.large.elapsedMs<180000);assert.ok(result.large.coverage.X>.97&&result.large.coverage.Y>.97&&result.large.coverage.RZ>=.95);assert.ok(result.large.modes.every(m=>m.relativeResidual<=1e-7));assert.ok(result.ticks>5);assert.equal(result.response.status,"solved");assert.equal(result.response.metadata.statisticalMaximaAreCoincident,false);assert.equal(result.invalidStatus,"invalid_input");assert.ok(result.cancelledWithoutResult);
  const local=JSON.parse(readFileSync(process.argv[3],"utf8"));assert.ok(Math.abs(local.modes[0].periodSeconds-result.large.modes[0].periodSeconds)<1e-6);console.log(JSON.stringify(result));
 }catch(error){console.error(error);process.exitCode=1;}finally{if(browser)await browser.close();process.exit(process.exitCode??0);}
}
void main();
