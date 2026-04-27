import { Calculator, FileText, GitBranchPlus, ShieldCheck } from "lucide-react";
import { HomeContentSpotlight } from "@/components/home-content-spotlight";
import { HomeCtaBanner } from "@/components/home-cta-banner";
import { HomeFeed } from "@/components/home-feed";
import { HomeHeroSection } from "@/components/home-hero-section";
import { HomeStandardsStrip } from "@/components/home-standards-strip";
import { HomeStatsBanner } from "@/components/home-stats-banner";
import { HomeToolsBento } from "@/components/home-tools-bento";
import type {
  HomeArticle,
  HomeFeedGroup,
  HomeMetric,
  HomePhasePreview,
  HomeStandardCard,
} from "@/components/home-types";
import { BINA_BRANCH_COLORS, BINA_MINDMAP_DATA } from "@/lib/bina-asamalari";
import { getFeaturedTool, getLiveTools } from "@/lib/tools-data";

const HERO_ARTICLE_SLUG = "kolon-on-boyutlandirma";
const SECONDARY_HERO_SLUG = "kalip-sokumu-rehberi";
const SPOTLIGHT_LEAD_SLUG = "iksa-uzman-sistemi";
const SUPPORTING_SPOTLIGHT_SLUGS = ["beton-dokumu-kontrol-listesi", "zemin-iyilestirme-yontemleri"];

const STANDARD_REFERENCES: HomeStandardCard[] = [
  {
    code: "TS 500",
    title: "Betonarme ön boyutlandırma ve donatı kararları",
    description: "Kolon, kiriş, döşeme ve ön kontrol araçlarının çekirdek betonarme omurgası.",
    href: "/kategori/araclar",
    note: "Betonarme tasarım bandı",
  },
  {
    code: "TBDY 2018",
    title: "Deprem etkisi, düzensizlik ve modelleme yaklaşımı",
    description: "Deprem rehberleri ve eşdeğer deprem yükü araçları için ana mevzuat hattı.",
    href: "/kategori/deprem-yonetmelik",
    note: "Deprem ve mevzuat bandı",
  },
  {
    code: "TS EN 1992-1-1",
    title: "Dayanıklılık, beton örtüsü ve detay mantığı",
    description: "Pas payı, beton örtüsü ve detay kararlarında Avrupa standardı çerçevesi.",
    href: "/kategori/araclar/pas-payi",
    note: "Detay ve dayanıklılık bandı",
  },
  {
    code: "TS EN 206",
    title: "Beton performansı ve çevresel etki sınıfı",
    description: "Beton sınıfı, dayanıklılık beklentisi ve saha kabul yaklaşımı için referans seti.",
    href: "/kategori/santiye",
    note: "Malzeme ve uygulama bandı",
  },
];

function pickArticleBySlug(articles: HomeArticle[], slug: string, fallbackIndex = 0): HomeArticle {
  return articles.find((article) => article.slug === slug) ?? articles[fallbackIndex] ?? articles[0];
}

function pickDistinctArticles(articles: HomeArticle[], slugs: string[], count: number): HomeArticle[] {
  const selected: HomeArticle[] = [];
  const seen = new Set<string>();

  for (const slug of slugs) {
    const article = articles.find((item) => item.slug === slug);
    if (article && !seen.has(article.slug)) {
      selected.push(article);
      seen.add(article.slug);
    }
  }

  for (const article of articles) {
    if (selected.length >= count) {
      break;
    }
    if (!seen.has(article.slug)) {
      selected.push(article);
      seen.add(article.slug);
    }
  }

  return selected;
}

function pickVisualArticles(articles: HomeArticle[], count: number): HomeArticle[] {
  const selected: HomeArticle[] = [];
  const seenImages = new Set<string>();

  for (const article of articles) {
    if (selected.length >= count) {
      break;
    }

    if (!seenImages.has(article.image)) {
      selected.push(article);
      seenImages.add(article.image);
    }
  }

  for (const article of articles) {
    if (selected.length >= count) {
      break;
    }

    if (!selected.some((item) => item.slug === article.slug)) {
      selected.push(article);
    }
  }

  return selected;
}

