import test from "node:test";
import assert from "node:assert/strict";
import {checkSlabDiaphragm,type SlabDiaphragmZone} from "../../src/lib/hsyncad/structural/slab-diaphragm";
import {analyzeSlabTopology} from "../../src/lib/hsyncad/structural/slab-geometry";
import {stairGeometry,type StairGeometryInput} from "../../src/lib/hsyncad/structural/stair-geometry";
import {punchingPerimeter,checkInteriorPunching,type PunchingSupport} from "../../src/lib/hsyncad/structural/punching-shear";
import {designStair} from "../../src/lib/hsyncad/structural/stair-design";
import {landingBenchmarkGeometry,stairDesignInput} from "./stair-fixtures";
import {syntheticRaftFixture} from "./foundation-fixtures";
import {runRaftFoundationCase} from "../../src/lib/hsyncad/structural/foundation-design";
import {recoverSlabShellResultants} from "../../src/lib/hsyncad/structural/slab-forces";
import {solveLinearStructure} from "../../src/lib/hsyncad/structural/linear-structure";
import type {FrameNode} from "../../src/lib/hsyncad/structural/frame-element";
import {checkSlabWallTransfer} from "../../src/lib/hsyncad/structural/slab-diaphragm";

// Coordinator-owned independent review cases. Numbers derive from stress equilibrium
// and a rectangular solid, not a reference project's results or production helpers.
const identity={modelRevision:"review-r1",stiffnessSet:"review-k1",analysisStamp:"review-a1"};
const material={fckMPa:25,fcdMPa:25/1.5,fctdMPa:1.2,fydMPa:420/1.15,source:"TS500 C25/S420",evidence:"independent review specimen"};
function membrane(extra:Partial<SlabDiaphragmZone>={}){
 const zone:SlabDiaphragmZone={id:"z1",panelId:"p1",...identity,loadCaseId:"EX",caseKind:"earthquake_only",D:2,source:"explicit equilibrium specimen",
  thicknessM:.2,NxKnmPerM:0,NyKnmPerM:0,NxyKnmPerM:0,providedAsXmm2PerM:0,providedAsYmm2PerM:0,flexuralRequiredAsXmm2PerM:0,flexuralRequiredAsYmm2PerM:0,...extra};
 return checkSlabDiaphragm({...identity,zones:[zone],expectedPanelIds:["p1"],expectedZoneIds:["z1"],coverage:"complete",material});
}
test("review: diaphragm compression and reversed shear are signed physical demands",()=>{
 const result=membrane({NxKnmPerM:-100,NxyKnmPerM:-20});
 const row=result.checks[0];
 assert.equal(row.membraneMPa.Nx,-1);
 assert.equal(row.membraneMPa.Nxy,-.2);
 assert.equal(row.checks.find(c=>c.id.endsWith("compression-x"))!.valueMPa,1);
});
test("review: once concrete tension is exceeded, reserve steel must resist the whole tension",()=>{
 // 200 kN/m * D2 / 200mm = 2 MPa. Reserve As gives only 1 MPa.
 // Adding concrete 1.2 MPa would falsely pass this specimen.
 const result=membrane({NxKnmPerM:200,providedAsXmm2PerM:200000/material.fydMPa});
 assert.equal(result.checks[0].checks.find(c=>c.id.endsWith("tension-x"))!.passed,false);
});
test("review: diaphragm absolute shear ceiling is 0.65 sqrt(fck)",()=>{
 const result=membrane({NxyKnmPerM:400,providedAsXmm2PerM:10000,providedAsYmm2PerM:10000});
 const check=result.checks[0].checks.find(c=>c.id.endsWith("shear-x"))!;
 assert.equal(check.limitMPa,.65*Math.sqrt(25));
 assert.equal(check.passed,false);
});
test("review: opposite left-right slab supports span in x",()=>{
 const result=analyzeSlabTopology({id:"p",modelRevision:"r",thicknessM:.2,source:"physical rectangle",
  boundary:{outer:[[0,0],[4,0],[4,8],[0,8]],openings:[]},supports:[{edge:"left",condition:"simple",source:"wall L"},{edge:"right",condition:"simple",source:"wall R"}]});
 assert.equal(result.workingType,"one_way_x");
});
test("review: landing concrete and dead load count one closed physical solid",()=>{
 const input:StairGeometryInput={schemaVersion:1,physicalFamilyId:"family",modelRevision:"r",stiffnessSet:"k",geometryRevision:"g",floorLevelsMm:{F1:0},nativeRepresentationIds:["native-reference"],disjointSolids:{checked:true,source:"only one rectangular solid"},components:[{
  kind:"landing",id:"landing",floorId:"F1",widthMm:2000,spanMm:3000,thicknessMm:200,concreteUnitWeightKnM3:25,source:"2x3x0.2m prism",
  supports:[{id:"left",floorId:"F1",kind:"wall",bearingWidthMm:300,source:"actual wall L"},{id:"right",floorId:"F1",kind:"wall",bearingWidthMm:300,source:"actual wall R"}]}]};
 const r=stairGeometry(input);
 assert.ok(Math.abs(r.components[0].grossVolumeM3-1.2)<1e-12);
 assert.ok(Math.abs(r.totalSelfWeightKn-30)<1e-12);
 assert.ok(Math.abs(r.supportReactions.reduce((s,x)=>s+x.verticalKn,0)-30)<1e-12);
});

