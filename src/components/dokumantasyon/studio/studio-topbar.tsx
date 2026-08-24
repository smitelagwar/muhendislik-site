// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — DOCUMENT STUDIO TOPBAR (MINIMAL & RICH WARM GLASS UX)
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
import { ModeToggle } from "@/components/mode-toggle";

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
      className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-card/85 px-3 sm:px-4 backdrop-blur-md z-30 select-none"
    >
      {/* Sol Alan: Geri Dönüş Butonu, Dosya Bilgileri ve Rozetler */}
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <StudioCommandButton
          commandId="studio.back"
          onClick={onBack}
          size="sm"
          variant="ghost"
          showLabel={false}
          className="h-9 w-9 p-0 text-muted-foreground hover:bg-secondary hover:text-foreground shrink-0 rounded-xl transition-colors sm:h-8 sm:w-8"
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
            <span className="inline-flex items-center rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 font-mono">
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
            <span className="font-mono">{formatBytes(file.size_bytes)}</span>
            <span>•</span>
            <span className="uppercase font-bold text-amber-500/90 font-mono">
              {file.extension.replace(".", "") || previewKind}
            </span>
          </div>
        </div>
      </div>

      {/* CAD viewer kontrolleri buraya portal edilir. Boşken yer kaplamaz. */}
      <div
        id="cad-studio-toolbar-slot"
        className="flex min-w-0 shrink-0 items-center justify-center empty:hidden max-sm:hidden"
        aria-label="CAD görünüm kontrolleri"
      />

      {/* Orta Alan: Format Özel Slot (varsa) */}
      {actionsSlot && (
        <div className="hidden md:flex items-center gap-1.5 shrink-0 px-2">
          {actionsSlot}
        </div>
      )}

      {/* Sağ Alan: Eylem Butonları */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden origin-right scale-90 sm:block" aria-label="Tema kontrolü">
          <ModeToggle />
        </div>
        {onSave && (
          <StudioCommandButton
            commandId="studio.save"
            onClick={onSave}
            disabled={!isDirty || isSaving}
            size="sm"
            className="h-9 gap-1.5 bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm disabled:opacity-40 rounded-xl"
            icon={<Save className="h-3.5 w-3.5" />}
            label={isSaving ? "Kaydediliyor..." : "Sürüm Kaydet"}
            labelClassName="hidden sm:inline"
            showLabel={true}
          />
        )}

        <StudioCommandButton
          commandId="studio.share"
          onClick={onShare}
          size="sm"
          variant="outline"
          className="h-9 w-9 p-0 text-xs font-semibold text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/40 rounded-xl sm:h-9 sm:w-auto sm:px-3.5"
          icon={<Share2 className="h-3.5 w-3.5" />}
          labelClassName="hidden sm:inline"
          showLabel={true}
        />

        <StudioCommandButton
          commandId="studio.download"
          onClick={onDownload}
          size="sm"
          className="h-9 w-9 p-0 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 shadow-sm rounded-xl sm:h-9 sm:w-auto sm:px-3.5"
          icon={<Download className="h-3.5 w-3.5" />}
          labelClassName="hidden sm:inline"
          showLabel={true}
        />

        <StudioCommandButton
          commandId="studio.fullscreen"
          onClick={onToggleFullscreen}
          size="sm"
          variant="ghost"
          showLabel={false}
          className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hidden sm:inline-flex rounded-xl"
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card/95 border-border shadow-2xl rounded-xl backdrop-blur-md">
            {onRename && (
              <DropdownMenuItem
                data-command-id="studio.rename"
                onClick={onRename}
                className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
              >
                <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                <span>Yeniden Adlandır</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              data-command-id="studio.download"
              onClick={onDownload}
              className="flex items-center gap-2 cursor-pointer text-xs rounded-lg"
            >
              <Download className="h-3.5 w-3.5 text-amber-500" />
              <span>Orijinalini İndir</span>
            </DropdownMenuItem>
            {onDelete && (
              <>
                <DropdownMenuSeparator className="bg-border/60" />
                <DropdownMenuItem
                  data-command-id="studio.delete"
                  onClick={onDelete}
                  className="flex items-center gap-2 cursor-pointer text-xs text-red-500 focus:text-red-500 focus:bg-red-500/10 rounded-lg font-medium"
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
