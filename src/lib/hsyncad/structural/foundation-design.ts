import type {FrameElement,FrameNode} from "./frame-element";
import type {ShellRect} from "./shell-rect";
import type {StructuralProject} from "./project-schema";
import {resolveFoundationSettings,winklerFoundation,type FoundationCombination,type FoundationLimitBasis} from "./foundation-contact";
import {applyFoundationDeadLoads,applyFoundationThicknessFactor,distributeFoundationReaction,foundationNodeTributaryAreas} from "./foundation-model";
import {recoverFoundationShellForces,integrateFoundationCut,integrateWinklerReactionInsideRect,integrateFoundationVerticalLoadInsideRect,type FoundationCutDemand} from "./foundation-fe";
import {solveLinearStructure} from "./linear-structure";
import {punchingPerimeter,checkInteriorPunching,punchingCapacityGate,type InteriorPunchingAction,type PunchingSupport,type SlabBoundary} from "./punching-shear";

export type RaftSupportReaction={id:string;xM:number;yM:number;verticalKnOnSuperstructure:number;
  sourceIdentity:{projectId:string;projectRevision:number;loadCaseId:string;stiffnessFingerprint:string};
  supportGeometry:{kind:"column"|"wall_end";widthM:number;lengthM:number;source:string};
  thicknessRegion:{widthM:number;lengthM:number;source:string};
  footprint:{widthM:number;lengthM:number;supportDepthM:number;enlargementReferenceM?:number;enlargementReferenceSource?:string}};
export type RaftCutRequest={id:string;cut:FoundationCutDemand};
export type RaftPunchingRequest={id:string;supportReactionId:string;boundary:SlabBoundary;support:PunchingSupport;effectiveDepthM:number;
  effectiveDepthSource:string;action:Omit<InteriorPunchingAction,"FaKn">;material:{fctdMPa:number;source:string;evidence:string}};
export type RaftFoundationCaseInput={
  project:StructuralProject;combination:FoundationCombination;selectedLimitBasis:FoundationLimitBasis;
  modelMode:"shared_model"|"raft_submodel";
  analysisIdentity:{projectId:string;projectRevision:number;sourceStiffnessFingerprint:string;loadCaseId:string;reactionEvidence:string};
  nodes:FrameNode[];frames:FrameElement[];shells:ShellRect[];foundationShellIds:string[];
  supportReactions:RaftSupportReaction[];
  concreteUnitWeightKnm3:number;concreteUnitWeightSource:string;concreteSelfWeightAlreadyIncluded:boolean;
  soilUnitWeightKnm3:number|null;soilUnitWeightSource:string|null;overburdenDepthM:number|null;overburdenDepthSource:string|null;
  foundationLoadFactors:{loadCaseId:string;deadFactor:number;overburdenFactor:number;source:string};shellPressureLoadCaseId:string;shellPressureSource:string;
  cuts:RaftCutRequest[];punching?:RaftPunchingRequest[];
};

function fingerprint(value:unknown):string{
  const text=JSON.stringify(value);let a=0x811c9dc5,b=0x9e3779b9;
  for(let i=0;i<text.length;i++){const c=text.charCodeAt(i);a=Math.imul(a^c,0x01000193);b=Math.imul(b^c,0x85ebca6b);}
  return `${(a>>>0).toString(16).padStart(8,"0")}${(b>>>0).toString(16).padStart(8,"0")}`;
}

