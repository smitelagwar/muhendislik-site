"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  AlertCircle,
  Clock,
  Ban,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import {
  PDFJS_CMAPS,
  PDFJS_FONTS,
  PDFJS_ICCS,
  PDFJS_WASM,
} from "@/lib/pdfjs-paths";
import {
  getSharedBrowserPdfWorker,
  loadBrowserPdfJs,
  type BrowserPdfJs,
} from "@/lib/pdfjs-client";
import type { PDFDocumentProxy } from "pdfjs-dist";

interface BelgeShareViewerProps {
  viewToken: string;
  documentTitle?: string;
  initialExpiresAt?: string;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const ZOOM_STEP = 0.15;

export function BelgeShareViewer({
  viewToken,
  documentTitle = "Paylaşılan PDF Belgesi",
}: BelgeShareViewerProps) {
  const [retryCount, setRetryCount] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<
    "expired" | "revoked" | "not_found" | "error" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<{ cancel: () => void; promise: Promise<void> } | null>(null);

  // 1. PDF Verisini İstemciye Çekme ve PDF.js Başlatma
  useEffect(() => {
    let cancelled = false;

    async function fetchAndInitPdf() {
      try {
        const response = await fetch(`/api/belgeler/paylasim/${viewToken}/pdf`, {
          cache: "no-store",
        });

        if (cancelled) return;

        if (!response.ok) {
          if (response.status === 410) {
            const text = await response.text();
            if (cancelled) return;
            setErrorStatus(text.includes("iptal") ? "revoked" : "expired");
            setIsLoading(false);
            return;
          }

          if (response.status === 404) {
            setErrorStatus("not_found");
            setIsLoading(false);
            return;
          }

          throw new Error(`HTTP ${response.status}: Belge yüklenemedi.`);
        }

        const buffer = await response.arrayBuffer();
        if (cancelled) return;

        const pdfBytes = new Uint8Array(buffer);
        const pdfjs = await loadBrowserPdfJs();
        if (!pdfjs) throw new Error("PDF görüntüleyicisi başlatılamadı.");
        if (cancelled) return;

        const worker = await getSharedBrowserPdfWorker(pdfjs);
        if (cancelled) return;

        const docParams: Parameters<BrowserPdfJs["getDocument"]>[0] & {
          isEvalSupported?: boolean;
        } = {
          data: pdfBytes,
          cMapUrl: PDFJS_CMAPS,
          standardFontDataUrl: PDFJS_FONTS,
          wasmUrl: PDFJS_WASM,
          iccUrl: PDFJS_ICCS,
          cMapPacked: true,
          isEvalSupported: false,
        };

        if (worker) {
          (docParams as { worker?: unknown }).worker = worker;
        }

        const loadingTask = pdfjs.getDocument(docParams);
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        pdfDocRef.current = pdf;
        setPageCount(pdf.numPages);
        setCurrentPage(1);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("PDF görüntüleyici yükleme hatası:", err);
        setErrorStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Belge yüklenirken bir sorun oluştu."
        );
        setIsLoading(false);
      }
    }

    void fetchAndInitPdf();

    return () => {
      cancelled = true;
    };
  }, [viewToken, retryCount]);

