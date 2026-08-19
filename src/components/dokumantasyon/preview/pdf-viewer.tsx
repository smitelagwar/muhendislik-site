// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GÜVENLİ TAM PDF GÖRÜNTÜLEYİCİ (PDF VIEWER)
// ============================================================================

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Hand,
  MousePointer,
  Loader2,
  AlertCircle,
  Sidebar,
  FileText,
  X,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DokPdfViewerProps {
  accessUrl: string;
  displayName: string;
}

// Browser PDF.js yükleyici
async function loadPdfJsLib(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("pdfjs-dist-script");
    if (existing) {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
      } else {
        existing.addEventListener("load", () => resolve((window as any).pdfjsLib));
        existing.addEventListener("error", () => reject(new Error("PDF.js yüklenemedi")));
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "pdfjs-dist-script";
    script.src = "/vendor/pdfjs/pdf.min.js";
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.js";
        resolve(pdfjs);
      } else {
        reject(new Error("pdfjsLib bulunamadı"));
      }
    };
    script.onerror = () => {
      // Fallback CDN
      const cdnScript = document.createElement("script");
      cdnScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      cdnScript.onload = () => {
        const cdnPdfjs = (window as any).pdfjsLib;
        if (cdnPdfjs) {
          cdnPdfjs.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve(cdnPdfjs);
        } else {
          reject(new Error("CDN PDF.js yüklenemedi"));
        }
      };
      cdnScript.onerror = () => reject(new Error("PDF.js kütüphanesi yüklenemedi"));
      document.head.appendChild(cdnScript);
    };
    document.head.appendChild(script);
  });
}

