export {
  ANALYSIS_SCHEMA_VERSION,
  ASSUMPTION_POLICY_SNAPSHOT_VERSION,
  ENGINE_VERSION,
  RULE_SNAPSHOT_VERSION,
} from "./versions";

export { evaluateConfidence } from "./confidence";
export { calculateRuhsatFeasibility, calculateLegalRightsOnly } from "./engine";
export {
  calculateQuickFeasibility,
  calculateImpliedMinFloorPlates,
  calculateQuickTypologyMatrix,
  calculateReverseUnitSizing,
  type ComputationScope,
  type QuickFeasibilityRequest,
  type QuickFeasibilityResult,
  type QuickLegalRights,
  type QuickTriggerState,
  type Range,
  type ReverseFitClass,
  type ReverseSizingResult,
  type TypologyCardResult,
} from "./quick-feasibility";
export {
  buildQuickFeasibilityViewModel,
  type QuickFeasibilityViewModel,
  type NextBestInputItem,
} from "./view-model-builder";
export {
  TYPOLOGY_PROFILES,
  UNIT_TYPOLOGIES,
  COMFORT_BANDS,
  QUICK_RESERVE_ENVELOPE,
  type ComfortBand,
  type TypologyProfileBand,
  type UnitTypology,
  type UnitTypologyProfile,
} from "./typology-profiles";
export { createDefaultScenarioAssumptionSet } from "./default-assumptions";
export { SCENARIO_IDS } from "./engine-types";
export { evaluateTechnicalTriggers } from "./technical-triggers";
export {
  compareAtInternalPrecision,
  INTERNAL_DECIMAL_SCALE,
  parseLocalizedDecimal,
  roundToInternalPrecision,
} from "./number-parsing";
export { normalizeRuhsatAnalysisInput } from "./normalization";
export {
  CURRENT_RULE_SNAPSHOT,
  EXECUTABLE_RULE_VALUES,
  OFFICIAL_RULE_SOURCES,
  RULE_AUTHORITY_ORDER,
  RULE_SOURCE_CHECK_DATE,
} from "./rules";
export {
  BASEMENT_INTENTS,
  BUILDING_ORDERS,
  PROJECT_USE_TYPES,
  PROVENANCE_STATUSES,
  TARGET_UNIT_TYPES,
} from "./types";
export type {
  BasementIntent,
  BuildingOrder,
  ConfidenceAssessment,
  ConfidenceEvidence,
  ConfidenceLevel,
  DomainIssue,
  DomainIssueCode,
  DomainResult,
  DomainValue,
  KnownDomainValue,
  NormalizedRuhsatAnalysisInput,
  ProjectUseType,
  ProvenanceStatus,
  RawRuhsatAnalysisInput,
  RawSourcedNumericInput,
  TargetUnitType,
  UnknownDomainValue,
  ValueProvenance,
} from "./types";
export type {
  AnalysisQaCode,
  CapacityBottleneckCode,
  CalculationTrace,
  EngineDiagnostic,
  EngineDiagnosticCode,
  FeasibilityAnalysis,
  FeasibilityCalculationRequest,
  FeasibilityCalculationResult,
  FloorReserveBreakdown,
  LegalRightsResult,
  ManualTechnicalCapacities,
  PlacementClaimStatus,
  PrimaryBottleneckCode,
  ScenarioAssumptionSet,
  ScenarioConvergenceStatus,
  ScenarioDefinition,
  ScenarioId,
  ScenarioIterationStep,
  ScenarioResult,
  TechnicalCheckState,
  TechnicalReserveAssumptions,
  TechnicalTriggerContext,
  TechnicalTriggerSet,
} from "./engine-types";
export type {
  OfficialRuleSource,
  OfficialSourceCheckStatus,
  OfficialSourceKind,
  RuleRecord,
  RuleParameter,
  RuleSnapshot,
  RuleVerificationStatus,
} from "./rules";
