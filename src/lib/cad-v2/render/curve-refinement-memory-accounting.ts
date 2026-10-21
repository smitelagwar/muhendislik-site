import type { UnpackedSceneChunk } from "../../../workers/cad-v2/cad-v2-scene-worker";
import type { CurveRefinementResult, RefinedCurveInterval } from "../worker/curve-refinement";
import {
  CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
  CAD_V2_GPU_BUFFER_BUDGET_BYTES,
  evaluateCadV2ResourceBudget,
  type CadV2ResourceBudgetStatus,
} from "./chunk-memory-accounting";

const FLOAT32_BYTES = Float32Array.BYTES_PER_ELEMENT;
const FLOAT64_BYTES = Float64Array.BYTES_PER_ELEMENT;

export interface CadV2GeometryBufferEstimate {
  cpuResidentBytes: number;
  gpuBufferBytesEstimate: number;
  /** Temporary JS numeric-array payload used by lineweight and shader-pattern builders. */
  constructionScratchCpuBytes?: number;
}

export interface CadV2CurveRefinementPeakEstimate {
  budget: CadV2ResourceBudgetStatus;
  workerSourceCacheBytes: number;
  refinementResultBytes: number;
  applyScratchBytes: number;
  replacementSourceBytes: number;
  replacementGeometry: CadV2GeometryBufferEstimate;
}

interface RefinementProjection {
  intervals: RefinedCurveInterval[];
  outputVertexCount: number;
  resultBytes: number;
  applyScratchBytes: number;
}

