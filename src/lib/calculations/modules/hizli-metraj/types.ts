import type {
  OfficialCostResultSnapshot,
  OfficialCostSelection,
} from "@/lib/calculations/official-unit-costs";

export type QuickQuantityArchetype =
  | "villa-bungalov"
  | "apartman-3-kat"
  | "apartman-4-7-kat"
  | "apartman-8-10-kat"
  | "apartman-11-17-kat"
  | "apartman-18-kat-uzeri"
  | "ofis-banka-idari"
  | "otopark-akaryakit"
  | "karma-kullanim";

export type QuickQuantityStructuralSystem =
  | "cerceve"
  | "cercevePerde"
  | "perdeAgirlikli";
export type QuickQuantitySlabSystem = "kirisli" | "asmolen" | "duzPlak";
export type QuickQuantityFoundationType = "radye" | "surekli" | "tekil";
export type QuickQuantitySoilClass = "ZA" | "ZB" | "ZC" | "ZD" | "ZE";
export type QuickQuantitySeismicDemand = "dusuk" | "orta" | "yuksek";
export type QuickQuantityPlanCompactness = "kompakt" | "standart" | "girintili";
export type QuickQuantityBasementRetainingCondition = "yok" | "kismi" | "tam";
export type QuickQuantitySpanClass = "dar" | "standart" | "genis";
export type QuickQuantityBreakdownId =
  | "temel"
  | "kolonPerde"
  | "kirisDoseme"
  | "merdivenCekirdek";
export type QuickQuantityWarningTone = "info" | "warning" | "error";
export type QuickQuantityBenchmarkStatus = "dusuk" | "beklenen" | "yuksek";
export type QuickQuantitySiteDifficulty = "dusuk" | "orta" | "yuksek";

export interface QuickQuantityFactorSet {
  beton: number;
  donati: number;
  kalip: number;
}

export interface QuickQuantityCoefficientSet {
  betonM3PerM2: number;
  donatiKgPerM2: number;
  kalipM2PerM2: number;
}

export interface QuickQuantityValueBand {
  low: number;
  expected: number;
  high: number;
}

export interface QuickQuantityPreset {
  id: QuickQuantityArchetype;
  label: string;
  shortLabel: string;
  description: string;
  officialSelection: OfficialCostSelection;
  defaultStructuralSystem: QuickQuantityStructuralSystem;
  defaultSlabSystem: QuickQuantitySlabSystem;
  defaultFoundationType: QuickQuantityFoundationType;
  defaultSeismicDemand: QuickQuantitySeismicDemand;
  defaultPlanCompactness: QuickQuantityPlanCompactness;
  defaultBasementRetainingCondition: QuickQuantityBasementRetainingCondition;
  defaultSpanClass: QuickQuantitySpanClass;
  applicationNote: string;
  warningTone: Exclude<QuickQuantityWarningTone, "error">;
  carryingShareBand: QuickQuantityValueBand;
  baseBreakdown: Record<QuickQuantityBreakdownId, QuickQuantityCoefficientSet>;
}

export interface QuickQuantityInput {
  katAlaniM2: number;
  normalKatSayisi: number;
  bodrumKatSayisi: number;
  bodrumKatAlaniM2: number | null;
  yapiArketipi: QuickQuantityArchetype;
  tasiyiciSistem: QuickQuantityStructuralSystem;
  dosemeSistemi: QuickQuantitySlabSystem;
  temelTipi: QuickQuantityFoundationType;
  zeminSinifi: QuickQuantitySoilClass;
  depremTalebi: QuickQuantitySeismicDemand;
  planKompaktligi: QuickQuantityPlanCompactness;
  bodrumCevrePerdesi: QuickQuantityBasementRetainingCondition;
  tipikAciklik: QuickQuantitySpanClass;
  resmiSinif: OfficialCostSelection | null;
}

export interface RoughStructureUnitPriceEntry {
  id: string;
  pozNo: string;
  label: string;
  description: string;
  unit: "m3" | "ton" | "m2";
  unitPrice: number;
  sourceLine: string;
}

export interface RoughStructureUnitPriceBook {
  id: string;
  year: 2026;
  monthLabel: string;
  publishedAt: string;
  sourceLabel: string;
  sourceUrl: string;
  notes: string[];
  entries: {
    concreteC30_37: RoughStructureUnitPriceEntry;
    rebar8To12: RoughStructureUnitPriceEntry;
    rebar14To28: RoughStructureUnitPriceEntry;
    formworkPlywood: RoughStructureUnitPriceEntry;
  };
  weightedRebarUnitPrice: number;
  weightedRebarNote: string;
}

