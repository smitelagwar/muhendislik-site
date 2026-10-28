import earcut from "earcut";
import type { CadElement, CadModel, Point, SlabElement } from "./model";
import { distance, elementFootprint, isSimplePolygon, polygonArea, segmentIntersection } from "./geometry";
import { effectiveThickness } from "./definitions";
import { memberFootprintsInBand } from "./polyhedra";

export type SlabRegion = { points: Point[]; elementIds: string[]; key: string };
type Segment = { a: Point; b: Point; owner: string; cuts: number[] };
const TOL = 1e-6;
const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
export function pointInRegion(p: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
export function regionCenter(points: Point[]): Point {
  return { x: points.reduce((s, p) => s + p.x, 0) / points.length, y: points.reduce((s, p) => s + p.y, 0) / points.length };
}
/** Concave regions may have their average outside; place the default label in a real interior triangle. */
export function regionLabelPoint(points: Point[]): Point {
  const average = regionCenter(points);
  if (pointInRegion(average, points)) return average;
  const indices = earcut(points.flatMap(p => [p.x, p.y]), undefined, 2);
  let largest = -1, result = average;
  for (let i = 0; i < indices.length; i += 3) {
    const triangle = indices.slice(i, i + 3).map(index => points[index]), area = polygonArea(triangle);
    if (area > largest) { largest = area; result = regionCenter(triangle); }
  }
  return result;
}
function parameter(s: Segment, p: Point) {
  const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
  return ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / (dx * dx + dy * dy);
}
function addCut(s: Segment, p: Point) {
  const t = parameter(s, p), length = distance(s.a, s.b);
  if (t >= -TOL / length && t <= 1 + TOL / length && Math.abs(cross(s.a, s.b, p)) / length <= TOL) s.cuts.push(Math.max(0, Math.min(1, t)));
}

/** Faces of a split planar graph. Real member outlines form slab boundaries. */
export function slabRegions(elements: CadElement[], floorId: string, sections?: Map<string, Point[][]>): SlabRegion[] {
  const members = elements.filter(e => e.floorId === floorId && e.type !== "axis" && e.type !== "slab");
  const polygons = members.flatMap(e => (sections ? sections.get(e.id) ?? [] : [elementFootprint(e)]).map(points => ({ element: e, points })));
  const obstacles = polygons.filter(p => p.element.type !== "slabEdge").map(p => p.points);
  const segments: Segment[] = polygons.flatMap(({ element: e, points: p }) => {
    const count = e.type === "slabEdge" ? 1 : p.length;
    return Array.from({ length: count }, (_, i) => ({ a: p[i], b: p[(i + 1) % p.length], owner: e.id, cuts: [0, 1] })).filter(s => distance(s.a, s.b) > TOL);
  });
  if (segments.length > 2000) throw new Error("Otomatik döşeme için sınır sayısı fazla; aktif katı sadeleştirin veya Köşelerle çiz yöntemini kullanın.");
  for (let i = 0; i < segments.length; i++) for (let j = i + 1; j < segments.length; j++) {
    const a = segments[i], b = segments[j];
    if (Math.max(a.a.x, a.b.x) + TOL < Math.min(b.a.x, b.b.x) || Math.max(b.a.x, b.b.x) + TOL < Math.min(a.a.x, a.b.x) || Math.max(a.a.y, a.b.y) + TOL < Math.min(b.a.y, b.b.y) || Math.max(b.a.y, b.b.y) + TOL < Math.min(a.a.y, a.b.y)) continue;
    const p = segmentIntersection(a.a, a.b, b.a, b.b);
    if (p) { addCut(a, p); addCut(b, p); }
    else { addCut(a, b.a); addCut(a, b.b); addCut(b, a.a); addCut(b, a.b); }
  }
  const nodes = new Map<string, Point>(), neighbors = new Map<string, Set<string>>(), owners = new Map<string, Set<string>>();
  const node = (p: Point) => { const key = `${Math.round(p.x / TOL)},${Math.round(p.y / TOL)}`; if (!nodes.has(key)) nodes.set(key, { x: Math.round(p.x / TOL) * TOL, y: Math.round(p.y / TOL) * TOL }); return key; };
  const edgeKey = (a: string, b: string) => a < b ? `${a}|${b}` : `${b}|${a}`;
  for (const s of segments) {
    const cuts = [...new Set(s.cuts.map(t => Math.round(t * 1e10) / 1e10))].sort((a, b) => a - b);
    for (let i = 0; i + 1 < cuts.length; i++) {
      const point = (t: number) => ({ x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t });
      const a = node(point(cuts[i])), b = node(point(cuts[i + 1])); if (a === b) continue;
      if (!neighbors.has(a)) neighbors.set(a, new Set()); if (!neighbors.has(b)) neighbors.set(b, new Set());
      neighbors.get(a)!.add(b); neighbors.get(b)!.add(a);
      const key = edgeKey(a, b); if (!owners.has(key)) owners.set(key, new Set()); owners.get(key)!.add(s.owner);
    }
  }
  // Open tails cannot bound a face; remove them before following half-edges.
  const queue = [...neighbors.keys()].filter(k => neighbors.get(k)!.size < 2);
  for (let i = 0; i < queue.length; i++) {
    const key = queue[i], adjacent = neighbors.get(key)!;
    for (const other of adjacent) { neighbors.get(other)!.delete(key); if (neighbors.get(other)!.size === 1) queue.push(other); }
    adjacent.clear();
  }
  const ordered = new Map([...neighbors].map(([key, adjacent]) => { const p = nodes.get(key)!; return [key, [...adjacent].sort((a, b) => { const pa = nodes.get(a)!, pb = nodes.get(b)!; return Math.atan2(pa.y - p.y, pa.x - p.x) - Math.atan2(pb.y - p.y, pb.x - p.x); })]; }));
  const visited = new Set<string>(), regions: SlabRegion[] = [];
  for (const [start, adjacent] of ordered) for (const first of adjacent) {
    if (visited.has(`${start}>${first}`)) continue;
    let a = start, b = first; const ring: string[] = [], memberIds = new Set<string>();
    for (let step = 0; step <= owners.size * 2; step++) {
      const key = `${a}>${b}`; if (visited.has(key)) break;
      visited.add(key); ring.push(a); for (const id of owners.get(edgeKey(a, b)) ?? []) memberIds.add(id);
      const around = ordered.get(b)!; if (!around.length) break;
      const next = around[(around.indexOf(a) + around.length - 1) % around.length]; a = b; b = next;
      if (a === start && b === first) break;
    }
    const points = ring.map(k => nodes.get(k)!);
    if (points.length < 3 || a !== start || b !== first) continue;
    const signedArea = points.reduce((s, p, i) => { const q = points[(i + 1) % points.length]; return s + p.x * q.y - q.x * p.y; }, 0) / 2;
    if (signedArea <= 1e-6 || !isSimplePolygon(points)) continue;
    const p = points[0], q = points[1], length = distance(p, q), inset = Math.min(1e-5, length / 100);
    const sample = { x: (p.x + q.x) / 2 - (q.y - p.y) / length * inset, y: (p.y + q.y) / 2 + (q.x - p.x) / length * inset };
    if (obstacles.some(poly => pointInRegion(sample, poly))) continue;
    const elementIds = [...memberIds].sort();
    regions.push({ points, elementIds, key: JSON.stringify([elementIds, regionCenter(points)]) });
  }
  return regions.sort((a, b) => polygonArea(a.points) - polygonArea(b.points));
}
export function regionAt(point: Point, regions: SlabRegion[]): SlabRegion | undefined { return regions.find(region => pointInRegion(point, region.points)); }

export type SlabLevel = Pick<SlabElement, "floorId" | "topOffset" | "thickness" | "buildUp" | "slopeX" | "slopeY">;
export function slabRegionsAtLevel(model: CadModel, slab: SlabLevel): SlabRegion[] {
  if (!Number.isFinite(slab.topOffset ?? 0) || !Number.isFinite(effectiveThickness(slab)) || effectiveThickness(slab) <= 0) throw new Error("Geçerli döşeme kotu ve pozitif kalınlık girin.");
  if (Math.abs(slab.slopeX ?? 0) > 1e-9 || Math.abs(slab.slopeY ?? 0) > 1e-9) throw new Error("Eğimli döşemeyi Köşelerle çiz yöntemiyle tanımlayın; otomatik kapalı alan yatay kot kesitinde çalışır.");
  const floor = model.floors.find(f => f.id === slab.floorId);
  if (!floor) throw new Error("Döşeme katı bulunamadı.");
  const top = floor.elevation + floor.height + (slab.topOffset ?? 0), bottom = top - effectiveThickness(slab);
  const sections = new Map<string, Point[][]>();
  for (const e of model.elements.filter(e => e.floorId === floor.id)) {
    if (e.type === "axis" || e.type === "slab") continue;
    if (e.type === "slabEdge") {
      if (Math.abs((e.topOffset ?? 0) - (slab.topOffset ?? 0)) < TOL && Math.abs((e.endTopOffset ?? e.topOffset ?? 0) - (slab.topOffset ?? 0)) < TOL) sections.set(e.id, [[e.start, e.end]]);
    } else sections.set(e.id, memberFootprintsInBand(e, floor, bottom, top));
  }
  return slabRegions(model.elements, floor.id, sections);
}

/** A serialized relationship is valid only if its saved polygon still is the declared face. */
export function validateLinkedSlabRegions(model: CadModel): void {
  const cache = new Map<string, SlabRegion[]>();
  const simplify = (points: Point[]) => points.filter((p, i) => {
    const before = points[(i + points.length - 1) % points.length], after = points[(i + 1) % points.length];
    return Math.abs(cross(before, after, p)) / distance(before, after) > 2 * TOL;
  });
  const samePolygon = (left: Point[], right: Point[]) => {
    const a = simplify(left), b = simplify(right);
    if (a.length !== b.length) return false;
    return b.some((p, start) => distance(a[0], p) <= 2 * TOL && [1, -1].some(direction => a.every((q, i) => distance(q, b[(start + direction * i + b.length) % b.length]) <= 2 * TOL)));
  };
  for (const slab of model.elements) {
    if (slab.type !== "slab" || !slab.boundary) continue;
    const key = JSON.stringify([slab.floorId, slab.topOffset ?? 0, effectiveThickness(slab), slab.slopeX ?? 0, slab.slopeY ?? 0]);
    if (!cache.has(key)) cache.set(key, slabRegionsAtLevel(model, slab));
    if (!cache.get(key)!.some(region => slab.boundary!.elementIds.every(id => region.elementIds.includes(id)) && samePolygon(slab.points, region.points))) {
      throw new Error(`${slab.name}: kayıtlı döşeme çevresi, bağlı elemanların güncel kapalı alanı veya kotuyla uyuşmuyor. Sınırları düzeltin ya da çevre bağını açıkça ayırın.`);
    }
  }
}
