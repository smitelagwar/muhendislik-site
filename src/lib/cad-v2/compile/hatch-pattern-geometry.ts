import type { CadHatchEntity, CadPoint2D } from "../canonical/types";

export const MAX_HATCH_PATTERN_LINES = 16;
export const MAX_HATCH_PATTERN_FAMILY_LINES = 2_048;
export const MAX_HATCH_PATTERN_SEGMENTS = 50_000;
export const MAX_HATCH_PATTERN_INTERSECTION_CHECKS = 500_000;

export interface HatchPatternSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export type HatchPatternGeometryResult =
  | { status: "rendered"; segments: HatchPatternSegment[] }
  | { status: "unsupported"; segments: [] }
  | { status: "limit"; segments: [] };

/**
 * Clips dashless definition-line families to the validated, tessellated HATCH
 * loops using odd-parity intersections. Decoder adapters provide effective
 * line dimensions: predefined PAT rows have already received patternScale,
 * while explicit DXF rows retain their serialized base/offset values.
 */
export function buildHatchPatternSegments(
  hatch: CadHatchEntity,
  rings: CadPoint2D[][],
): HatchPatternGeometryResult {
  const definitions = hatch.patternLines;
  const scale = hatch.patternScale ?? 1;
  const rotationDeg = hatch.patternAngleDeg ?? 0;
  if (!definitions?.length || definitions.length > MAX_HATCH_PATTERN_LINES ||
      !Number.isFinite(scale) || scale <= 0 || !Number.isFinite(rotationDeg) ||
      hatch.patternDouble === true || (hatch.hatchStyle ?? 0) !== 0 ||
      rings.length === 0 || hatch.loops.some((loop) => loop.isClosed === false)) {
    return { status: "unsupported", segments: [] };
  }
  if (rings.some((ring) => ring.length < 3 || ring.some((point) => !Number.isFinite(point[0]) || !Number.isFinite(point[1])))) {
    return { status: "unsupported", segments: [] };
  }

  const segments: HatchPatternSegment[] = [];
  const totalBoundaryEdges = rings.reduce((sum, ring) => sum + ring.length, 0);
  let remainingIntersectionChecks = MAX_HATCH_PATTERN_INTERSECTION_CHECKS;
  const globalRotation = rotationDeg * Math.PI / 180;
  for (const definition of definitions) {
    if (!Number.isFinite(definition.angleRad) ||
        !finitePair(definition.base) || !finitePair(definition.offset) ||
        !Array.isArray(definition.dashLengths) || definition.dashLengths.length !== 0) {
      return { status: "unsupported", segments: [] };
    }

    const angle = definition.angleRad + globalRotation;
    const direction: CadPoint2D = [Math.cos(angle), Math.sin(angle)];
    const normal: CadPoint2D = [-direction[1], direction[0]];
    const base = rotate(definition.base, globalRotation);
    // PAT delta-y is measured perpendicular to the line; delta-x only changes
    // the phase of dashed members and has no geometric effect for continuous
    // infinite lines. DXF group 45/46 preserve these definition-frame values.
    const spacing = Math.abs(definition.offset[1]);
    if (spacing <= 1e-10) return { status: "unsupported", segments: [] };
    const bounds = projectionBounds(rings, normal);
    const baseProjection = dot(base, normal);
    const firstIndex = Math.ceil((bounds.min - baseProjection) / spacing - 1e-10);
    const lastIndex = Math.floor((bounds.max - baseProjection) / spacing + 1e-10);
    const familyLineCount = Math.max(0, lastIndex - firstIndex + 1);
    if (!Number.isSafeInteger(firstIndex) || !Number.isSafeInteger(lastIndex) ||
        familyLineCount > MAX_HATCH_PATTERN_FAMILY_LINES) {
      return { status: "limit", segments: [] };
    }
    const requestedIntersectionChecks = familyLineCount * totalBoundaryEdges;
    if (!Number.isSafeInteger(requestedIntersectionChecks) || requestedIntersectionChecks > remainingIntersectionChecks) {
      return { status: "limit", segments: [] };
    }
    remainingIntersectionChecks -= requestedIntersectionChecks;

    for (let lineIndex = firstIndex; lineIndex <= lastIndex; lineIndex++) {
      const origin: CadPoint2D = [
        base[0] + normal[0] * lineIndex * spacing,
        base[1] + normal[1] * lineIndex * spacing,
      ];
      const intersections: number[] = [];
      for (const ring of rings) {
        for (let edgeIndex = 0; edgeIndex < ring.length; edgeIndex++) {
          const a = ring[edgeIndex]!;
          const b = ring[(edgeIndex + 1) % ring.length]!;
          const rawSideA = dot([a[0] - origin[0], a[1] - origin[1]], normal);
          const rawSideB = dot([b[0] - origin[0], b[1] - origin[1]], normal);
          const sideTolerance = Number.EPSILON * 32 * Math.max(
            1, Math.abs(a[0]), Math.abs(a[1]), Math.abs(b[0]), Math.abs(b[1]),
            Math.abs(origin[0]), Math.abs(origin[1]),
          );
          const sideA = Math.abs(rawSideA) <= sideTolerance ? 0 : rawSideA;
          const sideB = Math.abs(rawSideB) <= sideTolerance ? 0 : rawSideB;
          // Half-open scanline crossings count shared vertices once and ignore
          // a family line that merely coincides with a polygon boundary edge.
          if (!((sideA <= 0 && sideB > 0) || (sideB <= 0 && sideA > 0))) continue;
          const edgeFraction = sideA / (sideA - sideB);
          const intersection: CadPoint2D = [
            a[0] + (b[0] - a[0]) * edgeFraction,
            a[1] + (b[1] - a[1]) * edgeFraction,
          ];
          intersections.push(dot([intersection[0] - origin[0], intersection[1] - origin[1]], direction));
        }
      }
      intersections.sort((a, b) => a - b);
      const uniqueIntersections = intersections.filter((value, index) => index === 0 ||
        Math.abs(value - intersections[index - 1]!) > 1e-8 * Math.max(1, Math.abs(value)));
      if (uniqueIntersections.length % 2 !== 0) return { status: "unsupported", segments: [] };
      for (let index = 0; index < uniqueIntersections.length; index += 2) {
        const start = uniqueIntersections[index]!;
        const end = uniqueIntersections[index + 1]!;
        if (end - start <= 1e-9) continue;
        segments.push({
          x0: origin[0] + direction[0] * start,
          y0: origin[1] + direction[1] * start,
          x1: origin[0] + direction[0] * end,
          y1: origin[1] + direction[1] * end,
        });
        if (segments.length > MAX_HATCH_PATTERN_SEGMENTS) return { status: "limit", segments: [] };
      }
    }
  }
  return { status: "rendered", segments };
}

function projectionBounds(rings: CadPoint2D[][], normal: CadPoint2D): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const ring of rings) {
    for (const point of ring) {
      const projection = dot(point, normal);
      min = Math.min(min, projection);
      max = Math.max(max, projection);
    }
  }
  return { min, max };
}

function finitePair(value: CadPoint2D): boolean {
  return Array.isArray(value) && value.length === 2 && Number.isFinite(value[0]) && Number.isFinite(value[1]);
}

function rotate(point: CadPoint2D, angle: number): CadPoint2D {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return [point[0] * cosine - point[1] * sine, point[0] * sine + point[1] * cosine];
}

function dot(a: CadPoint2D, b: CadPoint2D): number {
  return a[0] * b[0] + a[1] * b[1];
}

