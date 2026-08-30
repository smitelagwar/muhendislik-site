"use client";

import { useLayoutEffect, useRef } from "react";

import type { CadDistanceMeasurementSnapshot } from "@/lib/dokumantasyon/cad-upstream/distance-measurement";
import {
  CAD_PRECISION_MAGNIFIER_ZOOM,
  CAD_SNAP_MODE_LABELS,
  cadPrecisionOffsetDistance,
  resolveCadMagnifierCrop,
  resolveCadMagnifierDiameter,
  resolveCadPrecisionLensPlacement,
} from "@/lib/dokumantasyon/cad-upstream/precision-ux";
import type {
  CadSnapMode,
  CadSnapPoint,
  CadSnapPrimitive,
} from "@/lib/dokumantasyon/cad-upstream/snap-engine";

function SnapGlyph({ mode, x, y, size = 8 }: { mode: CadSnapMode; x: number; y: number; size?: number }) {
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
      return <path d={`M ${x} ${y - half - 0.8} L ${x + half + 0.8} ${y + half} L ${x - half - 0.8} ${y + half} Z`} {...common} />;
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
      return <path d={`M ${x} ${y - half - 0.8} L ${x + half + 0.8} ${y} L ${x} ${y + half + 0.8} L ${x - half - 0.8} ${y} Z`} {...common} />;
  }
}

function Crosshair({ x, y, size = 11 }: { x: number; y: number; size?: number }) {
  return (
    <g stroke="var(--primary)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" opacity="0.95">
      <path d={`M ${x - size} ${y} L ${x - 3} ${y}`} />
      <path d={`M ${x + 3} ${y} L ${x + size} ${y}`} />
      <path d={`M ${x} ${y - size} L ${x} ${y - 3}`} />
      <path d={`M ${x} ${y + 3} L ${x} ${y + size}`} />
    </g>
  );
}

