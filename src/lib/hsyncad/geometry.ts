import type { CadElement, Floor, Point } from "./model";

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
  if (element.type === "axis") return [element.start, element.end];
  if (element.type === "slab") return element.points;
  if (element.type === "column") {
    const { x, y } = element.position, w = element.width / 2, d = element.depth / 2;
    const radians = (element.rotation ?? 0) * Math.PI / 180, cos = Math.cos(radians), sin = Math.sin(radians);
    return [{ x: -w, y: -d }, { x: w, y: -d }, { x: w, y: d }, { x: -w, y: d }].map(p => ({ x: x + p.x * cos - p.y * sin, y: y + p.x * sin + p.y * cos }));
  }
  const length = distance(element.start, element.end);
  if (length <= EPSILON) return [];
  const half = (element.type === "beam" ? element.width : element.thickness) / 2;
  const nx = -(element.end.y - element.start.y) / length, ny = (element.end.x - element.start.x) / length;
  const shift = element.type === "beam" ? (element.offset ?? 0) + (element.alignment === "left" ? half : element.alignment === "right" ? -half : 0) : 0;
  return [
    { x: element.start.x + nx * (shift - half), y: element.start.y + ny * (shift - half) },
    { x: element.end.x + nx * (shift - half), y: element.end.y + ny * (shift - half) },
    { x: element.end.x + nx * (shift + half), y: element.end.y + ny * (shift + half) },
    { x: element.start.x + nx * (shift + half), y: element.start.y + ny * (shift + half) },
  ];
}

export function elementVerticalRange(element: CadElement, floor: Floor): [number, number] {
  if (element.type === "axis") return [floor.elevation, floor.elevation];
  if (element.type === "column" || element.type === "wall") {
    const bottom = floor.elevation + (element.baseOffset ?? 0);
    const top = (element.heightMode === "story" ? floor.elevation + floor.height : bottom + element.height) + (element.topOffset ?? 0);
    return [bottom, top];
  }
  const top = floor.elevation + floor.height + (element.topOffset ?? 0);
  return [top - (element.type === "slab" ? element.thickness : element.height), top];
}

export type SnapKind = "intersection" | "endpoint" | "midpoint" | "grid" | "none";
export type SnapResult = { point: Point; kind: SnapKind };
export function snapPoint(point: Point, elements: CadElement[], tolerance: number, gridStep?: number): SnapResult {
  const candidates: Record<"intersection" | "endpoint" | "midpoint", Point[]> = { intersection: [], endpoint: [], midpoint: [] };
  const axes = elements.filter(e => e.type === "axis");
  for (let i = 0; i < axes.length; i++) for (let j = i + 1; j < axes.length; j++) {
    const p = segmentIntersection(axes[i].start, axes[i].end, axes[j].start, axes[j].end);
    if (p) candidates.intersection.push(p);
  }
  for (const element of elements) {
    if (element.type === "column") {
      candidates.endpoint.push(element.position, ...elementFootprint(element));
    } else {
      const vertices = element.type === "slab" ? element.points : [element.start, element.end];
      candidates.endpoint.push(...vertices);
      const segmentCount = element.type === "slab" ? vertices.length : 1;
      for (let i = 0; i < segmentCount; i++) {
        const a = vertices[i], b = vertices[(i + 1) % vertices.length];
        candidates.midpoint.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      }
    }
  }
  for (const kind of ["intersection", "endpoint", "midpoint"] as const) {
    let nearest: Point | null = null, shortest = tolerance;
    for (const candidate of candidates[kind]) {
      const d = distance(candidate, point);
      if (d <= shortest) { nearest = candidate; shortest = d; }
    }
    if (nearest) return { point: { ...nearest }, kind };
  }
  if (gridStep && Number.isFinite(gridStep) && gridStep > 0) return { point: { x: Math.round(point.x / gridStep) * gridStep, y: Math.round(point.y / gridStep) * gridStep }, kind: "grid" };
  return { point: { ...point }, kind: "none" };
}
