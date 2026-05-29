import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ArticleClient from "@/components/article-client";
import { parseBlocks } from "@/lib/article-blocks";
import {
  getAllBinaGuidePaths,
  getBinaGuideBySlugParts,
  PUBLISHED_AT_ISO,
  getRelatedBinaGuides,
  toBinaGuideArticle,
} from "@/lib/bina-asamalari-content";
import { buildBinaGuideNavigation } from "@/lib/content-navigation";
import { SITE_DESCRIPTION, SITE_NAME, resolveMediaUrl, resolveSiteUrl } from "@/lib/site-config";

export function getBinaGuideStaticParams() {
  return getAllBinaGuidePaths().map((slugPath) => ({ slug: slugPath.split("/") }));
}

export async function buildBinaGuideMetadata(slugParts: readonly string[]): Promise<Metadata> {
  const guide = getBinaGuideBySlugParts(slugParts);

  if (!guide) {
    return {
      title: "İçerik bulunamadı",
      description: SITE_DESCRIPTION,
    };
  }

  const article = toBinaGuideArticle(guide);
  const articleImage = resolveMediaUrl(article.image);
  const pathname = `/kategori/bina-asamalari/${guide.slugPath}`;

  return {
    title: `${guide.title} | Bina Aşamaları`,
    description: guide.description,
    keywords: guide.keywords,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
      url: resolveSiteUrl(pathname),
      siteName: SITE_NAME,
      images: articleImage
        ? [{ url: articleImage, width: 1200, height: 630, alt: guide.title }]
        : undefined,
      publishedTime: `${PUBLISHED_AT_ISO}T00:00:00+03:00`,
      authors: [guide.author],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
      images: articleImage ? [articleImage] : undefined,
    },
  };
}

interface SuggestedTool {
  title: string;
  description: string;
  href: string;
  cta: string;
}

