import { DEPREM_PHASE3_R_D } from "./deprem-phase3-r-d";
import { DEPREM_PHASE3_BINA_ONEM } from "./deprem-phase3-bina-onem";
import { DEPREM_PHASE3_SUNEKLIK_SISTEM } from "./deprem-phase3-suneklik-sistem";
import { DEPREM_PHASE3_MOD_BIRLESIM } from "./deprem-phase3-mod-birlesim";

export const DEPREM_PHASE3_BATCH_11_ARTICLES = [
  {
    ...DEPREM_PHASE3_R_D,
    title: "TBDY 2018 Taşıyıcı Sistem Davranış Katsayısı R ve Dayanım Fazlalığı Katsayısı D",
  },
  {
    ...DEPREM_PHASE3_BINA_ONEM,
    title: "TBDY 2018 Bina Kullanım Sınıfı ve Bina Önem Katsayısı I",
  },
  {
    ...DEPREM_PHASE3_SUNEKLIK_SISTEM,
    title: "TBDY 2018 Süneklik Düzeyi: Yüksek, Sınırlı ve Karma Taşıyıcı Sistemler",
  },
  {
    ...DEPREM_PHASE3_MOD_BIRLESIM,
    title: "TBDY 2018 Mod Birleştirme: TKB/CQC ve KTKK/SRSS",
  },
] as const;
