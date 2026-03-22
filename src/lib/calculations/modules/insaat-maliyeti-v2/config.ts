import type { OfficialCostSelection } from "@/lib/calculations/official-unit-costs";
import type {
  ClimateZone,
  ContractorProfileKey,
  CostItemGroup,
  FacadeSystemKey,
  HeatingSystemKey,
  MepLevel,
  ParkingType,
  QualityLevel,
  RegionKey,
  SiteDifficulty,
  SoilClass,
  StructureKind,
  WetAreaDensity,
} from "./types";

export interface OptionDefinition<T extends string> {
  value: T;
  label: string;
  multiplier: number;
  note?: string;
}

export interface SoilDefinition {
  label: string;
  excavationMultiplier: number;
  structuralMultiplier: number;
  waterproofingMultiplier: number;
  note: string;
}

export interface ContractorProfileDefinition {
  label: string;
  riskFactor: number;
  recommendedMarginMin: number;
  recommendedMarginMax: number;
  note: string;
}

export interface BaseCostItemConfig {
  id: string;
  label: string;
  description: string;
  group: CostItemGroup;
  baseRate: number;
  quantityKey:
    | "equivalentArea"
    | "physicalArea"
    | "saleableArea"
    | "parkingArea"
    | "landscapeArea"
    | "unitCount"
    | "elevatorCount"
    | "subtotal";
  order: number;
}

export const AREA_COEFFICIENTS = {
  basement: 0.75,
  normal: 1,
  mezzanine: 0.6,
  roofTerrace: 0.5,
} as const;

export const QUALITY_OPTIONS: Record<QualityLevel, OptionDefinition<QualityLevel>> = {
  ekonomik: {
    value: "ekonomik",
    label: "Ekonomik",
    multiplier: 0.82,
    note: "Temel performans, düşük dekoratif yoğunluk.",
  },
  standart: {
    value: "standart",
    label: "Standart",
    multiplier: 1,
    note: "Tipik konut ve ofis projeleri için referans paket.",
  },
  premium: {
    value: "premium",
    label: "Premium",
    multiplier: 1.24,
    note: "Cephe, doğrama ve ıslak hacim kalemlerinde üst segment artış.",
  },
  luks: {
    value: "luks",
    label: "Lüks",
    multiplier: 1.58,
    note: "Üst seviye malzeme paketi ve yoğun teknik donanım.",
  },
};

export const REGION_OPTIONS: Record<RegionKey, OptionDefinition<RegionKey>> = {
  istanbul_avrupa: {
    value: "istanbul_avrupa",
    label: "İstanbul (Avrupa Yakası)",
    multiplier: 1.22,
    note: "Yoğun lojistik ve işçilik maliyeti.",
  },
  istanbul_anadolu: {
    value: "istanbul_anadolu",
    label: "İstanbul (Anadolu Yakası)",
    multiplier: 1.18,
    note: "Ulaşım ve işçilik baskısı yüksek.",
  },
  ankara: {
    value: "ankara",
    label: "Ankara",
    multiplier: 1.06,
    note: "Kaya zemin ve iklim etkisi belirgin.",
  },
  izmir: {
    value: "izmir",
    label: "İzmir",
    multiplier: 1.1,
    note: "Deprem tasarım etkisi ve kıyı lojistiği.",
  },
  bursa: { value: "bursa", label: "Bursa", multiplier: 1.03 },
  antalya: {
    value: "antalya",
    label: "Antalya",
    multiplier: 1.05,
    note: "Turizm sezonunda işçilik oynaklığı.",
  },
  kayseri: {
    value: "kayseri",
    label: "Kayseri",
    multiplier: 0.94,
    note: "Yerel malzeme arzı güçlü.",
  },
  trabzon: {
    value: "trabzon",
    label: "Trabzon",
    multiplier: 0.98,
    note: "Yağış nedeniyle yalıtım baskısı artar.",
  },
  diger_buyuksehir: {
    value: "diger_buyuksehir",
    label: "Diğer Büyükşehir",
    multiplier: 1,
  },
  il_merkezi: {
    value: "il_merkezi",
    label: "İl Merkezi",
    multiplier: 0.95,
  },
  ilce: {
    value: "ilce",
    label: "İlçe / Kasaba",
    multiplier: 0.89,
    note: "Tedarik ve uzman ekip erişimi sınırlı olabilir.",
  },
};

