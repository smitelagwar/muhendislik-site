"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TreePine,
  ShieldCheck,
  AlertTriangle,
  Info,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import {
  calculateTimberMember,
  type TimberGrade,
  type LoadDurationClass,
} from "@/lib/engineering/timber/timber-member";

export function TimberMemberCalculator() {
  const [grade, setGrade] = useState<TimberGrade>("C24");
  const [duration, setDuration] = useState<LoadDurationClass>("medium");
  const [widthMm, setWidthMm] = useState(100);
  const [heightMm, setHeightMm] = useState(200);
  const [lengthM, setLengthM] = useState(4.0);
  const [uniformLoadKnM, setUniformLoadKnM] = useState(3.5);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    return calculateTimberMember({
      grade,
      durationClass: duration,
      widthMm,
      heightMm,
      lengthM,
      uniformLoadKnM,
    });
  }, [grade, duration, widthMm, heightMm, lengthM, uniformLoadKnM]);

  const handleCopyReport = () => {
    const text = `TS EN 1995-1-1 (EUROCODE 5) AHŞAP ELEMAN HESAP RAPORU
-------------------------------------------------------
Ahşap Sınıfı: ${grade} | Yük Süresi: ${duration}
Kesit: ${widthMm} x ${heightMm} mm | Açıklık: ${lengthM} m
Yayılı Yük: ${uniformLoadKnM} kN/m

TAHKİKLER:
Eğilme Momenti: Med = ${result?.designBendingMomentMedKnm.toFixed(2)} kNm
Eğilme Gerilmesi: σm,d = ${result?.bendingStressSigmaMDMpa.toFixed(2)} MPa / fmd = ${result?.fmdMpa.toFixed(2)} MPa (%${((result?.bendingUtilization ?? 0) * 100).toFixed(1)})
Kesme Gerilmesi: τd = ${result?.shearStressTauDMpa.toFixed(2)} MPa / fvd = ${result?.fvdMpa.toFixed(2)} MPa (%${((result?.shearUtilization ?? 0) * 100).toFixed(1)})
Anlık Sehim: w_inst = ${result?.instantaneousDeflectionMm.toFixed(1)} mm (Sınır L/300 = ${result?.deflectionLimitMm.toFixed(1)} mm)
DURUM: ${result?.isOverallSafe ? "GÜVENLİ VE UYGUN" : "KAPASİTE/SEHİM AŞILDI"}
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
                <TreePine className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">
                Ahşap Yapılar
              </span>
              <span className="rounded-full border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#1e193d] px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                TS EN 1995-1-1 / TS 647
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              Ahşap Kiriş & Dikme Hesabı
            </h1>

            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-zinc-300">
              Eurocode 5 (TS EN 1995-1-1) standartlarına göre masif ahşap ve lamine (glulam) kirişlerde eğilme mukavemeti, kayma gerilmesi ve sehim sınır durumu tahkiklerini gerçekleştirin.
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
                  Eleman & Yük Bilgileri
                </h2>
              </div>

              {/* Material & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300 mb-2">
                    Ahşap Mukavemet Sınıfı
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["C18", "C24", "C30", "GL24h"] as TimberGrade[]).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        className={`rounded-xl border py-2 text-xs font-bold transition-all ${
                          grade === g
                            ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                            : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-400 hover:border-purple-500/40"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300 mb-2">
                    Yük Süresi Sınıfı (kmod)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as LoadDurationClass)}
                    className="w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2.5 text-xs font-bold text-foreground dark:text-white"
                  >
                    <option value="permanent">Kalıcı Yük (kmod = 0.60)</option>
                    <option value="medium">Orta Süreli (kmod = 0.80)</option>
                    <option value="short">Kısa Süreli / Kar (kmod = 0.90)</option>
                  </select>
                </div>
              </div>

              {/* Geometry */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Genişlik b (mm)
                  </label>
                  <input
                    type="number"
                    min={40}
                    step={10}
                    value={widthMm}
                    onChange={(e) => setWidthMm(Math.max(40, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Yükseklik h (mm)
                  </label>
                  <input
                    type="number"
                    min={80}
                    step={10}
                    value={heightMm}
                    onChange={(e) => setHeightMm(Math.max(80, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Açıklık L (m)
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={0.5}
                    value={lengthM}
                    onChange={(e) => setLengthM(Math.max(0.5, Number(e.target.value)))}
                    className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                  />
                </div>
              </div>

              {/* Load */}
              <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Kiriş Üzerindeki Eşdeğer Yayılı Yük (kN/m)
                  </label>
                  <span className="font-mono text-sm font-black text-purple-400">{uniformLoadKnM} kN/m</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={uniformLoadKnM}
                  onChange={(e) => setUniformLoadKnM(Number(e.target.value))}
                  className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                />
              </div>
            </section>
          </div>

          {/* Results */}
          <div className="space-y-6 lg:col-span-5">
            <section className="tool-result-panel rounded-[32px] p-6 sm:p-8 text-white space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-black">Hesaplama Sonuçları</h3>
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
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300">
                        Kesit Güvenlik Durumu
                      </span>
                      <h4 className="text-xl font-black mt-0.5">
                        {result.isOverallSafe ? "GÜVENLİ VE UYGUN" : "KAPASİTE/SEHİM AŞILDI"}
                      </h4>
                    </div>
                    <div
                      className={`rounded-full p-2.5 ${
                        result.isOverallSafe
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      }`}
                    >
                      {result.isOverallSafe ? <ShieldCheck className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                        Eğilme Gerilmesi (σm,d)
                      </span>
                      <p className="mt-1 text-2xl font-black font-mono">
                        {result.bendingStressSigmaMDMpa.toFixed(2)} <span className="text-xs text-zinc-400">MPa</span>
                      </p>
                      <span className="text-[10px] text-zinc-400">
                        fmd = {result.fmdMpa.toFixed(2)} MPa (%{(result.bendingUtilization * 100).toFixed(0)})
                      </span>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                        Anlık Sehim (w)
                      </span>
                      <p className="mt-1 text-2xl font-black font-mono">
                        {result.instantaneousDeflectionMm.toFixed(1)} <span className="text-xs text-zinc-400">mm</span>
                      </p>
                      <span className="text-[10px] text-zinc-400">
                        Sınır = {result.deflectionLimitMm.toFixed(1)} mm
                      </span>
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
