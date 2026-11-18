import type {ModalStructureInput} from "./modal-structure";
import {responseSpectrum} from "./response-spectrum";
import {combineModalVectors} from "./modal-combination";
import {driftStatistics} from "./global-checks";
import {GRAVITY_MPS2} from "./design-spectrum";
import {fact,positive,type Fact} from "./global-control-types";
import type {V3} from "./frame-element";
import type {MomentDistribution} from "./system-selection";
export type RawSpectrum=Extract<ReturnType<typeof responseSpectrum>,{status:"solved"}>;
export type StoreyDemandDefinition={id:string;bottomM:number;topM:number;part:"upper"|"basement";pairs:readonly (readonly[string,string])[];coverage:Fact<"all_vertical_lines">;source:string};
export type WallCut={shellId:string;nodeIds:readonly string[]};
export type WallGroup={id:string;role:"lateral_wall"|"basement_perimeter";kind:"solid"|"coupled";cuts:WallCut[];origin:V3;edgeIds:string[];source:string;coupledPair:null|{left:WallCut[];right:WallCut[];spacingM:number}};
export type CouplingEvaluator=(input:ModalStructureInput,response:RawSpectrum,group:WallGroup,direction:"X"|"Y")=>{id:string;omega:number};
function amplitude(v:readonly number[],periods:number[]){return combineModalVectors(v.map(x=>[x]),periods,.05,"CQC").maxima[0];}
/** Relative displacement is combined per mode BEFORE maxima; absolute maxima are never subtracted. */
export function deriveStoreyDemands(input:ModalStructureInput,response:RawSpectrum,definitions:readonly StoreyDemandDefinition[],direction:"X"|"Y"){
 if(response.direction.id!==direction||response.metadata.purpose!=="raw_modal"||response.metadata.localEnvelopesScale!==1)throw Error("Raw, matching-direction modal response required.");
 const index=new Map(input.nodes.map((n,i)=>[n.id,i])),component=direction==="X"?0:1,periods=response.modes.map(m=>m.periodSeconds);
 if(!definitions.length||new Set(definitions.map(s=>s.id)).size!==definitions.length)throw Error("Explicit unique storey demand definitions required.");
 return definitions.map(s=>{
  if(!s.source.trim()||!Number.isFinite(s.bottomM)||!Number.isFinite(s.topM)||s.topM<=s.bottomM||!s.pairs.length||fact(s.coverage,"drift coverage")!=="all_vertical_lines"||!["upper","basement"].includes(s.part))throw Error("Invalid/incomplete storey demand coverage.");
  const pairs=s.pairs.map(([bottom,top])=>{const a=index.get(bottom),b=index.get(top);if(a===undefined||b===undefined)throw Error("Unknown drift-pair node.");const p=input.nodes[a].position,q=input.nodes[b].position;
   if(Math.abs(p[2]-s.bottomM)>1e-8||Math.abs(q[2]-s.topM)>1e-8||Math.hypot(p[0]-q[0],p[1]-q[1])>1e-8)throw Error("Drift pairs require validated matching vertical physical lines.");
   return {bottom,top,amplitudeM:amplitude(response.modes.map(m=>m.displacement[6*b+component]-m.displacement[6*a+component]),periods)};});
  const stats=driftStatistics(pairs.map(p=>p.amplitudeM)),above=input.nodes.flatMap((n,i)=>n.position[2]>s.bottomM+1e-8?[i]:[]),shearByMode=response.modes.map(m=>above.reduce((sum,i)=>sum+m.inertialLoad[6*i+component],0)),shearKn=amplitude(shearByMode,periods);
  const weightAboveKn=above.reduce((sum,i)=>{const m=input.inertias.find(m=>m.nodeId===input.nodes[i].id);if(!m)throw Error("Missing gravity-equivalent seismic mass.");return sum+m.values[component]*GRAVITY_MPS2;},0);
  const topNodes=[...new Set(pairs.map(p=>p.top))],averageFloorDisplacementM=topNodes.reduce((sum,id)=>sum+amplitude(response.modes.map(m=>m.displacement[6*index.get(id)!+component]),periods),0)/topNodes.length;
  return {...s,pairs,stats,heightM:s.topM-s.bottomM,shearKn,weightAboveKn,averageFloorDisplacementM,shearByMode,source:`${s.source}; raw modal ${direction}`};
 });
}
/** Cut resultants from signed shell nodal forces and moment arms, not independent absolute maxima. */
export function deriveWallDistribution(input:ModalStructureInput,response:RawSpectrum,groups:WallGroup[],edgeIds:Fact<string[]>,baseM:number,direction:"X"|"Y",couplingEvaluator?:CouplingEvaluator):MomentDistribution{
 if(response.metadata.purpose!=="raw_modal"||response.metadata.localEnvelopesScale!==1||response.direction.id!==direction||!Number.isFinite(baseM))throw Error("Unscaled matching modal packet/base required.");
 const edges=fact(edgeIds,"edge-axis set");if(edges.length<2||new Set(edges).size!==edges.length||edges.some(e=>!e))throw Error("Complete unique edge axes required.");
 const nodeIndex=new Map(input.nodes.map((n,i)=>[n.id,i])),axis=direction==="X"?1:0,periods=response.modes.map(m=>m.periodSeconds),used=new Set<string>();
 const checkCut=(cut:WallCut,register:boolean)=>{
  const shell=input.shells.find(s=>s.id===cut.shellId),result=response.shells.find(s=>s.id===cut.shellId);if(!shell||!result||cut.nodeIds.length<2||new Set(cut.nodeIds).size!==cut.nodeIds.length||cut.nodeIds.some(id=>!shell.nodes.includes(id)))throw Error("Incomplete/invalid wall section cut.");
  const physicalBase=shell.nodes.filter(id=>Math.abs(input.nodes[nodeIndex.get(id)!].position[2]-baseM)<1e-8);
  if(physicalBase.length!==2||physicalBase.some(id=>!cut.nodeIds.includes(id))||cut.nodeIds.length!==2)throw Error("Wall section requires the complete bottom edge of a vertical rectangular shell.");
  const locals=cut.nodeIds.map(id=>{const i=nodeIndex.get(id);if(i===undefined||Math.abs(input.nodes[i].position[2]-baseM)>1e-8)throw Error("Cut is not on the selected building base.");const key=`${cut.shellId}:${id}`;if(register&&used.has(key))throw Error("Wall cuts overlap or double-count force contributions.");if(register)used.add(key);return shell.nodes.indexOf(id);});
  return {shell,result,locals};
 };
 const resultant=(cuts:WallCut[],origin:V3,register:boolean)=>{
  if(!cuts.length)throw Error("Missing actual shell force cut.");const compiled=cuts.map(c=>checkCut(c,register));
  return response.modes.map((_mode,m)=>{
   let moment=0,axial=0;for(const c of compiled)for(const local of c.locals){const node=input.nodes[nodeIndex.get(c.shell.nodes[local])!],r=node.position.map((v,i)=>v-origin[i]),f=c.result.globalNodalForces.rawModalVectors[m].slice(6*local,6*local+6);
    moment+=axis===1?f[4]+r[2]*f[0]-r[0]*f[2]:f[3]+r[1]*f[2]-r[2]*f[1];axial+=f[2];}
   return {moment:-moment,axial:-axial};
  });
 };
 const lateral=groups.filter(g=>g.role==="lateral_wall");if(new Set(groups.map(g=>g.id)).size!==groups.length||groups.some(g=>!["lateral_wall","basement_perimeter"].includes(g.role)||!["solid","coupled"].includes(g.kind)))throw Error("Duplicate/unknown physical wall group roles.");
 const data=lateral.map(g=>{if(!g.id||!g.source.trim()||g.origin.some(v=>!Number.isFinite(v))||Math.abs(g.origin[2]-baseM)>1e-8||g.edgeIds.some(id=>!edges.includes(id)))throw Error("Invalid wall group/source/edge role.");return {g,result:resultant(g.cuts,g.origin,true)};});
 const total=response.modes.map(m=>input.nodes.reduce((sum,node,i)=>{if(node.position[2]<baseM-1e-8)return sum;const f=m.inertialLoad.slice(6*i,6*i+6),r=[node.position[0]-input.rotationOrigin[0],node.position[1]-input.rotationOrigin[1],node.position[2]-baseM];return sum+(axis===1?f[4]+r[2]*f[0]-r[0]*f[2]:f[3]+r[1]*f[2]-r[2]*f[1]);},0));
 const denominator=positive(amplitude(total,periods),"building overturning moment"),sum=response.modes.map((_m,i)=>data.reduce((s,d)=>s+d.result[i].moment,0));
 const coupling=data.filter(d=>d.g.kind==="coupled").map(d=>{
  if(!d.g.coupledPair)throw Error("Coupled wall requires actual pier axial-force cuts.");const pair=d.g.coupledPair,keys=(cuts:WallCut[])=>cuts.flatMap(c=>c.nodeIds.map(id=>`${c.shellId}:${id}`)),all=new Set(keys(d.g.cuts)),parts=keys([...pair.left,...pair.right]);
  if(parts.length!==all.size||new Set(parts).size!==parts.length||parts.some(k=>!all.has(k)))throw Error("Coupled pier cuts must exactly partition their physical wall group.");
  if(pair.left.some(a=>pair.right.some(b=>a.shellId===b.shellId)))throw Error("Coupled piers must be distinct physical shell sections.");
  const centroid=(cuts:WallCut[])=>{let area=0,weighted=0;for(const cut of cuts){const shell=input.shells.find(s=>s.id===cut.shellId)!;
   const a=input.nodes[nodeIndex.get(cut.nodeIds[0])!].position,b=input.nodes[nodeIndex.get(cut.nodeIds[1])!].position,weight=Math.hypot(b[0]-a[0],b[1]-a[1])*shell.thickness;
   const k=direction==="X"?0:1;area+=weight;weighted+=weight*(a[k]+b[k])/2;}return weighted/positive(area,"pier section area");};
  const c=positive(pair.spacingM,"pier centroid distance"),physicalSpacing=Math.abs(centroid(pair.left)-centroid(pair.right));
  if(Math.abs(c-physicalSpacing)>1e-8+1e-6*physicalSpacing)throw Error("Coupling lever arm disagrees with physical pier section centroids.");
  if(couplingEvaluator){const result=couplingEvaluator(input,response,d.g,direction);if(result.id!==d.g.id||!Number.isFinite(result.omega)||result.omega<0)throw Error("Actual coupling-beam integration returned an invalid group/ratio.");return result;}
  const left=resultant(pair.left,d.g.origin,false),right=resultant(pair.right,d.g.origin,false),couple=left.map((v,i)=>c*(v.axial-right[i].axial)/2),den=positive(amplitude(d.result.map(v=>v.moment),periods),"coupled-wall overturning");
  const imbalance=amplitude(left.map((v,i)=>v.axial+right[i].axial),periods),pairForce=amplitude(left.map((v,i)=>(v.axial-right[i].axial)/2),periods);
  if(imbalance>1e-8+1e-6*pairForce)throw Error("Coupling axial resultants are not equal/opposite; verified coupling-beam shear integration required.");
  return {id:d.g.id,omega:amplitude(couple,periods)/den};
 });
 return {wallShare:amplitude(sum,periods)/denominator,individual:data.map(d=>({id:d.g.id,share:amplitude(d.result.map(v=>v.moment),periods)/denominator})),edges:edges.map(id=>({id,share:amplitude(response.modes.map((_m,i)=>data.filter(d=>d.g.edgeIds.includes(id)).reduce((s,d)=>s+d.result[i].moment,0)),periods)/denominator})),coupling,source:`Signed modal cuts; base=${baseM}; direction=${direction}; whole Mo=${denominator}; ${lateral.map(g=>g.source).join(";")}`};
}
