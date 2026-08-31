import type {
  AnalysisQaCode,
  CalculationTrace,
  CapacityBottleneckCode,
  EngineDiagnostic,
  FeasibilityAnalysis,
  FeasibilityCalculationRequest,
  FeasibilityCalculationResult,
  FloorReserveBreakdown,
  LegalRightsResult,
  PlacementClaimStatus,
  PrimaryBottleneckCode,
  ScenarioAssumptionSet,
  ScenarioDefinition,
  ScenarioIterationStep,
  ScenarioResult,
  TechnicalTriggerSet,
} from "./engine-types";
import { evaluateConfidence } from "./confidence";
import { roundToInternalPrecision } from "./number-parsing";
import { CURRENT_RULE_SNAPSHOT, type RuleSnapshot } from "./rules";
import { evaluateTechnicalTriggers } from "./technical-triggers";
import {
  BASEMENT_INTENTS,
  BUILDING_ORDERS,
  PROJECT_USE_TYPES,
  PROVENANCE_STATUSES,
  TARGET_UNIT_TYPES,
  type DomainValue,
  type NormalizedRuhsatAnalysisInput,
} from "./types";
import {
  ANALYSIS_SCHEMA_VERSION,
  ASSUMPTION_POLICY_SNAPSHOT_VERSION,
  ENGINE_VERSION,
  RULE_SNAPSHOT_VERSION,
} from "./versions";

interface CandidateState {
  unitsPerFloor: number;
  totalUnits: number;
}

interface CapacityEvaluation {
  candidate: CandidateState;
  areaAllocatableToUnitsM2: number;
  reserves: FloorReserveBreakdown;
  capacityBottleneck: CapacityBottleneckCode;
  primaryBottleneck: PrimaryBottleneckCode;
}

type UnknownRecord = Record<string, unknown>;

