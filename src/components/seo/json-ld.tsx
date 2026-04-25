export interface JsonLdProps {
  /** The schema object to serialize */
  schema: Record<string, any>;
}

export function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// ---------------------------------------------------------------------------
// YARDIMCI ŞEMA ÜRETİCİLERİ
// ---------------------------------------------------------------------------

/**
 * Hesap araçları (Calculator/SoftwareApplication) için JSON-LD şeması oluşturur
 */
export function generateCalculatorSchema({
  name,
  description,
  url,
  image,
}: {
  name: string;
  description: string;
  url: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: name,
    url: url,
    description: description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "TRY",
    },
    ...(image && { image }),
  };
}

/**
 * Teknik makaleler için (Article/BlogPosting) JSON-LD şeması oluşturur
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
  image: string;
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
    image: [image],
    datePublished,
    dateModified,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Mühendis-Mimar Portali",
      logo: {
        "@type": "ImageObject",
        url: "https://muhendislik-site.vercel.app/icon.svg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
}

/**
 * SSS (FAQ) sayfaları için JSON-LD şeması oluşturur
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
