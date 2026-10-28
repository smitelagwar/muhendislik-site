import { createDemoModel, type CadModel } from "./model";
import { createToolTemplate } from "./creation";
import { DEFAULT_SNAP, DEFAULT_LAYERS } from "./definitions";

/** An editable reference model showing connected options, rather than inert UI samples. */
export function createFeatureDemo(): CadModel {
  const model = createDemoModel();
  model.name = "REA seçenekleri · gelişmiş örnek";
  model.materials.push({ id: "c30", name: "C30/37" });
  const common = { floorId: "floor-0", materialId: "c30", group: "Gelişmiş örnek" };
  model.elements.push(
    { ...common, id: "example-circle", type: "column", name: "S5", layer: "Kolonlar", position: { x: 8, y: 0 }, width: 0.6, depth: 0.6, height: 3, heightMode: "story", section: "circle", circleSegments: 32, color: "#e0a84b" },
    { ...common, id: "example-polygon", type: "column", name: "S6", layer: "Kolonlar", position: { x: 10, y: 0 }, width: 0.6, depth: 0.6, height: 3, heightMode: "story", section: "polygon", sectionPoints: [{ x: -0.3, y: -0.3 }, { x: 0.3, y: -0.3 }, { x: 0.3, y: -0.1 }, { x: -0.1, y: -0.1 }, { x: -0.1, y: 0.3 }, { x: -0.3, y: 0.3 }] },
    { ...common, id: "example-lean", type: "column", name: "S7", layer: "Kolonlar", position: { x: 12, y: 0 }, width: 0.4, depth: 0.4, height: 3, heightMode: "story", leanY: 0.4 },
    { ...common, id: "example-beam", type: "beam", name: "K5", layer: "Kirişler", start: { x: 8, y: 0 }, end: { x: 12, y: 0 }, width: 0.25, height: 0.5, alignment: "left", topOffset: -0.1, endTopOffset: 0.1, curveSagitta: 0.4, curveSegments: 12 },
    { ...common, id: "example-arc", type: "wall", name: "P2", layer: "Perdeler", start: { x: 8, y: 4 }, end: { x: 12, y: 4 }, thickness: 0.2, height: 3, heightMode: "story", curveSagitta: 0.6, curveSegments: 12 },
    { ...common, id: "example-slope", type: "slab", name: "D2", layer: "Döşemeler", points: [{ x: 8, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 4 }, { x: 8, y: 4 }], thickness: 0.18, buildUp: [{ name: "Alt beton", thickness: 0.12 }, { name: "Üst beton", thickness: 0.06 }], slopeX: 5, hatch: true, hatchAngle: 45, referenceVisible: true, finishName: "Kaplama", finishLoad: 1.25, liveLoad: 2, rebarMass: 120 },
  );
  model.layers = DEFAULT_LAYERS.map(name => ({ name, visible: true, locked: false }));
  model.snap = { ...DEFAULT_SNAP };
  const template = createToolTemplate("column", "floor-0", "c30");
  if (template.type === "column") model.toolDefaults = { column: { ...template, section: "circle" } };
  return model;
}