  // 2. Sayfayı Canvas Üzerine Çizdirme
  const renderCurrentPage = useCallback(async () => {
    const pdf = pdfDocRef.current;
    const canvas = canvasRef.current;
    if (!pdf || !canvas) return;

    try {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const page = await pdf.getPage(currentPage);
      const viewport = page.getViewport({ scale: scale * window.devicePixelRatio });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / window.devicePixelRatio}px`;
      canvas.style.height = `${viewport.height / window.devicePixelRatio}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const renderContext = {
        canvasContext: ctx,
        viewport,
        canvas,
      };

      const task = page.render(renderContext);
      renderTaskRef.current = task;
      await task.promise;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "name" in err && (err as { name: string }).name === "RenderingCancelledException") {
        return; // Sayfa veya zoom değiştiğinde önceki render iptali normaldir
      }
      console.warn("Sayfa render uyarısı:", err);
    }
  }, [currentPage, scale]);

  useEffect(() => {
    if (!isLoading && !errorStatus) {
      void renderCurrentPage();
    }
  }, [isLoading, errorStatus, renderCurrentPage]);

  // 3. Yazdırma / Kaydetme Kısayollarını Engelleme (UX Savunması)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "s")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  // 4. Zoom Eylemleri
  const handleZoomIn = () => {
    setScale((prev) => Math.min(ZOOM_MAX, Number((prev + ZOOM_STEP).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(ZOOM_MIN, Number((prev - ZOOM_STEP).toFixed(2))));
  };

  const handleFitWidth = () => {
    if (!containerRef.current || !canvasRef.current) {
      setScale(1.0);
      return;
    }
    const containerWidth = containerRef.current.clientWidth - 32;
    const baseWidth = 595.28; // Standart A4 pt genişliği
    const calculated = containerWidth / baseWidth;
    setScale(Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Number(calculated.toFixed(2)))));
  };

  // 5. Hata ve Geçersiz Durum Ekranları
  if (errorStatus) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-xl space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-500">
            {errorStatus === "expired" ? (
              <Clock className="h-7 w-7 text-amber-500" />
            ) : errorStatus === "revoked" ? (
              <Ban className="h-7 w-7 text-red-500" />
            ) : errorStatus === "not_found" ? (
              <AlertCircle className="h-7 w-7 text-neutral-400" />
            ) : (
              <RefreshCw className="h-7 w-7 text-red-500" />
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-bold text-foreground">
              {errorStatus === "expired"
                ? "Bağlantının Süresi Doldu"
                : errorStatus === "revoked"
                ? "Bağlantı İptal Edildi"
                : errorStatus === "not_found"
                ? "Belge Bulunamadı"
                : "Belge Yüklenemedi"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {errorStatus === "expired"
                ? "Bu paylaşım bağlantısının 90 günlük geçerlilik süresi dolmuştur. Yeni bir bağlantı için belgeyi oluşturan kişiyle iletişime geçiniz."
                : errorStatus === "revoked"
                ? "Bu paylaşım bağlantısı belgeyi oluşturan kişi tarafından iptal edilmiştir ve artık erişilemez."
                : errorStatus === "not_found"
                ? "Görüntülemek istediğiniz belge bağlantısı geçerli değil veya silinmiş."
                : errorMessage || "Belge açılırken bir ağ hatası oluştu."}
            </p>
          </div>

          {errorStatus === "error" && (
            <button
              onClick={() => {
                setIsLoading(true);
                setErrorStatus(null);
                setRetryCount((c) => c + 1);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
              Yeniden Dene
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-neutral-900 text-neutral-100 antialiased select-none">
      {/* Üst Salt-Okunur Araç Çubuğu */}
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950/80 px-3 sm:px-5 backdrop-blur-md z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-amber-400">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="truncate text-xs sm:text-sm font-semibold text-neutral-200">
              {documentTitle}
            </h1>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-neutral-400">
              <span className="inline-flex items-center gap-1 rounded bg-neutral-800/80 px-1.5 py-0.5 text-neutral-300">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                Salt Okunur
              </span>
              <span className="hidden sm:inline-block text-neutral-500">•</span>
              <span className="hidden sm:inline-block text-neutral-400">90 Gün Geçerli</span>
            </div>
          </div>
        </div>

        {/* Sayfa Gezintisi (Eğer çok sayfalıysa) */}
        {pageCount > 1 && (
          <div className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-1.5 py-1 text-xs">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded p-1 text-neutral-300 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Önceki Sayfa"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1 text-neutral-400 text-[11px] font-mono">
              {currentPage} / {pageCount}
            </span>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
              className="rounded p-1 text-neutral-300 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Sonraki Sayfa"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Zoom Kontrolleri */}
        <div className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 p-1 text-xs">
          <button
            onClick={handleZoomOut}
            disabled={scale <= ZOOM_MIN}
            className="rounded p-1 text-neutral-300 hover:bg-neutral-800 disabled:opacity-30"
            title="Uzaklaştır"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[44px] text-center font-mono text-[11px] text-neutral-300">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= ZOOM_MAX}
            className="rounded p-1 text-neutral-300 hover:bg-neutral-800 disabled:opacity-30"
            title="Yakınlaştır"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleFitWidth}
            className="hidden sm:inline-flex rounded p-1 text-neutral-300 hover:bg-neutral-800"
            title="Genişliğe Sığdır"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Belge Görüntüleme Alanı */}
      <main
        ref={containerRef}
        className="relative flex-1 overflow-auto p-4 flex items-center justify-center bg-neutral-900/90"
      >
        {isLoading && (
          <div className="flex flex-col items-center gap-3 text-neutral-400">
            <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
            <p className="text-sm font-medium">Belge yükleniyor...</p>
          </div>
        )}

        <div className={`transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"}`}>
          <canvas
            ref={canvasRef}
            className="rounded shadow-2xl bg-white border border-neutral-800/80 max-w-full"
          />
        </div>
      </main>
    </div>
  );
}
