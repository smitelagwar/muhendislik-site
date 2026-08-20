import assert from "node:assert/strict";
import {
  ASSUMPTION_POLICY_SNAPSHOT_VERSION,
  CURRENT_RULE_SNAPSHOT,
  ENGINE_VERSION,
  calculateRuhsatFeasibility,
  evaluateTechnicalTriggers,
  normalizeRuhsatAnalysisInput,
  type ConfidenceEvidence,
  type FeasibilityCalculationRequest,
  type NormalizedRuhsatAnalysisInput,
  type RawRuhsatAnalysisInput,
  type RawSourcedNumericInput,
  type ScenarioAssumptionSet,
  type TechnicalTriggerContext,
} from "../src/lib/calculations/modules/ruhsat-on-fizibilite";

function documentedNumber(rawValue: string | null): RawSourcedNumericInput {
  if (rawValue === null) {
    return { rawValue: null, provenance: null };
  }

  return {
    rawValue,
    provenance: {
      status: "DOCUMENT",
      sourceId: "synthetic-current-rule-fixture",
    },
  };
}

const levelBEvidence: ConfidenceEvidence = {
  hasReadableCurrentZoningDocument: true,
  hasPlanNotes: true,
  hasCoordinateParcel: true,
  hasArchitecturalPreplan: false,
  hasPermitCalculation: false,
  hasDwg: false,
};

interface InputOverrides {
  parcelAreaM2?: string | null;
  taks?: string | null;
  kaks?: string | null;
  floorCount?: string | null;
  heightM?: string | null;
  geometryCapacityM2?: string | null;
  permitApplicationDate?: string | null;
  useType?: RawRuhsatAnalysisInput["project"]["useType"];
  targetUnitType?: RawRuhsatAnalysisInput["program"]["targetUnitType"];
  evidence?: ConfidenceEvidence;
}

function normalizedInput(overrides: InputOverrides = {}): NormalizedRuhsatAnalysisInput {
  const raw: RawRuhsatAnalysisInput = {
    project: {
      analysisDate: "2026-08-20",
      permitApplicationDate: overrides.permitApplicationDate ?? "2026-07-15",
      municipality: "Test Belediyesi",
      district: "Test İlçesi",
      useType: overrides.useType === undefined ? "RESIDENTIAL" : overrides.useType,
    },
    parcel: {
      areaM2: documentedNumber(overrides.parcelAreaM2 === undefined ? "1000" : overrides.parcelAreaM2),
      taks: documentedNumber(overrides.taks === undefined ? "0,40" : overrides.taks),
      kaks: documentedNumber(overrides.kaks === undefined ? "1,50" : overrides.kaks),
      maxFloorCount: documentedNumber(overrides.floorCount === undefined ? "5" : overrides.floorCount),
      maxHeightM: documentedNumber(overrides.heightM === undefined ? "18" : overrides.heightM),
      buildingOrder: "DETACHED",
      setbacks: {
        frontM: documentedNumber("5"),
        sideLeftM: documentedNumber("3"),
        sideRightM: documentedNumber("3"),
        rearM: documentedNumber("3"),
      },
      manualGeometryCapacityM2: documentedNumber(
        overrides.geometryCapacityM2 === undefined ? "350" : overrides.geometryCapacityM2
      ),
    },
    program: {
      targetUnitType: overrides.targetUnitType === undefined ? "2+1" : overrides.targetUnitType,
      basementIntent: "NONE",
    },
    evidence: overrides.evidence ?? levelBEvidence,
  };
  const result = normalizeRuhsatAnalysisInput(raw);
  assert.equal(result.ok, true, "Sentetik motor girdisi normalize edilebilmeli");
  if (!result.ok) {
    throw new Error("Sentetik motor girdisi normalize edilemedi");
  }
  return result.value;
}

