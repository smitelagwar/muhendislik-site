import { useEffect, useState } from "react";
import {
  CadAreaMeasurementResult,
  CadAreaMeasurementSnapshot,
  formatArea,
} from "@/lib/dokumantasyon/cad-upstream/area-measurement";
import { CadSnapPoint } from "@/lib/dokumantasyon/cad-upstream/snap-engine";
import { Button } from "@/components/ui/button";
import { validateCadPolygon } from "@/lib/dokumantasyon/cad-upstream/polygon-geometry";
import { Check } from "lucide-react";
import {
  formatArea as formatPhysicalArea,
  formatDistance as formatPhysicalDistance,
  type CadAreaUnit, type CadUnit, type CadSourceUnitContext,
} from "@/lib/dokumantasyon/cad-review/units";

export interface CompletedAreaMeasurement extends CadAreaMeasurementResult {
  readonly id: string;
  readonly formattedArea?: string;
  readonly formattedPerimeter?: string;
  readonly color?: string;
  readonly isSelected?: boolean;
}

interface CadAreaOverlayProps {
  readonly snapshot: CadAreaMeasurementSnapshot | null;
  readonly measurements: readonly CompletedAreaMeasurement[];
  readonly projectPoint: (point: CadSnapPoint) => CadSnapPoint | null;
  readonly onFinish?: () => void;
  readonly onCancel?: () => void;
  readonly onUndoPoint?: () => void;
  readonly onSelectMeasurement?: (id: string) => void;
  readonly sourceContext?: CadSourceUnitContext;
  readonly displayAreaUnit?: CadAreaUnit;
  readonly displayLengthUnit?: CadUnit;
  readonly precision?: number;
  readonly areaPrecision?: number;
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
  onCancel,
  onUndoPoint,
  onSelectMeasurement,
  sourceContext,
  displayAreaUnit = "m2",
  displayLengthUnit = "m",
  precision = 2,
  areaPrecision = 2,
}: CadAreaOverlayProps) {
  const [, setRenderTick] = useState(0);

  // Re-project whenever view moves or changes
  useEffect(() => {
    const handleViewChange = () => setRenderTick((tick) => (tick + 1) % 10000);
    window.addEventListener("resize", handleViewChange);
    return () => {
      window.removeEventListener("resize", handleViewChange);
    };
  }, []);

  const hasActive = Boolean(
    snapshot && (snapshot.phase === "awaiting-first" || snapshot.phase === "awaiting-next")
  );
  const hasCompleted = measurements.length > 0;
  const liveArea = (raw: number) => sourceContext
    ? formatPhysicalArea(raw, sourceContext, displayAreaUnit, areaPrecision)
    : `${formatArea(raw)} çizim birimi²`;
  const livePerimeter = (raw: number) => sourceContext
    ? formatPhysicalDistance(raw, sourceContext, displayLengthUnit, precision)
    : `${formatArea(raw)} çizim birimi`;

  if (!hasActive && !hasCompleted) {
    return null;
  }

  // Project active points
  const activeConfirmed = snapshot?.points.map(projectPoint) ?? [];
  const activePreview = snapshot?.previewPoint ? projectPoint(snapshot.previewPoint) : null;

  // Build live polygon points
  const livePolyPoints = activePreview
    ? [...activeConfirmed, activePreview]
    : activeConfirmed;

  return (
    <>
      <svg
        className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
        data-testid="cad-area-overlay"
        data-cad-area-overlay="true"
      >
        {/* 1. Completed Measurements */}
        {measurements.map((m) => {
          const projectedPoints = m.points.map(projectPoint).filter((p): p is CadSnapPoint => p !== null);
          if (projectedPoints.length < 3) return null;
          const polyStr = pointsToString(projectedPoints);
          const centroidProjected = projectPoint(m.centroid);

          return (
            <g
              key={m.id}
              data-cad-area-complete="true"
              data-review-id={m.id}
              style={onSelectMeasurement ? { pointerEvents: "auto", cursor: "pointer", touchAction: "none" } : undefined}
              role={onSelectMeasurement ? "button" : undefined}
              tabIndex={onSelectMeasurement ? 0 : undefined}
              onClick={onSelectMeasurement ? () => onSelectMeasurement(m.id) : undefined}
              onKeyDown={onSelectMeasurement ? event => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectMeasurement(m.id);
                }
              } : undefined}
            >
              {/* Semi-transparent filled polygon */}
              <polygon
                points={polyStr}
                fill="rgba(16, 185, 129, 0.20)"
                stroke={m.color ?? "#10b981"}
                strokeWidth={m.isSelected ? 3 : 2}
                strokeDasharray="6 4"
                data-cad-area-polygon="true"
              />

              {/* Vertex dots */}
              {projectedPoints.map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill={m.color ?? "#10b981"}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              ))}

              {/* Centroid badge */}
              {centroidProjected ? (
                <g
                  transform={`translate(${centroidProjected.x}, ${centroidProjected.y})`}
                  data-cad-area-badge="true"
                >
                  <rect
                    x="-105"
                    y="-15"
                    width="210"
                    height="30"
                    rx="6"
                    fill="rgba(15, 23, 42, 0.92)"
                    stroke={m.color ?? "#10b981"}
                    strokeWidth="1.2"
                  />
                  <text
                    textAnchor="middle"
                    y="5"
                    fill="#f8fafc"
                    fontSize="11.5"
                    fontWeight="600"
                    fontFamily="monospace, sans-serif"
                  >
                    Alan: {m.formattedArea ?? liveArea(m.area)}
                  </text>
                </g>
              ) : null}
              {centroidProjected ? (
                <text
                  x={centroidProjected.x}
                  y={centroidProjected.y + 26}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="10"
                  className="fill-foreground"
                  stroke="var(--background)"
                  strokeWidth="2"
                  paintOrder="stroke"
                >
                  Çevre: {m.formattedPerimeter ?? livePerimeter(m.perimeter)}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* 2. Active in-progress measurement */}
        {hasActive && snapshot ? (
          <g data-cad-area-active="true">
            {/* Live filled preview polygon (if >= 2 points + cursor) */}
            {livePolyPoints.length >= 3 ? (
              <polygon
                points={pointsToString(livePolyPoints)}
                fill="rgba(59, 130, 246, 0.18)"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                data-cad-area-preview="true"
              />
            ) : null}

            {/* Confirmed lines */}
            {activeConfirmed.length >= 2 ? (
              <polyline
                points={pointsToString(activeConfirmed)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            ) : null}

            {/* Live rubber-band line from last point to preview cursor */}
            {activeConfirmed.length >= 1 && activePreview ? (
              <line
                x1={activeConfirmed[activeConfirmed.length - 1]!.x}
                y1={activeConfirmed[activeConfirmed.length - 1]!.y}
                x2={activePreview.x}
                y2={activePreview.y}
                stroke="#3b82f6"
                strokeWidth="2"
                data-cad-area-rubber-band="true"
              />
            ) : null}

            {/* Closing guide line from preview cursor back to first point */}
            {activeConfirmed.length >= 2 && activePreview ? (
              <line
                x1={activePreview.x}
                y1={activePreview.y}
                x2={activeConfirmed[0]!.x}
                y2={activeConfirmed[0]!.y}
                stroke="rgba(59, 130, 246, 0.5)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            ) : null}

            {/* Vertex dots */}
            {activeConfirmed.map((p, idx) =>
              p ? (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill={idx === 0 && activeConfirmed.length >= 3 ? "#10b981" : "#3b82f6"}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  data-cad-area-vertex={idx}
                />
              ) : null
            )}

            {/* Snap indicator marker */}
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

      {/* 3. Top Floating Status Banner */}
      {hasActive && snapshot ? (
        <div className="pointer-events-none absolute left-1/2 z-30 -translate-x-1/2"
             style={{ top: "calc(0.75rem + env(safe-area-inset-top))" }}>
          <div
            className="pointer-events-auto flex max-w-[calc(100vw-1rem)] flex-wrap items-center justify-center gap-2 rounded-xl border border-border/80 bg-background/95 px-3 py-2 shadow-md backdrop-blur text-xs font-medium"
            data-testid="cad-area-status"
          >
            <span role="status" aria-live="polite">
              {snapshot.validationError
                ? snapshot.validationError
                : snapshot.points.length === 0
                  ? "1. noktayı seçin (Esc: İptal)"
                  : snapshot.points.length === 1
                    ? "2. noktayı seçin (Esc: İptal | Backspace: Geri al)"
                    : snapshot.points.length === 2
                      ? snapshot.area !== null
                        ? `Alan: ${liveArea(snapshot.area)} · Çevre: ${livePerimeter(snapshot.perimeter ?? 0)} (3. noktayı seçin)`
                        : "3. noktayı seçin (Esc: İptal | Backspace: Geri al)"
                      : snapshot.area !== null
                        ? `Alan: ${liveArea(snapshot.area)} · Çevre: ${livePerimeter(snapshot.perimeter ?? 0)}`
                        : "Noktaları seçin veya düzeltin"}
            </span>
            <span className="text-[10px] text-muted-foreground">Düz kenarlı poligon; yaylar ölçüme dahil değil</span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-11 min-w-11 rounded-md px-3 text-xs"
                onClick={() => onUndoPoint?.()}
                disabled={snapshot.points.length === 0}
                data-testid="cad-area-undo-point"
              >Geri</Button>
              <Button
                type="button"
                size="sm"
                variant="default"
                className="min-h-11 min-w-11 rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                onClick={() => onFinish?.()}
                disabled={!validateCadPolygon(snapshot.points).valid}
                data-testid="cad-area-finish-btn"
                title="Alan ölçümünü tamamla (Enter)"
              >
                <Check className="mr-1 h-3 w-3" />
                Bitir
              </Button>
              {onCancel ? (
                <Button type="button" size="sm" variant="outline"
                  className="min-h-11 min-w-11 rounded-md px-3 text-xs"
                  onClick={onCancel} data-testid="cad-area-cancel-btn">İptal</Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