const TOOL_MAPPINGS: Record<string, SuggestedTool> = {
  "pas-payi": {
    title: "Pas Payı Hesabı",
    description: "TS EN 1992-1-1 (Eurocode 2) ve TS 500 standartlarına göre çevresel etki sınıfı, yangın dayanımı ve donatı çapına bağlı olarak minimum pas payı örtü kalınlığını hesaplayın.",
    href: "/kategori/araclar/pas-payi",
    cta: "Pas Payı Aracı"
  },
  "kalip-sokumu": {
    title: "Kalıp Söküm Süresi Hesaplayıcı",
    description: "TS 500 ve ilgili standartlara göre beton sınıfı, çimento tipi, ortam sıcaklığı ve açıklığa bağlı olarak güvenli kalıp söküm sürelerini hesaplayın.",
    href: "/kategori/araclar/kalip-sokum-suresi",
    cta: "Kalıp Söküm Aracı"
  },
  "kolon-donati": {
    title: "Betonarme Kolon Hesabı",
    description: "TS 500 ve TBDY 2018 standartlarına göre eksenel yük ve moment altındaki dikdörtgen veya dairesel betonarme kolonların taşıma kapasitesi ve donatı kontrollerini yapın.",
    href: "/kategori/araclar/kolon-hesabi",
    cta: "Kolon Hesabı Aracı"
  },
  "kolon-kalibi": {
    title: "Betonarme Kolon Hesabı",
    description: "TS 500 standartlarına göre kolon taşıma kapasitesi, süneklik düzeyi ve etriye sıklaştırma bölgesi kontrollerini yapın.",
    href: "/kategori/araclar/kolon-hesabi",
    cta: "Kolon Hesabı Aracı"
  },
  "kiris-donati": {
    title: "Betonarme Kiriş Eğilme Kapasitesi",
    description: "TS 500 standartlarına göre tek donatılı veya çift donatılı dikdörtgen kirişlerin eğilme momenti kapasitesini ve donatı oranlarını hesaplayın.",
    href: "/kategori/araclar/kiris-hesabi",
    cta: "Kiriş Hesabı Aracı"
  },
  "kiris-kalibi": {
    title: "Betonarme Kiriş Hesabı",
    description: "TS 500 standartlarına göre kiriş eğilme momenti kapasitesini, sehim limitlerini ve donatı detaylarını inceleyin.",
    href: "/kategori/araclar/kiris-hesabi",
    cta: "Kiriş Hesabı Aracı"
  },
  "doseme-donati": {
    title: "Döşeme Hesabı (Tek/Çift Doğrultulu)",
    description: "TS 500 standartlarına göre tek doğrultulu (hurdi) ve çift doğrultulu (dal) döşemelerin kalınlık, yük dağılımı ve moment katsayıları hesaplarını gerçekleştirin.",
    href: "/kategori/araclar/doseme-hesabi",
    cta: "Döşeme Hesabı Aracı"
  },
  "doseme-kalibi": {
    title: "Döşeme Hesabı (Tek/Çift Doğrultulu)",
    description: "TS 500 ve TS EN 1992 standartlarına göre döşeme kalınlığı, sehim limitleri ve donatı yerleşimini analiz edin.",
    href: "/kategori/araclar/doseme-hesabi",
    cta: "Döşeme Hesabı Aracı"
  },
  "radye-temel": {
    title: "Tekil Temel Hesabı",
    description: "TS 500 standartlarına göre temel boyutlandırması, zemin emniyet gerilmesi, delme kesme ve donatı alanı kontrollerini hızlıca yapın.",
    href: "/hesaplamalar/tekil-temel",
    cta: "Temel Hesabı Aracı"
  },
  "temel-donati": {
    title: "Tekil Temel Hesabı",
    description: "Temel altı zemin gerilmesi, eğilme momenti kapasitesi ve TS 500 donatı kurallarına göre minimum donatı tasarımı kontrollerini yapın.",
    href: "/hesaplamalar/tekil-temel",
    cta: "Temel Hesabı Aracı"
  },
  "mimari-proje": {
    title: "İmar Durumu ve Yapılaşma Hesaplayıcı",
    description: "3194 Sayılı İmar Kanunu ve yerel imar yönetmeliklerine göre arsa alanı, TAKS ve KAKS (emsal) değerlerine göre taban alanı ve kat karşılığı fizibilite hesabı yapın.",
    href: "/kategori/araclar/imar-hesaplayici",
    cta: "İmar Hesaplama Aracı"
  },
  "yapi-ruhsati": {
    title: "İmar Durumu ve Yapılaşma Hesaplayıcı",
    description: "Yapı ruhsatı alım sürecinde kritik olan TAKS, KAKS, çekme mesafeleri ve kat alanları limitlerini ön fizibilite olarak hızlıca denetleyin.",
    href: "/kategori/araclar/imar-hesaplayici",
    cta: "İmar Hesaplama Aracı"
  }
};

export async function renderBinaGuidePage(slugParts: readonly string[]) {
  const guide = getBinaGuideBySlugParts(slugParts);

  if (!guide) {
    notFound();
  }

  const requestedSlugPath = slugParts.join("/");

  if (requestedSlugPath && requestedSlugPath !== guide.slugPath) {
    redirect(`/kategori/bina-asamalari/${guide.slugPath}`);
  }

  const article = toBinaGuideArticle(guide);
  const relatedArticles = getRelatedBinaGuides(guide.slugPath).map(toBinaGuideArticle);
  const parsedSections = article.sections.map((section) => ({
    ...section,
    blocks: parseBlocks(section.content),
  }));
  const navigation = buildBinaGuideNavigation(guide);
  const articleImage = resolveMediaUrl(article.image);
  const pathname = `/kategori/bina-asamalari/${guide.slugPath}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: `${PUBLISHED_AT_ISO}T00:00:00+03:00`,
    dateModified: `${PUBLISHED_AT_ISO}T00:00:00+03:00`,
    author: {
      "@type": "Person",
      name: article.author,
    },
    image: articleImage ? [articleImage] : undefined,
    mainEntityOfPage: resolveSiteUrl(pathname),
    keywords: article.keywords,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: resolveSiteUrl(),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: navigation.breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.title,
      item: resolveSiteUrl(crumb.href),
    })),
  };

  const suggestedTool = TOOL_MAPPINGS[guide.slugPath];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ArticleClient
        article={article}
        relatedArticles={relatedArticles}
        parsedSections={parsedSections}
        breadcrumbs={navigation.breadcrumbs}
        backLink={navigation.backLink}
        hideToolPromos={!suggestedTool}
        suggestedTool={suggestedTool}
      />
    </>
  );
}
