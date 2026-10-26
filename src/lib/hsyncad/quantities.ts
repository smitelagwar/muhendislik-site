import { distance, elementFootprint, elementVerticalRange, polygonArea, polygonPerimeter } from "./geometry";
import type { CadModel, Floor, SolidElement } from "./model";

export type QuantityRow = { type: SolidElement["type"]; count: number; grossVolume: number; netVolume: number; formwork: number };
export type QuantityResult = { rows: QuantityRow[]; grossVolume: number; netVolume: number; overlapVolume: number; formwork: number; assumptions: string[]; warnings: string[] };
type Box = { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number; type: SolidElement["type"] };
const TYPES = ["column", "beam", "wall", "slab"] as const;
const PRIORITY = { column: 0, wall: 1, beam: 2, slab: 3 };
const sortedUnique = (values: number[]) => [...new Set(values)].sort((a, b) => a - b);

function axisAlignedBox(element: SolidElement, floor: Floor): Box | null {
  const points = elementFootprint(element);
  if (points.length !== 4 || points.some((p, i) => {
    const q = points[(i + 1) % points.length];
    return Math.abs(p.x - q.x) > 1e-9 && Math.abs(p.y - q.y) > 1e-9;
  })) return null;
  const [minZ, maxZ] = elementVerticalRange(element, floor);
  return { minX: Math.min(...points.map(p => p.x)), maxX: Math.max(...points.map(p => p.x)), minY: Math.min(...points.map(p => p.y)), maxY: Math.max(...points.map(p => p.y)), minZ, maxZ, type: element.type };
}

/** Exact box-union volume using z/x slabs and ordered y intervals. Every cell belongs to one type. */
function unionByType(boxes: Box[]): Record<SolidElement["type"], number> | null {
  const result = { column: 0, beam: 0, wall: 0, slab: 0 };
  const zs = sortedUnique(boxes.flatMap(b => [b.minZ, b.maxZ]));
  let work = 0;
  for (let z = 0; z + 1 < zs.length; z++) {
    const zMiddle = (zs[z] + zs[z + 1]) / 2;
    const activeZ = boxes.filter(b => b.minZ < zMiddle && b.maxZ > zMiddle);
    const xs = sortedUnique(activeZ.flatMap(b => [b.minX, b.maxX]));
    for (let x = 0; x + 1 < xs.length; x++) {
      const xMiddle = (xs[x] + xs[x + 1]) / 2;
      const activeX = activeZ.filter(b => b.minX < xMiddle && b.maxX > xMiddle);
      work += activeZ.length + activeX.length * 2;
      // Bound synchronous browser work. Never publish a partially calculated net value.
      if (work > 2_000_000) return null;
      const events = activeX.flatMap(b => [{ y: b.minY, delta: 1, type: b.type }, { y: b.maxY, delta: -1, type: b.type }]).sort((a, b) => a.y - b.y);
      const counts = { column: 0, wall: 0, beam: 0, slab: 0 };
      const priorityTypes = ["column", "wall", "beam", "slab"] as const;
      let previousY = events[0]?.y ?? 0;
      for (const event of events) {
        const type = priorityTypes.find(t => counts[t] > 0);
        if (type) result[type] += (xs[x + 1] - xs[x]) * (event.y - previousY) * (zs[z + 1] - zs[z]);
        counts[event.type] += event.delta;
        previousY = event.y;
      }
    }
  }
  return result;
}

/** Geometric quantities only; no structural or code-compliance calculations. */
export function calculateQuantities(model: CadModel): QuantityResult {
  const rows: QuantityRow[] = TYPES.map(type => ({ type, count: 0, grossVolume: 0, netVolume: 0, formwork: 0 }));
  const byType = Object.fromEntries(rows.map(row => [row.type, row])) as Record<SolidElement["type"], QuantityRow>;
  const floors = new Map(model.floors.map(f => [f.id, f]));
  const boxes: Box[] = [];
  let unsupported = false;
  for (const element of model.elements) {
    if (element.type === "axis") continue;
    const floor = floors.get(element.floorId);
    if (!floor) throw new Error(`${element.name}: metraj için kat bulunamadı.`);
    const row = byType[element.type], footprint = elementFootprint(element);
    const [bottom, top] = elementVerticalRange(element, floor);
    row.count++;
    row.grossVolume += polygonArea(footprint) * (top - bottom);
    if (element.type === "column" || element.type === "wall") row.formwork += polygonPerimeter(footprint) * element.height;
    else if (element.type === "beam") row.formwork += distance(element.start, element.end) * (element.width + 2 * element.height) + 2 * element.width * element.height;
    else row.formwork += polygonArea(footprint) + polygonPerimeter(footprint) * element.thickness;
    const box = axisAlignedBox(element, floor);
    if (box) boxes.push(box); else unsupported = true;
  }
  boxes.sort((a, b) => PRIORITY[a.type] - PRIORITY[b.type]);
  const net = unsupported ? null : unionByType(boxes);
  const warnings: string[] = [];
  if (unsupported) warnings.push("Eğik eleman veya dikdörtgen olmayan döşeme var: bu modelde beton çakışmaları düşülmedi; gösterilen hacimler brüttür.");
  else if (!net) warnings.push("Modelin kesişim hesabı çalışma sınırını aştı: beton çakışmaları düşülmedi; gösterilen hacimler brüttür.");
  for (const row of rows) row.netVolume = net ? Math.max(0, Math.min(row.grossVolume, net[row.type])) : row.grossVolume;
  const grossVolume = rows.reduce((sum, row) => sum + row.grossVolume, 0), netVolume = rows.reduce((sum, row) => sum + row.netVolume, 0);
  return {
    rows, grossVolume, netVolume, overlapVolume: Math.max(0, grossVolume - netVolume), formwork: rows.reduce((sum, row) => sum + row.formwork, 0), warnings,
    assumptions: [
      "Bütün uzunluklar metre; beton m³, kalıp m². Akslar metraja girmez. Metraj tüm katları ve gizli katmanlardaki elemanları kapsar.",
      "Kolon/perde kat kotundan eleman yüksekliği kadar yükselir. Kiriş/döşeme üst kotu kat kotu + kat yüksekliğidir; kesit aşağı uzanır.",
      "Eksenlere paralel dikdörtgen katıların beton birleşim hacmi tam hesaplanır. Ortak hacim kolon → perde → kiriş → döşeme sırasıyla tek tipe atanır; üçlü kesişimler bir kez sayılır.",
      "Kalıp brüttür; birleşimlerdeki temas yüzeyleri düşülmez. Kolon/perde: çevre × yükseklik. Kiriş: (b + 2h) × boy + 2bh (iki uç dahil). Döşeme: alt alan + çevre × kalınlık.",
      "Boşluklar, donatı, fire, çalışma payları ve yapım sırası yoktur. Bu geometrik ön metraj; taşıma gücü, deprem veya TBDY uygunluk hesabı değildir.",
    ],
  };
}
