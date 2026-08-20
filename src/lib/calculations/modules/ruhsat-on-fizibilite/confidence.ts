import type { ConfidenceAssessment, ConfidenceEvidence } from "./types";

export function evaluateConfidence(evidence: ConfidenceEvidence): ConfidenceAssessment {
  if (evidence.hasReadableCurrentZoningDocument !== true) {
    return {
      level: "BELOW_A",
      missingForNextLevel: ["hasReadableCurrentZoningDocument"],
      reasonCode: "CURRENT_ZONING_DOCUMENT_REQUIRED",
    };
  }

  const levelBRequirements = [
    !evidence.hasPlanNotes ? "hasPlanNotes" : null,
    !evidence.hasCoordinateParcel ? "hasCoordinateParcel" : null,
  ].filter((key): key is "hasPlanNotes" | "hasCoordinateParcel" => key !== null);

  if (levelBRequirements.length > 0) {
    return {
      level: "A",
      missingForNextLevel: levelBRequirements,
      reasonCode: "PLAN_NOTES_AND_COORDINATE_PARCEL_REQUIRED",
    };
  }

  if (evidence.hasArchitecturalPreplan !== true) {
    return {
      level: "B",
      missingForNextLevel: ["hasArchitecturalPreplan"],
      reasonCode: "ARCHITECTURAL_PREPLAN_REQUIRED",
    };
  }

  const levelDRequirements = [
    !evidence.hasPermitCalculation ? "hasPermitCalculation" : null,
    !evidence.hasDwg ? "hasDwg" : null,
  ].filter((key): key is "hasPermitCalculation" | "hasDwg" => key !== null);

  if (levelDRequirements.length > 0) {
    return {
      level: "C",
      missingForNextLevel: levelDRequirements,
      reasonCode: "PERMIT_CALCULATION_AND_DWG_REQUIRED",
    };
  }

  return {
    level: "D",
    missingForNextLevel: [],
    reasonCode: "HIGHEST_DEFINED_LEVEL",
  };
}
