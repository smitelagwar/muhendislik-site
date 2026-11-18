import {solveLinearStructure} from "./linear-structure";
import type {FrameNode,FrameElement} from "./frame-element";
import type {solveSparseSpd} from "./sparse-spd";
export {frameLocalStiffness,localFrame} from "./frame-element";
export type {FrameNode,FrameElement,V3} from "./frame-element";
export function solveLinearFrame(nodes:FrameNode[],elements:FrameElement[],options:Parameters<typeof solveSparseSpd>[2]={}) {
 return solveLinearStructure(nodes,elements,[],null,options);
}
