import type { ConcreteStatus } from "@/lib/concrete-tools/types";

export const COVER_ELEMENT_OPTIONS = [
  { value: "plak", label: "Döşeme / plak" },
  { value: "kiris", label: "Kiriş" },
  { value: "kolon", label: "Kolon" },
  { value: "perde", label: "Perde duvar" },
  { value: "temel", label: "Temel" },
] as const;

export const COVER_EXPOSURE_OPTIONS = [
  { value: "XC1", label: "XC1 — Kuru / ıslak iç mekan" },
  { value: "XC2", label: "XC2 — Uzun süreli ıslak" },
  { value: "XC3", label: "XC3 — Orta nem" },
  { value: "XC4", label: "XC4 — Kuru-ıslak dönüşümlü" },
  { value: "XS1", label: "XS1 — Deniz havası" },
  { value: "XS2", label: "XS2 — Deniz suyu altı" },
] as const;

export const COVER_REBAR_DIAMETER_OPTIONS = [10, 12, 14, 16, 20, 25, 32] as const;
export const COVER_STIRRUP_DIAMETER_OPTIONS = [8, 10, 12] as const;

export const COVER_SAFETY_CLASS_OPTIONS = [
  { value: "S2", label: "S2 — Normal" },
  { value: "S3", label: "S3 — Yüksek" },
  { value: "S4", label: "S4 — Çok yüksek" },
] as const;

export const COVER_SERVICE_LIFE_OPTIONS = [
  { value: "50", label: "50 yıl" },
  { value: "100", label: "100 yıl" },
] as const;

const DURABILITY_MINIMUMS = {
  XC1: 10,
  XC2: 25,
  XC3: 25,
  XC4: 30,
  XS1: 35,
  XS2: 40,
} as const;

function getElementLabel(value: string) {
  return COVER_ELEMENT_OPTIONS.find((option) => option.value === value)?.label ?? "Betonarme eleman";
}

function getSafetyClassLabel(value: string) {
  return COVER_SAFETY_CLASS_OPTIONS.find((option) => option.value === value)?.label ?? "S2";
}

export interface ConcreteCoverInput {
  elementType: string;
  exposureClass: keyof typeof DURABILITY_MINIMUMS;
  rebarDiameterMm: number;
  stirrupDiameterMm: number;
  safetyClass: string;
  serviceLifeYears: number;
}

export interface ConcreteCoverResult {
  bondMinimumMm: number;
  durabilityMinimumMm: number;
  minimumCoverMm: number;
  deviationMm: number;
  nominalCoverMm: number;
  practicalCoverMm: number;
  narrative: string;
  status: ConcreteStatus;
}

export function calculateConcreteCover(input: ConcreteCoverInput): ConcreteCoverResult | null {
  const { elementType, exposureClass, rebarDiameterMm, stirrupDiameterMm, safetyClass, serviceLifeYears } = input;

  if ([rebarDiameterMm, stirrupDiameterMm, serviceLifeYears].some((value) => !Number.isFinite(value) || value <= 0)) {
    return null;
  }

  const durabilityBase = DURABILITY_MINIMUMS[exposureClass];
  if (!durabilityBase) {
    return null;
  }

  const bondMinimumMm = Math.max(rebarDiameterMm, stirrupDiameterMm, 10);
  const durabilityMinimumMm = durabilityBase + (serviceLifeYears === 100 ? 10 : 0);
  const minimumCoverMm = Math.max(bondMinimumMm, durabilityMinimumMm, 10);
  const deviationMm = 10;
  const nominalCoverMm = minimumCoverMm + deviationMm;
  const practicalCoverMm = nominalCoverMm + stirrupDiameterMm;

  return {
    bondMinimumMm,
    durabilityMinimumMm,
    minimumCoverMm,
    deviationMm,
    nominalCoverMm,
    practicalCoverMm,
    narrative: `${getElementLabel(elementType)} için ${getSafetyClassLabel(safetyClass)} seçimi bilgi amaçlı tutuldu. Sayısal sonuç TS 500 mantığındaki minimum örtü ve tolerans hesabına göre üretildi.`,
    status: { tone: "ok", label: `c,nom = ${nominalCoverMm} mm, pratik pas payı = ${practicalCoverMm} mm.` },
  };
}
