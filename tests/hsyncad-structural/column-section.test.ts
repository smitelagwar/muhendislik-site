import test from "node:test";
import assert from "node:assert/strict";
import {columnCapacity,columnGeometry,prepareColumnSection,type ColumnShape,type ColumnBar} from "../../src/lib/hsyncad/structural/rc-column-section";
import {beamCapacity,beamMaterial} from "../../src/lib/hsyncad/structural/rc-beam-section";
import {beamTestMaterial as material} from "./beam-fixtures";
import {rectangleColumnBars,circleColumnBars} from "../../src/lib/hsyncad/structural/column-detailing";
const close=(a:number,b:number,t=1e-6)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test("column neutral-plane integration agrees with independent P09 uniaxial section",()=>{
 const shape:ColumnShape={kind:"rectangle",b:500,h:300,angleRad:0,source:"analytic rectangle"},beamBars=[-70,70].flatMap((x,i)=>[{id:`top${i}`,x,y:50,diameter:20,face:"top" as const},{id:`bottom${i}`,x,y:450,diameter:20,face:"bottom" as const}]),bars=beamBars.map(b=>({id:b.id,u:250-b.y,v:b.x,diameter:b.diameter})),a=beamCapacity({bw:300,h:500,bf:300,hf:0},beamBars,material,1),b=columnCapacity(shape,bars,material,0,0,1);
 assert.equal(a.status,"solved");assert.equal(b.status,"solved");if(a.status==="solved"&&b.status==="solved"){close(b.capacityKnm!,a.capacityKnm);assert.ok(b.alignmentResidual!<1e-8);close(b.matchedState!.Nkn,0);}
});
test("biaxial strain-compatible capacity is invariant under physical rotation and translation",()=>{
 const shape:ColumnShape={kind:"rectangle",b:400,h:600,angleRad:0,source:"synthetic section"},bars=rectangleColumnBars(shape,20,3,4,30,10),a=columnCapacity(shape,bars,material,500,70,100),angle=.37,c=Math.cos(angle),s=Math.sin(angle),translated={...shape,angleRad:angle,center:{u:12000,v:-3000}},rotated=bars.map(b=>({...b,u:12000+c*b.u-s*b.v,v:-3000+s*b.u+c*b.v})),b=columnCapacity(translated,rotated,material,500,c*70-s*100,s*70+c*100);
 assert.equal(a.status,"solved",JSON.stringify(a));assert.equal(b.status,"solved",JSON.stringify(b));if(a.status==="solved"&&b.status==="solved")close(a.capacityKnm!,b.capacityKnm!);
});
test("circle uses exact semicircle area and first moment, not an inscribed polygon",()=>{
 const shape:ColumnShape={kind:"circle",diameter:400,source:"exact circular section"},bars=circleColumnBars(shape,20,8,30,10),m=beamMaterial(material),s=prepareColumnSection(shape,bars,material),p=s.plane(0,200/m.k1),A=Math.PI*200**2/2,first=2/3*200**3;
 close(p.concreteAreaMm2,A);const steelMoment=p.steel.reduce((sum,b)=>sum+b.forceN*bars.find(a=>a.id===b.id)!.u,0);close(p.M3knm,(.85*m.fcd*first+steelMoment)/1e6);close(columnGeometry(shape).Iv,Math.PI*200**4/4);
 const a=columnCapacity(shape,bars,material,300,60,80),b=columnCapacity(shape,bars,material,300,-80,60);assert.equal(a.status,"solved");assert.equal(b.status,"solved");if(a.status==="solved"&&b.status==="solved")close(a.capacityKnm!,b.capacityKnm!);
});
test("convex polygon orientation and centered steel are checked without mutating input",()=>{
 const shape:ColumnShape={kind:"polygon",vertices:[{u:1000,v:2000},{u:1400,v:2000},{u:1400,v:2400},{u:1000,v:2400}],source:"actual convex polygon",center:{u:0,v:0}},bars:ColumnBar[]=[[-140,-140],[140,-140],[140,140],[-140,140]].map(([u,v],i)=>({id:String(i),u:u+1200,v:v+2200,diameter:25})),before=JSON.stringify(shape),r=columnCapacity(shape,bars,material,200,30,40);assert.equal(r.status,"solved",JSON.stringify(r));assert.equal(JSON.stringify(shape),before);
 assert.throws(()=>columnGeometry({kind:"polygon",vertices:[{u:0,v:0},{u:400,v:0},{u:100,v:100},{u:400,v:400},{u:0,v:400}],source:"concave"}));
 const asym=bars.slice(1);assert.equal(columnCapacity(shape,asym,material,200,30,40).status,"unsupported");
});
test("biaxial capacity equilibrates an independent midpoint fibre oracle as axial force changes",()=>{
 const shape:ColumnShape={kind:"rectangle",b:400,h:600,angleRad:0,source:"independent fibre quadrature rectangle"},bars=rectangleColumnBars(shape,20,3,4,30,10),capacities:number[]=[];
 for(const N of [0,500,1500]){
  const r=columnCapacity(shape,bars,material,N,70,100);assert.equal(r.status,"solved");if(r.status!=="solved"||!r.matchedState||r.capacityKnm===null)throw Error("Oracle için çözülen kesit gerekli.");
  capacities.push(r.capacityKnm);const {theta,c}=r.matchedState,nu=Math.cos(theta),nv=Math.sin(theta),edge=Math.abs(nu)*200+Math.abs(nv)*300,threshold=edge-.85*c,cell=400*600/600**2;
  let force=0,m2=0,m3=0,scale=0;
  // Üretim kodunun poligon kesme/ilk-moment integrali burada kullanılmaz.
  for(let i=0;i<600;i++)for(let j=0;j<600;j++){const u=-200+(i+.5)*400/600,v=-300+(j+.5)*600/600;if(nu*u+nv*v>=threshold){const f=.85*(25/1.5)*cell;force+=f;scale+=f;m2-=f*v;m3+=f*u;}}
  for(const b of bars){const strain=.003*(1-(edge-nu*b.u-nv*b.v)/c),stress=Math.max(-420/1.15,Math.min(420/1.15,200000*strain)),f=Math.PI*b.diameter**2/4*stress;force+=f;scale+=Math.abs(f);m2-=f*b.v;m3+=f*b.u;}
  assert.ok(Math.abs(force-N*1000)<.003*scale);close(m2/1e6,r.matchedState.M2knm,.003);close(m3/1e6,r.matchedState.M3knm,.003);
 }
 assert.ok(Math.abs(capacities[0]-capacities[1])>1);assert.ok(Math.abs(capacities[1]-capacities[2])>1);
});
