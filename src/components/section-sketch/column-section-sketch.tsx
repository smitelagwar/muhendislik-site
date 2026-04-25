"use client";

// Kolon enkesit krokisi — SVG tabanlı 2B görselleştirme
// Beton profili, etriye, boyuna donatı yerleşimi ve ölçü çizgileri
// TS 500 Md. 7.1 — minimum %1 donatı oranı baz alınarak tahmini adet

import { cn } from "@/lib/utils";
import { archTick, estimateColumnBarCount, stirrupHook135, worldToSvg } from "./sketch-utils";
import type { ColumnSketchProps } from "./sketch-types";

const SVG_W = 300;
const SVG_H = 280;

const MARGIN_LEFT = 52;
const MARGIN_TOP = 24;
const MARGIN_RIGHT = 40;
const MARGIN_BOTTOM = 48;

const MAX_DRAW_W = SVG_W - MARGIN_LEFT - MARGIN_RIGHT;
const MAX_DRAW_H = SVG_H - MARGIN_TOP - MARGIN_BOTTOM;

/**
 * Kolon boyuna donatı pozisyonlarını üretir.
 * 4 köşeye sabit donatı, artanlar kenarlara eşit aralıklı dağıtılır.
 */
function columnBarPositions(
  count: number,
  bx: number,
  by: number,
  innerW: number,
  innerH: number,
  barR: number,
): { cx: number; cy: number }[] {
  const positions: { cx: number; cy: number }[] = [];
  const inset = barR;

  // 4 köşe
  const corners = [
    { cx: bx + inset, cy: by + inset },
    { cx: bx + innerW - inset, cy: by + inset },
    { cx: bx + inset, cy: by + innerH - inset },
    { cx: bx + innerW - inset, cy: by + innerH - inset },
  ];
  positions.push(...corners);

  const extra = count - 4;
  if (extra <= 0) return positions;

  // Ek donatıları kenarlara dağıt
  const perLong = Math.floor(extra / 2); // uzun kenarlara
  const perShort = extra - perLong;      // kısa kenarlara

  // Uzun kenarlara (sol ve sağ)
  if (perLong > 0) {
    for (let i = 1; i <= Math.ceil(perLong / 2); i++) {
      const step = innerH / (Math.ceil(perLong / 2) + 1);
      const yPos = by + i * step;
      positions.push({ cx: bx + inset, cy: yPos });
      if (i <= Math.floor(perLong / 2)) {
        positions.push({ cx: bx + innerW - inset, cy: yPos });
      }
    }
  }

  // Kısa kenarlara (üst ve alt)
  if (perShort > 0) {
    for (let i = 1; i <= Math.ceil(perShort / 2); i++) {
      const step = innerW / (Math.ceil(perShort / 2) + 1);
      const xPos = bx + i * step;
      positions.push({ cx: xPos, cy: by + inset });
      if (i <= Math.floor(perShort / 2)) {
        positions.push({ cx: xPos, cy: by + innerH - inset });
      }
    }
  }

  return positions;
}

