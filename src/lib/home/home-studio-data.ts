// Ana sayfa mühendislik içerik, bağlantı ve aşama tanımları

export type HomeToolId =
  | "hizli-metraj"
  | "ruhsat-fizibilite"
  | "insaat-maliyeti"
  | "donati-hesabi"
  | "deprem-yuku"
  | "pas-payi";

export interface EngineeringToolItem {
  id: HomeToolId;
  title: string;
  standard: string;
  summary: string;
  href: string;
  category: "Metraj & Maliyet" | "Taşıyıcı Sistem" | "İmar & Fizibilite";
}

export interface StandardRef {
  code: string;
  title: string;
  scope: string;
  href: string;
}

export interface TechnicalGuideItem {
  id: string;
  categoryLabel: string;
  topic: "TBDY" | "Zemin" | "Malzeme";
  title: string;
  excerpt: string;
  readTime: string;
  date: string;
  href: string;
  featured?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  checklistCount: number;
}

export interface ConstructionPhaseItem {
  number: string;
  slug: string;
  href: string;
  title: string;
  summary: string;
  durationShare: string;
  governingStandards: string[];
  deliverables: string[];
  fieldControls: string[];
  elevationNote: string;
}

export const HOLOGRAM_IMAGE_URLS = {
  building: "/home/holo-concrete-building.webp",
  bust: "/home/philosopher-bust-extended.webp",
  mosque: "/home/holo-sultanahmet-mosque.webp",
} as const;

export const ENGINEERING_TOOLS: EngineeringToolItem[] = [
  {
    id: "ruhsat-fizibilite",
    title: "Ruhsat Ön Fizibilite",
    standard: "TAKS · KAKS",
    summary:
      "Parsel, TAKS/KAKS, kat adedi ve emsal verilerini birlikte değerlendirin; teorik imar haklarını ve daire senaryolarını görün.",
    href: "/hesaplamalar/tahmini-insaat-alani",
    category: "İmar & Fizibilite",
  },
  {
    id: "insaat-maliyeti",
    title: "İnşaat Maliyeti Analizi",
    standard: "2026 Birim Fiyat",
    summary:
      "Kaba iş, ince iş, mekanik-elektrik ve genel giderleri disiplin bazında görün; m² varsayımlarını güncelleyip toplam bütçeyi izleyin.",
    href: "/hesaplamalar/insaat-maliyeti",
    category: "Metraj & Maliyet",
  },
  {
    id: "donati-hesabi",
    title: "Donatı Hesabı",
    standard: "TS 500",
    summary:
      "Çap ve adet girerek toplam donatı kesit alanını (As), birim metre ağırlığını ve eşdeğer çap kombinasyonlarını anında görün.",
    href: "/kategori/araclar/donati-hesabi",
    category: "Taşıyıcı Sistem",
  },
  {
    id: "deprem-yuku",
    title: "Eşdeğer Deprem Yükü",
    standard: "TBDY 2018",
    summary:
      "TBDY 2018 Bölüm 4’e göre taban kesme kuvvetini (Vt) ve katlara dağılan eşdeğer yatay deprem yüklerini hesaplayın.",
    href: "/kategori/araclar/taban-kesme-kuvveti",
    category: "Taşıyıcı Sistem",
  },
  {
    id: "pas-payi",
    title: "Pas Payı Hesabı",
    standard: "TS EN 1992-1-1",
    summary:
      "Çevresel etki sınıfı ve en büyük donatı çapına göre minimum dayanıklılık örtüsünü ve sahada uygulanacak pratik pas payını belirleyin.",
    href: "/kategori/araclar/pas-payi",
    category: "Taşıyıcı Sistem",
  },
];

export const TECHNICAL_STANDARDS: StandardRef[] = [
  {
    code: "TS 500",
    title: "Betonarme tasarım",
    scope: "Kesit kapasitesi, minimum donatı oranları ve aderans kuralları",
    href: "/kategori/araclar",
  },
  {
    code: "TBDY 2018",
    title: "Deprem ve modelleme",
    scope: "Bölüm 4 doğrusal analiz, etkin kesit rijitliği ve yatay yük dağılımı",
    href: "/kategori/deprem-yonetmelik",
  },
  {
    code: "TS EN 1992-1-1",
    title: "Detay ve dayanıklılık",
    scope: "Çevresel etki sınıflarına göre nominal beton örtüsü ve çatlak kontrolü",
    href: "/kategori/araclar/pas-payi",
  },
  {
    code: "TS EN 206",
    title: "Beton performansı",
    scope: "Dayanım sınıfı, kıvam, su/çimento oranı ve şantiye kabul kriterleri",
    href: "/beton-dokumu-kontrol-listesi",
  },
];

