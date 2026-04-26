import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleClient from "@/components/article-client";
import { JsonLd, generateArticleSchema, generateBreadcrumbSchema } from "@/components/seo/json-ld";
import { getAllSlugs, getArticleBySlug, getArticles } from "@/lib/articles-data";
import { parseBlocks } from "@/lib/article-blocks";
import { buildArticleNavigation } from "@/lib/content-navigation";
import { SITE_DESCRIPTION, resolveMediaUrl, resolveSiteUrl } from "@/lib/site-config";
import { buildArticleMetadata, parseLocalizedDateToIso } from "@/lib/seo";

export const dynamicParams = false;

const RESERVED_CONTENT_SLUGS = new Set(["admin"]);

export async function generateStaticParams() {
  return getAllSlugs()
    .filter((slug) => !RESERVED_CONTENT_SLUGS.has(slug))
    .map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_CONTENT_SLUGS.has(slug)) {
    return {
      title: "İçerik bulunamadı",
      description: SITE_DESCRIPTION,
    };
  }

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
  if (RESERVED_CONTENT_SLUGS.has(slug)) {
    notFound();
  }

  const articles = getArticles();
  const article = articles[slug];

  if (!article) {
    notFound();
  }

  const allArticles = Object.values(articles);
  const relatedArticles = article.relatedSlugs
    .map((relatedSlug) => articles[relatedSlug])
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const fallbackArticles = allArticles
    .filter((item) => item.slug !== article.slug && item.sectionId === article.sectionId)
    .slice(0, 3);
  const safeRelatedArticles = relatedArticles.length > 0 ? relatedArticles : fallbackArticles;
  const articleImage = resolveMediaUrl(article.image);
  const parsedSections = article.sections.map((section) => ({
    ...section,
    blocks: parseBlocks(section.content),
  }));
  const navigation = buildArticleNavigation(article);
  const publishedTime = parseLocalizedDateToIso(article.date) ?? article.date;
  const modifiedTime = parseLocalizedDateToIso(article.updatedAt ?? article.date) ?? article.updatedAt ?? article.date;
  const articleSchema = generateArticleSchema({
    headline: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.description,
    image: articleImage,
    datePublished: publishedTime,
    dateModified: modifiedTime,
    authorName: article.author,
    url: resolveSiteUrl(article.slug),
  });
  const breadcrumbSchema = generateBreadcrumbSchema(
    navigation.breadcrumbs.map((crumb) => ({
      name: crumb.title,
      item: crumb.href,
    })),
  );

  return (
    <>
      <JsonLd schema={articleSchema} />
      <JsonLd schema={breadcrumbSchema} />
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
