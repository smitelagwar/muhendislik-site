export type ToolIconKey =
  | "rebar"
  | "column"
  | "beam"
  | "slab"
  | "cover"
  | "site"
  | "insulation"
  | "plot"
  | "earthquake"
  | "check"
  | "soil"
  | "punching"
  | "shear"
  | "splice"
  | "period"
  | "drift"
  | "foundation"
  | "retaining"
  | "slope"
  | "steel"
  | "bolt"
  | "timber"
  | "quantity"
  | "earthwork"
  | "weight"
  | "frame"
  | "brickwall"
  | "paintroller"
  | "home"
  | "grid";

export interface ToolDefinition {
  id: string;
  name: string;
  href: string;
  description: string;
  iconKey: ToolIconKey;
  discipline: string;
  featured: boolean;
  status: "live";
  order: number;
}

export const TOOLS_HUB_HREF = "/kategori/araclar";

export const TOOLS: ToolDefinition[] = [
  {
    id: "donati-hesabi",
    name: "Donatı Hesabı",
    href: "/kategori/araclar/donati-hesabi",
    description: "Çap ve adet girerek toplam donatı alanını ve eşdeğer seçenekleri hızlıca görün.",
    iconKey: "rebar",
    discipline: "Donatı Tasarımı",
    featured: true,
    status: "live",
    order: 1,
  },
  {
    id: "kolon-on-boyutlandirma",
    name: "Kolon Ön Boyutlandırma",
    href: "/kategori/araclar/kolon-on-boyutlandirma",
    description: "Dikdörtgen kolonlar için ilk kesiti ve tasarım alanını hızlı şekilde kontrol edin.",
    iconKey: "column",
    discipline: "Betonarme",
    featured: false,
    status: "live",
    order: 2,
  },
  {
    id: "kiris-kesiti",
    name: "Kiriş Kesiti",
    href: "/kategori/araclar/kiris-kesiti",
    description: "Eğilme donatısı ve kesme kontrolünü TS 500 mantığıyla aynı ekranda hızlıca görün.",
    iconKey: "beam",
    discipline: "Kiriş Tasarımı",
    featured: false,
    status: "live",
    order: 3,
  },
  {
    id: "doseme-kalinligi",
    name: "Döşeme Kalınlığı",
    href: "/kategori/araclar/doseme-kalinligi",
    description: "Açıklık-kalınlık oranı ve minimum donatı aralığını tek araçta ön kontrol edin.",
    iconKey: "slab",
    discipline: "Döşeme Tasarımı",
    featured: false,
    status: "live",
    order: 4,
  },
  {
    id: "pas-payi",
    name: "Pas Payı",
    href: "/kategori/araclar/pas-payi",
    description: "Nominal beton örtüsünü ve pratik pas payını hızlıca hesaplayın.",
    iconKey: "cover",
    discipline: "Betonarme Detay",
    featured: false,
    status: "live",
    order: 5,
  },
  {
    id: "zimbalama-kontrolu",
    name: "Döşeme Zımbalama Kontrolü",
    href: "/kategori/araclar/zimbalama-kontrolu",
    description: "Mantar ve radye döşemelerde kolon çevresi kayma gerilmesini ve zımbalama donatısını hesaplayın.",
    iconKey: "punching",
    discipline: "Betonarme",
    featured: false,
    status: "live",
    order: 6,
  },
  {
    id: "kiris-kesme-etriye",
    name: "Kiriş Kesme & Etriye Hesabı",
    href: "/kategori/araclar/kiris-kesme-etriye",
    description: "TS 500 kayma dayanımı (Vc + Vw) ve etriye sıklaştırma bölgesi aralığını (s) belirleyin.",
    iconKey: "shear",
    discipline: "Kiriş Tasarımı",
    featured: false,
    status: "live",
    order: 7,
  },
  {
    id: "kenetlenme-boyu",
    name: "Donatı Kenetlenme & Ek Boyu",
    href: "/kategori/araclar/kenetlenme-boyu",
    description: "Donatı çapı, beton sınıfı ve konumuna göre lb, lbd kenetlenme ve bindirme ek boyunu bulun.",
    iconKey: "splice",
    discipline: "Donatı Tasarımı",
    featured: false,
    status: "live",
    order: 8,
  },
  {
    id: "taban-kesme-kuvveti",
    name: "Eşdeğer Deprem Yükü",
    href: "/kategori/araclar/taban-kesme-kuvveti",
    description: "TBDY 2018'e göre taban kesme kuvvetini ve katlara dağılan yatay deprem yüklerini hesaplayın.",
    iconKey: "earthquake",
    discipline: "Deprem Mühendisliği",
    featured: false,
    status: "live",
    order: 9,
  },
  {
    id: "duzensizlik-kontrolu",
    name: "Düzensizlik Kontrolü",
    href: "/kategori/araclar/duzensizlik-kontrolu",
    description: "TBDY 2018'e göre A1–A3 plan ve B1–B3 düşey düzensizliklerini kontrol edin.",
    iconKey: "check",
    discipline: "Deprem Mühendisliği",
    featured: false,
    status: "live",
    order: 10,
  },
  {
    id: "zemin-sinifi",
    name: "Yerel Zemin Sınıfı",
    href: "/kategori/araclar/zemin-sinifi",
    description: "Vs30, SPT-N60 veya cu verileriyle TBDY 2018 yerel zemin sınıfını belirleyin.",
    iconKey: "soil",
    discipline: "Geoteknik",
    featured: false,
    status: "live",
    order: 11,
  },
  {
    id: "deprem-periyot-hesabi",
    name: "Hakim Periyot & Spektral İvme",
    href: "/kategori/araclar/deprem-periyot-hesabi",
    description: "TBDY 2018 ivme spektrumu katsayıları (SDS, SD1) ve yapı periyodu (T) hesabını yapın.",
    iconKey: "period",
    discipline: "Deprem Mühendisliği",
    featured: false,
    status: "live",
    order: 12,
  },
  {
    id: "goreli-kat-otelemesi",
    name: "Göreli Kat Ötelemesi (Drift)",
    href: "/kategori/araclar/goreli-kat-otelemesi",
    description: "TBDY 2018 Tablo 4.3 kat ötelemesi ve ikinci mertebe gösterge sınırlarını tahkik edin.",
    iconKey: "drift",
    discipline: "Deprem Mühendisliği",
    featured: false,
    status: "live",
    order: 13,
  },
  {
    id: "radye-temel-hesabi",
    name: "Radye Temel Kalınlık & Zımbalama",
    href: "/kategori/araclar/radye-temel-hesabi",
    description: "Radye temel ampatman boyu, plaka kalınlığı ve kolon altı zımbalama çevresini kontrol edin.",
    iconKey: "foundation",
    discipline: "Geoteknik",
    featured: false,
    status: "live",
    order: 15,
  },
  {
    id: "iksa-toprak-basinci",
    name: "İksa Perdesi Toprak Basıncı",
    href: "/kategori/araclar/iksa-toprak-basinci",
    description: "Rankine & Coulomb aktif/pasif toprak basıncı katsayılarını (Ka, Kp) ve itkisini hesaplayın.",
    iconKey: "retaining",
    discipline: "Geoteknik",
    featured: false,
    status: "live",
    order: 16,
  },
  {
    id: "sev-stabilitesi",
    name: "Şev Stabilitesi Güvenlik Katsayısı",
    href: "/kategori/araclar/sev-stabilitesi",
    description: "Kazı ve dolgu şevlerinde dairesel kayma yüzeyi Fellenius güvenlik katsayısını (Fs) görün.",
    iconKey: "slope",
    discipline: "Geoteknik",
    featured: false,
    status: "live",
    order: 17,
  },
  {
    id: "celik-profil-secimi",
    name: "Çelik Profil Seçimi & Narinlik",
    href: "/kategori/araclar/celik-profil-secimi",
    description: "IPE, HEA, HEB kesitlerin narinlik oranı (lambda) ve eksenel burkulma kapasitesini inceleyin.",
    iconKey: "steel",
    discipline: "Çelik & Ahşap",
    featured: false,
    status: "live",
    order: 18,
  },
  {
    id: "celik-birlestesi-hesabi",
    name: "Çelik Cıvata & Kaynak Hesabı",
    href: "/kategori/araclar/celik-birlestesi-hesabi",
    description: "Bulon kesme, ezilme mukavemeti ve köşe kaynak dikişi emniyet gerilmesi tahkikini yapın.",
    iconKey: "bolt",
    discipline: "Çelik & Ahşap",
    featured: false,
    status: "live",
    order: 19,
  },
  {
    id: "ahsap-eleman-hesabi",
    name: "Ahşap Kiriş & Dikme Taşıma Gücü",
    href: "/kategori/araclar/ahsap-eleman-hesabi",
    description: "Ahşap elemanlarda emniyet gerilmesi, eğilme ve narinlik tahkikini yapın.",
    iconKey: "timber",
    discipline: "Çelik & Ahşap",
    featured: false,
    status: "live",
    order: 20,
  },
  {
    id: "kalip-sokum-suresi",
    name: "Kalıp Söküm Süresi",
    href: "/kategori/araclar/kalip-sokum-suresi",
    description: "Çimento tipi, sıcaklık ve eleman tipine göre tahmini kalıp söküm süresini görün.",
    iconKey: "site",
    discipline: "Şantiye",
    featured: false,
    status: "live",
    order: 21,
  },
  {
    id: "dis-cephe-yalitim-kalinligi",
    name: "Dış Cephe Yalıtım Kalınlığı",
    href: "/kategori/araclar/dis-cephe-yalitim-kalinligi",
    description: "TS 825:2024 mantığıyla dış duvar için önerilen yalıtım kalınlığını hızlıca görün.",
    iconKey: "insulation",
    discipline: "Isı Yalıtımı",
    featured: false,
    status: "live",
    order: 22,
  },
  {
    id: "imar-hesaplayici",
    name: "İmar Hesaplayıcı",
    href: "/kategori/araclar/imar-hesaplayici",
    description: "Arsa alanı, TAKS, KAKS ve çekme mesafelerine göre yapılaşma özetini kontrol edin.",
    iconKey: "plot",
    discipline: "İmar",
    featured: false,
    status: "live",
    order: 23,
  },
  {
    id: "beton-metraj-hesabi",
    name: "Şantiye Beton & Harç Metrajı",
    href: "/kategori/araclar/beton-metraj-hesabi",
    description: "Eleman geometrisi ve zayiat katsayısından pompalı hazır beton metrajını çıkarın.",
    iconKey: "quantity",
    discipline: "Şantiye",
    featured: false,
    status: "live",
    order: 24,
  },
  {
    id: "hafriyat-metraj-hesabi",
    name: "Hafriyat & Kamyon Sefer",
    href: "/kategori/araclar/hafriyat-metraj-hesabi",
    description: "Zemin türüne göre kabarma faktörlü kazı hacmi ve kamyon sefer sayısını çıkarın.",
    iconKey: "earthwork",
    discipline: "Şantiye & Metraj",
    featured: false,
    status: "live",
    order: 25,
  },
  {
    id: "pratik-donati-metraji",
    name: "Pratik Demir Metrajı",
    href: "/kategori/araclar/pratik-donati-metraji",
    description: "Kat alanı veya beton hacmine göre yaklaşık donatı tonajını (pursantaj) hesaplayın.",
    iconKey: "weight",
    discipline: "Şantiye & Metraj",
    featured: false,
    status: "live",
    order: 26,
  },
  {
    id: "pratik-kalip-metraji",
    name: "Pratik Kalıp Metrajı",
    href: "/kategori/araclar/pratik-kalip-metraji",
    description: "Kat alanı üzerinden pratik katsayılar ile toplam kalıp yüzeyi alanını (m²) tahmin edin.",
    iconKey: "frame",
    discipline: "Şantiye & Metraj",
    featured: false,
    status: "live",
    order: 27,
  },
  {
    id: "duvar-metraji-hesabi",
    name: "Duvar & Tuğla Metrajı",
    href: "/kategori/araclar/duvar-metraji-hesabi",
    description: "Kat alanından duvar alanına geçiş yaparak tuğla, bims veya gazbeton adetlerini bulun.",
    iconKey: "brickwall",
    discipline: "Şantiye & Metraj",
    featured: false,
    status: "live",
    order: 28,
  },
  {
    id: "siva-boya-metraji",
    name: "Sıva & Boya Metrajı",
    href: "/kategori/araclar/siva-boya-metraji",
    description: "Duvar ve tavan alanlarından hareketle astar, boya tenekesi ve alçı sarfiyatını çıkarın.",
    iconKey: "paintroller",
    discipline: "Şantiye & Metraj",
    featured: false,
    status: "live",
    order: 29,
  },
  {
    id: "cati-kaplama-metraji",
    name: "Çatı & Ahşap Metrajı",
    href: "/kategori/araclar/cati-kaplama-metraji",
    description: "Bina taban alanı ve saçak payına göre kiremit, mebran, OSB ve ahşap karkas miktarını bulun.",
    iconKey: "home",
    discipline: "Şantiye & Metraj",
    featured: false,
    status: "live",
    order: 30,
  },
  {
    id: "seramik-fayans-metraji",
    name: "Seramik & Fayans Metrajı",
    href: "/kategori/araclar/seramik-fayans-metraji",
    description: "Islak hacimlerde metrekare üzerinden seramik adedi, yapıştırıcı ve derz dolgu miktarını bulun.",
    iconKey: "grid",
    discipline: "Şantiye & Metraj",
    featured: false,
    status: "live",
    order: 31,
  },
];

export function getLiveTools(): ToolDefinition[] {
  return TOOLS.filter((tool) => tool.status === "live").sort((left, right) => left.order - right.order);
}

export function getFeaturedTool(): ToolDefinition | null {
  const liveTools = getLiveTools();
  return liveTools.find((tool) => tool.featured) ?? liveTools[0] ?? null;
}

export function getToolDefinition(id: string): ToolDefinition | undefined {
  return TOOLS.find((tool) => tool.id === id);
}
