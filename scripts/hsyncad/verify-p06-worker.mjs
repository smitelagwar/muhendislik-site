import {build} from "esbuild";
import {chromium} from "@playwright/test";
import {writeFileSync} from "node:fs";
import assert from "node:assert/strict";
import {buildingFixture} from "./p06-fixtures";
async function main(){
 let browser=null;
 try{
  const bundle=await build({entryPoints:["src/lib/hsyncad/structural/solver-worker.ts"],bundle:true,platform:"browser",format:"iife",write:false,target:"es2022"});
  browser=await chromium.launch({headless:true});const page=await browser.newPage();page.setDefaultTimeout(10000);
  const report=await page.evaluate(async({code,input})=>{
   const url=URL.createObjectURL(new Blob([code],{type:"text/javascript"}));
   const run=(data)=>new Promise((resolve,reject)=>{
    const worker=new Worker(url),timer=setTimeout(()=>{worker.terminate();reject(Error("Worker job timeout"));},140000);
    worker.onmessage=e=>{clearTimeout(timer);worker.terminate();resolve(e.data);};worker.onerror=e=>{clearTimeout(timer);worker.terminate();reject(Error(e.message));};worker.postMessage(data);
   });
   try{
    let ticks=0;const clock=setInterval(()=>ticks++,10);
    const first=await run({id:"building",...input});clearInterval(clock);
    const small={...input,nodes:input.nodes.map(n=>({...n,prescribed:[0,0,0,0,0,0]}))};
    const second=await run({id:"fully-constrained",...small});
    const invalid=await run({id:"invalid",nodes:[],frames:[],shells:[],foundation:null});
    const cancelWorker=new Worker(url);let cancelledResult=false;cancelWorker.onmessage=()=>{cancelledResult=true;};cancelWorker.postMessage({id:"cancel",...input});
    await new Promise(resolve=>setTimeout(resolve,25));cancelWorker.terminate();await new Promise(resolve=>setTimeout(resolve,100));
    return {first:{status:first.result.status,elapsedMs:first.elapsedMs,balance:first.result.balance,numerical:first.result.numerical?{...first.result.numerical,x:undefined}:null,metadata:first.result.metadata},ticks,secondStatus:second.result.status,invalidStatus:invalid.result.status,cancelledWithoutResult:!cancelledResult};
   }finally{URL.revokeObjectURL(url);}
  },{code:bundle.outputFiles[0].text,input:buildingFixture()});
  writeFileSync(process.argv[2],JSON.stringify(report,null,2)+"\n",{flag:"wx"});
  assert.equal(report.first.status,"solved");assert.ok(report.first.elapsedMs<120000);assert.ok(report.ticks>5);assert.ok(report.first.balance.every(v=>Math.abs(v)<1e-4));assert.equal(report.secondStatus,"solved");assert.equal(report.invalidStatus,"invalid_input");assert.ok(report.cancelledWithoutResult);console.log(JSON.stringify(report));
 }catch(error){console.error(error);process.exitCode=1;}finally{if(browser)await browser.close();process.exit(process.exitCode??0);}
}
void main();
