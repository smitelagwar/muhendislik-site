"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Link as LinkIcon,
  CheckCircle2,
  AlertTriangle,
  Copy,
  SlidersHorizontal,
  Info,
} from "lucide-react";

const CONCRETE_GRADES = [
  { name: "C20/25", fck: 20, fctk005: 1.54 },
  { name: "C25/30", fck: 25, fctk005: 1.80 },
  { name: "C30/37", fck: 30, fctk005: 2.03 },
  { name: "C35/45", fck: 35, fctk005: 2.23 },
  { name: "C40/50", fck: 40, fctk005: 2.42 },
];

const REBAR_GRADES = [
  { name: "B420C", fyd: 365 },
  { name: "B500C", fyd: 435 },
];

const BOND_CONDITIONS = [
  { id: "good", label: "İyi Aderans (Yatay Donatı Alt)", eta1: 1.0 },
  { id: "poor", label: "Kötü Aderans (Yatay Donatı Üst)", eta1: 0.7 },
];

const BAR_DIAMETERS = [8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32];

import {
  calculateSpliceLength,
  type BondCondition,
  type SpliceType,
} from "@/lib/concrete-tools/splice";

export function SpliceCalculator() {
  const [concreteIndex, setConcreteIndex] = useState(2); // C30/37
  const [rebarIndex, setRebarIndex] = useState(0); // B420C
  const [barDiameterMm, setBarDiameterMm] = useState(16);
  const [bondConditionId, setBondConditionId] = useState<BondCondition>("good");
  const [spliceType, setSpliceType] = useState<SpliceType>("duz");
  const [isCompression, setIsCompression] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedConcrete = CONCRETE_GRADES[concreteIndex];
  const selectedRebar = REBAR_GRADES[rebarIndex];
  const selectedBond = BOND_CONDITIONS.find((b) => b.id === bondConditionId) || BOND_CONDITIONS[0];

  const calc = calculateSpliceLength({
    fckMpa: selectedConcrete.fck,
    fctdMpa: selectedConcrete.fctk005 / 1.5,
    fydMpa: selectedRebar.fyd,
    barDiameterMm,
    bondCondition: bondConditionId,
    spliceType,
    isCompression,
  });

  const fctd = calc?.fctdMpa ?? (selectedConcrete.fctk005 / 1.5);
  const fyd = selectedRebar.fyd;
  const phi = barDiameterMm;

  const lbMm = calc?.basicAnchorageLengthLbMm ?? 0;
  const lbdMm = calc?.designAnchorageLengthLbdMm ?? 0;
  const lbdCm = calc?.designAnchorageLengthLbdCm ?? 0;
  const finalLbdCm = calc?.recommendedLapSpliceLengthCm ?? 0;

  const handleCopyReport = () => {
    const text = `TS 500 DONATISI KENETLENme & EK BOYU RAPORU
----------------------------------------------
Beton Sınıfı: ${selectedConcrete.name} (fctd = ${fctd.toFixed(2)} MPa)
Donatı Sınıfı: ${selectedRebar.name} (fyd = ${fyd} MPa)
Donatı Çapı: Ø${phi} mm
Aderans Koşulu: ${selectedBond.label} (η₁ = ${selectedBond.eta1})
Ek Türü: ${spliceType === "duz" ? "Düz" : spliceType === "kancali" ? "Kancalı" : "Manşonlu"} | ${isCompression ? "Basınç Donatısı" : "Çekme Donatısı"}

HESAP SONUÇLARI:
Temel Kenetlenme Boyu (lb): ${Math.ceil(lbdMm / 10)} cm
Tasarım Kenetlenme Boyu (lbd): ${lbdCm} cm
ÖNERİLEN EK/KENETLENme BOYU: ${finalLbdCm} cm
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link
          href="/kategori/araclar"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Hesap Araçlarına Dön
        </Link>
        <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-teal-600 dark:text-teal-400">
          TS 500 Madde 9
        </span>
      </div>

      <header className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
            <LinkIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Donatı Bindirme & Kenetlenme Boyu Hesabı
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
              Çekme ve basınç donatıları için temel kenetlenme boyu (l_b), tasarım kenetlenme boyu (l_bd) ve bindirmeli ek boyu (l_s).
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Inputs */}
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-white/[0.06]">
              <SlidersHorizontal className="h-5 w-5 text-teal-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">Hesap Girdileri</h2>
            </div>
            <div className="mt-5 space-y-5">
              {/* Material selects */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Beton Sınıfı</label>
                  <select
                    value={concreteIndex}
                    onChange={(e) => setConcreteIndex(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  >
                    {CONCRETE_GRADES.map((cg, idx) => (
                      <option key={cg.name} value={idx}>{cg.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Donatı Sınıfı</label>
                  <select
                    value={rebarIndex}
                    onChange={(e) => setRebarIndex(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  >
                    {REBAR_GRADES.map((rg, idx) => (
                      <option key={rg.name} value={idx}>{rg.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bar diameter */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Donatı Çapı (Ø)</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {BAR_DIAMETERS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setBarDiameterMm(d)}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                        barDiameterMm === d
                          ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                      }`}
                    >
                      Ø{d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bond condition */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Aderans Koşulu</label>
                <div className="mt-2 space-y-2">
                  {BOND_CONDITIONS.map((bc) => (
                    <label key={bc.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                      <input
                        type="radio"
                        name="bond"
                        value={bc.id}
                        checked={bondConditionId === bc.id}
                        onChange={() => setBondConditionId(bc.id as BondCondition)}
                        className="accent-teal-500"
                      />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{bc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Splice Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kenetlenme / Ek Türü</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(["duz", "kancali", "manson"] as SpliceType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSpliceType(t)}
                      className={`rounded-xl border px-2 py-2 text-xs font-bold transition-all ${
                        spliceType === t
                          ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                      }`}
                    >
                      {t === "duz" ? "Düz (α=1.0)" : t === "kancali" ? "Kancalı (α=0.7)" : "Manşonlu (α=0.5)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tension vs Compression */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Donatı Zorlanma Türü</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[false, true].map((isComp) => (
                    <button
                      key={String(isComp)}
                      onClick={() => setIsCompression(isComp)}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                        isCompression === isComp
                          ? "border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"
                      }`}
                    >
                      {isComp ? "Basınç Donatısı" : "Çekme Donatısı"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            {/* Key Result */}
            <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-6 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                {isCompression ? "Basınç Donatısı Ek Boyu" : "Çekme Donatısı Bindirme Ek Boyu"}
              </span>
              <div className="mt-3 font-mono text-5xl font-black text-slate-900 dark:text-white">
                {finalLbdCm} <span className="text-2xl font-bold text-slate-500">cm</span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                {isCompression ? "l_(s,c)" : "l_(s,t)"} = {isCompression ? "max(0.3 × lb, 15Ø, 200mm)" : "1.3 × lbd ≥ max(15Ø, 200mm)"}
              </p>
            </div>

            {/* Breakdown Steps */}
            <div className="mt-5 space-y-2 text-xs">
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-600 dark:text-zinc-400">Beton Çekme Tasarım Dayanımı (f_ctd):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{fctd.toFixed(2)} MPa</span>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-600 dark:text-zinc-400">Temel Kenetlenme Boyu (l_b):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{Math.ceil(lbMm / 10)} cm</span>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-600 dark:text-zinc-400">Tasarım Kenetlenme Boyu (l_bd) [α={calc?.alphaFactor ?? 1.0}]:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{lbdCm} cm</span>
              </div>
              <div className="flex justify-between rounded-xl bg-teal-50 p-3 dark:bg-teal-900/20">
                <span className="font-semibold text-teal-700 dark:text-teal-300">Önerilen Ek Boyu:</span>
                <span className="font-mono font-black text-teal-700 dark:text-teal-300">{finalLbdCm} cm</span>
              </div>
            </div>

            {/* Info Note */}
            <div className="mt-4 flex gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-blue-700 dark:text-blue-300">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Bindirmeli ek boyları için çekme donatısında l_(s,t) = 1.3 × l_bd, basınç donatısında l_(s,c) ≥ 0.3 × l_b kullanılır. Ek hesapta aderans koşulu ve kanca etkisi dikkate alınmıştır.
              </span>
            </div>

            {/* SVG Visualization */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-950 p-4">
              <span className="text-[11px] font-mono text-zinc-400">Bindirmeli Ek Boyu Görünümü (Plan)</span>
              <svg viewBox="0 0 280 70" className="mt-2 w-full">
                {/* Bar 1 (left-to-right) */}
                <rect x="10" y="22" width={140} height="8" rx="2" fill="#14b8a6" fillOpacity="0.7" />
                {/* Bar 2 (right overlap) */}
                <rect x="80" y="36" width="190" height="8" rx="2" fill="#14b8a6" fillOpacity="0.4" />
                {/* Overlap indication */}
                <rect x="80" y="20" width={Math.min(finalLbdCm * 1.5, 140)} height="28" rx="2" fill="#14b8a6" fillOpacity="0.15" stroke="#14b8a6" strokeWidth="1" strokeDasharray="4 2" />
                {/* Label */}
                <text x={80 + Math.min(finalLbdCm * 0.75, 70)} y="12" textAnchor="middle" fontSize="9" fill="#14b8a6" fontWeight="700">
                  ls = {finalLbdCm} cm
                </text>
                {/* Arrows */}
                <line x1="80" y1="14" x2="80" y2="18" stroke="#14b8a6" strokeWidth="1" />
                <line x1={80 + Math.min(finalLbdCm * 1.5, 140)} y1="14" x2={80 + Math.min(finalLbdCm * 1.5, 140)} y2="18" stroke="#14b8a6" strokeWidth="1" />
              </svg>
            </div>

            <div className="mt-5">
              <button
                onClick={handleCopyReport}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-xs font-bold text-white hover:bg-teal-600 transition-colors"
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
