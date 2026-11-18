import {readFileSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import path from "node:path";
import {designWalls,type WallDesignScope} from "../../src/lib/hsyncad/structural/wall-design";
import {runWallSystemReview,type CouplingTransferDefinition,type WallRebuild} from "../../src/lib/hsyncad/structural/wall-system-review";
import type {GlobalReviewInput} from "../../src/lib/hsyncad/structural/global-review";
import type {EigenOptions} from "../../src/lib/hsyncad/structural/modal-eigen";
type Request={operation:"members";scope:WallDesignScope}|{operation:"system";globalInput:GlobalReviewInput;definitions:CouplingTransferDefinition[];solverOptions:EigenOptions;designs:ReturnType<WallRebuild>|null};
try{
 const args=process.argv.slice(2);if(args.length!==4||args[0]!=="--input"||args[2]!=="--output"||!path.isAbsolute(args[1])||!path.isAbsolute(args[3]))throw Error("Kullanım: --input <mutlak.json> --output <yeni-mutlak.json>");
 const bytes=readFileSync(args[1]);if(bytes.length>30000000)throw Error("Girdi bütçesi aşıldı.");const hash=createHash("sha256").update(bytes).digest("hex"),request=JSON.parse(bytes.toString("utf8")) as Request;
 if(!["members","system"].includes(request.operation))throw Error("Açık members veya system işlemi gerekli.");
 const result=request.operation==="members"?designWalls(request.scope):runWallSystemReview(request.globalInput,request.solverOptions,request.definitions,request.designs?()=>request.designs!:undefined),serialized=JSON.stringify({schemaVersion:1,inputSha256:hash,result,engineeringAcceptance:false},(_key,value)=>{if(typeof value==="number"&&!Number.isFinite(value))throw Error("Sonuçta sonlu olmayan sayı var.");return value;},2)+"\n";
 if(createHash("sha256").update(readFileSync(args[1])).digest("hex")!==hash)throw Error("Girdi çalışma sırasında değişti.");writeFileSync(args[3],serialized,{flag:"wx"});console.log(JSON.stringify({operation:request.operation,status:result.status,engineeringAcceptance:false}));if(!["wall_scope_ready","wall_review_ready"].includes(result.status))process.exitCode=2;
}catch(error){console.error(String(error));process.exitCode=1;}
