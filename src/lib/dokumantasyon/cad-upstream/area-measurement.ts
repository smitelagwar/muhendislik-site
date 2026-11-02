import {
  pointDistance, validateCadPolygon, CAD_POLYGON_ERRORS,
} from "./polygon-geometry";
export { shoelaceArea, polygonPerimeter, polygonCentroid, pointDistance } from "./polygon-geometry";
import {
  CadSnapCandidate,
  CadSnapMode,
  CadSnapPoint,
} from "./snap-engine";

export interface CadAreaMeasurementSnapshot {
  readonly phase: "inactive" | "awaiting-first" | "awaiting-next" | "complete";
  readonly points: readonly CadSnapPoint[];
  readonly previewPoint: CadSnapPoint | null;
  readonly previewSnap: CadSnapCandidate | null;
  readonly area: number | null;
  readonly perimeter: number | null;
  readonly validationError?: string | null;
}

export interface CadAreaMeasurementResult {
  readonly points: readonly CadSnapPoint[];
  readonly area: number;
  readonly perimeter: number;
  readonly centroid: CadSnapPoint;
}

export interface CadAreaMeasurementCallbacks {
  readonly onSnapshot?: (snapshot: CadAreaMeasurementSnapshot | null) => void;
  readonly onComplete?: (result: CadAreaMeasurementResult) => void;
  readonly onCancel?: () => void;
}

export interface CadAreaMeasurementRuntime {
  readonly resolvePoint: (
    screenPoint: CadSnapPoint,
    snapModes: ReadonlySet<CadSnapMode>
  ) => { point: CadSnapPoint; snap: CadSnapCandidate | null } | null;
  readonly projectWorldPoint?: (point: CadSnapPoint) => CadSnapPoint | null;
  readonly setCameraInteractionEnabled?: (enabled: boolean) => void;
}

