import {assembleSymmetric,type SparseMatrix,type UpperEntry} from "./sparse-spd";
import type {FrameNode,V3} from "./frame-element";
export type RigidDiaphragm={id:string;nodeIds:readonly string[];centerXY:readonly[number,number];decisionSource:string;
 accidental:null|{direction:"X"|"Y";perpendicularDimensionM:number;sign:1|-1}};
export type BasisDof={nodeId:string;component:number;position:V3};
/** Exact rigid in-plane constraint, diagonal mass admitted only at the actual mass centre. */
export function reduceDiaphragms(nodes:FrameNode[],fullK:SparseMatrix,sourceMass:number[],diaphragms:readonly RigidDiaphragm[]){
 const nodeIndex=new Map(nodes.map((n,i)=>[n.id,i])),owner=new Map<number,RigidDiaphragm>(),massFull=[...sourceMass],basis:BasisDof[]=[],columns=new Map<string,number>(),transform:{column:number;factor:number}[][]=Array.from({length:fullK.n},()=>[]);
 const col=(key:string,dof:BasisDof)=>{let i=columns.get(key);if(i===undefined){i=basis.length;columns.set(key,i);basis.push(dof);}return i;};
 if(new Set(diaphragms.map(d=>d.id)).size!==diaphragms.length)throw Error("Duplicate diaphragm IDs.");
 for(const diaphragm of diaphragms){
  if(!diaphragm.id||!diaphragm.nodeIds.length||new Set(diaphragm.nodeIds).size!==diaphragm.nodeIds.length||!diaphragm.decisionSource.trim()||diaphragm.centerXY.length!==2||diaphragm.centerXY.some(v=>!Number.isFinite(v)))throw Error("Invalid explicit diaphragm definition.");
  const ids=diaphragm.nodeIds.map(id=>nodeIndex.get(id));if(ids.some(i=>i===undefined))throw Error("Unknown diaphragm node.");let total=0,mx=0,my=0;const z=nodes[ids[0]!].position[2];
  for(const index of ids){const i=index!,n=nodes[i],m=sourceMass[6*i];
   if(owner.has(i)||Math.abs(n.position[2]-z)>1e-8||[0,1,5].some(d=>n.prescribed[d]!==null)||Math.abs(m-sourceMass[6*i+1])>1e-10*Math.max(1,m))throw Error("Overlapping/nonhorizontal/restrained diaphragm or unequal translational masses.");
   owner.set(i,diaphragm);total+=m;mx+=m*(n.position[0]-diaphragm.centerXY[0]);my+=m*(n.position[1]-diaphragm.centerXY[1]);
  }
  if(total>0&&(Math.abs(mx)>1e-8*total||Math.abs(my)>1e-8*total))throw Error("Rigid diaphragm centre must equal its actual mass centre; no off-diagonal mass silently dropped.");
  if(diaphragm.accidental){const a=diaphragm.accidental;
   if(!["X","Y"].includes(a.direction)||![1,-1].includes(a.sign)||!Number.isFinite(a.perpendicularDimensionM)||a.perpendicularDimensionM<=0)throw Error("Invalid accidental eccentricity geometry.");
   const e=.05*a.perpendicularDimensionM;ids.forEach(i=>{massFull[6*i!+5]+=sourceMass[6*i!]*e*e;});
  }
 }
 nodes.forEach((node,i)=>node.prescribed.forEach((fixed,d)=>{
  if(fixed!==null)return;const diaphragm=owner.get(i);
  if(diaphragm&&[0,1,5].includes(d)){
   const p:[number,number,number]=[...diaphragm.centerXY,node.position[2]],master=(component:number)=>col(`D:${diaphragm.id}:${component}`,{nodeId:`diaphragm:${diaphragm.id}`,component,position:p});
   if(d===0)transform[6*i+d]=[{column:master(0),factor:1},{column:master(5),factor:-(node.position[1]-p[1])}];
   if(d===1)transform[6*i+d]=[{column:master(1),factor:1},{column:master(5),factor:node.position[0]-p[0]}];
   if(d===5)transform[6*i+d]=[{column:master(5),factor:1}];
  }else transform[6*i+d]=[{column:col(`N:${node.id}:${d}`,{nodeId:node.id,component:d,position:node.position}),factor:1}];
 }));
 if(!basis.length)throw Error("No free modal DOFs.");
 const entries:UpperEntry[]=[],mass=new Array<number>(basis.length).fill(0),massCross=new Map<string,{i:number;j:number;value:number}>();
 for(let i=0;i<fullK.n;i++){
  for(const a of transform[i])mass[a.column]+=massFull[i]*a.factor*a.factor;
  for(let a=0;a<transform[i].length;a++)for(let b=a+1;b<transform[i].length;b++){
   const i1=Math.min(transform[i][a].column,transform[i][b].column),j1=Math.max(transform[i][a].column,transform[i][b].column),key=`${i1}:${j1}`,value=massFull[i]*transform[i][a].factor*transform[i][b].factor;
   massCross.set(key,{i:i1,j:j1,value:(massCross.get(key)?.value??0)+value});
  }
  for(const[j,k]of fullK.rows[i])for(const a of transform[i])for(const b of transform[j])if(a.column<=b.column&&a.factor*b.factor*k!==0)entries.push([a.column,b.column,a.factor*b.factor*k]);
 }
 if([...massCross.values()].some(c=>Math.abs(c.value)>1e-10*Math.max(1,Math.sqrt(mass[c.i]*mass[c.j]))))throw Error("Non-diagonal reduced mass not supported by this profile.");
 const K=assembleSymmetric(basis.length,entries),expand=(shape:readonly number[])=>transform.map(row=>row.reduce((s,t)=>s+t.factor*shape[t.column],0));
 return {K,mass,massFull,basis,transform,expand,diaphragmMetadata:diaphragms.map(d=>({id:d.id,decisionSource:d.decisionSource,accidental:d.accidental,method:d.accidental?"TBDY2018-4.5.10.2d-add-mi-e2":"explicit-rigid-constraint",signsHaveEqualInertiaApproximation:!!d.accidental}))};
}
