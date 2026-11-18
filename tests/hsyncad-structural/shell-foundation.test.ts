import test from "node:test";
import assert from "node:assert/strict";
import {compileShellRect,type ShellRect} from "../../src/lib/hsyncad/structural/shell-rect";
import {solveLinearStructure} from "../../src/lib/hsyncad/structural/linear-structure";
import type {FrameNode,FrameElement} from "../../src/lib/hsyncad/structural/frame-element";
const close=(a:number,b:number,tol=1e-7)=>assert.ok(Math.abs(a-b)<1e-8+tol*Math.abs(b),`${a} != ${b}`);
const material={E:3e7,nu:.2,thickness:.1,shearCorrection:5/6,drillPenalty:.01,modifiers:{membrane:1,bending:1,shear:1},pressure:-1};
export function grid(n:number,t:number,supported:boolean,hole=false){
 const nodes:FrameNode[]=[],shells:ShellRect[]=[];
 for(let y=0;y<=n;y++)for(let x=0;x<=n;x++)nodes.push({id:`${x},${y}`,position:[x/n,y/n,0],load:[0,0,0,0,0,0],springs:[0,0,0,0,0,0],prescribed:[0,0,supported&&(x===0||x===n||y===0||y===n)?0:null,supported&&(x===0||x===n)?0:null,supported&&(y===0||y===n)?0:null,0]});
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  if(hole&&x>=n/4&&x<n*3/4&&y>=n/4&&y<n*3/4)continue;
  shells.push({id:`s${x},${y}`,nodes:[`${x},${y}`,`${x+1},${y}`,`${x+1},${y+1}`,`${x},${y+1}`],...material,thickness:t});
 }
 const used=new Set(shells.flatMap(e=>[...e.nodes]));return {nodes:nodes.filter(n=>used.has(n.id)),shells};
}
function solved(r:ReturnType<typeof solveLinearStructure>){assert.equal(r.status,"solved",JSON.stringify(r));if(r.status!=="solved")throw Error("Unsolved");return r;}
test("rectangular shell: membrane strain and rigid-body patch energies",()=>{
 const g=grid(1,.1,false),e=g.shells[0],c=compileShellRect(e,e.nodes.map(id=>g.nodes.find(n=>n.id===id)!.position) as never),u=new Float64Array(24);
 // Element order differs from row-major grid order.
 const p=e.nodes.map(id=>g.nodes.find(n=>n.id===id)!.position);
 const energy=()=>{let sum=0;for(let i=0;i<24;i++)for(let j=0;j<24;j++)sum+=u[i]*c.local[i*24+j]*u[j]/2;return sum;};
 p.forEach(([x,y],i)=>{u[6*i]=.02*x+.03*y;u[6*i+1]=-.01*x+.04*y;u[6*i+5]=-.02;});
 const eps=[.02,.04,.02],D=material.E*.1/(1-material.nu**2);
 close(energy(),D/2*(eps[0]**2+eps[1]**2+2*material.nu*eps[0]*eps[1]+(1-material.nu)/2*eps[2]**2));
 p.forEach(([x,y],i)=>{u[6*i]=2-.1*y;u[6*i+1]=3+.1*x;u[6*i+2]=4+.2*y-.3*x;u[6*i+3]=.2;u[6*i+4]=.3;u[6*i+5]=.1;});
 close(energy(),0,1e-6);
});
test("rectangular shell: constant curvature and twisting patches have no spurious shear",()=>{
 const g=grid(1,.1,false),e=g.shells[0],p=e.nodes.map(id=>g.nodes.find(n=>n.id===id)!.position),c=compileShellRect(e,p as never);
 for(const twist of [false,true]){
  const u=new Float64Array(24),k=.01;
  p.forEach(([x,y],i)=>{u[6*i+2]=twist?k*x*y:k*x*x/2;u[6*i+3]=twist?k*x:0;u[6*i+4]=twist?-k*y:-k*x;});
  let energy=0;for(let i=0;i<24;i++)for(let j=0;j<24;j++)energy+=u[i]*c.local[i*24+j]*u[j]/2;
  const D=material.E*.1**3/(12*(1-material.nu**2));close(energy,twist?D*(1-material.nu)*k*k:D*k*k/2);
 }
});
function navier(t:number){
 const D=material.E*t**3/(12*(1-material.nu**2)),S=material.shearCorrection*material.E/(2*(1+material.nu))*t;let w=0;
 for(let m=1;m<160;m+=2)for(let n=1;n<160;n+=2){const l2=Math.PI**2*(m*m+n*n);w+=Math.sin(m*Math.PI/2)*Math.sin(n*Math.PI/2)*16*material.pressure/(Math.PI**2*m*n)*(1/(D*l2*l2)+1/(S*l2));}return w;
}
test("thin/thick plates converge to independent Navier series (finest mesh <1%)",()=>{
 for(const t of [.01,.2]){
  const target=navier(t),errors:number[]=[];
  for(const n of [4,8,16]){
   const g=grid(n,t,true),r=solved(solveLinearStructure(g.nodes,[],g.shells,null));
   const w=r.nodes.find(v=>v.id===`${n/2},${n/2}`)!.displacement[2];errors.push(Math.abs(w/target-1));
   r.balance.forEach(v=>close(v,0));
  }
  assert.ok(errors[2]<.01,JSON.stringify({t,errors,target}));assert.ok(errors[2]<errors[1]&&errors[1]<errors[0],JSON.stringify(errors));
 }
});
test("Winkler reaction scales with tributary area and is mesh invariant",()=>{
 for(const n of [2,4,8]){
  const g=grid(n,.2,false),ks=10000,r=solved(solveLinearStructure(g.nodes,[],g.shells,{shellIds:g.shells.map(s=>s.id),ks,compressionSign:-1,mode:"compression_only",maxIterations:20}));
  close(r.nodes.reduce((a,v)=>a+v.tributaryArea,0),1);close(r.nodes.reduce((a,v)=>a+v.soilReactionZ,0),1);
  r.nodes.forEach(v=>{close(v.displacement[2],-1/ks);close(v.soilPressure!,1);});r.balance.forEach(v=>close(v,0));
 }
});
test("opening remains an opening: loaded/soil area excludes removed cells",()=>{
 const g=grid(4,.2,false,true),r=solved(solveLinearStructure(g.nodes,[],g.shells,{shellIds:g.shells.map(s=>s.id),ks:10000,compressionSign:-1,mode:"bilateral",maxIterations:1}));
 close(r.nodes.reduce((a,v)=>a+v.tributaryArea,0),.75);close(r.nodes.reduce((a,v)=>a+v.soilReactionZ,0),.75);r.balance.forEach(v=>close(v,0));
});
test("eccentric uplift contact equilibrates; exhausted iterations never produce success",()=>{
 const g=grid(8,.2,false);g.shells.forEach(e=>{e.pressure=0;});
 g.nodes.find(n=>n.id==="7,4")!.load=[0,0,-1,0,0,0];
 const f={shellIds:g.shells.map(s=>s.id),ks:10000,compressionSign:-1 as const,mode:"compression_only" as const,maxIterations:30};
 const r=solved(solveLinearStructure(g.nodes,[],g.shells,f));assert.ok(r.nodes.some(n=>n.contactActive===false));assert.ok(r.metadata.contactIterations>1);
 r.nodes.forEach(n=>{if(n.contactActive)assert.ok(n.soilPressure!>=0);else assert.ok(n.displacement[2]>=0);});r.balance.forEach(v=>close(v,0));
 assert.equal(solveLinearStructure(g.nodes,[],g.shells,{...f,maxIterations:1}).status,"nonconverged");
});
test("warped shells, missing soil IDs, nonfinite data fail closed",()=>{
 const g=grid(1,.1,false);g.nodes[3].position=[1,1,.1];assert.equal(solveLinearStructure(g.nodes,[],g.shells,null).status,"invalid_input");
 assert.equal(solveLinearStructure(g.nodes,[],g.shells,{shellIds:["missing"],ks:1,compressionSign:-1,mode:"bilateral",maxIterations:1}).status,"invalid_input");
 g.shells[0].E=NaN;assert.equal(solveLinearStructure(g.nodes,[],g.shells,null).status,"invalid_input");
});
test("free interior membrane and drilling DOFs reproduce affine displacement patch",()=>{
 const g=grid(4,.1,false);
 for(const node of g.nodes){const [x,y]=node.position,boundary=x===0||x===1||y===0||y===1;
  node.prescribed=[boundary?.001*x+.002*y:null,boundary?-.001*x+.003*y:null,0,0,0,boundary?-.0015:null];
 }
 const r=solved(solveLinearStructure(g.nodes,[],g.shells.map(s=>({...s,pressure:0})),null));
 r.nodes.forEach((node,i)=>{const[x,y]=g.nodes[i].position;close(node.displacement[0],.001*x+.002*y);close(node.displacement[1],-.001*x+.003*y);close(node.displacement[5],-.0015);});r.balance.forEach(v=>close(v,0));
});
test("vertical wall with opening equilibrates through actual shell connectivity",()=>{
 const g=grid(4,.1,false,true);
 for(const node of g.nodes){const[x,y]=node.position;node.position=[x,0,y];node.prescribed=y===0?[0,0,0,0,0,0]:[null,0,null,0,null,0];if(y===1)node.load=[0,0,-1,0,0,0];}
 const r=solved(solveLinearStructure(g.nodes,[],g.shells.map(s=>({...s,pressure:0})),null));r.balance.forEach(v=>close(v,0));assert.ok(r.nodes.filter(n=>n.id.endsWith(",4")).every(n=>n.displacement[2]<0));
});
test("frame and raft share DOFs; flexible foundation adds settlement to axial compliance",()=>{
 const g=grid(2,.2,false);g.shells.forEach(s=>{s.pressure=0;});
 g.nodes.push({id:"top",position:[.5,.5,3],load:[0,0,-1,0,0,0],prescribed:[0,0,null,0,0,0],springs:[0,0,0,0,0,0]});
 const e:FrameElement={id:"column",nodes:["1,1","top"],offsets:[[0,0,0],[0,0,0]],up:[1,0,0],rollRad:0,E:3e7,G:1.25e7,section:{area:.16,Iy:.002,Iz:.002,J:.003,shearAreaY:.13,shearAreaZ:.13},modifiers:{axial:1,bendingY:1,bendingZ:1,torsion:1,shearY:1,shearZ:1},theory:"timoshenko",releases:Array(12).fill(false),uniformLocal:[0,0,0]};
 const r=solved(solveLinearStructure(g.nodes,[e],g.shells,{shellIds:g.shells.map(s=>s.id),ks:10000,compressionSign:-1,mode:"compression_only",maxIterations:30}));
 const top=r.nodes.find(n=>n.id==="top")!,base=r.nodes.find(n=>n.id==="1,1")!;close(top.displacement[2]-base.displacement[2],-3/(e.E*e.section.area));assert.ok(base.displacement[2]<0);assert.equal(top.tributaryArea,0);r.balance.forEach(v=>close(v,0));
 const fixed=structuredClone(g.nodes.filter(n=>n.id==="top"||n.id==="1,1"));fixed.find(n=>n.id==="1,1")!.prescribed=[0,0,0,0,0,0];
 const f=solved(solveLinearStructure(fixed,[e],[],null));assert.ok(Math.abs(top.displacement[2])>Math.abs(f.nodes.find(n=>n.id==="top")!.displacement[2]));
});
test("shell membrane, bending and shear modifiers act exactly once on their strain modes",()=>{
 const g=grid(1,.1,false),e=g.shells[0],positions=e.nodes.map(id=>g.nodes.find(n=>n.id===id)!.position);
 for(const mode of ["membrane","bending","shear"] as const){
  const u=new Float64Array(24);positions.forEach(([x],i)=>{
   if(mode==="membrane")u[6*i]=.01*x;
   if(mode==="bending"){u[6*i+2]=.01*x*x/2;u[6*i+4]=-.01*x;}
   if(mode==="shear")u[6*i+2]=.01*x;
  });
  const energy=(mod:number)=>{const k=compileShellRect({...e,modifiers:{...e.modifiers,[mode]:mod}},positions as never).local;let v=0;for(let i=0;i<24;i++)for(let j=0;j<24;j++)v+=u[i]*k[24*i+j]*u[j]/2;return v;};
  close(energy(.4),.4*energy(1));
 }
});
test("opening wall mesh refinement converges under a mesh-independent unit edge load",()=>{
 const compliance:number[]=[];
 for(const n of [8,16,32,64]){
  const g=grid(n,.1,false,true);
  for(const node of g.nodes){const[x,y]=node.position;node.position=[x,0,y];node.prescribed=y===0?[0,0,0,0,0,0]:[null,0,null,0,null,0];if(y===1)node.load=[(x===0||x===1?.5:1)/n,0,0,0,0,0];}
  const r=solved(solveLinearStructure(g.nodes,[],g.shells.map(s=>({...s,pressure:0})),null));r.balance.forEach(v=>close(v,0));
  compliance.push(r.nodes.reduce((sum,node,i)=>sum+node.displacement[0]*g.nodes[i].load[0],0));
 }
 const changes=compliance.slice(1).map((v,i)=>Math.abs((v-compliance[i])/v));assert.ok(changes[2]<.03,JSON.stringify({compliance,changes}));assert.ok(changes[2]<changes[1]&&changes[1]<changes[0],JSON.stringify({compliance,changes}));
});
