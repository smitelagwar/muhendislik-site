import type { CadPoint2d, CadReviewItemStyle } from "./schema";
import type { CadReviewStore } from "./store";
import type { CadMarkupFacade } from "./markup-facade";
import { simplifyStrokeSamples, type CadStrokeSample } from "./stroke-simplifier";

export interface CadFreehandRuntime {
  screenToWorld: (screenPoint: CadPoint2d) => CadPoint2d | null;
  worldToScreen: (worldPoint: CadPoint2d) => CadPoint2d | null;
  setCameraInteractionEnabled?: (enabled: boolean) => void;
  onError?: (reason: string) => void;
}

/** Independent review strokes only. Never modifies CAD source model space. */
export class CadFreehandController {
  private destroyed = false;
  private pointerId: number | null = null;
  private downTool: "stroke" | "eraser" | null = null;
  private rawSamples: CadStrokeSample[] = [];
  private eraserIds = new Set<string>();
  private draftFrame: number | null = null;
  private currentStyle: Partial<CadReviewItemStyle> = {
    color: "#ff3b30", strokeWidth: 2, opacity: 1,
  };
  private capturedStyle: Partial<CadReviewItemStyle> = {};
  private readonly maxPoints = 5000;

  constructor(
    private readonly host: HTMLElement,
    private readonly store: CadReviewStore,
    private readonly facade: CadMarkupFacade,
    private readonly runtime: CadFreehandRuntime
  ) { this.attach(); }

  setStyle(style: Partial<CadReviewItemStyle>): void {
    this.currentStyle = { ...this.currentStyle, ...style };
  }

  cancel(): void {
    if (this.destroyed) return;
    this.endGesture();
    this.store.clearDraft();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.cancel();
    this.destroyed = true;
    this.detach();
  }

  private endGesture(): void {
    const pointer = this.pointerId;
    this.pointerId = null;
    this.downTool = null;
    this.rawSamples = [];
    this.eraserIds.clear();
    if (this.draftFrame !== null) {
      if (typeof window !== "undefined" && window.cancelAnimationFrame) {
        window.cancelAnimationFrame(this.draftFrame);
      }
      this.draftFrame = null;
    }
    if (pointer !== null) {
      try {
        if (this.host.hasPointerCapture?.(pointer)) this.host.releasePointerCapture(pointer);
      } catch { /* capture already released */ }
    }
    this.runtime.setCameraInteractionEnabled?.(true);
  }

  private screen(e: PointerEvent): CadPoint2d {
    const rect = this.host.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private addSample(e: PointerEvent, forceLast = false): void {
    if (this.rawSamples.length >= this.maxPoints) return;
    const screen = this.screen(e);
    if (!Number.isFinite(screen.x) || !Number.isFinite(screen.y)) return;
    const world = this.runtime.screenToWorld(screen);
    if (!world || !Number.isFinite(world.x) || !Number.isFinite(world.y) ||
        Math.abs(world.x) > 1e9 || Math.abs(world.y) > 1e9) return;
    const last = this.rawSamples[this.rawSamples.length - 1];
    if (last) {
      const distancePx = Math.hypot(screen.x - last.screen.x, screen.y - last.screen.y);
      if (distancePx < (forceLast ? 0.25 : 0.9)) return;
    }
    this.rawSamples.push({ screen, world: { ...world } });
  }

  private draftStyle(): CadReviewItemStyle {
    return {
      color: this.capturedStyle.color ?? "#ff3b30",
      strokeWidth: this.capturedStyle.strokeWidth ?? 2,
      lineDash: this.capturedStyle.lineDash ?? "continuous",
      opacity: this.capturedStyle.opacity ?? 1,
      fillColor: this.capturedStyle.fillColor,
    };
  }

  private flushDraft(): void {
    this.draftFrame = null;
    if (this.destroyed || this.pointerId === null || this.downTool !== "stroke") return;
    // Never store drafts in history. Only one render notification per animation frame.
    this.store.setDraft("stroke", {
      type: "stroke",
      points: this.rawSamples.map((sample) => sample.world),
      smooth: true,
      style: this.draftStyle(),
    });
  }

  private scheduleDraft(): void {
    if (this.draftFrame !== null) return;
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      this.draftFrame = window.requestAnimationFrame(() => this.flushDraft());
    } else {
      this.flushDraft();
    }
  }

  private collectEraserItem(e: PointerEvent): void {
    const id = this.facade.findErasableItemAtPoint(this.screen(e), this.runtime.worldToScreen);
    if (id) this.eraserIds.add(id);
  }

