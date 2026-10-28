import type { CadElement, CadModel, ElementConnections, Point, PointBinding, SlabElement } from "./model";
import { distance, elementFootprint, elementVerticalRange, lineIntersection } from "./geometry";
import { regionCenter, slabRegionsAtLevel } from "./regions";

const same = (a: Point, b: Point) => distance(a, b) < 2e-6;
function resolveBinding(binding: PointBinding, model: CadModel, floorId: string): Point | undefined {
  if (binding.kind === "column") { const e = model.elements.find(e => e.id === binding.id); return e?.type === "column" && e.floorId === floorId ? e.position : undefined; }
  if (binding.kind === "member") { const e = model.elements.find(e => e.id === binding.id); return (e?.type === "beam" || e?.type === "wall") && e.floorId === floorId && Math.abs(e.curveSagitta ?? 0) < 1e-9 ? { x: e.start.x + (e.end.x - e.start.x) * binding.t, y: e.start.y + (e.end.y - e.start.y) * binding.t } : undefined; }
  const [a, b] = binding.ids.map(id => model.elements.find(e => e.id === id));
  if (a?.type !== "axis" || b?.type !== "axis" || a.floorId !== floorId || b.floorId !== floorId) return;
  const p = lineIntersection(a.start, a.end, b.start, b.end);
  if (!p) throw new Error(`${a.name} ve ${b.name} paralel oldu; bağlı düğüm konumu çözülemiyor.`);
  return p;
}
export function pointBinding(point: Point, element: CadElement, model: CadModel): PointBinding | undefined {
  const onFloor = model.elements.filter(e => e.floorId === element.floorId && e.id !== element.id);
  if (element.type !== "column") { const c = onFloor.find(e => e.type === "column" && same(e.position, point)); if (c) return { kind: "column", id: c.id }; }
  const axes = onFloor.filter(e => e.type === "axis");
  for (let i = 0; i < axes.length; i++) for (let j = i + 1; j < axes.length; j++) { const p = lineIntersection(axes[i].start, axes[i].end, axes[j].start, axes[j].end); if (p && same(p, point)) return { kind: "axes", ids: [axes[i].id, axes[j].id] }; }
  if (element.type !== "column") {
    const ownIndex = model.elements.findIndex(e => e.id === element.id);
    for (const parent of onFloor) if ((parent.type === "beam" || parent.type === "wall") && Math.abs(parent.curveSagitta ?? 0) < 1e-9 && (ownIndex < 0 || model.elements.indexOf(parent) < ownIndex)) {
      const dx = parent.end.x - parent.start.x, dy = parent.end.y - parent.start.y, t = ((point.x - parent.start.x) * dx + (point.y - parent.start.y) * dy) / (dx * dx + dy * dy);
      if (t >= 0 && t <= 1 && same(point, { x: parent.start.x + t * dx, y: parent.start.y + t * dy })) return { kind: "member", id: parent.id, t };
    }
  }
}
export function bindNewElement(element: CadElement, model: CadModel): CadElement {
  if (element.type === "axis" || element.type === "slab") return element;
  const connections: ElementConnections = {};
  for (const key of (element.type === "column" ? ["position"] : ["start", "end"]) as (keyof ElementConnections)[]) {
    const binding = pointBinding((element as unknown as Record<string, Point>)[key], element, model); if (binding) connections[key] = binding;
  }
  return Object.keys(connections).length ? { ...element, connections } : element;
}

