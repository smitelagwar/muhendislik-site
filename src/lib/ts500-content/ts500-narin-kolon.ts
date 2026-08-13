/**
 * TS 500 — Narin Kolonlar ve İkinci Mertebe Momentleri
 *
 * Kaynak MD: TS500_Bolum_07_Kolon_PM_Narinlik_Ikinci_Mertebe.md (Bölüm 41–85)
 *
 * UYARI: Kolon narinlik oranı (λ), burkulma boyu (lk), narinlik sınırları ve
 * TS 500 moment büyütme katsayıları (δ) resmi belgeden doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-narin-kolon-ikinci-mertebe",
  title: "Narin Kolonlar ve İkinci Mertebe Momentleri",
  description:
    "Kolon narinlik oranı (λ = lk/i), Euler burkulma yükü, narinlik sınırları, moment büyütme katsayısı (δ) ve P-Δ ile P-δ ikinci mertebe etkileri.",
  image: "/covers/ts500/kolon-pm.png",
  readTime: "11 dk",
  keywords: [
    "narin kolon",
    "ikinci mertebe",
    "narinlik oranı",
    "burkulma boyu",
    "lk",
    "moment büyütme katsayısı",
    "P-delta",
    "Euler burkulma",
    "atalaet yarıçapı",
    "TS 500 narinlik",
  ],
  sections: [
    {
      id: "ikinci-mertebe-nedir",
      title: "Birinci Mertebe vs İkinci Mertebe Momenti",
      content: `Betonarme kolon analizinde iki tür moment vardır:

1. **Birinci Mertebe Momenti ($M_1$):** Yapı deforme olmadan önceki ilk geometrisi üzerinden hesaplanan momenttir (dış yüklerden veya çerçeve analizinden elde edilen moment).
2. **İkinci Mertebe Momenti ($M_2$):** Eksenel basınç yükünün ($P$), elemanın yanal ötelenmesi ve eğrilmesi sonucu oluşan yer değiştirmeler ($y$) ile çarpılması sonucu doğan ek momenttir ($M_{\text{ilave}} = P \cdot y$).

\`\`\`
Toplam Tasarım Momenti: Md = M1 + P × y  (veya Md = δ × M1)
\`\`\`

> [!IMPORTANT]
> **Kısa Kolon vs Narin Kolon:**
> - **Kısa Kolon:** Yanal deformasyon ($y$) çok küçüktür; ek moment ihmal edilebilir ($M_d \approx M_1$). Kolon doğrudan malzeme dayanımıyla göçer.
> - **Narin Kolon:** Yanal deformasyon ($y$) büyüktür; ilave moment ($P \cdot y$) ihmal edilemez. Kolon birinci mertebe moment kapasitesine ulaşmadan **burkulma veya stabilite kaybı** nedeniyle göçebilir.`,
      subsections: [],
    },
    {
      id: "narinlik-orani-ve-hesabi",
      title: "Narinlik Oranı ($\lambda$) ve Burkulma Boyu ($l_k$)",
      content: `Kolonun narinliği, burkulma boyunun ($l_k$) kesitin atalet yarıçapına ($i$) oranıyla tanımlanır:

\`\`\`
λ = lk / i

i = √(I / Ac)    (Dikdörtgen kesitler için i ≈ 0.289 × h)
\`\`\`

- **$l_k = k \cdot l_n$:** Kolon serbest boyunun ($l_n$) etkin boy katsayısıyla ($k$) çarpımı.
- **Etkin Boy Katsayısı ($k$):**
  - İki ucu mafsallı: $k = 1.0$
  - İki ucu ankastre: $k = 0.5$
  - Bir ucu ankastre, diğer ucu serbest (konsol): $k = 2.0$
  - Çerçeve içi kolonlar (yanal ötelenmesi önlenmiş): $0.5 \le k \le 1.0$
  - Çerçeve içi kolonlar (yanal ötelenmesi önlenmeyen): $k \ge 1.0$

## TS 500 Narinlik İhmal Sınırı

Bir kolonun narinlik etkileri ihmal edilip kısa kolon sayılabilmesi için narinlik oranının şu sınırı aşmaması gerekir:

\`\`\`
Ötelenmesi önlenmiş çerçevelerde: λ ≤ 34 - 12 × (M1 / M2)  (veya λ ≤ 22)
\`\`\`

Bu sınır aşıldığında kolon **narin kolon** kabul edilir ve ikinci mertebe moment hesabı (moment büyütme yöntemi) zorunlu hale gelir.`,
      subsections: [],
    },
    {
      id: "moment-buyutme-yontemi",
      title: "TS 500 Moment Büyütme Yöntemi ($\delta$)",
      content: `TS 500'de narin kolonların ikinci mertebe etkileri, birinci mertebe tasarım momentinin bir **moment büyütme katsayısı ($\delta$)** ile çarpılmasıyla pratik olarak hesaba katılır:

\`\`\`
Md = δ × M1

δ = Cm / [ 1 - (Nd / Ncr) ] ≥ 1.0
\`\`\`

- **$N_d$:** Tasarım eksenel yükü
- **$N_{cr}$:** Euler Kritik Burkulma Yükü ($N_{cr} = \pi^2 \cdot (EI)_{\text{etkin}} / l_k^2$)
- **$C_m$:** Uç momentlerinin oranına bağlı moment gradyanı katsayısı ($C_m = 0.6 + 0.4 \cdot (M_1/M_2) \ge 0.4$)

> [!NOTE]
> **Tek Eğrilik vs Çift Eğrilik:** Uç momentleri kolonu aynı yönde büküyorsa (tek eğrilik) $C_m$ daha büyüktür ve narinlik etkisi olumsuzdur. Zıt yönlerde büküyorsa (S-çiziyorsa - çift eğrilik) $C_m$ küçülür ve narinlik etkisi azalır.`,
      subsections: [],
    },
    {
      id: "global-ve-lokal-p-delta",
      title: "Global $P-\Delta$ vs Lokal $P-\delta$ Etkisi",
      content: `Yüksek binalarda ikinci mertebe etkileri iki seviyede ele alınır:

1. **Global $P-\Delta$ Etkisi:** Tüm binanın yatay deprem veya rüzgâr yükü altında kat bazında ötelenmesinden ($\Delta$) kaynaklanır. TBDY 2018 uyarınca İkinci Mertebe Gösterge Parametresi ($\theta$) ile kontrol edilir:
   \`\`\`
   θ = (ΣPd × Δi) / (Vfi × hi) ≤ 0.12 (veya 0.20)
   \`\`\`
2. **Lokal $P-\delta$ Etkisi:** Kolonun kendi ekseni boyunca yanal eğrilmesinden ($\delta$) doğan eleman bazındaki moment büyütmesidir.

> [!WARNING]
> Global $P-\Delta$ analizinin yapılmış olması, narin kolonların lokal $P-\delta$ etkisinin otomatik olarak çözüldüğü anlamına gelmez. Narin kolonlarda eleman içi elastik plastik burkulma büyütmesi ($\delta$) ayrıca kontrol edilmelidir.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Tasarım Hataları

1. **Kat yüksekliği fazla kolonlarda narinliği ihmal etmek:** Yüksek tavanlı düğün salonu, fabrika veya atrium kolonlarında narinliği kontrol etmeden kısa kolon gibi çözmek.
2. **Etkin boy katsayısını ($k$) daima 1.0 almak:** Konsol veya yanal ötelenmeli kolonlarda $k > 1.0$ olduğunu gözden kaçırmak.
3. **Sünmenin narinliğe etkisini yok saymak:** Sabit yüklerin zamanla betonda sünme oluşturarak $EI$'yi düşürdüğünü ve burkulma riskini artırdığını dikkate almamak.
4. **Zayıf eksen narinliğini kontrol etmemek:** Kolon kesiti bir doğrultuda geniş ($b = 800\text{ mm}$), diğer doğrultuda dar ($h = 300\text{ mm}$) ise zayıf eksende $i_y$ çok küçüktür ve kolon o eksende narinleşir.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki narinlik hesapları aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 10.2)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 4 ve 7 (İkinci Mertebe Gösterge Parametresi)
- **TS EN 1992-1-1 (EC2)** — Slender Columns and Second-Order Effects with Cm Factor`,
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
    "ts500-kolon-pm-etkilesimi",
    "ts500-donati-orani-sinirlari",
    "ts500-kiris-sehim-kontrolu",
  ],
  tags: ["narin kolon", "ikinci mertebe", "narinlik oranı", "burkulma boyu", "lk", "moment büyütme katsayısı", "P-delta"],
};

export const ts500NarinKolon = buildTs500Article(spec);
