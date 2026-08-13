/**
 * TS 500 — Konsol (Konsollu Kiriş) Tasarımı
 *
 * Kaynak MD: TS500_Bolum_04_Surekli_Kiris_Moment_Dagilimi_Konsol.md (Bölüm 83–130)
 *
 * UYARI: Konsol kenetlenme boyları, sehim sınırları ve TBDY 2018 kuralları için
 * yürürlükteki standart metinleri resmi kaynaktan doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-konsol-kiris-tasarimi",
  title: "Konsol (Konsollu Kiriş) Tasarımı",
  description:
    "Balkon, çıkma ve kanopi gibi konsol elemanlarda moment ve kesme diyagramları, üst donatı hesabı, ankraj kuralları, sehim hassasiyeti ve şantiyede sık yapılan hatalar.",
  image: "/covers/ts500/egilme-donatisi.png",
  readTime: "11 dk",
  keywords: [
    "konsol kiriş",
    "konsol tasarımı",
    "balkon kirişi",
    "üst donatı",
    "ankastre mesnet",
    "konsol sehmi",
    "ankraj",
    "parapet yükü",
    "TBDY konsol",
  ],
  sections: [
    {
      id: "konsol-davranisi",
      title: "Konsol Kirişlerin Ana Statik Davranışı",
      content: `Bir ucu mesnetlenmiş (ankastre), diğer ucu serbest olan taşıyıcı elemanlara **konsol** denir (balkon kirişleri, bina çıkmaları, saçaklar ve kanopiler).

Düşey yerçekimi yükleri altında konsollarda:
- **Maksimum moment ($M_{\max}$) sabit ankastre mesnette** oluşur ($M_d < 0$).
- **Maksimum kesme kuvveti ($V_{\max}$) sabit ankastre mesnette** oluşur.
- Serbest uçta moment ve kesme sıfırdır.

## En Kritik Donatı Kuralı: Çekme Üsttedir!

Eğilme altında konsolun üst lifleri uzar (çekme), alt lifleri kısalır (basınç).

> [!IMPORTANT]
> **Konsol kiriş ve döşemelerde ana çekme donatısı ÜSTTEDİR.**
> Şantiyelerde yapılan en ölümcül hata, konsol üst donatısının üzerine basılarak aşağı kayması veya alt yüzeye yakın yerleştirilmesidir. Çekme donatısı aşağı kayarsa faydalı yükseklik ($d$) ciddi şekilde küçülür ve konsol aniden göçebilir.`,
      subsections: [],
    },
    {
      id: "statik-formuller",
      title: "Konsol Moment ve Kesme Formülleri",
      content: `Konsol boyu $L$ olmak üzere ankastre mesnetteki tasarım iç kuvvetleri:

## 1. Düzgün Yayılı Yük ($w$)

\`\`\`
Mesnet Momenti: M_sabit = - (w × L²) / 2
Mesnet Kesmesi: V_sabit = w × L
\`\`\`

## 2. Serbest Uç Noktasal Yükü ($P$) — Parapet/Korkuluk

\`\`\`
Mesnet Momenti: M_sabit = - P × L
Mesnet Kesmesi: V_sabit = P
\`\`\`

## 3. Kombine Yük (Düzgün Yayılı Yük + Uç Parapet Yükü)

\`\`\`
M_sabit = - [ (w × L²) / 2 + P × L ]
V_sabit = w × L + P
\`\`\`

> [!WARNING]
> **Parapet Yükü Uyarısı:** Balkon ucundaki parapet veya duvar yükünü tüm konsola eşit yayılı ($w$) olarak dağıtmak güvensiz hesap yaratabilir. Uç yükünün kolu ($L$) maksimum olduğundan moment bileşeni doğrudan $P \cdot L$ olarak eklenmelidir.`,
      subsections: [],
    },
    {
      id: "egilme-ve-ankraj",
      title: "Konsol Eğilme Tasarımı ve Ankraj Zorunluluğu",
      content: `Konsol mesnet kesitinde ($b \times h$) üst donatı hesabı yapılır:

\`\`\`
d = h - c_üst - φ_etriye - φ_boyuna / 2
a = (As × fyd) / (0.85 × fcd × b)
Mr = As × fyd × (d - a/2)  ≥  Md
\`\`\`

## Ankraj ve Arka Açıklığa Uzatma Kuralları

Konsol üst donatısı en büyük çekme gerilmesini tam mesnet yüzünde taşır. Donatının mesnet yüzünde bitirilmesi durumunda kenetlenme sağlanamaz ve eleman göçer.

- **Arka Açıklık Varsa:** Konsol üst donatısı mesnetten sonra iç açıklığın içine en az **$1.5 \cdot L_{\text{konsol}}$** veya **kenetlenme boyu ($l_b$)** kadar kesintisiz uzatılmalıdır.
- **Perde/Kolon Bağlantısı Varsa:** Üst donatı kolon veya perde içine girerek **90° standart kanca** ile kenetlenmelidir ($l_b$ boyu sağlanmalıdır).`,
      subsections: [],
    },
    {
      id: "konsol-sehmi-ve-uzunluk",
      title: "Konsol Sehmi ve Boyut Hassasiyeti ($L^4$ Etkisi)",
      content: `Konsollar sehim açısından en hassas betonarme elemanlardır. Yayılı yük altında elastik uç sehmi:

\`\`\`
δ_tip = (w × L⁴) / (8 × E × I)
\`\`\`

Sehim **konsol boyunun dördüncü kuvvetiyle ($L^4$)** orantılıdır!

## Boyut Artışının Sehime Etkisi

Konsol boyu $L = 1.50\text{ m}$'den $L = 2.00\text{ m}$'ye çıkarıldığında (%33 uzama):

- **Moment Artışı:** $(2.00 / 1.50)^2 = 1.78$ → Moment **%78 artar.**
- **Sehim Artışı:** $(2.00 / 1.50)^4 = 3.16$ → Sehim **3.16 katına çıkar (%216 artış)!**

> [!IMPORTANT]
> **Sehim Çözümü Donatı Değil, Yüksekliktir ($h$):**
> Konsol sehimini çözmek için donatıyı artırmak yetersiz kalır. Atalet momenti $I \propto h^3$ olduğundan sehim problemleri ancak **kiriş/döşeme yüksekliğini ($h$) artırarak** veya arka mesnet rijitliğini iyileştirerek çözülür.`,
      subsections: [],
    },
    {
      id: "tbdy-2018-konsol-kurallari",
      title: "TBDY 2018 Deprem Yönetmeliği Konsol Kuralları",
      content: `TBDY 2018 Bölüm 7 uyarınca düşey deprem etkisi altındaki konsollar için özel kurallar geçerlidir:

1. **Düşey Deprem İvmesi Etkisi:** Konsol elemanlar düşey deprem ivmesinden ($E_z$) doğrudan etkilenir. Düşey deprem yükü birleşimlerinde donatı hesabı yapılmalıdır.
2. **Tersinir Yük Durumu:** Rüzgâr emmesi veya düşey ivme nedeniyle konsolda ters yönde moment oluşma riski varsa alt yüzeye de emniyet donatısı konulmalıdır.
3. **Sehpa Zorunlulukları:** Konsol üst donatılarının döküm sırasında aşağı çökmesini önlemek için şantiyede rijit **donatı sehpaları** kullanılmalıdır.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Şantiye ve Tasarım Hataları

1. **Üst donatının alta çökmesi:** Donatı sehpası konulmaması veya usta/işçi basması sonucu pas payının 3 cm yerine 10 cm'ye çıkması ve $d$'nin küçülmesi.
2. **Konsol donatısını kolon yüzünde kesmek:** Ankraj/kenetlenme boyunu ($l_b$) bırakmamak.
3. **Balkon ucundaki parapet yükünü unutup sadece döşeme yüküyle hesap yapmak.**
4. **Konsol boyunu mimari istekle uzatıp yüksekliği ($h$) değiştirmemek:** Şiddetli sehim ve sarkma problemlerine yol açmak.
5. **Alt donatıyı sıfırlamak:** Tersinir yükler ve yapım aşaması için konsol altında da minimum donatı bulunmalıdır.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki hesap yöntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 6.3, 7.2)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 7 (Düşey Deprem Etkisi)
- **TS EN 1992-1-1 (EC2)** — Cantilever Design and Deflection`,
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
    "ts500-surekli-kiris-moment-dagilimi",
    "ts500-egilme-donatisi-hesabi",
    "ts500-kiris-sehim-kontrolu",
  ],
  tags: ["konsol kiriş", "konsol tasarımı", "balkon kirişi", "üst donatı", "ankraj", "sehim", "L4 etkisi"],
};

export const ts500KonsolKiris = buildTs500Article(spec);
