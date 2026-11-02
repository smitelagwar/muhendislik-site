"use client";

import type { CadChainDistanceSnapshot } from "@/lib/dokumantasyon/cad-upstream/chain-distance";
import type { CadSnapPoint, CadSnapMode } from "@/lib/dokumantasyon/cad-upstream/snap-engine";
import {
  formatDistance,
  type CadSourceUnitContext,
  type CadUnit,
} from "@/lib/dokumantasyon/cad-review/units";

export interface CadChainDistanceOverlayProps {
  snapshot: CadChainDistanceSnapshot | null;
  projectPoint: (world: CadSnapPoint) => CadSnapPoint | null;
  sourceContext: CadSourceUnitContext;
  displayUnit: CadUnit;
  precision: number;
  onConfirmPoint: () => void;
  onUndoPoint: () => void;
  onFinish: () => void;
}

const SNAP_LABELS: Record<CadSnapMode, string> = {
  endpoint: "Uç",
  midpoint: "Orta",
  intersection: "Kesişim",
  center: "Merkez",
  nearest: "Yakın",
  perpendicular: "Dik",
};

/** Only the measurement path and compact explicit control buttons receive rendering. */
export function CadChainDistanceOverlay({
  snapshot,
  projectPoint,
  sourceContext,
  displayUnit,
  precision,
  onConfirmPoint,
  onUndoPoint,
  onFinish,
}: CadChainDistanceOverlayProps) {
  if (!snapshot || snapshot.phase === "inactive" || snapshot.phase === "complete") return null;

  const committed = snapshot.points.map(projectPoint);
  const projected = committed.filter((p): p is CadSnapPoint => p !== null);
  const preview = snapshot.previewPoint ? projectPoint(snapshot.previewPoint) : null;
  const last = snapshot.points[snapshot.points.length - 1] ?? null;
  const previewWorldDistance =
    last && snapshot.previewPoint
      ? Math.hypot(snapshot.previewPoint.x - last.x, snapshot.previewPoint.y - last.y)
      : 0;
  const running = snapshot.totalDistance + previewWorldDistance;
  const totalLabel = formatDistance(running, sourceContext, displayUnit, precision);
  const path = projected.map((p, index) =>
    (index === 0 ? "M " : " L ") + p.x + " " + p.y
  ).join("");
  const marker = snapshot.previewSnap?.mode ?? null;
  const canFinish = snapshot.points.length >= 2;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      data-cad-chain-phase={snapshot.phase}
      data-testid="cad-chain-distance-overlay"
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {projected.length === snapshot.points.length && projected.length > 1 ? (
          <path d={path} stroke="#38bdf8" strokeWidth={2} fill="none" strokeLinejoin="round" />
        ) : null}
        {projected.map((p, index) => (
          <circle key={index} cx={p.x} cy={p.y} r={4} fill="#0ea5e9" stroke="white" strokeWidth={1.5} />
        ))}
        {preview && projected.length === snapshot.points.length && projected.length > 0 ? (
          <line
            x1={projected[projected.length - 1]!.x}
            y1={projected[projected.length - 1]!.y}
            x2={preview.x}
            y2={preview.y}
            stroke="#7dd3fc"
            strokeWidth={2}
            strokeDasharray="6 5"
          />
        ) : null}
        {preview ? (
          <g transform={`translate(${preview.x} ${preview.y})`}>
            <circle r={10} fill="#082f49" fillOpacity={0.88} stroke="#38bdf8" strokeWidth={1.5} />
            {marker === "endpoint" ? <rect x={-4} y={-4} width={8} height={8} stroke="white" strokeWidth={1.5} fill="none" /> : null}
            {marker === "midpoint" ? <path d="M 0 -5 L 5 4 L -5 4 Z" fill="none" stroke="white" strokeWidth={1.5} /> : null}
            {marker === "intersection" ? <path d="M -5 -5 L 5 5 M 5 -5 L -5 5" stroke="white" strokeWidth={1.5} /> : null}
            {marker === "center" ? <circle r={4.5} stroke="white" strokeWidth={1.5} fill="none" /> : null}
            {marker === "nearest" ? <path d="M 0 -5 L 5 0 L 0 5 L -5 0 Z" stroke="white" strokeWidth={1.5} fill="none" /> : null}
            {marker === "perpendicular" ? <path d="M -5 5 L -5 -4 L 4 -4 M -5 5 L 4 5" fill="none" stroke="white" strokeWidth={1.5} /> : null}
            {!marker ? <circle r={2.5} fill="white" /> : null}
          </g>
        ) : null}
      </svg>
      <div className="pointer-events-auto absolute bottom-3 right-3 flex max-w-[calc(100%-1.5rem)] flex-col items-end gap-2 rounded-xl border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur-sm sm:bottom-4 sm:right-4">
        <div className="text-right text-xs" aria-live="polite" aria-atomic="true">
          <span className="font-medium">Zincir: {totalLabel}</span>
          <span className="ml-2 text-muted-foreground">({snapshot.points.length} nokta)</span>
          {marker ? <span className="ml-2 text-sky-600 dark:text-sky-300">OSNAP: {SNAP_LABELS[marker]}</span> : null}
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <button
            type="button"
            onClick={onConfirmPoint}
            disabled={!preview}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Hedefteki zincir noktasını ekle"
            data-testid="cad-chain-add-point"
          >Nokta ekle</button>
          <button
            type="button"
            onClick={onUndoPoint}
            disabled={snapshot.points.length === 0}
            className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Zincirde son noktayı geri al"
            data-testid="cad-chain-backspace"
          >Geri</button>
          <button
            type="button"
            onClick={onFinish}
            disabled={!canFinish}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
            data-testid="cad-chain-finish"
          >Bitir</button>
        </div>
        <span className="text-[10px] text-muted-foreground">ESC: taslağı sil / çık · Enter: bitir</span>
      </div>
    </div>
  );
}
