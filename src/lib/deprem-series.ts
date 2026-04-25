import type { ArticleData } from "./articles-data";
import { normalizeSearchValue } from "./search-utils";
import { TOOLS_HUB_HREF } from "./tools-data";

export type DepremSeriesId =
  | "tbdy"
  | "ts500"
  | "yangin"
  | "otopark"
  | "imar"
  | "bep"
  | "su-zemin"
  | "engelsiz"
  | "eurocode"
  | "akustik"
  | "asansor"
  | "isg"
  | "cevre";

export interface DepremSeriesDefinition {
  id: DepremSeriesId;
  label: string;
  categoryLabels: readonly string[];
  description: string;
  keywords: readonly string[];
  priority: number;
  accentClass: string;
  relatedToolHref: string;
  slugPrefixes: readonly string[];
}

export interface DepremArticleSummary {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  badgeLabel: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  keywords: string[];
  sectionId: ArticleData["sectionId"];
  seriesId: DepremSeriesId;
  seriesLabel: string;
  searchText: string;
}

export const DEPREM_SERIES: readonly DepremSeriesDefinition[] = [
  {
    id: "tbdy",
    label: "TBDY 2018 Rehberi",
    categoryLabels: ["Deprem Yönetmeliği", "Yönetmelik Güncellemesi", "TBDY 2018 Rehberi"],
    description: "Deprem yer hareketi düzeyleri, spektrum, düzensizlik ve temel TBDY kararları.",
    keywords: ["tbdy", "deprem", "spektrum", "süneklik", "düzensizlik", "R", "D", "I"],
    priority: 10,
    accentClass: "text-red-600 dark:text-red-400",
    relatedToolHref: "/deprem-yonetmelik/araclar/esit-deprem-yuku",
    slugPrefixes: ["tbdy-"],
  },
  {
    id: "ts500",
    label: "TS 500 Betonarme",
    categoryLabels: ["TS 500 Betonarme", "TS 500 Rehberi"],
    description: "Donatı, kenetlenme, kolon P-M etkileşimi ve eleman bazlı betonarme tasarım kararları.",
    keywords: ["ts500", "betonarme", "donatı", "kolon", "kiriş", "döşeme", "pas payı"],
    priority: 20,
    accentClass: "text-blue-600 dark:text-blue-400",
    relatedToolHref: "/kategori/araclar/donati-hesabi",
    slugPrefixes: ["ts500-"],
  },
  {
    id: "yangin",
    label: "Yangın Yönetmeliği",
    categoryLabels: ["Yangın Yönetmeliği", "BYY 2015 + 2019"],
    description: "Kaçış yolları, duman tahliyesi, sprinkler, yangın dayanımı ve özel önlemler.",
    keywords: ["yangın", "bıy", "kaçış", "sprinkler", "duman", "r30", "r60", "r90", "r120"],
    priority: 30,
    accentClass: "text-amber-600 dark:text-amber-400",
    relatedToolHref: TOOLS_HUB_HREF,
    slugPrefixes: ["byy-"],
  },
  {
    id: "otopark",
    label: "Otopark Yönetmeliği",
    categoryLabels: ["Otopark Yönetmeliği"],
    description: "Alan hesabı, rampa geometri, havalandırma, yük kombinasyonları ve EV şarj mevzuatı.",
    keywords: ["otopark", "rampa", "havalandırma", "co", "elektrikli araç", "şarj"],
    priority: 40,
    accentClass: "text-slate-600 dark:text-slate-300",
    relatedToolHref: TOOLS_HUB_HREF,
    slugPrefixes: ["otopark-"],
  },
  {
    id: "imar",
    label: "İmar Mevzuatı",
    categoryLabels: ["İmar Mevzuatı"],
    description: "TAKS, KAKS, kat yükseklikleri, bahçe mesafeleri ve ruhsat süreçleri.",
    keywords: ["imar", "taks", "kaks", "emsal", "ruhsat", "ifraz", "tevhid"],
    priority: 50,
    accentClass: "text-emerald-600 dark:text-emerald-400",
    relatedToolHref: "/kategori/araclar/imar-hesaplayici",
    slugPrefixes: ["imar-"],
  },
  {
    id: "bep",
    label: "BEP-TR / TS 825",
    categoryLabels: ["Binalarda Enerji Performansı", "BEP-TR / TS 825"],
    description: "Isı kaybı, U değeri, EKB, ısıl köprü ve yazılım akışı.",
    keywords: ["bep", "ts 825", "ekb", "ısı yalıtım", "u değeri", "ısıl köprü"],
    priority: 60,
    accentClass: "text-lime-600 dark:text-lime-400",
    relatedToolHref: "/kategori/araclar/dis-cephe-yalitim-kalinligi",
    slugPrefixes: ["bep-"],
  },
  {
    id: "su-zemin",
    label: "Su ve Zemin Mevzuatı",
    categoryLabels: ["Su ve Zemin Mevzuatı"],
    description: "Zemin etüdü, sıvılaşma, zemin-yapı etkileşimi, su yalıtımı ve drenaj.",
    keywords: ["zemin", "su", "drenaj", "sıvılaşma", "etüd", "yapı etkileşimi", "yalıtım"],
    priority: 70,
    accentClass: "text-cyan-600 dark:text-cyan-400",
    relatedToolHref: "/kategori/geoteknik",
    slugPrefixes: ["zemin-", "su-yalitimi-", "yagmur-suyu-"],
  },
  {
    id: "engelsiz",
    label: "Engelsiz Tasarım",
    categoryLabels: ["Engelsiz Tasarım"],
    description: "TS 9111 ve erişilebilirlik kuralları: rampa, koridor, WC ve asansör boyutları.",
    keywords: ["engelsiz", "ts 9111", "erişilebilirlik", "rampa", "koridor", "asansör"],
    priority: 80,
    accentClass: "text-violet-600 dark:text-violet-400",
    relatedToolHref: TOOLS_HUB_HREF,
    slugPrefixes: ["engelsiz-"],
  },
  {
    id: "eurocode",
    label: "Eurocode Standartları",
    categoryLabels: ["Eurocode Standartları"],
    description: "TS EN 1990 / 1991 / 1992 ile yük kombinasyonları ve karşılaştırmalı analiz.",
    keywords: ["eurocode", "ts en 1990", "ts en 1991", "ts en 1992", "yük", "kar", "rüzgar"],
    priority: 90,
    accentClass: "text-indigo-600 dark:text-indigo-400",
    relatedToolHref: "/kategori/araclar/taban-kesme-kuvveti",
    slugPrefixes: ["eurocode-"],
  },
  {
    id: "akustik",
    label: "Akustik ve Gürültü",
    categoryLabels: ["Akustik ve Gürültü"],
    description: "TS EN ISO 12354 ile yalıtım ve gürültü performansının okunması.",
    keywords: ["akustik", "gürültü", "yalıtım", "ts en iso 12354"],
    priority: 100,
    accentClass: "text-zinc-600 dark:text-zinc-300",
    relatedToolHref: TOOLS_HUB_HREF,
    slugPrefixes: ["akustik-"],
  },
  {
    id: "asansor",
    label: "Asansör Yönetmeliği",
    categoryLabels: ["Asansör Yönetmeliği"],
    description: "Boşluk boyutlandırma, sistem seçimi, güvenlik aksesuarları ve deprem davranışı.",
    keywords: ["asansör", "makine dairesiz", "makine daireli", "bakım", "park", "güvenlik aksesuarı"],
    priority: 110,
    accentClass: "text-amber-700 dark:text-amber-300",
    relatedToolHref: TOOLS_HUB_HREF,
    slugPrefixes: ["asansor-"],
  },
  {
    id: "isg",
    label: "İSG ve Şantiye Güvenliği",
    categoryLabels: ["İSG ve Şantiye Güvenliği"],
    description: "Şantiye güvenlik planı, yüksekte çalışma, kazı güvenliği ve elektrik kontrolü.",
    keywords: ["isg", "şantiye", "yüksekte çalışma", "iskele", "kazı", "topraklama", "elektrik"],
    priority: 120,
    accentClass: "text-yellow-600 dark:text-yellow-400",
    relatedToolHref: TOOLS_HUB_HREF,
    slugPrefixes: ["isg-"],
  },
  {
    id: "cevre",
    label: "Çevre Mevzuatı",
    categoryLabels: ["Çevre Mevzuatı"],
    description: "ÇED, atık yönetimi, gürültü, toz ve şantiye çevresel yükümlülükleri.",
    keywords: ["çevre", "çed", "atık", "gürültü", "toz", "yağmur suyu", "filtrasyon"],
    priority: 130,
    accentClass: "text-green-600 dark:text-green-400",
    relatedToolHref: TOOLS_HUB_HREF,
    slugPrefixes: ["cevre-"],
  },
] as const;

