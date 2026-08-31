import { useEffect, useState } from "react";
import type {
  CadAreaMeasurementResult,
  CadAreaMeasurementSnapshot,
} from "@/lib/dokumantasyon/cad-upstream/area-measurement";
import type { CadSnapPoint } from "@/lib/dokumantasyon/cad-upstream/snap-engine";
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
  formatArea,
  formatDistance,
  resolveCadSourceUnitContext,
  type CadAreaUnit,
} from "@/lib/dokumantasyon/cad-review/units";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export interface CompletedAreaMeasurement extends CadAreaMeasurementResult {
  readonly id: string;
}

interface CadAreaOverlayProps {
  readonly snapshot: CadAreaMeasurementSnapshot | null;
  readonly measurements: readonly CompletedAreaMeasurement[];
  readonly projectPoint: (point: CadSnapPoint) => CadSnapPoint | null;
  readonly onFinish?: () => void;
}

function pointsToString(points: readonly (CadSnapPoint | null)[]): string {
  return points
    .filter((p): p is CadSnapPoint => p !== null)
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

export function CadAreaOverlay({
  snapshot,
  measurements,
  projectPoint,
  onFinish,
}: CadAreaOverlayProps) {
  const [, setRenderTick] = useState(0);
  const [areaUnitOverrides, setAreaUnitOverrides] = useState<Record<string, CadAreaUnit>>({});
  const [unitMenu, setUnitMenu] = useState<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const handleViewChange = () => setRenderTick((tick) => (tick + 1) % 10000);
    window.addEventListener("resize", handleViewChange);
    window.addEventListener(CAD_MEASUREMENT_CONTEXT_CHANGED_EVENT, handleViewChange);
    return () => {
      window.removeEventListener("resize", handleViewChange);
      window.removeEventListener(CAD_MEASUREMENT_CONTEXT_CHANGED_EVENT, handleViewChange);
    };
  }, []);

  const activeReviewStore = getCurrentCadReviewStore();
  useEffect(() => {
    if (!activeReviewStore) return;
    return activeReviewStore.subscribe(() => setRenderTick((tick) => (tick + 1) % 10000));
  }, [activeReviewStore]);

  const measurementSettings = getCurrentCadMeasurementUnitSettings();
  const sourceUnitContext = resolveCadSourceUnitContext();
  const measurementColor = measurementSettings.color;

  useEffect(() => {
    const store = getCurrentCadReviewStore();
    if (!store) return;

    const activeNativeIds = new Set(measurements.map((measurement) => measurement.id));
    pruneCadNativeMeasurementRegistrations("area", activeNativeIds);

    for (const measurement of measurements) {
      if (getCadNativeMeasurementReviewId("area", measurement.id)) continue;
      const reviewId = createCadReviewItemId();
      registerCadNativeMeasurement("area", measurement.id, reviewId);
      const now = new Date().toISOString();
      store.addItem({
        id: reviewId,
        type: "area",
        points: measurement.points.map((point) => ({ x: point.x, y: point.y })),
        measuredArea: measurement.area,
        measuredPerimeter: measurement.perimeter,
        author: "Admin",
        comment: "",
        status: "open",
        style: {
          color: measurementColor,
          strokeWidth: 2,
          opacity: 1,
        },
        createdAt: now,
        updatedAt: now,
      });
    }
  }, [measurements, measurementColor]);

  const formatAreaValue = (value: number, unit: CadAreaUnit = measurementSettings.areaUnit) =>
    formatArea(value, sourceUnitContext, unit, measurementSettings.areaPrecision);
  const formatPerimeterValue = (value: number) =>
    formatDistance(value, sourceUnitContext, measurementSettings.unit, measurementSettings.precision);

  const hasActive = Boolean(
    snapshot && (snapshot.phase === "awaiting-first" || snapshot.phase === "awaiting-next")
  );
  const hasCompleted = measurements.length > 0;

  if (!hasActive && !hasCompleted) return null;

  const reviewStore = getCurrentCadReviewStore();
  const reviewItems = reviewStore?.getItems() ?? [];
  const selectedIds = reviewStore?.getSession().selectedItemIds ?? new Set<string>();
  const activeConfirmed = snapshot?.points.map(projectPoint) ?? [];
  const activePreview = snapshot?.previewPoint ? projectPoint(snapshot.previewPoint) : null;
  const livePolyPoints = activePreview ? [...activeConfirmed, activePreview] : activeConfirmed;

  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
        data-testid="cad-area-overlay"
        data-cad-area-overlay="true"
        data-cad-area-unit={measurementSettings.areaUnit}
        data-cad-source-unit={sourceUnitContext.sourceUnit}
      >
        {measurements.map((m) => {
          const reviewId = getCadNativeMeasurementReviewId("area", m.id);
          const reviewItem = reviewId
            ? reviewItems.find((item) => item.id === reviewId && item.type === "area")
            : undefined;
          if (reviewId && !reviewItem) return null;
          if (reviewItem && (reviewItem.style.opacity ?? 1) <= 0) return null;

          const projectedPoints = m.points.map(projectPoint).filter((p): p is CadSnapPoint => p !== null);
          if (projectedPoints.length < 3) return null;
          const selected = Boolean(reviewId && selectedIds.has(reviewId));
          const polyStr = pointsToString(projectedPoints);
          const centroidProjected = projectPoint(m.centroid);
          const displayAreaUnit = areaUnitOverrides[m.id] ?? measurementSettings.areaUnit;
          const areaLabel = formatAreaValue(m.area, displayAreaUnit);
          const perimeterLabel = formatPerimeterValue(m.perimeter);
          const title = reviewItem?.comment.trim();

          return (
            <g
              key={m.id}
              data-cad-area-complete="true"
              data-cad-measurement-selected={selected ? "true" : "false"}
            >
              <polygon
                points={polyStr}
                fill={measurementColor}
                fillOpacity={selected ? "0.24" : "0.16"}
                stroke={measurementColor}
                strokeWidth={selected ? "3.5" : "2"}
                strokeDasharray="6 4"
                data-cad-area-polygon="true"
              />

              {projectedPoints.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r={selected ? "5" : "3.5"}
                  fill={measurementColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              ))}

              {centroidProjected ? (
                <g
                  transform={`translate(${centroidProjected.x}, ${centroidProjected.y})`}
                  data-cad-area-badge="true"
                  data-cad-area-display-unit={displayAreaUnit}
                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                  onClick={() => setUnitMenu({ id: m.id, x: centroidProjected.x, y: centroidProjected.y })}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    setUnitMenu({ id: m.id, x: centroidProjected.x, y: centroidProjected.y });
                  }}
                >
                  <title>Alan gösterim birimini değiştir</title>
                  <rect
                    x="-108"
                    y={title ? "-30" : "-22"}
                    width="216"
                    height={title ? "52" : "44"}
                    rx="7"
                    fill="rgba(15, 23, 42, 0.94)"
                    stroke={measurementColor}
                    strokeWidth={selected ? "2" : "1.2"}
                  />
                  {title ? (
                    <text
                      textAnchor="middle"
                      y="-14"
                      fill="#93c5fd"
                      fontSize="9.5"
                      fontWeight="700"
                      fontFamily="system-ui, sans-serif"
                    >
                      {title}
                    </text>
                  ) : null}
                  <text
                    textAnchor="middle"
                    y={title ? "2" : "-2"}
                    fill="#f8fafc"
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="monospace, sans-serif"
                  >
                    Alan: {areaLabel}
                  </text>
                  <text
                    textAnchor="middle"
                    y="14"
                    fill="#cbd5e1"
                    fontSize="9.5"
                    fontWeight="500"
                    fontFamily="monospace, sans-serif"
                  >
                    Çevre: {perimeterLabel}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}

        {hasActive && snapshot ? (
          <g data-cad-area-active="true">
            {livePolyPoints.length >= 3 ? (
              <polygon
                points={pointsToString(livePolyPoints)}
                fill={measurementColor}
                fillOpacity="0.12"
                stroke={measurementColor}
                strokeWidth="1.5"
                strokeDasharray="4 4"
                data-cad-area-preview="true"
              />
            ) : null}

            {activeConfirmed.length >= 2 ? (
              <polyline
                points={pointsToString(activeConfirmed)}
                fill="none"
                stroke={measurementColor}
                strokeWidth="2"
              />
            ) : null}

            {activeConfirmed.length >= 1 && activePreview ? (
              <line
                x1={activeConfirmed[activeConfirmed.length - 1]!.x}
                y1={activeConfirmed[activeConfirmed.length - 1]!.y}
                x2={activePreview.x}
                y2={activePreview.y}
                stroke={measurementColor}
                strokeWidth="2"
                data-cad-area-rubber-band="true"
              />
            ) : null}

            {activeConfirmed.length >= 2 && activePreview ? (
              <line
                x1={activePreview.x}
                y1={activePreview.y}
                x2={activeConfirmed[0]!.x}
                y2={activeConfirmed[0]!.y}
                stroke={measurementColor}
                strokeOpacity="0.5"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            ) : null}

            {activeConfirmed.map((p, idx) =>
              p ? (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill={measurementColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  data-cad-area-vertex={idx}
                />
              ) : null
            )}

            {activePreview && snapshot.previewSnap ? (
              <circle
                cx={activePreview.x}
                cy={activePreview.y}
                r="7"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
              />
            ) : null}
          </g>
        ) : null}
      </svg>

      {hasActive && snapshot ? (
        <div className="pointer-events-none absolute left-1/2 top-3 z-30 -translate-x-1/2">
          <div
            className="pointer-events-none flex items-center gap-2 rounded-full border border-border/80 bg-background/95 px-4 py-1.5 shadow-md backdrop-blur text-xs font-medium"
            data-testid="cad-area-status"
          >
            <span>
              {snapshot.points.length === 0
                ? "1. noktayı seçin (Esc: İptal)"
                : snapshot.points.length === 1
                  ? "2. noktayı seçin (Esc: İptal | Backspace: Geri al)"
                  : snapshot.points.length === 2
                    ? snapshot.area !== null
                      ? `Alan: ${formatAreaValue(snapshot.area)} (3. noktayı seçin | Esc: İptal | Backspace: Geri al)`
                      : "3. noktayı seçin (Esc: İptal | Backspace: Geri al)"
                    : `Alan: ${formatAreaValue(snapshot.area ?? 0)} (${snapshot.points.length + 1}. noktayı seçin | Enter: Bitir | Esc: İptal)`}
            </span>

            {snapshot.points.length >= 3 ? (
              <Button
                type="button"
                size="sm"
                variant="default"
                className="pointer-events-auto h-6 rounded-full px-2.5 text-xs font-semibold"
                onClick={() => onFinish?.()}
                data-testid="cad-area-finish-btn"
                title="Alan ölçümünü tamamla (Enter)"
              >
                <Check className="mr-1 h-3 w-3" />
                Bitir
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {unitMenu ? (
        <div
          className="pointer-events-auto absolute z-40 min-w-32 -translate-x-1/2 translate-y-3 rounded-md border border-border bg-popover p-1 text-xs text-popover-foreground shadow-lg"
          style={{ left: unitMenu.x, top: unitMenu.y }}
          role="menu"
          aria-label="Alan gösterim birimi"
          data-testid="cad-area-unit-menu"
        >
          {(["m2", "cm2", "mm2"] as const).map((unit) => (
            <button
              key={unit}
              type="button"
              role="menuitemradio"
              aria-checked={(areaUnitOverrides[unitMenu.id] ?? measurementSettings.areaUnit) === unit}
              className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-accent"
              onClick={() => {
                setAreaUnitOverrides((current) => ({ ...current, [unitMenu.id]: unit }));
                setUnitMenu(null);
              }}
            >
              <span>{unit === "m2" ? "m²" : unit === "cm2" ? "cm²" : "mm²"}</span>
              {(areaUnitOverrides[unitMenu.id] ?? measurementSettings.areaUnit) === unit ? <Check className="h-3.5 w-3.5" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
