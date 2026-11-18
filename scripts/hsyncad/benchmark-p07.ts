import {writeFileSync} from "node:fs";
import {solveModalStructure} from "../../src/lib/hsyncad/structural/modal-structure";
import {dynamicBuilding} from "./p07-fixtures";
const input=dynamicBuilding(),start=performance.now(),limits={timeMs:180000,rssBytes:1500000000,maxModes:64};
const result=solveModalStructure(input,{maxModes:limits.maxModes,initialSubspace:16,maxIterations:160,maxBasisEntries:4000000,maxFactorEntries:4000000,cancelled:()=>performance.now()-start>limits.timeMs});
const elapsedMs=performance.now()-start,rssBytes=process.memoryUsage().rss;
const report={profile:"synthetic spatial frame + flexible floor shells; no native equivalence",nodes:input.nodes.length,frames:input.frames.length,shells:input.shells.length,limits,elapsedMs,rssBytes,status:result.status,
 ...(result.status==="solved"?{metadata:result.metadata,coverage:result.coverage,orthogonalityError:result.orthogonalityError,modes:result.modes.map(m=>({number:m.number,omega2:m.omega2,periodSeconds:m.periodSeconds,relativeResidual:m.relativeResidual,participation:m.participation,zeroParticipation:m.zeroParticipation}))}:{diagnostic:result}),
 pass:result.status==="solved"&&elapsedMs<limits.timeMs&&rssBytes<limits.rssBytes};
writeFileSync(process.argv[2],JSON.stringify(report,null,2)+"\n",{flag:"wx"});console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
