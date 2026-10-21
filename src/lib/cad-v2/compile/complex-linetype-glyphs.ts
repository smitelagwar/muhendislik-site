import type {
  CadArcEntity,
  CadEntity,
  CadLwPolylineEntity,
  CadLinetype,
  CadLinetypeComplexElement,
  CadPoint2D,
  CadSplineEntity,
  CadTextStyle,
} from "../canonical/types";
import { FontLayoutEngine, type TextGlyphSegment } from "../text/font-layout-engine";
import type { CadTextEntity } from "../canonical/types";
import { GeometryCompiler } from "./geometry-compiler";

export interface ComplexLinetypeGlyphSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface ComplexLinetypeGlyphResult {
  segments: ComplexLinetypeGlyphSegment[];
  unsupportedElements: Array<{ patternIndex: number; reason: string }>;
}

const MAX_COMPLEX_GLYPH_INSTANCES = 65_536;

export interface ComplexLinetypePathSegment {
  length: number;
  pointAtDistance(distance: number): CadPoint2D;
  tangentAngleAtDistance(distance: number): number;
}

export interface ComplexLinetypePath {
  segments: ComplexLinetypePathSegment[];
  closed?: boolean;
}

function linePathSegment(start: CadPoint2D, end: CadPoint2D): ComplexLinetypePathSegment | undefined {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length <= 1e-9) return undefined;
  const tangentAngle = Math.atan2(dy, dx);
  return {
    length,
    pointAtDistance(distance) {
      const t = Math.max(0, Math.min(1, distance / length));
      return [start[0] + dx * t, start[1] + dy * t];
    },
    tangentAngleAtDistance: () => tangentAngle,
  };
}

function circularPathSegment(
  center: CadPoint2D,
  radius: number,
  startAngle: number,
  sweep: number,
): ComplexLinetypePathSegment | undefined {
  const length = Math.abs(radius * sweep);
  if (![...center, radius, startAngle, sweep, length].every(Number.isFinite) || radius <= 0 || length <= 1e-9) return undefined;
  const direction = Math.sign(sweep);
  return {
    length,
    pointAtDistance(distance) {
      const angle = startAngle + direction * Math.max(0, Math.min(length, distance)) / radius;
      return [center[0] + radius * Math.cos(angle), center[1] + radius * Math.sin(angle)];
    },
    tangentAngleAtDistance(distance) {
      const angle = startAngle + direction * Math.max(0, Math.min(length, distance)) / radius;
      return angle + direction * Math.PI / 2;
    },
  };
}

function sampledPath(points: CadPoint2D[], closed = false): ComplexLinetypePath | undefined {
  const segments: ComplexLinetypePathSegment[] = [];
  for (let index = 0; index + 1 < points.length; index++) {
    const segment = linePathSegment(points[index]!, points[index + 1]!);
    if (segment) segments.push(segment);
  }
  if (closed && points.length > 1) {
    const first = points[0]!;
    const last = points.at(-1)!;
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) > 1e-9) {
      const segment = linePathSegment(last, first);
      if (segment) segments.push(segment);
    }
  }
  return segments.length ? { segments, closed } : undefined;
}

function normalizedArcSweep(entity: CadArcEntity): number {
  const direction = entity.isClockwise ? -1 : 1;
  let sweep = entity.endAngleRad - entity.startAngleRad;
  if (entity.isClockwise && sweep > 0) sweep -= Math.PI * 2;
  else if (!entity.isClockwise && sweep < 0) sweep += Math.PI * 2;
  return Math.abs(sweep) < 1e-9 ? direction * Math.PI * 2 : sweep;
}

function activeComplexElements(linetype: CadLinetype | undefined): CadLinetypeComplexElement[] {
  return (linetype?.complexElements ?? []).filter((element) => {
    const flags = element.elementTypeFlag;
    const hasPayload = (element.text?.length ?? 0) > 0
      || (element.shapeNumber !== undefined && element.shapeNumber !== 0)
      || Boolean(element.styleObjectId?.trim());
    return (flags & 0b110) !== 0 || (flags & ~0b111) !== 0 || hasPayload;
  });
}

