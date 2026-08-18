"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
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
  Share2, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardProps {
  onComplete: (inputs: ProjectInputsV3) => void;
}

type WizardIcon = React.ReactElement<{ className?: string }>;
type FacadeTypeV3 = ProjectInputsV3["facadeType"];

const NUMBER_LIMITS = {
  totalArea: { min: 50, max: 500000, label: "Toplam brüt inşaat alanı" },
  floorCount: { min: 1, max: 60, label: "Toplam kat sayısı" },
  basementFloors: { min: 0, max: 5, label: "Bodrum kat adedi" },
  elevatorCount: { min: 1, max: 20, label: "Asansör adedi" },
};

function parseInitialAreaParam(value: string | null): number {
  if (!value) {
    return 1000;
  }

  const parsed = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(parsed)) {
    return 1000;
  }

  return Math.min(NUMBER_LIMITS.totalArea.max, Math.max(NUMBER_LIMITS.totalArea.min, parsed));
}

function getNumberError(
  value: number | undefined,
  label: string,
  min: number,
  max: number
): string | null {
  if (value === undefined || Number.isNaN(value)) {
    return `${label} boş bırakılamaz.`;
  }

  if (!Number.isFinite(value)) {
    return `${label} geçerli bir sayı olmalıdır.`;
  }

  if (value < min) {
    return `${label} en az ${min.toLocaleString("tr-TR")} olmalıdır.`;
  }

  if (value > max) {
    return `${label} en fazla ${max.toLocaleString("tr-TR")} olmalıdır.`;
  }

  return null;
}

const STEPS = [
  { id: 1, label: "Yapı Tipi",   shortLabel: "Yapı",   icon: <Building2 className="h-4 w-4" /> },
  { id: 2, label: "Alanlar",     shortLabel: "Alan",   icon: <Ruler     className="h-4 w-4" /> },
  { id: 3, label: "Konum & Zemin", shortLabel: "Konum", icon: <MapPin  className="h-4 w-4" /> },
  { id: 4, label: "Kalite & Sistem", shortLabel: "Kalite", icon: <Sparkles className="h-4 w-4" /> },
];

