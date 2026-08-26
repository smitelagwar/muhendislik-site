import { DEPREM_PHASE3_P_DELTA } from "./deprem-phase3-p-delta";
import { DEPREM_PHASE3_YONETMELIK_EVRIMI } from "./deprem-phase3-yonetmelik-evrimi";
import { DEPREM_PHASE3_MARMARA_1999 } from "./deprem-phase3-marmara-1999";
import { DEPREM_PHASE3_BETONARME_PERDE_TASARIMI } from "./deprem-phase3-betonarme-perde-tasarimi";

export const DEPREM_PHASE3_BATCH_13_ARTICLES = [
  {
    ...DEPREM_PHASE3_P_DELTA,
    title: "TBDY 2018 İkinci Mertebe Etkileri: θII ve Denklem 4.35–4.37",
  },
  {
    ...DEPREM_PHASE3_YONETMELIK_EVRIMI,
    title: "Türkiye Deprem Yönetmeliklerinin Evrimi: 1947'den TBDY 2018'e",
  },
  {
    ...DEPREM_PHASE3_MARMARA_1999,
    title: "17 Ağustos 1999 Marmara Depremi: Yapısal Hasarlardan Mühendislik Dersleri",
  },
  {
    ...DEPREM_PHASE3_BETONARME_PERDE_TASARIMI,
    title: "TBDY 2018 Betonarme Perde Tasarımı: Bölüm 7.6 Kontrol Akışı",
  },
] as const;