function polylinePaths(entity: CadLwPolylineEntity): ComplexLinetypePath[] {
  const vertices = entity.vertices;
  const count = entity.isClosed ? vertices.length : vertices.length - 1;
  if (count <= 0) return [];
  const edgeSegments: ComplexLinetypePathSegment[][] = [];
  for (let index = 0; index < count; index++) {
    const current = vertices[index]!;
    const next = vertices[(index + 1) % vertices.length]!;
    const start: CadPoint2D = [current.x, current.y];
    const end: CadPoint2D = [next.x, next.y];
    const arc = GeometryCompiler.getBulgeArcParameters(start, end, current.bulge ?? 0);
    const segment = arc
      ? circularPathSegment(arc.center, arc.radius, arc.startAngleRad, arc.sweepRad)
      : linePathSegment(start, end);
    edgeSegments.push(segment ? [segment] : []);
  }
  if (entity.plinegen === false) {
    return edgeSegments.filter((segments) => segments.length).map((segments) => ({ segments }));
  }
  const segments = edgeSegments.flat();
  return segments.length ? [{ segments, closed: entity.isClosed }] : [];
}

/** Build source-space paths whose distances are measured before INSERT/viewport transforms. */
export function buildComplexLinetypePaths(
  entity: CadEntity,
  maxCurveErrorWorld = 0.25,
  maxCurveSegments = 65_536,
): ComplexLinetypePath[] {
  switch (entity.type) {
    case "LINE": {
      const segment = linePathSegment(entity.start, entity.end);
      return segment ? [{ segments: [segment] }] : [];
    }
    case "ARC": {
      const segment = circularPathSegment(entity.center, entity.radius, entity.startAngleRad, normalizedArcSweep(entity));
      const isFullSweep = Math.abs(Math.abs(normalizedArcSweep(entity)) - Math.PI * 2) <= 1e-9;
      return segment ? [{ segments: [segment], closed: isFullSweep }] : [];
    }
    case "CIRCLE": {
      const segment = circularPathSegment(entity.center, entity.radius, 0, Math.PI * 2);
      return segment ? [{ segments: [segment], closed: true }] : [];
    }
    case "LWPOLYLINE":
      return polylinePaths(entity);
    case "ELLIPSE": {
      const curve = GeometryCompiler.tessellateEllipseWithBudget(
        entity.center, entity.majorAxisVector, entity.axisRatio, entity.startParam, entity.endParam,
        maxCurveErrorWorld, maxCurveSegments,
      );
      const sweep = entity.endParam - entity.startParam <= 0
        ? entity.endParam - entity.startParam + Math.PI * 2 : entity.endParam - entity.startParam;
      const path = sampledPath(curve.points, Math.abs(Math.abs(sweep) - Math.PI * 2) <= 1e-9);
      return path ? [path] : [];
    }
    case "SPLINE": {
      const curve = GeometryCompiler.tessellateSplineWithBudget(entity, maxCurveErrorWorld, maxCurveSegments);
      if (curve.invalidInput) return [];
      const path = sampledPath(curve.points, entity.isPeriodic);
      return path ? [path] : [];
    }
    default:
      return [];
  }
}

/** Resolve a complex-element STYLE pointer only against decoded, identified STYLE records. */
function resolveStyle(styleObjectId: string | undefined, styles: Record<string, CadTextStyle>): CadTextStyle | undefined {
  if (!styleObjectId?.trim()) return undefined;
  const handle = styleObjectId.trim().replace(/^0x/i, "").toUpperCase();
  const byHandle = Object.values(styles).find((style) => style.objectHandle?.replace(/^0x/i, "").toUpperCase() === handle);
  if (byHandle) return byHandle;
  return styles[styleObjectId] || styles[`@${handle}`];
}

function mapPlacedSegments(
  local: TextGlyphSegment[],
  origin: CadPoint2D,
  angle: number,
): ComplexLinetypeGlyphSegment[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const mapPoint = (x: number, y: number): CadPoint2D => [origin[0] + x * cos - y * sin, origin[1] + x * sin + y * cos];
  return local.map((segment) => {
    const p0 = mapPoint(segment.x0, segment.y0);
    const p1 = mapPoint(segment.x1, segment.y1);
    return { x0: p0[0], y0: p0[1], x1: p1[0], y1: p1[1] };
  });
}

