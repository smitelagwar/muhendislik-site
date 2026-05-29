"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Check, Filter } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import { TiltCard } from "@/components/tilt-card";
import { ToolIcon } from "@/components/tool-icon";
import { Button } from "@/components/ui/button";
import type { ToolDefinition } from "@/lib/tools-data";

// Bento düzen sınıfları (Tümü görünümü için)
const BENTO_LAYOUT = [
  "col-span-1 sm:col-span-2 lg:col-span-5 lg:row-span-2", // Donatı Hesabı
  "col-span-1 sm:col-span-1 lg:col-span-3",              // Kolon Ön Boyut
  "col-span-1 sm:col-span-1 lg:col-span-4",              // Kiriş Kesiti
  "col-span-1 sm:col-span-2 lg:col-span-4",              // Döşeme Kalınlığı
  "col-span-1 sm:col-span-1 lg:col-span-3",              // Pas Payı
  "col-span-1 sm:col-span-1 lg:col-span-3",              // Kalıp Söküm
  "col-span-1 sm:col-span-2 lg:col-span-2",              // Isı Yalıtımı
  "col-span-1 sm:col-span-1 lg:col-span-3",              // İmar Hesaplayıcı
  "col-span-1 sm:col-span-1 lg:col-span-5",              // Deprem Taban Kesme
];

type CategoryFilter = "all" | "concrete" | "earthquake" | "site" | "regulation";

interface CategoryMeta {
  id: CategoryFilter;
  label: string;
  desc: string;
}

const CATEGORIES: CategoryMeta[] = [
  { id: "all", label: "Tüm Araçlar", desc: "Portal bünyesindeki tüm pratik hesap araçları." },
  { id: "concrete", label: "Betonarme & Statik", desc: "TS 500 uyumlu kiriş, kolon, döşeme ve donatı hesapları." },
  { id: "earthquake", label: "Deprem Mühendisliği", desc: "TBDY 2018 standartlarına göre taban kesme kuvveti hesaplayıcı." },
  { id: "site", label: "Saha & Şantiye", desc: "Beton dökümü, kalıp söküm süreleri ve saha uygulamaları." },
  { id: "regulation", label: "Mevzuat & Yapı Fiziği", desc: "TS 825 yalıtım kalınlığı ve imar durumu hesap modülleri." }
];

// Aracı kategoriye atayan eşleşme tablosu
function getToolCategory(toolId: string): CategoryFilter {
  switch (toolId) {
    case "donati-hesabi":
    case "kolon-on-boyutlandirma":
    case "kiris-kesiti":
    case "doseme-kalinligi":
    case "pas-payi":
      return "concrete";
    case "taban-kesme-kuvveti":
      return "earthquake";
    case "kalip-sokum-suresi":
      return "site";
    case "dis-cephe-yalitim-kalinligi":
    case "imar-hesaplayici":
      return "regulation";
    default:
      return "all";
  }
}

// Disipline göre neon ışıma ve vurgu renkleri
function getDisciplineStyles(category: CategoryFilter) {
  switch (category) {
    case "concrete":
      return {
        border: "hover:border-amber-400/80 dark:hover:border-amber-400/40",
        shadow: "hover:shadow-[0_0_22px_-6px_rgba(245,158,11,0.25)]",
        badge: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20",
        iconText: "text-amber-600 dark:text-amber-300"
      };
    case "earthquake":
      return {
        border: "hover:border-cyan-400/80 dark:hover:border-cyan-400/40",
        shadow: "hover:shadow-[0_0_22px_-6px_rgba(34,211,238,0.25)]",
        badge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/20",
        iconText: "text-cyan-600 dark:text-cyan-300"
      };
    case "site":
      return {
        border: "hover:border-emerald-400/80 dark:hover:border-emerald-400/40",
        shadow: "hover:shadow-[0_0_22px_-6px_rgba(16,185,129,0.25)]",
        badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20",
        iconText: "text-emerald-600 dark:text-emerald-300"
      };
    case "regulation":
      return {
        border: "hover:border-indigo-400/80 dark:hover:border-indigo-400/40",
        shadow: "hover:shadow-[0_0_22px_-6px_rgba(99,102,241,0.25)]",
        badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/20",
        iconText: "text-indigo-600 dark:text-indigo-300"
      };
    default:
      return {
        border: "hover:border-amber-400/80 dark:hover:border-amber-400/40",
        shadow: "hover:shadow-[0_0_22px_-6px_rgba(245,158,11,0.25)]",
        badge: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20",
        iconText: "text-amber-600 dark:text-amber-300"
      };
  }
}

