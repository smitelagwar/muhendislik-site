/**
 * TS 500 Betonarme İçerik Sistemi
 *
 * Bu modül, sitedeki 21 TS 500 makalesini zengin içerikle yönetir.
 * Her makale ayrı bir dosyada tanımlanır ve ArticleData formatına buildTs500Article() ile dönüştürülür.
 *
 * Makale ekleme adımları:
 *   1. src/lib/ts500-content/ts500-<konu>.ts dosyası oluştur
 *   2. buildTs500Article() ile ArticleData üret ve export et
 *   3. Bu dosyaya import ve TS500_ARTICLES dizisine ekle
 *   4. data.json'daki aynı slug'ı varsa sil (çakışma önleme)
 *   5. deprem-topic-articles.ts'teki ts500 maddesini kaldır
 */

import type { ArticleData } from "../articles-data";
import { applyTs500VisualEnhancement } from "../ts500-visual-rollout";

import { ts500BetonSinifi } from "./ts500-beton-sinifi";
import { ts500BetonOrtusu } from "./ts500-beton-ortusu";
import { ts500KarakteristikDayanim } from "./ts500-karakteristik-dayanim";
import { ts500DonatiOrani } from "./ts500-donati-orani";
import { ts500Kenetlenme } from "./ts500-kenetlenme";
import { ts500EgilmeDonatisi } from "./ts500-egilme-donatisi";
import { ts500TablaliKiris } from "./ts500-tablali-kiris";
import { ts500SurekliKiris } from "./ts500-surekli-kiris";
import { ts500KonsolKiris } from "./ts500-konsol-kiris";
import { ts500KesmeEtriyer } from "./ts500-kesme-etriyer";
import { ts500Burulma } from "./ts500-burulma";
import { ts500SehimKontrol } from "./ts500-sehim-kontrolu";
import { ts500CatlakGenisligi } from "./ts500-catlak-genisligi";
import { ts500KolonPm } from "./ts500-kolon-pm";
import { ts500NarinKolon } from "./ts500-narin-kolon";
import { ts500Dosleme } from "./ts500-dosleme";
import { ts500Zimbalama } from "./ts500-zimbalama";
import { ts500ZeminKirisi } from "./ts500-zemin-kirisi";
import { ts500TekilTemel } from "./ts500-tekil-temel";
import { ts500RadyeTemel } from "./ts500-radye-temel";
import { ts500BetonarmeMerdiven } from "./ts500-betonarme-merdiven";

const TS500_BASE_ARTICLES: ArticleData[] = [
  ts500BetonSinifi,
  ts500BetonOrtusu,
  ts500KarakteristikDayanim,
  ts500DonatiOrani,
  ts500Kenetlenme,
  ts500EgilmeDonatisi,
  ts500TablaliKiris,
  ts500SurekliKiris,
  ts500KonsolKiris,
  ts500KesmeEtriyer,
  ts500Burulma,
  ts500SehimKontrol,
  ts500CatlakGenisligi,
  ts500KolonPm,
  ts500NarinKolon,
  ts500Dosleme,
  ts500Zimbalama,
  ts500ZeminKirisi,
  ts500TekilTemel,
  ts500RadyeTemel,
  ts500BetonarmeMerdiven,
];

export const TS500_ARTICLES: ArticleData[] = TS500_BASE_ARTICLES.map(applyTs500VisualEnhancement);
export const TS500_SLUGS = new Set(TS500_ARTICLES.map((a) => a.slug));