/** Full limited raft pathway: real connection loads, changed thickness/Ks, compression-only P06 solve, pressure/contact/displacement and FE section checks. */
export function runRaftFoundationCase(input:RaftFoundationCaseInput){
  const settings=resolveFoundationSettings(input.project,"raft",input.combination,input.selectedLimitBasis);
  const blockers=[...settings.blockers];
  if(settings.limitBasis!=="unknown"&&settings.bearingLimitKpa===null)blockers.push("Seçilen taşıma limiti açıkça çözümlenemedi.");
  if(!input.supportReactions.length)blockers.push("Raft bağlantısına aktarılacak gerçek kolon/perde reaksiyonları yok.");
  if(input.supportReactions.some(r=>!r.supportGeometry.source.trim()||!r.thicknessRegion.source.trim()
    ||![r.supportGeometry.widthM,r.supportGeometry.lengthM,r.thicknessRegion.widthM,r.thicknessRegion.lengthM,r.footprint.widthM,r.footprint.lengthM,r.footprint.supportDepthM].every(v=>Number.isFinite(v)&&v>0)
    ||Math.abs(r.supportGeometry.widthM-r.footprint.widthM)>1e-8||Math.abs(r.supportGeometry.lengthM-r.footprint.lengthM)>1e-8))
    blockers.push("Sourced column/wall geometry, support-region thickness zone and reaction footprint must be complete and dimensionally consistent.");
  if(!input.cuts.length)blockers.push("Gerçek kabuk kesit talebi olmadan donatı kapasite bölümü üretilemez.");
  if(!input.concreteUnitWeightSource.trim())blockers.push("Temel beton birim ağırlığı kaynağı bilinmiyor.");
  if(input.foundationLoadFactors.loadCaseId!==input.combination.id||!input.foundationLoadFactors.source.trim()||input.shellPressureLoadCaseId!==input.combination.id||!input.shellPressureSource.trim()
    ||![input.foundationLoadFactors.deadFactor,input.foundationLoadFactors.overburdenFactor].every(v=>Number.isFinite(v)&&v>=0))blockers.push("Temel öz ağırlık/örtü ve kabuk basıncı bu yük kombinasyonuna açıkça bağlanmamış.");
  if(!input.analysisIdentity.projectId.trim()||input.analysisIdentity.projectId!==input.project.projectId||input.analysisIdentity.projectRevision!==input.project.revision
    ||!input.analysisIdentity.sourceStiffnessFingerprint.trim()||input.analysisIdentity.loadCaseId!==input.combination.id||!input.analysisIdentity.reactionEvidence.trim())blockers.push("Proje revizyonu/üst yapı rijitlik/yük durumu/reaksiyon kimliği eksik veya bu projeyle uyuşmuyor.");
  if(input.supportReactions.some(r=>r.sourceIdentity.projectId!==input.project.projectId||r.sourceIdentity.projectRevision!==input.project.revision
    ||r.sourceIdentity.loadCaseId!==input.combination.id||r.sourceIdentity.stiffnessFingerprint!==input.analysisIdentity.sourceStiffnessFingerprint))blockers.push("Eski/proje dışı/başka yük durumuna ait kesit tepkisi reddedildi.");
  if(input.modelMode==="shared_model"&&settings.connection==="enlarged")blockers.push("Büyütülmüş bağlantının ortak model DOF/mesh aktarım eşdeğerliği bu P06 adapterında doğrulanmadı.");
  if(input.modelMode==="shared_model"&&!settings.interaction)blockers.push("Ortak üst yapı-radye modeli seçiliyken temel etkileşimi kapalı; sabit taban ve Winkler alt model ayrı akış olmalıdır.");
  if(input.modelMode==="raft_submodel"&&input.supportReactions.some(r=>settings.connection==="enlarged"&&(!r.footprint.enlargementReferenceM||!r.footprint.enlargementReferenceSource)))blockers.push("Büyütülmüş bağlantı için kaynaklı fiziksel h referansı eksik.");
  if(blockers.length)return {status:"blocked" as const,analysisApproved:false,engineeringAcceptance:false,settings,blockers};
  if(!settings.combinationIncluded)return {status:"excluded_combination" as const,analysisApproved:false,engineeringAcceptance:false,settings,
    excludedCombinationId:input.combination.id,reason:"The selected foundation seismic-combination control excludes this combination from foundation design."};
  const supportFootprints=input.supportReactions.map(r=>({xM:r.xM,yM:r.yM,widthM:r.thicknessRegion.widthM,lengthM:r.thicknessRegion.lengthM,enlargementReferenceM:r.footprint.enlargementReferenceM}));
  const tributary=foundationNodeTributaryAreas(input.nodes,input.shells,input.foundationShellIds);
  let shells=applyFoundationThicknessFactor({shells:input.shells,nodes:input.nodes,foundationShellIds:input.foundationShellIds,settings,supportFootprints});
  shells=applyFoundationDeadLoads({shells,nodes:input.nodes,foundationShellIds:input.foundationShellIds,
    concreteUnitWeightKnm3:input.concreteUnitWeightKnm3,concreteSelfWeightAlreadyIncluded:input.concreteSelfWeightAlreadyIncluded,
    deadFactor:input.foundationLoadFactors.deadFactor,overburdenFactor:input.foundationLoadFactors.overburdenFactor,factorSource:input.foundationLoadFactors.source,
    soilUnitWeightKnm3:input.soilUnitWeightKnm3,soilUnitWeightSource:input.soilUnitWeightSource,
    overburdenDepthM:input.overburdenDepthM,overburdenDepthSource:input.overburdenDepthSource});
  let nodes=input.nodes;
  const actualFootprints:unknown[]=[];
  for(const reaction of input.supportReactions){
    if(input.modelMode==="shared_model"){
      actualFootprints.push({reactionId:reaction.id,xM:reaction.xM,yM:reaction.yM,widthM:reaction.footprint.widthM,lengthM:reaction.footprint.lengthM,
        loadAppliedSeparately:false,note:"The shared P06 model already contains the superstructure action; separate reaction is not added again."});
    } else {
      const distributed=distributeFoundationReaction({nodes,reaction,footprint:reaction.footprint,settings,nodalTributaryAreaM2:tributary});
      nodes=distributed.nodes;actualFootprints.push({reactionId:reaction.id,...distributed.footprint,participatingNodeIds:distributed.participatingNodeIds,
        signedFoundationLoadKn:distributed.appliedVerticalKn,footprintBasis:distributed.footprintBasis,loadAppliedSeparately:true});
    }
  }
  let foundation;
  try{foundation=winklerFoundation({shellIds:input.foundationShellIds,settings,maxIterations:96});}
  catch(error){return {status:"blocked" as const,analysisApproved:false,engineeringAcceptance:false,settings,blockers:[String(error)]};}
  const solved=solveLinearStructure(nodes,input.frames,shells,foundation);
  if(solved.status!=="solved")return {status:"analysis_failed" as const,analysisApproved:false,engineeringAcceptance:false,settings,solver:solved,blockers:["P06 raft/upper-structure solve did not converge or satisfy equilibrium."]};
  const displacementByNode=Object.fromEntries(solved.nodes.map(n=>[n.id,n.displacement]));
  const resultants=recoverFoundationShellForces({nodes,shells,displacementByNode,foundationShellIds:input.foundationShellIds});
  const cuts=input.cuts.map(request=>{
    const cutDemand: FoundationCutDemand = {
      ...request.cut,
      loadCaseId: request.cut.loadCaseId ?? input.combination.id,
      analysisStamp: request.cut.analysisStamp ?? input.combination.id,
      modelRevision: request.cut.modelRevision ?? `${input.project.projectId}@${input.project.revision}`,
      sourceStiffnessFingerprint: request.cut.sourceStiffnessFingerprint ?? input.analysisIdentity.sourceStiffnessFingerprint,
    };
    const action=integrateFoundationCut({nodes,shells,resultants,foundationShellIds:input.foundationShellIds,cut:cutDemand});
    return {id:request.id,action,status:"actual_signed_FE_demand_face_and_capacity_mapping_not_yet_accepted" as const};
  });
  const resultById=new Map(solved.nodes.map(n=>[n.id,n]));
  const totalArea=Object.values(tributary).reduce((s,a)=>s+a,0);
  const weightedPressure=Object.entries(tributary).reduce((s,[id,a])=>s+(resultById.get(id)?.soilPressure??0)*a,0);
  const active=Object.entries(tributary).filter(([id])=>resultById.get(id)?.contactActive===true);
  const pressures=active.map(([id])=>resultById.get(id)?.soilPressure??0);
  const contactLossNodeIds=Object.entries(tributary).filter(([id])=>resultById.get(id)?.contactActive===false).map(([id])=>id);
  const localDisplacements=Object.entries(tributary).map(([id])=>({nodeId:id,displacementM:resultById.get(id)?.displacement[2]??null}));
  const punching=(input.punching??[]).map(request=>{
    const loadReaction=input.supportReactions.find(r=>r.id===request.supportReactionId);
    if(!loadReaction)return {id:request.id,status:"unsupported" as const,reason:"Punching support reaction ID is not in the current P06 load packet."};
    const tol=1e-8,px=request.support.footprint.map(p=>p[0]),py=request.support.footprint.map(p=>p[1]);
    const supportWidth=Math.max(...px)-Math.min(...px),supportLength=Math.max(...py)-Math.min(...py);
    if(!loadReaction.supportGeometry.source.trim()||loadReaction.supportGeometry.kind!==request.support.kind
      ||Math.abs(request.support.origin[0]-loadReaction.xM)>tol||Math.abs(request.support.origin[1]-loadReaction.yM)>tol
      ||Math.abs(supportWidth-loadReaction.supportGeometry.widthM)>tol||Math.abs(supportLength-loadReaction.supportGeometry.lengthM)>tol)
      return {id:request.id,status:"support_geometry_mismatch" as const,reason:"Punching support center/footprint/kind does not match the sourced current reaction geometry."};
    if(!Number.isFinite(request.effectiveDepthM)||request.effectiveDepthM<=0||!request.effectiveDepthSource.trim())
      return {id:request.id,status:"unsupported" as const,reason:"Punching effective depth and source are required."};
    const localShells=shells.filter(shell=>input.foundationShellIds.includes(shell.id)).filter(shell=>{
      const coordinates=shell.nodes.map(id=>nodes.find(n=>n.id===id)!.position);
      const sx=[...coordinates.map(p=>p[0])],sy=[...coordinates.map(p=>p[1])];
      return Math.max(...sx)>=Math.min(...px)-tol&&Math.min(...sx)<=Math.max(...px)+tol&&Math.max(...sy)>=Math.min(...py)-tol&&Math.min(...sy)<=Math.max(...py)+tol;
    });
    if(!localShells.length||request.effectiveDepthM>=Math.min(...localShells.map(s=>s.thickness)))
      return {id:request.id,status:"unsupported" as const,reason:"Effective depth must be positive and smaller than the actual P06 shell thickness under the support."};
    const perimeter=punchingPerimeter({boundary:request.boundary,support:request.support,effectiveDepthM:request.effectiveDepthM});
    if(input.modelMode==="shared_model")return {id:request.id,status:"unsupported" as const,reason:"This P13 path has no validated shared-model column cut-force extractor; an external support packet cannot stand in for current frame/shell interface forces."};
    if(!foundation)return {id:request.id,status:"unsupported" as const,reason:"Punching Fa requires a solved current Winkler pressure field; cut reactions alone do not determine it."};
    const xs=request.support.footprint.map(p=>p[0]),ys=request.support.footprint.map(p=>p[1]),d=request.effectiveDepthM;
    const soil=integrateWinklerReactionInsideRect({nodes,shells,foundationShellIds:input.foundationShellIds,
      pressureByNode:Object.fromEntries(solved.nodes.map(n=>[n.id,n.soilPressure])),rectangle:{x0:Math.min(...xs)-d/2,x1:Math.max(...xs)+d/2,y0:Math.min(...ys)-d/2,y1:Math.max(...ys)+d/2}});
    const localDown=integrateFoundationVerticalLoadInsideRect({nodes,shells,foundationShellIds:input.foundationShellIds,
      rectangle:{x0:Math.min(...xs)-d/2,x1:Math.max(...xs)+d/2,y0:Math.min(...ys)-d/2,y1:Math.max(...ys)+d/2}});
    const contourArea=(supportWidth+d)*(supportLength+d);
    if(Math.abs(soil.areaM2-contourArea)>Math.max(1e-10,contourArea*1e-8))return {id:request.id,status:"incomplete_Fa_mesh" as const,
      reason:"Foundation mesh has a gap/void inside the full d/2 contour; punching reaction integration is incomplete.",coveredAreaM2:soil.areaM2,requiredAreaM2:contourArea};
    const faKn=soil.reactionKn-localDown.downwardKn,faSource=`net upward support: ${soil.source}; less actual signed downward shell load: ${localDown.source}`;
    if(perimeter.geometryStatus!=="solved"||perimeter.classification!=="interior")return {id:request.id,...punchingCapacityGate(perimeter),FaKn:faKn,FaAreaM2:soil.areaM2,FaSource:faSource};
    if(Math.abs((request.action.NbelowKn-request.action.NaboveKn)-loadReaction.verticalKnOnSuperstructure)>1e-6+1e-8*Math.abs(loadReaction.verticalKnOnSuperstructure))
      return {id:request.id,status:"action_reaction_mismatch" as const,reason:"Punching Nbelow−Nabove does not match the explicitly stamped support reaction.",engineeringAcceptance:false as const,FaKn:faKn,FaSource:faSource};
    const modelRevision=`${input.project.projectId}@${input.project.revision}`,expectedCurrent={modelRevision,stiffnessSet:input.analysisIdentity.sourceStiffnessFingerprint,analysisStamp:input.combination.id};
    if(request.action.modelRevision!==expectedCurrent.modelRevision||request.action.stiffnessSet!==expectedCurrent.stiffnessSet||request.action.analysisStamp!==expectedCurrent.analysisStamp)
      return {id:request.id,status:"stale_action" as const,reason:"Punching force packet is not stamped to this project revision, stiffness set and load case.",engineeringAcceptance:false as const,FaKn:faKn,FaSource:faSource};
    const action:InteriorPunchingAction={...request.action,FaKn:faKn};
    const check=checkInteriorPunching({perimeter,support:request.support,action,material:request.material,expectedCurrent});
    return {id:request.id,...check,FaKn:faKn,FaAreaM2:soil.areaM2,FaSource:faSource,localDownwardLoadKn:localDown.downwardKn,expectedCurrent};
  });
  const resolvedFoundationFingerprint=fingerprint({projectId:input.project.projectId,projectRevision:input.project.revision,loadCaseId:input.combination.id,
    nodes,frames:input.frames,shells,foundation,settings:{interaction:settings.interaction,connection:settings.connection,thicknessFactor:settings.thicknessFactor,ksKnm3:settings.ksKnm3}});
  return {status:"solved_limited_profile" as const,analysisApproved:false,engineeringAcceptance:false,settings,analysisIdentity:{...input.analysisIdentity,
    resolvedFoundationFingerprint,algorithm:"JSON ordered input + dual 32-bit FNV-style fingerprint (identity aid, not cryptographic hash)"},
    solver:{status:solved.status,balance:solved.balance,contactIterations:solved.metadata.contactIterations,contactMode:solved.metadata.contactMode},
    connectionFootprints:actualFootprints,
    bearing:{basis:settings.limitBasis,limitKpa:settings.bearingLimitKpa,checkedCriterion:settings.criterion,
      qminKpa:foundation?(contactLossNodeIds.length?0:(pressures.length?Math.min(...pressures):null)):null,qaverageKpa:foundation&&totalArea?weightedPressure/totalArea:null,
      qmaxKpa:foundation&&pressures.length?Math.max(...pressures):null,contactLossNodeIds,
      criterionApplicability:"unknown" as const,comparison:"not_accepted_without_normative_limit_applicability_review" as const,
      reviewRequired:settings.reviewRequired},
    superstructureInteraction:{selected:settings.interaction,mode:input.modelMode,represented:input.modelMode==="shared_model"&&settings.interaction,
      note:input.modelMode==="raft_submodel"?"Raft soil contact is solved with Winkler springs; the upper structure is represented only by stamped cut reactions, so feedback coupling is not claimed.":"Shared P06 frame/raft model stiffness and contact solve together."},
    localWinklerDisplacements:{meaning:"local Winkler foundation vertical displacement; not geotechnical settlement",nodes:localDisplacements,
      maximumAbsoluteM:localDisplacements.reduce((m,n)=>Math.max(m,Math.abs(n.displacementM??0)),0)},
    shellSectionActions:cuts,punching,foundationShellForces:resultants,
    requiredButNotRepresented:"TBDY 7.11.7 FE shear stress is an eligible punching limit only at d/2 from the actual support face under G+D·E; it is not a generic one-way shear check. TS 500 8.1 one-way shear remains separate.",
  };
}
