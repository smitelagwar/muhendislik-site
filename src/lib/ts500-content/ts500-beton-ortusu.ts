/**
 * TS 500 — Beton Örtüsü (Pas Payı) ve Durabilite
 *
 * Kaynak MD: TS500_Bolum_01_Beton_Malzeme_Dayanimlari_Durabilite.md (Bölüm 21–33)
 *
 * UYARI: Kesin örtü değerleri ve çevre sınıfı gereksinimleri için TS 500,
 * TS EN 206, TS EN 1992-1-1 ve TBDY 2018'in güncel metinleri doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-beton-ortusu-durabilite",
  title: "Beton Örtüsü (Pas Payı) ve Durabilite",
  description:
    "Betonarme elemanlarda beton örtüsünün dört işlevi, çevresel etki sınıfları, optimum örtü seçimi ve durabiliteyi etkileyen faktörler.",
  image: "/covers/ts500/beton-ortusu.png",
  readTime: "9 dk",
  keywords: [
    "beton örtüsü",
    "pas payı",
    "durabilite",
    "çevresel etki sınıfı",
    "XC XD XS",
    "karbonatlaşma",
    "klorür korozyonu",
    "donatı korozyonu",
    "nominal örtü",
  ],
  sections: [
    {
      id: "tanim-ve-onemi",
      title: "Beton Örtüsü Nedir ve Neden Önemlidir?",
      content: `Beton örtüsü, beton yüzeyi ile donatı yüzeyi arasındaki koruyucu beton tabakasıdır. Gündelik dilde "pas payı" olarak da bilinir.

**Beton örtüsü bir boşluk değildir.** Donatı ile dış ortam arasındaki yapısal ve kimyasal açıdan kritik bir koruyucu tabaladır.

Teknik içerikte dikkat edilmesi gereken kavramlar:

| Kavram | Tanım |
|--------|-------|
| Net beton örtüsü | Donatı yüzeyi ile dış beton yüzeyi arasındaki ölçülen mesafe |
| Nominal beton örtüsü | Tasarım ve paftalarda kullanılan hedef değer |
| Minimum beton örtüsü | Yönetmelik ve standartların izin verdiği alt sınır |

> [!IMPORTANT]
> "Her yerde 2.5 cm pas payı yeter" yaklaşımı yanlıştır. Beton örtüsü eleman türüne, çevresel koşullara, beton kalitesine ve yangın dayanımı gereksinimlerine göre değişir.`,
      subsections: [],
    },
    {
      id: "dort-ana-gorev",
      title: "Beton Örtüsünün Dört Ana Görevi",
      content: `## 1. Korozyon Koruması

Betonun yüksek alkaliliği (pH ≈ 12–13) donatı üzerinde pasif bir koruyucu tabaka oluşturur. Yeterli ve kaliteli beton örtüsü:

- CO₂ girişini yavaşlatır (karbonatlaşma cephesini geciktirir)
- Klorür iyonlarının donatıya ulaşmasını yavaşlatır
- Su ve oksijen taşınımını azaltır

## 2. Aderans

Donatı kuvvetinin betona aktarılması için donatının çevresinde yeterli beton bulunmalıdır. Yetersiz örtüde:

- Boyuna yarılma çatlakları oluşabilir
- Ankraj ve kenetlenme sorunları çıkabilir
- Donatı yüzeyinde sıyrılma riski artar

## 3. Yangın Dayanımı

Beton örtüsü donatının hızlı ısınmasını geciktirir. Yangında çelik sıcaklığı arttıkça akma dayanımı ve elastisite modülü azalır. Bu nedenle yangın tasarımı için gereken örtü değerleri, yalnızca durabilite için gerekenden farklı olabilir.

## 4. Fiziksel Koruma

Donatıyı darbeler, aşınma, nem ve kimyasal etkilere karşı korur.`,
      subsections: [],
    },
    {
      id: "cevresel-etki-siniflari",
      title: "Çevresel Etki Sınıfları (XC, XD, XS, XF, XA)",
      content: `TS EN 206 yaklaşımında betonun maruz kaldığı çevre etkileri sınıflandırılır. Bu sınıflar minimum beton performansını, su/çimento oranını ve beton örtüsünü etkiler.

| Sınıf | Etki Türü | Tipik Koşullar |
|-------|-----------|----------------|
| **X0** | Risk yok | Kuru iç mekân, beton korumalı |
| **XC1** | Karbonatlaşma — kuru | Daima kuru veya daima ıslak iç mekân |
| **XC2** | Karbonatlaşma — uzun süreli ıslak | Dış yüzey, uzun süreli ıslak |
| **XC3** | Karbonatlaşma — orta nem | Korunan dış yüzeyler, orta nem |
| **XC4** | Karbonatlaşma — ıslanma-kuruma | Yağmur etkisine açık yüzeyler |
| **XD1** | Klorür — orta nem | Buz çözücü tuz serpilen yollar |
| **XD2** | Klorür — ıslak-nadir kuru | Yüzme havuzu, endüstriyel |
| **XD3** | Klorür — ıslanma-kuruma | Köprü güvertesi, otopark döşemesi |
| **XS1** | Deniz klorürü — hava taşımalı | Denize yakın kıyı yapıları |
| **XS2** | Deniz klorürü — daima dalmış | Deniz yapıları, daima su altı |
| **XS3** | Deniz klorürü — gelgit ve sıçrama | Gelgit bölgesi, sıçrama bölgesi |
| **XF1** | Don — orta suya doygunluk | Yağmur ve don etkisindeki dikey yüzeyler |
| **XF2** | Don — orta + buz çözücü | Buz çözücü tuz + don etkisi |
| **XF3** | Don — yüksek suya doygunluk | Yatay yüzeyler, don etkisi |
| **XF4** | Don — yüksek + buz çözücü | Karayolu köprüleri, yatay yüzeyler |
| **XA1–XA3** | Kimyasal saldırı | Agresif toprak, sülfatlı yeraltı suyu |

> [!NOTE]
> Bir eleman birden fazla çevre sınıfına tabi olabilir. Örneğin denize yakın bir köprü ayağı aynı anda XS3 + XF4 koşullarında değerlendirilebilir. Her iki sınıfın gereksinimlerinin birlikte sağlanması gerekir.`,
      subsections: [],
    },
    {
      id: "karbonlasma-klorur",
      title: "Karbonatlaşma ve Klorür Korozyonu",
      content: `## Karbonatlaşma

Beton içindeki alkalilik zamanla atmosferik CO₂ etkisiyle azalır. Bu süreç:

1. Karbonatlaşma cephesi donatı seviyesine ulaşır
2. Pasif koruyucu tabaka bozulur
3. Nem ve oksijen varlığında korozyon başlar
4. Pas ürünleri çelikten daha büyük hacim kaplar
5. İç basınç oluşur → boyuna çatlak → örtü dökülebilir → donatı kesit kaybı

## Klorür Korozyonu

Klorür iyonları donatıya ulaştığında pasif tabakayı bozar. Karbonatlaşmadan farklı olarak **lokal/pitting tipi** ciddi kesit kayıplarına yol açabilir. Deniz yapıları, kıyı yapıları ve buz çözücü tuz kullanılan yerlerde en yüksek risk düzeyindedir.

> [!WARNING]
> **"C35 beton kullandım, sorun çözülür"** yaklaşımı klorür açısından yanlıştır. Denizkıyı yapıları için bütün şunlar birlikte sağlanmalıdır:
> - Düşük su/bağlayıcı oranı
> - Uygun çimento/bağlayıcı türü
> - Yeterli ve nitelikli beton örtüsü
> - Çatlak genişliği kontrolü
> - Doğru kür süresi ve yöntemi`,
      subsections: [],
    },
    {
      id: "optimum-ortu",
      title: "Optimum Örtü: Ne Çok Az, Ne Çok Fazla",
      content: `## Yetersiz Örtünün Sonuçları

- Donatı korozyonu hızlanır
- Beton çatlayabilir ve yüzey dökülür
- Aderans (kenetlenme) azalır
- Yangın dayanımı düşer
- Yapı ömrü kısalır

## Aşırı Örtünün Sonuçları

"Pas payını ne kadar artırırsak o kadar iyidir" yaklaşımı da yanlıştır:

- Yüzey çatlağı genişliği artabilir
- Kapak betonunun kontrolsüz çatlamasına zemin hazırlanır
- **Faydalı yükseklik azalır**

Kirişlerde:

\`\`\`
d = h − örtü − etriye çapı − 0.5 × boyuna donatı çapı
\`\`\`

Örtü arttıkça faydalı yükseklik (d) azalır. Moment kapasitesi Mr ≈ As·fyd·z ilişkisinden hareketle z değeri düşer ve kapasite azalabilir.

**Gereksiz büyük örtü yapısal olarak nötr değildir.**

## Mesafe Tutucular

Projede doğru örtü çizmek yeterli değildir. Şantiyede donatı mesafe tutucular olmadan kalıba yaslanabilir, sarkabilir veya deforme olabilir. Mesafe tutucuların:

- Doğru çap ve boyda seçilmesi
- Yeterli sıklıkta yerleştirilmesi
- Kalıp ve döküm sırasında yerinde kalması

sağlanmalıdır.`,
      subsections: [],
    },
    {
      id: "kur-ve-durabilite",
      title: "Kür ve Durabilite İlişkisi",
      content: `Kür yalnızca "beton daha yüksek dayanım alsın" diye yapılmaz. İyi kür:

- Hidratasyonu sürdürür ve yüzey betonunu yoğunlaştırır
- Plastik rötre çatlaklarını azaltır
- Betonun geçirgenliğini azaltır
- Dış ortam etkilerine karşı dayanıklılığı artırır

> [!IMPORTANT]
> **Beton örtüsü 40 mm olsa bile ilk 10–15 mm'lik yüzey betonu kötü kür nedeniyle çok geçirgense, teorik örtü avantajının önemli bölümü kaybedilebilir.**

**"Durabiliteyi santimetre değil, kaliteli santimetre korur."**

## Su/Çimento Oranı ve Geçirgenlik

Betonun geçirgenliğini belirleyen en önemli parametrelerden biri su/bağlayıcı oranıdır. Genel prensip: su/çimento oranı arttıkça kapiler boşluk yapısı artabilir ve geçirgenlik yükselir. Ancak düşük su/çimento oranı tek başına kalite garantisi değildir — yetersiz işlenebilirlik, vibrasyon sorunları veya kötü kür yüksek kaliteli bir karışımı olumsuz yapıya dönüştürebilir.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Projede

- "Her yerde 25 mm örtü" kabulü yapılması — eleman türü ve çevreye göre değişir
- Temel altında donatı örtüsünün üst/alt yüzde eşit alınması — serbest yüzey, kalıba yüzey ve toprağa yüzey farklı değer gerektirebilir
- Bodrum perdelerinde iç/dış yüz örtüsünün aynı alınması — toprak taraflı yüz genellikle daha yüksek örtü gerektirir

## Şantiyede

- Mesafe tutucuların çimento bazlı yerine plastik seçilmesi (klorür geçirgen ortamlarda sorun yaratabilir)
- Mesafe tutucuların yetersiz sıklıkta yerleştirilmesi
- Kalıp döküm aşamasında donatının kayması ve örtünün değişmesi
- Birden fazla donatı katmanı varken yalnızca dış çapı dikkate almak

> [!NOTE]
> **Beton örtüsü yalnızca tasarımda doğru belirlenmeli değil, şantiyede de doğrulanmalıdır.** Beton dökümü öncesi kalıp ve donatı kontrolü sırasında örtü fotoğraflı tutanağa bağlanmalıdır.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makalede ele alınan kavramlar aşağıdaki kaynaklara dayanmaktadır. Projede kullanılan kesin değerler **güncel resmî belgeden doğrulanmalıdır**.

- **TS 500** — Betonarme Yapıların Tasarım ve Yapım Kuralları (TSE)
- **TS EN 206+A2** — Beton: Özellik, Performans, İmalat ve Uygunluk
- **TS 13515** — TS EN 206'nın uygulanmasına ilişkin tamamlayıcı standart
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği (AFAD)
- **TS EN 1992-1-1** — Betonarme yapıların tasarımı: Genel kurallar (EC2)`,
      subsections: [],
    },
  ],
  references: [
    {
      label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018",
      href: "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi",
    },
    {
      label: "TSE — TS 500, TS EN 206, TS 13515",
      href: "https://www.tse.org.tr",
      note: "TSE kataloğunda güncel baskı doğrulanmalıdır.",
    },
  ],
  relatedSlugs: [
    "ts500-beton-sinifi-secimi",
    "ts500-karakteristik-tasarim-dayanimlari",
    "ts500-catlak-genisligi-kontrolu",
  ],
  tags: ["beton örtüsü", "pas payı", "durabilite", "çevresel etki sınıfı", "karbonatlaşma"],
};

export const ts500BetonOrtusu = buildTs500Article(spec);
