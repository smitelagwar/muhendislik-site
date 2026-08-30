import { useEffect, useState } from "react";
import {
  CadAreaMeasurementResult,
  CadAreaMeasurementSnapshot,
  formatArea,
} from "@/lib/dokumantasyon/cad-upstream/area-measurement";
import { CadSnapPoint } from "@/lib/dokumantasyon/cad-upstream/snap-engine";
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
            <g key={m.id} data-cad-area-complete="true">
              {/* Semi-transparent filled polygon */}
              <polygon
                points={polyStr}
                fill="rgba(16, 185, 129, 0.20)"
                stroke="#10b981"
                strokeWidth="2"
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
                  fill="#10b981"
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
                    stroke="#10b981"
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
                    Alan: {formatArea(m.area)} çizim birimi²
                  </text>
                </g>
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
                      ? `Alan: ${formatArea(snapshot.area)} çizim birimi² (3. noktayı seçin | Esc: İptal | Backspace: Geri al)`
                      : "3. noktayı seçin (Esc: İptal | Backspace: Geri al)"
                    : `Alan: ${formatArea(snapshot.area ?? 0)} çizim birimi² (${snapshot.points.length + 1}. noktayı seçin | Enter: Bitir | Esc: İptal)`}
            </span>

            {/* Direct Finish button for touch or mouse users */}
            {snapshot.points.length >= 3 ? (
              <Button
                type="button"
                size="sm"
                variant="default"
                className="pointer-events-auto h-6 rounded-full px-2.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
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
    </>
  );
}
