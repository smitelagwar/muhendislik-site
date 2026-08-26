import { DEPREM_PHASE4_ZEMIN_SONDAJ_PROGRAMI } from "./deprem-phase4-zemin-sondaj-programi";
import { DEPREM_PHASE4_ZEMIN_YAPI_ETKILESIMI } from "./deprem-phase4-zemin-yapi-etkilesimi";
import { DEPREM_PHASE4_ZEMIN_SIVILASMA } from "./deprem-phase4-zemin-sivilasma";

export const DEPREM_PHASE4_BATCH_7_ARTICLES = [
  {
    ...DEPREM_PHASE4_ZEMIN_SONDAJ_PROGRAMI,
    title: "Zemin Etüdünde Minimum Sondaj Sayısı ve Derinliği",
  },
  {
    ...DEPREM_PHASE4_ZEMIN_YAPI_ETKILESIMI,
    title: "TBDY Bölüm 16'da Zemin-Yapı Etkileşimi",
  },
  {
    ...DEPREM_PHASE4_ZEMIN_SIVILASMA,
    title: "Zemin Sıvılaşma Riski Değerlendirmesi",
  },
] as const;
