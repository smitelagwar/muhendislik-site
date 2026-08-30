"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mountain,
  ShieldCheck,
  AlertTriangle,
  Info,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
  Activity,
  Layers,
} from "lucide-react";
import { determineSoilClass, type SoilClassEvaluationInput } from "@/lib/engineering/tbdy2018/soil-class";

export function SoilClassCalculator() {
  const [method, setMethod] = useState<"vs30" | "spt" | "cu">("vs30");
  const [vs30Val, setVs30Val] = useState(380); // m/s
  const [sptVal, setSptVal] = useState(35);
  const [cuVal, setCuVal] = useState(120); // kPa
  const [isSpecialZf, setIsSpecialZf] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const input: SoilClassEvaluationInput = {
      isSpecialSoilCondition: isSpecialZf,
    };
    if (method === "vs30") input.vs30Ms = vs30Val;
    if (method === "spt") input.sptN60 = sptVal;
    if (method === "cu") input.cuKpa = cuVal;

    return determineSoilClass(input);
  }, [method, vs30Val, sptVal, cuVal, isSpecialZf]);

  const handleCopyReport = () => {
    const text = `TBDY 2018 TABLO 16.1 YEREL ZEMİN SINIFI TAYİN RAPORU
--------------------------------------------------------
Seçilen Değerlendirme Yöntemi: ${method === "vs30" ? "Vs30 (Kayma Dalgası Hızı)" : method === "spt" ? "SPT N60" : "cu (Drenajsız Kayma Mukavemeti)"}
Girdi Parametresi: ${result.criteriaSummary.join(" | ")}

SONUÇ:
Yerel Zemin Sınıfı: ${result.soilClass} (${result.className})
Açıklama: ${result.description}
Tasarım Katsayıları: Fs = ${result.fsCoeff.avg.toFixed(2)} | F1 = ${result.f1Coeff.avg.toFixed(2)}
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
                <Mountain className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">
                Geoteknik & Deprem
              </span>
              <span className="rounded-full border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#1e193d] px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                TBDY 2018 Tablo 16.1
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              Yerel Zemin Sınıfı Tayini
            </h1>

            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-zinc-300">
              Üst 30 metre için kayma dalgası hızı (Vs30), SPT N60 darbe sayısı veya drenajsız kayma dayanımı (cu) parametrelerine göre TBDY 2018 yerel zemin sınıfını (ZA-ZF) ve spektral zemin büyütme katsayılarını hesaplayın.
            </p>
          </div>
        </section>

        {/* Workspace */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Inputs */}
          <div className="space-y-6 lg:col-span-7">
            <section className="tool-panel rounded-[32px] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-border/70 dark:border-white/10 pb-4">
                <SlidersHorizontal className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-black text-foreground dark:text-white">
                  Zemin İnceleme Parametreleri
                </h2>
              </div>

              {/* Method Switcher */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300 mb-2">
                  Değerlendirme Kriteri
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "vs30", label: "Vs,30 (m/s)" },
                    { id: "spt", label: "SPT N60" },
                    { id: "cu", label: "cu (kPa)" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id as "vs30" | "spt" | "cu")}
                      className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                        method === m.id
                          ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                          : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-400 hover:border-purple-500/40"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Value Input */}
              {method === "vs30" && (
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Üst 30m Ortalama Vs (m/s)
                    </label>
                    <span className="font-mono text-sm font-black text-purple-400">{vs30Val} m/s</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={2000}
                    step={25}
                    value={vs30Val}
                    onChange={(e) => setVs30Val(Number(e.target.value))}
                    className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground dark:text-zinc-500 mt-1">
                    <span>100 (Yumuşak)</span>
                    <span>760 (Kaya Eşiği)</span>
                    <span>2000 (Sert Kaya)</span>
                  </div>
                </div>
              )}

              {method === "spt" && (
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Ortalama (N1)60,30 Darbe Sayısı
                    </label>
                    <span className="font-mono text-sm font-black text-purple-400">{sptVal}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={75}
                    step={1}
                    value={sptVal}
                    onChange={(e) => setSptVal(Number(e.target.value))}
                    className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground dark:text-zinc-500 mt-1">
                    <span>&lt; 15 (ZE)</span>
                    <span>15 - 50 (ZD)</span>
                    <span>&gt; 50 (ZC)</span>
                  </div>
                </div>
              )}

              {method === "cu" && (
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Drenajsız Kayma Mukavemeti cu (kPa)
                    </label>
                    <span className="font-mono text-sm font-black text-purple-400">{cuVal} kPa</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={400}
                    step={5}
                    value={cuVal}
                    onChange={(e) => setCuVal(Number(e.target.value))}
                    className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground dark:text-zinc-500 mt-1">
                    <span>&lt; 70 (ZE)</span>
                    <span>70 - 250 (ZD)</span>
                    <span>&gt; 250 (ZC)</span>
                  </div>
                </div>
              )}

              {/* Special ZF condition checkbox */}
              <label className="flex items-center gap-3 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSpecialZf}
                  onChange={(e) => setIsSpecialZf(e.target.checked)}
                  className="h-4 w-4 rounded accent-purple-600"
                />
                <div>
                  <span className="text-xs font-bold text-foreground dark:text-white block">
                    Özel Zemin Koşulu (ZF Sınıfı)
                  </span>
                  <span className="text-[11px] text-muted-foreground dark:text-zinc-400 block">
                    Yüksek sıvılaşma potansiyeli, kalın turba/organik zemin, fay zonu veya dik şev kenarı.
                  </span>
                </div>
              </label>
            </section>
          </div>

          {/* Results */}
          <div className="space-y-6 lg:col-span-5">
            <section className="tool-result-panel rounded-[32px] p-6 sm:p-8 text-white space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-300" />
                  <h3 className="text-lg font-black">Zemin Sınıfı Sonucu</h3>
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

              {/* Big Soil Class Badge */}
              <div className="rounded-2xl border border-purple-400/40 bg-purple-500/20 p-6 text-center space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-300">
                  TBDY 2018 Yerel Zemin Sınıfı
                </span>
                <p className="text-5xl font-black tracking-tight text-white font-mono">
                  {result.soilClass}
                </p>
                <p className="text-xs font-bold text-zinc-200">
                  {result.className}
                </p>
              </div>

              {/* Description */}
              <p className="text-xs leading-relaxed text-zinc-300">
                {result.description}
              </p>

              {/* Site coefficients */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    Kısa Periyot Fs
                  </span>
                  <p className="mt-1 text-2xl font-black font-mono">
                    {result.fsCoeff.avg.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-zinc-400">
                    Aralık: {result.fsCoeff.low.toFixed(1)} - {result.fsCoeff.high.toFixed(1)}
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    1.0 sn Periyot F1
                  </span>
                  <p className="mt-1 text-2xl font-black font-mono">
                    {result.f1Coeff.avg.toFixed(2)}
                  </p>
                  <span className="text-[10px] text-zinc-400">
                    Aralık: {result.f1Coeff.low.toFixed(1)} - {result.f1Coeff.high.toFixed(1)}
                  </span>
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
