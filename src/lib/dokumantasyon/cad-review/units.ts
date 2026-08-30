import type { CadPoint2d } from "./schema";

export type CadUnit = "mm" | "cm" | "m" | "in" | "ft";

export interface CadUnitConfig {
  unit: CadUnit;
  precision: number; // 0, 1, 2, 3, 4
  // scaleFactor: 1 world CAD unit corresponds to how many base units (mm)
  scaleFactor: number;
}

export interface CadCalibrationState {
  isCalibrated: boolean;
  referencePoint1: CadPoint2d | null;
  referencePoint2: CadPoint2d | null;
  measuredWorldDistance: number | null;
  targetRealDistance: number | null;
  targetUnit: CadUnit;
  // calibrationScale = targetRealDistance / measuredWorldDistance
  calibrationScale: number;
}

export const CAD_BASE_UNITS: Record<CadUnit, { label: string; symbol: string; mmPerUnit: number }> = {
  mm: { label: "Milimetre", symbol: "mm", mmPerUnit: 1 },
  cm: { label: "Santimetre", symbol: "cm", mmPerUnit: 10 },
  m: { label: "Metre", symbol: "m", mmPerUnit: 1000 },
  in: { label: "İnç", symbol: "in", mmPerUnit: 25.4 },
  ft: { label: "Fit", symbol: "ft", mmPerUnit: 304.8 },
};

/**
 * Calculates a calibration scale from two reference points and a known physical distance.
 */
export function calculateCalibration(
  p1: CadPoint2d,
  p2: CadPoint2d,
  knownRealDistance: number,
  targetUnit: CadUnit = "m"
): CadCalibrationState {
  const worldDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  if (!Number.isFinite(worldDist) || worldDist <= 0) {
    throw new Error("Referans noktaları arasındaki CAD mesafesi sıfırdan büyük olmalıdır.");
  }
  if (!Number.isFinite(knownRealDistance) || knownRealDistance <= 0) {
    throw new Error("Gerçek ölçüm mesafesi pozitif ve sonlu olmalıdır.");
  }

  const calibrationScale = knownRealDistance / worldDist;

  return {
    isCalibrated: true,
    referencePoint1: { x: p1.x, y: p1.y },
    referencePoint2: { x: p2.x, y: p2.y },
    measuredWorldDistance: worldDist,
    targetRealDistance: knownRealDistance,
    targetUnit,
    calibrationScale,
  };
}

/**
 * Formats a CAD world distance value according to unit, calibration, and precision.
 */
export function formatCadDistance(
  worldDistance: number,
  unit: CadUnit = "m",
  precision = 2,
  calibration?: CadCalibrationState | null
): string {
  if (!Number.isFinite(worldDistance)) return "0";

  let realValue = worldDistance;
  let displayUnit = unit;

  if (calibration?.isCalibrated && calibration.calibrationScale > 0) {
    realValue = worldDistance * calibration.calibrationScale;
    displayUnit = calibration.targetUnit;
  }

  const fixedStr = realValue.toFixed(precision);
  const [intPart, decPart] = fixedStr.split(".");
  const formattedInt = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const symbol = CAD_BASE_UNITS[displayUnit]?.symbol ?? displayUnit;

  if (decPart !== undefined && decPart.length > 0) {
    return `${formattedInt},${decPart} ${symbol}`;
  }
  return `${formattedInt} ${symbol}`;
}

/**
 * Formats a CAD world area value.
 */
export function formatCadArea(
  worldArea: number,
  unit: CadUnit = "m",
  precision = 2,
  calibration?: CadCalibrationState | null
): string {
  if (!Number.isFinite(worldArea)) return "0";

  let realValue = worldArea;
  let displayUnit = unit;

  if (calibration?.isCalibrated && calibration.calibrationScale > 0) {
    realValue = worldArea * (calibration.calibrationScale * calibration.calibrationScale);
    displayUnit = calibration.targetUnit;
  }

  const fixedStr = realValue.toFixed(precision);
  const [intPart, decPart] = fixedStr.split(".");
  const formattedInt = (intPart || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const symbol = `${CAD_BASE_UNITS[displayUnit]?.symbol ?? displayUnit}²`;

  if (decPart !== undefined && decPart.length > 0) {
    return `${formattedInt},${decPart} ${symbol}`;
  }
  return `${formattedInt} ${symbol}`;
}