// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MOBILE GESTURE & ACCESSIBILITY ENGINE
// ============================================================================

import { armSyntheticClickSuppression } from "./mobile-click-suppression";

export type LongPressState = "idle" | "pressing" | "triggered" | "cancelled";

export interface LongPressHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export interface LongPressOptions {
  id: string;
  delayMs?: number; // Varsayılan 500ms
  moveThresholdPx?: number; // Varsayılan 8px (kaydırma toleransı)
  isSelectionModeActive?: boolean;
  onLongPressTrigger: (id: string) => void;
  onSingleTap: (id: string) => void;
}

type PointerLike = {
  clientX: number;
  clientY: number;
  pointerType?: string;
  target?: EventTarget | null;
};

function isInteractivePointerTarget(target: EventTarget | null | undefined): boolean {
  const candidate = target as { closest?: (selector: string) => unknown } | null | undefined;
  if (!candidate || typeof candidate.closest !== "function") return false;
  return Boolean(
    candidate.closest(
      "button, a, input, select, textarea, [contenteditable='true'], [data-no-mobile-gesture]"
    )
  );
}

/**
 * iOS/Android mobile pointer state machine.
 *
 * Product contract:
 * - Row/card tap: one normal open/navigate action.
 * - Scroll: only scroll; no selection and no ghost click.
 * - Long-press: deliberately does NOT enter selection mode.
 * - Explicit child controls (checkbox, menu, links, inputs): parent gesture engine
 *   stays completely idle so the child receives exactly one interaction.
 * - Selection begins only through an explicit selection control already rendered
 *   on each file/folder item.
 */
export function createLongPressController({
  id,
  delayMs = 500,
  moveThresholdPx = 8,
  isSelectionModeActive = false,
  onLongPressTrigger,
  onSingleTap,
}: LongPressOptions) {
  let state: LongPressState = "idle";
  let timer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0;
  let startY = 0;
  let activePointerType: string | null = null;

  // Retained for call-site API compatibility while mobile selection is moved to
  // explicit controls instead of long-press discovery gestures.
  void isSelectionModeActive;
  void onLongPressTrigger;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const handlePointerDown = (e: PointerLike) => {
    // Desktop mouse keeps its existing click/right-click/marquee semantics.
    if (e.pointerType === "mouse") return;

    // A child button/link owns its gesture. Do not let the parent row/card also
    // open, toggle selection, vibrate, or arm a duplicate-click token.
    if (isInteractivePointerTarget(e.target)) return;

    activePointerType = e.pointerType ?? "touch";
    state = "pressing";
    startX = e.clientX;
    startY = e.clientY;

    clearTimer();
    timer = setTimeout(() => {
      if (state === "pressing") {
        // Long-press selection is intentionally disabled. Treat the hold as a
        // cancelled row gesture; release will suppress any compatibility click.
        state = "cancelled";
      }
    }, delayMs);
  };

  const handlePointerMove = (e: { clientX: number; clientY: number }) => {
    if (state !== "pressing") return;

    const deltaX = Math.abs(e.clientX - startX);
    const deltaY = Math.abs(e.clientY - startY);

    if (deltaX > moveThresholdPx || deltaY > moveThresholdPx) {
      state = "cancelled";
      clearTimer();
    }
  };

  const handlePointerUp = () => {
    const shouldSuppressCompatibilityClick =
      activePointerType !== null && activePointerType !== "mouse" && state !== "idle";

    if (shouldSuppressCompatibilityClick) {
      armSyntheticClickSuppression(id);
    }

    if (state === "pressing") {
      clearTimer();
      state = "idle";
      onSingleTap(id);
    } else {
      clearTimer();
      state = "idle";
    }

    activePointerType = null;
  };

  const handlePointerCancel = () => {
    state = "cancelled";
    clearTimer();
    state = "idle";
    activePointerType = null;
  };

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    getState: () => state,
  };
}

/**
 * Mobil Viewport Boyutları Sözleşmesi (Test Matrisi)
 */
export const MOBILE_VIEWPORT_PRESETS = [
  { name: "iPhone SE", width: 320, height: 568, orientation: "portrait" },
  { name: "iPhone SE (Landscape)", width: 568, height: 320, orientation: "landscape" },
  { name: "Galaxy S20", width: 360, height: 800, orientation: "portrait" },
  { name: "iPhone 13/14/15", width: 390, height: 844, orientation: "portrait" },
  { name: "Pixel 7", width: 412, height: 915, orientation: "portrait" },
  { name: "iPad Mini", width: 768, height: 1024, orientation: "portrait" },
  { name: "iPad Pro 10.5 (Landscape)", width: 1024, height: 768, orientation: "landscape" },
] as const;

/**
 * Dokunmatik Hedef Alanı Kontrolü (WCAG 2.5.5 Minimum 44x44 CSS px)
 */
export function isSufficientTouchTarget(widthPx: number, heightPx: number): boolean {
  return widthPx >= 44 && heightPx >= 44;
}
