"use client";

import { useState } from "react";
import { isSolidElement, type AxisElement, type CadElement, type Point } from "@/lib/hsyncad/model";
import { columnOffsets, effectiveThickness } from "@/lib/hsyncad/definitions";
import { NumberField } from "./fields";
import { TYPE_COLORS } from "./editor-state";

const lines = [{ value: "solid", name: "Sürekli" }, { value: "dashed", name: "Kesik" }, { value: "dashdot", name: "Aks çizgisi" }];
export function AxisSettings({ draft, onChange }: { draft: AxisElement; onChange: (e: AxisElement) => void }) {
  return <fieldset className="hcad-property-section"><legend>Ayrıntılı aks ayarları</legend><div className="hcad-fields">
    <label className="hcad-field"><span>Kontur içi renk</span><input type="color" value={draft.color ?? "#91a5b8"} onChange={e => onChange({ ...draft, color: e.target.value })} /></label>
    <label className="hcad-field"><span>Kontur içi çizgi tipi</span><select value={draft.lineStyle ?? "dashdot"} onChange={e => onChange({ ...draft, lineStyle: e.target.value as AxisElement["lineStyle"] })}>{lines.map(l => <option key={l.value} value={l.value}>{l.name}</option>)}</select></label>
    <label className="hcad-field"><span>Ad eki</span><input aria-label="Aks ad eki" value={draft.suffix ?? ""} maxLength={30} onChange={e => onChange({ ...draft, suffix: e.target.value })} /></label>
    <NumberField label="Sol / başlangıç uzatma (m)" value={draft.extensionStart ?? draft.extension ?? 1} onChange={extensionStart => onChange({ ...draft, extensionStart })} />
    <NumberField label="Sağ / bitiş uzatma (m)" value={draft.extensionEnd ?? draft.extension ?? 1} onChange={extensionEnd => onChange({ ...draft, extensionEnd })} />
    <label className="hcad-toggle"><input type="checkbox" aria-label="Tali aks" checked={draft.minor ?? false} onChange={e => onChange({ ...draft, minor: e.target.checked })} />Tali aks (pafta sınıflaması)</label>
    <label className="hcad-toggle"><input type="checkbox" checked={draft.drawInside !== false} onChange={e => onChange({ ...draft, drawInside: e.target.checked })} />Kontur içi çizgi</label>
    <label className="hcad-toggle"><input type="checkbox" checked={draft.drawOutside !== false} onChange={e => onChange({ ...draft, drawOutside: e.target.checked })} />Kontur dışı çizgi</label>
    <label className="hcad-toggle"><input type="checkbox" checked={draft.straighten ?? false} onChange={e => onChange({ ...draft, straighten: e.target.checked })} />Dış uzantıları yatay düzleştir</label>
    <label className="hcad-field"><span>Kontur dışı renk</span><input type="color" value={draft.outsideColor ?? draft.color ?? "#91a5b8"} onChange={e => onChange({ ...draft, outsideColor: e.target.value })} /></label>
    <label className="hcad-field"><span>Kontur dışı çizgi tipi</span><select value={draft.outsideLineStyle ?? "dashdot"} onChange={e => onChange({ ...draft, outsideLineStyle: e.target.value as AxisElement["lineStyle"] })}>{lines.map(l => <option key={l.value} value={l.value}>{l.name}</option>)}</select></label>
  </div></fieldset>;
}

