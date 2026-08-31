"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Grid,
  ShieldCheck,
  Info,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import {
  calculateMasonryQuantity,
  MASONRY_MATERIALS,
  type MasonryMaterialType,
} from "@/lib/engineering/quantity/masonry";

export function MasonryQuantityCalculator() {
  const [wallLength, setWallLength] = useState(25);
  const [wallHeight, setWallHeight] = useState(2.8);
  const [openingsCount, setOpeningsCount] = useState(4);
  const [openWidth, setOpenWidth] = useState(1.2);
  const [openHeight, setOpenHeight] = useState(1.5);
  const [matType, setMatType] = useState<MasonryMaterialType>("bims_15");
  const [wastePct, setWastePct] = useState(5);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    return calculateMasonryQuantity({
      wallLengthM: wallLength,
      wallHeightM: wallHeight,
      openingsCount,
      openingWidthM: openWidth,
      openingHeightM: openHeight,
      materialType: matType,
      wastePercentage: wastePct,
    });
  }, [wallLength, wallHeight, openingsCount, openWidth, openHeight, matType, wastePct]);

  const handleCopyReport = () => {
    const text = `DUVAR METRAJI VE HARÇ İHTİYACI RAPORU
--------------------------------------
DUVAR BİLGİSİ:
- Boyut: ${wallLength} m uzunluk x ${wallHeight} m yükseklik
- Boşluklar (${openingsCount} adet ${openWidth}x${openHeight} m): ${result?.openingsAreaM2.toFixed(1)} m²
- Net Duvar Örme Alanı: ${result?.netAreaM2.toFixed(1)} m²

MALZEME VE SARFİYAT:
- Seçilen Malzeme: ${result?.materialName}
- Blok / Tuğla İhtiyacı: ${result?.totalPiecesCount} Adet (%${wastePct} fire dahil)
${
  result?.adhesiveBagsCount
    ? `- Gazbeton Yapıştırıcısı: ~${result.adhesiveBagsCount} Torba (25 kg)`
    : `- Duvar Harcı Hacmi: ~${result?.mortarVolumeM3.toFixed(2)} m³`
}
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
                <Grid className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">
                İnce Yapı Metrajı
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Yaklaşık Ön Keşif
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              Duvar Metrajı Hesabı
            </h1>

            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-zinc-300">
              Duvar uzunluk ve yüksekliklerinden kapı/pencere boşluklarını düşerek net örme alanını, tuğla/bims/gazbeton adetlerini ve harç sarfiyatını yaklaşık olarak hesaplayın.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-300/90">
              <Info className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Yaklaşık Metraj:</strong> Ürün kırılma/kesim zayiatı, derz payı ve şantiye koşullarına göre değişkenlik gösterebilir; sipariş öncesi mimari proje ile teyit edilmelidir.
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
                  Duvar ve Malzeme Bilgileri
                </h2>
              </div>

              {/* Material Choice */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300 mb-2">
                  Duvar Malzemesi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(MASONRY_MATERIALS).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMatType(key as MasonryMaterialType)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        matType === key
                          ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                          : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-400 hover:border-purple-500/40"
                      }`}
                    >
                      <span className="text-xs font-bold block">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground dark:text-zinc-400 block mt-0.5">
                        {item.piecesPerM2} adet/m² | {item.thicknessCm} cm
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Geometry */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Toplam Duvar Boyu (m)
                  </label>
                  <input
                    type="number"
                    value={wallLength}
                    onChange={(e) => setWallLength(Math.max(1, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Duvar Yüksekliği (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={wallHeight}
                    onChange={(e) => setWallHeight(Math.max(1, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>
              </div>

              {/* Openings */}
              <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Kapı & Pencere Boşlukları
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground dark:text-zinc-400">Boşluk Adedi</label>
                    <input
                      type="number"
                      value={openingsCount}
                      onChange={(e) => setOpeningsCount(Math.max(0, Number(e.target.value)))}
                      className="mt-1 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-2 py-1.5 text-xs font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground dark:text-zinc-400">Genişlik (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={openWidth}
                      onChange={(e) => setOpenWidth(Math.max(0.1, Number(e.target.value)))}
                      className="mt-1 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-2 py-1.5 text-xs font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground dark:text-zinc-400">Yükseklik (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={openHeight}
                      onChange={(e) => setOpenHeight(Math.max(0.1, Number(e.target.value)))}
                      className="mt-1 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-2 py-1.5 text-xs font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Results */}
          <div className="space-y-6 lg:col-span-5">
            <section className="tool-result-panel rounded-[32px] p-6 sm:p-8 text-white space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-black">Duvar Metraj Özeti</h3>
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
                      Gereken Toplam Adet
                    </span>
                    <p className="text-5xl font-black tracking-tight text-white font-mono">
                      {result.totalPiecesCount} <span className="text-2xl font-bold text-zinc-300">Adet</span>
                    </p>
                    <p className="text-xs text-zinc-300">
                      Net Alan: {result.netAreaM2.toFixed(1)} m² (%{wastePct} fire dahil)
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      {result.adhesiveBagsCount ? "Yapıştırıcı İhtiyacı" : "Harç İhtiyacı"}
                    </span>
                    <p className="mt-1 text-2xl font-black font-mono">
                      {result.adhesiveBagsCount
                        ? `~${result.adhesiveBagsCount} Torba (25 kg)`
                        : `~${result.mortarVolumeM3.toFixed(2)} m³`}
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
