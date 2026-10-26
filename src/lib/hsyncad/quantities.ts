import { distance, elementFootprint, elementVerticalRange, polygonArea, polygonPerimeter } from "./geometry";
import { resolveJunctions, type JunctionResult } from "./junctions";
import type { CadModel, SolidElement } from "./model";

export type QuantityRow = { type: SolidElement["type"]; count: number; grossVolume: number; netVolume: number | null; formwork: number };
export type QuantityResult = { rows: QuantityRow[]; grossVolume: number; netVolume: number | null; overlapVolume: number | null; formwork: number; assumptions: string[]; warnings: string[] };
const TYPES = ["column", "beam", "wall", "slab"] as const;

/** Pass the same complete-model junction result used by the scene; visibility is not an input. */
export function calculateQuantities(model: CadModel, junctions: JunctionResult = resolveJunctions(model)): QuantityResult {
  const rows: QuantityRow[] = TYPES.map(type => ({ type, count: 0, grossVolume: 0, netVolume: junctions.status === "resolved" ? 0 : null, formwork: 0 }));
  const byType = Object.fromEntries(rows.map(row => [row.type, row])) as Record<SolidElement["type"], QuantityRow>;
  const floors = new Map(model.floors.map(f => [f.id, f]));
  for (const element of model.elements) {
    if (element.type === "axis") continue;
    const floor = floors.get(element.floorId);
    if (!floor) throw new Error(`${element.name}: metraj için kat bulunamadı.`);
    const row = byType[element.type], footprint = elementFootprint(element);
    const [bottom, top] = elementVerticalRange(element, floor);
    row.count++;
    row.grossVolume += polygonArea(footprint) * (top - bottom);
    if (row.netVolume !== null) row.netVolume += junctions.byElement[element.id]?.netVolume ?? 0;
    if (element.type === "column" || element.type === "wall") row.formwork += polygonPerimeter(footprint) * (top - bottom);
    else if (element.type === "beam") row.formwork += distance(element.start, element.end) * (element.width + 2 * (top - bottom)) + 2 * element.width * (top - bottom);
    else row.formwork += polygonArea(footprint) + polygonPerimeter(footprint) * (top - bottom);
  }
  return {
    rows, grossVolume: rows.reduce((sum, row) => sum + row.grossVolume, 0), netVolume: junctions.netVolume, overlapVolume: junctions.overlapVolume,
    formwork: rows.reduce((sum, row) => sum + row.formwork, 0), warnings: junctions.warnings,
    assumptions: [
      "Bütün uzunluklar metre; beton m³, kalıp m². Akslar metraja girmez. Metraj tüm katları ve gizli katmanlardaki elemanları kapsar.",
      "Kat yüksekliğine bağlı kolon/perde: alt = kat kotu + alt kot farkı, üst = kat tavanı + üst kot farkı. Sabit yükseklikte üst = alt + yükseklik + üst kot farkı. Kiriş/döşeme üst yüzü kat tavanı + kot farkıdır.",
      "Beton hacmi ve 3B görünüm aynı kesişmeyen katı parçalardan üretilir. Eğik elemanlar ve konkav döşemeler desteklenir. Ortak hacim kolon → perde → kiriş → döşeme, aynı tipte kimlik sırasıyla tek elemana atanır.",
      "Birleşim toleransı 0,00000001 m. İşlem/parça sınırı veya geometri hatasında net metraj verilmez ve katı parçalar üretilmez; brüt değer net yerine kullanılmaz.",
      "Kalıp brüttür; birleşimlerdeki temas yüzeyleri düşülmez. Kolon/perde: çevre × gerçek yükseklik. Kiriş: (b + 2h) × boy + 2bh (iki uç dahil). Döşeme: alt alan + çevre × kalınlık.",
      "Boşluklar, donatı, fire, çalışma payları ve yapım sırası yoktur. Bu geometrik ön metraj; taşıma gücü, deprem veya TBDY uygunluk hesabı değildir.",
    ],
  };
}
