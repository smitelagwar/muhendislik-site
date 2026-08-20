export type SoilClass = "ZA" | "ZB" | "ZC" | "ZD" | "ZE" | "ZF";

export type PeriodSystem =
  | "reinforced-concrete-frame"
  | "reinforced-concrete-other"
  | "shear-wall-only"
  | "steel-frame"
  | "other";

export interface SiteCoefficients {
  fs: number;
  f1: number;
}

export interface DesignSpectrumParameters extends SiteCoefficients {
  sds: number;
  sd1: number;
  ta: number;
  tb: number;
  tl: number;
}

export interface SpectrumPoint {
  period: number;
  acceleration: number;
}

export interface ShearWallInput {
  areaM2: number;
  lengthM: number;
}

export interface ShearWallPeriodParameters {
  totalWallAreaM2: number;
  uncappedEquivalentAreaM2: number;
  equivalentAreaM2: number;
  ct: number;
  periodS: number;
}

export interface InterpolationDetail {
  value: number;
  lowerPoint: number;
  upperPoint: number;
  lowerValue: number;
  upperValue: number;
  interpolated: boolean;
}
