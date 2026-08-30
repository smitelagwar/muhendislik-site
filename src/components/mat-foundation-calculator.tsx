"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Info,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
  Target,
  Sparkles,
} from "lucide-react";
import { calculateMatFoundation, type MatFoundationInput } from "@/lib/concrete-tools/mat-foundation";

const CONCRETE_GRADES = [
  { name: "C25/30", fck: 25 },
  { name: "C30/37", fck: 30 },
  { name: "C35/45", fck: 35 },
  { name: "C40/50", fck: 40 },
];

export function MatFoundationCalculator() {
  const [concreteIdx, setConcreteIdx] = useState(1); // C30/37
  const [buildingWeightKn, setBuildingWeightKn] = useState(18000); // 1800 ton
  const [matAreaM2, setMatAreaM2] = useState(300);
  const [colMaxLoadKn, setColMaxLoadKn] = useState(1400); // 140 ton
  const [colBxCm, setColBxCm] = useState(50);
  const [colByCm, setColByCm] = useState(50);
  const [soilStressKpa, setSoilStressKpa] = useState(150); // 1.5 kg/cm2
  const [matThicknessCm, setMatThicknessCm] = useState(70);
  const [spanLengthM, setSpanLengthM] = useState(6.0);
  const [copied, setCopied] = useState(false);

  const selectedConcrete = CONCRETE_GRADES[concreteIdx];

  const results = useMemo(() => {
    return calculateMatFoundation({
      fckMpa: selectedConcrete.fck,
      buildingTotalWeightKn: buildingWeightKn,
      matAreaM2,
      columnMaxAxialLoadKn: colMaxLoadKn,
      columnBxCm: colBxCm,
      columnByCm: colByCm,
      soilAllowableStressKpa: soilStressKpa,
      matThicknessCm,
      spanLengthM,
    });
  }, [
    selectedConcrete,
    buildingWeightKn,
    matAreaM2,
    colMaxLoadKn,
    colBxCm,
    colByCm,
    soilStressKpa,
    matThicknessCm,
    spanLengthM,
  ]);

  const handleCopyReport = () => {
    if (!results) return;
    const text = `TBDY 2018 & TS 500 RADYE TEMEL ÖN BOYUTLANDIRMA VE TAHKİK RAPORU
-----------------------------------------------------------------
Beton Sınıfı: ${selectedConcrete.name} (fctd = ${results.fctdMpa.toFixed(2)} MPa)
Temel Boyutları: Alan = ${matAreaM2} m² | Kalınlık = ${matThicknessCm} cm (d = ${results.effectiveDepthCm.toFixed(1)} cm)
Yapı Toplam Yükü: ${buildingWeightKn} kN | Temel Öz Ağırlığı: ${results.matSelfWeightKn.toFixed(0)} kN
Kritik Kolon: ${colBxCm}x${colByCm} cm | Eksenel Yük = ${colMaxLoadKn} kN

HESAP SONUÇLARI:
1. Zemin Gerilmesi: ${results.actualSoilStressKpa.toFixed(1)} kPa / ${soilStressKpa} kPa (${results.isSoilStressSafe ? "GÜVENLİ" : "AŞIM VAR!"})
2. Zımbalama Gerilmesi: ${results.punchingStressMpa.toFixed(2)} MPa / ${results.fctdMpa.toFixed(2)} MPa (${results.isPunchingSafe ? "GÜVENLİ (Donatısız Kurtarıyor)" : "ZIMBALAMA DONATISI GEREKLİ"})
3. Önerilen Hasır Donatı: ${results.recommendedRebarBottom} (Alt ve Üst Çift Sıra)
4. Minimum Kalınlık Şartı: h = ${matThicknessCm} cm >= ${results.minThicknessLimitCm} cm (${results.isThicknessAdequate ? "UYGUN" : "YETERSİZ"})
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
                Geoteknik & Betonarme
              </span>
              <span className="rounded-full border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#1e193d] px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                TS 500 & TBDY 2018 Bölüm 16
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              Radye Temel Kalınlık & Zımbalama Hesabı
            </h1>

            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-zinc-300">
              Yapı toplam yükü, zemin emniyet gerilmesi ve kritik kolon tesirleri altında radye temel ön boyutlandırması, zemin taban basıncı, zımbalama ve minimum donatı tahkiklerini gerçekleştirin.
            </p>
          </div>
        </section>

        {/* Workspace */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Inputs Panel */}
          <div className="space-y-6 lg:col-span-7">
            <section className="tool-panel rounded-[32px] p-6 sm:p-8">
              <div className="flex items-center gap-2.5 border-b border-border/70 dark:border-white/10 pb-4">
                <SlidersHorizontal className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-black text-foreground dark:text-white">
                  Tasarım Parametreleri & Girdiler
                </h2>
              </div>

              <div className="mt-6 space-y-5">
                {/* Concrete Grade */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300 mb-2">
                    Beton Sınıfı (TS 500)
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {CONCRETE_GRADES.map((cg, idx) => (
                      <button
                        key={cg.name}
                        type="button"
                        onClick={() => setConcreteIdx(idx)}
                        className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                          concreteIdx === idx
                            ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                            : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-400 hover:border-purple-500/40"
                        }`}
                      >
                        {cg.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Building Load & Mat Area */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Yapı Toplam Yükü N (kN)
                    </label>
                    <input
                      type="number"
                      value={buildingWeightKn}
                      onChange={(e) => setBuildingWeightKn(Math.max(100, Number(e.target.value)))}
                      className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                  <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Radye Temel Alanı (m²)
                    </label>
                    <input
                      type="number"
                      value={matAreaM2}
                      onChange={(e) => setMatAreaM2(Math.max(10, Number(e.target.value)))}
                      className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                </div>

                {/* Soil Allowable Stress & Mat Thickness */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Zemin Emniyet Gerilmesi (kPa)
                    </label>
                    <input
                      type="number"
                      value={soilStressKpa}
                      onChange={(e) => setSoilStressKpa(Math.max(20, Number(e.target.value)))}
                      className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                    />
                    <span className="text-[10px] text-muted-foreground dark:text-zinc-500 mt-1 block">
                      ≈ {(soilStressKpa / 98.1).toFixed(2)} kgf/cm²
                    </span>
                  </div>
                  <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Temel Kalınlığı h (cm)
                    </label>
                    <input
                      type="number"
                      value={matThicknessCm}
                      onChange={(e) => setMatThicknessCm(Math.max(20, Number(e.target.value)))}
                      className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                </div>

                {/* Critical Column Load & Section */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Kritik Kolon (kN)
                    </label>
                    <input
                      type="number"
                      value={colMaxLoadKn}
                      onChange={(e) => setColMaxLoadKn(Math.max(50, Number(e.target.value)))}
                      className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                  <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Kolon bx (cm)
                    </label>
                    <input
                      type="number"
                      value={colBxCm}
                      onChange={(e) => setColBxCm(Math.max(20, Number(e.target.value)))}
                      className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                  <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Kolon by (cm)
                    </label>
                    <input
                      type="number"
                      value={colByCm}
                      onChange={(e) => setColByCm(Math.max(20, Number(e.target.value)))}
                      className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-xs text-purple-200 flex gap-3">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-purple-400" />
                  <span>
                    TS 500 ve TBDY 2018 uyarınca radye temellerde zemin gerilmesi emniyet sınırını aşmamalı, kolon zımbalama gerilmesi fctd değerinin altında kalmalıdır.
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Results Panel */}
          <div className="space-y-6 lg:col-span-5">
            {results && (
              <section className="tool-result-panel rounded-[32px] p-6 sm:p-8 text-white space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-300" />
                    <h3 className="text-lg font-black">Tahkik & Boyutlandırma</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-all"
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Kopyalandı" : "Raporu Kopyala"}
                  </button>
                </div>

                {/* Overall Status Badge */}
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300">
                      Genel Güvenlik Durumu
                    </span>
                    <h4 className="text-xl font-black mt-0.5">
                      {results.status === "safe"
                        ? "GÜVENLİ VE UYGUN"
                        : results.status === "warning"
                        ? "KONTROL GEREKLİ"
                        : "YETERSİZ KESİT"}
                    </h4>
                  </div>
                  <div
                    className={`rounded-full p-2.5 ${
                      results.status === "safe"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : results.status === "warning"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                    }`}
                  >
                    {results.status === "safe" ? (
                      <ShieldCheck className="h-6 w-6" />
                    ) : (
                      <AlertTriangle className="h-6 w-6" />
                    )}
                  </div>
                </div>

                {/* 2 Main Checks */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      Zemin Taban Basıncı
                    </span>
                    <p className="mt-1 text-2xl font-black font-mono">
                      {results.actualSoilStressKpa.toFixed(1)}{" "}
                      <span className="text-xs font-normal text-zinc-400">kPa</span>
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                      <span className="text-zinc-400">Kapasite:</span>
                      <span
                        className={
                          results.isSoilStressSafe ? "text-emerald-400" : "text-rose-400"
                        }
                      >
                        %{(results.soilStressUtilization * 100).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      Zımbalama Gerilmesi
                    </span>
                    <p className="mt-1 text-2xl font-black font-mono">
                      {results.punchingStressMpa.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-zinc-400">MPa</span>
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                      <span className="text-zinc-400">fctd:</span>
                      <span
                        className={
                          results.isPunchingSafe ? "text-emerald-400" : "text-amber-400"
                        }
                      >
                        {results.fctdMpa.toFixed(2)} MPa
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reinforcement Suggestion */}
                <div className="rounded-2xl border border-purple-400/30 bg-purple-500/15 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-300" />
                    <span className="text-xs font-black uppercase tracking-wider text-purple-200">
                      Önerilen Minimum Donatı Düzeni
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white font-mono">
                    {results.recommendedRebarBottom}
                  </p>
                  <p className="text-[11px] text-zinc-300">
                    Alt ve üst çift hasır donatı (As,min = {results.minFlexuralRebarAreaCm2PerM.toFixed(2)} cm²/m).
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-1.5 text-xs text-zinc-300">
                  {results.notes.map((note, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-purple-400">•</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
