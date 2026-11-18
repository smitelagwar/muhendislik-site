import {analyzeSlabTopology,type SlabPanelGeometry} from "./slab-geometry";
import {beamCapacity,validateBeamBars,type BeamBar,type BeamMaterial,type BeamSection} from "./rc-beam-section";
import type {SlabShellResultant} from "./slab-forces";
import {
  computeTS500PunchingContour,
  type TS500PunchingPerimeter,
  type SlabBoundary,
  type PunchingSupport,
  type InteriorPunchingAction,
} from "./punching-shear";

export type ReviewStatus =
  | "taslak_muhendis_incelemesi_gerekli"
  | "onayli"
  | "reddedildi";

export type SlabBarZone={id:string;panelId:string;zoneId:string;direction:"X"|"Y";face:"top"|"bottom";diameterMm:number;spacingM:number;extra:boolean;source:string;evidence:string};
export type SlabDesignPanel={geometry:SlabPanelGeometry;zones:readonly SlabBarZone[]};
const area=(d:number)=>Math.PI*d*d/4;

export type SlabPunchingCheckRequest = {
  id: string;
  panelId?: string;
  boundary: SlabBoundary;
  support: PunchingSupport;
  effectiveDepthM: number;
  action?: InteriorPunchingAction;
  material?: { fctdMPa: number; source: string; evidence: string };
  expectedCurrent?: { modelRevision: string; stiffnessSet: string; analysisStamp: string };
};

export type SlabPunchingCheckResult = {
  id: string;
  panelId?: string;
  supportId: string;
  status: "passed" | "failed" | "unsupported";
  reviewStatus: ReviewStatus;
  classification: "interior" | "edge" | "corner";
  perimeter: TS500PunchingPerimeter;
  action?: InteriorPunchingAction & { eccentricityXM: number; eccentricityYM: number; signedVpdKn: number };
  gamma?: number;
  VpdKn?: number;
  VprKn?: number;
  utilization?: number;
  passed?: boolean;
  reason?: string;
  diagnostics: readonly string[];
  engineeringAcceptance: false;
  sourceClauses: readonly string[];
};

