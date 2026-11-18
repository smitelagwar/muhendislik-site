/** P02: CLI ve kimlik mutasyonu, eski %0 fark sabiti yerine gerçek girdiyi denetler. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { calculateFullTakeoff } from "../../src/lib/hsyncad/quantities";
import { smallSlab, pdfText } from "../hsyncad-structural/report-fixtures";
import { generateQuantityReportPDF } from "../../src/lib/hsyncad/reports";
test("all Turkish owner variants compute the same geometry",()=>{
 const m=smallSlab();for(const name of ["MUSTAFA SELVİ","Mustafa Selvi","Bağımsız","SÜHEYLA KARA"]){m.name=name;assert.ok(Math.abs(calculateFullTakeoff(m).concreteVolumeM3.total!-2.4)<1e-8);}
});
test("CLI without an explicit source cannot pretend a reference PASS",()=>{
 const r=spawnSync(process.execPath,["--import","tsx","scripts/verify-metraj-idecad.mjs"],{encoding:"utf8",timeout:20000,windowsHide:true});assert.equal(r.status,2);assert.match(r.stderr,/Kullanım/);
});
test("CLI reads actual geometry and returns incomplete/nonzero for unknown steel",()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"hsyncad-p02-")),input=path.join(dir,"model.hsyncad"),output=path.join(dir,"result.json");
 fs.writeFileSync(input,JSON.stringify(smallSlab()));
 const r=spawnSync(process.execPath,["--import","tsx","scripts/verify-metraj-idecad.mjs","--input",input,"--output",output],{encoding:"utf8",timeout:30000,windowsHide:true});
 assert.equal(r.error,undefined);assert.equal(r.status,2,r.stderr);
 const result=JSON.parse(fs.readFileSync(output,"utf8"));assert.equal(result.comparisonAcceptance,false);assert.equal(result.observed.declaredRebarKg,null);assert.ok(Math.abs(result.observed.concreteM3-2.4)<1e-8);
});
test("old cached response cannot inject the printed tonnage into a PDF",async()=>{
 const m=smallSlab(),t=calculateFullTakeoff(m);t.rebarTonnage.totalKg=117421.93;
 const {text}=await pdfText(await generateQuantityReportPDF(m,t));assert.match(text,/VERİ EKSİK/);assert.doesNotMatch(text,/117[.,]421/);
});
