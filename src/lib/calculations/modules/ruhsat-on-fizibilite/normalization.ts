import { evaluateConfidence } from "./confidence";
import { parseLocalizedDecimal } from "./number-parsing";
import {
  PROVENANCE_STATUSES,
  type DomainIssue,
  type DomainResult,
  type DomainValue,
  type NormalizedRuhsatAnalysisInput,
  type ProvenanceStatus,
  type RawRuhsatAnalysisInput,
  type RawSourcedNumericInput,
  type ValueProvenance,
} from "./types";
import { ANALYSIS_SCHEMA_VERSION } from "./versions";

interface NumericConstraint {
  minimum?: number;
  minimumExclusive?: boolean;
  maximum?: number;
  integer?: boolean;
}

const SOURCE_REFERENCE_REQUIRED_STATUSES: readonly ProvenanceStatus[] = [
  "DOCUMENT",
  "CALCULATION",
  "MEASUREMENT",
  "HISTORICAL_RULE",
  "LOCAL_RULE",
  "GEOMETRY_CONFIRMATION",
  "ARCHITECTURAL_CONFIRMATION",
];

function unknown(rawValue: string | null, reason: "MISSING" | "INVALID"): DomainValue<number> {
  return { state: "unknown", reason, rawValue };
}

function isProvenanceStatus(value: unknown): value is ProvenanceStatus {
  return typeof value === "string" && PROVENANCE_STATUSES.includes(value as ProvenanceStatus);
}

function normalizeProvenance(
  provenance: ValueProvenance | null,
  field: string,
  issues: DomainIssue[]
): ValueProvenance | null {
  if (!provenance) {
    issues.push({
      code: "MISSING_PROVENANCE",
      severity: "error",
      field,
      message: "Girilen sayısal değerin kaynak/statü bilgisi eksik.",
    });
    return null;
  }

  if (!isProvenanceStatus(provenance.status)) {
    issues.push({
      code: "INVALID_PROVENANCE",
      severity: "error",
      field,
      message: "Girilen sayısal değerin kaynak/statü bilgisi geçersiz.",
    });
    return null;
  }

  const sourceId = provenance.sourceId?.trim() || null;
  if (SOURCE_REFERENCE_REQUIRED_STATUSES.includes(provenance.status) && !sourceId) {
    issues.push({
      code: "MISSING_SOURCE_REFERENCE",
      severity: "error",
      field,
      message: "Bu kaynak/statü türü için izlenebilir bir kaynak kimliği gerekli.",
    });
    return null;
  }

  return {
    status: provenance.status,
    sourceId,
    note: provenance.note?.trim() || null,
  };
}

function normalizeNumber(
  input: RawSourcedNumericInput,
  field: string,
  constraint: NumericConstraint,
  issues: DomainIssue[]
): DomainValue<number> {
  const safeRawValue = typeof input.rawValue === "string" ? input.rawValue : null;
  const parsed = parseLocalizedDecimal(input.rawValue);

  if (parsed.state === "empty") {
    return unknown(safeRawValue, "MISSING");
  }

  if (parsed.state === "invalid") {
    issues.push({
      code: "INVALID_NUMBER",
      severity: "error",
      field,
      message: "Sayı biçimi geçersiz. 0,40, 0.40 veya 1.234,56 biçimi kullanın.",
    });
    return unknown(safeRawValue, "INVALID");
  }

  if (
    constraint.integer === true &&
    !Number.isInteger(parsed.value)
  ) {
    issues.push({
      code: "NOT_INTEGER",
      severity: "error",
      field,
      message: "Bu alan tam sayı olmalıdır.",
    });
    return unknown(safeRawValue, "INVALID");
  }

  const belowMinimum =
    constraint.minimum !== undefined &&
    (constraint.minimumExclusive
      ? parsed.value <= constraint.minimum
      : parsed.value < constraint.minimum);
  const aboveMaximum = constraint.maximum !== undefined && parsed.value > constraint.maximum;

  if (belowMinimum || aboveMaximum) {
    issues.push({
      code: "OUT_OF_RANGE",
      severity: "error",
      field,
      message: "Girilen değer bu alan için izin verilen aralığın dışında.",
    });
    return unknown(safeRawValue, "INVALID");
  }

  const provenance = normalizeProvenance(input.provenance, field, issues);
  if (!provenance) {
    return unknown(safeRawValue, "INVALID");
  }

  return {
    state: "known",
    value: parsed.value,
    rawValue: safeRawValue?.trim() ?? "",
    provenance,
  };
}

