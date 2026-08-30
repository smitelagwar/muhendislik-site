import type { CadSnapPoint } from "../cad-upstream/snap-engine";

export interface CadRegionBox {
  min: { x: number; y: number };
  max: { x: number; y: number };
}

export interface CadRegionSelectionCallbacks {
  onRegionChange?: (region: CadRegionBox | null) => void;
  onComplete?: (region: CadRegionBox) => void;
  onCancel?: () => void;
}

export interface CadRegionSelectionRuntime {
  screenToWorld: (screenPoint: CadSnapPoint) => CadSnapPoint | null;
  setCameraInteractionEnabled?: (enabled: boolean) => void;
}

export class CadRegionSelectionController {
  private destroyed = false;
  private isActive = false;
  private startPoint: CadSnapPoint | null = null;
  private currentPoint: CadSnapPoint | null = null;
  private callbacks: CadRegionSelectionCallbacks = {};

  constructor(
    private readonly host: HTMLElement,
    private readonly runtime: CadRegionSelectionRuntime
  ) {
    this.attach();
  }

  start(callbacks?: CadRegionSelectionCallbacks): void {
    if (this.destroyed) return;
    this.isActive = true;
    this.startPoint = null;
    this.currentPoint = null;
    this.callbacks = callbacks ?? {};
    this.runtime.setCameraInteractionEnabled?.(false);
  }

  cancel(notify = true): void {
    if (this.destroyed) return;
    const wasActive = this.isActive;
    this.isActive = false;
    this.startPoint = null;
    this.currentPoint = null;
    this.runtime.setCameraInteractionEnabled?.(true);
    if (notify && wasActive) {
      this.callbacks.onCancel?.();
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.cancel(false);
    this.destroyed = true;
    this.detach();
  }

  private getScreenPoint(e: PointerEvent): CadSnapPoint {
    const rect = this.host.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private readonly handlePointerDown = (e: PointerEvent): void => {
    if (this.destroyed || !this.isActive || e.button > 0) return;
    e.preventDefault();
    this.startPoint = this.getScreenPoint(e);
    this.currentPoint = this.startPoint;
  };

  private readonly handlePointerMove = (e: PointerEvent): void => {
    if (this.destroyed || !this.isActive || !this.startPoint) return;
    this.currentPoint = this.getScreenPoint(e);

    const worldP1 = this.runtime.screenToWorld(this.startPoint);
    const worldP2 = this.runtime.screenToWorld(this.currentPoint);

    if (worldP1 && worldP2) {
      const box: CadRegionBox = {
        min: {
          x: Math.min(worldP1.x, worldP2.x),
          y: Math.min(worldP1.y, worldP2.y),
        },
        max: {
          x: Math.max(worldP1.x, worldP2.x),
          y: Math.max(worldP1.y, worldP2.y),
        },
      };
      this.callbacks.onRegionChange?.(box);
    }
  };

  private readonly handlePointerUp = (e: PointerEvent): void => {
    if (this.destroyed || !this.isActive || !this.startPoint) return;
    this.currentPoint = this.getScreenPoint(e);

    const screenDx = Math.abs(this.currentPoint.x - this.startPoint.x);
    const screenDy = Math.abs(this.currentPoint.y - this.startPoint.y);

    // Minimum 20 CSS pixels drag standard to prevent accidental micro-clicks
    if (screenDx < 20 && screenDy < 20) {
      this.cancel(true);
      return;
    }

    const worldP1 = this.runtime.screenToWorld(this.startPoint);
    const worldP2 = this.runtime.screenToWorld(this.currentPoint);

    this.isActive = false;
    this.startPoint = null;
    this.currentPoint = null;
    this.runtime.setCameraInteractionEnabled?.(true);

    if (worldP1 && worldP2) {
      const box: CadRegionBox = {
        min: {
          x: Math.min(worldP1.x, worldP2.x),
          y: Math.min(worldP1.y, worldP2.y),
        },
        max: {
          x: Math.max(worldP1.x, worldP2.x),
          y: Math.max(worldP1.y, worldP2.y),
        },
      };
      this.callbacks.onComplete?.(box);
    } else {
      this.callbacks.onCancel?.();
    }
  };

  private readonly handlePointerCancel = (): void => {
    if (this.destroyed || !this.isActive) return;
    this.cancel(true);
  };

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (this.destroyed || !this.isActive) return;
    if (e.key === "Escape") {
      e.preventDefault();
      this.cancel(true);
    }
  };

  private attach(): void {
    this.host.addEventListener("pointerdown", this.handlePointerDown, { passive: false });
    this.host.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    this.host.addEventListener("pointerup", this.handlePointerUp, { passive: false });
    this.host.addEventListener("pointercancel", this.handlePointerCancel, { passive: true });
    window.addEventListener("keydown", this.handleKeyDown);
  }

  private detach(): void {
    this.host.removeEventListener("pointerdown", this.handlePointerDown);
    this.host.removeEventListener("pointermove", this.handlePointerMove);
    this.host.removeEventListener("pointerup", this.handlePointerUp);
    this.host.removeEventListener("pointercancel", this.handlePointerCancel);
    window.removeEventListener("keydown", this.handleKeyDown);
  }
}