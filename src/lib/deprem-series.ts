import type { ArticleData } from "./articles-data";
import type { DepremSeriesId, RegulationStatusItem } from "./deprem-content-types";
import { normalizeSearchValue } from "./search-utils";

export type { DepremSeriesId } from "./deprem-content-types";

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
    label: "TBDY 2018: Analiz",
    categoryLabels: ["Deprem Yönetmeliği", "Yönetmelik Güncellemesi", "TBDY 2018 Rehberi"],
    description: "Deprem verisi, analiz yöntemleri, modelleme ve genel tasarım kararları.",
    keywords: ["tbdy", "deprem", "spektrum", "düzensizlik", "analiz", "dts", "bys"],
    priority: 10,
    accentClass: "text-red-600 dark:text-red-400",
    relatedToolHref: "/kategori/araclar/taban-kesme-kuvveti",
    slugPrefixes: ["tbdy-"],
  },
  {
    id: "tbdy-betonarme",
    label: "TBDY Betonarme Detayları",
    categoryLabels: ["TBDY Betonarme Detayları"],
    description: "Kiriş, kolon, perde, birleşim ve diyaframların deprem detayları.",
    keywords: ["kolon", "kiriş", "perde", "etriye", "birleşim", "diyafram"],
    priority: 20,
    accentClass: "text-orange-600 dark:text-orange-400",
    relatedToolHref: "/kategori/araclar/donati-hesabi",
    slugPrefixes: ["tbdy-betonarme-"],
  },
  {
    id: "ts500",
    label: "TS 500 Betonarme",
    categoryLabels: ["TS 500 Betonarme", "TS 500 Rehberi"],
    description: "Taşıma gücü, kullanılabilirlik, donatı ve temel tasarımı kontrolleri.",
    keywords: ["ts 500", "betonarme", "donatı", "kolon", "kiriş", "döşeme", "temel"],
    priority: 30,
    accentClass: "text-blue-600 dark:text-blue-400",
    relatedToolHref: "/kategori/araclar/donati-hesabi",
    slugPrefixes: ["ts500-"],
  },
  {
    id: "mevcut-guclendirme",
    label: "Mevcut Bina ve Güçlendirme",
    categoryLabels: ["Mevcut Binalar ve Güçlendirme"],
    description: "TBDY Bölüm 15, riskli yapı tespiti, performans ve güçlendirme kararları.",
    keywords: ["mevcut bina", "güçlendirme", "karot", "performans", "riskli yapı"],
    priority: 40,
    accentClass: "text-fuchsia-600 dark:text-fuchsia-400",
    relatedToolHref: "",
    slugPrefixes: ["mevcut-bina-", "guclendirme-", "riskli-yapi-"],
  },
  {
    id: "yapi-denetimi",
    label: "Yapı Denetimi ve Malzeme",
    categoryLabels: ["Yapı Denetimi ve Malzeme"],
    description: "Statik proje, donatı, beton, numune ve saha kabul süreçleri.",
    keywords: ["4708", "yapı denetimi", "beton", "ebis", "karot", "ts 708"],
    priority: 50,
    accentClass: "text-amber-700 dark:text-amber-400",
    relatedToolHref: "",
    slugPrefixes: ["yapi-denetimi-"],
  },
  {
    id: "yangin",
    label: "Yangın Yönetmeliği",
    categoryLabels: ["Yangın Yönetmeliği", "BYY 2015 + 2019"],
    description: "Kaçış, duman kontrolü, sprinkler ve taşıyıcı sistem yangın dayanımı.",
    keywords: ["yangın", "byy", "kaçış", "sprinkler", "duman", "r60", "r120"],
    priority: 60,
    accentClass: "text-orange-600 dark:text-orange-400",
    relatedToolHref: "",
    slugPrefixes: ["byy-", "yangin-", "sprinkler-", "duman-", "kacis-", "yuksek-binalarda-", "bodrum-otopark-mutfak-", "tasiyici-sistemlerin-yangina-"],
  },
  {
    id: "otopark",
    label: "Otopark Yönetmeliği",
    categoryLabels: ["Otopark Yönetmeliği"],
    description: "Alan, rampa, havalandırma, taşıyıcı yükler ve elektrikli araç hükümleri.",
    keywords: ["otopark", "rampa", "havalandırma", "araç", "şarj"],
    priority: 70,
    accentClass: "text-slate-600 dark:text-slate-300",
    relatedToolHref: "",
    slugPrefixes: ["otopark-"],
  },
  {
    id: "imar",
    label: "İmar Mevzuatı",
    categoryLabels: ["İmar Mevzuatı"],
    description: "TAKS, KAKS, yapı yüksekliği, çekme mesafeleri ve ruhsat süreçleri.",
    keywords: ["imar", "taks", "kaks", "emsal", "ruhsat", "ifraz", "tevhid"],
    priority: 80,
    accentClass: "text-emerald-600 dark:text-emerald-400",
    relatedToolHref: "/kategori/araclar/imar-hesaplayici",
    slugPrefixes: ["imar-"],
  },
  {
    id: "bep",
    label: "BEP-TR / TS 825",
    categoryLabels: ["Binalarda Enerji Performansı", "BEP-TR / TS 825"],
    description: "Isı kaybı, U değeri, EKB ve ısıl köprü kontrolleri.",
    keywords: ["bep", "ts 825", "ekb", "ısı yalıtımı", "u değeri"],
    priority: 90,
    accentClass: "text-lime-600 dark:text-lime-400",
    relatedToolHref: "/kategori/araclar/dis-cephe-yalitim-kalinligi",
    slugPrefixes: ["bep-"],
  },
  {
    id: "su-zemin",
    label: "Zemin, Temel ve Su",
    categoryLabels: ["Su ve Zemin Mevzuatı", "Zemin, Temel ve Su"],
    description: "Zemin etüdü, temel kontrolleri, sıvılaşma, su yalıtımı ve drenaj.",
    keywords: ["zemin", "temel", "sıvılaşma", "etüt", "drenaj", "yalıtım"],
    priority: 100,
    accentClass: "text-cyan-600 dark:text-cyan-400",
    relatedToolHref: "/kategori/araclar/zemin-sinifi",
    slugPrefixes: ["zemin-", "temel-", "su-yalitimi-", "yagmur-suyu-", "tbdy-bolum-16-"],
  },
  {
    id: "engelsiz",
    label: "Engelsiz Tasarım",
    categoryLabels: ["Engelsiz Tasarım"],
    description: "TS 9111 kapsamında rampa, dolaşım, WC ve asansör boyutları.",
    keywords: ["engelsiz", "ts 9111", "erişilebilirlik", "rampa", "koridor"],
    priority: 110,
    accentClass: "text-violet-600 dark:text-violet-400",
    relatedToolHref: "",
    slugPrefixes: ["engelsiz-"],
  },
  {
    id: "eurocode",
    label: "Eurocode Standartları",
    categoryLabels: ["Eurocode Standartları"],
    description: "TS EN 1990, 1991 ve 1992 için yük ve betonarme tasarım başlıkları.",
    keywords: ["eurocode", "ts en 1990", "ts en 1991", "ts en 1992"],
    priority: 120,
    accentClass: "text-indigo-600 dark:text-indigo-400",
    relatedToolHref: "",
    slugPrefixes: ["eurocode-"],
  },
  {
    id: "akustik",
    label: "Akustik ve Gürültü",
    categoryLabels: ["Akustik ve Gürültü"],
    description: "Bina akustiği, ses geçişi ve yalıtım performansı.",
    keywords: ["akustik", "gürültü", "yalıtım", "ts en iso 12354"],
    priority: 130,
    accentClass: "text-zinc-600 dark:text-zinc-300",
    relatedToolHref: "",
    slugPrefixes: ["akustik-"],
  },
  {
    id: "asansor",
    label: "Asansör Yönetmeliği",
    categoryLabels: ["Asansör Yönetmeliği"],
    description: "Kuyu boyutları, sistem seçimi, güvenlik ve deprem davranışı.",
    keywords: ["asansör", "kuyu", "bakım", "deprem", "güvenlik"],
    priority: 140,
    accentClass: "text-teal-700 dark:text-teal-300",
    relatedToolHref: "",
    slugPrefixes: ["asansor-"],
  },
  {
    id: "isg",
    label: "İSG ve Şantiye Güvenliği",
    categoryLabels: ["İSG ve Şantiye Güvenliği"],
    description: "Şantiye planı, yüksekte çalışma, kazı ve elektrik güvenliği.",
    keywords: ["isg", "şantiye", "iskele", "kazı", "elektrik"],
    priority: 150,
    accentClass: "text-amber-600 dark:text-amber-400",
    relatedToolHref: "",
    slugPrefixes: ["isg-"],
  },
  {
    id: "cevre",
    label: "Çevre Mevzuatı",
    categoryLabels: ["Çevre Mevzuatı"],
    description: "ÇED, atık, gürültü, toz ve şantiye suyu yükümlülükleri.",
    keywords: ["çevre", "çed", "atık", "gürültü", "toz"],
    priority: 160,
    accentClass: "text-green-600 dark:text-green-400",
    relatedToolHref: "",
    slugPrefixes: ["cevre-"],
  },
] as const;

