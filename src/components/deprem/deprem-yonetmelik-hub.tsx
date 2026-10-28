"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CheckCircle2, FileClock, Search, X } from "lucide-react";
import TBDYGuide from "./TBDYGuide";
import { TBDY_TOPICS, getTBDYArticleMeta, isTBDYChapter } from "@/lib/tbdy-guide";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DEPREM_SERIES,
  REGULATION_STATUS_ITEMS,
  type DepremArticleSummary,
  type DepremSeriesId,
} from "@/lib/deprem-series";
import { normalizeSearchValue } from "@/lib/search-utils";

interface DepremYonetmelikHubProps {
  articles: DepremArticleSummary[];
}

function getSearchState(urlSearchParams: ReturnType<typeof useSearchParams>) {
  const requestedSeries = urlSearchParams.get("dal") ?? "all";
  const requestedTopic = urlSearchParams.get("konu") ?? "all";
  const chapterParam = urlSearchParams.get("bolum");
  const requestedChapter = chapterParam ? Number(chapterParam) : null;
  return {
    dal: DEPREM_SERIES.some((series) => series.id === requestedSeries)
      ? (requestedSeries as DepremSeriesId)
      : "all",
    q: urlSearchParams.get("q") ?? "",
    konu: TBDY_TOPICS.some((topic) => topic.id === requestedTopic) ? requestedTopic : "all",
    bolum: requestedChapter !== null && isTBDYChapter(requestedChapter) ? requestedChapter : null,
  };
}

