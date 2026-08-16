"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Layers, Copy, SlidersHorizontal, CheckCircle2, AlertTriangle } from "lucide-react";

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
    // Ea = Ka*q*H + 0.5*Ka*gamma*H²
    const EaSurcharge = Ka * q * H;
    const EaSoil = 0.5 * Ka * gamma * H * H;
    const EaTotal = EaSurcharge + EaSoil;

    // Resultant height from base:
    // For trapezoid: y = (EaSoil * H/3 + EaSurcharge * H/2) / EaTotal
    const yResultant = (EaSoil * (H / 3) + EaSurcharge * (H / 2)) / EaTotal;

    // Overturning moment about base:
    const Moverturning = EaTotal * yResultant;

    // Hydrostatic pressure if water table within excavation
    const hwM = Math.max(0, H - waterTableM);
    const EaWater = 0.5 * gammaW * hwM * hwM;
    const EaTotalWithWater = EaTotal + EaWater;
    const MtotalWithWater = Moverturning + EaWater * hwM / 3;

    // Passive pressure at base (simplified): Ep = 0.5 * Kp * gamma * hp²
    const phi = Math.asin(1 - 2 * Ka); // approximate phi from Ka
    const Kp = Math.pow(Math.tan(Math.PI / 4 + phi / 2), 2);
    const passiveDepthM = H * 0.3; // Assumed passive zone
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
  }, [soilTypeIdx, excavationDepthM, surchargeKpa, waterTableM]);

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
  const svgH = 160, svgW = 220;
  const scaleY = svgH / H;
  const paTopPx = Math.min(80, Number(results.paTop) * 0.3);
  const paBasePx = Math.min(100, Number(results.paBase) * 0.3);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link href="/kategori/araclar" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors">
          <ArrowLeft className="h-4 w-4" />Hesap Araçlarına Dön
        </Link>
        <span className="rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-yellow-700 dark:text-yellow-400">Rankine & Coulomb</span>
      </div>

      <header className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-500/15 text-yellow-600 dark:text-yellow-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">İksa Perdesi Toprak Basıncı Hesabı</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">Rankine aktif ($K_a$) ve pasif ($K_p$) toprak basıncı katsayıları, itki kuvvetleri ve devrilme momenti.</p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-white/[0.06]">
              <SlidersHorizontal className="h-5 w-5 text-yellow-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">Hesap Girdileri</h2>
            </div>
            <div className="mt-5 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Zemin Türü</label>
                <div className="mt-2 space-y-2">
                  {SOIL_TYPES.map((st, idx) => (
                    <label key={st.name} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                      <input type="radio" name="soil" checked={soilTypeIdx === idx} onChange={() => setSoilTypeIdx(idx)} className="accent-yellow-500" />
                      <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white">{st.name}</span>
                      <span className="font-mono text-xs text-slate-500">Ka={st.Ka} | γ={st.gamma}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kazı Derinliği H (m)</label>
                  <span className="font-mono text-xs font-bold text-yellow-600 dark:text-yellow-400">{excavationDepthM} m</span>
                </div>
                <input type="range" min={2} max={20} step={0.5} value={excavationDepthM} onChange={(e) => setExcavationDepthM(Number(e.target.value))} className="mt-2 w-full accent-yellow-500" />
              </div>
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Sürşarj Yükü q (kPa)</label>
                  <span className="font-mono text-xs font-bold text-yellow-600 dark:text-yellow-400">{surchargeKpa} kPa</span>
                </div>
                <input type="range" min={0} max={100} step={5} value={surchargeKpa} onChange={(e) => setSurchargeKpa(Number(e.target.value))} className="mt-2 w-full accent-yellow-500" />
              </div>
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Zemin Suyu Derinliği (m)</label>
                  <span className="font-mono text-xs font-bold text-yellow-600 dark:text-yellow-400">{waterTableM} m</span>
                </div>
                <input type="range" min={0} max={20} step={0.5} value={waterTableM} onChange={(e) => setWaterTableM(Number(e.target.value))} className="mt-2 w-full accent-yellow-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ["Ka Aktif Katsayı", results.Ka], ["Kp Pasif Katsayı", results.Kp],
                ["Taban Aktif Basıncı", `${results.paBase} kPa`], ["Üst Aktif Basıncı", `${results.paTop} kPa`],
                ["Toplam Aktif İtki Ea", `${results.EaTotal} kN/m`], ["Terk. Etki Noktası y", `${results.yResultant} m`],
                ["Su Dahil Toplam İtki", `${results.EaTotalWithWater} kN/m`], ["Devrilme Momenti", `${results.MtotalWithWater} kNm/m`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <span className="text-slate-500 dark:text-zinc-400">{k}</span>
                  <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">{v}</div>
                </div>
              ))}
            </div>

            {/* SVG Pressure Diagram */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 p-4">
              <span className="text-[11px] font-mono text-zinc-400">Aktif Toprak Basıncı Diyagramı</span>
              <svg viewBox={`0 0 ${svgW} ${svgH + 20}`} className="mt-2 w-full h-44">
                {/* Wall */}
                <rect x="60" y="0" width="10" height={svgH} fill="#64748b" />
                {/* Ground line */}
                <line x1="0" y1="0" x2={svgW} y2="0" stroke="#78350f" strokeWidth="2" />
                {/* Soil fill */}
                <rect x="70" y="0" width={svgW - 70} height={svgH} fill="#a3611a" fillOpacity="0.15" />
                {/* Pressure trapezoid */}
                <polygon
                  points={`70,0 ${70 + paTopPx},0 ${70 + paBasePx},${svgH} 70,${svgH}`}
                  fill="#eab308"
                  fillOpacity="0.4"
                  stroke="#eab308"
                  strokeWidth="2"
                />
                {/* Labels */}
                <text x="72" y="12" fontSize="9" fill="#eab308">{results.paTop} kPa</text>
                <text x="72" y={svgH - 4} fontSize="9" fill="#eab308">{results.paBase} kPa</text>
                <text x="4" y={svgH / 2} fontSize="9" fill="#64748b" transform={`rotate(-90, 15, ${svgH / 2})`}>H={excavationDepthM}m</text>
                {/* Ea arrow */}
                <line x1={70 + paBasePx / 2} y1={svgH * 0.65} x2="50" y2={svgH * 0.65} stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow)" />
                <text x="2" y={svgH * 0.65 - 3} fontSize="8" fill="#ef4444">Ea={results.EaTotal}</text>
                <text x="2" y={svgH * 0.65 + 9} fontSize="7" fill="#ef4444">kN/m</text>
              </svg>
            </div>

            <div className="mt-4">
              <button onClick={handleCopy} className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3 text-xs font-bold text-slate-900 hover:bg-yellow-400 transition-colors">
                <Copy className="h-4 w-4" />{copied ? "Kopyalandı!" : "Hesap Raporunu Kopyala"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
