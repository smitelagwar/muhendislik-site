import type { CadPoint2d, CadReviewItemStatus } from "./schema";
import type {
  CadActiveMarkupStyle,
  CadCalloutLeaderDirection,
  CadReviewStore,
} from "./store";
import type { CadMarkupFacade } from "./markup-facade";
import { findHitReviewItem } from "./hit-test";
import { clearCurrentCadReviewStore, setCurrentCadReviewStore } from "./active-store";
import { requestCadInlineReviewEditor } from "@/components/dokumantasyon/preview/cad-inline-review-editor-bridge";

export interface CadMarkupRuntime {
  screenToWorld: (screenPoint: { x: number; y: number }) => CadPoint2d | null;
  worldToScreen: (worldPoint: CadPoint2d) => { x: number; y: number } | null;
  setCameraInteractionEnabled?: (enabled: boolean) => void;
}

function constrainCalloutAnchor(
  tip: CadPoint2d,
  anchor: CadPoint2d,
  direction: CadCalloutLeaderDirection | undefined
): CadPoint2d {
  switch (direction) {
    case "right":
      return { x: Math.max(anchor.x, tip.x), y: tip.y };
    case "left":
      return { x: Math.min(anchor.x, tip.x), y: tip.y };
    case "up":
      return { x: tip.x, y: Math.max(anchor.y, tip.y) };
    case "down":
      return { x: tip.x, y: Math.min(anchor.y, tip.y) };
    default:
      return anchor;
  }
}

export class CadMarkupController {
  private destroyed = false;
  private isPointerDown = false;
  private startScreenPoint: { x: number; y: number } | null = null;
  private startWorldPoint: CadPoint2d | null = null;
  private currentStyle: Partial<CadActiveMarkupStyle> = {
    color: "#ff3b30",
    strokeWidth: 2,
    lineDash: "continuous",
    opacity: 1,
    fillOpacity: 0,
    fontSize: 16,
    textRotationDeg: 0,
    calloutLeaderDirection: "free",
  };

  constructor(
    private readonly host: HTMLElement,
    private readonly store: CadReviewStore,
    private readonly facade: CadMarkupFacade,
    private readonly runtime: CadMarkupRuntime
  ) {
    setCurrentCadReviewStore(store);
    this.attach();
  }

  setStyle(style: Partial<CadActiveMarkupStyle>): void {
    this.currentStyle = { ...this.currentStyle, ...style };
  }

  cancel(): void {
    if (this.destroyed) return;
    this.isPointerDown = false;
    this.startScreenPoint = null;
    this.startWorldPoint = null;
    this.store.clearDraft();
    this.runtime.setCameraInteractionEnabled?.(true);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.cancel();
    this.destroyed = true;
    clearCurrentCadReviewStore(this.store);
    this.detach();
  }

  private getScreenPoint(e: PointerEvent): { x: number; y: number } {
    const rect = this.host.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  private itemStyle() {
    return {
      color: this.currentStyle.color ?? "#ff3b30",
      strokeWidth: this.currentStyle.strokeWidth ?? 2,
      lineDash: this.currentStyle.lineDash ?? "continuous",
      opacity: this.currentStyle.opacity ?? 1,
      fillColor: this.currentStyle.fillColor,
      fillOpacity: this.currentStyle.fillOpacity,
      fontSize: this.currentStyle.fontSize,
    };
  }

  private async requestEditor(
    kind: "text" | "callout" | "comment_pin",
    worldPoint: CadPoint2d
  ) {
    const projected = this.runtime.worldToScreen(worldPoint);
    if (!projected) return null;
    const rect = this.host.getBoundingClientRect();
    this.runtime.setCameraInteractionEnabled?.(false);
    try {
      return await requestCadInlineReviewEditor(kind, {
        x: rect.left + projected.x,
        y: rect.top + projected.y,
      });
    } finally {
      this.runtime.setCameraInteractionEnabled?.(true);
    }
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

    const style = this.itemStyle();

    if (tool === "shape_rect") {
      this.store.setDraft(tool, {
        type: "shape",
        shapeKind: "rect",
        p1: this.startWorldPoint,
        p2: currentWorldPt,
        style,
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
        style,
      });
    } else if (tool === "shape_cloud") {
      this.store.setDraft(tool, {
        type: "shape",
        shapeKind: "cloud",
        p1: this.startWorldPoint,
        p2: currentWorldPt,
        style,
      });
    } else if (tool === "callout") {
      const anchor = constrainCalloutAnchor(
        this.startWorldPoint,
        currentWorldPt,
        this.currentStyle.calloutLeaderDirection
      );
      this.store.setDraft(tool, {
        type: "callout",
        tip: this.startWorldPoint,
        anchor,
        text: "...",
        style,
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
    const style = this.itemStyle();

    if (tool === "comment_pin") {
      const input = await this.requestEditor("comment_pin", startWorld);
      if (input?.kind === "comment_pin" && input.comment.trim()) {
        this.facade.addCommentPin({
          position: startWorld,
          comment: input.comment,
          title: input.title,
          status: input.status as CadReviewItemStatus,
          style,
        });
      }
    } else if (tool === "shape_rect" && isDrag) {
      this.facade.addShape({ shapeKind: "rect", p1: startWorld, p2: endWorldPt, style });
    } else if (tool === "shape_circle" && isDrag) {
      const radius = Math.hypot(endWorldPt.x - startWorld.x, endWorldPt.y - startWorld.y);
      this.facade.addShape({ shapeKind: "circle", p1: startWorld, p2: endWorldPt, radius, style });
    } else if (tool === "shape_cloud" && isDrag) {
      this.facade.addShape({ shapeKind: "cloud", p1: startWorld, p2: endWorldPt, style });
    } else if (tool === "callout" && isDrag) {
      const anchor = constrainCalloutAnchor(
        startWorld,
        endWorldPt,
        this.currentStyle.calloutLeaderDirection
      );
      const input = await this.requestEditor("callout", anchor);
      if (input?.kind === "callout" && input.text.trim()) {
        this.facade.addCallout({ tip: startWorld, anchor, text: input.text, style });
      }
    } else if (tool === "text") {
      const input = await this.requestEditor("text", startWorld);
      if (input?.kind === "text" && input.text.trim()) {
        this.facade.addText({
          position: startWorld,
          text: input.text,
          rotationDeg: input.rotationDeg ?? this.currentStyle.textRotationDeg ?? 0,
          style,
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
