import assert from "node:assert/strict";
import {
  ANALYSIS_SCHEMA_VERSION,
  CURRENT_RULE_SNAPSHOT,
  RULE_SNAPSHOT_VERSION,
  compareAtInternalPrecision,
  evaluateConfidence,
  normalizeRuhsatAnalysisInput,
  parseLocalizedDecimal,
  type ConfidenceEvidence,
  type ProvenanceStatus,
  type RawRuhsatAnalysisInput,
  type RawSourcedNumericInput,
} from "../src/lib/calculations/modules/ruhsat-on-fizibilite";

function emptyNumber(): RawSourcedNumericInput {
  return { rawValue: null, provenance: null };
}

function sourcedNumber(
  rawValue: string,
  status: ProvenanceStatus = "REQUIRES_CONFIRMATION",
  sourceId: string | null = null
): RawSourcedNumericInput {
  return {
    rawValue,
    provenance: { status, sourceId },
  };
}

const noEvidence: ConfidenceEvidence = {
  hasReadableCurrentZoningDocument: false,
  hasPlanNotes: false,
  hasCoordinateParcel: false,
  hasArchitecturalPreplan: false,
  hasPermitCalculation: false,
  hasDwg: false,
};

function blankInput(): RawRuhsatAnalysisInput {
  return {
    project: {
      analysisDate: null,
      permitApplicationDate: null,
      municipality: null,
      district: null,
      useType: null,
    },
    parcel: {
      areaM2: emptyNumber(),
      taks: emptyNumber(),
      kaks: emptyNumber(),
      maxFloorCount: emptyNumber(),
      maxHeightM: emptyNumber(),
      buildingOrder: null,
      setbacks: {
        frontM: emptyNumber(),
        sideLeftM: emptyNumber(),
        sideRightM: emptyNumber(),
        rearM: emptyNumber(),
      },
      manualGeometryCapacityM2: emptyNumber(),
    },
    program: {
      targetUnitType: null,
      basementIntent: null,
    },
    evidence: { ...noEvidence },
  };
}

assert.deepEqual(parseLocalizedDecimal(null), { state: "empty" });
assert.deepEqual(parseLocalizedDecimal(""), { state: "empty" });
assert.deepEqual(parseLocalizedDecimal("0,40"), { state: "parsed", value: 0.4 });
assert.deepEqual(parseLocalizedDecimal("0.40"), { state: "parsed", value: 0.4 });
assert.deepEqual(parseLocalizedDecimal("1.234,56"), { state: "parsed", value: 1234.56 });
assert.deepEqual(parseLocalizedDecimal("1,234.56"), { state: "parsed", value: 1234.56 });
assert.deepEqual(parseLocalizedDecimal("1 234,56"), { state: "parsed", value: 1234.56 });
assert.deepEqual(parseLocalizedDecimal("1,2,3"), { state: "invalid" });
assert.deepEqual(parseLocalizedDecimal("1e3"), { state: "invalid" });
assert.equal(compareAtInternalPrecision(0.1 + 0.2, 0.3), 0);
assert.equal(compareAtInternalPrecision(0.300002, 0.3), 1);

assert.equal(evaluateConfidence(noEvidence).level, "BELOW_A");
assert.equal(
  evaluateConfidence({ ...noEvidence, hasPlanNotes: true, hasCoordinateParcel: true }).level,
  "BELOW_A",
  "İmar belgesi olmadan ileri kanıtlar güven seviyesini yükseltmemeli"
);
assert.equal(
  evaluateConfidence({ ...noEvidence, hasReadableCurrentZoningDocument: true }).level,
  "A"
);
assert.equal(
  evaluateConfidence({
    ...noEvidence,
    hasReadableCurrentZoningDocument: true,
    hasPlanNotes: true,
    hasCoordinateParcel: true,
  }).level,
  "B"
);
assert.equal(
  evaluateConfidence({
    ...noEvidence,
    hasReadableCurrentZoningDocument: true,
    hasPlanNotes: true,
    hasCoordinateParcel: true,
    hasArchitecturalPreplan: true,
  }).level,
  "C"
);
assert.equal(
  evaluateConfidence({
    ...noEvidence,
    hasReadableCurrentZoningDocument: true,
    hasPlanNotes: true,
    hasCoordinateParcel: true,
    hasArchitecturalPreplan: true,
    hasPermitCalculation: true,
    hasDwg: true,
  }).level,
  "D"
);

const emptyResult = normalizeRuhsatAnalysisInput(blankInput());
assert.equal(emptyResult.ok, true, "Eksik fakat biçimsel olarak geçerli giriş normalize edilebilmeli");
if (emptyResult.ok) {
  assert.equal(emptyResult.value.parcel.areaM2.state, "unknown");
  assert.equal(emptyResult.value.parcel.taks.state, "unknown");
  assert.equal(emptyResult.value.project.analysisDate, null);
  assert.equal(emptyResult.value.confidence.level, "BELOW_A");
}

