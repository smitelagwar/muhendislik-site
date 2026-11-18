import test from "node:test";
import assert from "node:assert/strict";
import {runGlobalReview} from "../../src/lib/hsyncad/structural/global-review";
import {globalWallFixture,globalBasementFixture} from "./global-fixtures";
import {prepareModalStructure} from "../../src/lib/hsyncad/structural/modal-structure";
import {rayleighEquivalentPeriod} from "../../src/lib/hsyncad/structural/global-period";
test("actual shell cut distribution changes R and forces, then converges without repeated reduction",()=>{
 const input=globalWallFixture(),before=JSON.stringify(input),r=runGlobalReview(input,{maxModes:64});assert.ok("iterations" in r,JSON.stringify(r));if(!("iterations" in r)||!r.iterations)throw Error(JSON.stringify(r));
 assert.equal(r.status,"checks_ready",JSON.stringify(r));const iterations=r.iterations as {stamp:string;used:{X:{R:number}};rawBaseShear:{X:number};rawMaxDisplacement:{X:number}}[];assert.equal(iterations.length,2,JSON.stringify(r));
 assert.equal(iterations[0].used.X.R,6);assert.ok(Math.abs(iterations[1].used.X.R-4.8)<1e-10);assert.ok(iterations[1].rawBaseShear.X>iterations[0].rawBaseShear.X);assert.ok(iterations[1].rawMaxDisplacement.X>iterations[0].rawMaxDisplacement.X);assert.notEqual(iterations[0].stamp,iterations[1].stamp);assert.equal(JSON.stringify(input),before);assert.equal(r.engineeringAcceptance,false);
});
test("bounded R iteration and missing reviews cannot approve a stale/global result",()=>{
 const input=globalWallFixture();input.maxCoefficientIterations=1;assert.equal(runGlobalReview(input,{maxModes:64}).status,"nonconverged");
 const missing=globalWallFixture(false);missing.reviews.A2={present:null,reviewer:null,reason:null,transfer:null,verticalAnalysisRef:null};const r=runGlobalReview(missing,{maxModes:64});assert.equal(r.status,"incomplete",JSON.stringify(r));assert.equal(r.engineeringAcceptance,false);
 const bad=globalWallFixture();bad.levels[1].elevationM=80;assert.equal(runGlobalReview(bad,{maxModes:64}).status,"invalid_input");
});
test("Rayleigh equivalent period uses real K/F/M and preserves raw eigenperiods",()=>{
 const input=globalWallFixture(false),s=prepareModalStructure(input.structure),r=rayleighEquivalentPeriod(input.structure,0,"X");assert.ok(r.periodSeconds>0);assert.ok(r.staticResidual<1e-8);assert.equal(r.rawEigenPeriodsModified,false);assert.ok(s.K.n>0);
 input.empiricalCt.X={value:.1,source:"incorrect manual override"};assert.equal(runGlobalReview(input,{maxModes:64}).status,"invalid_input");
});

test("rigid basement is verified by actual full/upper eigensolutions and lower-mass force transfer",()=>{
 const input=globalBasementFixture(),r=runGlobalReview(input,{maxModes:100});assert.ok("classification" in r,JSON.stringify(r));if(!("classification" in r)||!r.classification)throw Error(JSON.stringify(r));
 assert.equal(r.status,"checks_ready",JSON.stringify(r));assert.equal(r.classification.basement.rigid,true);assert.equal(r.classification.height.heightM,3);const ratio=(r.classification.basement.control.observed as {ratios:{X:number}}).ratios.X;assert.ok(ratio>=1&&ratio<1.1);assert.equal(r.engineeringAcceptance,false);
 const d=r.directional!.X as {lowerModal:{baseShearKn:number};regional:{shells:{part:string;factors:{ductile:number[];nonductile:number[]};upperRaw:{maxima:number[]};lowerRaw:{maxima:number[]};ductileComponentBounds:number[]}[];unresolved:string[];upperBetaAppliedToBasement:boolean}};
 assert.ok(d.lowerModal.baseShearKn>0);assert.equal(d.regional.unresolved.length,0);assert.equal(d.regional.upperBetaAppliedToBasement,false);
 const bottom=d.regional.shells.find(s=>s.part==="basement")!;assert.deepEqual(bottom.factors.ductile,[1,1]);assert.deepEqual(bottom.factors.nonductile,[1.5,1.5]);
 bottom.ductileComponentBounds.forEach((v,i)=>assert.ok(Math.abs(v-bottom.upperRaw.maxima[i]-bottom.lowerRaw.maxima[i])<1e-10));
 assert.ok(r.checks!.some(c=>c.id==="basement_regional_design:X"&&c.status==="determined"));
});

test("global decisions remain invariant under rigid XY translation of the physical model",()=>{
 const a=globalWallFixture(),b=structuredClone(a),dx=123,dy=-456;
 for(const n of b.structure.nodes)n.position=[n.position[0]+dx,n.position[1]+dy,n.position[2]];
 b.structure.rotationOrigin=[dx,dy,0];for(const g of b.structure.rigidDiaphragms!)g.centerXY=[g.centerXY[0]+dx,g.centerXY[1]+dy];
 for(const d of ["X","Y"] as const)for(const w of b.walls[d])w.origin=[w.origin[0]+dx,w.origin[1]+dy,w.origin[2]];
 const x=runGlobalReview(a,{maxModes:64}),y=runGlobalReview(b,{maxModes:64});assert.equal(x.status,"checks_ready");assert.equal(y.status,"checks_ready");
 assert.ok("iterations" in x&&"iterations" in y);assert.deepEqual((x.iterations as {used:unknown}[]).map(v=>v.used),(y.iterations as {used:unknown}[]).map(v=>v.used));
});

test("different dominant full/upper mode families cannot silently certify a rigid basement",()=>{
 const input=globalBasementFixture();for(const m of input.structure.inertias)if(input.nodeParts.find(n=>n.nodeId===m.nodeId)!.part==="basement")m.values=[1,1,1,0,0,0];
 const r=runGlobalReview(input,{maxModes:100});assert.equal(r.status,"incomplete",JSON.stringify(r));assert.ok("checks" in r&&r.checks!.some(c=>c.id==="basement_mode_selection"&&c.status==="requires_engineering"));assert.equal(r.engineeringAcceptance,false);
});
