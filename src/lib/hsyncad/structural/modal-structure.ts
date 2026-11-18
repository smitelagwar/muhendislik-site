import {assembleStructuralSystem,type Foundation} from "./structural-system";
import {assembleSymmetric} from "./sparse-spd";
import {solveModalEigen,type EigenOptions} from "./modal-eigen";
import type {FrameNode,FrameElement,V3} from "./frame-element";
import type {ShellRect} from "./shell-rect";
import {reduceDiaphragms,type RigidDiaphragm} from "./rigid-diaphragm";
export type NodeInertia={nodeId:string;values:readonly[number,number,number,number,number,number];source:"explicit"|"integrated"};
export type ModalStructureInput={nodes:FrameNode[];frames:FrameElement[];shells:ShellRect[];foundation:Foundation|null;inertias:NodeInertia[];rotationOrigin:V3;directions:{id:"X"|"Y"|"Z"|"RZ";requiredFraction:number}[];rigidDiaphragms?:RigidDiaphragm[];analysisPart?:"whole"|"upper_mass"|"basement_mass"};
/** Same physical stiffness assembly as P06; lumped inertias are explicit, no artificial rotational mass. */
export function prepareModalStructure(input:ModalStructureInput){
 const {nodes,frames,shells,foundation,inertias,rotationOrigin}=input;
 if(foundation?.mode==="compression_only")throw Error("Modal analysis requires an explicitly linearized equilibrium contact state; automatic uplift linearization unsupported.");
 if(rotationOrigin.length!==3||rotationOrigin.some(v=>!Number.isFinite(v))||inertias.length!==nodes.length||new Set(inertias.map(m=>m.nodeId)).size!==nodes.length)throw Error("Explicit inertia for every node and finite rotation origin required.");
 const homogeneousFrames=frames.map(e=>({...e,uniformLocal:[0,0,0] as const})),homogeneousShells=shells.map(e=>({...e,pressure:0}));
 const system=assembleStructuralSystem(nodes,homogeneousFrames,homogeneousShells,foundation),massFull:number[]=[],free:number[]=[];
 for(let i=0;i<nodes.length;i++){
  const m=inertias.find(m=>m.nodeId===nodes[i].id);
  if(!m||!["explicit","integrated"].includes(m.source)||m.values.length!==6||m.values.some(v=>!Number.isFinite(v)||v<0))throw Error("Missing/invalid nodal inertia; native/unknown mass not accepted.");
  massFull.push(...m.values);nodes[i].prescribed.forEach((value,d)=>{if(value===null)free.push(6*i+d);});
 }
 if(!free.length)throw Error("No dynamic free DOFs.");
 const entries=[...system.base];if(foundation)system.areas.forEach((area,i)=>{if(area)entries.push([6*i+2,6*i+2,foundation.ks*area]);});
 const fullK=assembleSymmetric(system.N,entries);
 const reduction=reduceDiaphragms(nodes,fullK,massFull,input.rigidDiaphragms??[]);
 const influences=input.directions.map(direction=>({id:direction.id,requiredFraction:direction.requiredFraction,vector:reduction.basis.map(b=>{
  const d=b.component;
  if(direction.id==="RZ")return d===0?-(b.position[1]-rotationOrigin[1]):d===1?b.position[0]-rotationOrigin[0]:d===5?1:0;
  return d===(direction.id==="X"?0:direction.id==="Y"?1:2)?1:0;
 })}));
 return {...system,...reduction,fullK,free,influences};
}
export function solveModalStructure(input:ModalStructureInput,options:EigenOptions){
 try{
  const system=prepareModalStructure(input),result=solveModalEigen(system.K,system.mass,system.influences,options);
  if(result.status!=="solved")return result;
  return {...result,modes:result.modes.map(mode=>({...mode,fullShape:system.expand(mode.shape)})),dofOrder:system.basis,
   metadata:{...result.metadata,stiffnessSource:"shared-P06-assembly",massUnits:"translations: tonne (kN*s2/m), rotations: tonne*m2",totalDofs:system.N,freeDofs:system.K.n,diaphragms:system.diaphragmMetadata,foundationMode:input.foundation?.mode??null,pDelta:false,geometricNonlinearity:false}};
 }catch(error){return {status:"invalid_input" as const,reason:String(error),analysisApproved:false};}
}