function assumptionSet(
  options: { maxIterations?: number; secondLiftAdditionalAreaM2?: number } = {}
): ScenarioAssumptionSet {
  return {
    version: ASSUMPTION_POLICY_SNAPSHOT_VERSION,
    maxIterations: options.maxIterations ?? 10,
    scenarios: [
      {
        id: "COMPACT_MAX_UNITS",
        targetNetAreaM2: 55,
        targetClosedGrossAreaM2: 70,
        baseCoreAreaM2: 20,
        otherCommonAreaM2: 8,
        floorTechnicalAreaM2: 4,
        circulationAreaPerUnitM2: 1,
      },
      {
        id: "BALANCED",
        targetNetAreaM2: 70,
        targetClosedGrossAreaM2: 90,
        baseCoreAreaM2: 22,
        otherCommonAreaM2: 9,
        floorTechnicalAreaM2: 4,
        circulationAreaPerUnitM2: 1.2,
      },
      {
        id: "COMFORT_FEWER_UNITS",
        targetNetAreaM2: 92,
        targetClosedGrossAreaM2: 120,
        baseCoreAreaM2: 24,
        otherCommonAreaM2: 10,
        floorTechnicalAreaM2: 5,
        circulationAreaPerUnitM2: 1.4,
      },
    ],
    technicalReserves: {
      liftShaftReservationAreaM2: 6,
      primaryLiftAreaM2: 8,
      secondLiftAdditionalAreaM2: options.secondLiftAdditionalAreaM2 ?? 8,
      fireReviewAreaM2: 12,
    },
  };
}

function request(
  input: NormalizedRuhsatAnalysisInput,
  assumptions = assumptionSet(),
  shelterPersonCapacity: number | null = 200
): FeasibilityCalculationRequest {
  return {
    input,
    assumptions,
    technicalCapacities: { shelterPersonCapacity },
  };
}

function triggerContext(overrides: Partial<TechnicalTriggerContext> = {}): TechnicalTriggerContext {
  return {
    floorCount: 4,
    buildingHeightM: 18,
    totalUnits: 8,
    unitsPerFloor: 2,
    unitType: "2+1",
    projectUseType: "RESIDENTIAL",
    basementIntent: "NONE",
    parcelAreaM2: 1_000,
    roofProjectionAreaM2: 400,
    estimatedTotalBuildingAreaM2: 1_600,
    shelterPersonCapacity: null,
    ...overrides,
  };
}

// Asansör: eşik altı / tam eşik / üst eşik.
assert.equal(evaluateTechnicalTriggers(triggerContext({ floorCount: 2 })).lift.requiredLiftCount, 0);
assert.equal(
  evaluateTechnicalTriggers(triggerContext({ floorCount: 3 })).lift.shaftReservationRequired,
  true
);
assert.equal(evaluateTechnicalTriggers(triggerContext({ floorCount: 4 })).lift.requiredLiftCount, 1);
assert.equal(evaluateTechnicalTriggers(triggerContext({ floorCount: 10 })).lift.requiredLiftCount, 2);
assert.equal(
  evaluateTechnicalTriggers(triggerContext({ totalUnits: 25, unitsPerFloor: 5 })).lift.requiredLiftCount,
  1,
  "Zemin üzerindeki 20 BB tam eşikte ikinci asansörü tetiklememeli"
);
assert.equal(
  evaluateTechnicalTriggers(triggerContext({ totalUnits: 26, unitsPerFloor: 5 })).lift.requiredLiftCount,
  2,
  "Zemin üzerindeki 20 BB aşıldığında ikinci asansör kontrolü açılmalı"
);

// Sığınak, yangın, nSEB ve yağmur suyu eşikleri.
assert.equal(evaluateTechnicalTriggers(triggerContext({ totalUnits: 9 })).shelter.state, "NOT_TRIGGERED");
const shelterAtThreshold = evaluateTechnicalTriggers(
  triggerContext({ totalUnits: 10, unitsPerFloor: 2, shelterPersonCapacity: 30 })
).shelter;
assert.equal(shelterAtThreshold.state, "CHECK_REQUIRED");
assert.equal(shelterAtThreshold.estimatedPersonEquivalent, 30);
assert.equal(shelterAtThreshold.capacityState, "SUFFICIENT");
assert.equal(
  evaluateTechnicalTriggers(triggerContext({ buildingHeightM: 21.499999 })).fire.heightGateReached,
  false
);
assert.equal(
  evaluateTechnicalTriggers(triggerContext({ buildingHeightM: 21.5 })).fire.heightGateReached,
  true
);
assert.equal(
  evaluateTechnicalTriggers(triggerContext({ estimatedTotalBuildingAreaM2: 1_999.999999 })).nseb.state,
  "NOT_TRIGGERED"
);
assert.equal(
  evaluateTechnicalTriggers(triggerContext({ estimatedTotalBuildingAreaM2: 2_000 })).nseb.state,
  "CHECK_REQUIRED"
);
assert.equal(
  evaluateTechnicalTriggers(triggerContext({ parcelAreaM2: 2_000, roofProjectionAreaM2: 1_000 })).rainWater.state,
  "NOT_TRIGGERED"
);
assert.equal(
  evaluateTechnicalTriggers(triggerContext({ parcelAreaM2: 2_000.000001 })).rainWater.state,
  "REQUIRES_CONFIRMATION"
);

