import type { CadPoint2d, CadReviewItem, CadReviewItemStyle } from "./schema";
import type { CadReviewStore } from "./store";
import { translateMarkupItem, type CadMarkupFacade } from "./markup-facade";
import { findHitReviewItem } from "./hit-test";
import type { CadReviewTool } from "./store";


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
  /** Optional review-only filter; source CAD entities are never hit-tested. */
  isItemVisible?: (item: CadReviewItem) => boolean;
  isItemReadOnly?: (item: CadReviewItem) => boolean;
  onError?: (reason: string) => void;
}

export class CadMarkupController {
  private destroyed = false;
  private generation = 0;
  private pointerId: number | null = null;
  private downTool: CadReviewTool | null = null;
  private startScreenPoint: CadPoint2d | null = null;
  private startWorldPoint: CadPoint2d | null = null;
  private movingItemId: string | null = null;
  private moved = false;
  private currentStyle: Partial<CadReviewItemStyle> = {
    color: "#ff3b30", strokeWidth: 2, opacity: 1,
  };

  constructor(
    private readonly host: HTMLElement,
    private readonly store: CadReviewStore,
    private readonly facade: CadMarkupFacade,
    private readonly runtime: CadMarkupRuntime
  ) { this.attach(); }

  setStyle(style: Partial<CadReviewItemStyle>): void {
    this.currentStyle = { ...this.currentStyle, ...style };
  }

  cancel(): void {
    if (this.destroyed) return;
    this.generation += 1;
    this.resetPointer();
    this.store.clearDraft();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.cancel();
    this.destroyed = true;
    this.detach();
  }

  private resetPointer(): void {
    const previousId = this.pointerId;
    this.pointerId = null;
    this.downTool = null;
    this.startScreenPoint = null;
    this.startWorldPoint = null;
    this.movingItemId = null;
    this.moved = false;
    if (previousId !== null) {
      try {
        if (this.host.hasPointerCapture?.(previousId)) this.host.releasePointerCapture(previousId);
      } catch { /* browser may release capture on its own */ }
    }
    this.runtime.setCameraInteractionEnabled?.(true);
  }

