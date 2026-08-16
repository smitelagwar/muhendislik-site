"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, CheckCircle2, AlertTriangle, Copy, SlidersHorizontal, Info } from "lucide-react";

const SOIL_CLASSES = [
  { name: "ZA (Sağlam Kayalık)", fs_low: 0.8, fs_high: 0.8, f1_low: 0.8, f1_high: 0.8 },
  { name: "ZB (Kayalık)", fs_low: 0.9, fs_high: 0.9, f1_low: 0.9, f1_high: 0.9 },
  { name: "ZC (Çok Sıkı Kum/Kil)", fs_low: 1.3, fs_high: 1.6, f1_low: 1.5, f1_high: 1.7 },
  { name: "ZD (Orta Sıkı Kum/Kil)", fs_low: 1.4, fs_high: 2.4, f1_low: 1.6, f1_high: 2.4 },
  { name: "ZE (Yumuşak Kil)", fs_low: 0.9, fs_high: 3.5, f1_low: 0.9, f1_high: 4.0 },
  { name: "ZF (Özel)", fs_low: 1.0, fs_high: 1.0, f1_low: 1.0, f1_high: 1.0 },
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
    // Spectral coefficient amplification (Fs for SS, F1 for S1)
    // Use average of range for simplicity (mid-range TBDY Table 2.1)
    const Fs = (selectedSoil.fs_low + selectedSoil.fs_high) / 2;
    const F1 = (selectedSoil.f1_low + selectedSoil.f1_high) / 2;

    const SDs = Fs * ss; // Short design spectral accel.
    const SD1 = F1 * s1; // Long design spectral accel.

    // Period limits
    const TA = 0.2 * SD1 / SDs;
    const TB = SD1 / SDs;
    const TL = 6.0; // Always 6 sec for Turkey per TBDY 2018

    // Empirical period: T1 = Ct * HN^0.75
    const Ct = 0.07; // Betonarme çerçeve
    const HN = numFloors * floorHeightM;
    const T1emp = Ct * Math.pow(HN, 0.75);

    // Spectral acceleration at T1
    let SaT1: number;
    if (T1emp <= TA) {
      SaT1 = (0.4 + 0.6 * T1emp / TA) * SDs;
    } else if (T1emp <= TB) {
      SaT1 = SDs;
    } else if (T1emp <= TL) {
      SaT1 = SD1 / T1emp;
    } else {
      SaT1 = (SD1 * TL) / (T1emp * T1emp);
    }

    // Equivalent seismic load method (Vt = m * Sar(T1) = W/g * Sar * g)
    // Sar(T1) = SaT1 / R * I (seismic reduced demand)
    const Sar = (SaT1 * importance) / R;

    // Total base shear Vt = W * Sar / g * g = W * Sar (since W already in force units)
    const Vt = totalWeightKn * Sar;

    // Minimum Vt: TBDY 2018 - Vt >= 0.04 * I * SDS * W
    const VtMin = 0.04 * importance * SDs * totalWeightKn;
    const VtFinal = Math.max(Vt, VtMin);

    // Floor force distribution (triangular)
    const floors = Array.from({ length: numFloors }, (_, i) => {
      const floorNum = i + 1;
      const hi = floorNum * floorHeightM;
      return { floorNum, hi };
    });

    const sumWiHi = floors.reduce((s, f) => s + (totalWeightKn / numFloors) * f.hi, 0);
    const floorForces = floors.map((f) => {
      const wi = totalWeightKn / numFloors;
      const Fi = (VtFinal * wi * f.hi) / sumWiHi;
      return { ...f, Fi: Fi.toFixed(1), wi };
    });

    return {
      SDs: SDs.toFixed(3),
      SD1: SD1.toFixed(3),
      TA: TA.toFixed(3),
      TB: TB.toFixed(3),
      T1emp: T1emp.toFixed(3),
      HN: HN.toFixed(1),
      SaT1: SaT1.toFixed(3),
      Sar: Sar.toFixed(4),
      Vt: Vt.toFixed(1),
      VtMin: VtMin.toFixed(1),
      VtFinal: VtFinal.toFixed(1),
      floorForces,
      Fs: Fs.toFixed(2),
      F1: F1.toFixed(2),
    };
  }, [ss, s1, soilClassIdx, importanceIdx, systemIdx, totalWeightKn, numFloors, floorHeightM]);

  const handleCopyReport = () => {
    const text = `TBDY 2018 EŞDEĞer DEPREM YÜK YÖNTEMİ — TABAN KESME KUVVETİ
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
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link href="/kategori/araclar"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors">
          <ArrowLeft className="h-4 w-4" />Hesap Araçlarına Dön
        </Link>
        <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
          TBDY 2018 Bölüm 4
        </span>
      </div>

      <header className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Eşdeğer Deprem Yükü & Taban Kesme Kuvveti
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
              TBDY 2018 Denklem 4.1: Eşdeğer yük yöntemi ile kat deprem kuvvetleri ve taban kesme kuvveti hesabı.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Inputs */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-white/[0.06]">
              <SlidersHorizontal className="h-5 w-5 text-rose-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">TBDY 2018 Parametreleri</h2>
            </div>

            <div className="mt-5 space-y-5">
              {/* SS & S1 from AFAD */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 text-xs text-blue-700 dark:text-blue-300 flex gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>$S_S$ ve $S_1$ değerlerini AFAD Deprem Tehlike Haritası'ndan elde edin (DTS, 50 yılda %10 aşılma olasılığı).</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      Kısa Periyot $S_S$
                    </label>
                    <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">{ss.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.1} max={3.0} step={0.05} value={ss}
                    onChange={(e) => setSs(Number(e.target.value))} className="mt-2 w-full accent-rose-500" />
                </div>
                <div>
                  <div className="flex justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      1 sn Periyot $S_1$
                    </label>
                    <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">{s1.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0.05} max={1.5} step={0.05} value={s1}
                    onChange={(e) => setS1(Number(e.target.value))} className="mt-2 w-full accent-rose-500" />
                </div>
              </div>

              {/* Soil Class */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Yerel Zemin Sınıfı (TBDY 2018 Tablo 16.1)</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {SOIL_CLASSES.map((sc, idx) => (
                    <button key={sc.name} onClick={() => setSoilClassIdx(idx)}
                      className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition-all leading-tight ${soilClassIdx === idx ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400" : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"}`}>
                      {sc.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">Seçili: {SOIL_CLASSES[soilClassIdx].name}</p>
              </div>

              {/* Structural System */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Taşıyıcı Sistem (R Katsayısı)</label>
                <select value={systemIdx} onChange={(e) => setSystemIdx(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white">
                  {BUILDING_SYSTEMS.map((bs, idx) => (
                    <option key={bs.name} value={idx}>{bs.name}</option>
                  ))}
                </select>
              </div>

              {/* Importance */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Bina Önem Katsayısı I</label>
                <div className="mt-2 space-y-2">
                  {IMPORTANCE_FACTORS.map((f, idx) => (
                    <label key={f.name} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                      <input type="radio" name="importance" checked={importanceIdx === idx}
                        onChange={() => setImportanceIdx(idx)} className="accent-rose-500" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{f.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Building loads */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">$W$ (kN)</label>
                    <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">{totalWeightKn}</span>
                  </div>
                  <input type="range" min={500} max={50000} step={500} value={totalWeightKn}
                    onChange={(e) => setTotalWeightKn(Number(e.target.value))} className="mt-2 w-full accent-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kat Sayısı N</label>
                  <input type="number" value={numFloors} onChange={(e) => setNumFloors(Number(e.target.value))} min={1} max={30}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kat Yük. h (m)</label>
                  <input type="number" value={floorHeightM} onChange={(e) => setFloorHeightM(Number(e.target.value))} min={2.5} max={6} step={0.1}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            {/* Vt Banner */}
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Tasarım Taban Kesme Kuvveti</span>
              <div className="mt-2 font-mono text-4xl font-black text-slate-900 dark:text-white">
                {results.VtFinal} <span className="text-xl font-semibold text-slate-500">kN</span>
              </div>
              <div className="mt-1 text-xs text-slate-500">
                T₁ = {results.T1emp} s | Sa(T₁) = {results.SaT1} | Sar = {results.Sar}
              </div>
            </div>

            {/* Spectral params */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-500 dark:text-zinc-400">S_DS (Kısa Periyot)</span>
                <div className="font-mono text-base font-black text-slate-900 dark:text-white">{results.SDs}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-500 dark:text-zinc-400">S_D1 (1 sn Periyot)</span>
                <div className="font-mono text-base font-black text-slate-900 dark:text-white">{results.SD1}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-500 dark:text-zinc-400">T_A / T_B Limit</span>
                <div className="font-mono text-base font-black text-slate-900 dark:text-white">{results.TA} / {results.TB} s</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-500 dark:text-zinc-400">Bina Yük. H_N</span>
                <div className="font-mono text-base font-black text-slate-900 dark:text-white">{results.HN} m</div>
              </div>
            </div>

            {/* Floor Forces Table */}
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5">
                    <th className="p-2.5 text-left font-bold text-slate-600 dark:text-zinc-300">Kat</th>
                    <th className="p-2.5 text-right font-bold text-slate-600 dark:text-zinc-300">h (m)</th>
                    <th className="p-2.5 text-right font-bold text-slate-600 dark:text-zinc-300">Fi (kN)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.floorForces.slice().reverse().map((f) => (
                    <tr key={f.floorNum} className="border-t border-slate-100 dark:border-white/[0.04]">
                      <td className="p-2.5 font-mono font-semibold text-slate-900 dark:text-white">{f.floorNum}. Kat</td>
                      <td className="p-2.5 text-right font-mono text-slate-700 dark:text-zinc-300">{f.hi.toFixed(1)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{f.Fi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <button onClick={handleCopyReport}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500 py-3 text-xs font-bold text-white hover:bg-rose-600 transition-colors">
                <Copy className="h-4 w-4" />
                {copied ? "Rapor Kopyalandı!" : "Hesap Raporunu Kopyala"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
