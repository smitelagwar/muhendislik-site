import { roundToInternalPrecision } from "./number-parsing";
import { CURRENT_RULE_SNAPSHOT, type RuleSnapshot } from "./rules";
import { evaluateConfidence } from "./confidence";
import {
  TYPOLOGY_PROFILES,
  UNIT_TYPOLOGIES,
  QUICK_RESERVE_ENVELOPE,
  type UnitTypology,
  type ComfortBand,
} from "./typology-profiles";
import type {
  CalculationTrace,
} from "./engine-types";
import type {
  ConfidenceAssessment,
  ConfidenceEvidence,
} from "./types";

export type ComputationScope = "LEGAL_RIGHTS" | "QUICK_HEURISTIC" | "FULL_ITERATIVE";

export interface Range {
  min: number;
  max: number;
}

export type QuickTriggerState =
  | "NOT_TRIGGERED"
  | "CHECK_REQUIRED"
  | "MAY_TRIGGER"
  | "UNKNOWN"
  | "REQUIRES_CONFIRMATION";

export interface TypologyCardResult {
  unitType: UnitTypology;
  candidateTotalUnits: Range;
  balancedCandidateTotalUnits: number;
  candidateUnitsPerFloor: Range | null;
  theoreticalEmsalSharePerUnitM2: Range;
  estimatedClosedGrossPerUnitM2: Range;
  estimatedNetPerUnitM2: Range;
  calibrationStatus: "PROVISIONAL" | "OFFICE_CALIBRATED";
  provenance: "HEURISTIC";
  geometryVerified: false;
  triggerSummary: {
    shelter: QuickTriggerState;
    lift: QuickTriggerState;
    secondLift: QuickTriggerState;
    fire: QuickTriggerState;
  };
}

export type ReverseFitClass =
  | "TOO_TIGHT"
  | "COMPACT"
  | "BALANCED"
  | "COMFORTABLE"
  | "VERY_LARGE";

export interface ReverseSizingResult {
  desiredTotalUnits: number;
  theoreticalEmsalSharePerUnitM2: number;
  estimatedClosedGrossRangeM2: Range;
  estimatedNetRangeM2: Range;
  fitClass: ReverseFitClass;
  provenance: "HEURISTIC";
}

export interface QuickLegalRights {
  parcelAreaM2: number;
  taks: number;
  kaks: number;
  taksMaxM2: number;
  emsalMaxM2: number;
  effectiveFootprintLimitM2: number;
  manualGeometryCapacityM2: number | null;
  impliedMinFloorPlates: number;
  distributableEmsalProxyM2: number | null;
  traces: {
    taksMax: CalculationTrace;
    emsalMax: CalculationTrace;
    impliedMinFloorPlates: CalculationTrace;
  };
}

export interface QuickFeasibilityRequest {
  parcelAreaM2: number;
  taks: number;
  kaks: number;
  optionalFloorCount?: number | null;
  manualGeometryCapacityM2?: number | null;
  desiredTotalUnits?: number | null;
  reverseUnitType?: UnitTypology;
  evidence?: ConfidenceEvidence;
  ruleContext?: { mode: "CURRENT_SNAPSHOT" };
}

export interface QuickFeasibilityResult {
  ok: boolean;
  scope: ComputationScope;
  confidence: ConfidenceAssessment;
  legalRights: QuickLegalRights;
  typologyCards: Record<UnitTypology, TypologyCardResult>;
  reverseSizing: ReverseSizingResult | null;
  ruleSnapshot: RuleSnapshot;
}

export function calculateImpliedMinFloorPlates(emsalMaxM2: number, taksMaxM2: number): number {
  if (taksMaxM2 <= 0 || emsalMaxM2 <= 0) {
    return 1;
  }
  return Math.ceil(emsalMaxM2 / taksMaxM2);
}

function evaluateShelterTrigger(candidateRange: Range): QuickTriggerState {
  if (candidateRange.max < 10) {
    return "NOT_TRIGGERED";
  }
  if (candidateRange.min >= 10) {
    return "CHECK_REQUIRED";
  }
  return "MAY_TRIGGER";
}

