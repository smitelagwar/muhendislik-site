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
    snapModes: ReadonlySet<CadSnapMode>
  ) => { point: CadSnapPoint; snap: CadSnapCandidate | null } | null;
  readonly projectWorldPoint?: (point: CadSnapPoint) => CadSnapPoint | null;
  readonly setCameraInteractionEnabled?: (enabled: boolean) => void;
}

export const CAD_CHAIN_DISTANCE_SNAPSHOT_EVENT = "cad:chain-distance-snapshot";
export const CAD_CHAIN_DISTANCE_ACTION_EVENT = "cad:chain-distance-action";

export type CadChainDistanceAction = "finish" | "undo-last" | "cancel";

function dispatchChainSnapshot(snapshot: CadChainDistanceSnapshot): void {
  if (typeof window === "undefined" || typeof CustomEvent === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CadChainDistanceSnapshot>(CAD_CHAIN_DISTANCE_SNAPSHOT_EVENT, {
      detail: snapshot,
    })
  );
}

export function dispatchCadChainDistanceAction(action: CadChainDistanceAction): void {
  if (typeof window === "undefined" || typeof CustomEvent === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CadChainDistanceAction>(CAD_CHAIN_DISTANCE_ACTION_EVENT, {
      detail: action,
    })
  );
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
    return this.phaseValue !== "inactive" && this.phaseValue !== "complete";
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
    if (!this.isActive) return this.snapshot();

    // Consecutive zero-length segments never enter the committed chain.
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
    if (!this.isActive) return this.snapshot();
    if (this.pointsValue.length <= 1) {
      this.pointsValue = [];
      this.phaseValue = "awaiting-first";
    } else {
      this.pointsValue.pop();
      this.phaseValue = "awaiting-next";
    }
    this.previewPointValue = null;
    this.previewSnapValue = null;
    return this.snapshot();
  }

  updatePreview(
    preview: { point: CadSnapPoint; snap: CadSnapCandidate | null } | null
  ): CadChainDistanceSnapshot {
    if (!this.isActive) return this.snapshot();
    this.previewPointValue = preview ? { x: preview.point.x, y: preview.point.y } : null;
    this.previewSnapValue = preview?.snap ?? null;
    return this.snapshot();
  }

  complete(): { snapshot: CadChainDistanceSnapshot; result: CadChainDistanceResult | null } {
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

  start(
    snapModes?: ReadonlySet<CadSnapMode>,
    callbacks?: CadChainDistanceCallbacks
  ): CadChainDistanceSnapshot {
    if (this.destroyed) return this.machine.snapshot();
    if (snapModes) this.snapModes = snapModes;
    this.callbacks = callbacks ?? {};
    this.runtime.setCameraInteractionEnabled?.(false);
    const snap = this.machine.start();
    this.emit(snap);
    return snap;
  }

  cancel(notify = true): void {
    if (this.destroyed) return;
    const wasActive = this.machine.isActive;
    this.runtime.setCameraInteractionEnabled?.(true);
    const snap = this.machine.cancel();
    this.emit(snap);
    if (notify && wasActive) this.callbacks.onCancel?.();
  }

  finish(): void {
    if (this.destroyed || !this.machine.isActive) return;
    const { snapshot, result } = this.machine.complete();
    this.runtime.setCameraInteractionEnabled?.(true);
    this.emit(snapshot);
    if (result) {
      this.callbacks.onComplete?.(result);
    } else {
      // Finishing with fewer than two points is a cancel, otherwise adapter
      // activeMeasurementCommand would remain stuck in chain_distance.
      this.callbacks.onCancel?.();
    }
  }

  removeLastPoint(): void {
    if (this.destroyed || !this.machine.isActive) return;
    const snap = this.machine.removeLastPoint();
    this.emit(snap);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.cancel(false);
    this.destroyed = true;
    this.detach();
  }

  private emit(snapshot: CadChainDistanceSnapshot): void {
    this.callbacks.onSnapshot?.(snapshot);
    dispatchChainSnapshot(snapshot);
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
    event.preventDefault();
    const screenPoint = this.eventScreenPoint(event);
    const resolved = this.runtime.resolvePoint(screenPoint, this.snapModes);
    if (!resolved) return;

    const snap = this.machine.addPoint(resolved.point);
    this.emit(snap);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.destroyed || !this.machine.isActive) return;
    const screenPoint = this.eventScreenPoint(event);
    const resolved = this.runtime.resolvePoint(screenPoint, this.snapModes);
    const snap = this.machine.updatePreview(resolved);
    this.emit(snap);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.destroyed || !this.machine.isActive) return;
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
    ) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      this.finish();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      this.removeLastPoint();
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.cancel(true);
    }
  };

  private readonly handleDblClick = (event: MouseEvent): void => {
    if (this.destroyed || !this.machine.isActive) return;
    event.preventDefault();
    this.finish();
  };

  private readonly handleAction = (event: Event): void => {
    if (this.destroyed || !this.machine.isActive) return;
    const action = (event as CustomEvent<CadChainDistanceAction>).detail;
    if (action === "finish") this.finish();
    if (action === "undo-last") this.removeLastPoint();
    if (action === "cancel") this.cancel(true);
  };

  private attach(): void {
    this.host.addEventListener("pointerdown", this.handlePointerDown, { passive: false });
    this.host.addEventListener("pointermove", this.handlePointerMove, { passive: true });
    this.host.addEventListener("dblclick", this.handleDblClick, { passive: false });
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleKeyDown);
      window.addEventListener(CAD_CHAIN_DISTANCE_ACTION_EVENT, this.handleAction);
    }
  }

  private detach(): void {
    this.host.removeEventListener("pointerdown", this.handlePointerDown);
    this.host.removeEventListener("pointermove", this.handlePointerMove);
    this.host.removeEventListener("dblclick", this.handleDblClick);
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener(CAD_CHAIN_DISTANCE_ACTION_EVENT, this.handleAction);
    }
  }
}