function MagnifiedGeometry({
  primitives,
  target,
  lensTarget,
  projectPoint,
  snappedIds = [],
}: {
  primitives: readonly CadSnapPrimitive[];
  target: CadSnapPoint;
  lensTarget: CadSnapPoint;
  projectPoint: (point: CadSnapPoint) => CadSnapPoint | null;
  snappedIds?: readonly string[];
}) {
  const snappedSet = new Set(snappedIds);
  const magnify = (point: CadSnapPoint): CadSnapPoint | null => {
    const projected = projectPoint(point);
    if (!projected) return null;
    return {
      x: lensTarget.x + (projected.x - target.x) * CAD_PRECISION_MAGNIFIER_ZOOM,
      y: lensTarget.y + (projected.y - target.y) * CAD_PRECISION_MAGNIFIER_ZOOM,
    };
  };

  return (
    <g
      fill="none"
      stroke="rgba(245,245,245,0.92)"
      strokeWidth="1.25"
      vectorEffect="non-scaling-stroke"
      data-cad-magnifier-vector-fallback="true"
    >
      {primitives.map((primitive) => {
        const isSnapped = snappedSet.has(primitive.id);
        const strokeColor = isSnapped ? "var(--primary, #f59e0b)" : "rgba(245,245,245,0.92)";
        const width = isSnapped ? "2" : "1.25";

        if (primitive.kind === "line") {
          const a = magnify(primitive.a);
          const b = magnify(primitive.b);
          if (!a || !b) return null;
          return (
            <line
              key={primitive.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={strokeColor}
              strokeWidth={width}
            />
          );
        }

        const center = magnify(primitive.center);
        const radiusPoint = magnify({
          x: primitive.center.x + primitive.radius,
          y: primitive.center.y,
        });
        if (!center || !radiusPoint) return null;
        const radius = Math.hypot(radiusPoint.x - center.x, radiusPoint.y - center.y);
        if (!(radius > 0) || !Number.isFinite(radius)) return null;

        if (primitive.kind === "circle") {
          return (
            <circle
              key={primitive.id}
              cx={center.x}
              cy={center.y}
              r={radius}
              stroke={strokeColor}
              strokeWidth={width}
            />
          );
        }

        const start = magnify({
          x: primitive.center.x + Math.cos(primitive.startAngle) * primitive.radius,
          y: primitive.center.y + Math.sin(primitive.startAngle) * primitive.radius,
        });
        const end = magnify({
          x: primitive.center.x + Math.cos(primitive.endAngle) * primitive.radius,
          y: primitive.center.y + Math.sin(primitive.endAngle) * primitive.radius,
        });
        if (!start || !end) return null;
        const rawSpan = primitive.clockwise
          ? primitive.startAngle - primitive.endAngle
          : primitive.endAngle - primitive.startAngle;
        const normalizedSpan = ((rawSpan % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const largeArc = normalizedSpan > Math.PI ? 1 : 0;
        const sweep = primitive.clockwise ? 0 : 1;
        return (
          <path
            key={primitive.id}
            d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`}
            stroke={strokeColor}
            strokeWidth={width}
          />
        );
      })}
    </g>
  );
}

export function CadPrecisionOverlay({
  snapshot,
  projectPoint,
  getSourceCanvas,
  getSnapPrimitives,
}: {
  snapshot: CadDistanceMeasurementSnapshot | null;
  projectPoint: (point: CadSnapPoint) => CadSnapPoint | null;
  getSourceCanvas: () => HTMLCanvasElement | null;
  getSnapPrimitives: (
    primitiveIds: readonly string[],
    worldPoint?: CadSnapPoint | null
  ) => CadSnapPrimitive[];
}) {
  const lensCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const tracking =
    snapshot?.phase === "tracking-first" ||
    snapshot?.phase === "tracking-second" ||
    Boolean(
      snapshot?.previewPoint &&
      (snapshot?.phase === "awaiting-first" || snapshot?.phase === "awaiting-second")
    );
  const target = tracking && snapshot?.previewPoint ? projectPoint(snapshot.previewPoint) : null;
  const pointer = tracking ? (snapshot?.pointerScreenPoint ?? target) : null;
  const snap = tracking ? snapshot?.previewSnap ?? null : null;
  const sourceCanvas = tracking ? getSourceCanvas() : null;
  const sourceWidth = sourceCanvas?.clientWidth || sourceCanvas?.getBoundingClientRect().width || 0;
  const sourceHeight = sourceCanvas?.clientHeight || sourceCanvas?.getBoundingClientRect().height || 0;
  const viewport = { width: sourceWidth, height: sourceHeight };
  const diameter = resolveCadMagnifierDiameter(viewport);

  const placement = pointer && sourceWidth > 0 && sourceHeight > 0
    ? resolveCadPrecisionLensPlacement(pointer, viewport, diameter)
    : null;
  const crop = target && sourceCanvas
    ? resolveCadMagnifierCrop(
        target,
        viewport,
        { width: sourceCanvas.width, height: sourceCanvas.height },
        diameter
      )
    : null;
  const lensTarget = crop
    ? { x: crop.targetX, y: crop.targetY }
    : { x: diameter / 2, y: diameter / 2 };
  const primitives = tracking && snapshot?.previewPoint
    ? getSnapPrimitives(snap?.primitiveIds ?? [], snapshot.previewPoint)
    : snap
      ? getSnapPrimitives(snap.primitiveIds)
      : [];

  useLayoutEffect(() => {
    const lens = lensCanvasRef.current;
    if (!tracking || !lens || !sourceCanvas || !crop) return;

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (!lensCanvasRef.current || !sourceCanvas) return;
      const lensEl = lensCanvasRef.current;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const width = Math.round(diameter * dpr);
      const height = Math.round(diameter * dpr);
      if (lensEl.width !== width) lensEl.width = width;
      if (lensEl.height !== height) lensEl.height = height;
      lensEl.style.filter = sourceCanvas.style.filter || "";

      const context = lensEl.getContext("2d", { alpha: false });
      if (!context) return;

      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.fillStyle = "#18232d";
      context.fillRect(0, 0, width, height);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      try {
        context.drawImage(sourceCanvas, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, width, height);
      } catch {
        context.fillStyle = "#18232d";
        context.fillRect(0, 0, width, height);
      } finally {
        context.restore();
      }
    });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [crop, diameter, sourceCanvas, tracking]);

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
          className="absolute overflow-hidden rounded-xl border border-border/80 bg-background/95 shadow-2xl ring-1 ring-black/20 backdrop-blur-sm"
          style={{
            left: placement.left,
            top: placement.top,
            width: diameter,
            height: diameter + 24,
          }}
          data-testid="cad-precision-magnifier"
          data-cad-precision-magnifier="true"
          data-cad-magnifier-fixed={placement.side === "fixed-top-left" ? "top-left" : "top-right"}
          data-cad-magnifier-side={placement.side}
        >
          <div className="flex h-6 items-center justify-between border-b border-border/70 bg-background/92 px-2.5 text-[9px] font-semibold text-foreground/85">
            <span>Yakınlaştırma</span>
            <span className="font-mono text-[9px] text-muted-foreground">2.75x</span>
          </div>
          <div
            className="relative overflow-hidden bg-[#18232d]"
            style={{ width: diameter, height: diameter }}
          >
            <canvas
              ref={lensCanvasRef}
              className="absolute inset-0 h-full w-full"
              data-cad-precision-lens="true"
            />
            <svg className="absolute inset-0 h-full w-full overflow-hidden">
              {primitives.length > 0 ? (
                <MagnifiedGeometry
                  primitives={primitives}
                  target={target}
                  lensTarget={lensTarget}
                  projectPoint={projectPoint}
                  snappedIds={snap?.primitiveIds}
                />
              ) : null}
              <Crosshair x={lensTarget.x} y={lensTarget.y} size={14} />
              {snap ? <SnapGlyph mode={snap.mode} x={lensTarget.x} y={lensTarget.y} size={12} /> : null}
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
