import { DEPREM_PHASE4_RISKLI_YAPI } from "./deprem-phase4-riskli-yapi";
import { DEPREM_PHASE4_BILGI_DUZEYLERI } from "./deprem-phase4-bilgi-duzeyleri";
import { DEPREM_PHASE4_ROLOVE_HASAR } from "./deprem-phase4-rolove-hasar";
import { DEPREM_PHASE4_KAROT } from "./deprem-phase4-karot";

export const DEPREM_PHASE4_BATCH_1_ARTICLES = [
  {
    ...DEPREM_PHASE4_RISKLI_YAPI,
    title: "Riskli Yapı Tespiti ile TBDY Bölüm 15 Performans Değerlendirmesi",
  },
  {
    ...DEPREM_PHASE4_BILGI_DUZEYLERI,
    title: "TBDY Bölüm 15 Bilgi Düzeyleri: Sınırlı ve Kapsamlı",
  },
  {
    ...DEPREM_PHASE4_ROLOVE_HASAR,
    title: "Mevcut Binada Taşıyıcı Sistem Rölövesi ve Hasar Belgeleme",
  },
  {
    ...DEPREM_PHASE4_KAROT,
    title: "TBDY Bölüm 15 Karot Sayısı ve Mevcut Beton Dayanımı",
  },
] as const;
