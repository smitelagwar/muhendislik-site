import type { ArticleData } from "../articles-data";

/**
 * TS 500 makale içeriği için tip tanımları.
 * ArticleData.sections[] formatıyla tamamen uyumludur.
 * parseBlocks() tarafından render edilir.
 */

export interface Ts500Section {
  id: string;
  title: string;
  /** Markdown içerik — parseBlocks() ile render edilir.
   * Desteklenen: paragraf, ## başlık, | tablo |, ```kod```,
   * > [!NOTE] callout, - liste, ![görsel](yol), --- ayırıcı
   */
  content: string;
  subsections: { id: string; title: string }[];
}

export interface Ts500Reference {
  label: string;
  href?: string;
  note?: string;
}

/**
 * TS 500 makale spesifikasyonu.
 * buildTs500Article() ile ArticleData'ya dönüştürülür.
 */
export interface Ts500ArticleSpec {
  slug: string;
  title: string;
  description: string;
  /** SEO başlığı — verilmezse otomatik oluşturulur */
  seoTitle?: string;
  seoDescription?: string;
  /** Kapak görseli yolu — /covers/ts500/... */
  image?: string;
  /** Okuma süresi — verilmezse "8 dk" kullanılır */
  readTime?: string;
  sections: Ts500Section[];
  keywords: string[];
  references?: Ts500Reference[];
  relatedSlugs?: string[];
  tags?: string[];
}

const TS500_SOURCE = {
  label: "ÇŞİDB — Betonarme İşleri Genel Teknik Şartnamesi",
  href: "https://webdosya.csb.gov.tr/db/yfk/icerikler/c18---betonarme-isler--20190412161656.pdf",
  note: "Madde, tablo ve yürürlük bilgisi proje tarihinde resmî kaynaktan doğrulanmalıdır.",
} as const;

const DEFAULT_REFERENCES: Ts500Reference[] = [TS500_SOURCE];

/**
 * Ts500ArticleSpec'i tam ArticleData'ya dönüştürür.
 */
export function buildTs500Article(spec: Ts500ArticleSpec): ArticleData {
  const references = spec.references
    ? [...DEFAULT_REFERENCES, ...spec.references]
    : DEFAULT_REFERENCES;

  return {
    slug: spec.slug,
    title: spec.title,
    description: spec.description,
    seoTitle: spec.seoTitle ?? `${spec.title} | Mühendis Mimar Portalı`,
    seoDescription: spec.seoDescription ?? spec.description,
    sectionId: "deprem-yonetmelik",
    seriesId: "ts500",
    regulationStatus: "standard",
    category: "TS 500 Betonarme",
    categoryColor: "bg-blue-600 text-white",
    badgeLabel: "TS 500",
    author: "Mühendis Mimar Portalı",
    authorTitle: "Teknik İçerik Ekibi",
    date: "13 Ağustos 2026",
    updatedAt: "13 Ağustos 2026",
    readTime: spec.readTime ?? "8 dk",
    image: spec.image ?? "/covers/yonetmelik.svg",
    sections: spec.sections,
    relatedSlugs: spec.relatedSlugs ?? [],
    keywords: Array.from(new Set([...spec.keywords, "TS 500", "betonarme", "TS 500 Betonarme"])),
    tags: spec.tags ?? spec.keywords.slice(0, 5),
    references,
  };
}
