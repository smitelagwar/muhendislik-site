"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Copy,
  SlidersHorizontal,
  Info,
  Box,
} from "lucide-react";

const CONCRETE_GRADES = [
  { name: "C20/25", fck: 20, fcd: 13.3, fctd: 1.07 },
  { name: "C25/30", fck: 25, fcd: 16.7, fctd: 1.20 },
  { name: "C30/37", fck: 30, fcd: 20.0, fctd: 1.35 },
  { name: "C35/45", fck: 35, fcd: 23.3, fctd: 1.48 },
  { name: "C40/50", fck: 40, fcd: 26.7, fctd: 1.61 },
];

const SOIL_BEARING = [
  { name: "q = 75 kPa (Çok Zayıf)", value: 75 },
  { name: "q = 100 kPa (Zayıf)", value: 100 },
  { name: "q = 150 kPa (Orta)", value: 150 },
  { name: "q = 200 kPa (İyi)", value: 200 },
  { name: "q = 250 kPa (Sağlam)", value: 250 },
  { name: "q = 300 kPa (Çok Sağlam)", value: 300 },
  { name: "q = 400 kPa (Kayalık)", value: 400 },
];

export function FootingCalculator() {
  const [concreteIndex, setConcreteIndex] = useState(2); // C30/37
  const [soilBearingIdx, setSoilBearingIdx] = useState(3); // 200 kPa
  const [ndKn, setNdKn] = useState(600);
  const [mdKnm, setMdKnm] = useState(40);
  const [colBxCm, setColBxCm] = useState(40);
  const [colByCm, setColByCm] = useState(40);
  const [dfCm, setDfCm] = useState(120); // Foundation depth
  const [copied, setCopied] = useState(false);

  const selectedConcrete = CONCRETE_GRADES[concreteIndex];
  const qEm = SOIL_BEARING[soilBearingIdx].value; // kPa

  const results = useMemo(() => {
    const ndKN = ndKn;
    const mdKNm = mdKnm;
    const q = qEm; // kN/m²

    // Foundation area required
    // Temel boyutları için deneme – kareye yakın (bx = by = a)
    // A_min = N_d / q
    const areaMinM2 = ndKN / q;
    const sideM = Math.ceil(Math.sqrt(areaMinM2) * 10) / 10;

    // Eccentric loading check: e = M / N
    const eMm = mdKNm / ndKN; // m
    const eMaxAllowed = sideM / 6; // L/6 condition for full base contact
    const isFullContact = eMm <= eMaxAllowed;

    // Base pressure
    const areaActualM2 = sideM * sideM;
    const qMax = ndKN / areaActualM2 + (mdKNm * (sideM / 2)) / (areaActualM2 * sideM / 6);
    const qMin = ndKN / areaActualM2 - (mdKNm * (sideM / 2)) / (areaActualM2 * sideM / 6);

    const isBearingSafe = qMax <= q;

    // Foundation depth
    const dfM = dfCm / 100;
    const hFCm = Math.max(30, Math.ceil(((sideM - colBxCm / 100) / 4) * 100));
    const dFm = hFCm / 100 - 0.05; // Effective depth (rough)

    // Bending moment in foundation Md = q_max * ampatman² / 2
    const ampatmanM = (sideM - colBxCm / 100) / 2;
    const mFoundKnm = qMax * ampatmanM * ampatmanM * sideM / 2;

    // Required As: Approximate (fyd=365 MPa, B420C)
    const fyd = 365; // MPa
    const fcd = selectedConcrete.fcd; // MPa
    // As = Md / (0.9 * d * fyd) (simplified)
    const asMm2pm = (mFoundKnm * 1e6) / (0.9 * dFm * 1000 * fyd);
    const asNeededCm2pm = asMm2pm / 100;

    return {
      sideM,
      areaActualM2,
      eMm: eMm.toFixed(3),
      eMaxAllowed: eMaxAllowed.toFixed(3),
      isFullContact,
      qMax: qMax.toFixed(1),
      qMin: Math.max(0, qMin).toFixed(1),
      isBearingSafe,
      hFCm,
      ampatmanM: ampatmanM.toFixed(2),
      mFoundKnm: mFoundKnm.toFixed(1),
      asNeededCm2pm: asNeededCm2pm.toFixed(2),
    };
  }, [ndKn, mdKnm, qEm, colBxCm, colByCm, concreteIndex, dfCm]);

  const handleCopyReport = () => {
    const text = `TEKİL TEMEL HESAP RAPORU — TS 500 & TBDY 2018
----------------------------------------------
Beton Sınıfı: ${selectedConcrete.name}
Zemin Emniyet Gerilmesi (q_em): ${qEm} kPa
Tasarım Eksenel Yükü (Nd): ${ndKn} kN
Tasarım Devrilme Momenti (Md): ${mdKnm} kNm
Kolon Boyutları: ${colBxCm}×${colByCm} cm

BOYUTLANDIRMA SONUÇLARI:
Minimum Temel Alanı: ${results.areaActualM2.toFixed(2)} m²
Önerilen Temel Boyutu: ${results.sideM}×${results.sideM} m
Önerilen Temel Kalınlığı: ${results.hFCm} cm
Eksantrisite (e): ${results.eMm} m (limit L/6 = ${results.eMaxAllowed} m — ${results.isFullContact ? "TAM TEMAS" : "TEMAS YOK!"})
Max. Taban Basıncı (q_max): ${results.qMax} kPa (${results.isBearingSafe ? "GÜVENLİ" : "AŞILDI!"})
Ampatman Eğilme Momenti (Md): ${results.mFoundKnm} kNm/m
Gereken Donatı Alanı (As): ${results.asNeededCm2pm} cm²/m
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link
          href="/kategori/araclar"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Hesap Araçlarına Dön
        </Link>
        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-sky-600 dark:text-sky-400">
          TS 500 & TBDY 2018
        </span>
      </div>

      <header className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
            <Box className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Tekil Temel Boyutlandırma
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">
              Eksantrik yüklü tekil temelde zemin emniyet gerilmesi, taban basıncı dağılımı ve eğilme donatısı hesabı.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Inputs */}
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 dark:border-white/[0.06]">
              <SlidersHorizontal className="h-5 w-5 text-sky-500" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">Tasarım Girdileri</h2>
            </div>

            <div className="mt-5 space-y-5">
              {/* Concrete */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Beton Sınıfı</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {CONCRETE_GRADES.map((cg, idx) => (
                    <button key={cg.name} onClick={() => setConcreteIndex(idx)}
                      className={`rounded-xl border px-2 py-2 text-xs font-bold transition-all ${concreteIndex === idx ? "border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400" : "border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300"}`}>
                      {cg.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Soil bearing */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Zemin Emniyet Gerilmesi (q_em)</label>
                <select value={soilBearingIdx} onChange={(e) => setSoilBearingIdx(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white">
                  {SOIL_BEARING.map((sb, idx) => (
                    <option key={sb.name} value={idx}>{sb.name}</option>
                  ))}
                </select>
              </div>

              {/* Loads */}
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Tasarım Eksenel Yükü $N_d$ (kN)</label>
                  <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">{ndKn} kN</span>
                </div>
                <input type="range" min={100} max={3000} step={50} value={ndKn}
                  onChange={(e) => setNdKn(Number(e.target.value))}
                  className="mt-2 w-full accent-sky-500" />
              </div>
              <div>
                <div className="flex justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Devrilme Momenti $M_d$ (kNm)</label>
                  <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">{mdKnm} kNm</span>
                </div>
                <input type="range" min={0} max={400} step={5} value={mdKnm}
                  onChange={(e) => setMdKnm(Number(e.target.value))}
                  className="mt-2 w-full accent-sky-500" />
              </div>

              {/* Column Dims */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kolon $b_x$ (cm)</label>
                  <input type="number" value={colBxCm} onChange={(e) => setColBxCm(Number(e.target.value))} min={20} max={200}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">Kolon $b_y$ (cm)</label>
                  <input type="number" value={colByCm} onChange={(e) => setColByCm(Number(e.target.value))} min={20} max={200}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 dark:border-white/10 dark:bg-zinc-900 dark:text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6 lg:col-span-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-7">
            {/* Main Result */}
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-5 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">Önerilen Temel Boyutu</span>
              <div className="mt-2 font-mono text-4xl font-black text-slate-900 dark:text-white">
                {results.sideM} × {results.sideM} m
              </div>
              <div className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                Temel Kalınlığı: <strong className="text-slate-900 dark:text-white">{results.hFCm} cm</strong>
              </div>
            </div>

            {/* Status badges */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold ${results.isFullContact ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" : "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400"}`}>
                {results.isFullContact ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {results.isFullContact ? "Tam Taban Teması" : "Kısmi Temas (Devrilme Riski)"}
              </div>
              <div className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold ${results.isBearingSafe ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400" : "border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-400"}`}>
                {results.isBearingSafe ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {results.isBearingSafe ? "Zemin Emniyeti Sağlandı" : "Zemin Emniyeti Aşıldı"}
              </div>
            </div>

            {/* Detail steps */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-600 dark:text-zinc-400">Max. Taban Basıncı (q_max):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{results.qMax} kPa</span>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-600 dark:text-zinc-400">Min. Taban Basıncı (q_min):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{results.qMin} kPa</span>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-600 dark:text-zinc-400">Ampatman Mesafesi:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{results.ampatmanM} m</span>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                <span className="text-slate-600 dark:text-zinc-400">Ampatman Momenti (M_d):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{results.mFoundKnm} kNm/m</span>
              </div>
              <div className="flex justify-between rounded-xl bg-sky-50 p-3 dark:bg-sky-900/20">
                <span className="font-semibold text-sky-700 dark:text-sky-300">Gereken Donatı (A_s):</span>
                <span className="font-mono font-black text-sky-700 dark:text-sky-300">{results.asNeededCm2pm} cm²/m</span>
              </div>
            </div>

            {/* SVG Plan View */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 p-4">
              <span className="text-[11px] font-mono text-zinc-400">Tekil Temel Plan Görünümü</span>
              <svg viewBox="0 0 200 200" className="mt-2 w-full h-32">
                {/* Footing outline */}
                <rect x="20" y="20" width="160" height="160" rx="4" fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
                {/* Column cross */}
                <rect x="70" y="70" width="60" height="60" fill="#0ea5e9" fillOpacity="0.3" stroke="#0ea5e9" strokeWidth="2" />
                {/* Pressure trapezoid indication */}
                <line x1="20" y1="185" x2="180" y2="185" stroke={results.isBearingSafe ? "#10b981" : "#ef4444"} strokeWidth="3" />
                <text x="100" y="197" textAnchor="middle" fontSize="8" fill={results.isBearingSafe ? "#10b981" : "#ef4444"} fontWeight="700">
                  {results.sideM}×{results.sideM} m — qmax={results.qMax} kPa
                </text>
              </svg>
            </div>

            <div className="mt-4">
              <button onClick={handleCopyReport}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-xs font-bold text-white hover:bg-sky-600 transition-colors">
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
