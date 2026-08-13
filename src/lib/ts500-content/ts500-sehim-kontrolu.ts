/**
 * TS 500 - Betonarme Kirislerde Sehim Kontrolu
 *
 * Kaynak MD: TS500_Bolum_06_Sehim_Catlak_Kullanilabilirlik.md
 *
 * UYARI: Izin verilen sehim sinirlari (L/360, L/480 vb.), Branson etkin atalet
 * momenti (Ie) ve zamanla bagli surunme katsayilari TS 500'den dogrulanmalidir.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-kiris-sehim-kontrolu",
  title: "Betonarme Kirislerde Sehim Kontrolu",
  description:
    "Anlik ve zamana bagli (sunme + rotre) sehim hesabi, catlamis kesit atalet momenti (Icr), Branson etkin atalet formulu (Ie) ve izin verilen sehim sinirlari.",
  image: "/covers/ts500/sehim-catlak.png",
  readTime: "11 dk",
  keywords: [
    "sehim kontrolu",
    "kiris sehmi",
    "Branson formulu",
    "Ie",
    "Icr",
    "Ig",
    "sunme",
    "rotre",
    "kullanilabilirlik",
    "L/360",
    "L/480",
  ],
  sections: [
    {
      id: "sehim-nedir",
      title: "Sehim ve Kullanilabilirlik (SLS) Nedir?",
      content: `Betonarme bir kesitin tasima gucu bakindan emniyetli olmasi (kirilmamasi), elemanin kullanim acisindan sorunsuz oldugu anlamina gelmez.

Servis yukleri altinda asiri sehim (deformasyon):
- Bolme duvarlarinin, kapi ve pencere kasalarinin sikisip catlamasina
- Zemin kaplamalarinin, seramik ve tavan sivalarinin dokulmesine
- Kullanicilarda guvensizlik ve rahatsizlik hissine
- Duzeltilmesi imkansiz estetik problemlere

yol acar. Sehim kontrolu **Kullanilabilirlik Sinir Durumu (SLS)** altinda yapilir.`,
      subsections: [],
    },
    {
      id: "anlik-ve-uzun-sureli-sehim",
      title: "Anlik Sehim vs Zamana Bagli Sehim (Sunme ve Rotre)",
      content: `Betonarme sehim hesabi sadece ilk yukleme aniyla sinirli degildir:

## 1. Anlik (Ani) Sehim

Yuk uygulundigi anda meydana gelen elastik/catlamis deformasyondur.

## 2. Zamana Bagli Sehim

Sabit yukler altinda betonun zamana bagli **sunme (creep)** ve **rotre (shrinkage)** yapmasi nedeniyle zamanla sehim 2 ila 3 katina cikabilir.

\`\`\`
Toplam Uzun Sureli Sehim = Anlik(hareketli) + lambda x Anlik(sabit)

lambda = xi / (1 + 50 x rho')
\`\`\`

- **xi:** Zamana bagli surunme katsayisi (5 yil ve uzeri icin xi ~ 2.0)
- **rho':** Basinc donati orani = As' / (b x d)

> [!IMPORTANT]
> **Basinc Donatisinin Sehim Katkisi:** Basinc donatisi As' kesitteki surunme deformasyonunu engelleyerek zamana bagli sehim carpanini (lambda) ciddi oranda dusurebilir. Sehim problemi olan kirislerde basinc bolgesine ilave donati koymak cok etkili bir yontemdir.`,
      subsections: [],
    },
    {
      id: "branson-formulu",
      title: "Catlamis Kesit ve Branson Etkin Atalet Momenti (Ie)",
      content: `Betonarme kiris servis momenti (Ma), betonun catlama momentini (Mcr) astiktan sonra kesit catlar. Catlamis bolgede rijitlik dusuyor.

Kirisin boyunca bazi kesitler catlamis, bazilari catlamamisstir. TS 500'de ortalama rijitligi temsil eden **Branson Etkin Atalet Momenti (Ie)** kullanilir:

\`\`\`
Ie = (Mcr/Ma)^3 x Ig + [1 - (Mcr/Ma)^3] x Icr  <=  Ig
\`\`\`

- **Ig:** Brut beton kesiti atalet momenti
- **Icr:** Donusturulmus catlamis kesit atalet momenti
- **Mcr:** Beton catlama momenti
- **Ma:** Servis yukleri altindaki en buyuk egilme momenti

> [!NOTE]
> Ma <= Mcr ise kesit catlamamisstir ve Ie = Ig alinir. Ma > Mcr oldugunda Ie degeri Ig ile Icr arasinda bir deger alir.`,
      subsections: [],
    },
    {
      id: "izin-verilen-sinirlar",
      title: "TS 500 Izin Verilen Sehim Sinirlari",
      content: `TS 500 uyarinca sehim hesabi gerektirmeyen pratik **aciklik/yukseklik (L/h)** sinirlari:

Basit mesnetli kirislerde L/h <= 15, surekli kirislerde L/h <= 18 ve konsollarda L/h <= 7 saglaniyor ise detayli sehim hesabi yapilmayabilir.

## Izin Verilen Maksimum Sehim Sinirlari

| Eleman ve Sart | Izin Verilen Sehim |
|----------------|-------------------|
| Bolme duvari tasimayan catılar | L / 180 |
| Bolme duvari tasimayan doseme ve kirisler | L / 360 |
| Hassas kaplama tasiyan elemanlar (uzun sureli) | L / 480 |
| Su birikme riski olan cati konsollar | L / 480 veya daha siki |

> [!WARNING]
> Konsollarda sehim L^4 ile orantili oldugu icin acikligi %20 uzatmak sehimi 3 katina cikarabilir!`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sik Yapilan Hatalar",
      content: `## Tasarim Hatalari

1. **Brut atalet momentini (Ig) kullanmak:** Catlama sonrasinda Ig kullanmak sehimi 2-3 kat kucuk gosterir; mutlaka Branson formulu (Ie) kullanilmalidir.
2. **Surunme ve rotre sehimini ihmal etmek:** Sadece anlik sehimle kontrol yapip uzun donem sehim katlanmasini gozardi etmek.
3. **Basinc donatisinin sehim dusurme gucunu kullanmamak.**
4. **Konsol boyunu uzatip yuksekligi artirmamak.**`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanagi",
      content: `Bu makaledeki sehim yontemleri asagidaki resmi standartlara dayanmaktadir:

- **TS 500 (2000)** — Betonarme Yapilarin Tasarim ve Yapim Kurallari (Md. 13.1, 13.2)
- **TS EN 1992-1-1 (EC2)** — Deflection Control and Branson Formula`,
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
    "ts500-catlak-genisligi-kontrolu",
    "ts500-egilme-donatisi-hesabi",
    "ts500-konsol-kiris-tasarimi",
  ],
  tags: ["sehim kontrolu", "kiris sehmi", "Branson formulu", "Ie", "Icr", "sunme", "L/360", "L/480"],
};

export const ts500SehimKontrol = buildTs500Article(spec);