export const SOIL_OPTIONS: Record<SoilClass, SoilDefinition> = {
  ZA: {
    label: "ZA · Sağlam Kaya",
    excavationMultiplier: 1.16,
    structuralMultiplier: 0.94,
    waterproofingMultiplier: 0.92,
    note: "Kazı pahalı, temel davranışı avantajlı.",
  },
  ZB: {
    label: "ZB · Az Ayrışmış Kaya",
    excavationMultiplier: 1.08,
    structuralMultiplier: 0.97,
    waterproofingMultiplier: 0.96,
    note: "Kentsel sert zemin bandı.",
  },
  ZC: {
    label: "ZC · Tipik Kentsel Zemin",
    excavationMultiplier: 1,
    structuralMultiplier: 1,
    waterproofingMultiplier: 1,
    note: "Baz senaryo.",
  },
  ZD: {
    label: "ZD · Orta Kil / Kum",
    excavationMultiplier: 0.98,
    structuralMultiplier: 1.12,
    waterproofingMultiplier: 1.08,
    note: "Temel güçlendirme gerektirebilir.",
  },
  ZE: {
    label: "ZE · Yumuşak Kil / Gevşek Kum",
    excavationMultiplier: 1.04,
    structuralMultiplier: 1.26,
    waterproofingMultiplier: 1.16,
    note: "Zemin iyileştirme ve perde baskısı yüksek.",
  },
};

export const SITE_DIFFICULTY_OPTIONS: Record<SiteDifficulty, OptionDefinition<SiteDifficulty>> = {
  dusuk: { value: "dusuk", label: "Düşük", multiplier: 0.97 },
  orta: { value: "orta", label: "Orta", multiplier: 1 },
  yuksek: {
    value: "yuksek",
    label: "Yüksek",
    multiplier: 1.08,
    note: "Dar saha, komşu riskleri ve zor lojistik.",
  },
  cokYuksek: {
    value: "cokYuksek",
    label: "Çok Yüksek",
    multiplier: 1.15,
    note: "Sıkışık şehir içi veya derin kazı koşulları.",
  },
};

export const CLIMATE_OPTIONS: Record<ClimateZone, OptionDefinition<ClimateZone>> = {
  iliman: { value: "iliman", label: "Ilıman", multiplier: 1 },
  sert: {
    value: "sert",
    label: "Sert Kış Koşulu",
    multiplier: 1.04,
    note: "Yalıtım ve geçici saha giderleri yükselir.",
  },
  sicakNemli: {
    value: "sicakNemli",
    label: "Sıcak / Nemli",
    multiplier: 1.02,
    note: "Cephe ve mekanik yükler artar.",
  },
};

export const HEATING_OPTIONS: Record<HeatingSystemKey, OptionDefinition<HeatingSystemKey>> = {
  bireyselKombi: {
    value: "bireyselKombi",
    label: "Bireysel Kombi",
    multiplier: 1,
  },
  merkeziKazan: {
    value: "merkeziKazan",
    label: "Merkezi Kazan",
    multiplier: 1.07,
    note: "Ortak mekanik hacim ve ekipman etkisi.",
  },
  yerdenIsitma: {
    value: "yerdenIsitma",
    label: "Yerden Isıtma",
    multiplier: 1.09,
    note: "Şap ve mekanik dağıtım yoğunluğu artar.",
  },
  vrf: {
    value: "vrf",
    label: "VRF / Fan Coil",
    multiplier: 1.14,
    note: "Ticari ve premium projelerde MEP baskısı yüksek.",
  },
};