const SERIES_BY_ID = new Map(DEPREM_SERIES.map((series) => [series.id, series] as const));

function normalizeValues(values: Array<string | undefined>): string {
  return normalizeSearchValue(values.filter((value): value is string => Boolean(value && value.trim().length > 0)).join(" "));
}

export function getDepremSeriesById(seriesId: DepremSeriesId): DepremSeriesDefinition {
  return SERIES_BY_ID.get(seriesId) ?? DEPREM_SERIES[0];
}

export function getDepremSeriesForArticle(article: Pick<ArticleData, "slug" | "title" | "description" | "category" | "badgeLabel" | "keywords" | "sectionId">): DepremSeriesDefinition {
  const normalizedCategory = normalizeSearchValue(article.category);
  const normalizedHaystack = normalizeValues([
    article.slug,
    article.title,
    article.description,
    article.category,
    article.badgeLabel,
    ...(article.keywords ?? []),
  ]);

  const slugSeries = DEPREM_SERIES.filter((series) => series.id !== "tbdy").find((series) =>
    series.slugPrefixes.some((prefix) => article.slug.startsWith(prefix)),
  );
  if (slugSeries) {
    return slugSeries;
  }

  const categorySeries = DEPREM_SERIES.filter((series) => series.id !== "tbdy").find((series) =>
    series.categoryLabels.some((label) => normalizeSearchValue(label) === normalizedCategory),
  );
  if (categorySeries) {
    return categorySeries;
  }

  const keywordSeries = DEPREM_SERIES.filter((series) => series.id !== "tbdy").find((series) =>
    series.keywords.some((keyword) => normalizedHaystack.includes(normalizeSearchValue(keyword))),
  );

  if (keywordSeries) {
    return keywordSeries;
  }

  return SERIES_BY_ID.get("tbdy") ?? DEPREM_SERIES[0];
}

