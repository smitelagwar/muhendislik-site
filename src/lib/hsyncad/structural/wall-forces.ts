import {mv,type FrameNode,type V3} from "./frame-element";
import {compileShellRect,type ShellRect} from "./shell-rect";
import {prepareModalStructure,type ModalStructureInput} from "./modal-structure";
import {solveSparseSpd,multiply} from "./sparse-spd";
import {validateBeamCase,type BeamCase} from "./beam-forces";
import type {solveLinearStructure} from "./linear-structure";
export type WallResultant={Nkn:number;M2knm:number;M3knm:number;Vukn:number;Vvkn:number;Tknm:number};
export type WallForceSample={zMm:number;side:"below"|"above";force:WallResultant;gravity:WallResultant|null;earthquake:WallResultant|null};
export type WallForceCase={id:string;modelRevision:string;stiffnessSet:string;analysisStamp:string;source:string;kind:"deterministic";samples:WallForceSample[]};
export const wallForceKeys=["Nkn","M2knm","M3knm","Vukn","Vvkn","Tknm"] as const;
export function validateWallForce(c:WallForceCase){
 if(c.kind!=="deterministic"||!c.id||!c.modelRevision||!c.stiffnessSet||!c.analysisStamp||!c.source?.trim()||!c.samples.length||c.samples.length>100||new Set(c.samples.map(s=>`${s.zMm}:${s.side}`)).size!==c.samples.length)throw Error("Gerçek imzalı deterministik perde kuvveti/kesit örnekleri gerekli; CQC maksimumu fiziksel N-M-V takımı değildir.");
 for(const s of c.samples){if(!Number.isFinite(s.zMm)||!["below","above"].includes(s.side)||wallForceKeys.some(k=>!Number.isFinite(s.force[k])))throw Error("Perde kesit kuvveti sonlu ve kesit tarafı açık olmalı.");
  if((s.gravity===null)!==(s.earthquake===null))throw Error("Düşey/deprem ayrışımı birlikte sağlanmalı.");
  if(s.gravity&&s.earthquake&&wallForceKeys.some(k=>!Number.isFinite(s.gravity![k])||!Number.isFinite(s.earthquake![k])||Math.abs(s.force[k]-s.gravity![k]-s.earthquake![k])>1e-7+1e-7*Math.abs(s.force[k])))throw Error("Gerçek G+E bileşenleri imzalı ULS ile uyuşmuyor.");
 }
}
/** P06 çözümünden kg*u-fg; ortak kesitte moment kolları toplanmadan mutlak değer alınmaz. */
export function wallCutFromLinear(nodes:FrameNode[],shells:ShellRect[],solved:ReturnType<typeof solveLinearStructure>|ReturnType<typeof solveWallStatic>,cuts:{shellId:string;nodeIds:string[]}[],origin:V3,angleRad:number,side:"bottom"|"top",expectedModel?:ModalStructureInput){
 if(solved.status!=="solved"||!cuts.length||!origin.every(Number.isFinite)||!Number.isFinite(angleRad)||!["bottom","top"].includes(side))throw Error("Başarılı gerçek lineer çözüm/kesit düzlemi gerekli.");
 if("modelIdentity" in solved&&(!expectedModel||solved.modelIdentity!==JSON.stringify(expectedModel)||JSON.stringify(nodes)!==JSON.stringify(expectedModel.nodes)||JSON.stringify(shells)!==JSON.stringify(expectedModel.shells)))throw Error("Eski/değişmiş modelin statik perde kesit kuvvetleri kullanılamaz.");
 const used=new Set<string>(),sum=[0,0,0,0,0,0],sgn=side==="bottom"?1:-1;
 let area=0;
 for(const cut of cuts){const shell=shells.find(s=>s.id===cut.shellId);if(!shell||used.has(shell.id))throw Error("Perde kuvvet kesitinde eksik/tekrar shell.");used.add(shell.id);
  const ns=shell.nodes.map(id=>nodes.find(n=>n.id===id));if(ns.some(n=>!n))throw Error("Shell düğümü kayıp.");const points=ns.map(n=>n!.position) as [V3,V3,V3,V3],z=points.map(p=>p[2]),level=side==="bottom"?Math.min(...z):Math.max(...z),edge=shell.nodes.filter((_id,i)=>Math.abs(points[i][2]-level)<1e-8);
  if(edge.length!==2||Math.abs(level-origin[2])>1e-8||cut.nodeIds.length!==2||new Set(cut.nodeIds).size!==2||edge.some(id=>!cut.nodeIds.includes(id)))throw Error("Tam yatay alt/üst perde kenarı kesilmeli.");
  const compiled=compileShellRect(shell,points),displacement=Float64Array.from(shell.nodes.flatMap(id=>{const n=solved.nodes.find(n=>n.id===id);if(!n)throw Error("Güncel shell deplasmanı eksik.");return n.displacement;})),force=mv(compiled.kg,displacement,24);for(let i=0;i<24;i++)force[i]-=compiled.fg[i];
  const ends=edge.map(id=>points[shell.nodes.indexOf(id)]),dx=ends[1][0]-ends[0][0],dy=ends[1][1]-ends[0][1];if(Math.abs(-Math.sin(angleRad)*dx+Math.cos(angleRad)*dy)>1e-7)throw Error("Kuvvet kesiti doğrultusu fiziksel perdeyle uyuşmuyor.");area+=Math.hypot(dx,dy)*shell.thickness*1e6;
  for(const id of edge){const i=shell.nodes.indexOf(id),f=Array.from(force.slice(6*i,6*i+6)),r=points[i].map((v,k)=>v-origin[k]);sum[0]+=f[0];sum[1]+=f[1];sum[2]+=f[2];sum[3]+=f[3]+r[1]*f[2]-r[2]*f[1];sum[4]+=f[4]+r[2]*f[0]-r[0]*f[2];sum[5]+=f[5]+r[0]*f[1]-r[1]*f[0];}
 }
 const c=Math.cos(angleRad),s=Math.sin(angleRad),force:WallResultant={Nkn:sgn*sum[2],M2knm:-sgn*(c*sum[3]+s*sum[4]),M3knm:-sgn*(-s*sum[3]+c*sum[4]),Vukn:-sgn*(c*sum[0]+s*sum[1]),Vvkn:-sgn*(-s*sum[0]+c*sum[1]),Tknm:-sgn*sum[5]};
 return {force,zMm:origin[2]*1000,areaMm2:area,shellIds:[...used],origin,angleRad,side,source:"actual shared P06/P07 stiffness solve kg*u-fg, complete shell edges and signed moment arms",coincidentPhysicalTuple:true};
}
/** P07 ile aynı gerçek kısıt dönüşümü; yalnız açık nodal yük ve homojen mesnet profili. */
export function solveWallStatic(input:ModalStructureInput,loads:{nodeId:string;values:readonly[number,number,number,number,number,number]}[]){
 try{
  if(input.nodes.some(n=>n.prescribed.some(v=>v!==null&&v!==0)||n.load.some(v=>v!==0))||input.frames.some(f=>f.uniformLocal.some(v=>v!==0))||input.shells.some(s=>s.pressure!==0)||new Set(loads.map(l=>l.nodeId)).size!==loads.length||loads.some(l=>!input.nodes.some(n=>n.id===l.nodeId)||l.values.length!==6||l.values.some(v=>!Number.isFinite(v))))throw Error("Açık tekil nodal yükler/homojen mesnetler gerekli; mevcut/dağıtılmış yükler bu statik adaptörde sessizce atılmaz.");
  const modelIdentity=JSON.stringify(input);
  const system=prepareModalStructure(input),F=Float64Array.from(input.nodes.flatMap(n=>loads.find(l=>l.nodeId===n.id)?.values??[0,0,0,0,0,0])),reduced=new Float64Array(system.K.n);system.transform.forEach((row,i)=>row.forEach(t=>{reduced[t.column]+=t.factor*F[i];}));
  const numerical=solveSparseSpd(system.K,reduced);if(numerical.status!=="solved")return {status:"solver_error" as const,reason:JSON.stringify(numerical)};const u=system.expand(Array.from(numerical.x)),internal=multiply(system.fullK,u),nodes=input.nodes.map((n,i)=>({id:n.id,displacement:u.slice(6*i,6*i+6),constraintReaction:Array.from({length:6},(_,j)=>internal[6*i+j]-F[6*i+j])}));
  if(u.some(v=>!Number.isFinite(v))||JSON.stringify(input)!==modelIdentity)throw Error("Statik sonuç sonlu değil veya model değişti.");return {status:"solved" as const,nodes,numerical,loads,modelIdentity,source:"actual assembled K and exact diaphragm T^t K T solve",engineeringAcceptance:false};
 }catch(error){return {status:"invalid_input" as const,reason:String(error)};}
}
/** Gerçek bağ kabuklarının tam düşey yüzleri → dengeli yerel 12 bileşenli P09 kuvvet takımı. */
export function couplingCaseFromWallStatic(input:ModalStructureInput,state:ReturnType<typeof solveWallStatic>,shellIds:string[],leftNodeIds:string[],rightNodeIds:string[],snapshot:Pick<BeamCase,"id"|"modelRevision"|"stiffnessSet"|"analysisStamp">):BeamCase{
 if(state.status!=="solved"||!shellIds.length||new Set(shellIds).size!==shellIds.length||leftNodeIds.length<2||rightNodeIds.length<2||leftNodeIds.some(id=>rightNodeIds.includes(id)))throw Error("Gerçek statik bağ kabuğu ve iki tam yüz gerekli.");
 if(state.modelIdentity!==JSON.stringify(input))throw Error("Eski modelin bağ kabuğu kuvvetleri kullanılamaz.");
 const point=(ids:string[])=>{const p=ids.map(id=>input.nodes.find(n=>n.id===id)?.position);if(p.some(p=>!p))throw Error("Bağ yüzü düğümü kayıp.");return [0,1,2].map(i=>p.reduce((s,p)=>s+p![i],0)/p.length) as unknown as V3;},a=point(leftNodeIds),b=point(rightNodeIds),L=Math.hypot(b[0]-a[0],b[1]-a[1]),angle=Math.atan2(b[1]-a[1],b[0]-a[0]),c=Math.cos(angle),s=Math.sin(angle),left=[0,0,0,0,0,0],right=[0,0,0,0,0,0],usedLeft=new Set<string>(),usedRight=new Set<string>();if(L<=0||Math.abs(a[2]-b[2])>1e-8)throw Error("Gerçek yatay esnek açıklık gerekli.");
 for(const id of shellIds){const e=input.shells.find(s=>s.id===id);if(!e)throw Error("Bağ shell kayıp.");const ps=e.nodes.map(id=>input.nodes.find(n=>n.id===id)!.position) as [V3,V3,V3,V3],compiled=compileShellRect(e,ps),u=Float64Array.from(e.nodes.flatMap(id=>state.nodes.find(n=>n.id===id)!.displacement)),f=mv(compiled.kg,u,24);for(let i=0;i<24;i++)f[i]-=compiled.fg[i];
  e.nodes.forEach((id,i)=>{const isLeft=leftNodeIds.includes(id),isRight=rightNodeIds.includes(id);if(!isLeft&&!isRight){if(state.loads.some(l=>l.nodeId===id&&l.values.some(v=>v!==0)))throw Error("Bağ içindeki noktasal yük için genel kiriş adaptörü gerekli.");return;}const target=isLeft?left:right,origin=isLeft?a:b,r=ps[i].map((v,j)=>v-origin[j]);(isLeft?usedLeft:usedRight).add(id);for(let j=0;j<3;j++)target[j]+=f[6*i+j];target[3]+=f[6*i+3]+r[1]*f[6*i+2]-r[2]*f[6*i+1];target[4]+=f[6*i+4]+r[2]*f[6*i]-r[0]*f[6*i+2];target[5]+=f[6*i+5]+r[0]*f[6*i+1]-r[1]*f[6*i];});
 }
 if(usedLeft.size!==leftNodeIds.length||usedRight.size!==rightNodeIds.length)throw Error("Tam bağ yüzü kapsanmadı.");const local=(f:number[])=>[c*f[0]+s*f[1],f[2],s*f[0]-c*f[1],c*f[3]+s*f[4],f[5],s*f[3]-c*f[4]],result:BeamCase={...snapshot,lengthMm:L*1000,source:"actual shell-face resultants with exact moment arms, not CQC maxima",kind:"deterministic",endForces:[...local(left),...local(right)],uniformKnM:[0,0,0]};validateBeamCase(result);return result;
}
