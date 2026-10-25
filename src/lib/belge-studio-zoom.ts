export const MIN_BELGE_ZOOM = 50;
export const MAX_BELGE_ZOOM = 400;
export const BELGE_ZOOM_STEP = 25;
export const BELGE_PREVIEW_MAX_RASTER_PIXELS = 8_000_000;
export const BELGE_PREVIEW_MAX_RASTER_SIDE = 4096;

export function clampBelgeZoom(value: number): number {
  return Math.min(MAX_BELGE_ZOOM, Math.max(MIN_BELGE_ZOOM, value));
}

let cachedScrollbarWidth: number | null = null;

export function getBrowserScrollbarWidth(): number {
  if (typeof document === "undefined" || typeof window === "undefined") return 16;
  if (cachedScrollbarWidth !== null) return cachedScrollbarWidth;
  try {
    const outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.overflow = "scroll";
    outer.style.width = "50px";
    outer.style.height = "50px";
    outer.style.position = "absolute";
    outer.style.top = "-9999px";
    document.body.appendChild(outer);
    const inner = document.createElement("div");
    outer.appendChild(inner);
    cachedScrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    document.body.removeChild(outer);
    return cachedScrollbarWidth;
  } catch {
    return 16;
  }
}

export function calculateBelgeFitWidthZoom(input: {
  containerWidth: number;
  containerHeight: number;
  pageWidth: number;
  pageHeight: number;
  hasVerticalScrollbar?: boolean;
  scrollbarWidth?: number;
  padding?: number;
  safetyMargin?: number;
}): number {
  const {
    containerWidth,
    containerHeight,
    pageWidth,
    pageHeight,
    hasVerticalScrollbar = false,
    scrollbarWidth = getBrowserScrollbarWidth(),
    padding = 16,
    safetyMargin = 2,
  } = input;

  if (containerWidth <= 0 || containerHeight <= 0 || pageWidth <= 0 || pageHeight <= 0) {
    return 100;
  }

  const availableWidth = Math.max(1, containerWidth - padding);
  const availableHeight = Math.max(1, containerHeight - padding);
  const fitScale = Math.min(availableWidth / pageWidth, availableHeight / pageHeight);

  if (fitScale <= 0) return 100;

  // Genişliğe tam sığdırma için baz genişlik
  let targetWidth = availableWidth;

  // Dikey taşma kontrolü: Sayfa tam genişlikte açıldığında yüksekliği konteyneri aşacak mı?
  const aspectRatio = pageHeight / pageWidth;
  const expectedHeight = targetWidth * aspectRatio;

  if (expectedHeight > availableHeight) {
    // Dikey scrollbar henüz görünmüyorsa, açılacak olan scrollbar alanını hesaba kat
    if (!hasVerticalScrollbar) {
      targetWidth = Math.max(1, targetWidth - (scrollbarWidth > 0 ? scrollbarWidth : 0));
    }
  }

  // Alt piksel (subpixel) yuvarlama kaynaklı yatay taşmayı kesin olarak önlemek için güvenlik payı
  const safeTargetWidth = Math.max(1, targetWidth - safetyMargin);

  // Zoom %100 iken render edilen genişlik: pageWidth * fitScale
  const widthAt100 = pageWidth * fitScale;
  if (widthAt100 <= 0) return 100;

  const targetZoom = (safeTargetWidth / widthAt100) * 100;
  return clampBelgeZoom(Math.floor(targetZoom));
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
