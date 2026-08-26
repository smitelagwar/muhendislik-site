import { DEPREM_PHASE4_RADYE_ZEMIN_YAYI } from "./deprem-phase4-radye-zemin-yayi";
import { DEPREM_PHASE4_BODRUM_ZEMIN_BASINCI } from "./deprem-phase4-bodrum-zemin-basinci";

export const DEPREM_PHASE4_BATCH_6_ARTICLES = [
  {
    ...DEPREM_PHASE4_RADYE_ZEMIN_YAYI,
    title: "Radye Temellerde Zemin Yayı ve Yatak Katsayısı Seçimi",
  },
  {
    ...DEPREM_PHASE4_BODRUM_ZEMIN_BASINCI,
    title: "Bodrum Perdelerinde Statik ve Dinamik Zemin Basınçları",
  },
] as const;
