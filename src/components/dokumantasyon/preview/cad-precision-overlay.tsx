"use client";

import { useLayoutEffect, useRef } from "react";

import type { CadDistanceMeasurementSnapshot } from "@/lib/dokumantasyon/cad-upstream/distance-measurement";
import {
  CAD_PRECISION_MAGNIFIER_DIAMETER_PX,
  CAD_SNAP_MODE_LABELS,
  cadPrecisionOffsetDistance,
  resolveCadMagnifierCrop,
  resolveCadPrecisionLensPlacement,
} from "@/lib/dokumantasyon/cad-upstream/precision-ux";
import type { CadSnapMode, CadSnapPoint } from "@/lib/dokumantasyon/cad-upstream/snap-engine";

function SnapGlyph({
  mode,
  x,
  y,
  size = 8,
}: {
  mode: CadSnapMode;
  x: number;
  y: number;
  size?: number;
}) {
  const half = size / 2;
  const common = {
    fill: "var(--background)",
    stroke: "var(--primary)",
    strokeWidth: 1.8,
    vectorEffect: "non-scaling-stroke" as const,
  };

  switch (mode) {
    case "endpoint":
      return <rect x={x - half} y={y - half} width={size} height={size} rx="1" {...common} />;
    case "midpoint":
      return (
        <path
          d={`M ${x} ${y - half - 0.8} L ${x + half + 0.8} ${y + half} L ${x - half - 0.8} ${y + half} Z`}
          {...common}
        />
      );
    case "intersection":
      return (
        <g stroke="var(--primary)" strokeWidth="2" vectorEffect="non-scaling-stroke">
          <path d={`M ${x - half} ${y - half} L ${x + half} ${y + half}`} />
          <path d={`M ${x + half} ${y - half} L ${x - half} ${y + half}`} />
        </g>
      );
    case "center":
      return (
        <g fill="var(--background)" stroke="var(--primary)" strokeWidth="1.7" vectorEffect="non-scaling-stroke">
          <circle cx={x} cy={y} r={half + 0.5} />
          <path d={`M ${x - half - 2} ${y} L ${x + half + 2} ${y}`} />
          <path d={`M ${x} ${y - half - 2} L ${x} ${y + half + 2}`} />
        </g>
      );
    case "nearest":
      return (
        <path
          d={`M ${x} ${y - half - 0.8} L ${x + half + 0.8} ${y} L ${x} ${y + half + 0.8} L ${x - half - 0.8} ${y} Z`}
          {...common}
        />
      );
  }
}

function Crosshair({ x, y, size = 11 }: { x: number; y: number; size?: number }) {
  return (
    <g
      stroke="var(--primary)"
      strokeWidth="1.4"
      vectorEffect="non-scaling-stroke"
      opacity="0.95"
    >
      <path d={`M ${x - size} ${y} L ${x - 3} ${y}`} />
      <path d={`M ${x + 3} ${y} L ${x + size} ${y}`} />
      <path d={`M ${x} ${y - size} L ${x} ${y - 3}`} />
      <path d={`M ${x} ${y + 3} L ${x} ${y + size}`} />
    </g>
  );
}

