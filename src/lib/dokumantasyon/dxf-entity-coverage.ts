import {
  DXF_VIEWER_SUPPORTED_ENTITY_TYPES,
  auditDxfText,
  type DxfEntityCensusRow,
} from "./dxf-fidelity-audit";

export type DxfEntityCompatibility = "verified" | "conditional" | "blocked";

export interface DxfEntityCoverageRow {
  type: string;
  count: number;
  compatibility: DxfEntityCompatibility;
  note: string;
}

export interface DxfEntityCoverageAudit {
  encounteredTypeCount: number;
  verifiedTypeCount: number;
  conditionalTypeCount: number;
  blockedTypeCount: number;
  verifiedTypes: string[];
  conditionalTypes: string[];
  blockedTypes: string[];
  unclassifiedSupportedTypes: string[];
  rows: DxfEntityCoverageRow[];
}

const VERIFIED = new Map<string, string>([
  ["LINE", "Chromium/WebGL line geometry regression corpus"],
  ["POLYLINE", "Heavy POLYLINE isolated-layer Chromium regression corpus"],
  ["LWPOLYLINE", "Signed/closed bulge and large-coordinate Chromium regression corpus"],
  ["ARC", "Isolated-layer Chromium regression corpus"],
  ["CIRCLE", "Isolated-layer Chromium regression corpus"],
  ["ELLIPSE", "Isolated-layer Chromium regression corpus"],
  ["POINT", "PDMODE/PDSIZE isolated-layer Chromium regression corpus"],
  ["INSERT", "BLOCK transform/BYBLOCK/layer regression corpus"],
  ["TEXT", "Glyph, rotation, alignment, width-factor and Turkish text Chromium corpus"],
  ["MTEXT", "Multiline/Turkish/format fallback Chromium corpus"],
  ["3DFACE", "Planar 3DFACE isolated-layer Chromium regression corpus"],
  ["SOLID", "SOLID isolated-layer Chromium regression corpus"],
  ["ATTRIB", "Owner/width-factor normalized Chromium regression corpus"],
  ["ATTDEF", "Constant ATTDEF worker normalization Chromium regression corpus"],
]);

const CONDITIONAL = new Map<string, string>([
  ["SPLINE", "Only control-point, unweighted, open/non-periodic, default-OCS subset is accepted"],
  ["DIMENSION", "Native linear/aligned or resolved ready dimension-block subset; other dimension types fail closed"],
  ["HATCH", "Non-gradient, non-empty, supported boundary-edge subset; risky HATCH variants fail closed"],
]);

export function getDxfEntityCompatibility(type: string): { compatibility: DxfEntityCompatibility; note: string } {
  const normalized = type.trim().toUpperCase();
  const verifiedNote = VERIFIED.get(normalized);
  if (verifiedNote) return { compatibility: "verified", note: verifiedNote };
  const conditionalNote = CONDITIONAL.get(normalized);
  if (conditionalNote) return { compatibility: "conditional", note: conditionalNote };
  return {
    compatibility: "blocked",
    note: "No renderer fidelity contract exists; visible/reachable instances must fail closed.",
  };
}

function toCoverageRow(row: DxfEntityCensusRow): DxfEntityCoverageRow {
  const policy = getDxfEntityCompatibility(row.type);
  return {
    type: row.type,
    count: row.count,
    compatibility: policy.compatibility,
    note: policy.note,
  };
}

export function auditDxfEntityCoverage(text: string): DxfEntityCoverageAudit {
  const audit = auditDxfText(text);
  const rows = audit.entityCensus.map(toCoverageRow);
  const typesFor = (compatibility: DxfEntityCompatibility) =>
    rows.filter((row) => row.compatibility === compatibility).map((row) => row.type).sort();

  const unclassifiedSupportedTypes = [...DXF_VIEWER_SUPPORTED_ENTITY_TYPES]
    .filter((type) => !VERIFIED.has(type) && !CONDITIONAL.has(type))
    .sort();

  return {
    encounteredTypeCount: rows.length,
    verifiedTypeCount: rows.filter((row) => row.compatibility === "verified").length,
    conditionalTypeCount: rows.filter((row) => row.compatibility === "conditional").length,
    blockedTypeCount: rows.filter((row) => row.compatibility === "blocked").length,
    verifiedTypes: typesFor("verified"),
    conditionalTypes: typesFor("conditional"),
    blockedTypes: typesFor("blocked"),
    unclassifiedSupportedTypes,
    rows,
  };
}

export function getDxfEntityCoveragePolicySummary(): {
  verified: string[];
  conditional: string[];
  rendererSupported: string[];
} {
  return {
    verified: [...VERIFIED.keys()].sort(),
    conditional: [...CONDITIONAL.keys()].sort(),
    rendererSupported: [...DXF_VIEWER_SUPPORTED_ENTITY_TYPES].sort(),
  };
}
