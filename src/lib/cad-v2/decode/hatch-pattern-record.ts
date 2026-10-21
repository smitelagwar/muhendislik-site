import type { CadPoint2D, CadHatchEntity } from "../canonical/types";

interface RawPatternLine {
  angle?: unknown;
  base?: unknown;
  offset?: unknown;
  dashLengths?: unknown;
}

interface PatternAngleSource {
  getRenderablePatternAngle?: () => unknown;
  patternAngle?: unknown;
}

/** Converts the decoder's HATCH definition-line records without inventing missing values. */
export function mapHatchPatternLines(raw: unknown): NonNullable<CadHatchEntity["patternLines"]> | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((entry: unknown) => {
    const line = entry && typeof entry === "object" ? entry as RawPatternLine : {};
    return {
      angleRad: numericOrNaN(line.angle),
      base: point2D(line.base),
      offset: point2D(line.offset),
      dashLengths: Array.isArray(line.dashLengths)
        ? line.dashLengths.map(numericOrNaN)
        : undefined,
    };
  });
}

function point2D(value: unknown): CadPoint2D {
  if (Array.isArray(value)) return [numericOrNaN(value[0]), numericOrNaN(value[1])];
  if (value && typeof value === "object") {
    const point = value as { x?: unknown; y?: unknown };
    return [numericOrNaN(point.x), numericOrNaN(point.y)];
  }
  return [Number.NaN, Number.NaN];
}

function numericOrNaN(value: unknown): number {
  return typeof value === "number" ? value : Number.NaN;
}

export function radiansToPatternAngleDegrees(angleRad: unknown): number {
  return typeof angleRad === "number" && Number.isFinite(angleRad) ? angleRad * 180 / Math.PI : Number.NaN;
}

/**
 * AcDbHatch keeps explicit DXF line definitions already rotated by group 52;
 * generated PAT rows need the entity-level rotation. The dependency's private
 * helper encodes that distinction, so use it only while the pinned decoder is
 * present and otherwise fail back to the explicit-line contract.
 */
export function getDxfRenderablePatternAngleDegrees(entity: unknown, definitionLineCount: number): number {
  const source = entity && typeof entity === "object" ? entity as PatternAngleSource : undefined;
  let angleRad: unknown;
  if (typeof source?.getRenderablePatternAngle === "function") {
    try {
      angleRad = source.getRenderablePatternAngle();
    } catch {
      angleRad = undefined;
    }
  } else if (definitionLineCount === 0) {
    angleRad = source?.patternAngle;
  } else {
    angleRad = 0;
  }
  return radiansToPatternAngleDegrees(angleRad);
}
