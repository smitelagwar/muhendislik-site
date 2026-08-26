import type { ArticleData } from "./articles-data";

export const PHASE6_UPDATED_AT = "26 Ağustos 2026";
export const IMAR_BASE = "https://webdosya.csb.gov.tr/db/tabiat/icerikler/planl-_alanlar_-mar-20191227075228.pdf";
export const IMAR_2023_HEIGHT = "https://www.resmigazete.gov.tr/eskiler/2023/08/20230812-2.htm";
export const IMAR_2026_JAN = "https://www.resmigazete.gov.tr/eskiler/2026/01/20260114-1.htm";
export const IMAR_2026_JULY = "https://www.resmigazete.gov.tr/eskiler/2026/07/20260701-7.htm";
export const IMAR_2026_ANNOUNCEMENT = "https://meslekihizmetler.csb.gov.tr/haberler/planli-alanlar-imar-yonetmeligi-nde-degisiklik-yapildi-305960";
export const IMAR_KANUNU = "https://webdosya.csb.gov.tr/db/kirklareli/icerikler/1.5.3194-20190115143403-20190411123643.pdf";
export const IMAR_RUHSAT_SURECLERI = "https://webdosya.csb.gov.tr/db/meslekihizmetler/haberler/yapi-ruhsati-yapi-kullanma--z-n-belges--surecler--20220328101647.pdf";
export const MEKANSAL_PLANLAMA_PAGE = "https://mpgm.csb.gov.tr/";
export const MEKANSAL_PLANLAR_2026 = "https://www.resmigazete.gov.tr/eskiler/2026/01/20260122-2.htm";

export function phase6Lines(...parts: string[]) {
  return parts.join("\n");
}

export interface DepremPhase6Override {
  slug: string;
  title?: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt: string;
  readTime: string;
  sections: ArticleData["sections"];
  relatedSlugs?: string[];
  references: NonNullable<ArticleData["references"]>;
  keywords: string[];
  tags: string[];
}

export function imarPhase6References(scope: string): NonNullable<ArticleData["references"]> {
  return [
    {
      label: `ÇŞİDB — Planlı Alanlar İmar Yönetmeliği temel metni, ${scope}`,
      href: IMAR_BASE,
      note: "Temel metin tarihsel derlemedir; proje tarihinde yürürlükteki değişiklik zinciri ayrıca kontrol edilmelidir.",
    },
    {
      label: "Resmî Gazete — 14 Ocak 2026 / 33137 Planlı Alanlar İmar Yönetmeliği değişikliği",
      href: IMAR_2026_JAN,
      note: "Asma kat tanımı, yapı aplikasyonu, otopark ve bahçe mesafelerine ilişkin 2026 değişikliklerini içerir.",
    },
    {
      label: "Resmî Gazete — 1 Temmuz 2026 / 33297 Planlı Alanlar İmar Yönetmeliği değişikliği",
      href: IMAR_2026_JULY,
      note: "Emsal, TAKS, asansör, yeniden ruhsatlandırma ve mevcut yapılardaki tadilat hükümleri dâhil güncel değişiklik zincirinin son halkalarından biridir.",
    },
    {
      label: "ÇŞİDB — 1 Temmuz 2026 Planlı Alanlar İmar Yönetmeliği değişikliği duyurusu",
      href: IMAR_2026_ANNOUNCEMENT,
      note: "Bakanlığın değişiklik kapsamını ve yürürlük bilgisini özetleyen resmî duyurusudur.",
    },
  ];
}
