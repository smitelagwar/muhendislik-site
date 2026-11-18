import test from "node:test";
import assert from "node:assert/strict";
import {punchingPerimeter,checkInteriorPunching,punchingCapacityGate} from "../../src/lib/hsyncad/structural/punching-shear";
import {analyzeSlabTopology} from "../../src/lib/hsyncad/structural/slab-geometry";
import {checkSlabMeshConvergence,designOneWaySlabStrip,designSlabShellZones,type SlabStripBar} from "../../src/lib/hsyncad/structural/slab-design";
import {reviewOneWaySlabStripService,reviewSlabInstantService} from "../../src/lib/hsyncad/structural/slab-service";
import {recoverSlabShellResultants} from "../../src/lib/hsyncad/structural/slab-forces";
import {solveLinearStructure} from "../../src/lib/hsyncad/structural/linear-structure";
import {beamCaseFromLinear,combineBeamCases,type BeamCase} from "../../src/lib/hsyncad/structural/beam-forces";
import {beamTestMaterial,solvedUniformBeam} from "./beam-fixtures";
import type {FrameElement,FrameNode} from "../../src/lib/hsyncad/structural/frame-element";

const identity={modelRevision:"r1",stiffnessSet:"k1",analysisStamp:"a1"};
const rect=(x0:number,y0:number,x1:number,y1:number)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]] as const;
function perim(){return punchingPerimeter({boundary:{outer:rect(0,0,10,10),openings:[]},support:{id:"C1",kind:"column",footprint:rect(4.8,4.8,5.2,5.2),origin:[5,5]},effectiveDepthM:.2});}
test("interior rectangular punching uses actual net vertical shear, moments, and TS500 8.21/8.24",()=>{
 const geometry=perim();assert.equal(geometry.geometryStatus,"solved");assert.ok(Math.abs(geometry.retainedLengthM-2.4)<1e-12);
 const result=checkInteriorPunching({perimeter:geometry,support:{id:"C1",kind:"column",footprint:rect(4.8,4.8,5.2,5.2),origin:[5,5]},action:{...identity,source:"current P06 force cut",NaboveKn:0,NbelowKn:400,FaKn:20,MxAdjacentKnM:[50,50],MyAdjacentKnM:[0,0]},expectedCurrent:identity,material:{fctdMPa:1.2,source:"TS500 table 3.2/C25",evidence:"verified C25"}});
 assert.equal(result.status,"passed");if(result.status==="passed"){assert.ok(Math.abs(result.gamma-.8)<1e-12);assert.ok(Math.abs(result.VprKn-460.8)<1e-10);assert.equal(result.VpdKn,380);}
});
test("punching boundary, close opening, elongated support and wall-end stay gated",()=>{
 const edge=punchingPerimeter({boundary:{outer:rect(0,0,4,4),openings:[]},support:{id:"C",kind:"column",footprint:rect(-.05,-.05,.25,.25),origin:[.1,.1]},effectiveDepthM:.2});assert.equal(edge.classification,"corner");assert.equal(punchingCapacityGate(edge).status,"unsupported");
 const hole=punchingPerimeter({boundary:{outer:rect(0,0,4,4),openings:[rect(1,1,1.2,1.2)]},support:{id:"C",kind:"column",footprint:rect(1.5,1.5,1.9,1.9),origin:[1.7,1.7]},effectiveDepthM:.2});assert.equal(hole.geometryStatus,"unsupported");
 assert.throws(()=>punchingPerimeter({boundary:{outer:rect(0,0,4,4),openings:[]},support:{id:"bad",kind:"column",footprint:[[1,1],[2,1],[1.5,2]],origin:[1.5,1.5]},effectiveDepthM:.2}));
});
test("one-way slab panel topology follows support edge normals and the exact aspect threshold",()=>{
 const base={modelRevision:"r",thicknessM:.2,source:"measured panel",boundary:{outer:rect(0,0,4,8),openings:[]}};
 const horizontal=analyzeSlabTopology({...base,id:"x",supports:[{edge:"left",condition:"simple",source:"wall"},{edge:"right",condition:"simple",source:"wall"}]});assert.equal(horizontal.workingType,"one_way_x");
 const exact=analyzeSlabTopology({...base,id:"two",supports:[...(["left","right","bottom","top"] as const).map(edge=>({edge,condition:"simple" as const,source:"edge beam"}))]});assert.equal(exact.workingType,"two_way");
});
test("one-way slab strip checks the full registered FE moment set and actual main/distribution steel",()=>{
 const bars:SlabStripBar[]=[];
 for(const face of ["bottom","top"] as const)for(let i=0;i<20;i++)bars.push({id:`${face}-${i}`,x:-475+i*50,y:face==="bottom"?174:26,diameter:12,face,direction:"span",source:"placed bar schedule",evidence:"model geometry"});
 for(let i=0;i<=20;i++)bars.push({id:`dist-${i}`,x:0,y:174,diameter:12,face:"bottom",direction:"distribution",stationMm:i*200,source:"placed distribution bar schedule",evidence:"model geometry"});
 const r=designOneWaySlabStrip({id:"S1-X-strip",...identity,spanMm:4000,thicknessMm:200,coverMm:20,aggregateMm:16,material:beamTestMaterial,demands:[{id:"ULS-M+",loadCaseId:"ULS",...identity,source:"P06 shell-result strip recovery",stationMm:2000,momentKnmPerM:30,kind:"deterministic"}],expectedDemandIds:["ULS-M+"],demandCoverage:"complete",bars,direction:"X",workingType:"one_way_x",supportCase:"simple",source:"actual one-way strip"});
 assert.equal(r.status,"checked");assert.equal(r.results[0].required.status,"solved");assert.equal(r.layoutChecks.distributionMinimum,true);
});
test("slab instantaneous support-plane service review rejects stale stamps and preserves large translations",()=>{
 const nodes=[{id:"a",positionM:[1e9,1e9,0] as const,displacementM:[0,0,0] as const},{id:"b",positionM:[1e9+4,1e9,0] as const,displacementM:[0,0,0] as const},{id:"c",positionM:[1e9,1e9+4,0] as const,displacementM:[0,0,0] as const},{id:"m",positionM:[1e9+2,1e9+2,0] as const,displacementM:[0,0,-.01] as const}];
 const args={panelId:"S",...identity,expectedCurrent:identity,source:"actual P06 static displacement",nodes,expectedNodeIds:nodes.map(n=>n.id),supportNodeIds:["a","b","c"],coverage:"complete" as const,normalSign:1 as const,allowableDeflectionMm:12,limitEvidence:"specified floor service limit"};
 assert.ok(Math.abs(reviewSlabInstantService(args).instant.demandMm-10)<1e-4);assert.throws(()=>reviewSlabInstantService({...args,analysisStamp:"old"}));
});
test("P06 Q4 shell membrane resultant is recovered from actual prescribed FE displacement",()=>{
 const ids=["00","10","11","01"],coords=[[0,0,0],[2,0,0],[2,2,0],[0,2,0]] as const;
 const nodes:FrameNode[]=ids.map((id,i)=>{const x=coords[i][0],ux=x===2?.001:0;return {id,position:coords[i],load:[0,0,0,0,0,0],prescribed:[ux,0,0,0,0,0],springs:[0,0,0,0,0,0]};});
 const shell={id:"SHELL-1",panelId:"P1",nodes:ids as unknown as readonly[string,string,string,string],E:3e7,nu:.2,thickness:.2,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:1,bending:1,shear:1},pressure:0};
 const solved=solveLinearStructure(nodes,[],[shell],null);assert.equal(solved.status,"solved");
 const r=recoverSlabShellResultants({nodes,frames:[],shells:[shell],foundation:null,solved,expectedShellIds:[shell.id],coverage:"complete",...identity,expectedCurrent:identity,loadCaseId:"EX",source:"current FE displacement field"});
 assert.ok(Math.abs(r.resultants[0].resultants.NxKnmPerM-3125)<1e-6);assert.ok(Math.abs(r.resultants[0].resultants.NyKnmPerM-625)<1e-6);assert.equal(r.coverage,"complete");
 const rebar=(prefix:string)=>[...(["top","bottom"] as const).flatMap(face=>Array.from({length:20},(_,i)=>({id:`${prefix}-${face}-${i}`,x:-475+50*i,y:face==="top"?26:174,diameter:12,face})))],barsX=rebar("X"),barsY=rebar("Y"),zone={id:"P1:full",shellId:shell.id,panelId:"P1",...identity,source:"placed reinforcement register",barsX,barsY};
 const design=designSlabShellZones({shells:r.resultants,zones:[zone],expectedShellIds:[shell.id],expectedPanelIds:["P1"],coverage:"complete",expectedCurrent:identity,material:beamTestMaterial,thicknessByPanelMm:{P1:200},twistingMomentToleranceKnmPerM:1e-8});assert.equal(design.status,"checked");
 const twisted=structuredClone(r.resultants);twisted[0].resultants.MxyKnmPerM=1;assert.equal(designSlabShellZones({shells:twisted,zones:[zone],expectedShellIds:[shell.id],expectedPanelIds:["P1"],coverage:"complete",expectedCurrent:identity,material:beamTestMaterial,thicknessByPanelMm:{P1:200},twistingMomentToleranceKnmPerM:1e-8}).status,"unsupported");
 assert.throws(()=>recoverSlabShellResultants({nodes,frames:[],shells:[shell],foundation:null,solved,expectedShellIds:[shell.id],coverage:"partial",...identity,expectedCurrent:identity,loadCaseId:"EX",source:"partial shells"}));
});
test("Q4/MITC4 rotated patch preserves local membrane axes and stiffness modifiers",()=>{
 const ids=["00","10","11","01"],local=[[0,0],[2,0],[2,2],[0,2]] as const;
 const nodes:FrameNode[]=ids.map((id,i)=>{const [x,y]=local[i],gx=10-y,gy=-3+x;return {id,position:[gx,gy,0],load:[0,0,0,0,0,0],prescribed:[.001*gx,.002*gy,0,0,0,0],springs:[0,0,0,0,0,0]};});
 const shell={id:"ROT",panelId:"P1",nodes:ids as unknown as readonly[string,string,string,string],E:3e7,nu:.2,thickness:.2,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:.4,bending:.7,shear:1},pressure:0},solved=solveLinearStructure(nodes,[],[shell],null);
 assert.equal(solved.status,"solved");const out=recoverSlabShellResultants({nodes,frames:[],shells:[shell],foundation:null,solved,expectedShellIds:[shell.id],coverage:"complete",...identity,expectedCurrent:identity,loadCaseId:"EX",source:"rotated prescribed-displacement patch"}),r=out.resultants[0].resultants;
 assert.ok(Math.abs(r.NxKnmPerM-5500)<1e-6);assert.ok(Math.abs(r.NyKnmPerM-3500)<1e-6);assert.ok(Math.abs(r.NxyKnmPerM)<1e-8);
});
test("actual P06 slab shell resultants converge across 4/8/16/32/64 uniform pressure meshes",()=>{
 const material={E:3e7,nu:.2,thickness:.2,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:1,bending:1,shear:1},pressure:-1};
 const solveMesh=(n:number)=>{
  const nodes:FrameNode[]=[],shells=[] as ({id:string;panelId:string;nodes:readonly[string,string,string,string];E:number;nu:number;thickness:number;shearCorrection:number;drillPenalty:number;modifiers:{membrane:number;bending:number;shear:number};pressure:number})[];
  for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){const x=i/n,y=j/n,boundary=i===0||i===n||j===0||j===n;nodes.push({id:`${i},${j}`,position:[x,y,0],load:[0,0,0,0,0,0],springs:[0,0,0,0,0,0],prescribed:[0,0,boundary?0:null,i===0||i===n?0:null,j===0||j===n?0:null,0]});}
  for(let j=0;j<n;j++)for(let i=0;i<n;i++)shells.push({id:`m${n}:${i}:${j}`,panelId:"P1",nodes:[`${i},${j}`,`${i+1},${j}`,`${i+1},${j+1}`,`${i},${j+1}`] as const,...material});
  const solved=solveLinearStructure(nodes,[],shells,null,{maxFactorEntries:8_000_000});assert.equal(solved.status,"solved",JSON.stringify(solved));
  return {forces:recoverSlabShellResultants({nodes,frames:[],shells,foundation:null,solved,expectedShellIds:shells.map(s=>s.id),coverage:"complete",...identity,expectedCurrent:identity,loadCaseId:"G",source:`actual P06 uniform pressure shell solve n=${n}`}),w:Math.min(...solved.nodes.map(v=>v.displacement[2]))};
 };
 const meshes=[4,8,16,32,64].map(solveMesh);assert.ok(meshes.every(m=>m.forces.status==="solved"&&m.forces.resultants.length>0));
 const compare=checkSlabMeshConvergence({coarse:{id:"32x32",divisions:32,resultants:meshes[3].forces.resultants,expectedShellIds:meshes[3].forces.resultants.map(x=>x.shellId),coverage:"complete"},fine:{id:"64x64",divisions:64,resultants:meshes[4].forces.resultants,expectedShellIds:meshes[4].forces.resultants.map(x=>x.shellId),coverage:"complete"},expectedPanelIds:["P1"],relativeTolerance:.01,absoluteFloor:.001});
 // The finer solve must move its maximum nodal deflection toward the independent simply-supported Navier plate series.
 const target=(t:number)=>{const D=material.E*t**3/(12*(1-material.nu**2)),S=material.shearCorrection*material.E/(2*(1+material.nu))*t;let w=0;for(let m=1;m<160;m+=2)for(let n=1;n<160;n+=2){const l2=Math.PI**2*(m*m+n*n);w+=Math.sin(m*Math.PI/2)*Math.sin(n*Math.PI/2)*16*material.pressure/(Math.PI**2*m*n)*(1/(D*l2*l2)+1/(S*l2));}return w;};
 const wTarget=target(.2),errors=meshes.map(m=>Math.abs(m.w/wTarget-1));assert.ok(Number.isFinite(wTarget)&&wTarget<0);assert.ok(errors[3]<errors[2]&&errors[2]<errors[1],JSON.stringify({wTarget,errors}));
 console.log("P12 actual FE mesh evidence",JSON.stringify({navierCentreWm:wTarget,meshCentreWm:meshes.map(m=>m.w),navierRelativeErrors:errors,maxShellResultantDelta32to64:Math.max(...compare.rows.map(r=>r.relativeDifference)),resultantRows:compare.rows}));
 assert.equal(meshes[2].forces.resultants.filter(x=>x.panelId==="P1").length,256);assert.equal(compare.status,"converged",JSON.stringify(compare.rows));assert.ok(errors[4]<.01,JSON.stringify({wTarget,errors}));
});
test("shell panel convergence includes every panel and the final critical result",()=>{
 const make=(mesh:string,last:number)=>Array.from({length:12},(_,i)=>({shellId:`${mesh}-${i+1}`,panelId:`P${i+1}`,loadCaseId:"EX",...identity,source:"solved shell result",localAxes:{x:[1,0,0] as const,y:[0,1,0] as const,normal:[0,0,1] as const},edgeLengthsM:{x:1,y:1},resultants:{NxKnmPerM:0,NyKnmPerM:0,NxyKnmPerM:0,MxKnmPerM:i===11?last:10,MyKnmPerM:10,MxyKnmPerM:0},areaM2:1,recovery:"Q4-MITC4-Gauss-average" as const}));
 const coarse=make("c",10),fine=make("f",9),r=checkSlabMeshConvergence({coarse:{id:"coarse",divisions:16,resultants:coarse,expectedShellIds:coarse.map(x=>x.shellId),coverage:"complete"},fine:{id:"fine",divisions:32,resultants:fine,expectedShellIds:fine.map(x=>x.shellId),coverage:"complete"},expectedPanelIds:Array.from({length:12},(_,i)=>`P${i+1}`),relativeTolerance:.05,absoluteFloor:.001});
 assert.equal(r.status,"not_converged");assert.equal(r.rows.find(x=>x.panelId==="P12"&&x.resultant==="MxKnmPerM")!.passed,false);
 assert.throws(()=>checkSlabMeshConvergence({coarse:{id:"c",divisions:16,resultants:coarse.slice(0,11),expectedShellIds:coarse.slice(0,11).map(x=>x.shellId),coverage:"partial"},fine:{id:"f",divisions:32,resultants:fine,expectedShellIds:fine.map(x=>x.shellId),coverage:"complete"},expectedPanelIds:Array.from({length:12},(_,i)=>`P${i+1}`),relativeTolerance:.05,absoluteFloor:.001}));
});
test("one-way uniform strip service matches independent simple and cantilever deflection equations",()=>{
 const bars=[] as {id:string;x:number;y:number;diameter:number;face:"top"|"bottom"}[];for(const face of ["top","bottom"] as const)for(let i=0;i<20;i++)bars.push({id:`${face}-${i}`,x:-475+i*50,y:face==="top"?26:174,diameter:12,face});
 const section={bw:1000,h:200,bf:1000,hf:0},makeCantilever=(q:number,id:string):BeamCase=>{
  const nodes:FrameNode[]=[{id:"L",position:[0,0,0],load:[0,0,0,0,0,0],prescribed:[0,0,0,0,0,0],springs:[0,0,0,0,0,0]},{id:"R",position:[6,0,0],load:[0,0,0,0,0,0],prescribed:[null,null,null,null,null,null],springs:[0,0,0,0,0,0]}],frame:FrameElement={id:"cant",nodes:["L","R"],offsets:[[0,0,0],[0,0,0]],up:[0,1,0],rollRad:0,E:3e7,G:1.25e7,section:{area:.2,Iy:.0166666666667,Iz:.0006666666667,J:.001,shearAreaY:.1666667,shearAreaZ:.0166667},modifiers:{axial:1,bendingY:1,bendingZ:1,torsion:1,shearY:1,shearZ:1},theory:"euler_bernoulli",releases:Array(12).fill(false),uniformLocal:[0,-q,0]},solved=solveLinearStructure(nodes,[frame],[],null);
  if(solved.status!=="solved")throw Error(JSON.stringify(solved));return beamCaseFromLinear(id,"r1","k1","a1",frame,nodes,solved.memberForces[0].localEndForce,"actual cantilever FE with uniform load");
 };
 const check=(kind:"simple"|"cantilever",g:BeamCase,q:BeamCase)=>{
  const total=combineBeamCases("total",[{factor:1,load:g},{factor:1,load:q}]),sustained=combineBeamCases("sustained",[{factor:1,load:g},{factor:.3,load:q}]),live=q,result=reviewOneWaySlabStripService({panelId:`P-${kind}`,modelRevision:g.modelRevision,stiffnessSet:g.stiffnessSet,analysisStamp:g.analysisStamp,expectedCurrent:{modelRevision:g.modelRevision,stiffnessSet:g.stiffnessSet,analysisStamp:g.analysisStamp},direction:"X",spanMm:g.lengthMm,thicknessMm:200,kind,section,bars,material:beamTestMaterial,total,sustained,live,duration:"5years",environment:"indoor_normal",partition:"none_floor",source:"real one-metre strip and source-backed cases"});
  const L=g.lengthMm,E=beamTestMaterial.Ec,I=1000*200**3/12,qCalc=Math.abs(total.uniformKnM[1]),expected=kind==="simple"?5*qCalc*L**4/(384*E*I):qCalc*L**4/(8*E*I);assert.ok(["checked","failed"].includes(result.status));assert.ok(result.service.instant.Ieff<=I*(1+1e-9));assert.ok(Math.abs(result.service.instant.maxAbsMm-expected)<1e-6,`${kind}: got ${result.service.instant.maxAbsMm}; independent uncracked result ${expected}`);
 };
 const simpleG=solvedUniformBeam(.01,"G"),simpleQ=solvedUniformBeam(.005,"Q");check("simple",simpleG,simpleQ);check("cantilever",makeCantilever(.01,"CG"),makeCantilever(.005,"CQ"));
});
