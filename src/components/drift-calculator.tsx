"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MoveHorizontal, CheckCircle2, AlertTriangle, Copy, SlidersHorizontal, Check } from "lucide-react";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { cn } from "@/lib/utils";

import { calculateStoryDrift, type InfillJointType } from "@/lib/engineering/tbdy2018/drift";
import {
  ToolScopeBadge,
  ToolSourceStamp,
  ToolLimitations,
  GoverningCheckCard,
} from "@/components/engineering-primitives";

export function DriftCalculator() {
  const [numFloors, setNumFloors] = useState(5);
  const [floorHeightM, setFloorHeightM] = useState(3.0);
  const [lambda, setLambda] = useState(1.0); // Mod combination factor
  const [ductilityClass, setDuctilityClass] = useState<"YDKT" | "KDKT">("YDKT");

  // Per-floor relative displacement inputs (delta_i - delta_{i-1}) in mm
  const [floorDeltas, setFloorDeltas] = useState<number[]>(() =>
    Array.from({ length: 8 }, (_, i) => 8 + i * 2)
  );

  const [copied, setCopied] = useState(false);

  // Drift limit per TBDY 2018 Table 4.3
  const driftLimit = ductilityClass === "YDKT" ? 0.016 : 0.008;

  const results = useMemo(() => {
    const floorInputs: Array<{ floorNumber: number; floorHeightM: number; displacementMm: number }> = [];
    let cumulativeDisp = 0;
    for (let i = 0; i < numFloors; i++) {
      const deltaImm = floorDeltas[i] ?? 10;
      cumulativeDisp += deltaImm;
      floorInputs.push({
        floorNumber: i + 1,
        floorHeightM,
        displacementMm: cumulativeDisp,
      });
    }

    const calc = calculateStoryDrift({
      infillJointType: ductilityClass === "YDKT" ? "flexible" : "brittle",
      lambdaFactor: lambda,
      floors: floorInputs,
    });

    if (!calc) return [];

    return calc.stories.map((s) => ({
      floorNum: s.floorNumber,
      hi: s.floorHeightM,
      deltaImm: s.interstoryDriftDeltaMm,
      ratio: s.driftRatio.toFixed(5),
      pct: s.driftPercent.toFixed(3),
      isSafe: s.isSafe,
    }));
  }, [numFloors, floorHeightM, floorDeltas, lambda, ductilityClass]);

  const setDelta = (idx: number, val: number) => {
    setFloorDeltas((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const allSafe = results.every((f) => f.isSafe);

  const handleCopy = () => {
    const lines = results
      .map(
        (f) =>
          `  Kat ${f.floorNum}: δi=${f.deltaImm}mm / hi=${f.hi}m → λΔi/hi=${f.ratio} (${f.isSafe ? "OK" : "AŞILDI"})`,
      )
      .join("\n");
    navigator.clipboard.writeText(
      `TBDY 2018 GÖRELİ KAT ÖTELEMESİ (DRIFT) KONTROL RAPORU\n-------------------------------------------------------\nSınır: ${driftLimit} (${ductilityClass})\n${lines}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-page-shell relative min-h-screen py-8 md:py-14 text-foreground">
      {/* Cosmic Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-[120px] dark:from-purple-600/25" />
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
        <PageContextNavigation
          showBreadcrumbs={false}
          className="mb-8"
          backLinkClassName="inline-flex items-center gap-2 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#120f28]/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-200 backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-card dark:hover:bg-[#1b173b] hover:text-foreground dark:hover:text-white"
        />

        {/* Hero Header Card */}
        <section className="relative overflow-hidden rounded-[32px] border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/85 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <ToolScopeBadge kind="check" />
                <ToolSourceStamp sources={["TBDY 2018 Tablo 4.3", "TBDY 2018 Madde 4.9.1"]} tier="A" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
                Göreli Kat Ötelemesi{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400">
                  (Drift) Kontrolü
                </span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground dark:text-zinc-300 md:text-base">
                TBDY 2018 Tablo 4.3: λ · Δᵢ / hᵢ ≤ 0.008 (kırılgan dolgu) veya 0.016 (esnek bağlantı) sınırı tahkiki.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shrink-0">
              <MoveHorizontal className="h-6 w-6" />
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Inputs */}
          <div className="space-y-6 lg:col-span-5">
            <section className="tool-panel rounded-[32px] p-6 sm:p-8">
              <div className="flex items-center gap-2.5 border-b border-border/70 dark:border-white/10 pb-4">
                <SlidersHorizontal className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-black text-foreground dark:text-white">Genel Parametreler</h2>
              </div>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Kat Sayısı
                    </label>
                    <input
                      type="number"
                      value={numFloors}
                      onChange={(e) => setNumFloors(Math.min(8, Math.max(1, Number(e.target.value))))}
                      min={1}
                      max={8}
                      className="tool-input mt-2 w-full h-11 text-foreground dark:text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Kat Yük. h (m)
                    </label>
                    <input
                      type="number"
                      value={floorHeightM}
                      onChange={(e) => setFloorHeightM(Number(e.target.value))}
                      min={2.5}
                      max={6}
                      step={0.1}
                      className="tool-input mt-2 w-full h-11 text-foreground dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Cephe Dolgu Kırılganlık Sınıfı
                  </label>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    {[
                      { id: "YDKT", label: "YDKT (Esnek ≤0.016)" },
                      { id: "KDKT", label: "KDKT (Kırılgan ≤0.008)" },
                    ].map((dc) => (
                      <button
                        key={dc.id}
                        type="button"
                        onClick={() => setDuctilityClass(dc.id as "YDKT" | "KDKT")}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-xs font-bold transition-all text-center",
                          ductilityClass === dc.id
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.35)] border-transparent"
                            : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-300 hover:border-purple-500/40 hover:text-white",
                        )}
                      >
                        {dc.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Mod Birleşim Katsayısı λ
                    </label>
                    <span className="font-mono text-xs font-black text-purple-400">{lambda.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.05}
                    value={lambda}
                    onChange={(e) => setLambda(Number(e.target.value))}
                    className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                  />
                </div>

                {/* Per-floor delta inputs */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Kat Göreli Ötelemesi Δᵢ (mm)
                  </label>
                  <div className="mt-2.5 space-y-2">
                    {Array.from({ length: numFloors }, (_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-14 text-xs font-bold text-muted-foreground dark:text-zinc-400 font-mono">
                          {i + 1}. Kat
                        </span>
                        <input
                          type="number"
                          value={floorDeltas[i] ?? 10}
                          onChange={(e) => setDelta(i, Number(e.target.value))}
                          min={0}
                          max={500}
                          className="tool-input w-full h-10 px-3 text-xs font-mono font-bold text-foreground dark:text-white"
                        />
                        <span className="text-xs text-purple-300 font-bold">mm</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Results */}
          <div className="space-y-6 lg:col-span-7">
            <section className="tool-panel rounded-[32px] p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-border/70 dark:border-white/10 pb-4 mb-5">
                <span className="text-base font-black text-foreground dark:text-white">
                  Kat Bazlı Tahkik Sonuçları
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold uppercase tracking-wider border",
                    allSafe
                      ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                      : "border-rose-500/40 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]",
                  )}
                >
                  {allSafe ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                      Tüm Katlar Uygun
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-300" />
                      Sınır Aşımı Var
                    </>
                  )}
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border/80 dark:border-white/10">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 dark:bg-white/5 border-b border-border/70 dark:border-white/10">
                      <th className="p-3 text-left font-bold text-foreground dark:text-zinc-200">Kat</th>
                      <th className="p-3 text-right font-bold text-foreground dark:text-zinc-200">Δᵢ (mm)</th>
                      <th className="p-3 text-right font-bold text-foreground dark:text-zinc-200">λΔᵢ/hᵢ</th>
                      <th className="p-3 text-right font-bold text-foreground dark:text-zinc-200">
                        % (Sınır %{driftLimit * 100})
                      </th>
                      <th className="p-3 text-center font-bold text-foreground dark:text-zinc-200">Durum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((f) => (
                      <tr
                        key={f.floorNum}
                        className="border-t border-border/60 dark:border-white/[0.06] hover:bg-muted/20 dark:hover:bg-white/[0.02]"
                      >
                        <td className="p-3 font-mono font-bold text-foreground dark:text-white">{f.floorNum}. Kat</td>
                        <td className="p-3 text-right font-mono text-muted-foreground dark:text-zinc-300">{f.deltaImm}</td>
                        <td className="p-3 text-right font-mono text-muted-foreground dark:text-zinc-300">{f.ratio}</td>
                        <td className="p-3 text-right font-mono font-black text-foreground dark:text-white">{f.pct}%</td>
                        <td className="p-3 text-center">
                          {f.isSafe ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="mx-auto h-4 w-4 text-rose-400" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bar chart visualization */}
              <div className="mt-5 rounded-2xl border border-purple-500/20 bg-[#0b0a1a] p-4">
                <span className="text-[11px] font-mono text-purple-300 font-bold">
                  Kat Drift Oranları — Sınır: %{(driftLimit * 100).toFixed(1)}
                </span>
                <div className="mt-3.5 space-y-2">
                  {results.map((f) => {
                    const pct = Math.min(100, (Number(f.ratio) / driftLimit) * 100);
                    return (
                      <div key={f.floorNum} className="flex items-center gap-3">
                        <span className="w-12 text-right text-xs font-bold text-zinc-400 font-mono">
                          {f.floorNum}. Kat
                        </span>
                        <div className="flex-1 h-3.5 rounded-full bg-[#181432] overflow-hidden p-0.5 border border-white/10">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              f.isSafe
                                ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                                : "bg-gradient-to-r from-rose-500 to-red-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "w-14 text-right text-xs font-mono font-bold",
                            f.isSafe ? "text-emerald-400" : "text-rose-400",
                          )}
                        >
                          {f.pct}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Governing Check Card for governing story */}
              {results.length > 0 && (() => {
                const maxDrift = results.reduce((prev, curr) => Number(curr.ratio) > Number(prev.ratio) ? curr : prev, results[0]);
                return (
                  <div className="mt-5">
                    <GoverningCheckCard
                      label={`TBDY 2018 Göreli Kat Ötelemesi (${maxDrift.floorNum}. Kat Kritik)`}
                      demand={Number(maxDrift.ratio)}
                      capacity={driftLimit}
                      utilization={driftLimit > 0 ? Number(maxDrift.ratio) / driftLimit : undefined}
                      status={allSafe ? "ok" : "fail"}
                      explanation={
                        allSafe
                          ? `Tüm katlar TBDY Tablo 4.3 sınırını (lambda*Delta_i/hi <= ${driftLimit}) sağlamaktadır. Maksimum öteleme oranı ${maxDrift.floorNum}. katta (%${maxDrift.pct}) gerçekleşmiştir.`
                          : `Kritik katta (${maxDrift.floorNum}. kat) öteleme oranı %${maxDrift.pct} olup izin verilen %${(driftLimit * 100).toFixed(1)} sınırını aşmaktadır!`
                      }
                    />
                  </div>
                );
              })()}

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all active:scale-98"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Rapor Kopyalandı!" : "Hesap Raporunu Kopyala"}
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Tool Limitations & Normative Bounds */}
        <div className="mt-8">
          <ToolLimitations
            scope={[
              "TBDY 2018 Tablo 4.3 uyarınca göreli kat ötelemelerinin (lambda * Delta_i / hi) sınır değerlerle tahkiki",
              "Esnek derzli bağlantılar (YDKT <= 0.016) ve gevrek dolgu duvarlı (KDKT <= 0.008) durumlar",
              "Mod birleştirme katsayısı (lambda) ile tasarım göreli kat ötelemelerinin değerlendirilmesi"
            ]}
            limitations={[
              "Kat ötelemeleri 3 boyutlu dinamik analiz programı çıktılarından alınmalıdır",
              "İkinci mertebe etkileri (theta_II gösterge katsayısı) harici olarak TBDY Madde 4.9.2 uyarınca tahkik edilmelidir",
              "Bodrum kat çevre perdelerinin rijit diyafram kabulü haricen incelenmelidir"
            ]}
            inputProvenance="TBDY 2018 Türkiye Bina Deprem Yönetmeliği Tablo 4.3 ve Madde 4.9.1"
            defaultOpen={false}
          />
        </div>
      </div>
    </div>
  );
}
