/**
 * CAD Review Overlay — Review item'larını (ölçümler, yorum pinleri, şekiller, eskizler)
 * SVG katmanında render eden bileşen.
 *
 * Taban çizim model space'ine asla dokunmaz. Koordinatlar CadUpstreamAdapter.projectWorldPoint()
 * ile dünya koordinatından ekran koordinatına çevrilir.
 */
"use client";

import React, { useCallback } from "react";
import type { CadReviewItem } from "@/lib/dokumantasyon/cad-review/schema";

export type ProjectPointFn = (point: { x: number; y: number }) => { x: number; y: number } | null;

import type { CadReviewDraftState } from "@/lib/dokumantasyon/cad-review/store";

export interface CadReviewOverlayProps {
  items: readonly CadReviewItem[];
  draft?: CadReviewDraftState | null;
  selectedItemIds?: Set<string>;
  hoveredItemId?: string | null;
  projectPoint: ProjectPointFn;
  containerWidth: number;
  containerHeight: number;
  onClickItem?: (id: string) => void;
}

function projectOrNull(
  pt: { x: number; y: number },
  projectPoint: ProjectPointFn
): { x: number; y: number } | null {
  try {
    return projectPoint(pt);
  } catch {
    return null;
  }
}

export function CadReviewOverlay({
  items,
  draft = null,
  selectedItemIds = new Set(),
  hoveredItemId = null,
  projectPoint,
  containerWidth,
  containerHeight,
  onClickItem,
}: CadReviewOverlayProps) {
  const project = useCallback(
    (pt: { x: number; y: number }) => projectOrNull(pt, projectPoint),
    [projectPoint]
  );

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10 overflow-visible"
      width={containerWidth}
      height={containerHeight}
      aria-hidden="true"
      data-cad-review-overlay="true"
    >
      {items.map((item) => (
        <ReviewItemRenderer
          key={item.id}
          item={item}
          isSelected={selectedItemIds.has(item.id)}
          isHovered={hoveredItemId === item.id}
          project={project}
          onClick={onClickItem}
        />
      ))}
      {draft?.draftItem && (
        <g opacity={0.75} strokeDasharray="4 4">
          <ReviewItemRenderer
            item={{
              id: "draft-item",
              status: "open",
              createdAt: "",
              updatedAt: "",
              ...draft.draftItem,
              style: {
                color: draft.draftItem.style?.color ?? "#007aff",
                strokeWidth: draft.draftItem.style?.strokeWidth ?? 2,
                opacity: 0.8,
                fillColor: draft.draftItem.style?.fillColor,
              },
            } as CadReviewItem}
            isSelected={false}
            isHovered={false}
            project={project}
          />
        </g>
      )}
    </svg>
  );
}

