// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — DOCUMENT STUDIO TOPBAR (MINIMAL & RICH WARM GLASS UX)
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
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
  Sun,
  Moon,
  PanelTopClose,
  FileText,
} from "lucide-react";
import { formatBytes, formatDate, getFileIcon } from "../ui-helpers";
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
import { useTheme } from "next-themes";

interface StudioTopbarProps {
  file: {
    id: string;
    display_name: string;
    size_bytes: number;
    mime_type: string;
    extension: string;
    folder_id: string | null;
    created_at?: string;
  };
  previewKind: PreviewKind;
  isDirty?: boolean;
  versionNo?: number;
  isFullscreen?: boolean;
  isMobileLandscape?: boolean;
  onHideLandscapeBars?: () => void;
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
  isMobileLandscape = false,
  onHideLandscapeBars,
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
  const { setTheme, resolvedTheme } = useTheme();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const updateContainer = () => {
        const el =
          (document.fullscreenElement as HTMLElement) ||
          document.getElementById("document-studio-shell") ||
          document.body;
        setPortalContainer(el);
      };
      updateContainer();
      document.addEventListener("fullscreenchange", updateContainer);
      return () => document.removeEventListener("fullscreenchange", updateContainer);
    }
  }, [isFullscreen]);

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
        {/* Mobil yatay modda kullanıcı geçici açtıysa tek tuşla tekrar gizleme imkanı */}
        {isMobileLandscape && onHideLandscapeBars && (
          <button
            type="button"
            onClick={onHideLandscapeBars}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-2.5 text-xs font-bold text-amber-500 hover:bg-amber-500/25 transition-colors cursor-pointer shadow-sm"
            title="Çizimi tam ekran görmek için çubukları gizle"
            aria-label="Çubukları Gizle"
          >
            <PanelTopClose className="h-3.5 w-3.5" />
            <span className="text-[11px]">Gizle</span>
          </button>
        )}

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

        {/* Ekstra Aksiyonlar Menüsü (3 Nokta) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Daha Fazla İşlem"
              data-testid="studio-more-options-trigger"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl p-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            container={portalContainer}
            className="z-[300] w-60 bg-card/95 border-border shadow-2xl rounded-xl backdrop-blur-md p-1.5"
          >
            {/* 1. Paylaşım Linki */}
            <DropdownMenuItem
              data-command-id="studio.share"
              onClick={onShare}
              className="flex items-center gap-2.5 cursor-pointer text-xs rounded-lg py-2"
            >
              <Share2 className="h-3.5 w-3.5 text-amber-500" />
              <span>Paylaşım Linki Oluştur</span>
            </DropdownMenuItem>

            {/* 2. Orijinalini İndir */}
            <DropdownMenuItem
              data-command-id="studio.download"
              onClick={onDownload}
              className="flex items-center gap-2.5 cursor-pointer text-xs rounded-lg py-2"
            >
              <Download className="h-3.5 w-3.5 text-amber-500" />
              <span>Orijinalini İndir ({formatBytes(file.size_bytes)})</span>
            </DropdownMenuItem>

            {/* 3. Yeniden Adlandır (varsa) */}
            {onRename && (
              <DropdownMenuItem
                data-command-id="studio.rename"
                onClick={onRename}
                className="flex items-center gap-2.5 cursor-pointer text-xs rounded-lg py-2"
              >
                <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                <span>Yeniden Adlandır</span>
              </DropdownMenuItem>
            )}

            {/* 4. Tam Ekran Aç / Kapat */}
            <DropdownMenuItem
              data-command-id="studio.fullscreen"
              onClick={onToggleFullscreen}
              className="flex items-center gap-2.5 cursor-pointer text-xs rounded-lg py-2"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5 text-foreground/80" />
                  <span>Tam Ekrandan Çık</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5 text-foreground/80" />
                  <span>Tam Ekran Yap</span>
                </>
              )}
            </DropdownMenuItem>

            {/* 5. Tema Değiştir */}
            <DropdownMenuItem
              data-command-id="studio.theme"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2.5 cursor-pointer text-xs rounded-lg py-2"
            >
              {resolvedTheme === "dark" ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span>Açık Temaya Geç</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-blue-400" />
                  <span>Koyu Temaya Geç</span>
                </>
              )}
            </DropdownMenuItem>

            {/* 6. Dosya Bilgileri Özeti */}
            <DropdownMenuSeparator className="bg-border/60 my-1" />
            <div className="px-2 py-1.5 text-[11px] text-muted-foreground flex flex-col gap-0.5 select-text">
              <div className="flex items-center gap-1.5 font-medium text-foreground truncate">
                <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{file.display_name}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="font-mono">{formatBytes(file.size_bytes)}</span>
                <span>•</span>
                <span className="uppercase font-bold text-amber-500/90 font-mono">
                  {file.extension.replace(".", "") || previewKind}
                </span>
                {file.created_at && (
                  <>
                    <span>•</span>
                    <span>{formatDate(file.created_at)}</span>
                  </>
                )}
              </div>
            </div>

            {/* 7. Çöp Kutusuna At (varsa) */}
            {onDelete && (
              <>
                <DropdownMenuSeparator className="bg-border/60 my-1" />
                <DropdownMenuItem
                  data-command-id="studio.delete"
                  onClick={onDelete}
                  className="flex items-center gap-2.5 cursor-pointer text-xs text-red-500 focus:text-red-500 focus:bg-red-500/10 rounded-lg py-2 font-medium"
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
