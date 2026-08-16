"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Timer, Copy, SlidersHorizontal, Info } from "lucide-react";

const SOIL_CLASSES_PERIOD = [
  { name: "ZA", Fs: 0.8, F1: 0.8 },
  { name: "ZB", Fs: 0.9, F1: 0.9 },
  { name: "ZC", Fs: 1.5, F1: 1.6 },
  { name: "ZD", Fs: 1.9, F1: 2.0 },
  { name: "ZE", Fs: 2.2, F1: 2.5 },
];

const SYSTEM_TYPES = [
  { name: "Betonarme Çerçeve", Ct: 0.0724, x: 0.8 },
  { name: "Betonarme Perde / Çerçeve", Ct: 0.0488, x: 0.75 },
  { name: "Çelik Çerçeve (Çaprazlı)", Ct: 0.0731, x: 0.75 },
  { name: "Diğer Yapılar", Ct: 0.0488, x: 0.75 },
];

export function SeismicPeriodCalculator() {
  const [ss, setSs] = useState(0.85);
  const [s1, setS1] = useState(0.25);
  const [soilClassIdx, setSoilClassIdx] = useState(2); // ZC
  const [systemIdx, setSystemIdx] = useState(0);
  const [hnM, setHnM] = useState(15); // Building height
  const [copied, setCopied] = useState(false);

  const soil = SOIL_CLASSES_PERIOD[soilClassIdx];
  const system = SYSTEM_TYPES[systemIdx];

  const results = useMemo(() => {
    const Fs = soil.Fs;
    const F1 = soil.F1;
    const SDs = Fs * ss;
    const SD1 = F1 * s1;
    const TA = 0.2 * SD1 / SDs;
    const TB = SD1 / SDs;
    const TL = 6.0;

    // Empirical period per TBDY 2018 Eq. 4.2
    const T1 = system.Ct * Math.pow(hnM, system.x);

    // Spectral response acceleration curve data
    const tPoints = [0, TA, TB, TB * 2, TB * 4, TL, 10];
    const saPoints = tPoints.map((t) => {
      if (t <= TA) return (0.4 + 0.6 * t / Math.max(TA, 0.001)) * SDs;
      if (t <= TB) return SDs;
      if (t <= TL) return SD1 / Math.max(t, 0.001);
      return (SD1 * TL) / (Math.max(t, 0.001) * Math.max(t, 0.001));
    });

    const saAtT1 = T1 <= TA
      ? (0.4 + 0.6 * T1 / Math.max(TA, 0.001)) * SDs
      : T1 <= TB ? SDs
      : T1 <= TL ? SD1 / T1
      : (SD1 * TL) / (T1 * T1);

    // Spectral region label
    let region = "";
    if (T1 <= TA) region = "Kısa Periyot Bölgesi";
    else if (T1 <= TB) region = "Sabit İvme Bölgesi (Plateau)";
    else if (T1 <= TL) region = "Sabit Hız Bölgesi";
    else region = "Uzun Periyot Bölgesi";

    return { SDs: SDs.toFixed(3), SD1: SD1.toFixed(3), TA: TA.toFixed(3), TB: TB.toFixed(3), TL, T1: T1.toFixed(3), saAtT1: saAtT1.toFixed(3), region, tPoints, saPoints };
  }, [ss, s1, soilClassIdx, systemIdx, hnM]);

  const handleCopy = () => {
    const text = `TBDY 2018 DEPREM PERIYOT & SPEKTRAL İVME HESABI
-------------------------------------------------
SS=${ss} / S1=${s1} / Zemin: ${SOIL_CLASSES_PERIOD[soilClassIdx].name}
SDS=${results.SDs} / SD1=${results.SD1}
TA=${results.TA}s / TB=${results.TB}s / TL=6.00s
Sistem: ${SYSTEM_TYPES[systemIdx].name} | HN=${hnM} m
Ampirik Periyot T1=${results.T1} s
Sa(T1)=${results.saAtT1} (${results.region})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // SVG spectrum chart
  const chartW = 260, chartH = 120;
  const maxT = 4.0, maxSa = Number(results.SDs) * 1.15;
  const toX = (t: number) => (t / maxT) * chartW;
  const toY = (sa: number) => chartH - (sa / maxSa) * chartH;

  const pathD = results.tPoints.filter(t => t <= maxT).map((t, i) => {
    const sa = results.saPoints[i];
    return `${i === 0 ? "M" : "L"} ${toX(t).toFixed(1)} ${toY(sa).toFixed(1)}`;
  }).join(" ");

  const t1X = toX(Math.min(Number(results.T1), maxT));
  const t1Y = toY(Number(results.saAtT1));

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link href="/kategori/araclar" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors">
          <ArrowLeft className="h-4 w-4" />Hesap Araçlarına Dön
        </Link>
        <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-violet-600 dark:text-violet-400">TBDY 2018 Bölüm 2</span>
      </div>

      <header className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400">
            <Timer className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Deprem Periyot & Spektral İvme</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">TBDY 2018: Ampirik bina periyodu T1, SDS, SD1 ve Sae(T) tasarım ivme spektrumu çizimi.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-white/[0.06]">
              <SlidersHorizontal className="h-5 w-5 text-violet-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">Parametreler</h2>
            </div>
            <div className="mt-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between"><label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kısa Periyot (S_S)</label><span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400">{ss.toFixed(2)}</span></div>
                  <input type="range" min={0.1} max={3.0} step={0.05} value={ss} onChange={(e) => setSs(Number(e.target.value))} className="mt-2 w-full accent-violet-500" />
                </div>
                <div>
                  <div className="flex justify-between"><label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">1 sn Periyot (S_1)</label><span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400">{s1.toFixed(2)}</span></div>
                  <input type="range" min={0.05} max={1.5} step={0.05} value={s1} onChange={(e) => setS1(Number(e.target.value))} className="mt-2 w-full accent-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Yerel Zemin Sınıfı</label>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {SOIL_CLASSES_PERIOD.map((sc, idx) => (
                    <button key={sc.name} onClick={() => setSoilClassIdx(idx)} className={`rounded-xl border px-2 py-2 text-xs font-bold transition-all ${soilClassIdx === idx ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400" : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"}`}>{sc.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Taşıyıcı Sistem Tipi</label>
                <select value={systemIdx} onChange={(e) => setSystemIdx(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white">
                  {SYSTEM_TYPES.map((s, idx) => <option key={s.name} value={idx}>{s.name} (Ct={s.Ct}, x={s.x})</option>)}
                </select>
              </div>
              <div>
                <div className="flex justify-between"><label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Bina Toplam Yüksekliği H_N (m)</label><span className="font-mono text-xs font-bold text-violet-600 dark:text-violet-400">{hnM} m</span></div>
                <input type="range" min={3} max={120} step={1} value={hnM} onChange={(e) => setHnM(Number(e.target.value))} className="mt-2 w-full accent-violet-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">Ampirik Doğal Periyot</span>
              <div className="mt-2 font-mono text-4xl font-black text-slate-900 dark:text-white">T₁ = {results.T1} <span className="text-xl font-semibold text-slate-500">s</span></div>
              <div className="mt-1 text-xs text-slate-500">Sa(T₁) = {results.saAtT1} g · {results.region}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {[["SDS", results.SDs], ["SD1", results.SD1], ["TA", `${results.TA} s`], ["TB", `${results.TB} s`]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <span className="text-slate-500 dark:text-zinc-400">{k}</span>
                  <div className="font-mono text-base font-black text-slate-900 dark:text-white">{v}</div>
                </div>
              ))}
            </div>

            {/* Spectrum SVG Chart */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 p-4">
              <span className="text-[11px] font-mono text-zinc-400">Tasarım İvme Spektrumu Sae(T)</span>
              <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} className="mt-2 w-full">
                {/* Axes */}
                <line x1="0" y1={chartH} x2={chartW} y2={chartH} stroke="#334155" strokeWidth="1" />
                <line x1="0" y1="0" x2="0" y2={chartH} stroke="#334155" strokeWidth="1" />
                {/* Grid lines */}
                {[1, 2, 3].map(t => <line key={t} x1={toX(t)} y1="0" x2={toX(t)} y2={chartH} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />)}
                {/* Spectrum curve */}
                <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
                {/* T1 marker */}
                <line x1={t1X} y1="0" x2={t1X} y2={chartH} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
                <circle cx={t1X} cy={t1Y} r="4" fill="#f59e0b" />
                <text x={t1X + 4} y={t1Y - 4} fontSize="8" fill="#f59e0b" fontWeight="700">T₁={results.T1}s</text>
                {/* Axis labels */}
                <text x={chartW - 10} y={chartH + 14} fontSize="8" fill="#64748b" textAnchor="end">T (s)</text>
                <text x="2" y="8" fontSize="8" fill="#64748b">Sae(T)</text>
              </svg>
            </div>

            <div className="mt-4">
              <button onClick={handleCopy} className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-500 py-3 text-xs font-bold text-white hover:bg-violet-600 transition-colors">
                <Copy className="h-4 w-4" />{copied ? "Kopyalandı!" : "Hesap Raporunu Kopyala"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