/** Evaluates TS 500 slab punching contour and capacity, propagating unsupported status and preventing silent pass. */
export function checkSlabPunching(request: SlabPunchingCheckRequest): SlabPunchingCheckResult {
  if (!request.id || typeof request.id !== "string" || !request.id.trim()) {
    throw Error("Punching check request requires a valid non-empty id string.");
  }
  if (!Number.isFinite(request.effectiveDepthM) || request.effectiveDepthM <= 0) {
    throw Error("Punching check requires a positive finite effective depth.");
  }
  if (!request.support || !request.boundary) {
    throw Error("Punching check requires valid boundary and support geometry.");
  }
  if (!request.support.id || typeof request.support.id !== "string" || !request.support.id.trim()) {
    throw Error("Punching support requires a valid non-empty id.");
  }
  if (request.support.kind !== "column") {
    throw Error("TS 500 slab punching check currently requires a column support footprint.");
  }
  if (
    !Array.isArray(request.support.origin) ||
    request.support.origin.length !== 2 ||
    !request.support.origin.every(Number.isFinite)
  ) {
    throw Error("Punching support origin must be a finite 2D point.");
  }
  if (!Array.isArray(request.support.footprint) || request.support.footprint.length !== 4) {
    throw Error("Punching support footprint must be a 4-point polygon.");
  }

  // 1. Geometry contour computation using verified TS 500 entrypoint
  const perimeter = computeTS500PunchingContour({
    boundary: request.boundary,
    support: request.support,
    effectiveDepthM: request.effectiveDepthM,
  });

  // 2. Geometry unsupported handling (irregular proximity, differential shadow conflict, aspect ratio, etc.)
  if (perimeter.geometryStatus !== "solved") {
    const reason = perimeter.diagnostics.length
      ? perimeter.diagnostics.join("; ")
      : "TS 500 critical contour is geometrically unsupported for this configuration.";
    return {
      id: request.id,
      panelId: request.panelId,
      supportId: request.support.id,
      status: "unsupported",
      reviewStatus: "taslak_muhendis_incelemesi_gerekli",
      classification: perimeter.classification,
      perimeter,
      reason,
      diagnostics: perimeter.diagnostics,
      engineeringAcceptance: false,
      sourceClauses: ["TS 500:2000 Madde 8.3.1, Şekil 8.5 (geometrik sınır kapısı)"],
    };
  }

  // 3. Pure geometry audit case: if no action and no material are specified
  if (!request.action && !request.material) {
    return {
      id: request.id,
      panelId: request.panelId,
      supportId: request.support.id,
      status: "passed",
      reviewStatus: "onayli",
      classification: perimeter.classification,
      perimeter,
      diagnostics: [],
      engineeringAcceptance: false,
      sourceClauses: ["TS 500:2000 Madde 8.3.1, Şekil 8.5 (geometrik kritik çevre)"],
    };
  }

  // 4. Physical capacity check requested: validate all runtime action and material inputs
  if (!request.action || !request.material || !request.expectedCurrent) {
    throw Error("Complete action, material, and expectedCurrent are required for physical punching capacity check.");
  }

  const a = request.action;
  const m = request.material;
  const exp = request.expectedCurrent;

  if (
    !Number.isFinite(m.fctdMPa) ||
    m.fctdMPa <= 0 ||
    !m.source?.trim() ||
    !m.evidence?.trim() ||
    !a.source?.trim() ||
    !Number.isFinite(a.NaboveKn) ||
    !Number.isFinite(a.NbelowKn) ||
    !Number.isFinite(a.FaKn) ||
    !Array.isArray(a.MxAdjacentKnM) ||
    a.MxAdjacentKnM.length !== 2 ||
    !a.MxAdjacentKnM.every(Number.isFinite) ||
    !Array.isArray(a.MyAdjacentKnM) ||
    a.MyAdjacentKnM.length !== 2 ||
    !a.MyAdjacentKnM.every(Number.isFinite)
  ) {
    throw Error("Action tuple, moments, or material properties contain non-finite or invalid values.");
  }

  if (
    a.modelRevision !== exp.modelRevision ||
    a.stiffnessSet !== exp.stiffnessSet ||
    a.analysisStamp !== exp.analysisStamp
  ) {
    throw Error("Punching action packet does not match current model revision, stiffness set, or analysis stamp.");
  }

  // Edge, corner, or opening-clipped contours:
  // TS 500 equations 8.21/8.24 are strictly derived for uncut interior rectangular columns.
  // Capacity for edge, corner, or opening-clipped columns is normatively unstandardized in TS 500.
  if (perimeter.classification !== "interior" || perimeter.clippedLengthM > 1e-9) {
    const reason = `TS 500 Madde 8.3.1 Denklem 8.21/8.24 yalnızca kesilmemiş iç dikdörtgen kolon zımbalama kapasitesini tanımlar; ${perimeter.classification} veya açıklıkla kesilmiş çevre için kapasite normatif olarak desteklenmemektedir (mühendis incelemesi gereklidir).`;
    return {
      id: request.id,
      panelId: request.panelId,
      supportId: request.support.id,
      status: "unsupported",
      reviewStatus: "taslak_muhendis_incelemesi_gerekli",
      classification: perimeter.classification,
      perimeter,
      reason,
      diagnostics: [reason],
      engineeringAcceptance: false,
      sourceClauses: ["TS 500:2000 Madde 8.3.1 (iç kolon sınırlandırması)"],
    };
  }

  // Interior rectangular column punching capacity per TS 500:2000 Eq. 8.20, 8.21, 8.24
  const nDiff = a.NbelowKn - a.NaboveKn;
  if (Math.abs(nDiff) <= 1e-9) {
    throw Error("TS 500 eccentricity requires a nonzero above/below axial force difference.");
  }

  const eX = (0.4 * Math.abs(a.MxAdjacentKnM[0] + a.MxAdjacentKnM[1])) / Math.abs(nDiff);
  const eY = (0.4 * Math.abs(a.MyAdjacentKnM[0] + a.MyAdjacentKnM[1])) / Math.abs(nDiff);
  const xs = request.support.footprint.map(p => p[0]);
  const ys = request.support.footprint.map(p => p[1]);
  const bx = Math.max(...xs) - Math.min(...xs) + perimeter.effectiveDepthM;
  const by = Math.max(...ys) - Math.min(...ys) + perimeter.effectiveDepthM;

  const gamma = 1 / (1 + (1.5 * (eX + eY)) / Math.sqrt(bx * by));
  const signedVpd = nDiff - a.FaKn;
  const vpdKn = Math.abs(signedVpd);
  const vprKn = gamma * m.fctdMPa * 1000 * perimeter.retainedLengthM * perimeter.effectiveDepthM;
  const utilization = vpdKn / vprKn;

  if (!Number.isFinite(vprKn) || vprKn <= 0) {
    throw Error("Punching capacity calculation resulted in non-positive or non-finite value.");
  }

  const passed = vpdKn <= vprKn + 1e-8;

  // Preserve failed physical capacity / status distinctions:
  // If vpdKn > vprKn, physical capacity fails -> status: "failed", reviewStatus: "reddedildi"!
  if (!passed) {
    const reason = `Zımbalama kapasitesi aşıldı: Vpd (${vpdKn.toFixed(1)} kN) > Vpr (${vprKn.toFixed(1)} kN), kullanım oranı: ${(utilization * 100).toFixed(1)}%.`;
    return {
      id: request.id,
      panelId: request.panelId,
      supportId: request.support.id,
      status: "failed",
      reviewStatus: "reddedildi",
      classification: perimeter.classification,
      perimeter,
      action: { ...a, eccentricityXM: eX, eccentricityYM: eY, signedVpdKn: signedVpd },
      gamma,
      VpdKn: vpdKn,
      VprKn: vprKn,
      utilization,
      passed: false,
      reason,
      diagnostics: [reason],
      engineeringAcceptance: false,
      sourceClauses: ["TS 500:2000 Madde 8.3.1, Denklem 8.20, 8.21, 8.24"],
    };
  }

  return {
    id: request.id,
    panelId: request.panelId,
    supportId: request.support.id,
    status: "passed",
    reviewStatus: "onayli",
    classification: perimeter.classification,
    perimeter,
    action: { ...a, eccentricityXM: eX, eccentricityYM: eY, signedVpdKn: signedVpd },
    gamma,
    VpdKn: vpdKn,
    VprKn: vprKn,
    utilization,
    passed: true,
    diagnostics: [],
    engineeringAcceptance: false,
    sourceClauses: ["TS 500:2000 Madde 8.3.1, Denklem 8.20, 8.21, 8.24"],
  };
}

