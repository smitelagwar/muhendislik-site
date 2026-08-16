import type { CalculationPageIconKey } from "@/lib/calculation-pages";
import { getCalculationPages } from "@/lib/calculation-pages";
import { getArticleList, type ArticleData } from "@/lib/articles-data";
import { BINA_MINDMAP_DATA } from "@/lib/bina-asamalari";
import {
  calculateQuickQuantity,
  type QuickQuantityInput,
} from "@/lib/calculations/modules/hizli-metraj";
import { parseLocalizedDateToDate } from "@/lib/seo";
import type { ToolIconKey } from "@/lib/tools-data";
import { getLiveTools } from "@/lib/tools-data";

export interface HomeCounts {
  calculations: number;
  tools: number;
  articles: number;
}

export interface HomeArticle {
  title: string;
  slug: string;
  category: string;
  description: string;
  image: string;
  date: string;
  readTime: string;
}

interface HomeResourceBase {
  id: string;
  title: string;
  href: string;
  description: string;
  label: string;
  reference: string;
}

export type HomeResourceLink =
  | (HomeResourceBase & {
      kind: "calculation";
      iconKey: CalculationPageIconKey;
    })
  | (HomeResourceBase & {
      kind: "tool";
      iconKey: ToolIconKey;
    });

export interface HomeFeaturedMetric {
  label: string;
  value: string;
}

export interface HomeFeaturedCalculation {
  id: string;
  title: string;
  href: string;
  description: string;
  scenario: string;
  metrics: HomeFeaturedMetric[];
  proofPoints: string[];
}

export interface HomeStandard {
  code: string;
  label: string;
  href: string;
}

export interface HomeWorkflowStep {
  number: string;
  title: string;
  description: string;
  href: string;
}

export interface HomeProjectPhase {
  id: string;
  title: string;
  summary: string;
  href: string;
  frameIndex: number;
}

export interface HomePageModel {
  counts: HomeCounts;
  featuredCalculation: HomeFeaturedCalculation;
  resources: HomeResourceLink[];
  standards: HomeStandard[];
  articles: HomeArticle[];
  workflow: HomeWorkflowStep[];
  phases: HomeProjectPhase[];
}

const FEATURED_ARTICLE_SLUGS = [
  "tbdy-2018-betonarme-analiz",
  "eps-xps-yalitim-farklari",
  "beton-dokumu-kontrol-listesi",
] as const;

const HOME_ARTICLE_IMAGE_OVERRIDES: Partial<Record<(typeof FEATURED_ARTICLE_SLUGS)[number], string>> = {
  "tbdy-2018-betonarme-analiz": "/home/featured-tbdy.webp",
};

const SUPPORT_RESOURCE_SPECS = [
  { kind: "calculation", id: "tahmini-insaat-alani", reference: "TAKS · KAKS" },
  { kind: "calculation", id: "insaat-maliyeti", reference: "Maliyet" },
  { kind: "tool", id: "donati-hesabi", reference: "TS 500" },
  { kind: "tool", id: "taban-kesme-kuvveti", reference: "TBDY 2018" },
] as const;

const QUICK_QUANTITY_SCENARIO: QuickQuantityInput = {
  katAlaniM2: 450,
  normalKatSayisi: 5,
  bodrumKatSayisi: 1,
  bodrumKatAlaniM2: null,
  yapiArketipi: "apartman-4-7-kat",
  tasiyiciSistem: "cercevePerde",
  dosemeSistemi: "kirisli",
  temelTipi: "radye",
  zeminSinifi: "ZC",
  depremTalebi: "orta",
  planKompaktligi: "standart",
  bodrumCevrePerdesi: "tam",
  tipikAciklik: "standart",
  resmiSinif: null,
};

const STANDARDS: HomeStandard[] = [
  { code: "TS 500", label: "Betonarme tasarım", href: "/kategori/araclar" },
  { code: "TBDY 2018", label: "Deprem ve modelleme", href: "/kategori/deprem-yonetmelik" },
  { code: "TS EN 1992-1-1", label: "Detay ve dayanıklılık", href: "/kategori/araclar/pas-payi" },
  { code: "TS EN 206", label: "Beton performansı", href: "/kategori/santiye" },
];

