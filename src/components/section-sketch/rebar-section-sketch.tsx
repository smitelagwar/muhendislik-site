"use client";

// Donatı düzeni krokisi — çubuk çap ve adet bilgisinden
// tek veya çift sıra yatay yerleşim şeması çizer.
// TS 500 Md. 7.4 — net çubuk aralığı kontrolü notu içerir.

import { cn } from "@/lib/utils";
import { archTick, getRowLayout } from "./sketch-utils";
import type { RebarSketchProps } from "./sketch-types";

const SVG_W = 320;
const SVG_H = 130;
const MARGIN_X = 24;
const MARGIN_Y = 24;

export function RebarSectionSketch({
  diameterMm,
  quantity,
  widthCm = 30,
  coverMm = 30,
  stirrupDiameterMm = 8,
  isSpacingViolated: isViolatedOverride,
  className,
}: RebarSketchProps) {
  const isValid = diameterMm > 0 && quantity > 0 && quantity <= 30;

  if (!isValid) {
    return (
      <div
        className={cn(
          "flex min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/20",
          className,
        )}
      >
        <p className="text-xs font-semibold text-zinc-500">Geçerli donatı değerleri bekleniyor</p>
      </div>
    );
  }

  const { rowCount, firstRow, secondRow } = getRowLayout(quantity);

  // Çubuk piksel yarıçapı — çap ölçeği SVG genişliğine göre
  const barR = Math.max(6, Math.min(12, (SVG_W - 2 * MARGIN_X) / (firstRow * 3.2)));

  // Yatay çubuk düzeni
  const drawAreaW = SVG_W - 2 * MARGIN_X;
  const rowY1 = MARGIN_Y + (rowCount === 2 ? barR + 6 : SVG_H / 2 - MARGIN_Y / 2);
  const rowY2 = rowY1 + 2 * barR + 10;

  // Gerçek fiziksel net aralık hesabı (TS 500)
  const b = widthCm * 10; // mm
  const cover = coverMm; // mm
  const ds = stirrupDiameterMm; // mm
  const d = diameterMm; // mm

  let calculatedSpacing = 0;
  if (firstRow >= 2) {
    calculatedSpacing = (b - 2 * cover - 2 * ds - firstRow * d) / (firstRow - 1);
  }

  const minSpacingMm = Math.max(25, 1.5 * d);
  const isSpacingViolated = isViolatedOverride ?? (firstRow >= 2 && calculatedSpacing < minSpacingMm);

  // Birinci ve İkinci sıra pozisyonları
  function rowPositions(count: number): number[] {
    if (count <= 0) return [];
    if (count === 1) return [MARGIN_X + drawAreaW / 2];
    const step = drawAreaW / (count - 1);
    return Array.from({ length: count }, (_, i) => MARGIN_X + i * step);
  }

  const row1Pos = rowPositions(firstRow);
  const row2Pos = rowPositions(secondRow);

  // Çevresel bağlam (Beton ve Etriye alt sınırları)
  const concreteBottomY = rowY1 + barR + 32 + (rowCount === 2 ? 2 * barR + 10 : 0);
  const concreteLeftX = MARGIN_X / 2;
  const concreteRightX = SVG_W - MARGIN_X / 2;

  const stirrupBottomY = rowY1 + barR + 6;
  const stirrupLeftX = row1Pos[0] - barR - 4;
  const stirrupRightX = row1Pos[firstRow - 1] + barR + 4;

  const hasSpacingVal = firstRow >= 2;
  const spacingText =
    calculatedSpacing <= 0
      ? "Sığmıyor!"
      : `${calculatedSpacing.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} mm`;

  return (
    <div className={cn("w-full select-none bg-slate-950/60 dark:bg-black/40 rounded-xl p-4 border border-slate-200 dark:border-white/5", className)}>
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Enkesit Detay Görünümü
        </span>
        <span
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider",
            isSpacingViolated
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          )}
        >
          {isSpacingViolated ? "TS 500 Aralık İhlali" : "Aralık Güvenli"}
        </span>
      </div>

      <div className="flex justify-center py-2">
        <svg
          viewBox={`0 0 ${SVG_W} ${concreteBottomY + 16}`}
          width="100%"
          className="max-w-[280px] sm:max-w-[320px]"
          aria-label="Donatı düzeni krokisi"
          role="img"
          style={{ overflow: "visible" }}
        >
          <defs>
            <pattern id="concrete-hatch-rebar" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.75" fill="#71717a" opacity="0.3" />
              <circle cx="10" cy="12" r="1" fill="#71717a" opacity="0.3" />
              <polygon points="12,4 13,6 11,6" fill="#71717a" opacity="0.2" />
              <polygon points="5,11 5.5,12 4,12.5" fill="#71717a" opacity="0.2" />
            </pattern>
          </defs>

          {/* ── Çevresel Beton Sınırı (Kiriş Gövde Çizimi) ── */}
          <path
            d={`M ${concreteLeftX} 0 L ${concreteLeftX} ${concreteBottomY} L ${concreteRightX} ${concreteBottomY} L ${concreteRightX} 0`}
            fill="#111827"
            stroke="#374151"
            strokeWidth={1.5}
          />
          <path
            d={`M ${concreteLeftX} 0 L ${concreteLeftX} ${concreteBottomY} L ${concreteRightX} ${concreteBottomY} L ${concreteRightX} 0`}
            fill="url(#concrete-hatch-rebar)"
            style={{ pointerEvents: "none" }}
          />

          {/* ── Etriye Sınırı (Kapalı Kutu Görünümü) ── */}
          <path
            d={`M ${stirrupLeftX} 0 L ${stirrupLeftX} ${stirrupBottomY} L ${stirrupRightX} ${stirrupBottomY} L ${stirrupRightX} 0`}
            fill="none"
            stroke={isSpacingViolated ? "#ef4444" : "#6b7280"}
            strokeWidth={1.5}
            strokeDasharray="4 2"
            opacity="0.8"
          />

          {/* ── 1. sıra çubuklar (Ana Donatı) ── */}
          {row1Pos.map((cx, i) => (
            <g key={`r1-${i}`}>
              {/* Çubuk Glow Efekti (Dark Mode CAD Hissi) */}
              <circle
                cx={cx}
                cy={rowY1}
                r={barR + 1}
                fill="none"
                stroke={isSpacingViolated ? "#ef4444" : "#f59e0b"}
                strokeWidth={1}
                opacity={0.3}
              />
              <circle
                cx={cx}
                cy={rowY1}
                r={barR}
                fill={isSpacingViolated ? "#ef4444" : "#f59e0b"}
                stroke={isSpacingViolated ? "#991b1b" : "#b45309"}
                strokeWidth={1.5}
                style={{ transition: "all 0.3s ease" }}
              />
              {/* Çap etiketi (ilk ve son çubuğa) */}
              {(i === 0 || i === firstRow - 1) && (
                <text
                  x={cx}
                  y={rowY1 + barR + 10}
                  fontSize={8}
                  fill={isSpacingViolated ? "#f87171" : "#f59e0b"}
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
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
                r={barR + 1}
                fill="none"
                stroke={isSpacingViolated ? "#ef4444" : "#d97706"}
                strokeWidth={1}
                opacity={0.2}
              />
              <circle
                cx={cx}
                cy={rowY2}
                r={barR}
                fill={isSpacingViolated ? "#f87171" : "#d97706"}
                stroke={isSpacingViolated ? "#991b1b" : "#92400e"}
                strokeWidth={1.5}
                style={{ transition: "all 0.3s ease" }}
              />
              {(i === 0 || i === secondRow - 1) && (
                <text
                  x={cx}
                  y={rowY2 + barR + 10}
                  fontSize={8}
                  fill={isSpacingViolated ? "#f87171" : "#d97706"}
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  Ø{diameterMm}
                </text>
              )}
            </g>
          ))}

          {/* ── Aralık ölçülendirme çizgisi (ilk iki çubuk arası) ── */}
          {hasSpacingVal && (
            <>
              <line
                x1={row1Pos[0] + barR}
                y1={rowY1 - barR - 8}
                x2={row1Pos[1] - barR}
                y2={rowY1 - barR - 8}
                stroke={isSpacingViolated ? "#ef4444" : "#94a3b8"}
                strokeWidth={1}
              />
              <path
                d={archTick({ x: row1Pos[0] + barR, y: rowY1 - barR - 8 }, "horizontal", 5)}
                stroke={isSpacingViolated ? "#ef4444" : "#94a3b8"}
                strokeWidth={1.2}
              />
              <path
                d={archTick({ x: row1Pos[1] - barR, y: rowY1 - barR - 8 }, "horizontal", 5)}
                stroke={isSpacingViolated ? "#ef4444" : "#94a3b8"}
                strokeWidth={1.2}
              />
              <text
                x={(row1Pos[0] + row1Pos[1]) / 2}
                y={rowY1 - barR - 13}
                fontSize={8.5}
                fill={isSpacingViolated ? "#f87171" : "#38bdf8"}
                fontFamily="monospace"
                fontWeight="black"
                textAnchor="middle"
              >
                s = {spacingText}
              </text>
            </>
          )}

          {/* ── Toplam donatı adedi ve düzeni başlığı ── */}
          <text
            x={SVG_W / 2}
            y={12}
            fontSize={9.5}
            fill="#e2e8f0"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="black"
          >
            {quantity}Ø{diameterMm} — {rowCount === 1 ? "Tek Sıra Yatay" : "Çift Sıra Yatay"}
          </text>
        </svg>
      </div>

      {/* ── Teknik Dipnot ve TS 500 Bilgi Çubuğu ── */}
      <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1 font-mono text-[9px] text-slate-400">
        <div className="flex justify-between items-center">
          <span>Pas Payı (Beton Örtüsü):</span>
          <span className="font-bold text-slate-200">{coverMm} mm</span>
        </div>
        <div className="flex justify-between items-center">
          <span>TS 500 Min. Net Aralık Limiti:</span>
          <span className="font-bold text-amber-400">≥ {minSpacingMm} mm</span>
        </div>
        {hasSpacingVal && (
          <div className="flex justify-between items-center border-t border-white/5 pt-1.5 mt-1 text-[10px]">
            <span>Mevcut Net Aralık:</span>
            <span
              className={cn(
                "font-black",
                isSpacingViolated ? "text-red-400 animate-pulse" : "text-cyan-400"
              )}
            >
              {calculatedSpacing <= 0
                ? "Sığmıyor!"
                : `${calculatedSpacing.toFixed(1)} mm`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
