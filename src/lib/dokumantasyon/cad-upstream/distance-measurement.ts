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
    snapModes: ReadonlySet<CadSnapMode>
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

  get phase(): CadDistanceMeasurementPhase {
    return this.phaseValue;
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
    if (!this.machine.isTracking || !this.lastScreenPoint) return;
    const resolved = this.runtime.resolvePoint(this.lastScreenPoint, this.snapModes);
    if (!resolved || this.machine.activePointerId === null) return;
    const snapshot = this.machine.move(this.machine.activePointerId, resolved);
    if (snapshot) this.emit(snapshot);
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
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.machine.isActive || event.button > 0 || !event.isPrimary) return;
    if (!this.machine.pointerDown(event.pointerId)) return;

    const screenPoint = this.eventScreenPoint(event);
    this.pointerStart = screenPoint;
    this.lastScreenPoint = screenPoint;
    this.emit(this.machine.snapshot());
    this.clearHoldTimer();
    this.holdTimer = window.setTimeout(() => {
      this.holdTimer = null;
      const current = this.lastScreenPoint;
      if (!current || this.machine.activePointerId !== event.pointerId) return;
      const resolved = this.runtime.resolvePoint(current, this.snapModes);
      if (!resolved) {
        this.emit(this.machine.cancelPointer(event.pointerId));
        return;
      }
      const snapshot = this.machine.activateHold(event.pointerId, resolved);
      if (!snapshot) return;
      this.runtime.setCameraInteractionEnabled(false);
      this.emit(snapshot);
    }, CAD_DISTANCE_LONG_PRESS_MS);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.machine.isActive || this.machine.activePointerId !== event.pointerId) return;
    const screenPoint = this.eventScreenPoint(event);
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
    const resolved = this.runtime.resolvePoint(screenPoint, this.snapModes);
    if (!resolved) return;
    const snapshot = this.machine.move(event.pointerId, resolved);
    if (snapshot) this.emit(snapshot);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.machine.isActive || this.machine.activePointerId !== event.pointerId) return;
    this.clearHoldTimer();
    const screenPoint = this.eventScreenPoint(event);
    this.lastScreenPoint = screenPoint;
    const resolved = this.machine.isTracking
      ? this.runtime.resolvePoint(screenPoint, this.snapModes)
      : null;
    const transition = this.machine.pointerUp(event.pointerId, resolved);
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
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    if (!this.machine.isActive || this.machine.activePointerId !== event.pointerId) return;
    this.clearHoldTimer();
    this.pointerStart = null;
    this.lastScreenPoint = null;
    this.runtime.setCameraInteractionEnabled(true);
    this.emit(this.machine.cancelPointer(event.pointerId));
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
