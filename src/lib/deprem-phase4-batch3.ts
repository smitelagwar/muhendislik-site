import { DEPREM_PHASE4_KOLON_GUCLENDIRME } from "./deprem-phase4-kolon-guclendirme";
import { DEPREM_PHASE4_PERDE_GUCLENDIRME } from "./deprem-phase4-perde-guclendirme";
import { DEPREM_PHASE4_TEMEL_YUK_AKTARIMI } from "./deprem-phase4-temel-yuk-aktarimi";

export const DEPREM_PHASE4_BATCH_3_ARTICLES = [
  {
    ...DEPREM_PHASE4_KOLON_GUCLENDIRME,
    title: "Kolon Güçlendirme: LP/FRP, Betonarme Sargı ve Kesit Büyütme",
  },
  {
    ...DEPREM_PHASE4_PERDE_GUCLENDIRME,
    title: "Mevcut Binaya Betonarme Perde Eklenmesi",
  },
  {
    ...DEPREM_PHASE4_TEMEL_YUK_AKTARIMI,
    title: "Güçlendirmede Temel Sistemi ve Yük Aktarımı",
  },
] as const;
