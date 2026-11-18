import {assembleSymmetric,solveSparseSpd,type UpperEntry} from "./sparse-spd";
import {mv,type FrameElement,type FrameNode} from "./frame-element";
import {type ShellRect} from "./shell-rect";
import {assembleStructuralSystem,type Foundation} from "./structural-system";
export type {Foundation} from "./structural-system";
/** Shared 6DOF frame/shell assembly; soil stiffness is tributary-area scaled. */
export function solveLinearStructure(nodes:FrameNode[],frames:FrameElement[],shells:ShellRect[],foundation:Foundation|null,options:Parameters<typeof solveSparseSpd>[2]={}) {
 try{
  const {N,F,base,areas,data,shellData}=assembleStructuralSystem(nodes,frames,shells,foundation);
  const free:number[]=[],freeIndex=new Map<number,number>();nodes.forEach((n,i)=>n.prescribed.forEach((v,d)=>{if(v===null){freeIndex.set(i*6+d,free.length);free.push(i*6+d);}}));
  let active=Array.from(areas,a=>a>0),u=new Float64Array(N),numerical:null|ReturnType<typeof solveSparseSpd>=null,finalK:ReturnType<typeof assembleSymmetric>|null=null,contactIterations=0;
  const visited=new Set<string>(),limit=foundation?.mode==="compression_only"?foundation.maxIterations:1;
  for(let iteration=0;iteration<limit;iteration++){
   const signature=active.map(v=>v?"1":"0").join("");if(visited.has(signature))return {status:"nonconverged" as const,reason:"Contact active set cycled.",analysisApproved:false};visited.add(signature);
   const entries=[...base];if(foundation)active.forEach((a,i)=>{if(a)entries.push([6*i+2,6*i+2,foundation.ks*areas[i]]);});
   const K=assembleSymmetric(N,entries);u=new Float64Array(N);nodes.forEach((n,i)=>n.prescribed.forEach((v,d)=>{if(v!==null)u[6*i+d]=v;}));
   if(free.length){
    const reduced:UpperEntry[]=[],rhs=Float64Array.from(free,i=>F[i]);free.forEach((i,ri)=>{for(const[j,k]of K.rows[i]){const cj=freeIndex.get(j);if(cj===undefined)rhs[ri]-=k*u[j];else if(cj>=ri)reduced.push([ri,cj,k]);}});
    numerical=solveSparseSpd(assembleSymmetric(free.length,reduced),rhs,options);if(numerical.status!=="solved")return {status:"solver_error" as const,diagnostic:numerical,analysisApproved:false};
    const solution=numerical.x;free.forEach((i,j)=>{u[i]=solution[j];});
   }
   contactIterations=iteration+1;finalK=K;
   if(!foundation||foundation.mode==="bilateral")break;
   const next=active.map((_a,i)=>areas[i]>0&&foundation.compressionSign*u[6*i+2]>=0);
   if(next.every((a,i)=>a===active[i]))break;
   if(iteration===limit-1)return {status:"nonconverged" as const,reason:"Contact iteration budget exhausted.",analysisApproved:false};active=next;
  }
  const K=finalK!;
  const results=nodes.map((n,i)=>{
   const fixed=new Float64Array(6),spring=Float64Array.from(n.springs,(k,d)=>-k*u[i*6+d]);
   const soil=foundation&&active[i]?-foundation.ks*areas[i]*u[i*6+2]:0;
   for(let d=0;d<6;d++)if(n.prescribed[d]!==null){let value=-F[i*6+d];for(const[j,k]of K.rows[i*6+d])value+=k*u[j];fixed[d]=value;}
   return {id:n.id,displacement:[...u.slice(i*6,i*6+6)],fixedReaction:[...fixed],springReaction:[...spring],soilReactionZ:soil,tributaryArea:areas[i],contactActive:foundation?active[i]:null,soilPressure:foundation&&active[i]?foundation.ks*foundation.compressionSign*u[i*6+2]:null};
  });
  const memberForces=data.map(d=>{const local=d.condensed.recover(mv(d.t,Float64Array.from(d.dofs,i=>u[i]),12)),force=mv(d.k,local,12);for(let i=0;i<12;i++)force[i]-=d.f[i];return {id:d.e.id,localDisplacement:[...local],localEndForce:[...force]};});
  if(results.some(n=>[...n.displacement,...n.fixedReaction,...n.springReaction,n.soilReactionZ].some(v=>!Number.isFinite(v)))||memberForces.some(e=>e.localEndForce.some(v=>!Number.isFinite(v))))throw new Error("Nonfinite structural result.");
  const balance=new Float64Array(6),balanceScale=new Float64Array(6),origin=nodes[0].position;
  results.forEach((n,i)=>{
   const f=n.fixedReaction.map((v,d)=>v+n.springReaction[d]+F[i*6+d]+(d===2?n.soilReactionZ:0)),r=nodes[i].position.map((v,d)=>v-origin[d]);
   for(let d=0;d<3;d++){balance[d]+=f[d];balanceScale[d]+=Math.abs(F[i*6+d])+Math.abs(n.fixedReaction[d])+Math.abs(n.springReaction[d])+(d===2?Math.abs(n.soilReactionZ):0);}
   const moment=[f[3]+r[1]*f[2]-r[2]*f[1],f[4]+r[2]*f[0]-r[0]*f[2],f[5]+r[0]*f[1]-r[1]*f[0]];
   for(let d=0;d<3;d++){balance[3+d]+=moment[d];balanceScale[3+d]+=Math.abs(F[i*6+3+d])+Math.abs(n.fixedReaction[3+d])+Math.abs(n.springReaction[3+d])+Math.hypot(...r)*(Math.abs(F[i*6])+Math.abs(F[i*6+1])+Math.abs(F[i*6+2])+Math.abs(n.soilReactionZ)+n.fixedReaction.slice(0,3).reduce((s,v)=>s+Math.abs(v),0)+n.springReaction.slice(0,3).reduce((s,v)=>s+Math.abs(v),0));}
  });
  const equilibriumTolerance=Array.from(balanceScale,s=>1e-8+1e-8*s);
  if(balance.some((v,i)=>!Number.isFinite(v)||Math.abs(v)>equilibriumTolerance[i]))return {status:"equilibrium_failed" as const,balance:[...balance],equilibriumTolerance,analysisApproved:false};
  return {status:"solved" as const,nodes:results,memberForces,shells:shellData,numerical,balance:[...balance],analysisApproved:false,
   metadata:{version:"linear-structure-v1",units:"kN,m,rad; E/G kN/m2; I/J m4; ks kN/m3",freeDofs:free.length,totalDofs:N,nonzeros:K.nonzeros,pDelta:false,geometricNonlinearity:false,contactIterations,contactMode:foundation?.mode??null,equilibriumTolerance,
    tolerances:{scaledPivot:options.pivotTolerance??1e-12,relativeResidual:options.relativeTolerance??1e-8,absoluteResidual:options.absoluteTolerance??1e-10},factorEntryBudget:options.maxFactorEntries??2000000,
    scope:"linear prismatic frames and flat rectangular shells; explicit modifiers/stabilization only"}};
 }catch(error){return {status:"invalid_input" as const,reason:String(error),analysisApproved:false};}
}
