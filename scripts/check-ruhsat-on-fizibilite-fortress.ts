import assert from "node:assert/strict";
import {
  ANALYSIS_SCHEMA_VERSION,
  ASSUMPTION_POLICY_SNAPSHOT_VERSION,
  CURRENT_RULE_SNAPSHOT,
  ENGINE_VERSION,
  RULE_SNAPSHOT_VERSION,
  calculateRuhsatFeasibility,
  evaluateTechnicalTriggers,
  normalizeRuhsatAnalysisInput,
  parseLocalizedDecimal,
  type EngineDiagnosticCode,
  type FeasibilityCalculationRequest,
  type FeasibilityCalculationResult,
  type RuleSnapshot,
  type TechnicalTriggerContext,
} from "../src/lib/calculations/modules/ruhsat-on-fizibilite";
import {
  CURRENT_LAW_FIXTURE_ROLE,
  CURRENT_LAW_GOLDEN_FIXTURES,
  HISTORICAL_CASE_FIXTURES,
  HISTORICAL_FIXTURE_ROLE,
  makeCalculationRequest,
  makeRawCurrentLawInput,
  makeScenarioAssumptions,
  normalizeCurrentLawFixture,
} from "./fixtures/ruhsat-on-fizibilite-fixtures";

type TestCategory =
  | "unit"
  | "boundary"
  | "invariant"
  | "golden"
  | "historical-regression"
  | "malformed"
  | "failure"
  | "version"
  | "generated";

const testCounts = new Map<TestCategory, number>();

function test(category: TestCategory, name: string, body: () => void): void {
  try {
    body();
    testCounts.set(category, (testCounts.get(category) ?? 0) + 1);
  } catch (error) {
    throw new Error(`[${category}] ${name}`, { cause: error });
  }
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

function assertDiagnostic(
  result: FeasibilityCalculationResult,
  code: EngineDiagnosticCode
): void {
  assert.equal(result.ok, false, `${code} fatal sonuç üretmeli`);
  assert(result.diagnostics.some((diagnostic) => diagnostic.code === code), `${code} bekleniyordu`);
}

function assertFiniteTree(value: unknown, path = "result"): void {
  if (typeof value === "number") {
    assert(Number.isFinite(value), `${path} sonlu sayı olmalı`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertFiniteTree(item, `${path}[${index}]`));
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      assertFiniteTree(child, `${path}.${key}`);
    }
  }
}

for (const fixture of CURRENT_LAW_GOLDEN_FIXTURES) {
  test("golden", fixture.id, () => {
    assert.equal(fixture.role, CURRENT_LAW_FIXTURE_ROLE);
    const result = calculateRuhsatFeasibility(
      makeCalculationRequest(normalizeCurrentLawFixture(fixture.input)),
      CURRENT_RULE_SNAPSHOT
    );
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.equal(result.value.status, fixture.expected.status);
    assert.equal(result.value.legalRights.taksMaxM2, fixture.expected.taksMaxM2);
    assert.equal(result.value.legalRights.emsalMaxM2, fixture.expected.emsalMaxM2);
    assert.equal(
      result.value.legalRights.effectiveFootprintLimitM2,
      fixture.expected.effectiveFootprintLimitM2
    );
    assert.deepEqual(
      result.value.scenarios.map((scenario) => scenario.finalTotalUnits),
      fixture.expected.scenarioUnitCounts
    );
    assert(result.value.scenarios.every((scenario) => scenario.assumptionStatus === "HEURISTIC"));
    assert.equal(result.value.exactPlacementClaimed, false);
  });
}

const liftFloorBoundaries = [
  { floorCount: 2, shaft: false, liftCount: 0 },
  { floorCount: 3, shaft: true, liftCount: 0 },
  { floorCount: 4, shaft: true, liftCount: 1 },
  { floorCount: 9, shaft: true, liftCount: 1 },
  { floorCount: 10, shaft: true, liftCount: 2 },
  { floorCount: 11, shaft: true, liftCount: 2 },
] as const;

