"use client";

import React, { useState } from "react";
import {
  ProjectInputsV3,
  StructureKindV3,
  QualityLevelV3,
  SoilClassV3,
  CityKeyV3,
} from "@/lib/calculations/modules/insaat-maliyeti-v3";
import {
  Building2, Home, Factory, HardHat, CheckCircle2,
  ChevronRight, ChevronLeft, MapPin, Layers, Ruler, Zap, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardProps {
  onComplete: (inputs: ProjectInputsV3) => void;
}

const STEPS = [
  { id: 1, label: "Yapı Tipi",   shortLabel: "Yapı",   icon: <Building2 className="h-4 w-4" /> },
  { id: 2, label: "Alanlar",     shortLabel: "Alan",   icon: <Ruler     className="h-4 w-4" /> },
  { id: 3, label: "Konum & Zemin", shortLabel: "Konum", icon: <MapPin  className="h-4 w-4" /> },
  { id: 4, label: "Kalite & Sistem", shortLabel: "Kalite", icon: <Sparkles className="h-4 w-4" /> },
];

const STRUCTURE_KINDS: { id: StructureKindV3; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "apartman",    label: "Apartman / Site",  icon: <Building2 />, desc: "Çok katlı konut, rezidans ve site projeleri" },
  { id: "villa",       label: "Villa / Müstakil",  icon: <Home />,       desc: "Bahçeli, bireysel konut ve müstakil yapılar" },
  { id: "ofis",        label: "Ofis / AVM",        icon: <Layers />,     desc: "Ticari ofis, AVM ve karma kullanımlı yapılar" },
  { id: "endustriyel", label: "Endüstriyel",       icon: <Factory />,    desc: "Fabrika, depo ve sanayi tesisleri" },
];

const CITIES: { id: CityKeyV3; label: string; mult: string }[] = [
  { id: "istanbul",      label: "İstanbul",            mult: "×1.18" },
  { id: "ankara_izmir",  label: "Ankara / İzmir",      mult: "×1.07" },
  { id: "antalya",       label: "Antalya / Kıyı",      mult: "×1.10" },
  { id: "bursa_kocaeli", label: "Bursa / Kocaeli",     mult: "×1.05" },
  { id: "genel",         label: "Genel (Anadolu)",      mult: "×1.00" },
];

const QUALITY_OPTIONS: { id: QualityLevelV3; label: string; range: string; desc: string }[] = [
  { id: "ekonomik", label: "Ekonomik",  range: "9.000–13.000 TL/m²",  desc: "Sosyal konut, uygun malzeme ve standart işçilik" },
  { id: "standart", label: "Standart",  range: "13.000–22.000 TL/m²", desc: "Orta segment, markalaşmış malzeme, deneyimli ekip" },
  { id: "luks",     label: "Lüks",      range: "22.000–45.000+ TL/m²", desc: "İthal/premium malzeme, ödüllü mimari, akıllı ev" },
];

const FACADE_OPTIONS: { id: string; label: string; desc: string }[] = [
  { id: "klasik",       label: "Klasik Sıva",        desc: "Mantolama + dış sıva, yaygın Türkiye standardı" },
  { id: "kompozit",     label: "Kompozit Panel",      desc: "Alüminyum kompozit panel, modern görünüm" },
  { id: "cam_giydirme", label: "Cam Giydirme",        desc: "Full cam cephe, ofis/AVM tipi premium" },
];

