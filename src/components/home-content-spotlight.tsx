import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, UserCheck } from "lucide-react";
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
      {/* Üst Şerid */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-slate-200 dark:border-white/5 pb-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="home-section-kicker">İçerik vitrini</span>
            <span className="rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 px-2 py-0.5 font-mono text-[10px] border border-amber-500/20 font-bold">
              Teknik İnceleme
            </span>
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Sahada işe yarayan güncel teknik odaklar
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">
            Yönetmelik yorumları, saha tecrübeleri ve ön boyutlandırma rehberleri ile mesleki bilginizi güncel tutun. 
            Her makale akademik referanslar ve saha standartları ile doğrulanmıştır.
          </p>
        </div>
        <Button asChild variant="outline" className="home-button-secondary self-start shrink-0">
          <Link href="/konu-haritasi">Tüm makale akışı →</Link>
        </Button>
      </div>

      {/* Grid İçeriği */}
      <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        
        {/* Sol Sütun: Büyük Vitrin Kartı */}
        <AnimatedSection animation="fade-up" className="h-full">
          <Link
            href={`/${leadArticle.slug}`}
            className="group flex h-full min-h-[32rem] flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-amber-400/15 bg-[#0b1018] shadow-md hover:border-amber-400/40 dark:hover:border-amber-400/30 transition-all duration-300"
          >
            <div className="relative min-h-[22rem] flex-1 overflow-hidden">
              <Image
                src={leadArticle.image}
                alt={leadArticle.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 62vw"
                priority
              />
              {/* Karartma & Dereceli Maske */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-[#06080d]/50 to-transparent" />
              {/* Amber accent line - sol kenar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 via-amber-500/60 to-transparent" />
              
              {/* Kart İçi Etiketler */}
              <div className="absolute left-6 top-6 flex flex-wrap items-center gap-2">
                <span className="rounded bg-amber-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-900 shadow">
                  Editör Seçimi
                </span>
                <Badge variant="outline" className={`${leadArticle.categoryColor} border-none font-bold text-[9px] uppercase tracking-wider`}>
                  {leadArticle.category}
                </Badge>
              </div>

              {/* Alt Bilgi */}
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <h3 className="max-w-3xl text-2xl font-black leading-snug text-white sm:text-3xl tracking-tight transition-colors group-hover:text-amber-200">
                  {leadArticle.title}
                </h3>
              </div>
            </div>

            {/* Alt Detay Alanı */}
            <div className="flex flex-col gap-5 p-6 sm:p-8 bg-[#070b12] border-t border-amber-400/10">
              <p className="max-w-3xl text-xs leading-6 text-slate-400">
                {leadArticle.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-400 border-t border-white/5 pt-4">
                <span className="flex items-center gap-1.5 text-amber-500">
                  <UserCheck className="h-3.5 w-3.5" />
                  {leadArticle.author}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-700" />
                <span>{leadArticle.date}</span>
                <span className="h-1 w-1 rounded-full bg-slate-700" />
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  {leadArticle.readTime}
                </span>
              </div>
            </div>
          </Link>
        </AnimatedSection>

        {/* Sağ Sütun: Ufak Liste Görünümlü Kartlar */}
        <div className="grid gap-4 h-full content-start">
          {supportingArticles.map((article, index) => (
            <AnimatedSection key={article.slug} animation="fade-up" delay={index * 80}>
              <Link
                href={`/${article.slug}`}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-[#070b12] p-5 shadow-sm hover:border-cyan-400/60 dark:hover:border-cyan-400/30 transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Üst Kısım: Kategori ve Görsel */}
                  <div className="flex gap-4">
                    {/* Küçük Görsel Önizleme */}
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded border border-slate-200 dark:border-white/10">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="80px"
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className={`${article.categoryColor} border-none font-bold text-[8px] uppercase tracking-wider`}>
                          {article.category}
                        </Badge>
                        <span className="font-mono text-[9px] font-medium text-slate-400 shrink-0">
                          {article.date}
                        </span>
                      </div>
                      <h4 className="line-clamp-2 text-sm font-black text-slate-800 dark:text-white transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-200 tracking-tight leading-tight">
                        {article.title}
                      </h4>
                    </div>
                  </div>

                  <p className="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {article.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 font-semibold">{article.author}</span>
                  <div className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-300 transition-colors group-hover:text-slate-900 dark:group-hover:text-white">
                    <span>Rehberi Aç</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>

      </div>
    </section>
  );
}
