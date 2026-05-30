"use client";

// Donatı düzeni krokisi — çubuk çap ve adet bilgisinden
// tek veya çift sıra yatay yerleşim şeması çizer.
// TS 500 Md. 7.4 — net çubuk aralığı kontrolü notu içerir.

import { cn } from "@/lib/utils";
import { archTick, getRowLayout } from "./sketch-utils";
import type { RebarSketchProps } from "./sketch-types";

const SVG_W = 320;
const SVG_H = 190;
const MARGIN_Y = 10;
const concreteBottomY = 140;

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

  // Dinamik ölçek hesabı (px/mm)
  const scaleIdeal = 280 / (widthCm * 10);
  // Ölçeği sınırlandırarak çok dar kirişlerde aşırı büyümesini engelliyoruz (max 1.2)
  const scale = Math.min(1.2, Math.max(0.2, scaleIdeal));

  // Beton çizim sınırları (genişlik to-scale olarak ayarlanıyor ve ortalanıyor)
  const concreteW_px = widthCm * 10 * scale;
  const concreteLeftX = (SVG_W - concreteW_px) / 2;
  const concreteRightX = SVG_W - concreteLeftX;

  // Çevresel bağlam (Beton ve Etriye alt sınırları)
  const stirrupLeftX = concreteLeftX + coverMm * scale;
  const stirrupRightX = concreteRightX - coverMm * scale;
  const stirrupBottomY = concreteBottomY - coverMm * scale;

  // Çubuk piksel yarıçapı
  const barR = Math.max(3, (diameterMm / 2) * scale);

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

  const stirrupStrokeWidth = Math.max(1.5, Math.min(3.5, stirrupDiameterMm * scale));

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
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
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
            d={`M ${concreteLeftX} ${MARGIN_Y} L ${concreteLeftX} ${concreteBottomY} L ${concreteRightX} ${concreteBottomY} L ${concreteRightX} ${MARGIN_Y}`}
            fill="#111827"
            stroke="#374151"
            strokeWidth={1.5}
          />
          <path
            d={`M ${concreteLeftX} ${MARGIN_Y} L ${concreteLeftX} ${concreteBottomY} L ${concreteRightX} ${concreteBottomY} L ${concreteRightX} ${MARGIN_Y}`}
            fill="url(#concrete-hatch-rebar)"
            style={{ pointerEvents: "none" }}
          />

          {/* ── Askı Donatıları (Üst Köşeler - 2Ø12 Montaj) ── */}
          <g>
            <circle
              cx={topRebarLeftX}
              cy={topRebarY}
              r={barR_top}
              fill="#4b5563"
              stroke="#374151"
              strokeWidth={1}
            />
            <circle
              cx={topRebarRightX}
              cy={topRebarY}
              r={barR_top}
              fill="#4b5563"
              stroke="#374151"
              strokeWidth={1}
            />
          </g>

          {/* ── Etriye Sınırı (Kapalı Kutu ve 135 Derece Kanca Detayı) ── */}
          {/* Tek bir sürekli çizgide sol kanca ucundan başlayıp, sol kenar, alt kenar, sağ kenar ve sağ kanca ucu çizilir */}
          <path
            d={`M ${stirrupLeftX + 16 * scale} ${topRebarY + 16 * scale} L ${stirrupLeftX} ${topRebarY} L ${stirrupLeftX} ${stirrupBottomY} L ${stirrupRightX} ${stirrupBottomY} L ${stirrupRightX} ${topRebarY} L ${stirrupRightX - 16 * scale} ${topRebarY + 16 * scale}`}
            fill="none"
            stroke={isSpacingViolated ? "#ef4444" : "#4b5563"}
            strokeWidth={stirrupStrokeWidth}
            opacity="0.95"
          />

          {/* ── 1. Sıra Çubuklar (Ana Donatı) ── */}
          {row1Pos.map((cx, i) => (
            <g key={`r1-${i}`}>
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
                  y={rowY1 - barR - 4}
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

          {/* ── 2. Sıra Çubuklar (varsa) ── */}
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
                  y={rowY2 - barR - 4}
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

          {/* ── Aralık Ölçülendirme Çizgisi (ilk iki çubuk arası) ── */}
          {hasSpacingVal && (
            <g>
              <line
                x1={row1Pos[0] + barR}
                y1={rowY1 + barR + 12}
                x2={row1Pos[1] - barR}
                y2={rowY1 + barR + 12}
                stroke={isSpacingViolated ? "#ef4444" : "#94a3b8"}
                strokeWidth={1}
              />
              <path
                d={archTick({ x: row1Pos[0] + barR, y: rowY1 + barR + 12 }, "horizontal", 5)}
                stroke={isSpacingViolated ? "#ef4444" : "#94a3b8"}
                strokeWidth={1.2}
              />
              <path
                d={archTick({ x: row1Pos[1] - barR, y: rowY1 + barR + 12 }, "horizontal", 5)}
                stroke={isSpacingViolated ? "#ef4444" : "#94a3b8"}
                strokeWidth={1.2}
              />
              <text
                x={(row1Pos[0] + row1Pos[1]) / 2}
                y={rowY1 + barR + 22}
                fontSize={8.5}
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
              y1={concreteBottomY + 24}
              x2={concreteRightX}
              y2={concreteBottomY + 24}
              stroke="#475569"
              strokeWidth={1}
            />
            <line
              x1={concreteLeftX}
              y1={concreteBottomY + 4}
              x2={concreteLeftX}
              y2={concreteBottomY + 28}
              stroke="#475569"
              strokeWidth={1}
            />
            <line
              x1={concreteRightX}
              y1={concreteBottomY + 4}
              x2={concreteRightX}
              y2={concreteBottomY + 28}
              stroke="#475569"
              strokeWidth={1}
            />
            <path
              d={archTick({ x: concreteLeftX, y: concreteBottomY + 24 }, "horizontal", 6)}
              stroke="#94a3b8"
              strokeWidth={1.2}
            />
            <path
              d={archTick({ x: concreteRightX, y: concreteBottomY + 24 }, "horizontal", 6)}
              stroke="#94a3b8"
              strokeWidth={1.2}
            />
            <text
              x={SVG_W / 2}
              y={concreteBottomY + 36}
              fontSize={9}
              fill="#e2e8f0"
              fontFamily="monospace"
              fontWeight="bold"
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
              d={archTick({ x: concreteLeftX, y: concreteBottomY - 14 }, "horizontal", 5)}
              stroke="#94a3b8"
              strokeWidth={1.2}
            />
            <path
              d={archTick({ x: stirrupLeftX, y: concreteBottomY - 14 }, "horizontal", 5)}
              stroke="#94a3b8"
              strokeWidth={1.2}
            />
            <text
              x={(concreteLeftX + stirrupLeftX) / 2}
              y={concreteBottomY - 19}
              fontSize={8}
              fill="#a3a3a3"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {coverMm}
            </text>
          </g>

          {/* ── Başlık Yazısı ── */}
          <text
            x={SVG_W / 2}
            y={MARGIN_Y + 4}
            fontSize={9.5}
            fill="#cbd5e1"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="black"
          >
            {quantity}Ø{diameterMm} — {rowCount === 1 ? "Tek Sıra" : "Çift Sıra"} Boyuna Donatı
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
          <span className="font-bold text-amber-400">≥ {minSpacingMm.toFixed(1)} mm</span>
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