const stableRequest = request(normalizedInput());
const stableResult = calculateRuhsatFeasibility(stableRequest, CURRENT_RULE_SNAPSHOT);
assert.equal(stableResult.ok, true);
if (!stableResult.ok) {
  throw new Error("Kararlı sentetik analiz hesaplanamadı");
}
assert.equal(stableResult.value.status, "CALCULATED");
assert.equal(stableResult.value.legalRights.taksMaxM2, 400);
assert.equal(stableResult.value.legalRights.emsalMaxM2, 1_500);
assert.equal(stableResult.value.legalRights.effectiveFootprintLimitM2, 350);
assert.equal(stableResult.value.legalRights.traces.taksMax?.status, "CALCULATION");
assert.deepEqual(stableResult.value.legalRights.traces.taksMax?.sourceIds, [
  "synthetic-current-rule-fixture",
]);
assert.equal(stableResult.value.legalRights.traces.effectiveFootprintLimit?.approximate, false);
assert.equal(stableResult.value.versions.engine, ENGINE_VERSION);
assert.equal(stableResult.value.scenarios.length, 3);
assert.deepEqual(
  stableResult.value.scenarios.map((scenario) => scenario.finalTotalUnits),
  [20, 15, 10],
  "Üç senaryo aynı hesabın farklı etiketi olmamalı"
);
assert(stableResult.value.scenarios.every((scenario) => scenario.convergenceStatus === "CONVERGED"));
assert(stableResult.value.scenarios.every((scenario) => scenario.exactPlacementClaimed === false));
assert(stableResult.value.scenarios.every((scenario) => scenario.assumptionStatus === "HEURISTIC"));
assert.deepEqual(
  calculateRuhsatFeasibility(stableRequest, CURRENT_RULE_SNAPSHOT),
  stableResult,
  "Aynı normalize input + snapshot + assumption set aynı sonucu üretmeli"
);

const geometryUnknownResult = calculateRuhsatFeasibility(
  request(normalizedInput({ geometryCapacityM2: null })),
  CURRENT_RULE_SNAPSHOT
);
assert.equal(geometryUnknownResult.ok, true);
if (geometryUnknownResult.ok) {
  assert(geometryUnknownResult.value.qa.includes("GEOMETRY_UNVERIFIED"));
  assert(
    geometryUnknownResult.value.scenarios.every(
      (scenario) => scenario.placementClaimStatus === "CANDIDATE_GEOMETRY_UNVERIFIED"
    )
  );
  assert.equal(geometryUnknownResult.value.exactPlacementClaimed, false);
  assert.equal(
    geometryUnknownResult.value.legalRights.traces.effectiveFootprintLimit?.approximate,
    true
  );
}

const shelterBottleneckResult = calculateRuhsatFeasibility(
  request(normalizedInput(), assumptionSet(), 0),
  CURRENT_RULE_SNAPSHOT
);
assert.equal(shelterBottleneckResult.ok, true);
if (shelterBottleneckResult.ok) {
  assert.equal(shelterBottleneckResult.value.scenarios[0].primaryBottleneck, "SHELTER");
}

const feedbackResult = calculateRuhsatFeasibility(
  request(
    normalizedInput({ parcelAreaM2: "1000", taks: "0,50", kaks: "3", floorCount: "6", geometryCapacityM2: "500" }),
    assumptionSet({ secondLiftAdditionalAreaM2: 60 })
  ),
  CURRENT_RULE_SNAPSHOT
);
assert.equal(feedbackResult.ok, true);
if (feedbackResult.ok) {
  const compact = feedbackResult.value.scenarios[0];
  assert.equal(compact.convergenceStatus, "CONVERGED");
  assert(compact.iterations.length >= 2);
  assert.equal(compact.iterations[0].inputTotalUnits, 36);
  assert.equal(compact.iterations[0].triggers.lift.requiredLiftCount, 2);
  assert.equal(compact.iterations[0].outputTotalUnits, 30);
  assert.equal(compact.finalTotalUnits, 30);
}

