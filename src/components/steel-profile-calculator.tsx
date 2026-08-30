"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Wrench, CheckCircle2, AlertTriangle, Copy, SlidersHorizontal } from "lucide-react";

// IPE Profile database (simplified)
const IPE_PROFILES = [
  { name: "IPE 80", h: 80, b: 46, tf: 5.2, tw: 3.8, A: 7.64, Iy: 80.1, Iz: 8.49, iy: 3.24, iz: 1.05, Wy: 20.0 },
  { name: "IPE 100", h: 100, b: 55, tf: 5.7, tw: 4.1, A: 10.3, Iy: 171, Iz: 15.9, iy: 4.07, iz: 1.24, Wy: 34.2 },
  { name: "IPE 120", h: 120, b: 64, tf: 6.3, tw: 4.4, A: 13.2, Iy: 318, Iz: 27.7, iy: 4.90, iz: 1.45, Wy: 53.0 },
  { name: "IPE 140", h: 140, b: 73, tf: 6.9, tw: 4.7, A: 16.4, Iy: 541, Iz: 44.9, iy: 5.74, iz: 1.65, Wy: 77.3 },
  { name: "IPE 160", h: 160, b: 82, tf: 7.4, tw: 5.0, A: 20.1, Iy: 869, Iz: 68.3, iy: 6.58, iz: 1.84, Wy: 109 },
  { name: "IPE 180", h: 180, b: 91, tf: 8.0, tw: 5.3, A: 23.9, Iy: 1320, Iz: 101, iy: 7.42, iz: 2.05, Wy: 146 },
  { name: "IPE 200", h: 200, b: 100, tf: 8.5, tw: 5.6, A: 28.5, Iy: 1940, Iz: 142, iy: 8.26, iz: 2.24, Wy: 194 },
  { name: "IPE 220", h: 220, b: 110, tf: 9.2, tw: 5.9, A: 33.4, Iy: 2770, Iz: 205, iy: 9.11, iz: 2.48, Wy: 252 },
  { name: "IPE 240", h: 240, b: 120, tf: 9.8, tw: 6.2, A: 39.1, Iy: 3890, Iz: 284, iy: 9.97, iz: 2.69, Wy: 324 },
  { name: "IPE 270", h: 270, b: 135, tf: 10.2, tw: 6.6, A: 45.9, Iy: 5790, Iz: 420, iy: 11.2, iz: 3.02, Wy: 429 },
  { name: "IPE 300", h: 300, b: 150, tf: 10.7, tw: 7.1, A: 53.8, Iy: 8360, Iz: 604, iy: 12.5, iz: 3.35, Wy: 557 },
  { name: "IPE 330", h: 330, b: 160, tf: 11.5, tw: 7.5, A: 62.6, Iy: 11770, Iz: 788, iy: 13.7, iz: 3.55, Wy: 713 },
  { name: "IPE 360", h: 360, b: 170, tf: 12.7, tw: 8.0, A: 72.7, Iy: 16270, Iz: 1040, iy: 15.0, iz: 3.79, Wy: 904 },
  { name: "IPE 400", h: 400, b: 180, tf: 13.5, tw: 8.6, A: 84.5, Iy: 23130, Iz: 1320, iy: 16.5, iz: 3.95, Wy: 1160 },
  { name: "IPE 450", h: 450, b: 190, tf: 14.6, tw: 9.4, A: 98.8, Iy: 33740, Iz: 1680, iy: 18.5, iz: 4.12, Wy: 1500 },
  { name: "IPE 500", h: 500, b: 200, tf: 16.0, tw: 10.2, A: 116, Iy: 48200, Iz: 2140, iy: 20.4, iz: 4.31, Wy: 1930 },
  { name: "IPE 550", h: 550, b: 210, tf: 17.2, tw: 11.1, A: 134, Iy: 67120, Iz: 2670, iy: 22.3, iz: 4.45, Wy: 2440 },
  { name: "IPE 600", h: 600, b: 220, tf: 19.0, tw: 12.0, A: 156, Iy: 92080, Iz: 3390, iy: 24.3, iz: 4.66, Wy: 3070 },
];

import {
  calculateSteelProfile,
  STEEL_PROFILES_DATABASE,
  type SteelSectionData,
} from "@/lib/engineering/steel/profile-selection";

