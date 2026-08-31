/**
 * CAD Review Overlay — Review item'larını (ölçümler, yorum pinleri, şekiller, eskizler)
 * SVG katmanında render eden bileşen.
 *
 * Taban çizim model space'ine asla dokunmaz. Koordinatlar CadUpstreamAdapter.projectWorldPoint()
 * ile dünya koordinatından ekran koordinatına çevrilir.
 */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { CadReviewItem } from "@/lib/dokumantasyon/cad-review/schema";
import { formatCadDistance, formatCadArea } from "@/lib/dokumantasyon/cad-review/units";
import { getCurrentCadReviewStore } from "@/lib/dokumantasyon/cad-review/active-store";
import { isCadNativeMeasurementRendered } from "@/lib/dokumantasyon/cad-review/measurement-render-registry";
import { isCadMeasurementReviewItem, type CadReviewDraftState } from "@/lib/dokumantasyon/cad-review/store";

export type ProjectPointFn = (point: { x: number; y: number }) => { x: number; y: number } | null;

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

function clampOpacity(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value!));
}

export function CadReviewOverlay({
  items,
  draft = null,
  selectedItemIds,
  hoveredItemId,
  projectPoint,
  containerWidth,
  containerHeight,
  onClickItem,
}: CadReviewOverlayProps) {
  const [, setStoreRevision] = useState(0);
  const activeStore = getCurrentCadReviewStore();

  useEffect(() => {
    if (!activeStore) return;
    return activeStore.subscribe(() => setStoreRevision((value) => value + 1));
  }, [activeStore]);

  const effectiveItems = activeStore?.getItems() ?? items;
  const effectiveSelection = selectedItemIds ?? activeStore?.getSession().selectedItemIds ?? new Set<string>();
  const effectiveHovered = hoveredItemId ?? activeStore?.getSession().hoveredItemId ?? null;
  const visibleItems = effectiveItems.filter((item) => {
    if (isCadMeasurementReviewItem(item) && (item.style.opacity ?? 1) <= 0) return false;
    if (isCadNativeMeasurementRendered(item.id)) return false;
    return true;
  });

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
      {visibleItems.map((item) => (
        <ReviewItemRenderer
          key={item.id}
          item={item}
          isSelected={effectiveSelection.has(item.id)}
          isHovered={effectiveHovered === item.id}
          project={project}
          onClick={onClickItem}
        />
      ))}
      {draft?.draftItem && (
        <g opacity={0.75}>
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
                lineDash: draft.draftItem.style?.lineDash ?? "continuous",
                opacity: draft.draftItem.style?.opacity ?? 1,
                fontSize: draft.draftItem.style?.fontSize,
                fillColor: draft.draftItem.style?.fillColor,
                fillOpacity: draft.draftItem.style?.fillOpacity,
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
  const opacity = clampOpacity(item.style.opacity, 1);
  const highlight = isSelected ? 2.5 : isHovered ? 1.5 : 1;
  const sw = strokeWidth * highlight;
  const dashArray =
    item.style.lineDash === "dashed"
      ? "8 5"
      : item.style.lineDash === "dotted"
      ? "3 4"
      : undefined;
  const fillOpacity = clampOpacity(item.style.fillOpacity, 0);
  const effectiveFill = fillOpacity > 0 ? item.style.fillColor || color : "none";

  const commonProps: React.SVGProps<SVGGElement> = {
    opacity,
    style: { pointerEvents: onClick ? "auto" : "none", cursor: onClick ? "pointer" : "default" },
    onClick: onClick ? () => onClick(item.id) : undefined,
    "data-review-selected": isSelected ? "true" : "false",
  };

  if (item.type === "distance") {
    const s = project(item.start);
    const e = project(item.end);
    if (!s || !e) return null;
    const mx = (s.x + e.x) / 2;
    const my = (s.y + e.y) / 2;
    const value = formatCadDistance(item.measuredLength, "m", 2);
    const label = item.label ? `${item.label}: ${value}` : value;
    return (
      <g {...commonProps} data-review-type="distance" data-review-id={item.id}>
        <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={color} strokeWidth={sw} />
        <circle cx={s.x} cy={s.y} r={isSelected ? 5 : 3.5} fill={color} />
        <circle cx={e.x} cy={e.y} r={isSelected ? 5 : 3.5} fill={color} />
        <rect
          x={mx - label.length * 4 - 4}
          y={my - 18}
          width={label.length * 8 + 8}
          height={18}
          rx={4}
          fill="black"
          fillOpacity={0.75}
        />
        <text
          x={mx}
          y={my - 5}
          textAnchor="middle"
          fontSize={11}
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={color}
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
    const value = formatCadDistance(item.totalDistance, "m", 2);
    const label = item.comment.trim() ? `${item.comment.trim()}: ${value}` : value;
    return (
      <g {...commonProps} data-review-type="chain_distance" data-review-id={item.id}>
        <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={isSelected ? 5 : 3.5} fill={color} />
        ))}
        {pts.slice(0, -1).map((point, index) => {
          const next = pts[index + 1]!;
          const segmentValue = formatCadDistance(item.segmentDistances[index] ?? 0, "m", 2);
          return (
            <text
              key={`segment-${index}`}
              x={(point.x + next.x) / 2}
              y={(point.y + next.y) / 2 - 7}
              textAnchor="middle"
              fontSize={10}
              fontWeight="600"
              fontFamily="system-ui, -apple-system, sans-serif"
              fill={color}
              stroke="black"
              strokeWidth={2.5}
              paintOrder="stroke"
              data-review-chain-segment-label={index + 1}
            >
              {segmentValue}
            </text>
          );
        })}
        <rect
          x={pts[0]!.x - label.length * 4 - 4}
          y={pts[0]!.y - 22}
          width={label.length * 8 + 8}
          height={18}
          rx={4}
          fill="black"
          fillOpacity={0.75}
        />
        <text
          x={pts[0]!.x}
          y={pts[0]!.y - 9}
          textAnchor="middle"
          fontSize={11}
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={color}
        >
          {label}
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
    const value = formatCadArea(item.measuredArea, "m", 2);
    const label = item.comment.trim() ? `${item.comment.trim()}: ${value}` : value;
    return (
      <g {...commonProps} data-review-type="area" data-review-id={item.id}>
        <path
          d={d}
          fill={color}
          fillOpacity={0.15}
          stroke={color}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <rect
          x={cx - label.length * 4 - 6}
          y={cy - 10}
          width={label.length * 8 + 12}
          height={20}
          rx={4}
          fill="black"
          fillOpacity={0.75}
        />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontSize={11}
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill={color}
        >
          {label}
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
      <g
        {...commonProps}
        data-review-type="comment_pin"
        data-review-id={item.id}
        data-review-status={item.status}
      >
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
    const textBgOpacity = clampOpacity(item.style.fillOpacity, item.style.fillColor ? 0.9 : 0);
    const hasBg = Boolean(item.style.fillColor) && textBgOpacity > 0;
    const textWidth = Math.max(30, item.text.length * (fs * 0.62));
    const textHeight = fs * 1.3;

    return (
      <g
        {...commonProps}
        transform={`rotate(${item.rotationDeg ?? 0}, ${p.x}, ${p.y})`}
        data-review-type="text"
        data-review-id={item.id}
        data-review-rotation={item.rotationDeg ?? 0}
      >
        {hasBg && (
          <rect
            x={p.x - 4}
            y={p.y - textHeight + 3}
            width={textWidth + 8}
            height={textHeight + 4}
            rx={4}
            fill={item.style.fillColor}
            fillOpacity={textBgOpacity}
            stroke={color}
            strokeWidth={1}
            data-review-text-background="true"
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
    const bubbleOpacity = clampOpacity(item.style.fillOpacity, 0.92);

    return (
      <g {...commonProps} data-review-type="callout" data-review-id={item.id}>
        <line
          x1={tip.x}
          y1={tip.y}
          x2={anchor.x}
          y2={anchor.y}
          stroke={color}
          strokeWidth={sw}
          strokeDasharray={dashArray}
        />
        <circle cx={tip.x} cy={tip.y} r={4} fill={color} />
        <rect
          x={anchor.x - 2}
          y={anchor.y - bubbleH + 6}
          width={bubbleW}
          height={bubbleH}
          rx={6}
          fill={item.style.fillColor || color}
          fillOpacity={bubbleOpacity}
          stroke={color}
          strokeWidth={1}
          data-review-callout-background="true"
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
            fillOpacity={fillOpacity}
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
            fillOpacity={fillOpacity}
            stroke={color}
            strokeWidth={sw}
            strokeDasharray={dashArray}
          />
        </g>
      );
    }
    if (item.shapeKind === "cloud") {
      const bumpR = 8;
      const bumpsH = Math.max(1, Math.floor(w / (bumpR * 2)));
      const bumpsV = Math.max(1, Math.floor(h / (bumpR * 2)));
      const bumpW = w / bumpsH;
      const bumpH = h / bumpsV;
      let d = "";
      for (let i = 0; i < bumpsH; i++) {
        const x1 = minX + i * bumpW;
        const x2 = minX + (i + 1) * bumpW;
        d += `M ${x1} ${minY} A ${bumpW / 2} ${bumpR} 0 0 1 ${x2} ${minY} `;
      }
      for (let i = 0; i < bumpsH; i++) {
        const x1 = minX + (bumpsH - i) * bumpW;
        const x2 = minX + (bumpsH - i - 1) * bumpW;
        d += `M ${x1} ${minY + h} A ${bumpW / 2} ${bumpR} 0 0 0 ${x2} ${minY + h} `;
      }
      for (let i = 0; i < bumpsV; i++) {
        const y1 = minY + i * bumpH;
        const y2 = minY + (i + 1) * bumpH;
        d += `M ${minX} ${y1} A ${bumpR} ${bumpH / 2} 0 0 0 ${minX} ${y2} `;
      }
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
            fillOpacity={fillOpacity}
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
