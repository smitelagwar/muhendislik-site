import { HORIZONTAL_SPECTRUM_TL } from "./constants";
import { calculateSiteCoefficients } from "./site-coefficients";
import type { DesignSpectrumParameters, SoilClass, SpectrumPoint } from "./types";

export function calculateDesignSpectrumParameters(
  soilClass: SoilClass,
  ss: number,
  s1: number,
): DesignSpectrumParameters | null {
  if (!Number.isFinite(ss) || ss <= 0 || !Number.isFinite(s1) || s1 <= 0) return null;

  const coefficients = calculateSiteCoefficients(soilClass, ss, s1);
  if (!coefficients || !Number.isFinite(coefficients.fs) || !Number.isFinite(coefficients.f1)) return null;

  const sds = ss * coefficients.fs;
  const sd1 = s1 * coefficients.f1;
  if (sds <= 0 || sd1 <= 0) return null;

  return {
    ...coefficients,
    sds,
    sd1,
    ta: (0.2 * sd1) / sds,
    tb: sd1 / sds,
    tl: HORIZONTAL_SPECTRUM_TL,
  };
}

/** TBDY 2018 Denk. 2.2 yatay elastik tasarım spektrumu. */
export function calculateHorizontalElasticSpectrum(
  periodS: number,
  parameters: Pick<DesignSpectrumParameters, "sds" | "sd1" | "ta" | "tb" | "tl">,
): number {
  if (!Number.isFinite(periodS) || periodS < 0) return Number.NaN;
  const { sds, sd1, ta, tb, tl } = parameters;
  if (![sds, sd1, ta, tb, tl].every(Number.isFinite) || sds <= 0 || sd1 <= 0 || ta <= 0 || tb <= 0 || tl <= 0) {
    return Number.NaN;
  }

  if (periodS <= ta) return sds * (0.4 + (0.6 * periodS) / ta);
  if (periodS <= tb) return sds;
  if (periodS <= tl) return sd1 / periodS;
  return (sd1 * tl) / (periodS * periodS);
}

export function createSpectrumPoints(
  parameters: Pick<DesignSpectrumParameters, "sds" | "sd1" | "ta" | "tb" | "tl">,
  maxPeriodS: number,
  sampleCount = 160,
  exactPeriods: readonly number[] = [],
): SpectrumPoint[] {
  if (!Number.isFinite(maxPeriodS) || maxPeriodS <= 0 || sampleCount < 2) return [];

  const samplePeriods = Array.from({ length: sampleCount + 1 }, (_, index) => (maxPeriodS * index) / sampleCount);
  const exactBreakpoints = [parameters.ta, parameters.tb, parameters.tl].filter((point) => point > 0 && point <= maxPeriodS);
  const visibleExactPeriods = exactPeriods.filter((point) => Number.isFinite(point) && point >= 0 && point <= maxPeriodS);
  const periods = [...samplePeriods, ...exactBreakpoints, ...visibleExactPeriods].sort((left, right) => left - right);
  const uniquePeriods = periods.filter((period, index) => index === 0 || Math.abs(period - periods[index - 1]) > 1e-10);

  return uniquePeriods.map((period) => ({
    period,
    acceleration: calculateHorizontalElasticSpectrum(period, parameters),
  }));
}