  private getScreenPoint(e: PointerEvent): CadPoint2d {
    const rect = this.host.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private findHit(point: CadPoint2d): CadReviewItem | null {
    return findHitReviewItem(this.store.getItems(), point, {
      projectWorldToScreen: this.runtime.worldToScreen,
      activeLayoutId: this.store.getSession().activeLayoutId,
      isVisible: this.runtime.isItemVisible,
      selectedItemIds: this.store.getSession().selectedItemIds,
      tolerancePx: 10,
    });
  }

  private canMove(item: CadReviewItem): boolean {
    return item.status !== "closed" && !this.runtime.isItemReadOnly?.(item) &&
      translateMarkupItem(item, 0, 0) !== null;
  }

  private makeDraft(tool: CadReviewTool, from: CadPoint2d, to: CadPoint2d): void {
    const style = {
      color: this.currentStyle.color ?? "#007aff",
      strokeWidth: this.currentStyle.strokeWidth ?? 2,
      lineDash: this.currentStyle.lineDash ?? "continuous",
      fillColor: this.currentStyle.fillColor,
      opacity: this.currentStyle.opacity ?? 1,
    };
    if (tool === "shape_rect" || tool === "shape_cloud") {
      this.store.setDraft(tool, {
        type: "shape", shapeKind: tool === "shape_rect" ? "rect" : "cloud",
        p1: from, p2: to, style,
      });
    } else if (tool === "shape_circle") {
      const radius = Math.hypot(to.x - from.x, to.y - from.y);
      this.store.setDraft(tool, {
        type: "shape", shapeKind: "circle",
        p1: from, p2: to, radius, style,
      });
    } else if (tool === "callout") {
      this.store.setDraft(tool, {
        type: "callout", tip: from, anchor: to, text: "…", style,
      });
    }
  }

  private readonly handlePointerDown = (e: PointerEvent): void => {
    if (this.destroyed || (e.pointerType !== "touch" && e.button !== 0)) return;
    if (e.isPrimary === false) {
      if (this.pointerId !== null) this.cancel();
      return;
    }
    const tool = this.store.getSession().activeTool;
    if (!["select", "shape_rect", "shape_circle", "shape_cloud", "callout", "comment_pin", "text"].includes(tool)) return;
    if (this.pointerId !== null) return;
    const screen = this.getScreenPoint(e);
    const world = this.runtime.screenToWorld(screen);
    if (!world || !Number.isFinite(world.x) || !Number.isFinite(world.y)) return;

    if (tool === "select") {
      const hit = this.findHit(screen);
      if (e.shiftKey) {
        if (hit) this.facade.toggleItemSelection(hit.id);
        return; // Shift toggles multiple review selections; no accidental drag.
      }
      if (!hit) {
        this.facade.clearSelection();
        return; // empty source canvas retains pan behavior.
      }
      this.facade.selectItem(hit.id);
      if (!this.canMove(hit)) return; // selectable read-only/measurement item, no move handles.
      this.movingItemId = hit.id;
    }

    this.pointerId = e.pointerId;
    this.downTool = tool;
    this.startScreenPoint = screen;
    this.startWorldPoint = world;
    this.moved = false;
    const isShape = tool === "shape_rect" || tool === "shape_circle" ||
      tool === "shape_cloud" || tool === "callout";
    if (isShape || this.movingItemId) {
      e.preventDefault();
      this.runtime.setCameraInteractionEnabled?.(false);
      try { this.host.setPointerCapture?.(e.pointerId); } catch { /* no capture support */ }
    }
  };

  private readonly handlePointerMove = (e: PointerEvent): void => {
    if (this.destroyed) return;
    const screen = this.getScreenPoint(e);
    const tool = this.store.getSession().activeTool;
    if (tool === "select" && this.pointerId === null) {
      this.store.setHoveredItem(this.findHit(screen)?.id ?? null);
      return;
    }
    if (this.pointerId !== e.pointerId || tool !== this.downTool ||
        !this.startScreenPoint || !this.startWorldPoint) return;
    const movedPx = Math.hypot(screen.x - this.startScreenPoint.x, screen.y - this.startScreenPoint.y);
    if (movedPx < 5) return;
    const world = this.runtime.screenToWorld(screen);
    if (!world || !Number.isFinite(world.x) || !Number.isFinite(world.y)) return;
    this.moved = true;
    if (tool === "select" && this.movingItemId) {
      const item = this.store.getItems().find(v => v.id === this.movingItemId);
      if (!item || !this.canMove(item)) return;
      const moved = translateMarkupItem(item, world.x - this.startWorldPoint.x, world.y - this.startWorldPoint.y);
      if (moved) this.store.setDraft("select", moved);
      return;
    }
    this.makeDraft(tool, this.startWorldPoint, world);
  };

  private safelyCommit(operation: () => unknown): void {
    try {
      operation();
    } catch (error) {
      this.runtime.onError?.(error instanceof Error ? error.message : "İşaretleme kaydedilemedi.");
    }
  }

  private readonly handlePointerUp = async (e: PointerEvent): Promise<void> => {
    if (this.destroyed || this.pointerId !== e.pointerId ||
        !this.startScreenPoint || !this.startWorldPoint || !this.downTool) return;
    const screen = this.getScreenPoint(e);
    const startScreen = this.startScreenPoint;
    const start = this.startWorldPoint;
    const tool = this.downTool;
    const movingId = this.movingItemId;
    const currentTool = this.store.getSession().activeTool;
    const world = this.runtime.screenToWorld(screen);
    const movedPx = Math.hypot(screen.x - startScreen.x, screen.y - startScreen.y);
    const generation = ++this.generation;
    this.resetPointer();
    this.store.clearDraft();

    if (!world || !Number.isFinite(world.x) || !Number.isFinite(world.y) ||
        Math.abs(world.x) > 1e9 || Math.abs(world.y) > 1e9 ||
        currentTool !== tool || this.destroyed) return;
    if (tool === "select") {
      if (movingId && movedPx >= 5) {
        const item = this.store.getItems().find(v => v.id === movingId);
        if (item && this.canMove(item)) {
          this.facade.moveItem(movingId, world.x - start.x, world.y - start.y);
        }
      }
      return;
    }
    if (tool === "shape_rect" || tool === "shape_cloud" || tool === "shape_circle") {
      if (movedPx < 5) return;
      const dx = world.x - start.x, dy = world.y - start.y;
      if (!Number.isFinite(dx) || !Number.isFinite(dy) ||
          (tool !== "shape_circle" && (Math.abs(dx) <= 1e-9 || Math.abs(dy) <= 1e-9)) ||
          (tool === "shape_circle" && Math.hypot(dx, dy) <= 1e-9)) return;
      this.safelyCommit(() => this.facade.addShape({
        shapeKind: tool === "shape_rect" ? "rect" : tool === "shape_circle" ? "circle" : "cloud",
        p1: start, p2: world,
        radius: tool === "shape_circle" ? Math.hypot(dx, dy) : undefined,
        style: this.currentStyle,
      }));
      return;
    }
    if (tool === "callout" && movedPx >= 5 && this.runtime.requestTextInput) {
      const input = await this.runtime.requestTextInput(world);
      if (this.destroyed || this.generation !== generation ||
          this.store.getSession().activeTool !== tool) return;
      if (input?.text.trim()) this.safelyCommit(() => this.facade.addCallout({
        tip: start, anchor: world, text: input.text, style: this.currentStyle,
      }));
    } else if (tool === "comment_pin" && movedPx < 5 && this.runtime.requestCommentInput) {
      const input = await this.runtime.requestCommentInput(start);
      if (this.destroyed || this.generation !== generation ||
          this.store.getSession().activeTool !== tool) return;
      if (input?.comment.trim()) this.safelyCommit(() => this.facade.addCommentPin({
        position: start, comment: input.comment, title: input.title,
        author: input.author, style: this.currentStyle,
      }));
    } else if (tool === "text" && movedPx < 5 && this.runtime.requestTextInput) {
      const input = await this.runtime.requestTextInput(start);
      if (this.destroyed || this.generation !== generation ||
          this.store.getSession().activeTool !== tool) return;
      if (input?.text.trim()) this.safelyCommit(() => this.facade.addText({
        position: start, text: input.text, rotationDeg: input.rotationDeg,
        style: this.currentStyle,
      }));
    }
  };

  private readonly handlePointerCancel = (e: PointerEvent): void => {
    if (this.pointerId === e.pointerId) this.cancel();
  };
  private readonly handleLostPointerCapture = (e: PointerEvent): void => {
    // Normal lostcapture follows pointerup and must not undo committed geometry.
    if (this.pointerId === e.pointerId) this.cancel();
  };
  private readonly handleWindowBlur = (): void => {
    if (this.pointerId !== null) this.cancel();
  };
  private readonly handleVisibilityChange = (): void => {
    if (document.hidden && this.pointerId !== null) this.cancel();
  };
  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (this.destroyed || e.isComposing || e.key !== "Escape") return;
    if (this.pointerId !== null || this.store.getDraft().draftItem) this.cancel();
  };

  private attach(): void {
    // Capture before CAD canvas input handlers to reserve markup drag/select
    // without racing the underlying pan tool.
    this.host.addEventListener("pointerdown", this.handlePointerDown, { capture: true, passive: false });
    this.host.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    this.host.addEventListener("pointerup", this.handlePointerUp, { passive: false });
    this.host.addEventListener("pointercancel", this.handlePointerCancel);
    this.host.addEventListener("lostpointercapture", this.handleLostPointerCapture);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("blur", this.handleWindowBlur);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }
  private detach(): void {
    this.host.removeEventListener("pointerdown", this.handlePointerDown, true);
    this.host.removeEventListener("pointermove", this.handlePointerMove);
    this.host.removeEventListener("pointerup", this.handlePointerUp);
    this.host.removeEventListener("pointercancel", this.handlePointerCancel);
    this.host.removeEventListener("lostpointercapture", this.handleLostPointerCapture);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("blur", this.handleWindowBlur);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  }
}