const partialInput = blankInput();
partialInput.parcel.areaM2 = sourcedNumber("1.234,56");
partialInput.parcel.setbacks.frontM = sourcedNumber("0");
const partialResult = normalizeRuhsatAnalysisInput(partialInput);
assert.equal(partialResult.ok, true);
if (partialResult.ok) {
  assert.deepEqual(partialResult.value.parcel.areaM2, {
    state: "known",
    value: 1234.56,
    rawValue: "1.234,56",
    provenance: {
      status: "REQUIRES_CONFIRMATION",
      sourceId: null,
      note: null,
    },
  });
  assert.equal(partialResult.value.parcel.setbacks.frontM.state, "known");
  if (partialResult.value.parcel.setbacks.frontM.state === "known") {
    assert.equal(partialResult.value.parcel.setbacks.frontM.value, 0, "Sıfır çekme mesafesi unknown olmamalı");
  }
  assert.equal(partialResult.value.parcel.taks.state, "unknown");
}

const impossibleInput = blankInput();
impossibleInput.parcel.areaM2 = sourcedNumber("-1");
impossibleInput.parcel.taks = sourcedNumber("1,01");
impossibleInput.parcel.maxFloorCount = sourcedNumber("3,5");
const impossibleResult = normalizeRuhsatAnalysisInput(impossibleInput);
assert.equal(impossibleResult.ok, false);
if (!impossibleResult.ok) {
  assert(impossibleResult.issues.some((issue) => issue.field === "parcel.areaM2" && issue.code === "OUT_OF_RANGE"));
  assert(impossibleResult.issues.some((issue) => issue.field === "parcel.taks" && issue.code === "OUT_OF_RANGE"));
  assert(impossibleResult.issues.some((issue) => issue.field === "parcel.maxFloorCount" && issue.code === "NOT_INTEGER"));
  assert.equal(impossibleResult.partialValue.parcel.areaM2.state, "unknown");
}

const unsourcedDocumentInput = blankInput();
unsourcedDocumentInput.parcel.kaks = sourcedNumber("1,20", "DOCUMENT");
const unsourcedDocumentResult = normalizeRuhsatAnalysisInput(unsourcedDocumentInput);
assert.equal(unsourcedDocumentResult.ok, false);
assert(
  unsourcedDocumentResult.issues.some((issue) => issue.code === "MISSING_SOURCE_REFERENCE"),
  "BELGE statüsü kaynak kimliği olmadan kabul edilmemeli"
);

const sourcedDocumentInput = blankInput();
sourcedDocumentInput.project.analysisDate = "2026-08-20";
sourcedDocumentInput.project.permitApplicationDate = "2026-07-15";
sourcedDocumentInput.parcel.kaks = sourcedNumber("1,20", "DOCUMENT", "imar-durumu-1");
const firstNormalized = normalizeRuhsatAnalysisInput(sourcedDocumentInput);
const secondNormalized = normalizeRuhsatAnalysisInput(sourcedDocumentInput);
assert.deepEqual(firstNormalized, secondNormalized, "Aynı raw input aynı normalize sonucu üretmeli");
assert.equal(firstNormalized.ok, true);
if (firstNormalized.ok && firstNormalized.value.parcel.kaks.state === "known") {
  assert.equal(firstNormalized.value.parcel.kaks.provenance.status, "DOCUMENT");
  assert.equal(firstNormalized.value.parcel.kaks.provenance.sourceId, "imar-durumu-1");
}

const invalidDateInput = blankInput();
invalidDateInput.project.analysisDate = "2026-02-30";
const invalidDateResult = normalizeRuhsatAnalysisInput(invalidDateInput);
assert.equal(invalidDateResult.ok, false);
assert(invalidDateResult.issues.some((issue) => issue.code === "INVALID_DATE"));

assert.equal(ANALYSIS_SCHEMA_VERSION, "0.3.0");
assert.equal(RULE_SNAPSHOT_VERSION, "tr-ruhsat-rules@2026-08-20");
assert.equal(CURRENT_RULE_SNAPSHOT.releaseStatus, "EXECUTABLE");
assert(CURRENT_RULE_SNAPSHOT.executableRules.length > 0);
assert(CURRENT_RULE_SNAPSHOT.sources.some((source) => source.id === "PAIY_UPDATE_2026_07_01"));
assert(
  CURRENT_RULE_SNAPSHOT.sources.some(
    (source) => source.checkStatus === "OFFICIAL_URL_RECORDED_FETCH_UNAVAILABLE"
  ),
  "Doğrudan doğrulanamayan bağlantılar doğrulanmış gibi işaretlenmemeli"
);

console.log("Ruhsat ön fizibilite Aşama 2 domain doğrulamaları başarılı.");
