/**
 * TS 500 — Betonarme Merdiven Tasarımı ve Hesabı
 *
 * Kaynak MD: TS500_Bolum_10_Betonarme_Merdiven_Tasarimi.md (Bölüm 1–45)
 *
 * UYARI: Merdiven eğik plak hesabı, sahanlık birleşimleri, basamak geometrisi ve
 * TBDY 2018 deprem katlar arası etkileşim kuralları resmi belgeden doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-betonarme-merdiven",
  title: "Betonarme Merdiven Tasarımı ve Hesabı (TS 500)",
  description:
    "Eğik plak ve sahanlık analizleri, eğik yük dönüştürme, ana donatı ve dağıtma donatısı yerleşimi, kırık köşe ankrajı ve TBDY 2018 deprem etkileşimi.",
  image: "/covers/ts500/merdiven.png",
  readTime: "11 dk",
  keywords: [
    "betonarme merdiven",
    "merdiven hesabı",
    "eğik plak",
    "sahanlık",
    "eğik boy",
    "kırık köşe donatısı",
    "dağıtma donatısı",
    "TBDY merdiven",
    "basamak yükü",
  ],
  sections: [
    {
      id: "merdiven-sistemleri",
      title: "Betonarme Merdiven Taşıyıcı Tipleri",
      content: `Betonarme merdivenler mimari ve statik düzenine göre 4 farklı sistemde tasarlanır:

1. **Boyuna Çalışan Plak Merdiven (En Yaygın):** Merdiven kolu ve sahanlıklar aynı plakta birleşir, alt ve üst sahanlık kirişlerine/döşemelerine basar. Açıklık boyuna doğrultuda geçilir.
2. **Enine Çalışan Plak Merdiven:** Merdiven plakları iki yanındaki merdiven perdelerine veya merdiven kirişlerine basar.
3. **Omurga Kirişli / Konsol Basamaklı Merdiven:** Ortadaki tek bir betonarme/çelik omurga kirişine konsol bağlanan basamaklar.
4. **Çift Kirişli Yanak Merdiven:** İki yandaki eğik kirişlerin basamakları taşıması.

> [!NOTE]
> Konut ve ticari binalarda en yaygın kullanılan tip **Boyuna Çalışan Çift Sahanlıklı Eğik Plak Merdiven** sistemidir.`,
      subsections: [],
    },
    {
      id: "yuk-donusturme",
      title: "Eğik Kol Yükü ve Yatay İzdüşüme Dönüştürme",
      content: `Merdiven kolu $\alpha$ açısıyla eğimlidir. İki yük bileşeni hesaplanır:

1. **Eğik Plak Kendi Ağırlığı ($g_{\text{plak}}$):** Plak dik kalınlığı $h_f$ ise eğik plak ağırlığı yatay izdüşümde $g_{\text{plak}} = \gamma_c \cdot h_f / \cos\alpha$ olur.
2. **Basamak Kendi Ağırlığı ($g_{\text{basamak}}$):** Rıht yüksekliği $h_r$ olan basamakların eşdeğer yatay yük katkısı $g_{\text{basamak}} = \gamma_c \cdot h_r / 2$ olur.

\`\`\`
Toplam Yatay İzdüşüm Sabit Yükü: g_toplam = (γc × hf / cosα) + (γc × hr / 2) + g_kaplama
\`\`\`

- **Eğim Açısı ($\alpha$):** $\tan\alpha = h_r / b_r$ (Rıht yüksekliği / Basamak genişliği)
- **Hareketli Yük ($q$):** TS 498 uyarınca konut merdivenlerinde $q \ge 3.5\text{ kN/m}^2$, umumi binalarda $q \ge 5.0\text{ kN/m}^2$ alınmalıdır.`,
      subsections: [],
    },
    {
      id: "statik-analiz-ve-moment",
      title: "Eğik Kol + Sahanlık Bütünleşik Moment Hesabı",
      content: `Eğik kol ile yatay sahanlık birleştiğinde kırıklı bir çizgi oluşur. Yatay izdüşüm açıklığı $L = L_1 + L_{\text{kol}} + L_2$ olmak üzere:

\`\`\`
Qu = 1.4 × g_toplam + 1.6 × q
M_açıklık = Qu × L² / 8  (veya TS 500 katsayılı mesnet analizi)
\`\`\`

## Donatı Hesabı

Eğik kolun dik faydalı yüksekliği $d = h_f - c - \phi/2$ esas alınarak ana çekme donatısı hesabı yapılır:

\`\`\`
As = M_d / (fyd × z)
\`\`\`

> [!IMPORTANT]
> **Kırık Köşe Donatı Detayı (Dışbükey vs İçbükey Köşe):**
> Sahanlık ile eğik kol birleşiminde donatı **içbükey (iç konkav) köşede doğrudan bükülüp devam ettirilemez!** Donatı büküldüğü noktada betonu pas payı yönünde dışarı fırlatmaya (yarılmaya) çalışır.
> - Kırık iç köşelerde alt donatı bükülmeden karşı sahanlığın ve kolun içine en az **kenetlenme boyu ($l_b$)** kadar uzatılarak **çapraz (çaprazlanan) donatı** şeklinde detaylandırılmalıdır!`,
      subsections: [],
    },
    {
      id: "tbdy-2018-deprem-etkilesimi",
      title: "TBDY 2018 Merdiven Deprem Etkileşimi",
      content: `TBDY 2018 Bölüm 7 uyarınca merdivenler yapının deprem analiz modelinde doğrudan dikkate alınmalıdır:

1. **Katlar Arası Diyagonal Payanda Etkisi:** Merdiven kütlesi ve eğik plakları, iki kat arasında rijit bir çapraz eleman (payanda) gibi çalışarak kata ek rijitlik katar ve deprem kuvveti çeker.
2. **Kat Ötelenmesi Hasarı:** Depremde katlar göreli ötelenme yaptığında merdiven sahanlık birleşimlerinde yüksek kesme ve eğilme gerilmeleri oluşur.
3. **Esnek / Kayıcı Mesnet Çözümü:** Merdiven kolunun bir ucunun kayıcı (izolatörlü veya elastomer mesnetli) yapılarak katlar arası çapraz etkisi oluşturmasının önlenmesi önerilebilir.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Tasarım ve Şantiye Hataları

1. **Sahanlık birleşiminde donatıyı büküp geçirmek:** Kırık iç köşede donatıyı büküp pas payını patlatmak (donatı çapraz uzatılmalıdır).
2. **Eğik plak dik kalınlığını ($h_f$) basamak yüksekliğiyle karıştırmak:** Dik kalınlık basamak dibinden ölçülen net beton kalınlığıdır.
3. **Hareketli yükü düşük almak:** Merdivenler yangın ve kaçış anında yüksek insan yığılmasına maruz kalır ($q \ge 3.5 - 5.0\text{ kN/m}^2$).
4. **Dağıtma donatısını atlamak:** Eğik plakta ana donatıya dik yönde dağıtma donatısı konulmazsa boyuna çatlaklar oluşur.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki hesap yöntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 11.2)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 7 (Merdivenlerin Deprem Modelindeki Etkisi)
- **Planlı Alanlar İmar Yönetmeliği (2026)** — Merdiven Basamak ve Sahanlık Ölçü Sınırları`,
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
    "ts500-surekli-kiris-moment-dagilimi",
    "ts500-kenetlenme-ek-yeri",
  ],
  tags: ["betonarme merdiven", "merdiven hesabı", "eğik plak", "sahanlık", "eğik boy", "kırık köşe donatısı", "dağıtma donatısı"],
};

export const ts500BetonarmeMerdiven = buildTs500Article(spec);
