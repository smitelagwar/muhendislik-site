// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF ARAMA SONUÇLARI SNIPPET LİSTESİ PANELİ (FAZ E)
// ============================================================================

"use client";

import React from "react";
import { Search, X, ChevronRight, FileText, AlertCircle } from "lucide-react";
import { SearchProgress, SearchMatch } from "@/lib/dokumantasyon/studio/pdf/pdf-search-engine";

interface PdfSearchResultsPanelProps {
  isOpen: boolean;
  searchResult: SearchProgress;
  currentMatchIndex: number;
  onSelectMatch: (globalIndex: number) => void;
  onClose: () => void;
}

export function PdfSearchResultsPanel({
  isOpen,
  searchResult,
  currentMatchIndex,
  onSelectMatch,
  onClose,
}: PdfSearchResultsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobil Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-30 sm:hidden backdrop-blur-xs animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="region"
        aria-label="Arama sonuçları listesi"
        className="fixed inset-x-0 bottom-0 max-h-[55vh] z-40 sm:relative sm:inset-auto sm:max-h-full sm:z-20 flex w-full sm:w-72 shrink-0 flex-col overflow-hidden border-t sm:border-t-0 sm:border-r border-border bg-card/95 backdrop-blur-md select-none text-foreground rounded-t-2xl sm:rounded-none shadow-2xl sm:shadow-none animate-in slide-in-from-bottom sm:slide-in-from-left duration-200"
      >
        {/* Mobil Çekme Çubuğu */}
        <div className="flex justify-center pt-2 sm:hidden">
          <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Panel Başlığı */}
        <div className="flex h-11 items-center justify-between border-b border-border px-3">
          <div className="flex items-center gap-2 min-w-0">
            <Search className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-xs font-bold truncate">
              Arama Sonuçları ({searchResult.totalMatches}
              {searchResult.overflow ? "+" : ""})
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
            aria-label="Arama panelini kapat"
            title="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Arama Terimi ve İlerleme Bilgisi */}
        {searchResult.query && (
          <div className="px-3 py-1.5 bg-muted/40 border-b border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
            <span className="truncate">
              Aranan: &ldquo;<strong className="text-foreground">{searchResult.query}</strong>&rdquo;
            </span>
            <span className="font-mono text-[10px] shrink-0 text-amber-500 font-bold ml-2">
              {searchResult.totalMatches > 0
                ? `${currentMatchIndex + 1} / ${searchResult.totalMatches}${searchResult.overflow ? "+" : ""}`
                : "0"}
            </span>
          </div>
        )}

        {/* Taranmış PDF Uyarısı */}
        {searchResult.isScannedPdf && (
          <div className="flex items-start gap-2 m-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Bu PDF taranmış görüntü içeriyor, metin araması yapılamaz.</span>
          </div>
        )}

        {/* Sonuç Listesi */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 space-y-1.5">
          {searchResult.totalMatches === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground">
              <Search className="h-8 w-8 mb-2 opacity-25" />
              <p className="text-xs font-medium">Eşleşen sonuç bulunamadı.</p>
              <p className="text-[11px] opacity-70 mt-1">Farklı bir kelime deneyebilirsiniz.</p>
            </div>
          ) : (
            searchResult.matches.map((match: SearchMatch, idx: number) => {
              const isActive = idx === currentMatchIndex;
              return (
                <div
                  key={`${match.pageNumber}-${match.matchIndexInPage}-${idx}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectMatch(idx)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectMatch(idx);
                    }
                  }}
                  className={`group flex flex-col gap-1 p-2 rounded-xl cursor-pointer border transition-all ${
                    isActive
                      ? "bg-amber-500/15 border-amber-500 shadow-xs shadow-amber-500/10"
                      : "border-border/60 hover:bg-muted/70 hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileText className={`h-3 w-3 ${isActive ? "text-amber-500" : "text-muted-foreground"}`} />
                      <span className={`text-[11px] font-mono font-bold ${isActive ? "text-amber-500" : "text-foreground"}`}>
                        Sayfa {match.pageNumber}
                      </span>
                    </div>
                    <ChevronRight className={`h-3 w-3 transition-transform ${isActive ? "text-amber-500 translate-x-0.5" : "text-muted-foreground opacity-0 group-hover:opacity-100"}`} />
                  </div>
                  <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2 pl-4">
                    <span>{match.snippet.before}</span>
                    <strong className="text-amber-500 font-bold bg-amber-500/10 px-0.5 rounded-xs">
                      {match.snippet.hit}
                    </strong>
                    <span>{match.snippet.after}</span>
                  </p>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
