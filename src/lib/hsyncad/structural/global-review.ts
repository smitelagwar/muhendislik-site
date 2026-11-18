import {classifySeismicUse,evaluateBasement,classifyBuildingHeight,requiredPerformance,type BKS,type BuildingLevel,type BasementEvidence} from "./building-classification";
import {control,fact,validateEngineeringReviews,type Fact,type EngineeringReviews,type GlobalControl} from "./global-control-types";
import {weakStoreys,slabDiscontinuity,planProjection,verticalDiscontinuity,torsionalIrregularity,softStorey,storeyDriftCheck,secondOrder,seismicGap,type ShearAreaInput} from "./global-checks";
import {selectSystem,directionalCompatibility,RC_SYSTEMS,type DirectionSystemInput} from "./system-selection";
import {deriveStoreyDemands,deriveWallDistribution,type StoreyDemandDefinition,type WallGroup,type RawSpectrum,type CouplingEvaluator} from "./global-demand";
import {responseSpectrum} from "./response-spectrum";
import {solveModalStructure,type ModalStructureInput} from "./modal-structure";
import {partitionBasementMass,accidentalDiaphragmSets} from "./dynamic-analysis-sets";
import {spectrumParameters,evaluateSpectrum,equivalentBaseShear,modalBaseScale,type StandardSpectrum} from "./design-spectrum";
import type {EigenOptions} from "./modal-eigen";
import {regionalModalForces} from "./global-regional-forces";
import {empiricalCoefficient,rayleighEquivalentPeriod} from "./global-period";
export type FloorGeometryInput={id:string;geometry:Parameters<typeof slabDiscontinuity>[1];projections:Parameters<typeof planProjection>[1];model:"shell"|"rigid"|"unknown"};
export type GlobalReviewInput={modelRevision:string;structure:ModalStructureInput;bks:Fact<BKS>;dd2:StandardSpectrum;dd3:StandardSpectrum;levels:BuildingLevel[];basement:BasementEvidence;
 nodeParts:Parameters<typeof partitionBasementMass>[1];roofExtensionExclusion:Fact<boolean>;systems:Record<"X"|"Y",Omit<DirectionSystemInput,"moments">>;reviews:EngineeringReviews;
 floorGeometry:FloorGeometryInput[];storeys:StoreyDemandDefinition[];shearAreas:{id:string;X:ShearAreaInput;Y:ShearAreaInput}[];
 walls:Record<"X"|"Y",WallGroup[]>;edgeAxes:Record<"X"|"Y",Fact<string[]>>;diaphragmDimensions:Parameters<typeof accidentalDiaphragmSets>[1];
 equivalentPeriod:Record<"X"|"Y",Fact<number>>;empiricalCt:Record<"X"|"Y",Fact<number>>;infill:Fact<"attached"|"separated">;separatedCapacitySource:string|null;
 adjacent:{required:Fact<boolean>;X:Omit<Parameters<typeof seismicGap>[0],"heightM"|"ownDisplacementM"|"R"|"I">;Y:Omit<Parameters<typeof seismicGap>[0],"heightM"|"ownDisplacementM"|"R"|"I">};maxCoefficientIterations:number};
