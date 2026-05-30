"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, Clock3, HardHat, ScrollText } from "lucide-react";
import { TypingEffect } from "@/components/typing-effect";
import type { HomeArticle } from "@/components/home-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ToolDefinition } from "@/lib/tools-data";
import { HomeQuickConsole } from "@/components/home-quick-console";

interface HomeHeroSectionProps {
  heroArticle: HomeArticle;
  secondaryArticle: HomeArticle;
  featuredTool: ToolDefinition;
  articleCount: number;
  toolCount: number;
  phaseCount: number;
}

const HERO_WORDS = [
  "Betonarme ön boyutlandırma",
  "Deprem ve mevzuat kararları",
  "Şantiye kontrol akışları",
  "Bina aşamaları yol haritası",
];

export function HomeHeroSection({
  heroArticle,
  secondaryArticle,
  featuredTool,
  articleCount,
  toolCount,
  phaseCount,
}: HomeHeroSectionProps) {
  const reducedMotion = useReducedMotion();

  const reveal = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <section className="relative isolate overflow-hidden border-b border-slate-200 dark:border-white/10">
      <Image
        src="/blog-images/structural_frame_3d_1774081447633.png"
        alt="Betonarme taşıyıcı sistem görselleştirmesi"
        fill
        priority
        className="object-cover object-center opacity-[0.18]"
        sizes="100vw"
      />
      {/* Ana karartma gradyanı */}
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(6,8,13,0.97)_0%,rgba(6,8,13,0.85)_48%,rgba(6,8,13,0.93)_100%)]" />
      {/* Blueprint grid arka planı */}
      <div className="home-grid-backdrop absolute inset-0 opacity-70" />
      {/* Alt karartma */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#06080d] to-transparent" />
      {/* Üst köşe ambient ışıma — amber */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      {/* Sağ köşe ambient ışıma — cyan */}
      <div className="absolute -top-20 right-0 h-80 w-80 rounded-full bg-cyan-500/8 blur-3xl pointer-events-none" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-screen-2xl flex-col justify-between px-4 pb-10 pt-10 sm:px-6 lg:px-16 lg:pb-14 lg:pt-16">
        <div className="grid gap-10 lg:gap-16 lg:grid-cols-[minmax(0,1.15fr)_26rem] lg:items-center">
          <motion.div
            {...reveal}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            {/* Etiket şeridi */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="home-kicker">Dijital blueprint</span>
              <span className="home-chip">TS 500 • TBDY 2018 • TS EN 1992-1-1 • TS EN 206</span>
            </div>

            {/* Ana başlık */}
            <h1 className="mt-7 max-w-5xl text-[2.6rem] font-black leading-[0.94] text-white sm:text-6xl lg:text-[5rem] tracking-tight">
              Mühendislik kararlarını
              <span className="home-gradient-text block mt-1">hızlandıran çalışma yüzeyi</span>
            </h1>

            <p className="mt-7 max-w-2xl text-sm leading-[1.85] text-slate-400 sm:text-base">
              Şantiye notları, betonarme araçları, deprem referansları ve bina aşamalarını tek akışta
              birleştiren premium ana yüzey. Hızlı açılır, mobilde net okunur, karar vermeyi yavaşlatmaz.
            </p>

            {/* Typing efekti — odak çizgisi */}
            <div className="mt-6 flex min-h-10 items-center gap-3 border-l-2 border-amber-400/50 pl-4 text-sm font-medium text-slate-200 sm:text-base">
              <span className="text-slate-500">Odak:</span>
              <TypingEffect
                words={HERO_WORDS}
                className="font-mono text-amber-300"
                cursorClassName="bg-amber-300"
              />
            </div>

            {/* CTA Butonları */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="home-button-primary text-sm font-bold">
                <Link href="/kategori/araclar">
                  Araçları keşfet
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="home-button-secondary text-sm">
                <Link href="/konu-haritasi">İçerik akışını aç</Link>
              </Button>
            </div>

            {/* Proof tiles — flex wrap for both mobile and desktop */}
            <div className="mt-10 flex flex-wrap gap-3">
              <div className="home-proof-tile group flex-1 min-w-[9rem]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  <ScrollText className="h-3.5 w-3.5 text-cyan-400" />
                  Teknik kayıt
                </div>
                <div className="mt-3 font-mono text-3xl font-black text-white tracking-tight">
                  {articleCount}<span className="text-amber-400">+</span>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">Makale, rehber ve mevzuat özeti.</p>
              </div>
              <div className="home-proof-tile group flex-1 min-w-[9rem]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  <HardHat className="h-3.5 w-3.5 text-amber-400" />
                  Canlı araç
                </div>
                <div className="mt-3 font-mono text-3xl font-black text-white tracking-tight">{toolCount}</div>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">Gerçek iş akışına dönük hesap araçları.</p>
              </div>
              <div className="home-proof-tile group flex-1 min-w-[9rem]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  <Clock3 className="h-3.5 w-3.5 text-cyan-400" />
                  Saha fazı
                </div>
                <div className="mt-3 font-mono text-3xl font-black text-white tracking-tight">{phaseCount}</div>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">Projeden teslime uzanan ana fazlar.</p>
              </div>
            </div>
          </motion.div>

          {/* Sağ Panel — Quick Console */}
          <motion.div
            {...reveal}
            transition={{ duration: 0.7, delay: reducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <HomeQuickConsole featuredArticle={heroArticle} />
          </motion.div>
        </div>

        {/* Aşağı kaydırma göstergesi */}
        <motion.div
          {...reveal}
          transition={{ duration: 0.7, delay: reducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 flex justify-center lg:justify-start"
        >
          <Link
            href="#home-tools"
            className="inline-flex items-center gap-3 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-200"
          >
            <span>Araç yüzeyine in</span>
            <span className="home-scroll-indicator inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
              <ChevronDown className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
