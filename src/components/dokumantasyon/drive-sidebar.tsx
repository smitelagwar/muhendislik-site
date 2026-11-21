// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — SOL GEZİNTİ ÇUBUĞU (DRIVE SIDEBAR - WARM GLASS UX)
// ============================================================================

"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  HardDrive,
  Clock,
  Star,
  Share2,
  Trash2,
  FolderPlus,
  Upload,
  Compass,
  FileText,
  Image as ImageIcon,
  Database,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "./ui-helpers";
import styles from "./dok-workspace.module.css";

export type DriveNavFilter = "all" | "recent" | "starred" | "cad" | "pdf" | "image";

export interface DriveCategoryCounts {
  cad: number;
  pdf: number;
  image: number;
  other: number;
}

interface DriveSidebarProps {
  activeFilter: DriveNavFilter;
  onFilterChange: (filter: DriveNavFilter) => void;
  onNewFolder: () => void;
  onUploadClick: () => void;
  onOpenActiveShares: () => void;
  onOpenTrash: () => void;
  totalFilesCount: number;
  totalFoldersCount: number;
  totalSizeBytes: number;
  starredCount: number;
  categoryCounts?: DriveCategoryCounts;
  trashCount?: number;
  activeSharesCount?: number;
  className?: string;
  onNavigate?: () => void;
  compact?: boolean;
}

