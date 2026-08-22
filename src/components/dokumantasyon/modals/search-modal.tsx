"use client";

import { useState, useEffect } from "react";
import { Search, X, Loader2, Folder, ExternalLink } from "lucide-react";
import { DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import { formatBytes, getFileIcon } from "../ui-helpers";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToFolder: (folderId: string | null) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  onNavigateToFolder,
}: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    folders: DokFolder[];
    files: DokFile[];
  }>({ folders: [], files: [] });

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults({ folders: [], files: [] });
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ folders: [], files: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dokumantasyon/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (res.ok) {
          setResults({
            folders: data.folders || [],
            files: data.files || [],
          });
        }
      } catch (err) {
        console.error("Arama hatası:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalResults = results.folders.length + results.files.length;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-md animate-in fade-in sm:pt-24"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Search className="h-4 w-4" />
            </div>
            <span className="text-base">Dosya ve Klasör Ara</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Arama Inputu */}
        <div className="relative mt-4">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Dosya veya klasör adı yazın..."
            className="w-full rounded-xl border border-input bg-background/80 py-2.5 pl-10 pr-10 text-sm text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
          />
          {loading && (
            <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-amber-500" />
          )}
        </div>

        {/* Sonuç Listesi */}
        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
          {query.trim() && !loading && totalResults === 0 && (
            <div className="py-10 text-center text-xs text-muted-foreground">
              &quot;{query}&quot; ile eşleşen dosya veya klasör bulunamadı.
            </div>
          )}

          {/* Klasör Sonuçları */}
          {results.folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                onNavigateToFolder(folder.id);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background/70 p-3 text-left transition-all hover:border-amber-500/40 hover:bg-card shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Folder className="h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <div className="font-medium text-foreground text-sm truncate max-w-sm">
                    {folder.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">Klasör</div>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                <span>Klasöre Git</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}

          {/* Dosya Sonuçları */}
          {results.files.map((file) => (
            <button
              key={file.id}
              onClick={() => {
                onNavigateToFolder(file.folder_id);
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background/70 p-3 text-left transition-all hover:border-amber-500/40 hover:bg-card shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0">{getFileIcon(file.extension, file.mime_type)}</div>
                <div>
                  <div className="font-medium text-foreground text-sm truncate max-w-sm">
                    {file.display_name}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    {formatBytes(file.size_bytes)}
                  </div>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
                <span>Bulunduğu Klasöre Git</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
