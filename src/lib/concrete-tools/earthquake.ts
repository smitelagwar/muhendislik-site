export interface BaseShearParams {
  totalWeightKn: number;
  spectralAccelerationSa: number;
  shortPeriodAccelerationSds: number;
  behaviorFactorR: number;
  importanceFactorI: number;
}

export interface BaseShearResult {
  baseShearKn: number;
  minBaseShearKn: number;
  designBaseShearKn: number;
  isMinimumControlled: boolean;
}

export function calculateBaseShear(params: BaseShearParams): BaseShearResult {
  const {
    totalWeightKn,
    spectralAccelerationSa,
    shortPeriodAccelerationSds,
    behaviorFactorR,
    importanceFactorI,
  } = params;

  // TBDY 2018 Denklem 4.19: Vt = (W * Sa(T)) / (R/I)
  const baseShearKn = (totalWeightKn * spectralAccelerationSa) / (behaviorFactorR / importanceFactorI);

  // TBDY 2018 Denklem 4.22: Vt,min = 0.04 * W * I * Sds
  const minBaseShearKn = 0.04 * totalWeightKn * importanceFactorI * shortPeriodAccelerationSds;

  const designBaseShearKn = Math.max(baseShearKn, minBaseShearKn);
  const isMinimumControlled = minBaseShearKn > baseShearKn;

  return {
    baseShearKn,
    minBaseShearKn,
    designBaseShearKn,
    isMinimumControlled,
  };
}
