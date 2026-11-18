import { compileShellRect } from "./shell-rect";
import type { FrameNode } from "./frame-element";
import type { ShellRect } from "./shell-rect";
import {beamCapacity,type BeamBar,type BeamMaterial} from "./rc-beam-section";

export type FoundationShellResultant = { shellId: string; nodeForces: readonly number[]; source: string };

/** Integrates signed vertical shell pressure over a clipped Q4 rectangle; down is positive in the returned force. */
export function integrateFoundationVerticalLoadInsideRect(input:{nodes:readonly FrameNode[];shells:readonly ShellRect[];foundationShellIds:readonly string[];
  rectangle:{x0:number;x1:number;y0:number;y1:number}}):{downwardKn:number;areaM2:number;source:string}{
  const ids=new Set(input.foundationShellIds),nodeById=new Map(input.nodes.map(n=>[n.id,n]));
  if(!ids.size||ids.size!==input.foundationShellIds.length||[...ids].some(id=>!input.shells.some(s=>s.id===id))
    ||![input.rectangle.x0,input.rectangle.x1,input.rectangle.y0,input.rectangle.y1].every(Number.isFinite)||input.rectangle.x1<=input.rectangle.x0||input.rectangle.y1<=input.rectangle.y0)
    throw new Error("Foundation pressure integration scope or bounds are invalid.");
  let load=0,area=0;
  for(const shell of input.shells.filter(s=>ids.has(s.id))){
    const pts=shell.nodes.map(id=>nodeById.get(id));if(pts.some(p=>!p))throw new Error(`Foundation load node missing in ${shell.id}.`);
    const p=pts.map(n=>n!.position),a=[p[1][0]-p[0][0],p[1][1]-p[0][1],p[1][2]-p[0][2]],b=[p[3][0]-p[0][0],p[3][1]-p[0][1],p[3][2]-p[0][2]],normalZ=a[0]*b[1]-a[1]*b[0];
    if(Math.abs(normalZ)<1e-12||new Set(p.map(v=>v[0])).size!==2||new Set(p.map(v=>v[1])).size!==2)throw new Error("Foundation pressure needs axis-aligned horizontal Q4 cells.");
    const x0=Math.min(...p.map(v=>v[0])),x1=Math.max(...p.map(v=>v[0])),y0=Math.min(...p.map(v=>v[1])),y1=Math.max(...p.map(v=>v[1]));
    const dx=Math.max(x0,input.rectangle.x0),ux=Math.min(x1,input.rectangle.x1),dy=Math.max(y0,input.rectangle.y0),uy=Math.min(y1,input.rectangle.y1);
    if(ux<=dx||uy<=dy)continue;
    const areaCell=(ux-dx)*(uy-dy),pressureGlobalZ=shell.pressure*Math.sign(normalZ),downPressure=-pressureGlobalZ;
    load+=downPressure*areaCell;area+=areaCell;
  }
  return {downwardKn:load,areaM2:area,source:"actual current combination shell pressures with sign/orientation, clipped cell-by-cell to the d/2 interior contour"};
}

