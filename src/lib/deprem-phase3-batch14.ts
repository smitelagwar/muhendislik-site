import { DEPREM_PHASE3_DUZENSIZ_DINAMIK } from "./deprem-phase3-duzensiz-dinamik";
import { DEPREM_PHASE3_DEPREM_RUZGAR } from "./deprem-phase3-deprem-ruzgar";
import { DEPREM_PHASE3_DASK } from "./deprem-phase3-dask";
import { DEPREM_PHASE3_YATAY_YUK_SISTEMLERI } from "./deprem-phase3-yatay-yuk-sistemleri";

export const DEPREM_PHASE3_BATCH_14_ARTICLES = [
  {
    ...DEPREM_PHASE3_DUZENSIZ_DINAMIK,
    title: "TBDY 2018 Düzensiz Binalarda Hesap Yöntemi Seçimi",
  },
  {
    ...DEPREM_PHASE3_DEPREM_RUZGAR,
    title: "TBDY 2018 Deprem ve Rüzgâr Etkileri: Birleşim mi, Zarf mı?",
  },
  {
    ...DEPREM_PHASE3_DASK,
    title: "DASK Poliçesi ile Yapısal Deprem Güvenliği Aynı Şey Değildir",
  },
  {
    ...DEPREM_PHASE3_YATAY_YUK_SISTEMLERI,
    title: "TBDY 2018 Yatay Yük Taşıma Sistemleri: Çerçeve, Perde ve Çekirdek",
  },
] as const;
