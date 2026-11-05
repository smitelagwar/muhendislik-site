import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createIdeCadPanelDemo } from "../src/lib/hsyncad/ifc-panels";
import { exportCadModelIfc } from "../src/lib/hsyncad/ifc-export";
import { createEmptyModel, validateModel, type CadElement, type CadModel, type Point } from "../src/lib/hsyncad/model";

/** Controlled geometry fixtures, never a replacement for the user's project.
 * Existing files are refused. Native acceptance must be performed separately. */
function threeStoreys(): CadModel {
  const base = createIdeCadPanelDemo();
  const model: CadModel = { ...base, name: "Hsyncad TC33 - uc farkli kat", floors: [
    { id: "basement", name: "Bodrum", elevation: -3, height: 3 },
    { id: "ground", name: "Zemin", elevation: 0, height: 3.5 },
    { id: "first", name: "Birinci kat", elevation: 3.5, height: 2.8 },
  ], elements: [] };
  const move = (point: Point) => ({ x: point.x - 5, y: point.y + 7 });
  model.elements = model.floors.flatMap((floor, index) => base.elements.map(original => {
    const element: CadElement = structuredClone(original);
    element.id = `${floor.id}/${original.id}`;
    element.floorId = floor.id;
    // Keep native names short and unique across storeys for easier inspection.
    element.name = `${original.name}${index + 1}`;
    if (element.type === "column") { element.position = move(element.position); element.height = floor.height; }
    else if (element.type === "slab") {
      element.points = element.points.map(move); element.thickness = [.15, .20, .18][index];
      element.boundary = { elementIds: element.boundary!.elementIds.map(id => `${floor.id}/${id}`) };
    } else {
      element.start = move(element.start); element.end = move(element.end);
      if (element.type === "wall") element.height = floor.height;
      if (element.type === "beam") element.height = [.50, .65, .40][index];
    }
    return element;
  }));
  return validateModel(model);
}

function sectionAndOffsetProbes(): CadModel {
  const model = createEmptyModel(); model.name = "Hsyncad TC8 - kesit ve kot karsilastirmasi";
  const common = { floorId: model.floors[0].id, materialId: "concrete", layer: "Karşılaştırma" };
  model.elements = [
    { ...common, id: "rotated", name: "S91", type: "column", position: { x: 0, y: 0 }, width: .4, depth: .6, height: 3, rotation: 30 },
    { ...common, id: "short", name: "S92", type: "column", position: { x: 2, y: 0 }, width: .4, depth: .6, height: 2.3, baseOffset: .2 },
    { ...common, id: "circle", name: "S93", type: "column", position: { x: 4, y: 0 }, width: .6, depth: .6, height: 3, section: "circle" },
    { ...common, id: "polygon", name: "S94", type: "column", position: { x: 6, y: 0 }, width: .6, depth: .6, height: 3, section: "polygon", sectionPoints: [{ x: 0, y: 0 }, { x: .6, y: 0 }, { x: .6, y: .2 }, { x: .2, y: .2 }, { x: .2, y: .6 }, { x: 0, y: .6 }] },
    { ...common, id: "beam-offset", name: "K91", type: "beam", start: { x: -1, y: 4 }, end: { x: 7, y: 4 }, width: .3, height: .65, alignment: "left", offset: .1, topOffset: -.2 },
    { ...common, id: "beam-diagonal", name: "K92", type: "beam", start: { x: 0, y: 6 }, end: { x: 6, y: 8 }, width: .3, height: .5 },
    { ...common, id: "wall-short", name: "P91", type: "wall", start: { x: -1, y: 10 }, end: { x: 3, y: 10 }, thickness: .2, height: 1.2, baseOffset: .3 },
    { ...common, id: "wall-offset", name: "P92", type: "wall", start: { x: 5, y: 10 }, end: { x: 8, y: 13 }, thickness: .2, height: 3, alignment: "right", offset: .15 },
  ];
  return validateModel(model);
}

const [target, ...extra] = process.argv.slice(2);
if (!target || extra.length) throw new Error("Kullanım: node --import tsx scripts/create-hsyncad-ifc-fixtures.ts <yeni çıktı klasörü>");
const directory = resolve(target);
mkdirSync(directory, { recursive: true });
for (const [name, model] of [["hsyncad-panelli-11", createIdeCadPanelDemo()], ["hsyncad-tc33-3kat", threeStoreys()], ["hsyncad-tc8-kesit-kot", sectionAndOffsetProbes()]] as const) {
  const result = exportCadModelIfc(model, { requireIdeCadPanels: true });
  for (const [suffix, contents] of [[".hsyncad", JSON.stringify(model, null, 2)], [".ifc", result.text], ["-aktarim.json", JSON.stringify(result.report, null, 2)]]) {
    writeFileSync(join(directory, `${name}${suffix}`), contents, { flag: "wx" });
  }
  console.log(`${name}: ${model.floors.length} kat, ${result.report.exported.length} katı, ${result.report.omitted.length} kapsam dışı öğe`);
}
