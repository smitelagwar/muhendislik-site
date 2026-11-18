import {solveModalStructure,prepareModalStructure,type ModalStructureInput} from "./modal-structure";
import type {EigenOptions} from "./modal-eigen";
import {mv,type V3} from "./frame-element";
import {compileShellRect} from "./shell-rect";
import {multiply} from "./sparse-spd";
import {evaluateSpectrum,modalBaseScale,type StandardSpectrum,type DirectionReduction} from "./design-spectrum";
import {combineModalVectors} from "./modal-combination";
export type SpectrumDirection={id:"X"|"Y"|"Z";reduction:DirectionReduction;orientation:"horizontal"|"vertical";purpose?:"raw_modal"|"whole_design_envelope";equivalentCheck:null|{shearKn:number;irregularity:{A1:boolean;B2:boolean;B3:boolean;decisionSource:string}}};
/** Signed per-mode responses retained. Local statistical envelopes never claim simultaneous design tuples. */
export function responseSpectrum(input:ModalStructureInput,options:EigenOptions,spectrum:StandardSpectrum,direction:SpectrumDirection,method:"CQC"|"SRSS",damping:number){
 try{
  if(damping!==.05)throw Error("Standard TBDY spectrum is 5%-damped; another damping requires explicit verified spectrum.");
  if((direction.id==="Z")!==(direction.orientation==="vertical"))throw Error("Direction/spectrum orientation mismatch.");
  const purpose=direction.purpose??"whole_design_envelope";
  if(purpose!=="raw_modal"&&purpose!=="whole_design_envelope")throw Error("Unknown response purpose.");
  if(input.analysisPart&&input.analysisPart!=="whole"&&purpose!=="raw_modal")throw Error("Upper/basement response requires raw regional results; region-specific beta/design transfer belongs to an explicit P08 decision, not blanket global scaling.");
  if(purpose==="raw_modal"&&direction.equivalentCheck!==null)throw Error("Raw modal response cannot also request design scaling.");
  // >=97% is a conservative certificate: remaining total <3% cannot hide a >3% mode.
  const required=direction.id==="Z"?.95:.97000001;
  const requested={...input,directions:input.directions.map(d=>d.id===direction.id?{...d,requiredFraction:Math.max(required,d.requiredFraction)}:d)};
  if(!requested.directions.some(d=>d.id===direction.id))throw Error("Requested direction is absent from modal input.");
  const modal=solveModalStructure(requested,options);if(modal.status!=="solved")return modal;
  const system=prepareModalStructure(requested),periods=modal.modes.map(m=>m.periodSeconds),nodeIndex=new Map(input.nodes.map((n,i)=>[n.id,i]));
  const modes=modal.modes.map(mode=>{
   const ordinate=evaluateSpectrum(spectrum,mode.periodSeconds,direction.reduction,direction.orientation),gamma=mode.participation[direction.id].gamma;
   const fullDisplacement=Float64Array.from(mode.fullShape,v=>v*gamma*ordinate.reducedMps2/mode.omega2),inertialLoad=Float64Array.from(system.massFull,(mass,i)=>mass*mode.fullShape[i]*gamma*ordinate.reducedMps2),internal=multiply(system.fullK,fullDisplacement);
   const constraintReaction=Float64Array.from(internal,(v,i)=>input.nodes[Math.floor(i/6)].prescribed[i%6]===null?0:v-inertialLoad[i]);
   const springReaction=input.nodes.flatMap((node,i)=>node.springs.map((k,d)=>-k*fullDisplacement[6*i+d]));
   const soil=input.nodes.map((_node,i)=>({reactionZ:input.foundation?-input.foundation.ks*system.areas[i]*fullDisplacement[6*i+2]:0,pressure:input.foundation&&system.areas[i]>0?input.foundation.ks*input.foundation.compressionSign*fullDisplacement[6*i+2]:0}));
   const memberEndForces=system.data.map(d=>{
    const local=d.condensed.recover(mv(d.t,Float64Array.from(d.dofs,i=>fullDisplacement[i]),12));return {id:d.e.id,localEndForce:[...mv(d.k,local,12)]};
   });
   return {number:mode.number,periodSeconds:mode.periodSeconds,gamma,ordinate,baseShearKn:mode.participation[direction.id].effectiveMass*ordinate.reducedMps2,
    displacement:[...fullDisplacement],inertialLoad:[...inertialLoad],constraintReaction:[...constraintReaction],springReaction,soil,memberEndForces};
  });
  const base=combineModalVectors(modes.map(m=>[m.baseShearKn]),periods,damping,method);
  if(purpose!=="raw_modal"&&direction.id!=="Z"&&!direction.equivalentCheck)throw Error("Horizontal design response requires an explicit equivalent base shear and irregularity decision.");
  const scaling=direction.equivalentCheck?modalBaseScale(base.maxima[0],direction.equivalentCheck.shearKn,direction.equivalentCheck.irregularity):{beta:1,gamma:null,sourceClause:purpose==="raw_modal"?"raw-modal-not-design-scaled":"vertical-no-horizontal-base-scaling"};
  const beta=scaling.beta,combine=(vectors:number[][])=>combineModalVectors(vectors.map(v=>v.map(x=>beta*x)),periods,damping,method);
  const nodes=input.nodes.map((n,i)=>({id:n.id,displacement:combine(modes.map(m=>m.displacement.slice(6*i,6*i+6))),constraintReaction:combine(modes.map(m=>m.constraintReaction.slice(6*i,6*i+6))),springReaction:combine(modes.map(m=>m.springReaction.slice(6*i,6*i+6))),
   soil:input.foundation&&system.areas[i]>0?{tributaryArea:system.areas[i],perturbation:combine(modes.map(m=>[m.soil[i].reactionZ,m.soil[i].pressure])),totalContactApproved:false}:null}));
  const members=system.data.map((_d,i)=>({id:_d.e.id,localEndForces:combine(modes.map(m=>m.memberEndForces[i].localEndForce))}));
  const shells=input.shells.map(e=>{
   const ids=e.nodes.map(id=>nodeIndex.get(id)!);const c=compileShellRect({...e,pressure:0},ids.map(i=>input.nodes[i].position) as unknown as readonly[V3,V3,V3,V3]);
   return {id:e.id,globalNodalForces:combine(modes.map(m=>{const u=ids.flatMap(i=>m.displacement.slice(6*i,6*i+6));return Array.from({length:24},(_,i)=>u.reduce((sum,v,j)=>sum+c.kg[i*24+j]*v,0));}))};
  });
  return {status:"solved" as const,modal,modes,nodes,members,shells,baseShearKn:base.maxima[0]*beta,scaling,spectrum,direction,analysisApproved:false,
   metadata:{version:"response-spectrum-v1",method,damping,purpose,analysisPart:input.analysisPart??"whole",accelerationUnit:"m/s2",forceUnit:"kN",displacementUnit:"m",modalVectorsUnscaled:true,localEnvelopesScale:beta,coverageCertificate:direction.id==="Z"?"requested_vertical_mass":"remaining mass <3% conservatively includes every >3% mode",statisticalMaximaAreCoincident:false,forceInteractionApproval:false}};
 }catch(error){return {status:"invalid_input" as const,reason:String(error),analysisApproved:false};}
}
