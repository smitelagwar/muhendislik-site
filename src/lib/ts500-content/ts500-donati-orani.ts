/**
 * TS 500 — Donatı Oranı Sınırları: Minimum ve Maksimum
 *
 * Kaynak MD: TS500_Bolum_02_Donati_Oranlari_Kenetlenme_Bindirme.md (Bölüm 1–19)
 *
 * UYARI: Kesin donatı oranları ve formülleri için TS 500 ve TBDY 2018'in
 * yürürlükteki metinleri resmi kaynaktan doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-donati-orani-sinirlari",
  title: "Donatı Oranı Sınırları: Minimum ve Maksimum (TS 500 Md. 11.3)",
  description:
    "Kiriş, kolon, perde ve döşemelerde minimum ve maksimum donatı oranlarının fiziki anlamı, süneklik ilişkisi ve TBDY 2018 ek kuralları.",
  image: "/covers/ts500/donati-orani.png",
  readTime: "10 dk",
  keywords: [
    "donatı oranı",
    "minimum donatı",
    "maksimum donatı",
    "ρmin",
    "ρmax",
    "ρb",
    "dengeli donatı oranı",
    "kolon donatı oranı",
    "kiriş donatısı",
    "süneklik",
  ],
  sections: [
    {
      id: "donati-orani-tanimi",
      title: "Donatı Oranı Nedir?",
      content: `Donatı oranı (ρ), betonarme bir kesitteki çelik alanının beton kesit alanına oranıdır. Ancak **payda her elemanda aynı değildir**:

| Eleman Türü | Tanım | Payda | Formül |
|-------------|-------|-------|--------|
| Kiriş (çekme) | ρ | Gövde alanı (bw × d) | ρ = As / (bw × d) |
| Kolon (boyuna) | ρt | Brüt beton alanı (Ac) | ρt = Ast / Ac |
| Döşeme (birim genişlik) | ρ | Birim şerit alanı (b × d) | ρ = As / (b × d) |
| Perde (gövde) | ρv / ρh | Gövde beton alanı | Düşey / yatay donatı oranları |

> [!WARNING]
> "ρ = As / Ac" formülünü tüm elemanlara uygulamak yanlıştır. Kirişte faydalı yükseklik (d) ve gövde genişliği (bw) kullanılırken, kolonda brüt alan (Ac) esas alınır.`,
      subsections: [],
    },
    {
      id: "neden-minimum-donati",
      title: "Neden Minimum Donatı Sınırı Vardır?",
      content: `Minimum donatı (As,min veya ρmin) üç temel nedenle gereklidir:

1. **Çatlama sonrası taşıma kapasitesi:** Beton çekmede zayıftır; çekme bölgesinde ilk çatlak oluştuğunda çekme kuvveti aniden donatıya aktarılır. Donatı çok azsa kesit çatladığı anda aniden kırılabilir.
2. **Gevrek kırılmanın önlenmesi:** Çatlama anındaki moment taşıma kapasitesinin (Mcr) altında kalmamak için donatı belirli bir alt sınırın üzerinde olmalıdır.
3. **Çatlakların dağıtılması:** Yeterli donatı, yük altında tek bir geniş çatlak yerine çok sayıda kılcal ve zararsız çatlak oluşmasını sağlar.

> [!NOTE]
> **Temel Mantık:** Çatlama momentinden (Mcr) sonra kesitin taşıma kapasitesinin aniden yok olmamasını sağlamak.

## "Hesaptan 250 mm² Çıktı" Durumu

Statik hesap programı gerekli donatı alanını As,hesap = 250 mm² bulsa dahi, yönetmelik As,min = 462 mm² gerektiriyorsa kesite **462 mm²** konulmalıdır.

\`\`\`
As,uygulanan = max(As,hesap, As,min)
\`\`\``,
      subsections: [],
    },
    {
      id: "neden-maksimum-donati",
      title: "Neden Maksimum Donatı Sınırı Vardır?",
      content: `Betonarme tasarımında amaç yalnızca en yüksek moment kapasitesini elde etmek değildir.

Aşırı donatı konulmuş (denge üstü) bir kirişte:
- Çekme donatısı akmadan beton basınç bölgesinde ezilir.
- Aniden ve uyarısız **gevrek kırılma** meydana gelir.
- Plastik mafsal oluşumu ve enerji yutma kapasitesi (süneklik) kaybolur.

## Dengeli, Denge Altı ve Denge Üstü Kesitler

| Kesit Türü | Donatı Oranı | Kırılma Türü | Deprem Tasarımı Uyum |
|------------|-------------|--------------|----------------------|
| **Denge Altı** | ρ < ρb | Sünek (çelik akar, sonra beton ezilir) | İdeal / Tercih Edilen |
| **Dengeli** | ρ = ρb | Eşzamanlı (çelik akar + beton ezilir) | Sınır Durumu |
| **Denge Üstü** | ρ > ρb | Gevrek (beton aniden ezilir) | **Yasak / Tehlikeli** |

> [!IMPORTANT]
> Deprem tasarımının temeli **süneklik**tir. Maksimum donatı sınırı "betona daha fazla demir sığmıyor" diye değil, yapının sünek davranmasını sağlamak için konulmuştur.`,
      subsections: [],
    },
    {
      id: "kiris-donati-sinirlari",
      title: "Kirişlerde Minimum ve Maksimum Donatı",
      content: `## Kiriş Minimum Çekme Donatısı

TS 500 pratik hesap formülü:

\`\`\`
ρmin = 0.8 × fctd / fyd

As,min = ρmin × bw × d
\`\`\`

**Örnek (C30 / B420C):**
- fctd ≈ 1.28 MPa
- fyd ≈ 365.2 MPa
- ρmin = 0.8 × 1.28 / 365.2 ≈ 0.0028 (%0.28)

300 × 600 mm (d ≈ 550 mm) bir kiriş için:
As,min = 0.0028 × 300 × 550 ≈ **462 mm²** (yaklaşık 3Ø14 veya 2Ø18)

> [!NOTE]
> **Beton Dayanımı Artınca ρmin Neden Artar?**
> C25'ten C35'e geçildiğinde fctd artar, dolayısıyla ρmin de artar. Çünkü daha güçlü beton çatlamadan önce daha yüksek çekme kuvveti taşır; çatlama anında donatıya aktarılan kuvvet daha büyüktür.

## Kiriş Maksimum Çekme Donatısı

TS 500'de tek donatılı kirişte çekme donatısı oranı dengeli donatı oranının (ρb) belirli bir yüzdesiyle sınırlanır (genellikle ρ ≤ 0.85·ρb veya deprem bölgesinde daha düşük). Basınç donatısı (As') eklendiğinde net çekme oranı (ρ − ρ') kontrol edilir.`,
      subsections: [],
    },
    {
      id: "kolon-donati-sinirlari",
      title: "Kolonlarda Donatı Oranı ve TBDY 2018",
      content: `Kolon boyuna donatı oranı brüt beton alanına göre hesaplanır:

\`\`\`
ρt = Ast / Ac
\`\`\`

## Yönetmelik Sınırları

- **TS 500 Minimum:** ρt ≥ %1.0 (0.01)
- **TS 500 Maksimum:** ρt ≤ %4.0 (0.04) — bindirme bölgesinde %6.0

## TBDY 2018 Deprem Hükümleri

Deprem etkisi altındaki kolonlarda TBDY Bölüm 7 ek sınırlamalar getirir:
- Minimum boyuna donatı oranı: **%1.0**
- Maksimum boyuna donatı oranı: **%4.0** (bindirme bölgesinde %6.0)
- Minimum boyuna donatı çapı: **Ø14** (veya TBDY güncel sınırı)
- Sarılma bölgelerindekapalı etriye ve çiroz zorunluluğu

## Sayısal Kolon Örneği

400 × 600 mm kolon (Ac = 240 000 mm²):
- Minimum Ast = %1.0 × 240 000 = **2 400 mm²** (ör. 8Ø20 = 2 512 mm²)
- Maksimum Ast = %4.0 × 240 000 = **9 600 mm²**

> [!WARNING]
> **Kolonda Aşırı Donatının Tehlikeleri:** Kolon kesitini küçültüp donatıyı aşırı artırmak; betonun donatı aralarından geçememesine, pas payı kaybına, peteklenmeye ve düğüm noktasında donatı çakışmasına yol açar. "Kesiti küçültürüm, demiri artırırım" yaklaşımı betonarmede sınırsız çalışan bir yöntem değildir.`,
      subsections: [],
    },
    {
      id: "doseme-ve-perde-sinirlari",
      title: "Döşeme ve Perdelerde Donatı Sınırları",
      content: `## Döşemeler

- **Tek Doğrultulu Döşeme:** B420C çeliğinde minimum donatı oranı genellikle ρmin ≥ %0.15–%0.20 mertebesindedir. Dağıtma donatısı da ana donatının belirli bir oranından az olamaz.
- **Çift Doğrultulu Döşeme:** İki doğrultudaki donatı oranlarının toplamı yönetmelikte belirtilen minimum sınırı sağlamalıdır.

## Perdeler (TBDY Bölüm 7)

Perdelerde donatı oranları gövde ve uç bölgeleri için ayrı tanımlanır:

- **Gövde Düşey Donatısı:** Minimum ρv ≥ 0.0025 (her iki yüzde toplam)
- **Gövde Yatay Donatısı:** Minimum ρh ≥ 0.0025 (her iki yüzde toplam)
- **Perde Uç Bölgeleri:** Kritik perde yüksekliği boyunca uç bölgelerinde boyuna donatı oranı en az %0.2 (tüm perde alanına oranla) ve uç bölgesi içinde ρ ≥ %1.0 olmalıdır. Donatı kapalı etriye ve çirozlarla sarılmalıdır.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Uygulama ve Tasarım Hataları

1. **Donatı oranının paydasını yanlış almak:** Kirişte Ac kullanmak veya kolonda d kullanmak.
2. **Hesaplanan donatı minimumun altındayken hesaplanan değeri koymak:** As,uygulanan = max(As,hesap, As,min) kuralına uymamak.
3. **Maksimum donatı sınırını aşarak gevrek kesit oluşturmak:** "Daha çok demir = daha güçlü kiriş" yanılgısı.
4. **Beton sınıfı yükseldiğinde ρmin'i sabit tutmak:** fctd arttığı için ρmin'in de arttığını gözden kaçırmak.
5. **Kolon bindirme bölgesinde donatı sıkışıklığı:** Maksimum %6.0 sınırını aşarak beton dökümünü imkânsız hale getirmek.
6. **Perde gövde donatısını tek sıra koymak:** Kalınlığı 15 cm üzerindeki perdelerde çift sıra donatı zorunludur.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki hesap kuralları ve donatı oranları aşağıdaki standartlara dayanmaktadır. Kesin normatif sınırlar **güncel resmi belgeden doğrulanmalıdır**:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 7, 8, 11, 12, 13)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 7 (Betonarme Taşıyıcı Sistemler)
- **TS 708** — Betonarme İçin Çelik Donatı Standartları`,
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
    "ts500-kenetlenme-ek-yeri",
    "ts500-egilme-donatisi-hesabi",
    "ts500-kolon-pm-etkilesimi",
  ],
  tags: ["donatı oranı", "minimum donatı", "maksimum donatı", "ρmin", "ρmax", "süneklik"],
};

export const ts500DonatiOrani = buildTs500Article(spec);
