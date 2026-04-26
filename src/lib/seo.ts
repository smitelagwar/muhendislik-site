import type { Metadata } from "next";
import {
  DEFAULT_OG_IMAGE_PATH,
  SITE_DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  resolveMediaUrl,
  resolveSiteUrl,
} from "./site-config";

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

const TURKISH_MONTH_INDEX: Record<string, number> = {
  ocak: 0,
  subat: 1,
  mart: 2,
  nisan: 3,
  mayis: 4,
  haziran: 5,
  temmuz: 6,
  agustos: 7,
  eylul: 8,
  ekim: 9,
  kasim: 10,
  aralik: 11,
};

function normalizeTurkishDateToken(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

export function parseLocalizedDateToDate(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(normalizedValue)) {
    const parsedIsoDate = new Date(normalizedValue);
    return Number.isNaN(parsedIsoDate.getTime()) ? null : parsedIsoDate;
  }

  const match = normalizedValue.match(/^(\d{1,2})\s+([^\s]+)\s+(\d{4})$/u);
  if (!match) {
    return null;
  }

  const day = Number.parseInt(match[1], 10);
  const month = TURKISH_MONTH_INDEX[normalizeTurkishDateToken(match[2])];
  const year = Number.parseInt(match[3], 10);

  if (!Number.isInteger(day) || !Number.isInteger(year) || month === undefined) {
    return null;
  }

  const parsedDate = new Date(Date.UTC(year, month, day));
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function parseLocalizedDateToIso(value?: string | null): string | undefined {
  return parseLocalizedDateToDate(value)?.toISOString();
}

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
  const publishedTime = parseLocalizedDateToIso(date) ?? date;
  const modifiedTime = parseLocalizedDateToIso(updatedAt ?? date) ?? updatedAt ?? date;

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
      publishedTime,
      modifiedTime,
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
    title: SITE_DEFAULT_TITLE,
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
