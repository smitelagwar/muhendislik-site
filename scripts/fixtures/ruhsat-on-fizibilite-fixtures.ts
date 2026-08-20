import assert from "node:assert/strict";
import {
  ASSUMPTION_POLICY_SNAPSHOT_VERSION,
  normalizeRuhsatAnalysisInput,
  type ConfidenceEvidence,
  type FeasibilityCalculationRequest,
  type NormalizedRuhsatAnalysisInput,
  type RawRuhsatAnalysisInput,
  type RawSourcedNumericInput,
  type ScenarioAssumptionSet,
} from "../../src/lib/calculations/modules/ruhsat-on-fizibilite";

export const CURRENT_LAW_FIXTURE_ROLE = "CURRENT_LAW_SYNTHETIC_ORACLE" as const;
export const HISTORICAL_FIXTURE_ROLE = "HISTORICAL_REGRESSION_NOT_CURRENT_LAW_ORACLE" as const;

export const LEVEL_B_EVIDENCE: ConfidenceEvidence = {
  hasReadableCurrentZoningDocument: true,
  hasPlanNotes: true,
  hasCoordinateParcel: true,
  hasArchitecturalPreplan: false,
  hasPermitCalculation: false,
  hasDwg: false,
};

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

export interface CurrentLawInputOverrides {
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

export function makeRawCurrentLawInput(
  overrides: CurrentLawInputOverrides = {}
): RawRuhsatAnalysisInput {
  return {
    project: {
      analysisDate: "2026-08-20",
      permitApplicationDate:
        overrides.permitApplicationDate === undefined ? "2026-07-15" : overrides.permitApplicationDate,
      municipality: "Sentetik Test Belediyesi",
      district: "Sentetik Test İlçesi",
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
    evidence: overrides.evidence ?? LEVEL_B_EVIDENCE,
  };
}

export function normalizeCurrentLawFixture(
  overrides: CurrentLawInputOverrides = {}
): NormalizedRuhsatAnalysisInput {
  const normalized = normalizeRuhsatAnalysisInput(makeRawCurrentLawInput(overrides));
  assert.equal(normalized.ok, true, "Sentetik current-law fixture normalize edilebilmeli");
  if (!normalized.ok) {
    throw new Error("Sentetik current-law fixture normalize edilemedi");
  }
  return normalized.value;
}

export function makeScenarioAssumptions(
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

export function makeCalculationRequest(
  input: NormalizedRuhsatAnalysisInput,
  assumptions = makeScenarioAssumptions(),
  shelterPersonCapacity: number | null = 200
): FeasibilityCalculationRequest {
  return {
    input,
    assumptions,
    technicalCapacities: { shelterPersonCapacity },
  };
}

export interface CurrentLawGoldenFixture {
  id: string;
  role: typeof CURRENT_LAW_FIXTURE_ROLE;
  input: CurrentLawInputOverrides;
  expected: {
    status: "CALCULATED";
    taksMaxM2: number;
    emsalMaxM2: number;
    effectiveFootprintLimitM2: number;
    scenarioUnitCounts: readonly [number, number, number];
  };
}

export const CURRENT_LAW_GOLDEN_FIXTURES = [
  {
    id: "SYNTHETIC_BASELINE",
    role: CURRENT_LAW_FIXTURE_ROLE,
    input: {},
    expected: {
      status: "CALCULATED",
      taksMaxM2: 400,
      emsalMaxM2: 1_500,
      effectiveFootprintLimitM2: 350,
      scenarioUnitCounts: [20, 15, 10],
    },
  },
  {
    id: "SYNTHETIC_GEOMETRY_LIMITED",
    role: CURRENT_LAW_FIXTURE_ROLE,
    input: {
      parcelAreaM2: "1200",
      taks: "0,35",
      kaks: "1,20",
      floorCount: "4",
      heightM: "15",
      geometryCapacityM2: "300",
    },
    expected: {
      status: "CALCULATED",
      taksMaxM2: 420,
      emsalMaxM2: 1_440,
      effectiveFootprintLimitM2: 300,
      scenarioUnitCounts: [12, 8, 8],
    },
  },
  {
    id: "SYNTHETIC_EMSAL_LIMITED",
    role: CURRENT_LAW_FIXTURE_ROLE,
    input: {
      parcelAreaM2: "1000",
      taks: "0,50",
      kaks: "0,60",
      floorCount: "6",
      heightM: "20",
      geometryCapacityM2: "500",
    },
    expected: {
      status: "CALCULATED",
      taksMaxM2: 500,
      emsalMaxM2: 600,
      effectiveFootprintLimitM2: 500,
      scenarioUnitCounts: [8, 6, 5],
    },
  },
] as const satisfies readonly CurrentLawGoldenFixture[];

export interface HistoricalCaseFixture {
  id: `CASE_${string}`;
  role: typeof HISTORICAL_FIXTURE_ROLE;
  currentLawOracle: false;
  lessonCode: string;
  observedNumbers: Readonly<Record<string, number>>;
}

export const HISTORICAL_CASE_FIXTURES = [
  {
    id: "CASE_01",
    role: HISTORICAL_FIXTURE_ROLE,
    currentLawOracle: false,
    lessonCode: "MULTILEVEL_UNIT_IS_NOT_MULTIPLE_UNITS",
    observedNumbers: { netAreaM2: 81.75, closedGrossAreaM2: 101.7, netToGrossRatio: 1.24 },
  },
  {
    id: "CASE_02",
    role: HISTORICAL_FIXTURE_ROLE,
    currentLawOracle: false,
    lessonCode: "LOW_UNIT_COUNT_CAN_HAVE_HIGH_COMMON_AREA_LOAD",
    observedNumbers: { netAreaM2: 114.35, closedGrossAreaM2: 128.7, commonAreaM2: 24.15 },
  },
  {
    id: "CASE_03",
    role: HISTORICAL_FIXTURE_ROLE,
    currentLawOracle: false,
    lessonCode: "SUMMARY_IS_NOT_SOURCE_OF_TRUTH",
    observedNumbers: { minimumNetToGrossRatio: 1.13, maximumNetToGrossRatio: 1.14 },
  },
  {
    id: "CASE_04",
    role: HISTORICAL_FIXTURE_ROLE,
    currentLawOracle: false,
    lessonCode: "FIXED_CORE_PERCENTAGE_IS_MISLEADING",
    observedNumbers: { unitCountPerFloor: 6, closedGrossAreaM2: 899.7, physicalFloorAreaM2: 1_024.65 },
  },
  {
    id: "CASE_05",
    role: HISTORICAL_FIXTURE_ROLE,
    currentLawOracle: false,
    lessonCode: "BASE_EMSAL_AND_OVERFLOW_TO_EMSAL_ARE_SEPARATE",
    observedNumbers: { overflowAreaM2: 12.45 },
  },
  {
    id: "CASE_06",
    role: HISTORICAL_FIXTURE_ROLE,
    currentLawOracle: false,
    lessonCode: "PHYSICAL_FOOTPRINT_IS_NOT_TAKS_USED",
    observedNumbers: { physicalFootprintM2: 486.42, theoreticalTaksMaxM2: 477.74, taksUsedM2: 476.63 },
  },
  {
    id: "CASE_07",
    role: HISTORICAL_FIXTURE_ROLE,
    currentLawOracle: false,
    lessonCode: "BOUNDARY_PROJECTS_REQUIRE_TRACE_AUDIT",
    observedNumbers: { taksReserveM2: 0.43, emsalReserveM2: 2.39, parcelAreaMismatchM2: 0.49 },
  },
  {
    id: "CASE_08",
    role: HISTORICAL_FIXTURE_ROLE,
    currentLawOracle: false,
    lessonCode: "BB_MASTER_FIRST",
    observedNumbers: { normalFloorAreaM2: 507.28, parkingDetailA: 25, parkingDetailB: 13, statedParkingTotal: 21 },
  },
  {
    id: "CASE_09",
    role: HISTORICAL_FIXTURE_ROLE,
    currentLawOracle: false,
    lessonCode: "PARKING_REQUIRES_RESOLUTION_LEDGER",
    observedNumbers: { residentialUnits: 20, commercialUnits: 3, requiredParking: 45, onParcelParking: 32, unresolvedParking: 13 },
  },
  {
    id: "CASE_10",
    role: HISTORICAL_FIXTURE_ROLE,
    currentLawOracle: false,
    lessonCode: "WRONG_INTERMEDIATE_CAN_COEXIST_WITH_CORRECT_FINAL",
    observedNumbers: { minuendM2: 3_224.08, subtrahendM2: 1_075, writtenShelterProduct: 64, usedShelterResult: 68 },
  },
] as const satisfies readonly HistoricalCaseFixture[];
