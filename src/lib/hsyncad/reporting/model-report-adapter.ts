/**
 * Hsyncad Structural Reporting - Model to Single-PDF Report Adapter (QUARANTINED)
 *
 * STATUS: QUARANTINED (Mechanical Safety Quarantine)
 *
 * This legacy adapter is mechanically quarantined. All direct model-to-report
 * calculation and single-PDF generation entrypoints deterministically throw a
 * structured UnsupportedPipelineError.
 *
 * Rules:
 * 1. Zero dynamic rebar synthesis or fabrication.
 * 2. Zero synthetic or zero seismic capacity data approximations.
 * 3. Zero imports or invocations of old analysis.ts or design-engine.ts.
 * 4. Browser-safe fingerprint helpers are preserved.
 * 5. Full P17 remains unimplemented; a new core pipeline worker owns the validated pipeline.
 */

import {
  isSolidElement,
  type CadModel,
  type SolidElement
} from "../model";

export interface UnsupportedPipelineDiagnostic {
  readonly status: "unsupported";
  readonly code: "QUARANTINED_UNVALIDATED_PIPELINE";
  readonly message: string;
  readonly pipeline: "legacy-model-report-adapter";
  readonly details: {
    readonly reason: string;
    readonly requiredAction: string;
    readonly fakeCalculationProhibited: true;
  };
}

export class UnsupportedPipelineError extends Error {
  readonly diagnostic: UnsupportedPipelineDiagnostic;

  constructor(customMessage?: string) {
    const message =
      customMessage ??
      "Direct CadModel-to-Single-PDF reporting pipeline is quarantined and unvalidated. Dynamic rebar synthesis, approximate forces, and synthetic seismic capacity data are strictly prohibited.";
    super(message);
    this.name = "UnsupportedPipelineError";
    this.diagnostic = {
      status: "unsupported",
      code: "QUARANTINED_UNVALIDATED_PIPELINE",
      message,
      pipeline: "legacy-model-report-adapter",
      details: {
        reason:
          "Legacy model-report-adapter attempted unvalidated reinforcement synthesis and seismic capacity approximations.",
        requiredAction:
          "A validated analytical core pipeline must be accepted before report generation can be enabled.",
        fakeCalculationProhibited: true
      }
    };
  }
}

/**
 * Pure TypeScript browser-compatible deterministic string hash (FNV-1a 64-bit style hex digest).
 * Free from node:crypto or Node.js runtime built-ins.
 */
function browserSafeHash(input: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, "0");
  const part2 = (h2 >>> 0).toString(16).padStart(8, "0");
  return `${part1}${part2}`;
}

/**
 * Computes a deterministic browser-safe fingerprint of the model geometry and structural settings.
 */
export function computeModelFingerprint(model: CadModel): string {
  const elementsDigest = model.elements
    .filter(isSolidElement)
    .map((e) => {
      if (e.type === "beam") {
        return `${e.id}:beam:${e.floorId}:${e.width}:${e.height}:${e.start.x},${e.start.y}-${e.end.x},${e.end.y}`;
      }
      if (e.type === "wall") {
        return `${e.id}:wall:${e.floorId}:${e.thickness}:${e.height ?? 0}:${e.start.x},${e.start.y}-${e.end.x},${e.end.y}`;
      }
      if (e.type === "column") {
        return `${e.id}:column:${e.floorId}:${e.width}:${e.depth}:${e.position.x},${e.position.y}`;
      }
      if (e.type === "slab") {
        return `${e.id}:slab:${e.floorId}:${e.thickness}:${(e.points ?? []).map((p) => `${p.x},${p.y}`).join(";")}`;
      }
      return `${(e as SolidElement).id}:${(e as SolidElement).type}:${(e as SolidElement).floorId}`;
    })
    .sort()
    .join("|");

  const settingsDigest = JSON.stringify(model.structural?.settings ?? {});
  const reviewsDigest = JSON.stringify(model.structural?.engineeringReviews ?? {});
  const rev = model.structural?.revision !== undefined ? String(model.structural.revision) : "unversioned";

  return browserSafeHash(`${model.name || "model"}|${rev}|${elementsDigest}|${settingsDigest}|${reviewsDigest}`);
}

/**
 * Verifies whether the analysis result is still valid for the current model state.
 */
export function isAnalysisStale(model: CadModel, analysisFingerprint: string | null): boolean {
  if (!analysisFingerprint) return true;
  return computeModelFingerprint(model) !== analysisFingerprint;
}

/**
 * Returns structured unsupported pipeline diagnostic without throwing.
 */
export function getQuarantinedPipelineDiagnostic(): UnsupportedPipelineDiagnostic {
  return {
    status: "unsupported",
    code: "QUARANTINED_UNVALIDATED_PIPELINE",
    message:
      "Direct CadModel-to-Single-PDF reporting pipeline is quarantined and unvalidated. Dynamic rebar synthesis, approximate forces, and synthetic seismic capacity data are strictly prohibited.",
    pipeline: "legacy-model-report-adapter",
    details: {
      reason:
        "Legacy model-report-adapter attempted unvalidated reinforcement synthesis and seismic capacity approximations.",
      requiredAction:
        "A validated analytical core pipeline must be accepted before report generation can be enabled.",
      fakeCalculationProhibited: true
    }
  };
}

export type ModelProjectReportResult = never;

/**
 * QUARANTINED: Throws UnsupportedPipelineError.
 * Unvalidated synthesis of reinforcement, approximate forces, and seismic capacity data are prohibited.
 */
export function buildExplicitReportInputFromModel(
  _model: CadModel,
  _analysis?: unknown
): never {
  throw new UnsupportedPipelineError(
    "buildExplicitReportInputFromModel is quarantined: unvalidated synthesis of reinforcement, approximate forces, and synthetic seismic capacity data are prohibited."
  );
}

/**
 * QUARANTINED: Throws UnsupportedPipelineError.
 * Direct PDF generation pipeline cannot be invoked.
 */
export function generateModelProjectReport(
  _model: CadModel,
  _analysis?: unknown
): never {
  throw new UnsupportedPipelineError(
    "generateModelProjectReport is quarantined: unvalidated direct PDF generation pipeline cannot be invoked."
  );
}

/**
 * QUARANTINED: Rejects with UnsupportedPipelineError.
 * Unvalidated single-PDF reports cannot be generated or downloaded.
 */
export async function downloadSingleProjectReportPdf(
  _model: CadModel,
  _analysis?: unknown,
  _filename?: string
): Promise<never> {
  throw new UnsupportedPipelineError(
    "downloadSingleProjectReportPdf is quarantined: unvalidated single-PDF reports cannot be generated or downloaded."
  );
}