export const REGULATION_STATUS_ITEMS: readonly RegulationStatusItem[] = [
  {
    id: "tbdy-2018",
    title: "Türkiye Bina Deprem Yönetmeliği 2018",
    status: "in-force",
    statusLabel: "Yürürlükte",
    verifiedAt: "11 Ağustos 2026",
    href: "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi",
    note: "18 Mart 2018 tarihli metin; 1 Ocak 2019'dan beri yürürlükte.",
  },
  {
    id: "zemin-temel-2019",
    title: "Zemin ve Temel Etüdü Uygulama Esasları",
    status: "in-force",
    statusLabel: "Yürürlükte",
    verifiedAt: "11 Ağustos 2026",
    href: "https://bartin.csb.gov.tr/zemin-ve-temel-etudu-uygulama-esaslari-ve-rapor-formatina-dair-teblig-yayimlandi-haber-238675",
    note: "9 Mart 2019 tarihli Resmî Gazete tebliği.",
  },
  {
    id: "yapi-denetimi",
    title: "4708 sayılı Yapı Denetimi Mevzuatı",
    status: "in-force",
    statusLabel: "Yürürlükte",
    verifiedAt: "11 Ağustos 2026",
    href: "https://yapiisleri.csb.gov.tr/yapi-denetimi-daire-baskanligi-mevzuati-90235",
    note: "Kanun, uygulama yönetmeliği ve beton numunesi düzenlemeleri birlikte izlenir.",
  },
  {
    id: "tbdy-uygulama-taslagi",
    title: "TBDY Uygulama Esasları Tebliğ Taslağı",
    status: "draft",
    statusLabel: "Taslak",
    verifiedAt: "11 Ağustos 2026",
    href: "https://obs.imo.org.tr/bulten/news/3812/sosyal-mecralarda-yer-alan-yeni-tbdy-tebligi-hakkinda-duyuru/144309",
    note: "Resmî Gazete'de yayımlanmış yürürlükte bir mevzuat olarak kullanılmaz.",
  },
] as const;