function evaluateLiftTriggers(floorCount: number | null | undefined): {
  lift: QuickTriggerState;
  secondLift: QuickTriggerState;
} {
  if (typeof floorCount !== "number" || floorCount <= 0) {
    return {
      lift: "UNKNOWN",
      secondLift: "UNKNOWN",
    };
  }

  return {
    lift: floorCount >= 4 ? "CHECK_REQUIRED" : floorCount === 3 ? "MAY_TRIGGER" : "NOT_TRIGGERED",
    secondLift: floorCount >= 10 ? "CHECK_REQUIRED" : "NOT_TRIGGERED",
  };
}

export function calculateQuickTypologyMatrix(
  legalRights: QuickLegalRights,
  optionalFloorCount?: number | null
): Record<UnitTypology, TypologyCardResult> {
  const { emsalMaxM2, taksMaxM2 } = legalRights;
  const floorCount = typeof optionalFloorCount === "number" && optionalFloorCount > 0 ? optionalFloorCount : null;

  const result = {} as Record<UnitTypology, TypologyCardResult>;

  for (const unitType of UNIT_TYPOLOGIES) {
    const profile = TYPOLOGY_PROFILES[unitType];

    const evaluateBand = (band: ComfortBand) => {
      const reserveRatio = QUICK_RESERVE_ENVELOPE[band];
      const bandProfile = profile.bands[band];

      if (floorCount === null) {
        const areaProxy = emsalMaxM2 * (1 - reserveRatio);
        const minCandidate = Math.max(1, Math.floor(areaProxy / bandProfile.targetClosedGrossAreaM2.max));
        const maxCandidate = Math.max(minCandidate, Math.floor(areaProxy / bandProfile.targetClosedGrossAreaM2.min));
        return {
          totalRange: { min: minCandidate, max: maxCandidate },
          perFloorRange: null,
        };
      } else {
        const totalAreaProxy = Math.min(emsalMaxM2, taksMaxM2 * floorCount) * (1 - reserveRatio);
        const floorAreaProxy = taksMaxM2 * (1 - reserveRatio);

        const minUnitsFloor = Math.max(1, Math.floor(floorAreaProxy / bandProfile.targetClosedGrossAreaM2.max));
        const maxUnitsFloor = Math.max(minUnitsFloor, Math.floor(floorAreaProxy / bandProfile.targetClosedGrossAreaM2.min));

        const minUnitsTotal = Math.min(
          Math.max(1, Math.floor(totalAreaProxy / bandProfile.targetClosedGrossAreaM2.max)),
          minUnitsFloor * floorCount
        );
        const maxUnitsTotal = Math.min(
          Math.max(minUnitsTotal, Math.floor(totalAreaProxy / bandProfile.targetClosedGrossAreaM2.min)),
          maxUnitsFloor * floorCount
        );

        return {
          totalRange: { min: minUnitsTotal, max: maxUnitsTotal },
          perFloorRange: { min: minUnitsFloor, max: maxUnitsFloor },
        };
      }
    };

    const compactRes = evaluateBand("COMPACT");
    const balancedRes = evaluateBand("BALANCED");
    const comfortRes = evaluateBand("COMFORT");

    const candidateTotalUnits: Range = {
      min: Math.min(compactRes.totalRange.min, balancedRes.totalRange.min, comfortRes.totalRange.min),
      max: Math.max(compactRes.totalRange.max, balancedRes.totalRange.max, comfortRes.totalRange.max),
    };

    const balancedCandidateTotalUnits = Math.round(
      (balancedRes.totalRange.min + balancedRes.totalRange.max) / 2
    );

    const candidateUnitsPerFloor: Range | null = floorCount !== null
      ? {
          min: Math.min(compactRes.perFloorRange!.min, balancedRes.perFloorRange!.min, comfortRes.perFloorRange!.min),
          max: Math.max(compactRes.perFloorRange!.max, balancedRes.perFloorRange!.max, comfortRes.perFloorRange!.max),
        }
      : null;

    const theoreticalEmsalSharePerUnitM2: Range = {
      min: roundToInternalPrecision(emsalMaxM2 / candidateTotalUnits.max),
      max: roundToInternalPrecision(emsalMaxM2 / candidateTotalUnits.min),
    };

    const estimatedClosedGrossPerUnitM2: Range = {
      min: profile.bands.BALANCED.targetClosedGrossAreaM2.min,
      max: profile.bands.BALANCED.targetClosedGrossAreaM2.max,
    };

    const estimatedNetPerUnitM2: Range = {
      min: profile.bands.BALANCED.targetNetAreaM2.min,
      max: profile.bands.BALANCED.targetNetAreaM2.max,
    };

    const liftSignals = evaluateLiftTriggers(floorCount);

    result[unitType] = {
      unitType,
      candidateTotalUnits,
      balancedCandidateTotalUnits,
      candidateUnitsPerFloor,
      theoreticalEmsalSharePerUnitM2,
      estimatedClosedGrossPerUnitM2,
      estimatedNetPerUnitM2,
      calibrationStatus: "PROVISIONAL",
      provenance: "HEURISTIC",
      geometryVerified: false,
      triggerSummary: {
        shelter: evaluateShelterTrigger(candidateTotalUnits),
        lift: liftSignals.lift,
        secondLift: liftSignals.secondLift,
        fire: "UNKNOWN",
      },
    };
  }

  return result;
}

