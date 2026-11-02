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
/**
 * Source-aware physical unit conversions for new committed measurements.
 * Legacy formatCadDistance/formatCadArea above remain unchanged.
 */
export type CadSourceUnit = CadUnit | "unitless";
export type CadAreaUnit = "mm2" | "cm2" | "m2" | "in2" | "ft2";
export type CadSourceUnitOrigin = "dxf-insunits" | "dwg-metadata" | "calibration" | "unknown";

export interface CadSourceUnitContext {
  readonly sourceUnit: CadSourceUnit;
  readonly mmPerWorldUnit: number | null;
  readonly source: CadSourceUnitOrigin;
  readonly insunitsCode?: number | null;
  readonly calibrationRevision?: number;
}

const DXF_INSUNITS_TO_UNIT: Readonly<Record<number, CadUnit>> = {
  1: "in", 2: "ft", 4: "mm", 5: "cm", 6: "m",
};

/** Unknown, 0 and unsupported codes never silently imply metre. */
export function sourceContextFromInsunits(insunits: number | null | undefined): CadSourceUnitContext {
  const unit = Number.isInteger(insunits) ? DXF_INSUNITS_TO_UNIT[insunits as number] : undefined;
  if (!unit) {
    return {
      sourceUnit: "unitless",
      mmPerWorldUnit: null,
      source: "unknown",
      insunitsCode: Number.isInteger(insunits) && (insunits as number) >= 0 ? insunits : null,
    };
  }
  return {
    sourceUnit: unit,
    mmPerWorldUnit: CAD_BASE_UNITS[unit].mmPerUnit,
    source: "dxf-insunits",
    insunitsCode: insunits,
  };
}

export function calculateCalibrationFromWorldDistance(
  worldDistance: number,
  knownRealDistance: number,
  targetUnit: CadUnit,
  calibrationRevision = 1
): CadSourceUnitContext {
  if (!Number.isFinite(worldDistance) || worldDistance <= 0 ||
      !Number.isFinite(knownRealDistance) || knownRealDistance <= 0 ||
      !Number.isSafeInteger(calibrationRevision) || calibrationRevision < 0) {
    throw new Error("Kalibrasyon mesafeleri pozitif ve sonlu, revizyon geçerli olmalıdır.");
  }
  const mmPerWorldUnit = knownRealDistance * CAD_BASE_UNITS[targetUnit].mmPerUnit / worldDistance;
  if (!Number.isFinite(mmPerWorldUnit) || mmPerWorldUnit <= 0) {
    throw new Error("Hesaplanan kalibrasyon ölçeği geçersiz.");
  }
  return { sourceUnit: "unitless", mmPerWorldUnit, source: "calibration", calibrationRevision };
}

/** No physical scale => null (never present a fabricated conversion). */
export function convertDistance(
  worldDistance: number,
  source: CadSourceUnitContext,
  displayUnit: CadUnit
): number | null {
  const scale = source.mmPerWorldUnit;
  if (!Number.isFinite(worldDistance) || scale === null ||
      !Number.isFinite(scale) || scale <= 0) return null;
  const value = worldDistance * scale / CAD_BASE_UNITS[displayUnit].mmPerUnit;
  return Number.isFinite(value) ? value : null;
}

export function convertArea(
  worldArea: number,
  source: CadSourceUnitContext,
  displayUnit: CadAreaUnit
): number | null {
  const scale = source.mmPerWorldUnit;
  if (!Number.isFinite(worldArea) || scale === null ||
      !Number.isFinite(scale) || scale <= 0) return null;
  const lengthFactor = scale / CAD_BASE_UNITS[displayUnit.slice(0, -1) as CadUnit].mmPerUnit;
  const value = worldArea * lengthFactor * lengthFactor;
  return Number.isFinite(value) ? value : null;
}

function fixedTr(value: number, precision: number): string {
  if (!Number.isInteger(precision) || precision < 0 || precision > 6) {
    throw new Error("Hassasiyet 0–6 arasında olmalıdır.");
  }
  return new Intl.NumberFormat("tr-TR", {
    useGrouping: true,
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(value);
}

export function formatDistance(
  worldDistance: number,
  source: CadSourceUnitContext,
  displayUnit: CadUnit,
  precision = 2
): string {
  const value = convertDistance(worldDistance, source, displayUnit);
  return value === null
    ? fixedTr(worldDistance, precision) + " çizim birimi"
    : fixedTr(value, precision) + " " + displayUnit;
}

export function formatArea(
  worldArea: number,
  source: CadSourceUnitContext,
  displayUnit: CadAreaUnit,
  precision = 2
): string {
  const value = convertArea(worldArea, source, displayUnit);
  return value === null
    ? fixedTr(worldArea, precision) + " çizim birimi²"
    : fixedTr(value, precision) + " " + displayUnit.slice(0, -1) + "²";
}

/** Capture source+display+calibration revision BEFORE committing a measurement. */
export function captureMeasurementContext(
  source: CadSourceUnitContext,
  options: {
    displayUnit: CadUnit;
    areaDisplayUnit?: CadAreaUnit;
    precision?: number;
    areaPrecision?: number;
  }
): import("./schema").CadMeasurementContext {
  const scale = source.mmPerWorldUnit;
  if ((source.source === "unknown") !== (scale === null) ||
      (scale !== null && (!Number.isFinite(scale) || scale <= 0))) {
    throw new Error("Kaynak birimi veya kalibrasyon ölçeği güvenilir değil.");
  }
  const precision = options.precision ?? 2;
  const areaPrecision = options.areaPrecision ?? 2;
  if (![precision, areaPrecision].every((p) => Number.isSafeInteger(p) && p >= 0 && p <= 6)) {
    throw new Error("Hassasiyet 0–6 arasında olmalıdır.");
  }
  const revision = source.calibrationRevision ?? 0;
  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw new Error("Kalibrasyon revizyonu geçersiz.");
  }
  return {
    version: 1,
    sourceUnit: source.sourceUnit,
    source: source.source,
    sourceInsunits: source.insunitsCode,
    mmPerWorldUnit: scale,
    calibrationRevision: revision,
    displayUnit: options.displayUnit,
    areaDisplayUnit: options.areaDisplayUnit ?? "m2",
    precision,
    areaPrecision,
  };
}

export function formatCapturedDistance(
  worldDistance: number,
  context: import("./schema").CadMeasurementContext
): string {
  return formatDistance(worldDistance, {
    sourceUnit: context.sourceUnit,
    source: context.source,
    mmPerWorldUnit: context.mmPerWorldUnit,
  }, context.displayUnit, context.precision);
}

export function formatCapturedArea(
  worldArea: number,
  context: import("./schema").CadMeasurementContext
): string {
  return formatArea(worldArea, {
    sourceUnit: context.sourceUnit,
    source: context.source,
    mmPerWorldUnit: context.mmPerWorldUnit,
  }, context.areaDisplayUnit, context.areaPrecision);
}
