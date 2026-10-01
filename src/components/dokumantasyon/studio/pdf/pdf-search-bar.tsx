// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF SEARCH BAR (FAZ E: İLERİ DÜZEY ARAMA VE SEÇENEKLER)
// ============================================================================

"use client";

import React, { useRef, useEffect, useState } from "react";
import { Search, ChevronUp, ChevronDown, X, Loader2, SlidersHorizontal, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchOpts } from "@/lib/dokumantasyon/studio/pdf/pdf-search-engine";

interface PdfSearchBarProps {
  isOpen: boolean;
  searchQuery: string;
  totalMatches: number;
  currentMatchIndex: number;
  isSearching: boolean;
  isSnippetPanelOpen?: boolean;
  isScannedPdf?: boolean;
  overflow?: boolean;
  searchOpts?: SearchOpts;
  onSearchOptsChange?: (opts: SearchOpts) => void;
  onQueryChange: (q: string) => void;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onToggleSnippetPanel?: () => void;
  onClose: () => void;
}

export function PdfSearchBar({
  isOpen,
  searchQuery,
  totalMatches,
  currentMatchIndex,
  isSearching,
  isSnippetPanelOpen,
  isScannedPdf = false,
  overflow = false,
  searchOpts = { caseSensitive: false, matchDiacritics: false, wholeWord: false },
  onSearchOptsChange,
  onQueryChange,
  onNextMatch,
  onPrevMatch,
  onToggleSnippetPanel,
  onClose,
}: PdfSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showOpts, setShowOpts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShowOpts(false);
    onClose();
    setTimeout(() => {
      const searchTrigger = document.querySelector<HTMLElement>('button[data-command-id="pdf.search.open"]');
      searchTrigger?.focus();
    }, 0);
  };

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (showOpts) {
        setShowOpts(false);
      } else {
        handleClose();
      }
    }
  };

  const toggleOption = (key: keyof SearchOpts) => {
    if (!onSearchOptsChange) return;
    onSearchOptsChange({
      ...searchOpts,
      [key]: !searchOpts[key],
    });
  };

  return (
    <div
      role="search"
      aria-label="Doküman içi metin arama"
      data-testid="pdf-search-bar"
      className="absolute top-14 sm:top-16 right-4 z-40 flex flex-col items-end gap-1.5 select-none print:hidden"
    >
      {/* Taranmış PDF Uyarısı (Faz E Kriteri) */}
      {isScannedPdf && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-zinc-900/95 text-amber-400 text-xs shadow-xl backdrop-blur-md animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
          <span>Bu PDF taranmış görüntü içeriyor, metin araması yapılamaz.</span>
        </div>
      )}

      {/* Ana Arama Çubuğu */}
      <div className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
          <Input
            ref={inputRef}
            type="text"
            role="searchbox"
            aria-label="Dokümanda ara"
            placeholder="Dokümanda ara..."
            value={searchQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 w-44 sm:w-56 pl-8 pr-16 text-xs bg-zinc-950/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-500 rounded-lg"
          />

          {/* Eşleşme Sayısı / Arama İlerlemesi (Faz I: aria-live polite) */}
          <div
            className="absolute right-2 text-[10px] font-mono text-zinc-400 pointer-events-none"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="sr-only">
              {isSearching
                ? "Aranıyor..."
                : searchQuery.trim()
                ? totalMatches > 0
                  ? `${totalMatches} eşleşmeden ${currentMatchIndex + 1}. gösteriliyor`
                  : "Eşleşme bulunamadı"
                : ""}
            </span>
            <span aria-hidden="true">
              {isSearching ? (
                <span className="flex items-center gap-1 text-amber-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {totalMatches > 0 && `${totalMatches}+`}
                </span>
              ) : searchQuery.trim() ? (
                totalMatches > 0 ? (
                  `${currentMatchIndex + 1}/${totalMatches}${overflow ? "+" : ""}`
                ) : (
                  "0/0"
                )
              ) : null}
            </span>
          </div>
        </div>

        {/* Seçenekler Düğmesi */}
        {onSearchOptsChange && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowOpts((prev) => !prev)}
            className={`h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md ${
              showOpts || searchOpts.caseSensitive || searchOpts.matchDiacritics || searchOpts.wholeWord
                ? "text-amber-500 bg-amber-500/10"
                : ""
            }`}
            title="Arama Seçenekleri"
            aria-label="Arama Seçenekleri"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Gezinme Butonları */}
        <Button
          size="sm"
          variant="ghost"
          disabled={totalMatches === 0}
          onClick={onPrevMatch}
          data-command-id="pdf.search.prev"
          className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 rounded-md"
          title="Önceki Eşleşme (Shift+Enter)"
          aria-label="Önceki Eşleşme"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          disabled={totalMatches === 0}
          onClick={onNextMatch}
          data-command-id="pdf.search.next"
          className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 rounded-md"
          title="Sonraki Eşleşme (Enter)"
          aria-label="Sonraki Eşleşme"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        {onToggleSnippetPanel && (
          <Button
            size="sm"
            variant="ghost"
            disabled={totalMatches === 0}
            onClick={onToggleSnippetPanel}
            className={`h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 rounded-md ${
              isSnippetPanelOpen ? "text-amber-500 bg-amber-500/15 hover:bg-amber-500/20" : ""
            }`}
            title="Tüm Sonuçları Listele"
            aria-label="Sonuç Listesi"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
        )}

        <div className="h-4 w-px bg-zinc-800 mx-0.5" />

        <Button
          size="sm"
          variant="ghost"
          onClick={handleClose}
          className="h-7 w-7 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"
          title="Kapat (Esc)"
          aria-label="Aramayı Kapat"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Arama Seçenekleri Açılır Menüsü */}
      {showOpts && onSearchOptsChange && (
        <div className="flex flex-col gap-1.5 p-2 rounded-xl border border-zinc-700 bg-zinc-900/95 shadow-2xl backdrop-blur-md text-xs text-zinc-200 animate-in fade-in slide-in-from-top-1 w-56">
          <label className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-zinc-800/60 cursor-pointer">
            <span>Büyük/küçük harf duyarlı</span>
            <input
              type="checkbox"
              checked={!!searchOpts.caseSensitive}
              onChange={() => toggleOption("caseSensitive")}
              className="rounded accent-amber-500"
            />
          </label>
          <label className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-zinc-800/60 cursor-pointer">
            <span>Türkçe harflere duyarlı (I ≠ İ)</span>
            <input
              type="checkbox"
              checked={!!searchOpts.matchDiacritics}
              onChange={() => toggleOption("matchDiacritics")}
              className="rounded accent-amber-500"
            />
          </label>
          <label className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-zinc-800/60 cursor-pointer">
            <span>Tam kelime</span>
            <input
              type="checkbox"
              checked={!!searchOpts.wholeWord}
              onChange={() => toggleOption("wholeWord")}
              className="rounded accent-amber-500"
            />
          </label>
        </div>
      )}
    </div>
  );
}
