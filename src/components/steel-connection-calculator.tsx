"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Info,
  Copy,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Layers,
} from "lucide-react";
import {
  calculateBoltedConnection,
  calculateWeldedConnection,
  type BoltGrade,
  type BoltDiameter,
} from "@/lib/engineering/steel/connection";

export function SteelConnectionCalculator() {
  const [tab, setTab] = useState<"bolted" | "welded">("bolted");

  // Bolted params
  const [boltGrade, setBoltGrade] = useState<BoltGrade>("8.8");
  const [boltDiameter, setBoltDiameter] = useState<BoltDiameter>(20);
  const [boltCount, setBoltCount] = useState(4);
  const [shearPlanes, setShearPlanes] = useState(1);
  const [plateThicknessMm, setPlateThicknessMm] = useState(10);
  const [boltVdKn, setBoltVdKn] = useState(120);
  const [boltNdKn, setBoltNdKn] = useState(0);

  // Welded params
  const [throatAMm, setThroatAMm] = useState(5);
  const [weldLengthMm, setWeldLengthMm] = useState(150);
  const [steelFuMpa, setSteelFuMpa] = useState(510); // S355
  const [weldVdKn, setWeldVdKn] = useState(140);

  const [copied, setCopied] = useState(false);

  const boltedRes = useMemo(() => {
    return calculateBoltedConnection({
      boltGrade,
      boltDiameterMm: boltDiameter,
      boltCount,
      shearPlanesCount: shearPlanes,
      plateThicknessMm,
      designShearForceVdKn: boltVdKn,
      designTensionForceNdKn: boltNdKn,
    });
  }, [boltGrade, boltDiameter, boltCount, shearPlanes, plateThicknessMm, boltVdKn, boltNdKn]);

  const weldedRes = useMemo(() => {
    return calculateWeldedConnection({
      throatThicknessAMm: throatAMm,
      weldLengthMm,
      steelUltimateStrengthFuMpa: steelFuMpa,
      designShearForceVdKn: weldVdKn,
    });
  }, [throatAMm, weldLengthMm, steelFuMpa, weldVdKn]);

  const handleCopyReport = () => {
    let text = "";
    if (tab === "bolted") {
      text = `ÇYTHYE 2018 BULONLU BİRLEŞİM HESAP RAPORU
-------------------------------------------
Cıvata: ${boltCount} adet M${boltDiameter} (${boltGrade} Kalite) | ${shearPlanes === 1 ? "Tek" : "Çift"} Tesirli
Levha Kalınlığı: ${plateThicknessMm} mm
Tasarım Tesirleri: Vd = ${boltVdKn} kN | Nd = ${boltNdKn} kN

KAPASİTE VE TAHKİKLER:
Makaslama Kapasitesi: ${boltedRes?.totalConnectionShearCapacityKn.toFixed(1)} kN
Ezilme Kapasitesi: ${boltedRes?.totalConnectionBearingCapacityKn.toFixed(1)} kN
Çekme Kapasitesi: ${boltedRes?.totalConnectionTensionCapacityKn.toFixed(1)} kN
Kombine Kullanım Oranı: %${((boltedRes?.combinedUtilization ?? 0) * 100).toFixed(1)}
DURUM: ${boltedRes?.isSafe ? "GÜVENLİ" : "KAPASİTE AŞILDI"}
`;
    } else {
      text = `ÇYTHYE 2018 KAYNAKLI BİRLEŞİM HESAP RAPORU
-------------------------------------------
Köşe Kaynak: a = ${throatAMm} mm | Lw = ${weldLengthMm} mm (fu = ${steelFuMpa} MPa)
Tasarım Kesme Kuvveti: Vd = ${weldVdKn} kN

KAPASİTE:
Toplam Kaynak Kapasitesi (Fw,Rd): ${weldedRes?.totalWeldCapacityFwRdKn.toFixed(1)} kN
Kapasite Kullanım Oranı: %${((weldedRes?.utilization ?? 0) * 100).toFixed(1)}
DURUM: ${weldedRes?.isSafe ? "GÜVENLİ" : "KAPASİTE AŞILDI"}
`;
    }

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
                <Flame className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">
                Çelik Yapılar
              </span>
              <span className="rounded-full border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#1e193d] px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                ÇYTHYE 2018 Bölüm 13
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              Çelik Cıvata & Kaynak Hesabı
            </h1>

            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-zinc-300">
              ÇYTHYE 2018 ve TS EN 1993-1-8 uyarınca yüksek mukavemetli bulonlu (8.8/10.9) makaslama, ezilme, çekme ve köşe kaynaklı birleşimlerin taşıma kapasitesi tahkiklerini gerçekleştirin.
            </p>
          </div>
        </section>

        {/* Tab Selector */}
        <div className="flex rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-1.5 max-w-md">
          <button
            type="button"
            onClick={() => setTab("bolted")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              tab === "bolted"
                ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                : "text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white"
            }`}
          >
            Bulonlu (Cıvatalı) Birleşim
          </button>
          <button
            type="button"
            onClick={() => setTab("welded")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              tab === "welded"
                ? "bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                : "text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white"
            }`}
          >
            Köşe Kaynaklı Birleşim
          </button>
        </div>

        {/* Workspace */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Inputs */}
          <div className="space-y-6 lg:col-span-7">
            <section className="tool-panel rounded-[32px] p-6 sm:p-8 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-border/70 dark:border-white/10 pb-4">
                <SlidersHorizontal className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-black text-foreground dark:text-white">
                  {tab === "bolted" ? "Bulonlu Birleşim Parametreleri" : "Kaynak Parametreleri"}
                </h2>
              </div>

              {tab === "bolted" ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300 mb-2">
                        Cıvata Kalitesi
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["8.8", "10.9"] as BoltGrade[]).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setBoltGrade(g)}
                            className={`rounded-xl border py-2.5 text-xs font-bold transition-all ${
                              boltGrade === g
                                ? "border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                : "border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 text-muted-foreground dark:text-zinc-400 hover:border-purple-500/40"
                            }`}
                          >
                            {g} Kalite
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300 mb-2">
                        Cıvata Çapı
                      </label>
                      <select
                        value={boltDiameter}
                        onChange={(e) => setBoltDiameter(Number(e.target.value) as BoltDiameter)}
                        className="w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2.5 text-xs font-bold text-foreground dark:text-white"
                      >
                        {[16, 20, 24, 27, 30].map((d) => (
                          <option key={d} value={d}>
                            M{d} (d = {d} mm)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                        Cıvata Adedi (n)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={boltCount}
                        onChange={(e) => setBoltCount(Math.max(1, Number(e.target.value)))}
                        className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                      />
                    </div>

                    <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                        Tesir Sayısı (m)
                      </label>
                      <select
                        value={shearPlanes}
                        onChange={(e) => setShearPlanes(Number(e.target.value))}
                        className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-2 py-2 text-xs font-bold text-foreground dark:text-white"
                      >
                        <option value={1}>1 (Tek Tesirli)</option>
                        <option value={2}>2 (Çift Tesirli)</option>
                      </select>
                    </div>

                    <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                        Levha t (mm)
                      </label>
                      <input
                        type="number"
                        min={2}
                        value={plateThicknessMm}
                        onChange={(e) => setPlateThicknessMm(Math.max(2, Number(e.target.value)))}
                        className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                        Tasarım Kesme Vd (kN)
                      </label>
                      <input
                        type="number"
                        value={boltVdKn}
                        onChange={(e) => setBoltVdKn(Math.max(1, Number(e.target.value)))}
                        className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                      />
                    </div>
                    <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                        Tasarım Çekme Nd (kN)
                      </label>
                      <input
                        type="number"
                        value={boltNdKn}
                        onChange={(e) => setBoltNdKn(Math.max(0, Number(e.target.value)))}
                        className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                        Kaynak Boğazı a (mm)
                      </label>
                      <input
                        type="number"
                        min={3}
                        max={30}
                        value={throatAMm}
                        onChange={(e) => setThroatAMm(Math.max(3, Number(e.target.value)))}
                        className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                      />
                    </div>

                    <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                        Kaynak Boyu Lw (mm)
                      </label>
                      <input
                        type="number"
                        min={30}
                        value={weldLengthMm}
                        onChange={(e) => setWeldLengthMm(Math.max(30, Number(e.target.value)))}
                        className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                        Ana Metal Çeliği fu (MPa)
                      </label>
                      <select
                        value={steelFuMpa}
                        onChange={(e) => setSteelFuMpa(Number(e.target.value))}
                        className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-xs font-bold text-foreground dark:text-white"
                      >
                        <option value={360}>S235 (fu = 360 MPa)</option>
                        <option value={430}>S275 (fu = 430 MPa)</option>
                        <option value={510}>S355 (fu = 510 MPa)</option>
                      </select>
                    </div>

                    <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                        Tasarım Kesme Vd (kN)
                      </label>
                      <input
                        type="number"
                        value={weldVdKn}
                        onChange={(e) => setWeldVdKn(Math.max(1, Number(e.target.value)))}
                        className="mt-2 w-full rounded-xl border border-border dark:border-white/15 bg-background dark:bg-[#0f0d22] px-3 py-2 text-sm font-mono font-bold text-foreground dark:text-white"
                      />
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          {/* Results */}
          <div className="space-y-6 lg:col-span-5">
            <section className="tool-result-panel rounded-[32px] p-6 sm:p-8 text-white space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-lg font-black">Birleşim Kapasitesi</h3>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-all"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Kopyalandı" : "Raporu Kopyala"}
                </button>
              </div>

              {tab === "bolted" && boltedRes && (
                <>
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300">
                        Birleşim Güvenlik Durumu
                      </span>
                      <h4 className="text-xl font-black mt-0.5">
                        {boltedRes.isSafe ? "GÜVENLİ VE UYGUN" : "KAPASİTE AŞIMI"}
                      </h4>
                    </div>
                    <div
                      className={`rounded-full p-2.5 ${
                        boltedRes.isSafe
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      }`}
                    >
                      {boltedRes.isSafe ? <ShieldCheck className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                        Makaslama (Fv,Rd)
                      </span>
                      <p className="mt-1 text-2xl font-black font-mono">
                        {boltedRes.totalConnectionShearCapacityKn.toFixed(1)} <span className="text-xs text-zinc-400">kN</span>
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                        Levha Ezilme (Fb,Rd)
                      </span>
                      <p className="mt-1 text-2xl font-black font-mono">
                        {boltedRes.totalConnectionBearingCapacityKn.toFixed(1)} <span className="text-xs text-zinc-400">kN</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-300">
                    {boltedRes.notes.map((note, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-purple-400">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab === "welded" && weldedRes && (
                <>
                  <div className="rounded-2xl border border-white/15 bg-white/5 p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300">
                        Kaynak Güvenlik Durumu
                      </span>
                      <h4 className="text-xl font-black mt-0.5">
                        {weldedRes.isSafe ? "GÜVENLİ VE UYGUN" : "KAYNAK YETERSİZ"}
                      </h4>
                    </div>
                    <div
                      className={`rounded-full p-2.5 ${
                        weldedRes.isSafe
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      }`}
                    >
                      {weldedRes.isSafe ? <ShieldCheck className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      Toplam Kaynak Kapasitesi (Fw,Rd)
                    </span>
                    <p className="mt-1 text-3xl font-black font-mono">
                      {weldedRes.totalWeldCapacityFwRdKn.toFixed(1)} <span className="text-xs text-zinc-400">kN</span>
                    </p>
                    <div className="mt-2 flex justify-between text-xs text-zinc-300">
                      <span>Kullanım Oranı:</span>
                      <span className={weldedRes.isSafe ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        %{(weldedRes.utilization * 100).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-300">
                    {weldedRes.notes.map((note, i) => (
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
