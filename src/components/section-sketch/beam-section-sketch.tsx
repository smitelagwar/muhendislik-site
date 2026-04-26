"use client";

// Kiriş enkesit krokisi — SVG tabanlı 2B görselleştirme
// Mühendis için hızlı görsel kontrol: beton profili, pas payı,
// etriye, çekme donatısı ve ölçü çizgileri anlık güncellenir.

import { cn } from "@/lib/utils";
import { archTick, singleRowBarPositions, stirrupHook135, suggestBarCount, worldToSvg } from "./sketch-utils";
import type { BeamSketchProps } from "./sketch-types";

// SVG tuval boyutları (sabit — içerik viewBox ile ölçeklenir)
const SVG_W = 320;
const SVG_H = 240;

// Kenar boşlukları: ölçü çizgileri ve etiketler için
const MARGIN_LEFT = 52;
const MARGIN_TOP = 24;
const MARGIN_RIGHT = 24;
const MARGIN_BOTTOM = 48;

// Beton profili çizim alanı
const DRAW_W = SVG_W - MARGIN_LEFT - MARGIN_RIGHT;
const DRAW_H = SVG_H - MARGIN_TOP - MARGIN_BOTTOM;

/** Donatı çubuğunu temsil eden daire */
function RebarCircle({
  cx,
  cy,
  r,
  pending = false,
}: {
  cx: number;
  cy: number;
  r: number;
  pending?: boolean;
}) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={pending ? "none" : "#f59e0b"}          // teal-400 — marka rengi
      stroke={pending ? "#f59e0b" : "#b45309"}      // teal-600
      strokeWidth={pending ? 1 : 1.5}
      strokeDasharray={pending ? "3 2" : undefined}
      style={{ transition: "all 0.3s ease" }}
    />
  );
}

