import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import ArticleClient from "@/components/article-client";
import { parseBlocks } from "@/lib/article-blocks";
import {
  getAllBinaGuidePaths,
  getBinaGuideBreadcrumbs,
  getBinaGuideBySlugParts,
  PUBLISHED_AT_ISO,
  getRelatedBinaGuides,
  toBinaGuideArticle,
} from "@/lib/bina-asamalari-content";
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
      images: articleImage ? [{ url: articleImage, width: 1200, height: 630, alt: guide.title }] : undefined,
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
  const breadcrumbs = getBinaGuideBreadcrumbs(guide.slugPath);
  const backLink = guide.parentPath
    ? {
        title: "Üst kategoriye dön",
        href: `/kategori/bina-asamalari/${guide.parentPath}`,
      }
    : {
        title: "Kategori ağacına dön",
        href: "/kategori/bina-asamalari",
      };
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
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.title,
      item: resolveSiteUrl(crumb.href),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ArticleClient
        article={article}
        relatedArticles={relatedArticles}
        parsedSections={parsedSections}
        breadcrumbs={breadcrumbs}
        backLink={backLink}
        hideToolPromos
      />
    </>
  );
}
