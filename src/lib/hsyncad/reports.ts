import { isSolidElement, type CadModel, type SolidElement } from "./model";
import type { JunctionResult } from "./junctions";
import { calculateQuantities } from "./quantities";
import { elementFootprint, polygonArea } from "./geometry";

export type ReportGrouping = "type" | "floor" | "floor-type" | "type-floor" | "material" | "element";
export type ReportOptions = { grouping: ReportGrouping; floorId: string; types: SolidElement["type"][] };
export type ReportRow = { id: string; key: string; count: number; gross: number; net: number | null; formwork: number; rebarKg: number; finishKN: number; liveKN: number };
export const ELEMENT_NAMES = { column: "Kolon", beam: "Kiriş", wall: "Perde", slab: "Döşeme" };
export function quantityReport(model: CadModel, junctions: JunctionResult, options: ReportOptions): ReportRow[] {
  const groups = new Map<string, ReportRow>();
  for (const e of model.elements) {
    if (!isSolidElement(e) || !options.types.includes(e.type) || (options.floorId && e.floorId !== options.floorId)) continue;
    const floor = model.floors.find(f => f.id === e.floorId)!, material = model.materials.find(m => m.id === e.materialId)!;
    const labels = { type: ELEMENT_NAMES[e.type], floor: floor.name, "floor-type": `${floor.name} / ${ELEMENT_NAMES[e.type]}`, "type-floor": `${ELEMENT_NAMES[e.type]} / ${floor.name}`, material: material.name, element: `${floor.name} / ${e.name} / ${e.group || "Grupsuz"}` };
    const ids = { type: e.type, floor: e.floorId, "floor-type": JSON.stringify([e.floorId, e.type]), "type-floor": JSON.stringify([e.type, e.floorId]), material: e.materialId, element: e.id };
    const id = ids[options.grouping], key = labels[options.grouping], row = groups.get(id) ?? { id, key, count: 0, gross: 0, net: junctions.status === "resolved" ? 0 : null, formwork: 0, rebarKg: 0, finishKN: 0, liveKN: 0 };
    const q = calculateQuantities({ ...model, elements: [e] }, junctions).rows.find(r => r.type === e.type)!;
    row.count++; row.gross += q.grossVolume; if (row.net !== null) row.net += junctions.byElement[e.id]?.netVolume ?? 0;
    row.formwork += q.formwork; row.rebarKg += e.rebarMass ?? 0;
    if (e.type === "slab") { const area = polygonArea(elementFootprint(e)); row.finishKN += area * (e.finishLoad ?? 0); row.liveKN += area * (e.liveLoad ?? 0); }
    groups.set(id, row);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key, "tr", { numeric: true }));
}
export function reportCsv(rows: ReportRow[]): string {
  const escape = (s: string) => `"${(/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""')}"`;
  const n = (v: number | null) => v === null ? "HESAPLANAMADI" : v.toFixed(6).replace(".", ",");
  return "\uFEFF" + ["Grup;Adet;Brüt m³;Net m³;Brüt kalıp m²;Elle girilen donatı kg;Kaplama kN;Hareketli kN", ...rows.map(r => [escape(r.key), r.count, n(r.gross), n(r.net), n(r.formwork), n(r.rebarKg), n(r.finishKN), n(r.liveKN)].join(";"))].join("\r\n");
}
