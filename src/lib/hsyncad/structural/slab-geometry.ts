import {type Polygon2, type SlabBoundary} from "./punching-shear";
export type SlabSupportEdge="left"|"right"|"bottom"|"top";
export type SlabEdgeSupport={edge:SlabSupportEdge;condition:"simple"|"fixed";source:string};
export type SlabPanelGeometry={id:string;modelRevision:string;boundary:SlabBoundary;supports:readonly SlabEdgeSupport[];thicknessM:number;source:string};
export type SlabTopology={panelId:string;areaM2:number;clearSpansM:{x:number;y:number};aspectRatio:number;workingType:"one_way_x"|"one_way_y"|"two_way"|"cantilever"|"unsupported";supportEdges:SlabSupportEdge[];openingAreaM2:number;status:"solved"|"unsupported";diagnostics:string[];method:"explicit-orthogonal-panel-v1"};
const abs=(a:number)=>Math.abs(a);
function polygonArea(p:Polygon2){return Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2);}
function validateSimplePolygon(p:Polygon2,label:string){
 if(!Array.isArray(p)||p.length<3||p.some((q:Polygon2[number])=>q.length!==2||q.some((v:number)=>!Number.isFinite(v))))throw Error(`${label}: finite XY polygon required.`);
 const area=polygonArea(p);if(area<=1e-10)throw Error(`${label}: zero area.`);
 for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-10)throw Error(`${label}: zero edge.`);const dx=b[0]-a[0],dy=b[1]-a[1];if(abs(dx)>1e-9&&abs(dy)>1e-9)throw Error(`${label}: only axis-aligned polygon edges are supported.`);}
 return area;
}
function inside(p:readonly[number,number],poly:Polygon2){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
/** Validates panel scope and only classifies complete axis-aligned rectangles with explicit edge restraint. */
export function analyzeSlabTopology(panel:SlabPanelGeometry):SlabTopology{
 const diag:string[]=[];if(!panel.id||!panel.modelRevision||!panel.source?.trim()||!Number.isFinite(panel.thicknessM)||panel.thicknessM<=0)throw Error("Slab identity, revision, source and positive thickness are required.");
 const gross=validateSimplePolygon(panel.boundary.outer,"Slab outer boundary"),openingAreas=panel.boundary.openings.map((p,i)=>validateSimplePolygon(p,`Slab opening ${i}`));
 for(let i=0;i<panel.boundary.openings.length;i++){const hole=panel.boundary.openings[i];if(!hole.every(p=>inside(p,panel.boundary.outer)))throw Error("Opening must lie strictly inside the outer panel.");for(let j=0;j<i;j++)if(hole.some(p=>inside(p,panel.boundary.openings[j]))||panel.boundary.openings[j].some(p=>inside(p,hole)))throw Error("Overlapping/containing openings are unsupported.");}
 const openings=openingAreas.reduce((a,b)=>a+b,0);if(openings>=gross)throw Error("Opening area consumes the complete slab panel.");
 const points=panel.boundary.outer,xs=[...new Set(points.map(p=>p[0]))],ys=[...new Set(points.map(p=>p[1]))],rect=points.length===4&&xs.length===2&&ys.length===2&&abs(gross-(Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys)))<1e-8;
 if(!rect)diag.push("Irregular, re-entrant or non-rectangular panel analysis is not supported.");
 const supportIds=panel.supports.map(s=>s.edge);if(new Set(supportIds).size!==supportIds.length)throw Error("A slab edge cannot carry duplicate support declarations.");
 if(panel.supports.some(s=>!s.source?.trim()||!["simple","fixed"].includes(s.condition)))throw Error("Each support edge needs its physical restraint and evidence.");
 let spanX=rect?Math.max(...xs)-Math.min(...xs):NaN;const spanY=rect?Math.max(...ys)-Math.min(...ys):NaN;
 if(rect){for(const h of panel.boundary.openings){const hx=[...new Set(h.map(p=>p[0]))],hy=[...new Set(h.map(p=>p[1]))];if(h.length!==4||hx.length!==2||hy.length!==2)diag.push("Non-rectangular opening mesh transfer is unsupported.");}}
 let workingType:SlabTopology["workingType"]="unsupported",status:SlabTopology["status"]="unsupported";
 if(rect&&!diag.some(d=>d.includes("opening"))){
  const set=new Set(supportIds),horizontal=(set.has("left")&&set.has("right")),vertical=(set.has("bottom")&&set.has("top"));
  if(supportIds.length===1&&panel.supports[0].condition==="fixed"){workingType="cantilever";spanX=supportIds[0]==="left"||supportIds[0]==="right"?spanX:spanY;status="solved";}
  else if(horizontal&&vertical){if(spanX>2*spanY)workingType="one_way_y";else if(spanY>2*spanX)workingType="one_way_x";else workingType="two_way";status="solved";}
  else if(horizontal&&!vertical){workingType="one_way_x";status="solved";}
  else if(vertical&&!horizontal){workingType="one_way_y";status="solved";}
  else diag.push("Support topology does not define a supported one-way, two-way, or cantilever action.");
 }
 return {panelId:panel.id,areaM2:gross-openings,clearSpansM:{x:spanX,y:spanY},aspectRatio:spanX/spanY,workingType,supportEdges:[...supportIds],openingAreaM2:openings,status,diagnostics:diag,method:"explicit-orthogonal-panel-v1"};
}