const STRUCTURE_KINDS: { id: StructureKindV3; label: string; icon: WizardIcon; desc: string }[] = [
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

const FACADE_OPTIONS: { id: FacadeTypeV3; label: string; desc: string }[] = [
  { id: "klasik",       label: "Klasik Sıva",        desc: "Mantolama + dış sıva, yaygın Türkiye standardı" },
  { id: "kompozit",     label: "Kompozit Panel",      desc: "Alüminyum kompozit panel, modern görünüm" },
  { id: "cam_giydirme", label: "Cam Giydirme",        desc: "Full cam cephe, ofis/AVM tipi premium" },
];

export function Wizard({ onComplete }: WizardProps) {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [inputs, setInputs] = useState<Partial<ProjectInputsV3>>(() => {
    const parseNum = (key: string, def: number) => {
      const val = searchParams.get(key);
      if (!val) return def;
      const parsed = Number.parseInt(val, 10);
      return Number.isNaN(parsed) ? def : parsed;
    };

    const structureKind = (searchParams.get("tip") as StructureKindV3) || undefined;
    const totalArea = parseInitialAreaParam(searchParams.get("alan"));
    const floorCount = parseNum("kat", 5);
    const basementFloors = parseNum("bodrum", 1);
    const city = (searchParams.get("sehir") as CityKeyV3) || "genel";
    const soilClass = (searchParams.get("zemin") as SoilClassV3) || "orta";
    const qualityLevel = (searchParams.get("kalite") as QualityLevelV3) || undefined;
    const facadeType = (searchParams.get("cephe") as FacadeTypeV3) || "klasik";
    const hasElevator = searchParams.get("asansor") === null ? true : searchParams.get("asansor") === "1";
    const elevatorCount = parseNum("asansor_adet", 1);

    return {
      structureKind,
      totalArea,
      floorCount,
      basementFloors,
      city,
      soilClass,
      qualityLevel,
      facadeType,
      hasElevator,
      elevatorCount,
    };
  });

  const handleCopyLink = async () => {
    try {
      const params = new URLSearchParams();
      if (inputs.structureKind) params.set("tip", inputs.structureKind);
      if (inputs.totalArea) params.set("alan", inputs.totalArea.toString());
      if (inputs.floorCount) params.set("kat", inputs.floorCount.toString());
      if (inputs.basementFloors !== undefined) params.set("bodrum", inputs.basementFloors.toString());
      if (inputs.city) params.set("sehir", inputs.city);
      if (inputs.soilClass) params.set("zemin", inputs.soilClass);
      if (inputs.qualityLevel) params.set("kalite", inputs.qualityLevel);
      if (inputs.facadeType) params.set("cephe", inputs.facadeType);
      params.set("asansor", inputs.hasElevator ? "1" : "0");
      if (inputs.elevatorCount) params.set("asansor_adet", inputs.elevatorCount.toString());

      const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Link kopyalanamadı:", err);
    }
  };

  const upd = (key: keyof ProjectInputsV3, value: unknown) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const totalAreaError = getNumberError(
    inputs.totalArea,
    NUMBER_LIMITS.totalArea.label,
    NUMBER_LIMITS.totalArea.min,
    NUMBER_LIMITS.totalArea.max
  );
  const floorCountError = getNumberError(
    inputs.floorCount,
    NUMBER_LIMITS.floorCount.label,
    NUMBER_LIMITS.floorCount.min,
    NUMBER_LIMITS.floorCount.max
  );
  const basementRangeError = getNumberError(
    inputs.basementFloors,
    NUMBER_LIMITS.basementFloors.label,
    NUMBER_LIMITS.basementFloors.min,
    NUMBER_LIMITS.basementFloors.max
  );
  const basementFloorsError =
    basementRangeError ??
    (inputs.basementFloors !== undefined &&
    inputs.floorCount !== undefined &&
    inputs.basementFloors > inputs.floorCount
      ? "Bodrum kat adedi toplam kat sayısından büyük olamaz."
      : null);
  const elevatorCountError = inputs.hasElevator
    ? getNumberError(
        inputs.elevatorCount,
        NUMBER_LIMITS.elevatorCount.label,
        NUMBER_LIMITS.elevatorCount.min,
        NUMBER_LIMITS.elevatorCount.max
      )
    : null;

  const canGoNext = () => {
    if (step === 1) return !!inputs.structureKind;
    if (step === 2) return !totalAreaError && !floorCountError && !basementFloorsError;
    if (step === 3) return !!inputs.city && !!inputs.soilClass;
    return !!inputs.qualityLevel && !!inputs.facadeType && !elevatorCountError;
  };

  const handleFinish = () => {
    if (!canGoNext()) {
      return;
    }

    onComplete({
      structureKind: inputs.structureKind ?? "apartman",
      totalArea: inputs.totalArea ?? 1000,
      floorCount: inputs.floorCount ?? 5,
      basementFloors: inputs.basementFloors ?? 0,
      qualityLevel: inputs.qualityLevel ?? "standart",
      soilClass: inputs.soilClass ?? "orta",
      city: inputs.city ?? "genel",
      hasElevator: inputs.hasElevator ?? false,
      elevatorCount: inputs.hasElevator ? inputs.elevatorCount ?? 1 : 0,
      facadeType: inputs.facadeType ?? "klasik",
    });
  };

  return (
    <div data-testid="construction-wizard" className="mx-auto w-full max-w-3xl">
      {/* ── NeuroBank Progress Header ── */}
      <div className="mb-6 rounded-3xl border border-border/80 bg-card/90 p-5 sm:p-6 shadow-sm backdrop-blur-2xl dark:border-blue-500/20 dark:bg-[#090d26]/85 dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        {/* Steps Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (s.id < step) setStep(s.id);
                    }}
                    disabled={s.id >= step}
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300",
                      step === s.id
                        ? "border-blue-500 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        : step > s.id
                        ? "cursor-pointer border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 hover:ring-2 hover:ring-emerald-500/40"
                        : "border-border/80 bg-muted/60 text-muted-foreground dark:border-white/10 dark:bg-[#0c1233] dark:text-slate-500"
                    )}
                  >
                    {step > s.id ? <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> : s.id}
                  </button>
                  <span
                    className={cn(
                      "hidden text-[11px] font-bold uppercase tracking-wider sm:block",
                      step === s.id
                        ? "text-blue-600 dark:text-blue-300"
                        : step > s.id
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground dark:text-slate-500"
                    )}
                  >
                    {s.shortLabel}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "mx-2.5 h-1 flex-1 rounded-full transition-all duration-500",
                      step > s.id
                        ? "bg-gradient-to-r from-emerald-500 to-blue-500"
                        : "bg-muted dark:bg-white/10"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          <button
            type="button"
            data-testid="construction-copy-link-button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-muted/50 px-3.5 py-2 text-xs font-bold text-foreground shadow-xs transition-all hover:border-blue-500/40 hover:bg-card hover:text-blue-600 dark:border-white/10 dark:bg-[#0d1230] dark:text-slate-300 dark:hover:bg-[#131942] dark:hover:text-white sm:self-center"
            title="Mevcut ayarları paylaşmak için bağlantıyı kopyala"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Kopyalandı</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                <span>Bağlantıyı Kopyala</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── NeuroBank Step Content Container ── */}
      <div className="rounded-[32px] border border-border/80 bg-card/90 p-6 sm:p-8 shadow-[0_15px_45px_rgba(0,0,0,0.06)] backdrop-blur-2xl dark:border-blue-500/20 dark:bg-[#090d26]/85 dark:shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
        {/* ───── Step 1: Yapı Tipi ───── */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h2 className="text-2xl font-black text-foreground dark:text-white">Yapı Türünü Seçin</h2>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Adım 1 / 4</span>
            </div>
            <p className="mb-6 text-sm text-muted-foreground dark:text-slate-300">
              Hesaplama, seçilen yapı türünün betonarme taşıyıcı, mimari ve mekanik oranlarıyla simüle edilir.
            </p>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {STRUCTURE_KINDS.map((item) => (
                <button
                  key={item.id}
                  data-testid={`construction-structure-${item.id}`}
                  onClick={() => upd("structureKind", item.id)}
                  className={cn(
                    "group flex items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-200",
                    inputs.structureKind === item.id
                      ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:bg-blue-500/15 dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                      : "border-border/80 bg-muted/40 hover:border-blue-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070b20] dark:hover:bg-[#0c1236]"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors",
                      inputs.structureKind === item.id
                        ? "border-blue-400/50 bg-blue-500/20 text-blue-600 dark:text-blue-300"
                        : "border-border/80 bg-card text-muted-foreground group-hover:text-blue-500 dark:border-white/10 dark:bg-[#0c1233] dark:text-slate-400 dark:group-hover:text-blue-300"
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "font-bold text-sm flex items-center justify-between",
                        inputs.structureKind === item.id ? "text-foreground dark:text-white" : "text-foreground/90 dark:text-slate-200"
                      )}
                    >
                      <span>{item.label}</span>
                      {inputs.structureKind === item.id && (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 border border-blue-400/30 dark:bg-blue-500/20 dark:text-blue-300">
                          Seçildi
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                      {item.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ───── Step 2: Alanlar & Katlar ───── */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h2 className="text-2xl font-black text-foreground dark:text-white">Alan ve Kat Bilgileri</h2>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Adım 2 / 4</span>
            </div>
            <p className="mb-6 text-sm text-muted-foreground dark:text-slate-300">
              Toplam kapalı inşaat alanı ve kat dağılımı malzeme metrajlarını ve şantiye takvimini belirler.
            </p>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <InputField
                  id="construction-total-area"
                  testId="construction-total-area-input"
                  label="Toplam Brüt İnşaat Alanı"
                  unit="m²"
                  value={inputs.totalArea}
                  onChange={(v) => upd("totalArea", v)}
                  min={NUMBER_LIMITS.totalArea.min}
                  max={NUMBER_LIMITS.totalArea.max}
                  hint="Tüm katlar dahil toplam kapalı inşaat alanı"
                  error={totalAreaError}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField
                    id="construction-floor-count"
                    testId="construction-floor-count-input"
                    label="Toplam Kat Sayısı"
                    unit="kat"
                    value={inputs.floorCount}
                    onChange={(v) => upd("floorCount", v)}
                    min={NUMBER_LIMITS.floorCount.min}
                    max={NUMBER_LIMITS.floorCount.max}
                    hint="Zemin + normal + bodrum katlar toplamı"
                    error={floorCountError}
                  />

                  <InputField
                    id="construction-basement-floors"
                    testId="construction-basement-floors-input"
                    label="Bodrum Kat Adedi"
                    unit="kat"
                    value={inputs.basementFloors}
                    onChange={(v) => upd("basementFloors", v)}
                    min={NUMBER_LIMITS.basementFloors.min}
                    max={NUMBER_LIMITS.basementFloors.max}
                    hint="Bodrum perdeleri kaba maliyeti artırır"
                    error={basementFloorsError}
                  />
                </div>
              </div>

              {/* Real-time Geometry & Logistics Preview Card */}
              <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-indigo-50/80 to-blue-50/60 p-4 text-foreground flex flex-col justify-between dark:border-blue-500/20 dark:bg-gradient-to-br dark:from-[#0c1236] dark:to-[#070b24] dark:text-white">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">
                    ÖN GEOMETRİ & ŞANTİYE TAHMİNİ
                  </p>
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-2.5 text-xs dark:border-white/5 dark:bg-[#070a20]">
                      <span className="text-muted-foreground dark:text-slate-400">Kat Başına Oturum:</span>
                      <span className="font-mono font-bold text-foreground dark:text-white">
                        ~{inputs.totalArea && inputs.floorCount ? Math.round(inputs.totalArea / inputs.floorCount) : 0} m²
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-2.5 text-xs dark:border-white/5 dark:bg-[#070a20]">
                      <span className="text-muted-foreground dark:text-slate-400">Tahmini Şantiye Süresi:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-300">
                        ~{inputs.floorCount ? Math.max(6, Math.min(36, Math.round(inputs.floorCount * 2.2))) : 12} Ay
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-2.5 text-xs dark:border-white/5 dark:bg-[#070a20]">
                      <span className="text-muted-foreground dark:text-slate-400">Tahmini Beton Hacmi:</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-300">
                        ~{inputs.totalArea ? Math.round(inputs.totalArea * 0.38) : 0} m³
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground dark:text-slate-400">
                  *Değerler girilen alana göre anlık simüle edilir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ───── Step 3: Konum & Zemin ───── */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-400">
            <h2 className="mb-2 text-2xl font-black text-foreground dark:text-white">Konum ve Zemin Durumu</h2>
            <p className="mb-6 text-sm text-muted-foreground dark:text-slate-300">
              Bölgesel işçilik/nakliye endeksleri ve zemin özellikleri temel maliyetini doğrudan etkiler.
            </p>

            {/* Şehir Seçimi */}
            <div className="mb-6">
              <label className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-300">
                <MapPin className="h-4 w-4 text-blue-500 dark:text-blue-400" /> Proje Konumu / Şehir
              </label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {CITIES.map((c) => (
                  <button
                    key={c.id}
                    data-testid={`construction-city-${c.id}`}
                    onClick={() => upd("city", c.id)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      inputs.city === c.id
                        ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)] dark:bg-blue-500/15 dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        : "border-border/80 bg-muted/40 hover:border-blue-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070b20] dark:hover:bg-[#0c1236]"
                    )}
                  >
                    <div
                      className={cn(
                        "font-bold text-xs",
                        inputs.city === c.id ? "text-foreground dark:text-white" : "text-foreground/90 dark:text-slate-200"
                      )}
                    >
                      {c.label}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">{c.mult}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Zemin Seçimi */}
            <div>
              <label className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-300">
                <HardHat className="h-4 w-4 text-purple-500 dark:text-purple-400" /> Zemin Durumu
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(["iyi", "orta", "kotu"] as SoilClassV3[]).map((s) => {
                  const meta = {
                    iyi: { label: "İyi Zemin", sub: "×1.00" },
                    orta: { label: "Orta Zemin", sub: "×1.07" },
                    kotu: { label: "Kötü Zemin", sub: "×1.18" },
                  };
                  return (
                    <button
                      key={s}
                      data-testid={`construction-soil-${s}`}
                      onClick={() => upd("soilClass", s)}
                      className={cn(
                        "rounded-xl border py-3 text-center text-xs transition-all",
                        inputs.soilClass === s
                          ? "border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(139,92,246,0.15)] dark:bg-purple-500/15 dark:shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                          : "border-border/80 bg-muted/40 hover:border-purple-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070b20] dark:hover:bg-[#0c1236]"
                      )}
                    >
                      <div
                        className={cn(
                          "font-bold",
                          inputs.soilClass === s ? "text-foreground dark:text-white" : "text-foreground/90 dark:text-slate-200"
                        )}
                      >
                        {meta[s].label}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-purple-600 dark:text-purple-300 font-semibold">{meta[s].sub}</div>
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
            <h2 className="mb-2 text-2xl font-black text-foreground dark:text-white">Kalite ve Sistemler</h2>
            <p className="mb-6 text-sm text-muted-foreground dark:text-slate-300">
              İşçilik, malzeme kalitesi ve ek sistemler maliyet üzerinde doğrudan etkilidir.
            </p>

            {/* Kalite */}
            <div className="mb-6">
              <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-300">
                İşçilik & Malzeme Kalitesi
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {QUALITY_OPTIONS.map((q) => (
                  <button
                    key={q.id}
                    data-testid={`construction-quality-${q.id}`}
                    onClick={() => upd("qualityLevel", q.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all",
                      inputs.qualityLevel === q.id
                        ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:bg-blue-500/15 dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                        : "border-border/80 bg-muted/40 hover:border-blue-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070b20] dark:hover:bg-[#0c1236]"
                    )}
                  >
                    <div
                      className={cn(
                        "font-bold text-sm",
                        inputs.qualityLevel === q.id ? "text-foreground dark:text-white" : "text-foreground/90 dark:text-slate-200"
                      )}
                    >
                      {q.label}
                    </div>
                    <div className="mt-1 font-mono text-xs text-blue-600 dark:text-blue-300 font-semibold">{q.range}</div>
                    <div className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-slate-400">{q.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cephe */}
            <div className="mb-6">
              <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-300">
                Cephe / Dış Kabuk Sistemi
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {FACADE_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    data-testid={`construction-facade-${f.id}`}
                    onClick={() => upd("facadeType", f.id)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition-all",
                      inputs.facadeType === f.id
                        ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)] dark:bg-indigo-500/15 dark:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        : "border-border/80 bg-muted/40 hover:border-indigo-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070b20] dark:hover:bg-[#0c1236]"
                    )}
                  >
                    <div
                      className={cn(
                        "font-bold text-sm",
                        inputs.facadeType === f.id ? "text-foreground dark:text-white" : "text-foreground/90 dark:text-slate-200"
                      )}
                    >
                      {f.label}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground dark:text-slate-400">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Asansör */}
            <div className="rounded-2xl border border-border/80 bg-card/90 p-4 dark:border-white/10 dark:bg-[#070b20]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-foreground dark:text-white">Asansör Sistemi</div>
                  <div className="text-xs text-muted-foreground dark:text-slate-400">Adet başına ~850.000 TL (bölge katsayısı ile)</div>
                </div>
                <button
                  type="button"
                  data-testid="construction-elevator-toggle"
                  onClick={() => upd("hasElevator", !inputs.hasElevator)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    inputs.hasElevator ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]" : "bg-muted dark:bg-[#182044]"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                      inputs.hasElevator ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
              {inputs.hasElevator && (
                <div className="mt-4 pt-3 border-t border-border/70 dark:border-white/10">
                  <InputField
                    id="construction-elevator-count"
                    testId="construction-elevator-count-input"
                    label="Asansör Adedi"
                    unit="adet"
                    value={inputs.elevatorCount}
                    onChange={(v) => upd("elevatorCount", v)}
                    min={NUMBER_LIMITS.elevatorCount.min}
                    max={NUMBER_LIMITS.elevatorCount.max}
                    error={elevatorCountError}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Navigation Actions ── */}
        <div className="mt-8 flex items-center justify-between border-t border-border/70 dark:border-white/10 pt-6">
          <button
            type="button"
            data-testid="construction-back-button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-[#0d1230] dark:text-slate-300 dark:hover:bg-[#131a44] dark:hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" /> Geri
          </button>

          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  step === s.id
                    ? "w-6 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    : step > s.id
                    ? "w-2 bg-emerald-500 dark:bg-emerald-400"
                    : "w-2 bg-muted-foreground/30 dark:bg-white/15"
                )}
              />
            ))}
          </div>

          {step < 4 ? (
            <button
              type="button"
              data-testid="construction-next-button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canGoNext()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-40 active:scale-98"
            >
              İleri <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              data-testid="construction-calculate-button"
              onClick={handleFinish}
              disabled={!canGoNext()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:from-emerald-500 hover:to-teal-500 disabled:cursor-not-allowed disabled:opacity-40 active:scale-98"
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
  id, testId, label, unit, value, onChange, min, max, hint, error,
}: {
  id: string;
  testId: string;
  label: string;
  unit: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
  hint?: string;
  error?: string | null;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-300">
        {label}
      </label>
      {hint && <p className="text-xs text-muted-foreground dark:text-slate-400">{hint}</p>}
      <div
        className={cn(
          "flex items-center overflow-hidden rounded-xl border bg-card transition-all focus-within:ring-2 focus-within:ring-blue-500/20 dark:bg-[#070b20] dark:focus-within:ring-blue-500/30",
          error
            ? "border-red-500 focus-within:border-red-500"
            : "border-input focus-within:border-blue-500 dark:border-white/15 dark:focus-within:border-blue-400"
        )}
      >
        <input
          id={id}
          data-testid={testId}
          type="number"
          min={min}
          max={max}
          value={value ?? ""}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const rawValue = e.target.value;
            if (rawValue.trim() === "") {
              onChange(undefined);
              return;
            }

            const parsedValue = Number.parseFloat(rawValue);
            onChange(Number.isNaN(parsedValue) ? undefined : parsedValue);
          }}
          className="flex-1 bg-transparent px-4 py-3 font-mono text-sm font-bold text-foreground outline-none dark:text-white"
        />
        <span className="border-l border-border bg-muted px-3.5 py-3 font-mono text-xs font-bold text-blue-600 dark:border-white/10 dark:bg-[#0c1233] dark:text-blue-300">
          {unit}
        </span>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-500 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
