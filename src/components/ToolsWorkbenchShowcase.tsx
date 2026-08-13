"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ArrowRight,
  Calculator,
  Layers,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
} from "lucide-react";
import { ToolIcon } from "@/components/tool-icon";
import { ToolWatermarkIllustration } from "@/components/tool-watermarks";
import { type ToolDefinition } from "@/lib/tools-data";

/* ------------------------------------------------------------------ */
/*  Disiplin / Kategori Verileri                                      */
/* ------------------------------------------------------------------ */

export interface ToolMeta {
  standardNorm: string;
  calcType: string;
  accentColor: string;
}

const TOOL_EXTRA_META: Record<string, ToolMeta> = {
  "donati-hesabi": {
    standardNorm: "TS 500 & TS EN 1992",
    calcType: "Donatı Eşdeğerliği",
    accentColor: "#f59e0b",
  },
  "kolon-on-boyutlandirma": {
    standardNorm: "TS 500 & TBDY 2018",
    calcType: "Eksenel Yük & Kesit",
    accentColor: "#ef4444",
  },
  "kiris-kesiti": {
    standardNorm: "TS 500",
    calcType: "Eğilme & Kesme",
    accentColor: "#3b82f6",
  },
  "doseme-kalinligi": {
    standardNorm: "TS 500",
    calcType: "Narinlik & Sehim",
    accentColor: "#10b981",
  },
  "pas-payi": {
    standardNorm: "TS EN 1992-1-1",
    calcType: "Çevre Sınıfı Örtüsü",
    accentColor: "#6366f1",
  },
  "zimbalama-kontrolu": {
    standardNorm: "TS 500 & Eurocode 2",
    calcType: "Kolon Çevresi Kayma",
    accentColor: "#ec4899",
  },
  "kiris-kesme-etriye": {
    standardNorm: "TS 500 (Bölüm 8)",
    calcType: "Vc + Vw Etriye Aralığı",
    accentColor: "#f97316",
  },
  "kenetlenme-boyu": {
    standardNorm: "TS 500 (Bölüm 9)",
    calcType: "lb & lbd Bindirme Ek Boyu",
    accentColor: "#14b8a6",
  },
  "taban-kesme-kuvveti": {
    standardNorm: "TBDY 2018",
    calcType: "Eşdeğer Deprem Yükü",
    accentColor: "#f43f5e",
  },
  "duzensizlik-kontrolu": {
    standardNorm: "TBDY 2018",
    calcType: "A1-A3 & B1-B3 Kontrolü",
    accentColor: "#d97706",
  },
  "zemin-sinifi": {
    standardNorm: "TBDY 2018 (Tablo 16.1)",
    calcType: "Vs30 & SPT-N60 Sınıfı",
    accentColor: "#059669",
  },
  "deprem-periyot-hesabi": {
    standardNorm: "TBDY 2018 (Bölüm 4)",
    calcType: "SDS, SD1 & İvme Spektrumu",
    accentColor: "#8b5cf6",
  },
  "goreli-kat-otelemesi": {
    standardNorm: "TBDY 2018 (Tablo 4.3)",
    calcType: "Drift & theta Tahkiki",
    accentColor: "#e11d48",
  },
  "tekil-birlesik-temel": {
    standardNorm: "TS 500 & TBDY 2018",
    calcType: "Zemin Emniyet & Donatı",
    accentColor: "#0284c7",
  },
  "radye-temel-hesabi": {
    standardNorm: "TS 500 & TBDY 2018",
    calcType: "Ampatman & Zımbalama",
    accentColor: "#0d9488",
  },
  "iksa-toprak-basinci": {
    standardNorm: "Rankine & Coulomb",
    calcType: "Ka & Kp İtkisi",
    accentColor: "#ca8a04",
  },
  "sev-stabilitesi": {
    standardNorm: "Fellenius / Bishop",
    calcType: "Fs Güvenlik Katsayısı",
    accentColor: "#65a30d",
  },
  "celik-profil-secimi": {
    standardNorm: "ÇYTHYE 2018 / AISC",
    calcType: "IPE/HEA Narinlik & Burkulma",
    accentColor: "#64748b",
  },
  "celik-birlestesi-hesabi": {
    standardNorm: "ÇYTHYE 2018",
    calcType: "Bulon & Kaynak Dikişi",
    accentColor: "#475569",
  },
  "ahsap-eleman-hesabi": {
    standardNorm: "TS 647 & Eurocode 5",
    calcType: "Emniyet Gerilmesi & Narinlik",
    accentColor: "#b45309",
  },
  "kalip-sokum-suresi": {
    standardNorm: "TS 500 & Şantiye",
    calcType: "Beton Dayanım Takvimi",
    accentColor: "#84cc16",
  },
  "dis-cephe-yalitim-kalinligi": {
    standardNorm: "TS 825:2024",
    calcType: "Bölge U Değeri",
    accentColor: "#06b6d4",
  },
  "imar-hesaplayici": {
    standardNorm: "3194 İmar Kanunu",
    calcType: "TAKS, KAKS & Çekmeler",
    accentColor: "#8b5cf6",
  },
  "beton-metraj-hesabi": {
    standardNorm: "Şantiye Metrajı",
    calcType: "Zayiatlı Harç Hacmi",
    accentColor: "#f59e0b",
  },
  "hafriyat-metraj-hesabi": {
    standardNorm: "Kazı & Nakliye",
    calcType: "Kubaj & Kamyon Sefer",
    accentColor: "#78350f",
  },
  "pratik-donati-metraji": {
    standardNorm: "Pratik Pursantaj",
    calcType: "Yaklaşık Demir Tonajı",
    accentColor: "#dc2626",
  },
  "pratik-kalip-metraji": {
    standardNorm: "Şantiye Pratikleri",
    calcType: "Kalıp Yüzeyi (m²)",
    accentColor: "#ea580c",
  },
  "duvar-metraji-hesabi": {
    standardNorm: "Tuğla & Bims & Ytong",
    calcType: "Duvar Alanı & Adet",
    accentColor: "#c2410c",
  },
  "siva-boya-metraji": {
    standardNorm: "İnce İşler",
    calcType: "Alçı & Boya Sarfiyatı",
    accentColor: "#0284c7",
  },
  "cati-kaplama-metraji": {
    standardNorm: "Oturtma Çatı",
    calcType: "Kereste & Kiremit",
    accentColor: "#9a3412",
  },
  "seramik-fayans-metraji": {
    standardNorm: "Islak Hacim",
    calcType: "Seramik & Yapıştırıcı",
    accentColor: "#4f46e5",
  },
};

