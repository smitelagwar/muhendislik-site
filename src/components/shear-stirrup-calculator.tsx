"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Copy,
  SlidersHorizontal,
} from "lucide-react";

const CONCRETE_GRADES = [
  { name: "C20/25", fctd: 1.07, fcd: 13.3 },
  { name: "C25/30", fctd: 1.20, fcd: 16.7 },
  { name: "C30/37", fctd: 1.35, fcd: 20.0 },
  { name: "C35/45", fctd: 1.48, fcd: 23.3 },
  { name: "C40/50", fctd: 1.61, fcd: 26.7 },
];

const REBAR_GRADES = [
  { name: "B420C", fywd: 365 },
  { name: "B500C", fywd: 435 },
];

import { calculateBeamShear } from "@/lib/concrete-tools/shear-stirrup";

export function ShearStirrupCalculator() {
  const [concreteIndex, setConcreteIndex] = useState(2); // C30/37
  const [rebarIndex, setRebarIndex] = useState(0); // B420C
  const [bwCm, setBwCm] = useState(25);
  const [hCm, setHCm] = useState(50);
  const [coverMm, setCoverMm] = useState(40);
  const [vdKn, setVdKn] = useState(160);
  const [phiMm, setPhiMm] = useState(8);
  const [legs, setLegs] = useState(2);
  const [copied, setCopied] = useState(false);

  const selectedConcrete = CONCRETE_GRADES[concreteIndex];
  const selectedRebar = REBAR_GRADES[rebarIndex];

  const calc = calculateBeamShear({
    fckMpa: selectedConcrete.fcd * 1.5,
    fctdMpa: selectedConcrete.fctd,
    fcdMpa: selectedConcrete.fcd,
    fywdMpa: selectedRebar.fywd,
    beamWidthCm: bwCm,
    beamHeightCm: hCm,
    coverMm,
    designShearKn: vdKn,
    stirrupDiameterMm: phiMm,
    stirrupLegCount: legs,
  });

  const dCm = calc?.effectiveDepthCm ?? (hCm - coverMm / 10);
  const vcKn = calc?.concreteShearResistanceKn ?? 0;
  const vmaxKn = calc?.maxShearLimitKn ?? 0;
  const recommendedSarilma = calc?.recommendedConfinedSpacingCm ?? 10;
  const recommendedOrta = calc?.recommendedSpanSpacingCm ?? 20;
  const isVmaxSafe = calc?.isVmaxSafe ?? true;

  const handleCopyReport = () => {
    const text = `TS 500 KİRİŞ KESME VE ETRİYE HESABI RAPORU
---------------------------------------------
Kiriş Boyutları: ${bwCm}x${hCm} cm (d = ${dCm.toFixed(1)} cm)
Beton / Donatı: ${selectedConcrete.name} / ${selectedRebar.name}
Tasarım Kesme Kuvveti (Vd): ${vdKn} kN

KAPASİTE VE SINIRLAR:
Betonun Kesme Katkısı (Vc): ${vcKn.toFixed(1)} kN
Kiriş Maksimum Kesme Limiti (Vmax): ${vmaxKn.toFixed(1)} kN (${isVmaxSafe ? "GÜVENLİ" : "GEÇERSİZ - KESİT BÜYÜTÜLMELİ"})

ÖNERİLEN ETRİYE YERLEŞİMİ:
Etriye Seçimi: Ø${phiMm} / ${legs} Kollu
Sarılma Bölgesi: Ø${phiMm}/${Math.max(5, Math.floor(recommendedSarilma))} cm
Orta Bölge: Ø${phiMm}/${Math.max(5, Math.floor(recommendedOrta))} cm
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
        <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
          TS 500 Madde 8.1
        </span>
      </div>

      <header className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-600 dark:text-orange-400">
            <Scissors className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Kiriş Kesme & Etriye Hesabı
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
              Kiriş kesme kuvveti $V_d$, beton katkısı $V_c$ ve etriye aralığı ($s$) tahkiki.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-white/[0.06]">
              <SlidersHorizontal className="h-5 w-5 text-orange-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Kiriş & Etriye Girdileri
              </h2>
            </div>

            <div className="mt-5 space-y-5">
              {/* Materials */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Beton Sınıfı
                  </label>
                  <select
                    value={concreteIndex}
                    onChange={(e) => setConcreteIndex(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  >
                    {CONCRETE_GRADES.map((cg, idx) => (
                      <option key={cg.name} value={idx}>
                        {cg.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Donatı Sınıfı
                  </label>
                  <select
                    value={rebarIndex}
                    onChange={(e) => setRebarIndex(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  >
                    {REBAR_GRADES.map((rg, idx) => (
                      <option key={rg.name} value={idx}>
                        {rg.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Gövde Genişliği $b_w$ (cm)
                  </label>
                  <input
                    type="number"
                    value={bwCm}
                    onChange={(e) => setBwCm(Number(e.target.value))}
                    min={15}
                    max={100}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Kiriş Yüksekliği $h$ (cm)
                  </label>
                  <input
                    type="number"
                    value={hCm}
                    onChange={(e) => setHCm(Number(e.target.value))}
                    min={25}
                    max={150}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Stirrup Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Etriye Çapı $\phi$ (mm)
                  </label>
                  <select
                    value={phiMm}
                    onChange={(e) => setPhiMm(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value={8}>Ø8 mm</option>
                    <option value={10}>Ø10 mm</option>
                    <option value={12}>Ø12 mm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Etriye Kol Sayısı
                  </label>
                  <select
                    value={legs}
                    onChange={(e) => setLegs(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
                  >
                    <option value={2}>2 Kollu Etriye</option>
                    <option value={4}>4 Kollu Etriye</option>
                  </select>
                </div>
              </div>

              {/* Shear Force Slider */}
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Tasarım Kesme Kuvveti $V_d$ (kN)
                  </label>
                  <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                    {vdKn} kN
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={600}
                  step={5}
                  value={vdKn}
                  onChange={(e) => setVdKn(Number(e.target.value))}
                  className="mt-2 w-full accent-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Kesme Emniyeti
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                  isVmaxSafe
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}
              >
                {isVmaxSafe ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> KESİT BOYUTU UYGUN
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" /> V_max AŞILDI (Kesit Büyüt)
                  </>
                )}
              </span>
            </div>

            {/* Recommended Stirrups Cards */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-orange-500/30 bg-orange-500/5 p-4 text-center">
                <span className="text-xs font-bold uppercase text-orange-700 dark:text-orange-400">
                  Sarılma Bölgesi
                </span>
                <div className="mt-2 font-mono text-2xl font-black text-slate-900 dark:text-white">
                  Ø{phiMm} / {Math.max(5, Math.floor(recommendedSarilma))} cm
                </div>
                <span className="mt-1 block text-[10px] text-slate-500 dark:text-zinc-400">
                  (Mesnet etrafı 2h boyunca)
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-white/10 dark:bg-white/5">
                <span className="text-xs font-bold uppercase text-slate-600 dark:text-zinc-300">
                  Orta Bölge
                </span>
                <div className="mt-2 font-mono text-2xl font-black text-slate-900 dark:text-white">
                  Ø{phiMm} / {Math.max(5, Math.floor(recommendedOrta))} cm
                </div>
                <span className="mt-1 block text-[10px] text-slate-500 dark:text-zinc-400">
                  (Açıklık boyunca)
                </span>
              </div>
            </div>

            {/* Detailed Capacity Steps */}
            <div className="mt-5 space-y-2 text-xs">
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-600 dark:text-zinc-400">Beton Kesme Katkısı (V_c):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {vcKn.toFixed(1)} kN
                </span>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-600 dark:text-zinc-400">Etriyenin Karşılaması Gereken (V_w):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {(calc?.stirrupShearDemandKn ?? 0).toFixed(1)} kN
                </span>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-600 dark:text-zinc-400">Maksimum Kesme Kuvveti Limiti (V_max):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {vmaxKn.toFixed(1)} kN
                </span>
              </div>
            </div>

            {/* Action */}
            <div className="mt-6">
              <button
                onClick={handleCopyReport}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-xs font-bold text-white hover:bg-orange-600 transition-colors"
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
