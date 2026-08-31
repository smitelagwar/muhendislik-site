"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  ShieldCheck,
  Info,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import {
  calculateRoofCovering,
  ROOF_COVERINGS,
  type RoofCoveringType,
} from "@/lib/engineering/quantity/roof-covering";

export function RoofCoveringCalculator() {
  const [horizontalArea, setHorizontalArea] = useState(200);
  const [slopePct, setSlopePct] = useState(33); // %33 eğim (~18°)
  const [coveringType, setCoveringType] = useState<RoofCoveringType>("marsilya_tile");
  const [ridgeLength, setRidgeLength] = useState(15);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    return calculateRoofCovering({
      horizontalAreaM2: horizontalArea,
      slopePercentage: slopePct,
      coveringType,
      ridgeLengthM: ridgeLength,
    });
  }, [horizontalArea, slopePct, coveringType, ridgeLength]);

  const handleCopyReport = () => {
    const text = `ÇATI KAPLAMA VE EĞİM METRAJI RAPORU
--------------------------------------
ÇATI GEOMETRİSİ:
- Yatay İzdüşüm Alanı: ${horizontalArea} m²
- Çatı Eğimi: %${slopePct} (${result?.slopeAngleDeg.toFixed(1)}°)
- Gerçek Eğimli Çatı Yüzeyi: ${result?.slopedRoofAreaM2.toFixed(1)} m²

KAPLAMA VE YALITIM İHTİYACI:
- Seçilen Kaplama: ${result?.materialName}
- Gereken Miktar: ${result?.totalMaterialUnitsCount} ${result?.unitLabel}
- Su Yalıtım Membranı: ~${result?.membraneRollsCount} Rulo (10 m²/rulo)
${result?.ridgeTilesCount ? `- Mahya Kiremidi (${ridgeLength} m): ~${result.ridgeTilesCount} Adet` : ""}
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
                <Home className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">
                Çatı & İzolasyon
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Yaklaşık Ön Keşif
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              Çatı Kaplama & Eğim Metrajı
            </h1>

            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-zinc-300">
              Yatay izdüşüm alanını çatı eğim açısıyla çarparak gerçek eğimli kaplama alanını, kiremit/panel adetlerini, mahya ve su yalıtım membranı sarfiyatlarını yaklaşık olarak hesaplayın.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-300/90">
              <Info className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Yaklaşık Metraj:</strong> Saçak payı, dere detayları ve kırık çatı bindirme paylarına göre metraj artabilir; sipariş öncesi mimari çatı planı esas alınmalıdır.
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
                  Çatı Geometrisi & Malzeme
                </h2>
              </div>

              {/* Material selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300 mb-2">
                  Kaplama Malzemesi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(ROOF_COVERINGS).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCoveringType(key as RoofCoveringType)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        coveringType === key
                          ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                          : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-400 hover:border-purple-500/40"
                      }`}
                    >
                      <span className="text-xs font-bold block">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground dark:text-zinc-400 block mt-0.5">
                        {item.unitLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Yatay İzdüşüm Alanı (m²)
                  </label>
                  <input
                    type="number"
                    value={horizontalArea}
                    onChange={(e) => setHorizontalArea(Math.max(10, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Çatı Eğimi (%)
                    </label>
                    <span className="font-mono text-xs font-black text-purple-400">%{slopePct}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={70}
                    step={1}
                    value={slopePct}
                    onChange={(e) => setSlopePct(Number(e.target.value))}
                    className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground dark:text-zinc-500 mt-1">
                    <span>%10 (Az Eğim)</span>
                    <span>%33 (Standart)</span>
                    <span>%70 (Dik)</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                  Toplam Mahya Boyu (mtül - opsiyonel)
                </label>
                <input
                  type="number"
                  value={ridgeLength}
                  onChange={(e) => setRidgeLength(Math.max(0, Number(e.target.value)))}
                  className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                />
              </div>
            </section>
          </div>

          {/* Results */}
          <div className="space-y-6 lg:col-span-5">
            <section className="tool-result-panel rounded-[32px] p-6 sm:p-8 text-white space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-black">Çatı Metraj Özeti</h3>
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
                      Gerçek Eğimli Çatı Yüzeyi
                    </span>
                    <p className="text-5xl font-black tracking-tight text-white font-mono">
                      {result.slopedRoofAreaM2.toFixed(1)} <span className="text-2xl font-bold text-zinc-300">m²</span>
                    </p>
                    <p className="text-xs text-zinc-300">
                      Yatay: {result.horizontalAreaM2} m² (Açı: {result.slopeAngleDeg.toFixed(1)}°)
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      Kaplama Sipariş Miktarı
                    </span>
                    <p className="mt-1 text-3xl font-black font-mono">
                      {result.totalMaterialUnitsCount} <span className="text-sm font-normal text-zinc-300">{result.unitLabel}</span>
                    </p>
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