export const FACADE_OPTIONS: Record<FacadeSystemKey, OptionDefinition<FacadeSystemKey>> = {
  klasik: { value: "klasik", label: "Mantolama + Sıva", multiplier: 1 },
  kompozit: {
    value: "kompozit",
    label: "Kompozit Cephe",
    multiplier: 1.06,
  },
  premiumCam: {
    value: "premiumCam",
    label: "Yüksek Cam Oranlı Cephe",
    multiplier: 1.11,
  },
  tasCephe: {
    value: "tasCephe",
    label: "Taş / Doğal Kaplama",
    multiplier: 1.14,
  },
};

export const MEP_OPTIONS: Record<MepLevel, OptionDefinition<MepLevel>> = {
  dusuk: { value: "dusuk", label: "Düşük", multiplier: 0.94 },
  orta: { value: "orta", label: "Orta", multiplier: 1 },
  yuksek: { value: "yuksek", label: "Yüksek", multiplier: 1.08 },
  premium: { value: "premium", label: "Premium", multiplier: 1.15 },
};

export const WET_AREA_OPTIONS: Record<WetAreaDensity, OptionDefinition<WetAreaDensity>> = {
  dusuk: { value: "dusuk", label: "Düşük", multiplier: 0.95 },
  orta: { value: "orta", label: "Orta", multiplier: 1 },
  yuksek: {
    value: "yuksek",
    label: "Yüksek",
    multiplier: 1.08,
    note: "Banyo/mutfak yoğunluğunda mekanik ve seramik etkisi artar.",
  },
};

export const PARKING_OPTIONS: Record<ParkingType, OptionDefinition<ParkingType>> = {
  yok: { value: "yok", label: "Yok", multiplier: 0 },
  acik: { value: "acik", label: "Açık Otopark", multiplier: 1 },
  kapali: { value: "kapali", label: "Kapalı Otopark", multiplier: 1.75 },
};

export const CONTRACTOR_PROFILES: Record<
  ContractorProfileKey,
  ContractorProfileDefinition
> = {
  bireysel: {
    label: "Bireysel / Küçük Müteahhit",
    riskFactor: 1.08,
    recommendedMarginMin: 8,
    recommendedMarginMax: 15,
    note: "Düşük organizasyon maliyeti, daha yüksek saha riski.",
  },
  ortaOlcekli: {
    label: "Orta Ölçekli Müteahhit",
    riskFactor: 1,
    recommendedMarginMin: 12,
    recommendedMarginMax: 20,
    note: "Referans baz senaryo.",
  },
  kurumsal: {
    label: "Kurumsal Yüklenici",
    riskFactor: 0.96,
    recommendedMarginMin: 18,
    recommendedMarginMax: 28,
    note: "Daha oturmuş süreç, daha yüksek ticari marj beklentisi.",
  },
};

export const STRUCTURE_KIND_MULTIPLIERS: Record<StructureKind, number> = {
  apartman: 1,
  villa: 1.18,
  ofis: 1.12,
  ticari: 1.08,
};