function dominant(modal:Extract<ReturnType<typeof solveModalStructure>,{status:"solved"}>,direction:"X"|"Y"){
 const sorted=[...modal.modes].sort((a,b)=>(b.participation[direction]?.effectiveMass??0)-(a.participation[direction]?.effectiveMass??0));
 if(!sorted[0]||!sorted[0].participation[direction]||sorted[0].participation[direction].effectiveMass<=0)throw Error("No participating dominant mode.");return sorted[0].periodSeconds;
}
export function runGlobalReview(input:GlobalReviewInput,solverOptions:EigenOptions,couplingEvaluator?:CouplingEvaluator){
 try{
  if(!input.modelRevision?.trim()||!Number.isSafeInteger(input.maxCoefficientIterations)||input.maxCoefficientIterations<1||input.maxCoefficientIterations>8)throw Error("Revision and bounded coefficient iteration budget required.");
  validateEngineeringReviews(input.reviews);const before=JSON.stringify(input.structure),parameters=spectrumParameters(input.dd2);if(input.dd2.hazard!=="DD-2"||input.dd3.hazard!=="DD-3")throw Error("Distinct DD2 and DD3 inputs required.");
  const cls=classifySeismicUse(input.bks,{value:parameters.sds,source:input.dd2.dataSource}),checks:GlobalControl[]=[...cls.controls],basementEvidence=structuredClone(input.basement);let periodComparison:unknown=null;
  const solve=(s:ModalStructureInput)=>{const result=solveModalStructure(s,solverOptions);if(result.status!=="solved")throw Error(`Modal analysis failed: ${JSON.stringify(result)}`);return result;};
  if(fact(basementEvidence.hasBasement,"basement presence")&&basementEvidence.enclosingRigidSides.value!==null&&basementEvidence.enclosingRigidSides.value>=3){
   const sets=partitionBasementMass(input.structure,input.nodeParts,"Candidate enclosure only; actual period test pending."),whole=solve(input.structure),upper=solve(sets.upper);
   const correspondence=(["X","Y"] as const).map(d=>{const c=d==="X"?0:1,upperPeriod=dominant(upper,d),globalPeriod=dominant(whole,d);
    const candidates=whole.modes.map(mode=>({mode:mode.number,period:mode.periodSeconds,upperInfluenceMass:input.structure.nodes.reduce((sum,n,i)=>sum+(sets.upper.inertias.find(m=>m.nodeId===n.id)!.values[c])*mode.fullShape[6*i+c],0)**2})).sort((a,b)=>b.upperInfluenceMass-a.upperInfluenceMass);
    const corresponding=candidates[0];if(!corresponding||corresponding.upperInfluenceMass<=0)throw Error("No upper translational mode correspondence.");
    return {direction:d,upperPeriod,globalPeriod,corresponding,agreed:Math.abs(globalPeriod/corresponding.period-1)<1e-5};});
   const agreed=correspondence.every(c=>c.agreed);
   checks.push(control("basement_mode_correspondence","3.3.1.1","determined",correspondence,null,"Tüm kütlede baskın mod, üst kütle doğrultusunun en büyük katılımlı karşılığı ile karşılaştırılır; farklı aileler sessizce oranlanmaz.",[input.modelRevision]));
   if(!agreed)checks.push(control("basement_mode_selection","3.3.1.1","requires_engineering",correspondence,null,"Bodrum kaynaklı başka mod tüm-kütle katılımında baskın; hakim üst mod ailesi için mühendis doğrulaması gerekir.",[input.modelRevision]));
   basementEvidence.wholePeriod={value:agreed?{X:dominant(whole,"X"),Y:dominant(whole,"Y")}:null,source:`${input.modelRevision}: actual full-mass eigensolution; mode correspondence checked`};
   basementEvidence.upperMassOnlyPeriod={value:{X:dominant(upper,"X"),Y:dominant(upper,"Y")},source:`${input.modelRevision}: actual upper-mass eigensolution, identical stiffness`};periodComparison={whole:basementEvidence.wholePeriod,upper:basementEvidence.upperMassOnlyPeriod,correspondence};
  }
  if(fact(basementEvidence.hasBasement,"basement presence")){
   const top=basementEvidence.basementTopM.value;
   if(top!==null){for(const n of input.structure.nodes){const role=input.nodeParts.find(r=>r.nodeId===n.id),m=input.structure.inertias.find(m=>m.nodeId===n.id);
    if(!role||!m||role.part==="upper"&&n.position[2]<=top+1e-8||role.part==="basement"&&n.position[2]>top+1e-8||role.part==="excluded"&&m.values.some(v=>v!==0))throw Error("Basement mass roles conflict with physical elevations/nonzero mass.");}}
  }
  if(input.levels.some(l=>!input.structure.nodes.some(n=>Math.abs(n.position[2]-l.elevationM)<1e-8))||Math.abs(Math.max(...input.levels.map(l=>l.elevationM))-Math.max(...input.structure.nodes.map(n=>n.position[2])))>1e-8)throw Error("Declared levels do not match the physical model elevations.");
  const basement=evaluateBasement(basementEvidence),height=classifyBuildingHeight(input.levels,basement,cls.dts,input.roofExtensionExclusion);checks.push(basement.control,height.control);
  if(height.bys===null||height.heightM===null||height.baseM===null)return {status:"incomplete" as const,checks,periodComparison,engineeringAcceptance:false};
  checks.push(requiredPerformance(cls.dts,height.bys));
  if(new Set(input.floorGeometry.map(f=>f.id)).size!==input.floorGeometry.length)throw Error("Duplicate floor geometry IDs.");
  const ordered=[...input.storeys].sort((a,b)=>a.bottomM-b.bottomM);
  if(ordered.length!==input.shearAreas.length||ordered.some((s,i)=>s.id!==input.storeys[i].id||s.id!==input.shearAreas[i].id||i>0&&Math.abs(s.bottomM-ordered[i-1].topM)>1e-8))throw Error("Complete contiguous bottom-to-top storeys and matching shear areas required.");
  const floorsAtTop=ordered.map(s=>input.levels.find(l=>l.role!=="foundation"&&Math.abs(l.elevationM-s.topM)<1e-8)?.id);
  if(floorsAtTop.some(id=>!id)||floorsAtTop.length!==input.floorGeometry.length||floorsAtTop.some(id=>!input.floorGeometry.some(f=>f.id===id)))throw Error("Each storey-top level needs its own A2/A3 geometry coverage.");
  for(const floor of input.floorGeometry){const a2=slabDiscontinuity(floor.id,floor.geometry,input.reviews.A2,floor.model),a3=planProjection(floor.id,floor.projections,input.reviews.A3,floor.model);checks.push(a2.result,a2.modeling,a3.result,a3.modeling);}
  if(!input.floorGeometry.length)checks.push(control("floor_geometry","Table3.6","missing_data",null,null,"A2/A3 için kapsamlı kat planı girdisi eksik.",[]));checks.push(verticalDiscontinuity("project",input.reviews.B3));
  const weak=weakStoreys(input.shearAreas);checks.push(...weak.checks);
  const massSets=basement.rigid?partitionBasementMass(input.structure,input.nodeParts,"Verified3.3.1.1 period/enclosure conditions"):null;
  const methods:ModalStructureInput[]=[massSets?.upper??input.structure];
  let coefficients=Object.fromEntries((["X","Y"] as const).map(d=>{const row=RC_SYSTEMS[fact(input.systems[d].declaredCode,`${d} system`)];if(!row)throw Error("Unsupported RC system.");return [d,{R:Math.min(fact(input.systems[d].enteredR,`${d} entered R`),row.R),D:row.D}];})) as Record<"X"|"Y",{R:number;D:number}>;
  const iterations:unknown[]=[],visited=new Set<string>();let stable:false|{responses:Record<"X"|"Y",RawSpectrum>;selections:Record<"X"|"Y",ReturnType<typeof selectSystem>>;stamp:string}=false;
  for(let iteration=0;iteration<input.maxCoefficientIterations;iteration++){
   const signature=JSON.stringify(coefficients);if(visited.has(signature))return {status:"nonconverged" as const,reason:"R/system decision cycle detected.",checks,iterations,engineeringAcceptance:false};visited.add(signature);
   const stamp=`${input.modelRevision}:global:${iteration+1}:${signature}`,responses={} as Record<"X"|"Y",RawSpectrum>,selections={} as Record<"X"|"Y",ReturnType<typeof selectSystem>>;
   for(const d of ["X","Y"] as const){
    const r=responseSpectrum(methods[0],solverOptions,input.dd2,{id:d,orientation:"horizontal",purpose:"raw_modal",reduction:{...coefficients[d],I:cls.I},equivalentCheck:null},"CQC",.05);
    if(r.status!=="solved")return {status:"analysis_failed" as const,direction:d,diagnostic:r,checks,iterations,engineeringAcceptance:false};responses[d]=r;
    const moments=input.walls[d].length?deriveWallDistribution(methods[0],r,input.walls[d],input.edgeAxes[d],height.baseM,d,couplingEvaluator):null;
    selections[d]=selectSystem(d,{...input.systems[d],moments},cls.dts,height.bys,weak.factor);
   }
   if(JSON.stringify(input.structure)!==before)throw Error("Analysis input was mutated; previous result invalid.");
   const next={X:{R:selections.X.usedR,D:selections.X.D},Y:{R:selections.Y.usedR,D:selections.Y.D}};
   iterations.push({stamp,used:coefficients,rawBaseShear:{X:responses.X.baseShearKn,Y:responses.Y.baseShearKn},rawMaxDisplacement:{X:Math.max(...responses.X.nodes.map(n=>n.displacement.maxima[0])),Y:Math.max(...responses.Y.nodes.map(n=>n.displacement.maxima[1]))},selection:{X:selections.X,Y:selections.Y},invalidates:next.X.R!==coefficients.X.R||next.Y.R!==coefficients.Y.R?["all seismic force/displacement envelopes","global controls","member design dependencies","report snapshot"]:[]});
   if(next.X.R===null||next.Y.R===null){checks.push(...selections.X.checks,...selections.Y.checks);return {status:checks.some(c=>c.status==="fail")?"failed" as const:"incomplete" as const,checks,iterations,periodComparison,engineeringAcceptance:false};}
   if(next.X.R===coefficients.X.R&&next.Y.R===coefficients.Y.R&&next.X.D===coefficients.X.D&&next.Y.D===coefficients.Y.D){stable={responses,selections,stamp};break;}
   coefficients={X:{R:next.X.R,D:next.X.D},Y:{R:next.Y.R,D:next.Y.D}};
  }
  if(!stable)return {status:"nonconverged" as const,reason:"Coefficient iteration budget exhausted; no stale design accepted.",iterations,checks,engineeringAcceptance:false};
  checks.push(...stable.selections.X.checks,...stable.selections.Y.checks,directionalCompatibility(stable.selections.X,stable.selections.Y));
  const directional:Record<string,unknown>={};
  for(const d of ["X","Y"] as const){
   const definitions=basement.rigid?input.storeys.filter(s=>s.part==="upper"):input.storeys;
   const base=stable.responses[d],demands=deriveStoreyDemands(methods[0],base,definitions,d),accidental=accidentalDiaphragmSets(methods[0],input.diaphragmDimensions).filter(s=>s.direction===d),eccDemands=[];
   for(const e of accidental){const result=responseSpectrum(e.input,solverOptions,input.dd2,{id:d,orientation:"horizontal",purpose:"raw_modal",reduction:{...coefficients[d],I:cls.I},equivalentCheck:null},"CQC",.05);if(result.status!=="solved")return {status:"analysis_failed" as const,diagnostic:result,checks,iterations,engineeringAcceptance:false};eccDemands.push({id:e.id,demands:deriveStoreyDemands(e.input,result,definitions,d)});}
   for(let i=0;i<demands.length;i++){
    for(const e of eccDemands){const demand=e.demands[i];checks.push(torsionalIrregularity(`${d}:${demand.id}:${e.id}`,demand.pairs.map(p=>p.amplitudeM),e.id,true));
     const neighbors=[e.demands[i-1],e.demands[i+1]].filter((v):v is typeof demand=>!!v);if(neighbors.length)checks.push(softStorey(`${d}:${demand.id}:${e.id}`,{drift:demand.stats.rigidMean,height:demand.heightM},neighbors.map(n=>({drift:n.stats.rigidMean,height:n.heightM})),demand.part==="basement",e.id));}
   }
   const flags={A1:checks.some(c=>c.id.startsWith(`A1:${d}:`)&&c.finding===true),B2:checks.some(c=>c.id.startsWith(`B2:${d}:`)&&c.finding===true),B3:input.reviews.B3.present===true,decisionSource:stable.stamp};
   const periodProof=rayleighEquivalentPeriod(methods[0],height.baseM,d,solverOptions),periodRaw=periodProof.periodSeconds,ctProof=empiricalCoefficient(input.structure,input.walls[d],stable.selections[d].selectedCode,height.heightM,d),ct=ctProof.Ct;
   if(input.equivalentPeriod[d].value!==null&&Math.abs(fact(input.equivalentPeriod[d],`${d} declared equivalent period`)/periodRaw-1)>1e-6)throw Error("Entered equivalent period disagrees with actual Rayleigh solution; no override applied.");
   if(input.empiricalCt[d].value!==null&&Math.abs(fact(input.empiricalCt[d],`${d} declared Ct`)-ct)>1e-10)throw Error("Entered Ct disagrees with actual system/section formula; no override applied.");
   const empiricalPeriod=ct*height.heightM**.75,forcePeriod=Math.min(periodRaw,1.4*empiricalPeriod),mass=base.modal.totalInfluenceMass[d];
   const forceEquivalent=equivalentBaseShear(mass,evaluateSpectrum(input.dd2,forcePeriod,{...coefficients[d],I:cls.I}).reducedMps2,parameters.sds,cls.I),forceScale=modalBaseScale(base.baseShearKn,forceEquivalent,flags);
   const driftEquivalent=mass*evaluateSpectrum(input.dd2,periodRaw,{...coefficients[d],I:cls.I}).reducedMps2,driftScale=modalBaseScale(base.baseShearKn,driftEquivalent,flags),dominantPeriod=dominant(base.modal,d),infill=fact(input.infill,"infill condition");
   for(const demand of demands)checks.push(storeyDriftCheck(`${d}:${demand.id}`,{rawMaxM:demand.stats.max,heightM:demand.heightM,R:coefficients[d].R,I:cls.I,dominantPeriod,dd2:input.dd2,dd3:input.dd3,infill,separatedCapacitySource:input.separatedCapacitySource,driftScale:driftScale.beta,source:stable.stamp}));
   const order=secondOrder(demands.map(s=>({id:s.id,averageDriftM:s.stats.rigidMean,weightAboveKn:s.weightAboveKn,shearKn:s.shearKn,heightM:s.heightM,part:s.part})),coefficients[d].R,coefficients[d].D,basement.rigid===true,stable.stamp);checks.push({...order.control,id:`second_order:${d}`});
   if(fact(input.adjacent.required,"seismic gap applicability")){const maxDisp=Math.max(...demands.map(s=>s.averageFloorDisplacementM));checks.push({...seismicGap({...input.adjacent[d],heightM:height.heightM,ownDisplacementM:maxDisp,R:coefficients[d].R,I:cls.I}),id:`seismic_gap:${d}`});}
   else checks.push(control(`seismic_gap:${d}`,"4.9.3","not_applicable",false,null,"Komşu bina/blok olmadığı kaynaklı karar; diğer global kontroller devam eder.",[input.adjacent.required.source]));
   let lower:RawSpectrum|null=null;
   if(massSets){const result=responseSpectrum(massSets.basement,solverOptions,input.dd2,{id:d,orientation:"horizontal",purpose:"raw_modal",reduction:massSets.basementReduction,equivalentCheck:null},"CQC",.05);
    if(result.status!=="solved")return {status:"analysis_failed" as const,direction:d,diagnostic:result,checks,iterations,engineeringAcceptance:false};lower=result;}
   const regional=regionalModalForces(input.structure,base,lower,height.baseM,coefficients[d].D,forceScale.beta*order.betaII);
   if(massSets)checks.push(control(`basement_regional_design:${d}`,"4.8.5/4.10.1",regional.unresolved.length?"requires_engineering":"determined",{unresolved:regional.unresolved,lowerBaseShearKn:lower!.baseShearKn,lowerReduction:regional.lowerReduction},null,"Aynı rijitlikte üst/alt kütleler ayrı çözüldü; bölgesel bileşen sınırları aktarılır. Eşzamanlı fiziksel N-M-V çifti veya eleman kapasite kabulü değildir.",[stable.stamp]));
   const forceFactor=forceScale.beta*order.betaII,members=base.members.map(m=>({id:m.id,statisticalMaxima:m.localEndForces.maxima.map(v=>v*forceFactor),covariance:m.localEndForces.covariance.map(row=>row.map(v=>v*forceFactor*forceFactor)),rawModalVectors:m.localEndForces.rawModalVectors,appliedFactor:forceFactor,coincidentPhysicalTuple:false}));
   directional[d]={analysisStamp:stable.stamp,used:coefficients[d],demands,eccentricityCases:eccDemands.map(e=>e.id),forceScale,driftScale,periods:{rawEigenDominant:dominantPeriod,equivalentRaw:periodRaw,empiricalPeriod,equivalentForcePeriod:forcePeriod,ctProof,periodProof},secondOrder:order,members,baseShearKn:base.baseShearKn*forceScale.beta,geometricNonlinearity:false,regional,lowerModal:lower?{modes:lower.modes,metadata:lower.metadata,baseShearKn:lower.baseShearKn}:null};
  }
  const failure=checks.some(c=>c.status==="fail"),incomplete=checks.some(c=>["missing_data","requires_engineering","unsupported"].includes(c.status));
  return {status:failure?"failed" as const:incomplete?"incomplete" as const:"checks_ready" as const,classification:{...cls,height,basement},checks,periodComparison,iterations,directional,modelRevision:input.modelRevision,
   detected:checks.filter(c=>c.finding===true).map(c=>({id:c.id,action:c.action})),globalChecksSatisfied:!failure&&!incomplete,engineeringAcceptance:false,wholeBuildingApproved:false,metadata:{version:"global-review-v1",coefficientIterations:iterations.length,analysisStamp:stable.stamp,pDeltaSolved:false,memberDesignRequired:true}};
 }catch(error){const reason=String(error);return {status:reason.includes("missing_data")?"incomplete" as const:"invalid_input" as const,reason,engineeringAcceptance:false,wholeBuildingApproved:false};}
}
