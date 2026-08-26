import { DEPREM_PHASE4_DONATI_KOROZYON } from "./deprem-phase4-donati-korozyon";
import { DEPREM_PHASE4_MEVCUT_DAYANIM } from "./deprem-phase4-mevcut-dayanim";
import { DEPREM_PHASE4_SUNEK_GEVREK } from "./deprem-phase4-sunek-gevrek";
import { DEPREM_PHASE4_DOGRUSAL_SINIRLAR } from "./deprem-phase4-dogrusal-sinirlar";

export const DEPREM_PHASE4_BATCH_2_ARTICLES = [
  {
    ...DEPREM_PHASE4_DONATI_KOROZYON,
    title: "Mevcut Binada Donatı Tespiti, Sıyırma ve Korozyon İncelemesi",
  },
  {
    ...DEPREM_PHASE4_MEVCUT_DAYANIM,
    title: "Mevcut Malzeme Dayanımı ve Bilgi Düzeyi Katsayısı",
  },
  {
    ...DEPREM_PHASE4_SUNEK_GEVREK,
    title: "Mevcut Binada Sünek ve Gevrek Hasar Sınıflaması",
  },
  {
    ...DEPREM_PHASE4_DOGRUSAL_SINIRLAR,
    title: "TBDY 15.5 Doğrusal Değerlendirme Yönteminin Uygulama Sınırları",
  },
] as const;