const DISCIPLINE_CATEGORIES = [
  { id: "all", label: "Tümü" },
  { id: "betonarme", label: "Betonarme (TS 500)" },
  { id: "deprem", label: "Deprem (TBDY 2018)" },
  { id: "geoteknik", label: "Geoteknik & Temel" },
  { id: "celik-ahsap", label: "Çelik & Ahşap" },
  { id: "santiye-imar", label: "Şantiye, Metraj & İmar" },
] as const;

function getDisciplineGroup(discipline: string, toolId: string): string {
  if (
    discipline === "Betonarme" ||
    discipline === "Donatı Tasarımı" ||
    discipline === "Kiriş Tasarımı" ||
    discipline === "Döşeme Tasarımı" ||
    discipline === "Betonarme Detay"
  ) {
    return "betonarme";
  }
  if (discipline === "Deprem Mühendisliği") {
    return "deprem";
  }
  if (discipline === "Geoteknik") {
    return "geoteknik";
  }
  if (discipline === "Çelik & Ahşap") {
    return "celik-ahsap";
  }
  if (discipline === "Şantiye & Metraj") {
    return "santiye-imar";
  }
  return "santiye-imar";
}

/* ================================================================== */
/*  MAIN COMPONENT                                                    */
/* ================================================================== */

export default function ToolsWorkbenchShowcase({
  tools,
  featuredTool,
}: {
  tools: ToolDefinition[];
  featuredTool: ToolDefinition | null;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filtrelenmiş araç listesi
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      // Kategori filtresi
      if (selectedCategory !== "all") {
        const group = getDisciplineGroup(tool.discipline, tool.id);
        if (group !== selectedCategory) return false;
      }

      // Arama sorgusu filtresi
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const meta = TOOL_EXTRA_META[tool.id];
        const matchName = tool.name.toLowerCase().includes(q);
        const matchDesc = tool.description.toLowerCase().includes(q);
        const matchDisc = tool.discipline.toLowerCase().includes(q);
        const matchNorm = meta?.standardNorm.toLowerCase().includes(q);
        return matchName || matchDesc || matchDisc || matchNorm;
      }

      return true;
    });
  }, [tools, selectedCategory, searchQuery]);

  const featuredMeta = featuredTool ? TOOL_EXTRA_META[featuredTool.id] : null;

  return (
    <div className="space-y-8 md:space-y-12">
      {/* ── 1. HERO SECTION ── */}
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-6 shadow-xs dark:border-white/[0.06] dark:bg-zinc-950 sm:p-8 md:p-10">
        {/* Radial background ambient glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.1),transparent_50%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_50%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.14),transparent_50%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.11),transparent_50%)]" />

        <div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-amber-800 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Dijital Mühendislik Atölyesi
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
              Mühendisler İçin
              <br />
              <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-blue-600 bg-clip-text text-transparent dark:from-amber-300 dark:via-amber-400 dark:to-blue-400">
                Hesap ve Ön Tasarım Araçları
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-zinc-400 md:text-base">
              Betonarme (TS 500), Deprem (TBDY 2018), Isı Yalıtımı (TS 825) ve İmar fizibilite hesap araçlarına tek merkezden hızlıca erişin.
            </p>

            {/* Sayısal istatistik rozetleri */}
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 shadow-xs dark:border-white/[0.06] dark:bg-white/[0.03]">
                <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                  {tools.length}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Canlı Araç
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 shadow-xs dark:border-white/[0.06] dark:bg-white/[0.03]">
                <span className="font-mono text-2xl font-black text-amber-600 dark:text-amber-300">
                  5+
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Resmî Yönetmelik
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 shadow-xs dark:border-white/[0.06] dark:bg-white/[0.03]">
                <span className="font-mono text-2xl font-black text-blue-600 dark:text-blue-400">
                  %100
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  Anlık Hesaplama
                </span>
              </div>
            </div>
          </div>

          {/* ── 2. FEATURED TOOL WORKBENCH BANNER ── */}
          {featuredTool && (
            <div className="group relative overflow-hidden rounded-3xl border border-amber-500/30 bg-slate-900 p-6 text-white shadow-xl dark:border-amber-500/30 dark:bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.25),transparent_50%),linear-gradient(135deg,#171717,#0a0a0a)] md:p-7">
              <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-all" />

              <div className="relative flex h-full flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-2xl bg-white/15 p-2.5 text-amber-300 backdrop-blur-sm">
                        <ToolIcon iconKey={featuredTool.iconKey} className="h-6 w-6" />
                      </div>
                      <span className="rounded-full border border-amber-400/30 bg-amber-500/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
                        Öne Çıkan Araç
                      </span>
                    </div>

                    {featuredMeta && (
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
                        {featuredMeta.standardNorm}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-5 text-2xl font-black tracking-tight text-white md:text-3xl">
                    {featuredTool.name}
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {featuredTool.description}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href={featuredTool.href}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Aracı Çalıştır
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 3. CANLI FİLTRE & ARAMA BAR-I ── */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Canlı Arama Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Araç veya standart ara... (ör: TS 500, TBDY, pas payı)"
              className="h-12 w-full rounded-2xl border border-slate-200/90 bg-white pl-11 pr-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-white/[0.08] dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sayısal sayaç göstergesi */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-500" />
            <span>
              Listelenen: <strong className="text-slate-900 dark:text-white">{filteredTools.length}</strong> / {tools.length} araç
            </span>
          </div>
        </div>

        {/* Disiplin Filtre Tab'ları */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {DISCIPLINE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs dark:bg-white dark:text-slate-950"
                    : "border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 dark:border-white/[0.06] dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. İNTERAKTİF ARAÇ KARTLARI GRID'İ ── */}
      {filteredTools.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-12 text-center dark:border-white/[0.06] dark:bg-zinc-950">
          <Compass className="mx-auto h-10 w-10 text-slate-300 dark:text-zinc-600" />
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Aranan kriterlere uygun araç bulunamadı</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
            Farklı bir arama terimi deneyebilir veya kategori filtresini değiştirebilirsiniz.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-black uppercase text-slate-950 hover:bg-amber-400 transition-colors"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => {
            const meta = TOOL_EXTRA_META[tool.id];
            const color = meta?.accentColor || "#f59e0b";

            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-white/[0.15] dark:hover:shadow-xl dark:hover:shadow-black/30"
              >
                {/* Üst accent çizgi */}
                <div
                  className="absolute inset-x-0 top-0 h-[2.5px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ backgroundColor: color }}
                />

                {/* Sağ alt filigran simge (Sağ altta şeffaf ve hover animasyonlu) */}
                <ToolWatermarkIllustration toolId={tool.id} color={color} />

                <div>
                  {/* Kart Üst Rozetler */}
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors"
                      style={{
                        backgroundColor: `${color}15`,
                        color: color,
                      }}
                    >
                      <ToolIcon iconKey={tool.iconKey} className="h-5 w-5" />
                    </div>

                    <span className="rounded-full border border-slate-200 bg-slate-100/80 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                      {meta?.standardNorm || tool.discipline}
                    </span>
                  </div>

                  {/* Başlık ve Açıklama */}
                  <h3 className="mt-5 text-lg font-black tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-amber-400">
                    {tool.name}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-zinc-400 line-clamp-3">
                    {tool.description}
                  </p>
                </div>

                {/* Kart Alt Bilgileri ve CTA */}
                <div className="mt-6 border-t border-slate-100 pt-4 dark:border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-500">
                      {meta?.calcType || tool.discipline}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-600 transition-colors group-hover:text-amber-700 dark:text-amber-400 dark:group-hover:text-amber-300">
                      Aracı Aç
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── 5. GELİŞMİŞ HESAPLAMALAR & METRAJ PROMO BANNER ── */}
      <section className="relative overflow-hidden rounded-[28px] border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-slate-900 to-indigo-950 p-6 text-white shadow-xl dark:border-blue-500/20 dark:from-zinc-950 dark:to-slate-900 md:p-8">
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-300">
              <Calculator className="h-3.5 w-3.5" />
              Gelişmiş Hesaplamalar Portalı
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">
              Hızlı Metraj & Resmi İnşaat Maliyet Analizi
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              Girilen kat alanı, temel tipi ve zemin sınıfına göre yaklaşık beton, donatı ve kalıp metrajı çıkarın. 2026 resmi birim maliyetleriyle karşılaştırmalı fizibilite alın.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/hesaplamalar/hizli-metraj"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-6 font-black text-xs uppercase tracking-wider text-white transition-colors shadow-md"
            >
              Hızlı Metrajı Aç
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/hesaplamalar"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 px-6 font-black text-xs uppercase tracking-wider text-white transition-colors"
            >
              Tüm Hesaplamalar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
