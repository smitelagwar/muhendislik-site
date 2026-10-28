"use client";
import type { SolidElement } from "@/lib/hsyncad/model";
export type DrawingUnit = "m" | "cm";
export type SlabMode = "region" | "polygon" | "edge";
type Dimension = "width" | "depth" | "height" | "thickness";
type Props = {
  definition: SolidElement; unit: DrawingUnit; onDimension: (key: Dimension, value: number) => void;
  onChange: (patch: Partial<SolidElement>) => void; onSettings: () => void;
  angle: number; angleLocked: boolean; onAngle: (angle: number | null) => void; columnRotating: boolean; onConfirm: () => void;
  continuous: boolean; onContinuous: (value: boolean) => void;
  lengthText: string; directionText: string; onLength: (value: string) => void; onDirection: (value: string) => void; onClear: () => void;
  slabMode: SlabMode; onSlabMode: (mode: SlabMode) => void; levels: [number, number] | null;
};
export default function DrawingToolbar(p: Props) {
  const e = p.definition, scale = p.unit === "cm" ? 100 : 1;
  const dimension = (key: Dimension, name: string) => <label className="hcad-draw-field" key={key}><span>{name} ({p.unit})</span><input type="number" step="any" min={0.001 * scale} data-testid={`new-${key}`} data-unit={p.unit} value={Number.isFinite(Number((e as unknown as Record<string, unknown>)[key])) ? +((Number((e as unknown as Record<string, unknown>)[key]) * scale).toFixed(6)) : ""} onChange={event => p.onDimension(key, event.target.value === "" ? NaN : Number(event.target.value) / scale)} /></label>;
  const linear = e.type === "beam" || e.type === "wall" || e.type === "slab" && p.slabMode === "edge";
  return <div className="hcad-drawing-toolbar" data-testid="hsyncad-drawing-toolbar">
    {e.type === "column" && <>
      <div className="hcad-draw-group" role="group" aria-label="Kolon kesiti">{([{ id: "rectangle", name: "Dikdörtgen" }, { id: "circle", name: "Daire" }, { id: "polygon", name: "Poligon" }] as const).map(s => <button type="button" key={s.id} aria-pressed={(e.section ?? "rectangle") === s.id} onClick={() => p.onChange({ section: s.id, ...(s.id === "circle" ? { circleSegments: e.circleSegments ?? 40, anchorMode: "center" } : {}), ...(s.id === "polygon" && !e.sectionPoints ? { sectionPoints: [{ x: -0.2, y: -0.2 }, { x: 0.2, y: -0.2 }, { x: 0.2, y: 0.2 }, { x: -0.2, y: 0.2 }], anchorMode: "defined" } : {}) })}>{s.name}</button>)}</div>
      <label className="hcad-draw-field hcad-draw-wide"><span>Tutma noktası · 1–4</span><select aria-label="Kolon tutma noktası" value={e.anchorMode ?? "defined"} onChange={event => p.onChange({ anchorMode: event.target.value as "defined" | "center" | "edge" | "corner" })}><option value="defined">Tanımlı kaçıklık · 1</option><option value="edge" disabled={!!e.section && e.section !== "rectangle"}>Sol kenar ortası · 2</option><option value="corner" disabled={!!e.section && e.section !== "rectangle"}>Sol üst köşe · 3</option><option value="center">Merkez · 4</option></select></label>
      {(e.section ?? "rectangle") !== "polygon" && dimension("width", e.section === "circle" ? "Çap" : "b")}
      {(e.section ?? "rectangle") === "rectangle" && dimension("depth", "h")}
      <button type="button" aria-pressed={e.mirrorX ?? false} onClick={() => p.onChange({ mirrorX: !e.mirrorX })} title="Space">Simetri X</button>
      <label className="hcad-draw-field"><span>Açı (°)</span><input aria-label="Kolon çizim açısı" type="number" step="any" value={Number.isFinite(p.angle) ? +p.angle.toFixed(2) : ""} onChange={event => p.onAngle(event.target.value === "" ? null : Number(event.target.value))} /></label>
      {p.angleLocked && <button type="button" onClick={() => p.onAngle(null)}>Fareyle döndür</button>}
      {p.columnRotating && <button type="button" className="hcad-primary" data-testid="confirm-column" onClick={p.onConfirm}>Kolonu onayla ↵</button>}
    </>}
    {(e.type === "beam" || e.type === "wall") && <>
      <div className="hcad-draw-group" role="group" aria-label="Eleman kaçıklığı">{([{ id: "left", name: "Sol" }, { id: "center", name: "Orta" }, { id: "right", name: "Sağ" }] as const).map(a => <button type="button" key={a.id} aria-pressed={(e.alignment ?? "center") === a.id} title="Space ile değiştir" onClick={() => p.onChange({ alignment: a.id })}>{a.name}</button>)}</div>
      {e.type === "beam" ? <>{dimension("width", "b")}{dimension("height", "h")}</> : dimension("thickness", "Kalınlık")}
    </>}
    {e.type === "slab" && <>
      <div className="hcad-draw-group" role="group" aria-label="Döşeme çizim yöntemi">{([{ id: "region", name: "Kapalı alan" }, { id: "polygon", name: "Köşelerle çiz" }, { id: "edge", name: "Döşeme kenarı" }] as const).map(m => <button type="button" key={m.id} data-testid={`slab-mode-${m.id}`} aria-pressed={p.slabMode === m.id} onClick={() => p.onSlabMode(m.id)}>{m.name}</button>)}</div>
      {p.slabMode !== "edge" && (e.buildUp?.length ? <span className="hcad-fine">Katman kalınlığı: {e.buildUp.reduce((s, l) => s + l.thickness, 0) * scale} {p.unit}</span> : dimension("thickness", "Kalınlık"))}
    </>}
    {linear && <>
      <label className="hcad-toggle"><input data-testid="continuous-toggle" type="checkbox" checked={p.continuous} onChange={event => p.onContinuous(event.target.checked)} />Sürekli çiz</label>
      <label className="hcad-draw-field"><span>Uzunluk ({p.unit})</span><input aria-label="Çizim uzunluğu" inputMode="decimal" placeholder="Serbest" value={p.lengthText} onChange={event => p.onLength(event.target.value)} /></label>
      <label className="hcad-draw-field"><span>Yön (°)</span><input aria-label="Çizim yönü" inputMode="decimal" placeholder="Fare / Shift" value={p.directionText} onChange={event => p.onDirection(event.target.value)} /></label>
      {(p.lengthText || p.directionText) && <button type="button" onClick={p.onClear}>Kilidi kaldır</button>}
    </>}
    <button type="button" data-testid="hsyncad-new-settings" onClick={p.onSettings}>Ayarlar</button>
    {p.levels && !(e.type === "slab" && p.slabMode === "edge") && <output className="hcad-draw-levels" aria-label="Çizim kotları">Alt {p.levels[0].toLocaleString("tr-TR", { maximumFractionDigits: 3 })} / Üst {p.levels[1].toLocaleString("tr-TR", { maximumFractionDigits: 3 })} m</output>}
  </div>;
}
