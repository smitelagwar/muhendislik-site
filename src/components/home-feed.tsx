"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Layers, BookMarked } from "lucide-react";
import { AnimatedSection } from "@/components/animated-section";
import type { HomeFeedGroup } from "@/components/home-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function HomeFeed({ groups }: { groups: HomeFeedGroup[] }) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-screen-2xl px-4 py-16 sm:px-6 lg:px-16 lg:py-20">
      <Tabs defaultValue={groups[0].id} className="gap-8">
        
        {/* Başlık ve Sekmeler */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-slate-200 dark:border-white/5 pb-6">
          <div className="max-w-3xl">
            <div className="relative flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-5">
              <span className="home-section-kicker">İçerik akışı</span>
              <span className="rounded bg-amber-500/10 dark:bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] text-amber-600 dark:text-amber-300 font-bold border border-amber-500/20">
                Arşiv &amp; Rehberler
              </span>
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl font-sans">
              Gürültüyü azaltan, taması hızlı ana yayın yüzeyi
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
              Mühendislik konularını karmaşık aramalarla boğmuyoruz. En yeni içerikleri, saha pratiklerini ve 
              deprem yönetmeliği detaylarını çalışma akışınıza göre sekmelerden kolayca tarayın.
            </p>
          </div>

          <TabsList
            variant="line"
            className="h-auto w-full flex-wrap gap-2 rounded-none bg-transparent p-0 lg:w-auto shrink-0 justify-start"
          >
            {groups.map((group) => (
              <TabsTrigger
                key={group.id}
                value={group.id}
                className="rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 px-4 py-2.5 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 data-[state=active]:border-amber-500 data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-300 transition-all cursor-pointer"
              >
                {group.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Sekme İçerikleri */}
        {groups.map((group) => (
          <TabsContent key={group.id} value={group.id} className="outline-none mt-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_22rem]">
              
              {/* Sol Sütun: Makaleler Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {group.articles.map((article, index) => (
                  <AnimatedSection key={article.slug} animation="fade-up" delay={index * 60}>
                    <Link
                      href={`/${article.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#070b12] shadow-sm hover:border-amber-400/50 dark:hover:border-amber-400/30 hover:shadow-md transition-all duration-300"
                    >
                      {/* Resim */}
                      <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-200 dark:border-white/5 bg-[#0a0f1a]">
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 30vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d]/80 via-transparent to-transparent opacity-60" />
                        
                        <div className="absolute left-4 top-4">
                          <Badge variant="outline" className={`${article.categoryColor} border-none font-bold text-[8px] uppercase tracking-wider`}>
                            {article.category}
                          </Badge>
                        </div>
                      </div>

                      {/* İçerik Gövdesi */}
                      <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                        <div>
                          <h3 className="text-lg font-black leading-snug text-slate-800 dark:text-white transition-colors group-hover:text-amber-500 dark:group-hover:text-amber-200 tracking-tight">
                            {article.title}
                          </h3>
                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {article.description}
                          </p>
                        </div>

                        {/* Alt Bilgiler */}
                        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                          <span>{article.author}</span>
                          <div className="flex items-center gap-3">
                            <span>{article.date}</span>
                            <span className="h-1 w-1 rounded-full bg-slate-700" />
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3.5 w-3.5" />
                              {article.readTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </AnimatedSection>
                ))}
              </div>

              {/* Sağ Sütun: Küme Özet Bilgisi (Aside Panel) */}
              <AnimatedSection animation="fade-up" className="h-fit">
                <aside className="rounded-xl border border-slate-200 dark:border-amber-400/15 bg-slate-50 dark:bg-[#070b12] p-6 shadow-sm relative overflow-hidden">
                  {/* Dekoratif grid hattı */}
                  <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none" 
                       style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                  {/* Üst accent bar */}
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-500 to-amber-600/50 rounded-t-xl" />
                  
                  <div className="relative flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-amber-500" />
                      Yayın Kümesi
                    </span>
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] text-amber-600 dark:text-amber-300 font-bold border border-amber-500/20">
                      Filtre Aktif
                    </span>
                  </div>

                  <div className="relative mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-5xl font-black tracking-tight text-slate-800 dark:text-white">
                        {group.totalCount}
                      </span>
                      <span className="text-lg font-black text-amber-500 dark:text-amber-400">+</span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Toplam Dokümantasyon
                    </p>
                  </div>

                  <p className="relative mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {group.description}
                  </p>

                  <ul className="relative mt-5 space-y-2 border-t border-slate-200 dark:border-white/5 pt-4 text-xs">
                    <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                      <BookMarked className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>Sıkça güncellenen mevzuat hatları</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                      <BookMarked className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>Saha mühendislerinden doğrulanmış notlar</span>
                    </li>
                  </ul>

                  <Button asChild className="home-button-primary mt-6 w-full justify-center text-xs font-bold uppercase py-5">
                    <Link href={group.href}>
                      {group.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </aside>
              </AnimatedSection>
              
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
