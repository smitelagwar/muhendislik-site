import type { OfficialCostSelection } from "@/lib/calculations/official-unit-costs";
import type {
  QuickQuantityArchetype,
  QuickQuantityBasementRetainingCondition,
  QuickQuantityFoundationType,
  QuickQuantityPlanCompactness,
  QuickQuantityPreset,
  QuickQuantitySeismicDemand,
  QuickQuantitySlabSystem,
  QuickQuantitySoilClass,
  QuickQuantitySpanClass,
  QuickQuantityStructuralSystem,
} from "./types";

export interface QuickQuantityOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

function selection(
  grup: OfficialCostSelection["grup"],
  sinif: OfficialCostSelection["sinif"]
): OfficialCostSelection {
  return { yil: 2026, grup, sinif };
}

export const QUICK_QUANTITY_STRUCTURAL_SYSTEM_OPTIONS: QuickQuantityOption<QuickQuantityStructuralSystem>[] =
  [
    { value: "cerceve", label: "Çerçeve" },
    { value: "cercevePerde", label: "Çerçeve + Perde" },
    { value: "perdeAgirlikli", label: "Perde Ağırlıklı" },
  ];

export const QUICK_QUANTITY_SLAB_SYSTEM_OPTIONS: QuickQuantityOption<QuickQuantitySlabSystem>[] =
  [
    { value: "kirisli", label: "Kirişli Döşeme" },
    { value: "asmolen", label: "Asmolen Döşeme" },
    { value: "duzPlak", label: "Düz Plak" },
  ];

export const QUICK_QUANTITY_FOUNDATION_OPTIONS: QuickQuantityOption<QuickQuantityFoundationType>[] =
  [
    { value: "radye", label: "Radye Temel" },
    { value: "surekli", label: "Sürekli Temel" },
    { value: "tekil", label: "Tekil Temel" },
  ];

export const QUICK_QUANTITY_SOIL_OPTIONS: QuickQuantityOption<QuickQuantitySoilClass>[] = [
  { value: "ZA", label: "ZA" },
  { value: "ZB", label: "ZB" },
  { value: "ZC", label: "ZC" },
  { value: "ZD", label: "ZD" },
  { value: "ZE", label: "ZE" },
];

export const QUICK_QUANTITY_SEISMIC_OPTIONS: QuickQuantityOption<QuickQuantitySeismicDemand>[] = [
  {
    value: "dusuk",
    label: "Düşük Deprem Talebi",
    description: "Düşük sismik talep veya rijitlik ihtiyacının sınırlı olduğu senaryolar.",
  },
  {
    value: "orta",
    label: "Standart Deprem Talebi",
    description: "Türkiye şehir içi tipik betonarme yapı varsayımı.",
  },
  {
    value: "yuksek",
    label: "Yüksek Deprem Talebi",
    description: "Perde, düğüm bölgesi ve temel zorlamasının belirgin arttığı senaryolar.",
  },
];

export const QUICK_QUANTITY_PLAN_OPTIONS: QuickQuantityOption<QuickQuantityPlanCompactness>[] = [
  {
    value: "kompakt",
    label: "Kompakt Plan",
    description: "Kareye yakın, çevre uzunluğu düşük, sade plan kurgusu.",
  },
  {
    value: "standart",
    label: "Standart Plan",
    description: "Tipik apartman/ofis planı, orta çevre uzunluğu.",
  },
  {
    value: "girintili",
    label: "Girintili / Çıkıntılı",
    description: "Perimetre ve kalıp yüzeyi artan plan kurgusu.",
  },
];

export const QUICK_QUANTITY_RETAINING_OPTIONS: QuickQuantityOption<QuickQuantityBasementRetainingCondition>[] =
  [
    {
      value: "yok",
      label: "Çevre Perdesi Yok",
      description: "Bodrum yok veya çevresel istinat etkisi ihmal edilebilir.",
    },
    {
      value: "kismi",
      label: "Kısmi Çevre Perdesi",
      description: "Kısmen gömülü veya sadece birkaç cephede bodrum perdesi.",
    },
    {
      value: "tam",
      label: "Tam Çevre Perdesi",
      description: "Parsel sınırına yakın, tipik şehir içi tam bodrum çevre perdesi.",
    },
  ];

