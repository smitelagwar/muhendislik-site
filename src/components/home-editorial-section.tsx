import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import type { HomeArticle } from "@/lib/home-content";

const TOPIC_ROUTES = [
  { label: "Deprem ve mevzuat", href: "/kategori/deprem-yonetmelik", code: "TBDY" },
  { label: "Malzeme bilgisi", href: "/kategori/malzeme", code: "MALZ." },
  { label: "Şantiye ve uygulama", href: "/kategori/santiye", code: "SAHA" },
  { label: "Tüm konular", href: "/konu-haritasi", code: "HARİTA" },
] as const;

export function HomeEditorialSection({ articles }: { articles: HomeArticle[] }) {
  const [leadArticle, ...supportingArticles] = articles;

  if (!leadArticle) return null;

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
            <h2
              id="home-editorial-title"
              className="mt-5 max-w-4xl text-3xl font-bold tracking-[-0.035em] text-[var(--home-fg)] sm:text-5xl"
            >
              Yönetmelikten malzemeye, projeden saha pratiğine.
            </h2>
          </div>
          <Link href="/konu-haritasi" className="home-quiet-link lg:col-span-4 lg:justify-self-end">
            Konu haritasını aç
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <Link
            href={`/${leadArticle.slug}`}
            data-testid="home-lead-article"
            className="group relative min-h-[27rem] overflow-hidden rounded-xl border border-[var(--home-border)] bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)] sm:min-h-[32rem] lg:col-span-7"
          >
            <Image
              src={leadArticle.image}
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.018]"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/5" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-300">
                <span className="bg-amber-400 px-2 py-1 font-bold text-slate-950">Öne çıkan rehber</span>
                <span>{leadArticle.category}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden />
                  {leadArticle.readTime}
                </span>
              </div>
              <h3 className="mt-4 max-w-3xl text-2xl font-bold leading-tight tracking-[-0.025em] text-white sm:text-4xl">
                {leadArticle.title}
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{leadArticle.description}</p>
            </div>
          </Link>

          <div className="border-y border-[var(--home-border)] lg:col-span-5">
            {supportingArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/${article.slug}`}
                data-testid="home-supporting-article"
                className="group grid min-h-0 grid-cols-[7rem_minmax(0,1fr)] gap-4 border-b border-[var(--home-border)] py-4 last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)] sm:min-h-56 sm:grid-cols-[11rem_1fr] sm:gap-5 sm:py-5"
              >
                <div className="relative min-h-32 overflow-hidden rounded-md border border-[var(--home-border)] sm:min-h-full">
                  <Image
                    src={article.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 176px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.025]"
                    aria-hidden
                  />
                </div>
                <div className="flex min-w-0 flex-col justify-between py-1">
                  <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--home-info)]">
                      {article.category}
                    </p>
                    <h3 className="mt-3 text-lg font-bold leading-snug tracking-[-0.02em] text-[var(--home-fg)] transition-colors group-hover:text-[var(--home-accent)]">
                      {article.title}
                    </h3>
                    <p className="mt-3 hidden line-clamp-2 text-xs leading-5 text-[var(--home-muted)] sm:block">{article.description}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between font-mono text-[10px] text-[var(--home-muted)] sm:mt-5">
                    <span>{article.date} · {article.readTime}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <nav aria-label="Teknik içerik konuları" className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-[var(--home-border)] pt-6">
          {TOPIC_ROUTES.map((topic) => (
            <Link key={topic.href} href={topic.href} className="home-topic-link group">
              <span className="font-mono text-[9px] font-bold text-[var(--home-accent)]">{topic.code}</span>
              <span>{topic.label}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
