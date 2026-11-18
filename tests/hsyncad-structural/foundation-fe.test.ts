import test from "node:test";
import assert from "node:assert/strict";
import {recoverFoundationShellForces,integrateFoundationCut,checkFoundationFlexuralBand,checkTbdy7117FoundationFePunching,integrateWinklerReactionInsideRect} from "../../src/lib/hsyncad/structural/foundation-fe";
import type {FrameNode} from "../../src/lib/hsyncad/structural/frame-element";
import type {ShellRect} from "../../src/lib/hsyncad/structural/shell-rect";

test("foundation demand is recovered from actual P06 shell nodal actions and an actual mesh cut",()=>{
 const pos=[[0,0,0],[.5,0,0],[1,0,0],[0,1,0],[.5,1,0],[1,1,0]] as const;
 const nodes:FrameNode[]=pos.map((position,i)=>({id:`n${i}`,position,load:[0,0,0,0,0,0],prescribed:[0,0,0,0,0,0],springs:[0,0,0,0,0,0]}));
 const props={E:30e6,nu:.2,thickness:.3,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:1,bending:1,shear:1},pressure:-100};
 const shells:ShellRect[]=[{id:"left",nodes:["n0","n1","n4","n3"],...props},{id:"right",nodes:["n1","n2","n5","n4"],...props}];
 const displacementByNode=Object.fromEntries(nodes.map(n=>[n.id,[0,0,0,0,0,0]]));
 const resultants=recoverFoundationShellForces({nodes,shells,displacementByNode,foundationShellIds:["left","right"]});
 const cut=integrateFoundationCut({nodes,shells,resultants,foundationShellIds:["left","right"],cut:{axis:"X",coordinateM:.5,spanStartM:0,spanEndM:1,side:"negative"}});
 assert.deepEqual(cut.crossingNodeIds,["n1","n4"]);assert.deepEqual(cut.shellIds,["left"]);
 assert.equal(cut.shearKn,25);assert.equal(cut.shearKnPerM,25);
 assert.match(cut.equilibriumSource,/actual cut edge/);
});

test("foundation flexural band evaluates sourced actual X/Y and top/bottom steel separately",()=>{
 const band={direction:"X" as const,face:"bottom" as const,section:{bw:1000,h:300,bf:1000,hf:0},bars:[-300,-100,100,300].map((x,i)=>({id:`b${i}`,x,y:250,diameter:16,face:"bottom" as const})),
  material:{fck:30,fctk:1.9,reinforcementClass:"B420C" as const,fyk:420,fywk:420,Ec:32000,tensileBasis:"table_3_2" as const,elasticBasis:"table_3_2" as const,testEvidence:null,source:"synthetic TS500 profile"},source:"synthetic explicit bar coordinates"};
 const bottomX=checkFoundationFlexuralBand({demandKnmPerM:40,band});
 assert.ok(bottomX.capacityKnmPerM>40);assert.equal(bottomX.status,"capacity_sufficient_screen");assert.equal(bottomX.sectionResult.status,"solved");
 const topY=checkFoundationFlexuralBand({demandKnmPerM:400,band:{...band,direction:"Y",face:"top",bars:band.bars.map(b=>({...b,y:50,face:"top"}))}});
 assert.equal(topY.status,"capacity_exceeded");
 assert.throws(()=>checkFoundationFlexuralBand({demandKnmPerM:-3,band}),/demand/);
});

test("TBDY 7.11.7 limit is only evaluated at d/2 under G+D·E and is not named generic one-way shear",()=>{
 const base={unitWidthVpdKnPerM:460.8,effectiveDepthMm:400,distanceFromActualSupportFaceMm:200,fctdMpa:1.2,fctdSource:"source-backed synthetic fctd",loadingBasis:"G_plus_D_times_E" as const,analysisStamp:"synthetic-current-stamp"};
 const r=checkTbdy7117FoundationFePunching(base);assert.equal(r.status,"passed");assert.ok(Math.abs(r.tauPdMpa!-1.152)<1e-12);assert.match(r.scope,/not generic one-way shear/);
 assert.equal(checkTbdy7117FoundationFePunching({...base,distanceFromActualSupportFaceMm:250}).status,"blocked");
 assert.equal(checkTbdy7117FoundationFePunching({...base,loadingBasis:"other_or_unknown"}).status,"blocked");
});

test("Winkler reaction inside a punching contour integrates the clipped bilinear shell pressure",()=>{
 const p=[[0,0,0],[1,0,0],[1,1,0],[0,1,0]] as const;
 const nodes:FrameNode[]=p.map((position,i)=>({id:`p${i}`,position,load:[0,0,0,0,0,0],prescribed:[0,0,0,0,0,0],springs:[0,0,0,0,0,0]}));
 const shells:ShellRect[]=[{id:"q",nodes:["p0","p1","p2","p3"],E:1e7,nu:.2,thickness:.2,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:1,bending:1,shear:1},pressure:0}];
 const r=integrateWinklerReactionInsideRect({nodes,shells,foundationShellIds:["q"],pressureByNode:{p0:0,p1:0,p2:100,p3:0},rectangle:{x0:0,x1:.5,y0:0,y1:.5}});
 assert.equal(r.areaM2,.25);assert.equal(r.reactionKn,1.5625);
 assert.throws(()=>integrateWinklerReactionInsideRect({nodes,shells,foundationShellIds:["q"],pressureByNode:{p0:0},rectangle:{x0:0,x1:.5,y0:0,y1:.5}}),/missing for/);
 assert.throws(()=>integrateWinklerReactionInsideRect({nodes,shells,foundationShellIds:["q","missing"],pressureByNode:{p0:0,p1:0,p2:100,p3:0},rectangle:{x0:0,x1:.5,y0:0,y1:.5}}),/scope/);
});

test("foundation FE cut rejects missing middle edge intervals even when endpoint coverage matches",()=>{
 const p=[[0,0,0],[1,0,0],[1,.5,0],[0,.5,0],[1,1.5,0],[0,1.5,0],[1,2,0],[0,2,0]] as const;
 const nodes:FrameNode[]=p.map((position,i)=>({id:`g${i}`,position,load:[0,0,0,0,0,0],prescribed:[0,0,0,0,0,0],springs:[0,0,0,0,0,0]}));
 const props={E:1e7,nu:.2,thickness:.2,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:1,bending:1,shear:1},pressure:0};
 const shells:ShellRect[]=[{id:"lower",nodes:["g0","g1","g2","g3"],...props},{id:"upper",nodes:["g5","g4","g6","g7"],...props}];
 assert.throws(()=>integrateFoundationCut({nodes,shells,resultants:[],foundationShellIds:["lower","upper"],cut:{axis:"X",coordinateM:1,spanStartM:0,spanEndM:2,side:"negative"}}),/uncovered middle/);
});
