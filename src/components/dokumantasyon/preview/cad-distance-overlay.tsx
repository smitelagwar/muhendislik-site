"use client";

import { useEffect, useRef, useState } from "react";

import type {
  CadDistanceMeasurementResult,
  CadDistanceMeasurementSnapshot,
} from "@/lib/dokumantasyon/cad-upstream/distance-measurement";
import type {
  CadSnapPoint,
  CadSnapPrimitive,
} from "@/lib/dokumantasyon/cad-upstream/snap-engine";
import {
  CAD_CHAIN_DISTANCE_SNAPSHOT_EVENT,
  dispatchCadChainDistanceAction,
  type CadChainDistanceSnapshot,
} from "@/lib/dokumantasyon/cad-upstream/chain-distance";
import { observeCadViewportRoot } from "@/lib/dokumantasyon/cad-upstream/viewport-coordination";
import { getCurrentCadMeasurementUnitSettings } from "@/lib/dokumantasyon/cad-review/store";
import {
  createCadReviewItemId,
  getCurrentCadReviewStore,
} from "@/lib/dokumantasyon/cad-review/active-store";
import {
  getCadNativeMeasurementReviewId,
  pruneCadNativeMeasurementRegistrations,
  registerCadNativeMeasurement,
} from "@/lib/dokumantasyon/cad-review/measurement-render-registry";
import {
  CAD_MEASUREMENT_CONTEXT_CHANGED_EVENT,
  calculateCalibrationFromWorldDistance,
  formatDistance,
  resolveCadMeasurementFileId,
  resolveCadSourceUnitContext,
  saveCadCalibration,
  type CadLengthUnit,
} from "@/lib/dokumantasyon/cad-review/units";
import { CadPrecisionOverlay, CadSnapGlyph } from "./cad-precision-overlay";

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

