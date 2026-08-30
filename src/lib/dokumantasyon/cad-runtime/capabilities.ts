export interface CadPreviewCapabilities {
  readOnly: boolean;
  distanceMeasure: boolean;
  areaMeasure: boolean;
  layers: boolean;
  fit: boolean;
}

export interface CadReviewCapabilities {
  readOnly: true;
  worldTransform: boolean;
  stableViewEvents: boolean;
  activeLayoutIdentity: boolean;
  entityTraversal: boolean;
  textExtraction: boolean;
  entityBounds: boolean;
  snap: boolean;
  reviewOverlay: boolean;
  reviewSelection: boolean;
  originalDownload: boolean;
  composedRasterExport: boolean;
  reviewDxfExport: boolean;
  combinedDxfExport: boolean;
  trueDwgExport: boolean;
}

export const UPSTREAM_PRIMARY_CAPABILITIES: Readonly<CadPreviewCapabilities> = Object.freeze({
  readOnly: true,
  distanceMeasure: true,
  areaMeasure: true,
  layers: true,
  fit: true,
});

export const LEGACY_FALLBACK_CAPABILITIES: Readonly<CadPreviewCapabilities> = Object.freeze({
  readOnly: true,
  distanceMeasure: false,
  areaMeasure: false,
  layers: false,
  fit: true,
});

export const UPSTREAM_REVIEW_CAPABILITIES: Readonly<CadReviewCapabilities> = Object.freeze({
  readOnly: true,
  worldTransform: true,
  stableViewEvents: true,
  activeLayoutIdentity: true,
  entityTraversal: true,
  textExtraction: true,
  entityBounds: true,
  snap: true,
  reviewOverlay: true,
  reviewSelection: true,
  originalDownload: true,
  composedRasterExport: true,
  reviewDxfExport: true,
  combinedDxfExport: false,
  trueDwgExport: false,
});

export const LEGACY_REVIEW_CAPABILITIES: Readonly<CadReviewCapabilities> = Object.freeze({
  readOnly: true,
  worldTransform: false,
  stableViewEvents: false,
  activeLayoutIdentity: false,
  entityTraversal: false,
  textExtraction: false,
  entityBounds: false,
  snap: false,
  reviewOverlay: false,
  reviewSelection: false,
  originalDownload: true,
  composedRasterExport: false,
  reviewDxfExport: false,
  combinedDxfExport: false,
  trueDwgExport: false,
});

export const APS_REVIEW_CAPABILITIES: Readonly<CadReviewCapabilities> = Object.freeze({
  readOnly: true,
  worldTransform: false,
  stableViewEvents: false,
  activeLayoutIdentity: false,
  entityTraversal: false,
  textExtraction: false,
  entityBounds: false,
  snap: false,
  reviewOverlay: false,
  reviewSelection: false,
  originalDownload: true,
  composedRasterExport: false,
  reviewDxfExport: false,
  combinedDxfExport: false,
  trueDwgExport: false,
});

export function resolveCadPreviewCapabilities(engine: "upstream" | "legacy" | "aps"): CadPreviewCapabilities {
  if (engine === "upstream") {
    return { ...UPSTREAM_PRIMARY_CAPABILITIES };
  }
  return { ...LEGACY_FALLBACK_CAPABILITIES };
}

export function resolveCadReviewCapabilities(engine: "upstream" | "legacy" | "aps"): CadReviewCapabilities {
  if (engine === "upstream") {
    return { ...UPSTREAM_REVIEW_CAPABILITIES };
  }
  if (engine === "aps") {
    return { ...APS_REVIEW_CAPABILITIES };
  }
  return { ...LEGACY_REVIEW_CAPABILITIES };
}
