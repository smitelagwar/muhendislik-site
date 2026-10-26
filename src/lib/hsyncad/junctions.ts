import earcut from "earcut";
import { elementFootprint, elementVerticalRange, polygonArea } from "./geometry";
import { validateModel, type CadModel, type Point, type SolidElement } from "./model";

/** Metres. Geometry within this tolerance is considered coincident. */
export const JUNCTION_EPSILON = 1e-8;
const AREA_EPSILON = JUNCTION_EPSILON * JUNCTION_EPSILON;
const PRIORITY = { column: 0, wall: 1, beam: 2, slab: 3 };
export type SolidPart = {
  elementId: string;
  type: SolidElement["type"];
  /** Counter-clockwise convex polygon; extrusion has no internal holes. */
  footprint: Point[];
  bottom: number;
  top: number;
  volume: number;
};
export type JunctionElementQuantity = { grossVolume: number; netVolume: number | null };
export type JunctionResult = {
  status: "resolved" | "failed";
  parts: SolidPart[];
  grossVolume: number;
  netVolume: number | null;
  overlapVolume: number | null;
  byElement: Record<string, JunctionElementQuantity>;
  warnings: string[];
  error?: string;
  epsilon: number;
};
export type JunctionOptions = { maxOperations?: number; maxParts?: number };
type Bounds = { minX: number; maxX: number; minY: number; maxY: number };
type Convex = { points: Point[]; bounds: Bounds };
type Prepared = { element: SolidElement; bottom: number; top: number; polygons: Convex[] };

class WorkBudget {
  operations = 0;
  constructor(readonly maximum: number) {}
  add(amount = 1) {
    this.operations += amount;
    if (this.operations > this.maximum) throw new Error("Birleşim hesabı işlem sınırını aştı. Eleman veya döşeme köşe sayısını azaltın; net metraj ve 3B katılar üretilmedi.");
  }
}
const signedDistance = (p: Point, a: Point, b: Point) => ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) / Math.hypot(b.x - a.x, b.y - a.y);
const near = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) <= JUNCTION_EPSILON;
function signedArea(points: Point[]): number {
  const origin = points[0];
  if (!origin) return 0;
  return points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + (p.x - origin.x) * (q.y - origin.y) - (q.x - origin.x) * (p.y - origin.y);
  }, 0) / 2;
}
function cleanPolygon(points: Point[]): Point[] {
  const clean: Point[] = [];
  for (const p of points) if (!clean.length || !near(clean[clean.length - 1], p)) clean.push(p);
  if (clean.length > 1 && near(clean[0], clean[clean.length - 1])) clean.pop();
  if (clean.length < 3 || polygonArea(clean) <= AREA_EPSILON) return [];
  return signedArea(clean) < 0 ? clean.reverse() : clean;
}
function bounds(points: Point[]): Bounds {
  return { minX: Math.min(...points.map(p => p.x)), maxX: Math.max(...points.map(p => p.x)), minY: Math.min(...points.map(p => p.y)), maxY: Math.max(...points.map(p => p.y)) };
}
function boxesOverlap(a: Bounds, b: Bounds) {
  return a.minX < b.maxX - JUNCTION_EPSILON && a.maxX > b.minX + JUNCTION_EPSILON && a.minY < b.maxY - JUNCTION_EPSILON && a.maxY > b.minY + JUNCTION_EPSILON;
}
function polygonKey(points: Point[]): string {
  let first = 0;
  for (let i = 1; i < points.length; i++) if (points[i].x < points[first].x || (points[i].x === points[first].x && points[i].y < points[first].y)) first = i;
  return JSON.stringify([...points.slice(first), ...points.slice(0, first)]);
}
function isConvex(points: Point[]) {
  return points.every((p, i) => signedDistance(points[(i + 2) % points.length], p, points[(i + 1) % points.length]) >= -JUNCTION_EPSILON);
}
function preparePolygons(points: Point[]): Convex[] {
  const polygon = cleanPolygon(points.map(p => ({ ...p })));
  if (polygon.length < 3) throw new Error("Eleman kesiti birleşim toleransının altında veya geçersiz. 3B katılar ve net metraj üretilmedi.");
  if (isConvex(polygon)) return [{ points: polygon, bounds: bounds(polygon) }];
  const indices = earcut(polygon.flatMap(p => [p.x, p.y]), undefined, 2);
  const triangles: Convex[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = cleanPolygon([polygon[indices[i]], polygon[indices[i + 1]], polygon[indices[i + 2]]]);
    if (triangle.length === 3) triangles.push({ points: triangle, bounds: bounds(triangle) });
  }
  const area = polygonArea(polygon), triangulatedArea = triangles.reduce((sum, t) => sum + polygonArea(t.points), 0);
  if (!triangles.length || Math.abs(area - triangulatedArea) > Math.max(1e-10, area * 1e-10)) throw new Error("Döşeme üçgenlemesi alanı koruyamadı. Geometriyi kontrol edin; net metraj ve 3B katılar üretilmedi.");
  return triangles;
}