for (const boundary of liftFloorBoundaries) {
  test("boundary", `lift-floor-${boundary.floorCount}`, () => {
    const lift = evaluateTechnicalTriggers(
      triggerContext({ floorCount: boundary.floorCount, totalUnits: 8, unitsPerFloor: 2 })
    ).lift;
    assert.equal(lift.shaftReservationRequired, boundary.shaft);
    assert.equal(lift.requiredLiftCount, boundary.liftCount);
  });
}

for (const [unitsAboveGround, expectedLiftCount] of [[19, 1], [20, 1], [21, 2]] as const) {
  test("boundary", `lift-units-above-ground-${unitsAboveGround}`, () => {
    const unitsPerFloor = 5;
    const lift = evaluateTechnicalTriggers(
      triggerContext({
        floorCount: 5,
        unitsPerFloor,
        totalUnits: unitsAboveGround + unitsPerFloor,
      })
    ).lift;
    assert.equal(lift.residentialUnitsAboveGroundFloor, unitsAboveGround);
    assert.equal(lift.requiredLiftCount, expectedLiftCount);
  });
}

for (const [totalUnits, expectedState] of [
  [9, "NOT_TRIGGERED"],
  [10, "CHECK_REQUIRED"],
  [11, "CHECK_REQUIRED"],
] as const) {
  test("boundary", `shelter-unit-${totalUnits}`, () => {
    assert.equal(
      evaluateTechnicalTriggers(triggerContext({ totalUnits })).shelter.state,
      expectedState
    );
  });
}

for (const [heightM, reached] of [
  [21.499999, false],
  [21.5, true],
  [21.500001, true],
] as const) {
  test("boundary", `fire-height-${heightM}`, () => {
    assert.equal(
      evaluateTechnicalTriggers(triggerContext({ buildingHeightM: heightM })).fire.heightGateReached,
      reached
    );
  });
}

for (const [areaM2, state] of [
  [1_999.999999, "NOT_TRIGGERED"],
  [2_000, "CHECK_REQUIRED"],
  [2_000.000001, "CHECK_REQUIRED"],
] as const) {
  test("boundary", `nseb-area-${areaM2}`, () => {
    assert.equal(
      evaluateTechnicalTriggers(
        triggerContext({ estimatedTotalBuildingAreaM2: areaM2 })
      ).nseb.state,
      state
    );
  });
}

for (const [parcelAreaM2, state] of [
  [1_999.999999, "NOT_TRIGGERED"],
  [2_000, "NOT_TRIGGERED"],
  [2_000.000001, "REQUIRES_CONFIRMATION"],
] as const) {
  test("boundary", `rain-parcel-${parcelAreaM2}`, () => {
    assert.equal(
      evaluateTechnicalTriggers(
        triggerContext({ parcelAreaM2, roofProjectionAreaM2: 500 })
      ).rainWater.state,
      state
    );
  });
}

for (const [roofProjectionAreaM2, state] of [
  [999.999999, "NOT_TRIGGERED"],
  [1_000, "NOT_TRIGGERED"],
  [1_000.000001, "REQUIRES_CONFIRMATION"],
] as const) {
  test("boundary", `rain-roof-${roofProjectionAreaM2}`, () => {
    assert.equal(
      evaluateTechnicalTriggers(
        triggerContext({ parcelAreaM2: 500, roofProjectionAreaM2 })
      ).rainWater.state,
      state
    );
  });
}

test("invariant", "unknown critical data never fabricates scenarios", () => {
  const result = calculateRuhsatFeasibility(
    makeCalculationRequest(normalizeCurrentLawFixture({ parcelAreaM2: null })),
    CURRENT_RULE_SNAPSHOT
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.status, "INSUFFICIENT_DATA");
    assert.equal(result.value.scenarios.length, 0);
    assert.equal(result.value.legalRights.taksMaxM2, null);
    assert.equal(result.value.exactPlacementClaimed, false);
  }
});

test("invariant", "missing permit date never selects a rule snapshot implicitly", () => {
  const result = calculateRuhsatFeasibility(
    makeCalculationRequest(normalizeCurrentLawFixture({ permitApplicationDate: null })),
    CURRENT_RULE_SNAPSHOT
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.status, "INSUFFICIENT_DATA");
    assert.equal(result.value.scenarios.length, 0);
    assert(
      result.diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "MISSING_CRITICAL_INPUT" &&
          diagnostic.field === "project.permitApplicationDate"
      )
    );
  }
});

