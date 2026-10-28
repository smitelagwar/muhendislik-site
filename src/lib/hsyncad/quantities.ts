import { distance, elementFootprint, elementVerticalRange, polygonArea, polygonPerimeter } from "./geometry";
import { resolveJunctions, type JunctionResult } from "./junctions";
import { isSolidElement, type CadModel, type SolidElement } from "./model";
import { effectiveThickness } from "./definitions";

export type QuantityRow = { type: SolidElement["type"]; count: number; grossVolume: number; netVolume: number | null; formwork: number };
export type QuantityResult = { rows: QuantityRow[]; grossVolume: number; netVolume: number | null; overlapVolume: number | null; formwork: number; assumptions: string[]; warnings: string[] };
const TYPES = ["column", "beam", "wall", "slab"] as const;

/** Pass the same complete-model junction result used by the scene; visibility is not an input. */
export function calculateQuantities(model: CadModel, junctions: JunctionResult = resolveJunctions(model)): QuantityResult {
  const rows: QuantityRow[] = TYPES.map(type => ({ type, count: 0, grossVolume: 0, netVolume: junctions.status === "resolved" ? 0 : null, formwork: 0 }));
  const byType = Object.fromEntries(rows.map(row => [row.type, row])) as Record<SolidElement["type"], QuantityRow>;
  const floors = new Map(model.floors.map(f => [f.id, f]));
  for (const element of model.elements) {
    if (!isSolidElement(element)) continue;
    const floor = floors.get(element.floorId);
    if (!floor) throw new Error(`${element.name}: metraj için kat bulunamadı.`);
    const row = byType[element.type], footprint = elementFootprint(element);
    const [bottom, top] = elementVerticalRange(element, floor);
    row.count++;
    row.grossVolume += polygonArea(footprint) * (element.type === "slab" ? effectiveThickness(element) : element.type === "beam" ? element.height : top - bottom);
    if (row.netVolume !== null) row.netVolume += junctions.byElement[element.id]?.netVolume ?? 0;
    if (element.type === "column" && ((element.leanX ?? 0) !== 0 || (element.leanY ?? 0) !== 0)) row.formwork += footprint.reduce((sum, p, i) => {
      const q = footprint[(i + 1) % footprint.length], dx = q.x - p.x, dy = q.y - p.y;
      return sum + Math.hypot((top - bottom) * Math.hypot(dx, dy), dx * (element.leanY ?? 0) - dy * (element.leanX ?? 0));
    }, 0);
    else if (element.type === "column" || element.type === "wall") row.formwork += polygonPerimeter(footprint) * (top - bottom);
    else if (element.type === "beam") row.formwork += polygonArea(footprint) * Math.hypot(1, ((element.endTopOffset ?? element.topOffset ?? 0) - (element.topOffset ?? 0)) / distance(element.start, element.end)) + polygonPerimeter(footprint) * element.height;
    else row.formwork += polygonArea(footprint) * Math.hypot(1, (element.slopeX ?? 0) / 100, (element.slopeY ?? 0) / 100) + polygonPerimeter(footprint) * effectiveThickness(element);
  }
  return {
    rows, grossVolume: rows.reduce((sum, row) => sum + row.grossVolume, 0), netVolume: junctions.netVolume, overlapVolume: junctions.overlapVolume,
    formwork: rows.reduce((sum, row) => sum + row.formwork, 0), warnings: junctions.warnings,
    assumptions: [
      "Bütün uzunluklar metre; beton m³, kalıp m². Akslar metraja girmez. Metraj tüm katları ve gizli katmanlardaki elemanları kapsar.",
      "Kat yüksekliğine bağlı kolon/perde: alt = kat kotu + alt kot farkı, üst = kat tavanı + üst kot farkı. Sabit yükseklikte üst = alt + yükseklik + üst kot farkı. Kiriş/döşeme üst yüzü kat tavanı + kot farkıdır.",
      "Beton hacmi ve 3B görünüm aynı kesişmeyen katı parçalardan üretilir. Eğik elemanlar ve konkav döşemeler desteklenir. Ortak hacim kolon → perde → kiriş → döşeme, aynı tipte kimlik sırasıyla tek elemana atanır.",
      "Nokta bağları plan koordinatlarını ilişkilendirir. Bağlı iki elemanın kotları arasında kesin düşey açıklık varsa ayrıca uyarı gösterilir; geometrik net hacim yine hesaplanır. Bu denetim mühendislik bağlantısı veya taşıma gücü doğrulaması değildir.",
      "Birleşim toleransı 0,00000001 m. İşlem/parça sınırı veya geometri hatasında net metraj verilmez ve katı parçalar üretilmez; brüt değer net yerine kullanılmaz.",
      "Kalıp brüttür; birleşimlerdeki temas yüzeyleri düşülmez. Kolon/perde: çevre × gerçek yükseklik. Kiriş: (b + 2h) × boy + 2bh (iki uç dahil). Döşeme: alt alan + çevre × kalınlık.",
      "Daireler seçilen kenar sayısıyla, eğrisel perdeler seçilen yay parçasıyla çokgenleştirilir; hacim ve 3B aynı yaklaşımı kullanır. Eğimli döşemelerde kalınlık düşeydir; kot ilk köşede, X/Y eğimleri yüzde cinsindedir. Katmanlı döşeme kalınlığı tanımlı beton katmanlarının toplamıdır. Kaplama yükü ve hareketli yük ayrıca saklanır; taşıma gücü hesabı yapılmaz.",
      "Boşluklar, donatı, fire, çalışma payları ve yapım sırası yoktur. Bu geometrik ön metraj; taşıma gücü, deprem veya TBDY uygunluk hesabı değildir.",
    ],
  };
}
