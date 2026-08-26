import type { ArticleData } from "./articles-data";

export const TBDY_PDF = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
export const TBDY_PAGE = "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi";
export const KDB_PAGE = "https://kdb.gov.tr/";
export const RISKLI_YAPI_YONETMELIK = "https://webdosya.csb.gov.tr/db/altyapi/icerikler/yonetmel-k---7.5.16849-20240604152834.pdf";
export const PHASE4_UPDATED_AT = "26 Ağustos 2026";

export function phase4Lines(...parts: string[]) {
  return parts.join("\n");
}

export interface DepremPhase4Override {
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

export function tbdyPhase4References(scope: string): NonNullable<ArticleData["references"]> {
  return [
    {
      label: `AFAD — Türkiye Bina Deprem Yönetmeliği 2018, ${scope}`,
      href: TBDY_PDF,
      note: "Mevcut bina değerlendirmesine ilişkin bağlayıcı teknik hükümler AFAD'ın yayımladığı resmî yönetmelik metninden doğrulanmıştır.",
    },
    {
      label: "AFAD — Türkiye Bina Deprem Yönetmeliği resmî sayfası",
      href: TBDY_PAGE,
      note: "TBDY 2018, 18 Mart 2018 tarihli ve 30364 mükerrer sayılı Resmî Gazete'de yayımlanmış ve 1 Ocak 2019'da yürürlüğe girmiştir.",
    },
  ];
}