test("invariant", "unknown geometry never becomes exact placement", () => {
  const result = calculateRuhsatFeasibility(
    makeCalculationRequest(normalizeCurrentLawFixture({ geometryCapacityM2: null })),
    CURRENT_RULE_SNAPSHOT
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert(result.value.qa.includes("GEOMETRY_UNVERIFIED"));
    assert(result.value.scenarios.every((scenario) => scenario.exactPlacementClaimed === false));
    assert(
      result.value.scenarios.every(
        (scenario) => scenario.placementClaimStatus === "CANDIDATE_GEOMETRY_UNVERIFIED"
      )
    );
  }
});

test("invariant", "calculation trace preserves provenance and approximation", () => {
  const result = calculateRuhsatFeasibility(
    makeCalculationRequest(normalizeCurrentLawFixture()),
    CURRENT_RULE_SNAPSHOT
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    const trace = result.value.legalRights.traces.effectiveFootprintLimit;
    assert.deepEqual(trace?.sourceIds, ["synthetic-current-rule-fixture"]);
    assert.deepEqual(trace?.inputStatuses, ["DOCUMENT", "DOCUMENT", "DOCUMENT"]);
    assert.equal(trace?.approximate, false);
  }
});

test("failure", "cycle returns a range and no arbitrary final", () => {
  const result = calculateRuhsatFeasibility(
    makeCalculationRequest(
      normalizeCurrentLawFixture({
        parcelAreaM2: "1000",
        taks: "0,465",
        kaks: "3",
        floorCount: "5",
        geometryCapacityM2: "465",
      }),
      makeScenarioAssumptions({ secondLiftAdditionalAreaM2: 60 })
    ),
    CURRENT_RULE_SNAPSHOT
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    const compact = result.value.scenarios[0];
    assert.equal(compact.convergenceStatus, "CYCLE_DETECTED");
    assert.equal(compact.finalTotalUnits, null);
    assert(compact.observedUnitCountRange.minimum < compact.observedUnitCountRange.maximum);
    assert(result.value.qa.includes("SCENARIO_NON_CONVERGENCE"));
  }
});

test("failure", "max iteration returns no arbitrary final", () => {
  const assumptions = makeScenarioAssumptions({ maxIterations: 1, secondLiftAdditionalAreaM2: 60 });
  const result = calculateRuhsatFeasibility(
    makeCalculationRequest(
      normalizeCurrentLawFixture({
        taks: "0,50",
        kaks: "3",
        floorCount: "6",
        geometryCapacityM2: "500",
      }),
      assumptions
    ),
    CURRENT_RULE_SNAPSHOT
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.scenarios[0].convergenceStatus, "MAX_ITERATIONS");
    assert.equal(result.value.scenarios[0].finalTotalUnits, null);
    assert(result.value.scenarios.every((scenario) => scenario.iterations.length <= 1));
  }
});

test("historical-regression", "all anonymized cases remain historical-only fixtures", () => {
  assert.equal(HISTORICAL_CASE_FIXTURES.length, 10);
  assert.equal(new Set(HISTORICAL_CASE_FIXTURES.map((fixture) => fixture.id)).size, 10);
  for (const fixture of HISTORICAL_CASE_FIXTURES) {
    assert.equal(fixture.role, HISTORICAL_FIXTURE_ROLE);
    assert.equal(fixture.currentLawOracle, false);
    assert.notEqual(fixture.role, CURRENT_LAW_FIXTURE_ROLE);
  }
});

test("historical-regression", "CASE_08 parking inconsistency remains observable", () => {
  const fixture = HISTORICAL_CASE_FIXTURES.find(({ id }) => id === "CASE_08");
  assert(fixture);
  const observed: Readonly<Record<string, number>> = fixture.observedNumbers;
  assert.notEqual(
    observed.parkingDetailA + observed.parkingDetailB,
    observed.statedParkingTotal
  );
});

test("historical-regression", "CASE_09 parking ledger balances", () => {
  const fixture = HISTORICAL_CASE_FIXTURES.find(({ id }) => id === "CASE_09");
  assert(fixture);
  const observed: Readonly<Record<string, number>> = fixture.observedNumbers;
  assert.equal(
    observed.onParcelParking + observed.unresolvedParking,
    observed.requiredParking
  );
});

