import type { CadElement, Floor, Point } from "./model";
import { columnOffsets, effectiveThickness, wallPath, type SnapSettings } from "./definitions";

const EPSILON = 1e-9;
export function distance(a: Point, b: Point): number { return Math.hypot(a.x - b.x, a.y - b.y); }
const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

export function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  const origin = points[0];
  return Math.abs(points.reduce((area, p, i) => {
    const q = points[(i + 1) % points.length];
    return area + (p.x - origin.x) * (q.y - origin.y) - (q.x - origin.x) * (p.y - origin.y);
  }, 0)) / 2;
}

export function polygonPerimeter(points: Point[]): number {
  return points.reduce((sum, p, i) => sum + distance(p, points[(i + 1) % points.length]), 0);
}

function onSegment(a: Point, b: Point, p: Point): boolean {
  return Math.abs(cross(a, b, p)) < EPSILON && p.x >= Math.min(a.x, b.x) - EPSILON && p.x <= Math.max(a.x, b.x) + EPSILON && p.y >= Math.min(a.y, b.y) - EPSILON && p.y <= Math.max(a.y, b.y) + EPSILON;
}

export function segmentIntersection(a: Point, b: Point, c: Point, d: Point): Point | null {
  const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y;
  const denominator = rx * sy - ry * sx;
  if (Math.abs(denominator) < EPSILON) return null;
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / denominator;
  const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / denominator;
  return t >= -EPSILON && t <= 1 + EPSILON && u >= -EPSILON && u <= 1 + EPSILON ? { x: a.x + t * rx, y: a.y + t * ry } : null;
}

export function isSimplePolygon(points: Point[]): boolean {
  if (points.length < 3 || points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return false;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length], before = points[(i + points.length - 1) % points.length];
    if (distance(a, b) < EPSILON) return false;
    if (Math.abs(cross(before, a, b)) < EPSILON && (a.x - before.x) * (b.x - a.x) + (a.y - before.y) * (b.y - a.y) <= 0) return false;
    for (let j = i + 1; j < points.length; j++) {
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      const c = points[j], d = points[(j + 1) % points.length];
      if (segmentIntersection(a, b, c, d) || onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b)) return false;
    }
  }
  return polygonArea(points) > EPSILON;
}

export function elementFootprint(element: CadElement): Point[] {
  if (element.type === "axis" || element.type === "slabEdge") return [element.start, element.end];
  if (element.type === "slab") return element.points;
  if (element.type === "column") {
    const { x, y } = element.position, w = element.width / 2, d = element.depth / 2;
    const radians = (element.rotation ?? 0) * Math.PI / 180, cos = Math.cos(radians), sin = Math.sin(radians);
    const local = element.section === "polygon" ? element.sectionPoints ?? [] : element.section === "circle" ? Array.from({ length: element.circleSegments ?? 32 }, (_, i) => ({ x: w * Math.cos(i * 2 * Math.PI / (element.circleSegments ?? 32)), y: w * Math.sin(i * 2 * Math.PI / (element.circleSegments ?? 32)) })) : [{ x: -w, y: -d }, { x: w, y: -d }, { x: w, y: d }, { x: -w, y: d }];
    const offset = columnOffsets(element), mirror = element.mirrorX ? -1 : 1;
    return local.map(p => ({ x: x + (p.x + offset.x) * cos - (p.y + offset.y) * mirror * sin, y: y + (p.x + offset.x) * sin + (p.y + offset.y) * mirror * cos }));
  }
  const length = distance(element.start, element.end);
  if (length <= EPSILON) return [];
  const half = (element.type === "beam" ? element.width : element.thickness) / 2;
  const nx = -(element.end.y - element.start.y) / length, ny = (element.end.x - element.start.x) / length;
  const shift = (element.offset ?? 0) + (element.alignment === "left" ? half : element.alignment === "right" ? -half : 0);
  if (Math.abs(element.curveSagitta ?? 0) > EPSILON) {
    const path = wallPath(element);
    const edge = (offset: number) => path.map((p, i) => {
      const before = path[Math.max(0, i - 1)], after = path[Math.min(path.length - 1, i + 1)];
      const a = i === 0 ? { x: -(after.y - p.y), y: after.x - p.x } : { x: -(p.y - before.y), y: p.x - before.x };
      const b = i === path.length - 1 ? a : { x: -(after.y - p.y), y: after.x - p.x };
      const al = Math.hypot(a.x, a.y), bl = Math.hypot(b.x, b.y);
      const sum = { x: a.x / al + b.x / bl, y: a.y / al + b.y / bl }, sl = Math.hypot(sum.x, sum.y);
      const unit = { x: sum.x / sl, y: sum.y / sl }, scale = offset / (unit.x * a.x / al + unit.y * a.y / al);
      return { x: p.x + unit.x * scale, y: p.y + unit.y * scale };
    });
    return [...edge(shift - half), ...edge(shift + half).reverse()];
  }
  return [
    { x: element.start.x + nx * (shift - half), y: element.start.y + ny * (shift - half) },
    { x: element.end.x + nx * (shift - half), y: element.end.y + ny * (shift - half) },
    { x: element.end.x + nx * (shift + half), y: element.end.y + ny * (shift + half) },
    { x: element.start.x + nx * (shift + half), y: element.start.y + ny * (shift + half) },
  ];
}