const WORKFLOW: HomeWorkflowStep[] = [
  {
    number: "01",
    title: "İmarı kontrol et",
    description: "TAKS, KAKS ve çekme mesafelerini okuyun.",
    href: "/kategori/araclar/imar-hesaplayici",
  },
  {
    number: "02",
    title: "Alanı hesapla",
    description: "Emsal ve bodrum katkısını birlikte görün.",
    href: "/hesaplamalar/tahmini-insaat-alani",
  },
  {
    number: "03",
    title: "Maliyeti modelle",
    description: "Proje kabullerini bütçe senaryosuna dönüştürün.",
    href: "/hesaplamalar/insaat-maliyeti",
  },
  {
    number: "04",
    title: "Hazırlığı planla",
    description: "Disiplinler arası proje ve izin akışına geçin.",
    href: "/kategori/bina-asamalari/proje-hazirlik",
  },
];

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits }).format(value);
}

function toHomeArticle(article: ArticleData): HomeArticle {
  return {
    title: article.title,
    slug: article.slug,
    category: article.category,
    description: article.description,
    image: HOME_ARTICLE_IMAGE_OVERRIDES[article.slug as keyof typeof HOME_ARTICLE_IMAGE_OVERRIDES] ?? article.image,
    date: article.date,
    readTime: article.readTime,
  };
}

function selectFeaturedArticles(articles: ArticleData[]): HomeArticle[] {
  const bySlug = new Map(articles.map((article) => [article.slug, article] as const));
  const selected = FEATURED_ARTICLE_SLUGS.flatMap((slug) => {
    const article = bySlug.get(slug);
    return article ? [article] : [];
  });

  const selectedSlugs = new Set(selected.map((article) => article.slug));
  const fallback = articles
    .filter((article) => !selectedSlugs.has(article.slug))
    .sort((left, right) => {
      const leftTime = parseLocalizedDateToDate(left.date)?.getTime() ?? 0;
      const rightTime = parseLocalizedDateToDate(right.date)?.getTime() ?? 0;
      return rightTime - leftTime;
    });

  return [...selected, ...fallback].slice(0, 3).map(toHomeArticle);
}

function selectSupportResources(): HomeResourceLink[] {
  const calculations = new Map(getCalculationPages().map((item) => [item.id, item] as const));
  const tools = new Map(getLiveTools().map((item) => [item.id, item] as const));

  return SUPPORT_RESOURCE_SPECS.flatMap((spec): HomeResourceLink[] => {
    if (spec.kind === "calculation") {
      const item = calculations.get(spec.id);
      return item
        ? [{
            id: item.id,
            kind: "calculation",
            title: item.title,
            href: item.href,
            description: item.description,
            label: "Hesaplama",
            reference: spec.reference,
            iconKey: item.iconKey,
          }]
        : [];
    }

    const item = tools.get(spec.id);
    return item
      ? [{
          id: item.id,
          kind: "tool",
          title: item.name,
          href: item.href,
          description: item.description,
          label: item.discipline,
          reference: spec.reference,
          iconKey: item.iconKey,
        }]
      : [];
  });
}

function buildFeaturedCalculation(): HomeFeaturedCalculation {
  const calculation = getCalculationPages().find((item) => item.id === "hizli-metraj");
  const result = calculateQuickQuantity(QUICK_QUANTITY_SCENARIO);

  if (!calculation || !result) {
    throw new Error("Ana sayfa hızlı metraj örneği üretilemedi.");
  }

  return {
    id: calculation.id,
    title: calculation.title,
    href: calculation.href,
    description: calculation.description,
    scenario: "450 m² tipik kat · 5 normal + 1 bodrum · konut",
    metrics: [
      { label: "Toplam alan", value: `${formatNumber(result.toplamInsaatAlaniM2)} m²` },
      { label: "Beton", value: `${formatNumber(result.betonM3)} m³` },
      { label: "Donatı", value: `${formatNumber(result.donatiTon)} ton` },
      { label: "Kalıp", value: `${formatNumber(result.kalipM2)} m²` },
    ],
    proofPoints: ["Varsayımlar görünür", "2026 resmî veri", "Ön fizibilite"],
  };
}

export function getHomePageModel(): HomePageModel {
  const articles = getArticleList();
  const calculations = getCalculationPages();
  const tools = getLiveTools();

  return {
    counts: {
      calculations: calculations.length,
      tools: tools.length,
      articles: articles.length,
    },
    featuredCalculation: buildFeaturedCalculation(),
    resources: selectSupportResources(),
    standards: STANDARDS,
    articles: selectFeaturedArticles(articles),
    workflow: WORKFLOW,
    phases:
      BINA_MINDMAP_DATA.children?.map((phase, frameIndex) => ({
        id: phase.id,
        title: phase.label.replace(/\n/g, " "),
        summary: phase.summary,
        href: phase.url,
        frameIndex,
      })) ?? [],
  };
}
