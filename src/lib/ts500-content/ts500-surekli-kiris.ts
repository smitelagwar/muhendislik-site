/**
 * TS 500 — Sürekli Kiriş Moment Dağılımı ve Açıklık Momenti
 *
 * Kaynak MD: TS500_Bolum_04_Surekli_Kiris_Moment_Dagilimi_Konsol.md (Bölüm 1–32)
 *
 * UYARI: Yaklaşık moment katsayıları ve moment yeniden dağılımı oranları için
 * TS 500 ve TBDY 2018'in yürürlükteki metinleri resmi kaynaktan doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-surekli-kiris-moment-dagilimi",
  title: "Sürekli Kiriş Moment Dağılımı ve Açıklık Momenti",
  description:
    "Sürekli betonarme kirişlerde elastik analiz, yük kombinasyonları, mesnet ve açıklık momentlerinin belirlenmesi, moment yeniden dağılımı (redistribution) ve Hardy Cross farkı.",
  image: "/covers/ts500/kesme-burulma.png",
  readTime: "12 dk",
  keywords: [
    "sürekli kiriş",
    "moment dağılımı",
    "açıklık momenti",
    "mesnet momenti",
    "moment yeniden dağılımı",
    "Hardy Cross",
    "yük desenleri",
    "zarf eğrisi",
    "plastik mafsal",
  ],
  sections: [
    {
      id: "Iki-kavram-ayrimi",
      title: "Hardy Cross ve Moment Yeniden Dağılımı Ayrımı",
      content: `Mühendislik pratiğinde "moment dağılımı" ifadesi iki farklı kavram için kullanılır:

1. **Hardy Cross Yöntemi (Moment Distribution Method):** Hiperstatik sistemlerde düğüm noktası rijitliklerine göre mesnet momentlerini dengeleyen **matematiksel bir yapısal analiz yöntemidir.**
2. **Moment Yeniden Dağılımı (Moment Redistribution):** Doğrusal elastik analiz sonucunda elde edilen mesnet momentlerinin, betonarme kesitlerin sünekliğine (plastik dönme kapasitesine) dayanarak belirli sınırlar dahilinde azaltılıp açıklık momentlerine aktarılması **yönetmelik esaslı bir tasarım kararıdır.**

> [!IMPORTANT]
> **Hardy Cross ≠ Moment Yeniden Dağılımı.** Hardy Cross mesnet momentlerini elastik olarak hesaplar. Moment yeniden dağılımı ise hesaptan sonra donatı tasarımında moment zirvelerini tıraşlamak için uygulanır.`,
      subsections: [],
    },
    {
      id: "surekli-kiris-davranisi",
      title: "Sürekli Kirişlerin Statik Davranışı",
      content: `Tek açıklıklı basit mesnetli bir kirişte açıklık ortası momenti $M = q \cdot L^2 / 8$ iken, sürekli kirişlerde mesnetler dönmeye karşı dönme rijitliği sunduğundan:

- **Mesnetlerde negatif moment ($M_d < 0$)** oluşur (üst lifler çekmede, alt lifler basında).
- **Açıklıkta pozitif moment ($M_d > 0$)** oluşur (alt lifler çekmede, üst lifler basında).
- Mesnet momentleri açıklık momentini küçültür; böylece sürekli kirişler basit kirişlere göre **daha küçük açıklık momenti ve daha az sehim** yapar.

## Düşey Yük Yükleme Desenleri (Zarf Hesabı)

Sürekli kirişte en elverişsiz momentleri bulmak için sabit yükler ($g$) tüm açıklıklara uygulanırken, hareketli yükler ($q$) farklı açıklık kombinasyonlarında yüklenir:

| Hedeflenen Maksimum Moment | Hareketli Yük ($q$) Düzeyi |
|----------------------------|----------------------------|
| **En büyük açıklık momenti ($M_{max,açıklık}$)** | İlgili açıklık + birer açıklık atlamalı yüklenir |
| **En büyük mesnet momenti ($M_{max,mesnet}$)** | Mesnedin sağındaki ve solundaki açıklıklar birlikte yüklenir |
| **En büyük mesnet kesme kuvveti ($V_{max}$)** | Komşu açıklıklar yüklü tutulur |

Bu yükleme kombinasyonları sonucunda tüm kesitler için **Moment Zarf Eğrisi (Moment Envelope)** elde edilir.`,
      subsections: [],
    },
    {
      id: "ts500-yaklasik-katsayilar",
      title: "TS 500 Yaklaşık Moment Katsayıları Yöntemi",
      content: `Bilgisayar analizi yapılmayan basit yapı sistemlerinde TS 500 belirli şartlar altında elastik analiz yerine pratik moment katsayılarının kullanılmasına izin verir.

## Şartlar

1. En az 2 veya daha fazla açıklık bulunmalıdır.
2. Açıklıklar arasındaki fark %20'yi geçmemelidir ($L_{max} \le 1.20 \cdot L_{min}$).
3. Hareketli yük, sabit yükün iki katından fazla olmamalıdır ($q \le 2g$).
4. Yükler yayılı yük olmalıdır.

## Katsayılar (Yaklaşık Tipik Değerler)

\`\`\`
M = α × P_toplam × L

- Kenar açıklık ortası: ~ 1/11 (veya 1/14)
- İç açıklık ortası: ~ 1/16
- İlk iç mesnet: ~ -1/9 (veya -1/10)
- Diğer iç mesnetler: ~ -1/11
\`\`\`

> [!WARNING]
> Deprem binalarında düşey yük katsayıları tek başına yeterli değildir. TBDY 2018 gereği depremli yük birleşimlerinden ($1.4G + 1.6Q$, $G + Q \pm E$) gelen tasarım moment zarfları esas alınmalıdır.`,
      subsections: [],
    },
    {
      id: "moment-yeniden-dagilimi",
      title: "Moment Yeniden Dağılımı (Moment Redistribution)",
      content: `Lineer elastik analizde mesnet üstünde yüksek negatif moment zirveleri ($M_{mesnet}$) oluşur. Bu mesnetlerde donatı çok sıkışabilir.

Betonarme kesit yeterince sünekse (denge altı kesit), mesnet donatısı akmaya başladığında orada bir **plastik mafsal** oluşur ve mesnet daha fazla moment alamaz. Yük arttıkça ek moment açıklığa aktarılır.

## TS 500 Moment Yeniden Dağılım Sınırı

TS 500'de mesnet momentleri maksimum **%15** (veya süneklik koşuluna göre tanımlı oran) oranında azaltılabilir:

\`\`\`
M_mesnet,tasarım = (1 - δ) × M_mesnet,elastik     (δ ≤ 0.15)
\`\`\`

**Kural:** Mesnet momenti ne kadar azaltılırsa ($\Delta M$), denge gereği açıklık momenti de aynı miktarda artırılmalıdır:

\`\`\`
M_açıklık,yeni = M_açıklık,elastik + ΔM
\`\`\`

> [!IMPORTANT]
> **Süneklik Şartı:** Moment yeniden dağılımı yapılabilmesi için mesnet kesitinin **sünek** olması zorunludur ($\rho - \rho' \le 0.5 \cdot \rho_b$). Gevrek kesitlerde plastik dönme gerçekleşmeyeceği için moment yeniden dağılımı YASAKTIR.`,
      subsections: [],
    },
    {
      id: "sayisal-ornek",
      title: "Sayısal Örnek: Mesnet Momenti Tıraşlama",
      content: `## Veriler

- Elastik analiz mesnet momenti: $M_{\text{mesnet}} = -200\text{ kNm}$
- Elastik analiz açıklık momenti: $M_{\text{açıklık}} = +120\text{ kNm}$
- Süneklik kontrolü yapıldı: Mesnet kesiti sünek ($\delta = 0.15$ kullanılabilir).

## Moment Yeniden Dağılımı Hesabı

1. **Mesnet Momentinin Azaltılması (%15):**
   \`\`\`
   ΔM = 200 × 0.15 = 30 kNm
   M_mesnet,yeni = 200 - 30 = -170 kNm
   \`\`\`

2. **Açıklık Momentinin Artırılması:**
   \`\`\`
   M_açıklık,yeni = 120 + 30 = +150 kNm
   \`\`\`

## Sonuç

Mesnet üstündeki donatı sıkışıklığı azaltılmış, $200\text{ kNm}$ yerine $170\text{ kNm}$'ye göre mesnet donatısı konulmuş, açıklık donatısı ise $150\text{ kNm}$'ye göre boyutlandırılmıştır. Total denge korunmuştur.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Tasarım Hataları

1. **Mesnet momentini azaltıp açıklık momentini artırmayı unutmak:** Statik dengeyi bozarak yapıyı güvensiz hale getirmek.
2. **Gevrek veya aşırı donatılı kesitlerde moment redistribüsyonu yapmak:** Donatı akmadan beton ezileceği için yapı gevrek kırılır.
3. **Hardy Cross yöntemi ile moment redistribüsyonunu aynı şey sanmak:** Hardy Cross bir analiz yöntemidir, redistribüsyon bir boyutlandırma kararıdır.
4. **Sadece sabit yük analizine göre donatı yerleştirmek:** Hareketli yüklerin en elverişsiz desenlerini (zarf eğrisini) hesaba katmamak.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki hesap yöntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 6.2, 7.4)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 7
- **TS EN 1992-1-1 (EC2)** — Linear Analysis with Limited Redistribution`,
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
    "ts500-konsol-kiris-tasarimi",
    "ts500-egilme-donatisi-hesabi",
    "ts500-tablali-kiris",
  ],
  tags: ["sürekli kiriş", "moment dağılımı", "açıklık momenti", "mesnet momenti", "Hardy Cross", "redistribution"],
};

export const ts500SurekliKiris = buildTs500Article(spec);
