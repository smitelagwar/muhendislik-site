import type { UnpackedSceneChunk } from "../../../workers/cad-v2/cad-v2-scene-worker";
import {
  estimateSceneChunkGeometryBufferBytes,
  type CadV2GeometryBufferEstimate,
} from "./curve-refinement-memory-accounting";
import {
  CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
  CAD_V2_GPU_BUFFER_BUDGET_BYTES,
  evaluateCadV2ResourceBudget,
  type CadV2ResourceBudgetStatus,
} from "./chunk-memory-accounting";

export interface HatchFillRefinementPeakEstimate {
  budget: CadV2ResourceBudgetStatus;
  resultBytes: number;
  applyScratchBytes: number;
  replacementGeometry: CadV2GeometryBufferEstimate;
}

/** Minimum resident peak known before the worker has produced replacement triangles. */
export function estimateHatchFillRefinementMinimumPeakResources(options: {
  rendererResources: CadV2GeometryBufferEstimate;
  replacedChunkResources: CadV2GeometryBufferEstimate | null;
  retainedRefinementSourceBytes: number;
  cpuBudgetBytes?: number;
  gpuBudgetBytes?: number;
}): HatchFillRefinementPeakEstimate {
  const {
    rendererResources,
    replacedChunkResources,
    retainedRefinementSourceBytes,
    cpuBudgetBytes = CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
    gpuBudgetBytes = CAD_V2_GPU_BUFFER_BUDGET_BYTES,
  } = options;
  const valid = !!replacedChunkResources && [
    rendererResources.cpuResidentBytes,
    rendererResources.gpuBufferBytesEstimate,
    replacedChunkResources.cpuResidentBytes,
    replacedChunkResources.gpuBufferBytesEstimate,
    retainedRefinementSourceBytes,
  ].every((value) => Number.isSafeInteger(value) && value >= 0) &&
    rendererResources.cpuResidentBytes >= replacedChunkResources.cpuResidentBytes &&
    rendererResources.gpuBufferBytesEstimate >= replacedChunkResources.gpuBufferBytesEstimate;
  return {
    budget: evaluateCadV2ResourceBudget(
      valid ? rendererResources.cpuResidentBytes + retainedRefinementSourceBytes : Number.NaN,
      valid ? rendererResources.gpuBufferBytesEstimate : Number.NaN,
      cpuBudgetBytes,
      gpuBudgetBytes,
    ),
    resultBytes: 0,
    applyScratchBytes: 0,
    replacementGeometry: { cpuResidentBytes: 0, gpuBufferBytesEstimate: 0 },
  };
}

/** Conservative old+new renderer, worker-result, and replacement-array peak for one HATCH chunk swap. */
export function estimateHatchFillRefinementPeakResources(options: {
  replacement: UnpackedSceneChunk;
  resultBytes: number;
  rendererResources: CadV2GeometryBufferEstimate;
  replacedChunkResources: CadV2GeometryBufferEstimate | null;
  retainedRefinementSourceBytes: number;
  cpuBudgetBytes?: number;
  gpuBudgetBytes?: number;
}): HatchFillRefinementPeakEstimate {
  const {
    replacement,
    resultBytes,
    rendererResources,
    replacedChunkResources,
    retainedRefinementSourceBytes,
    cpuBudgetBytes = CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
    gpuBudgetBytes = CAD_V2_GPU_BUFFER_BUDGET_BYTES,
  } = options;
  const replacementGeometry = estimateSceneChunkGeometryBufferBytes(replacement);
  let metadataBytes = Number.NaN;
  try {
    metadataBytes = replacement.meta ? JSON.stringify(replacement.meta).length * 2 : 0;
  } catch {
    metadataBytes = Number.NaN;
  }
  // The runtime applier owns the rebuilt Float32 triangle array and a JSON metadata copy
  // until the synchronous renderer replacement retires the old group.
  const applyScratchBytes = (replacement.trianglesArray?.byteLength ?? 0) + metadataBytes;
  const valid = !!replacementGeometry && !!replacedChunkResources &&
    [rendererResources.cpuResidentBytes, rendererResources.gpuBufferBytesEstimate,
      replacedChunkResources.cpuResidentBytes, replacedChunkResources.gpuBufferBytesEstimate,
      retainedRefinementSourceBytes, resultBytes, applyScratchBytes].every(
      (value) => Number.isSafeInteger(value) && value >= 0,
    ) && rendererResources.cpuResidentBytes >= replacedChunkResources.cpuResidentBytes &&
    rendererResources.gpuBufferBytesEstimate >= replacedChunkResources.gpuBufferBytesEstimate;
  const peakCpuBytes = valid
    ? rendererResources.cpuResidentBytes + replacementGeometry!.cpuResidentBytes +
      retainedRefinementSourceBytes + resultBytes + applyScratchBytes +
      (replacementGeometry!.constructionScratchCpuBytes ?? 0)
    : Number.NaN;
  const peakGpuBytes = valid
    ? rendererResources.gpuBufferBytesEstimate + replacementGeometry!.gpuBufferBytesEstimate
    : Number.NaN;
  return {
    budget: evaluateCadV2ResourceBudget(peakCpuBytes, peakGpuBytes, cpuBudgetBytes, gpuBudgetBytes),
    resultBytes,
    applyScratchBytes,
    replacementGeometry: replacementGeometry ?? { cpuResidentBytes: 0, gpuBufferBytesEstimate: 0 },
  };
}