export function HomeToolsBento({ tools }: { tools: ToolDefinition[] }) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const filteredTools = useMemo(() => {
    if (activeCategory === "all") return tools;
    return tools.filter((tool) => getToolCategory(tool.id) === activeCategory);
  }, [tools, activeCategory]);

  return (
    <section id="home-tools" className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-16 lg:py-20">
      {/* Başlık ve Kategori Açıklaması */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-slate-200 dark:border-white/5 pb-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="home-section-kicker">Araç yüzeyi</span>
            <span className="rounded bg-slate-100 dark:bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
              Canlı Modül
            </span>
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Günlük kararlar için kurgulanmış araç workbench’i
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">
            Hesap modülleri pratik mühendislik referanslarını besler. Şantiyede veya ofiste ihtiyaç duyduğunuz 
            disiplin sekmesini seçerek hesaplara hızlıca erişin.
          </p>
        </div>
        <Button asChild variant="outline" className="home-button-secondary self-start shrink-0">
          <Link href="/kategori/araclar">Tüm araç merkezi →</Link>
        </Button>
      </div>

      {/* Kategori Seçim Barı */}
      <div className="mt-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase transition-all ${
              activeCategory === cat.id
                ? "bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                : "border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
            }`}
          >
            {activeCategory === cat.id && <Check className="h-3.5 w-3.5" />}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Dinamik Grid Seçimi */}
      <div className="mt-8">
        {activeCategory === "all" ? (
          /* Tümü görünümü için Bento Grid */
          <div className="grid auto-rows-[minmax(180px,1fr)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
            {filteredTools.map((tool, idx) => {
              const layoutClass = BENTO_LAYOUT[idx] ?? "col-span-1";
              const cat = getToolCategory(tool.id);
              const styles = getDisciplineStyles(cat);
              const isFirst = idx === 0;

              return (
                <AnimatedSection
                  key={tool.id}
                  animation="fade-up"
                  delay={idx * 60}
                  className={layoutClass}
                >
                  <TiltCard
                    intensity={isFirst ? 5 : 3}
                    className={`h-full rounded-xl transition-all duration-300 border ${
                      isFirst
                        ? "border-amber-300 dark:border-amber-400/35 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-[#070b12]"
                        : "border-slate-200 dark:border-white/5 bg-white dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.68),rgba(7,11,18,0.92))]"
                    } ${styles.border} ${styles.shadow}`}
                  >
                    <Link
                      href={tool.href}
                      className="group flex h-full flex-col justify-between p-5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 ${styles.iconText}`}>
                            <ToolIcon iconKey={tool.iconKey} className="h-5 w-5" />
                          </div>
                          <span className={`rounded-md border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles.badge}`}>
                            {tool.discipline}
                          </span>
                        </div>
                        <h3 className="mt-5 font-black text-slate-800 dark:text-white text-lg tracking-tight group-hover:text-slate-900 dark:group-hover:text-amber-200">
                          {tool.name}
                        </h3>
                        <p className="mt-2.5 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {tool.description}
                        </p>
                      </div>
                      <div className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-amber-500 dark:group-hover:text-amber-200">
                        <span>Hesapla</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </TiltCard>
                </AnimatedSection>
              );
            })}
          </div>
        ) : (
          /* Filtrelenmiş kategoriler için temiz 3 kolonlu ızgara */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTools.map((tool, idx) => {
              const cat = getToolCategory(tool.id);
              const styles = getDisciplineStyles(cat);

              return (
                <AnimatedSection
                  key={tool.id}
                  animation="fade-up"
                  delay={idx * 60}
                >
                  <TiltCard
                    intensity={3}
                    className={`h-full rounded-xl transition-all duration-300 border border-slate-200 dark:border-white/5 bg-white dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.68),rgba(7,11,18,0.92))] ${styles.border} ${styles.shadow}`}
                  >
                    <Link
                      href={tool.href}
                      className="group flex h-full flex-col justify-between p-5"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 ${styles.iconText}`}>
                            <ToolIcon iconKey={tool.iconKey} className="h-5 w-5" />
                          </div>
                          <span className={`rounded-md border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles.badge}`}>
                            {tool.discipline}
                          </span>
                        </div>
                        <h3 className="mt-5 font-black text-slate-800 dark:text-white text-lg tracking-tight group-hover:text-slate-900 dark:group-hover:text-amber-200">
                          {tool.name}
                        </h3>
                        <p className="mt-2.5 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {tool.description}
                        </p>
                      </div>
                      <div className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-amber-500 dark:group-hover:text-amber-200">
                        <span>Hesapla</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </TiltCard>
                </AnimatedSection>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