test("historical-regression", "CASE_10 shelter arithmetic mismatch remains observable", () => {
  const fixture = HISTORICAL_CASE_FIXTURES.find(({ id }) => id === "CASE_10");
  assert(fixture);
  const observed: Readonly<Record<string, number>> = fixture.observedNumbers;
  assert.notEqual(17 * 4, observed.writtenShelterProduct);
  assert.equal(17 * 4, observed.usedShelterResult);
});

const malformedNumbers: readonly unknown[] = [
  "1e3",
  "NaN",
  "Infinity",
  "12,34,56",
  "--1",
  "0x10",
  ".",
  true,
  123,
  {},
];

for (const [index, rawValue] of malformedNumbers.entries()) {
  test("malformed", `numeric-payload-${index}`, () => {
    assert.deepEqual(parseLocalizedDecimal(rawValue), { state: "invalid" });
    const raw = makeRawCurrentLawInput();
    raw.parcel.areaM2.rawValue = rawValue as string;
    const normalized = normalizeRuhsatAnalysisInput(raw);
    assert.equal(normalized.ok, false);
    assert(normalized.issues.some((issue) => issue.code === "INVALID_NUMBER"));
    if (!normalized.ok) {
      assert.equal(normalized.partialValue.parcel.areaM2.state, "unknown");
      assert.equal(normalized.partialValue.parcel.areaM2.reason, "INVALID");
    }
  });
}

for (const date of ["2026-02-29", "2026-13-01", "2026-00-10", "20-01-01"] as const) {
  test("malformed", `date-${date}`, () => {
    const raw = makeRawCurrentLawInput();
    raw.project.permitApplicationDate = date;
    const normalized = normalizeRuhsatAnalysisInput(raw);
    assert.equal(normalized.ok, false);
    assert(normalized.issues.some((issue) => issue.code === "INVALID_DATE"));
  });
}

test("malformed", "non-object request is rejected without throwing", () => {
  const result = calculateRuhsatFeasibility(
    null as unknown as FeasibilityCalculationRequest,
    CURRENT_RULE_SNAPSHOT
  );
  assertDiagnostic(result, "INVALID_REQUEST");
});

test("malformed", "missing assumption envelope is rejected", () => {
  const request = makeCalculationRequest(normalizeCurrentLawFixture()) as unknown as Record<string, unknown>;
  request.assumptions = null;
  const result = calculateRuhsatFeasibility(
    request as unknown as FeasibilityCalculationRequest,
    CURRENT_RULE_SNAPSHOT
  );
  assertDiagnostic(result, "INVALID_REQUEST");
});

test("malformed", "non-finite normalized number is rejected", () => {
  const request = structuredClone(makeCalculationRequest(normalizeCurrentLawFixture()));
  if (request.input.parcel.areaM2.state === "known") {
    request.input.parcel.areaM2.value = Number.NaN;
  }
  const result = calculateRuhsatFeasibility(request, CURRENT_RULE_SNAPSHOT);
  assertDiagnostic(result, "INVALID_NORMALIZED_INPUT");
});

test("malformed", "forged confidence is rejected", () => {
  const request = structuredClone(makeCalculationRequest(normalizeCurrentLawFixture()));
  request.input.confidence = {
    level: "D",
    missingForNextLevel: [],
    reasonCode: "HIGHEST_DEFINED_LEVEL",
  };
  const result = calculateRuhsatFeasibility(request, CURRENT_RULE_SNAPSHOT);
  assertDiagnostic(result, "INVALID_NORMALIZED_INPUT");
});

test("malformed", "strong provenance without source is rejected", () => {
  const request = structuredClone(makeCalculationRequest(normalizeCurrentLawFixture()));
  if (request.input.parcel.areaM2.state === "known") {
    request.input.parcel.areaM2.provenance.sourceId = null;
  }
  const result = calculateRuhsatFeasibility(request, CURRENT_RULE_SNAPSHOT);
  assertDiagnostic(result, "INVALID_NORMALIZED_INPUT");
});