function layoutElement(
  element: CadLinetypeComplexElement,
  styles: Record<string, CadTextStyle>,
  glyphHeight: number,
): { segments: TextGlyphSegment[]; reason?: string } {
  const flags = element.elementTypeFlag;
  const isText = (flags & 2) !== 0;
  const isShape = (flags & 4) !== 0;
  if ((flags & ~7) !== 0 || isText === isShape) return { segments: [], reason: "unsupported element flags" };

  const style = resolveStyle(element.styleObjectId, styles);
  if (!style) return { segments: [], reason: "STYLE handle is unresolved" };

  if (isShape) {
    if (!style.isShapeFile || !Number.isInteger(element.shapeNumber) || element.shapeNumber! < 0) {
      return { segments: [], reason: "shape requires a shape STYLE and a valid shape number" };
    }
    const resolved = FontLayoutEngine.resolveFontStyle({ fontFileName: style.fontFileName, styleName: style.id });
    if (resolved.fontType !== "shx" || resolved.status !== "exact" || !resolved.shxFont) {
      return { segments: [], reason: `shape font unavailable: ${style.fontFileName}` };
    }
    const shape = resolved.shxFont.getLayoutCharShape(element.shapeNumber!, glyphHeight);
    if (!shape?.polylines?.length) return { segments: [], reason: `SHX shape ${element.shapeNumber} is missing or empty` };
    const segments: TextGlyphSegment[] = [];
    for (const polyline of shape.polylines) {
      for (let index = 0; index < polyline.length - 1; index++) {
        const p0 = polyline[index]!;
        const p1 = polyline[index + 1]!;
        segments.push({ x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, layer: "0", order: BigInt(0), isContour: false });
      }
    }
    return segments.length ? { segments } : { segments: [], reason: `SHX shape ${element.shapeNumber} has no strokes` };
  }

  if (typeof element.text !== "string" || !element.text.length) return { segments: [], reason: "embedded text is empty" };
  const text: CadTextEntity = {
    type: "TEXT", handle: "", layer: "0", order: BigInt(0), text: element.text,
    insertionPoint: [0, 0], height: glyphHeight,
    rotationRad: 0, widthFactor: style.widthFactor || 1,
    obliqueRad: (style.obliqueAngleDeg * Math.PI) / 180,
    styleName: style.id,
  };
  const result = FontLayoutEngine.layoutTextDetailed(text, { textStyles: styles });
  if (result.resolvedFont.status !== "exact" || result.resolvedFont.fontType === "missing") {
    return { segments: [], reason: `text font is not exact: ${result.resolvedFont.requestedFont}` };
  }
  if (!result.segments.length) return { segments: [], reason: "embedded text produced no glyph strokes" };
  return { segments: result.segments };
}

/**
 * Render complex SHAPE/TEXT elements for a straight source path. Placement is
 * measured from the source start, preserving the same phase contract as curved paths.
 */
export function layoutComplexLinetypeLine(
  start: CadPoint2D,
  end: CadPoint2D,
  linetype: CadLinetype | undefined,
  effectiveScale: number,
  styles: Record<string, CadTextStyle>,
): ComplexLinetypeGlyphResult {
  const segment = linePathSegment(start, end);
  return layoutComplexLinetypePaths(segment ? [{ segments: [segment] }] : [], linetype, effectiveScale, styles);
}

export function layoutComplexLinetypeEntity(
  entity: CadEntity,
  linetype: CadLinetype | undefined,
  effectiveScale: number,
  styles: Record<string, CadTextStyle>,
  maxCurveErrorWorld = 0.25,
  maxCurveSegments = 65_536,
): ComplexLinetypeGlyphResult {
  const elements = activeComplexElements(linetype);
  if (!elements.length) return { segments: [], unsupportedElements: [] };
  if (!["LINE", "ARC", "CIRCLE", "ELLIPSE", "LWPOLYLINE", "SPLINE"].includes(entity.type)) {
    return { segments: [], unsupportedElements: [] };
  }
  const paths = buildComplexLinetypePaths(entity, maxCurveErrorWorld, maxCurveSegments);
  if (!paths.length) {
    return {
      segments: [],
      unsupportedElements: elements.map(({ patternIndex }) => ({
        patternIndex, reason: "source curve could not be evaluated",
      })),
    };
  }
  return layoutComplexLinetypePaths(paths, linetype, effectiveScale, styles);
}

