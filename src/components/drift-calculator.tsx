"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, MoveHorizontal, CheckCircle2, AlertTriangle, Copy, SlidersHorizontal } from "lucide-react";

export function DriftCalculator() {
  const [numFloors, setNumFloors] = useState(5);
  const [floorHeightM, setFloorHeightM] = useState(3.0);
  const [R, setR] = useState(8);
  const [lambda, setLambda] = useState(1.0); // Mod combination factor
  const [ductilityClass, setDuctilityClass] = useState<"YDKT" | "KDKT">("YDKT");

  // Per-floor relative displacement inputs (delta_i - delta_{i-1}) in mm
  const [floorDeltas, setFloorDeltas] = useState<number[]>(() =>
    Array.from({ length: 8 }, (_, i) => 8 + i * 2)
  );

  const [copied, setCopied] = useState(false);

  // Drift limit per TBDY 2018 Table 4.3
  // For brittle facades: λ·Δi/hi ≤ 0.008
  // For ductile facades: λ·Δi/hi ≤ 0.016
  const driftLimit = ductilityClass === "YDKT" ? 0.016 : 0.008;

  const results = useMemo(() => {
    const floors = Array.from({ length: numFloors }, (_, i) => {
      const hi = floorHeightM * 1000; // mm
      const deltaImm = floorDeltas[i] ?? 10;
      // Reduced displacement (delta_e) → real displacement (delta_x = delta_e * R / lambda simplified)
      const deltaRealMm = deltaImm; // user enters real (not elastic) displacement
      const ratio = (lambda * deltaRealMm) / hi;
      const pct = (ratio * 100).toFixed(3);
      const isSafe = ratio <= driftLimit;
      return { floorNum: i + 1, hi: hi / 1000, deltaImm, ratio: ratio.toFixed(5), pct, isSafe };
    });
    return floors;
  }, [numFloors, floorHeightM, floorDeltas, lambda, driftLimit]);

  const setDelta = (idx: number, val: number) => {
    setFloorDeltas((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const allSafe = results.every((f) => f.isSafe);

  const handleCopy = () => {
    const lines = results.map((f) => `  Kat ${f.floorNum}: δi=${f.deltaImm}mm / hi=${f.hi}m → λΔi/hi=${f.ratio} (${f.isSafe ? "OK" : "AŞILDI"})`).join("\n");
    navigator.clipboard.writeText(`TBDY 2018 GÖRELİ KAT ÖTELEMESİ (DRIFT) KONTROL RAPORU\n-------------------------------------------------------\nSınır: ${driftLimit} (${ductilityClass})\n${lines}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link href="/kategori/araclar" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors">
          <ArrowLeft className="h-4 w-4" />Hesap Araçlarına Dön
        </Link>
        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400">TBDY 2018 Tablo 4.3</span>
      </div>

      <header className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400">
            <MoveHorizontal className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">Göreli Kat Ötelemesi (Drift) Kontrolü</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">TBDY 2018 Tablo 4.3: $\lambda \cdot \Delta_i / h_i \le 0.008$ (kırılgan) veya $0.016$ (sünekli) sınırı tahkiki.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-white/[0.06]">
              <SlidersHorizontal className="h-5 w-5 text-red-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">Genel Parametreler</h2>
            </div>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kat Sayısı</label>
                  <input type="number" value={numFloors} onChange={(e) => setNumFloors(Math.min(8, Math.max(1, Number(e.target.value))))} min={1} max={8} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kat Yük. h (m)</label>
                  <input type="number" value={floorHeightM} onChange={(e) => setFloorHeightM(Number(e.target.value))} min={2.5} max={6} step={0.1} className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Cephe Kırılganlık Sınıfı</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {["YDKT", "KDKT"].map((dc) => (
                    <button key={dc} onClick={() => setDuctilityClass(dc as "YDKT" | "KDKT")}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${ductilityClass === dc ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400" : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"}`}>
                      {dc === "YDKT" ? "YDKT (Sünekli ≤0.016)" : "KDKT (Kırılgan ≤0.008)"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Mod Birleşim Katsayısı λ</label>
                  <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">{lambda.toFixed(2)}</span>
                </div>
                <input type="range" min={0.5} max={1.5} step={0.05} value={lambda} onChange={(e) => setLambda(Number(e.target.value))} className="mt-2 w-full accent-red-500" />
              </div>

              {/* Per-floor delta inputs */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kat Göreli Ötelemesi $\Delta_i$ (mm)</label>
                <div className="mt-2 space-y-2">
                  {Array.from({ length: numFloors }, (_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-12 text-xs font-bold text-slate-500 dark:text-zinc-400">{i + 1}. Kat</span>
                      <input type="number" value={floorDeltas[i] ?? 10} onChange={(e) => setDelta(i, Number(e.target.value))} min={0} max={500}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white" />
                      <span className="text-xs text-slate-400">mm</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-black text-slate-900 dark:text-white">Kat Bazlı Kontrol Sonuçları</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${allSafe ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                {allSafe ? <><CheckCircle2 className="h-3.5 w-3.5" />Tüm Katlar OK</> : <><AlertTriangle className="h-3.5 w-3.5" />Sınır Aşımı Var</>}
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5">
                    <th className="p-2.5 text-left font-bold text-slate-600 dark:text-zinc-300">Kat</th>
                    <th className="p-2.5 text-right font-bold text-slate-600 dark:text-zinc-300">Δᵢ (mm)</th>
                    <th className="p-2.5 text-right font-bold text-slate-600 dark:text-zinc-300">λΔᵢ/hᵢ</th>
                    <th className="p-2.5 text-right font-bold text-slate-600 dark:text-zinc-300">% (Sınır %{driftLimit * 100})</th>
                    <th className="p-2.5 text-center font-bold text-slate-600 dark:text-zinc-300">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((f) => (
                    <tr key={f.floorNum} className="border-t border-slate-100 dark:border-white/[0.04]">
                      <td className="p-2.5 font-mono font-semibold text-slate-900 dark:text-white">{f.floorNum}. Kat</td>
                      <td className="p-2.5 text-right font-mono text-slate-700 dark:text-zinc-300">{f.deltaImm}</td>
                      <td className="p-2.5 text-right font-mono text-slate-700 dark:text-zinc-300">{f.ratio}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">{f.pct}%</td>
                      <td className="p-2.5 text-center">
                        {f.isSafe
                          ? <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
                          : <AlertTriangle className="mx-auto h-4 w-4 text-red-500" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bar chart visualization */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 p-4">
              <span className="text-[11px] font-mono text-zinc-400">Kat Drift Oranları — Limit: {(driftLimit * 100).toFixed(1)}%</span>
              <div className="mt-3 space-y-1.5">
                {results.map((f) => {
                  const pct = Math.min(100, (Number(f.ratio) / driftLimit) * 100);
                  return (
                    <div key={f.floorNum} className="flex items-center gap-2">
                      <span className="w-10 text-right text-[10px] font-bold text-zinc-400">{f.floorNum}. K</span>
                      <div className="flex-1 h-3 rounded-full bg-zinc-800">
                        <div className={`h-full rounded-full transition-all ${f.isSafe ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`w-12 text-right text-[10px] font-bold ${f.isSafe ? "text-emerald-400" : "text-red-400"}`}>{f.pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <button onClick={handleCopy} className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-xs font-bold text-white hover:bg-red-600 transition-colors">
                <Copy className="h-4 w-4" />{copied ? "Kopyalandı!" : "Hesap Raporunu Kopyala"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