export function BeamSectionSketch({
  widthCm,
  totalHeightCm,
  coverMm,
  stirrupDiameterMm,
  effectiveDepthMm,
  designSteelAreaMm2,
  className,
}: BeamSketchProps) {
  // Girdi doğrulama — anlamsız değerlerde boş durum
  const isValid =
    widthCm > 0 &&
    totalHeightCm > 0 &&
    coverMm > 0 &&
    stirrupDiameterMm > 0 &&
    widthCm < 300 &&
    totalHeightCm < 500;

  if (!isValid) {
    return (
      <div className={cn("flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40", className)}>
        <p className="text-xs font-semibold text-zinc-500">Geçerli kesit değerleri bekleniyor</p>
      </div>
    );
  }

  // ---- Ölçek hesabı ----
  // Gerçek en/boy oranına göre çizim alanını dinamik böl
  const aspectRatio = totalHeightCm / widthCm;
  let drawW: number;
  let drawH: number;

  if (aspectRatio >= 1) {
    // Dikey baskın (kiriş)
    drawH = DRAW_H;
    drawW = Math.min(DRAW_W, drawH / aspectRatio);
  } else {
    // Yatay baskın (geniş, alçak)
    drawW = DRAW_W;
    drawH = Math.min(DRAW_H, drawW * aspectRatio);
  }

  // Beton profili sol-üst köşesi (ortalanmış)
  const bx = MARGIN_LEFT + (DRAW_W - drawW) / 2;
  const by = MARGIN_TOP + (DRAW_H - drawH) / 2;

  // Pas payı ve etriye — mm cinsinden, çizim px cinsine dönüştür
  const coverPxH = worldToSvg(coverMm / 10, totalHeightCm, drawH); // mm → cm → px
  const coverPxW = worldToSvg(coverMm / 10, widthCm, drawW);
  const stirrupRPx = worldToSvg(stirrupDiameterMm / 10 / 2, widthCm, drawW);

  // Etriye iç dikdörtgen
  const stirrupX = bx + coverPxW;
  const stirrupY = by + coverPxH;
  const stirrupW = drawW - 2 * coverPxW;
  const stirrupH = drawH - 2 * coverPxH;

  // Çekme donatısı merkez y-koordinatı (alt etriye iç yüzeyinden bir yarıçap içeride)
  const barRadiusPx = Math.max(3, Math.min(7, worldToSvg(0.7, widthCm, drawW)));
  const barCenterY = by + drawH - coverPxH - stirrupRPx - barRadiusPx;

  // Donatı adedi — tasarım alanından öner veya placeholder
  const hasSteelResult = designSteelAreaMm2 != null && designSteelAreaMm2 > 0;
  const barCount = hasSteelResult ? Math.min(suggestBarCount(designSteelAreaMm2!), 8) : 3;
  const barXPositions = singleRowBarPositions(
    barCount,
    stirrupX + stirrupRPx + barRadiusPx,
    stirrupW - 2 * (stirrupRPx + barRadiusPx),
  );

  // Faydalı yükseklik d çizgisi
  const dLinePx = effectiveDepthMm != null
    ? worldToSvg(effectiveDepthMm / 10, totalHeightCm, drawH)
    : drawH - coverPxH - stirrupRPx - barRadiusPx * 2;
  const dLineY = by + drawH - dLinePx;

  // ---- SVG render ----
  return (
    <div className={cn("w-full select-none", className)}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        aria-label="Kiriş enkesit krokisi"
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
        {/* Beton dokusu (hatch) */}
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
          x={bx + coverPxW}
          y={by + coverPxH}
          width={drawW - 2 * coverPxW}
          height={drawH - 2 * coverPxH}
          fill="none"
          stroke="#60a5fa"
          strokeWidth={0.8}
          strokeDasharray="4 3"
          rx={1}
          style={{ transition: "all 0.3s ease" }}
        />

        {/* ── Etriye (düz çizgi, nötr gri) ── */}
        <rect
          x={stirrupX}
          y={stirrupY}
          width={stirrupW}
          height={stirrupH}
          fill="none"
          stroke="#a3a3a3"
          strokeWidth={1.2}
          rx={1}
          style={{ transition: "all 0.3s ease" }}
        />
        {/* Etriye deprem kancaları (Sol üst) */}
        <path
          d={stirrupHook135(stirrupX, stirrupY, 10)}
          fill="none"
          stroke="#a3a3a3"
          strokeWidth={1.2}
          style={{ transition: "all 0.3s ease" }}
        />

        {/* ── Montaj Donatısı (Üst çubuklar) ── */}
        <RebarCircle cx={stirrupX + stirrupRPx + barRadiusPx} cy={stirrupY + stirrupRPx + barRadiusPx} r={Math.max(2.5, barRadiusPx * 0.8)} />
        <RebarCircle cx={stirrupX + stirrupW - stirrupRPx - barRadiusPx} cy={stirrupY + stirrupRPx + barRadiusPx} r={Math.max(2.5, barRadiusPx * 0.8)} />

        {/* ── Faydalı yükseklik d çizgisi ── */}
        <line
          x1={bx - 8}
          y1={dLineY}
          x2={bx + drawW + 4}
          y2={dLineY}
          stroke="#34d399"        // emerald-400
          strokeWidth={0.8}
          strokeDasharray="6 3"
        />
        <text
          x={bx + drawW + 6}
          y={dLineY + 4}
          fontSize={8}
          fill="#34d399"
          fontFamily="monospace"
          fontWeight="600"
        >
          d
        </text>

        {/* ── Çekme donatısı çubukları ── */}
        {barXPositions.map((cx, index) => (
          <RebarCircle
            key={index}
            cx={cx}
            cy={barCenterY}
            r={barRadiusPx}
            pending={!hasSteelResult}
          />
        ))}

        {/* ── "Hesaplanıyor" etiketi (sonuç yokken) ── */}
        {!hasSteelResult && (
          <text
            x={bx + drawW / 2}
            y={barCenterY - barRadiusPx - 4}
            fontSize={7}
            fill="#f59e0b"
            fontFamily="monospace"
            textAnchor="middle"
          >
            As bekleniyor
          </text>
        )}

        {/* ── Sol ölçü çizgisi: h ── */}
        {/* Dikey çizgi */}
        <line x1={bx - 14} y1={by} x2={bx - 14} y2={by + drawH} stroke="#71717a" strokeWidth={0.8} />
        {/* Mimari ölçü kesmeleri */}
        <path d={archTick({ x: bx - 14, y: by }, "horizontal")} stroke="#71717a" strokeWidth={1.2} strokeLinecap="round" />
        <path d={archTick({ x: bx - 14, y: by + drawH }, "horizontal")} stroke="#71717a" strokeWidth={1.2} strokeLinecap="round" />
        {/* Yatay uzantılar */}
        <line x1={bx - 20} y1={by} x2={bx} y2={by} stroke="#71717a" strokeWidth={0.6} strokeDasharray="2 2" />
        <line x1={bx - 20} y1={by + drawH} x2={bx} y2={by + drawH} stroke="#71717a" strokeWidth={0.6} strokeDasharray="2 2" />
        {/* Etiket */}
        <text
          x={bx - 28}
          y={by + drawH / 2 + 4}
          fontSize={9}
          fill="#a3a3a3"
          fontFamily="monospace"
          textAnchor="middle"
          transform={`rotate(-90, ${bx - 28}, ${by + drawH / 2 + 4})`}
        >
          h={totalHeightCm} cm
        </text>

        {/* ── Alt ölçü çizgisi: b ── */}
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
          b={widthCm} cm
        </text>

        {/* ── Pas payı etiketi ── */}
        <text
          x={bx + coverPxW + 2}
          y={by + 10}
          fontSize={6.5}
          fill="#60a5fa"
          fontFamily="monospace"
        >
          c={coverMm}mm
        </text>
      </svg>

      {/* ── Açıklama satırı ── */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
        <LegendItem color="#27272a" border="#52525b" label="Beton" />
        <LegendItem color="none" border="#60a5fa" dashed label="Pas payı sınırı" />
        <LegendItem color="none" border="#a3a3a3" label="Etriye" />
        <LegendItem color="#f59e0b" border="#b45309" label={hasSteelResult ? `As çubukları (≈${barCount} adet)` : "As (bekleniyor)"} />
      </div>
    </div>
  );
}

/** Küçük lejand kalemi */
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
