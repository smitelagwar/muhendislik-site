import type { CadPoint2d, CadReviewItemStyle } from "./schema";
import type { CadReviewStore } from "./store";
import type { CadMarkupFacade } from "./markup-facade";
import { findHitReviewItem } from "./hit-test";


export interface CadMarkupRuntime {
  screenToWorld: (screenPoint: { x: number; y: number }) => CadPoint2d | null;
  worldToScreen: (worldPoint: CadPoint2d) => { x: number; y: number } | null;
  setCameraInteractionEnabled?: (enabled: boolean) => void;
  requestCommentInput?: (
    worldPoint: CadPoint2d
  ) => Promise<{ title?: string; comment: string; author?: string } | null>;
  requestTextInput?: (
    worldPoint: CadPoint2d
  ) => Promise<{ text: string; rotationDeg?: number } | null>;
}

export class CadMarkupController {
  private destroyed = false;
  private isPointerDown = false;
  private startScreenPoint: { x: number; y: number } | null = null;
  private startWorldPoint: CadPoint2d | null = null;
  private activeCalloutTip: CadPoint2d | null = null;
  private currentStyle: Partial<CadReviewItemStyle> = {
    color: "#ff3b30",
    strokeWidth: 2,
    opacity: 1,
  };

  constructor(
    private readonly host: HTMLElement,
    private readonly store: CadReviewStore,
    private readonly facade: CadMarkupFacade,
    private readonly runtime: CadMarkupRuntime
  ) {
    this.attach();
  }

  setStyle(style: Partial<CadReviewItemStyle>): void {
    this.currentStyle = { ...this.currentStyle, ...style };
  }

