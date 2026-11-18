import {compileShellRect,type ShellRect} from "./shell-rect";
import {assembleStructuralSystem,type Foundation} from "./structural-system";
import {assembleSymmetric,multiply} from "./sparse-spd";
import type {FrameElement,FrameNode,V3} from "./frame-element";
import type {solveLinearStructure} from "./linear-structure";

export type SlabShellResultant={shellId:string;panelId:string;loadCaseId:string;modelRevision:string;stiffnessSet:string;analysisStamp:string;source:string;localAxes:{x:V3;y:V3;normal:V3};edgeLengthsM:{x:number;y:number};resultants:{NxKnmPerM:number;NyKnmPerM:number;NxyKnmPerM:number;MxKnmPerM:number;MyKnmPerM:number;MxyKnmPerM:number};areaM2:number;recovery:"Q4-MITC4-Gauss-average"};
const signs=[[-1,-1],[1,-1],[1,1],[-1,1]];
function shape(xi:number,eta:number,a:number,b:number){return signs.map(([sx,sy])=>({N:(1+sx*xi)*(1+sy*eta)/4,dx:sx*(1+sy*eta)/(2*a),dy:sy*(1+sx*xi)/(2*b)}));}
function dot(a:V3,b:V3){return a.reduce((s,v,i)=>s+v*b[i],0);}
/** Recovers actual averaged Q4/MITC4 shell resultants from the current P06 static solution. */
export function recoverSlabShellResultants(input:{nodes:readonly FrameNode[];frames:readonly FrameElement[];shells:readonly (ShellRect&{panelId:string})[];foundation:Foundation|null;solved:ReturnType<typeof solveLinearStructure>;expectedShellIds:readonly string[];coverage:"complete"|"partial";modelRevision:string;stiffnessSet:string;analysisStamp:string;expectedCurrent:{modelRevision:string;stiffnessSet:string;analysisStamp:string};loadCaseId:string;source:string}){
 if(input.solved.status!=="solved"||input.foundation!==null||input.coverage!=="complete"||!input.loadCaseId||!input.source?.trim()||input.modelRevision!==input.expectedCurrent.modelRevision||input.stiffnessSet!==input.expectedCurrent.stiffnessSet||input.analysisStamp!==input.expectedCurrent.analysisStamp||!input.expectedShellIds.length||new Set(input.expectedShellIds).size!==input.expectedShellIds.length||input.shells.length!==input.expectedShellIds.length||new Set(input.shells.map(s=>s.id)).size!==input.shells.length||input.expectedShellIds.some(id=>!input.shells.some(s=>s.id===id)))throw Error("Complete current P06 panel-shell coverage and exact analysis identity are required.");
 if(input.solved.nodes.length!==input.nodes.length||input.solved.nodes.some(n=>!input.nodes.some(x=>x.id===n.id)))throw Error("Solved displacement registry does not match the current structural node registry.");
 const nodeMap=new Map(input.nodes.map(n=>[n.id,n])),stateMap=new Map(input.solved.nodes.map(n=>[n.id,n]));
 const system=assembleStructuralSystem([...input.nodes], [...input.frames], [...input.shells], null),K=assembleSymmetric(system.N,system.base),u=Float64Array.from(input.nodes.flatMap(n=>{const q=stateMap.get(n.id)?.displacement;if(!q||q.length!==6)throw Error(`Current solved displacement missing for ${n.id}.`);return q;})),internal=multiply(K,u);
 const residuals=input.nodes.flatMap((n,i)=>n.prescribed.map((fixed,d)=>fixed===null?{dof:i*6+d,value:internal[i*6+d]-system.F[i*6+d],scale:Math.max(1,Math.abs(internal[i*6+d]),Math.abs(system.F[i*6+d]))}:null).filter((v):v is {dof:number;value:number;scale:number}=>v!==null));
 if(residuals.some(r=>Math.abs(r.value)>1e-8+1e-7*r.scale))throw Error("Solved displacement does not equilibrate the current P06 frame/shell/load stiffness; stale or mismatched FE result.");
 for(let i=0;i<input.nodes.length;i++)for(let d=0;d<6;d++){const prescribed=input.nodes[i].prescribed[d];if(prescribed!==null&&Math.abs(u[6*i+d]-prescribed)>1e-10+1e-8*Math.abs(prescribed))throw Error("Solved displacement violates the current model's prescribed support value.");}
 const resultants=input.shells.map(shell=>{
  if(!shell.panelId)throw Error(`Shell ${shell.id} has no physical slab panel mapping.`);const ns=shell.nodes.map(id=>nodeMap.get(id));if(ns.some(n=>!n))throw Error(`Shell ${shell.id} references a missing structural node.`);
  const p=ns.map(n=>n!.position) as [V3,V3,V3,V3],compiled=compileShellRect(shell,p),x=compiled.R[0] as V3,y=compiled.R[1] as V3,normal=compiled.R[2] as V3,solutionShell=input.solved.shells?.find(s=>s.id===shell.id);
  if(!solutionShell||Math.abs(solutionShell.area-compiled.area)>1e-9+1e-8*compiled.area||JSON.stringify(solutionShell.metadata)!==JSON.stringify(compiled.metadata))throw Error(`Solved shell result metadata does not match current shell ${shell.id}.`);
  if(Math.abs(Math.abs(normal[2])-1)>1e-8)throw Error("Only horizontal slab shell resultants are supported by this adapter.");
  const dx=p[1].map((v,i)=>v-p[0][i]) as unknown as V3,dy=p[3].map((v,i)=>v-p[0][i]) as unknown as V3,a=Math.hypot(...dx),b=Math.hypot(...dy),local=new Float64Array(24);
  for(let n=0;n<4;n++){const displacement=stateMap.get(shell.nodes[n])?.displacement;if(!displacement||displacement.length!==6||displacement.some(v=>!Number.isFinite(v)))throw Error(`Shell ${shell.id} has a missing solved nodal displacement.`);const translation=displacement.slice(0,3) as unknown as V3,rotation=displacement.slice(3,6) as unknown as V3;for(let k=0;k<3;k++){local[6*n+k]=dot(k===0?x:k===1?y:normal,translation);local[6*n+3+k]=dot(k===0?x:k===1?y:normal,rotation);}}
  let Nx=0,Ny=0,Nxy=0,Mx=0,My=0,Mxy=0;
  for(const xi of [-1/Math.sqrt(3),1/Math.sqrt(3)])for(const eta of [-1/Math.sqrt(3),1/Math.sqrt(3)]){
   const sh=shape(xi,eta,a,b);let ex=0,ey=0,gxy=0,kx=0,ky=0,kxy=0;
   for(let i=0;i<4;i++){const n=sh[i],k=6*i;ex+=n.dx*local[k];ey+=n.dy*local[k+1];gxy+=n.dy*local[k]+n.dx*local[k+1];kx+=n.dx*local[k+4];ky-=n.dy*local[k+3];kxy+=n.dy*local[k+4]-n.dx*local[k+3];}
   const G=shell.E/(2*(1+shell.nu)),scaleM=shell.E*shell.thickness*shell.modifiers.membrane/(1-shell.nu**2),scaleB=shell.E*shell.thickness**3*shell.modifiers.bending/(12*(1-shell.nu**2));Nx+=scaleM*(ex+shell.nu*ey)/4;Ny+=scaleM*(ey+shell.nu*ex)/4;Nxy+=G*shell.thickness*shell.modifiers.membrane*gxy/4;Mx+=scaleB*(kx+shell.nu*ky)/4;My+=scaleB*(ky+shell.nu*kx)/4;Mxy+=scaleB*(1-shell.nu)*kxy/2/4;
  }
  return {shellId:shell.id,panelId:shell.panelId,loadCaseId:input.loadCaseId,modelRevision:input.modelRevision,stiffnessSet:input.stiffnessSet,analysisStamp:input.analysisStamp,source:input.source,localAxes:{x,y,normal},edgeLengthsM:{x:a,y:b},resultants:{NxKnmPerM:Nx,NyKnmPerM:Ny,NxyKnmPerM:Nxy,MxKnmPerM:Mx,MyKnmPerM:My,MxyKnmPerM:Mxy},areaM2:compiled.area,recovery:"Q4-MITC4-Gauss-average" as const};
 });
 if(resultants.some(s=>Object.values(s.resultants).some(v=>!Number.isFinite(v))))throw Error("Nonfinite recovered slab resultant.");
 return {status:"solved" as const,resultants,modelRevision:input.modelRevision,stiffnessSet:input.stiffnessSet,analysisStamp:input.analysisStamp,loadCaseId:input.loadCaseId,coverage:"complete" as const,engineeringAcceptance:false as const,source:"P06 actual Q4/MITC4 element displacement field; four-point Gauss average; no modal maxima"};
}