const invalidAssumptionMutators: readonly ((request: FeasibilityCalculationRequest) => void)[] = [
  (request) => { request.assumptions.maxIterations = 0; },
  (request) => { request.assumptions.maxIterations = 51; },
  (request) => { request.assumptions.maxIterations = 1.5; },
  (request) => { request.assumptions.scenarios[0].targetNetAreaM2 = -1; },
  (request) => { request.assumptions.scenarios[0].targetClosedGrossAreaM2 = Number.NaN; },
  (request) => { request.assumptions.scenarios[0].targetClosedGrossAreaM2 = 55; },
  (request) => { request.assumptions.scenarios[0].id = "BALANCED"; },
  (request) => { request.assumptions.technicalReserves.primaryLiftAreaM2 = -1; },
  (request) => {
    (request.assumptions as unknown as { version: string }).version = "stale-assumption-policy";
  },
];

for (const [index, mutate] of invalidAssumptionMutators.entries()) {
  test("malformed", `assumption-set-${index}`, () => {
    const request = structuredClone(makeCalculationRequest(normalizeCurrentLawFixture()));
    mutate(request);
    assertDiagnostic(
      calculateRuhsatFeasibility(request, CURRENT_RULE_SNAPSHOT),
      "INVALID_ASSUMPTION_SET"
    );
  });
}

test("malformed", "invalid shelter capacity has its own diagnostic", () => {
  const request = makeCalculationRequest(normalizeCurrentLawFixture());
  request.technicalCapacities.shelterPersonCapacity = Number.POSITIVE_INFINITY;
  assertDiagnostic(
    calculateRuhsatFeasibility(request, CURRENT_RULE_SNAPSHOT),
    "INVALID_TECHNICAL_CAPACITY"
  );
});

test("version", "analysis records all four active versions", () => {
  const result = calculateRuhsatFeasibility(
    makeCalculationRequest(normalizeCurrentLawFixture()),
    CURRENT_RULE_SNAPSHOT
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value.versions, {
      analysisSchema: ANALYSIS_SCHEMA_VERSION,
      engine: ENGINE_VERSION,
      ruleSnapshot: RULE_SNAPSHOT_VERSION,
      assumptionPolicy: ASSUMPTION_POLICY_SNAPSHOT_VERSION,
    });
  }
  assert.equal(ENGINE_VERSION, "0.4.0");
});

test("version", "stale normalized schema is rejected", () => {
  const request = structuredClone(makeCalculationRequest(normalizeCurrentLawFixture()));
  (request.input as unknown as { schemaVersion: string }).schemaVersion = "0.2.0";
  assertDiagnostic(
    calculateRuhsatFeasibility(request, CURRENT_RULE_SNAPSHOT),
    "NORMALIZED_INPUT_VERSION_MISMATCH"
  );
});

test("version", "null snapshot is rejected without throwing", () => {
  const result = calculateRuhsatFeasibility(
    makeCalculationRequest(normalizeCurrentLawFixture()),
    null as unknown as RuleSnapshot
  );
  assertDiagnostic(result, "INVALID_RULE_SNAPSHOT");
});

test("version", "snapshot id mismatch is rejected", () => {
  const snapshot = structuredClone(CURRENT_RULE_SNAPSHOT) as unknown as { id: string };
  snapshot.id = "tr-ruhsat-rules@stale";
  assertDiagnostic(
    calculateRuhsatFeasibility(
      makeCalculationRequest(normalizeCurrentLawFixture()),
      snapshot as unknown as RuleSnapshot
    ),
    "RULE_SNAPSHOT_VERSION_MISMATCH"
  );
});

test("version", "source-index-only snapshot is rejected", () => {
  const snapshot = {
    ...CURRENT_RULE_SNAPSHOT,
    releaseStatus: "SOURCE_INDEX_ONLY" as const,
  };
  assertDiagnostic(
    calculateRuhsatFeasibility(
      makeCalculationRequest(normalizeCurrentLawFixture()),
      snapshot
    ),
    "RULE_SNAPSHOT_NOT_EXECUTABLE"
  );
});

test("version", "same-id tampered snapshot content is rejected", () => {
  const snapshot = structuredClone(CURRENT_RULE_SNAPSHOT) as unknown as {
    limitations: string[];
  };
  snapshot.limitations = [...snapshot.limitations, "tampered-content"];
  assertDiagnostic(
    calculateRuhsatFeasibility(
      makeCalculationRequest(normalizeCurrentLawFixture()),
      snapshot as unknown as RuleSnapshot
    ),
    "RULE_SNAPSHOT_CONTENT_MISMATCH"
  );
});