export function checkSlabPunchingBatch(input: {
  modelRevision: string;
  expectedCurrent?: { modelRevision: string; stiffnessSet: string; analysisStamp: string };
  checks: readonly SlabPunchingCheckRequest[];
}): {
  status: "checked" | "unsupported" | "failed";
  reviewStatus: ReviewStatus;
  results: SlabPunchingCheckResult[];
  allPassed: boolean;
  engineeringAcceptance: false;
  unsupportedReasons: string[];
} {
  if (!input.modelRevision) throw Error("Model revision is required.");
  if (!Array.isArray(input.checks)) throw Error("Checks must be an array.");
  const results = input.checks.map(c => {
    if (input.expectedCurrent && !c.expectedCurrent) {
      return checkSlabPunching({ ...c, expectedCurrent: input.expectedCurrent });
    }
    return checkSlabPunching(c);
  });
  const anyFailed = results.some(r => r.status === "failed");
  const anyUnsupported = results.some(r => r.status === "unsupported");
  const reviewStatus: ReviewStatus = anyFailed
    ? "reddedildi"
    : anyUnsupported
    ? "taslak_muhendis_incelemesi_gerekli"
    : "onayli";
  const status = anyFailed
    ? "failed" as const
    : anyUnsupported
    ? "unsupported" as const
    : "checked" as const;
  const unsupportedReasons = results
    .filter(r => r.status === "unsupported" && r.reason)
    .map(r => `[${r.id}] ${r.reason}`);
  return {
    status,
    reviewStatus,
    results,
    allPassed: results.every(r => r.status === "passed"),
    engineeringAcceptance: false as const,
    unsupportedReasons,
  };
}

