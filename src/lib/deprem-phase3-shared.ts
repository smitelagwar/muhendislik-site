import type { ArticleData } from "./articles-data";

export const TBDY_PDF = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
export const TBDY_PAGE = "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi";
export const PHASE3_UPDATED_AT = "25 Ağustos 2026";

export function phase3Lines(...parts: string[]) {
  return parts.join("\n");
}

export interface DepremPhase3Override {
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
  readTime: string;
  sections: ArticleData["sections"];
  references: NonNullable<ArticleData["references"]>;
  keywords: string[];
  tags: string[];
}

export function tbdyPhase3References(scope: string): NonNullable<ArticleData["references"]> {
  return [
    {
      label: `AFAD — Türkiye Bina Deprem Yönetmeliği 2018, ${scope}`,
      href: TBDY_PDF,
      note: "Bağlayıcı teknik hükümler ve tablo/denklem numaraları AFAD'ın yayımladığı resmî metinden doğrulanmıştır.",
    },
    {
      label: "AFAD — Türkiye Bina Deprem Yönetmeliği resmî sayfası",
      href: TBDY_PAGE,
      note: "Yönetmelik 18 Mart 2018 tarihli ve 30364 mükerrer sayılı Resmî Gazete'de yayımlanmış, 1 Ocak 2019'da yürürlüğe girmiştir.",
    },
  ];
}
