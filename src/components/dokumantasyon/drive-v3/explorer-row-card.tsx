"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  Layers,
  MoreVertical,
  Move,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import { FileTypeIcon, FolderIcon, resolveFileIconKind } from "../file-icons";
import { formatBytes, formatDate } from "../ui-helpers";
import styles from "../dok-workspace.module.css";
import { DriveCheckbox } from "./drive-checkbox";

export type RowDensity = "comfortable" | "compact";

export type ItemActivationSource =
  | "body"
  | "double"
  | "context"
  | "select-control"
  | "name";

function formatRelativeOrShortDate(iso?: string | null): {
  label: string;
  fullTitle: string;
} {
  if (!iso) {
    return { label: "—", fullTitle: "" };
  }
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) {
    return { label: formatDate(iso), fullTitle: iso };
  }
  const fullTitle = new Date(ts).toLocaleString("tr-TR");
  const diffMs = Date.now() - ts;
  if (diffMs < 0) {
    return { label: formatDate(iso), fullTitle };
  }
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) {
    return { label: "Az önce", fullTitle };
  }
  if (diffMin < 60) {
    return { label: `${diffMin} dk önce`, fullTitle };
  }
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return { label: `${diffHour} sa önce`, fullTitle };
  }
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) {
    return { label: `${diffDay} gün önce`, fullTitle };
  }
  return { label: formatDate(iso), fullTitle };
}

function getBaseNameLength(name: string, isFolder: boolean): number {
  if (isFolder) return name.length;
  const dotIdx = name.lastIndexOf(".");
  return dotIdx > 0 ? dotIdx : name.length;
}

function finalizeRenamedValue(
  rawValue: string,
  originalName: string,
  isFolder: boolean
): string {
  const trimmed = rawValue.trim();
  if (!trimmed) return originalName;
  if (isFolder) return trimmed;
  const origDot = originalName.lastIndexOf(".");
  if (origDot <= 0) return trimmed;
  const origExt = originalName.slice(origDot);
  const newDot = trimmed.lastIndexOf(".");
  if (newDot <= 0) {
    return `${trimmed}${origExt}`;
  }
  return trimmed;
}

interface InlineRenameInputProps {
  initialName: string;
  isFolder: boolean;
  onCommit: (nextName: string) => void;
  onCancel: () => void;
}

function InlineRenameInput({
  initialName,
  isFolder,
  onCommit,
  onCancel,
}: InlineRenameInputProps) {
  const [value, setValue] = useState(initialName);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    const end = getBaseNameLength(initialName, isFolder);
    el.setSelectionRange(0, end);
  }, [initialName, isFolder]);

  const commit = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    const nextName = finalizeRenamedValue(value, initialName, isFolder);
    if (!nextName || nextName === initialName) {
      onCancel();
      return;
    }
    onCommit(nextName);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      data-testid="dok-inline-rename-input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          doneRef.current = true;
          onCancel();
        }
      }}
      onBlur={commit}
      aria-label="Yeni ad"
      className="h-7 w-full min-w-[120px] rounded-md border border-amber-500 bg-background px-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30"
    />
  );
}

export interface ExplorerFolderItemProps {
  folder: DokFolder;
  viewMode: "list" | "grid";
  density?: RowDensity;
  style?: React.CSSProperties;
  isSelected: boolean;
  isFocused: boolean;
  isCut: boolean;
  isDragOver?: boolean;
  isStarPop?: boolean;
  isMobileExplorer: boolean;
  isMobileSelectionMode: boolean;
  isRenaming?: boolean;
  setNodeRef: (node: HTMLElement | null, folder: DokFolder) => void;
  onActivate: (
    folder: DokFolder,
    source: ItemActivationSource,
    e: React.MouseEvent
  ) => void;
  onToggleStar: (
    type: "folder",
    id: string,
    isStarred: boolean,
    e: React.MouseEvent
  ) => void;
  onNavigateFolder: (folderId: string) => void;
  onOpenShare: (folder: DokFolder) => void;
  onOpenRename: (folder: DokFolder) => void;
  onCommitInlineRename?: (folder: DokFolder, nextName: string) => void;
  onCancelInlineRename?: () => void;
  onOpenMove: (folder: DokFolder) => void;
  onOpenDelete: (folder: DokFolder) => void;
}

