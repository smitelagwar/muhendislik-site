import { DEPREM_PHASE4_MEVCUT_BINA_DEPREM_GUVENLIGI } from "./deprem-phase4-mevcut-bina-deprem-guvenligi";
import { DEPREM_PHASE4_HASAR_TESPITI } from "./deprem-phase4-hasar-tespiti";

export const DEPREM_PHASE4_BATCH_4_ARTICLES = [
  {
    ...DEPREM_PHASE4_MEVCUT_BINA_DEPREM_GUVENLIGI,
    title: "Mevcut Binaların Deprem Güvenliği Nasıl Değerlendirilir?",
  },
  {
    ...DEPREM_PHASE4_HASAR_TESPITI,
    title: "Deprem Sonrası Bina Hasar Tespiti: Resmî Sınıflandırma ve Etiket Ayrımı",
  },
] as const;
