import type { CadElement, Point } from "./model";
import { collectSnapCandidates, distance, isSimplePolygon, lineIntersection, polygonArea } from "./geometry";

export const DRAFTING_NAMES = { measureDistance: "Uzaklık", measureAngle: "Açı", measureArea: "Alan / çevre", referenceLine: "Referans çizgisi", referencePoint: "Lokal orijin" } as const;
export type DraftingTool = keyof typeof DRAFTING_NAMES;
export type DraftingItem = { id: string; floorId: string; name: string; kind: DraftingTool; points: Point[] };
export type ReferenceFrame = { origin: Point; angle: number; enabled: boolean };
export type DraftingData = { items: DraftingItem[]; frames?: Record<string, ReferenceFrame> };
export function isDraftingTool(tool: string): tool is DraftingTool { return Object.prototype.hasOwnProperty.call(DRAFTING_NAMES, tool); }
export function localToWorld(point: Point, frame?: ReferenceFrame): Point {
  if (!frame?.enabled) return point;
  const a = frame.angle * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  return { x: frame.origin.x + point.x * c - point.y * s, y: frame.origin.y + point.x * s + point.y * c };
}
export function worldToLocal(point: Point, frame?: ReferenceFrame): Point {
  if (!frame?.enabled) return point;
  const a = frame.angle * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), x = point.x - frame.origin.x, y = point.y - frame.origin.y;
  return { x: x * c + y * s, y: -x * s + y * c };
}
export function draftingValues(item: Pick<DraftingItem, "kind" | "points">) {
  const [a, b, c] = item.points;
  if (item.kind === "measureArea") return { area: polygonArea(item.points), perimeter: item.points.reduce((sum, p, i) => sum + distance(p, item.points[(i + 1) % item.points.length]), 0) };
  if (item.kind === "measureAngle" && a && b && c) {
    const u = { x: a.x - b.x, y: a.y - b.y }, v = { x: c.x - b.x, y: c.y - b.y };
    return { angle: Math.atan2(Math.abs(u.x * v.y - u.y * v.x), u.x * v.x + u.y * v.y) * 180 / Math.PI };
  }
  if (a && b) return { length: distance(a, b), dx: b.x - a.x, dy: b.y - a.y, angle: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
  return {};
}
export function draftingSummary(item: Pick<DraftingItem, "kind" | "points">, unit: "m" | "cm" = "m"): string {
  const v = draftingValues(item), k = unit === "cm" ? 100 : 1;
  const n = (x: number) => x.toLocaleString("tr-TR", { maximumFractionDigits: 3 });
  if (v.area !== undefined) return `${n(v.area)} m² · Çevre ${n(v.perimeter! * k)} ${unit}`;
  if (v.length !== undefined) return `${n(v.length * k)} ${unit} · ΔX ${n(v.dx! * k)} · ΔY ${n(v.dy! * k)} · ${n(v.angle!)}°`;
  if (v.angle !== undefined) return `${n(v.angle)}°`;
  return item.points[0] ? `X ${n(item.points[0].x * k)} · Y ${n(item.points[0].y * k)} ${unit}` : "";
}
export function validateDrafting(value: unknown, floorIds: Set<string>): DraftingData {
  const obj = (v: unknown): Record<string, unknown> => { if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Ölçüm / referans kaydı geçersiz."); return v as Record<string, unknown>; };
  const num = (v: unknown) => { if (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > 1e6) throw new Error("Ölçüm koordinatı geçersiz."); return v; };
  const point = (v: unknown): Point => { const p = obj(v); return { x: num(p.x), y: num(p.y) }; };
  const data = obj(value);
  if (!Array.isArray(data.items) || data.items.length > 1000) throw new Error("En fazla 1.000 ölçüm / referans kaydı olabilir.");
  const ids = new Set<string>();
  const items = data.items.map((v): DraftingItem => {
    const e = obj(v);
    if (typeof e.id !== "string" || !e.id || e.id.length > 160 || ids.has(e.id) || typeof e.name !== "string" || !e.name.trim() || e.name.length > 160 || typeof e.floorId !== "string" || !floorIds.has(e.floorId) || typeof e.kind !== "string" || !isDraftingTool(e.kind) || !Array.isArray(e.points) || e.points.length > 200) throw new Error("Ölçüm / referans kimliği, katı veya türü geçersiz.");
    ids.add(e.id); const points = e.points.map(point);
    const expected = e.kind === "referencePoint" ? 1 : e.kind === "measureAngle" ? 3 : e.kind === "measureArea" ? null : 2;
    if (expected !== null && points.length !== expected || points.some((p, i) => i > 0 && distance(p, points[i - 1]) < 1e-6)) throw new Error("Ölçüm için farklı noktalar seçin.");
    if (e.kind === "measureArea" && (!isSimplePolygon(points) || polygonArea(points) < 1e-8)) throw new Error("Ölçüm alanı kapalı, kesişmeyen ve en az üç köşeli olmalıdır.");
    return { id: e.id, name: e.name.trim(), floorId: e.floorId, kind: e.kind, points };
  });
  let frames: DraftingData["frames"];
  if (data.frames !== undefined) {
    frames = {};
    for (const [id, value] of Object.entries(obj(data.frames))) {
      if (!floorIds.has(id)) throw new Error("Lokal koordinat sisteminin katı bulunamadı.");
      const f = obj(value); if (typeof f.enabled !== "boolean") throw new Error("Lokal sistem durumu geçersiz.");
      frames[id] = { origin: point(f.origin), angle: num(f.angle), enabled: f.enabled };
    }
  }
  return { items, ...(frames ? { frames } : {}) };
}

export function referenceSnapCandidates(elements: CadElement[], items: DraftingItem[]) {
  const result = collectSnapCandidates(elements), lines = items.filter(i => i.kind === "referenceLine").map(i => i.points);
  for (const item of items.filter(i => i.kind.startsWith("reference"))) result.endpoint.push(...item.points);
  const axes = elements.filter(e => e.type === "axis").map(e => [e.start, e.end]);
  lines.forEach((line, i) => { result.midpoint.push({ x: (line[0].x + line[1].x) / 2, y: (line[0].y + line[1].y) / 2 }); for (const other of [...axes, ...lines.slice(i + 1)]) { const p = lineIntersection(line[0], line[1], other[0], other[1]); if (p) result.intersection.push(p); } });
  return result;
}
export function projectOnReference(point: Point, items: DraftingItem[], tolerance: number): Point | undefined {
  let best: Point | undefined, shortest = tolerance;
  for (const item of items.filter(i => i.kind === "referenceLine")) {
    const [a, b] = item.points, dx = b.x - a.x, dy = b.y - a.y, t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy), p = { x: a.x + t * dx, y: a.y + t * dy }, d = distance(point, p);
    if (d <= shortest) { best = p; shortest = d; }
  }
  return best;
}
