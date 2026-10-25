"use client";

import React, { useMemo } from "react";
import { Scissors } from "lucide-react";
import type {
  DetailModel,
  LayerVisibilityMask,
  RebarPathPart,
} from "@/lib/simulations/core/types";
import { evaluateColumnHorizontalSectionAtElevation } from "@/lib/simulations/core/section-geometry";
import {
  DEFAULT_LAYER_VISIBILITY,
  DEFAULT_SECTION_ELEVATION_Z_MM,
  type SimulationSectionState,
} from "@/lib/simulations/state/view-reducer";

const QUICK_CUT_ELEVATIONS: ReadonlyArray<{
  zMm: number;
  label: string;
}> = [
  { zMm: 50, label: "Z=50 mm (Etriye #1)" },
  { zMm: 55, label: "Z=55 mm (Etriye Dışı Sınır)" },
  { zMm: 100, label: "Z=100 mm (Boşluk)" },
  { zMm: 600, label: "Z=600 mm (Bölge Sınırı)" },
  { zMm: 1575, label: "Z=1575 mm (Orta Etriye)" },
  { zMm: 3500, label: "Z=3500 mm (Filiz Bölgesi)" },
];

const QUICK_BEAM_CUT_POSITIONS: ReadonlyArray<{
  zMm: number;
  label: string;
}> = [
  { zMm: 250, label: "X=250 mm (Sol Mesnet Etriyesi)" },
  { zMm: 300, label: "X=300 mm (Mesnet Boşluğu)" },
  { zMm: 1000, label: "X=1000 mm (Sarılma Sınırı)" },
  { zMm: 1850, label: "X=1850 mm (Açıklık Etriyesi)" },
  { zMm: 1950, label: "X=1950 mm (Açıklık Boşluğu)" },
  { zMm: 3750, label: "X=3750 mm (Sağ Mesnet Etriyesi)" },
];

const QUICK_JOINT_CUT_ELEVATIONS: ReadonlyArray<{
  zMm: number;
  label: string;
}> = [
  { zMm: 1300, label: "Z=1300 mm (Düğüm Alt Etriyesi)" },
  { zMm: 1450, label: "Z=1450 mm (Düğüm İçi Boşluk)" },
  { zMm: 1500, label: "Z=1500 mm (Düğüm Orta Etriyesi)" },
  { zMm: 1696, label: "Z=1696 mm (Kiriş Üst Ankraj Kotu)" },
  { zMm: 775, label: "Z=775 mm (Alt Kolon Etriyesi)" },
  { zMm: 3300, label: "Z=3300 mm (Üst Filiz Bölgesi)" },
];

const QUICK_FOOTING_CUT_ELEVATIONS: ReadonlyArray<{
  zMm: number;
  label: string;
}> = [
  { zMm: 58, label: "Z=58 mm (Alt X Izgara Kotu)" },
  { zMm: 74, label: "Z=74 mm (Alt Y Izgara Kotu)" },
  { zMm: 92, label: "Z=92 mm (Filiz Ayak Kotu)" },
  { zMm: 310, label: "Z=310 mm (Temel İçi Etriye)" },
  { zMm: 760, label: "Z=760 mm (Kolon Boyun Etriyesi)" },
  { zMm: 1280, label: "Z=1280 mm (Üst Filiz Ucu)" },
];

const QUICK_WALL_CUT_ELEVATIONS: ReadonlyArray<{
  zMm: number;
  label: string;
}> = [
  { zMm: 300, label: "Z=300 mm (Uç Etriye + Çiroz Kotu)" },
  { zMm: 500, label: "Z=500 mm (Uç Etriye + Yatay Ağ)" },
  { zMm: 650, label: "Z=650 mm (Etriye Arası Boşluk)" },
  { zMm: 1500, label: "Z=1500 mm (Orta Uç Etriye + Çiroz)" },
  { zMm: 2750, label: "Z=2750 mm (Üst Uç Etriye + Çiroz)" },
  { zMm: 3300, label: "Z=3300 mm (Üst Filiz Bölgesi)" },
];

const QUICK_MAT_CUT_ELEVATIONS: ReadonlyArray<{
  zMm: number;
  label: string;
}> = [
  { zMm: 58, label: "Z=58 mm (Alt X Izgara Kotu)" },
  { zMm: 74, label: "Z=74 mm (Alt Y Izgara Kotu)" },
  { zMm: 340, label: "Z=340 mm (Sehpa & Filiz Etriye Kotu)" },
  { zMm: 526, label: "Z=526 mm (Üst Y Izgara Kotu)" },
  { zMm: 542, label: "Z=542 mm (Üst X Izgara Kotu)" },
  { zMm: 950, label: "Z=950 mm (Kolon Boyun Bölgesi)" },
];

