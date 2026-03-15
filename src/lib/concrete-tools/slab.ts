import type { ConcreteStatus } from "@/lib/concrete-tools/types";

export const SLAB_TYPE_OPTIONS = [
  { value: "basit_tek", label: "Tek yönlü — basit mesnetli", isTwoWay: false, ratioLimit: 20, resultLabel: "Tek Yönlü Basit" },
  { value: "sur_tek", label: "Tek yönlü — sürekli", isTwoWay: false, ratioLimit: 26, resultLabel: "Tek Yönlü Sürekli" },
  { value: "basit_cift", label: "Çift yönlü — basit mesnetli", isTwoWay: true, ratioLimit: 30, resultLabel: "Çift Yönlü Basit" },
  { value: "sur_cift", label: "Çift yönlü — sürekli", isTwoWay: true, ratioLimit: 35, resultLabel: "Çift Yönlü Sürekli" },
  { value: "konsol", label: "Konsol döşeme", isTwoWay: false, ratioLimit: 10, resultLabel: "Konsol" },
] as const;

export const SLAB_STEEL_OPTIONS = [
  { value: "420", label: "B420C -> fyk = 420 MPa" },
  { value: "500", label: "B500C -> fyk = 500 MPa" },
] as const;

export const SLAB_LOAD_OPTIONS = [
  { value: "1.5", label: "1.5 kN/m² (konut)" },
  { value: "2.0", label: "2.0 kN/m² (konut — genel)" },
  { value: "3.0", label: "3.0 kN/m² (ofis)" },
  { value: "5.0", label: "5.0 kN/m² (depo / kütüphane)" },
] as const;

export const SLAB_BAR_DIAMETER_OPTIONS = [8, 10, 12, 14] as const;

function getSlabTypeOption(type: string) {
  return SLAB_TYPE_OPTIONS.find((option) => option.value === type) ?? null;
}

export interface SlabThicknessInput {
  shortSpanMeters: number;
  longSpanMeters: number;
  slabType: string;
  steelStrengthMpa: number;
}

export interface SlabThicknessResult {
  aspectRatio: number;
  governingSpanMeters: number;
  minimumThicknessMm: number;
  roundedThicknessMm: number;
  recommendedThicknessMm: number;
  coefficient: number;
  slabTypeLabel: string;
  status: ConcreteStatus;
}

export interface SlabRebarInput {
  thicknessMm: number;
  barDiameterMm: number;
}

export interface SlabRebarResult {
  minimumSteelAreaPerMeterMm2: number;
  selectedBarAreaMm2: number;
  maximumSpacingMm: number;
  recommendedSpacingMm: number;
  status: ConcreteStatus;
}

export function calculateSlabThickness(input: SlabThicknessInput): SlabThicknessResult | null {
  const { shortSpanMeters, longSpanMeters, slabType, steelStrengthMpa } = input;

  if ([shortSpanMeters, longSpanMeters, steelStrengthMpa].some((value) => !Number.isFinite(value) || value <= 0)) {
    return null;
  }

  const slabTypeOption = getSlabTypeOption(slabType);
  if (!slabTypeOption) {
    return null;
  }

  const aspectRatio = longSpanMeters / shortSpanMeters;
  const coefficient = 0.4 + steelStrengthMpa / 700;
  const minimumThicknessMm = (shortSpanMeters * 1000) / slabTypeOption.ratioLimit / coefficient;
  const roundedThicknessMm = Math.ceil(minimumThicknessMm / 10) * 10;
  const recommendedThicknessMm = Math.max(roundedThicknessMm, slabTypeOption.isTwoWay ? 120 : 100);

  const status: ConcreteStatus =
    aspectRatio > 2 && slabTypeOption.isTwoWay
      ? { tone: "warn", label: "Ly/Lx oranı 2'yi geçti. Tek yönlü çalışma davranışı ayrıca kontrol edilmeli." }
      : { tone: "ok", label: "Ön boyut hesabı tamamlandı." };

  return {
    aspectRatio,
    governingSpanMeters: shortSpanMeters,
    minimumThicknessMm,
    roundedThicknessMm,
    recommendedThicknessMm,
    coefficient,
    slabTypeLabel: slabTypeOption.resultLabel,
    status,
  };
}

export function calculateSlabMinimumRebar(input: SlabRebarInput): SlabRebarResult | null {
  const { thicknessMm, barDiameterMm } = input;

  if ([thicknessMm, barDiameterMm].some((value) => !Number.isFinite(value) || value <= 0)) {
    return null;
  }

  const minimumSteelAreaPerMeterMm2 = 0.002 * 1000 * thicknessMm;
  const maximumSpacingMm = Math.min(2 * thicknessMm, 250);
  const selectedBarAreaMm2 = Math.PI * Math.pow(barDiameterMm / 2, 2);
  let recommendedSpacingMm = (selectedBarAreaMm2 / minimumSteelAreaPerMeterMm2) * 1000;
  recommendedSpacingMm = Math.floor(recommendedSpacingMm / 25) * 25;
  recommendedSpacingMm = Math.min(recommendedSpacingMm, maximumSpacingMm);

  return {
    minimumSteelAreaPerMeterMm2,
    selectedBarAreaMm2,
    maximumSpacingMm,
    recommendedSpacingMm,
    status: { tone: "ok", label: "Minimum donatı aralığı hesaplandı." },
  };
}
