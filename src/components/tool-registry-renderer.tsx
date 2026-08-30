"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, Sliders } from "lucide-react";
import { ToolIcon } from "@/components/tool-icon";
import { ToolWatermarkIllustration } from "@/components/tool-watermarks";
import { type ToolDefinition, getLiveTools } from "@/lib/tools-data";
import { getToolImplementation } from "@/lib/tool-registry";

// Bileşenleri doğrudan veya dinamik yükle
import { SlopeStabilityCalculator } from "@/components/slope-stability-calculator";
import { SteelProfileCalculator } from "@/components/steel-profile-calculator";
import { MatFoundationCalculator } from "@/components/mat-foundation-calculator";
import { IrregularityCalculator } from "@/components/irregularity-calculator";
import { SoilClassCalculator } from "@/components/soil-class-calculator";
import { SteelConnectionCalculator } from "@/components/steel-connection-calculator";
import { TimberMemberCalculator } from "@/components/timber-member-calculator";
import { ConcreteQuantityCalculator } from "@/components/concrete-quantity-calculator";
import { ExcavationQuantityCalculator } from "@/components/excavation-quantity-calculator";
import { RebarQuantityCalculator } from "@/components/rebar-quantity-calculator";
import { FormworkQuantityCalculator } from "@/components/formwork-quantity-calculator";
import { MasonryQuantityCalculator } from "@/components/masonry-quantity-calculator";
import { PlasterPaintCalculator } from "@/components/plaster-paint-calculator";
import { RoofCoveringCalculator } from "@/components/roof-covering-calculator";
import { TileQuantityCalculator } from "@/components/tile-quantity-calculator";

interface ToolRegistryRendererProps {
  tool: ToolDefinition;
}

export function ToolRegistryRenderer({ tool }: ToolRegistryRendererProps) {
  const record = getToolImplementation(tool.id);

  // 1. Doğrudan registry'ye bağlı özel bileşenler
  if (tool.id === "sev-stabilitesi") {
    return <SlopeStabilityCalculator />;
  }

  if (tool.id === "celik-profil-secimi") {
    return <SteelProfileCalculator />;
  }

  if (tool.id === "celik-birlestesi-hesabi") {
    return <SteelConnectionCalculator />;
  }

  if (tool.id === "ahsap-eleman-hesabi") {
    return <TimberMemberCalculator />;
  }

  if (tool.id === "radye-temel-hesabi") {
    return <MatFoundationCalculator />;
  }

  if (tool.id === "duzensizlik-kontrolu") {
    return <IrregularityCalculator />;
  }

  if (tool.id === "zemin-sinifi") {
    return <SoilClassCalculator />;
  }

  if (tool.id === "beton-metraj-hesabi") {
    return <ConcreteQuantityCalculator />;
  }

  if (tool.id === "hafriyat-metraj-hesabi") {
    return <ExcavationQuantityCalculator />;
  }

  if (tool.id === "pratik-donati-metraji") {
    return <RebarQuantityCalculator />;
  }

  if (tool.id === "pratik-kalip-metraji") {
    return <FormworkQuantityCalculator />;
  }

  if (tool.id === "duvar-metraji-hesabi") {
    return <MasonryQuantityCalculator />;
  }

  if (tool.id === "siva-boya-metraji") {
    return <PlasterPaintCalculator />;
  }

  if (tool.id === "cati-kaplama-metraji") {
    return <RoofCoveringCalculator />;
  }

  if (tool.id === "seramik-fayans-metraji") {
    return <TileQuantityCalculator />;
  }

  // 2. Henüz motoru/arayüzü geliştirilme aşamasında olan araçlar için geçici Shell
  const allTools = getLiveTools();
  const relatedTools = allTools.filter((t) => t.id !== tool.id).slice(0, 3);

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

        <section className="relative overflow-hidden rounded-[32px] border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/85 p-6 sm:p-8 md:p-10 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.5)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.15),transparent_50%)]" />

          <ToolWatermarkIllustration toolId={tool.id} color="#a855f7" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                <ToolIcon iconKey={tool.iconKey} className="h-6 w-6" />
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-purple-300">
                {tool.discipline}
              </span>
              <span className="rounded-full border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#1e193d] px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
                {record?.normativeReference ?? "Resmî Standart & Yönetmelik"}
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              {tool.name}
            </h1>

            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-muted-foreground dark:text-zinc-300">
              {tool.description}
            </p>
          </div>
        </section>

        <section className="tool-panel rounded-[32px] p-6 sm:p-8">
          <div className="flex items-center gap-3 border-b border-border/70 dark:border-white/10 pb-4">
            <Sliders className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-black text-foreground dark:text-white">
              Hesaplama Parametreleri & Girdiler
            </h2>
          </div>

          <div className="mt-6 space-y-6">
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6 sm:p-8 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black text-foreground dark:text-white">
                Hesaplama Modülü Yapılandırılıyor
              </h3>
              <p className="mx-auto max-w-lg text-xs sm:text-sm leading-relaxed text-muted-foreground dark:text-zinc-300">
                Bu araç için canlı mühendislik algoritması ve doğrulanmış arayüz yayına hazırlanıyor.
              </p>
              <div className="pt-3 flex flex-wrap justify-center gap-3">
                <Link
                  href="/kategori/araclar/donati-hesabi"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:scale-[1.02] transition-all"
                >
                  Canlı Donatı Hesabını Aç
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/kategori/araclar"
                  className="inline-flex items-center gap-2 rounded-xl border border-border dark:border-white/15 bg-card dark:bg-[#16132e] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground dark:text-white hover:border-purple-500/40 transition-all"
                >
                  Tüm Canlı Araçlar
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 pt-4">
          <h3 className="text-lg font-black text-foreground dark:text-white">
            Diğer İlgili Hesap Araçları
          </h3>

          <div className="grid gap-4 sm:grid-cols-3">
            {relatedTools.map((rt) => (
              <Link
                key={rt.id}
                href={rt.href}
                className="group rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/85 p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-purple-400/50 hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-purple-500/15 border border-purple-500/30 p-2 text-purple-400">
                    <ToolIcon iconKey={rt.iconKey} className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground dark:text-white group-hover:text-purple-300 transition-colors">
                    {rt.name}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground dark:text-zinc-400">
                  {rt.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
