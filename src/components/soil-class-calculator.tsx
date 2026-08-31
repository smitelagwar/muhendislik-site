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
import {
  ToolScopeBadge,
  ToolSourceStamp,
  ToolLimitations,
  GoverningCheckCard,
} from "@/components/engineering-primitives";

export function SoilClassCalculator() {
  const [method, setMethod] = useState<"vs30" | "spt" | "cu">("vs30");
  const [vs30Val, setVs30Val] = useState(380); // m/s
  const [sptVal, setSptVal] = useState(35);
  const [cuVal, setCuVal] = useState(120); // kPa
  const [isSpecialZf, setIsSpecialZf] = useState(false);
  const [ssVal, setSsVal] = useState(1.0);
  const [s1Val, setS1Val] = useState(0.3);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const input: SoilClassEvaluationInput = {
      isSpecialSoilCondition: isSpecialZf,
      ss: ssVal,
      s1: s1Val,
    };
    if (method === "vs30") input.vs30Ms = vs30Val;
    if (method === "spt") input.sptN60 = sptVal;
    if (method === "cu") input.cuKpa = cuVal;

    return determineSoilClass(input);
  }, [method, vs30Val, sptVal, cuVal, isSpecialZf, ssVal, s1Val]);

  const handleCopyReport = () => {
    if (!result) return;
    const text = `TBDY 2018 TABLO 16.1 YEREL ZEMİN SINIFI TAYİN RAPORU
--------------------------------------------------------
Seçilen Değerlendirme Yöntemi: ${method === "vs30" ? "Vs30 (Kayma Dalgası Hızı)" : method === "spt" ? "SPT N60" : "cu (Drenajsız Kayma Mukavemeti)"}
Girdi Parametresi: ${result.criteriaSummary.join(" | ")}

SONUÇ:
Yerel Zemin Sınıfı: ${result.soilClass} (${result.className})
Açıklama: ${result.description}
${result.spectralCoefficients ? `Tasarım Katsayıları (Ss=${ssVal}, S1=${s1Val}): Fs = ${result.spectralCoefficients.fs} | F1 = ${result.spectralCoefficients.f1} | SDS = ${result.spectralCoefficients.sds} | SD1 = ${result.spectralCoefficients.sd1}` : ""}
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
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <ToolScopeBadge kind="classification" />
            <ToolSourceStamp sources={["TBDY 2018 Tablo 16.1"]} tier="A" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground dark:text-white">
            Yerel Zemin Sınıfı Tayini
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground dark:text-zinc-300 max-w-3xl leading-relaxed">
            Sondaj verileri (Vs30, SPT-N60 darbe sayısı veya drenajsız kohezyon cu) ile TBDY 2018 Tablo 16.1&apos;e göre ZA, ZB, ZC, ZD, ZE veya ZF yerel zemin sınıfını belirleyin.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs Section */}
          <div className="lg:col-span-7 space-y-6">
            <section className="rounded-3xl border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#120f28]/80 p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 dark:border-white/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-base font-bold text-foreground dark:text-white">
                    Zemin & Arazi Parametreleri
                  </h2>
                </div>
              </div>

              {/* Special ZF Condition */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSpecialZf}
                    onChange={(e) => setIsSpecialZf(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-amber-500/50 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-amber-800 dark:text-amber-200 block">
                      Özel Zemin Durumu / Sahaya Özel İnceleme (ZF)
                    </span>
                    <span className="text-amber-700 dark:text-amber-300/80 block leading-relaxed">
                      Sıvılaşabilir kumlar, turba/organik zeminler, yüksek plastisiteli yumuşak kil tabakaları veya aktif fay zonu yakınlığı mevcuttur.
                    </span>
                  </div>
                </label>
              </div>

              {!isSpecialZf && (
                <>
                  {/* Method selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground dark:text-zinc-400">
                      Birincil Değerlendirme Kriteri
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "vs30", label: "Vs,30 (m/s)", icon: Activity },
                        { id: "spt", label: "SPT-N60", icon: Layers },
                        { id: "cu", label: "cu (kPa)", icon: Mountain },
                      ].map((m) => {
                        const Icon = m.icon;
                        const isSelected = method === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setMethod(m.id as "vs30" | "spt" | "cu")}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all ${
                              isSelected
                                ? "border-purple-500 bg-purple-500/20 text-foreground dark:text-white shadow-lg shadow-purple-500/10"
                                : "border-border/80 dark:border-white/10 bg-card/50 dark:bg-white/5 text-muted-foreground dark:text-zinc-400 hover:border-purple-500/40 hover:text-foreground dark:hover:text-white"
                            }`}
                          >
                            <Icon className={`h-4 w-4 ${isSelected ? "text-purple-600 dark:text-purple-400" : "text-zinc-400"}`} />
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Method specific inputs */}
                  {method === "vs30" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground dark:text-zinc-300">
                          Üst 30 m Ortalama Kayma Dalgası Hızı (Vs,30)
                        </span>
                        <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                          {vs30Val} m/s
                        </span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={1800}
                        step={10}
                        value={vs30Val}
                        onChange={(e) => setVs30Val(Number(e.target.value))}
                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground dark:text-zinc-400 font-mono">
                        <span>100 (ZE: Yumuşak)</span>
                        <span>360 (ZC/ZD)</span>
                        <span>760 (ZB)</span>
                        <span>1800 (ZA: Kaya)</span>
                      </div>
                    </div>
                  )}

                  {method === "spt" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground dark:text-zinc-300">
                          Ortalama SPT-N60 Darbe Sayısı
                        </span>
                        <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                          {sptVal} darbe/30cm
                        </span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={80}
                        step={1}
                        value={sptVal}
                        onChange={(e) => setSptVal(Number(e.target.value))}
                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground dark:text-zinc-400 font-mono">
                        <span>2 (ZE: Gevşek)</span>
                        <span>15 (ZD Sınırı)</span>
                        <span>50 (ZC: Çok Sıkı)</span>
                        <span>80+</span>
                      </div>
                    </div>
                  )}

                  {method === "cu" && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-foreground dark:text-zinc-300">
                          Drenajsız Kayma Dayanımı (cu)
                        </span>
                        <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                          {cuVal} kPa
                        </span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={400}
                        step={5}
                        value={cuVal}
                        onChange={(e) => setCuVal(Number(e.target.value))}
                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground dark:text-zinc-400 font-mono">
                        <span>10 (ZE: Yumuşak Kil)</span>
                        <span>70 (ZD Sınırı)</span>
                        <span>250 (ZC: Sert Kil)</span>
                        <span>400+</span>
                      </div>
                    </div>
                  )}

                  {/* Spectral SS / S1 Parameters */}
                  <div className="pt-4 border-t border-border/60 dark:border-white/10 space-y-4">
                    <span className="text-xs font-black uppercase tracking-wider text-muted-foreground dark:text-zinc-400 block">
                      Spektrum İvme Katsayıları (Opsiyonel Fs/F1 Hesabı)
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground dark:text-zinc-300">Ss (Kısa Periyot)</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0.1"
                          max="2.5"
                          value={ssVal}
                          onChange={(e) => setSsVal(Number(e.target.value))}
                          className="w-full rounded-xl border border-border/80 dark:border-white/10 bg-background dark:bg-white/5 p-2.5 text-sm font-mono font-bold text-foreground dark:text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground dark:text-zinc-300">S1 (1.0 sn Periyot)</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0.05"
                          max="1.5"
                          value={s1Val}
                          onChange={(e) => setS1Val(Number(e.target.value))}
                          className="w-full rounded-xl border border-border/80 dark:border-white/10 bg-background dark:bg-white/5 p-2.5 text-sm font-mono font-bold text-foreground dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-5 space-y-6">
            {result ? (
              <section className="rounded-3xl border border-border/80 dark:border-white/10 bg-gradient-to-b from-card to-card/90 dark:from-[#171334] dark:to-[#0f0c23] p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-6 text-foreground dark:text-white">
                <div className="flex items-center justify-between border-b border-border/60 dark:border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-base font-bold">Zemin Sınıflandırma Sonucu</h2>
                  </div>
                  <button
                    onClick={handleCopyReport}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 dark:border-white/10 bg-background dark:bg-white/5 px-3 py-1.5 text-xs font-bold text-muted-foreground dark:text-zinc-300 hover:bg-muted dark:hover:bg-white/10 transition-all"
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? "Kopyalandı" : "Raporu Kopyala"}</span>
                  </button>
                </div>

                {/* Big Soil Class Badge */}
                <div className="rounded-2xl border border-purple-500/40 bg-purple-500/10 dark:bg-purple-500/20 p-6 text-center space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-300">
                    TBDY 2018 Yerel Zemin Sınıfı
                  </span>
                  <p className="text-5xl font-black tracking-tight text-purple-700 dark:text-white font-mono">
                    {result.soilClass}
                  </p>
                  <p className="text-xs font-bold text-foreground dark:text-zinc-200">
                    {result.className}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed text-muted-foreground dark:text-zinc-300">
                  {result.description}
                </p>

                {/* Spectral Coefficients */}
                {result.spectralCoefficients && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-border/60 dark:border-white/10 bg-muted/40 dark:bg-white/5 p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground dark:text-zinc-400">
                        Kısa Periyot Fs / SDS
                      </span>
                      <p className="mt-1 text-2xl font-black font-mono">
                        {result.spectralCoefficients.fs.toFixed(2)}
                      </p>
                      <span className="text-[10px] text-muted-foreground dark:text-zinc-400 font-mono">
                        SDS = {result.spectralCoefficients.sds.toFixed(3)}g
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border/60 dark:border-white/10 bg-muted/40 dark:bg-white/5 p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground dark:text-zinc-400">
                        1.0 sn Periyot F1 / SD1
                      </span>
                      <p className="mt-1 text-2xl font-black font-mono">
                        {result.spectralCoefficients.f1.toFixed(2)}
                      </p>
                      <span className="text-[10px] text-muted-foreground dark:text-zinc-400 font-mono">
                        SD1 = {result.spectralCoefficients.sd1.toFixed(3)}g
                      </span>
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5 text-xs text-muted-foreground dark:text-zinc-300">
                  {result.notes.map((note, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-purple-600 dark:text-purple-400">•</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>

                {/* Governing Normative Classification Check */}
                <div className="pt-2">
                  <GoverningCheckCard
                    label="TBDY 2018 Zemin Sınıfı Eşleşmesi"
                    demand={method === "vs30" ? vs30Val : method === "spt" ? sptVal : cuVal}
                    unit={method === "vs30" ? "m/s" : method === "spt" ? "darbe" : "kPa"}
                    status="ok"
                    explanation={`Değerlendirilen parametre: ${method.toUpperCase()} (${result.criteriaSummary.join(", ")}). TBDY 2018 Tablo 16.1 uyarınca "${result.soilClass} - ${result.className}" sınıfı doğrulanmıştır.`}
                  />
                </div>
              </section>
            ) : (
              <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card/80 p-6 text-center text-xs text-muted-foreground">
                Geçerli zemin parametreleri giriniz.
              </div>
            )}
          </div>
        </div>

        {/* Tool Limitations & Normative Bounds */}
        <div className="mt-8">
          <ToolLimitations
            scope={[
              "TBDY 2018 Tablo 16.1 uyarınca üst 30 metre ortalama kayma dalgası hızı (Vs30), standart penetrasyon (SPT-N60) veya drenajsız kayma dayanımı (cu) parametreleri ile yerel zemin sınıfı tayini",
              "TBDY 2018 Tablo 2.1 ve 2.2 yerel zemin etki katsayıları (Fs, F1) ve tasarım spektral ivmeleri (SDS, SD1) hesabı",
              "Kısa ve 1 saniye periyot tasarım katsayılarının zemin büyütmesi etkilerinin incelenmesi"
            ]}
            limitations={[
              "ZF zemin sınıfı (sıvılaşma potansiyeli, kalın organik kil, turba vb.) özel geoteknik saha araştırması ve sahaya özel deprem davranışı analizi gerektirir",
              "Vs30 hesaplanırken tabakalı zeminlerde harmonik ortalama formülü (30 / sum(hi/vi)) harici geoteknik rapordan alınmalıdır",
              "Heyelan veya dinamik şev stabilitesi risklerini kapsamaz"
            ]}
            inputProvenance="TBDY 2018 Türkiye Bina Deprem Yönetmeliği Bölüm 16 (Deprem Etkisi Altında Temel Zemini ve Temel Tasarımı) ve Tablo 16.1"
            defaultOpen={false}
          />
        </div>
      </div>
    </div>
  );
}
