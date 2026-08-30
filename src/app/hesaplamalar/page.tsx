"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Calculator,
  FileText,
  Hammer,
  Layers,
  LandPlot,
  Layers3,
  Wrench,
  Sparkles,
  TrendingUp,
  Coins,
  FileCheck2,
  Zap,
  Search,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  PieChart,
  Sliders,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCalculationPages, type CalculationPageIconKey } from "@/lib/calculation-pages";

const CALCULATION_ICONS: Record<CalculationPageIconKey, React.ComponentType<{ className?: string }>> = {
  building: Building2,
  plot: LandPlot,
  file: FileText,
  layers: Layers3,
};

const TOOLS = getCalculationPages();

// NeuroBank Quick Archetype Presets
const PRESET_SCENARIOS = [
  {
    id: "apartman",
    label: "Şehir Apartmanı (5 Kat)",
    area: "1.200 m²",
    cost: "~18.500 ₺/m²",
    concrete: "~420 m³",
    rebar: "~38 ton",
    href: "/hesaplamalar/insaat-maliyeti?tip=apartman&alan=1200",
  },
  {
    id: "villa",
    label: "Müstakil Lüks Villa",
    area: "450 m²",
    cost: "~28.000 ₺/m²",
    concrete: "~165 m³",
    rebar: "~15 ton",
    href: "/hesaplamalar/insaat-maliyeti?tip=villa&alan=450",
  },
  {
    id: "ofis",
    label: "Ticari Ofis / Plaza",
    area: "3.500 m²",
    cost: "~24.000 ₺/m²",
    concrete: "~1.250 m³",
    rebar: "~120 ton",
    href: "/hesaplamalar/insaat-maliyeti?tip=ofis&alan=3500",
  },
  {
    id: "sanayi",
    label: "Endüstriyel Depo & Tesis",
    area: "2.000 m²",
    cost: "~14.500 ₺/m²",
    concrete: "~650 m³",
    rebar: "~55 ton",
    href: "/hesaplamalar/insaat-maliyeti?tip=endustriyel&alan=2000",
  },
];

const COMING_SOON = [
  {
    icon: Hammer,
    label: "Duvar & Tuğla Hesabı",
    description: "Tuğla, bims, gazbeton ve harç sarfiyatını işçilik maliyetiyle birlikte öngörün.",
    category: "Kaba İş",
  },
  {
    icon: BarChart3,
    label: "Şap ve Zemin Kaplama",
    description: "Şap kalınlığı, metrekare ve malzeme giderini tek tabloda hesaplayın.",
    category: "İnce İş",
  },
  {
    icon: Layers,
    label: "Perde Metraj Dağılımı",
    description: "Bodrum çevre perdesi beton hacmi ve donatı yoğunluğunu kat bandına göre kıyaslayın.",
    category: "Betonarme",
  },
  {
    icon: Wrench,
    label: "Kazı, Dolgu ve Hafriyat",
    description: "Temel kotu, iksa ve zemin sınıfına göre kabarmalı kazı hacmi ve kamyon seferi tahmini.",
    category: "Altyapı",
  },
];