function midpoint(a: CadSnapPoint, b: CadSnapPoint): CadSnapPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function phaseMessage(
  snapshot: CadDistanceMeasurementSnapshot | null,
  formatValue: (value: number) => string
): string | null {
  if (!snapshot) return null;
  switch (snapshot.phase) {
    case "awaiting-first":
      return "1. noktayı seçin (Hassas seçim için basılı tutun | Esc: İptal)";
    case "pressing-first":
      return "Basılı tutmaya devam edin...";
    case "tracking-first":
      return "Bırakın: 1. noktayı ayarla";
    case "awaiting-second":
      return snapshot.distance === null
        ? "2. noktayı seçin (Esc: İptal)"
        : `Mesafe: ${formatValue(snapshot.distance)} (2. noktayı seçin | Esc: İptal)`;
    case "pressing-second":
      return "Basılı tutmaya devam edin...";
    case "tracking-second":
      return snapshot.distance === null
        ? "Bırakın: ölçümü tamamla"
        : `Bırakın: ${formatValue(snapshot.distance)}`;
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
  const [, setMeasurementContextRevision] = useState(0);
  const [calibrationValue, setCalibrationValue] = useState("");
  const [calibrationUnit, setCalibrationUnit] = useState<CadLengthUnit>("cm");
  const [calibrationError, setCalibrationError] = useState<string | null>(null);
  const [chainSnapshot, setChainSnapshot] = useState<CadChainDistanceSnapshot | null>(null);

  useEffect(() => {
    const refresh = () => setMeasurementContextRevision((value) => value + 1);
    window.addEventListener(CAD_MEASUREMENT_CONTEXT_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CAD_MEASUREMENT_CONTEXT_CHANGED_EVENT, refresh);
  }, []);

  useEffect(() => {
    const root = anchorRef.current?.parentElement;
    if (!root) return;
    return observeCadViewportRoot(root, () => {
      setMeasurementContextRevision((value) => value + 1);
    });
  }, []);

  useEffect(() => {
    const handleChainSnapshot = (event: Event) => {
      const next = (event as CustomEvent<CadChainDistanceSnapshot>).detail;
      setChainSnapshot(next.phase === "inactive" || next.phase === "complete" ? null : next);
    };
    window.addEventListener(CAD_CHAIN_DISTANCE_SNAPSHOT_EVENT, handleChainSnapshot);
    return () => window.removeEventListener(CAD_CHAIN_DISTANCE_SNAPSHOT_EVENT, handleChainSnapshot);
  }, []);

  const activeReviewStore = getCurrentCadReviewStore();
  useEffect(() => {
    if (!activeReviewStore) return;
    return activeReviewStore.subscribe(() => {
      setMeasurementContextRevision((value) => value + 1);
    });
  }, [activeReviewStore]);

  const measurementSettings = getCurrentCadMeasurementUnitSettings();
  const sourceUnitContext = resolveCadSourceUnitContext();
  const formatValue = (value: number) =>
    formatDistance(
      value,
      sourceUnitContext,
      measurementSettings.unit,
      measurementSettings.precision
    );

  useEffect(() => {
    const store = getCurrentCadReviewStore();
    if (!store) return;

    const activeNativeIds = new Set(measurements.map((measurement) => measurement.id));
    pruneCadNativeMeasurementRegistrations("distance", activeNativeIds);

    for (const measurement of measurements) {
      if (getCadNativeMeasurementReviewId("distance", measurement.id)) continue;
      const reviewId = createCadReviewItemId();
      registerCadNativeMeasurement("distance", measurement.id, reviewId);
      const now = new Date().toISOString();
      store.addItem({
        id: reviewId,
        type: "distance",
        start: { x: measurement.start.x, y: measurement.start.y },
        end: { x: measurement.end.x, y: measurement.end.y },
        measuredLength: measurement.distance,
        author: "Admin",
        comment: "",
        status: "open",
        style: {
          color: measurementSettings.color,
          strokeWidth: 2,
          opacity: 1,
        },
        createdAt: now,
        updatedAt: now,
      });
    }
  }, [measurements, measurementSettings.color]);

  const reviewStore = getCurrentCadReviewStore();
  const reviewItems = reviewStore?.getItems() ?? [];
  const selectedIds = reviewStore?.getSession().selectedItemIds ?? new Set<string>();

  const completed = measurements
    .map((measurement) => {
      const reviewId = getCadNativeMeasurementReviewId("distance", measurement.id);
      const reviewItem = reviewId
        ? reviewItems.find((item) => item.id === reviewId && item.type === "distance")
        : undefined;
      if (reviewId && !reviewItem) return null;
      if (reviewItem && (reviewItem.style.opacity ?? 1) <= 0) return null;

      const start = projectPoint(measurement.start);
      const end = projectPoint(measurement.end);
      return start && end
        ? {
            measurement,
            start,
            end,
            reviewItem,
            selected: Boolean(reviewId && selectedIds.has(reviewId)),
          }
        : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const first = snapshot?.firstPoint ? projectPoint(snapshot.firstPoint) : null;
  const preview = snapshot?.previewPoint ? projectPoint(snapshot.previewPoint) : null;
  const message = phaseMessage(snapshot, formatValue);
  const latestMeasurement = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const sourceUnitUnknown = sourceUnitContext.mmPerWorldUnit === null;

  const chainProjectedPoints = chainSnapshot?.points.map((point) => projectPoint(point)) ?? [];
  const chainCanRender = chainProjectedPoints.every((point) => point !== null);
  const chainPoints = chainCanRender ? (chainProjectedPoints as CadSnapPoint[]) : [];
  const chainPreview = chainSnapshot?.previewPoint ? projectPoint(chainSnapshot.previewPoint) : null;

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
      nearby = catalog
        .filter((primitive) => {
          const px = primitive.kind === "line" ? (primitive.a.x + primitive.b.x) / 2 : primitive.center.x;
          const py = primitive.kind === "line" ? (primitive.a.y + primitive.b.y) / 2 : primitive.center.y;
          return Math.abs(px - worldPoint.x) < 1000 && Math.abs(py - worldPoint.y) < 1000;
        })
        .slice(0, CAD_NEARBY_SNAP_LIMIT);
    }

    if (snapped.length === 0) return nearby.slice(0, 36);
    const snappedIds = new Set(snapped.map((primitive) => primitive.id));
    const merged = [...snapped, ...nearby.filter((primitive) => !snappedIds.has(primitive.id))];
    return merged.slice(0, 36);
  };

  const applyCalibration = () => {
    const fileId = resolveCadMeasurementFileId(anchorRef.current);
    const knownDistance = Number(calibrationValue.trim().replace(",", "."));
    if (!fileId) {
      setCalibrationError("Dosya kimliği bulunamadı.");
      return;
    }
    if (!latestMeasurement || latestMeasurement.distance <= 0) {
      setCalibrationError("Önce bilinen bir mesafeyi ölçün.");
      return;
    }
    if (!Number.isFinite(knownDistance) || knownDistance <= 0) {
      setCalibrationError("Gerçek uzunluk sıfırdan büyük olmalıdır.");
      return;
    }

    try {
      const calibration = calculateCalibrationFromWorldDistance(
        latestMeasurement.distance,
        knownDistance,
        calibrationUnit
      );
      saveCadCalibration(fileId, calibration);
      setCalibrationError(null);
      setCalibrationValue("");
      setMeasurementContextRevision((value) => value + 1);
    } catch (error) {
      setCalibrationError(error instanceof Error ? error.message : "Kalibrasyon uygulanamadı.");
    }
  };

  return (
    <>
      <span
        ref={anchorRef}
        className="hidden"
        data-cad-distance-overlay-anchor="true"
        data-cad-coordinate-root="viewport"
      />

      <svg
        className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
        aria-hidden="true"
        data-testid="cad-distance-overlay"
        data-cad-measurement-unit={measurementSettings.unit}
        data-cad-source-unit={sourceUnitContext.sourceUnit}
        data-cad-source-unit-source={sourceUnitContext.source}
        data-cad-coordinate-root="viewport"
      >
        {completed.map(({ measurement, start, end, reviewItem, selected }) => {
          const labelPoint = midpoint(start, end);
          const value = formatValue(measurement.distance);
          const displayLabel = reviewItem?.label ? `${reviewItem.label}: ${value}` : value;
          return (
            <g
              key={measurement.id}
              data-cad-distance-complete="true"
              data-cad-measurement-selected={selected ? "true" : "false"}
            >
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={measurementSettings.color}
                strokeWidth={selected ? "3" : "1.5"}
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={start.x} cy={start.y} r={selected ? 4.5 : 3} fill={measurementSettings.color} />
              <circle cx={end.x} cy={end.y} r={selected ? 4.5 : 3} fill={measurementSettings.color} />
              <text
                x={labelPoint.x}
                y={labelPoint.y - 7}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-semibold"
                stroke="var(--background)"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {displayLabel}
              </text>
            </g>
          );
        })}

        {chainSnapshot && chainCanRender ? (
          <g data-cad-chain-live="true">
            {chainPoints.slice(0, -1).map((point, index) => {
              const next = chainPoints[index + 1]!;
              const rawDistance = chainSnapshot.segmentDistances[index] ?? 0;
              const labelPoint = midpoint(point, next);
              return (
                <g key={`chain-segment-${index}`} data-cad-chain-segment={index + 1}>
                  <line
                    x1={point.x}
                    y1={point.y}
                    x2={next.x}
                    y2={next.y}
                    stroke={measurementSettings.color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y - 7}
                    textAnchor="middle"
                    className="fill-foreground text-[11px] font-semibold"
                    stroke="var(--background)"
                    strokeWidth="3"
                    paintOrder="stroke"
                  >
                    {formatValue(rawDistance)}
                  </text>
                </g>
              );
            })}
            {chainPoints.map((point, index) => (
              <circle
                key={`chain-point-${index}`}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={measurementSettings.color}
                stroke="var(--background)"
                strokeWidth="1.5"
              />
            ))}
            {chainPoints.length > 0 && chainPreview ? (
              <line
                x1={chainPoints[chainPoints.length - 1]!.x}
                y1={chainPoints[chainPoints.length - 1]!.y}
                x2={chainPreview.x}
                y2={chainPreview.y}
                stroke={measurementSettings.color}
                strokeWidth="2"
                strokeDasharray="6 4"
                vectorEffect="non-scaling-stroke"
                data-cad-chain-preview="true"
              />
            ) : null}
            {chainPreview && chainSnapshot.previewSnap ? (
              <CadSnapGlyph
                mode={chainSnapshot.previewSnap.mode}
                x={chainPreview.x}
                y={chainPreview.y}
                size={11}
              />
            ) : chainPreview ? (
              <circle
                cx={chainPreview.x}
                cy={chainPreview.y}
                r="4"
                fill="none"
                stroke={measurementSettings.color}
                strokeWidth="2"
                data-cad-chain-preview-point="true"
              />
            ) : null}
          </g>
        ) : null}

        {first ? <circle cx={first.x} cy={first.y} r="3.5" fill={measurementSettings.color} /> : null}

        {first && preview ? (
          <>
            <line
              x1={first.x}
              y1={first.y}
              x2={preview.x}
              y2={preview.y}
              stroke={measurementSettings.color}
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
                : formatValue(snapshot.distance)}
            </text>
          </>
        ) : null}

        {preview ? (
          <circle
            cx={preview.x}
            cy={preview.y}
            r={snapshot?.previewSnap ? 4.5 : 3.5}
            fill={snapshot?.previewSnap ? measurementSettings.color : "var(--background)"}
            stroke={measurementSettings.color}
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

      {chainSnapshot ? (
        <div
          className="pointer-events-none absolute left-1/2 top-3 z-30 w-[min(94vw,560px)] -translate-x-1/2"
          role="status"
          aria-live="polite"
          data-testid="cad-chain-distance-status"
          data-cad-chain-points={chainSnapshot.points.length}
          data-cad-chain-segments={chainSnapshot.segmentDistances.length}
        >
          <div className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
            <div className="min-w-0">
              <div className="font-semibold text-foreground">Sürekli Mesafe</div>
              <div className="truncate text-muted-foreground">
                {chainSnapshot.points.length} nokta · {chainSnapshot.segmentDistances.length} segment · Toplam {formatValue(chainSnapshot.totalDistance)}
              </div>
            </div>
            <div className="pointer-events-auto flex shrink-0 gap-2">
              <button
                type="button"
                className="min-h-11 rounded-md border border-border bg-background px-3 text-xs font-semibold hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-8"
                disabled={chainSnapshot.points.length === 0}
                onClick={() => dispatchCadChainDistanceAction("undo-last")}
                data-testid="cad-chain-undo-last"
              >
                ↶ Son Nokta
              </button>
              <button
                type="button"
                className="min-h-11 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:min-h-8"
                disabled={chainSnapshot.points.length < 2}
                onClick={() => dispatchCadChainDistanceAction("finish")}
                data-testid="cad-chain-finish"
              >
                ✓ Bitir
              </button>
            </div>
          </div>
        </div>
      ) : null}

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

      {sourceUnitUnknown ? (
        <div
          className="pointer-events-auto absolute bottom-12 left-1/2 z-30 w-[min(92vw,430px)] -translate-x-1/2 rounded-lg border border-amber-500/50 bg-background/95 p-3 text-xs text-foreground shadow-lg backdrop-blur"
          role="status"
          data-testid="cad-measurement-unit-warning"
        >
          <div className="font-semibold text-amber-500">Çizim birimi bilinmiyor</div>
          <div className="mt-1 text-muted-foreground">
            Sahte m/cm etiketi gösterilmiyor. Kalibrasyon için bilinen bir mesafeyi ölçün ve gerçek uzunluğu girin.
          </div>

          {latestMeasurement ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">
                Referans: {formatDistance(latestMeasurement.distance, sourceUnitContext, measurementSettings.unit, measurementSettings.precision)}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={calibrationValue}
                onChange={(event) => setCalibrationValue(event.target.value)}
                className="h-8 w-24 rounded-md border border-border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                placeholder="50"
                aria-label="Gerçek referans uzunluğu"
                data-testid="cad-calibration-value"
                data-cad-calibration-reference="snapped-measurement"
              />
              <select
                value={calibrationUnit}
                onChange={(event) => setCalibrationUnit(event.target.value as CadLengthUnit)}
                className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                aria-label="Kalibrasyon birimi"
                data-testid="cad-calibration-unit"
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="m">m</option>
              </select>
              <button
                type="button"
                onClick={applyCalibration}
                className="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
                data-testid="cad-calibration-apply"
              >
                Kalibre Et
              </button>
            </div>
          ) : null}

          {calibrationError ? (
            <div className="mt-1.5 text-destructive" role="alert">
              {calibrationError}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