export default function DepremYonetmelikHub({ articles }: DepremYonetmelikHubProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dal, q, konu, bolum } = getSearchState(searchParams);
  const [searchInput, setSearchInput] = useState({ urlValue: q, value: q });
  const searchDraft = searchInput.urlValue === q ? searchInput.value : q;
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);

  const counts = articles.reduce<Partial<Record<DepremSeriesId, number>>>((result, article) => {
    result[article.seriesId] = (result[article.seriesId] ?? 0) + 1;
    return result;
  }, {});
  const normalizedQuery = normalizeSearchValue(q);
  const filteredArticles = articles.filter((article) => {
    const seriesMatches = dal === "all" || article.seriesId === dal;
    const queryMatches = normalizedQuery.length === 0 || article.searchText.includes(normalizedQuery);
    const meta = getTBDYArticleMeta(article.slug);
    const topicMatches = konu === "all" || meta?.topic === konu;
    const chapterMatches = bolum === null || Boolean(meta?.chapters.includes(bolum));
    return seriesMatches && queryMatches && topicMatches && chapterMatches;
  });
  const activeSeries = dal === "all" ? null : DEPREM_SERIES.find((series) => series.id === dal) ?? null;

  function updateSearch(next: { dal?: string; q?: string; konu?: string; bolum?: number | null }) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = null;
    const params = new URLSearchParams(searchParams.toString());
    if (typeof next.dal === "string") {
      if (next.dal === "all") params.delete("dal");
      else params.set("dal", next.dal);
    }
    if (typeof next.q === "string") {
      if (next.q.trim()) params.set("q", next.q);
      else params.delete("q");
    }
    if (typeof next.konu === "string") {
      if (next.konu === "all") params.delete("konu");
      else params.set("konu", next.konu);
    }
    if (next.bolum !== undefined) {
      if (next.bolum === null) params.delete("bolum");
      else params.set("bolum", String(next.bolum));
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}#icerikler` : `${pathname}#icerikler`, { scroll: false });
  }

  function onSearchInput(nextValue: string) {
    setSearchInput({ urlValue: q, value: nextValue });
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateSearch({ q: nextValue }), 260);
  }

  const anyFilter = dal !== "all" || q.trim().length > 0 || konu !== "all" || bolum !== null;
  const showTBDYGuide = ["all", "tbdy", "tbdy-betonarme", "mevcut-guclendirme", "su-zemin"].includes(dal);
  return (
    <section id="icerikler" aria-labelledby="articles-title" className="scroll-mt-24 border-b border-[var(--home-border)] px-5 py-14 sm:px-8 lg:px-12 lg:py-20 xl:px-16">
      <div className="mx-auto max-w-[1440px] space-y-8">
        <div className="border-b border-[var(--home-border)] pb-6">
          <h2 id="articles-title" className="text-2xl font-black tracking-[-0.025em] text-[var(--home-fg)] sm:text-3xl">
            Mevzuat içerikleri
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--home-muted)]">
            {articles.length} tıklanabilir içerik · {DEPREM_SERIES.length} mevzuat başlığı
          </p>
        </div>

        <div className="rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-raised)] p-4 md:p-5">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(220px,320px)]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--home-muted)]" />
              <Input
                value={searchDraft}
                onChange={(event) => onSearchInput(event.target.value)}
                placeholder="Madde, A1, B2, DTS, başlık veya terim ara"
                aria-label="Mevzuat içeriklerinde ara"
                className="h-12 border-[var(--home-border)] bg-[var(--home-surface)] pl-11 text-[var(--home-fg)] placeholder:text-[var(--home-muted)] focus-visible:border-amber-500/60 focus-visible:ring-amber-500/20"
              />
            </div>

            <Select value={dal} onValueChange={(value) => updateSearch({ dal: value, konu: "all", bolum: null })}>
              <SelectTrigger aria-label="Mevzuat seç" className="h-12 w-full border-[var(--home-border)] bg-[var(--home-surface)] px-4 font-bold text-[var(--home-fg)]">
                <SelectValue placeholder="Mevzuat seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm mevzuatlar ({articles.length})</SelectItem>
                {DEPREM_SERIES.map((series) => (
                  <SelectItem key={series.id} value={series.id}>
                    {series.label} ({counts[series.id] ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--home-border)] pt-3 text-sm">
            <p className="font-bold text-[var(--home-fg)]">
              {bolum ? "TBDY · Bölüm " + bolum : konu !== "all" ? "TBDY 2018 · seçilen konu" : activeSeries?.label ?? "Tüm mevzuatlar"}
              <span className="ml-2 font-normal text-[var(--home-muted)]">· {filteredArticles.length} sonuç</span>
            </p>
            {anyFilter ? <Button type="button" variant="ghost" size="sm" className="h-9 shrink-0 px-2 text-xs font-bold" onClick={() => updateSearch({ dal: "all", q: "", konu: "all", bolum: null })}>Temizle <X className="ml-1 h-3.5 w-3.5" aria-hidden /></Button> : null}
          </div>
        </div>

        {showTBDYGuide ? (
          <TBDYGuide articles={articles} activeTopic={konu} activeChapter={bolum}
            onTopicChange={(topic) => updateSearch({ dal: "all", q: "", konu: topic, bolum: null })}
            onChapterChange={(chapter) => updateSearch({ dal: "all", q: "", konu: "all", bolum: chapter })} />
        ) : null}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredArticles.map((article) => (
            <DepremArticleCard key={article.slug} article={article} />
          ))}
        </div>

        {filteredArticles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--home-border)] bg-[var(--home-surface)] px-6 py-14 text-center">
            <p className="text-lg font-black text-[var(--home-fg)]">Eşleşen içerik bulunamadı</p>
            <Button type="button" variant="link" className="mt-2" onClick={() => updateSearch({ dal: "all", q: "", konu: "all", bolum: null })}>Filtreleri temizle</Button>
          </div>
        ) : null}

        <details className="rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)]">
          <summary className="block cursor-pointer px-4 py-3 sm:px-5">
            <span className="block">
              <span className="block text-sm font-black text-[var(--home-fg)]">Mevzuat güncelliği</span>
              <span className="mt-1 block text-xs text-[var(--home-muted)]">Ana belgelerin resmî durumu ve doğrulama bağlantıları</span>
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--home-muted)] sm:inline">Kaynakların kontrol tarihleri farklı</span>
          </summary>
          <div className="divide-y divide-[var(--home-border)] border-t border-[var(--home-border)] lg:grid lg:grid-cols-2 lg:divide-y-0">
            {REGULATION_STATUS_ITEMS.map((item, index) => (
              <Link
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={`group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-[var(--home-surface-raised)] ${index % 2 === 1 ? "lg:border-l lg:border-[var(--home-border)]" : ""} ${index > 1 ? "lg:border-t lg:border-[var(--home-border)]" : ""}`}
              >
                {item.status === "draft" ? (
                  <FileClock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                )}
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-[var(--home-fg)]">{item.title}</span>
                    <Badge variant="outline" className={item.status === "draft" ? "border-amber-500/40 text-amber-700 dark:text-amber-300" : "border-emerald-500/35 text-emerald-700 dark:text-emerald-300"}>
                      {item.statusLabel}
                    </Badge>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--home-muted)]">{item.note}</span>
                </span>
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--home-muted)] transition-colors group-hover:text-[var(--home-accent)]" aria-hidden />
              </Link>
            ))}
          </div>
        </details>

      </div>
    </section>
  );
}

function DepremArticleCard({ article }: { article: DepremArticleSummary }) {
  return (
    <Link
      href={`/${article.slug}`}
      prefetch={false}
      className="group flex min-h-40 flex-col rounded-lg border border-[var(--home-border)] bg-[var(--home-surface)] p-4 transition-colors hover:border-amber-500/55 hover:bg-[var(--home-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="border-none bg-[var(--home-fg)] text-[10px] font-black uppercase text-[var(--home-bg)] dark:bg-[var(--home-fg)] dark:text-[var(--home-bg)]">{article.seriesLabel}</Badge>
        {getTBDYArticleMeta(article.slug) ? <span className="font-mono text-[10px] text-[var(--home-muted)]">Bölüm {getTBDYArticleMeta(article.slug)?.chapters.join("/")}</span> : null}
      </div>
      <h3 className="mt-3 text-base font-black leading-snug text-[var(--home-fg)] transition-colors group-hover:text-[var(--home-accent)]">{article.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--home-muted)]">{article.description}</p>
      <div className="mt-auto flex items-center justify-between border-t border-[var(--home-border)] pt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--home-muted)]">
        <span>{article.readTime}</span>
        <span className="inline-flex items-center gap-1 font-black text-[var(--home-fg)]">İçeriği aç <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></span>
      </div>
    </Link>
  );
}
