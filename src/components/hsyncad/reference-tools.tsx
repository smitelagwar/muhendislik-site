"use client";
import { Crosshair, DraftingCompass, MapPin, MoveHorizontal, Ruler, Scan, SquareDashed, X } from "lucide-react";
import { DRAFTING_NAMES, draftingSummary, type DraftingItem, type DraftingTool } from "@/lib/hsyncad/drafting";
import type { Point } from "@/lib/hsyncad/model";
import type { Tool } from "./editor-state";

export const REFERENCE_TOOLS = [
  { id: "measureDistance", Icon: Ruler }, { id: "measureAngle", Icon: DraftingCompass },
  { id: "measureArea", Icon: Scan }, { id: "referenceLine", Icon: SquareDashed }, { id: "referencePoint", Icon: MapPin },
] as const;
export type ReferenceSource = { id: string; name: string; a: Point; b: Point };
export function ReferenceButtons({ tool, onTool, compact = false }: { tool: Tool; compact?: boolean; onTool: (t: DraftingTool) => void }) {
  return <div className="hcad-reference-buttons" role="group" aria-label="Ölçüm ve referans araçları">{REFERENCE_TOOLS.map(({ id, Icon }) => <button type="button" key={id} data-testid={`${compact ? "quick" : "tool"}-${id}`} title={DRAFTING_NAMES[id]} aria-label={DRAFTING_NAMES[id]} className={tool === id ? "active" : ""} aria-pressed={tool === id} onClick={() => onTool(id)}><Icon size={17} /><span>{DRAFTING_NAMES[id]}</span></button>)}</div>;
}
export function ReferenceOptions(p: { sources: ReferenceSource[]; sourceId: string; onSource: (id: string) => void; onDirection: (perpendicular: boolean) => void; onLocal: () => void; onGlobal: () => void; hasFrame: boolean }) {
  return <div className="hcad-reference-options"><label><span>Referans</span><select aria-label="Referans doğrusu" value={p.sourceId} onChange={e => p.onSource(e.target.value)}><option value="">Doğru seçin</option>{p.sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button type="button" disabled={!p.sourceId} title="Referans doğrusuna paralel çiz" onClick={() => p.onDirection(false)}><MoveHorizontal size={15} />Paralel</button><button type="button" disabled={!p.sourceId} title="Referans doğrusuna dik çiz" onClick={() => p.onDirection(true)}><Crosshair size={15} />Dik</button><button type="button" disabled={!p.sourceId} onClick={p.onLocal}>Lokal sistem yap</button><button type="button" disabled={!p.hasFrame} onClick={p.onGlobal}>Global sistem</button></div>;
}
export function ReferenceRecords(p: { items: DraftingItem[]; unit: "m" | "cm"; onDelete: (id: string) => void; onSource: (id: string) => void }) {
  if (!p.items.length) return null;
  return <details className="hcad-reference-records" open><summary>Ölçümler / Referanslar ({p.items.length})</summary>{!p.items.length && <p className="hcad-fine">Uzaklık için iki nokta; açı için kol–tepe–kol; alan için kapalı poligon seçin.</p>}{p.items.map(item => <div key={item.id} data-testid="reference-record"><button type="button" onClick={() => p.onSource(item.id)} title="Referans olarak seç"><b>{item.name}</b><span>{draftingSummary(item, p.unit)}</span></button><button type="button" onClick={() => p.onDelete(item.id)} aria-label={`${item.name} kaydını sil`}><X size={13} /></button></div>)}<p className="hcad-fine">Ölçümler seçilen sabit koordinatları saklar; elemanlara bağlı ölçülendirme değildir. Beton / kalıp metrajına girmez.</p></details>;
}
