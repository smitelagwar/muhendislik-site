import {solveModalStructure,type ModalStructureInput} from "./modal-structure";
import {responseSpectrum,type SpectrumDirection} from "./response-spectrum";
import type {StandardSpectrum} from "./design-spectrum";
type Request={id:string;operation:"modal"|"spectrum";input:ModalStructureInput;maxModes:number;spectrum?:StandardSpectrum;direction?:SpectrumDirection};
/** Dedicated numerical worker. Termination cancels the isolated job; no success fallback. */
globalThis.onmessage=(event:MessageEvent<Request>)=>{
 const r=event.data,start=performance.now();let result;
 if(!r||typeof r.id!=="string"||!Number.isSafeInteger(r.maxModes)||r.maxModes<1||r.maxModes>128||!["modal","spectrum"].includes(r.operation))result={status:"invalid_input",analysisApproved:false,reason:"Invalid dynamic Worker request/budget."};
 else {
  const options={maxModes:r.maxModes,maxIterations:160,maxFactorEntries:4000000,maxBasisEntries:4000000};
  result=r.operation==="modal"?solveModalStructure(r.input,options):r.spectrum&&r.direction?responseSpectrum(r.input,options,r.spectrum,r.direction,"CQC",.05):{status:"invalid_input",analysisApproved:false,reason:"Spectrum and directional decisions required."};
 }
 globalThis.postMessage({id:r?.id??null,result,elapsedMs:performance.now()-start});
};
