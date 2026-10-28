import type { SolidElement } from "./model";
export function createToolTemplate(type: SolidElement["type"], floorId: string, materialId: string): SolidElement {
  const common = { id: `defaults-${type}`, name: { column: "S", beam: "K", wall: "P", slab: "D" }[type], floorId, materialId, layer: { column: "Kolonlar", beam: "Kirişler", wall: "Perdeler", slab: "Döşemeler" }[type] };
  if (type === "column") return { ...common, type, position: { x: 0, y: 0 }, width: 0.4, depth: 0.4, height: 3, heightMode: "story" };
  if (type === "beam") return { ...common, type, start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, width: 0.25, height: 0.5 };
  if (type === "wall") return { ...common, type, start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, thickness: 0.2, height: 3, heightMode: "story" };
  return { ...common, type, points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }], thickness: 0.15 };
}
