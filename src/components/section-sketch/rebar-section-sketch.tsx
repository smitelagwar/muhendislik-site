"use client";

// Donatı düzeni krokisi — çubuk çap ve adet bilgisinden
// tek veya çift sıra yatay yerleşim şeması çizer.
// TS 500 Md. 7.4 — net çubuk aralığı kontrolü notu içerir.

import { cn } from "@/lib/utils";
import { archTick, getRowLayout } from "./sketch-utils";
import type { RebarSketchProps } from "./sketch-types";

const SVG_W = 560;
const SVG_H = 280;
const MARGIN_Y = 18;
const concreteBottomY = 200;

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
          "flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/20",
          className,
        )}
      >
        <p className="text-xs font-semibold text-zinc-500">Geçerli donatı değerleri bekleniyor</p>
      </div>
    );
  }

  const { rowCount, firstRow, secondRow } = getRowLayout(quantity);

  // Dinamik ölçek hesabı (px/mm) - SVG_W = 560 için kullanılabilir alanı 480px yapıyoruz
  const scaleIdeal = 480 / (widthCm * 10);
  // Ölçeği sınırlandırarak çok dar kirişlerde aşırı büyümesini engelliyoruz (max 2.0)
  const scale = Math.min(2.0, Math.max(0.3, scaleIdeal));

  // Beton çizim sınırları (genişlik to-scale olarak ayarlanıyor ve ortalanıyor)
  const concreteW_px = widthCm * 10 * scale;
  const concreteLeftX = (SVG_W - concreteW_px) / 2;
  const concreteRightX = SVG_W - concreteLeftX;

  // Çevresel bağlam (Beton ve Etriye alt sınırları)
  const stirrupLeftX = concreteLeftX + coverMm * scale;
  const stirrupRightX = concreteRightX - coverMm * scale;
  const stirrupBottomY = concreteBottomY - coverMm * scale;

  // Çubuk piksel yarıçapı
  const barR = Math.max(4, (diameterMm / 2) * scale);

  // Boyuna donatıların yerleşeceği yatay sınırlar
  const x_start = stirrupLeftX + (stirrupDiameterMm + diameterMm / 2) * scale;
  const x_end = stirrupRightX - (stirrupDiameterMm + diameterMm / 2) * scale;

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

  // Birinci sıra çubuk X pozisyonları
  let row1Pos: number[] = [];
  if (firstRow === 1) {
    row1Pos = [SVG_W / 2];
  } else if (firstRow >= 2) {
    if (x_end > x_start) {
      const step = (x_end - x_start) / (firstRow - 1);
      row1Pos = Array.from({ length: firstRow }, (_, i) => x_start + i * step);
    } else {
      // Sığmama durumunda üst üste binmesinler diye sıkışık çiziyoruz
      const center = SVG_W / 2;
      const spacing = barR * 2 + 2;
      const start = center - ((firstRow - 1) * spacing) / 2;
      row1Pos = Array.from({ length: firstRow }, (_, i) => start + i * spacing);
    }
  }

  // İkinci sıra çubuk X pozisyonları
  let row2Pos: number[] = [];
  if (secondRow === 1) {
    row2Pos = [SVG_W / 2];
  } else if (secondRow >= 2) {
    if (x_end > x_start) {
      const step = (x_end - x_start) / (secondRow - 1);
      row2Pos = Array.from({ length: secondRow }, (_, i) => x_start + i * step);
    } else {
      const center = SVG_W / 2;
      const spacing = barR * 2 + 2;
      const start = center - ((secondRow - 1) * spacing) / 2;
      row2Pos = Array.from({ length: secondRow }, (_, i) => start + i * spacing);
    }
  }

  // Sıra Y pozisyonları
  const rowY1 = concreteBottomY - (coverMm + stirrupDiameterMm + diameterMm / 2) * scale;
  // İkinci sırayı birincinin üstüne TS 500 minimum düşey mesafesi (25mm + d) kadar yukarı yerleştiriyoruz
  const rowY2 = rowY1 - (25 + diameterMm) * scale;

  // Montaj Donatısı (Üst iki köşede etriyeyi tutan askı donatısı Ø12)
  const barR_top = (12 / 2) * scale;
  const topRebarY = MARGIN_Y + (stirrupDiameterMm + 12 / 2) * scale;
  const topRebarLeftX = stirrupLeftX + (stirrupDiameterMm + 12 / 2) * scale;
  const topRebarRightX = stirrupRightX - (stirrupDiameterMm + 12 / 2) * scale;

  const hasSpacingVal = firstRow >= 2;
  const spacingText =
    calculatedSpacing <= 0
      ? "Sığmıyor!"
      : `${calculatedSpacing.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} mm`;

  const stirrupStrokeWidth = Math.max(1.8, Math.min(4, stirrupDiameterMm * scale));

  return (
    <div className={cn("w-full select-none bg-slate-950 dark:bg-black/60 rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-inner", className)}>
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
          Enkesit Detay Görünümü (CAD Önceleme)
        </span>
        <span
          className={cn(
            "rounded px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider",
            isSpacingViolated
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
          )}
        >
          {isSpacingViolated ? "TS 500 Aralık İhlali" : "Aralık Güvenli"}
        </span>
      </div>

      <div className="flex justify-center py-4 bg-slate-950/40 rounded-xl border border-white/5 p-2">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          className="w-full"
          aria-label="Donatı düzeni krokisi"
          role="img"
          style={{ overflow: "visible" }}
        >
          <defs>
            <pattern id="concrete-hatch-rebar-lg" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="0.75" fill="#71717a" opacity="0.3" />
              <circle cx="12" cy="14" r="1" fill="#71717a" opacity="0.3" />
              <polygon points="15,5 16,7 14,7" fill="#71717a" opacity="0.2" />
              <polygon points="6,13 6.5,14 5,14.5" fill="#71717a" opacity="0.2" />
            </pattern>
          </defs>

          {/* ── Çevresel Beton Sınırı (Kiriş Gövde Çizimi) ── */}
          <path
            d={`M ${concreteLeftX} ${MARGIN_Y} L ${concreteLeftX} ${concreteBottomY} L ${concreteRightX} ${concreteBottomY} L ${concreteRightX} ${MARGIN_Y}`}
            fill="#0f172a"
            stroke="#475569"
            strokeWidth={2}
          />
          <path
            d={`M ${concreteLeftX} ${MARGIN_Y} L ${concreteLeftX} ${concreteBottomY} L ${concreteRightX} ${concreteBottomY} L ${concreteRightX} ${MARGIN_Y}`}
            fill="url(#concrete-hatch-rebar-lg)"
            style={{ pointerEvents: "none" }}
          />

          {/* ── Askı Donatıları (Üst Köşeler - 2Ø12 Montaj) ── */}
          <g>
            <circle
              cx={topRebarLeftX}
              cy={topRebarY}
              r={barR_top}
              fill="#64748b"
              stroke="#475569"
              strokeWidth={1}
            />
            <circle
              cx={topRebarRightX}
              cy={topRebarY}
              r={barR_top}
              fill="#64748b"
              stroke="#475569"
              strokeWidth={1}
            />
          </g>

          {/* ── Etriye Sınırı (Kapalı Kutu ve 135 Derece Kanca Detayı) ── */}
          <path
            d={`M ${stirrupLeftX + 18 * scale} ${topRebarY + 18 * scale} L ${stirrupLeftX} ${topRebarY} L ${stirrupLeftX} ${stirrupBottomY} L ${stirrupRightX} ${stirrupBottomY} L ${stirrupRightX} ${topRebarY} L ${stirrupRightX - 18 * scale} ${topRebarY + 18 * scale}`}
            fill="none"
            stroke={isSpacingViolated ? "#ef4444" : "#64748b"}
            strokeWidth={stirrupStrokeWidth}
            opacity="0.95"
          />

          {/* ── 1. Sıra Çubuklar (Ana Donatı) ── */}
          {row1Pos.map((cx, i) => (
            <g key={`r1-${i}`}>
              <circle
                cx={cx}
                cy={rowY1}
                r={barR + 1.5}
                fill="none"
                stroke={isSpacingViolated ? "#ef4444" : "#f59e0b"}
                strokeWidth={1.5}
                opacity={0.4}
              />
              <circle
                cx={cx}
                cy={rowY1}
                r={barR}
                fill={isSpacingViolated ? "#ef4444" : "#f59e0b"}
                stroke={isSpacingViolated ? "#b91c1c" : "#d97706"}
                strokeWidth={2}
                style={{ transition: "all 0.3s ease" }}
              />
              {/* Çap etiketi (ilk ve son çubuğa) */}
              {(i === 0 || i === firstRow - 1) && (
                <text
                  x={cx}
                  y={rowY1 - barR - 7}
                  fontSize={13}
                  fill={isSpacingViolated ? "#f87171" : "#f59e0b"}
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="black"
                >
                  Ø{diameterMm}
                </text>
              )}
            </g>
          ))}

          {/* ── 2. Sıra Çubuklar (varsa) ── */}
          {row2Pos.map((cx, i) => (
            <g key={`r2-${i}`}>
              <circle
                cx={cx}
                cy={rowY2}
                r={barR + 1.5}
                fill="none"
                stroke={isSpacingViolated ? "#ef4444" : "#d97706"}
                strokeWidth={1.5}
                opacity={0.3}
              />
              <circle
                cx={cx}
                cy={rowY2}
                r={barR}
                fill={isSpacingViolated ? "#f87171" : "#d97706"}
                stroke={isSpacingViolated ? "#991b1b" : "#b45309"}
                strokeWidth={2}
                style={{ transition: "all 0.3s ease" }}
              />
              {(i === 0 || i === secondRow - 1) && (
                <text
                  x={cx}
                  y={rowY2 - barR - 7}
                  fontSize={13}
                  fill={isSpacingViolated ? "#f87171" : "#d97706"}
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="black"
                >
                  Ø{diameterMm}
                </text>
              )}
            </g>
          ))}

          {/* ── Aralık Ölçülendirme Çizgisi (ilk iki çubuk arası) ── */}
          {hasSpacingVal && (
            <g>
              <line
                x1={row1Pos[0] + barR}
                y1={rowY1 + barR + 14}
                x2={row1Pos[1] - barR}
                y2={rowY1 + barR + 14}
                stroke={isSpacingViolated ? "#ef4444" : "#94a3b8"}
                strokeWidth={1.2}
              />
              <path
                d={archTick({ x: row1Pos[0] + barR, y: rowY1 + barR + 14 }, "horizontal", 6)}
                stroke={isSpacingViolated ? "#ef4444" : "#94a3b8"}
                strokeWidth={1.5}
              />
              <path
                d={archTick({ x: row1Pos[1] - barR, y: rowY1 + barR + 14 }, "horizontal", 6)}
                stroke={isSpacingViolated ? "#ef4444" : "#94a3b8"}
                strokeWidth={1.5}
              />
              <text
                x={(row1Pos[0] + row1Pos[1]) / 2}
                y={rowY1 + barR + 30}
                fontSize={13}
                fill={isSpacingViolated ? "#f87171" : "#38bdf8"}
                fontFamily="monospace"
                fontWeight="black"
                textAnchor="middle"
              >
                s = {spacingText}
              </text>
            </g>
          )}

          {/* ── Kiriş Genişliği Ölçülendirmesi (b) ── */}
          <g>
            <line
              x1={concreteLeftX}
              y1={concreteBottomY + 28}
              x2={concreteRightX}
              y2={concreteBottomY + 28}
              stroke="#475569"
              strokeWidth={1.2}
            />
            <line
              x1={concreteLeftX}
              y1={concreteBottomY + 4}
              x2={concreteLeftX}
              y2={concreteBottomY + 34}
              stroke="#475569"
              strokeWidth={1.2}
            />
            <line
              x1={concreteRightX}
              y1={concreteBottomY + 4}
              x2={concreteRightX}
              y2={concreteBottomY + 34}
              stroke="#475569"
              strokeWidth={1.2}
            />
            <path
              d={archTick({ x: concreteLeftX, y: concreteBottomY + 28 }, "horizontal", 8)}
              stroke="#94a3b8"
              strokeWidth={1.5}
            />
            <path
              d={archTick({ x: concreteRightX, y: concreteBottomY + 28 }, "horizontal", 8)}
              stroke="#94a3b8"
              strokeWidth={1.5}
            />
            <text
              x={SVG_W / 2}
              y={concreteBottomY + 50}
              fontSize={14}
              fill="#f1f5f9"
              fontFamily="monospace"
              fontWeight="black"
              textAnchor="middle"
            >
              b = {widthCm * 10} mm
            </text>
          </g>

          {/* ── Pas Payı Ölçülendirmesi (c) ── */}
          <g>
            <line
              x1={concreteLeftX}
              y1={concreteBottomY - 14}
              x2={stirrupLeftX}
              y2={concreteBottomY - 14}
              stroke="#475569"
              strokeWidth={1}
            />
            <path
              d={archTick({ x: concreteLeftX, y: concreteBottomY - 14 }, "horizontal", 6)}
              stroke="#94a3b8"
              strokeWidth={1.5}
            />
            <path
              d={archTick({ x: stirrupLeftX, y: concreteBottomY - 14 }, "horizontal", 6)}
              stroke="#94a3b8"
              strokeWidth={1.5}
            />
            <text
              x={(concreteLeftX + stirrupLeftX) / 2}
              y={concreteBottomY - 22}
              fontSize={12}
              fill="#94a3b8"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              {coverMm}
            </text>
          </g>

          {/* ── Başlık Yazısı ── */}
          <text
            x={SVG_W / 2}
            y={MARGIN_Y + 2}
            fontSize={14}
            fill="#f1f5f9"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="black"
          >
            {quantity}Ø{diameterMm} — {rowCount === 1 ? "Tek Sıra" : "Çift Sıra"} Yerleşim
          </text>
        </svg>
      </div>

      {/* ── Teknik Dipnot ve TS 500 Bilgi Çubuğu ── */}
      <div className="mt-4 pt-3.5 border-t border-white/10 space-y-2 font-mono text-[10px] text-slate-300">
        <div className="flex justify-between items-center">
          <span>Pas Payı (Beton Örtüsü):</span>
          <span className="font-bold text-white">{coverMm} mm</span>
        </div>
        <div className="flex justify-between items-center">
          <span>TS 500 Min. Net Aralık Limiti:</span>
          <span className="font-bold text-amber-400">≥ {minSpacingMm.toFixed(1)} mm</span>
        </div>
        {hasSpacingVal && (
          <div className="flex justify-between items-center border-t border-white/10 pt-2 mt-2 text-xs">
            <span>Mevcut Net Aralık (s):</span>
            <span
              className={cn(
                "font-black tracking-wide",
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
