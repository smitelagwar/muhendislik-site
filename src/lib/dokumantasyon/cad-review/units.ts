import type { CadPoint2d } from "./schema";
import { getCurrentCadMeasurementUnitSettings } from "./store";

export type CadUnit = "mm" | "cm" | "m" | "in" | "ft";
export type CadLengthUnit = "mm" | "cm" | "m";
export type CadAreaUnit = "m2" | "cm2" | "mm2";

export interface CadUnitConfig {
  unit: CadUnit;
  precision: number;
  // 1 world CAD unit corresponds to how many base units (mm)
  scaleFactor: number;
}

export interface CadSourceUnitContext {
  sourceUnit: CadLengthUnit | "unitless";
  mmPerWorldUnit: number | null;
  source: "dxf-insunits" | "manual" | "calibration" | "unknown";
}

export interface CadCalibrationState {
  isCalibrated: boolean;
  referencePoint1: CadPoint2d | null;
  referencePoint2: CadPoint2d | null;
  measuredWorldDistance: number | null;
  targetRealDistance: number | null;
  targetUnit: CadUnit;
  // calibrationScale = targetRealDistance / measuredWorldDistance in targetUnit/worldUnit
  calibrationScale: number;
  // canonical physical scale used by the new measurement engine
  mmPerWorldUnit?: number;
  calibratedAt?: string;
}

type CadDatabaseLike = {
  insunits?: unknown;
  getSystemVariable?: (name: string) => unknown;
};

type CadAdapterLike = {
  manager?: {
    curDocument?: {
      database?: CadDatabaseLike;
    };
  };
};

type CadAdapterHost = HTMLElement & {
  __cadAdapter?: CadAdapterLike;
};

export const CAD_MEASUREMENT_CONTEXT_CHANGED_EVENT = "cad:measurement-context-changed";

export const CAD_BASE_UNITS: Record<CadUnit, { label: string; symbol: string; mmPerUnit: number }> = {
  mm: { label: "Milimetre", symbol: "mm", mmPerUnit: 1 },
  cm: { label: "Santimetre", symbol: "cm", mmPerUnit: 10 },
  m: { label: "Metre", symbol: "m", mmPerUnit: 1000 },
  in: { label: "İnç", symbol: "in", mmPerUnit: 25.4 },
  ft: { label: "Fit", symbol: "ft", mmPerUnit: 304.8 },
};

const CAD_AREA_MM2_PER_UNIT: Record<CadAreaUnit, number> = {
  mm2: 1,
  cm2: 100,
  m2: 1_000_000,
};

const CAD_AREA_SYMBOLS: Record<CadAreaUnit, string> = {
  mm2: "mm²",
  cm2: "cm²",
  m2: "m²",
};

function clampPrecision(precision: number): number {
  if (!Number.isFinite(precision)) return 2;
  return Math.max(0, Math.min(6, Math.trunc(precision)));
}

function formatNumber(value: number, precision: number): string {
  const safePrecision = clampPrecision(precision);
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: safePrecision,
    maximumFractionDigits: safePrecision,
  }).format(Number.isFinite(value) ? value : 0);
}

function fileIdFromElement(element?: Element | null): string | null {
  if (typeof document === "undefined") return null;
  const host =
    element?.closest?.("[data-cad-upstream-host='true']") ??
    document.querySelector("[data-cad-upstream-host='true']");
  const fileId = host?.getAttribute("data-file-id")?.trim();
  return fileId || null;
}

function resolveAdapter(element?: Element | null): CadAdapterLike | null {
  if (typeof document === "undefined") return null;

  const directCandidates: Array<Element | null | undefined> = [
    element,
    element?.parentElement,
    element?.closest?.("[data-cad-upstream-host='true']"),
  ];

  const section =
    element?.closest?.("[data-cad-upstream-host='true']") ??
    document.querySelector("[data-cad-upstream-host='true']");

  directCandidates.push(
    section?.querySelector("[aria-label$='CAD görünümü']"),
    section?.querySelector("[data-cad-upstream-host='true']"),
    document.querySelector("[aria-label$='CAD görünümü']")
  );

  for (const candidate of directCandidates) {
    const adapter = (candidate as CadAdapterHost | null | undefined)?.__cadAdapter;
    if (adapter) return adapter;
  }

  return null;
}

function normalizeInsunits(value: unknown): CadLengthUnit | "unitless" | null {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "4" || normalized.includes("millimeter")) return "mm";
    if (normalized === "5" || normalized.includes("centimeter")) return "cm";
    if (normalized === "6" || normalized === "meter" || normalized === "meters") return "m";
    if (normalized === "0" || normalized.includes("undefined") || normalized.includes("unitless")) {
      return "unitless";
    }
  }

  const numeric = Number(value);
  if (numeric === 4) return "mm";
  if (numeric === 5) return "cm";
  if (numeric === 6) return "m";
  if (numeric === 0) return "unitless";
  return null;
}

function mmPerLengthUnit(unit: CadLengthUnit): number {
  return CAD_BASE_UNITS[unit].mmPerUnit;
}

