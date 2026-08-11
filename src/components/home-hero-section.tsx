"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpenText, Calculator, GitBranch, Wrench } from "lucide-react";
import { HomeSearchTrigger } from "@/components/home-search-trigger";

const START_ROUTES = [
  {
    label: "Hesaplamalar",
    description: "Maliyet, metraj ve temel",
    href: "/hesaplamalar",
    icon: Calculator,
  },
  {
    label: "Yapısal araçlar",
    description: "Betonarme ve deprem",
    href: "/kategori/araclar",
    icon: Wrench,
  },
  {
    label: "Teknik içerikler",
    description: "Rehber ve yönetmelikler",
    href: "/konu-haritasi",
    icon: BookOpenText,
  },
  {
    label: "Bina aşamaları",
    description: "Projeden teslime süreç",
    href: "/kategori/bina-asamalari",
    icon: GitBranch,
  },
] as const;

const ROUTE_ICON_MOTIONS = [
  "group-hover:rotate-6 group-hover:scale-110 group-focus-visible:rotate-6 group-focus-visible:scale-110",
  "group-hover:-rotate-12 group-focus-visible:-rotate-12",
  "group-hover:-translate-y-0.5 group-hover:scale-110 group-focus-visible:-translate-y-0.5 group-focus-visible:scale-110",
  "group-hover:scale-110 group-focus-visible:scale-110",
] as const;

function supportsHeroPointerEffect(event: ReactPointerEvent<HTMLElement>) {
  return (
    event.pointerType === "mouse" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function handleHeroPointerMove(event: ReactPointerEvent<HTMLElement>) {
  if (!supportsHeroPointerEffect(event)) return;

  const hero = event.currentTarget;
  const bounds = hero.getBoundingClientRect();
  hero.style.setProperty("--hero-pointer-x", `${event.clientX - bounds.left}px`);
  hero.style.setProperty("--hero-pointer-y", `${event.clientY - bounds.top}px`);
}

function handleHeroPointerLeave(event: ReactPointerEvent<HTMLElement>) {
  event.currentTarget.style.removeProperty("--hero-pointer-x");
  event.currentTarget.style.removeProperty("--hero-pointer-y");
}

interface HomeHeroSectionProps {
  calculationCount: number;
  toolCount: number;
}

export function HomeHeroSection({ calculationCount, toolCount }: HomeHeroSectionProps) {
  const reducedMotion = useReducedMotion();
  const reveal = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 22 },
        animate: { opacity: 1, y: 0 },
      };

  return (
    <section
      data-testid="home-hero"
      aria-labelledby="home-hero-title"
      onPointerMove={handleHeroPointerMove}
      onPointerLeave={handleHeroPointerLeave}
      className="home-hero-interactive group/home-hero relative isolate border-b border-[var(--home-border)]"
    >
      <div className="home-hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="home-hero-pointer-layer pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-[1440px] px-5 pb-8 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pb-10 lg:pt-20 xl:px-16">
        <div className="grid items-center gap-10 lg:min-h-[570px] lg:grid-cols-12 lg:gap-4">
          <motion.div
            {...reveal}
            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 lg:col-span-6 xl:col-span-5"
          >
            <span className="home-kicker">Mühendis ve mimarlar için teknik çalışma alanı</span>
            <h1
              id="home-hero-title"
              className="mt-6 max-w-3xl text-[clamp(2.8rem,7vw,5.8rem)] font-black leading-[0.92] tracking-[-0.055em] text-[var(--home-fg)]"
            >
              Hesapla.
              <span className="block text-[var(--home-accent)]">Öğren.</span>
              <span className="block">Sahada ilerle.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-[var(--home-muted)] sm:text-lg">
              Yapısal araçlar, maliyet ve metraj hesapları, yönetmelik rehberleri ve bina yapım aşamaları tek
              çalışma alanında.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/hesaplamalar" className="home-button-primary justify-center sm:justify-start">
                Hesaplamalara git
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/kategori/araclar" className="home-button-secondary justify-center sm:justify-start">
                Yapısal araçları aç
              </Link>
            </div>

            <HomeSearchTrigger className="home-search-trigger mt-4 w-full max-w-xl" />

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--home-muted)]">
              <span>{calculationCount} aktif hesaplama</span>
              <span className="h-1 w-1 rounded-full bg-[var(--home-accent)]" aria-hidden />
              <span>{toolCount} mühendislik aracı</span>
              <span className="h-1 w-1 rounded-full bg-[var(--home-info)]" aria-hidden />
              <span>TS 500 · TBDY 2018</span>
            </div>
          </motion.div>

          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, x: 28, scale: 0.985 }}
            animate={reducedMotion ? undefined : { opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.62, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative lg:col-span-6 lg:-mr-12 xl:col-span-7 xl:-mr-16"
          >
            <div className="home-hero-visual relative aspect-[3/2] overflow-hidden rounded-xl border border-[var(--home-border)]">
              <Image
                src="/home/hero-structure-light.webp"
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover dark:hidden"
                aria-hidden
              />
              <Image
                src="/home/hero-structure-dark.webp"
                alt=""
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="hidden object-cover dark:block"
                aria-hidden
              />
              <div className="home-hero-visual-shade absolute inset-0" aria-hidden />
              <div className="absolute right-4 top-4 hidden items-center gap-2 border border-white/15 bg-black/55 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur-md sm:flex">
                <span className="h-2 w-2 bg-amber-400" aria-hidden />
                Betonarme sistem / 01
              </div>
              <div className="absolute bottom-4 left-4 hidden border-l-2 border-blue-400 bg-black/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-100 backdrop-blur-md sm:block">
                Taşıyıcı sistem → uygulama
              </div>
            </div>
          </motion.div>
        </div>

        <nav aria-label="Anasayfa başlangıç rotaları" className="mt-8 grid gap-px overflow-hidden rounded-lg border border-[var(--home-border)] bg-[var(--home-border)] sm:grid-cols-2 lg:grid-cols-4">
          {START_ROUTES.map((route, index) => (
            <Link
              key={route.href}
              href={route.href}
              className="group flex min-h-24 items-center gap-4 bg-[var(--home-surface)] px-5 py-4 transition-colors duration-200 hover:bg-[var(--home-surface-raised)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[var(--home-border)] text-[var(--home-accent)]">
                <route.icon
                  className={`home-route-icon h-5 w-5 transition-transform duration-200 ${ROUTE_ICON_MOTIONS[index]}`}
                  aria-hidden
                />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-[var(--home-fg)]">{route.label}</span>
                <span className="mt-1 block text-xs text-[var(--home-muted)]">{route.description}</span>
              </span>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-[var(--home-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--home-accent)]" aria-hidden />
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