export function calculateReverseUnitSizing(
  emsalMaxM2: number,
  desiredTotalUnits: number,
  unitType: UnitTypology = "3+1"
): ReverseSizingResult | null {
  if (!Number.isFinite(desiredTotalUnits) || desiredTotalUnits <= 0 || emsalMaxM2 <= 0) {
    return null;
  }

  const theoreticalEmsalSharePerUnitM2 = roundToInternalPrecision(emsalMaxM2 / desiredTotalUnits);

  // Quick reserve proxy (%8 - %20 ortak alan)
  const minAllocatable = (emsalMaxM2 * (1 - QUICK_RESERVE_ENVELOPE.COMFORT)) / desiredTotalUnits;
  const maxAllocatable = (emsalMaxM2 * (1 - QUICK_RESERVE_ENVELOPE.COMPACT)) / desiredTotalUnits;

  const estimatedClosedGrossRangeM2: Range = {
    min: roundToInternalPrecision(minAllocatable),
    max: roundToInternalPrecision(maxAllocatable),
  };

  // Kapalı brüt -> Net geçişi (1.12 - 1.24 heuristic)
  const estimatedNetRangeM2: Range = {
    min: roundToInternalPrecision(estimatedClosedGrossRangeM2.min / 1.24),
    max: roundToInternalPrecision(estimatedClosedGrossRangeM2.max / 1.12),
  };

  // Fit class değerlendirmesi (seçili tipoloji balanced aralığı ile)
  const profile = TYPOLOGY_PROFILES[unitType];
  const targetBalancedNet = profile.bands.BALANCED.targetNetAreaM2;

  let fitClass: ReverseFitClass = "BALANCED";
  const avgNet = (estimatedNetRangeM2.min + estimatedNetRangeM2.max) / 2;

  if (avgNet < profile.bands.COMPACT.targetNetAreaM2.min * 0.9) {
    fitClass = "TOO_TIGHT";
  } else if (avgNet < targetBalancedNet.min) {
    fitClass = "COMPACT";
  } else if (avgNet <= targetBalancedNet.max) {
    fitClass = "BALANCED";
  } else if (avgNet <= profile.bands.COMFORT.targetNetAreaM2.max * 1.15) {
    fitClass = "COMFORTABLE";
  } else {
    fitClass = "VERY_LARGE";
  }

  return {
    desiredTotalUnits,
    theoreticalEmsalSharePerUnitM2,
    estimatedClosedGrossRangeM2,
    estimatedNetRangeM2,
    fitClass,
    provenance: "HEURISTIC",
  };
}

