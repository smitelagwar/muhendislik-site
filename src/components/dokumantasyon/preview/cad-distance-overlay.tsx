"use client";

import { useRef } from "react";

import type {
  CadDistanceMeasurementResult,
  CadDistanceMeasurementSnapshot,
} from "@/lib/dokumantasyon/cad-upstream/distance-measurement";
import type {
  CadSnapPoint,
  CadSnapPrimitive,
} from "@/lib/dokumantasyon/cad-upstream/snap-engine";
import { CadPrecisionOverlay } from "./cad-precision-overlay";

export interface CadDistanceOverlayMeasurement extends CadDistanceMeasurementResult {
  id: string;
}

type CadRendererCanvasBridge = {
  manager?: {
    curView?: {
      canvas?: HTMLCanvasElement;
      canvas2d?: HTMLCanvasElement;
    };
  };
  snapCatalog?: CadSnapPrimitive[];
  getNearbyPrimitives?: (
    worldPoint: CadSnapPoint,
    radiusPx?: number,
    limit?: number
  ) => CadSnapPrimitive[];
};

type CadRendererHost = HTMLElement & {
  __cadAdapter?: CadRendererCanvasBridge;
};

function formatDistance(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 3,
  }).format(value);
}

function midpoint(a: CadSnapPoint, b: CadSnapPoint): CadSnapPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function phaseMessage(snapshot: CadDistanceMeasurementSnapshot | null): string | null {
  if (!snapshot) return null;
  switch (snapshot.phase) {
    case "awaiting-first":
      return "1. noktayı seçin";
    case "pressing-first":
      return "Basılı tutmaya devam edin";
    case "tracking-first":
      return "Bırakın: 1. noktayı ayarla";
    case "awaiting-second":
      return snapshot.distance === null
        ? "2. noktayı seçin"
        : `Mesafe: ${formatDistance(snapshot.distance)} (2. noktayı seçin)`;
    case "pressing-second":
      return "Basılı tutmaya devam edin";
    case "tracking-second":
      return snapshot.distance === null
        ? "Bırakın: ölçümü tamamla"
        : `Bırakın: ${formatDistance(snapshot.distance)}`;
    default:
      return null;
  }
}

function resolveCadAdapter(host?: HTMLElement | null): CadRendererCanvasBridge | null {
  if (host) {
    const directAdapter = (host as CadRendererHost).__cadAdapter;
    if (directAdapter) return directAdapter;
    const nestedAdapter = (host.querySelector("[aria-label$='CAD görünümü']") as CadRendererHost | null)
      ?.__cadAdapter;
    if (nestedAdapter) return nestedAdapter;
  }
  if (typeof document !== "undefined") {
    const defaultHost = document.querySelector("[data-cad-upstream-host='true']") as CadRendererHost | null;
    if (defaultHost?.__cadAdapter) return defaultHost.__cadAdapter;
    const canvasHost = document.querySelector("[aria-label$='CAD görünümü']") as CadRendererHost | null;
    if (canvasHost?.__cadAdapter) return canvasHost.__cadAdapter;
  }
  return null;
}

function resolveLiveCadCanvas(host: HTMLElement): HTMLCanvasElement | null {
  const adapter = resolveCadAdapter(host);
  const liveCanvas = adapter?.manager?.curView?.canvas ?? adapter?.manager?.curView?.canvas2d;

  if (
    liveCanvas instanceof HTMLCanvasElement &&
    liveCanvas.width > 0 &&
    liveCanvas.height > 0
  ) {
    return liveCanvas;
  }

  const hostRect = host.getBoundingClientRect();
  const canvases = Array.from(host.querySelectorAll("canvas")).filter((canvas) => {
    if (canvas.hasAttribute("data-cad-precision-lens")) return false;
    const style = window.getComputedStyle(canvas);
    const rect = canvas.getBoundingClientRect();
    return (
      canvas.width > 0 &&
      canvas.height > 0 &&
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity || "1") > 0
    );
  });

  return (
    canvases.sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      const aViewportDelta = Math.abs(aRect.width - hostRect.width) + Math.abs(aRect.height - hostRect.height);
      const bViewportDelta = Math.abs(bRect.width - hostRect.width) + Math.abs(bRect.height - hostRect.height);
      if (aViewportDelta !== bViewportDelta) return aViewportDelta - bViewportDelta;
      return b.width * b.height - a.width * a.height;
    })[0] ?? null
  );
}

