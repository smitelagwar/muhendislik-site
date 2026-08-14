import Link from "next/link";
import { ArrowRight, Building2, FileText, LandPlot, Layers3, type LucideIcon } from "lucide-react";
import { ToolIcon } from "@/components/tool-icon";
import type {
  HomeFeaturedCalculation,
  HomeResourceLink,
} from "@/lib/home-content";
import type { CalculationPageIconKey } from "@/lib/calculation-pages";

const CALCULATION_ICONS: Record<CalculationPageIconKey, LucideIcon> = {
  building: Building2,
  plot: LandPlot,
  file: FileText,
  layers: Layers3,
};

function ResourceIcon({ resource, className }: { resource: HomeResourceLink; className: string }) {
  if (resource.kind === "tool") {
    return <ToolIcon iconKey={resource.iconKey} className={className} />;
  }

  const Icon = CALCULATION_ICONS[resource.iconKey];
  return <Icon className={className} />;
}

export function HomeFeaturedCalculationCard({ calculation }: { calculation: HomeFeaturedCalculation }) {
  return (
    <article
      data-testid="home-featured-calculation"
      className="home-featured-calculation relative overflow-hidden rounded-xl border border-[var(--home-border)]"
    >
      <div className="home-featured-blueprint pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative flex h-full flex-col p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="home-section-kicker">Örnek ön metraj</span>
          <span className="border border-[var(--home-border)] bg-[var(--home-surface)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--home-muted)]">
            Canlı hesap motoru
          </span>
        </div>

        <div className="mt-8 max-w-2xl">
          <h3 className="text-2xl font-bold tracking-[-0.03em] text-[var(--home-fg)] sm:text-4xl">
            {calculation.title}
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--home-muted)]">{calculation.description}</p>
          <p className="mt-5 border-l-2 border-[var(--home-info)] pl-3 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--home-muted)]">
            {calculation.scenario}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[var(--home-border)] bg-[var(--home-border)] sm:grid-cols-4">
          {calculation.metrics.map((metric) => (
            <div key={metric.label} className="bg-[var(--home-surface)] px-4 py-5">
              <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--home-muted)]">
                {metric.label}
              </span>
              <strong className="mt-2 block font-mono text-lg font-bold tabular-nums text-[var(--home-fg)] sm:text-xl">
                {metric.value}
              </strong>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-5 border-t border-[var(--home-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.11em] text-[var(--home-muted)]">
            {calculation.proofPoints.map((point) => (
              <li key={point} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-[var(--home-accent-solid)]" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
          <Link href={calculation.href} className="home-button-primary shrink-0 justify-center">
            Hesabı aç
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function HomeCompactResourceLink({ resource }: { resource: HomeResourceLink }) {
  return (
    <Link
      href={resource.href}
      data-testid="home-resource-link"
      className="home-resource-row group grid min-h-20 grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--home-border)] py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)] sm:min-h-24 sm:py-4"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-md border border-[var(--home-border)] bg-[var(--home-surface-raised)] text-[var(--home-accent)]">
        <ResourceIcon resource={resource} className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <strong className="text-sm font-bold text-[var(--home-fg)]">{resource.title}</strong>
          <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-[var(--home-info)]">
            {resource.reference}
          </span>
        </span>
        <span className="mt-1.5 hidden line-clamp-1 text-xs leading-5 text-[var(--home-muted)] sm:block">
          {resource.description}
        </span>
      </span>
      <ArrowRight
        className="h-4 w-4 text-[var(--home-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--home-accent)]"
        aria-hidden
      />
    </Link>
  );
}