export function Drawing2DPreview({
  model,
  concreteVisible,
  layers = DEFAULT_LAYER_VISIBILITY,
  selectedPartId = null,
  section = {
    enabled: false,
    elevationZMm: DEFAULT_SECTION_ELEVATION_Z_MM,
  },
  onSelectPart,
  onToggleSection,
  onChangeSectionElevation,
}: {
  model: DetailModel;
  concreteVisible?: boolean;
  layers?: LayerVisibilityMask;
  selectedPartId?: string | null;
  section?: SimulationSectionState;
  onSelectPart?: (partId: string | null) => void;
  onToggleSection?: (enabled: boolean) => void;
  onChangeSectionElevation?: (elevationZMm: number) => void;
}) {
  const { widthX, depthY, concreteHeightZ, totalHeightZ, clearCover } =
    model.dimensionsMm;

  const isConcreteShown =
    typeof concreteVisible === "boolean" ? concreteVisible : layers.concrete;

  const isBeam =
    model.slug === "kiris-detayi" || model.primaryAxis === "x";

  const cutAnalysis = useMemo(
    () =>
      evaluateColumnHorizontalSectionAtElevation(
        model,
        section.elevationZMm,
        layers,
      ),
    [model, section.elevationZMm, layers],
  );

  const stirrupParts = model.parts.filter(
    (part): part is RebarPathPart =>
      part.kind === "rebar" && part.category === "stirrup",
  );
  const longitudinalParts = model.parts.filter(
    (part): part is RebarPathPart =>
      part.kind === "rebar" && part.category === "longitudinal",
  );
  const dowelParts = model.parts.filter(
    (part): part is RebarPathPart =>
      part.kind === "rebar" && part.category === "dowel",
  );
  const crosstieParts = model.parts.filter(
    (part): part is RebarPathPart =>
      part.kind === "rebar" && part.category === "crosstie",
  );

  if (model.slug === "radye-temel") {
    const mW = widthX; // 2200 mm
    const mH = concreteHeightZ; // 600 mm
    const zBotX = 58;
    const zBotY = 74;
    const zTopY = 526;
    const zTopX = 542;

    const elevW = 540;
    const elevH = 340;
    const padX = 50;
    const drawW = elevW - padX * 2; // 440 px -> [-1200, +1200] mm
    const xMmToElevPx = (xMm: number) => padX + ((xMm + 1200) / 2400) * drawW;

    const minZ = -100;
    const maxZ = totalHeightZ; // 1350 mm
    const spanZ = maxZ - minZ; // 1450 mm
    const padYTop = 26;
    const drawH = 278;
    const zMmToElevPy = (zMm: number) =>
      padYTop + ((maxZ - zMm) / spanZ) * drawH;

    const cutLinePy = zMmToElevPy(cutAnalysis.clampedElevationZMm);

    const planW = 300;
    const planH = 300;
    const planCenter = 150;
    const planHalfPx = 114;
    const mmToPlanX = (xMm: number) => planCenter + (xMm / (mW / 2)) * planHalfPx;
    const mmToPlanY = (yMm: number) => planCenter - (yMm / (mW / 2)) * planHalfPx;

    const bottomXParts = longitudinalParts.filter((p) =>
      p.id.startsWith("mat-bottom-x-"),
    );
    const bottomYParts = longitudinalParts.filter((p) =>
      p.id.startsWith("mat-bottom-y-"),
    );
    const topXParts = crosstieParts.filter((p) => p.id.startsWith("mat-top-x-"));
    const topYParts = crosstieParts.filter((p) => p.id.startsWith("mat-top-y-"));
    const chairParts = stirrupParts.filter((p) => p.id.startsWith("mat-chair-"));
    const colStirrupParts = stirrupParts.filter((p) =>
      p.id.startsWith("mat-column-stirrup-"),
    );

    const centerBottomXPart = bottomXParts[5] ?? bottomXParts[0];
    const centerTopXPart = topXParts[5] ?? topXParts[0];
    const centerChairPart =
      chairParts.find((p) => p.id.includes("x0-y0")) ?? chairParts[0];

    return (
      <div data-testid="simulation-2d-preview" className="space-y-4">
        {/* Radye Temel Yatay Kesit Kontrol Barı */}
        <div
          data-testid="section-plane-controls"
          className="rounded-2xl border border-border/80 dark:border-purple-500/25 bg-card/90 dark:bg-[#0c0a1d]/90 p-3.5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="toggle-section-plane-btn"
                aria-pressed={section.enabled}
                onClick={() => onToggleSection?.(!section.enabled)}
                className={`min-h-[40px] inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${
                  section.enabled
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 shadow-sm"
                    : "border-border/80 dark:border-white/15 bg-muted/50 dark:bg-[#171330] text-foreground dark:text-zinc-200 hover:border-cyan-500/40"
                }`}
              >
                <Scissors className="h-3.5 w-3.5 text-cyan-400" />
                <span>
                  {section.enabled
                    ? "Yatay Kesit: Açık"
                    : "Yatay Kesit Düzlemini Aç"}
                </span>
              </button>
              <span
                data-testid="section-elevation-readout"
                className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 font-mono text-xs font-extrabold text-purple-700 dark:text-purple-200"
              >
                Kesit Kotu: Z = {cutAnalysis.clampedElevationZMm} mm
              </span>
            </div>

            <span
              data-testid="section-intersect-badge"
              data-stirrup-hit-count={cutAnalysis.intersectedStirrupParts.length}
              data-in-concrete={cutAnalysis.inConcreteBody ? "true" : "false"}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 font-mono text-[11px] font-bold text-cyan-700 dark:text-cyan-200"
            >
              Alt Izgara: Z={zBotX}/{zBotY} mm · Üst Izgara: Z={zTopY}/{zTopX} mm
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label
                htmlFor="section-elevation-slider"
                className="text-xs font-bold text-muted-foreground dark:text-zinc-300 shrink-0"
              >
                Düşey Kot (Z):
              </label>
              <input
                id="section-elevation-slider"
                data-testid="section-elevation-slider"
                type="range"
                min={0}
                max={totalHeightZ}
                step={2}
                value={cutAnalysis.clampedElevationZMm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!section.enabled) {
                    onToggleSection?.(true);
                  }
                  onChangeSectionElevation?.(val);
                }}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_MAT_CUT_ELEVATIONS.map((item) => {
                const active = cutAnalysis.clampedElevationZMm === item.zMm;
                return (
                  <button
                    key={item.zMm}
                    type="button"
                    data-testid={`quick-cut-z-${item.zMm}`}
                    onClick={() => {
                      if (!section.enabled) {
                        onToggleSection?.(true);
                      }
                      onChangeSectionElevation?.(item.zMm);
                    }}
                    className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] font-bold transition-all ${
                      active
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200"
                        : "border-border/70 dark:border-white/10 bg-muted/40 dark:bg-[#171330] text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sol: Radye Temel Düşey Kesiti (X-Z) + Sağ: Radye Plan Görünümü (X-Y) */}
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Sol: Radye Düşey Kesiti */}
          <div className="rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0c0a1d]/90 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-foreground dark:text-white">
                  Radye Temel Düşey Kesiti (R1 · {mW}×{mW}×{mH} mm)
                </h3>
                <p
                  data-testid="drawing-2d-dimensions-summary"
                  data-total-height-mm={totalHeightZ}
                  data-concrete-height-mm={mH}
                  data-dowel-length-mm={model.dimensionsMm.dowelLengthZ}
                  data-section-width-mm={mW}
                  data-bottom-mesh-x-z-mm={zBotX}
                  data-bottom-mesh-y-z-mm={zBotY}
                  data-top-mesh-y-z-mm={zTopY}
                  data-top-mesh-x-z-mm={zTopX}
                  className="text-xs text-muted-foreground dark:text-zinc-400"
                >
                  Alt Izgara: Z={zBotX}/{zBotY} mm · Üst Izgara: Z={zTopY}/{zTopX} mm · 9Ø14 Sehpa · 8Ø20 Filiz
                </p>
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-purple-300">
                Alt + Üst İki Yönlü Ağ
              </span>
            </div>

            <svg
              viewBox={`0 0 ${elevW} ${elevH}`}
              className="w-full rounded-xl bg-muted/40 dark:bg-[#080714] border border-border/60 dark:border-white/10"
              role="img"
              aria-label="Radye temel, sehpa ve kolon filizi düşey kesiti"
            >
              {/* Grobeton + Radye Plağı + Kolon Boynu */}
              {isConcreteShown && (
                <>
                  <rect
                    data-testid="svg-part-concrete-lean-layer"
                    x={xMmToElevPx(-1200)}
                    y={zMmToElevPy(0)}
                    width={xMmToElevPx(1200) - xMmToElevPx(-1200)}
                    height={zMmToElevPy(-100) - zMmToElevPy(0)}
                    fill="#475569"
                    fillOpacity={0.28}
                    stroke="#94a3b8"
                    strokeDasharray="4 2"
                    strokeWidth={1.1}
                    onClick={() => onSelectPart?.("concrete-lean-layer")}
                    className="cursor-pointer"
                  />
                  <rect
                    data-testid="svg-part-concrete-footing-body"
                    x={xMmToElevPx(-1100)}
                    y={zMmToElevPy(mH)}
                    width={xMmToElevPx(1100) - xMmToElevPx(-1100)}
                    height={zMmToElevPy(0) - zMmToElevPy(mH)}
                    fill="#64748b"
                    fillOpacity={0.22}
                    stroke="#94a3b8"
                    strokeWidth={1.6}
                    onClick={() => onSelectPart?.("concrete-footing-body")}
                    className="cursor-pointer"
                  />
                  <rect
                    data-testid="svg-part-concrete-column-body"
                    x={xMmToElevPx(-225)}
                    y={zMmToElevPy(1200)}
                    width={xMmToElevPx(225) - xMmToElevPx(-225)}
                    height={zMmToElevPy(mH) - zMmToElevPy(1200)}
                    fill="#64748b"
                    fillOpacity={0.18}
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    onClick={() => onSelectPart?.("concrete-column-body")}
                    className="cursor-pointer"
                  />
                </>
              )}

              {/* Alt Y Izgara Kesit Daireleri (Z = 74 mm) */}
              {layers.longitudinal &&
                bottomYParts.map((bar) => {
                  const seg = bar.segments[0];
                  const xMm = seg && seg.kind === "line" ? seg.start.x : 0;
                  const isSel = selectedPartId === bar.id;
                  return (
                    <circle
                      key={bar.id}
                      data-testid={`svg-part-${bar.id}`}
                      cx={xMmToElevPx(xMm)}
                      cy={zMmToElevPy(zBotY)}
                      r={isSel ? 5 : 3.6}
                      fill={isSel ? "#f43f5e" : "#0ea5e9"}
                      stroke="#0f172a"
                      strokeWidth={1}
                      onClick={() => onSelectPart?.(bar.id)}
                      className="cursor-pointer"
                    />
                  );
                })}

              {/* Alt X Izgara Çubuğu (Z = 58 mm) */}
              {layers.longitudinal && centerBottomXPart && (
                <rect
                  data-testid={`svg-part-${centerBottomXPart.id}`}
                  x={xMmToElevPx(-1050)}
                  y={zMmToElevPy(zBotX) - 2.5}
                  width={xMmToElevPx(1050) - xMmToElevPx(-1050)}
                  height={5}
                  rx={1.5}
                  fill={selectedPartId === centerBottomXPart.id ? "#f43f5e" : "#38bdf8"}
                  onClick={() => onSelectPart?.(centerBottomXPart.id)}
                  className="cursor-pointer"
                />
              )}

              {/* Üst Y Izgara Kesit Daireleri (Z = 526 mm) */}
              {layers.crosstie &&
                topYParts.map((bar) => {
                  const seg = bar.segments[0];
                  const xMm = seg && seg.kind === "line" ? seg.start.x : 0;
                  const isSel = selectedPartId === bar.id;
                  return (
                    <circle
                      key={bar.id}
                      data-testid={`svg-part-${bar.id}`}
                      cx={xMmToElevPx(xMm)}
                      cy={zMmToElevPy(zTopY)}
                      r={isSel ? 5 : 3.6}
                      fill={isSel ? "#f43f5e" : "#f472b6"}
                      stroke="#0f172a"
                      strokeWidth={1}
                      onClick={() => onSelectPart?.(bar.id)}
                      className="cursor-pointer"
                    />
                  );
                })}

              {/* Üst X Izgara Çubuğu (Z = 542 mm) */}
              {layers.crosstie && centerTopXPart && (
                <rect
                  data-testid={`svg-part-${centerTopXPart.id}`}
                  x={xMmToElevPx(-1050)}
                  y={zMmToElevPy(zTopX) - 2.5}
                  width={xMmToElevPx(1050) - xMmToElevPx(-1050)}
                  height={5}
                  rx={1.5}
                  fill={selectedPartId === centerTopXPart.id ? "#f43f5e" : "#ec4899"}
                  onClick={() => onSelectPart?.(centerTopXPart.id)}
                  className="cursor-pointer"
                />
              )}

              {/* Sehpa Donatıları (X = -650, 0, +650 mm, Z = 89..511 mm) */}
              {layers.stirrup &&
                chairParts
                  .filter((p) => p.id.includes("-y0"))
                  .map((ch) => {
                    const cx = ch.id.includes("x-650")
                      ? -650
                      : ch.id.includes("x650")
                        ? 650
                        : 0;
                    const isSel = selectedPartId === ch.id;
                    const col = isSel ? "#f43f5e" : "#eab308";
                    return (
                      <g
                        key={ch.id}
                        data-testid={`svg-part-${ch.id}`}
                        onClick={() => onSelectPart?.(ch.id)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={xMmToElevPx(cx - 130)}
                          y={zMmToElevPy(511) - 2.5}
                          width={xMmToElevPx(cx + 130) - xMmToElevPx(cx - 130)}
                          height={5}
                          fill={col}
                        />
                        <rect
                          x={xMmToElevPx(cx - 130) - 2}
                          y={zMmToElevPy(511)}
                          width={4}
                          height={zMmToElevPy(89) - zMmToElevPy(511)}
                          fill={col}
                        />
                        <rect
                          x={xMmToElevPx(cx + 130) - 2}
                          y={zMmToElevPy(511)}
                          width={4}
                          height={zMmToElevPy(89) - zMmToElevPy(511)}
                          fill={col}
                        />
                      </g>
                    );
                  })}

              {/* Kolon Filizleri (Sol ve Sağ L-ayaklı filizler) */}
              {layers.dowel && (
                <>
                  <g
                    data-testid="svg-part-mat-dowel-bar-1-sw"
                    onClick={() => onSelectPart?.("mat-dowel-bar-1-sw")}
                    className="cursor-pointer"
                  >
                    <rect
                      x={xMmToElevPx(-165) - 2.8}
                      y={zMmToElevPy(1350)}
                      width={5.6}
                      height={zMmToElevPy(92) - zMmToElevPy(1350)}
                      fill={
                        selectedPartId === "mat-dowel-bar-1-sw" ? "#f43f5e" : "#f59e0b"
                      }
                    />
                    <rect
                      x={xMmToElevPx(-165 - 340)}
                      y={zMmToElevPy(92) - 2.8}
                      width={xMmToElevPx(-165) - xMmToElevPx(-165 - 340)}
                      height={5.6}
                      fill={
                        selectedPartId === "mat-dowel-bar-1-sw" ? "#f43f5e" : "#f59e0b"
                      }
                    />
                  </g>
                  <g
                    data-testid="svg-part-mat-dowel-bar-2-se"
                    onClick={() => onSelectPart?.("mat-dowel-bar-2-se")}
                    className="cursor-pointer"
                  >
                    <rect
                      x={xMmToElevPx(165) - 2.8}
                      y={zMmToElevPy(1350)}
                      width={5.6}
                      height={zMmToElevPy(1350) ? zMmToElevPy(92) - zMmToElevPy(1350) : 100}
                      fill={
                        selectedPartId === "mat-dowel-bar-2-se" ? "#f43f5e" : "#f59e0b"
                      }
                    />
                    <rect
                      x={xMmToElevPx(165)}
                      y={zMmToElevPy(92) - 2.8}
                      width={xMmToElevPx(165 + 340) - xMmToElevPx(165)}
                      height={5.6}
                      fill={
                        selectedPartId === "mat-dowel-bar-2-se" ? "#f43f5e" : "#f59e0b"
                      }
                    />
                  </g>
                </>
              )}

              {/* Filiz ve Kolon Boynu Etriyeleri */}
              {layers.stirrup &&
                colStirrupParts.map((st) => {
                  const zMm = st.elevationZMm ?? 0;
                  const isSel = selectedPartId === st.id;
                  return (
                    <rect
                      key={st.id}
                      data-testid={`svg-part-${st.id}`}
                      x={xMmToElevPx(-180)}
                      y={zMmToElevPy(zMm) - 2}
                      width={xMmToElevPx(180) - xMmToElevPx(-180)}
                      height={4}
                      fill={isSel ? "#f43f5e" : st.colorHex}
                      onClick={() => onSelectPart?.(st.id)}
                      className="cursor-pointer"
                    />
                  );
                })}

              {/* Yatay Kesit Düzlemi Çizgisi */}
              <g data-testid="svg-section-plane-line">
                <line
                  x1={xMmToElevPx(-1160)}
                  y1={cutLinePy}
                  x2={xMmToElevPx(1160)}
                  y2={cutLinePy}
                  stroke="#22d3ee"
                  strokeWidth={section.enabled ? 2.4 : 1.5}
                  strokeDasharray="6 3"
                />
              </g>
            </svg>
          </div>

          {/* Sağ: Radye Temel Plan Görünümü (X-Y) */}
          <div className="space-y-4">
            <div
              data-testid="actual-cut-section-card"
              className="rounded-2xl border border-cyan-500/35 bg-card/90 dark:bg-[#0c0a1d]/90 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-foreground dark:text-white">
                  Radye Temel Planı & Sehpa/Filiz Düzeni (Z = {cutAnalysis.clampedElevationZMm} mm)
                </h3>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-200">
                  11×11 Alt + Üst Ağ
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-300">
                Alt ızgara (mavi), üst ızgara (pembe), 9 adet Ø14 sehpa (sarı) ve merkez
                kolonun 8Ø20 L-filizleri aynı koordinatlarla planda gösterilir.
              </p>

              <svg
                viewBox={`0 0 ${planW} ${planH}`}
                data-testid="actual-cut-section-svg"
                className="mt-3 mx-auto w-full max-w-[270px] rounded-xl bg-muted/40 dark:bg-[#080714] border border-border/60 dark:border-white/10"
                role="img"
                aria-label="Radye temel plan görünümü"
              >
                {isConcreteShown && (
                  <rect
                    data-testid="actual-cut-concrete-rect"
                    x={mmToPlanX(-1100)}
                    y={mmToPlanY(1100)}
                    width={mmToPlanX(1100) - mmToPlanX(-1100)}
                    height={mmToPlanY(-1100) - mmToPlanY(1100)}
                    rx={4}
                    fill="#64748b"
                    fillOpacity={0.2}
                    stroke="#94a3b8"
                    strokeWidth={1.6}
                  />
                )}

                {/* Alt X/Y Izgarası */}
                {layers.longitudinal &&
                  bottomXParts.map((bar) => {
                    const seg = bar.segments[0];
                    const yMm = seg && seg.kind === "line" ? seg.start.y : 0;
                    const isSel = selectedPartId === bar.id;
                    return (
                      <rect
                        key={bar.id}
                        data-testid={`plan-part-${bar.id}`}
                        x={mmToPlanX(-1050)}
                        y={mmToPlanY(yMm) - 1.5}
                        width={mmToPlanX(1050) - mmToPlanX(-1050)}
                        height={3}
                        fill={isSel ? "#f43f5e" : "#38bdf8"}
                        fillOpacity={0.78}
                        onClick={() => onSelectPart?.(bar.id)}
                        className="cursor-pointer"
                      />
                    );
                  })}

                {/* Üst X/Y Izgarası */}
                {layers.crosstie &&
                  topYParts.map((bar) => {
                    const seg = bar.segments[0];
                    const xMm = seg && seg.kind === "line" ? seg.start.x : 0;
                    const isSel = selectedPartId === bar.id;
                    return (
                      <rect
                        key={bar.id}
                        data-testid={`plan-part-${bar.id}`}
                        x={mmToPlanX(xMm) - 1.5}
                        y={mmToPlanY(1050)}
                        width={3}
                        height={mmToPlanY(-1050) - mmToPlanY(1050)}
                        fill={isSel ? "#f43f5e" : "#ec4899"}
                        fillOpacity={0.78}
                        onClick={() => onSelectPart?.(bar.id)}
                        className="cursor-pointer"
                      />
                    );
                  })}

                {/* 9 Adet Sehpa (Chair) Plan İşaretleri */}
                {layers.stirrup &&
                  chairParts.map((ch) => {
                    const seg = ch.segments[4]; // üst tabla
                    const midX =
                      seg && seg.kind === "line"
                        ? (seg.start.x + seg.end.x) / 2
                        : 0;
                    const midY = seg && seg.kind === "line" ? seg.start.y : 0;
                    const isSel = selectedPartId === ch.id;
                    return (
                      <rect
                        key={ch.id}
                        data-testid={`plan-part-${ch.id}`}
                        x={mmToPlanX(midX) - 7}
                        y={mmToPlanY(midY) - 4}
                        width={14}
                        height={8}
                        rx={1.5}
                        fill={isSel ? "#f43f5e" : "#eab308"}
                        stroke="#0f172a"
                        strokeWidth={0.9}
                        onClick={() => onSelectPart?.(ch.id)}
                        className="cursor-pointer"
                      />
                    );
                  })}

                {/* Kesişen Filiz/Kolon Etriye Halkası */}
                {layers.stirrup &&
                  cutAnalysis.intersectedStirrupParts
                    .filter((st) => st.id.startsWith("mat-column-stirrup-"))
                    .map((st) => (
                      <rect
                        key={st.id}
                        data-testid="actual-cut-stirrup-ring"
                        data-part-id={st.id}
                        x={mmToPlanX(-180)}
                        y={mmToPlanY(180)}
                        width={mmToPlanX(180) - mmToPlanX(-180)}
                        height={mmToPlanY(-180) - mmToPlanY(180)}
                        rx={2}
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth={2.5}
                      />
                    ))}

                {/* 8Ø20 Merkez Kolon Filizleri */}
                {layers.dowel &&
                  dowelParts.map((dw) => {
                    const seg = dw.segments[0];
                    const xMm = seg && seg.kind === "line" ? seg.start.x : 0;
                    const yMm = seg && seg.kind === "line" ? seg.start.y : 0;
                    const isSel = selectedPartId === dw.id;
                    return (
                      <circle
                        key={dw.id}
                        data-testid={`plan-part-${dw.id}`}
                        cx={mmToPlanX(xMm)}
                        cy={mmToPlanY(yMm)}
                        r={isSel ? 4.8 : 3.5}
                        fill={isSel ? "#f43f5e" : "#f59e0b"}
                        stroke="#0f172a"
                        strokeWidth={1}
                        onClick={() => onSelectPart?.(dw.id)}
                        className="cursor-pointer"
                      />
                    );
                  })}

                {centerChairPart && null}
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (model.slug === "perde-detayi") {
    const wLenX = widthX; // 2400 mm
    const wThickY = depthY; // 300 mm
    const wHeightZ = concreteHeightZ; // 3000 mm
    const yFrontVert = -102;
    const yBackVert = 102;

    const elevW = 540;
    const elevH = 340;
    const padX = 45;
    const drawW = elevW - padX * 2; // 450 px -> [-1200, +1200] mm
    const xMmToElevPx = (xMm: number) =>
      padX + ((xMm + wLenX / 2) / wLenX) * drawW;

    const padYTop = 26;
    const drawH = 278;
    const zMmToElevPy = (zMm: number) =>
      padYTop + ((totalHeightZ - zMm) / totalHeightZ) * drawH;

    const cutLinePy = zMmToElevPy(cutAnalysis.clampedElevationZMm);

    const secW = 520;
    const secH = 195;
    const secPadX = 36;
    const secDrawW = secW - secPadX * 2; // 448 px -> [-1200, +1200] mm
    const xMmToSecPx = (xMm: number) =>
      secPadX + ((xMm + wLenX / 2) / wLenX) * secDrawW;
    const yMmToSecPy = (yMm: number) => 98 - (yMm / wThickY) * 86;

    const webVertParts = longitudinalParts.filter((p) =>
      p.id.startsWith("wall-web-vert-"),
    );
    const webHorizParts = longitudinalParts.filter((p) =>
      p.id.startsWith("wall-web-horiz-"),
    );

    return (
      <div data-testid="simulation-2d-preview" className="space-y-4">
        {/* Perde Duvar Yatay Kesit Kontrol Barı */}
        <div
          data-testid="section-plane-controls"
          className="rounded-2xl border border-border/80 dark:border-purple-500/25 bg-card/90 dark:bg-[#0c0a1d]/90 p-3.5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="toggle-section-plane-btn"
                aria-pressed={section.enabled}
                onClick={() => onToggleSection?.(!section.enabled)}
                className={`min-h-[40px] inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${
                  section.enabled
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 shadow-sm"
                    : "border-border/80 dark:border-white/15 bg-muted/50 dark:bg-[#171330] text-foreground dark:text-zinc-200 hover:border-cyan-500/40"
                }`}
              >
                <Scissors className="h-3.5 w-3.5 text-cyan-400" />
                <span>
                  {section.enabled
                    ? "Yatay Kesit: Açık"
                    : "Yatay Kesit Düzlemini Aç"}
                </span>
              </button>
              <span
                data-testid="section-elevation-readout"
                className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 font-mono text-xs font-extrabold text-purple-700 dark:text-purple-200"
              >
                Kesit Kotu: Z = {cutAnalysis.clampedElevationZMm} mm
              </span>
            </div>

            <span
              data-testid="section-intersect-badge"
              data-stirrup-hit-count={cutAnalysis.intersectedStirrupParts.length}
              data-in-concrete={cutAnalysis.inConcreteBody ? "true" : "false"}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 font-mono text-[11px] font-bold text-cyan-700 dark:text-cyan-200"
            >
              Ön Yüz: Y={yFrontVert} mm · Arka Yüz: Y=+{yBackVert} mm (Çift Sıra)
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label
                htmlFor="section-elevation-slider"
                className="text-xs font-bold text-muted-foreground dark:text-zinc-300 shrink-0"
              >
                Düşey Kot (Z):
              </label>
              <input
                id="section-elevation-slider"
                data-testid="section-elevation-slider"
                type="range"
                min={0}
                max={totalHeightZ}
                step={10}
                value={cutAnalysis.clampedElevationZMm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!section.enabled) {
                    onToggleSection?.(true);
                  }
                  onChangeSectionElevation?.(val);
                }}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_WALL_CUT_ELEVATIONS.map((item) => {
                const active = cutAnalysis.clampedElevationZMm === item.zMm;
                return (
                  <button
                    key={item.zMm}
                    type="button"
                    data-testid={`quick-cut-z-${item.zMm}`}
                    onClick={() => {
                      if (!section.enabled) {
                        onToggleSection?.(true);
                      }
                      onChangeSectionElevation?.(item.zMm);
                    }}
                    className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] font-bold transition-all ${
                      active
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200"
                        : "border-border/70 dark:border-white/10 bg-muted/40 dark:bg-[#171330] text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sol: Perde Cephe Boykesiti (X-Z) + Sağ: İki Yüzlü Yatay Enkesit (X-Y) */}
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Sol: Perde Cephe Boykesiti */}
          <div className="rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0c0a1d]/90 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-foreground dark:text-white">
                  Perde Duvar Cephe Boykesiti (P1 · {wLenX}×{wThickY} mm)
                </h3>
                <p
                  data-testid="drawing-2d-dimensions-summary"
                  data-total-height-mm={totalHeightZ}
                  data-concrete-height-mm={wHeightZ}
                  data-dowel-length-mm={model.dimensionsMm.dowelLengthZ}
                  data-section-width-mm={wLenX}
                  data-front-face-y-mm={yFrontVert}
                  data-back-face-y-mm={yBackVert}
                  className="text-xs text-muted-foreground dark:text-zinc-400"
                >
                  Sol/Sağ uç bölgeleri: 450×300 mm · Orta gövde: 1500×300 mm · İki yüz ağ
                </p>
              </div>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                Örnek Eğitim Ölçüsü
              </span>
            </div>

            <svg
              viewBox={`0 0 ${elevW} ${elevH}`}
              className="w-full rounded-xl bg-muted/40 dark:bg-[#080714] border border-border/60 dark:border-white/10"
              role="img"
              aria-label="Betonarme perde duvar cephe boykesiti"
            >
              {isConcreteShown && (
                <rect
                  data-testid="svg-part-concrete-column-body"
                  x={xMmToElevPx(-1200)}
                  y={zMmToElevPy(wHeightZ)}
                  width={xMmToElevPx(1200) - xMmToElevPx(-1200)}
                  height={zMmToElevPy(0) - zMmToElevPy(wHeightZ)}
                  fill="#64748b"
                  fillOpacity={0.22}
                  stroke="#94a3b8"
                  strokeWidth={1.6}
                  onClick={() => onSelectPart?.("concrete-column-body")}
                  className="cursor-pointer"
                />
              )}

              {/* Sol ve Sağ Uç Bölgesi Sınır Çizgileri (X = ±750 mm) */}
              <line
                x1={xMmToElevPx(-750)}
                y1={zMmToElevPy(wHeightZ)}
                x2={xMmToElevPx(-750)}
                y2={zMmToElevPy(0)}
                stroke="#06b6d4"
                strokeDasharray="4 3"
                strokeOpacity={0.6}
              />
              <line
                x1={xMmToElevPx(750)}
                y1={zMmToElevPy(wHeightZ)}
                x2={xMmToElevPx(750)}
                y2={zMmToElevPy(0)}
                stroke="#22c55e"
                strokeDasharray="4 3"
                strokeOpacity={0.6}
              />

              {/* Sol ve Sağ Uç Bölgesi Kapalı Etriyeleri */}
              {layers.stirrup &&
                stirrupParts.map((st) => {
                  const zMm = st.elevationZMm ?? 0;
                  const isLeft = st.id.includes("-left-");
                  const x1 = xMmToElevPx(isLeft ? -1165 : 785);
                  const x2 = xMmToElevPx(isLeft ? -785 : 1165);
                  const isSel = selectedPartId === st.id;
                  return (
                    <rect
                      key={st.id}
                      data-testid={`svg-part-${st.id}`}
                      data-selected={isSel ? "true" : "false"}
                      x={x1}
                      y={zMmToElevPy(zMm) - (isSel ? 2.4 : 1.6)}
                      width={x2 - x1}
                      height={isSel ? 4.8 : 3.2}
                      rx={1}
                      fill={isSel ? "#f43f5e" : st.colorHex}
                      onClick={() => onSelectPart?.(st.id)}
                      className="cursor-pointer"
                    />
                  );
                })}

              {/* Yatay Gövde Donatıları (Ön yüz seçilebilir) */}
              {layers.longitudinal &&
                webHorizParts
                  .filter((p) => p.id.includes("-front-"))
                  .map((bar) => {
                    const zMm = bar.elevationZMm ?? 0;
                    const isSel = selectedPartId === bar.id;
                    return (
                      <rect
                        key={bar.id}
                        data-testid={`svg-part-${bar.id}`}
                        x={xMmToElevPx(-1164)}
                        y={zMmToElevPy(zMm) - 1.5}
                        width={xMmToElevPx(1164) - xMmToElevPx(-1164)}
                        height={3}
                        fill={isSel ? "#f43f5e" : "#94a3b8"}
                        fillOpacity={0.85}
                        onClick={() => onSelectPart?.(bar.id)}
                        className="cursor-pointer"
                      />
                    );
                  })}

              {/* Düşey Gövde Donatıları */}
              {layers.longitudinal &&
                webVertParts
                  .filter((p) => p.id.includes("-front-"))
                  .map((bar) => {
                    const seg = bar.segments[0];
                    const xMm = seg && seg.kind === "line" ? seg.start.x : 0;
                    const isSel = selectedPartId === bar.id;
                    return (
                      <rect
                        key={bar.id}
                        data-testid={`svg-part-${bar.id}`}
                        x={xMmToElevPx(xMm) - 1.8}
                        y={zMmToElevPy(totalHeightZ)}
                        width={3.6}
                        height={zMmToElevPy(0) - zMmToElevPy(totalHeightZ)}
                        fill={isSel ? "#f43f5e" : "#38bdf8"}
                        onClick={() => onSelectPart?.(bar.id)}
                        className="cursor-pointer"
                      />
                    );
                  })}

              {/* Uç Bölgesi Boyuna Donatıları */}
              {layers.dowel &&
                dowelParts
                  .filter((p) => p.id.includes("-front-"))
                  .map((bar) => {
                    const seg = bar.segments[0];
                    const xMm = seg && seg.kind === "line" ? seg.start.x : 0;
                    const isSel = selectedPartId === bar.id;
                    return (
                      <rect
                        key={bar.id}
                        data-testid={`svg-part-${bar.id}`}
                        x={xMmToElevPx(xMm) - 2.2}
                        y={zMmToElevPy(totalHeightZ)}
                        width={4.4}
                        height={zMmToElevPy(0) - zMmToElevPy(totalHeightZ)}
                        fill={isSel ? "#f43f5e" : "#f59e0b"}
                        onClick={() => onSelectPart?.(bar.id)}
                        className="cursor-pointer"
                      />
                    );
                  })}

              {/* Yatay Kesit Düzlemi Çizgisi */}
              <g data-testid="svg-section-plane-line">
                <line
                  x1={xMmToElevPx(-1230)}
                  y1={cutLinePy}
                  x2={xMmToElevPx(1230)}
                  y2={cutLinePy}
                  stroke="#22d3ee"
                  strokeWidth={section.enabled ? 2.4 : 1.5}
                  strokeDasharray="6 3"
                />
              </g>
            </svg>
          </div>

          {/* Sağ: İki Yüzlü Perde Yatay Enkesiti (Ön Yüz vs Arka Yüz + Sol/Sağ Uç Bölgeleri + Çirozlar) */}
          <div className="space-y-4">
            <div
              data-testid="actual-cut-section-card"
              className="rounded-2xl border border-cyan-500/35 bg-card/90 dark:bg-[#0c0a1d]/90 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-foreground dark:text-white">
                  İki Yüzlü Perde Yatay Enkesiti (Z = {cutAnalysis.clampedElevationZMm} mm)
                </h3>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-200">
                  Ön Yüz + Arka Yüz Ayrı
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-300">
                Perdede tek sıra donatı yoktur: altta Ön Yüz (Y=-102/-114 mm), üstte
                Arka Yüz (Y=+102/+114 mm) donatı sıraları, sol/sağ 450×300 mm uç
                bölgeleri ve iki yüzü bağlayan Ø10 çirozlar ayrı ayrı seçilebilir.
              </p>

              <svg
                viewBox={`0 0 ${secW} ${secH}`}
                data-testid="actual-cut-section-svg"
                className="mt-3 w-full rounded-xl bg-muted/40 dark:bg-[#080714] border border-border/60 dark:border-white/10"
                role="img"
                aria-label="İki yüzlü perde duvar yatay enkesiti"
              >
                {isConcreteShown && cutAnalysis.inConcreteBody && (
                  <rect
                    data-testid="actual-cut-concrete-rect"
                    x={xMmToSecPx(-1200)}
                    y={yMmToSecPy(150)}
                    width={xMmToSecPx(1200) - xMmToSecPx(-1200)}
                    height={yMmToSecPy(-150) - yMmToSecPy(150)}
                    rx={4}
                    fill="#64748b"
                    fillOpacity={0.25}
                    stroke="#94a3b8"
                    strokeWidth={1.8}
                    onClick={() => onSelectPart?.("concrete-column-body")}
                    className="cursor-pointer"
                  />
                )}

                {/* Ön Yüz ve Arka Yüz Etiketleri */}
                <text
                  x={secW / 2}
                  y={yMmToSecPy(150) - 10}
                  textAnchor="middle"
                  fill="#93c5fd"
                  fontSize={10}
                  fontFamily="monospace"
                  fontWeight={700}
                >
                  ARKA YÜZ DONATI AĞI (Y = +102 / +114 mm)
                </text>
                <text
                  x={secW / 2}
                  y={yMmToSecPy(-150) + 18}
                  textAnchor="middle"
                  fill="#38bdf8"
                  fontSize={10}
                  fontFamily="monospace"
                  fontWeight={700}
                >
                  ÖN YÜZ DONATI AĞI (Y = -102 / -114 mm)
                </text>

                {/* Sol ve Sağ Uç Bölgesi Kapalı Etriye Halkaları */}
                {cutAnalysis.intersectedStirrupParts.map((st) => {
                  const isLeft = st.id.includes("-left-");
                  const x1 = xMmToSecPx(isLeft ? -1165 : 785);
                  const x2 = xMmToSecPx(isLeft ? -785 : 1165);
                  const y1 = yMmToSecPy(115);
                  const y2 = yMmToSecPy(-115);
                  const isSel = selectedPartId === st.id;
                  return (
                    <rect
                      key={st.id}
                      data-testid="actual-cut-stirrup-ring"
                      data-part-id={st.id}
                      x={x1}
                      y={y1}
                      width={x2 - x1}
                      height={y2 - y1}
                      rx={4}
                      fill="none"
                      stroke={isSel ? "#f43f5e" : st.colorHex}
                      strokeWidth={isSel ? 3.8 : 2.8}
                      onClick={() => onSelectPart?.(st.id)}
                      className="cursor-pointer"
                    />
                  );
                })}

                {/* Ön ve Arka Yüzleri Bağlayan Çirozlar */}
                {layers.crosstie &&
                  crosstieParts
                    .filter((ct) => ct.elevationZMm === 1500)
                    .map((ct) => {
                      const seg = ct.segments.find(
                        (s) => s.kind === "line" && s.role === "leg",
                      );
                      const xMm = seg && seg.kind === "line" ? seg.start.x : 0;
                      const px = xMmToSecPx(xMm);
                      const isSel = selectedPartId === ct.id;
                      return (
                        <rect
                          key={ct.id}
                          data-testid={`sec-part-${ct.id}`}
                          x={px - (isSel ? 3 : 2)}
                          y={yMmToSecPy(114)}
                          width={isSel ? 6 : 4}
                          height={yMmToSecPy(-114) - yMmToSecPy(114)}
                          rx={1.5}
                          fill={isSel ? "#f43f5e" : "#ec4899"}
                          onClick={() => onSelectPart?.(ct.id)}
                          className="cursor-pointer"
                        />
                      );
                    })}

                {/* Ön Yüz ve Arka Yüz Gövde Düşey Çubukları (10 adet) */}
                {layers.longitudinal &&
                  webVertParts.map((bar) => {
                    const seg = bar.segments[0];
                    if (!seg || seg.kind !== "line") return null;
                    const cx = xMmToSecPx(seg.start.x);
                    const cy = yMmToSecPy(seg.start.y);
                    const isSel = selectedPartId === bar.id;
                    return (
                      <circle
                        key={bar.id}
                        data-testid={`sec-part-${bar.id}`}
                        cx={cx}
                        cy={cy}
                        r={isSel ? 6.5 : 5}
                        fill={isSel ? "#f43f5e" : bar.colorHex}
                        stroke="#0f172a"
                        strokeWidth={1.2}
                        onClick={() => onSelectPart?.(bar.id)}
                        className="cursor-pointer"
                      />
                    );
                  })}

                {/* Sol ve Sağ Uç Bölgesi Boyuna Donatıları (6Ø20 + 6Ø20 = 12 adet) */}
                {layers.dowel &&
                  dowelParts.map((bar) => {
                    const seg = bar.segments[0];
                    if (!seg || seg.kind !== "line") return null;
                    const cx = xMmToSecPx(seg.start.x);
                    const cy = yMmToSecPy(seg.start.y);
                    const isSel = selectedPartId === bar.id;
                    return (
                      <circle
                        key={bar.id}
                        data-testid={`sec-part-${bar.id}`}
                        cx={cx}
                        cy={cy}
                        r={isSel ? 7.2 : 5.8}
                        fill={isSel ? "#f43f5e" : "#f59e0b"}
                        stroke="#0f172a"
                        strokeWidth={1.3}
                        onClick={() => onSelectPart?.(bar.id)}
                        className="cursor-pointer"
                      />
                    );
                  })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (model.slug === "tekil-temel") {
    const fWidthX = widthX; // 1800 mm
    const fDepthY = depthY; // 1800 mm
    const fHeightZ = 500;
    const zMeshX = model.dimensionsMm.stirrupAxisOffsetFromFaceMm; // 58 mm
    const zMeshY = model.dimensionsMm.cornerBarCenterOffsetFromFaceMm; // 74 mm
    const zDowelFoot = 92;

    const elevSvgW = 520;
    const elevSvgH = 340;
    const padX = 50;
    const drawW = elevSvgW - padX * 2; // 420 px -> [-1000, +1000] mm
    const xMmToElevPx = (xMm: number) => padX + ((xMm + 1000) / 2000) * drawW;

    const zTopAllowance = 1400;
    const zMinAllowance = -140;
    const padYTop = 28;
    const drawH = 265;
    const zMmToElevPy = (zMm: number) =>
      padYTop +
      ((zTopAllowance - zMm) / (zTopAllowance - zMinAllowance)) * drawH;

    const cutLinePy = zMmToElevPy(cutAnalysis.clampedElevationZMm);

    const planSvgSize = 260;
    const planPad = 28;
    const planDraw = planSvgSize - planPad * 2; // 204 px -> [-900, +900] mm
    const mmToPlanPx = (coordMm: number) =>
      planPad + ((coordMm + fWidthX / 2) / fWidthX) * planDraw;

    return (
      <div data-testid="simulation-2d-preview" className="space-y-4">
        {/* Tekil Temel Kesit Düzlemi Kontrol Barı */}
        <div
          data-testid="section-plane-controls"
          className="rounded-2xl border border-border/80 dark:border-purple-500/25 bg-card/90 dark:bg-[#0c0a1d]/90 p-3.5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="toggle-section-plane-btn"
                aria-pressed={section.enabled}
                onClick={() => onToggleSection?.(!section.enabled)}
                className={`min-h-[40px] inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${
                  section.enabled
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 shadow-sm"
                    : "border-border/80 dark:border-white/15 bg-muted/50 dark:bg-[#171330] text-foreground dark:text-zinc-200 hover:border-cyan-500/40"
                }`}
              >
                <Scissors className="h-3.5 w-3.5 text-cyan-400" />
                <span>
                  {section.enabled
                    ? "Yatay Kesit: Açık"
                    : "Yatay Kesit Düzlemini Aç"}
                </span>
              </button>
              <span
                data-testid="section-elevation-readout"
                className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 font-mono text-xs font-extrabold text-purple-700 dark:text-purple-200"
              >
                Kesit Kotu: Z = {cutAnalysis.clampedElevationZMm} mm
              </span>
            </div>

            <span
              data-testid="section-intersect-badge"
              data-stirrup-hit-count={cutAnalysis.intersectedStirrupParts.length}
              data-in-concrete={cutAnalysis.inConcreteBody ? "true" : "false"}
              className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3 py-1 font-mono text-[11px] font-bold text-cyan-700 dark:text-cyan-200"
            >
              Alt X: Z={zMeshX} mm · Alt Y: Z={zMeshY} mm (ΔZ=16 mm)
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label
                htmlFor="section-elevation-slider"
                className="text-xs font-bold text-muted-foreground dark:text-zinc-300 shrink-0"
              >
                Düşey Kot (Z):
              </label>
              <input
                id="section-elevation-slider"
                data-testid="section-elevation-slider"
                type="range"
                min={-100}
                max={totalHeightZ}
                step={2}
                value={cutAnalysis.clampedElevationZMm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!section.enabled) {
                    onToggleSection?.(true);
                  }
                  onChangeSectionElevation?.(val);
                }}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_FOOTING_CUT_ELEVATIONS.map((item) => {
                const active = cutAnalysis.clampedElevationZMm === item.zMm;
                return (
                  <button
                    key={item.zMm}
                    type="button"
                    data-testid={`quick-cut-z-${item.zMm}`}
                    onClick={() => {
                      if (!section.enabled) {
                        onToggleSection?.(true);
                      }
                      onChangeSectionElevation?.(item.zMm);
                    }}
                    className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] font-bold transition-all ${
                      active
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200"
                        : "border-border/70 dark:border-white/10 bg-muted/40 dark:bg-[#171330] text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sol: Tekil Temel Düşey Kesiti (X-Z) + Sağ: Temel Planı (X-Y) ve Bu Kottaki Kesit */}
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Sol: Düşey Kesit (X-Z) */}
          <div className="rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0c0a1d]/90 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-foreground dark:text-white">
                  Tekil Temel Düşey Kesiti (T1 · {fWidthX}×{fDepthY}×{fHeightZ} mm)
                </h3>
                <p
                  data-testid="drawing-2d-dimensions-summary"
                  data-total-height-mm={totalHeightZ}
                  data-concrete-height-mm={concreteHeightZ}
                  data-dowel-length-mm={model.dimensionsMm.dowelLengthZ}
                  data-section-width-mm={fWidthX}
                  data-mesh-x-z-mm={zMeshX}
                  data-mesh-y-z-mm={zMeshY}
                  className="text-xs text-muted-foreground dark:text-zinc-400"
                >
                  Alt X: Z={zMeshX} mm · Alt Y: Z={zMeshY} mm · Filiz ayağı: Z=
                  {zDowelFoot} mm · Pas payı: c={clearCover} mm
                </p>
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-purple-300">
                Plan ↔ Kesit Eşlemeli
              </span>
            </div>

            <svg
              viewBox={`0 0 ${elevSvgW} ${elevSvgH}`}
              data-testid="footing-vertical-section-svg"
              className="w-full rounded-xl bg-muted/40 dark:bg-[#080714] border border-border/60 dark:border-white/10"
              role="img"
              aria-label="Betonarme tekil temel düşey kesit şeması"
            >
              {/* Grobeton + Tekil Temel Gövdesi + Kolon Boynu + Paspayı Takozları */}
              {isConcreteShown && (
                <>
                  {/* Temsilî Grobeton (Z = -100..0 mm) */}
                  <rect
                    data-testid="svg-part-concrete-lean-layer"
                    data-selected={
                      selectedPartId === "concrete-lean-layer" ? "true" : "false"
                    }
                    x={xMmToElevPx(-1000)}
                    y={zMmToElevPy(0)}
                    width={xMmToElevPx(1000) - xMmToElevPx(-1000)}
                    height={Math.max(zMmToElevPy(-100) - zMmToElevPy(0), 12)}
                    fill={
                      selectedPartId === "concrete-lean-layer"
                        ? "#f43f5e"
                        : "#475569"
                    }
                    fillOpacity={0.32}
                    stroke="#94a3b8"
                    strokeDasharray="4 2"
                    strokeWidth={1.3}
                    onClick={() => onSelectPart?.("concrete-lean-layer")}
                    className="cursor-pointer"
                  />
                  {/* Tekil Temel Plağı (Z = 0..500 mm) */}
                  <rect
                    data-testid="svg-part-concrete-footing-body"
                    data-selected={
                      selectedPartId === "concrete-footing-body" ? "true" : "false"
                    }
                    x={xMmToElevPx(-900)}
                    y={zMmToElevPy(500)}
                    width={xMmToElevPx(900) - xMmToElevPx(-900)}
                    height={zMmToElevPy(0) - zMmToElevPy(500)}
                    fill={
                      selectedPartId === "concrete-footing-body"
                        ? "#f43f5e"
                        : "#64748b"
                    }
                    fillOpacity={0.22}
                    stroke={
                      selectedPartId === "concrete-footing-body"
                        ? "#f43f5e"
                        : "#94a3b8"
                    }
                    strokeWidth={1.8}
                    onClick={() => onSelectPart?.("concrete-footing-body")}
                    className="cursor-pointer"
                  />
                  {/* Kolon Boyun Gövdesi (Z = 500..1200 mm) */}
                  <rect
                    data-testid="svg-part-concrete-column-body"
                    data-selected={
                      selectedPartId === "concrete-column-body" ? "true" : "false"
                    }
                    x={xMmToElevPx(-200)}
                    y={zMmToElevPy(1200)}
                    width={xMmToElevPx(200) - xMmToElevPx(-200)}
                    height={zMmToElevPy(500) - zMmToElevPy(1200)}
                    fill={
                      selectedPartId === "concrete-column-body"
                        ? "#f43f5e"
                        : "#64748b"
                    }
                    fillOpacity={0.22}
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    onClick={() => onSelectPart?.("concrete-column-body")}
                    className="cursor-pointer"
                  />
                  {/* Sol ve Sağ Paspayı Takozları (Z = 0..50 mm, X = ±560 mm) */}
                  <rect
                    data-testid="svg-part-concrete-spacer-1-sw"
                    x={xMmToElevPx(-605)}
                    y={zMmToElevPy(50)}
                    width={Math.max(xMmToElevPx(-515) - xMmToElevPx(-605), 12)}
                    height={Math.max(zMmToElevPy(0) - zMmToElevPy(50), 8)}
                    rx={2}
                    fill={
                      selectedPartId === "concrete-spacer-1-sw"
                        ? "#f43f5e"
                        : "#cbd5e1"
                    }
                    fillOpacity={0.65}
                    onClick={() => onSelectPart?.("concrete-spacer-1-sw")}
                    className="cursor-pointer"
                  />
                  <rect
                    data-testid="svg-part-concrete-spacer-2-se"
                    x={xMmToElevPx(515)}
                    y={zMmToElevPy(50)}
                    width={Math.max(xMmToElevPx(605) - xMmToElevPx(515), 12)}
                    height={Math.max(zMmToElevPy(0) - zMmToElevPy(50), 8)}
                    rx={2}
                    fill={
                      selectedPartId === "concrete-spacer-2-se"
                        ? "#f43f5e"
                        : "#cbd5e1"
                    }
                    fillOpacity={0.65}
                    onClick={() => onSelectPart?.("concrete-spacer-2-se")}
                    className="cursor-pointer"
                  />
                </>
              )}

              {/* Alt X Doğrultusu Izgara Çubuğu (Z = 58 mm — kesitte yatay mavi çubuk) */}
              {layers.longitudinal && (
                <rect
                  data-testid="svg-part-footing-mesh-x-5"
                  data-selected={
                    selectedPartId === "footing-mesh-x-5" ? "true" : "false"
                  }
                  x={xMmToElevPx(-850)}
                  y={zMmToElevPy(zMeshX) - 2.4}
                  width={xMmToElevPx(850) - xMmToElevPx(-850)}
                  height={4.8}
                  rx={1.5}
                  fill={
                    selectedPartId === "footing-mesh-x-5" ? "#f43f5e" : "#38bdf8"
                  }
                  onClick={() => onSelectPart?.("footing-mesh-x-5")}
                  className="cursor-pointer"
                />
              )}

              {/* Alt Y Doğrultusu Izgara Çubukları (Z = 74 mm — kesitte 9 adet pembe daire) */}
              {layers.crosstie &&
                crosstieParts.map((bar) => {
                  const seg = bar.segments.find(
                    (s) => s.kind === "line" && s.role === "leg",
                  );
                  const xMm = seg && seg.kind === "line" ? seg.start.x : 0;
                  const isSel = selectedPartId === bar.id;
                  return (
                    <circle
                      key={bar.id}
                      data-testid={`svg-part-${bar.id}`}
                      data-selected={isSel ? "true" : "false"}
                      cx={xMmToElevPx(xMm)}
                      cy={zMmToElevPy(zMeshY)}
                      r={isSel ? 5.2 : 3.8}
                      fill={isSel ? "#f43f5e" : "#ec4899"}
                      stroke="#0f172a"
                      strokeWidth={1}
                      onClick={() => onSelectPart?.(bar.id)}
                      className="cursor-pointer"
                    />
                  );
                })}

              {/* Kolon Filizleri & 90° Yaylı Yatay Ayakları (Z = 92..1350 mm) */}
              {layers.dowel && (
                <>
                  {/* Sol Filiz (footing-dowel-bar-1-sw): Düşey gövde + Yatay ayak */}
                  <rect
                    data-testid="svg-part-footing-dowel-bar-1-sw"
                    data-selected={
                      selectedPartId === "footing-dowel-bar-1-sw" ? "true" : "false"
                    }
                    x={xMmToElevPx(-145) - 2.5}
                    y={zMmToElevPy(1350)}
                    width={5}
                    height={zMmToElevPy(zDowelFoot) - zMmToElevPy(1350)}
                    rx={1.5}
                    fill={
                      selectedPartId === "footing-dowel-bar-1-sw"
                        ? "#f43f5e"
                        : "#f59e0b"
                    }
                    onClick={() => onSelectPart?.("footing-dowel-bar-1-sw")}
                    className="cursor-pointer"
                  />
                  <rect
                    x={xMmToElevPx(-505)}
                    y={zMmToElevPy(zDowelFoot) - 2.4}
                    width={xMmToElevPx(-145) - xMmToElevPx(-505)}
                    height={4.8}
                    rx={1.5}
                    fill={
                      selectedPartId === "footing-dowel-bar-1-sw"
                        ? "#f43f5e"
                        : "#f59e0b"
                    }
                    onClick={() => onSelectPart?.("footing-dowel-bar-1-sw")}
                    className="cursor-pointer"
                  />
                  {/* Sağ Filiz (footing-dowel-bar-2-se): Düşey gövde + Yatay ayak */}
                  <rect
                    data-testid="svg-part-footing-dowel-bar-2-se"
                    data-selected={
                      selectedPartId === "footing-dowel-bar-2-se" ? "true" : "false"
                    }
                    x={xMmToElevPx(145) - 2.5}
                    y={zMmToElevPy(1350)}
                    width={5}
                    height={zMmToElevPy(zDowelFoot) - zMmToElevPy(1350)}
                    rx={1.5}
                    fill={
                      selectedPartId === "footing-dowel-bar-2-se"
                        ? "#f43f5e"
                        : "#f59e0b"
                    }
                    onClick={() => onSelectPart?.("footing-dowel-bar-2-se")}
                    className="cursor-pointer"
                  />
                  <rect
                    x={xMmToElevPx(145)}
                    y={zMmToElevPy(zDowelFoot) - 2.4}
                    width={xMmToElevPx(505) - xMmToElevPx(145)}
                    height={4.8}
                    rx={1.5}
                    fill={
                      selectedPartId === "footing-dowel-bar-2-se"
                        ? "#f43f5e"
                        : "#f59e0b"
                    }
                    onClick={() => onSelectPart?.("footing-dowel-bar-2-se")}
                    className="cursor-pointer"
                  />
                </>
              )}

              {/* Filiz Kılavuz ve Boyun Etriyeleri */}
              {layers.stirrup &&
                stirrupParts.map((st) => {
                  const zMm = st.elevationZMm ?? 0;
                  const isSel = selectedPartId === st.id;
                  return (
                    <rect
                      key={st.id}
                      data-testid={`svg-part-${st.id}`}
                      data-selected={isSel ? "true" : "false"}
                      x={xMmToElevPx(-165)}
                      y={zMmToElevPy(zMm) - (isSel ? 2.5 : 1.7)}
                      width={xMmToElevPx(165) - xMmToElevPx(-165)}
                      height={isSel ? 5 : 3.4}
                      rx={1.2}
                      fill={isSel ? "#f43f5e" : st.colorHex}
                      onClick={() => onSelectPart?.(st.id)}
                      className="cursor-pointer"
                    />
                  );
                })}

              {/* Kesit Düzlemi A–A Çizgisi */}
              <g data-testid="svg-section-plane-line">
                <line
                  x1={xMmToElevPx(-960)}
                  y1={cutLinePy}
                  x2={xMmToElevPx(960)}
                  y2={cutLinePy}
                  stroke="#22d3ee"
                  strokeWidth={section.enabled ? 2.4 : 1.5}
                  strokeDasharray="6 3"
                />
                <text
                  x={xMmToElevPx(960)}
                  y={cutLinePy - 5}
                  textAnchor="end"
                  fill="#22d3ee"
                  fontSize={9.5}
                  fontFamily="monospace"
                  fontWeight={700}
                >
                  A–A: Z={cutAnalysis.clampedElevationZMm} mm
                </text>
              </g>
            </svg>
          </div>

          {/* Sağ: Temel Plan Görünümü (X-Y Izgara & Filiz Koordinatları) + Bu Kottaki Kesit Özeti */}
          <div className="space-y-4">
            <div
              data-testid="footing-plan-card"
              className="rounded-2xl border border-cyan-500/35 bg-card/90 dark:bg-[#0c0a1d]/90 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-foreground dark:text-white">
                  Temel Plan Görünümü ({fWidthX}×{fDepthY} mm)
                </h3>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-200">
                  9Ø16 (X) + 9Ø16 (Y)
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-300">
                Plandaki X/Y ızgara eksenleri (-800..+800 mm, s=200 mm) ve kolon
                filiz koordinatları (±145 mm) düşey kesitle birebir aynı modelden
                üretilir.
              </p>

              <svg
                viewBox={`0 0 ${planSvgSize} ${planSvgSize}`}
                data-testid="actual-cut-section-svg"
                className="mt-3 w-full max-w-[225px] mx-auto rounded-xl bg-muted/40 dark:bg-[#080714] border border-border/60 dark:border-white/10"
                role="img"
                aria-label="Tekil temel planı ve ızgara şeması"
              >
                {isConcreteShown && (
                  <rect
                    data-testid="actual-cut-concrete-rect"
                    x={mmToPlanPx(-900)}
                    y={mmToPlanPx(-900)}
                    width={mmToPlanPx(900) - mmToPlanPx(-900)}
                    height={mmToPlanPx(900) - mmToPlanPx(-900)}
                    rx={4}
                    fill="#64748b"
                    fillOpacity={0.22}
                    stroke="#94a3b8"
                    strokeWidth={1.8}
                    onClick={() => onSelectPart?.("concrete-footing-body")}
                    className="cursor-pointer"
                  />
                )}

                {/* Alt X Doğrultusu Izgara Çubukları (Mavi Yatay Çizgiler) */}
                {layers.longitudinal &&
                  longitudinalParts.map((bar) => {
                    const seg = bar.segments.find(
                      (s) => s.kind === "line" && s.role === "leg",
                    );
                    const yMm = seg && seg.kind === "line" ? seg.start.y : 0;
                    const py = mmToPlanPx(-yMm);
                    const isSel = selectedPartId === bar.id;
                    return (
                      <rect
                        key={bar.id}
                        data-testid={`plan-part-${bar.id}`}
                        x={mmToPlanPx(-850)}
                        y={py - (isSel ? 2.2 : 1.2)}
                        width={mmToPlanPx(850) - mmToPlanPx(-850)}
                        height={isSel ? 4.4 : 2.4}
                        fill={isSel ? "#f43f5e" : "#38bdf8"}
                        onClick={() => onSelectPart?.(bar.id)}
                        className="cursor-pointer"
                      />
                    );
                  })}

                {/* Alt Y Doğrultusu Izgara Çubukları (Pembe Düşey Çizgiler) */}
                {layers.crosstie &&
                  crosstieParts.map((bar) => {
                    const seg = bar.segments.find(
                      (s) => s.kind === "line" && s.role === "leg",
                    );
                    const xMm = seg && seg.kind === "line" ? seg.start.x : 0;
                    const px = mmToPlanPx(xMm);
                    const isSel = selectedPartId === bar.id;
                    return (
                      <rect
                        key={bar.id}
                        data-testid={`plan-part-${bar.id}`}
                        x={px - (isSel ? 2.2 : 1.2)}
                        y={mmToPlanPx(-850)}
                        width={isSel ? 4.4 : 2.4}
                        height={mmToPlanPx(850) - mmToPlanPx(-850)}
                        fill={isSel ? "#f43f5e" : "#ec4899"}
                        onClick={() => onSelectPart?.(bar.id)}
                        className="cursor-pointer"
                      />
                    );
                  })}

                {/* Kolon Çevresi ve Kesişen Etriye Halkası */}
                {cutAnalysis.intersectedStirrupParts.map((st) => (
                  <rect
                    key={st.id}
                    data-testid="actual-cut-stirrup-ring"
                    data-part-id={st.id}
                    x={mmToPlanPx(-165)}
                    y={mmToPlanPx(-165)}
                    width={mmToPlanPx(165) - mmToPlanPx(-165)}
                    height={mmToPlanPx(165) - mmToPlanPx(-165)}
                    rx={3}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    onClick={() => onSelectPart?.(st.id)}
                    className="cursor-pointer"
                  />
                ))}

                {/* 8Ø20 Kolon Filizleri Planda */}
                {layers.dowel &&
                  dowelParts.map((bar) => {
                    const vertSeg = bar.segments.find(
                      (s) => s.kind === "line" && s.role === "leg",
                    );
                    if (!vertSeg || vertSeg.kind !== "line") return null;
                    const cx = mmToPlanPx(vertSeg.start.x);
                    const cy = mmToPlanPx(-vertSeg.start.y);
                    const isSel = selectedPartId === bar.id;
                    return (
                      <circle
                        key={bar.id}
                        data-testid={`actual-cut-dowel-${bar.id}`}
                        cx={cx}
                        cy={cy}
                        r={isSel ? 5.5 : 4.2}
                        fill={isSel ? "#f43f5e" : "#f59e0b"}
                        stroke="#0f172a"
                        strokeWidth={1.2}
                        onClick={() => onSelectPart?.(bar.id)}
                        className="cursor-pointer"
                      />
                    );
                  })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isBeam) {
    const spanMm = concreteHeightZ; // 4000 mm
    const supMm = model.dimensionsMm.dowelLengthZ / 2; // 400 mm
    const beamB = widthX; // 300 mm
    const beamH = depthY; // 500 mm
    const totalXSpan = spanMm + supMm * 2; // 4800 mm

    const bSvgW = 640;
    const bSvgH = 290;
    const padX = 36;
    const drawW = bSvgW - padX * 2;
    const xToSvgX = (xMm: number) =>
      padX + ((xMm + supMm) / totalXSpan) * drawW;

    const beamTopY = 72;
    const beamDrawH = 120;
    const beamBotY = beamTopY + beamDrawH;
    const zToBeamSvgY = (zMm: number) =>
      beamBotY - (zMm / beamH) * beamDrawH;

    const leftSupX = xToSvgX(-supMm);
    const spanStartSvgX = xToSvgX(0);
    const spanEndSvgX = xToSvgX(spanMm);
    const rightSupX = xToSvgX(spanMm + supMm);
    const cutLineSvgX = xToSvgX(cutAnalysis.clampedElevationZMm);

    const botBarId = longitudinalParts[0]?.id ?? "beam-bottom-bar-1";
    const topBarId =
      longitudinalParts.find((p) => p.id.includes("top-hanger"))?.id ??
      "beam-top-hanger-bar-1";
    const leftExtraId = dowelParts[0]?.id ?? "beam-support-extra-left";
    const rightExtraId = dowelParts[1]?.id ?? "beam-support-extra-right";

    const botBarY = zToBeamSvgY(48);
    const topBarY = zToBeamSvgY(beamH - 48);

    return (
      <div data-testid="simulation-2d-preview" className="space-y-4">
        {/* Kiriş Düşey Kesit (X) Kontrol Barı */}
        <div
          data-testid="section-plane-controls"
          className="rounded-2xl border border-border/80 dark:border-purple-500/25 bg-card/90 dark:bg-[#0c0a1d]/90 p-3.5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="toggle-section-plane-btn"
                aria-pressed={section.enabled}
                onClick={() => onToggleSection?.(!section.enabled)}
                className={`min-h-[40px] inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${
                  section.enabled
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 shadow-sm"
                    : "border-border/80 dark:border-white/15 bg-muted/50 dark:bg-[#171330] text-foreground dark:text-zinc-200 hover:border-cyan-500/40"
                }`}
              >
                <Scissors className="h-3.5 w-3.5 text-cyan-400" />
                <span>
                  {section.enabled
                    ? "Düşey Kesit (X): Açık"
                    : "Düşey Kesit Düzlemini Aç"}
                </span>
              </button>
              <span
                data-testid="section-elevation-readout"
                className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 font-mono text-xs font-extrabold text-purple-700 dark:text-purple-200"
              >
                Kesit Konumu: X = {cutAnalysis.clampedElevationZMm} mm
              </span>
            </div>

            <span
              data-testid="section-intersect-badge"
              data-stirrup-hit-count={cutAnalysis.intersectedStirrupParts.length}
              data-in-concrete={cutAnalysis.inConcreteBody ? "true" : "false"}
              className={`rounded-xl border px-3 py-1 font-mono text-[11px] font-bold ${
                cutAnalysis.intersectedStirrupParts.length > 0
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : cutAnalysis.inConcreteBody
                    ? "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    : "border-purple-500/40 bg-purple-500/15 text-purple-700 dark:text-purple-300"
              }`}
            >
              {cutAnalysis.intersectedStirrupParts.length > 0
                ? `Etriye Kesiliyor (${cutAnalysis.intersectedStirrupParts[0].id})`
                : cutAnalysis.inConcreteBody
                  ? "Etriye Arası Açıklık / Mesnet Boşluğu"
                  : "Uç Mesnet ve Ankraj Bölgesi"}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label
                htmlFor="section-elevation-slider"
                className="text-xs font-bold text-muted-foreground dark:text-zinc-300 shrink-0"
              >
                Açıklık Konumu (X):
              </label>
              <input
                id="section-elevation-slider"
                data-testid="section-elevation-slider"
                type="range"
                min={-supMm}
                max={spanMm + supMm}
                step={10}
                value={cutAnalysis.clampedElevationZMm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!section.enabled) {
                    onToggleSection?.(true);
                  }
                  onChangeSectionElevation?.(val);
                }}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_BEAM_CUT_POSITIONS.map((item) => {
                const active = cutAnalysis.clampedElevationZMm === item.zMm;
                return (
                  <button
                    key={item.zMm}
                    type="button"
                    data-testid={`quick-cut-z-${item.zMm}`}
                    onClick={() => {
                      if (!section.enabled) {
                        onToggleSection?.(true);
                      }
                      onChangeSectionElevation?.(item.zMm);
                    }}
                    className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] font-bold transition-all ${
                      active
                        ? "border-cyan-400 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200"
                        : "border-border/70 dark:border-white/10 bg-muted/40 dark:bg-[#171330] text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kiriş Boykesit + İki Enkesit (Bu Konumdaki Kesit vs Temsilî Enkesit) */}
        <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Sol: Kiriş Boykesit Teknik Çizimi */}
          <div className="rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0c0a1d]/90 p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-foreground dark:text-white">
                  Kiriş Boykesit Teknik Çizimi (K1 · 300×500 mm)
                </h3>
                <p
                  data-testid="drawing-2d-dimensions-summary"
                  data-total-height-mm={spanMm}
                  data-concrete-height-mm={spanMm}
                  data-dowel-length-mm={model.dimensionsMm.dowelLengthZ}
                  data-section-width-mm={beamB}
                  className="text-xs text-muted-foreground dark:text-zinc-400"
                >
                  Net açıklık: {spanMm} mm · Mesnet sarılma: 2×1000 mm · Kesit:{" "}
                  {beamB}×{beamH} mm
                </p>
              </div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-purple-300">
                2B ↔ 3B Eşlemeli
              </span>
            </div>

            <svg
              viewBox={`0 0 ${bSvgW} ${bSvgH}`}
              className="w-full rounded-xl bg-muted/40 dark:bg-[#080714] border border-border/60 dark:border-white/10"
              role="img"
              aria-label="Betonarme kiriş boykesit donatı şeması"
            >
              {/* Bölge bantları (Sol Sarılma / Orta Açıklık / Sağ Sarılma) */}
              {layers.dimensions &&
                model.zones.map((zone) => {
                  const x1 = xToSvgX(zone.zStartMm);
                  const x2 = xToSvgX(zone.zEndMm);
                  return (
                    <g
                      key={zone.id}
                      data-testid={`svg-zone-band-${zone.id}`}
                      data-zone-length-mm={zone.lengthMm}
                      data-zone-spacing-mm={zone.spacingMm}
                      data-zone-stirrup-count={zone.stirrupCount}
                    >
                      <rect
                        x={x1}
                        y={22}
                        width={Math.max(x2 - x1, 8)}
                        height={36}
                        rx={4}
                        fill={zone.colorHex}
                        fillOpacity={0.14}
                        stroke={zone.colorHex}
                        strokeOpacity={0.5}
                      />
                      <text
                        x={(x1 + x2) / 2}
                        y={36}
                        textAnchor="middle"
                        className="fill-current text-foreground dark:text-zinc-100"
                        fontSize={9.5}
                        fontWeight={700}
                      >
                        {zone.label}
                      </text>
                      <text
                        x={(x1 + x2) / 2}
                        y={50}
                        textAnchor="middle"
                        className="fill-current text-muted-foreground dark:text-zinc-300"
                        fontSize={8.5}
                        fontFamily="monospace"
                      >
                        {zone.lengthMm} mm · Ø10/{zone.spacingMm} ({zone.stirrupCount} ad.)
                      </text>
                    </g>
                  );
                })}

              {/* Uç mesnet temsilleri ve kiriş beton gövdesi */}
              {isConcreteShown && (
                <>
                  <rect
                    data-testid="svg-part-concrete-support-left"
                    data-selected={
                      selectedPartId === "concrete-support-left" ? "true" : "false"
                    }
                    x={leftSupX}
                    y={beamTopY - 26}
                    width={spanStartSvgX - leftSupX}
                    height={beamDrawH + 52}
                    fill={
                      selectedPartId === "concrete-support-left"
                        ? "#f43f5e"
                        : "#475569"
                    }
                    fillOpacity={0.28}
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    onClick={() => onSelectPart?.("concrete-support-left")}
                    className="cursor-pointer"
                  />
                  <rect
                    data-testid="svg-part-concrete-support-right"
                    data-selected={
                      selectedPartId === "concrete-support-right" ? "true" : "false"
                    }
                    x={spanEndSvgX}
                    y={beamTopY - 26}
                    width={rightSupX - spanEndSvgX}
                    height={beamDrawH + 52}
                    fill={
                      selectedPartId === "concrete-support-right"
                        ? "#f43f5e"
                        : "#475569"
                    }
                    fillOpacity={0.28}
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    onClick={() => onSelectPart?.("concrete-support-right")}
                    className="cursor-pointer"
                  />
                  <rect
                    data-testid="svg-part-concrete-beam-body"
                    data-selected={
                      selectedPartId === "concrete-beam-body" ? "true" : "false"
                    }
                    x={spanStartSvgX}
                    y={beamTopY}
                    width={spanEndSvgX - spanStartSvgX}
                    height={beamDrawH}
                    fill={
                      selectedPartId === "concrete-beam-body"
                        ? "#f43f5e"
                        : "#64748b"
                    }
                    fillOpacity={0.22}
                    stroke={
                      selectedPartId === "concrete-beam-body"
                        ? "#f43f5e"
                        : "#94a3b8"
                    }
                    strokeWidth={
                      selectedPartId === "concrete-beam-body" ? 2.4 : 1.5
                    }
                    onClick={() => onSelectPart?.("concrete-beam-body")}
                    className="cursor-pointer"
                  />
                </>
              )}

              {/* Kiriş etriyeleri (düşey çubuklar) */}
              {layers.stirrup &&
                stirrupParts.map((part) => {
                  const xMm = part.elevationZMm ?? 0;
                  const sx = xToSvgX(xMm);
                  const isSel = selectedPartId === part.id;
                  const barW = isSel ? 5 : 3;
                  return (
                    <rect
                      key={part.id}
                      data-testid={`svg-part-${part.id}`}
                      data-selected={isSel ? "true" : "false"}
                      x={sx - barW / 2}
                      y={beamTopY + 8}
                      width={barW}
                      height={beamDrawH - 16}
                      rx={1.2}
                      fill={isSel ? "#f43f5e" : part.colorHex}
                      onClick={() => onSelectPart?.(part.id)}
                      className="cursor-pointer"
                    />
                  );
                })}

              {/* Alt ve Üst Boyuna Donatılar */}
              {layers.longitudinal && (
                <>
                  <rect
                    data-testid={`svg-part-${botBarId}`}
                    data-selected={selectedPartId === botBarId ? "true" : "false"}
                    x={xToSvgX(-260)}
                    y={botBarY - 2.2}
                    width={xToSvgX(spanMm + 260) - xToSvgX(-260)}
                    height={4.4}
                    rx={1.5}
                    fill={selectedPartId === botBarId ? "#f43f5e" : "#38bdf8"}
                    onClick={() => onSelectPart?.(botBarId)}
                    className="cursor-pointer"
                  />
                  <rect
                    data-testid={`svg-part-${topBarId}`}
                    data-selected={selectedPartId === topBarId ? "true" : "false"}
                    x={xToSvgX(-260)}
                    y={topBarY - 2}
                    width={xToSvgX(spanMm + 260) - xToSvgX(-260)}
                    height={4}
                    rx={1.5}
                    fill={selectedPartId === topBarId ? "#f43f5e" : "#94a3b8"}
                    onClick={() => onSelectPart?.(topBarId)}
                    className="cursor-pointer"
                  />
                </>
              )}

              {/* Sol ve Sağ Mesnet Üst İlave (Ankraj) Donatıları */}
              {layers.dowel && (
                <>
                  <rect
                    data-testid={`svg-part-${leftExtraId}`}
                    data-selected={selectedPartId === leftExtraId ? "true" : "false"}
                    x={xToSvgX(-290)}
                    y={topBarY + 5}
                    width={xToSvgX(1100) - xToSvgX(-290)}
                    height={4.2}
                    rx={1.5}
                    fill={selectedPartId === leftExtraId ? "#f43f5e" : "#f59e0b"}
                    onClick={() => onSelectPart?.(leftExtraId)}
                    className="cursor-pointer"
                  />
                  <rect
                    data-testid={`svg-part-${rightExtraId}`}
                    data-selected={selectedPartId === rightExtraId ? "true" : "false"}
                    x={xToSvgX(spanMm - 1100)}
                    y={topBarY + 5}
                    width={xToSvgX(spanMm + 290) - xToSvgX(spanMm - 1100)}
                    height={4.2}
                    rx={1.5}
                    fill={selectedPartId === rightExtraId ? "#f43f5e" : "#f59e0b"}
                    onClick={() => onSelectPart?.(rightExtraId)}
                    className="cursor-pointer"
                  />
                </>
              )}

              {/* Düşey Kesit A–A çizgisi */}
              <g
                data-testid="svg-section-cut-line"
                data-elevation-mm={cutAnalysis.clampedElevationZMm}
              >
                <line
                  x1={cutLineSvgX}
                  y1={beamTopY - 20}
                  x2={cutLineSvgX}
                  y2={beamBotY + 22}
                  stroke="#22d3ee"
                  strokeWidth={section.enabled ? 2.5 : 1.5}
                  strokeDasharray="6 3"
                />
                <text
                  x={cutLineSvgX}
                  y={beamBotY + 38}
                  textAnchor="middle"
                  fill="#22d3ee"
                  fontSize={9.5}
                  fontFamily="monospace"
                  fontWeight={700}
                >
                  A–A: X={cutAnalysis.clampedElevationZMm} mm
                </text>
              </g>
            </svg>
          </div>

          {/* Sağ: Bu Konumdaki Kesit vs Temsilî Kiriş Enkesiti */}
          <div className="space-y-4">
            <div
              data-testid="actual-cut-section-card"
              className="rounded-2xl border border-cyan-500/35 bg-card/90 dark:bg-[#0c0a1d]/90 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-foreground dark:text-white">
                  Bu Konumdaki Kesit (X = {cutAnalysis.clampedElevationZMm} mm)
                </h3>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-200">
                  Gerçek Konum Kesiti
                </span>
              </div>
              <p
                data-testid="actual-cut-status-title"
                className="mt-1 text-xs font-bold text-cyan-600 dark:text-cyan-300"
              >
                {cutAnalysis.statusTitle}
              </p>
              <p
                data-testid="actual-cut-status-desc"
                className="mt-1 text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-300"
              >
                {cutAnalysis.statusDescription}
              </p>

              <svg
                viewBox="0 0 220 260"
                data-testid="actual-cut-section-svg"
                className="mt-3 w-full max-w-[195px] mx-auto rounded-xl bg-muted/40 dark:bg-[#080714] border border-border/60 dark:border-white/10"
                role="img"
                aria-label={`X=${cutAnalysis.clampedElevationZMm} mm konumundaki kiriş enkesiti`}
              >
                {isConcreteShown && cutAnalysis.inConcreteBody && (
                  <rect
                    data-testid="actual-cut-concrete-rect"
                    x={44}
                    y={20}
                    width={132}
                    height={200}
                    rx={4}
                    fill={
                      selectedPartId === "concrete-beam-body"
                        ? "#f43f5e"
                        : "#64748b"
                    }
                    fillOpacity={0.28}
                    stroke="#22d3ee"
                    strokeWidth={2}
                    onClick={() => onSelectPart?.("concrete-beam-body")}
                    className="cursor-pointer"
                  />
                )}

                {cutAnalysis.intersectedStirrupParts.map((st) => {
                  const isSel = selectedPartId === st.id;
                  return (
                    <g
                      key={st.id}
                      data-testid="actual-cut-stirrup-ring"
                      data-part-id={st.id}
                      onClick={() => onSelectPart?.(st.id)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={58}
                        y={34}
                        width={104}
                        height={172}
                        rx={10}
                        fill="none"
                        stroke={isSel ? "#f43f5e" : st.colorHex}
                        strokeWidth={isSel ? 4.2 : 3.2}
                      />
                    </g>
                  );
                })}

                {/* Alt 3Ø16 ve Üst 2Ø14 */}
                {cutAnalysis.intersectedLongitudinalParts.map((bar) => {
                  const isBottom = bar.id.includes("bottom");
                  const cy = isBottom ? 192 : 48;
                  const cx = bar.id.endsWith("-1")
                    ? 72
                    : bar.id.endsWith("-2")
                      ? isBottom
                        ? 110
                        : 148
                      : 148;
                  const isSel = selectedPartId === bar.id;
                  return (
                    <circle
                      key={bar.id}
                      data-testid={`actual-cut-bar-${bar.id}`}
                      cx={cx}
                      cy={cy}
                      r={isSel ? 8 : 6.5}
                      fill={
                        isSel ? "#f43f5e" : isBottom ? "#38bdf8" : "#cbd5e1"
                      }
                      stroke="#0f172a"
                      strokeWidth={1.5}
                      onClick={() => onSelectPart?.(bar.id)}
                      className="cursor-pointer"
                    />
                  );
                })}

                {/* Mesnet Üst İlave (X <= 1100 veya X >= 2900 mm ise kesilir) */}
                {cutAnalysis.intersectedDowelParts.map((bar) => {
                  const isSel = selectedPartId === bar.id;
                  return (
                    <circle
                      key={bar.id}
                      data-testid={`actual-cut-dowel-${bar.id}`}
                      cx={110}
                      cy={48}
                      r={isSel ? 8.2 : 6.8}
                      fill={isSel ? "#f43f5e" : "#f59e0b"}
                      stroke="#0f172a"
                      strokeWidth={1.5}
                      onClick={() => onSelectPart?.(bar.id)}
                      className="cursor-pointer"
                    />
                  );
                })}
              </svg>
            </div>

            <div
              data-testid="representative-section-card"
              className="rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0c0a1d]/90 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-foreground dark:text-white">
                  Temsilî Kiriş Enkesiti ({beamB}×{beamH} mm)
                </h3>
                <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-purple-300">
                  Genel Yerleşim
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground dark:text-zinc-400">
                Altta 3Ø16 açıklık donatısı, üstte 2Ø14 montaj + mesnet bölgelerinde Ø16 üst ilave ve Ø10 kapalı etriye.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const svgWidth = 420;
  const svgHeight = 560;
  const padTop = 38;
  const padBottom = 38;
  const drawHeight = svgHeight - padTop - padBottom;
  const scaleZ = drawHeight / totalHeightZ;

  const colDrawWidth = 108;
  const colLeftX = 112;
  const colRightX = colLeftX + colDrawWidth;

  const zToSvgY = (zMm: number) => svgHeight - padBottom - zMm * scaleZ;

  const topConcreteY = zToSvgY(concreteHeightZ);
  const baseConcreteY = zToSvgY(0);
  const topDowelY = zToSvgY(totalHeightZ);
  const cutPlaneSvgY = zToSvgY(cutAnalysis.clampedElevationZMm);

  const coverOffsetPx = Math.round((clearCover / widthX) * colDrawWidth);
  const leftBarX = colLeftX + coverOffsetPx + 6;
  const rightBarX = colRightX - coverOffsetPx - 6;
  const midBarX = (leftBarX + rightBarX) / 2;

  const firstLongId = longitudinalParts[0]?.id ?? "longitudinal-bar-1-sw";
  const secondLongId = longitudinalParts[1]?.id ?? "longitudinal-bar-2-se";
  const firstDowelId = dowelParts[0]?.id ?? "dowel-bar-1-sw";
  const secondDowelId = dowelParts[1]?.id ?? "dowel-bar-2-se";

  // Enkesit SVG koordinat dönüşümü: model [-widthX/2, +widthX/2] -> SVG [30, 210] (180 px genişlik)
  const secSvgOffset = 30;
  const secSvgSize = 180;
  const mmToSecPx = (mmVal: number, totalSpanMm: number) =>
    secSvgOffset + ((mmVal + totalSpanMm / 2) / totalSpanMm) * secSvgSize;

  return (
    <div
      data-testid="simulation-2d-preview"
      className="space-y-4"
    >
      {/* Yatay Kesit Düzlemi Kontrol Barı */}
      <div
        data-testid="section-plane-controls"
        className="rounded-2xl border border-border/80 dark:border-purple-500/25 bg-card/90 dark:bg-[#0c0a1d]/90 p-3.5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="toggle-section-plane-btn"
              aria-pressed={section.enabled}
              onClick={() => onToggleSection?.(!section.enabled)}
              className={`min-h-[40px] inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all ${
                section.enabled
                  ? "border-cyan-400 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 shadow-sm"
                  : "border-border/80 dark:border-white/15 bg-muted/50 dark:bg-[#171330] text-foreground dark:text-zinc-200 hover:border-cyan-500/40"
              }`}
            >
              <Scissors className="h-3.5 w-3.5 text-cyan-400" />
              <span>
                {section.enabled ? "Yatay Kesit: Açık" : "Yatay Kesit Düzlemini Aç"}
              </span>
            </button>
            <span
              data-testid="section-elevation-readout"
              className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 font-mono text-xs font-extrabold text-purple-700 dark:text-purple-200"
            >
              Kesit Kotu: Z = {cutAnalysis.clampedElevationZMm} mm
            </span>
          </div>

          <span
            data-testid="section-intersect-badge"
            data-stirrup-hit-count={cutAnalysis.intersectedStirrupParts.length}
            data-in-concrete={cutAnalysis.inConcreteBody ? "true" : "false"}
            className={`rounded-xl border px-3 py-1 font-mono text-[11px] font-bold ${
              cutAnalysis.intersectedStirrupParts.length > 0
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : cutAnalysis.inConcreteBody
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                  : "border-purple-500/40 bg-purple-500/15 text-purple-700 dark:text-purple-300"
            }`}
          >
            {cutAnalysis.intersectedStirrupParts.length > 0
              ? `Etriye Kesiliyor (${cutAnalysis.intersectedStirrupParts[0].id})`
              : cutAnalysis.inConcreteBody
                ? "Etriye Arası Boşluk (Etriye Kesilmez)"
                : "Filiz Bölgesi (Beton Gövde Üstü)"}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <label
              htmlFor="section-elevation-slider"
              className="text-xs font-bold text-muted-foreground dark:text-zinc-300 shrink-0"
            >
              Düşey Kot (Z):
            </label>
            <input
              id="section-elevation-slider"
              data-testid="section-elevation-slider"
              type="range"
              min={0}
              max={totalHeightZ}
              step={5}
              value={cutAnalysis.clampedElevationZMm}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!section.enabled) {
                  onToggleSection?.(true);
                }
                onChangeSectionElevation?.(val);
              }}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(model.slug === "kolon-kiris-birlesimi"
              ? QUICK_JOINT_CUT_ELEVATIONS
              : QUICK_CUT_ELEVATIONS
            ).map((item) => {
              const active = cutAnalysis.clampedElevationZMm === item.zMm;
              return (
                <button
                  key={item.zMm}
                  type="button"
                  data-testid={`quick-cut-z-${item.zMm}`}
                  onClick={() => {
                    if (!section.enabled) {
                      onToggleSection?.(true);
                    }
                    onChangeSectionElevation?.(item.zMm);
                  }}
                  className={`rounded-lg border px-2.5 py-1 font-mono text-[10px] font-bold transition-all ${
                    active
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-800 dark:text-cyan-200"
                      : "border-border/70 dark:border-white/10 bg-muted/40 dark:bg-[#171330] text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Boykesit + İki Enkesit (Bu Kottaki Gerçek Kesit vs Temsilî Enkesit) */}
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Sol: Boykesit Teknik Çizimi */}
        <div className="rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0c0a1d]/90 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-sm font-extrabold text-foreground dark:text-white">
                {model.slug === "kolon-kiris-birlesimi"
                  ? "Kolon–Kiriş Dış Birleşimi Boykesit Çizimi (D1 · 400×400 + 300×500)"
                  : `Boykesit Teknik Çizimi (${model.presetId === "c1-referans" ? "C1" : "Çirozlu"})`}
              </h3>
              <p
                data-testid="drawing-2d-dimensions-summary"
                data-total-height-mm={totalHeightZ}
                data-concrete-height-mm={concreteHeightZ}
                data-dowel-length-mm={model.dimensionsMm.dowelLengthZ}
                data-section-width-mm={widthX}
                data-section-depth-mm={depthY}
                data-stirrup-count={model.counts.stirrups}
                className="text-xs text-muted-foreground dark:text-zinc-400"
              >
                Toplam boy: {totalHeightZ} mm ({concreteHeightZ} mm gövde +{" "}
                {model.dimensionsMm.dowelLengthZ} mm filiz) · Kesit: {widthX}×{depthY} mm
              </p>
            </div>
            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-purple-300">
              2B ↔ 3B Eşlemeli
            </span>
          </div>

          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full max-h-[500px] rounded-xl bg-muted/40 dark:bg-[#080714] border border-border/60 dark:border-white/10"
            role="img"
            aria-label="Betonarme kolon boykesit donatı şeması"
          >
            {/* Bölge arka plan bantları ve ölçü etiketleri */}
            {layers.dimensions &&
              model.zones
                .filter((z) => z.id !== "kiris-sarilma")
                .map((zone) => {
                  const yTop = zToSvgY(zone.zEndMm);
                  const yBot = zToSvgY(zone.zStartMm);
                  return (
                    <g
                      key={zone.id}
                      data-testid={`svg-zone-band-${zone.id}`}
                      data-zone-length-mm={zone.lengthMm}
                      data-zone-spacing-mm={zone.spacingMm}
                      data-zone-stirrup-count={zone.stirrupCount}
                    >
                      <rect
                        x={colRightX + 18}
                        y={yTop}
                        width={165}
                        height={Math.max(yBot - yTop, 4)}
                        rx={4}
                        fill={zone.colorHex}
                        fillOpacity={0.12}
                        stroke={zone.colorHex}
                        strokeOpacity={0.45}
                      />
                      <text
                        x={colRightX + 26}
                        y={(yTop + yBot) / 2 - 4}
                        className="fill-current text-foreground dark:text-zinc-100"
                        fontSize={10}
                        fontWeight={700}
                      >
                        {zone.label}
                      </text>
                      <text
                        x={colRightX + 26}
                        y={(yTop + yBot) / 2 + 10}
                        className="fill-current text-muted-foreground dark:text-zinc-300"
                        fontSize={9}
                        fontFamily="monospace"
                      >
                        {zone.lengthMm} mm · Ø10/{zone.spacingMm} ({zone.stirrupCount} ad.)
                      </text>
                    </g>
                  );
                })}

            {/* Dış birleşimde saplanan kiriş beton gövdesi, kiriş etriyeleri ve 90° ankraj kolları */}
            {model.slug === "kolon-kiris-birlesimi" && (
              <g data-testid="svg-joint-beam-branch">
                {isConcreteShown && (
                  <rect
                    data-testid="svg-part-concrete-joint-beam"
                    data-selected={
                      selectedPartId === "concrete-joint-beam" ? "true" : "false"
                    }
                    x={colRightX}
                    y={zToSvgY(1750)}
                    width={175}
                    height={Math.max(zToSvgY(1250) - zToSvgY(1750), 16)}
                    fill={
                      selectedPartId === "concrete-joint-beam"
                        ? "#f43f5e"
                        : "#64748b"
                    }
                    fillOpacity={0.22}
                    stroke={
                      selectedPartId === "concrete-joint-beam"
                        ? "#f43f5e"
                        : "#94a3b8"
                    }
                    strokeWidth={1.6}
                    onClick={() => onSelectPart?.("concrete-joint-beam")}
                    className="cursor-pointer"
                  />
                )}
                {layers.crosstie &&
                  crosstieParts.map((part, idx) => {
                    const bx = colRightX + 12 + idx * 13;
                    const isSel = selectedPartId === part.id;
                    return (
                      <rect
                        key={part.id}
                        data-testid={`svg-part-${part.id}`}
                        data-selected={isSel ? "true" : "false"}
                        x={bx}
                        y={zToSvgY(1715)}
                        width={isSel ? 4.5 : 2.8}
                        height={Math.max(zToSvgY(1285) - zToSvgY(1715), 10)}
                        rx={1}
                        fill={isSel ? "#f43f5e" : "#ec4899"}
                        onClick={() => onSelectPart?.(part.id)}
                        className="cursor-pointer"
                      />
                    );
                  })}
                {layers.dowel && (
                  <>
                    {/* Kiriş Üst Boyuna + 90° Aşağı Ankraj (tıklanabilir yatay gövde + 90° düşey kanca) */}
                    <rect
                      data-testid="svg-part-joint-beam-top-bar-1"
                      data-selected={
                        selectedPartId === "joint-beam-top-bar-1" ? "true" : "false"
                      }
                      x={leftBarX + 4}
                      y={zToSvgY(1696) - 2.4}
                      width={colRightX + 170 - (leftBarX + 4)}
                      height={4.8}
                      rx={1.5}
                      fill={
                        selectedPartId === "joint-beam-top-bar-1"
                          ? "#f43f5e"
                          : "#f59e0b"
                      }
                      onClick={() => onSelectPart?.("joint-beam-top-bar-1")}
                      className="cursor-pointer"
                    />
                    <rect
                      x={leftBarX + 2}
                      y={zToSvgY(1696)}
                      width={4.4}
                      height={Math.max(zToSvgY(1344) - zToSvgY(1696), 8)}
                      rx={1.5}
                      fill={
                        selectedPartId === "joint-beam-top-bar-1"
                          ? "#f43f5e"
                          : "#f59e0b"
                      }
                      onClick={() => onSelectPart?.("joint-beam-top-bar-1")}
                      className="cursor-pointer"
                    />
                    {/* Kiriş Alt Boyuna + 90° Yukarı Ankraj (tıklanabilir yatay gövde + 90° düşey kanca) */}
                    <rect
                      data-testid="svg-part-joint-beam-bottom-bar-1"
                      data-selected={
                        selectedPartId === "joint-beam-bottom-bar-1"
                          ? "true"
                          : "false"
                      }
                      x={leftBarX + 12}
                      y={zToSvgY(1304) - 2.4}
                      width={colRightX + 170 - (leftBarX + 12)}
                      height={4.8}
                      rx={1.5}
                      fill={
                        selectedPartId === "joint-beam-bottom-bar-1"
                          ? "#f43f5e"
                          : "#38bdf8"
                      }
                      onClick={() => onSelectPart?.("joint-beam-bottom-bar-1")}
                      className="cursor-pointer"
                    />
                    <rect
                      x={leftBarX + 10}
                      y={zToSvgY(1636)}
                      width={4.4}
                      height={Math.max(zToSvgY(1304) - zToSvgY(1636), 8)}
                      rx={1.5}
                      fill={
                        selectedPartId === "joint-beam-bottom-bar-1"
                          ? "#f43f5e"
                          : "#38bdf8"
                      }
                      onClick={() => onSelectPart?.("joint-beam-bottom-bar-1")}
                      className="cursor-pointer"
                    />
                  </>
                )}
              </g>
            )}

            {/* Beton gövde dikdörtgeni */}
            {isConcreteShown && (
              <rect
                data-testid="svg-part-concrete-column-body"
                data-selected={selectedPartId === "concrete-column-body" ? "true" : "false"}
                x={colLeftX}
                y={topConcreteY}
                width={colDrawWidth}
                height={baseConcreteY - topConcreteY}
                fill={selectedPartId === "concrete-column-body" ? "#f43f5e" : "#64748b"}
                fillOpacity={0.22}
                stroke={selectedPartId === "concrete-column-body" ? "#f43f5e" : "#94a3b8"}
                strokeWidth={selectedPartId === "concrete-column-body" ? 2.5 : 1.5}
                onClick={() => onSelectPart?.("concrete-column-body")}
                className="cursor-pointer"
              />
            )}

            {/* Etriye yatay çizgileri */}
            {layers.stirrup &&
              stirrupParts.map((part) => {
                const zMm = part.elevationZMm ?? 0;
                const y = zToSvgY(zMm);
                const isSel = selectedPartId === part.id;
                const lineWidth = Math.max(colRightX - colLeftX - coverOffsetPx * 2, 12);
                const barHeight = isSel ? 5.2 : 3.2;
                return (
                  <rect
                    key={part.id}
                    data-testid={`svg-part-${part.id}`}
                    data-selected={isSel ? "true" : "false"}
                    x={colLeftX + coverOffsetPx}
                    y={y - barHeight / 2}
                    width={lineWidth}
                    height={barHeight}
                    rx={1.2}
                    fill={isSel ? "#f43f5e" : part.colorHex}
                    onClick={() => onSelectPart?.(part.id)}
                    className="cursor-pointer"
                  />
                );
              })}

            {/* Boyuna donatılar (tıklanabilir) */}
            {layers.longitudinal && (
              <>
                <rect
                  data-testid={`svg-part-${firstLongId}`}
                  data-selected={selectedPartId === firstLongId ? "true" : "false"}
                  x={leftBarX - (selectedPartId === firstLongId ? 2.25 : 1.6)}
                  y={topConcreteY}
                  width={selectedPartId === firstLongId ? 4.5 : 3.2}
                  height={Math.max(baseConcreteY - topConcreteY, 8)}
                  rx={1.2}
                  fill={selectedPartId === firstLongId ? "#f43f5e" : "#94a3b8"}
                  onClick={() => onSelectPart?.(firstLongId)}
                  className="cursor-pointer"
                />
                <rect
                  data-testid={`svg-part-${secondLongId}`}
                  data-selected={selectedPartId === secondLongId ? "true" : "false"}
                  x={rightBarX - (selectedPartId === secondLongId ? 2.25 : 1.6)}
                  y={topConcreteY}
                  width={selectedPartId === secondLongId ? 4.5 : 3.2}
                  height={Math.max(baseConcreteY - topConcreteY, 8)}
                  rx={1.2}
                  fill={selectedPartId === secondLongId ? "#f43f5e" : "#94a3b8"}
                  onClick={() => onSelectPart?.(secondLongId)}
                  className="cursor-pointer"
                />
                {model.counts.longitudinalBars === 8 && (
                  <line
                    x1={midBarX}
                    y1={baseConcreteY}
                    x2={midBarX}
                    y2={topConcreteY}
                    stroke="#94a3b8"
                    strokeWidth={2.5}
                    strokeDasharray="3 2"
                  />
                )}
              </>
            )}

            {/* Üst filiz uzantısı (tıklanabilir, yalnız kolon sahnesinde) */}
            {layers.dowel && model.slug !== "kolon-kiris-birlesimi" && (
              <>
                <rect
                  data-testid={`svg-part-${firstDowelId}`}
                  data-selected={selectedPartId === firstDowelId ? "true" : "false"}
                  x={leftBarX - (selectedPartId === firstDowelId ? 2.2 : 1.6)}
                  y={topDowelY}
                  width={selectedPartId === firstDowelId ? 4.4 : 3.2}
                  height={Math.max(topConcreteY - topDowelY, 8)}
                  rx={1.2}
                  fill={selectedPartId === firstDowelId ? "#f43f5e" : "#f59e0b"}
                  fillOpacity={0.92}
                  onClick={() => onSelectPart?.(firstDowelId)}
                  className="cursor-pointer"
                />
                <rect
                  data-testid={`svg-part-${secondDowelId}`}
                  data-selected={selectedPartId === secondDowelId ? "true" : "false"}
                  x={rightBarX - (selectedPartId === secondDowelId ? 2.2 : 1.6)}
                  y={topDowelY}
                  width={selectedPartId === secondDowelId ? 4.4 : 3.2}
                  height={Math.max(topConcreteY - topDowelY, 8)}
                  rx={1.2}
                  fill={selectedPartId === secondDowelId ? "#f43f5e" : "#f59e0b"}
                  fillOpacity={0.92}
                  onClick={() => onSelectPart?.(secondDowelId)}
                  className="cursor-pointer"
                />
              </>
            )}

            {/* Yatay Kesit Düzlemi A–A Göstergesi */}
            <g data-testid="svg-section-plane-line">
              <line
                x1={colLeftX - 24}
                y1={cutPlaneSvgY}
                x2={colRightX + 14}
                y2={cutPlaneSvgY}
                stroke="#22d3ee"
                strokeWidth={section.enabled ? 2.5 : 1.5}
                strokeDasharray="6 3"
              />
              <text
                x={colLeftX - 28}
                y={cutPlaneSvgY - 5}
                textAnchor="end"
                className="fill-cyan-400"
                fontSize={9}
                fontFamily="monospace"
                fontWeight={700}
              >
                A–A ({cutAnalysis.clampedElevationZMm} mm)
              </text>
            </g>

            {layers.dimensions && (
              <>
                <text
                  x={12}
                  y={(topDowelY + topConcreteY) / 2}
                  className="fill-amber-400"
                  fontSize={10}
                  fontFamily="monospace"
                  fontWeight={700}
                >
                  Filiz: {model.dimensionsMm.dowelLengthZ} mm
                </text>
                <text
                  x={12}
                  y={(topConcreteY + baseConcreteY) / 2}
                  className="fill-current text-foreground dark:text-zinc-200"
                  fontSize={10}
                  fontFamily="monospace"
                  fontWeight={700}
                >
                  Gövde: {concreteHeightZ} mm
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Sağ Sütun: 1) Bu Kottaki Gerçek Kesit (A–A) ve 2) Temsilî Enkesit */}
        <div className="space-y-4">
          {/* 1) Bu Kottaki Gerçek Kesit */}
          <div
            data-testid="actual-cut-section-card"
            className="rounded-2xl border border-cyan-500/35 bg-card/90 dark:bg-[#0c0a1d]/90 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-foreground dark:text-white">
                Bu Kottaki Kesit (Z = {cutAnalysis.clampedElevationZMm} mm)
              </h3>
              <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-200">
                Gerçek Kot Kesiti
              </span>
            </div>
            <p
              data-testid="actual-cut-status-title"
              className="mt-1 text-xs font-bold text-cyan-600 dark:text-cyan-300"
            >
              {cutAnalysis.statusTitle}
            </p>
            <p
              data-testid="actual-cut-status-desc"
              className="mt-1 text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-300"
            >
              {cutAnalysis.statusDescription}
            </p>

            <svg
              viewBox="0 0 240 240"
              data-testid="actual-cut-section-svg"
              className="mt-3 w-full max-w-[215px] mx-auto rounded-xl bg-muted/40 dark:bg-[#080714] border border-border/60 dark:border-white/10"
              role="img"
              aria-label={`Z=${cutAnalysis.clampedElevationZMm} mm kotundaki gerçek yatay kesit`}
            >
              {/* Beton kesit yüzeyi (yalnız Z <= 3200 mm beton gövde içinde kesilir) */}
              {isConcreteShown && cutAnalysis.inConcreteBody && (
                <rect
                  data-testid="actual-cut-concrete-rect"
                  x={30}
                  y={30}
                  width={180}
                  height={180}
                  rx={4}
                  fill={selectedPartId === "concrete-column-body" ? "#f43f5e" : "#64748b"}
                  fillOpacity={0.28}
                  stroke="#22d3ee"
                  strokeWidth={2}
                  onClick={() => onSelectPart?.("concrete-column-body")}
                  className="cursor-pointer"
                />
              )}

              {/* Etriye halkası YALNIZ bu kot etriye çapı (±5 mm) içindeyse çizilir */}
              {cutAnalysis.intersectedStirrupParts.map((st) => {
                const isSel = selectedPartId === st.id;
                return (
                  <g
                    key={st.id}
                    data-testid="actual-cut-stirrup-ring"
                    data-part-id={st.id}
                    onClick={() => onSelectPart?.(st.id)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={48}
                      y={48}
                      width={144}
                      height={144}
                      rx={14}
                      fill="none"
                      stroke={isSel ? "#f43f5e" : st.colorHex}
                      strokeWidth={isSel ? 4.5 : 3.4}
                    />
                    <line
                      x1={186}
                      y1={54}
                      x2={156}
                      y2={84}
                      stroke={isSel ? "#f43f5e" : st.colorHex}
                      strokeWidth={3.2}
                      strokeLinecap="round"
                    />
                    <line
                      x1={182}
                      y1={50}
                      x2={152}
                      y2={74}
                      stroke={isSel ? "#f43f5e" : st.colorHex}
                      strokeWidth={3.2}
                      strokeLinecap="round"
                    />
                  </g>
                );
              })}

              {/* Çirozlar YALNIZ bu kotta kesiliyorsa */}
              {cutAnalysis.intersectedCrosstieParts.length > 0 && (
                <g data-testid="actual-cut-crosstie-lines">
                  <line
                    x1={58}
                    y1={120}
                    x2={182}
                    y2={120}
                    stroke="#ec4899"
                    strokeWidth={2.8}
                  />
                  <line
                    x1={120}
                    y1={58}
                    x2={120}
                    y2={182}
                    stroke="#ec4899"
                    strokeWidth={2.8}
                  />
                </g>
              )}

              {/* Kesilen Boyuna Donatılar (Z <= 3200 mm) */}
              {cutAnalysis.intersectedLongitudinalParts.map((bar) => {
                const seg = bar.segments[0];
                if (!seg || seg.kind !== "line") return null;
                const cx = mmToSecPx(seg.start.x, widthX);
                const cy = mmToSecPx(-seg.start.y, depthY);
                const isSel = selectedPartId === bar.id;
                return (
                  <circle
                    key={bar.id}
                    data-testid={`actual-cut-bar-${bar.id}`}
                    cx={cx}
                    cy={cy}
                    r={isSel ? 8.5 : 7}
                    fill={isSel ? "#f43f5e" : "#e2e8f0"}
                    stroke="#0f172a"
                    strokeWidth={1.5}
                    onClick={() => onSelectPart?.(bar.id)}
                    className="cursor-pointer"
                  />
                );
              })}

              {/* Kesilen Filiz Donatıları (Z > 3200 mm) */}
              {cutAnalysis.intersectedDowelParts.map((bar) => {
                const seg = bar.segments[0];
                if (!seg || seg.kind !== "line") return null;
                const cx = mmToSecPx(seg.start.x, widthX);
                const cy = mmToSecPx(-seg.start.y, depthY);
                const isSel = selectedPartId === bar.id;
                return (
                  <circle
                    key={bar.id}
                    data-testid={`actual-cut-dowel-${bar.id}`}
                    cx={cx}
                    cy={cy}
                    r={isSel ? 8.5 : 7}
                    fill={isSel ? "#f43f5e" : "#f59e0b"}
                    stroke="#0f172a"
                    strokeWidth={1.5}
                    onClick={() => onSelectPart?.(bar.id)}
                    className="cursor-pointer"
                  />
                );
              })}

              <text
                x={120}
                y={226}
                textAnchor="middle"
                className="fill-current text-foreground dark:text-zinc-200"
                fontSize={10}
                fontFamily="monospace"
                fontWeight={700}
              >
                Z = {cutAnalysis.clampedElevationZMm} mm ·{" "}
                {cutAnalysis.intersectedStirrupParts.length > 0
                  ? "Etriye + Boyuna"
                  : cutAnalysis.inConcreteBody
                    ? "Yalnız Boyuna + Beton"
                    : "Yalnız Filiz"}
              </text>
            </svg>
          </div>

          {/* 2) Temsilî Enkesit (Sürekli Donatı Yerleşim Şeması) */}
          <div
            data-testid="representative-section-card"
            className="rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0c0a1d]/90 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-foreground dark:text-white">
                Temsilî Enkesit ({widthX}×{depthY} mm)
              </h3>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-purple-300">
                Genel Yerleşim
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground dark:text-zinc-400">
              Kot bağımsız genel donatı yerleşimini anlatır: {model.counts.longitudinalBars}Ø20
              boyuna donatı, Ø10 135° kancalı etriye ve c = {clearCover} mm pas payı.
            </p>

            <svg
              viewBox="0 0 240 240"
              data-testid="representative-section-svg"
              className="mt-2.5 w-full max-w-[195px] mx-auto rounded-xl bg-muted/40 dark:bg-[#080714] border border-border/60 dark:border-white/10"
              role="img"
              aria-label={`${widthX}x${depthY} mm kolon temsilî enkesiti`}
            >
              <rect
                x={30}
                y={30}
                width={180}
                height={180}
                rx={4}
                fill={isConcreteShown ? "#64748b" : "none"}
                fillOpacity={isConcreteShown ? 0.22 : 0}
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray={isConcreteShown ? undefined : "5 4"}
              />

              {layers.stirrup && (
                <g
                  onClick={() =>
                    onSelectPart?.(
                      cutAnalysis.nearestStirrupPart?.id ?? stirrupParts[0]?.id ?? null,
                    )
                  }
                  className="cursor-pointer"
                >
                  <rect
                    x={48}
                    y={48}
                    width={144}
                    height={144}
                    rx={14}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth={3.2}
                  />
                  <line
                    x1={186}
                    y1={54}
                    x2={156}
                    y2={84}
                    stroke="#06b6d4"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  <line
                    x1={182}
                    y1={50}
                    x2={152}
                    y2={74}
                    stroke="#06b6d4"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                </g>
              )}

              {layers.crosstie && crosstieParts.length > 0 && (
                <g
                  onClick={() => onSelectPart?.(crosstieParts[0]?.id ?? null)}
                  className="cursor-pointer"
                >
                  <line
                    x1={58}
                    y1={120}
                    x2={182}
                    y2={120}
                    stroke="#ec4899"
                    strokeWidth={2.6}
                  />
                  <line
                    x1={120}
                    y1={58}
                    x2={120}
                    y2={182}
                    stroke="#ec4899"
                    strokeWidth={2.6}
                  />
                </g>
              )}

              {layers.longitudinal &&
                longitudinalParts.map((bar) => {
                  const seg = bar.segments[0];
                  if (!seg || seg.kind !== "line") return null;
                  const cx = mmToSecPx(seg.start.x, widthX);
                  const cy = mmToSecPx(-seg.start.y, depthY);
                  const isSel = selectedPartId === bar.id;
                  return (
                    <circle
                      key={bar.id}
                      cx={cx}
                      cy={cy}
                      r={isSel ? 8.5 : 6.8}
                      fill={isSel ? "#f43f5e" : "#e2e8f0"}
                      stroke="#0f172a"
                      strokeWidth={1.5}
                      onClick={() => onSelectPart?.(bar.id)}
                      className="cursor-pointer"
                    />
                  );
                })}

              <text
                x={120}
                y={225}
                textAnchor="middle"
                className="fill-current text-foreground dark:text-zinc-200"
                fontSize={10}
                fontFamily="monospace"
                fontWeight={700}
              >
                Temsilî Enkesit · {widthX}×{depthY} mm
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
