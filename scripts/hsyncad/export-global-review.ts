import {readFileSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import path from "node:path";
import {runGlobalReview,type GlobalReviewInput} from "../../src/lib/hsyncad/structural/global-review";
try{
 const args=process.argv.slice(2);if(args.length!==4||args[0]!=="--input"||args[2]!=="--output"||!path.isAbsolute(args[1])||!path.isAbsolute(args[3]))throw Error("Usage: --input <absolute.json> --output <new-absolute.json>");
 const bytes=readFileSync(args[1]),hash=createHash("sha256").update(bytes).digest("hex"),request=JSON.parse(bytes.toString("utf8")) as {input:GlobalReviewInput;maxModes:number};
 if(!Number.isSafeInteger(request.maxModes)||request.maxModes<1||request.maxModes>128)throw Error("Bounded modal budget required (1..128).");
 const result=runGlobalReview(request.input,{maxModes:request.maxModes,maxIterations:160,maxFactorEntries:4000000,maxBasisEntries:4000000});
 if(createHash("sha256").update(readFileSync(args[1])).digest("hex")!==hash)throw Error("Input changed during review.");
 writeFileSync(args[3],JSON.stringify({schemaVersion:1,inputSha256:hash,result,engineeringAcceptance:false},null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({status:result.status,engineeringAcceptance:false}));process.exitCode=result.status==="checks_ready"?0:result.status==="invalid_input"?1:2;
}catch(error){console.error(String(error));process.exitCode=1;}
