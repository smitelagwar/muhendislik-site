import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import type { HomeArticle } from "@/components/home-types";

const TOPIC_ROUTES = [
  { label: "Deprem ve Yönetmelikler", href: "/kategori/deprem-yonetmelik", code: "TBDY" },
  { label: "Şantiye ve Uygulama", href: "/kategori/santiye", code: "SAHA" },
  { label: "Geoteknik ve Zemin", href: "/kategori/geoteknik", code: "ZEMİN" },
  { label: "Malzeme Bilgisi", href: "/kategori/malzeme", code: "MALZ." },
] as const;

export function HomeEditorialSection({ articles }: { articles: HomeArticle[] }) {
  const [leadArticle, ...supportingArticles] = articles;

  if (!leadArticle) {
    return null;
  }

  return (
    <section
      data-testid="home-editorial"
      aria-labelledby="home-editorial-title"
      className="border-y border-[var(--home-border)] bg-[var(--home-surface-raised)]"
    >
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28 xl:px-16">
        <div className="grid gap-8 border-b border-[var(--home-border)] pb-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="home-section-kicker">02 / Öğren</p>
            <h2 id="home-editorial-title" className="mt-5 max-w-4xl text-3xl font-black tracking-[-0.035em] text-[var(--home-fg)] sm:text-5xl">
              Yönetmelikten şantiye pratiğine, seçilmiş teknik içerikler.
            </h2>
          </div>
          <Link href="/konu-haritasi" className="home-inline-link lg:col-span-4 lg:justify-self-end">
            Konu haritasını aç
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-12">
          <Link
            href={`/${leadArticle.slug}`}
            className="group relative min-h-[32rem] overflow-hidden rounded-xl border border-[var(--home-border)] bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)] lg:col-span-7"
          >
            <Image
              src={leadArticle.image}
              alt={leadArticle.title}
              fill
              loading="eager"
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/5" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-300">
                <span className="bg-amber-400 px-2 py-1 font-bold text-slate-950">Editör seçkisi</span>
                <span>{leadArticle.category}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden />
                  {leadArticle.readTime}
                </span>
              </div>
              <h3 className="mt-4 max-w-3xl text-2xl font-black leading-tight tracking-[-0.025em] text-white sm:text-4xl">
                {leadArticle.title}
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{leadArticle.description}</p>
            </div>
          </Link>

          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            {supportingArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/${article.slug}`}
                className="group grid min-h-56 overflow-hidden rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)] sm:grid-cols-[11rem_1fr] lg:grid-cols-[12rem_1fr]"
              >
                <div className="relative min-h-48 overflow-hidden sm:min-h-full">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    loading="eager"
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent sm:bg-gradient-to-r" aria-hidden />
                </div>
                <div className="flex flex-col justify-between p-5">
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--home-info)]">
                      {article.category}
                    </p>
                    <h3 className="mt-3 text-lg font-black leading-snug tracking-[-0.02em] text-[var(--home-fg)] transition-colors group-hover:text-[var(--home-accent)]">
                      {article.title}
                    </h3>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[var(--home-border)] pt-4 font-mono text-[10px] text-[var(--home-muted)]">
                    <span>{article.date}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <nav aria-label="Teknik içerik konuları" className="mt-8 grid gap-px overflow-hidden rounded-lg border border-[var(--home-border)] bg-[var(--home-border)] sm:grid-cols-2 lg:grid-cols-4">
          {TOPIC_ROUTES.map((topic) => (
            <Link
              key={topic.href}
              href={topic.href}
              className="group flex min-h-20 items-center gap-4 bg-[var(--home-surface)] px-5 py-4 transition-colors duration-200 hover:bg-[var(--home-bg)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)]"
            >
              <span className="font-mono text-[10px] font-bold text-[var(--home-accent)]">{topic.code}</span>
              <span className="text-sm font-bold text-[var(--home-fg)]">{topic.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-[var(--home-muted)] transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
