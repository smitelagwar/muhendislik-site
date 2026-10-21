export interface CadV2RenderOrderingState {
  loadedChunkCount: number;
  nonPainterDepthChunkCount: number;
  hasAuxiliaryObjects: boolean;
  depthBufferAvailable: boolean;
}

/**
 * Opaque painter-depth batches already carry stable source order in the depth buffer.
 * Keep Three.js sorting whenever any chunk or auxiliary object lacks that contract.
 */
export function canSkipCadV2ObjectSort(state: CadV2RenderOrderingState): boolean {
  return Number.isSafeInteger(state.loadedChunkCount) && state.loadedChunkCount > 0 &&
    Number.isSafeInteger(state.nonPainterDepthChunkCount) && state.nonPainterDepthChunkCount === 0 &&
    !state.hasAuxiliaryObjects && state.depthBufferAvailable;
}
