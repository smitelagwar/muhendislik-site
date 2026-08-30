import type { CadSnapPoint } from "../cad-upstream/snap-engine";
import type { CadReviewTool } from "./store";

export interface CadPointerRouterCallbacks {
  onPointerDown?(point: CadSnapPoint, originalEvent: PointerEvent): void;
  onPointerMove?(point: CadSnapPoint, originalEvent: PointerEvent): void;
  onPointerUp?(point: CadSnapPoint, originalEvent: PointerEvent): void;
  onPointerCancel?(originalEvent: PointerEvent): void;
}

export class CadPointerRouter {
  private destroyed = false;
  private currentCaptureHandler: CadPointerRouterCallbacks | null = null;
  private readonly listeners: Array<() => void> = [];

  constructor(
    private readonly host: HTMLElement,
    private readonly getActiveTool: () => CadReviewTool
  ) {
    this.attach();
  }

  // Allow high-priority controllers (e.g. native distance or area controller) to capture events
  setCaptureHandler(handler: CadPointerRouterCallbacks | null): void {
    if (this.destroyed) return;
    if (this.currentCaptureHandler && !handler) {
      // Release capture
      this.currentCaptureHandler = null;
      return;
    }
    this.currentCaptureHandler = handler;
  }

  private attach(): void {
    const handleDown = (e: PointerEvent) => {
      if (this.destroyed) return;
      const tool = this.getActiveTool();
      const rect = this.host.getBoundingClientRect();
      const pt: CadSnapPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      if (this.currentCaptureHandler?.onPointerDown) {
        this.currentCaptureHandler.onPointerDown(pt, e);
        return;
      }

      if (tool !== "select") {
        // Pointer down handled by tool
      }
    };

    const handleMove = (e: PointerEvent) => {
      if (this.destroyed) return;
      const rect = this.host.getBoundingClientRect();
      const pt: CadSnapPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      if (this.currentCaptureHandler?.onPointerMove) {
        this.currentCaptureHandler.onPointerMove(pt, e);
      }
    };

    const handleUp = (e: PointerEvent) => {
      if (this.destroyed) return;
      const rect = this.host.getBoundingClientRect();
      const pt: CadSnapPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      if (this.currentCaptureHandler?.onPointerUp) {
        this.currentCaptureHandler.onPointerUp(pt, e);
      }
    };

    const handleCancel = (e: PointerEvent) => {
      if (this.destroyed) return;
      if (this.currentCaptureHandler?.onPointerCancel) {
        this.currentCaptureHandler.onPointerCancel(e);
      }
    };

    this.host.addEventListener("pointerdown", handleDown, { passive: false });
    this.host.addEventListener("pointermove", handleMove, { passive: true });
    this.host.addEventListener("pointerup", handleUp, { passive: false });
    this.host.addEventListener("pointercancel", handleCancel, { passive: true });

    this.listeners.push(
      () => this.host.removeEventListener("pointerdown", handleDown),
      () => this.host.removeEventListener("pointermove", handleMove),
      () => this.host.removeEventListener("pointerup", handleUp),
      () => this.host.removeEventListener("pointercancel", handleCancel)
    );
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.currentCaptureHandler = null;
    for (const remove of this.listeners) {
      remove();
    }
    this.listeners.length = 0;
  }
}