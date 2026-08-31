"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  ShieldCheck,
  Info,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import {
  calculateRebarQuantity,
  BUILDING_TYPOLOGIES,
  type BuildingTypology,
} from "@/lib/engineering/quantity/rebar-ratio";

export function RebarQuantityCalculator() {
  const [areaM2, setAreaM2] = useState(1200);
  const [typology, setTypology] = useState<BuildingTypology>("residential_standard");
  const [wastePct, setWastePct] = useState(5);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    return calculateRebarQuantity({
      totalConstructionAreaM2: areaM2,
      typology,
      wastePercentage: wastePct,
    });
  }, [areaM2, typology, wastePct]);

  const handleCopyReport = () => {
    const text = `PRATİK İNŞAAT DEMİRİ (DONATI) METRAJ RAPORU
------------------------------------------------
YAPI BİLGİSİ:
- Toplam İnşaat Alanı: ${areaM2} m²
- Yapı Tipolojisi: ${result?.typologyName} (${result?.unitWeightKg} ${result?.unitLabel})

TONAJ TAHKİKİ:
- Net Donatı Miktarı: ${result?.netWeightTon.toFixed(2)} Ton
- Fire Payı (%${wastePct}): +${result?.wasteWeightTon.toFixed(2)} Ton
- BRÜT SİPARİŞ TONAJI: ${result?.grossWeightTon.toFixed(2)} Ton

ÇAP GRUBU DAĞILIMI:
- İnce Donatılar (Ø8 - Ø12 / Etriye & Döşeme): ${result?.thinRebarTon.toFixed(2)} Ton
- Orta Donatılar (Ø14 - Ø18 / Kiriş & Kolon): ${result?.mediumRebarTon.toFixed(2)} Ton
- Kalın Donatılar (Ø20+ / Perde & Temel): ${result?.thickRebarTon.toFixed(2)} Ton
- Bağ Teli İhtiyacı: ~${result?.bindingWireKg.toFixed(0)} kg
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
                <Layers className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">
                Kaba Yapı Metrajı
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Yaklaşık Ön Keşif Oranları
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              Pratik Donatı (Demir) Metrajı
            </h1>

            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-zinc-300">
              Yapı tipolojisi ve toplam inşaat alanına göre ampirik kg/m² donatı sarfiyatını, toplam tonajı ve çap gruplarına göre tahmini demir sipariş dağılımını hesaplayın.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-300/90">
              <Info className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Yaklaşık Metraj:</strong> Bu araç ön maliyet ve sipariş planlaması içindir; normatif statik proje yerine geçmez. Kesin pursantaj donatı çizimleri ile doğrulanmalıdır.
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
                  Bina ve Metraj Parametreleri
                </h2>
              </div>

              <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                  Toplam Brüt İnşaat Alanı (m²)
                </label>
                <input
                  type="number"
                  value={areaM2}
                  onChange={(e) => setAreaM2(Math.max(10, Number(e.target.value)))}
                  className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2.5 text-base font-mono font-bold text-foreground dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300 mb-2">
                  Yapı Tipolojisi & Taşıyıcı Sistem
                </label>
                <div className="space-y-2">
                  {Object.entries(BUILDING_TYPOLOGIES).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTypology(key as BuildingTypology)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all ${
                        typology === key
                          ? "border-purple-500 bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                          : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 hover:border-purple-500/40"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-foreground dark:text-white">{item.name}</span>
                        <span className="font-mono text-xs font-black text-purple-400">{item.defaultKgPerM2} kg/m²</span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground dark:text-zinc-400">{item.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Results */}
          <div className="space-y-6 lg:col-span-5">
            <section className="tool-result-panel rounded-[32px] p-6 sm:p-8 text-white space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-black">Donatı Sipariş Özeti</h3>
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
                      Toplam Donatı İhtiyacı (Brüt)
                    </span>
                    <p className="text-5xl font-black tracking-tight text-white font-mono">
                      {result.grossWeightTon.toFixed(2)} <span className="text-2xl font-bold text-zinc-300">Ton</span>
                    </p>
                    <p className="text-xs text-zinc-300">
                      Net: {result.netWeightTon.toFixed(2)} Ton (%{wastePct} fire dahil)
                    </p>
                  </div>

                  {/* Diameter Group Breakdown */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-zinc-300">İnce Donatı (Ø8 - Ø12 / %30):</span>
                      <span className="font-mono font-bold text-white">{result.thinRebarTon.toFixed(2)} Ton</span>
                    </div>
                    <div className="flex justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-zinc-300">Orta Donatı (Ø14 - Ø18 / %45):</span>
                      <span className="font-mono font-bold text-white">{result.mediumRebarTon.toFixed(2)} Ton</span>
                    </div>
                    <div className="flex justify-between rounded-xl bg-white/5 p-3">
                      <span className="text-zinc-300">Kalın Donatı (Ø20+ / %25):</span>
                      <span className="font-mono font-bold text-white">{result.thickRebarTon.toFixed(2)} Ton</span>
                    </div>
                    <div className="flex justify-between rounded-xl bg-purple-500/20 p-3 text-purple-300">
                      <span className="font-bold">Bağ Teli:</span>
                      <span className="font-mono font-black">~{result.bindingWireKg.toFixed(0)} kg</span>
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
