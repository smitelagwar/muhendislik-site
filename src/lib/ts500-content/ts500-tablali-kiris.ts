/**
 * TS 500 — Tablalı Kiriş (T-Kiriş) Hesabı ve Efektif Genişlik
 *
 * Kaynak MD: TS500_Bolum_03_Egilme_Tek_Cift_Donatili_T_Kiris.md (Bölüm 25–39)
 *
 * UYARI: Efektif tabla genişliği sınırları ve TS 500 formülleri için
 * yürürlükteki standart metinleri resmi kaynaktan doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-tablali-kiris",
  title: "Tablalı Kiriş (T-Kiriş) Hesabı ve Efektif Genişlik",
  description:
    "Döşeme ile birlikte dökülen betonarme T-kirişlerde efektif tabla genişliği (beff) hesabı, pozitif ve negatif moment durumlarında kesit davranışı.",
  image: "/covers/ts500/tablali-kiris.png",
  readTime: "11 dk",
  keywords: [
    "T-kiriş",
    "tablalı kiriş",
    "efektif genişlik",
    "beff",
    "gövde genişliği",
    "bw",
    "tabla kalınlığı",
    "hf",
    "pozitif moment",
    "negatif moment",
    "kesme gecikmesi",
  ],
  sections: [
    {
      id: "t-kiris-davranisi",
      title: "Tablalı Kiriş (T-Kiriş) Davranışı Nedir?",
      content: `Yerinde dökme betonarme binalarda kirişler ve döşemeler birlikte (monolitik) dökülür. Açıklık ortasında pozitif moment etkisi altında kirişin üst lifleri basınç, alt lifleri çekme gerilmesi taşır.

Bu durumda döşemenin belirli bir genişliği, kirişle birlikte çalışarak **basınç başlığı (tabla)** görevi görür:

- Kesit **T-şekilli** (iç kirişlerde) veya **L-şekilli** (kenar kirişlerde) olarak davranır.
- Basınç bölgesi alanı büyüdüğü için tarafsız eksen yukarı kayar.
- İç kuvvet kolu ($z = d - a/2$) büyür ve kirişin moment taşıma kapasitesi artar.

> [!NOTE]
> Pozitif moment altında döşemenin basınca katılması kirişe büyük bir dayanım avantajı sağlar. Ancak bu avantaj yalnızca **pozitif moment** (açıklık ortasında) geçerlidir.`,
      subsections: [],
    },
    {
      id: "efektif-genislik",
      title: "Efektif Tabla Genişliği (beff) ve Kesme Gecikmesi",
      content: `Döşemenin tamamı kirişle eşit gerilmeyle basınca katılmaz. Kiriş gövdesinden uzaklaştıkça döşemedeki gerilme azalır (**Kesme Gecikmesi / Shear Lag**).

Bu nedenle hesaplarda döşemenin tamamı değil, üniform gerilme taşıdığı varsayılan **efektif tabla genişliği ($b_{eff}$)** kullanılır.

## TS 500 Efektif Tabla Genişliği Kuralları

İç T-kirişlerde etkili tabla genişliği:

\`\`\`
beff = bw + 2 × b1

b1 = min(0.1 × lp, 6 × hf, b0 / 2)
\`\`\`

- **bw:** Kiriş gövde genişliği
- **hf:** Tabla (döşeme) kalınlığı
- **lp:** Kiriş momenti sıfır noktaları arasındaki uzaklık (açıklık boyu ile ilişkili)
- **b0:** Komşu kiriş gövdeleri arasındaki net açıklık

Kenar L-kirişlerde ise genişleme tek yönde alınır:

\`\`\`
beff = bw + b1

b1 = min(0.05 × lp, 6 × hf, b0 / 2)
\`\`\`

> [!WARNING]
> Efektif tabla genişliğini ($b_{eff}$) hesapsız aşırı büyük almak güvensiz sonuçlar doğurur. Çünkü basınç bloğunu yapay biçimde sığ gösterip moment kapasitesini olduğundan fazla hesaplama riskini getirir.`,
      subsections: [],
    },
    {
      id: "t-kiris-hesap-adimlari",
      title: "T-Kiriş Eğilme Hesabı Adımları",
      content: `T-kiriş hesabında ilk sorulması gereken soru: **"Basınç bloğu tamamen tabla içinde mi kalıyor, yoksa gövdeye iniyor mu?"**

## Karar Algoritması

1. **Varsayım:** Önce basınç bloğunun tabla içinde kaldığı varsayılır ($a \le h_f$).
2. Kesit $b_{eff}$ genişliğinde dikdörtgen kesit gibi çözülür:
   \`\`\`
   a = (As × fyd) / (0.85 × fcd × beff)
   \`\`\`
3. **Kontrol:**
   - **Eğer $a \le h_f$ ise:** Varsayım DOĞRUDUR. Kesit $b_{eff}$ genişliğindeki dikdörtgen kesit formülleriyle hesaplanır.
   - **Eğer $a > h_f$ ise:** Varsayım YANLIŞTIR. Basınç bloğu gövdeye taşmıştır; gerçek T-kiriş formüllerine geçilir.

## Basınç Bloğu Gövdeye Taşarsa ($a > h_f$)

Beton basınç kuvveti iki parçaya ayrılır:
- **Tabla Çıkmalarının Basıncı ($C_f$):** $C_f = 0.85 \cdot f_{cd} \cdot (b_{eff} - b_w) \cdot h_f$
- **Gövde Basıncı ($C_w$):** $C_w = 0.85 \cdot f_{cd} \cdot b_w \cdot a$

\`\`\`
Denge: As × fyd = Cf + Cw
Moment Kapasitesi: Mr = Cf × (d - hf/2) + Cw × (d - a/2)
\`\`\``,
      subsections: [],
    },
    {
      id: "sayisal-ornek",
      title: "Sayısal Örnek: T-Kiriş Hesabı",
      content: `## Veriler

- Efektif tabla genişliği: $b_{eff} = 1200\text{ mm}$
- Gövde genişliği: $b_w = 300\text{ mm}$
- Döşeme kalınlığı: $h_f = 120\text{ mm}$
- Faydalı yükseklik: $d = 550\text{ mm}$
- Beton: C30 ($f_{cd} = 20\text{ MPa}$)
- Donatı: B420C ($f_{yd} = 365.2\text{ MPa}$)
- Çekme donatısı: $A_s = 1800\text{ mm}^2$ (ör. 6Ø20)

## Hesap

\`\`\`
a = (1800 × 365.2) / (0.85 × 20 × 1200) ≈ 32.2 mm
\`\`\`

## Kontrol

$a = 32.2\text{ mm} \le h_f = 120\text{ mm}$  ✓ **Basınç bloğu tamamen tabla içindedir.**

## Moment Kapasitesi

\`\`\`
z = 550 - 32.2 / 2 = 533.9 mm
Mr = 1800 × 365.2 × 533.9 = 350.9 × 10⁶ Nmm ≈ 350.9 kNm
\`\`\`

> [!NOTE]
> Aynı kesit $b_w = 300\text{ mm}$ olarak (tablasız dikdörtgen) hesaplansaydı $a \approx 128.9\text{ mm}$ çıkardı ve moment kapasitesi çok daha düşük olurdu. $b_{eff} = 1200\text{ mm}$ basınç bloğunu $32.2\text{ mm}$'ye düşürerek moment kolunu ($z$) büyütmüştür.`,
      subsections: [],
    },
    {
      id: "negatif-momentte-t-kiris",
      title: "Negatif Moment Bölgesinde T-Kiriş Davranışı",
      content: `Sürekli kirişlerin mesnet bölgelerinde negatif moment ($M_d < 0$) oluşur:

- Üst lifler uzar (çekme) → Üst donatı çekme taşır
- Alt lifler kısalır (basınç) → Alt beton basınç taşır

Döşeme (tabla) üst tarafta kaldığı için çekme bölgesindedir. Betonun çekme dayanımı ihmal edildiğinden **döşeme basınç taşımaz.**

> [!IMPORTANT]
> **Negatif moment bölgesinde (mesnetlerde) T-kirişler $b_w \times h$ boyutlarında sıradan DİKDÖRTGEN KESİT olarak hesaplanır.** Efektif tabla genişliği ($b_{eff}$) hesaba katılmaz!

Bu nedenle kiriş mesnet tasarımlarında gövde genişliği ($b_w$) ve alt beton basınç kapasitesi belirleyici olur.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Uygulama ve Hesap Hataları

1. **Mesnet bölgesinde de $b_{eff}$ kullanmak:** Negatif momentte tabla çekme tarafındadır; mesnette $b_{eff}$ kullanmak güvensiz hesap yaratır.
2. **Döşeme genişliğinin tamamını $b_{eff}$ almak:** Kesme gecikmesini göz ardı etmek.
3. **$a > h_f$ durumunda basit dikdörtgen formülünü kullanmak:** Eşdeğer basınç alanını yanlış hesaplamak.
4. **Kenar kirişte (L-kiriş) iç kiriş katsayılarını kullanmak:** L-kirişte tabla çıkması tek taraflıdır ($b_1 = 0.05 \cdot l_p$).
5. **Gövde donatısını yerleştirecek genişliği kontrol etmemek:** $b_{eff}$ sayesinde üst basınç bloğu sığlaşsa da, gövdede ($b_w$) alt çekme donatılarının sıtmama riski vardır.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki hesap yöntemi ve katsayılar aşağıdaki standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 7.3)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 7
- **TS EN 1992-1-1 (EC2)** — Flanged Sections Design`,
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
    "ts500-egilme-donatisi-hesabi",
    "ts500-surekli-kiris-moment-dagilimi",
    "ts500-donati-orani-sinirlari",
  ],
  tags: ["T-kiriş", "tablalı kiriş", "efektif genişlik", "beff", "pozitif moment", "negatif moment"],
};

export const ts500TablaliKiris = buildTs500Article(spec);