function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

test("generated", "128 seeded valid inputs preserve engine invariants", () => {
  const random = seededRandom(0x4f4e4554);
  const unitTypes = ["1+1", "2+1", "3+1", "4+1"] as const;

  for (let index = 0; index < 128; index += 1) {
    const parcelAreaM2 = 250 + Math.floor(random() * 4_750);
    const taks = 0.2 + Math.floor(random() * 61) / 100;
    const kaks = 0.5 + Math.floor(random() * 351) / 100;
    const floorCount = 2 + Math.floor(random() * 11);
    const heightM = 6 + Math.floor(random() * 3_500) / 100;
    const taksMaxM2 = parcelAreaM2 * taks;
    const geometryCapacityM2 = taksMaxM2 * (0.65 + random() * 0.35);
    const input = normalizeCurrentLawFixture({
      parcelAreaM2: String(parcelAreaM2),
      taks: taks.toFixed(2),
      kaks: kaks.toFixed(2),
      floorCount: String(floorCount),
      heightM: heightM.toFixed(2),
      geometryCapacityM2: geometryCapacityM2.toFixed(6),
      targetUnitType: unitTypes[index % unitTypes.length],
    });
    const request = makeCalculationRequest(input);
    const first = calculateRuhsatFeasibility(request, CURRENT_RULE_SNAPSHOT);
    const second = calculateRuhsatFeasibility(request, CURRENT_RULE_SNAPSHOT);

    assert.deepEqual(second, first, `generated-${index} deterministik olmalı`);
    assert.equal(first.ok, true);
    assertFiniteTree(first, `generated-${index}`);
    if (!first.ok) {
      continue;
    }

    assert.equal(first.value.exactPlacementClaimed, false);
    assert.equal(first.value.legalRights.taksMaxM2, Number(taksMaxM2.toFixed(6)));
    assert.equal(first.value.legalRights.emsalMaxM2, Number((parcelAreaM2 * kaks).toFixed(6)));
    for (const scenario of first.value.scenarios) {
      assert.equal(scenario.exactPlacementClaimed, false);
      assert.equal(scenario.assumptionStatus, "HEURISTIC");
      assert(scenario.iterations.length <= request.assumptions.maxIterations);
      if (scenario.convergenceStatus === "CONVERGED") {
        assert.notEqual(scenario.finalTotalUnits, null);
      } else {
        assert.equal(scenario.finalTotalUnits, null);
        assert.equal(scenario.finalUnitsPerFloor, null);
      }
    }
  }
});

test("unit", "single residential unit retains lift exemption", () => {
  const triggers = evaluateTechnicalTriggers(triggerContext({ floorCount: 12, totalUnits: 1, unitsPerFloor: 1 }));
  assert.equal(triggers.lift.requiredLiftCount, 0);
  assert.equal(triggers.lift.shaftReservationRequired, false);
});

test("unit", "mixed unit type never fabricates shelter capacity", () => {
  const shelter = evaluateTechnicalTriggers(triggerContext({ totalUnits: 30, unitType: "MIXED" })).shelter;
  assert.equal(shelter.state, "REQUIRES_CONFIRMATION");
  assert.equal(shelter.estimatedPersonEquivalent, null);
  assert.equal(shelter.capacityState, "UNKNOWN");
});

const requiredCategories: readonly TestCategory[] = [
  "unit",
  "boundary",
  "invariant",
  "golden",
  "historical-regression",
  "malformed",
  "failure",
  "version",
  "generated",
];
for (const category of requiredCategories) {
  assert((testCounts.get(category) ?? 0) > 0, `${category} kategorisi boş kalmamalı`);
}

const total = [...testCounts.values()].reduce((sum, count) => sum + count, 0);
const summary = requiredCategories
  .map((category) => `${category}=${testCounts.get(category) ?? 0}`)
  .join(", ");
console.log(`Ruhsat ön fizibilite Aşama 4 test fortress başarılı: ${total} grup (${summary}).`);
