import { DEPREM_PHASE3_PERDE_GEOMETRI } from "./deprem-phase3-perde-geometri";
import { DEPREM_PHASE3_PERDE_KRITIK_YUKSEKLIK } from "./deprem-phase3-perde-kritik-yukseklik";
import { DEPREM_PHASE3_PERDE_DONATI } from "./deprem-phase3-perde-donati";
import { DEPREM_PHASE3_PERDE_ZARF } from "./deprem-phase3-perde-zarf";

export const DEPREM_PHASE3_BATCH_7_ARTICLES = [
  DEPREM_PHASE3_PERDE_GEOMETRI,
  DEPREM_PHASE3_PERDE_KRITIK_YUKSEKLIK,
  DEPREM_PHASE3_PERDE_DONATI,
  DEPREM_PHASE3_PERDE_ZARF,
] as const;
