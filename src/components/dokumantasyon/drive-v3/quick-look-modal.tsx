"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Layers,
  RotateCw,
  Share2,
  Star,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { DokFile } from "@/lib/dokumantasyon/types";
import { FileTypeIcon } from "../file-icons";
import { formatBytes, formatDate } from "../ui-helpers";
import { OverlayPortal } from "./overlay-portal";

export interface QuickLookModalProps {
  isOpen: boolean;
  file: DokFile | null;
  files: DokFile[];
  onClose: () => void;
  onSelectFile: (file: DokFile) => void;
  onDownload: (file: DokFile) => void;
  onShare: (file: DokFile) => void;
  onToggleStar: (file: DokFile) => void;
  onOpenStudio: (fileId: string, cadEngine?: "v2") => void;
}

interface TextPreviewResult {
  fileId: string;
  content: string | null;
  error: string | null;
  truncated: boolean;
}

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "webp", "gif", "svg"]);
const TEXT_EXTS = new Set([
  "md",
  "txt",
  "json",
  "csv",
  "xml",
  "html",
  "css",
  "ts",
  "js",
]);
const CAD_EXTS = new Set(["dwg", "dxf", "dwf"]);
const MAX_TEXT_BYTES = 256 * 1024;

function getCleanExt(file: DokFile): string {
  return (file.extension || "").replace(/^\./, "").toLowerCase();
}

