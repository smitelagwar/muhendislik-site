import {writeFileSync} from "node:fs";
import {responseSpectrum} from "../../src/lib/hsyncad/structural/response-spectrum";
import {spectrumParameters,evaluateSpectrum,equivalentBaseShear,type StandardSpectrum} from "../../src/lib/hsyncad/structural/design-spectrum";
import {dynamicBuilding} from "./p07-fixtures";
const input=dynamicBuilding(),spectrum:StandardSpectrum={hazard:"DD-2",ss:1,s1:.3,soil:"ZC",dataSource:"synthetic size/performance benchmark"},reduction={R:7,D:2.5,I:1},parameters=spectrumParameters(spectrum),mass=input.inertias.reduce((s,m)=>s+m.values[0],0);
const equivalentPeriodSec=1,equivalentShearKn=equivalentBaseShear(mass,evaluateSpectrum(spectrum,equivalentPeriodSec,reduction).reducedMps2,parameters.sds,1),start=performance.now();
const result=responseSpectrum(input,{maxModes:64,initialSubspace:16,maxIterations:160,maxBasisEntries:4000000,maxFactorEntries:4000000,cancelled:()=>performance.now()-start>180000},spectrum,{id:"X",orientation:"horizontal",reduction,equivalentCheck:{shearKn:equivalentShearKn,irregularity:{A1:false,B2:false,B3:false,decisionSource:"benchmark regularity declaration only; not code classification"}}},"CQC",.05);
const elapsedMs=performance.now()-start,rssBytes=process.memoryUsage().rss;
const report={profile:"full signed modal response + local covariances on all synthetic building elements",declaredEquivalentPeriodSec:equivalentPeriodSec,equivalentPeriodCodeApproved:false,limits:{timeMs:180000,rssBytes:1500000000},elapsedMs,rssBytes,status:result.status,
 ...(result.status==="solved"?{nodes:result.nodes.length,members:result.members.length,shells:result.shells.length,modes:result.modes.length,coverage:result.modal.coverage,baseShearKn:result.baseShearKn,scaling:result.scaling,metadata:result.metadata,firstMember:result.members[0],lastShellMaxima:result.shells.at(-1)!.globalNodalForces.maxima}:{diagnostic:result}),
 pass:result.status==="solved"&&elapsedMs<180000&&rssBytes<1500000000&&result.members.length===input.frames.length&&result.shells.length===input.shells.length};
writeFileSync(process.argv[2],JSON.stringify(report,null,2)+"\n",{flag:"wx"});console.log(JSON.stringify({...report,firstMember:undefined}));if(!report.pass)process.exitCode=1;