/** Audits complete real geometry, laid-out bar scopes, and slab punching checks without inventing defaults. */
export function reviewSlabDesign(input:{
  modelRevision:string;
  expectedPanelIds:readonly string[];
  coverage:"complete"|"partial";
  panels:readonly SlabDesignPanel[];
  punchingChecks?:readonly SlabPunchingCheckRequest[];
  expectedCurrent?:{modelRevision:string;stiffnessSet:string;analysisStamp:string};
}){
 if(!input.modelRevision||!input.expectedPanelIds.length||new Set(input.expectedPanelIds).size!==input.expectedPanelIds.length||input.coverage!=="complete"||panelsInvalid(input.panels,input.expectedPanelIds))throw Error("Complete, unique slab registry for the current model revision is required.");
 const panels=input.panels.map(p=>{
  if(p.geometry.modelRevision!==input.modelRevision)throw Error(`Panel ${p.geometry.id} is from a stale model revision.`);
  const topology=analyzeSlabTopology(p.geometry),zones=p.zones;if(zones.some(z=>z.panelId!==p.geometry.id||!z.id||!z.zoneId||!z.source?.trim()||!z.evidence?.trim()||!Number.isFinite(z.diameterMm)||z.diameterMm<=0||!Number.isFinite(z.spacingM)||z.spacingM<=0||!["X","Y"].includes(z.direction)||!["top","bottom"].includes(z.face)||typeof z.extra!=="boolean"))throw Error(`Panel ${p.geometry.id} has invalid laid-out reinforcement.`);
  if(new Set(zones.map(z=>z.id)).size!==zones.length)throw Error(`Panel ${p.geometry.id} has duplicate reinforcement-zone identities.`);
  const layers=( ["top","bottom"] as const).flatMap(face=>(["X","Y"] as const).map(direction=>({face,direction}))),coverage=layers.map(layer=>({ ...layer,present:zones.some(z=>z.face===layer.face&&z.direction===layer.direction),providedAsMm2PerM:zones.filter(z=>z.face===layer.face&&z.direction===layer.direction).reduce((s,z)=>s+area(z.diameterMm)/z.spacingM,0),extraAsMm2PerM:zones.filter(z=>z.face===layer.face&&z.direction===layer.direction&&z.extra).reduce((s,z)=>s+area(z.diameterMm)/z.spacingM,0),zoneIds:zones.filter(z=>z.face===layer.face&&z.direction===layer.direction).map(z=>z.zoneId)}));
  return {panelId:p.geometry.id,topology,reinforcement:{layers:coverage,complete:coverage.every(x=>x.present)},actualBarZoneCount:zones.length};
 });

 const punching = input.punchingChecks
  ? checkSlabPunchingBatch({
      modelRevision: input.modelRevision,
      expectedCurrent: input.expectedCurrent,
      checks: input.punchingChecks,
    })
  : undefined;

 const panelsReady = panels.every(p=>p.topology.status==="solved"&&p.reinforcement.complete);
 const anyPunchingFailed = punching?.status === "failed";
 const anyPunchingUnsupported = punching?.status === "unsupported";

 const reviewStatus: ReviewStatus = anyPunchingFailed
  ? "reddedildi"
  : (anyPunchingUnsupported || !panelsReady)
  ? "taslak_muhendis_incelemesi_gerekli"
  : "onayli";

 const status = anyPunchingFailed
  ? "failed" as const
  : anyPunchingUnsupported
  ? "unsupported" as const
  : panelsReady
  ? "scope_ready" as const
  : "incomplete" as const;

 const unsupported=["This function audits geometry and bar-zone inventory only; computed bending capacity requires designOneWaySlabStrip or designSlabShellZones with current P06 forces.","Band-beam and flat-slab two-stage design profiles are unsupported; nonzero Mxy twisting interaction gates the shell profile.","General 2D cracked-shell service, long-term slab creep, slab crack-width checks and automatic bar selection/detailing are unsupported.","Native slab/material/reinforcement transfer has not been accepted."];
 if (punching?.unsupportedReasons.length) {
   unsupported.push(...punching.unsupportedReasons);
 }

 return {
   status,
   reviewStatus,
   modelRevision:input.modelRevision,
   panels,
   allPanelsCovered:true,
   punchingChecks:punching?.results,
   engineeringAcceptance:false as const,
   unsupported,
   source:"Explicit panel boundary/support/opening and laid-out bar-zone audit with verified TS 500 punching contour status propagation"
 };
}

