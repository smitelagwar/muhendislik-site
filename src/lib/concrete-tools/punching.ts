export type ColumnPunchingLocation = "inner" | "edge" | "corner";

export interface PunchingInput {
  fckMpa: number;
  fctdMpa?: number;
  slabThicknessCm: number;
  coverMm: number;
  columnBxCm: number;
  columnByCm: number;
  location: ColumnPunchingLocation;
  axialPunchingLoadKn: number;
}

export interface PunchingResult {
  effectiveDepthCm: number;
  punchingPerimeterCm: number;
  shearAreaMm2: number;
  punchingStressMpa: number;
  concreteTensileStrengthFctd: number;
  maxPunchingCapacityMpa: number;
  utilizationRatio: number;
  status: "safe" | "needs_reinforcement" | "exceeded_capacity";
  gammaFactor: number;
  recommendedAction: string;
}

export const PUNCHING_LOCATION_FACTORS: Record<ColumnPunchingLocation, { label: string; gamma: number }> = {
  inner: { label: "İç Kolon (Dört Tarafı Açık)", gamma: 1.0 },
  edge: { label: "Kenar Kolon (Üç Tarafı Açık)", gamma: 1.15 },
  corner: { label: "Köşe Kolon (İki Tarafı Açık)", gamma: 1.4 },
};

export function calculatePunchingShear(input: PunchingInput): PunchingResult | null {
  const {
    fckMpa,
    fctdMpa,
    slabThicknessCm,
    coverMm,
    columnBxCm,
    columnByCm,
    location,
    axialPunchingLoadKn: vpdKn,
  } = input;

  if (
    [fckMpa, slabThicknessCm, coverMm, columnBxCm, columnByCm, vpdKn].some(
      (val) => !Number.isFinite(val) || val <= 0
    ) ||
    !PUNCHING_LOCATION_FACTORS[location]
  ) {
    return null;
  }

  // Faydalı derinlik d (cm)
  const effectiveDepthCm = Math.max(5, slabThicknessCm - coverMm / 10 - 1.0);
  const dMm = effectiveDepthCm * 10;
  const bxMm = columnBxCm * 10;
  const byMm = columnByCm * 10;

  // TS 500 Zımbalama Çevresi: u_p = 2 * (bx + by + 2d)
  const upMm = 2 * (bxMm + byMm + 2 * dMm);
  const punchingPerimeterCm = upMm / 10;

  // TS 500 fctd hesabı (eğer dışarıdan verilmediyse TS 500 formülü: 0.35 * sqrt(fck) / 1.5)
  const concreteTensileStrengthFctd =
    fctdMpa && fctdMpa > 0 ? fctdMpa : (0.35 * Math.sqrt(fckMpa)) / 1.5;

  const gammaFactor = PUNCHING_LOCATION_FACTORS[location].gamma;
  const shearAreaMm2 = upMm * dMm;
  const vpdN = vpdKn * 1000;
  const punchingStressMpa = (gammaFactor * vpdN) / shearAreaMm2;

  const maxPunchingCapacityMpa = 1.5 * concreteTensileStrengthFctd;
  const utilizationRatio = punchingStressMpa / concreteTensileStrengthFctd;

  let status: "safe" | "needs_reinforcement" | "exceeded_capacity";
  let recommendedAction: string;

  if (punchingStressMpa <= concreteTensileStrengthFctd) {
    status = "safe";
    recommendedAction = "Donatısız beton kesiti zımbalama tesirini karşılıyor. İlave zımbalama donatısı zorunlu değildir.";
  } else if (punchingStressMpa <= maxPunchingCapacityMpa) {
    status = "needs_reinforcement";
    recommendedAction = "Zımbalama gerilmesi beton çekme dayanımını aşıyor; zımbalama donatısı (stud, sehpalar veya gizli kolon başlığı) zorunludur.";
  } else {
    status = "exceeded_capacity";
    recommendedAction = "Zımbalama gerilmesi 1.5·fctd üst sınırını aşıyor! Döşeme kalınlığı veya kolon kesiti mutlaka büyütülmelidir.";
  }

  return {
    effectiveDepthCm,
    punchingPerimeterCm,
    shearAreaMm2,
    punchingStressMpa,
    concreteTensileStrengthFctd,
    maxPunchingCapacityMpa,
    utilizationRatio,
    status,
    gammaFactor,
    recommendedAction,
  };
}
