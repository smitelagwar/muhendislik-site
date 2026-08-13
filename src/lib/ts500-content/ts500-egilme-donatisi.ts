/**
 * TS 500 — Eğilme Donatısı Hesabı: Tek ve Çift Donatılı Kesitler
 *
 * Kaynak MD: TS500_Bolum_03_Egilme_Tek_Cift_Donatili_T_Kiris.md (Bölüm 1–24)
 *
 * UYARI: Kesit taşıma gücü formülleri ve süneklik sınırları için TS 500 ve
 * TBDY 2018'in yürürlükteki metinleri resmi kaynaktan doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-egilme-donatisi-hesabi",
  title: "Eğilme Donatısı Hesabı: Tek ve Çift Donatılı Kesitler (TS 500)",
  description:
    "Dikdörtgen betonarme kesitlerde tarafsız eksen, eşdeğer basınç bloğu, tek ve çift donatılı eğilme hesabı adımları ve sayısal örnekler.",
  image: "/covers/ts500/egilme-hesabi.png",
  readTime: "12 dk",
  keywords: [
    "eğilme donatısı",
    "tek donatılı kesit",
    "çift donatılı kesit",
    "tarafsız eksen",
    "eşdeğer basınç bloğu",
    "faydalı yükseklik",
    "moment kapasitesi",
    "Mr",
    "Md",
    "süneklik",
  ],
  sections: [
    {
      id: "egilme-davranisi",
      title: "Betonarme Kesitlerin Eğilme Davranışı",
      content: `Bir betonarme kiriş aşağı doğru düşey yük altında pozitif eğilme momenti gördüğünde:
- **Üst lifler kısalır** → Basınç gerilmesi oluşur
- **Alt lifler uzar** → Çekme gerilmesi oluşur

Beton çekmede zayıf olduğu için çatlama sonrasında (M > Mcr) alt bölgedeki çekme kuvvetinin ana taşıyıcısı boyuna donatıdır.

> [!NOTE]
> Pozitif momentte beton üstte basınç, donatı altta çekme taşır. Negatif momentte (mesnetlerde) durum tersine döner: beton altta basınç, üst boyuna donatı çekme taşır. Bu nedenle "üst demir / alt demir" ifadesi yerine **"çekme donatısı / basınç donatısı"** ifadesini kullanmak daha doğrudur.`,
      subsections: [],
    },
    {
      id: "temel-kabuller",
      title: "Eğilme Hesabının Temel Kabulleri",
      content: `TS 500 taşıma gücü yöntemine göre eğilme hesabındaki temel kabuller:

1. **Düzlem Kesit Hipotezi (Bernoulli):** Eğilmeden önce düz olan kesitler eğilmeden sonra da düz kalır (şekil değiştirme dağılımı doğrusaldır).
2. **Aderans Uyumu:** Beton ile donatı arasında tam yapışma vardır ($\varepsilon_s = \varepsilon_c$).
3. **Beton Çekme Dayanımı İhmal Edilir:** Taşıma gücü hesabında çekme bölgesindeki betonun katkısı dikkate alınmaz.
4. **Eşdeğer Basınç Bloğu:** Basınç bölgesindeki betonun gerilme dağılımı $0.85 \cdot f_{cd}$ gerilmesine sahip $a = k_1 \cdot x$ derinliğinde eşdeğer dikdörtgen blokla temsil edilir.
5. **Nihai Beton Şekil Değiştirmesi:** Basınç yüzündeki betonun ezilme şekil değiştirmesi $\varepsilon_{cu} = 0.003$ alınır.`,
      subsections: [],
    },
    {
      id: "tek-donatili-hesap",
      title: "Tek Donatılı Dikdörtgen Kesit Hesabı",
      content: `"Tek donatılı kesit", eğilme hesabında basınç donatısına ihtiyaç duyulmadan yalnızca çekme donatısı ile Md momentinin karşılandığı kesittir (kesitin üstünde montaj donatısı bulunabilir, fakat hesap modelinde basınca katkısı alınmaz).

## İç Kuvvet Dengesi

\`\`\`
Çekme Kuvveti: T = As × fyd
Beton Basınç Kuvveti: C = 0.85 × fcd × b × a

ΣN = 0  →  T = C  →  As × fyd = 0.85 × fcd × b × a
\`\`\`

Buradan eşdeğer basınç bloğu derinliği (a):

\`\`\`
a = (As × fyd) / (0.85 × fcd × b)
\`\`\`

## Moment Kapasitesi (Mr)

İç kuvvet kolu $z = d - a/2$ olmak üzere:

\`\`\`
Mr = As × fyd × (d - a/2)

Tasarım Şartı: Md ≤ Mr
\`\`\`

> [!IMPORTANT]
> **Faydalı Yükselik ($d$):** Pozitif momentte $d = h - c - \phi_{etriye} - \phi_{boyuna}/2$ olarak hesaplanır. Moment kapasitesinde $d$'nin etkisi karesel olduğundan, kesit yüksekliğini ($h$) artırmak beton sınıfını artırmaktan daha etkili eğilme kapasitesi sağlar.`,
      subsections: [],
    },
    {
      id: "sayisal-ornek",
      title: "Sayısal Örnek: Tek Donatılı Kiriş Hesabı",
      content: `## Veriler

- Kiriş genişliği: $b = 300\text{ mm}$
- Kiriş yüksekliği: $h = 600\text{ mm}$ (Faydalı yüksekliği $d \approx 550\text{ mm}$)
- Beton: C30 ($f_{ck} = 30\text{ MPa} \rightarrow f_{cd} = 20\text{ MPa}$)
- Donatı: B420C ($f_{yk} = 420\text{ MPa} \rightarrow f_{yd} = 365.2\text{ MPa}$)
- Tasarım Momenti: $M_d = 180\text{ kNm}$ ($180 \times 10^6\text{ Nmm}$)

## 1. Gerekli Donatı Alanı ($A_s$) Hesabı

\`\`\`
Md = As × fyd × [d - (As × fyd) / (2 × 0.85 × fcd × b)]

180 × 10⁶ = As × 365.2 × [550 - (As × 365.2) / (2 × 0.85 × 20 × 300)]
\`\`\`

İkinci derece denklem çözüldüğünde:
**$A_{s,\text{hesap}} \approx 956\text{ mm}^2$**

## 2. Donatı Seçimi

4Ø18 seçilsin ($A_s = 4 \times 254 = 1016\text{ mm}^2$):

\`\`\`
a = (1016 × 365.2) / (0.85 × 20 × 300) ≈ 72.8 mm
z = 550 - 72.8 / 2 = 513.6 mm
Mr = 1016 × 365.2 × 513.6 = 190.5 × 10⁶ Nmm = 190.5 kNm

Mr (190.5 kNm) ≥ Md (180 kNm)  ✓ GÜVENLİ
\`\`\`

## 3. Donatı Oranı Kontrolü

\`\`\`
ρ = 1016 / (300 × 550) = 0.00616 (%0.62)
ρmin = 0.8 × fctd / fyd = 0.8 × 1.28 / 365.2 = 0.0028 (%0.28)

ρmin (%0.28) ≤ ρ (%0.62) ≤ ρmax (%1.5–2.0)  ✓ UYGUN
\`\`\``,
      subsections: [],
    },
    {
      id: "cift-donatili-kesit",
      title: "Çift Donatılı Kesit Hesabı",
      content: `Kiriş boyutları ($b \times h$) mimari kısıtlar nedeniyle büyütülemiyor ve tek donatılı kesitin maksimum donatı sınırı ($\rho_{\max}$) aşılıyorsa kesite **basınç donatısı ($A_s'$)** eklenerek çift donatılı hesap yapılır.

## Ne Zaman Çift Donatılı Hesap Yapılır?

- $M_d > M_{r,\max}$ (Tek donatılı kesitin taşıyabileceği maksimum momenti aşıyorsa)
- Sehim kontrolü gereği sünekliği ve zamana bağlı sünme sehimlerini azaltmak istendiğinde
- Deprem bölgelerinde çift yönlü moment değişimleri (alt ve üst yüzde tersinir momentler) nedeniyle

## İki Parçalı Hesap Yaklaşımı

\`\`\`
1. Parça: Dikdörtgen beton basınç bloğu + As1 çekme donatısı (Mr1 = Mr,max)
2. Parça: As' basınç donatısı + As2 çekme donatısı (Mr2 = Md - Mr,max)

Toplam Çekme Donatısı: As = As1 + As2
Toplam Basınç Donatısı: As' (Basınç donatısının aktığı kontrol edilir: εs' ≥ εyd)
\`\`\`

> [!WARNING]
> Basınç donatısının hesaba katılabilmesi için donatının etriyelerle burkulmaya karşı iyice sarılması gereklidir. Çift donatılı kirişlerde basınç donatısının bulunduğu bölgede etriye aralığı sıklaştırılmalıdır.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Tasarım Hataları

1. **Montaj donatısını hesap dışı tutup basınç donatısı yok sanmak:** Fiziksel donatı ile hesap modelini karıştırmak.
2. **Kiriş yüksekliği yerine genişliğini artırmaya çalışmak:** Moment kapasitesinde $d$'nin etkisi karesel ($d^2$), $b$'nin etkisi doğrusaldır. Kesit yüksekliğini artırmak çok daha etkilidir.
3. **Beton sınıfı artışının eğilme kapasitesini aynı oranda artıracağını sanmak:** Tek donatılı kirişte kapasiteyi belirleyen ana unsur donatı alanı ve $fyd$'dir. Beton sınıfını C25'ten C35'e çıkarmak kiriş eğilme kapasitesini sadece %3–5 civarında etkiler (iç kuvvet kolunu hafifçe büyütür).
4. **Donatı akma kontrolünü yapmadan $T = A_s \cdot f_{yd}$ yazmak:** Denge üstü kesitlerde donatı akmayabilir.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki hesap yöntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 7.1, 7.2)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 7 (Kiriş Eğilme Tasarımı)
- **TS EN 1992-1-1 (Eurocode 2)** — Betonarme Kesit Kapasite Hesap Yöntemleri`,
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
    "ts500-tablali-kiris",
    "ts500-donati-orani-sinirlari",
    "ts500-surekli-kiris-moment-dagilimi",
  ],
  tags: ["eğilme donatısı", "tek donatılı kesit", "çift donatılı kesit", "moment kapasitesi", "Mr"],
};

export const ts500EgilmeDonatisi = buildTs500Article(spec);
