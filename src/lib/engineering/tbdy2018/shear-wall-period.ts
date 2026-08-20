import { calculateEmpiricalPeriod } from "./period";
import type { ShearWallInput, ShearWallPeriodParameters } from "./types";

function hasValidWallInputs(walls: readonly ShearWallInput[], heightM: number): boolean {
  return Number.isFinite(heightM) && heightM > 0 && walls.length > 0 && walls.every(
    (wall) => Number.isFinite(wall.areaM2) && wall.areaM2 > 0 && Number.isFinite(wall.lengthM) && wall.lengthM > 0,
  );
}

/** TBDY 2018 Denk. 4.28b: At = ΣAwj[0.2 + (lwj/HN)²] ≤ ΣAwj. */
export function calculateShearWallEquivalentArea(walls: readonly ShearWallInput[], heightM: number): number {
  if (!hasValidWallInputs(walls, heightM)) return Number.NaN;
  const totalWallArea = walls.reduce((total, wall) => total + wall.areaM2, 0);
  const uncappedEquivalentArea = walls.reduce(
    (total, wall) => total + wall.areaM2 * (0.2 + Math.pow(wall.lengthM / heightM, 2)),
    0,
  );
  return Math.min(uncappedEquivalentArea, totalWallArea);
}

/** TBDY 2018 Denk. 4.28a: Ct = 0.1 / √At ≤ 0.07. */
export function calculateShearWallCt(equivalentAreaM2: number): number {
  if (!Number.isFinite(equivalentAreaM2) || equivalentAreaM2 <= 0) return Number.NaN;
  return Math.min(0.1 / Math.sqrt(equivalentAreaM2), 0.07);
}

export function calculateShearWallPeriodParameters(
  walls: readonly ShearWallInput[],
  heightM: number,
): ShearWallPeriodParameters | null {
  if (!hasValidWallInputs(walls, heightM)) return null;
  const totalWallAreaM2 = walls.reduce((total, wall) => total + wall.areaM2, 0);
  const uncappedEquivalentAreaM2 = walls.reduce(
    (total, wall) => total + wall.areaM2 * (0.2 + Math.pow(wall.lengthM / heightM, 2)),
    0,
  );
  const equivalentAreaM2 = Math.min(uncappedEquivalentAreaM2, totalWallAreaM2);
  const ct = calculateShearWallCt(equivalentAreaM2);
  const periodS = calculateEmpiricalPeriod(ct, heightM);
  return { totalWallAreaM2, uncappedEquivalentAreaM2, equivalentAreaM2, ct, periodS };
}
