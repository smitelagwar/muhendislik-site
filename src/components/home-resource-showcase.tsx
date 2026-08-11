import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HomeResourceCard } from "@/components/home-resource-card";
import type { HomeResource } from "@/components/home-types";

const CARD_LAYOUTS = [
  "lg:col-span-7 lg:min-h-[25rem]",
  "lg:col-span-5 lg:min-h-[25rem]",
  "lg:col-span-3",
  "lg:col-span-3",
  "lg:col-span-3",
  "lg:col-span-3",
] as const;

export function HomeResourceShowcase({ resources }: { resources: HomeResource[] }) {
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
          <h2 id="home-resources-title" className="mt-5 max-w-4xl text-3xl font-black tracking-[-0.035em] text-[var(--home-fg)] sm:text-5xl">
            Günün işini doğru araçla hızlandırın.
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-[var(--home-muted)] lg:col-span-4 lg:justify-self-end">
          Ön maliyetten betonarme kesit kontrolüne kadar en sık kullanılan modüllere doğrudan geçin.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-12" role="list">
        {resources.map((resource, index) => {
          const featured = index < 2;

          return (
            <article
              key={`${resource.kind}-${resource.id}`}
              className={`${CARD_LAYOUTS[index] ?? "lg:col-span-3"} ${featured ? "min-h-[19rem]" : "min-h-[13rem]"}`}
              role="listitem"
            >
              <HomeResourceCard resource={resource} featured={featured} />
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link href="/hesaplamalar" className="home-button-secondary justify-center">
          Tüm hesaplamalar
        </Link>
        <Link href="/kategori/araclar" className="home-button-primary justify-center">
          Tüm yapısal araçlar
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
