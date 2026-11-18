/** Geometry-first TS 500 punching perimeter. This module does not infer support/load capacity. */
export type Point2 = readonly [number, number];
export type Polygon2 = readonly Point2[];
export type SlabBoundary = { outer: Polygon2; openings: readonly Polygon2[] };
export type PunchingSupportKind = "column" | "wall_end";
export type PunchingSupport = { id: string; kind: PunchingSupportKind; footprint: Polygon2; origin: Point2 };
export type PunchingPerimeter = {
  supportId: string; effectiveDepthM: number; segments: { a: Point2; b: Point2; lengthM: number; source: "column" | "slab_edge" | "opening" }[];
  fullLengthM: number; clippedLengthM: number; retainedLengthM: number;
  retainedBySide: Readonly<Record<"left" | "right" | "bottom" | "top", number>>;
  classification: "interior" | "edge" | "corner" | "wall_end";
  geometryStatus: "solved" | "unsupported"; diagnostics: string[];
  method: "axis-aligned-critical-rectangle-clipped-v1";
};
const EPS = 1e-9;
const finitePoint = (p: Point2) => p.length === 2 && p.every(Number.isFinite);
function validatePolygon(p: Polygon2, name: string): void {
  if (!Array.isArray(p) || p.length < 3 || p.some(q => !finitePoint(q))) throw Error(`${name}: at least three finite XY points required.`);
  for (let i=0;i<p.length;i++) if (Math.hypot(p[i][0]-p[(i+1)%p.length][0],p[i][1]-p[(i+1)%p.length][1])<=EPS) throw Error(`${name}: zero-length edge.`);
  if (Math.abs(area(p)) <= EPS) throw Error(`${name}: zero-area polygon.`);
  for (let i=0;i<p.length;i++) for (let j=i+1;j<p.length;j++) {
    if (j===i || j===(i+1)%p.length || i===(j+1)%p.length) continue;
    if (segmentsIntersect(p[i],p[(i+1)%p.length],p[j],p[(j+1)%p.length])) throw Error(`${name}: self-intersection.`);
  }
}
function axisAlignedRectangle(p:Polygon2):{x0:number;x1:number;y0:number;y1:number}|null{
 if(p.length!==4)return null;const xs=[...new Set(p.map(q=>q[0]))].sort((a,b)=>a-b),ys=[...new Set(p.map(q=>q[1]))].sort((a,b)=>a-b);
 if(xs.length!==2||ys.length!==2||new Set(p.map(q=>`${q[0]},${q[1]}`)).size!==4)return null;
 const corners=new Set([`${xs[0]},${ys[0]}`,`${xs[0]},${ys[1]}`,`${xs[1]},${ys[0]}`,`${xs[1]},${ys[1]}`]);if(p.some(q=>!corners.has(`${q[0]},${q[1]}`)))return null;
 return {x0:xs[0],x1:xs[1],y0:ys[0],y1:ys[1]};
}
function area(p: Polygon2): number { return p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2; }
function cross(a: Point2,b: Point2,c: Point2): number { return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]); }
function onSegment(p: Point2,a: Point2,b: Point2): boolean { return Math.abs(cross(a,b,p))<EPS && p[0]>=Math.min(a[0],b[0])-EPS&&p[0]<=Math.max(a[0],b[0])+EPS&&p[1]>=Math.min(a[1],b[1])-EPS&&p[1]<=Math.max(a[1],b[1])+EPS; }
function segmentsIntersect(a:Point2,b:Point2,c:Point2,d:Point2):boolean { const x=cross(a,b,c),y=cross(a,b,d),z=cross(c,d,a),w=cross(c,d,b);return x*y < -EPS && z*w < -EPS || Math.abs(x)<EPS&&onSegment(c,a,b)||Math.abs(y)<EPS&&onSegment(d,a,b)||Math.abs(z)<EPS&&onSegment(a,c,d)||Math.abs(w)<EPS&&onSegment(b,c,d); }
function inside(p:Point2,poly:Polygon2):boolean { let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(onSegment(p,a,b))return true;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes; }
function intersectionParameter(a:Point2,b:Point2,c:Point2,d:Point2):number|null {
  const rx=b[0]-a[0],ry=b[1]-a[1],sx=d[0]-c[0],sy=d[1]-c[1],den=rx*sy-ry*sx;
  if(Math.abs(den)<EPS)return null;const t=((c[0]-a[0])*sy-(c[1]-a[1])*sx)/den,u=((c[0]-a[0])*ry-(c[1]-a[1])*rx)/den;
  return t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS?Math.max(0,Math.min(1,t)):null;
}
function distanceSegment(a:Point2,b:Point2,c:Point2,d:Point2):number {
  if(segmentsIntersect(a,b,c,d))return 0;
  const dist=(p:Point2,x:Point2,y:Point2)=>{const dx=y[0]-x[0],dy=y[1]-x[1],t=Math.max(0,Math.min(1,((p[0]-x[0])*dx+(p[1]-x[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-x[0]-t*dx,p[1]-x[1]-t*dy);};
  return Math.min(dist(a,c,d),dist(b,c,d),dist(c,a,b),dist(d,a,b));
}
function distancePolygons(a:Polygon2,b:Polygon2):number { let d=Infinity;for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)d=Math.min(d,distanceSegment(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]));return d; }

/** Clips the axis-aligned d/2 perimeter by the panel outline and openings. Near-hole tangency rules are explicitly gated. */
export function punchingPerimeter(input:{boundary:SlabBoundary;support:PunchingSupport;effectiveDepthM:number}):PunchingPerimeter {
  const {boundary,support,effectiveDepthM:d}=input;validatePolygon(boundary.outer,"Panel outer boundary");boundary.openings.forEach((p,i)=>validatePolygon(p,`Opening ${i}`));validatePolygon(support.footprint,"Punching support footprint");
  if(!support.id||!(["column","wall_end"] as string[]).includes(support.kind)||!finitePoint(support.origin)||!Number.isFinite(d)||d<=0)throw Error("Punching support/depth is incomplete.");
  const box=axisAlignedRectangle(support.footprint);if(!box)throw Error("Only an explicit four-corner axis-aligned rectangular support footprint is supported.");
  const {x0,x1,y0,y1}=box,h=d/2;
  if(!(support.origin[0]>=x0-EPS&&support.origin[0]<=x1+EPS&&support.origin[1]>=y0-EPS&&support.origin[1]<=y1+EPS))throw Error("Support origin must lie in its actual footprint.");
  const pts:[[number,number],[number,number],[number,number],[number,number]]=[[x0-h,y0-h],[x1+h,y0-h],[x1+h,y1+h],[x0-h,y1+h]],sideNames=["bottom","right","top","left"] as const;
  const segments:PunchingPerimeter["segments"]=[],retained={left:0,right:0,bottom:0,top:0},diagnostics:string[]=[];let full=0,kept=0,outerCrossings=0,holeCrossings=0;
  for(let k=0;k<4;k++){
    const a=pts[k],b=pts[(k+1)%4],len=Math.hypot(b[0]-a[0],b[1]-a[1]);full+=len;
    const cuts=[0,1];for(let i=0;i<boundary.outer.length;i++){const t=intersectionParameter(a,b,boundary.outer[i],boundary.outer[(i+1)%boundary.outer.length]);if(t!==null){cuts.push(t);outerCrossings++;}}
    for(const hole of boundary.openings)for(let i=0;i<hole.length;i++){const t=intersectionParameter(a,b,hole[i],hole[(i+1)%hole.length]);if(t!==null){cuts.push(t);holeCrossings++;}}
    const order=[...new Set(cuts.map(t=>Math.round(t*1e12)/1e12))].sort((u,v)=>u-v);
    for(let i=0;i<order.length-1;i++){
      const ta=order[i],tb=order[i+1],tm=(ta+tb)/2,p:[number,number]=[a[0]+(b[0]-a[0])*tm,a[1]+(b[1]-a[1])*tm];
      if(!inside(p,boundary.outer)||boundary.openings.some(hole=>inside(p,hole)))continue;
      const aa:[number,number]=[a[0]+(b[0]-a[0])*ta,a[1]+(b[1]-a[1])*ta],bb:[number,number]=[a[0]+(b[0]-a[0])*tb,a[1]+(b[1]-a[1])*tb],part=len*(tb-ta);
      if(part<=EPS)continue;segments.push({a:aa,b:bb,lengthM:part,source:(ta>EPS||tb<1-EPS)?(holeCrossings?"opening":"slab_edge"):"column"});kept+=part;retained[sideNames[k]]+=part;
    }
  }
  if(kept<=EPS)throw Error("No punching perimeter remains inside the slab.");
  const sideFullLength=(s:keyof typeof retained)=>s==="left"||s==="right"?y1-y0+2*h:x1-x0+2*h;
  const clippedSides=(Object.keys(retained) as (keyof typeof retained)[]).filter(s=>retained[s]<sideFullLength(s)-1e-8).length;
  const outerBox=axisAlignedRectangle(boundary.outer);if(!outerBox)diagnostics.push("Only an axis-aligned rectangular slab outline has a validated TS 500 critical-section profile.");
  else if(x0-h<=outerBox.x0+EPS||x1+h>=outerBox.x1-EPS||y0-h<=outerBox.y0+EPS||y1+h>=outerBox.y1-EPS)diagnostics.push("Edge/corner case requires both TS 500 Fig. 8.5 candidate perimeters and selection of the shorter perimeter.");
  const colAspect=Math.max((x1-x0)/(y1-y0),(y1-y0)/(x1-x0));if(colAspect>3+EPS)diagnostics.push("Loaded-area aspect ratio > 3 requires the TS 500 h=3b critical-perimeter construction.");
  for(const hole of boundary.openings){const gap=distancePolygons(support.footprint,hole);if(gap<=5*d+EPS)diagnostics.push("Opening lies within 5d of the loaded area; TS 500 radial-shadow tangent reduction is not implemented for this geometry.");}
  const holeBoxes=boundary.openings.map(axisAlignedRectangle);if(holeBoxes.some(b=>!b))diagnostics.push("Only rectangular openings have explicit geometry; TS 500 opening shadow requires radial tangent construction.");
  for(let i=0;i<boundary.openings.length;i++){
    const hole=boundary.openings[i];if(hole.some(p=>!inside(p,boundary.outer)))diagnostics.push("Opening is not strictly contained by the slab boundary.");
    for(let j=0;j<i;j++)if(distancePolygons(hole,boundary.openings[j])<=EPS||inside(hole[0],boundary.openings[j])||inside(boundary.openings[j][0],hole))diagnostics.push("Opening polygons overlap or touch.");
    if(distancePolygons(support.footprint,hole)<=EPS||inside(support.footprint[0],hole)||inside(hole[0],support.footprint))diagnostics.push("Opening overlaps or touches the loaded support area.");
  }
  if(outerCrossings>0&&clippedSides===0)diagnostics.push("Panel boundary intersection topology is ambiguous.");
  if(segments.some(s=>!s.lengthM||![...s.a,...s.b].every(Number.isFinite)))throw Error("Invalid clipped perimeter segment.");
  const classification=support.kind==="wall_end"?"wall_end":clippedSides>=2?"corner":clippedSides===1?"edge":"interior";
  return {supportId:support.id,effectiveDepthM:d,segments,fullLengthM:full,clippedLengthM:full-kept,retainedLengthM:kept,retainedBySide:retained,classification,geometryStatus:diagnostics.length?"unsupported":"solved",diagnostics,method:"axis-aligned-critical-rectangle-clipped-v1"};
}

export type InteriorPunchingAction={modelRevision:string;stiffnessSet:string;analysisStamp:string;source:string;NaboveKn:number;NbelowKn:number;FaKn:number;MxAdjacentKnM:readonly[number,number];MyAdjacentKnM:readonly[number,number]};
/** TS 500 8.21/8.24, restricted to an uncut interior rectangular-column perimeter. */
export function checkInteriorPunching(input:{perimeter:PunchingPerimeter;support:PunchingSupport;action:InteriorPunchingAction;material:{fctdMPa:number;source:string;evidence:string};expectedCurrent:{modelRevision:string;stiffnessSet:string;analysisStamp:string}}){
 const {perimeter:p,support:s,action:a,material:m}=input;
 if(p.geometryStatus!=="solved"||p.classification!=="interior"||s.kind!=="column"||p.supportId!==s.id||p.method!=="axis-aligned-critical-rectangle-clipped-v1")return {status:"unsupported" as const,reason:[...p.diagnostics,"TS 500 8.21/8.24 check requires an uncut interior rectangular-column perimeter."].join(" "),engineeringAcceptance:false as const};
 if(a.modelRevision!==input.expectedCurrent.modelRevision||a.stiffnessSet!==input.expectedCurrent.stiffnessSet||a.analysisStamp!==input.expectedCurrent.analysisStamp||!a.source?.trim()||![a.NaboveKn,a.NbelowKn,a.FaKn,...a.MxAdjacentKnM,...a.MyAdjacentKnM,m.fctdMPa].every(Number.isFinite)||m.fctdMPa<=0||!m.source?.trim()||!m.evidence?.trim())throw Error("Current solved action tuple and source-backed fctd are required.");
 const nDiff=a.NbelowKn-a.NaboveKn;if(Math.abs(nDiff)<=1e-9)throw Error("TS 500 eccentricity needs a nonzero above/below axial-force difference.");
 const eX=.4*Math.abs(a.MxAdjacentKnM[0]+a.MxAdjacentKnM[1])/Math.abs(nDiff),eY=.4*Math.abs(a.MyAdjacentKnM[0]+a.MyAdjacentKnM[1])/Math.abs(nDiff),xs=s.footprint.map(p=>p[0]),ys=s.footprint.map(p=>p[1]),bx=Math.max(...xs)-Math.min(...xs)+p.effectiveDepthM,by=Math.max(...ys)-Math.min(...ys)+p.effectiveDepthM;
 const gamma=1/(1+1.5*(eX+eY)/Math.sqrt(bx*by)),signedVpd=nDiff-a.FaKn,vpdKn=Math.abs(signedVpd),vprKn=gamma*m.fctdMPa*1000*p.retainedLengthM*p.effectiveDepthM,ratio=vpdKn/vprKn;
 if(!Number.isFinite(vprKn)||vprKn<=0)throw Error("Punching capacity arithmetic invalid.");
 return {status:vpdKn<=vprKn?"passed" as const:"failed" as const,geometry:p,action:{...a,eccentricityXM:eX,eccentricityYM:eY,signedVpdKn:signedVpd},gamma,VpdKn:vpdKn,VprKn:vprKn,utilization:ratio,checks:[{id:"TS500-8.20",demandKn:vpdKn,capacityKn:vprKn,passed:vpdKn<=vprKn}],sourceClauses:["TS 500:2000 8.3.1, equations 8.20, 8.21 and interior rectangular case 8.24"],engineeringAcceptance:false as const};
}

/** Explicit status for every geometry outside the implemented interior profile. */
export function punchingCapacityGate(perimeter:PunchingPerimeter):{status:"unsupported";reason:string;engineeringAcceptance:false} {
  const reason=perimeter.diagnostics.length?perimeter.diagnostics.join(" "):"Implemented capacity is limited to an interior rectangular column using TS 500 8.21/8.24; edge/corner/wall-end and opening-shadow cases require their exact code perimeter and eccentricity path.";
  return {status:"unsupported",reason,engineeringAcceptance:false};
}

export type TS500PunchingPerimeter = {
  supportId: string; effectiveDepthM: number;
  segments: { a: Point2; b: Point2; lengthM: number; source: "column" | "slab_edge" | "opening" }[];
  fullLengthM: number; clippedLengthM: number; retainedLengthM: number;
  retainedBySide: Readonly<Record<"left" | "right" | "bottom" | "top", number>>;
  classification: "interior" | "edge" | "corner";
  geometryStatus: "solved" | "unsupported"; diagnostics: string[];
  method: "ts500-shortest-contour-shadow-v1";
  candidateEvidence: { selectedCandidate: string; candidates: { name: string; classification: "interior" | "edge" | "corner"; nominalLengthM: number; admissible: boolean }[] };
  engineeringAcceptance: false;
};

function isConvexPolygon(p: Polygon2): boolean {
  if (p.length < 3) return false;
  let sign = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], c = p[(i + 2) % p.length];
    const cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(cr) <= 1e-12) continue;
    if (sign === 0) sign = cr > 0 ? 1 : -1;
    else if ((cr > 0 && sign < 0) || (cr < 0 && sign > 0)) return false;
  }
  return true;
}