/** Integrates current nodal Winkler reaction over an axis-aligned rectangle by exact Q1 subcell quadrature. */
export function integrateWinklerReactionInsideRect(input:{nodes:readonly FrameNode[];shells:readonly ShellRect[];foundationShellIds:readonly string[];
  pressureByNode:Readonly<Record<string,number|null>>;rectangle:{x0:number;x1:number;y0:number;y1:number}}):{reactionKn:number;areaM2:number;source:string}{
  const ids=new Set(input.foundationShellIds),nodeById=new Map(input.nodes.map(n=>[n.id,n]));
  if(!ids.size||ids.size!==input.foundationShellIds.length||[...ids].some(id=>!input.shells.some(s=>s.id===id)))throw new Error("Punching interior soil integration scope is invalid.");
  if(!Number.isFinite(input.rectangle.x0)||!Number.isFinite(input.rectangle.x1)||!Number.isFinite(input.rectangle.y0)||!Number.isFinite(input.rectangle.y1)
    ||input.rectangle.x1<=input.rectangle.x0||input.rectangle.y1<=input.rectangle.y0)throw new Error("Punching interior soil integration bounds are invalid.");
  let force=0,area=0;
  for(const shell of input.shells.filter(s=>ids.has(s.id))){
    const pts=shell.nodes.map(id=>nodeById.get(id));if(pts.some(p=>!p))throw new Error(`Pressure integration node missing in ${shell.id}.`);
    const xs=pts.map(p=>p!.position[0]),ys=pts.map(p=>p!.position[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    if(new Set(xs).size!==2||new Set(ys).size!==2||pts.some(p=>Math.abs(p!.position[2]-pts[0]!.position[2])>1e-9))throw new Error("Fa integration requires actual axis-aligned horizontal Q4 cells.");
    const ax=Math.max(x0,input.rectangle.x0),bx=Math.min(x1,input.rectangle.x1),ay=Math.max(y0,input.rectangle.y0),by=Math.min(y1,input.rectangle.y1);
    if(bx<=ax||by<=ay)continue;
    const pressureByPoint=new Map<string,number>();
    shell.nodes.forEach(id=>{const p=nodeById.get(id)!;if(!(id in input.pressureByNode))throw new Error(`Winkler pressure is missing for ${id}; only explicit null means inactive contact.`);
      const v=input.pressureByNode[id];if(v!==null&&(!Number.isFinite(v)||v<0))throw new Error("Winkler soil pressure must be finite and compression-positive.");
      pressureByPoint.set(`${p.position[0]},${p.position[1]}`,v??0);});
    const corner=(x:number,y:number)=>{const v=pressureByPoint.get(`${x},${y}`);if(v===undefined)throw new Error("Q4 pressure node order/geometry is incomplete.");return v;};
    const p00=corner(x0,y0),p10=corner(x1,y0),p11=corner(x1,y1),p01=corner(x0,y1);
    const interp=(x:number,y:number)=>{
      const xi=(x-x0)/(x1-x0),eta=(y-y0)/(y1-y0);
      return p00*(1-xi)*(1-eta)+p10*xi*(1-eta)+p11*xi*eta+p01*(1-xi)*eta;
    };
    const mean=(interp(ax,ay)+interp(bx,ay)+interp(bx,by)+interp(ax,by))/4,cellArea=(bx-ax)*(by-ay);
    force+=mean*cellArea;area+=cellArea;
  }
  return {reactionKn:force,areaM2:area,source:"actual current compression-only P06 Winkler nodal pressures integrated over clipped Q4 subcells inside the punching contour"};
}

/** Recovers signed global shell nodal actions from the solved P06 state, including shell pressure load. */
export function recoverFoundationShellForces(input: {
  nodes: readonly FrameNode[]; shells: readonly ShellRect[]; displacementByNode: Readonly<Record<string, readonly number[]>>;
  foundationShellIds: readonly string[];
}): FoundationShellResultant[] {
  const nodes = new Map(input.nodes.map(n=>[n.id,n]));
  const ids = new Set(input.foundationShellIds);
  if (!ids.size || ids.size !== input.foundationShellIds.length || [...ids].some(id=>!input.shells.some(s=>s.id===id))) throw new Error("Foundation shell scope must identify every unique existing shell.");
  return input.shells.filter(s=>ids.has(s.id)).map(shell=>{
    const ns=shell.nodes.map(id=>nodes.get(id));
    if(ns.some(n=>!n)) throw new Error(`Foundation shell ${shell.id} has a missing node.`);
    const u=shell.nodes.flatMap(id=>{
      const v=input.displacementByNode[id];if(!v||v.length!==6||v.some(x=>!Number.isFinite(x)))throw new Error(`Solved displacement missing for ${id}.`);return [...v];
    });
    const c=compileShellRect(shell,ns.map(n=>n!.position) as unknown as readonly [readonly[number,number,number],readonly[number,number,number],readonly[number,number,number],readonly[number,number,number]]);
    const nodeForces=Array.from({length:24},(_,i)=>u.reduce((sum,v,j)=>sum+c.kg[i*24+j]*v,0)-c.fg[i]);
    if(nodeForces.some(v=>!Number.isFinite(v)))throw new Error(`Nonfinite shell force for ${shell.id}.`);
    return {shellId:shell.id,nodeForces,source:"recovered from actual P06 shell K*u - equivalent pressure load; signed global nodal forces"};
  });
}

export type FoundationCutDemand = {
  axis: "X" | "Y";
  coordinateM: number;
  spanStartM: number;
  spanEndM: number;
  side: "negative" | "positive";
  loadCaseId?: string;
  analysisStamp?: string;
  modelRevision?: string;
  sourceStiffnessFingerprint?: string;
};

export type FoundationCutSubSegment = {
  spanStartM: number;
  spanEndM: number;
  subSpanM: number;
  totalShearKn: number;
  averageShearKnPerM: number;
  totalMomentKnm: number;
  averageMomentKnmPerM: number;
  totalInPlaneAxialKn: number;
  averageInPlaneAxialKnPerM: number;
  crossingNodeIds: string[];
  shellId: string;
};

export type FoundationCutResult = {
  axis: "X" | "Y";
  coordinateM: number;
  side: "negative" | "positive";
  cutSpanM: number;
  stripWidthM: number;
  totalShearKn: number;
  totalMomentKnm: number;
  totalInPlaneAxialKn: number;
  shearKn: number;
  momentKnm: number;
  inPlaneAxialKn: number;
  averageShearKnPerM: number;
  averageMomentKnmPerM: number;
  averageInPlaneAxialKnPerM: number;
  shearKnPerM: number;
  momentKnmPerM: number;
  crossingNodeIds: string[];
  shellIds: string[];
  subSegments: FoundationCutSubSegment[];
  scopeMeaning: {
    isAverageOverSpan: true;
    isLocal1mPeak: false;
    note: string;
    normativeCapacityEvaluation: "blocked_pending_authoritative_code_and_strip_definition";
  };
  provenance?: {
    loadCaseId?: string;
    analysisStamp?: string;
    modelRevision?: string;
    sourceStiffnessFingerprint?: string;
  };
  equilibriumSource: string;
};

/**
 * Computes a slab-like section cut from actual recovered FE boundary nodal actions.
 * Every active cell on the selected side must have a face on the cut; no q/A pressure proxy is used.
 * Results report both total signed force (kN) and span-averaged rate (kN/m); average values must NOT
 * be conflated with local 1m peak demands.
 */
export function integrateFoundationCut(input: { nodes:readonly FrameNode[]; shells:readonly ShellRect[];
  resultants:readonly FoundationShellResultant[]; foundationShellIds:readonly string[]; cut:FoundationCutDemand; toleranceM?:number }):FoundationCutResult {
  const tol=input.toleranceM??1e-8, nodes=new Map(input.nodes.map(n=>[n.id,n])), allowed=new Set(input.foundationShellIds), forces=new Map(input.resultants.map(r=>[r.shellId,r]));
  if(!["X","Y"].includes(input.cut.axis)||!["negative","positive"].includes(input.cut.side)||!Number.isFinite(input.cut.coordinateM)||!Number.isFinite(input.cut.spanStartM)||!Number.isFinite(input.cut.spanEndM)||input.cut.spanEndM<=input.cut.spanStartM||tol<=0)throw new Error("Foundation cut geometry is invalid.");
  if([...allowed].some(id=>!input.shells.some(s=>s.id===id)))throw new Error("Foundation cut scope names a missing shell.");
  const crossing=new Set<string>(),selected:ShellRect[]=[],edgeCoordinates:number[]=[],edgeIntervals:{a:number;b:number;shell:ShellRect;edgeNodes:string[]}[]=[];
  for(const shell of input.shells){
    if(!allowed.has(shell.id))continue;
    const ns=shell.nodes.map(id=>nodes.get(id));if(ns.some(n=>!n))throw new Error(`Cut shell ${shell.id} has a missing node.`);
    const values=ns.map(n=>n!.position[input.cut.axis==="X"?0:1]);
    const center=values.reduce((a,b)=>a+b,0)/4;
    const inSpan=ns.every(n=>{const p=n!.position[input.cut.axis==="X"?1:0];return p>=input.cut.spanStartM-tol&&p<=input.cut.spanEndM+tol;});
    const edgeNodes=ns.map((n,i)=>Math.abs(values[i]-input.cut.coordinateM)<=tol?n!.id:null).filter((id):id is string=>id!==null);
    const onCut=edgeNodes.length===2;
    const onSide=input.cut.side==="negative"?center<input.cut.coordinateM-tol:center>input.cut.coordinateM+tol;
    if(onCut&&inSpan&&onSide){selected.push(shell);const edge=edgeNodes.map(id=>nodes.get(id)!.position[input.cut.axis==="X"?1:0]).sort((a,b)=>a-b);
      edgeIntervals.push({a:edge[0],b:edge[1],shell,edgeNodes});edgeNodes.forEach(id=>{crossing.add(id);edgeCoordinates.push(nodes.get(id)!.position[input.cut.axis==="X"?1:0]);});}
  }
  if(!selected.length)throw new Error("No foundation shell edge lies on the declared cut; interpolation is unsupported.");
  const coordinates=[...new Set(edgeCoordinates)].sort((a,b)=>a-b),ordered=[...edgeIntervals].sort((a,b)=>a.a-b.a||a.b-b.b);let cursor=input.cut.spanStartM;
  if(Math.abs(ordered[0].a-cursor)>tol)throw new Error("Foundation cut does not start at the declared span start.");
  for(const segment of ordered){if(segment.a>cursor+tol)throw new Error("Foundation cut has an uncovered middle interval.");if(segment.a<cursor-tol)throw new Error("Foundation cut shell intervals overlap.");cursor=segment.b;}
  if(Math.abs(cursor-input.cut.spanEndM)>tol||Math.abs(coordinates[0]-input.cut.spanStartM)>tol||Math.abs(coordinates.at(-1)!-input.cut.spanEndM)>tol)throw new Error("Foundation cut edge does not cover its declared span.");
  const span=(input.cut.spanEndM-input.cut.spanStartM);
  const component=2; // Fz vertical shear
  const momentComponent=input.cut.axis==="X"?4:3; // My for X-cut, Mx for Y-cut
  const normalComponent=input.cut.axis==="X"?0:1; // Fx for X-cut, Fy for Y-cut
  let shear=0,moment=0,axial=0;
  const subSegments:FoundationCutSubSegment[]=[];
  for(const segment of ordered){
    const result=forces.get(segment.shell.id);if(!result||result.nodeForces.length!==24)throw new Error(`Actual FE shell action missing for ${segment.shell.id}.`);
    let segShear=0,segMoment=0,segAxial=0;
    const segCrossing:string[]=[];
    for(let i=0;i<4;i++){
      const nodeId=segment.shell.nodes[i];
      if(segment.edgeNodes.includes(nodeId)){
        segCrossing.push(nodeId);
        const f=result.nodeForces.slice(6*i,6*i+6);
        segShear+=f[component];segMoment+=f[momentComponent];segAxial+=f[normalComponent];
      }
    }
    const subSpan=segment.b-segment.a;
    if(subSpan<=tol)throw new Error("Zero or negative sub-span encountered in cut segment.");
    subSegments.push({
      spanStartM:segment.a,spanEndM:segment.b,subSpanM:subSpan,
      totalShearKn:segShear,averageShearKnPerM:segShear/subSpan,
      totalMomentKnm:segMoment,averageMomentKnmPerM:segMoment/subSpan,
      totalInPlaneAxialKn:segAxial,averageInPlaneAxialKnPerM:segAxial/subSpan,
      crossingNodeIds:segCrossing.sort(),shellId:segment.shell.id
    });
    shear+=segShear;moment+=segMoment;axial+=segAxial;
  }
  if(!Number.isFinite(shear)||!Number.isFinite(moment)||!Number.isFinite(axial))throw new Error("Foundation cut force recovery is nonfinite.");
  const provenance=(input.cut.loadCaseId||input.cut.analysisStamp||input.cut.modelRevision||input.cut.sourceStiffnessFingerprint)?{
    loadCaseId:input.cut.loadCaseId,
    analysisStamp:input.cut.analysisStamp,
    modelRevision:input.cut.modelRevision,
    sourceStiffnessFingerprint:input.cut.sourceStiffnessFingerprint
  }:undefined;
  return {
    axis:input.cut.axis,coordinateM:input.cut.coordinateM,side:input.cut.side,
    cutSpanM:span,stripWidthM:span,
    totalShearKn:shear,totalMomentKnm:moment,totalInPlaneAxialKn:axial,
    shearKn:shear,momentKnm:moment,inPlaneAxialKn:axial,
    averageShearKnPerM:shear/span,averageMomentKnmPerM:moment/span,averageInPlaneAxialKnPerM:axial/span,
    shearKnPerM:shear/span,momentKnmPerM:moment/span,
    crossingNodeIds:[...crossing].sort(),shellIds:selected.map(s=>s.id).sort(),
    subSegments,
    scopeMeaning:{
      isAverageOverSpan:true,
      isLocal1mPeak:false,
      note:"shearKnPerM and momentKnmPerM are span-averaged values over cutSpanM; they do NOT represent local 1 m peaks or tributary column strip concentrations. Capacity evaluation requires explicit strip boundary cuts.",
      normativeCapacityEvaluation:"blocked_pending_authoritative_code_and_strip_definition"
    },
    provenance,
    equilibriumSource:"signed P06 FE shell nodal actions summed on the actual cut edge; q/A is not used"
  };
}

export type FoundationRebarBand={direction:"X"|"Y";face:"top"|"bottom";section:{bw:number;h:number;bf:number;hf:number};bars:readonly BeamBar[];material:BeamMaterial;source:string};
export function checkFoundationFlexuralBand(input:{demandKnmPerM:number;band:FoundationRebarBand}):{capacityKnmPerM:number;ratio:number|null;status:"capacity_sufficient_screen"|"capacity_exceeded"|"unknown";assumption:string;sectionResult:ReturnType<typeof beamCapacity>}{
  const b=input.band;
  if(!b.source.trim()||![input.demandKnmPerM,b.section.bw,b.section.h].every(Number.isFinite)||input.demandKnmPerM<0)throw new Error("Foundation FE demand and real reinforcement-section source are required.");
  if(b.section.bw!==1000)throw new Error("Foundation strip section width must be exactly 1000 mm for kN·m/m demand.");
  const sign=b.face==="bottom"?1:-1;
  const capacity=beamCapacity(b.section,b.bars,b.material,sign,0);
  if(capacity.status!=="solved")return {capacityKnmPerM:0,ratio:null,status:"unknown",assumption:"P09 section equilibrium did not solve; no foundation capacity is inferred.",sectionResult:capacity};
  const ratio=capacity.capacityKnm>0?input.demandKnmPerM/capacity.capacityKnm:null;
  return {capacityKnmPerM:capacity.capacityKnm,ratio,status:capacity.capacityKnm>0&&input.demandKnmPerM<=capacity.capacityKnm?"capacity_sufficient_screen":"capacity_exceeded",sectionResult:capacity,
    assumption:"P09 TS500 rectangular section N-M equilibrium on the explicit 1 m strip and real bar coordinates; this does not check plate orthogonal interaction, anchorage, spacing/distribution, crack/deflection or normative foundation detailing."};
}

/** TBDY 7.11.7 FE vertical punching stress only; deliberately not a generic TS 500 one-way shear check. */
export function checkTbdy7117FoundationFePunching(input:{unitWidthVpdKnPerM:number;effectiveDepthMm:number;distanceFromActualSupportFaceMm:number;
  fctdMpa:number;fctdSource:string;loadingBasis:"G_plus_D_times_E"|"other_or_unknown";analysisStamp:string}):{status:"passed"|"failed"|"blocked";tauPdMpa:number|null;fctdMpa:number|null;scope:string;sourceClause:"TBDY-7.11.7"}{
  if(!input.analysisStamp.trim()||!input.fctdSource.trim()||![input.unitWidthVpdKnPerM,input.effectiveDepthMm,input.distanceFromActualSupportFaceMm,input.fctdMpa].every(Number.isFinite)
    ||input.effectiveDepthMm<=0||input.fctdMpa<=0)throw new Error("TBDY 7.11.7 needs a current FE demand, effective depth and sourced fctd.");
  const scope="Finite-element punching shear stress at d/2 from actual column/wall face under G + D·E; not generic one-way shear capacity.";
  if(input.loadingBasis!=="G_plus_D_times_E"||Math.abs(input.distanceFromActualSupportFaceMm-input.effectiveDepthMm/2)>1e-6)
    return {status:"blocked",tauPdMpa:null,fctdMpa:input.fctdMpa,scope,sourceClause:"TBDY-7.11.7"};
  // kN/m divided by mm is N/mm² = MPa.
  const tau=Math.abs(input.unitWidthVpdKnPerM)/input.effectiveDepthMm;
  return {status:tau<=input.fctdMpa?"passed":"failed",tauPdMpa:tau,fctdMpa:input.fctdMpa,scope,sourceClause:"TBDY-7.11.7"};
}
