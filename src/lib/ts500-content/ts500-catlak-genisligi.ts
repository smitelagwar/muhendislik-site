/**
 * TS 500 — Çatlak Genişliği ve Kullanılabilirlik Kontrolleri
 *
 * Kaynak MD: TS500_Bolum_06_Sehim_Catlak_Kullanilabilirlik.md (Bölüm 46–100)
 *
 * UYARI: Çatlak genişliği hesabı (w_max) ve çevresel etki sınıflarına göre
 * izin verilen limitler (0.2 mm - 0.4 mm) TS 500 ve EC2'den doğrulanmalıdır.
 */

import { buildTs500Article } from "./types";
import type { Ts500ArticleSpec } from "./types";

const spec: Ts500ArticleSpec = {
  slug: "ts500-catlak-genisligi-kontrolu",
  title: "Çatlak Genişliği ve Kullanılabilirlik Kontrolleri",
  description:
    "Betonarme elemanlarda kılcal çatlak oluşum mekanizması, servis yükü altında donatı gerilmesi, w_max formülü, donatı çapı ve aralığı ilişkisi ve durabilite sınırları.",
  image: "/covers/ts500/sehim-catlak.png",
  readTime: "10 dk",
  keywords: [
    "çatlak genişliği",
    "wmax",
    "kullanılabilirlik",
    "donatı gerilmesi",
    "donatı aralığı",
    "durabilite",
    "pas payı",
    "servis yükü",
    "çatlama momenti",
  ],
  sections: [
    {
      id: "catlak-fizigi",
      title: "Betonarmede Çatlak Kaçınılmaz mıdır?",
      content: `Evet. Betonarme yapının temel çalışma prensibi gereği, çekme bölgesindeki beton $f_{ctd}$ çekme dayanımını aştığında çatlar ve çekme kuvveti donatıya aktarılır.

Dolayısıyla **çatlak oluşumu bir imalat hatası değil, betonarmenin doğal çalışma biçimidir.**

Asıl mühendislik problemi: **"Çatlak var mı?"** değil, **"Çatlak genişliği ($w$) kontrol altında mı?"** sorusudur.

> [!IMPORTANT]
> **Çatlak Kontrolünün Üç Nedeni:**
> 1. **Durabilite (Korozyon Koruması):** Geniş çatlaklar nem, CO₂ ve klorür iyonlarının donatıya hızla ulaşmasına yol açarak paslanmayı başlatır.
> 2. **Su ve Nem Geçirimsizliği:** Su depoları, bodrum perdeleri ve çatılarda sızıntıyı önlemek.
> 3. **Estetik ve Görünüm:** 0.4 mm üzerindeki çatlaklar kullanıcılarda güvensizlik oluşturur.`,
      subsections: [],
    },
    {
      id: "catlak-genisligi-formulu",
      title: "Çatlak Genişliği Hesabı ve Değişkenler ($w_{\\max}$)",
      content: `Çatlak genişliği ($w_{\\max}$), donatının servis gerilmesi ($\sigma_s$), donatı çapı ($\phi$), beton örtüsü ($c$) ve donatı aralığı ($s$) ile doğrudan ilişkilidir:

\`\`\`
w_max = w0 × (σs / Es) × (3c + 0.2 × s / ρ_eff)

Servis yükleri altında donatı gerilmesi: σs ≈ M_servis / (As × z)
\`\`\`

## Çatlak Genişliğini Düşüren Ana Unsurlar

1. **Servis Yükü Altındaki Donatı Gerilmesi ($\sigma_s$):** Gerilme ne kadar düşükse çatlak o kadar dar olur.
2. **Donatı Çapı ve Aralığı ($s$):** Aynı çelik alanında büyük çaplı seyrek donatı yerine **küçük çaplı sık donatı** kullanmak çatlak genişliğini önemli ölçüde küçültür.
3. **Beton Örtüsü ($c$):** Beton örtüsü arttıkça yüzeydeki çatlak genişliği bir miktar büyür; ancak korozyon koruması artar. Optimum örtü seçilmelidir.`,
      subsections: [],
    },
    {
      id: "cevresel-etki-ve-limitler",
      title: "Çevresel Etki Sınıflarına Göre İzin Verilen $w_{\\max}$ Limitleri",
      content: `TS 500 ve Eurocode 2 standartları çevresel etki sınıflarına göre maksimum izin verilen çatlak genişliği limitleri belirler:

| Çevresel Etki Sınıfı | Ortam Tanımı | İzin Verilen $w_{\\max}$ (mm) |
|----------------------|--------------|------------------------------|
| **X0 / XC1** | Kuru iç ortam (korozyon riski yok) | **0.40 mm** |
| **XC2 / XC3 / XC4** | Nemli iç/dış ortam, karbonatlaşma riski | **0.30 mm** |
| **XD1 / XD2 / XS1** | Klorür ve deniz suyu etkisi | **0.20 mm** |
| **Özel Su Yapıları** | Su depoları, havuzlar, arıtma tesisleri | **0.10 – 0.15 mm** |

> [!NOTE]
> Deniz kıyısındaki bir binada veya otopark döşemesinde $0.40\text{ mm}$ çatlak kabul edilemez! Klorür iyonlarının donatıyı çürütmesini önlemek için çatlak genişliği $0.20\text{ mm}$'nin altında tutulmalıdır.`,
      subsections: [],
    },
    {
      id: "donati-capi-ve-araligi-tablosu",
      title: "Çatlak Hesabı Yapmadan Kontrol: Donatı Çapı ve Aralık Tablosu",
      content: `TS 500 pratik tasarımda, detaylı $w_{\\max}$ hesabı yapmak yerine servis yükleri altındaki donatı gerilmesine ($\sigma_s$) bağlı olarak **maksimum çubuk çapı** veya **maksimum çubuk aralığı** sınırlarına uyulmasını kabul eder:

| Donatı Servis Gerilmesi ($\sigma_s$) | $w_{\\max} = 0.3\text{ mm}$ İçin Maksimum Çap | Maksimum Çubuk Aralığı ($s$) |
|-------------------------------------|----------------------------------------------|-----------------------------|
| $160\text{ MPa}$ | Ø32 | $300\text{ mm}$ |
| $200\text{ MPa}$ | Ø25 | $250\text{ mm}$ |
| $240\text{ MPa}$ | Ø16 | $200\text{ mm}$ |
| $280\text{ MPa}$ | Ø12 | $150\text{ mm}$ |
| $320\text{ MPa}$ | Ø10 | $100\text{ mm}$ |

**Pratik Kural:** Donatı servis gerilmesi yükseldikçe daha küçük çaplı ve daha sık donatı seçilmelidir.`,
      subsections: [],
    },
    {
      id: "sik-hatalar",
      title: "Sık Yapılan Hatalar",
      content: `## Tasarım ve Uygulama Hataları

1. **Aynı alan için az sayıda büyük çap seçmek:** Örneğin 2Ø25 yerine 5Ø16 kullanmak çatlakları çok daha homojen ve kılcal (dar) tutar.
2. **Agresif deniz ortamında 0.4 mm çatlak genişliğini yeterli sanmak:** Klorür korozyonunda kural $w_{\\max} \le 0.20\text{ mm}$'dir.
3. **Servis donatı gerilmesini ($\sigma_s$) hesaba katmamak:** Sadece taşıma gücündeki $f_{yd}$'ye bakıp servis gerilmesini göz ardı etmek.
4. **Perde ve döşemelerde rötre donatısını yetersiz koymak:** Sıcaklık ve rötre çatlaklarının kontrolsüz büyümesine yol açmak.`,
      subsections: [],
    },
    {
      id: "dayanak",
      title: "Mevzuat Dayanağı",
      content: `Bu makaledeki çatlak kontrol yöntemleri aşağıdaki resmi standartlara dayanmaktadır:

- **TS 500 (2000)** — Betonarme Yapıların Tasarım ve Yapım Kuralları (Md. 13.3)
- **TS EN 206+A2** — Çevresel Etki Sınıfları
- **TS EN 1992-1-1 (EC2)** — Crack Control and Maximum Bar Spacing`,
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
    "ts500-kiris-sehim-kontrolu",
    "ts500-beton-ortusu-durabilite",
    "ts500-egilme-donatisi-hesabi",
  ],
  tags: ["çatlak genişliği", "wmax", "kullanılabilirlik", "donatı gerilmesi", "donatı aralığı", "durabilite", "0.2mm"],
};

export const ts500CatlakGenisligi = buildTs500Article(spec);
