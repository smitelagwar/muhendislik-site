import { DEPREM_PHASE3_DOGRUSAL_OLMAYAN } from "./deprem-phase3-dogrusal-olmayan";
import { DEPREM_PHASE3_GUCLU_KOLON } from "./deprem-phase3-guclu-kolon";
import { DEPREM_PHASE3_DUZENSIZLIKLER } from "./deprem-phase3-duzensizlikler";
import { DEPREM_PHASE3_SISMIK_IZOLASYON } from "./deprem-phase3-sismik-izolasyon";

export const DEPREM_PHASE3_BATCH_9_ARTICLES = [
  {
    ...DEPREM_PHASE3_DOGRUSAL_OLMAYAN,
    title: "TBDY 2018 Doğrusal Olmayan Analiz ve ŞGDT",
  },
  {
    ...DEPREM_PHASE3_GUCLU_KOLON,
    title: "TBDY 2018 Güçlü Kolon–Zayıf Kiriş Kontrolü",
  },
  {
    ...DEPREM_PHASE3_DUZENSIZLIKLER,
    title: "TBDY 2018 A1–A3 ve B1–B3 Düzensizlik Kontrolleri",
  },
  {
    ...DEPREM_PHASE3_SISMIK_IZOLASYON,
    title: "TBDY 2018 Deprem Yalıtımlı Binalar: Analiz ve Tasarım Kontrolleri",
  },
] as const;
