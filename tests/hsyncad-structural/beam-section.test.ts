import test from "node:test";
import assert from "node:assert/strict";
import {beamCapacity,beamMaterial,requiredBeamSteel,barArea,effectiveFlange,type BeamBar} from "../../src/lib/hsyncad/structural/rc-beam-section";
import {beamTestMaterial as material} from "./beam-fixtures";
const close=(a:number,b:number,t=1e-7)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const section={bw:300,h:500,bf:300,hf:0};
const two=(face:"top"|"bottom",diameter:number,y:number):BeamBar[]=>[-1,1].map((s,i)=>({id:`${face}${i}`,face,x:s*70,y,diameter}));
test("singly reinforced rectangle matches independent yielded steel force/block moment",()=>{
 const bars=two("bottom",20,450),m=beamMaterial(material),r=beamCapacity(section,bars,material,1);assert.equal(r.status,"solved");if(r.status!=="solved")return;
 const T=2*barArea(20)*m.fyd,a=T/(.85*m.fcd*300);close(r.capacityKnm,T*(450-a/2)/1e6);close(r.neutralAxisMm,a/m.k1);assert.ok(Math.abs(r.residualN)<1e-4);
 const required=requiredBeamSteel(section,material,1,r.capacityKnm,450,0,50);assert.equal(required.status,"solved");if(required.status==="solved")close(required.requiredAreaMm2,2*barArea(20));
});
test("double reinforcement uses actual elastic compression steel, not an assumed yield",()=>{
 const bars=[...two("bottom",25,450),...two("top",20,50)],m=beamMaterial(material),At=2*barArea(25),Ac=2*barArea(20),A=.85*m.fcd*300*m.k1,B=Ac*m.Es*m.ecu-At*m.fyd;
 const c=(-B+Math.sqrt(B*B+4*A*Ac*m.Es*m.ecu*50))/(2*A),stress=m.Es*m.ecu*(1-50/c);assert.ok(stress<m.fyd);
 const moment=(.85*m.fcd*300*m.k1*c*(450-m.k1*c/2)+Ac*stress*(450-50))/1e6,r=beamCapacity(section,bars,material,1);assert.equal(r.status,"solved");if(r.status==="solved"){close(r.neutralAxisMm,c);close(r.capacityKnm,moment);}
});
test("positive T flange and negative web compression are distinguished with the same physical bars",()=>{
 const s={...section,bf:900,hf:100},bars=[...two("bottom",20,450),...two("top",20,50)],pos=beamCapacity(s,bars,material,1),neg=beamCapacity(s,bars,material,-1);assert.equal(pos.status,"solved");assert.equal(neg.status,"solved");if(pos.status==="solved"&&neg.status==="solved")assert.ok(pos.capacityKnm>neg.capacityKnm);
 const rect=beamCapacity(section,bars,material,1);if(rect.status==="solved"&&neg.status==="solved")close(neg.capacityKnm,rect.capacityKnm);
 const f=effectiveFlange(300,600,100,3000,3000,6000,"interior",true);assert.equal(f.section.bf,1020);assert.throws(()=>effectiveFlange(300,600,100,1000,2000,6000,"simple",true));
});
test("axial equilibrium is explicit and impossible/overreinforced sections cannot pass",()=>{
 const bars=[...[-60,-20,20,60].map((x,i)=>({id:`b${i}`,x,y:450,diameter:32,face:"bottom" as const})),...two("top",12,50)],r=beamCapacity({...section,bw:200,bf:200},bars,material,1,100);if(r.status==="solved"){assert.ok(Math.abs(r.residualN)<1e-4);assert.equal(r.maximumSatisfied,false);}
 assert.equal(requiredBeamSteel(section,material,1,10000,450,0,50).status,"insufficient_section");assert.throws(()=>beamCapacity(section,[...two("bottom",20,495)],material,1));
});

test("steel rupture strain cannot be hidden behind a perfectly plastic stress plateau",()=>{
 const bars=[...two("bottom",20,450),...two("top",20,50)],r=beamCapacity(section,bars,material,1,-450);assert.equal(r.status,"solved");if(r.status==="solved")assert.equal(r.strainLimitSatisfied,false);
});

test("material values must match their declared table/equation or carry explicit test evidence",()=>{
 assert.throws(()=>beamMaterial({...material,fctk:2.5}));assert.throws(()=>beamMaterial({...material,elasticBasis:"verified_test",Ec:31000,testEvidence:null}));
 assert.equal(beamMaterial({...material,elasticBasis:"verified_test",Ec:31000,testEvidence:"explicit characteristic material test record"}).Ec,31000);
});
