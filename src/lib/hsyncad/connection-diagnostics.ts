import type { CadElement, CadModel, Point } from "./model";
import { beamTopAt, elementVerticalRange } from "./geometry";

/** Point bindings constrain plan coordinates. Report provable vertical gaps separately. */
export function connectionElevationWarnings(model: CadModel): string[] {
  const byId = new Map(model.elements.map(e => [e.id, e]));
  const floors = new Map(model.floors.map(f => [f.id, f]));
  const rangeAt = (element: CadElement, point: Point): [number, number] | undefined => {
    const floor = floors.get(element.floorId);
    if (!floor || element.type === "axis" || element.type === "slabEdge") return;
    if (element.type === "beam") {
      const top = beamTopAt(element, floor, point);
      return [top - element.height, top];
    }
    return elementVerticalRange(element, floor);
  };
  const warnings: string[] = [];
  for (const element of model.elements) {
    for (const [key, binding] of Object.entries(element.connections ?? {})) {
      if (binding.kind === "axes") continue;
      const point = (element as unknown as Record<string, Point>)[key], parent = byId.get(binding.id);
      if (!point || !parent) continue;
      const childRange = rangeAt(element, point), parentRange = rangeAt(parent, point);
      if (!childRange || !parentRange) continue;
      const gap = Math.max(childRange[0] - parentRange[1], parentRange[0] - childRange[1]);
      if (gap <= 1e-6) continue;
      const node = key === "start" ? "başlangıç" : key === "end" ? "bitiş" : "konum";
      warnings.push(`${element.name} ${node} düğümü → ${parent.name}: düşeyde ${gap.toLocaleString("tr-TR", { maximumFractionDigits: 6 })} m açıklık var. Nokta bağı yalnız plandadır; fiziksel beton birleşimi yok. Eleman kotlarını kontrol edin.`);
    }
  }
  return warnings;
}
