import {
  CadSnapCandidate,
  CadSnapMode,
  CadSnapPoint,
} from "./snap-engine";
export function pointDistance(a: CadSnapPoint, b: CadSnapPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export interface CadAreaMeasurementSnapshot {
  readonly phase: "inactive" | "awaiting-first" | "awaiting-next" | "complete";
  readonly points: readonly CadSnapPoint[];
  readonly previewPoint: CadSnapPoint | null;
  readonly previewSnap: CadSnapCandidate | null;
  readonly area: number | null;
  readonly perimeter: number | null;
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

export function shoelaceArea(points: readonly CadSnapPoint[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    sum += points[i].x * points[next].y - points[next].x * points[i].y;
  }
  return Math.abs(sum) / 2;
}

export function polygonPerimeter(points: readonly CadSnapPoint[], closed = true): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += pointDistance(points[i], points[i + 1]);
  }
  if (closed && points.length >= 3) {
    total += pointDistance(points[points.length - 1], points[0]);
  }
  return total;
}

export function polygonCentroid(points: readonly CadSnapPoint[]): CadSnapPoint {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length < 3) {
    const x = points.reduce((acc, p) => acc + p.x, 0) / points.length;
    const y = points.reduce((acc, p) => acc + p.y, 0) / points.length;
    return { x, y };
  }
  let cx = 0;
  let cy = 0;
  let signedArea = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const a = points[i].x * points[next].y - points[next].x * points[i].y;
    signedArea += a;
    cx += (points[i].x + points[next].x) * a;
    cy += (points[i].y + points[next].y) * a;
  }
  signedArea *= 0.5;
  if (Math.abs(signedArea) < 1e-6) {
    const x = points.reduce((acc, p) => acc + p.x, 0) / points.length;
    const y = points.reduce((acc, p) => acc + p.y, 0) / points.length;
    return { x, y };
  }
  return {
    x: cx / (6 * signedArea),
    y: cy / (6 * signedArea),
  };
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

    this.attachEventListeners();
    this.emit(this.getSnapshot());
  }

  updateSnapModes(snapModes: ReadonlySet<CadSnapMode>): void {
    this.snapModes = new Set(snapModes);
  }

  finish(): boolean {
    if (!this.active || this.points.length < 3) return false;
    const confirmed = [...this.points];
    const area = shoelaceArea(confirmed);
    const perimeter = polygonPerimeter(confirmed, true);
    const centroid = polygonCentroid(confirmed);

    this.phase = "complete";
    this.previewPoint = null;
    this.previewSnap = null;

    const result: CadAreaMeasurementResult = {
      points: confirmed,
      area,
      perimeter,
      centroid,
    };

    const onComplete = this.callbacks.onComplete;
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
    this.previewPoint = null;
    this.previewSnap = null;
    this.callbacks = {};
    this.detachEventListeners();
    this.emit(null);
  }

  private getSnapshot(): CadAreaMeasurementSnapshot {
    let currentArea: number | null = null;
    let currentPerimeter: number | null = null;

    if (this.points.length >= 3) {
      currentArea = shoelaceArea(this.points);
      currentPerimeter = polygonPerimeter(this.points, true);
    } else if (this.points.length === 2 && this.previewPoint) {
      currentArea = shoelaceArea([...this.points, this.previewPoint]);
      currentPerimeter = polygonPerimeter([...this.points, this.previewPoint], true);
    }

    return {
      phase: this.phase,
      points: [...this.points],
      previewPoint: this.previewPoint ? { ...this.previewPoint } : null,
      previewSnap: this.previewSnap ? { ...this.previewSnap } : null,
      area: currentArea,
      perimeter: currentPerimeter,
    };
  }

  private emit(snapshot: CadAreaMeasurementSnapshot | null): void {
    this.callbacks.onSnapshot?.(snapshot);
  }

  private eventScreenPoint(event: PointerEvent | MouseEvent): CadSnapPoint {
    const rect = this.host.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.active) return;
    const screenPoint = this.eventScreenPoint(event);
    const resolved = this.runtime.resolvePoint(screenPoint, this.snapModes);
    if (!resolved) {
      this.previewPoint = null;
      this.previewSnap = null;
    } else {
      this.previewPoint = resolved.point;
      this.previewSnap = resolved.snap;
    }
    this.emit(this.getSnapshot());
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.active) return;
    // Primary button only
    if (event.button !== 0 && event.pointerType !== "touch") return;

    const screenPoint = this.eventScreenPoint(event);
    const resolved = this.runtime.resolvePoint(screenPoint, this.snapModes);
    if (!resolved) return;

    // Check if user clicked close to the first point to close the polygon
    if (this.points.length >= 3 && this.runtime.projectWorldPoint) {
      const firstProjected = this.runtime.projectWorldPoint(this.points[0]);
      if (firstProjected) {
        const distToFirst = pointDistance(firstProjected, screenPoint);
        if (distToFirst <= 20) {
          this.finish();
          return;
        }
      }
    }

    this.points.push({ ...resolved.point });
    this.phase = "awaiting-next";
    this.emit(this.getSnapshot());
  };

  private readonly handleDblClick = (event: MouseEvent): void => {
    if (!this.active) return;
    event.preventDefault();
    if (this.points.length >= 3) {
      this.finish();
    }
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.active) return;

    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable)
    ) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (this.points.length >= 3) {
        this.finish();
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.cancel(true);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      this.popPoint();
    }
  };

  private attachEventListeners(): void {
    this.host.addEventListener("pointermove", this.handlePointerMove);
    this.host.addEventListener("pointerup", this.handlePointerUp);
    this.host.addEventListener("dblclick", this.handleDblClick);
    window.addEventListener("keydown", this.handleKeyDown);
  }

  private detachEventListeners(): void {
    this.host.removeEventListener("pointermove", this.handlePointerMove);
    this.host.removeEventListener("pointerup", this.handlePointerUp);
    this.host.removeEventListener("dblclick", this.handleDblClick);
    window.removeEventListener("keydown", this.handleKeyDown);
  }
}