export function DokPdfViewer({ accessUrl, displayName }: DokPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Araçlar ve Kenar Çubuğu
  const [isHandTool, setIsHandTool] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState<boolean>(false);

  // Arama
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [searchIndex, setSearchIndex] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Sürükleme (Pan / Hand Tool) Durumu
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. PDF Dokümanını Yükle
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    async function initPdf() {
      try {
        const pdfjs = await loadPdfJsLib();
        if (!pdfjs) throw new Error("PDF.js kütüphanesi başlatılamadı.");

        const loadingTask = pdfjs.getDocument({
          url: accessUrl,
          isEvalSupported: false, // CVE-2024-4367 Güvenlik Koruması
          cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
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

    initPdf();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [accessUrl]);

  // 2. Aktif Sayfayı Canvas'a Render Et
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale, rotation });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

      const renderContext = {
        canvasContext: context,
        transform,
        viewport,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
    } catch (err: any) {
      if (err?.name !== "RenderingCancelledException") {
        console.error("Sayfa render hatası:", err);
      }
    }
  }, [pdfDoc, currentPage, scale, rotation]);

  useEffect(() => {
    renderCurrentPage();
  }, [renderCurrentPage]);

  // 3. Küçük Önizlemeler (Thumbnails) Oluşturma
  useEffect(() => {
    if (!isSidebarOpen || !pdfDoc || thumbnails.length > 0) return;

    let isMounted = true;
    setLoadingThumbnails(true);

    async function generateThumbnails() {
      const thumbs: string[] = [];
      try {
        for (let i = 1; i <= Math.min(numPages, 30); i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.2 });
          const thumbCanvas = document.createElement("canvas");
          thumbCanvas.width = viewport.width;
          thumbCanvas.height = viewport.height;
          const ctx = thumbCanvas.getContext("2d");
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            thumbs.push(thumbCanvas.toDataURL());
          }
        }
        if (isMounted) {
          setThumbnails(thumbs);
          setLoadingThumbnails(false);
        }
      } catch {
        if (isMounted) setLoadingThumbnails(false);
      }
    }

    generateThumbnails();

    return () => {
      isMounted = false;
    };
  }, [isSidebarOpen, pdfDoc, numPages, thumbnails.length]);

  // 4. Metin Arama İşlevi
  const handleSearch = async () => {
    if (!pdfDoc || !searchQuery.trim()) return;

    setIsSearching(true);
    const results: number[] = [];
    const query = searchQuery.toLowerCase().trim();

    try {
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const fullText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .toLowerCase();

        if (fullText.includes(query)) {
          results.push(i);
        }
      }

      setSearchResults(results);
      if (results.length > 0) {
        setSearchIndex(0);
        setCurrentPage(results[0]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleNextSearch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (searchIndex + 1) % searchResults.length;
    setSearchIndex(nextIdx);
    setCurrentPage(searchResults[nextIdx]);
  };

  const handlePrevSearch = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (searchIndex - 1 + searchResults.length) % searchResults.length;
    setSearchIndex(prevIdx);
    setCurrentPage(searchResults[prevIdx]);
  };

  // 5. Genişliğe ve Sayfaya Sığdırma
  const handleFitWidth = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 64;
    const currentCanvasWidth = parseInt(canvasRef.current.style.width, 10) || 600;
    const ratio = containerWidth / currentCanvasWidth;
    setScale((prev) => Math.min(Math.max(prev * ratio, 0.4), 4.0));
  };

  const handleFitPage = () => {
    if (!containerRef.current || !canvasRef.current) return;
    const containerHeight = containerRef.current.clientHeight - 64;
    const currentCanvasHeight = parseInt(canvasRef.current.style.height, 10) || 800;
    const ratio = containerHeight / currentCanvasHeight;
    setScale((prev) => Math.min(Math.max(prev * ratio, 0.4), 4.0));
  };

  // 6. Pan (Sürükleme) Olayları
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isHandTool || !containerRef.current) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX + containerRef.current.scrollLeft,
      y: e.clientY + containerRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isHandTool || !containerRef.current) return;
    containerRef.current.scrollLeft = dragStart.x - e.clientX;
    containerRef.current.scrollTop = dragStart.y - e.clientY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex h-full min-h-[600px] w-full flex-col bg-zinc-950 text-zinc-100 select-none">
      {/* PDF Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs backdrop-blur-md">
        {/* Sol Alan: Kenar Çubuğu, Sayfa Kontrolleri */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className={`h-8 w-8 p-0 ${isSidebarOpen ? "bg-amber-500/20 text-amber-400" : "text-zinc-400 hover:text-zinc-100"}`}
            title="Sayfa Küçük Resimleri (Thumbnail Sidebar)"
          >
            <Sidebar className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-zinc-700 mx-0.5" />

          {/* Sayfa Gezintisi */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage <= 1}
            className="h-8 w-7 p-0 text-zinc-400 disabled:opacity-30"
            title="İlk Sayfa"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage <= 1}
            className="h-8 w-7 p-0 text-zinc-400 disabled:opacity-30"
            title="Önceki Sayfa"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 text-xs">
            <input
              type="number"
              min={1}
              max={numPages || 1}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= numPages) {
                  setCurrentPage(val);
                }
              }}
              className="h-7 w-12 rounded border border-zinc-700 bg-zinc-800 px-1 text-center text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
            />
            <span className="text-zinc-400 font-medium">/ {numPages || "—"}</span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, numPages))}
            disabled={currentPage >= numPages}
            className="h-8 w-7 p-0 text-zinc-400 disabled:opacity-30"
            title="Sonraki Sayfa"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCurrentPage(numPages)}
            disabled={currentPage >= numPages}
            className="h-8 w-7 p-0 text-zinc-400 disabled:opacity-30"
            title="Son Sayfa"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Orta/Sağ Alan: Zoom, Döndürme, Arama, El Aracı */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Arama Butonu */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={`h-8 w-8 p-0 ${isSearchOpen ? "bg-amber-500/20 text-amber-400" : "text-zinc-400 hover:text-zinc-100"}`}
            title="Doküman İçinde Ara"
          >
            <Search className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-zinc-700 mx-0.5" />

          {/* El (Pan) Aracı / Seçim Aracı */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsHandTool(false)}
            className={`h-8 w-8 p-0 ${!isHandTool ? "bg-amber-500/20 text-amber-400" : "text-zinc-400 hover:text-zinc-100"}`}
            title="Metin Seçim İmleci"
          >
            <MousePointer className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsHandTool(true)}
            className={`h-8 w-8 p-0 ${isHandTool ? "bg-amber-500/20 text-amber-400" : "text-zinc-400 hover:text-zinc-100"}`}
            title="Kaydırma / El Aracı (Pan)"
          >
            <Hand className="h-3.5 w-3.5" />
          </Button>

          <div className="h-4 w-px bg-zinc-700 mx-0.5" />

          {/* Zoom Kontrolleri */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setScale((s) => Math.max(s - 0.2, 0.4))}
            className="h-8 w-7 p-0 text-zinc-400 hover:text-zinc-100"
            title="Uzaklaştır (%-20)"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="min-w-[44px] text-center text-[11px] font-medium text-zinc-300">
            {Math.round(scale * 100)}%
          </span>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setScale((s) => Math.min(s + 0.2, 4.0))}
            className="h-8 w-7 p-0 text-zinc-400 hover:text-zinc-100"
            title="Yakınlaştır (%+20)"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleFitWidth}
            className="hidden sm:inline-flex h-8 px-2 text-[11px] text-zinc-400 hover:text-zinc-100"
            title="Genişliğe Sığdır"
          >
            Genişlik
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleFitPage}
            className="hidden sm:inline-flex h-8 px-2 text-[11px] text-zinc-400 hover:text-zinc-100"
            title="Sayfaya Sığdır"
          >
            Sayfa
          </Button>

          <div className="h-4 w-px bg-zinc-700 mx-0.5" />

          {/* Sayfa Döndürme */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100"
            title="90° Saat Yönünde Döndür"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Arama Çubuğu (Açılır Panel) */}
      {isSearchOpen && (
        <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/95 px-4 py-2 text-xs shadow-md">
          <Search className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <Input
            placeholder="Dokümanda ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-7 w-60 rounded border-zinc-700 bg-zinc-800 text-xs text-zinc-100 focus-visible:ring-amber-500"
          />
          <Button
            size="sm"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="h-7 bg-amber-500 px-3 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
          >
            {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Bul"}
          </Button>

          {searchResults.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-300">
              <span>
                {searchIndex + 1} / {searchResults.length} eşleşme (Sayfa {searchResults[searchIndex]})
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handlePrevSearch}
                className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNextSearch}
                className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !isSearching && (
            <span className="text-[11px] text-zinc-400">Sonuç bulunamadı</span>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSearchOpen(false)}
            className="ml-auto h-6 w-6 p-0 text-zinc-400 hover:text-zinc-100"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Ana Gövde: Sol Thumbnail Sidebar + Canvas Alanı */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Sol Thumbnail Kenar Çubuğu */}
        {isSidebarOpen && (
          <aside className="w-48 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-900/90 p-2 space-y-2">
            <div className="flex items-center justify-between px-1 pb-1 text-[11px] font-semibold text-zinc-400">
              <span>SAYFALAR ({numPages})</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsSidebarOpen(false)}
                className="h-5 w-5 p-0 text-zinc-500 hover:text-zinc-200"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {loadingThumbnails && thumbnails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
                <Loader2 className="h-5 w-5 animate-spin mb-1" />
                <span className="text-[10px]">Önizlemeler yükleniyor...</span>
              </div>
            ) : (
              thumbnails.map((thumbUrl, idx) => {
                const pageNum = idx + 1;
                const isSelected = pageNum === currentPage;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`group relative flex w-full flex-col items-center rounded-lg border p-1.5 transition-all text-center ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 shadow-sm"
                        : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/40"
                    }`}
                  >
                    <img
                      src={thumbUrl}
                      alt={`Sayfa ${pageNum}`}
                      className="max-h-28 w-auto rounded shadow"
                    />
                    <span
                      className={`mt-1 text-[10px] font-medium ${
                        isSelected ? "text-amber-400 font-bold" : "text-zinc-400 group-hover:text-zinc-200"
                      }`}
                    >
                      {pageNum}
                    </span>
                  </button>
                );
              })
            )}
          </aside>
        )}

        {/* Canvas ve PDF Render Alanı */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`relative flex flex-1 items-center justify-center overflow-auto p-4 sm:p-8 ${
            isHandTool ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
          }`}
        >
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
              <span className="text-sm font-medium">PDF dokümanı yükleniyor...</span>
              <span className="text-xs text-zinc-500 mt-1">{displayName}</span>
            </div>
          )}

          {error && (
            <div className="mx-auto max-w-md rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center text-red-400 shadow-xl">
              <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
              <h3 className="text-sm font-bold text-red-300">Doküman Görüntülenemedi</h3>
              <p className="mt-1 text-xs text-zinc-400">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="relative shadow-2xl rounded border border-zinc-800 bg-white transition-transform duration-100">
              <canvas ref={canvasRef} className="block" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
