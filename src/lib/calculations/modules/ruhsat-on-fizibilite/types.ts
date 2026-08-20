import type { ANALYSIS_SCHEMA_VERSION } from "./versions";

export const PROVENANCE_STATUSES = [
  "DOCUMENT",
  "CALCULATION",
  "MEASUREMENT",
  "ASSUMPTION",
  "HEURISTIC",
  "REQUIRES_CONFIRMATION",
  "HISTORICAL_RULE",
  "LOCAL_RULE",
  "GEOMETRY_CONFIRMATION",
  "ARCHITECTURAL_CONFIRMATION",
] as const;

export type ProvenanceStatus = (typeof PROVENANCE_STATUSES)[number];

export interface ValueProvenance {
  status: ProvenanceStatus;
  sourceId: string | null;
  note?: string | null;
}

export interface RawSourcedNumericInput {
  rawValue: string | null;
  provenance: ValueProvenance | null;
}

export type UnknownValueReason = "MISSING" | "INVALID";

export interface KnownDomainValue<T> {
  state: "known";
  value: T;
  rawValue: string;
  provenance: ValueProvenance;
}

export interface UnknownDomainValue {
  state: "unknown";
  reason: UnknownValueReason;
  rawValue: string | null;
}

export type DomainValue<T> = KnownDomainValue<T> | UnknownDomainValue;

export const PROJECT_USE_TYPES = ["RESIDENTIAL", "COMMERCIAL", "MIXED", "OTHER"] as const;
export type ProjectUseType = (typeof PROJECT_USE_TYPES)[number];

export const BUILDING_ORDERS = ["DETACHED", "BLOCK", "ADJOINING", "OTHER"] as const;
export type BuildingOrder = (typeof BUILDING_ORDERS)[number];

export const TARGET_UNIT_TYPES = ["1+1", "2+1", "3+1", "4+1", "MIXED"] as const;
export type TargetUnitType = (typeof TARGET_UNIT_TYPES)[number];

export const BASEMENT_INTENTS = [
  "NONE",
  "PARKING",
  "SHELTER",
  "STORAGE",
  "MIXED",
  "UNDECIDED",
] as const;
export type BasementIntent = (typeof BASEMENT_INTENTS)[number];

export interface ConfidenceEvidence {
  hasReadableCurrentZoningDocument: boolean;
  hasPlanNotes: boolean;
  hasCoordinateParcel: boolean;
  hasArchitecturalPreplan: boolean;
  hasPermitCalculation: boolean;
  hasDwg: boolean;
}

export type ConfidenceLevel = "BELOW_A" | "A" | "B" | "C" | "D";
export type ConfidenceEvidenceKey = keyof ConfidenceEvidence;

export interface ConfidenceAssessment {
  level: ConfidenceLevel;
  missingForNextLevel: readonly ConfidenceEvidenceKey[];
  reasonCode:
    | "CURRENT_ZONING_DOCUMENT_REQUIRED"
    | "PLAN_NOTES_AND_COORDINATE_PARCEL_REQUIRED"
    | "ARCHITECTURAL_PREPLAN_REQUIRED"
    | "PERMIT_CALCULATION_AND_DWG_REQUIRED"
    | "HIGHEST_DEFINED_LEVEL";
}

export interface RawRuhsatAnalysisInput {
  project: {
    analysisDate: string | null;
    permitApplicationDate: string | null;
    municipality: string | null;
    district: string | null;
    useType: ProjectUseType | null;
  };
  parcel: {
    areaM2: RawSourcedNumericInput;
    taks: RawSourcedNumericInput;
    kaks: RawSourcedNumericInput;
    maxFloorCount: RawSourcedNumericInput;
    maxHeightM: RawSourcedNumericInput;
    buildingOrder: BuildingOrder | null;
    setbacks: {
      frontM: RawSourcedNumericInput;
      sideLeftM: RawSourcedNumericInput;
      sideRightM: RawSourcedNumericInput;
      rearM: RawSourcedNumericInput;
    };
    manualGeometryCapacityM2: RawSourcedNumericInput;
  };
  program: {
    targetUnitType: TargetUnitType | null;
    basementIntent: BasementIntent | null;
  };
  evidence: ConfidenceEvidence;
}

export interface NormalizedRuhsatAnalysisInput {
  schemaVersion: typeof ANALYSIS_SCHEMA_VERSION;
  project: {
    analysisDate: string | null;
    permitApplicationDate: string | null;
    municipality: string | null;
    district: string | null;
    useType: ProjectUseType | null;
  };
  parcel: {
    areaM2: DomainValue<number>;
    taks: DomainValue<number>;
    kaks: DomainValue<number>;
    maxFloorCount: DomainValue<number>;
    maxHeightM: DomainValue<number>;
    buildingOrder: BuildingOrder | null;
    setbacks: {
      frontM: DomainValue<number>;
      sideLeftM: DomainValue<number>;
      sideRightM: DomainValue<number>;
      rearM: DomainValue<number>;
    };
    manualGeometryCapacityM2: DomainValue<number>;
  };
  program: {
    targetUnitType: TargetUnitType | null;
    basementIntent: BasementIntent | null;
  };
  evidence: ConfidenceEvidence;
  confidence: ConfidenceAssessment;
}

export type DomainIssueSeverity = "warning" | "error";

export type DomainIssueCode =
  | "INVALID_NUMBER"
  | "OUT_OF_RANGE"
  | "NOT_INTEGER"
  | "MISSING_PROVENANCE"
  | "INVALID_PROVENANCE"
  | "MISSING_SOURCE_REFERENCE"
  | "INVALID_DATE";

export interface DomainIssue {
  code: DomainIssueCode;
  severity: DomainIssueSeverity;
  field: string;
  message: string;
}

export type DomainResult<T> =
  | {
      ok: true;
      value: T;
      issues: readonly DomainIssue[];
    }
  | {
      ok: false;
      partialValue: T;
      issues: readonly DomainIssue[];
    };
