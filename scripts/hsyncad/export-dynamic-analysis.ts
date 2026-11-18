import {readFileSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import path from "node:path";
import {solveModalStructure} from "../../src/lib/hsyncad/structural/modal-structure";
import {responseSpectrum} from "../../src/lib/hsyncad/structural/response-spectrum";
try{
 const args=process.argv.slice(2);if(args.length!==4||args[0]!=="--input"||args[2]!=="--output"||!path.isAbsolute(args[1])||!path.isAbsolute(args[3]))throw Error("Usage: --input <absolute.json> --output <new-absolute.json>");
 const bytes=readFileSync(args[1]),input=JSON.parse(bytes.toString("utf8")),hash=createHash("sha256").update(bytes).digest("hex");
 if(!["modal","spectrum"].includes(input.operation)||!Number.isSafeInteger(input.maxModes)||input.maxModes<1||input.maxModes>128||!input.modelRevision)throw Error("Operation/revision/modal budget required.");
 const options={maxModes:input.maxModes,maxIterations:160,maxFactorEntries:4000000,maxBasisEntries:4000000};
 const result=input.operation==="modal"?solveModalStructure(input.structure,options):responseSpectrum(input.structure,options,input.spectrum,input.direction,input.method,input.damping);
 if(createHash("sha256").update(readFileSync(args[1])).digest("hex")!==hash)throw Error("Input changed during analysis.");
 writeFileSync(args[3],JSON.stringify({schemaVersion:1,modelRevision:input.modelRevision,inputSha256:hash,operation:input.operation,result,engineeringAcceptance:false},null,2)+"\n",{flag:"wx"});
 console.log(JSON.stringify({status:result.status,engineeringAcceptance:false}));if(result.status!=="solved")process.exitCode=2;
}catch(error){console.error(String(error));process.exitCode=1;}
