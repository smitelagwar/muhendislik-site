"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Copy,
  Printer,
  Sparkles,
  SlidersHorizontal,
  Layers,
  Target,
  ChevronRight,
} from "lucide-react";

const CONCRETE_GRADES = [
  { name: "C20/25", fck: 20, fctd: 1.07 },
  { name: "C25/30", fck: 25, fctd: 1.20 },
  { name: "C30/37", fck: 30, fctd: 1.35 },
  { name: "C35/45", fck: 35, fctd: 1.48 },
  { name: "C40/50", fck: 40, fctd: 1.61 },
  { name: "C50/60", fck: 50, fctd: 1.84 },
];

const COLUMN_LOCATIONS = [
  { id: "inner", label: "İç Kolon (Dört Tarafı Açık)", gamma: 1.0 },
  { id: "edge", label: "Kenar Kolon (Üç Tarafı Açık)", gamma: 1.15 },
  { id: "corner", label: "Köşe Kolon (İki Tarafı Açık)", gamma: 1.4 },
];

import {
  calculatePunchingShear,
  PUNCHING_LOCATION_FACTORS,
  type ColumnPunchingLocation,
} from "@/lib/concrete-tools/punching";

export function PunchingCalculator() {
  const [concreteIndex, setConcreteIndex] = useState(2); // C30/37
  const [slabThicknessCm, setSlabThicknessCm] = useState(25);
  const [coverMm, setCoverMm] = useState(30);
  const [colBxCm, setColBxCm] = useState(40);
  const [colByCm, setColByCm] = useState(40);
  const [colLocationId, setColLocationId] = useState<ColumnPunchingLocation>("inner");
  const [vpdKn, setVpdKn] = useState(480);
  const [copied, setCopied] = useState(false);

  const selectedConcrete = CONCRETE_GRADES[concreteIndex];
  const selectedLocation = COLUMN_LOCATIONS.find((l) => l.id === colLocationId) || COLUMN_LOCATIONS[0];

  const calc = useMemo(() => {
    return calculatePunchingShear({
      fckMpa: selectedConcrete.fck,
      fctdMpa: selectedConcrete.fctd,
      slabThicknessCm,
      coverMm,
      columnBxCm: colBxCm,
      columnByCm: colByCm,
      location: colLocationId,
      axialPunchingLoadKn: vpdKn,
    });
  }, [selectedConcrete, slabThicknessCm, coverMm, colBxCm, colByCm, colLocationId, vpdKn]);

  const dCm = calc?.effectiveDepthCm ?? Math.max(5, slabThicknessCm - coverMm / 10 - 1.0);
  const upCm = calc?.punchingPerimeterCm ?? 0;
  const vpdMpa = calc?.punchingStressMpa ?? 0;
  const fctd = calc?.concreteTensileStrengthFctd ?? selectedConcrete.fctd;
  const ratio = calc?.utilizationRatio ?? 0;
  const isSafe = calc ? calc.status === "safe" : true;
  const isExceededMax = calc ? calc.status === "exceeded_capacity" : false;

  const handleCopyReport = () => {
    const text = `TS 500 DÖŞEME ZIMBALAMA KONTROLÜ RAPORU
-------------------------------------------
Beton Sınıfı: ${selectedConcrete.name} (fctd = ${fctd} MPa)
Döşeme Kalınlığı (h): ${slabThicknessCm} cm (Faydalı Derinlik d: ${dCm.toFixed(1)} cm)
Kolon Boyutları: ${colBxCm}x${colByCm} cm (${selectedLocation.label})
Zımbalama Eksenel Yükü (Vpd): ${vpdKn} kN
Zımbalama Çevresi (up): ${upCm.toFixed(1)} cm

HESAP SONUÇLARI:
Zımbalama Gerilmesi (vpd): ${vpdMpa.toFixed(2)} MPa
Zımbalama Dayanımı (fctd): ${fctd.toFixed(2)} MPa
Kapasite Kullanım Oranı: %${(ratio * 100).toFixed(1)}
DURUM: ${isSafe ? "GÜVENLİ (Donatısız Kurtarıyor)" : isExceededMax ? "TEHLİKELİ (Kesit Artırılmalı)" : "ZIMBALAMA DONATISI GEREKLİ"}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Breadcrumb navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/kategori/araclar"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Hesap Araçlarına Dön
        </Link>
        <span className="rounded-full border border-pink-500/20 bg-pink-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-pink-600 dark:text-pink-400">
          TS 500 & Eurocode 2
        </span>
      </div>

      {/* Main Header */}
      <header className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/15 text-pink-600 dark:text-pink-400">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Döşeme Zımbalama Kontrolü
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
              Mantar veya kirişsiz plak döşemelerde kolon çevresi kayma (zımbalama) gerilmesi ve çevre tahkiki.
            </p>
          </div>
        </div>
      </header>

      {/* Grid: Inputs & Visualizer */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Input Panel */}
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-white/[0.06]">
              <SlidersHorizontal className="h-5 w-5 text-pink-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Tasarım Parametreleri
              </h2>
            </div>

            <div className="mt-5 space-y-5">
              {/* Concrete Grade */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Beton Dayanım Sınıfı
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {CONCRETE_GRADES.map((cg, idx) => (
                    <button
                      key={cg.name}
                      onClick={() => setConcreteIndex(idx)}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                        concreteIndex === idx
                          ? "border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                      }`}
                    >
                      {cg.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Kolon Konumu ($\gamma$ Yük Katsayısı)
                </label>
                <select
                  value={colLocationId}
                  onChange={(e) => setColLocationId(e.target.value as ColumnPunchingLocation)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                >
                  {COLUMN_LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.label} ($\gamma = {loc.gamma}$)
                    </option>
                  ))}
                </select>
              </div>

              {/* Slab & Cover Thickness */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Döşeme Kalınlığı $h$ (cm)
                  </label>
                  <input
                    type="number"
                    value={slabThicknessCm}
                    onChange={(e) => setSlabThicknessCm(Number(e.target.value))}
                    min={12}
                    max={80}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Pas Payı $c$ (mm)
                  </label>
                  <input
                    type="number"
                    value={coverMm}
                    onChange={(e) => setCoverMm(Number(e.target.value))}
                    min={15}
                    max={60}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Column Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Kolon $b_x$ (cm)
                  </label>
                  <input
                    type="number"
                    value={colBxCm}
                    onChange={(e) => setColBxCm(Number(e.target.value))}
                    min={20}
                    max={200}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Kolon $b_y$ (cm)
                  </label>
                  <input
                    type="number"
                    value={colByCm}
                    onChange={(e) => setColByCm(Number(e.target.value))}
                    min={20}
                    max={200}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Zımbalama Yükü V_pd */}
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Tasarım Zımbalama Kuvveti (V_pd) (kN)
                  </label>
                  <span className="font-mono text-xs font-bold text-pink-600 dark:text-pink-400">
                    {vpdKn} kN
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={2000}
                  step={10}
                  value={vpdKn}
                  onChange={(e) => setVpdKn(Number(e.target.value))}
                  className="mt-2 w-full accent-pink-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visualizer & Calculation Results */}
        <div className="space-y-6 lg:col-span-6">
          {/* Result Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Tahkik Sonucu
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                  isSafe
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : isExceededMax
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {isSafe ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> GÜVENLİ (Donatısız OK)
                  </>
                ) : isExceededMax ? (
                  <>
                    <AlertTriangle className="h-4 w-4" /> KESİT YETERSİZ
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" /> DONATI GEREKLİ
                  </>
                )}
              </span>
            </div>

            {/* Gauge Display */}
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 dark:border-white/[0.04] dark:bg-white/[0.02]">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-600 dark:text-zinc-400">
                  Kapasite Kullanım Oranı (v_pd / f_ctd)
                </span>
                <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                  %{(ratio * 100).toFixed(1)}
                </span>
              </div>
              <div className="mt-3 h-3.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    isSafe
                      ? "bg-emerald-500"
                      : isExceededMax
                      ? "bg-red-500"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${Math.min(100, ratio * 100)}%` }}
                />
              </div>
            </div>

            {/* Math Steps Grid */}
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200/60 bg-white p-3.5 dark:border-white/10 dark:bg-zinc-900">
                <span className="text-slate-500 dark:text-zinc-400">Zımbalama Gerilmesi (v_pd)</span>
                <div className="mt-1 font-mono text-base font-bold text-slate-900 dark:text-white">
                  {vpdMpa.toFixed(2)} MPa
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-white p-3.5 dark:border-white/10 dark:bg-zinc-900">
                <span className="text-slate-500 dark:text-zinc-400">Beton Çekme Emniyeti (f_ctd)</span>
                <div className="mt-1 font-mono text-base font-bold text-slate-900 dark:text-white">
                  {fctd.toFixed(2)} MPa
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-white p-3.5 dark:border-white/10 dark:bg-zinc-900">
                <span className="text-slate-500 dark:text-zinc-400">Faydalı Derinlik (d)</span>
                <div className="mt-1 font-mono text-base font-bold text-slate-900 dark:text-white">
                  {dCm.toFixed(1)} cm
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/60 bg-white p-3.5 dark:border-white/10 dark:bg-zinc-900">
                <span className="text-slate-500 dark:text-zinc-400">Kritik Çevre (u_p)</span>
                <div className="mt-1 font-mono text-base font-bold text-slate-900 dark:text-white">
                  {upCm.toFixed(1)} cm
                </div>
              </div>
            </div>

            {/* SVG Visualizer */}
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white">
              <span className="text-[11px] font-mono text-zinc-400 mb-3">
                Kritik Zımbalama Çevresi Plan Çizimi (u_p)
              </span>
              <svg viewBox="0 0 200 200" className="h-44 w-44">
                {/* Outer slab grid lines */}
                <rect x="10" y="10" width="180" height="180" fill="none" stroke="#334155" strokeDasharray="3 3" />
                {/* Critical punching perimeter up line */}
                <rect
                  x={100 - colBxCm * 0.8 - dCm * 0.8}
                  y={100 - colByCm * 0.8 - dCm * 0.8}
                  width={(colBxCm + 2 * dCm) * 1.6}
                  height={(colByCm + 2 * dCm) * 1.6}
                  rx="12"
                  fill="none"
                  stroke={isSafe ? "#10b981" : "#ef4444"}
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                />
                {/* Column rectangular section */}
                <rect
                  x={100 - colBxCm * 0.8}
                  y={100 - colByCm * 0.8}
                  width={colBxCm * 1.6}
                  height={colByCm * 1.6}
                  rx="4"
                  fill="#ec4899"
                  fillOpacity="0.3"
                  stroke="#ec4899"
                  strokeWidth="2.5"
                />
                {/* Force arrow in center */}
                <circle cx="100" cy="100" r="4" fill="#ffffff" />
              </svg>
            </div>

            {/* Export & Actions */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCopyReport}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-pink-500 py-3 text-xs font-bold text-white hover:bg-pink-600 transition-colors"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Rapor Kopyalandı!" : "Hesap Raporunu Kopyala"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