export const TECHNICAL_GUIDES: TechnicalGuideItem[] = [
  {
    id: "tbdy-2018-betonarme-analiz",
    categoryLabel: "TBDY 2018 Rehberi",
    topic: "TBDY",
    title: "TBDY 2018 ile Betonarme Analiz: Modelleme Farkları, Tasarıma Etkileri ve Pratik Kontroller",
    excerpt:
      "TBDY 2018 Bölüm 4’e göre betonarme bina analiz modelinin perde, döşeme diyaframı, etkin kesit rijitliği, kütle ve ek dışmerkezlik kabullerinin birbiriyle tutarlı kurulmasını proje kontrol sırasıyla açıklar.",
    readTime: "12 dk okuma",
    date: "14 Mart 2026",
    href: "/tbdy-2018-betonarme-analiz",
    featured: true,
    imageUrl: "/home/guide-tbdy-analysis.webp",
    imageAlt: "Akşam ışığında betonarme çok katlı yapı taşıyıcı sistem iskeleti",
    checklistCount: 4,
  },
  {
    id: "eps-xps-yalitim-farklari",
    categoryLabel: "Malzeme Veritabanı",
    topic: "Malzeme",
    title: "EPS ve XPS Arasındaki Farklar: Isı Yalıtımında Doğru Malzeme Nasıl Seçilir?",
    excerpt:
      "EPS ve XPS ısı yalıtım levhalarının ısıl performans, su emme, basınç dayanımı ve uygulama detayı açısından farklarını anlatan kapsamlı teknik yazı.",
    readTime: "12 dk okuma",
    date: "8 Aralık 2023",
    href: "/eps-xps-yalitim-farklari",
    checklistCount: 3,
  },
  {
    id: "beton-dokumu-kontrol-listesi",
    categoryLabel: "Uygulama Rehberi",
    topic: "Zemin",
    title: "Beton Dökümü Öncesi Demir ve Kalıp Kontrol Listesi: Saha Kabulü Nasıl Yapılmalı?",
    excerpt:
      "Beton dökümünden önce donatı, kalıp, pas payı, gömülü elemanlar ve döküm lojistiğinin nasıl kontrol edilmesi gerektiğini anlatan uzun-form saha rehberi.",
    readTime: "13 dk okuma",
    date: "22 Kasım 2023",
    href: "/beton-dokumu-kontrol-listesi",
    imageUrl: "/home/guide-site-rebar.webp",
    imageAlt: "Beton dökümü öncesi döşeme kalıbı ve bağlanmış donatı demiri",
    checklistCount: 4,
  },
];

