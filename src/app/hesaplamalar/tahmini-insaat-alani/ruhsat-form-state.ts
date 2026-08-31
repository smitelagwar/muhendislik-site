import {
  ASSUMPTION_POLICY_SNAPSHOT_VERSION,
  createDefaultScenarioAssumptionSet,
  parseLocalizedDecimal,
  type ConfidenceEvidence,
  type ProvenanceStatus,
  type RawRuhsatAnalysisInput,
  type RawSourcedNumericInput,
  type ScenarioAssumptionSet,
  type ScenarioId,
} from "@/lib/calculations/modules/ruhsat-on-fizibilite";

export const NUMERIC_SOURCE_STATUSES = [
  "REQUIRES_CONFIRMATION",
  "DOCUMENT",
  "MEASUREMENT",
  "ASSUMPTION",
] as const satisfies readonly ProvenanceStatus[];

export type NumericSourceStatus = (typeof NUMERIC_SOURCE_STATUSES)[number];

export interface ScenarioAssumptionFormState {
  targetNetAreaM2: string;
  targetClosedGrossAreaM2: string;
  baseCoreAreaM2: string;
  otherCommonAreaM2: string;
  floorTechnicalAreaM2: string;
  circulationAreaPerUnitM2: string;
}

export interface RuhsatFormState {
  permitApplicationDate: string;
  municipality: string;
  district: string;
  useType: "RESIDENTIAL" | "COMMERCIAL" | "MIXED" | "OTHER";
  numericSourceStatus: NumericSourceStatus;
  numericSourceId: string;
  parcelAreaM2: string;
  taks: string;
  kaks: string;
  maxFloorCount: string;
  maxHeightM: string;
  buildingOrder: "DETACHED" | "BLOCK" | "ADJOINING" | "OTHER" | "";
  setbackFrontM: string;
  setbackSideLeftM: string;
  setbackSideRightM: string;
  setbackRearM: string;
  manualGeometryCapacityM2: string;
  targetUnitType: "1+1" | "2+1" | "3+1" | "4+1" | "MIXED" | "";
  basementIntent: "NONE" | "PARKING" | "SHELTER" | "STORAGE" | "MIXED" | "UNDECIDED" | "";
  evidence: ConfidenceEvidence;
  scenarios: Record<ScenarioId, ScenarioAssumptionFormState>;
  technicalReserves: {
    liftShaftReservationAreaM2: string;
    primaryLiftAreaM2: string;
    secondLiftAdditionalAreaM2: string;
    fireReviewAreaM2: string;
  };
}

export interface FormIssue {
  field: string;
  message: string;
}

import {
  TYPOLOGY_PROFILES,
  type UnitTypology,
} from "@/lib/calculations/modules/ruhsat-on-fizibilite";

const DEFAULT_ASSUMPTIONS = createDefaultScenarioAssumptionSet();

function stringValue(value: number): string {
  return String(value).replace(".", ",");
}

export function getScenarioAssumptionsForTypology(
  unitType: "1+1" | "2+1" | "3+1" | "4+1" | "MIXED" | ""
): Record<ScenarioId, ScenarioAssumptionFormState> {
  const base = {
    COMPACT_MAX_UNITS: scenarioFormState("COMPACT_MAX_UNITS"),
    BALANCED: scenarioFormState("BALANCED"),
    COMFORT_FEWER_UNITS: scenarioFormState("COMFORT_FEWER_UNITS"),
  };

  const ut: UnitTypology | null =
    unitType === "1+1" || unitType === "2+1" || unitType === "3+1" || unitType === "4+1"
      ? unitType
      : null;

  if (!ut) {
    return base;
  }

  const profile = TYPOLOGY_PROFILES[ut];
  if (!profile) {
    return base;
  }

  // Compact, Balanced ve Comfort için profilden orta değerleri veya mantıklı başlangıç değerlerini al
  const compactNet = Math.round((profile.bands.COMPACT.targetNetAreaM2.min + profile.bands.COMPACT.targetNetAreaM2.max) / 2);
  const compactGross = Math.round((profile.bands.COMPACT.targetClosedGrossAreaM2.min + profile.bands.COMPACT.targetClosedGrossAreaM2.max) / 2);

  const balancedNet = Math.round((profile.bands.BALANCED.targetNetAreaM2.min + profile.bands.BALANCED.targetNetAreaM2.max) / 2);
  const balancedGross = Math.round((profile.bands.BALANCED.targetClosedGrossAreaM2.min + profile.bands.BALANCED.targetClosedGrossAreaM2.max) / 2);

  const comfortNet = Math.round((profile.bands.COMFORT.targetNetAreaM2.min + profile.bands.COMFORT.targetNetAreaM2.max) / 2);
  const comfortGross = Math.round((profile.bands.COMFORT.targetClosedGrossAreaM2.min + profile.bands.COMFORT.targetClosedGrossAreaM2.max) / 2);

  return {
    COMPACT_MAX_UNITS: {
      ...base.COMPACT_MAX_UNITS,
      targetNetAreaM2: stringValue(compactNet),
      targetClosedGrossAreaM2: stringValue(compactGross),
    },
    BALANCED: {
      ...base.BALANCED,
      targetNetAreaM2: stringValue(balancedNet),
      targetClosedGrossAreaM2: stringValue(balancedGross),
    },
    COMFORT_FEWER_UNITS: {
      ...base.COMFORT_FEWER_UNITS,
      targetNetAreaM2: stringValue(comfortNet),
      targetClosedGrossAreaM2: stringValue(comfortGross),
    },
  };
}