export function layoutComplexLinetypePaths(
  paths: ComplexLinetypePath[],
  linetype: CadLinetype | undefined,
  effectiveScale: number,
  styles: Record<string, CadTextStyle>,
): ComplexLinetypeGlyphResult {
  const elements = activeComplexElements(linetype);
  if (!elements?.length) return { segments: [], unsupportedElements: [] };
  const unsupportedElements: ComplexLinetypeGlyphResult["unsupportedElements"] = [];
  const segments: ComplexLinetypeGlyphSegment[] = [];
  let instanceCount = 0;
  for (const path of paths) {
    const validSegments = path.segments.filter((segment) => Number.isFinite(segment.length) && segment.length > 1e-9);
    const length = validSegments.reduce((sum, segment) => sum + segment.length, 0);
    if (!validSegments.length || length <= 1e-9) continue;
    const cumulativeEnds: number[] = [];
    let cumulativeLength = 0;
    for (const segment of validSegments) {
      cumulativeLength += segment.length;
      cumulativeEnds.push(cumulativeLength);
    }
    const sample = (distance: number): { point: CadPoint2D; tangentAngle: number } => {
      const clampedDistance = Math.max(0, Math.min(length, distance));
      let low = 0;
      let high = cumulativeEnds.length - 1;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (clampedDistance < cumulativeEnds[middle]! - 1e-9) high = middle;
        else low = middle + 1;
      }
      const index = low;
      const segment = validSegments[index]!;
      const startDistance = index === 0 ? 0 : cumulativeEnds[index - 1]!;
      const localDistance = Math.max(0, Math.min(segment.length, clampedDistance - startDistance));
      return {
        point: segment.pointAtDistance(localDistance),
        tangentAngle: segment.tangentAngleAtDistance(localDistance),
      };
    };
    const pattern = linetype?.pattern || [];
    const scale = Number.isFinite(effectiveScale) && effectiveScale > 0 ? effectiveScale : 1;
    const cycleLength = pattern.reduce((sum, value) => sum + Math.abs(value * scale), 0);
    if (cycleLength <= 1e-9) {
      for (const element of elements) unsupportedElements.push({ patternIndex: element.patternIndex, reason: "empty linetype period" });
      continue;
    }

    for (const element of elements) {
      if (!Number.isInteger(element.patternIndex) || element.patternIndex < 0 || element.patternIndex >= pattern.length) {
        unsupportedElements.push({ patternIndex: element.patternIndex, reason: "pattern index is outside the LTYPE pattern" });
        continue;
      }
      let localOffset = 0;
      for (let index = 0; index < element.patternIndex; index++) localOffset += Math.abs(pattern[index]! * scale);
      const elementScale = Number.isFinite(element.scale) && element.scale! > 0 ? element.scale! : 1;
      const glyphHeight = elementScale * scale * (resolveStyle(element.styleObjectId, styles)?.height || 1);
      const glyph = layoutElement(element, styles, glyphHeight);
      if (glyph.reason) {
        unsupportedElements.push({ patternIndex: element.patternIndex, reason: glyph.reason });
        continue;
      }

      for (let distance = localOffset;
        path.closed ? distance < length - 1e-9 : distance <= length + 1e-9;
        distance += cycleLength) {
        if (++instanceCount > MAX_COMPLEX_GLYPH_INSTANCES) {
          unsupportedElements.push({ patternIndex: element.patternIndex, reason: `instance limit ${MAX_COMPLEX_GLYPH_INSTANCES} exceeded` });
          break;
        }
        const { point, tangentAngle } = sample(distance);
        const tangentX = Math.cos(tangentAngle);
        const tangentY = Math.sin(tangentAngle);
        const offsetX = (Number.isFinite(element.offsetX) ? element.offsetX! : 0) * scale;
        const offsetY = (Number.isFinite(element.offsetY) ? element.offsetY! : 0) * scale;
        const origin: CadPoint2D = [
          point[0] + tangentX * offsetX - tangentY * offsetY,
          point[1] + tangentY * offsetX + tangentX * offsetY,
        ];
        const absoluteRotation = (element.elementTypeFlag & 1) !== 0;
        const angle = (absoluteRotation ? 0 : tangentAngle) + (Number.isFinite(element.rotation) ? element.rotation! : 0);
        segments.push(...mapPlacedSegments(glyph.segments, origin, angle));
      }
    }
  }

  return { segments, unsupportedElements };
}
