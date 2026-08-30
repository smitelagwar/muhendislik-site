import type { SoilClass } from "./types";

export const SOIL_SITE_COEFFICIENTS: Record<SoilClass, { fs_low: number; fs_high: number; f1_low: number; f1_high: number }> = {
  ZA: { fs_low: 0.8, fs_high: 0.8, f1_low: 0.8, f1_high: 0.8 },
  ZB: { fs_low: 0.9, fs_high: 0.9, f1_low: 0.9, f1_high: 0.9 },
  ZC: { fs_low: 1.3, fs_high: 1.6, f1_low: 1.5, f1_high: 1.7 },
  ZD: { fs_low: 1.4, fs_high: 2.4, f1_low: 1.6, f1_high: 2.4 },
  ZE: { fs_low: 0.9, fs_high: 3.5, f1_low: 0.9, f1_high: 4.0 },
  ZF: { fs_low: 1.0, fs_high: 1.0, f1_low: 1.0, f1_high: 1.0 },
};

export interface EquivalentBaseShearInput {
  ss: number;
  s1: number;
  soilClass: SoilClass;
  importanceFactorI: number;
  behaviorFactorR: number;
  totalWeightKn: number;
  numFloors: number;
  buildingHeightM: number;
  ctFactor?: number; // Varsayılan 0.07 (Betonarme çerçeve)
}

export interface FloorLateralForce {
  floorNumber: number;
  floorHeightM: number;
  floorWeightKn: number;
  lateralForceKn: number;
  storyShearKn: number;
}

export interface EquivalentBaseShearResult {
  fs: number;
  f1: number;
  sds: number;
  sd1: number;
  ta: number;
  tb: number;
  tl: number;
  empiricalPeriodTp: number;
  elasticSpectralAccelerationSae: number;
  reducedDesignSpectralAccelerationSar: number;
  calculatedBaseShearKn: number;
  minimumBaseShearKn: number;
  designBaseShearKn: number;
  isMinimumControlled: boolean;
  floorForces: FloorLateralForce[];
}

export function calculateEquivalentBaseShear(input: EquivalentBaseShearInput): EquivalentBaseShearResult | null {
  const {
    ss,
    s1,
    soilClass,
    importanceFactorI: I,
    behaviorFactorR: R,
    totalWeightKn: W,
    numFloors,
    buildingHeightM: HN,
    ctFactor = 0.07,
  } = input;

  if (
    [ss, s1, I, R, W, numFloors, HN].some((val) => !Number.isFinite(val) || val <= 0) ||
    !SOIL_SITE_COEFFICIENTS[soilClass]
  ) {
    return null;
  }

  const soilCoeffs = SOIL_SITE_COEFFICIENTS[soilClass];
  const fs = (soilCoeffs.fs_low + soilCoeffs.fs_high) / 2;
  const f1 = (soilCoeffs.f1_low + soilCoeffs.f1_high) / 2;

  const sds = fs * ss;
  const sd1 = f1 * s1;

  if (sds <= 0) return null;

  const ta = (0.2 * sd1) / sds;
  const tb = sd1 / sds;
  const tl = 6.0;

  // TBDY 2018 Denklem 4.27: TpA = Ct * HN^(3/4)
  const empiricalPeriodTp = ctFactor * Math.pow(HN, 0.75);

  // TBDY 2018 Denklem 2.1 & 2.2: Yatay elastik tasarım spektrumu Sae(T)
  let elasticSpectralAccelerationSae: number;
  if (empiricalPeriodTp <= ta) {
    elasticSpectralAccelerationSae = (0.4 + (0.6 * empiricalPeriodTp) / ta) * sds;
  } else if (empiricalPeriodTp <= tb) {
    elasticSpectralAccelerationSae = sds;
  } else if (empiricalPeriodTp <= tl) {
    elasticSpectralAccelerationSae = sd1 / empiricalPeriodTp;
  } else {
    elasticSpectralAccelerationSae = (sd1 * tl) / (empiricalPeriodTp * empiricalPeriodTp);
  }

  // TBDY 2018 Denklem 4.1: Azaltılmış tasarım spektral ivmesi SaR(T)
  const reducedDesignSpectralAccelerationSar = (elasticSpectralAccelerationSae * I) / R;

  // TBDY 2018 Denklem 4.19: VtE = mt * SaR(Tp) = W * SaR(Tp)
  const calculatedBaseShearKn = W * reducedDesignSpectralAccelerationSar;

  // TBDY 2018 Denklem 4.22: VtE,min = 0.04 * W * I * Sds
  const minimumBaseShearKn = 0.04 * W * I * sds;

  const isMinimumControlled = minimumBaseShearKn > calculatedBaseShearKn;
  const designBaseShearKn = Math.max(calculatedBaseShearKn, minimumBaseShearKn);

  // Katlara dağıtım (TBDY 2018 Denklem 4.20 - Ters üçgen dağılım)
  const floorHeightStep = HN / numFloors;
  const storyWeightKn = W / numFloors;

  let sumWiHi = 0;
  for (let i = 1; i <= numFloors; i++) {
    const hi = i * floorHeightStep;
    sumWiHi += storyWeightKn * hi;
  }

  const floorForces: FloorLateralForce[] = [];
  let cumulativeShearKn = 0;

  // Yukarıdan aşağıya doğru kat kesme kuvveti toplayarak oluşturalım
  for (let i = numFloors; i >= 1; i--) {
    const hi = i * floorHeightStep;
    const lateralForceKn = sumWiHi > 0 ? (designBaseShearKn * storyWeightKn * hi) / sumWiHi : 0;
    cumulativeShearKn += lateralForceKn;

    floorForces.unshift({
      floorNumber: i,
      floorHeightM: hi,
      floorWeightKn: storyWeightKn,
      lateralForceKn,
      storyShearKn: cumulativeShearKn,
    });
  }

  return {
    fs,
    f1,
    sds,
    sd1,
    ta,
    tb,
    tl,
    empiricalPeriodTp,
    elasticSpectralAccelerationSae,
    reducedDesignSpectralAccelerationSar,
    calculatedBaseShearKn,
    minimumBaseShearKn,
    designBaseShearKn,
    isMinimumControlled,
    floorForces,
  };
}