function scenarioFormState(id: ScenarioId): ScenarioAssumptionFormState {
  const scenario = DEFAULT_ASSUMPTIONS.scenarios.find((candidate) => candidate.id === id);
  if (!scenario) {
    throw new Error(`Başlangıç varsayımı bulunamadı: ${id}`);
  }

  return {
    targetNetAreaM2: stringValue(scenario.targetNetAreaM2),
    targetClosedGrossAreaM2: stringValue(scenario.targetClosedGrossAreaM2),
    baseCoreAreaM2: stringValue(scenario.baseCoreAreaM2),
    otherCommonAreaM2: stringValue(scenario.otherCommonAreaM2),
    floorTechnicalAreaM2: stringValue(scenario.floorTechnicalAreaM2),
    circulationAreaPerUnitM2: stringValue(scenario.circulationAreaPerUnitM2),
  };
}

export function createInitialRuhsatFormState(): RuhsatFormState {
  return {
    permitApplicationDate: "",
    municipality: "",
    district: "",
    useType: "RESIDENTIAL",
    numericSourceStatus: "REQUIRES_CONFIRMATION",
    numericSourceId: "",
    parcelAreaM2: "",
    taks: "",
    kaks: "",
    maxFloorCount: "",
    maxHeightM: "",
    buildingOrder: "",
    setbackFrontM: "",
    setbackSideLeftM: "",
    setbackSideRightM: "",
    setbackRearM: "",
    manualGeometryCapacityM2: "",
    targetUnitType: "2+1",
    basementIntent: "NONE",
    evidence: {
      hasReadableCurrentZoningDocument: false,
      hasPlanNotes: false,
      hasCoordinateParcel: false,
      hasArchitecturalPreplan: false,
      hasPermitCalculation: false,
      hasDwg: false,
    },
    scenarios: {
      COMPACT_MAX_UNITS: scenarioFormState("COMPACT_MAX_UNITS"),
      BALANCED: scenarioFormState("BALANCED"),
      COMFORT_FEWER_UNITS: scenarioFormState("COMFORT_FEWER_UNITS"),
    },
    technicalReserves: {
      liftShaftReservationAreaM2: stringValue(
        DEFAULT_ASSUMPTIONS.technicalReserves.liftShaftReservationAreaM2
      ),
      primaryLiftAreaM2: stringValue(DEFAULT_ASSUMPTIONS.technicalReserves.primaryLiftAreaM2),
      secondLiftAdditionalAreaM2: stringValue(
        DEFAULT_ASSUMPTIONS.technicalReserves.secondLiftAdditionalAreaM2
      ),
      fireReviewAreaM2: stringValue(DEFAULT_ASSUMPTIONS.technicalReserves.fireReviewAreaM2),
    },
  };
}

function sourcedNumber(form: RuhsatFormState, rawValue: string): RawSourcedNumericInput {
  const trimmed = rawValue.trim();
  return {
    rawValue: trimmed === "" ? null : rawValue,
    provenance:
      trimmed === ""
        ? null
        : {
            status: form.numericSourceStatus,
            sourceId: form.numericSourceId.trim() || null,
          },
  };
}

