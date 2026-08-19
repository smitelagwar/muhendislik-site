// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF SEARCH BAR (IN-DOCUMENT SEARCH)
// ============================================================================

"use client";

import React, { useRef, useEffect } from "react";
import { Search, ChevronUp, ChevronDown, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PdfSearchBarProps {
  isOpen: boolean;
  searchQuery: string;
  totalMatches: number;
  currentMatchIndex: number;
  isSearching: boolean;
  onQueryChange: (q: string) => void;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onClose: () => void;
}

export function PdfSearchBar({
  isOpen,
  searchQuery,
  totalMatches,
  currentMatchIndex,
  isSearching,
  onQueryChange,
  onNextMatch,
  onPrevMatch,
  onClose,
}: PdfSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

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
      onClose();
    }
  };

  return (
    <div
      data-command-id="pdf.search.open"
      className="absolute top-14 right-4 z-40 flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900/95 p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 select-none"
    >
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 h-3.5 w-3.5 text-zinc-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Dokümanda ara..."
          value={searchQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 w-44 sm:w-56 pl-8 pr-16 text-xs bg-zinc-950/80 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-amber-500 rounded-lg"
        />

        {/* Eşleşme Sayısı */}
        <div className="absolute right-2 text-[10px] font-mono text-zinc-400 pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
          ) : searchQuery.trim() ? (
            totalMatches > 0 ? (
              `${currentMatchIndex + 1}/${totalMatches}`
            ) : (
              "0/0"
            )
          ) : null}
        </div>
      </div>

      {/* Gezinme Butonları */}
      <Button
        size="sm"
        variant="ghost"
        disabled={totalMatches === 0}
        onClick={onPrevMatch}
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
        className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 rounded-md"
        title="Sonraki Eşleşme (Enter)"
        aria-label="Sonraki Eşleşme"
      >
        <ChevronDown className="h-4 w-4" />
      </Button>

      <div className="h-4 w-px bg-zinc-800 mx-0.5" />

      <Button
        size="sm"
        variant="ghost"
        onClick={onClose}
        className="h-7 w-7 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"
        title="Kapat (Esc)"
        aria-label="Aramayı Kapat"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
