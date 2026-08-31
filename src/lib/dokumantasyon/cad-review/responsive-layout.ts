export const CAD_STAGE7_VIEWPORT_MATRIX = [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
] as const;

export const CAD_MOBILE_MAX_WIDTH = 767;
export const CAD_TABLET_MIN_WIDTH = 768;
export const CAD_DESKTOP_MIN_WIDTH = 1100;
export const CAD_COMPACT_DESKTOP_MAX_WIDTH = 1439;
export const CAD_MIN_TOUCH_TARGET_PX = 44;

export type CadResponsiveSurface = "mobile-dock" | "tablet-ribbon" | "desktop-ribbon";

export interface CadResponsiveLayout {
  surface: CadResponsiveSurface;
  compactDesktop: boolean;
  minTouchTargetPx: number;
  reservedTopChromePx: number;
  overlayBottomChromePx: number;
}

export function resolveCadResponsiveLayout(width: number): CadResponsiveLayout {
  const safeWidth = Number.isFinite(width) ? Math.max(0, width) : 0;
  if (safeWidth < CAD_TABLET_MIN_WIDTH) {
    return {
      surface: "mobile-dock",
      compactDesktop: false,
      minTouchTargetPx: CAD_MIN_TOUCH_TARGET_PX,
      reservedTopChromePx: 0,
      overlayBottomChromePx: 56,
    };
  }
  if (safeWidth < CAD_DESKTOP_MIN_WIDTH) {
    return {
      surface: "tablet-ribbon",
      compactDesktop: false,
      minTouchTargetPx: CAD_MIN_TOUCH_TARGET_PX,
      reservedTopChromePx: 56,
      overlayBottomChromePx: 0,
    };
  }
  return {
    surface: "desktop-ribbon",
    compactDesktop: safeWidth <= CAD_COMPACT_DESKTOP_MAX_WIDTH,
    minTouchTargetPx: CAD_MIN_TOUCH_TARGET_PX,
    reservedTopChromePx: safeWidth <= CAD_COMPACT_DESKTOP_MAX_WIDTH ? 48 : 56,
    overlayBottomChromePx: 0,
  };
}

export function clampCadFloatingMenuCoordinate(
  value: number,
  viewportExtent: number,
  halfMenuExtent: number,
  edgePadding = 8
): number {
  if (!Number.isFinite(value)) return edgePadding + halfMenuExtent;
  if (!Number.isFinite(viewportExtent) || viewportExtent <= 0) return value;
  const minimum = edgePadding + Math.max(0, halfMenuExtent);
  const maximum = Math.max(minimum, viewportExtent - edgePadding - Math.max(0, halfMenuExtent));
  return Math.min(maximum, Math.max(minimum, value));
}
