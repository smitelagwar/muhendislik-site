import type {
  NormalizedRuhsatAnalysisInput,
  ProvenanceStatus,
  TargetUnitType,
} from "./types";
import type { RuleSnapshot } from "./rules";
import type { ASSUMPTION_POLICY_SNAPSHOT_VERSION } from "./versions";

export const SCENARIO_IDS = ["COMPACT_MAX_UNITS", "BALANCED", "COMFORT_FEWER_UNITS"] as const;
export type ScenarioId = (typeof SCENARIO_IDS)[number];

export interface ScenarioDefinition {
  id: ScenarioId;
  targetNetAreaM2: number;
  targetClosedGrossAreaM2: number;
  baseCoreAreaM2: number;
  otherCommonAreaM2: number;
  floorTechnicalAreaM2: number;
  circulationAreaPerUnitM2: number;
}

export interface TechnicalReserveAssumptions {
  liftShaftReservationAreaM2: number;
  primaryLiftAreaM2: number;
  secondLiftAdditionalAreaM2: number;
  fireReviewAreaM2: number;
}

export interface ScenarioAssumptionSet {
  version: typeof ASSUMPTION_POLICY_SNAPSHOT_VERSION;
  maxIterations: number;
  scenarios: readonly ScenarioDefinition[];
  technicalReserves: TechnicalReserveAssumptions;
}

export interface ManualTechnicalCapacities {
  shelterPersonCapacity: number | null;
}

export interface FeasibilityCalculationRequest {
  input: NormalizedRuhsatAnalysisInput;
  assumptions: ScenarioAssumptionSet;
  technicalCapacities: ManualTechnicalCapacities;
}

export type TechnicalCheckState =
  | "NOT_TRIGGERED"
  | "CHECK_REQUIRED"
  | "REQUIRES_CONFIRMATION"
  | "UNKNOWN";

export interface LiftTriggerResult {
  state: TechnicalCheckState;
  shaftReservationRequired: boolean | null;
  requiredLiftCount: 0 | 1 | 2 | null;
  residentialUnitsAboveGroundFloor: number;
  basementFloorCountingRequiresConfirmation: boolean;
  ruleIds: readonly string[];
}

export type CapacityCheckState = "NOT_APPLICABLE" | "UNKNOWN" | "SUFFICIENT" | "INSUFFICIENT";

export interface ShelterTriggerResult {
  state: TechnicalCheckState;
  estimatedPersonEquivalent: number | null;
  providedPersonCapacity: number | null;
  capacityState: CapacityCheckState;
  ruleIds: readonly string[];
}

export interface FireTriggerResult {
  state: TechnicalCheckState;
  heightGateReached: boolean | null;
  ruleIds: readonly string[];
}

export interface AreaTriggerResult {
  state: TechnicalCheckState;
  evaluatedAreaM2: number | null;
  basis: "THEORETICAL_BUILDING_AREA" | "EFFECTIVE_FOOTPRINT";
  ruleIds: readonly string[];
}

export interface TechnicalTriggerSet {
  lift: LiftTriggerResult;
  shelter: ShelterTriggerResult;
  fire: FireTriggerResult;
  nseb: AreaTriggerResult;
  rainWater: AreaTriggerResult;
  parking: { state: "REQUIRES_CONFIRMATION"; ruleIds: readonly string[] };
  accessibility: { state: "CHECK_REQUIRED"; ruleIds: readonly string[] };
  structural: { state: "REQUIRES_CONFIRMATION"; ruleIds: readonly string[] };
  basement: { state: TechnicalCheckState; ruleIds: readonly string[] };
}

export interface FloorReserveBreakdown {
  baseCoreAreaM2: number;
  otherCommonAreaM2: number;
  floorTechnicalAreaM2: number;
  circulationAreaM2: number;
  liftAreaM2: number;
  fireReviewAreaM2: number;
  totalReservedAreaM2: number;
}

export type CapacityBottleneckCode = "TAKS" | "GEOMETRY" | "EMSAL" | "CORE" | "LIFT" | "FIRE";
export type PrimaryBottleneckCode = CapacityBottleneckCode | "SHELTER" | "INSUFFICIENT_DATA";

export interface ScenarioIterationStep {
  iteration: number;
  inputUnitsPerFloor: number;
  inputTotalUnits: number;
  outputUnitsPerFloor: number;
  outputTotalUnits: number;
  areaAllocatableToUnitsM2: number;
  reserves: FloorReserveBreakdown;
  triggers: TechnicalTriggerSet;
  capacityBottleneck: CapacityBottleneckCode;
  primaryBottleneck: PrimaryBottleneckCode;
}

export type ScenarioConvergenceStatus = "CONVERGED" | "CYCLE_DETECTED" | "MAX_ITERATIONS";

export type PlacementClaimStatus =
  | "CANDIDATE_GEOMETRY_UNVERIFIED"
  | "CANDIDATE_ARCHITECTURAL_FIT_UNVERIFIED"
  | "PREPLAN_CAPACITY_CANDIDATE";