function PolygonInput({ points, onChange }: { points: Point[]; onChange: (p: Point[]) => void }) {
  const [value, setValue] = useState(points.map(p => `${p.x} ${p.y}`).join("\n"));
  return <label className="hcad-field hcad-wide"><span>Yerel kesit köşeleri (m) · her satır X Y</span><textarea aria-label="Poligon kesit köşeleri" rows={5} value={value} onChange={e => {
    setValue(e.target.value);
    const parsed = e.target.value.trim().split(/\n/).map(line => line.trim().split(/[;\s]+/).map(v => Number(v.replace(",", "."))));
    const valid = parsed.length >= 3 && parsed.every(p => p.length === 2 && p.every(Number.isFinite));
    e.target.setCustomValidity(valid ? "" : "En az üç satırda X Y koordinatı girin.");
    if (valid) onChange(parsed.map(([x, y]) => ({ x, y })));
  }} /></label>;
}
export function ExtendedElementSettings({ draft, onChange }: { draft: CadElement; onChange: (e: CadElement) => void }) {
  return <>
    {draft.type === "axis" && <AxisSettings draft={draft} onChange={onChange} />}
    {draft.type === "column" && <fieldset className="hcad-property-section"><legend>Kesit biçimi ve kaçıklık</legend><div className="hcad-fields">
      <label className="hcad-field"><span>Kesit biçimi</span><select aria-label="Kesit biçimi" value={draft.section ?? "rectangle"} onChange={e => onChange({ ...draft, section: e.target.value as "rectangle" | "circle" | "polygon", ...(e.target.value === "circle" ? { circleSegments: draft.circleSegments ?? 40, anchorMode: "center" } : {}), ...(e.target.value === "polygon" && !draft.sectionPoints ? { sectionPoints: [{ x: -0.2, y: -0.2 }, { x: 0.2, y: -0.2 }, { x: 0.2, y: 0.2 }, { x: -0.2, y: 0.2 }], anchorMode: "defined" } : {}) })}><option value="rectangle">Dikdörtgen</option><option value="circle">Daire · b = çap</option><option value="polygon">Poligon kesit</option></select></label>
      <label className="hcad-field"><span>Tutma noktası</span><select aria-label="Özellik kolon tutma noktası" value={draft.anchorMode ?? "defined"} onChange={e => onChange({ ...draft, anchorMode: e.target.value as "defined" | "center" | "edge" | "corner" })}><option value="defined">Tanımlı kaçıklık</option><option value="edge">Sol kenar ortası</option><option value="corner">Sol üst köşe</option><option value="center">Merkez</option></select></label>
      {draft.section === "circle" && <NumberField label="Daire kenar sayısı (10–64, çift)" min={10} step="2" value={draft.circleSegments ?? 32} onChange={circleSegments => onChange({ ...draft, circleSegments })} />}
      {draft.section === "polygon" && <PolygonInput points={draft.sectionPoints ?? []} onChange={sectionPoints => onChange({ ...draft, sectionPoints })} />}
      <NumberField label="Kaçıklık X (m)" value={columnOffsets(draft).x} onChange={offsetX => onChange({ ...draft, offsetY: columnOffsets(draft).y, offsetX, anchorMode: "defined" })} />
      <NumberField label="Kaçıklık Y (m)" value={columnOffsets(draft).y} onChange={offsetY => onChange({ ...draft, offsetX: columnOffsets(draft).x, offsetY, anchorMode: "defined" })} />
      <label className="hcad-toggle"><input type="checkbox" checked={draft.mirrorX ?? false} onChange={e => onChange({ ...draft, mirrorX: e.target.checked })} />Lokal X’e göre simetri</label>
      <NumberField label="Üst uç X ötelenmesi (m)" value={draft.leanX ?? 0} onChange={leanX => onChange({ ...draft, leanX })} />
      <NumberField label="Üst uç Y ötelenmesi (m)" value={draft.leanY ?? 0} onChange={leanY => onChange({ ...draft, leanY })} />
    </div><p className="hcad-fine">Kaçıklıklar döndürülmüş yerel kesit eksenlerinde, üst uç ötelenmeleri global X/Y eksenlerindedir.</p></fieldset>}
    {draft.type === "beam" && <fieldset className="hcad-property-section"><legend>Kiriş eğriliği</legend><div className="hcad-fields"><NumberField label="Kiriş yay orta sehimi (m)" value={draft.curveSagitta ?? 0} onChange={curveSagitta => onChange({ ...draft, curveSagitta })} /><NumberField label="Kiriş yay parça sayısı (2–15)" min={2} step="1" value={draft.curveSegments ?? 12} onChange={curveSegments => onChange({ ...draft, curveSegments })} /></div><p className="hcad-fine">Farklı uç kotlarında üst yüz, başlangıç–bitiş doğrusu boyunca eğimli bir düzlemdir.</p></fieldset>}
    {draft.type === "wall" && <fieldset className="hcad-property-section"><legend>Perde kaçıklığı ve eğrilik</legend><div className="hcad-fields">
      <label className="hcad-field"><span>Perde hizalama</span><select value={draft.alignment ?? "center"} onChange={e => onChange({ ...draft, alignment: e.target.value as "center" | "left" | "right" })}><option value="center">Orta</option><option value="left">Sol kenar</option><option value="right">Sağ kenar</option></select></label>
      <NumberField label="Tanımlı perde kaçıklığı (m)" value={draft.offset ?? 0} onChange={offset => onChange({ ...draft, offset })} />
      <NumberField label="Yay orta sehimi (m)" value={draft.curveSagitta ?? 0} onChange={curveSagitta => onChange({ ...draft, curveSagitta })} />
      <NumberField label="Yay parça sayısı (2–15)" min={2} step="1" value={draft.curveSegments ?? 12} onChange={curveSegments => onChange({ ...draft, curveSegments })} />
    </div><p className="hcad-fine">Sehim 0: düz perde. Pozitif sehim başlangıçtan bitişe bakışta sol taraftadır.</p></fieldset>}
    {draft.type === "slab" && <>
      <fieldset className="hcad-property-section"><legend>Döşeme eğimi ve tarama</legend><div className="hcad-fields">
        <NumberField label="X eğimi (%)" value={draft.slopeX ?? 0} onChange={slopeX => onChange({ ...draft, slopeX })} />
        <NumberField label="Y eğimi (%)" value={draft.slopeY ?? 0} onChange={slopeY => onChange({ ...draft, slopeY })} />
        <NumberField label="Tarama açısı (°)" value={draft.hatchAngle ?? 0} onChange={hatchAngle => onChange({ ...draft, hatchAngle })} />
        <label className="hcad-toggle"><input type="checkbox" checked={draft.referenceVisible ?? false} onChange={e => onChange({ ...draft, referenceVisible: e.target.checked })} />Referans yönünü göster</label>
      </div><p className="hcad-fine">Kot ilk köşede tanımlıdır; kalınlık düşey ölçülür.</p></fieldset>
      <fieldset className="hcad-property-section"><legend>Katmanlı beton döşeme</legend>
        <label className="hcad-toggle"><input type="checkbox" checked={!!draft.buildUp?.length} onChange={e => onChange({ ...draft, buildUp: e.target.checked ? [{ name: "Beton tabakası", thickness: draft.thickness }] : undefined, thickness: effectiveThickness(draft) })} />Kalınlığı katmanlardan hesapla</label>
        {draft.buildUp?.map((layer, i) => <div className="hcad-build-up" key={i}><label className="hcad-field"><span>Katman {i + 1}</span><input aria-label={`Beton katmanı ${i + 1} adı`} value={layer.name} maxLength={160} required onChange={e => onChange({ ...draft, buildUp: draft.buildUp!.map((l, j) => j === i ? { ...l, name: e.target.value } : l) })} /></label><NumberField label={`Katman ${i + 1} kalınlık (m)`} min={0.001} value={layer.thickness} onChange={thickness => onChange({ ...draft, buildUp: draft.buildUp!.map((l, j) => j === i ? { ...l, thickness } : l) })} /><button type="button" aria-label={`Katman ${i + 1} sil`} disabled={draft.buildUp!.length <= 1} onClick={() => onChange({ ...draft, buildUp: draft.buildUp!.filter((_, j) => j !== i) })}>×</button></div>)}
        {!!draft.buildUp?.length && <><button type="button" disabled={draft.buildUp.length >= 12} onClick={() => onChange({ ...draft, buildUp: [...draft.buildUp!, { name: "Beton tabakası", thickness: 0.05 }] })}>Beton katmanı ekle</button><output>Toplam kalınlık: {effectiveThickness(draft).toLocaleString("tr-TR")} m</output></>}
        <p className="hcad-fine">Bu katmanların tamamı beton hacmine dahildir. Kaplama, aşağıda ayrı yük olarak tanımlanır.</p>
      </fieldset>
      <fieldset className="hcad-property-section"><legend>Kaplama ve hareketli yük</legend><label className="hcad-field"><span>Kaplama adı</span><input value={draft.finishName ?? ""} maxLength={160} onChange={e => onChange({ ...draft, finishName: e.target.value })} /></label><div className="hcad-fields"><NumberField label="Kaplama yükü (kN/m²)" min={0} value={draft.finishLoad ?? 0} onChange={finishLoad => onChange({ ...draft, finishLoad })} /><NumberField label="Hareketli yük Q (kN/m²)" min={0} value={draft.liveLoad ?? 0} onChange={liveLoad => onChange({ ...draft, liveLoad })} /></div><p className="hcad-fine">Toplam yükler raporda plan alanı × yük olarak gösterilir.</p></fieldset>
    </>}
    <fieldset className="hcad-property-section"><legend>Grup ve görünüm</legend><div className="hcad-fields">
      <label className="hcad-field"><span>Grup adı</span><input value={draft.group ?? ""} maxLength={160} onChange={e => onChange({ ...draft, group: e.target.value })} /></label>
      {draft.type !== "axis" && <><label className="hcad-field"><span>Eleman rengi</span><input type="color" value={draft.color ?? TYPE_COLORS[draft.type]} onChange={e => onChange({ ...draft, color: e.target.value })} /></label>
      <label className="hcad-field"><span>Çizgi tipi</span><select value={draft.lineStyle ?? "solid"} onChange={e => onChange({ ...draft, lineStyle: e.target.value as CadElement["lineStyle"] })}>{lines.map(l => <option key={l.value} value={l.value}>{l.name}</option>)}</select></label></>}
      {isSolidElement(draft) && <><label className="hcad-toggle"><input type="checkbox" checked={draft.filled !== false} onChange={e => onChange({ ...draft, filled: e.target.checked })} />İçini boya</label><label className="hcad-toggle"><input type="checkbox" checked={draft.hatch ?? false} onChange={e => onChange({ ...draft, hatch: e.target.checked })} />Aktif tarama</label><NumberField label="Tanımlı donatı (kg)" min={0} value={draft.rebarMass ?? 0} onChange={rebarMass => onChange({ ...draft, rebarMass })} /></>}
    </div>{isSolidElement(draft) && <p className="hcad-fine">Donatı miktarı elle girilir; otomatik betonarme tasarımı yapılmaz.</p>}</fieldset>
  </>;
}
