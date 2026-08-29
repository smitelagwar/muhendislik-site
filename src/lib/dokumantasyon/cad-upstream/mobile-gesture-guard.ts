export type CadMobileGestureGuardCallbacks = {
  onMultiTouchStart: () => void;
};

/**
 * Keeps single-pointer CAD interactions separate from two-finger navigation.
 *
 * The guard observes touch pointers without stopping propagation, so the
 * upstream OrbitControls implementation still receives the complete two-touch
 * sequence for pinch/pan. When the second touch arrives, consumers can abort
 * any pending one-finger command before either finger is released.
 */
export class CadMobileGestureGuard {
  private readonly activeTouchPointers = new Set<number>();
  private multiTouchActive = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly callbacks: CadMobileGestureGuardCallbacks
  ) {
    host.addEventListener("pointerdown", this.handlePointerDown, true);
    host.addEventListener("pointerup", this.handlePointerEnd, true);
    host.addEventListener("pointercancel", this.handlePointerEnd, true);
    host.addEventListener("lostpointercapture", this.handlePointerEnd, true);
  }

  get isMultiTouchActive(): boolean {
    return this.multiTouchActive;
  }

  destroy(): void {
    this.host.removeEventListener("pointerdown", this.handlePointerDown, true);
    this.host.removeEventListener("pointerup", this.handlePointerEnd, true);
    this.host.removeEventListener("pointercancel", this.handlePointerEnd, true);
    this.host.removeEventListener("lostpointercapture", this.handlePointerEnd, true);
    this.activeTouchPointers.clear();
    this.multiTouchActive = false;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== "touch") return;

    this.activeTouchPointers.add(event.pointerId);
    if (this.activeTouchPointers.size < 2 || this.multiTouchActive) return;

    this.multiTouchActive = true;
    this.callbacks.onMultiTouchStart();
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    if (event.pointerType !== "touch") return;

    this.activeTouchPointers.delete(event.pointerId);
    if (this.activeTouchPointers.size < 2) {
      this.multiTouchActive = false;
    }
  };
}
