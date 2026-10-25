/**
 * Safe, pure mathematical calculations for intelligent 2-axis PDF field center navigation.
 *
 * Architecture rules:
 * - Pure functions only: no DOM mutation, no window/document references in calculations.
 * - Zoom invariant: calculations NEVER modify, suggest or require changes to zoomLevel.
 * - Dynamic scroll padding: calculates required surface padding so edge/corner fields can reach exact center.
 * - Subpixel accuracy: calculates subpixel deltas with <= 2px tolerance contract.
 */

export type FieldFocusRectLike = {
  left: number; // 0..1 relative to page width
  top: number; // 0..1 relative to page height
  width: number; // 0..1 relative to page width
  height: number; // 0..1 relative to page height
};

export type ContainerMetrics = {
  left: number; // getBoundingClientRect().left
  top: number; // getBoundingClientRect().top
  clientWidth: number;
  clientHeight: number;
  clientLeft: number;
  clientTop: number;
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
  scrollHeight: number;
};

export type FrameMetrics = {
  left: number; // getBoundingClientRect().left
  top: number; // getBoundingClientRect().top
  width: number;
  height: number;
};

export type CalculateFieldCenterParams = {
  container: ContainerMetrics;
  frame: FrameMetrics;
  fieldRect: FieldFocusRectLike;
  sheetOverlap?: number;
};

export type CalculateFieldCenterResult = {
  fieldCenterX: number;
  fieldCenterY: number;
  viewportCenterX: number;
  viewportCenterY: number;
  deltaX: number;
  deltaY: number;
  targetScrollLeft: number;
  targetScrollTop: number;
  isAlreadyCentered: boolean;
};

/**
 * Calculates the exact scroll coordinates to place the geometric center
 * of a PDF field at the visible center of the preview scrollport.
 */
export function calculateBelgeFieldCenterScroll(
  params: CalculateFieldCenterParams
): CalculateFieldCenterResult {
  const { container, frame, fieldRect, sheetOverlap = 0 } = params;

  // Field geometric center in client coordinates
  const fieldCenterX = frame.left + (fieldRect.left + fieldRect.width / 2) * frame.width;
  const fieldCenterY = frame.top + (fieldRect.top + fieldRect.height / 2) * frame.height;

  // Effective visible height accounting for mobile sheet overlap
  const effectiveClientHeight = Math.max(1, container.clientHeight - sheetOverlap);

  // Viewport geometric center in client coordinates
  const viewportCenterX =
    container.left + container.clientLeft + container.clientWidth / 2;
  const viewportCenterY =
    container.top + container.clientTop + effectiveClientHeight / 2;

  const deltaX = fieldCenterX - viewportCenterX;
  const deltaY = fieldCenterY - viewportCenterY;

  const targetScrollLeft = Math.round(container.scrollLeft + deltaX);
  const targetScrollTop = Math.round(container.scrollTop + deltaY);

  const isAlreadyCentered = Math.abs(deltaX) <= 2 && Math.abs(deltaY) <= 2;

  return {
    fieldCenterX,
    fieldCenterY,
    viewportCenterX,
    viewportCenterY,
    deltaX,
    deltaY,
    targetScrollLeft,
    targetScrollTop,
    isAlreadyCentered,
  };
}

/**
 * Calculates the focus padding required on the surface to allow any point
 * (including top-left (0,0) and bottom-right (1,1)) to reach viewport center
 * without being constrained by native scroll container bounds.
 */
export function calculateFocusPadding(containerWidth: number, containerHeight: number): {
  padX: number;
  padY: number;
} {
  return {
    padX: Math.max(8, Math.ceil(containerWidth)),
    padY: Math.max(8, Math.ceil(containerHeight)),
  };
}

/**
 * Ease-out cubic curve for natural, responsive centering animation without overshoot.
 * Starts with rapid initial movement and decelerates smoothly into the target center.
 * f(0) = 0, f(1) = 1. Monotonic.
 */
export function easeOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * Calculates scroll compensation when surface padding is applied or removed.
 * Prevents any visible content jump during two-phase layout modification.
 */
export function calculatePaddingCompensation(
  prevFrameRect: { left: number; top: number },
  newFrameRect: { left: number; top: number }
): {
  shiftX: number;
  shiftY: number;
} {
  return {
    shiftX: newFrameRect.left - prevFrameRect.left,
    shiftY: newFrameRect.top - prevFrameRect.top,
  };
}
