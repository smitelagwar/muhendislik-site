// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PROFESSIONAL PDF.JS STUDIO VIEWER CORE
// ============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { createSecurePdfLoadingTask } from "@/lib/dokumantasyon/studio/pdf/pdfjs-loader";
import { searchInPdfDocument, PdfSearchResult } from "@/lib/dokumantasyon/studio/pdf/pdf-search";
import { PdfPageView } from "./pdf-page-view";
import { PdfThumbnailSidebar } from "./pdf-thumbnail-sidebar";
import { PdfSearchBar } from "./pdf-search-bar";
import { PdfViewerToolbar } from "./pdf-viewer-toolbar";

interface PdfJsStudioProps {
  accessUrl: string;
  displayName: string;
}

export function PdfJsStudio({ accessUrl, displayName }: PdfJsStudioProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadingTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pan / Hand Tool Durumu
  const [isHandTool, setIsHandTool] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Kenar Çubuğu
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Arama Durumu
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResult, setSearchResult] = useState<PdfSearchResult>({
    query: "",
    totalMatches: 0,
    matches: [],
    pageMatchCounts: {},
  });
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // 1. PDF Dokümanını Yükle ve Güvenli Yaşam Döngüsü Başlat
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function init() {
      try {
        const task = await createSecurePdfLoadingTask(accessUrl);
        loadingTaskRef.current = task;

        const doc = await task.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("PDF yükleme hatası:", err);
        setError(
          err instanceof Error
            ? err.message
            : "PDF dokümanı yüklenirken bir hata oluştu."
        );
        setLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
      if (loadingTaskRef.current) {
        try {
          loadingTaskRef.current.destroy?.();
        } catch {}
      }
      if (pdfDoc) {
        try {
          pdfDoc.destroy?.();
        } catch {}
      }
    };
  }, [accessUrl]);

  // 2. Sayfaya Kaydırma (Scroll to Page)
  const scrollToPage = useCallback((pageNum: number) => {
    if (pageNum < 1 || pageNum > numPages) return;
    setCurrentPage(pageNum);

    const pageEl = document.getElementById(`pdf-page-${pageNum}`);
    if (pageEl && scrollContainerRef.current) {
      pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [numPages]);

  // 3. Arama İşlevi
  useEffect(() => {
    if (!pdfDoc || !searchQuery.trim() || !isSearchOpen) {
      setSearchResult({ query: "", totalMatches: 0, matches: [], pageMatchCounts: {} });
      setCurrentMatchIndex(0);
      return;
    }

    let isCurrent = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchInPdfDocument(pdfDoc, searchQuery);
        if (!isCurrent) return;

        setSearchResult(res);
        setCurrentMatchIndex(0);

        if (res.matches.length > 0) {
          scrollToPage(res.matches[0].pageNumber);
        }
      } finally {
        if (isCurrent) setIsSearching(false);
      }
    }, 200);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [pdfDoc, searchQuery, isSearchOpen, scrollToPage]);

  const handleNextMatch = () => {
    if (searchResult.totalMatches === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchResult.totalMatches;
    setCurrentMatchIndex(nextIdx);
    scrollToPage(searchResult.matches[nextIdx].pageNumber);
  };

  const handlePrevMatch = () => {
    if (searchResult.totalMatches === 0) return;
    const prevIdx =
      (currentMatchIndex - 1 + searchResult.totalMatches) % searchResult.totalMatches;
    setCurrentMatchIndex(prevIdx);
    scrollToPage(searchResult.matches[prevIdx].pageNumber);
  };

  // 4. Ctrl + Wheel İmleç Odaklı Yakınlaştırma (Cursor Anchor Zoom)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        setScale((prev) => {
          const next = Math.min(Math.max(prev + delta, 0.25), 5.0);
          return parseFloat(next.toFixed(2));
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // 5. Klavye Kısayolları (Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Eğer bir input veya textarea içindeyse ele geçirme
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setScale((s) => Math.min(s + 0.2, 5.0));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        setScale((s) => Math.max(s - 0.2, 0.25));
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        handleFitPage();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "1") {
        e.preventDefault();
        setScale(1.0);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        setRotation((r) => (r + 90) % 360);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrint();
      } else if (e.key === "PageUp") {
        e.preventDefault();
        scrollToPage(Math.max(currentPage - 1, 1));
      } else if (e.key === "PageDown") {
        e.preventDefault();
        scrollToPage(Math.min(currentPage + 1, numPages));
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToPage(1);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToPage(numPages);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, numPages, scrollToPage]);

  // 6. Genişliğe / Sayfaya Sığdırma Hesaplamaları
  const handleFitWidth = () => {
    if (!scrollContainerRef.current) return;
    const containerWidth = scrollContainerRef.current.clientWidth - 80;
    // Standart A4 genişliği (595 pt) bazlı deterministik oran
    const targetScale = Math.min(Math.max(containerWidth / 595, 0.4), 4.0);
    setScale(parseFloat(targetScale.toFixed(2)));
  };

  const handleFitPage = () => {
    if (!scrollContainerRef.current) return;
    const containerHeight = scrollContainerRef.current.clientHeight - 80;
    // Standart A4 yüksekliği (842 pt) bazlı deterministik oran
    const targetScale = Math.min(Math.max(containerHeight / 842, 0.4), 4.0);
    setScale(parseFloat(targetScale.toFixed(2)));
  };

  const handlePrint = () => {
    window.print();
  };

  // 7. Pan / Fare ile Kaydırma (Hand Tool)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isHandTool || !scrollContainerRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX + scrollContainerRef.current.scrollLeft,
      y: e.clientY + scrollContainerRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isHandTool || !scrollContainerRef.current) return;
    scrollContainerRef.current.scrollLeft = dragStart.x - e.clientX;
    scrollContainerRef.current.scrollTop = dragStart.y - e.clientY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const currentMatch = searchResult.matches[currentMatchIndex];

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* 1. PDF Studio Toolbar */}
      <PdfViewerToolbar
        numPages={numPages}
        currentPage={currentPage}
        scale={scale}
        isSidebarOpen={isSidebarOpen}
        isHandTool={isHandTool}
        isSearchOpen={isSearchOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onPageChange={scrollToPage}
        onSetHandTool={setIsHandTool}
        onZoomIn={() => setScale((s) => Math.min(s + 0.2, 5.0))}
        onZoomOut={() => setScale((s) => Math.max(s - 0.2, 0.25))}
        onZoom100={() => setScale(1.0)}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        onRotateView={() => setRotation((r) => (r + 90) % 360)}
        onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
        onPrint={handlePrint}
      />

      {/* 2. Doküman İçi Arama Çubuğu */}
      <PdfSearchBar
        isOpen={isSearchOpen}
        searchQuery={searchQuery}
        totalMatches={searchResult.totalMatches}
        currentMatchIndex={currentMatchIndex}
        isSearching={isSearching}
        onQueryChange={setSearchQuery}
        onNextMatch={handleNextMatch}
        onPrevMatch={handlePrevMatch}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* 3. Ana Çalışma Alanı (Kenar Çubuğu + Sürekli Dikey Kaydırma Sayfaları) */}
      <div className="relative flex flex-1 overflow-hidden min-h-0">
        {/* Sol Kenar Çubuğu (Thumbnails) */}
        <PdfThumbnailSidebar
          pdfDoc={pdfDoc}
          numPages={numPages}
          currentPage={currentPage}
          isOpen={isSidebarOpen}
          onSelectPage={scrollToPage}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Yükleniyor ve Hata Durumları */}
        {loading && (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-9 w-9 animate-spin text-amber-500 mb-3" />
            <span className="text-sm font-medium text-zinc-300">
              PDF dokümanı ve katmanlar hazırlanıyor...
            </span>
          </div>
        )}

        {error && (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-red-950/30 p-6 text-center text-red-400 shadow-2xl backdrop-blur-md">
              <AlertCircle className="mx-auto h-9 w-9 text-red-500 mb-2" />
              <h3 className="text-sm font-bold text-red-200">PDF Yükleme Hatası</h3>
              <p className="mt-1 text-xs text-zinc-400">{error}</p>
            </div>
          </div>
        )}

        {/* Sürekli Dikey Kaydırma (Continuous Vertical Scroll Workspace) */}
        {!loading && !error && pdfDoc && (
          <div
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`flex-1 overflow-auto p-4 sm:p-8 bg-zinc-900/60 ${
              isHandTool
                ? isDragging
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : "cursor-default"
            }`}
          >
            <div className="flex flex-col items-center min-w-max mx-auto py-2">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                <PdfPageView
                  key={pageNum}
                  pdfDoc={pdfDoc}
                  pageNumber={pageNum}
                  scale={scale}
                  rotation={rotation}
                  isHandTool={isHandTool}
                  searchQuery={isSearchOpen ? searchQuery : ""}
                  isCurrentMatchPage={currentMatch?.pageNumber === pageNum}
                  onPageVisible={(visiblePage) => {
                    setCurrentPage(visiblePage);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
