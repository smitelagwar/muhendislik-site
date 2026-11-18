import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { createEmptyModel, type CadModel } from "../../src/lib/hsyncad/model";
import type { AnalysisResult, MemberForceResult } from "../../src/lib/hsyncad/analysis";

export function smallSlab(thickness = .15): CadModel {
  const model = createEmptyModel();
  model.name = "MUSTAFA SELVİ 1.KISIM";
  model.floors = ["ASANSÖR MAK.DAİRESİ", "3. KAT", "2. KAT", "1. KAT", "ZEMİN KAT", "1. BODRUM"].map((name, i) => ({ id: `f${i}`, name, elevation: i * 3, height: 3 }));
  model.elements = [{ id: "slab", name: "D1", type: "slab", floorId: "f0", materialId: "concrete", layer: "Döşemeler",
    thickness, points: [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }] }];
  return model;
}
export function manyColumns(count: number, name = "Kapsam sınaması"): CadModel {
  const model = createEmptyModel(); model.name = name;
  model.elements = Array.from({ length: count }, (_, i) => ({ id: `column-${i}`, name: `KOLON-${i}`, type: "column" as const,
    floorId: "floor-0", materialId: "concrete", layer: "Kolonlar", position: { x: i * 2, y: 0 }, width: .4, depth: .4, height: 3 }));
  return model;
}
/** Yalnız renderer girdisi. Bu fixture bir solver doğruluk oracle'ı değildir. */
export function preliminaryRecords(model: CadModel): AnalysisResult {
  return { members: Object.fromEntries(model.elements.filter(e => e.type === "column").map(e => [e.id, {
    elementId: e.id, name: e.name, type: "column", floorId: e.floorId, axialKn: 10, shearKn: 2, momentKnm: 3,
    pass: true, governingCombination: "SENTETİK-RENDERER", capacityRatio: .3,
  } as MemberForceResult])), storeys: [], modes: [], overallPass: true } as unknown as AnalysisResult;
}
export async function pdfText(bytes: Uint8Array): Promise<{ text: string; pages: number }> {
  const task = pdfjs.getDocument({ data: bytes.slice(), useSystemFonts: true });
  const doc = await task.promise;
  try {
    const texts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const content = await (await doc.getPage(i)).getTextContent();
      texts.push(content.items.map(item => "str" in item ? item.str : "").join(" "));
    }
    return { text: texts.join("\n"), pages: doc.numPages };
  } finally { await task.destroy(); }
}