function rayParam(c: Point2, ux: number, uy: number, a: Point2, b: Point2): number | null {
  const dx = b[0] - a[0], dy = b[1] - a[1], den = dy * ux - dx * uy;
  if (Math.abs(den) < 1e-12) return null;
  const t = (-(c[0] - a[0]) * uy + (c[1] - a[1]) * ux) / den, s = (dx * (c[1] - a[1]) - dy * (c[0] - a[0])) / den;
  return s >= -EPS && t >= -EPS && t <= 1 + EPS ? Math.max(0, Math.min(1, t)) : null;
}

function findTangentVertices(c: Point2, h: Polygon2): { vr: Point2; vl: Point2 } {
  let vr = h[0], vl = h[0];
  for (let i = 0; i < h.length; i++) {
    const vi = h[i], dxi = vi[0] - c[0], dyi = vi[1] - c[1];
    let allL = true, allR = true;
    for (let j = 0; j < h.length; j++) {
      if (i === j) continue;
      const cr = dxi * (h[j][1] - c[1]) - dyi * (h[j][0] - c[0]);
      if (cr < -1e-12) allL = false;
      if (cr > 1e-12) allR = false;
    }
    if (allL) vr = vi;
    if (allR) vl = vi;
  }
  return { vr, vl };
}

function inCone(c: Point2, vr: Point2, vl: Point2, p: Point2): boolean {
  const vxr = vr[0] - c[0], vyr = vr[1] - c[1], vxl = vl[0] - c[0], vyl = vl[1] - c[1];
  const px = p[0] - c[0], py = p[1] - c[1];
  return (vxr * py - vyr * px >= -1e-12) && (vxl * py - vyl * px <= 1e-12);
}

