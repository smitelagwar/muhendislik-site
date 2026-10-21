import assert from "node:assert/strict";
import type { UnpackedSceneChunk } from "../../src/workers/cad-v2/cad-v2-scene-worker";
import type { CurveRefinementResult } from "../../src/lib/cad-v2/worker/curve-refinement";
import { CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES } from "../../src/lib/cad-v2/worker/resource-budgets";
import {
  estimateCurveRefinementMinimumPeakResources,
  estimateCurveRefinementPeakResources,
  estimateSceneChunkGeometryBufferBytes,
} from "../../src/lib/cad-v2/render/curve-refinement-memory-accounting";

const source = {
  chunkId: "curve-budget-1",
  origin: [0, 0],
  vertexCount: 4,
  xyArray: new Float32Array([0, 0, 1, 0, 1, 1, 2, 1]),
  drawRunsArray: undefined,
  trianglesArray: undefined,
  pathDistancesArray: new Float32Array([0, 1, 2, 3]),
  curveDataArray: new Float32Array(8),
  meta: {
    drawCommands: [{
      kind: "line",
      firstVertex: 0,
      vertexCount: 4,
      lineweightMm: 0.25,
      dashStyle: { dashSize: 1, gapSize: 1 },
    }],
  },
} as unknown as UnpackedSceneChunk;

const result: CurveRefinementResult = {
  errorBoundMet: true,
  totalSegments: 8,
  totalOutputBytes: 72,
  intervals: [{
    curveId: "curve-1",
    sourceHandle: "A1",
    sourceType: "CIRCLE",
    firstVertex: 0,
    vertexCount: 2,
    firstSegmentIndex: 0,
    sourceSegmentCount: 1,
    coordinates: new Float32Array([
      0, 0, 0.125, 0, 0.25, 0, 0.375, 0, 0.5, 0,
      0.625, 0, 0.75, 0, 0.875, 0, 1, 0,
    ]),
    segmentCount: 8,
    requestedErrorCssPixels: 0.25,
    conservativeErrorCssPixels: 0.2,
    errorBoundMet: true,
    status: "refined",
  }],
};

const replacementGeometry = estimateSceneChunkGeometryBufferBytes(source, result);
assert.deepEqual(replacementGeometry, {
  cpuResidentBytes: 936,
  gpuBufferBytesEstimate: 936,
  constructionScratchCpuBytes: 2784,
});

const common = {
  source,
  result,
  rendererResources: { cpuResidentBytes: 100, gpuBufferBytesEstimate: 100 },
  replacedChunkResources: { cpuResidentBytes: 60, gpuBufferBytesEstimate: 60 },
  retainedRefinementSourceBytes: 500,
};
const knownWorkerSourceCacheBytes = 128;
const minimumPeakCpuBytes = common.rendererResources.cpuResidentBytes +
  common.retainedRefinementSourceBytes + knownWorkerSourceCacheBytes;
const minimumPeakGpuBytes = common.rendererResources.gpuBufferBytesEstimate;
const minimumPeak = estimateCurveRefinementMinimumPeakResources({
  rendererResources: common.rendererResources,
  replacedChunkResources: common.replacedChunkResources,
  retainedRefinementSourceBytes: common.retainedRefinementSourceBytes,
  workerSourceCacheBytes: knownWorkerSourceCacheBytes,
  cpuBudgetBytes: minimumPeakCpuBytes,
  gpuBudgetBytes: minimumPeakGpuBytes,
});
assert.equal(minimumPeak.budget.cpuResidentBytes, minimumPeakCpuBytes);
assert.equal(minimumPeak.budget.gpuBufferBytesEstimate, minimumPeakGpuBytes);
assert.equal(minimumPeak.budget.withinBudget, true, "worker preflight accepts a lower bound exactly at the resident budget");
const noKnownWorkerCachePeak = estimateCurveRefinementMinimumPeakResources({
  rendererResources: common.rendererResources,
  replacedChunkResources: common.replacedChunkResources,
  retainedRefinementSourceBytes: common.retainedRefinementSourceBytes,
  cpuBudgetBytes: common.rendererResources.cpuResidentBytes + common.retainedRefinementSourceBytes,
  gpuBudgetBytes: minimumPeakGpuBytes,
});
assert.equal(noKnownWorkerCachePeak.budget.cpuResidentBytes,
  common.rendererResources.cpuResidentBytes + common.retainedRefinementSourceBytes,
  "an 8 MiB cache capacity is not resident memory and must not be added to the guaranteed lower bound");
const overMinimumPeak = estimateCurveRefinementMinimumPeakResources({
  rendererResources: common.rendererResources,
  replacedChunkResources: common.replacedChunkResources,
  retainedRefinementSourceBytes: common.retainedRefinementSourceBytes,
  workerSourceCacheBytes: knownWorkerSourceCacheBytes,
  cpuBudgetBytes: minimumPeakCpuBytes - 1,
  gpuBudgetBytes: minimumPeakGpuBytes,
});
assert.equal(overMinimumPeak.budget.withinBudget, false,
  "worker preflight skips refinement when already-resident CPU resources exceed budget");
