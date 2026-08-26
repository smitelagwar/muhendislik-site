import type { ArticleData } from "./articles-data";

export const PHASE5_UPDATED_AT = "26 Ağustos 2026";
export const FIRE_REGULATION = "https://www.mevzuat.gov.tr/mevzuat?MevzuatNo=200712937&MevzuatTur=21&MevzuatTertip=5";
export const FIRE_GUIDE_PAGE = "https://meslekihizmetler.csb.gov.tr/haberler/binalarin-yangindan-korunmasi-hakkinda-yonetmelik-kilavuzu-yayimlandi-289797";
export const FIRE_GUIDE_PDF = "https://webdosya.csb.gov.tr/v2/meslekihizmetler/2026/05/Binalar-n-Yang-n-Korunmas-Hakk-nda-Y-netmelik-K-lavuzu-20260507112134.pdf";
export const FIRE_2025_AMENDMENT = "https://www.resmigazete.gov.tr/eskiler/2025/07/20250701-1.pdf";

export function phase5Lines(...parts: string[]) {
  return parts.join("\n");
}

export interface DepremPhase5Override {
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

export function firePhase5References(scope: string): NonNullable<ArticleData["references"]> {
  return [
    {
      label: `Mevzuat Bilgi Sistemi — Binaların Yangından Korunması Hakkında Yönetmelik, ${scope}`,
      href: FIRE_REGULATION,
      note: "Bağlayıcı hüküm ve güncel metin proje tarihinde Mevzuat Bilgi Sistemi üzerinden doğrulanmalıdır.",
    },
    {
      label: "ÇŞİDB — Binaların Yangından Korunması Hakkında Yönetmelik Kılavuzu",
      href: FIRE_GUIDE_PDF,
      note: "Bakanlık uygulama kılavuzu; rehber niteliğindedir. Kılavuz ile yürürlükteki mevzuat çelişirse mevzuat geçerlidir.",
    },
    {
      label: "ÇŞİDB — Yangın Yönetmeliği Kılavuzu duyurusu",
      href: FIRE_GUIDE_PAGE,
      note: "Kılavuzun Bakanlık tarafından yayımlandığını ve uygulama amacıyla hazırlandığını gösteren resmî erişim sayfası.",
    },
    {
      label: "Resmî Gazete — 1 Temmuz 2025 tarihli BYKHY değişikliği",
      href: FIRE_2025_AMENDMENT,
      note: "Yönetmeliğin güncel değişiklik zincirinin proje tarihinde ayrıca kontrol edilmesi için resmî kaynak.",
    },
  ];
}
