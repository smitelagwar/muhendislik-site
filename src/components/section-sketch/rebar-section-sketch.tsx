"use client";

// Donatı düzeni krokisi — çubuk çap ve adet bilgisinden
// tek veya çift sıra yatay yerleşim şeması çizer.
// TS 500 Md. 7.4 — net çubuk aralığı kontrolü notu içerir.

import { cn } from "@/lib/utils";
import { archTick, getRowLayout } from "./sketch-utils";
import type { RebarSketchProps } from "./sketch-types";

const SVG_W = 320;
const SVG_H = 120;
const MARGIN_X = 24;
const MARGIN_Y = 20;

export function RebarSectionSketch({ diameterMm, quantity, className }: RebarSketchProps) {
  const isValid = diameterMm > 0 && quantity > 0 && quantity <= 30;

  if (!isValid) {
    return (
      <div className={cn(
        "flex min-h-[100px] items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40",
        className,
      )}>
        <p className="text-xs font-semibold text-zinc-500">Geçerli donatı değerleri bekleniyor</p>
      </div>
    );
  }

  const { rowCount, firstRow, secondRow } = getRowLayout(quantity);

  // Çubuk piksel yarıçapı — çap ölçeği SVG genişliğine göre
  const barR = Math.max(6, Math.min(14, (SVG_W - 2 * MARGIN_X) / (firstRow * 3)));

  // Yatay çubuk düzeni
  const drawAreaW = SVG_W - 2 * MARGIN_X;
  const rowY1 = MARGIN_Y + (rowCount === 2 ? barR + 4 : SVG_H / 2 - MARGIN_Y / 2);
  const rowY2 = rowY1 + 2 * barR + 6;

  // Net aralık mm (gerçek değer — temsili) TS 500 min 25 mm veya 1.5Ø
  const minSpacingMm = Math.max(25, 1.5 * diameterMm);

  // Birinci sıra pozisyonları
  function rowPositions(count: number): number[] {
    if (count <= 0) return [];
    if (count === 1) return [MARGIN_X + drawAreaW / 2];
    const step = drawAreaW / (count - 1);
    return Array.from({ length: count }, (_, i) => MARGIN_X + i * step);
  }

  const row1Pos = rowPositions(firstRow);
  const row2Pos = rowPositions(secondRow);

  // Çevresel bağlam (Beton ve Etriye alt sınırları)
  const concreteBottomY = rowY1 + barR + 36 + (rowCount === 2 ? 2 * barR : 0);
  const concreteLeftX = MARGIN_X / 2;
  const concreteRightX = SVG_W - MARGIN_X / 2;
  
  const stirrupBottomY = rowY1 + barR + 8;
  const stirrupLeftX = row1Pos[0] - barR - 6;
  const stirrupRightX = row1Pos[firstRow - 1] + barR + 6;

  return (
    <div className={cn("w-full select-none", className)}>
      <svg
        viewBox={`0 0 ${SVG_W} ${concreteBottomY + 10}`}
        width="100%"
        aria-label="Donatı düzeni krokisi"
        role="img"
        style={{ overflow: "visible" }}
      >
        <defs>
          <pattern id="concrete-hatch-rebar" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#71717a" opacity="0.3"/>
            <circle cx="10" cy="12" r="1.5" fill="#71717a" opacity="0.3"/>
            <polygon points="12,4 14,7 10,7" fill="#71717a" opacity="0.2"/>
            <polygon points="5,11 6,13 3,14" fill="#71717a" opacity="0.2"/>
          </pattern>
        </defs>

        {/* ── Çevresel Beton Sınırı (Bağlam için) ── */}
        <path
          d={`M ${concreteLeftX} 0 L ${concreteLeftX} ${concreteBottomY} L ${concreteRightX} ${concreteBottomY} L ${concreteRightX} 0`}
          fill="var(--sketch-concrete, #27272a)"
          stroke="#52525b"
          strokeWidth={1.5}
        />
        <path
          d={`M ${concreteLeftX} 0 L ${concreteLeftX} ${concreteBottomY} L ${concreteRightX} ${concreteBottomY} L ${concreteRightX} 0`}
          fill="url(#concrete-hatch-rebar)"
          style={{ pointerEvents: "none" }}
        />

        {/* ── Etriye Sınırı (Yarım gösterim) ── */}
        <path
          d={`M ${stirrupLeftX} 0 L ${stirrupLeftX} ${stirrupBottomY} L ${stirrupRightX} ${stirrupBottomY} L ${stirrupRightX} 0`}
          fill="none"
          stroke="#a3a3a3"
          strokeWidth={1.2}
          strokeDasharray="4 2"
        />
        {/* ── 1. sıra çubuklar ── */}
        {row1Pos.map((cx, i) => (
          <g key={`r1-${i}`}>
            <circle
              cx={cx}
              cy={rowY1}
              r={barR}
              fill="#f59e0b"
              stroke="#b45309"
              strokeWidth={1.5}
              style={{ transition: "all 0.3s ease" }}
            />
            {/* Çap etiketi (ilk ve son çubuğa) */}
            {(i === 0 || i === firstRow - 1) && (
              <text
                x={cx}
                y={rowY1 + barR + 10}
                fontSize={7}
                fill="#f59e0b"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Ø{diameterMm}
              </text>
            )}
          </g>
        ))}

        {/* ── 2. sıra çubuklar (varsa) ── */}
        {row2Pos.map((cx, i) => (
          <g key={`r2-${i}`}>
            <circle
              cx={cx}
              cy={rowY2}
              r={barR}
              fill="#d97706"
              stroke="#92400e"
              strokeWidth={1.5}
              style={{ transition: "all 0.3s ease" }}
            />
            {(i === 0 || i === secondRow - 1) && (
              <text
                x={cx}
                y={rowY2 + barR + 10}
                fontSize={7}
                fill="#d97706"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Ø{diameterMm}
              </text>
            )}
          </g>
        ))}

        {/* ── Aralık oku (ilk iki çubuk arası) ── */}
        {firstRow >= 2 && (
          <>
            <line
              x1={row1Pos[0] + barR}
              y1={rowY1 - barR - 10}
              x2={row1Pos[1] - barR}
              y2={rowY1 - barR - 10}
              stroke="#71717a"
              strokeWidth={0.8}
            />
            <path d={archTick({ x: row1Pos[0] + barR, y: rowY1 - barR - 10 }, "horizontal", 4)} stroke="#71717a" strokeWidth={1} />
            <path d={archTick({ x: row1Pos[1] - barR, y: rowY1 - barR - 10 }, "horizontal", 4)} stroke="#71717a" strokeWidth={1} />
            <text
              x={(row1Pos[0] + row1Pos[1]) / 2}
              y={rowY1 - barR - 14}
              fontSize={6.5}
              fill="#71717a"
              fontFamily="monospace"
              textAnchor="middle"
            >
              ≥{minSpacingMm}mm
            </text>
          </>
        )}

        {/* ── Toplam donatı adedi etiketi ── */}
        <text
          x={SVG_W / 2}
          y={12}
          fontSize={8}
          fill="#a3a3a3"
          fontFamily="monospace"
          textAnchor="middle"
          fontWeight="600"
        >
          {quantity}Ø{diameterMm} — {rowCount === 1 ? "tek sıra" : "çift sıra"}
        </text>
      </svg>

      {/* ── Net aralık uyarısı ── */}
      <p className="mt-1 px-1 font-mono text-[9px] text-zinc-500">
        TS 500 Md. 7.4 — net çubuk aralığı ≥ max(25 mm, 1.5×Ø{diameterMm}) = {minSpacingMm} mm
      </p>
    </div>
  );
}
