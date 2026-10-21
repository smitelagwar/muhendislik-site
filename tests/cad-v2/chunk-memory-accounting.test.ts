import assert from "node:assert/strict";
import type { UnpackedSceneChunk } from "../../src/workers/cad-v2/cad-v2-scene-worker";
import {
  CAD_V2_HOST_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES,
  CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
  selectAdditionalRetainedRefinementSourceBytes,
  tryAddSceneChunkWithinBudget,
} from "../../src/lib/cad-v2/render/chunk-memory-accounting";

const KiB = 1024;
const xyArray = new Float32Array(2 * KiB);
const chunk: UnpackedSceneChunk = {
  chunkId: "chunk_renderer-retains-geometry-only",
  origin: [0, 0],
  xyArray,
  drawRunsArray: new Uint32Array(512),
  trianglesArray: new Float32Array(1024),
  pathDistancesArray: null,
  curveDataArray: new Float32Array(64 * KiB),
  meta: {
    drawCommands: [],
    hatchFillSources: Array.from({ length: 3_000 }, (_, index) => ({
      sourceId: `hatch-${index}`,
      boundary: [index, index + 1, index + 2, index + 3],
    })),
  },
  vertexCount: xyArray.length / 2,
};

const rendererBeforeBytes = CAD_V2_CPU_RESIDENT_BUDGET_BYTES - 64 * KiB;
const rendererAddedBytes = 16 * KiB;
let rendererCpuBytes = rendererBeforeBytes;
const target = {
  addSceneChunk() {
    rendererCpuBytes += rendererAddedBytes;
  },
  getResourceMemoryEstimate() {
    return { cpuResidentBytes: rendererCpuBytes, gpuBufferBytesEstimate: 0 };
  },
  getSharedChunkCpuBufferBytes(candidate: UnpackedSceneChunk) {
    return candidate.xyArray.byteLength;
  },
  getAdditionalRetainedChunkCpuBytes() {
    // The renderer owns the geometry backing buffers reported above. This chunk's
    // other decoded arrays and hatch source metadata are discarded after ingestion.
    return 0;
  },
  removeSceneChunk() {
    rendererCpuBytes = rendererBeforeBytes;
  },
} as any;

const admission = tryAddSceneChunkWithinBudget(target, chunk, 0, 0);
assert.equal(admission.accepted, true,
  "temporary decoded arrays and non-retained metadata must not consume the persistent renderer budget");
assert.equal(admission.budget.cpuResidentBytes, rendererBeforeBytes + rendererAddedBytes,
  "the resident estimate must include the renderer's retained geometry only");
assert.equal(admission.budget.withinBudget, true,
  "a fitting renderer geometry must remain admissible near the resident budget ceiling");

rendererCpuBytes = rendererBeforeBytes;
const retainedRefinementAdmission = tryAddSceneChunkWithinBudget(target, chunk, 0, 64 * KiB);
assert.equal(retainedRefinementAdmission.accepted, false,
  "source data retained for later refinement must still count against the persistent renderer budget");
assert.equal(rendererCpuBytes, rendererBeforeBytes,
  "a rejected refinement source candidate must release its temporary renderer geometry");

const MiB = 1024 * KiB;
assert.equal(CAD_V2_HOST_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES, 8 * MiB,
  "optional host refinement sources must leave room in the shared resident CPU budget for base geometry");
assert.equal(selectAdditionalRetainedRefinementSourceBytes(7 * MiB, 1 * MiB), 1 * MiB,
  "the final exact source-cache byte remains retainable at its measured cap");
assert.equal(selectAdditionalRetainedRefinementSourceBytes(7 * MiB, 1 * MiB + 1), 0,
  "optional refinement source admission is rejected above its cap");
assert.equal(selectAdditionalRetainedRefinementSourceBytes(8 * MiB, 64 * KiB), 0,
  "a full optional refinement cache cannot crowd out later visible base geometry");

let largeSceneCpuBytes = 33_500_000;
const largeSceneTarget = {
  addSceneChunk() { largeSceneCpuBytes += 6_800; },
  getResourceMemoryEstimate() {
    return { cpuResidentBytes: largeSceneCpuBytes, gpuBufferBytesEstimate: largeSceneCpuBytes };
  },
  getAdditionalRetainedChunkCpuBytes() { return 6_700; },
  removeSceneChunk() { largeSceneCpuBytes = 33_500_000; },
} as any;
const baseGeometryWithBoundedSources = tryAddSceneChunkWithinBudget(
  largeSceneTarget,
  chunk,
  CAD_V2_HOST_REFINEMENT_SOURCE_CACHE_BUDGET_BYTES,
  0,
);
assert.equal(baseGeometryWithBoundedSources.accepted, true,
  "the measured large-scene baseline must still admit visible base geometry when optional refinement storage is bounded");
assert.ok(baseGeometryWithBoundedSources.budget.cpuResidentBytes <= CAD_V2_CPU_RESIDENT_BUDGET_BYTES,
  "the resident CPU limit remains unchanged while optional sources are capped");

console.log("PASS: resident chunk accounting distinguishes retained geometry, transient decode data, and retained refinement sources");
