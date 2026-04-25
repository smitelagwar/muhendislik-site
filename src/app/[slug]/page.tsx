import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleClient from "@/components/article-client";
import { getArticleBySlug, getArticles } from "@/lib/articles-data";
import { parseBlocks } from "@/lib/article-blocks";
import { buildArticleNavigation } from "@/lib/content-navigation";
import { SITE_DESCRIPTION, SITE_NAME, resolveMediaUrl, resolveSiteUrl } from "@/lib/site-config";
import { buildArticleMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  return Object.keys(getArticles()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "İçerik bulunamadı",
      description: SITE_DESCRIPTION,
    };
  }

  return buildArticleMetadata({
    slug: article.slug,
    title: article.title,
    description: article.description,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    keywords: article.keywords,
    image: article.image,
    date: article.date,
    updatedAt: article.updatedAt,
    author: article.author,
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const allArticles = Object.values(getArticles());
  const relatedArticles = article.relatedSlugs
    .map((relatedSlug) => getArticleBySlug(relatedSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const fallbackArticles = allArticles.filter((item) => item.slug !== article.slug && item.sectionId === article.sectionId).slice(0, 3);
  const safeRelatedArticles = relatedArticles.length > 0 ? relatedArticles : fallbackArticles;
  const articleImage = resolveMediaUrl(article.image);
  const parsedSections = article.sections.map((section) => ({
    ...section,
    blocks: parseBlocks(section.content),
  }));

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.description,
    datePublished: article.date,
    dateModified: article.updatedAt ?? article.date,
    author: {
      "@type": "Person",
      name: article.author,
    },
    image: articleImage ? [articleImage] : undefined,
    mainEntityOfPage: resolveSiteUrl(article.slug),
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: resolveSiteUrl(),
    },
  };
  const navigation = buildArticleNavigation(article);
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ArticleClient
        article={article}
        relatedArticles={safeRelatedArticles}
        parsedSections={parsedSections}
        breadcrumbs={navigation.breadcrumbs}
        backLink={navigation.backLink}
      />
    </>
  );
}
