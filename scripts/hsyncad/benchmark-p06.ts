import {writeFileSync} from "node:fs";
import {solveLinearStructure} from "../../src/lib/hsyncad/structural/linear-structure";
import {buildingFixture} from "./p06-fixtures";
const input=buildingFixture(),start=performance.now();
const result=solveLinearStructure(input.nodes,input.frames,input.shells,input.foundation,{maxFactorEntries:4000000});
const elapsedMs=performance.now()-start;
const solved=result.status==="solved";
const report={profile:"synthetic 8x8 grid, 24 stories with floor shells; no MS1 equivalence",declaredLimits:{elapsedMs:120000,factorEntries:4000000,rssBytes:1500000000,balanceAbsolute:1e-4},nodes:input.nodes.length,frames:input.frames.length,shells:input.shells.length,elapsedMs,rssBytes:process.memoryUsage().rss,status:result.status,
 ...(solved?{numerical:result.numerical&&{...result.numerical,x:undefined},metadata:result.metadata,balance:result.balance,maxDisplacement:Math.max(...result.nodes.flatMap(n=>n.displacement.map(Math.abs)))}:{diagnostic:result}),
 pass:solved&&elapsedMs<120000&&process.memoryUsage().rss<1500000000&&result.balance.every(v=>Math.abs(v)<1e-4)};
writeFileSync(process.argv[2],JSON.stringify(report,null,2)+"\n",{flag:"wx"});console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