export function calculateQuickFeasibility(
  request: QuickFeasibilityRequest
): QuickFeasibilityResult | null {
  const {
    parcelAreaM2,
    taks,
    kaks,
    optionalFloorCount,
    manualGeometryCapacityM2,
    desiredTotalUnits,
    reverseUnitType,
    evidence,
  } = request;

  if (
    !Number.isFinite(parcelAreaM2) ||
    parcelAreaM2 <= 0 ||
    !Number.isFinite(taks) ||
    taks <= 0 ||
    taks > 1 ||
    !Number.isFinite(kaks) ||
    kaks <= 0
  ) {
    return null;
  }

  const taksMaxM2 = roundToInternalPrecision(parcelAreaM2 * taks);
  const emsalMaxM2 = roundToInternalPrecision(parcelAreaM2 * kaks);

  const effectiveFootprintLimitM2 =
    typeof manualGeometryCapacityM2 === "number" && manualGeometryCapacityM2 > 0
      ? roundToInternalPrecision(Math.min(taksMaxM2, manualGeometryCapacityM2))
      : taksMaxM2;

  const impliedMinFloorPlates = calculateImpliedMinFloorPlates(emsalMaxM2, taksMaxM2);

  const distributableEmsalProxyM2 =
    typeof optionalFloorCount === "number" && optionalFloorCount > 0
      ? roundToInternalPrecision(Math.min(emsalMaxM2, taksMaxM2 * optionalFloorCount))
      : null;

  const confidence = evaluateConfidence(
    evidence ?? {
      hasReadableCurrentZoningDocument: false,
      hasPlanNotes: false,
      hasCoordinateParcel: false,
      hasArchitecturalPreplan: false,
      hasPermitCalculation: false,
      hasDwg: false,
    }
  );

  const legalRuleIds = ["PAIY-TAKS-KAKS-THEORETICAL-LIMITS"];

  const traces: {
    taksMax: CalculationTrace;
    emsalMax: CalculationTrace;
    impliedMinFloorPlates: CalculationTrace;
  } = {
    taksMax: {
      status: "CALCULATION",
      formula: "PARCEL_AREA × TAKS",
      inputFields: ["parcel.areaM2", "parcel.taks"],
      inputStatuses: ["HEURISTIC", "HEURISTIC"],
      ruleIds: legalRuleIds,
      sourceIds: [],
      approximate: false,
    },
    emsalMax: {
      status: "CALCULATION",
      formula: "PARCEL_AREA × KAKS",
      inputFields: ["parcel.areaM2", "parcel.kaks"],
      inputStatuses: ["HEURISTIC", "HEURISTIC"],
      ruleIds: legalRuleIds,
      sourceIds: [],
      approximate: false,
    },
    impliedMinFloorPlates: {
      status: "CALCULATION",
      formula: "ceil(EMSAL_MAX / TAKS_MAX)",
      inputFields: ["emsalMaxM2", "taksMaxM2"],
      inputStatuses: ["CALCULATION", "CALCULATION"],
      ruleIds: legalRuleIds,
      sourceIds: [],
      approximate: true,
    },
  };

  const legalRights: QuickLegalRights = {
    parcelAreaM2,
    taks,
    kaks,
    taksMaxM2,
    emsalMaxM2,
    effectiveFootprintLimitM2,
    manualGeometryCapacityM2: manualGeometryCapacityM2 ?? null,
    impliedMinFloorPlates,
    distributableEmsalProxyM2,
    traces,
  };

  const typologyCards = calculateQuickTypologyMatrix(legalRights, optionalFloorCount);

  const reverseSizing = typeof desiredTotalUnits === "number" && desiredTotalUnits > 0
    ? calculateReverseUnitSizing(emsalMaxM2, desiredTotalUnits, reverseUnitType ?? "3+1")
    : null;

  return {
    ok: true,
    scope: "QUICK_HEURISTIC",
    confidence,
    legalRights,
    typologyCards,
    reverseSizing,
    ruleSnapshot: CURRENT_RULE_SNAPSHOT,
  };
}
