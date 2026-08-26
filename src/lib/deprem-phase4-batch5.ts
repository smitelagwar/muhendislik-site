import { DEPREM_PHASE4_ZEMIN_ETUT_KATEGORILERI } from "./deprem-phase4-zemin-etut-kategorileri";
import { DEPREM_PHASE4_ZEMIN_MODEL_AKTARIMI } from "./deprem-phase4-zemin-model-aktarimi";
import { DEPREM_PHASE4_TEMEL_TASIMA_OTURMA } from "./deprem-phase4-temel-tasima-oturma";
import { DEPREM_PHASE4_TEMEL_KAYMA_DEVRILME } from "./deprem-phase4-temel-kayma-devrilme";

export const DEPREM_PHASE4_BATCH_5_ARTICLES = [
  {
    ...DEPREM_PHASE4_ZEMIN_ETUT_KATEGORILERI,
    title: "Zemin ve Temel Etüdü Rapor Kategorileri",
  },
  {
    ...DEPREM_PHASE4_ZEMIN_MODEL_AKTARIMI,
    title: "Zemin Raporundaki Verilerin Taşıyıcı Sistem Modeline Aktarılması",
  },
  {
    ...DEPREM_PHASE4_TEMEL_TASIMA_OTURMA,
    title: "Yüzeysel Temellerde Taşıma Gücü ve Oturma Kontrolü",
  },
  {
    ...DEPREM_PHASE4_TEMEL_KAYMA_DEVRILME,
    title: "Temellerde Kayma, Moment ve Taban Teması Kontrolü",
  },
] as const;