export const BASE_COST_ITEMS: BaseCostItemConfig[] = [
  {
    id: "hafriyat",
    label: "Hafriyat ve Kazı",
    description: "Kazı, nakliye, temel altı hazırlıkları ve şev emniyeti.",
    group: "direct",
    baseRate: 250,
    quantityKey: "physicalArea",
    order: 1,
  },
  {
    id: "temel-betonarme",
    label: "Temel ve Betonarme",
    description: "Temel, perde, kolon, kiriş, döşeme ve donatı paketi.",
    group: "direct",
    baseRate: 5100,
    quantityKey: "equivalentArea",
    order: 2,
  },
  {
    id: "duvar-cati",
    label: "Duvar, Çatı ve Yalıtım",
    description: "Duvar, çatı, su/ısı yalıtımı ve kaba zarf tamamlaması.",
    group: "direct",
    baseRate: 1380,
    quantityKey: "equivalentArea",
    order: 3,
  },
  {
    id: "dis-cephe",
    label: "Dış Cephe ve Doğrama",
    description: "Cephe sistemi, mantolama, doğrama ve cephe erişim maliyeti.",
    group: "direct",
    baseRate: 1820,
    quantityKey: "equivalentArea",
    order: 4,
  },
  {
    id: "ince-finish",
    label: "İnce İşler",
    description: "Şap, sıva, boya, seramik, parke, sabit mobilya ve mahal finishleri.",
    group: "direct",
    baseRate: 2650,
    quantityKey: "equivalentArea",
    order: 5,
  },
  {
    id: "mekanik",
    label: "Mekanik Tesisat",
    description: "Temiz/pis su, ısıtma, soğutma ve mekanik ekipman altyapısı.",
    group: "direct",
    baseRate: 1280,
    quantityKey: "equivalentArea",
    order: 6,
  },
  {
    id: "elektrik",
    label: "Elektrik Tesisatı",
    description: "Kuvvetli akım, zayıf akım, aydınlatma ve pano altyapısı.",
    group: "direct",
    baseRate: 920,
    quantityKey: "equivalentArea",
    order: 7,
  },
  {
    id: "asansor",
    label: "Asansör ve Düşey Ulaşım",
    description: "Asansör ekipmanı, kabin ve montaj.",
    group: "direct",
    baseRate: 285000,
    quantityKey: "elevatorCount",
    order: 8,
  },
  {
    id: "otopark",
    label: "Otopark / Garaj",
    description: "Açık veya kapalı otopark yüzeyleri ve manevra alanı etkisi.",
    group: "direct",
    baseRate: 980,
    quantityKey: "parkingArea",
    order: 9,
  },
  {
    id: "peyzaj",
    label: "Peyzaj ve Çevre Düzenleme",
    description: "Dış çevre, yaya yolu, aydınlatma ve basit peyzaj imalatları.",
    group: "direct",
    baseRate: 220,
    quantityKey: "landscapeArea",
    order: 10,
  },
];

export const GROUP_LABELS: Record<
  CostItemGroup,
  { label: string; description: string }
> = {
  direct: {
    label: "Doğrudan Yapım",
    description: "Kaba, ince, MEP, otopark ve çevre imalatları.",
  },
  indirect: {
    label: "Şantiye ve Dolaylı",
    description: "Organizasyon, lojistik ve geçici saha giderleri.",
  },
  soft: {
    label: "Yumuşak Maliyetler",
    description: "Ruhsat, proje, danışmanlık, sigorta ve kontrollük.",
  },
  commercial: {
    label: "Ticari Katman",
    description: "Contingency, müteahhit profili, kâr ve KDV.",
  },
};

export const AUTO_BENCHMARK_MAP: Record<
  StructureKind,
  Record<QualityLevel, OfficialCostSelection>
> = {
  apartman: {
    ekonomik: { yil: 2026, grup: "II", sinif: "A" },
    standart: { yil: 2026, grup: "III", sinif: "B" },
    premium: { yil: 2026, grup: "IV", sinif: "A" },
    luks: { yil: 2026, grup: "IV", sinif: "C" },
  },
  villa: {
    ekonomik: { yil: 2026, grup: "III", sinif: "A" },
    standart: { yil: 2026, grup: "III", sinif: "C" },
    premium: { yil: 2026, grup: "IV", sinif: "B" },
    luks: { yil: 2026, grup: "V", sinif: "A" },
  },
  ofis: {
    ekonomik: { yil: 2026, grup: "III", sinif: "B" },
    standart: { yil: 2026, grup: "III", sinif: "D" },
    premium: { yil: 2026, grup: "IV", sinif: "C" },
    luks: { yil: 2026, grup: "V", sinif: "A" },
  },
  ticari: {
    ekonomik: { yil: 2026, grup: "II", sinif: "C" },
    standart: { yil: 2026, grup: "III", sinif: "C" },
    premium: { yil: 2026, grup: "IV", sinif: "B" },
    luks: { yil: 2026, grup: "V", sinif: "B" },
  },
};

export const STORAGE_KEYS = {
  draft: "construction-cost-v2-draft",
  revisions: "construction-cost-v2-revisions",
} as const;
