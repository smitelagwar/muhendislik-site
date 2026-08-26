import { DEPREM_PHASE4_YAPI_BETON_TANIMLAMA } from "./deprem-phase4-yapi-beton-tanimlama";
import { DEPREM_PHASE4_YAPI_EBIS_NUMUNE } from "./deprem-phase4-yapi-ebis-numune";
import { DEPREM_PHASE4_YAPI_DUSUK_BETON_KAROT } from "./deprem-phase4-yapi-dusuk-beton-karot";

export const DEPREM_PHASE4_BATCH_10_ARTICLES = [
  DEPREM_PHASE4_YAPI_BETON_TANIMLAMA,
  DEPREM_PHASE4_YAPI_EBIS_NUMUNE,
  DEPREM_PHASE4_YAPI_DUSUK_BETON_KAROT,
] as const;
