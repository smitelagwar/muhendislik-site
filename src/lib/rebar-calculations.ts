export const REBAR_DIAMETERS = [8, 10, 12, 14, 16, 18, 20] as const;
export const ALL_REBAR_DIAMETERS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32] as const;

export type RebarDiameter = (typeof REBAR_DIAMETERS)[number];
export type FullRebarDiameter = (typeof ALL_REBAR_DIAMETERS)[number];

export interface RebarCalculationResult {
  barAreaMm2: number;
  totalAreaMm2: number;
  quantity: number;
}

export interface EquivalentRebarRow {
  diameter: RebarDiameter;
  quantity: number;
  providedAreaMm2: number;
  surplusAreaMm2: number;
}

export interface RebarUnitWeightItem {
  diameter: FullRebarDiameter;
  barAreaCm2: number;
  barAreaMm2: number;
  weightPerMeterKg: number;
  weightPerBar12mKg: number;
  metersPerTon: number;
  barsPerTon12m: number;
}

export interface RebarAreaMatrixRow {
  diameter: FullRebarDiameter;
  barAreaCm2: number;
  barAreaMm2: number;
  areas: { quantity: number; areaCm2: number; areaMm2: number }[];
}

export interface RebarRowLayout {
  rowCount: 1 | 2;
  firstRow: number;
  secondRow: number;
}

export interface RebarSpacingCheck {
  status: "ok" | "violated";
  netSpacingMm: number;
  minSpacingMm: number;
  firstRow: number;
}

const fixedDecimalFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("tr-TR", {
  maximumFractionDigits: 0,
});

const weightDecimalFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

export function formatDecimal(value: number): string {
  return fixedDecimalFormatter.format(value);
}

export function formatWeight(value: number): string {
  return weightDecimalFormatter.format(value);
}

export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

export function calculateLinearWeight(diameterMm: number): number {
  return (Math.PI * Math.pow(diameterMm / 1000, 2) / 4) * 7850;
}

export function formatAreaMm2(value: number): string {
  return formatDecimal(value);
}

export function formatAreaCm2(valueMm2: number): string {
  return formatDecimal(valueMm2 / 100);
}

export function parseRebarQuantity(value: string): { quantity: number | null; error: string | null } {
  const normalized = value.trim().replace(",", ".");

  if (!normalized) {
    return { quantity: null, error: "Donatı adedini girin." };
  }

  const quantity = Number(normalized);

  if (!Number.isFinite(quantity)) {
    return { quantity: null, error: "Geçerli bir donatı adedi girin." };
  }

  if (!Number.isSafeInteger(quantity)) {
    return { quantity: null, error: "Donatı adedi pozitif bir tam sayı olmalıdır." };
  }

  if (quantity <= 0) {
    return { quantity: null, error: "Donatı adedi 1 veya daha büyük olmalıdır." };
  }

  return { quantity, error: null };
}

export function calculateBarArea(diameter: number): number {
  return (Math.PI * diameter * diameter) / 4;
}

export function calculateRebarResult(
  diameter: RebarDiameter,
  quantity: number,
): RebarCalculationResult {
  const barAreaMm2 = calculateBarArea(diameter);
  return {
    barAreaMm2,
    totalAreaMm2: barAreaMm2 * quantity,
    quantity,
  };
}

export function buildEquivalentRebarRows(totalAreaMm2: number): EquivalentRebarRow[] {
  return REBAR_DIAMETERS.map((diameter) => {
    const barAreaMm2 = calculateBarArea(diameter);
    const quantity = Math.max(1, Math.ceil(totalAreaMm2 / barAreaMm2));
    const providedAreaMm2 = quantity * barAreaMm2;

    return {
      diameter,
      quantity,
      providedAreaMm2,
      surplusAreaMm2: Math.max(0, providedAreaMm2 - totalAreaMm2),
    };
  }).sort(
    (left, right) =>
      left.surplusAreaMm2 - right.surplusAreaMm2 || left.diameter - right.diameter,
  );
}

export function buildRebarUnitWeightTable(): RebarUnitWeightItem[] {
  return ALL_REBAR_DIAMETERS.map((diameter) => {
    const barAreaMm2 = calculateBarArea(diameter);
    const barAreaCm2 = barAreaMm2 / 100;
    const weightPerMeterKg = calculateLinearWeight(diameter);
    const weightPerBar12mKg = weightPerMeterKg * 12;
    const metersPerTon = 1000 / weightPerMeterKg;
    const barsPerTon12m = Math.floor(1000 / weightPerBar12mKg);

    return {
      diameter,
      barAreaCm2,
      barAreaMm2,
      weightPerMeterKg,
      weightPerBar12mKg,
      metersPerTon,
      barsPerTon12m,
    };
  });
}

export function buildRebarAreaMatrix(maxQuantity = 10): RebarAreaMatrixRow[] {
  const quantities = Array.from({ length: maxQuantity }, (_, i) => i + 1);

  return ALL_REBAR_DIAMETERS.map((diameter) => {
    const barAreaMm2 = calculateBarArea(diameter);
    const barAreaCm2 = barAreaMm2 / 100;

    const areas = quantities.map((q) => {
      const totalMm2 = barAreaMm2 * q;
      return {
        quantity: q,
        areaCm2: totalMm2 / 100,
        areaMm2: totalMm2,
      };
    });

    return {
      diameter,
      barAreaCm2,
      barAreaMm2,
      areas,
    };
  });
}

export function getRebarRowLayout(quantity: number): RebarRowLayout {
  if (quantity <= 7) {
    return { rowCount: 1, firstRow: quantity, secondRow: 0 };
  }

  const secondRow = Math.floor(quantity / 2);
  return { rowCount: 2, firstRow: quantity - secondRow, secondRow };
}

export function calculateRebarSpacing({
  quantity,
  diameter,
  widthCm,
  coverMm,
  stirrupDiameterMm,
}: {
  quantity: number;
  diameter: number;
  widthCm: number;
  coverMm: number;
  stirrupDiameterMm: number;
}): RebarSpacingCheck | null {
  const { firstRow } = getRebarRowLayout(quantity);
  if (firstRow < 2) return null;

  const netSpacingMm =
    (widthCm * 10 - 2 * coverMm - 2 * stirrupDiameterMm - firstRow * diameter) /
    (firstRow - 1);
  const minSpacingMm = Math.max(25, 1.5 * diameter);

  return {
    status: netSpacingMm < minSpacingMm ? "violated" : "ok",
    netSpacingMm,
    minSpacingMm,
    firstRow,
  };
}