function normalizeText(value: string | null): string | null {
  return value?.trim() || null;
}

function normalizeIsoDate(value: string | null, field: string, issues: DomainIssue[]): string | null {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) {
    issues.push({
      code: "INVALID_DATE",
      severity: "error",
      field,
      message: "Tarih YYYY-AA-GG biçiminde olmalıdır.",
    });
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    issues.push({
      code: "INVALID_DATE",
      severity: "error",
      field,
      message: "Takvimde bulunmayan bir tarih girildi.",
    });
    return null;
  }

  return normalized;
}

export function normalizeRuhsatAnalysisInput(
  raw: RawRuhsatAnalysisInput
): DomainResult<NormalizedRuhsatAnalysisInput> {
  const issues: DomainIssue[] = [];
  const normalized: NormalizedRuhsatAnalysisInput = {
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    project: {
      analysisDate: normalizeIsoDate(raw.project.analysisDate, "project.analysisDate", issues),
      permitApplicationDate: normalizeIsoDate(
        raw.project.permitApplicationDate,
        "project.permitApplicationDate",
        issues
      ),
      municipality: normalizeText(raw.project.municipality),
      district: normalizeText(raw.project.district),
      useType: raw.project.useType,
    },
    parcel: {
      areaM2: normalizeNumber(raw.parcel.areaM2, "parcel.areaM2", { minimum: 0, minimumExclusive: true }, issues),
      taks: normalizeNumber(raw.parcel.taks, "parcel.taks", { minimum: 0, minimumExclusive: true, maximum: 1 }, issues),
      kaks: normalizeNumber(raw.parcel.kaks, "parcel.kaks", { minimum: 0, minimumExclusive: true }, issues),
      maxFloorCount: normalizeNumber(
        raw.parcel.maxFloorCount,
        "parcel.maxFloorCount",
        { minimum: 1, integer: true },
        issues
      ),
      maxHeightM: normalizeNumber(raw.parcel.maxHeightM, "parcel.maxHeightM", { minimum: 0, minimumExclusive: true }, issues),
      buildingOrder: raw.parcel.buildingOrder,
      setbacks: {
        frontM: normalizeNumber(raw.parcel.setbacks.frontM, "parcel.setbacks.frontM", { minimum: 0 }, issues),
        sideLeftM: normalizeNumber(raw.parcel.setbacks.sideLeftM, "parcel.setbacks.sideLeftM", { minimum: 0 }, issues),
        sideRightM: normalizeNumber(raw.parcel.setbacks.sideRightM, "parcel.setbacks.sideRightM", { minimum: 0 }, issues),
        rearM: normalizeNumber(raw.parcel.setbacks.rearM, "parcel.setbacks.rearM", { minimum: 0 }, issues),
      },
      manualGeometryCapacityM2: normalizeNumber(
        raw.parcel.manualGeometryCapacityM2,
        "parcel.manualGeometryCapacityM2",
        { minimum: 0, minimumExclusive: true },
        issues
      ),
    },
    program: {
      targetUnitType: raw.program.targetUnitType,
      basementIntent: raw.program.basementIntent,
    },
    evidence: { ...raw.evidence },
    confidence: evaluateConfidence(raw.evidence),
  };

  if (issues.some((issue) => issue.severity === "error")) {
    return { ok: false, partialValue: normalized, issues };
  }

  return { ok: true, value: normalized, issues };
}
