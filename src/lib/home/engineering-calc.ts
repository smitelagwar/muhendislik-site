// Ana sayfa hızlı ön metraj hesaplayıcı yardımcı fonksiyonları

export type BuildingUsage = "konut" | "ticari" | "karma";

export interface QuickTakeoffInput {
  floorAreaM2: number;
  normalFloors: number;
  basementFloors: number;
  usage: BuildingUsage;
}

export interface QuickTakeoffResult {
  totalAreaM2: number;
  totalFloors: number;
  concreteM3: number;
  rebarTons: number;
  formworkM2: number;
  structuralCostMinM: number;
  structuralCostMaxM: number;
  totalCostMinM: number;
  totalCostMaxM: number;
}

const USAGE_FACTORS: Record<
  BuildingUsage,
  { concreteRate: number; rebarRateKgM2: number; formworkRate: number; unitCostTlM2: number }
> = {
  // İnşa Blog 2026 baz kalibrasyonu: 450 m² × (5+1) = 2.700 m² -> 911 m³ beton, 111 ton donatı, 5.882 m² kalıp
  konut: {
    concreteRate: 0.3374,
    rebarRateKgM2: 41.11,
    formworkRate: 2.1785,
    unitCostTlM2: 24500,
  },
  ticari: {
    concreteRate: 0.382,
    rebarRateKgM2: 48.5,
    formworkRate: 2.34,
    unitCostTlM2: 28800,
  },
  karma: {
    concreteRate: 0.36,
    rebarRateKgM2: 44.8,
    formworkRate: 2.26,
    unitCostTlM2: 26600,
  },
};

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function calculateQuickQuantityTakeoff(input: QuickTakeoffInput): QuickTakeoffResult {
  const floorAreaM2 = clampNumber(input.floorAreaM2, 80, 5000);
  const normalFloors = Math.round(clampNumber(input.normalFloors, 1, 30));
  const basementFloors = Math.round(clampNumber(input.basementFloors, 0, 5));
  const factor = USAGE_FACTORS[input.usage] ?? USAGE_FACTORS.konut;

  const totalFloors = normalFloors + basementFloors;
  const totalAreaM2 = Math.round(floorAreaM2 * totalFloors);

  // Çoklu bodrum katlarında çevre perdesi ve radye temel artışı
  const basementExtra = basementFloors > 1 ? 1 + (basementFloors - 1) * 0.045 : 1;

  const concreteM3 = Math.round(totalAreaM2 * factor.concreteRate * basementExtra);
  const rebarTons = Math.round((totalAreaM2 * factor.rebarRateKgM2 * basementExtra) / 1000);
  const formworkM2 = Math.round(
    totalAreaM2 * factor.formworkRate * (1 + (basementFloors > 1 ? 0.03 : 0)),
  );

  const baseTotalTl = totalAreaM2 * factor.unitCostTlM2;
  const structuralShare = 0.36;

  return {
    totalAreaM2,
    totalFloors,
    concreteM3,
    rebarTons,
    formworkM2,
    structuralCostMinM: Number(((baseTotalTl * structuralShare * 0.92) / 1_000_000).toFixed(1)),
    structuralCostMaxM: Number(((baseTotalTl * structuralShare * 1.08) / 1_000_000).toFixed(1)),
    totalCostMinM: Number(((baseTotalTl * 0.92) / 1_000_000).toFixed(1)),
    totalCostMaxM: Number(((baseTotalTl * 1.08) / 1_000_000).toFixed(1)),
  };
}

export function formatTrNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
