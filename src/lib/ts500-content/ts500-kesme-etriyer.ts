/**
 * TS 500 — Kesme Donatısı ve Etriye Tasarımı
 *
 * Kaynak MD: TS500_Bolum_05_Kesme_Etriye_Burulma.md (Bölüm 1–35)
 *
 * UYARI: Kesme dayanımı formülleri (Vcr, Vc, Vw, Vr) ve TBDY 2018 kapasite
 * tasarımı kesme kuvveti (Ve) şartları resmi belgeden doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-kesme-donatisi-etriyer",
  title: "Kesme Donatısı ve Etriye Tasarımı: TS 500 Kapsamlı Rehberi",
  description:
    "Eğik çatlak mekanizması, beton ve etriye kesme katkıları (Vc, Vw, Vr), etriye aralığı hesabı, TBDY 2018 sarılma bölgesi ve kesme kapasitesi sınırları.",
  image: "/covers/ts500/kesme-burulma.png",
  readTime: "12 dk",
  keywords: [
    "kesme donatısı",
    "etriye",
    "Vcr",
    "Vc",
    "Vw",
    "Vr",
    "Ve",
    "sarılma bölgesi",
    "etriye aralığı",
    "çift kollu etriye",
    "TBDY kesme",
  ],
  sections: [
    {
      id: "kesme-gocmesi-neden-kritiktir",
      title: "Kesme Göçmesi Neden Eğilmeden Daha Kritiktir?",
      content: `Eğilme göçmesi iyi detaylandırılmış bir betonarme kirişte çoğunlukla donatı akması, büyük çatlaklar ve belirgin deformasyonla uyarılı olarak gerçekleşir (**sünek kırılma**).

Kesme göçmesi ise:
- Daha **ani ve uyarısız** meydana gelir.
- Eğik çekme gerilmeleri nedeniyle **gevrek kırılma** ile sonuçlanır.
- Donatı akmadan betonun ansızın ayrılmasına yol açabilir.

> [!IMPORTANT]
> **Deprem Mühendisliği İlkesi:** Kiriş ve kolonların eğilmede sünek davranarak enerji yutmasına izin verilmelidir; ancak yapının kesme göçmesiyle aniden yıkılması önlenmelidir (**Kapasite Tasarımı**).`,
      subsections: [],
    },
    {
      id: "kesme-mekanizmasi",
      title: "Betonarmede Kesme Taşınma Mekanizmaları",
      content: `Kesme kuvveti ($V_d$) betonarme eleman içinde tek bir mekanizmayla taşınmaz. Başlıca katkılar:

1. **Çatlamamış Beton Basınç Bölgesi:** Basınç bloku içindeki kesme gerilmeleri
2. **Agrega Kenetlenmesi (Aggregate Interlock):** Çatlak yüzeyindeki pürüzlü agrega tanelerinin takılması
3. **Boyuna Donatının Dübel Etkisi (Dowel Action):** Boyuna donatı çubuklarının kesme kuvvetine gösterdiği direnç
4. **Enine Donatı (Etriye / Çiroz) Katkısı ($V_w$):** Çatlağı kesen etriye kollarının çekme kuvveti
5. **Eğik Basınç Çubukları (Truss Analogy):** Beton ve donatının oluşturduğu sanal kafes mekanizması`,
      subsections: [],
    },
    {
      id: "ts500-kesme-formulleri",
      title: "TS 500 Kesme Dayanımı Formülleri ($V_{cr}, V_c, V_w, V_r$)",
      content: `TS 500 hesabında kullanılan temel kesme büyüklükleri:

## 1. Betonun Çatlama Kesme Dayanımı ($V_{cr}$)

\`\`\`
Vcr = 0.65 × fctd × bw × d

Eksenel basınç varsa (N d):
Vcr = 0.65 × fctd × bw × d × (1 + 0.07 × Nd / Ac)
\`\`\`

## 2. Betonun Kesme Katkısı ($V_c$)

Eğik çatlak oluştuktan sonra betonun taşıdığı güvenli kesme katkısı:

\`\`\`
Vc = 0.80 × Vcr = 0.52 × fctd × bw × d
\`\`\`

## 3. Etriye / Enine Donatı Katkısı ($V_w$)

Düşey etriyeli kesitlerde 45° kafes modeline göre etriye katkısı:

\`\`\`
Vw = (Asw / s) × fywd × d

Asw = Bir etriye aralığındaki etkili etriye kollarının toplam alanı (mm²)
s   = Etriye aralığı (mm)
fywd = Etriye tasarım akma dayanımı (MPa)
\`\`\`

## 4. Toplam Kesme Dayanımı ($V_r$) ve Tasarım Koşulu

\`\`\`
Vr = Vc + Vw

Tasarım Şartı: Vd ≤ Vr  (veya TBDY'de Ve ≤ Vr)
\`\`\`

> [!WARNING]
> **Beton Ezilmesi Üst Sınırı ($V_{r,\max}$):** Etriyeyi ne kadar çok koyarsanız koyun, beton eğik basınç çubuğu ezilebilir. TS 500 üst sınırı: **$V_r \le 0.22 \cdot f_{cd} \cdot b_w \cdot d$**. Bu sınır aşılırsa kesit boyutları ($b_w \times h$) veya beton sınıfı büyütülmelidir.`,
      subsections: [],
    },
    {
      id: "sayisal-ornek",
      title: "Sayısal Örnek: Kiriş Etriye Hesabı",
      content: `## Veriler

- Kiriş gövde genişliği: $b_w = 300\text{ mm}$
- Faydalı yükseklik: $d = 550\text{ mm}$
- Beton: C30 ($f_{ctd} = 1.28\text{ MPa}$)
- Etriye çeliği: B420C ($f_{ywd} = 365.2\text{ MPa}$)
- Tasarım kesme kuvveti: $V_d = 220\text{ kN}$ ($220 \times 10^3\text{ N}$)

## 1. Beton Katkısı ($V_c$)

\`\`\`
Vc = 0.52 × 1.28 × 300 × 550 = 109 824 N ≈ 109.8 kN
\`\`\`

## 2. Gerekli Etriye Katkısı ($V_w$)

\`\`\`
Vw = Vd - Vc = 220 - 109.8 = 110.2 kN (110 200 N)
\`\`\`

## 3. Etriye Aralığı ($s$) Hesabı (Çift Kollu Ø8 Etriye)

Ø8 tek kol $A_1 \approx 50.3\text{ mm}^2 \rightarrow A_{sw} = 2 \times 50.3 = 100.6\text{ mm}^2$

\`\`\`
Vw = (Asw / s) × fywd × d

110 200 = (100.6 / s) × 365.2 × 550
s = (100.6 × 365.2 × 550) / 110 200 ≈ 183.5 mm
\`\`\`

Hesaplanan maksimum etriye aralığı **$s = 150\text{ mm}$** seçilir.

## 4. Sarılma Bölgesi Kontrolü (TBDY 2018)

Deprem sarılma bölgesinde etriye aralığı daha da sıklaştırılarak **Ø8/100 mm** uygulanır.`,
      subsections: [],
    },
    {
      id: "tbdy-2018-ve-kapasite",
      title: "TBDY 2018 Kapasite Tasarımı ($V_e$) ve Sarılma Bölgeleri",
      content: `Deprem bölgelerinde kesme hesabı doğrudan elastik analiz kesmesi $V_d$ ile yapılmaz. Kiriş uçlarında plastik mafsallar oluştuğu varsayılarak **Kapasite Tasarımı Kesme Kuvveti ($V_e$)** hesaplanır:

\`\`\`
Ve = Vdg ± (Mra + Mrb) / ln
\`\`\`

- **Vdg:** Düşey yüklerden oluşan kesme kuvveti
- **Mra, Mrb:** Kiriş sol ve sağ uçlarındaki pekleşmeli taşıma gücü momentleri
- **ln:** Kiriş serbest açıklığı

## Kiriş Uç Sarılma Bölgeleri

Kiriş mesnet yüzünden itibaren **$2 \cdot h$** boyunca sarılma bölgesi tanımlanır:

- **İlk etriye** mesnet yüzünden en fazla **50 mm** mesafeye konur.
- Sarılma bölgesinde etriye aralığı $s \le \min(h/4, 8\cdot\phi_{\text{boyuna}}, 150\text{ mm}, 100\text{ mm})$ şartlarını sağlamalıdır.
- Tüm etriyeler **135° kancalı** olmalı ve kanca uzantıları beton çekirdeğe saplanmalıdır.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Uygulama Hataları

1. **90° açık etriye kancası kullanmak:** Depremde beton örtüsü döküldüğünde 90° kancalar açılarak etriye işlevsiz kalır. 135° kanca şarttır.
2. **Kapasite kesmesini ($V_e$) atlayıp sadece elastik $V_d$ ile etriye koymak:** Eğilme donatısı fazla seçildiyse pekleşmeli moment artar ve $V_e$ yüksek çıkar.
3. **Etriye aralığını sarılma bölgesinde sıklaştırmamak.**
4. **Çift kollu yerine tek kollu etriye hesabı yapmak:** $A_{sw}$ hesabında kol sayısını yanlış almak.
5. **Maksimum kesme sınırını ($V_{r,\max}$) kontrol etmeyip aşırı etriye sıklaştırmak:** Beton eğik basınç çubuğunun ezilmesini gözden kaçırmak.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki kesme ve etriye kuralları aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 8.1, 8.2)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 7 (Kiriş Kesme Güvenliği ve Sarılma Bölgeleri)
- **TS 708** — Donatı Çeliği Standartları`,
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
    "ts500-kiris-burulma-donatisi",
    "ts500-egilme-donatisi-hesabi",
    "ts500-donati-orani-sinirlari",
  ],
  tags: ["kesme donatısı", "etriye", "Vc", "Vw", "Vr", "Ve", "sarılma bölgesi", "135 kanca"],
};

export const ts500KesmeEtriyer = buildTs500Article(spec);
