import test from "node:test";
import assert from "node:assert/strict";
import { polygonLamina,combineLaminas } from "../../src/lib/hsyncad/structural/mass-properties";
import { buildLoadLedger,oneWayUniformStrip,prismaticSelfWeight,STANDARD_GRAVITY,type LoadPatch } from "../../src/lib/hsyncad/structural/load-ledger";
import { structuralPreflight } from "../../src/lib/hsyncad/structural/preflight";
import { createEmptyModel } from "../../src/lib/hsyncad/model";
import { createStructuralProject } from "../../src/lib/hsyncad/structural/project-schema";
const rectangle=(x=0,y=0,w=4,h=4)=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function patch(overrides:Partial<LoadPatch>={}):LoadPatch{return {id:"Q1",physicalLoadId:"Q1",caseId:"Q",elementId:"slab",floorId:"floor-0",kind:"live",direction:[0,0,-1],provenance:{source:"user_input",evidence:null},basis:"area",intensity:2,unit:"kN/m2",measure:16,position:{x:2,y:2},footprint:rectangle(),massParticipation:.3,selfWeightIncluded:false,loadPath:"direct_surface",...overrides};}
test("rectangle mass and polar inertia use actual distributed geometry",()=>{
 const r=polygonLamina(rectangle(),100);close(r.areaM2,16);close(r.massKg,1600);close(r.center.x,2);close(r.center.y,2);close(r.polarKgM2,1600*(16+16)/12);
 const shifted=polygonLamina(rectangle(1e8,1e8),100);close(shifted.polarKgM2,r.polarKgM2);
 close(polygonLamina([...rectangle()].reverse(),100).polarKgM2,r.polarKgM2);
});
test("nonuniform vertex spacing cannot move the area centroid",()=>{
 const r=polygonLamina([{x:0,y:0},{x:1,y:0},{x:4,y:0},{x:4,y:4},{x:0,y:4}],1);close(r.center.x,2);close(r.center.y,2);
 const tri=polygonLamina([{x:0,y:0},{x:6,y:0},{x:0,y:3}],1);close(tri.areaM2,9);close(tri.center.x,2);close(tri.center.y,1);close(tri.polarKgM2,9*(36+9)/18);
});
test("off-center hole removes mass, first moment and polar integral",()=>{
 const r=polygonLamina(rectangle(0,0,6,4),10,[rectangle(1,1,1,1)]);close(r.massKg,230);close(r.center.x,(24*3-1.5)/23);close(r.center.y,(24*2-1.5)/23);
 assert.throws(()=>polygonLamina(rectangle(),1,[rectangle(3,3,2,2)]));
 assert.throws(()=>polygonLamina(rectangle(),1,[rectangle(1,1,2,2),rectangle(1.5,1.5,1,1)]));
});
test("spatially distinct load zones retain their own mass fractions and inertia",()=>{
 const a=polygonLamina(rectangle(0,0,2,2),100),b=polygonLamina(rectangle(2,0,2,2),200),r=combineLaminas([a,b]);
 close(r.massKg,1200);close(r.center.x,7/3);close(r.center.y,1);
 close(r.polarKgM2,a.polarKgM2+b.polarKgM2+400*(1-7/3)**2+800*(3-7/3)**2);
});
test("uniform one-way strip conserves force and moment; direct shell path cannot be duplicated",()=>{
 const ledger=buildLoadLedger([patch()]),s=oneWayUniformStrip(ledger.totalsByCase.Q,4,"one_way_transfer");
 close(s.transferredKn,32);close(s.reactionLeftKn+s.reactionRightKn,32);close(s.reactionRightKn*4,s.momentAboutLeftKnm);
 assert.throws(()=>oneWayUniformStrip(32,4,"direct_surface"));
 assert.equal(ledger.analysisApproved,false);
});
test("independent density-volume self weight, G/Q separation and mass conversion",()=>{
 const sw=prismaticSelfWeight("SW","slab","floor-0",rectangle(),.15,2500);
 const r=buildLoadLedger([sw,patch()]);close(r.totalsByCase.G,16*.15*2500*STANDARD_GRAVITY/1000);close(r.totalsByCase.Q,32);
 close(r.mass!.massKg,6000+32*1000/STANDARD_GRAVITY*.3);
 const tf=buildLoadLedger([patch({unit:"tf/m2",intensity:.2})]);close(tf.totalsByCase.Q,.2*STANDARD_GRAVITY*16);
});
test("double self weight, unknown native G, wrong units and bad geometry fail closed",()=>{
 const sw=prismaticSelfWeight("SW","slab","floor-0",rectangle(),.15,2500);
 assert.throws(()=>buildLoadLedger([sw,{...sw,id:"SW2"}]));
 assert.throws(()=>buildLoadLedger([sw,patch({selfWeightIncluded:true})]));
 for(const p of [patch({selfWeightIncluded:null}),patch({massParticipation:null}),patch({unit:"kN/m"}),patch({measure:8}),patch({intensity:NaN}),patch({provenance:{source:"native_decoded",evidence:"raw-offset-only"}})])assert.throws(()=>buildLoadLedger([p]));
 assert.throws(()=>buildLoadLedger([patch(),patch()]));
});
test("line, point, horizontal action and separate load paths remain explicit",()=>{
 const line=patch({basis:"line",unit:"kN/m",measure:4,line:[{x:0,y:0},{x:4,y:0}],intensity:3});
 const r=buildLoadLedger([line]);close(r.totals.live,12);close(r.mass!.polarKgM2,r.mass!.massKg*16/12);
 const point=patch({basis:"point",unit:"kN",measure:1,intensity:5,position:{x:3,y:2}});close(buildLoadLedger([point]).mass!.center.x,3);
 assert.throws(()=>buildLoadLedger([patch({direction:[1,0,0]})]));
 close(buildLoadLedger([point,{...point,id:"wind",physicalLoadId:"wind",caseId:"W",kind:"wind",massParticipation:0,direction:[1,0,0]}]).totalsByCase.W,5);
});
test("empty and ambiguous physical models cannot become analysis success",()=>{
 const m=createEmptyModel();m.structural=createStructuralProject(m,"test");m.structural.loads=[];
 const p=structuralPreflight(m,[]);assert.equal(p.status,"blocked");assert.equal(p.analysisApproved,false);assert.ok(p.issues.some(i=>i.code==="empty_model"));
 assert.deepEqual(structuralPreflight(m,[]),p);
});
test("deterministic explicit frame packet and unsupported connectivity detection",()=>{
 const m=createEmptyModel();m.elements=[{id:"c",name:"C",type:"column",floorId:"floor-0",materialId:"concrete",layer:"Kolonlar",position:{x:0,y:0},width:.4,depth:.4,height:3}];m.structural=createStructuralProject(m,"frame");
 const p=m.structural,o=p.objects[0];o.role="column";o.source="user_input";o.materialId="concrete";o.localAxis=0;o.openingsM=[];o.diaphragmId="D1";o.connections={startJointId:"base",endJointId:"top",startReleases:[false,false,false,false,false,false],endReleases:[false,false,false,false,false,false],eccentricityM:null};o.supports=[{jointId:"base",restrained:[true,true,true,true,true,true],stiffness:null}];
 p.materials[0]={materialId:"concrete",source:"user_input",properties:{elasticModulusMPa:30000,densityKgM3:2500,fckMPa:30,fykMPa:null,poisson:.2}};p.loads=[];p.floorRoles=[{floorId:"floor-0",role:"superstructure",diaphragmId:"D1",source:"user_input"}];
 const weight=prismaticSelfWeight("SW","c","floor-0",rectangle(-.2,-.2,.4,.4),3,2500),before=structuredClone(m);
 const result=structuralPreflight(m,[weight]);assert.equal(result.status,"input_ready");assert.equal(result.nodes.length,2);assert.equal(result.stability,"requires_solver_check");assert.deepEqual(m,before);
 o.supports=[];assert.ok(structuralPreflight(m,[weight]).issues.some(i=>i.code==="unsupported_component"));
 o.role="unknown";assert.ok(structuralPreflight(m,[weight]).issues.some(i=>i.code==="role_unknown"));
 o.role="column";const first=m.elements[0];if(first.type!=="column")throw new Error("fixture");
 m.elements.push({...first,id:"c2",position:{x:10,y:0}});p.objects.push({...structuredClone(o),elementId:"c2"});
 assert.ok(structuralPreflight(m,[weight]).issues.some(i=>i.code==="joint_coordinate_conflict"));
});
test("force overflow and physical-owner double application cannot be hidden",()=>{
 const a=patch({basis:"point",unit:"kN",measure:1,intensity:1e308,massParticipation:0});
 assert.throws(()=>buildLoadLedger([a,{...a,id:"b",physicalLoadId:"b"}]));
 assert.throws(()=>buildLoadLedger([patch(),patch({id:"copy",loadPath:"one_way_transfer"})]));
 assert.throws(()=>oneWayUniformStrip(1e308,10,"one_way_transfer"));
});
test("each floor has an independent mass center; unused live-load fraction is not global",()=>{
 const a=patch({intensity:1,massParticipation:.1}),b=patch({id:"b",physicalLoadId:"b",floorId:"floor-1",intensity:1,massParticipation:.5,footprint:rectangle(10,0),position:{x:12,y:2}});
 const r=buildLoadLedger([a,b]);close(r.massByFloor['floor-0'].center.x,2);close(r.massByFloor['floor-1'].center.x,12);close(r.massByFloor['floor-1'].massKg,5*r.massByFloor['floor-0'].massKg);
});
test("diagnostic JSON never turns an unsupported temperature record into a force",()=>{
 const m=createEmptyModel();m.elements=[{id:"slab",name:"D1",type:"slab",floorId:"floor-0",materialId:"concrete",layer:"Döşemeler",points:rectangle(),thickness:.15}];m.structural=createStructuralProject(m,"thermal");
 m.structural.loads=[{id:"T1",kind:"temperature",source:"user_input",evidence:null,elementIds:["slab"],coordinateSystem:"global",distribution:"body",unit:"C",components:[15,0,0],selfWeightIncluded:false,massParticipation:0,applicationRegion:null}];
 const packet=structuralPreflight(m,[]);assert.equal(packet.analysisApproved,false);
 assert.ok(packet.issues.some(i=>i.code==="thermal_unsupported"));assert.equal(packet.declaredLoads![0].unit,"C");
 assert.deepEqual(JSON.parse(JSON.stringify(packet)).issues,packet.issues);
});
