"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, Copy, SlidersHorizontal, Info, Check } from "lucide-react";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { cn } from "@/lib/utils";
import {
  ToolScopeBadge,
  ToolSourceStamp,
  ToolLimitations,
  EngineeringDiagramFrame,
  GoverningCheckCard,
} from "@/components/engineering-primitives";

import { calculateEquivalentBaseShear, type SoilClass } from "@/lib/engineering/tbdy2018";

const SOIL_CLASSES: { id: SoilClass; name: string }[] = [
  { id: "ZA", name: "ZA (Sağlam Kayalık)" },
  { id: "ZB", name: "ZB (Kayalık)" },
  { id: "ZC", name: "ZC (Çok Sıkı Kum/Kil)" },
  { id: "ZD", name: "ZD (Orta Sıkı Kum/Kil)" },
  { id: "ZE", name: "ZE (Yumuşak Kil)" },
  { id: "ZF", name: "ZF (Özel)" },
];

const IMPORTANCE_FACTORS = [
  { name: "I = 1.2 (DKS 3 — Hastane, Okul)", value: 1.2 },
  { name: "I = 1.0 (DKS 2 — Normal Yapı)", value: 1.0 },
  { name: "I = 0.8 (DKS 1 — Depo, Basit)", value: 0.8 },
];

const BUILDING_SYSTEMS = [
  { name: "Betonarme Çerçeve (R=8)", r: 8 },
  { name: "Betonarme Perde-Çerçeve (R=7)", r: 7 },
  { name: "Betonarme Perde (R=6)", r: 6 },
  { name: "Çelik Çerçeve (R=8)", r: 8 },
  { name: "Yığma Bina (R=2.5)", r: 2.5 },
];

