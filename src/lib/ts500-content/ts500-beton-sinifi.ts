/**
 * TS 500 — Beton Sınıfı Seçimi: C20'den C35'e Doğru Tercih Kriterleri
 *
 * Kaynak MD: TS500_Bolum_01_Beton_Malzeme_Dayanimlari_Durabilite.md
 *
 * UYARI: Bu dosyadaki değerler öğretici amaçlıdır. TS 500, TBDY 2018,
 * TS EN 206 ve TS 13515'in yürürlükteki metinleri resmi kaynaktan doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-beton-sinifi-secimi",
  title: "Beton Sınıfı Seçimi: C20'den C35'e Doğru Tercih Kriterleri (TS 500)",
  description:
    "TS 500 ve TBDY çerçevesinde doğru beton dayanım sınıfının seçim kriterleri; çevresel etki sınıfları, taşıyıcı sistem gereksinimleri ve sık yapılan hatalar.",
  image: "/covers/ts500/beton-sinifi.png",
  readTime: "10 dk",
  keywords: [
    "beton sınıfı",
    "C25",
    "C30",
    "C35",
    "fck",
    "fcd",
    "karakteristik dayanım",
    "tasarım dayanımı",
    "beton seçimi",
    "TBDY beton",
  ],
  sections: [
    {
      id: "neden-onemli",
      title: "Beton Sınıfı Seçimi Neden Kritiktir?",
      content: `Beton sınıfı seçimi mühendisliğin en temel kararlarından biridir. Ancak bu karar çoğu zaman yanlış basitleştirilerek yapılır: "Daha yüksek sınıf her zaman daha iyidir" ya da "C25 standart binadır, yeter."

Her iki yaklaşım da tek başına yetersizdir. Beton sınıfı seçilirken en az şu başlıklar **birlikte** değerlendirilmelidir:

- Yönetmelik minimum sınırları (TS 500 + TBDY 2018)
- Yapının taşıyıcı sistem gereksinimleri
- Deprem tasarım koşulları
- Kolon ve perde eksenel yük seviyeleri
- Çevresel etkilere maruz kalma (XC, XD, XS, XF, XA sınıfları)
- Servis ömrü hedefi
- Şantiye kalite kontrol kapasitesi
- Beton örtüsü ve çatlak kontrolü gereksinimleri

> [!IMPORTANT]
> **TBDY 2018 kapsamındaki yeni betonarme binalarda yalnızca TS 500 minimum sınırlarına bakmak yeterli değildir.** Deprem yönetmeliğinin beton dayanımı ve malzeme koşulları da karşılanmalıdır. Kesin alt sınırlar için yürürlükteki TBDY 2018 metnini resmi kaynaktan doğrulayın.`,
      subsections: [],
    },
    {
      id: "tanimlar",
      title: "Temel Kavramlar: fck, fcd ve γmc",
      content: `## Beton Sınıfı Nedir?

Türkiye'de hazır beton sınıfları çoğunlukla **C25/30, C30/37, C35/45** gibi silindir/küp çifti şeklinde ifade edilir.

Bu gösterimde:
- **İlk değer:** Standart silindir numunenin karakteristik basınç dayanımı (MPa)
- **İkinci değer:** Standart küp numunenin karakteristik basınç dayanımı (MPa)

TS 500 hesaplarında kullanılan **fck** değeri silindir dayanımını ifade eder (C30/37 için fck = 30 MPa).

> [!WARNING]
> **Sık yapılan hata:** C30/37 betonun ikinci değeri olan 37 MPa'yı fck yerine kullanmak kesit kapasitesini hatalı biçimde yükseltir. TS 500 formüllerinde daima silindir dayanımını kullanın.

## Karakteristik Dayanım (fck)

Karakteristik dayanım, malzemenin ortalama dayanımı **değildir**. Üretimde ortaya çıkan doğal saçılmayı ve istatistiksel değişkenliği dikkate alan güvenilir bir alt sınır yaklaşımıdır:

**ortalama deney sonucu ≠ karakteristik dayanım ≠ tasarım dayanımı**

## Tasarım Dayanımı (fcd)

Taşıma gücü hesabında karakteristik dayanım doğrudan kullanılmaz; malzeme güvenlik katsayısıyla (γmc) bölünür:

\`\`\`
fcd = fck / γmc

Yaygın değer: γmc = 1.50 (yerinde dökme beton)
\`\`\`

Donatı çeliği için:

\`\`\`
fyd = fyk / γms

Yaygın değer: γms = 1.15
\`\`\`

## Pratik Hesap Tablosu

| fck (MPa) | fcd = fck/1.50 | 0.85·fcd | fctk ≈ 0.35√fck | Ec ≈ 3250√fck+14000 |
|----------:|---------------:|---------:|----------------:|--------------------:|
| 20 | 13.33 | 11.33 | 1.57 MPa | 28 530 MPa |
| 25 | 16.67 | 14.17 | 1.75 MPa | 30 250 MPa |
| 30 | 20.00 | 17.00 | 1.92 MPa | 31 800 MPa |
| 35 | 23.33 | 19.83 | 2.07 MPa | 33 230 MPa |
| 40 | 26.67 | 22.67 | 2.21 MPa | 34 550 MPa |
| 45 | 30.00 | 25.50 | 2.35 MPa | 35 800 MPa |
| 50 | 33.33 | 28.33 | 2.47 MPa | 36 980 MPa |

> [!NOTE]
> **fcd ile 0.85·fcd aynı şey değildir.** fcd = fck/γmc olarak tanımlanan tasarım basınç dayanımıdır. 0.85·fcd ise eşdeğer basınç bloğu hesabında kullanılan etkin gerilme düzeyidir. C30 için: fcd = 20 MPa, 0.85·fcd = 17 MPa.`,
      subsections: [],
    },
    {
      id: "c25-c30-c35-karsilastirmasi",
      title: "C25 – C30 – C35 Karşılaştırması",
      content: `## C25

**Avantajları:**
- Yaygın üretim ve santral kapasitesi
- Normal bina uygulamalarında yeterli olabilecek dayanım
- Ekonomik olabilir

**Sınırlamaları:**
- Yüksek eksenel yüklü kolonlarda büyük kesit gerektirebilir
- Yüksek katlı veya yoğun perdeli sistemlerde ekonomik olmayan çözümlere yol açabilir
- Agresif çevre koşullarında salt dayanım sınıfına güvenmek yeterli değildir

## C30

Birçok normal betonarme bina için dengeli bir ara seviye. C25'e göre fck %20 daha yüksektir; ancak elastisite modülü yalnızca yaklaşık %5 artar:

\`\`\`
C25: Ec ≈ 30 250 MPa
C30: Ec ≈ 31 800 MPa
Artış: (31 800 - 30 250) / 30 250 ≈ %5.1
\`\`\`

> [!IMPORTANT]
> **Dayanım artışı ≠ Rijitlik artışı.** Deprem ötelenmesini yalnızca beton sınıfını C25'ten C30'a çıkararak çözmeye çalışmak çoğu durumda etkisizdir. Ötelenme için genellikle daha etkili olan: perde alanını artırmak, kolon/kiriş boyutlarını artırmak veya taşıyıcı sistem geometrisini iyileştirmektir.

## C35

C35'in C25'e göre tasarım basınç dayanımı yaklaşık %40 daha yüksektir:

| Sınıf | fck | fcd | fcd artışı (C25'e göre) |
|-------|-----|-----|------------------------|
| C25 | 25 MPa | 16.67 MPa | — |
| C30 | 30 MPa | 20.00 MPa | +%20 |
| C35 | 35 MPa | 23.33 MPa | +%40 |

**"C35 kullanınca kolon %40 küçülür" sonucu çıkarılamaz.** Kolon kapasitesi beton, boyuna donatı, eksantrisite, moment, ikinci mertebe etkileri, minimum kesit, deprem detaylandırması ve birleşim bölgesi gereksinimleriyle birlikte belirlenir.`,
      subsections: [],
    },
    {
      id: "yuksek-sinif-her-zaman-iyi-mi",
      title: "Yüksek Beton Sınıfı Her Zaman Daha İyi midir?",
      content: `Hayır. Yüksek beton dayanımı bazı avantajlar sağlar; ancak beraberinde riskler getirir.

## Avantajları

- Kolon/perde basınç kapasitesinde artış
- Bazı elemanlarda daha küçük kesit imkânı
- Doğru karışım tasarımıyla düşük geçirgenlik potansiyeli
- Bazı agresif ortam koşullarında daha iyi durabilite potansiyeli

## Riskleri

- Yüksek dayanımlı beton genel olarak **daha gevrek** davranabilir
- Çimento dozajının gereksiz yükseltilmesi rötre ve hidratasyon ısısını artırabilir
- Düşük su/bağlayıcı oranı işlenebilirliği zorlaştırabilir
- Kötü kür yüksek dayanım hedefinin avantajını ortadan kaldırabilir
- Aşırı kesit küçültme deprem davranışı açısından sorun yaratabilir
- Donatı sıkışıklığı artar, birleşim bölgelerinde beton yerleştirmek zorlaşabilir

**Doğru yaklaşım:** Beton sınıfı, taşıyıcı sistem optimizasyonunun bir parçasıdır; tek başına optimizasyon değildir.`,
      subsections: [],
    },
    {
      id: "eleman-bazinda-etki",
      title: "Eleman Türüne Göre Beton Sınıfının Etkisi",
      content: `## Kolonlar

Kolonlarda beton sınıfının etkisi kirişlere göre daha belirgindir çünkü betonun basınç taşıma katkısı yüksektir.

**Örnek (öğretici karşılaştırma):**

Beton alanı Ac = 0.40 × 0.60 = 0.24 m² olan bir kolon için yalnızca beton katkısına bakıldığında:

\`\`\`
C25: fcd × Ac = 16.67 × 0.24 × 1000 ≈ 4 000 kN
C35: fcd × Ac = 23.33 × 0.24 × 1000 ≈ 5 600 kN
\`\`\`

> [!WARNING]
> Bu değerler kolonun gerçek tasarım taşıma gücü değildir — yalnızca beton dayanımı artışının teorik etkisini gösterir. Gerçek kolon kapasitesinde beton gerilme bloğu, donatı, eksantrisite, moment, süneklik ve yönetmelik sınırları uygulanır.

## Kirişler

Tek donatılı dikdörtgen kesitte:

\`\`\`
T = As × fyd    (çekme kuvveti)
C = 0.85·fcd × b × a    (beton basınç kuvveti)
T = C denge koşulundan: As·fyd = 0.85·fcd·b·a
\`\`\`

Beton dayanımı arttığında aynı çekme donatısı için basınç bloğu derinliği küçülür ve iç kuvvet kolu artar. Ancak normal donatılı kirişlerde kapasite artışı fck artışıyla birebir orantılı değildir. Kiriş tasarımında çoğu zaman kesit yüksekliği, donatı alanı, sehim ve kesme daha belirleyicidir.

## Perdeler

Perdelerde yüksek beton sınıfı özellikle yüksek eksenel yük, alt katlar, perde uç bölgeleri ve yüksek binalarda avantaj sağlayabilir. Ancak beton dayanımını yükseltip perde alanını aşırı küçültmek:

- Bina rijitliğini azaltabilir
- Ötelenmeleri artırabilir
- Donatı oranını ve detaylandırma zorluğunu artırabilir

Perde tasarımında **dayanım + rijitlik + süneklik** birlikte düşünülmelidir.

## Temeller

Temellerde beton sınıfı seçimi yalnızca basınç dayanımına göre yapılmaz. Eğilme, kesme, zımbalama, çevresel koşullar ve geçirimsizlik gereksinimleri baskın olabilir. Özellikle radye ve suya maruz bodrumlarda durabilite gereksinimleri salt yapısal minimum sınıfından daha belirleyici olabilir.`,
      subsections: [],
    },
    {
      id: "secim-karar-akisi",
      title: "Beton Sınıfı Seçim Karar Akışı",
      content: `Sistematik bir seçim için şu adımları izleyin:

## Adım 1 — Yapı Kapsamını Belirle

- Yeni bina mı, mevcut yapı mı?
- Deprem tasarımına tabi bina mı?
- Prefabrike, endüstriyel veya özel yapı mı?

## Adım 2 — Yönetmelik Minimumlarını Belirle

TS 500 tek başına yeterli olmayabilir. Kontrol:

| Kapsam | Kaynaklar |
|--------|-----------|
| Yeni betonarme bina | TS 500 + TBDY 2018 |
| Beton tanımlama | TS EN 206 + TS 13515 |
| Proje şartname | Özel teknik şartname |

## Adım 3 — Çevresel Etki Sınıfını Belirle

| Sınıf | Etki | Örnekler |
|-------|------|----------|
| X0 | Minimal risk | Kuru iç mekân, beton korumalı |
| XC1–XC4 | Karbonatlaşma korozyonu | Nemli iç mekân → ıslanma–kuruma döngüsü |
| XD1–XD3 | Tuzlu su dışı klorür | Buz çözücü tuz, klorürlü endüstriyel ortam |
| XS1–XS3 | Deniz suyu klorürü | Deniz aerosolu → gelgit → dalma |
| XF1–XF4 | Donma–çözülme | Islak yüzey ve buz çözücü madde |
| XA1–XA3 | Kimyasal saldırı | Agresif toprak veya yeraltı suyu |

## Adım 4 — Taşıyıcı Sistem İhtiyacını Değerlendir

Kolon yükleri, kat sayısı, açıklıklar, mimari kesit kısıtlamaları ve rijitlik ihtiyacı doğrultusunda gerekli minimum fcd'yi belirleyin.

## Adım 5 — Üretilebilirliği Kontrol Et

- Santral kapasitesi ve nakliye süresi
- Pompalanabilirlik ve donatı yoğunluğu
- Mevsimsel koşullar (yaz–kış önlemleri)

## Adım 6 — Ekonomi Değerlendirmesi

Yalnızca m³ beton fiyatına bakma. Daha yüksek beton sınıfı bazen kolon kesitini küçülterek net kullanım alanını artırabilir. Bazen ise hiçbir ekonomik fayda sağlamaz.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `Mühendislik pratiğinde ve web içeriklerinde yaygın olarak karşılaşılan hatalar:

## Formül Hataları

- **fck yerine fcd kullanmak** → kapasite hesabı yanlış azaltılır
- **fcd yerine 0.85·fcd yazmak** → iki farklı kavramın karıştırılması
- **Küp dayanımını silindir dayanımı sanmak** → C30/37 için 37 MPa yerine 30 MPa kullanılmalı
- **Karakteristik dayanımı ortalama dayanım olarak tanımlamak** → istatistiksel güvenlik payı göz ardı edilir
- **Tek numune sonucuyla beton sınıfı kabulü yapmak** → TS 13515'e göre istatistiksel değerlendirme gerekir
- **Donatı için fyk'yı doğrudan tasarım hesabında kullanmak** → fyd = fyk/γms uygulanmalı

## Kavramsal Hatalar

- **Beton sınıfı yükseldiğinde Ec'nin aynı oranda arttığını sanmak** → C25'ten C30'a %20 dayanım artışı yalnızca %5 rijitlik artışına karşılık gelir
- **Yüksek dayanımlı betonun her durumda daha sünek olduğunu düşünmek** → aksine daha gevrek davranabilir
- **Beton sınıfını durabiliteyle eş anlamlı kullanmak** → durabilite; sınıf, geçirgenlik, örtü, kür ve çatlak kontrolünün bütünüdür
- **Şantiye kalitesini yalnızca 28 günlük basınç dayanımıyla değerlendirmek** → yerleştirme, vibrasyon ve kür de en az dayanım kadar önemlidir

> [!NOTE]
> **1 MPa = 1 N/mm²** eşitliği betonarme kesit hesaplarında pratik kullanım sağlar: N/mm² × mm² = N (Newton).`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki hesap mantığı ve yaklaşımlar aşağıdaki kaynaklara dayanmaktadır. Projede kullanılan sürüm, madde numarası ve yerel idare kararları **güncel resmî belgeden doğrulanmalıdır**.

- **TS 500** — Betonarme Yapıların Tasarım ve Yapım Kuralları (TSE güncel/lisanslı metin)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği (18 Mart 2018, AFAD)
- **TS EN 206+A2** — Beton: Özellik, Performans, İmalat ve Uygunluk
- **TS 13515** — TS EN 206'nın uygulanmasına ilişkin tamamlayıcı standart

Kesin minimum beton sınıfı değerleri, malzeme güvenlik katsayıları ve kabulü değerlendirme kriterleri için bu kaynakların yürürlükteki baskıları esas alınmalıdır.`,
      subsections: [],
    },
  ],
  references: [
    {
      label: "AFAD — Türkiye Bina Deprem Yönetmeliği 2018",
      href: "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi",
    },
    {
      label: "TSE — Türk Standardları",
      href: "https://www.tse.org.tr",
      note: "TS 500, TS EN 206 ve TS 13515 için TSE kataloğu.",
    },
  ],
  relatedSlugs: [
    "ts500-beton-ortusu-durabilite",
    "ts500-karakteristik-tasarim-dayanimlari",
    "ts500-egilme-donatisi-hesabi",
  ],
  tags: ["beton sınıfı", "fck", "fcd", "C25 C30 C35", "malzeme dayanımı"],
};

export const ts500BetonSinifi = buildTs500Article(spec);
