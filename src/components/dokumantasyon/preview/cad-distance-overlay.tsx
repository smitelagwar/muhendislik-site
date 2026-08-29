"use client";

import type {
  CadDistanceMeasurementResult,
  CadDistanceMeasurementSnapshot,
} from "@/lib/dokumantasyon/cad-upstream/distance-measurement";
import type { CadSnapPoint } from "@/lib/dokumantasyon/cad-upstream/snap-engine";

export interface CadDistanceOverlayMeasurement extends CadDistanceMeasurementResult {
  id: string;
}

function formatDistance(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 3,
  }).format(value);
}

function midpoint(a: CadSnapPoint, b: CadSnapPoint): CadSnapPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function phaseMessage(snapshot: CadDistanceMeasurementSnapshot | null): string | null {
  if (!snapshot || snapshot.phase === "inactive" || snapshot.phase === "complete") return null;
  switch (snapshot.phase) {
    case "awaiting-first":
      return "1. nokta için basılı tutun";
    case "pressing-first":
      return "Basılı tutmaya devam edin";
    case "tracking-first":
      return "Bırakın: 1. noktayı sabitle";
    case "awaiting-second":
      return "2. nokta için basılı tutun";
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

export function CadDistanceOverlay({
  snapshot,
  measurements,
  projectPoint,
}: {
  snapshot: CadDistanceMeasurementSnapshot | null;
  measurements: readonly CadDistanceOverlayMeasurement[];
  projectPoint: (point: CadSnapPoint) => CadSnapPoint | null;
}) {
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

  return (
    <>
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
            data-cad-distance-preview="true"
          />
        ) : null}
      </svg>

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
