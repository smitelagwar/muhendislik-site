"use client";

import { useState } from "react";
import type { CadModel, Floor } from "@/lib/hsyncad/model";
import { DEFAULT_LAYERS, DEFAULT_SNAP, layerState, setLayerState } from "@/lib/hsyncad/definitions";
import { NumberField } from "./fields";

type Props = { model: CadModel; onApply: (m: CadModel, message: string) => boolean };
export function SnapOptions({ model, onApply }: Props) {
  const [draft, setDraft] = useState(model.snap ?? DEFAULT_SNAP);
  return <form className="hcad-property-form" onSubmit={e => { e.preventDefault(); onApply({ ...model, snap: draft }, "Yakalama ayarları kaydedildi."); }}>
    <fieldset className="hcad-property-section"><legend>Nokta yakalama türleri</legend>{([{ key: "intersection", label: "Aks kesişimi" }, { key: "endpoint", label: "Uç noktası" }, { key: "midpoint", label: "Orta nokta" }, { key: "grid", label: "Izgaraya kilitlen" }, { key: "showNodes", label: "Düğüm noktalarını göster" }] as const).map(({ key, label }) => <label className="hcad-toggle" key={key}><input type="checkbox" checked={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.checked })} />{label}</label>)}</fieldset>
    <div className="hcad-fields"><NumberField label="Yakalama uzaklığı (piksel)" min={1} value={draft.tolerancePx} onChange={tolerancePx => setDraft({ ...draft, tolerancePx })} /><NumberField label="Seçme uzaklığı (piksel)" min={1} value={draft.selectionPx} onChange={selectionPx => setDraft({ ...draft, selectionPx })} /><NumberField label="Düğüm yarıçapı (piksel)" min={1} value={draft.nodeRadius} onChange={nodeRadius => setDraft({ ...draft, nodeRadius })} /></div>
    <p className="hcad-fine">Öncelik: kesişim → uç → orta → ızgara. Piksel toleransı yakınlaştırmadan bağımsızdır. Aks kesişimleri destek doğruları üzerinde hesaplanır.</p><button type="submit">Yakalama ayarlarını uygula</button>
  </form>;
}
export function LayerOptions({ model, floor, onApply }: Props & { floor: Floor }) {
  const [scope, setScope] = useState<"floor" | "all">("floor"), [name, setName] = useState("");
  const layers = [...new Set([...DEFAULT_LAYERS, ...(model.layers?.map(l => l.name) ?? []), ...model.elements.map(e => e.layer)])];
  return <div className="hcad-property-form">
    <label className="hcad-field"><span>Uygulama kapsamı</span><select value={scope} onChange={e => setScope(e.target.value as "floor" | "all")}><option value="floor">Yalnız aktif kat · {floor.name}</option><option value="all">Tüm katlara ve yeni katlara uygula</option></select></label>
    <div className="hcad-settings-table"><table><thead><tr><th>Katman</th><th>Görünür</th><th>Kilitli</th><th>Renk · tüm katlar</th></tr></thead><tbody>{layers.map(layer => {
      const state = layerState(model, layer, floor.id);
      return <tr key={layer}><td>{layer}</td><td><input aria-label={`${layer} görünür`} type="checkbox" checked={state.visible} onChange={e => onApply(setLayerState(model, layer, { ...state, visible: e.target.checked }, scope, floor.id), `${layer} görünürlüğü güncellendi.`)} /></td><td><input aria-label={`${layer} kilitli`} type="checkbox" checked={state.locked} onChange={e => onApply(setLayerState(model, layer, { ...state, locked: e.target.checked }, scope, floor.id), `${layer} kilidi güncellendi.`)} /></td><td><input type="color" aria-label={`${layer} katman rengi`} value={model.layers?.find(l => l.name === layer)?.color ?? "#91a5b8"} onChange={e => { const all = setLayerState(model, layer, state, "floor", floor.id); onApply({ ...all, layers: all.layers!.map(l => l.name === layer ? { ...l, color: e.target.value } : l) }, "Katman rengi güncellendi."); }} /></td></tr>;
    })}</tbody></table></div>
    <div className="hcad-settings-actions">{([{ visible: true, locked: false, label: "Hepsini aç / çöz" }, { visible: false, locked: false, label: "Hepsini gizle" }, { visible: true, locked: true, label: "Hepsini kilitle" }]).map(({ label, ...state }) => <button type="button" key={label} onClick={() => onApply(layers.reduce((m, l) => setLayerState(m, l, state, scope, floor.id), model), label)}>{label}</button>)}</div>
    <form className="hcad-settings-actions" onSubmit={e => { e.preventDefault(); const value = name.trim(); if (value && !layers.includes(value) && onApply({ ...model, layers: [...(model.layers ?? DEFAULT_LAYERS.map(name => ({ name, visible: true, locked: false }))), { name: value, visible: true, locked: false }] }, "Katman eklendi.")) setName(""); }}><label className="hcad-field"><span>Yeni katman adı</span><input value={name} onChange={e => setName(e.target.value)} required maxLength={160} /></label><button type="submit">Katman ekle</button></form>
    <p className="hcad-fine">Kilitli katmandaki elemanlar görünür, seçilemez ve düzenlenemez. Gizli/kilitli elemanlar metraja dahildir. Kapsam ayarları JSON ile saklanır.</p>
  </div>;
}
export function MaterialOptions({ model, onApply }: Props) {
  const [name, setName] = useState("");
  return <div className="hcad-property-form"><p className="hcad-fine">Malzeme tanımları elemanlara atanır ve metraj raporu malzemeye göre gruplanabilir. Bu katalogda mekanik dayanım hesabı yapılmaz.</p>{model.materials.map(m => <MaterialRow key={m.id + m.name} id={m.id} name={m.name} count={model.elements.filter(e => e.materialId === m.id).length} model={model} onApply={onApply} />)}<form className="hcad-settings-actions" onSubmit={e => { e.preventDefault(); const value = name.trim(); if (value && onApply({ ...model, materials: [...model.materials, { id: crypto.randomUUID(), name: value }] }, "Malzeme eklendi.")) setName(""); }}><label className="hcad-field"><span>Yeni malzeme adı</span><input value={name} onChange={e => setName(e.target.value)} required maxLength={160} /></label><button type="submit">Malzeme ekle</button></form></div>;
}
function MaterialRow({ id, name, count, model, onApply }: Props & { id: string; name: string; count: number }) {
  const [value, setValue] = useState(name);
  return <form className="hcad-settings-actions" onSubmit={e => { e.preventDefault(); onApply({ ...model, materials: model.materials.map(m => m.id === id ? { ...m, name: value } : m) }, "Malzeme güncellendi."); }}><label className="hcad-field"><span>{count} elemanda kullanılıyor</span><input aria-label={`${name} malzeme adı`} value={value} required maxLength={160} onChange={e => setValue(e.target.value)} /></label><button type="submit">Güncelle</button><button type="button" disabled={count > 0 || model.materials.length < 2} onClick={() => onApply({ ...model, materials: model.materials.filter(m => m.id !== id) }, "Malzeme silindi.")}>Sil</button></form>;
}
