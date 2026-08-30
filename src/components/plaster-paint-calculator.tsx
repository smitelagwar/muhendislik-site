"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Paintbrush,
  ShieldCheck,
  Info,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import {
  calculatePlasterPaint,
  type PlasterType,
  type PaintType,
} from "@/lib/engineering/quantity/plaster-paint";

export function PlasterPaintCalculator() {
  const [wallArea, setWallArea] = useState(350);
  const [ceilingArea, setCeilingArea] = useState(120);
  const [plasterType, setPlasterType] = useState<PlasterType>("gypsum");
  const [paintType, setPaintType] = useState<PaintType>("interior_silicone");
  const [thicknessCm, setThicknessCm] = useState(1.5);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    return calculatePlasterPaint({
      wallAreaM2: wallArea,
      ceilingAreaM2: ceilingArea,
      plasterType,
      paintType,
      plasterThicknessCm: thicknessCm,
    });
  }, [wallArea, ceilingArea, plasterType, paintType, thicknessCm]);

  const handleCopyReport = () => {
    const text = `SIVA VE BOYA METRAJI RAPORU
----------------------------
YÜZEY BİLGİLERİ:
- Duvar Alanı: ${wallArea} m² | Tavan Alanı: ${ceilingArea} m²
- Toplam Yüzey: ${result?.totalPlasterAreaM2.toFixed(1)} m²

MALZEME İHTİYAÇLARI:
- Sıva Türü: ${plasterType === "gypsum" ? "Alçı Sıva" : "Çimento Sıva"} (${thicknessCm} cm)
- Gereken Sıva Miktarı: ${result?.plasterKg.toFixed(0)} kg (~${result?.plasterBags35KgCount} Torba 35 kg)
- Dönüşüm / Şeffaf Astar: ~${result?.primerKg.toFixed(1)} kg
- 2 Kat Son Kat Boya: ${result?.paintKg.toFixed(1)} kg (~${result?.paintBucketsCount} Kova 20 kg)
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
                <Paintbrush className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">
                İnce Yapı Metrajı
              </span>
              <span className="rounded-full border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#1e193d] px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                Sıva, Astar & 2 Kat Boya
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              Sıva ve Boya Metrajı Hesabı
            </h1>

            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-zinc-300">
              İç/dış duvar ve tavan alanlarına göre kaba-ince sıva torba ihtiyacını, astar ve 2 kat son kat boya kova sarfiyatlarını hesaplayın.
            </p>
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
                  Yüzey ve Malzeme Tercihleri
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Duvar Alanı (m²)
                  </label>
                  <input
                    type="number"
                    value={wallArea}
                    onChange={(e) => setWallArea(Math.max(0, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Tavan Alanı (m²)
                  </label>
                  <input
                    type="number"
                    value={ceilingArea}
                    onChange={(e) => setCeilingArea(Math.max(0, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300 mb-2">
                    Sıva Türü
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlasterType("gypsum")}
                      className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                        plasterType === "gypsum"
                          ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                          : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-400 hover:border-purple-500/40"
                      }`}
                    >
                      Alçı Sıva
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlasterType("cement_lime")}
                      className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                        plasterType === "cement_lime"
                          ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                          : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-400 hover:border-purple-500/40"
                      }`}
                    >
                      Çimento Sıva
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300 mb-2">
                    Boya Türü
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaintType("interior_silicone")}
                      className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                        paintType === "interior_silicone"
                          ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                          : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-400 hover:border-purple-500/40"
                      }`}
                    >
                      İç Silikonlu
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaintType("exterior_acrylic")}
                      className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                        paintType === "exterior_acrylic"
                          ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                          : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-400 hover:border-purple-500/40"
                      }`}
                    >
                      Dış Akrilik
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Results */}
          <div className="space-y-6 lg:col-span-5">
            <section className="tool-result-panel rounded-[32px] p-6 sm:p-8 text-white space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-black">Sıva & Boya Özeti</h3>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-purple-400/40 bg-purple-500/20 p-4 text-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                        Sıva İhtiyacı
                      </span>
                      <p className="mt-1 text-3xl font-black font-mono">
                        ~{result.plasterBags35KgCount} <span className="text-xs text-zinc-300">Torba</span>
                      </p>
                      <span className="text-[10px] text-zinc-300">{result.plasterKg.toFixed(0)} kg (35 kg/torba)</span>
                    </div>

                    <div className="rounded-2xl border border-purple-400/40 bg-purple-500/20 p-4 text-center">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                        2 Kat Boya
                      </span>
                      <p className="mt-1 text-3xl font-black font-mono">
                        ~{result.paintBucketsCount} <span className="text-xs text-zinc-300">Kova</span>
                      </p>
                      <span className="text-[10px] text-zinc-300">{result.paintKg.toFixed(1)} kg (20 kg/kova)</span>
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
