"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
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
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="home-section-kicker">İçerik akışı</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Gürültüyü azaltan, taraması hızlı ana yayın yüzeyi
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Ana sayfada tüm filtreleri kullanıcıya yüklemiyoruz. Önce içerikleri kullanım senaryosuna göre ayırıyor,
              sonra ilgili kümeyi birkaç tıkla açılabilir hale getiriyoruz.
            </p>
          </div>

          <TabsList
            variant="line"
            className="h-auto w-full flex-wrap gap-2 rounded-none bg-transparent p-0 lg:w-auto"
          >
            {groups.map((group) => (
              <TabsTrigger
                key={group.id}
                value={group.id}
                className="rounded-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 data-[state=active]:border-amber-400/30 data-[state=active]:bg-amber-400/10 data-[state=active]:text-white"
              >
                {group.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {groups.map((group) => (
          <TabsContent key={group.id} value={group.id} className="outline-none">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
              <div className="grid gap-4 md:grid-cols-2">
                {group.articles.map((article, index) => (
                  <AnimatedSection key={article.slug} animation="fade-up" delay={index * 70}>
                    <Link
                      href={`/${article.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(7,11,18,0.92))]"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10">
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 30vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-transparent to-transparent" />
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-5">
                        <div>
                          <Badge variant="outline" className={`${article.categoryColor} border-none`}>
                            {article.category}
                          </Badge>
                          <h3 className="mt-4 text-xl font-black leading-snug text-white transition-colors group-hover:text-amber-200">
                            {article.title}
                          </h3>
                          <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-300">{article.description}</p>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          <span>{article.date}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-700" />
                          <span className="inline-flex items-center gap-1.5">
                            <Clock3 className="h-4 w-4" />
                            {article.readTime}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </AnimatedSection>
                ))}
              </div>

              <AnimatedSection animation="fade-up" className="h-fit">
                <aside className="rounded-lg border border-white/10 bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(7,11,18,0.94))] p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{group.label}</p>
                  <div className="mt-4 font-mono text-4xl font-black text-white">{group.totalCount}+</div>
                  <p className="mt-4 text-sm leading-7 text-slate-300">{group.description}</p>
                  <Button asChild className="home-button-primary mt-8 w-full justify-center">
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