const SOURCE_REFERENCE_REQUIRED_STATUSES = new Set([
  "DOCUMENT",
  "CALCULATION",
  "MEASUREMENT",
  "HISTORICAL_RULE",
  "LOCAL_RULE",
  "GEOMETRY_CONFIRMATION",
  "ARCHITECTURAL_CONFIRMATION",
]);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isIsoDateOrNull(value: unknown): value is string | null {
  if (value === null) {
    return true;
  }
  if (typeof value !== "string") {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isEnumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  nullable = true
): value is T | null {
  return (nullable && value === null) || (typeof value === "string" && values.includes(value as T));
}

function isDomainNumber(value: unknown, predicate: (numberValue: number) => boolean): boolean {
  if (!isRecord(value)) {
    return false;
  }

  if (value.state === "unknown") {
    return (
      (value.reason === "MISSING" || value.reason === "INVALID") &&
      isNullableString(value.rawValue)
    );
  }

  if (
    value.state !== "known" ||
    typeof value.value !== "number" ||
    !Number.isFinite(value.value) ||
    !predicate(value.value) ||
    typeof value.rawValue !== "string" ||
    !isRecord(value.provenance) ||
    typeof value.provenance.status !== "string" ||
    !PROVENANCE_STATUSES.includes(value.provenance.status as (typeof PROVENANCE_STATUSES)[number]) ||
    !isNullableString(value.provenance.sourceId)
  ) {
    return false;
  }

  if (
    SOURCE_REFERENCE_REQUIRED_STATUSES.has(value.provenance.status) &&
    (typeof value.provenance.sourceId !== "string" || value.provenance.sourceId.trim() === "")
  ) {
    return false;
  }

  return value.provenance.note === undefined || isNullableString(value.provenance.note);
}

function sameStringArray(left: unknown, right: readonly string[]): boolean {
  return (
    Array.isArray(left) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function validateNormalizedInput(input: unknown): EngineDiagnostic[] {
  const diagnostics: EngineDiagnostic[] = [];

  if (!isRecord(input)) {
    return [{
      code: "INVALID_NORMALIZED_INPUT",
      field: "input",
      message: "Normalize analiz girdisi nesne biçiminde olmalıdır.",
    }];
  }

  if (input.schemaVersion !== ANALYSIS_SCHEMA_VERSION) {
    diagnostics.push({
      code: "NORMALIZED_INPUT_VERSION_MISMATCH",
      field: "input.schemaVersion",
      message: "Normalize girdi güncel analiz şeması sürümüyle eşleşmiyor.",
    });
  }

  const project = input.project;
  const parcel = input.parcel;
  const program = input.program;
  const evidence = input.evidence;
  const confidence = input.confidence;

  if (
    !isRecord(project) ||
    !isIsoDateOrNull(project.analysisDate) ||
    !isIsoDateOrNull(project.permitApplicationDate) ||
    !isNullableString(project.municipality) ||
    !isNullableString(project.district) ||
    !isEnumValue(project.useType, PROJECT_USE_TYPES)
  ) {
    diagnostics.push({
      code: "INVALID_NORMALIZED_INPUT",
      field: "input.project",
      message: "Normalize proje alanları geçersiz veya eksik.",
    });
  }

  if (
    !isRecord(parcel) ||
    !isDomainNumber(parcel.areaM2, (value) => value > 0) ||
    !isDomainNumber(parcel.taks, (value) => value > 0 && value <= 1) ||
    !isDomainNumber(parcel.kaks, (value) => value > 0) ||
    !isDomainNumber(parcel.maxFloorCount, (value) => Number.isInteger(value) && value >= 1) ||
    !isDomainNumber(parcel.maxHeightM, (value) => value > 0) ||
    !isEnumValue(parcel.buildingOrder, BUILDING_ORDERS) ||
    !isRecord(parcel.setbacks) ||
    !isDomainNumber(parcel.setbacks.frontM, (value) => value >= 0) ||
    !isDomainNumber(parcel.setbacks.sideLeftM, (value) => value >= 0) ||
    !isDomainNumber(parcel.setbacks.sideRightM, (value) => value >= 0) ||
    !isDomainNumber(parcel.setbacks.rearM, (value) => value >= 0) ||
    !isDomainNumber(parcel.manualGeometryCapacityM2, (value) => value > 0)
  ) {
    diagnostics.push({
      code: "INVALID_NORMALIZED_INPUT",
      field: "input.parcel",
      message: "Normalize parsel alanları geçersiz, sonlu değil veya izin verilen aralık dışında.",
    });
  }

  if (
    !isRecord(program) ||
    !isEnumValue(program.targetUnitType, TARGET_UNIT_TYPES) ||
    !isEnumValue(program.basementIntent, BASEMENT_INTENTS)
  ) {
    diagnostics.push({
      code: "INVALID_NORMALIZED_INPUT",
      field: "input.program",
      message: "Normalize program alanları tanımlı değer kümesiyle eşleşmiyor.",
    });
  }

  const evidenceKeys = [
    "hasReadableCurrentZoningDocument",
    "hasPlanNotes",
    "hasCoordinateParcel",
    "hasArchitecturalPreplan",
    "hasPermitCalculation",
    "hasDwg",
  ] as const;
  const evidenceIsValid =
    isRecord(evidence) && evidenceKeys.every((key) => typeof evidence[key] === "boolean");

  if (!evidenceIsValid) {
    diagnostics.push({
      code: "INVALID_NORMALIZED_INPUT",
      field: "input.evidence",
      message: "Kanıt zinciri yalnız boolean alanlardan oluşmalıdır.",
    });
  } else {
    const expectedConfidence = evaluateConfidence(
      evidence as unknown as NormalizedRuhsatAnalysisInput["evidence"]
    );
    if (
      !isRecord(confidence) ||
      confidence.level !== expectedConfidence.level ||
      confidence.reasonCode !== expectedConfidence.reasonCode ||
      !sameStringArray(confidence.missingForNextLevel, expectedConfidence.missingForNextLevel)
    ) {
      diagnostics.push({
        code: "INVALID_NORMALIZED_INPUT",
        field: "input.confidence",
        message: "Güven seviyesi normalize kanıt zinciriyle tutarlı değil.",
      });
    }
  }

  return diagnostics;
}

function hasAssumptionEnvelope(value: unknown): value is ScenarioAssumptionSet {
  if (!isRecord(value) || !Array.isArray(value.scenarios) || !isRecord(value.technicalReserves)) {
    return false;
  }

  const technicalReserves = value.technicalReserves;

  const numericScenarioKeys = [
    "targetNetAreaM2",
    "targetClosedGrossAreaM2",
    "baseCoreAreaM2",
    "otherCommonAreaM2",
    "floorTechnicalAreaM2",
    "circulationAreaPerUnitM2",
  ] as const;
  const numericReserveKeys = [
    "liftShaftReservationAreaM2",
    "primaryLiftAreaM2",
    "secondLiftAdditionalAreaM2",
    "fireReviewAreaM2",
  ] as const;

  return (
    typeof value.version === "string" &&
    typeof value.maxIterations === "number" &&
    value.scenarios.every(
      (scenario) =>
        isRecord(scenario) &&
        typeof scenario.id === "string" &&
        numericScenarioKeys.every((key) => typeof scenario[key] === "number")
    ) &&
    numericReserveKeys.every((key) => typeof technicalReserves[key] === "number")
  );
}

function hasTechnicalCapacityEnvelope(
  value: unknown
): value is FeasibilityCalculationRequest["technicalCapacities"] {
  return (
    isRecord(value) &&
    (value.shelterPersonCapacity === null || typeof value.shelterPersonCapacity === "number")
  );
}

function validateRequestEnvelope(request: unknown): EngineDiagnostic[] {
  if (!isRecord(request)) {
    return [{
      code: "INVALID_REQUEST",
      field: null,
      message: "Hesap isteği nesne biçiminde olmalıdır.",
    }];
  }

  const diagnostics = validateNormalizedInput(request.input);
  if (!hasAssumptionEnvelope(request.assumptions)) {
    diagnostics.push({
      code: "INVALID_REQUEST",
      field: "assumptions",
      message: "Varsayım setinin çalışma zamanı biçimi geçersiz.",
    });
  }
  if (!hasTechnicalCapacityEnvelope(request.technicalCapacities)) {
    diagnostics.push({
      code: "INVALID_REQUEST",
      field: "technicalCapacities",
      message: "Manuel teknik kapasite zarfı geçersiz.",
    });
  }

  return diagnostics;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

const CANONICAL_RULE_SNAPSHOT_SERIALIZATION = stableSerialize(CURRENT_RULE_SNAPSHOT);

function knownNumber(value: DomainValue<number>): number | null {
  return value.state === "known" ? value.value : null;
}

function calculationTrace(
  formula: string,
  inputs: readonly { field: string; value: DomainValue<number> }[],
  ruleIds: readonly string[],
  forceApproximate = false
): CalculationTrace | null {
  if (inputs.some((input) => input.value.state !== "known")) {
    return null;
  }

  const knownInputs = inputs.filter(
    (input): input is { field: string; value: Extract<DomainValue<number>, { state: "known" }> } =>
      input.value.state === "known"
  );
  const inputStatuses = knownInputs.map((input) => input.value.provenance.status);
  const sourceIds = Array.from(
    new Set(
      knownInputs
        .map((input) => input.value.provenance.sourceId)
        .filter((sourceId): sourceId is string => sourceId !== null)
    )
  );
  const approximateStatuses = new Set(["ASSUMPTION", "HEURISTIC", "REQUIRES_CONFIRMATION"]);

  return {
    status: "CALCULATION",
    formula,
    inputFields: knownInputs.map((input) => input.field),
    inputStatuses,
    sourceIds,
    ruleIds,
    approximate: forceApproximate || inputStatuses.some((status) => approximateStatuses.has(status)),
  };
}

export function calculateLegalRightsOnly(request: FeasibilityCalculationRequest): LegalRightsResult {
  return buildLegalRights(request);
}

function buildLegalRights(request: FeasibilityCalculationRequest): LegalRightsResult {
  const parcelAreaM2 = knownNumber(request.input.parcel.areaM2);
  const taks = knownNumber(request.input.parcel.taks);
  const kaks = knownNumber(request.input.parcel.kaks);
  const manualGeometryCapacityM2 = knownNumber(request.input.parcel.manualGeometryCapacityM2);
  const taksMaxM2 = parcelAreaM2 !== null && taks !== null
    ? roundToInternalPrecision(parcelAreaM2 * taks)
    : null;
  const emsalMaxM2 = parcelAreaM2 !== null && kaks !== null
    ? roundToInternalPrecision(parcelAreaM2 * kaks)
    : null;
  const effectiveFootprintLimitM2 = taksMaxM2 === null
    ? null
    : roundToInternalPrecision(
        manualGeometryCapacityM2 === null
          ? taksMaxM2
          : Math.min(taksMaxM2, manualGeometryCapacityM2)
      );
  const legalRuleIds = ["PAIY-TAKS-KAKS-THEORETICAL-LIMITS"];
  const taksInputs = [
    { field: "parcel.areaM2", value: request.input.parcel.areaM2 },
    { field: "parcel.taks", value: request.input.parcel.taks },
  ];
  const emsalInputs = [
    { field: "parcel.areaM2", value: request.input.parcel.areaM2 },
    { field: "parcel.kaks", value: request.input.parcel.kaks },
  ];
  const footprintInputs = manualGeometryCapacityM2 === null
    ? taksInputs
    : [
        ...taksInputs,
        {
          field: "parcel.manualGeometryCapacityM2",
          value: request.input.parcel.manualGeometryCapacityM2,
        },
      ];

  return {
    parcelAreaM2,
    taks,
    kaks,
    taksMaxM2,
    emsalMaxM2,
    effectiveFootprintLimitM2,
    manualGeometryCapacityM2,
    geometryStatus: manualGeometryCapacityM2 === null ? "UNKNOWN" : "MANUAL_CAPACITY_PROVIDED",
    ruleIds: legalRuleIds,
    traces: {
      taksMax: calculationTrace("PARCEL_AREA × TAKS", taksInputs, legalRuleIds),
      emsalMax: calculationTrace("PARCEL_AREA × KAKS", emsalInputs, legalRuleIds),
      effectiveFootprintLimit: calculationTrace(
        manualGeometryCapacityM2 === null
          ? "TAKS_MAX (geometri bilinmediği için yalnız yasal üst sınır)"
          : "min(TAKS_MAX, MANUAL_GEOMETRY_CAPACITY)",
        footprintInputs,
        legalRuleIds,
        manualGeometryCapacityM2 === null
      ),
    },
  };
}

function validateAssumptions(assumptions: ScenarioAssumptionSet): EngineDiagnostic[] {
  const diagnostics: EngineDiagnostic[] = [];
  const expectedIds = ["COMPACT_MAX_UNITS", "BALANCED", "COMFORT_FEWER_UNITS"];
  const ids = assumptions.scenarios.map((scenario) => scenario.id);
  const values = assumptions.scenarios.flatMap((scenario) => [
    scenario.targetNetAreaM2,
    scenario.targetClosedGrossAreaM2,
    scenario.baseCoreAreaM2,
    scenario.otherCommonAreaM2,
    scenario.floorTechnicalAreaM2,
    scenario.circulationAreaPerUnitM2,
  ]);
  const reserveValues = Object.values(assumptions.technicalReserves);
  const definitionsAreValid =
    assumptions.version === ASSUMPTION_POLICY_SNAPSHOT_VERSION &&
    Number.isInteger(assumptions.maxIterations) &&
    assumptions.maxIterations >= 1 &&
    assumptions.maxIterations <= 50 &&
    ids.length === expectedIds.length &&
    expectedIds.every((id, index) => ids[index] === id) &&
    values.every((value) => Number.isFinite(value) && value >= 0) &&
    reserveValues.every((value) => Number.isFinite(value) && value >= 0) &&
    assumptions.scenarios.every(
      (scenario) =>
        scenario.targetNetAreaM2 > 0 &&
        scenario.targetClosedGrossAreaM2 > scenario.targetNetAreaM2
    ) &&
    assumptions.scenarios[0].targetClosedGrossAreaM2 <
      assumptions.scenarios[1].targetClosedGrossAreaM2 &&
    assumptions.scenarios[1].targetClosedGrossAreaM2 <
      assumptions.scenarios[2].targetClosedGrossAreaM2;

  if (!definitionsAreValid) {
    diagnostics.push({
      code: "INVALID_ASSUMPTION_SET",
      field: "assumptions",
      message:
        "Varsayım seti; sürüm, senaryo sırası, pozitif alanlar veya kompakt < dengeli < konforlu hedef sırasını sağlamıyor.",
    });
  }

  return diagnostics;
}

function validateSnapshot(snapshot: unknown): EngineDiagnostic[] {
  const diagnostics: EngineDiagnostic[] = [];

  if (!isRecord(snapshot)) {
    return [{
      code: "INVALID_RULE_SNAPSHOT",
      field: "snapshot",
      message: "Rule snapshot nesne biçiminde olmalıdır.",
    }];
  }

  if (snapshot.id !== RULE_SNAPSHOT_VERSION) {
    diagnostics.push({
      code: "RULE_SNAPSHOT_VERSION_MISMATCH",
      field: "snapshot.id",
      message: "Hesap motoru farklı sürümde bir rule snapshot ile çalıştırılamaz.",
    });
  }

  if (snapshot.releaseStatus !== "EXECUTABLE") {
    diagnostics.push({
      code: "RULE_SNAPSHOT_NOT_EXECUTABLE",
      field: "snapshot.releaseStatus",
      message: "Yalnız kaynak indeksi olan snapshot hesap üretmek için kullanılamaz.",
    });
  }

  if (
    snapshot.id === RULE_SNAPSHOT_VERSION &&
    snapshot.releaseStatus === "EXECUTABLE" &&
    stableSerialize(snapshot) !== CANONICAL_RULE_SNAPSHOT_SERIALIZATION
  ) {
    diagnostics.push({
      code: "RULE_SNAPSHOT_CONTENT_MISMATCH",
      field: "snapshot",
      message: "Snapshot kimliği güncel olsa da içerik canonical rule snapshot ile eşleşmiyor.",
    });
  }

  return diagnostics;
}

function buildPlacementClaim(request: FeasibilityCalculationRequest, rights: LegalRightsResult): PlacementClaimStatus {
  if (rights.geometryStatus === "UNKNOWN") {
    return "CANDIDATE_GEOMETRY_UNVERIFIED";
  }

  if (!request.input.evidence.hasArchitecturalPreplan) {
    return "CANDIDATE_ARCHITECTURAL_FIT_UNVERIFIED";
  }

  return "PREPLAN_CAPACITY_CANDIDATE";
}

function buildReserveBreakdown(
  scenario: ScenarioDefinition,
  assumptions: ScenarioAssumptionSet,
  triggers: TechnicalTriggerSet,
  unitsPerFloor: number
): FloorReserveBreakdown {
  let liftAreaM2 = 0;

  if (triggers.lift.shaftReservationRequired && triggers.lift.requiredLiftCount === 0) {
    liftAreaM2 = assumptions.technicalReserves.liftShaftReservationAreaM2;
  } else if (triggers.lift.requiredLiftCount === 1) {
    liftAreaM2 = assumptions.technicalReserves.primaryLiftAreaM2;
  } else if (triggers.lift.requiredLiftCount === 2) {
    liftAreaM2 =
      assumptions.technicalReserves.primaryLiftAreaM2 +
      assumptions.technicalReserves.secondLiftAdditionalAreaM2;
  }

  const fireReviewAreaM2 = triggers.fire.heightGateReached
    ? assumptions.technicalReserves.fireReviewAreaM2
    : 0;
  const circulationAreaM2 = scenario.circulationAreaPerUnitM2 * unitsPerFloor;
  const totalReservedAreaM2 =
    scenario.baseCoreAreaM2 +
    scenario.otherCommonAreaM2 +
    scenario.floorTechnicalAreaM2 +
    circulationAreaM2 +
    liftAreaM2 +
    fireReviewAreaM2;

  return {
    baseCoreAreaM2: roundToInternalPrecision(scenario.baseCoreAreaM2),
    otherCommonAreaM2: roundToInternalPrecision(scenario.otherCommonAreaM2),
    floorTechnicalAreaM2: roundToInternalPrecision(scenario.floorTechnicalAreaM2),
    circulationAreaM2: roundToInternalPrecision(circulationAreaM2),
    liftAreaM2: roundToInternalPrecision(liftAreaM2),
    fireReviewAreaM2: roundToInternalPrecision(fireReviewAreaM2),
    totalReservedAreaM2: roundToInternalPrecision(totalReservedAreaM2),
  };
}

function evaluateCapacity(
  request: FeasibilityCalculationRequest,
  rights: LegalRightsResult,
  floorCount: number,
  scenario: ScenarioDefinition,
  state: CandidateState,
  triggers: TechnicalTriggerSet
): CapacityEvaluation {
  const effectiveFootprintLimitM2 = rights.effectiveFootprintLimitM2 ?? 0;
  const emsalMaxM2 = rights.emsalMaxM2 ?? 0;
  const reserves = buildReserveBreakdown(scenario, request.assumptions, triggers, state.unitsPerFloor);
  const areaAllocatableToUnitsM2 = roundToInternalPrecision(
    Math.max(0, effectiveFootprintLimitM2 - reserves.totalReservedAreaM2)
  );
  const unitsPerFloor = Math.max(
    0,
    Math.floor(areaAllocatableToUnitsM2 / scenario.targetClosedGrossAreaM2)
  );
  const emsalUnitCapacity = Math.max(
    0,
    Math.floor(emsalMaxM2 / scenario.targetClosedGrossAreaM2)
  );
  const totalUnits = Math.min(unitsPerFloor * floorCount, emsalUnitCapacity);
  const rawFootprintUnitsPerFloor = Math.max(
    0,
    Math.floor(effectiveFootprintLimitM2 / scenario.targetClosedGrossAreaM2)
  );
  const footprintLimitedTotal = unitsPerFloor * floorCount;
  let capacityBottleneck: CapacityBottleneckCode;

  if (emsalUnitCapacity < footprintLimitedTotal) {
    capacityBottleneck = "EMSAL";
  } else if (unitsPerFloor < rawFootprintUnitsPerFloor) {
    capacityBottleneck = reserves.fireReviewAreaM2 > 0
      ? "FIRE"
      : reserves.liftAreaM2 > 0
        ? "LIFT"
        : "CORE";
  } else if (
    rights.geometryStatus === "MANUAL_CAPACITY_PROVIDED" &&
    rights.manualGeometryCapacityM2 !== null &&
    rights.taksMaxM2 !== null &&
    rights.manualGeometryCapacityM2 < rights.taksMaxM2
  ) {
    capacityBottleneck = "GEOMETRY";
  } else {
    capacityBottleneck = "TAKS";
  }

  const primaryBottleneck: PrimaryBottleneckCode =
    triggers.shelter.capacityState === "INSUFFICIENT"
      ? "SHELTER"
      : rights.geometryStatus === "UNKNOWN"
        ? "GEOMETRY"
        : capacityBottleneck;

  return {
    candidate: { unitsPerFloor, totalUnits },
    areaAllocatableToUnitsM2,
    reserves,
    capacityBottleneck,
    primaryBottleneck,
  };
}

function buildTriggerContext(
  request: FeasibilityCalculationRequest,
  rights: LegalRightsResult,
  floorCount: number,
  buildingHeightM: number | null,
  unitType: Exclude<FeasibilityCalculationRequest["input"]["program"]["targetUnitType"], null>,
  state: CandidateState
) {
  const footprint = rights.effectiveFootprintLimitM2 ?? 0;

  return {
    floorCount,
    buildingHeightM,
    totalUnits: state.totalUnits,
    unitsPerFloor: state.unitsPerFloor,
    unitType,
    projectUseType: request.input.project.useType,
    basementIntent: request.input.program.basementIntent,
    parcelAreaM2: rights.parcelAreaM2 ?? 0,
    roofProjectionAreaM2: footprint,
    estimatedTotalBuildingAreaM2: roundToInternalPrecision(footprint * floorCount),
    shelterPersonCapacity: request.technicalCapacities.shelterPersonCapacity,
  };
}

function scenarioStateSignature(
  state: CandidateState,
  triggers: TechnicalTriggerSet,
  primaryBottleneck: PrimaryBottleneckCode
): string {
  return JSON.stringify([
    state.unitsPerFloor,
    state.totalUnits,
    triggers.lift.requiredLiftCount,
    triggers.lift.shaftReservationRequired,
    triggers.shelter.state,
    triggers.shelter.capacityState,
    triggers.fire.heightGateReached,
    primaryBottleneck,
  ]);
}

function calculateScenario(
  request: FeasibilityCalculationRequest,
  rights: LegalRightsResult,
  floorCount: number,
  buildingHeightM: number | null,
  scenario: ScenarioDefinition,
  unitType: Exclude<FeasibilityCalculationRequest["input"]["program"]["targetUnitType"], null>
): ScenarioResult {
  const placementClaimStatus = buildPlacementClaim(request, rights);
  const seed: CandidateState = { unitsPerFloor: 1, totalUnits: Math.max(2, floorCount) };
  const seedTriggers = evaluateTechnicalTriggers(
    buildTriggerContext(request, rights, floorCount, buildingHeightM, unitType, seed)
  );
  let current = evaluateCapacity(request, rights, floorCount, scenario, seed, seedTriggers).candidate;
  const history: ScenarioIterationStep[] = [];
  const seen = new Set<string>();
  const observedCounts = [current.totalUnits];

  for (let iteration = 1; iteration <= request.assumptions.maxIterations; iteration += 1) {
    const triggers = evaluateTechnicalTriggers(
      buildTriggerContext(request, rights, floorCount, buildingHeightM, unitType, current)
    );
    const capacity = evaluateCapacity(request, rights, floorCount, scenario, current, triggers);
    const signature = scenarioStateSignature(current, triggers, capacity.primaryBottleneck);

    if (seen.has(signature)) {
      return {
        id: scenario.id,
        unitType,
        targetNetAreaM2: scenario.targetNetAreaM2,
        targetClosedGrossAreaM2: scenario.targetClosedGrossAreaM2,
        assumptionStatus: "HEURISTIC",
        convergenceStatus: "CYCLE_DETECTED",
        finalUnitsPerFloor: null,
        finalTotalUnits: null,
        observedUnitCountRange: {
          minimum: Math.min(...observedCounts),
          maximum: Math.max(...observedCounts),
        },
        areaAllocatableToUnitsM2: null,
        primaryBottleneck: null,
        triggers: null,
        placementClaimStatus,
        exactPlacementClaimed: false,
        iterations: history,
      };
    }

    seen.add(signature);
    observedCounts.push(capacity.candidate.totalUnits);
    history.push({
      iteration,
      inputUnitsPerFloor: current.unitsPerFloor,
      inputTotalUnits: current.totalUnits,
      outputUnitsPerFloor: capacity.candidate.unitsPerFloor,
      outputTotalUnits: capacity.candidate.totalUnits,
      areaAllocatableToUnitsM2: capacity.areaAllocatableToUnitsM2,
      reserves: capacity.reserves,
      triggers,
      capacityBottleneck: capacity.capacityBottleneck,
      primaryBottleneck: capacity.primaryBottleneck,
    });

    if (
      capacity.candidate.unitsPerFloor === current.unitsPerFloor &&
      capacity.candidate.totalUnits === current.totalUnits
    ) {
      return {
        id: scenario.id,
        unitType,
        targetNetAreaM2: scenario.targetNetAreaM2,
        targetClosedGrossAreaM2: scenario.targetClosedGrossAreaM2,
        assumptionStatus: "HEURISTIC",
        convergenceStatus: "CONVERGED",
        finalUnitsPerFloor: current.unitsPerFloor,
        finalTotalUnits: current.totalUnits,
        observedUnitCountRange: {
          minimum: Math.min(...observedCounts),
          maximum: Math.max(...observedCounts),
        },
        areaAllocatableToUnitsM2: capacity.areaAllocatableToUnitsM2,
        primaryBottleneck: capacity.primaryBottleneck,
        triggers,
        placementClaimStatus,
        exactPlacementClaimed: false,
        iterations: history,
      };
    }

    current = capacity.candidate;
  }

  return {
    id: scenario.id,
    unitType,
    targetNetAreaM2: scenario.targetNetAreaM2,
    targetClosedGrossAreaM2: scenario.targetClosedGrossAreaM2,
    assumptionStatus: "HEURISTIC",
    convergenceStatus: "MAX_ITERATIONS",
    finalUnitsPerFloor: null,
    finalTotalUnits: null,
    observedUnitCountRange: {
      minimum: Math.min(...observedCounts),
      maximum: Math.max(...observedCounts),
    },
    areaAllocatableToUnitsM2: null,
    primaryBottleneck: null,
    triggers: null,
    placementClaimStatus,
    exactPlacementClaimed: false,
    iterations: history,
  };
}

function baseQa(request: FeasibilityCalculationRequest, rights: LegalRightsResult): AnalysisQaCode[] {
  const qa: AnalysisQaCode[] = ["LOCAL_RULES_UNCONFIRMED", "PARKING_RULE_UNCONFIRMED"];

  if (request.input.confidence.level === "BELOW_A") {
    qa.push("THEORETICAL_ONLY");
  }
  if (rights.geometryStatus === "UNKNOWN") {
    qa.push("GEOMETRY_UNVERIFIED");
  }
  if (!request.input.evidence.hasArchitecturalPreplan) {
    qa.push("ARCHITECTURAL_FIT_UNVERIFIED");
  }

  return qa;
}

function buildAnalysis(
  request: FeasibilityCalculationRequest,
  rights: LegalRightsResult,
  status: FeasibilityAnalysis["status"],
  scenarios: readonly ScenarioResult[],
  qa: readonly AnalysisQaCode[]
): FeasibilityAnalysis {
  return {
    status,
    versions: {
      analysisSchema: ANALYSIS_SCHEMA_VERSION,
      engine: ENGINE_VERSION,
      ruleSnapshot: RULE_SNAPSHOT_VERSION,
      assumptionPolicy: ASSUMPTION_POLICY_SNAPSHOT_VERSION,
    },
    confidence: request.input.confidence,
    legalRights: rights,
    scenarios,
    qa,
    exactPlacementClaimed: false,
  };
}

export function calculateRuhsatFeasibility(
  request: FeasibilityCalculationRequest,
  snapshot: RuleSnapshot
): FeasibilityCalculationResult {
  const envelopeDiagnostics = validateRequestEnvelope(request);
  const snapshotDiagnostics = validateSnapshot(snapshot);
  if (envelopeDiagnostics.length > 0 || snapshotDiagnostics.length > 0) {
    return { ok: false, diagnostics: [...envelopeDiagnostics, ...snapshotDiagnostics] };
  }

  const fatalDiagnostics = [
    ...validateAssumptions(request.assumptions),
  ];

  if (
    request.technicalCapacities.shelterPersonCapacity !== null &&
    (!Number.isInteger(request.technicalCapacities.shelterPersonCapacity) ||
      request.technicalCapacities.shelterPersonCapacity < 0)
  ) {
    fatalDiagnostics.push({
      code: "INVALID_TECHNICAL_CAPACITY",
      field: "technicalCapacities.shelterPersonCapacity",
      message: "Manuel sığınak kişi kapasitesi negatif olmayan tam sayı olmalıdır.",
    });
  }

  if (fatalDiagnostics.length > 0) {
    return { ok: false, diagnostics: fatalDiagnostics };
  }

  const rights = buildLegalRights(request);
  const diagnostics: EngineDiagnostic[] = [];
  const floorCount = knownNumber(request.input.parcel.maxFloorCount);
  const buildingHeightM = knownNumber(request.input.parcel.maxHeightM);
  const targetUnitType = request.input.program.targetUnitType;
  const permitApplicationDate = request.input.project.permitApplicationDate;

  for (const [field, value] of [
    ["parcel.areaM2", rights.parcelAreaM2],
    ["parcel.taks", rights.taks],
    ["parcel.kaks", rights.kaks],
    ["parcel.maxFloorCount", floorCount],
  ] as const) {
    if (value === null) {
      diagnostics.push({
        code: "MISSING_CRITICAL_INPUT",
        field,
        message: "Senaryo hesabı için kritik sayısal girdi eksik.",
      });
    }
  }

  if (!permitApplicationDate) {
    diagnostics.push({
      code: "MISSING_CRITICAL_INPUT",
      field: "project.permitApplicationDate",
      message: "Rule snapshot seçimi için ruhsat başvuru tarihi gerekli.",
    });
  } else if (permitApplicationDate < snapshot.supportedPermitApplicationFrom) {
    diagnostics.push({
      code: "UNSUPPORTED_PERMIT_APPLICATION_DATE",
      field: "project.permitApplicationDate",
      message: `Bu snapshot yalnız ${snapshot.supportedPermitApplicationFrom} ve sonrası başvuruları destekler.`,
    });
  }

  if (request.input.project.useType !== "RESIDENTIAL") {
    diagnostics.push({
      code: "UNSUPPORTED_USE_TYPE",
      field: "project.useType",
      message: "Aşama 3 yürütülebilir senaryo motoru yalnız konut kullanımı için açılmıştır.",
    });
  }

  if (!targetUnitType) {
    diagnostics.push({
      code: "MISSING_TARGET_UNIT_TYPE",
      field: "program.targetUnitType",
      message: "Üç senaryoyu değerlendirmek için hedef bağımsız bölüm tipi gerekli.",
    });
  }

  const qa = baseQa(request, rights);
  if (diagnostics.length > 0 || floorCount === null || targetUnitType === null) {
    return {
      ok: true,
      value: buildAnalysis(request, rights, "INSUFFICIENT_DATA", [], qa),
      diagnostics,
    };
  }

  const scenarios = request.assumptions.scenarios.map((scenario) =>
    calculateScenario(request, rights, floorCount, buildingHeightM, scenario, targetUnitType)
  );
  const convergedCounts = scenarios
    .map((scenario) => scenario.finalTotalUnits)
    .filter((value): value is number => value !== null);

  if (scenarios.some((scenario) => scenario.convergenceStatus !== "CONVERGED")) {
    qa.push("SCENARIO_NON_CONVERGENCE");
  }
  if (convergedCounts.length === scenarios.length && new Set(convergedCounts).size < scenarios.length) {
    qa.push("SCENARIOS_COLLAPSED");
  }

  return {
    ok: true,
    value: buildAnalysis(
      request,
      rights,
      scenarios.every((scenario) => scenario.convergenceStatus === "CONVERGED")
        ? "CALCULATED"
        : "PARTIAL",
      scenarios,
      qa
    ),
    diagnostics,
  };
}