function clipHalfPlane(polygon: Point[], a: Point, b: Point, inside: boolean, budget?: WorkBudget): Point[] {
  if (!polygon.length) return [];
  budget?.add(polygon.length);
  const output: Point[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i], q = polygon[(i + 1) % polygon.length];
    const rawP = signedDistance(p, a, b), rawQ = signedDistance(q, a, b);
    const dp = Math.abs(rawP) <= JUNCTION_EPSILON ? 0 : rawP, dq = Math.abs(rawQ) <= JUNCTION_EPSILON ? 0 : rawQ;
    const pIn = inside ? dp >= 0 : dp <= 0, qIn = inside ? dq >= 0 : dq <= 0;
    if (pIn) output.push(p);
    if (pIn !== qIn) {
      const t = dp / (dp - dq);
      output.push({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
    }
  }
  return cleanPolygon(output);
}

/** Convex CCW clipping, also exposed for independent geometry verification. */
export function intersectConvexPolygons(subject: Point[], clip: Point[]): Point[] {
  let result = cleanPolygon(subject.map(p => ({ ...p })));
  const boundary = cleanPolygon(clip.map(p => ({ ...p })));
  for (let i = 0; result.length && i < boundary.length; i++) result = clipHalfPlane(result, boundary[i], boundary[(i + 1) % boundary.length], true);
  return boundary.length ? result : [];
}

function subtractConvex(subject: Convex, blocker: Convex, budget: WorkBudget): Convex[] {
  budget.add();
  if (!boxesOverlap(subject.bounds, blocker.bounds)) return [subject];
  // Partition subject by blocker half-planes. The outside pieces have disjoint interiors.
  let remainder = subject.points;
  const outside: Convex[] = [];
  for (let i = 0; remainder.length && i < blocker.points.length; i++) {
    const a = blocker.points[i], b = blocker.points[(i + 1) % blocker.points.length];
    const piece = clipHalfPlane(remainder, a, b, false, budget);
    if (piece.length) outside.push({ points: piece, bounds: bounds(piece) });
    remainder = clipHalfPlane(remainder, a, b, true, budget);
  }
  // If only touching, preserve the original polygon instead of introducing display seams.
  return !remainder.length ? [subject] : outside;
}

/**
 * Resolve the complete model before any visibility filtering. Every positive-volume cell
 * belongs to exactly one source element: column > wall > beam > slab, then binary ID order.
 * Slicing follows every actual z bound; convex polygon differences handle arbitrary plan angles.
 * Failure publishes no partial mesh or purported net quantity.
 */
export function resolveJunctions(input: CadModel, options: JunctionOptions = {}): JunctionResult {
  let grossVolume = 0;
  const byElement: Record<string, JunctionElementQuantity> = Object.create(null) as Record<string, JunctionElementQuantity>;
  const budget = new WorkBudget(options.maxOperations ?? 1_000_000);
  const maxParts = options.maxParts ?? 20_000;
  try {
    if (!Number.isFinite(budget.maximum) || budget.maximum < 1 || !Number.isFinite(maxParts) || maxParts < 1) throw new Error("Geçersiz birleşim işlem sınırı.");
    const model = validateModel(input);
    const floors = new Map(model.floors.map(f => [f.id, f]));
    const prepared: Prepared[] = model.elements.filter((element): element is SolidElement => element.type !== "axis").map(element => {
      const [bottom, top] = elementVerticalRange(element, floors.get(element.floorId)!);
      const footprint = elementFootprint(element);
      const volume = polygonArea(footprint) * (top - bottom);
      grossVolume += volume;
      byElement[element.id] = { grossVolume: volume, netVolume: 0 };
      return { element, bottom, top, polygons: preparePolygons(footprint) };
    }).sort((a, b) => PRIORITY[a.element.type] - PRIORITY[b.element.type] || (a.element.id < b.element.id ? -1 : a.element.id > b.element.id ? 1 : 0));
    const zs = [...new Set(prepared.flatMap(p => [p.bottom, p.top]))].sort((a, b) => a - b);
    const parts: SolidPart[] = [];
    const lastPartForFootprint = new Map<string, SolidPart>();
    for (let z = 0; z + 1 < zs.length; z++) {
      budget.add(prepared.length);
      const bottom = zs[z], top = zs[z + 1], middle = (bottom + top) / 2;
      const active = prepared.filter(p => p.bottom < middle && p.top > middle);
      const blockers: Convex[] = [];
      for (const current of active) {
        let remaining = current.polygons;
        for (const blocker of blockers) {
          const next: Convex[] = [];
          for (const subject of remaining) {
            next.push(...subtractConvex(subject, blocker, budget));
            if (next.length + parts.length > maxParts) throw new Error("Birleşim hesabı katı parça sınırını aştı. Net metraj ve 3B katılar üretilmedi.");
          }
          remaining = next;
          if (!remaining.length) break;
        }
        for (const polygon of remaining) {
          const volume = polygonArea(polygon.points) * (top - bottom);
          if (volume <= 0 || !Number.isFinite(volume)) throw new Error("Birleşim hesabında geçersiz hacim bulundu. Net metraj ve 3B katılar üretilmedi.");
          const key = `${JSON.stringify(current.element.id)}:${polygonKey(polygon.points)}`;
          const previous = lastPartForFootprint.get(key);
          if (previous && previous.top === bottom) { previous.top = top; previous.volume += volume; }
          else {
            const part = { elementId: current.element.id, type: current.element.type, footprint: polygon.points, bottom, top, volume };
            parts.push(part);
            lastPartForFootprint.set(key, part);
          }
          byElement[current.element.id].netVolume! += volume;
          if (parts.length > maxParts) throw new Error("Birleşim hesabı katı parça sınırını aştı. Net metraj ve 3B katılar üretilmedi.");
        }
        blockers.push(...current.polygons);
      }
    }
    const netVolume = parts.reduce((sum, p) => sum + p.volume, 0);
    for (const [id, quantity] of Object.entries(byElement)) {
      if (quantity.netVolume! > quantity.grossVolume + Math.max(1e-8, quantity.grossVolume * 1e-8)) throw new Error(`${id}: birleşim hesabı hacim tutarlılığı sağlanamadı; net metraj ve 3B katılar üretilmedi.`);
    }
    return { status: "resolved", parts, grossVolume, netVolume, overlapVolume: Math.max(0, grossVolume - netVolume), byElement, warnings: [], epsilon: JUNCTION_EPSILON };
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "Birleşim hesabı tamamlanamadı.";
    for (const quantity of Object.values(byElement)) quantity.netVolume = null;
    return { status: "failed", parts: [], grossVolume, netVolume: null, overlapVolume: null, byElement, warnings: [error], error, epsilon: JUNCTION_EPSILON };
  }
}
