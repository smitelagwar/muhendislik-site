import type { CadSnapPoint } from "./snap-engine";

/** Straight, user-picked polygon. Bulges/arcs are not interpreted as curved area. */
export type PolygonProblem =
  | "too-few-points" | "too-many-points" | "invalid-point"
  | "duplicate-vertex" | "short-edge" | "self-intersection" | "degenerate";
export interface CadPolygonResult {
  valid: boolean;
  reason: PolygonProblem | null;
  signedArea: number | null;
  area: number | null;
  perimeter: number | null;
  centroid: CadSnapPoint | null;
}

export const CAD_POLYGON_ERRORS: Readonly<Record<PolygonProblem, string>> = {
  "too-few-points": "Alan için en az üç farklı nokta seçin.",
  "too-many-points": "Alan 5000 noktayı aşamaz.",
  "invalid-point": "Çizim koordinatı geçersiz.",
  "duplicate-vertex": "Tekrarlanan köşe algılandı; geri alıp düzeltin.",
  "short-edge": "Sıfır veya çok kısa kenar; noktayı değiştirin.",
  "self-intersection": "Poligon kendi kendini kesiyor; alan hesaplanamaz.",
  "degenerate": "Poligonun alanı sıfıra çok yakın.",
};

export function pointDistance(a: CadSnapPoint, b: CadSnapPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Origin-shifted fan triangulation preserves precision around UTM offsets. */
export function signedPolygonArea(points: readonly CadSnapPoint[]): number {
  if (points.length < 3) return 0;
  const o = points[0]!;
  let sum = 0;
  let error = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i]!, b = points[i + 1]!;
    const cross = (a.x - o.x) * (b.y - o.y) -
      (a.y - o.y) * (b.x - o.x);
    const adjusted = cross - error;
    const next = sum + adjusted;
    error = (next - sum) - adjusted;
    sum = next;
  }
  return sum / 2;
}
export function shoelaceArea(points: readonly CadSnapPoint[]): number {
  return Math.abs(signedPolygonArea(points));
}
export function polygonPerimeter(points: readonly CadSnapPoint[], closed = true): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) total += pointDistance(points[i - 1]!, points[i]!);
  if (closed && points.length >= 3) total += pointDistance(points[points.length - 1]!, points[0]!);
  return total;
}
export function polygonCentroid(points: readonly CadSnapPoint[]): CadSnapPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  const o = points[0]!;
  const mean = () => ({
    x: o.x + points.reduce((acc, p) => acc + p.x - o.x, 0) / points.length,
    y: o.y + points.reduce((acc, p) => acc + p.y - o.y, 0) / points.length,
  });
  if (points.length < 3) return mean();
  let crossTotal = 0, cx = 0, cy = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i]!, b = points[i + 1]!;
    const ax = a.x - o.x, ay = a.y - o.y, bx = b.x - o.x, by = b.y - o.y;
    const cross = ax * by - ay * bx;
    crossTotal += cross;
    cx += (ax + bx) * cross;
    cy += (ay + by) * cross;
  }
  if (Math.abs(crossTotal) < 1e-20) return mean();
  return { x: o.x + cx / (3 * crossTotal), y: o.y + cy / (3 * crossTotal) };
}

function segmentHits(a: CadSnapPoint, b: CadSnapPoint, c: CadSnapPoint, d: CadSnapPoint, eps: number): boolean {
  const cross = (p: CadSnapPoint, q: CadSnapPoint, r: CadSnapPoint) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const signed = (value: number, length: number) =>
    value > eps * length ? 1 : value < -eps * length ? -1 : 0;
  const v1 = cross(a, b, c), v2 = cross(a, b, d);
  const v3 = cross(c, d, a), v4 = cross(c, d, b);
  const lengthAB = pointDistance(a, b), lengthCD = pointDistance(c, d);
  const s1 = signed(v1, lengthAB), s2 = signed(v2, lengthAB);
  const s3 = signed(v3, lengthCD), s4 = signed(v4, lengthCD);
  const within = (p: CadSnapPoint, q: CadSnapPoint, r: CadSnapPoint) =>
    r.x >= Math.min(p.x, q.x) - eps && r.x <= Math.max(p.x, q.x) + eps &&
    r.y >= Math.min(p.y, q.y) - eps && r.y <= Math.max(p.y, q.y) + eps;
  return ((s1 !== s2 && s3 !== s4) ||
    (s1 === 0 && within(a, b, c)) ||
    (s2 === 0 && within(a, b, d)) ||
    (s3 === 0 && within(c, d, a)) ||
    (s4 === 0 && within(c, d, b)));
}

/** Reject crossing, duplicated, degenerate and non-finite polygons before showing measured area. */
export function validateCadPolygon(points: readonly CadSnapPoint[]): CadPolygonResult {
  const invalid = (reason: PolygonProblem): CadPolygonResult => ({
    valid: false, reason, signedArea: null, area: null, perimeter: null, centroid: null,
  });
  if (points.length < 3) return invalid("too-few-points");
  if (points.length > 5000) return invalid("too-many-points");
  if (points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y) ||
    Math.abs(p.x) > 1e9 || Math.abs(p.y) > 1e9)) return invalid("invalid-point");
  const origin = points[0]!;
  const local = points.map(p => ({ x: p.x - origin.x, y: p.y - origin.y }));
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let coordMax = 0;
  for (let i = 0; i < points.length; i++) {
    const p = local[i]!, world = points[i]!;
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    coordMax = Math.max(coordMax, Math.abs(world.x), Math.abs(world.y));
  }
  const span = Math.max(maxX - minX, maxY - minY);
  const eps = Math.max(1e-9, span * 1e-12, coordMax * Number.EPSILON * 16);
  for (let i = 0; i < points.length; i++) {
    const a = local[i]!, b = local[(i + 1) % points.length]!;
    if (pointDistance(a, b) <= eps) return invalid("short-edge");
  }
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (pointDistance(local[i]!, local[j]!) <= eps) return invalid("duplicate-vertex");
    }
  }
  for (let i = 0; i < points.length; i++) {
    const a = local[i]!, b = local[(i + 1) % points.length]!;
    for (let j = i + 1; j < points.length; j++) {
      if (j === i + 1 || (i === 0 && j === points.length - 1)) continue;
      const c = local[j]!, d = local[(j + 1) % points.length]!;
      if (Math.max(a.x, b.x) + eps < Math.min(c.x, d.x) ||
        Math.max(c.x, d.x) + eps < Math.min(a.x, b.x) ||
        Math.max(a.y, b.y) + eps < Math.min(c.y, d.y) ||
        Math.max(c.y, d.y) + eps < Math.min(a.y, b.y)) continue;
      if (segmentHits(a, b, c, d, eps)) return invalid("self-intersection");
    }
  }
  const signedArea = signedPolygonArea(points);
  const area = Math.abs(signedArea);
  const perimeter = polygonPerimeter(points);
  if (!Number.isFinite(area) || !Number.isFinite(perimeter) ||
    area <= Math.max(eps * eps, span * span * 1e-12)) return invalid("degenerate");
  const centroid = polygonCentroid(points);
  if (!Number.isFinite(centroid.x) || !Number.isFinite(centroid.y)) return invalid("degenerate");
  return { valid: true, reason: null, signedArea, area, perimeter, centroid };
}
