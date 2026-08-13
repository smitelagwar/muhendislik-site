/**
 * TS 500 — Radye Temellerde Eğilme ve Kesme Kontrolleri
 *
 * Kaynak MD: TS500_Bolum_09_Tekil_Birlesik_Radye_Temel_Kirisi_Bodrum_Perdesi.md (Bölüm 91–145)
 *
 * UYARI: Radye plak kalınlığı (h), ters döşeme momenti, zımbalama çevresi ve
 * TBDY 2018 yatak katsayısı (Winkler zemin modeli) esasları resmi belgeden doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-radye-temel-egilme-kesme",
  title: "Radye Temellerde Eğilme ve Kesme Kontrolleri",
  description:
    "Radye temel türleri (düz radye, kirişli radye), zemin yatak katsayısı (ks), kolon ve perde altı moment zarfları, alt ve üst donatı hesabı, radye zımbalama kontrolü.",
  image: "/covers/ts500/temel-radye.png",
  readTime: "12 dk",
  keywords: [
    "radye temel",
    "düz radye",
    "kirişli radye",
    "zemin yatak katsayısı",
    "ks",
    "radye zımbalama",
    "alt donatı",
    "üst donatı",
    "kolon şeridi",
    "TBDY radye",
  ],
  sections: [
    {
      id: "radye-temel-nedir",
      title: "Radye Temel Nedir ve Ne Zaman Tercih Edilir?",
      content: `Radye temel (plak temel), binanın tüm tabanını kaplayan devasa bir betonarme plaktır.

## Tercih Sebepleri

1. **Zemin Taşıma Gücü Düşükse:** Yapı yüklerini geniş bir alana yayarak zemin taban gerilmesini ($q$) minimize etmek.
2. **Tekil Temel Alanları Toplamı %50'yi Aşıyorsa:** Tekil veya şerit temellerin alanı bina taban alanının %50'sini geçiyorsa radye temel yapmak daha ekonomik ve pratiktir.
3. **Farklı Oturmaları (Differential Settlement) Önlemek:** Homojen olmayan zeminlerde binanın tek parça halinde üniform oturmasını sağlamak.
4. **Su Yalıtımı ve Bodrum Katları:** Yeraltı su seviyesinin yüksek olduğu durumlarda bohçalama yalıtım yapmak için düz radye yüzeyi idealdir.`,
      subsections: [],
    },
    {
      id: "radye-turleri",
      title: "Radye Temel Türleri: Düz Radye vs Kirişli Radye",
      content: `Radye temeller iki ana grupta tasarlanır:

## 1. Düz Radye (Plak Radye)

Tüm taban sabitleştirilmiş uniform kalınlıkta ($h = 60 - 150\text{ cm}$) düz plak olarak dökülür.
- **Avantajı:** Kalıp işçiliği ve donatı işçiliği son derece basittir. Yalıtım uygulaması kolaydır.
- **Dezavantajı:** Kolon altlarında zımbalama ve moment yüksek olduğu için plak kalınlığı fazla çıkabilir.

## 2. Kirişli Radye

Kolon ve perde aksları altında kalın zemin kirişleri, kirişlerin arasında ise daha ince radye plakları bulunur.
- **Üstten Kirişli Radye:** Kirişler radye plaktan yukarı doğru çıkar (bodrum kat kullanımını zorlaştırabilir).
- **Alttan Kirişli Radye:** Kirişler toprağa doğru kazılır (hafriyat işçiliği zordur).

> [!NOTE]
> Günümüz modern konut ve yüksek binalarında kalıp kolaylığı ve rijitlik nedeniyle **Düz Radye Plak** çözümü ezici çoğunlukla tercih edilmektedir.`,
      subsections: [],
    },
    {
      id: "radye-statik-davranisi",
      title: "Radye Temelde Ters Döşeme Mantığı ve Donatı Yerleşimi",
      content: `Radye temel, **aşağıdan yukarıya doğru zemin tepki basıncıyla yüklenmiş ters döşeme** gibi çalışır:

- **Kolon Altları (Mesnetler):** Kolonlar zemine basar. Zemin basıncı plak ortasını yukarı iterken kolon donatıyı tutar. Bu nedenle kolon altlarında **ÜST DONATI (Mesnet Donatısı)** çekme taşır.
- **Açıklık Ortaları:** İki kolon veya perde arasındaki açıklıkta zemin yukarı iter. Bu nedenle açıklık ortasında **ALT DONATI (Açıklık Donatısı)** çekme taşır.

\`\`\`
Kolon Altları   → Üst Donatı Çekmede (Negatif Moment)
Açıklık Ortası  → Alt Donatı Çekmede (Pozitif Moment)
\`\`\`

> [!WARNING]
> Klasik döşemenin tam tersidir! Normal döşemede açıklıkta alt donatı, mesnette üst donatı bulunurken; radyede zemin basıncı aşağıdan yukarı ittiği için kolon altında üst donatı yoğunlaşır.`,
      subsections: [],
    },
    {
      id: "radye-zimbalama-ve-kesme",
      title: "Radye Temellerde Zımbalama ve Kesme Kontrolü",
      content: `Radye temellerde kalınlığı belirleyen ana unsur çoğu zaman eğilme değil, **kolon ve perde etrafındaki zımbalama ve tek yönlü kesme** kontrolleridir.

## Radye Zımbalama Kontrolü

Kolondan radyeye aktarılan eksenel yük ($N_d$), zımbalama kritik çevresi ($u_p$) içindeki zemin tepki basıncı düşüldükten sonra net zımbalama kuvvetini ($V_{pd}$) verir:

\`\`\`
Vpd = Nd - (q_zemin × A_kritik)
vpd = Vpd / (up × d)  ≤  vpr
\`\`\`

Radye temellerde radye donatısını zımbalama donatısı olarak kullanmak yerine **radye plak kalınlığını ($h$) artırmak** çok daha güvenli ve pratik bir çözümdür (ör. $h = 80\text{ cm} \rightarrow 100\text{ cm}$).

## Perde Uçları Zımbalaması

TBDY 2018 uyarınca radye temellerde sadece kolonlar değil, **perde uç bölgeleri ve perde köşeleri** de zımbalama ve kesme açısından kritik çevre hesabı yapılarak kontrol edilmelidir.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Tasarım Hataları

1. **Zemin Yatak Katsayısını ($k_s$) sabit/sonsuz rijit almak:** Zeminin yay davranışını ihmal edip radye plağın elastik oturma ve moment dağılımını yanlış hesaplamak (Winkler zemin modeli kullanılmalıdır).
2. **Kolon altındaki üst donatıyı eksik koymak:** Ters döşeme mantığını unutup kolon altında üst donatı yoğunlaştırmasını yapmamak.
3. **Radye pas payını az tutmak:** Radye alt donatısında grobeton üzeri pas payı **en az 50 mm** olmalıdır.
4. **Perde altlarındaki zımbalama ve kayma gerilmesini kontrol etmemek.**
5. **Radye sehpa donatısını unutmak:** Çift sıra ağır donatı ağının (ör. Ø20/15cm) döküm sırasında çökmesini önlemek için rijit sehpalar konulmalıdır.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki radye hesap yöntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 12.3)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 16 (Radye Temel Tasarımı ve Winkler Zemin Yatak Modeli)
- **TS EN 1997-1 (EC7)** — Geotechnical Design of Mat Foundations`,
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
    "ts500-tekil-birlesik-temel-tasarimi",
    "ts500-zemin-kirisi-bodrum-perdesi",
    "ts500-doseme-zimbalama-guvenligi",
  ],
  tags: ["radye temel", "düz radye", "kirişli radye", "zemin yatak katsayısı", "ks", "radye zımbalama", "alt donatı", "üst donatı"],
};

export const ts500RadyeTemel = buildTs500Article(spec);
