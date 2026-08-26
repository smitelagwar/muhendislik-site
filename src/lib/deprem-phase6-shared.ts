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

export const OTOPARK_2018 = "https://www.resmigazete.gov.tr/eskiler/2018/02/20180222-7.htm";
export const OTOPARK_2021 = "https://www.resmigazete.gov.tr/eskiler/2021/03/20210325-12.htm";
export const OTOPARK_2025 = "https://www.resmigazete.gov.tr/eskiler/2025/12/20251227-6.htm";
export const OTOPARK_CSB_GUIDE = "https://webdosya.csb.gov.tr/db/meslekihizmetler/haberler/otopark-20220328101753.pdf";
export const BYKHY_2009 = "https://www.resmigazete.gov.tr/eskiler/2009/09/20090909-10.htm";
export const BYKHY_2026_GUIDE = "https://webdosya.csb.gov.tr/v2/meslekihizmetler/2026/05/Binalar-n-Yang-n-Korunmas-Hakk-nda-Y-netmelik-K-lavuzu-20260507112134.pdf";
export const SARJ_2022 = "https://www.resmigazete.gov.tr/eskiler/2022/04/20220402-2.htm";
export const SARJ_2026 = "https://www.resmigazete.gov.tr/eskiler/2026/03/20260323-4.htm";
export const TBDY_PDF = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
export const TBDY_PAGE = "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi";

export const ASANSOR_2016 = "https://www.resmigazete.gov.tr/eskiler/2016/06/20160629-21.htm";
export const ASANSOR_PERIYODIK_2018 = "https://www.resmigazete.gov.tr/eskiler/2018/05/20180504-1.htm";
export const ASANSOR_BAKIM_2019 = "https://www.resmigazete.gov.tr/eskiler/2019/04/20190406-1.htm";
export const ASANSOR_PERIYODIK_2025 = "https://www.resmigazete.gov.tr/eskiler/2025/08/20250805-1.htm";
export const ASANSOR_KONTROL_2025 = "https://www.sanliurfa.bel.tr/uploads/2025/20250505133528-84464-84507.pdf";

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

export function otoparkPhase6References(scope: string): NonNullable<ArticleData["references"]> {
  return [
    {
      label: `Resmî Gazete — 22 Şubat 2018 / 30340 Otopark Yönetmeliği, ${scope}`,
      href: OTOPARK_2018,
      note: "Temel Yönetmelik metnidir; sonraki değişikliklerle birlikte okunmalıdır.",
    },
    {
      label: "Resmî Gazete — 25 Mart 2021 / 31434 Otopark Yönetmeliği değişikliği",
      href: OTOPARK_2021,
      note: "Rampa ve sirkülasyon ayrıntıları ile elektrikli araç şarj altyapısı dâhil önemli değişiklikleri içerir.",
    },
    {
      label: "Resmî Gazete — 27 Aralık 2025 / 33120 Otopark Yönetmeliği değişikliği",
      href: OTOPARK_2025,
      note: "Madde 10 küçük parsel eşiğini 500 m²'ye, Ek-1 hastane hesabını 85 m²'ye günceller.",
    },
    {
      label: "ÇŞİDB — Otopark Yönetmeliği teknik sunumu",
      href: OTOPARK_CSB_GUIDE,
      note: "Yönetmelik hükümlerinin proje ve hesap mantığını açıklayan Bakanlık teknik dokümanıdır.",
    },
  ];
}

export function asansorPhase6References(scope: string): NonNullable<ArticleData["references"]> {
  return [
    {
      label: `Resmî Gazete — 29 Haziran 2016 / 29757 Asansör Yönetmeliği (2014/33/AB), ${scope}`,
      href: ASANSOR_2016,
      note: "Asansörlerin ve güvenlik aksamlarının temel sağlık-güvenlik gerekleri ile piyasaya arz çerçevesidir.",
    },
    {
      label: "Resmî Gazete — 6 Nisan 2019 / 30737 Asansör İşletme ve Bakım Yönetmeliği",
      href: ASANSOR_BAKIM_2019,
      note: "Tescil, işletme, ayda en az bir bakım, yetkili servis ve bina sorumlusu yükümlülüklerini düzenler.",
    },
    {
      label: "Resmî Gazete — 4 Mayıs 2018 / 30411 Asansör Periyodik Kontrol Yönetmeliği",
      href: ASANSOR_PERIYODIK_2018,
      note: "Yıllık periyodik kontrol, A tipi muayene kuruluşu ve bilgi etiketi sisteminin temel metnidir.",
    },
    {
      label: "Resmî Gazete — 5 Ağustos 2025 / 32977 Asansör Periyodik Kontrol Yönetmeliği değişikliği",
      href: ASANSOR_PERIYODIK_2025,
      note: "Periyodik kontrol mevzuatının güncel değişiklik zincirinin son halkasıdır.",
    },
    {
      label: "Resmî Gazete — 1 Temmuz 2026 / 33297 Planlı Alanlar İmar Yönetmeliği, Madde 34 değişikliği",
      href: IMAR_2026_JULY,
      note: "Asansör zorunluluğu, bodrum kat kapsamı ve güncel bina-kat ilişkisini içerir.",
    },
  ];
}
