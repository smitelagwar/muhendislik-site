import { DEPREM_PHASE3_OZEL_DEPREM_ETRIYESI } from "./deprem-phase3-ozel-deprem-etriyesi";
import { DEPREM_PHASE3_KENETLENME_EKLER } from "./deprem-phase3-kenetlenme-ekler";
import { DEPREM_PHASE3_KOLON_EKSENEL_YUK } from "./deprem-phase3-kolon-eksenel-yuk";
import { DEPREM_PHASE3_KOLON_BOYUNA_DONATI } from "./deprem-phase3-kolon-boyuna-donati";

export const DEPREM_PHASE3_BATCH_4_ARTICLES = [
  DEPREM_PHASE3_OZEL_DEPREM_ETRIYESI,
  DEPREM_PHASE3_KENETLENME_EKLER,
  DEPREM_PHASE3_KOLON_EKSENEL_YUK,
  DEPREM_PHASE3_KOLON_BOYUNA_DONATI,
] as const;