function evaluateCandidateSides(
  sides: { side: "left" | "right" | "bottom" | "top"; a: Point2; b: Point2 }[],
  outer: Polygon2,
  openings: readonly Polygon2[],
  colCenter: Point2,
  tangentRays: { vr: Point2; vl: Point2 }[],
  isShadowed: (p: Point2) => boolean
): { kept: number; segments: TS500PunchingPerimeter["segments"]; retained: Record<"left" | "right" | "bottom" | "top", number> } {
  const segments: TS500PunchingPerimeter["segments"] = [];
  const retained = { left: 0, right: 0, bottom: 0, top: 0 };
  let kept = 0;
  for (const { a, b, side } of sides) {
    const sideLen = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const cuts: { t: number; kind: "endpoint" | "slab_edge" | "opening" }[] = [{ t: 0, kind: "endpoint" }, { t: 1, kind: "endpoint" }];
    for (let i = 0; i < outer.length; i++) {
      const t = intersectionParameter(a, b, outer[i], outer[(i + 1) % outer.length]);
      if (t !== null) cuts.push({ t, kind: "slab_edge" });
    }
    for (const hole of openings) {
      for (let i = 0; i < hole.length; i++) {
        const t = intersectionParameter(a, b, hole[i], hole[(i + 1) % hole.length]);
        if (t !== null) cuts.push({ t, kind: "opening" });
      }
    }
    for (const { vr, vl } of tangentRays) {
      const tr = rayParam(colCenter, vr[0] - colCenter[0], vr[1] - colCenter[1], a, b);
      if (tr !== null) cuts.push({ t: tr, kind: "opening" });
      const tl = rayParam(colCenter, vl[0] - colCenter[0], vl[1] - colCenter[1], a, b);
      if (tl !== null) cuts.push({ t: tl, kind: "opening" });
    }
    cuts.sort((u, v) => u.t - v.t);
    const uniqueCuts: { t: number; kind: "endpoint" | "slab_edge" | "opening" }[] = [];
    for (const c of cuts) {
      if (!uniqueCuts.length || c.t - uniqueCuts[uniqueCuts.length - 1].t > 1e-10) uniqueCuts.push(c);
    }
    for (let i = 0; i < uniqueCuts.length - 1; i++) {
      const ta = uniqueCuts[i].t, tb = uniqueCuts[i + 1].t;
      if (tb - ta <= 1e-10) continue;
      const tm = (ta + tb) / 2, pm: Point2 = [a[0] + (b[0] - a[0]) * tm, a[1] + (b[1] - a[1]) * tm];
      if (!inside(pm, outer) || openings.some(h => inside(pm, h)) || isShadowed(pm)) continue;
      const segLen = sideLen * (tb - ta);
      if (segLen <= EPS) continue;
      const cutByOpening = uniqueCuts[i].kind === "opening" || uniqueCuts[i + 1].kind === "opening";
      const cutByEdge = uniqueCuts[i].kind === "slab_edge" || uniqueCuts[i + 1].kind === "slab_edge";
      segments.push({
        a: [a[0] + (b[0] - a[0]) * ta, a[1] + (b[1] - a[1]) * ta],
        b: [a[0] + (b[0] - a[0]) * tb, a[1] + (b[1] - a[1]) * tb],
        lengthM: segLen,
        source: cutByOpening ? "opening" : cutByEdge ? "slab_edge" : "column"
      });
      kept += segLen;
      retained[side] += segLen;
    }
  }
  return { kept, segments, retained };
}