export const CONSTRUCTION_PHASES: ConstructionPhaseItem[] = [
  {
    number: "01",
    slug: "proje-hazirlik",
    href: "/rehber/proje-hazirlik",
    title: "Proje & İzinler",
    summary:
      "Tasarım kararları, disiplinler arası koordinasyon, ruhsat süreçleri ve uygulama setinin sahaya doğru aktarımı.",
    durationShare: "%12 Program Payı",
    governingStandards: ["Planlı Alanlar İmar Yönetmeliği", "TBDY 2018", "TS 825"],
    deliverables: [
      "Geoteknik zemin etüt raporu ve temel öneri paftası",
      "Mimari, statik, mekanik ve elektrik çakışma (BIM/CAD) süperpozesi",
      "Yapı ruhsatı, yapı denetim dosya onayı ve şantiye aplikasyon krokisi",
    ],
    fieldControls: [
      "Parsel köşe kazıkları ve siyah/kırmızı kot tutanağının harita mühendisiyle teyidi",
      "Statik ve mimari aksların kolon boyutları yönünden birebir eşleştirilmesi",
    ],
    elevationNote:
      "Aks, kot ve imar zarfı kilitlenir; sahadaki tüm ölçüm referansları bu fazda doğar.",
  },
  {
    number: "02",
    slug: "kazi-temel",
    href: "/rehber/kazi-temel",
    title: "Kazı & Temel",
    summary:
      "Zemin verisinin okunması, hafriyat, iksa ve temel sistemi kararlarının güvenli ve kontrollü biçimde uygulanması.",
    durationShare: "%15 Program Payı",
    governingStandards: ["TBDY 2018 Bölüm 16", "TS 500", "TS EN 1997-1"],
    deliverables: [
      "İksa / mini kazık / ankraj imalatı ve inklinometre izleme kayıtları",
      "Grobeton, bohçalama su yalıtımı ve koruma şapı",
      "Radye temel donatı kabulü, topraklama şeridi ve kolon filiz aplikasyonu",
    ],
    fieldControls: [
      "Kazı tabanında geoteknik mühendisi zemin taşıma gücü ve yeraltı suyu onayı",
      "Temel pas payı (≥50 mm), sehpa donatısı ve su tutucu bant sürekliliği",
    ],
    elevationNote:
      "Yapı yüklerinin zemine güvenle aktarıldığı kritik geoteknik–statik geçiş katmanı.",
  },
  {
    number: "03",
    slug: "kaba-insaat",
    href: "/rehber/kaba-insaat",
    title: "Kaba İnşaat",
    summary:
      "Taşıyıcı sistemin şekillendiği kalıp, donatı, beton ve duvar imalatlarının birbirine senkron yürütüldüğü ana saha fazı.",
    durationShare: "%32 Program Payı",
    governingStandards: ["TS 500", "TBDY 2018", "TS EN 206"],
    deliverables: [
      "Perde, kolon, kiriş ve döşeme taşıyıcı karkas imalatları",
      "7 ve 28 günlük beton basınç dayanım laboratuvar raporları",
      "Bölme duvar, lento ve çatı taşıyıcı tamamlama işleri",
    ],
    fieldControls: [
      "Her döküm öncesi yapı denetim demir/kalıp tutanağı ve beton slump kontrolü",
      "Kürleme (sulama/kür malzemesi) ve kalıp söküm dayanım sürelerine uyum",
    ],
    elevationNote:
      "Betonarme iskeletin tüm katlarda milimetrik aks toleransı ile yükseldiği çekirdek faz.",
  },
  {
    number: "04",
    slug: "ince-isler",
    href: "/rehber/ince-isler",
    title: "İnce İşler",
    summary:
      "Kullanım kalitesini, görünürlüğü ve bakım performansını belirleyen kaplama, doğrama ve bitirme imalatları.",
    durationShare: "%22 Program Payı",
    governingStandards: ["TS 825", "TS EN 13813", "Binaların Yangından Korunması Yön."],
    deliverables: [
      "Dış cephe ısı yalıtımı, doğrama montajı ve sızdırmazlık detayları",
      "Sıva, şap, ıslak hacim su yalıtımı, seramik ve parke kaplamaları",
      "İç kapı, sabit mobilya ve son kat boya imalatları",
    ],
    fieldControls: [
      "Islak hacimlerde 48 saatlik göllendirme su yalıtım testi",
      "Şap kotu, mastar düzgünlüğü ve cephe ısı köprüsü termal kontrolü",
    ],
    elevationNote:
      "Yapı fiziği, akustik, su yalıtımı ve yüzey toleranslarının kalıcı konfora dönüştüğü aşama.",
  },
  {
    number: "05",
    slug: "tesisat-isleri",
    href: "/rehber/tesisat-isleri",
    title: "Tesisat İşleri",
    summary:
      "Mekanik, elektrik ve yangın sistemlerinin yapıyla çakışmadan, testlenebilir ve işletilebilir biçimde kurulması.",
    durationShare: "%12 Program Payı",
    governingStandards: ["TS EN 12845", "Elektrik İç Tesisleri Yön.", "TS EN 806"],
    deliverables: [
      "Temiz/pis su, ısıtma-soğutma, havalandırma ve yangın sprinkler hatları",
      "Kuvvetli/zayıf akım panoları, topraklama ve paratoner ölçüm raporları",
      "Asansör montajı, hidrofor ve kazan dairesi devreye alma",
    ],
    fieldControls: [
      "Şap öncesi boru hatlarında basınç testi ve fotoğraf/as-built kayıtları",
      "Yangın zon geçişlerinde yangın durdurucu mastik ve damper doğrulaması",
    ],
    elevationNote:
      "Mekanik, elektrik ve yangın güvenliği omurgasının test raporlarıyla doğrulandığı faz.",
  },
  {
    number: "06",
    slug: "peyzaj-teslim",
    href: "/rehber/peyzaj-teslim",
    title: "Peyzaj & Teslim",
    summary:
      "Çevre düzenleme, son kontroller, işletmeye alma ve iskan kapanışına uzanan proje tamamlama fazı.",
    durationShare: "%7 Program Payı",
    governingStandards: ["Yapı Kullanma İzni Yön.", "BEP-TR Enerji Kimlik Belgesi"],
    deliverables: [
      "Saha drenajı, sert zemin, aydınlatma ve çevre peyzaj uygulaması",
      "As-built (uygulama sonu) proje arşivi ve işletme bakım kılavuzları",
      "Eksik işler (punch-list) kapanışı, EKB ve Yapı Kullanma İzni (İskan)",
    ],
    fieldControls: [
      "Bağımsız bölüm bazlı kabul listesi ve tüm mekanik/elektrik fonksiyon testleri",
      "Yağmur suyu drenaj eğimi ve ortak alan güvenlik sistemleri nihai denetimi",
    ],
    elevationNote:
      "Mühendislik tasarımının doğrulanmış performans ve yasal iskan ile kullanıcıya devri.",
  },
];