export type SlabMomentDemand={id:string;loadCaseId:string;modelRevision:string;stiffnessSet:string;analysisStamp:string;source:string;stationMm:number;momentKnmPerM:number;kind:"deterministic"};
export type SlabStripBar=(BeamBar&{direction:"span";source:string;evidence:string})|(BeamBar&{direction:"distribution";stationMm:number;source:string;evidence:string});
/** One-way 1 m slab strip using real stamped demands and actual top/bottom bar coordinates. */
export function designOneWaySlabStrip(input:{id:string;modelRevision:string;stiffnessSet:string;analysisStamp:string;spanMm:number;thicknessMm:number;coverMm:number;aggregateMm:number;material:BeamMaterial;demands:readonly SlabMomentDemand[];expectedDemandIds:readonly string[];demandCoverage:"complete"|"partial";bars:readonly SlabStripBar[];direction:"X"|"Y";workingType:"one_way_x"|"one_way_y"|"cantilever";supportCase:"simple"|"continuous"|"cantilever";source:string}){
 if(!input.id||!input.source?.trim()||!input.modelRevision||!input.stiffnessSet||!input.analysisStamp||![input.spanMm,input.thicknessMm,input.coverMm,input.aggregateMm].every(v=>Number.isFinite(v)&&v>0)||input.coverMm<15||!input.demands.length||!input.expectedDemandIds.length||input.demandCoverage!=="complete"||new Set(input.demands.map(d=>d.id)).size!==input.demands.length||new Set(input.expectedDemandIds).size!==input.expectedDemandIds.length||input.demands.length!==input.expectedDemandIds.length||input.expectedDemandIds.some(id=>!input.demands.some(d=>d.id===id))||!input.bars.length)throw Error("Complete one-way slab-strip geometry, actual reinforcement and demand cases required.");
 if(input.workingType!=="cantilever"&&input.workingType!==(input.direction==="X"?"one_way_x":"one_way_y"))throw Error("Slab strip span direction contradicts the panel topology.");
 if((input.workingType==="cantilever")!==(input.supportCase==="cantilever"))throw Error("Cantilever topology and slab support case must agree.");
 const section:BeamSection={bw:1000,h:input.thicknessMm,bf:1000,hf:0},main=input.bars.filter(b=>b.direction==="span"),distribution=input.bars.filter(b=>b.direction==="distribution");validateBeamBars(section,main);if(!main.length||!distribution.length)throw Error("Actual spanning and transverse distribution reinforcement are both required.");
 if(input.bars.some(b=>!b.source?.trim()||!b.evidence?.trim()||b.y-b.diameter/2<input.coverMm||section.h-b.y-b.diameter/2<input.coverMm||b.face==="side"||b.face==="bottom"&&b.y<section.h/2||b.face==="top"&&b.y>section.h/2||b.direction==="distribution"&&(!Number.isFinite(b.stationMm)||b.stationMm<0||b.stationMm>input.spanMm)))throw Error("Actual reinforcement does not satisfy the declared coordinates, source, face or clear cover.");
 const byFace=(face:"top"|"bottom")=>main.filter(b=>b.face===face),mainBottom=byFace("bottom").reduce((s,b)=>s+Math.PI*b.diameter*b.diameter/4,0),mainTop=byFace("top").reduce((s,b)=>s+Math.PI*b.diameter*b.diameter/4,0),asMin=(input.material.fyk>=500?.002:.002)*1000*input.thicknessMm;
 const mainGaps=(face:"top"|"bottom")=>{const xs=[...new Set(main.filter(b=>b.face===face).map(b=>b.x))].sort((a,b)=>a-b);return Math.max(...xs.slice(1).map((x,i)=>x-xs[i]),500-xs.at(-1)!,xs[0]+500);},maxMainGapTop=mainGaps("top"),maxMainGapBottom=mainGaps("bottom"),maxMainGap=Math.max(maxMainGapTop,maxMainGapBottom),mainSpacingLimit=Math.min(1.5*input.thicknessMm,200);
 const distributionPositions=[...new Set(distribution.map(b=>b.stationMm))].sort((a,b)=>a-b),distGaps=distributionPositions.slice(1).map((x,i)=>x-distributionPositions[i]),maxDistGap=Math.max(...distGaps,input.spanMm-distributionPositions.at(-1)!,distributionPositions[0]),distributionArea=distribution.reduce((s,b)=>s+Math.PI*b.diameter*b.diameter/4,0)*1000/input.spanMm;
 const minDistribution=Math.max(mainBottom,mainTop)/5,distributionSpacingLimit=300;
 if(input.demands.some(d=>d.kind!=="deterministic"||!d.id||!d.loadCaseId||d.modelRevision!==input.modelRevision||d.stiffnessSet!==input.stiffnessSet||d.analysisStamp!==input.analysisStamp||!d.source?.trim()||!Number.isFinite(d.stationMm)||d.stationMm<0||d.stationMm>input.spanMm||!Number.isFinite(d.momentKnmPerM)))throw Error("Stale, unscoped or invalid slab strip demand.");
 const thicknessLimit={simple:25,continuous:30,cantilever:12}[input.supportCase],thicknessOK=input.thicknessMm>=80&&input.spanMm/input.thicknessMm<=thicknessLimit;
 const clearSpacingMin=Math.max(20,...main.map(b=>b.diameter),4*input.aggregateMm/3);let barClear=true;
 for(let i=0;i<main.length;i++)for(let j=0;j<i;j++)if(main[i].face===main[j].face&&Math.hypot(main[i].x-main[j].x,main[i].y-main[j].y)-(main[i].diameter+main[j].diameter)/2<clearSpacingMin-1e-8)barClear=false;
 const results=input.demands.map(d=>{const sign:demandSign=d.momentKnmPerM>=0?1:-1,bars=main,capacity=beamCapacity(section,bars,input.material,sign),required=requiredAreaForActualBars(section,bars,input.material,sign,d.momentKnmPerM);
  const tensionFace=sign===1?"bottom":"top",tensionArea=(tensionFace==="bottom"?mainBottom:mainTop),areaOK=required.status==="solved"&&tensionArea+1e-8>=Math.max(asMin,required.requiredAreaMm2??Infinity),passed=capacity.status==="solved"&&capacity.capacityKnm+1e-8>=Math.abs(d.momentKnmPerM)&&capacity.maximumSatisfied&&capacity.strainLimitSatisfied&&areaOK&&thicknessOK;
  return {demandId:d.id,loadCaseId:d.loadCaseId,stationMm:d.stationMm,momentKnmPerM:d.momentKnmPerM,tensionFace,providedAsMm2PerM:tensionArea,minimumAsMm2PerM:asMin,required,capacity,utilization:capacity.status==="solved"&&capacity.capacityKnm>0?Math.abs(d.momentKnmPerM)/capacity.capacityKnm:null,passed};
 });
 const layoutChecks={minimumThicknessAndRatio:thicknessOK,mainMinimumAsPerM:mainBottom>=asMin,topReserveRequired:results.some(r=>r.tensionFace==="top")?mainTop>=asMin:true,mainSpacing:maxMainGap<=mainSpacingLimit,minimumClearSpacing:barClear,distributionMinimum:distributionArea>=minDistribution,distributionSpacing:maxDistGap<=distributionSpacingLimit,netCover:input.bars.every(b=>b.y-b.diameter/2>=15&&section.h-b.y-b.diameter/2>=15)};
 return {status:results.every(r=>r.passed)&&Object.values(layoutChecks).every(Boolean)?"checked" as const:"failed" as const,id:input.id,modelRevision:input.modelRevision,stiffnessSet:input.stiffnessSet,analysisStamp:input.analysisStamp,spanMm:input.spanMm,thicknessMm:input.thicknessMm,direction:input.direction,workingType:input.workingType,supportCase:input.supportCase,section,bars:input.bars,results,layoutChecks:{...layoutChecks,mainMinimumAsPerM:{provided:mainBottom,required:asMin},topMinimumAsPerM:{provided:mainTop,required:asMin},maximumMainSpacingMm:{provided:maxMainGap,top:maxMainGapTop,bottom:maxMainGapBottom,limit:mainSpacingLimit},minimumClearSpacingMm:{limit:clearSpacingMin},distributionAreaMm2PerM:{provided:distributionArea,required:minDistribution},maximumDistributionSpacingMm:{provided:maxDistGap,limit:distributionSpacingLimit},thicknessRatio:{spanToThickness:input.spanMm/input.thicknessMm,max:thicknessLimit,minThicknessMm:80}},allDemandsCovered:true,source:input.source,sourceClauses:["TS 500:2000 7.1, 11.2.2–11.2.3 (one-way slab thickness, flexural steel, distribution steel, spacing, and cover)"],scope:"one-way strip flexure with exact stamped demand registry; no two-way panel capacity",engineeringAcceptance:false as const};
}
type demandSign=1|-1;
function requiredAreaForActualBars(section:BeamSection,bars:readonly BeamBar[],material:BeamMaterial,sign:demandSign,moment:number){
 const face=sign===1?"bottom":"top",group=bars.filter(b=>b.face===face),provided=group.reduce((s,b)=>s+Math.PI*b.diameter*b.diameter/4,0);if(!group.length)return {status:"missing_tension_face" as const,requiredAreaMm2:null as number|null};
 const evaluate=(factor:number)=>{const scaled=bars.map(b=>b.face===face?{...b,diameter:b.diameter*Math.sqrt(factor)}:b);try{return beamCapacity(section,scaled,material,sign);}catch{return null;}};
 const max=evaluate(1);if(!max||max.status!=="solved"||max.capacityKnm+1e-9<Math.abs(moment))return {status:"insufficient_actual_layout" as const,requiredAreaMm2:null as number|null};
 let lo=1e-8,hi=1;for(let i=0;i<55;i++){const mid=(lo+hi)/2,c=evaluate(mid);if(c?.status==="solved"&&c.capacityKnm>=Math.abs(moment))hi=mid;else lo=mid;}
 return {status:"solved" as const,requiredAreaMm2:provided*hi,method:"strain-compatible section equilibrium with actual bar coordinates"};
}