export function SeismicBaseShearCalculator() {
  const [ss, setSs] = useState(0.85); // Short period spectral acceleration (from AFAD maps)
  const [s1, setS1] = useState(0.25); // 1-second spectral acceleration
  const [soilClassIdx, setSoilClassIdx] = useState(2); // ZC
  const [importanceIdx, setImportanceIdx] = useState(1); // I=1.0
  const [systemIdx, setSystemIdx] = useState(0); // Betonarme Çerçeve
  const [totalWeightKn, setTotalWeightKn] = useState(5000);
  const [numFloors, setNumFloors] = useState(5);
  const [floorHeightM, setFloorHeightM] = useState(3.0);
  const [copied, setCopied] = useState(false);

  const selectedSoil = SOIL_CLASSES[soilClassIdx];
  const importance = IMPORTANCE_FACTORS[importanceIdx].value;
  const R = BUILDING_SYSTEMS[systemIdx].r;

  const results = useMemo(() => {
    const HN = numFloors * floorHeightM;
    const calc = calculateEquivalentBaseShear({
      ss,
      s1,
      soilClass: selectedSoil.id,
      importanceFactorI: importance,
      behaviorFactorR: R,
      totalWeightKn,
      numFloors,
      buildingHeightM: HN,
    });

    if (!calc) {
      return {
        SDs: "0.000",
        SD1: "0.000",
        TA: "0.000",
        TB: "0.000",
        T1emp: "0.000",
        HN: HN.toFixed(1),
        SaT1: "0.000",
        Sar: "0.000",
        Vt: "0.0",
        VtMin: "0.0",
        VtFinal: "0.0",
        floorForces: [],
        Fs: "0.00",
        F1: "0.00",
      };
    }

    const floorForcesFormatted = calc.floorForces.map((f) => ({
      floorNum: f.floorNumber,
      hi: f.floorHeightM,
      wi: f.floorWeightKn,
      Fi: f.lateralForceKn.toFixed(1),
    }));

    return {
      SDs: calc.sds.toFixed(3),
      SD1: calc.sd1.toFixed(3),
      TA: calc.ta.toFixed(3),
      TB: calc.tb.toFixed(3),
      T1emp: calc.empiricalPeriodTp.toFixed(3),
      HN: HN.toFixed(1),
      SaT1: calc.elasticSpectralAccelerationSae.toFixed(3),
      Sar: calc.reducedDesignSpectralAccelerationSar.toFixed(4),
      Vt: calc.calculatedBaseShearKn.toFixed(1),
      VtMin: calc.minimumBaseShearKn.toFixed(1),
      VtFinal: calc.designBaseShearKn.toFixed(1),
      floorForces: floorForcesFormatted,
      Fs: calc.fs.toFixed(2),
      F1: calc.f1.toFixed(2),
    };
  }, [ss, s1, soilClassIdx, importanceIdx, systemIdx, totalWeightKn, numFloors, floorHeightM, selectedSoil, importance, R]);

  const handleCopyReport = () => {
    const text = `TBDY 2018 EŞDEĞER DEPREM YÜK YÖNTEMİ — TABAN KESME KUVVETİ
-----------------------------------------------------------
Sahaya Özel Zemin Katsayıları:
  SS (Kısa Periyot): ${ss}  |  S1 (1 sn): ${s1}
  Yerel Zemin Sınıfı: ${SOIL_CLASSES[soilClassIdx].name}
  Kısa Periyot Tasarım İvmesi (SDs): ${results.SDs}
  Uzun Periyot Tasarım İvmesi (SD1): ${results.SD1}
  Periyot Sınırları: TA=${results.TA}s / TB=${results.TB}s / TL=6.00s

Yapı Bilgileri:
  Toplam Yapı Ağırlığı (W): ${totalWeightKn} kN
  Kat Sayısı: ${numFloors}  |  Kat Yüksekliği: ${floorHeightM} m
  Bina Yüksekliği (HN): ${results.HN} m
  Ampirik Doğal Periyot (T1): ${results.T1emp} s
  Taşıyıcı Sistem: ${BUILDING_SYSTEMS[systemIdx].name}
  Deprem Tasarım Sınıfı (I): ${IMPORTANCE_FACTORS[importanceIdx].value}

SONUÇ:
  Spektral Tepki İvmesi: Sa(T1)=${results.SaT1}
  Azaltılmış Deprem Talebi: Sar=${results.Sar}
  Hesaplanan Vt: ${results.Vt} kN
  Min. Vt (0.04·I·SDS·W): ${results.VtMin} kN
  TASARIM TABAN KESME KUVVETİ: Vt = ${results.VtFinal} kN
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="tool-page-shell relative min-h-screen py-8 md:py-14 text-foreground">
      {/* Cosmic Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-[120px] dark:from-purple-600/25" />
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8">
        <PageContextNavigation
          showBreadcrumbs={false}
          className="mb-8"
          backLinkClassName="inline-flex items-center gap-2 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#120f28]/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-200 backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-card dark:hover:bg-[#1b173b] hover:text-foreground dark:hover:text-white"
        />

        {/* Hero Header Card */}
        <section className="relative overflow-hidden rounded-[32px] border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/85 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <ToolScopeBadge kind="check" />
                <ToolSourceStamp sources={["TBDY 2018 Bölüm 4.7"]} tier="A" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
                Eşdeğer Deprem Yükü &{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400">
                  Taban Kesme Kuvveti
                </span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground dark:text-zinc-300 md:text-base">
                TBDY 2018 Denklem 4.1: Eşdeğer deprem yükü yöntemi ile kat deprem kuvvetleri ve toplam taban kesme kuvveti hesabı.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shrink-0">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Inputs */}
          <div className="space-y-6 lg:col-span-7">
            <section className="tool-panel rounded-[32px] p-6 sm:p-8">
              <div className="flex items-center gap-2.5 border-b border-border/70 dark:border-white/10 pb-4">
                <SlidersHorizontal className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-black text-foreground dark:text-white">TBDY 2018 Parametreleri</h2>
              </div>

              <div className="mt-6 space-y-5">
                {/* AFAD info alert */}
                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 text-xs text-purple-200 flex gap-3">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-purple-400" />
                  <span>Sₛ ve S₁ spektral ivme katsayılarını AFAD Türkiye Deprem Tehlike Haritası&apos;ndan elde edin (DD-2 deprem düzeyi, 50 yılda %10 aşılma olasılığı).</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                        Kısa Periyot Sₛ
                      </label>
                      <span className="font-mono text-xs font-black text-purple-400">{ss.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={3.0}
                      step={0.05}
                      value={ss}
                      onChange={(e) => setSs(Number(e.target.value))}
                      className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                    />
                  </div>

                  <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                        1 sn Periyot S₁
                      </label>
                      <span className="font-mono text-xs font-black text-purple-400">{s1.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.05}
                      max={1.5}
                      step={0.05}
                      value={s1}
                      onChange={(e) => setS1(Number(e.target.value))}
                      className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                    />
                  </div>
                </div>

                {/* Soil Class */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Yerel Zemin Sınıfı (TBDY 2018 Tablo 16.1)
                  </label>
                  <div className="mt-2.5 grid grid-cols-3 gap-2">
                    {SOIL_CLASSES.map((sc, idx) => (
                      <button
                        key={sc.name}
                        type="button"
                        onClick={() => setSoilClassIdx(idx)}
                        className={cn(
                          "rounded-xl border px-2.5 py-3 text-xs font-bold transition-all text-center",
                          soilClassIdx === idx
                            ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.35)] border-transparent"
                            : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-300 hover:border-purple-500/40 hover:text-white",
                        )}
                      >
                        {sc.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground dark:text-zinc-400">Seçili: {SOIL_CLASSES[soilClassIdx].name}</p>
                </div>

                {/* Structural System */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Taşıyıcı Sistem (R Katsayısı)
                  </label>
                  <select
                    value={systemIdx}
                    onChange={(e) => setSystemIdx(Number(e.target.value))}
                    className="tool-input mt-2 w-full h-12 text-foreground dark:text-white font-bold"
                  >
                    {BUILDING_SYSTEMS.map((bs, idx) => (
                      <option key={bs.name} value={idx} className="bg-card dark:bg-[#16132e] text-foreground dark:text-white">
                        {bs.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Importance */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Bina Önem Katsayısı (I)
                  </label>
                  <div className="mt-2.5 space-y-2">
                    {IMPORTANCE_FACTORS.map((f, idx) => (
                      <label
                        key={f.name}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
                          importanceIdx === idx
                            ? "border-purple-500/50 bg-purple-500/15 text-white"
                            : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-300 hover:border-purple-500/30",
                        )}
                      >
                        <input
                          type="radio"
                          name="importance"
                          checked={importanceIdx === idx}
                          onChange={() => setImportanceIdx(idx)}
                          className="accent-[#a855f7]"
                        />
                        <span className="text-xs sm:text-sm font-semibold">{f.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Building loads */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-3.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">Yapı Ağırlığı W (kN)</label>
                      <span className="font-mono text-xs font-black text-purple-400">{totalWeightKn}</span>
                    </div>
                    <input
                      type="range"
                      min={500}
                      max={50000}
                      step={500}
                      value={totalWeightKn}
                      onChange={(e) => setTotalWeightKn(Number(e.target.value))}
                      className="mt-2.5 w-full cursor-pointer accent-[#a855f7]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">Kat Sayısı N</label>
                    <input
                      type="number"
                      value={numFloors}
                      onChange={(e) => setNumFloors(Number(e.target.value))}
                      min={1}
                      max={30}
                      className="tool-input mt-2 w-full h-11 text-foreground dark:text-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">Kat Yük. h (m)</label>
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
              </div>
            </section>
          </div>

          {/* Results Column */}
          <div className="space-y-6 lg:col-span-5">
            <section className="tool-panel rounded-[32px] p-6 sm:p-8">
              {/* Vt Terminal Banner */}
              <div className="tool-result-panel overflow-hidden rounded-2xl p-6 text-center text-white">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-200">
                  Tasarım Taban Kesme Kuvveti
                </span>
                <div className="mt-2 font-mono text-4xl sm:text-5xl font-black text-white drop-shadow-[0_0_20px_rgba(192,132,252,0.45)]">
                  {results.VtFinal} <span className="text-xl font-semibold text-purple-300">kN</span>
                </div>
                <div className="mt-2 text-xs font-mono text-zinc-300">
                  T₁ = {results.T1emp} s | Sa(T₁) = {results.SaT1} | Sar = {results.Sar}
                </div>
              </div>

              {/* Spectral params */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                <div className="tool-result-inner rounded-xl p-3">
                  <span className="text-zinc-400">S_DS (Kısa Periyot)</span>
                  <div className="font-mono text-base font-black text-white">{results.SDs}</div>
                </div>
                <div className="tool-result-inner rounded-xl p-3">
                  <span className="text-zinc-400">S_D1 (1 sn Periyot)</span>
                  <div className="font-mono text-base font-black text-white">{results.SD1}</div>
                </div>
                <div className="tool-result-inner rounded-xl p-3">
                  <span className="text-zinc-400">T_A / T_B Limit</span>
                  <div className="font-mono text-base font-black text-purple-300">{results.TA} / {results.TB} s</div>
                </div>
                <div className="tool-result-inner rounded-xl p-3">
                  <span className="text-zinc-400">Bina Yük. H_N</span>
                  <div className="font-mono text-base font-black text-white">{results.HN} m</div>
                </div>
              </div>

              {/* TBDY 2018 Governing Check Card */}
              <div className="mt-4">
                <GoverningCheckCard
                  label="TBDY 2018 Taban Kesme Alt Sınır Tahkiki"
                  demand={Number(results.Vt)}
                  capacity={Number(results.VtMin)}
                  unit="kN"
                  status={Number(results.Vt) >= Number(results.VtMin) ? "ok" : "warn"}
                  explanation={
                    Number(results.Vt) >= Number(results.VtMin)
                      ? `Hesaplanan Vt (${results.Vt} kN), TBDY 2018 Denklem 4.6 alt sınırından (${results.VtMin} kN) büyüktür. Tasarım taban kesmesi doğrudan hesaplanan değer olarak uygulanır.`
                      : `Hesaplanan Vt (${results.Vt} kN), TBDY 2018 Denklem 4.6 alt sınırının (${results.VtMin} kN) altında kaldığı için tasarım taban kesmesi alt sınıra (${results.VtMin} kN) yükseltilmiştir.`
                  }
                />
              </div>

              {/* Bina ve Kat Yanal Deprem Kuvvetleri Görseli */}
              <div className="mt-4">
                <EngineeringDiagramFrame
                  title={`Bina Kat Deprem Kuvvetleri Dağılımı (${numFloors} Kat, Hn = ${results.HN} m)`}
                  subtitle="Ters üçgen / parabolik eşdeğer kat kuvvetleri Fi ve taban tepkisi Vt"
                  accessibleFallbackText={`Toplam ${numFloors} katlı bina. Taban kesme kuvveti ${results.VtFinal} kN.`}
                >
                  <svg viewBox="0 0 340 220" className="w-full max-w-[340px] h-auto select-none">
                    {/* Zemin Çizgisi ve Tarama */}
                    <line x1="20" y1="190" x2="320" y2="190" stroke="#a855f7" strokeWidth="2.5" />
                    <line x1="40" y1="190" x2="25" y2="205" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="80" y1="190" x2="65" y2="205" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="120" y1="190" x2="105" y2="205" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="160" y1="190" x2="145" y2="205" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="200" y1="190" x2="185" y2="205" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="240" y1="190" x2="225" y2="205" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="280" y1="190" x2="265" y2="205" stroke="#94a3b8" strokeWidth="1.5" />

                    {/* Bina Gövdesi */}
                    <rect x="70" y="30" width="100" height="160" rx="4" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />

                    {/* Kat Çizgileri ve Kuvvet Okları */}
                    {results.floorForces.map((f, idx) => {
                      const totalCount = results.floorForces.length;
                      const yPos = 190 - ((idx + 1) / totalCount) * 150;
                      const forceVal = Number(f.Fi) || 1;
                      const maxForce = Math.max(...results.floorForces.map((ff) => Number(ff.Fi) || 1));
                      const arrowLen = Math.max(25, Math.min(100, (forceVal / maxForce) * 90));
                      const startX = 170;
                      const endX = startX + arrowLen;

                      return (
                        <g key={f.floorNum}>
                          {/* Kat Döşeme Çizgisi */}
                          <line x1="70" y1={yPos} x2="170" y2={yPos} stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 2" />
                          <text x="75" y={yPos - 3} fill="#c7d2fe" fontSize="8" fontFamily="monospace">
                            K{f.floorNum}
                          </text>

                          {/* Kuvvet Oku Fi (Sağa Doğru) */}
                          <line x1={startX} y1={yPos} x2={endX} y2={yPos} stroke="#ec4899" strokeWidth="2" />
                          <polygon
                            points={`${endX},${yPos} ${endX - 6},${yPos - 3.5} ${endX - 6},${yPos + 3.5}`}
                            fill="#ec4899"
                          />
                          <text x={endX + 4} y={yPos + 3} fill="#f472b6" fontSize="9" fontWeight="bold" fontFamily="monospace">
                            {f.Fi} kN
                          </text>
                        </g>
                      );
                    })}

                    {/* Taban Kesme Reaksiyon Oku (Sola Doğru Taban Reaksiyonu) */}
                    <line x1="170" y1="185" x2="35" y2="185" stroke="#a855f7" strokeWidth="3" />
                    <polygon points="35,185 43,181 43,189" fill="#a855f7" />
                    <text x="90" y="180" fill="#d8b4fe" fontSize="10" fontWeight="black" fontFamily="monospace">
                      Vt = {results.VtFinal} kN
                    </text>
                  </svg>
                </EngineeringDiagramFrame>
              </div>

              {/* Floor Forces Table */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-border/80 dark:border-white/10">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 dark:bg-white/5 border-b border-border/70 dark:border-white/10">
                      <th className="p-3 text-left font-bold text-foreground dark:text-zinc-200">Kat</th>
                      <th className="p-3 text-right font-bold text-foreground dark:text-zinc-200">h (m)</th>
                      <th className="p-3 text-right font-bold text-foreground dark:text-zinc-200">Fi (kN)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.floorForces.slice().reverse().map((f) => (
                      <tr key={f.floorNum} className="border-t border-border/60 dark:border-white/[0.06] hover:bg-muted/20 dark:hover:bg-white/[0.02]">
                        <td className="p-3 font-mono font-bold text-foreground dark:text-white">{f.floorNum}. Kat</td>
                        <td className="p-3 text-right font-mono text-muted-foreground dark:text-zinc-300">{f.hi.toFixed(1)}</td>
                        <td className="p-3 text-right font-mono font-black text-purple-400">{f.Fi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all active:scale-98"
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
              "TBDY 2018 Bölüm 4.7 uyarınca Eşdeğer Deprem Yükü Yöntemi ile toplam taban kesme kuvveti (Vt)",
              "Kat ağırlıkları (wi) ve kat kotlarına (hi) göre kat yatay eşdeğer deprem kuvvetleri (Fi) dağılımı",
              "TBDY 2018 Denklem 4.6 uyarınca taban kesme kuvveti alt sınır tahkiki (Vt,min)",
              "Sae(T) yatay elastik tasarım ivme spektrumu ve azaltılmış tasarım ivmesi SaR(T)"
            ]}
            limitations={[
              "TBDY 2018 Tablo 4.4 bina yükseklik sınıfı (BYS) ve düzensizlik şartlarına göre mod birleştirme gereksinimi kontrol edilmelidir",
              "Bodrumlu binalarda iki yüklemeli hesap yöntemi (Rijit bodrum kütlesi) için harici analiz gerekir",
              "Düşey deprem etkisi (Ez) veya 3D burulma etkilerini içermez"
            ]}
            inputProvenance="TBDY 2018 Türkiye Bina Deprem Yönetmeliği Bölüm 4 (Deprem Etkisi Altında Binaların Doğrusal Hesabı) ve AFAD Deprem Tehlike Haritası"
            defaultOpen={false}
          />
        </div>
      </div>
    </div>
  );
}
