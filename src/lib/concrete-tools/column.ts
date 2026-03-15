import type { ConcreteStatus } from "@/lib/concrete-tools/types";

export const COLUMN_PRELIMINARY_CONCRETE_OPTIONS = [
  { value: "25", label: "C25/30" },
  { value: "30", label: "C30/37" },
  { value: "35", label: "C35/45" },
  { value: "40", label: "C40/50" },
] as const;

export const COLUMN_CAPACITY_CONCRETE_OPTIONS = [
  { value: "16.7", label: "C25 -> fcd = 16.7 MPa", fctd: 1.05 },
  { value: "20", label: "C30 -> fcd = 20.0 MPa", fctd: 1.17 },
  { value: "23.3", label: "C35 -> fcd = 23.3 MPa", fctd: 1.28 },
  { value: "26.7", label: "C40 -> fcd = 26.7 MPa", fctd: 1.28 },
] as const;

export const COLUMN_STEEL_OPTIONS = [
  { value: "365", label: "B420C -> fyd = 365 MPa" },
  { value: "435", label: "B500C -> fyd = 435 MPa" },
] as const;

export const COLUMN_BAR_DIAMETER_OPTIONS = [10, 12, 14, 16, 18, 20, 22, 25, 28, 32] as const;

export const COLUMN_LAP_CONCRETE_OPTIONS = [
  { value: "30", label: "C25 -> fctd = 1.05 MPa", fctd: 1.05 },
  { value: "35", label: "C30 -> fctd = 1.17 MPa", fctd: 1.17 },
  { value: "40", label: "C35 -> fctd = 1.28 MPa", fctd: 1.28 },
] as const;

function roundUpTo5(value: number) {
  return Math.ceil(value / 5) * 5;
}

export interface ColumnPreliminarySizingInput {
  floorCount: number;
  tributaryAreaM2: number;
  deadLoadKnM2: number;
  liveLoadKnM2: number;
  concreteStrengthMpa: number;
}

export interface ColumnPreliminarySizingResult {
  designAreaLoadKnM2: number;
  designAxialLoadKn: number;
  minimumAreaCm2: number;
  shortEdgeCm: number;
  longEdgeCm: number;
  recommendedSection: string;
}

export interface ColumnCapacityInput {
  widthMm: number;
  heightMm: number;
  designAxialLoadKn: number;
  concreteDesignStrengthMpa: number;
  steelDesignStrengthMpa: number;
  totalSteelAreaMm2: number;
}

export interface ColumnCapacityResult {
  sectionAreaMm2: number;
  reinforcementRatio: number;
  concreteCapacityKn: number;
  steelCapacityKn: number;
  totalCapacityKn: number;
  capacityRatio: number;
  status: ConcreteStatus;
}

export interface ColumnSteelAreaResult {
  oneBarAreaMm2: number;
  totalAreaMm2: number;
  weightPerMeterKg: number;
}

export interface ColumnLapLengthResult {
  minimumLapLengthMm: number;
  practicalLapLengthMm: number;
}

export function calculateColumnPreliminarySizing(input: ColumnPreliminarySizingInput): ColumnPreliminarySizingResult | null {
  const { floorCount, tributaryAreaM2, deadLoadKnM2, liveLoadKnM2, concreteStrengthMpa } = input;

  if ([floorCount, tributaryAreaM2, deadLoadKnM2, liveLoadKnM2, concreteStrengthMpa].some((value) => !Number.isFinite(value) || value <= 0)) {
    return null;
  }

  const designAreaLoadKnM2 = 1.4 * deadLoadKnM2 + 1.6 * liveLoadKnM2;
  const designAxialLoadKn = designAreaLoadKnM2 * tributaryAreaM2 * floorCount;
  const minimumAreaCm2 = (designAxialLoadKn * 1000) / (0.4 * concreteStrengthMpa) / 100;
  const shortEdgeCm = 30;
  const longEdgeCm = Math.max(shortEdgeCm, roundUpTo5(minimumAreaCm2 / shortEdgeCm));

  return {
    designAreaLoadKnM2,
    designAxialLoadKn,
    minimumAreaCm2,
    shortEdgeCm,
    longEdgeCm,
    recommendedSection: `${shortEdgeCm} x ${longEdgeCm} cm`,
  };
}

export function calculateColumnCapacity(input: ColumnCapacityInput): ColumnCapacityResult | null {
  const { widthMm, heightMm, designAxialLoadKn, concreteDesignStrengthMpa, steelDesignStrengthMpa, totalSteelAreaMm2 } = input;

  if ([widthMm, heightMm, designAxialLoadKn, concreteDesignStrengthMpa, steelDesignStrengthMpa, totalSteelAreaMm2].some((value) => !Number.isFinite(value) || value <= 0)) {
    return null;
  }

  const sectionAreaMm2 = widthMm * heightMm;
  const reinforcementRatio = totalSteelAreaMm2 / sectionAreaMm2;
  const concreteCapacityKn = (0.85 * concreteDesignStrengthMpa * sectionAreaMm2) / 1000;
  const steelCapacityKn = (steelDesignStrengthMpa * totalSteelAreaMm2) / 1000;
  const totalCapacityKn = concreteCapacityKn + steelCapacityKn;
  const capacityRatio = totalCapacityKn / designAxialLoadKn;

  let status: ConcreteStatus;
  if (reinforcementRatio < 0.01) {
    status = { tone: "fail", label: "Donatı oranı yüzde 1'in altında." };
  } else if (reinforcementRatio > 0.04) {
    status = { tone: "warn", label: "Donatı oranı yüzde 4'ün üzerinde." };
  } else if (capacityRatio >= 1.2) {
    status = { tone: "ok", label: "Kapasite yeterli görünüyor." };
  } else if (capacityRatio >= 1) {
    status = { tone: "warn", label: "Kapasite sınırda, kesit ve ikinci mertebe etkileri kontrol edilmeli." };
  } else {
    status = { tone: "fail", label: "Kapasite yetersiz, kesit veya donatı artırılmalı." };
  }

  return {
    sectionAreaMm2,
    reinforcementRatio,
    concreteCapacityKn,
    steelCapacityKn,
    totalCapacityKn,
    capacityRatio,
    status,
  };
}

export function calculateColumnSteelArea(barDiameterMm: number, quantity: number): ColumnSteelAreaResult | null {
  if ([barDiameterMm, quantity].some((value) => !Number.isFinite(value) || value <= 0)) {
    return null;
  }

  const oneBarAreaMm2 = Math.PI * Math.pow(barDiameterMm / 2, 2);
  const totalAreaMm2 = oneBarAreaMm2 * quantity;
  const weightPerMeterKg = (totalAreaMm2 / 1_000_000) * 7850 * 1000;

  return {
    oneBarAreaMm2,
    totalAreaMm2,
    weightPerMeterKg,
  };
}

export function calculateLapLength(barDiameterMm: number, concreteClassValue: number): ColumnLapLengthResult | null {
  if ([barDiameterMm, concreteClassValue].some((value) => !Number.isFinite(value) || value <= 0)) {
    return null;
  }

  const concreteOption = COLUMN_LAP_CONCRETE_OPTIONS.find((option) => Number(option.value) === concreteClassValue);
  if (!concreteOption) {
    return null;
  }

  const minimumLapLengthMm = Math.ceil((365 / (4 * concreteOption.fctd)) * barDiameterMm);
  const practicalLapLengthMm = barDiameterMm * 40;

  return {
    minimumLapLengthMm,
    practicalLapLengthMm,
  };
}
