/**
 * TS 500 — Karakteristik ve Tasarım Dayanımları ile Malzeme Katsayıları
 *
 * Kaynak MD: TS500_Bolum_01_Beton_Malzeme_Dayanimlari_Durabilite.md (Bölüm 12–20)
 *
 * UYARI: Kesin malzeme katsayıları ve hesap bağıntıları için TS 500 ve
 * TBDY 2018'in yürürlükteki metinleri resmi kaynaktan doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-karakteristik-tasarim-dayanimlari",
  title: "Karakteristik ve Tasarım Dayanımları ile Malzeme Katsayıları",
  description:
    "TS 500 taşıma gücü yaklaşımında fck, fcd, fyk ve fyd kavramları; malzeme güvenlik katsayılarının anlamı ve kesit hesabında doğru değerlerin kullanımı.",
  image: "/covers/ts500/beton-sinifi.png",
  readTime: "8 dk",
  keywords: [
    "fck",
    "fcd",
    "fyk",
    "fyd",
    "karakteristik dayanım",
    "tasarım dayanımı",
    "malzeme güvenlik katsayısı",
    "γmc",
    "γms",
    "ortalama dayanım",
    "beton çekme dayanımı",
  ],
  sections: [
    {
      id: "uc-seviye",
      title: "Ortalama, Karakteristik ve Tasarım Dayanımı",
      content: `Mühendislik hesabında malzeme dayanımı deterministik değildir — aynı sınıftaki betonun deney sonuçları bile değişkenlik gösterir. Bu nedenle üç farklı dayanım seviyesi tanımlanır:

## Ortalama Dayanım

Bir numune grubunun aritmetik ortalamasıdır. Sembol olarak genellikle **fcm** kullanılır.

## Karakteristik Dayanım (fck)

Üretimde ortaya çıkan doğal saçılmayı ve istatistiksel değişkenliği dikkate alan güvenilir bir alt sınır değeridir. Karakteristik değer, tipik olarak belirli bir aşım olasılığıyla (örneğin %5 red olasılığıyla) tanımlanır.

**fck, ortalama dayanımdan küçüktür.**

## Tasarım Dayanımı (fcd)

Kesit hesabında doğrudan kullanılan, güvenlik katsayısıyla azaltılmış değerdir.

**Kritik zincir:**

\`\`\`
Deney sonucu → Ortalama (fcm) → Karakteristik (fck) → Tasarım (fcd)
\`\`\`

Bu üç değer birbirinden farklıdır ve her birinin kullanıldığı bağlam ayrıdır.

> [!WARNING]
> Hesap raporunda kullanılan değerin ortalama mı, karakteristik mi, yoksa tasarım dayanımı mı olduğu açıkça belirtilmelidir. "Beton C30, fck = 30 MPa" yazmak yeterli değildir — kullanılan değer türü ve ilgili formüldeki katsayılar da gösterilmelidir.`,
      subsections: [],
    },
    {
      id: "guvensizlik-katsayilari",
      title: "Malzeme Güvenlik Katsayıları: Neden Var?",
      content: `Malzeme güvenlik katsayısı (γm) yalnızca "emniyet payı" olarak basitleştirilmemelidir. Şu belirsizlikleri kapsar:

- Malzeme dayanımındaki istatistiksel saçılma
- Numunenin gerçek yapıyı tam temsil etmemesi
- Şantiye koşulları ile laboratuvar koşulları arasındaki fark
- Geometrik toleranslar
- Hesap modelinin idealizasyonu
- Uzun dönem etkileri
- Üretim ve uygulama belirsizlikleri

Taşıma gücü yaklaşımında güvenlik iki tarafta oluşturulur:

1. **Yük etkileri** güvenli tarafta büyütülür (γf faktörleri)
2. **Malzeme dayanımları** güvenli tarafta azaltılır (γm faktörleri)

Temel koşul: **Ed ≤ Rd**

- Ed = tasarım yük etkisi (büyütülmüş)
- Rd = tasarım dayanımı (azaltılmış)`,
      subsections: [],
    },
    {
      id: "beton-formulleri",
      title: "Beton: fck → fcd Dönüşümü",
      content: `## Temel Formül

\`\`\`
fcd = fck / γmc

TS 500 yaygın değeri: γmc = 1.50 (yerinde dökme beton)
\`\`\`

## Hesap Örnekleri

| Sınıf | fck (MPa) | γmc | fcd (MPa) | 0.85·fcd (MPa) |
|-------|----------:|-----|----------:|---------------:|
| C20 | 20 | 1.50 | 13.33 | 11.33 |
| C25 | 25 | 1.50 | 16.67 | 14.17 |
| C30 | 30 | 1.50 | 20.00 | 17.00 |
| C35 | 35 | 1.50 | 23.33 | 19.83 |
| C40 | 40 | 1.50 | 26.67 | 22.67 |
| C45 | 45 | 1.50 | 30.00 | 25.50 |
| C50 | 50 | 1.50 | 33.33 | 28.33 |

> [!IMPORTANT]
> **fcd ≠ 0.85·fcd** — fcd betonun tasarım basınç dayanımıdır. 0.85·fcd ise eşdeğer basınç bloğu hesabında kullanılan etkin gerilme düzeyiyle ilişkilidir. C30 örneği: fcd = 20 MPa, 0.85·fcd = 17 MPa.

## Betonun Karakteristik Çekme Dayanımı

Beton çekmede basınca göre çok daha zayıftır. TS 500'de normal dayanımlı beton için:

\`\`\`
fctk ≈ 0.35 × √fck    (MPa cinsinden)

C30 için: fctk ≈ 0.35 × √30 ≈ 1.92 MPa
fctd = fctk / γmc = 1.92 / 1.50 ≈ 1.28 MPa
\`\`\`

Bu değer; kesme dayanımı, çatlama, minimum donatı ve aderansla ilişkili kontrollerde kullanılır.

## Elastisite Modülü

\`\`\`
Ec = 3 250 × √fck + 14 000    (MPa)

C25: Ec ≈ 30 250 MPa
C30: Ec ≈ 31 800 MPa
C35: Ec ≈ 33 230 MPa
\`\`\`

Beton sınıfının yükselmesi elastisite modülünü artırır; ancak artış basınç dayanımı artışı kadar hızlı değildir. C25'ten C30'a geçmek dayanımı %20 artırırken rijitliği yalnızca ~%5 artırır.`,
      subsections: [],
    },
    {
      id: "donati-celigi-formulleri",
      title: "Donatı Çeliği: fyk → fyd Dönüşümü",
      content: `## Temel Formül

\`\`\`
fyd = fyk / γms

TS 500 yaygın değeri: γms = 1.15
\`\`\`

## Hesap Örneği

\`\`\`
fyk = 420 MPa (B420C sınıfı donatı)

fyd = 420 / 1.15 ≈ 365.2 MPa
\`\`\`

## TBDY 2018 Donatı Gereksinimleri

Deprem etkisi altındaki betonarme binalarda yalnızca fyk değerine bakmak yeterli değildir. TBDY kapsamında kontrol edilmesi gerekenler:

- Donatı sınıfı ve nervür geometrisi
- Akma dayanımı (fyk)
- Çekme dayanımı (ftk) ve ft/fy oranı
- Kopma uzaması (εsuk)
- Süneklik sınıfı (B ve C sınıfları)
- Kaynaklanabilirlik

> [!IMPORTANT]
> TBDY 2018 betonarme bina tasarımı için donatı çeliğinin süneklik sınıfı koşullarını karşılaması gerekebilir. Kesin şartlar için yürürlükteki TBDY metnini doğrulayın.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `Hesap raporlarında ve yazılım girişlerinde karşılaşılan yaygın hatalar:

## Değer Karıştırma Hataları

| Hata | Doğru Kullanım |
|------|----------------|
| fck yerine fcd kullanmak | fck karakteristik, fcd tasarım değeridir |
| fcd yerine 0.85·fcd yazmak | Bunlar farklı kavramlardır — 0.85 faktörü ayrıca uygulanır |
| Küp dayanımını silindir dayanımı sanmak | C30/37'de fck = 30 MPa (silindir) |
| Karakteristik dayanımı ortalama dayanım olarak tanımlamak | Karakteristik değer istatistiksel alt sınırdır |
| Tek numune sonucuyla beton kabulü yapmak | TS 13515'e göre istatistiksel değerlendirme gerekir |
| fyk'yı doğrudan tasarım hesabında kullanmak | fyd = fyk / γms uygulanmalı |

## Birim Karışıklığı

**1 MPa = 1 N/mm²**

Bu eşitlik sayesinde betonarme kesit hesaplarında:

\`\`\`
Kuvvet (N) = Gerilme (N/mm²) × Alan (mm²)
\`\`\`

doğrudan kullanılabilir. MPa ve N/mm² aynı birimdir.

## Yazılım Kullanımındaki Hatalar

Hesap yazılımlarında malzeme kartları girişinde:
- Silindir mi küp dayanımı tanımlandığı kontrol edilmeli
- Yazılımın γmc'yi uygulayıp uygulamadığı bilinmeli
- Program çıktısında hangi dayanım değeriyle işlem yapıldığı izlenmeli`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki kavramlar aşağıdaki kaynaklara dayanmaktadır. Projede kullanılan kesin değerler **güncel resmî belgeden doğrulanmalıdır**.

- **TS 500** — Betonarme Yapıların Tasarım ve Yapım Kuralları
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 7 (Betonarme Taşıyıcı Sistemler)
- **TS EN 206+A2** — Beton tanımlama ve uygunluk
- **TS 13515** — Beton kabul standartları`,
      subsections: [],
    },
  ],
  relatedSlugs: [
    "ts500-beton-sinifi-secimi",
    "ts500-beton-ortusu-durabilite",
    "ts500-egilme-donatisi-hesabi",
  ],
  tags: ["fck", "fcd", "malzeme katsayısı", "γmc", "tasarım dayanımı"],
};

export const ts500KarakteristikDayanim = buildTs500Article(spec);