export function CadPrecisionOverlay({
  snapshot,
  projectPoint,
  getSourceCanvas,
}: {
  snapshot: CadDistanceMeasurementSnapshot | null;
  projectPoint: (point: CadSnapPoint) => CadSnapPoint | null;
  getSourceCanvas: () => HTMLCanvasElement | null;
}) {
  const lensCanvasRef = useRef<HTMLCanvasElement>(null);
  const tracking =
    snapshot?.phase === "tracking-first" || snapshot?.phase === "tracking-second";
  const pointer = tracking ? snapshot.pointerScreenPoint : null;
  const target = tracking && snapshot?.previewPoint ? projectPoint(snapshot.previewPoint) : null;
  const snap = tracking ? snapshot?.previewSnap ?? null : null;
  const sourceCanvas = tracking ? getSourceCanvas() : null;
  const sourceWidth = sourceCanvas?.clientWidth || sourceCanvas?.getBoundingClientRect().width || 0;
  const sourceHeight = sourceCanvas?.clientHeight || sourceCanvas?.getBoundingClientRect().height || 0;
  const viewport = { width: sourceWidth, height: sourceHeight };
  const placement = pointer && sourceWidth > 0 && sourceHeight > 0
    ? resolveCadPrecisionLensPlacement(pointer, viewport)
    : null;
  const crop = target && sourceCanvas
    ? resolveCadMagnifierCrop(
        target,
        viewport,
        { width: sourceCanvas.width, height: sourceCanvas.height }
      )
    : null;
  const lensTarget = crop
    ? { x: crop.targetX, y: crop.targetY }
    : {
        x: CAD_PRECISION_MAGNIFIER_DIAMETER_PX / 2,
        y: CAD_PRECISION_MAGNIFIER_DIAMETER_PX / 2,
      };

  useLayoutEffect(() => {
    const lens = lensCanvasRef.current;
    if (!tracking || !lens || !sourceCanvas || !crop) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.round(CAD_PRECISION_MAGNIFIER_DIAMETER_PX * dpr);
    const height = Math.round(CAD_PRECISION_MAGNIFIER_DIAMETER_PX * dpr);
    if (lens.width !== width) lens.width = width;
    if (lens.height !== height) lens.height = height;
    lens.style.filter = sourceCanvas.style.filter || "";

    const context = lens.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, width, height);
    try {
      context.drawImage(
        sourceCanvas,
        crop.sx,
        crop.sy,
        crop.sw,
        crop.sh,
        0,
        0,
        width,
        height
      );
    } catch {
      context.clearRect(0, 0, width, height);
    }
  }, [crop, sourceCanvas, tracking]);

  if (!tracking || !pointer || !target) return null;

  const offsetDistance = cadPrecisionOffsetDistance(pointer, target);
  const label = snap ? CAD_SNAP_MODE_LABELS[snap.mode] : null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
      aria-hidden="true"
      data-testid="cad-precision-overlay"
      data-cad-precision-tracking="true"
      data-cad-snap-preview-mode={snap?.mode ?? "none"}
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible">
        {offsetDistance > 4 ? (
          <line
            x1={pointer.x}
            y1={pointer.y}
            x2={target.x}
            y2={target.y}
            stroke="var(--primary)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.5"
            vectorEffect="non-scaling-stroke"
            data-cad-offset-guide="true"
          />
        ) : null}
        <circle
          cx={pointer.x}
          cy={pointer.y}
          r="7"
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.35"
          vectorEffect="non-scaling-stroke"
          data-cad-touch-anchor="true"
        />
        <Crosshair x={target.x} y={target.y} />
        {snap ? <SnapGlyph mode={snap.mode} x={target.x} y={target.y} size={10} /> : null}
      </svg>

      {label ? (
        <div
          className="absolute rounded border border-primary/45 bg-background/94 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary shadow-sm backdrop-blur"
          style={{ left: target.x + 12, top: Math.max(8, target.y - 23) }}
          data-testid="cad-snap-label"
          data-cad-snap-label={snap?.mode}
        >
          {label}
        </div>
      ) : null}

      {placement ? (
        <div
          className="absolute"
          style={{
            left: placement.left,
            top: placement.top,
            width: CAD_PRECISION_MAGNIFIER_DIAMETER_PX,
            height: CAD_PRECISION_MAGNIFIER_DIAMETER_PX,
          }}
          data-testid="cad-precision-magnifier"
          data-cad-magnifier-side={placement.side}
        >
          <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-primary/70 bg-background/95 shadow-xl ring-1 ring-background/70">
            <canvas ref={lensCanvasRef} className="absolute inset-0 h-full w-full" />
            <svg className="absolute inset-0 h-full w-full">
              <Crosshair x={lensTarget.x} y={lensTarget.y} size={14} />
              {snap ? (
                <SnapGlyph
                  mode={snap.mode}
                  x={lensTarget.x}
                  y={lensTarget.y}
                  size={12}
                />
              ) : null}
            </svg>
            {label ? (
              <div
                className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded bg-background/88 px-1.5 py-0.5 text-[9px] font-bold leading-none text-primary shadow-sm"
                data-cad-magnifier-snap-label={snap?.mode}
              >
                {label}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
