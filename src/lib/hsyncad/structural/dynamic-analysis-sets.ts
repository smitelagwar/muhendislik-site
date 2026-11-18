import type {ModalStructureInput} from "./modal-structure";
import {combineForceCases,type ForceCase,type ForceTuple} from "./modal-combination";
/** Mass sets use one common physical model; absent upper/lower masses remain explicit zero. */
export function partitionBasementMass(input:ModalStructureInput,roles:readonly {nodeId:string;part:"upper"|"basement"|"excluded";reason:string}[],rigidBasementDecision:string){
 if(!rigidBasementDecision.trim()||roles.length!==input.nodes.length||new Set(roles.map(r=>r.nodeId)).size!==roles.length||roles.some(r=>!r.reason.trim()||!["upper","basement","excluded"].includes(r.part)))throw Error("Explicit rigid-basement decision and complete node roles required.");
 const lookup=new Map(roles.map(r=>[r.nodeId,r.part]));if(input.nodes.some(n=>!lookup.has(n.id)))throw Error("Basement node role mismatch.");
 const group=(part:"upper"|"basement"):ModalStructureInput=>({...input,analysisPart:part==="upper"?"upper_mass":"basement_mass",inertias:input.inertias.map(m=>({...m,values:lookup.get(m.nodeId)===part?m.values:[0,0,0,0,0,0] as const})),
  // Massless diaphragm groups still impose kinematics, but need a validated mass-centre reference.
  rigidDiaphragms:input.rigidDiaphragms?.map(d=>({...d,accidental:null}))});
 return {upper:group("upper"),basement:group("basement"),basementReduction:{R:2.5,D:1.5,I:1},decisionSource:rigidBasementDecision,sourceClauses:["4.8.5.2","4.8.5.3"],designApproved:false};
}
/** Modal alternative of Eq4.18: +/- cases have equal added inertia, explicitly recorded. */
export function accidentalDiaphragmSets(input:ModalStructureInput,dimensions:readonly {diaphragmId:string;widthX:number;widthY:number}[]){
 if(!input.rigidDiaphragms?.length||dimensions.length!==input.rigidDiaphragms.length||new Set(dimensions.map(d=>d.diaphragmId)).size!==dimensions.length)throw Error("Explicit rigid-diaphragm model and dimensions required; flexible floor needs its second rigid model.");
 return (["X","Y"] as const).flatMap(direction=>([1,-1] as const).map(sign=>({id:`${direction}:eccentricity:${sign}`,direction,sign,
  input:{...input,rigidDiaphragms:input.rigidDiaphragms!.map(d=>{const dim=dimensions.find(v=>v.diaphragmId===d.id);if(!dim||![dim.widthX,dim.widthY].every(v=>Number.isFinite(v)&&v>0))throw Error("Missing diaphragm dimension.");return {...d,accidental:{direction,sign,perpendicularDimensionM:direction==="X"?dim.widthY:dim.widthX}};})},
  method:"TBDY2018-4.5.10.2d-mi-e2",equalSignInertiaExpected:true})));
}
/** Eq4.10.1 load-case transfer, coefficients derived from a declared upper/lower design branch. */
export function basementDesignForce(id:string,upper:ForceCase,lower:ForceCase,part:"upper"|"basement",behavior:"ductile"|"nonductile",Dupper:number,Dlower:number){
 if(![Dupper,Dlower].every(v=>Number.isFinite(v)&&v>=1)||!["upper","basement"].includes(part)||!["ductile","nonductile"].includes(behavior))throw Error("Invalid basement design branch.");
 const factors=part==="upper"?[behavior==="ductile"?1:Dupper,0]:behavior==="ductile"?[1,1]:[.6*Dupper,Dlower];
 return {...combineForceCases(id,[{factor:factors[0],load:upper},{factor:factors[1],load:lower}]),part,behavior,sourceClause:part==="upper"?"4.10.1.1/2":"4.10.1.4/5",secondOrderScaleApplied:false};
}
export type DeclaredLoad={kind:"G"|"Q"|"S"|"H";case:ForceCase};
/** Concrete Eq4.11/4.12; vertical method is explicit, never silently omitted. */
export function concreteSeismicCombinations(loads:DeclaredLoad[],horizontal:ForceCase[],vertical:{method:"modal";load:ForceCase}|{method:"approximate_4.10";sds:number;applicabilityDecision:string},absence:Partial<Record<"Q"|"S"|"H",string>>={}){
 const g=loads.find(l=>l.kind==="G")?.case;if(!g||!horizontal.length||new Set(loads.map(l=>l.kind)).size!==loads.length)throw Error("Unique G and earthquake cases required.");
 let z:ForceCase;
 if(vertical.method==="modal")z=vertical.load;
 else {if(!vertical.applicabilityDecision.trim()||!Number.isFinite(vertical.sds)||vertical.sds<=0)throw Error("Vertical approximate applicability must be explicitly checked.");z={...g,id:`${g.id}:EdZ`,values:g.values.map(v=>2/3*vertical.sds*v) as unknown as ForceTuple};}
 const q=loads.find(l=>l.kind==="Q")?.case,s=loads.find(l=>l.kind==="S")?.case,h=loads.find(l=>l.kind==="H")?.case;
 for(const kind of ["Q","S","H"] as const)if(!loads.some(l=>l.kind===kind)&&!absence[kind]?.trim())throw Error(`Missing ${kind}: explicit not-applicable decision required.`);
 return horizontal.flatMap(e=>[
  {...combineForceCases(`4.11:${e.id}`,[{factor:1,load:g},...(q?[{factor:1,load:q}]:[]),...(s?[{factor:.2,load:s}]:[]),{factor:1,load:e},{factor:.3,load:z}]),sourceClause:"4.11"},
  {...combineForceCases(`4.12:${e.id}`,[{factor:.9,load:g},...(h?[{factor:1,load:h}]:[]),{factor:1,load:e},{factor:-.3,load:z}]),sourceClause:"4.12"}
 ]);
}
