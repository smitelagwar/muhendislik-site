// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MARQUEE POINTER POLICY
// ============================================================================

/**
 * Desktop marquee selection is intentionally mouse-only.
 * Touch must remain available for native scrolling and pen input must not
 * inherit desktop drag-selection semantics by accident.
 */
export function canStartMarquee(pointerType: string, button: number): boolean {
  return pointerType === "mouse" && button === 0;
}

/**
 * Once a marquee candidate starts, only the exact mouse pointer that started
 * it may move/finalize/cancel that gesture. This prevents a concurrent touch
 * or pen pointer from hijacking or terminating the desktop marquee lifecycle.
 */
export function isActiveMarqueePointer(
  pointerType: string,
  pointerId: number,
  activePointerId: number | null
): boolean {
  return (
    pointerType === "mouse" &&
    activePointerId !== null &&
    pointerId === activePointerId
  );
}
