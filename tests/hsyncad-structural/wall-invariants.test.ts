import {test} from "node:test";
import assert from "node:assert/strict";
import {wallFixture,wallScope,couplingFixture} from "./wall-fixtures";
import {wallCapacity,prepareWallSection,type WallSection} from "../../src/lib/hsyncad/structural/wall-section";
import {designWalls} from "../../src/lib/hsyncad/structural/wall-design";
import {criticalWallHeight} from "../../src/lib/hsyncad/structural/wall-detailing";
import {designCouplingBeam} from "../../src/lib/hsyncad/structural/coupling-beam";
import {solveLinearStructure} from "../../src/lib/hsyncad/structural/linear-structure";
import {wallCutFromLinear,solveWallStatic} from "../../src/lib/hsyncad/structural/wall-forces";
import {deriveBeamCoupling} from "../../src/lib/hsyncad/structural/wall-system-review";
import {wallShellSystemFixture} from "./wall-system-fixtures";
import {responseSpectrum} from "../../src/lib/hsyncad/structural/response-spectrum";
import {beamTestMaterial} from "./beam-fixtures";
import {rectangleColumnBars} from "../../src/lib/hsyncad/structural/column-detailing";
import type {FrameNode,V3} from "../../src/lib/hsyncad/structural/frame-element";
import {empiricalCoefficient} from "../../src/lib/hsyncad/structural/global-period";
import {globalWallFixture} from "./global-fixtures";
const close=(a:number,b:number,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function lSection():WallSection{const cells=[{b:1800,h:300,u:0,v:0},{b:300,h:1500,u:-750,v:900}].map((c,i)=>({id:String(i),physicalPanelId:String(i),shape:{kind:"rectangle" as const,b:c.b,h:c.h,angleRad:0,center:{u:c.u,v:c.v},source:"independent L cell"}}));return {cells,bars:cells.flatMap(c=>rectangleColumnBars(c.shape,20,2,2,30,10).map(b=>({...b,id:`${c.id}:${b.id}`}))),source:"actual connected, nonoverlapping L geometry"};}
test("P11 asymmetric L capacity rotates/translates without changing strength",()=>{const s=lSection(),angle=.41,c=Math.cos(angle),v=Math.sin(angle),t=structuredClone(s),before=JSON.stringify(s);for(const cell of t.cells){const p=cell.shape.center!;cell.shape.angleRad+=angle;cell.shape.center={u:12000+c*p.u-v*p.v,v:-7000+v*p.u+c*p.v};}t.bars=t.bars.map(b=>({...b,u:12000+c*b.u-v*b.v,v:-7000+v*b.u+c*b.v}));const a=wallCapacity(s,beamTestMaterial,300,20,100),b=wallCapacity(t,beamTestMaterial,300,c*20-v*100,v*20+c*100);assert.equal(a.status,"solved");assert.equal(b.status,"solved");if(a.status==="solved"&&b.status==="solved")close(a.capacityKnm,b.capacityKnm);assert.equal(JSON.stringify(s),before);});
test("P11 L compression polygon agrees with independent cell fibre integration",()=>{
 const s=lSection(),p=prepareWallSection(s,beamTestMaterial),theta=.7,c=1200,u=Math.cos(theta),v=Math.sin(theta),cx=(540000*0+450000*-750)/990000,cy=450000*900/990000,edge=Math.max(...s.cells.flatMap(c=>[-1,1].flatMap(a=>[-1,1].map(b=>u*(c.shape.center!.u+a*c.shape.b/2-cx)+v*(c.shape.center!.v+b*c.shape.h/2-cy))))),state=p.plane(theta,c);let N=0,M2=0,M3=0;
 for(const cell of s.cells){const shape=cell.shape,A=shape.b*shape.h/40000;for(let i=0;i<200;i++)for(let j=0;j<200;j++){const x=shape.center!.u-shape.b/2+(i+.5)*shape.b/200-cx,y=shape.center!.v-shape.h/2+(j+.5)*shape.h/200-cy;if(u*x+v*y>=edge-.85*c){const f=.85*(25/1.5)*A;N+=f;M2-=f*y;M3+=f*x;}}}
 for(const b of s.bars){const x=b.u-cx,y=b.v-cy,e=.003*(1-(edge-u*x-v*y)/c),f=Math.PI*b.diameter**2/4*Math.max(-420/1.15,Math.min(420/1.15,200000*e));N+=f;M2-=f*y;M3+=f*x;}
 close(N/1000,state.Nkn,.005);close(M2/1e6,state.M2knm,.005);close(M3/1e6,state.M3knm,.005);
});
test("P11 critical height uses actual wall length/height and the explicit upper cap",()=>{assert.equal(criticalWallHeight(3000,9000),3000);assert.equal(criticalWallHeight(3000,30000),5000);assert.equal(criticalWallHeight(3000,60000),6000);assert.throws(()=>criticalWallHeight(0,9000));});
test("P11 real shell base force cut equilibrates roof loading after rotation and translation",()=>{
 for(const angle of [0,.37]){const c=Math.cos(angle),s=Math.sin(angle),shift=angle?[10,-7]:[0,0],positions=[[-1,0],[1,0],[1,3],[-1,3]],nodes:FrameNode[]=positions.map(([x,z],i)=>({id:String(i),position:[shift[0]+c*x,shift[1]+s*x,z],load:i<2?[0,0,0,0,0,0]:[5*c,5*s,-400,0,0,0],prescribed:i<2?[0,0,0,0,0,0]:[null,null,null,null,null,null],springs:[0,0,0,0,0,0]})),shell={id:"wall",nodes:["0","1","2","3"] as const,E:3e7,nu:.2,thickness:.3,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:1,bending:1,shear:1},pressure:0},solved=solveLinearStructure(nodes,[],[shell],null),r=wallCutFromLinear(nodes,[shell],solved,[{shellId:"wall",nodeIds:["0","1"]}],[shift[0],shift[1],0],angle,"bottom");close(r.force.Nkn,800);close(r.force.Vukn,10);close(r.force.M3knm,30);close(r.force.M2knm,0);assert.throws(()=>wallCutFromLinear(nodes,[shell],solved,[{shellId:"wall",nodeIds:["0"]}],[shift[0],shift[1],0],angle,"bottom"));}
});
test("P11 exact-diaphragm static state rejects stale stiffness and discarded loads",()=>{
 const {input}=wallShellSystemFixture(),model=input.structure,before=JSON.stringify(model),state=solveWallStatic(model,[{nodeId:"X0:2",values:[10,0,0,0,0,0]}]);assert.equal(state.status,"solved");assert.equal(JSON.stringify(model),before);if(state.status!=="solved")throw Error("Gerçek statik çözüm gerekli.");assert.ok(state.numerical.relativeResidual<1e-8);const cut=[{shellId:"X0",nodeIds:["X0:0","X0:1"]}];assert.ok(wallCutFromLinear(model.nodes,model.shells,state,cut,[-3,0,0],0,"bottom",model).coincidentPhysicalTuple);model.shells[0].thickness*=2;assert.throws(()=>wallCutFromLinear(model.nodes,model.shells,state,cut,[-3,0,0],0,"bottom",model),/Eski/);model.nodes[0].load=[1,0,0,0,0,0];assert.equal(solveWallStatic(model,[]).status,"invalid_input");
});
test("P11 link count cannot hide clustered links or concrete-cover violations",()=>{
 const clustered=wallScope();for(const l of clustered.walls[0].detail.webLinks)l.zMm=125+(l.zMm-125)*.1;const count=clustered.walls[0].detail.webLinks.length;assert.equal(count,wallScope().walls[0].detail.webLinks.length);assert.notEqual(designWalls(clustered).status,"wall_scope_ready");const cover=wallScope();cover.walls[0].detail.webLinks[0].zMm=1;assert.notEqual(designWalls(cover).status,"wall_scope_ready");
});
test("P11 renamed panel aliases, omitted joint sides and unknown friction do not pass",()=>{const alias=wallScope(),w=structuredClone(alias.walls[0]);w.id="alias";w.section.cells[0].physicalPanelId="different-name";alias.walls.push(w);alias.allWallIds.value!.push(w.id);assert.equal(designWalls(alias).status,"invalid_input");const missing=wallScope();missing.walls[0].loads[0].samples.splice(1,1);assert.equal(designWalls(missing).status,"incomplete");const friction=wallScope();friction.walls[0].roughenedJoints.value=null;assert.equal(designWalls(friction).status,"incomplete");});
test("P11 failed shear and slip are recorded even when flexure also fails",()=>{const scope=wallScope();scope.walls=[wallFixture("W1",3000,0,6000)];const r=designWalls(scope);assert.equal(r.status,"incomplete");if(!("walls" in r)||!("checks" in r.walls[0])||!r.walls[0].checks)throw Error("Başarısız gerçek kontroller eksik.");assert.ok(r.walls[0].checks.some(c=>c.id.startsWith("shear:")&&!c.passed));assert.ok(r.walls[0].checks.some(c=>c.id.startsWith("friction:")&&!c.passed));});
test("P11 boundary confinement and diagonal-normal steel collisions remain failures",()=>{
 const scope=wallScope();scope.walls[0].detail.boundaries[0].tie.endSpacingMm=151;assert.notEqual(designWalls(scope).status,"wall_scope_ready");const c=couplingFixture();for(const bar of c.diagonal!.bundles[1].bars)bar.points=bar.points.map(p=>[p[0],p[1]-204,p[2]] as V3) as unknown as typeof bar.points;const r=designCouplingBeam(c);assert.notEqual(r.status,"coupling_ready");if("checks" in r)assert.ok(r.checks?.some(c=>c.id.startsWith("bar_clear:")&&!c.passed));
});
test("P11 actual bridge mesh coupling converges from 128 to 256 cells within one percent",()=>{
 const ratios:number[]=[];for(const n of [64,128,256]){const {input,definition}=wallShellSystemFixture(.3,n),r=responseSpectrum(input.structure,{maxModes:64},input.dd2,{id:"X",orientation:"horizontal",purpose:"raw_modal",reduction:{R:7,D:2.5,I:1},equivalentCheck:null},"CQC",.05);assert.equal(r.status,"solved");if(r.status!=="solved")throw Error("Yakınsama için gerçek modal çözüm gerekli.");ratios.push(deriveBeamCoupling(input.structure,r,input.walls.X[0],definition).omega);}assert.ok(Math.abs(ratios[1]/ratios[2]-1)<.01,JSON.stringify(ratios));
});
test("P11 explicit zero force is distinct from unknown force and does not invent a capacity",()=>{
 const scope=wallScope();for(const s of scope.walls[0].loads[0].samples){const zero={Nkn:0,M2knm:0,M3knm:0,Vukn:0,Vvkn:0,Tknm:0};s.force={...zero};s.gravity={...zero};s.earthquake={...zero};}assert.equal(designWalls(scope).status,"wall_scope_ready");const unknown=structuredClone(scope);unknown.walls[0].loads[0].samples[0].force.Nkn=Number.NaN;assert.equal(designWalls(unknown).status,"incomplete");
});
test("P11 Eq4.28 squares the entire 0.2+length/height bracket before summing areas",()=>{
 const input=globalWallFixture(false);for(const n of input.structure.nodes){if(n.id.startsWith("X"))n.position=[n.position[0]*3,n.position[1],n.position[2]===3?30:0];else n.position=[n.position[0],n.position[1],n.position[2]===3?30:0];}for(const shell of input.structure.shells)if(shell.id.startsWith("X"))shell.thickness=1;
 const r=empiricalCoefficient(input.structure,input.walls.X,"A13",30,"X"),At=4*6*(.2+6/30)**2,Ct=.1/Math.sqrt(At);assert.ok(Ct<.07);close(r.equivalentWallArea!,At,1e-10);close(r.Ct,Ct,1e-10);assert.notEqual(r.equivalentWallArea,4*6*(.2+(6/30)**2));
});