export const QUICK_QUANTITY_SPAN_OPTIONS: QuickQuantityOption<QuickQuantitySpanClass>[] = [
  {
    value: "dar",
    label: "Dar Açıklık",
    description: "Kolon sıklığı artan, döşeme açıklığı görece kısa planlar.",
  },
  {
    value: "standart",
    label: "Standart Açıklık",
    description: "Konut ve tipik ofis projelerinde yaygın açıklık bandı.",
  },
  {
    value: "genis",
    label: "Geniş Açıklık",
    description: "Otopark, ofis veya seyrek kolonlu ticari açıklıklar.",
  },
];

export const QUICK_QUANTITY_PRESETS: QuickQuantityPreset[] = [
  {
    id: "villa-bungalov",
    label: "Villa, dağ evi, bungalov",
    shortLabel: "Villa / Bungalov",
    description: "Düşük katlı müstakil betonarme konutlar için dengeli ön keşif katsayıları.",
    officialSelection: selection("II", "C"),
    defaultStructuralSystem: "cerceve",
    defaultSlabSystem: "kirisli",
    defaultFoundationType: "radye",
    defaultSeismicDemand: "orta",
    defaultPlanCompactness: "standart",
    defaultBasementRetainingCondition: "yok",
    defaultSpanClass: "standart",
    applicationNote:
      "Müstakil konutlarda merdiven-çekirdek etkisi sınırlı, kiriş-döşeme etkisi ise toplam maliyette baskındır.",
    warningTone: "info",
    carryingShareBand: { low: 0.24, expected: 0.3, high: 0.36 },
    baseBreakdown: {
      temel: { betonM3PerM2: 0.22, donatiKgPerM2: 24, kalipM2PerM2: 0.72 },
      kolonPerde: { betonM3PerM2: 0.042, donatiKgPerM2: 4.8, kalipM2PerM2: 0.42 },
      kirisDoseme: { betonM3PerM2: 0.13, donatiKgPerM2: 18, kalipM2PerM2: 0.78 },
      merdivenCekirdek: { betonM3PerM2: 0.01, donatiKgPerM2: 1.2, kalipM2PerM2: 0.06 },
    },
  },
  {
    id: "apartman-3-kat",
    label: "Apartman / 3 kat ve altı",
    shortLabel: "Apartman 3 Kat",
    description: "Az katlı betonarme apartmanlar ve küçük ölçekli konut blokları.",
    officialSelection: selection("III", "A"),
    defaultStructuralSystem: "cerceve",
    defaultSlabSystem: "kirisli",
    defaultFoundationType: "surekli",
    defaultSeismicDemand: "orta",
    defaultPlanCompactness: "standart",
    defaultBasementRetainingCondition: "tam",
    defaultSpanClass: "standart",
    applicationNote:
      "Düşük katlı apartmanlarda temel ve kirişli döşeme dengesi genellikle perdeli sistemlerden daha hafiftir.",
    warningTone: "info",
    carryingShareBand: { low: 0.22, expected: 0.28, high: 0.34 },
    baseBreakdown: {
      temel: { betonM3PerM2: 0.24, donatiKgPerM2: 28, kalipM2PerM2: 0.78 },
      kolonPerde: { betonM3PerM2: 0.06, donatiKgPerM2: 6.5, kalipM2PerM2: 0.52 },
      kirisDoseme: { betonM3PerM2: 0.16, donatiKgPerM2: 20, kalipM2PerM2: 0.88 },
      merdivenCekirdek: { betonM3PerM2: 0.011, donatiKgPerM2: 1.4, kalipM2PerM2: 0.08 },
    },
  },
  {
    id: "apartman-4-7-kat",
    label: "Apartman / 4-7 kat",
    shortLabel: "Apartman 4-7 Kat",
    description: "Orta katlı konut blokları için radye ve perde etkisini içeren referans set.",
    officialSelection: selection("III", "B"),
    defaultStructuralSystem: "cercevePerde",
    defaultSlabSystem: "kirisli",
    defaultFoundationType: "radye",
    defaultSeismicDemand: "orta",
    defaultPlanCompactness: "standart",
    defaultBasementRetainingCondition: "tam",
    defaultSpanClass: "standart",
    applicationNote:
      "Bu bant, tipik şehir apartmanında temel-perde ve kiriş-döşeme paketini birlikte öne çıkarır.",
    warningTone: "warning",
    carryingShareBand: { low: 0.21, expected: 0.27, high: 0.33 },
    baseBreakdown: {
      temel: { betonM3PerM2: 0.35, donatiKgPerM2: 34, kalipM2PerM2: 0.82 },
      kolonPerde: { betonM3PerM2: 0.07, donatiKgPerM2: 8.5, kalipM2PerM2: 0.75 },
      kirisDoseme: { betonM3PerM2: 0.17, donatiKgPerM2: 22, kalipM2PerM2: 1.12 },
      merdivenCekirdek: { betonM3PerM2: 0.015, donatiKgPerM2: 1.6, kalipM2PerM2: 0.09 },
    },
  },
  {
    id: "apartman-8-10-kat",
    label: "Apartman / 8-10 kat",
    shortLabel: "Apartman 8-10 Kat",
    description: "Yüksekliği artan konut bloklarında perde ve çekirdek yoğunluğu artan set.",
    officialSelection: selection("III", "C"),
    defaultStructuralSystem: "cercevePerde",
    defaultSlabSystem: "kirisli",
    defaultFoundationType: "radye",
    defaultSeismicDemand: "yuksek",
    defaultPlanCompactness: "standart",
    defaultBasementRetainingCondition: "tam",
    defaultSpanClass: "standart",
    applicationNote:
      "Perde yoğunluğu ve çekirdek etkisi, orta katlı apartman tipine göre daha belirgindir.",
    warningTone: "warning",
    carryingShareBand: { low: 0.2, expected: 0.26, high: 0.32 },
    baseBreakdown: {
      temel: { betonM3PerM2: 0.38, donatiKgPerM2: 38, kalipM2PerM2: 0.86 },
      kolonPerde: { betonM3PerM2: 0.082, donatiKgPerM2: 10.2, kalipM2PerM2: 0.82 },
      kirisDoseme: { betonM3PerM2: 0.175, donatiKgPerM2: 23.5, kalipM2PerM2: 1.14 },
      merdivenCekirdek: { betonM3PerM2: 0.016, donatiKgPerM2: 1.8, kalipM2PerM2: 0.095 },
    },
  },
  {
    id: "apartman-11-17-kat",
    label: "Apartman / 11-17 kat",
    shortLabel: "Apartman 11-17 Kat",
    description: "Yüksek konutlarda daha yoğun perde, çekirdek ve temel etkisini taşıyan set.",
    officialSelection: selection("IV", "A"),
    defaultStructuralSystem: "perdeAgirlikli",
    defaultSlabSystem: "duzPlak",
    defaultFoundationType: "radye",
    defaultSeismicDemand: "yuksek",
    defaultPlanCompactness: "standart",
    defaultBasementRetainingCondition: "tam",
    defaultSpanClass: "standart",
    applicationNote:
      "Yapı yüksekliği arttıkça perde, çekirdek ve radye etkisi daha baskın hale gelir.",
    warningTone: "warning",
    carryingShareBand: { low: 0.18, expected: 0.24, high: 0.3 },
    baseBreakdown: {
      temel: { betonM3PerM2: 0.42, donatiKgPerM2: 45, kalipM2PerM2: 0.9 },
      kolonPerde: { betonM3PerM2: 0.095, donatiKgPerM2: 12.5, kalipM2PerM2: 0.92 },
      kirisDoseme: { betonM3PerM2: 0.18, donatiKgPerM2: 26, kalipM2PerM2: 1.18 },
      merdivenCekirdek: { betonM3PerM2: 0.018, donatiKgPerM2: 2, kalipM2PerM2: 0.1 },
    },
  },
  {
    id: "apartman-18-kat-uzeri",
    label: "Apartman / 18 kat ve üzeri",
    shortLabel: "Apartman 18+ Kat",
    description: "Çekirdek ve perde etkisi çok yüksek olan yüksek konut şemaları.",
    officialSelection: selection("IV", "B"),
    defaultStructuralSystem: "perdeAgirlikli",
    defaultSlabSystem: "duzPlak",
    defaultFoundationType: "radye",
    defaultSeismicDemand: "yuksek",
    defaultPlanCompactness: "standart",
    defaultBasementRetainingCondition: "tam",
    defaultSpanClass: "standart",
    applicationNote:
      "Bu bant, ön keşif amaçlıdır; yüksek yapılarda statik modelden bağımsız karar için kullanılmamalıdır.",
    warningTone: "warning",
    carryingShareBand: { low: 0.17, expected: 0.23, high: 0.29 },
    baseBreakdown: {
      temel: { betonM3PerM2: 0.48, donatiKgPerM2: 52, kalipM2PerM2: 0.95 },
      kolonPerde: { betonM3PerM2: 0.11, donatiKgPerM2: 15, kalipM2PerM2: 1 },
      kirisDoseme: { betonM3PerM2: 0.185, donatiKgPerM2: 29, kalipM2PerM2: 1.2 },
      merdivenCekirdek: { betonM3PerM2: 0.02, donatiKgPerM2: 2.2, kalipM2PerM2: 0.105 },
    },
  },
  {
    id: "ofis-banka-idari",
    label: "Ofis, banka, borsa, idari bina",
    shortLabel: "Ofis / İdari",
    description: "Çekirdek ve açıklık talebi yüksek ofis yapıları için dengeli ön keşif seti.",
    officialSelection: selection("IV", "B"),
    defaultStructuralSystem: "cercevePerde",
    defaultSlabSystem: "duzPlak",
    defaultFoundationType: "radye",
    defaultSeismicDemand: "yuksek",
    defaultPlanCompactness: "standart",
    defaultBasementRetainingCondition: "tam",
    defaultSpanClass: "genis",
    applicationNote:
      "Ofis bloklarında çekirdek, perde ve düz plak ilişkisi tipik konutlardan farklı bir donatı deseni üretir.",
    warningTone: "warning",
    carryingShareBand: { low: 0.19, expected: 0.25, high: 0.31 },
    baseBreakdown: {
      temel: { betonM3PerM2: 0.4, donatiKgPerM2: 40, kalipM2PerM2: 0.88 },
      kolonPerde: { betonM3PerM2: 0.09, donatiKgPerM2: 11.5, kalipM2PerM2: 0.78 },
      kirisDoseme: { betonM3PerM2: 0.165, donatiKgPerM2: 22, kalipM2PerM2: 1 },
      merdivenCekirdek: { betonM3PerM2: 0.022, donatiKgPerM2: 2.5, kalipM2PerM2: 0.12 },
    },
  },
  {
    id: "otopark-akaryakit",
    label: "Otopark, akaryakıt, küçük ticari",
    shortLabel: "Otopark / Ticari",
    description: "Açık veya kapalı otopark karakteri baskın hafif ticari yapılar için set.",
    officialSelection: selection("III", "A"),
    defaultStructuralSystem: "cerceve",
    defaultSlabSystem: "kirisli",
    defaultFoundationType: "surekli",
    defaultSeismicDemand: "orta",
    defaultPlanCompactness: "kompakt",
    defaultBasementRetainingCondition: "kismi",
    defaultSpanClass: "genis",
    applicationNote:
      "Bu set, kapalı otopark ve küçük ticari yapılarda tipik betonarme ağırlığını temsil eder.",
    warningTone: "info",
    carryingShareBand: { low: 0.22, expected: 0.27, high: 0.33 },
    baseBreakdown: {
      temel: { betonM3PerM2: 0.3, donatiKgPerM2: 30, kalipM2PerM2: 0.84 },
      kolonPerde: { betonM3PerM2: 0.065, donatiKgPerM2: 7.5, kalipM2PerM2: 0.7 },
      kirisDoseme: { betonM3PerM2: 0.16, donatiKgPerM2: 20, kalipM2PerM2: 1.06 },
      merdivenCekirdek: { betonM3PerM2: 0.009, donatiKgPerM2: 1.2, kalipM2PerM2: 0.05 },
    },
  },
  {
    id: "karma-kullanim",
    label: "Karma kullanım, konut + ticaret",
    shortLabel: "Karma Kullanım",
    description: "Konut + ticari ortak çekirdekli karma betonarme yapılarda daha ağır taşıyıcı set.",
    officialSelection: selection("V", "A"),
    defaultStructuralSystem: "cercevePerde",
    defaultSlabSystem: "duzPlak",
    defaultFoundationType: "radye",
    defaultSeismicDemand: "yuksek",
    defaultPlanCompactness: "girintili",
    defaultBasementRetainingCondition: "tam",
    defaultSpanClass: "genis",
    applicationNote:
      "Karma kullanımlı yapılarda kat farklılıkları ve çekirdek yoğunluğu doğrudan donatı ağırlığını artırır.",
    warningTone: "warning",
    carryingShareBand: { low: 0.19, expected: 0.25, high: 0.32 },
    baseBreakdown: {
      temel: { betonM3PerM2: 0.41, donatiKgPerM2: 42, kalipM2PerM2: 0.88 },
      kolonPerde: { betonM3PerM2: 0.095, donatiKgPerM2: 12, kalipM2PerM2: 0.84 },
      kirisDoseme: { betonM3PerM2: 0.175, donatiKgPerM2: 24, kalipM2PerM2: 1.08 },
      merdivenCekirdek: { betonM3PerM2: 0.02, donatiKgPerM2: 2.2, kalipM2PerM2: 0.12 },
    },
  },
];

