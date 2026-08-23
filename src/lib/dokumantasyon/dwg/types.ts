export type DwgInspectionStatus = "supported" | "unsupported" | "invalid";

export type DwgConversionFailureCode =
  | "EMPTY_INPUT"
  | "TRUNCATED_HEADER"
  | "INVALID_SIGNATURE"
  | "UNSUPPORTED_VERSION"
  | "READ_FAILED"
  | "WRITE_FAILED"
  | "OUTPUT_LIMIT_EXCEEDED"
  | "INVALID_DXF_ENVELOPE";

export type DwgDiagnosticPhase = "read" | "write";

export type DwgDiagnosticCategory =
  | "unsupported-feature"
  | "partial-mapping"
  | "unknown-object"
  | "missing-reference"
  | "library-warning";

export interface DwgVersionInfo {
  magic: string;
  label: string;
  year: number | null;
  verifiedByStage1: boolean;
}

export interface DwgInspection {
  status: DwgInspectionStatus;
  sourceBytes: number;
  magic: string | null;
  version: DwgVersionInfo | null;
  reasonCode: DwgConversionFailureCode | null;
  reason: string | null;
}

export interface DwgDiagnostic {
  phase: DwgDiagnosticPhase;
  category: DwgDiagnosticCategory;
  code: string;
  message: string;
  occurrences: number;
}

export interface DwgReaderProfile {
  failsafe: boolean;
  keepUnknownEntities: boolean;
  keepUnknownNonGraphicalObjects: boolean;
  crcCheck: boolean;
  readSummaryInfo: boolean;
}

export interface DwgWriterProfile {
  binary: false;
  writeAllHeaderVariables: boolean;
  writeOptionalValues: boolean;
  closeStream: boolean;
  resetDxfClasses: boolean;
  updateDimensionsInBlocks: boolean;
  updateDimensionsInModel: boolean;
  writeXData: boolean;
  writeXRecords: boolean;
  writeShapes: boolean;
}

export interface DwgConversionProfile {
  id: string;
  engine: "@node-projects/acad-ts";
  engineVersion: string;
  reader: DwgReaderProfile;
  writer: DwgWriterProfile;
}

export interface DwgConversionOptions {
  initialOutputBytes?: number;
  maxOutputBytes?: number;
}

export interface DwgConversionStats {
  sourceBytes: number;
  outputBytes: number;
  outputCapacityBytes: number;
  outputAttempts: number;
  entityCount: number;
  layerCount: number;
  blockCount: number;
}

export interface DxfEnvelopeInspection {
  hasSection: boolean;
  hasHeader: boolean;
  hasEof: boolean;
  valid: boolean;
}

export interface DwgConversionResult {
  signature: string;
  profile: DwgConversionProfile;
  inspection: DwgInspection;
  dxfBytes: Uint8Array;
  dxfEnvelope: DxfEnvelopeInspection;
  diagnostics: DwgDiagnostic[];
  stats: DwgConversionStats;
}

export class DwgConversionError extends Error {
  public readonly code: DwgConversionFailureCode;
  public readonly inspection: DwgInspection | null;
  public readonly causeValue: unknown;

  public constructor(
    code: DwgConversionFailureCode,
    message: string,
    options?: { inspection?: DwgInspection | null; cause?: unknown }
  ) {
    super(message);
    this.name = "DwgConversionError";
    this.code = code;
    this.inspection = options?.inspection ?? null;
    this.causeValue = options?.cause;
  }
}
