"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { ArrowRight, ChevronRight, Clock, FileText, Filter, Mail, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookmarkButton } from "@/components/bookmark-button";
import ConstructionScrollytelling from "@/components/construction-scrollytelling";
import { ToolIcon } from "@/components/tool-icon";
import { TOOLS_HUB_HREF, getLiveTools } from "@/lib/tools-data";

interface Article {
  title: string;
  slug: string;
  sectionId?: string;
  category: string;
  categoryColor: string;
  description: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
}

type FeedMode = "all" | "popular";
type ContentMode = "all" | "article" | "tool";

function getReadMinutes(readTime: string) {
  const match = readTime.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function isToolArticle(article: Article) {
  return article.sectionId === "araclar" || article.category === "Hesap Aracı";
}

export default function HomeClient({ allArticles }: { allArticles: Article[] }) {
  const [visibleCount, setVisibleCount] = useState(4);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [contentMode, setContentMode] = useState<ContentMode>("all");
  const [readingTimeFilter, setReadingTimeFilter] = useState("all");

  const liveTools = useMemo(() => getLiveTools(), []);
  const heroArticle = allArticles[0] ?? null;
  const featuredArticles = allArticles.slice(1, 3);
  const feedBase = allArticles.slice(3);
  const popularSlugs = useMemo(() => new Set(allArticles.slice(0, 6).map((article) => article.slug)), [allArticles]);

  const categories = useMemo(
    () => Array.from(new Set(feedBase.map((article) => article.category))).sort((left, right) => left.localeCompare(right, "tr")),
    [feedBase],
  );

  const filteredFeed = useMemo(() => {
    return feedBase
      .filter((article) => (feedMode === "popular" ? popularSlugs.has(article.slug) : true))
      .filter((article) => (categoryFilter === "all" ? true : article.category === categoryFilter))
      .filter((article) => {
        if (contentMode === "all") {
          return true;
        }

        if (contentMode === "tool") {
          return isToolArticle(article);
        }

        return !isToolArticle(article);
      })
      .filter((article) => {
        const minutes = getReadMinutes(article.readTime);

        if (readingTimeFilter === "all") {
          return true;
        }

        if (readingTimeFilter === "short") {
          return minutes <= 5;
        }

        return minutes > 5;
      });
  }, [categoryFilter, contentMode, feedBase, feedMode, popularSlugs, readingTimeFilter]);

  const visibleArticles = filteredFeed.slice(0, visibleCount);
  const hasMore = filteredFeed.length > visibleCount;

  const loadMore = () => setVisibleCount((current) => current + 4);
  const updateFeedMode = (mode: FeedMode) => {
    setFeedMode(mode);
    setVisibleCount(4);
  };
  const updateCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    setVisibleCount(4);
  };
  const updateContentMode = (mode: ContentMode) => {
    setContentMode(mode);
    setVisibleCount(4);
  };
  const updateReadingTimeFilter = (value: string) => {
    setReadingTimeFilter(value);
    setVisibleCount(4);
  };

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex flex-col gap-0">
        <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
          {heroArticle ? (
            <m.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="grid grid-cols-1 gap-6 lg:grid-cols-12"
            >
              <div className="group relative aspect-[16/9] overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-900 shadow-xl dark:border-zinc-800 lg:col-span-8 lg:aspect-[2/1]">
                <Image
                  src={heroArticle.image}
                  alt={heroArticle.title}
                  fill
                  priority
                  className="object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
                <div className="absolute left-4 top-4 z-10">
                  <span className="rounded-full bg-white/20 px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white backdrop-blur-md">
                    Son yayın
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 lg:w-3/4">
                  <Badge className="mb-4 border-none bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-700">
                    {heroArticle.category}
                  </Badge>
                  <h1 className="mb-4 text-3xl font-black leading-[1.1] tracking-tight text-white md:text-5xl">
                    {heroArticle.title}
                  </h1>
                  <div className="mb-6 flex items-center gap-4 text-sm font-medium text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> {heroArticle.readTime}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-zinc-500" />
                    <span>{heroArticle.author}</span>
                  </div>
                  <Button asChild className="group h-12 rounded-full border-none bg-white px-8 text-zinc-900 hover:bg-zinc-200 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700">
                    <Link href={`/${heroArticle.slug}`}>
                      Okumaya başla
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-6 lg:col-span-4">
                {featuredArticles.map((article, index) => (
                  <Link
                    key={article.slug}
                    href={`/${article.slug}`}
                    className="group flex flex-1 flex-col justify-between rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-900"
                  >
                    <div>
                      <span
                        className={`mb-2 block text-[9px] font-black uppercase tracking-[0.15em] ${
                          index === 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {index === 0 ? "Öne çıkan" : "Yeni seri"}
                      </span>
                      <Badge variant="outline" className={`${article.categoryColor} mb-4 border-none font-bold opacity-80 transition-opacity group-hover:opacity-100`}>
                        {article.category}
                      </Badge>
                      <h2 className="text-xl font-bold leading-snug transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-400">
                        {article.title}
                      </h2>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{article.date}</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600 dark:bg-zinc-800 dark:group-hover:bg-blue-900/30">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </m.section>
          ) : null}
        </main>

        <ConstructionScrollytelling />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-10 lg:flex-row">
            <section className="lg:w-2/3">
              <div className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-4 md:flex-row md:items-center md:justify-between dark:border-zinc-800">
                <h3 className="flex items-center gap-3 text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                  <div className="h-8 w-2 rounded-full bg-blue-600" />
                  Son eklenenler
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={feedMode === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => updateFeedMode("all")}
                    className={feedMode === "all" ? "font-bold" : "font-bold text-zinc-500 hover:text-blue-600"}
                  >
                    Tümü
                  </Button>
                  <Button
                    type="button"
                    variant={feedMode === "popular" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => updateFeedMode("popular")}
                    className={feedMode === "popular" ? "font-bold" : "font-bold text-zinc-500 hover:text-blue-600"}
                  >
                    Popüler
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterOpen((current) => !current)}
                    className="flex gap-2 rounded-xl border-zinc-200 bg-white font-bold text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filtrele</span>
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {isFilterOpen ? (
                  <>
                    <m.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsFilterOpen(false)}
                      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    />
                    <m.div
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: "100%", opacity: 0 }}
                      transition={{ type: "spring", damping: 25, stiffness: 220 }}
                      className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 md:relative md:mb-8 md:rounded-none md:border-none md:bg-transparent md:p-0"
                    >
                      <div className="mb-6 flex items-center justify-between md:hidden">
                        <h4 className="text-lg font-black text-zinc-900 dark:text-white">Filtreler</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsFilterOpen(false)}
                          className="rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex flex-col flex-wrap gap-4 md:flex-row">
                        <select
                          value={categoryFilter}
                          onChange={(event) => updateCategoryFilter(event.target.value)}
                          className="min-w-[160px] flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-600 focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 md:py-2"
                        >
                          <option value="all">Tüm kategoriler</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <select
                          value={contentMode}
                          onChange={(event) => updateContentMode(event.target.value as ContentMode)}
                          className="min-w-[160px] flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-600 focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 md:py-2"
                        >
                          <option value="all">Tüm içerik tipleri</option>
                          <option value="article">Yalnızca makaleler</option>
                          <option value="tool">Yalnızca araç yazıları</option>
                        </select>
                        <select
                          value={readingTimeFilter}
                          onChange={(event) => updateReadingTimeFilter(event.target.value)}
                          className="min-w-[160px] flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-bold text-zinc-600 focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 md:py-2"
                        >
                          <option value="all">Tüm okuma süreleri</option>
                          <option value="short">5 dakikaya kadar</option>
                          <option value="long">5 dakikadan uzun</option>
                        </select>
                      </div>
                    </m.div>
                  </>
                ) : null}
              </AnimatePresence>

              <div className="flex flex-col gap-6">
                {visibleArticles.map((article, index) => (
                  <m.div
                    key={article.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Link
                      href={`/${article.slug}`}
                      className="group block overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="relative aspect-video w-full overflow-hidden md:h-64 md:w-64 md:flex-shrink-0 md:aspect-auto">
                          <Image
                            src={article.image}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 768px) 100vw, 256px"
                          />
                        </div>
                        <div className="flex flex-1 flex-col justify-between p-6 md:p-8">
                          <div>
                            <Badge variant="outline" className={`${article.categoryColor} mb-3 border-none font-bold`}>
                              {article.category}
                            </Badge>
                            <h3 className="mb-3 text-2xl font-extrabold leading-tight transition-colors group-hover:text-blue-700 dark:group-hover:text-blue-400">
                              {article.title}
                            </h3>
                            <p className="mb-4 line-clamp-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                              {article.description}
                            </p>
                          </div>
                          <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {article.author
                                  .split(" ")
                                  .map((name) => name[0])
                                  .join("")}
                              </div>
                              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{article.author}</span>
                            </div>
                            <div className="relative z-10 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-400">
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" /> {article.readTime}
                              </span>
                              <div onClick={(event) => event.preventDefault()}>
                                <BookmarkButton
                                  slug={article.slug}
                                  title={article.title}
                                  className="bg-zinc-100 p-2 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </m.div>
                ))}
              </div>

              {filteredFeed.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
                  <p className="text-lg font-black text-zinc-900 dark:text-white">Filtrelerle eşleşen içerik bulunamadı.</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                    Filtreleri sıfırlayarak tüm içerik akışına dönebilirsiniz.
                  </p>
                </div>
              ) : null}

              {hasMore ? (
                <div className="mt-12 flex justify-center">
                  <Button
                    type="button"
                    onClick={loadMore}
                    variant="outline"
                    className="h-12 gap-2 rounded-full border-2 border-zinc-200 px-10 font-black transition-all hover:border-blue-600 hover:text-blue-600 dark:border-zinc-800"
                  >
                    Daha fazla yükle
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              ) : null}
            </section>

            <aside className="flex flex-col gap-10 lg:w-1/3">
              <m.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-3xl bg-blue-700 p-8 text-white shadow-lg shadow-blue-500/20 dark:bg-blue-600"
              >
                <div className="absolute right-0 top-0 p-4 opacity-10 transition-transform duration-700 group-hover:scale-150">
                  <FileText className="h-32 w-32" />
                </div>
                <h4 className="relative z-10 mb-2 text-2xl font-black">İletişime geçin</h4>
                <p className="relative z-10 mb-6 font-medium text-blue-100">
                  İçerik öneriniz, iş birliği talebiniz veya yeni araç fikriniz varsa doğrudan bize yazın.
                </p>
                <div className="relative z-10 flex flex-col gap-3">
                  <Button asChild className="h-12 w-full bg-white font-black text-blue-700 hover:bg-zinc-100">
                    <a href="mailto:info@insablog.com?subject=İnşa%20Blog%20İletişim">
                      <Mail className="mr-2 h-4 w-4" />
                      E-posta gönder
                    </a>
                  </Button>
                  <Button asChild variant="secondary" className="h-12 w-full rounded-xl bg-blue-800/40 font-bold text-white hover:bg-blue-800/60">
                    <Link href="/iletisim">İletişim sayfasını aç</Link>
                  </Button>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h4 className="mb-6 flex items-center gap-3 text-xl font-black">
                  <div className="h-6 w-1.5 rounded-full bg-blue-600" />
                  Pratik araçlar
                </h4>
                <div className="flex flex-col gap-4">
                  {liveTools.map((tool) => (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      className="group flex gap-4 rounded-2xl border border-transparent p-4 transition-all hover:border-zinc-100 hover:bg-zinc-50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/20">
                        <ToolIcon iconKey={tool.iconKey} className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-zinc-900 transition-colors group-hover:text-blue-600 dark:text-zinc-100">
                          {tool.name}
                        </h5>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{tool.description}</p>
                        <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                          {tool.discipline}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Button asChild variant="ghost" className="mt-6 w-full font-black text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                  <Link href={TOOLS_HUB_HREF}>Tüm hesap araçları</Link>
                </Button>
              </m.div>
            </aside>
          </div>
        </div>
      </div>
    </LazyMotion>
  );
}