function ReviewItemRenderer({
  item,
  isSelected,
  isHovered,
  project,
  onClick,
}: {
  item: CadReviewItem;
  isSelected: boolean;
  isHovered: boolean;
  project: ProjectPointFn;
  onClick?: (id: string) => void;
}) {
  const color = item.style.color;
  const strokeWidth = Math.max(1, item.style.strokeWidth ?? 2);
  const opacity = item.style.opacity ?? 1;
  const highlight = isSelected ? 2.5 : isHovered ? 1.5 : 1;
  const sw = strokeWidth * highlight;
  const dashArray =
    item.style.lineDash === "dashed"
      ? "8 5"
      : item.style.lineDash === "dotted"
      ? "3 4"
      : undefined;
  const effectiveFill = item.style.fillColor || color;
  const effectiveFillOpacity = item.style.fillColor ? 0.22 : 0.08;

  const commonProps: React.SVGProps<SVGGElement> = {
    opacity,
    style: { pointerEvents: onClick ? "auto" : "none", cursor: onClick ? "pointer" : "default" },
    onClick: onClick ? () => onClick(item.id) : undefined,
  };

  if (item.type === "distance") {
    const s = project(item.start);
    const e = project(item.end);
    if (!s || !e) return null;
    const mx = (s.x + e.x) / 2;
    const my = (s.y + e.y) / 2;
    const label = item.label ?? `${item.measuredLength.toFixed(2)}`;
    return (
      <g {...commonProps} data-review-type="distance" data-review-id={item.id}>
        <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={color} strokeWidth={sw} />
        {/* endpoint dots */}
        <circle cx={s.x} cy={s.y} r={3} fill={color} />
        <circle cx={e.x} cy={e.y} r={3} fill={color} />
        <text
          x={mx}
          y={my - 6}
          textAnchor="middle"
          fontSize={11}
          fontFamily="system-ui, sans-serif"
          fill={color}
          stroke="black"
          strokeWidth={2}
          paintOrder="stroke"
        >
          {label}
        </text>
      </g>
    );
  }

  if (item.type === "chain_distance") {
    const projected = item.points.map((p) => project(p));
    if (projected.some((p) => !p)) return null;
    const pts = projected as { x: number; y: number }[];
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return (
      <g {...commonProps} data-review-type="chain_distance" data-review-id={item.id}>
        <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}
        <text
          x={pts[0]!.x}
          y={pts[0]!.y - 8}
          textAnchor="middle"
          fontSize={11}
          fontFamily="system-ui, sans-serif"
          fill={color}
          stroke="black"
          strokeWidth={2}
          paintOrder="stroke"
        >
          {`${item.totalDistance.toFixed(2)}`}
        </text>
      </g>
    );
  }

  if (item.type === "area") {
    const projected = item.points.map((p) => project(p));
    if (projected.some((p) => !p)) return null;
    const pts = projected as { x: number; y: number }[];
    const d =
      pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
    const cx = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
    const cy = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
    return (
      <g {...commonProps} data-review-type="area" data-review-id={item.id}>
        <path
          d={d}
          fill={color}
          fillOpacity={0.12}
          stroke={color}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fontFamily="system-ui, sans-serif"
          fill={color}
          stroke="black"
          strokeWidth={2}
          paintOrder="stroke"
        >
          {`${item.measuredArea.toFixed(2)}`}
        </text>
      </g>
    );
  }

  if (item.type === "comment_pin") {
    const p = project(item.position);
    if (!p) return null;
    const statusBg =
      item.status === "closed"
        ? "#10b981"
        : item.status === "answered"
        ? "#3b82f6"
        : item.status === "question"
        ? "#f59e0b"
        : color;

    return (
      <g {...commonProps} data-review-type="comment_pin" data-review-id={item.id}>
        {/* pin teardrop shape */}
        <path
          d={`M ${p.x} ${p.y} C ${p.x - 10} ${p.y - 10}, ${p.x - 12} ${p.y - 24}, ${p.x} ${p.y - 26} C ${p.x + 12} ${p.y - 24}, ${p.x + 10} ${p.y - 10}, ${p.x} ${p.y}`}
          fill={statusBg}
          stroke="white"
          strokeWidth={1.5}
        />
        <text
          x={p.x}
          y={p.y - 15}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="white"
        >
          {item.pinIndex}
        </text>
      </g>
    );
  }

  if (item.type === "text") {
    const p = project(item.position);
    if (!p) return null;
    const fs = item.style.fontSize ?? 16;
    const hasBg = Boolean(item.style.fillColor);
    const textWidth = Math.max(30, item.text.length * (fs * 0.62));
    const textHeight = fs * 1.3;

    return (
      <g
        {...commonProps}
        transform={`rotate(${item.rotationDeg ?? 0}, ${p.x}, ${p.y})`}
        data-review-type="text"
        data-review-id={item.id}
      >
        {hasBg && (
          <rect
            x={p.x - 4}
            y={p.y - textHeight + 3}
            width={textWidth + 8}
            height={textHeight + 4}
            rx={4}
            fill={item.style.fillColor}
            fillOpacity={0.9}
            stroke={color}
            strokeWidth={1}
          />
        )}
        <text
          x={p.x}
          y={p.y}
          fontSize={fs}
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={color}
          stroke={hasBg ? "none" : "black"}
          strokeWidth={hasBg ? 0 : 2}
          paintOrder="stroke"
        >
          {item.text}
        </text>
      </g>
    );
  }

  if (item.type === "callout") {
    const tip = project(item.tip);
    const anchor = project(item.anchor);
    if (!tip || !anchor) return null;
    const fs = item.style.fontSize ?? 12;
    const bubbleW = Math.max(60, item.text.length * (fs * 0.65) + 16);
    const bubbleH = fs + 12;

    return (
      <g {...commonProps} data-review-type="callout" data-review-id={item.id}>
        <line x1={tip.x} y1={tip.y} x2={anchor.x} y2={anchor.y} stroke={color} strokeWidth={sw} />
        <circle cx={tip.x} cy={tip.y} r={4} fill={color} />
        {/* bubble */}
        <rect
          x={anchor.x - 2}
          y={anchor.y - bubbleH + 6}
          width={bubbleW}
          height={bubbleH}
          rx={6}
          fill={item.style.fillColor || color}
          fillOpacity={0.92}
          stroke={color}
          strokeWidth={1}
        />
        <text
          x={anchor.x + bubbleW / 2 - 2}
          y={anchor.y - 2}
          textAnchor="middle"
          fontSize={fs}
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="white"
        >
          {item.text}
        </text>
      </g>
    );
  }

  if (item.type === "shape") {
    const p1 = project(item.p1);
    const p2 = project(item.p2);
    if (!p1 || !p2) return null;
    const minX = Math.min(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);

    if (item.shapeKind === "rect") {
      return (
        <g {...commonProps} data-review-type="shape_rect" data-review-id={item.id}>
          <rect
            x={minX}
            y={minY}
            width={w}
            height={h}
            fill={effectiveFill}
            fillOpacity={effectiveFillOpacity}
            stroke={color}
            strokeWidth={sw}
            strokeDasharray={dashArray}
          />
        </g>
      );
    }
    if (item.shapeKind === "circle") {
      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2;
      const r = Math.max(Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y)) / 2;
      return (
        <g {...commonProps} data-review-type="shape_circle" data-review-id={item.id}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill={effectiveFill}
            fillOpacity={effectiveFillOpacity}
            stroke={color}
            strokeWidth={sw}
            strokeDasharray={dashArray}
          />
        </g>
      );
    }
    if (item.shapeKind === "cloud") {
      // Simplified cloud: rect with arc bumps
      const bumpR = 8;
      const bumpsH = Math.max(1, Math.floor(w / (bumpR * 2)));
      const bumpsV = Math.max(1, Math.floor(h / (bumpR * 2)));
      const bumpW = w / bumpsH;
      const bumpH = h / bumpsV;
      let d = "";
      // Top edge
      for (let i = 0; i < bumpsH; i++) {
        const x1 = minX + i * bumpW;
        const x2 = minX + (i + 1) * bumpW;
        d += `M ${x1} ${minY} A ${bumpW / 2} ${bumpR} 0 0 1 ${x2} ${minY} `;
      }
      // Bottom edge
      for (let i = 0; i < bumpsH; i++) {
        const x1 = minX + (bumpsH - i) * bumpW;
        const x2 = minX + (bumpsH - i - 1) * bumpW;
        d += `M ${x1} ${minY + h} A ${bumpW / 2} ${bumpR} 0 0 0 ${x2} ${minY + h} `;
      }
      // Left edge
      for (let i = 0; i < bumpsV; i++) {
        const y1 = minY + i * bumpH;
        const y2 = minY + (i + 1) * bumpH;
        d += `M ${minX} ${y1} A ${bumpR} ${bumpH / 2} 0 0 0 ${minX} ${y2} `;
      }
      // Right edge
      for (let i = 0; i < bumpsV; i++) {
        const y1 = minY + (bumpsV - i) * bumpH;
        const y2 = minY + (bumpsV - i - 1) * bumpH;
        d += `M ${minX + w} ${y1} A ${bumpR} ${bumpH / 2} 0 0 1 ${minX + w} ${y2} `;
      }
      return (
        <g {...commonProps} data-review-type="shape_cloud" data-review-id={item.id}>
          <rect
            x={minX}
            y={minY}
            width={w}
            height={h}
            fill={effectiveFill}
            fillOpacity={effectiveFillOpacity}
            stroke="none"
          />
          <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={dashArray} />
        </g>
      );
    }
  }

  if (item.type === "stroke") {
    const projected = item.points.map((p) => project(p));
    if (projected.some((p) => !p)) return null;
    const pts = projected as { x: number; y: number }[];
    const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return (
      <g {...commonProps} data-review-type="stroke" data-review-id={item.id}>
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={dashArray}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    );
  }

  return null;
}
