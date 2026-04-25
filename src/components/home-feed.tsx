"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { BookmarkButton } from "@/components/bookmark-button";
import type { HomeArticle } from "@/components/home-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FeedMode = "all" | "popular";
type ContentMode = "all" | "article" | "tool";

function getReadMinutes(readTime: string) {
  const match = readTime.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function isToolArticle(article: HomeArticle) {
  return article.sectionId === "araclar" || article.category === "Hesap Aracı";
}

export function HomeFeed({ articles }: { articles: HomeArticle[] }) {
  const [visibleCount, setVisibleCount] = useState(6);
  const [feedMode, setFeedMode] = useState<FeedMode>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [contentMode, setContentMode] = useState<ContentMode>("all");
  const [readingTimeFilter, setReadingTimeFilter] = useState("all");

  const popularSlugs = new Set(articles.slice(0, 8).map((article) => article.slug));
  const categories = Array.from(new Set(articles.map((article) => article.category))).sort((left, right) =>
    left.localeCompare(right, "tr"),
  );
  const filteredFeed = articles
    .filter((article) => (feedMode === "popular" ? popularSlugs.has(article.slug) : true))
    .filter((article) => (categoryFilter === "all" ? true : article.category === categoryFilter))
    .filter((article) => {
      if (contentMode === "all") {
        return true;
      }

      return contentMode === "tool" ? isToolArticle(article) : !isToolArticle(article);
    })
    .filter((article) => {
      const minutes = getReadMinutes(article.readTime);

      if (readingTimeFilter === "all") {
        return true;
      }

      return readingTimeFilter === "short" ? minutes <= 5 : minutes > 5;
    });

  const visibleArticles = filteredFeed.slice(0, visibleCount);
  const hasMore = filteredFeed.length > visibleCount;
  const isFiltered =
    feedMode !== "all" || categoryFilter !== "all" || contentMode !== "all" || readingTimeFilter !== "all";

  const resetFilters = () => {
    setFeedMode("all");
    setCategoryFilter("all");
    setContentMode("all");
    setReadingTimeFilter("all");
    setVisibleCount(6);
  };

  return (
    <section className="rounded-[32px] border border-amber-500/15 bg-zinc-950/80 p-5 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.75)] backdrop-blur md:p-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300/80">İçerik akışı</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">Son eklenen teknik içerikler</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
              Araç yazıları, mevzuat notları ve saha rehberlerini kategori, içerik tipi ve okuma süresine göre ayıklayın.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={feedMode === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFeedMode("all");
                setVisibleCount(6);
              }}
            >
              Tümü
            </Button>
            <Button
              type="button"
              variant={feedMode === "popular" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFeedMode("popular");
                setVisibleCount(6);
              }}
            >
              Öne çıkanlar
            </Button>
            {isFiltered ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="text-zinc-300">
                Filtreleri temizle
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-zinc-200">
            Kategori
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setVisibleCount(6);
              }}
              className="min-h-11 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-200 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
            >
              <option value="all">Tüm kategoriler</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-zinc-200">
            İçerik tipi
            <select
              value={contentMode}
              onChange={(event) => {
                setContentMode(event.target.value as ContentMode);
                setVisibleCount(6);
              }}
              className="min-h-11 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-200 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
            >
              <option value="all">Tüm içerik tipleri</option>
              <option value="article">Yalnızca makaleler</option>
              <option value="tool">Yalnızca araç yazıları</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-semibold text-zinc-200">
            Okuma süresi
            <select
              value={readingTimeFilter}
              onChange={(event) => {
                setReadingTimeFilter(event.target.value);
                setVisibleCount(6);
              }}
              className="min-h-11 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-200 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10"
            >
              <option value="all">Tüm süreler</option>
              <option value="short">5 dakikaya kadar</option>
              <option value="long">5 dakikadan uzun</option>
            </select>
          </label>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Eşleşen içerik</p>
            <p aria-live="polite" className="mt-3 text-3xl font-black text-white">
              {filteredFeed.length}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Filtrelerle kalan içerik sayısı anlık olarak güncellenir.</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {visibleArticles.map((article, index) => (
            <div
              key={article.slug}
              style={index > 1 ? { contentVisibility: "auto", containIntrinsicSize: "420px" } : undefined}
            >
              <Link
                href={`/${article.slug}`}
                prefetch={false}
                className="group block overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/80 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:shadow-[0_26px_60px_-34px_rgba(245,158,11,0.35)]"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="relative aspect-video w-full overflow-hidden md:h-64 md:w-64 md:flex-shrink-0 md:aspect-auto">
                    <Image
                      src={article.image}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 256px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/50 via-transparent to-transparent" />
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-6 md:p-8">
                    <div>
                      <Badge variant="outline" className={`${article.categoryColor} mb-3 border-none font-bold`}>
                        {article.category}
                      </Badge>
                      <h3 className="mb-3 text-2xl font-extrabold leading-tight text-white transition-colors group-hover:text-amber-200">
                        {article.title}
                      </h3>
                      <p className="mb-4 line-clamp-2 text-sm leading-7 text-zinc-400">{article.description}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-300">
                          {article.author
                            .split(" ")
                            .map((name) => name[0])
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-zinc-100">{article.author}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{article.date}</p>
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                        <span className="hidden items-center gap-1.5 sm:flex">
                          <Clock className="h-4 w-4" /> {article.readTime}
                        </span>
                        <div onClick={(event) => event.preventDefault()}>
                          <BookmarkButton
                            slug={article.slug}
                            title={article.title}
                            className="bg-zinc-800 p-2 hover:bg-zinc-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {filteredFeed.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-zinc-700 bg-zinc-900/60 p-10 text-center">
            <p className="text-lg font-black text-white">Filtrelerle eşleşen içerik bulunamadı.</p>
            <p className="mt-2 text-sm leading-7 text-zinc-400">
              Kategori veya süre filtrelerini gevşeterek tüm akışa geri dönebilirsiniz.
            </p>
          </div>
        ) : null}

        {hasMore ? (
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-full px-8"
              onClick={() => setVisibleCount((current) => current + 6)}
            >
              Daha fazla içerik göster
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
