import { DEPREM_PHASE3_KOLON_SARILMA } from "./deprem-phase3-kolon-sarilma";
import { DEPREM_PHASE3_KOLON_KAPASITE_KESME } from "./deprem-phase3-kolon-kapasite-kesme";
import { DEPREM_PHASE3_KIRIS_BOYUT_EKSEN } from "./deprem-phase3-kiris-boyut-eksen";
import { DEPREM_PHASE3_KIRIS_MESNET_DONATI } from "./deprem-phase3-kiris-mesnet-donati";

export const DEPREM_PHASE3_BATCH_5_ARTICLES = [
  DEPREM_PHASE3_KOLON_SARILMA,
  DEPREM_PHASE3_KOLON_KAPASITE_KESME,
  DEPREM_PHASE3_KIRIS_BOYUT_EKSEN,
  DEPREM_PHASE3_KIRIS_MESNET_DONATI,
] as const;
