import { distance, polygonArea, polygonPerimeter } from "./geometry";
import { effectiveThickness } from "./definitions";
import { createDemoModel, type CadModel, type Point, type SlabElement } from "./model";
import { slabRegionsAtLevel, type SlabRegion } from "./regions";

const tolerance = 0.00001;
function onBoundary(point: Point, ring: Point[]): boolean {
  return ring.some((a, i) => {
    const b = ring[(i + 1) % ring.length], dx = b.x - a.x, dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared)) : 0;
    return distance(point, { x: a.x + dx * t, y: a.y + dy * t }) <= tolerance;
  });
}
function sameOutline(a: Point[], b: Point[]): boolean {
  const follows = (left: Point[], right: Point[]) => left.every((p, i) => {
    const q = left[(i + 1) % left.length];
    return onBoundary(p, right) && onBoundary({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, right);
  });
  return Math.abs(polygonArea(a) - polygonArea(b)) <= tolerance * polygonPerimeter(a) && follows(a, b) && follows(b, a);
}

/** Native IFC import rebuilds slabs as enclosed member faces. Do not silently
 * split or trim the user's model to imitate that behaviour during export. */
export function ideCadSlabPanelIssues(model: CadModel): Map<string, string> {
  const issues = new Map<string, string>(), regions = new Map<string, SlabRegion[]>();
  // Slab edges are not emitted by the structural IFC bridge. A face bounded
  // only by those editor lines cannot be rebuilt by the native importer.
  const transferred = { ...model, elements: model.elements.filter(e => e.type !== "slabEdge") };
  for (const slab of model.elements) {
    if (slab.type !== "slab") continue;
    const key = JSON.stringify([slab.floorId, slab.topOffset ?? 0, effectiveThickness(slab), slab.slopeX ?? 0, slab.slopeY ?? 0]);
    try {
      if (!regions.has(key)) regions.set(key, slabRegionsAtLevel(transferred, slab));
      if (!regions.get(key)!.some(region => sameOutline(slab.points, region.points))) {
        issues.set(slab.id, "ideCAD döşeme sınırını taşıyıcı yüzlerinden yeniden kurar. Döşemeyi kapalı alan aracıyla ayrı panel olarak tanımlayın; mevcut sınır sessizce değiştirilmedi.");
      }
    } catch (error) {
      issues.set(slab.id, error instanceof Error ? error.message : "Döşeme panel sınırı doğrulanamadı.");
    }
  }
  return issues;
}

/** The source of the observed eleven-solid native acceptance case. */
export function createIdeCadPanelDemo(): CadModel {
  const model = createDemoModel(), slab = model.elements.find((e): e is SlabElement => e.type === "slab")!;
  const regions = slabRegionsAtLevel(model, slab);
  model.name = "Hsyncad 4x4 - yerel doseme panelleri";
  model.elements = model.elements.filter(e => e.type !== "slab");
  regions.forEach((region, i) => model.elements.push({ ...slab, id: `panel-${i}`, name: `D${i + 1}`, points: region.points, boundary: { elementIds: region.elementIds } }));
  return model;
}