const punchingSupport:PunchingSupport={id:"column",kind:"column",footprint:[[1.8,1.8],[2.2,1.8],[2.2,2.2],[1.8,2.2]],origin:[2,2]};
test("review: interior punching follows independent perimeter, eccentricity and force algebra",()=>{
 const perimeter=punchingPerimeter({boundary:{outer:[[0,0],[4,0],[4,4],[0,4]],openings:[]},support:punchingSupport,effectiveDepthM:.2});
 const action={...identity,source:"independent balanced physical tuple",NaboveKn:100,NbelowKn:500,FaKn:20,MxAdjacentKnM:[60,40] as const,MyAdjacentKnM:[0,0] as const};
 const r=checkInteriorPunching({perimeter,support:punchingSupport,action,expectedCurrent:identity,material:{fctdMPa:1.2,source:"TS500 C25",evidence:"table3.2/1.5"}});
 if(r.status==="unsupported")throw Error(r.reason);
 // d/2 contour 0.6x0.6m => 2.4m. e=.4*100/400=.1m.
 // gamma=1/(1+1.5*.1/sqrt(.6*.6))=.8; V=400-20=380kN.
 assert.ok(Math.abs(r.gamma-.8)<1e-12);
 assert.ok(Math.abs(r.VprKn-460.8)<1e-9);
 assert.equal(r.VpdKn,380);
 assert.equal(r.engineeringAcceptance,false);
 assert.throws(()=>checkInteriorPunching({perimeter,support:punchingSupport,action:{...action,modelRevision:"stale"},expectedCurrent:identity,material:{fctdMPa:1.2,source:"TS500",evidence:"source"}}),/Current/);
});
test("review: punching opening intersecting the contour cannot bypass radial-shadow gate",()=>{
 const r=punchingPerimeter({boundary:{outer:[[0,0],[4,0],[4,4],[0,4]],openings:[[[2.25,1.9],[2.45,1.9],[2.45,2.1],[2.25,2.1]]]},support:punchingSupport,effectiveDepthM:.2});
 assert.equal(r.geometryStatus,"unsupported");
 assert.ok(r.diagnostics.some(x=>x.includes("radial")));
});
test("review: landing service matches independent gross-EI elastic deflection in mm",()=>{
 const input=stairDesignInput(landingBenchmarkGeometry());
 const r=designStair(input),service=r.components[0].design.service.total;
 // 2m span, 300mm solid, C25 Ec=30000MPa, qtotal=7.5+.75+3=11.25N/mm.
 // This short/thick specimen remains uncracked. Oracle uses no production section routine.
 const Ig=1000*300**3/12,expected=5*11.25*2000**4/(384*30000*Ig);
 assert.ok(Math.abs(service.instantTotalMm/expected-1)<.001,`${service.instantTotalMm} vs ${expected}`);
 const dead=r.supportReactions.reduce((s,x)=>s+x.deadKn,0);
 assert.ok(Math.abs(dead-33)<1e-10); // 30kN concrete + .75*4 = 3kN finish.
 assert.ok(Math.abs(r.equilibrium.residualKn)<1e-10);
});
test("integration: actual stair ULS reactions enter raft once and geometry mutation changes soil pressure",t=>{
 const solve=(thicknessMm:number)=>{
  const geometry=landingBenchmarkGeometry();
  geometry.components=geometry.components.map(c=>({...c,thicknessMm}));
  const stairs=designStair(stairDesignInput(geometry));
  const input=syntheticRaftFixture(4);
  input.project.settings.thicknessFactor={value:1,source:"user_input",evidence:"explicit uniform raft for independent force-balance oracle"};
  input.combination.id="ULS-GQ";
  input.foundationLoadFactors={loadCaseId:"ULS-GQ",deadFactor:1.2,overburdenFactor:1.2,source:"same declared 1.2G+1.6Q combination as the actual stair reactions"};
  input.shellPressureLoadCaseId="ULS-GQ";
  const fingerprint=`${stairs.stiffnessSet}:${stairs.analysisStamp}:${stairs.geometryRevision}`;
  input.analysisIdentity={...input.analysisIdentity,sourceStiffnessFingerprint:fingerprint,loadCaseId:"ULS-GQ",reactionEvidence:"actual P14 landing reactions; two explicitly mapped base supports"};
  input.supportReactions=stairs.supportReactions.map((r,i)=>({id:r.supportId,xM:i===0?.5:1.5,yM:1,
   verticalKnOnSuperstructure:r.ultimateKnByCombination["ULS-GQ"],
   sourceIdentity:{projectId:input.project.projectId,projectRevision:input.project.revision,loadCaseId:"ULS-GQ",stiffnessFingerprint:fingerprint},
   supportGeometry:{kind:"column",widthM:.5,lengthM:.5,source:"explicit synthetic support mapping from the two landing reactions"},
   thicknessRegion:{widthM:.5,lengthM:.5,source:"explicit local region; thickness factor one"},
   footprint:{widthM:.5,lengthM:.5,supportDepthM:.3}}));
  const raft=runRaftFoundationCase(input);
  assert.equal(raft.status,"solved_limited_profile",JSON.stringify(raft));
  assert.ok(Math.max(...raft.solver.balance.map(Math.abs))<1e-6);
  assert.equal(raft.engineeringAcceptance,false);
  return {stairs,raft};
 };
 const a=solve(300),b=solve(400);
 // ULS load: 1.2*(concrete 30 + finish 3) + 1.6*live12 = 58.8kN.
 // Uniform 2x2x0.3m raft contributes1.2*30=36kN. Soil force/4m²=23.7kPa.
 assert.ok(Math.abs(a.raft.bearing.qaverageKpa!-23.7)<1e-8);
 assert.ok(Math.abs(b.raft.bearing.qaverageKpa!-26.7)<1e-8);
 assert.notEqual(a.raft.analysisIdentity.resolvedFoundationFingerprint,b.raft.analysisIdentity.resolvedFoundationFingerprint);
 assert.ok(Math.abs(a.stairs.equilibrium.residualKn)<1e-10);
 t.diagnostic(JSON.stringify({scope:"actual stair ULS reactions to current raft",deadFactor:1.2,qaverageKpa:[a.raft.bearing.qaverageKpa,b.raft.bearing.qaverageKpa],equilibrium:a.raft.solver.balance,engineeringAcceptance:false}));
});
test("review: rotated shell resultants match independent plane-stress patch with stiffness modifier",()=>{
 const nodes:FrameNode[]=([[0,0,0],[0,1,0],[-1,1,0],[-1,0,0]] as const).map((position,i)=>({id:`n${i}`,position,load:[0,0,0,0,0,0],springs:[0,0,0,0,0,0],prescribed:[.001*position[0],.002*position[1],0,0,0,0]}));
 const shells=[{id:"shell",panelId:"panel",nodes:["n0","n1","n2","n3"] as const,E:30e6,nu:.2,thickness:.2,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:.4,bending:.3,shear:.5},pressure:0}];
 const solved=solveLinearStructure(nodes,[],shells,null);
 assert.equal(solved.status,"solved");
 const r=recoverSlabShellResultants({nodes,frames:[],shells,foundation:null,solved,expectedShellIds:["shell"],coverage:"complete",...identity,expectedCurrent:identity,loadCaseId:"EX",source:"real affine prescribed-displacement P06 patch"});
 const n=r.resultants[0].resultants;
 // Local x=global Y, local y=-global X: eps_x=.002, eps_y=.001.
 assert.ok(Math.abs(n.NxKnmPerM-5500)<1e-8);
 assert.ok(Math.abs(n.NyKnmPerM-3500)<1e-8);
 assert.ok(Math.abs(n.NxyKnmPerM)<1e-8);
});
test("review: wall transfer counts each physical left/right reserve once",()=>{
 const r=checkSlabWallTransfer({cases:[{id:"EX",...identity,source:"signed physical wall cuts",VbelowKn:150,VaboveKn:0,D:1}],expectedCaseIds:["EX"],coverage:"complete",expectedCurrent:identity,
  material:{fydMPa:400,source:"explicit test strength",evidence:"isolated equilibrium oracle"},joint:{type:"monolithic",source:"single cast"},
  steel:{leftAnchoredAsMm2:100,leftFlexuralRequiredAsMm2:0,rightAnchoredAsMm2:200,rightFlexuralRequiredAsMm2:0,interfaceAsMm2:0,interfaceFlexuralRequiredAsMm2:0,developmentVerified:true,source:"actual asymmetric two-side transfer bars",evidence:"explicit test steel"}});
 assert.equal(r.status,"failed"); // (100+200)*400/1000=120kN, less than 150kN.
 assert.equal(r.cases[0].capacityKn,120);
});
