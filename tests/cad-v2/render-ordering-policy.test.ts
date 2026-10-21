import assert from "node:assert/strict";
import { canSkipCadV2ObjectSort } from "../../src/lib/cad-v2/render/render-ordering-policy";

assert.equal(canSkipCadV2ObjectSort({
  loadedChunkCount: 19_531,
  nonPainterDepthChunkCount: 0,
  hasAuxiliaryObjects: false,
  depthBufferAvailable: true,
}), true, "opaque global painter-depth batches can rely on the depth buffer instead of sorting 19,531 objects");

assert.equal(canSkipCadV2ObjectSort({
  loadedChunkCount: 19_531,
  nonPainterDepthChunkCount: 1,
  hasAuxiliaryObjects: false,
  depthBufferAvailable: true,
}), false, "one legacy or fallback chunk keeps stable Three.js object sorting enabled");

assert.equal(canSkipCadV2ObjectSort({
  loadedChunkCount: 1,
  nonPainterDepthChunkCount: 0,
  hasAuxiliaryObjects: true,
  depthBufferAvailable: true,
}), false, "auxiliary non-depth overlays retain stable ordering");

assert.equal(canSkipCadV2ObjectSort({
  loadedChunkCount: 1,
  nonPainterDepthChunkCount: 0,
  hasAuxiliaryObjects: false,
  depthBufferAvailable: false,
}), false, "painter-depth sorting cannot be skipped without a real depth buffer");

assert.equal(canSkipCadV2ObjectSort({
  loadedChunkCount: 0,
  nonPainterDepthChunkCount: 0,
  hasAuxiliaryObjects: false,
  depthBufferAvailable: true,
}), false, "an empty renderer keeps the default sort policy");

console.log("render-ordering-policy: PASS (depth, legacy fallback, overlays, and empty scene gates)");
