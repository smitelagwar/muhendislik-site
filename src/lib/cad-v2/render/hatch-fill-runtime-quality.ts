import type { CadBBox2D } from "../canonical/types";
import type { CadCameraState } from "../interaction/d3-camera-adapter";
import { isChunkVisibleInCamera } from "./chunk-visibility";

export interface HatchFillQualityChunk {
  chunkId: string;
  layoutId: string;
  bbox?: CadBBox2D;
  maxHatchFillEncodedGeometryErrorWorld?: number;
}

export interface HatchFillRuntimeQuality {
  status: "within-budget" | "over-budget" | "unverifiable";
  targetErrorCssPixels: number;
  maxErrorCssPixels: number;
  visibleChunkCount: number;
  affectedChunkIds: string[];
  unverifiableChunkIds: string[];
}

/** Re-evaluates the compiled static HATCH fill bound at the active camera scale. */
export function evaluateVisibleHatchFillQuality(
  chunks: readonly HatchFillQualityChunk[],
  camera: CadCameraState,
  layoutId: string,
  targetErrorCssPixels: number,
): HatchFillRuntimeQuality {
  const base = {
    targetErrorCssPixels,
    maxErrorCssPixels: 0,
    visibleChunkCount: 0,
    affectedChunkIds: [] as string[],
    unverifiableChunkIds: [] as string[],
  };
  if (!Number.isFinite(camera.unitsPerCssPixel) || camera.unitsPerCssPixel <= 0 ||
      !Number.isFinite(targetErrorCssPixels) || targetErrorCssPixels <= 0) {
    return { ...base, status: "unverifiable" };
  }

  const visible = chunks.filter((chunk) => chunk.layoutId === layoutId && isChunkVisibleInCamera(chunk.bbox, camera));
  let maxErrorCssPixels = 0;
  const affectedChunkIds: string[] = [];
  const unverifiableChunkIds: string[] = [];
  for (const chunk of visible) {
    const errorWorld = chunk.maxHatchFillEncodedGeometryErrorWorld;
    // Old manifests may omit this optional metric; they cannot claim a numeric screen bound.
    if (errorWorld === undefined || !Number.isFinite(errorWorld) || errorWorld < 0) {
      unverifiableChunkIds.push(chunk.chunkId);
      continue;
    }
    const errorCssPixels = errorWorld / camera.unitsPerCssPixel;
    maxErrorCssPixels = Math.max(maxErrorCssPixels, errorCssPixels);
    if (errorCssPixels > targetErrorCssPixels * (1 + 1e-12)) affectedChunkIds.push(chunk.chunkId);
  }

  return {
    status: affectedChunkIds.length > 0
      ? "over-budget"
      : unverifiableChunkIds.length > 0 ? "unverifiable" : "within-budget",
    targetErrorCssPixels,
    maxErrorCssPixels,
    visibleChunkCount: visible.length,
    affectedChunkIds,
    unverifiableChunkIds,
  };
}
