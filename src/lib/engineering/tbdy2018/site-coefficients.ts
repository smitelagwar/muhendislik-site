import { F1_TABLE, FS_TABLE } from "./constants";
import type { InterpolationDetail, SiteCoefficients, SoilClass } from "./types";

function getInterpolationDetail(value: number, breakpoints: readonly number[], values: readonly number[]): InterpolationDetail | null {
  if (!Number.isFinite(value) || value < 0) return null;
  if (value <= breakpoints[0]) {
    return { value: values[0], lowerPoint: breakpoints[0], upperPoint: breakpoints[0], lowerValue: values[0], upperValue: values[0], interpolated: false };
  }
  if (value >= breakpoints[breakpoints.length - 1]) {
    const lastIndex = breakpoints.length - 1;
    return { value: values[lastIndex], lowerPoint: breakpoints[lastIndex], upperPoint: breakpoints[lastIndex], lowerValue: values[lastIndex], upperValue: values[lastIndex], interpolated: false };
  }

  const upperIndex = breakpoints.findIndex((point) => value <= point);
  const lowerIndex = upperIndex - 1;
  const lowerPoint = breakpoints[lowerIndex];
  const upperPoint = breakpoints[upperIndex];
  const proportion = (value - lowerPoint) / (upperPoint - lowerPoint);
  return {
    value: values[lowerIndex] + proportion * (values[upperIndex] - values[lowerIndex]),
    lowerPoint,
    upperPoint,
    lowerValue: values[lowerIndex],
    upperValue: values[upperIndex],
    interpolated: values[lowerIndex] !== values[upperIndex],
  };
}

/** TBDY 2018 Tablo 2.1. ZF için katsayı tanımlı değildir. */
export function calculateFs(soilClass: SoilClass, ss: number): number | null {
  if (soilClass === "ZF") return null;
  return getFsInterpolationDetail(soilClass, ss)?.value ?? null;
}

/** TBDY 2018 Tablo 2.2. ZF için katsayı tanımlı değildir. */
export function calculateF1(soilClass: SoilClass, s1: number): number | null {
  if (soilClass === "ZF") return null;
  return getF1InterpolationDetail(soilClass, s1)?.value ?? null;
}

export function getFsInterpolationDetail(soilClass: SoilClass, ss: number): InterpolationDetail | null {
  if (soilClass === "ZF") return null;
  return getInterpolationDetail(ss, FS_TABLE.breakpoints, FS_TABLE.values[soilClass]);
}

export function getF1InterpolationDetail(soilClass: SoilClass, s1: number): InterpolationDetail | null {
  if (soilClass === "ZF") return null;
  return getInterpolationDetail(s1, F1_TABLE.breakpoints, F1_TABLE.values[soilClass]);
}

export function calculateSiteCoefficients(soilClass: SoilClass, ss: number, s1: number): SiteCoefficients | null {
  const fs = calculateFs(soilClass, ss);
  const f1 = calculateF1(soilClass, s1);
  return fs === null || f1 === null ? null : { fs, f1 };
}
