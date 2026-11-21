"use client";

import React from "react";
import { HelpCircle } from "lucide-react";
import { formatBytes } from "../ui-helpers";
import type { ExplorerGroupBy, ExplorerSortBy, ExplorerSortOrder } from "./explorer-derive";

interface WorkspaceStatusBarProps {
  foldersCount: number;
  filesCount: number;
  totalSizeBytes: number;
  visibleCount?: number;
  totalCount?: number;
  hasActiveFilters?: boolean;
  selectedCount: number;
  selectedSizeBytes: number;
  hideSelectionPill?: boolean;
  sortBy: ExplorerSortBy;
  sortOrder: ExplorerSortOrder;
  groupBy: ExplorerGroupBy;
  onOpenShortcuts: () => void;
}

const SORT_LABELS: Record<ExplorerSortBy, string> = {
  name: "İsim",
  date: "Tarih",
  size: "Boyut",
  type: "Tür",
};

const GROUP_LABELS: Record<ExplorerGroupBy, string> = {
  none: "Gruplama yok",
  type: "Türe göre",
  date: "Tarihe göre",
  size: "Boyuta göre",
};

export function WorkspaceStatusBar({
  foldersCount,
  filesCount,
  totalSizeBytes,
  visibleCount,
  totalCount,
  hasActiveFilters = false,
  selectedCount,
  selectedSizeBytes,
  hideSelectionPill = false,
  sortBy,
  sortOrder,
  groupBy,
  onOpenShortcuts,
}: WorkspaceStatusBarProps) {
  const sortDirectionText =
    sortBy === "name" || sortBy === "type"
      ? sortOrder === "asc"
        ? "A→Z"
        : "Z→A"
      : sortOrder === "asc"
        ? "Artan"
        : "Azalan";

  const showFilteredText =
    hasActiveFilters &&
    typeof visibleCount === "number" &&
    typeof totalCount === "number";

  return (
    <footer
      data-testid="dok-workspace-status-bar"
      className="hidden h-8 shrink-0 items-center justify-between gap-4 border-t border-border/60 bg-card/50 px-4 text-[11px] text-muted-foreground backdrop-blur-md lg:flex select-none"
    >
      {/* Sol: Öğe & Boyut Özeti */}
      <div className="flex items-center gap-2 font-mono">
        {showFilteredText ? (
          <span>
            <strong className="text-foreground">{visibleCount}</strong> / {totalCount} öğe gösteriliyor
          </span>
        ) : (
          <span>
            {foldersCount} klasör · {filesCount} dosya ·{" "}
            <strong className="text-foreground">{formatBytes(totalSizeBytes)}</strong>
          </span>
        )}
      </div>

      {/* Orta: Seçim Durumu */}
      {selectedCount > 0 && !hideSelectionPill && (
        <div
          data-testid="dok-status-selection"
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono font-semibold text-amber-700 dark:text-amber-300"
        >
          <span>{selectedCount} öğe seçili</span>
          {selectedSizeBytes > 0 && (
            <>
              <span>·</span>
              <span>{formatBytes(selectedSizeBytes)}</span>
            </>
          )}
        </div>
      )}

      {/* Sağ: Sıralama/Gruplama & Kısayollar */}
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground/90">
          {SORT_LABELS[sortBy]} {sortDirectionText} · {GROUP_LABELS[groupBy]}
        </span>
        <button
          type="button"
          data-testid="dok-status-shortcuts-btn"
          onClick={onOpenShortcuts}
          className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-300"
        >
          <HelpCircle className="h-3 w-3 text-amber-500" />
          <span>Kısayollar</span>
        </button>
      </div>
    </footer>
  );
}
