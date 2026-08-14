"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";

function supportsPointerEffect(event: ReactPointerEvent<HTMLDivElement>) {
  return event.pointerType === "mouse" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
  if (!supportsPointerEffect(event)) return;

  const bounds = event.currentTarget.getBoundingClientRect();
  const position = Math.min(94, Math.max(6, ((event.clientX - bounds.left) / bounds.width) * 100));
  event.currentTarget.style.setProperty("--hero-scan-x", `${position}%`);
}

function handlePointerLeave(event: ReactPointerEvent<HTMLDivElement>) {
  event.currentTarget.style.setProperty("--hero-scan-x", "42%");
}

export function HomeHeroVisual() {
  return (
    <div
      data-testid="home-hero-visual"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="home-hero-visual relative aspect-[3/2] overflow-hidden rounded-xl border border-[var(--home-border)]"
    >
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
      <div className="home-hero-visual-grid absolute inset-0" aria-hidden />
      <div className="home-hero-scan-line absolute inset-y-0" aria-hidden />

      <div className="absolute right-4 top-4 hidden items-center gap-2 border border-white/15 bg-black/55 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white backdrop-blur-md sm:flex">
        <span className="h-2 w-2 bg-amber-400" aria-hidden />
        Proje / Uygulama
      </div>
      <div className="absolute bottom-4 left-4 hidden border-l-2 border-blue-400 bg-black/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-100 backdrop-blur-md sm:block">
        Çizim → hesap → saha
      </div>
    </div>
  );
}
