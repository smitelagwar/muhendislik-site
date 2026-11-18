import {solveLinearStructure,type Foundation} from "./linear-structure";
import type {FrameNode,FrameElement} from "./frame-element";
import type {ShellRect} from "./shell-rect";
export type SolverRequest={id:string;nodes:FrameNode[];frames:FrameElement[];shells:ShellRect[];foundation:Foundation|null};
/** One isolated job per Worker. Host cancels synchronous factorization with Worker.terminate(). */
globalThis.onmessage=(event:MessageEvent<SolverRequest>)=>{
 const input=event.data;
 if(!input||typeof input.id!=="string"||!Array.isArray(input.nodes)||!Array.isArray(input.frames)||!Array.isArray(input.shells)){
  globalThis.postMessage({id:input?.id??null,result:{status:"invalid_input",analysisApproved:false,reason:"Invalid Worker request."}});return;
 }
 const start=performance.now();
 const result=solveLinearStructure(input.nodes,input.frames,input.shells,input.foundation,{maxFactorEntries:4000000});
 globalThis.postMessage({id:input.id,result,elapsedMs:performance.now()-start});
};
