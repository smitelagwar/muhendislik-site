"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Timer, Copy, SlidersHorizontal, Check } from "lucide-react";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { cn } from "@/lib/utils";

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
    const TA = (0.2 * SD1) / SDs;
    const TB = SD1 / SDs;
    const TL = 6.0;

    // Empirical period per TBDY 2018 Eq. 4.2
    const T1 = system.Ct * Math.pow(hnM, system.x);

    // Spectral response acceleration curve data
    const tPoints = [0, TA, TB, TB * 2, TB * 4, TL, 10];
    const saPoints = tPoints.map((t) => {
      if (t <= TA) return (0.4 + (0.6 * t) / Math.max(TA, 0.001)) * SDs;
      if (t <= TB) return SDs;
      if (t <= TL) return SD1 / Math.max(t, 0.001);
      return (SD1 * TL) / (Math.max(t, 0.001) * Math.max(t, 0.001));
    });

    const saAtT1 =
      T1 <= TA
        ? (0.4 + (0.6 * T1) / Math.max(TA, 0.001)) * SDs
        : T1 <= TB
          ? SDs
          : T1 <= TL
            ? SD1 / T1
            : (SD1 * TL) / (T1 * T1);

    // Spectral region label
    let region = "";
    if (T1 <= TA) region = "Kısa Periyot Bölgesi";
    else if (T1 <= TB) region = "Sabit İvme Platosu";
    else if (T1 <= TL) region = "Sabit Hız Bölgesi";
    else region = "Uzun Periyot Bölgesi";

    return {
      SDs: SDs.toFixed(3),
      SD1: SD1.toFixed(3),
      TA: TA.toFixed(3),
      TB: TB.toFixed(3),
      TL,
      T1: T1.toFixed(3),
      saAtT1: saAtT1.toFixed(3),
      region,
      tPoints,
      saPoints,
    };
  }, [ss, s1, soilClassIdx, systemIdx, hnM, soil, system]);

  const handleCopy = () => {
    const text = `TBDY 2018 DEPREM PERİYOT & SPEKTRAL İVME HESABI
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
  const chartW = 260,
    chartH = 120;
  const maxT = 4.0,
    maxSa = Number(results.SDs) * 1.15;
  const toX = (t: number) => (t / maxT) * chartW;
  const toY = (sa: number) => chartH - (sa / maxSa) * chartH;

  const pathD = results.tPoints
    .filter((t) => t <= maxT)
    .map((t, i) => {
      const sa = results.saPoints[i];
      return `${i === 0 ? "M" : "L"} ${toX(t).toFixed(1)} ${toY(sa).toFixed(1)}`;
    })
    .join(" ");

  const t1X = toX(Math.min(Number(results.T1), maxT));
  const t1Y = toY(Number(results.saAtT1));

  return (
    <div className="tool-page-shell relative min-h-screen py-8 md:py-14 text-foreground">
      {/* Cosmic Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-[120px] dark:from-purple-600/25" />
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
        <PageContextNavigation
          showBreadcrumbs={false}
          className="mb-8"
          backLinkClassName="inline-flex items-center gap-2 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#120f28]/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-200 backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-card dark:hover:bg-[#1b173b] hover:text-foreground dark:hover:text-white"
        />

        {/* Hero Header Card */}
        <section className="relative overflow-hidden rounded-[32px] border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/85 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)] backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-ping" />
                <span>TBDY 2018 Bölüm 2</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
                Deprem Periyot &{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400">
                  Spektral İvme
                </span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground dark:text-zinc-300 md:text-base">
                TBDY 2018: Ampirik bina periyodu T₁, S_DS, S_D1 ve Sae(T) tasarım ivme spektrumu çizimi.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shrink-0">
              <Timer className="h-6 w-6" />
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Inputs */}
          <div className="space-y-6 lg:col-span-6">
            <section className="tool-panel rounded-[32px] p-6 sm:p-8">
              <div className="flex items-center gap-2.5 border-b border-border/70 dark:border-white/10 pb-4">
                <SlidersHorizontal className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-black text-foreground dark:text-white">Parametreler</h2>
              </div>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                        Kısa Periyot (Sₛ)
                      </label>
                      <span className="font-mono text-xs font-black text-purple-400">{ss.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={3.0}
                      step={0.05}
                      value={ss}
                      onChange={(e) => setSs(Number(e.target.value))}
                      className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                    />
                  </div>

                  <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                        1 sn Periyot (S₁)
                      </label>
                      <span className="font-mono text-xs font-black text-purple-400">{s1.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={1.5}
                      step={0.05}
                      value={s1}
                      onChange={(e) => setS1(Number(e.target.value))}
                      className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Yerel Zemin Sınıfı
                  </label>
                  <div className="mt-2.5 grid grid-cols-5 gap-2">
                    {SOIL_CLASSES_PERIOD.map((sc, idx) => (
                      <button
                        key={sc.name}
                        type="button"
                        onClick={() => setSoilClassIdx(idx)}
                        className={cn(
                          "rounded-xl border px-2 py-2.5 text-xs font-bold transition-all text-center",
                          soilClassIdx === idx
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.35)] border-transparent"
                            : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-300 hover:border-purple-500/40 hover:text-white",
                        )}
                      >
                        {sc.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Taşıyıcı Sistem Tipi
                  </label>
                  <select
                    value={systemIdx}
                    onChange={(e) => setSystemIdx(Number(e.target.value))}
                    className="tool-input mt-2 w-full h-12 text-foreground dark:text-white font-bold"
                  >
                    {SYSTEM_TYPES.map((s, idx) => (
                      <option key={s.name} value={idx} className="bg-card dark:bg-[#16132e] text-foreground dark:text-white">
                        {s.name} (Ct={s.Ct}, x={s.x})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Bina Toplam Yüksekliği H_N (m)
                    </label>
                    <span className="font-mono text-xs font-black text-purple-400">{hnM} m</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={120}
                    step={1}
                    value={hnM}
                    onChange={(e) => setHnM(Number(e.target.value))}
                    className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Results */}
          <div className="space-y-6 lg:col-span-6">
            <section className="tool-panel rounded-[32px] p-6 sm:p-8">
              <div className="tool-result-panel overflow-hidden rounded-2xl p-6 text-center text-white">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                  Ampirik Doğal Periyot
                </span>
                <div className="mt-2 font-mono text-4xl sm:text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(192,132,252,0.45)]">
                  T₁ = {results.T1} <span className="text-xl font-semibold text-purple-300">s</span>
                </div>
                <div className="mt-2 text-xs font-mono text-zinc-300">
                  Sa(T₁) = {results.saAtT1} g · <span className="text-purple-300 font-bold">{results.region}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                {[
                  ["S_DS", results.SDs],
                  ["S_D1", results.SD1],
                  ["T_A", `${results.TA} s`],
                  ["T_B", `${results.TB} s`],
                ].map(([k, v]) => (
                  <div key={k} className="tool-result-inner rounded-xl p-3">
                    <span className="text-zinc-400">{k}</span>
                    <div className="font-mono text-base font-black text-white">{v}</div>
                  </div>
                ))}
              </div>

              {/* Spectrum SVG Chart */}
              <div className="mt-4 rounded-2xl border border-purple-500/20 bg-[#0b0a1a] p-4">
                <span className="text-[11px] font-mono text-purple-300 font-bold">
                  Tasarım İvme Spektrumu Sae(T)
                </span>
                <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} className="mt-2 w-full">
                  <line x1="0" y1={chartH} x2={chartW} y2={chartH} stroke="#3f3b60" strokeWidth="1" />
                  <line x1="0" y1="0" x2="0" y2={chartH} stroke="#3f3b60" strokeWidth="1" />
                  {[1, 2, 3].map((t) => (
                    <line
                      key={t}
                      x1={toX(t)}
                      y1="0"
                      x2={toX(t)}
                      y2={chartH}
                      stroke="#27234a"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  ))}
                  <path d={pathD} fill="none" stroke="#a855f7" strokeWidth="2.5" />
                  <line
                    x1={t1X}
                    y1="0"
                    x2={t1X}
                    y2={chartH}
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />
                  <circle cx={t1X} cy={t1Y} r="4" fill="#fbbf24" />
                  <text x={t1X + 4} y={t1Y - 4} fontSize="8" fill="#fbbf24" fontWeight="700">
                    T₁={results.T1}s
                  </text>
                  <text x={chartW - 10} y={chartH + 14} fontSize="8" fill="#a1a1aa" textAnchor="end">
                    T (s)
                  </text>
                  <text x="2" y="8" fontSize="8" fill="#a1a1aa">
                    Sae(T)
                  </text>
                </svg>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all active:scale-98"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Rapor Kopyalandı!" : "Hesap Raporunu Kopyala"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
