"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Command, Eye, Loader2, Search, Sparkles } from "lucide-react";
import type { DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import { normalizeTrSearch } from "@/lib/dokumantasyon/file-categories";
import { FileTypeIcon, FolderIcon } from "../file-icons";
import { formatBytes } from "../ui-helpers";
import { OverlayPortal } from "./overlay-portal";

export interface PaletteCommand {
  id: string;
  label: string;
  shortcut?: string;
  keywords?: string;
  onExecute: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: PaletteCommand[];
  recentFiles?: DokFile[];
  onNavigateFolder: (folderId: string) => void;
  onOpenFile: (file: DokFile) => void;
  onQuickLookFile?: (file: DokFile) => void;
}

type FlattenedEntry =
  | { kind: "folder"; folder: DokFolder }
  | { kind: "file"; file: DokFile }
  | { kind: "command"; command: PaletteCommand }
  | { kind: "recent"; file: DokFile };

interface SearchResultState {
  query: string;
  folders: DokFolder[];
  files: DokFile[];
  error: string | null;
}

function CommandPaletteInner({
  onClose,
  commands,
  recentFiles,
  onNavigateFolder,
  onOpenFile,
  onQuickLookFile,
  inputRef,
}: Omit<CommandPaletteProps, "isOpen" | "recentFiles"> & {
  recentFiles: DokFile[];
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResultState | null>(
    null
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const trimmed = query.trim();
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) return;

    const controller = new AbortController();

    fetch(`/api/dokumantasyon/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = (await res.json()) as {
          folders?: DokFolder[];
          files?: DokFile[];
        };
        if (!controller.signal.aborted) {
          setSearchResult({
            query: debouncedQuery,
            folders: Array.isArray(data.folders) ? data.folders : [],
            files: Array.isArray(data.files) ? data.files : [],
            error: null,
          });
          setActiveIndex(0);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setSearchResult({
            query: debouncedQuery,
            folders: [],
            files: [],
            error: "Arama sırasında bir hata oluştu.",
          });
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const activeSearch =
    debouncedQuery && searchResult?.query === debouncedQuery
      ? searchResult
      : null;
  const folders = activeSearch?.folders ?? [];
  const files = activeSearch?.files ?? [];
  const searchError = activeSearch?.error ?? null;
  const loading = Boolean(debouncedQuery) && searchResult?.query !== debouncedQuery;

  const filteredCommands = useMemo(() => {
    const q = normalizeTrSearch(query.trim());
    if (!q) return commands;
    return commands.filter((cmd) => {
      const hay = normalizeTrSearch(`${cmd.label} ${cmd.keywords || ""}`);
      return hay.includes(q);
    });
  }, [commands, query]);

  const visibleRecent = useMemo(() => {
    if (query.trim()) return [];
    return recentFiles.slice(0, 5);
  }, [query, recentFiles]);

  const flattened = useMemo<FlattenedEntry[]>(() => {
    const list: FlattenedEntry[] = [];
    for (const folder of folders) {
      list.push({ kind: "folder", folder });
    }
    for (const file of files) {
      list.push({ kind: "file", file });
    }
    for (const command of filteredCommands) {
      list.push({ kind: "command", command });
    }
    for (const file of visibleRecent) {
      list.push({ kind: "recent", file });
    }
    return list;
  }, [folders, files, filteredCommands, visibleRecent]);

  const safeActiveIndex =
    flattened.length === 0 ? 0 : Math.min(activeIndex, flattened.length - 1);

  const executeEntry = (entry: FlattenedEntry) => {
    onClose();
    if (entry.kind === "folder") {
      onNavigateFolder(entry.folder.id);
    } else if (entry.kind === "file" || entry.kind === "recent") {
      onOpenFile(entry.file);
    } else if (entry.kind === "command") {
      entry.command.onExecute();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flattened.length > 0) {
        setActiveIndex((prev) => (prev + 1) % flattened.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flattened.length > 0) {
        setActiveIndex((prev) => (prev - 1 + flattened.length) % flattened.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flattened[safeActiveIndex];
      if (target) {
        executeEntry(target);
      }
    }
  };

  let runningIdx = 0;

  return (
    <div
      data-testid="dok-dialog-content"
      className="w-[92vw] max-w-2xl overflow-hidden bg-card text-card-foreground"
    >
      <div
        data-testid="dok-command-palette"
        className="flex max-h-[75vh] flex-col"
      >
        {/* Arama Girişi */}
        <div className="relative flex items-center border-b border-border/70 px-4 py-3 pr-12">
          <Search className="mr-3 h-4 w-4 shrink-0 text-amber-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Dosya, klasör ara veya bir komut yaz..."
            aria-label="Komut paleti araması"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {loading && (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin text-amber-500" />
          )}
        </div>

        {/* Sonuçlar */}
        <div className="min-h-0 flex-1 overflow-y-auto p-2 space-y-3">
          {searchError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
              {searchError}
            </div>
          )}

          {/* 1. Dosyalar & Klasörler */}
          {(folders.length > 0 || files.length > 0) && (
            <section>
              <h3 className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Dosyalar &amp; Klasörler
              </h3>
              <div className="space-y-0.5">
                {folders.map((folder) => {
                  const idx = runningIdx++;
                  const isActive = idx === safeActiveIndex;
                  return (
                    <button
                      key={`folder-${folder.id}`}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => executeEntry({ kind: "folder", folder })}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                        isActive
                          ? "bg-amber-500/15 text-foreground"
                          : "hover:bg-secondary/60"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <FolderIcon size="list" />
                        <span className="truncate font-semibold">
                          {folder.name}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-md border border-border/70 bg-secondary/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        Klasör
                      </span>
                    </button>
                  );
                })}

                {files.map((file) => {
                  const idx = runningIdx++;
                  const isActive = idx === safeActiveIndex;
                  const ext = (file.extension || "")
                    .replace(/^\./, "")
                    .toUpperCase();
                  return (
                    <div
                      key={`file-${file.id}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors ${
                        isActive
                          ? "bg-amber-500/15 text-foreground"
                          : "hover:bg-secondary/60"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => executeEntry({ kind: "file", file })}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      >
                        <FileTypeIcon
                          extension={file.extension}
                          mimeType={file.mime_type}
                          size="list"
                        />
                        <span className="truncate font-medium">
                          {file.display_name}
                        </span>
                      </button>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {ext && (
                          <span className="rounded border border-border/70 bg-secondary/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {ext}
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {formatBytes(Number(file.size_bytes))}
                        </span>
                        {onQuickLookFile && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              onQuickLookFile(file);
                            }}
                            title="Hızlı Bakış"
                            aria-label={`${file.display_name} hızlı önizleme`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-amber-500"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 2. Hızlı Komutlar */}
          {filteredCommands.length > 0 && (
            <section>
              <h3 className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Hızlı Komutlar</span>
              </h3>
              <div className="space-y-0.5">
                {filteredCommands.map((cmd) => {
                  const idx = runningIdx++;
                  const isActive = idx === safeActiveIndex;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() =>
                        executeEntry({ kind: "command", command: cmd })
                      }
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                        isActive
                          ? "bg-amber-500/15 text-foreground"
                          : "hover:bg-secondary/60"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Command className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-medium">{cmd.label}</span>
                      </span>
                      {cmd.shortcut && (
                        <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* 3. Son Açılanlar (Sorgu Boşken) */}
          {visibleRecent.length > 0 && (
            <section>
              <h3 className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Son Açılanlar
              </h3>
              <div className="space-y-0.5">
                {visibleRecent.map((file) => {
                  const idx = runningIdx++;
                  const isActive = idx === safeActiveIndex;
                  return (
                    <button
                      key={`recent-${file.id}`}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => executeEntry({ kind: "recent", file })}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                        isActive
                          ? "bg-amber-500/15 text-foreground"
                          : "hover:bg-secondary/60"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <FileTypeIcon
                          extension={file.extension}
                          mimeType={file.mime_type}
                          size="list"
                        />
                        <span className="truncate font-medium">
                          {file.display_name}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {formatBytes(Number(file.size_bytes))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {flattened.length === 0 && !loading && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Eşleşen dosya, klasör veya komut bulunamadı.
            </div>
          )}
        </div>

        {/* Alt Kısayol İpucu */}
        <div className="flex items-center justify-between border-t border-border/70 bg-secondary/30 px-4 py-2 text-[11px] text-muted-foreground">
          <span>↑↓ Gezin · Enter Çalıştır</span>
          <span>Esc Kapat</span>
        </div>
      </div>
    </div>
  );
}

export function CommandPalette({
  isOpen,
  onClose,
  commands,
  recentFiles = [],
  onNavigateFolder,
  onOpenFile,
  onQuickLookFile,
}: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <OverlayPortal
      isOpen={isOpen}
      onClose={onClose}
      title="Komut Paleti ve Global Arama"
      presentation="dialog"
      initialFocusRef={inputRef}
    >
      {isOpen && (
        <CommandPaletteInner
          onClose={onClose}
          commands={commands}
          recentFiles={recentFiles}
          onNavigateFolder={onNavigateFolder}
          onOpenFile={onOpenFile}
          onQuickLookFile={onQuickLookFile}
          inputRef={inputRef}
        />
      )}
    </OverlayPortal>
  );
}
