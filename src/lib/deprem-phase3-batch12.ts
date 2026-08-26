import { DEPREM_PHASE3_GORELI_KAT_OTELENMESI } from "./deprem-phase3-goreli-kat-otelenmesi";
import { DEPREM_PHASE3_DISMERKEZLIK } from "./deprem-phase3-dismerkezlik";
import { DEPREM_PHASE3_BODRUMLU_BINALAR } from "./deprem-phase3-bodrumlu-binalar";
import { DEPREM_PHASE3_CATI_KUTLESI } from "./deprem-phase3-cati-kutlesi";

export const DEPREM_PHASE3_BATCH_12_ARTICLES = [
  {
    ...DEPREM_PHASE3_GORELI_KAT_OTELENMESI,
    title: "TBDY 2018 Göreli Kat Ötelenmesi: Denklem 4.32–4.34 ve Sınırlar",
  },
  {
    ...DEPREM_PHASE3_DISMERKEZLIK,
    title: "TBDY 2018 Ek Dışmerkezlik: ±%5 Kuralı ve Burulma Etkisi",
  },
  {
    ...DEPREM_PHASE3_BODRUMLU_BINALAR,
    title: "TBDY 2018 Bodrumlu Binalar: Bina Tabanı, Ortak Model ve İki Yükleme",
  },
  {
    ...DEPREM_PHASE3_CATI_KUTLESI,
    title: "TBDY 2018 Çatı Kütlesi: Kar Yükünün %30'u ve Hareketli Yük Katılımı",
  },
] as const;
