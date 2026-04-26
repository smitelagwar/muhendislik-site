import { SITE_NAME, resolveSiteUrl } from "@/lib/site-config";

export interface JsonLdProps {
  /** The schema object to serialize */
  schema: JsonLdSchema;
}

type JsonLdPrimitive = string | number | boolean | null;
type JsonLdValue = JsonLdPrimitive | JsonLdSchema | JsonLdValue[];
type JsonLdSchema = {
  [key: string]: JsonLdValue;
};

export function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Hesap araçları için JSON-LD şeması oluşturur.
 */
export function generateCalculatorSchema({
  name,
  description,
  url,
  image,
  keywords,
}: {
  name: string;
  description: string;
  url: string;
  image?: string;
  keywords?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    url,
    description,
    applicationCategory: "EngineeringApplication",
    operatingSystem: "Any",
    inLanguage: "tr-TR",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: resolveSiteUrl("/"),
    },
    ...(keywords?.length ? { keywords: keywords.join(", ") } : {}),
    ...(image ? { image } : {}),
  };
}

/**
 * Teknik makaleler için JSON-LD şeması oluşturur.
 */
export function generateArticleSchema({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  url,
}: {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  authorName: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    ...(image ? { image: [image] } : {}),
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: resolveSiteUrl("/icon.svg"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; item: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: resolveSiteUrl(entry.item),
    })),
  };
}

/**
 * SSS sayfaları için JSON-LD şeması oluşturur.
 */
export function generateFaqSchema(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}
