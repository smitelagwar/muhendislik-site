"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Layers, Copy, SlidersHorizontal, Check } from "lucide-react";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { cn } from "@/lib/utils";

const SOIL_TYPES = [
  { name: "Kum (Gevşek)", Ka: 0.36, gamma: 16 },
  { name: "Kum (Sıkı)", Ka: 0.26, gamma: 18 },
  { name: "Killi Zemin", Ka: 0.33, gamma: 17 },
  { name: "Çakıl (Sıkı)", Ka: 0.22, gamma: 19 },
  { name: "Kaya", Ka: 0.14, gamma: 22 },
];

export function RetainingWallCalculator() {
  const [soilTypeIdx, setSoilTypeIdx] = useState(0);
  const [excavationDepthM, setExcavationDepthM] = useState(5);
  const [surchargeKpa, setSurchargeKpa] = useState(10);
  const [waterTableM, setWaterTableM] = useState(10);
  const [copied, setCopied] = useState(false);

  const soil = SOIL_TYPES[soilTypeIdx];

  const results = useMemo(() => {
    const H = excavationDepthM;
    const Ka = soil.Ka;
    const gamma = soil.gamma; // kN/m³
    const q = surchargeKpa; // kNm²
    const gammaW = 10; // kN/m³ water

    // Active earth pressure at depth z: pa(z) = Ka * (gamma*z + q)
    const paBase = Ka * (gamma * H + q); // kPa at base
    const paTop = Ka * q; // kPa at top (sürşarj)

    // Total active force per unit length (trapezoid):
    const EaSurcharge = Ka * q * H;
    const EaSoil = 0.5 * Ka * gamma * H * H;
    const EaTotal = EaSurcharge + EaSoil;

    // Resultant height from base:
    const yResultant = (EaSoil * (H / 3) + EaSurcharge * (H / 2)) / EaTotal;

    // Overturning moment about base:
    const Moverturning = EaTotal * yResultant;

    // Hydrostatic pressure if water table within excavation
    const hwM = Math.max(0, H - waterTableM);
    const EaWater = 0.5 * gammaW * hwM * hwM;
    const EaTotalWithWater = EaTotal + EaWater;
    const MtotalWithWater = Moverturning + (EaWater * hwM) / 3;

    // Passive pressure at base (simplified)
    const phi = Math.asin(1 - 2 * Ka);
    const Kp = Math.pow(Math.tan(Math.PI / 4 + phi / 2), 2);
    const passiveDepthM = H * 0.3;
    const EpBase = 0.5 * Kp * gamma * passiveDepthM * passiveDepthM;

    return {
      Ka: Ka.toFixed(3),
      Kp: Kp.toFixed(3),
      paTop: paTop.toFixed(1),
      paBase: paBase.toFixed(1),
      EaSurcharge: EaSurcharge.toFixed(1),
      EaSoil: EaSoil.toFixed(1),
      EaTotal: EaTotal.toFixed(1),
      EaTotalWithWater: EaTotalWithWater.toFixed(1),
      MtotalWithWater: MtotalWithWater.toFixed(1),
      EpBase: EpBase.toFixed(1),
      yResultant: yResultant.toFixed(2),
      Moverturning: Moverturning.toFixed(1),
    };
  }, [soilTypeIdx, excavationDepthM, surchargeKpa, waterTableM, soil]);

  const handleCopy = () => {
    const text = `İKSA PERDESİ TOPRAK BASINCI HESABI (Rankine)
----------------------------------------------
Zemin: ${SOIL_TYPES[soilTypeIdx].name} | Ka=${results.Ka} | Kp=${results.Kp}
Kazı Derinliği H=${excavationDepthM} m | Sürşarj q=${surchargeKpa} kPa
Aktif Basınç: Üst=${results.paTop} kPa, Taban=${results.paBase} kPa
Aktif Toprak İtkisi Ea=${results.EaTotal} kN/m
Su Dahil Toplam İtki=${results.EaTotalWithWater} kN/m
Devrilme Momenti (tabana göre)=${results.MtotalWithWater} kNm/m
Pasif Kuvvet Ep=${results.EpBase} kN/m`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const H = excavationDepthM;
  const svgH = 160,
    svgW = 220;
  const paTopPx = Math.min(80, Number(results.paTop) * 0.3);
  const paBasePx = Math.min(100, Number(results.paBase) * 0.3);

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
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)] backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-ping" />
                <span>Rankine & Coulomb Esasları</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
                İksa Perdesi{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400">
                  Toprak Basıncı Hesabı
                </span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground dark:text-zinc-300 md:text-base">
                Rankine aktif (Ka) ve pasif (Kp) toprak basıncı katsayıları, itki kuvvetleri ve tabana göre devrilme momenti hesabı.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shrink-0">
              <Layers className="h-6 w-6" />
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Inputs */}
          <div className="space-y-6 lg:col-span-5">
            <section className="tool-panel rounded-[32px] p-6 sm:p-8">
              <div className="flex items-center gap-2.5 border-b border-border/70 dark:border-white/10 pb-4">
                <SlidersHorizontal className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-black text-foreground dark:text-white">Hesap Girdileri</h2>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                    Zemin Türü
                  </label>
                  <div className="mt-2.5 space-y-2">
                    {SOIL_TYPES.map((st, idx) => (
                      <label
                        key={st.name}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
                          soilTypeIdx === idx
                            ? "border-purple-500/50 bg-purple-500/15 text-white"
                            : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-300 hover:border-purple-500/30",
                        )}
                      >
                        <input
                          type="radio"
                          name="soil"
                          checked={soilTypeIdx === idx}
                          onChange={() => setSoilTypeIdx(idx)}
                          className="accent-[#a855f7]"
                        />
                        <span className="flex-1 text-xs sm:text-sm font-semibold">{st.name}</span>
                        <span className="font-mono text-xs text-purple-300">Ka={st.Ka}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Kazı Derinliği H (m)
                    </label>
                    <span className="font-mono text-xs font-black text-purple-400">{excavationDepthM} m</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={20}
                    step={0.5}
                    value={excavationDepthM}
                    onChange={(e) => setExcavationDepthM(Number(e.target.value))}
                    className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                  />
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Sürşarj Yükü q (kPa)
                    </label>
                    <span className="font-mono text-xs font-black text-purple-400">{surchargeKpa} kPa</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={surchargeKpa}
                    onChange={(e) => setSurchargeKpa(Number(e.target.value))}
                    className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                  />
                </div>

                <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                      Yeraltı Su Seviyesi Derinliği (m)
                    </label>
                    <span className="font-mono text-xs font-black text-purple-400">{waterTableM} m</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    step={0.5}
                    value={waterTableM}
                    onChange={(e) => setWaterTableM(Number(e.target.value))}
                    className="mt-3 w-full cursor-pointer accent-[#a855f7]"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Results */}
          <div className="space-y-6 lg:col-span-7">
            <section className="tool-panel rounded-[32px] p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ["Ka Aktif Katsayı", results.Ka],
                  ["Kp Pasif Katsayı", results.Kp],
                  ["Taban Aktif Basıncı", `${results.paBase} kPa`],
                  ["Üst Aktif Basıncı", `${results.paTop} kPa`],
                  ["Toplam Aktif İtki Ea", `${results.EaTotal} kN/m`],
                  ["Bileşke Etki Noktası y", `${results.yResultant} m`],
                  ["Su Dahil Toplam İtki", `${results.EaTotalWithWater} kN/m`],
                  ["Devrilme Momenti", `${results.MtotalWithWater} kNm/m`],
                ].map(([k, v]) => (
                  <div key={k} className="tool-result-inner rounded-xl p-3.5">
                    <span className="text-zinc-400">{k}</span>
                    <div className="mt-1 font-mono text-sm font-bold text-white">{v}</div>
                  </div>
                ))}
              </div>

              {/* SVG Pressure Diagram */}
              <div className="mt-5 rounded-2xl border border-purple-500/20 bg-[#0b0a1a] p-4">
                <span className="text-[11px] font-mono text-purple-300 font-bold">
                  Aktif Toprak Basıncı Dağılımı
                </span>
                <svg viewBox={`0 0 ${svgW} ${svgH + 20}`} className="mt-2 w-full h-44">
                  <rect x="60" y="0" width="10" height={svgH} fill="#6366f1" opacity="0.8" rx="2" />
                  <line x1="0" y1="0" x2={svgW} y2="0" stroke="#a855f7" strokeWidth="2" />
                  <rect x="70" y="0" width={svgW - 70} height={svgH} fill="#8b5cf6" fillOpacity="0.08" />
                  <polygon
                    points={`70,0 ${70 + paTopPx},0 ${70 + paBasePx},${svgH} 70,${svgH}`}
                    fill="rgba(168, 85, 247, 0.35)"
                    stroke="#c084fc"
                    strokeWidth="1.5"
                  />
                  <text x="72" y="12" fontSize="9" fill="#c084fc" fontWeight="700">
                    {results.paTop} kPa
                  </text>
                  <text x="72" y={svgH - 4} fontSize="9" fill="#c084fc" fontWeight="700">
                    {results.paBase} kPa
                  </text>
                  <text x="4" y={svgH / 2} fontSize="9" fill="#a1a1aa" transform={`rotate(-90, 15, ${svgH / 2})`}>
                    H={H}m
                  </text>
                  <line
                    x1={70 + paBasePx / 2}
                    y1={svgH * 0.65}
                    x2="50"
                    y2={svgH * 0.65}
                    stroke="#a855f7"
                    strokeWidth="2"
                  />
                  <text x="2" y={svgH * 0.65 - 3} fontSize="8" fill="#a855f7" fontWeight="700">
                    Ea={results.EaTotal}
                  </text>
                  <text x="2" y={svgH * 0.65 + 9} fontSize="7" fill="#a1a1aa">
                    kN/m
                  </text>
                </svg>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all active:scale-98"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Rapor Kopyalandı!" : "Hesap Raporunu Kopyala"}
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
