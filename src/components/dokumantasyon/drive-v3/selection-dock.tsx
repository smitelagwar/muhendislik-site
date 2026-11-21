"use client";

import React from "react";
import { MotionConfig, motion } from "framer-motion";
import {
  Copy,
  Download,
  Link2,
  Move,
  Scissors,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { formatBytes } from "../ui-helpers";
import styles from "../dok-workspace.module.css";

export interface SelectionDockProps {
  selectedCount: number;
  selectedSizeBytes?: number;
  selectedHasFile: boolean;
  allSelectedStarred: boolean;
  onClearSelection: () => void;
  onInvertSelection: () => void;
  onDownload: () => void;
  onToggleStar: () => void;
  onCopy: () => void;
  onCut: () => void;
  onMove: () => void;
  onShare: () => void;
  onTrash: () => void;
}

export function SelectionDock({
  selectedCount,
  selectedSizeBytes = 0,
  selectedHasFile,
  allSelectedStarred,
  onClearSelection,
  onInvertSelection,
  onDownload,
  onToggleStar,
  onCopy,
  onCut,
  onMove,
  onShare,
  onTrash,
}: SelectionDockProps) {
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        data-testid="dok-mobile-selection-dock"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className={`flex shrink-0 items-center justify-between gap-2 border-t border-amber-500/30 bg-card/95 px-4 py-2.5 text-xs font-medium text-foreground backdrop-blur-xl lg:mx-auto lg:my-2 lg:w-fit lg:max-w-[calc(100%-1.5rem)] lg:flex-wrap lg:justify-center lg:gap-1.5 lg:rounded-2xl lg:border lg:border-amber-500/35 lg:px-3 lg:py-2 lg:shadow-2xl ${styles.mobileSelectionBar}`}
      >
        {/* Sol Grup (Masaüstü & Tablet) */}
        <div className="hidden sm:flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onClearSelection}
            aria-label="Seçimi Temizle"
            title="Seçimi Temizle (Esc)"
            className="hidden lg:inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <span className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-700 dark:text-amber-300">
            <span>{selectedCount} seçili</span>
            {selectedSizeBytes > 0 && (
              <span className="font-normal text-amber-700/80 dark:text-amber-300/80">
                ({formatBytes(selectedSizeBytes)})
              </span>
            )}
          </span>

          <button
            type="button"
            data-testid="dok-invert-selection"
            onClick={onInvertSelection}
            className="hidden lg:inline-flex h-7 shrink-0 whitespace-nowrap items-center rounded-lg border border-border/80 bg-background/60 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-amber-500/40 hover:bg-secondary hover:text-foreground"
          >
            Tersine Çevir
          </button>
        </div>

        {/* Dikey Ayraç (Masaüstü) */}
        <div className="hidden lg:block h-5 w-px shrink-0 bg-border/70" aria-hidden="true" />

        {/* Sağ Eylem Grubu */}
        <div className="flex shrink-0 items-center gap-1.5 lg:flex-wrap lg:justify-center">
          {selectedHasFile && (
            <button
              type="button"
              onClick={onDownload}
              data-mobile-action="download"
              aria-label="İndir"
              title="İndir"
              className="hidden lg:inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border border-emerald-500/40 px-2.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-500/10 dark:text-emerald-400"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden 2xl:inline">İndir</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleStar}
            data-mobile-action="star"
            aria-label={allSelectedStarred ? "Yıldızı Kaldır" : "Yıldızla"}
            title={allSelectedStarred ? "Yıldızı Kaldır" : "Yıldızla"}
            className="hidden lg:inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border border-amber-500/40 px-2.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/10 dark:text-amber-400"
          >
            <Star
              className={`h-3.5 w-3.5 ${allSelectedStarred ? "fill-amber-400 text-amber-400" : ""}`}
            />
            <span className="hidden 2xl:inline">{allSelectedStarred ? "Yıldızı Kaldır" : "Yıldızla"}</span>
          </button>

          <button
            type="button"
            onClick={onCopy}
            data-testid="dok-dock-copy"
            title="Kopyala (Ctrl+C)"
            aria-label="Kopyala"
            className="hidden lg:inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border border-border/80 bg-background/60 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden 2xl:inline">Kopyala</span>
          </button>

          <button
            type="button"
            onClick={onCut}
            data-testid="dok-dock-cut"
            title="Kes (Ctrl+X)"
            aria-label="Kes"
            className="hidden lg:inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border border-border/80 bg-background/60 px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="hidden 2xl:inline">Kes</span>
          </button>

          <button
            type="button"
            onClick={onMove}
            data-mobile-action="move"
            aria-label="Taşı"
            className="inline-flex min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 lg:h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-purple-500/40 px-3 lg:px-2.5 text-xs font-medium text-purple-600 transition-colors hover:bg-purple-500/10 dark:text-purple-400"
          >
            <Move className="h-3.5 w-3.5" />
            <span>Taşı</span>
          </button>

          <button
            type="button"
            onClick={onShare}
            data-mobile-action="share"
            aria-label="Paylaş"
            className="inline-flex min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 lg:h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-bold text-zinc-950 shadow-sm transition-colors hover:bg-amber-400"
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Paylaş</span>
          </button>

          <button
            type="button"
            onClick={onTrash}
            data-mobile-action="trash"
            aria-label="Sil"
            className="inline-flex min-h-[44px] min-w-[44px] lg:min-h-0 lg:min-w-0 lg:h-8 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 text-xs font-bold text-white transition-colors hover:bg-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Sil</span>
          </button>
        </div>
      </motion.div>
    </MotionConfig>
  );
}
