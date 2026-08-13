/**
 * TS 500 — Kenetlenme Boyu ve Donatı Ek Yeri Kuralları
 *
 * Kaynak MD: TS500_Bolum_02_Donati_Oranlari_Kenetlenme_Bindirme.md (Bölüm 27–45)
 *
 * UYARI: Kesin kenetlenme boyları, bindirme katsayıları ve TBDY 2018 özel
 * detayları için yürürlükteki standart metinleri resmi kaynaktan doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-kenetlenme-ek-yeri",
  title: "Kenetlenme Boyu ve Donatı Ek Yeri Kuralları",
  description:
    "Aderans mekanizması, düz ve kancalı kenetlenme hesabı, bindirmeli ekler, mekanik manşonlar ve TBDY 2018 donatı ek yeri kuralları.",
  image: "/covers/ts500/kenetlenme.png",
  readTime: "11 dk",
  keywords: [
    "kenetlenme boyu",
    "bindirme eki",
    "aderans",
    "lb",
    "lbd",
    "manşonlu ek",
    "kanca kenetlenmesi",
    "üst donatı",
    "TBDY bindirme",
    "donatı eki",
  ],
  sections: [
    {
      id: "kenetlenme-ve-aderans",
      title: "Kenetlenme ve Aderans Nedir?",
      content: `Betonarme elemanlarda donatının tasarım dayanımını gösterebilmesi için çuluktaki çekme veya basınç kuvvetinin betona tam olarak aktarılması gerekir.

- **Kenetlenme:** Çuluktaki kuvvetin donatıdan betona güvenle aktarılması sürecidir.
- **Aderans:** Donatı ile beton arasındaki yapışma ve kenetlenme gerilmesidir (τb).

## Aderans Mekanizması

Nervürlü donatı çeliklerinde aderans üç bileşenden oluşur:
1. **Kimyasal yapışma:** Beton ile çelik yüzey arasındaki mikro yapışma
2. **Sürtünme:** Donatı ile beton arasındaki temas sürtünmesi
3. **Mekanik kilitlenme:** Nervürlerin betona dişli gibi dayanması (baskın bileşen)

Nervürlerin betona uyguladığı radyal kuvvetler yetersiz pas payı veya sıkılaştırılmamış beton durumunda **boyuna yarılma çatlaklarına** neden olur.

> [!IMPORTANT]
> **Fiziksel Denge Mantığı:**
> Çubuğun taşıdığı kuvvet: T = As × fs = (π·ϕ² / 4) × fs
> Aderansla aktarılan kuvvet: T = π · ϕ · lb · τb
> İki kuvvet eşitlendiğinde: **lb = (ϕ · fs) / (4 · τb)**
> 
> Bu denklem kenetlenmenin temel kuralını özetler: Çap (ϕ) arttıkça lb artar, beton kalitesi (τb) arttıkça lb azalır.`,
      subsections: [],
    },
    {
      id: "ts500-kenetlenme-formulu",
      title: "TS 500 Kenetlenme Boyu Hesabı",
      content: `TS 500'de temel çekme kenetlenme boyu (lb) şu ifadeyle hesaplanır:

\`\`\`
lb = 0.12 × (fyd / fctd) × ϕ

lb ≥ 20 × ϕ (veya yönetmelik minimumu)
\`\`\`

- **fyd:** Donatı çeliği tasarım akma dayanımı (fyd = fyk / 1.15)
- **fctd:** Beton tasarım çekme dayanımı (fctd = fctk / 1.50)
- **ϕ:** Donatı çubuğu çapı (mm)

## C25, C30, C35 için Pratik Katsayılar (B420C)

fyk = 420 MPa (fyd = 365.2 MPa) kabulüyle pratik kenetlenme katsayıları:

| Beton Sınıfı | fctd (MPa) | lb / ϕ (Temel Katsayı) | Ø16 için lb (Örnek) | Ø20 için lb (Örnek) |
|--------------|-----------:|-----------------------:|--------------------:|--------------------:|
| C25 | 1.17 | ~37.6 × ϕ | ~60 cm | ~75 cm |
| C30 | 1.28 | ~34.3 × ϕ | ~55 cm | ~69 cm |
| C35 | 1.38 | ~31.7 × ϕ | ~51 cm | ~63 cm |
| C40 | 1.48 | ~29.7 × ϕ | ~48 cm | ~59 cm |

> [!NOTE]
> Bu tablodaki değerler temel düz kenetlenme katsayısıdır. Gerçek projede üst donatı durumu, beton örtüsü, kanca ve bindirme çarpanları ayrıca uygulanmalıdır.

## Donatı Çapının Kenetlenmeye Etkisi

Çelik alanı kesit çapının karesiyle (ϕ²) büyürken, kenetlenme boyu çapla (ϕ) doğrusal büyür:

- **Ø16 → Ø20 Değişimi:** Donatı alanı %56 artarken, kenetlenme boyu %25 uzar. Büyük çaplı donatıların düğüm noktalarında kenetlenmesi daha zorlaşır.`,
      subsections: [],
    },
    {
      id: "ust-donati-ve-kanca",
      title: "Üst Donatı Etkisi ve Kanca Kenetlenmesi",
      content: `## Üst Donatı Durumu

Taze beton dökümü sırasında katı taneler çökerken su ve ince malzeme yukarı yükselir. Bu durum döküm yüksekliğinin üst bölgelerinde bulunan horizontal donatıların alt yüzeyinde boşluk ve zayıf aderans oluşturur.

**TS 500 Kuralı:** Beton döküm yönüne göre altı taze betonla kaplı donatılarda (örneğin döküm yüksekliği > 30 cm olan elemanların üst donatılarında) kenetlenme boyu **1.3 kat** (veya güncel standart katsayısı) artırılır.

## Kanca Kenetlenmesi

Düz uzatmanın sığmadığı kiriş-kolon birleşimleri ve mesnetlerde kenetlenme kanca ile sağlanır:

- **90° Standart Kanca (Gönye):** Büküm sonrası en az 12·ϕ kadar düz uzantı bırakılır.
- **135° Deprem Kancası:** Etriyelerde ve çirozla sargılanmış elemanlarda kullanılır.

> [!WARNING]
> **"90° büktüm, bitti" Yanılgısı:** Bükme iç çapının (mandrel çapı) yetersiz olması çelikte mikro çatlaklara ve betonda ezilmeye yol açar. TS 500 minimum bükme çapı kurallarına uyulmalıdır.`,
      subsections: [],
    },
    {
      id: "bindirme-ekleri",
      title: "Bindirmeli Ekler ve Kuvvet Aktarımı",
      content: `## Kenetlenme ile Bindirme Arasındaki Fark

- **Kenetlenme:** Çelik → Beton (tek çubuktan betona kuvvet aktarımı)
- **Bindirme Eki:** Çelik A → Beton → Çelik B (iki donatı arasında beton aracılığıyla kuvvet devri)

Bindirme ekinde iki çubuk yan yana durduğundan betonda yüksek aderans gerilmeleri oluşur. Bu nedenle bindirme boyu (l0) genellikle kenetlenme boyundan (lb) daha uzundur:

\`\`\`
l0 = α × lb

α katsayısı aynı kesitte eklenen donatı oranına göre 1.0 ile 1.5 arasında değişir.
\`\`\`

## Neden Donatılar Şaşırtmalı Eklenmelidir?

Tüm donatılar aynı kesitte eklenirse:
- Aderans kuvvetleri aynı bölgede yığılır ve beton yarılması riski artar.
- Kesit çok sıkışık hale gelir, beton dökümü zorlaşır.
- O kesitte beklenmeyen zayıflama tüm donatıları etkiler.

> [!IMPORTANT]
> TS 500 ve TBDY uyarınca eklerin **şaşırtmalı** yapılması esastır. Aynı kesitte donatıların en fazla %50'sinin eklenmesi tavsiye edilir; aksi halde bindirme boyu artırım katsayısı (α = 1.5) uygulanır.`,
      subsections: [],
    },
    {
      id: "tbdy-2018-ek-kurallari",
      title: "TBDY 2018 Donatı Ek Yeri Kuralları",
      content: `Deprem bölgelerinde donatı ekleri kritik bölgelerden uzak tutulmalıdır:

## Kolon Boyuna Donatısı Ekleri

- Kolon sarılma bölgelerinde (kolon alt ve üst uçlarında) tercihen bindirme eki yapılmamalıdır.
- Bindirmeli ekler kolon orta üçte birlik bölgesinde yapılmalıdır.
- Kolon filiz bindirme bölgesinde etriye aralığı sıklaştırılmalıdır (sarılma bölgesi etriye aralığı).

## Kiriş Boyuna Donatısı Ekleri

- Kiriş sarılma bölgelerinde (mesnetten itibaren 2h mesafede) çekme donatısı bindirme eki **yapılamaz**.
- Çekme donatısı ekleri açıklık ortasında, basınç donatısı ekleri mesnete yakın yapılmalıdır.

## Mekanik ve Kaynaklı Ekler (Manşonlar)

Yoğun donatılı kolon ve perde uçlarında bindirme eki donatı sıkışıklığına yol açıyorsa mekanik manşonlu ekler kullanılır:

- **TBDY Koşulu:** Mekanik manşonlu ekler donatının karakteristik kopma dayanımının (ftk) en az 1.25 katını taşıyabilmelidir (Tip 2 / Type 2 manşon).`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Uygulama Hataları

1. **Çap büyüdükçe bindirme boyunu sabit tutmak:** Ø14 ile Ø22 çubukta aynı 50 cm bindirmeyi kullanmak (Ø22 için kenetlenme %57 daha uzundur).
2. **Kiriş mesnet ucunda çekme donatısı bindirmesi yapmak:** TBDY 2018 Bölüm 7'ye göre sarılma bölgesinde çekme donatısı eki yasaktır.
3. **Üst donatı katsayısını göz ardı etmek:** Döküm yüksekliği fazla olan kiriş ve radye üst donatılarında lb'yi 1.3 kat büyütmemek.
4. **Kancaları düz uzantısız bükmek:** 90° gönyeden sonra 12·ϕ düz uzantı bırakmamak.
5. **Manşonlu eklerde kalitesiz ürün kullanımı:** Çekme deneyinde çubuk kopmadan manşondan sıyrılan kalitesiz ekler kullanmak.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki kurallar ve formüller aşağıdaki resmi belgelere dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 9, 10, 11)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 7 (Betonarme Taşıyıcı Sistemler)
- **TS 708** — Betonarme İçin Çelik Donatı Standartları`,
      subsections: [],
    },
  ],
  references: [
    {
      label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018",
      href: "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi",
    },
    {
      label: "TSE — TS 500 Betonarme Standartı",
      href: "https://www.tse.org.tr",
    },
  ],
  relatedSlugs: [
    "ts500-donati-orani-sinirlari",
    "ts500-egilme-donatisi-hesabi",
    "ts500-kolon-pm-etkilesimi",
  ],
  tags: ["kenetlenme boyu", "bindirme eki", "aderans", "lb", "manşon", "TBDY bindirme"],
};

export const ts500Kenetlenme = buildTs500Article(spec);