export type SlabShellBarZone={id:string;shellId:string;panelId:string;modelRevision:string;stiffnessSet:string;analysisStamp:string;source:string;barsX:readonly BeamBar[];barsY:readonly BeamBar[]};
/** Actual P06 shell moments → separate local X/Y slab strip section checks; nonzero twisting remains gated. */
export function designSlabShellZones(input:{shells:readonly SlabShellResultant[];zones:readonly SlabShellBarZone[];expectedShellIds:readonly string[];expectedPanelIds:readonly string[];coverage:"complete"|"partial";expectedCurrent:{modelRevision:string;stiffnessSet:string;analysisStamp:string};material:BeamMaterial;thicknessByPanelMm:Readonly<Record<string,number>>;twistingMomentToleranceKnmPerM:number}){
 if(input.coverage!=="complete"||!input.expectedShellIds.length||!input.expectedPanelIds.length||input.shells.length!==input.expectedShellIds.length||input.zones.length!==input.expectedShellIds.length||new Set(input.expectedShellIds).size!==input.expectedShellIds.length||new Set(input.expectedPanelIds).size!==input.expectedPanelIds.length||new Set(input.shells.map(s=>s.shellId)).size!==input.shells.length||new Set(input.zones.map(z=>z.shellId)).size!==input.zones.length||input.expectedShellIds.some(id=>!input.shells.some(s=>s.shellId===id)||!input.zones.some(z=>z.shellId===id))||input.expectedPanelIds.some(id=>!input.shells.some(s=>s.panelId===id)))throw Error("Complete current shell and physical panel/bar-zone coverage required.");
 if(!Number.isFinite(input.twistingMomentToleranceKnmPerM)||input.twistingMomentToleranceKnmPerM<0)throw Error("Explicit nonnegative twisting-moment tolerance required.");
 const panels=input.shells.map(s=>{
  const z=input.zones.find(q=>q.shellId===s.shellId)!;if(s.panelId!==z.panelId||z.modelRevision!==input.expectedCurrent.modelRevision||z.stiffnessSet!==input.expectedCurrent.stiffnessSet||z.analysisStamp!==input.expectedCurrent.analysisStamp||s.modelRevision!==input.expectedCurrent.modelRevision||s.stiffnessSet!==input.expectedCurrent.stiffnessSet||s.analysisStamp!==input.expectedCurrent.analysisStamp||!z.source?.trim()||!s.source?.trim())throw Error("Stale/mismatched shell-resultant and reinforcement zone.");
  const h=input.thicknessByPanelMm[s.panelId];if(!Number.isFinite(h)||h<80||!z.barsX.length||!z.barsY.length)throw Error("Panel thickness and both actual top/bottom directional bar groups are required.");
  const section:BeamSection={bw:1000,h,bf:1000,hf:0},checkDirection=(direction:"X"|"Y",moment:number,bars:readonly BeamBar[])=>{
   validateBeamBars(section,bars);if(bars.some(b=>b.face==="side"||b.face==="bottom"&&b.y<h/2||b.face==="top"&&b.y>h/2))throw Error("Slab face label does not agree with actual bar depth coordinate.");
   const sign:demandSign=moment>=0?1:-1,tensionFace=sign===1?"bottom":"top",capacity=beamCapacity(section,bars,input.material,sign),requiredFlexure=requiredAreaForActualBars(section,bars,input.material,sign,moment),provided=bars.filter(b=>b.face===tensionFace).reduce((v,b)=>v+Math.PI*b.diameter*b.diameter/4,0),minimum=.0015*1000*h,xs=[...new Set(bars.filter(b=>b.face===tensionFace).map(b=>b.x))].sort((a,b)=>a-b),maxSpacing=Math.max(...xs.slice(1).map((x,i)=>x-xs[i]),500-xs.at(-1)!,xs[0]+500),spacingLimit=Math.min(1.5*h,(direction==="X"?s.edgeLengthsM.x<=s.edgeLengthsM.y:s.edgeLengthsM.y<=s.edgeLengthsM.x)?200:250),passed=capacity.status==="solved"&&capacity.capacityKnm+1e-8>=Math.abs(moment)&&capacity.maximumSatisfied&&capacity.strainLimitSatisfied&&requiredFlexure.status==="solved"&&provided>=Math.max(minimum,requiredFlexure.requiredAreaMm2??Infinity)&&maxSpacing<=spacingLimit;
   return {direction,momentKnmPerM:moment,tensionFace,providedAsMm2PerM:provided,minimumAsMm2PerM:minimum,requiredFlexureAsMm2PerM:requiredFlexure.requiredAreaMm2,requiredFlexure,maxSpacingMm:maxSpacing,spacingLimitMm:spacingLimit,capacity,utilization:capacity.status==="solved"&&capacity.capacityKnm>0?Math.abs(moment)/capacity.capacityKnm:null,passed};
  };
  const results=[checkDirection("X",s.resultants.MxKnmPerM,z.barsX),checkDirection("Y",s.resultants.MyKnmPerM,z.barsY)],twisting=Math.abs(s.resultants.MxyKnmPerM),twistingSupported=twisting<=input.twistingMomentToleranceKnmPerM,combinedFaceMinimum=(["top","bottom"] as const).map(face=>{const ax=z.barsX.filter(b=>b.face===face).reduce((v,b)=>v+Math.PI*b.diameter*b.diameter/4,0),ay=z.barsY.filter(b=>b.face===face).reduce((v,b)=>v+Math.PI*b.diameter*b.diameter/4,0),ratio=(ax+ay)/(1000*h);return {face,ratio,minimum:.0035,passed:ratio>=.0035};});
  return {shellId:s.shellId,panelId:s.panelId,edgeLengthsM:s.edgeLengthsM,localAxes:s.localAxes,membrane:s.resultants,moments:results,combinedFaceMinimum,twistingMomentKnmPerM:s.resultants.MxyKnmPerM,twistingSupported,passed:twistingSupported&&results.every(r=>r.passed)&&combinedFaceMinimum.every(c=>c.passed)};
 });
 return {status:panels.every(p=>p.passed)?"checked" as const:panels.some(p=>!p.twistingSupported)?"unsupported" as const:"failed" as const,panels,allPanelsCovered:true,allShellsCovered:true,sourceClauses:["TS 500:2000 7.1, 11.4.2–11.4.5 (bending resistance and provided bidirectional steel)"],scope:"Q4/MITC4 shell mean Mx/My with independent local section checks; nonzero Mxy twisting interaction is unsupported",engineeringAcceptance:false as const};
}

