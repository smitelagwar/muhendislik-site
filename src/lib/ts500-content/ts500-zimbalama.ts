/**
 * TS 500 — Döşemelerde Zımbalama Güvenliği
 *
 * Kaynak MD: TS500_Bolum_08_Doseme_Tek_Cift_Yon_Zimbalama.md (Bölüm 46–130)
 *
 * UYARI: Zımbalama kritik çevresi (d/2 veya d mesafesi), zımbalama gerilmesi (Vpr)
 * ve TBDY 2018 kirişsiz döşeme kuralları resmi belgeden doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-doseme-zimbalama-guvenligi",
  title: "Döşemelerde Zımbalama Güvenliği (Punching Shear)",
  description:
    "Kirişsiz döşeme ve radye temellerde iki yönlü kesme (zımbalama) mekanizması, kritik çevre (up), zımbalama gerilmesi hesabı, kolon başlığı, drop panel ve zımbalama donatısı.",
  image: "/covers/ts500/doseme-zimbalama.png",
  readTime: "12 dk",
  keywords: [
    "zımbalama",
    "zımbalama güvenliği",
    "punching shear",
    "kritik çevre",
    "up",
    "Vpr",
    "kolon başlığı",
    "drop panel",
    "zımbalama donatısı",
    "kirişsiz döşeme",
  ],
  sections: [
    {
      id: "zimbalama-nedir",
      title: "Zımbalama (İki Yönlü Kesme) Nedir?",
      content: `Kirişsiz döşemelerde (flat slab) veya mantar döşemelerde, kolonlar döşemeye doğrudan basar. Kolondan döşemeye aktarılan yüksek düşey yük, kolon etrafında **piramit / koni şeklinde** 45° eğik çatlaklarla döşemenin zımbalanarak delinmesine yol açabilir.

- **İki Yönlü Kesme:** Tek yönlü kiriş kesmesinden farklı olarak kesme gerilmeleri kolonun tüm çevresi boyunca iki doğrultuda oluşur.
- **Tehlikesi:** Uyarısız, **son derece gevrek ve ani** gerçekleşir. Bir kolonda zımbalama göçmesi olursa döşeme o kolonda düşer; yük komşu kolonlara aktarılarak **ilerleyici göçmeye (progressive collapse)** yol açabilir.

> [!CAUTION]
> Döşemede eğilme donatısının (alt/üst donatı) yeterli olması, kolon çevresinde zımbalama göçmesi olmayacağı anlamına GELMEZ. Zımbalama bağımsız bir kesme güvenliği kontrolüdür.`,
      subsections: [],
    },
    {
      id: "kritik-cevre-ve-formuller",
      title: "Kritik Zımbalama Çevresi ($u_p$) ve TS 500 Formülleri",
      content: `Zımbalama gerilmesi hesabı, kolon yüzünden belirli bir mesafede tanımlanan **Kritik Zımbalama Çevresi ($u_p$)** üzerinde yapılır.

## Kritik Çevre Konumu

TS 500 standart yaklaşımında kritik çevre, kolon yüzünden **$d/2$** (faydalı yüksekliğin yarısı) mesafede alınır:

\`\`\`
up = 2 × (b + d) + 2 × (h + d)    (Dikdörtgen b × h kolon için)
\`\`\`

## Zımbalama Tasarım Gerilmesi ($v_{pd}$)

\`\`\`
vpd = Vpd / (up × d)

Vpd: Tasarım zımbalama kuvveti (kolon eksenel reaksiyonu - kritik çevre içindeki yük)
up: Kritik zımbalama çevresi uzunluğu
d: Döşeme faydalı yüksekliği (iki yönlü donatı ortalama d'si)
\`\`\`

## TS 500 Beton Zımbalama Dayanımı ($v_{pr}$)

Zımbalama donatısız betonun tasarım zımbalama gerilme dayanımı:

\`\`\`
vpr = γ × fctd

γ = 1.0 (veya TS 500 normatif katsayısı)
fctd = fctk / 1.50
\`\`\`

Tasarım Şartı: **$v_{pd} \le v_{pr}$** (Eğer $v_{pd} > v_{pr}$ ise zımbalama güvenliği sağlanmaz; kesit değiştirilmeli veya zımbalama donatısı konulmalıdır).`,
      subsections: [],
    },
    {
      id: "eksantrik-zimbalama",
      title: "Eksantrik Zımbalama ve Moment Aktarımı",
      content: `Kolon-döşeme birleşiminde sadece düşey yük ($V$) değil, **eğilme momenti ($M$)** de aktarılıyorsa (özellikle kenar ve köşe kolonlarda veya deprem etkisinde):

- Kritik çevre üzerindeki kesme gerilmeleri üniform olmaz; bir tarafta yığılma yapar.
- Maksimum zımbalama gerilmesi $v_{pd,\max} > V / (u_p \cdot d)$ olur.

> [!WARNING]
> **Kenar ve Köşe Kolonlar:** Kenar kolonlarda kritik çevrenin bir kısmı boşlukta kaldığı ve moment aktarımı yüksek olduğu için zımbalama riski iç kolonlara göre çok daha yüksektir. Yalnızca eksenel yük hesabı yapmak yetersizdir.`,
      subsections: [],
    },
    {
      id: "zimbalama-cozumleri",
      title: "Zımbalama Yetersizliğinde 5 Ana Çözüm",
      content: `Zımbalama gerilmesi emniyet sınırını aştığında ($v_{pd} > v_{pr}$) şu önlemler alınır:

1. **Döşeme Kalınlığını ($h_f$) Artırmak:** $d$ büyüdüğü için hem $u_p$ çevre uzunluğu hem de paydadaki $d$ artar; gerilme $v_{pd}$ karesel oranda düşer. En etkili çözümdür.
2. **Drop Panel (Döşeme Kalınlaştırması) Ekleme:** Yalnızca kolon çevresinde döşeme kalınlığını artırarak lokasyona özel $d$ ve $u_p$ sağlama.
3. **Kolon Başlığı Ekleme:** Kolon üst kısmını genişleterek kritik çevreyi ($u_p$) kolon yüzünden dışarı itme.
4. **Kolon Boyutlarını Büyütmek:** Kolon kesitini büyütmek $u_p$'yi doğrudan uzatır.
5. **Zımbalama Donatısı (Etriye / Stud Rail) Ekleme:** Kolon çevresine radyal olarak yerleştirilen özel 135° kancalı etriyeler veya **başlıklı kayma donatıları (stud rails)** ile beton dayanımını destekleme.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Tasarım ve Şantiye Hataları

1. **Kolon yanına büyük tesisat delikleri açmak:** Kolon yüzüne yakın havalandırma veya tesisat şaftı delmek kritik çevreyi ($u_p$) keserek zımbalama kapasitesini aniden düşürür. Delikler kolon yüzünden en az $6 \cdot d$ uzakta olmalıdır.
2. **Kolon etriyesini zımbalama donatısı sanmak:** Kolon etriyesi kolon çekirdeğindedir; döşemedeki zımbalama kırılma yüzeyini kesmez. Zımbalama donatısı döşeme içine konmalıdır.
3. **Döşeme pas payını ihlal etmek:** Üst eğilme donatısı aşağı çökerse $d$ küçülür ve $v_{pd}$ gerilmesi aniden fırlar.
4. **Yazılımdaki Punching Ratio < 1.0 sonucuna körlemesine güvenmek:** Moment aktarımının, kenar kolon etkisinin ve deliklerin yazılım modeline doğru girildiğini doğrulamamak.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki zımbalama hesap yöntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 8.4)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 7 (Kirişsiz Döşeme Zımbalama Güvenliği)
- **TS EN 1992-1-1 (EC2)** — Punching Shear Design Rules`,
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
    "ts500-dosleme-tek-cift-dogrultulu",
    "ts500-radye-temel-egilme-kesme",
    "ts500-kolon-pm-etkilesimi",
  ],
  tags: ["zımbalama", "zımbalama güvenliği", "punching shear", "kritik çevre", "up", "vpr", "kolon başlığı", "drop panel"],
};

export const ts500Zimbalama = buildTs500Article(spec);
