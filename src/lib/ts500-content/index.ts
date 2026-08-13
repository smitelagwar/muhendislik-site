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

// Aşama 2: Beton ve Malzeme (MD Bölüm 01)
import { ts500BetonSinifi } from "./ts500-beton-sinifi";
import { ts500BetonOrtusu } from "./ts500-beton-ortusu";
import { ts500KarakteristikDayanim } from "./ts500-karakteristik-dayanim";

// Aşama 3: Donatı Oranları ve Kenetlenme (MD Bölüm 02)
import { ts500DonatiOrani } from "./ts500-donati-orani";
import { ts500Kenetlenme } from "./ts500-kenetlenme";


// Aşama 4: Eğilme Hesabı (MD Bölüm 03)
import { ts500EgilmeDonatisi } from "./ts500-egilme-donatisi";
import { ts500TablaliKiris } from "./ts500-tablali-kiris";


// Aşama 5: Sürekli Kiriş ve Konsol (MD Bölüm 04)
import { ts500SurekliKiris } from "./ts500-surekli-kiris";
import { ts500KonsolKiris } from "./ts500-konsol-kiris";


// Aşama 6: Kesme ve Burulma (MD Bölüm 05)
import { ts500KesmeEtriyer } from "./ts500-kesme-etriyer";
import { ts500Burulma } from "./ts500-burulma";


// Aşama 7: Kullanılabilirlik (MD Bölüm 06)
import { ts500SehimKontrol } from "./ts500-sehim-kontrolu";
import { ts500CatlakGenisligi } from "./ts500-catlak-genisligi";


// Aşama 8: Kolon Tasarımı (MD Bölüm 07)
import { ts500KolonPm } from "./ts500-kolon-pm";
import { ts500NarinKolon } from "./ts500-narin-kolon";


// Aşama 9: Döşeme ve Zımbalama (MD Bölüm 08)
import { ts500Dosleme } from "./ts500-dosleme";
import { ts500Zimbalama } from "./ts500-zimbalama";


// Aşama 10: Temel ve Bodrum (MD Bölüm 09)
import { ts500ZeminKirisi } from "./ts500-zemin-kirisi";
import { ts500TekilTemel } from "./ts500-tekil-temel";
import { ts500RadyeTemel } from "./ts500-radye-temel";


// Aşama 11: Merdiven (MD Bölüm 10)
import { ts500BetonarmeMerdiven } from "./ts500-betonarme-merdiven";


/**
 * Tüm TS 500 makaleleri.
 * Bu dizideki slug'lar data.json'da veya deprem-topic-articles.ts'te
 * çakışmamalıdır — articles-data.ts bunu kontrol eder.
 */
export const TS500_ARTICLES: ArticleData[] = [
  // Aşama 2 — Beton ve Malzeme
  ts500BetonSinifi,
  ts500BetonOrtusu,
  ts500KarakteristikDayanim,

  // Aşama 3 — Donatı Oranları ve Kenetlenme
  ts500DonatiOrani,
  ts500Kenetlenme,

  // Aşama 4 — Eğilme Hesabı
  ts500EgilmeDonatisi,
  ts500TablaliKiris,

  // Aşama 5 — Sürekli Kiriş ve Konsol
  ts500SurekliKiris,
  ts500KonsolKiris,

  // Aşama 6 — Kesme ve Burulma
  ts500KesmeEtriyer,
  ts500Burulma,

  // Aşama 7 — Kullanılabilirlik
  ts500SehimKontrol,
  ts500CatlakGenisligi,

  // Aşama 8 — Kolon Tasarımı
  ts500KolonPm,
  ts500NarinKolon,

  // Aşama 9 — Döşeme ve Zımbalama
  ts500Dosleme,
  ts500Zimbalama,

  // Aşama 10 — Temel ve Bodrum
  ts500ZeminKirisi,
  ts500TekilTemel,
  ts500RadyeTemel,

  // Aşama 11 — Merdiven
  ts500BetonarmeMerdiven,









];

/**
 * TS500 makale slug'larının seti — çakışma kontrolü için.
 */
export const TS500_SLUGS = new Set(TS500_ARTICLES.map((a) => a.slug));
