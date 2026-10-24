export type ShareViewerFit = "width" | "page" | "manual";
export const SHARE_VIEWER_MAX_PIXELS = 8_000_000;
export const SHARE_VIEWER_MAX_DIMENSION = 8192;
export const SHARE_VIEWER_MIN_SCALE = 0.05;
export const SHARE_VIEWER_MAX_SCALE = 4;
export const SHARE_VIEWER_PADDING = 16;

export function clampShareViewerScale(scale: number): number {
  return Math.min(SHARE_VIEWER_MAX_SCALE, Math.max(SHARE_VIEWER_MIN_SCALE, scale));
}

/** CSS geometry is independent of the canvas backing-store budget. */
export function getShareViewerLayout(
  page: { width: number; height: number },
  container: { width: number; height: number },
  fit: ShareViewerFit,
  requestedScale: number,
  devicePixelRatio: number,
) {
  if (![page.width, page.height, container.width, container.height].every((n) => Number.isFinite(n) && n > 0)) {
    throw new Error("INVALID_VIEWER_GEOMETRY");
  }
  const widthFit = Math.max(1, container.width - 2 * SHARE_VIEWER_PADDING) / page.width;
  const heightFit = Math.max(1, container.height - 2 * SHARE_VIEWER_PADDING) / page.height;
  // A fit may legitimately be below the manual zoom minimum on a small screen.
  const scale = fit === "manual" ? clampShareViewerScale(requestedScale)
    : Math.min(SHARE_VIEWER_MAX_SCALE, fit === "width" ? widthFit : Math.min(widthFit, heightFit));
  const width = page.width * scale;
  const height = page.height * scale;
  const dpr = Math.min(
    Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1,
    Math.sqrt(SHARE_VIEWER_MAX_PIXELS / (width * height)),
    SHARE_VIEWER_MAX_DIMENSION / width,
    SHARE_VIEWER_MAX_DIMENSION / height,
  );
  const backingWidth = Math.max(1, Math.floor(width * dpr));
  const backingHeight = Math.max(1, Math.floor(height * dpr));
  return { scale, width, height, backingWidth, backingHeight, pixels: backingWidth * backingHeight };
}

export function formatShareViewerExpiry(value?: string): string | null {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "long", timeStyle: "short" }).format(date)
    : null;
}
