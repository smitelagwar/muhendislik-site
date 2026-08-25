import { DEPREM_PHASE3_YER_HAREKETI_DUZEYLERI } from "./deprem-phase3-yer-hareketi-duzeyleri";
import { DEPREM_PHASE3_SS_S1 } from "./deprem-phase3-ss-s1";
import { DEPREM_PHASE3_YEREL_ZEMIN_SPEKTRUM } from "./deprem-phase3-yerel-zemin-spektrum";
import { DEPREM_PHASE3_TASARIM_SPEKTRUMU } from "./deprem-phase3-tasarim-spektrumu";

export const DEPREM_PHASE3_BATCH_10_ARTICLES = [
  {
    ...DEPREM_PHASE3_YER_HAREKETI_DUZEYLERI,
    title: "TBDY 2018 Deprem Yer Hareketi Düzeyleri: DD-1, DD-2, DD-3 ve DD-4",
  },
  {
    ...DEPREM_PHASE3_SS_S1,
    title: "AFAD Türkiye Deprem Tehlike Haritasından Ss ve S1 Okuma",
  },
  {
    ...DEPREM_PHASE3_YEREL_ZEMIN_SPEKTRUM,
    title: "TBDY 2018 Yerel Zemin Etki Katsayıları: FS ve F1",
  },
  {
    ...DEPREM_PHASE3_TASARIM_SPEKTRUMU,
    title: "TBDY 2018 Yatay Elastik Tasarım Spektrumu",
  },
] as const;
