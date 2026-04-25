import { DEPREM_SERIES } from "./deprem-series";

export type SiteSectionId =
  | "araclar"
  | "bina-asamalari"
  | "yapi-tasarimi"
  | "deprem-yonetmelik"
  | "tbdy-2018-detay"
  | "geoteknik"
  | "santiye"
  | "malzeme"
  | "surdurulebilirlik";

export interface SiteSection {
  id: SiteSectionId;
  title: string;
  href: string;
  description: string;
  categories: string[];
  tags: string[];
}

export interface ArticleSectionLike {
  category: string;
  sectionId: SiteSectionId;
}

const depremCategories = DEPREM_SERIES.flatMap((series) => series.categoryLabels);
const depremTags = Array.from(
  new Set([
    "deprem",
    "tbdy",
    "yönetmelik",
    "ts500",
    "betonarme",
    "yangın",
    "otopark",
    "imar",
    "bep-tr",
    "ts825",
    "eurocode",
    "akustik",
    "asansör",
    "isg",
    "çevre",
    "enerji",
    "su",
    "zemin",
    "engelsiz",
    "ts 9111",
    "byy",
    "süneklik",
    "spektrum",
    ...DEPREM_SERIES.flatMap((series) => series.keywords),
  ]),
);

export const SITE_SECTIONS: SiteSection[] = [
  {
    id: "araclar",
    title: "Araçlar",
    href: "/kategori/araclar",
    description: "Hesaplama araçları ve mühendislik yardımcıları.",
    categories: ["Hesap Aracı"],
    tags: ["araç", "hesap", "donatı", "kolon", "kalıp", "iksa"],
  },
  {
    id: "bina-asamalari",
    title: "Bina Aşamaları",
    href: "/kategori/bina-asamalari",
    description: "Kazıdan teslime kadar tüm yapım aşamalarını etkileşimli dallar halinde izleyin.",
    categories: [],
    tags: ["bina aşamaları", "kaba inşaat", "ince işler", "tesisat", "yalıtım", "peyzaj"],
  },
  {
    id: "yapi-tasarimi",
    title: "Yapı Tasarımı",
    href: "/kategori/yapi-tasarimi",
    description: "Betonarme tasarım, taşıyıcı sistem ve proje kararları.",
    categories: [],
    tags: ["betonarme", "taşıyıcı sistem", "yapısal", "analiz"],
  },
  {
    id: "deprem-yonetmelik",
    title: "Deprem ve Yönetmelikler",
    href: "/kategori/deprem-yonetmelik",
    description: "TBDY 2018, genel deprem tasarımı, TS 500 betonarme, BYY 2015/2019, otopark ve güncel mevzuat notları.",
    categories: depremCategories,
    tags: depremTags,
  },
  {
    id: "tbdy-2018-detay",
    title: "TBDY 2018 Detaylı Rehber",
    href: "/kategori/tbdy-2018-detay",
    description: "TBDY 2018'in bölüm bölüm açıklaması: deprem bölgesi, spektrum, süneklik ve detaylandırma.",
    categories: ["TBDY 2018 Rehberi"],
    tags: ["tbdy 2018", "deprem bölgesi", "spektrum", "davranış katsayısı", "süneklik düzeyi"],
  },
  {
    id: "geoteknik",
    title: "Geoteknik ve Zemin",
    href: "/kategori/geoteknik",
    description: "Zemin etüdü, temel çözümleri ve iyileştirme yöntemleri.",
    categories: ["Geoteknik Rehberi"],
    tags: ["zemin", "jet grout", "temel", "spt", "geoteknik"],
  },
  {
    id: "santiye",
    title: "Şantiye ve Uygulama",
    href: "/kategori/santiye",
    description: "Saha uygulamaları, kontrol listeleri ve uygulama kararları.",
    categories: ["Şantiye Notu", "Şantiye Uygulamaları"],
    tags: ["beton", "döküm", "kalıp", "donatı", "kontrol", "duvar", "şantiye"],
  },
  {
    id: "malzeme",
    title: "Malzeme Bilgisi",
    href: "/kategori/malzeme",
    description: "Yalıtım, beton, çelik ve yapı malzemesi karşılaştırmaları.",
    categories: ["Malzeme Veritabanı"],
    tags: ["eps", "xps", "yalıtım", "mantolama", "malzeme"],
  },
  {
    id: "surdurulebilirlik",
    title: "Sürdürülebilirlik ve Sertifikasyon",
    href: "/kategori/surdurulebilirlik",
    description: "Yeşil bina, LEED, BREEAM ve sürdürülebilir tasarım.",
    categories: ["Sektörel Haber"],
    tags: ["leed", "breeam", "yeşil bina", "sürdürülebilir"],
  },
];

const SECTION_BY_ID = new Map(SITE_SECTIONS.map((section) => [section.id, section] as const));
const SECTION_ID_BY_CATEGORY = new Map<string, SiteSectionId>(
  SITE_SECTIONS.flatMap((section) => section.categories.map((category) => [category, section.id] as const)),
);

export function getSiteSectionById(sectionId: SiteSectionId): SiteSection | undefined {
  return SECTION_BY_ID.get(sectionId);
}

export function getSiteSectionByCategory(category: string): SiteSection | undefined {
  const sectionId = SECTION_ID_BY_CATEGORY.get(category);
  return sectionId ? SECTION_BY_ID.get(sectionId) : undefined;
}

export function getSiteSectionForArticle(article: ArticleSectionLike): SiteSection | undefined {
  return SECTION_BY_ID.get(article.sectionId) ?? getSiteSectionByCategory(article.category);
}

export function getSiteSectionHrefForArticle(article: ArticleSectionLike): string {
  return getSiteSectionForArticle(article)?.href ?? "/konu-haritasi";
}

export function matchesSiteSection(article: ArticleSectionLike, sectionId: SiteSectionId): boolean {
  return article.sectionId === sectionId || SECTION_ID_BY_CATEGORY.get(article.category) === sectionId;
}



