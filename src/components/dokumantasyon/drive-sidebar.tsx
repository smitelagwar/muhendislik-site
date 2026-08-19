// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — SOL GEZİNTİ ÇUBUĞU (DRIVE SIDEBAR)
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
  Layers,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "./ui-helpers";

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
}: DriveSidebarProps) {
  return (
    <aside className="flex w-64 shrink-0 flex-col gap-4 border-r border-border/70 bg-card/40 p-4 select-none">
      {/* 1. Hızlı Eylem Butonları */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={onUploadClick}
          className="w-full justify-start gap-2 bg-amber-500 font-bold text-zinc-950 hover:bg-amber-400 shadow-sm"
        >
          <Upload className="h-4 w-4" />
          <span>Yeni Dosya Yükle</span>
        </Button>

        <Button
          variant="outline"
          onClick={onNewFolder}
          className="w-full justify-start gap-2 border-border/80 text-xs font-semibold hover:bg-secondary"
        >
          <FolderPlus className="h-4 w-4 text-amber-500" />
          <span>Yeni Klasör Oluştur</span>
        </Button>
      </div>

      {/* 2. Ana Menü Gezintisi */}
      <div className="space-y-1">
        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Gezinti
        </span>

        <button
          onClick={() => onFilterChange("all")}
          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
            activeFilter === "all"
              ? "bg-amber-500/10 text-amber-500 font-bold"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <HardDrive className="h-4 w-4 text-amber-500" />
            <span>Tüm Dosyalarım</span>
          </span>
          <span className="text-[11px] text-muted-foreground">{totalFilesCount}</span>
        </button>

        <button
          onClick={() => onFilterChange("recent")}
          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
            activeFilter === "recent"
              ? "bg-amber-500/10 text-amber-500 font-bold"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-blue-400" />
            <span>Son Eklenenler</span>
          </span>
        </button>

        <button
          onClick={() => onFilterChange("starred")}
          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
            activeFilter === "starred"
              ? "bg-amber-500/10 text-amber-500 font-bold"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Star className="h-4 w-4 text-amber-400" />
            <span>Yıldızlı Dosyalar</span>
          </span>
          {starredCount > 0 && (
            <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-400">
              {starredCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. Mühendislik Hızlı Filtreleri */}
      <div className="space-y-1">
        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Kategori Filtresi
        </span>

        <button
          onClick={() => onFilterChange("cad")}
          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
            activeFilter === "cad"
              ? "bg-amber-500/10 text-amber-500 font-bold"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Compass className="h-4 w-4 text-cyan-400" />
            <span>AutoCAD (DWG / DXF)</span>
          </span>
        </button>

        <button
          onClick={() => onFilterChange("pdf")}
          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
            activeFilter === "pdf"
              ? "bg-amber-500/10 text-amber-500 font-bold"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-red-400" />
            <span>PDF Dokümanları</span>
          </span>
        </button>

        <button
          onClick={() => onFilterChange("image")}
          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
            activeFilter === "image"
              ? "bg-amber-500/10 text-amber-500 font-bold"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <ImageIcon className="h-4 w-4 text-emerald-400" />
            <span>Görseller & Fotoğraflar</span>
          </span>
        </button>
      </div>

      {/* 4. Paylaşım ve Çöp Kutusu */}
      <div className="space-y-1">
        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Yönetim
        </span>

        <button
          onClick={onOpenActiveShares}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <Share2 className="h-4 w-4 text-blue-500" />
            <span>Aktif Paylaşımlar</span>
          </span>
        </button>

        <button
          onClick={onOpenTrash}
          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-red-400 transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <Trash2 className="h-4 w-4 text-red-500" />
            <span>Çöp Kutusu</span>
          </span>
        </button>
      </div>

      {/* 5. Depolama Durumu Özeti */}
      <div className="mt-auto rounded-xl border border-border/80 bg-secondary/30 p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between font-semibold text-foreground">
          <span className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-amber-500" />
            <span>Depolama</span>
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            {formatBytes(totalSizeBytes)}
          </span>
        </div>

        <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full" style={{ width: "28%" }} />
        </div>

        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{totalFoldersCount} Klasör</span>
          <span>{totalFilesCount} Dosya</span>
        </div>
      </div>
    </aside>
  );
}
