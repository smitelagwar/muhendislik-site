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
    <section className="relative isolate overflow-hidden border-b border-white/10">
      <Image
        src="/blog-images/structural_frame_3d_1774081447633.png"
        alt="Betonarme taşıyıcı sistem görselleştirmesi"
        fill
        priority
        className="object-cover object-center opacity-20"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(6,8,13,0.96)_0%,rgba(6,8,13,0.84)_48%,rgba(6,8,13,0.92)_100%)]" />
      <div className="home-grid-backdrop absolute inset-0 opacity-80" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#06080d] to-transparent" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-screen-2xl flex-col justify-between px-4 pb-8 pt-8 sm:px-6 lg:px-16 lg:pb-12 lg:pt-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_24rem] lg:items-end">
          <motion.div
            {...reveal}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="home-kicker">Dijital blueprint</span>
              <span className="home-chip">TS 500 • TBDY 2018 • TS EN 1992-1-1 • TS EN 206</span>
            </div>

            <h1 className="mt-6 max-w-5xl text-4xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              Mühendislik kararlarını
              <span className="home-gradient-text block">hızlandıran çalışma yüzeyi</span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Şantiye notları, betonarme araçları, deprem referansları ve bina aşamalarını tek akışta birleştiren
              premium ana yüzey. Hızlı açılır, mobilde net okunur, karar vermeyi yavaşlatmaz.
            </p>

            <div className="mt-6 flex min-h-10 items-center border-l border-amber-400/35 pl-4 text-sm font-medium text-slate-200 sm:text-base">
              <span className="mr-2 text-slate-400">Odak:</span>
              <TypingEffect
                words={HERO_WORDS}
                className="font-mono text-amber-200"
                cursorClassName="bg-amber-300"
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="home-button-primary">
                <Link href="/kategori/araclar">
                  Araçları keşfet
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="home-button-secondary">
                <Link href="/konu-haritasi">İçerik akışını aç</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="home-proof-tile">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  <ScrollText className="h-4 w-4 text-cyan-300" />
                  Teknik kayıt
                </div>
                <div className="mt-3 text-2xl font-black text-white">{articleCount}+</div>
                <p className="mt-1 text-sm leading-6 text-slate-400">Makale, rehber ve mevzuat özeti.</p>
              </div>
              <div className="home-proof-tile">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  <HardHat className="h-4 w-4 text-amber-300" />
                  Canlı araç
                </div>
                <div className="mt-3 text-2xl font-black text-white">{toolCount}</div>
                <p className="mt-1 text-sm leading-6 text-slate-400">Gerçek iş akışına dönük hesap araçları.</p>
              </div>
              <div className="home-proof-tile">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  <Clock3 className="h-4 w-4 text-cyan-300" />
                  Saha fazı
                </div>
                <div className="mt-3 text-2xl font-black text-white">{phaseCount}</div>
                <p className="mt-1 text-sm leading-6 text-slate-400">Projeden teslime uzanan ana fazlar.</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...reveal}
            transition={{ duration: 0.7, delay: reducedMotion ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-4"
          >
            <Link href={`/${heroArticle.slug}`} className="home-glass-panel group overflow-hidden">
              <div className="relative h-52 overflow-hidden border-b border-white/10">
                <Image
                  src={heroArticle.image}
                  alt={heroArticle.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 384px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-[#06080d]/25 to-transparent" />
                <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                  <span className="home-chip">Editör seçimi</span>
                  <Badge variant="outline" className={`${heroArticle.categoryColor} border-none`}>
                    {heroArticle.category}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  <span>Öne çıkan içerik</span>
                  <span>{heroArticle.date}</span>
                </div>
                <h2 className="text-xl font-black leading-tight text-white transition-colors group-hover:text-amber-200">
                  {heroArticle.title}
                </h2>
                <p className="line-clamp-3 text-sm leading-7 text-slate-300">{heroArticle.description}</p>
              </div>
            </Link>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Link href={`/${secondaryArticle.slug}`} className="home-glass-panel group p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="home-chip">Saha notu</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {secondaryArticle.readTime}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-black leading-snug text-white transition-colors group-hover:text-cyan-200">
                  {secondaryArticle.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-300">{secondaryArticle.description}</p>
              </Link>

              <Link href={featuredTool.href} className="home-glass-panel group p-4">
                <span className="home-chip">Hızlı giriş</span>
                <h3 className="mt-4 text-lg font-black text-white transition-colors group-hover:text-amber-200">
                  {featuredTool.name}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">{featuredTool.description}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                  Aracı aç
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          {...reveal}
          transition={{ duration: 0.7, delay: reducedMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex justify-center lg:justify-start"
        >
          <Link
            href="#home-tools"
            className="inline-flex items-center gap-3 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
          >
            <span>Araç yüzeyine in</span>
            <span className="home-scroll-indicator inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <ChevronDown className="h-4 w-4" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
