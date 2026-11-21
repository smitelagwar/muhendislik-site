"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Folder, ExternalLink, Eye, AlertCircle } from "lucide-react";
import { DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import { formatBytes, getFileIcon } from "../ui-helpers";
import { OverlayPortal } from "../drive-v3/overlay-portal";

type SearchTypeFilter = "all" | "folder" | "cad" | "pdf" | "image" | "other";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToFolder: (folderId: string | null) => void;
  onPreviewFile?: (file: DokFile) => void;
}

const TYPE_CHIPS: Array<{ id: SearchTypeFilter; label: string }> = [
  { id: "all", label: "Tümü" },
  { id: "folder", label: "Klasör" },
  { id: "cad", label: "CAD" },
  { id: "pdf", label: "PDF" },
  { id: "image", label: "Görsel" },
  { id: "other", label: "Diğer" },
];

const CAD_EXTENSIONS = new Set(["dwg", "dxf", "dwf", "ifc", "rvt", "step", "stp", "iges", "igs"]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp", "tif", "tiff"]);

function classifyFileType(file: DokFile): Exclude<SearchTypeFilter, "all" | "folder"> {
  const ext = (file.extension || "").toLowerCase().replace(/^\./, "");
  const mime = (file.mime_type || "").toLowerCase();
  if (CAD_EXTENSIONS.has(ext)) return "cad";
  if (ext === "pdf" || mime.includes("pdf")) return "pdf";
  if (IMAGE_EXTENSIONS.has(ext) || mime.startsWith("image/")) return "image";
  return "other";
}

function renderHighlightedText(text: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return text;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <mark key={idx} className="rounded bg-amber-500/25 px-0.5 text-foreground font-semibold">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function SearchModal({
  isOpen,
  onClose,
  onNavigateToFolder,
  onPreviewFile,
}: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<SearchTypeFilter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [results, setResults] = useState<{
    folders: DokFolder[];
    files: DokFile[];
  }>({ folders: [], files: [] });

  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setTypeFilter("all");
      setActiveIndex(0);
      setError(null);
      setResults({ folders: [], files: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!query.trim()) {
      setResults({ folders: [], files: [] });
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dokumantasyon/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!controller.signal.aborted && res.ok) {
          setResults({
            folders: data.folders || [],
            files: data.files || [],
          });
          setActiveIndex(0);
        } else if (!controller.signal.aborted && !res.ok) {
          setError("Arama sırasında bir hata oluştu.");
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Arama bağlantısı başarısız oldu.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, isOpen]);

  const filteredFolders = useMemo(() => {
    if (typeFilter !== "all" && typeFilter !== "folder") return [];
    return results.folders;
  }, [results.folders, typeFilter]);

  const filteredFiles = useMemo(() => {
    if (typeFilter === "folder") return [];
    if (typeFilter === "all") return results.files;
    return results.files.filter((file) => classifyFileType(file) === typeFilter);
  }, [results.files, typeFilter]);

  const flatEntries = useMemo(() => {
    return [
      ...filteredFolders.map((folder) => ({ kind: "folder" as const, folder })),
      ...filteredFiles.map((file) => ({ kind: "file" as const, file })),
    ];
  }, [filteredFolders, filteredFiles]);

  useEffect(() => {
    setActiveIndex(0);
  }, [typeFilter]);

  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  if (!isOpen) return null;

  const openFilePreview = (file: DokFile) => {
    if (onPreviewFile) {
      onPreviewFile(file);
    } else {
      router.push(`/dokumantasyon/dosya/${file.id}`);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (flatEntries.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, flatEntries.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      const target = flatEntries[activeIndex];
      if (!target) return;
      e.preventDefault();
      if (target.kind === "folder") {
        onNavigateToFolder(target.folder.id);
        onClose();
      } else {
        openFilePreview(target.file);
      }
    }
  };

  const totalResults = flatEntries.length;

  return (
    <OverlayPortal isOpen={isOpen} onClose={onClose} title="Dosya ve Klasör Ara" initialFocusRef={inputRef}>
      <div
        data-testid="dok-dialog-content"
        onKeyDown={handleKeyDown}
        className="w-full max-w-2xl rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-center border-b border-border/60 pb-3.5 pr-10">
          <div className="flex items-center gap-2.5 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Search className="h-4 w-4" />
            </div>
            <span className="text-base">Dosya ve Klasör Ara</span>
          </div>
        </div>

        {/* Arama Inputu */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dosya veya klasör adı yazın..."
            aria-label="Dosya veya klasör ara"
            className="w-full rounded-xl border border-input bg-background/80 py-2.5 pl-10 pr-10 text-sm text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
          />
          {loading && (
            <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin motion-reduce:animate-none text-amber-500" />
          )}
        </div>

        {/* Tür Filtre Çipleri */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Dosya türü filtresi">
          {TYPE_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setTypeFilter(chip.id)}
              aria-pressed={typeFilter === chip.id}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                typeFilter === chip.id
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                  : "border-border/70 bg-background/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sonuç Listesi */}
        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1" role="listbox" aria-label="Arama sonuçları">
          {query.trim() && !loading && totalResults === 0 && (
            <div className="py-10 text-center text-xs text-muted-foreground">
              &quot;{query}&quot; ile eşleşen dosya veya klasör bulunamadı.
            </div>
          )}

          {/* Klasör Sonuçları */}
          {filteredFolders.map((folder, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={folder.id}
                ref={(el) => { itemRefs.current[idx] = el; }}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => {
                  onNavigateToFolder(folder.id);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all shadow-sm ${
                  isSelected
                    ? "border-amber-500/60 bg-amber-500/10"
                    : "border-border/70 bg-background/70 hover:border-amber-500/40 hover:bg-card"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Folder className="h-5 w-5 shrink-0 text-amber-500" />
                  <div className="min-w-0">
                    <div className="font-medium text-foreground text-sm truncate max-w-sm">
                      {renderHighlightedText(folder.name, query)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Klasör</div>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-amber-500 font-semibold">
                  <span>Klasöre Git</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </button>
            );
          })}

          {/* Dosya Sonuçları */}
          {filteredFiles.map((file, fileIdx) => {
            const flatIdx = filteredFolders.length + fileIdx;
            const isSelected = flatIdx === activeIndex;
            return (
              <div
                key={file.id}
                ref={(el) => { itemRefs.current[flatIdx] = el; }}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(flatIdx)}
                className={`flex flex-col gap-2 rounded-xl border p-3 transition-all shadow-sm sm:flex-row sm:items-center sm:justify-between ${
                  isSelected
                    ? "border-amber-500/60 bg-amber-500/10"
                    : "border-border/70 bg-background/70 hover:border-amber-500/40 hover:bg-card"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0">{getFileIcon(file.extension, file.mime_type)}</div>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground text-sm truncate max-w-sm">
                      {renderHighlightedText(file.display_name, query)}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {formatBytes(file.size_bytes)}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openFilePreview(file)}
                    className="inline-flex items-center gap-1 rounded-lg bg-amber-500/15 px-2.5 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Önizle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToFolder(file.folder_id);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/80 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Klasöre Git</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </OverlayPortal>
  );
}
