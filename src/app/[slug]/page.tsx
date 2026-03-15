import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleClient from "@/components/article-client";
import { getArticleBySlug, getArticles } from "@/lib/articles-data";
import { SITE_DESCRIPTION, SITE_NAME, resolveMediaUrl, resolveSiteUrl } from "@/lib/site-config";

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

  const articleImage = resolveMediaUrl(article.image);

  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      url: resolveSiteUrl(slug),
      siteName: SITE_NAME,
      images: articleImage ? [{ url: articleImage, width: 1200, height: 630, alt: article.title }] : undefined,
      publishedTime: article.date,
      authors: [article.author],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: articleImage ? [articleImage] : undefined,
    },
  };
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

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <ArticleClient article={article} relatedArticles={safeRelatedArticles} />
    </>
  );
}
