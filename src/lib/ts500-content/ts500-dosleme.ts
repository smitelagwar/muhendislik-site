/**
 * TS 500 — Döşeme Tasarımı: Tek ve Çift Doğrultulu Döşemeler
 *
 * Kaynak MD: TS500_Bolum_08_Doseme_Tek_Cift_Yon_Zimbalama.md (Bölüm 1–45)
 *
 * UYARI: Tek/çift doğrultu oranı (ly/lx > 2.0), minimum döşeme kalınlığı (hf)
 * ve donatı oranları TS 500 resmi belgeden doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-dosleme-tek-cift-dogrultulu",
  title: "Döşeme Tasarımı: Tek ve Çift Doğrultulu Döşemeler (TS 500)",
  description:
    "Tek doğrultulu (hurdi) ve çift doğrultulu (dal) plak döşemelerin sınıflandırılması, ly/lx oranı, yük aktarımı, minimum kalınlık (hf) ve donatı yerleşim esasları.",
  image: "/covers/ts500/doseme-zimbalama.png",
  readTime: "11 dk",
  keywords: [
    "döşeme tasarımı",
    "tek doğrultulu döşeme",
    "çift doğrultulu döşeme",
    "ly/lx oranı",
    "hurdi döşeme",
    "dal döşeme",
    "dağıtma donatısı",
    "döşeme kalınlığı",
    "hf",
    "pilye",
  ],
  sections: [
    {
      id: "doseme-turleri-ve-oran",
      title: "Tek Doğrultulu vs Çift Doğrultulu Döşeme Sınıflandırması",
      content: `Betonarme plak döşemeler (kirişli döşemeler), kenar uzunluklarının oranına ($l_y / l_x$) göre sınıflandırılır:

- **$l_x$:** Kısa açıklık
- **$l_y$:** Uzun açıklık

\`\`\`
ly / lx > 2.0  →  Tek Doğrultulu Döşeme (Hurdi Döşeme)
ly / lx ≤ 2.0  →  Çift Doğrultulu Döşeme (Dal Döşeme)
\`\`\`

| Döşeme Türü | Açıklık Oranı | Yük Taşıma Mekanizması | Donatı Düzeni |
|-------------|---------------|------------------------|---------------|
| **Tek Doğrultulu** | $l_y / l_x > 2.0$ | Yükün neredeyse tamamı (%90+) **kısa açıklık ($l_x$)** yönünde taşınır | Ana donatı kısa yönde, uzun yönde **dağıtma donatısı** |
| **Çift Doğrultulu** | $l_y / l_x \le 2.0$ | Yük her iki doğrultuda da taşınır ($M_x$ ve $M_y$) | Her iki doğrultuda da ana taşıyıcı donatı konulur |

> [!NOTE]
> Uzun kenarı kısa kenarının 2 katından fazla olan bir döşemede uzun kenara yük gitmez; yük en kısa yoldan komşu kirişlere ulaşmak ister.`,
      subsections: [],
    },
    {
      id: "tek-dogrultulu-doseme",
      title: "Tek Doğrultulu Döşemeler (Hurdi Döşeme)",
      content: `Tek doğrultuda çalışan döşemelerde ana moment $M_x$ kısa açıklık boyunca oluşur.

## Donatı Düzeni

1. **Ana Donatı ($A_{sx}$):** Kısa açıklık boyunca alt yüzeye yerleştirilir ($M_{x,\text{açıklık}}$ için).
2. **Dağıtma Donatısı ($A_{sd}$):** Uzun açıklık boyunca yerleştirilir. Ana donatının **en az %20'si** (veya TS 500 minimum oranı) kadar olmalıdır. Görevi yükü dağıtmak ve rötre çatlaklarını kontrol etmektir.
3. **Mesnet Donatısı (Mesnet Ek donatısı / Pilye):** Kiriş mesnetlerindeki negatif moment ($M_{x,\text{mesnet}}$) için üst yüzeye konur.

## Minimum Döşeme Kalınlığı ($h_f$)

TS 500 uyarınca tek doğrultulu döşemelerde sehim kontrolü yapmadan kullanılabilecek minimum kalınlık:

\`\`\`
hf ≥ ln / 25  (basit mesnetli)
hf ≥ ln / 30  (sürekli döşeme)
hf ≥ ln / 10  (konsol döşeme)

Mutlak Alt Sınır: hf ≥ 80 mm (veya 100 mm konut döşemelerinde)
\`\`\``,
      subsections: [],
    },
    {
      id: "cift-dogrultulu-doseme",
      title: "Çift Doğrultulu Döşemeler (Dal Döşeme)",
      content: `Her iki kenarı da birbirine yakın ($l_y / l_x \le 2.0$) olan 4 tarafı kirişlerle çevrili döşemelerdir.

## Moment Dağılımı ve Marcus/TS 500 Katsayıları

Yük her iki doğrultuda bölünür. Kısa açıklık daha rijit olduğundan momentin büyük kısmını $M_x$ alır, $M_y$ daha küçüktür.

TS 500 Tablo 11.1 katsayılarıyla ($M = \alpha \cdot w \cdot l_x^2$):
- **Kısa Açıklık Momenti ($M_x$):** $\alpha_x \cdot w \cdot l_x^2$
- **Uzun Açıklık Momenti ($M_y$):** $\alpha_y \cdot w \cdot l_x^2$

## Minimum Döşeme Kalınlığı ($h_f$)

TS 500 pratik formülü:

\`\`\`
hf ≥ [ lns / 15-20 ] × (1 - αs / 4)

hf ≥ 80 mm (veya 100 mm)
\`\`\`

- **$l_{ns}$:** Serbest kısa açıklık
- **$\alpha_s$:** Sürekli kenarların toplam çevreye oranı`,
      subsections: [],
    },
    {
      id: "doseme-donati-kurallari",
      title: "TS 500 Döşeme Donatı Kuralları ve Minimumlar",
      content: `## Minimum Donatı Oranı ($\rho_{\min}$)

B420C çeliği kullanılan döşemelerde:
- Tek doğrultulu döşemelerde: $\rho_{\min} \ge 0.0015$ (%0.15)
- Çift doğrultulu döşemelerde: İki doğrultudaki donatı oranları toplamı $\rho_x + \rho_y \ge 0.0035$ (%0.35)

## Maksimum Çubuk Aralığı ($s_{\max}$)

- **Ana Donatı Aralığı:** $s \le \min(1.5 \cdot h_f, 200\text{ mm})$
- **Dağıtma Donatısı Aralığı:** $s \le 300\text{ mm}$

> [!IMPORTANT]
> **Köşe Torsiyon Donatısı:** Çift doğrultulu döşemelerin dış köşelerinde (iki komşu kenarı mesnetsiz veya tutulmamış köşelerde) döşeme uçlarının yukarı kalkmasını önlemek için **üstte ve altta köşe burulma donatısı (çapraz file)** yerleştirilmelidir.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Tasarım ve Şantiye Hataları

1. **$l_y / l_x > 2$ olduğu halde her iki yöne eşit donatı koymak:** Uzun yönde gereksiz fazla donatı harcamak.
2. **Dağıtma donatısını atlamak:** Tek doğrultulu döşemede dağıtma donatısı konulmazsa rötre ve sıcaklık çatlakları kontrolden çıkar.
3. **Döşeme pas payını ihlal etmek:** Döşemelerde pas payı $15\text{ mm}$ (iç mekân) - $20\text{ mm}$ (dış mekân) olmalıdır. 8 cm kalınlıktaki plak döşemede donatının ortaya gelmesi $d$'yi yarıya düşürür.
4. **Köşe torsiyon donatısını koymamak:** Dış köşelerde döşemenin yukarı kalkıp sıva ve duvar çatlağı oluşturması.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki hesap yöntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 11.1, 11.2)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 7 (Döşeme Diyafram Tasarımı)
- **TS EN 1992-1-1 (EC2)** — Slab Design Rules`,
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
    "ts500-doseme-zimbalama-guvenligi",
    "ts500-donati-orani-sinirlari",
    "ts500-kiris-sehim-kontrolu",
  ],
  tags: ["döşeme tasarımı", "tek doğrultulu", "çift doğrultulu", "hurdi döşeme", "dal döşeme", "dağıtma donatısı", "hf"],
};

export const ts500Dosleme = buildTs500Article(spec);