export function checkSlabMeshConvergence(input:{coarse:{id:string;divisions:number;resultants:readonly SlabShellResultant[];expectedShellIds:readonly string[];coverage:"complete"|"partial"};fine:{id:string;divisions:number;resultants:readonly SlabShellResultant[];expectedShellIds:readonly string[];coverage:"complete"|"partial"};expectedPanelIds:readonly string[];relativeTolerance:number;absoluteFloor:number}){
 const {coarse,fine}=input;if(!coarse.id||!fine.id||coarse.divisions<=0||fine.divisions<=coarse.divisions||![input.relativeTolerance,input.absoluteFloor].every(v=>Number.isFinite(v)&&v>0)||!input.expectedPanelIds.length)throw Error("Ordered mesh pair, panel registry, and explicit convergence tolerance required.");
 const complete=(m:typeof coarse)=>m.coverage==="complete"&&m.expectedShellIds.length===m.resultants.length&&new Set(m.expectedShellIds).size===m.expectedShellIds.length&&new Set(m.resultants.map(r=>r.shellId)).size===m.resultants.length&&m.expectedShellIds.every(id=>m.resultants.some(r=>r.shellId===id))&&input.expectedPanelIds.every(p=>m.resultants.some(r=>r.panelId===p));
 if(!complete(coarse)||!complete(fine))throw Error("Mesh convergence requires every expected shell and panel result in both meshes.");
 const keys=["NxKnmPerM","NyKnmPerM","NxyKnmPerM","MxKnmPerM","MyKnmPerM","MxyKnmPerM"] as const;
 const rows=input.expectedPanelIds.flatMap(panelId=>keys.map(key=>{
  const peak=(m:typeof coarse)=>Math.max(...m.resultants.filter(r=>r.panelId===panelId).map(r=>Math.abs(r.resultants[key]))),a=peak(coarse),b=peak(fine),relative=Math.abs(a-b)/Math.max(b,input.absoluteFloor);return {panelId,resultant:key,coarsePeak:a,finePeak:b,relativeDifference:relative,passed:relative<=input.relativeTolerance};
 }));
 return {status:rows.every(r=>r.passed)?"converged" as const:"not_converged" as const,coarseMesh:{id:coarse.id,divisions:coarse.divisions},fineMesh:{id:fine.id,divisions:fine.divisions},rows,allPanelsCovered:true,coverage:"complete" as const,engineeringAcceptance:false as const,source:"Absolute shell resultant peaks over complete physical panel meshes; no omitted last panel"};
}
function panelsInvalid(panels:readonly SlabDesignPanel[],expected:readonly string[]){return panels.length!==expected.length||new Set(panels.map(p=>p.geometry.id)).size!==panels.length||panels.some(p=>!expected.includes(p.geometry.id))||expected.some(id=>!panels.some(p=>p.geometry.id===id));}
