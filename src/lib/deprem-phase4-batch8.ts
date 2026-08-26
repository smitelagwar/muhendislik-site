import { DEPREM_PHASE4_SU_YALITIMI } from "./deprem-phase4-su-yalitimi";
import { DEPREM_PHASE4_YAGMUR_SUYU } from "./deprem-phase4-yagmur-suyu";

const SU_YALITIMI_SECTIONS = DEPREM_PHASE4_SU_YALITIMI.sections.map((section) =>
  section.id === "drenaj-ve-yeralti-suyu"
    ? {
        ...section,
        content: section.content.replace(
          "Madde **13** çevresel drenajı",
          "Yönetmeliğin **Madde 13** hükmü çevresel drenajı",
        ),
      }
    : section,
);

export const DEPREM_PHASE4_BATCH_8_ARTICLES = [
  {
    ...DEPREM_PHASE4_SU_YALITIMI,
    title: "Temel ve Bodrum Perdelerinde Su Yalıtımı",
    sections: SU_YALITIMI_SECTIONS,
  },
  {
    ...DEPREM_PHASE4_YAGMUR_SUYU,
    title: "Yağmur Suyu Drenajı, Hasadı ve Sızdırma Kararı",
  },
] as const;