  cancel(): void {
    if (this.destroyed) return;
    this.isPointerDown = false;
    this.startScreenPoint = null;
    this.startWorldPoint = null;
    this.activeCalloutTip = null;
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

  private readonly handlePointerDown = async (e: PointerEvent): Promise<void> => {
    if (this.destroyed || e.button > 0) return;
    const tool = this.store.getSession().activeTool;
    const isMarkupTool =
      tool === "shape_rect" ||
      tool === "shape_circle" ||
      tool === "shape_cloud" ||
      tool === "callout" ||
      tool === "comment_pin" ||
      tool === "text" ||
      tool === "select";
    if (!isMarkupTool) return;

    const screenPt = this.getScreenPoint(e);
    const worldPt = this.runtime.screenToWorld(screenPt);
    if (!worldPt) return;

    if (tool === "select") {
      const hit = findHitReviewItem(this.store.getItems(), screenPt, {
        projectWorldToScreen: (p) => this.runtime.worldToScreen(p),
      });
      if (hit) {
        this.facade.selectItem(hit.id);
      } else {
        this.facade.clearSelection();
      }
      return;
    }

    this.isPointerDown = true;
    this.startScreenPoint = screenPt;
    this.startWorldPoint = worldPt;

    if (
      tool === "shape_rect" ||
      tool === "shape_circle" ||
      tool === "shape_cloud" ||
      tool === "callout"
    ) {
      e.preventDefault();
      this.runtime.setCameraInteractionEnabled?.(false);
    }
  };

  private readonly handlePointerMove = (e: PointerEvent): void => {
    if (this.destroyed) return;
    const tool = this.store.getSession().activeTool;
    const isMarkupTool =
      tool === "shape_rect" ||
      tool === "shape_circle" ||
      tool === "shape_cloud" ||
      tool === "callout" ||
      tool === "comment_pin" ||
      tool === "text" ||
      tool === "select";
    if (!isMarkupTool) return;

    const screenPt = this.getScreenPoint(e);

    if (tool === "select") {
      const hit = findHitReviewItem(this.store.getItems(), screenPt, {
        projectWorldToScreen: (p) => this.runtime.worldToScreen(p),
      });
      this.store.setHoveredItem(hit?.id ?? null);
      return;
    }

    if (!this.isPointerDown || !this.startWorldPoint) return;
    const currentWorldPt = this.runtime.screenToWorld(screenPt);
    if (!currentWorldPt) return;

    if (tool === "shape_rect") {
      this.store.setDraft(tool, {
        type: "shape",
        shapeKind: "rect",
        p1: this.startWorldPoint,
        p2: currentWorldPt,
        style: {
          color: this.currentStyle.color ?? "#007aff",
          strokeWidth: this.currentStyle.strokeWidth ?? 2,
          lineDash: this.currentStyle.lineDash ?? "continuous",
          opacity: this.currentStyle.opacity ?? 1,
          fillColor: this.currentStyle.fillColor,
        },
      });
    } else if (tool === "shape_circle") {
      const radius = Math.hypot(
        currentWorldPt.x - this.startWorldPoint.x,
        currentWorldPt.y - this.startWorldPoint.y
      );
      this.store.setDraft(tool, {
        type: "shape",
        shapeKind: "circle",
        p1: this.startWorldPoint,
        p2: currentWorldPt,
        radius,
        style: {
          color: this.currentStyle.color ?? "#007aff",
          strokeWidth: this.currentStyle.strokeWidth ?? 2,
          lineDash: this.currentStyle.lineDash ?? "continuous",
          opacity: this.currentStyle.opacity ?? 1,
          fillColor: this.currentStyle.fillColor,
        },
      });
    } else if (tool === "shape_cloud") {
      this.store.setDraft(tool, {
        type: "shape",
        shapeKind: "cloud",
        p1: this.startWorldPoint,
        p2: currentWorldPt,
        style: {
          color: this.currentStyle.color ?? "#007aff",
          strokeWidth: this.currentStyle.strokeWidth ?? 2,
          lineDash: this.currentStyle.lineDash ?? "continuous",
          opacity: this.currentStyle.opacity ?? 1,
          fillColor: this.currentStyle.fillColor,
        },
      });
    } else if (tool === "callout") {
      this.store.setDraft(tool, {
        type: "callout",
        tip: this.startWorldPoint,
        anchor: currentWorldPt,
        text: "...",
        style: {
          color: this.currentStyle.color ?? "#ff9500",
          strokeWidth: this.currentStyle.strokeWidth ?? 2,
          lineDash: this.currentStyle.lineDash ?? "continuous",
          opacity: this.currentStyle.opacity ?? 1,
        },
      });
    }
  };

  private readonly handlePointerUp = async (e: PointerEvent): Promise<void> => {
    if (this.destroyed || !this.isPointerDown || !this.startWorldPoint || !this.startScreenPoint) {
      return;
    }

    const tool = this.store.getSession().activeTool;
    const screenPt = this.getScreenPoint(e);
    const endWorldPt = this.runtime.screenToWorld(screenPt);

    this.isPointerDown = false;
    const startWorld = this.startWorldPoint;
    const startScreen = this.startScreenPoint;
    this.startWorldPoint = null;
    this.startScreenPoint = null;
    this.store.clearDraft();
    this.runtime.setCameraInteractionEnabled?.(true);

    if (!endWorldPt) return;

    const screenDx = Math.abs(screenPt.x - startScreen.x);
    const screenDy = Math.abs(screenPt.y - startScreen.y);
    const isDrag = screenDx > 5 || screenDy > 5;

    if (tool === "comment_pin") {
      if (this.runtime.requestCommentInput) {
        const input = await this.runtime.requestCommentInput(startWorld);
        if (input && input.comment.trim()) {
          this.facade.addCommentPin({
            position: startWorld,
            comment: input.comment,
            title: input.title,
            author: input.author,
            style: this.currentStyle,
          });
        }
      }
    } else if (tool === "shape_rect" && isDrag) {
      this.facade.addShape({
        shapeKind: "rect",
        p1: startWorld,
        p2: endWorldPt,
        style: this.currentStyle,
      });
    } else if (tool === "shape_circle" && isDrag) {
      const radius = Math.hypot(endWorldPt.x - startWorld.x, endWorldPt.y - startWorld.y);
      this.facade.addShape({
        shapeKind: "circle",
        p1: startWorld,
        p2: endWorldPt,
        radius,
        style: this.currentStyle,
      });
    } else if (tool === "shape_cloud" && isDrag) {
      this.facade.addShape({
        shapeKind: "cloud",
        p1: startWorld,
        p2: endWorldPt,
        style: this.currentStyle,
      });
    } else if (tool === "callout" && isDrag) {
      if (this.runtime.requestTextInput) {
        const input = await this.runtime.requestTextInput(endWorldPt);
        if (input && input.text.trim()) {
          this.facade.addCallout({
            tip: startWorld,
            anchor: endWorldPt,
            text: input.text,
            style: this.currentStyle,
          });
        }
      }
    } else if (tool === "text") {
      if (this.runtime.requestTextInput) {
        const input = await this.runtime.requestTextInput(startWorld);
        if (input && input.text.trim()) {
          this.facade.addText({
            position: startWorld,
            text: input.text,
            rotationDeg: input.rotationDeg,
            style: this.currentStyle,
          });
        }
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