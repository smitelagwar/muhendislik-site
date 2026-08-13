/**
 * TS 500 - Kolon Tasarimi: Eksenel Yuk + Moment Etkilesimi (P-M Diyagrami)
 *
 * Kaynak MD: TS500_Bolum_07_Kolon_PM_Narinlik_Ikinci_Mertebe.md (Bolum 1-40)
 *
 * UYARI: Kolon eksenel yuk sinirlari (Nd <= 0.40*Ac*fcd), P-M diyagrami sinirlari
 * ve TBDY 2018 guclu kolon-zayif kiris kurallari resmi belgeden dogrulanmalidir.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-kolon-pm-etkilesimi",
  title: "Kolon Tasarimi: Eksenel Yuk + Moment Etkilesimi (P-M Diyagrami)",
  description:
    "Betonarme kolonlarda bilesik egilme (N+M), P-M etkilesim diyagraminin turetilmesi, kirilma bolgeleri (basinc, dengeli, cekme) ve TBDY 2018 kolon kurallari.",
  image: "/covers/ts500/kolon-pm.png",
  readTime: "12 dk",
  keywords: [
    "kolon tasarimi",
    "P-M diyagrami",
    "eksenel yuk",
    "bilesik egilme",
    "tarafsiz eksen",
    "dengeli kirilma",
    "guclu kolon",
    "Nd max",
    "TBDY kolon",
  ],
  sections: [
    {
      id: "gercek-kolon-davranisi",
      title: "Gercek Kolonlar Saf Basinc Tasiyor mu?",
      content: `Hayir. Gercek binalarda saf eksenel basinc altinda calisan kolon yok denecek kadar azdir.

Kolonlarda eksenel yuk ile birlikte **egilme momenti (Md)** olusmasinin ana nedenleri:
- Cerceve davranisi nedeniyle kirislerden aktarilan mesnet momentleri
- Yatay deprem (E) ve ruzgar (W) yukleri
- Yuk eksantrisitesi ve imalat toleranslari
- Ikinci mertebe etkileri (P-Delta ve P-delta)

Bu nedenle kolon tasarimi saf basinc hesabi degil, **Eksenel Yuk + Moment Etkilesimi (Bilesik Egilme)** hesabidir.`,
      subsections: [],
    },
    {
      id: "pm-diyagrami-nedir",
      title: "P-M Etkilesim Diyagrami Nedir ve Nasil Okunur?",
      content: `P-M diyagrami, belirli bir kolon kesiti ve donati duzeni icin kolonun emniyetle tasiyabilecegi tum (N, M) ikililerinin sinir egrisidir:

- **Eğrinin İçi:** KESİT GÜVENLİ dir (Nd <= Nr ve Md <= Mr).
- **Eğrinin Dışı:** KESİT YETERSİZDİR (yikilma/gocme riski).

## P-M Egrisi 3 Ana Bolgesi

**1. Basinc Kirilmasi Bolgesi (N > Nb):**
Yuksek eksenel yuk altinda beton ezilerek gevrek kirilir. Eksenel yuk arttikca kesitin moment tasima kapasitesi **azalir**.

**2. Dengeli Kirilma Noktasi (Nb, Mb):**
Betonun ezilmesi ile cekme donatisinin akmasi ayni anda gerceklesiyor. Kesitin **maksimum moment tasidigi** noktadir.

**3. Cekme Kirilmasi Bolgesi (N < Nb):**
Dusuk eksenel yuk altinda cekme donatisi akar, kesit sunek davranir. Eksenel yuk arttikca moment kapasitesi **artar** (eksenel yuk cekme catagini kapatici etki yapar).`,
      subsections: [],
    },
    {
      id: "pm-noktalarinin-hesabi",
      title: "P-M Egrisindeki Kritik Noktalarin Hesabi",
      content: `## 1. Saf Basinc Noktasi (Nmax)

Hic moment olmadan (M = 0) kesitin tasiyabilecegi teorik maksimum eksenel yuk:

\`\`\`
No = 0.85 x fcd x (Ac - Ast) + Ast x fyd

TS 500 ust siniri: Nmax = 0.85 x No
\`\`\`

## 2. Saf Egilme Noktasi (M0)

Hic eksenel yuk olmadan (N = 0) kesitin kiris gibi tasiyabilecegi moment kapasitesidir.

## 3. Saf Cekme Noktasi (Nt)

Beton cekme tasimadigi icin yalnizca boyuna donati cekme kapasitesidir:

\`\`\`
Nt = - Ast x fyd
\`\`\``,
      subsections: [],
    },
    {
      id: "tbdy-2018-kolon-kurallari",
      title: "TBDY 2018 Kolon Tasarim Kurallari",
      content: `Deprem bolgelerinde kolonlar icin TS 500 minimumlarinin otesinde TBDY Bolum 7 kurallari uygulanir:

## 1. Maksimum Eksenel Yuk Siniri (Nd,max)

\`\`\`
Nd <= 0.40 x fck x Ac    (veya TBDY guncel katsayisi)
\`\`\`

## 2. Guclu Kolon - Zayif Kiris Ilkesi

Depremde plastik mafsallarin kolonlarda degil kirislerde olusmasini saglamak icin her birlesimdusumu noktasinda:

\`\`\`
sum(Mrc) >= 1.20 x sum(Mrb)

sum(Mrc): Birlesime baglanan kolonlarin moment kapasiteleri toplami
sum(Mrb): Birlesime baglanan kirislerin moment kapasiteleri toplami
\`\`\`

## 3. Kolon Sarilma Bolgesi

Kolon alt ve ust uclarinda en az lb = max(h_max, ln/6, 500 mm) uzunlugunda kapali etriyeler ve cirozlar ile sarilma bolgesi olusturulur (s <= 100 mm).`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sik Yapilan Hatalar",
      content: `## Tasarim ve Yazilim Hatalari

1. **Kolonu sadece saf eksenel yukle boyutlandirmak:** Moment etkisini ihmal edip P-M diyagrami kontrolu yapmamak.
2. **Yuksek eksenel yukun moment kapasitesini dusturmesini unutmak:** N > Nb bolgesinde eksenel yuk arttikca moment tasima gucu azalir.
3. **Cift eksenli egilmede tek eksenli kontrol yapmak:** Iki yonlu moment etkilesimini ihmal etmek.
4. **TBDY Nd,max sinirini asmak:** Kolon kesitini asiri kucultup gevrek ezilme riskine yol acmak.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanagi",
      content: `Bu makaledeki hesap yontemleri asagidaki resmi standartlara dayanmaktadir:

- **TS 500 (2000)** — Betonarme Yapilarin Tasarim ve Yapim Kurallari (Md. 7.4, 10.1)
- **TBDY 2018** — Turkiye Bina Deprem Yonetmeligi, Bolum 7
- **TS EN 1992-1-1 (EC2)** — Column Biaxial Bending and P-M Interaction`,
      subsections: [],
    },
  ],
  references: [
    {
      label: "AFAD — Turkiye Bina Deprem Yonetmeligi 2018",
      href: "https://www.afad.gov.tr/turkiye-bina-deprem-yonetmeligi",
    },
    {
      label: "TSE — TS 500 Betonarme Standardi",
      href: "https://www.tse.org.tr",
    },
  ],
  relatedSlugs: [
    "ts500-narin-kolon-ikinci-mertebe",
    "ts500-donati-orani-sinirlari",
    "ts500-egilme-donatisi-hesabi",
  ],
  tags: ["kolon tasarimi", "P-M diyagrami", "eksenel yuk", "bilesik egilme", "guclu kolon", "TBDY kolon"],
};

export const ts500KolonPm = buildTs500Article(spec);