export interface QuickQuantityBreakdown {
  id: QuickQuantityBreakdownId;
  label: string;
  basisAreaM2: number;
  basisLabel: string;
  betonM3PerM2: number;
  donatiKgPerM2: number;
  kalipM2PerM2: number;
  betonM3: number;
  donatiKg: number;
  donatiTon: number;
  kalipM2: number;
  directCost: number;
  directCostShare: number;
  notes: string[];
}

export interface QuickQuantityAppliedFactor {
  id: string;
  label: string;
  target: QuickQuantityBreakdownId | "genel";
  betonFactor: number;
  donatiFactor: number;
  kalipFactor: number;
  note?: string;
}

export interface QuickQuantityWarning {
  tone: QuickQuantityWarningTone;
  message: string;
}

export interface QuickQuantityIntensitySummary {
  betonM3PerM2: number;
  donatiKgPerM2: number;
  kalipM2PerM2: number;
  directCostPerM2: number;
}

export interface QuickQuantityGeometrySummary {
  footprintAreaM2: number;
  perimeterM: number;
  basementWallAreaM2: number;
  excavationDepthM: number;
  excavationVolumeM3: number;
  leanConcreteM3: number;
  waterproofingAreaM2: number;
  drainageLengthM: number;
}

export interface QuickQuantityAuxiliaryMetric {
  id: string;
  label: string;
  quantity: number;
  unit: "m3" | "m2" | "m";
  basis: string;
  note: string;
}

export interface QuickQuantityAuxiliaryCostBand extends QuickQuantityValueBand {
  lowAmount: number;
  expectedAmount: number;
  highAmount: number;
  note: string;
}

export interface QuickQuantityBenchmarkItem {
  id: string;
  label: string;
  value: number;
  unit: string;
  band: QuickQuantityValueBand;
  status: QuickQuantityBenchmarkStatus;
  helper: string;
}

export interface QuickQuantityAuxiliaryCostItem {
  id: string;
  label: string;
  share: number;
  amount: number;
  note: string;
}

export interface QuickQuantityInsight {
  id: string;
  title: string;
  value: string;
  tone: Exclude<QuickQuantityWarningTone, "error">;
  note: string;
}

export interface QuickQuantityResult {
  input: QuickQuantityInput;
  preset: QuickQuantityPreset;
  priceBook: RoughStructureUnitPriceBook;
  resolvedOfficialSelection: OfficialCostSelection;
  officialSelectionOverridden: boolean;
  officialResult: OfficialCostResultSnapshot;
  toplamInsaatAlaniM2: number;
  toplamNormalAlanM2: number;
  toplamBodrumAlanM2: number;
  resolvedBodrumKatAlaniM2: number;
  temelIziAlaniM2: number;
  betonM3: number;
  donatiKg: number;
  donatiTon: number;
  kalipM2: number;
  betonBirimFiyat: number;
  donatiBirimFiyat: number;
  kalipBirimFiyat: number;
  dogrudanTasiyiciMaliyet: number;
  dogrudanTasiyiciMaliyetKalemleri: {
    beton: number;
    donati: number;
    kalip: number;
  };
  tasiyiciPayi: {
    actual: number;
    low: number;
    expected: number;
    high: number;
    lowAmount: number;
    expectedAmount: number;
    highAmount: number;
  };
  yogunlukOzet: QuickQuantityIntensitySummary;
  referansBantlar: {
    betonM3PerM2: QuickQuantityValueBand;
    donatiKgPerM2: QuickQuantityValueBand;
    kalipM2PerM2: QuickQuantityValueBand;
    directCostPerM2: QuickQuantityValueBand;
  };
  geometriOzet: QuickQuantityGeometrySummary;
  yardimciMetrajlar: QuickQuantityAuxiliaryMetric[];
  yardimciKabaIsBandi: QuickQuantityAuxiliaryCostBand;
  yardimciKabaIsDagilimi: QuickQuantityAuxiliaryCostItem[];
  genisletilmisKabaYapiBandi: {
    lowAmount: number;
    expectedAmount: number;
    highAmount: number;
  };
  sahaZorlugu: QuickQuantitySiteDifficulty;
  kararOzetleri: QuickQuantityInsight[];
  benchmarklar: QuickQuantityBenchmarkItem[];
  breakdowns: QuickQuantityBreakdown[];
  appliedFactors: QuickQuantityAppliedFactor[];
  warnings: QuickQuantityWarning[];
  notes: string[];
}

export interface QuickQuantityPdfSnapshot {
  result: QuickQuantityResult;
  formattedDate: string;
}
