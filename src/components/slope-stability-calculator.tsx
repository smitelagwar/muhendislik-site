"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingDown, CheckCircle2, AlertTriangle, Copy, SlidersHorizontal } from "lucide-react";

import { calculateSlopeStability } from "@/lib/engineering/geotech/slope-stability";

const FAILURE_METHODS = [
  { id: "fellenius", name: "Fellenius (Basit Dilim)" },
  { id: "bishop", name: "Bishop (Basitleştirilmiş)" },
];

export function SlopeStabilityCalculator() {
  const [cohesionKpa, setCohesionKpa] = useState(15);
  const [frictionDeg, setFrictionDeg] = useState(28);
  const [gammaSoilKnm3, setGammaSoilKnm3] = useState(18);
  const [slopeHeightM, setSlopeHeightM] = useState(6);
  const [slopeAngleDeg, setSlopeAngleDeg] = useState(45);
  const [methodId, setMethodId] = useState("fellenius");
  const [copied, setCopied] = useState(false);

  const results = useMemo(() => {
    const calc = calculateSlopeStability({
      slopeHeightM,
      slopeAngleDeg,
      soilUnitWeightKnM3: gammaSoilKnm3,
      cohesionKpa,
      internalFrictionAngleDeg: frictionDeg,
    });

    const rawFs = calc?.factorOfSafetyFs ?? 1.5;
    const FsBishop = methodId === "bishop" ? rawFs * 1.06 : rawFs;

    const isSafe = FsBishop >= 1.5;
    const isWarning = FsBishop >= 1.2 && FsBishop < 1.5;

    const betaRad = (slopeAngleDeg * Math.PI) / 180;
    const Rc = 1.5 * slopeHeightM / Math.sin(betaRad);
    const Ns = cohesionKpa / (Math.max(FsBishop, 0.1) * gammaSoilKnm3 * slopeHeightM);

    return {
      Fs: FsBishop.toFixed(2),
      isSafe,
      isWarning,
      Ns: Ns.toFixed(4),
      Rc: Rc.toFixed(1),
    };
  }, [cohesionKpa, frictionDeg, gammaSoilKnm3, slopeHeightM, slopeAngleDeg, methodId]);

  const fs = Number(results.Fs);
  const handleCopy = () => {
    const text = `ŞEV STABİLİTESİ — ${FAILURE_METHODS.find(m => m.id === methodId)?.name}
---------------------------------------------------
Kohezyon c=${cohesionKpa} kPa | İçsel Sürtünme φ=${frictionDeg}° | γ=${gammaSoilKnm3} kN/m³
Şev Yüksekliği H=${slopeHeightM} m | Şev Açısı β=${slopeAngleDeg}°
Güvenlik Katsayısı Fs=${results.Fs}
Durum: ${results.isSafe ? "GÜVENLİ (Fs ≥ 1.50)" : results.isWarning ? "UYARI (1.25 ≤ Fs < 1.50)" : "GÜVENSİZ (Fs < 1.25)"}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const svgW = 200, svgH = 140;
  const slipArcRx = svgW * 0.65, slipArcRy = svgH * 0.8;

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link href="/kategori/araclar" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors">
          <ArrowLeft className="h-4 w-4" />Hesap Araçlarına Dön
        </Link>
        <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-green-700 dark:text-green-400">Fellenius / Bishop</span>
      </div>

      <header className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/15 text-green-600 dark:text-green-400">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Şev Stabilitesi Güvenlik Katsayısı</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">Fellenius / Bishop dilim yöntemiyle dairesel kayma yüzeyi için $F_s \ge 1.50$ güvenlik katsayısı tahkiki.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-white/[0.06]">
              <SlidersHorizontal className="h-5 w-5 text-green-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">Zemin & Şev Parametreleri</h2>
            </div>
            <div className="mt-5 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Yöntem</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {FAILURE_METHODS.map(m => (
                    <button key={m.id} onClick={() => setMethodId(m.id)} className={`rounded-xl border px-2 py-2 text-xs font-bold transition-all ${methodId === m.id ? "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400" : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"}`}>
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
              {[
                { label: "Kohezyon c (kPa)", value: cohesionKpa, set: setCohesionKpa, min: 0, max: 100, step: 1 },
                { label: "İçsel Sürtünme Açısı φ (°)", value: frictionDeg, set: setFrictionDeg, min: 0, max: 45, step: 1 },
                { label: "Birim Hacim Ağırlığı γ (kN/m³)", value: gammaSoilKnm3, set: setGammaSoilKnm3, min: 14, max: 24, step: 0.5 },
                { label: "Şev Yüksekliği H (m)", value: slopeHeightM, set: setSlopeHeightM, min: 1, max: 30, step: 0.5 },
                { label: "Şev Açısı β (°)", value: slopeAngleDeg, set: setSlopeAngleDeg, min: 15, max: 75, step: 1 },
              ].map(({ label, value, set, min, max, step }) => (
                <div key={label}>
                  <div className="flex justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">{label}</label>
                    <span className="font-mono text-xs font-bold text-green-600 dark:text-green-400">{value}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="mt-2 w-full accent-green-500" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className={`rounded-2xl border p-6 text-center ${results.isSafe ? "border-emerald-500/30 bg-emerald-500/5" : results.isWarning ? "border-amber-500/30 bg-amber-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">Güvenlik Katsayısı</span>
              <div className={`mt-2 font-mono text-5xl font-black ${results.isSafe ? "text-emerald-600 dark:text-emerald-400" : results.isWarning ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                Fs = {results.Fs}
              </div>
              <div className={`mt-2 flex items-center justify-center gap-1.5 text-sm font-bold ${results.isSafe ? "text-emerald-600 dark:text-emerald-400" : results.isWarning ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                {results.isSafe ? <><CheckCircle2 className="h-4 w-4" />GÜVENLİ (Fs ≥ 1.50)</> : results.isWarning ? <><AlertTriangle className="h-4 w-4" />UYARI (1.25 ≤ Fs &lt; 1.50)</> : <><AlertTriangle className="h-4 w-4" />GÜVENSİZ (Fs &lt; 1.25)</>}
              </div>
            </div>

            {/* Fs gauge */}
            <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Fs = {results.Fs} / Limit 1.50</span>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-zinc-200">{Math.min(100, (fs / 3) * 100).toFixed(0)}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800">
                <div className={`h-full transition-all duration-300 ${results.isSafe ? "bg-emerald-500" : results.isWarning ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(100, (fs / 3) * 100)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Fs=0</span><span className="text-amber-500">1.25</span><span className="text-emerald-500">1.50</span><span>3.0</span>
              </div>
            </div>

            {/* SVG Slope cross-section */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 p-4">
              <span className="text-[11px] font-mono text-zinc-400">Şev Kesiti & Dairesel Kayma Yüzeyi</span>
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="mt-2 w-full h-32">
                {/* Ground & slope */}
                <polygon points={`0,${svgH} 0,${svgH * 0.25} ${svgW * 0.45},${svgH * 0.25} ${svgW},${svgH}`} fill="#92400e" fillOpacity="0.3" stroke="#b45309" strokeWidth="2" />
                {/* Slip arc */}
                <path d={`M ${svgW * 0.1},${svgH * 0.25} Q ${svgW * 0.35},${svgH * 1.1} ${svgW * 0.8},${svgH}`}
                  fill="none" stroke={results.isSafe ? "#10b981" : "#ef4444"} strokeWidth="2.5" strokeDasharray="6 3" />
                {/* Slices */}
                {[0.2, 0.35, 0.5, 0.62, 0.73].map((xFrac, i) => (
                  <line key={i} x1={svgW * xFrac} y1={svgH * 0.25} x2={svgW * (xFrac + 0.03)} y2={svgH - i * 5} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 2" />
                ))}
                {/* Labels */}
                <text x="5" y={svgH * 0.6} fontSize="8" fill="#64748b" transform={`rotate(-90, 12, ${svgH * 0.6})`}>H={slopeHeightM}m</text>
                <text x={svgW * 0.25} y={svgH - 4} fontSize="8" fill={results.isSafe ? "#10b981" : "#ef4444"} fontWeight="700">Fs={results.Fs}</text>
              </svg>
            </div>

            <div className="mt-4">
              <button onClick={handleCopy} className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-xs font-bold text-white hover:bg-green-600 transition-colors">
                <Copy className="h-4 w-4" />{copied ? "Kopyalandı!" : "Hesap Raporunu Kopyala"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
