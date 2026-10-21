import type { UnpackedSceneChunk } from "../../../workers/cad-v2/cad-v2-scene-worker";

export const CAD_V2_CPU_RESIDENT_BUDGET_BYTES = 64 * 1024 * 1024;
export const CAD_V2_GPU_BUFFER_BUDGET_BYTES = 64 * 1024 * 1024;
/** Optional host-side source cache; reserve the resident CPU budget for visible render geometry. */
export const CAD_V2_HOST_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES = 8 * 1024 * 1024;

export function selectAdditionalRetainedRefinementSourceBytes(
  retainedBytes: number,
  candidateBytes: number,
  budgetBytes = CAD_V2_HOST_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES,
): number {
  if (![retainedBytes, candidateBytes, budgetBytes].every(Number.isSafeInteger) ||
      retainedBytes < 0 || candidateBytes <= 0 || budgetBytes < 0 ||
      retainedBytes + candidateBytes > budgetBytes) return 0;
  return candidateBytes;
}

/** Subtracts backing stores already counted by the renderer from retained refinement sources. */
export function estimateUnsharedRefinementSourceBytes(sourceBytes: number, sharedRendererBytes: number): number {
  if (!Number.isFinite(sourceBytes) || sourceBytes < 0) return Number.POSITIVE_INFINITY;
  if (!Number.isFinite(sharedRendererBytes) || sharedRendererBytes < 0) return sourceBytes;
  return Math.max(0, sourceBytes - Math.min(sourceBytes, sharedRendererBytes));
}

/** Counts typed-array backing stores plus a metadata serialization reserve; excludes JS object overhead. */
export function estimateUnpackedChunkCpuBytes(chunk: UnpackedSceneChunk): number {
  const buffers = new Set<ArrayBufferLike>();
  let bytes = 0;
  for (const view of [chunk.xyArray, chunk.drawRunsArray, chunk.trianglesArray, chunk.pathDistancesArray, chunk.curveDataArray]) {
    if (!view || buffers.has(view.buffer)) continue;
    buffers.add(view.buffer);
    bytes += view.buffer.byteLength;
  }
  if (chunk.positionCodec) bytes += 128; // Conservative JS object/number storage reserve for the five codec fields.
  if (chunk.overviewLod) bytes += 128; // Resident scale/error bookkeeping used to restore detail on camera-scale changes.
  if (chunk.meta) bytes += JSON.stringify(chunk.meta).length * 4;
  return bytes;
}

/** Drops phase arrays that are not consumed by the renderer's shader-dash path. */
export function releaseUnusedCadV2PathDistances(chunk: UnpackedSceneChunk): number {
  const needsShaderPhase = Array.isArray(chunk.meta?.drawCommands) && chunk.meta.drawCommands.some((command: any) =>
    command?.kind === "line" && command.dashStyle && typeof command.dashStyle === "object");
  if (needsShaderPhase || !chunk.pathDistancesArray) return 0;
  const releasedBytes = chunk.pathDistancesArray.byteLength;
  chunk.pathDistancesArray = null;
  return releasedBytes;
}

/** Releases ingestion-only arrays and fallback runs once drawCommands are resident in the renderer. */
export function releaseUnusedCadV2ChunkSourceMetadata(chunk: UnpackedSceneChunk): number {
  const beforeBytes = estimateUnpackedChunkCpuBytes(chunk);
  if (Array.isArray(chunk.meta?.drawCommands) && chunk.meta.drawCommands.length > 0) {
    // drawCommands are the authoritative renderer/refinement representation. Keep legacy
    // runs for older chunks that still require the fallback renderer path.
    delete chunk.meta.layerRuns;
    delete chunk.meta.triangleRuns;
  }
  // The renderer consumes drawCommands and typed geometry; this packed protocol view is
  // not used after admission. Null it to release its backing store when no other view owns it.
  chunk.drawRunsArray = null;
  return Math.max(0, beforeBytes - estimateUnpackedChunkCpuBytes(chunk));
}

export interface CadV2ResourceBudgetStatus {
  withinBudget: boolean;
  cpuResidentBytes: number;
  gpuBufferBytesEstimate: number;
  cpuBudgetBytes: number;
  gpuBudgetBytes: number;
}

export interface CadV2ChunkResourceTarget {
  addSceneChunk(chunk: UnpackedSceneChunk): void;
  getResourceMemoryEstimate(): { cpuResidentBytes: number; gpuBufferBytesEstimate: number };
  getSharedChunkCpuBufferBytes?(chunk: UnpackedSceneChunk): number;
  /** Bytes retained by the target outside the resource estimate returned above. */
  getAdditionalRetainedChunkCpuBytes?(chunk: UnpackedSceneChunk): number;
  removeSceneChunk(chunkId: string): void;
}

