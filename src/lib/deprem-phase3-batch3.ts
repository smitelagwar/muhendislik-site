import { DEPREM_PHASE3_DUSEY_DEPREM } from "./deprem-phase3-dusey-deprem";
import { DEPREM_PHASE3_DEPREM_DERZI } from "./deprem-phase3-deprem-derzi";
import { DEPREM_PHASE3_BOLUM17 } from "./deprem-phase3-bolum17";
import { DEPREM_PHASE3_TEBLIG_TASLAGI } from "./deprem-phase3-teblig-taslagi";

export const DEPREM_PHASE3_BATCH_3_ARTICLES = [
  DEPREM_PHASE3_DUSEY_DEPREM,
  DEPREM_PHASE3_DEPREM_DERZI,
  DEPREM_PHASE3_BOLUM17,
  DEPREM_PHASE3_TEBLIG_TASLAGI,
] as const;
