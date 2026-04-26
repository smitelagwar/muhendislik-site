"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { BookmarkButton } from "@/components/bookmark-button";
import type { HomeArticle } from "@/components/home-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FeedMode = "all" | "popular";
type ContentMode = "all" | "article" | "tool";
type FilterOption = {
  value: string;
  label: string;
};

function getReadMinutes(readTime: string) {
  const match = readTime.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function isToolArticle(article: HomeArticle) {
  return article.sectionId === "araclar" || article.category === "Hesap Aracı";
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}) {
  const labelId = useId();

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold text-foreground/90">
      <p id={labelId}>{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-labelledby={labelId}
          className="min-h-11 w-full rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground/90 outline-none transition focus-visible:border-amber-400 focus-visible:ring-4 focus-visible:ring-amber-500/10"
        >
          <SelectValue placeholder={options[0]?.label} />
        </SelectTrigger>
        <SelectContent className="border-border bg-card text-foreground">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
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
  const categoryOptions: FilterOption[] = [
    { value: "all", label: "Tüm kategoriler" },
    ...categories.map((category) => ({
      value: category,
      label: category,
    })),
  ];
  const contentModeOptions: FilterOption[] = [
    { value: "all", label: "Tüm içerik tipleri" },
    { value: "article", label: "Yalnızca makaleler" },
    { value: "tool", label: "Yalnızca araç yazıları" },
  ];
  const readingTimeOptions: FilterOption[] = [
    { value: "all", label: "Tüm süreler" },
    { value: "short", label: "5 dakikaya kadar" },
    { value: "long", label: "5 dakikadan uzun" },
  ];

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
    <section className="rounded-[32px] border border-amber-500/15 bg-background/80 p-5 shadow-[0_28px_80px_-42px_rgba(0,0,0,0.75)] backdrop-blur md:p-7">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-border/80 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300/80">İçerik akışı</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground md:text-3xl">Son eklenen teknik içerikler</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
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
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters} className="text-foreground/80">
                Filtreleri temizle
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            label="Kategori"
            value={categoryFilter}
            options={categoryOptions}
            onChange={(nextValue) => {
              setCategoryFilter(nextValue);
              setVisibleCount(6);
            }}
          />

          <FilterSelect
            label="İçerik tipi"
            value={contentMode}
            options={contentModeOptions}
            onChange={(nextValue) => {
              setContentMode(nextValue as ContentMode);
              setVisibleCount(6);
            }}
          />

          <FilterSelect
            label="Okuma süresi"
            value={readingTimeFilter}
            options={readingTimeOptions}
            onChange={(nextValue) => {
              setReadingTimeFilter(nextValue);
              setVisibleCount(6);
            }}
          />

          <div className="rounded-2xl border border-border bg-card/80 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Eşleşen içerik</p>
            <p aria-live="polite" className="mt-3 text-3xl font-black text-foreground">
              {filteredFeed.length}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Filtrelerle kalan içerik sayısı anlık olarak güncellenir.</p>
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
                className="group block overflow-hidden rounded-[28px] border border-border bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/30 hover:shadow-[0_26px_60px_-34px_rgba(245,158,11,0.35)]"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-6 md:p-8">
                    <div>
                      <Badge variant="outline" className={`${article.categoryColor} mb-3 border-none font-bold`}>
                        {article.category}
                      </Badge>
                      <h3 className="mb-3 text-2xl font-extrabold leading-tight text-foreground transition-colors group-hover:text-primary">
                        {article.title}
                      </h3>
                      <p className="mb-4 line-clamp-2 text-sm leading-7 text-muted-foreground">{article.description}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-300">
                          {article.author
                            .split(" ")
                            .map((name) => name[0])
                            .join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">{article.author}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{article.date}</p>
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        <span className="hidden items-center gap-1.5 sm:flex">
                          <Clock className="h-4 w-4" /> {article.readTime}
                        </span>
                        <div onClick={(event) => event.preventDefault()}>
                          <BookmarkButton
                            slug={article.slug}
                            title={article.title}
                            className="bg-border p-2 hover:bg-secondary"
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
          <div className="rounded-[28px] border border-dashed border-border bg-card/60 p-10 text-center">
            <p className="text-lg font-black text-foreground">Filtrelerle eşleşen içerik bulunamadı.</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
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
