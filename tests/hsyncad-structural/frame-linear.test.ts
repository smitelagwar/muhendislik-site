import test from "node:test";
import assert from "node:assert/strict";
import {solveLinearFrame,frameLocalStiffness,type FrameNode,type FrameElement} from "../../src/lib/hsyncad/structural/frame-linear";
import {polygonPrincipalSection} from "../../src/lib/hsyncad/structural/section-properties";
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<=1e-9+1e-6*Math.abs(b),`${a} != ${b}`);
test("polygon section centroidal/principal inertias preserve rotation; no invented torsion",()=>{
 const angle=.37,ring=[[-.1,-.3],[.1,-.3],[.1,.3],[-.1,.3]] as const;
 const s=polygonPrincipalSection([ring]),rotated=ring.map(([y,z])=>[y*Math.cos(angle)-z*Math.sin(angle)+4,y*Math.sin(angle)+z*Math.cos(angle)-2] as const),r=polygonPrincipalSection([rotated]);
 close(s.area,.12);close(s.Iy,.2*.6**3/12);close(s.Iz,.6*.2**3/12);close(r.principalMin,s.principalMin);close(r.principalMax,s.principalMax);close(r.centroid[0],4);close(r.centroid[1],-2);assert.equal(r.torsionConstant,null);
});
function fixture(){
 const E=3e7,G=1.25e7,r=.2,I=Math.PI*r**4/4,A=Math.PI*r*r,L=3;
 const nodes:FrameNode[]=[{id:"a",position:[0,0,0],load:[0,0,0,0,0,0],prescribed:[0,0,0,0,0,0],springs:[0,0,0,0,0,0]},{id:"b",position:[L,0,0],load:[0,0,0,0,0,0],prescribed:[null,null,null,null,null,null],springs:[0,0,0,0,0,0]}];
 const element:FrameElement={id:"e",nodes:["a","b"],offsets:[[0,0,0],[0,0,0]],up:[0,1,0],rollRad:0,E,G,section:{area:A,Iy:I,Iz:I,J:2*I,shearAreaY:.9*A,shearAreaZ:.9*A},modifiers:{axial:1,bendingY:1,bendingZ:1,torsion:1,shearY:1,shearZ:1},theory:"euler_bernoulli",releases:Array(12).fill(false),uniformLocal:[0,0,0]};
 return {nodes,element,E,G,I,A,L};
}
test("3D cantilever: axial, two bending planes, rotations and torsion match independent mechanics",()=>{
 const {nodes,element:E,E:modulus,G,I,A,L}=fixture();nodes[1].load=[2,3,5,7,0,0];
 const r=solveLinearFrame(nodes,[E]);assert.equal(r.status,"solved");if(r.status!=="solved")return;
 const u=r.nodes[1].displacement;
 close(u[0],2*L/(modulus*A));close(u[1],3*L**3/(3*modulus*I));close(u[2],5*L**3/(3*modulus*I));
 close(u[3],7*L/(G*2*I));close(u[4],-5*L**2/(2*modulus*I));close(u[5],3*L**2/(2*modulus*I));
 close(r.nodes[0].fixedReaction[0],-2);close(r.nodes[0].fixedReaction[1],-3);close(r.nodes[0].fixedReaction[2],-5);
 close(r.nodes[0].fixedReaction[3],-7);close(r.nodes[0].fixedReaction[4],5*L);close(r.nodes[0].fixedReaction[5],-3*L);
});
test("Timoshenko adds the independently specified shear compliance",()=>{
 const {nodes,element,E,I,G,L}=fixture();nodes[1].load=[0,1,0,0,0,0];element.theory="timoshenko";
 const r=solveLinearFrame(nodes,[element]);assert.equal(r.status,"solved");if(r.status!=="solved")return;
 close(r.nodes[1].displacement[1],L**3/(3*E*I)+L/(G*element.section.shearAreaY));
});
test("rigid end offset retains moment-arm compliance, not a cosmetic coordinate change",()=>{
 const {nodes,element,E,I,A,L}=fixture(),d=.7;nodes[1].position=[L,-d,0];element.offsets=[[0,0,0],[0,d,0]];nodes[1].load=[1,0,0,0,0,0];
 const r=solveLinearFrame(nodes,[element]);assert.equal(r.status,"solved");if(r.status!=="solved")return;
 close(r.nodes[1].displacement[0],L/(E*A)+d*d*L/(E*I));close(r.nodes[0].fixedReaction[5],-d);
});
test("simply supported uniform beam with explicit end release gives reactions and zero end moment",()=>{
 const {nodes,element,L}=fixture();nodes[1].prescribed=[null,0,0,0,0,0];element.uniformLocal=[0,-2,0];element.releases=Array.from({length:12},(_,i)=>i===5||i===11);
 const r=solveLinearFrame(nodes,[element]);assert.equal(r.status,"solved");if(r.status!=="solved")return;
 close(r.nodes[0].fixedReaction[1],L);close(r.nodes[1].fixedReaction[1],L);
 close(r.memberForces[0].localEndForce[5],0);close(r.memberForces[0].localEndForce[11],0);
});
test("section modifier affects its own mode exactly once, torsion is never secretly reduced",()=>{
 const {element,L,E,G,I}=fixture();element.modifiers.bendingZ=.5;const k=frameLocalStiffness(element,L);
 close(k[3*12+3],G*2*I/L);close(k[1*12+1],12*E*I*.5/L**3);close(k[2*12+2],12*E*I/L**3);
});
test("translated and rotated frame retains physical compliance",()=>{
 const {nodes,element,E,I,L}=fixture();nodes[0].position=[100,200,300];nodes[1].position=[100,200+L,300];element.up=[0,0,1];nodes[1].load=[0,0,1,0,0,0];
 const r=solveLinearFrame(nodes,[element]);assert.equal(r.status,"solved");if(r.status!=="solved")return;close(r.nodes[1].displacement[2],L**3/(3*E*I));
});
test("unrestrained zero-load frame is rejected, not a fake zero displacement solution",()=>{
 const {nodes,element}=fixture();nodes[0].prescribed=[null,null,null,null,null,null];
 assert.equal(solveLinearFrame(nodes,[element]).status,"solver_error");
});
test("support settlement is eliminated explicitly and springs carry their true reaction",()=>{
 const {nodes,element,L,E,A}=fixture();nodes[0].prescribed=[.001,0,0,0,0,0];nodes[1].load=[1,0,0,0,0,0];
 const r=solveLinearFrame(nodes,[element]);assert.equal(r.status,"solved");if(r.status!=="solved")return;close(r.nodes[1].displacement[0],.001+L/(E*A));
 const spring=fixture();spring.nodes[0].prescribed=[null,0,0,0,0,0];spring.nodes[0].springs=[10000,0,0,0,0,0];spring.nodes[1].load=[1,0,0,0,0,0];
 const s=solveLinearFrame(spring.nodes,[spring.element]);assert.equal(s.status,"solved");if(s.status!=="solved")return;close(s.nodes[0].springReaction[0],-1);
});
test("continuous two-span beam matches independent three-moment theorem",()=>{
 const f=fixture(),L=f.L;
 f.nodes[0].prescribed=[0,0,0,0,0,null];f.nodes[1].prescribed=[0,0,0,0,0,null];f.nodes.push({...structuredClone(f.nodes[1]),id:"c",position:[2*L,0,0]});
 f.element.uniformLocal=[0,-2,0];const second={...structuredClone(f.element),id:"e2",nodes:["b","c"] as const};
 const r=solveLinearFrame(f.nodes,[f.element,second]);assert.equal(r.status,"solved");if(r.status!=="solved")return;
 close(r.nodes[0].fixedReaction[1],3*2*L/8);close(r.nodes[1].fixedReaction[1],5*2*L/4);close(r.nodes[2].fixedReaction[1],3*2*L/8);close(Math.abs(r.memberForces[0].localEndForce[11]),2*L*L/8);r.balance.forEach(v=>close(v,0));
});
test("principal asymmetric section roll changes directional compliance by tensor rotation",()=>{
 const f=fixture(),angle=.43;f.element.section.Iy=.001;f.element.section.Iz=.004;f.element.rollRad=angle;f.nodes[1].load=[0,1,0,0,0,0];
 const r=solveLinearFrame(f.nodes,[f.element]);assert.equal(r.status,"solved");if(r.status!=="solved")return;
 close(r.nodes[1].displacement[1],f.L**3/(3*f.E)*(Math.cos(angle)**2/.004+Math.sin(angle)**2/.001));
});
test("a disconnected unloaded component is a mechanism even when loaded component is stable",()=>{
 const f=fixture();f.nodes.push({...structuredClone(f.nodes[1]),id:"orphan",position:[10,10,10]});assert.equal(solveLinearFrame(f.nodes,[f.element]).status,"solver_error");
});