const cycleResult = calculateRuhsatFeasibility(
  request(
    normalizedInput({ parcelAreaM2: "1000", taks: "0,465", kaks: "3", floorCount: "5", geometryCapacityM2: "465" }),
    assumptionSet({ secondLiftAdditionalAreaM2: 60 })
  ),
  CURRENT_RULE_SNAPSHOT
);
assert.equal(cycleResult.ok, true);
if (cycleResult.ok) {
  const compact = cycleResult.value.scenarios[0];
  assert.equal(compact.convergenceStatus, "CYCLE_DETECTED");
  assert.equal(compact.finalTotalUnits, null, "Cycle durumunda keyfî son iterasyon sonuç olmamalı");
  assert(compact.observedUnitCountRange.minimum < compact.observedUnitCountRange.maximum);
  assert(cycleResult.value.qa.includes("SCENARIO_NON_CONVERGENCE"));
}

const maxIterationResult = calculateRuhsatFeasibility(
  request(
    normalizedInput({ parcelAreaM2: "1000", taks: "0,50", kaks: "3", floorCount: "6", geometryCapacityM2: "500" }),
    assumptionSet({ maxIterations: 1, secondLiftAdditionalAreaM2: 60 })
  ),
  CURRENT_RULE_SNAPSHOT
);
assert.equal(maxIterationResult.ok, true);
if (maxIterationResult.ok) {
  assert.equal(maxIterationResult.value.scenarios[0].convergenceStatus, "MAX_ITERATIONS");
  assert.equal(maxIterationResult.value.scenarios[0].finalTotalUnits, null);
}

const insufficientResult = calculateRuhsatFeasibility(
  request(normalizedInput({ parcelAreaM2: null })),
  CURRENT_RULE_SNAPSHOT
);
assert.equal(insufficientResult.ok, true);
if (insufficientResult.ok) {
  assert.equal(insufficientResult.value.status, "INSUFFICIENT_DATA");
  assert.equal(insufficientResult.value.legalRights.taksMaxM2, null);
  assert.equal(insufficientResult.value.scenarios.length, 0);
  assert(insufficientResult.diagnostics.some((diagnostic) => diagnostic.code === "MISSING_CRITICAL_INPUT"));
}

const historicalDateResult = calculateRuhsatFeasibility(
  request(normalizedInput({ permitApplicationDate: "2026-06-30" })),
  CURRENT_RULE_SNAPSHOT
);
assert.equal(historicalDateResult.ok, true);
if (historicalDateResult.ok) {
  assert.equal(historicalDateResult.value.status, "INSUFFICIENT_DATA");
  assert(
    historicalDateResult.diagnostics.some(
      (diagnostic) => diagnostic.code === "UNSUPPORTED_PERMIT_APPLICATION_DATE"
    )
  );
}

const nonExecutableSnapshot = {
  ...CURRENT_RULE_SNAPSHOT,
  releaseStatus: "SOURCE_INDEX_ONLY" as const,
};
const nonExecutableResult = calculateRuhsatFeasibility(stableRequest, nonExecutableSnapshot);
assert.equal(nonExecutableResult.ok, false);
assert(
  nonExecutableResult.diagnostics.some(
    (diagnostic) => diagnostic.code === "RULE_SNAPSHOT_NOT_EXECUTABLE"
  )
);

const invalidAssumptions = assumptionSet();
invalidAssumptions.scenarios[0].targetClosedGrossAreaM2 = 100;
const invalidAssumptionResult = calculateRuhsatFeasibility(
  request(normalizedInput(), invalidAssumptions),
  CURRENT_RULE_SNAPSHOT
);
assert.equal(invalidAssumptionResult.ok, false);
assert(
  invalidAssumptionResult.diagnostics.some(
    (diagnostic) => diagnostic.code === "INVALID_ASSUMPTION_SET"
  )
);

console.log("Ruhsat ön fizibilite Aşama 3 motor doğrulamaları başarılı.");
