import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {structuralPreflight} from "../../src/lib/hsyncad/structural/preflight";
import type {CadModel} from "../../src/lib/hsyncad/model";
import type {LoadPatch} from "../../src/lib/hsyncad/structural/load-ledger";

const sha=(b:Uint8Array)=>createHash("sha256").update(b).digest("hex");
const args=process.argv.slice(2),arg=(k:string)=>args[args.indexOf(k)+1];
try {
  for(const flag of ["--model","--loads","--output"])if(!args.includes(flag)||!arg(flag)||arg(flag).startsWith("--"))throw new Error(`${flag} gerekli.`);
  const modelPath=arg("--model"),loadsPath=arg("--loads"),output=arg("--output");
  if(!path.isAbsolute(output))throw new Error("Yeni mutlak çıktı yolu gerekir.");
  const m=fs.readFileSync(modelPath),l=fs.readFileSync(loadsPath),patches=JSON.parse(l.toString()) as LoadPatch[];
  if(!Array.isArray(patches))throw new Error("Yük paketi dizi olmalıdır.");
  const packet=structuralPreflight(JSON.parse(m.toString()) as CadModel,patches);
  const outputData={sourceHashes:{model:sha(m),loads:sha(l)},...packet};
  const json=JSON.stringify(outputData,(_k,v)=>{if(typeof v==="number"&&!Number.isFinite(v))throw new Error("Diagnostic sonlu olmayan sayı içeriyor.");return v;},2)+"\n";
  if(sha(fs.readFileSync(modelPath))!==sha(m)||sha(fs.readFileSync(loadsPath))!==sha(l))throw new Error("Girdi dosyası işlem sırasında değişti.");
  fs.writeFileSync(output,json,{flag:"wx"});
  console.log(JSON.stringify({status:packet.status,issues:packet.issues.length,analysisApproved:false,output}));
  process.exitCode=packet.status==="input_ready"?0:2;
}catch(error){console.error(String(error));process.exitCode=1;}
