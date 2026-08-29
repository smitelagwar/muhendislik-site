export interface CadPreviewCapabilities {
  readOnly: boolean;
  distanceMeasure: boolean;
  areaMeasure: boolean;
  layers: boolean;
  fit: boolean;
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

export function resolveCadPreviewCapabilities(engine: "upstream" | "legacy" | "aps"): CadPreviewCapabilities {
  if (engine === "upstream") {
    return { ...UPSTREAM_PRIMARY_CAPABILITIES };
  }
  return { ...LEGACY_FALLBACK_CAPABILITIES };
}
