"use client";

import { useState } from "react";
import { Check, MousePointer2 } from "lucide-react";
import { isSolidElement, type CadElement, type CadModel, type Floor } from "@/lib/hsyncad/model";
import { elementFootprint, elementVerticalRange, polygonArea } from "@/lib/hsyncad/geometry";
import { TYPE_NAMES } from "./editor-state";
import { NumberField } from "./fields";
import { ExtendedElementSettings } from "./element-settings";
import { effectiveThickness } from "@/lib/hsyncad/definitions";
export { NumberField } from "./fields";

export function ElementProperties({ element, model, onApply, onDelete, creation = false }: { element: CadElement | undefined; model: CadModel; onApply: (e: CadElement) => void; onDelete: () => void; creation?: boolean }) {
  if (!element) return <div className="hcad-inspector-empty"><MousePointer2 size={24} /><strong>Bir eleman seçin</strong><p>Planda veya 3B görünümde seçerek boyutlarını, katını ve malzemesini düzenleyin.</p></div>;
  return <ElementForm key={JSON.stringify(element)} element={element} model={model} onApply={onApply} onDelete={onDelete} creation={creation} />;
}

function ElementForm({ element, model, onApply, onDelete, creation }: { element: CadElement; model: CadModel; onApply: (e: CadElement) => void; onDelete: () => void; creation: boolean }) {
  const [draft, setDraft] = useState(element);
  const floor = model.floors.find((item) => item.id === draft.floorId) ?? model.floors[0];
  const levels = !isSolidElement(draft) ? null : creation && draft.type === "slab" ? [floor.elevation + floor.height + (draft.topOffset ?? 0) - effectiveThickness(draft), floor.elevation + floor.height + (draft.topOffset ?? 0)] : elementVerticalRange(draft, floor);
  const levelText = (value: number) => Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value.toLocaleString("tr-TR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} m` : "—";
  const followsStory = (draft.type === "column" || draft.type === "wall") && draft.heightMode === "story";
  const number = (key: "width" | "depth" | "height" | "thickness", label: string) => key in draft && !(key === "height" && followsStory) && !(draft.type === "column" && ((draft.section === "circle" && key === "depth") || (draft.section === "polygon" && (key === "width" || key === "depth")))) && !(draft.type === "slab" && key === "thickness" && draft.buildUp?.length) ? <NumberField key={key} testId={`property-${key}`} label={draft.type === "column" && draft.section === "circle" && key === "width" ? "Çap b (m)" : label} min={0.01} value={Number((draft as unknown as Record<string, unknown>)[key])} onChange={(value) => setDraft({ ...draft, [key]: value } as CadElement)} /> : null;
  return <form className="hcad-property-form" data-testid="hsyncad-properties" onSubmit={(e) => { e.preventDefault(); onApply(draft.type === "slab" ? { ...draft, thickness: effectiveThickness(draft) } : draft); }}>
    <div className="hcad-selected-title"><span>{TYPE_NAMES[element.type]}</span><b>{element.name}</b></div>
    {draft.type === "column" && draft.section && draft.section !== "rectangle" && <output className="hcad-fine">Kesit alanı: {polygonArea(elementFootprint(draft)).toLocaleString("tr-TR", { maximumFractionDigits: 5 })} m²</output>}
    <label className="hcad-field"><span>{creation ? "Ad öneki" : "Eleman adı"}</span><input value={draft.name} maxLength={60} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required /></label>
    {isSolidElement(draft) && <fieldset className="hcad-property-section"><legend>Kesit ve boyutlar</legend><div className="hcad-fields">{number("width", "Genişlik b (m)")}{number("depth", "Derinlik h (m)")}{number("height", draft.type === "beam" ? "Kesit h (m)" : "Yükseklik (m)")}{number("thickness", "Kalınlık (m)")}</div>{followsStory && <p className="hcad-fine">Yükseklik, kat tavanından alınır.</p>}</fieldset>}
    {draft.type === "column" && <fieldset className="hcad-property-section"><legend>Plan konumu</legend><div className="hcad-fields">{!creation && <><NumberField label="Merkez X (m)" value={draft.position.x} onChange={(x) => setDraft({ ...draft, position: { ...draft.position, x } })} /><NumberField label="Merkez Y (m)" value={draft.position.y} onChange={(y) => setDraft({ ...draft, position: { ...draft.position, y } })} /></>}<NumberField label="Açı (°)" value={draft.rotation ?? 0} onChange={(rotation) => setDraft({ ...draft, rotation })} /></div></fieldset>}
    {!creation && (draft.type === "beam" || draft.type === "wall" || draft.type === "axis" || draft.type === "slabEdge") && <fieldset className="hcad-property-section"><legend>Plan konumu</legend>{(["start", "end"] as const).map((key, i) => <div className="hcad-fields" key={key}><NumberField label={`${i + 1}. nokta X (m)`} value={draft[key].x} onChange={(x) => setDraft({ ...draft, [key]: { ...draft[key], x } })} /><NumberField label={`${i + 1}. nokta Y (m)`} value={draft[key].y} onChange={(y) => setDraft({ ...draft, [key]: { ...draft[key], y } })} /></div>)}</fieldset>}
    {draft.type === "slab" && draft.boundary && <p className="hcad-fine">{draft.boundary.elementIds.length} sınır elemanına bağlıdır. Sınır değişince alan güncellenir. <button type="button" onClick={() => setDraft({ ...draft, boundary: undefined })}>Sınır bağlantısını ayır</button></p>}
    {draft.connections && <p className="hcad-fine">Aks/kolon düğümlerine bağlı. <button type="button" onClick={() => setDraft({ ...draft, connections: undefined })}>Düğüm bağlantısını ayır</button></p>}
    {draft.type === "axis" && (
      <fieldset className="hcad-property-section"><legend>Aks gösterimi</legend><div className="hcad-fields">
        <NumberField label="Uç uzatma (m)" min={0} value={draft.extension ?? 1} onChange={(extension) => setDraft({ ...draft, extension })} />
        <label className="hcad-field">
          <span>Aks başlığı</span>
          <select value={draft.labelSide ?? "both"} onChange={(e) => setDraft({ ...draft, labelSide: e.target.value as "both" | "start" | "end" | "none" })}>
            <option value="both">İki uçta</option>
            <option value="start">Başlangıçta</option>
            <option value="end">Bitişte</option><option value="none">Başlıksız</option>
          </select>
        </label>
      </div></fieldset>
    )}
    {(draft.type === "column" || draft.type === "wall") && (
      <fieldset className="hcad-property-section"><legend>Kotlar</legend><div className="hcad-fields">
        <NumberField label="Alt kot farkı (m)" value={draft.baseOffset ?? 0} onChange={(baseOffset) => setDraft({ ...draft, baseOffset })} />
        <NumberField label="Üst kot farkı (m)" value={draft.topOffset ?? 0} onChange={(topOffset) => setDraft({ ...draft, topOffset })} />
        <label className="hcad-field">
          <span>Yükseklik modu</span>
          <select value={draft.heightMode ?? "fixed"} onChange={(e) => setDraft({ ...draft, heightMode: e.target.value as "fixed" | "story" })}>
            <option value="fixed">Sabit yükseklik</option>
            <option value="story">Kat tavanına bağlı</option>
          </select>
        </label>
      </div></fieldset>
    )}
    {draft.type === "beam" && (
      <fieldset className="hcad-property-section"><legend>Kot ve hizalama</legend><div className="hcad-fields">
        <NumberField label="Kot farkı (m)" value={draft.topOffset ?? 0} onChange={(topOffset) => setDraft({ ...draft, topOffset })} />
        <NumberField label="Sağ / bitiş uç kot farkı (m)" value={draft.endTopOffset ?? draft.topOffset ?? 0} onChange={endTopOffset => setDraft({ ...draft, endTopOffset })} />
        <NumberField label="Kaçıklık ofseti (m)" value={draft.offset ?? 0} onChange={(offset) => setDraft({ ...draft, offset })} />
        <label className="hcad-field">
          <span>Hizalama</span>
          <select value={draft.alignment ?? "center"} onChange={(e) => setDraft({ ...draft, alignment: e.target.value as "center" | "left" | "right" })}>
            <option value="center">Ortalı</option>
            <option value="left">Sol</option>
            <option value="right">Sağ</option>
          </select>
        </label>
      </div></fieldset>
    )}
    {draft.type === "slabEdge" && <fieldset className="hcad-property-section"><legend>Kenar kotu</legend><div className="hcad-fields"><NumberField label="Başlangıç kot farkı (m)" value={draft.topOffset ?? 0} onChange={topOffset => setDraft({ ...draft, topOffset })} /><NumberField label="Bitiş kot farkı (m)" value={draft.endTopOffset ?? draft.topOffset ?? 0} onChange={endTopOffset => setDraft({ ...draft, endTopOffset })} /></div></fieldset>}
    {draft.type === "slab" && (
      <fieldset className="hcad-property-section"><legend>Kot</legend><div className="hcad-fields">
        <NumberField label="Kot farkı (m)" value={draft.topOffset ?? 0} onChange={(topOffset) => setDraft({ ...draft, topOffset })} />
      </div></fieldset>
    )}
    {draft.type === "slab" && <p className="hcad-fine">{creation ? "Kotlar ilk köşe referansındadır. Gerçek kot aralığı çizilen köşeler ve eğimle belirlenir." : `${draft.points.length} köşeli kapalı alan. Taşı aracıyla tüm köşeleri birlikte taşıyabilirsiniz.`}</p>}
    {draft.type === "slab" && draft.boundary && <button type="button" data-testid="detach-slab-boundary" onClick={() => setDraft({ ...draft, boundary: undefined })}>Otomatik çevre bağını ayır</button>}
    {levels && <output className="hcad-level-readout" aria-label="Alt ve üst kot"><span>Alt kot<strong>{levelText(levels[0])}</strong></span><span>Üst kot<strong>{levelText(levels[1])}</strong></span></output>}
    <details className="hcad-advanced-element" open={creation || undefined}><summary>Ayrıntılı eleman ayarları</summary><ExtendedElementSettings draft={draft} onChange={setDraft} /></details>
    <fieldset className="hcad-property-section"><legend>Kat ve malzeme</legend><div className="hcad-fields">
      {!creation && <label className="hcad-field"><span>Kat</span><select value={draft.floorId} onChange={(e) => setDraft({ ...draft, floorId: e.target.value })}>{model.floors.map((f) => <option value={f.id} key={f.id}>{f.name}</option>)}</select></label>}
      <label className="hcad-field"><span>Malzeme</span><select value={draft.materialId} onChange={(e) => setDraft({ ...draft, materialId: e.target.value })}>{model.materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
    </div>{creation && <p className="hcad-fine">Yeni eleman çalışma alanında seçili aktif kata yerleştirilir.</p>}</fieldset>
    <label className="hcad-field"><span>Katman</span><select value={draft.layer} onChange={e => setDraft({ ...draft, layer: e.target.value })}>{[...new Set([draft.layer, ...(model.layers?.map(l => l.name) ?? []), ...model.elements.map(e => e.layer)])].map(name => <option key={name}>{name}</option>)}</select></label>
    <div className="hcad-property-actions"><button type="submit" className="hcad-primary" data-testid="property-apply"><Check size={15} />{creation ? "Varsayılanları uygula" : "Değişiklikleri uygula"}</button>
    {!creation && <button type="button" className="hcad-danger" onClick={onDelete}>Seçili elemanı sil</button>}</div>
  </form>;
}

export function FloorProperties({ floor, onApply }: { floor: Floor; onApply: (floor: Floor) => void }) {
  const [draft, setDraft] = useState(floor);
  return <form className="hcad-floor-form" onSubmit={(e) => { e.preventDefault(); onApply(draft); }}>
    <label className="hcad-field"><span>Kat adı</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required maxLength={60} /></label>
    <NumberField label="Taban kotu (m)" value={draft.elevation} onChange={(elevation) => setDraft({ ...draft, elevation })} />
    <NumberField label="Kat yüksekliği (m)" min={0.1} value={draft.height} onChange={(height) => setDraft({ ...draft, height })} />
    <NumberField label="Mimari kot farkı (m)" value={draft.architecturalOffset ?? 0} onChange={architecturalOffset => setDraft({ ...draft, architecturalOffset })} />
    <button type="submit">Katı güncelle</button>
  </form>;
}
