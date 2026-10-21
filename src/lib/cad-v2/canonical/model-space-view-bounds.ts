import type { CadBBox2D } from "./types";

type RawPoint2D = { x?: unknown; y?: unknown } | null | undefined;

export function modelSpaceViewBoundsFromExtents(min: RawPoint2D, max: RawPoint2D): CadBBox2D | undefined {
  const minX = min?.x;
  const minY = min?.y;
  const maxX = max?.x;
  const maxY = max?.y;
  if (typeof minX !== "number" || !Number.isFinite(minX) ||
      typeof minY !== "number" || !Number.isFinite(minY) ||
      typeof maxX !== "number" || !Number.isFinite(maxX) ||
      typeof maxY !== "number" || !Number.isFinite(maxY)) return undefined;

  const bounds: CadBBox2D = [minX, minY, maxX, maxY];
  if (maxX < minX || maxY < minY) return undefined;
  return bounds;
}

function isFiniteBounds(bounds: CadBBox2D): boolean {
  return bounds.length === 4 && bounds.every(Number.isFinite) && bounds[2] >= bounds[0] && bounds[3] >= bounds[1];
}

export function resolveModelSpaceViewBounds(
  sourceViewBounds: CadBBox2D | undefined,
  compiledGeometryBounds: CadBBox2D,
): CadBBox2D {
  if (!sourceViewBounds || !isFiniteBounds(sourceViewBounds)) return compiledGeometryBounds;
  if (!isFiniteBounds(compiledGeometryBounds)) return sourceViewBounds;

  const overlapsCompiledGeometry = sourceViewBounds[0] <= compiledGeometryBounds[2] &&
    sourceViewBounds[2] >= compiledGeometryBounds[0] &&
    sourceViewBounds[1] <= compiledGeometryBounds[3] &&
    sourceViewBounds[3] >= compiledGeometryBounds[1];
  return overlapsCompiledGeometry ? sourceViewBounds : compiledGeometryBounds;
}
