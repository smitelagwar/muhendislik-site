export const CAD_V2_PAINTER_PAGE_MAX_STYLES_CAP = 2_048;
export const CAD_V2_PAINTER_PAGE_FALLBACK_STYLES = 512;

/** Keeps the line-style texture within WebGL2's per-context texture-height limit. */
export function getCadV2PainterPageMaxStyles(maxTextureSize: number | null | undefined): number {
  if (!Number.isSafeInteger(maxTextureSize) || (maxTextureSize ?? 0) < 3) {
    return CAD_V2_PAINTER_PAGE_FALLBACK_STYLES;
  }
  return Math.max(1, Math.min(
    CAD_V2_PAINTER_PAGE_MAX_STYLES_CAP,
    Math.floor(maxTextureSize! / 3),
  ));
}
