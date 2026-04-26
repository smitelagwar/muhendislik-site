"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Filter, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEPREM_SERIES, type DepremArticleSummary, type DepremSeriesId } from "@/lib/deprem-series";
import { cn } from "@/lib/utils";
import { normalizeSearchValue } from "@/lib/search-utils";

interface DepremYonetmelikHubProps {
  articles: DepremArticleSummary[];
}

function getSearchParams(urlSearchParams: ReturnType<typeof useSearchParams>) {
  const dal = urlSearchParams.get("dal") ?? "all";
  const q = urlSearchParams.get("q") ?? "";
  return {
    dal: DEPREM_SERIES.some((series) => series.id === dal) ? (dal as DepremSeriesId) : "all",
    q,
  };
}

export default function DepremYonetmelikHub({ articles }: DepremYonetmelikHubProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dal, q } = getSearchParams(searchParams);

  const counts = DEPREM_SERIES.reduce<Record<DepremSeriesId, number>>((acc, series) => {
    acc[series.id] = articles.filter((article) => article.seriesId === series.id).length;
    return acc;
  }, {} as Record<DepremSeriesId, number>);

  const normalizedQuery = normalizeSearchValue(q);
  const filteredArticles = articles.filter((article) => {
    const dalMatch = dal === "all" || article.seriesId === dal;
    const queryMatch = normalizedQuery.length === 0 || article.searchText.includes(normalizedQuery);
    return dalMatch && queryMatch;
  });

  const activeSeries = dal === "all" ? null : DEPREM_SERIES.find((series) => series.id === dal) ?? null;

  function updateSearch(next: { dal?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    if (typeof next.dal === "string") {
      if (next.dal === "all") {
        params.delete("dal");
      } else {
        params.set("dal", next.dal);
      }
    }

    if (typeof next.q === "string") {
      if (next.q.trim().length === 0) {
        params.delete("q");
      } else {
        params.set("q", next.q);
      }
    }

    const queryString = params.toString();
    router.replace(queryString.length > 0 ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }

  return (
    <section className="border-t border-border bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="border-none bg-red-600/15 text-red-300">Makaleler</Badge>
              <Badge variant="outline" className="border-border text-foreground/80">
                {articles.length} içerik
              </Badge>
              <Badge variant="outline" className="border-border text-foreground/80">
                {DEPREM_SERIES.length} alt dal
              </Badge>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-foreground md:text-3xl">
              Deprem ve Yönetmelikler Merkezi
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
              TS 500, TBDY, Yangın, İmar, Otopark, BEP-TR / TS 825, Su-Zemin, Engelsiz, Eurocode, Akustik, Asansör, İSG ve Çevre başlıklarını aynı merkezde filtreleyin.
            </p>
          </div>

          {activeSeries ? (
            <div className="rounded-3xl border border-border bg-card/80 p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Seçili alt dal</p>
              <p className="mt-1 text-lg font-black text-foreground">{activeSeries.label}</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{activeSeries.description}</p>
              <Button asChild className="mt-4 h-10 rounded-full bg-white px-5 text-sm font-black text-foreground hover:bg-foreground/10">
                <Link href={activeSeries.relatedToolHref}>
                  İlgili aracı aç
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-3xl border border-border bg-card/80 p-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">Genel görünüm</p>
              <p className="mt-1 text-lg font-black text-foreground">Tüm alt dallar</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Arama ile başlık, kategori ve teknik etiketleri süzebilir; seri sekmeleriyle sadece ihtiyaç duyduğunuz yönetmeliğe odaklanabilirsiniz.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-border bg-card/60 p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(event) => updateSearch({ q: event.target.value })}
                placeholder="Başlık, kategori, etiket veya teknik terim ara"
                className="h-12 border-border bg-background/70 pl-11 text-foreground placeholder:text-muted-foreground focus-visible:border-red-500/60 focus-visible:ring-red-500/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Button
                type="button"
                variant={dal === "all" ? "default" : "outline"}
                className={cn(
                  "h-12 rounded-full px-4 font-black",
                  dal === "all"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "border-border bg-background text-foreground/90 hover:bg-card"
                )}
                onClick={() => updateSearch({ dal: "all" })}
              >
                Tümü
              </Button>
              {(dal !== "all" || q.trim().length > 0) && (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-12 rounded-full px-4 font-black text-foreground/80 hover:bg-muted hover:text-foreground"
                  onClick={() => updateSearch({ dal: "all", q: "" })}
                >
                  Temizle
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {DEPREM_SERIES.map((series) => {
              const active = dal === series.id;
              const count = counts[series.id] ?? 0;

              return (
                <Button
                  key={series.id}
                  type="button"
                  variant="outline"
                  aria-pressed={active}
                  onClick={() => updateSearch({ dal: series.id })}
                  className={cn(
                    "h-11 shrink-0 rounded-full border px-4 text-sm font-black transition-all",
                    active
                      ? "border-transparent bg-white text-foreground shadow-md"
                      : "border-border bg-background text-foreground/80 hover:border-border hover:bg-card hover:text-foreground"
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full", SERIES_DOT_CLASS[series.id])} />
                  {series.label}
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black text-foreground/80">{count}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredArticles.map((article) => (
            <DepremArticleCard key={article.slug} article={article} />
          ))}
        </div>

        {filteredArticles.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-border bg-background/60 px-6 py-14 text-center">
            <p className="text-lg font-black text-foreground">Eşleşen içerik bulunamadı</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Farklı bir alt dal seçin ya da arama terimini daraltın.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

const SERIES_DOT_CLASS: Record<DepremSeriesId, string> = {
  tbdy: "bg-red-500",
  ts500: "bg-blue-500",
  yangin: "bg-amber-500",
  otopark: "bg-slate-500",
  imar: "bg-emerald-500",
  bep: "bg-lime-500",
  "su-zemin": "bg-cyan-500",
  engelsiz: "bg-violet-500",
  eurocode: "bg-indigo-500",
  akustik: "bg-zinc-400",
  asansor: "bg-amber-600",
  isg: "bg-yellow-500",
  cevre: "bg-green-500",
};

function DepremArticleCard({ article }: { article: DepremArticleSummary }) {
  return (
    <Link href={`/${article.slug}`} prefetch={false} className="group block h-full">
      <Card className="h-full overflow-hidden border-border bg-card/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-xl">
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge className="border-none bg-white/90 text-[10px] font-black uppercase text-foreground">
              {article.seriesLabel}
            </Badge>
            <Badge className={`${article.categoryColor} border-none text-[10px] font-black uppercase`}>
              {article.category}
            </Badge>
          </div>
        </div>
        <CardHeader className="gap-3 px-5 pb-0 pt-5">
          <CardTitle className="text-xl font-black leading-snug text-foreground transition-colors group-hover:text-red-300">
            {article.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {article.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 px-5 pb-5 pt-4">
          <div className="flex flex-wrap gap-2">
            {article.badgeLabel ? (
              <Badge variant="outline" className="border-border text-foreground/80">
                {article.badgeLabel}
              </Badge>
            ) : null}
            {article.keywords.slice(0, 2).map((keyword) => (
              <Badge key={keyword} variant="outline" className="border-border text-muted-foreground">
                {keyword}
              </Badge>
            ))}
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs font-bold text-muted-foreground">
            <span>{article.author}</span>
            <span>{article.readTime}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
