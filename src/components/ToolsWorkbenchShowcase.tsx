"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  X,
  ArrowRight,
  Calculator,
  Sparkles,
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
    accentColor: "#a855f7",
  },
  "kolon-on-boyutlandirma": {
    standardNorm: "TS 500 & TBDY 2018",
    calcType: "Eksenel Yük & Kesit",
    accentColor: "#8b5cf6",
  },
  "kiris-kesiti": {
    standardNorm: "TS 500",
    calcType: "Eğilme & Kesme",
    accentColor: "#6366f1",
  },
  "doseme-kalinligi": {
    standardNorm: "TS 500",
    calcType: "Narinlik & Sehim",
    accentColor: "#10b981",
  },
  "pas-payi": {
    standardNorm: "TS EN 1992-1-1",
    calcType: "Çevre Sınıfı Örtüsü",
    accentColor: "#8b5cf6",
  },
  "zimbalama-kontrolu": {
    standardNorm: "TS 500 & Eurocode 2",
    calcType: "Kolon Çevresi Kayma",
    accentColor: "#c084fc",
  },
  "kiris-kesme-etriye": {
    standardNorm: "TS 500 (Bölüm 8)",
    calcType: "Vc + Vw Etriye Aralığı",
    accentColor: "#a855f7",
  },
  "kenetlenme-boyu": {
    standardNorm: "TS 500 (Bölüm 9)",
    calcType: "lb & lbd Bindirme Ek Boyu",
    accentColor: "#6366f1",
  },
  "taban-kesme-kuvveti": {
    standardNorm: "TBDY 2018",
    calcType: "Eşdeğer Deprem Yükü",
    accentColor: "#ec4899",
  },
  "duzensizlik-kontrolu": {
    standardNorm: "TBDY 2018",
    calcType: "A1, A2 & B2 Kontrolleri",
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
    accentColor: "#f43f5e",
  },
  "radye-temel-hesabi": {
    standardNorm: "TS 500 & TBDY 2018",
    calcType: "Ampatman & Zımbalama",
    accentColor: "#0d9488",
  },
  "iksa-toprak-basinci": {
    standardNorm: "Rankine & Coulomb",
    calcType: "Ka & Kp İtkisi",
    accentColor: "#a855f7",
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
    calcType: "Hacim & Mikser Seferi",
    accentColor: "#a855f7",
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
      {/* ── 1. HERO SECTION (Vortasky AI Cosmic Obsidian) ── */}
      <section className="relative overflow-hidden rounded-[32px] border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/85 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
        {/* Radial background ambient glows */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(147,51,234,0.2),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.15),transparent_50%)]" />

        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold tracking-wide text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)] backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-ping" />
              <span>TS 500 & TBDY 2018 Dijital Mühendislik Atölyesi</span>
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Mühendisler İçin{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400">
                Hesap ve Ön Tasarım Araçları
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground dark:text-zinc-300 sm:text-base font-normal">
              Betonarme (TS 500), Deprem (TBDY 2018), Isı Yalıtımı (TS 825:2024) ve İmar fizibilite hesap araçlarına yüksek hassasiyetle tek merkezden anlık olarak erişin.
            </p>

            {/* Sayısal istatistik rozetleri */}
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#16132e]/90 px-4 py-2.5 shadow-sm">
                <span className="font-mono text-2xl font-black text-foreground dark:text-white">
                  {tools.length}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                  Canlı Araç
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#16132e]/90 px-4 py-2.5 shadow-sm">
                <span className="font-mono text-2xl font-black text-purple-400">
                  5+
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                  Resmî Yönetmelik
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#16132e]/90 px-4 py-2.5 shadow-sm">
                <span className="font-mono text-2xl font-black text-indigo-400">
                  %100
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                  Anlık Hesaplama
                </span>
              </div>
            </div>
          </div>

          {/* ── 2. FEATURED TOOL WORKBENCH BANNER ── */}
          {featuredTool && (
            <div className="group relative overflow-hidden rounded-[28px] border border-purple-500/40 bg-gradient-to-b from-[#181338] via-[#120e2c] to-[#0a0818] p-6 sm:p-7 text-white shadow-[0_25px_60px_rgba(139,92,246,0.3)] backdrop-blur-2xl">
              <div className="pointer-events-none absolute top-0 right-0 h-40 w-40 translate-x-8 -translate-y-8 rounded-full bg-purple-500/20 blur-3xl group-hover:bg-purple-500/35 transition-all" />

              <div className="relative flex h-full flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-2xl bg-purple-500/20 border border-purple-500/40 p-2.5 text-purple-300 backdrop-blur-sm">
                        <ToolIcon iconKey={featuredTool.iconKey} className="h-6 w-6" />
                      </div>
                      <span className="rounded-full border border-purple-400/40 bg-purple-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-purple-200 shadow-sm">
                        Öne Çıkan Araç
                      </span>
                    </div>

                    {featuredMeta && (
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                        {featuredMeta.standardNorm}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-5 text-2xl font-black tracking-tight text-white md:text-3xl">
                    {featuredTool.name}
                  </h2>

                  <p className="mt-3 text-sm leading-relaxed text-zinc-300">
                    {featuredTool.description}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href={featuredTool.href}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(139,92,246,0.4)] active:scale-98"
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
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Araç veya standart ara... (ör: TS 500, TBDY, donatı)"
              className="h-12 w-full rounded-2xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#16132e]/90 pl-11 pr-10 text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-zinc-500 shadow-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/25 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sayısal sayaç göstergesi */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground dark:text-zinc-300">
            <SlidersHorizontal className="h-3.5 w-3.5 text-purple-400" />
            <span>
              Listelenen: <strong className="text-foreground dark:text-white">{filteredTools.length}</strong> / {tools.length} araç
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
                className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                    : "border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#120f28]/80 text-muted-foreground dark:text-zinc-300 hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-foreground dark:hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. İNTERAKTİF ARAÇ KARTLARI GRID'İ (Vortasky AI Dark Cards) ── */}
      {filteredTools.length === 0 ? (
        <div className="rounded-3xl border border-border/80 dark:border-purple-500/20 bg-card/80 dark:bg-[#0f0d22]/85 p-12 text-center backdrop-blur-2xl">
          <Compass className="mx-auto h-10 w-10 text-muted-foreground dark:text-purple-400" />
          <h3 className="mt-4 text-lg font-bold text-foreground dark:text-white">Aranan kriterlere uygun araç bulunamadı</h3>
          <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-300">
            Farklı bir arama terimi deneyebilir veya kategori filtresini değiştirebilirsiniz.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold uppercase text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] hover:scale-[1.02] transition-transform"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => {
            const meta = TOOL_EXTRA_META[tool.id];
            const color = meta?.accentColor || "#a855f7";

            return (
              <Link
                key={tool.id}
                href={tool.href}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/85 p-6 shadow-sm backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/60 dark:hover:border-purple-400/60 hover:shadow-[0_0_35px_rgba(139,92,246,0.25)]"
              >
                {/* Üst accent çizgi */}
                <div
                  className="absolute inset-x-0 top-0 h-[2.5px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-violet-500 to-indigo-500"
                />

                {/* Sağ alt filigran simge */}
                <ToolWatermarkIllustration toolId={tool.id} color={color} />

                <div>
                  {/* Kart Üst Rozetler */}
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 transition-colors group-hover:bg-purple-500/25"
                    >
                      <ToolIcon iconKey={tool.iconKey} className="h-5 w-5" />
                    </div>

                    <span className="rounded-full border border-border/80 dark:border-white/15 bg-muted/60 dark:bg-[#1e193d] px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-200">
                      {meta?.standardNorm || tool.discipline}
                    </span>
                  </div>

                  {/* Başlık ve Açıklama */}
                  <h3 className="mt-5 text-lg font-black tracking-tight text-foreground dark:text-white transition-colors group-hover:text-purple-300">
                    {tool.name}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-300 line-clamp-3">
                    {tool.description}
                  </p>
                </div>

                {/* Kart Alt Bilgileri ve CTA */}
                <div className="mt-6 border-t border-border/60 dark:border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground dark:text-zinc-400">
                      {meta?.calcType || tool.discipline}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-purple-400 transition-colors group-hover:text-purple-300">
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

      {/* ── 5. GELİŞMİŞ HESAPLAMALAR & METRAJ PROMO BANNER (Vortasky AI Cosmic) ── */}
      <section className="relative overflow-hidden rounded-[32px] border border-purple-500/30 bg-gradient-to-br from-[#1c1540] via-[#120e2c] to-[#0a0818] p-6 sm:p-8 text-white shadow-[0_25px_60px_rgba(139,92,246,0.25)] backdrop-blur-2xl">
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/15 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-purple-200">
              <Calculator className="h-3.5 w-3.5 text-purple-400" />
              Gelişmiş Hesaplamalar Portalı
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-white md:text-3xl">
              Hızlı Metraj & Resmî İnşaat Maliyet Analizi
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300">
              Girilen kat alanı, temel tipi ve zemin sınıfına göre yaklaşık beton, donatı ve kalıp metrajı çıkarın. 2026 resmi birim maliyetleriyle karşılaştırmalı fizibilite alın.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/hesaplamalar/hizli-metraj"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 px-6 font-bold text-xs uppercase tracking-wider text-white transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] active:scale-98"
            >
              Hızlı Metrajı Aç
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/hesaplamalar"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 px-6 font-bold text-xs uppercase tracking-wider text-white transition-all"
            >
              Tüm Hesaplamalar
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