function isSafeByteCount(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function eligibleIntervals(result: CurveRefinementResult): RefinedCurveInterval[] | null {
  if (!result.errorBoundMet || !Array.isArray(result.intervals)) return null;
  const intervals = result.intervals
    .filter((item) => item.status === "refined" && item.errorBoundMet &&
      item.coordinates instanceof Float32Array && item.segmentCount > 0)
    .slice()
    .sort((left, right) => left.firstVertex - right.firstVertex);
  return intervals;
}

function projectRefinement(
  source: UnpackedSceneChunk,
  result: CurveRefinementResult,
): RefinementProjection | null {
  const intervals = eligibleIntervals(result);
  if (!intervals || intervals.length === 0) return null;
  const sourceVertexCount = source.xyArray.length / 2;
  const drawCommands = Array.isArray(source.meta?.drawCommands) ? source.meta.drawCommands as Array<{
    kind: string;
    firstVertex: number;
    vertexCount: number;
  }> : [];
  const lineCommands = drawCommands.filter((command) => command.kind === "line");
  let previousEnd = 0;
  let outputVertexCount = sourceVertexCount;
  let resultBytes = 0;
  let applyScratchBytes = 0;

  for (const item of intervals) {
    const end = item.firstVertex + item.vertexCount;
    if (!Number.isSafeInteger(item.firstVertex) || !Number.isSafeInteger(item.vertexCount) ||
        !Number.isSafeInteger(item.segmentCount) || item.firstVertex < previousEnd ||
        item.firstVertex < 0 || item.vertexCount < 1 || end > sourceVertexCount ||
        item.vertexCount !== item.sourceSegmentCount * 2 ||
        item.coordinates!.length !== (item.segmentCount + 1) * 2) {
      return null;
    }
    const owners = lineCommands.filter((command) =>
      command.firstVertex <= item.firstVertex && command.firstVertex + command.vertexCount >= end);
    if (owners.length !== 1) return null;
    const delta = item.segmentCount * 2 - item.vertexCount;
    outputVertexCount += delta;
    resultBytes += item.coordinates!.byteLength;
    // applyCurveRefinementsToChunk holds segment coordinates and path values until
    // the final replacement arrays have been copied, plus one Float64 length per segment.
    applyScratchBytes += item.segmentCount * (4 * FLOAT32_BYTES + FLOAT64_BYTES);
    if (source.pathDistancesArray) applyScratchBytes += item.segmentCount * 2 * FLOAT32_BYTES;
    previousEnd = end;
  }
  if (!Number.isSafeInteger(outputVertexCount) || outputVertexCount < 0 ||
      !isSafeByteCount(resultBytes) || !isSafeByteCount(applyScratchBytes)) return null;

  return { intervals, outputVertexCount, resultBytes, applyScratchBytes };
}

/**
 * Upper-bounds the renderer's output attribute buffers for this chunk. Each draw
 * command is counted separately, so adjacent commands that the renderer merges
 * cannot make the result smaller than the actual allocation.
 */
export function estimateSceneChunkGeometryBufferBytes(
  chunk: UnpackedSceneChunk,
  result?: CurveRefinementResult,
): CadV2GeometryBufferEstimate | null {
  const projection = result ? projectRefinement(chunk, result) : null;
  if (result && !projection) return null;
  const intervals = projection?.intervals ?? [];
  const vertexCountAfter = (firstVertex: number, vertexCount: number, kind: string): number | null => {
    if (kind !== "line" || intervals.length === 0) return vertexCount;
    const end = firstVertex + vertexCount;
    let output = vertexCount;
    for (const item of intervals) {
      const itemEnd = item.firstVertex + item.vertexCount;
      const overlaps = item.firstVertex < end && itemEnd > firstVertex;
      const contained = item.firstVertex >= firstVertex && itemEnd <= end;
      if (overlaps && !contained) return null;
      if (contained) output += item.segmentCount * 2 - item.vertexCount;
    }
    return output;
  };

  let attributeBytes = 0;
  let constructionScratchCpuBytes = 0;
  const add = (bytes: number): boolean => {
    if (!isSafeByteCount(bytes) || !isSafeByteCount(attributeBytes + bytes)) return false;
    attributeBytes += bytes;
    return true;
  };
  const commands = Array.isArray(chunk.meta?.drawCommands) ? chunk.meta.drawCommands as Array<{
    kind: string;
    firstVertex: number;
    vertexCount: number;
    lineweightMm?: number;
    dashStyle?: unknown;
  }> : [];
  if (commands.length > 0) {
    for (const command of commands) {
      const count = vertexCountAfter(command.firstVertex, command.vertexCount, command.kind);
      if (count === null || !Number.isSafeInteger(count) || count < 0 ||
          !Number.isSafeInteger(command.firstVertex) || !Number.isSafeInteger(command.vertexCount) ||
          command.firstVertex < 0 || command.vertexCount < 0) return null;
      if (command.kind === "line") {
        if (!add(count * 3 * FLOAT32_BYTES)) return null;
        if (command.dashStyle && !add(count * FLOAT32_BYTES)) return null;
        if ((command.lineweightMm ?? 0) > 1e-4) {
          const segments = Math.ceil(count / 2);
          if (!add(segments * 6 * 3 * FLOAT32_BYTES)) return null;
          // quadVerts holds at most 18 numeric values per segment while its final
          // Float32Array is created; reserve 16 bytes per value for the JS array payload.
          constructionScratchCpuBytes += segments * 18 * 16 + (segments > 0 ? 12 * 16 : 0);
        }
        const pattern = (command.dashStyle as { pattern?: number[] } | undefined)?.pattern;
        if (pattern?.length) {
          if (pattern.length > 12) return null;
          constructionScratchCpuBytes += 12 * 16 + 12 * FLOAT32_BYTES;
        }
      } else if ((command.kind === "triangle" || command.kind === "wipeout") && chunk.trianglesArray) {
        if (!add(count * 3 * FLOAT32_BYTES)) return null;
      }
      if (!Number.isSafeInteger(constructionScratchCpuBytes)) return null;
    }
  } else {
    const layerRuns = chunk.meta?.layerRuns ?? [];
    if (layerRuns.length > 0) {
      for (const run of layerRuns) {
        if (!add(run.vertexCount * 3 * FLOAT32_BYTES)) return null;
      }
    } else if (chunk.xyArray.length > 0 && !add(chunk.xyArray.length / 2 * 3 * FLOAT32_BYTES)) {
      return null;
    }
    // Legacy chunks render the complete triangle array after the line/layer-run path.
    if (chunk.trianglesArray && !add(chunk.trianglesArray.length / 2 * 3 * FLOAT32_BYTES)) return null;
  }

  return {
    cpuResidentBytes: attributeBytes,
    gpuBufferBytesEstimate: attributeBytes,
    constructionScratchCpuBytes,
  };
}

/**
 * Measures only resources that must remain resident before a worker result exists.
 * A valid result may replace a source curve with fewer segments, so no positive
 * replacement-geometry size is a safe lower bound at this stage.
 */
export function estimateCurveRefinementMinimumPeakResources(options: {
  rendererResources: CadV2GeometryBufferEstimate;
  replacedChunkResources: CadV2GeometryBufferEstimate | null;
  retainedRefinementSourceBytes: number;
  /** Exact worker cache/source bytes known to be resident during this refinement. */
  workerSourceCacheBytes?: number;
  cpuBudgetBytes?: number;
  gpuBudgetBytes?: number;
}): CadV2CurveRefinementPeakEstimate {
  const {
    rendererResources,
    replacedChunkResources,
    retainedRefinementSourceBytes,
    workerSourceCacheBytes = 0,
    cpuBudgetBytes = CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
    gpuBudgetBytes = CAD_V2_GPU_BUFFER_BUDGET_BYTES,
  } = options;
  const valid = !!replacedChunkResources &&
    [rendererResources.cpuResidentBytes, rendererResources.gpuBufferBytesEstimate,
      replacedChunkResources?.cpuResidentBytes, replacedChunkResources?.gpuBufferBytesEstimate,
      retainedRefinementSourceBytes, workerSourceCacheBytes].every(
      (value) => Number.isFinite(value) && value >= 0,
    ) && rendererResources.cpuResidentBytes >= replacedChunkResources!.cpuResidentBytes &&
    rendererResources.gpuBufferBytesEstimate >= replacedChunkResources!.gpuBufferBytesEstimate;
  const peakCpuBytes = valid
    ? rendererResources.cpuResidentBytes + retainedRefinementSourceBytes + workerSourceCacheBytes
    : Number.NaN;
  const peakGpuBytes = valid
    ? rendererResources.gpuBufferBytesEstimate
    : Number.NaN;
  return {
    budget: evaluateCadV2ResourceBudget(peakCpuBytes, peakGpuBytes, cpuBudgetBytes, gpuBudgetBytes),
    workerSourceCacheBytes,
    refinementResultBytes: 0,
    applyScratchBytes: 0,
    replacementSourceBytes: 0,
    replacementGeometry: { cpuResidentBytes: 0, gpuBufferBytesEstimate: 0 },
  };
}

/** Estimates the known typed-array peak while old and replacement geometry overlap. */
export function estimateCurveRefinementPeakResources(options: {
  source: UnpackedSceneChunk;
  result: CurveRefinementResult;
  rendererResources: CadV2GeometryBufferEstimate;
  replacedChunkResources: CadV2GeometryBufferEstimate | null;
  retainedRefinementSourceBytes: number;
  /** Exact worker cache/source bytes known to be resident during this refinement. */
  workerSourceCacheBytes?: number;
  cpuBudgetBytes?: number;
  gpuBudgetBytes?: number;
}): CadV2CurveRefinementPeakEstimate {
  const {
    source,
    result,
    rendererResources,
    replacedChunkResources,
    retainedRefinementSourceBytes,
    workerSourceCacheBytes = 0,
    cpuBudgetBytes = CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
    gpuBudgetBytes = CAD_V2_GPU_BUFFER_BUDGET_BYTES,
  } = options;
  const projection = projectRefinement(source, result);
  const replacementGeometry = estimateSceneChunkGeometryBufferBytes(source, result);
  const valid = !!projection && !!replacementGeometry && !!replacedChunkResources &&
    [rendererResources.cpuResidentBytes, rendererResources.gpuBufferBytesEstimate,
      replacedChunkResources?.cpuResidentBytes, replacedChunkResources?.gpuBufferBytesEstimate,
      retainedRefinementSourceBytes, workerSourceCacheBytes].every(
      (value) => Number.isFinite(value) && value >= 0,
    ) && rendererResources.cpuResidentBytes >= replacedChunkResources!.cpuResidentBytes &&
    rendererResources.gpuBufferBytesEstimate >= replacedChunkResources!.gpuBufferBytesEstimate;

  let refinementResultBytes = 0;
  let applyScratchBytes = 0;
  let replacementSourceBytes = 0;
  if (projection) {
    refinementResultBytes = projection.resultBytes;
    applyScratchBytes = projection.applyScratchBytes;
    replacementSourceBytes = projection.outputVertexCount * 2 * FLOAT32_BYTES +
      (source.pathDistancesArray ? projection.outputVertexCount * FLOAT32_BYTES : 0);
  }
  const peakCpuBytes = valid
    ? rendererResources.cpuResidentBytes + replacementGeometry!.cpuResidentBytes +
      retainedRefinementSourceBytes + workerSourceCacheBytes +
      refinementResultBytes + applyScratchBytes + replacementSourceBytes +
      (replacementGeometry!.constructionScratchCpuBytes ?? 0)
    : Number.NaN;
  const peakGpuBytes = valid
    ? rendererResources.gpuBufferBytesEstimate + replacementGeometry!.gpuBufferBytesEstimate
    : Number.NaN;
  return {
    budget: evaluateCadV2ResourceBudget(peakCpuBytes, peakGpuBytes, cpuBudgetBytes, gpuBudgetBytes),
    workerSourceCacheBytes,
    refinementResultBytes,
    applyScratchBytes,
    replacementSourceBytes,
    replacementGeometry: replacementGeometry ?? { cpuResidentBytes: 0, gpuBufferBytesEstimate: 0 },
  };
}