export function buildRawRuhsatInput(form: RuhsatFormState): RawRuhsatAnalysisInput {
  return {
    project: {
      analysisDate: null,
      permitApplicationDate: form.permitApplicationDate.trim() || null,
      municipality: form.municipality.trim() || null,
      district: form.district.trim() || null,
      useType: form.useType,
    },
    parcel: {
      areaM2: sourcedNumber(form, form.parcelAreaM2),
      taks: sourcedNumber(form, form.taks),
      kaks: sourcedNumber(form, form.kaks),
      maxFloorCount: sourcedNumber(form, form.maxFloorCount),
      maxHeightM: sourcedNumber(form, form.maxHeightM),
      buildingOrder: form.buildingOrder || null,
      setbacks: {
        frontM: sourcedNumber(form, form.setbackFrontM),
        sideLeftM: sourcedNumber(form, form.setbackSideLeftM),
        sideRightM: sourcedNumber(form, form.setbackSideRightM),
        rearM: sourcedNumber(form, form.setbackRearM),
      },
      manualGeometryCapacityM2: sourcedNumber(form, form.manualGeometryCapacityM2),
    },
    program: {
      targetUnitType: form.targetUnitType || null,
      basementIntent: form.basementIntent || null,
    },
    evidence: form.evidence,
  };
}

function positiveNumber(value: string, field: string, issues: FormIssue[]): number | null {
  const parsed = parseLocalizedDecimal(value);
  if (parsed.state !== "parsed" || parsed.value <= 0) {
    issues.push({ field, message: "Sıfırdan büyük geçerli bir sayı girin." });
    return null;
  }
  return parsed.value;
}

function nonNegativeNumber(value: string, field: string, issues: FormIssue[]): number | null {
  const parsed = parseLocalizedDecimal(value);
  if (parsed.state !== "parsed" || parsed.value < 0) {
    issues.push({ field, message: "Sıfır veya daha büyük geçerli bir sayı girin." });
    return null;
  }
  return parsed.value;
}

export function buildScenarioAssumptionSet(form: RuhsatFormState): {
  assumptions: ScenarioAssumptionSet | null;
  issues: readonly FormIssue[];
} {
  const issues: FormIssue[] = [];
  const scenarioIds: readonly ScenarioId[] = [
    "COMPACT_MAX_UNITS",
    "BALANCED",
    "COMFORT_FEWER_UNITS",
  ];
  const scenarios = scenarioIds.map((id) => {
    const current = form.scenarios[id];
    return {
      id,
      targetNetAreaM2: positiveNumber(current.targetNetAreaM2, `scenarios.${id}.targetNetAreaM2`, issues),
      targetClosedGrossAreaM2: positiveNumber(
        current.targetClosedGrossAreaM2,
        `scenarios.${id}.targetClosedGrossAreaM2`,
        issues
      ),
      baseCoreAreaM2: nonNegativeNumber(current.baseCoreAreaM2, `scenarios.${id}.baseCoreAreaM2`, issues),
      otherCommonAreaM2: nonNegativeNumber(
        current.otherCommonAreaM2,
        `scenarios.${id}.otherCommonAreaM2`,
        issues
      ),
      floorTechnicalAreaM2: nonNegativeNumber(
        current.floorTechnicalAreaM2,
        `scenarios.${id}.floorTechnicalAreaM2`,
        issues
      ),
      circulationAreaPerUnitM2: nonNegativeNumber(
        current.circulationAreaPerUnitM2,
        `scenarios.${id}.circulationAreaPerUnitM2`,
        issues
      ),
    };
  });
  const technicalReserves = {
    liftShaftReservationAreaM2: nonNegativeNumber(
      form.technicalReserves.liftShaftReservationAreaM2,
      "technicalReserves.liftShaftReservationAreaM2",
      issues
    ),
    primaryLiftAreaM2: nonNegativeNumber(
      form.technicalReserves.primaryLiftAreaM2,
      "technicalReserves.primaryLiftAreaM2",
      issues
    ),
    secondLiftAdditionalAreaM2: nonNegativeNumber(
      form.technicalReserves.secondLiftAdditionalAreaM2,
      "technicalReserves.secondLiftAdditionalAreaM2",
      issues
    ),
    fireReviewAreaM2: nonNegativeNumber(
      form.technicalReserves.fireReviewAreaM2,
      "technicalReserves.fireReviewAreaM2",
      issues
    ),
  };

  if (issues.length > 0 || scenarios.some((scenario) => Object.values(scenario).some((value) => value === null)) || Object.values(technicalReserves).some((value) => value === null)) {
    return { assumptions: null, issues };
  }

  return {
    assumptions: {
      version: ASSUMPTION_POLICY_SNAPSHOT_VERSION,
      maxIterations: 10,
      scenarios: scenarios as ScenarioAssumptionSet["scenarios"],
      technicalReserves: technicalReserves as ScenarioAssumptionSet["technicalReserves"],
    },
    issues,
  };
}
