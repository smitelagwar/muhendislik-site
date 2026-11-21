"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardPaste,
  Copy,
  Download,
  Edit3,
  Eye,
  FileUp,
  FolderInput,
  FolderOpen,
  FolderPlus,
  Info,
  Layers,
  LayoutGrid,
  RefreshCw,
  Scissors,
  Share2,
  Sparkles,
  Star,
  StarOff,
  Trash2,
  CheckSquare,
} from "lucide-react";
import type { CommandContext, CommandId, CommandTargetItem } from "./command-registry";

export interface DriveContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  context: CommandContext;
  targetItem?: CommandTargetItem | null;
  canExecute: (id: CommandId) => boolean;
  onExecute: (id: CommandId) => void;
  onInvertSelection?: () => void;
  onClose: () => void;
  supportsFolderUpload?: boolean;
}

interface MenuEntry {
  type: "item" | "separator";
  id?: CommandId;
  customTestId?: string;
  onCustomClick?: () => void;
  label?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}

export function DriveContextMenu({
  isOpen,
  x,
  y,
  context,
  targetItem,
  canExecute,
  onExecute,
  onInvertSelection,
  onClose,
  supportsFolderUpload = true,
}: DriveContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ left: number; top: number }>({ left: x, top: y });
  const openKey = `${isOpen}:${x}:${y}`;
  const [highlightState, setHighlightState] = useState<{ openKey: string; index: number }>({
    openKey,
    index: -1,
  });
  const activeIndex = highlightState.openKey === openKey ? highlightState.index : -1;
  const setActiveIndex = useCallback(
    (index: number) => setHighlightState({ openKey, index }),
    [openKey]
  );

  const mode: "single" | "multi" | "empty" = useMemo(() => {
    if (context.selectedItems.length > 1) return "multi";
    if (context.selectedItems.length === 1 || targetItem) return "single";
    return "empty";
  }, [context.selectedItems.length, targetItem]);

  const effectiveSingleItem = targetItem || context.selectedItems[0] || null;

  const entries: MenuEntry[] = useMemo(() => {
    if (mode === "single" && effectiveSingleItem) {
      const isFile = effectiveSingleItem.type === "file";
      const ext = (effectiveSingleItem.extension || effectiveSingleItem.name.split(".").pop() || "")
        .toLowerCase()
        .replace(/^\./, "");
      const isCad = isFile && (ext === "dwg" || ext === "dxf");
      const isStarred = Boolean(effectiveSingleItem.starred);

      const list: MenuEntry[] = [
        {
          type: "item",
          id: isFile ? "preview" : "open",
          label: isFile ? "Hızlı Bakış" : "Klasörü Aç",
          shortcut: isFile ? "Space" : "Enter",
          icon: isFile ? <Eye className="h-4 w-4" /> : <FolderOpen className="h-4 w-4" />,
          disabled: !canExecute(isFile ? "preview" : "open"),
        },
      ];

      if (isCad) {
        list.push({
          type: "item",
          id: "open-cad-v2",
          label: "Motor V2 ile Aç",
          icon: <Sparkles className="h-4 w-4 text-amber-500" />,
          disabled: !canExecute("open-cad-v2"),
        });
      }

      if (isFile) {
        list.push({
          type: "item",
          id: "download",
          label: "İndir",
          shortcut: "Ctrl+D",
          icon: <Download className="h-4 w-4" />,
          disabled: !canExecute("download"),
        });
      }

      list.push(
        {
          type: "item",
          id: "share",
          label: "Süreli Link Oluştur",
          shortcut: "Alt+S",
          icon: <Share2 className="h-4 w-4" />,
          disabled: !canExecute("share"),
        },
        { type: "separator" },
        {
          type: "item",
          id: "rename",
          label: "Yeniden Adlandır",
          shortcut: "F2",
          icon: <Edit3 className="h-4 w-4" />,
          disabled: !canExecute("rename"),
        },
        {
          type: "item",
          id: "move",
          label: "Taşı",
          shortcut: "M",
          icon: <FolderInput className="h-4 w-4" />,
          disabled: !canExecute("move"),
        },
        {
          type: "item",
          id: "cut",
          label: "Kes",
          shortcut: "Ctrl+X",
          icon: <Scissors className="h-4 w-4" />,
          disabled: !canExecute("cut"),
        },
        {
          type: "item",
          id: "copy",
          label: "Kopyala",
          shortcut: "Ctrl+C",
          icon: <Copy className="h-4 w-4" />,
          disabled: !canExecute("copy"),
        },
        {
          type: "item",
          id: isStarred ? "unstar" : "star",
          label: isStarred ? "Yıldızı Kaldır" : "Yıldızla",
          shortcut: "S",
          icon: isStarred ? (
            <StarOff className="h-4 w-4 text-amber-500" />
          ) : (
            <Star className="h-4 w-4" />
          ),
          disabled: !canExecute(isStarred ? "unstar" : "star"),
        },
        {
          type: "item",
          id: "details",
          label: "Detaylar",
          shortcut: "I",
          icon: <Info className="h-4 w-4" />,
          disabled: !canExecute("details"),
        },
        { type: "separator" },
        {
          type: "item",
          id: "trash",
          label: "Çöp Kutusuna At",
          shortcut: "Del",
          icon: <Trash2 className="h-4 w-4" />,
          danger: true,
          disabled: !canExecute("trash"),
        }
      );

      return list;
    }

    if (mode === "multi") {
      const allStarred =
        context.selectedItems.length > 0 && context.selectedItems.every((i) => Boolean(i.starred));
      const hasFiles = context.selectedItems.some((i) => i.type === "file");

      const list: MenuEntry[] = [];
      if (hasFiles) {
        list.push({
          type: "item",
          id: "download",
          label: "Dosyaları İndir",
          shortcut: "Ctrl+D",
          icon: <Download className="h-4 w-4" />,
          disabled: !canExecute("download"),
        });
      }

      list.push(
        {
          type: "item",
          id: "share",
          label: "Süreli Link Oluştur",
          shortcut: "Alt+S",
          icon: <Share2 className="h-4 w-4" />,
          disabled: !canExecute("share"),
        },
        { type: "separator" },
        {
          type: "item",
          id: "move",
          label: "Taşı",
          shortcut: "M",
          icon: <FolderInput className="h-4 w-4" />,
          disabled: !canExecute("move"),
        },
        {
          type: "item",
          id: "cut",
          label: "Kes",
          shortcut: "Ctrl+X",
          icon: <Scissors className="h-4 w-4" />,
          disabled: !canExecute("cut"),
        },
        {
          type: "item",
          id: "copy",
          label: "Kopyala",
          shortcut: "Ctrl+C",
          icon: <Copy className="h-4 w-4" />,
          disabled: !canExecute("copy"),
        },
        {
          type: "item",
          id: allStarred ? "unstar" : "star",
          label: allStarred ? "Yıldızı Kaldır" : "Yıldızla",
          shortcut: "S",
          icon: allStarred ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />,
          disabled: !canExecute(allStarred ? "unstar" : "star"),
        },
        ...(onInvertSelection
          ? [
              {
                type: "item" as const,
                customTestId: "dok-ctx-invert-selection",
                label: "Seçimi Tersine Çevir",
                icon: <RefreshCw className="h-4 w-4" />,
                onCustomClick: onInvertSelection,
              },
            ]
          : []),
        { type: "separator" },
        {
          type: "item",
          id: "trash",
          label: "Çöp Kutusuna At",
          shortcut: "Del",
          icon: <Trash2 className="h-4 w-4" />,
          danger: true,
          disabled: !canExecute("trash"),
        }
      );

      return list;
    }

    // Empty workspace context
    const emptyList: MenuEntry[] = [
      {
        type: "item",
        id: "new-folder",
        label: "Yeni Klasör",
        shortcut: "Shift+N",
        icon: <FolderPlus className="h-4 w-4" />,
        disabled: !canExecute("new-folder"),
      },
      {
        type: "item",
        id: "upload-files",
        label: "Dosya Yükle",
        shortcut: "Ctrl+U",
        icon: <FileUp className="h-4 w-4" />,
        disabled: !canExecute("upload-files"),
      },
    ];

    if (supportsFolderUpload) {
      emptyList.push({
        type: "item",
        id: "upload-folder",
        label: "Klasör Yükle",
        icon: <Layers className="h-4 w-4" />,
        disabled: !canExecute("upload-folder"),
      });
    }

    emptyList.push(
      {
        type: "item",
        id: "paste",
        label: "Yapıştır",
        shortcut: "Ctrl+V",
        icon: <ClipboardPaste className="h-4 w-4" />,
        disabled: !canExecute("paste"),
      },
      { type: "separator" },
      {
        type: "item",
        id: "select-all",
        label: "Tümünü Seç",
        shortcut: "Ctrl+A",
        icon: <CheckSquare className="h-4 w-4" />,
        disabled: !canExecute("select-all"),
      },
      {
        type: "item",
        id: "change-view",
        label: context.viewMode === "grid" ? "Liste Görünümü" : "Kart Görünümü",
        shortcut: "V",
        icon: <LayoutGrid className="h-4 w-4" />,
        disabled: !canExecute("change-view"),
      },
      {
        type: "item",
        id: "refresh",
        label: "Yenile",
        shortcut: "R",
        icon: <RefreshCw className="h-4 w-4" />,
        disabled: !canExecute("refresh"),
      }
    );

    return emptyList;
  }, [mode, effectiveSingleItem, context.selectedItems, context.viewMode, canExecute, supportsFolderUpload]);

  const actionableIndices = useMemo(
    () =>
      entries
        .map((entry, idx) => (entry.type === "item" && !entry.disabled ? idx : -1))
        .filter((idx) => idx !== -1),
    [entries]
  );

  useLayoutEffect(() => {
    if (!isOpen) return;
    const el = menuRef.current;
    if (!el) {
      setPosition({ left: x, top: y });
      return;
    }

    const rect = el.getBoundingClientRect();
    const width = Math.max(rect.width, el.offsetWidth);
    const height = Math.max(rect.height, el.offsetHeight);
    const margin = 10;
    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);
    setPosition({
      left: Math.min(Math.max(margin, x), maxLeft),
      top: Math.min(Math.max(margin, y), maxTop),
    });
  }, [isOpen, x, y, entries.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (actionableIndices.length === 0) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const currentPos = actionableIndices.indexOf(activeIndex);
        const nextPos = currentPos < 0 ? 0 : (currentPos + 1) % actionableIndices.length;
        setActiveIndex(actionableIndices[nextPos]);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const currentPos = actionableIndices.indexOf(activeIndex);
        const prevPos =
          currentPos <= 0 ? actionableIndices.length - 1 : currentPos - 1;
        setActiveIndex(actionableIndices[prevPos]);
      } else if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(actionableIndices[0]);
      } else if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(actionableIndices[actionableIndices.length - 1]);
      } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        const entry = entries[activeIndex];
        if (entry?.type === "item" && entry.id && !entry.disabled) {
          onExecute(entry.id);
          onClose();
        }
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    window.addEventListener("scroll", handleScroll, { capture: true });
    window.addEventListener("resize", onClose);
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", onClose);
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [isOpen, activeIndex, actionableIndices, entries, onExecute, onClose, setActiveIndex]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          role="menu"
          aria-label="Bağlam Menüsü"
          data-testid="dok-context-menu"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
          style={{ left: position.left, top: position.top }}
          onContextMenu={(e) => e.preventDefault()}
          className="fixed z-[900] min-w-[230px] max-w-[280px] origin-top-left rounded-xl border border-border/80 bg-popover/95 p-1.5 text-popover-foreground shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/95"
        >
          {mode === "multi" && (
            <div className="mb-1 border-b border-border/70 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:border-zinc-800 dark:text-amber-400">
              {context.selectedItems.length} öğe seçili
            </div>
          )}

          {entries.map((entry, index) => {
            if (entry.type === "separator") {
              return (
                <div
                  key={`sep-${index}`}
                  role="separator"
                  className="my-1 h-px bg-border/70 dark:bg-zinc-800"
                />
              );
            }

            const isFocused = activeIndex === index;
            const isDisabled = Boolean(entry.disabled);

            return (
              <button
                key={entry.id ?? entry.customTestId ?? index}
                type="button"
                role="menuitem"
                disabled={isDisabled}
                data-testid={entry.customTestId ?? `dok-ctx-${entry.id}`}
                onMouseEnter={() => {
                  if (!isDisabled) setActiveIndex(index);
                }}
                onClick={() => {
                  if (isDisabled) return;
                  if (entry.onCustomClick) {
                    entry.onCustomClick();
                    onClose();
                    return;
                  }
                  if (!entry.id) return;
                  onExecute(entry.id);
                  onClose();
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                  isDisabled
                    ? "cursor-not-allowed opacity-45"
                    : entry.danger
                    ? isFocused
                      ? "bg-red-500/15 text-red-600 dark:text-red-400"
                      : "text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15"
                    : isFocused
                    ? "bg-amber-500/15 text-foreground dark:bg-amber-500/20"
                    : "text-foreground hover:bg-secondary/80 dark:hover:bg-zinc-800/80"
                }`}
              >
                <span className="flex items-center gap-2.5 truncate font-medium">
                  <span className="shrink-0 opacity-85">{entry.icon}</span>
                  <span className="truncate">{entry.label}</span>
                </span>
                {entry.shortcut && (
                  <kbd className="shrink-0 rounded border border-border/60 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground dark:border-zinc-700 dark:bg-zinc-800">
                    {entry.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
