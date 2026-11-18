import type {ModalStructureInput} from "./modal-structure";
import type {WallGroup} from "./global-demand";
import type {RcSystem} from "./system-selection";
import {positive} from "./global-control-types";
import {prepareModalStructure} from "./modal-structure";
import {solveSparseSpd,type SparseOptions} from "./sparse-spd";
export function rayleighEquivalentPeriod(input:ModalStructureInput,baseM:number,direction:"X"|"Y",options:SparseOptions={}){
 if(!Number.isFinite(baseM))throw Error("Finite building base required.");const system=prepareModalStructure(input),component=direction==="X"?0:1,fullLoad=new Float64Array(system.N);
 input.nodes.forEach((node,i)=>{fullLoad[6*i+component]=system.massFull[6*i+component]*Math.max(0,node.position[2]-baseM);});
 const sum=positive(fullLoad.reduce((s,v)=>s+v,0),"fictitious force sum");for(let i=0;i<fullLoad.length;i++)fullLoad[i]*=100/sum;
 const load=new Float64Array(system.K.n);system.transform.forEach((row,i)=>row.forEach(t=>{load[t.column]+=t.factor*fullLoad[i];}));
 const solved=solveSparseSpd(system.K,load,options);if(solved.status!=="solved")throw Error(`Rayleigh static solution failed: ${solved.status}`);
 const numerator=system.mass.reduce((s,m,i)=>s+(system.basis[i].component===component?m*solved.x[i]**2:0),0),denominator=load.reduce((s,f,i)=>s+f*solved.x[i],0),periodSeconds=2*Math.PI*Math.sqrt(positive(numerator,"Rayleigh modal mass sum")/positive(denominator,"Rayleigh work"));
 return {periodSeconds,numerator,denominator,staticResidual:solved.relativeResidual,method:"TBDY4.26 explicit nodal/rigid-master directional translations",forceNormalization:100,rawEigenPeriodsModified:false};
}
/** Eq4.28 rectangular, contiguous, collinear wall-base section profile only. */
export function empiricalCoefficient(input:ModalStructureInput,groups:WallGroup[],code:RcSystem,heightM:number,direction:"X"|"Y"){
 positive(heightM,"HN");if(code==="A11")return {Ct:.1,equivalentWallArea:null,clause:"4.27"};
 if(!["A12","A13","A32"].includes(code))return {Ct:.07,equivalentWallArea:null,clause:"4.27"};
 const components=groups.filter(g=>g.role==="lateral_wall").flatMap(g=>{
  if(g.kind==="solid")return [g];if(!g.coupledPair)throw Error("Actual coupled-pier partition required for Eq4.28.");
  const keys=(cuts:WallGroup["cuts"])=>cuts.flatMap(c=>c.nodeIds.map(n=>`${c.shellId}:${n}`)),all=keys(g.cuts),parts=keys([...g.coupledPair.left,...g.coupledPair.right]);
  if(all.length!==parts.length||new Set(parts).size!==parts.length||all.some(k=>!parts.includes(k)))throw Error("Coupled Ct sections must exactly partition physical wall base cuts.");
  return (["left","right"] as const).map(side=>({...g,id:`${g.id}:${side}`,kind:"solid" as const,cuts:g.coupledPair![side],coupledPair:null}));
 });
 const axis=direction==="X"?0:1,other=1-axis,sections=components.map(g=>{
  if(!g.cuts.length)throw Error("Eq4.28 requires explicit verified section geometry.");
  const segments=g.cuts.map(c=>{const shell=input.shells.find(s=>s.id===c.shellId);if(!shell||c.nodeIds.length!==2)throw Error("Two-node rectangular wall-base cut required.");
   const p=c.nodeIds.map(id=>input.nodes.find(n=>n.id===id)?.position);if(p.some(v=>!v)||Math.abs(p[0]![other]-p[1]![other])>1e-8||Math.abs(p[0]![2]-p[1]![2])>1e-8)throw Error("Only axis-parallel contiguous rectangular wall section accepted for automated Ct.");
   return {start:Math.min(p[0]![axis],p[1]![axis]),end:Math.max(p[0]![axis],p[1]![axis]),line:p[0]![other],t:positive(shell.thickness,"wall thickness")};}).sort((a,b)=>a.start-b.start);
  for(let i=1;i<segments.length;i++)if(Math.abs(segments[i].start-segments[i-1].end)>1e-8||Math.abs(segments[i].line-segments[0].line)>1e-8||Math.abs(segments[i].t-segments[0].t)>1e-8)throw Error("Discontinuous/overlapping/variable wall section needs a verified explicit section integral.");
  const length=positive(segments.at(-1)!.end-segments[0].start,"wall length"),area=length*segments[0].t;return {id:g.id,length,area};
 });
 if(!sections.length)throw Error("Wall-only system needs actual sections for Eq4.28.");
 const totalArea=sections.reduce((s,w)=>s+w.area,0),equivalentWallArea=Math.min(totalArea,sections.reduce((s,w)=>s+w.area*(.2+w.length/heightM)**2,0));
 return {Ct:Math.min(.07,.1/Math.sqrt(positive(equivalentWallArea,"equivalent wall area"))),equivalentWallArea,sections,clause:"4.28a/b"};
}
