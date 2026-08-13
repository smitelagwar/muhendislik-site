/**
 * TS 500 — Tekil ve Birleşik Temel Tasarımı
 *
 * Kaynak MD: TS500_Bolum_09_Tekil_Birlesik_Radye_Temel_Kirisi_Bodrum_Perdesi.md (Bölüm 36–90)
 *
 * UYARI: Geoteknik taşıma gücü (qem), eksantrik zemin gerilmeleri, tek yönlü kesme
 * ve zımbalama kontrolleri TS 500 ve TBDY 2018 Bölüm 16'dan doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-tekil-birlesik-temel-tasarimi",
  title: "Tekil ve Birleşik Temel Tasarımı",
  description:
    "Tekil (münferit) ve birleşik temel boyutlandırması, zemin Emniyet gerilmesi (qem), eksantrik zemin taban basıncı, tek yönlü kesme ve donatı detayları.",
  image: "/covers/ts500/temel-radye.png",
  readTime: "11 dk",
  keywords: [
    "tekil temel",
    "birleşik temel",
    "zemin emniyet gerilmesi",
    "qem",
    "taban basıncı",
    "eksantrik yük",
    "tek yönlü kesme",
    "temel donatısı",
    "filiz donatısı",
  ],
  sections: [
    {
      id: "geoteknik-vs-betonarme",
      title: "Temel Tasarımında 2 Temel Boyutlandırma Adımı",
      content: `Temel tasarımı iki farklı mühendislik disiplininin kesişimindedir:

1. **Geoteknik Boyutlandırma (Plan Boyutu $B \times L$):** Temel taban alanının zeminin emniyetle taşıyabileceği seviyede tutulması ($q_{\max} \le q_{\text{em}}$). Servis yükleri ($G+Q$) kullanılır.
2. **Betonarme Boyutlandırma (Kalınlık $h$ ve Donatı $A_s$):** Temel beton kütlesinin eğilme, tek yönlü kesme ve zımbalama altında kırılmaması. Tasarım yükleri ($1.4G + 1.6Q$ veya $1.0G + 1.0Q \pm 1.0E$) kullanılır.

> [!IMPORTANT]
> **Plan Boyutunu Zemin Belirler, Kalınlık ve Donatıyı Betonarme Belirler.**
> Zemin zayıfsa temel taban alanı ($B \times L$) büyütülür. Kolon yükü yüksekse temel kalınlığı ($h$) ve donatı alanı ($A_s$) büyütülür.`,
      subsections: [],
    },
    {
      id: "tekil-temel-tasarimi",
      title: "Tekil (Münferit) Temel Tasarımı",
      content: `Tek bir kolonun altındaki bağımsız taban plağıdır ($B \times L$).

## 1. Zemin Taban Basıncı ($q$)

- **Merkezi Yüklü Tekil Temel ($M = 0$):**
  \`\`\`
  q = (G + Q) / (B × L)  ≤  qem
  \`\`\`
- **Eksantrik Yüklü Tekil Temel ($M \neq 0$):** Kolondan gelen moment nedeniyle taban gerilmesi trapez veya üçgen olur ($e = M / N$):
  \`\`\`
  qmax,min = (N / A) ± (M / W)
  qmax ≤ 1.50 × qem  (depremli durumda TBDY Bölüm 16 esasları)
  \`\`\`

## 2. Eğilme Momenti ve Donatı

Kritik eğilme kesiti **kolon yüzüdür.** Kolon yüzündeki konsol zemin basıncından oluşan moment hesabı:

\`\`\`
M_tasarım = q_tasarım × L_konsol² / 2
As = M_tasarım / (fyd × z)
\`\`\`

## 3. Tek Yönlü Kesme (Kiriş Kesmesi)

Kritik kesme kesiti **kolon yüzünden $d$ mesafededir.** Beton kesme kapasitesi $V_c = 0.52 \cdot f_{ctd} \cdot B \cdot d$ etriyesiz olarak $V_d \le V_c$ şartını sağlamalıdır.`,
      subsections: [],
    },
    {
      id: "birlesik-temel-tasarimi",
      title: "Birleşik (Müstereki) Temel Tasarımı",
      content: `İki veya daha fazla kolonun birbirine çok yakın olduğu veya arsa sınırında kolonun dışa taşamadığı durumlarda iki kolon tek bir temel altında birleştirilir.

## Neden Birleşik Temel Yapılır?

- **Arsa Sınırı Kolonu:** Kolon arsa sınırındadır; dışa doğru temel pabuç çıkıntısı yapılamaz.
- **Yakın Kolonlar:** İki tekil temel yapıldığında pabuçlar birbiriyle çakışır.

## Bileşke Yük Merkezliği (Uniform Gerilme Şartı)

Zeminde düzgün (üniform) taban gerilmesi elde etmek için **temel alanının ağırlık merkezi ile kolondan gelen bileşke kuvvetin ($R = N_1 + N_2$) etki çizgisi çakıştırılmalıdır.**

\`\`\`
x_bileşke = (N1 × x1 + N2 × x2) / (N1 + N2)
Temel Boyu L = 2 × x_bileşke
\`\`\`

> [!NOTE]
> Birleşik temeller iki kolon arasında üst yüzde çekme (negatif moment) yaparlar. Bu nedenle birleşik temellerde kolonlar arasında **ÜST DONATI** zorunludur.`,
      subsections: [],
    },
    {
      id: "bag-kirisleri",
      title: "Temel Bağ Kirişleri (TS 500 ve TBDY 2018)",
      content: `Tekil temeller deprem sırasında birbirinden bağımsız hareket edemez. TBDY 2018 uyarınca tüm tekil temeller iki doğrultuda **Temel Bağ Kirişleri (Hatıllar)** ile birbirine bağlanmalıdır.

- **Görev:** Temeller arasındaki farklı oturma ve yanal deprem ötelenmelerini engellemek.
- **Donatı:** Bağ kirişleri hem çekme hem basınç taşıyacak şekilde kesintisiz boyuna donatılı ve kapalı etriyeli olmalıdır.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Tasarım Hataları

1. **Eksantrik gerilmeyi ihmal edip sadece $N/A$ kontrolü yapmak:** Kolon momentinden kaynaklanan $q_{\max}$ gerilmesini zemin dayanımıyla karşılaştırmamak.
2. **Birleşik temelde üst donatıyı unutmak:** Kolonlar arasında oluşan negatif momenti göz ardı edip yalnızca alt donatı koymak.
3. **Temelde pas payını az tutmak:** Toprakla temas eden temellerde pas payı **en az 50 mm** (grobetonsuz dökümde 75 mm) olmalıdır. 25 mm pas payı korozyona yol açar.
4. **Zımbalama kontrolünü yapmamak.**`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki hesap yöntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 12.1, 12.2)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 16 (Temel Tasarımı)
- **TS EN 1997-1 (EC7)** — Foundation Design`,
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
    "ts500-zemin-kirisi-bodrum-perdesi",
    "ts500-doseme-zimbalama-guvenligi",
  ],
  tags: ["tekil temel", "birleşik temel", "zemin emniyet gerilmesi", "qem", "taban basıncı", "eksantrik yük", "bağ kirişi"],
};

export const ts500TekilTemel = buildTs500Article(spec);
