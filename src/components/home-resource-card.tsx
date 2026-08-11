"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { ArrowRight, Building2, FileText, LandPlot, Layers3, type LucideIcon } from "lucide-react";
import type { HomeResource } from "@/components/home-types";
import { ToolIcon } from "@/components/tool-icon";
import type { CalculationPageIconKey } from "@/lib/calculation-pages";

const CALCULATION_ICONS: Record<CalculationPageIconKey, LucideIcon> = {
  building: Building2,
  plot: LandPlot,
  file: FileText,
  layers: Layers3,
};

interface InteractiveCardStyle extends CSSProperties {
  "--pointer-x": string;
  "--pointer-y": string;
  "--rotate-x": string;
  "--rotate-y": string;
}

function ResourceIcon({ resource, className }: { resource: HomeResource; className: string }) {
  if (resource.kind === "tool") {
    return <ToolIcon iconKey={resource.iconKey} className={className} />;
  }

  const Icon = CALCULATION_ICONS[resource.iconKey];
  return <Icon className={className} />;
}

function supportsPointerEffects(event: ReactPointerEvent<HTMLAnchorElement>) {
  return (
    event.pointerType === "mouse" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function handlePointerMove(event: ReactPointerEvent<HTMLAnchorElement>) {
  if (!supportsPointerEffects(event)) return;

  const card = event.currentTarget;
  const bounds = card.getBoundingClientRect();
  const horizontal = (event.clientX - bounds.left) / bounds.width;
  const vertical = (event.clientY - bounds.top) / bounds.height;

  card.style.setProperty("--pointer-x", `${horizontal * 100}%`);
  card.style.setProperty("--pointer-y", `${vertical * 100}%`);
  card.style.setProperty("--rotate-x", `${(0.5 - vertical) * 6}deg`);
  card.style.setProperty("--rotate-y", `${(horizontal - 0.5) * 6}deg`);
}

function handlePointerLeave(event: ReactPointerEvent<HTMLAnchorElement>) {
  const card = event.currentTarget;
  card.style.setProperty("--pointer-x", "50%");
  card.style.setProperty("--pointer-y", "50%");
  card.style.setProperty("--rotate-x", "0deg");
  card.style.setProperty("--rotate-y", "0deg");
}

export function HomeResourceCard({ resource, featured }: { resource: HomeResource; featured: boolean }) {
  const interactiveStyle: InteractiveCardStyle = {
    "--pointer-x": "50%",
    "--pointer-y": "50%",
    "--rotate-x": "0deg",
    "--rotate-y": "0deg",
  };

  return (
    <Link
      href={resource.href}
      aria-label={`${resource.title} aracını aç`}
      data-testid="home-resource-card"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={interactiveStyle}
      className={`home-resource-card home-interactive-card group relative flex h-full cursor-pointer overflow-hidden rounded-xl border p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)] ${
        featured ? "home-resource-card-featured sm:p-8" : "border-[var(--home-border)]"
      }`}
    >
      <div
        className="pointer-events-none absolute -bottom-10 -right-8 opacity-[0.055] transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-105 dark:opacity-[0.08]"
        aria-hidden
      >
        <ResourceIcon resource={resource} className={featured ? "h-48 w-48" : "h-36 w-36"} />
      </div>

      <div className="relative z-10 flex h-full w-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <span className="home-resource-icon flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--home-border)] bg-[var(--home-surface-raised)] text-[var(--home-accent)]">
            <ResourceIcon resource={resource} className="h-5 w-5" />
          </span>
          <span className="border border-[var(--home-border)] bg-[var(--home-surface)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--home-muted)]">
            {resource.reference}
          </span>
        </div>

        <div className={featured ? "mt-auto pt-16" : "mt-auto pt-10"}>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--home-info)]">
            {resource.label}
          </p>
          <h3
            className={`mt-3 font-black leading-tight tracking-[-0.025em] text-[var(--home-fg)] ${
              featured ? "max-w-xl text-2xl sm:text-3xl" : "text-xl"
            }`}
          >
            {resource.title}
          </h3>
          <p
            className={`mt-3 leading-6 text-[var(--home-muted)] ${
              featured ? "max-w-xl text-sm" : "line-clamp-2 text-xs"
            }`}
          >
            {resource.description}
          </p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--home-fg)] transition-colors group-hover:text-[var(--home-accent)]">
            Aracı aç
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