export function getDepremSeriesIdForArticle(article: Pick<ArticleData, "slug" | "title" | "description" | "category" | "badgeLabel" | "keywords" | "sectionId">): DepremSeriesId {
  return getDepremSeriesForArticle(article).id;
}

export function createDepremArticleSummary(article: ArticleData): DepremArticleSummary | null {
  if (article.sectionId !== "deprem-yonetmelik") {
    return null;
  }

  const series = getDepremSeriesForArticle(article);
  const searchText = normalizeValues([
    article.slug,
    article.title,
    article.description,
    article.category,
    article.badgeLabel,
    article.author,
    article.authorTitle,
    ...(article.keywords ?? []),
    series.label,
    series.description,
  ]);

  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    category: article.category,
    categoryColor: article.categoryColor,
    badgeLabel: article.badgeLabel,
    author: article.author,
    date: article.date,
    readTime: article.readTime,
    image: article.image,
    keywords: article.keywords ?? [],
    sectionId: article.sectionId,
    seriesId: series.id,
    seriesLabel: series.label,
    searchText,
  };
}

export function buildDepremArticleSummaries(articles: ArticleData[]): DepremArticleSummary[] {
  return articles
    .map((article) => createDepremArticleSummary(article))
    .filter((article): article is DepremArticleSummary => Boolean(article));
}

export function sortDepremArticleSummaries(
  articles: DepremArticleSummary[],
  sourceIndex = new Map<string, number>()
): DepremArticleSummary[] {
  return [...articles].sort((left, right) => {
    const leftSeries = getDepremSeriesById(left.seriesId);
    const rightSeries = getDepremSeriesById(right.seriesId);

    if (leftSeries.priority !== rightSeries.priority) {
      return leftSeries.priority - rightSeries.priority;
    }

    const leftSourceIndex = sourceIndex.get(left.slug) ?? Number.MAX_SAFE_INTEGER;
    const rightSourceIndex = sourceIndex.get(right.slug) ?? Number.MAX_SAFE_INTEGER;
    return leftSourceIndex - rightSourceIndex;
  });
}

export function filterDepremArticleSummaries(
  articles: DepremArticleSummary[],
  options: { seriesId: DepremSeriesId | "all"; query: string }
): DepremArticleSummary[] {
  const normalizedQuery = normalizeSearchValue(options.query);

  return articles.filter((article) => {
    const seriesMatch = options.seriesId === "all" || article.seriesId === options.seriesId;
    const searchMatch = normalizedQuery.length === 0 || article.searchText.includes(normalizedQuery);
    return seriesMatch && searchMatch;
  });
}


