import earcut from "earcut";
import { isSolidElement, type CadModel, type Point, type SolidElement } from "./model";
import { effectiveThickness } from "./definitions";
import { beamTopAt, elementFootprint, elementVerticalRange, slabTopAt } from "./geometry";
import type { JunctionResult, JunctionOptions, SolidPart } from "./junctions";

export type Point3 = { x: number; y: number; z: number };
type Face = Point3[];
type Plane = { n: Point3; d: number };
const EPS = 1e-8;
const sub = (a: Point3, b: Point3): Point3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: Point3, b: Point3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Point3, b: Point3): Point3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const scale = (a: Point3, t: number): Point3 => ({ x: a.x * t, y: a.y * t, z: a.z * t });
const norm = (a: Point3) => Math.hypot(a.x, a.y, a.z);
const center = (p: Point3[]): Point3 => scale(p.reduce((a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }), { x: 0, y: 0, z: 0 }), 1 / p.length);
function unique(points: Point3[]): Point3[] { return points.filter((p, i) => points.findIndex(q => norm(sub(p, q)) < EPS) === i); }
function plane(face: Face): Plane {
  let normal = { x: 0, y: 0, z: 0 };
  for (let i = 1; i + 1 < face.length; i++) { const candidate = cross(sub(face[i], face[0]), sub(face[i + 1], face[0])); if (norm(candidate) > norm(normal)) normal = candidate; }
  const n = scale(normal, 1 / norm(normal));
  return { n, d: dot(n, face[0]) };
}
export function polyhedronVolume(faces: Face[]): number {
  if (!faces.length) return 0;
  const origin = faces[0][0];
  let value = 0;
  for (const f of faces) for (let i = 1; i + 1 < f.length; i++) value += dot(sub(f[0], origin), cross(sub(f[i], origin), sub(f[i + 1], origin))) / 6;
  return Math.abs(value);
}
function clip(faces: Face[], boundary: Plane, spend: (n: number) => void): Face[] {
  const result: Face[] = [], caps: Point3[] = [];
  for (const face of faces) {
    spend(face.length);
    const output: Point3[] = [];
    for (let i = 0; i < face.length; i++) {
      const p = face[i], q = face[(i + 1) % face.length];
      let dp = dot(boundary.n, p) - boundary.d, dq = dot(boundary.n, q) - boundary.d;
      if (Math.abs(dp) < EPS) dp = 0;
      if (Math.abs(dq) < EPS) dq = 0;
      if (dp <= 0) output.push(p);
      if ((dp < 0 && dq > 0) || (dp > 0 && dq < 0)) {
        const t = dp / (dp - dq), point = { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t, z: p.z + (q.z - p.z) * t };
        output.push(point); caps.push(point);
      } else if (dp === 0) caps.push(p);
    }
    const cleaned = unique(output);
    if (cleaned.length >= 3 && Number.isFinite(plane(cleaned).d)) result.push(cleaned);
  }
  const cap = unique(caps);
  if (cap.length >= 3) {
    const c = center(cap), reference = Math.abs(boundary.n.z) < 0.9 ? { x: 0, y: 0, z: 1 } : { x: 1, y: 0, z: 0 };
    const u = cross(reference, boundary.n), v = cross(boundary.n, u);
    cap.sort((a, b) => Math.atan2(dot(sub(a, c), v), dot(sub(a, c), u)) - Math.atan2(dot(sub(b, c), v), dot(sub(b, c), u)));
    // Coplanar retained faces already close the polyhedron.
    if (!result.some(f => f.every(p => Math.abs(dot(boundary.n, p) - boundary.d) < EPS))) result.push(cap);
  }
  return polyhedronVolume(result) > 1e-12 ? result : [];
}
type Box = { min: Point3; max: Point3 };
function box(faces: Face[]): Box {
  const points = faces.flat();
  return { min: { x: Math.min(...points.map(p => p.x)), y: Math.min(...points.map(p => p.y)), z: Math.min(...points.map(p => p.z)) }, max: { x: Math.max(...points.map(p => p.x)), y: Math.max(...points.map(p => p.y)), z: Math.max(...points.map(p => p.z)) } };
}
const overlaps = (a: Box, b: Box) => (["x", "y", "z"] as const).every(k => a.min[k] < b.max[k] - EPS && b.min[k] < a.max[k] - EPS);
function extrude(points: Point[], element: SolidElement, floor: CadModel["floors"][number]): Face[] {
  const [bottom, top] = elementVerticalRange(element, floor);
  const lower = points.map(p => ({ ...p, z: element.type === "slab" ? slabTopAt(element, floor, p) - effectiveThickness(element) : element.type === "beam" ? beamTopAt(element, floor, p) - element.height : bottom }));
  const upper = points.map(p => ({ x: p.x + (element.type === "column" ? element.leanX ?? 0 : 0), y: p.y + (element.type === "column" ? element.leanY ?? 0 : 0), z: element.type === "slab" ? slabTopAt(element, floor, p) : element.type === "beam" ? beamTopAt(element, floor, p) : top }));
  const faces = [lower, upper, ...points.map((_, i) => [lower[i], lower[(i + 1) % points.length], upper[(i + 1) % points.length], upper[i]])];
  const c = center([...lower, ...upper]);
  return faces.map(f => dot(plane(f).n, sub(c, f[0])) > 0 ? f.reverse() : f);
}
function convex(points: Point[]): boolean {
  let sign = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length], c = points[(i + 2) % points.length];
    const z = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(z) < EPS) continue;
    if (sign && sign !== Math.sign(z)) return false;
    sign = Math.sign(z);
  }
  return true;
}
function hull(points: Point3[]): Point[] {
  const sorted = points.map(({ x, y }) => ({ x, y })).sort((a, b) => a.x - b.x || a.y - b.y);
  const half = (values: Point[]) => { const out: Point[] = []; for (const p of values) { while (out.length >= 2) { const a = out[out.length - 2], b = out[out.length - 1]; if ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) > EPS) break; out.pop(); } out.push(p); } return out; };
  const a = half(sorted), b = half([...sorted].reverse());
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

