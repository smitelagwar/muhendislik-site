import type { CadPoint2d } from "./schema";
import type { CadActiveMarkupStyle, CadReviewStore } from "./store";
import type { CadMarkupFacade } from "./markup-facade";
import { filterClosePoints, simplifyPointsRdp } from "./stroke-simplifier";

export interface CadFreehandRuntime {
  screenToWorld: (screenPoint: { x: number; y: number }) => CadPoint2d | null;
  worldToScreen: (worldPoint: CadPoint2d) => { x: number; y: number } | null;
  setCameraInteractionEnabled?: (enabled: boolean) => void;
}

export class CadFreehandController {
  private destroyed = false;
  private isDrawing = false;
  private rawPoints: CadPoint2d[] = [];
  private currentStyle: Partial<CadActiveMarkupStyle> = {
    color: "#ff3b30",
    strokeWidth: 2,
    lineDash: "continuous",
    opacity: 1,
    eraserRadiusPx: 16,
  };
  private readonly maxPoints = 5000;
  private readonly simplificationEpsilon = 1.5;

  constructor(
    private readonly host: HTMLElement,
    private readonly store: CadReviewStore,
    private readonly facade: CadMarkupFacade,
    private readonly runtime: CadFreehandRuntime
  ) {
    this.attach();
  }

  setStyle(style: Partial<CadActiveMarkupStyle>): void {
    this.currentStyle = { ...this.currentStyle, ...style };
  }

  cancel(): void {
    if (this.destroyed) return;
    this.isDrawing = false;
    this.rawPoints = [];
    this.store.clearDraft();
    this.runtime.setCameraInteractionEnabled?.(true);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.cancel();
    this.destroyed = true;
    this.detach();
  }

  private getScreenPoint(e: PointerEvent): { x: number; y: number } {
    const rect = this.host.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private eraseAt(screenPoint: { x: number; y: number }): void {
    this.facade.eraseItemAtPoint(
      screenPoint,
      this.runtime.worldToScreen,
      this.currentStyle.eraserRadiusPx ?? 16
    );
  }

  private readonly handlePointerDown = (e: PointerEvent): void => {
    if (this.destroyed || e.button > 0) return;
    const tool = this.store.getSession().activeTool;
    const screenPt = this.getScreenPoint(e);

    if (tool === "eraser") {
      e.preventDefault();
      this.isDrawing = true;
      this.runtime.setCameraInteractionEnabled?.(false);
      this.eraseAt(screenPt);
      return;
    }

    if (tool !== "stroke") return;

    const worldPt = this.runtime.screenToWorld(screenPt);
    if (!worldPt) return;

    e.preventDefault();
    this.isDrawing = true;
    this.rawPoints = [worldPt];
    this.runtime.setCameraInteractionEnabled?.(false);

    this.store.setDraft("stroke", {
      type: "stroke",
      points: [worldPt],
      smooth: true,
      style: {
        color: this.currentStyle.color ?? "#ff3b30",
        strokeWidth: this.currentStyle.strokeWidth ?? 2,
        lineDash: this.currentStyle.lineDash ?? "continuous",
        opacity: this.currentStyle.opacity ?? 1,
        fillColor: this.currentStyle.fillColor,
        fillOpacity: this.currentStyle.fillOpacity,
      },
    });
  };

  private readonly handlePointerMove = (e: PointerEvent): void => {
    if (this.destroyed || !this.isDrawing) return;
    const tool = this.store.getSession().activeTool;
    const screenPt = this.getScreenPoint(e);

    if (tool === "eraser") {
      this.eraseAt(screenPt);
      return;
    }

    if (tool !== "stroke") return;

    const coalesced: PointerEvent[] =
      typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [e];

    let lastPoint = this.rawPoints[this.rawPoints.length - 1];

    for (const subEvent of coalesced) {
      if (this.rawPoints.length >= this.maxPoints) break;
      const subScreenPt = this.getScreenPoint(subEvent);
      const subWorldPt = this.runtime.screenToWorld(subScreenPt);
      if (!subWorldPt) continue;

      if (!lastPoint) {
        this.rawPoints.push(subWorldPt);
        lastPoint = subWorldPt;
      } else {
        const dx = subWorldPt.x - lastPoint.x;
        const dy = subWorldPt.y - lastPoint.y;
        if (dx * dx + dy * dy >= 1.0) {
          this.rawPoints.push(subWorldPt);
          lastPoint = subWorldPt;
        }
      }
    }

    this.store.setDraft("stroke", {
      type: "stroke",
      points: [...this.rawPoints],
      smooth: true,
      style: {
        color: this.currentStyle.color ?? "#ff3b30",
        strokeWidth: this.currentStyle.strokeWidth ?? 2,
        lineDash: this.currentStyle.lineDash ?? "continuous",
        opacity: this.currentStyle.opacity ?? 1,
        fillColor: this.currentStyle.fillColor,
        fillOpacity: this.currentStyle.fillOpacity,
      },
    });
  };

  private readonly handlePointerUp = (e: PointerEvent): void => {
    if (this.destroyed || !this.isDrawing) return;
    const tool = this.store.getSession().activeTool;
    const screenPt = this.getScreenPoint(e);

    this.isDrawing = false;
    this.runtime.setCameraInteractionEnabled?.(true);

    if (tool === "eraser") {
      this.eraseAt(screenPt);
      return;
    }

    if (tool !== "stroke") return;

    const finalWorldPt = this.runtime.screenToWorld(screenPt);
    if (finalWorldPt && this.rawPoints.length > 0) {
      const last = this.rawPoints[this.rawPoints.length - 1]!;
      const dx = finalWorldPt.x - last.x;
      const dy = finalWorldPt.y - last.y;
      if (dx * dx + dy * dy >= 0.5) {
        this.rawPoints.push(finalWorldPt);
      }
    }

    const filtered = filterClosePoints(this.rawPoints, 1.0);
    this.rawPoints = [];
    this.store.clearDraft();

    if (filtered.length >= 2) {
      const simplified = simplifyPointsRdp(filtered, this.simplificationEpsilon);
      if (simplified.length >= 2) {
        this.facade.addStroke({
          points: simplified,
          smooth: true,
          style: {
            color: this.currentStyle.color,
            strokeWidth: this.currentStyle.strokeWidth,
            lineDash: this.currentStyle.lineDash,
            opacity: this.currentStyle.opacity,
          },
        });
      }
    }
  };

  private readonly handlePointerCancel = (): void => {
    this.cancel();
  };

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (this.destroyed) return;
    if (e.key === "Escape") {
      this.cancel();
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
