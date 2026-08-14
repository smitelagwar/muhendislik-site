import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeHeroVisual } from "@/components/home-hero-visual";
import { HomeSearchTrigger } from "@/components/home-search-trigger";
import type { HomeCounts } from "@/lib/home-content";

export function HomeHeroSection({ counts }: { counts: HomeCounts }) {
  return (
    <section
      data-testid="home-hero"
      aria-labelledby="home-hero-title"
      className="relative isolate border-b border-[var(--home-border)]"
    >
      <div className="home-hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-[1440px] px-5 pb-9 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pb-12 lg:pt-20 xl:px-16">
        <div className="grid items-center gap-10 lg:min-h-[560px] lg:grid-cols-12 lg:gap-8">
          <div className="relative z-10 lg:col-span-5">
            <span className="home-kicker">Mühendisler ve mimarlar için teknik çalışma alanı</span>
            <h1
              id="home-hero-title"
              className="mt-6 max-w-3xl text-[clamp(2.75rem,6.6vw,5.55rem)] font-bold leading-[0.94] tracking-[-0.055em] text-[var(--home-fg)]"
            >
              Hesapla.
              <span className="block text-[var(--home-accent)]">Öğren.</span>
              <span className="block">Sahada ilerle.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-[var(--home-muted)] sm:text-lg">
              İmar ve alan kararlarından taşıyıcı sistem hesabına, maliyet ve metrajdan saha uygulamasına kadar proje
              bilgisini tek çalışma alanında birleştirin.
            </p>

            <HomeSearchTrigger className="home-search-trigger mt-8 w-full max-w-xl" />

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold">
              <Link href="/hesaplamalar" className="home-quiet-link">
                Hesaplamaları incele
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/konu-haritasi" className="home-quiet-link">
                Konu haritasını aç
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <div className="home-status-rail mt-7" aria-label="Platform kapsamı">
              <span>{counts.calculations} hesaplama</span>
              <span>{counts.tools} araç</span>
              <span>{counts.articles} teknik içerik</span>
              <span>TS 500 / TBDY 2018</span>
            </div>
          </div>

          <div className="lg:col-span-7 lg:-mr-12 xl:-mr-16">
            <HomeHeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