/** Physical plan projection of a member's volume within a horizontal slab band. */
export function memberFootprintsInBand(element: Exclude<SolidElement, { type: "slab" }>, floor: CadModel["floors"][number], bottom: number, top: number): Point[][] {
  const [lo, hi] = elementVerticalRange(element, floor);
  if (hi <= bottom + EPS || lo >= top - EPS) return [];
  const footprint = elementFootprint(element);
  if (!(element.type === "column" && (element.leanX || element.leanY)) && !(element.type === "beam" && element.endTopOffset !== undefined && element.endTopOffset !== element.topOffset)) return [footprint];
  const indices = convex(footprint) ? [] : earcut(footprint.flatMap(p => [p.x, p.y]), undefined, 2);
  const pieces = indices.length ? Array.from({ length: indices.length / 3 }, (_, i) => indices.slice(i * 3, i * 3 + 3).map(j => footprint[j])) : [footprint];
  let operations = 0;
  const spend = (n: number) => { operations += n; if (operations > 100_000) throw new Error("Kot kesiti işlem sınırı aşıldı; eleman kesitini sadeleştirin."); };
  return pieces.flatMap(points => {
    let faces = clip(extrude(points, element, floor), { n: { x: 0, y: 0, z: 1 }, d: top }, spend);
    faces = clip(faces, { n: { x: 0, y: 0, z: -1 }, d: -bottom }, spend);
    return faces.length ? [hull(faces.flat())] : [];
  });
}

/** Plane clipping is used for sloping slabs/leaning columns; no staircase approximation. */
export function resolvePolyhedra(model: CadModel, options: JunctionOptions): JunctionResult {
  const byElement: JunctionResult["byElement"] = Object.create(null), parts: SolidPart[] = [], blockers: { faces: Face[]; bounds: Box; planes: Plane[] }[] = [];
  let grossVolume = 0, operations = 0;
  const spend = (n: number) => { operations += n; if (operations > (options.maxOperations ?? 1_000_000)) throw new Error("Eğimli birleşim işlem sınırı aşıldı. Net metraj ve katı model üretilemedi."); };
  const priority = { column: 0, wall: 1, beam: 2, slab: 3 };
  try {
    for (const element of model.elements.filter(isSolidElement).sort((a, b) => priority[a.type] - priority[b.type] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))) {
      const floor = model.floors.find(f => f.id === element.floorId)!, footprint = elementFootprint(element);
      const indices = convex(footprint) ? [] : earcut(footprint.flatMap(p => [p.x, p.y]), undefined, 2);
      const cells: Point[][] = indices.length ? Array.from({ length: indices.length / 3 }, (_, i) => indices.slice(i * 3, i * 3 + 3).map(j => footprint[j])) : [footprint];
      byElement[element.id] = { grossVolume: 0, netVolume: 0 };
      for (const cell of cells) {
        const source = extrude(cell, element, floor), sourceBox = box(source), gross = polyhedronVolume(source);
        grossVolume += gross; byElement[element.id].grossVolume += gross;
        let remaining = [source];
        for (const blocker of blockers) {
          if (!overlaps(sourceBox, blocker.bounds)) continue;
          const outside: Face[][] = [];
          for (const subject of remaining) {
            if (!overlaps(box(subject), blocker.bounds)) { outside.push(subject); continue; }
            let rest = subject;
            for (const p of blocker.planes) {
              if (!rest.length) break;
              const piece = clip(rest, { n: scale(p.n, -1), d: -p.d }, spend);
              if (piece.length) outside.push(piece);
              rest = clip(rest, p, spend);
            }
          }
          remaining = outside;
          if (remaining.length + parts.length > (options.maxParts ?? 20_000)) throw new Error("Eğimli birleşim parça sınırı aşıldı.");
          if (!remaining.length) break;
        }
        for (const faces of remaining) {
          const volume = polyhedronVolume(faces), bounds = box(faces);
          if (volume <= 1e-12) continue;
          parts.push({ elementId: element.id, type: element.type, faces, footprint: hull(faces.flat()), bottom: bounds.min.z, top: bounds.max.z, volume });
          byElement[element.id].netVolume! += volume;
        }
        blockers.push({ faces: source, bounds: sourceBox, planes: source.map(plane) });
      }
    }
    const netVolume = parts.reduce((v, p) => v + p.volume, 0);
    if (!Number.isFinite(netVolume) || netVolume > grossVolume + 1e-7) throw new Error("Eğimli birleşim hacim tutarlılığı sağlanamadı.");
    return { status: "resolved", parts, grossVolume, netVolume, overlapVolume: Math.max(0, grossVolume - netVolume), byElement, warnings: [], epsilon: EPS };
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "Eğimli birleşim hesaplanamadı.";
    for (const q of Object.values(byElement)) q.netVolume = null;
    return { status: "failed", parts: [], grossVolume, netVolume: null, overlapVolume: null, byElement, warnings: [error], error, epsilon: EPS };
  }
}