const QUICK_QUANTITY_PRESET_MAP = new Map(
  QUICK_QUANTITY_PRESETS.map((preset) => [preset.id, preset] as const)
);

const SUPPORTED_SELECTION_KEYS = [
  ...new Set(
    QUICK_QUANTITY_PRESETS.map(
      (preset) => `${preset.officialSelection.grup}-${preset.officialSelection.sinif}`
    )
  ),
] as const;

export function getQuickQuantityPresets(): QuickQuantityPreset[] {
  return QUICK_QUANTITY_PRESETS;
}

export function getQuickQuantityPreset(
  presetId: QuickQuantityArchetype
): QuickQuantityPreset | null {
  return QUICK_QUANTITY_PRESET_MAP.get(presetId) ?? null;
}

export function getQuickQuantityDefaultPreset(): QuickQuantityPreset {
  return QUICK_QUANTITY_PRESETS[2];
}

export function getQuickQuantitySelectionKey(selectionValue: OfficialCostSelection): string {
  return `${selectionValue.grup}-${selectionValue.sinif}`;
}

export function isQuickQuantityOfficialSelectionSupported(
  selectionValue: OfficialCostSelection
): boolean {
  return SUPPORTED_SELECTION_KEYS.includes(
    getQuickQuantitySelectionKey(selectionValue) as (typeof SUPPORTED_SELECTION_KEYS)[number]
  );
}

export function getQuickQuantitySupportedSelectionKeys(): readonly string[] {
  return SUPPORTED_SELECTION_KEYS;
}
