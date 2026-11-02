import type {
  CadSnapCandidate,
  CadSnapMode,
  CadSnapPoint,
} from "./snap-engine";

export function pointDistance(a: CadSnapPoint, b: CadSnapPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export type CadChainDistancePhase =
  | "inactive"
  | "awaiting-first"
  | "awaiting-next"
  | "complete";

export interface CadChainDistanceSnapshot {
  readonly phase: CadChainDistancePhase;
  readonly points: readonly CadSnapPoint[];
  readonly previewPoint: CadSnapPoint | null;
  readonly previewSnap: CadSnapCandidate | null;
  readonly segmentDistances: readonly number[];
  readonly totalDistance: number;
}

export interface CadChainDistanceResult {
  readonly points: readonly CadSnapPoint[];
  readonly segmentDistances: readonly number[];
  readonly totalDistance: number;
}

export interface CadChainDistanceCallbacks {
  readonly onSnapshot?: (snapshot: CadChainDistanceSnapshot | null) => void;
  readonly onComplete?: (result: CadChainDistanceResult) => void;
  readonly onCancel?: () => void;
}

export interface CadChainDistanceRuntime {
  readonly resolvePoint: (
    screenPoint: CadSnapPoint,
    snapModes: ReadonlySet<CadSnapMode>,
    options?: { originPoint?: CadSnapPoint | null }
  ) => { point: CadSnapPoint; snap: CadSnapCandidate | null } | null;
  readonly projectWorldPoint?: (point: CadSnapPoint) => CadSnapPoint | null;
  readonly setCameraInteractionEnabled?: (enabled: boolean) => void;
}

export class CadChainDistanceMachine {
  private phaseValue: CadChainDistancePhase = "inactive";
  private pointsValue: CadSnapPoint[] = [];
  private previewPointValue: CadSnapPoint | null = null;
  private previewSnapValue: CadSnapCandidate | null = null;

  get phase(): CadChainDistancePhase {
    return this.phaseValue;
  }

  get isActive(): boolean {
    return this.phaseValue === "awaiting-first" || this.phaseValue === "awaiting-next";
  }

  get points(): readonly CadSnapPoint[] {
    return this.pointsValue;
  }

  start(): CadChainDistanceSnapshot {
    this.phaseValue = "awaiting-first";
    this.pointsValue = [];
    this.previewPointValue = null;
    this.previewSnapValue = null;
    return this.snapshot();
  }

  addPoint(point: CadSnapPoint): CadChainDistanceSnapshot {
    if (this.phaseValue !== "awaiting-first" && this.phaseValue !== "awaiting-next") return this.snapshot();

    // Epsilon check: avoid duplicate consecutive points (< 1e-4 distance)
    const last = this.pointsValue[this.pointsValue.length - 1];
    if (last && pointDistance(last, point) < 1e-4) {
      return this.snapshot();
    }

    this.pointsValue.push({ x: point.x, y: point.y });
    this.previewPointValue = null;
    this.previewSnapValue = null;
    this.phaseValue = "awaiting-next";
    return this.snapshot();
  }

  removeLastPoint(): CadChainDistanceSnapshot {
    if (this.pointsValue.length <= 1) {
      this.pointsValue = [];
      this.phaseValue = "awaiting-first";
    } else {
      this.pointsValue.pop();
    }
    return this.snapshot();
  }

  updatePreview(
    preview: { point: CadSnapPoint; snap: CadSnapCandidate | null } | null
  ): CadChainDistanceSnapshot {
    if (this.phaseValue === "inactive" || this.phaseValue === "complete") {
      return this.snapshot();
    }
    this.previewPointValue = preview ? { x: preview.point.x, y: preview.point.y } : null;
    this.previewSnapValue = preview?.snap ?? null;
    return this.snapshot();
  }

  complete(): { snapshot: CadChainDistanceSnapshot; result: CadChainDistanceResult | null } {
    if (!this.isActive) return { snapshot: this.snapshot(), result: null };
    if (this.pointsValue.length < 2) {
      this.phaseValue = "inactive";
      this.pointsValue = [];
      this.previewPointValue = null;
      this.previewSnapValue = null;
      return { snapshot: this.snapshot(), result: null };
    }

    this.phaseValue = "complete";
    this.previewPointValue = null;
    this.previewSnapValue = null;
    const snap = this.snapshot();
    const result: CadChainDistanceResult = {
      points: [...this.pointsValue],
      segmentDistances: [...snap.segmentDistances],
      totalDistance: snap.totalDistance,
    };
    return { snapshot: snap, result };
  }

  cancel(): CadChainDistanceSnapshot {
    this.phaseValue = "inactive";
    this.pointsValue = [];
    this.previewPointValue = null;
    this.previewSnapValue = null;
    return this.snapshot();
  }

  snapshot(): CadChainDistanceSnapshot {
    const segmentDistances: number[] = [];
    let totalDistance = 0;

    for (let i = 0; i < this.pointsValue.length - 1; i++) {
      const d = pointDistance(this.pointsValue[i]!, this.pointsValue[i + 1]!);
      segmentDistances.push(d);
      totalDistance += d;
    }

    return {
      phase: this.phaseValue,
      points: [...this.pointsValue],
      previewPoint: this.previewPointValue ? { ...this.previewPointValue } : null,
      previewSnap: this.previewSnapValue,
      segmentDistances,
      totalDistance,
    };
  }
}

export class CadChainDistanceController {
  private destroyed = false;
  private readonly machine = new CadChainDistanceMachine();
  private callbacks: CadChainDistanceCallbacks = {};
  private lastMouseDown: { x: number; y: number; time: number } | null = null;
  private activePointerId: number | null = null;
  private lastPointerType: string | null = null;
  private snapModes: ReadonlySet<CadSnapMode> = new Set([
    "endpoint",
    "midpoint",
    "intersection",
    "center",
  ]);

  constructor(
    private readonly host: HTMLElement,
    private readonly runtime: CadChainDistanceRuntime
  ) {
    this.attach();
  }

  get isActive(): boolean {
    return !this.destroyed && this.machine.isActive;
  }

  start(
    snapModes?: ReadonlySet<CadSnapMode>,
    callbacks?: CadChainDistanceCallbacks
  ): CadChainDistanceSnapshot {
    if (this.destroyed) return this.machine.snapshot();
    if (snapModes) this.snapModes = new Set(snapModes);
    this.callbacks = callbacks ?? {};
    this.lastMouseDown = null;
    this.activePointerId = null;
    this.lastPointerType = null;
    this.runtime.setCameraInteractionEnabled?.(false);
    const snap = this.machine.start();
    this.emit(snap);
    return snap;
  }

  cancel(notify = true): void {
    if (this.destroyed) return;
    const wasActive = this.machine.isActive;
    const callbacks = this.callbacks;
    this.callbacks = {};
    this.lastMouseDown = null;
    this.activePointerId = null;
    this.machine.cancel();
    this.runtime.setCameraInteractionEnabled?.(true);
    callbacks.onSnapshot?.(null);
    if (notify && wasActive) callbacks.onCancel?.();
  }

  /** Completion is one-shot; incomplete chains cancel without creating history. */
  finish(): void {
    if (this.destroyed || !this.machine.isActive) return;
    const { result } = this.machine.complete();
    const callbacks = this.callbacks;
    this.callbacks = {};
    this.machine.cancel();
    this.lastMouseDown = null;
    this.activePointerId = null;
    this.runtime.setCameraInteractionEnabled?.(true);
    callbacks.onSnapshot?.(null);
    if (result) callbacks.onComplete?.(result);
    else callbacks.onCancel?.();
  }

  updateSnapModes(modes: ReadonlySet<CadSnapMode>): void {
    this.snapModes = new Set(modes);
  }

  /** On touch devices the first tap aims; the overlay's Add button confirms. */
  confirmPreviewPoint(): boolean {
    if (this.destroyed || !this.machine.isActive) return false;
    const snap = this.machine.snapshot();
    if (!snap.previewPoint) return false;
    const before = this.machine.points.length;
    this.emit(this.machine.addPoint(snap.previewPoint));
    return this.machine.points.length > before;
  }

  removeLastPoint(): void {
    if (this.destroyed || !this.machine.isActive) return;
    this.lastMouseDown = null;
    this.emit(this.machine.removeLastPoint());
  }

  destroy(): void {
    if (this.destroyed) return;
    this.cancel(false);
    this.destroyed = true;
    this.detach();
  }

  private emit(snapshot: CadChainDistanceSnapshot): void {
    this.callbacks.onSnapshot?.(snapshot);
  }

  private eventScreenPoint(event: PointerEvent): CadSnapPoint {
    const rect = this.host.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.destroyed || !this.machine.isActive || event.button > 0) return;
    this.activePointerId = event.pointerId;
    this.lastPointerType = event.pointerType;
    event.preventDefault();
    const screenPoint = this.eventScreenPoint(event);
    const origin = this.machine.points[this.machine.points.length - 1] ?? null;
    const resolved = this.runtime.resolvePoint(screenPoint, this.snapModes, { originPoint: origin });
    if (!resolved) return;
    if (event.pointerType === "touch") {
      this.emit(this.machine.updatePreview(resolved)); // tap-to-aim, not an accidental commit
      return;
    }
    const time = event.timeStamp;
    if (this.lastMouseDown &&
        time >= this.lastMouseDown.time && time - this.lastMouseDown.time < 380 &&
        Math.hypot(screenPoint.x - this.lastMouseDown.x, screenPoint.y - this.lastMouseDown.y) <= 5) {
      return; // second press of a double-click must not add a phantom vertex
    }
    this.lastMouseDown = { ...screenPoint, time };
    this.emit(this.machine.addPoint(resolved.point));
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.destroyed || !this.machine.isActive) return;
    const screenPoint = this.eventScreenPoint(event);
    const origin = this.machine.points[this.machine.points.length - 1] ?? null;
    const resolved = this.runtime.resolvePoint(screenPoint, this.snapModes, { originPoint: origin });
    const snap = this.machine.updatePreview(resolved);
    this.emit(snap);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.destroyed || !this.machine.isActive || event.isComposing) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest?.("input, textarea, select, [contenteditable='true'], [role='textbox']")) return;
    if (event.key === "Enter") {
      event.preventDefault();
      this.finish();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      this.removeLastPoint();
    } else if (event.key === "Escape") {
      event.preventDefault();
      // First ESC discards only the in-progress points; the next exits the tool.
      const snap = this.machine.snapshot();
      if (snap.points.length > 0 || snap.previewPoint) {
        this.lastMouseDown = null;
        this.emit(this.machine.start());
      } else {
        this.cancel(true);
      }
    }
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId === this.activePointerId) this.activePointerId = null;
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    if (this.machine.isActive && (this.activePointerId === null ||
        event.pointerId === this.activePointerId)) this.cancel(true);
  };

  private readonly handleLostPointerCapture = (event: PointerEvent): void => {
    // Normal release after pointerup is not a cancellation!
    if (this.machine.isActive && event.pointerId === this.activePointerId) this.cancel(true);
  };

  private readonly handleWindowBlur = (): void => {
    if (this.machine.isActive) this.cancel(true);
  };

  private readonly handleVisibilityChange = (): void => {
    if (typeof document !== "undefined" && document.hidden && this.machine.isActive) this.cancel(true);
  };

  private readonly handleDblClick = (event: MouseEvent): void => {
    if (this.destroyed || !this.machine.isActive || this.lastPointerType === "touch") return;
    event.preventDefault();
    this.finish();
  };

  private attach(): void {
    this.host.addEventListener("pointerdown", this.handlePointerDown, { passive: false });
    this.host.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    this.host.addEventListener("pointerup", this.handlePointerUp);
    this.host.addEventListener("pointercancel", this.handlePointerCancel);
    this.host.addEventListener("lostpointercapture", this.handleLostPointerCapture);
    this.host.addEventListener("dblclick", this.handleDblClick, { passive: false });
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("blur", this.handleWindowBlur);
    window.addEventListener("pagehide", this.handleWindowBlur);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  private detach(): void {
    this.host.removeEventListener("pointerdown", this.handlePointerDown);
    this.host.removeEventListener("pointermove", this.handlePointerMove);
    this.host.removeEventListener("pointerup", this.handlePointerUp);
    this.host.removeEventListener("pointercancel", this.handlePointerCancel);
    this.host.removeEventListener("lostpointercapture", this.handleLostPointerCapture);
    this.host.removeEventListener("dblclick", this.handleDblClick);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("blur", this.handleWindowBlur);
    window.removeEventListener("pagehide", this.handleWindowBlur);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  }
}