export function CadDistanceOverlay({
  snapshot,
  measurements,
  projectPoint,
}: {
  snapshot: CadDistanceMeasurementSnapshot | null;
  measurements: readonly CadDistanceOverlayMeasurement[];
  projectPoint: (point: CadSnapPoint) => CadSnapPoint | null;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const completed = measurements
    .map((measurement) => {
      const start = projectPoint(measurement.start);
      const end = projectPoint(measurement.end);
      return start && end ? { measurement, start, end } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const first = snapshot?.firstPoint ? projectPoint(snapshot.firstPoint) : null;
  const preview = snapshot?.previewPoint ? projectPoint(snapshot.previewPoint) : null;
  const message = phaseMessage(snapshot);

  const getSourceCanvas = (): HTMLCanvasElement | null => {
    const host = anchorRef.current?.parentElement;
    return host ? resolveLiveCadCanvas(host) : null;
  };

  const getSnapPrimitives = (
    primitiveIds: readonly string[],
    worldPoint?: CadSnapPoint | null
  ): CadSnapPrimitive[] => {
    const host = anchorRef.current?.parentElement;
    const adapter = resolveCadAdapter(host);
    if (!adapter) return [];

    const wanted = new Set(primitiveIds);
    const catalog = adapter.snapCatalog;
    const snapped = Array.isArray(catalog) && wanted.size > 0
      ? catalog.filter((primitive) => wanted.has(primitive.id)).slice(0, 8)
      : [];

const CAD_NEARBY_SNAP_RADIUS_PX = 55;
const CAD_NEARBY_SNAP_LIMIT = 36;

    let nearby: CadSnapPrimitive[] = [];
    if (worldPoint && typeof adapter.getNearbyPrimitives === "function") {
      nearby = adapter.getNearbyPrimitives(worldPoint, CAD_NEARBY_SNAP_RADIUS_PX, CAD_NEARBY_SNAP_LIMIT);
    } else if (Array.isArray(catalog) && catalog.length > 0 && worldPoint) {
      // Proximity-filtered fallback: do not blindly slice arbitrary catalog entries
      nearby = catalog
        .filter((p) => {
          const px = p.kind === "line" ? (p.a.x + p.b.x) / 2 : p.center.x;
          const py = p.kind === "line" ? (p.a.y + p.b.y) / 2 : p.center.y;
          return Math.abs(px - worldPoint.x) < 1000 && Math.abs(py - worldPoint.y) < 1000;
        })
        .slice(0, CAD_NEARBY_SNAP_LIMIT);
    }

    if (snapped.length === 0) return nearby.slice(0, 36);
    const snappedIds = new Set(snapped.map((p) => p.id));
    const merged = [...snapped, ...nearby.filter((p) => !snappedIds.has(p.id))];
    return merged.slice(0, 36);
  };

  return (
    <>
      <span ref={anchorRef} className="hidden" data-cad-distance-overlay-anchor="true" />

      <svg
        className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
        aria-hidden="true"
        data-testid="cad-distance-overlay"
      >
        {completed.map(({ measurement, start, end }) => {
          const label = midpoint(start, end);
          return (
            <g key={measurement.id} data-cad-distance-complete="true">
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                className="stroke-primary"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={start.x} cy={start.y} r="3" className="fill-primary" />
              <circle cx={end.x} cy={end.y} r="3" className="fill-primary" />
              <text
                x={label.x}
                y={label.y - 7}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-semibold"
                stroke="var(--background)"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {formatDistance(measurement.distance)}
              </text>
            </g>
          );
        })}

        {first ? <circle cx={first.x} cy={first.y} r="3.5" className="fill-primary" /> : null}

        {first && preview ? (
          <>
            <line
              x1={first.x}
              y1={first.y}
              x2={preview.x}
              y2={preview.y}
              className="stroke-primary"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              vectorEffect="non-scaling-stroke"
              data-cad-distance-rubber-band="true"
            />
            <text
              x={(first.x + preview.x) / 2}
              y={(first.y + preview.y) / 2 - 7}
              textAnchor="middle"
              className="fill-foreground text-[11px] font-semibold"
              stroke="var(--background)"
              strokeWidth="3"
              paintOrder="stroke"
            >
              {snapshot?.distance === null || snapshot?.distance === undefined
                ? ""
                : formatDistance(snapshot.distance)}
            </text>
          </>
        ) : null}

        {preview ? (
          <circle
            cx={preview.x}
            cy={preview.y}
            r={snapshot?.previewSnap ? 4.5 : 3.5}
            className={snapshot?.previewSnap ? "fill-primary" : "fill-background stroke-primary"}
            strokeWidth="1.5"
            opacity={snapshot?.previewSnap ? 0.35 : 0.7}
            data-cad-distance-preview="true"
          />
        ) : null}
      </svg>

      <CadPrecisionOverlay
        snapshot={snapshot}
        projectPoint={projectPoint}
        getSourceCanvas={getSourceCanvas}
        getSnapPrimitives={getSnapPrimitives}
      />

      {message ? (
        <div
          className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-md border border-border/70 bg-background/92 px-2.5 py-1.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur"
          role="status"
          aria-live="polite"
          data-testid="cad-distance-status"
          data-cad-distance-phase={snapshot?.phase ?? "inactive"}
        >
          {message}
        </div>
      ) : null}
    </>
  );
}
