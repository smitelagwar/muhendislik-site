import { createDemoModel, type CadModel, type SlabElement } from "./model";
import { bindNewElement } from "./relationships";
import { slabRegions } from "./regions";

export function createWorkflowDemo(): CadModel {
  const model = createDemoModel(); model.name = "Bağlı aks → kolon → kiriş → döşeme";
  model.elements = model.elements.filter(e => e.type !== "slab").map(e => e.type === "column" || e.type === "wall" ? { ...e, heightMode: "story" as const } : e);
  model.elements = model.elements.map(e => bindNewElement(e, model));
  const common = { floorId: model.floors[0].id, materialId: model.materials[0].id, layer: "Döşemeler" };
  const slabs: SlabElement[] = slabRegions(model.elements, model.floors[0].id).map((r, i) => ({ ...common, id: `workflow-slab-${i}`, name: `D${i + 1}`, type: "slab", points: r.points, thickness: 0.15, boundary: { elementIds: r.elementIds } }));
  model.elements.push(...slabs);
  return model;
}