/** An edit is atomic: downstream nodes and dependent slab faces update before validation. */
export function reconcileConnections(next: CadModel, previous: CadModel): CadModel {
  const model = { ...next, elements: next.elements.map(e => ({ ...e, ...(e.connections ? { connections: { ...e.connections } } : {}) })) };
  const old = new Map(previous.elements.map(e => [e.id, e]));
  const resolving = new Set<string>(), completed = new Set<string>();
  function update(e: CadElement) {
    if (completed.has(e.id) || !e.connections) return;
    if (resolving.has(e.id)) throw new Error("Düğüm bağlantılarında döngü var; işlem uygulanmadı.");
    resolving.add(e.id);
    for (const binding of Object.values(e.connections)) for (const id of binding.kind === "axes" ? binding.ids : [binding.id]) { const parent = model.elements.find(p => p.id === id); if (parent) update(parent); }
    const before = old.get(e.id);
    for (const key of Object.keys(e.connections) as (keyof ElementConnections)[]) {
      const binding = e.connections[key]!;
      const p = (e as unknown as Record<string, Point>)[key], previousPoint = before && key in before ? (before as unknown as Record<string, Point>)[key] : undefined;
      if (before?.floorId !== undefined && before.floorId !== e.floorId || previousPoint && !same(p, previousPoint)) { delete e.connections[key]; continue; }
      const point = resolveBinding(binding, model, e.floorId);
      if (!point) { delete e.connections[key]; continue; }
      (e as unknown as Record<string, Point>)[key] = { ...point };
    }
    if (!Object.keys(e.connections).length) delete e.connections;
    resolving.delete(e.id); completed.add(e.id);
  }
  for (const e of model.elements) update(e);
  const byId = new Map(model.elements.map(e => [e.id, e])), regionCache = new Map<string, ReturnType<typeof slabRegionsAtLevel>>();
  const floorChanged = new Map<string, boolean>();
  const signature = (source: CadModel, floorId: string) => {
    const floor = source.floors.find(f => f.id === floorId);
    return floor ? JSON.stringify([floor.elevation, floor.height, source.elements.filter(e => e.floorId === floorId && e.type !== "axis" && e.type !== "slab").map(e => [e.id, elementFootprint(e), elementVerticalRange(e, floor), e.type === "column" ? [e.leanX, e.leanY] : e.type === "beam" || e.type === "slabEdge" ? [e.topOffset, e.endTopOffset] : null])]) : "";
  };
  for (const slab of model.elements.filter((e): e is SlabElement => e.type === "slab" && !!e.boundary)) {
    const before = old.get(slab.id);
    if (before?.type !== "slab") continue;
    if (slab.floorId !== before.floorId || JSON.stringify(slab.points) !== JSON.stringify(before.points)) { delete slab.boundary; continue; }
    if (!floorChanged.has(slab.floorId)) floorChanged.set(slab.floorId, signature(model, slab.floorId) !== signature(previous, slab.floorId));
    const settings = (s: SlabElement) => JSON.stringify([s.topOffset, s.thickness, s.buildUp, s.slopeX, s.slopeY]);
    const changed = floorChanged.get(slab.floorId) || settings(slab) !== settings(before);
    if (!changed) continue;
    const cacheKey = JSON.stringify([slab.floorId, settings(slab)]);
    if (!regionCache.has(cacheKey)) regionCache.set(cacheKey, slabRegionsAtLevel(model, slab));
    const coreIds = slab.boundary!.elementIds.filter(id => { const parent = byId.get(id); return parent && parent.type !== "column"; });
    const center = regionCenter(before.points);
    const candidates = regionCache.get(cacheKey)!.filter(r => coreIds.every(id => r.elementIds.includes(id)));
    candidates.sort((a, b) => distance(regionCenter(a.points), center) - distance(regionCenter(b.points), center));
    const region = candidates[0];
    if (!region || candidates.length > 1) throw new Error(`${slab.name} döşemesinin çevresi açılıyor veya farklı alanlara ayrılıyor; kot ve sınırları kontrol edin. Önce bağlı döşemeyi silin veya Özellikler'den çevre bağını ayırın; işlem uygulanmadı.`);
    slab.topOffset = (slab.topOffset ?? 0) + (region.points[0].x - before.points[0].x) * (slab.slopeX ?? 0) / 100 + (region.points[0].y - before.points[0].y) * (slab.slopeY ?? 0) / 100;
    slab.points = region.points; slab.boundary = { elementIds: region.elementIds };
    if (slab.labelPosition) { const nextCenter = regionCenter(region.points); slab.labelPosition = { x: slab.labelPosition.x + nextCenter.x - center.x, y: slab.labelPosition.y + nextCenter.y - center.y }; }
  }
  return model;
}
export function copyElementsToFloor(elements: CadElement[], floorId: string): CadElement[] {
  const ids = new Map(elements.map(e => [e.id, crypto.randomUUID()]));
  return elements.map(e => {
    // Geometry must belong to the new storey; editing its points cannot mutate the source.
    const next: CadElement = { ...structuredClone(e), id: ids.get(e.id)!, floorId };
    if (e.connections) {
      next.connections = Object.fromEntries(Object.entries(e.connections).flatMap<[string, PointBinding]>(([key, binding]) => {
        if (binding.kind === "axes") {
          const [a, b] = binding.ids.map(id => ids.get(id));
          return a && b ? [[key, { ...binding, ids: [a, b] }]] : [];
        }
        const id = ids.get(binding.id);
        return id ? [[key, { ...binding, id }]] : [];
      }));
      if (!Object.keys(next.connections).length) delete next.connections;
    }
    if (next.type === "slab" && next.boundary) {
      if (next.boundary.elementIds.every(id => ids.has(id))) next.boundary = { elementIds: next.boundary.elementIds.map(id => ids.get(id)!) };
      else delete next.boundary;
    }
    return next;
  });
}
export function removeWithDependents(model: CadModel, id: string): { model: CadModel; count: number } {
  const element = model.elements.find(e => e.id === id), removed = new Set([id]);
  if (element?.type === "beam" || element?.type === "wall" || element?.type === "slabEdge") for (const slab of model.elements) if (slab.type === "slab" && slab.boundary?.elementIds.includes(id)) removed.add(slab.id);
  return { model: { ...model, elements: model.elements.filter(e => !removed.has(e.id)) }, count: removed.size };
}
