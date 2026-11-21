"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Filter } from "lucide-react";

export type FilterChipKey =
  | "type"
  | "date"
  | "size"
  | "scope"
  | "starred"
  | "collection"
  | "search";

interface FilterChipItem {
  key: FilterChipKey;
  label: string;
  toneClass: string;
}

interface FilterChipsBarProps {
  typeFilter?: string;
  dateFilter?: string;
  sizeFilter?: string;
  scope?: string;
  starredOnly?: boolean;
  collection?: "none" | "recent" | "starred";
  searchQuery?: string;
  resultCount?: number;
  onRemoveFilter: (key: FilterChipKey) => void;
  onClearAll: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  cad: "Tür: AutoCAD (DWG/DXF)",
  pdf: "Tür: PDF",
  image: "Tür: Görsel",
  other: "Tür: Diğer",
};

const DATE_LABELS: Record<string, string> = {
  today: "Tarih: Bugün",
  "7d": "Tarih: Son 7 gün",
  "30d": "Tarih: Son 30 gün",
};

const SIZE_LABELS: Record<string, string> = {
  small: "Boyut: 5 MB altı",
  medium: "Boyut: 5–100 MB",
  large: "Boyut: 100 MB üstü",
};

export function FilterChipsBar({
  typeFilter = "all",
  dateFilter = "all",
  sizeFilter = "all",
  scope = "current",
  starredOnly = false,
  collection = "none",
  searchQuery = "",
  resultCount,
  onRemoveFilter,
  onClearAll,
}: FilterChipsBarProps) {
  const chips: FilterChipItem[] = [];

  if (collection === "recent") {
    chips.push({
      key: "collection",
      label: "Son Açılanlar",
      toneClass: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    });
  } else if (collection === "starred") {
    chips.push({
      key: "collection",
      label: "Yıldızlılar",
      toneClass: "border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-300",
    });
  }

  if (typeFilter && typeFilter !== "all") {
    chips.push({
      key: "type",
      label: TYPE_LABELS[typeFilter] ?? `Tür: ${typeFilter}`,
      toneClass: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    });
  }

  if (dateFilter && dateFilter !== "all") {
    chips.push({
      key: "date",
      label: DATE_LABELS[dateFilter] ?? `Tarih: ${dateFilter}`,
      toneClass: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    });
  }

  if (sizeFilter && sizeFilter !== "all") {
    chips.push({
      key: "size",
      label: SIZE_LABELS[sizeFilter] ?? `Boyut: ${sizeFilter}`,
      toneClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    });
  }

  if (scope === "all") {
    chips.push({
      key: "scope",
      label: "Kapsam: Tüm klasörler",
      toneClass: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300",
    });
  }

  if (starredOnly && collection !== "starred") {
    chips.push({
      key: "starred",
      label: "Yalnız Yıldızlılar",
      toneClass: "border-amber-500/35 bg-amber-500/15 text-amber-700 dark:text-amber-300",
    });
  }

  if (searchQuery.trim()) {
    chips.push({
      key: "search",
      label: `"${searchQuery.trim()}"`,
      toneClass: "border-border bg-secondary/80 text-foreground",
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      data-testid="dok-filter-chips-bar"
      className="flex flex-wrap items-center gap-1.5 border-b border-border/60 bg-card/40 px-3 py-2 text-xs backdrop-blur-md sm:px-4"
    >
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground mr-1">
        <Filter className="h-3 w-3 text-amber-500" />
        <span className="hidden sm:inline">Filtreler:</span>
      </span>

      <AnimatePresence initial={false}>
        {chips.map((chip) => (
          <motion.span
            key={chip.key}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`inline-flex items-center gap-1 rounded-full border pl-2.5 pr-1 py-0.5 text-[11px] font-semibold ${chip.toneClass}`}
          >
            <span>{chip.label}</span>
            <button
              type="button"
              onClick={() => onRemoveFilter(chip.key)}
              aria-label={`${chip.label} filtresini kaldır`}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>

      <div className="ml-auto flex items-center gap-2.5">
        {typeof resultCount === "number" && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {resultCount} sonuç
          </span>
        )}
        <button
          type="button"
          data-testid="dok-filter-chips-clear-all"
          onClick={onClearAll}
          className="rounded-lg px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
        >
          Tümünü Temizle
        </button>
      </div>
    </div>
  );
}
