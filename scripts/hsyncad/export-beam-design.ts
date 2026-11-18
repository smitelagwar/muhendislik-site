import {readFileSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import path from "node:path";
import {designBeams,type BeamDesignInput} from "../../src/lib/hsyncad/structural/beam-design";
try{
 const args=process.argv.slice(2);if(args.length!==4||args[0]!=="--input"||args[2]!=="--output"||!path.isAbsolute(args[1])||!path.isAbsolute(args[3]))throw Error("Kullanım: --input <mutlak.json> --output <yeni-mutlak.json>");
 const bytes=readFileSync(args[1]);if(bytes.length>30000000)throw Error("Girdi bütçesi aşıldı.");const hash=createHash("sha256").update(bytes).digest("hex"),request=JSON.parse(bytes.toString("utf8")) as {beams:BeamDesignInput[]};
 const result=designBeams(request.beams);
 const serialized=JSON.stringify({schemaVersion:1,inputSha256:hash,result,engineeringAcceptance:false},(_key,value)=>{if(typeof value==="number"&&!Number.isFinite(value))throw Error("Sonuçta sonlu olmayan sayı var.");return value;},2)+"\n";
 if(createHash("sha256").update(readFileSync(args[1])).digest("hex")!==hash)throw Error("Girdi çalışma sırasında değişti.");
 writeFileSync(args[3],serialized,{flag:"wx"});console.log(JSON.stringify({status:result.status,inputCount:result.inputCount,outputCount:result.outputCount,engineeringAcceptance:false}));if(result.status!=="designs_ready")process.exitCode=2;
}catch(error){console.error(String(error));process.exitCode=1;}
