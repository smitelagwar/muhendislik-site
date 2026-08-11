"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, CheckCircle2, FileClock, Search, X } from "lucide-react";
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
  return {
    dal: DEPREM_SERIES.some((series) => series.id === requestedSeries)
      ? (requestedSeries as DepremSeriesId)
      : "all",
    q: urlSearchParams.get("q") ?? "",
  };
}

export default function DepremYonetmelikHub({ articles }: DepremYonetmelikHubProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dal, q } = getSearchState(searchParams);

  const counts = articles.reduce<Partial<Record<DepremSeriesId, number>>>((result, article) => {
    result[article.seriesId] = (result[article.seriesId] ?? 0) + 1;
    return result;
  }, {});
  const normalizedQuery = normalizeSearchValue(q);
  const filteredArticles = articles.filter((article) => {
    const seriesMatches = dal === "all" || article.seriesId === dal;
    const queryMatches = normalizedQuery.length === 0 || article.searchText.includes(normalizedQuery);
    return seriesMatches && queryMatches;
  });
  const activeSeries = dal === "all" ? null : DEPREM_SERIES.find((series) => series.id === dal) ?? null;

  function updateSearch(next: { dal?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (typeof next.dal === "string") {
      if (next.dal === "all") params.delete("dal");
      else params.set("dal", next.dal);
    }
    if (typeof next.q === "string") {
      if (next.q.trim()) params.set("q", next.q);
      else params.delete("q");
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}#icerikler` : `${pathname}#icerikler`, { scroll: false });
  }

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

        <div className="rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)]">
          <div className="flex flex-col gap-2 border-b border-[var(--home-border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-black text-[var(--home-fg)]">Mevzuat güncelliği</h3>
              <p className="mt-1 text-xs text-[var(--home-muted)]">Ana belgelerin resmî durumu ve doğrulama bağlantıları</p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--home-muted)]">Son kontrol: 11.08.2026</span>
          </div>
          <div className="divide-y divide-[var(--home-border)] lg:grid lg:grid-cols-2 lg:divide-y-0">
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
        </div>

        <div className="rounded-xl border border-[var(--home-border)] bg-[var(--home-surface-raised)] p-4 md:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--home-muted)]" />
              <Input
                value={q}
                onChange={(event) => updateSearch({ q: event.target.value })}
                placeholder="Başlık, mevzuat veya teknik terim ara"
                aria-label="Mevzuat içeriklerinde ara"
                className="h-12 border-[var(--home-border)] bg-[var(--home-surface)] pl-11 text-[var(--home-fg)] placeholder:text-[var(--home-muted)] focus-visible:border-amber-500/60 focus-visible:ring-amber-500/20"
              />
            </div>

            <Select value={dal} onValueChange={(value) => updateSearch({ dal: value })}>
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

            {(dal !== "all" || q.trim()) ? (
              <Button
                type="button"
                variant="outline"
                className="h-12 border-[var(--home-border)] bg-[var(--home-surface)] px-4 font-black text-[var(--home-fg)]"
                onClick={() => updateSearch({ dal: "all", q: "" })}
              >
                Temizle <X className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-1 border-t border-[var(--home-border)] pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="font-bold text-[var(--home-fg)]">
              {activeSeries?.label ?? "Tüm mevzuatlar"}
              <span className="ml-2 font-normal text-[var(--home-muted)]">· {filteredArticles.length} sonuç</span>
            </p>
            {activeSeries ? <p className="text-xs text-[var(--home-muted)]">{activeSeries.description}</p> : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredArticles.map((article) => (
            <DepremArticleCard key={article.slug} article={article} />
          ))}
        </div>

        {filteredArticles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--home-border)] bg-[var(--home-surface)] px-6 py-14 text-center">
            <p className="text-lg font-black text-[var(--home-fg)]">Eşleşen içerik bulunamadı</p>
            <Button type="button" variant="link" className="mt-2" onClick={() => updateSearch({ dal: "all", q: "" })}>Filtreleri temizle</Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DepremArticleCard({ article }: { article: DepremArticleSummary }) {
  return (
    <Link
      href={`/${article.slug}`}
      prefetch={false}
      className="group flex min-h-52 flex-col rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-5 transition-colors hover:border-amber-500/55 hover:bg-[var(--home-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--home-accent)]"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border-none bg-[var(--home-fg)] text-[10px] font-black uppercase text-[var(--home-bg)]">{article.seriesLabel}</Badge>
        {article.badgeLabel ? <Badge variant="outline" className="border-[var(--home-border)] text-[10px] text-[var(--home-muted)]">{article.badgeLabel}</Badge> : null}
      </div>
      <h3 className="mt-4 text-lg font-black leading-snug text-[var(--home-fg)] transition-colors group-hover:text-[var(--home-accent)]">{article.title}</h3>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--home-muted)]">{article.description}</p>
      <div className="mt-auto flex items-center justify-between border-t border-[var(--home-border)] pt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--home-muted)]">
        <span>{article.readTime}</span>
        <span className="inline-flex items-center gap-1 font-black text-[var(--home-fg)]">İçeriği aç <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></span>
      </div>
    </Link>
  );
}
