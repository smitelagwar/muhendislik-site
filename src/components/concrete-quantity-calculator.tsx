"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  ShieldCheck,
  Info,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import { calculateConcreteQuantity } from "@/lib/engineering/quantity/concrete-volume";

export function ConcreteQuantityCalculator() {
  const [columnsCount, setColumnsCount] = useState(16);
  const [colBx, setColBx] = useState(0.4);
  const [colBy, setColBy] = useState(0.5);
  const [colHeight, setColHeight] = useState(3.0);

  const [beamLength, setBeamLength] = useState(120);
  const [beamWidth, setBeamWidth] = useState(0.25);
  const [beamDepth, setBeamDepth] = useState(0.5);

  const [slabArea, setSlabArea] = useState(250);
  const [slabThickness, setSlabThickness] = useState(0.15);

  const [foundationArea, setFoundationArea] = useState(250);
  const [foundationThickness, setFoundationThickness] = useState(0.6);

  const [wastePct, setWastePct] = useState(3);
  const [mixerCap, setMixerCap] = useState(9);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    return calculateConcreteQuantity({
      columnsCount,
      columnWidthM: colBx,
      columnDepthM: colBy,
      columnHeightM: colHeight,
      beamLengthM: beamLength,
      beamWidthM: beamWidth,
      beamDepthM: beamDepth,
      slabAreaM2: slabArea,
      slabThicknessM: slabThickness,
      foundationAreaM2: foundationArea,
      foundationThicknessM: foundationThickness,
      wastePercentage: wastePct,
      mixerTruckCapacityM3: mixerCap,
    });
  }, [
    columnsCount,
    colBx,
    colBy,
    colHeight,
    beamLength,
    beamWidth,
    beamDepth,
    slabArea,
    slabThickness,
    foundationArea,
    foundationThickness,
    wastePct,
    mixerCap,
  ]);

  const handleCopyReport = () => {
    const text = `HAZIR BETON METRAJI & MİKSER SEFER RAPORU
------------------------------------------------
ELEMAN HACİMLERİ (Net):
- Kolonlar (${columnsCount} adet): ${result.columnsVolumeM3.toFixed(2)} m³
- Kirişler (${beamLength} m): ${result.beamsVolumeM3.toFixed(2)} m³
- Döşemeler (${slabArea} m²): ${result.slabsVolumeM3.toFixed(2)} m³
- Temel (${foundationArea} m²): ${result.foundationVolumeM3.toFixed(2)} m³

ÖZET:
Net Toplam: ${result.totalNetVolumeM3.toFixed(2)} m³
Fire ve Döküm Payı (%${wastePct}): +${result.wasteVolumeM3.toFixed(2)} m³
BRÜT SİPARİŞ HACMİ: ${result.totalGrossVolumeM3.toFixed(2)} m³
MİKSER SEFER SAYISI (${mixerCap} m³/araç): ~${result.mixerTruckCount} Mikser
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
                Kaba Yapı Metrajı
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Yaklaşık Ön Keşif
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              Beton Metrajı & Mikser Seferi Hesabı
            </h1>

            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-zinc-300">
              Temel, kolon, kiriş ve döşeme elemanlarının net hacimlerini toplayın; fire katsayısı ve transmikser kapasitesine göre sipariş metrajını yaklaşık olarak belirleyin.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-300/90">
              <Info className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Yaklaşık Metraj:</strong> Pompa hortumunda kalan beton, kalıp esnemesi ve döküm firelerine göre sipariş hacmi değişebilir; sahadaki son dökümde kısmi mikser planlanmalıdır.
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
                  Eleman Boyutları & Hacim Parametreleri
                </h2>
              </div>

              {/* Foundation */}
              <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400">1. Temel / Radye</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-muted-foreground dark:text-zinc-400">Alan (m²)</label>
                    <input
                      type="number"
                      value={foundationArea}
                      onChange={(e) => setFoundationArea(Math.max(0, Number(e.target.value)))}
                      className="mt-1 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-muted-foreground dark:text-zinc-400">Kalınlık (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={foundationThickness}
                      onChange={(e) => setFoundationThickness(Math.max(0, Number(e.target.value)))}
                      className="mt-1 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Columns */}
              <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400">2. Kolonlar</span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground dark:text-zinc-400">Adet</label>
                    <input
                      type="number"
                      value={columnsCount}
                      onChange={(e) => setColumnsCount(Math.max(0, Number(e.target.value)))}
                      className="mt-1 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-2 py-2 text-xs font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground dark:text-zinc-400">b (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={colBx}
                      onChange={(e) => setColBx(Math.max(0, Number(e.target.value)))}
                      className="mt-1 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-2 py-2 text-xs font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground dark:text-zinc-400">h (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={colBy}
                      onChange={(e) => setColBy(Math.max(0, Number(e.target.value)))}
                      className="mt-1 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-2 py-2 text-xs font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground dark:text-zinc-400">H (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={colHeight}
                      onChange={(e) => setColHeight(Math.max(0, Number(e.target.value)))}
                      className="mt-1 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-2 py-2 text-xs font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Beams & Slabs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-400">3. Kirişler</span>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground dark:text-zinc-400">Toplam Boy (m)</label>
                    <input
                      type="number"
                      value={beamLength}
                      onChange={(e) => setBeamLength(Math.max(0, Number(e.target.value)))}
                      className="mt-1 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-2 py-1.5 text-xs font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.05"
                      value={beamWidth}
                      onChange={(e) => setBeamWidth(Math.max(0, Number(e.target.value)))}
                      className="rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-2 py-1.5 text-xs font-mono font-bold text-foreground dark:text-white"
                      placeholder="Genişlik"
                    />
                    <input
                      type="number"
                      step="0.05"
                      value={beamDepth}
                      onChange={(e) => setBeamDepth(Math.max(0, Number(e.target.value)))}
                      className="rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-2 py-1.5 text-xs font-mono font-bold text-foreground dark:text-white"
                      placeholder="Yükseklik"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-400">4. Döşeme</span>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground dark:text-zinc-400">Döşeme Alanı (m²)</label>
                    <input
                      type="number"
                      value={slabArea}
                      onChange={(e) => setSlabArea(Math.max(0, Number(e.target.value)))}
                      className="mt-1 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-2 py-1.5 text-xs font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted-foreground dark:text-zinc-400">Kalınlık (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={slabThickness}
                      onChange={(e) => setSlabThickness(Math.max(0, Number(e.target.value)))}
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
                <h3 className="text-lg font-black">Beton Sipariş Özeti</h3>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-all"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Kopyalandı" : "Raporu Kopyala"}
                </button>
              </div>

              {/* Total Gross Volume */}
              <div className="rounded-2xl border border-purple-400/40 bg-purple-500/20 p-6 text-center space-y-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">
                  Toplam Brüt Beton (Fire Dahil)
                </span>
                <p className="text-5xl font-black tracking-tight text-white font-mono">
                  {result.totalGrossVolumeM3.toFixed(1)} <span className="text-2xl font-bold text-zinc-300">m³</span>
                </p>
                <p className="text-xs text-zinc-300">
                  Net: {result.totalNetVolumeM3.toFixed(1)} m³ + %{wastePct} Fire ({result.wasteVolumeM3.toFixed(1)} m³)
                </p>
              </div>

              {/* Mixer Count */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Tahmini Mikser Seferi
                  </span>
                  <p className="mt-0.5 text-3xl font-black font-mono">
                    ~{result.mixerTruckCount} <span className="text-sm font-normal text-zinc-300">Mikser</span>
                  </p>
                </div>
                <div className="rounded-2xl bg-purple-500/20 p-3 text-purple-300">
                  <Truck className="h-6 w-6" />
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white/5 p-3">
                  <span className="text-zinc-400 block">Temel:</span>
                  <span className="font-mono font-bold text-white text-sm">{result.foundationVolumeM3.toFixed(1)} m³</span>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <span className="text-zinc-400 block">Kolonlar:</span>
                  <span className="font-mono font-bold text-white text-sm">{result.columnsVolumeM3.toFixed(1)} m³</span>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <span className="text-zinc-400 block">Kirişler:</span>
                  <span className="font-mono font-bold text-white text-sm">{result.beamsVolumeM3.toFixed(1)} m³</span>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <span className="text-zinc-400 block">Döşeme:</span>
                  <span className="font-mono font-bold text-white text-sm">{result.slabsVolumeM3.toFixed(1)} m³</span>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5 text-xs text-zinc-300">
                {result.notes.map((note, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-purple-400">•</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
