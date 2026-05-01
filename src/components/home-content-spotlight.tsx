import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import type { HomeArticle } from "@/components/home-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HomeContentSpotlightProps {
  leadArticle: HomeArticle;
  supportingArticles: HomeArticle[];
}

export function HomeContentSpotlight({ leadArticle, supportingArticles }: HomeContentSpotlightProps) {
  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-16 lg:py-20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="home-section-kicker">İçerik vitrini</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">Sahada işe yarayan güncel teknik odaklar</h2>
          <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
            Düz blog akışı yerine önce karar değeri yüksek içerikleri öne çıkarıyoruz. Görsel kalite, okuma temposu
            ve kategori sinyali birlikte çalışıyor.
          </p>
        </div>
        <Button asChild variant="outline" className="home-button-secondary self-start">
          <Link href="/konu-haritasi">Tüm kümeleri aç</Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <AnimatedSection animation="fade-up" className="h-full">
          <Link
            href={`/${leadArticle.slug}`}
            className="group flex h-full min-h-[30rem] flex-col overflow-hidden rounded-lg border border-slate-200 dark:border-white/10 bg-[#0b1018]"
          >
            <div className="relative min-h-[20rem] flex-1 overflow-hidden">
              <Image
                src={leadArticle.image}
                alt={leadArticle.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 62vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-[#06080d]/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="home-chip">Editör seçimi</span>
                  <Badge variant="outline" className={`${leadArticle.categoryColor} border-none`}>
                    {leadArticle.category}
                  </Badge>
                </div>
                <h3 className="mt-5 max-w-3xl text-2xl font-black leading-tight text-slate-900 dark:text-white sm:text-3xl">
                  {leadArticle.title}
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-6 p-6 sm:p-8">
              <p className="max-w-3xl text-sm leading-8 text-slate-600 dark:text-slate-300">{leadArticle.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400 dark:text-slate-400">
                <span>{leadArticle.author}</span>
                <span className="h-1 w-1 rounded-full bg-slate-700" />
                <span>{leadArticle.date}</span>
                <span className="h-1 w-1 rounded-full bg-slate-700" />
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4" />
                  {leadArticle.readTime}
                </span>
              </div>
            </div>
          </Link>
        </AnimatedSection>

        <div className="grid gap-4">
          {supportingArticles.map((article, index) => (
            <AnimatedSection key={article.slug} animation="fade-up" delay={index * 90}>
              <Link
                href={`/${article.slug}`}
                className="group flex h-full flex-col justify-between rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.68),rgba(7,11,18,0.92))] p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline" className={`${article.categoryColor} border-none`}>
                      {article.category}
                    </Badge>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{article.date}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-black leading-snug text-slate-900 dark:text-white transition-colors group-hover:text-cyan-600 dark:text-cyan-200">
                    {article.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{article.description}</p>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-200 transition-colors group-hover:text-slate-900 dark:group-hover:text-white">
                  İçeriği aç
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