export function Wizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState<Partial<ProjectInputsV3>>({
    totalArea:      1000,
    floorCount:     5,
    basementFloors: 1,
    city:           "genel",
    soilClass:      "orta",
    hasElevator:    true,
    elevatorCount:  1,
    facadeType:     "klasik",
  });

  const upd = (key: keyof ProjectInputsV3, value: unknown) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const canGoNext = () => {
    if (step === 1) return !!inputs.structureKind;
    if (step === 2) return !!inputs.totalArea && (inputs.totalArea ?? 0) > 0 && !!inputs.floorCount;
    if (step === 3) return !!inputs.city && !!inputs.soilClass;
    return !!inputs.qualityLevel && !!inputs.facadeType;
  };

  const handleFinish = () => {
    if (canGoNext()) onComplete(inputs as ProjectInputsV3);
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* ── Progress Header ── */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Steps Row */}
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300",
                    step === s.id
                      ? "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/30 dark:border-amber-400 dark:bg-amber-400 dark:text-slate-950"
                      : step > s.id
                      ? "border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950"
                      : "border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                  )}
                >
                  {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                </div>
                <span
                  className={cn(
                    "hidden text-[11px] font-medium sm:block",
                    step === s.id
                      ? "text-amber-600 dark:text-amber-400"
                      : step > s.id
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {s.shortLabel}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-1 flex-1 rounded-full transition-all duration-500",
                    step > s.id
                      ? "bg-emerald-500 dark:bg-emerald-400"
                      : "bg-slate-200 dark:bg-slate-800"
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        {/* Step Description */}
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="text-amber-500">{STEPS[step - 1].icon}</span>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-slate-200">Adım {step}/4 — </span>
            {STEPS[step - 1].label}
          </p>
        </div>
      </div>

      {/* ── Card ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 md:p-8">

        {/* ───── Step 1: Yapı Tipi ───── */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
              Yapı türünü seçin
            </h2>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Hesaplama, yapı türüne özgü beton, demir ve malzeme oranlarıyla yapılacak.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {STRUCTURE_KINDS.map((sk) => (
                <button
                  key={sk.id}
                  onClick={() => upd("structureKind", sk.id)}
                  className={cn(
                    "group flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all hover:shadow-md",
                    inputs.structureKind === sk.id
                      ? "border-amber-500 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-500/10"
                      : "border-slate-200 bg-white hover:border-amber-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-amber-700"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    inputs.structureKind === sk.id
                      ? "bg-amber-500 text-white"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  )}>
                    {React.cloneElement(sk.icon as React.ReactElement<any>, { className: "h-5 w-5" })}
                  </div>
                  <div>
                    <div className={cn(
                      "font-bold",
                      inputs.structureKind === sk.id
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-slate-900 dark:text-slate-100"
                    )}>
                      {sk.label}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sk.desc}</div>
                  </div>
                  {inputs.structureKind === sk.id && (
                    <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-amber-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ───── Step 2: Alanlar ───── */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">Alan ve Kat Bilgileri</h2>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Brüt inşaat alanı = Tüm katların toplam kapalı alanı (bodrum dahil).
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <InputField
                label="Toplam Brüt İnşaat Alanı"
                unit="m²"
                value={inputs.totalArea}
                onChange={(v) => upd("totalArea", v)}
                min={50}
                max={500000}
                hint="Tüm katların toplam kapalı alanı"
              />
              <InputField
                label="Toplam Kat Sayısı"
                unit="kat"
                value={inputs.floorCount}
                onChange={(v) => upd("floorCount", v)}
                min={1}
                max={60}
                hint="Bodrum katlar dahil tüm katlar"
              />
              <InputField
                label="Bodrum Kat Adedi"
                unit="kat"
                value={inputs.basementFloors}
                onChange={(v) => upd("basementFloors", v)}
                min={0}
                max={5}
                hint="Yoksa 0 girin"
              />
            </div>
          </div>
        )}

        {/* ───── Step 3: Konum & Zemin ───── */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">Konum ve Zemin</h2>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Bölgesel işçilik ve malzeme maliyetleri ile zemin tipi, temel maliyetini etkiler.
            </p>

            <div className="mb-6">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <MapPin className="h-4 w-4 text-amber-500" /> Proje İli / Bölgesi
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CITIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => upd("city", c.id)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border-2 px-4 py-3 text-sm transition-all",
                      inputs.city === c.id
                        ? "border-amber-500 bg-amber-50 font-bold text-amber-700 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-400"
                        : "border-slate-200 bg-white text-slate-700 hover:border-amber-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:border-amber-700"
                    )}
                  >
                    <span>{c.label}</span>
                    <span className={cn(
                      "font-mono text-xs",
                      inputs.city === c.id ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
                    )}>
                      {c.mult}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <HardHat className="h-4 w-4 text-amber-500" /> Zemin Durumu
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(["iyi", "orta", "kotu"] as SoilClassV3[]).map((s) => {
                  const meta = { iyi: { label: "İyi Zemin", sub: "×1.00" }, orta: { label: "Orta", sub: "×1.07" }, kotu: { label: "Kötü Zemin", sub: "×1.18" } };
                  return (
                    <button
                      key={s}
                      onClick={() => upd("soilClass", s)}
                      className={cn(
                        "rounded-xl border-2 py-3 text-center text-sm transition-all",
                        inputs.soilClass === s
                          ? "border-amber-500 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-500/10"
                          : "border-slate-200 bg-white hover:border-amber-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-amber-700"
                      )}
                    >
                      <div className={cn("font-bold", inputs.soilClass === s ? "text-amber-700 dark:text-amber-400" : "text-slate-800 dark:text-slate-200")}>
                        {meta[s].label}
                      </div>
                      <div className="mt-0.5 font-mono text-xs text-slate-400">{meta[s].sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ───── Step 4: Kalite & Sistemler ───── */}
        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">Kalite ve Sistemler</h2>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              İşçilik, malzeme kalitesi ve ek sistemler maliyet üzerinde doğrudan etkilidir.
            </p>

            {/* Kalite */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                İşçilik & Malzeme Kalitesi
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {QUALITY_OPTIONS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => upd("qualityLevel", q.id)}
                    className={cn(
                      "rounded-xl border-2 p-4 text-left transition-all",
                      inputs.qualityLevel === q.id
                        ? "border-amber-500 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-500/10"
                        : "border-slate-200 bg-white hover:border-amber-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-amber-700"
                    )}
                  >
                    <div className={cn("font-bold", inputs.qualityLevel === q.id ? "text-amber-700 dark:text-amber-400" : "text-slate-900 dark:text-slate-100")}>
                      {q.label}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-slate-400 dark:text-slate-500">{q.range}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{q.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cephe */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Cephe / Dış Kabuk Sistemi
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {FACADE_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => upd("facadeType", f.id as any)}
                    className={cn(
                      "rounded-xl border-2 p-4 text-left transition-all",
                      inputs.facadeType === f.id
                        ? "border-amber-500 bg-amber-50 dark:border-amber-500/60 dark:bg-amber-500/10"
                        : "border-slate-200 bg-white hover:border-amber-300 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-amber-700"
                    )}
                  >
                    <div className={cn("font-bold", inputs.facadeType === f.id ? "text-amber-700 dark:text-amber-400" : "text-slate-900 dark:text-slate-100")}>
                      {f.label}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Asansör */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Asansör</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Adet başına ~850.000 TL (bölge çarpanı ile)</div>
                </div>
                <button
                  onClick={() => upd("hasElevator", !inputs.hasElevator)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    inputs.hasElevator ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                  )}
                >
                  <span className={cn("inline-block h-4 w-4 translate-x-1 transform rounded-full bg-white shadow transition-transform", inputs.hasElevator && "translate-x-6")} />
                </button>
              </div>
              {inputs.hasElevator && (
                <div className="mt-3">
                  <InputField
                    label="Asansör Adedi"
                    unit="adet"
                    value={inputs.elevatorCount}
                    onChange={(v) => upd("elevatorCount", v)}
                    min={1}
                    max={20}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6 dark:border-slate-800">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" /> Geri
          </button>

          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((s) => (
              <div key={s.id} className={cn(
                "h-2 rounded-full transition-all",
                step === s.id ? "w-6 bg-amber-500" : step > s.id ? "w-2 bg-emerald-400" : "w-2 bg-slate-300 dark:bg-slate-700"
              )} />
            ))}
          </div>

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext()}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-950"
            >
              İleri <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={!canGoNext()}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-950"
            >
              Hesapla <Zap className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
function InputField({
  label, unit, value, onChange, min, max, hint,
}: {
  label: string; unit: string; value?: number;
  onChange: (v: number) => void;
  min?: number; max?: number; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white transition-all focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 dark:border-slate-700 dark:bg-slate-950">
        <input
          type="number"
          min={min}
          max={max}
          value={value ?? ""}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val)) onChange(val);
          }}
          className="flex-1 bg-transparent px-4 py-3 text-slate-900 outline-none dark:text-slate-100"
        />
        <span className="border-l border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {unit}
        </span>
      </div>
    </div>
  );
}
