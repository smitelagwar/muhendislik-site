// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — MOBILE GESTURE & ACCESSIBILITY ENGINE
// ============================================================================

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

/**
 * 500ms iOS/Android Long-Press State Machine
 * - 8px kayma olduğunda timer iptal edilir (doğal scroll'a izin verilir)
 * - 500ms dolmadan pointerup gelirse timer iptal edilir ve tekil tık işlenir
 * - 500ms dolduğunda seçim modu tetiklenir ve haptik titreşim verilir
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

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const handlePointerDown = (e: { clientX: number; clientY: number; pointerType?: string }) => {
    // Mouse için long-press gerekmez (sağ tık veya ctrl-click kullanılır)
    if (e.pointerType === "mouse") return;

    state = "pressing";
    startX = e.clientX;
    startY = e.clientY;

    clearTimer();
    timer = setTimeout(() => {
      if (state === "pressing") {
        state = "triggered";
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate(40);
          } catch {
            // titreşim hatasında sessizce geç
          }
        }
        onLongPressTrigger(id);
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
    if (state === "pressing") {
      clearTimer();
      state = "idle";
      // 500ms dolmadan bırakıldı -> normal tap
      onSingleTap(id);
    } else {
      clearTimer();
      state = "idle";
    }
  };

  const handlePointerCancel = () => {
    state = "cancelled";
    clearTimer();
    state = "idle";
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
