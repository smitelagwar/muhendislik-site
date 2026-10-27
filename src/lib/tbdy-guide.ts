/** TBDY 2018 hızlı erişim dizini. Madde etiketleri navigasyon içindir; teknik hüküm kaynağı resmi metindir. */
export const TBDY_OFFICIAL_PDF = "https://www.afad.gov.tr/kurumlar/afad.gov.tr/2309/files/TBDY_2018.pdf";
export const TBDY_OFFICIAL_PAGE = "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi";

export const TBDY_TOPICS = [
  {
    "id": "tehlike",
    "label": "Deprem tehlikesi",
    "description": "DD, Ss, S1, zemin, spektrum"
  },
  {
    "id": "siniflandirma",
    "label": "Bina ve sistem seçimi",
    "description": "BKS, DTS, BYS, R, D"
  },
  {
    "id": "duzensizlik",
    "label": "Düzensizlik ve diyafram",
    "description": "A1–A3, B1–B3, ek dışmerkezlik"
  },
  {
    "id": "analiz",
    "label": "Modelleme ve analiz",
    "description": "Kütle, rijitlik, modal, öteleme"
  },
  {
    "id": "betonarme",
    "label": "Betonarme detayları",
    "description": "Kolon, kiriş, perde, birleşim"
  },
  {
    "id": "mevcut",
    "label": "Mevcut bina",
    "description": "Bölüm 15 ve güçlendirme"
  },
  {
    "id": "ozel",
    "label": "Zemin ve özel sistemler",
    "description": "Bölüm 14, 16, 17"
  }
] as const;
export type TBDYTopicId = (typeof TBDY_TOPICS)[number]["id"] | "baglam";

export const TBDY_CHAPTERS = [
  {
    "number": 1,
    "title": "Genel hükümler",
    "detail": "Kapsam, esaslar ve tasarım gözetimi"
  },
  {
    "number": 2,
    "title": "Deprem yer hareketi",
    "detail": "DD düzeyleri, harita parametreler���q�^