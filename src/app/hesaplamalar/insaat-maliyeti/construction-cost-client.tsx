"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  Home,
  Layers,
  Factory,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  Calculator,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Wizard } from "./_components/wizard-layout";
import { ResultDashboard } from "./_components/result-dashboard";
import {
  ProjectInputsV3,
  ConstructionCostResultV3,
  calculateConstructionCostV3,
} from "@/lib/calculations/modules/insaat-maliyeti-v3";

const QUICK_PRESETS = [
  {
    id: "apartman_5kat",
    title: "5 Katlı Konut Apartmanı",
    desc: "1.500 m² · 5 Kat · Standart Kalite",
    tip: "apartman",
    alan: 1500,
    kat: 5,
    bodrum: 1,
    sehir: "istanbul",
    zemin: "orta",
    kalite: "standart",
    cephe: "klasik",
    asansor: 1,
  },
  {
    id: "luks_villa",
    title: "Lüks Müstakil Villa",
    desc: "450 m² · 2 Kat · Lüks Kalite",
    tip: "villa",
    alan: 450,
    kat: 2,
    bodrum: 0,
    sehir: "antalya",
    zemin: "iyi",
    kalite: "luks",
    cephe: "kompozit",
    asansor: 0,
  },
  {
    id: "ticari_ofis",
    title: "Ticari Ofis / Plaza",
    desc: "3.500 m² · 7 Kat · Cam Cephe",
    tip: "ofis",
    alan: 3500,
    kat: 7,
    bodrum: 2,
    sehir: "ankara_izmir",
    zemin: "orta",
    kalite: "luks",
    cephe: "cam_giydirme",
    asansor: 2,
  },
  {
    id: "sanayi_depo",
    title: "Endüstriyel Tesis & Depo",
    desc: "2.000 m² · 1 Kat · Ekonomik",
    tip: "endustriyel",
    alan: 2000,
    kat: 1,
    bodrum: 0,
    sehir: "bursa_kocaeli",
    zemin: "orta",
    kalite: "ekonomik",
    cephe: "kompozit",
    asansor: 0,
  },
];

export function ConstructionCostClient() {
  const [result, setResult] = useState<ConstructionCostResultV3 | null>(null);

  const handleComplete = (inputs: ProjectInputsV3) => {
    const calcResult = calculateConstructionCostV3(inputs);
    setResult(calcResult);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const handleReset = () => {
    setResult(null);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  return (
    <div className="tool-page-shell">
      <div className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-8 lg:px-12 md:py-12">
        {/* ── Hero Header Card ── */}
        <section className="mb-8 rounded-3xl border border-border/80 bg-card/90 p-6 md:p-8 shadow-sm backdrop-blur-2xl dark:border-blue-500/20 dark:bg-[#090d26]/85 dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.15)] dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-300 dark:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping dark:bg-blue-400" />
                2026 Türkiye Şantiye & Malzeme Analizi
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl dark:text-white">
                İnşaat Maliyeti{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
                  Analiz Motoru
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base font-normal dark:text-slate-300">
                Betonarme taşıyıcı sistem, kaba yapı, ince işçilik, mekanik/elektrik tesisat ve şantiye genel
                giderlerini kapsayan 12 kategorili gerçekçi ön maliyet simülasyonu. 2026 güncel malzeme rayiçleri ve bölgesel endekslerle anlık hesaplayın.
              </p>

              {/* Quick scenario preset chips */}
              <div className="mt-6 flex flex-wrap gap-2 pt-2 border-t border-border/70 dark:border-white/10">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5 mr-1 py-1 dark:text-slate-400">
                  <Zap className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" /> Hızlı Senaryolar:
                </span>
                {QUICK_PRESETS.map((p) => (
                  <Link
                    key={p.id}
                    href={`/hesaplamalar/insaat-maliyeti?tip=${p.tip}&alan=${p.alan}&kat=${p.kat}&bodrum=${p.bodrum}&sehir=${p.sehir}&zemin=${p.zemin}&kalite=${p.kalite}&cephe=${p.cephe}&asansor=${p.asansor}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/50 px-3 py-1 text-xs font-bold text-foreground transition-all hover:border-blue-500/40 hover:bg-card hover:text-blue-600 dark:border-white/10 dark:bg-[#070a20] dark:text-slate-300 dark:hover:bg-[#0c1236] dark:hover:text-white"
                  >
                    <span>{p.title}</span>
                    <span className="font-mono text-[10px] text-blue-600 dark:text-blue-300">({p.alan} m²)</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Market Intel HUD */}
            <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-[#121945] via-[#0c1236] to-[#070b24] p-6 text-white shadow-[0_20px_50px_rgba(37,99,235,0.25)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-300">
                    2026 PİYASA BİLGİ MERKEZİ
                  </p>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <Activity className="h-3 w-3 animate-pulse" /> Canlı Veri
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-[#070a20] p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Ortalama Konut m²
                    </p>
                    <p className="mt-1 font-mono text-xl font-black text-white">
                      ~18.750 <span className="text-xs text-blue-300">₺/m²</span>
                    </p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">+%22.4 2026 Artış</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#070a20] p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Taşıyıcı Kaba Payı
                    </p>
                    <p className="mt-1 font-mono text-xl font-black text-emerald-300">
                      %38 – %42
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Beton + Demir + Kalıp</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  <strong className="text-white">12 Kalem</strong> maliyet kırılımı & nakit projeksiyonu
                </span>
                <span className="font-mono text-blue-300 font-bold">12 Kategori</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Content Area ── */}
        <div className="mx-auto">
          {!result ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center p-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                </div>
              }
            >
              <Wizard onComplete={handleComplete} />
            </Suspense>
          ) : (
            <ResultDashboard result={result} onReset={handleReset} />
          )}
        </div>
      </div>
    </div>
  );
}