export function ExplorerFolderItem({
  folder,
  viewMode,
  density = "comfortable",
  style,
  isSelected,
  isFocused,
  isCut,
  isDragOver = false,
  isStarPop = false,
  isMobileExplorer,
  isMobileSelectionMode,
  isRenaming = false,
  setNodeRef,
  onActivate,
  onToggleStar,
  onNavigateFolder,
  onOpenShare,
  onOpenRename,
  onCommitInlineRename,
  onCancelInlineRename,
  onOpenMove,
  onOpenDelete,
}: ExplorerFolderItemProps) {
  const isStarred = Boolean(folder.starred_at);
  const showSelectionControl = !isMobileExplorer || isMobileSelectionMode;
  const dateInfo = formatRelativeOrShortDate(folder.updated_at || folder.created_at);

  const renderMenu = (iconSizeClass: string, triggerSizeClass: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={`flex ${triggerSizeClass} items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground`}
          aria-label="Klasör İşlemleri"
          data-folder-name={folder.name}
        >
          <MoreVertical className={iconSizeClass} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-xl border-border bg-card/95 backdrop-blur-md shadow-2xl"
      >
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpenShare(folder);
          }}
          className="flex cursor-pointer items-center gap-2 rounded-lg text-xs"
        >
          <Share2 className="h-3.5 w-3.5 text-amber-500" />
          <span>Link Oluştur</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpenRename(folder);
          }}
          className="flex cursor-pointer items-center gap-2 rounded-lg text-xs text-blue-500 focus:text-blue-500"
        >
          <Edit3 className="h-3.5 w-3.5 text-blue-500" />
          <span>Yeniden Adlandır</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpenMove(folder);
          }}
          className="flex cursor-pointer items-center gap-2 rounded-lg text-xs text-purple-500 focus:text-purple-500"
        >
          <Move className="h-3.5 w-3.5 text-purple-500" />
          <span>Taşı</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => onToggleStar("folder", folder.id, isStarred, e)}
          className="flex cursor-pointer items-center gap-2 rounded-lg text-xs"
        >
          <Star
            className={`h-3.5 w-3.5 ${
              isStarred ? "fill-amber-400 text-amber-400" : "text-amber-400"
            }`}
          />
          <span>{isStarred ? "Yıldızı Kaldır" : "Yıldızla"}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpenDelete(folder);
          }}
          className="flex cursor-pointer items-center gap-2 rounded-lg text-xs font-medium text-red-500 focus:bg-red-500/10 focus:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
          <span>Çöp Kutusuna At</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (viewMode === "grid") {
    return (
      <div
        ref={(node) => setNodeRef(node, folder)}
        data-testid="dok-folder-card"
        data-folder-id={folder.id}
        data-file-kind="folder"
        data-selected={isSelected}
        data-clipboard-cut={isCut ? "true" : undefined}
        onClick={(e) => onActivate(folder, "body", e)}
        onDoubleClick={(e) => onActivate(folder, "double", e)}
        onContextMenu={(e) => onActivate(folder, "context", e)}
        style={style}
        className={`group relative flex h-[260px] flex-col rounded-[22px] p-3.5 cursor-pointer select-none touch-pan-y ${styles.card} ${styles.virtualCard} ${
          isDragOver ? styles.dragOverFolder : ""
        } ${isCut ? "opacity-60 border-dashed" : ""} ${
          isSelected ? styles.virtualCardSelected : ""
        } ${isFocused ? styles.virtualCardFocused : ""}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {showSelectionControl && (
              <DriveCheckbox
                checked={isSelected}
                subtle={!isSelected}
                onClick={(e) => onActivate(folder, "select-control", e)}
                ariaLabel={`${folder.name} ${isSelected ? "seçimini kaldır" : "seç"}`}
              />
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => onToggleStar("folder", folder.id, isStarred, e)}
              aria-label={isStarred ? "Yıldızı kaldır" : "Yıldızla"}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-amber-400"
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  isStarred ? "fill-amber-400 text-amber-400" : ""
                } ${isStarPop ? styles.starPopActive : ""}`}
              />
            </button>
            {renderMenu("h-3.5 w-3.5", "h-10 w-10")}
          </div>
        </div>

        <div
          className={`${styles.cardIconStage} ${styles.folderIconStage}`}
          data-testid="dok-card-icon-stage"
        >
          <FolderIcon size={72} />
        </div>

        <div className={styles.cardInfo}>
          <span className={styles.cardName}>{folder.name}</span>
          <div className={styles.cardMetaRow} data-testid="dok-card-meta">
            <span className={`${styles.cardTypeChip} ${styles.folderTypeChip}`}>
              Klasör
            </span>
          </div>
          <div className={styles.cardFooter} data-testid="dok-card-footer">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{formatDate(folder.updated_at || folder.created_at)}</span>
          </div>
        </div>
      </div>
    );
  }

  const rowHeightClass =
    density === "compact"
      ? "min-h-[56px] lg:min-h-[44px] lg:h-[44px] py-2 lg:py-1.5"
      : "min-h-[56px] py-3 sm:py-2.5";

  return (
    <div
      ref={(node) => setNodeRef(node, folder)}
      data-testid="dok-folder-row"
      data-folder-id={folder.id}
      data-selected={isSelected}
      data-clipboard-cut={isCut ? "true" : undefined}
      onClick={(e) => onActivate(folder, "body", e)}
      onDoubleClick={(e) => onActivate(folder, "double", e)}
      onContextMenu={(e) => onActivate(folder, "context", e)}
      style={style}
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 border-b border-border/35 dark:border-white/[0.05] px-3 text-sm cursor-pointer sm:grid-cols-12 sm:gap-x-0 sm:px-4 select-none touch-pan-y ${rowHeightClass} ${styles.virtualRow} ${
        isDragOver ? styles.dragOverFolder : ""
      } ${isCut ? "opacity-60 border-dashed" : ""} ${
        isSelected
          ? styles.virtualRowSelected
          : "hover:bg-white/60 dark:hover:bg-white/[0.05]"
      } ${isFocused ? styles.virtualRowFocused : ""}`}
    >
      <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-6 md:col-span-5 sm:gap-2.5 sm:pr-2">
        {showSelectionControl && (
          <DriveCheckbox
            checked={isSelected}
            subtle={!isSelected}
            onClick={(e) => onActivate(folder, "select-control", e)}
            ariaLabel={`${folder.name} ${isSelected ? "seçimini kaldır" : "seç"}`}
          />
        )}

        <button
          type="button"
          onClick={(e) => onToggleStar("folder", folder.id, isStarred, e)}
          aria-label={isStarred ? "Yıldızı kaldır" : "Yıldızla"}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-amber-400 sm:flex"
        >
          <Star
            className={`h-4 w-4 ${
              isStarred ? "fill-amber-400 text-amber-400" : ""
            } ${isStarPop ? styles.starPopActive : ""}`}
          />
        </button>

        <FolderIcon size="list" />

        <div className="min-w-0 flex-1">
          {isRenaming && onCommitInlineRename && onCancelInlineRename ? (
            <InlineRenameInput
              initialName={folder.name}
              isFolder
              onCommit={(nextName) => onCommitInlineRename(folder, nextName)}
              onCancel={onCancelInlineRename}
            />
          ) : (
            <>
              <span className="block truncate font-bold text-foreground">
                {folder.name}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground sm:hidden">
                Klasör • {formatDate(folder.updated_at || folder.created_at)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="hidden sm:col-span-2 sm:block text-right tabular-nums text-xs text-muted-foreground font-mono">
        —
      </div>

      <div
        title={dateInfo.fullTitle}
        className="col-span-2 hidden md:block text-right text-xs text-muted-foreground"
      >
        {dateInfo.label}
      </div>

      <div className="col-span-1 flex items-center justify-end gap-1 sm:col-span-4 md:col-span-3 overflow-hidden">
        <div
          data-testid="dok-row-quick-actions"
          className={`hidden sm:flex items-center gap-0.5 ${styles.rowQuickActions}`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigateFolder(folder.id);
            }}
            title="Klasörü Aç"
            aria-label={`${folder.name} klasörünü aç`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenShare(folder);
            }}
            title="Paylaş"
            aria-label={`${folder.name} paylaş`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-amber-500"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenRename(folder);
            }}
            title="Yeniden Adlandır"
            aria-label={`${folder.name} yeniden adlandır`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-blue-500"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
        </div>
        {renderMenu("h-4 w-4", "h-11 w-11 lg:h-7 lg:w-7")}
      </div>
    </div>
  );
}

export interface ExplorerFileItemProps {
  file: DokFile;
  viewMode: "list" | "grid";
  density?: RowDensity;
  style?: React.CSSProperties;
  isSelected: boolean;
  isFocused: boolean;
  isCut: boolean;
  isStarPop?: boolean;
  isMobileExplorer: boolean;
  isMobileSelectionMode: boolean;
  isRenaming?: boolean;
  setNodeRef: (node: HTMLElement | null, file: DokFile) => void;
  onActivate: (
    file: DokFile,
    source: ItemActivationSource,
    e: React.MouseEvent
  ) => void;
  onPointerPreload?: (extension: string) => void;
  onToggleStar: (
    type: "file",
    id: string,
    isStarred: boolean,
    e: React.MouseEvent
  ) => void;
  onOpenStudio: (fileId: string, cadEngine?: "v2") => void;
  onQuickLook?: (file: DokFile) => void;
  onDownload: (file: DokFile) => void;
  onOpenShare: (file: DokFile) => void;
  onOpenRename: (file: DokFile) => void;
  onCommitInlineRename?: (file: DokFile, nextName: string) => void;
  onCancelInlineRename?: () => void;
  onOpenMove: (file: DokFile) => void;
  onOpenDelete: (file: DokFile) => void;
}

export function ExplorerFileItem({
  file,
  viewMode,
  density = "comfortable",
  style,
  isSelected,
  isFocused,
  isCut,
  isStarPop = false,
  isMobileExplorer,
  isMobileSelectionMode,
  isRenaming = false,
  setNodeRef,
  onActivate,
  onPointerPreload,
  onToggleStar,
  onOpenStudio,
  onQuickLook,
  onDownload,
  onOpenShare,
  onOpenRename,
  onCommitInlineRename,
  onCancelInlineRename,
  onOpenMove,
  onOpenDelete,
}: ExplorerFileItemProps) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const isStarred = Boolean(file.starred_at);
  const fileKind = resolveFileIconKind(file.extension, file.mime_type);
  const extensionLabel = (file.extension || "DOSYA")
    .replace(/^\./, "")
    .toUpperCase();
  const extLower = (file.extension || "").toLowerCase();
  const showSelectionControl = !isMobileExplorer || isMobileSelectionMode;
  const dateInfo = formatRelativeOrShortDate(file.updated_at || file.created_at);

  const renderMenu = (iconSizeClass: string, triggerSizeClass: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={`flex ${triggerSizeClass} items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground`}
          aria-label="Dosya İşlemleri"
        >
          <MoreVertical className={iconSizeClass} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-xl border-border bg-card/95 backdrop-blur-md shadow-2xl"
      >
        {onQuickLook && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onQuickLook(file);
            }}
            className="flex cursor-pointer items-center gap-2 rounded-lg text-xs"
          >
            <Eye className="h-3.5 w-3.5 text-amber-500" />
            <span>Hızlı Bakış (Space)</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpenStudio(file.id);
          }}
          className="flex cursor-pointer items-center gap-2 rounded-lg text-xs"
        >
          <Eye className="h-3.5 w-3.5 text-blue-500" />
          <span>Önizle / Studio</span>
        </DropdownMenuItem>
        {(extLower === ".dwg" || extLower === ".dxf") && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onOpenStudio(file.id, "v2");
            }}
            className="flex cursor-pointer items-center gap-2 rounded-lg text-xs font-medium text-amber-500 hover:text-amber-400"
          >
            <Layers className="h-3.5 w-3.5 text-amber-500" />
            <span>
              {extLower === ".dwg" ? "DWG Motor V2 ile aç" : "DXF Motor V2 ile aç"}
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDownload(file);
          }}
          className="flex cursor-pointer items-center gap-2 rounded-lg text-xs"
        >
          <Download className="h-3.5 w-3.5 text-emerald-500" />
          <span>İndir</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpenShare(file);
          }}
          className="flex cursor-pointer items-center gap-2 rounded-lg text-xs"
        >
          <Share2 className="h-3.5 w-3.5 text-amber-500" />
          <span>Link Oluştur</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpenRename(file);
          }}
          className="flex cursor-pointer items-center gap-2 rounded-lg text-xs text-blue-500 focus:text-blue-500"
        >
          <Edit3 className="h-3.5 w-3.5 text-blue-500" />
          <span>Yeniden Adlandır</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpenMove(file);
          }}
          className="flex cursor-pointer items-center gap-2 rounded-lg text-xs text-purple-500 focus:text-purple-500"
        >
          <Move className="h-3.5 w-3.5 text-purple-500" />
          <span>Taşı</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => onToggleStar("file", file.id, isStarred, e)}
          className="flex cursor-pointer items-center gap-2 rounded-lg text-xs"
        >
          <Star
            className={`h-3.5 w-3.5 ${
              isStarred ? "fill-amber-400 text-amber-400" : "text-amber-400"
            }`}
          />
          <span>{isStarred ? "Yıldızı Kaldır" : "Yıldızla"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onOpenDelete(file);
          }}
          className="flex cursor-pointer items-center gap-2 text-xs text-red-500 focus:bg-red-500/10 focus:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
          <span>Çöp Kutusuna At</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (viewMode === "grid") {
    const showImageThumb =
      fileKind === "image" && !thumbFailed && extLower !== ".svg";

    return (
      <div
        ref={(node) => setNodeRef(node, file)}
        data-testid="dok-file-card"
        data-file-id={file.id}
        data-extension={file.extension}
        data-file-kind={fileKind}
        data-selected={isSelected}
        data-clipboard-cut={isCut ? "true" : undefined}
        onClick={(e) => onActivate(file, "body", e)}
        onDoubleClick={(e) => onActivate(file, "double", e)}
        onContextMenu={(e) => onActivate(file, "context", e)}
        onPointerEnter={(e) => {
          if (!isMobileExplorer && e.pointerType === "mouse") {
            onPointerPreload?.(file.extension);
          }
        }}
        onFocus={() => {
          if (!isMobileExplorer) {
            onPointerPreload?.(file.extension);
          }
        }}
        style={style}
        className={`group relative flex h-[260px] flex-col rounded-[22px] p-3.5 cursor-pointer select-none touch-pan-y ${styles.card} ${styles.virtualCard} ${
          isCut ? "opacity-60 border-dashed" : ""
        } ${isSelected ? styles.virtualCardSelected : ""} ${
          isFocused ? styles.virtualCardFocused : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {showSelectionControl && (
              <DriveCheckbox
                checked={isSelected}
                subtle={!isSelected}
                onClick={(e) => onActivate(file, "select-control", e)}
                ariaLabel={`${file.display_name} ${isSelected ? "seçimini kaldır" : "seç"}`}
              />
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => onToggleStar("file", file.id, isStarred, e)}
              aria-label={isStarred ? "Yıldızı kaldır" : "Yıldızla"}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-amber-400"
            >
              <Star
                className={`h-3.5 w-3.5 ${
                  isStarred ? "fill-amber-400 text-amber-400" : ""
                } ${isStarPop ? styles.starPopActive : ""}`}
              />
            </button>
            {renderMenu("h-3.5 w-3.5", "h-10 w-10")}
          </div>
        </div>

        <div
          className={`${styles.cardIconStage} overflow-hidden relative`}
          data-testid="dok-card-icon-stage"
        >
          <FileTypeIcon
            extension={file.extension}
            mimeType={file.mime_type}
            size={68}
          />
          {showImageThumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/dokumantasyon/files/${file.id}/stream`}
              alt={file.display_name}
              loading="lazy"
              decoding="async"
              onError={() => setThumbFailed(true)}
              className="absolute inset-0 h-full w-full rounded-[inherit] object-cover"
            />
          )}
        </div>

        <div className={styles.cardInfo}>
          <Link
            href={`/dokumantasyon/dosya/${file.id}`}
            prefetch={false}
            data-testid="dok-file-name"
            onAuxClick={(e) => {
              if (isMobileExplorer && isMobileSelectionMode) e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => onActivate(file, "name", e)}
            className={`${styles.cardName} hover:text-amber-500 hover:underline`}
          >
            {file.display_name}
          </Link>

          <div className={styles.cardMetaRow} data-testid="dok-card-meta">
            <span className={styles.cardTypeChip}>
              {extensionLabel || "DOSYA"}
            </span>
            <span className={styles.cardSizeChip}>
              {formatBytes(Number(file.size_bytes))}
            </span>
          </div>

          <div className={styles.cardFooter} data-testid="dok-card-footer">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{formatDate(file.updated_at || file.created_at)}</span>
          </div>
        </div>
      </div>
    );
  }

  const rowHeightClass =
    density === "compact"
      ? "min-h-[56px] lg:min-h-[44px] lg:h-[44px] py-2 lg:py-1.5"
      : "min-h-[56px] py-3 sm:py-2.5";

  return (
    <div
      ref={(node) => setNodeRef(node, file)}
      data-testid="dok-file-row"
      data-file-id={file.id}
      data-extension={file.extension}
      data-selected={isSelected}
      data-clipboard-cut={isCut ? "true" : undefined}
      onClick={(e) => onActivate(file, "body", e)}
      onDoubleClick={(e) => onActivate(file, "double", e)}
      onContextMenu={(e) => onActivate(file, "context", e)}
      onPointerEnter={(e) => {
        if (!isMobileExplorer && e.pointerType === "mouse") {
          onPointerPreload?.(file.extension);
        }
      }}
      onFocus={() => {
        if (!isMobileExplorer) {
          onPointerPreload?.(file.extension);
        }
      }}
      style={style}
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 border-b border-border/35 dark:border-white/[0.05] px-3 text-sm cursor-pointer sm:grid-cols-12 sm:gap-x-0 sm:px-4 select-none touch-pan-y ${rowHeightClass} ${styles.virtualRow} ${
        isCut ? "opacity-60 border-dashed" : ""
      } ${
        isSelected
          ? styles.virtualRowSelected
          : "hover:bg-white/60 dark:hover:bg-white/[0.05]"
      } ${isFocused ? styles.virtualRowFocused : ""}`}
    >
      <div className="col-span-2 flex min-w-0 items-center gap-2 sm:col-span-6 md:col-span-5 sm:gap-2.5 sm:pr-2">
        {showSelectionControl && (
          <DriveCheckbox
            checked={isSelected}
            subtle={!isSelected}
            onClick={(e) => onActivate(file, "select-control", e)}
            ariaLabel={`${file.display_name} ${isSelected ? "seçimini kaldır" : "seç"}`}
          />
        )}

        <button
          type="button"
          onClick={(e) => onToggleStar("file", file.id, isStarred, e)}
          aria-label={isStarred ? "Yıldızı kaldır" : "Yıldızla"}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-amber-400 sm:flex"
        >
          <Star
            className={`h-4 w-4 ${
              isStarred ? "fill-amber-400 text-amber-400" : ""
            } ${isStarPop ? styles.starPopActive : ""}`}
          />
        </button>

        <FileTypeIcon
          extension={file.extension}
          mimeType={file.mime_type}
          size="list"
        />

        <div className="min-w-0 flex-1">
          {isRenaming && onCommitInlineRename && onCancelInlineRename ? (
            <InlineRenameInput
              initialName={file.display_name}
              isFolder={false}
              onCommit={(nextName) => onCommitInlineRename(file, nextName)}
              onCancel={onCancelInlineRename}
            />
          ) : (
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href={`/dokumantasyon/dosya/${file.id}`}
                prefetch={false}
                data-testid="dok-file-name"
                onAuxClick={(e) => {
                  if (isMobileExplorer && isMobileSelectionMode)
                    e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => onActivate(file, "name", e)}
                className="truncate font-semibold text-foreground hover:text-amber-500 hover:underline"
              >
                {file.display_name}
              </Link>
              <span className="hidden sm:inline-flex shrink-0 rounded border border-border/70 bg-secondary/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                {extensionLabel}
              </span>
            </div>
          )}
          <span className="mt-0.5 block text-[11px] text-muted-foreground sm:hidden">
            {formatBytes(Number(file.size_bytes))} •{" "}
            {formatDate(file.updated_at || file.created_at)}
          </span>
        </div>
      </div>

      <div className="hidden sm:col-span-2 sm:block text-right tabular-nums text-xs text-muted-foreground font-mono">
        {formatBytes(Number(file.size_bytes))}
      </div>

      <div
        title={dateInfo.fullTitle}
        className="col-span-2 hidden md:block text-right text-xs text-muted-foreground"
      >
        {dateInfo.label}
      </div>

      <div className="col-span-1 flex items-center justify-end gap-1 sm:col-span-4 md:col-span-3 overflow-hidden">
        <div
          data-testid="dok-row-quick-actions"
          className={`hidden sm:flex items-center gap-0.5 ${styles.rowQuickActions}`}
        >
          {onQuickLook && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickLook(file);
              }}
              title="Hızlı Bakış (Space)"
              aria-label={`${file.display_name} hızlı önizleme`}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-amber-500"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            title="İndir"
            aria-label={`${file.display_name} indir`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-emerald-500"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenShare(file);
            }}
            title="Paylaş"
            aria-label={`${file.display_name} paylaş`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-amber-500"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenRename(file);
            }}
            title="Yeniden Adlandır (F2)"
            aria-label={`${file.display_name} yeniden adlandır`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-blue-500"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
        </div>
        {renderMenu("h-4 w-4", "h-11 w-11 lg:h-7 lg:w-7")}
      </div>
    </div>
  );
}
