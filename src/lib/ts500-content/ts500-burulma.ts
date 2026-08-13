/**
 * TS 500 — Kirişlerde Burulma Donatısı Tasarımı
 *
 * Kaynak MD: TS500_Bolum_05_Kesme_Etriye_Burulma.md (Bölüm 71–108)
 *
 * UYARI: Denge ve uyum burulması ayrımı, burulma eşiği ve etriye/boyuna donatı
 * formülleri için TS 500 ve TBDY 2018 resmi belgeden doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-kiris-burulma-donatisi",
  title: "Kirişlerde Burulma Donatısı Tasarımı",
  description:
    "Denge ve uyum burulması (torsiyon) ayırımı, kapalı etriye ve boyuna torsiyon donatısı hesabı, kesme-burulma etkileşimi ve şantiye detayları.",
  image: "/covers/ts500/kesme-burulma.png",
  readTime: "11 dk",
  keywords: [
    "burulma donatısı",
    "torsiyon",
    "denge burulması",
    "uyum burulması",
    "kapalı etriye",
    "boyuna torsiyon donatısı",
    "kesme burulma etkileşimi",
    "uzaysal kafes modeli",
  ],
  sections: [
    {
      id: "burulma-nedir",
      title: "Kirişlerde Burulma (Torsiyon) Nedir?",
      content: `Kiriş boy ekseni etrafında burulma momenti ($T_d$) oluşması durumudur. Düşey yüklerin kiriş kesit merkezinden kaçık (eksantrik) etki etmesi sonucu meydana gelir:

- **Konsol Balkon Kenar Kirişi:** Balkon döşemesinin yükü kirişe eksantrik aktarılır.
- **Dış Cephe ve Parapet Kirişleri:** Ağır cephe panelleri ve konsol saçağın kirişi burmaya çalışması.
- **İkincil Kiriş Bağlantıları:** Saplama kirişlerin ana kiriş gövdesine eksantrik yük vermesi.

> [!NOTE]
> Burulma çatlakları kirişin dört yüzünde **helezonik / spiral** olarak ilerler. Bu nedenle burulma donatısı da kesitin tüm çevresini kaplayacak şekilde tasarlanmalıdır.`,
      subsections: [],
    },
    {
      id: "denge-ve-uyum-burulmasi",
      title: "Denge Burulması vs Uyum Burulması",
      content: `Tasarımda burulma iki ana kategoriye ayrılır:

## 1. Denge Burulması (Equilibrium Torsion)

Statik denge gereği kirişin burulma momentini taşımaktan başka seçeneğinin olmadığı durumdur.
- **Örnek:** Konsol balkonun bağlandığı kenar kiriş.
- **Kural:** Burulma momenti ihmal edilemez! Çatlama sonrasında da kesit burulmayı güvenle taşımak ZORUNDADIR. Analizde rijitlik çarpanını sıfırlamak yapıyı güvensiz hale getirir.

## 2. Uyum Burulması (Compatibility Torsion)

Hiperstatik sistemlerde mesnet dönmelerinden kaynaklanan, kiriş çatladığında burulma rijitliği ($GJ$) düşerek yükün komşu elemanlara aktarılabildiği durumdur.
- **Örnek:** İki yönlü monolitik iç döşeme kirişleri.
- **Kural:** TS 500 uyarınca uyum burulması durumunda burulma momenti çatlama momenti seviyesine ($T_{cr}$) kadar düşürülerek hesap yapılabilir.

| Burulma Türü | Statik Denge | Çatlama Sonrası Durum | Hesap Zorunluluğu |
|--------------|--------------|-----------------------|-------------------|
| **Denge** | Şarttır | Momenti taşımak zorunda | **Tam Hesap Zorunlu** |
| **Uyum** | Hiperstatik | Moment komşuya aktarılır | Redükte Edilebilir ($T_{cr}$) |`,
      subsections: [],
    },
    {
      id: "uzaysal-kafes-modeli",
      title: "Donatı Donatım İlkeleri: Kapalı Etriye + Boyuna Donatı",
      content: `Burulmayı taşımak için **kapalı etriye** ve **boyuna donatı** BİRLİKTE kullanılmak zorundadır. Sadece birini artırmak torsiyonu çözmez.

## Uzaysal Kafes Modeli (Thin-Walled Tube Analogy)

Çatlamış betonarme kesit, dış kabuğunda kayma akısı ($q$) taşıyan ince cidarlı kapalı bir tüp gibi davranır:

- **Beton Eğik Basınç Çubukları:** Helezonik çatlaklar arasındaki beton diyagonalleri
- **Kapalı Etriye:** Enine çekme gerilmelerini karşılar (45° kancalı ve tamamen kapalı olmalıdır).
- **Boyuna Torsiyon Donatısı:** Kesit çevresindeki 4 yüze eşit dağıtılmış boyuna çubuklar.

> [!WARNING]
> **Açık U-Etriye İle Burulma Taşınamaz!** Burulma çatlağı kesitin 4 yüzeyinde dolandığı için açık etriye kancası açılarak aniden kırılmaya yol açar. Burulma etriyeleri mutlaka **135° kapalı kancalı** ve kenetlenmiş olmalıdır.`,
      subsections: [],
    },
    {
      id: "burulma-formulleri",
      title: "TS 500 Burulma Donatısı Formülleri",
      content: `## 1. Burulma Çatlama Eşiği ($T_{cr}$)

Hesaplanan tasarım burulma momenti $T_d \le T_{cr}$ ise özel burulma donatısı gerekmez (yalnızca konstrüktif etriye konur).

\`\`\`
Tcr = 0.40 × fctd × S

S = Kesit torsiyon sabiti (örneğin dikdörtgen kesitte ~ b²·h / 3)
\`\`\`

## 2. Burulma Etriye Hesabı ($A_{tt} / s$)

\`\`\`
Att / s = Td / (2 × Ao × fywd)
\`\`\`

- **Att:** Tek bir etriye kolunun torsiyon alanı (mm²)
- **Ao:** Etriye merkez hatlarının çevrelediği net tüp alanı (mm²)
- **s:** Etriye aralığı (mm)

## 3. Boyuna Torsiyon Donatısı ($A_{sl}$)

\`\`\`
Asl = (Att / s) × ph × (fywd / fyd)
\`\`\`

- **ph:** Etriye merkez hattının çevresi (mm)
- **Asl:** Kesitin 4 yüzüne eşit dağıtılacak (özellikle 4 köşeye yerleştirilecek) toplam boyuna donatı alanı.`,
      subsections: [],
    },
    {
      id: "kesme-burulma-etkilesimi",
      title: "Kesme ve Burulma Etkileşimi ($V_d + T_d$)",
      content: `Aynı etriye hem düşey kesme ($V_d$) hem de burulma ($T_d$) kuvvetini birlikte taşır:

\`\`\`
Toplam Etriye Oranı: (Asw / s)_toplam = (Asw / s)_kesme + 2 × (Att / s)_burulma
\`\`\`

## Beton Eğik Basınç Çubuğu Kontrolü

Hem kesme hem burulma aynı beton elemanını basınca zorladığından toplam gerilme beton ezilme sınırını aşmamalıdır:

\`\`\`
(Vd / Vr,max)² + (Td / Tr,max)² ≤ 1.0
\`\`\`

Bu oran 1.0'i aşarsa etriye artırmak çözmez — kesit boyutları ($b_w \times h$) büyütülmelidir.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Uygulama ve Tasarım Hataları

1. **Yazılımda Denge Burulmasını Yanlışlıkla Sıfırlamak:** Konsol balkon kenar kirişinde torsiyon rijitliğini 0.01 alarak yapıyı güvensiz bırakmak.
2. **Açık U-Etriye kullanmak:** Burulma altında etriye uçlarının açılması.
3. **Boyuna torsiyon donatısını unutup sadece etriyeyi sıklaştırmak:** Uzaysal kafes modelinin bozulması.
4. **Boyuna donatıyı kesitin sadece alt yüzüne toplamak:** Torsiyon boyuna donatısı kesitin 4 yüzüne ve 4 köşesine dağıtılmalıdır.
5. **Kesme ve burulma etriye alanlarını toplamayı unutmak:** (Asw/s) toplamını tek değişkene göre boyutlandırmak.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki hesap yöntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 8.3)
- **TBDY 2018** — Türkiye Bina Deprem Yönetmeliği, Bölüm 7
- **TS EN 1992-1-1 (EC2)** — Torsion Design rules`,
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
    "ts500-kesme-donatisi-etriyer",
    "ts500-egilme-donatisi-hesabi",
    "ts500-donati-orani-sinirlari",
  ],
  tags: ["burulma donatısı", "torsiyon", "denge burulması", "uyum burulması", "kapalı etriye", "boyuna torsiyon donatısı"],
};

export const ts500Burulma = buildTs500Article(spec);
