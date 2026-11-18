import {type UpperEntry} from "./sparse-spd";
import {compileFrameElement,type FrameElement,type FrameNode,type V3} from "./frame-element";
import {compileShellRect,type ShellRect} from "./shell-rect";
export type Foundation={shellIds:readonly string[];ks:number;compressionSign:1|-1;mode:"bilateral"|"compression_only";maxIterations:number};
/** Shared static/dynamic stiffness assembly; no fabricated material/mass/default support. */
export function assembleStructuralSystem(nodes:FrameNode[],frames:FrameElement[],shells:ShellRect[],foundation:Foundation|null){
  if(!nodes.length||new Set(nodes.map(n=>n.id)).size!==nodes.length||new Set([...frames,...shells].map(e=>e.id)).size!==frames.length+shells.length)throw new Error("Empty/duplicate structure identities.");
  for(const n of nodes)if(!n.id||n.position.length!==3||n.load.length!==6||n.prescribed.length!==6||n.springs.length!==6||[...n.position,...n.load,...n.springs,...n.prescribed.filter(v=>v!==null)].some(v=>!Number.isFinite(v))||n.springs.some(v=>v<0))throw new Error("Invalid node/constraint/spring.");
  if(foundation&&(!Number.isFinite(foundation.ks)||foundation.ks<=0||![1,-1].includes(foundation.compressionSign)||!["bilateral","compression_only"].includes(foundation.mode)||!Number.isSafeInteger(foundation.maxIterations)||foundation.maxIterations<1))throw new Error("Invalid foundation options.");
  const soilShells=new Set(foundation?.shellIds??[]);
  if(foundation&&(!soilShells.size||soilShells.size!==foundation.shellIds.length||[...soilShells].some(id=>!shells.some(e=>e.id===id))))throw new Error("Foundation requires unique, existing raft shell IDs.");
  const index=new Map(nodes.map((n,i)=>[n.id,i])),N=nodes.length*6,F=Float64Array.from(nodes.flatMap(n=>[...n.load])),base:UpperEntry[]=[],areas=new Float64Array(nodes.length);
  const add=(dofs:number[],k:Float64Array,f:Float64Array)=>{for(let i=0;i<dofs.length;i++){F[dofs[i]]+=f[i];for(let j=i;j<dofs.length;j++)if(k[i*dofs.length+j]!==0)base.push([Math.min(dofs[i],dofs[j]),Math.max(dofs[i],dofs[j]),k[i*dofs.length+j]]);}};
  const data=frames.map(e=>{
   const ids=e.nodes.map(id=>index.get(id));if(ids.some(i=>i===undefined)||ids[0]===ids[1])throw new Error("Invalid frame node reference.");
   const compiled=compileFrameElement(e,ids.map(i=>nodes[i!].position) as unknown as readonly[V3,V3]),dofs=ids.flatMap(i=>Array.from({length:6},(_,d)=>i!*6+d));add(dofs,compiled.kg,compiled.fg);return {...compiled,dofs};
  });
  const shellData=shells.map(e=>{
   const ids=e.nodes.map(id=>index.get(id));if(ids.some(i=>i===undefined)||new Set(ids).size!==4)throw new Error("Invalid shell node reference.");
   const compiled=compileShellRect(e,ids.map(i=>nodes[i!].position) as unknown as readonly[V3,V3,V3,V3]),dofs=ids.flatMap(i=>Array.from({length:6},(_,d)=>i!*6+d));
   add(dofs,compiled.kg,compiled.fg);
   if(soilShells.has(e.id)){
    if(Math.abs(Math.abs(compiled.R[2][2])-1)>1e-10)throw new Error("Foundation shells must be horizontal.");
    ids.forEach(i=>{areas[i!]+=compiled.area/4;});
   }
   return {id:e.id,area:compiled.area,metadata:compiled.metadata};
  });
  nodes.forEach((n,i)=>n.springs.forEach((v,d)=>{if(v)base.push([6*i+d,6*i+d,v]);}));
  return {N,F,base,areas,data,shellData};
}
