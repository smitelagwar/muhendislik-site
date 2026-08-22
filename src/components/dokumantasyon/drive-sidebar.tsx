// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — SOL GEZİNTİ ÇUBUĞU (DRIVE SIDEBAR - WARM GLASS UX)
// ============================================================================

"use client";

import React from "react";
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
  className?: string;
  onNavigate?: () => void;
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
  className = "",
  onNavigate,
}: DriveSidebarProps) {
  const completeNavigation = () => onNavigate?.();

  const getNavButtonClass = (filter: DriveNavFilter) => {
    const isActive = activeFilter === filter;
    return `flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-amber-500/25 to-amber-500/10 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold shadow-sm backdrop-blur-md"
        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent font-medium"
    }`;
  };

  return (
    <aside className={`flex w-64 shrink-0 flex-col gap-4 p-4 select-none ${styles.sidebar} ${className}`}>
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
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Menüyü Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* 1. Hızlı Eylem Butonları */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => {
            onUploadClick();
            completeNavigation();
          }}
          className="w-full justify-start gap-2.5 bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-zinc-950 hover:from-amber-400 hover:to-amber-500 shadow-md text-xs h-10 rounded-xl"
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
          className="w-full justify-start gap-2.5 border-border/80 text-xs font-semibold hover:bg-secondary/80 h-9 rounded-xl shadow-sm"
        >
          <FolderPlus className="h-4 w-4 shrink-0 text-amber-500" />
          <span>Yeni Klasör Oluştur</span>
        </Button>
      </div>

      {/* 2. Ana Menü Gezintisi */}
      <div className="space-y-1">
        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
          Gezinti
        </span>

        <button
          onClick={() => {
            onFilterChange("all");
            completeNavigation();
          }}
          className={getNavButtonClass("all")}
        >
          <span className="flex items-center gap-2.5">
            <HardDrive className="h-4 w-4 shrink-0 text-amber-500" />
            <span>Tüm Dosyalarım</span>
          </span>
          <span className="text-[11px] font-mono text-muted-foreground/80 font-semibold">{totalFilesCount}</span>
        </button>

        <button
          onClick={() => {
            onFilterChange("recent");
            completeNavigation();
          }}
          className={getNavButtonClass("recent")}
        >
          <span className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 shrink-0 text-blue-500" />
            <span>Son Açılanlar</span>
          </span>
        </button>

        <button
          onClick={() => {
            onFilterChange("starred");
            completeNavigation();
          }}
          className={getNavButtonClass("starred")}
        >
          <span className="flex items-center gap-2.5">
            <Star className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Yıldızlı Dosyalar</span>
          </span>
          {starredCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
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
          onClick={() => {
            onFilterChange("cad");
            completeNavigation();
          }}
          className={getNavButtonClass("cad")}
        >
          <span className="flex items-center gap-2.5">
            <Compass className="h-4 w-4 shrink-0 text-cyan-500" />
            <span>AutoCAD (DWG / DXF)</span>
          </span>
        </button>

        <button
          onClick={() => {
            onFilterChange("pdf");
            completeNavigation();
          }}
          className={getNavButtonClass("pdf")}
        >
          <span className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 shrink-0 text-red-500" />
            <span>PDF Dokümanları</span>
          </span>
        </button>

        <button
          onClick={() => {
            onFilterChange("image");
            completeNavigation();
          }}
          className={getNavButtonClass("image")}
        >
          <span className="flex items-center gap-2.5">
            <ImageIcon className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Görseller & Fotoğraflar</span>
          </span>
        </button>
      </div>

      {/* 4. Paylaşımlar ve Çöp Kutusu */}
      <div className="space-y-1">
        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
          Yönetim
        </span>

        <button
          onClick={() => {
            onOpenActiveShares();
            completeNavigation();
          }}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
        >
          <Share2 className="h-4 w-4 shrink-0 text-amber-500" />
          <span>Aktif Paylaşımlar</span>
        </button>

        <button
          onClick={() => {
            onOpenTrash();
            completeNavigation();
          }}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors"
        >
          <Trash2 className="h-4 w-4 shrink-0 text-red-400" />
          <span>Çöp Kutusu</span>
        </button>
      </div>

      {/* 5. Alt Kısım: Depolama Alanı ve Bilgi Kartı */}
      <div className="mt-auto space-y-2 border-t border-border/60 pt-3">
        <div className="rounded-xl border border-white/60 dark:border-white/10 bg-white/60 dark:bg-card/60 p-3 text-xs shadow-inner backdrop-blur-md">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              <Database className="h-3.5 w-3.5 text-amber-500" />
              <span>Depolama</span>
            </span>
            <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
              {formatBytes(totalSizeBytes)}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>{totalFoldersCount} klasör</span>
            <span>•</span>
            <span>{totalFilesCount} dosya</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