export function elementVerticalRange(element: CadElement, floor: Floor): [number, number] {
  if (element.type === "axis") return [floor.elevation, floor.elevation];
  if (element.type === "slabEdge") { const a = floor.elevation + floor.height + (element.topOffset ?? 0), b = floor.elevation + floor.height + (element.endTopOffset ?? element.topOffset ?? 0); return [Math.min(a, b), Math.max(a, b)]; }
  if (element.type === "column" || element.type === "wall") {
    const bottom = floor.elevation + (element.baseOffset ?? 0);
    const top = (element.heightMode === "story" ? floor.elevation + floor.height : bottom + element.height) + (element.topOffset ?? 0);
    return [bottom, top];
  }
  if (element.type === "slab") {
    const zs = element.points.map(p => slabTopAt(element, floor, p));
    return [Math.min(...zs) - effectiveThickness(element), Math.max(...zs)];
  }
  const zs = elementFootprint(element).map(p => beamTopAt(element, floor, p));
  return [Math.min(...zs) - element.height, Math.max(...zs)];
}

export function beamTopAt(element: Extract<CadElement, { type: "beam" }>, floor: Floor, p: Point): number {
  const dx = element.end.x - element.start.x, dy = element.end.y - element.start.y;
  const t = ((p.x - element.start.x) * dx + (p.y - element.start.y) * dy) / (dx * dx + dy * dy);
  return floor.elevation + floor.height + (element.topOffset ?? 0) + t * ((element.endTopOffset ?? element.topOffset ?? 0) - (element.topOffset ?? 0));
}

export function slabTopAt(element: Extract<CadElement, { type: "slab" }>, floor: Floor, point: Point): number {
  const origin = element.points[0];
  return floor.elevation + floor.height + (element.topOffset ?? 0) + (point.x - origin.x) * (element.slopeX ?? 0) / 100 + (point.y - origin.y) * (element.slopeY ?? 0) / 100;
}
export function lineIntersection(a: Point, b: Point, c: Point, d: Point): Point | null {
  const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y, den = rx * sy - ry * sx;
  if (Math.abs(den) < EPSILON) return null;
  const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / den;
  return { x: a.x + t * rx, y: a.y + t * ry };
}

export type SnapKind = "intersection" | "endpoint" | "midpoint" | "grid" | "none";
export type SnapResult = { point: Point; kind: SnapKind };
export type SnapCandidates = Record<"intersection" | "endpoint" | "midpoint", Point[]>;
export function collectSnapCandidates(elements: CadElement[]): SnapCandidates {
  const candidates: SnapCandidates = { intersection: [], endpoint: [], midpoint: [] };
  const axes = elements.filter(e => e.type === "axis");
  for (let i = 0; i < axes.length; i++) for (let j = i + 1; j < axes.length; j++) {
    const p = lineIntersection(axes[i].start, axes[i].end, axes[j].start, axes[j].end);
    if (p) candidates.intersection.push(p);
  }
  for (const element of elements) {
    if (element.type === "column") {
      candidates.endpoint.push(element.position, ...elementFootprint(element));
    } else {
      const vertices = element.type === "slab" ? element.points : element.type === "wall" || element.type === "beam" ? wallPath(element) : [element.start, element.end];
      candidates.endpoint.push(...vertices);
      const segmentCount = element.type === "slab" ? vertices.length : vertices.length - 1;
      for (let i = 0; i < segmentCount; i++) {
        const a = vertices[i], b = vertices[(i + 1) % vertices.length];
        candidates.midpoint.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      }
    }
  }
  return candidates;
}
export function snapPoint(point: Point, elements: CadElement[], tolerance: number, gridStep?: number, settings?: Partial<SnapSettings>, cached?: SnapCandidates): SnapResult {
  const candidates = cached ?? collectSnapCandidates(elements);
  for (const kind of ["intersection", "endpoint", "midpoint"] as const) {
    if (settings?.[kind] === false) continue;
    let nearest: Point | null = null, shortest = tolerance;
    for (const candidate of candidates[kind]) {
      const d = distance(candidate, point);
      if (d <= shortest) { nearest = candidate; shortest = d; }
    }
    if (nearest) return { point: { ...nearest }, kind };
  }
  if (settings?.grid !== false && gridStep && Number.isFinite(gridStep) && gridStep > 0) return { point: { x: Math.round(point.x / gridStep) * gridStep, y: Math.round(point.y / gridStep) * gridStep }, kind: "grid" };
  return { point: { ...point }, kind: "none" };
}