function QuickLookModalBody({
  file,
  files,
  onClose,
  onSelectFile,
  onDownload,
  onShare,
  onToggleStar,
  onOpenStudio,
}: Omit<QuickLookModalProps, "isOpen" | "file"> & { file: DokFile }) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [checkerBg, setCheckerBg] = useState(true);
  const [imgError, setImgError] = useState(false);

  const [textResult, setTextResult] = useState<TextPreviewResult | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const currentIndex = useMemo(() => {
    return files.findIndex((f) => f.id === file.id);
  }, [file.id, files]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < files.length - 1;

  const goPrev = () => {
    if (hasPrev) {
      onSelectFile(files[currentIndex - 1]);
    }
  };

  const goNext = () => {
    if (hasNext) {
      onSelectFile(files[currentIndex + 1]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentIndex > 0) {
          onSelectFile(files[currentIndex - 1]);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (currentIndex >= 0 && currentIndex < files.length - 1) {
          onSelectFile(files[currentIndex + 1]);
        }
      } else if (e.key === " " || e.code === "Space") {
        const activeTag = document.activeElement?.tagName;
        if (
          activeTag !== "BUTTON" &&
          activeTag !== "A" &&
          activeTag !== "INPUT"
        ) {
          e.preventDefault();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, files, onSelectFile, onClose]);

  const ext = getCleanExt(file);
  const isImage = IMAGE_EXTS.has(ext);
  const isText = TEXT_EXTS.has(ext);
  const isPdf = ext === "pdf";
  const isCad = CAD_EXTS.has(ext);

  // Fetch up to 256KB for text/code/markdown files
  useEffect(() => {
    if (!isText) return;
    const controller = new AbortController();

    fetch(`/api/dokumantasyon/files/${file.id}/stream`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const reader = res.body?.getReader();
        if (!reader) {
          const full = await res.text();
          if (!controller.signal.aborted) {
            setTextResult({
              fileId: file.id,
              content:
                full.length > MAX_TEXT_BYTES
                  ? full.slice(0, MAX_TEXT_BYTES)
                  : full,
              error: null,
              truncated: full.length > MAX_TEXT_BYTES,
            });
          }
          return;
        }
        const chunks: Uint8Array[] = [];
        let received = 0;
        let truncated = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            if (received + value.byteLength > MAX_TEXT_BYTES) {
              chunks.push(value.subarray(0, MAX_TEXT_BYTES - received));
              truncated = true;
              await reader.cancel();
              break;
            }
            chunks.push(value);
            received += value.byteLength;
          }
        }
        const merged = new Uint8Array(received);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.byteLength;
        }
        const decoded = new TextDecoder("utf-8", { fatal: false }).decode(
          merged
        );
        if (!controller.signal.aborted) {
          setTextResult({
            fileId: file.id,
            content: decoded,
            error: null,
            truncated,
          });
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setTextResult({
            fileId: file.id,
            content: null,
            error: "Dosya içeriği önizlenemedi.",
            truncated: false,
          });
        }
      });

    return () => controller.abort();
  }, [file.id, isText]);

  const activeText = textResult?.fileId === file.id ? textResult : null;
  const textLoading = isText && textResult?.fileId !== file.id;
  const textContent = activeText?.content ?? null;
  const textError = activeText?.error ?? null;
  const textTruncated = activeText?.truncated ?? false;

  const handleCopyText = async () => {
    if (!textContent) return;
    try {
      await navigator.clipboard.writeText(textContent);
      setCopiedText(true);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setCopiedText(false);
        copyTimerRef.current = null;
      }, 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  const isStarred = Boolean(file.starred_at);
  const streamUrl = `/api/dokumantasyon/files/${file.id}/stream`;

  return (
    <div
      data-testid="dok-dialog-content"
      className="flex h-[82vh] w-full max-w-5xl flex-col overflow-hidden bg-card text-card-foreground"
    >
      {/* Üst Çubuk */}
      <div
        data-testid="dok-quick-look-modal"
        className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-secondary/30 px-4 py-3 pr-12"
      >
        <div className="flex min-w-0 items-center gap-3">
          <FileTypeIcon
            extension={file.extension}
            mimeType={file.mime_type}
            size="list"
          />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-foreground">
              {file.display_name}
            </h2>
            <p className="text-[11px] text-muted-foreground font-mono">
              {ext.toUpperCase() || "DOSYA"} · {formatBytes(Number(file.size_bytes))} ·{" "}
              {formatDate(file.updated_at || file.created_at)}
              {files.length > 0 && currentIndex >= 0
                ? ` · ${currentIndex + 1} / ${files.length}`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggleStar(file)}
            aria-label={isStarred ? "Yıldızı Kaldır" : "Yıldızla"}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/80 bg-background/70 px-2.5 text-xs font-medium hover:bg-secondary"
          >
            <Star
              className={`h-3.5 w-3.5 ${
                isStarred ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
              }`}
            />
            <span className="hidden sm:inline">
              {isStarred ? "Yıldızlı" : "Yıldızla"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onShare(file)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/80 bg-background/70 px-2.5 text-xs font-medium hover:bg-secondary"
          >
            <Share2 className="h-3.5 w-3.5 text-amber-500" />
            <span className="hidden sm:inline">Paylaş</span>
          </button>

          <button
            type="button"
            onClick={() => onDownload(file)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 text-xs font-medium text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">İndir</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenStudio(file.id)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-bold text-zinc-950 hover:bg-amber-400"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>{isPdf ? "PDF Stüdyo'da Aç" : "Tam Stüdyoda Aç"}</span>
          </button>
        </div>
      </div>

      {/* Ana Önizleme Alanı */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-background/50">
        {/* Sol Galeri Oku */}
        <button
          type="button"
          data-testid="dok-quick-look-prev"
          onClick={goPrev}
          disabled={!hasPrev}
          aria-label="Önceki dosya"
          className="absolute left-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-card/90 text-foreground shadow-lg backdrop-blur-md transition-opacity hover:bg-secondary disabled:pointer-events-none disabled:opacity-25"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Sağ Galeri Oku */}
        <button
          type="button"
          data-testid="dok-quick-look-next"
          onClick={goNext}
          disabled={!hasNext}
          aria-label="Sonraki dosya"
          className="absolute right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-card/90 text-foreground shadow-lg backdrop-blur-md transition-opacity hover:bg-secondary disabled:pointer-events-none disabled:opacity-25"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* 1. Görsel Önizleme */}
        {isImage && !imgError && (
          <div className="flex h-full w-full flex-col">
            <div className="flex flex-1 items-center justify-center overflow-auto p-6">
              <div
                className={`flex items-center justify-center rounded-xl p-4 transition-colors ${
                  checkerBg
                    ? "bg-[radial-gradient(#80808033_1px,transparent_1px)] [background-size:16px_16px]"
                    : "bg-zinc-950/90"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={streamUrl}
                  alt={file.display_name}
                  onError={() => setImgError(true)}
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: "transform 0.15s ease",
                  }}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-lg"
                />
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-center gap-2 border-t border-border/60 bg-card/80 px-4 py-2 text-xs">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(25, z - 25))}
                aria-label="Uzaklaştır"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 hover:bg-secondary"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[44px] text-center font-mono font-semibold">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(300, z + 25))}
                aria-label="Yakınlaştır"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 hover:bg-secondary"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(100);
                  setRotation(0);
                }}
                className="h-8 rounded-lg border border-border/70 px-2.5 font-mono text-[11px] hover:bg-secondary"
              >
                1:1
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                aria-label="90 derece döndür"
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 px-2.5 hover:bg-secondary"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>90°</span>
              </button>
              <button
                type="button"
                onClick={() => setCheckerBg((v) => !v)}
                className="h-8 rounded-lg border border-border/70 px-2.5 text-[11px] hover:bg-secondary"
              >
                {checkerBg ? "Koyu Zemin" : "Damalı Zemin"}
              </button>
            </div>
          </div>
        )}

        {/* 2. Metin / Markdown / Kod / JSON */}
        {isText && (
          <div className="flex h-full w-full flex-col p-4 sm:px-14">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-mono">
                {textTruncated
                  ? "İlk 256 KB gösteriliyor"
                  : "Salt okunur metin önizleme"}
              </span>
              {textContent !== null && (
                <button
                  type="button"
                  onClick={() => void handleCopyText()}
                  className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border/80 bg-card px-2.5 text-xs font-medium hover:bg-secondary"
                >
                  {copiedText ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>İçeriği Kopyala</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border/70 bg-background/80 p-4">
              {textLoading ? (
                <p className="text-xs text-muted-foreground">
                  İçerik yükleniyor...
                </p>
              ) : textError ? (
                <p className="text-xs text-red-500">{textError}</p>
              ) : (
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground">
                  {textContent}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* 3. PDF Önizleme */}
        {isPdf && (
          <div className="h-full w-full p-2 sm:px-14 sm:py-4">
            <iframe
              src={`${streamUrl}#view=FitH`}
              title={file.display_name}
              className="h-full w-full rounded-xl border border-border/70 bg-white"
            />
          </div>
        )}

        {/* 4. AutoCAD / DWG / DXF / DWF (Sıfır CAD Motor Dokunuşu) */}
        {isCad && (
          <div className="flex max-w-md flex-col items-center rounded-2xl border border-border/80 bg-card/90 p-6 text-center shadow-xl">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10">
              <FileTypeIcon
                extension={file.extension}
                mimeType={file.mime_type}
                size={72}
              />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {file.display_name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {ext.toUpperCase()} Teknik Çizim ·{" "}
              {formatBytes(Number(file.size_bytes))}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Çizim katmanları, ölçüm ve OSNAP araçları için dosyayı CAD
              Stüdyosu&apos;nda açın.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onOpenStudio(file.id)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-bold text-zinc-950 hover:bg-amber-400"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>CAD Studio&apos;da Aç</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenStudio(file.id, "v2")}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 text-xs font-semibold text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>V2 Motor ile Aç</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. Diğer / Arşiv / Fallback */}
        {(!isImage || imgError) && !isText && !isPdf && !isCad && (
          <div className="flex max-w-md flex-col items-center rounded-2xl border border-border/80 bg-card/90 p-6 text-center shadow-xl">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border border-border/70 bg-secondary/40">
              <FileTypeIcon
                extension={file.extension}
                mimeType={file.mime_type}
                size={72}
              />
            </div>
            <h3 className="text-sm font-bold text-foreground">
              {file.display_name}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground font-mono">
              {ext.toUpperCase() || "DOSYA"} ·{" "}
              {formatBytes(Number(file.size_bytes))}
            </p>
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDownload(file)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-bold text-zinc-950 hover:bg-amber-400"
              >
                <Download className="h-3.5 w-3.5" />
                <span>İndir</span>
              </button>
              <button
                type="button"
                onClick={() => onShare(file)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-4 text-xs font-medium hover:bg-secondary"
              >
                <Share2 className="h-3.5 w-3.5 text-amber-500" />
                <span>Paylaş</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function QuickLookModal({
  isOpen,
  file,
  files,
  onClose,
  onSelectFile,
  onDownload,
  onShare,
  onToggleStar,
  onOpenStudio,
}: QuickLookModalProps) {
  return (
    <OverlayPortal
      isOpen={isOpen && Boolean(file)}
      onClose={onClose}
      title={file ? `Hızlı Bakış: ${file.display_name}` : "Hızlı Bakış"}
      presentation="dialog"
      size="wide"
    >
      {isOpen && file && (
        <QuickLookModalBody
          key={file.id}
          file={file}
          files={files}
          onClose={onClose}
          onSelectFile={onSelectFile}
          onDownload={onDownload}
          onShare={onShare}
          onToggleStar={onToggleStar}
          onOpenStudio={onOpenStudio}
        />
      )}
    </OverlayPortal>
  );
}