export interface CadV2ChunkAdmissionResult {
  accepted: boolean;
  budget: CadV2ResourceBudgetStatus;
  geometryCpuBytesAdded: number;
  sharedIncomingCpuBytes: number;
  incomingUnpackedCpuBytes: number;
  additionalRetainedRendererCpuBytes: number;
  candidateRetainedRefinementSourceBytes: number;
  candidateCpuBytes: number;
  candidateGpuBufferBytes: number;
}

export function evaluateCadV2ResourceBudget(
  cpuResidentBytes: number,
  gpuBufferBytesEstimate: number,
  cpuBudgetBytes = CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
  gpuBudgetBytes = CAD_V2_GPU_BUFFER_BUDGET_BYTES,
): CadV2ResourceBudgetStatus {
  const valid = [cpuResidentBytes, gpuBufferBytesEstimate, cpuBudgetBytes, gpuBudgetBytes]
    .every((value) => Number.isFinite(value) && value >= 0);
  return {
    withinBudget: valid && cpuResidentBytes <= cpuBudgetBytes && gpuBufferBytesEstimate <= gpuBudgetBytes,
    cpuResidentBytes,
    gpuBufferBytesEstimate,
    cpuBudgetBytes,
    gpuBudgetBytes,
  };
}

/** Adds a chunk, measures the resident estimate, and disposes it immediately when over budget. */
export function tryAddSceneChunkWithinBudget(
  target: CadV2ChunkResourceTarget,
  chunk: UnpackedSceneChunk,
  retainedRefinementSourceBytes: number,
  candidateRetainedRefinementSourceBytes: number | ((sharedRendererCpuBytes: number) => number) = 0,
): CadV2ChunkAdmissionResult {
  const previousResources = target.getResourceMemoryEstimate();
  target.addSceneChunk(chunk);
  releaseUnusedCadV2ChunkSourceMetadata(chunk);
  const rendererEstimate = target.getResourceMemoryEstimate();
  const geometryCpuBytesAdded = Math.max(0, rendererEstimate.cpuResidentBytes - previousResources.cpuResidentBytes);
  const incomingCpuBytes = estimateUnpackedChunkCpuBytes(chunk);
  const sharedIncomingCpuBytes = Math.min(
    incomingCpuBytes,
    Math.max(0, target.getSharedChunkCpuBufferBytes?.(chunk) ?? 0),
  );
  const retainedSourceBytes = typeof candidateRetainedRefinementSourceBytes === "function"
    ? candidateRetainedRefinementSourceBytes(sharedIncomingCpuBytes)
    : candidateRetainedRefinementSourceBytes;
  const candidateGpuBufferBytes = Math.max(0, rendererEstimate.gpuBufferBytesEstimate - previousResources.gpuBufferBytesEstimate);
  const unsharedIncomingCpuBytes = Math.max(0, incomingCpuBytes - sharedIncomingCpuBytes);
  const additionalRetainedRendererCpuBytes = target.getAdditionalRetainedChunkCpuBytes
    ? target.getAdditionalRetainedChunkCpuBytes(chunk)
    : unsharedIncomingCpuBytes;
  const safeAdditionalRetainedRendererCpuBytes = Number.isFinite(additionalRetainedRendererCpuBytes) &&
    additionalRetainedRendererCpuBytes >= 0
    ? additionalRetainedRendererCpuBytes
    : Number.POSITIVE_INFINITY;
  // Renderer-owned geometry is already in rendererEstimate. Only count source buffers
  // the renderer retains outside that estimate, or refinement data the host keeps alive.
  // Decode arrays and metadata that are discarded after ingestion are transient and are
  // measured through the browser/worker process peak instead of the resident renderer cap.
  const incrementalChunkCpuBytes = Math.max(safeAdditionalRetainedRendererCpuBytes, retainedSourceBytes);
  const budget = evaluateCadV2ResourceBudget(
    rendererEstimate.cpuResidentBytes + retainedRefinementSourceBytes + incrementalChunkCpuBytes,
    rendererEstimate.gpuBufferBytesEstimate,
  );
  if (!budget.withinBudget) target.removeSceneChunk(chunk.chunkId);
  return {
    accepted: budget.withinBudget,
    budget,
    geometryCpuBytesAdded,
    sharedIncomingCpuBytes,
    incomingUnpackedCpuBytes: unsharedIncomingCpuBytes,
    additionalRetainedRendererCpuBytes: safeAdditionalRetainedRendererCpuBytes,
    candidateRetainedRefinementSourceBytes: retainedSourceBytes,
    candidateCpuBytes: geometryCpuBytesAdded + incrementalChunkCpuBytes,
    candidateGpuBufferBytes,
  };
}
