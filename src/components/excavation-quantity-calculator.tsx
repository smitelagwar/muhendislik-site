"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shovel,
  Truck,
  ShieldCheck,
  Info,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { calculateExcavation } from "@/lib/engineering/quantity/excavation";

export function ExcavationQuantityCalculator() {
  const [baseWidth, setBaseWidth] = useState(18);
  const [baseLength, setBaseLength] = useState(25);
  const [depth, setDepth] = useState(3.5);
  const [slopeRatio, setSlopeRatio] = useState(0.5); // 1:2 şev
  const [margin, setMargin] = useState(0.5); // 50 cm çalışma payı
  const [swellPct, setSwellPct] = useState(25); // %25 kabarma
  const [truckCap, setTruckCap] = useState(15); // 15 m3 damperli kamyon
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    return calculateExcavation({
      baseWidthM: baseWidth,
      baseLengthM: baseLength,
      depthM: depth,
      slopeRatio,
      workingSpaceMarginM: margin,
      swellPercentage: swellPct,
      truckCapacityM3: truckCap,
    });
  }, [baseWidth, baseLength, depth, slopeRatio, margin, swellPct, truckCap]);

  const handleCopyReport = () => {
    const text = `HAFRİYAT METRAJI & KAMYON SEFER RAPORU
--------------------------------------------
KAZI ÇUKURU BOYUTLARI:
- Taban: ${baseWidth} x ${baseLength} m (Derinlik: ${depth} m)
- Çalışma Payı: ${margin} m | Şev Oranı: ${slopeRatio} (Yatay/Düşey)

HESAP SONUÇLARI:
- Yerinde Sıkışık Kazı Hacmi: ${result?.solidVolumeM3.toFixed(1)} m³
- Zemin Kabarma Faktörü: %${swellPct}
- Taşınacak Kabarmış Hacim: ${result?.looseVolumeM3.toFixed(1)} m³
- Kamyon Sefer Sayısı (${truckCap} m³/kamyon): ~${result?.truckTripsCount} Sefer
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-page-shell relative min-h-screen py-8 md:py-14 text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-[120px] dark:from-purple-600/25" />
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div>
          <Link
            href="/kategori/araclar"
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#120f28]/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-200 backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-card dark:hover:bg-[#1b173b] hover:text-foreground dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 text-purple-400" />
            Tüm Hesap Araçlarına Dön
          </Link>
        </div>

        {/* Header */}
        <section className="relative overflow-hidden rounded-[32px] border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/85 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.15),transparent_50%)]" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                <Truck className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">
                Altyapı & Kazı
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Yaklaşık Ön Keşif
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              Hafriyat Metrajı & Kamyon Seferi Hesabı
            </h1>

            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-zinc-300">
              Şevli temel çukuru geometrisini prizmoid formülüyle hesaplayın; ampirik kabarma katsayısı ve kamyon hacmine göre tahmini nakliye sefer sayısını belirleyin.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-300/90">
              <Info className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Yaklaşık Metraj:</strong> Doğal zemin sıkışıklığı, nem oranı ve kamyon kasa doluluk oranına göre sefer sayısı değişebilir; şantiye ölçümü ile teyit edilmelidir.
              </span>
            </div>
          </div>
        </section>

        {/* Workspace */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Inputs */}
          <div className="space-y-6 lg:col-span-7">
            <section className="tool-panel rounded-[32px] p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-border/70 dark:border-white/10 pb-4">
                <SlidersHorizontal className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-black text-foreground dark:text-white">
                  Kazı Çukuru Boyutları
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Taban Genişliği (m)
                  </label>
                  <input
                    type="number"
                    value={baseWidth}
                    onChange={(e) => setBaseWidth(Math.max(1, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Taban Uzunluğu (m)
                  </label>
                  <input
                    type="number"
                    value={baseLength}
                    onChange={(e) => setBaseLength(Math.max(1, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Kazı Derinliği (m)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={depth}
                    onChange={(e) => setDepth(Math.max(0.5, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Şev Oranı (Yatay/Düşey)
                  </label>
                  <select
                    value={slopeRatio}
                    onChange={(e) => setSlopeRatio(Number(e.target.value))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-xs font-bold text-foreground dark:text-white"
                  >
                    <option value={0}>0 (Düşey / İksalı)</option>
                    <option value={0.33}>1/3 Şev (Sıkı Zemin)</option>
                    <option value={0.5}>1/2 Şev (Orta Zemin)</option>
                    <option value={1.0}>1/1 Şev (Gevşek Zemin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Zemin Kabarma Oranı (%20-%35)
                  </label>
                  <input
                    type="number"
                    value={swellPct}
                    onChange={(e) => setSwellPct(Math.max(0, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Kamyon Damper Hacmi (m³)
                  </label>
                  <input
                    type="number"
                    value={truckCap}
                    onChange={(e) => setTruckCap(Math.max(5, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Results */}
          <div className="space-y-6 lg:col-span-5">
            <section className="tool-result-panel rounded-[32px] p-6 sm:p-8 text-white space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-black">Hafriyat Metraj Özeti</h3>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-all"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Kopyalandı" : "Raporu Kopyala"}
                </button>
              </div>

              {result && (
                <>
                  <div className="rounded-2xl border border-purple-400/40 bg-purple-500/20 p-6 text-center space-y-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">
                      Taşınacak Kabarmış Hafriyat
                    </span>
                    <p className="text-5xl font-black tracking-tight text-white font-mono">
                      {result.looseVolumeM3.toFixed(1)} <span className="text-2xl font-bold text-zinc-300">m³</span>
                    </p>
                    <p className="text-xs text-zinc-300">
                      Yerinde Sıkışık Kazı: {result.solidVolumeM3.toFixed(1)} m³
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                        Kamyon Seferi İhtiyacı
                      </span>
                      <p className="mt-0.5 text-3xl font-black font-mono">
                        ~{result.truckTripsCount} <span className="text-sm font-normal text-zinc-300">Sefer</span>
                      </p>
                    </div>
                    <div className="rounded-2xl bg-purple-500/20 p-3 text-purple-300">
                      <Truck className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-300">
                    {result.notes.map((note, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-purple-400">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
