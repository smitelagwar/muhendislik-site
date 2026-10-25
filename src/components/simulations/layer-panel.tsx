"use client";

import React from "react";
import { Layers, Eye, EyeOff } from "lucide-react";
import type {
  DetailModel,
  LayerVisibilityMask,
  SimulationLayerId,
} from "@/lib/simulations/core/types";
import type { QuickLayerFilterId } from "@/lib/simulations/state/view-reducer";

const QUICK_FILTERS: ReadonlyArray<{
  id: QuickLayerFilterId;
  label: string;
}> = [
  { id: "all", label: "Tümü" },
  { id: "only-stirrup", label: "Sadece Etriye" },
  { id: "only-longitudinal", label: "Sadece Boyuna" },
];

export function LayerPanel({
  model,
  layers,
  quickFilter,
  onToggleLayer,
  onApplyQuickFilter,
}: {
  model: DetailModel;
  layers: LayerVisibilityMask;
  quickFilter: QuickLayerFilterId;
  onToggleLayer: (layerId: SimulationLayerId) => void;
  onApplyQuickFilter: (filter: QuickLayerFilterId) => void;
}) {
  const isJoint = model.slug === "kolon-kiris-birlesimi";
  const isBeam = model.slug === "kiris-detayi";
  const isFooting = model.slug === "tekil-temel";
  const isWall = model.slug === "perde-detayi";
  const isMat = model.slug === "radye-temel";

  const layerItems: ReadonlyArray<{
    id: SimulationLayerId;
    label: string;
    countLabel: string;
    colorHex: string;
    disabled?: boolean;
  }> = [
    {
      id: "concrete",
      label: isMat
        ? "Radye Plağı + Kolon + Grobeton"
        : isWall
          ? "Perde Beton Gövdesi & Pas Payı"
          : isFooting
            ? "Temel + Kolon + Grobeton & Takoz"
            : isJoint
              ? "Kolon + Kiriş Beton Gövdesi"
              : "Beton Gövde & Örtü",
      countLabel: `${model.counts.concreteParts} hacim`,
      colorHex: "#94a3b8",
    },
    {
      id: "longitudinal",
      label: isMat
        ? "Radye Alt İki Yönlü Izgara (Z=58/74 mm)"
        : isWall
          ? "Ön & Arka İki Yüz Gövde Ağları"
          : isFooting
            ? "Alt X Doğrultusu Izgara (Z=58 mm)"
            : isJoint
              ? "Kolon Boyuna Donatısı"
              : isBeam
                ? "Kiriş Alt & Üst Boyuna Donatı"
                : "Boyuna Donatı",
      countLabel: isMat
        ? `${model.counts.longitudinalBars}Ø16 (Alt X+Y)`
        : isWall
          ? `${model.counts.longitudinalBars}Ø12 (2 yüz)`
          : isFooting
            ? `${model.counts.longitudinalBars}Ø16 (X)`
            : isBeam
              ? `${model.counts.longitudinalBars} çubuk`
              : `${model.counts.longitudinalBars}Ø20`,
      colorHex: isFooting || isWall || isMat ? "#38bdf8" : "#cbd5e1",
    },
    {
      id: "stirrup",
      label: isMat
        ? "Sehpa Donatıları & Filiz Etriyeleri"
        : isWall
          ? "Sol & Sağ Perde Uç Bölgesi Etriyeleri"
          : isFooting
            ? "Filiz Kılavuz & Boyun Etriyeleri"
            : isJoint
              ? "Kolon & Düğüm Çekirdeği Etriyeleri"
              : "Etriyeler / Bölgeler",
      countLabel: isMat
        ? `${model.counts.stirrups} ad. (9 sehpa)`
        : `${model.counts.stirrups} adet Ø10`,
      colorHex: isMat ? "#eab308" : "#06b6d4",
    },
    {
      id: "dowel",
      label: isMat
        ? "Merkez Kolon Filizleri & 90° Ayaklar"
        : isWall
          ? "Sol & Sağ Perde Uç Bölgesi Boyuna"
          : isFooting
            ? "Kolon Filizleri & 90° Ayaklar"
            : isJoint
              ? "Kiriş Boyuna & 90° Ankraj Kancaları"
              : isBeam
                ? "Mesnet Üst İlave & Ankraj"
                : "Üst Kat Filizleri",
      countLabel: isMat
        ? `${model.counts.dowels}Ø20 (L-ayaklı)`
        : isWall
          ? `${model.counts.dowels}Ø20 (6+6 uç)`
          : isFooting
            ? `${model.counts.dowels}Ø20 (L-ayaklı)`
            : isJoint
              ? `${model.counts.dowels}Ø16 (90° kanca)`
              : isBeam
                ? `${model.counts.dowels} adet Ø16`
                : `${model.counts.dowels} adet (1080 mm)`,
      colorHex: "#f59e0b",
    },
    ...(model.counts.crossties > 0
      ? [
          {
            id: "crosstie" as const,
            label: isMat
              ? "Radye Üst İki Yönlü Izgara (Z=526/542 mm)"
              : isWall
                ? "Ön–Arka Yüz Bağlayıcı Çirozları"
                : isFooting
                  ? "Alt Y Doğrultusu Izgara (Z=74 mm)"
                  : isJoint
                    ? "Kiriş Mesnet Sarılma Etriyeleri"
                    : "Çirozlar (X/Y)",
            countLabel: isMat
              ? `${model.counts.crossties}Ø16 (Üst X+Y)`
              : isFooting
                ? `${model.counts.crossties}Ø16 (Y)`
                : `${model.counts.crossties} adet Ø10`,
            colorHex: "#ec4899",
          },
        ]
      : []),
    {
      id: "dimensions",
      label: "Ölçü ve Bölge İşaretleri",
      countLabel: `${model.dimensionMarkers.length} işaret`,
      colorHex: "#a855f7",
    },
  ];

  return (
    <section
      data-testid="simulation-layer-panel"
      className="rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/90 p-4 space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-300">
          <Layers className="h-4 w-4" />
          <span>Katmanlar ve Hızlı Filtre</span>
        </div>
      </div>

      {/* Hızlı Görünüm Filtreleri: Tümü / Sadece Etriye / Sadece Boyuna */}
      <div
        className="grid grid-cols-3 gap-1.5 rounded-xl border border-border/70 dark:border-white/10 bg-muted/50 dark:bg-[#171330] p-1"
        role="group"
        aria-label="Hızlı donatı görünüm filtreleri"
      >
        {QUICK_FILTERS.map((filter) => {
          const active = quickFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              data-testid={`quick-filter-${filter.id}`}
              aria-pressed={active}
              onClick={() => onApplyQuickFilter(filter.id)}
              className={`min-h-[38px] rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all ${
                active
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted-foreground dark:text-zinc-300 hover:text-foreground dark:hover:text-white"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {/* Katman Aç/Kapat Listesi */}
      <div className="space-y-1.5">
        {layerItems.map((item) => {
          const visible = Boolean(layers[item.id]);
          return (
            <button
              key={item.id}
              type="button"
              data-testid={`layer-toggle-${item.id}`}
              aria-pressed={visible}
              onClick={() => onToggleLayer(item.id)}
              className={`w-full min-h-[42px] flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                visible
                  ? "border-purple-500/35 bg-purple-500/10 text-foreground dark:text-white"
                  : "border-border/60 dark:border-white/10 bg-muted/30 dark:bg-[#141028]/60 text-muted-foreground dark:text-zinc-400 opacity-75"
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-3 w-3 rounded-full shrink-0 border border-white/20"
                  style={{ backgroundColor: item.colorHex }}
                />
                <span className="font-bold truncate">{item.label}</span>
              </span>

              <span className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[10px] text-muted-foreground dark:text-zinc-300">
                  {item.countLabel}
                </span>
                {visible ? (
                  <Eye className="h-3.5 w-3.5 text-purple-500 dark:text-purple-300" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bölge Renk Anahtarı */}
      <div className="rounded-xl border border-border/60 dark:border-white/10 bg-muted/30 dark:bg-[#151129] p-3 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-400">
          Etriye Bölge Renkleri
        </div>
        <div className="grid grid-cols-1 gap-1.5 text-[11px]">
          {model.zones.map((zone) => (
            <div key={zone.id} className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 font-semibold text-foreground dark:text-zinc-200">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: zone.colorHex }}
                />
                {zone.label}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground dark:text-zinc-400">
                {zone.stirrupCount} ad. · s={zone.spacingMm} mm
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