const STEEL_GRADES = [
  { name: "S235", fy: 235, fu: 360 },
  { name: "S275", fy: 275, fu: 430 },
  { name: "S355", fy: 355, fu: 510 },
];

export function SteelProfileCalculator() {
  const [steelIdx, setSteelIdx] = useState(2); // S355
  const [profileIdx, setProfileIdx] = useState(6); // IPE 270
  const [bucklingLengthM, setBucklingLengthM] = useState(5.0);
  const [ndKn, setNdKn] = useState(0);
  const [mdKnm, setMdKnm] = useState(60);
  const [vdKn, setVdKn] = useState(80);
  const [copied, setCopied] = useState(false);

  const steel = STEEL_GRADES[steelIdx];
  const profile = STEEL_PROFILES_DATABASE[profileIdx] ?? STEEL_PROFILES_DATABASE[0];

  const results = useMemo(() => {
    const calc = calculateSteelProfile({
      profileName: profile.name,
      steelYieldFyMpa: steel.fy,
      bucklingLengthM,
      axialCompressionNdKn: ndKn,
      bendingMomentMdKnm: mdKnm,
      shearForceVdKn: vdKn,
    });

    if (!calc) {
      return {
        lambda: "0.0",
        isSlendernessSafe: true,
        lambdaLimit: 150,
        NbRdKn: "0.0",
        MRdKnm: "0.0",
        VRdKn: "0.0",
        chi: "1.000",
        utilN: "0.0",
        utilM: "0.0",
        utilV: "0.0",
        utilCombined: "0.0",
        isNSafe: true,
        isMSafe: true,
        isVSafe: true,
        isCombinedSafe: true,
      };
    }

    return {
      lambda: calc.slendernessLambda.toFixed(1),
      isSlendernessSafe: calc.isSlendernessSafe,
      lambdaLimit: 150,
      NbRdKn: calc.compressionCapacityNbRdKn.toFixed(1),
      MRdKnm: calc.bendingCapacityMcRdKnm.toFixed(1),
      VRdKn: calc.shearCapacityVcRdKn.toFixed(1),
      chi: calc.bucklingReductionFactorChi.toFixed(3),
      utilN: (calc.utilizationCompression * 100).toFixed(1),
      utilM: (calc.utilizationBending * 100).toFixed(1),
      utilV: (calc.utilizationShear * 100).toFixed(1),
      utilCombined: (calc.utilizationCombined * 100).toFixed(1),
      isNSafe: calc.utilizationCompression <= 1.0,
      isMSafe: calc.utilizationBending <= 1.0,
      isVSafe: calc.utilizationShear <= 1.0,
      isCombinedSafe: calc.isOverallSafe,
    };
  }, [steel, profile, bucklingLengthM, ndKn, mdKnm, vdKn]);

  const handleCopy = () => {
    const text = `ÇELİK PROFİL SEÇİMİ & NARİNLİK KONTROLÜ — ÇYTHYE 2018
-----------------------------------------------------------
Profil: ${profile.name} | Çelik: ${steel.name} (fy=${steel.fy} MPa)
Burkulma Boyu Lk=${bucklingLengthM} m | Narinlik λ=${results.lambda}/${results.lambdaLimit} — ${results.isSlendernessSafe ? "OK" : "AŞILDI"}
χ (Burkulma Redüksiyon)=${results.chi}

KAPASİTELER:
  Nb,Rd (Burkulma Dayanımı)=${results.NbRdKn} kN
  MRd (Eğilme Dayanımı)=${results.MRdKnm} kNm
  VRd (Kesme Dayanımı)=${results.VRdKn} kN

TAHKİK:
  N: %${results.utilN} | M: %${results.utilM} | V: %${results.utilV}
  N+M Kombinasyon: %${results.utilCombined} — ${results.isCombinedSafe ? "GÜVENLİ" : "SINIR AŞILDI"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link href="/kategori/araclar" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors">
          <ArrowLeft className="h-4 w-4" />Hesap Araçlarına Dön
        </Link>
        <span className="rounded-full border border-slate-500/20 bg-slate-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">ÇYTHYE 2018 / EC3</span>
      </div>

      <header className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-500/15 text-slate-600 dark:text-slate-400">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Çelik Profil Seçimi & Narinlik Kontrolü</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">IPE profiller kütüphanesi, burkulma narinliği (lambda), kesit dayanımı (Nb,Rd), (MRd) ve (VRd) hesabı.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-white/[0.06]">
              <SlidersHorizontal className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">Profil & Tasarım Yükleri</h2>
            </div>
            <div className="mt-5 space-y-5">
              {/* Steel grade */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Çelik Sınıfı</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {STEEL_GRADES.map((sg, idx) => (
                    <button key={sg.name} onClick={() => setSteelIdx(idx)} className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${steelIdx === idx ? "border-slate-600 bg-slate-600/10 text-slate-700 dark:text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"}`}>{sg.name}</button>
                  ))}
                </div>
              </div>

              {/* Profile select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">IPE Profil</label>
                <select value={profileIdx} onChange={(e) => setProfileIdx(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white">
                  {IPE_PROFILES.map((p, idx) => <option key={p.name} value={idx}>{p.name} — A={p.A}cm², Iy={p.Iy}cm⁴</option>)}
                </select>
              </div>

              {/* Buckling length */}
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Burkulma Boyu L_k (m)</label>
                  <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400">{bucklingLengthM} m</span>
                </div>
                <input type="range" min={1} max={15} step={0.25} value={bucklingLengthM} onChange={(e) => setBucklingLengthM(Number(e.target.value))} className="mt-2 w-full accent-slate-600" />
              </div>

              {/* Loads */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Nd (kN)", value: ndKn, set: setNdKn, max: 2000 },
                  { label: "Md (kNm)", value: mdKnm, set: setMdKnm, max: 500 },
                  { label: "Vd (kN)", value: vdKn, set: setVdKn, max: 500 },
                ].map(({ label, value, set, max }) => (
                  <div key={label}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{label}</label>
                    <input type="number" value={value} onChange={(e) => set(Number(e.target.value))} min={0} max={max} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            {/* Slenderness result */}
            <div className={`mb-4 flex items-center justify-between rounded-2xl border p-4 ${results.isSlendernessSafe ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <div>
                <span className="text-xs font-bold uppercase text-slate-500 dark:text-zinc-400">Narinlik Oranı λ</span>
                <div className="font-mono text-2xl font-black text-slate-900 dark:text-white">{results.lambda} <span className="text-sm text-slate-500">/ {results.lambdaLimit}</span></div>
              </div>
              <div className={`text-sm font-bold flex items-center gap-1.5 ${results.isSlendernessSafe ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {results.isSlendernessSafe ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                {results.isSlendernessSafe ? "Narinlik OK" : "Narinlik AŞILDI"}
              </div>
            </div>

            {/* Capacity utilization bars */}
            <div className="space-y-3">
              {[
                { label: `Nb,Rd = ${results.NbRdKn} kN (Eksenel)`, util: results.utilN, safe: results.isNSafe, color: "bg-blue-500" },
                { label: `MRd = ${results.MRdKnm} kNm (Eğilme)`, util: results.utilM, safe: results.isMSafe, color: "bg-purple-500" },
                { label: `VRd = ${results.VRdKn} kN (Kesme)`, util: results.utilV, safe: results.isVSafe, color: "bg-orange-500" },
                { label: `N + M Kombinasyon`, util: results.utilCombined, safe: results.isCombinedSafe, color: results.isCombinedSafe ? "bg-emerald-500" : "bg-red-500" },
              ].map(({ label, util, safe, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-zinc-200">{label}</span>
                    <span className={`font-mono font-bold ${safe ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>%{util}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                    <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${Math.min(100, Number(util))}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Profile details */}
            <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
              {[["h", `${profile.hMm} mm`], ["b", `${profile.bMm} mm`], ["A", `${profile.areaCm2} cm²`], ["iy", `${profile.iyCm} cm`], ["iz", `${profile.izCm} cm`], ["Wy", `${profile.welYCm3} cm³`], ["χ", results.chi]].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-50 p-2 dark:bg-white/5 text-center">
                  <div className="text-slate-400 dark:text-zinc-500">{k}</div>
                  <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">{v}</div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button onClick={handleCopy} className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-700 py-3 text-xs font-bold text-white hover:bg-slate-600 transition-colors">
                <Copy className="h-4 w-4" />{copied ? "Kopyalandı!" : "Hesap Raporunu Kopyala"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
