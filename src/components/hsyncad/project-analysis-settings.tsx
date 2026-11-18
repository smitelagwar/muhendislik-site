"use client";
import { useState, type FormEvent } from "react";
import type { CadModel } from "@/lib/hsyncad/model";
import { migrateStructuralModel } from "@/lib/hsyncad/structural/migration";
import { numericFields, choices, updateProjectSettings, type SettingKey } from "@/lib/hsyncad/structural/project-schema";
import { parseDecimal, pressureToKPa, pressureFromKPa, forcePerVolumeToSI, forcePerVolumeFromSI, type PressureUnit, type ForcePerVolumeUnit } from "@/lib/hsyncad/structural/units";
import {emptyEngineeringReviews,type B3Transfer} from "@/lib/hsyncad/structural/global-control-types";

export default function ProjectAnalysisSettings({ model, onSave }: { model: CadModel; onSave: (model: CadModel) => void }) {
  const [base] = useState(() => migrateStructuralModel(model, crypto.randomUUID()));
  const project = base.structural!;
  const [values, setValues] = useState<Record<string, string>>(() => {
    const baseValues = Object.fromEntries(Object.entries(project.settings).map(([k, v]) => [k, v.value === null ? "" : String(v.value)]));
    const ideSource = model.ideImport?.source;
    const concreteMat = ideSource?.materials?.find(m => m.kind === "concrete");
    const soil = ideSource?.seismicSoil;
    if (!baseValues.concreteGrade && concreteMat) {
      const matched = choices.concreteGrade.find(c => concreteMat.name.includes(c) || (concreteMat.fckMpa && c === `C${Math.round(concreteMat.fckMpa)}`));
      if (matched) baseValues.concreteGrade = matched;
    }
    if (!baseValues.rebarGrade && concreteMat?.fykMpa) {
      const matched = choices.rebarGrade.find(r => r.includes(String(Math.round(concreteMat.fykMpa!))));
      if (matched) baseValues.rebarGrade = matched;
    }
    if (soil) {
      if (!baseValues.sds && soil.sds != null) baseValues.sds = String(soil.sds);
      if (!baseValues.sd1 && soil.sd1 != null) baseValues.sd1 = String(soil.sd1);
      if (!baseValues.r && soil.rEntered != null) baseValues.r = String(soil.rEntered);
      if (!baseValues.importance && soil.importanceI != null) baseValues.importance = String(soil.importanceI);
      if (!baseValues.liveLoadParticipation && soil.liveLoadFactorN != null) baseValues.liveLoadParticipation = String(soil.liveLoadFactorN);
      if (!baseValues.subgrade && soil.subgradeKoTfM3 != null) baseValues.subgrade = (soil.subgradeKoTfM3 * 9.80665).toFixed(1);
      if (!baseValues.qt && soil.bearingCapacityQtTfM2 != null) baseValues.qt = (soil.bearingCapacityQtTfM2 * 9.80665).toFixed(1);
    }
    return baseValues;
  });
  const [unit, setUnit] = useState<PressureUnit>("kPa");
  const [volumeUnit, setVolumeUnit] = useState<ForcePerVolumeUnit>("kN/m3");
  const [error, setError] = useState("");
  const [reviews,setReviews]=useState(()=>structuredClone(project.engineeringReviews??emptyEngineeringReviews()));
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const form = event.currentTarget;
    let key = "";
    try {
      const settings = structuredClone(project.settings);
      for (const k of Object.keys(settings) as SettingKey[]) {
        key = k;
        let value: string | number | null = k in numericFields ? parseDecimal(values[k]) : values[k] || null;
        if ((k === "qt" || k === "allowablePressure") && typeof value === "number") value = pressureToKPa(value, unit);
        if (["dryUnitWeight", "saturatedUnitWeight", "subgrade"].includes(k) && typeof value === "number") value = forcePerVolumeToSI(value, volumeUnit);
        if (value !== project.settings[k].value) settings[k] = { value, source: value === null ? "unknown" : "user_input", evidence: null };
      }
      const structural = updateProjectSettings(project, settings, reviews);
      onSave({ ...base, structural });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Ayarlar kaydedilemedi.";
      setError(message);
      const field = message.split(":")[0];
      const element = form.elements.namedItem(field in project.settings || field.startsWith("review-") ? field : key);
      if (element instanceof HTMLElement) element.focus();
    }
  }
  function changeUnit(next: PressureUnit) {
    try {
      const updated = { ...values };
      for (const key of ["qt", "allowablePressure"]) {
        const value = parseDecimal(values[key]);
        if (value !== null) updated[key] = String(pressureFromKPa(pressureToKPa(value, unit), next));
      }
      setValues(updated); setUnit(next); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Birim değiştirilemedi."); }
  }
  function changeVolumeUnit(next: ForcePerVolumeUnit) {
    try {
      const updated = { ...values };
      for (const key of ["dryUnitWeight", "saturatedUnitWeight", "subgrade"]) {
        const value = parseDecimal(values[key]);
        if (value !== null) updated[key] = String(forcePerVolumeFromSI(forcePerVolumeToSI(value, volumeUnit), next));
      }
      setValues(updated); setVolumeUnit(next); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Birim değiştirilemedi."); }
  }
  return <form onSubmit={save} data-testid="project-analysis-settings" className="hcad-property-form">
    <p>Projeye ait girdiler; boş alanlar bilinmiyor olarak korunur. Etüt PDF yüklemesi gerekmez. Zemin/temel, malzeme ataması ve çözüm tercihleri henüz doğrulanmış hesap motoruna bağlı değildir. Kaydetmek analiz çalıştırmaz; önceki sonucu geçersizleştirir.</p>
    <p>Proje kimliği: {project.projectId} · Ayar revizyonu: {project.revision}</p>
    <label>Basınç giriş birimi<select aria-label="Basınç giriş birimi" value={unit} onChange={e => changeUnit(e.target.value as PressureUnit)}>{["kPa", "MPa", "tf/m2"].map(u => <option key={u}>{u}</option>)}</select></label>
    <label>Kuvvet/hacim giriş birimi<select aria-label="Kuvvet/hacim giriş birimi" value={volumeUnit} onChange={e => changeVolumeUnit(e.target.value as ForcePerVolumeUnit)}>{["kN/m3", "tf/m3"].map(u => <option key={u}>{u}</option>)}</select></label>
    <div className="hcad-fields">{Object.entries(numericFields).map(([key, [label, canonicalUnit]]) => <label className="hcad-field" key={key}>
      <span>{label} ({key === "qt" || key === "allowablePressure" ? unit : ["dryUnitWeight", "saturatedUnitWeight", "subgrade"].includes(key) ? volumeUnit : canonicalUnit})</span>
      <input name={key} data-testid={`setting-${key}`} inputMode="decimal" value={values[key]} onChange={e => setValues({ ...values, [key]: e.target.value })} />
    </label>)}
    {Object.entries(choices).map(([key, options]) => <label className="hcad-field" key={key}><span>{({ concreteGrade: "Beton sınıfı (beyan)", rebarGrade: "Donatı sınıfı (beyan)", soilClass: "TBDY zemin sınıfı", soilBehavior: "Zemin davranış tipi", foundationCriterion: "Temel gerilme kriteri", raftCriterion: "Radye gerilme kriteri", foundationEarthquake: "Temelde deprem yükü", raftEarthquake: "Radyede deprem yükü", foundationNegativeContact: "Temelde negatif temas", raftNegativeContact: "Radyede negatif temas", interaction: "Üst yapı etkileşimi", connection: "Temel bağlantısı", soilMethod: "Zemin modeli", designMode: "Donatı çalışma modu", solverMethod: "Çözüm yöntemi" } as Record<string, string>)[key]}</span>
      <select name={key} data-testid={`setting-${key}`} value={values[key]} onChange={e => setValues({ ...values, [key]: e.target.value })}><option value="">Bilinmiyor</option>{options.map(o => <option key={o} value={o} disabled={o === "coupled_winkler"}>{({cohesive:"Kohezyonlu",cohesionless:"Kohezyonsuz",average:"Ortalama gerilme",maximum:"En büyük gerilme",include:"Dahil",exclude:"Hariç",check:"Kontrol gerekli",unknown:"Bilinmiyor",enabled:"Açık (hesap desteği bekleniyor)",disabled:"Kapalı",straight:"Düz bağlantı",enlarged:"Büyütülmüş bağlantı",winkler:"Winkler (hesap desteği bekleniyor)",coupled_winkler:"Çoklu Eşlenik Winkler — desteklenmiyor",existing_reinforcement:"Mevcut donatıyı doğrula",redesign:"Yeniden tasarla",verified_3d_required:"Doğrulanmış 3B çözüm gerekli"} as Record<string,string>)[o] ?? o}</option>)}</select>
    </label>)}</div>
    <p>R: girilen {project.coefficients.r.entered ?? "bilinmiyor"}, önerilen {project.coefficients.r.recommended ?? "hesaplanmadı"}, kullanılan {project.coefficients.r.used ?? "hesaplanmadı"}. Sistem kararı doğrulanmadan kullanılan katsayı üretilmez.</p>
    <fieldset className="hcad-property-form" data-testid="global-engineering-reviews"><legend>Global kontroller — mühendis değerlendirmesi</legend>
      <p>Boş değerlendirme bilinmiyor kalır. Bu kayıt geometri veya hesapla bulunan düzensizliği kaldırmaz; genel uygunluk onayı değildir.</p>
      {(["A2","A3","B3"] as const).map(id=><fieldset className="hcad-property-form" key={id} data-testid={`review-${id}`}><legend>{id}: {id==="A2"?"Döşeme yük aktarımı / düzlem içi rijitlik":id==="A3"?"Plan çıkıntısı ve aktarım değerlendirmesi":"Düşey taşıyıcı sürekliliği"}</legend>
        <label className="hcad-field">Değerlendirilen koşul<select name={`review-${id}-present`} data-testid={`review-${id}-present`} value={reviews[id].present===null?"unknown":reviews[id].present?"present":"absent"} onChange={e=>setReviews({...reviews,[id]:{...reviews[id],present:e.target.value==="unknown"?null:e.target.value==="present"}})}><option value="unknown">Bilinmiyor / değerlendirilmedi</option><option value="present">Var</option><option value="absent">Yok — gerekçeli değerlendirme</option></select></label>
        <label className="hcad-field">Değerlendiren<input name={`review-${id}-reviewer`} data-testid={`review-${id}-reviewer`} value={reviews[id].reviewer??""} onChange={e=>setReviews({...reviews,[id]:{...reviews[id],reviewer:e.target.value.trim()?e.target.value:null}})} /></label>
        <label className="hcad-field">Gerekçe / kanıt<textarea name={`review-${id}-reason`} data-testid={`review-${id}-reason`} value={reviews[id].reason??""} onChange={e=>setReviews({...reviews,[id]:{...reviews[id],reason:e.target.value.trim()?e.target.value:null}})} /></label>
        {id==="B3"&&<><label className="hcad-field">Aktarım türü<select name="review-B3-transfer" data-testid="review-B3-transfer" value={reviews.B3.transfer??""} onChange={e=>setReviews({...reviews,B3:{...reviews.B3,transfer:e.target.value?e.target.value as B3Transfer:null}})}><option value="">Bilinmiyor</option>{Object.entries({none:"Süreksizlik yok",column_on_cantilever:"Konsol kiriş üstü kolon",column_on_corbel:"Guse üstü kolon",column_on_simple_beam:"İki ucu mesnetli kiriş üstü kolon",wall_on_column:"Kolon üstü perde",wall_on_beam_midspan:"Kiriş açıklığı üstü perde"}).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="hcad-field">Yerel düşey analiz kanıtı<input name="review-B3-vertical" data-testid="review-B3-vertical" value={reviews.B3.verticalAnalysisRef??""} onChange={e=>setReviews({...reviews,B3:{...reviews.B3,verticalAnalysisRef:e.target.value.trim()?e.target.value:null}})} /></label></>}
      </fieldset>)}
    </fieldset>
    {error && <p role="alert">{error}</p>}
    <button type="submit" className="hcad-btn-primary" data-testid="save-project-settings">Ayarları projeye kaydet</button>
  </form>;
}
