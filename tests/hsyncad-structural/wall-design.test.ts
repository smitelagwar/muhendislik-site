import {test} from "node:test";
import assert from "node:assert/strict";
import {wallFixture,wallScope,couplingFixture,diagonalWallScopeFixture} from "./wall-fixtures";
import {designWalls} from "../../src/lib/hsyncad/structural/wall-design";
import {designCouplingBeam} from "../../src/lib/hsyncad/structural/coupling-beam";
import {wallCapacity,prepareWallSection,type WallSection} from "../../src/lib/hsyncad/structural/wall-section";
import {columnCapacity} from "../../src/lib/hsyncad/structural/rc-column-section";
import {beamTestMaterial,beamDesignFixture} from "./beam-fixtures";
import {rectangleColumnBars} from "../../src/lib/hsyncad/structural/column-detailing";
test("P11 rectangular wall capacity agrees with independent P10 biaxial section",()=>{
 const w=wallFixture(),s=w.section,a=wallCapacity(s,w.material,800,20,900),b=columnCapacity(s.cells[0].shape,s.bars,w.material,800,20,900);assert.equal(a.status,"solved");assert.equal(b.status,"solved");if(a.status==="solved"&&b.status==="solved")assert.ok(Math.abs(a.capacityKnm/b.capacityKnm!-1)<1e-7);
});
test("P11 disjoint-cell L/T/U section integration and duplicate/disconnected cell gates",()=>{
 for(const cells of [
  [{b:1800,h:300,u:0,v:0},{b:300,h:1500,u:-750,v:900}],
  [{b:1800,h:300,u:0,v:0},{b:300,h:1500,u:0,v:900}],
  [{b:1800,h:300,u:0,v:0},{b:300,h:1500,u:-750,v:900},{b:300,h:1500,u:750,v:900}]
 ]){const s:WallSection={cells:cells.map((c,i)=>({id:String(i),physicalPanelId:String(i),shape:{kind:"rectangle",b:c.b,h:c.h,angleRad:0,center:{u:c.u,v:c.v},source:"actual disjoint cell"}})),bars:[],source:"connected L/T/U union"};for(const c of s.cells)s.bars.push(...rectangleColumnBars(c.shape,20,2,2,30,10).map(b=>({...b,id:`${c.id}:${b.id}`})));
  const p=prepareWallSection(s,beamTestMaterial);assert.equal(p.area,cells.reduce((s,c)=>s+c.b*c.h,0));const r=wallCapacity(s,beamTestMaterial,300,20,100);assert.equal(r.status,"solved",JSON.stringify(r));
  const duplicate=structuredClone(s);duplicate.cells.push({...s.cells[0],id:"duplicate",physicalPanelId:"alias"});assert.throws(()=>prepareWallSection(duplicate,beamTestMaterial),/kesişiyor/);
 }
});
test("P11 tall/short wall envelope, actual mesh and construction-joint checks",()=>{
 const scope=wallScope(),r=designWalls(scope);assert.equal(r.status,"wall_scope_ready",JSON.stringify(r));assert.equal(r.engineeringAcceptance,false);if("walls" in r){const w=r.walls[0];if(!("demands" in w)||!w.demands||w.detailing?.status!=="passed")throw Error("Hazır perde ayrıntısı eksik.");assert.equal(w.detailing.HcrMm,3000);assert.equal(w.demands[0].samples.find(s=>s.zMm===3000)!.M3BoundKnm,900);assert.ok(w.demands[0].samples.every(s=>s.shear.VeKn>=s.shear.raw));}
 const short=wallScope();short.walls=[wallFixture("W1",3000)];assert.equal(designWalls(short).status,"wall_scope_ready");
});
test("P11 physical missing links, failed shear, stale snapshots and basement role stay visible",()=>{
 const links=wallScope();links.walls[0].detail.webLinks=links.walls[0].detail.webLinks.filter(l=>!l.id.startsWith("W1:link:0:"));assert.notEqual(designWalls(links).status,"wall_scope_ready");
 const shear=wallScope();shear.walls=[wallFixture("W1",3000,0,6000)];assert.notEqual(designWalls(shear).status,"wall_scope_ready");
 const stale=wallScope();stale.walls[0].loads[0].analysisStamp="old";assert.equal(designWalls(stale).status,"incomplete");
 const basement=wallScope();basement.walls[0].role="basement_perimeter";assert.equal(designWalls(basement).status,"incomplete");
 const duplicate=wallScope();duplicate.walls.push(structuredClone(duplicate.walls[0]));duplicate.walls[1].id="alias";duplicate.allWallIds.value!.push("alias");assert.equal(designWalls(duplicate).status,"invalid_input");
});
test("P11 diagonal coupling uses actual bar inclination, embedment and dedicated hoops",()=>{
 const b=couplingFixture(),r=designCouplingBeam(b);assert.equal(r.status,"coupling_ready",JSON.stringify(r));assert.equal(r.engineeringAcceptance,false);
 if("capacityShearKn" in r){const expected=2*4*Math.PI*36**2/4*(420/1.15)*Math.sin(Math.atan(.45))/1000;assert.ok(Math.abs(r.capacityShearKn!-expected)<1e-8);}
 const bad=b.diagonal!.bundles[0].bars[0];bad.points=[[-10,-125,-440],bad.points[1],bad.points[2],bad.points[3]];assert.notEqual(designCouplingBeam(b).status,"coupling_ready");
 const missing=couplingFixture();missing.diagonal=null;assert.equal(designCouplingBeam(missing).status,"incomplete");
});
test("P11 strong wall ratio changes with actual placed beam steel at the same joint",()=>{
 const first=wallScope(),beam=beamDesignFixture(5),snap=first.walls[0].snapshot;beam.geometry.leftJoint="W1@3000";beam.geometry.columnWidth=3000;
 for(const load of [...beam.ultimate,...beam.service?[beam.service.total,beam.service.sustained,beam.service.live]:[]]){load.modelRevision=snap.modelRevision;load.stiffnessSet=snap.stiffnessSet;load.analysisStamp=snap.analysisStamp;}first.normalBeams=[beam];
 const second=structuredClone(first),b=second.normalBeams[0];b.mode="existing_reinforcement";b.existing={top:{diameter:20,count:4,rows:1},bottom:{diameter:20,count:4,rows:1},stirrupDiameter:10,legs:2,spacingEnd:75,spacingMiddle:100,sideDiameter:12,sideEach:0};
 const a=designWalls(first),r=designWalls(second);assert.equal(a.status,"wall_scope_ready");assert.equal(r.status,"wall_scope_ready");if(!("walls" in a)||!("walls" in r)||!("strong" in a.walls[0])||!("strong" in r.walls[0]))throw Error("Gerçek güçlü perde sonuçları eksik.");
 const x=a.walls[0].strong![0].signs[0],y=r.walls[0].strong![0].signs[0];assert.ok(y.beamCapacityKnm>x.beamCapacityKnm);assert.ok(y.ratio!==null&&x.ratio!==null&&y.ratio<x.ratio);assert.notEqual(x.ratio,1.45);
});
test("P11 coupling end forces must produce the actual pier axial jumps",()=>{const scope=diagonalWallScopeFixture(),r=designWalls(scope);assert.equal(r.status,"wall_scope_ready",JSON.stringify(r,(k,v)=>["checks","detailing","demands","strong"].includes(k)?undefined:v));if("couplingTransfers" in r)assert.equal(r.couplingTransfers.length,2);for(const s of scope.walls[0].loads[0].samples){s.earthquake!.Nkn=0;s.force.Nkn=s.gravity!.Nkn;}assert.equal(designWalls(scope).status,"invalid_input");});
