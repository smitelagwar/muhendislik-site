"use client";

import { useState } from "react";
import { Check, MousePointer2 } from "lucide-react";
import type { CadElement, CadModel, Floor } from "@/lib/hsyncad/model";
import { TYPE_NAMES } from "./editor-state";

export function NumberField({ label, value, onChange, min, step = "any", testId }: { label: string; value: number; onChange: (v: number) => void; min?: number; step?: string; testId?: string }) {
  return <label className="hcad-field"><span>{label}</span><input data-testid={testId} type="number" inputMode="decimal" step={step} min={min} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))} required /></label>;
}

export function ElementProperties({ element, model, onApply, onDelete }: { element: CadElement | undefined; model: CadModel; onApply: (e: CadElement) => void; onDelete: () => void }) {
  if (!element) return <div className="hcad-inspector-empty"><MousePointer2 size={24} /><strong>Bir eleman seçin</strong><p>Planda veya 3B görünümde seçerek boyutlarını, katını ve malzemesini düzenleyin.</p></div>;
  return <ElementForm key={JSON.stringify(element)} element={element} model={model} onApply={onApply} onDelete={onDelete} />;
}

function ElementForm({ element, model, onApply, onDelete }: { element: CadElement; model: CadModel; onApply: (e: CadElement) => void; onDelete: () => void }) {
  const [draft, setDraft] = useState(element);
  const number = (key: "width" | "depth" | "height" | "thickness", label: string) => key in draft ? <NumberField key={key} testId={`property-${key}`} label={label} min={0.01} value={Number((draft as unknown as Record<string, unknown>)[key])} onChange={(value) => setDraft({ ...draft, [key]: value } as CadElement)} /> : null;
  return <form className="hcad-property-form" data-testid="hsyncad-properties" onSubmit={(e) => { e.preventDefault(); onApply(draft); }}>
    <div className="hcad-selected-title"><span>{TYPE_NAMES[element.type]}</span><b>{element.name}</b></div>
    <label className="hcad-field"><span>Eleman adı</span><input value={draft.name} maxLength={60} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required /></label>
    <div className="hcad-fields">{number("width", "Genişlik b (m)")}{number("depth", "Derinlik h (m)")}{number("height", draft.type === "beam" ? "Kesit h (m)" : "Yükseklik (m)")}{number("thickness", "Kalınlık (m)")}</div>
    {draft.type === "column" && <div className="hcad-fields"><NumberField label="Merkez X (m)" value={draft.position.x} onChange={(x) => setDraft({ ...draft, position: { ...draft.position, x } })} /><NumberField label="Merkez Y (m)" value={draft.position.y} onChange={(y) => setDraft({ ...draft, position: { ...draft.position, y } })} /></div>}
    {(draft.type === "beam" || draft.type === "wall" || draft.type === "axis") && <>{(["start", "end"] as const).map((key, i) => <div className="hcad-fields" key={key}><NumberField label={`${i + 1}. nokta X (m)`} value={draft[key].x} onChange={(x) => setDraft({ ...draft, [key]: { ...draft[key], x } })} /><NumberField label={`${i + 1}. nokta Y (m)`} value={draft[key].y} onChange={(y) => setDraft({ ...draft, [key]: { ...draft[key], y } })} /></div>)}</>}
    {draft.type === "slab" && <p className="hcad-fine">{draft.points.length} köşeli kapalı alan. Taşı aracıyla tüm köşeleri birlikte taşıyabilirsiniz.</p>}
    <label className="hcad-field"><span>Kat</span><select value={draft.floorId} onChange={(e) => setDraft({ ...draft, floorId: e.target.value })}>{model.floors.map((f) => <option value={f.id} key={f.id}>{f.name}</option>)}</select></label>
    <label className="hcad-field"><span>Malzeme</span><select value={draft.materialId} onChange={(e) => setDraft({ ...draft, materialId: e.target.value })}>{model.materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
    <p className="hcad-fine">Katman: {draft.layer}</p>
    <button type="submit" className="hcad-primary" data-testid="property-apply"><Check size={15} />Değişiklikleri uygula</button>
    <button type="button" className="hcad-danger" onClick={onDelete}>Seçili elemanı sil</button>
  </form>;
}

export function FloorProperties({ floor, onApply }: { floor: Floor; onApply: (floor: Floor) => void }) {
  const [draft, setDraft] = useState(floor);
  return <form className="hcad-floor-form" onSubmit={(e) => { e.preventDefault(); onApply(draft); }}>
    <label className="hcad-field"><span>Kat adı</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required maxLength={60} /></label>
    <NumberField label="Taban kotu (m)" value={draft.elevation} onChange={(elevation) => setDraft({ ...draft, elevation })} />
    <NumberField label="Kat yüksekliği (m)" min={0.1} value={draft.height} onChange={(height) => setDraft({ ...draft, height })} />
    <button type="submit">Katı güncelle</button>
  </form>;
}