export function DriveSidebar({
  activeFilter,
  onFilterChange,
  onNewFolder,
  onUploadClick,
  onOpenActiveShares,
  onOpenTrash,
  totalFilesCount,
  totalFoldersCount,
  totalSizeBytes,
  starredCount,
  categoryCounts,
  trashCount = 0,
  activeSharesCount = 0,
  className = "",
  onNavigate,
  compact = false,
}: DriveSidebarProps) {
  const completeNavigation = () => onNavigate?.();

  // Masaüstü ana sidebar tam layoutId kullanır; mobil/compact kopyalarda çakışma önlenir.
  const activePillLayoutId = onNavigate
    ? "dok-sidebar-active-pill-mobile"
    : compact
      ? "dok-sidebar-active-pill-compact"
      : "dok-sidebar-active-pill";

  const renderNavPill = (isActive: boolean) => {
    if (!isActive) return null;
    return (
      <motion.span
        layoutId={activePillLayoutId}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className="pointer-events-none absolute inset-0 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/25 to-amber-500/10 shadow-sm backdrop-blur-md"
        aria-hidden="true"
      >
        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)]" />
      </motion.span>
    );
  };

  const getNavButtonClass = (filter: DriveNavFilter) => {
    const isActive = activeFilter === filter;
    return `relative flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-colors duration-150 ${
      isActive
        ? "text-amber-700 dark:text-amber-300 font-bold"
        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground font-medium"
    }`;
  };

  // Kategori dağılım çubuğu hesaplaması
  const cadCount = categoryCounts?.cad ?? 0;
  const pdfCount = categoryCounts?.pdf ?? 0;
  const imageCount = categoryCounts?.image ?? 0;
  const otherCount = categoryCounts?.other ?? 0;
  const categoryTotal = cadCount + pdfCount + imageCount + otherCount;

  const cadPct = categoryTotal > 0 ? (cadCount / categoryTotal) * 100 : 0;
  const pdfPct = categoryTotal > 0 ? (pdfCount / categoryTotal) * 100 : 0;
  const imagePct = categoryTotal > 0 ? (imageCount / categoryTotal) * 100 : 0;
  const otherPct = categoryTotal > 0 ? (otherCount / categoryTotal) * 100 : 0;

  const distributionTooltip =
    categoryTotal > 0
      ? `CAD: ${cadCount} · PDF: ${pdfCount} · Görsel: ${imageCount} · Diğer: ${otherCount}`
      : "Henüz dosya yok";

  return (
    <aside
      data-compact={compact}
      className={`flex w-64 shrink-0 flex-col gap-4 overflow-y-auto overscroll-y-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))] select-none ${styles.sidebar} ${className}`}
    >
      {/* Mobil Başlık ve Kapatma Butonu */}
      {onNavigate && (
        <div className="flex items-center justify-between border-b border-border/60 pb-3 lg:hidden">
          <div className="flex items-center gap-2.5 font-bold text-sm text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <HardDrive className="h-4 w-4" />
            </div>
            <span>Dokümantasyon</span>
          </div>
          <button
            type="button"
            onClick={completeNavigation}
            className="flex min-h-[44px] min-w-[44px] h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Menüyü Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* 1. Hızlı Eylem Butonları */}
      {!compact && (
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              onUploadClick();
              completeNavigation();
            }}
            className={`w-full justify-start gap-2.5 bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-zinc-950 hover:from-amber-400 hover:to-amber-500 shadow-md text-xs h-10 rounded-xl active:scale-[0.98] transition-transform ${styles.ctaSheen}`}
          >
            <Upload className="h-4 w-4 shrink-0" />
            <span>Yeni Dosya Yükle</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              onNewFolder();
              completeNavigation();
            }}
            className="w-full justify-start gap-2.5 border-border/80 text-xs font-semibold hover:bg-secondary/80 h-9 rounded-xl shadow-sm active:scale-[0.98] transition-transform"
          >
            <FolderPlus className="h-4 w-4 shrink-0 text-amber-500" />
            <span>Yeni Klasör Oluştur</span>
          </Button>
        </div>
      )}

      {/* 2. Ana Menü Gezintisi */}
      <div className="space-y-1">
        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
          Gezinti
        </span>

        <button
          type="button"
          onClick={() => {
            onFilterChange("all");
            completeNavigation();
          }}
          className={getNavButtonClass("all")}
        >
          {renderNavPill(activeFilter === "all")}
          <span className="relative z-10 flex items-center gap-2.5">
            <HardDrive className="h-4 w-4 shrink-0 text-amber-500" />
            <span>Tüm Dosyalarım</span>
          </span>
          <span className="relative z-10 text-[11px] font-mono text-muted-foreground/90 font-semibold">
            {totalFilesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onFilterChange("recent");
            completeNavigation();
          }}
          className={getNavButtonClass("recent")}
        >
          {renderNavPill(activeFilter === "recent")}
          <span className="relative z-10 flex items-center gap-2.5">
            <Clock className="h-4 w-4 shrink-0 text-blue-500" />
            <span>Son Açılanlar</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onFilterChange("starred");
            completeNavigation();
          }}
          className={getNavButtonClass("starred")}
        >
          {renderNavPill(activeFilter === "starred")}
          <span className="relative z-10 flex items-center gap-2.5">
            <Star className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Yıldızlı Dosyalar</span>
          </span>
          {starredCount > 0 && (
            <span className="relative z-10 inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-bold font-mono text-amber-600 dark:text-amber-400">
              {starredCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. Kategori Filtresi */}
      <div className="space-y-1">
        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
          Kategori Filtresi
        </span>

        <button
          type="button"
          onClick={() => {
            onFilterChange("cad");
            completeNavigation();
          }}
          className={getNavButtonClass("cad")}
        >
          {renderNavPill(activeFilter === "cad")}
          <span className="relative z-10 flex items-center gap-2.5">
            <Compass className="h-4 w-4 shrink-0 text-cyan-500" />
            <span>AutoCAD (DWG / DXF)</span>
          </span>
          {cadCount > 0 && (
            <span className="relative z-10 inline-flex items-center rounded-full bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.5 text-[10px] font-bold font-mono text-cyan-700 dark:text-cyan-300">
              {cadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            onFilterChange("pdf");
            completeNavigation();
          }}
          className={getNavButtonClass("pdf")}
        >
          {renderNavPill(activeFilter === "pdf")}
          <span className="relative z-10 flex items-center gap-2.5">
            <FileText className="h-4 w-4 shrink-0 text-red-500" />
            <span>PDF Dokümanları</span>
          </span>
          {pdfCount > 0 && (
            <span className="relative z-10 inline-flex items-center rounded-full bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 text-[10px] font-bold font-mono text-red-700 dark:text-red-300">
              {pdfCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            onFilterChange("image");
            completeNavigation();
          }}
          className={getNavButtonClass("image")}
        >
          {renderNavPill(activeFilter === "image")}
          <span className="relative z-10 flex items-center gap-2.5">
            <ImageIcon className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Görseller & Fotoğraflar</span>
          </span>
          {imageCount > 0 && (
            <span className="relative z-10 inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold font-mono text-emerald-700 dark:text-emerald-300">
              {imageCount}
            </span>
          )}
        </button>
      </div>

      {/* 4. Paylaşımlar ve Çöp Kutusu */}
      <div className="space-y-1">
        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
          Yönetim
        </span>

        <button
          type="button"
          onClick={() => {
            onOpenActiveShares();
            completeNavigation();
          }}
          className="flex min-h-[40px] w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <Share2 className="h-4 w-4 shrink-0 text-amber-500" />
            <span>Aktif Paylaşımlar</span>
          </span>
          {activeSharesCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-bold font-mono text-emerald-700 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {activeSharesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenTrash();
            completeNavigation();
          }}
          className="flex min-h-[40px] w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <Trash2 className="h-4 w-4 shrink-0 text-red-400" />
            <span>Çöp Kutusu</span>
          </span>
          {trashCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-500/15 border border-red-500/30 px-1.5 py-0.5 text-[10px] font-bold font-mono text-red-600 dark:text-red-400">
              {trashCount}
            </span>
          )}
        </button>
      </div>

      {/* 5. Alt Kısım: Depolama Alanı ve Kategori Dağılım Çubuğu */}
      {!compact && (
        <div className="mt-auto space-y-2 border-t border-border/60 pt-3">
          <div
            title={distributionTooltip}
            className="rounded-xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-card/60 p-3 text-xs shadow-inner backdrop-blur-md"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 font-bold text-foreground">
                <Database className="h-3.5 w-3.5 text-amber-500" />
                <span>Depolama</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                {formatBytes(totalSizeBytes)}
              </span>
            </div>

            {categoryTotal > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <div
                  className="flex h-1.5 w-full overflow-hidden rounded-full bg-secondary/80"
                  aria-label={distributionTooltip}
                >
                  {cadPct > 0 && (
                    <div
                      style={{ width: `${cadPct}%` }}
                      className="h-full bg-cyan-500 transition-[width] duration-300"
                    />
                  )}
                  {pdfPct > 0 && (
                    <div
                      style={{ width: `${pdfPct}%` }}
                      className="h-full bg-red-500 transition-[width] duration-300"
                    />
                  )}
                  {imagePct > 0 && (
                    <div
                      style={{ width: `${imagePct}%` }}
                      className="h-full bg-emerald-500 transition-[width] duration-300"
                    />
                  )}
                  {otherPct > 0 && (
                    <div
                      style={{ width: `${otherPct}%` }}
                      className="h-full bg-amber-500/80 transition-[width] duration-300"
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] text-muted-foreground">
                  {cadCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                      CAD
                    </span>
                  )}
                  {pdfCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      PDF
                    </span>
                  )}
                  {imageCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Görsel
                    </span>
                  )}
                  {otherCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500/80" />
                      Diğer
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>{totalFoldersCount} klasör</span>
              <span>•</span>
              <span>{totalFilesCount} dosya</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