const overMinimumGpuPeak = estimateCurveRefinementMinimumPeakResources({
  rendererResources: common.rendererResources,
  replacedChunkResources: common.replacedChunkResources,
  retainedRefinementSourceBytes: common.retainedRefinementSourceBytes,
  workerSourceCacheBytes: knownWorkerSourceCacheBytes,
  cpuBudgetBytes: minimumPeakCpuBytes,
  gpuBudgetBytes: minimumPeakGpuBytes - 1,
});
assert.equal(overMinimumGpuPeak.budget.withinBudget, false,
  "worker preflight skips refinement when already-resident GPU buffers exceed budget");

const shrinkSource = {
  ...source,
  xyArray: new Float32Array([0, 0, 1, 0, 1, 1, 2, 1]),
  pathDistancesArray: new Float32Array([0, 1, 2, 3]),
  meta: {
    drawCommands: [{
      kind: "line",
      firstVertex: 0,
      vertexCount: 4,
      lineweightMm: 0.25,
      dashStyle: { dashSize: 1, gapSize: 1 },
    }],
  },
} as unknown as UnpackedSceneChunk;
const shrinkResult: CurveRefinementResult = {
  ...result,
  totalSegments: 1,
  totalOutputBytes: 16,
  intervals: [{
    ...result.intervals[0]!,
    vertexCount: 4,
    sourceSegmentCount: 2,
    segmentCount: 1,
    coordinates: new Float32Array([0, 0, 2, 1]),
  }],
};
const shrinkPeakOptions = {
  source: shrinkSource,
  result: shrinkResult,
  rendererResources: { cpuResidentBytes: 1_000, gpuBufferBytesEstimate: 1_000 },
  replacedChunkResources: { cpuResidentBytes: 600, gpuBufferBytesEstimate: 600 },
  retainedRefinementSourceBytes: 100,
  workerSourceCacheBytes: 0,
};
const shrinkPeak = estimateCurveRefinementPeakResources(shrinkPeakOptions);
const shrinkMinimumPeak = estimateCurveRefinementMinimumPeakResources({
  rendererResources: shrinkPeakOptions.rendererResources,
  replacedChunkResources: shrinkPeakOptions.replacedChunkResources,
  retainedRefinementSourceBytes: shrinkPeakOptions.retainedRefinementSourceBytes,
  workerSourceCacheBytes: shrinkPeakOptions.workerSourceCacheBytes,
  cpuBudgetBytes: shrinkPeak.budget.cpuResidentBytes,
  gpuBudgetBytes: shrinkPeak.budget.gpuBufferBytesEstimate,
});
assert.ok(shrinkMinimumPeak.budget.cpuResidentBytes <= shrinkPeak.budget.cpuResidentBytes,
  "the worker preflight CPU floor cannot exceed a valid refinement result that reduces segment count");
assert.ok(shrinkMinimumPeak.budget.gpuBufferBytesEstimate <= shrinkPeak.budget.gpuBufferBytesEstimate,
  "the worker preflight GPU floor cannot exceed a valid refinement result that reduces segment count");
assert.equal(shrinkMinimumPeak.budget.withinBudget, true,
  "the worker preflight must not reject a segment-reducing replacement that fits the exact measured peak");

const exactCpuPeakBytes = 4864 + CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES;
const exactPeak = estimateCurveRefinementPeakResources({
  ...common,
  workerSourceCacheBytes: CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES,
  cpuBudgetBytes: exactCpuPeakBytes,
  gpuBudgetBytes: 1036,
});
assert.equal(exactPeak.budget.cpuResidentBytes, exactCpuPeakBytes);
assert.equal(exactPeak.budget.gpuBufferBytesEstimate, 1036);
assert.equal(exactPeak.budget.withinBudget, true, "replacement accepts when old+new buffers fit exactly");

const overCpuPeak = estimateCurveRefinementPeakResources({ ...common, workerSourceCacheBytes: CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES, cpuBudgetBytes: exactCpuPeakBytes - 1, gpuBudgetBytes: 1036 });
assert.equal(overCpuPeak.budget.withinBudget, false, "replacement rejects a one-byte CPU peak overrun");
const overGpuPeak = estimateCurveRefinementPeakResources({ ...common, workerSourceCacheBytes: CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES, cpuBudgetBytes: exactCpuPeakBytes, gpuBudgetBytes: 1035 });
assert.equal(overGpuPeak.budget.withinBudget, false, "replacement rejects a one-byte GPU-buffer peak overrun");

const workerCachePeak = estimateCurveRefinementPeakResources({
  ...common,
  workerSourceCacheBytes: CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES,
  cpuBudgetBytes: exactCpuPeakBytes,
  gpuBudgetBytes: 1036,
});
assert.equal(workerCachePeak.workerSourceCacheBytes, CAD_V2_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES);
assert.equal(workerCachePeak.budget.withinBudget, true, "peak accounting includes the exact currently retained worker source cache bytes");

const invalid = estimateCurveRefinementPeakResources({
  ...common,
  replacedChunkResources: null,
  cpuBudgetBytes: 10_000,
  gpuBudgetBytes: 10_000,
});
assert.equal(invalid.budget.withinBudget, false, "missing current geometry fails closed before replacement");
assert.equal(Number.isNaN(invalid.budget.cpuResidentBytes), true);

console.log("PASS: curve replacement preflight counts old+new geometry, retained source, result, and apply scratch");