function readInsunitsContext(element?: Element | null): CadSourceUnitContext | null {
  const database = resolveAdapter(element)?.manager?.curDocument?.database;
  if (!database) return null;

  let raw = database.insunits;
  if (raw === undefined && typeof database.getSystemVariable === "function") {
    try {
      raw = database.getSystemVariable("INSUNITS");
    } catch {
      raw = undefined;
    }
  }

  const unit = normalizeInsunits(raw);
  if (!unit || unit === "unitless") return null;
  return {
    sourceUnit: unit,
    mmPerWorldUnit: mmPerLengthUnit(unit),
    source: "dxf-insunits",
  };
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadCadManualSourceUnit(fileId: string): CadLengthUnit | null {
  const storage = getStorage();
  if (!storage || !fileId) return null;
  try {
    const raw = storage.getItem(`cad-source-unit:${fileId}`);
    if (raw === "mm" || raw === "cm" || raw === "m") return raw;
    if (raw) {
      const parsed = JSON.parse(raw) as { unit?: unknown };
      if (parsed.unit === "mm" || parsed.unit === "cm" || parsed.unit === "m") return parsed.unit;
    }
  } catch {
    // Invalid legacy/manual value is ignored.
  }
  return null;
}

export function saveCadManualSourceUnit(fileId: string, unit: CadLengthUnit): void {
  const storage = getStorage();
  if (!storage || !fileId) return;
  storage.setItem(`cad-source-unit:${fileId}`, JSON.stringify({ unit }));
  window.dispatchEvent(new CustomEvent(CAD_MEASUREMENT_CONTEXT_CHANGED_EVENT, { detail: { fileId } }));
}

export function loadCadCalibration(fileId: string): CadCalibrationState | null {
  const storage = getStorage();
  if (!storage || !fileId) return null;
  try {
    const raw = storage.getItem(`cad-calibration:${fileId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CadCalibrationState;
    const mmPerWorldUnit = Number(parsed.mmPerWorldUnit);
    if (!parsed.isCalibrated || !Number.isFinite(mmPerWorldUnit) || mmPerWorldUnit <= 0) {
      return null;
    }
    return { ...parsed, mmPerWorldUnit };
  } catch {
    return null;
  }
}

export function saveCadCalibration(fileId: string, calibration: CadCalibrationState): void {
  const storage = getStorage();
  if (!storage || !fileId) return;
  storage.setItem(`cad-calibration:${fileId}`, JSON.stringify(calibration));
  window.dispatchEvent(new CustomEvent(CAD_MEASUREMENT_CONTEXT_CHANGED_EVENT, { detail: { fileId } }));
}

export function clearCadCalibration(fileId: string): void {
  const storage = getStorage();
  if (!storage || !fileId) return;
  storage.removeItem(`cad-calibration:${fileId}`);
  window.dispatchEvent(new CustomEvent(CAD_MEASUREMENT_CONTEXT_CHANGED_EVENT, { detail: { fileId } }));
}

/**
 * Resolve physical source units in product-priority order:
 * DXF/DWG database INSUNITS -> saved manual unit -> file calibration -> unknown.
 */
export function resolveCadSourceUnitContext(element?: Element | null): CadSourceUnitContext {
  const fromDatabase = readInsunitsContext(element);
  if (fromDatabase) return fromDatabase;

  const fileId = fileIdFromElement(element);
  if (fileId) {
    const manualUnit = loadCadManualSourceUnit(fileId);
    if (manualUnit) {
      return {
        sourceUnit: manualUnit,
        mmPerWorldUnit: mmPerLengthUnit(manualUnit),
        source: "manual",
      };
    }

    const calibration = loadCadCalibration(fileId);
    if (calibration?.mmPerWorldUnit) {
      return {
        sourceUnit: "unitless",
        mmPerWorldUnit: calibration.mmPerWorldUnit,
        source: "calibration",
      };
    }
  }

  return {
    sourceUnit: "unitless",
    mmPerWorldUnit: null,
    source: "unknown",
  };
}

export function resolveCadMeasurementFileId(element?: Element | null): string | null {
  return fileIdFromElement(element);
}

export function worldDistanceToMm(
  worldDistance: number,
  source: CadSourceUnitContext
): number | null {
  if (!Number.isFinite(worldDistance) || source.mmPerWorldUnit === null) return null;
  return worldDistance * source.mmPerWorldUnit;
}

export function convertDistance(
  worldDistance: number,
  source: CadSourceUnitContext,
  targetUnit: CadLengthUnit
): number | null {
  const mm = worldDistanceToMm(worldDistance, source);
  if (mm === null) return null;
  return mm / mmPerLengthUnit(targetUnit);
}

export function worldAreaToMm2(
  worldArea: number,
  source: CadSourceUnitContext
): number | null {
  if (!Number.isFinite(worldArea) || source.mmPerWorldUnit === null) return null;
  return worldArea * source.mmPerWorldUnit * source.mmPerWorldUnit;
}

export function convertArea(
  worldArea: number,
  source: CadSourceUnitContext,
  targetUnit: CadAreaUnit
): number | null {
  const mm2 = worldAreaToMm2(worldArea, source);
  if (mm2 === null) return null;
  return mm2 / CAD_AREA_MM2_PER_UNIT[targetUnit];
}

export function formatDistance(
  worldDistance: number,
  source: CadSourceUnitContext,
  targetUnit: CadLengthUnit = "m",
  precision = 2
): string {
  const converted = convertDistance(worldDistance, source, targetUnit);
  if (converted === null) {
    return `${formatNumber(worldDistance, precision)} çizim birimi`;
  }
  return `${formatNumber(converted, precision)} ${targetUnit}`;
}

export function formatArea(
  worldArea: number,
  source: CadSourceUnitContext,
  targetUnit: CadAreaUnit = "m2",
  precision = 2
): string {
  const converted = convertArea(worldArea, source, targetUnit);
  if (converted === null) {
    return `${formatNumber(worldArea, precision)} çizim birimi²`;
  }
  return `${formatNumber(converted, precision)} ${CAD_AREA_SYMBOLS[targetUnit]}`;
}

/**
 * Calculates a calibration scale from two reference points and a known physical distance.
 * Kept backwards-compatible with the existing review API while also storing mm/worldUnit.
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
  const mmPerWorldUnit = calibrationScale * CAD_BASE_UNITS[targetUnit].mmPerUnit;

  return {
    isCalibrated: true,
    referencePoint1: { x: p1.x, y: p1.y },
    referencePoint2: { x: p2.x, y: p2.y },
    measuredWorldDistance: worldDist,
    targetRealDistance: knownRealDistance,
    targetUnit,
    calibrationScale,
    mmPerWorldUnit,
    calibratedAt: new Date().toISOString(),
  };
}

export function calculateCalibrationFromWorldDistance(
  measuredWorldDistance: number,
  knownRealDistance: number,
  targetUnit: CadLengthUnit
): CadCalibrationState {
  if (!Number.isFinite(measuredWorldDistance) || measuredWorldDistance <= 0) {
    throw new Error("Ölçülen çizim mesafesi sıfırdan büyük olmalıdır.");
  }
  if (!Number.isFinite(knownRealDistance) || knownRealDistance <= 0) {
    throw new Error("Gerçek uzunluk sıfırdan büyük olmalıdır.");
  }

  const calibrationScale = knownRealDistance / measuredWorldDistance;
  return {
    isCalibrated: true,
    referencePoint1: null,
    referencePoint2: null,
    measuredWorldDistance,
    targetRealDistance: knownRealDistance,
    targetUnit,
    calibrationScale,
    mmPerWorldUnit: calibrationScale * mmPerLengthUnit(targetUnit),
    calibratedAt: new Date().toISOString(),
  };
}

/**
 * Legacy formatter used by persisted Review items. In the browser it resolves the
 * active CAD source context and current measurement settings, so Distance/Area/Chain
 * labels follow the same unit/precision contract. In non-DOM unit tests it preserves
 * the historical "value already in target unit" contract.
 */
export function formatCadDistance(
  worldDistance: number,
  unit: CadUnit = "m",
  precision = 2,
  calibration?: CadCalibrationState | null
): string {
  if (!Number.isFinite(worldDistance)) return "0";

  if (calibration?.isCalibrated && calibration.calibrationScale > 0) {
    const realValue = worldDistance * calibration.calibrationScale;
    return `${formatNumber(realValue, precision)} ${CAD_BASE_UNITS[calibration.targetUnit]?.symbol ?? calibration.targetUnit}`;
  }

  if (typeof document !== "undefined") {
    const settings = getCurrentCadMeasurementUnitSettings();
    return formatDistance(
      worldDistance,
      resolveCadSourceUnitContext(),
      settings.unit,
      settings.precision
    );
  }

  return `${formatNumber(worldDistance, precision)} ${CAD_BASE_UNITS[unit]?.symbol ?? unit}`;
}

/**
 * Legacy area formatter. Browser call sites use physical source scale (scale²)
 * and the shared area display settings; Node tests preserve the historical contract.
 */
export function formatCadArea(
  worldArea: number,
  unit: CadUnit = "m",
  precision = 2,
  calibration?: CadCalibrationState | null
): string {
  if (!Number.isFinite(worldArea)) return "0";

  if (calibration?.isCalibrated && calibration.calibrationScale > 0) {
    const realValue = worldArea * calibration.calibrationScale * calibration.calibrationScale;
    return `${formatNumber(realValue, precision)} ${CAD_BASE_UNITS[calibration.targetUnit]?.symbol ?? calibration.targetUnit}²`;
  }

  if (typeof document !== "undefined") {
    const settings = getCurrentCadMeasurementUnitSettings();
    return formatArea(
      worldArea,
      resolveCadSourceUnitContext(),
      settings.areaUnit,
      settings.areaPrecision
    );
  }

  return `${formatNumber(worldArea, precision)} ${CAD_BASE_UNITS[unit]?.symbol ?? unit}²`;
}
