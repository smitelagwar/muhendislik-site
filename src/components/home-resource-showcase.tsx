import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  HomeCompactResourceLink,
  HomeFeaturedCalculationCard,
} from "@/components/home-resource-card";
import type {
  HomeFeaturedCalculation,
  HomeResourceLink,
  HomeStandard,
} from "@/lib/home-content";

interface HomeResourceShowcaseProps {
  featuredCalculation: HomeFeaturedCalculation;
  resources: HomeResourceLink[];
  standards: HomeStandard[];
}

export function HomeResourceShowcase({
  featuredCalculation,
  resources,
  standards,
}: HomeResourceShowcaseProps) {
  return (
    <section
      id="home-resources"
      data-testid="home-resource-grid"
      aria-labelledby="home-resources-title"
      className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28 xl:px-16"
    >
      <div className="grid gap-8 border-b border-[var(--home-border)] pb-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="home-section-kicker">01 / Hesapla</p>
          <h2
            id="home-resources-title"
            className="mt-5 max-w-4xl text-3xl font-bold tracking-[-0.035em] text-[var(--home-fg)] sm:text-5xl"
          >
            Projeyi varsayımdan ölçülebilir karara taşıyın.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[var(--home-muted)] lg:col-span-4 lg:justify-self-end">
          Gerçek bir ön metraj çıktısını görün; imar, maliyet ve taşıyıcı sistem araçlarına ihtiyacınız olan bağlamla geçin.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-7">
          <HomeFeaturedCalculationCard calculation={featuredCalculation} />
        </div>
        <div className="border-t border-[var(--home-border)] lg:col-span-5">
          {resources.map((resource) => (
            <HomeCompactResourceLink key={`${resource.kind}-${resource.id}`} resource={resource} />
          ))}
          <Link href="/kategori/araclar" className="home-quiet-link mt-5 w-fit">
            Tüm araçları incele
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="mt-12 border-y border-[var(--home-border)]" aria-label="Teknik dayanaklar">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4">
          {standards.map((standard, index) => (
            <Link
              key={standard.code}
              href={standard.href}
              className={`group flex min-h-24 items-center justify-between gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)] ${
                index % 2 === 0 ? "sm:pr-5" : "sm:pl-5"
              } ${index > 0 ? "border-t border-[var(--home-border)] sm:border-t-0" : ""} ${
                index > 1 ? "sm:border-t lg:border-t-0" : ""
              } ${index > 0 ? "lg:border-l lg:pl-5" : ""}`}
            >
              <span>
                <span className="block font-mono text-xs font-bold tracking-[0.12em] text-[var(--home-accent)]">
                  {standard.code}
                </span>
                <span className="mt-2 block text-xs text-[var(--home-muted)]">{standard.label}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-[var(--home-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--home-info)]" aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
