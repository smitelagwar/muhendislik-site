"use client";

import { getRebarRowLayout } from "@/lib/rebar-calculations";
import { cn } from "@/lib/utils";
import type { RebarSketchProps } from "./sketch-types";

const SVG_WIDTH = 560;
const SVG_HEIGHT = 300;
const CONCRETE_TOP = 34;
const CONCRETE_BOTTOM = 226;

function distributeBars(count: number, start: number, end: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [(start + end) / 2];
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, index) => start + step * index);
}

export function RebarSectionSketch({
  diameterMm,
  quantity,
  widthCm = 30,
  coverMm = 30,
  stirrupDiameterMm = 8,
  isSpacingViolated = false,
  className,
}: RebarSketchProps) {
  const isValid =
    diameterMm > 0 &&
    Number.isSafeInteger(quantity) &&
    quantity > 0 &&
    quantity <= 30 &&
    widthCm > 0 &&
    coverMm >= 0 &&
    stirrupDiameterMm > 0;

  if (!isValid) {
    return (
      <div className={cn("flex min-h-52 items-center justify-center rounded-lg border border-dashed border-border p-6", className)}>
        <p className="text-center text-sm text-muted-foreground">Geçerli kesit değerleri bekleniyor.</p>
      </div>
    );
  }

  const { rowCount, firstRow, secondRow } = getRebarRowLayout(quantity);
  const scale = Math.min(2, Math.max(0.3, 470 / (widthCm * 10)));
  const concreteWidth = widthCm * 10 * scale;
  const concreteLeft = (SVG_WIDTH - concreteWidth) / 2;
  const concreteRight = concreteLeft + concreteWidth;
  const stirrupInset = coverMm * scale;
  const stirrupLeft = concreteLeft + stirrupInset;
  const stirrupRight = concreteRight - stirrupInset;
  const stirrupTop = CONCRETE_TOP + stirrupInset;
  const stirrupBottom = CONCRETE_BOTTOM - stirrupInset;
  const barRadius = Math.max(4, (diameterMm / 2) * scale);
  const barInset = (stirrupDiameterMm + diameterMm / 2) * scale;
  const rowStart = stirrupLeft + barInset;
  const rowEnd = stirrupRight - barInset;
  const hasUsableWidth = rowEnd >= rowStart;
  const safeStart = hasUsableWidth ? rowStart : SVG_WIDTH / 2 - Math.max(0, firstRow - 1) * (barRadius + 1);
  const safeEnd = hasUsableWidth ? rowEnd : SVG_WIDTH / 2 + Math.max(0, firstRow - 1) * (barRadius + 1);
  const firstRowPositions = distributeBars(firstRow, safeStart, safeEnd);
  const secondRowPositions = distributeBars(
    secondRow,
    hasUsableWidth ? rowStart : SVG_WIDTH / 2 - Math.max(0, secondRow - 1) * (barRadius + 1),
    hasUsableWidth ? rowEnd : SVG_WIDTH / 2 + Math.max(0, secondRow - 1) * (barRadius + 1),
  );
  const firstRowY = stirrupBottom - barInset;
  const secondRowY = firstRowY - (25 + diameterMm) * scale;
  const barColor = isSpacingViolated ? "#ef4444" : "#f59e0b";
  const barStroke = isSpacingViolated ? "#991b1b" : "#b45309";

  return (
    <div className={cn("w-full overflow-hidden rounded-lg border border-white/10 bg-zinc-950 p-2 sm:p-3", className)}>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby="rebar-sketch-title rebar-sketch-description"
      >
        <title id="rebar-sketch-title">Donatı kesit önizlemesi</title>
        <desc id="rebar-sketch-description">
          {quantity} adet {diameterMm} milimetre çaplı donatının {rowCount === 1 ? "tek" : "çift"} sıra kesit yerleşimi.
        </desc>
        <defs>
          <pattern id="rebar-concrete-hatch" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="5" r="0.9" fill="#64748b" opacity="0.28" />
            <circle cx="13" cy="13" r="1.1" fill="#64748b" opacity="0.22" />
          </pattern>
        </defs>

        <rect
          x={concreteLeft}
          y={CONCRETE_TOP}
          width={concreteWidth}
          height={CONCRETE_BOTTOM - CONCRETE_TOP}
          rx="3"
          fill="#111827"
          stroke="#475569"
          strokeWidth="2"
        />
        <rect
          x={concreteLeft}
          y={CONCRETE_TOP}
          width={concreteWidth}
          height={CONCRETE_BOTTOM - CONCRETE_TOP}
          rx="3"
          fill="url(#rebar-concrete-hatch)"
        />

        <rect
          x={stirrupLeft}
          y={stirrupTop}
          width={Math.max(0, stirrupRight - stirrupLeft)}
          height={Math.max(0, stirrupBottom - stirrupTop)}
          rx={Math.max(5, 7 * scale)}
          fill="none"
          stroke={isSpacingViolated ? "#ef4444" : "#94a3b8"}
          strokeWidth={Math.max(2, Math.min(4, stirrupDiameterMm * scale))}
        />

        {firstRowPositions.map((x, index) => (
          <g key={`first-${index}`}>
            <circle cx={x} cy={firstRowY} r={barRadius + 1.5} fill="none" stroke={barColor} strokeWidth="1.5" opacity="0.42" />
            <circle cx={x} cy={firstRowY} r={barRadius} fill={barColor} stroke={barStroke} strokeWidth="2" />
          </g>
        ))}

        {secondRowPositions.map((x, index) => (
          <g key={`second-${index}`}>
            <circle cx={x} cy={secondRowY} r={barRadius + 1.5} fill="none" stroke={barColor} strokeWidth="1.5" opacity="0.34" />
            <circle cx={x} cy={secondRowY} r={barRadius} fill={barColor} stroke={barStroke} strokeWidth="2" />
          </g>
        ))}

        <text
          x={SVG_WIDTH / 2}
          y="265"
          fill="#e4e4e7"
          fontFamily="var(--font-mono), monospace"
          fontSize="15"
          fontWeight="700"
          textAnchor="middle"
        >
          {quantity}Ø{diameterMm} · {rowCount === 1 ? "Tek sıra" : "Çift sıra"}
        </text>
      </svg>
    </div>
  );
}
