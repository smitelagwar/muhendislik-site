import test from "node:test";
import assert from "node:assert/strict";
import {placeBeamBars,beamShearTorsion,capacityShear,anchorageLength,beamAnchorage,beamLap,stirrupLocations} from "../../src/lib/hsyncad/structural/beam-detailing";
import {beamTestMaterial as material} from "./beam-fixtures";
const section={bw:300,h:600,bf:300,hf:0},layout={top:{diameter:20,count:2,rows:1},bottom:{diameter:20,count:2,rows:1},stirrupDiameter:8,legs:2,spacingEnd:100,spacingMiddle:150,sideDiameter:12,sideEach:0};
test("physical multi-row layout rejects congestion/overlap and keeps actual coordinates",()=>{
 assert.equal(placeBeamBars(section,layout,30,16).bars.length,4);assert.throws(()=>placeBeamBars({...section,bw:200},{...layout,bottom:{diameter:32,count:6,rows:1}},30,20));
 const r=placeBeamBars(section,{...layout,bottom:{diameter:16,count:6,rows:2}},30,16);assert.equal(new Set(r.bars.filter(b=>b.face==="bottom").map(b=>b.y)).size,2);
});
test("shear compression failure, earthquake Vc suppression and pure torsion remain explicit",()=>{
 const input={section,material,d:550,NcompressionKn:0,Vkn:150,Tknm:0,layout,cover:30,zeroConcrete:false,highDuctility:true},normal=beamShearTorsion(input),earthquake=beamShearTorsion({...input,zeroConcrete:true});assert.ok(normal.VcKn>0);assert.equal(earthquake.VcKn,0);assert.ok(earthquake.requiredOuterPerMm>normal.requiredOuterPerMm);
 assert.equal(beamShearTorsion({...input,Vkn:1000}).passed,false);const torsion=beamShearTorsion({...input,Vkn:0,Tknm:100});assert.ok(Number.isFinite(torsion.requiredOuterPerMm));assert.ok(torsion.requiredLongitudinalMm2>0);assert.equal(torsion.passed,false);
});
test("capacity shear responds to actual moment capacities and a real D-amplified cap",()=>{
 const input={gravityLeftKn:30,gravityRightKn:-30,leftTopCapacity:100,leftBottomCapacity:80,rightTopCapacity:100,rightBottomCapacity:80,clearSpanMm:6000,amplifiedLeftKn:90,amplifiedRightKn:-90};const a=capacityShear(input),b=capacityShear({...input,leftTopCapacity:200});assert.ok(b.leftKn>a.leftKn);assert.equal(b.leftKn,90);assert.equal(a.forward,1.4*180/6);
});
test("anchorage, hook geometry, prohibited lap zones and real stirrup gaps are checked",()=>{
 const l=anchorageLength(20,material,"II",30,40),top=anchorageLength(20,material,"I",30,40);assert.ok(top.lb>l.lb);
 const short={kind:"straight" as const,availableMm:100,coverMm:30,clearSpacingMm:40,source:"fixture support pocket"};assert.equal(beamAnchorage(short,20,material,"II",true,false).passed,false);
 const hook=beamAnchorage({kind:"hook90",horizontalMm:500,verticalMm:500,innerBendDiameterMm:120,coverMm:30,clearSpacingMm:40,source:"fixture hook geometry"},20,material,"II",true,false);assert.equal(hook.passed,true);assert.ok(hook.cutExtensionMm<1000);
 const lap={diameter:20,material,position:"II" as const,cover:30,clearSpacing:40,fraction:.5,startMm:2000,lengthMm:1000,spanMm:6000,heightMm:600,stirrupDiameter:8,stirrupSpacing:100,high:true,isBottom:true,plasticZones:[{startMm:2900,endMm:3100}]};assert.equal(beamLap(lap).passed,false);assert.equal(beamLap({...lap,startMm:1500,plasticZones:[]}).passed,true);
 const s=stirrupLocations(6000,600,100,200).positionsMm;assert.equal(s[0],25);assert.equal(s.at(-1),5975);for(let i=1;i<s.length;i++)assert.ok(s[i]-s[i-1]<=200+1e-8);
});