export function formatArea(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export class CadAreaMeasurementController {
  private readonly host: HTMLElement;
  private readonly runtime: CadAreaMeasurementRuntime;
  private snapModes: ReadonlySet<CadSnapMode> = new Set();
  private callbacks: CadAreaMeasurementCallbacks = {};
  private points: CadSnapPoint[] = [];
  private previewPoint: CadSnapPoint | null = null;
  private previewSnap: CadSnapCandidate | null = null;
  private phase: "inactive" | "awaiting-first" | "awaiting-next" | "complete" = "inactive";
  private active = false;
  private pointerDownState: { id: number; x: number; y: number } | null = null;
  private lastTap: { x: number; y: number; time: number } | null = null;

  constructor(host: HTMLElement, runtime: CadAreaMeasurementRuntime) {
    this.host = host;
    this.runtime = runtime;
  }

  get isActive(): boolean {
    return this.active;
  }

  start(
    snapModes: ReadonlySet<CadSnapMode>,
    callbacks: CadAreaMeasurementCallbacks = {}
  ): void {
    this.cancel(false);
    this.active = true;
    this.snapModes = new Set(snapModes);
    this.callbacks = callbacks;
    this.points = [];
    this.previewPoint = null;
    this.previewSnap = null;
    this.phase = "awaiting-first";
    this.pointerDownState = null;
    this.lastTap = null;

    this.attachEventListeners();
    this.emit(this.getSnapshot());
  }

  updateSnapModes(snapModes: ReadonlySet<CadSnapMode>): void {
    this.snapModes = new Set(snapModes);
  }

  finish(): boolean {
    if (!this.active) return false;
    const verdict = validateCadPolygon(this.points);
    if (!verdict.valid || verdict.area === null ||
        verdict.perimeter === null || verdict.centroid === null) {
      this.emit({ ...this.getSnapshot(), validationError: CAD_POLYGON_ERRORS[verdict.reason!] });
      return false;
    }
    const onComplete = this.callbacks.onComplete;
    const result: CadAreaMeasurementResult = {
      points: this.points.map(p => ({ ...p })),
      area: verdict.area,
      perimeter: verdict.perimeter,
      centroid: verdict.centroid,
    };
    this.cleanup();
    onComplete?.(result);
    return true;
  }

  popPoint(): boolean {
    if (!this.active || this.points.length === 0) return false;
    this.points.pop();
    this.phase = this.points.length === 0 ? "awaiting-first" : "awaiting-next";
    this.emit(this.getSnapshot());
    return true;
  }

  cancel(notify = true): void {
    if (!this.active) return;
    const onCancel = this.callbacks.onCancel;
    this.cleanup();
    if (notify) {
      onCancel?.();
    }
  }

  destroy(): void {
    this.cancel(false);
  }

  private cleanup(): void {
    this.active = false;
    this.phase = "inactive";
    this.points = [];
    this.pointerDownState = null;
    this.lastTap = null;
    this.previewPoint = null;
    this.previewSnap = null;
    this.callbacks = {};
    this.detachEventListeners();
    this.emit(null);
  }

  private getSnapshot(): CadAreaMeasurementSnapshot {
    const polygon = this.previewPoint && this.points.length >= 2
      ? [...this.points, this.previewPoint] : this.points;
    const check = polygon.length >= 3 ? validateCadPolygon(polygon) : null;
    return {
      phase: this.phase,
      points: this.points.map(p => ({ ...p })),
      previewPoint: this.previewPoint ? { ...this.previewPoint } : null,
      previewSnap: this.previewSnap ? { ...this.previewSnap } : null,
      area: check?.valid ? check.area : null,
      perimeter: check?.valid ? check.perimeter : null,
      validationError: check && !check.valid && check.reason
        ? CAD_POLYGON_ERRORS[check.reason] : null,
    };
  }

  private emit(snapshot: CadAreaMeasurementSnapshot | null): void {
    this.callbacks.onSnapshot?.(snapshot);
  }

  private eventScreenPoint(event: PointerEvent | MouseEvent): CadSnapPoint {
    const rect = this.host.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.active) return;
    if (!event.isPrimary) {
      this.cancel(true); // pinch/multitouch gives camera back its ownership
      return;
    }
    if (event.pointerType !== "touch" && event.button !== 0) return;
    const screen = this.eventScreenPoint(event);
    this.pointerDownState = { id: event.pointerId, ...screen };
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.active || !event.isPrimary) return;
    const resolved = this.runtime.resolvePoint(this.eventScreenPoint(event), this.snapModes);
    this.previewPoint = resolved ? { ...resolved.point } : null;
    this.previewSnap = resolved?.snap ?? null;
    this.emit(this.getSnapshot());
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.active) return;
    const down = this.pointerDownState;
    this.pointerDownState = null;
    if (!down || down.id !== event.pointerId || !event.isPrimary) return;
    const screen = this.eventScreenPoint(event);
    if (pointDistance(down, screen) > 8) return; // pan/drag is not a new vertex
    const resolved = this.runtime.resolvePoint(screen, this.snapModes);
    if (!resolved || !Number.isFinite(resolved.point.x) || !Number.isFinite(resolved.point.y)) return;
    if (Math.abs(resolved.point.x) > 1e9 || Math.abs(resolved.point.y) > 1e9) return;
    if (this.points.length >= 3 && this.runtime.projectWorldPoint) {
      const projected = this.runtime.projectWorldPoint(this.points[0]!);
      if (projected && pointDistance(projected, screen) <= 5) {
        this.finish(); // failed validation does not complete or mutate
        return;
      }
    }
    const candidate = { ...resolved.point };
    const last = this.points[this.points.length - 1];
    if (last && pointDistance(last, candidate) <= 1e-9) {
      this.emit({ ...this.getSnapshot(), validationError: CAD_POLYGON_ERRORS["duplicate-vertex"] });
      return;
    }
    // Suppress second pointerup in a mouse double-click, without losing first vertex.
    if (event.pointerType !== "touch" && this.lastTap &&
        event.timeStamp >= this.lastTap.time && event.timeStamp - this.lastTap.time < 380 &&
        pointDistance(this.lastTap, screen) <= 5) return;
    if (this.points.length >= 5000) {
      this.emit({ ...this.getSnapshot(), validationError: CAD_POLYGON_ERRORS["too-many-points"] });
      return;
    }
    this.lastTap = { ...screen, time: event.timeStamp };
    this.points.push(candidate);
    this.phase = "awaiting-next";
    this.emit(this.getSnapshot());
  };

  private readonly handlePointerCancel = (): void => {
    if (this.active) this.cancel(true);
  };
  private readonly handleWindowBlur = (): void => {
    if (this.active) this.cancel(true);
  };
  private readonly handleVisibilityChange = (): void => {
    if (typeof document !== "undefined" && document.hidden && this.active) this.cancel(true);
  };

  private readonly handleDblClick = (event: MouseEvent): void => {
    if (!this.active) return;
    event.preventDefault();
    if (this.points.length >= 3) this.finish();
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.active || event.isComposing) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest?.("input, textarea, select, [contenteditable='true'], [role='textbox']") ||
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
    if (event.key === "Enter") {
      event.preventDefault();
      this.finish();
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.cancel(true);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      this.popPoint();
    }
  };

  private attachEventListeners(): void {
    this.host.addEventListener("pointerdown", this.handlePointerDown);
    this.host.addEventListener("pointermove", this.handlePointerMove);
    this.host.addEventListener("pointerup", this.handlePointerUp);
    this.host.addEventListener("pointercancel", this.handlePointerCancel);
    this.host.addEventListener("dblclick", this.handleDblClick);
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("blur", this.handleWindowBlur);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  private detachEventListeners(): void {
    this.host.removeEventListener("pointerdown", this.handlePointerDown);
    this.host.removeEventListener("pointermove", this.handlePointerMove);
    this.host.removeEventListener("pointerup", this.handlePointerUp);
    this.host.removeEventListener("pointercancel", this.handlePointerCancel);
    this.host.removeEventListener("dblclick", this.handleDblClick);
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("blur", this.handleWindowBlur);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  }
}
