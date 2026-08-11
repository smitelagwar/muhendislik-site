import type { Metadata } from "next";
import { HomeEditorialSection } from "@/components/home-editorial-section";
import { HomeHeroSection } from "@/components/home-hero-section";
import { HomeProjectPath } from "@/components/home-project-path";
import { HomeResourceShowcase } from "@/components/home-resource-showcase";
import { HomeScrollLogo } from "@/components/home-scroll-logo";
import type {
  HomeArticle,
  HomeProjectPhase,
  HomeResource,
  HomeStandard,
} from "@/components/home-types";
import { JsonLd } from "@/components/seo/json-ld";
import { getArticleList, type ArticleData } from "@/lib/articles-data";
import { BINA_MINDMAP_DATA } from "@/lib/bina-asamalari";
import { getCalculationPages } from "@/lib/calculation-pages";
import { buildCollectionPageSchema, buildHomeMetadata, parseLocalizedDateToDate } from "@/lib/seo";
import { getLiveTools } from "@/lib/tools-data";

export const metadata: Metadata = buildHomeMetadata();

const FEATURED_ARTICLE_SLUGS = [
  "tbdy-2018-betonarme-analiz",
  "kalip-sokumu-rehberi",
  "zemin-iyilestirme-yontemleri",
] as const;

const RESOURCE_SPECS = [
  { kind: "calculation", id: "insaat-maliyeti", reference: "Maliyet ve metraj" },
  { kind: "tool", id: "donati-hesabi", reference: "TS 500" },
  { kind: "calculation", id: "tekil-temel", reference: "TS 500" },
  { kind: "calculation", id: "hizli-metraj", reference: "Ön keşif" },
  { kind: "tool", id: "kolon-on-boyutlandirma", reference: "TS 500" },
  { kind: "tool", id: "taban-kesme-kuvveti", reference: "TBDY 2018" },
] as const;

const STANDARDS: HomeStandard[] = [
  { code: "TS 500", label: "Betonarme tasarım", href: "/kategori/araclar" },
  { code: "TBDY 2018", label: "Deprem ve modelleme", href: "/kategori/deprem-yonetmelik" },
  { code: "TS EN 1992-1-1", label: "Detay ve dayanıklılık", href: "/kategori/araclar/pas-payi" },
  { code: "TS EN 206", label: "Beton performansı", href: "/kategori/santiye" },
];

function toHomeArticle(article: ArticleData): HomeArticle {
  return {
    title: article.title,
    slug: article.slug,
    sectionId: article.sectionId,
    category: article.category,
    description: article.description,
    image: article.image,
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

function selectResources(): HomeResource[] {
  const calculations = new Map(getCalculationPages().map((item) => [item.id, item] as const));
  const tools = new Map(getLiveTools().map((item) => [item.id, item] as const));

  return RESOURCE_SPECS.flatMap((spec): HomeResource[] => {
    if (spec.kind === "calculation") {
      const item = calculations.get(spec.id);
      return item
        ? [
            {
              id: item.id,
              kind: "calculation",
              title: item.title,
              href: item.href,
              description: item.description,
              label: "Hesaplama",
              reference: spec.reference,
              iconKey: item.iconKey,
            },
          ]
        : [];
    }

    const item = tools.get(spec.id);
    return item
      ? [
          {
            id: item.id,
            kind: "tool",
            title: item.name,
            href: item.href,
            description: item.description,
            label: item.discipline,
            reference: spec.reference,
            iconKey: item.iconKey,
          },
        ]
      : [];
  });
}

export default function Home() {
  const articles = getArticleList();
  const liveTools = getLiveTools();
  const calculations = getCalculationPages();
  const featuredArticles = selectFeaturedArticles(articles);
  const resources = selectResources();
  const phases: HomeProjectPhase[] =
    BINA_MINDMAP_DATA.children?.map((phase) => ({
      id: phase.id,
      title: phase.label.replace(/\n/g, " "),
      summary: phase.summary,
      href: phase.url,
      image: `/bina-asamalari/hero/${phase.id}.svg`,
    })) ?? [];

  const schema = buildCollectionPageSchema({
    title: "İnşaat mühendisliği hesap araçları ve teknik rehberler",
    description:
      "Mühendis ve mimarlar için hesaplamalar, yapısal araçlar, yönetmelik içerikleri ve bina yapım aşamaları.",
    pathname: "/",
    items: [
      { name: "İnşaat hesaplamaları", href: "/hesaplamalar" },
      { name: "Yapısal araçlar", href: "/kategori/araclar" },
      { name: "Teknik konu haritası", href: "/konu-haritasi" },
      { name: "Bina aşamaları", href: "/kategori/bina-asamalari" },
    ],
  });

  return (
    <>
      <HomeScrollLogo />
      <main className="home-page overflow-hidden">
        <JsonLd schema={schema} />
        <HomeHeroSection calculationCount={calculations.length} toolCount={liveTools.length} />
        <HomeResourceShowcase resources={resources} />
        <HomeEditorialSection articles={featuredArticles} />
        <HomeProjectPath phases={phases} standards={STANDARDS} />
      </main>
    </>
  );
}
