import { DEPREM_PHASE4_SU_YALITIMI } from "./deprem-phase4-su-yalitimi";
import { DEPREM_PHASE4_YAGMUR_SUYU } from "./deprem-phase4-yagmur-suyu";

export const DEPREM_PHASE4_BATCH_8_ARTICLES = [
  {
    ...DEPREM_PHASE4_SU_YALITIMI,
    title: "Temel ve Bodrum Perdelerinde Su Yalıtımı",
  },
  {
    ...DEPREM_PHASE4_YAGMUR_SUYU,
    title: "Yağmur Suyu Drenajı, Hasadı ve Sızdırma Kararı",
  },
] as const;
