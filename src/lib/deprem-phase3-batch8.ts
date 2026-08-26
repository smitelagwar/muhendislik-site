import { DEPREM_PHASE3_PERDE_BOSLUK_MODELLEME } from "./deprem-phase3-perde-bosluk-modelleme";
import { DEPREM_PHASE3_DIYAFRAM_AKTARIM } from "./deprem-phase3-diyafram-aktarim";
import { DEPREM_PHASE3_BETONARME_ANALIZ } from "./deprem-phase3-betonarme-analiz";
import { DEPREM_PHASE3_KISA_KOLON } from "./deprem-phase3-kisa-kolon";

export const DEPREM_PHASE3_BATCH_8_ARTICLES = [
  DEPREM_PHASE3_PERDE_BOSLUK_MODELLEME,
  DEPREM_PHASE3_DIYAFRAM_AKTARIM,
  DEPREM_PHASE3_BETONARME_ANALIZ,
  DEPREM_PHASE3_KISA_KOLON,
] as const;
