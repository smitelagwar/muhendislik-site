import { DEPREM_PHASE3_KIRIS_SARILMA } from "./deprem-phase3-kiris-sarilma";
import { DEPREM_PHASE3_KIRIS_KAPASITE_KESME } from "./deprem-phase3-kiris-kapasite-kesme";
import { DEPREM_PHASE3_KUSATILMAMIS_BIRLESIM } from "./deprem-phase3-kusatilmamis-birlesim";
import { DEPREM_PHASE3_BIRLESIM_KESME } from "./deprem-phase3-birlesim-kesme";

export const DEPREM_PHASE3_BATCH_6_ARTICLES = [
  DEPREM_PHASE3_KIRIS_SARILMA,
  DEPREM_PHASE3_KIRIS_KAPASITE_KESME,
  DEPREM_PHASE3_KUSATILMAMIS_BIRLESIM,
  DEPREM_PHASE3_BIRLESIM_KESME,
] as const;