export function ColumnSectionSketch({
  shortEdgeCm,
  longEdgeCm,
  coverMm = 30,
  barCount,
  className,
}: ColumnSketchProps) {
  const isValid =
    shortEdgeCm > 0 &&
    longEdgeCm > 0 &&
    shortEdgeCm < 300 &&
    longEdgeCm < 300;

  if (!isValid) {
    return (
      <div className={cn(
        "flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40",
        className,
      )}>
        <p className="text-xs font-semibold text-zinc-500">Geçerli kesit değerleri bekleniyor</p>
      </div>
    );
  }

  // ---- Çizim boyutları — en/boy oranı korunur ----
  const aspectRatio = longEdgeCm / shortEdgeCm;

  let drawW: number;
  let drawH: number;

  if (aspectRatio >= 1) {
    // Uzun kenar dikey
    drawH = MAX_DRAW_H;
    drawW = Math.min(MAX_DRAW_W, drawH / aspectRatio);
  } else {
    drawW = MAX_DRAW_W;
    drawH = Math.min(MAX_DRAW_H, drawW * aspectRatio);
  }

  // Beton profili sol-üst köşesi (ortalanmış)
  const bx = MARGIN_LEFT + (MAX_DRAW_W - drawW) / 2;
  const by = MARGIN_TOP + (MAX_DRAW_H - drawH) / 2;

  // Pas payı piksel
  const coverPxH = worldToSvg(coverMm / 10, longEdgeCm, drawH);
  const coverPxW = worldToSvg(coverMm / 10, shortEdgeCm, drawW);

  // Etriye iç alan
  const innerX = bx + coverPxW;
  const innerY = by + coverPxH;
  const innerW = drawW - 2 * coverPxW;
  const innerH = drawH - 2 * coverPxH;

  // Donatı adedi
  const resolvedBarCount = barCount ?? estimateColumnBarCount(shortEdgeCm, longEdgeCm);
  const barRadiusPx = Math.max(3, Math.min(6, worldToSvg(0.7, shortEdgeCm, drawW)));

  // Donatı pozisyonları
  const bars = columnBarPositions(resolvedBarCount, innerX, innerY, innerW, innerH, barRadiusPx);

  return (
    <div className={cn("w-full select-none", className)}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        aria-label="Kolon enkesit krokisi"
        role="img"
        style={{ overflow: "visible" }}
      >
        <defs>
          <pattern id="concrete-hatch" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#71717a" opacity="0.3"/>
            <circle cx="10" cy="12" r="1.5" fill="#71717a" opacity="0.3"/>
            <polygon points="12,4 14,7 10,7" fill="#71717a" opacity="0.2"/>
            <polygon points="5,11 6,13 3,14" fill="#71717a" opacity="0.2"/>
          </pattern>
        </defs>

        {/* ── Beton gövde ── */}
        <rect
          x={bx}
          y={by}
          width={drawW}
          height={drawH}
          fill="var(--sketch-concrete, #27272a)"
          stroke="#52525b"
          strokeWidth={1.5}
          rx={2}
          style={{ transition: "all 0.3s ease" }}
        />
        <rect
          x={bx}
          y={by}
          width={drawW}
          height={drawH}
          fill="url(#concrete-hatch)"
          rx={2}
          style={{ transition: "all 0.3s ease", pointerEvents: "none" }}
        />

        {/* ── Pas payı sınırı (kesik çizgi, mavi) ── */}
        <rect
          x={innerX}
          y={innerY}
          width={innerW}
          height={innerH}
          fill="none"
          stroke="#60a5fa"
          strokeWidth={0.8}
          strokeDasharray="4 3"
          rx={1}
          style={{ transition: "all 0.3s ease" }}
        />

        {/* ── Etriye ── */}
        <rect
          x={innerX + 2}
          y={innerY + 2}
          width={innerW - 4}
          height={innerH - 4}
          fill="none"
          stroke="#a3a3a3"
          strokeWidth={1.2}
          rx={1}
          style={{ transition: "all 0.3s ease" }}
        />
        {/* Etriye deprem kancaları (Sol üst köşe) */}
        <path
          d={stirrupHook135(innerX + 2, innerY + 2, 8)}
          fill="none"
          stroke="#a3a3a3"
          strokeWidth={1.2}
          style={{ transition: "all 0.3s ease" }}
        />

        {/* ── Çirozlar (İç Bağlar) ── */}
        {/* Köşe olmayan karşılıklı donatıları birleştiren yatay/dikey bağlar */}
        {bars.slice(4).reduce((acc, bar, i, arr) => {
          // X ekseni karşılıklı olanları (yatay bağ) bul
          const oppositeHorizontal = arr.slice(i + 1).find(b => Math.abs(b.cy - bar.cy) < 1 && Math.abs(b.cx - bar.cx) > 10);
          if (oppositeHorizontal) {
            acc.push(<line key={`h-${i}`} x1={bar.cx} y1={bar.cy} x2={oppositeHorizontal.cx} y2={oppositeHorizontal.cy} stroke="#a3a3a3" strokeWidth={1} strokeDasharray="3 2" />);
          }
          // Y ekseni karşılıklı olanları (dikey bağ) bul
          const oppositeVertical = arr.slice(i + 1).find(b => Math.abs(b.cx - bar.cx) < 1 && Math.abs(b.cy - bar.cy) > 10);
          if (oppositeVertical) {
            acc.push(<line key={`v-${i}`} x1={bar.cx} y1={bar.cy} x2={oppositeVertical.cx} y2={oppositeVertical.cy} stroke="#a3a3a3" strokeWidth={1} strokeDasharray="3 2" />);
          }
          return acc;
        }, [] as React.ReactElement[])}

        {/* ── Boyuna donatı çubukları ── */}
        {bars.map((bar, index) => (
          <circle
            key={index}
            cx={bar.cx}
            cy={bar.cy}
            r={barRadiusPx}
            fill="#f59e0b"
            stroke="#b45309"
            strokeWidth={1.2}
            style={{ transition: "all 0.3s ease" }}
          />
        ))}

        {/* ── Kesit kodu etiketi (sağ üst köşe) ── */}
        <text
          x={bx + drawW + 6}
          y={by + 10}
          fontSize={8}
          fill="#a3a3a3"
          fontFamily="monospace"
          fontWeight="700"
        >
          {shortEdgeCm}×{longEdgeCm}
        </text>

        {/* ── Sol ölçü çizgisi: uzun kenar (h) ── */}
        <line x1={bx - 14} y1={by} x2={bx - 14} y2={by + drawH} stroke="#71717a" strokeWidth={0.8} />
        <path d={archTick({ x: bx - 14, y: by }, "horizontal")} stroke="#71717a" strokeWidth={1.2} strokeLinecap="round" />
        <path d={archTick({ x: bx - 14, y: by + drawH }, "horizontal")} stroke="#71717a" strokeWidth={1.2} strokeLinecap="round" />
        <line x1={bx - 20} y1={by} x2={bx} y2={by} stroke="#71717a" strokeWidth={0.6} strokeDasharray="2 2" />
        <line x1={bx - 20} y1={by + drawH} x2={bx} y2={by + drawH} stroke="#71717a" strokeWidth={0.6} strokeDasharray="2 2" />
        <text
          x={bx - 30}
          y={by + drawH / 2 + 4}
          fontSize={9}
          fill="#a3a3a3"
          fontFamily="monospace"
          textAnchor="middle"
          transform={`rotate(-90, ${bx - 30}, ${by + drawH / 2 + 4})`}
        >
          h={longEdgeCm} cm
        </text>

        {/* ── Alt ölçü çizgisi: kısa kenar (b) ── */}
        <line x1={bx} y1={by + drawH + 14} x2={bx + drawW} y2={by + drawH + 14} stroke="#71717a" strokeWidth={0.8} />
        <path d={archTick({ x: bx, y: by + drawH + 14 }, "vertical")} stroke="#71717a" strokeWidth={1.2} strokeLinecap="round" />
        <path d={archTick({ x: bx + drawW, y: by + drawH + 14 }, "vertical")} stroke="#71717a" strokeWidth={1.2} strokeLinecap="round" />
        <line x1={bx} y1={by + drawH} x2={bx} y2={by + drawH + 20} stroke="#71717a" strokeWidth={0.6} strokeDasharray="2 2" />
        <line x1={bx + drawW} y1={by + drawH} x2={bx + drawW} y2={by + drawH + 20} stroke="#71717a" strokeWidth={0.6} strokeDasharray="2 2" />
        <text
          x={bx + drawW / 2}
          y={by + drawH + 28}
          fontSize={9}
          fill="#a3a3a3"
          fontFamily="monospace"
          textAnchor="middle"
        >
          b={shortEdgeCm} cm
        </text>

        {/* ── Pas payı etiketi ── */}
        <text
          x={innerX + 3}
          y={by + 10}
          fontSize={6.5}
          fill="#60a5fa"
          fontFamily="monospace"
        >
          c={coverMm}mm
        </text>

        {/* ── Donatı adedi notu ── */}
        <text
          x={bx + drawW / 2}
          y={by - 8}
          fontSize={7.5}
          fill="#f59e0b"
          fontFamily="monospace"
          textAnchor="middle"
          fontWeight="600"
        >
          {resolvedBarCount}Ø — tahmini boyuna donatı
        </text>
      </svg>

      {/* ── Lejand ── */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
        <LegendItem color="#27272a" border="#52525b" label="Beton" />
        <LegendItem color="none" border="#60a5fa" dashed label="Pas payı sınırı" />
        <LegendItem color="none" border="#a3a3a3" label="Etriye" />
        <LegendItem color="#f59e0b" border="#b45309" label={`Boyuna donatı (~${resolvedBarCount} adet)`} />
      </div>
    </div>
  );
}

function LegendItem({
  color,
  border,
  label,
  dashed = false,
}: {
  color: string;
  border: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-5 flex-shrink-0 rounded-sm"
        style={{
          background: color === "none" ? "transparent" : color,
          border: `1.5px ${dashed ? "dashed" : "solid"} ${border}`,
        }}
      />
      <span className="font-mono text-[10px] text-zinc-400">{label}</span>
    </span>
  );
}
