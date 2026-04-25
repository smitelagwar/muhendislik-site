import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, SITE_DESCRIPTION, SITE_NAME, SITE_URL, resolveMediaUrl, resolveSiteUrl } from "./site-config";

type BaseSeoOptions = {
  title: string;
  description: string;
  pathname?: string;
  image?: string | null;
  keywords?: string[];
  type?: "website" | "article";
};

type ArticleSeoOptions = {
  slug: string;
  title: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  image?: string | null;
  date: string;
  updatedAt?: string;
  author: string;
};

type CollectionPageSchemaOptions = {
  title: string;
  description: string;
  pathname: string;
  items: Array<{
    name: string;
    href: string;
  }>;
};

function getImageUrl(image?: string | null) {
  return resolveMediaUrl(image ?? DEFAULT_OG_IMAGE_PATH);
}

export function buildSeoMetadata({
  title,
  description,
  pathname = "/",
  image,
  keywords,
  type = "website",
}: BaseSeoOptions): Metadata {
  const resolvedImage = getImageUrl(image);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      title,
      description,
      url: resolveSiteUrl(pathname),
      siteName: SITE_NAME,
      type,
      images: resolvedImage
        ? [
            {
              url: resolvedImage,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: resolvedImage ? [resolvedImage] : undefined,
    },
  };
}

export function buildArticleMetadata({
  slug,
  title,
  description,
  seoTitle,
  seoDescription,
  keywords,
  image,
  date,
  updatedAt,
  author,
}: ArticleSeoOptions): Metadata {
  const resolvedTitle = seoTitle ?? title;
  const resolvedDescription = seoDescription ?? description;
  const resolvedImage = getImageUrl(image);

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    keywords,
    alternates: {
      canonical: `/${slug}`,
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      type: "article",
      url: resolveSiteUrl(slug),
      siteName: SITE_NAME,
      images: resolvedImage
        ? [
            {
              url: resolvedImage,
              width: 1200,
              height: 630,
              alt: resolvedTitle,
            },
          ]
        : undefined,
      publishedTime: date,
      modifiedTime: updatedAt ?? date,
      authors: [author],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: resolvedImage ? [resolvedImage] : undefined,
    },
  };
}

export function buildHomeMetadata(): Metadata {
  return buildSeoMetadata({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    pathname: "/",
  });
}

export function buildCollectionPageSchema({
  title,
  description,
  pathname,
  items,
}: CollectionPageSchemaOptions) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: resolveSiteUrl(pathname),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: resolveSiteUrl(item.href),
      })),
    },
  };
}
