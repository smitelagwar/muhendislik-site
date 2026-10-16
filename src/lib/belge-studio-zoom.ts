export const MIN_BELGE_ZOOM = 50;
export const MAX_BELGE_ZOOM = 400;
export const BELGE_ZOOM_STEP = 25;
export const BELGE_PREVIEW_MAX_RASTER_PIXELS = 8_000_000;
export const BELGE_PREVIEW_MAX_RASTER_SIDE = 4096;

export function clampBelgeZoom(value: number): number {
  return Math.min(MAX_BELGE_ZOOM, Math.max(MIN_BELGE_ZOOM, value));
}

export function getBelgePreviewRasterScale(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number
): number {
  if (cssWidth <= 0 || cssHeight <= 0) return 1;
  const pixelScale = Math.sqrt(
    BELGE_PREVIEW_MAX_RASTER_PIXELS / (cssWidth * cssHeight)
  );
  const sideScale = Math.min(
    BELGE_PREVIEW_MAX_RASTER_SIDE / cssWidth,
    BELGE_PREVIEW_MAX_RASTER_SIDE / cssHeight
  );
  // Keep both raster caps authoritative for unusually wide or tall templates.
  return Math.max(Number.EPSILON, Math.min(devicePixelRatio || 1, pixelScale, sideScale));
}

export function getBelgeZoomAnchorScroll(input: {
  frameLeft: number;
  frameTop: number;
  nextWidth: number;
  nextHeight: number;
  relativeX: number;
  relativeY: number;
  pointerX: number;
  pointerY: number;
  scrollLeft: number;
  scrollTop: number;
}): { scrollLeft: number; scrollTop: number } {
  return {
    scrollLeft: Math.max(
      0,
      input.frameLeft + input.relativeX * input.nextWidth - input.pointerX
    ),
    scrollTop: Math.max(
      0,
      input.frameTop + input.relativeY * input.nextHeight - input.pointerY
    ),
  };
}