export function computeTS500PunchingContour(input: { boundary: SlabBoundary; support: PunchingSupport; effectiveDepthM: number }): TS500PunchingPerimeter {
  const { boundary, support, effectiveDepthM: d } = input;
  validatePolygon(boundary.outer, "Panel outer boundary");
  boundary.openings.forEach((p, i) => validatePolygon(p, `Opening ${i}`));
  validatePolygon(support.footprint, "Punching support footprint");
  if (!support.id || support.kind !== "column" || !finitePoint(support.origin) || !Number.isFinite(d) || d <= 0) {
    throw Error("computeTS500PunchingContour requires a column support and valid effective depth.");
  }
  const box = axisAlignedRectangle(support.footprint);
  if (!box) throw Error("Only an axis-aligned rectangular column footprint is supported.");
  const { x0, x1, y0, y1 } = box, h = d / 2;
  if (support.origin[0] < x0 - EPS || support.origin[0] > x1 + EPS || support.origin[1] < y0 - EPS || support.origin[1] > y1 + EPS) {
    throw Error("Support origin must lie inside its footprint.");
  }
  const diagnostics: string[] = [];
  const outerBox = axisAlignedRectangle(boundary.outer);
  if (!outerBox) diagnostics.push("Only axis-aligned rectangular slab outline supported.");
  if (Math.max((x1 - x0) / (y1 - y0), (y1 - y0) / (x1 - x0)) > 3 + EPS) diagnostics.push("Aspect ratio > 3.");
  if (boundary.openings.some(h => !axisAlignedRectangle(h))) diagnostics.push("Only rectangular openings supported.");
  if (boundary.openings.some(h => !isConvexPolygon(h))) diagnostics.push("Only convex openings supported.");
  
  if (outerBox) {
    if (x0 < outerBox.x0 - EPS || x1 > outerBox.x1 + EPS || y0 < outerBox.y0 - EPS || y1 > outerBox.y1 + EPS) {
      diagnostics.push("Support footprint is not fully contained within the slab boundary.");
    }
    if (boundary.openings.some(hole => hole.some(p => p[0] <= outerBox.x0 + EPS || p[0] >= outerBox.x1 - EPS || p[1] <= outerBox.y0 + EPS || p[1] >= outerBox.y1 - EPS))) {
      diagnostics.push("Opening touches or breaches slab boundary.");
    }
  }
  if (support.footprint.some(p => !inside(p, boundary.outer))) {
    diagnostics.push("Support footprint is not fully contained within the slab boundary.");
  }
  for (let i = 0; i < boundary.openings.length; i++) {
    const hole = boundary.openings[i];
    if (hole.some(p => !inside(p, boundary.outer))) {
      diagnostics.push("Opening is not strictly contained by the slab boundary.");
    }
    for (let j = 0; j < i; j++) {
      if (distancePolygons(hole, boundary.openings[j]) <= EPS || inside(hole[0], boundary.openings[j]) || inside(boundary.openings[j][0], hole)) {
        diagnostics.push("Openings overlap or touch.");
      }
    }
    if (distancePolygons(support.footprint, hole) <= EPS || inside(support.footprint[0], hole) || inside(hole[0], support.footprint)) {
      diagnostics.push("Opening overlaps loaded area.");
    }
  }
  const ox0 = outerBox ? outerBox.x0 : -Infinity, ox1 = outerBox ? outerBox.x1 : Infinity;
  const oy0 = outerBox ? outerBox.y0 : -Infinity, oy1 = outerBox ? outerBox.y1 : Infinity;
  const cx = x1 - x0, cy = y1 - y0;
  const dL = x0 - ox0, dR = ox1 - x1, dB = y0 - oy0, dT = oy1 - y1;
  const thR = cy / 2 + d, thL = cy / 2 + d, thT = cx / 2 + d, thB = cx / 2 + d;
  type Side = "left" | "right" | "bottom" | "top";
  type Cand = { name: string; cls: "interior" | "edge" | "corner"; len: number; sides: { side: Side; a: Point2; b: Point2 }[]; adm: boolean };
  const bx0 = x0 - h, bx1 = x1 + h, by0 = y0 - h, by1 = y1 + h;
  const S = (side: Side, a: Point2, b: Point2) => ({ side, a, b });
  const cands: Cand[] = [
    { name: "interior_4side", cls: "interior", len: 2 * (cx + d + cy + d), adm: dL >= h - EPS && dR >= h - EPS && dB >= h - EPS && dT >= h - EPS,
      sides: [S("bottom", [bx0, by0], [bx1, by0]), S("right", [bx1, by0], [bx1, by1]), S("top", [bx1, by1], [bx0, by1]), S("left", [bx0, by1], [bx0, by0])] },
    { name: "edge_right_3side", cls: "edge", len: cy + d + 2 * (cx + h + dR), adm: dL >= h - EPS && dB >= h - EPS && dT >= h - EPS && dR >= -EPS,
      sides: [S("top", [bx0, by1], [ox1, by1]), S("left", [bx0, by0], [bx0, by1]), S("bottom", [bx0, by0], [ox1, by0])] },
    { name: "edge_left_3side", cls: "edge", len: cy + d + 2 * (cx + h + dL), adm: dR >= h - EPS && dB >= h - EPS && dT >= h - EPS && dL >= -EPS,
      sides: [S("top", [ox0, by1], [bx1, by1]), S("right", [bx1, by0], [bx1, by1]), S("bottom", [ox0, by0], [bx1, by0])] },
    { name: "edge_top_3side", cls: "edge", len: cx + d + 2 * (cy + h + dT), adm: dL >= h - EPS && dR >= h - EPS && dB >= h - EPS && dT >= -EPS,
      sides: [S("left", [bx0, by0], [bx0, oy1]), S("bottom", [bx0, by0], [bx1, by0]), S("right", [bx1, by0], [bx1, oy1])] },
    { name: "edge_bottom_3side", cls: "edge", len: cx + d + 2 * (cy + h + dB), adm: dL >= h - EPS && dR >= h - EPS && dT >= h - EPS && dB >= -EPS,
      sides: [S("left", [bx0, oy0], [bx0, by1]), S("top", [bx0, by1], [bx1, by1]), S("right", [bx1, oy0], [bx1, by1])] },
    { name: "corner_top_right_2side", cls: "corner", len: cx + h + dR + cy + h + dT, adm: dL >= h - EPS && dB >= h - EPS && dR >= -EPS && dT >= -EPS,
      sides: [S("bottom", [bx0, by0], [ox1, by0]), S("left", [bx0, by0], [bx0, oy1])] },
    { name: "corner_top_left_2side", cls: "corner", len: cx + h + dL + cy + h + dT, adm: dR >= h - EPS && dB >= h - EPS && dL >= -EPS && dT >= -EPS,
      sides: [S("bottom", [ox0, by0], [bx1, by0]), S("right", [bx1, by0], [bx1, oy1])] },
    { name: "corner_bottom_right_2side", cls: "corner", len: cx + h + dR + cy + h + dB, adm: dL >= h - EPS && dT >= h - EPS && dR >= -EPS && dB >= -EPS,
      sides: [S("top", [bx0, by1], [ox1, by1]), S("left", [bx0, oy0], [bx0, by1])] },
    { name: "corner_bottom_left_2side", cls: "corner", len: cx + h + dL + cy + h + dB, adm: dR >= h - EPS && dT >= h - EPS && dL >= -EPS && dB >= -EPS,
      sides: [S("top", [ox0, by1], [bx1, by1]), S("right", [bx1, oy0], [bx1, by1])] },
  ];
  const admissible = cands.filter(c => c.adm);
  if (!admissible.length) diagnostics.push("No valid TS 500 critical perimeter candidate inside slab boundary.");

  const colCenter: Point2 = [(x0 + x1) / 2, (y0 + y1) / 2];
  const activeOpenings = boundary.openings.filter(hole => distancePolygons(support.footprint, hole) <= 5 * d + EPS);
  const tangentRays = activeOpenings.map(hole => findTangentVertices(colCenter, hole));
  const isShadowed = (p: Point2) => tangentRays.some(({ vr, vl }) => inCone(colCenter, vr, vl, p));

  const evaluated = admissible.map(c => {
    const ev = evaluateCandidateSides(c.sides, boundary.outer, boundary.openings, colCenter, tangentRays, isShadowed);
    return { ...c, ev };
  });

  const cornerChecks: [string, number, number, number, number, string, string][] = [
    ["corner_top_right_2side", dR, dT, thR, thT, "edge_right_3side", "edge_top_3side"],
    ["corner_top_left_2side", dL, dT, thL, thT, "edge_left_3side", "edge_top_3side"],
    ["corner_bottom_right_2side", dR, dB, thR, thB, "edge_right_3side", "edge_bottom_3side"],
    ["corner_bottom_left_2side", dL, dB, thL, thB, "edge_left_3side", "edge_bottom_3side"],
  ];
  const intCand = evaluated.find(c => c.name === "interior_4side");
  for (const [cName, d1, d2, t1, t2, e1Name, e2Name] of cornerChecks) {
    const cCand = evaluated.find(c => c.name === cName);
    const e1Cand = evaluated.find(c => c.name === e1Name);
    const e2Cand = evaluated.find(c => c.name === e2Name);
    if (cCand) {
      const minCompeting = Math.min(
        intCand ? intCand.len : Infinity,
        e1Cand ? e1Cand.len : Infinity,
        e2Cand ? e2Cand.len : Infinity
      );
      const outsideUnambiguousProx = (d1 > t1 + EPS) || (d2 > t2 + EPS);
      if (outsideUnambiguousProx && cCand.len < minCompeting - EPS) {
        diagnostics.push(
          "Corner candidate eligibility with clearances outside unambiguous proximity (d1 > th1 or d2 > th2 while corner < interior/edge) is normatively ambiguous in TS 500; marked unsupported."
        );
        break;
      }
    }
  }

  if (evaluated.length > 1) {
    const byNominal = [...evaluated].sort((a, b) => Math.abs(a.len - b.len) > 1e-8 ? a.len - b.len : ({ interior: 0, edge: 1, corner: 2 })[a.cls] - ({ interior: 0, edge: 1, corner: 2 })[b.cls]);
    const byNet = [...evaluated].sort((a, b) => Math.abs(a.ev.kept - b.ev.kept) > 1e-8 ? a.ev.kept - b.ev.kept : ({ interior: 0, edge: 1, corner: 2 })[a.cls] - ({ interior: 0, edge: 1, corner: 2 })[b.cls]);
    if (byNominal[0].name !== byNet[0].name) {
      diagnostics.push(
        "Competing critical perimeter candidates with differential opening shadow reductions have no normative ordering in TS 500; marked unsupported."
      );
    }
  }

  const candSummary = evaluated.map(c => ({
    name: c.name,
    classification: c.cls,
    nominalLengthM: c.len,
    retainedLengthM: c.ev.kept,
    admissible: c.adm
  }));

  if (diagnostics.length || !admissible.length) {
    return {
      supportId: support.id, effectiveDepthM: d, segments: [], fullLengthM: 0, clippedLengthM: 0, retainedLengthM: 0,
      retainedBySide: { left: 0, right: 0, bottom: 0, top: 0 }, classification: "interior", geometryStatus: "unsupported",
      diagnostics, method: "ts500-shortest-contour-shadow-v1", candidateEvidence: { selectedCandidate: "none", candidates: candSummary }, engineeringAcceptance: false
    };
  }

  const sortedCandidates = [...evaluated].sort((a, b) => Math.abs(a.len - b.len) > 1e-8 ? a.len - b.len : ({ interior: 0, edge: 1, corner: 2 })[a.cls] - ({ interior: 0, edge: 1, corner: 2 })[b.cls]);
  const chosen = sortedCandidates[0];
  const kept = chosen.ev.kept;
  if (kept <= EPS) throw Error("No punching perimeter remains inside the slab.");
  return {
    supportId: support.id,
    effectiveDepthM: d,
    segments: chosen.ev.segments,
    fullLengthM: chosen.len,
    clippedLengthM: Math.max(0, chosen.len - kept),
    retainedLengthM: kept,
    retainedBySide: chosen.ev.retained,
    classification: chosen.cls,
    geometryStatus: "solved",
    diagnostics: [],
    method: "ts500-shortest-contour-shadow-v1",
    candidateEvidence: { selectedCandidate: chosen.name, candidates: candSummary },
    engineeringAcceptance: false
  };
}