export interface ScenarioResult {
  id: ScenarioId;
  unitType: TargetUnitType;
  targetNetAreaM2: number;
  targetClosedGrossAreaM2: number;
  assumptionStatus: "HEURISTIC";
  convergenceStatus: ScenarioConvergenceStatus;
  finalUnitsPerFloor: number | null;
  finalTotalUnits: number | null;
  observedUnitCountRange: { minimum: number; maximum: number };
  areaAllocatableToUnitsM2: number | null;
  primaryBottleneck: PrimaryBottleneckCode | null;
  triggers: TechnicalTriggerSet | null;
  placementClaimStatus: PlacementClaimStatus;
  exactPlacementClaimed: false;
  iterations: readonly ScenarioIterationStep[];
}

export interface CalculationTrace {
  status: "CALCULATION";
  formula: string;
  inputFields: readonly string[];
  inputStatuses: readonly ProvenanceStatus[];
  sourceIds: readonly string[];
  ruleIds: readonly string[];
  approximate: boolean;
}

export interface LegalRightsResult {
  parcelAreaM2: number | null;
  taks: number | null;
  kaks: number | null;
  taksMaxM2: number | null;
  emsalMaxM2: number | null;
  effectiveFootprintLimitM2: number | null;
  manualGeometryCapacityM2: number | null;
  geometryStatus: "UNKNOWN" | "MANUAL_CAPACITY_PROVIDED";
  ruleIds: readonly string[];
  traces: {
    taksMax: CalculationTrace | null;
    emsalMax: CalculationTrace | null;
    effectiveFootprintLimit: CalculationTrace | null;
  };
}

export type AnalysisQaCode =
  | "THEORETICAL_ONLY"
  | "GEOMETRY_UNVERIFIED"
  | "ARCHITECTURAL_FIT_UNVERIFIED"
  | "LOCAL_RULES_UNCONFIRMED"
  | "PARKING_RULE_UNCONFIRMED"
  | "SCENARIOS_COLLAPSED"
  | "SCENARIO_NON_CONVERGENCE";

export type FeasibilityAnalysisStatus = "CALCULATED" | "PARTIAL" | "INSUFFICIENT_DATA";

export interface FeasibilityAnalysis {
  status: FeasibilityAnalysisStatus;
  versions: {
    analysisSchema: string;
    engine: string;
    ruleSnapshot: string;
    assumptionPolicy: string;
  };
  confidence: NormalizedRuhsatAnalysisInput["confidence"];
  legalRights: LegalRightsResult;
  scenarios: readonly ScenarioResult[];
  qa: readonly AnalysisQaCode[];
  exactPlacementClaimed: false;
}

export type EngineDiagnosticCode =
  | "INVALID_REQUEST"
  | "INVALID_NORMALIZED_INPUT"
  | "NORMALIZED_INPUT_VERSION_MISMATCH"
  | "INVALID_RULE_SNAPSHOT"
  | "RULE_SNAPSHOT_NOT_EXECUTABLE"
  | "RULE_SNAPSHOT_VERSION_MISMATCH"
  | "RULE_SNAPSHOT_CONTENT_MISMATCH"
  | "INVALID_ASSUMPTION_SET"
  | "INVALID_TECHNICAL_CAPACITY"
  | "MISSING_CRITICAL_INPUT"
  | "UNSUPPORTED_PERMIT_APPLICATION_DATE"
  | "UNSUPPORTED_USE_TYPE"
  | "MISSING_TARGET_UNIT_TYPE";

export interface EngineDiagnostic {
  code: EngineDiagnosticCode;
  field: string | null;
  message: string;
}

export type FeasibilityCalculationResult =
  | { ok: true; value: FeasibilityAnalysis; diagnostics: readonly EngineDiagnostic[] }
  | { ok: false; diagnostics: readonly EngineDiagnostic[] };

export interface TechnicalTriggerContext {
  floorCount: number;
  buildingHeightM: number | null;
  totalUnits: number;
  unitsPerFloor: number;
  unitType: TargetUnitType;
  projectUseType: NormalizedRuhsatAnalysisInput["project"]["useType"];
  basementIntent: NormalizedRuhsatAnalysisInput["program"]["basementIntent"];
  parcelAreaM2: number;
  roofProjectionAreaM2: number;
  estimatedTotalBuildingAreaM2: number;
  shelterPersonCapacity: number | null;
}

export interface CalculationCapacityContext {
  effectiveFootprintLimitM2: number;
  emsalMaxM2: number;
  floorCount: number;
  geometryStatus: LegalRightsResult["geometryStatus"];
  scenario: ScenarioDefinition;
  reserves: TechnicalReserveAssumptions;
  technicalCapacities: ManualTechnicalCapacities;
}

export interface RuleBoundCalculationContext {
  request: FeasibilityCalculationRequest;
  snapshot: RuleSnapshot;
}