export default function HesaplamalarPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "cost" | "quantity" | "area">("all");

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = tool.title.toLowerCase().includes(q);
        const matchDesc = tool.description.toLowerCase().includes(q);
        const matchKw = tool.keywords?.some((k) => k.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchKw) return false;
      }

      if (activeTab === "cost") return tool.id === "insaat-maliyeti" || tool.id === "resmi-birim-maliyet-2026";
      if (activeTab === "quantity") return tool.id === "hizli-metraj";
      if (activeTab === "area") return tool.id === "tahmini-insaat-alani";

      return true;
    });
  }, [searchQuery, activeTab]);

  return (
    <div className="mx-auto max-w-screen-2xl space-y-8 px-4 py-8 sm:px-8 lg:px-12 md:py-12 pb-28 md:pb-16">
      {/* ── 1. NEUROBANK HERO & FINANCIAL ASSISTANT BANNER ── */}
      <section className="relative overflow-hidden rounded-[36px] border border-border/80 bg-gradient-to-b from-blue-50/90 via-indigo-50/50 to-background p-6 sm:p-8 md:p-12 shadow-[0_20px_50px_rgba(37,99,235,0.06)] backdrop-blur-3xl dark:border-blue-500/25 dark:bg-gradient-to-b dark:from-[#0e1438]/90 dark:via-[#0a0e28]/90 dark:to-[#060818]/95 dark:shadow-[0_30px_80px_rgba(3,7,28,0.7)]">
        {/* Glow ambient flares */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-500/10 blur-[100px] dark:bg-blue-600/20" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px] dark:bg-indigo-600/20" />

        <div className="relative grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.15)] backdrop-blur-xl dark:border-blue-400/30 dark:bg-blue-500/15 dark:text-blue-300 dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse dark:bg-blue-400" />
              <span>NeuroBank Engine 2.4 • Şantiye Finans & Maliyet Konsolu</span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl lg:text-6xl dark:text-white">
              İnşaat Maliyetleri,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300">
                Metraj & Alan Analizi
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base font-normal dark:text-slate-300">
              2026 Resmî Yapı Yaklaşık Birim Maliyetleri, 12 kalemli piyasa maliyeti simülasyonu, hızlı beton-demir metrajı ve imar emsal fizibilitesini tek merkezden yönetin.
            </p>

            {/* Quick Natural Search Input */}
            <div className="mt-8 relative max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Maliyet kalemi, arsa emsali veya yapı sınıfı arayın... (ör: konut, beton, III-B)"
                className="h-13 w-full rounded-2xl border border-border bg-card pl-11 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-[#070b20]/90 dark:text-white dark:placeholder:text-slate-500 dark:shadow-inner dark:focus:border-blue-400 dark:focus:ring-blue-500/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>

          {/* Quick Bridge to Engineering Tools */}
          <div className="relative overflow-hidden rounded-[28px] border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-card p-6 sm:p-7 shadow-sm backdrop-blur-2xl dark:border-indigo-500/30 dark:bg-gradient-to-br dark:from-[#121945]/80 dark:to-[#090e2b]/90 dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-purple-500/15 border border-purple-500/30 p-2 text-purple-600 dark:text-purple-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                  Statik & Boyutlandırma
                </span>
              </div>
              <span className="rounded-full bg-blue-500/15 border border-blue-400/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-300">
                30+ Araç
              </span>
            </div>

            <h3 className="text-xl font-bold text-foreground dark:text-white">
              Mühendislik Ön Tasarım Atölyesi
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-slate-300">
              TS 500 donatı hesabı, kiriş kesiti, döşeme kalınlığı, TBDY 2018 taban kesme kuvveti ve TS 825 yalıtım kalınlığı için ön tasarım merkezine geçin.
            </p>

            <div className="mt-6">
              <Link
                href="/kategori/araclar"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 font-bold text-xs uppercase tracking-wider text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-98"
              >
                Araçlar Vitrinine Git
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. NEUROBANK 4 KPI METRICS OVERVIEW (Balance & Market Indicators) ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="relative overflow-hidden rounded-[26px] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl transition-all hover:border-blue-400/50 dark:border-blue-500/20 dark:bg-[#090d24]/85 dark:hover:border-blue-400/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
              Ortalama Konut Maliyeti
            </span>
            <div className="rounded-xl bg-blue-500/15 border border-blue-500/30 p-2 text-blue-500 dark:text-blue-400">
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-black text-foreground sm:text-3xl dark:text-white">
            18.750 <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">₺/m²</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>+22.4% 2026 Resmî Tebliğ</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="relative overflow-hidden rounded-[26px] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl transition-all hover:border-purple-400/50 dark:border-purple-500/20 dark:bg-[#090d24]/85 dark:hover:border-purple-400/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
              Taşıyıcı Kaba Payı
            </span>
            <div className="rounded-xl bg-purple-500/15 border border-purple-500/30 p-2 text-purple-500 dark:text-purple-400">
              <Layers3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-black text-foreground sm:text-3xl dark:text-white">
            %38 – %42
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-300">
            <span>Beton + Donatı + Kalıp</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="relative overflow-hidden rounded-[26px] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl transition-all hover:border-emerald-400/50 dark:border-emerald-500/20 dark:bg-[#090d24]/85 dark:hover:border-emerald-400/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
              Resmî Yapı Grubu
            </span>
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-2 text-emerald-500 dark:text-emerald-400">
              <FileCheck2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-black text-foreground sm:text-3xl dark:text-white">
            III-B / IV-A
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <span>ÇŞB 2026 Tebliği</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="relative overflow-hidden rounded-[26px] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl transition-all hover:border-cyan-400/50 dark:border-cyan-500/20 dark:bg-[#090d24]/85 dark:hover:border-cyan-400/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
              Anlık Hesap Motoru
            </span>
            <div className="rounded-xl bg-cyan-500/15 border border-cyan-500/30 p-2 text-cyan-600 dark:text-cyan-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl font-black text-foreground sm:text-3xl dark:text-white">
            &lt; 0.1 <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">sn</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-cyan-600 dark:text-cyan-300">
            <span>4 Canlı Modül Hazır</span>
          </div>
        </div>
      </section>

      {/* ── 3. QUICK PRESET ARCHETYPES BAR (NeuroBank Fast Scenarios) ── */}
      <section className="rounded-3xl border border-border/80 bg-card/80 p-5 backdrop-blur-2xl dark:border-white/10 dark:bg-[#080c22]/80">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
            <Sliders className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <span>Hızlı Proje Senaryoları:</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 flex-1 max-w-4xl">
            {PRESET_SCENARIOS.map((p) => (
              <Link
                key={p.id}
                href={p.href}
                className="group flex flex-col justify-between rounded-xl border border-border/80 bg-muted/50 p-3 transition-all hover:border-blue-500/50 hover:bg-card dark:border-white/10 dark:bg-[#0d1230] dark:hover:bg-[#131a44]"
              >
                <span className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-300 transition-colors">
                  {p.label}
                </span>
                <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-muted-foreground dark:text-slate-400">
                  <span>{p.area}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{p.cost}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PRIMARY CALCULATION MODULES (NeuroBank Asset & Service Cards) ── */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground sm:text-xl dark:text-white">
              Hesaplama & Karar Destek Modülleri
            </h2>
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              İhtiyacınıza uygun hesap motorunu seçerek anlık fizibilite ve metraj analizi üretin.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-muted/70 p-1 dark:border-white/10 dark:bg-[#0a0e28]">
            {[
              { id: "all", label: "Tümü" },
              { id: "cost", label: "Maliyet" },
              { id: "quantity", label: "Metraj" },
              { id: "area", label: "Alan" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-white",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {filteredTools.map((tool) => {
            const ToolIcon = CALCULATION_ICONS[tool.iconKey];

            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[30px] border border-border/80 bg-card/90 p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/50 hover:shadow-[0_15px_35px_rgba(37,99,235,0.12)] dark:border-blue-500/20 dark:bg-[#090d26]/85 dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)] dark:hover:border-blue-400/60 dark:hover:shadow-[0_0_40px_rgba(37,99,235,0.25)]"
              >
                {/* Top accent border line on hover */}
                <div className="absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

                <div className="relative flex h-full flex-col justify-between gap-6">
                  <div>
                    {/* Header with icon and badge */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 transition-colors group-hover:bg-blue-500/25 group-hover:text-blue-500 dark:group-hover:text-blue-300">
                        <ToolIcon className="h-6 w-6" />
                      </div>

                      <span className="rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300 shadow-xs">
                        {tool.badge}
                      </span>
                    </div>

                    {/* Title and Description */}
                    <h3 className="mt-5 text-xl font-black tracking-tight text-foreground transition-colors group-hover:text-blue-600 sm:text-2xl dark:text-white dark:group-hover:text-blue-300">
                      {tool.title}
                    </h3>

                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground dark:text-slate-300">
                      {tool.description}
                    </p>

                    {/* Specific Module Micro-Visuals */}
                    {tool.id === "insaat-maliyeti" && (
                      <div className="mt-5 rounded-2xl border border-border/80 bg-muted/50 p-3.5 text-xs space-y-2 dark:border-white/10 dark:bg-[#070a1e]">
                        <div className="flex justify-between font-mono text-[11px] text-muted-foreground dark:text-slate-400">
                          <span>12 Kalem Maliyet Dağılımı:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">2026 Piyasa Fiyatları</span>
                        </div>
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#182044]">
                          <div className="bg-blue-500 h-full" style={{ width: "42%" }} title="Kaba Yapı: %42" />
                          <div className="bg-indigo-500 h-full" style={{ width: "34%" }} title="İnce İşler: %34" />
                          <div className="bg-purple-500 h-full" style={{ width: "14%" }} title="Tesisat: %14" />
                          <div className="bg-cyan-500 h-full" style={{ width: "10%" }} title="Genel Gider: %10" />
                        </div>
                      </div>
                    )}

                    {tool.id === "hizli-metraj" && (
                      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-xl border border-border/80 bg-muted/50 p-2 dark:border-white/10 dark:bg-[#070a1e]">
                          <span className="text-[10px] text-muted-foreground dark:text-slate-400">Beton Oranı</span>
                          <p className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">~0.36 m³/m²</p>
                        </div>
                        <div className="rounded-xl border border-border/80 bg-muted/50 p-2 dark:border-white/10 dark:bg-[#070a1e]">
                          <span className="text-[10px] text-muted-foreground dark:text-slate-400">Donatı Yoğunluğu</span>
                          <p className="font-mono text-xs font-black text-purple-600 dark:text-purple-400">~32 kg/m²</p>
                        </div>
                        <div className="rounded-xl border border-border/80 bg-muted/50 p-2 dark:border-white/10 dark:bg-[#070a1e]">
                          <span className="text-[10px] text-muted-foreground dark:text-slate-400">Kalıp Alanı</span>
                          <p className="font-mono text-xs font-black text-cyan-600 dark:text-cyan-400">~2.4 m²/m²</p>
                        </div>
                      </div>
                    )}

                    {tool.id === "tahmini-insaat-alani" && (
                      <div className="mt-5 rounded-2xl border border-border/80 bg-muted/50 p-3 text-xs flex items-center justify-between dark:border-white/10 dark:bg-[#070a1e]">
                        <span className="text-muted-foreground dark:text-slate-400">Ön Etüt Akışı:</span>
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-300">
                          Veri Güveni → İmar Hakkı → Senaryo
                        </span>
                      </div>
                    )}

                    {tool.id === "resmi-birim-maliyet-2026" && (
                      <div className="mt-5 rounded-2xl border border-border/80 bg-muted/50 p-3 text-xs flex items-center justify-between dark:border-white/10 dark:bg-[#070a1e]">
                        <span className="text-muted-foreground dark:text-slate-400">Resmî Kapsam:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-300">
                          I-A &apos;dan V-D &apos;ye Tüm Yapı Sınıfları
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action CTA */}
                  <div className="border-t border-border/70 dark:border-white/10 pt-4 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground dark:text-slate-400">
                      Anlık & Dinamik Çözüm
                    </span>

                    <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 transition-colors group-hover:text-blue-500 dark:group-hover:text-blue-300">
                      Modülü Başlat
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 5. NEUROBANK FINANCIAL ALLOCATION PORTFOLIO WIDGET ── */}
      <section className="relative overflow-hidden rounded-[32px] border border-border/80 bg-gradient-to-br from-blue-50/90 via-card to-indigo-50/50 p-6 sm:p-8 shadow-[0_15px_40px_rgba(37,99,235,0.06)] backdrop-blur-2xl dark:border-blue-500/20 dark:bg-gradient-to-br dark:from-[#0c1130] dark:via-[#090d26] dark:to-[#050718] dark:shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-blue-500/15 border border-blue-500/30 p-2 text-blue-600 dark:text-blue-400">
                <PieChart className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                Ortalama Türkiye Şantiye Bütçe Dağılımı
              </span>
            </div>

            <h3 className="mt-3 text-2xl font-black tracking-tight text-foreground md:text-3xl dark:text-white">
              1 m² Yapı İnşaatının Maliyet Bileşenleri
            </h3>

            <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-muted-foreground dark:text-slate-300">
              Konut ve ticari yapılarda toplam harcamanın kalem bazlı tahmini payları. Taşıyıcı sistem kaba yapı en büyük finansal kalemi oluşturur.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-border/80 bg-card/90 p-4 dark:border-blue-500/30 dark:bg-[#070b22]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-foreground dark:text-slate-300">Taşıyıcı Kaba</span>
                </div>
                <div className="mt-2 font-mono text-2xl font-black text-foreground dark:text-white">%42</div>
                <span className="text-[10px] text-muted-foreground dark:text-slate-400">Beton, Demir, Kalıp</span>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card/90 p-4 dark:border-indigo-500/30 dark:bg-[#070b22]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-foreground dark:text-slate-300">İnce Yapı</span>
                </div>
                <div className="mt-2 font-mono text-2xl font-black text-foreground dark:text-white">%34</div>
                <span className="text-[10px] text-muted-foreground dark:text-slate-400">Duvar, Sıva, Kaplama</span>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card/90 p-4 dark:border-purple-500/30 dark:bg-[#070b22]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="text-xs font-bold text-foreground dark:text-slate-300">Mekanik & Elk.</span>
                </div>
                <div className="mt-2 font-mono text-2xl font-black text-foreground dark:text-white">%14</div>
                <span className="text-[10px] text-muted-foreground dark:text-slate-400">Sıhhi, Isıtma, Kablo</span>
              </div>

              <div className="rounded-2xl border border-border/80 bg-card/90 p-4 dark:border-cyan-500/30 dark:bg-[#070b22]">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                  <span className="text-xs font-bold text-foreground dark:text-slate-300">Genel Gider</span>
                </div>
                <div className="mt-2 font-mono text-2xl font-black text-foreground dark:text-white">%10</div>
                <span className="text-[10px] text-muted-foreground dark:text-slate-400">Ruhsat, Proje, Vinç</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/hesaplamalar/insaat-maliyeti"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 px-6 font-bold text-xs uppercase tracking-wider text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-98"
            >
              Detaylı Analiz Başlat
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/hesaplamalar/resmi-birim-maliyet-2026"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/80 hover:bg-card px-6 font-bold text-xs uppercase tracking-wider text-foreground transition-all dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              2026 Tebliğ Fiyatları
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. UPCOMING MODULES GRID ── */}
      <section className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-[0.22em] text-muted-foreground dark:text-slate-400">
            Geliştirilmekte Olan İleri Modüller
          </h2>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">Yakında Yayında</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {COMING_SOON.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-xl transition-all hover:border-blue-500/40 dark:border-white/10 dark:bg-[#080c22]/70 dark:hover:border-blue-500/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-500 dark:text-blue-400">
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-slate-400">
                  {item.category}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-black text-foreground dark:text-white">
                {item.label}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