const SERIES_BY_ID = new Map(DEPREM_SERIES.map((series) => [series.id, series] as const));

function normalizeValues(values: Array<string | undefined>): string {
  return normalizeSearchValue(values.filter((value): value is string => Boolean(value?.trim())).join(" "));
}

export function getDepremSeriesById(seriesId: DepremSeriesId): DepremSeriesDefinition {
  return SERIES_BY_ID.get(seriesId) ?? DEPREM_SERIES[0];
}

export function getDepremSeriesForArticle(
  article: Pick<ArticleData, "slug" | "title" | "description" | "category" | "badgeLabel" | "keywords" | "sectionId" | "seriesId">,
): DepremSeriesDefinition {
  if (article.seriesId && SERIES_BY_ID.has(article.seriesId)) {
    return getDepremSeriesById(article.seriesId);
  }

  const normalizedCategory = normalizeSearchValue(article.category);
  const slugSeries = DEPREM_SERIES.find((series) =>
    series.slugPrefixes.some((prefix) => article.slug.startsWith(prefix)),
  );
  if (slugSeries) return slugSeries;

  const categorySeries = DEPREM_SERIES.find((series) =>
    series.categoryLabels.some((label) => normalizeSearchValue(label) === normalizedCategory),
  );
  return categorySeries ?? DEPREM_SERIES[0];
}

export function getDepremSeriesIdForArticle(
  article: Pick<ArticleData, "slug" | "title" | "description" | "category" | "badgeLabel" | "keywords" | "sectionId" | "seriesId">,
): DepremSeriesId {
  return getDepremSeriesForArticle(article).id;
}

export function createDepremArticleSummary(article: ArticleData): DepremArticleSummary | null {
  if (article.sectionId !== "deprem-yonetmelik") return null;

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
  return articles.map(createDepremArticleSummary).filter((article): article is DepremArticleSummary => Boolean(article));
}

export function sortDepremArticleSummaries(
  articles: DepremArticleSummary[],
  sourceIndex = new Map<string, number>(),
): DepremArticleSummary[] {
  return [...articles].sort((left, right) => {
    const priorityDifference = getDepremSeriesById(left.seriesId).priority - getDepremSeriesById(right.seriesId).priority;
    if (priorityDifference !== 0) return priorityDifference;
    return (sourceIndex.get(left.slug) ?? Number.MAX_SAFE_INTEGER) - (sourceIndex.get(right.slug) ?? Number.MAX_SAFE_INTEGER);
  });
}

export function filterDepremArticleSummaries(
  articles: DepremArticleSummary[],
  options: { seriesId: DepremSeriesId | "all"; query: string },
): DepremArticleSummary[] {
  const normalizedQuery = normalizeSearchValue(options.query);
  return articles.filter((article) => {
    const seriesMatch = options.seriesId === "all" || article.seriesId === options.seriesId;
    const searchMatch = normalizedQuery.length === 0 || article.searchText.includes(normalizedQuery);
    return seriesMatch && searchMatch;
  });
}
