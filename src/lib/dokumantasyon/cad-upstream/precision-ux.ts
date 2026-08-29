import type { CadSnapMode, CadSnapPoint } from "./snap-engine";

export const CAD_PRECISION_MAGNIFIER_DIAMETER_PX = 152;
export const CAD_PRECISION_MAGNIFIER_ZOOM = 2.75;
export const CAD_PRECISION_MAGNIFIER_GAP_PX = 28;
export const CAD_PRECISION_EDGE_MARGIN_PX = 12;

export const CAD_SNAP_MODE_LABELS: Record<CadSnapMode, string> = {
  endpoint: "Endpoint",
  midpoint: "Midpoint",
  intersection: "Intersection",
  center: "Center",
  nearest: "Nearest",
};

export interface CadPrecisionViewportSize {
  width: number;
  height: number;
}

export interface CadPrecisionLensPlacement {
  left: number;
  top: number;
  side: "fixed-top-right";
}

export interface CadMagnifierCrop {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  targetX: number;
  targetY: number;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.max(min, Math.min(max, value));
}

export function resolveCadPrecisionLensPlacement(
  _pointer: CadSnapPoint,
  viewport: CadPrecisionViewportSize,
  diameter = CAD_PRECISION_MAGNIFIER_DIAMETER_PX
): CadPrecisionLensPlacement {
  const margin = CAD_PRECISION_EDGE_MARGIN_PX;
  return {
    left: Math.max(margin, viewport.width - diameter - margin),
    top: margin,
    side: "fixed-top-right",
  };
}

export function resolveCadMagnifierCrop(
  target: CadSnapPoint,
  cssSize: CadPrecisionViewportSize,
  backingSize: CadPrecisionViewportSize,
  diameter = CAD_PRECISION_MAGNIFIER_DIAMETER_PX,
  zoom = CAD_PRECISION_MAGNIFIER_ZOOM
): CadMagnifierCrop | null {
  if (
    !(cssSize.width > 0) ||
    !(cssSize.height > 0) ||
    !(backingSize.width > 0) ||
    !(backingSize.height > 0) ||
    !(diameter > 0) ||
    !(zoom > 0)
  ) {
    return null;
  }

  const scaleX = backingSize.width / cssSize.width;
  const scaleY = backingSize.height / cssSize.height;
  if (!(scaleX > 0) || !(scaleY > 0)) return null;

  const sourceCssSize = diameter / zoom;
  const sw = Math.min(backingSize.width, sourceCssSize * scaleX);
  const sh = Math.min(backingSize.height, sourceCssSize * scaleY);
  const targetBackingX = target.x * scaleX;
  const targetBackingY = target.y * scaleY;
  const sx = clamp(targetBackingX - sw / 2, 0, Math.max(0, backingSize.width - sw));
  const sy = clamp(targetBackingY - sh / 2, 0, Math.max(0, backingSize.height - sh));

  return {
    sx,
    sy,
    sw,
    sh,
    targetX: clamp(((targetBackingX - sx) / sw) * diameter, 0, diameter),
    targetY: clamp(((targetBackingY - sy) / sh) * diameter, 0, diameter),
  };
}

export function cadPrecisionOffsetDistance(
  pointer: CadSnapPoint,
  target: CadSnapPoint
): number {
  return Math.hypot(pointer.x - target.x, pointer.y - target.y);
}
