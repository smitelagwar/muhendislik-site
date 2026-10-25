"use client";

import React, { useMemo, useState } from "react";
import { Crosshair, Info, ListFilter, X } from "lucide-react";
import type {
  DetailModel,
  DetailPart,
  DetailPartCategory,
  LayerVisibilityMask,
} from "@/lib/simulations/core/types";
import { isPartVisibleInLayers } from "@/lib/simulations/state/view-reducer";

const CATEGORY_TABS: ReadonlyArray<{
  id: "all" | DetailPartCategory;
  label: string;
}> = [
  { id: "all", label: "Tümü" },
  { id: "stirrup", label: "Etriyeler" },
  { id: "longitudinal", label: "Boyuna" },
  { id: "dowel", label: "Filiz" },
  { id: "crosstie", label: "Çiroz" },
  { id: "concrete", label: "Beton" },
];

export function PartInfoPanel({
  model,
  layers,
  selectedPartId,
  onSelectPart,
  onFocusSelectedPart,
}: {
  model: DetailModel;
  layers: LayerVisibilityMask;
  selectedPartId: string | null;
  onSelectPart: (partId: string | null) => void;
  onFocusSelectedPart: () => void;
}) {
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | DetailPartCategory
  >("all");

  const selectedPart: DetailPart | null = useMemo(() => {
    if (!selectedPartId) return null;
    return model.parts.find((item) => item.id === selectedPartId) ?? null;
  }, [model.parts, selectedPartId]);

  const visibleParts = useMemo(() => {
    return model.parts.filter((part) => {
      if (!isPartVisibleInLayers(part, layers)) return false;
      if (categoryFilter !== "all" && part.category !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [model.parts, layers, categoryFilter]);

  return (
    <section
      data-testid="simulation-part-info-panel"
      className="rounded-2xl border border-border/80 dark:border-purple-500/20 bg-card/90 dark:bg-[#0f0d22]/90 p-4 space-y-4"
    >
      {/* Seçili Parça Bilgi Kartı */}
      <div
        data-testid="selected-part-card"
        data-selected-part-id={selectedPart?.id ?? ""}
        className="rounded-xl border border-purple-500/35 bg-purple-500/10 p-3.5 space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-200">
            <Info className="h-4 w-4 shrink-0 text-purple-400" />
            <span>Seçili Parça Bilgi Kartı</span>
          </div>
          {selectedPart && (
            <button
              type="button"
              data-testid="clear-part-selection-btn"
              onClick={() => onSelectPart(null)}
              aria-label="Seçimi temizle"
              className="rounded-lg p-1 text-muted-foreground hover:text-foreground dark:text-zinc-300 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {selectedPart ? (
          <div className="space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3
                data-testid="selected-part-title"
                className="font-extrabold text-sm text-foreground dark:text-white"
              >
                {selectedPart.label}
              </h3>
              <span className="rounded-full border border-purple-400/40 bg-purple-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-purple-800 dark:text-purple-200">
                ID: {selectedPart.id}
              </span>
            </div>

            {selectedPart.kind === "rebar" && (
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                <span className="rounded-lg border border-border/70 dark:border-white/10 bg-card/80 dark:bg-[#171330] px-2 py-0.5 text-foreground dark:text-zinc-200">
                  Çap: Ø{selectedPart.diameterMm} mm
                </span>
                {typeof selectedPart.elevationZMm === "number" && (
                  <span className="rounded-lg border border-border/70 dark:border-white/10 bg-card/80 dark:bg-[#171330] px-2 py-0.5 text-cyan-600 dark:text-cyan-300">
                    Kot: Z={selectedPart.elevationZMm} mm
                  </span>
                )}
                {typeof selectedPart.hookAngleDeg === "number" && (
                  <span className="rounded-lg border border-border/70 dark:border-white/10 bg-card/80 dark:bg-[#171330] px-2 py-0.5 text-amber-600 dark:text-amber-300">
                    Kanca: {selectedPart.hookAngleDeg}° ({selectedPart.hookLengthMm} mm)
                  </span>
                )}
              </div>
            )}

            <dl className="space-y-2 rounded-xl border border-border/60 dark:border-white/10 bg-card/80 dark:bg-[#141028] p-3">
              <div>
                <dt className="font-bold text-purple-700 dark:text-purple-300">
                  Bu nedir?
                </dt>
                <dd
                  data-testid="selected-part-what"
                  className="mt-0.5 text-muted-foreground dark:text-zinc-200 leading-relaxed"
                >
                  {selectedPart.summary.whatIsIt}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-purple-700 dark:text-purple-300">
                  Bu örnekte nerede?
                </dt>
                <dd
                  data-testid="selected-part-where"
                  className="mt-0.5 text-muted-foreground dark:text-zinc-200 leading-relaxed"
                >
                  {selectedPart.summary.whereInExample}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-purple-700 dark:text-purple-300">
                  Ne işe yarar? (Görevi)
                </dt>
                <dd
                  data-testid="selected-part-role"
                  className="mt-0.5 text-muted-foreground dark:text-zinc-200 leading-relaxed"
                >
                  {selectedPart.summary.role}
                </dd>
              </div>
              {selectedPart.summary.fieldNote && (
                <div className="border-t border-border/60 dark:border-white/10 pt-2">
                  <dt className="font-bold text-amber-600 dark:text-amber-300">
                    Saha / Detay Notu
                  </dt>
                  <dd className="mt-0.5 text-muted-foreground dark:text-zinc-300 leading-relaxed">
                    {selectedPart.summary.fieldNote}
                  </dd>
                </div>
              )}
            </dl>

            <button
              type="button"
              data-testid="focus-selected-part-btn"
              onClick={onFocusSelectedPart}
              className="w-full min-h-[40px] inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 px-3 py-2 text-xs font-bold text-white transition-all"
            >
              <Crosshair className="h-3.5 w-3.5" />
              <span>Bu Parçaya Odaklan</span>
            </button>
          </div>
        ) : (
          <p
            data-testid="no-part-selected-msg"
            className="text-xs leading-relaxed text-muted-foreground dark:text-zinc-300"
          >
            3B sahnede bir donatıya/betona tıklayın veya aşağıdaki erişilebilir
            parça listesinden bir eleman seçerek görevini ve konumunu inceleyin.
          </p>
        )}
      </div>

      {/* Erişilebilir HTML Parça Listesi */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground dark:text-zinc-300">
            <ListFilter className="h-3.5 w-3.5 text-purple-400" />
            <span>Tıklanabilir Parça Listesi ({visibleParts.length})</span>
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {CATEGORY_TABS.filter((tab) =>
            tab.id === "crosstie" ? model.counts.crossties > 0 : true,
          ).map((tab) => {
            const active = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`part-list-filter-${tab.id}`}
                onClick={() => setCategoryFilter(tab.id)}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                  active
                    ? "bg-purple-600 text-white"
                    : "border border-border/70 dark:border-white/10 bg-muted/40 dark:bg-[#171330] text-muted-foreground dark:text-zinc-300"
                }`}
              >
                {model.slug === "radye-temel" && tab.id === "longitudinal"
                  ? "Alt Izgara"
                  : model.slug === "radye-temel" && tab.id === "crosstie"
                    ? "Üst Izgara"
                    : model.slug === "radye-temel" && tab.id === "stirrup"
                      ? "Sehpa & Etriye"
                      : model.slug === "radye-temel" && tab.id === "dowel"
                        ? "Kolon Filizi"
                        : model.slug === "perde-detayi" && tab.id === "longitudinal"
                          ? "Gövde (2 Yüz)"
                          : model.slug === "perde-detayi" && tab.id === "dowel"
                            ? "Uç Bölge Boyuna"
                            : model.slug === "perde-detayi" && tab.id === "stirrup"
                              ? "Uç Etriyeler"
                              : model.slug === "tekil-temel" && tab.id === "longitudinal"
                                ? "Alt X Izgara"
                                : model.slug === "tekil-temel" && tab.id === "crosstie"
                                  ? "Alt Y Izgara"
                                  : model.slug === "tekil-temel" && tab.id === "dowel"
                                    ? "Kolon Filizi"
                                    : model.slug === "kolon-kiris-birlesimi" && tab.id === "dowel"
                                      ? "Kiriş & Ankraj"
                                      : model.slug === "kolon-kiris-birlesimi" && tab.id === "crosstie"
                                        ? "Kiriş Etriye"
                                        : tab.label}
              </button>
            );
          })}
        </div>

        <div
          data-testid="accessible-part-list"
          className="max-h-60 overflow-y-auto space-y-1.5 pr-1"
          role="listbox"
          aria-label="Sahne parçaları listesi"
        >
          {visibleParts.length === 0 ? (
            <div className="rounded-xl border border-border/60 dark:border-white/10 p-3 text-center text-xs text-muted-foreground dark:text-zinc-400">
              Bu filtrede görünür katman parçası yok.
            </div>
          ) : (
            visibleParts.map((part) => {
              const isSelected = part.id === selectedPartId;
              const badgeColor =
                part.kind === "rebar" ? part.colorHex : "#94a3b8";
              return (
                <button
                  key={part.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-testid={`part-list-item-${part.id}`}
                  onClick={() => onSelectPart(isSelected ? null : part.id)}
                  className={`w-full min-h-[40px] flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                    isSelected
                      ? "border-rose-500 bg-rose-500/15 text-foreground dark:text-white font-bold shadow-sm"
                      : "border-border/60 dark:border-white/10 bg-muted/30 dark:bg-[#151129] text-foreground dark:text-zinc-200 hover:border-purple-500/40"
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: badgeColor }}
                    />
                    <span className="truncate">{part.label}</span>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground dark:text-zinc-400 shrink-0">
                    {part.kind === "rebar" ? `Ø${part.diameterMm}` : "Beton"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
