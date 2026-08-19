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

  if (!isOpen) return null;

  const totalResults = results.folders.length + results.files.length;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-sm sm:pt-24"
    >
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Search className="h-5 w-5 text-amber-500" />
            <span>Dosya ve Klasör Ara</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
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
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-10 text-sm text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          {loading && (
            <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Sonuç Listesi */}
        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
          {query.trim() && !loading && totalResults === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              "{query}" ile eşleşen dosya veya klasör bulunamadı.
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
              className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-amber-500/40 hover:bg-card"
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
              <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
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
              className="flex w-full items-center justify-between rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-amber-500/40 hover:bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0">{getFileIcon(file.extension, file.mime_type)}</div>
                <div>
                  <div className="font-medium text-foreground text-sm truncate max-w-sm">
                    {file.display_name}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatBytes(file.size_bytes)}
                  </div>
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
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
