import type { CadSnapCandidate, CadSnapMode, CadSnapPoint } from "./snap-engine";

export const CAD_DISTANCE_LONG_PRESS_MS = 500;
export const CAD_DISTANCE_ARM_SLOP_PX = 8;
export const CAD_DISTANCE_SNAP_TOLERANCE_PX = 18;

export type CadDistanceMeasurementPhase =
  | "inactive"
  | "awaiting-first"
  | "pressing-first"
  | "tracking-first"
  | "awaiting-second"
  | "pressing-second"
  | "tracking-second"
  | "complete";

export interface CadDistanceMeasurementSnapshot {
  phase: CadDistanceMeasurementPhase;
  firstPoint: CadSnapPoint | null;
  previewPoint: CadSnapPoint | null;
  previewSnap: CadSnapCandidate | null;
  pointerScreenPoint: CadSnapPoint | null;
  distance: number | null;
  isOrthoLocked?: boolean;
}

export interface CadDistanceMeasurementResult {
  start: CadSnapPoint;
  end: CadSnapPoint;
  distance: number;
}

export interface CadDistanceResolvedPoint {
  point: CadSnapPoint;
  snap: CadSnapCandidate | null;
}

export interface CadDistanceMeasurementCallbacks {
  onSnapshot?: (snapshot: CadDistanceMeasurementSnapshot) => void;
  onComplete?: (result: CadDistanceMeasurementResult) => void;
  onCancel?: () => void;
}

export interface CadDistanceMeasurementRuntime {
  resolvePoint(
    screenPoint: CadSnapPoint,
    snapModes: ReadonlySet<CadSnapMode>,
    options?: { originPoint?: CadSnapPoint | null; isOrtho?: boolean }
  ): CadDistanceResolvedPoint | null;
  setCameraInteractionEnabled(enabled: boolean): void;
}

function clonePoint(point: CadSnapPoint | null): CadSnapPoint | null {
  return point ? { x: point.x, y: point.y } : null;
}