export default function HomeClient({ allArticles }: { allArticles: HomeArticle[] }) {
  const liveTools = getLiveTools();
  const featuredTool = getFeaturedTool() ?? liveTools[0];

  const heroArticle = pickArticleBySlug(allArticles, HERO_ARTICLE_SLUG, 0);
  const secondaryHeroArticle = pickArticleBySlug(allArticles, SECONDARY_HERO_SLUG, 1);
  const spotlightLead = pickArticleBySlug(allArticles, SPOTLIGHT_LEAD_SLUG, 2);
  const spotlightSupporting = pickDistinctArticles(allArticles, SUPPORTING_SPOTLIGHT_SLUGS, 2).filter(
    (article) => article.slug !== spotlightLead.slug,
  ).slice(0, 2);

  const nonDepremArticles = allArticles.filter((article) => article.sectionId !== "deprem-yonetmelik");
  const depremArticles = allArticles.filter((article) => article.sectionId === "deprem-yonetmelik");

  const feedGroups: HomeFeedGroup[] = [
    {
      id: "son-eklenen",
      label: "Son eklenen",
      description: "Ana akıştaki en yeni içerikleri ve son güncellenen teknik notları hızlıca tarayın.",
      href: "/konu-haritasi",
      ctaLabel: "Tüm akışı aç",
      totalCount: allArticles.length,
      articles: pickVisualArticles(allArticles, 4),
    },
    {
      id: "saha-ve-arac",
      label: "Saha ve araç",
      description: "Şantiye, geoteknik ve araç odaklı içerikleri ayrı bir çalışma bandı olarak görün.",
      href: "/kategori/araclar",
      ctaLabel: "Araç merkezine git",
      totalCount: nonDepremArticles.length,
      articles: pickVisualArticles(nonDepremArticles, 4),
    },
    {
      id: "deprem-ve-mevzuat",
      label: "Deprem ve mevzuat",
      description: "Yönetmelik yorumlarını ve deprem kararlarını tek bir yoğun bilgi bandında açın.",
      href: "/kategori/deprem-yonetmelik",
      ctaLabel: "Mevzuat merkezine git",
      totalCount: depremArticles.length,
      articles: pickVisualArticles(depremArticles, 4),
    },
  ];

  const metrics: HomeMetric[] = [
    {
      label: "Canlı araç",
      note: "Tek ekranda açılan pratik mühendislik araçları.",
      value: liveTools.length,
      suffix: "+",
      icon: Calculator,
    },
    {
      label: "Teknik içerik",
      note: "Makale, rehber ve mevzuat kayıtları.",
      value: allArticles.length,
      suffix: "+",
      icon: FileText,
    },
    {
      label: "Çekirdek standart",
      note: "Homepage omurgasını taşıyan ana referans kümesi.",
      value: STANDARD_REFERENCES.length,
      icon: ShieldCheck,
    },
    {
      label: "Saha fazı",
      note: "Projeden teslime ana akış fazları.",
      value: BINA_MINDMAP_DATA.children?.length ?? 0,
      icon: GitBranchPlus,
    },
  ];

  const phasePreviews: HomePhasePreview[] =
    BINA_MINDMAP_DATA.children?.map((phase) => ({
      id: phase.id,
      title: phase.label.replace(/\n/g, " "),
      summary: phase.summary,
      href: phase.url,
      image: `/bina-asamalari/hero/${phase.id}.svg`,
      accentColor: BINA_BRANCH_COLORS[phase.id as keyof typeof BINA_BRANCH_COLORS] ?? "#94a3b8",
    })) ?? [];

  if (!featuredTool) {
    return null;
  }

  return (
    <div className="home-page pb-8">
      <HomeHeroSection
        heroArticle={heroArticle}
        secondaryArticle={secondaryHeroArticle}
        featuredTool={featuredTool}
        articleCount={allArticles.length}
        toolCount={liveTools.length}
        phaseCount={phasePreviews.length}
      />
      <HomeStatsBanner metrics={metrics} />
      <HomeToolsBento tools={liveTools} />
      <HomeContentSpotlight leadArticle={spotlightLead} supportingArticles={spotlightSupporting} />
      <HomeStandardsStrip standards={STANDARD_REFERENCES} phasePreviews={phasePreviews} />
      <HomeFeed groups={feedGroups} />
      <HomeCtaBanner />
    </div>
  );
}
