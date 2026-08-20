import { PERIOD_SYSTEMS } from "./constants";
import type { PeriodSystem } from "./types";

/** TBDY 2018, Denk. 4.27: TpA = Ct × HN^(3/4). */
export function calculateEmpiricalPeriod(ct: number, heightM: number): number {
  if (!Number.isFinite(ct) || ct <= 0 || !Number.isFinite(heightM) || heightM <= 0) {
    return Number.NaN;
  }

  return ct * Math.pow(heightM, 0.75);
}

export function getPeriodSystemCt(system: PeriodSystem): number | null {
  return PERIOD_SYSTEMS.find((item) => item.id === system)?.ct ?? null;
}

export function calculateEmpiricalPeriodForSystem(system: PeriodSystem, heightM: number): number | null {
  const ct = getPeriodSystemCt(system);
  return ct === null ? null : calculateEmpiricalPeriod(ct, heightM);
}
