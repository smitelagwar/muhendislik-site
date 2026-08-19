// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — DOCUMENT STUDIO TOPBAR (MINIMAL & RICH UX)
// ============================================================================

"use client";

import React from "react";
import {
  ArrowLeft,
  Share2,
  Download,
  Maximize2,
  Minimize2,
  MoreVertical,
  Edit3,
  Trash2,
  Sparkles,
  Shield,
  Layers,
  Save,
} from "lucide-react";
import { formatBytes, getFileIcon } from "../ui-helpers";
import { StudioCommandButton } from "./studio-command-button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PreviewKind } from "@/lib/dokumantasyon/preview-capabilities";

interface StudioTopbarProps {
  file: {
    id: string;
    display_name: string;
    size_bytes: number;
    mime_type: string;
    extension: string;
    folder_id: string | null;
  };
  previewKind: PreviewKind;
  isDirty?: boolean;
  versionNo?: number;
  isFullscreen?: boolean;
  onBack: () => void;
  onShare: () => void;
  onDownload: () => void;
  onToggleFullscreen: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  actionsSlot?: React.ReactNode;
}

export function StudioTopbar({
  file,
  previewKind,
  isDirty = false,
  versionNo = 1,
  isFullscreen = false,
  onBack,
  onShare,
  onDownload,
  onToggleFullscreen,
  onRename,
  onDelete,
  onSave,
  isSaving = false,
  actionsSlot,
}: StudioTopbarProps & { onSave?: () => void; isSaving?: boolean }) {
  return (
    <header
      data-testid="document-studio-topbar"
      className="flex h-13 shrink-0 items-center justify-between border-b border-border/80 bg-card/90 px-3 sm:px-4 backdrop-blur-md z-30 select-none"
    >
      {/* Sol Alan: Geri Dönüş Butonu, Dosya Bilgileri ve Rozetler */}
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <StudioCommandButton
          commandId="studio.back"
          onClick={onBack}
          size="sm"
          variant="ghost"
          showLabel={false}
          className="h-8 w-8 p-0 text-muted-foreground hover:bg-secondary hover:text-foreground shrink-0 rounded-lg"
          icon={<ArrowLeft className="h-4 w-4" />}
        />

        <div className="shrink-0 flex items-center justify-center">
          {getFileIcon(file.extension, file.mime_type)}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h1
              className="text-xs font-bold text-foreground truncate sm:text-sm max-w-[140px] sm:max-w-xs md:max-w-md lg:max-w-xl"
              title={file.display_name}
            >
              {file.display_name}
            </h1>

            {/* Sürüm Rozeti */}
            <span className="inline-flex items-center rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500 border border-amber-500/20 shrink-0">
              v{versionNo}
            </span>

            {/* Kaydedilmemiş Değişiklik İndikatörü */}
            {isDirty && (
              <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-medium text-orange-400 border border-orange-500/30 shrink-0 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                <span className="hidden sm:inline">Kaydedilmedi</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{formatBytes(file.size_bytes)}</span>
            <span>•</span>
            <span className="uppercase font-semibold text-amber-500/80">
              {file.extension.replace(".", "") || previewKind}
            </span>
          </div>
        </div>
      </div>

      {/* Orta Alan: Format Özel Slot (varsa) */}
      {actionsSlot && (
        <div className="hidden md:flex items-center gap-1.5 shrink-0 px-2">
          {actionsSlot}
        </div>
      )}

      {/* Sağ Alan: Eylem Butonları */}
      <div className="flex items-center gap-1.5 shrink-0">
        {onSave && (
          <StudioCommandButton
            commandId="studio.save"
            onClick={onSave}
            disabled={!isDirty || isSaving}
            size="sm"
            className="h-8 gap-1.5 bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm disabled:opacity-40"
            icon={<Save className="h-3.5 w-3.5" />}
            label={isSaving ? "Kaydediliyor..." : "Sürüm Kaydet"}
            showLabel={true}
          />
        )}

        <StudioCommandButton
          commandId="studio.share"
          onClick={onShare}
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 border-border text-xs font-semibold text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/40"
          icon={<Share2 className="h-3.5 w-3.5" />}
          showLabel={true}
        />

        <StudioCommandButton
          commandId="studio.download"
          onClick={onDownload}
          size="sm"
          className="h-8 gap-1.5 bg-amber-500 px-3 text-xs font-bold text-zinc-950 hover:bg-amber-400 shadow-sm"
          icon={<Download className="h-3.5 w-3.5" />}
          showLabel={true}
        />

        <StudioCommandButton
          commandId="studio.fullscreen"
          onClick={onToggleFullscreen}
          size="sm"
          variant="ghost"
          showLabel={false}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
          icon={
            isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )
          }
        />

        {/* Ekstra Aksiyonlar Menüsü */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Daha Fazla İşlem"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg p-0 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border shadow-xl">
            {onRename && (
              <DropdownMenuItem
                data-command-id="studio.rename"
                onClick={onRename}
                className="flex items-center gap-2 cursor-pointer text-xs"
              >
                <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                <span>Yeniden Adlandır</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              data-command-id="studio.download"
              onClick={onDownload}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <Download className="h-3.5 w-3.5 text-amber-500" />
              <span>Orijinalini İndir</span>
            </DropdownMenuItem>
            {onDelete && (
              <>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  data-command-id="studio.delete"
                  onClick={onDelete}
                  className="flex items-center gap-2 cursor-pointer text-xs text-red-500 focus:text-red-500 focus:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  <span>Çöp Kutusuna At</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