  private readonly handlePointerDown = (e: PointerEvent): void => {
    if (this.destroyed) return;
    if (e.isPrimary === false) {
      if (this.pointerId !== null) this.cancel();
      return;
    }
    if (this.pointerId !== null || (e.pointerType !== "touch" && e.button !== 0)) return;
    const tool = this.store.getSession().activeTool;
    if (tool !== "stroke" && tool !== "eraser") return;
    this.pointerId = e.pointerId;
    this.downTool = tool;
    this.capturedStyle = { ...this.currentStyle };
    this.rawSamples = [];
    this.eraserIds.clear();
    e.preventDefault();
    this.runtime.setCameraInteractionEnabled?.(false);
    try { this.host.setPointerCapture?.(e.pointerId); } catch { /* unsupported */ }

    if (tool === "eraser") this.collectEraserItem(e);
    else {
      this.addSample(e);
      this.scheduleDraft();
    }
  };

  private readonly handlePointerMove = (e: PointerEvent): void => {
    if (this.destroyed || this.pointerId !== e.pointerId || this.downTool === null) return;
    if (this.store.getSession().activeTool !== this.downTool) {
      this.cancel();
      return;
    }
    if (this.downTool === "eraser") {
      this.collectEraserItem(e);
      return;
    }
    const coalesced = typeof e.getCoalescedEvents === "function"
      ? e.getCoalescedEvents() : [];
    for (const sample of coalesced.length ? coalesced : [e]) {
      if (this.rawSamples.length >= this.maxPoints) break;
      this.addSample(sample);
    }
    this.addSample(e);
    this.scheduleDraft();
  };

  private readonly handlePointerUp = (e: PointerEvent): void => {
    if (this.destroyed || this.pointerId !== e.pointerId || !this.downTool) return;
    const tool = this.downTool;
    const validTool = this.store.getSession().activeTool === tool;
    if (validTool && tool === "stroke") this.addSample(e, true);
    if (validTool && tool === "eraser") this.collectEraserItem(e);
    const samples = this.rawSamples;
    const erasedIds = [...this.eraserIds];
    const style = this.capturedStyle;
    this.endGesture();
    this.store.clearDraft();
    if (!validTool) return;
    if (tool === "eraser") {
      // A complete eraser gesture is one undoable transaction.
      if (erasedIds.length) this.store.removeItems(erasedIds);
      return;
    }
    const points = simplifyStrokeSamples(samples, 1.5, 0.9);
    // Closed loops are valid: require at least one distinct vertex, not distinct endpoints.
    if (points.length >= 2 && points.some((p) =>
      Math.hypot(p.x - points[0]!.x, p.y - points[0]!.y) > 1e-9)) {
      try {
        this.facade.addStroke({ points, smooth: true, style });
      } catch (error) {
        this.runtime.onError?.(error instanceof Error ? error.message : "Eskiz kaydedilemedi.");
      }
    }
  };

  private readonly handlePointerCancel = (e: PointerEvent): void => {
    if (this.pointerId === e.pointerId) this.cancel();
  };
  private readonly handleLostPointerCapture = (e: PointerEvent): void => {
    if (this.pointerId === e.pointerId) this.cancel();
  };
  private readonly handleBlur = (): void => {
    if (this.pointerId !== null) this.cancel();
  };
  private readonly handleVisibility = (): void => {
    if (document.hidden && this.pointerId !== null) this.cancel();
  };
  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.destroyed && e.key === "Escape" && this.pointerId !== null) this.cancel();
  };

  private attach(): void {
    this.host.addEventListener("pointerdown", this.handlePointerDown, { capture: true, passive: false });
    this.host.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    this.host.addEventListener("pointerup", this.handlePointerUp, { passive: false });
    this.host.addEventListener("pointercancel", this.handlePointerCancel);
    this.host.addEventListener("lostpointercapture", this.handleLostPointerCapture);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("blur", this.handleBlur);
    document.addEventListener("visibilitychange", this.handleVisibility);
  }
  private detach(): void {
    this.host.removeEventListener("pointerdown", this.handlePointerDown, true);
    this.host.removeEventListener("pointermove", this.handlePointerMove);
    this.host.removeEventListener("pointerup", this.handlePointerUp);
    this.host.removeEventListener("pointercancel", this.handlePointerCancel);
    this.host.removeEventListener("lostpointercapture", this.handleLostPointerCapture);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("blur", this.handleBlur);
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }
}