function pointDistance(a: CadSnapPoint, b: CadSnapPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export class CadPressHoldDistanceMachine {
  private phaseValue: CadDistanceMeasurementPhase = "inactive";
  private pointerId: number | null = null;
  private firstPointValue: CadSnapPoint | null = null;
  private previewPointValue: CadSnapPoint | null = null;
  private previewSnapValue: CadSnapCandidate | null = null;
  private isOrthoLockedValue = false;

  get phase(): CadDistanceMeasurementPhase {
    return this.phaseValue;
  }

  get firstPoint(): CadSnapPoint | null {
    return this.firstPointValue;
  }

  get activePointerId(): number | null {
    return this.pointerId;
  }

  get isActive(): boolean {
    return this.phaseValue !== "inactive" && this.phaseValue !== "complete";
  }

  get isTracking(): boolean {
    return this.phaseValue === "tracking-first" || this.phaseValue === "tracking-second";
  }

  setOrthoLocked(locked: boolean): void {
    this.isOrthoLockedValue = locked;
  }

  start(): CadDistanceMeasurementSnapshot {
    this.phaseValue = "awaiting-first";
    this.pointerId = null;
    this.firstPointValue = null;
    this.previewPointValue = null;
    this.previewSnapValue = null;
    return this.snapshot();
  }

  pointerDown(pointerId: number): boolean {
    if (this.pointerId !== null) return false;
    if (this.phaseValue === "awaiting-first") {
      this.phaseValue = "pressing-first";
    } else if (this.phaseValue === "awaiting-second") {
      this.phaseValue = "pressing-second";
    } else {
      return false;
    }
    this.pointerId = pointerId;
    this.previewPointValue = null;
    this.previewSnapValue = null;
    return true;
  }

  activateHold(
    pointerId: number,
    resolved: CadDistanceResolvedPoint
  ): CadDistanceMeasurementSnapshot | null {
    if (this.pointerId !== pointerId) return null;
    if (this.phaseValue === "pressing-first") {
      this.phaseValue = "tracking-first";
    } else if (this.phaseValue === "pressing-second") {
      this.phaseValue = "tracking-second";
    } else {
      return null;
    }
    this.previewPointValue = clonePoint(resolved.point);
    this.previewSnapValue = resolved.snap;
    return this.snapshot();
  }

  move(
    pointerId: number,
    resolved: CadDistanceResolvedPoint
  ): CadDistanceMeasurementSnapshot | null {
    if (this.pointerId !== pointerId || !this.isTracking) return null;
    this.previewPointValue = clonePoint(resolved.point);
    this.previewSnapValue = resolved.snap;
    return this.snapshot();
  }

  pointerUp(
    pointerId: number,
    resolved?: CadDistanceResolvedPoint | null
  ): { snapshot: CadDistanceMeasurementSnapshot; result: CadDistanceMeasurementResult | null } | null {
    if (this.pointerId !== pointerId) return null;

    if (this.phaseValue === "pressing-first") {
      this.pointerId = null;
      this.phaseValue = "awaiting-first";
      return { snapshot: this.snapshot(), result: null };
    }
    if (this.phaseValue === "pressing-second") {
      this.pointerId = null;
      this.phaseValue = "awaiting-second";
      return { snapshot: this.snapshot(), result: null };
    }

    if (resolved && this.isTracking) {
      this.previewPointValue = clonePoint(resolved.point);
      this.previewSnapValue = resolved.snap;
    }
    const committed = clonePoint(this.previewPointValue);
    if (!committed) {
      return { snapshot: this.cancelPointer(pointerId), result: null };
    }

    if (this.phaseValue === "tracking-first") {
      this.firstPointValue = committed;
      this.pointerId = null;
      this.previewPointValue = null;
      this.previewSnapValue = null;
      this.phaseValue = "awaiting-second";
      return { snapshot: this.snapshot(), result: null };
    }

    if (this.phaseValue === "tracking-second" && this.firstPointValue) {
      const start = clonePoint(this.firstPointValue)!;
      const end = committed;
      const result = { start, end, distance: pointDistance(start, end) };
      this.pointerId = null;
      this.previewPointValue = end;
      this.phaseValue = "complete";
      return { snapshot: this.snapshot(), result };
    }

    return null;
  }

  updateHoverPreview(
    resolved: CadDistanceResolvedPoint
  ): CadDistanceMeasurementSnapshot | null {
    if (this.phaseValue !== "awaiting-first" && this.phaseValue !== "awaiting-second") {
      return null;
    }
    this.previewPointValue = clonePoint(resolved.point);
    this.previewSnapValue = resolved.snap;
    return this.snapshot();
  }

  clearHoverPreview(): CadDistanceMeasurementSnapshot {
    if (this.phaseValue === "awaiting-first" || this.phaseValue === "awaiting-second") {
      this.previewPointValue = null;
      this.previewSnapValue = null;
    }
    return this.snapshot();
  }

  commitPoint(
    resolved: CadDistanceResolvedPoint
  ): { snapshot: CadDistanceMeasurementSnapshot; result: CadDistanceMeasurementResult | null } {
    const committed = clonePoint(resolved.point);
    if (!committed) {
      return { snapshot: this.snapshot(), result: null };
    }

    if (
      this.phaseValue === "awaiting-first" ||
      this.phaseValue === "pressing-first" ||
      this.phaseValue === "tracking-first"
    ) {
      this.firstPointValue = committed;
      this.pointerId = null;
      this.previewPointValue = null;
      this.previewSnapValue = null;
      this.phaseValue = "awaiting-second";
      return { snapshot: this.snapshot(), result: null };
    }

    if (
      (this.phaseValue === "awaiting-second" ||
        this.phaseValue === "pressing-second" ||
        this.phaseValue === "tracking-second") &&
      this.firstPointValue
    ) {
      const start = clonePoint(this.firstPointValue)!;
      const end = committed;
      const result = { start, end, distance: pointDistance(start, end) };
      this.pointerId = null;
      this.previewPointValue = end;
      this.phaseValue = "complete";
      return { snapshot: this.snapshot(), result };
    }

    return { snapshot: this.snapshot(), result: null };
  }

  cancelPointer(pointerId: number): CadDistanceMeasurementSnapshot {
    if (this.pointerId !== pointerId) return this.snapshot();
    this.pointerId = null;
    this.previewPointValue = null;
    this.previewSnapValue = null;
    this.phaseValue = this.firstPointValue ? "awaiting-second" : "awaiting-first";
    return this.snapshot();
  }

  cancelMeasurement(): CadDistanceMeasurementSnapshot {
    this.pointerId = null;
    this.firstPointValue = null;
    this.previewPointValue = null;
    this.previewSnapValue = null;
    this.phaseValue = "inactive";
    return this.snapshot();
  }

  snapshot(): CadDistanceMeasurementSnapshot {
    const firstPoint = clonePoint(this.firstPointValue);
    const previewPoint = clonePoint(this.previewPointValue);
    return {
      phase: this.phaseValue,
      firstPoint,
      previewPoint,
      previewSnap: this.previewSnapValue,
      pointerScreenPoint: null,
      distance:
        firstPoint && previewPoint ? pointDistance(firstPoint, previewPoint) : null,
      isOrthoLocked: this.isOrthoLockedValue,
    };
  }
}

export class CadPressHoldDistanceController {
  private readonly machine = new CadPressHoldDistanceMachine();
  private snapModes: ReadonlySet<CadSnapMode> = new Set<CadSnapMode>();
  private callbacks: CadDistanceMeasurementCallbacks = {};
  private holdTimer: number | null = null;
  private pointerStart: CadSnapPoint | null = null;
  private lastScreenPoint: CadSnapPoint | null = null;
  private isMouseDown = false;
  private isShiftDown = false;
  private destroyed = false;

  constructor(
    private readonly host: HTMLElement,
    private readonly runtime: CadDistanceMeasurementRuntime
  ) {
    host.addEventListener("pointerdown", this.handlePointerDown, true);
    host.addEventListener("pointermove", this.handlePointerMove, true);
    host.addEventListener("pointerup", this.handlePointerUp, true);
    host.addEventListener("pointercancel", this.handlePointerCancel, true);
    host.addEventListener("lostpointercapture", this.handlePointerCancel, true);
    host.addEventListener("contextmenu", this.handleContextMenu, true);
    host.addEventListener("pointerleave", this.handlePointerLeave, true);
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleKeyDown, true);
      window.addEventListener("keyup", this.handleKeyUp, true);
      window.addEventListener("blur", this.handleWindowBlur, true);
      document.addEventListener("visibilitychange", this.handleVisibilityChange, true);
    }
  }

  get phase(): CadDistanceMeasurementPhase {
    return this.machine.phase;
  }

  start(
    snapModes: ReadonlySet<CadSnapMode>,
    callbacks: CadDistanceMeasurementCallbacks = {}
  ): void {
    if (this.destroyed) return;
    this.clearHoldTimer();
    this.runtime.setCameraInteractionEnabled(true);
    this.snapModes = new Set(snapModes);
    this.callbacks = callbacks;
    this.emit(this.machine.start());
  }

  updateSnapModes(snapModes: ReadonlySet<CadSnapMode>): void {
    this.snapModes = new Set(snapModes);
    if (!this.lastScreenPoint) return;
    const isOrtho = this.isShiftDown && Boolean(this.machine.firstPoint);
    this.machine.setOrthoLocked(isOrtho);
    const effectiveModes = isOrtho
      ? new Set<CadSnapMode>([...this.snapModes, "perpendicular"])
      : this.snapModes;
    const resolved = this.runtime.resolvePoint(this.lastScreenPoint, effectiveModes, {
      originPoint: this.machine.firstPoint,
      isOrtho,
    });
    if (!resolved) return;
    if (this.machine.isTracking && this.machine.activePointerId !== null) {
      const snapshot = this.machine.move(this.machine.activePointerId, resolved);
      if (snapshot) this.emit(snapshot);
    } else if (this.machine.isActive) {
      this.machine.updateHoverPreview(resolved);
      this.emit(this.machine.snapshot());
    }
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Shift" && !this.isShiftDown) {
      this.isShiftDown = true;
      this.reResolveCurrent();
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (event.key === "Shift" && this.isShiftDown) {
      this.isShiftDown = false;
      this.reResolveCurrent();
    }
  };

  private reResolveCurrent(): void {
    if (!this.machine.isActive || !this.lastScreenPoint) return;
    const isOrtho = this.isShiftDown && Boolean(this.machine.firstPoint);
    this.machine.setOrthoLocked(isOrtho);
    const effectiveModes = isOrtho
      ? new Set<CadSnapMode>([...this.snapModes, "perpendicular"])
      : this.snapModes;
    const resolved = this.runtime.resolvePoint(this.lastScreenPoint, effectiveModes, {
      originPoint: this.machine.firstPoint,
      isOrtho,
    });
    if (!resolved) return;
    if (this.machine.isTracking && this.machine.activePointerId !== null) {
      const snapshot = this.machine.move(this.machine.activePointerId, resolved);
      if (snapshot) this.emit(snapshot);
    } else {
      this.machine.updateHoverPreview(resolved);
      this.emit(this.machine.snapshot());
    }
  }

  handleMultiTouchStart(): void {
    if (!this.machine.isActive) return;
    this.clearHoldTimer();
    const pointerId = this.machine.activePointerId;
    if (pointerId !== null) this.emit(this.machine.cancelPointer(pointerId));
    this.pointerStart = null;
    this.lastScreenPoint = null;
    this.runtime.setCameraInteractionEnabled(true);
  }

  cancel(notify = true): void {
    if (this.destroyed) return;
    const wasActive = this.machine.isActive || this.machine.phase === "complete";
    this.clearHoldTimer();
    this.pointerStart = null;
    this.lastScreenPoint = null;
    this.isMouseDown = false;
    this.runtime.setCameraInteractionEnabled(true);
    this.emit(this.machine.cancelMeasurement());
    if (notify && wasActive) this.callbacks.onCancel?.();
    this.callbacks = {};
  }

  destroy(): void {
    if (this.destroyed) return;
    this.cancel(false);
    this.destroyed = true;
    this.host.removeEventListener("pointerdown", this.handlePointerDown, true);
    this.host.removeEventListener("pointermove", this.handlePointerMove, true);
    this.host.removeEventListener("pointerup", this.handlePointerUp, true);
    this.host.removeEventListener("pointercancel", this.handlePointerCancel, true);
    this.host.removeEventListener("lostpointercapture", this.handlePointerCancel, true);
    this.host.removeEventListener("contextmenu", this.handleContextMenu, true);
    this.host.removeEventListener("pointerleave", this.handlePointerLeave, true);
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleKeyDown, true);
      window.removeEventListener("keyup", this.handleKeyUp, true);
      window.removeEventListener("blur", this.handleWindowBlur, true);
      document.removeEventListener("visibilitychange", this.handleVisibilityChange, true);
    }
  }

  private readonly handleWindowBlur = (): void => {
    this.isShiftDown = false;
    this.isMouseDown = false;
    this.clearHoldTimer();
    if (this.machine.activePointerId !== null) {
      this.emit(this.machine.cancelPointer(this.machine.activePointerId));
    }
    this.pointerStart = null;
    this.lastScreenPoint = null;
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      this.handleWindowBlur();
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.machine.isActive || event.button > 0 || !event.isPrimary) return;

    const screenPoint = this.eventScreenPoint(event);
    this.pointerStart = screenPoint;
    this.lastScreenPoint = screenPoint;

    if (event.pointerType === "touch") {
      if (!this.machine.pointerDown(event.pointerId)) return;
      this.emit(this.machine.snapshot());
      this.clearHoldTimer();
      this.holdTimer = window.setTimeout(() => {
        this.holdTimer = null;
        const current = this.lastScreenPoint;
        if (!current || this.machine.activePointerId !== event.pointerId) return;
        const isOrtho = this.isShiftDown && Boolean(this.machine.firstPoint);
        this.machine.setOrthoLocked(isOrtho);
        const effectiveModes = isOrtho
          ? new Set<CadSnapMode>([...this.snapModes, "perpendicular"])
          : this.snapModes;
        const resolved = this.runtime.resolvePoint(current, effectiveModes, {
          originPoint: this.machine.firstPoint,
          isOrtho,
        });
        if (!resolved) {
          this.emit(this.machine.cancelPointer(event.pointerId));
          return;
        }
        const snapshot = this.machine.activateHold(event.pointerId, resolved);
        if (!snapshot) return;
        this.runtime.setCameraInteractionEnabled(false);
        this.emit(snapshot);
      }, CAD_DISTANCE_LONG_PRESS_MS);
      return;
    }

    // Non-touch (desktop mouse):
    this.isMouseDown = true;
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const screenPoint = this.eventScreenPoint(event);

    if (event.pointerType === "touch") {
      if (!this.machine.isActive || this.machine.activePointerId !== event.pointerId) return;
      this.lastScreenPoint = screenPoint;

      if (!this.machine.isTracking) {
        if (
          this.pointerStart &&
          pointDistance(this.pointerStart, screenPoint) > CAD_DISTANCE_ARM_SLOP_PX
        ) {
          this.clearHoldTimer();
          this.pointerStart = null;
          this.emit(this.machine.cancelPointer(event.pointerId));
        }
        return;
      }

      event.preventDefault();
      const isOrtho = this.isShiftDown && Boolean(this.machine.firstPoint);
      this.machine.setOrthoLocked(isOrtho);
      const effectiveModes = isOrtho
        ? new Set<CadSnapMode>([...this.snapModes, "perpendicular"])
        : this.snapModes;
      const resolved = this.runtime.resolvePoint(screenPoint, effectiveModes, {
        originPoint: this.machine.firstPoint,
        isOrtho,
      });
      if (!resolved) return;
      const snapshot = this.machine.move(event.pointerId, resolved);
      if (snapshot) this.emit(snapshot);
      return;
    }

    // Non-touch (desktop mouse):
    if (!this.machine.isActive) return;
    this.lastScreenPoint = screenPoint;
    const isOrtho = (event.shiftKey || this.isShiftDown) && Boolean(this.machine.firstPoint);
    this.machine.setOrthoLocked(isOrtho);
    const effectiveModes = isOrtho
      ? new Set<CadSnapMode>([...this.snapModes, "perpendicular"])
      : this.snapModes;
    const resolved = this.runtime.resolvePoint(screenPoint, effectiveModes, {
      originPoint: this.machine.firstPoint,
      isOrtho,
    });
    if (!resolved) return;

    this.machine.updateHoverPreview(resolved);
    this.emit(this.machine.snapshot());
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.machine.isActive) return;

    if (event.pointerType === "touch") {
      if (this.machine.activePointerId !== event.pointerId) return;
      this.clearHoldTimer();
      const screenPoint = this.eventScreenPoint(event);
      this.lastScreenPoint = screenPoint;
      const isOrtho = this.isShiftDown && Boolean(this.machine.firstPoint);
      this.machine.setOrthoLocked(isOrtho);
      const effectiveModes = isOrtho
        ? new Set<CadSnapMode>([...this.snapModes, "perpendicular"])
        : this.snapModes;
      const resolved = this.runtime.resolvePoint(screenPoint, effectiveModes, {
        originPoint: this.machine.firstPoint,
        isOrtho,
      });

      if (!this.machine.isTracking && resolved) {
        const transition = this.machine.commitPoint(resolved);
        this.pointerStart = null;
        this.lastScreenPoint = null;
        this.runtime.setCameraInteractionEnabled(true);
        this.emit(transition.snapshot);
        if (transition.result) {
          const onComplete = this.callbacks.onComplete;
          this.callbacks = {};
          onComplete?.(transition.result);
        }
        return;
      }

      const trackingResolved = this.machine.isTracking ? resolved : null;
      const transition = this.machine.pointerUp(event.pointerId, trackingResolved);
      this.pointerStart = null;
      this.lastScreenPoint = null;
      this.runtime.setCameraInteractionEnabled(true);
      if (!transition) return;
      this.emit(transition.snapshot);
      if (transition.result) {
        const onComplete = this.callbacks.onComplete;
        this.callbacks = {};
        onComplete?.(transition.result);
      }
      return;
    }

    // Non-touch (desktop mouse):
    if (!this.isMouseDown) return;
    this.isMouseDown = false;
    const screenPoint = this.eventScreenPoint(event);
    this.lastScreenPoint = screenPoint;
    const isOrtho = (event.shiftKey || this.isShiftDown) && Boolean(this.machine.firstPoint);
    this.machine.setOrthoLocked(isOrtho);
    const effectiveModes = isOrtho
      ? new Set<CadSnapMode>([...this.snapModes, "perpendicular"])
      : this.snapModes;
    const resolved = this.runtime.resolvePoint(screenPoint, effectiveModes, {
      originPoint: this.machine.firstPoint,
      isOrtho,
    });
    if (!resolved) return;

    const transition = this.machine.commitPoint(resolved);
    this.pointerStart = null;
    this.emit(transition.snapshot);
    if (transition.result) {
      const onComplete = this.callbacks.onComplete;
      this.callbacks = {};
      onComplete?.(transition.result);
    }
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    if (!this.machine.isActive) return;
    if (event.pointerType === "touch" && this.machine.activePointerId !== event.pointerId) return;
    this.clearHoldTimer();
    this.pointerStart = null;
    this.lastScreenPoint = null;
    this.isMouseDown = false;
    this.runtime.setCameraInteractionEnabled(true);
    this.emit(this.machine.cancelPointer(event.pointerId));
  };

  private readonly handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType !== "touch" && this.machine.isActive) {
      this.isMouseDown = false;
      this.machine.clearHoverPreview();
      this.lastScreenPoint = null;
      this.emit(this.machine.snapshot());
    }
  };

  private readonly handleContextMenu = (event: MouseEvent): void => {
    if (this.machine.isActive) event.preventDefault();
  };

  private eventScreenPoint(event: PointerEvent): CadSnapPoint {
    const rect = this.host.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private emit(snapshot: CadDistanceMeasurementSnapshot): void {
    this.callbacks.onSnapshot?.({
      ...snapshot,
      pointerScreenPoint: clonePoint(this.lastScreenPoint),
    });
  }

  private clearHoldTimer(): void {
    if (this.holdTimer === null) return;
    window.clearTimeout(this.holdTimer);
    this.holdTimer = null;
  }
}
