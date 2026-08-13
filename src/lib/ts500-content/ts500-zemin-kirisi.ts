/**
 * TS 500 — Zemin Kirişi ve Bodrum Perdesi Tasarımı
 *
 * Kaynak MD: TS500_Bolum_09_Tekil_Birlesik_Radye_Temel_Kirisi_Bodrum_Perdesi.md (Bölüm 1–35)
 *
 * UYARI: Bodrum perdesi toprak/su basıncı hesabı, yatay/düşey donatı oranları
 * ve TBDY 2018 rijit bodrum perdesi kuralları resmi belgeden doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-zemin-kirisi-bodrum-perdesi",
  title: "Zemin Kirişi ve Bodrum Perdesi Tasarımı",
  description:
    "Temel/zemin kirişleri ile bodrum perdelerinin temel işlev farkları, toprak ve hidrostatik su basınçları, konsol/çift mesnetli perde davranışı ve yatay/düşey donatı kuralları.",
  image: "/covers/ts500/bodrum-perdesi.png",
  readTime: "11 dk",
  keywords: [
    "zemin kirişi",
    "bodrum perdesi",
    "toprak basıncı",
    "hidrostatik su basıncı",
    "rijit bodrum",
    "düşey donatı",
    "yatay donatı",
    "su yalıtımı",
    "TBDY bodrum",
  ],
  sections: [
    {
      id: "islevsel-fark",
      title: "Kritik Ayrım: Zemin Kirişi vs Bodrum Perdesi",
      content: `Mühendislik pratiğinde sıkça karıştırılan iki farklı eleman:

1. **Temel / Zemin Kirişi (Sürekli Temel Kirişi):** Temel seviyesinde yataya yakın konumlandırılan, kolon yüklerini zemine dağıtan veya tekil temelleri bir arada tutan kiriş elemanıdır. Yükler düşey doğrultuludur.
2. **Bodrum Perdesi:** Yapının toprak altında kalan katlarında dış çevreyi kapatan, **toprak ve yeraltı su basınçlarını ($q_{toprak}, q_{su}$)** içeriye aktarmayan düşey betonarme perdedir. Yükler yatay doğrultuludur.

> [!IMPORTANT]
> Bodrum perdesi tek yönlü veya çift yönlü **eğilme plağı** gibi çalışır; zemin kirişi ise **eğilme ve kesme kirişi** gibi çalışır. Yük doğrultuları ve donatı yönleri tamamen farklıdır.`,
      subsections: [],
    },
    {
      id: "bodrum-perdesi-yukleri",
      title: "Bodrum Perdesine Etki Eden Yükler",
      content: `Bodrum perdesi dış ortamdan içeriye doğru dik (yatay) kuvvetler taşır:

## 1. Toprak İtkisi ($p_a$ veya $p_0$)

- **Aktif Toprak Basıncı ($p_a$):** Perdenin dışa doğru yatay esnemesine izin verilen durumlarda (üçgen gerilme dağılımı).
- **Sükûnetle Toprak Basıncı ($p_0$):** Perde üstte döşemelerle tutulu ve rijitse perdenin esnemesine izin verilmez. Sükûnet basıncı ($K_0 \approx 0.5$) kullanılır.

## 2. Hidrostatik Su Basıncı ($p_w$)

Yeraltı su seviyesi ($YSS$) varlığında su basıncı derinlikle doğrusal artar ($p_w = \gamma_w \cdot h_w$). **Su basıncı azaltılamaz ve ihmal edilemez.**

## 3. Sürşarj Yükleri ($q_{sürşarj}$)

Bina çevresindeki araç trafiği, itfaiye yolu veya komşu yapı yükleri eşdeğer sürşarj yükü ($q$) olarak perdenin tüm yüksekliğine etki eder.

\`\`\`
Toplam Dış Basınç: p(z) = K0 × (γ × z + q_sürşarj) + γw × zw
\`\`\``,
      subsections: [],
    },
    {
      id: "perde-mesnet-davranisi",
      title: "Bodrum Perdesi Statik Çalışma Modelleri",
      content: `Bodrum perdesi mesnet koşullarına göre 2 şekilde modellenir:

## 1. Düşey Şerit Modeli (En Yaygın)

Perde alt tarafta **radye temele (ankastre)**, üst tarafta **zemin kat döşemesine (pimli/mafsallı tutulu)** bağlıdır.
- **En Büyük Moment:** Perde alt kısımlarında veya yüksekliğin $1/3$'ünde oluşur.
- **Ana Çekme Donatısı:** İç yüzeyde düşey doğrultudadır ($M > 0$).

## 2. İki Doğrultulu Plak Modeli

Perde iki yanından dik betonarme perdelere (enine perdeler) bağlıysa plak gibi iki yönde çalışır. Bu durumda enine yatay donatılar da ana moment taşır.`,
      subsections: [],
    },
    {
      id: "donati-yerlesimi-ve-tbdy",
      title: "Bodrum Perdesi Donatı Kuralları ve TBDY 2018",
      content: `## Donatı Yerleşim Esasları

- **Dış Yüz Donatısı (Toprağa Bakan Yüz):** Toprak tarafındaki yüzde oluşabilecek negatif momentler, sıcaklık ve rötre çatlaklarını önlemek için donatı konur.
- **İç Yüz Donatısı (Bina İçi Yüz):** Ana açıklık momentini karşılayan düşey donatılar bu yüzde bulunur.

## Minimum Donatı Oranları

TS 500 ve TBDY uyarınca bodrum perdelerinde:
- Düşey donatı oranı: $\rho_v \ge 0.0025$ (her iki yüzde toplam)
- Yatay donatı oranı: $\rho_h \ge 0.0025$ (her iki yüzde toplam)
- Çift sıra donatı zorunludur ($h_w \ge 15\text{ cm}$ ise).
- Çift sıra donatılar birbirine **çirozlar** ile tutturulmalıdır (m²'de en az 4 adet).

> [!NOTE]
> **Rijit Bodrum Kat Kavramı (TBDY 2018):** Binanın çevresi en az 4 taraftan kesintisiz bodrum perdeleriyle çevriliyse ve rijit döşemelerle tutulmuşsa TBDY Bodrum Kat Periyodu hesabı için perdenin rijitliği esas alınır.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Tasarım ve Şantiye Hataları

1. **Yeraltı su seviyesini hesaba katmamak:** YSS hesaba katılmazsa su basıncı perdeyi çatlatıp içeriye su sızdırır.
2. **Toprak sürşarj yüklerini (otopark/itfaiye yolu) ihmal etmek.**
3. **Ana çekme donatısını dış yüze koymak:** Düşey şerit modelinde açıklık momenti perde iç yüzündedir; donatının iç yüze konulması gerekir.
4. **Çirozları unutmak:** Çift sıra donatı ağının beton dökümünde devrilmesini ve pas payı kaybını önlemek için çiroz şarttır.
5. **Soğuk derz su yalıtımını yapmamak:** Temel-perde birleşim derzine su tutucu bant (su stoperi / şişen bant) koymamak.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki hesap yöntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 11.4)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 7 & Bölüm 16 (Rijit Bodrum Perdeleri)
- **TS EN 1997-1 (Eurocode 7)** — Retaining Structures and Earth Pressure`,
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
    "ts500-radye-temel-egilme-kesme",
    "ts500-tekil-birlesik-temel-tasarimi",
    "ts500-beton-ortusu-durabilite",
  ],
  tags: ["zemin kirişi", "bodrum perdesi", "toprak basıncı", "su basıncı", "rijit bodrum", "düşey donatı", "çiroz"],
};

export const ts500ZeminKirisi = buildTs500Article(spec);
